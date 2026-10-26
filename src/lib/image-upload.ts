/** Browser-side resizing keeps uploads small without adding server dependencies. */
export type OptimizedImage={file:File;originalBytes:number;optimized:boolean;width?:number;height?:number};
export function imageUploadSize(width:number,height:number,maxEdge=2560){
 const scale=Math.min(1,maxEdge/Math.max(width,height));return {width:Math.max(1,Math.round(width*scale)),height:Math.max(1,Math.round(height*scale))};
}
export async function prepareImageUpload(file:File,maxEdge=2560):Promise<OptimizedImage>{
 if(!/\.(png|jpe?g|webp|avif)$/i.test(file.name))throw Error('PNG, JPEG, WebP veya AVIF görseli seçin.');
 if(file.size>24*1024*1024)throw Error('Kaynak görsel en fazla 24 MB olabilir.');
 const original={file,originalBytes:file.size,optimized:false};
 let image:CanvasImageSource|undefined,width=0,height=0,cleanup=()=>{};
 try{
  if(typeof createImageBitmap==='function'){
   const bitmap=await createImageBitmap(file);image=bitmap;width=bitmap.width;height=bitmap.height;cleanup=()=>bitmap.close();
  }else{
   const url=URL.createObjectURL(file),element=new Image();cleanup=()=>URL.revokeObjectURL(url);
   await new Promise<void>((resolve,reject)=>{element.onload=()=>resolve();element.onerror=()=>reject(Error('Görsel okunamadı.'));element.src=url});
   image=element;width=element.naturalWidth;height=element.naturalHeight;
  }
  if(!width||!height||width*height>32000000||width>16384||height>16384)throw Error('Görsel en fazla 32 megapiksel olabilir.');
  const size=imageUploadSize(width,height,maxEdge);
  // Small, correctly sized originals retain their exact bytes (logos and screenshots).
  if(file.size<=350*1024&&size.width===width&&size.height===height)return {...original,width,height};
  const canvas=document.createElement('canvas');canvas.width=size.width;canvas.height=size.height;
  const context=canvas.getContext('2d');if(!context)throw Error('Tarayıcı görseli işleyemedi.');
  context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';context.drawImage(image,0,0,size.width,size.height);
  const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/webp',file.type==='image/png'?.97:.92));
  if(blob&&blob.type==='image/webp'&&(blob.size<file.size||width>maxEdge||height>maxEdge)){
   const optimized=new File([blob],file.name.replace(/\.[^.]+$/,'.webp'),{type:'image/webp',lastModified:file.lastModified});
   if(optimized.size>8*1024*1024)throw Error('Görsel küçültüldükten sonra da 8 MB sınırını aşıyor. Daha küçük bir dosya seçin.');
   return {file:optimized,originalBytes:file.size,optimized:true,...size};
  }
  if(width>8192||height>8192||file.size>8*1024*1024)throw Error('Görsel küçültülemedi. 8 MB ve 8192 piksel altında bir dosya seçin.');
  return {...original,width,height};
 }catch(error){
  // If decoding is unsupported, retain a server-valid original rather than losing the upload.
  if(error instanceof Error&&/megapiksel|küçültü|8 MB/.test(error.message))throw error;
  if(file.size>8*1024*1024)throw Error('Görsel işlenemedi. 8 MB altında bir dosya seçin.');
  return original;
 }finally{cleanup()}
}
