---
name: pr-guide
description: Create a guided PR walkthrough that orders changes for reviewers by abstraction and dependency. Use when a user asks for a PR guide, PR walkthrough, reviewer tour, or self-contained PR explanation, whether delivered in chat, written to a file, added to a GitHub PR description, or sent to another user-specified target; optionally include curated inline diffs and code snippets.
---

# PR Walkthrough Guide

Create a guided tour of a Pull Request that walks reviewers through the changes in a logical order. Make large PRs more digestible by telling a story rather than presenting a flat list of files. Keep the walkthrough method independent from its delivery target so the same guide can be returned in chat, written to a file, added to a PR description, or delivered elsewhere.

## Resolve the Request

Determine these settings before producing the walkthrough:

1. **PR reference** - GitHub PR URL, PR number, or branch comparison.
2. **Output target** - Any destination the user specifies, including:
   - the current chat response
   - a Markdown file at a user-selected path
   - the GitHub PR description
   - another explicit target available through the current tools
3. **Evidence depth**:
   - **Standard** (default) - Preserve the concise guide style: explain what to inspect, cite files and important lines, and do not inline substantial code.
   - **Inline evidence** - Make the guide self-contained by placing curated changed hunks or code snippets directly below the file entry that explains them.

Honor settings stated in the user's instruction. Infer obvious wording such as "show me here" as chat output, "put this in the PR" as the PR description, and "make it self-contained" or "include the important diffs" as inline evidence. If the PR reference or output target is genuinely unclear, ask only for the missing information. Do not ask the user to choose an evidence depth when they did not request one; use Standard.

Treat the output target as a delivery setting, not as part of the analysis. Follow the same architecture mapping, review order, and walkthrough structure for every target. Adapt presentation syntax only when the destination does not support Markdown.

Example requests:

- `$pr-guide #123 — show the standard walkthrough here in chat`
- `$pr-guide #123 — make the chat walkthrough self-contained with inline evidence`
- `$pr-guide #123 — add the standard walkthrough to the GitHub PR description`
- `$pr-guide #123 — save the walkthrough to docs/reviews/PR-123.md`

## Process

### Step 1: Gather PR Information and Delivery Settings

If the request does not identify a PR, ask:

> What PR would you like me to create a walkthrough guide for?
>
> You can provide:
> - A GitHub PR URL (e.g., `https://github.com/org/repo/pull/123`)
> - A PR number if we're in the repo (e.g., `#123` or just `123`)
> - A branch name to compare against main

If the request does not identify an output target, ask where to deliver it. Do not default to a repository file. If the user already supplied both the PR and target, proceed without reconfirming them.

### Step 2: Fetch and Analyze the PR

Once you have the PR reference:

1. **Get the file list** - Use `gh pr view <number> --json files,additions,deletions,title,body` to get changed files and PR description
2. **Read the PR description** - Understand the stated intent and any context provided
3. **Identify the spec or ticket** - Look for linked issues, specs, or requirements documents mentioned in the PR
4. **Read each changed file and its diff** - Understand what each file does, what changed, and which exact hunks are important to the PR's behavior

### Step 3: Identify the Architecture

As you read files, mentally map:

- **Ideal entry point** - The highest-level file that best explains the change first. This is not necessarily the first runtime call site or the most frontend file. It is the place where a reviewer can understand the feature's intent, shape, and boundaries before dropping into details.
- **Stack direction** - How the change moves left-to-right across the product stack, such as CSS/UI, components, state, routes, services, APIs, jobs, persistence, SQL, or infrastructure.
- **Abstraction ladder** - How the change moves top-to-bottom from intent and orchestration into concrete implementation details, edge cases, helpers, storage mechanics, and tests.
- **Data flow** - How does data move through the system?
- **Core logic** - Where is the main business logic implemented?
- **Supporting changes** - Types, utilities, configuration, tests
- **Integration points** - How does this connect to existing code?

### Step 4: Determine Logical Review Order

Group and order files by their role in the implementation, NOT alphabetically or by file path.

Use a **progressive disclosure** approach:

1. Start with the ideal entry point: the highest-level file that gives the reviewer the best mental model for the PR.
2. Stay high on the abstraction ladder until the feature shape is clear. Prefer files that explain intent, orchestration, public interfaces, or user/developer-facing behavior before low-level mechanics.
3. Then move downward into implementation details: core logic, adapters, persistence, helpers, config, and tests.
4. Choose a stack direction after choosing the abstraction level. It is fine to walk frontend-to-backend or backend-to-frontend, but do not start with a low-level file just because it is on one end of the stack.
5. Within each abstraction level, order files so dependencies and context appear before the code that relies on them.

Think of the PR in two dimensions:

