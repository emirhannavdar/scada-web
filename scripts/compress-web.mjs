import {readdirSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {brotliCompressSync,gzipSync} from 'node:zlib';
for(const name of readdirSync('dist/assets'))if(/\.(js|css)$/.test(name)){const path=join('dist/assets',name),bytes=readFileSync(path);if(bytes.length<1024)continue;writeFileSync(path+'.br',brotliCompressSync(bytes));writeFileSync(path+'.gz',gzipSync(bytes));}
