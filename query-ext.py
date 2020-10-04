#!/usr/bin/env python3

"""
Query an installed extension.

Format configuration (-F, --fconfig): Use -F to specify custom formatting
configuration. The syntax is as follows:
    key=<number>        Set key to the value of <number>
    key                 Set key to the value True
    key=True            Set key to the value True
    !key                Set key to the value False
    key=                Set key to the value False
    key=False           Set key to the value False
    key=None            Set key to the value None
    key=<string>        Set key to the value <string>
The value is treated as a string only when parsing <number>, "True", "False",
and "None" fail.

Format configuration values:
    -F maxdepth=<N>     Stop formatting after <N> recursions
    -F !oneline         Output results using multiple lines
    -F oneline=False    As above
    -F indent=<N>       Indent results using <N> spaces
    -F indentstr="<S>"  Indent using string <S> instead of " "
"""

import argparse
import dbus
import json
import logging
import os
import sys
import time

logging.basicConfig(format="%(module)s:%(lineno)s: %(levelname)s: %(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)

EXT = "example@kaedenn.net"
BUS_OBJ = 'org.gnome.Shell.Extensions'
BUS_PATH = '/org/gnome/Shell/Extensions'

DBUS_INT_ATTR = {
    # <type>: (<name>, <num_bytes>, <unsigned>)
    dbus.Int16: ("Int16", 2, False),
    dbus.Int32: ("Int32", 4, False),
    dbus.Int64: ("Int64", 8, False),
    dbus.UInt16: ("UInt16", 2, True),
    dbus.UInt32: ("UInt16", 4, True),
    dbus.UInt64: ("UInt16", 8, True),
}

def _format_dbus_obj(obj, depth=0, maxdepth=None, oneline=True, indent=2, indentstr=" "):
    "Recursively format a DBUS object with the given rules"
    I = lambda n=0: "" if oneline else indentstr * ((depth + n) * indent)
    NL = "" if oneline else "\n"
    fkws = dict(depth=depth+1, maxdepth=maxdepth, oneline=oneline,
                indent=indent, indentstr=indentstr)
    if maxdepth is not None and depth >= maxdepth:
        return "..."
    if isinstance(obj, dbus.Array):
        ifmt = I(1) + "{}"
        items = [ifmt.format(_format_dbus_obj(e, **fkws)) for e in obj]
        head = "Array[{}]{{".format(len(items)) + NL
        tail = NL + I() + "}"
        join = ", " if oneline else ",\n"
        body = join.join(items)
        return head + body + tail
    elif isinstance(obj, dbus.Boolean):
        return "(Boolean){}".format("True" if obj else "False")
    elif isinstance(obj, dbus.Byte):
        return "(Byte){:x}".format(obj)
    elif isinstance(obj, dbus.ByteArray):
        data = " ".join("{:02x}".format(i) for i in obj)
        return "(ByteArray)[{}]({})".format(len(obj), data)
    elif isinstance(obj, dbus.Dictionary):
        ifmt = I(1) + ("{}={}" if oneline else "{} = {}")
        items = [ifmt.format(k, _format_dbus_obj(v, **fkws)) for k,v in obj.items()]
        head = "Dictionary[{}]{{".format(len(obj)) + NL
        tail = NL + I() + "}"
        join = ", " if oneline else ",\n"
        body = join.join(items)
        return head + body + tail
    elif isinstance(obj, dbus.Double):
        return "(Double){}".format(obj)
    elif any(isinstance(obj, dtype) for dtype in DBUS_INT_ATTR):
        obj_type = [dtype for dtype in DBUS_INT_ATTR if isinstance(obj, dtype)][0]
        tname, tsize, tunsigned = DBUS_INT_ATTR[obj_type]
        vfmt = "({})0x{" + ":0{}x".format(tsize*2) + "}"
        return vfmt.format(tname, obj)
    elif isinstance(obj, dbus.Int32):
        return "(Int32)0x{:08x}".format(obj)
    elif isinstance(obj, dbus.Int64):
        return "(Int64)0x{:016x}".format(obj)
    elif isinstance(obj, dbus.UInt16):
        return "(UInt16)0x{:04x}".format(obj)
    elif isinstance(obj, dbus.UInt32):
        return "(UInt32)0x{:08x}".format(obj)
    elif isinstance(obj, dbus.UInt64):
        return "(UInt64)0x{:016x}".format(obj)
    elif isinstance(obj, dbus.ObjectPath):
        return "(ObjectPath){!r}".format(obj)
    elif isinstance(obj, dbus.Signature):
        return "(Signature){!r}".format(obj)
    elif isinstance(obj, dbus.String):
        return "String[{}]({!r})".format(len(obj), str(obj))
    elif isinstance(obj, dbus.Struct):
        return "(Struct){!r}".format(obj)
    elif isinstance(obj, dbus.UnixFd):
        return "(UnixFd){!r}".format(obj)
    else:
        return "(Unknown){}".format(obj)

def _debug_call(fname, fargs, fkwargs):
    "Format the function call as a string"
    args = [repr(i) for i in fargs]
    args.extend("{}={!r}".format(k, v) for k,v in fkwargs.items())
    return "{}({})".format(fname, ", ".join(args))

def _get_method_name(func):
    "Try to get the name of a dbus proxy function"
    if hasattr(func, "_method_name"):
        return func._method_name
    return str(func)

def connect(system=False):
    "Connect to DBUS"
    return dbus.SystemBus() if system else dbus.SessionBus()

def call(proxy_func, *args, **kwargs):
    "Call a DBUS proxy function"
    fkwargs = {}
    fkwargs.update(kwargs)
    if "dbus_interface" not in kwargs:
        fkwargs["dbus_interface"] = BUS_OBJ
    fname = "{}.{}".format(BUS_OBJ, _get_method_name(proxy_func))
    fcall = _debug_call(fname, args, kwargs)
    try:
        result = proxy_func(*args, **fkwargs)
    except Exception as e:
        logger.debug("Error calling {}: {}".format(fcall, e))
        raise
    return result

def main():
    ap = argparse.ArgumentParser(epilog="""
Queries the shell for information about an installed extension. This program
invokes both GetExtensionInfo and GetExtensionErrors from the {OBJ} DBUS object
and displays the results of each. See the {file} module docstring for an
explanation of -F,--fconfig and the permitted configuration values.
""".format(OBJ=BUS_OBJ, file=__file__))
    ap.add_argument("-u", "--uuid", default=EXT,
        help="extension UUID (default: %(default)s)")
    ap.add_argument("-j", "--json", action="store_true",
        help="output JSON instead of the dbus object representation")
    ap.add_argument("-f", "--format", action="store_true",
        help="output result with formatting")
    ap.add_argument("-F", "--fconfig", action="append", metavar="KEY=VAL",
        help="configure -f,--format options")
    ap.add_argument("--system", action="store_true",
        help="use system bus instead of session bus")
    ap.add_argument("-s", "--sleep", type=int, default=0,
        help="sleep for %(metavar)s seconds before running (default: none)")
    ap.add_argument("-v", "--verbose", action="store_true",
        help="be verbose with output")
    args = ap.parse_args()
    if args.verbose:
        logger.setLevel(logging.DEBUG)

    # Parse -F,--fconfig
    fconfig = {}
    cfg_entries = []
    if args.fconfig is not None:
        if not args.format:
            # User probably forgot to pass -f,--format
            args.format = True
        for cfg in args.fconfig:
            if "," in cfg:
                cfg_entries.extend(cfg.split(","))
            else:
                cfg_entries.append(cfg)
    for cfg in cfg_entries:
        if "=" in cfg:
            k, v = cfg.split("=", 1)
        elif cfg.startswith("!"):
            k, v = cfg[1:], "False"
        else:
            k, v = cfg, "True"
        if k.startswith("!"):
            k = k[1:]
            v = "False"
        if len(v) == 0:
            v = False
        elif v.isdigit():
            v = int(v)
        elif v in ("True", "False"):
            v = True if v == "True" else False
        elif v == "None":
            v = None
        fconfig[k] = v
    if "indent" in fconfig and "oneline" not in fconfig:
        # User probably intended to pass -F oneline=False
        fconfig["oneline"] = False
    elif "indent" in fconfig and fconfig["oneline"]:
        logger.warning("Forcing single-line output despite indent config")
    logger.debug("Format config: {!r}".format(fconfig))

    def print_resp(resp, resp_name=None):
        if resp_name is not None:
            sys.stderr.write(resp_name)
            sys.stderr.write("\n")
        if args.json:
            print(json.dumps(resp, sort_keys=True, indent=2))
        else:
            print(_format_dbus_obj(resp, **fconfig))

    if args.sleep is not None and args.sleep > 0:
        logger.info("Sleeping for {} second{}".format(args.sleep, "s" if args.sleep != 1 else ""))
        time.sleep(args.sleep)

    bus = connect(args.system)
    proxy = bus.get_object(BUS_OBJ, BUS_PATH)
    logger.debug(_debug_call("GetExtensionInfo", [args.uuid], {}))
    print_resp(call(proxy.GetExtensionInfo, args.uuid),
            resp_name="{}: Info:".format(args.uuid))
    logger.debug(_debug_call("GetExtensionErrors", [args.uuid], {}))
    print_resp(call(proxy.GetExtensionErrors, args.uuid),
            resp_name="{}: Errors:".format(args.uuid))

if __name__ == "__main__":
    main()

