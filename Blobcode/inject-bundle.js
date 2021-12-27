/**
 * The FileSystemHandle interface of the File System Access API is
 * an object which represents a file or directory entry. Multiple
 * handles can represent the same entry. For the most part you do
 * not work with FileSystemHandle directly but rather its child
 * interfaces FileSystemFileHandle and FileSystemDirectoryHandle.
 */
class FileSystemHandle {
    /**
     * Create a new FileSystemHandle instance.
     * @param {string} name The name of the directory.
     * @param {string} identifier The identifier for the file system entry.
     */
    constructor(name, kind, identifier) {
        this.name = name;
        this.kind = kind;
        this.identifier = identifier;
    }

    /**
     * Compares two handles to see if the associated entries (either a file or directory) match.
     * @param {FileSystemHandle} other The FileSystemHandle to match against the handle on which the method is invoked.
     * @returns {boolean} Returns a Boolean which is true is the entries match.
     */
    isSameEntry(other) {
        return this.identifier === other.identifier;
    }

    /**
     * Queries the current permission state of the current handle.
     * @param {FileSystemHandlePermissionDescriptor} descriptor An object which specifies the permission mode to query for.
     * @returns {PS} which is one of 'granted', 'denied' or 'prompt'.
     */
    queryPermission(descriptor) {
        //TODO: Implement queryPermission
        error("NOT IMPLEMENTED: QUERY PERMISSION");
        return descriptor.mode === "read" ? "granted" : "granted";
    }

    /**
     * Requests read or readwrite permissions for the file handle.
     * @param {FileSystemHandlePermissionDescriptor} descriptor An object which specifies the permission mode to query for.
     * @returns {PS} which is one of 'granted', 'denied' or 'prompt'.
     */
    requestPermission(descriptor) {
        //TODO: Implement requestPermission
        error("NOT IMPLEMENTED: REQUEST PERMISSION");
        return descriptor.mode === "read" ? "granted" : "granted";
    }
}
/**
 * The FileSystemFileHandle interface of the File System Access API
 * represents a handle to a file system entry. The interface is accessed
 * through the window.showOpenFilePicker() method.
 */
class FileSystemFileHandle extends FileSystemHandle {
    /**
     * Create a new FileSystemFileHandle instance.
     * @param {string} name The name of the directory.
     * @param {string} identifier The identifier for the file system entry.
     */
    constructor(name, identifier) {
        super(name, "file", identifier);
    }

    /**
     * Returns a Promise which resolves to a File object representing
     * the state on disk of the entry represented by the handle.
     * @returns {Promise<File>} A Promise which resolves to a File object.
     */
    getFile() {
        call("getFile");
        return new Promise((resolve, reject) => {
            sendMessage("readFile", { identifier: this.identifier })
                .then((file) => {
                    info("Read file");
                    file = JSON.parse(file);

                    b64toBlob(file.content, file.type)
                        .then((contents) => {
                            info("File contents");
                            const jsFile = new File([contents], file.name, {
                                lastModified: new Date(file.lastModified).getTime(),
                                type: file.type,
                            });

                            console.log(jsFile);

                            resolve(jsFile);
                        })
                        .catch((err) => { error("getFile:1 " + err); reject(err); });
                })
                .catch((err) => { error("getFile:2 " + err); reject(err); });
        });
    }

    /**
     * Creates a FileSystemWritableFileStream that can be used to write to a file.
     * The method returns a Promise which resolves to this created stream.
     * @param {FileSystemCreateWritableOptions} options An object representing options to pass into the method. Options are: keepExistingData.
     * @returns {Promise<FileSystemWritableFileStream>} A Promise which resolves to a FileSystemWritableFileStream object.
     */
    createWritable(options) {
        call("createWritable");
        return new Promise((resolve, reject) => {
            info("A");
            let stream = new FileSystemWritableFileStream(this.identifier);
            info("B");

            if (options && options.keepExistingData) {
                info("Writable with options");
                this.getFile().then((file) => {
                    stream
                        .write(file)
                        .then(() => resolve(stream))
                        .catch((err) => { error("createWritable " + err); reject(err); });
                });
            } else {
                info("Resolve stream");
                resolve(stream);
            }
        });
    }
}
/**
 * The FileSystemDirectoryHandle interface of the File System Access API
 * provides a handle to a file system directory. The interface is accessed
 * via the window.showDirectoryPicker() method.
 */
