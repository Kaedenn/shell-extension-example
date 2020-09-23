"use strict";

const Gio = imports.gi.Gio;
const St = imports.gi.St;
const Shell = imports.gi.Shell;
const Main = imports.ui.main;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

let knetButton = null;

function _logMessage(m) {
    const msg = `${Me.metadata.name}.${Me.metadata.version}: ${m}`;
    log(msg);
}

function _buttonPress() {
    Main.notify("K.net: taskbar button has been pressed");
}

function init() {
    _logMessage("initializing");
    knetButton = new St.Bin({
        style_class: "panel-button",
        reactive: true,
        can_focus: true,
        x_fill: true,
        y_fill: false,
        track_hover: true });
    knetButton.set_child(new St.Icon({
        icon_name: 'system-run',
        style_class: 'system-status-icon' }));
    knetButton.connect("button-press-event", _buttonPress);
    _logMessage("initialized");
}

function enable() {
    _logMessage("enabling");
    Main.panel._rightBox.insert_child_at_index(knetButton, 0);
    _logMessage("enabled");
}

function disable() {
    _logMessage("disabling");
    Main.panel._rightBox.remove_child(knetButton);
    _logMessage("disabled");
}

/* vim: set ts=4 sts=4 sw=4 et: */
