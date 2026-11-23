/* CraftCrousty Car • Creative app by Crafti */
(()=>{'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const simplify=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr').trim();
const idOf=m=>simplify(m.brand)+'|'+simplify(m.model);
const localCars=window.OFFLINE_CATALOGUE||[];
let cars=[...localCars],view='catalog',origin='all',query='',brand='',shown=48,selected=null,tab='history',viewer=null,remoteCount=0,historyReq=0;
const FAV_KEY='craftcrousty:favorites:v1';let saved=new Set();try{saved=new Set(JSON.parse(localStorage.getItem(FAV_KEY)||'[]'))}catch(e){}
const placeGroups={
 france:['Peugeot','Renault','Citroën','DS Automobiles','Alpine','Bugatti'],
 germany:['Audi','BMW','Mercedes-Benz','Volkswagen','Porsche','Opel','Smart'],
 japan:['Toyota','Honda','Nissan','Mazda','Subaru','Mitsubishi','Suzuki','Lexus','Acura','Infiniti','Daihatsu'],
 usa:['Ford','Chevrolet','Dodge','Cadillac','Jeep','Chrysler','Buick','Tesla','Lincoln','GMC','Plymouth','Pontiac','Lucid'],
 italy:['Ferrari','Lamborghini','Fiat','Maserati','Alfa Romeo','Lancia','Abarth','Pagani']};
const palette=['#53ddd2','#659ef0','#e87d77','#dedfe8','#aa8ed7','#e8b878','#87b7a4','#4cabcc'];
function colorFor(m){let h=0;for(const c of m.brand)h=(h*31+c.charCodeAt(0))>>>0;return palette[h%palette.length]}
function carSvg(color){return `<svg viewBox="0 0 430 192" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g${color.slice(1)}" x1="0" x2="1"><stop stop-color="${color}"/><stop offset=".45" stop-color="${color}"/><stop offset="1" stop-color="#2b586e"/></linearGradient></defs><ellipse cx="211" cy="159" rx="177" ry="13" fill="#000" opacity=".23"/><path d="M43 122 L65 104 L119 95 L155 58 Q176 48 254 49 L322 94 L365 104 Q394 111 393 130 L385 148 L43 148 Z" fill="url(#g${color.slice(1)})" stroke="#b8f8fa" stroke-width="1.4"/><path d="M157 59 Q182 49 251 50 L309 94 L136 94 Z" fill="#14334c" stroke="#a0cdd6" stroke-width="1.5"/><path d="M252 51 L310 94 L265 94 Z" fill="#244961"/><path d="M46 126 Q214 115 392 130" fill="none" stroke="#efffff" stroke-opacity=".24" stroke-width="3"/><rect x="357" y="111" width="31" height="9" rx="3" fill="#d4fff5"/><rect x="46" y="119" width="25" height="7" rx="2" fill="#e7817d"/><path d="M145 102 H347" stroke="#d6f9ff" stroke-width="1" opacity=".4"/><path d="M258 96 V140" stroke="#9fe1ec" opacity=".32"/><circle cx="119" cy="148" r="35" fill="#08121f"/><circle cx="119" cy="148" r="23" fill="#a3c2d0"/><circle cx="119" cy="148" r="15" fill="#283d51"/><circle cx="119" cy="148" r="5" fill="#ccfcff"/><circle cx="323" cy="148" r="35" fill="#08121f"/><circle cx="323" cy="148" r="23" fill="#a3c2d0"/><circle cx="323" cy="148" r="15" fill="#283d51"/><circle cx="323" cy="148" r="5" fill="#ccfcff"/></svg>`;}
function normalizeDataset(input){
 try{if(typeof input==='string')input=JSON.parse(input)}catch(e){return []}
 let result=[];let makesMap={};
 const get=(o,...keys)=>{for(const k of keys)if(o&&o[k]!=null)return o[k];return undefined;};
 const push=(make,model,series='')=>{make=String(make??'').trim();model=String(model??'').trim();if(!make||!model||model.length>85||make.length>55||/^other\b/i.test(model)||/^\d+\s+(?:models?|série)/i.test(model))return;result.push({brand:make,model,series:String(series??''),source:'external'})};
 function traverse(list,knownBrand=''){
  if(!Array.isArray(list))return;
  for(const item of list){if(!item||typeof item!=='object')continue;
   const possibleModels=get(item,'models','Models','carModels','CarModels','vehicles','Vehicles');
   const brand=get(item,'brand','Brand','make','Make','make_name','Make_Name')|| (possibleModels&&get(item,'name','Name','title','Title'))||knownBrand;
   const model=get(item,'model','Model','model_name','Model_Name')||(knownBrand&&!possibleModels?get(item,'name','Name','title','Title'):undefined);
   if(possibleModels&&Array.isArray(possibleModels))traverse(possibleModels,String(brand||knownBrand));
   if(model&&brand)push(brand,model,get(item,'series','Series'));
  }
 }
 if(Array.isArray(input))traverse(input);
 else if(input&&typeof input==='object'){
  const makes=get(input,'makes','Makes','CarMakes','carMakes');const models=get(input,'models','Models','CarModels','carModels');
  if(Array.isArray(makes))for(const make of makes){const k=get(make,'id','Id','Make_ID','MakeId','make_id');const n=get(make,'name','Name','Make_Name','title');if(k!=null&&n)makesMap[String(k)]=String(n);}
  if(Array.isArray(models))for(const m of models){const maker=get(m,'brand','make','Make','Make_Name')||makesMap[String(get(m,'makeId','MakeId','make_id','Make_ID'))];const model=get(m,'model','Model','name','Name','Model_Name','title');if(maker&&model)push(maker,model,get(m,'series','Series'))}
  traverse(makes);traverse(models);
  if(!result.length)for(const [k,v] of Object.entries(input)){if(Array.isArray(v))traverse(v,k)}
 }
 const once=new Set();return result.filter(m=>{const k=idOf(m);if(once.has(k))return false;once.add(k);return true});
}
function mergeCatalog(remote){const map=new Map(cars.map(c=>[idOf(c),c]));for(const m of remote){const key=idOf(m);if(map.has(key)){map.get(key).source='Référentiel externe 2019';if(m.series)map.get(key).series=m.series;}else map.set(key,{...m,source:'Référentiel externe 2019'})}cars=[...map.values()].sort((a,b)=>a.brand.localeCompare(b.brand,'fr')||a.model.localeCompare(b.model,'fr',{numeric:true}));remoteCount=remote.length;updateStats();renderBrands();renderGrid();if(view==='favorites')renderFavorites();$('#connectionText').textContent=`${remoteCount.toLocaleString('fr-FR')} modèles référencés (2019)`;}
window.receiveCatalog=(payload,originLabel)=>{try{const parsed=normalizeDataset(payload);if(parsed.length>=1250){mergeCatalog(parsed)}else{$('#connectionText').textContent=`Catalogue intégré · référence indisponible`;console.warn('Référentiel distant non reconnu',parsed.length,originLabel)}}catch(err){console.error(err)}};
function loadExternalCatalog(){if(window.Native&&typeof window.Native.requestCatalog==='function'){window.Native.requestCatalog();return}$('#connectionText').textContent='Catalogue intégré · recherche en ligne';fetch('https://raw.githubusercontent.com/Savage3D/car-makes-models-data/master/car-makes.json').then(r=>{if(!r.ok)throw Error('HTTP '+r.status);return r.text()}).then(t=>window.receiveCatalog(t,'web')).catch(()=>{$('#connectionText').textContent='Catalogue intégré · mode hors ligne'})}
function updateStats(){ $('#countStat').textContent=cars.length.toLocaleString('fr-FR');$('#brandStat').textContent=new Set(cars.map(c=>c.brand)).size;$('#favStat').textContent=saved.size;$('#favCount').textContent=saved.size}
function renderBrands(){const prev=$('#brandFilter').value;const b=[...new Set(cars.map(c=>c.brand))].sort((a,b)=>a.localeCompare(b,'fr'));$('#brandFilter').innerHTML='<option value="">Toutes les marques</option>'+b.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');$('#brandFilter').value=b.includes(prev)?prev:''}
function filtered(){let arr=cars;if(brand)arr=arr.filter(c=>c.brand===brand);if(origin!=='all')arr=arr.filter(c=>placeGroups[origin]?.includes(c.brand));if(query){const q=simplify(query);arr=arr.filter(c=>simplify(c.brand+' '+c.model+' '+(c.series||'')).includes(q))}return arr}
function card(c){const id=idOf(c),fav=saved.has(id),co=colorFor(c);return `<article class="car-card"><div class="card-art" style="--glow:${co}30" data-open="${esc(id)}"><span class="brand-pill">${esc(c.brand.toUpperCase())}</span><button class="fav-btn${fav?' saved':''}" data-fav="${esc(id)}" aria-label="${fav?'Retirer des favoris':'Ajouter aux favoris'}">${fav?'♥':'♡'}</button>${carSvg(co)}</div><div class="card-content"><h3 title="${esc(c.model)}">${esc(c.model)}</h3><p>${esc(c.brand)} · automobile</p><div class="card-footer"><span>⬡ VUE 3D</span><button data-open="${esc(id)}">DÉCOUVRIR ↗</button></div></div></article>`}
function renderGrid(){const results=filtered();$('#resultCount').textContent=results.length.toLocaleString('fr-FR');$('#carGrid').innerHTML=results.length?results.slice(0,shown).map(card).join(''):'<div class="empty">Aucun modèle trouvé. Essaie une autre recherche.</div>';$('#loadMoreBtn').classList.toggle('hidden',shown>=results.length)}
function renderFavorites(){const fav=cars.filter(m=>saved.has(idOf(m)));$('#favoriteGrid').innerHTML=fav.length?fav.map(card).join(''):'<div class="empty">Aucun favori pour le moment. Appuie sur ♡ sur une voiture pour l’ajouter.</div>';$('#favCount').textContent=fav.length;}
function toggleFavorite(id){if(saved.has(id))saved.delete(id);else saved.add(id);try{localStorage.setItem(FAV_KEY,JSON.stringify([...saved]))}catch(e){}updateStats();renderGrid();if(view==='favorites')renderFavorites();if(selected&&idOf(selected)===id)updateDetailFav()}
function showView(next){view=next;$$('.view').forEach(e=>e.classList.add('hidden'));$('#'+next+'View').classList.remove('hidden');$$('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===next));$('#breadcrumb').innerHTML='<span>Explorer</span><i>/</i><strong>'+({catalog:'Catalogue automobile',favorites:'Mes favoris',workshop:'Atelier 3D',about:'À propos'}[next]||'Catalogue')+'</strong>';if(next==='favorites')renderFavorites();if(next==='workshop'){if(viewer){viewer.destroy();viewer=null}viewer=window.Craft3D.create($('#standaloneWorkshop'),'#40cfd4')}window.scrollTo({top:0,behavior:'instant'})}
function updateDetailFav(){$('#detailFav').textContent=saved.has(idOf(selected))?'♥':'♡';$('#detailFav').style.color=saved.has(idOf(selected))?'#7ffce5':''}
function openDetail(id){const c=cars.find(x=>idOf(x)===id);if(!c)return;selected=c;tab='history';historyReq++;$('#detailOverlay').classList.remove('hidden');document.body.style.overflow='hidden';$('#detailTitle').textContent=c.brand+' '+c.model;$('#detailSub').textContent='Encyclopédie automobile · explorer et comprendre';$('#specBrand').textContent=c.brand;$('#specModel').textContent=c.model;$('#specSeries').textContent=c.series||'Non précisée';$('#specSource').textContent=c.source==='external'?'Référentiel externe (2019)':c.source==='offline-seed'?'Catalogue intégré':'Référentiel externe (2019)';$('#detailArt').innerHTML=carSvg(colorFor(c));window.CraftPhotos?.open(c,carSvg(colorFor(c)));updateDetailFav();selectTab('history');renderHistory(c,historyReq);}
function closeDetail(){historyReq++;window.CraftPhotos?.close();$('#detailOverlay').classList.add('hidden');document.body.style.overflow='';selected=null;if(detailViewer){detailViewer.destroy();detailViewer=null}}
let detailViewer=null;
function selectTab(t){tab=t;$$('.detail-tab').forEach(b=>b.classList.toggle('selected',b.dataset.tab===t));for(const key of ['history','photos','specs','3d'])$('#'+(key==='3d'?'threeD':key)+'Panel').classList.toggle('hidden',key!==t);if(t==='3d'&&selected){if(detailViewer)detailViewer.destroy();detailViewer=window.Craft3D.create($('#threeDPanel'),colorFor(selected))}}
const facts={
 'Volkswagen|Golf':'Présentée en 1974, la Volkswagen Golf adopte une architecture à traction avant et joue un rôle central dans le renouvellement de la gamme Volkswagen après l’époque de la Coccinelle.',
 'Renault|5':'La Renault 5 est lancée en 1972. Avec son format compact et ses boucliers intégrés, elle devient l’une des citadines les plus emblématiques de l’automobile française.',
 'Peugeot|205':'La Peugeot 205 apparaît en 1983. Son succès commercial, ses versions GTI et son engagement en compétition contribuent fortement au rayonnement de la marque dans les années 1980.',
 'Peugeot|206':'La Peugeot 206 arrive en 1998 pour prendre la relève de la 205 sur le marché des petites voitures. Elle connaît un succès international et existe aussi en version découvrable CC.',
 'Citroën|2CV':'La Citroën 2CV est dévoilée au Salon de Paris en 1948. Conçue comme une voiture abordable, simple et adaptée à la campagne, elle reste produite jusqu’en 1990.',
 'Citroën|DS':'Lancée en 1955, la Citroën DS marque son époque par son design original et sa suspension hydropneumatique. Elle demeure une référence de l’innovation automobile française.',
 'Ford|Mustang':'La Ford Mustang est dévoilée en avril 1964. Son succès contribue à populariser les pony cars, des coupés sportifs au style distinctif proposés à un prix relativement accessible.',
 'Porsche|911':'La Porsche 911 est présentée en 1963 et commercialisée à partir de 1964. Son moteur arrière et sa silhouette reconnaissable traversent de nombreuses générations.',
 'Fiat|500':'La Nuova Fiat 500 est lancée en 1957. Cette petite voiture populaire devient un symbole de la motorisation de l’Italie et inspire une réinterprétation moderne en 2007.',
 'BMW|M3':'La BMW M3 naît en 1986 avec la génération E30, développée notamment pour l’homologation en compétition. Elle devient l’une des berlines et coupés sportifs les plus connus.',
 'Mercedes-Benz|300 SL':'La Mercedes-Benz 300 SL de série apparaît en 1954. Son coupé à portes papillon et sa technologie d’injection directe marquent l’histoire des voitures de sport.',
 'Toyota|Prius':'La Toyota Prius est commercialisée au Japon en 1997. Elle contribue à rendre la motorisation hybride essence-électricité largement connue du grand public.',
 'Toyota|Corolla':'La Toyota Corolla est introduite en 1966. Présente sur de nombreux marchés et déclinée en de nombreuses générations, elle devient l’un des noms les plus répandus de l’automobile.',
 'Mazda|MX-5':'La Mazda MX-5 est dévoilée en 1989. Ce petit roadster léger, connu sous le nom de Miata en Amérique du Nord, remet au goût du jour la formule du cabriolet sportif accessible.',
 'Honda|Civic':'La Honda Civic voit le jour en 1972. Ce modèle compact devient un pilier international de la marque, avec de nombreuses générations et des versions sportives Type R.',
 'Nissan|GT-R':'Commercialisée en 2007, la Nissan GT-R R35 prend la suite de la lignée sportive Skyline GT-R tout en devenant un modèle distinct, réputé pour sa transmission intégrale.',
 'Tesla|Model S':'La Tesla Model S est livrée à partir de 2012. Cette grande berline électrique contribue à faire évoluer la perception des performances et de l’autonomie des voitures électriques.',
 'Tesla|Model 3':'Les premières Tesla Model 3 sont livrées en 2017. Elle est conçue pour élargir l’accès à une berline électrique de la marque, à un prix inférieur à celui de la Model S.',
 'Audi|quattro':'L’Audi quattro est présentée en 1980. Elle popularise la transmission intégrale permanente dans les voitures de tourisme sportives et marque le championnat du monde des rallyes.',
 'Ferrari|F40':'Présentée en 1987 pour célébrer les quarante ans de Ferrari, la F40 est une supercar à moteur V8 biturbo qui devient une icône des années 1980.',
 'Lamborghini|Countach':'La Lamborghini Countach est produite à partir de 1974. Son design anguleux, ses portes en élytre et son moteur V12 lui donnent une place majeure dans l’imaginaire des supercars.',
 'Bugatti|Veyron':'La Bugatti Veyron entre en production en 2005. Son moteur W16 à quatre turbocompresseurs et ses performances spectaculaires la placent parmi les grandes hypercars de son époque.',
 'McLaren|F1':'La McLaren F1 est dévoilée en 1992. Sa position de conduite centrale et son moteur V12 atmosphérique contribuent à sa réputation de voiture de sport d’exception.',
 'Renault|Clio':'La Renault Clio est commercialisée en 1990 pour remplacer la Supercinq. Elle devient l’une des citadines majeures du marché européen à travers plusieurs générations.',
 'Jeep|Wrangler':'Lancée en 1986 comme remplaçante de la Jeep CJ, la Wrangler conserve une architecture orientée vers le tout-terrain et une silhouette inspirée des Jeep historiques.',
 'Alpine|A110':'L’Alpine A110 originale apparaît en 1962 et s’illustre en rallye, notamment dans les années 1970. Le nom revient en 2017 sur un coupé sportif moderne à moteur central.',
 'Volvo|P1800':'La Volvo P1800 est lancée en 1961. Ce coupé élégant, rendu célèbre par la télévision, reste associé à l’image de robustesse de la marque suédoise.',
 'Hyundai|Ioniq 5':'La Hyundai Ioniq 5 est dévoilée en 2021. Ce crossover électrique inaugure la famille de modèles Ioniq basée sur la plateforme E-GMP.',
 'Kia|EV6':'Présentée en 2021, la Kia EV6 est un modèle électrique construit sur la plateforme E-GMP du groupe Hyundai Motor, avec une architecture de charge à haute tension.'
};
function historyInfo(text,title,url){$('#historyHeading').textContent=title;$('#historyText').textContent=text;$('#historySource').innerHTML=url?`<a href="${esc(url)}" data-external>${url.includes('search=')?'Rechercher sur Wikipédia ↗':'Lire la source historique ↗'}</a>`:''}
function wikiSearchUrl(c){return 'https://fr.wikipedia.org/w/index.php?search='+encodeURIComponent(c.brand+' '+c.model+' automobile')}
async function renderHistory(c,rid){const fact=facts[c.brand+'|'+c.model];if(fact){historyInfo(fact,'L’histoire de '+c.model,wikiSearchUrl(c));return;}historyInfo('Recherche d’une source historique pour ce modèle…','Une histoire à découvrir','');
 const qs=new URLSearchParams({action:'query',generator:'search',gsrsearch:c.brand+' '+c.model+' automobile',gsrlimit:'4',prop:'extracts',exintro:'1',explaintext:'1',exchars:'1400',format:'json',origin:'*'});
 try{const ctl=new AbortController();const timeout=setTimeout(()=>ctl.abort(),9000);let r;try{r=await fetch('https://fr.wikipedia.org/w/api.php?'+qs,{signal:ctl.signal,mode:'cors'});}finally{clearTimeout(timeout)}if(!r.ok)throw Error('Wikipedia '+r.status);const data=await r.json();if(rid!==historyReq)return;const pages=Object.values(data.query?.pages||{});const name=simplify(c.brand+' '+c.model).replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();const firstToken=simplify(c.brand).split(' ')[0];const titleToken=simplify(c.model).split(' ')[0];const match=pages.find(p=>{let txt=simplify(p.title+' '+(p.extract||'').slice(0,270));return (txt.includes(name)||txt.includes(firstToken)&&txt.includes(titleToken))&&p.extract&&p.extract.length>100});if(match){const url='https://fr.wikipedia.org/?curid='+match.pageid;historyInfo(match.extract,'L’histoire de '+c.model,url)}else{historyInfo('Aucun résumé historique suffisamment précis n’a été trouvé automatiquement. Ouvre la recherche Wikipédia pour consulter des sources et vérifier les informations.','Historique à documenter',wikiSearchUrl(c))}}
 catch(e){if(rid===historyReq)historyInfo('L’historique complet n’est pas disponible hors connexion pour ce modèle. Une recherche Wikipédia pourra être consultée dès que le réseau est disponible.','Historique à documenter',wikiSearchUrl(c))}}
function openExternal(url){if(!/^https:\/\//.test(url))return;if(window.Native?.openExternalPage){window.Native.openExternalPage(url);return}window.open(url,'_blank','noopener,noreferrer')}
$$('[data-view]').forEach(b=>b.addEventListener('click',()=>{closeDetailIfOpen();showView(b.dataset.view)}));
function closeDetailIfOpen(){if(!$('#detailOverlay').classList.contains('hidden'))closeDetail()}
$('#goHome').onclick=()=>showView('catalog');$('#hero3dBtn').onclick=()=>showView('workshop');
$('#reloadBtn').onclick=()=>{loadExternalCatalog()};
$('#searchInput').addEventListener('input',e=>{query=e.target.value;shown=48;renderGrid()});
$('#brandFilter').addEventListener('change',e=>{brand=e.target.value;shown=48;renderGrid()});
$$('#originFilters button').forEach(b=>b.addEventListener('click',()=>{origin=b.dataset.origin;shown=48;$$('#originFilters button').forEach(x=>x.classList.toggle('selected',x===b));renderGrid()}));
$('#loadMoreBtn').onclick=()=>{shown+=48;renderGrid()};
function cardsHandler(e){const fb=e.target.closest('[data-fav]');if(fb){e.stopPropagation();toggleFavorite(fb.dataset.fav);return}const op=e.target.closest('[data-open]');if(op)openDetail(op.dataset.open)}
$('#carGrid').onclick=cardsHandler;$('#favoriteGrid').onclick=cardsHandler;
$('#detailClose').onclick=closeDetail;$('#detailFav').onclick=()=>selected&&toggleFavorite(idOf(selected));$('#detailOverlay').addEventListener('click',e=>{if(e.target===$('#detailOverlay'))closeDetail()});
$$('.detail-tab').forEach(b=>b.addEventListener('click',()=>selectTab(b.dataset.tab)));
document.addEventListener('click',e=>{const anchor=e.target.closest('a[data-external]');if(anchor){e.preventDefault();openExternal(anchor.href)}});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDetailIfOpen()});
window.craftBack=()=>{if(!$('#detailOverlay').classList.contains('hidden')){closeDetail();return true}if(view!=='catalog'){showView('catalog');return true}return false};
updateStats();renderBrands();renderGrid();loadExternalCatalog();
})();
