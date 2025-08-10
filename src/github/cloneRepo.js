// src/github/cloneRepo.js
const simpleGit = require("simple-git");
const fs = require("fs");
const path = require("path");

/**
 * Clones the forked repository into the "forks/" folder.
 * @param {string} cloneUrl - Example: https://github.com/kagan-dev/finally.git
 * @param {string} repoName - Example: finally
 */
async function cloneRepo(cloneUrl, repoName) {
  await new Promise((r) => setTimeout(r, 1500));
  const targetDir = path.join(__dirname, "..", "..", "forks", repoName);

  // If the folder already exists, delete it
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
    console.log(`🧹 Old folder removed: ${repoName}`);
  }

  const git = simpleGit();

  try {
    console.log(`📥 Cloning: ${cloneUrl}`);
    await git.clone(cloneUrl, targetDir);
    console.log(`✅ Clone completed: forks/${repoName}`);
    return targetDir;
  } catch (err) {
    console.error(`❌ Clone error:`, err.message || err);
    return null;
  }
}

module.exports = { cloneRepo };
