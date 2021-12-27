//
//  File.swift
//  Codepad
//
//  Created by Maximilian Mittelhammer on 18.12.21.
//

import Foundation

struct File: Codable {
    let content: Data
    let type: String
    let name: String
    let lastModified: String
    
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
