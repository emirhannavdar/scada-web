import fs from 'node:fs';
import crypto from 'node:crypto';
const manifest=JSON.parse(fs.readFileSync(new URL('../src/lib/flight/model-manifest.json',import.meta.url)));
let total=0;
for(const [name,path] of Object.entries(manifest)){
 const b=fs.readFileSync(new URL('../public'+path,import.meta.url));if(b.readUInt32LE(0)!==0x46546c67||b.readUInt32LE(8)!==b.length)throw Error(name+': invalid GLB');if(!path.includes(crypto.createHash('sha256').update(b).digest('hex').slice(0,12)))throw Error(name+': stale hash');const len=b.readUInt32LE(12),j=JSON.parse(b.subarray(20,20+len)),bytes=b.readUInt32LE(20+len);
 for(const v of j.bufferViews??[])if((v.byteOffset??0)+v.byteLength>(j.buffers[v.buffer??0]?.byteLength??bytes))throw Error(name+': buffer overflow');
 for(const a of j.accessors??[]){const v=j.bufferViews[a.bufferView];if(!v)throw Error(name+': missing accessor view');const width={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16}[a.type],size={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4}[a.componentType];if((a.byteOffset??0)+(a.count-1)*(v.byteStride??width*size)+width*size>v.byteLength)throw Error(name+': accessor overflow');}
 for(const image of j.images??[])if(image.bufferView===undefined)throw Error(name+': non-local image');
 if(name==='walker'&&(!j.skins?.length||!j.animations?.length))throw Error('Walking rig/clip missing');
 const triangles=(j.meshes??[]).flatMap(m=>m.primitives).reduce((sum,p)=>sum+j.accessors[p.indices??p.attributes.POSITION].count/3,0);total+=b.length;
 console.log(`${name}: ${(b.length/1e6).toFixed(2)} MB, ${Math.round(triangles)} triangles`);
}
console.log(`TOTAL MODEL TRANSFER: ${(total/1e6).toFixed(2)} MB (${Object.keys(manifest).length} files; before HTTP compression)`);
