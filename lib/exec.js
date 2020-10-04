/* Common functions included when executing scripts via shell-exec.py */

/* Configuration options:
 *
 * exclude
 *    array of strings: names to exclude in _list_objects
 * text
 *    boolean: include function source code in _inspect_value
 * name
 *    boolean: include member attribute names (toString) in _inspect_value
 */

const CONF = {};

/* Set a configuration value in the global configuration object */
function _set_conf(key, val) {
  CONF[key] = val;
}

/* Merge a configuration object into the global configuration object */
function _merge_conf(config) {
  for (let k of Object.keys(config)) {
    CONF[k] = config[k];
  }
}

/* Notify the user with a given message */
function _notify(str, details=null) {
  if (details !== null) {
    imports.ui.main.notify(str, details);
  } else {
    imports.ui.main.notify(str);
  }
}

/* Read a file from the filesystem */
function _read_file(fpath) {
  return imports.gi.Gio.File.new_for_path(fpath).load_bytes(null)[0].get_data();
}

/* Write a string to the filesystem */
function _write_file(fpath, data) {
  let out = imports.gi.Gio.File.new_for_path(fpath);
  let ostream = out.append_to(Gio.FileCreateFlags.NONE, null);
  ostream.write(data, null);
  ostream.close(null);
}

/* Escape a string for printing */
function _escape(s) {
  let r = "";
  for (let i = 0; i < s.length; ++i) {
    let c = s[i].charCodeAt(0);
    if (s[i] === '\r') {
      r += "\\r";
    } else if (s[i] === "\n") {
      r += "\\n";
    } else if (s[i] === "\v") {
      r += "\\v";
    } else if (s[i] === "\t") {
      r += "\\t";
    } else if (c === 0) {
      r += '\\0';
    } else if (c < 0x20 || c > 0x7f) {
      r += "\\x" + (c).toString(16).padStart(2, "0");
    } else {
      r += String.fromCharCode(c);
    }
  }
  return r;
}

/* Print a message to the invoking tty */
function _print(msg, flags=null) {
  const tty = flags && flags.tty ? flags.tty : CONF.tty;
  const eol = flags && flags.eol ? flags.eol : "\n";
  const result = msg + eol;
  if (tty) {
    try {
      _write_file(tty, result);
    } catch (e) {
      _notify("Error writing tty:", `${e}`);
      return `${e}`;
    }
  } else {
    _notify("Error: tty unavailable", msg)
  }
  return result;
}

/* Return an array of the object's property names */
function _list_object(obj) {
  let vars = {};
  for (let i in obj) {
    vars[i] = i;
  }
  for (let i of Object.getOwnPropertyNames(obj)) {
    vars[`${i}`] = i;
  }
  for (let expr of CONF.exclude || []) {
    if (vars[expr] === expr) {
      delete vars[expr];
    }
  }
  let varnames = Object.keys(vars);
  varnames.sort();
  return varnames;
}

/* Inspect a single object attribute or single value */
function _inspect_value(obj, attr=null) {
  const value = attr !== null ? obj[attr] : obj;
  let vtype = typeof(value);
  if (value === null) {
    return "null";
  } else if (vtype === "string") {
    return `string[${value.length}] "${value}"`;
  } else if (vtype === "number") {
    return `number ${value}`;
  } else if (vtype === "function") {
    let fname = value.name;
    let vstr = `${value}`;
    if (vstr.search(/\[native code\]/) !== -1) {
      vstr = `native function ${fname}()`;
    } else if (vstr.search(/wrapper for native symbol/) !== -1) {
      vstr = vstr.replace(
        /function[\s]+([^{]+) {[\s]+\/\*[\s]*wrapper for native symbol ([^ ]+)[\s]*\*\/[\s]*}[\s]*/,
        'function $1 wraps native $2');
    } else if (fname) {
      vstr = CONF.text ? vstr : `function ${fname}(...) {${vstr.length} characters}`;
    } else {
      vstr = CONF.text ? vstr : `function {${vstr.length} characters}`;
    }
    return vstr;
  } else if (vtype === "object") {
    let name = CONF.name ? `object ${value}` : "object";
    let attrs = _list_object(value);
    if (attrs.length === 0) {
      return `${name} {0 attributes}`;
    } else if (attrs.length === 1) {
      return `${name} {1 attribute}`;
    } else if (attrs.length > 1) {
      return `${name} {${attrs.length} attributes}`;
    } else {
      return `${name} {unknown attributes}`;
    }
  } else if (vtype === "symbol") {
    return "symbol";
  } else {
    return CONF.text ? `${vtype} ${value}` : `${vtype}`;
  }
}

/* Inspect an object; returns an array of strings */
function _get_members(obj) {
  if (typeof(obj) === "string") {
    return [`(String[${obj.length}])"${obj}"`];
  } else if (typeof(obj) === "number") {
    return [`(Number)${obj}`];
  } else if (typeof(obj) === "boolean") {
    return [`(bool)${obj}`];
  } else if (typeof(obj) === "symbol") {
    return ["(symbol)"];
  } else {
    let varnames = _list_object(obj);
    let tokens = [];
    for (let i of varnames) {
      tokens.push(`${i}: ${_inspect_value(obj, i)}`);
    }
    return tokens;
  }
}

/* Recursively inspect an object
function _inspect(obj, name=null, depth=0, maxdepth=null, seen=null, exclude=null) {
  let results = [];
  if (seen === null) seen = {};
  if (exclude === null) exclude = [];
  const vtype = typeof(obj);
  let vstr = `${obj}`.split(/\n/)[0];
  if (vstr.length > 100) { vstr = vstr.substr(0, 100) + "..."; }

  function _pad(s, n, c=" ") {
    let r = "";
    for (let i = 0; i < n; ++i) {
      r += c;
    }
    r += s;
    return r;
  }

  if (vtype === "object") {
    if (!seen[obj] && (maxdepth === null || depth < maxdepth)) {
      seen[obj] = `${obj}:${vtype}`;
      for (let a of _list_object(obj)) {
        let n = (name !== null ? name + "." : "") + a;
        results.push(_pad(a, depth+1, " "))
        for (let l of _inspect(obj[a], n, depth+2, maxdepth, seen, exclude)) {
          results.push(l);
        }
      }
    } else {
      results.push(_pad(`${name !== null ? name : ""}...`, depth));
    }
  } else if (vtype === "number") {
    results.push(_pad(`(Number)${obj}`, depth));
  } else if (vtype === "string") {
    results.push(_pad(`(String)"${obj}"`, depth));
  } else {
    results.push(_pad(`(${vtype})${obj}`, depth));
  }
  return results;
}
*/

