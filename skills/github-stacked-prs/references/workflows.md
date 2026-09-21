# Native Stack Workflows

Use these workflows as patterns. Confirm current command syntax with `gh stack <command> --help` because the feature is in public preview.

## Install and inspect the official extension

```bash
gh extension install github/gh-stack
gh auth status
gh stack --help
```

Installation is needed only for local `gh stack` management. Read-only remote inspection can use `gh api` without installing the extension.

## Create a new stack

Start from a clean trunk and create the bottom layer:

```bash
git switch main
git pull --ff-only
gh stack init --base main feature-foundation
```

Commit the bottom layer, add the next layer, and repeat:

```bash
git add <paths>
git commit -m "Add feature foundation"

gh stack add feature-api
# Implement and commit the API layer.

gh stack add feature-ui
# Implement and commit the UI layer.
```

Submit the stack:

```bash
gh stack submit
```

The interactive submit flow lets the user set each PR's title, description, and draft state. In automation, `gh stack submit --auto` creates new PRs as drafts unless `--open` is also supplied. Preserve the user's intended review state.

## Adopt existing branches or PRs

For an existing branch chain, provide every branch in bottom-to-top order:

```bash
gh stack link --base main feature-foundation feature-api feature-ui
```

For existing PRs:

```bash
gh stack link 101 102 103
```

To append PRs or branches to an existing native stack, provide its stack number first:

```bash
gh stack link STACK_NUMBER 104 feature-docs
```

`gh stack link` updates GitHub but intentionally creates no local tracking. To fetch and track a remote stack locally, use a PR, branch, URL, or stack number:

```bash
gh stack checkout PR_NUMBER
gh stack view --short
```

After linking, verify each pull request's `stack.position`, `stack.size`, base, and head. A branch chain without that metadata is only a conventional series of dependent PRs.

## Navigate and review

```bash
gh stack bottom
gh stack down
gh stack up
gh stack top
gh stack switch
gh stack checkout BRANCH_NAME
gh stack view --short
```

Review the lowest layer first unless there is a reason to review layers in parallel. Approval does not require immediate merge; a reviewer may approve the bottom layer and continue upward while the full stack remains open.

## Address feedback on a lower layer

Check out the owning layer, make the smallest coherent fix, and commit it:

```bash
gh stack checkout feature-foundation
git add <paths>
git commit -m "Address foundation review feedback"
```

Cascade the changed history upward and push it safely:

```bash
gh stack rebase --upstack
gh stack push
```

For a full refresh against a moved trunk:

```bash
gh stack rebase
gh stack push
```

If a rebase stops at a conflict:

```bash
# Resolve files, then:
git add <resolved-paths>
gh stack rebase --continue

# Or restore the pre-rebase state:
gh stack rebase --abort
```

The website's **Rebase stack** action performs a server-side cascading rebase. Prefer the CLI when signed commits are required.

## Restructure a stack

Use the interactive stack editor to reorder, insert, drop, fold, or rename layers:

```bash
gh stack modify
gh stack submit
```

Begin with a clean working tree and no queued PRs or rebase in progress. Verify all PR bases and native positions after submitting the new structure.

## Merge an authorized stack

GitHub merges only a contiguous prefix starting at the lowest unmerged layer:

```text
main <- PR 1 <- PR 2 <- PR 3
```

- Merge PR 1 to land only PR 1.
- Merge PR 2 to land PR 1 and PR 2 atomically.
- Merge PR 3 to land the full stack atomically.

Use the website merge box or, only after explicit authorization:

```bash
gh stack merge
```

The CLI interactively selects the cutoff and merge method. A direct command can target a stack or PR number. Do not use `--yes` unless the authorization clearly covers the selected range and method.

All selected PRs must be open and non-draft. GitHub then applies the trunk's branch protection, review, status-check, and CODEOWNERS requirements. If the trunk uses a merge queue, GitHub queues the selected stack together.

After partial or complete merge, synchronize local state:

```bash
gh stack sync
```

Use `gh stack sync --prune` only when local deletion of merged branches is intended.

## Verify remote membership and order

Inspect a PR:

```bash
gh api repos/OWNER/REPO/pulls/NUMBER \
  --jq '{number, state, draft, base: .base.ref, head: .head.ref, stack}'
```

Inspect an entire known stack:

```bash
gh api repos/OWNER/REPO/stacks/STACK_NUMBER \
  -H 'Accept: application/vnd.github+json' \
  --jq '{number, open, base: .base.ref, pull_requests: [.pull_requests[] | {number, title, draft, state, base: .base.ref, head: .head.ref}]}'
```

Also verify local ancestry for each adjacent pair:

```bash
git merge-base --is-ancestor LOWER_BRANCH UPPER_BRANCH
```

A successful ancestry check does not replace native stack metadata verification.
