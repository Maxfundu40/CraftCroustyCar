#!/usr/bin/env python3
"""Browser smoke tests for photos in CraftCrousty Car v1.2.
The Commons API is stubbed: live photo availability needs internet/device verification.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image
import io,json
root=Path(__file__).resolve().parents[1]
d=root/'app/src/main/assets'
html=(d/'index.html').read_text()
html=html.replace('<link rel="stylesheet" href="styles.css" />','<style>'+ (d/'styles.css').read_text()+'</style>')
for a in ['catalogue-offline.js','three-d.js','photos.js','app.js']:
 html=html.replace('<script src="'+a+'"></script>','<script>'+ (d/a).read_text()+'</script>')
img=io.BytesIO();Image.new('RGB',(320,180),'#88aacc').save(img,format='JPEG');image_bytes=img.getvalue()

def item(id,name,license='CC BY-SA 4.0',who='Photographe Demo'):
 return {"pageid":id,"index":id,"title":"File:"+name,"imageinfo":[{
  "mime":"image/jpeg","thumburl":f"https://upload.wikimedia.org/test_{id}.jpg",
  "descriptionurl":f"https://commons.wikimedia.org/wiki/File:Test_{id}.jpg",
  "extmetadata":{"Artist":{"value":who},"LicenseShortName":{"value":license},"LicenseUrl":{"value":"https://creativecommons.org/licenses/by-sa/4.0/"}}}]}

with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':430,'height':900},device_scale_factor=1,is_mobile=True,has_touch=True)
 errors=[];requests=[]
 page.on('pageerror',lambda err: errors.append(str(err)))
 def api(route):
  url=route.request.url
  requests.append(url)
  if 'Volkswagen+Golf' in url or 'Volkswagen%20Golf' in url:
   pages={str(j):item(j,n) for j,n in enumerate(['Volkswagen Golf VII street front.jpg','Volkswagen Golf 2019 blue side.jpg','Volkswagen Golf museum rear.jpg'],1)}
   pages['999']=item(999,'Ford Fiesta unrelated.jpg')
   pages['1000']=item(1000,'Volkswagen Golf no license.jpg',license='')
   route.fulfill(status=200,content_type='application/json',body=json.dumps({'query':{'pages':pages}}),headers={'Access-Control-Allow-Origin':'*'})
  else:route.fulfill(status=200,content_type='application/json',body=json.dumps({'query':{'pages':{}}}),headers={'Access-Control-Allow-Origin':'*'})
 page.route('https://commons.wikimedia.org/w/api.php**',api)
 page.route('https://upload.wikimedia.org/**',lambda route:route.fulfill(status=200,content_type='image/jpeg',body=image_bytes))
 page.route('https://raw.githubusercontent.com/**',lambda route:route.abort())
 page.route('https://fr.wikipedia.org/**',lambda route:route.abort())
 page.set_content(html,wait_until='domcontentloaded',timeout=30000)
 page.locator('#searchInput').fill('Volkswagen Golf')
 page.locator('#carGrid [data-open]').first.click()
 assert 'Volkswagen Golf' in page.locator('#detailTitle').inner_text()
 page.locator('.detail-tab[data-tab="photos"]').click()
 page.locator('#photoThumbnails .photo-thumb').first.wait_for(timeout=15000)
 assert page.locator('#photoThumbnails .photo-thumb').count()==3
 assert 'CC BY-SA' in page.locator('#photoCredits').inner_text()
 assert 'Photographe Demo' in page.locator('#photoCredits').inner_text()
 page.locator('#photoThumbnails .photo-thumb').nth(1).click()
 assert '2019' in page.locator('#photoCredits').inner_text()
 assert page.locator('#detailArt.photo-loaded').count()==1
 assert page.locator('#photoMain img').count()==1
 page.screenshot(path='/mnt/data/CraftCroustyCar-v1.2-Photos-Test.png',full_page=True)
 # 3D remains available
 page.locator('.detail-tab[data-tab="3d"]').click()
 page.locator('#threeDPanel canvas').first.wait_for()
 page.locator('#detailClose').click()
 page.locator('#searchInput').fill('Abarth 124 Spider')
 page.locator('#carGrid [data-open]').first.click()
 page.locator('.detail-tab[data-tab="photos"]').click()
 page.get_by_text('Aucune photo libre vérifiée trouvée').first.wait_for(timeout=15000)
 assert page.locator('#photoThumbnails .photo-thumb').count()==0
 assert not errors,errors
 print('PASS gallery 3 true-image license records, attribution, carousel, no-results fallback, 3D, no JS errors')
 print('PASS mocked Commons API requests:',len(requests))
 browser.close()
