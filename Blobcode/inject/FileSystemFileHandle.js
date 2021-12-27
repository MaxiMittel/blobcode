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
