#!/usr/bin/env python3
"""Save a URL's Jina Reader extraction as the audio adaptation's source."""

import argparse
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("url", help="Full HTTP or HTTPS URL to read")
    parser.add_argument("output", type=Path, help="Local Markdown source file")
    args = parser.parse_args()

    source = urlsplit(args.url)
    if source.scheme not in ("http", "https") or not source.netloc:
        parser.error("Provide a full HTTP or HTTPS URL.")

    try:
        request = Request(
            f"https://r.jina.ai/{args.url}",
            headers={"X-Respond-With": "markdown"},
        )
        with urlopen(request, timeout=60) as response:
            content = response.read().decode("utf-8")
        if not content.strip():
            raise ValueError("Jina Reader returned an empty response.")
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(content, encoding="utf-8")
    except HTTPError as error:
        print(f"Jina Reader returned HTTP {error.code}: {error.reason}", file=sys.stderr)
        return 1
    except (URLError, OSError, UnicodeError, ValueError) as error:
        print(f"Could not save Jina Reader source: {error}", file=sys.stderr)
        return 1

    print(f"Saved {len(content.encode('utf-8')):,} bytes to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
