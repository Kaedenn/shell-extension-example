'use strict';

const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;
const Shell = imports.gi.Shell;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
for (const [k, v] of Object.entries(Me.imports.utils.EXPORTS)) { global[k] = v; }
for (const [k, v] of Object.entries(Me.imports.logging.EXPORTS)) { global[k] = v; }
for (const [k, v] of Object.entries(Me.imports.registry.EXPORTS)) { global[k] = v; }
const OUT = Me.imports.logging.OUT;
const makeLogFunc = Me.imports.logging.makeLogFunc;

const kLog = makeLogFunc("KnetLog", {
    "mode": OUT.LOG|OUT.FILE,
    "path": "/home/kaedenn/knet.log"});

function init() {
    kLog(`K.net: initializing ${Me.metadata.name} Preferences`);
}

function _labelWidget(labelText, widget) {
    let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 10 });
    let label = new Gtk.Label({label: labelText, xalign: 0 });
    hbox.pack_start(label, true, true, 0);
    hbox.add(widget);
    return hbox;
}

function buildPrefsWidget() {
    let frame = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        border_width: 10,
        spacing: 10});
    let topLabel = new Gtk.Label({
        label: `${Me.metadata.name} v${Me.metadata.version}`});
    frame.add(topLabel);

    frame.show_all();
    return frame;
}

/* vim: set ts=4 sts=4 sw=4 et: */
