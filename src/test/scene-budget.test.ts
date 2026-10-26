import {it,expect} from 'vitest';
import * as T from 'three';
import fs from 'node:fs';
import {loadTestGLTF as load} from './helpers/load-gltf';
import {createFlightWorld} from '@/lib/flight/world';
import {createInstanceCuller} from '@/lib/flight/instance-culling';
import {installImported} from '@/lib/flight/imported-models';
import {installUserModel} from '@/lib/flight/user-models';
import {installAdditionalModel} from '@/lib/flight/additional-models';
import {cityPlan} from '@/lib/flight/city-plan';
it('maintains bounded city draws and realistic house heights with production assets',async()=>{
 const w=createFlightWorld({textures:false}),r={geometries:new Set<T.BufferGeometry>(),materials:new Set<T.Material>(),maps:new Set<T.Texture>()};
 for(const k of ['walker','operator'] as const)installImported(w.scene,k,await load(k),r);
 for(const k of ['pete'] as const)installUserModel(w.scene,k,await load(k),r);
 for(const k of ['landscape','gravel_road','gravel_road_detail','service_pickup','gaming_room','furniture_sofa','furniture_table','furniture_desk','furniture_bookshelf'])installAdditionalModel(w.scene,k,await load(k==='gravel_road'?'gravel_road_lod':k==='gravel_road_detail'?'gravel_road':k),r);
 const scales=cityPlan().map(p=>({width:p.w,height:p.h,depth:p.d}));for(const p of scales){expect(p.width).toBeGreaterThanOrEqual(10);expect(p.height).toBeGreaterThanOrEqual(3);expect(p.height).toBeLessThanOrEqual(81);}
 const culler=createInstanceCuller(w.scene);culler.scan();const rows=[];for(const p of [.45,.6,.81,.85,.875,.9,.94,.96]){w.update(p,16/9);w.scene.updateMatrixWorld(true);const culling=culler.update(w.camera);let meshes=0,triangles=0,draws=0;w.scene.traverseVisible(o=>{if(o instanceof T.Mesh&&(!(o instanceof T.InstancedMesh)||o.count>0)){meshes++;triangles+=(o.geometry.index?.count??o.geometry.getAttribute('position').count)/3*(o instanceof T.InstancedMesh?o.count:1);draws+=Array.isArray(o.material)?o.geometry.groups.length:1;}});rows.push({p,meshes,triangles,draws,culling});}
 if(process.env['PROFILE_OUTPUT'])fs.writeFileSync(process.env['PROFILE_OUTPUT'],JSON.stringify({rows,scales,buildings:cityPlan().length},null,2));
 for(const row of rows.filter(row=>row.p>=.78&&row.p<.905)){expect(row.draws).toBeLessThan(25);expect(row.triangles).toBeLessThan(30000);}expect(rows.at(-1)!.draws).toBeLessThan(80);expect(rows.at(-1)!.triangles).toBeLessThan(240000);
w.dispose();
},60000);
