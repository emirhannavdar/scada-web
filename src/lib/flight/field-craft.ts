import * as T from 'three';
import {fieldHeight,planTables,tableLength,TILT,TABLE_D} from './field';
import {terrainHeight} from './terrain';
import type {Vec3} from './path';
type Kit={scene:T.Scene;geo:<G extends T.BufferGeometry>(g:G)=>G;mat:(c:T.ColorRepresentation,r?:number,m?:number)=>T.MeshStandardMaterial;bodyGeo:T.BufferGeometry};
/** Close-range construction details, all batched by material and geometry. */
export function buildFieldCraft({scene,geo,mat,bodyGeo}:Kit){
 const root=new T.Group();root.name='field-construction-detail';scene.add(root);
 const metal=mat('#9ba5a2',.88,.16),black=mat('#26302f',1),stone=mat('#a99e88',1),grass=mat('#817a51',1);
 const batches=new Map<T.Material,{geometry:T.BufferGeometry;matrices:T.Matrix4[]}>();const dummy=new T.Object3D();
 const add=(m:T.Material,p:Vec3,s:Vec3,rx=0,ry=0,g=bodyGeo)=>{dummy.position.set(...p);dummy.scale.set(...s);dummy.rotation.set(rx,ry,0);dummy.updateMatrix();let a=batches.get(m);if(!a){a={geometry:g,matrices:[]};batches.set(m,a)}a.matrices.push(dummy.matrix.clone())};
 // Attach every clamp and junction box to an actual table, never to a second obsolete grid.
 const attachments:{x:number;y:number;z:number;tableX:number;tableZ:number;kind:string}[]=[];
 for(const t of planTables()){
  const L=tableLength(t.n),sin=Math.sin(TILT),cos=Math.cos(TILT);
  for(const dx of [-L/2+.06,L/2-.06])for(const dz of [-TABLE_D/2+.08,TABLE_D/2-.08]){
   const x=t.x+dx,y=t.h+1.5-sin*dz+.045,z=t.z+cos*dz;
   add(metal,[x,y,z],[.07,.035,.07],TILT);add(black,[x,y+.023,z],[.018,.012,.018],TILT);
   attachments.push({x,y,z,tableX:t.x,tableZ:t.z,kind:'clamp'});
  }
  // Rear junction box sits flush against the underside, with no unsupported cable rods.
  const dz=-.25,x=t.x,y=t.h+1.5-Math.sin(TILT)*dz-.075,z=t.z+Math.cos(TILT)*dz;
  add(black,[x,y,z],[.22,.08,.14],TILT);attachments.push({x,y,z,tableX:t.x,tableZ:t.z,kind:'junction'});
 }
 root.userData['attachments']=attachments;
 // Gravel shoulders and sparse grass blades have volumetric geometry, not rectangular texture cards.
 const rockGeo=geo(new T.IcosahedronGeometry(1,1));let seed=12345;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 for(let i=0;i<1800;i++){const x=(i%2?4.5:13.5)+(random()-.5)*.7,z=-129+random()*132,r=.025+random()*.09;add(stone,[x,fieldHeight(x,z)+r*.2,z],[r,r*.5,r*.8],random(),random()*6,rockGeo);}
 const bladeGeo=geo(new T.ConeGeometry(1,1,3));for(let i=0;i<1800;i++){const x=-103+random()*206,z=-142+random()*158;if(Math.abs(x-9)<6||Math.abs(z+57)<4||(x>17&&x<32&&z>7))continue;const y=terrainHeight(x,z);for(let k=0;k<3;k++)add(grass,[x+k*.025,y+.06,z],[.018,.1+random()*.1,.014],(random()-.5)*.4,random()*6,bladeGeo);}
 const meshes:T.InstancedMesh[]=[];for(const [material,batch] of batches){const mesh=new T.InstancedMesh(batch.geometry,material,batch.matrices.length);mesh.name=material===metal?'near-panel-fixings':material===stone?'service-road-gravel':material===grass?'dry-grass-tufts':'panel-rear-connectors';batch.matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.castShadow=material===metal||material===black;mesh.receiveShadow=true;root.add(mesh);meshes.push(mesh)}return {dispose(){meshes.forEach(m=>m.dispose())}};
}
