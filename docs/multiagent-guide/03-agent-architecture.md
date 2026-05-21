# Agent Architecture

The **Lead Agent** is the one component in the system that actually talks to the user. It reads the user's prompt, decides whether it can answer from context, picks which tools to call, delegates to subagents when the question spans multiple sources, and synthesizes the final answer. Everything else in the architecture exists to support it.

That job is broader than "run a model with a prompt." A production lead agent has to pick the right model tier, assemble a long system prompt without turning it into an unmaintainable wall of text, register a typed set of tools, inject request-scoped dependencies (the stream writer, the telemetry handle, auth context), apply runtime guardrails before each step, and stop cleanly when it has run long enough. This chapter walks through how to structure all of that.

A short glossary first, because most of it surfaces in the first page:

- **System prompt**: the static instructions the model reads before every turn. Think of it as the agent's job description.
- **Tool call**: the model's way of asking the runtime to execute a function. In the example turn, `delegate_sql_research({query: "..."})` is a tool call.
- **Step**: one round trip to the model. A turn is usually several steps: the model calls tools, the runtime returns results, the model is called again, and so on until it stops emitting tool calls.
- **Token budget**: the cap on how much text can fit into a single model call. Blow past it and the provider rejects the request.

## The Factory Pattern

Build the Lead Agent with a **factory**: a function that takes injected runtime dependencies and returns a configured agent. Do not construct the agent as a module-level singleton.

```typescript
// app/agents/lead/leadAgent.server.ts
export function createLeadAgent(config: {
  writer?: UIMessageStreamWriter<UIMessage>;
  telemetry?: TelemetryConfig;
  // Optional so tests can pass a mock and batch jobs can pass a cheaper tier.
  model?: LanguageModel;
  runtimeContext?: RuntimeContext;
}) {
  // Captured in closure so prepareStep can enforce an elapsed-time ceiling
  // that tool-count alone cannot catch.
  const runStartedAtMs = Date.now();

  const tools = buildLeadAgentTools({
    writer: config.writer,
    runtimeContext: config.runtimeContext,
  });

  return new Agent({
    // Registry lookup by role lets you swap model tiers without touching agent code.
    model: config.model ?? modelRegistry.languageModel("default:leadAgent"),
    system: buildLeadAgentSystemPrompt({
      // Soft budget lives in the prompt to shape planning. The hard limit is in prepareStep.
      softToolCallBudget: 24,
      toolRegistry: leadAgentToolRegistry,
    }),
    tools,
    prepareStep: createLeadAgentPrepareStep({
      maxToolCalls: 30,
      runStartedAtMs,
    }),
    // Terminal backstop. See Budgets below for why this is +2 past the hard limit.
    stopWhen: [stepCountIs(32)],
    experimental_telemetry: {
      isEnabled: true,
      functionId: "leadAgent",
      ...config.telemetry,
    },
  });
}
```

A factory gives three things a singleton cannot:

- **Per-request writer injection.** The writer is the SSE stream handle. It belongs to one HTTP response. If the agent held a writer as a module-level field, every request would write to the first request's stream. A new factory call per turn keeps writer lifetime tied to connection lifetime.
- **Swappable model.** Tests pass a mock language model. Batch jobs pass a cheaper tier. Evaluation runs pin a specific snapshot. None of that needs the prompt or tool code to change.
- **Run-scoped state.** Values like `runStartedAtMs` are captured in the closure and made available to `prepareStep` without being part of the agent's public surface.


## Prompt Layering

Do not write the system prompt as one giant string. Assemble it from **ordered modules**, each owning one concern. A real lead-agent prompt is 3,000-6,000 tokens; maintaining it as one string is unreadable and breaks every time someone edits it.

```typescript
// app/agents/lead/leadAgent.prompt.ts
export function buildLeadAgentSystemPrompt(options: {
  softToolCallBudget: number;
  toolRegistry: Array<{ name: string; guidance: string }>;
}) {
  // Order matters: the model weights earlier instructions more heavily.
  return [
    identityPrompt,                // who you are and what you do
    criticalRulesPrompt,           // non-negotiables, elevated for emphasis
    evidencePolicyPrompt,          // when grounding is required before answering
    toolPriorityPrompt,            // direct tool vs delegation routing
    delegationPlaybookPrompt,      // how to call delegate_* tools well
    buildToolGuidancePrompt(options.toolRegistry),  // per-tool rules
    outputFormatPrompt,            // response shape, citations
    toolCallBudgetPrompt(options.softToolCallBudget),  // soft budget nudge
    selfCheckPrompt,               // final "did I answer the question" pass
  ]
    .filter(Boolean)
    .join("\n\n")
    .trim();
}
```

