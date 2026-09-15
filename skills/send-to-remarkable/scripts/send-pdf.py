#!/usr/bin/env python3
"""Deliver a PDF by USB when reachable, otherwise through paired ddvk/rmapi."""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import tempfile
import urllib.parse
import urllib.request

USB = 'http://10.11.99.1'


def usb_list(folder=''):
    # No proxies: this address belongs to the directly connected tablet.
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    with opener.open(USB + '/documents/' + urllib.parse.quote(folder, safe=''), timeout=5) as response:
        data = json.load(response)
    if not isinstance(data, list):
        raise ValueError('Unexpected USB document listing')
    return data


def cloud(rmapi, *args):
    return subprocess.check_output([rmapi, '-ni', *args], timeout=180, stderr=subprocess.PIPE)


def cloud_list(rmapi, folder):
    data = json.loads(cloud(rmapi, '-json', 'ls', folder))
    if not isinstance(data, list):
        raise ValueError('Unexpected cloud document listing')
    return data


def names(rows, transport):
    key = 'VissibleName' if transport == 'usb' else 'name'
    return {row.get(key, row.get('visibleName', '')) for row in rows}


def send(args):
    pdf = args.pdf.resolve()
    if pdf.suffix.lower() != '.pdf' or pdf.open('rb').read(5) != b'%PDF-':
        raise ValueError('Input must be a PDF')
    title = args.title or pdf.stem
    if not title or title in ('.', '..') or any(c in title for c in '/\\\r\n\x00;,\"') or title.startswith('-'):
        raise ValueError('Use a plain document title without path separators')
    receipt = pdf.with_name(pdf.name + '.delivery.json')
    digest = hashlib.sha256(pdf.read_bytes()).hexdigest()
    request = {'sha256': digest, 'title': title, 'folder': args.folder}
    if receipt.exists():
        prior = json.loads(receipt.read_text())
        if all(prior.get(key) == value for key, value in request.items()):
            raise ValueError(f'Existing delivery receipt ({prior["status"]}); inspect it and the fresh destination listing before resending: {receipt}')
    transport = args.transport
    rows = None
    if transport in ('auto', 'usb'):
        try:
            rows = usb_list()
            transport = 'usb'
        except (OSError, ValueError):
            if transport == 'usb':
                raise
            transport = 'cloud'
    rmapi = shutil.which('rmapi') or str(Path.home() / '.local/bin/rmapi')
    folder_id = ''
    if transport == 'usb':
        # USB upload uses the most recently listed directory (tablet UI contract).
        # Re-select it immediately before POST; do not browse USB concurrently.
        for part in args.folder.strip('/').split('/'):
            if not part:
                continue
            found = [r for r in rows if r.get('VissibleName') == part and r.get('Type') == 'CollectionType']
            if len(found) != 1:
                raise ValueError(f'USB folder missing or ambiguous: {part}')
            folder_id = found[0]['ID']
            rows = usb_list(folder_id)
    else:
        rows = cloud_list(rmapi, args.folder)
    if {title, title + '.pdf'} & names(rows, transport):
        raise ValueError(f'Destination already contains {title!r}; choose a new title to preserve annotations')
    record = {**request, 'transport': transport, 'status': 'attempting'}
    # Persist before mutation. A timeout must never trigger automatic fallback
    # or a second upload; leave an actionable receipt even after interruption.
    receipt.write_text(json.dumps(record, indent=2) + '\n')
    with tempfile.TemporaryDirectory(prefix='remarkable-upload-') as directory:
        upload = Path(directory) / (title + '.pdf')
        shutil.copyfile(pdf, upload)
        if transport == 'usb':
            usb_list(folder_id)
            result = subprocess.run(['curl', '--noproxy', '*', '--silent', '--show-error',
                                     '--max-time', '120', '--output', '/dev/null', '--write-out', '%{http_code}',
                                     '--form', f'file=@{upload};type=application/pdf', USB + '/upload'],
                                    capture_output=True, text=True)
            if result.returncode or result.stdout != '201':
                raise ValueError('USB upload was not confirmed; inspect fresh listing before retrying')
            rows = usb_list(folder_id)
        else:
            cloud(rmapi, 'put', str(upload), args.folder)
            rows = cloud_list(rmapi, args.folder)
    if not {title, title + '.pdf'} & names(rows, transport):
        raise ValueError('Upload returned but title is not listed yet; do not retry blindly')
    matched = next(row for row in rows if (row.get('VissibleName') if transport == 'usb' else row.get('name')) in {title, title + '.pdf'})
    record['document_id'] = matched.get('ID', matched.get('id'))
    record['listed_title'] = matched.get('VissibleName', matched.get('name'))
    record['status'] = 'listed'
    receipt.write_text(json.dumps(record, indent=2) + '\n')
    print(json.dumps(record, indent=2))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('pdf', type=Path)
    parser.add_argument('--title')
    parser.add_argument('--transport', choices=['auto', 'usb', 'cloud'], default='auto')
    parser.add_argument('--folder', default='/', help='Existing destination folder; defaults to root')
    args = parser.parse_args()
    try:
        send(args)
    except (OSError, ValueError, subprocess.SubprocessError) as error:
        # Do not dump rmapi stderr: auth diagnostics may contain sensitive values.
        message = 'rmapi command failed; check pairing/connectivity and fresh listings' if isinstance(error, subprocess.SubprocessError) else str(error)
        parser.exit(1, f'Delivery stopped: {message}. Local PDF retained.\n')


if __name__ == '__main__':
    main()
