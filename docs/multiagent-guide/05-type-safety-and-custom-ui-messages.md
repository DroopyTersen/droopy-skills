# Type Safety & Custom UI Messages

## Overview

When the NATP turn runs, a single **UIMessage** travels from the model, through three parallel subagent streams, into the database, and finally into the React renderer. Along that path it picks up metadata, custom data parts for each subagent, and typed tool parts for each of the three `delegate_*_research` calls. If any of those pieces drift out of shape, something downstream breaks — the trace ID goes missing from the feedback widget, the SharePoint progress card renders `undefined`, or the SQL delegation result fails to parse and the lead agent tries to synthesize from an empty object.

This chapter is about making those shapes explicit. The goal is a message stream that is typed end to end, so every writer knows what to emit and every reader knows what to expect.

A short note for readers coming from .NET: **Zod** is a runtime schema validator for TypeScript — conceptually similar to FluentValidation, but it also produces a compile-time type through `z.infer`. When this chapter says "schema," it means a Zod schema that validates at runtime and generates a TypeScript type from the same definition. **Generic type parameters** (the `<T>` syntax) work the same way as C# generics. A **discriminated union** is TypeScript's term for a tagged union — a set of shapes distinguished by a literal `type` field, like `{ type: "text" } | { type: "tool-call" }`.

## The Five Boundaries That Need Typing

Before the code, here are the five places where shape correctness actually matters. Each is a separate contract. Each has a different failure mode if left loose.

1. **Message metadata** — per-message facts like `traceId`, `runId`, `model`, token usage, and terminal flags. Read by feedback UI, error boundaries, and billing.
2. **Custom data parts** — sideband events the UI renders as non-text content, such as the three NATP subagent progress cards.
3. **Tool inputs and outputs** — the arguments and structured return values for `delegate_sql_research`, `delegate_sharepoint_research`, and `delegate_web_research`.
4. **Parser boundary** — the conversion from a subagent's streamed draft text into the authoritative structured result the lead agent consumes.
5. **UI render contracts** — the narrow, stable shapes the React components actually depend on.

Treat each as its own small contract. The patterns that follow give each one a runtime schema, a TypeScript type derived from that schema, and a defensive reader where the stream boundary is loose.

## The Core Type

Everything in the NATP stream is a **UIMessage**. The AI SDK exports it as a generic with three slots, one for each kind of content that can attach to a message:

```
UIMessage< MessageMetadata , MessageData , InferUITools<LeadAgentTools> >
          └─ slot 1 ──────┘ └─ slot 2 ─┘ └─ slot 3 ───────────────────┘
             metadata         custom       typed tool parts
                              data parts   (inferred from tool map)
```

The three slots map directly onto three kinds of streamed events:

- **Slot 1 — metadata.** One object per message. Carries facts about the run: `traceId`, token usage, finish reason.
- **Slot 2 — data parts.** Zero or more sideband events emitted as `data-*` parts. The NATP UI uses `data-subagent` to drive the three progress cards.
- **Slot 3 — tool parts.** Typed automatically from your tool registry. `delegate_sql_research` becomes a `tool-delegate_sql_research` part with narrowed `input` and `output` types.

For the NATP scenario, the full type is defined once and referenced everywhere:

```typescript
// app/chat/types/natpUIMessage.ts
import type { InferUITools, UIMessage } from "ai";
import type { MessageMetadata } from "./messageMetadata";
import type { MessageData } from "./messageData";
import type { LeadAgentTools } from "~/agents/lead/tools/types";

export type NatpUIMessage = UIMessage<
  MessageMetadata,
  MessageData,
  InferUITools<LeadAgentTools>
>;
```

This single type is what the API route, the stream writer, the persistence layer, and the React renderer all share. Change a tool's output schema and every reader narrows to the new shape. Add a metadata field and every consumer sees it.

## Metadata as a Runtime Contract

**Metadata** is the easy one to leave untyped. It feels like "just extra fields." But it is part of the stream contract — the feedback widget reads `traceId` to attach thumbs-up/down to the right Langfuse trace, the error boundary reads `error` and `errorMessage` to decide whether to offer a retry, and billing reads `usage.inputTokens` and `usage.outputTokens` per turn. Every one of those consumers lives far from the producer.

Write the schema in Zod, then infer the type. That way the same definition validates at runtime and provides compile-time narrowing.

