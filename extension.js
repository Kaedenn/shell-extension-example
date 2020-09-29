"use strict";

const Gio = imports.gi.Gio;
const St = imports.gi.St;
const Shell = imports.gi.Shell;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const Lang = imports.lang;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
Me.imports.utils.importModule(window, Me.imports.logging);
Me.imports.utils.importModule(window, Me.imports.registry);

/* Configuration */
const ICON_NAME = "system-run"; /* The icon to use for the button */
const PANEL_TARGET = "_rightBox"; /* Which panel to add the button to */

/* Globals */
let knetRegistry = null;

/* Button to add to the panel */
let knetButton = null;

const kLog = makeLogFunc("KnetLog", {
    "mode": OUT.LOG|OUT.FILE,
    "path": "/home/kaedenn/knet.log"});

function _onButtonPress() {
    Main.notify("K.net: taskbar button has been pressed");
    if (knetRegistry.hasOwnProperty("clickedIcon")) {
        knetButton.set_child(_icon(knetRegistry.clickedIcon));
    } else {
        knetButton.set_child(_icon("/usr/share/icons/HighContrast/scalable/actions/go-bottom.svg"));
    }
}

function _icon(s) {
    if (s.startsWith("/")) {
        const icon = new St.Icon({
            gicon: Gio.icon_new_for_string(s),
            style_class: "system-status-icon"});
        return icon;
    } else {
        return new St.Icon({
            icon_name: s,
            style_class: "system-status-icon"});
    }
}

function init() {
    kLog("initializing");
    knetRegistry = readRegistry();
    kLog("Read registry: " + JSON.stringify(knetRegistry));
    knetButton = new St.Bin({
        style_class: "panel-button",
        reactive: true,
        can_focus: true,
        x_fill: true,
        y_fill: false,
        track_hover: true});
    if (knetRegistry.hasOwnProperty("icon")) {
        knetButton.set_child(_icon(knetRegistry.icon));
    } else {
        knetButton.set_child(_icon(ICON_NAME));
    }
    knetButton.set_name("Knet Button");
    knetButton.connect("button-press-event", _onButtonPress);
    kLog("initialized");
}

function enable() {
    kLog("enabling");
    Main.panel[PANEL_TARGET].insert_child_at_index(knetButton, 0);
    kLog("enabled");
}

function disable() {
    kLog("disabling");
    Main.panel[PANEL_TARGET].remove_child(knetButton);
    kLog("disabled");
}

/* vim: set ts=4 sts=4 sw=4 et nocindent cinoptions=: */
