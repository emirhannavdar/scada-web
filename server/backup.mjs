import {backup} from 'node:sqlite';
import {cpSync,mkdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {openStore} from './store.mjs';
const store=openStore(process.env['CMS_DATA_DIR']||'data'),destination=resolve('backups',new Date().toISOString().replace(/[:.]/g,'-'));try{mkdirSync(destination,{recursive:true});await backup(store.db,join(destination,'cms.sqlite'));cpSync(join(store.dir,'uploads'),join(destination,'uploads'),{recursive:true});console.log('Yedek: '+destination)}finally{store.close()}
