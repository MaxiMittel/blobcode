//
//  FileSystem.swift
//  Codepad
//
//  Created by Maximilian Mittelhammer on 25.12.21.
//

import Foundation

class FileSystem {
    var secureDocuments: Dictionary<String, SecureFile>
    
    init(){
        secureDocuments = [String: SecureFile]()
    }
    
    /**
     Puts a new key-value pair into the secureDocuments dictionary.
     */
    func put(entry: SecureFile){
        secureDocuments[entry.id.uuidString] = entry
    }
    
    /**
     Reads the contents of a file.
     
     - Parameter identifier: The identifier for the file to read.
     
     - Returns: An optional File object.
     */
    func readFile(identifier: String) -> File?{
        
        var result: File? = nil
        
        if let file = secureDocuments[identifier] {
            
            guard file.scopedURL.startAccessingSecurityScopedResource() else { return nil }
            
            do {
                //Read the contents of the file.
                let data = try Data.init(contentsOf: file.url)
                
                result = File(content: data,
                              type: file.url.mimeType(),
                              name: file.url.lastPathComponent,
                              lastModified: fileModificationDate(url: file.url))
            }
            catch {
                logError(message: error)
            }
            
            do { file.scopedURL.stopAccessingSecurityScopedResource() }
        }
        
        return result
    }
    
    /**
     Saves data to a file.
     
     - Parameter identifier: The identifier of the file to write to.
     - Parameter content: The base64 encoded data to write to the file.
     */
    func saveFile(identifier: String, content: String){
        if let file = secureDocuments[identifier] {
            
            guard file.scopedURL.startAccessingSecurityScopedResource() else { return }
            
            do {
                //Write the data to the file.
                let data = Data(base64Encoded: content)
                try data?.write(to: file.url)
            }
            catch {
                logError(message: error)
            }
            
            do { file.scopedURL.stopAccessingSecurityScopedResource() }
        }
    }
    
    /**
     Create a new file inside a parent directory.
     
     - Parameter parent: The identifier of the parent directory.
     - Parameter name: The name of the file to create.
     
     - Returns: An optional FileSystemFileHandle of the new created file.
     */
    func createFile(parent: String, name: String) -> FileSystemFileHandle?{
        
        if let parentDirectory = secureDocuments[parent] {
            
            guard parentDirectory.scopedURL.startAccessingSecurityScopedResource() else { return nil }
            
            do {
                //Create a new file by writing empty Data to it.
                let fileURL = parentDirectory.url.appendingPathComponent(name)
                try Data().write(to: fileURL.absoluteURL)
                
                //Create the SecureFile entry for the new file
                let secureFile = SecureFile(url: fileURL, scopedURL: parentDirectory.url)
                secureDocuments[secureFile.id.uuidString] = secureFile
                
                do { parentDirectory.scopedURL.stopAccessingSecurityScopedResource() }
                
                return FileSystemFileHandle(name: fileURL.lastPathComponent,
                                            url: fileURL.absoluteString,
                                            identifier: secureFile.id.uuidString)
            } catch {
                logError(message: error)
                return nil
            }
        }
        return nil
    }
    
    /**
     Creates a new directory in a specified parent directory.
     
     - Parameter parent: The identifier of the parent directory.
     - Parameter name: The name of the directory to create.
     
     - Returns: An optional FileSystemDirectoryHandle of the new created directory.
     */
    func createDirectory(parent: String, name: String) -> FileSystemDirectoryHandle? {
        
        if let parentDirectory = secureDocuments[parent] {
            
            guard parentDirectory.scopedURL.startAccessingSecurityScopedResource() else { return nil }
            
            do {
                //Create the new directory
                let fileURL = parentDirectory.url.appendingPathComponent(name)
                try FileManager.default.createDirectory(at: fileURL, withIntermediateDirectories: true)
                
                //Create the SecureFile entry for the new directory
                let secureFile = SecureFile(url: fileURL, scopedURL: parentDirectory.url)
                secureDocuments[secureFile.id.uuidString] = secureFile
                
                do { parentDirectory.scopedURL.stopAccessingSecurityScopedResource() }
                
                return FileSystemDirectoryHandle(name: fileURL.lastPathComponent,
                                                 url: fileURL.absoluteString,
                                                 identifier: secureFile.id.uuidString)
            } catch {
                logError(message: error)
                return nil
            }
        }
        return nil
    }
    
