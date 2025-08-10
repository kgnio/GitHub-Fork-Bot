// src/modules/openapiIntegrate.js
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Generates openapi.json (in your structure, located under src/security)
const { generate } = require("../security/openapiDoc");

/**
 * Safely writes a file, ensuring parent directories exist.
 * @param {string} p - File path
 * @param {string|Buffer} content - File content
 */
function writeFileSafe(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
}

/**
 * Checks if a file exists by joining the provided path parts.
 * @param {...string} parts - Path segments
 * @returns {boolean}
 */
function fileExists(...parts) {
  return fs.existsSync(path.join(...parts));
}

/**
 * Attempts to detect an Express.js entry file in the project.
 * Looks for common filenames and checks if they use express().
 * @param {string} cwd - Project root directory
 * @returns {{file: string, code: string} | null}
 */
function detectExpressEntry(cwd) {
  const candidates = [
    "app.js",
    "server.js",
    "src/app.js",
    "src/server.js",
    "index.js",
    "src/index.js",
  ];

  for (const c of candidates) {
    const full = path.join(cwd, c);
    if (fs.existsSync(full)) {
      const text = fs.readFileSync(full, "utf8");
      if (/\bexpress\(/.test(text)) return { file: full, code: text };
    }
  }
  return null;
}

/**
 * Ensures Swagger UI integration is added to the Express app entry file.
 * Idempotent: will not duplicate insertion if already present.
 * @param {string} entryPath - Entry file path
 * @param {string} code - Current file content
 * @returns {string} - Modified file content
 */
function ensureSwaggerUiPatched(entryPath, code) {
  const MARK = "/*__AUTO__SWAGGER_UI__*/";
  if (code.includes(MARK)) return code; // Already patched

  // Calculate relative path from entry to docs/openapi.json
  const relToDocs = path
    .relative(
      path.dirname(entryPath),
      path.join(process.cwd(), "docs", "openapi.json")
    )
    .replace(/\\/g, "/");

  const rel = relToDocs.startsWith(".") ? relToDocs : "./" + relToDocs;

  const importBlock = `
${MARK}
const swaggerUi = require("swagger-ui-express");
const openapiSpec = require("${rel}");
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openapiSpec));
${MARK}
`;

  // Insert after `const app = express();`
  if (/\bconst\s+app\s*=\s*express\(\)\s*;?/.test(code)) {
    return code.replace(
      /\bconst\s+app\s*=\s*express\(\)\s*;?/,
      (m) => `${m}\n${importBlock}`
    );
  }

  // Fallback: append at the end of the file
  return code + "\n" + importBlock + "\n";
}

/**
 * Adds API documentation reference to the README file.
 * @param {string} cwd - Project root directory
 * @returns {boolean} - True if README was modified or created
 */
function ensureReadmeApiDocs(cwd) {
  const readme = path.join(cwd, "README.md");
  const SIGN = "<!-- AUTO_API_DOCS -->";
  const block = `\n${SIGN}\n## API Documentation\nSwagger UI endpoint: \`/docs\`\n${SIGN}\n`;

  if (fileExists(readme)) {
    const txt = fs.readFileSync(readme, "utf8");
    if (!txt.includes(SIGN)) {
      fs.writeFileSync(readme, txt + block);
      return true;
    }
    return false;
  } else {
    fs.writeFileSync(readme, `# Project\n${block}`);
    return true;
  }
}

/**
 * Installs swagger-ui-express if it is not already installed.
 * @returns {boolean} - True if installed, false if already present or failed
 */
function ensureSwaggerUiDependencyInstalled() {
  const pkgPath = path.join("package.json");
  if (!fs.existsSync(pkgPath)) return false;

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const allDeps = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  };

  if (!allDeps["swagger-ui-express"]) {
    try {
      execSync("npm i swagger-ui-express --save", { stdio: "pipe" });
      return true;
    } catch (e) {
      console.warn("Warning: Failed to install swagger-ui-express:", e.message);
      return false;
    }
  }
  return false;
}

/**
 * Runs the OpenAPI integration process for the given project.
 * 1. Generates openapi.json and moves it to docs/
 * 2. Ensures swagger-ui-express is installed
 * 3. Patches the Express entry file with Swagger UI setup
 * 4. Updates README with API docs section
 * @param {string} localPath - Project root directory
 */
async function runOpenApiIntegrate(localPath) {
  const prev = process.cwd();
  process.chdir(localPath);

  try {
    // 1) Generate OpenAPI spec → docs/openapi.json
    generate(); // src/security/openapiDoc.js
    if (fs.existsSync("openapi.json")) {
      const spec = fs.readFileSync("openapi.json");
      writeFileSafe(path.join("docs", "openapi.json"), spec);
      fs.rmSync("openapi.json", { force: true });
    }

    // 2) Ensure swagger-ui-express dependency
    ensureSwaggerUiDependencyInstalled();

    // 3) Patch Express entry point
    const entry = detectExpressEntry(process.cwd());
    if (entry) {
      const patched = ensureSwaggerUiPatched(entry.file, entry.code);
      if (patched !== entry.code) fs.writeFileSync(entry.file, patched);
    }

    // 4) Ensure README includes API docs reference
    ensureReadmeApiDocs(process.cwd());
  } finally {
    process.chdir(prev);
  }
}

module.exports = { runOpenApiIntegrate };
