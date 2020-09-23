/* Common functions included when executing scripts via shell-exec.py */

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

function _notify(str) {
  imports.ui.main.notify(str);
}

function _list_object(obj) {
  let vars = {};
  for (let i in obj) {
    vars[i] = i;
  }
  for (let i of Object.getOwnPropertyNames(obj)) {
    vars[`${i}`] = i;
  }
  /* FIXME: imports.ui.main.panel pop_internal gives a linker error */
  for (let expr of CONF.exclude || []) {
    if (vars[expr] === expr) {
      delete vars[expr];
    }
  }
  let varnames = Object.keys(vars);
  varnames.sort();
  return varnames;
}

function _inspect_value(obj, attr) {
  let vtype = typeof(obj[attr]);
  if (obj[attr] === null) {
    return "null";
  } else if (vtype === "string") {
    return `string[${obj[attr].length}] "${obj[attr]}"`;
  } else if (vtype === "number") {
    return `number ${obj[attr]}`;
  } else if (vtype === "function") {
    let vstr = `${obj[attr]}`;
    let varg = CONF.text ? vstr : `(${vstr.length} characters)`;
    return `function ${varg}`;
  } else if (vtype === "object") {
    let attrs = _list_object(obj[attr]);
    if (attrs.length === 0) {
      return `object ${obj[attr]} {0 attributes}`;
    } else if (attrs.length == 1) {
      return `object ${obj[attr]} {1 attribute}`;
    } else if (attrs.length > 1) {
      return `object ${attr} {${attrs.length} attributes}`;
    } else {
      return `object ${obj[attr]} {unknown attributes}`;
    }
  } else {
    return `${vtype}`;
  }
}

function _get_members(obj) {
  let varnames = _list_object(obj);
  let tokens = [];
  for (let i of varnames) {
    tokens.push(`${i}: ${_inspect_value(obj, i)}`);
  }
  return tokens;
}

