// modules/optimizePackageJson.js
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function sh(c) {
  return execSync(c, { stdio: "pipe" }).toString();
}

function parseDepcheck(output) {
  // Simple extraction: list that comes after "Unused dependencies"
  const unused = [];
  const m = output.match(/Unused dependencies\s*:\s*([\s\S]*?)\n\n/);
  if (!m) return unused;
  const lines = m[1]
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const l of lines) {
    const pkg = l.replace(/[-*•]\s*/, "").trim();
    if (pkg) unused.push(pkg);
  }
  return unused;
}

function optimize(localPath, options = { removeUnused: false }) {
  const pkgPath = path.join(localPath, "package.json");
  if (!fs.existsSync(pkgPath))
    return { changed: false, reason: "no package.json" };

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  let changed = false;

  // Basic fields
  if (!pkg.name) {
    pkg.name = path
      .basename(localPath)
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-");
    changed = true;
  }
  if (!pkg.license) {
    pkg.license = "MIT";
    changed = true;
  }

  pkg.scripts = pkg.scripts || {};
  if (!pkg.scripts.lint) {
    pkg.scripts.lint = "eslint .";
    changed = true;
  }
  if (!pkg.scripts["format:check"]) {
    pkg.scripts["format:check"] = "prettier -c .";
    changed = true;
  }
  if (!pkg.scripts.format) {
    pkg.scripts.format = "prettier -w .";
    changed = true;
  }
  if (!pkg.scripts.test) {
    pkg.scripts.test = 'echo "No tests" && exit 0';
    changed = true;
  }

  // Repository field
  if (!pkg.repository) {
    const url = (() => {
      try {
        return sh(`git config --get remote.origin.url`).trim();
      } catch {
        return "";
      }
    })();
    if (url) {
      pkg.repository = { type: "git", url };
      changed = true;
    }
  }

  // depcheck → remove unused dependencies (optional)
  if (options.removeUnused) {
    try {
      const out = sh(`npx depcheck`);
      const unused = parseDepcheck(out);
      if (unused.length) {
        for (const u of unused) {
          if (pkg.dependencies?.[u]) {
            delete pkg.dependencies[u];
            changed = true;
          }
          if (pkg.devDependencies?.[u]) {
            delete pkg.devDependencies[u];
            changed = true;
          }
        }
      }
    } catch {
      /* ignore */
    }
  }

  if (changed) fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
  return { changed };
}

module.exports = { optimize };
