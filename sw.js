const CACHE='t2cia-v67.72.49-gluteo-deitado-cachefix';
// v67.72.34: ativa o aviso individual de novidades sem trocar o cache validado de vídeos e Push.
const SHELL=['./','index.html?v=677249','styles.css?v=677246','app.js?v=677249','assets/treino-livre-destaque.mp4?v=677246','assets/tela-home.mp4?v=677246','assets/treino-livre/peito.png?v=677244','assets/treino-livre/costas.png?v=677244','assets/treino-livre/ombros.png?v=677244','assets/treino-livre/biceps.png?v=677244','assets/treino-livre/triceps.png?v=677244','assets/treino-livre/pernas.png?v=677244','assets/treino-livre/gluteos.png?v=677244','assets/treino-livre/core.png?v=677244','assets/treino-livre/corpo-inteiro.png?v=677244','assets/treino-livre/pernas/quadriceps.png?v=677244','assets/treino-livre/pernas/posterior-coxa.png?v=677244','assets/treino-livre/pernas/gluteos.png?v=677244','assets/treino-livre/pernas/adutores.png?v=677244','assets/treino-livre/pernas/abdutores.png?v=677244','assets/treino-livre/pernas/panturrilhas.png?v=677244','data.js','app.js','app-v16.js','app-v17.js','app-v18.js','app-v19.js','app-v20.js','app-v21.js','app-v22.js','app-v23.js','app-v24.js','app-v25.js','app-v26.js','app-v27.js','app-v28.js','app-v29.js','app-v30.js','app-v31.js','manifest.json','icon-192.png','icon-512.png','qrcodes.html','assets/exercises/1-inicio.webp','assets/exercises/1-fim.webp','assets/exercises/supino-inclinado-inicio.webp','assets/exercises/supino-inclinado-fim.webp','assets/exercises/crucifixo-halteres-inicio.webp','assets/exercises/crucifixo-halteres-fim.webp','assets/exercises/crossover-medio-inicio.webp','assets/exercises/crossover-medio-fim.webp','assets/exercises/triceps-corda-inicio.webp','assets/exercises/triceps-corda-fim.webp','assets/exercises/triceps-testa-inicio.webp','assets/exercises/triceps-testa-fim.webp','assets/exercises/puxada-frontal-inicio.webp','assets/exercises/puxada-frontal-fim.webp','assets/exercises/remada-baixa-inicio.webp','assets/exercises/remada-baixa-fim.webp','assets/exercises/remada-curvada-inicio.webp','assets/exercises/remada-curvada-fim.webp','assets/exercises/levantamento-terra-inicio.webp','assets/exercises/levantamento-terra-fim.webp','assets/exercises/barra-fixa-inicio.webp','assets/exercises/barra-fixa-fim.webp','assets/exercises/remada-unilateral-inicio.webp','assets/exercises/remada-unilateral-fim.webp','assets/exercises/rosca-direta-inicio.webp','assets/exercises/rosca-direta-fim.webp','assets/exercises/rosca-alternada-inicio.webp','assets/exercises/rosca-alternada-fim.webp','assets/exercises/rosca-martelo-inicio.webp','assets/exercises/rosca-martelo-fim.webp','assets/exercises/rosca-concentrada-inicio.webp','assets/exercises/rosca-concentrada-fim.webp','assets/exercises/agachamento-livre-inicio.webp','assets/exercises/agachamento-livre-fim.webp','assets/exercises/leg-press-inicio.webp','assets/exercises/leg-press-fim.webp','assets/exercises/cadeira-extensora-inicio.webp','assets/exercises/cadeira-extensora-fim.webp','assets/exercises/cadeira-flexora-inicio.webp','assets/exercises/cadeira-flexora-fim.webp','assets/exercises/avanco-inicio.webp','assets/exercises/avanco-fim.webp','assets/exercises/stiff-inicio.webp','assets/exercises/stiff-fim.webp','assets/exercises/cadeira-adutora-inicio.webp','assets/exercises/cadeira-adutora-fim.webp','assets/exercises/cadeira-abdutora-inicio.webp','assets/exercises/cadeira-abdutora-fim.webp','assets/exercises/panturrilha-em-pe-inicio.webp','assets/exercises/panturrilha-em-pe-fim.webp','assets/exercises/panturrilha-sentado-inicio.webp','assets/exercises/panturrilha-sentado-fim.webp','assets/exercises/desenvolvimento-barra-inicio.webp','assets/exercises/desenvolvimento-barra-fim.webp','assets/exercises/desenvolvimento-halteres-inicio.webp','assets/exercises/desenvolvimento-halteres-fim.webp','assets/exercises/elevacao-lateral-inicio.webp','assets/exercises/elevacao-lateral-fim.webp','assets/exercises/elevacao-frontal-inicio.webp','assets/exercises/elevacao-frontal-fim.webp','assets/exercises/crucifixo-invertido-inicio.webp','assets/exercises/crucifixo-invertido-fim.webp','assets/exercises/encolhimento-inicio.webp','assets/exercises/encolhimento-fim.webp','assets/exercises/face-pull-inicio.webp','assets/exercises/face-pull-fim.webp','assets/exercises/elevacao-lateral-cabo-inicio.webp','assets/exercises/elevacao-lateral-cabo-fim.webp','assets/exercises/prancha-frontal-inicio.webp','assets/exercises/prancha-frontal-fim.webp','assets/exercises/elevacao-pernas-inicio.webp','assets/exercises/elevacao-pernas-fim.webp','assets/exercises/abdominal-maquina-inicio.webp','assets/exercises/abdominal-maquina-fim.webp','assets/exercises/prancha-lateral-inicio.webp','assets/exercises/prancha-lateral-fim.webp','assets/exercises/triceps-frances-inicio.webp','assets/exercises/triceps-frances-fim.webp','assets/exercises/videos/supino-reto.mp4','assets/exercises/videos/supino-inclinado.mp4','assets/exercises/videos/supino-declinado.mp4?v=67740','assets/exercises/videos/crucifixo-com-halteres.mp4?v=67740','assets/exercises/videos/crossover-alto.mp4?v=67740','assets/exercises/videos/crossover-medio.mp4?v=677227','assets/exercises/videos/crossover-baixo.mp4?v=677227','assets/exercises/videos/peck-deck.mp4?v=677227','assets/exercises/videos/flexao-de-bracos.mp4?v=677227','assets/exercises/videos/supino-reto-com-halteres.mp4?v=677227','assets/exercises/videos/supino-inclinado-com-halteres.mp4?v=677227','assets/exercises/videos/chest-press-na-maquina.mp4?v=677227','assets/exercises/videos/barra-fixa.mp4?v=677228','assets/exercises/videos/face-pull.mp4?v=677228','assets/exercises/videos/levantamento-terra.mp4?v=677228','assets/exercises/videos/pulldown-unilateral.mp4?v=677228','assets/exercises/videos/pullover-na-polia.mp4?v=677228','assets/exercises/videos/puxada-alta-pronada.mp4?v=677228','assets/exercises/videos/puxada-neutra.mp4?v=677228','assets/exercises/videos/remada-articulada.mp4?v=677228','assets/exercises/videos/remada-baixa.mp4?v=677228','assets/exercises/videos/remada-cavalinho.mp4?v=677228','assets/exercises/videos/remada-curvada.mp4?v=677228','assets/exercises/videos/remada-unilateral.mp4?v=677228','assets/exercises/videos/arnold-press.mp4?v=677229','assets/exercises/videos/crucifixo-inverso.mp4?v=677229','assets/exercises/videos/desenvolvimento-com-barra.mp4?v=677229','assets/exercises/videos/desenvolvimento-com-halteres.mp4?v=677229','assets/exercises/videos/desenvolvimento-na-maquina.mp4?v=677229','assets/exercises/videos/elevacao-frontal.mp4?v=677229','assets/exercises/videos/elevacao-lateral-no-cabo.mp4?v=677229','assets/exercises/videos/elevacao-lateral.mp4?v=677229','assets/exercises/videos/encolhimento.mp4?v=677229','assets/exercises/videos/face-pull-ombros.mp4?v=677229','assets/exercises/videos/peck-deck-inverso.mp4?v=677229','assets/exercises/videos/remada-alta.mp4?v=677229','assets/exercises/videos/rosca-21.mp4?v=677230','assets/exercises/videos/rosca-alternada.mp4?v=677230','assets/exercises/videos/rosca-concentrada.mp4?v=677230','assets/exercises/videos/rosca-direta-barra.mp4?v=677230','assets/exercises/videos/rosca-inclinada.mp4?v=677230','assets/exercises/videos/rosca-inversa.mp4?v=677230','assets/exercises/videos/rosca-martelo-na-corda.mp4?v=677230','assets/exercises/videos/rosca-martelo.mp4?v=677230','assets/exercises/videos/rosca-na-polia.mp4?v=677230','assets/exercises/videos/rosca-scott.mp4?v=677230','assets/exercises/videos/rosca-spider.mp4?v=677230','assets/exercises/videos/rosca-unilateral-na-polia.mp4?v=677230','assets/exercises/videos/coice-de-triceps.mp4?v=677231','assets/exercises/videos/extensao-acima-da-cabeca-na-corda.mp4?v=677231','assets/exercises/videos/mergulho-em-banco.mp4?v=677231','assets/exercises/videos/paralelas.mp4?v=677231','assets/exercises/videos/supino-fechado.mp4?v=677231','assets/exercises/videos/triceps-barra.mp4?v=677231','assets/exercises/videos/triceps-corda.mp4?v=677231','assets/exercises/videos/triceps-frances-unilateral.mp4?v=677231','assets/exercises/videos/triceps-frances.mp4?v=677231','assets/exercises/videos/triceps-na-maquina.mp4?v=677231','assets/exercises/videos/triceps-testa.mp4?v=677231','assets/exercises/videos/triceps-unilateral-polia.mp4?v=677231','assets/exercises/videos/cadeira-abdutora.mp4?v=677232','assets/exercises/videos/cadeira-adutora.mp4?v=677232','assets/exercises/videos/afundo.mp4?v=677232','assets/exercises/videos/agachamento-bulgaro.mp4?v=677232','assets/exercises/videos/agachamento-sumo.mp4?v=677232','assets/exercises/videos/elevacao-pelvica.mp4?v=677232','assets/exercises/videos/panturrilha-em-pe.mp4?v=677232','assets/exercises/videos/panturrilha-sentada.mp4?v=677232','assets/exercises/videos/cadeira-flexora.mp4?v=677232','assets/exercises/videos/mesa-flexora.mp4?v=677232','assets/exercises/videos/stiff.mp4?v=677232','assets/exercises/videos/agachamento-livre.mp4?v=677232','assets/exercises/videos/cadeira-extensora.mp4?v=677232','assets/exercises/videos/hack-squat.mp4?v=677232','assets/exercises/videos/leg-press-45.mp4?v=677232','assets/exercises/videos/crunch-tradicional.mp4?v=677233','assets/exercises/videos/crunch-na-polia.mp4?v=677233','assets/exercises/videos/prancha-frontal.mp4?v=677233','assets/exercises/videos/prancha-lateral.mp4?v=677233','assets/exercises/videos/elevacao-de-pernas.mp4?v=677233','assets/exercises/videos/abdominal-bicicleta.mp4?v=677233','assets/exercises/videos/abdominal-obliquo.mp4?v=677233','assets/exercises/videos/dead-bug.mp4?v=677233','assets/exercises/videos/crunch-invertido.mp4?v=677233','assets/exercises/videos/abdominal-na-maquina.mp4?v=677233','assets/exercises/videos/ab-wheel.mp4?v=677233','assets/exercises/videos/hollow-body.mp4?v=677233','assets/exercises/videos/russian-twist.mp4?v=677233','assets/exercises/videos/pallof-press.mp4?v=677233','assets/exercises/videos/bird-dog.mp4?v=677233','assets/cardio/corrida-ao-ar-livre.webm?v=677238','assets/cardio/esteira.webm?v=677238','assets/cardio/bicicleta.webm?v=677238','assets/cardio/simulador-de-remo.webm?v=677238','assets/cardio/natacao.png?v=677238', 'assets/exercises/posters/gluteo-deitado.webp?v=677249','assets/exercises/videos/gluteo-deitado.mp4?v=677249'];

