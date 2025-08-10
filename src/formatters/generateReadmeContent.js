function generateReadmeContent(repo, options = {}) {
  const { dockerfileAdded = false, workflowAdded = false } = options;
  const repoName = repo?.name || repo?.full_name?.split("/")?.[1] || "Project";

  const created = new Date(repo.created_at).toISOString().split("T")[0]; // YYYY-MM-DD
  const updated = new Date(repo.pushed_at).toISOString().split("T")[0]; // YYYY-MM-DD

  let dockerNotes = "";
  if (dockerfileAdded || workflowAdded) {
    dockerNotes += "\n---\n\n";
    dockerNotes += "### 🐳 Automation Enhancements\n\n";
    if (dockerfileAdded) {
      dockerNotes +=
        "- 📦 A `Dockerfile` has been automatically added to enable containerization.\n";
    }
    if (workflowAdded) {
      dockerNotes +=
        "- ⚙️ A GitHub Actions workflow has been set up to build the Docker image on each push.\n";
    }
  }

  return `# ${repoName}

> 🛠 This README was automatically generated because the original repository did not include one.

## 📋 Project Overview

| Property         | Value |
|------------------|-------|
| 🔗 GitHub         | [${repo.full_name}](${repo.html_url}) |
| 🧑‍💻 Owner          | ${repo.owner.login} |
| 📦 Main Language  | ${repo.language || "Unknown"} |
| 🗓 Created         | ${created} |
| 🔄 Last Updated   | ${updated} |

${dockerNotes}

---

_This repository was forked and enhanced by an automated formatting bot. The modifications aim to improve documentation, enforce code consistency, and enhance developer experience._
`;
}

module.exports = { generateReadmeContent };
