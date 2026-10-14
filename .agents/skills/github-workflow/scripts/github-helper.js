#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════
   AniStream — GitHub Workflow Automation Helper
   Handles Issue creation, branching, committing, pushing,
   and Pull Request (PR) generation via GitHub REST API.
   ══════════════════════════════════════════════════════════ */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../../../../');

// Parse .env file manually without requiring dotenv package
function loadEnv() {
  const envPath = path.join(ROOT_DIR, '.env');
  const env = {};
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
        env[key] = val;
      }
    }
  }
  return env;
}

const env = loadEnv();
const TOKEN = process.env.GITHUB_TOKEN || env.GITHUB_TOKEN;
const OWNER = process.env.GITHUB_OWNER || env.GITHUB_OWNER || 'jaydeep9881';
const REPO = process.env.GITHUB_REPO || env.GITHUB_REPO || 'ani-stream';

if (!TOKEN) {
  console.error('❌ Error: GITHUB_TOKEN not found in .env file or environment.');
  process.exit(1);
}

function githubRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: endpoint,
      method: method,
      headers: {
        'User-Agent': 'AniStream-Workflow-Bot',
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      }
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body || '{}');
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`GitHub API Error (${res.statusCode}): ${parsed.message || body}`));
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${body}`));
        }
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function verify() {
  console.log(`🔍 Verifying GitHub Token for repository ${OWNER}/${REPO}...`);
  try {
    const user = await githubRequest('GET', '/user');
    console.log(`✅ Authenticated as: ${user.login} (${user.name || user.login})`);

    const repoInfo = await githubRequest('GET', `/repos/${OWNER}/${REPO}`);
    console.log(`✅ Repository connected: ${repoInfo.full_name} [${repoInfo.private ? 'Private' : 'Public'}]`);
    console.log(`   Default branch: ${repoInfo.default_branch}`);
    console.log(`   Permissions: Admin=${repoInfo.permissions?.admin}, Push=${repoInfo.permissions?.push}`);
  } catch (err) {
    console.error('❌ Verification failed:', err.message);
    process.exit(1);
  }
}

async function createIssue(title, body) {
  if (!title) {
    console.error('Usage: node github-helper.js create-issue <title> [body]');
    process.exit(1);
  }
  console.log(`📝 Creating GitHub Issue: "${title}"...`);
  try {
    const issue = await githubRequest('POST', `/repos/${OWNER}/${REPO}/issues`, {
      title,
      body: body || 'Issue created automatically by AniStream development workflow.'
    });
    console.log(`✅ Issue #${issue.number} created successfully!`);
    console.log(`   URL: ${issue.html_url}`);
    return issue;
  } catch (err) {
    console.error('❌ Failed to create issue:', err.message);
    process.exit(1);
  }
}

async function createPR(headBranch, title, body, issueNumber) {
  if (!headBranch || !title) {
    console.error('Usage: node github-helper.js create-pr <headBranch> <title> [body] [issueNumber]');
    process.exit(1);
  }

  let prBody = body || '';
  if (issueNumber) {
    prBody += `\n\nCloses #${issueNumber}`;
  }

  console.log(`🔀 Creating Pull Request from "${headBranch}" into "main"...`);
  try {
    const pr = await githubRequest('POST', `/repos/${OWNER}/${REPO}/pulls`, {
      title,
      head: headBranch,
      base: 'main',
      body: prBody
    });
    console.log(`✅ Pull Request #${pr.number} created successfully!`);
    console.log(`   URL: ${pr.html_url}`);
    return pr;
  } catch (err) {
    console.error('❌ Failed to create Pull Request:', err.message);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'verify':
    verify();
    break;
  case 'create-issue':
    createIssue(args[1], args[2]);
    break;
  case 'create-pr':
    createPR(args[1], args[2], args[3], args[4]);
    break;
  default:
    console.log(`
AniStream GitHub Automation CLI
Commands:
  verify                                      - Test token and check repository access
  create-issue <title> [body]                 - Create a new GitHub issue
  create-pr <branch> <title> [body] [issue#]  - Create a Pull Request into main
    `);
}