The ordering is not arbitrary. Identity and critical rules come first because the model weights early instructions more heavily. Tool-priority routing comes before per-tool guidance so the model picks a class of tool before reading detailed rules. Budget and self-check come last because they shape finalization, not initial framing.

Here is the same idea as a diagram:

```
┌─────────────────────────────────────────────────────────────┐
│  1. Identity             "You are the Lead Agent for..."    │
│  2. Critical Rules       "Never fabricate NATP projects"    │
│  3. Evidence Policy      "Cite at least one grounding tool" │
│  4. Tool Priority        "Prefer direct tools; delegate     │
│                           only when multi-source"           │
│  5. Delegation Playbook  "delegate_sql_research takes..."   │
│  6. Per-Tool Guidance    "<delegate_sharepoint> ... </>"    │
│  7. Output Format        "Group findings by source"         │
│  8. Budget Behavior      "Near 24 calls? Synthesize now"    │
│  9. Self-Check           "Re-read the user turn and verify" │
└─────────────────────────────────────────────────────────────┘
         ↓ join("\n\n")
  One cacheable system prompt, stable across requests
```

### Keep the base prompt cacheable

Most model providers cache prompt prefixes. If the first 4,000 tokens of the system prompt are byte-identical across turns, the provider can skip re-encoding them and you get a cheaper, faster first response.

That cache breaks the moment you inject per-request data (a timestamp, a user ID, a session counter) into the base string. So the rule is: **the base system prompt contains no per-request data**. Anything dynamic goes into `prepareStep` and gets appended as a fresh system message each step. If you hard-code `new Date().toISOString()` into the static prompt, you have silently disabled caching for every user on the platform.

## The Tool Registry

Each Lead Agent tool carries two pieces of copy that do different jobs:

- **`description`**: one or two sentences the model reads when picking which tool to call. Short. Action-oriented. Part of the `tool()` definition so the model runtime can forward it to the provider.
- **Guidance**: a long block of usage rules, preferred call order, and failure handling. Not forwarded to the provider as metadata. It gets baked into the system prompt so the model reads it alongside every other instruction.

Both pieces live in the tool's own file, right next to the factory:

```typescript
// app/agents/lead/tools/delegateSqlResearch.ts
export const createSqlResearchTool = (deps: { writer?: UIMessageStreamWriter<UIMessage> }) =>
  tool<DelegateSqlInput, DelegateSqlOutput>({
    // Short by design. This is forwarded verbatim to the provider on every call.
    description: "Delegate a structured-data question to the SQL research subagent.",
    inputSchema: DelegateSqlInputSchema,
    execute: async (input, ctx) => { /* ... */ },
  });

// Plain string, no runtime imports. Safe to include in prompt assembly without
// dragging in the writer, Graph API client, or database pool types.
export const DELEGATE_SQL_GUIDANCE = `<delegate_sql_research_guidance>
- Use for questions about past projects, client engagements, or staffing history.
- Pass a single concrete question per call; do not batch unrelated queries.
- When the client name is ambiguous (e.g., "NATP" could match several rows),
  ask for disambiguation before delegating.
- You may call this in parallel with delegate_sharepoint_research.
</delegate_sql_research_guidance>`;
```

The **tool map** is the object the runtime invokes. The factory wires in per-request dependencies (writer, runtime context) without touching prompt code:

```typescript
// app/agents/lead/leadAgent.tools.ts
export type LeadAgentTools = {
  delegate_sql_research: Tool<DelegateSqlInput, DelegateSqlOutput>;
  delegate_sharepoint_research: Tool<DelegateSharePointInput, DelegateSharePointOutput>;
  delegate_web_research: Tool<DelegateWebInput, DelegateWebOutput>;
};

// Called once per turn so writer and runtimeContext stay scoped to a single request.
export function buildLeadAgentTools(deps: {
  writer?: UIMessageStreamWriter<UIMessage>;
  runtimeContext?: RuntimeContext;
}): LeadAgentTools {
  return {
    delegate_sql_research: createSqlResearchTool({ writer: deps.writer }),
    delegate_sharepoint_research: createSharePointResearchTool({ writer: deps.writer }),
    delegate_web_research: createWebResearchTool({ writer: deps.writer }),
  };
}
```

