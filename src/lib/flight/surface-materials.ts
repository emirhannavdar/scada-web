import * as T from 'three';
type Painter=(w:number,h:number,paint:(c:CanvasRenderingContext2D)=>void)=>T.Texture|null;
/** Deterministic procedural surface maps: no photography or external downloads. */
export function applySurface(material:T.MeshStandardMaterial,kind:'soil'|'concrete'|'zinc'|'dust',canvasMap:Painter,repeat=1){
 let seed=kind==='soil'?971:kind==='concrete'?521:kind==='zinc'?187:811;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const map=canvasMap(512,512,c=>{
  c.fillStyle={soil:'#a18f73',concrete:'#c6c3b7',zinc:'#b4bab9',dust:'#ac9a7c'}[kind];c.fillRect(0,0,512,512);
  // Overlapping translucent grains provide several scales rather than one repeated noise layer.
  for(let i=0;i<26000;i++){const x=random()*512,y=random()*512,r=i<22000?.3+random()*1.4:1+random()*5;c.fillStyle=random()>.5?'#ffffff13':'#342e2420';c.beginPath();c.ellipse(x,y,r,r*(.45+random()*.55),random()*6.28,0,6.28);c.fill();}
  if(kind==='soil'||kind==='dust')for(let i=0;i<900;i++){const x=random()*512,y=random()*512,r=.6+random()*3;c.fillStyle=['#726d5e','#c3b59b','#968a73','#b5a990'][i%4]!;c.beginPath();c.moveTo(x-r,y);c.lineTo(x-r*.2,y-r*.6);c.lineTo(x+r,y-r*.2);c.lineTo(x+r*.5,y+r*.7);c.closePath();c.fill();c.fillStyle='#25271e18';c.fillRect(x-r,y+r*.6,r*1.5,.7);}
  if(kind==='zinc')for(let i=0;i<450;i++){const x=random()*512,y=random()*512,r=1+random()*7;c.fillStyle=i%2?'#ffffff16':'#5c687512';c.beginPath();for(let k=0;k<5;k++){const a=k*Math.PI*.4;if(k===0)c.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r);else c.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r)}c.closePath();c.fill();}
 });
 if(map){map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(repeat,repeat);map.anisotropy=8;material.map=map;material.bumpMap=map;material.bumpScale=kind==='soil'?.045:kind==='zinc'?.003:.012;material.needsUpdate=true;}
 return map;
}
