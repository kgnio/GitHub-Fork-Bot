// src/github/forkRepo.js
require("dotenv").config();
const axios = require("axios");

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const github = axios.create({
  baseURL: "https://api.github.com",
  headers: {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
  },
});

/**
 * Fork operation
 * @param {string} fullName - Example: "user/repo"
 * @returns {object|null}
 */
async function forkRepo(fullName) {
  try {
    console.log(`🔁 Forking: ${fullName}`);
    const response = await github.post(`/repos/${fullName}/forks`);
    const forkedRepo = response.data;
    console.log(`✅ Fork successful: ${forkedRepo.full_name}`);
    return forkedRepo;
  } catch (err) {
    console.error("❌ Error during fork:", err.response?.data || err.message);
    return null;
  }
}

module.exports = { forkRepo };
