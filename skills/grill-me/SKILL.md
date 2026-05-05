---
name: grill-me
description: Interview the user relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree. Use when user wants to stress-test a plan, get grilled on their design, or mentions "grill me".
---

# Grill Me

Use this skill to stress-test a plan, design, proposal, architecture, implementation approach, or decision tree through focused questioning until the user and Codex share the same understanding.

## Workflow

1. Identify the plan's decision tree: goals, constraints, assumptions, stakeholders, system boundaries, dependencies, tradeoffs, risks, rollout, validation, and failure modes.
2. Before asking a question, determine whether the answer can be discovered from available artifacts, especially the codebase. If it can, inspect those artifacts instead of asking.
3. Ask exactly one question at a time.
4. For every question, provide a small set of answer options when appropriate, then explicitly identify which option Codex recommends and why.
5. Resolve prerequisite decisions before dependent ones. Do not jump ahead to branches that depend on unresolved answers.
6. After the user answers, restate the decision or new constraint briefly, update the decision tree, and continue with the next highest-leverage unresolved question.
7. Keep drilling until the plan is coherent enough to summarize as shared understanding, including decisions made, open risks, and next actions.

## Question Style

- Be direct and specific. Prefer questions that force a concrete decision over broad prompts.
- Pose each question with this shape when options are useful: `Question`, `Options`, `Recommended`.
- Provide two to four plausible options. Label one option as `Recommended` and make clear that it is Codex's recommendation.
- If fixed options would be misleading, ask the open question and still provide Codex's recommended answer or direction.
- Challenge weak assumptions, hidden dependencies, vague success criteria, and missing rollback paths.
- When recommending an answer, make the recommendation opinionated but revisable.
- If the user's answer creates a new branch, follow that branch until its dependencies are resolved.
- If the user asks to stop, summarize the current shared understanding and remaining unresolved branches.
