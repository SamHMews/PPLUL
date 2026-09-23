const CACHE='training-v6';
const ASSETS=['./','./index.html','./style.css','./mobile.css','./gestures.js','./reps.js','./feedback.css','./stack.css','./app.js','./model.js','./storage.js','./manifest.webmanifest','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('training-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request)));});


self.addEventListener('message',event=>{if(event.data==='activate')self.skipWaiting();});
