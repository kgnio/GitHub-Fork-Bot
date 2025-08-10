// modules/ensureCI.js
const fs = require("fs");
const path = require("path");

// Default GitHub Actions CI workflow content
const CI_YML = `name: CI
on:
  pull_request:
  push:
    branches: [ main, master ]

jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Detect Node project
        id: detect
        run: |
          if [ -f package.json ]; then
            echo "node_project=true" >> $GITHUB_OUTPUT
          else
            echo "node_project=false" >> $GITHUB_OUTPUT
          fi

      - uses: actions/setup-node@v4
        if: steps.detect.outputs.node_project == 'true'
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        if: steps.detect.outputs.node_project == 'true'
        run: npm ci || npm install

      - name: Lint
        if: steps.detect.outputs.node_project == 'true'
        run: npm run lint --if-present

      - name: Test
        if: steps.detect.outputs.node_project == 'true'
        run: npm test --if-present

      - name: Skip (Not a Node.js project)
        if: steps.detect.outputs.node_project != 'true'
        run: echo "No package.json found. Skipping Node CI steps."
`;

/**
 * Ensures a GitHub Actions CI workflow exists in the repository.
 * If it doesn’t exist, it will create one.
 *
 * @param {string} localPath - Local repository path
 * @returns {boolean} - True if a new file was created, false if it already existed
 */
function ensureCI(localPath) {
  const workflowPath = path.join(localPath, ".github", "workflows", "ci.yml");

  if (!fs.existsSync(workflowPath)) {
    fs.mkdirSync(path.dirname(workflowPath), { recursive: true });
    fs.writeFileSync(workflowPath, CI_YML, "utf8");
    console.log(`✅ CI workflow created at: ${workflowPath}`);
    return true;
  }

  console.log(`ℹ️ CI workflow already exists: ${workflowPath}`);
  return false;
}

module.exports = { ensureCI };
