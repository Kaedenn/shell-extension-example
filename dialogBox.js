"use strict";

const St = imports.gi.St;
const GObject = imports.gi.GObject;
const ModalDialog = imports.ui.modalDialog;
const CheckBox = imports.ui.checkBox;
const Clutter = imports.gi.Clutter;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const K = {};
K.Util = Me.imports.utils;
K.Log = Me.imports.logging;
K.Registry = Me.imports.registry;

function openDialog(title, msg, sub_msg, ok_label, cancel_label, callback) {
  const db = new KExtDialog(title, msg + "\n" + sub_msg, ok_label, cancel_label, callback);
  db.open();
}

const KExtDialog = GObject.registerClass(
  class KExtDialog extends ModalDialog.ModalDialog {
    _init(title, desc, ok_label, cancel_label, callback) {
      super._init();
      let main_box = new St.BoxLayout({
        vertical: "false",
        style_class: 'gt-modal-dialog'
      });
      this.contentLayout.add(main_box, {x_fill: true, y_fill: true});

      let msg_box = new St.BoxLayout({
        vertical: true
      });
      main_box.add(msg_box, {y_align: St.Align.START});

      let subj_label = new St.Label({
        style: "font-weight: 700",
        text: title
      });
      msg_box.add(subj_label, {y_fill: true, y_align: St.Align.START});

      let desc_label = new St.Label({
        style: "padding-top: 12px",
        text: desc
      });
      msg_box.add(desc_label, {y_fill: true, y_align: St.Align.START});

      this.setButtons([
        {
          label: cancel_label,
          action: () => { this.close(); },
          key: Clutter.Escape
        },
        {
          label: ok_label,
          action: () => {
            this.close();
            if (callback) callback();
          }
        }
      ]);
    }
  }
);

let EXPORTS = {
  "openDialog": openDialog,
  "KExtDialog": KExtDialog
};

/* vim: set ts=2 sts=2 sw=2 et nocindent cinoptions=: */
