"use strict";

/* TODO:
 * Colors for logging to ptys
 * Proper formatting for Main.notify (multi-line support)
 */

const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const GLib = imports.gi.GLib;
const Main = imports.ui.main;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const LOGGING_DIR = GLib.get_user_cache_dir() + "/" + Me.uuid;
const LOGGING_FILE = "extension.log";
const LOGGING_PATH = LOGGING_DIR + "/" + LOGGING_FILE;

/********************************** Logging **********************************/

/* Output destination bitflags */
const OUT_LOG = 1 << 0;
const OUT_ERROR = 1 << 0;
const OUT_NOTIFY = 1 << 2;
const OUT_FILE = 1 << 3;
const OUT = {
    LOG: OUT_LOG,
    ERROR: OUT_ERROR,
    NOTIFY: OUT_NOTIFY,
    FILE: OUT_FILE
};

function _escape(s) {
    let r = "";
    for (let i = 0; i < s.length; ++i) {
        let c = s[i];
        const n = c.charCodeAt(0);
        if (c === "\r") c = "\\r";
        else if (c === "\n") c = "\\n";
        else if (c === "\v") c = "\\v";
        else if (c === "\t") c = "\\t";
        else if (n < 0x20) c = "\\x" + (n).toString(16).padStart(2, "0");
        else if (n > 0x7f) c = "\\x" + (n).toString(16).padStart(2, "0");
        r += c;
    }
    return r;
}

function _write(path, data, eol="\n") {
    let out = imports.gi.Gio.File.new_for_path(path);
    let ostream = out.append_to(Gio.FileCreateFlags.NONE, null);
    ostream.write(data, null);
    if (eol !== null) {
        ostream.write(eol, null);
    }
    ostream.close(null);
}

/* Create a logging function. Configuration:
 *  mode        where to log to (see below)
 *  path        (for OUT_FILE) path to write to
 *  eol         (for OUT_FILE) end-of-line string
 *  escape      if true, escape special characters
 *  nostack     if true, do not include stack information
 *
 * modes:
 *  OUT_LOG      output to global.log()
 *  OUT_ERROR    output to global.logError()
 *  OUT_NOTIFY   output to Main.notify()
 *  OUT_FILE     output to the configured path
 *
 * The returned logging function can be invoked one of two ways:
 *  loggingFunction(message)
 *  loggingFunction(message, config)
 * where config can override values passed to makeLogFunc().
 */
function makeLogFunc(prefix, baseConfig=null) {
    const baseMode = baseConfig && baseConfig.mode ? baseConfig.mode : OUT_LOG;
    const basePath = baseConfig && baseConfig.path ? baseConfig.path : null;
    const baseEol = baseConfig && baseConfig.eol ? baseConfig.eol : "\n";
    const baseEscape = baseConfig && baseConfig.escape;
    const baseNostack = baseConfig && baseConfig.nostack;
    return (msg, config=null) => {
        let mode = config && config.mode ? config.mode : baseMode;
        let path = config && config.path ? config.path : basePath;
        let eol = config && config.eol ? config.eol : baseEol;
        let escape = config && config.escape ? config.escape : baseEscape;
        let nostack = config && config.nostack ? config.nostack : baseNostack;
        if (escape) msg = _escape(msg);
        if (!nostack) {
            // Grab the second line of a stack trace, i.e. caller of debug()
            let regex = /(?:(?:[^<.]+<\.)?([^@]+))?@(.+):(\d+):\d+/g;
            let trace = ((msg.stack) ? msg : new Error()).stack.split("\n")[1];
            let [m, func, file, line] = regex.exec(trace);
            file = GLib.path_get_basename(file);
            let hdr = [file, func, line].filter(k => (k)).join(":");
            msg = `[${prefix}] [${hdr}]: ${msg}`;
        } else {
            msg = `[${prefix}]: ${msg}`;
        }

        if (mode & OUT_LOG) {
            global.log(msg);
        }
        if (mode & OUT_ERROR) {
            global.logError(msg);
        }
        if (mode & OUT_NOTIFY) {
            Main.notify(msg);
        }
        if ((mode & OUT_FILE) && path !== null) {
            _write(path, msg);
        }
    };
}

const debug = makeLogFunc("KnetDebug", {"mode": OUT_LOG|OUT_FILE});
const error = makeLogFunc("KnetError", {"mode": OUT_ERROR|OUT_FILE});
const errorNotify = makeLogFunc("KnetError", {"mode": OUT_ERROR|OUT_NOTIFY|OUT_FILE});
const logCache = makeLogFunc("KnetLog", {"mode": OUT_LOG|OUT_FILE, "path": LOGGING_PATH});

/* Log to a specific pseudo-terminal */
const logPts0 = makeLogFunc("KnetLog", {"mode": OUT_FILE, "path": "/dev/pts/0"});
const logPts1 = makeLogFunc("KnetLog", {"mode": OUT_FILE, "path": "/dev/pts/1"});
const logPts2 = makeLogFunc("KnetLog", {"mode": OUT_FILE, "path": "/dev/pts/2"});
const logPts3 = makeLogFunc("KnetLog", {"mode": OUT_FILE, "path": "/dev/pts/3"});
const logPts4 = makeLogFunc("KnetLog", {"mode": OUT_FILE, "path": "/dev/pts/4"});
const logPts5 = makeLogFunc("KnetLog", {"mode": OUT_FILE, "path": "/dev/pts/5"});
const logPts6 = makeLogFunc("KnetLog", {"mode": OUT_FILE, "path": "/dev/pts/6"});
const logPts7 = makeLogFunc("KnetLog", {"mode": OUT_FILE, "path": "/dev/pts/7"});
const logPts8 = makeLogFunc("KnetLog", {"mode": OUT_FILE, "path": "/dev/pts/8"});
const logPts9 = makeLogFunc("KnetLog", {"mode": OUT_FILE, "path": "/dev/pts/9"});

const EXPORTS = {
    "OUT": OUT,
    "OUT_LOG": OUT_LOG,
    "OUT_ERROR": OUT_ERROR,
    "OUT_NOTIFY": OUT_NOTIFY,
    "OUT_FILE": OUT_FILE,
    "_escape": _escape,
    "makeLogFunc": makeLogFunc,
    "debug": debug,
    "error": error,
    "errorNotify": errorNotify,
    "logCache": logCache,
    "logPts0": logPts0,
    "logPts1": logPts1,
    "logPts2": logPts2,
    "logPts3": logPts3,
    "logPts4": logPts4,
    "logPts5": logPts5,
    "logPts6": logPts6,
    "logPts7": logPts7,
    "logPts8": logPts8,
    "logPts9": logPts9
};

/* vim: set ts=4 sts=4 sw=4 et nocindent cinoptions=: */
