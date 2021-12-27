//
//  ViewController.swift
//  Blobcode
//
//  Created by Maximilian Mittelhammer on 27.12.21.
//

import UIKit
import WebKit
import MobileCoreServices
import UniformTypeIdentifiers

class ViewController: UIViewController, WKScriptMessageHandlerWithReply, UIDocumentPickerDelegate {
    
    var fileSystem = FileSystem()
    var showOpenFilePickerCallback: (Any?, String?) -> Void = {_,_ in }
    
    //MARK: DocumentPicker
    func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
                                
        if(!urls.isEmpty && urls[0].isDirectoryExt){
            //Directory selected
            let secureDirectory = SecureFile(url: urls[0], scopedURL: urls[0])
            fileSystem.put(entry: secureDirectory)
            if let dirContent = fileSystem.getDirectory(identifier: secureDirectory.id.uuidString){
                showOpenFilePickerCallback(dirContent.toJSON(), nil)
            }else{
                showOpenFilePickerCallback(nil, "Could not get directory contents.")
            }
        }else{
            //File(s) selected
            var result: [FileSystemHandle] = []
            
            for url in urls {
                let secureFile = SecureFile(url: url, scopedURL: url)
                fileSystem.put(entry: secureFile)
                
                result.append(FileSystemFileHandle(name: url.lastPathComponent,
                                                   url: url.absoluteString,
                                                   identifier: secureFile.id.uuidString))
            }
            
            do {
                let jsonData = try JSONEncoder().encode(result)
                let jsonString = String(data: jsonData, encoding: .utf8)!
                showOpenFilePickerCallback(jsonString, nil)
            } catch { logError(message: error) }
        }
    }
    
    //MARK: DocumentPickerWasCancelled
    func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
        controller.dismiss(animated: true, completion: nil)
        showOpenFilePickerCallback(nil, "Picker dismissed")
    }
    
    
    //MARK: JS Communication
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage, replyHandler: @escaping (Any?, String?) -> Void) {
        let body = message.body
        if let dict = body as? Dictionary<String, AnyObject> {
            switch dict["action"] as! String {
            case "showOpenFilePicker":
                showOpenFilePicker(multiple: false, accept: dict["accept"] as! [String])
                showOpenFilePickerCallback = replyHandler
            case "showDirectoryPicker":
                showDirectoryPicker()
                showOpenFilePickerCallback = replyHandler
            case "showSaveFilePicker":
                showSaveFilePicker(suggestedName: dict["suggestedName"] as! String)
                showOpenFilePickerCallback = replyHandler
            case "readFile":
                let file = fileSystem.readFile(identifier: dict["identifier"] as! String)
                replyHandler(file?.toJSON(), nil)
            case "saveFile":
                fileSystem.saveFile(identifier: dict["identifier"] as! String, content: dict["content"] as! String)
                replyHandler("success", nil)
            case "createFile":
                let handle = fileSystem.createFile(parent: dict["parent"] as! String, name: dict["name"] as! String)
                replyHandler(handle?.toJSON(),nil)
            case "createDirectory":
                let handle = fileSystem.createDirectory(parent: dict["parent"] as! String, name: dict["name"] as! String)
                replyHandler(handle?.toJSON(),nil)
            case "removeEntry":
                let success = fileSystem.removeEntry(identifier: dict["identifier"] as! String, recursive: dict["recursive"] as! Bool)
                if success {
                    replyHandler(success, nil)
                }else{
                    replyHandler(nil, "Couldn not remove entry.")
                }
            case "resolve":
                let names = fileSystem.resolve(identifier: dict["identifier"] as! String)
                replyHandler(names, nil)
            case "getDirectory":
                if let dirContent = fileSystem.getDirectory(identifier: dict["identifier"] as! String){
                    replyHandler(dirContent.toJSON(), nil)
                }else{
                    replyHandler(nil, "Could not get directory contents.")
                }
            case "debugPrint":
                print(dict["message"] as! String)
                replyHandler(nil,nil)
            default:
                logInfo(message: "Unknow action")
            }
            
        }
    }
    
    
    @IBOutlet weak var webView: WKWebView!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        overrideUserInterfaceStyle = .dark
        
        webView.customUserAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.2 Safari/605.1.15"
        webView.load(URLRequest(url: URL(string: "https://vscode.dev")!))
        inject()
    }
    
    /**
     Injects JS into the WKWebView.
     */
    func inject() {
        let injectScript = WKUserScript(source: getInjectJS(), injectionTime: .atDocumentStart, forMainFrameOnly: false)
        
        webView.configuration.userContentController.addUserScript(injectScript)
        webView.configuration.userContentController.addScriptMessageHandler(self, contentWorld: .page, name: "code")
    }
    
    /**
     Load the contents of the injections file.
     
     - Returns: Contents of the "inject-bundle.js" file as a String.
     */
    func getInjectJS() -> String {
        if let filepath = Bundle.main.path(forResource: "inject-bundle", ofType: "js") {
            do {
                return try String(contentsOfFile: filepath)
            } catch {
                return ""
            }
        } else {
           return ""
        }
    }
    
    /**
     Shows a picker for files.
     
     - Parameter multiple: Indicates wheter the user can select multiple files at once.
     - Parameter accept: Specifies the accpeted file types.
     */
    func showOpenFilePicker(multiple: Bool, accept: [String]){
        //Map file extensions to UTType
        var types: [UTType] = []
        for ext in accept {
            if let t = UTType(filenameExtension: ext){
                types.append(t)
            }
        }
        
        //Allow all if types array is empty
        if types.isEmpty {
            types = [.item]
        }
        
        let documentPickerController = UIDocumentPickerViewController(forOpeningContentTypes: types)
        documentPickerController.allowsMultipleSelection = multiple
        documentPickerController.delegate = self
        self.present(documentPickerController, animated: true, completion: nil)
    }
    
    /**
     Shows a picker to save a file.
     
     - Parameter suggestedName: The name of the file to save.
     */
    func showSaveFilePicker(suggestedName: String){
        //Present a UIAlert to enter the file name.
        let alertController = UIAlertController(title: "Enter a file name", message: nil, preferredStyle: .alert)
        let confirmAction = UIAlertAction(title: "Continue", style: .default) { (_) in
            if let txtField = alertController.textFields?.first, let text = txtField.text {
                //Present the picker to pick the save location.
                do {
                    //Create a temporary file and move it to the picked location.
                    let fileURL = FileManager.default.temporaryDirectory.appendingPathComponent(text)
                    try Data().write(to: fileURL)
                    
                    let documentPickerController = UIDocumentPickerViewController(forExporting: [fileURL])
                    documentPickerController.delegate = self
                    self.present(documentPickerController, animated: true, completion: nil)
                } catch {
                    logError(message: error)
                }
            }
        }
        let cancelAction = UIAlertAction(title: "Cancel", style: .cancel) { [self] (_) in showOpenFilePickerCallback(nil, "Picker dismissed") }
        alertController.addTextField { (textField) in textField.placeholder = suggestedName }
        alertController.addAction(confirmAction)
        alertController.addAction(cancelAction)
        self.present(alertController, animated: true, completion: nil)
    }
    
    /**
     Show a file picker for directories.
     */
    func showDirectoryPicker(){
        let documentPickerController = UIDocumentPickerViewController(forOpeningContentTypes: [.folder])
        documentPickerController.delegate = self
        self.present(documentPickerController, animated: true, completion: nil)
    }
}

extension URL {
    var isDirectoryExt: Bool {
        
        guard startAccessingSecurityScopedResource() else {
            logInfo(message: "Could not check if directory")
            return false
        }
        
        do {
            let values = try resourceValues(forKeys: [.isDirectoryKey])
            return values.isDirectory ?? false
        } catch {
           logError(message: error)
        }
        
        do { stopAccessingSecurityScopedResource() }
        
        return false
    }
}


