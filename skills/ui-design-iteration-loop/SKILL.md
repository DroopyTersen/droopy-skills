---
name: ui-design-iteration-loop
description: Iterative UI design refinement loop driven by screenshots. Use when you want to repeatedly (1) open a provided URL (or focused region), (2) take a screenshot, (3) give the 5 most glaring visual/aesthetic critiques, (4) implement fixes in code, (5) refresh and repeat for N iterations. Great for polishing UI, improving visual hierarchy, fixing spacing issues, or making designs feel more premium.
argument-hint: "[URL] [iterations]"
---

# UI Design Iteration Loop

An iterative approach to refining UI through screenshot-driven critique and immediate code fixes.

## Inputs (ask if missing)

- **URL**: The page to review (e.g., `http://localhost:3000/dashboard`).
- **Focus** (optional): Whole page, a specific component/section, or a selector/area description.
- **Goal**: What "good" looks like (e.g., "more premium", "cleaner", "stronger hierarchy", "less noisy").
- **Constraints**: Design system/library constraints, "don't change" areas, brand colors, accessibility requirements.
- **Iterations**: Number of rounds (default: 2).

## Browser/screenshot approach

Use whatever browsing/screenshot capability is available:

- Prefer **element/region screenshots** if Focus is provided and the tool supports it (selector/region capture).
- Otherwise take a **full viewport** screenshot (and scroll if needed) that clearly shows the target area.
- If you cannot take a screenshot with your tools, ask the user to paste one and continue the loop using that image.

Always label screenshots by iteration (e.g., "Iteration 1 (before)", "Iteration 1 (after)").

## The loop (repeat for N iterations)

For each iteration:

### 1. Open + capture

- Open the URL (apply Focus/scroll if specified).
- Take a screenshot that clearly shows the area under review.

### 2. Critique (be harsh, visual-only)

- Push for **5 distinct, specific critiques** in every iteration, ordered by impact. A polished first impression is a reason to inspect more carefully, not to end the critique.
- Start with visible defects, then look for weaker hierarchy, awkward spacing, typography, alignment, density, consistency, and unclear affordances. Inspect relevant viewport sizes and states within the requested scope before concluding there is little to improve.
- For each critique, name the element, describe the visible evidence, explain the design or usability cost, and propose a concrete improvement. A refinement opportunity counts even when the current design is functional.
- Distinguish an observed defect from a design judgment. Do not invent broken behavior, inflate severity, split one issue into several, or repeat a resolved critique to reach five.
- If a thorough inspection still supports fewer than five worthwhile changes, explain what you inspected and why the remaining changes would not improve the result. Generic praise such as "looks great" is not a substitute for this inspection.

### 3. Fix the 5 issues

- Implement changes with the smallest, highest-leverage edits first.
- Prefer existing styling/system primitives (design tokens, component props, utility classes) over bespoke one-off CSS.
- Keep changes scoped to what the user asked to review; don't refactor unrelated code.

### 4. Refresh + verify

- Refresh/reload the page (assume a dev server is already running unless told otherwise).
- Take another screenshot (same framing as the "before" screenshot) to verify the fixes landed.

### 5. Carry forward

- Don't repeat critiques that are already resolved.
- If a critique can't be fixed within constraints, say why and offer the next-best alternative.

## Output format (use every iteration)

```
## Iteration X

### Before screenshot
[attach screenshot]

### 5 Critiques (most severe first)
1. [Specific issue with concrete reason]
2. [Specific issue with concrete reason]
3. [Specific issue with concrete reason]
4. [Specific issue with concrete reason]
5. [Specific issue with concrete reason]

### Changes applied
- [File: path/to/file.tsx] Changed X to Y
- [File: path/to/styles.css] Adjusted spacing from A to B
- ...

### After screenshot
[attach screenshot]
```

## Critique categories to consider

- **Spacing**: Inconsistent gaps, cramped elements, too much whitespace
- **Hierarchy**: Unclear what's important, competing focal points, weak headings
- **Typography**: Poor readability, inconsistent sizes/weights, bad line height
- **Alignment**: Misaligned elements, broken grid, optical misalignment
- **Contrast**: Low readability, poor accessibility, washed out colors
- **Consistency**: Mismatched styles, inconsistent patterns, visual noise
- **Density**: Too cluttered, too sparse, poor information density
- **Affordances**: Unclear what's clickable, missing hover states, confusing controls
- **Empty states**: Missing loading states, poor empty state design, jarring transitions
