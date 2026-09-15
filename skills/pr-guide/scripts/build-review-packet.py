#!/usr/bin/env python3
"""Assemble an ordered, complete review packet from immutable Git commits."""
import argparse
import hashlib
import html
import json
from pathlib import Path
import re
import subprocess


def git(repo, *args):
    return subprocess.check_output(['git', '-C', str(repo), *args])


def build(repo, plan, guide, output):
    for key in ('base', 'head'):
        if not re.fullmatch(r'[0-9a-f]{40,64}', plan[key]):
            raise ValueError(f'{key} must be a full immutable commit ID')
        git(repo, 'cat-file', '-e', plan[key] + '^{commit}')
    base = git(repo, 'merge-base', plan['base'], plan['head']).decode().strip()
    # Both outputs use the same diffcore options and Git ordering. Splitting at
    # column-zero diff headers is safe: textual hunk lines have a prefix.
    options = ['--no-ext-diff', '--no-textconv', '--no-color', '--full-index',
               '--find-renames', '--submodule=short', base, plan['head'], '--']
    raw = git(repo, 'diff', '--name-status', '-z', *options).split(b'\0')
    files = []
    while raw and raw[0]:
        status = raw.pop(0).decode()
        path = raw.pop(0).decode('utf-8')
        previous = None
        if status.startswith(('R', 'C')):
            previous, path = path, raw.pop(0).decode('utf-8')
        files.append({'path': path, 'status': status, 'previous_path': previous})
    ordered = plan['files']
    paths = [f['path'] for f in ordered]
    expected = {f['path'] for f in files}
    if len(paths) != len(set(paths)) or set(paths) != expected:
        raise ValueError(f'File inventory mismatch: missing={expected-set(paths)}, '
                         f'extra={set(paths)-expected}; duplicates are forbidden')
    patch = git(repo, 'diff', *options)
    blocks = re.split(rb'(?=^diff --git )', patch, flags=re.M)[1:]
    # A file-type change (for example symlink to regular file) is emitted as
    # two adjacent sections: delete the old type, then add the new type.
    if len(blocks) != sum(2 if f['status'] == 'T' else 1 for f in files):
        raise ValueError('Git patch sections do not match the file inventory')
    by_path = {}
    offset = 0
    for info in files:
        count = 2 if info['status'] == 'T' else 1
        by_path[info['path']] = (info, b''.join(blocks[offset:offset + count]))
        offset += count
    sections = [f'# {plan.get("title", "Complete code review packet")}\n',
                f'Base: `{plan["base"]}`  \nHead: `{plan["head"]}`  \n'
                f'Comparison merge base: `{base}`\n',
                f'{len(files)} changed files. Full textual diffs follow in the guide’s reading order. '
                'Binary payloads are identified rather than printed. Soft wrapping in the PDF does not change the attached diff.\n',
                guide.read_text() if guide else '', '## Complete diffs\n']
    manifest = {'base': plan['base'], 'head': plan['head'], 'merge_base': base, 'files': []}
    full_diff = b''
    for index, item in enumerate(ordered, 1):
        info, block = by_path[item['path']]
        # Fail rather than corrupt non-UTF-8 text; the caller can arrange a
        # clearly labelled encoding conversion before claiming completeness.
        text = block.decode('utf-8')
        binary = bool(re.search(r'^Binary files .* differ$', text, re.M))
        sections.append(f'### {index}. {html.escape(item["path"])}\n')
        if item.get('note'):
            sections.append(item['note'] + '\n')
        if binary:
            sections.append('**Binary change:** content cannot be represented as a textual diff; inspect the original asset.\n')
        sections.append('<pre class="full-diff"><code>' + html.escape(text) + '</code></pre>\n')
        full_diff += block
        manifest['files'].append({**info, 'binary': binary,
                                  'patch_sha256': hashlib.sha256(block).hexdigest(),
                                  'patch_bytes': len(block)})
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text('\n'.join(sections))
    output.with_suffix('.diff').write_bytes(full_diff)
    output.with_suffix('.manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(f'{output}: {len(files)} files, {sum(f["binary"] for f in manifest["files"])} binary')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', type=Path, required=True)
    parser.add_argument('--plan', type=Path, required=True)
    parser.add_argument('--guide', type=Path)
    parser.add_argument('--output', type=Path, required=True, help='Output Markdown; diff and manifest saved alongside')
    args = parser.parse_args()
    try:
        build(args.repo, json.loads(args.plan.read_text()), args.guide, args.output)
    except (ValueError, KeyError, UnicodeError, subprocess.CalledProcessError) as error:
        parser.exit(1, f'Packet not assembled: {error}\n')


if __name__ == '__main__':
    main()
