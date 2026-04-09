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

- **Entry points** - Where does the feature start? (API routes, UI components, CLI commands)
- **Data flow** - How does data move through the system?
- **Core logic** - Where is the main business logic implemented?
- **Supporting changes** - Types, utilities, configuration, tests
- **Integration points** - How does this connect to existing code?

### Step 4: Determine Logical Review Order

Group and order files by their role in the implementation, NOT alphabetically or by file path. Common patterns:

**For API/Backend Features:**
1. Types/Schemas (understand the data shape first)
2. Database layer (how data is stored/retrieved)
3. Business logic (core implementation)
4. API/Route handlers (how it's exposed)
5. Integration/wiring (connecting pieces together)

**For UI Features:**
1. Types/Props definitions
2. State management/hooks
3. Core components
4. Parent/container components
5. Route/page integration

**For Cross-Cutting Features:**
1. Foundation changes (types, config, constants)
2. Core implementation
3. Integration with existing systems
4. Entry points/exposure

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

### Layer 1: [Layer Name]

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
1. Schema/migrations
2. Database access layer
3. Service/business logic
4. API endpoints
5. Tests

### AI/Agent Feature
1. Types and schemas
2. Tool implementation
3. Agent integration
4. Context/state management
5. UI hooks (if any)

### Refactoring PR
1. What's being extracted/moved
2. New location and structure
3. Updated imports/references
4. Verification (tests, type checks)

## Common Pitfalls to Avoid

- **Don't just list files** - That's what GitHub already does
- **Don't copy-paste code** - Explain, don't repeat
- **Don't review in detail** - This is a guide, not a code review
- **Don't assume context** - Explain connections explicitly
- **Don't skip small files** - A 1-line constant change might be important context

## Quality Checklist

Before delivering the walkthrough:

- [ ] Files are grouped logically, not alphabetically
- [ ] Each file has clear purpose and context
- [ ] Reader can understand the feature without reading code
- [ ] Connections between files are explicit
- [ ] Any reuse of existing code is highlighted
- [ ] Diagram(s) help visualize the architecture (if complex)
- [ ] Quick reference table is complete
- [ ] Review notes capture any concerns or questions
