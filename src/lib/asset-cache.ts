/** Only content-addressed model paths receive a long-lived immutable cache policy. */
export function modelCacheControl(path:string){return /^\/assets\/models\/optimized\/[a-z_]+\.[a-f0-9]{12}\.glb(?:\?|$)/.test(path)?'public, max-age=31536000, immutable':null;}
