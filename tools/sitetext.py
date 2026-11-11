#!/usr/bin/env python3
"""Move the site's paragraph text in and out of the "Site Text" editor artifact.

  python3 tools/sitetext.py extract            -> JSON of every editable block, one entry per page
  python3 tools/sitetext.py apply pages.json   -> writes edited blocks (html != orig) back into the HTML

A block is a <p>, <h2> or <h3> on a page (by position), or a data-text caption on the home page.
Each block carries `orig`, the text as it was when last synced, so apply can find it again
even if paragraphs were added or moved in the file since.
"""
import html
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TAG = re.compile(r'<(p|h2|h3)((?:\s[^>]*)?)>(.*?)</\1>', re.S)
DATA = re.compile(r'data-beat="([^"]+)"([^>]*?)data-text="([^"]*)"', re.S)
SKIP_CLASSES = {'skills-title', 'refs', 'm-only', 'resume-open'}
LABELS = {'when': 'Date line', 'tag': 'Tagline', 'intro': 'Intro', 'lead': 'Intro'}
HOME_LABELS = {'me': 'Intro: about me', 'cerlab': 'Caption: drones', 'sun': 'Caption: lab robots',
               'cad': 'Caption: CAD', 'apple': 'Caption: this summer', 'arts': 'Caption: music & design',
               'about': 'Caption: contact'}


def pages():
    return ['index.html', 'projects.html'] + sorted(str(p.relative_to(ROOT)) for p in ROOT.glob('projects/*.html'))


def title_of(src, file):
    if file == 'index.html':
        return 'Home'
    m = re.search(r'<title>(.*?)</title>', src, re.S)
    t = html.unescape(m.group(1)) if m else file
    return t.split('—')[-1].strip()


def classes(attrs):
    m = re.search(r'class="([^"]*)"', attrs)
    return set(m.group(1).split()) if m else set()


def extract():
    out = []
    for order, file in enumerate(pages()):
        src = (ROOT / file).read_text()
        blocks = []
        for m in DATA.finditer(src):
            beat, text = m.group(1), html.unescape(m.group(3))
            blocks.append({'id': 'data:' + beat, 'label': HOME_LABELS.get(beat, beat), 'orig': text, 'html': text})
        for i, m in enumerate(TAG.finditer(src)):
            tag, attrs, inner = m.groups()
            cls = classes(attrs)
            if cls & SKIP_CLASSES or not inner.strip():
                continue
            label = 'Section title' if tag == 'h2' else 'Heading' if tag == 'h3' else next((LABELS[c] for c in cls if c in LABELS), 'Paragraph')
            blocks.append({'id': f'{tag}:{i}', 'label': label, 'orig': inner, 'html': inner})
        if blocks:
            slug = Path(file).stem if file != 'index.html' else 'home'
            out.append({'slug': slug, 'file': file, 'title': title_of(src, file), 'order': order, 'blocks': blocks})
    return out


def apply(path):
    data = json.loads(Path(path).read_text())
    changed, problems = [], []
    for page in data:
        f = ROOT / page['file']
        src = f.read_text()
        for b in page['blocks']:
            if b['html'] == b['orig']:
                continue
            kind, key = b['id'].split(':', 1)
            if kind == 'data':
                ms = [m for m in DATA.finditer(src) if m.group(1) == key]
                hit = next((m for m in ms if html.unescape(m.group(3)) == b['orig']), None)
                if not hit:
                    problems.append(f"{page['file']} {b['id']}: caption changed in the file since last sync")
                    continue
                src = src[:hit.start(3)] + html.escape(b['html'], quote=True) + src[hit.end(3):]
            else:
                ms = list(TAG.finditer(src))
                idx = int(key)
                if idx < len(ms) and ms[idx].group(3) == b['orig']:
                    hit = ms[idx]
                else:
                    same = [m for m in ms if m.group(3) == b['orig']]
                    hit = same[0] if len(same) == 1 else None
                if not hit:
                    problems.append(f"{page['file']} {b['id']}: paragraph changed in the file since last sync")
                    continue
                src = src[:hit.start(3)] + b['html'] + src[hit.end(3):]
            changed.append(f"{page['file']} {b['id']} ({b['label']})")
        f.write_text(src)
    print(json.dumps({'changed': changed, 'problems': problems}, indent=2))


if __name__ == '__main__':
    if sys.argv[1:2] == ['extract']:
        print(json.dumps(extract(), indent=1, ensure_ascii=False))
    elif sys.argv[1:2] == ['apply'] and len(sys.argv) == 3:
        apply(sys.argv[2])
    else:
        sys.exit(__doc__)
