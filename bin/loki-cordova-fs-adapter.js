"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var LokiCordovaFSAdapterError = function (_Error) {
    _inherits(LokiCordovaFSAdapterError, _Error);

    function LokiCordovaFSAdapterError() {
        _classCallCheck(this, LokiCordovaFSAdapterError);

        return _possibleConstructorReturn(this, (LokiCordovaFSAdapterError.__proto__ || Object.getPrototypeOf(LokiCordovaFSAdapterError)).apply(this, arguments));
    }

    return LokiCordovaFSAdapterError;
}(Error);

var TAG = "[LokiCordovaFSAdapter]";

var LokiCordovaFSAdapter = (function () {
    function LokiCordovaFSAdapter(options) {
        _classCallCheck(this, LokiCordovaFSAdapter);

        this.options = options;
    }

    _createClass(LokiCordovaFSAdapter, [{
        key: "saveDatabase",
        value: function saveDatabase(dbname, dbstring, callback) {
            var _this2 = this;

            //console.log(TAG, "saving database");
            this._getFile(dbname, function (fileEntry) {
                fileEntry.createWriter(function (fileWriter) {
                    fileWriter.OnWrite = function () {
                        if (fileWriter.length === 0) {
                            var blob = _this2._createBlob(dbstring, "text/plain");
                            fileWriter.write(blob);
                        } else {
                            callback();
                        }
                    };
                    fileWriter.truncate(0);
                }, function (err) {
                    console.error(TAG, "error writing file", err);
                    throw new LokiCordovaFSAdapterError("Unable to write file" + JSON.stringify(err));
                });
            }, function (err) {
                console.error(TAG, "error getting file", err);
                throw new LokiCordovaFSAdapterError("Unable to get file" + JSON.stringify(err));
            });
        }
    }, {
        key: "loadDatabase",
        value: function loadDatabase(dbname, callback) {
            //console.log(TAG, "loading database");
            this._getFile(dbname, function (fileEntry) {
                fileEntry.file(function (file) {
                    var reader = new FileReader();
                    reader.onloadend = function (event) {
                        var contents = event.target.result;
                        if (contents.length === 0) {
                            console.warn(TAG, "couldn't find database");
                            setTimeout(function () {
                                console.warn(TAG, 're-trying');
                                var reader2 = new FileReader();
                                reader2.onload = function (event) {
                                    var contents = event.target.result;
                                    if (contents.length === 0) {
                                        console.warn("couldn't find database again!");
                                        callback(null);
                                    } else {
                                        callback(contents);
                                    }
                                };
                                reader2.readAsText(file);
                            }, 5000);
                            //callback(null);
                        } else {
                            //callback(contents);
                            var n = contents.indexOf('}{"filename":');
                            if (n === -1) {
                                callback(contents);
                            } else {
                                var newContents = contents.substring(0, n + 1);
                                callback(newContents);
                            }
                        }
                    };
                    reader.readAsText(file);
                }, function (err) {
                    console.error(TAG, "error reading file", err);
                    callback(new LokiCordovaFSAdapterError("Unable to read file" + err.message));
                });
            }, function (err) {
                console.error(TAG, "error getting file", err);
                callback(new LokiCordovaFSAdapterError("Unable to get file: " + err.message));
            });
        }
    }, {
        key: "deleteDatabase",
        value: function deleteDatabase(dbname, callback) {
            var _this3 = this;

            window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (dir) {
                var fileName = _this3.options.prefix + "__" + dbname;
                dir.getFile(fileName, { create: true }, function (fileEntry) {
                    fileEntry.remove(function () {
                        callback();
                    }, function (err) {
                        console.error(TAG, "error delete file", err);
                        throw new LokiCordovaFSAdapterError("Unable delete file" + JSON.stringify(err));
                    });
                }, function (err) {
                    console.error(TAG, "error delete database", err);
                    throw new LokiCordovaFSAdapterError("Unable delete database" + JSON.stringify(err));
                });
            }, function (err) {
                throw new LokiCordovaFSAdapterError("Unable to resolve local file system URL" + JSON.stringify(err));
            });
        }
    }, {
        key: "_getFile",
        value: function _getFile(name, handleSuccess, handleError) {
            var _this4 = this;

            window.resolveLocalFileSystemURL(cordova.file.dataDirectory, function (dir) {
                var fileName = _this4.options.prefix + "__" + name;
                dir.getFile(fileName, { create: true }, handleSuccess, handleError);
            }, function (err) {
                throw new LokiCordovaFSAdapterError("Unable to resolve local file system URL" + JSON.stringify(err));
            });
        }

        // adapted from http://stackoverflow.com/questions/15293694/blob-constructor-browser-compatibility

    }, {
        key: "_createBlob",
        value: function _createBlob(data, datatype) {
            var blob = void 0;

            try {
                blob = new Blob([data], { type: datatype });
            } catch (err) {
                window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;

                if (err.name === "TypeError" && window.BlobBuilder) {
                    var bb = new window.BlobBuilder();
                    bb.append(data);
                    blob = bb.getBlob(datatype);
                } else if (err.name === "InvalidStateError") {
                    // InvalidStateError (tested on FF13 WinXP)
                    blob = new Blob([data], { type: datatype });
                } else {
                    // We're screwed, blob constructor unsupported entirely
                    throw new LokiCordovaFSAdapterError("Unable to create blob" + JSON.stringify(err));
                }
            }
            return blob;
        }
    }]);

    return LokiCordovaFSAdapter;
})();

//exports.default = LokiCordovaFSAdapter;
// Uncomment this next line to be able to do `var LokiCordovaFSAdapter = require("./loki-cordova-fs-adapter")`
//module.exports = LokiCordovaFSAdapter;