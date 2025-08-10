const { Octokit } = require("@octokit/rest");
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function checkAndFixScaffolding(owner, repo) {
  const foldersToCheck = ["src", "tests", "docs"];
  const branchName = "scaffold-structure";

  const { data: repoData } = await octokit.repos.get({ owner, repo });
  const defaultBranch = repoData.default_branch;

  const { data: refData } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${defaultBranch}`,
  });

  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha: refData.object.sha,
  });

  for (const folder of foldersToCheck) {
    try {
      await octokit.repos.getContent({ owner, repo, path: folder });
      console.log(`${folder}/ already exists`);
    } catch (err) {
      await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: `${folder}/README.md`,
        message: `Create ${folder}/ structure`,
        content: Buffer.from(
          `# ${folder}/\n\nThis folder was added to improve project structure.`
        ).toString("base64"),
        branch: branchName,
      });
      console.log(`${folder}/ folder created with README.md`);
    }
  }

  await octokit.pulls.create({
    owner,
    repo,
    title: "chore: add standard folder structure (src, tests, docs)",
    head: branchName,
    base: defaultBranch,
    body: "This PR introduces a basic project scaffolding: `src/`, `tests/`, and `docs/` folders with placeholder README files.",
  });

  console.log("✅ Scaffolding PR created.");
}

module.exports = { checkAndFixScaffolding };
