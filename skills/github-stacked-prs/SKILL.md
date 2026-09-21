---
name: github-stacked-prs
description: Create, link, inspect, review, update, rebase, restructure, and merge native GitHub stacked pull requests. Use when a change is split into dependent PR layers, an existing branch chain should become a native GitHub stack, or review feedback affects a lower layer.
---

# GitHub Stacked Pull Requests

Use GitHub's native stacked-pull-request model so branch ancestry, PR bases, stack metadata, reviews, CI, and merges remain consistent. Prefer the official `github/gh-stack` extension for local stack work. GitHub stacks are in public preview, so consult `gh stack <command> --help` or the official documentation before relying on syntax or behavior that may have changed.

## References

- Read [references/workflows.md](references/workflows.md) when creating, adopting, changing, rebasing, restructuring, or merging a stack.
- Read [references/github-features.md](references/github-features.md) when explaining GitHub's built-in product features, CI behavior, APIs, merge queues, or current limitations.

## Mental Model

```text
trunk <- bottom PR <- next PR <- ... <- top PR
```

- The bottom PR targets the trunk, normally the default branch.
- Every higher PR targets the head branch of the PR immediately below it.
- Each PR owns one focused layer and shows the diff against the layer below it.
- Stack position determines order. PR numbers and creation times may not.
- A correct branch and base chain is necessary, but it does not prove the PRs are registered as one native GitHub stack. Verify the `stack` metadata or stack map.

## Establish Live State First

Before changing a stack:

1. Resolve the actual repository and remote. Do not assume `origin`, the owner, or the trunk branch.
2. Check authentication and the installed tooling. Use `gh auth status`, `gh extension list`, and `gh stack --help` as needed.
3. Inspect the working tree and preserve unrelated staged, unstaged, and untracked work.
4. Read the PRs' live head branches, base branches, draft states, checks, and native stack membership.
5. Write down the chain from trunk to top and identify which layer owns each proposed change.

For a locally tracked stack, prefer `gh stack view --json`. For remote verification, the pull-request REST resource exposes native membership:

```bash
gh api repos/OWNER/REPO/pulls/NUMBER \
  --jq '{number, state, draft, base: .base.ref, head: .head.ref, stack}'
```

If `stack` is null, the PR is not part of a native GitHub stack even when its base branch is correct.

## Choose the Appropriate GitHub Surface

- Use `gh stack` for creating and tracking local branches, submitting PRs, cascading rebases, synchronized pushes, navigation, restructuring, and merges.
- Use GitHub's website for review, the stack map, server-side **Rebase stack**, adding a new top layer, and an explicitly authorized merge.
- Use `gh stack link` when branches or PRs already exist or another tool manages the local branch chain. `link` creates native GitHub stack membership without local tracking.
- Use REST for exact inspection or automation. GraphQL stack fields are read-only. Use GitHub's asynchronous stack merge endpoint for API merges; legacy PR merge endpoints do not merge native stacks correctly.

## Operating Rules

### Create and submit

- Put foundational behavior at the bottom and dependent behavior above it.
- Start a new layer when it creates a distinct review boundary, not merely because another commit exists.
- Use `gh stack init`, `gh stack add`, and `gh stack submit` for a new locally managed stack.
- Use `gh stack link` in explicit bottom-to-top order for an existing branch or PR chain.
- After submission or linking, re-read native stack membership and every adjacent base/head pair. Do not stop after seeing that PRs exist.

### Review and revise

- Recommend review from bottom to top because higher layers depend on lower-layer decisions. Parallel review is fine when the dependencies are understood.
- Apply feedback to the earliest layer that logically owns the behavior.
- After changing a lower layer, cascade that change through every layer above it with `gh stack rebase --upstack` and `gh stack push`, or use GitHub's server-side **Rebase stack**.
- Expect upper PR checks to rerun. Reassess upper approvals when the lower change alters behavior or assumptions, even if their isolated diffs remain similar.
- Never hide a lower-layer correction in a later layer merely to avoid rebasing.

### Merge

- Never merge, queue, enable auto-merge, or mark a stack complete without explicit user authorization.
- Do not merge the top branch into the branch below it. A native stack merge lands a contiguous set of PRs on the trunk in bottom-to-top order.
- Selecting the top PR merges the whole eligible stack. Selecting a middle PR merges that PR plus every unmerged PR below it. A middle PR cannot merge alone.
- Before an authorized merge, verify that every selected PR is open, non-draft, approved as required, passing required checks, and part of a linear stack.
- Requery the stack and trunk after the merge. Distinguish merged state from deployment state.

## Safety and Scope

- A request to create, update, rebase, or repair a stack authorizes the required branch and PR updates; do not ask again for routine credential use or safe `--force-with-lease` pushes performed by `gh stack`.
- Preserve draft or ready-for-review state unless the user asks to change it or the authorized operation explicitly requires it.
- Do not alter branch protection, repository rules, merge queues, or CI configuration merely to make a stack pass.
- Do not use raw `git push --force`; let `gh stack push` apply per-branch `--force-with-lease` checks.
- Native stacks require branches in the same repository. Cross-fork stacks and GitHub Desktop stack management are unsupported.

## Completion Evidence

Before reporting a stack as clean, verify and report:

- trunk, stack number, size, and bottom-to-top order;
- each PR's number, title, base, head, state, and draft state;
- native stack position and size for every PR;
- direct ancestry and absence of accidental merge commits between layers;
- focused layer diffs and required checks;
- any remaining review, draft, CI, conflict, or authorization blocker.

After any remote mutation, requery GitHub rather than inferring success from the command exit alone.
