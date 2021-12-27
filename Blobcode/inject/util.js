/**
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
}