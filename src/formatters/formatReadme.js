const fs = require("fs");
const path = require("path");
const { generateReadmeContent } = require("./generateReadmeContent");

function findReadmeFile(repoPath) {
  const files = fs.readdirSync(repoPath);
  return files.find((file) => /^readme(\.md)?$/i.test(file));
}

/**
 * Finds the README file, creates one if it doesn't exist, or updates it.
 * @param {string} repoPath - Local repository directory
 * @param {object} repoFullData - GitHub repository information
 * @param {object} options - Extra options (e.g., dockerfileAdded: true)
 */
function formatReadme(repoPath, repoFullData, options = {}) {
  const readmeFileName = findReadmeFile(repoPath) || "README.md";
  const readmePath = path.join(repoPath, readmeFileName);
  let createdNew = false;

  // If README doesn't exist, create it
  if (!fs.existsSync(readmePath)) {
    const content = generateReadmeContent(repoFullData, options);
    fs.writeFileSync(readmePath, content, "utf8");
    createdNew = true;
    console.log(`📄 README automatically created: ${readmePath}`);
  }

  // Fix README content (heading spacing, extra blank lines, etc.)
  let content = fs.readFileSync(readmePath, "utf-8");

  content = content.replace(/^(#+)\s+/gm, (_, hashes) => `${hashes} `);
  content = content.replace(/\n{3,}/g, "\n\n");

  fs.writeFileSync(readmePath, content, "utf8");

  console.log(`${createdNew ? "🆕" : "📝"} README updated: ${readmePath}`);
  return true;
}

module.exports = { formatReadme };