class FileSystemDirectoryHandle extends FileSystemHandle {
    /**
     * Create a new FileSystemDirectoryHandle instance.
     * @param {string} name The name of the directory.
     * @param {string} identifier The identifier for the file system entry.
     * @param {FileSystemHandle[]} handles An array of FileSystemHandle objects contained in the directory.
     */
    constructor(name, identifier, handles) {
        super(name, "directory", identifier);
        this.handles = {};
        handles.forEach((element) => {
            this.handles[element.name] = newFileSystemHandle(
                element.kind,
                element.name,
                element.identifier,
                []
            );
        });
    }

    /**
     * Returns an array of a given object's own enumerable property [key, value] pairs
     * @returns {[string, FileSystemHandle][]} An array of the object's own enumerable property [key, value] pairs.
     */
    entries() {
        call("entries");
        return Object.entries(this.handles);
    }

    /**
     * Returns a new array iterator containing the keys for each item in FileSystemDirectoryHandle.
     * @returns {string[]} An array of strings representing the names of the entries contained in the directory.
     */
    keys() {
        call("keys");
        return Object.keys(this.handles);
    }

    /**
     * Returns a new array iterator containing the values for each index in the FileSystemDirectoryHandle object.
     * @returns {FileSystemHandle[]} An array of FileSystemHandle objects contained in the directory.
     */
    values() {
        call("values");
        return Object.values(this.handles);
    }

    /**
     * Creates an iterator that iterates over the entries contained in the directory.
     * @returns {FileSystemDirectoryHandleIterator} An iterator that iterates over the enumerable property [key, value] pairs.
     */
    [Symbol.iterator]() {
        call("iterator");
        return new FileSystemDirectoryHandleIterator(this);
    }

    /**
     * Returns a FileSystemFileHandle for a file with the specified name, within the directory the method is called.
     * @param {string} name A USVString representing the FileSystemHandle.name of the file you wish to retrieve.
     * @param {GetFileHandleOptions} options An object with the following properties: create.
     * @returns {Promise<FileSystemFileHandle>} A Promise which resolves with a FileSystemFileHandle.
     */
    getFileHandle(
        name,
        options
    ) {
        call("getFileHandle");
        return new Promise((resolve, reject) => {
            if (name in this.handles) {
                if (this.handles[name] instanceof FileSystemFileHandle) {
                    info("Get file handle: " + this.handles[name].name);
                    resolve(this.handles[name]);
                } else {
                    error("TypeMismatchError: The named entry is a directory not a file.");
                    reject(
                        "TypeMismatchError: The named entry is a directory not a file."
                    );
                }
            } else {
                if (options && options.create) {
                    sendMessage("createFile", { name, parent: this.identifier })
                        .then((res) => {
                            let handle = new FileSystemFileHandle(res.name, res.identifier);
                            this.handles[res.name] = handle;
                            info("Created file: " + res.name);
                            resolve(handle);
                        })
                        .catch((err) => { error("getFileHandle " + err); reject(err); });
                } else {
                    error("NotFoundError: File doesn't exist and the create option is set to false.");
                    reject(
                        "NotFoundError: File doesn't exist and the create option is set to false."
                    );
                }
            }
        });
    }

    /**
     * Returns a FileSystemDirectoryHandle for a subdirectory with the specified name
     * within the directory handle on which the method is called.
     * @param {string} name A USVString representing the FileSystemHandle.name of the subdirectory you wish to retrieve.
     * @param {GetDirectoryHandleOptions} options An object with the following properties: create.
     * @returns {Promise<FileSystemDirectoryHandle>} A Promise which resolves with a FileSystemDirectoryHandle.
     */
    getDirectoryHandle(
        name,
        options
    ) {
        call("getDirectoryHandle");
        return new Promise((resolve, reject) => {
            if (name in this.handles) {
                sendMessage("getDirectory", {
                    identifier: this.handles[name].identifier,
                })
                    .then((res) => {
                        res = JSON.parse(res);
                        let handle = new FileSystemDirectoryHandle(
                            res.name,
                            res.identifier,
                            res.entries
                        );
                        this.handles[name] = handle;
                        info("Get directory handle: " + this.handles[name].name);
                        resolve(handle);
                    })
                    .catch((err) => { error("getDirectoryHandle:1 " + err); reject(err); });
            } else {
                if (options && options.create) {
                    sendMessage("createDirectory", { name, parent: this.identifier })
                        .then((res) => {
                            let handle = new FileSystemDirectoryHandle(
                                res.name,
                                res.identifier,
                                []
                            );
                            this.handles[res.name] = handle;
                            info("Create directory: " + this.handles[name].name);
                            resolve(handle);
                        })
                        .catch((err) => { error("getDirectoryHandle:2 " + err); reject(err); });
                } else {
                    error("NotFoundError: Directory doesn't exist and the create option is set to false.");
                    reject(
                        "NotFoundError: Directory doesn't exist and the create option is set to false."
                    );
                }
            }
        });
    }

