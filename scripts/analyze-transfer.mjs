import fs from 'node:fs';
const data=JSON.parse(fs.readFileSync(new URL('../MODEL_METRICS_V36.json',import.meta.url)));
console.log(`Models, first uncached visit: ${(data.activeDownloadBytes/1e6).toFixed(2)} MB before HTTP compression.`);
console.log(`Approximate decoded model textures including mipmaps: ${(data.estimatedTextureGPUBytes/1048576).toFixed(1)} MiB (not total GPU memory).`);
console.log('Repeat visits may reuse unchanged hash-versioned assets from HTTP cache. Cache size/retention is browser-dependent.');
for(const [name,model] of Object.entries(data.models).filter(([,m])=>m.requestedAtRuntime))console.log(name.padEnd(18),(model.downloadBytes/1e6).toFixed(2)+' MB',model.triangles+' triangles');
