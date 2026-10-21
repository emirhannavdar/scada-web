import fs from 'node:fs';
import manifest from '@/lib/flight/model-manifest.json';
import {it,expect} from 'vitest';
import * as T from 'three';
import {createInstanceCuller} from '@/lib/flight/instance-culling';
import {loadTestGLTF} from './helpers/load-gltf';
import {installAdditionalModel} from '@/lib/flight/additional-models';
import {createFlightWorld} from '@/lib/flight/world';
it('uses exactly one road detail level per instance in both scroll directions',()=>{
 const s=new T.Scene(),g=new T.BoxGeometry(1,1,1),m=new T.MeshBasicMaterial(),low=new T.InstancedMesh(g,m,8),high=new T.InstancedMesh(g,m,8);low.userData['lodMinDistance']=35;high.userData['lodMaxDistance']=35;
 for(let i=0;i<8;i++){const matrix=new T.Matrix4().makeTranslation(0,0,-i*5);low.setMatrixAt(i,matrix);high.setMatrixAt(i,matrix);}s.add(low,high);const c=createInstanceCuller(s);c.scan();const camera=new T.PerspectiveCamera(60,1,.1,300);
 for(const z of [10,60,10]){camera.position.set(0,0,z);camera.lookAt(0,0,-100);c.update(camera);expect(low.count+high.count).toBe(8);expect(z===60?high.count:low.count).toBe(z===60?0:3);}
 c.clear();low.dispose();high.dispose();g.dispose();m.dispose();
});
it('installs baked terrain without reprocessing the scan and retains textured material assignments',async()=>{
 const gltf=await loadTestGLTF('landscape');expect(gltf.scene.userData['prebakedV34']).toBe('landscape');
 const sources=new Set<T.BufferGeometry>();gltf.scene.traverse(o=>{if(o instanceof T.Mesh)sources.add(o.geometry)});
 const w=createFlightWorld({textures:false}),r={geometries:new Set<T.BufferGeometry>(),materials:new Set<T.Material>(),maps:new Set<T.Texture>()};const result=installAdditionalModel(w.scene,'landscape',gltf,r)[0]!;
 result.traverse(o=>{if(o instanceof T.Mesh){expect(sources.has(o.geometry)).toBe(true);expect(o.castShadow).toBe(false);}});
 const bytes=fs.readFileSync('public'+manifest.landscape),j=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());for(const mesh of j.meshes)for(const p of mesh.primitives)expect(j.materials[p.material].pbrMetallicRoughness.baseColorTexture).toBeDefined();w.dispose();
},60000);