The **registry** is a thin `name → guidance` lookup the prompt builder iterates. It imports the guidance strings directly, never the tool factories:

```typescript
// app/agents/lead/leadAgent.toolRegistry.ts
// Imports only plain-string guidance constants. This keeps prompt assembly
// free of runtime types so prompt tests don't need a full agent fixture.
import { DELEGATE_SQL_GUIDANCE } from "./tools/delegateSqlResearch";
import { DELEGATE_SHAREPOINT_GUIDANCE } from "./tools/delegateSharePointResearch";
import { DELEGATE_WEB_GUIDANCE } from "./tools/delegateWebResearch";

// A thin name → guidance lookup. Filter this list to narrow the prompt's
// tool surface (e.g., hide SharePoint when that integration is disabled).
export const leadAgentToolRegistry = [
  { name: "delegate_sql_research",        guidance: DELEGATE_SQL_GUIDANCE },
  { name: "delegate_sharepoint_research", guidance: DELEGATE_SHAREPOINT_GUIDANCE },
  { name: "delegate_web_research",        guidance: DELEGATE_WEB_GUIDANCE },
];
```

A tempting simplification is to drop the registry and read guidance straight off the tool map in the prompt builder. Do not do this. Two reasons:

- **Prompt assembly stays dependency-free.** The moment `buildLeadAgentSystemPrompt` imports the tool map, it transitively pulls in the writer type, the Graph API client, the database pool, and every other runtime type those tools touch. Prompt tests then need a full runtime fixture to construct a string.
- **You frequently want the prompt to reflect a subset of tools.** If a turn runs with SharePoint access disabled, the prompt should not advertise `delegate_sharepoint_research`. Iterating a registry by name makes that filter trivial; deriving guidance from the constructed tool map requires the prompt builder to know how the runtime was configured.

One nuance: the AI SDK's `tool()` type does have an optional `providerMetadata` slot you could stuff guidance into, and the `description` field itself is another tempting home. Neither works here. `description` is short by design. Hundreds of tokens of per-tool rules will blow it up and the provider forwards it verbatim on every call. `providerMetadata` is provider-specific and not read by the prompt layer. A plain string constant exported from the tool file and surfaced through the registry keeps the guidance cheap to edit, cheap to test, and unambiguous about where it ends up.

Tool names are load-bearing across the whole stack. `delegate_sql_research` is a better name than `sql` or `database` because the prompt, the telemetry span, the UI label, and the test fixtures all key off that same string. Pick explicit, action-oriented names early. Renaming later means touching every layer.

## Injected Dependencies

A lead agent needs more than a model. These are the four things worth injecting rather than hard-coding:

- **`writer`**: the SSE stream handle. Threaded down into each `delegate_*_research` tool so subagent lifecycle events and tool activity flow into the same stream the API Layer opened.
- **`telemetry`**: the Langfuse (or equivalent) configuration. The agent wires itself up for tracing with `experimental_telemetry`, and the trace ID propagates into subagents so one turn maps to one root trace.
- **`model`**: selected from a registry by role (`default:leadAgent`, `default:subagent`, `default:summarizer`), not named inline. A registry lookup means you can swap models per tier without touching agent code. → See [11 - Model Selection & Registry](./11-model-selection-and-registry.md).
- **`runtimeContext`**: request-scoped services (auth context, feature flags, database handles). This is the object that lets a tool know "which user is asking" without the agent having to pass it through every argument.

The rule: inject at the factory boundary, not inside tool implementations or at module scope. A tool that reaches out to a global singleton is a tool you cannot test in isolation. A tool that accepts its dependencies through a factory is a tool you can hand a mock writer and unit-test in one `expect()`.

## The prepareStep Pipeline

`prepareStep` is the runtime hook that runs before every step (every call to the model). It sees the pending step's messages and available tools and can modify either. This is where **dynamic context** goes, where **loop detection** lives, and where **budget enforcement** decides whether the next step is allowed to call tools at all.

Here is a realistic `prepareStep` for the Lead Agent:

