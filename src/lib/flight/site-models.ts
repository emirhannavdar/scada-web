import {removeReplaced} from './model-url';
import * as T from 'three';
import {cityPlan} from './city-plan';
import {fieldHeight} from './field';
type Resources={geometries:Set<T.BufferGeometry>;materials:Set<T.Material>;maps:Set<T.Texture>};
function retire(scene:T.Scene,name:string){removeReplaced(scene,name);}
/** Bake source transforms once; keep the scan's UVs and original relief outside the civil works. */
export function installScannedSite(scene:T.Scene,source:T.Object3D,r:Resources){
 if(source.userData['prebakedV34']==='landscape'){source.name='imported-landscape';source.userData['mainSiteTerrain']=true;source.userData['gradedBounds']=[-90,90,-136,30];source.traverse(o=>{if(o instanceof T.Mesh){o.receiveShadow=true;o.castShadow=false;}});for(const name of ['scanned-rocky-terrain','rural-landscape','legacy-field-trunks','legacy-field-crowns'])retire(scene,name);scene.getObjectByName('solar-field')!.add(source);return [source];}
 source.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(source),center=bounds.getCenter(new T.Vector3()),scale=750/bounds.getSize(new T.Vector3()).x;
 const root=new T.Group();root.name='imported-landscape';root.userData['mainSiteTerrain']=true;root.userData['gradedBounds']=[-90,90,-136,30];
 const parts:{g:T.BufferGeometry;m:T.Material|T.Material[]}[]=[],heights:number[]=[];
 source.traverse(o=>{if(!(o instanceof T.Mesh))return;const g=o.geometry.clone().applyMatrix4(o.matrixWorld),a=g.getAttribute('position');for(let i=0;i<a.count;i++){const x=(a.getX(i)-center.x)*scale,z=(a.getZ(i)-center.z)*scale-61,y=a.getY(i)*scale;a.setXYZ(i,x,y,z);if(Math.abs(x)<90&&z>-136&&z<30)heights.push(y);}parts.push({g,m:o.material});});
 heights.sort((a,b)=>a-b);const datum=heights[Math.floor(heights.length/2)]??center.y*scale;
 for(const {g,m} of parts){const a=g.getAttribute('position');for(let i=0;i<a.count;i++){const x=a.getX(i),z=a.getZ(i),fieldDistance=Math.max(0,Math.abs(x)-90,-136-z,z-30),roadDistance=Math.max(0,Math.abs(x-9)-7,-140-z,z-147),highwayDistance=Math.max(0,Math.abs(z-142)-7,-310-x,x-310),distance=Math.min(fieldDistance,roadDistance,highwayDistance),t=T.MathUtils.smoothstep(distance,0,35),y=T.MathUtils.lerp(fieldDistance<=distance?fieldHeight(x,z)-.09:-.09,a.getY(i)-datum,t);a.setY(i,y);}a.needsUpdate=true;g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();r.geometries.add(g);
 const convert=(material:T.Material)=>{if(material instanceof T.MeshStandardMaterial){material.metalness=0;material.roughness=1;return material;}const mapped=material as T.MeshBasicMaterial,mat=new T.MeshStandardMaterial({map:mapped.map??null,color:mapped.color??'#ffffff',roughness:1,metalness:0,side:T.DoubleSide});r.materials.add(mat);return mat;};
 const mesh=new T.Mesh(g,Array.isArray(m)?m.map(convert):convert(m));mesh.name='scanned-site-surface';mesh.receiveShadow=true;root.add(mesh);}
 for(const name of ['scanned-rocky-terrain','rural-landscape','legacy-field-trunks','legacy-field-crowns'])retire(scene,name);
 scene.getObjectByName('solar-field')!.add(root);return [root];
}
/** Preserve the scan geometry; share it across road instances without decimation. */
function roadGeometry(input:T.BufferGeometry,r:Resources){const g=input.clone();g.computeBoundingSphere();r.geometries.add(g);return g;}
export function installGravelRoads(scene:T.Scene,source:T.Object3D,r:Resources,detail=false){
 source.updateMatrixWorld(true);const b=new T.Box3().setFromObject(source),s=b.getSize(new T.Vector3()),c=b.getCenter(new T.Vector3()),root=scene.getObjectByName('site-dirt-roads')!;if(!detail){for(const old of [...root.children])old.removeFromParent();retire(scene,'field-old-service-surfaces');}
 const routes=[{x:9,z:4,w:7.5,len:286,ry:0},{x:69,z:142,w:7.5,len:120,ry:Math.PI/2},{x:-37.35,z:-57,w:5.7,len:81.3,ry:Math.PI/2},{x:47.85,z:-57,w:5.7,len:66.3,ry:Math.PI/2},{x:-81,z:-61,w:3.5,len:130,ry:0},{x:81,z:-61,w:3.5,len:130,ry:0},{x:18.5,z:1,w:2.5,len:11.5,ry:Math.PI/2},{x:-3,z:-55.8,w:13,len:17,ry:0}];
 const placements:T.Matrix4[]=[];for(const route of routes){const n=Math.max(1,Math.ceil(route.len/(route.w*s.z/s.x))),length=route.len/n;for(let i=0;i<n;i++){const offset=-route.len/2+(i+.5)*length;placements.push(new T.Matrix4().compose(new T.Vector3(route.x+Math.sin(route.ry)*offset,0,route.z+Math.cos(route.ry)*offset),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),route.ry),new T.Vector3(route.w,1,length*1.006)));}}
 const meshes:T.InstancedMesh[]=[];if(!detail){const asphalt=new T.MeshStandardMaterial({color:'#424b4b',roughness:1}),paint=new T.MeshStandardMaterial({color:'#d0d1bd',roughness:1});r.materials.add(asphalt);r.materials.add(paint);const highwayGeometry=new T.BoxGeometry(620,.04,9),highway=new T.Mesh(highwayGeometry,asphalt);r.geometries.add(highwayGeometry);highway.position.set(0,.025,142);highway.name='connected-regional-road';root.add(highway);
 const stripeGeometry=new T.BoxGeometry(4,.012,.10),stripes=new T.InstancedMesh(stripeGeometry,paint,77);r.geometries.add(stripeGeometry);for(let i=0;i<77;i++)stripes.setMatrixAt(i,new T.Matrix4().makeTranslation(-304+i*8,.055,142));stripes.name='regional-road-markings';root.add(stripes);
 meshes.push(stripes);}
 let part=0;const lowParts=root.children.filter(o=>o.name==='imported-gravel-road') as T.InstancedMesh[];source.traverse(o=>{if(!(o instanceof T.Mesh))return;const baked=o.geometry.clone().applyMatrix4(o.matrixWorld),a=baked.getAttribute('position');for(let i=0;i<a.count;i++)a.setXYZ(i,(a.getX(i)-c.x)/s.x,.02+(a.getY(i)-b.min.y)/s.y*.065,(a.getZ(i)-c.z)/s.z);const geometry=roadGeometry(baked,r);baked.dispose();const low=lowParts[part++];const mesh=new T.InstancedMesh(geometry,detail&&low?low.material:o.material,placements.length);if(detail&&low){mesh.userData['lodMaxDistance']=35;low.userData['lodMinDistance']=35;}placements.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.name=detail?'imported-gravel-road-detail':'imported-gravel-road';mesh.receiveShadow=true;mesh.userData['roadSegmentCount']=placements.length;mesh.userData['sourceTriangleCount']=150222;root.add(mesh);meshes.push(mesh);});return meshes;
}
export function installApartments(scene:T.Scene,source:T.Object3D,r:Resources){
 source.updateMatrixWorld(true);const bounds=new T.Box3().setFromObject(source),c=bounds.getCenter(new T.Vector3()),height=bounds.getSize(new T.Vector3()).y;
 const parcels=cityPlan().filter(p=>p.kind==='apartment'&&true),city=scene.getObjectByName('night-city')!,meshes:T.InstancedMesh[]=[];
 source.traverse(o=>{if(!(o instanceof T.Mesh))return;const g=o.geometry.clone().applyMatrix4(o.matrixWorld);g.translate(-c.x,-bounds.min.y,-c.z);r.geometries.add(g);const mesh=new T.InstancedMesh(g,o.material,parcels.length);for(const [i,p] of parcels.entries()){const scale=(18+(p.seed%3)*3)/height;mesh.setMatrixAt(i,new T.Matrix4().compose(new T.Vector3(p.x,0,p.z),new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),(p.seed%4)*Math.PI/2),new T.Vector3(scale,scale,scale)));}mesh.name='imported-korean-apartments';mesh.traverse(o=>o.layers.set(2));mesh.castShadow=true;mesh.receiveShadow=true;city.add(mesh);meshes.push(mesh);});retire(scene,'procedural-apartment-batch');return meshes;
}
