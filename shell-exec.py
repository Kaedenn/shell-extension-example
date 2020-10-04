#!/usr/bin/env python3

"""
Execute GJS scripts inside of the Gnome Shell.

There are several primary modes of execution:
    1) Executing a .js file specified on the command-line
    2) Inspecting an expression with -e,--expr
    3) Inspecting an expression directly with -i,--inspect-expr
    4) Printing an expression with -p,--print-expr
    5) Listing an expression's attributes with -l,--list-expr

If the LIBEXEC_SCRIPT script exists, then it is executed before the requested
script(s). This defaults to "lib/exec.js". You can override this by changing
the LIBEXEC_SCRIPT environment variable or disable it entirely by setting
LIBEXEC_SCRIPT to an empty string.

Use -c to pass configuration options to the LIBEXEC_SCRIPT. These options can
have one of the following formats:
    KEY             Set CONF["KEY"] = true
    KEY=VALUE       Set CONF["KEY"] = "VALUE"
    KEY:=VALUE      Set CONF["KEY"] = <VALUE> parsed as a Python object
Regarding the KEY:=VALUE syntax, the value must be some kind of valid Python
literal. Anything that can be parsed via ast.literal_eval can be used. For
example, to set the key "list" to the array [1, 2, 'foo'], use:
    -c "list:=[1,2,'foo']"

If using -e and inspecting imports.ui.main.panel and you get either of the
following linker errors,
    undefined symbol: clutter_actor_pop_internal
    undefined symbol: clutter_actor_push_internal
then try passing the following arguments to the command-line:
    -c "exclude:=['pop_internal','push_internal']"
"""

import argparse
import ast
import dbus
import json
import logging
import os
import sys

from lib import dbusutil

