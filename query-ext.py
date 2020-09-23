#!/usr/bin/env python3

import argparse
import dbus
import json
import logging
import os
import sys

from lib import dbusutil

logging.basicConfig(format="%(module)s:%(lineno)s: %(levelname)s: %(message)s", level=logging.INFO)
logger = logging.getLogger(__name__)

EXT = "example@kaedenn.net"
BUS_OBJ = 'org.gnome.Shell.Extensions'
BUS_PATH = "/" + BUS_OBJ.replace(".", "/")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("-u", "--uuid", default=EXT,
        help="extension UUID (default: %(default)s)")
    ap.add_argument("-o", "--object", metavar="OBJ", default=BUS_OBJ,
        help="dbus object (default: %(default)s)")
    ap.add_argument("-p", "--path", metavar="OBJ", default=BUS_PATH,
        help="dbus path (default: %(default)s)")
    ap.add_argument("-i", "--info", action="store_true",
        help="print extension info")
    ap.add_argument("-e", "--errors", action="store_true",
        help="print extension errors")
    ap.add_argument("-j", "--json", action="store_true",
        help="output JSON instead of the dbus object representation")
    ap.add_argument("--system", action="store_true",
        help="use system bus instead of session bus")
    ap.add_argument("-v", "--verbose", action="store_true",
        help="be verbose with output")
    args = ap.parse_args()
    if args.verbose:
        logger.setLevel(logging.DEBUG)
    print_info = False
    print_errors = False
    if args.info and not args.errors:
        print_info = True
    elif not args.info and args.errors:
        print_errors = True
    else:
        print_info = True
        print_errors = True

    def print_resp(resp, resp_name=None):
        if resp_name is not None:
            sys.stderr.write(resp_name)
            sys.stderr.write("\n")
        if args.json:
            print(json.dumps(resp, sort_keys=True, indent=2))
        else:
            print(resp)

    bus = dbusutil.connect(args.system)
    proxy = bus.get_object(args.object, args.path)
    if print_info:
        print_resp(dbusutil.call(proxy.GetExtensionInfo, args.uuid),
                resp_name="{}: Info:".format(args.uuid))
    if print_errors:
        print_resp(dbusutil.call(proxy.GetExtensionErrors, args.uuid),
                resp_name="{}: Errors:".format(args.uuid))

if __name__ == "__main__":
    main()

