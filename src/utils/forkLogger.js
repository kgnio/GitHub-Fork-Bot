const fs = require("fs");
const path = require("path");

const logFilePath = path.join(__dirname, "..", "..", "fork-log.json");

/**
 * Read log file
 */
function readLog() {
  try {
    if (!fs.existsSync(logFilePath)) return [];

    const raw = fs.readFileSync(logFilePath, "utf-8");

    if (!raw.trim()) return []; // File exists but is empty

    return JSON.parse(raw);
  } catch (err) {
    console.error("❌ Could not read fork-log.json:", err.message);
    return [];
  }
}

/**
 * Add a new log entry
 */
function addToLog(entry) {
  const logs = readLog();
  logs.push(entry);
  fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2));
}

/**
 * Check if this repository has already been processed
 */
function isAlreadyProcessed(fullName) {
  const logs = readLog();
  return logs.some((entry) => entry.full_name === fullName);
}

module.exports = {
  readLog,
  addToLog,
  isAlreadyProcessed,
};
