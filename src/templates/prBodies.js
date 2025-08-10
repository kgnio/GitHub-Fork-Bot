function getPRBodies(repoMeta = {}) {
  const {
    description = "No description provided.",
    language = "Unknown",
    stargazers_count = 0,
    pushed_at = null,
  } = repoMeta;

  const lastUpdated = pushed_at
    ? new Date(pushed_at).toLocaleDateString()
    : "N/A";

  return [
    `This pull request introduces several improvements aimed at enhancing code quality and maintainability.

**Key updates:**
- Reformatted code using consistent styling rules
- Refined README for improved structure and clarity
- Minor project structure adjustments where necessary

No business logic was altered.`,

    `This PR includes general improvements across the repository:

- Code formatting applied for consistency
- Documentation updated for better clarity
- Improved structural organization of files

These enhancements help keep the codebase clean and accessible.`,

    `Minor refactor and formatting pass:

- Aligned code with formatting standards
- Updated README layout and structure
- Ensured no breaking changes were introduced

Project meta:
• Language: ${language}
• Last Updated: ${lastUpdated}`,

    `General cleanup PR:

- Code formatted using Prettier-like conventions
- README content improved and structured
- Project files organized for better maintainability

This should improve readability and developer experience.`,

    `Housekeeping updates applied:

- Uniform formatting across all JavaScript files
- Refined README content and layout
- Improved structural clarity in the repo

Details:
• Description: ${description}
• Language: ${language}
• Last activity: ${lastUpdated}`,

    `This contribution focuses on non-functional improvements:

- Clean and consistent code formatting
- Enhanced README structure and content
- Polished file layout and indentation

These updates are safe to merge and intended to support maintainability.`,

    `Repository cleanup and documentation pass:

- Auto-formatting applied for code consistency
- Minor updates to the README for better readability
- Folder and file organization reviewed

Thanks for sharing your work! ✨`,
  ];
}

module.exports = { getPRBodies };