```typescript
// app/chat/types/messageMetadata.ts
import { z } from "zod";

export const MessageMetadataSchema = z.object({
  traceId: z.string().optional(),       // e.g. "tr_7x2mn1" — feedback widget reads this
  runId: z.string().optional(),         // correlates to persisted run row
  model: z.string().optional(),         // "gpt-4.1" — surfaced in debug panel
  finishReason: z.string().optional(),  // "stop" | "tool-calls" | "length" | ...
  cancelled: z.boolean().optional(),    // user hit stop
  error: z.boolean().optional(),        // error boundary reads this
  errorMessage: z.string().optional(),
  usage: z
    .object({
      inputTokens: z.number().optional(),
      outputTokens: z.number().optional(),
      reasoningTokens: z.number().optional(),
    })
    .optional(),
});

export type MessageMetadata = z.infer<typeof MessageMetadataSchema>;
```

The API route attaches metadata at `start` (trace ID) and at `finish` (usage, finish reason). Keep field names stable — metadata is the part of the contract that tends to be read by the most layers for the longest time.

## Custom Data Parts Drive the Progress Cards

The three progress cards in the NATP UI are rendered from `data-subagent` parts, not from text. Each delegation tool emits one `data-subagent` event at `starting`, one at `running` when the subagent makes its first tool call, and one at `completed` or `error` when it finishes. The UI keys on `subagentId` and merges the transitions into a single card.

```
▼ SQL Subagent          [8 tool calls]  ✓ done
▼ SharePoint Subagent   [2 tool calls]  ⚠ partial — Graph API timeout after 8s
▼ Web Research          [3 tool calls]  ✓ done
```

The `MessageData` type is the second UIMessage slot. It maps each `data-*` suffix to its payload shape. For the NATP stream, the only custom part today is `subagent`, but the slot accommodates anything the UI needs to render outside of text and tool calls — follow-up suggestions, context-budget indicators, research plans.

```typescript
// app/chat/types/messageData.ts

export type SubagentData = {
  subagentId: string;                  // e.g. "sql-1", "sp-1", "web-1"
  name: string;                        // "SQL Subagent", "SharePoint Subagent", ...
  status: "starting" | "running" | "completed" | "error";
  parentToolCallId: string;            // links back to tc_0 / tc_1 / tc_2
  toolCallIds: string[];               // tool calls the subagent has made so far
};

export type MessageData = {
  subagent?: SubagentData;             // becomes the "data-subagent" part
  // Space for future data-* parts: suggestedFollowups, contextBudget, etc.
};
```

The SDK writes a `data-subagent` part by prefixing `data-` onto the key name. At the wire level, the DevTools EventStream row looks like this:

```
message   {"type":"data-subagent","id":"sql-1","data":{"subagentId":"sql-1","name":"SQL Subagent","status":"running","parentToolCallId":"tc_0","toolCallIds":["sql-1-call_a"]}}
```

## Why Custom Data Parts Need a Defensive Reader

Tool parts are strictly typed through the UIMessage generic. Custom `data-*` parts are not, for a practical reason: the SDK cannot statically know which string suffix maps to which payload shape, so the write path ends up doing an `as any` cast to inject the custom part. That works, but it means **the write is not enforced at runtime either**. A stale producer, a mid-migration schema change, or a hand-crafted test fixture can put a malformed `data-subagent` onto the stream, and the renderer will happily try to read `part.data.name` on an object that does not have one.

The fix is a single defensive reader. Put the shape validation here, once, and let every consumer go through it.

```typescript
// app/chat/helpers/parseSubagentData.ts

export type ParsedSubagentData = {
  subagentId: string;
  name?: string;
  status?: "starting" | "running" | "completed" | "error";
  parentToolCallId?: string;
  toolCallIds: string[];
};

export function getParsedSubagentData(
  part: { type?: unknown; data?: unknown } | null | undefined
): ParsedSubagentData | null {
  if (part?.type !== "data-subagent") return null;
  if (!part.data || typeof part.data !== "object") return null;

  const typed = part.data as {
    subagentId?: unknown;
    name?: unknown;
    status?: unknown;
    parentToolCallId?: unknown;
    toolCallIds?: unknown;
  };

  // subagentId is the identity key — reject the part if it's missing.
  if (typeof typed.subagentId !== "string" || !typed.subagentId) {
    return null;
  }

  // Status must be one of the four known literals; anything else is "unknown".
  const status =
    typed.status === "starting" ||
    typed.status === "running" ||
    typed.status === "completed" ||
    typed.status === "error"
      ? typed.status
      : undefined;

  return {
    subagentId: typed.subagentId,
    name: typeof typed.name === "string" ? typed.name : undefined,
    status,
    parentToolCallId:
      typeof typed.parentToolCallId === "string" ? typed.parentToolCallId : undefined,
    toolCallIds: Array.isArray(typed.toolCallIds)
      ? typed.toolCallIds.filter((id): id is string => typeof id === "string")
      : [],
  };
}
```

