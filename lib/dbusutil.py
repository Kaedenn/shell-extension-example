#!/usr/bin/env python

import argparse
import dbus
import os
import sys

def connect(system=False):
    "Connect to the session (or system) bus"
    if system:
        return dbus.SystemBus()
    else:
        return dbus.SessionBus()

def sniff_dbus_interface(proxy_func):
    if hasattr(proxy_func, "_proxy_method"):
        proxy_func = proxy_func._proxy_method
    if hasattr(proxy_func, "_proxy"):
        return proxy_func._proxy.requested_bus_name
    if hasattr(proxy_func, "_object_path"):
        return proxy_func._object_path.lstrip("/").replace("/", ".")
    raise ValueError("Failed to get dbus_interface for {}".format(proxy_func))

def call(proxy_func, *args, **kwargs):
    """Call a proxy function with the given args and kwargs. If the
    dbus_interface keyword argument is not given, then it is deduced by
    introspection of the proxy function. Note that this is quite fragile and
    may cease to work for almost no reason at all."""
    func_kwargs = {}
    func_kwargs.update(kwargs)
    if "dbus_interface" not in kwargs:
        func_kwargs["dbus_interface"] = sniff_dbus_interface(proxy_func)
    return proxy_func(*args, **func_kwargs)
