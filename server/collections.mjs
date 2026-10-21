export const COLLECTION_KEY='@collections';
export function makeCollections(catalog,values){const groups=structuredClone(catalog.baseCollections||{products:[],solutions:[],plans:[]});
 for(const [id,value] of Object.entries(values)){const field=catalog.fields.find(f=>f.id===id);if(!field?.path||!['products','productSpecifications','solutions','plans','comparison'].includes(field.path[0]))continue;const [root,index,...parts]=field.path;
  let item,path;if(root==='comparison'){const plan=groups.plans[Number(parts[0])-1];if(plan){plan.comparison[Number(index)]=value.tr;if(!plan.en.comparison)plan.en.comparison=[...plan.comparison];plan.en.comparison[Number(index)]=value.en;}continue;}if(root==='productSpecifications'){item=groups.products.find(p=>p.slug===index);path=['specifications',...parts]}else{item=groups[root][Number(index)];path=parts}if(!item)continue;
  for(const [language,text] of [['tr',value.tr],['en',value.en]]){let current=language==='tr'?item:item.en;for(const part of path.slice(0,-1))current=current?.[part];const key=path.at(-1);if(current&&key!==undefined&&Object.hasOwn(current,key))current[key]=text;}
 }
 return groups;
}
export function validateCollections(input,imageAllowed,catalog){
 const error=message=>{throw Object.assign(Error(message),{status:400})};
 const obj=v=>v&&typeof v==='object'&&!Array.isArray(v);
 const text=(v,label,optional=false,max=4000)=>{if(typeof v!=='string'||v.length>max||(!optional&&!v.trim()))error(label+' alanını Türkçe ve İngilizce doldurun.');return v.trim()};
 const array=(v,label,max=100)=>{if(!Array.isArray(v)||v.length>max)error(label+' listesi geçersiz veya çok uzun.');return v};
 const slug=(v)=>{if(typeof v!=='string'||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v)||v.length>80)error('Adres yalnız küçük harf, rakam ve tire içermeli.');return v};
 const pair=(item,key,label,optional=false,max=4000)=>({tr:text(item[key],label,optional,max),en:text(item.en?.[key],label,optional,max)});
 const result={};if(!obj(input)||Object.keys(input).some(k=>!['products','solutions','plans'].includes(k)))error('Geçersiz içerik listesi.');
 for(const kind of ['products','solutions','plans']){const seen=new Set(),codes=new Set();result[kind]=array(input[kind],kind,kind==='products'?500:100).map(item=>{if(!obj(item)||!obj(item.en))error('Geçersiz kayıt.');const id=slug(item.slug||item.id);if(seen.has(id))error('Aynı adres/kodla birden fazla kayıt olamaz.');seen.add(id);const out=kind==='plans'?{id}:{slug:id},en={};const fields=kind==='products'?['name','tagline','summary','role']:kind==='solutions'?['title','short','headline','caption']:['name','term'];for(const key of fields){const p=pair(item,key,key,['role','caption'].includes(key),key==='summary'?8000:2000);out[key]=p.tr;en[key]=p.en}
  if(kind==='solutions')out.featured=item.featured!==false;
  if(kind==='products'){out.code=text(item.code,'Cihaz kodu',false,80);const code=out.code.toLocaleLowerCase('tr');if(codes.has(code))error('Cihaz kodu benzersiz olmalı.');codes.add(code);out.hotspots=[];out.specifications=[];en.specifications=[];array(item.specifications||[],'Teknik özellikler').forEach((spec,i)=>{const es=item.en.specifications?.[i];if(!obj(spec)||!obj(es))error('Teknik özellik çevirisini doldurun.');out.specifications.push({name:text(spec.name,'Özellik adı',false,200),value:text(spec.value,'Özellik değeri',false,1000)});en.specifications.push({name:text(es.name,'İngilizce özellik adı',false,200),value:text(es.value,'İngilizce özellik değeri',false,1000)})});}
  if(kind!=='plans'){if(!imageAllowed(item.image))error('Görsel kütüphanesinden geçerli bir görsel seçin.');out.image=item.image}
  const lists=kind==='solutions'?['body','points']:kind==='plans'?['features']:[];for(const key of lists){out[key]=array(item[key],key,50).map(v=>text(v,key,false,4000));en[key]=array(item.en[key],key,50).map(v=>text(v,'İngilizce '+key,false,4000));if(out[key].length!==en[key].length)error('Türkçe ve İngilizce satır sayıları eşit olmalı.');if(key==='body'&&!out[key].length)error('Çözüm için en az bir açıklama paragrafı girin.');}
  if(kind==='plans'){out.recommended=Boolean(item.recommended);out.comparison=array(item.comparison||[],'Karşılaştırma',catalog.comparisonLabels?.length||100).map(v=>typeof v==='boolean'?v:text(v,'Karşılaştırma',true,300)||'—');en.comparison=array(item.en.comparison||out.comparison,'İngilizce karşılaştırma',catalog.comparisonLabels?.length||100).map(v=>typeof v==='boolean'?v:text(v,'İngilizce karşılaştırma',true,300)||'—');if(en.comparison.length!==out.comparison.length)error('Karşılaştırma çeviri satırlarını kontrol edin.');if(out.comparison.length!==(catalog.comparisonLabels?.length||0))error('Paket karşılaştırma satırlarını kontrol edin.');}
  out.en=en;return out;
 });}
 const planNames=new Set();for(const plan of result.plans){const name=plan.name.toLocaleLowerCase('tr');if(planNames.has(name))error('Paket adları benzersiz olmalı.');planNames.add(name)}
 return result;
}