The progress-card component, the persistence projection, and the server-side subagent-details endpoint all call `getParsedSubagentData` instead of reading the part directly. That one function becomes the real parser boundary for custom data — and the single place to handle migrations when the shape changes.

## Tool Typing From Zod

The three delegation tools each have a Zod input schema and a Zod output schema. Define them once; derive everything else.

```typescript
// app/agents/lead/tools/types.ts
import { z } from "zod";
import { tool } from "ai";

// --- Inputs --------------------------------------------------------------

export const DelegateSqlInputSchema = z.object({
  query: z.string().describe("Natural-language description of what to look up in the project database."),
});
export const DelegateSharePointInputSchema = z.object({
  query: z.string().describe("What to search for in the pre-sales SharePoint folder."),
});
export const DelegateWebInputSchema = z.object({
  query: z.string().describe("Search query for public news and announcements."),
});

// --- Outputs -------------------------------------------------------------

// One citation shape for any subagent. sourceType narrows to where the citation came from.
export const CitationSchema = z.object({
  sourceId: z.string(),                                         // project row id, file id, URL
  sourceType: z.enum(["project", "sharepoint", "web"]),
  title: z.string().optional(),
  sectionId: z.string().optional(),
  quote: z.string().optional(),
  context: z.string().optional(),
});

export const DelegateResearchResultSchema = z.object({
  status: z.enum(["completed", "partial", "error"]),
  findings: z.string(),                                         // authoritative prose summary
  citations: z.array(CitationSchema),
  error: z.string().optional(),                                 // present when status != "completed"
  partial: z.boolean().optional(),                              // set when a timeout killed the subagent mid-work
});

export type DelegateResearchResult = z.infer<typeof DelegateResearchResultSchema>;

// --- Tool map ------------------------------------------------------------

export type LeadAgentTools = {
  delegate_sql_research: ReturnType<typeof tool<
    z.infer<typeof DelegateSqlInputSchema>,
    DelegateResearchResult
  >>;
  delegate_sharepoint_research: ReturnType<typeof tool<
    z.infer<typeof DelegateSharePointInputSchema>,
    DelegateResearchResult
  >>;
  delegate_web_research: ReturnType<typeof tool<
    z.infer<typeof DelegateWebInputSchema>,
    DelegateResearchResult
  >>;
};
```

Once the tool map is declared, `InferUITools<LeadAgentTools>` expands it into three discriminated tool parts: `tool-delegate_sql_research`, `tool-delegate_sharepoint_research`, and `tool-delegate_web_research`. Each carries its own narrowed `input` and `output` types. The React renderer can `switch` on `part.type` and get full type narrowing on the other side.

## Reconcile Tool Parts by `toolCallId`, Not by Position

Here is what actually flows over the SSE connection for one NATP delegation tool call. The SQL subagent's call to `delegate_sql_research` is not one event — it is a sequence:

```
 Id                     Type                         Data                                                           Time
─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
 msg_0j3kp9             start                        {"messageMetadata":{"traceId":"tr_7x2mn1"}}                    12:27:19.788
 (tc_0)                 tool-input-start             {"toolCallId":"tc_0","toolName":"delegate_sql_research"}       12:27:19.970
 (tc_0)                 tool-input-delta             {"toolCallId":"tc_0","inputTextDelta":"{\"query\":\"Past NA"}  12:27:19.975
 (tc_0)                 tool-input-delta             {"toolCallId":"tc_0","inputTextDelta":"TP engagements\"}"}    12:27:19.979
 (tc_0)                 tool-input-available         {"toolCallId":"tc_0","input":{"query":"Past NATP ..."}}        12:27:19.980
 sql-1                  data-subagent                {"subagentId":"sql-1","status":"starting", ... }               12:27:20.020
 sql-1                  data-subagent                {"subagentId":"sql-1","status":"running", ... }                12:27:20.890
 (tc_0)                 tool-output-available        {"toolCallId":"tc_0","output":{"status":"completed", ...}}     12:27:26.100
 sql-1                  data-subagent                {"subagentId":"sql-1","status":"completed", ... }              12:27:26.120
```

