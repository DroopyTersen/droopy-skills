#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  render-md-printable.sh <file.md> [--output <file.pdf>] [--scale <0.8>] [--margin <css margin>] [--open]

Renders Markdown to a compact, formatted, paper-saving PDF using pandoc + Chrome headless.
Defaults:
  output: /tmp/md-print/<basename>-compact.pdf
  scale:  0.8
  margin: 0.28in 0.32in
EOF
}

if [[ $# -lt 1 ]]; then
  usage >&2
  exit 2
fi

input=$1
shift

output=""
scale="0.8"
margin="0.28in 0.32in"
open_pdf="false"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output)
      output=${2:-}
      shift 2
      ;;
    --scale)
      scale=${2:-}
      shift 2
      ;;
    --margin)
      margin=${2:-}
      shift 2
      ;;
    --open)
      open_pdf="true"
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ ! -f "$input" ]]; then
  echo "Markdown file not found: $input" >&2
  exit 1
fi

for required in pandoc python3 pdfinfo; do
  if ! command -v "$required" >/dev/null 2>&1; then
    echo "Required command not found: $required" >&2
    exit 1
  fi
done

chrome="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if [[ ! -x "$chrome" ]]; then
  chrome="/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
fi
if [[ ! -x "$chrome" ]]; then
  echo "Google Chrome or Microsoft Edge is required for compact PDF rendering." >&2
  exit 1
fi

out_dir="/tmp/md-print"
mkdir -p "$out_dir"
work_dir=$(mktemp -d "$out_dir/render.XXXXXX")
trap 'rm -rf "$work_dir"' EXIT

base=$(basename "$input")
stem=${base%.*}
if [[ -z "$output" ]]; then
  output="$out_dir/${stem}-compact.pdf"
fi

mkdir -p "$(dirname "$output")"
output=$(python3 -c 'import pathlib,sys; print(pathlib.Path(sys.argv[1]).resolve())' "$output")
input=$(python3 -c 'import pathlib,sys; print(pathlib.Path(sys.argv[1]).resolve())' "$input")
html="$work_dir/compact.html"
css="$work_dir/compact.css"

cat > "$css" <<EOF
@page {
  size: Letter;
  margin: ${margin};
}

html {
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

body {
  color: #111;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
  font-size: 9pt;
  line-height: 1.22;
  margin: 0;
  max-width: none;
  zoom: ${scale};
}

h1 {
  font-size: 16pt;
  line-height: 1.12;
  margin: 0 0 0.18in;
}

h2 {
  border-bottom: 1px solid #ddd;
  font-size: 12.5pt;
  line-height: 1.14;
  margin: 0.18in 0 0.07in;
  padding-bottom: 0.02in;
}

h3 {
  font-size: 10.5pt;
  line-height: 1.12;
  margin: 0.13in 0 0.04in;
}

p {
  margin: 0.045in 0;
}

ul,
ol {
  margin: 0.045in 0 0.06in 0.22in;
  padding-left: 0.12in;
}

li {
  margin: 0.025in 0;
}

code {
  font-family: "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  font-size: 8pt;
}

pre {
  background: #f6f6f6;
  border: 1px solid #ddd;
  border-radius: 3px;
  font-size: 7.6pt;
  line-height: 1.16;
  margin: 0.06in 0;
  overflow-wrap: anywhere;
  padding: 0.045in 0.06in;
  white-space: pre-wrap;
}

a {
  color: #111;
  text-decoration: none;
}

blockquote {
  border-left: 2px solid #ccc;
  margin: 0.06in 0;
  padding-left: 0.08in;
}

table {
  border-collapse: collapse;
  font-size: 8pt;
  width: 100%;
}

td,
th {
  border: 1px solid #ddd;
  padding: 0.025in 0.04in;
}

/* Keep code and wide tables inside compact pages. Diff signs remain literal;
   emphasis and shades remain useful on monochrome displays. */
pre code, pre span {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
}
pre code { font-size: inherit; }
div.sourceCode { overflow: visible; }
code span { color: #111 !important; }
code span.kw, code span.cf, code span.dt { font-weight: bold; }
code span.co { font-style: italic; }
table { table-layout: fixed; overflow-wrap: anywhere; }
img, svg { max-width: 100%; height: auto; }
tr, img { break-inside: avoid; }
h1, h2, h3, h4 { break-after: avoid; }

hr {
  border: 0;
  border-top: 1px solid #ddd;
  margin: 0.1in 0;
}
EOF

pandoc "$input" \
  --from markdown \
  --to html5 \
  --standalone \
  --metadata pagetitle="$stem" \
  --embed-resources \
  --resource-path="$(dirname "$input")" \
  --css "$css" \
  --output "$html"

# Recent macOS Chrome builds may write the PDF but remain running. Keep this
# isolated process bounded, then validate the newly generated file before use.
python3 - "$chrome" "$html" "$output" "$work_dir" <<'PYRENDER'
import os, pathlib, signal, subprocess, sys
chrome, html, output, work = sys.argv[1:]
rendered = pathlib.Path(work) / "rendered.pdf"
command = [chrome, "--headless", "--disable-gpu", "--no-first-run",
           "--no-default-browser-check", "--disable-background-networking",
           "--user-data-dir=" + work + "/chrome", "--no-pdf-header-footer",
           "--print-to-pdf=" + str(rendered), pathlib.Path(html).as_uri()]
with open(pathlib.Path(work) / "chrome.log", "w") as log:
    process = subprocess.Popen(command, stdout=log, stderr=log, start_new_session=True)
    try:
        process.wait(timeout=30)
    except subprocess.TimeoutExpired:
        os.killpg(process.pid, signal.SIGTERM)
        try:
            process.wait(timeout=3)
        except subprocess.TimeoutExpired:
            os.killpg(process.pid, signal.SIGKILL)
            process.wait()
    if not rendered.exists() or subprocess.run(["pdfinfo", str(rendered)], capture_output=True).returncode:
        raise SystemExit("Chrome did not produce a valid PDF; existing output was preserved.")
    pathlib.Path(output).write_bytes(rendered.read_bytes())
PYRENDER

if command -v pdfinfo >/dev/null 2>&1; then
  pdfinfo "$output" | awk '/^(Pages|Page size|File size):/'
fi

echo "$output"

if [[ "$open_pdf" == "true" ]]; then
  open "$output"
fi
