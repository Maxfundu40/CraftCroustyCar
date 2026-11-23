/* Minimal no-browser smoke test for the app bootstrap and 3D geometry. */
const fs=require('fs'),vm=require('vm'),path=require('path');
const dir=path.resolve(__dirname,'../app/src/main/assets');
function el(){return {value:'',dataset:{},style:{},innerHTML:'',textContent:'',classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},querySelector(){return el()},getBoundingClientRect(){return {width:640,height:390,left:0,top:0}},setPointerCapture(){}}}
const elements={};const E=k=>elements[k]||(elements[k]=el());
const drawCalls=[];const ctx={clearRect(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},closePath(){},fill(){},ellipse(){},save(){},restore(){},set fillStyle(x){},set strokeStyle(x){},set lineWidth(x){},set globalAlpha(x){drawCalls.push(x)}};
const canvas=el();canvas.getContext=()=>ctx;canvas.getBoundingClientRect=()=>({width:640,height:390,left:0,top:0});canvas.width=640;canvas.height=390;
const window={devicePixelRatio:1,scrollTo(){},addEventListener(){},open(){},Native:{requestCatalog(){}}};
const document={body:{style:{}},querySelector:E,querySelectorAll(){return []},addEventListener(){}};
const context={window,document,console,fetch:()=>Promise.reject(new Error('offline')),localStorage:{getItem(){return null},setItem(){}},ResizeObserver:class{observe(){}disconnect(){}},setTimeout,clearTimeout,URLSearchParams,AbortController,URL,Math,Set,Map,Object,String,Number,JSON,Array,Promise};
vm.createContext(context);
for(const file of ['catalogue-offline.js','three-d.js','photos.js','app.js'])vm.runInContext(fs.readFileSync(path.join(dir,file),'utf8'),context,{filename:file,timeout:6000});
if(!E('#countStat').textContent.includes('2'))throw new Error('Catalogue failed bootstrap');
const mockContainer=el();mockContainer.querySelector=s=>s==='canvas'?canvas:el();
const viewer=window.Craft3D.create(mockContainer,'#54dccd');
if(viewer.faces.length<80)throw new Error('3D scene missing geometry: '+viewer.faces.length);
for(const z of window.Craft3D.ZONES)viewer.setZone(z.id);
viewer.reset();viewer.destroy();
console.log('PASS: JS startup, 3D scene '+viewer.faces.length+' faces, '+window.Craft3D.ZONES.length+' modes, '+drawCalls.length+' projected faces.');
