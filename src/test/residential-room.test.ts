import {it,expect} from 'vitest';
import * as T from 'three';
import {loadTestGLTF} from './helpers/load-gltf';
import {createFlightWorld} from '@/lib/flight/world';
import {installAdditionalModel} from '@/lib/flight/additional-models';
import {furnitureLayout} from '@/lib/flight/residential-room';
function localBounds(root:T.Object3D,room:T.Object3D){room.updateWorldMatrix(true,true);const inverse=room.matrixWorld.clone().invert(),bounds=new T.Box3();root.traverse(o=>{if(o instanceof T.Mesh){o.geometry.computeBoundingBox();bounds.union(o.geometry.boundingBox!.clone().applyMatrix4(inverse.clone().multiply(o.matrixWorld)));}});return bounds;}
it('grounds every furniture model, keeps the desk at monitor height and removes the old room clutter',async()=>{
 const w=createFlightWorld({textures:false}),r={geometries:new Set<T.BufferGeometry>(),materials:new Set<T.Material>(),maps:new Set<T.Texture>()};
 installAdditionalModel(w.scene,'gaming_room',await loadTestGLTF('gaming_room'),r);const room=w.scene.getObjectByName('remote-home')!;
 for(const kind of Object.keys(furnitureLayout) as (keyof typeof furnitureLayout)[]){installAdditionalModel(w.scene,kind,await loadTestGLTF(kind),r);const layout=furnitureLayout[kind],model=room.getObjectByName(layout.name)!;expect(model).toBeDefined();const bounds=localBounds(model,room);expect(bounds.min.y,kind).toBeCloseTo(layout.y,3);expect(bounds.min.x).toBeGreaterThan(13.08);expect(bounds.max.x).toBeLessThan(24.92);expect(bounds.min.z).toBeGreaterThan(-2.12);expect(bounds.max.z).toBeLessThan(10.25);if(kind==='furniture_desk')expect(bounds.max.y).toBeCloseTo(.765,2);if(kind==='furniture_bookshelf')expect(bounds.max.y).toBeCloseTo(2.204,1);}
 const sofa=localBounds(room.getObjectByName('residential-sectional-sofa')!,room),desk=localBounds(room.getObjectByName('residential-office-desk')!,room);expect(sofa.intersectsBox(desk)).toBe(false);
 const table=localBounds(room.getObjectByName('residential-coffee-table')!,room),inverse=room.matrixWorld.clone().invert();let collisions=0;room.getObjectByName('residential-sectional-sofa')!.traverse(o=>{if(!(o instanceof T.Mesh))return;const m=inverse.clone().multiply(o.matrixWorld),a=o.geometry.getAttribute('position'),v=new T.Vector3();for(let i=0;i<a.count;i++)if(table.containsPoint(v.fromBufferAttribute(a,i).applyMatrix4(m)))collisions++;});expect(collisions).toBe(0);
expect(room.getObjectByName('living-room')).toBeUndefined();expect(room.userData['interiorLayoutVersion']).toBe(36);w.dispose();
},60000);
it('keeps city geometry bounded after expanding the plan and uses distance LOD without background model downloads',()=>{
 const w=createFlightWorld({textures:false}),root=w.scene.getObjectByName('operator-district')!;let triangles=0;root.traverse(o=>{if(o instanceof T.InstancedMesh)triangles+=(o.geometry.index?.count??o.geometry.getAttribute('position').count)/3*o.count;});expect(root.userData['buildingCount']).toBe(142);expect(root.userData['batchCount']).toBeLessThan(25);expect(triangles).toBeLessThan(45000);w.dispose();
});
