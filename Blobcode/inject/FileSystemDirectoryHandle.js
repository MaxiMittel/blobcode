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