One tool call produces four to five chunks. If the UI treats each chunk as a separate event and appends it to a list, the user sees a nonsense staircase of partial rows. The right shape is **one reconciled record per `toolCallId`**, updated in place as chunks arrive.

```typescript
// app/chat/helpers/reconcileToolCall.ts
import type { NatpUIMessage } from "~/chat/types/natpUIMessage";

type ToolPart = Extract<NatpUIMessage["parts"][number], { type: `tool-${string}` }>;

type ReconciledToolCall = {
  toolCallId: string;                                            // authoritative key — do not use array index
  toolName: string;                                              // "delegate_sql_research"
  state: "input-streaming" | "input-available" | "output-available" | "output-error";
  input?: unknown;                                               // accumulates during input-delta
  output?: unknown;                                              // present once output-available fires
  error?: unknown;                                               // captured when state === "output-error"
};

export function applyToolChunk(
  prev: Map<string, ReconciledToolCall>,
  part: ToolPart
): Map<string, ReconciledToolCall> {
  // Always key by toolCallId. Position in the stream is not stable across merged subagent streams.
  const existing = prev.get(part.toolCallId);
  const base: ReconciledToolCall =
    existing ?? { toolCallId: part.toolCallId, toolName: part.type.replace(/^tool-/, ""), state: "input-streaming" };

  switch (part.state) {
    case "input-streaming":
      return new Map(prev).set(part.toolCallId, { ...base, state: "input-streaming", input: part.input });
    case "input-available":
      return new Map(prev).set(part.toolCallId, { ...base, state: "input-available", input: part.input });
    case "output-available":
      return new Map(prev).set(part.toolCallId, { ...base, state: "output-available", input: part.input, output: part.output });
    case "output-error":
      return new Map(prev).set(part.toolCallId, { ...base, state: "output-error", input: part.input, error: part.error });
    default:
      return prev;
  }
}
```

Two rules come out of this:

- **Never key by array index.** When the SharePoint and SQL subagents run in parallel, their chunks interleave. Position is meaningless.
- **Replace, do not concatenate.** `input-available` supersedes anything from `input-streaming`. `output-available` is authoritative.

Chapter 04 covers how `writer.merge()` namespaces child tool call IDs so parallel subagents do not collide on the reconciliation key.

## Parser Boundaries: Streamed Text vs Structured Output

Each subagent produces two different shapes of output. Treat them as two different contracts.

```
┌─────────────────────────────────────────────────────────────────────┐
│  SQL Subagent                                                       │
│                                                                     │
│  Streamed text     ──►  "Looking at schema... trying WHERE clause…" │
│  (provisional)          shown in the expanded progress card         │
│                                                                     │
│  Structured result ──►  { status, findings, citations }             │
│  (authoritative)        returned by delegate_sql_research tool      │
└─────────────────────────────────────────────────────────────────────┘
```

Provisional text is useful for the human reading the progress card. It is not a machine contract. The lead agent must never try to parse the subagent's streamed prose to pick out what NATP projects were found. The authoritative answer is the structured tool output — validated against `DelegateResearchResultSchema` at the tool boundary.

This is a common place where systems drift. A subagent that "mostly returns markdown" ends up with a lead agent that "mostly parses it," and six weeks later a formatting change on the subagent silently breaks three downstream renderers. Validate at the tool boundary, return a typed object, and let the streaming text exist for the UI only.

## Model Partial and Error States Explicitly

Partial success is the normal case for a NATP turn. The SharePoint Graph API might time out while SQL and web finish cleanly. The result schema needs to be honest about that — do not force every branch to fake completeness.

```typescript
// Example of a partial result returned when the SharePoint subagent hits its timeout
const result: DelegateResearchResult = {
  status: "partial",
  partial: true,
  findings: "Found 2 files before timeout: NATP-discovery-deck-v3.pptx, NATP-SOW-draft.docx",
  citations: [ /* two file citations */ ],
  error: "Graph API search timed out after 8s",
};
```

The same schema supports four meaningfully different outcomes: `completed` with full findings, `partial` with whatever was collected before a timeout, `error` when the subagent could not produce anything usable, and cancelled at the message level (`metadata.cancelled = true`). Each one reaches the UI with an explicit tag, so the progress card can render `✓ done`, `⚠ partial`, or `✗ error` without guessing from prose.