    /**
     * Attempts to remove an entry if the directory handle contains a file or directory called the name specified.
     * @param {string} name A USVString representing the FileSystemHandle.name of the entry you wish to remove.
     * @param {RemoveEntryOptions} options  An object with the following properties: recursive.
     * @returns {Promise<undefined>} A Promise which resolves with undefined.
     */
    removeEntry(name, options) {
        call("removeEntry");
        return new Promise((resolve, reject) => {
            if (name in this.handles) {
                sendMessage("removeEntry", {
                    identifier: this.handles[name].identifier,
                    recursive: options && options.recursive,
                })
                    .then((success) => {
                        info("Removed entry: " + this.handles[name].name + ", " + success);
                        delete this.handles[name];
                        return success ? resolve(undefined) : reject(undefined);
                    })
                    .catch((err) => { error("removeEntry " + err); reject(err); });
            } else {
                error("NotFoundError: Entry doesn't exist.");
                reject("NotFoundError: Entry doesn't exist.");
            }
        });
    }

    /**
     * Returns an Array of directory names from the parent handle to the specified
     * child entry, with the name of the child entry as the last array item.
     * @param {string} possibleDescendant The FileSystemHandle.name of the FileSystemHandle from which to return the relative path.
     * @returns {Promise<string[]>} A Promise which resolves with an Array of strings.
     */
    resolve(possibleDescendant) {
        call("resolve");
        return new Promise((resolve, reject) => {
            if (possibleDescendant in this.handles) {
                sendMessage("resolve", {
                    identifier: this.handles[possibleDescendant].identifier,
                })
                    .then((res) => {
                        info("Resolved: " + this.handles[possibleDescendant].name);
                        resolve(JSON.parse(res));
                    })
                    .catch((err) => { error("resolve " + err); reject(err); });
            } else {
                error("NotFoundError: Entry doesn't exist.");
                reject("NotFoundError: Entry doesn't exist.");
            }
        });
    }
}

/**
 * An iterator that iterates over the entries contained in the directory.
 */
class FileSystemDirectoryHandleIterator {
    constructor(dir) {
        this.dir = dir;
        this.index = 0;
    }

    next() {
        let entries = Object.entries(this.dir.handles);
        if (this.index < entries.length) {
            const result = {
                value: [entries[this.index][0], entries[this.index][1]],
                done: false,
            };
            this.index++;
            return result;
        } else {
            return {
                done: true,
            };
        }
    }
}
//TODO: Store in tmp file and then move to final location
/**
 * The FileSystemWritableFileStream interface of
 * the File System Access API is a WritableStream
 * object with additional convenience methods, which
 * operates on a single file on disk. The interface
 * is accessed through the FileSystemFileHandle.createWritable() method.
 */
class FileSystemWritableFileStream { //TODO: extends WritableStream not working?
    /**
     * Create a new FileSystemWritableFileStream instance.
     * @param {string} identifier The identifier for the file system entry.
     */
    constructor(identifier) {
        info("C");
        //super();
        this.identifier = identifier;
        this.data = new Blob();
        this.seekPosition = 0;
        info("D");
        console.log(this);
    }

