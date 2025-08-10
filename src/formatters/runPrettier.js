const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

/**
 * Formats code using Prettier (does not stop the process on errors)
 * @param {string} repoPath - The forks/<repo> directory
 */
function runPrettier(repoPath) {
  return new Promise((resolve) => {
    const prettierIgnorePath = path.join(repoPath, ".prettierignore");

    // Only add ignore file argument if it exists
    const ignoreArg = fs.existsSync(prettierIgnorePath)
      ? `--ignore-path .prettierignore`
      : "";

    const command = `npx prettier --write "**/*.{js,ts,jsx,tsx,json,md,yaml,yml}" ${ignoreArg}`;

    exec(command, { cwd: repoPath }, (err, stdout, stderr) => {
      if (err) {
        console.warn(
          "⚠️ Error occurred while running Prettier, continuing the process."
        );
        if (stderr) console.warn(stderr.trim());
        return resolve();
      }
      if (stdout.trim()) {
        console.log("🎨 Prettier completed:\n" + stdout.trim());
      } else {
        console.log("✅ Prettier ran successfully, no changes made.");
      }
      resolve(stdout.trim());
    });
  });
}

module.exports = { runPrettier };
