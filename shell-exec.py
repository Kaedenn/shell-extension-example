#!/usr/bin/env python3

"""
Execute GJS scripts inside of the Gnome Shell.

There are three primary modes of execution:
    1) Executing a .js file specified on the command-line
    2) Inspecting an expression with -e,--expr
    3) Printing an expression with -p,--print-expr

In all cases, a default script is prepended to the script before executing.
This default script is "lib/exec.js". You can override this script by changing
the LIBEXEC_SCRIPT environment variable.

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

def build_script(script, **config):
    result = []

    if len(LIBEXEC_SCRIPT) > 0 and os.path.exists(LIBEXEC_SCRIPT):
        cfg_obj = json.dumps(config)
        with open(LIBEXEC_SCRIPT, "rt") as exec_fobj:
            result.append(exec_fobj.read())
        result.append(r"(function() { _merge_conf(<C>); })();".replace("<C>", cfg_obj))

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

def get_inspect_script(expr):
    "Create a script that inspects the expression. Requires libexec script."
    return r"""
(function() {
    return `<EXPR>:\n  ${_get_members(<EXPR>).join("\n  ")}`;
})();
""".replace("<EXPR>", expr)

def get_print_script(expr):
    "Create a script that prints the expression"
    return r"""
(function() {
    return `<EXPR>:\n  ${<EXPR>}`;
})();
""".replace("<EXPR>", expr)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("file", nargs="*", help="script(s) to run")
    ap.add_argument("-e", "--expr", help="inspect an expression")
    ap.add_argument("-p", "--print-expr", help="print an expression")
    ap.add_argument("--system", action="store_true",
        help="use system bus instead of session bus")
    ap.add_argument("-c", "--config", action="append", metavar="KEY=VAL",
        help="pass extra configuration to the invoked scripts")
    ap.add_argument("-v", "--verbose", action="store_true",
        help="be verbose with output")
    args = ap.parse_args()
    if args.verbose:
        logger.setLevel(logging.DEBUG)

    # Connect to DBUS
    if args.system:
        bus = dbus.SystemBus()
    else:
        bus = dbus.SessionBus()
    proxy = bus.get_object(BUS_OBJ, BUS_PATH)

    # Get all the scripts to run
    scripts = []
    if args.file is not None:
        for sfile in args.file:
            with open(sfile, "rt") as sfobj:
                scripts.append(sfobj.read())
    if args.expr is not None:
        scripts.append(get_inspect_script(args.expr))
    if args.print_expr is not None:
        scripts.append(get_print_script(args.print_expr))
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

    # Execute the scripts
    for script in scripts:
        logger.debug("Running script {!r}".format(script))
        success, response = run_script(proxy, script, config)
        if success:
            try:
                print(ast.literal_eval(response))
            except ValueError as e:
                logger.debug("Error parsing response: {}".format(e))
                print(response)
        else:
            logger.error("Error running script!")
            print(response)

if __name__ == "__main__":
    main()