    /**
     Removes an entry specified by its identifier.
     
     - Parameter identifier: The identifier of the entry to remove.
     - Parameter recursive: Set to true if you want to delete a directory
     
     - Returns: True if the entry was removed successfully.
     */
    func removeEntry(identifier: String, recursive: Bool)  -> Bool {
        if let entry = secureDocuments[identifier] {
            
            guard entry.scopedURL.startAccessingSecurityScopedResource() else { return false }
            
            do {
                if(recursive){
                    
                    //Get all files from directory and remove them.
                    let fileURLs = try FileManager.default.contentsOfDirectory(at: entry.url, includingPropertiesForKeys: nil)
                    for fileURL in fileURLs {
                        try FileManager.default.removeItem(at: fileURL)
                    }
                    
                    //Remove directory itself
                    try FileManager.default.removeItem(at: entry.url)
                    
                    do { entry.scopedURL.stopAccessingSecurityScopedResource() }
                    
                    return true
                    
                }else{
                    
                    //Check if file exists and remove it
                    if FileManager.default.fileExists(atPath: entry.url.absoluteString) {
                        try FileManager.default.removeItem(at: entry.url)
                        
                        do { entry.scopedURL.stopAccessingSecurityScopedResource() }
                        
                        return true
                    }
                    return false
                }
            } catch {
                logError(message: error)
                return false
            }
        }
        return false
    }
    
    /**
     Resolves all parent entry names of a specified entry.
     
     - Parameter identifier: The identifier of the entry to resolve.
     
     - Returns: A list of all the entries names in the parent directory. Last entry is always the current file.
     */
    func resolve(identifier: String) -> [String]{
        if let entry = secureDocuments[identifier] {
            
            guard entry.scopedURL.startAccessingSecurityScopedResource() else { return [] }
            
            do {
                //Get files from parent directory
                var result: [String] = []
                let fileURLs = try FileManager.default.contentsOfDirectory(at: entry.url, includingPropertiesForKeys: nil)
                for fileURL in fileURLs {
                    result.append(fileURL.lastPathComponent)
                }
                
                //Append the current file at last position
                result.append(entry.url.lastPathComponent)
                
                do { entry.scopedURL.stopAccessingSecurityScopedResource() }
                
                return result
            } catch {
                logError(message: error)
                return []
            }
        }
        return []
    }
    
    /**
     Get the contents of a directory.
     
     - Parameter identifier: The identifier of the directory to get.
     
     - Returns: Optional FileSystemDirectoryHandle with the contents of the directory.
     */
    func getDirectory(identifier: String) -> FileSystemDirectoryHandle? {
        
        if let entry = secureDocuments[identifier] {
                
            guard entry.scopedURL.startAccessingSecurityScopedResource() else {
                logInfo(message: "Could not get directory contents.")
                return nil
            }
            
            let directoryHandle = FileSystemDirectoryHandle(name: entry.url.lastPathComponent,
                                                            url: entry.url.absoluteString,
                                                            identifier: entry.id.uuidString)
            
            
            var error: NSError? = nil
            NSFileCoordinator().coordinate(readingItemAt: entry.url, error: &error) { (url) in
                    
                let keys : [URLResourceKey] = [.nameKey, .isDirectoryKey]
                    
                //Get the directories content
                guard let fileList =
                    FileManager.default.enumerator(at: url, includingPropertiesForKeys: keys) else {
                        logInfo(message: "Could not retrieve files in directory.")
                        return
                    }
                                                
                for case let file as URL in fileList {
                    guard entry.scopedURL.startAccessingSecurityScopedResource() else { continue }
                       
                    //Only get entries from level 1
                    if(fileList.level == 1){
                        //Add the entry to the dictionary
                        let secureFile = SecureFile(url: file, scopedURL: entry.scopedURL)
                        put(entry: secureFile)
                        
                        if(file.hasDirectoryPath){
                            directoryHandle.append(fileHandle: FileSystemDirectoryHandle(name: file.lastPathComponent,
                                                                                         url: file.absoluteString,
                                                                                         identifier: secureFile.id.uuidString))
                        }else{
                            directoryHandle.append(fileHandle: FileSystemFileHandle(name: file.lastPathComponent,
                                                                                    url: file.absoluteString,
                                                                                    identifier: secureFile.id.uuidString))
                        }
                    }else{
                        fileList.skipDescendants()
                    }
                        
                    entry.scopedURL.stopAccessingSecurityScopedResource()
                }
            }
                    
            return directoryHandle
        }
        return nil
    }
    
    /**
     Gets the modification data of an URL.
     
     - Returns: The modification data as a String.
     */
    func fileModificationDate(url: URL) -> String {
        do {
            let attr = try FileManager.default.attributesOfItem(atPath: url.path)
            return attr[FileAttributeKey.modificationDate] as? String ?? "0"
        } catch {
            return "0"
        }
    }
}
