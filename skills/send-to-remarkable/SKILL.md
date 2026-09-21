---
name: send-to-remarkable
description: Send documents, conversation responses, code, PR guides, or complete review packets to Andrew's reMarkable as readable PDFs. Use for “send this to my reMarkable” or “I'll read this later” with that destination.
---

# Send to reMarkable

Preserve the requested content unless Andrew asks for a summary. Resolve “this” from the current conversation or named artifact; ask only when genuinely ambiguous. Export conversation prose faithfully with its code, links, tables and diagrams. For existing PDFs, send the original without reflowing it. Keep a usable local PDF if delivery fails.

## Prepare the PDF

Use the styled HTML renderer for Markdown guides, prose, and Git diffs:

```bash
# Install pinned renderer dependencies once in the installed skill directory:
npm install --prefix ~/.agents/skills/send-to-remarkable --ignore-scripts --no-audit --no-fund
node ~/.agents/skills/send-to-remarkable/scripts/render-reading.cjs \
  /absolute/source.md /absolute/reading.pdf
```

The reMarkable profile uses Letter pages, **10.98pt prose and 9.27pt code**, with margins **top 0.28in, right 0.75in, bottom 0.28in, left 0.21in**. These are the approved reading sizes; keep compact paper-printing defaults separate. Apply the safe right edge to every element, including footers, tables, code and headings. Prose at this size still needs a text-heavy tablet check.

Render actual unified `diff` fences with diff2html's GitHub-style red/green rows, line numbers, word highlights and source syntax highlighting. Keep +/− signs. Do not add underlines or a separate grayscale variant. Do not add strikethroughs; use the original GitHub-style highlighting. Print HTML directly to PDF to preserve sharp selectable text; screenshots are only needed for assets that cannot print correctly. Keep the resulting self-contained HTML beside the PDF.

For a requested readability revision, reuse the existing document source and change only its layout. Reflow and repaginate with larger type, preserving all prose and complete code/diffs; refresh page references and bookmarks. A simple zoom of fixed PDF pages can crop content. Preserve original PDF assets unless Andrew asks to alter them. Do not rewrite or summarize the content merely to fit fewer pages.

Keep code signs and syntax cues legible in monochrome. The renderer automatically converts Mermaid fences through the pinned Mermaid CLI into local SVG assets, preserving the diagram definitions beside them and embedding the SVGs in the HTML/PDF. It uses high-contrast labels and strokes and disables flowchart HTML labels so SVG text prints reliably. Diagrams are sized by measured SVG label fonts rather than stretched to page width: aim for 10.98pt labels, center compact diagrams, preserve proportions, and cap width at the safe page area and height at 520pt to leave room for explanation. The renderer writes a `.layout.json` beside each SVG. If fitting would reduce any label below 9.27pt, it stops and requests a simpler layout or focused split; do not bypass this by forcing a smaller image. Inspect the resulting pixels as the final quality check, rather than choosing every size manually. A diagram render failure stops PDF replacement. Keep each diagram together on a page, with its short explanation nearby. Inspect labels, branch directions, arrowheads, notes, self-calls and dashed returns in rendered PDF pixels. Check the safe right edge and avoid orphaned captions. If a diagram is too tall or wide, simplify its layout or split it into focused diagrams while preserving its relationships; do not shrink labels until they are hard to read. Mermaid source and SVGs stay in the PDF's sibling `*-diagrams` directory, and the HTML embeds them without network access. Convert other diagram sources into local SVG/PNG assets before rendering; never leave diagram source where a rendered diagram was requested. The helper embeds local images relative to the source file. Review rendered PDF pages with the PDF skill, especially wide code/tables, diagrams and page breaks. Inspect all pages for ordinary packets; use systematic coverage for very large documents and report any unreviewed pages.

For a PR walkthrough, compose with **pr-guide**. If Andrew asks for a **complete code review packet**, use its [complete packet workflow](../pr-guide/references/complete-packet.md): the agent chooses a semantic reading order and a deterministic program includes full diffs for every pinned changed file. Curated inline evidence is not a complete packet.

