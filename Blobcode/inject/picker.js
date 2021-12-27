/**
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
