//
//  PickerHandler.swift
//  Codepad
//
//  Created by Maximilian Mittelhammer on 10.12.21.
//

import Foundation

//MARK: FileSystemHandle
/**
 The FileSystemHandle interface of the File System Access API is an object which represents a file or directory entry. Multiple handles can represent the same entry. For the most part you do not work with FileSystemHandle directly but rather its child interfaces FileSystemFileHandle and FileSystemDirectoryHandle.
 */
class FileSystemHandle: Encodable {
    let kind: String
    let name: String
    let url: String
    let identifier: String
    
    init(kind: String, name: String, url: String, identifier: String){
        self.kind = kind
        self.name = name
        self.url = url
        self.identifier = identifier
    }
    
    func toJSON() -> String{
        do {
            let data = try JSONEncoder().encode(self)
            return String(data: data, encoding: .utf8)!
        } catch {
            print(error)
            return "{}"
        }
    }
}

//MARK: FileSystemFileHandle
/**
 The FileSystemFileHandle interface of the File System Access API represents a handle to a file system entry. The interface is accessed through the window.showOpenFilePicker() method.
 */
class FileSystemFileHandle: FileSystemHandle {
    init(name: String, url: String, identifier: String) {
        super.init(kind: "file", name: name, url: url, identifier: identifier)
    }
}

//MARK: FileSystemDirectoryHandle
/**
 The FileSystemDirectoryHandle interface of the File System Access API provides a handle to a file system directory. The interface is accessed via the window.showDirectoryPicker() method.
 */
class FileSystemDirectoryHandle: FileSystemHandle {
    var entries: [FileSystemHandle] = []
    
    init(name: String, url: String, identifier: String) {
        super.init(kind: "directory", name: name, url: url, identifier: identifier)
    }
    
    func append(fileHandle: FileSystemHandle){
        entries.append(fileHandle)
    }
    
    private enum CodingKeys: String, CodingKey {
        case kind
        case name
        case url
        case identifier
        case entries
    }

    override func encode(to encoder: Encoder) throws {
        try super.encode(to: encoder)
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(self.kind, forKey: .kind)
        try container.encode(self.name, forKey: .name)
        try container.encode(self.url, forKey: .url)
        try container.encode(self.identifier, forKey: .identifier)
        try container.encode(self.entries, forKey: .entries)
    }
}
