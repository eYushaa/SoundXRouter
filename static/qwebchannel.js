/*
 * QT WebChannel
 * http://www.qt.io/
 *
 * Copyright (C) 2016 The Qt Company Ltd.
 * Contact: http://www.qt.io/licensing/
 *
 * This file is part of the Qt WebChannel module of the Qt Toolkit.
 *
 * You may use this file under the terms of the BSD license as follows:
 *
 * "Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *   * Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer.
 *   * Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in
 *     the documentation and/or other materials provided with the
 *     distribution.
 *   * Neither the name of The Qt Company Ltd nor the names of its
 *     contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission.
 *
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE."
 */

"use strict";

var QWebChannel = function (transport, initCallback) {
    if (typeof transport !== "object" || typeof transport.send !== "function") {
        console.error("The QWebChannel expects a transport object with a send function and onmessage callback property." +
            " Given is: transport: " + typeof (transport) + ", transport.send: " + typeof (transport.send));
        return;
    }

    var channel = this;
    this.transport = transport;

    this.send = function (data) {
        if (typeof (data) !== "string") {
            data = JSON.stringify(data);
        }
        channel.transport.send(data);
    }

    this.transport.onmessage = function (message) {
        var data = message.data;
        if (typeof data === "string") {
            data = JSON.parse(data);
        }
        switch (data.type) {
            case QWebChannelMessageTypes.signal:
                channel.handleSignal(data);
                break;
            case QWebChannelMessageTypes.response:
                channel.handleResponse(data);
                break;
            case QWebChannelMessageTypes.propertyUpdate:
                channel.handlePropertyUpdate(data);
                break;
            default:
                console.error("invalid message received:", message.data);
                break;
        }
    }

    this.execCallbacks = {};
    this.execId = 0;
    this.exec = function (data, callback) {
        if (!callback) {
            // if no callback is given, send directly
            channel.send(data);
            return;
        }
        if (channel.execId === Number.MAX_VALUE) {
            // wrap
            channel.execId = Number.MIN_VALUE;
        }
        var id = channel.execId++;
        channel.execCallbacks[id] = callback;
        data.id = id;
        channel.send(data);
    };

    this.objects = {};

    this.handleSignal = function (message) {
        var object = channel.objects[message.object];
        if (object) {
            object.signalEmitted(message.signal, message.args);
        } else {
            console.warn("Unhandled signal: " + message.object + "::" + message.signal);
        }
    }

    this.handleResponse = function (message) {
        if (!message.hasOwnProperty("id")) {
            console.error("Invalid response message received: ", JSON.stringify(message));
            return;
        }
        channel.execCallbacks[message.id](message.data);
        delete channel.execCallbacks[message.id];
    }

    this.handlePropertyUpdate = function (message) {
        for (var i in message.data) {
            var data = message.data[i];
            var object = channel.objects[data.object];
            if (object) {
                object.propertyUpdate(data.signals, data.properties);
            } else {
                console.warn("Unhandled property update: " + data.object + "::" + data.signal);
            }
        }
        channel.execCallbacks[message.id](message.data);
        delete channel.execCallbacks[message.id];
    }

    this.debug = function (message) {
        channel.send({ type: QWebChannelMessageTypes.debug, data: message });
    };

    channel.exec({ type: QWebChannelMessageTypes.init }, function (data) {
        for (var objectName in data) {
            var object = new QObject(objectName, data[objectName], channel);
        }
        // now unwrap properties, which might reference other registered objects
        for (var objectName in channel.objects) {
            channel.objects[objectName].unwrapProperties();
        }
        if (initCallback) {
            initCallback(channel);
        }
    });
};

var QWebChannelMessageTypes = {
    signal: 1,
    propertyUpdate: 2,
    init: 3,
    idle: 4,
    debug: 5,
    invokeMethod: 6,
    connectToSignal: 7,
    disconnectFromSignal: 8,
    setProperty: 9,
    response: 10,
};

