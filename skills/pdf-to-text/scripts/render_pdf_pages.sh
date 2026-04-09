#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 || $# -gt 4 ]]; then
  echo "Usage: $0 <pdf_path> <out_dir> [dpi] [page_range]" >&2
  echo "  page_range formats: N or N-M" >&2
  exit 1
fi

pdf_path="$1"
out_dir="$2"
dpi="${3:-300}"
page_range="${4:-}"

mkdir -p "$out_dir"

if [[ -z "$page_range" ]]; then
  pdftoppm -png -r "$dpi" "$pdf_path" "$out_dir/page"
  exit 0
fi

if [[ "$page_range" =~ ^([0-9]+)-([0-9]+)$ ]]; then
  start="${BASH_REMATCH[1]}"
  end="${BASH_REMATCH[2]}"
  pdftoppm -png -r "$dpi" -f "$start" -l "$end" "$pdf_path" "$out_dir/page"
  exit 0
fi

if [[ "$page_range" =~ ^([0-9]+)$ ]]; then
  page="${BASH_REMATCH[1]}"
  pdftoppm -png -r "$dpi" -f "$page" -l "$page" "$pdf_path" "$out_dir/page"
  exit 0
fi

echo "Invalid page_range '$page_range'. Expected N or N-M." >&2
exit 2
