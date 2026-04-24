---
name: pr-guide
description: Creates a guided tour of a Pull Request that walks reviewers through the changes in a logical order
---

# PR Walkthrough Guide

This command creates a guided tour of a Pull Request that walks reviewers through the changes in a logical order, making large PRs more digestible by telling a story rather than presenting a flat list of files.

## When to Use

- Reviewing complex PRs with many file changes
- Onboarding team members to understand a feature implementation
- Creating documentation for significant changes
- Making PRs more approachable for reviewers unfamiliar with the codebase

## Process

### Step 1: Gather PR Information

First, ask the user for the PR they want to create a guide for:

> What PR would you like me to create a walkthrough guide for?
>
> You can provide:
> - A GitHub PR URL (e.g., `https://github.com/org/repo/pull/123`)
> - A PR number if we're in the repo (e.g., `#123` or just `123`)
> - A branch name to compare against main

### Step 2: Fetch and Analyze the PR

Once you have the PR reference:

1. **Get the file list** - Use `gh pr view <number> --json files,additions,deletions,title,body` to get changed files and PR description
2. **Read the PR description** - Understand the stated intent and any context provided
3. **Identify the spec or ticket** - Look for linked issues, specs, or requirements documents mentioned in the PR
4. **Read each changed file** - Use the Read tool to understand what each file does and how it changed

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

### Step 6: Create the Walkthrough Document

Write the guide with these sections:

```markdown
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

### Layer 1: [High-Level Layer Name]

Brief intro to what this layer does.

#### 1. `path/to/file.ts` (+X/-Y lines)

**Purpose**: What this file does in the context of the feature.

Key points:
- What the main changes are
- Why they matter
- How they connect to other parts

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
```

## Writing Guidelines

### For Each File Entry

- **Don't show full code** - Just explain what to look for
- **Give context** - Why does this file exist? What role does it play?
- **Highlight key lines** - Point to specific line numbers for important logic
- **Connect the dots** - How does this file relate to others in the PR?

### For the Overall Guide

- **Use progressive disclosure** - Start with the best high-level entry point, establish the mental model, then move down into implementation details.
- **Separate stack direction from abstraction level** - Frontend-to-backend and backend-to-frontend are both valid, but the guide should begin high on the abstraction ladder either way.
- **Tell a story** - The reader should understand the feature by following the guide
- **Be concise** - This is a map, not a copy of the code
- **Use diagrams** - ASCII art is great for showing data flow
- **Link to spec** - Reference requirements when relevant
- **Make it scannable** - Clear headers, tables, bullet points

### Tone

- Neutral and informative
- Focus on "what" and "why", not "how good/bad"
- Assume the reader is smart but unfamiliar with this code
- Don't be exhaustive - highlight what matters

## Output Location

Save the walkthrough to:
```
docs/[feature-area]/solutioning/PR-[number]-Walkthrough.md
```

Or ask the user where they'd like it saved.

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
- **Don't copy-paste code** - Explain, don't repeat
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
- [ ] Reader can understand the feature without reading code
- [ ] Connections between files are explicit
- [ ] Any reuse of existing code is highlighted
- [ ] Diagram(s) help visualize the architecture (if complex)
- [ ] Quick reference table is complete
- [ ] Review notes capture any concerns or questions
