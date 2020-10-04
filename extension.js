"use strict";

/* Example extension for playing around with Gnome Shell extensions
 *
 * This extension adds a button to the top panel.
 */

const Lang = imports.lang;
const Mainloop = imports.mainloop;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Gio = imports.gi.Gio;
const Shell = imports.gi.Shell;
const St = imports.gi.St;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const K = {};
K.Util = Me.imports.utils;
K.Log = Me.imports.logging;
K.Registry = Me.imports.registry;

/* Configuration */
const ICON_NAME = "system-run";     /* Button icon name or path */
const PANEL_TARGET = "_rightBox";   /* Default panel */
const PANEL_TARGETS = {};           /* Permissable panel targets */
PANEL_TARGETS[0] = PANEL_TARGETS["left"] = "_leftBox";
PANEL_TARGETS[1] = PANEL_TARGETS["center"] = "_centerBox";
PANEL_TARGETS[2] = PANEL_TARGETS["right"] = "_rightBox";

class KExt {
    constructor() {
        K.Log.logCache("Created KExt");
    }

    init() {
        this._button = null;
        this._icon = null;
        this._prefs = null;
        this._prefsChangedId = null;

        K.Log.logCache("initializing KExtButton");
        this._button = new St.Bin({
            style_class: "panel-button",
            reactive: true,
            can_focus: true,
            x_fill: true,
            y_fill: false,
            track_hover: true});
        this._icon = K.Util.getIcon(this._get("icon", ICON_NAME));
        this._button.set_child(this._icon);
        this._button.connect("button-press-event", this._onButtonPress.bind(this));
        this._getPanel().insert_child_at_index(this._button, 0);
        K.Log.logCache("initialized KExtButton");
    }

    destroy() {
        this._getPanel().remove_child(this._button);
    }

    _onButtonPress() {
        K.Log.notify("KExtButton has been pressed");
    }

    _getPanel() {
        const box = this._get("panel", "right");
        if (PANEL_TARGETS.hasOwnProperty(box)) {
            return Main.panel[PANEL_TARGETS[box]];
        } else {
            K.Log.error(`invalid panel box ${box}`);
        }
    }

    _loadPrefs() {
        this._prefs = K.Registry.readRegistry();
        K.Log.logCache("Read registry: " + JSON.stringify(this._prefs));
    }

    _savePrefs() {
        if (this._prefs !== null) {
            K.Registry.writeRegistry(this._prefs);
            K.Log.logCache("Wrote registry: " + JSON.stringify(this._prefs));
        } else {
            K.Log.logCache("Failure to write registry: prefs is null");
        }
    }

    _get(k, def=null) {
        if (this._prefs === null) {
            this._loadPrefs();
        }
        if (this._prefs.hasOwnProperty(k)) {
            return this._prefs[k];
        }
        return def;
    }

    _set(k, v) {
        if (this._prefs === null) {
            this._loadPrefs();
        }
        this._prefs[k] = v;
        this._savePrefs();
    }
};

let kext = null;
function init() {
    K.Log.logCache("init()");
    kext = new KExt();
}

function enable() {
    K.Log.logCache("enable()");
    kext.init();
}

function disable() {
    kext.destroy();
}

/*** OLD CODE ***/

// /* Globals */
// 
// let kRegistry = null;    /* Loaded registry configuration object */
// let kButton = null;      /* Button added to the panel */
// 
// /* Return the desired panel box object */
// function _getPanel() {
//     let pbox = PANEL_TARGET;
//     if (kRegistry !== null && kRegistry.hasOwnProperty("panel")) {
//         const pidx = kRegistry["panel"];
//         if (!PANEL_TARGETS.hasOwnProperty(pidx)) {
//             K.Log.error(`invalid panel index ${pidx}`);
//         } else {
//             pbox = PANEL_TARGETS[pidx];
//         }
//     }
//     return Main.panel[pbox];
// }
// 
// /* Callback for the panel button's press event */
// function _onButtonPress() {
//     K.Log.notify("Taskbar button has been pressed");
// }
// 
// /* Required API: initialize the extension */
// function init() {
//     K.Log.logCache("initializing");
//     kRegistry = K.Registry.readRegistry();
//     K.Log.logCache("Read registry: " + JSON.stringify(kRegistry));
//     kButton = new St.BoxLayout({
//         style_class: "panel-status-menu-box panel-button",
//         reactive: true,
//         can_focus: true,
//         track_hover: true});
//     let bin = new St.Bin({
//         style_class: "panel-button",
//         reactive: true,
//         can_focus: true,
//         x_fill: true,
//         y_fill: false,
//         track_hover: true});
//     if (kRegistry.hasOwnProperty("icon")) {
//         bin.set_child(K.Util.getIcon(kRegistry.icon));
//     } else {
//         bin.set_child(K.Util.getIcon(ICON_NAME));
//     }
//     bin.connect("button-press-event", _onButtonPress);
//     kButton.add_child(bin);
//     kButton.add_child(new St.Label({text: "*"}));
//     kButton.set_name("Knet Button");
//     K.Log.logCache("initialized");
// }
// 
// /* Required API: enabling the extension */
// function enable() {
//     K.Log.logCache("enabling");
//     _getPanel().insert_child_at_index(kButton, 0);
//     K.Log.logCache("enabled");
// }
// 
// /* Required API: disabling the extension */
// function disable() {
//     K.Log.logCache("disabling");
//     _getPanel().remove_child(kButton);
//     K.Log.logCache("disabled");
// }

/* vim: set ts=4 sts=4 sw=4 et nocindent cinoptions=: */
