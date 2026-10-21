import {existsSync,mkdirSync,cpSync,renameSync,rmSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {DatabaseSync,backup} from 'node:sqlite';
/** One-time migration from our earlier local release. Original data is untouched. */
export async function prepareLocalData(projectDir,{configured=process.env['CMS_DATA_DIR']}={}){
 const target=resolve(projectDir,configured||'data');
 if(configured||existsSync(join(target,'cms.sqlite')))return target;
 for(const parent of [dirname(projectDir),dirname(dirname(projectDir))])for(const release of ['scadawatt-v68','scadawatt-v67','scadawatt-v66','scadawatt-v65','scadawatt-v64','scadawatt-v63','scadawatt-v62','scadawatt-v61','scadawatt-v60','scadawatt-v59','scadawatt-v58','scadawatt-v57.1','scadawatt-v57']){
  const source=join(parent,release,'data');if(source===target||!existsSync(join(source,'cms.sqlite')))continue;
  let db;const staging=target+'.migration-'+process.pid;
  try{db=new DatabaseSync(join(source,'cms.sqlite'),{readOnly:true});if(!db.prepare('SELECT id FROM admin WHERE id=1').get()){db.close();db=null;continue}db.prepare('SELECT revision FROM content WHERE id=1').get();
   mkdirSync(staging,{recursive:true});await backup(db,join(staging,'cms.sqlite'));db.close();db=null;
   if(existsSync(join(source,'uploads')))cpSync(join(source,'uploads'),join(staging,'uploads'),{recursive:true});else mkdirSync(join(staging,'uploads'));
   if(existsSync(target))renameSync(target,target+'.onceki-'+Date.now());renameSync(staging,target);
   console.log('Önceki yerel sürümdeki yönetici hesabı ve içerikler aktarıldı. Eski klasör korundu.');return target;
  }catch(error){if(db)db.close();rmSync(staging,{recursive:true,force:true});throw Error('Önceki kayıtlar otomatik aktarılamadı. Eski data klasörünüz korunuyor. '+error.message)}
 }
 return target;
}
