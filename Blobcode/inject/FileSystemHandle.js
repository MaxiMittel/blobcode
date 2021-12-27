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
