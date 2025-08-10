const simpleGit = require("simple-git");
const fs = require("fs");
const path = require("path");

/**
 * Commits and pushes changes
 *
 * @param {string} repoPath - e.g., forks/<repo>
 * @param {string} branch - master or main
 * @param {string} message - commit message
 * @returns {Promise<boolean>} - Returns true if commit and push succeed, false otherwise
 */
async function pushChanges(
  repoPath,
  branch = "main",
  message = "chore: auto-format"
) {
  const git = simpleGit(repoPath);

  try {
    await git.add(".");

    const status = await git.status();
    if (status.files.length === 0) {
      console.log("ℹ️ No changes to commit.");
      return false;
    }

    await git.commit(message);
    console.log("✅ Commit created");

    await git.push("origin", branch);
    console.log("🚀 Push successful!");
    return true;
  } catch (err) {
    console.error("❌ Error during push:", err.message);
    return false;
  }
}

module.exports = { pushChanges };
