"use strict";

/** Persistent configuration management
 *
 * API for reading and writing persistent information stored on disk.
 */

const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const GLib = imports.gi.GLib;
const Main = imports.ui.main;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const K = {};
K.Log = Me.imports.logging;
K.Util = Me.imports.utils;

var REGISTRY_DIR = GLib.get_user_cache_dir() + "/" + Me.uuid;
var REGISTRY_FILE = "registry.json";
var REGISTRY_PATH = REGISTRY_DIR + "/" + REGISTRY_FILE;

/* Write an arbitrary object to the registry. Returns true on success. */
function writeRegistry(registry) {
  let json = JSON.stringify(registry);
  let content = GLib.ByteArray.new_take(json);
  GLib.mkdir_with_parents(REGISTRY_DIR, parseInt("0775", 8));
  GLib.file_set_contents(REGISTRY_PATH, content);
  K.Log.logCache("Wrote registry");
}

/* Read the registry file and return the results */
function readRegistry() {
  if (GLib.file_test(REGISTRY_PATH, GLib.FileTest.EXISTS)) {
    let file = Gio.file_new_for_path(REGISTRY_PATH);
    try {
      let [ok, contents, etag_out] = file.load_contents(null);
      if (ok) {
        K.Log.logCache("Read registry");
        return JSON.parse(K.Util.bytesToString(contents));
      } else {
        K.Log.errorNotify("Failed to read registry " + REGISTRY_PATH + "!");
        return null;
      }
    } catch (e) {
      K.Log.errorNotify(e);
      return null;
    }
  } else {
    /* File doesn't exist; return an empty list */
    K.Log.error("Registry path does not exist");
    return [];
  }
}

/* Read a registry file and call a function with the results */
function readRegistryAsync(callback) {
  if (typeof(callback) !== "function")
    throw TypeError("`callback` must be a function");
  if (GLib.file_test(REGISTRY_PATH, GLib.FileTest.EXISTS)) {
    let file = Gio.file_new_for_path(REGISTRY_PATH);
    /* TODO */
  } else {
    /* File doesn't exist; return an empty list */
    callback([]);
  }
}

var EXPORTS = {
  "REGISTRY_DIR": REGISTRY_DIR,
  "REGISTRY_FILE": REGISTRY_FILE,
  "REGISTRY_PATH": REGISTRY_PATH,
  "writeRegistry": writeRegistry,
  "readRegistry": readRegistry
};

/* vim: set ts=2 sts=2 sw=2 et nocindent cinoptions=: */
