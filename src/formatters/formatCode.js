const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function formatCode(targetDir = ".") {
  console.log("🎯 Code formatting started...");

  // ✅ Run Prettier
  try {
    execSync(`npx prettier --write "${targetDir}/**/*.{js,json,md}"`, {
      stdio: "inherit",
    });
    console.log("🎨 Prettier completed.");
  } catch (err) {
    console.warn("⚠️ Error while running Prettier:", err.message);
  }

  // 🔧 Copy ESLint config
  const configSrc = path.resolve("eslint.config.mjs");
  const configDest = path.join(targetDir, "eslint.config.mjs");
  let eslintConfigExists = false;

  if (fs.existsSync(configSrc)) {
    try {
      fs.copyFileSync(configSrc, configDest);
      eslintConfigExists = true;
      console.log(`🔧 Config copied: ${configDest}`);
    } catch (err) {
      console.warn("⚠️ Config could not be copied:", err.message);
    }
  }

  // ✅ ESLint fix (only if config exists)
  if (eslintConfigExists) {
    try {
      // Only meaningful files:
      const eslintIgnore = [
        "**/node_modules/**",
        "**/dist/**",
        "**/vendor/**",
        "**/*.min.js",
        "**/bundle.js",
        "**/shBrush*.js",
        "**/jquery*.js",
        "**/legacy/**",
      ];

      const ignorePattern = eslintIgnore
        .map((p) => `--ignore-pattern "${p}"`)
        .join(" ");

      execSync(
        `npx eslint "${targetDir}/**/*.js" ${ignorePattern} --config "${configDest}" --fix`,
        { stdio: "inherit" }
      );

      console.log("✅ ESLint fix completed.");
    } catch (err) {
      console.warn("⚠️ Error while running ESLint (ignored):", err.message);
    }
  }

  console.log("✅ Code formatting completed.");
}

module.exports = { formatCode };
