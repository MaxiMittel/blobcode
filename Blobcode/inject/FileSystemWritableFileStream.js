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
