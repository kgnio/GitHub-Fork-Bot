// test.js
require("dotenv").config();
const fs = require("fs");
const path = require("path");

const { ensureCI } = require("./modules/ensureCI");
const { ensureCompose } = require("./modules/dockerComposeGen");
const { optimize } = require("./modules/optimizePackageJson");
const { generate } = require("./modules/openapiDoc");

async function main() {
  console.log("🧪 Starting local smoke test...");

  // create a sandbox folder to avoid touching repo files
  const sandbox = path.join(process.cwd(), "tmp-smoke-sandbox");
  if (!fs.existsSync(sandbox)) fs.mkdirSync(sandbox, { recursive: true });

  // 1) minimal package.json (with mongo/redis to exercise docker-compose generation)
  const pkg = {
    name: "sandbox-proj",
    version: "0.0.0",
    private: true,
    scripts: { start: "node index.js" },
    dependencies: {
      mongodb: "^6.9.0",
      redis: "^4.6.14",
    },
  };
  fs.writeFileSync(
    path.join(sandbox, "package.json"),
    JSON.stringify(pkg, null, 2),
    "utf8"
  );

  // 2) write a tiny express app with swagger JSDoc-annotated route
  const srcDir = path.join(sandbox, "src", "routes");
  fs.mkdirSync(srcDir, { recursive: true });

  const routeContent = `/**
 * @swagger
 * /ping:
 *   get:
 *     summary: Health check
 *     responses:
 *       200:
 *         description: pong
 */
module.exports = function register(app) {
  app.get('/ping', (req, res) => res.send('pong'));
};
`;
  fs.writeFileSync(path.join(srcDir, "ping.js"), routeContent, "utf8");

  // 3) generate OpenAPI spec (outputs openapi.json in CWD)
  const prevCwd = process.cwd();
  process.chdir(sandbox);
  try {
    generate(); // modules/openapiDoc.js -> writes openapi.json to current dir
    console.log("📘 openapi.json generated in sandbox.");
  } catch (e) {
    console.warn("⚠️ Failed to generate openapi.json:", e.message);
  } finally {
    process.chdir(prevCwd);
  }

  // 4) ensure CI workflow exists
  try {
    const created = ensureCI(sandbox);
    console.log(
      created ? "✅ CI workflow created." : "ℹ️ CI workflow already existed."
    );
  } catch (e) {
    console.warn("⚠️ ensureCI error:", e.message);
  }

  // 5) ensure docker-compose.yml
  try {
    const created = ensureCompose(sandbox);
    console.log(
      created
        ? "✅ docker-compose.yml generated."
        : "ℹ️ docker-compose.yml already existed."
    );
  } catch (e) {
    console.warn("⚠️ ensureCompose error:", e.message);
  }

  // 6) optimize package.json
  try {
    const res = optimize(sandbox, { removeUnused: false });
    console.log(
      res.changed
        ? "✅ package.json optimized."
        : "ℹ️ package.json already optimal."
    );
  } catch (e) {
    console.warn("⚠️ optimizePackageJson error:", e.message);
  }

  // 7) summary
  const produced = [
    path.join(sandbox, "openapi.json"),
    path.join(sandbox, ".github", "workflows", "ci.yml"),
    path.join(sandbox, "docker-compose.yml"),
    path.join(sandbox, "package.json"),
  ].filter(fs.existsSync);

  console.log("🧾 Smoke test produced:");
  produced.forEach((p) => console.log(" - " + path.relative(process.cwd(), p)));

  console.log("✅ Smoke test finished.");
}

main().catch((e) => {
  console.error("Test script failed:", e);
  process.exit(1);
});
