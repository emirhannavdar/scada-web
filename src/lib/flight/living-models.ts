import {furnishRoomShell} from './residential-room';
import * as T from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {cityPlan} from './city-plan';
import {removeReplaced} from './model-url';
type Resources={geometries:Set<T.BufferGeometry>;materials:Set<T.Material>;maps:Set<T.Texture>};
const yAxis=new T.Vector3(0,1,0);
export function installGamingRoom(scene:T.Scene,source:T.Object3D,r:Resources){
 const room=scene.getObjectByName('remote-home')!,screen=scene.getObjectByName('monitor-screen') as T.Mesh;
 // Keep the camera aperture and live screen; remove the previous furniture generation altogether.
 const keep=new Set(['seated-operator','monitor-screen','pleated-window-curtains','entry-window-glass','home-floor-joints','home-floorboards','residential-furniture','residential-room-dressing']);
 const oldFurniture=room.children.filter(o=>!keep.has(o.name)&&o.name!=='imported-gaming-room');
 // Structural meshes are retained; only furniture inside the old room's central work/living zone is removed.
 for(const o of oldFurniture){if(o instanceof T.Group||o instanceof T.Mesh&&o.position.y<3.4&&o.position.x>12.2&&o.position.x<27.8&&o.position.z>-6&&o.position.z<10.2&&o.scale.x<5&&o.scale.z<4){o.removeFromParent();if(o instanceof T.InstancedMesh)o.dispose();}}
 furnishRoomShell(room as T.Group,r);
 if(source.userData['prebakedV34']==='gaming_room'){source.name='imported-gaming-room';source.traverse(o=>{o.layers.set(2);if(o instanceof T.Mesh){o.castShadow=false;o.receiveShadow=true;}});source.userData['removedExtraDisplays']=true;source.userData['materialBatches']=source.children.length;room.add(source);screen.position.set(20,1.016,3.121);screen.rotation.set(0,0,0);screen.userData['interactive']=true;return [source];}
 source.updateMatrixWorld(true);const root=new T.Group();root.name='imported-gaming-room';root.traverse(o=>o.layers.set(2));room.add(root);
 const global=new T.Matrix4().compose(new T.Vector3(19.438,-.513*.112,4.138),new T.Quaternion().setFromAxisAngle(yAxis,Math.PI),new T.Vector3(.112,.112,.112));
 const planes=new Map<string,T.Mesh>();source.traverse(o=>{if(o instanceof T.Mesh&&['Object_287','Object_290','Object_22'].includes(o.name))planes.set(o.name,o);});
 const batches=new Map<T.Material,T.BufferGeometry[]>();
 const add=(geometry:T.BufferGeometry,material:T.Material)=>{const list=batches.get(material)??[];list.push(geometry);batches.set(material,list);};
 const normalOf=(mesh:T.Mesh)=>{const g=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld),a=g.getAttribute('position'),idx=g.getIndex(),p=(i:number)=>new T.Vector3().fromBufferAttribute(a,idx?idx.getX(i):i),v0=p(0),v1=p(1),v2=p(2),n=v1.sub(v0).cross(v2.sub(v0)).normalize();g.dispose();if(n.z>0)n.negate();return n;};
 const screenCenters:Record<string,T.Vector3>={Monitor_1_126:new T.Vector3(20,1.016,3.115),Monitor_2_127:new T.Vector3(20.72,1.016,3.115)};
 let keyboardAngle=0;const keyboard=source.getObjectByName('Object_268') as T.Mesh|undefined;if(keyboard){const g=keyboard.geometry.clone().applyMatrix4(keyboard.matrixWorld),a=g.getAttribute('position');let mx=0,mz=0;for(let i=0;i<a.count;i++){mx+=a.getX(i)/a.count;mz+=a.getZ(i)/a.count;}let xx=0,zz=0,xz=0;for(let i=0;i<a.count;i++){const x=a.getX(i)-mx,z=a.getZ(i)-mz;xx+=x*x;zz+=z*z;xz+=x*z;}keyboardAngle=.5*Math.atan2(2*xz,xx-zz);g.dispose();}
 const monitorMatrices=new Map<string,T.Matrix4>();for(const [parent,id] of [['Monitor_1_126','Object_287'],['Monitor_2_127','Object_290']]){const plane=planes.get(id!);if(!plane)continue;const center=new T.Box3().setFromObject(plane).getCenter(new T.Vector3()),n=normalOf(plane),yaw=Math.atan2(n.x,-n.z);const matrix=new T.Matrix4().makeTranslation(...screenCenters[parent!]!.toArray()).multiply(new T.Matrix4().makeRotationY(Math.PI)).multiply(new T.Matrix4().makeScale(.112,.112,.112)).multiply(new T.Matrix4().makeRotationY(yaw)).multiply(new T.Matrix4().makeTranslation(-center.x,-center.y,-center.z));monitorMatrices.set(parent!,matrix);}
 const black=new T.MeshBasicMaterial({color:'#0b1114',toneMapped:false,side:T.DoubleSide});r.materials.add(black);
 source.traverse(o=>{if(!(o instanceof T.Mesh))return;if(/^(Monitor_2_127|Tv_9|Busa_Kasur_0|Kasur_1)$/.test(o.parent?.name??''))return;let g=o.geometry.clone().applyMatrix4(o.matrixWorld);const name=o.parent?.name??'';let material=Array.isArray(o.material)?o.material[0]!:o.material;
  if(monitorMatrices.has(name)){g.applyMatrix4(monitorMatrices.get(name)!);if(o.name==='Object_287'){material=black;}}
  else if(/kursi|tangan_kanan|tangan_kiri/i.test(name)){
   // Straighten the native chair's 16-degree yaw and align its seat with keyboard/primary display.
   g.translate(5.525,-.513,-2.287);g.applyMatrix4(new T.Matrix4().makeRotationY(.283+Math.PI));g.scale(.112,.112,.112);g.translate(20,0,4.18); // preserve original floor offset below seat
  }else if(/^Cube_117$|^Cube022_118$/.test(name)){
   g.translate(6.853,-6.121,-7.265);g.rotateY(keyboardAngle);g.scale(.112,.112,.112);g.rotateY(Math.PI);g.translate(20,.779,3.61);
  }else{g.applyMatrix4(global);if(name==='Meja_2'){const a=g.getAttribute('position');for(let i=0;i<a.count;i++)a.setY(i,a.getY(i)*1.226);g.computeVertexNormals();}if(/Mouse_Pad/.test(name)){const box=new T.Box3().setFromBufferAttribute(g.getAttribute('position') as T.BufferAttribute),c=box.getCenter(new T.Vector3());g.translate(20-c.x,.762-c.y,3.62-c.z);}}
  // The two imported screen planes use fresh full-image UVs, not the source texture atlas rectangle.
  if(o.name==='Object_290'||o.name==='Object_22'){const b=new T.Box3().setFromBufferAttribute(g.getAttribute('position') as T.BufferAttribute),p=g.getAttribute('position'),uv=new Float32Array(p.count*2);for(let i=0;i<p.count;i++){uv[i*2]=(p.getX(i)-b.min.x)/(b.max.x-b.min.x);uv[i*2+1]=(p.getY(i)-b.min.y)/(b.max.y-b.min.y);}g.setAttribute('uv',new T.BufferAttribute(uv,2));}
  for(const key of Object.keys(g.attributes))if(!['position','normal','uv'].includes(key))g.deleteAttribute(key);if(!g.getAttribute('normal'))g.computeVertexNormals();if(!g.getAttribute('uv'))g.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(g.getAttribute('position').count*2),2));
  add(g,material);
 });
 for(const [material,geometries] of batches){const merged=mergeGeometries(geometries.map(g=>{const u=g.index?g.toNonIndexed():g.clone();return u}),false);if(!merged)continue;r.geometries.add(merged);const mesh=new T.Mesh(merged,material);mesh.name='gaming-room-material-batch';mesh.layers.set(2);root.add(mesh);geometries.forEach(g=>g.dispose());}
 root.userData['materialBatches']=batches.size;screen.position.set(20,1.016,3.121);screen.rotation.set(0,0,0);screen.userData['interactive']=true;
 root.userData['removedExtraDisplays']=true; // Only the live primary monitor remains.
 return [root];
}
export function installSmallVillas(scene:T.Scene,source:T.Object3D,r:Resources){
 source.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(source),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3()),scale=17.8/Math.max(size.x,size.z),city=scene.getObjectByName('night-city')!,parcels=cityPlan().filter(p=>p.kind==='villa'&&p.seed%3===0);
 const groups=new Map<T.Material,T.BufferGeometry[]>();source.traverse(o=>{if(!(o instanceof T.Mesh))return;const g=o.geometry.clone().applyMatrix4(o.matrixWorld);g.translate(-center.x,-bounds.min.y,-center.z);g.scale(scale,scale,scale);const material=Array.isArray(o.material)?o.material[0]!:o.material;const array=groups.get(material)??[];array.push(g);groups.set(material,array);});
 const result:T.InstancedMesh[]=[];for(const [material,parts] of groups){const normalized=parts.map(g=>{const out=g.index?g.toNonIndexed():g.clone();for(const key of Object.keys(out.attributes))if(!['position','normal','uv'].includes(key))out.deleteAttribute(key);return out;});const g=mergeGeometries(normalized,false);parts.forEach(g=>g.dispose());normalized.forEach(g=>g.dispose());if(!g)continue;r.geometries.add(g);const mesh=new T.InstancedMesh(g,material,parcels.length);parcels.forEach((p,i)=>{const s=.93+(p.seed%4)*.04;mesh.setMatrixAt(i,new T.Matrix4().compose(new T.Vector3(p.x,0,p.z),new T.Quaternion().setFromAxisAngle(yAxis,p.seed%4*Math.PI/2),new T.Vector3(s,s,s)));mesh.setColorAt(i,new T.Color(['#ffffff','#e7e0d2','#dce5df','#ebd9ce'][p.seed%4]!));});mesh.name='imported-small-villas';mesh.layers.set(2);mesh.receiveShadow=true;city.add(mesh);result.push(mesh);}return result;
}
