/**
 * Log an info message.
 * @param message The message to log.
 */
const info = (message) => {
    sendMessage("debugPrint", { message: `[INFO] ${message}` });
    console.log(`[INFO] ${message}`);
}

/**
 * Log an error message.
 * @param message The message to log.
 */
const error = (message) => {
    sendMessage("debugPrint", { message: `[ERROR] ${message}` });
    console.error(`[ERROR] ${message}`);
}

/**
 * Log a function call.
 * @param message The message to log.
 */
const call = (message) => {
    sendMessage("debugPrint", { message: `[CALL] ${message}` });
    console.log(`[CALL] ${message}`);
}