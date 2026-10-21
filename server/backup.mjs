import {backup} from 'node:sqlite';
import {cpSync,mkdirSync,existsSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {openStore} from './store.mjs';
const store=openStore(process.env['CMS_DATA_DIR']||'data'),destination=resolve('backups',new Date().toISOString().replace(/[:.]/g,'-'));try{mkdirSync(destination,{recursive:true});await backup(store.db,join(destination,'cms.sqlite'));cpSync(join(store.dir,'uploads'),join(destination,'uploads'),{recursive:true});for(const name of ['mail.key','google.key'])if(existsSync(join(store.dir,name)))cpSync(join(store.dir,name),join(destination,name));console.log('Yedek: '+destination)}finally{store.close()}
