#!/usr/bin/env python3
"""Behavioral acceptance with an isolated, nonsensitive Git repository."""
import html
import importlib.util
import json
from pathlib import Path
import re
import subprocess
import tempfile

spec = importlib.util.spec_from_file_location('packet', Path(__file__).with_name('build-review-packet.py'))
packet = importlib.util.module_from_spec(spec)
spec.loader.exec_module(packet)


def run(root):
    repo = root / 'repo'
    repo.mkdir()
    def git(*args):
        return subprocess.check_output(['git', '-C', str(repo), *args])
    git('init', '-q')
    git('config', 'user.name', 'Review Fixture')
    git('config', 'user.email', 'fixture@example.invalid')
    originals = {'z-workflow.py': 'def read():\n    return "old"\n',
                 'a-storage.py': '\n'.join(f'old_{i} = {i}' for i in range(160))+'\n',
                 'remove.txt': 'Remove this obsolete setting\n',
                 'old name.txt': 'Unchanged content for rename\n'*20,
                 'mode.sh': '#!/bin/sh\necho done\n'}
    for name, content in originals.items():
        (repo / name).write_text(content)
    (repo / 'image.bin').write_bytes(b'\x00old asset\xff')
    (repo / 'type-change').symlink_to('mode.sh')
    git('add', '.')
    git('commit', '-qm', 'Fixture base')
    base = git('rev-parse', 'HEAD').decode().strip()
    (repo / 'z-workflow.py').write_text('def read():\n    return "new"\n')
    (repo / 'a-storage.py').write_text('\n'.join(f'new_{i} = {i+1}' for i in range(160))+'\n')
    (repo / 'remove.txt').unlink()
    (repo / 'old name.txt').rename(repo / 'new name.txt')
    (repo / 'mode.sh').chmod(0o755)
    (repo / 'image.bin').write_bytes(b'\x00new asset\xfe')
    (repo / 'type-change').unlink()
    (repo / 'type-change').write_text('Now a regular file\n')
    (repo / 'reading.test.py').write_text('assert read() == "new"\n' + '# long line ' + '0123456789'*35 + '\n# no newline marker')
    git('add', '.')
    git('commit', '-qm', 'Fixture change')
    head = git('rev-parse', 'HEAD').decode().strip()
    order = ['z-workflow.py', 'a-storage.py', 'new name.txt', 'remove.txt', 'image.bin', 'mode.sh', 'type-change', 'reading.test.py']
    plan = {'title': 'Complete review fixture: Reading workflow', 'base': base, 'head': head,
            'files': [{'path': p} for p in order]}
    output = root / 'review.md'
    guide = root / 'guide.md'
    guide.write_text('## Review guide\n\nStart at z-workflow.py for the reading behavior, then inspect a-storage.py for persistence. Finish with the contract test.\n')
    packet.build(repo, plan, guide, output)
    markdown = output.read_text()
    patches = [html.unescape(p) for p in re.findall(r'<pre class="full-diff"><code>(.*?)</code></pre>', markdown, re.S)]
    manifest = json.loads(output.with_suffix('.manifest.json').read_text())
    assert [f['path'] for f in manifest['files']] == order
    # Independent expected per-file diffs check ordering and exact bytes,
    # including rename metadata, mode-only changes, binary and no-newline markers.
    for name, rendered in zip(order, patches):
        paths = ['old name.txt', name] if name == 'new name.txt' else [name]
        expected = git('diff', '--full-index', '--find-renames', base, head, '--', *paths).decode()
        assert rendered == expected, name
    assert output.with_suffix('.diff').read_text() == ''.join(patches)
    assert '-old_159 = 159' in patches[1] and '+new_159 = 160' in patches[1]
    for files in (plan['files'][:-1], plan['files'] + [plan['files'][0]], plan['files'] + [{'path': 'unexpected'}]):
        try:
            packet.build(repo, {**plan, 'files': files}, None, root/'invalid.md')
        except ValueError:
            pass
        else:
            raise AssertionError('Incomplete/duplicate/extra inventory accepted')
    (root/'plan.json').write_text(json.dumps(plan, indent=2))
    print('PASS: eight files, exact complete diffs, semantic order, rename, delete, binary, mode-only, type change, long lines, no newline; bad inventories rejected')


if __name__ == '__main__':
    import sys
    if len(sys.argv) == 2:
        run(Path(sys.argv[1]))
    else:
        with tempfile.TemporaryDirectory(prefix='review-packet-test-') as directory:
            run(Path(directory))
