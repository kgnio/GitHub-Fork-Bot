# 🐙 GitHub Fork & Enhancement Bot

This bot automatically forks random repositories from GitHub based on configurable criteria, applies various automated enhancements, and optionally creates Pull Requests (PRs) with the changes.

It is designed to work with **automation pipelines** that:
- Add missing project files (e.g., Dockerfile, GitHub Actions workflows, OpenAPI specs)
- Generate missing tests using AI
- Run code formatters and linters
- Apply security patches
- Create changelogs
- Generate AI-powered PR descriptions

---

## 🚀 Features

### 1. **Automatic Repository Selection**
- Fetches repositories from GitHub API using filters:
  - **Minimum and maximum star count**
  - **Target programming languages**
  - **License type**
  - **Inactive for X months**
- Avoids already-processed repositories (tracked in `fork-log.json`).

### 2. **Forking and Local Cloning**
- Forks repositories to your GitHub account.
- Clones them locally for modification.

### 3. **Enhancement Modules**
The bot includes modular scripts for specific improvements:

| Module | Purpose |
| ------ | ------- |
| **`ensureCI.js`** | Ensures a basic GitHub Actions CI workflow exists. |
| **`generateDynamicPRMessage.js`** | Generates rich PR descriptions with commit stats, changed files, and AI quality reports. |
| **`openapiDoc.js`** | Generates `openapi.json` from existing routes/controllers using `swagger-jsdoc`. |
| **`generateMissingTests.js`** | Creates missing Jest tests for untested files, optionally using OpenAI API. |
| **Security Patcher** | Applies automated fixes for known vulnerabilities. |
| **Changelog Generator** | Produces a `CHANGELOG.md` summarizing modifications. |
| **Dockerfile Adder** | Inserts a basic Dockerfile and optional GitHub Actions build workflow. |

### 4. **Pull Request Automation**
- PR probability configurable via `config.js`.
- Automatically pushes changes to the fork and opens a PR to the original repo.

### 5. **Logging**
- Keeps track of processed repositories in `fork-log.json` to prevent duplicates.

---

## ⚙️ Configuration

Configuration is handled via `config.js`:

```js
module.exports = {
  PR_PROBABILITY: 1, // 50% chance to open a PR
  MIN_STARS: 3, // Minimum number of stars
  MAX_STARS: 10, // Maximum number of stars
  ABANDONED_MONTHS: 6, // Inactive for this many months
  ALLOWED_LANGUAGES: ["JavaScript", "TypeScript"], // Target languages
  LICENSE: "mit", // Target license
  MAX_RESULTS: 10, // Max repos per API query
};
```

---

## 🔑 Environment Variables

Create a `.env` file in the project root with the following content:

```env
# GitHub API token (with repo & workflow permissions)
GITHUB_TOKEN=your_github_personal_access_token

# OpenAI API key (for AI-powered features)
OPENAI_API_KEY=your_openai_api_key

# Your GitHub username (bot will fork repos to this account)
GITHUB_USERNAME=your_github_username

# Default commit author details
COMMIT_AUTHOR_NAME=Bot Name
COMMIT_AUTHOR_EMAIL=bot@example.com
```

---

## 📦 Installation

```bash
# Clone this bot repository
git clone https://github.com/yourusername/github-fork-bot.git
cd github-fork-bot

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

---

## ▶️ Usage

Run the bot:

```bash
npm start
```

Or run a specific enhancement module:

```bash
node modules/ensureCI.js
node modules/openapiDoc.js
node src/tests/generateMissingTests.js
```

---

## 📂 Project Structure

```
github-fork-bot/
│
├── modules/
│   ├── ensureCI.js               # Ensures GitHub Actions CI workflow
│   ├── generateDynamicPRMessage.js# Generates detailed PR messages
│   ├── openapiDoc.js              # Generates openapi.json
│   └── securityPatcher.js         # Automated security fixes
│
├── src/
│   └── tests/
│       └── generateMissingTests.js # AI-assisted missing test generation
│
├── fork-log.json                  # Tracks processed repos
├── config.js                      # Main bot configuration
├── .env                           # Environment variables
├── package.json
└── README.md
```

---

## 🧠 How It Works

1. **Repository Discovery** → Finds repositories matching the criteria in `config.js`.
2. **Fork & Clone** → Forks the repo into your GitHub account, then clones locally.
3. **Apply Enhancements** → Runs each selected enhancement module.
4. **Commit & Push** → Pushes changes to your fork.
5. **Open Pull Request** → Optionally opens a PR to the original repository.
6. **Log Processed Repo** → Saves info in `fork-log.json`.

---

## ⚠️ Notes & Limitations
- The bot respects GitHub API rate limits (5000 requests/hour for authenticated calls).
- AI-powered features require a valid **OpenAI API key**.
- Some modules (like test generation) may skip very large or minified files.
- Pull requests are probabilistic based on `PR_PROBABILITY`.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE).
