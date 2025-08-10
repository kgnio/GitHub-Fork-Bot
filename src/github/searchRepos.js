require("dotenv").config();
const axios = require("axios");
const { isAlreadyProcessed } = require("../utils/forkLogger");
const config = require("../config");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const github = axios.create({
  baseURL: "https://api.github.com",
  headers: {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
  },
});

/**
 * Returns the ISO date string for X months ago from today.
 * @param {number} months
 */
function getXMonthsAgo(months) {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date.toISOString().split("T")[0];
}

/**
 * Checks the GitHub API rate limit and waits if close to the limit.
 * @param {object} headers - HTTP response headers from GitHub API
 */
async function checkRateLimit(headers) {
  const remaining = parseInt(headers["x-ratelimit-remaining"]);
  const reset = parseInt(headers["x-ratelimit-reset"]) * 1000;
  const now = Date.now();

  if (remaining < 5) {
    const waitTime = reset - now + 1000;
    const seconds = Math.ceil(waitTime / 1000);
    console.log(
      `⚠️ Approaching GitHub API rate limit, waiting ${seconds} seconds...`
    );
    await new Promise((r) => setTimeout(r, waitTime));
  }
}

/**
 * Searches for repositories that match the configuration criteria.
 * - Language: must be in ALLOWED_LANGUAGES
 * - Stars: between MIN_STARS and MAX_STARS
 * - Last push: older than ABANDONED_MONTHS
 * - License: must match LICENSE
 * - Not archived, public, and not forks
 *
 * @returns {Promise<Array>} Array of matching repository objects
 */
async function searchRepos() {
  const allResults = [];

  for (const lang of config.ALLOWED_LANGUAGES) {
    const query = [
      `language:${lang}`,
      `stars:${config.MIN_STARS}..${config.MAX_STARS}`,
      `pushed:<${getXMonthsAgo(config.ABANDONED_MONTHS)}`,
      "archived:false",
      "is:public",
      "fork:false",
      `license:${config.LICENSE}`,
    ].join(" ");

    const randomPage = Math.floor(Math.random() * 29) + 1;
    const pagesToTry = [randomPage, randomPage + 1];

    for (const page of pagesToTry) {
      try {
        const response = await github.get("/search/repositories", {
          params: {
            q: query,
            sort: "updated",
            order: "asc",
            per_page: 30,
            page,
          },
        });

        await checkRateLimit(response.headers);

        const items = response?.data?.items || [];
        if (items.length === 0) {
          console.log(`ℹ️ No results found for language: ${lang}`);
          continue;
        }

        // Shuffle results to get more random variety
        const shuffled = items.sort(() => Math.random() - 0.5);

        const filtered = shuffled
          .filter((repo) => {
            const already = isAlreadyProcessed(repo.full_name);
            if (already) console.log("⏭️ Already processed:", repo.full_name);
            return !already;
          })
          .map((repo) => ({
            full_name: repo.full_name,
            clone_url: repo.clone_url,
            html_url: repo.html_url,
            default_branch: repo.default_branch,
            language: repo.language,
            description: repo.description,
            created_at: repo.created_at,
            pushed_at: repo.pushed_at,
            stargazers_count: repo.stargazers_count,
            owner: repo.owner,
          }));

        allResults.push(...filtered);
      } catch (error) {
        console.error(
          `❌ Error searching repositories (language: ${lang}):`,
          error.response?.data || error.message
        );
      }
    }
  }

  console.log("🔍 Total matching repositories:", allResults.length);
  allResults.forEach((r, i) =>
    console.log(`${i + 1}. ${r.full_name} (${r.stargazers_count}⭐)`)
  );

  return allResults;
}

module.exports = { searchRepos };
