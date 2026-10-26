import {it,expect} from 'vitest';import * as T from 'three';
import {createFlightWorld} from '@/lib/flight/world';import {planTables,tableLength,TILT,TABLE_D,FENCE_X,FENCE_NORTH,FENCE_SOUTH} from '@/lib/flight/field';import {trafficState,vehicleRoadX,vehicleRoadZ} from '@/lib/flight/traffic';import {loadTestGLTF} from './helpers/load-gltf';import {scanComponents} from '../../scripts/bake/clean-scan';
it('has one connected terrain surface with all detached scan fragments removed',async()=>{const gltf=await loadTestGLTF('landscape');expect(scanComponents(gltf.scene).groups).toHaveLength(1);},60000);
it('attaches every close-range panel fixing to a real table and keeps the control house inside the fence',()=>{
 const w=createFlightWorld({textures:false});w.scene.updateMatrixWorld(true);const attachments=w.scene.getObjectByName('field-construction-detail')!.userData['attachments'] as {x:number;y:number;z:number;tableX:number;tableZ:number;kind:string}[];
 expect(attachments.length).toBeGreaterThan(100);for(const a of attachments){const table=planTables().find(t=>t.x===a.tableX&&t.z===a.tableZ)!;expect(table).toBeDefined();const dz=(a.z-table.z)/Math.cos(TILT);expect(Math.abs(a.x-table.x)).toBeLessThanOrEqual(tableLength(table.n)/2);expect(Math.abs(dz)).toBeLessThan(TABLE_D/2);expect(Math.abs(a.y-(table.h+1.5-Math.sin(TILT)*dz))).toBeLessThan(.1);}
 const house=new T.Box3().setFromObject(w.scene.getObjectByName('field-control-house')!);expect(house.max.z).toBeLessThan(FENCE_SOUTH);expect(house.min.z).toBeGreaterThan(FENCE_NORTH);expect(house.max.x).toBeLessThan(FENCE_X);
 for(const t of planTables()){const tableBox=new T.Box3(new T.Vector3(t.x-tableLength(t.n)/2,-1,t.z-TABLE_D/2),new T.Vector3(t.x+tableLength(t.n)/2,5,t.z+TABLE_D/2));expect(house.intersectsBox(tableBox)).toBe(false);}w.dispose();
});
it('joins the supply conduit to the bottom gland with no vertical or horizontal gap',()=>{
 const w=createFlightWorld({textures:false});w.scene.updateMatrixWorld(true);const pipe=new T.Box3().setFromObject(w.scene.getObjectByName('panel-supply-conduit')!),gland=new T.Box3().setFromObject(w.scene.getObjectByName('scada-bottom-cable-gland')!);expect(pipe.intersectsBox(gland)).toBe(true);expect(pipe.min.y).toBeLessThan(.66);w.dispose();
});
it('distributes vehicles on twelve streets, both headings, within actual paved road bounds',()=>{
 for(const p of [.78,.85,.9,.944]){const states=Array.from({length:24},(_,i)=>trafficState(p,i));expect(new Set(states.map(s=>s.lane)).size).toBe(12);expect(new Set(states.map(s=>s.rotation)).size).toBe(4);
 for(const s of states){expect(Math.abs(s.x)).toBeLessThan(270);expect(Math.abs(s.z)).toBeLessThan(270);expect(s.lane<6?vehicleRoadX.some(x=>Math.abs(s.x-x)<2):vehicleRoadZ.some(z=>Math.abs(s.z-z)<2)).toBe(true);}for(let i=0;i<states.length;i++)for(let j=i+1;j<states.length;j++)expect(Math.hypot(states[i]!.x-states[j]!.x,states[i]!.z-states[j]!.z)).toBeGreaterThan(2.8);}
});
