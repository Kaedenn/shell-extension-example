'use strict';

const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;
const GObject = imports.gi.GObject;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

function init() {
  ExtensionUtils.initTranslations("kaedenn");
}

var KExtPrefsWidget = new GObject.registerClass(
  class KExt_PrefsWidget extends Gtk.Grid {
    _init() {
      super._init();
      //this._settings = ExtensionUtils.getSettings("org.gnome.shell.extensions.kaedenn");
      //this._prefs = K.Registry.readRegistry();

      let i = 0; /* row */
      this._addSwitch("debug-enable", {
        y: i++, x: 0,
        label: "Debugging",
        help: "Enable debugging functionality"});

    }

    _addSwitch(key, config) {
      let lbl = new Gtk.Label({label: config.label, halign: Gtk.Align.END});
      this.attach(lbl, config.x, config.y, 1, 1);
      let sw = new Gtk.Switch({halign: Gtk.Align.END, valign: Gtk.Align.CENTER});
      this.attach(sw, config.x + 1, config.y, 1, 1);
      if (config.help) {
        lbl.set_tooltip_text(config.help);
        lbl.set_tooltip_text(config.help);
      }
      //this._settings.bind(config.key, sw, "active", Gio.SettingsBindFlags.DEFAULT);
    }

    _addComboBox(key, config) {
    }


  }
);

function _labelWidget(labelText, widget) {
  let hbox = new Gtk.Box({orientation: Gtk.Orientation.HORIZONTAL, spacing: 10});
  let label = new Gtk.Label({label: labelText, xalign: 0});
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
  frame.add(new KExtPrefsWidget());

  frame.show_all();
  return frame;
}

/* vim: set ts=2 sts=2 sw=2 et: */