var QObject = function (name, data, webChannel) {
    this.__id__ = name;
    webChannel.objects[name] = this;

    // List of callbacks that get invoked upon signal emission
    this.__objectSignals__ = {};

    // Cache of all properties, updated when a notify signal is emitted
    this.__propertyCache__ = {};

    var object = this;

    // ----------------------------------------------------------------------

    this.unwrapProperties = function () {
        for (var propertyIdx in data.properties) {
            object.__propertyCache__[propertyIdx] = data.properties[propertyIdx];
            object.unwrapQObject(data.properties[propertyIdx]);
            if (!object.hasOwnProperty(propertyIdx)) {
                Object.defineProperty(object, propertyIdx, {
                    configurable: true,
                    get: function (propertyIdx) {
                        return function () {
                            return object.__propertyCache__[propertyIdx];
                        }
                    }(propertyIdx),
                    set: function (propertyIdx) {
                        return function (value) {
                            if (value === undefined) {
                                console.warn("Property setter for " + propertyIdx + " called with undefined value!");
                                return;
                            }
                            object.unwrapQObject(value);
                            webChannel.exec({
                                type: QWebChannelMessageTypes.setProperty,
                                object: object.__id__,
                                property: propertyIdx,
                                value: value
                            });
                        }
                    }(propertyIdx)
                });
            }
        }
    }

    this.unwrapQObject = function (value) {
        if (value instanceof Array) {
            // check if this is an array of objects
            for (var i in value) {
                object.unwrapQObject(value[i]);
            }
        } else if (value instanceof Object && value.hasOwnProperty("id")) {
            // this is an object reference
            object.__propertyCache__[value.id] = value; // add to cache
            if (webChannel.objects[value.id])
                return webChannel.objects[value.id];
            // create new QObject
            return new QObject(value.id, value.data, webChannel);
        }
        return value;
    }

    this.propertyUpdate = function (signals, propertyMap) {
        // update property cache
        for (var propertyIdx in propertyMap) {
            var propertyValue = propertyMap[propertyIdx];
            object.unwrapQObject(propertyValue);
            object.__propertyCache__[propertyIdx] = propertyValue;
        }

        for (var signalName in signals) {
            // invoke signal callbacks
            var signal = object.__objectSignals__[signalName];
            if (signal) {
                var signalArgs = signals[signalName];
                for (var i in signalArgs) {
                    object.unwrapQObject(signalArgs[i]);
                }
                signal.forEach(function (callback) {
                    callback.apply(callback, signalArgs);
                });
            }
        }
    }

    this.signalEmitted = function (signalName, signalArgs) {
        var signal = object.__objectSignals__[signalName];
        if (signal) {
            for (var i in signalArgs) {
                object.unwrapQObject(signalArgs[i]);
            }
            signal.forEach(function (callback) {
                callback.apply(callback, signalArgs);
            });
        }
    }

    // ----------------------------------------------------------------------

    this.connect = function (signalName, callback) {
        if (typeof (callback) !== "function") {
            console.error("Bad callback given to connect to signal " + signalName);
            return;
        }

        object.__objectSignals__[signalName] = object.__objectSignals__[signalName] || [];
        object.__objectSignals__[signalName].push(callback);

        if (!data.signals[signalName]) {
            // signal unknown on server, so no need to connect
            console.warn("Unknown signal: " + signalName);
            return;
        }

        if (data.signals[signalName] === 1) {
            // signal not connected on server, let's connect
            webChannel.exec({
                type: QWebChannelMessageTypes.connectToSignal,
                object: object.__id__,
                signal: signalName
            });
            data.signals[signalName] = 2; // connected
        }
    };

    this.disconnect = function (signalName, callback) {
        if (typeof (callback) !== "function") {
            console.error("Bad callback given to disconnect from signal " + signalName);
            return;
        }
        object.__objectSignals__[signalName] = object.__objectSignals__[signalName] || [];
        var idx = object.__objectSignals__[signalName].indexOf(callback);
        if (idx === -1) {
            console.error("Cannot find callback to disconnect from signal " + signalName);
            return;
        }
        object.__objectSignals__[signalName].splice(idx, 1);
        if (!object.__objectSignals__[signalName].length && data.signals[signalName] === 2) {
            // no more callbacks locally, so disconnect on server
            webChannel.exec({
                type: QWebChannelMessageTypes.disconnectFromSignal,
                object: object.__id__,
                signal: signalName
            });
            data.signals[signalName] = 1; // not connected
        }
    };

    // ----------------------------------------------------------------------

    this.addMethod = function (methodName) {
        if (object.hasOwnProperty(methodName)) return;

        object[methodName] = function () {
            var args = [];
            var callback;
            for (var i = 0; i < arguments.length; i++) {
                if (typeof arguments[i] === "function")
                    callback = arguments[i];
                else
                    args.push(arguments[i]);
            }

            webChannel.exec({
                "type": QWebChannelMessageTypes.invokeMethod,
                "object": object.__id__,
                "method": methodName,
                "args": args
            }, function (response) {
                if (response !== undefined) {
                    var result = object.unwrapQObject(response);
                    if (callback) {
                        (callback)(result);
                    }
                }
            });
        };
    }

    for (var methodName in data.methods) {
        this.addMethod(methodName);
    }
};