self.addEventListener('install',event=>{
  // v67.72.33: adiciona os 15 vídeos de abdômen, mantendo os vídeos anteriores e as notificações Push.
  // v67.72.32: adiciona os 15 vídeos de pernas; preserva os vídeos anteriores e as notificações Push.
  // v67.72.31: adiciona os 12 vídeos de tríceps sem remover vídeos anteriores nem alterar as notificações Push.
  // v67.72.30: adiciona os vídeos de bíceps ao cache sem remover vídeos anteriores nem alterar as notificações Push.
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    // v67.72.28: adiciona os vídeos de costas ao cache existente; mantém os vídeos de peito e as notificações Push.
    // v67.72.25: cache individual files; a missing optional asset must not abort SW installation.
    await Promise.all(SHELL.map(async path=>{
      try{
        const response=await fetch(path,{cache:'no-cache'});
        if(response&&response.ok)await cache.put(path,response);
      }catch(e){console.warn('SW: recurso ignorado no cache:',path,e)}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate',event=>{event.waitUntil((async()=>{const keys=await caches.keys();await Promise.all(keys.filter(k=>k.startsWith('t2cia-')&&k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim()})())});



/* v67.72.26 — Exibição das notificações Push do Feed */
self.addEventListener('push',event=>{
  event.waitUntil((async()=>{
    let payload={};
    try{
      if(event.data){
        const raw=event.data.text();
        try{payload=JSON.parse(raw)||{}}catch(_){payload={body:raw}}
      }
    }catch(e){payload={}}
    const title=String(payload.title||payload.titulo||'Treino 2ª CIA');
    const body=String(payload.body||payload.mensagem||payload.message||'Você recebeu uma nova interação no Feed esportivo.');
    const target=String(payload.url||payload.link||payload.data?.url||'./');
    const options={
      body,
      icon:payload.icon||'./icon-192.png',
      badge:payload.badge||'./icon-192.png',
      tag:payload.tag||('t2cia-feed-'+Date.now()),
      renotify:!!payload.renotify,
      data:{url:target,feed_id:payload.feed_id||payload.data?.feed_id||null,tipo:payload.tipo||payload.data?.tipo||null}
    };
    if(payload.image)options.image=payload.image;
    if(Array.isArray(payload.actions))options.actions=payload.actions;
    await self.registration.showNotification(title,options);
  })());
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const target=event.notification?.data?.url||'./';
  event.waitUntil((async()=>{
    let url;
    try{url=new URL(target,self.registration.scope).href}catch(e){url=self.registration.scope}
    const windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of windows){
      if('focus' in client){
        try{
          if(new URL(client.url).origin===new URL(self.registration.scope).origin){
            if('navigate' in client && client.url!==url)await client.navigate(url);
            return await client.focus();
          }
        }catch(e){}
      }
    }
    if(self.clients.openWindow)return self.clients.openWindow(url);
  })());
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;

  const url=new URL(req.url);
  const isAppFile =
    url.pathname.endsWith('/app.js') ||
    url.pathname.endsWith('/app-v16.js') ||
    url.pathname.endsWith('/app-v17.js') ||
    url.pathname.endsWith('/app-v18.js') ||
    url.pathname.endsWith('/app-v19.js') ||
    url.pathname.endsWith('/app-v20.js') ||
    url.pathname.endsWith('/app-v21.js') ||
    url.pathname.endsWith('/app-v22.js') ||
    url.pathname.endsWith('/app-v23.js') ||
    url.pathname.endsWith('/app-v24.js') ||
    url.pathname.endsWith('/app-v25.js') ||
    url.pathname.endsWith('/app-v26.js') ||
    url.pathname.endsWith('/app-v27.js') ||
    url.pathname.endsWith('/app-v28.js') ||
    url.pathname.endsWith('/app-v29.js') ||
    url.pathname.endsWith('/app-v30.js') ||
    url.pathname.endsWith('/app-v31.js') ||
    url.pathname.endsWith('/data.js') ||
    url.pathname.endsWith('/index.html') ||
    url.pathname.endsWith('/styles.css') ||
    url.pathname.endsWith('/manifest.json') ||
    url.pathname.endsWith('/');

  if(isAppFile){
    event.respondWith(
      fetch(req)
        .then(res=>{
          const copy=res.clone();
          caches.open(CACHE).then(cache=>cache.put(req,copy));
          return res;
        })
        .catch(()=>caches.match(req).then(r=>r||caches.match('index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached=>{
      if(cached) return cached;
      return fetch(req).then(res=>{
        const copy=res.clone();
        caches.open(CACHE).then(cache=>cache.put(req,copy));
        return res;
      });
    })
  );
});