```typescript
// app/agents/lead/leadAgent.prepareStep.ts
export function createLeadAgentPrepareStep(options: {
  maxToolCalls: number;
  runStartedAtMs: number;
  maxTokens?: number;
}): PrepareStepFunction<LeadAgentTools> {
  return async (step) => {
    // 1. Dynamic context: append the current timestamp to the latest user message
    //    so the model sees "now" without breaking base-prompt caching.
    const withTimestamp = appendTimestampToLastUserMessage(step);

    // 2. Hard-stop check: token and tool-call budgets. Returns unchanged step
    //    if under limits; injects a synthesis directive if over.
    const withBudgetChecks = maxTokenChecker(withTimestamp, {
      maxTokens: options.maxTokens ?? 120_000,
      toolCallLimit: options.maxToolCalls,
    });

    // 3. Elapsed-time ceiling: stop starting new delegation rounds when the run
    //    has been going for too long. Token count alone does not catch this.
    //    A subagent can sit in a slow Graph API retry loop and burn 90 seconds
    //    without adding many tokens to the parent.
    const elapsedMinutes = (Date.now() - options.runStartedAtMs) / 60_000;
    if (elapsedMinutes >= 5) {
      return {
        ...withBudgetChecks,
        messages: withBudgetChecks.messages.concat({
          role: "system",
          content:
            "You have been running for over 5 minutes. Do NOT start new " +
            "delegate_* calls. Synthesize from evidence already collected " +
            "and clearly label any gaps.",
        }),
        activeTools: [],  // No more tool calls. Force the next step to answer.
      };
    }

    // 4. Loop guard: if the model has called delegate_sql_research 3 times
    //    without getting useful rows, stop letting it retry the same tool.
    //    Keep the other delegation tools available so the turn can still
    //    complete with partial evidence.
    const sqlStats = countToolCallsAndEmptyResults(step, "delegate_sql_research");
    if (sqlStats.calls >= 3 && sqlStats.emptyResults >= 2) {
      return {
        ...withBudgetChecks,
        messages: withBudgetChecks.messages.concat({
          role: "system",
          content:
            "Stop calling delegate_sql_research. You have already tried " +
            `${sqlStats.calls} times with ${sqlStats.emptyResults} empty results. ` +
            "Either proceed with SharePoint and Web evidence, or ask the user " +
            "to narrow the client name.",
        }),
        activeTools: ["delegate_sharepoint_research", "delegate_web_research"],
      };
    }

    return withBudgetChecks;
  };
}
```

Three things to notice:

- **Dynamic context is injected, not baked in.** Appending the timestamp happens every step. The base prompt stays cacheable.
- **Guardrails disable one tool, not all of them.** When the SQL subagent keeps striking out, the Lead Agent should still be allowed to synthesize from SharePoint and Web results. Setting `activeTools: []` is the nuclear option; reserve it for hard budget blows.
- **The return shape is the next step's input.** `messages` becomes what the model sees, `activeTools` restricts which tools it is allowed to emit. Anything you do not override is passed through unchanged.

## Hard and Soft Budgets

Every lead agent needs two layers of budget enforcement, plus a final backstop from the framework itself.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   SOFT BUDGET (prompt nudge)                                │
│   "You have 24 tool calls per turn. Batch where you can."   │
│   ↓ shapes behavior from the start                          │
│                                                             │
│   ────────────────────────────────────────────              │
│                                                             │
│   NEAR-LIMIT NUDGE (prepareStep system message)             │
│   "You're near the budget. Summarize and ask the user."     │
│   ↓ starts steering toward synthesis                        │
│                                                             │
│   ────────────────────────────────────────────              │
│                                                             │
│   HARD BUDGET (prepareStep activeTools: [])                 │
│   maxToolCalls: 30 reached. No more tool calls allowed.     │
│   ↓ forces one final synthesis step                         │
│                                                             │
│   ────────────────────────────────────────────              │
│                                                             │
│   TERMINAL STOP (AI SDK stopWhen)                           │
│   stepCountIs(32): framework ends the run, period           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

The three tiers serve different purposes:

- **Soft budget**: a number in the prompt (`softToolCallBudget: 24`). It shapes how the model plans. Given a 24-call budget, the model tends to batch delegations rather than fan out in three separate rounds.
- **Hard budget**: enforced in `prepareStep`. At `maxToolCalls: 30` the runtime sets `activeTools: []` and injects a synthesis directive. The model gets one more step to produce an answer, but it cannot call any more tools.
- **Terminal stop**: `stopWhen: [stepCountIs(32)]` on the agent. The extra two steps past the tool-call hard limit exist so the model has room for a final synthesis step even if something went sideways. Without this buffer, the agent can terminate immediately after its last tool call and never produce a coherent answer.

