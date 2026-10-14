---
name: github-workflow
description: >-
  Use this skill whenever making code changes, enhancements, or bug fixes to the ani-stream repository.
  Enforces the rule to always create a GitHub Issue first, create a feature branch, commit and push
  using the stored GitHub token, and raise a Pull Request (PR) linking back to the issue.
---

# GitHub Issue & Pull Request Workflow

This skill standardizes the git development lifecycle for `ani-stream` using the GitHub Personal Access Token stored in `.env`.

## Mandatory Rules

Every code modification must follow this 5-step sequence:
1. **Create an Issue**: Never push changes directly without an associated issue.
2. **Branch**: Create a new branch `feat/issue-<num>-<slug>` or `fix/issue-<num>-<slug>`.
3. **Commit**: Write descriptive commit messages referencing the issue (`closes #<num>`).
4. **Push**: Push the branch to GitHub using the authenticated remote.
5. **Raise a PR**: Open a Pull Request from the branch into `main` linking to the issue.

---

## Automation Helper Script

The workspace provides an automated CLI helper located at:
`[github-helper.js](./scripts/github-helper.js)`

### Available Commands:

```bash
# 1. Verify token & repo connection
node .agents/skills/github-workflow/scripts/github-helper.js verify

# 2. Create a new issue (returns issue number)
node .agents/skills/github-workflow/scripts/github-helper.js create-issue "Issue title" "Description of what needs to be changed"

# 3. Create a Pull Request (links to the issue automatically)
node .agents/skills/github-workflow/scripts/github-helper.js create-pr "<branchName>" "PR title" "Summary of changes" <issueNumber>
```

---

## Detailed Step-by-Step Procedure

### Step 1: Create the GitHub Issue
Run the helper script to create the issue:
```bash
node .agents/skills/github-workflow/scripts/github-helper.js create-issue "Add episode search filter" "Enable searching within episode list on detail view."
```
*Note the returned Issue number (e.g., `#1`).*

### Step 2: Create and Switch to a Feature Branch
```bash
git checkout -b feat/issue-1-episode-filter
```

### Step 3: Stage and Commit Changes
```bash
git add <files>
git commit -m "feat: add episode search filter (closes #1)"
```

### Step 4: Push Branch to GitHub
Push the branch to origin using the authenticated token remote:
```bash
git push -u origin feat/issue-1-episode-filter
```

### Step 5: Raise the Pull Request
Run the helper script to open the Pull Request:
```bash
node .agents/skills/github-workflow/scripts/github-helper.js create-pr "feat/issue-1-episode-filter" "feat: add episode search filter" "Resolves issue #1 with live search filter." 1
```

---

## Security Guidelines

- **NEVER** commit or stage `.env` or files containing raw tokens.
- Always check `git status` prior to committing to ensure `.env` is ignored.
- Use `.env.example` when sharing configuration templates.
