import {it,expect} from 'vitest';
import * as T from 'three';
import {loadTestGLTF as load} from './helpers/load-gltf';
import {createFlightWorld} from '@/lib/flight/world';
import {installImported,fitWalkerHelmet} from '@/lib/flight/imported-models';
import {installUserModel} from '@/lib/flight/user-models';
import {installAdditionalModel} from '@/lib/flight/additional-models';
import {cityPlan} from '@/lib/flight/city-plan';
import metrics from '../../MODEL_METRICS_V33.json';
const visible=(o:T.Object3D)=>{let a:T.Object3D|null=o;while(a){if(!a.visible)return false;a=a.parent;}return true;};
it('runs the shipped optimized geometry through the real loader and leaves the field, room, and monitor camera unobstructed',async()=>{
 const w=createFlightWorld({textures:false}),r={geometries:new Set<T.BufferGeometry>(),materials:new Set<T.Material>(),maps:new Set<T.Texture>()},batches:T.InstancedMesh[]=[];
 const worker=await load('worker_hat'),walker=installImported(w.scene,'walker',await load('walker'),r);fitWalkerHelmet(worker.scene,walker.installed[0]!,r);installImported(w.scene,'operator',await load('operator'),r);
 for(const kind of ['pete'] as const){const out=installUserModel(w.scene,kind,await load(kind),r);out.forEach(o=>{if(o instanceof T.InstancedMesh)batches.push(o)});}
 for(const kind of ['landscape','gravel_road','gravel_road_detail','service_pickup','gaming_room','furniture_sofa','furniture_table','furniture_desk','furniture_bookshelf']){const out=installAdditionalModel(w.scene,kind,await load(kind==='gravel_road'?'gravel_road_lod':kind==='gravel_road_detail'?'gravel_road':kind),r);expect(out.length,kind).toBeGreaterThan(0);out.forEach(o=>{if(o instanceof T.InstancedMesh)batches.push(o)});}
 expect(cityPlan().length).toBe(142);expect(w.scene.getObjectByName('imported-small-villas')).toBeUndefined();expect(w.scene.getObjectByName('imported-korean-apartments')).toBeUndefined();expect(w.scene.getObjectByName('scanned-rocky-terrain')).toBeUndefined();expect(w.scene.getObjectByName('procedural-apartment-batch')).toBeUndefined();expect(w.scene.getObjectByName('procedural-villa-batch')).toBeUndefined();expect(w.scene.getObjectByName('monitor-hardware')).toBeUndefined();expect(w.scene.getObjectByName('operator-chair')).toBeUndefined();
 const room=w.scene.getObjectByName('imported-gaming-room')!;expect(room.userData['materialBatches']).toBeLessThan(26);expect(w.scene.getObjectByName('field-service-pickup')!.position.toArray()).toEqual([10.2,0,-36]);expect(metrics.totalDownloadBytes).toBeLessThan(100_000_000);
 const ray=new T.Raycaster();ray.layers.enableAll();for(const [start,end,steps] of [[0,.218,90],[.81,.95,80],[.93,1,80]])for(let i=0;i<steps!;i++){const p=start!+(end!-start!)*i/steps!,next=start!+(end!-start!)*(i+1)/steps!;w.update(p,16/9);w.scene.updateMatrixWorld(true);const a=w.camera.position.clone();w.update(next,16/9);w.scene.updateMatrixWorld(true);const d=w.camera.position.clone().sub(a);if(d.length()<1e-6)continue;ray.set(a,d.clone().normalize());ray.far=d.length();const hits=ray.intersectObjects(w.scene.children,true).filter(h=>visible(h.object));expect(hits.length,`camera ${p}: ${hits[0]?.object.name} parent ${hits[0]?.object.parent?.name}`).toBe(0);}
 for(const p of [.975,.995,1]){w.update(p,16/9);w.scene.updateMatrixWorld(true);w.camera.updateMatrixWorld(true);ray.far=Infinity;for(const x of [-.8,0,.8])for(const y of [-.8,0,.8]){const point=w.screen.localToWorld(new T.Vector3(x*.294,y*.1575,0)).project(w.camera);ray.setFromCamera(new T.Vector2(point.x,point.y),w.camera);const hit=ray.intersectObjects(w.scene.children,true).find(h=>visible(h.object));expect(hit?.object.name,`monitor ${p} ${x},${y}: ${hit?.object.name}/${hit?.object.parent?.name}`).toBe('monitor-screen');}}
 expect(w.camera.position.distanceTo(w.screen.getWorldPosition(new T.Vector3()))).toBeGreaterThan(.9);batches.forEach(m=>m.dispose());walker.mixer?.stopAllAction();w.dispose();r.geometries.forEach(g=>g.dispose());r.materials.forEach(m=>m.dispose());r.maps.forEach(t=>t.dispose());
},120000);