    /**
     * Writes content into the file the method is called on, at the current file cursor offset.
     * @param {FileSystemWriteChunkType} data Can be either the file data to write, in the
     *                                        form of a BufferSource, Blob or USVString.
     *                                        Or an WriteParams object.
     * @returns {Promise<undefined>} A Promise which returns undefined.
     */
    write(data) {
        call("write");
        return new Promise((resolve, reject) => {
            if (data.hasOwnProperty("type")) {
                if (data.type === "seek" && data.position) {
                    this.seek(data.position);
                    resolve(undefined);
                } else if (data.type === "truncate" && data.size) {
                    this.truncate(data.size);
                    resolve(undefined);
                } else if (data.type === "write") {
                    if (data.position) this.seekPosition = data.position;
                    if (data.data) {
                        let oldData = this.data.slice(0, this.seekPosition);
                        this.data = new Blob([oldData, data.data]);
                    }
                    info("Write:1 " + this.seekPosition + " " + this.data.size);
                    resolve(undefined);
                } else {
                    reject(undefined);
                }
            } else {
                let oldData = this.data.slice(0, this.seekPosition);
                this.data = new Blob([oldData, data]);
                info("Write:2 " + this.seekPosition + " " + this.data.size);
                resolve(undefined);
            }
        });
    }

    /**
     * Updates the current file cursor offset to the position (in bytes) specified when calling the method.
     * @param {number} position An unsigned long describing the byte position from the top (beginning) of the file.
     * @returns {Promise<undefined>} Promise which returns undefined.
     */
    seek(position) {
        call("seek")
        return new Promise((resolve, reject) => {
            this.seekPosition = position;
            resolve(undefined);
        });
    }

    /**
     * Resizes the file associated with the stream to be the specified size in bytes.
     * @param {number} size An unsigned long of the amount of bytes to resize the stream to.
     * @returns {Promise<undefined>} A Promise which returns undefined.
     */
    truncate(size) {
        call("truncate")
        return new Promise((resolve, reject) => {
            this.data
                .arrayBuffer()
                .then((buffer) => {
                    //Resize the buffer
                    if (size > buffer.byteLength) {
                        let newBuffer = new ArrayBuffer(size);
                        let newView = new Uint8Array(newBuffer);
                        newView.set(new Uint8Array(buffer));
                        this.data = new Blob([newBuffer]);
                    } else {
                        let newBuffer = buffer.slice(0, size);
                        this.data = new Blob([newBuffer]);
                    }

                    //Update offset
                    if (this.seekPosition > size) {
                        this.seekPosition = size;
                    }

                    resolve(undefined);
                })
                .catch((err) => reject(err));
        });
    }

    /**
     * Writes the changes to the actual file on disk.
     * @returns {Promise<undefined>} Promise which returns undefined.
     */
    close() {
        call("close")
        return new Promise((resolve, reject) => {
            encodeBase64(this.data)
                .then((data) => {
                    sendMessage("saveFile", {
                        identifier: this.identifier,
                        content: data.substring(37), //TODO: Replace workaround
                    }).then(() => resolve(undefined));
                })
                .catch((err) => reject(err));
        });
    }
}
/**
 * The getAsFileSystemHandle() method of the DataTransferItem
 * interface returns a FileSystemFileHandle if the dragged
 * item is a file, or a FileSystemDirectoryHandle if the
 * dragged item is a directory.
 * @returns {FileSystemHandle} A FileSystemHandle object.
 */
DataTransferItem.getAsFileSystemHandle = async () => {
    //TODO: Implement
    call("getAsFileSystemHandle");
    return new Promise((resolve, reject) => {
        resolve(new FileSystemHandle("", "file", ""));
    });
};
/**
 * Log an info message.
 * @param message The message to log.
 */
const info = (message) => {
    sendMessage("debugPrint", { message: `[INFO] ${message}` });
    console.log(`[INFO] ${message}`);
}

/**
 * Log an error message.
 * @param message The message to log.
 */
const error = (message) => {
    sendMessage("debugPrint", { message: `[ERROR] ${message}` });
    console.error(`[ERROR] ${message}`);
}

/**
 * Log a function call.
 * @param message The message to log.
 */
const call = (message) => {
    sendMessage("debugPrint", { message: `[CALL] ${message}` });
    console.log(`[CALL] ${message}`);
}/**
 * Creates a new FileSystemHandle depending on the kind of the file system entry.
 * @param {"file" | "directory"} kind The kind of the file system entry.
 * @param {string} name The name of the file system entry.
 * @param {string} identifier The identifier for the local file system entry.
 * @param {FileSystemHandle[]} entries? An array of FileSystemHandle objects contained in the directory. 
 * @returns A FileSystemHandle object.
 */
const newFileSystemHandle = (
    kind,
    name,
    identifier,
    entries
) => {
    return kind === "file"
        ? new FileSystemFileHandle(name, identifier)
        : new FileSystemDirectoryHandle(name, identifier, entries || []);
};

