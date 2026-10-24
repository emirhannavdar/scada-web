import './postgres-test-env.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {prepareLocalData} from './prepare-data.mjs';
import {openDatabase} from './database.mjs';
test('legacy local SQLite recovery keeps the old source and existing images unchanged',async()=>{
 const base=mkdtempSync(join(tmpdir(),'sw-old-local-')),source=join(base,'scadawatt-v65','data'),current=join(base,'scadawatt-v118');mkdirSync(join(source,'uploads'),{recursive:true});mkdirSync(current);
 const db=new DatabaseSync(join(source,'cms.sqlite'));db.exec("CREATE TABLE admin(id INTEGER PRIMARY KEY,email TEXT,password TEXT);INSERT INTO admin VALUES(1,'old@test.com','unchanged');CREATE TABLE content(id INTEGER PRIMARY KEY,revision INTEGER);INSERT INTO content VALUES(1,13)");db.close();writeFileSync(join(source,'uploads','sample.png'),'existing-image');
 try{const target=await prepareLocalData(current,{configured:''});const copy=new DatabaseSync(join(target,'cms.sqlite'),{readOnly:true});assert.equal(copy.prepare('SELECT revision FROM content').get().revision,13);copy.close();assert.equal(readFileSync(join(target,'uploads','sample.png'),'utf8'),'existing-image');assert.equal(readFileSync(join(source,'uploads','sample.png'),'utf8'),'existing-image');assert.equal(await prepareLocalData(current,{configured:''}),target)}finally{rmSync(base,{recursive:true,force:true})}
});
test('startup refuses an empty PostgreSQL target when local SQLite still needs migration',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'sw-start-guard-'));writeFileSync(join(dir,'cms.sqlite'),'unchanged-source');try{await assert.rejects(openDatabase(dir),/cms:migrate-postgres/);assert.equal(readFileSync(join(dir,'cms.sqlite'),'utf8'),'unchanged-source')}finally{rmSync(dir,{recursive:true,force:true})}
});
