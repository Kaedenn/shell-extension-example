"use strict";

const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;
const GLib = imports.gi.GLib;
const Main = imports.ui.main;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
Me.imports.utils.importModule(window, Me.imports.logging);

/**************************** Registry Management ****************************/

const REGISTRY_DIR = GLib.get_user_cache_dir() + "/" + Me.uuid;
const REGISTRY_FILE = "registry.json";
const REGISTRY_PATH = REGISTRY_DIR + "/" + REGISTRY_FILE;

/* Write an arbitrary object to the registry. Returns true on success. */
function writeRegistry(registry) {
    let json = JSON.stringify(registry);
    let content = GLib.ByteArray.new_take(json);
    GLib.mkdir_with_parents(REGISTRY_DIR, parseInt("0775", 8));
    return GLib.file_set_contents(REGISTRY_PATH, content);
}

/* Read the registry file and return the results */
function readRegistry() {
    if (GLib.file_test(REGISTRY_PATH, GLib.FileTest.EXISTS)) {
        let file = Gio.file_new_for_path(REGISTRY_PATH);
        try {
            let [ok, contents, etag_out] = file.load_contents(null);
            if (ok) {
                return JSON.parse(contents.toString());
            } else {
                errorNotify("Failed to read registry " + REGISTRY_PATH + "!");
                return null;
            }
        } catch (e) {
            errorNotify(e);
            return null;
        }
    } else {
        /* File doesn't exist; return an empty list */
        error("Registry path does not exist");
        return [];
    }
}

/* Read a registry file and call a function with the results */
function readRegistryAsync(callback) {
    if (typeof(callback) !== "function")
        throw TypeError("`callback` must be a function");
    if (GLib.file_test(REGISTRY_PATH, GLib.FileTest.EXISTS)) {
        let file = Gio.file_new_for_path(REGISTRY_PATH);
    } else {
        /* File doesn't exist; return an empty list */
        callback([]);
    }
}

const EXPORTS = {
    "REGISTRY_DIR": REGISTRY_DIR,
    "REGISTRY_FILE": REGISTRY_FILE,
    "REGISTRY_PATH": REGISTRY_PATH,
    "writeRegistry": writeRegistry,
    "readRegistry": readRegistry
};

/* vim: set ts=4 sts=4 sw=4 et nocindent cinoptions=: */
