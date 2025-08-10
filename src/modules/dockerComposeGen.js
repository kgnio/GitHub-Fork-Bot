// modules/dockerComposeGen.js
const fs = require("fs");
const path = require("path");

/**
 * Detects if a project uses MongoDB or Redis by scanning its package.json dependencies.
 * @param {string} localPath - Path to the project directory
 * @returns {{ mongo: boolean, redis: boolean }}
 */
function detectDeps(localPath) {
  const pkgPath = path.join(localPath, "package.json");
  if (!fs.existsSync(pkgPath)) return { mongo: false, redis: false };

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  const deps = Object.keys(allDeps || {});

  const mongo = deps.some((d) => ["mongodb", "mongoose"].includes(d));
  const redis = deps.includes("redis");

  return { mongo, redis };
}

/**
 * Generates a docker-compose.yml string based on detected dependencies.
 * @param {{ mongo: boolean, redis: boolean }} flags
 * @returns {string} docker-compose.yml content
 */
function composeYaml({ mongo, redis }) {
  const mongoBlock = mongo
    ? `
  mongo:
    image: mongo:7
    restart: unless-stopped
    ports: ["27017:27017"]
    volumes:
      - mongo_data:/data/db
`
    : "";

  const redisBlock = redis
    ? `
  redis:
    image: redis:7
    restart: unless-stopped
    ports: ["6379:6379"]
`
    : "";

  return `version: "3.9"
services:
  app:
    build: .
    command: npm start
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:${mongo || redis ? "" : " []"}
      ${mongo ? "- mongo" : ""}
      ${redis ? "\n      - redis" : ""}

${mongoBlock}${redisBlock}
volumes:
  mongo_data:
`;
}

/**
 * Ensures a docker-compose.yml file exists in the project directory.
 * If it doesn’t exist, it will be generated based on dependencies.
 * @param {string} localPath - Path to the project directory
 * @returns {boolean} - True if a file was created, false if it already existed
 */
function ensureCompose(localPath) {
  const composePath = path.join(localPath, "docker-compose.yml");
  if (fs.existsSync(composePath)) return false;

  const flags = detectDeps(localPath);
  const yml = composeYaml(flags);
  fs.writeFileSync(composePath, yml);

  return true;
}

module.exports = { ensureCompose };
