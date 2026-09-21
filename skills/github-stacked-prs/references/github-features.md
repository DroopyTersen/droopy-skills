# GitHub Native Stacked-PR Features

GitHub's native stacked-pull-request feature is in public preview. Verify current behavior in the official documentation before consequential operations.

## Website and mobile experience

GitHub provides:

- a stack-position badge such as `2/5` on every member PR;
- a stack map for navigating all layers and seeing their states;
- layer-specific diffs, because each PR compares against the branch below it;
- an **Add to stack** flow that creates a new top layer;
- a recommendation banner for eligible pre-existing PR chains;
- a server-side **Rebase stack** action when the trunk or a lower layer changes;
- a merge box that reports requirements for the selected PR and all layers below it;
- atomic merging of the whole stack or a contiguous bottom portion.

Stacks are available on github.com and GitHub Mobile. GitHub Desktop does not manage native stacks.

## Official GitHub CLI extension

Install the extension with:

```bash
gh extension install github/gh-stack
```

Its main command groups are:

| Purpose | Commands |
|---|---|
| Create layers | `gh stack init`, `gh stack add` |
| Inspect and navigate | `view`, `checkout`, `switch`, `bottom`, `down`, `up`, `top`, `trunk` |
| Publish and synchronize | `submit`, `sync`, `push` |
| Revise history | `rebase`, `modify` |
| Connect existing work | `link` |
| Merge | `merge` |
| Remove stack metadata | `unstack` |

`gh stack submit` pushes local branches, creates or updates PRs, and registers native stack metadata. `gh stack link` is intended for branches managed by another tool and does not create local stack tracking.

## Reviews, repository rules, and CI

Each layer can be reviewed independently. GitHub evaluates every PR against the rules of the stack's trunk, even when the PR directly targets another feature branch. This includes required reviews, required checks, CODEOWNERS, and code scanning.

GitHub Actions treats each stack member as if it targets the trunk, so workflows filtered to the trunk run for every layer. Pull-request webhook payloads and Actions expressions expose:

- `github.event.pull_request.stack.number`
- `github.event.pull_request.stack.size`
- `github.event.pull_request.stack.position`
- `github.event.pull_request.stack.base.ref`
- `github.event.pull_request.stack.base.sha`

Large stacks can multiply CI work. If optimization is requested, use stack metadata to reserve expensive end-to-end jobs for the top layer while retaining appropriate checks per layer. Do not weaken protection without an explicit, evidence-based reason.

## Merge behavior

Native stack merges always land in bottom-to-top order. A selected PR brings every unmerged PR below it:

- selecting the bottom PR merges one layer;
- selecting a middle PR merges the contiguous bottom portion through that PR;
- selecting the top PR merges the entire stack.

The operation is all-or-nothing for the selected portion. GitHub supports merge-commit, squash, and rebase methods. With squash, each PR becomes its own squash commit. With rebase, each layer's commits are replayed in order. With merge-commit, GitHub preserves the full histories in the group.

Merge queues support stacks and enqueue the selected layers in dependency order. If one layer is removed or ejected, layers above it are removed as well. Auto-merge is not supported for native stacked PRs.

## APIs and automation

- REST pull-request responses expose a `stack` object with the stack number, size, position, and base.
- The REST Stacks API can list, create, extend, inspect, and dissolve stacks.
- GraphQL exposes read-only stack and stack-entry fields.
- Pull-request webhooks include stack metadata while a PR belongs to a stack.
- API-driven stack merges must use GitHub's asynchronous stack merge endpoint. Legacy synchronous PR merge endpoints are not stack-aware.

## Availability and limitations

- All stack branches must live in the same repository; cross-fork stacks are unsupported.
- The history between layers must remain linear before merge.
- Draft PRs cannot merge.
- Auto-merge is unsupported.
- GitHub Desktop does not manage stacks.
- Because the feature is in public preview, command flags, UI labels, and API details can change.

## Authoritative documentation

- [About stacked pull requests](https://docs.github.com/en/pull-requests/get-started/about-stacked-prs)
- [Creating stacked pull requests](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/creating-stacked-pull-requests)
- [Managing stacked pull requests](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/managing-stacked-pull-requests)
- [Reviewing stacked pull requests](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/reviewing-stacked-pull-requests)
- [Merging stacked pull requests](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/merging-stacked-pull-requests)
- [Stacked PR CLI commands](https://docs.github.com/en/pull-requests/reference/stacked-prs-cli-commands)
- [Optimizing CI for stacked pull requests](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/optimizing-ci-for-stacked-pull-requests)
- [Stack APIs and webhooks](https://docs.github.com/en/pull-requests/reference/stacked-pull-requests-apis-and-webhooks)
