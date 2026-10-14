# AniStream Development Rules & Workflow Protocol

## 🚨 Git Workflow Rules (Mandatory)

Whenever proposing, generating, or committing code changes for this repository:

1. **GitHub Issue First:**
   - Always create a GitHub Issue before creating a branch or writing the final patch.
   - Describe the bug, feature, or enhancement in the issue.
   - You can use the helper script:
     ```bash
     node .agents/skills/github-workflow/scripts/github-helper.js create-issue "<title>" "<body>"
     ```

2. **Branching Strategy:**
   - Never push directly to `main` for new features or bug fixes.
   - Create a dedicated branch off `main`:
     - Features: `feat/issue-<number>-<short-description>`
     - Fixes: `fix/issue-<number>-<short-description>`

3. **Commit Conventions:**
   - Commit messages must follow conventional commits and link to the issue:
     - Example: `feat: implement episode search bar (closes #2)`
     - Example: `fix: handle corrupted streaming server urls (closes #3)`

4. **Pushing Code:**
   - Push the feature branch to origin:
     ```bash
     git push -u origin <branch-name>
     ```

5. **Raise a Pull Request (PR):**
   - After pushing the branch, immediately create a Pull Request targeting `main`.
   - Ensure the PR body contains `Closes #<number>` or `Fixes #<number>`.
   - You can use the helper script:
     ```bash
     node .agents/skills/github-workflow/scripts/github-helper.js create-pr "<branch-name>" "<title>" "<body>" <issue-number>
     ```

6. **Security & Credentials:**
   - **NEVER** commit `.env` or any sensitive tokens to git.
   - The token stored in `.env` (`GITHUB_TOKEN`) must only be used locally or via the automation scripts.
