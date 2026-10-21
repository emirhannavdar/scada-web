import * as T from 'three';
/** Offline welded connectivity: detach floating scan fragments, preserve original UVs and surface vertices. */
export function scanComponents(root:T.Object3D){
 const meshes:T.Mesh[]=[];root.traverse(o=>{if(o instanceof T.Mesh)meshes.push(o);});const offsets:number[]=[];let total=0;for(const m of meshes){offsets.push(total);total+=m.geometry.getAttribute('position').count;}
 const parents=new Int32Array(total);for(let i=0;i<total;i++)parents[i]=i;
 const find=(n:number):number=>{while(parents[n]!==n){parents[n]=parents[parents[n]!]!;n=parents[n]!;}return n;};const join=(a:number,b:number)=>{a=find(a);b=find(b);if(a!==b)parents[b]=a;};
 const weld=new Map<string,number>();meshes.forEach((m,k)=>{const a=m.geometry.getAttribute('position'),offset=offsets[k]!,idx=m.geometry.index;for(let i=0;i<a.count;i++){const key=[a.getX(i),a.getY(i),a.getZ(i)].map(v=>Math.round(v*1000)).join(',');const old=weld.get(key);if(old!==undefined)join(old,offset+i);else weld.set(key,offset+i);}const N=idx?.count??a.count;for(let i=0;i<N;i+=3){const p=idx?idx.getX(i):i,q=idx?idx.getX(i+1):i+1,r=idx?idx.getX(i+2):i+2;join(offset+p,offset+q);join(offset+q,offset+r);}});
 const groups=new Map<number,{id:number;count:number;min:T.Vector3;max:T.Vector3}>();meshes.forEach((m,k)=>{const a=m.geometry.getAttribute('position'),offset=offsets[k]!;for(let i=0;i<a.count;i++){const id=find(offset+i);let g=groups.get(id);if(!g){g={id,count:0,min:new T.Vector3(Infinity,Infinity,Infinity),max:new T.Vector3(-Infinity,-Infinity,-Infinity)};groups.set(id,g);}g.count++;const v=new T.Vector3().fromBufferAttribute(a,i);g.min.min(v);g.max.max(v);}});
 return {meshes,offsets,find,groups:[...groups.values()].sort((a,b)=>b.count-a.count)};
}
