class LokiCordovaFSAdapterError extends Error {}

const TAG = "[LokiCordovaFSAdapter]";

class LokiCordovaFSAdapter {
    constructor(options) {
        this.options = options;
    }

    saveDatabase(dbname, dbstring, callback) {
        //console.log(TAG, "saving database");
        this._getFile(dbname,
            (fileEntry) => {
                fileEntry.createWriter(
                    (fileWriter) => {
                        fileWriter.OnWrite = () => {
                            if (fileWriter.length === 0) {
                                var blob = this._createBlob(dbstring, "text/plain");
                                fileWriter.write(blob);
                            }
                            else {
                                callback();
                            }
                        };
                        fileWriter.truncate(0);
                    },
                    (err) => {
                        console.error(TAG, "error writing file", err);
                        throw new LokiCordovaFSAdapterError("Unable to write file" + JSON.stringify(err));
                    }
                );
            },
            (err) => {
                console.error(TAG, "error getting file", err);
                throw new LokiCordovaFSAdapterError("Unable to get file" + JSON.stringify(err));
            }
        );
    }

    loadDatabase(dbname, callback) {
        //console.log(TAG, "loading database");
        this._getFile(dbname,
            (fileEntry) => {
                fileEntry.file((file) => {
                    var reader = new FileReader();
                    reader.onloadend = (event) => {
                        var contents = event.target.result;
                        if (contents.length === 0) {
                            console.warn(TAG, "couldn't find database");
                            setTimeout( () => {
                                    console.warn(TAG, 're-trying');
                                    var reader2 = new FileReader();
                                    reader2.onload = function (event){
                                        var contents = event.target.result;
                                        if (contents.length === 0){
                                            console.warn("couldn't find database again!");
                                            callback(null);
                                        }
                                        else{
                                            callback(contents);
                                        }
                                    };
                                    reader2.readAsText(file);
                                },5000);
                            //callback(null);
                        }
                        else {
                            //callback(contents);
                            var n = contents.indexOf('}{"filename":');
                            if (n === -1)
                            {
                                callback(contents);
                            } else
                            {
                                var newContents = contents.substring(0, n+1);
                                callback(newContents);
                            }
                        }
                    };
                    reader.readAsText(file);
                }, (err) => {
                    console.error(TAG, "error reading file", err);
                    callback(new LokiCordovaFSAdapterError("Unable to read file" + err.message));
                });
            },
            (err) => {
                console.error(TAG, "error getting file", err);
                callback(new LokiCordovaFSAdapterError("Unable to get file: " + err.message));
            }
        );
    }
    
    deleteDatabase(dbname, callback) {
        window.resolveLocalFileSystemURL(cordova.file.dataDirectory,
            (dir) => {
                let fileName = this.options.prefix + "__" + dbname;
                dir.getFile(fileName, {create: true}, 
                    (fileEntry) => {
                        fileEntry.remove(
                            () => {
                                callback();
                            },
                            (err) => {
                                console.error(TAG, "error delete file", err);
                                throw new LokiCordovaFSAdapterError("Unable delete file" + JSON.stringify(err));
                            }
                        );
                    },
                    (err) => {
                        console.error(TAG, "error delete database", err);
                        throw new LokiCordovaFSAdapterError(
                            "Unable delete database" + JSON.stringify(err)
                        );
                    }
                );
            },
            (err) => {
                throw new LokiCordovaFSAdapterError(
                    "Unable to resolve local file system URL" + JSON.stringify(err)
                );
            }
        );
    }

    _getFile(name, handleSuccess, handleError) {
        window.resolveLocalFileSystemURL(cordova.file.dataDirectory,
            (dir) => {
                let fileName = this.options.prefix + "__" + name;
                dir.getFile(fileName, {create: true}, handleSuccess, handleError);
            },
            (err) => {
                throw new LokiCordovaFSAdapterError(
                    "Unable to resolve local file system URL" + JSON.stringify(err)
                );
            }
        );
    }

    // adapted from http://stackoverflow.com/questions/15293694/blob-constructor-browser-compatibility
    _createBlob(data, datatype) {
        let blob;

        try {
            blob = new Blob([data], {type: datatype});
        }
        catch (err) {
            window.BlobBuilder = window.BlobBuilder ||
                    window.WebKitBlobBuilder ||
                    window.MozBlobBuilder ||
                    window.MSBlobBuilder;

            if (err.name === "TypeError" && window.BlobBuilder) {
                var bb = new window.BlobBuilder();
                bb.append(data);
                blob = bb.getBlob(datatype);
            }
            else if (err.name === "InvalidStateError") {
                // InvalidStateError (tested on FF13 WinXP)
                blob = new Blob([data], {type: datatype});
            }
            else {
                // We're screwed, blob constructor unsupported entirely
                throw new LokiCordovaFSAdapterError(
                    "Unable to create blob" + JSON.stringify(err)
                );
            }
        }
        return blob;
    }
}


export default LokiCordovaFSAdapter;
