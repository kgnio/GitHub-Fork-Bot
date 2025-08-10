const fs = require("fs");
const path = require("path");

/**
 * Recursively walks a directory and returns all .js files
 * @param {string} dir - Starting directory
 * @returns {string[]} - List of file paths
 */
function _walkDir(dir) {
  let results = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) {
      results = results.concat(_walkDir(full));
    } else if (name.endsWith(".js")) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Adds basic JSDoc comment blocks above every
 * - function declarations  (function foo(bar) { … })
 * - arrow functions       (const foo = (bar) => { … })
 *
 * @param {string} repoPath - Root of the cloned repository
 */
async function addJsDocComments(repoPath) {
  const files = _walkDir(repoPath);

  for (const filePath of files) {
    let content = fs.readFileSync(filePath, "utf8");

    // normal function declarations
    const fnDecl = /(^|\n)(\s*)function\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*\{/g;
    content = content.replace(fnDecl, (match, nl, indent, name, params) => {
      const paramsArr = params
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);

      const doc = [
        `${indent}/**`,
        `${indent} * ${name} – automatically documented`,
        ...paramsArr.map((p) => `${indent} * @param {*} ${p}`),
        `${indent} * @returns {*} `,
        `${indent} */`,
      ];

      return `${nl}${doc.join("\n")}\n${indent}function ${name}(${params}) {`;
    });

    // arrow function expressions
    const arrowDecl =
      /(^|\n)(\s*)(const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*\(([^)]*)\)\s*=>\s*\{/g;
    content = content.replace(
      arrowDecl,
      (match, nl, indent, kind, name, params) => {
        const paramsArr = params
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean);

        const doc = [
          `${indent}/**`,
          `${indent} * ${name} – automatically documented arrow function`,
          ...paramsArr.map((p) => `${indent} * @param {*} ${p}`),
          `${indent} * @returns {*} `,
          `${indent} */`,
        ];

        return `${nl}${doc.join("\n")}\n${indent}${kind} ${name} = (${params}) => {`;
      }
    );

    fs.writeFileSync(filePath, content, "utf8");
  }

  console.log(`✨ JSDoc comments added in ${files.length} JS file(s).`);
}

module.exports = { addJsDocComments };
