const CACHE='t2cia-v67.50.0';
const RUNTIME='t2cia-runtime-v67.50.0';
const SHELL=[
  './',
  'index.html',
  'styles-v67-50-0.css',
  'app-v67-50-0.js',
  'data.js',
  'cloud-config.js',
  'manifest.json'
];

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await Promise.all(SHELL.map(async url=>{
      try{await cache.add(url)}catch(e){console.warn('Falha ao pré-cachear',url,e)}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE&&k!==RUNTIME).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

function isAppShell(url){
  return url.pathname.endsWith('/') ||
    url.pathname.endsWith('/index.html') ||
    url.pathname.endsWith('/app-v67-50-0.js') ||
    url.pathname.endsWith('/styles-v67-50-0.css') ||
    url.pathname.endsWith('/data.js') ||
    url.pathname.endsWith('/cloud-config.js') ||
    url.pathname.endsWith('/manifest.json');
}

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;

  if(isAppShell(url)){
    event.respondWith((async()=>{
      try{
        const fresh=await fetch(req,{cache:'no-store'});
        if(fresh&&fresh.ok){
          const cache=await caches.open(CACHE);
          cache.put(req,fresh.clone()).catch(()=>{});
        }
        return fresh;
      }catch(e){
        return (await caches.match(req)) || (await caches.match('index.html')) || Response.error();
      }
    })());
    return;
  }

  event.respondWith((async()=>{
    const cached=await caches.match(req);
    if(cached)return cached;
    try{
      const fresh=await fetch(req);
      if(fresh&&fresh.ok){
        const cache=await caches.open(RUNTIME);
        cache.put(req,fresh.clone()).catch(()=>{});
      }
      return fresh;
    }catch(e){
      return Response.error();
    }
  })());
});


/* ===== V67.43.0 — WEB PUSH ===== */
self.addEventListener('push',event=>{
  event.waitUntil((async()=>{
    let data={};
    try{data=event.data?event.data.json():{}}catch(e){try{data={body:event.data?.text()||''}}catch(_){}}
    const title=String(data.title||'Treino 2ª CIA');
    const options={
      body:String(data.body||'Você recebeu uma nova notificação.'),
      tag:String(data.tag||'treino-2cia-feed'),
      data:{url:String(data.url||'./'),tipo:data.tipo||'',feedId:data.feedId||null},
      vibrate:[180,80,180],
      renotify:true
    };
    await self.registration.showNotification(title,options);
  })());
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil((async()=>{
    const target=new URL(event.notification?.data?.url||'./',self.location.origin).href;
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of windows){
      try{
        if(new URL(client.url).origin===self.location.origin){
          await client.focus();
          if('navigate' in client)await client.navigate(target);
          return;
        }
      }catch(e){}
    }
    if(self.clients.openWindow)await self.clients.openWindow(target);
  })());
});
