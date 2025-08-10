// modules/openapiDoc.js
const swaggerJSDoc = require("swagger-jsdoc");
const fs = require("fs");

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "API",
      version: "1.0.0",
      description: "Auto-generated OpenAPI spec",
    },
  },
  apis: ["src/routes/**/*.js", "src/controllers/**/*.js"],
};

function generate() {
  const spec = swaggerJSDoc(options);
  fs.writeFileSync("openapi.json", JSON.stringify(spec, null, 2));
  console.log("✅ openapi.json generated");
}

if (require.main === module) generate();
module.exports = { generate };
