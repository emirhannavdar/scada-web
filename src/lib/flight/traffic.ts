import * as T from 'three';
type Kit={root:T.Group;geo:<G extends T.BufferGeometry>(g:G)=>G;mat:(c:T.ColorRepresentation)=>T.Material;basic:(c:T.ColorRepresentation)=>T.MeshBasicMaterial;bodyGeo:T.BufferGeometry};
/** Scroll-time traffic. All 24 vehicles share two batches; nothing ticks while the visitor is idle. */
export const vehicleRoadX=[-52,-140,100,180,-220,260];
export const vehicleRoadZ=[-220,-140,-62,-16,100,180];
export function trafficState(progress:number,index:number){
 const lane=index%12,horizontal=lane>=6,direction=index<12?1:-1;
 const offset=lane===0?0:(lane*1.71)%12;
 const t=Math.max(0,Math.min(1,(progress-.78)/.165))*24+offset;
 const phase=t%12,green=phase>=6&&phase<11,cycle=Math.floor(t/12);
 const travel=phase<3?phase*6:phase<6?18:18+(phase-6)*8;
 const starts=[-44,-120,76,-114,104,-132,-130,-125,-35,64,102,132];
 const initialTravel=offset<3?offset*6:offset<6?18:18+(offset-6)*8;
 const along=starts[lane]!+direction*(cycle*66+travel-initialTravel)+(direction<0?110:0);
 const x=horizontal?along:vehicleRoadX[lane]!+direction*1.65;
 const z=horizontal?vehicleRoadZ[lane-6]!-direction*1.65:along;
 return {x,z,green,type:(index%3) as 0|1|2,rotation:horizontal?(direction>0?Math.PI/2:-Math.PI/2):(direction>0?0:Math.PI),lane};
}
export function buildTraffic({root,geo,mat,basic,bodyGeo}:Kit){
 const group=new T.Group();group.name='scroll-city-traffic';root.add(group);
 const hull=mat('#ffffff'),glow=basic('#ffffff'),pose=new T.Object3D();
 type Part={p:[number,number,number];s:[number,number,number];c:string};
 const bodies:Part[][]=[],lights:Part[][]=[];
 for(let i=0;i<24;i++){
  const type=i%3,length=type===2?7.2:type===1?5.3:4.5,color=['#8b9b9f','#aa6549','#d2d0ba','#486d80'][i%4]!;
  const parts:Part[]=[{p:[0,.65,0],s:[1.8,.65,length],c:color},{p:[0,1.2,type===2?2.3:.4],s:[1.6,.65,type===2?1.6:2.05],c:color},{p:[0,1.28,type===2?3.12:1.46],s:[1.4,.4,.025],c:'#1a303b'}];
  if(type===2)parts.push({p:[0,1.65,-.9],s:[2.1,2.1,4.2],c:'#a9b0ab'});
  if(type===1){parts.push({p:[0,.95,-1.65],s:[1.5,.1,1.7],c:'#263b42'});for(const side of [-1,1])parts.push({p:[side*.85,1.08,-1.65],s:[.15,.6,1.8],c:color});}
  for(const x of [-.92,.92])for(const z of [-length*.31,length*.31])parts.push({p:[x,.43,z],s:[.24,.62,.68],c:'#18242a'});
  bodies.push(parts);lights.push([-1,1].flatMap(side=>[{p:[side*.6,.7,length/2+.025],s:[.28,.16,.035],c:'#eadabd'},{p:[side*.6,.7,-length/2-.025],s:[.25,.14,.035],c:'#bd4837'}] as Part[]));
 }
 function batch(parts:Part[][],material:T.Material,extra=0){const count=parts.reduce((n,a)=>n+a.length,0)+extra,mesh=new T.InstancedMesh(bodyGeo,material,count);mesh.name='night-traffic';mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.frustumCulled=false;mesh.castShadow=false;mesh.receiveShadow=false;group.add(mesh);return mesh;}
 // Signal housings and lamp discs use the same two batches, independent of vehicles.
 const signals=new T.Group();signals.name='city-traffic-signals';root.add(signals);
 const posts:T.Matrix4[]=[],bulbs:T.Matrix4[]=[],bulbColors:T.Color[]=[];
 for(const x of [-52,-140,100,180])for(const z of [-16,62])for(const side of [-1,1]){
  for(const [p,s] of [[[x+side*4.2,1.7,z-5],[.1,3.4,.1]],[[x+side*4.2,3.15,z-5],[.4,1.05,.25]]] as const){pose.position.fromArray(p);pose.scale.fromArray(s);pose.updateMatrix();posts.push(pose.matrix.clone());}
  for(let k=0;k<3;k++){pose.position.set(x+side*4.2,3.48-k*.3,z-4.85);pose.scale.set(.17,.17,.035);pose.updateMatrix();bulbs.push(pose.matrix.clone());bulbColors.push(new T.Color('#1d2a2d'));}
 }
 const body=batch(bodies,hull,posts.length),light=batch(lights,glow),bodyCount=bodies.reduce((n,a)=>n+a.length,0);
 posts.forEach((m,i)=>{body.setMatrixAt(bodyCount+i,m);body.setColorAt(bodyCount+i,new T.Color('#253a43'));});
 const bulb=new T.InstancedMesh(geo(new T.CircleGeometry(1,8)),glow,bulbs.length);bulb.name='traffic-signal-lights';bulb.userData['dynamicInstances']=true;bulbs.forEach((m,i)=>bulb.setMatrixAt(i,m));signals.add(bulb);bulb.castShadow=false;
 let last=-1;
 return {update(p:number){if(p===last)return;last=p;
  for(const [mesh,parts] of [[body,bodies],[light,lights]] as const){let n=0;parts.forEach((list,i)=>{const state=trafficState(p,i);list.forEach(part=>{const cos=Math.cos(state.rotation),sin=Math.sin(state.rotation);pose.position.set(state.x+part.p[0]*cos+part.p[2]*sin,part.p[1],state.z+part.p[2]*cos-part.p[0]*sin);pose.scale.set(...part.s);pose.rotation.set(0,state.rotation,0);pose.updateMatrix();mesh.setMatrixAt(n,pose.matrix);mesh.setColorAt(n++,new T.Color(part.c));});});mesh.instanceMatrix.needsUpdate=true;mesh.instanceColor!.needsUpdate=true;}
  bulbColors.forEach((_,i)=>{const k=i%3,signal=Math.floor(i/12),lane=vehicleRoadX.indexOf([-52,-140,100,180][signal]!),green=trafficState(p,Math.max(0,lane)).green;bulb.setColorAt(i,new T.Color(k===0&&!green?'#ed5c40':k===2&&green?'#80cf93':'#23373c'));});bulb.instanceColor!.needsUpdate=true;
 },dispose(){for(const mesh of [body,light,bulb])mesh.dispose();}};
}
