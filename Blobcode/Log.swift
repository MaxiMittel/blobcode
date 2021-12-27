//
//  Log.swift
//  Codepad
//
//  Created by Maximilian Mittelhammer on 25.12.21.
//

import Foundation

func logInfo(message: String){
    print("[INFO] \(message)")
}

func logError(message: Error){
    print("[ERROR] \(message)")
}
