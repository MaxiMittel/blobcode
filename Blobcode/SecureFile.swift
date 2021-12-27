//
//  SecureFile.swift
//  Codepad
//
//  Created by Maximilian Mittelhammer on 18.12.21.
//

import Foundation

struct SecureFile: Identifiable {
    let id = UUID()
    let url: URL
    let scopedURL: URL
}