For a three-subagent fan-out, `24 / 30 / 32` is a sensible starting trio. A single delegation round is three tool calls (one per subagent); the budget gives the Lead Agent room for roughly eight delegation rounds, which is far more than a well-behaved turn needs but enough to survive retries and partial failures without hitting the hard ceiling.

### Two Views of Tokens

You will often need two different token estimates inside `prepareStep`:

1. **In-flight payload**: the untrimmed messages going to the provider right now. This is what gets rejected for context overflow, so guardrails check against this.
2. **Reusable context**: a trimmed version that survives into the next turn. This is what you persist and what gets reloaded on the next request.

Keep these semantics separate. A trimmed history may be appropriate for future turns while the current call still needs protection against overflow.

## Guardrails

Guardrails are defensive checks placed at specific points along the execution path. Budget enforcement is one of them. The four below protect against four different failure modes, and each runs in a different place in the code:

```
 Guardrail   | Prevents                                       | Runs in
 ------------+------------------------------------------------+---------------------------
 Input       | Malformed or empty requests wasting a model call | Before the first step
 Loop        | Repeated no-progress calls to one tool           | prepareStep (every step)
 Ambiguity   | Silent wrong guesses on entity resolution        | Inside the tool (execute)
 Evidence    | Confident claims without grounding               | Prompt + prepareStep
```

### Input guardrail

**Prevents** malformed, empty, or structurally broken requests from reaching the model. **Runs in** the API Layer, before the agent streams its first step.

Reject empty prompts with a typed error. Repair message history when possible. A client that resubmits a conversation missing a `tool-result` for a prior `tool-call` will cause the provider to return a confusing error partway through the response. Catch that at the edge and return a clear failure up front. For the example turn, the request is validated against a Zod schema the moment it arrives; the Lead Agent only ever sees well-formed messages.

### Loop guardrail

**Prevents** the model from burning budget retrying one tool that is not producing progress. **Runs in** `prepareStep`, checked on every step.

If the SQL subagent has returned zero rows for the client name "NATP" twice in a row, the third retry is unlikely to help. The `prepareStep` shown earlier detects that pattern, disables `delegate_sql_research` for the remainder of the turn, and leaves `delegate_sharepoint_research` and `delegate_web_research` available so the model can still synthesize from partial evidence:

```
Without loop guard:
  step 1:  delegate_sql_research({client: "NATP"})         → 0 rows
  step 2:  delegate_sql_research({client: "NATP Inc"})     → 0 rows
  step 3:  delegate_sql_research({client: "NATP Corp"})    → 0 rows
  step 4:  delegate_sql_research({client: "National Tax"}) → 0 rows
  ... continues until stopWhen fires, never delegates SharePoint or Web
  → User waits 45s for an empty answer

With loop guard (after 3 calls + 2 empty results):
  step 1:  delegate_sql_research({client: "NATP"})         → 0 rows
  step 2:  delegate_sql_research({client: "NATP Inc"})     → 0 rows
  step 3:  delegate_sql_research({client: "National Tax"}) → 0 rows
  step 4:  activeTools = ["delegate_sharepoint_research", "delegate_web_research"]
           → model delegates to the other two and synthesizes
  → User gets a partial answer in 15s with a clear note about SQL
```

### Ambiguity guardrail

**Prevents** the agent from silently picking the wrong entity when multiple candidates match. **Runs in** the tool itself. The `execute` function returns a "needs disambiguation" outcome instead of forging ahead.

"NATP" could resolve to the National Association of Tax Professionals the user means, or to a different client with a similar acronym. When the tool finds several plausible matches, it returns a structured result listing candidates and the Lead Agent asks the user to pick one. Silent guessing at this layer contaminates the rest of the turn. A wrong client ID poisons every downstream SQL query and every SharePoint lookup.

### Evidence guardrail

**Prevents** confident factual claims the agent cannot back up with a tool result. **Runs in** two places: the system prompt sets the policy ("cite at least one grounding call before asserting project counts or engagement history"), and `prepareStep` can enforce it by refusing to stop the loop while the assistant's draft answer makes claims no tool result supports.

For a turn like the example above, the Lead Agent should not say "we've done three projects with NATP" before a `delegate_sql_research` result actually confirms the count. The point is not to force maximal research. Short factual questions can answer directly from context. The point is to reject unsupported confident answers when a verification tool exists and has not been called.

When a guardrail disables tools, leave synthesis paths active.

## Factory-to-Runtime Flow

