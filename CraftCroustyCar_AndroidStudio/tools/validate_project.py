from pathlib import Path
import json,re,subprocess
root=Path(__file__).resolve().parent.parent
assets=root/'app/src/main/assets'
js=(assets/'catalogue-offline.js').read_text(encoding='utf8')
data=json.loads(js[len('window.OFFLINE_CATALOGUE = '):-2])
assert len(data)>1250,(len(data),'minimum')
assert len(set((x['brand'].casefold(),x['model'].casefold()) for x in data))==len(data),'duplicates'
assert len(set(x['brand'] for x in data))>=50
html=(assets/'index.html').read_text(encoding='utf8')
for fname in ['styles.css','catalogue-offline.js','three-d.js','app.js']:
 assert fname in html and (assets/fname).exists(),fname
for ident in ['catalogView','favoritesView','workshopView','aboutView','detailOverlay','carGrid','historyPanel','specsPanel','threeDPanel']:
 assert f'id="{ident}"' in html,ident
for f in ['app.js','three-d.js','catalogue-offline.js']:
 subprocess.run(['node','--check',str(assets/f)],check=True)
print(f'PASS: {len(data):,} références locales, {len(set(x["brand"] for x in data))} marques, JS valide, assets présents.')