- **Left to right: stack position** - frontend through backend, such as CSS, UI, state, routes, services, APIs, persistence, SQL, and infrastructure.
- **Top to bottom: abstraction level** - overview, orchestration, interfaces, core behavior, concrete implementation, edge cases, and verification.

The walkthrough should usually move top-to-bottom first, then left-to-right within each layer. Some PRs read better frontend-to-backend and others backend-to-frontend; either is acceptable when the guide still begins with a high-level entry point and progressively reveals lower-level details.

Common patterns:

**For API/Backend Features:**
1. Route/controller/job entry point or public interface (what behavior is exposed)
2. Request/response types or schemas (the contract)
3. Business logic or orchestration (how the feature works at a high level)
4. Database/access layer and integrations (how details are fulfilled)
5. Migrations, SQL, config, and tests (supporting mechanics and verification)

**For UI Features:**
1. Page/container/feature entry point (what the user experiences)
2. State management/hooks and public component contracts (how the feature is organized)
3. Core components (how the UI is assembled)
4. Styling, small utilities, and edge-case components (concrete details)
5. Tests and stories (verification and examples)

**For Cross-Cutting Features:**
1. Highest-level entry point or orchestration layer that shows the end-to-end change
2. Public contracts, feature flags, config, or shared types
3. Core implementation across affected systems
4. System-specific adapters, utilities, and persistence details
5. Tests and migration or rollout notes

### Step 5: Light Code Review

