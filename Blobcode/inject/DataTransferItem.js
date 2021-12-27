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