## Deliver

Sending is authorized by the request; do not ask again to upload that document. Prefer USB when reachable, then cloud when unplugged. Honor an explicit transport. Use a concise descriptive title. Every send defaults to the exact folder **`/Inbox`**, across USB, cloud, and auto. Use another destination only when Andrew explicitly requests it; pass that destination with `--folder`.

```bash
python3 ~/.agents/skills/send-to-remarkable/scripts/send-pdf.py \
  /absolute/reading.pdf --title 'Reading title' --transport auto
# Defaults to /Inbox. Override only when requested:
# --transport usb|cloud --folder '/Requested folder'
```

Ensure `/Inbox` exists before a default send. Inspect a fresh root listing; if it is absent, create it with `rmapi -ni mkdir /Inbox`, then verify the folder in the selected transport (allowing cloud-to-device sync when using USB). Creating Inbox for delivery is authorized. If creation or sync is unavailable, retain the PDF and report the block; never fall back to the root or another folder. The helper requires the destination to exist, uses a stable title, uploads once, and verifies a fresh listing. It replaces an existing same-title document by default and keeps a `.delivery.json` receipt beside the PDF. Before replacement it backs up the cloud document assets (including synced annotations) to a local ZIP and validates the archive. Cloud replacement recreates the document: its ID may change, and annotations are retained in the backup rather than promised on reflowed pages. Duplicate titles or a receipt pointing at a different existing ID stop delivery. USB supports new uploads; replacement uses cloud in auto mode, or stops when USB was explicitly requested. Never delete first. An `attempting` receipt means the outcome may be ambiguous: inspect fresh USB/cloud listings before any retry. Do not switch transports after an uncertain upload or automatically add a suffix and resend. Reuse the same title and local PDF path for layout/content revisions; never add Larger Text, revision numbers, or dates solely to distinguish revisions. Use a new title only for a distinct document. Archive the prior receipt before replacing it. An unresolved attempting receipt stops even when the PDF content has changed; reconcile it against fresh listings first.

USB: tablet connected and USB web interface enabled at `http://10.11.99.1/`. The currently verified app lists `/documents/` (field `VissibleName`) and POSTs multipart field `file` to `/upload` (201). Folder selection is stateful: list that folder immediately before upload and avoid concurrent browsing in the USB UI. Recheck the served app contract if firmware changes break it.

Cloud: use maintained [ddvk/rmapi](https://github.com/ddvk/rmapi), installed at `~/.local/bin/rmapi`. It supports `-ni -json ls /`, `put file.pdf /folder`, `mkdir` and `mv`. Use `put --force` only after the helper has identified one exact same-title document and validated its backup. Do not use `--content-only` to promise annotation preservation. Pair only when needed through its current official one-time-code page; keep codes/tokens out of chat, logs and repository files. On macOS v0.0.35, new auth normally lives at `~/Library/Application Support/rmapi/rmapi.conf` (0600), with existing `~/.rmapi` and `RMAPI_CONFIG` taking precedence. Never print auth files or enable trace logging.

## Library boundaries

Do not reorganize the library, move existing documents, or rename folders as part of sending. Separate explicit instructions are required for those actions. Replacement of the requested document is part of sending a revision; retain its prior assets locally. Do not clean up older suffix variants or unrelated documents without explicit instructions.

## Report evidence

Return the document title, local PDF link, transport, destination and observed outcome. “Listed in cloud” does not prove the tablet synced. A fresh USB listing can verify arrival on the device even after a cloud upload. A connected-cable cloud test does not prove physically unplugged operation. If delivery stops, state the concrete block and keep the local PDF available.

Use dark neutral syntax-token text in diff code for grayscale legibility; keep the approved red/green addition and deletion backgrounds and word-change highlights. Do not reintroduce pale keyword colors, underlines, or strikethrough.
