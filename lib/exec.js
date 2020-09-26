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
function _notify(str) {
  imports.ui.main.notify(str);
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
    let vstr = `${value}`;
    let varg = CONF.text ? vstr : `(${vstr.length} characters)`;
    return `function ${varg}`;
  } else if (vtype === "object") {
    let name = CONF.name ? `object ${value}` : "object";
    let attrs = _list_object(value);
    if (attrs.length === 0) {
      return `${name} {0 attributes}`;
    } else if (attrs.length == 1) {
      return `${name} {1 attribute}`;
    } else if (attrs.length > 1) {
      return `${name} {${attrs.length} attributes}`;
    } else {
      return `${name} {unknown attributes}`;
    }
  } else {
    return `${vtype}`;
  }
}

/* Inspect an object; returns an array of strings */
function _get_members(obj) {
  let varnames = _list_object(obj);
  let tokens = [];
  for (let i of varnames) {
    tokens.push(`${i}: ${_inspect_value(obj, i)}`);
  }
  return tokens;
}

/* Recursively inspect an object */
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

  //results.push(_pad(`${name !== null ? name : vstr}`, depth, " ") + ": ");
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
  }
  return results;
}

