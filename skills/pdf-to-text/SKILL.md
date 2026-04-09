---
name: pdf-to-text
description: Convert PDF documents into semantic plain text using visual page reading and high-resolution rasterization. Use when tasks involve extracting structured content from PDFs (charts, tables, diagrams, scanned pages, and multi-column layouts), including single files or batches with .txt outputs.
---

# PDF to Text (Vision-First)

Convert PDFs by rendering pages to images and reading them visually. Prefer this over raw text extraction for slides, investor decks, scanned docs, charts, and diagram-heavy pages.

## Model and Cost Control

Skills do not select the model. They run under the active Codex session model and reasoning settings.

For faster/cheaper runs, switch the session before using this skill:

- CLI: `/model <model-id>` or launch with `codex --model <model-id>`
- Config: set `model` and `model_reasoning_effort` in `~/.codex/config.toml` (or a named profile)

Subagents inherit the current session configuration unless Codex adds explicit per-subagent model controls.

## Resolve Inputs and Outputs

- Resolve PDF inputs from explicit file paths, glob patterns, or directory paths provided by the user.
- Default output path: same directory and basename as each PDF, with `.txt` extension.
- If user provides an output directory, write `<output-dir>/<pdf-basename>.txt`.
- If user provides a single `.txt` path and one PDF, use that path exactly.

## Determine Page Count

Use:

```bash
pdfinfo "<pdf_path>" | rg '^Pages:'
```

If `pdfinfo` is unavailable, fallback to:

```bash
mdls -name kMDItemNumberOfPages -raw "<pdf_path>"
```

## Render Pages at High Resolution

Use the bundled renderer script:

```bash
bash scripts/render_pdf_pages.sh "<pdf_path>" "<image_dir>" 300
```

Accuracy policy:

- Start at `300` DPI.
- If text is small, low-contrast, or table lines are hard to read, rerender affected pages at `450` DPI.
- If still unclear, rerender only those pages at `600` DPI.

Examples:

```bash
bash scripts/render_pdf_pages.sh "<pdf_path>" "<image_dir>" 450 21-30
bash scripts/render_pdf_pages.sh "<pdf_path>" "<image_dir>" 600 27
```

Keep rerenders page-scoped when possible; avoid 600 DPI full-document renders unless necessary.

## Visual Reading Workflow

Process in 10-page chunks:

1. Render pages (full document or per-range).
2. Open page images with `view_image`.
3. Extract semantic text for each page in order.
4. Start each page with `--- Page N ---`.
5. Keep page numbering continuous.

For larger documents, use `multi_tool_use.parallel` to open multiple pages at once. If needed, split ranges across subagents and merge outputs by page number.

## Conversion Rules

Use `references/conversion-prompt.md` as the canonical extraction template.

Minimum requirements:

- Preserve headings and section structure.
- Pair labels with values on one line (for example: `2018 — $32B`).
- Use `- ` bullets for lists.
- Represent quantitative visuals and financial blocks with `|` table structure.
- Describe diagrams and flows in bracketed detail:
  - `[Diagram: components, links, direction, hierarchy, and labels]`
- Describe informational images/maps/screenshots in bracketed form:
  - `[Image: what is shown and what information it conveys]`
- Skip decorative imagery and non-informational logos/icons.
- Strip page-number/footer cruft and summarize legal boilerplate briefly.

## Write Output

Write the entire final text in one atomic write operation:

```bash
cat > "<output_path>" <<'EOF'
...full converted text...
EOF
```

For multi-part conversion:

- Concatenate parts in numeric page order.
- Confirm there are no missing or duplicate `--- Page N ---` markers.
- Delete temporary part files unless user asks to keep them.
