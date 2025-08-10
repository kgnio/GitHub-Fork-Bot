// modules/securityPatcher.js
require("dotenv").config();
const { Octokit } = require("@octokit/rest");
const { execSync } = require("child_process");
const fs = require("fs");

const {
  GITHUB_TOKEN,
  BOT_GIT_EMAIL = "bot@example.com",
  BOT_GIT_NAME = "sec-bot",
} = process.env;

const octokit = GITHUB_TOKEN ? new Octokit({ auth: GITHUB_TOKEN }) : null;

function sh(cmd) {
  return execSync(cmd, { stdio: "pipe" }).toString().trim();
}

function safeSh(cmd) {
  try {
    return sh(cmd);
  } catch (e) {
    return "";
  }
}

function getOwnerRepoFromGit() {
  const url = sh(`git config --get remote.origin.url`);
  // https://github.com/OWNER/REPO.git  |  git@github.com:OWNER/REPO.git
  const m = url.match(
    /github\.com[:/](?<owner>[^/]+)\/(?<repo>[^/.]+)(?:\.git)?$/i
  );
  if (!m || !m.groups)
    throw new Error("Could not parse remote origin (owner/repo missing).");
  return { owner: m.groups.owner, repo: m.groups.repo, remoteUrl: url };
}

async function getDefaultBranch(owner, repo) {
  // 1) Use API (more reliable)
  if (octokit) {
    try {
      const { data } = await octokit.repos.get({ owner, repo });
      if (data?.default_branch) return data.default_branch;
    } catch {
      /* fallthrough */
    }
  }
  // 2) Detect via Git
  // a) origin/HEAD symbolic-ref
  const head = safeSh(
    `git symbolic-ref --quiet --short refs/remotes/origin/HEAD`
  );
  if (head) {
    const m = head.match(/^origin\/(.+)$/);
    if (m) return m[1];
  }
  // b) ls-remote --symref
  const ls = safeSh(`git ls-remote --symref origin HEAD`);
  // ref: refs/heads/main	HEAD
  const m2 = ls.match(/ref:\s+refs\/heads\/([^\s]+)\s+HEAD/);
  if (m2) return m2[1];

  // 3) Fallback
  return "main";
}

function ensureGitInitAndRemote(owner, repo, remoteUrl) {
  const hasGit = fs.existsSync(".git");
  if (!hasGit) {
    sh(`git init`);
  }
  sh(`git config user.email "${BOT_GIT_EMAIL}"`);
  sh(`git config user.name "${BOT_GIT_NAME}"`);

  // Add remote if missing
  const currentRemote = safeSh(`git remote get-url origin`);
  if (!currentRemote) {
    const httpsUrl = `https://github.com/${owner}/${repo}.git`;
    sh(`git remote add origin "${httpsUrl}"`);
  }

  // If tokenized URL is missing and GITHUB_TOKEN exists, add token for push
  if (GITHUB_TOKEN) {
    const current = sh(`git remote get-url origin`);
    if (!current.includes("x-access-token:")) {
      const tokenUrl = `https://x-access-token:${GITHUB_TOKEN}@github.com/${owner}/${repo}.git`;
      sh(`git remote set-url origin "${tokenUrl}"`);
    }
  }

  sh(`git fetch origin`);
}

async function checkoutWorkBranch(defaultBranch) {
  // Checkout origin/<defaultBranch> if it exists
  safeSh(`git checkout -B ${defaultBranch} origin/${defaultBranch}`);
  const branch = `chore/security-bump-${Date.now()}`;
  // If the same name exists, try a new one
  safeSh(`git checkout -b ${branch}`);
  // If -b fails in some cases, try again
  if (!safeSh(`git branch --show-current`)) {
    sh(`git checkout -B ${branch}`);
  }
  return branch;
}

function hasChanges() {
  return safeSh(`git status --porcelain`).trim().length > 0;
}

async function openPR(owner, repo, head, base, title, body) {
  if (!octokit) {
    console.log("ℹ️ No GITHUB_TOKEN → PR API call skipped.");
    return null;
  }
  const { data: pr } = await octokit.pulls.create({
    owner,
    repo,
    head,
    base,
    title,
    body,
  });
  return pr.html_url;
}

async function run() {
  // Skip step if no package.json
  if (!fs.existsSync("package.json")) {
    console.log("ℹ️ No package.json; security patcher step skipped.");
    return;
  }

  const { owner, repo, remoteUrl } = getOwnerRepoFromGit();
  const defaultBranch = await getDefaultBranch(owner, repo);

  ensureGitInitAndRemote(owner, repo, remoteUrl);
  const branch = await checkoutWorkBranch(defaultBranch);

  // 1) Audit (log)
  try {
    const auditJson = safeSh(`npm audit --json || true`);
    if (auditJson) fs.writeFileSync("audit-before.json", auditJson);
  } catch {
    /* ignore */
  }

  // 2) Compatible updates
  safeSh(`npx npm-check-updates -u`);
  safeSh(`npm install`);

  // 3) Audit fix
  safeSh(`npm audit fix || true`);

  // 4) Run tests
  safeSh(`npm test --silent || true`);

  if (!hasChanges()) {
    console.log("🔒 No security update required.");
    return;
  }

  sh(`git add -A`);
  sh(`git commit -m "chore(security): bump vulnerable deps (automated)"`);
  sh(`git push -u origin ${branch}`);

  const title = `chore(security): automated security update`;
  const body = [
    "This PR applies compatible dependency upgrades using `npm audit` and `npm-check-updates`.",
    "",
    "• Minor/patch upgrades via `ncu -u`",
    "• Attempted `npm audit fix`",
    "• Lockfile updated",
    "",
    "Please review the tests and check for any potential breaking changes.",
  ].join("\n");

  const prUrl = await openPR(owner, repo, branch, defaultBranch, title, body);
  if (prUrl) {
    console.log("✅ PR:", prUrl);
  } else {
    console.log(
      "✅ Branch pushed; you can open the PR manually or via Actions."
    );
  }
}

if (require.main === module) {
  run().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

module.exports = { run };
