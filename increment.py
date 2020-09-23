#!/usr/bin/env python3

"""
Increment a version number in a JSON file.

The JSON must have a top-level "version" key, as either a float or an int.

Usage:
    python increment.py metadata.json -i 0.1 -O
This will create a backup file of metadata.json, increment the version number
by 0.1, and then overwrite metadata.json.
"""

import argparse
import json
import os
import sys

TYPE_STRING = str
TYPE_NUMBER = float

def info(message):
    sys.stderr.write(message.rstrip("\r\n"))
    sys.stderr.write(os.linesep)

def read_lines(farg):
    if farg is not None:
        with open(farg, "rt") as fobj:
            return fobj.read()
    else:
        return sys.stdin.read()

def num_places(num):
    if num != int(num):
        l = len(str(num))
        li = len(str(int(num)))+1
        return max(l-li, 0)
    return 0

def get_type(ver):
    if any(isinstance(ver, t) for t in (str, bytes)):
        return TYPE_STRING
    elif type(ver).__name__ == "unicode": # 2.x
        return TYPE_STRING
    elif isinstance(ver, int) or isinstance(ver, float):
        return TYPE_NUMBER
    else:
        # Default to string; this can handle most cases
        return TYPE_STRING

def parse_version(ver):
    "Return a float and the attributes describing the initial format"
    is_string = False
    is_fixed = False
    num_places = None
    vtype = type(ver).__name__
    if vtype in ('str', 'unicode', 'bytes'):
        is_string = True
        if vtype == 'unicode':
            sval = ver.encode('ascii')
        elif vtype == 'bytes':
            sval = ver.decode('ascii')
        else:
            sval = ver
        if '.' not in sval:
            is_fixed = True
        else:
            num_places = len(sval) - sval.index('.')
        val = float(sval)
    elif vtype == 'int':
        is_fixed = True
        val = ver
    elif vtype == 'float':
        sval = str(ver)
        if '.' in sval:
            num_places = len(sval) - sval.index('.')
        else:
            num_places = 0
        val = ver

    return val, {
        "type": vtype,
        "is_string": is_string,
        "is_fixed": is_fixed,
        "num_places": num_places
    }

def format_version(ver, attrs, places=None):
    "Format a version (float) according to the attributes given"
    vtype = attrs.get("type", "float")
    is_string = attrs.get("is_string", False)
    is_fixed = attrs.get("is_fixed", False)
    if places is None:
        num_places = attrs.get("num_places", None)
    else:
        num_places = places

    if is_fixed and int(ver) != ver:
        # Elevate to a float
        is_fixed = False
        if num_places is None:
            num_places = 0

    if is_string:
        if is_fixed and int(ver) == ver:
            val = str(int(ver))
        elif num_places is not None and num_places > 0:
            val = str(round(ver, num_places))
        else:
            val = str(ver)
        if vtype == 'bytes':
            val = val.encode('ascii')
        elif vtype == 'unicode':
            val = val.decode('ascii')
    elif is_fixed:
        val = int(ver)
    else:
        val = ver
        if num_places is not None and num_places > 0:
            val = round(ver, num_places)

    return val

def update_version(ver, set_v=None, inc_v=None, places=None):
    "Update a version number (which can be a string, integer, or float)"
    ver_val, attrs = parse_version(ver)
    if set_v is not None:
        ver_val = set_v
    elif inc_v is not None:
        ver_val += inc_v
    new_ver = format_version(ver_val, attrs, places=places)
    info("Set version to {!r} (from {!r})".format(new_ver, ver))
    return new_ver

def backup(fpath, suffix="backup"):
    """
    Create a backup of fpath. Returns the number of bytes written and the
    backup file path.
    """
    sver = 0
    bkpath = fpath + "." + suffix
    while os.path.exists(bkpath):
        sver += 1
        bkpath = "{}.{}.{}".format(fpath, suffix, sver)
    nbytes = 0
    with open(fpath, "rt") as ifobj:
        data = ifobj.read()
        nbytes = len(data)
        with open(bkpath, "wt") as ofobj:
            ofobj.write(data)
    return nbytes, bkpath

def main():
    ap = argparse.ArgumentParser(epilog="""
This program will work on any JSON file that has a top-level "version" key. The
value must be either an integer or float.
    """)
    ap.add_argument("metadata", nargs="?",
        help="metadata.json file path (default: read from stdin)")
    ap.add_argument("-i", "--inc", metavar="NUM", type=float, default=0.1,
        help="add %(metavar)s to the version number (default: %(default)s)")
    ap.add_argument("-s", "--set", metavar="NUM", type=float,
        help="set the version number to %(metavar)s")
    ap.add_argument("-n", "--places", metavar="NUM", type=int,
        help="round version to %(metavar)s digits after the decimal (default: deduce)")
    ap.add_argument("-o", "--out", metavar="PATH",
        help="write output to %(metavar)s (default: stdout)")
    ap.add_argument("-O", "--overwrite", action="store_true",
        help="overwrite file in-place (implies -o=<metadata>)")
    ap.add_argument("--no-backup", action="store_true",
        help="do not create a backup file when overwriting the input file")
    args = ap.parse_args()
    if args.overwrite and args.metadata is None:
        ap.error("--overwrite requires a filename; can't overwrite stdin")

    # Read the JSON object and set/increment the version number
    lines = read_lines(args.metadata)
    data = json.loads(lines)
    data["version"] = update_version(data["version"],
            set_v=args.set, inc_v=args.inc, places=args.places)
    output_file = None
    if args.overwrite:
        output_file = args.metadata
    elif args.out is not None:
        output_file = args.out

    # Create a backup of the input file if we're about to overwrite it
    if output_file is not None and os.path.samefile(output_file, args.metadata):
        if not args.no_backup:
            nbytes, bkpath = backup(args.metadata)
            info("Copied {} to {} ({} bytes)".format(args.metadata, bkpath, nbytes))
        else:
            info("Warning: about to overwrite {}!".format(args.metadata))

    # Output the final JSON object
    out = json.dumps(data, sort_keys=True, indent=2)
    if output_file is None:
        print(out)
    else:
        with open(output_file, "wt") as fobj:
            fobj.write(out)
            fobj.write("\n")
        info("Wrote {} bytes to {}".format(len(out), output_file))

if __name__ == "__main__":
    main()

