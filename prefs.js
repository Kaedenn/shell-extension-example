'use strict';

const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;
const Shell = imports.gi.Shell;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

function init() {
    log(`K.net: initializing ${Me.metadata.name} Preferences`);
}

function _labelWidget(labelText, widget) {
    let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 10 });
    let label = new Gtk.Label({label: labelText, xalign: 0 });
    hbox.pack_start(label, true, true, 0);
    hbox.add(widget);
    return hbox;
}

function _debugPanelButtonClicked() {
    Main.notify("Clicked on the Debug Panel button");
}

function buildPrefsWidget() {
    let frame = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        border_width: 10,
        spacing: 10
    });
    let topLabel = new Gtk.Label({
        label: `${Me.metadata.name} v${Me.metadata.version}`
    });
    frame.add(topLabel);

    let p1_switch = new Gtk.Switch({active: false});
    frame.add(_labelWidget("Property 1", p1_switch));

    let p2_input = new Gtk.Entry({text: "Type your text here"});
    frame.add(p2_input);

    let p3_button = new Gtk.Button({label: "Run"});
    p3_button.connect("notify::clicked", function(widget) {
        topLabel.set_label(topLabel.get_label() + "\n" + "Clicked on Run");
    });
    frame.add(p3_button);

    frame.show_all();
    return frame;

    /*let prefsWidget = new Gtk.Label({
        label: `${Me.metadata.name} version ${Me.metadata.version}`,
        visible: true
    });

    return prefsWidget;*/
}

/* vim: set ts=4 sts=4 sw=4 et: */
