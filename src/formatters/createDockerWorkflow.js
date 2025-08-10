const fs = require("fs");
const path = require("path");

function createDockerWorkflow(repoPath) {
  const workflowDir = path.join(repoPath, ".github", "workflows");
  fs.mkdirSync(workflowDir, { recursive: true });

  const workflowPath = path.join(workflowDir, "docker.yml");

  const workflowContent = `
name: Docker Build

on:
  push:
    paths:
      - 'Dockerfile'
      - '.github/workflows/docker.yml'

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: docker build -t sample-image .
`.trim();

  fs.writeFileSync(workflowPath, workflowContent, "utf8");
  console.log("⚙️ GitHub Actions workflow added.");
}

module.exports = { createDockerWorkflow };
