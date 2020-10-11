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
const K = {};
K.Util = Me.imports.utils;

var LOGGING_DIR = GLib.get_user_cache_dir() + "/" + Me.uuid;
var LOGGING_FILE = "extension.log";
var LOGGING_PATH = LOGGING_DIR + "/" + LOGGING_FILE;
var LOGGING_DEBUG_FILE = "extension-debug.log";
var LOGGING_DEBUG_PATH = LOGGING_DIR + "/" + LOGGING_DEBUG_FILE;

/********************************** Logging **********************************/

/* Output destination bitflags */
var OUT_LOG = 1 << 0;
var OUT_ERROR = 1 << 0;
var OUT_NOTIFY = 1 << 2;
var OUT_FILE = 1 << 3;
var OUT = {
  LOG: OUT_LOG,
  ERROR: OUT_ERROR,
  NOTIFY: OUT_NOTIFY,
  FILE: OUT_FILE
};

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
 *  mode    where to log to (see below)
 *  path    (for OUT_FILE) path to write to
 *  eol     (for OUT_FILE) end-of-line string
 *  escape    if true, escape special characters
 *  nostack   if true, do not include stack information
 *
 * modes:
 *  OUT_LOG    output to global.log()
 *  OUT_ERROR  output to global.logError()
 *  OUT_NOTIFY   output to Main.notify()
 *  OUT_FILE   output to the configured path
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
  const baseTimestamp = baseConfig && baseConfig.timestamp;
  return (msg, config=null) => {
    let mode = config && config.mode ? config.mode : baseMode;
    let path = config && config.path ? config.path : basePath;
    let eol = config && config.eol ? config.eol : baseEol;
    let escape = config && config.escape ? config.escape : baseEscape;
    let nostack = config && config.nostack ? config.nostack : baseNostack;
    let timestamp = baseTimestamp || (config && config.timestamp);
    if (escape) {
      msg = K.Util.escapeString(msg);
    }
    let msgPrefix = `[${prefix}]`;
    if (timestamp) {
      msgPrefix = `${msgPrefix} [${K.Util.formatTime()}]`;
    }
    if (!nostack) {
      // Grab the second line of a stack trace, i.e. caller of debug()
      let regex = /(?:(?:[^<.]+<\.)?([^@]+))?@(.+):(\d+):\d+/g;
      let trace = ((msg.stack) ? msg : new Error()).stack.split("\n")[1];
      let [m, func, file, line] = regex.exec(trace);
      file = GLib.path_get_basename(file);
      let hdr = [file, func, line].filter(k => (k)).join(":");
      msgPrefix = `[${prefix}] [${hdr}]`;
    }
    let msgFinal = `${msgPrefix}: ${msg}`;

    if (mode & OUT_LOG) {
      global.log(msgFinal);
    }
    if (mode & OUT_ERROR) {
      global.logError(msgFinal);
    }
    if (mode & OUT_NOTIFY) {
      Main.notify(msgPrefix, msg);
    }
    if (mode & OUT_FILE) {
      _write(path === null ? LOGGING_PATH : path, msgFinal);
    }
  };
}

var debug = makeLogFunc("KnetDebug", {"mode": OUT_LOG|OUT_FILE, "path": LOGGING_DEBUG_PATH, timestamp:1});
var error = makeLogFunc("KnetError", {"mode": OUT_ERROR|OUT_FILE, timestamp:1});
var errorNotify = makeLogFunc("KnetError", {"mode": OUT_ERROR|OUT_NOTIFY|OUT_FILE});
var logCache = makeLogFunc("KnetLog", {"mode": OUT_LOG|OUT_FILE, timestamp:1});
var notify = makeLogFunc("KnetLog", {"mode": OUT_LOG|OUT_NOTIFY|OUT_FILE});

/* Log to a specific pseudo-terminal */
var logPts0 = makeLogFunc("KnetLog", {"mode": OUT_FILE, "path": "/dev/pts/0"});
var logPts1 = makeLogFunc("KnetLog", {"mode": OUT_FILE, "path": "/dev/pts/1"});
var logPts2 = makeLogFunc("KnetLog", {"mode": OUT_FILE, "path": "/dev/pts/2"});
var logPts3 = makeLogFunc("KnetLog", {"mode": OUT_FILE, "path": "/dev/pts/3"});
var logPts4 = makeLogFunc("KnetLog", {"mode": OUT_FILE, "path": "/dev/pts/4"});
var logPts5 = makeLogFunc("KnetLog", {"mode": OUT_FILE, "path": "/dev/pts/5"});
var logPts6 = makeLogFunc("KnetLog", {"mode": OUT_FILE, "path": "/dev/pts/6"});
var logPts7 = makeLogFunc("KnetLog", {"mode": OUT_FILE, "path": "/dev/pts/7"});
var logPts8 = makeLogFunc("KnetLog", {"mode": OUT_FILE, "path": "/dev/pts/8"});
var logPts9 = makeLogFunc("KnetLog", {"mode": OUT_FILE, "path": "/dev/pts/9"});

var EXPORTS = {
  "OUT": OUT,
  "OUT_LOG": OUT_LOG,
  "OUT_ERROR": OUT_ERROR,
  "OUT_NOTIFY": OUT_NOTIFY,
  "OUT_FILE": OUT_FILE,
  "makeLogFunc": makeLogFunc,
  "debug": debug,
  "error": error,
  "errorNotify": errorNotify,
  "logCache": logCache,
  "notify": notify,
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

/* vim: set ts=2 sts=2 sw=2 et nocindent cinoptions=: */
