const fs = require("fs");
const path = require("path");

function createDockerfile(repoPath) {
  const dockerfilePath = path.join(repoPath, "Dockerfile");

  const dockerfileContent = `
FROM node:20
WORKDIR /app
COPY . .
RUN npm install || true
CMD ["npm", "start"]
  `.trimStart();

  fs.writeFileSync(dockerfilePath, dockerfileContent, "utf8");
  console.log("📦 Dockerfile added.");
}

module.exports = { createDockerfile };
