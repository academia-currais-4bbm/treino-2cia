/* TREINO 2ª CIA — CORREÇÃO SEGURA DE CACHE DOS EXERCÍCIOS DE ABDÔMEN v67729 */
const CACHE='t2cia-abdomen-safe-v67729';
const RUNTIME='t2cia-runtime-abdomen-safe-v67729';

self.addEventListener('install',event=>{
  event.waitUntil((async()=>{
    // Não pré-carrega app.js/data.js para não substituir o aplicativo íntegro já instalado.
    await caches.open(CACHE);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    // Não apaga caches antigos: eles podem conter o app.js íntegro que está funcionando.
    await self.clients.claim();
  })());
});

function isAbdomenPoster(url){
  const p=url.pathname.toLowerCase();
  const names=[
    'crunch-tradicional',
    'crunch-na-polia',
    'prancha-frontal',
    'prancha-lateral',
    'elevacao-de-pernas',
    'abdominal-bicicleta',
    'abdominal-obliquo',
    'dead-bug',
    'crunch-invertido',
    'abdominal-na-maquina',
    'ab-wheel',
    'hollow-body',
    'russian-twist',
    'pallof-press',
    'bird-dog'
  ];
  return names.some(name=>p.endsWith('/assets/exercises/posters/'+name+'.webp'));
}

function isAppShell(url){
  return url.pathname.endsWith('/') ||
    url.pathname.endsWith('/index.html') ||
    url.pathname.endsWith('/app.js') ||
    url.pathname.endsWith('/styles.css') ||
    url.pathname.endsWith('/data.js') ||
    url.pathname.endsWith('/cloud-config.js') ||
    url.pathname.endsWith('/manifest.json');
}

async function findAnyCached(req){
  const direct=await caches.match(req);
  if(direct)return direct;
  const keys=await caches.keys();
  for(const key of keys){
    const c=await caches.open(key);
    const hit=await c.match(req);
    if(hit)return hit;
  }
  return null;
}

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;

  // Estes 15 posters SEMPRE são buscados novamente no GitHub Pages,
  // evitando imagens antigas que ficaram presas no cache.
  if(isAbdomenPoster(url)){
    event.respondWith((async()=>{
      try{
        const freshUrl=new URL(req.url);
        freshUrl.searchParams.set('_abd67729','1');
        const fresh=await fetch(new Request(freshUrl.toString(),{
          method:'GET',
          headers:req.headers,
          mode:req.mode,
          credentials:req.credentials,
          redirect:req.redirect,
          referrer:req.referrer,
          referrerPolicy:req.referrerPolicy,
          cache:'no-store'
        }));
        if(fresh&&fresh.ok){
          const cache=await caches.open(RUNTIME);
          cache.put(req,fresh.clone()).catch(()=>{});
        }
        return fresh;
      }catch(e){
        return (await findAnyCached(req)) || Response.error();
      }
    })());
    return;
  }

  // Para o app shell, preserva primeiro o arquivo íntegro já armazenado.
  // Só busca na rede se não houver uma cópia local.
  if(isAppShell(url)){
    event.respondWith((async()=>{
      const cached=await findAnyCached(req);
      if(cached)return cached;
      try{
        return await fetch(req,{cache:'no-store'});
      }catch(e){
        return Response.error();
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

/* ===== WEB PUSH ===== */
self.addEventListener('push',event=>{
  event.waitUntil((async()=>{
    let data={};
    try{data=event.data?event.data.json():{}}catch(e){try{data={body:event.data?.text()||''}}catch(_) {}}
    const title=String(data.title||'Treino 2ª CIA');
    const feedId=Number(data.feedId??data.feed_id??0)||null;
    const options={
      body:String(data.body||'Você recebeu uma nova notificação.'),
      tag:String(data.tag||'treino-2cia-feed'),
      data:{tipo:data.tipo||'',feedId},
      badge:new URL('notification-badge-v676837.png',self.registration.scope).href,
      icon:new URL('notification-cbmrn.png',self.registration.scope).href,
      color:'#C8102E',vibrate:[180,80,180],renotify:true
    };
    await self.registration.showNotification(title,options);
  })());
});
self.addEventListener('notificationclick',event=>{
  event.notification.close();
  event.waitUntil((async()=>{
    const feedId=Number(event.notification?.data?.feedId||0)||null;
    const target=new URL(self.registration.scope);
    if(feedId)target.searchParams.set('feed',String(feedId));
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of windows){
      try{
        if(new URL(client.url).origin===target.origin){
          await client.focus();
          if(feedId){client.postMessage({type:'OPEN_FEED_ACTIVITY',feedId});return}
          if('navigate' in client)await client.navigate(target.href);
          return;
        }
      }catch(e){}
    }
    if(self.clients.openWindow)await self.clients.openWindow(target.href);
  })());
});
