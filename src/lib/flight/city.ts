import {buildTraffic} from './traffic';
import * as T from 'three';
import {cityPlan,cityRoadX,cityRoadZ} from './city-plan';
import type {Vec3} from './path';
type Kit={city:T.Group;geo:<G extends T.BufferGeometry>(g:G)=>G;mat:(c:T.ColorRepresentation,r?:number,m?:number)=>T.Material;basic:(c:T.ColorRepresentation)=>T.MeshBasicMaterial;bodyGeo:T.BufferGeometry;canvasMap:unknown};

/** A single compact district: texture-free material batches, no imported background buildings. */
export function buildNightCity({city,geo,mat,basic,bodyGeo}:Kit){
 const root=new T.Group();root.name='operator-district';city.add(root);
 const detail=new T.Group();detail.name='district-near-details';root.add(detail);
 const batches=new Map<string,{g:T.BufferGeometry;m:T.Material;detail:boolean;lod:'all'|'near'|'far';matrices:T.Matrix4[];colors:T.Color[]}>(),pose=new T.Object3D();
 const add=(m:T.Material,p:Vec3,s:Vec3,color:T.ColorRepresentation='#ffffff',g=bodyGeo,near=false,rotation=0,lod:'all'|'near'|'far'='all')=>{const key=m.uuid+g.uuid+near+lod;let b=batches.get(key);if(!b){b={g,m,detail:near,lod,matrices:[],colors:[]};batches.set(key,b);}pose.position.set(...p);pose.scale.set(...s);pose.rotation.set(0,rotation,0);pose.updateMatrix();b.matrices.push(pose.matrix.clone());b.colors.push(new T.Color(color));};
 const walls=mat('#c6c6b8',1),roof=mat('#394b55',1),road=mat('#34434a',1),stone=mat('#84908e',1),land=mat('#3f5b4e',1),trees=mat('#526c53',1),metal=mat('#34454b',1),window=basic('#ffffff'),mark=basic('#b6bcae');
 const fixedWindows=window;
 const windowPlane=geo(new T.PlaneGeometry(1,1));
 const crown=geo(new T.IcosahedronGeometry(1,0));
 const roofGeometry=geo(new T.BufferGeometry());roofGeometry.setAttribute('position',new T.Float32BufferAttribute([-.5,0,-.5,.5,0,-.5,0,.33,-.5,-.5,0,.5,0,.33,.5,.5,0,.5,-.5,0,-.5,0,.33,-.5,-.5,0,.5,0,.33,-.5,0,.33,.5,-.5,0,.5,.5,0,-.5,.5,0,.5,0,.33,-.5,0,.33,-.5,.5,0,.5,0,.33,.5],3));roofGeometry.computeVertexNormals();
 const tree=(x:number,z:number,scale=1)=>{add(metal,[x,1.2*scale,z],[.22,2.4*scale,.22]);add(trees,[x,3.1*scale,z],[1.7*scale,2.1*scale,1.7*scale],'#ffffff',crown);};
 const lamp=(x:number,z:number)=>{add(metal,[x,2.8,z],[.07,5.6,.07]);add(fixedWindows,[x,5.63,z],[.65,.08,.45],'#e4c99a');};
 // A connected avenue and two residential cross streets. Simple edges read clearly from above.
 add(land,[0,-.04,0],[560,.12,560]);
 for(const x of cityRoadX){add(stone,[x,.025,0],[9.4,.12,540]);add(road,[x,.096,0],[7,.025,540]);}
 for(const z of cityRoadZ){add(stone,[0,.025,z],[540,.12,9.4]);add(road,[0,.096,z],[540,.025,7]);}
 for(let x=-256;x<=256;x+=16)add(mark,[x,.115,-16],[4,.008,.09]);
 for(let z=-240;z<=240;z+=32){lamp(55,z);if(Math.abs(z)>15)tree(-58,z,.9);}
 for(const x of [-220,-140,-52,100,180,260])for(let z=-224;z<=224;z+=64)lamp(x+4.4,z);
 const plan=cityPlan();
 for(const [i,a] of plan.entries()){
  const {x,z,w,d,h}=a,tall=a.kind!=='villa';add(stone,[x,.08,z],[w+3,.16,d+4]);
  add(walls,[x,h/2+.16,z],[w,h,d],['#c9c6b5','#aebbbb','#d1c8bb','#b8c1b3'][i%4]!);
  if(tall){add(roof,[x,h+.3,z],[w+.5,.35,d+.5]);add(metal,[x-2,h+.8,z-1],[3,1,2]);
   if(a.kind==='tower'){add(walls,[x,h+1.6,z],[w*.68,2.5,d*.68],'#879ba6');add(metal,[x,h+3,z],[w*.7,.3,d*.7]);}
  }
  else add(roof,[x,h+.16,z],[w+1,5,d+1],['#354957','#5c5d57','#496069'][i%3]!,roofGeometry);
  // Every facade keeps its final silhouette and discrete apartment windows at all distances.
  const floors=Math.round(h/3),cols=3;
  for(let f=0;f<floors;f++)for(let col=0;col<cols;col++){
   const yy=1.65+f*3,xx=x+(col-1)*w*.29;
   if((i+f+col)%4!==0)for(const side of [-1,1])add(fixedWindows,[xx,yy,z+side*(d/2+.035)],[1.35,1.25,1],(i+f+col)%3?'#d9c39e':'#819eaa',windowPlane,false,side<0?Math.PI:0);
  }
  if(i<14||i%3===0)tree(x-w/2-2,z-d/2,.7+(i%3)*.1);

 }
 // A small landscaped square, with a low-cost path and seating.
 add(stone,[76,.08,34],[22,.16,32]);add(land,[76,.18,34],[18,.12,28]);add(stone,[76,.26,34],[2,.03,28]);
 for(const z of [23,45]){tree(69,z);tree(83,z);add(roof,[82,.55,z],[2.2,.15,.65],'#ffffff',bodyGeo,true);}
 // Existing operator building (20, 0, 2) is the only hero facade and keeps its real window aperture.
 for(let floor=0;floor<6;floor++)for(let col=0;col<4;col++)add(window,[14.4+col*3.7,2+floor*3,10.63],[1.9,1.45,1],(floor+col)%3?'#cfb78f':'#2b434e',windowPlane,false);
 for(let floor=0;floor<6;floor++)add(stone,[20,3.05+floor*3,10.65],[16.2,.12,.2],'#ffffff',bodyGeo,true);
 add(stone,[20,.18,15],[20,.2,7]);add(stone,[20,.16,25],[3,.15,14]);for(const x of [8,32]){tree(x,18);lamp(x,24);}
 const traffic=buildTraffic({root,geo,mat,basic,bodyGeo});
 const instances:T.InstancedMesh[]=[];
 for(const b of batches.values()){const mesh=new T.InstancedMesh(b.g,b.m,b.matrices.length);b.matrices.forEach((m,i)=>{mesh.setMatrixAt(i,m);mesh.setColorAt(i,b.colors[i]!);});mesh.name=b.m===window?'night-windows':b.detail?'district-near-batch':'district-shell-batch';if(b.detail||b.lod==='near')mesh.userData['lodMaxDistance']=135;if(b.lod==='far')mesh.userData['lodMinDistance']=55;mesh.castShadow=false;mesh.receiveShadow=false;(b.detail?detail:root).add(mesh);instances.push(mesh);}
 root.userData['buildings']=plan;root.userData['buildingCount']=plan.length;root.userData['batchCount']=instances.length;root.userData['masterplanVersion']=38;
 return {setDay(day:boolean){window.color.set(day?'#40586a':'#ffffff');},update(progress:number){detail.visible=progress>=.78;traffic.update(progress);},dispose(){instances.forEach(m=>m.dispose());traffic.dispose();}};
}
