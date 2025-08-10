// modules/generateDynamicPRMessage.js
const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

/**
 * Generates a dynamic Pull Request description based on recent changes in a repository.
 * @param {string} repoPath - Path to the target repository.
 * @param {Object} options - Optional flags and additional content.
 * @param {boolean} options.dockerfileAdded - Whether a Dockerfile was added.
 * @param {boolean} options.workflowAdded - Whether a GitHub Actions workflow was added.
 * @param {string[]} options.changeLog - List of notable changes/tasks completed.
 * @param {string|null} options.aiQualityReport - AI-generated code quality analysis.
 * @returns {string} - The formatted PR message.
 */
function generateDynamicPRMessage(repoPath, options = {}) {
  const {
    dockerfileAdded = false,
    workflowAdded = false,
    changeLog = [],
    aiQualityReport = null,
  } = options;

  try {
    const gitDir = `-C "${repoPath}"`;

    // Get changed files and statuses from the last commit
    const diffOutput = execSync(
      `git ${gitDir} diff HEAD~1 HEAD --name-status`,
      { encoding: "utf8" }
    )
      .trim()
      .split("\n")
      .filter(Boolean);

    // Get a short summary of the changes (lines added/removed)
    const shortStat = execSync(`git ${gitDir} diff HEAD~1 HEAD --shortstat`, {
      encoding: "utf8",
    }).trim();

    if (diffOutput.length === 0) {
      return "⚠️ No changes detected in the last commit.";
    }

    // Map change statuses to emojis for better readability
    const changes = diffOutput.map((line) => {
      const [status, filePath] = line.trim().split(/\s+/);
      const emoji =
        status === "A"
          ? "➕"
          : status === "M"
            ? "✏️"
            : status === "D"
              ? "🗑️"
              : "📄";
      return `- ${emoji} \`${filePath}\``;
    });

    // Docker-specific notes
    const dockerNotes = [];
    if (dockerfileAdded) dockerNotes.push("🐳 Added `Dockerfile`.");
    if (workflowAdded)
      dockerNotes.push("⚙️ Added GitHub Actions Docker workflow.");

    // Build PR sections
    const sections = [
      "## 🛠️ Pull Request Summary",
      "",
      "### 📌 Summary of Changes",
      shortStat ? `> ${shortStat}` : "> No stats available.",
      "",
      "### 🗂️ Changed Files",
      ...changes,
      "",
      changeLog.length > 0
        ? "### 📋 Task Log\n\n" + changeLog.map((log) => `- ${log}`).join("\n")
        : "",
      "",
      dockerNotes.length > 0
        ? "### 🐋 Docker Notes\n\n" +
          dockerNotes.map((n) => `- ${n}`).join("\n")
        : "",
      "",
    ];

    // AI-generated quality report (optional)
    if (aiQualityReport) {
      sections.push(
        "### 🧠 Code Quality Analysis (AI-Generated)",
        "",
        "```markdown",
        aiQualityReport.length > 2000
          ? aiQualityReport.slice(0, 2000) + "\n... (truncated)"
          : aiQualityReport,
        "```",
        ""
      );
    }

    sections.push("---");

    return sections.join("\n");
  } catch (err) {
    return `⚠️ An error occurred while generating the PR message: ${err.message}`;
  }
}

module.exports = { generateDynamicPRMessage };