## Renderer Uses Narrowed Types

Once the UIMessage is typed, the renderer is a small `switch`. Every branch gets its input and output narrowed automatically — no manual casts, no `any`.

```tsx
// app/chat/components/MessagePart.tsx
import type { NatpUIMessage } from "~/chat/types/natpUIMessage";
import { getParsedSubagentData } from "~/chat/helpers/parseSubagentData";

type Part = NatpUIMessage["parts"][number];

export function MessagePart({ part }: { part: Part }) {
  // Plain assistant text.
  if (part.type === "text") {
    return <p>{part.text}</p>;
  }

  // Sideband subagent progress — goes through the defensive reader, never direct.
  if (part.type === "data-subagent") {
    const data = getParsedSubagentData(part);
    if (!data) return null;                       // malformed part — skip rather than crash
    return <SubagentPanel data={data} />;
  }

  // Typed tool parts — narrowed input/output via InferUITools<LeadAgentTools>.
  if (part.type === "tool-delegate_sql_research") {
    return <DelegationCard name="SQL" input={part.input} output={part.output} state={part.state} />;
  }
  if (part.type === "tool-delegate_sharepoint_research") {
    return <DelegationCard name="SharePoint" input={part.input} output={part.output} state={part.state} />;
  }
  if (part.type === "tool-delegate_web_research") {
    return <DelegationCard name="Web Research" input={part.input} output={part.output} state={part.state} />;
  }

  return null;                                    // unknown part type — do not render
}
```

Three things to notice:

- The `data-subagent` branch goes through `getParsedSubagentData`, not directly into a component. That is the one place malformed writes are caught.
- Each `tool-*` branch has fully narrowed `input` and `output`. No `as` casts, no runtime guards.
- Unknown part types fall through to `return null`. A new `data-*` type added upstream does not crash the renderer while the UI catches up.

## ID Identity Across Merged Streams

Typed narrowing only works if IDs are unique. When the SQL, SharePoint, and web subagents run in parallel, each generates its own local `toolCallId` values — and without remapping, two subagents can both emit a `tool-call` with `toolCallId: "tc_1"`. The reconciliation map collapses two different calls into one record and state corrupts.

```
Without remapping:
  SQL subagent:        tool-call  toolCallId="tc_1"  toolName="execute_query"
  SharePoint subagent: tool-call  toolCallId="tc_1"  toolName="graph_search"
  → reconciliation map has one entry for "tc_1" with conflicting updates → corruption

With remapping:
  SQL subagent:        tool-call  toolCallId="sql-1-tc_1"  toolName="execute_query"
  SharePoint subagent: tool-call  toolCallId="sp-1-tc_1"   toolName="graph_search"
  → two distinct entries → clean reconciliation
```

The `writer.merge()` path in the delegation tool namespaces child IDs before they enter the parent stream. For the mechanics, see [04 - Subagent Fan-Out Pattern](./04-subagent-fanout-pattern.md). The point here is that typed tool parts assume unique IDs — the type system cannot enforce that, so the stream layer has to.

## Key Takeaways

- A single `UIMessage<Metadata, Data, InferUITools<Tools>>` is the shared contract between model, stream, persistence, and renderer.
- Write metadata as a Zod schema and infer the TypeScript type — metadata is the field set most consumers read for the longest time.
- Custom `data-*` parts need both compile-time typing in the UIMessage generic and a defensive runtime reader, because SDK writes of custom parts are not strictly enforced.
- Derive tool types from Zod schemas. `InferUITools<LeadAgentTools>` generates narrowed `tool-*` parts for free.
- Reconcile streamed tool chunks into one record per `toolCallId`. Never key by array position.
- Streamed text is provisional UI state; only the structured tool output is authoritative for the lead agent.
- Model partial, cancelled, and error states directly in the schema — do not fake completeness.

## Related Sections

- [01 - Architecture Overview](./01-architecture-overview.md): Where the UIMessage sits in the runtime stack
- [02 - Request Flow & Streaming](./02-request-flow-and-streaming.md): How the stream carries the parts this chapter types
- [04 - Subagent Fan-Out Pattern](./04-subagent-fanout-pattern.md): ID remapping that keeps reconciliation keys unique
- [06 - UI Rendering](./06-ui-rendering.md): Component-level patterns for the narrowed part types
- [09 - Conversation Persistence](./09-conversation-persistence.md): Persisting the typed UIMessage as JSONB and reading it back safely