The factory is an assembly step, not a conversation. It pulls three builders together, wires run-scoped context into each, and hands back a configured agent. After that, the runtime takes over and runs its step loop. That shape is easier to read as a composition tree than as a sequence of messages:

```
createLeadAgent({ writer, telemetry, runtimeContext })
  ├── buildLeadAgentSystemPrompt({ softToolCallBudget: 24, toolRegistry })
  │     └── ordered prompt modules → one cacheable system string
  ├── buildLeadAgentTools({ writer, runtimeContext })
  │     └── delegate_sql_research · delegate_sharepoint_research · delegate_web_research
  ├── createLeadAgentPrepareStep({ maxToolCalls: 30, runStartedAtMs })
  │     └── timestamp injection · budget checks · loop guards
  └── experimental_telemetry { functionId, traceId }
        ↓
      new Agent({ system, tools, prepareStep, stopWhen, telemetry })
        ↓
      agent.stream({ messages })
        ↓
      loop every step:  prepareStep → model call → (text | tool-calls) → ...
        ↓
      stopWhen(stepCountIs(32))   : terminal backstop
```

Three things to notice:

- Each builder owns one concern and takes only what it needs. The prompt builder does not see the writer. The tool builder does not see the prompt. The `prepareStep` closure holds `runStartedAtMs` so it can enforce an elapsed-time ceiling without the agent's public surface carrying run-scoped state.
- `prepareStep` runs before every step. That is where dynamic context and guardrails live, not in the base prompt, which stays byte-identical across turns so the provider can cache it.
- `stopWhen` is the framework's terminal backstop. Every earlier layer is advisory; this one ends the run.

## Recommended Defaults

A starting baseline for a lead agent with three delegation tools:

- Dedicated lead-agent model tier, selected via a registry (`default:leadAgent`).
- System prompt assembled from ordered modules joined with `\n\n`. No per-request data in the base string.
- Each tool exports a short `description` and a long guidance constant; the prompt builder reads guidance through a thin `name → guidance` registry, not from the tool map.
- Inject `writer`, `telemetry`, and `runtimeContext` through the factory.
- `prepareStep` handles dynamic context, loop detection, and budget enforcement.
- Soft budget 24, hard budget 30, `stopWhen: [stepCountIs(32)]`. The +2 buffer gives room for final synthesis.
- Elapsed-time ceiling around 5 minutes. Token limits alone miss slow network loops.
- Disable only the misbehaving tool on loop; keep the paths to synthesis open.
- Require one grounding tool result before judgment-heavy answers.
- Prefer clarification over guessing on ambiguous entity resolution.

## Key Takeaways

- The Lead Agent is built by a factory that takes writer, telemetry, model, and runtime context as inputs, never a module singleton.
- The system prompt is assembled from ordered modules joined at build time, and the base string contains no per-request data so the provider can cache it.
- Each tool ships a short `description` (model-facing) and a long guidance string (prompt-facing). A thin registry surfaces guidance to prompt assembly without dragging in runtime dependencies.
- `prepareStep` is where dynamic context, loop detection, and budget enforcement live. The base prompt stays static; `prepareStep` handles everything that changes per step.
- Budgets are layered: a soft number in the prompt shapes behavior, a hard check in `prepareStep` forces synthesis, and `stopWhen` is the terminal backstop.
- Guardrails disable the misbehaving tool, not all tools. Preserve the paths to synthesis so the turn can still finish with partial evidence.

## Related Sections

- [01 - Architecture Overview](./01-architecture-overview.md): Where the Lead Agent sits in the full runtime layout.
- [02 - Request Flow & Streaming](./02-request-flow-and-streaming.md): How the writer reaches the factory in the first place.
- [04 - Subagent Fan-Out Pattern](./04-subagent-fanout-pattern.md): What the `delegate_*_research` tools do once the Lead Agent calls them.
- [05 - Type Safety & Custom UI Messages](./05-type-safety-and-custom-ui-messages.md): The typed message shape the Lead Agent writes into.
- [08 - Telemetry & Tracing](./08-telemetry-and-tracing.md): How the injected telemetry handle propagates trace context to subagents.
- [10 - Error Handling & Limits](./10-error-handling-and-limits.md): Deeper treatment of the budget, loop, and partial-failure patterns introduced here.
- [11 - Model Selection & Registry](./11-model-selection-and-registry.md): How `default:leadAgent` is resolved and how tiers differ from subagents.
