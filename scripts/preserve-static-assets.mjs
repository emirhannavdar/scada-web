import {existsSync,readdirSync,lstatSync,mkdirSync,copyFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
/** Older ready-build packages keep models only in dist; preserve those before Vite empties it. */
const generated=/-[A-Za-z0-9_-]{6,}\.(?:js|css)(?:\.(?:br|gz))?$/;
let count=0;
function copy(dir,relative=''){
 if(!existsSync(dir))return;
 for(const name of readdirSync(dir)){
  if(name.startsWith('.'))continue;const from=join(dir,name),rel=join(relative,name),stat=lstatSync(from);if(stat.isSymbolicLink())continue;
  if(stat.isDirectory()){copy(from,rel);continue}if(!stat.isFile()||generated.test(name))continue;
  const to=join('public','assets',rel);if(existsSync(to))continue;mkdirSync(dirname(to),{recursive:true});copyFileSync(from,to);count++;
 }
}
copy(join('dist','assets'));if(count)console.log('Mevcut model/görseller build öncesi korundu: '+count+' dosya.');
