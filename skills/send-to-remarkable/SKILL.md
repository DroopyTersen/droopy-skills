---
name: send-to-remarkable
description: Send documents, conversation responses, code, PR guides, or complete review packets to Andrew's reMarkable as compact PDFs. Use for “send this to my reMarkable” or “I'll read this later” with that destination.
---

# Send to reMarkable

Preserve the requested content unless Andrew asks for a summary. Resolve “this” from the current conversation or named artifact; ask only when genuinely ambiguous. Export conversation prose faithfully with its code, links, tables and diagrams. For existing PDFs, send the original without reflowing it. Keep a usable local PDF if delivery fails.

## Prepare the PDF

Use the installed **print-md-document** skill and its existing renderer:

```bash
bash ~/.agents/skills/print-md-document/scripts/render-md-printable.sh \
  /absolute/source.md --output /absolute/reading.pdf
```

Andrew wants the existing compact defaults: Letter, 9pt body, about 7.6–8pt code, 80% zoom, margins 0.28in 0.32in. He zooms on the tablet. Do not enlarge type or add wide annotation margins without his request. Keep code signs and syntax cues legible in monochrome. Convert Mermaid or other diagram source into local SVG/PNG assets in a derived Markdown document before rendering, preserving labels and relationships; never leave diagram source where a rendered diagram was requested. The helper embeds local images relative to the source file. Review rendered PDF pages with the PDF skill, especially wide code/tables, diagrams and page breaks. Inspect all pages for ordinary packets; use systematic coverage for very large documents and report any unreviewed pages.

For a PR walkthrough, compose with **pr-guide**. If Andrew asks for a **complete code review packet**, use its [complete packet workflow](../pr-guide/references/complete-packet.md): the agent chooses a semantic reading order and a deterministic program includes full diffs for every pinned changed file. Curated inline evidence is not a complete packet.

## Deliver

Sending is authorized by the request; do not ask again to upload that document. Prefer USB when reachable, then cloud when unplugged. Honor an explicit transport. Use a concise descriptive title and the requested folder. A root-level send is acceptable when there is no established reading inbox.

```bash
python3 ~/.agents/skills/send-to-remarkable/scripts/send-pdf.py \
  /absolute/reading.pdf --title 'Reading title' --transport auto
# Optional: --transport usb|cloud --folder '/Reading Inbox'
```

The helper checks for an existing title, uploads once, and verifies a fresh listing. It refuses overwrite and keeps a `.delivery.json` receipt beside the PDF. An `attempting` receipt means the outcome may be ambiguous: inspect fresh USB/cloud listings before any retry. Do not switch transports after an uncertain upload or automatically add a suffix and resend. A different content version should receive an intentional new title; preserve existing annotations.

USB: tablet connected and USB web interface enabled at `http://10.11.99.1/`. The currently verified app lists `/documents/` (field `VissibleName`) and POSTs multipart field `file` to `/upload` (201). Folder selection is stateful: list that folder immediately before upload and avoid concurrent browsing in the USB UI. Recheck the served app contract if firmware changes break it.

Cloud: use maintained [ddvk/rmapi](https://github.com/ddvk/rmapi), installed at `~/.local/bin/rmapi`. It supports `-ni -json ls /`, `put file.pdf /folder`, `mkdir` and `mv`. Never use `put --force` or `--content-only` by default. Pair only when needed through its current official one-time-code page; keep codes/tokens out of chat, logs and repository files. On macOS v0.0.35, new auth normally lives at `~/Library/Application Support/rmapi/rmapi.conf` (0600), with existing `~/.rmapi` and `RMAPI_CONFIG` taking precedence. Never print auth files or enable trace logging.

## Organize the library

Andrew authorizes creating/renaming folders and moving existing documents into a useful tidy library without repeated confirmation. Exercise proportionate judgment during sends or organization requests: a **Reading Inbox** for new material and a few topic/project folders are enough. Inspect fresh listings first and use rmapi `mkdir`/`mv` when cloud is paired. Preserve content and annotations; organization authority does not permit deletion or destructive overwrite. Do not launch a background organizer.

## Report evidence

Return the document title, local PDF link, transport, destination and observed outcome. “Listed in cloud” does not prove the tablet synced. A fresh USB listing can verify arrival on the device even after a cloud upload. A connected-cable cloud test does not prove physically unplugged operation. If delivery stops, state the concrete block and keep the local PDF available.
