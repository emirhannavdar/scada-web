import fs from 'node:fs';
import crypto from 'node:crypto';
import {MeshoptEncoder,MeshoptDecoder} from 'meshoptimizer';
await Promise.all([MeshoptEncoder.ready,MeshoptDecoder.ready]);
const base=new URL('../',import.meta.url),manifest=JSON.parse(fs.readFileSync(new URL('src/lib/flight/model-manifest.json',base))),metrics=JSON.parse(fs.readFileSync(new URL('MODEL_METRICS_V32.json',base)));
for(const [name,path] of Object.entries(manifest)){
 const original=fs.readFileSync(new URL('public'+path,base)),len=original.readUInt32LE(12),j=JSON.parse(original.subarray(20,20+len)),bin=original.subarray(28+len),images=new Set((j.images??[]).map(i=>i.bufferView)),chunks=[];let offset=0,fallback=0;
 if(j.extensionsRequired?.includes('EXT_meshopt_compression'))throw Error('Use the original uncompressed V32 asset set.');
 for(const [i,v] of j.bufferViews.entries()){
  const raw=bin.subarray(v.byteOffset??0,(v.byteOffset??0)+v.byteLength);let bytes;
  if(images.has(i)){bytes=raw;v.buffer=0;v.byteOffset=offset;}
  else{
   const attrs=(j.accessors??[]).filter(a=>a.bufferView===i),a=attrs[0],sizes={5120:1,5121:1,5122:2,5123:2,5125:4,5126:4},widths={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT4:16};let stride=v.byteStride??(a?sizes[a.componentType]*widths[a.type]:4);const isIndex=a?.type==='SCALAR'&&[5123,5125].includes(a.componentType)&&attrs.length===1&&(a.byteOffset??0)===0&&raw.length===a.count*stride;const mode=isIndex?'INDICES':'ATTRIBUTES';if(!isIndex&&(stride%4!==0||stride>256))stride=4;
   const padded=new Uint8Array(Math.ceil(raw.length/stride)*stride);padded.set(raw);const count=padded.length/stride;bytes=MeshoptEncoder.encodeGltfBuffer(padded,count,stride,mode);const decoded=new Uint8Array(padded.length);MeshoptDecoder.decodeGltfBuffer(decoded,count,stride,bytes,mode);if(!Buffer.from(decoded).equals(Buffer.from(padded)))throw Error(name+': compression changed bytes');
   v.buffer=1;v.byteOffset=fallback;v.byteLength=padded.length;v.extensions={...v.extensions,EXT_meshopt_compression:{buffer:0,byteOffset:offset,byteLength:bytes.length,byteStride:stride,count,mode}};fallback+=padded.length;
  }
  chunks.push(Buffer.from(bytes));offset+=bytes.length;const pad=(4-offset%4)%4;if(pad){chunks.push(Buffer.alloc(pad));offset+=pad;}
 }
 j.buffers=[{byteLength:offset},{byteLength:fallback,extensions:{EXT_meshopt_compression:{fallback:true}}}];for(const key of ['extensionsUsed','extensionsRequired'])j[key]=[...new Set([...(j[key]??[]),'EXT_meshopt_compression'])];
 const encoded=Buffer.from(JSON.stringify(j)),json=Buffer.concat([encoded,Buffer.alloc((4-encoded.length%4)%4,32)]),binary=Buffer.concat(chunks),out=Buffer.alloc(28+json.length+binary.length);out.writeUInt32LE(0x46546c67,0);out.writeUInt32LE(2,4);out.writeUInt32LE(out.length,8);out.writeUInt32LE(json.length,12);out.writeUInt32LE(0x4e4f534a,16);json.copy(out,20);out.writeUInt32LE(binary.length,20+json.length);out.writeUInt32LE(0x004e4942,24+json.length);binary.copy(out,28+json.length);
 const hash=crypto.createHash('sha256').update(out).digest('hex').slice(0,12),url=`/assets/models/optimized/${name}.${hash}.glb`;fs.writeFileSync(new URL('public'+url,base),out);manifest[name]=url;metrics.models[name].uncompressedV32Bytes=original.length;metrics.models[name].downloadBytes=out.length;metrics.models[name].losslessGeometryVerified=true;console.log(name,original.length,'→',out.length);
}
metrics.totalDownloadBytes=Object.values(metrics.models).reduce((s,m)=>s+m.downloadBytes,0);fs.writeFileSync(new URL('MODEL_METRICS_V33.json',base),JSON.stringify(metrics,null,2)+'\n');fs.writeFileSync(new URL('src/lib/flight/model-manifest.json',base),JSON.stringify(manifest,null,2)+'\n');
for(const name of fs.readdirSync(new URL('public/assets/models/optimized',base)))if(!Object.values(manifest).some(p=>p.endsWith('/'+name)))fs.unlinkSync(new URL('public/assets/models/optimized/'+name,base));
