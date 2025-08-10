// modules/deadCodeDetector.js
const { execSync } = require("child_process");
const fs = require("fs");

/**
 * Executes a shell command and returns the output as a string.
 * @param {string} command
 * @returns {string}
 */
function sh(command) {
  return execSync(command, { stdio: "pipe" }).toString();
}

/**
 * Runs a shell command with error handling.
 * Returns the output or the error message.
 * @param {string} cmd
 * @returns {string}
 */
function runCmd(cmd) {
  try {
    return sh(cmd);
  } catch (e) {
    return e.stdout?.toString() || e.message;
  }
}

/**
 * Runs multiple dead code detection tools on a given project path:
 * - knip: Detects unused files, exports, and dependencies.
 * - depcheck: Finds unused npm packages.
 * - ts-prune: Finds unused TypeScript exports (if tsconfig.json exists).
 *
 * Generates a markdown report file named `deadcode-report.md`.
 *
 * @param {string} localPath - Path to the project directory
 */
async function runDeadCodeDetector(localPath) {
  const prev = process.cwd();
  process.chdir(localPath);

  const report = [];
  report.push("## Dead Code Report\n");

  report.push("### knip\n```\n" + runCmd(`npx knip --json`) + "\n```");
  report.push("### depcheck\n```\n" + runCmd(`npx depcheck`) + "\n```");

  if (fs.existsSync("tsconfig.json")) {
    report.push("### ts-prune\n```\n" + runCmd(`npx ts-prune`) + "\n```");
  }

  fs.writeFileSync("deadcode-report.md", report.join("\n\n"));
  process.chdir(prev);
}

module.exports = { runDeadCodeDetector };
