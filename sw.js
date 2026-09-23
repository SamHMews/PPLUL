const CACHE='training-v11';
const ASSETS=['./','./index.html','./style.css','./mobile.css','./gestures.js','./reps.js','./feedback.css','./stack.css','./app.js','./model.js','./storage.js','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
let legacyUpdateClient=null;
self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  // Versioned network requests bypass stale HTTP/CDN assets. Store under stable
  // keys so relative module imports and offline navigation use the same release.
  await Promise.all(ASSETS.map(async asset=>{
    const key=new URL(asset,self.registration.scope),fresh=new URL(key);
    fresh.searchParams.set('release',CACHE);
    const response=await fetch(fresh,{cache:'reload'});
    if(!response.ok)throw new Error('Could not download '+asset);
    await cache.put(key,response);
  }));
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  await Promise.all((await caches.keys()).filter(k=>k.startsWith('training-')&&k!==CACHE).map(k=>caches.delete(k)));
  await self.clients.claim();
  // Older pages can accept Update without having a working reload handler.
  // Navigate only that explicitly consenting client; never reset its storage.
  if(legacyUpdateClient){const client=await self.clients.get(legacyUpdateClient);if(client)client.navigate(client.url).catch(()=>{});}
})()));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE),cached=await cache.match(event.request);
    if(cached)return cached;
    if(event.request.mode==='navigate'&&(url.pathname===new URL(self.registration.scope).pathname||url.pathname===new URL('index.html',self.registration.scope).pathname))return (await cache.match(new URL('index.html',self.registration.scope)))||fetch(event.request);
    return fetch(event.request);
  })());
});
self.addEventListener('message',event=>{
  if(event.data==='activate'||event.data?.type==='activate'){
    legacyUpdateClient=event.data?.clientWillReload?null:event.source?.id;
    event.waitUntil(self.skipWaiting());
  }
});
