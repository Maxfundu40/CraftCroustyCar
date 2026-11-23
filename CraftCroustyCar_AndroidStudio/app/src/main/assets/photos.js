/* CraftCrousty Car 1.2: photos authentiques Wikimedia Commons chargees a la demande.
 * Les metadonnees d'attribution sont affichees pour chaque photo.
 * Le moteur 3D reste independant des photos.
 */
(()=>{'use strict';
  const $=s=>document.querySelector(s);
  const clean=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const stripHtml=s=>String(s??'').replace(/<[^>]+>/g,' ').replace(/&(?:nbsp|#160);/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;/gi,"'").replace(/\s+/g,' ').trim();
  const safeLink=s=>typeof s==='string'&&/^https:\/\//i.test(s)?s:'';
  const store=new Map();let active='',req=0,selected=0,photos=[];
  const brandAlias={'Mercedes-Benz':'Mercedes','BMW':'BMW','DS Automobiles':'DS'};
  function photoQuery(car){const make=brandAlias[car.brand]||car.brand;return `${make} ${car.model}`.replace(/[()]/g,' ').replace(/\s+/g,' ').trim()}
  function eligible(car,p){
    const info=p.imageinfo?.[0];if(!info||!info.thumburl||!safeLink(info.thumburl)||!safeLink(info.descriptionurl))return false;
    if(!/^image\/(jpeg|png|webp)$/i.test(info.mime||''))return false;
    // A category/brand logo or a file about a different car is not an acceptable photograph.
    const title=clean(p.title||'');const make=clean(brandAlias[car.brand]||car.brand);
    if(!title.includes(make))return false;
    const model=clean(car.model).replace(/[^a-z0-9\- ]/g,' ').trim();
    const words=model.split(/\s+/).filter(x=>x.length>=2 && !/^\d{4}$/.test(x));
    const distinctive=words.filter(x=>!['series','serie','sedan','coupe','wagon','edition','sport','touring','limited'].includes(x));
    if(distinctive.length && !distinctive.some(x=>title.includes(x)))return false;
    const license=String(info.extmetadata?.LicenseShortName?.value||'').trim();
    // Commons mainly contains reusable files; avoid displaying assets without a stated license.
    if(!license)return false;
    return true;
  }
  function toPhoto(p){const i=p.imageinfo[0];const m=i.extmetadata||{};return {
    src:i.thumburl,link:i.descriptionurl,
    name:p.title.replace(/^File:/i,'').replace(/^Fichier:/i,''),
    author:stripHtml(m.Attribution?.value||m.Artist?.value||'Auteur indiqué sur Commons').slice(0,155),
    license:stripHtml(m.LicenseShortName?.value||'Licence indiquée sur Commons').slice(0,90),
    licenseUrl:safeLink(m.LicenseUrl?.value||'')
  }}
  async function findPhotos(car){
    const params=new URLSearchParams({
      action:'query',generator:'search',gsrsearch:photoQuery(car),gsrnamespace:'6',gsrlimit:'16',
      prop:'imageinfo',iiprop:'url|extmetadata|mime',iiurlwidth:'1100',format:'json',origin:'*'
    });
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),11000);
    try{
      const response=await fetch('https://commons.wikimedia.org/w/api.php?'+params.toString(),{mode:'cors',signal:controller.signal});
      if(!response.ok)throw Error('Commons HTTP '+response.status);
      const data=await response.json();
      const pages=Object.values(data.query?.pages||{}).sort((a,b)=>(a.index??999)-(b.index??999));
      const seen=new Set();
      return pages.filter(p=>eligible(car,p)).map(toPhoto).filter(p=>{if(seen.has(p.src))return false;seen.add(p.src);return true}).slice(0,8);
    }finally{clearTimeout(timeout)}
  }
  function firstPhoto(fallback){
    const artwork=$('#detailArt');if(!artwork)return;
    if(fallback||!photos.length){artwork.classList.remove('photo-loaded');return}
    const photo=photos[0];const img=document.createElement('img');
    img.src=photo.src;img.loading='lazy';img.alt='Photo de la voiture : '+photo.name;
    img.onerror=()=>{artwork.classList.remove('photo-loaded');artwork.innerHTML=artwork.dataset.fallback||''};
    artwork.replaceChildren(img);artwork.classList.add('photo-loaded');
  }
  function credits(p){
    const page=safeLink(p.link);const license=safeLink(p.licenseUrl);
    return `<b>Photo :</b> ${escapeHtml(p.name)}<br><b>Crédit :</b> ${escapeHtml(p.author)}<br><b>Licence :</b> ${license?`<a data-external href="${escapeHtml(license)}">${escapeHtml(p.license)}</a>`:escapeHtml(p.license)} · <a data-external href="${escapeHtml(page)}">Voir le fichier et ses conditions sur Wikimedia Commons ↗</a>`;
  }
  function select(index){
    if(!photos[index])return;selected=index;const p=photos[index];
    $('#photoMain').innerHTML=`<img src="${escapeHtml(p.src)}" alt="${escapeHtml(p.name)}">`;
    $('#photoCredits').innerHTML=credits(p);
    document.querySelectorAll('.photo-thumb').forEach((el,i)=>{el.classList.toggle('active',i===index);el.setAttribute('aria-pressed',i===index?'true':'false')});
  }
  function showGallery(){
    $('#photosIntro').textContent=`${photos.length} photo${photos.length>1?'s':''} proposée${photos.length>1?'s':''} pour ce modèle, sous réserve de vérifier l'année ou la finition.`;
    $('#photoThumbnails').innerHTML=photos.map((p,i)=>`<button class="photo-thumb ${i===0?'active':''}" type="button" data-photo="${i}" aria-label="Photo ${i+1}" aria-pressed="${i===0?'true':'false'}"><img src="${escapeHtml(p.src)}" alt="${escapeHtml(p.name)}" loading="lazy"></button>`).join('');
    select(0);firstPhoto(false);
  }
  function showEmpty(message){
    $('#photosIntro').textContent=message;
    $('#photoMain').innerHTML='<div class="photo-wait">Aucune photo vérifiée disponible pour cette référence. Le dessin illustratif reste affiché sur la fiche.</div>';
    $('#photoThumbnails').innerHTML='';$('#photoCredits').innerHTML='';
  }
  function open(car,svg){
    req+=1;const rid=req;active=clean(car.brand+'|'+car.model);photos=[];selected=0;
    const art=$('#detailArt');art.dataset.fallback=svg;art.classList.remove('photo-loaded');art.innerHTML=svg;
    $('#photosIntro').textContent='Recherche de photos réelles sur Wikimedia Commons…';
    $('#photoMain').innerHTML='<div class="photo-wait">Recherche de photographies avec crédit et licence…</div>';
    $('#photoThumbnails').innerHTML='';$('#photoCredits').innerHTML='';
    if(store.has(active)){
      photos=store.get(active);
      photos.length?showGallery():showEmpty('Aucune photo libre vérifiée trouvée pour ce modèle.');return;
    }
    findPhotos(car).then(items=>{
      if(rid!==req)return;
      store.set(active,items);photos=items;
      items.length?showGallery():showEmpty('Aucune photo libre vérifiée trouvée pour ce modèle.');
    }).catch(()=>{
      if(rid!==req)return;
      showEmpty('Connexion indisponible ou source non accessible. Réessaie lorsque tu es connecté à Internet.');
    });
  }
  function close(){req++;active='';photos=[]}
  document.addEventListener('click',e=>{const el=e.target.closest('[data-photo]');if(el&&photos.length)select(Number(el.dataset.photo))});
  window.CraftPhotos={open,close,findPhotos};
})();
