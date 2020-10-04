"use strict";

const St = imports.gi.St;

function importModule(g, module) {
    if (typeof(module.EXPORTS) === "object") {
        for (let [k, v] of Object.entries(module.EXPORTS)) {
            g[k] = v;
        }
    } else {
        for (let [k, v] of Object.entries(module)) {
            if (!k.startsWith("_")) {
                g[k] = v;
            }
        }
    }
}

/* Construct an Icon from the given name or path */
function getIcon(name_or_path, config=null) {
    const iconfig = {"style_class": "system-status-icon"};
    if (config !== null) {
        for (const [k, v] of Object.entries(config)) {
            iconfig[k] = v;
        }
    }
    if (name_or_path.startsWith("/")) {
        iconfig.gicon = name_or_path;
    } else {
        iconfig.icon_name = name_or_path;
    }
    return new St.Icon(iconfig);
}

/* Format a number */
function formatNumber(n, config=null) {
    const c = config !== null ? config : {};
    function conf(k, d) {
        if (c.hasOwnProperty(k)) {
            return c[k];
        } else {
            return d;
        }
    }
    let base = conf("base", 10);
    let prefix = "";
    if (c.hasOwnProperty("prefix")) {
        prefix = c["prefix"];
    } else if (base === 8) {
        prefix = "0";
    } else if (base === 16) {
        prefix = "0x";
    } else if (base === 2) {
        prefix = "b";
    }
    let pad = conf("pad", 0);
    let padchr = conf("padchr", "0");
    let s = prefix + n.toString(base).padStart(pad, padchr);
    return s;
}

/* Format a timestamp */
function formatTime(when=null) {
    const dt = when !== null ? when : new Date();
    const h = formatNumber(dt.getHours(), {pad: 2})
    const mi = formatNumber(dt.getMinutes(), {pad: 2});
    const s = formatNumber(dt.getSeconds(), {pad: 2});
    return `${h}:${mi}:${s}`;
}

/* Escape a string for printing */
function escapeString(s) {
    let r = "";
    for (let i = 0; i < s.length; ++i) {
        let c = s[i];
        const n = c.charCodeAt(0);
        if (c === "\r") c = "\\r";
        else if (c === "\n") c = "\\n";
        else if (c === "\v") c = "\\v";
        else if (c === "\t") c = "\\t";
        else if (n < 0x20) c = "\\x" + (n).toString(16).padStart(2, "0");
        else if (n > 0x7f) c = "\\x" + (n).toString(16).padStart(2, "0");
        r += c;
    }
    return r;
}

const EXPORTS = {
    "importModule": importModule,
    "getIcon": getIcon,
    "formatNumber": formatNumber,
    "formatTime": formatTime,
    "escapeString": escapeString
};

/* vim: set ts=4 sts=4 sw=4 et nocindent cinoptions=: */
