---
name: self-improvement-loop
description: Set up and run a generalized eval-driven self-improvement loop for any system under test. Use when the user wants to create evals, define an LLM-judge rubric, establish a harness, run repeated score-improving iterations, use Codex/subagents as judges, or turn an open-ended improvement effort into a durable Codex /goal.
---

# Self-Improvement Loop

Use this skill when the user wants an eval-driven loop that keeps improving a system's measured behavior. The pattern is domain-neutral: it can apply to retrieval, agents, UX, parsers, API behavior, generated documents, forecasts, or any other system with repeatable inputs and inspectable outputs.

## Modes

Start in **setup mode** unless the user already has a mature eval suite, rubric, harness, and baseline.

Move to **loop mode** only after these are established:

1. Eval cases.
2. Judge rubric.
3. Harness command or workflow that produces judge-ready artifacts.

If any of those are missing or weak, improve setup first.

## Setup Mode

### 1. Define The System Under Test

Make the target explicit:

- What behavior is being improved?
- What command, API, UI flow, or manual procedure produces the output?
- What files/modules/artifacts are in scope?
- What is out of scope?
- What constraints prevent score gaming?

### 2. Build Evals

Help the user create a diverse eval set. Include:

- Representative happy paths.
- Edge cases.
- Negative controls where refusal, uncertainty, or "not enough data" is the correct outcome.
- Multi-step or multi-intent cases.
- Known difficult examples.
- At least a small holdout set that is not used for tuning decisions.

Prefer evals grounded in real use cases, observed failures, production traces, support tickets, user journeys, accepted examples, or domain source material. Avoid only inventing examples from vibes.

Each eval should define:

- Input.
- Expected behavior or source trail.
- Required artifacts for judgment.
- Any explicit constraints.
- Why the case exists.

### 3. Define The Rubric

Create a rubric that an LLM judge can apply consistently. It should include:

- Objective criteria where possible.
- Scored dimensions and weights.
- Outcome classes such as green/yellow/orange/red when useful.
- What counts as success, partial success, and failure.
- How negative controls should be scored.
- A failure taxonomy.

Keep rubric changes separate from system improvements. If the rubric changes, run and commit that as its own iteration so score movement remains interpretable.

### 4. Define The Harness

Establish exactly how evals run:

- Command or procedure.
- Inputs.
- Output location.
- Required environment.
- How raw outputs are captured.
- How deterministic metrics are computed.
- How artifacts are made safe to commit or intentionally ignored.

The harness should emit judge-ready artifacts, not just aggregate scores. Include enough detail for an external judge to decide whether the output satisfies the rubric without needing hidden context.

Judge-ready artifacts should usually include:

- Eval ID and input.
- System output.
- Relevant intermediate decisions.
- Tool/API/query/request previews.
- Expected behavior/source trail.
- Deterministic metric summary.
- Top evidence/results with useful excerpts.
- Errors, warnings, missing data, and trace IDs when available.

### 5. Baseline

Before improving, run the harness once and save:

- Eval set version.
- Rubric version.
- Harness command.
- Raw outputs.
- Judge outputs.
- Aggregate score.
- Per-case scores.
- Failure taxonomy.

Treat this as the baseline for future deltas.

### 6. Create The Goal

When setup is ready and the user wants an extended run, produce a Codex `/goal` prompt that includes:

- The system under test.
- Eval and rubric locations.
- Harness command.
- Artifact locations.
- Judge process.
- Commit rules.
- Stop/pause rules.
- Completion criteria.

## Judge Process

Use Codex as the judge by default.

Do not rely on the system under test's cheap or fast model as the authoritative judge unless the user explicitly wants that. A fast model may help generate criteria, artifacts, or provisional labels, but the final judge should be Codex reading the artifact and rubric.

When subagents are available, spawn Codex subagents as judges so each has a clean context window.

Judge subagents should receive only:

- The rubric.
- One eval case or a small independent batch.
- The harness artifact for those cases.
- The required output schema.

Do not leak your intended answer or previous conclusions unless the task explicitly requires comparison.

Require judges to return structured output:

```json
{
  "caseId": "EVAL-001",
  "support": "supported | partial_corpus_support | insufficient_corpus_support",
  "score": 0,
  "reason": "brief concrete explanation",
  "failureMode": "none | missing-data | retrieval-search | extraction-parsing | criteria-mapping | synthesis-reasoning | refusal | ui-product-expectation | harness-artifact | rubric-defect",
  "evidence": ["specific artifact facts used"]
}
```

For non-RAG domains, rename `support` labels to the domain's equivalent, but keep the idea: full success, partial success, insufficient/unsupported.

## Loop Mode

Each iteration should be small and evidence-driven:

1. Run the harness.
2. Spawn judge subagents over independent slices.
3. Aggregate scores, deltas, regressions, and failure modes.
4. Generate at least five diverse candidate improvements.
5. Pick the highest-leverage generalized improvement.
6. Implement one atomic change.
7. Run the targeted eval slice.
8. If improved, run the broader regression/holdout suite.
9. Commit only if the change improves behavior or clarifies the eval setup.
10. Update the iteration log.
11. Repeat.

Before every implementation, explicitly distinguish:

- Product/system improvement.
- Harness improvement.
- Rubric/judge improvement.
- Eval-case correction.
- Data/artifact improvement.

These should usually be separate commits.

## Failure Taxonomy

Every non-perfect case should classify the primary failure mode:

- `missing-data`: the required information is absent from available data.
- `retrieval-search`: the right evidence exists but is not found or ranked.
- `extraction-parsing`: the right source is retrieved, but artifact text/data is missing or malformed.
- `criteria-mapping`: natural language or test input maps to the wrong criteria/query/tool call.
- `synthesis-reasoning`: evidence exists but the answer/reasoning is wrong.
- `refusal`: the system should refuse or caveat but does not.
- `ui-product-expectation`: behavior is technically correct but fails the user workflow.
- `harness-artifact`: output is impossible to judge because artifacts are insufficient.
- `rubric-defect`: the rubric rewards or penalizes the wrong behavior.

## Anti-Overfitting Rules

- Keep a holdout set.
- Do not tune only to one case unless the fix clearly generalizes.
- Track regressions, not just averages.
- Prefer root-cause fixes over prompt wording hacks.
- Treat missing data as a successful diagnosis when the system can identify it honestly.
- Do not let rubric changes masquerade as product improvements.
- Be willing to add new evals when a fix reveals a broader class of behavior.

## Score Reporting

After each iteration, report:

- Previous score and new score.
- Per-case deltas.
- Verdict/failure-mode changes.
- Regressions.
- Whether score movement came from product, harness, rubric, eval-case, or data changes.
- Whether the result generalizes or risks overfitting.
- Commands run and artifact paths.

## Stop Or Pause

Pause the loop when:

- Judge artifacts are insufficient.
- Harness runs are flaky or non-reproducible.
- The rubric is ambiguous enough to change conclusions.
- The proposed improvement only games the eval.
- Required data is missing and cannot be created in scope.
- The next step requires user/product alignment.

When paused, summarize what is known, what is blocked, and the recommended next move.
