const fs = require("fs");
const path = require("path");
const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function checkAndAddLicense(owner, repo) {
  try {
    // First, check repository contents
    const { data: contents } = await octokit.repos.getContent({
      owner,
      repo,
      path: "",
    });

    const hasLicense = contents.some((item) =>
      item.name.toLowerCase().startsWith("license")
    );

    if (hasLicense) {
      console.log("📄 License already exists, not added.");
      return false;
    }

    const licenseTemplate = fs.readFileSync(
      path.join(__dirname, "..", "src", "templates", "LICENSE_MIT.txt"),
      "utf8"
    );

    const year = new Date().getFullYear();
    const author = owner;

    const licenseContent = licenseTemplate
      .replace("{{YEAR}}", year)
      .replace("{{AUTHOR}}", author);

    const branchName = "add-license";

    const { data: repoData } = await octokit.repos.get({ owner, repo });
    const baseBranch = repoData.default_branch;

    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${baseBranch}`,
    });

    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: refData.object.sha,
    });

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: "LICENSE",
      message: "Add MIT License",
      content: Buffer.from(licenseContent).toString("base64"),
      branch: branchName,
    });

    await octokit.pulls.create({
      owner,
      repo,
      head: branchName,
      base: baseBranch,
      title: "chore: add MIT LICENSE",
      body: "This PR adds an MIT License to the project.",
    });

    console.log("✅ LICENSE file added and PR created.");
    return true;
  } catch (err) {
    console.error("Error while adding LICENSE:", err.message);
    return false;
  }
}

module.exports = { checkAndAddLicense };