logging.basicConfig(format="%(module)s:%(lineno)s: %(levelname)s: %(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)

BUS_OBJ = 'org.gnome.Shell'
BUS_PATH = '/org/gnome/Shell'

LIBEXEC_SCRIPT = os.environ.get("LIBEXEC_SCRIPT", "lib/exec.js")

def _jscall(expr, **kwargs):
    js = r"(function() { return <EXPR>; })();".replace("<EXPR>", expr)
    for k,v in kwargs.items():
        js = js.replace("<{}>".format(k), v)
    return js

def build_script(script, **config):
    result = []

    if len(LIBEXEC_SCRIPT) > 0 and os.path.exists(LIBEXEC_SCRIPT):
        cfg_obj = json.dumps(config)
        with open(LIBEXEC_SCRIPT, "rt") as exec_fobj:
            result.append(exec_fobj.read())
        result.append(_jscall("_merge_conf(<C>)", C=cfg_obj))
        if "tty" not in config:
            tty_obj = json.dumps({"tty": os.ttyname(sys.stdout.fileno())})
            result.append(_jscall("_merge_conf(<C>)", C=tty_obj))

    result.append(script)

    return "\n".join(result)

def run_script(proxy, script, config=None):
    """Run a script (given as a string) using the provided proxy object. If
    the LIBEXEC_SCRIPT file exists, then that script is prepended to the
    given script. Otherwise, only the given script is ran.
    """
    build_kws = config if config is not None else {}
    full_script = build_script(script, **build_kws)
    logger.debug("Running script:")
    logger.debug(full_script)
    resp = dbusutil.call(proxy.Eval, full_script,
            dbus_interface=proxy.requested_bus_name)
    success, response = resp[0], resp[1]
    return success, response

def get_inspect_object_script(expr):
    "Create a script that inspects the expression. Requires libexec script."
    return _jscall(r"_escape(`<EXPR>`) + `:\n  ${_get_members(<EXPR>).join('\n  ')}`",
            EXPR=expr);

def get_inspect_script(expr):
    "Create a script that inspects the expression. Requires libexec script."
    return _jscall(r"_escape(`<EXPR>`) + `:\n  ${_inspect_value(<EXPR>)}`", EXPR=expr)

def get_print_script(expr):
    "Create a script that prints the expression"
    return _jscall(r"_escape(`<EXPR>`) + `:\n  ${<EXPR>}`", EXPR=expr)

def get_list_script(expr):
    """Create a script that prints the members of the expression. Requires
    libexec script."""
    return _jscall(r"_list_object(<EXPR>).map((e) => `<EXPR>.${e}`).join('\n')",
            EXPR=expr)

def get_run_script(expr):
    "Create a script that just runs the expression"
    return _jscall(r"<EXPR>", EXPR=expr)

def main():
    ap = argparse.ArgumentParser(epilog="""
Configuration options are set by calling _merge_conf before executing the
desired scripts. Configuration options are stored in a CONF global variable.
For a list of known configuration options, see the comment near the top of
lib/exec.js. See this module's docstring for an explanation of this syntax""")
    ap.add_argument("file", nargs="*", help="script(s) to run")
    ap.add_argument("-a", "--all", action="store_true",
        help="concatenate all scripts together")
    ap.add_argument("-e", "--expr", metavar="EXPR",
        help="inspect an expression and its children")
    ap.add_argument("-i", "--inspect-expr", metavar="EXPR",
        help="inspect an expression")
    ap.add_argument("-p", "--print-expr", metavar="EXPR",
        help="print an expression")
    ap.add_argument("-l", "--list-expr", metavar="EXPR",
        help="list members of an expression")
    ap.add_argument("-r", "--run-expr", metavar="EXPR",
        help="run an expression")
    ap.add_argument("-q", "--quiet", action="store_true",
        help="do not print response from script")
    ap.add_argument("-c", "--config", action="append", metavar="EXPR",
        help="pass extra configuration to the invoked scripts")
    ap.add_argument("-v", "--verbose", action="store_true",
        help="be verbose with output")

    ag = ap.add_argument_group("message bus options")
    ag.add_argument("--system", action="store_true",
        help="use system bus instead of session bus")
    ag.add_argument("--dbus-object", metavar="OBJ", default=BUS_OBJ,
        help="message bus object (default: %(default)s)")
    ag.add_argument("--dbus-path", metavar="PATH", default=BUS_PATH,
        help="message bus path (default: %(default)s)")
    args = ap.parse_args()
    if args.verbose:
        logger.setLevel(logging.DEBUG)

    # Connect to DBUS
    if args.system:
        bus = dbus.SystemBus()
    else:
        bus = dbus.SessionBus()
    proxy = bus.get_object(args.dbus_object, args.dbus_path)

    # Get all the scripts to run
    scripts = []
    if args.file is not None:
        for sfile in args.file:
            with open(sfile, "rt") as sfobj:
                scripts.append(sfobj.read())
    if args.expr is not None:
        scripts.append(get_inspect_object_script(args.expr))
    if args.inspect_expr is not None:
        scripts.append(get_inspect_script(args.inspect_expr))
    if args.print_expr is not None:
        scripts.append(get_print_script(args.print_expr))
    if args.list_expr:
        scripts.append(get_list_script(args.list_expr))
    if args.run_expr:
        scripts.append(get_run_script(args.run_expr))
    if len(scripts) == 0:
        ap.error("No scripts to run")

    # Determine what configuration (if any) we should include
    config = {}
    if args.config is not None:
        for cpair in args.config:
            ckey, cval = cpair, True
            if ":=" in cpair:
                ckey, cval = cpair.split(":=", 1)
                cval = ast.literal_eval(cval)
            elif "=" in cpair:
                ckey, cval = cpair.split("=", 1)
            config[ckey] = cval
    logger.debug("Parsed configuration {}".format(config))

    if args.all:
        scripts = ["\n".join(scripts)]

    # Execute the scripts
    for script in scripts:
        logger.debug("Running script {!r}".format(script))
        success, response = run_script(proxy, script, config)
        logger.debug("Response: {!r}".format(response))
        if success:
            try:
                resp = ast.literal_eval(response)
            except (SyntaxError, ValueError) as e:
                logger.debug("Error parsing response: {}".format(e))
                resp = repr(response)
            if resp and not args.quiet:
                print(resp)
        else:
            logger.error("Error running script!")
            print(response)

if __name__ == "__main__":
    main()