/**
 * Communcates with the file system backend.
 * @param {string} action The name of the actions to call.
 * @param {any} data The data to pass to the backend.
 * @returns {Promise<any>} A Promise which resolves to the result of the action.
 */
const sendMessage = (action, data) => {
    return window.webkit.messageHandlers.code.postMessage({
        action: action,
        ...data,
    });
};

/**
 * Creates a blob from a file encoded as base64,
 * @param {*} base64 The base64 encoded file.
 * @returns A Promise which resolves to a Blob object.
 */
const b64toBlob = (b64Data, contentType = "", sliceSize = 512) => {
    return new Promise((resolve, reject) => {
        call("b64toBlob" + b64Data);
        const byteCharacters = atob(b64Data);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            const slice = byteCharacters.slice(offset, offset + sliceSize);

            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }

        const blob = new Blob(byteArrays, { type: contentType });
        info("Blob created");
        resolve(blob);
    });
};

/**
 * Encodes a blob to a base64 string.
 * @param {Blob} blob The blob to encode.
 * @returns A base64 string.
 */
const encodeBase64 = (blob) => {
    return new Promise((resolve, _) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}/**
 * The showOpenFilePicker() method of the Window interface shows
 * a file picker that allows a user to select a file or multiple
 * files and returns a handle for the file(s).
 * @param {ShowOpenFilePickerOptions} options Options for the file picker. See ShowOpenFilePickerOptions.
 * @returns {Promise<FileSystemHandle[]>} A Array of FileSystemFileHandle objects.
 */
window.showOpenFilePicker = async (options) => {
    const opts = {
        multiple: (options && options.multiple) || false,
        excludeAcceptAllOption:
            (options && options.excludeAcceptAllOption) || false,
        types: (options && options.types) || [],
    };

    let accept = opts.types.map(type => Object.values(type.accept)).flat().flat();
    opts.accept = accept;

    return new Promise((resolve, reject) => {
        sendMessage("showOpenFilePicker", opts)
            .then((res) => {
                const handles = JSON.parse(res).map((file) =>
                    newFileSystemHandle(file.kind, file.name, file.identifier, [])
                );
                info("Selected files: " + JSON.stringify(handles));
                resolve(handles);
            })
            .catch((err) => reject(err));
    });
};

/**
 * The showDirectoryPicker() method of the Window interface
 * displays a directory picker which allows the user to select
 * a directory.
 * @returns {Promise<FileSystemDirectoryHandle>} A FileSystemDirectoryHandle object.
 */
window.showDirectoryPicker = async () => {
    return new Promise((resolve, reject) => {
        sendMessage("showDirectoryPicker", {})
            .then((res) => {
                const handle = JSON.parse(res);
                resolve(
                    new FileSystemDirectoryHandle(
                        handle.name,
                        handle.identifier,
                        handle.entries
                    )
                );
            })
            .catch((err) => {
                reject(err);
            });
    });
};

/**
 * The showSaveFilePicker() method of the Window interface
 * shows a file picker that allows a user to save a file.
 * Either by selecting an existing file, or entering a
 * name for a new file.
 * @param {ShowSaveFilePickerOptions} options Options for the file picker. See ShowSaveFilePickerOptions.
 * @return {Promise<FileSystemFileHandle>} A FileSystemFileHandle object.
 */
window.showSaveFilePicker = async (options) => {
    const opts = {
        excludeAcceptAllOption:
            (options && options.excludeAcceptAllOption) || false,
        suggestedName: (options && options.suggestedName) || "untitled.txt",
        types: (options && options.types) || [],
    };

    return new Promise((resolve, reject) => {
        sendMessage("showSaveFilePicker", opts)
            .then((res) => {
                const handle = JSON.parse(res)[0];
                info(JSON.stringify(handle));
                resolve(newFileSystemHandle(handle.kind, handle.name, handle.identifier, []));
            })
            .catch((err) => reject(err));
    });
};
//TODO: Improve
document.getElementsByTagName("html")[0].style.backgroundColor = "#252526";

setTimeout(() => {
    document.getElementsByTagName("html")[0].style.backgroundColor = window.getComputedStyle(document.getElementsByClassName("monaco-workbench")[0]).getPropertyValue('--vscode-menu-background');
}, 4000);