While analyzing, note (but don't dwell on):

- **Potential issues** - Bugs, security concerns, performance problems
- **Questions** - Things that aren't clear from the code
- **Positive patterns** - Good practices worth highlighting
- **Code reuse** - How well does this leverage existing infrastructure?

### Step 6: Compose the Walkthrough

Write the guide with these sections:

````markdown
# PR #[number] Walkthrough: [Title]

Brief description of what this PR accomplishes.

---

## Overview

The PR implements [feature] by:
1. [High-level change 1]
2. [High-level change 2]
3. [High-level change 3]

---

## Recommended Review Order

### Entry Point: [High-Level File or Concept]

Why this is the best place to start, what mental model it gives the reviewer, and whether the guide will proceed frontend-to-backend, backend-to-frontend, or by another stack direction.

#### 1. `path/to/entry-point.ts` (+X/-Y lines)

**Purpose**: What this file reveals about the PR at the highest useful abstraction level.

Key points:
- What feature or behavior this introduces
- What boundaries, contracts, or orchestration it establishes
- Which lower-level files it leads into

[In Inline evidence mode only: include the critical changed hunk or focused code snippet here, followed by a short explanation of what the evidence proves.]

### Layer 1: [High-Level Layer Name]

Brief intro to what this layer does.

#### 1. `path/to/file.ts` (+X/-Y lines)

**Purpose**: What this file does in the context of the feature.

Key points:
- What the main changes are
- Why they matter
- How they connect to other parts

[In Inline evidence mode only: include the critical changed hunk or focused code snippet here.]

[Repeat for each file in this layer]

### Layer 2: [Next Layer Name]

[Continue pattern...]

---

## Architecture Diagram (if helpful)

```
[ASCII diagram showing data/control flow]
```

---

## Code Reuse & Patterns

Highlight how this PR:
- Reuses existing infrastructure
- Follows established patterns
- Any intentional deviations and why

---

## Review Notes

### Potential Concerns
- [Any issues noticed during analysis]

### Questions for Author
- [Clarifications needed]

### Highlights
- [Particularly well-done aspects]

---

## Quick Reference

| File | Lines | Purpose |
|------|-------|---------|
| file1.ts | +100 | Brief description |
| file2.ts | +50/-20 | Brief description |

## Evidence Coverage (Inline evidence mode only)

- Included inline: [critical files or behavioral areas represented by excerpts]
- Review in the full diff: [material files or areas intentionally not reproduced]
````

## Writing Guidelines

### For Each File Entry

- **Give context** - Why does this file exist? What role does it play?
- **Highlight key lines** - Point to specific line numbers for important logic
- **Connect the dots** - How does this file relate to others in the PR?

### Evidence Depth

In **Standard** mode:

- Explain what to look for without reproducing substantial code.
- Cite important files and line numbers when stable links or local line references are available.
- Keep the guide a concise map of the implementation.

In **Inline evidence** mode:

- Place evidence immediately after the explanation it supports; do not collect all snippets in a detached appendix.
- Prefer exact unified diff hunks because they show the before/after change. Use a focused current-code snippet when unchanged surrounding context is necessary to understand the new behavior.
- Include the important evidence for entry points, public contracts, orchestration, core business logic, meaningful edge cases, migrations or configuration, and tests that demonstrate the behavior.
- Omit routine imports, formatting-only changes, generated output, lockfile churn, repetitive call-site edits, and other mechanical changes unless they are essential to understanding the PR.
- Keep enough surrounding context to make each excerpt understandable. Label the file and language, preserve added/removed lines accurately, and mark any omitted middle section explicitly rather than presenting edited text as a contiguous diff.
- Follow each excerpt with one or two sentences explaining what changed, why it matters, and how it connects to the next review step.
- Never dump whole files or the entire PR diff merely to appear comprehensive. Curate the smallest set of excerpts that lets a reviewer understand and question the implementation from the walkthrough alone.
- End with an **Evidence Coverage** note that identifies important files represented inline and any material area intentionally left for direct diff review.
- Do not expose secrets or sensitive values found in code, configuration, logs, fixtures, or the existing PR description. Redact the value and explain the omission.

### For the Overall Guide

- **Use progressive disclosure** - Start with the best high-level entry point, establish the mental model, then move down into implementation details.
- **Separate stack direction from abstraction level** - Frontend-to-backend and backend-to-frontend are both valid, but the guide should begin high on the abstraction ladder either way.
- **Tell a story** - The reader should understand the feature by following the guide
- **Be proportionate** - Standard mode is a concise map; Inline evidence mode is a curated, self-contained review packet
- **Use diagrams** - ASCII art is great for showing data flow
- **Link to spec** - Reference requirements when relevant
- **Make it scannable** - Clear headers, tables, bullet points

### Tone

- Neutral and informative
- Focus on "what" and "why", not "how good/bad"
- Assume the reader is smart but unfamiliar with this code
- Don't be exhaustive - highlight what matters

## Deliver to the Selected Target

Do not assume a Markdown file. Deliver only to the target the user selected:

- **Chat** - Put the complete walkthrough in the final response. Do not write a file unless the user also requested one.
- **Markdown file** - Use the exact requested path. If the user selected a file but omitted the path, ask for it rather than inventing a repository location.
- **GitHub PR description** - Update the selected PR only when the user explicitly requested this target. Preserve existing description content that remains useful. Replace an existing walkthrough section when one is clearly identifiable; otherwise integrate or append the walkthrough without silently discarding the author's context. Verify the resulting PR body after the update.
- **Another target** - Use the destination and format the user specified. If the target is unavailable or would require authority the user has not granted, do not silently substitute a file; explain the constraint and ask for a reachable target.

When the user requests multiple targets, generate one canonical walkthrough and deliver equivalent content to each, adapting formatting only as required by the destination.

## Example Layering Strategies

### Database Feature
1. API endpoint, job, or service entry point that explains the behavior
2. Data contract and high-level service flow
3. Database access layer
4. Schema, migrations, SQL, and storage details
5. Tests

### AI/Agent Feature
1. Agent or workflow entry point that explains the user/developer-facing behavior
2. Tool contracts, types, and schemas
3. Agent orchestration and context/state management
4. Tool implementation and provider-specific details
5. UI hooks and tests, if any

### Refactoring PR
1. High-level before/after shape: what responsibility moved and why
2. New public interface or module boundary
3. New location and structure
4. Updated imports/references and low-level cleanup
5. Verification (tests, type checks)

## Common Pitfalls to Avoid

- **Don't just list files** - That's what GitHub already does
- **Don't dump code without interpretation** - In Inline evidence mode, curate and explain exact evidence; in Standard mode, point the reviewer to it
- **Don't review in detail** - This is a guide, not a code review
- **Don't assume context** - Explain connections explicitly
- **Don't skip small files** - A 1-line constant change might be important context

## Quality Checklist

Before delivering the walkthrough:

- [ ] Files are grouped logically, not alphabetically
- [ ] The guide starts with the best high-level entry point, not merely the first frontend/backend file
- [ ] The order progressively discloses lower-level implementation details
- [ ] Stack direction and abstraction level are both considered explicitly
- [ ] Each file has clear purpose and context
- [ ] Standard mode gives the reviewer a reliable mental model before opening the diff
- [ ] Inline evidence mode, when requested, lets the reviewer understand the critical implementation without opening the full diff
- [ ] Connections between files are explicit
- [ ] Any reuse of existing code is highlighted
- [ ] Diagram(s) help visualize the architecture (if complex)
- [ ] Quick reference table is complete
- [ ] Review notes capture any concerns or questions
- [ ] The walkthrough is delivered only to the user-selected target(s)
- [ ] Standard mode stays concise, or Inline evidence mode places curated evidence beside each relevant explanation
- [ ] Inline evidence, when requested, covers the critical behavior and states any material omissions
- [ ] Existing destination content is preserved unless the user explicitly requested replacement
