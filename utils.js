"use strict";

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

const EXPORTS = {"importModule": importModule};

/* vim: set ts=4 sts=4 sw=4 et nocindent cinoptions=: */
