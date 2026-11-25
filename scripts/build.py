"""Build an allowlisted GitHub Pages site and an offline teaching package."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit
import shutil
import zipfile

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / '_site'
PUBLIC = (
    'index.html', 'workshop.css', 'workshop.js', 'workshop-model.js',
    'instructor.html', 'simulation.html', 'EXERCISE.md', 'START-HERE.txt',
)

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.links = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        for attr in ('src', 'href'):
            if attr in attrs:
                self.links.append(attrs[attr])

if SITE.exists():
    shutil.rmtree(SITE)
SITE.mkdir()
for name in PUBLIC:
    shutil.copy2(ROOT / name, SITE / name)

(SITE / 'data').mkdir()
archive = SITE / 'data' / 'biokemi2-starch-lab.zip'
with zipfile.ZipFile(archive, 'w', zipfile.ZIP_DEFLATED) as package:
    for name in PUBLIC:
        package.write(ROOT / name, arcname=name)
with zipfile.ZipFile(archive) as package:
    assert package.testzip() is None
    for name in PUBLIC:
        assert package.read(name) == (ROOT / name).read_bytes()

landing = SITE / 'index.html'
landing.write_text(landing.read_text().replace('<footer>', '<footer><a href="data/biokemi2-starch-lab.zip" download>Download offline exercise</a>'))
(SITE / '.nojekyll').write_text('')

for name in PUBLIC:
    if not name.endswith('.html'):
        continue
    parser = Links()
    parser.feed((SITE / name).read_text())
    assert len(parser.ids) == len(set(parser.ids)), f'Duplicate HTML IDs in {name}'
    for link in parser.links:
        parsed = urlsplit(link)
        if parsed.scheme or parsed.netloc:
            continue
        if parsed.path:
            target = (SITE / unquote(parsed.path)).resolve()
            assert target.is_relative_to(SITE.resolve()), f'Link escapes site: {name}: {link}'
            assert target.is_file(), f'Broken local link in {name}: {link}'
        elif parsed.fragment:
            assert unquote(parsed.fragment) in parser.ids, f'Broken anchor in {name}: {link}'

print(f'Built {len(PUBLIC)} teaching files, validated HTML links, and verified offline ZIP ({archive.stat().st_size:,} bytes).')
