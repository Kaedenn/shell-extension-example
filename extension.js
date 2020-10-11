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
K.Dialog = Me.imports.dialogBox;

/* Configuration and defaults */
const PANEL_TARGETS = {     /* Mapping between boxes and targets */
  "left": "panelLeft",
  "center": "panelCenter",
  "right": "panelRight"
};
const PANEL_BOX = "right";  /* Default box */
const PANEL_TARGET = PANEL_TARGETS[PANEL_BOX];
const ICON_NAME = "system-run";

class KExt {
  constructor() {
    this._button = null;
    this._icon = null;
    this._prefs = null;
    this._prefsChangedId = null;
    K.Log.logCache("Created KExt");
  }

  /* Initialize the extension */
  init() {
    K.Log.logCache("initializing KExtButton");
    this._button = new St.Bin({
      style_class: "panel-button",
      reactive: true,
      can_focus: true,
      x_fill: true,
      y_fill: false,
      track_hover: true});
    this._icon = K.Util.getIcon(this._get("icon", ICON_NAME));
    this._button.set_name("KExt");
    this._button.set_child(this._icon);
    this._button.connect("button-press-event", this._onButtonPress.bind(this));
    this._getPanel().insert_child_at_index(this._button, 0);
    K.Log.logCache("initialized KExtButton");
  }

  /* Call when the plugin should be disabled */
  destroy() {
    this._getPanel().remove_child(this._button);
  }

  /* Callback: called when the button is pressed */
  _onButtonPress() {
    const prefs = JSON.stringify(this._prefs);
    K.Log.notify(`Prefs: ${prefs.length} ${prefs}`);
    this._set("counter", this._get("counter", 0) + 1);

    try {
      K.Dialog.openDialog("Dialog", "Prefs", prefs, "OK", "Cancel", () => {
      });
    } catch (e) {
      K.Log.notify(`Error: ${e} ${e.stack}`);
    }
  }

  /* Return the panel object we should be adding the button to */
  _getPanel() {
    const box = this._get("panel", PANEL_BOX);
    if (PANEL_TARGETS.hasOwnProperty(box)) {
      return Main.panel.find_child_by_name(PANEL_TARGETS[box]);
    } else {
      K.Log.error(`invalid panel box ${box}`);
    }
  }

  /* Read the registry from disk */
  _loadPrefs() {
    this._prefs = K.Registry.readRegistry();
    K.Log.logCache("Read registry: " + JSON.stringify(this._prefs));
  }

  /* Write the registry to disk */
  _savePrefs() {
    if (this._prefs !== null) {
      K.Registry.writeRegistry(this._prefs);
      K.Log.logCache("Wrote registry: " + JSON.stringify(this._prefs));
    } else {
      K.Log.logCache("Failure to write registry: prefs is null");
    }
  }

  /* Obtain a value from the registry, loading it if needed */
  _get(k, def=null) {
    if (this._prefs === null) {
      this._loadPrefs();
    }
    if (this._prefs.hasOwnProperty(k)) {
      return this._prefs[k];
    }
    return def;
  }

  /* Set a value in the registry and write it to disk */
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

/* vim: set ts=2 sts=2 sw=2 et nocindent cinoptions=: */
