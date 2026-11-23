/* Crafti original interactive 3D schematic renderer; dependency-free and offline.
   True perspective projection, orbit camera, shaded 3D faces, surface hit-testing. */
(function(){
'use strict';
const ZONES = [
 {id:'complete',name:'Voiture entière',icon:'◈',description:'Vue d’ensemble d’un véhicule schématique. Fais glisser pour tourner, puis touche une partie pour la sélectionner.'},
 {id:'carrosserie',name:'Carrosserie',icon:'▰',description:'Coque extérieure : protège les occupants, définit les volumes et contribue à l’aérodynamique.'},
 {id:'moteur',name:'Moteur',icon:'⚙',description:'Ensemble de conversion d’énergie en mouvement. Les moteurs thermiques et électriques ont des architectures différentes.'},
 {id:'roues',name:'Roues et pneus',icon:'◉',description:'Les pneus assurent l’adhérence au sol, tandis que les jantes et moyeux transmettent les efforts.'},
 {id:'freinage',name:'Freinage',icon:'◎',description:'Disques et étriers ralentissent le véhicule par frottement. Certains véhicules récupèrent aussi de l’énergie au freinage.'},
 {id:'habitacle',name:'Habitacle',icon:'▣',description:'Espace de conduite et de passagers : sièges, volant et tableau de bord.'},
 {id:'transmission',name:'Transmission',icon:'⤳',description:'Relie le moteur aux roues motrices : boîte de vitesses, arbre et différentiel selon l’architecture.'},
 {id:'suspension',name:'Suspension',icon:'⌁',description:'Ressorts, amortisseurs et liaisons au sol limitent les mouvements de caisse et favorisent le contact des pneus.'},
 {id:'eclate',name:'Vue éclatée',icon:'✦',description:'Pièces séparées visuellement pour découvrir leurs positions relatives. Cette représentation ne reflète pas un plan constructeur.'}
];

// Pédagogie : composants d'un moteur thermique 4 cylindres schématique.
// Certains véhicules du catalogue utilisent d'autres motorisations, notamment électriques.
const ENGINE_PARTS = [
 {id:'bloc', name:'Bloc-cylindres', icon:'▥', role:'Structure principale du moteur', fonctionnement:'Il contient les cylindres et soutient de nombreux organes mécaniques. Il est généralement réalisé en aluminium ou en fonte.', entretien:'Surveiller les fuites de liquide et une éventuelle surchauffe.'},
 {id:'pistons', name:'Pistons', icon:'◧', role:'Transformer la pression des gaz en mouvement', fonctionnement:'Dans un moteur thermique, chaque piston coulisse dans son cylindre sous l’effet de la combustion et transmet l’effort à sa bielle.', entretien:'Une consommation d’huile anormale ou une perte de compression peut révéler une usure des segments.'},
 {id:'bielles', name:'Bielles', icon:'╱', role:'Relier les pistons au vilebrequin', fonctionnement:'Elles transmettent les efforts et transforment, avec le vilebrequin, le va-et-vient des pistons en rotation.', entretien:'Un manque de lubrification peut endommager leurs paliers.'},
 {id:'vilebrequin', name:'Vilebrequin', icon:'⤾', role:'Produire la rotation du moteur', fonctionnement:'Ses manetons décalés reçoivent le mouvement des bielles. Sa rotation est ensuite transmise à la chaîne cinématique.', entretien:'Des vibrations ou cognements inhabituels nécessitent un diagnostic mécanique.'},
 {id:'culasse', name:'Culasse', icon:'▰', role:'Fermer le haut des cylindres', fonctionnement:'Elle porte généralement les chambres de combustion, les soupapes et une partie de la distribution.', entretien:'La surchauffe peut endommager le joint de culasse et provoquer des fuites.'},
 {id:'arbre-cames', name:'Arbre à cames', icon:'━', role:'Commander l’ouverture des soupapes', fonctionnement:'Des cames actionnent les soupapes au bon moment par rapport à la position des pistons.', entretien:'La lubrification et le respect des intervalles d’entretien de distribution sont essentiels.'},
 {id:'soupapes', name:'Soupapes', icon:'♧', role:'Contrôler les gaz dans les cylindres', fonctionnement:'Les soupapes d’admission font entrer l’air ou le mélange, celles d’échappement évacuent les gaz brûlés.', entretien:'Une soupape mal étanche peut entraîner une perte de compression.'},
 {id:'bougies', name:'Bougies d’allumage', icon:'✦', role:'Déclencher la combustion dans un moteur à essence', fonctionnement:'Une étincelle enflamme le mélange air-carburant. Les moteurs Diesel utilisent un allumage par compression plutôt qu’une bougie d’allumage.', entretien:'Des ratés d’allumage peuvent provenir de bougies usées ou d’un autre élément du système.'},
 {id:'injecteurs', name:'Injecteurs', icon:'◌', role:'Doser et pulvériser le carburant', fonctionnement:'Ils délivrent une quantité précise de carburant, dans le conduit d’admission ou directement dans le cylindre selon le moteur.', entretien:'Des injecteurs encrassés peuvent provoquer un fonctionnement irrégulier.'},
 {id:'admission', name:'Collecteur d’admission', icon:'⇥', role:'Distribuer l’air vers les cylindres', fonctionnement:'Il répartit le flux d’air entrant. Certains moteurs disposent d’un turbocompresseur en amont.', entretien:'Inspecter les prises d’air parasites et l’état des durites.'},
 {id:'echappement', name:'Collecteur d’échappement', icon:'⇤', role:'Évacuer les gaz brûlés', fonctionnement:'Il récupère les gaz à la sortie des cylindres et les dirige vers la ligne d’échappement ou un turbo.', entretien:'Une fuite peut générer un bruit anormal et des gaz chauds dans le compartiment moteur.'},
 {id:'alternateur', name:'Alternateur', icon:'◎', role:'Alimenter le réseau électrique', fonctionnement:'En tournant grâce au moteur, il produit de l’électricité et permet de recharger la batterie 12 V sur beaucoup de voitures thermiques.', entretien:'Un voyant de charge ou des difficultés de démarrage peuvent signaler un problème du circuit de charge.'},
 {id:'courroie', name:'Courroie d’accessoires', icon:'⌁', role:'Entraîner certains accessoires', fonctionnement:'Selon la voiture, elle transmet la rotation à l’alternateur, à la climatisation ou à d’autres équipements. Ce n’est pas la courroie de distribution.', entretien:'Contrôler son vieillissement, sa tension et les bruits de galets.'},
 {id:'filtre-huile', name:'Filtre à huile', icon:'◉', role:'Retenir les impuretés du lubrifiant', fonctionnement:'L’huile circule dans le filtre pour limiter la présence de particules abrasives dans le moteur.', entretien:'En général, le filtre est remplacé lors de la vidange selon le plan d’entretien du constructeur.'},
 {id:'carter', name:'Carter d’huile', icon:'▱', role:'Réservoir d’huile au bas du moteur', fonctionnement:'Il récupère l’huile après son passage dans les organes internes et constitue une réserve pour le circuit de lubrification.', entretien:'Surveiller le niveau d’huile et toute trace de fuite sous le moteur.'},
 {id:'radiateur', name:'Radiateur', icon:'▦', role:'Évacuer la chaleur du liquide de refroidissement', fonctionnement:'Le liquide chaud cède une partie de son énergie thermique à l’air qui traverse le radiateur.', entretien:'Contrôler le niveau de liquide à froid et vérifier les fuites ou l’obstruction des ailettes.'}
];
const PART_BY_ID = Object.fromEntries(ENGINE_PARTS.map(p=>[p.id,p]));

const COLORS = {carrosserie:'#19bac2',moteur:'#ffab5a',roues:'#242a3d',freinage:'#fc789c',habitacle:'#91b9de',transmission:'#b98ffa',suspension:'#9adc86'};
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function hexRgb(hex){hex=hex.replace('#','');return [parseInt(hex.slice(0,2),16),parseInt(hex.slice(2,4),16),parseInt(hex.slice(4,6),16)];}
function shade(hex,f){const c=hexRgb(hex);return 'rgb('+c.map(x=>clamp(Math.round(x*f),0,255)).join(',')+')';}
function norm(v){const a=Math.hypot(...v)||1;return v.map(x=>x/a);}
function dot(a,b){return a.reduce((s,v,i)=>s+v*b[i],0);}
function sub(a,b){return a.map((v,i)=>v-b[i]);}
function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
class Viewer {
 constructor(canvas,notice,onPiece,color){this.canvas=canvas;this.onPiece=onPiece;this.selectedPiece=null;this.engineExploded=true;this.ctx=canvas.getContext('2d');this.notice=notice;this.paint=color||'#17c4c7';this.zone='complete';this.az=-.77;this.el=.34;this.zoom=1;this.dragging=false;this.moved=false;this.last=[0,0];this.faces=[];this.hit=[];this.frame=0;this.boundResize=()=>this.draw();this.observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(this.boundResize):null;if(this.observer)this.observer.observe(canvas);else window.addEventListener('resize',this.boundResize);
 canvas.addEventListener('pointerdown',e=>{this.dragging=true;this.moved=false;this.last=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener('pointermove',e=>{if(!this.dragging)return;const dx=e.clientX-this.last[0],dy=e.clientY-this.last[1];if(Math.abs(dx)+Math.abs(dy)>2)this.moved=true;this.az+=dx*.009;this.el=clamp(this.el+dy*.007,-.07,1.12);this.last=[e.clientX,e.clientY];this.draw();});
 canvas.addEventListener('pointerup',e=>{this.dragging=false;if(this.moved)return;const r=canvas.getBoundingClientRect();const x=(e.clientX-r.left)*canvas.width/r.width,y=(e.clientY-r.top)*canvas.height/r.height;for(let i=this.hit.length-1;i>=0;i--){const h=this.hit[i];if(pointInPoly(x,y,h.vertices)){const z=h.part;if(PART_BY_ID[z]&&this.zone==='moteur'){this.onPiece(z);break;}if(z&&z!=='complete'){this.notice(z);break;}}}});
 canvas.addEventListener('wheel',e=>{e.preventDefault();this.zoom=clamp(this.zoom+(e.deltaY>0?.09:-.09),.64,1.7);this.draw();},{passive:false});this.draw();
 }
 destroy(){if(this.observer)this.observer.disconnect();else window.removeEventListener('resize',this.boundResize)}
 setZone(z){this.zone=z;this.selectedPiece=null;if(z==='moteur'){this.zoom=1.38;this.az=-.72;this.el=.48;}else this.zoom=1;this.draw()}
 setPiece(id){this.selectedPiece=PART_BY_ID[id]?id:null;this.draw()}
 setEngineExploded(value){this.engineExploded=!!value;this.draw()}
 reset(){this.az=this.zone==='moteur'?-.72:-.77;this.el=this.zone==='moteur'?.48:.34;this.zoom=this.zone==='moteur'?1.38:1;this.draw()}
 project(p){const d=sub(p,this.eye),z=dot(d,this.forward);if(z<=.5)return null;return [this.w/2+dot(d,this.right)*this.f/z,this.h*.54-dot(d,this.up)*this.f/z,z];}
 face(vertices,part,color,alpha=1){if(this.zone==='moteur'){if(this.selectedPiece&&part!==this.selectedPiece)alpha*=.72;}else if(this.zone!=='complete'&&this.zone!=='eclate'&&part!==this.zone)alpha*=.10;if(alpha<=.03)return;const pp=vertices.map(p=>this.project(p));if(pp.some(p=>!p))return;const d1=sub(vertices[1],vertices[0]),d2=sub(vertices[2],vertices[0]);const normal=norm(cross(d1,d2));const light=norm([-.38,1.4,1]);const brightness=.55+.4*Math.abs(dot(normal,light));this.faces.push({vertices:pp,part,color:shade(color,brightness),alpha,depth:pp.reduce((s,v)=>s+v[2],0)/pp.length});}
 box(x,y,z,w,h,l,part,col,alpha=1){const a=x-w/2,b=x+w/2,c=y-h/2,d=y+h/2,e=z-l/2,f=z+l/2;const P=[[a,c,e],[b,c,e],[b,d,e],[a,d,e],[a,c,f],[b,c,f],[b,d,f],[a,d,f]];const sides=[[0,1,2,3],[5,4,7,6],[4,0,3,7],[1,5,6,2],[3,2,6,7],[4,5,1,0]];for(const t of sides)this.face(t.map(i=>P[i]),part,col,alpha)}
 prism(x1,x2,baseY,topY,nearZ,farZ,topNearZ,topFarZ,part,col,alpha=1){const B=[[x1,baseY,nearZ],[x2,baseY,nearZ],[x2,baseY,farZ],[x1,baseY,farZ]];const T=[[x1*.84,topY,topNearZ],[x2*.84,topY,topNearZ],[x2*.84,topY,topFarZ],[x1*.84,topY,topFarZ]];this.face([...B].reverse(),part,col,alpha);this.face(T,part,col,alpha);for(let i=0;i<4;i++)this.face([B[i],B[(i+1)%4],T[(i+1)%4],T[i]],part,col,alpha);}
 circleX(x,y,z,r,part,col,alpha=1,segments=14){const center=[x,y,z];for(let i=0;i<segments;i++){const a=i*2*Math.PI/segments,b=(i+1)*2*Math.PI/segments;this.face([center,[x,y+r*Math.sin(a),z+r*Math.cos(a)],[x,y+r*Math.sin(b),z+r*Math.cos(b)]],part,col,alpha)}}
 wheel(x,z,explode=0){const sx=x>0?1:-1,wx=x+sx*explode;const tireCenterY=-.34;const near=wx+sx*.19,far=wx-sx*.19,r=.48;for(let i=0;i<16;i++){const a=2*Math.PI*i/16,b=2*Math.PI*(i+1)/16;this.face([[near,tireCenterY+r*Math.sin(a),z+r*Math.cos(a)],[far,tireCenterY+r*Math.sin(a),z+r*Math.cos(a)],[far,tireCenterY+r*Math.sin(b),z+r*Math.cos(b)],[near,tireCenterY+r*Math.sin(b),z+r*Math.cos(b)]],'roues','#1b2835')}
 this.circleX(near,tireCenterY,z,r,'roues','#141d29');this.circleX(near+sx*.018,tireCenterY,z,.31,'roues','#9db5c1');this.circleX(near+sx*.03,tireCenterY,z,.24,'roues','#354b60');this.circleX(near+sx*.042,tireCenterY,z,.07,'roues','#b9e6e8');
 for(let i=0;i<6;i++){const a=i*Math.PI/3;const p=[[near+sx*.046,tireCenterY,z],[near+sx*.05,tireCenterY+.24*Math.sin(a-.14),z+.24*Math.cos(a-.14)],[near+sx*.05,tireCenterY+.24*Math.sin(a+.14),z+.24*Math.cos(a+.14)]];this.face(p,'roues','#b9dbe7')}
 }
 build(){if(this.zone==='moteur'){this.buildEngine();return;}const exp=this.zone==='eclate',ex=exp?.52:0;
 // Frame / running gear
 this.box(0,-.25,0,1.65,.20,3.85,'transmission','#607a8b',exp?.92:.90);
 this.box(0,-.43,.3,.20,.20,2.5,'transmission','#b38ef1');this.box(0,-.40,1.4,.55,.26,.56,'transmission','#8e5dc5');this.box(0,-.41,-1.45,.73,.24,.42,'transmission','#9f74df');
 // Suspension elements + brakes, repeated at four wheels
 for(const x of [-1.14,1.14])for(const z of [-1.42,1.45]){
  const sx=x>0?1:-1;this.box(x*.72,-.11,z,.19,.79,.18,'suspension','#93d489');
  this.box(x*.77,-.36,z,.65,.12,.16,'suspension','#71be86');
  this.circleX(x+sx*(ex*.52),-.34,z,.34,'freinage','#ff91ab',.92);
  this.circleX(x+sx*(ex*.52+0.015),-.34,z,.23,'freinage','#d5dce9',.9);
 }
 // Engine: simplified engine block + valve cover + visible tubes
 this.box(0,.01,1.17+ex*.88,1.05,.62,.88,'moteur','#e6a154');this.box(0,.38,1.18+ex*.88,.80,.18,.72,'moteur','#ffcc83');
 for(let i=-1;i<=1;i++)this.box(i*.22,.48,1.19+ex*.88,.14,.08,.51,'moteur','#c2793d');
 this.box(.64,.02,1.25+ex*.88,.24,.28,.46,'moteur','#d88751');
 this.box(-.57,.13,1.30+ex*.88,.25,.4,.27,'moteur','#b7835a');
 // Cabin and seats, lifted slightly in exploded view
 const cy=exp?.4:0;
 for(const x of [-.40,.40])for(const z of [-.42,.39]){
  this.box(x,.54+cy,z,.52,.22,.50,'habitacle','#8db3d1');this.box(x,.89+cy,z-.18,.48,.56,.16,'habitacle','#769dbe');
 }
 this.box(0,.56+cy,.89,1.35,.16,.21,'habitacle','#557f9c');
 this.box(-.42,.74+cy,.74,.35,.10,.19,'habitacle','#b5e4ee');
 // Body kept fairly transparent during isolation; raised in exploded mode
 const by=exp?.92:0;const alpha=exp?.33:1;
 this.box(0,.05+by,0,2.03,.78,4.83,'carrosserie',this.paint,alpha);
 this.prism(-.94,.94,.48+by,1.23+by,-1.34,.95,-.78,.36,'carrosserie',this.paint,alpha);
 this.face([[-.81,1.18+by,.31],[.81,1.18+by,.31],[.91,.51+by,.91],[-.91,.51+by,.91]],'carrosserie','#5594ac',alpha*.86);
 this.face([[-.81,1.18+by,-.75],[.81,1.18+by,-.75],[.91,.51+by,-1.33],[-.91,.51+by,-1.33]],'carrosserie','#436e8b',alpha*.80);
 for(const s of [-1,1]){
  this.face([[s*.945,.52+by,-1.23],[s*.79,1.17+by,-.72],[s*.79,1.17+by,.27],[s*.945,.52+by,.86]],'carrosserie','#356a86',alpha*.88);
  this.box(s*.71,.18+by,2.44,.51,.18,.11,'carrosserie','#bbf9f0',alpha);
  this.box(s*.73,.19+by,-2.46,.49,.18,.12,'carrosserie','#f77980',alpha);
  this.box(s*.97,.22+by,-.2,.08,.08,.32,'carrosserie','#a2e1e0',alpha);
 }
 this.box(0,-.38+by,2.45,1.56,.17,.11,'carrosserie','#283f51',alpha);this.box(0,-.38+by,-2.45,1.55,.15,.12,'carrosserie','#283f51',alpha);
 // Draw wheels outside the shell at the very end, just like a real car silhouette
 for(const x of [-1.14,1.14])for(const z of [-1.42,1.45])this.wheel(x,z,ex*.92);
 }

 // Coupe didactique, volontairement simplifiée, de type moteur thermique 4 cylindres.
 // En mode éclaté, les éléments supérieurs/latéraux sont écartés pour faciliter la sélection.
 buildEngine(){
  const ex=this.engineExploded?1:0;
  const zs=[-1.08,-.36,.36,1.08];
  // Bloc ouvert au centre pour montrer bielles et pistons.
  this.box(-.66,.04,0,.32,.92,3.12,'bloc','#637e9c');
  this.box(.66,.04,0,.32,.92,3.12,'bloc','#698bab');
  this.box(0,.02,-1.53,1.65,.91,.19,'bloc','#6d91ae');
  this.box(0,.02,1.53,1.65,.91,.19,'bloc','#7397b2');
  for(const z of zs){
   this.box(0,.26,z,.58,.36,.52,'pistons','#f6bc66');
   this.box(0,-.19,z,.15,.58,.17,'bielles','#e3ddd2');
   this.box(.04,-.58,z,.52,.16,.17,'vilebrequin','#b49bf3');
  }
  this.box(0,-.65,0,.22,.16,3.10,'vilebrequin','#9c84e1');
  this.box(0,-.86,0,1.52,.29,3.05,'carter','#4e93a0');
  // Culasse et distribution soulevées.
  const lift=.37*ex, shift=.38*ex;
  this.box(shift,.92+lift,0,1.55,.31,3.07,'culasse','#d5adb0',.94);
  for(const z of zs){
   this.box(-.38+shift,.76+lift,z,.16,.43,.13,'soupapes','#6de0be');
   this.box(.38+shift,.76+lift,z,.16,.43,.13,'soupapes','#6de0be');
   this.box(.05+shift,1.26+lift,z,.13,.37,.13,'bougies','#e8f6fa');
   this.box(.67+shift,1.18+lift,z,.16,.30,.14,'injecteurs','#fd93a8');
  }
  this.box(-.35+shift,1.44+lift,0,.20,.17,3.03,'arbre-cames','#9e88ed');
  for(const z of zs)this.box(-.34+shift,1.49+lift,z,.44,.24,.15,'arbre-cames','#c1b0fa');
  // Collecteurs latéraux démontés, pour laisser voir le centre.
  const side=.32*ex;
  this.box(-1.20-side,.63,0,.44,.19,2.82,'admission','#5cbed5');
  for(const z of zs)this.box(-.96-side,.44,z,.45,.16,.17,'admission','#8de7f4');
  this.box(1.24+side,.38,0,.39,.21,2.86,'echappement','#e79567');
  for(const z of zs)this.box(.99+side,.25,z,.43,.15,.17,'echappement','#f8b06a');
  this.box(-1.03-side,-.49,.77,.29,.47,.39,'filtre-huile','#b3e4c5');
  this.box(-1.24-side,-.36,1.37,.46,.46,.46,'alternateur','#8babe8');
  this.circleX(-1.46-side,-.36,1.37,.20,'alternateur','#d9e8f6',1,16);
  // Courroie d'accessoires à l'avant ; guide rectangulaire symbolique.
  this.box(-.62,-.31,1.74,.13,1.23,.12,'courroie','#f3d889');
  this.box(-.89,.25,1.74,.58,.10,.12,'courroie','#f3d889');
  this.box(-1.17,-.25,1.74,.11,.92,.12,'courroie','#f3d889');
  this.box(-.90,-.78,1.74,.59,.10,.12,'courroie','#f3d889');
  // Radiateur devant le groupe, décalé vers l'avant pour rester inspectable.
  const rz=2.36+.23*ex;
  this.box(.07,-.12,rz,1.88,1.13,.14,'radiateur','#57bed0');
  for(let i=0;i<8;i++)this.box(-.77+i*.22,-.12,rz+.09,.06,1.0,.025,'radiateur','#b3e8e9');
 }
 draw(){const rect=this.canvas.getBoundingClientRect();if(rect.width<2||rect.height<2)return;const dpr=Math.min(window.devicePixelRatio||1,2);const W=Math.round(rect.width*dpr),H=Math.round(rect.height*dpr);if(this.canvas.width!==W||this.canvas.height!==H){this.canvas.width=W;this.canvas.height=H;}this.w=W;this.h=H;this.f=Math.min(W*1.70,H*2.85);const r=8.0*this.zoom;this.eye=[r*Math.cos(this.el)*Math.sin(this.az),r*Math.sin(this.el),r*Math.cos(this.el)*Math.cos(this.az)];this.forward=norm(this.eye.map(x=>-x));this.right=norm(cross(this.forward,[0,1,0]));this.up=norm(cross(this.right,this.forward));const ctx=this.ctx;ctx.clearRect(0,0,W,H);
 // Floor grid
 ctx.strokeStyle='#59b6bd18';ctx.lineWidth=dpr;for(let i=-4;i<=4;i++){const a=this.project([i*.75,-.91,-3.4]),b=this.project([i*.75,-.91,3.4]),c=this.project([-3,-.91,i*.77]),e=this.project([3,-.91,i*.77]);if(a&&b){ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();}if(c&&e){ctx.beginPath();ctx.moveTo(c[0],c[1]);ctx.lineTo(e[0],e[1]);ctx.stroke();}}
 const shadow=this.project([0,-.9,0]);if(shadow){ctx.save();ctx.fillStyle='#00000035';ctx.beginPath();ctx.ellipse(shadow[0],shadow[1],W*.28,H*.07,0,0,2*Math.PI);ctx.fill();ctx.restore();}
 this.faces=[];this.hit=[];this.build();this.faces.sort((a,b)=>b.depth-a.depth);for(const face of this.faces){ctx.globalAlpha=face.alpha;ctx.fillStyle=face.color;ctx.strokeStyle='rgba(10,24,40,.35)';ctx.lineWidth=dpr*.6;ctx.beginPath();face.vertices.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fill();if(this.zone==='moteur'&&this.selectedPiece===face.part){ctx.strokeStyle='#e5ffff';ctx.lineWidth=dpr*2.1;}ctx.stroke();if(face.alpha>.35)this.hit.push(face)}ctx.globalAlpha=1;
 }
}
function pointInPoly(x,y,vs){let c=false;for(let i=0,j=vs.length-1;i<vs.length;j=i++){const a=vs[i],b=vs[j];if(((a[1]>y)!==(b[1]>y))&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1]+1e-8)+a[0])c=!c;}return c;}
window.Craft3D={ZONES,ENGINE_PARTS,create(container,color){
 container.innerHTML=`<div class="workshop workshop-enhanced"><div class="workshop-main"><div class="scene-container"><canvas aria-label="Moteur 3D interactif : toucher les pièces ou choisir dans la liste"></canvas><span class="scene-tag">⬡ CRAFTI · 3D INTERACTIVE</span><div class="canvas-buttons"><button data-action="zoom-in" aria-label="Zoom avant">+</button><button data-action="zoom-out" aria-label="Zoom arrière">−</button><button data-action="reset" aria-label="Réinitialiser">↺</button></div><span class="scene-help">☝ Glisser pour tourner · Toucher une pièce · Zoomer</span></div><div class="part-info"><strong class="selected-part-title">Voiture entière</strong><p class="selected-part-text">Choisis « Moteur », puis touche une pièce pour afficher sa fiche.</p></div><section class="engine-detail hidden" aria-live="polite"><div class="engine-detail-top"><span class="engine-detail-label">FICHE DE LA PIÈCE</span><span class="engine-detail-count"></span></div><h3 class="engine-detail-title">Choisis une pièce</h3><div class="engine-detail-body"><div><small>À QUOI ÇA SERT ?</small><p class="engine-detail-role"></p></div><div><small>COMMENT ÇA MARCHE ?</small><p class="engine-detail-how"></p></div><div><small>ENTRETIEN / POINTS À SURVEILLER</small><p class="engine-detail-care"></p></div></div></section></div><aside class="zone-panel"><h4>Explorer les zones</h4><p>Sélectionne un élément pour l’isoler en 3D.</p><div class="zone-list"></div><div class="engine-panel hidden"><div class="engine-panel-head"><h4>Pièces du moteur</h4><span class="engine-part-count">${ENGINE_PARTS.length} pièces</span></div><p class="engine-pedagogy">Moteur thermique générique en coupe. L’architecture varie selon la voiture.</p><button class="engine-mode" data-action="exploded" aria-pressed="true">◫ Vue éclatée : activée</button><div class="engine-parts-list" aria-label="Choix d’une pièce moteur"></div></div></aside></div>`;
 const canvas=container.querySelector('canvas'),list=container.querySelector('.zone-list'),heading=container.querySelector('.selected-part-title'),description=container.querySelector('.selected-part-text');
 const panel=container.querySelector('.engine-panel'),detail=container.querySelector('.engine-detail'),partList=container.querySelector('.engine-parts-list'),modeBtn=container.querySelector('[data-action="exploded"]');
 let viewer;
 function choosePart(id){
  const part=PART_BY_ID[id];if(!part)return;
  viewer.setPiece(id);
  heading.textContent='Moteur · '+part.name;
  description.textContent='Composant sélectionné en 3D. Retrouve sa fonction et son entretien ci-dessous.';
  detail.classList.remove('hidden');
  container.querySelector('.engine-detail-title').textContent=part.name;
  container.querySelector('.engine-detail-role').textContent=part.role;
  container.querySelector('.engine-detail-how').textContent=part.fonctionnement;
  container.querySelector('.engine-detail-care').textContent=part.entretien;
  container.querySelector('.engine-detail-count').textContent=(ENGINE_PARTS.findIndex(p=>p.id===id)+1)+' / '+ENGINE_PARTS.length;
  partList.querySelectorAll('[data-part]').forEach(b=>{const selected=b.dataset.part===id;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});
 }
 function choose(id){
  const z=ZONES.find(x=>x.id===id)||ZONES[0];viewer.setZone(z.id);
  heading.textContent=z.name;description.textContent=z.id==='moteur'?'Moteur thermique 4 cylindres schématique : touche une pièce colorée ou choisis-la dans la liste.':z.description;
  panel.classList.toggle('hidden',id!=='moteur');detail.classList.add('hidden');
  list.querySelectorAll('.zone').forEach(btn=>btn.classList.toggle('active',btn.dataset.zone===id));
  partList.querySelectorAll('[data-part]').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false')});
 }
 list.innerHTML=ZONES.map(z=>'<button class="zone" data-zone="'+z.id+'"><b>'+z.icon+'</b>'+z.name+'</button>').join('');
 partList.innerHTML=ENGINE_PARTS.map((p,i)=>'<button class="engine-part" data-part="'+p.id+'" aria-pressed="false"><span class="engine-part-index">'+(i+1)+'</span><span>'+p.name+'</span><span class="engine-chevron">›</span></button>').join('');
 viewer=new Viewer(canvas,choose,choosePart,color);
 list.addEventListener('click',e=>{const b=e.target.closest('[data-zone]');if(b)choose(b.dataset.zone)});
 partList.addEventListener('click',e=>{const b=e.target.closest('[data-part]');if(b)choosePart(b.dataset.part)});
 modeBtn.addEventListener('click',()=>{viewer.setEngineExploded(!viewer.engineExploded);modeBtn.textContent=viewer.engineExploded?'◫ Vue éclatée : activée':'▣ Vue assemblée : activée';modeBtn.setAttribute('aria-pressed',String(viewer.engineExploded));});
 container.querySelector('[data-action="zoom-in"]').onclick=()=>{viewer.zoom=clamp(viewer.zoom-.1,.55,1.7);viewer.draw()};
 container.querySelector('[data-action="zoom-out"]').onclick=()=>{viewer.zoom=clamp(viewer.zoom+.1,.55,1.7);viewer.draw()};
 container.querySelector('[data-action="reset"]').onclick=()=>viewer.reset();
 choose('complete');return viewer;
 }};
})();
