/* Treino 2ª CIA — v67.68.34 */

const DATA=window.APP_DATA;
let currentGroup="", currentListMode="group", currentExercise=null, currentSet=1, timer=90, tick=null;
let activePlanName="", activePlanExercises=[], activePlanIndex=-1, workoutStartedAt=null;


const byId=id=>document.getElementById(id);

function footerGoHome(){
  try{ if(typeof stopExerciseMotion==='function') stopExerciseMotion(); }catch(e){}
  // V67.68.34 — tocar em Início é uma navegação explícita do usuário.
  // Se há treino em andamento, preserva o ponto como PAUSADO PELO USUÁRIO,
  // mas nunca permite que a restauração automática sequestre a Home.
  const active=typeof v67604ActivePlanState==='function'?v67604ActivePlanState():null;
  if(active){
    try{v67604PauseWorkout(true);return}catch(e){console.warn('Falha ao pausar ao ir para Home:',e)}
  }
  showView('home');
}

function footerGoTools(){
  showView('tools');
}


/* ===== V67.62.2 — TRILHA DA NAVEGAÇÃO / AUTOPLAY ROBUSTO ===== */
const V67621_MUSIC_PREF='t2_nav_music_enabled_v67621';
let v67621Music=null;
let v67621MusicUnlocked=false;
let v67622MusicGestureInstalled=false;
function v67621MusicEnabled(){
  try{return localStorage.getItem(V67621_MUSIC_PREF)!=='0'}catch(e){return true}
}
function v67621WorkoutActive(){
  // V67.67.7 — só bloqueia a música quando existe um treino REAL em andamento.
  // Antes, qualquer valor residual em t2_active_plan (inclusive estado antigo ou
  // inválido) deixava a navegação inteira muda indefinidamente.
  try{
    const raw=localStorage.getItem('t2_active_plan');
    if(!raw)return !!workoutStartedAt;
    const saved=JSON.parse(raw);
    const valid=!!(saved && saved.name && saved.startedAt && Number.isFinite(Number(saved.index)) && Number(saved.index)>=0);
    if(!valid){
      localStorage.removeItem('t2_active_plan');
      return !!workoutStartedAt;
    }
    return true;
  }catch(e){
    try{localStorage.removeItem('t2_active_plan')}catch(_e){}
    return !!workoutStartedAt;
  }
}
function v67621GetMusic(){
  if(v67621Music)return v67621Music;
  const a=new Audio('./trilha-treino-2cia.mp3');
  a.loop=true;a.preload='auto';a.volume=0.24;
  a.addEventListener('play',()=>{v67621MusicUnlocked=true;v67621UpdateMusicButton()});
  a.addEventListener('pause',v67621UpdateMusicButton);
  v67621Music=a;
  return a;
}
function v67621ShouldPlayMusic(){
  return v67621MusicEnabled() && !v67621WorkoutActive() && document.visibilityState!=='hidden';
}
/* V67.67.6 — a trilha usa exatamente a mesma URL pré-cacheada pelo Service Worker.
   Isso evita silêncio na navegação quando o PWA está offline ou o cache antigo
   não possui a variante com query string. */
async function v67621PlayMusic(forceAttempt=false){
  if(!v67621ShouldPlayMusic())return false;
  if(!v67621MusicUnlocked&&!forceAttempt)return false;
  try{
    await v67621GetMusic().play();
    v67621MusicUnlocked=true;
    v67621UpdateMusicButton();
    return true;
  }catch(e){
    v67622InstallGestureUnlock();
    v67621UpdateMusicButton();
    return false;
  }
}
function v67621StopMusic(reset=false){
  try{if(v67621Music){v67621Music.pause();if(reset)v67621Music.currentTime=0}}catch(e){}
  v67621UpdateMusicButton();
}
function v67621UpdateMusicButton(){
  const b=document.getElementById('v67621MusicToggle');if(!b)return;
  const enabled=v67621MusicEnabled();
  const playing=!!v67621Music&&!v67621Music.paused;
  b.textContent=enabled?(playing?'🔊':'🔈'):'🔇';
  b.title=enabled?'Desativar música do app':'Ativar música do app';
  b.setAttribute('aria-label',b.title);
  b.classList.toggle('is-off',!enabled);
}
function v67621ToggleMusic(){
  const next=!v67621MusicEnabled();
  try{localStorage.setItem(V67621_MUSIC_PREF,next?'1':'0')}catch(e){}
  if(next&&!v67621WorkoutActive()){
    v67621MusicUnlocked=true;
    v67621PlayMusic(true);
  }else v67621StopMusic(false);
  v67621UpdateMusicButton();
}
function v67621InstallMusicButton(){
  if(document.getElementById('v67621MusicToggle'))return;
  const b=document.createElement('button');
  b.id='v67621MusicToggle';b.type='button';b.className='v67621-music-toggle';
  b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();v67621ToggleMusic()});
  document.body.appendChild(b);v67621UpdateMusicButton();
}
function v67622GestureUnlock(){
  if(!v67621ShouldPlayMusic())return;
  const a=v67621GetMusic();
  if(!a.paused)return;
  v67621MusicUnlocked=true;
  // Executa dentro do gesto real do usuário. Isso é o caminho mais confiável
  // no Android depois que o PWA volta do segundo plano.
  v67621PlayMusic(true);
}
function v67622InstallGestureUnlock(){
  if(v67622MusicGestureInstalled)return;
  v67622MusicGestureInstalled=true;
  // O listener permanece durante toda a sessão. O Android pode revogar a
  // autorização de reprodução após background/foreground, mesmo que já tenha
  // tocado antes. Cada interação de navegação pode então reativar a trilha.
  window.addEventListener('pointerdown',v67622GestureUnlock,true);
  window.addEventListener('touchstart',v67622GestureUnlock,true);
  window.addEventListener('keydown',v67622GestureUnlock,true);
}
function v67622RemoveGestureUnlock(){
  // V67.62.4: intencionalmente não removemos o desbloqueio por gesto.
  // Ele é leve e garante retomada da música ao voltar a mexer no app.
}
function v67622TryMusicOnOpen(){
  if(!v67621ShouldPlayMusic())return;
  // Tenta tocar já na abertura. Se o Chromium bloquear autoplay com som,
  // mantém os listeners até a PRIMEIRA interação que realmente liberar o áudio.
  v67621PlayMusic(true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{
  v67621InstallMusicButton();
  v67622InstallGestureUnlock();
  setTimeout(v67622TryMusicOnOpen,80);
},{once:true});
else{
  v67621InstallMusicButton();
  v67622InstallGestureUnlock();
  setTimeout(v67622TryMusicOnOpen,80);
}
// V67.62.3 — retomada robusta da trilha ao voltar de outro aplicativo.
// Alguns Androids ainda mantêm a página em estado de retomada por alguns ms
// depois do visibilitychange. Uma tentativa única nesse instante pode falhar.
let v67623ResumeTimers=[];
function v67623CancelResumeTimers(){
  v67623ResumeTimers.forEach(t=>clearTimeout(t));
  v67623ResumeTimers=[];
}
function v67623ResumeMusicAfterReturn(){
  if(document.visibilityState==='hidden'||v67621WorkoutActive()||!v67621MusicEnabled())return;
  v67622InstallGestureUnlock();
  v67623CancelResumeTimers();
  [0,180,550,1200].forEach(delay=>{
    v67623ResumeTimers.push(setTimeout(()=>{
      if(document.visibilityState!=='hidden'&&!v67621WorkoutActive()&&v67621MusicEnabled()){
        v67621PlayMusic(true);
      }
    },delay));
  });
}
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='hidden'){
    // V67.68.34 — suspensão automática do Android: preserva e permite voltar
    // automaticamente à mesma tela, sem confundir com PAUSAR/Home do usuário.
    const active=v67604ActivePlanState();
    if(active && !['user_paused'].includes(active.status)){
      pauseTimer();
      v67604SaveActivePlanState({status:'background_paused',pausedAt:active.pausedAt||new Date().toISOString()});
      if(v676830IsCustomName(active.name))v676830WriteCheckpoint({status:'background_paused'});
    }
    saveNavigationState(document.querySelector('.view.active')?.id||'home');
  }
  if(document.visibilityState==='visible'){
    const cp=v676830ReadCheckpoint();
    if(cp&&v676830IsCustomName(cp.name)&&cp.status==='background_paused'){
      const wrongView=(document.querySelector('.view.active')?.id||'home')!=='exercise';
      const wrongExercise=String(currentExercise?.id??'')!==String(cp.currentExerciseId??'');
      const wrongSet=Number(currentSet||1)!==Number(cp.currentSet||1);
      if(wrongView||wrongExercise||wrongSet){try{v676830RestoreCheckpoint(cp,false)}catch(e){console.warn('Falha ao voltar ao ponto do personalizado:',e)}}
    }
    if(cloudSession?.token && navigator.onLine)cloudInitialSync(false);
  }
});
// V67.68.12 — redundância para Android/PWA: se o documento for descarregado
// sem um visibilitychange confiável, preserva a sessão como pausada.
window.addEventListener('pagehide',()=>{
  const active=v67604ActivePlanState();
  if(active && active.status!=='user_paused'){
    pauseTimer();
    v67604SaveActivePlanState({status:'background_paused',pausedAt:active.pausedAt||new Date().toISOString()});
    if(v676830IsCustomName(active.name))v676830WriteCheckpoint({status:'background_paused'});
  }
  saveNavigationState(document.querySelector('.view.active')?.id||'home');
});
async function v6719ImproveStorageDurability(){
  try{
    if(navigator.storage?.persist)await navigator.storage.persist();
    if(navigator.storage?.estimate){
      const est=await navigator.storage.estimate();
      if(est?.quota&&est?.usage&&est.usage/est.quota>0.88)v6719StorageWarning();
    }
  }catch(e){}
}
window.addEventListener('load',()=>{setTimeout(cloudInit,700);setTimeout(v6719ImproveStorageDurability,1200)});


/* V55 — PERFIL DO MILITAR + RANKING DE CONSTÂNCIA */
function v55Esc(v){return String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}
function v55MonthKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
function v55WorkoutDate(w){const d=new Date(w?.date||w?.finishedAt||w?.endedAt||0);return isNaN(d)?null:d}
function v55ValidWorkout(w){
  if(w?.excludedFromStats===true||w?.serviceDay!==true)return false;
  // V67.39 — Core continua no Histórico, Evolução e Feed, mas não pontua no Ranking de Frequência.
  if(w?.workoutType==='core')return false;
  if(isCardioRecord(w))return Number(w?.duration||0)>=30&&w?.cardioServiceDay===true;
  if(w?.workoutType==='free')return Number(w?.duration||0)>=20&&Array.isArray(w?.muscleGroups)&&w.muscleGroups.length>=1;
  return Number(w?.exercisesDone||0)>=3&&Number(w?.sets||0)>=6;
}
function v6711LocalDayKey(w){
  const d=v55WorkoutDate(w); if(!d)return '';
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function v6711RankingCategory(w){
  if(w?.workoutType==='core')return 'core';
  if(isCardioRecord(w)||w?.workoutType==='cardio'||w?.rankingCategory==='cardio')return 'cardio';
  return 'treino';
}
function v6735ServiceWindowKey(w){
  // V67.41 — novos registros usam a data de início da jornada fixa 07h→07h.
  if(w?.serviceWindowKey&&/^\d{4}-\d{2}-\d{2}$/.test(String(w.serviceWindowKey)))return String(w.serviceWindowKey);
  const d=v55WorkoutDate(w);
  const fixed=d?serviceOperationalWindowKey(d):null;
  if(fixed)return fixed;
  if(w?.serviceWindowKey)return String(w.serviceWindowKey);
  if(w?.serviceValidatedAt)return String(w.serviceValidatedAt);
  const day=v6711LocalDayKey(w);
  return day?`legacy-day:${day}`:'';
}
function v6711CappedValidCount(records){
  // V67.39 — Ranking de Frequência mede constância: cada janela operacional
  // validada de 24h pode gerar no máximo 1 ponto. Treino e Cardio são atividades
  // principais; Core é complementar e não pontua.
  const validWindows=new Set();
  records.forEach(w=>{
    if(!v55ValidWorkout(w))return;
    const key=v6735ServiceWindowKey(w); if(!key)return;
    validWindows.add(key);
  });
  return validWindows.size;
}
function v55Stats(){
 const all=workoutHistory().filter(w=>w?.excludedFromStats!==true), mk=v55MonthKey();
 const month=all.filter(w=>{const d=v55WorkoutDate(w);return d&&v55MonthKey(d)===mk});
 return {all:all.length,month:month.length,valid:v6711CappedValidCount(month),
 sets:all.reduce((a,w)=>a+(Number(w.sets)||0),0),volume:all.reduce((a,w)=>a+(Number(w.volume)||0),0),
 minutes:all.reduce((a,w)=>a+(Number(w.duration)||0),0)};
}
const V6717_PROFILE_PHOTO_KEY='t2_profile_photo_v6717';
function v6717ProfilePhoto(){return localStorage.getItem(V6717_PROFILE_PHOTO_KEY)||''}
function v6718RenderHomeProfilePhoto(){
  const badge=document.getElementById('cloudUserBadge');
  if(!badge)return;
  const photo=v6717ProfilePhoto();
  if(photo){
    badge.classList.add('has-photo');
    badge.innerHTML=`<img src="${photo}" alt="Foto do militar">`;
  }else{
    badge.classList.remove('has-photo');
    badge.textContent='BM';
  }
}
async function v6717ChooseProfilePhoto(input){
  const file=input?.files?.[0];
  if(!file)return;
  if(!String(file.type||'').startsWith('image/')){alert('Selecione uma imagem válida.');input.value='';return;}
  if(file.size>12*1024*1024){alert('A foto é muito grande. Escolha uma imagem de até 12 MB.');input.value='';return;}
  let url='';
  try{
    url=URL.createObjectURL(file);
    const img=new Image();
    await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url});
    const side=Math.min(img.naturalWidth,img.naturalHeight);
    const sx=Math.max(0,(img.naturalWidth-side)/2), sy=Math.max(0,(img.naturalHeight-side)/2);
    let size=256,quality=0.74,data='';
    for(let attempt=0;attempt<5;attempt++){
      const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
      const ctx=canvas.getContext('2d',{alpha:false});
      ctx.drawImage(img,sx,sy,side,side,0,0,size,size);
      data=canvas.toDataURL('image/jpeg',quality);
      if(data.length<=135000)break;
      quality=Math.max(0.52,quality-0.08);
      if(attempt>=2)size=Math.max(192,size-32);
    }
    try{
      localStorage.setItem(V6717_PROFILE_PHOTO_KEY,data);
    }catch(e){
      if(v6719IsQuotaError(e)){
        alert('Não há espaço local suficiente para salvar a foto. Seus treinos não foram apagados. Libere espaço do navegador ou tente novamente depois.');
        input.value='';return;
      }
      throw e;
    }
    v6718RenderHomeProfilePhoto();
    input.value='';
    openV55Profile();
  }catch(e){
    console.error(e);alert('Não foi possível processar a foto. Tente outra imagem.');input.value='';
  }finally{
    if(url)try{URL.revokeObjectURL(url)}catch(e){}
  }
}
function openV55Profile(){
 const s=v55Stats(), box=document.getElementById('v55ProfileContent');
 const n=v55Esc(cloudSession?.nome||'Militar'),g=v55Esc(cloudSession?.graduacao||'BM'),m=cloudMask(cloudSession?.matricula||'');
 const photo=v6717ProfilePhoto();
 const avatar=photo?`<div class="v55-avatar has-photo" onclick="document.getElementById('v6717ProfilePhotoInput')?.click()" title="Trocar foto"><img src="${photo}" alt="Foto do perfil"></div>`:`<div class="v55-avatar" onclick="document.getElementById('v6717ProfilePhotoInput')?.click()" title="Adicionar foto">BM</div>`;
 box.innerHTML=`<div class="v55-profile-hero"><div class="v6717-avatar-wrap">${avatar}<button class="v6717-photo-btn" type="button" onclick="document.getElementById('v6717ProfilePhotoInput')?.click()">📷 ${photo?'Trocar foto':'Adicionar foto'}</button><input id="v6717ProfilePhotoInput" type="file" accept="image/*" hidden onchange="v6717ChooseProfilePhoto(this)"></div><div><small>PERFIL OPERACIONAL</small><h2>${n}</h2><span>${g} • Matrícula ${m}</span></div></div>
 <div class="v55-stat-grid"><div class="v55-stat"><b>${s.month}</b><span>Treinos no mês</span></div><div class="v55-stat"><b>${s.all}</b><span>Treinos totais</span></div><div class="v55-stat"><b>${s.sets}</b><span>Séries registradas</span></div><div class="v55-stat"><b>${s.minutes}</b><span>Minutos treinados</span></div></div>
 <div class="card"><h3>CONSTÂNCIA DO MÊS</h3><div class="v55-big">${s.month} <small>treinos realizados</small></div><p>A constância considera todos os treinos registrados no mês, mesmo quando não geram ponto no Ranking de Frequência. A pontuação depende da presença validada na unidade, dos critérios da atividade e do limite por janela.</p></div>
 <div class="card"><h3>VOLUME ACUMULADO</h3><div class="v55-big">${Math.round(s.volume).toLocaleString('pt-BR')} <small>kg</small></div></div>`;
 showView('v55Profile');
 saveNavigationState('v55Profile');
}
async function v55RpcAll(fn,payload){
 const r=await cloudApi('/rest/v1/rpc/'+fn,{method:'POST',body:JSON.stringify(payload)});const d=await r.json().catch(()=>[]);
 if(!r.ok)throw new Error((d&&(d.message||d.details))||'Falha no servidor');return Array.isArray(d)?d:[d];
}
let v55RankingMode='monthly';
let v55RankingMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);

function v55SetRankingMode(mode){
  v55RankingMode=mode==='annual'?'annual':'monthly';
  v55LoadRanking();
}

function v55RankingShiftMonth(delta){
  const now=new Date();
  const current=new Date(now.getFullYear(),now.getMonth(),1);
  const next=new Date(v55RankingMonth.getFullYear(),v55RankingMonth.getMonth()+Number(delta||0),1);
  if(next>current)return;
  v55RankingMonth=next;
  v55LoadRanking();
}

function v55RankingMonthNav(){
  if(v55RankingMode!=='monthly')return '';
  const now=new Date();
  const current=new Date(now.getFullYear(),now.getMonth(),1);
  const isCurrent=v55RankingMonth.getFullYear()===current.getFullYear()&&v55RankingMonth.getMonth()===current.getMonth();
  const label=v55RankingMonth.toLocaleDateString('pt-BR',{month:'long',year:'numeric'});
  return `<div class="v6715-month-nav" aria-label="Navegação por mês">
    <button type="button" onclick="v55RankingShiftMonth(-1)" aria-label="Mês anterior">‹</button>
    <strong>${label}</strong>
    <button type="button" onclick="v55RankingShiftMonth(1)" aria-label="Próximo mês" ${isCurrent?'disabled':''}>›</button>
  </div>`;
}

function v55RankingTabs(){
  return `<div class="v6714-ranking-tabs" role="tablist" aria-label="Período do ranking">
    <button type="button" class="${v55RankingMode==='monthly'?'active':''}" onclick="v55SetRankingMode('monthly')">MENSAL</button>
    <button type="button" class="${v55RankingMode==='annual'?'active':''}" onclick="v55SetRankingMode('annual')">ANUAL</button>
  </div>${v55RankingMonthNav()}`;
}

function v55RenderRankingRows(rows,mine){
  if(!rows.length)return '<div class="card"><p>Nenhum militar disponível para o ranking.</p></div>';
  return rows.map((r,i)=>`<div class="card v55-rank ${cloudNormalize(r.matricula)===mine?'me':''}"><div class="v55-pos">${i==0?'🥇':i==1?'🥈':i==2?'🥉':(i+1)+'º'}</div><div class="v55-person"><b>${v55Esc(r.nome)}</b><span>${v55Esc(r.graduacao||'BM')}</span></div><div class="v55-score"><b>${Number(r.treinos_validos||0)}</b><span>pontos</span></div></div>`).join('');
}

async function v55LoadAnnualRanking(year){
  const months=Array.from({length:12},(_,i)=>`${year}-${String(i+1).padStart(2,'0')}`);
  const batches=await Promise.all(months.map(p_mes=>v55RpcAll('ranking_constancia',{p_token_militar:cloudSession.token,p_mes})));
  const map=new Map();
  batches.flat().forEach(r=>{
    const key=cloudNormalize(r.matricula);
    if(!key)return;
    const cur=map.get(key)||{matricula:r.matricula,nome:r.nome,graduacao:r.graduacao,treinos_validos:0};
    cur.nome=r.nome||cur.nome;
    cur.graduacao=r.graduacao||cur.graduacao;
    cur.treinos_validos+=Number(r.treinos_validos||0);
    map.set(key,cur);
  });
  return [...map.values()].sort((a,b)=>Number(b.treinos_validos||0)-Number(a.treinos_validos||0)||String(a.nome||'').localeCompare(String(b.nome||''),'pt-BR'));
}

async function openV55Ranking(){
  showView('v55Ranking');
  try{saveNavigationState()}catch(e){}
  try{await cloudPushNow();}catch(e){console.warn('Ranking: sincronização prévia pendente',e)}
  await v55LoadRanking();
  try{saveNavigationState()}catch(e){}
}
async function v55LoadRanking(){
 const box=document.getElementById('v55RankingContent');
 box.innerHTML=`${v55RankingTabs()}<div class="card"><p>Atualizando ranking…</p></div>`;
 if(!navigator.onLine||!cloudSession?.token){box.innerHTML=`${v55RankingTabs()}<div class="card"><p>Conecte-se à internet para consultar o ranking.</p></div>`;return}
 try{
   const now=new Date();
   const isAnnual=v55RankingMode==='annual';
   const rows=isAnnual
     ? await v55LoadAnnualRanking(now.getFullYear())
     : await v55RpcAll('ranking_constancia',{p_token_militar:cloudSession.token,p_mes:v55MonthKey(v55RankingMonth)});
   const mine=cloudNormalize(cloudSession.matricula);
   const periodLabel=isAnnual
     ? `Ranking ${now.getFullYear()} • acumulado de janeiro a dezembro`
     : '';
   const explain=isAnnual
     ? '<p><b>O Ranking Anual soma os pontos obtidos nos rankings mensais do ano.</b></p><p>Em cada janela de presença validada, das <b>07h às 07h do dia seguinte</b>, o militar pode conquistar no máximo <b>1 ponto</b>, desde que conclua pelo menos um Treino de Força válido ou Cardio válido. O Core Operacional é complementar e não gera ponto.</p>'
     : '<p><b>Validação:</b> a presença confirmada na unidade usa uma janela fixa das <b>07h às 07h do dia seguinte</b>. O horário em que o QR é validado não altera o início nem o fim dessa janela.</p><p>Se o treino ocorreu antes da validação, mas dentro da mesma janela, ele também pode ser reconhecido após a confirmação da presença.</p><p><b>Treino pronto/personalizado:</b> mínimo de 3 exercícios e 6 séries.</p><p><b>Treino livre:</b> mínimo de 20 minutos e pelo menos um grupo muscular informado.</p><p><b>Cardio:</b> mínimo de 30 minutos em Esteira, Bicicleta Ergométrica ou Simulador de Remo.</p><p><b>Core Operacional:</b> continua no Histórico, Evolução e Feed, mas não gera ponto.</p><p>Treino + Cardio, dois treinos ou vários cardios dentro da mesma janela continuam valendo no máximo <b>1 ponto</b>. Atividades fora da validação ou abaixo dos critérios valem 0 ponto.</p>';
   const quickRule=isAnnual
     ? `<div class="v55-rule-main"><span>🏆</span><div><small>REGRA PRINCIPAL</small><strong>1 jornada 07h→07h = até 1 ponto</strong><p>O total anual é a soma dos pontos mensais.</p></div></div>`
     : `<div class="v55-rule-main"><span>🏆</span><div><small>REGRA PRINCIPAL</small><strong>1 jornada 07h→07h = até 1 ponto</strong><p>Frequência vale mais que acumular atividades na mesma janela.</p></div></div>
        <div class="v55-rule-grid"><div class="ok"><span>🏋️</span><b>Força</b><small>Pode pontuar</small></div><div class="ok"><span>❤️</span><b>Cardio</b><small>30+ min</small></div><div class="off"><span>🛡️</span><b>Core</b><small>Não pontua</small></div></div>`;
   box.innerHTML=`${v55RankingTabs()}<div class="v55-rank-title"><small>2ª CIA / 4º BBM</small><h2>Ranking de Frequência</h2>${periodLabel?`<p>${periodLabel}</p>`:''}</div>
   <div class="card v55-rank-explain">${quickRule}<details class="v55-rank-details"><summary>${isAnnual?'Ver regra anual completa':'Ver critérios completos'}</summary><div class="v55-rank-details-body">${explain}</div></details></div>`+
   v55RenderRankingRows(rows,mine)+
   `<p class="v55-note">${isAnnual?'O total anual é a soma dos pontos mensais do ano. Cada janela operacional validada pode gerar no máximo 1 ponto.':'O ranking considera apenas Treino de Força ou Cardio válidos com presença confirmada na unidade, com teto de 1 ponto por janela 07h→07h. Core não pontua.'} Cargas individuais não são exibidas.</p>`;
 }catch(e){console.error(e);box.innerHTML=`${v55RankingTabs()}<div class="card"><p>Não foi possível carregar o ranking agora.</p></div>`}
 saveNavigationState('v55Ranking');
}

// V66.4 — prepara a entrada atual sem criar uma tela duplicada no histórico.
window.addEventListener('load',()=>{
  setTimeout(ensureAppHistoryState,50);
});

window.addEventListener('pageshow',()=>setTimeout(ensureAppHistoryState,80));


/* ===== V67.13 — MODO DE TREINO + VALIDAÇÃO DE SERVIÇO OPERACIONAL ===== */
const SERVICE_DEVICE_KEY='t2_service_device_v6713';
const SERVICE_MODE_KEY='t2_service_activity_mode_v6713';
const SERVICE_DIRECT_KEY='t2_service_direct_entry_v6725';
const SERVICE_DIRECT_DONE_KEY='t2_service_direct_done_v6732';
// V67.31 — a entrada via QR só pode disparar o fluxo direto uma vez por abertura.
// Enquanto o usuário ainda não fez login, o QR fica no sessionStorage. Assim que a
// tela de escolha é exibida, ele é movido para memória e removido do sessionStorage;
// portanto, atualizar qualquer tela não reabre a validação.
let serviceDirectRuntimeEntry=null;
let serviceValidationStatus={valid:false,configured:false,loading:false};
let serviceActivityMode=null; // null | 'operational' | 'off'
let serviceValidationPendingChoice=false;
let serviceQrStream=null;
let serviceQrTimer=null;

/* ===== V67.25 — QR ÚNICO: ABRIR APP OU VALIDAR SERVIÇO ===== */
function serviceNormalizeQrValue(raw){
  const value=String(raw||'').trim();
  if(!value)return '';
  try{
    const u=new URL(value,location.href);
    const token=String(u.searchParams.get('qr')||u.searchParams.get('token')||'').trim();
    if(token)return token;
  }catch(e){}
  return value;
}
function serviceNavigationType(){
  try{return performance.getEntriesByType('navigation')?.[0]?.type||''}catch(e){return ''}
}
function serviceCleanDirectUrl(u){
  try{
    u=u||new URL(location.href);
    u.searchParams.delete('entrada');
    u.searchParams.delete('qr');
    u.searchParams.delete('token');
    const clean=u.pathname+(u.search?u.search:'')+(u.hash||'');
    window.history.replaceState(window.history.state||{},'',clean);
  }catch(e){}
}
function serviceMarkDirectDone(){
  try{sessionStorage.setItem(SERVICE_DIRECT_DONE_KEY,'1')}catch(e){}
}
function serviceCaptureDirectEntry(){
  try{
    const u=new URL(location.href);
    const mode=String(u.searchParams.get('entrada')||'').toLowerCase();
    const qr=String(u.searchParams.get('qr')||'').trim();
    const hasDirect=(mode==='servico'||mode==='treino'||mode==='quartel')&&qr;
    const isReload=serviceNavigationType()==='reload';
    const wasDone=sessionStorage.getItem(SERVICE_DIRECT_DONE_KEY)==='1';

    // V67.33 — se o militar já escolheu/validou e apenas atualizou a página,
    // jamais reabre o fluxo do QR, mesmo que o Android/PWA reapresente a URL original.
    if(isReload&&wasDone){
      sessionStorage.removeItem(SERVICE_DIRECT_KEY);
      serviceCleanDirectUrl(u);
      return null;
    }

    if(hasDirect){
      // Uma leitura nova do QR inicia um novo fluxo e libera a escolha novamente.
      sessionStorage.removeItem(SERVICE_DIRECT_DONE_KEY);
      const entry={qr:serviceNormalizeQrValue(qr),capturedAt:Date.now()};
      sessionStorage.setItem(SERVICE_DIRECT_KEY,JSON.stringify(entry));
      serviceCleanDirectUrl(u);
      return entry;
    }

    // Remove qualquer entrada antiga que tenha sobrado após um refresh concluído.
    if(isReload&&wasDone)sessionStorage.removeItem(SERVICE_DIRECT_KEY);
  }catch(e){}
  return null;
}
function serviceGetDirectEntry(){
  if(serviceDirectRuntimeEntry?.qr)return serviceDirectRuntimeEntry;
  try{
    const x=JSON.parse(sessionStorage.getItem(SERVICE_DIRECT_KEY)||'null');
    if(!x?.qr)return null;
    if(Date.now()-Number(x.capturedAt||0)>6*60*60*1000){sessionStorage.removeItem(SERVICE_DIRECT_KEY);return null}
    return x;
  }catch(e){return null}
}
function serviceConsumeDirectEntry(){
  const entry=serviceGetDirectEntry();
  if(!entry?.qr)return null;
  serviceDirectRuntimeEntry=entry;
  try{sessionStorage.removeItem(SERVICE_DIRECT_KEY)}catch(e){}
  return serviceDirectRuntimeEntry;
}
function serviceClearDirectEntry(){
  serviceDirectRuntimeEntry=null;
  try{sessionStorage.removeItem(SERVICE_DIRECT_KEY)}catch(e){}
}
function serviceDirectSetStatus(text,type=''){
  const el=byId('serviceDirectStatus');
  if(!el)return;
  el.textContent=text||'';
  el.className='service-direct-status '+type;
}
function serviceEnsureDirectModal(){
  let modal=byId('serviceDirectModal');
  if(modal)return modal;
  modal=document.createElement('div');
  modal.id='serviceDirectModal';
  modal.className='service-direct-modal';
  modal.setAttribute('aria-hidden','true');
  modal.innerHTML=`<div class="service-direct-sheet">
    <div class="service-direct-badge">🚒 2ª CIA / 4º BBM</div>
    <h2>QR DO APLICATIVO</h2>
    <p>Escolha como deseja acessar agora.</p>
    <button class="service-direct-btn operational" type="button" onclick="serviceDirectValidate()">
      <span>📍</span><b>VALIDAR TREINO DE HOJE</b><small>Confirmar presença na unidade e verificar pontuação</small>
    </button>
    <button class="service-direct-btn app" type="button" onclick="serviceDirectOpenApp()">
      <span>↪️</span><b>ENTRAR SEM VALIDAR</b><small>Usar o aplicativo normalmente, sem validar presença agora</small>
    </button>
    <div id="serviceDirectStatus" class="service-direct-status"></div>
    <small class="service-direct-privacy">A localização é solicitada somente quando você escolhe validar o treino de hoje.</small>
  </div>`;
  document.body.appendChild(modal);
  return modal;
}
function serviceShowDirectChoice(){
  const entry=serviceGetDirectEntry();
  if(!entry)return false;
  if(!cloudSession?.token){
    const gate=document.querySelector('#authGate .auth-panel')||document.querySelector('#authGate .auth-shell')||byId('authGate');
    if(gate&&!byId('serviceDirectLoginHint')){
      const hint=document.createElement('div');
      hint.id='serviceDirectLoginHint';
      hint.className='service-direct-login-hint';
      hint.innerHTML='<b>📱 QR do aplicativo reconhecido.</b><br>Entre com sua matrícula. Depois você poderá validar o treino de hoje ou entrar normalmente no app.';
      const panel=document.querySelector('#authGate .auth-panel');
      if(panel && gate===panel) panel.insertBefore(hint, panel.firstChild); else gate.appendChild(hint);
    }
    return false;
  }
  byId('serviceDirectLoginHint')?.remove();
  // Consome a entrada persistida antes de exibir a escolha. O QR permanece somente
  // em memória nesta abertura, suficiente para serviceDirectValidate(), mas não
  // sobrevive a um refresh da Home, Treinos, Histórico, TAF, Core etc.
  if(!serviceConsumeDirectEntry())return false;
  const modal=serviceEnsureDirectModal();
  modal.classList.add('show');
  modal.setAttribute('aria-hidden','false');
  serviceDirectSetStatus('');
  return true;
}
function serviceHideDirectChoice(){
  const modal=byId('serviceDirectModal');
  if(modal){modal.classList.remove('show');modal.setAttribute('aria-hidden','true')}
}
function serviceDirectOpenApp(){
  serviceMarkDirectDone();
  serviceClearDirectEntry();
  serviceHideDirectChoice();
  resetServiceActivityMode();
  showView('home');
}
async function serviceFinishDirectAsOperational(message){
  serviceMarkDirectDone();
  serviceClearDirectEntry();
  serviceHideDirectChoice();
  byId('serviceDirectLoginHint')?.remove();
  try{
    const u=new URL(location.href);
    serviceCleanDirectUrl(u);
    window.history.replaceState({t2App:true,snapshot:appHistorySnapshot('home')},'',location.href);
    sessionStorage.setItem(NAV_STATE_KEY,JSON.stringify({...appHistorySnapshot('home'),matricula:cloudSession?.matricula||''}));
  }catch(e){}
  setServiceActivityMode('operational');
  browserNavHandling=true;
  try{showView('home')}finally{browserNavHandling=false}
  try{window.history.replaceState({t2App:true,snapshot:appHistorySnapshot('home')},'',location.href)}catch(e){}
  saveNavigationState('home');
  if(message)alert(message);
}
async function serviceDirectValidate(){
  const entry=serviceGetDirectEntry();
  if(!entry?.qr){serviceDirectSetStatus('QR não reconhecido. Leia novamente o QR oficial do aplicativo.','error');return}
  if(!cloudSession?.token){serviceHideDirectChoice();cloudShowGate();serviceShowDirectChoice();return}
  if(!navigator.onLine){serviceDirectSetStatus('É necessário estar conectado à internet para validar o treino.','error');return}
  serviceDirectSetStatus('Verificando validação atual…','loading');
  try{
    // V67.41 — a validação pertence à jornada fixa 07h→07h e não é renovada por nova leitura do QR.
    const current=await refreshServiceValidationStatus();
    if(current?.valid===true){
      const expiry=current.expiresAt;
      await serviceFinishDirectAsOperational(`Presença na unidade já validada nesta janela. Válida até ${serviceFmtDate(expiry)}.`);
      return;
    }
    serviceDirectSetStatus('Confirmando sua localização…','loading');
    const pos=await getServicePosition();
    serviceDirectSetStatus('Validando presença na unidade…','loading');
    const row=await cloudRpc('validar_presenca_servico',{
      p_token_militar:cloudSession.token,
      p_qr_token:serviceNormalizeQrValue(entry.qr),
      p_lat:pos.coords.latitude,
      p_lon:pos.coords.longitude,
      p_accuracy:pos.coords.accuracy,
      p_device_id:serviceDeviceId()
    });
    if(row?.validado!==true)throw new Error(row?.mensagem||'Validação recusada.');
    serviceValidationStatus={...serviceValidationStatus,valid:true,configured:true,validatedAt:row.validado_em||new Date().toISOString(),expiresAt:row.expira_em||null,loading:false};
    await refreshServiceValidationStatus();
    const expiry=serviceValidationStatus.expiresAt||row.expira_em;
    await serviceFinishDirectAsOperational(`Treino de hoje validado pela presença na unidade. Validação válida até ${serviceFmtDate(expiry)}.`);
  }catch(e){
    console.error(e);
    let msg=e?.message||'Não foi possível validar. Confirme sua localização e tente novamente.';
    if(e?.code===1)msg='Permissão de localização negada. Libere a localização para validar o treino.';
    serviceDirectSetStatus(msg,'error');
  }
}
function serviceDirectAfterAuth(){setTimeout(()=>serviceShowDirectChoice(),120)}
const serviceDirectCaptured=serviceCaptureDirectEntry();
window.addEventListener('load',()=>setTimeout(()=>{
  if(serviceGetDirectEntry())serviceShowDirectChoice();
},900));

function serviceDeviceId(){
  let id=localStorage.getItem(SERVICE_DEVICE_KEY)||'';
  if(!id){
    try{id=crypto.randomUUID()}catch(e){id='dev-'+Date.now()+'-'+Math.random().toString(36).slice(2)}
    localStorage.setItem(SERVICE_DEVICE_KEY,id);
  }
  return id;
}
function serviceFmtDate(v){
  if(!v)return '';
  try{return new Date(v).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}catch(e){return String(v)}
}
// V67.41 — a jornada operacional é fixa: 07h de um dia até 07h do dia seguinte.
// A chave sempre representa a data local em que a jornada começou.
function serviceOperationalWindowKey(value=new Date()){
  const d=value instanceof Date?new Date(value.getTime()):new Date(value);
  if(Number.isNaN(d.getTime()))return null;
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Fortaleza',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).formatToParts(d);
  const get=t=>Number(parts.find(x=>x.type===t)?.value||0);
  let y=get('year'),m=get('month'),day=get('day'),h=get('hour');
  if(h<7){
    const noonUtc=new Date(Date.UTC(y,m-1,day,12,0,0));
    noonUtc.setUTCDate(noonUtc.getUTCDate()-1);
    y=noonUtc.getUTCFullYear();m=noonUtc.getUTCMonth()+1;day=noonUtc.getUTCDate();
  }
  return `${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}
function resetServiceActivityMode(){
  serviceActivityMode=null;
  serviceValidationPendingChoice=false;
  try{sessionStorage.removeItem(SERVICE_MODE_KEY);sessionStorage.removeItem(V66_SERVICE_KEY)}catch(e){}
  v66WorkoutServiceDay=null;
  coreServiceDay=null;
}
function setServiceActivityMode(mode){
  serviceActivityMode=(mode==='operational'||mode==='off')?mode:null;
  try{
    if(serviceActivityMode)sessionStorage.setItem(SERVICE_MODE_KEY,serviceActivityMode);
    else sessionStorage.removeItem(SERVICE_MODE_KEY);
  }catch(e){}
  applyServiceValidationToWorkoutState();
  renderServiceValidationCards();
}
function applyServiceValidationToWorkoutState(){
  let value=null;
  if(serviceActivityMode==='off')value=false;
  if(serviceActivityMode==='operational')value=serviceValidationStatus?.valid===true?true:null;
  v66WorkoutServiceDay=value;
  coreServiceDay=value;
  try{
    if(value===true||value===false)sessionStorage.setItem(V66_SERVICE_KEY,value?'1':'0');
    else sessionStorage.removeItem(V66_SERVICE_KEY);
  }catch(e){}
}
function chooseOffDutyTraining(){
  serviceValidationPendingChoice=false;
  setServiceActivityMode('off');
}
async function chooseOperationalService(){
  if(serviceValidationStatus?.valid===true){
    serviceValidationPendingChoice=false;
    setServiceActivityMode('operational');
    return;
  }
  serviceValidationPendingChoice=true;
  openPresenceTodayChoice();
}
function openPresenceTodayChoice(){
  const m=byId('presenceTodayModal');
  if(m){m.style.display='flex';m.setAttribute('aria-hidden','false')}
}
function closePresenceTodayChoice(){
  const m=byId('presenceTodayModal');
  if(m){m.style.display='none';m.setAttribute('aria-hidden','true')}
}
async function confirmPresenceAtUnit(){
  closePresenceTodayChoice();
  serviceValidationPendingChoice=true;
  await startServiceValidation();
}
function confirmPresenceOutsideUnit(){
  closePresenceTodayChoice();
  serviceValidationPendingChoice=false;
  setServiceActivityMode('off');
  alert('Esta atividade será registrada, mas não pontuará no Ranking.');
}
function renderServiceValidationCards(){
  applyServiceValidationToWorkoutState();
  const targets=[
    ['serviceValidationCard','serviceValidationTitle','serviceValidationText','serviceValidationOperational','serviceValidationOff','serviceValidationHint'],
    ['coreServiceValidationCard','coreServiceValidationTitle','coreServiceValidationText','coreServiceValidationOperational','coreServiceValidationOff','coreServiceValidationHint']
  ];
  for(const ids of targets){
    const [cardId,titleId,textId,opId,offId,hintId]=ids;
    const card=byId(cardId),title=byId(titleId),text=byId(textId),op=byId(opId),off=byId(offId),hint=byId(hintId);
    if(!card)continue;
    card.classList.remove('valid','invalid','pending','off-duty');
    if(op)op.classList.toggle('selected',serviceActivityMode==='operational');
    if(off)off.classList.toggle('selected',serviceActivityMode==='off');

    if(serviceValidationStatus.loading){
      card.classList.add('pending');
      if(title)title.textContent='Verificando validação…';
      if(text)text.textContent='Consultando o servidor. Você também pode continuar sem validar a presença.';
      if(hint)hint.textContent='Apenas atividades elegíveis com presença validada na unidade podem pontuar.';
      continue;
    }

    if(serviceActivityMode==='off'){
      card.classList.add('off-duty');
      if(title)title.textContent='ATIVIDADE SEM PONTUAÇÃO';
      if(text)text.textContent='Esta atividade será registrada normalmente no Histórico, Evolução e Feed, mas não pontuará no Ranking.';
      if(hint)hint.textContent='Você pode continuar normalmente. Para que uma atividade elegível possa pontuar, use a opção de validação na unidade.';
      return void 0;
    }

    if(serviceActivityMode==='operational' && serviceValidationStatus.valid){
      card.classList.add('valid');
      if(title)title.textContent='📍 PRESENÇA VALIDADA';
      if(text)text.innerHTML=`Presença na unidade confirmada. Validação válida até <b>${serviceFmtDate(serviceValidationStatus.expiresAt)}</b>.`;
      if(hint)hint.textContent='O app verifica automaticamente os critérios. Treino de Força ou Cardio elegível pode gerar 1 ponto; limite de 1 ponto na janela 07h→07h. Core não pontua.';
      continue;
    }

    if(!serviceValidationStatus.configured){
      card.classList.add('invalid');
      if(title)title.textContent='COMO VOCÊ VAI TREINAR?';
      if(text)text.textContent='A validação de presença ainda precisa ser configurada pelo administrador. Os treinos continuam disponíveis normalmente sem pontuação.';
      if(hint)hint.textContent='Escolha “Continuar sem validar” para treinar sem pontuação.';
      continue;
    }

    card.classList.add('invalid');
    if(title)title.textContent='COMO VOCÊ VAI TREINAR?';
    if(serviceValidationStatus.valid){
      if(text)text.innerHTML=`Sua presença na unidade já está validada até <b>${serviceFmtDate(serviceValidationStatus.expiresAt)}</b>. O app aplicará automaticamente essa validação ao treino.`;
      if(hint)hint.textContent='Você também pode escolher continuar sem validar este treino; nesse caso ele não pontuará.';
    }else{
      if(text)text.textContent='Se estiver na unidade, valide o treino pelo QR + localização. Isso vale tanto para quem está de serviço quanto para quem veio treinar de folga.';
      if(hint)hint.textContent='A localização é consultada somente durante a validação do treino.';
    }
  }
}
async function refreshServiceValidationStatus(){
  if(!cloudSession?.token||!navigator.onLine){serviceValidationStatus={valid:false,configured:false,loading:false};renderServiceValidationCards();return serviceValidationStatus}
  serviceValidationStatus={...serviceValidationStatus,loading:true};renderServiceValidationCards();
  try{
    const row=await cloudRpc('status_validacao_servico',{p_token_militar:cloudSession.token});
    serviceValidationStatus={
      valid:row?.valido===true,
      configured:row?.configurado===true,
      validatedAt:row?.validado_em||null,
      expiresAt:row?.expira_em||null,
      unit:row?.unidade||'2ª CIA / 4º BBM',
      loading:false
    };
  }catch(e){console.warn('status_validacao_servico:',e);serviceValidationStatus={valid:false,configured:false,loading:false,error:true}}
  renderServiceValidationCards();return serviceValidationStatus;
}
function requireServiceChoice(){
  applyServiceValidationToWorkoutState();
  if(serviceActivityMode===null){alert('Escolha primeiro: “Validar treino de hoje” ou “Continuar sem validar”.');return false}
  if(serviceActivityMode==='operational' && serviceValidationStatus?.valid!==true){alert('Para o app verificar a pontuação, valide sua presença pelo QR da unidade e localização.');return false}
  return true;
}
function requireCoreServiceChoice(){return requireServiceChoice()}
function setWorkoutServiceDay(){return false}
function setCoreServiceDay(){return false}
function updateServiceChoiceUI(){renderServiceValidationCards()}
function updateCoreServiceChoiceUI(){renderServiceValidationCards()}
function loadCoreServiceChoice(){applyServiceValidationToWorkoutState();return coreServiceDay}

const _v6711OpenWorkoutChooser=openWorkoutChooser;
openWorkoutChooser=function(){
  resetServiceActivityMode();
  _v6711OpenWorkoutChooser();
  resetServiceActivityMode();
  refreshServiceValidationStatus();
};
const _v6711OpenCoreOperational=openCoreOperational;
openCoreOperational=function(){
  resetServiceActivityMode();
  _v6711OpenCoreOperational();
  resetServiceActivityMode();
  renderCoreOperational();
  refreshServiceValidationStatus();
};
const _v6711RenderCoreOperational=renderCoreOperational;
renderCoreOperational=function(){
  _v6711RenderCoreOperational();
  renderServiceValidationCards();
};

function stopServiceQrCamera(){
  if(serviceQrTimer){clearInterval(serviceQrTimer);serviceQrTimer=null}
  if(serviceQrStream){for(const t of serviceQrStream.getTracks())t.stop();serviceQrStream=null}
  const v=byId('serviceQrVideo');if(v)v.srcObject=null;
}
function closeServiceValidationScanner(){
  stopServiceQrCamera();
  serviceValidationPendingChoice=false;
  const m=byId('serviceQrModal');if(m){m.style.display='none';m.setAttribute('aria-hidden','true')}
}
async function startServiceValidation(){
  if(!cloudSession?.token){alert('Entre com sua matrícula antes de validar o treino de hoje.');return}
  if(!navigator.onLine){alert('A validação do treino precisa de internet.');return}
  if(serviceValidationStatus?.valid===true){setServiceActivityMode('operational');return}
  const m=byId('serviceQrModal'),st=byId('serviceQrScanStatus');
  if(m){m.style.display='flex';m.setAttribute('aria-hidden','false')}
  if(st)st.textContent='Abrindo câmera…';
  stopServiceQrCamera();
  if(!('BarcodeDetector' in window)){
    if(st)st.textContent='Leitura direta de QR indisponível neste navegador. Use a opção manual abaixo.';
    return;
  }
  try{
    const detector=new BarcodeDetector({formats:['qr_code']});
    serviceQrStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
    const video=byId('serviceQrVideo');video.srcObject=serviceQrStream;await video.play();
    if(st)st.textContent='Aponte a câmera para o QR fixado na academia.';
    let busy=false;
    serviceQrTimer=setInterval(async()=>{
      if(busy||!video||video.readyState<2)return;busy=true;
      try{
        const codes=await detector.detect(video);
        const raw=String(codes?.[0]?.rawValue||'').trim();
        if(raw){clearInterval(serviceQrTimer);serviceQrTimer=null;await validateServiceQr(raw)}
      }catch(e){}
      busy=false;
    },350);
  }catch(e){console.error(e);if(st)st.textContent='Não foi possível usar a câmera. Verifique a permissão ou use a opção manual.'}
}
function getServicePosition(){
  return new Promise((resolve,reject)=>{
    if(!navigator.geolocation)return reject(new Error('Geolocalização indisponível.'));
    navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:true,timeout:20000,maximumAge:0});
  });
}
async function validateServiceQr(qr){
  const st=byId('serviceQrScanStatus');if(st)st.textContent='QR lido. Verificando validação atual…';
  try{
    const current=await refreshServiceValidationStatus();
    if(current?.valid===true){
      stopServiceQrCamera();
      const m=byId('serviceQrModal');if(m){m.style.display='none';m.setAttribute('aria-hidden','true')}
      serviceValidationPendingChoice=false;
      setServiceActivityMode('operational');
      alert(`Presença na unidade já estava validada. Validação mantida até ${serviceFmtDate(current.expiresAt)}.`);
      return;
    }
    if(st)st.textContent='QR lido. Confirmando localização…';
    const pos=await getServicePosition();
    if(st)st.textContent='Validando presença no servidor…';
    const row=await cloudRpc('validar_presenca_servico',{
      p_token_militar:cloudSession.token,p_qr_token:serviceNormalizeQrValue(qr),p_lat:pos.coords.latitude,p_lon:pos.coords.longitude,p_accuracy:pos.coords.accuracy,p_device_id:serviceDeviceId()
    });
    if(row?.validado!==true)throw new Error(row?.mensagem||'Validação recusada.');
    stopServiceQrCamera();
    const m=byId('serviceQrModal');if(m){m.style.display='none';m.setAttribute('aria-hidden','true')}
    serviceValidationStatus={...serviceValidationStatus,valid:true,configured:true,validatedAt:row.validado_em||new Date().toISOString(),expiresAt:row.expira_em||null,loading:false};
    serviceValidationPendingChoice=false;
    setServiceActivityMode('operational');
    await refreshServiceValidationStatus();
    setServiceActivityMode('operational');
    alert(`Treino de hoje validado pela presença na unidade. Validação válida até ${serviceFmtDate(serviceValidationStatus.expiresAt||row.expira_em)}.`);
  }catch(e){console.error(e);if(st)st.textContent=e?.message||'Não foi possível validar. Confirme localização, QR e conexão.'}
}
function submitManualServiceQr(){
  const v=String(byId('serviceQrManual')?.value||'').trim();
  if(!v){alert('Cole o conteúdo do QR.');return}
  validateServiceQr(v);
}

async function adminLoadServiceConfig(){
  if(!adminSessionToken)return;
  const el=byId('adminServiceConfigStatus');
  try{
    const row=await cloudRpc('admin_ler_config_validacao',{p_token:adminSessionToken});
    if(byId('adminServiceRadius')&&row?.raio_m)byId('adminServiceRadius').value=row.raio_m;
    if(byId('adminServiceHours')&&row?.validade_horas)byId('adminServiceHours').value=row.validade_horas;
    if(el)el.innerHTML=row?.configurado===true
      ? `✅ Local configurado • raio de <b>${row.raio_m} m</b> • jornada operacional fixa: <b>07h → 07h</b>.`
      : '⚠️ Local ainda não configurado. Vá fisicamente à academia e toque em “Definir local”.';
  }catch(e){if(el)el.textContent='Não foi possível consultar a configuração.'}
}
function adminServiceDateTime(value){
  if(!value)return '—';
  const d=new Date(value);
  if(Number.isNaN(d.getTime()))return '—';
  return d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
}
function adminServiceRemaining(value){
  if(!value)return '';
  const ms=new Date(value).getTime()-Date.now();
  if(!Number.isFinite(ms))return '';
  if(ms<=0)return 'Período encerrado';
  const mins=Math.ceil(ms/60000);
  const h=Math.floor(mins/60),m=mins%60;
  if(h>=24){const d=Math.floor(h/24),rh=h%24;return `${d}d ${rh}h restantes`;}
  return h>0?`${h}h ${m}min restantes`:`${m}min restantes`;
}
async function adminLoadServiceValidations(){
  if(!adminSessionToken)return;
  const box=byId('adminServiceValidations');
  if(box)box.innerHTML='<div class="admin-loading">Carregando validações…</div>';
  try{
    const res=await cloudApi('/rest/v1/rpc/admin_listar_validacoes_servico',{
      method:'POST',
      body:JSON.stringify({p_token:adminSessionToken})
    });
    const data=await res.json().catch(()=>[]);
    if(!res.ok)throw new Error(data?.message||'Falha ao listar validações');
    const rows=Array.isArray(data)?data:[];
    if(!box)return;
    if(!rows.length){
      box.innerHTML='<div class="admin-empty">Nenhuma validação de presença encontrada nos últimos 7 dias.</div>';
      return;
    }
    box.innerHTML=rows.map(v=>{
      const active=v.ativo===true;
      const nome=adminEscape(v.nome||'Militar');
      const grad=adminEscape(v.graduacao||'');
      const mat=adminEscape(v.matricula||'');
      const distance=Number.isFinite(Number(v.distancia_m))?` • ${Math.round(Number(v.distancia_m))} m do ponto`:' ';
      return `<div class="admin-service-validation-row ${active?'is-active':'is-expired'}">
        <div class="admin-service-validation-main">
          <b>${grad?grad+' ':''}${nome}</b>
          <span>Matrícula ${mat}${distance}</span>
          <span class="admin-service-validation-period">Validado: <b>${adminServiceDateTime(v.validado_em)}</b><br>Até: <b>${adminServiceDateTime(v.expira_em)}</b></span>
        </div>
        <div class="admin-service-validation-meta">
          <span class="admin-service-validation-badge ${active?'active':'expired'}">${active?'ATIVO':'ENCERRADO'}</span>
          <span class="admin-service-validation-remain">${adminEscape(adminServiceRemaining(v.expira_em))}</span>
        </div>
      </div>`;
    }).join('');
  }catch(e){
    console.error('admin_listar_validacoes_servico:',e);
    if(box)box.innerHTML='<div class="admin-empty">Não foi possível carregar as validações. Instale a atualização SQL da V67.14.</div>';
  }
}

async function adminConfigureServiceLocation(){
  if(!adminSessionToken)return;
  const radius=Math.max(30,Math.min(1000,Number(byId('adminServiceRadius')?.value||150)));
  const hours=Math.max(1,Math.min(48,Number(byId('adminServiceHours')?.value||26)));
  const el=byId('adminServiceConfigStatus');
  if(el)el.textContent='Obtendo localização precisa…';
  try{
    const pos=await getServicePosition();
    if(pos.coords.accuracy>150&&!confirm(`A precisão atual é de aproximadamente ${Math.round(pos.coords.accuracy)} m. Deseja salvar mesmo assim?`)){await adminLoadServiceConfig();return}
    const row=await cloudRpc('admin_configurar_validacao_servico',{p_token:adminSessionToken,p_lat:pos.coords.latitude,p_lon:pos.coords.longitude,p_raio_m:radius,p_validade_horas:hours});
    if(row?.salvo!==true)throw new Error('Configuração não confirmada.');
    if(el)el.textContent='✅ Localização da academia configurada com sucesso.';
    await adminLoadServiceConfig();
  }catch(e){console.error(e);if(el)el.textContent='❌ Não foi possível configurar. Libere a localização e tente novamente.'}
}

const _v6711OpenAdmin=openAdmin;
openAdmin=function(){_v6711OpenAdmin();if(adminSessionToken)setTimeout(()=>{adminLoadServiceConfig();adminLoadServiceValidations();},50)};
const _v6711AdminLoadMilitares=adminLoadMilitares;
adminLoadMilitares=async function(){const r=await _v6711AdminLoadMilitares();if(adminSessionToken){adminLoadServiceConfig();adminLoadServiceValidations();}return r};

window.addEventListener('online',()=>refreshServiceValidationStatus());
try{localStorage.setItem('t2_app_version','v67.55.0')}catch(e){}

/* ===== V67.21 — RANKING OFICIAL TAF ===== */
let officialTafState={edition:null,editions:[],rows:[],scope:'all',exercise:'pushup',view:'exercise',generalCount:3,generalRows:[],generalLoadedFor:null,generalLoading:false};
const OFFICIAL_TAF_EXERCISES={bar:'Barras',pushup:'Flexões',abs:'Abdominais',run:'Corrida',swim:'Natação'};
function otEsc(v){return String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]))}
function otSec(v){if(v==null||v==='')return null;if(typeof v==='number')return v;const m=String(v).match(/(\d+)\D+(\d+)/);return m?Number(m[1])*60+Number(m[2]):Number(v)||null}
function otTime(sec){sec=Number(sec);if(!Number.isFinite(sec))return '—';return `${Math.floor(sec/60)}:${String(Math.round(sec%60)).padStart(2,'0')}`}
function otNormalizeTimeInput(el){
  if(!el)return;
  let v=String(el.value||'').trim();
  if(!v)return;
  // Aceita 655 -> 6:55, 1255 -> 12:55, além de 6:55 / 6.55 / 6,55.
  if(/^\d{3,4}$/.test(v)){
    const mins=v.slice(0,-2);
    const secs=v.slice(-2);
    v=`${Number(mins)}:${secs}`;
  }
  const sec=otSec(v);
  if(sec!=null && Number.isFinite(Number(sec))) el.value=otTime(sec);
}
function otValue(r,k){
  if(k==='run')return otSec(r.run_seconds ?? r.run);
  if(k==='swim')return otSec(r.swim_seconds ?? r.swim);
  const n=Number(r[k]);return Number.isFinite(n)&&r[k]!==null&&r[k]!==''?n:null;
}
function otValueLabel(r,k){const v=otValue(r,k);if(v==null)return '—';return (k==='run'||k==='swim')?otTime(v):String(v)}
function otEligible(r,k){return otValue(r,k)!=null}
function otScopeRows(rows,scope){return scope==='38plus'?rows.filter(r=>r.faixa_etaria==='38+') : scope==='upto37'?rows.filter(r=>r.faixa_etaria==='ATE37') : rows}
function otRankExercise(rows,k){return rows.filter(r=>otEligible(r,k)).sort((a,b)=>{const av=otValue(a,k),bv=otValue(b,k);return (k==='run'||k==='swim'?av-bv:bv-av)||String(a.nome).localeCompare(String(b.nome),'pt-BR')})}
function otCompetitionRanks(rows,k){let last=null,rank=0;return otRankExercise(rows,k).map((r,i)=>{const v=otValue(r,k);if(last===null||v!==last)rank=i+1;last=v;return {r,rank,value:v}})}
function otScopeTabs(){return `<div class="ot-seg"><button class="${officialTafState.scope==='all'?'active':''}" onclick="officialTafSetScope('all')">GERAL</button><button class="${officialTafState.scope==='upto37'?'active':''}" onclick="officialTafSetScope('upto37')">ATÉ 37</button><button class="${officialTafState.scope==='38plus'?'active':''}" onclick="officialTafSetScope('38plus')">38+</button></div>`}
function otExerciseTabs(){return `<div class="ot-exercises">${Object.entries(OFFICIAL_TAF_EXERCISES).map(([k,n])=>`<button class="${officialTafState.exercise===k?'active':''}" onclick="officialTafSetExercise('${k}')">${n}</button>`).join('')}</div>`}
function officialTafSetScope(v){officialTafState.scope=v;saveNavigationState('officialTafRanking');renderOfficialTafRanking()}
function officialTafSetExercise(v){officialTafState.exercise=v;saveNavigationState('officialTafRanking');renderOfficialTafRanking()}
function officialTafSetEdition(v){officialTafState.edition=v;officialTafState.generalLoadedFor=null;officialTafState.generalRows=[];saveNavigationState('officialTafRanking');officialTafLoadRows()}
async function openOfficialTafRanking(){showView('officialTafRanking');const box=byId('officialTafRankingContent');if(box)box.innerHTML='<div class="card"><p>Carregando ranking oficial…</p></div>';try{const ed=await v55RpcAll('taf_oficial_listar_edicoes',{p_token_militar:cloudSession.token});officialTafState.editions=ed;officialTafState.edition=(officialTafState.edition&&ed.some(x=>x.codigo===officialTafState.edition))?officialTafState.edition:(ed[0]?.codigo||null);await officialTafLoadRows()}catch(e){console.error(e);if(box)box.innerHTML='<div class="card"><p>Não foi possível carregar o Ranking Oficial TAF.</p></div>'}}
async function officialTafLoadRows(){if(!officialTafState.edition)return renderOfficialTafRanking();try{officialTafState.rows=await v55RpcAll('taf_oficial_listar_resultados',{p_token_militar:cloudSession.token,p_edicao:officialTafState.edition});renderOfficialTafRanking()}catch(e){console.error(e);const box=byId('officialTafRankingContent');if(box)box.innerHTML='<div class="card"><p>Não foi possível carregar os índices desta edição.</p></div>'}}

/* ===== V67.55 — RANKING GERAL TAF OFICIAL VIA BANCO (3 / 4 / 5 PROVAS) ===== */
function otGeneralScoreFor(r,k){
  // A pontuação oficial depende da idade exata. O backend pode devolver `idade` ou
  // pontos já calculados (`*_points`). Não inventamos pontuação quando faltam ambos.
  const direct=Number(r?.[k+'_points'] ?? r?.[k+'_pts']);
  if(Number.isFinite(direct))return direct;
  const age=Number(r?.idade ?? r?.age);
  if(!Number.isFinite(age)||age<18)return null;
  const v=otValue(r,k); if(v==null)return null;
  if(k==='run')return tafRunScore(age,v);
  if(k==='swim')return tafSwimScore(age,v);
  return tafRepScore(k==='pushup'?'pushup':k==='bar'?'bar':'abs',age,v);
}
function otGeneralCandidate(r,count){
  const base=['run','abs'];
  if(count===3){
    const pp=otGeneralScoreFor(r,'pushup'),bp=otGeneralScoreFor(r,'bar');
    if(otGeneralScoreFor(r,'run')==null||otGeneralScoreFor(r,'abs')==null||(pp==null&&bp==null))return null;
    let strength='pushup';
    if(bp!=null&&(pp==null||bp>pp))strength='bar';
    else if(bp!=null&&pp!=null&&bp===pp){
      // Mesma nota: preserva a melhor execução relativa ao próprio teste apenas para escolha interna.
      strength=(otValue(r,'bar')??-1)>(otValue(r,'pushup')??-1)?'bar':'pushup';
    }
    const tests=[...base,strength];
    const points=tests.map(k=>otGeneralScoreFor(r,k));
    if(points.some(x=>x==null))return null;
    return {r,count,tests,points,total:points.reduce((a,b)=>a+b,0)};
  }
  const tests=count===4?['run','abs','pushup','bar']:['run','abs','pushup','bar','swim'];
  const points=tests.map(k=>otGeneralScoreFor(r,k));
  if(points.some(x=>x==null))return null;
  return {r,count,tests,points,total:points.reduce((a,b)=>a+b,0)};
}
function otGeneralTieCompare(a,b){
  if(b.total!==a.total)return b.total-a.total;
  // Desempate determinístico pelos índices brutos das provas que compõem o ranking.
  // Corrida/Natação: menor tempo. Barra/Abdominal/Flexão: mais repetições.
  const order=['run','swim','bar','abs','pushup'];
  for(const k of order){
    if(!a.tests.includes(k)||!b.tests.includes(k))continue;
    const av=otValue(a.r,k),bv=otValue(b.r,k);
    if(av==null||bv==null||av===bv)continue;
    return (k==='run'||k==='swim')?av-bv:bv-av;
  }
  return String(a.r.nome||'').localeCompare(String(b.r.nome||''),'pt-BR');
}
function otGeneralRanks(rows,count){
  const arr=rows.map(r=>otGeneralCandidate(r,count)).filter(Boolean).sort(otGeneralTieCompare);
  let rank=0,lastKey=null;
  return arr.map((x,i)=>{
    // Só divide colocação quando soma e todos os índices brutos comparáveis forem idênticos.
    const key=[x.total,...x.tests.map(k=>otValue(x.r,k))].join('|');
    if(key!==lastKey)rank=i+1; lastKey=key;
    return {...x,rank};
  });
}
function otGeneralTabs(){return `<div class="ot-general-tabs"><button class="${officialTafState.generalCount===3?'active':''}" onclick="officialTafSetGeneralCount(3)">3 PROVAS</button><button class="${officialTafState.generalCount===4?'active':''}" onclick="officialTafSetGeneralCount(4)">4 PROVAS</button><button class="${officialTafState.generalCount===5?'active':''}" onclick="officialTafSetGeneralCount(5)">5 PROVAS</button></div>`}
async function officialTafLoadGeneral(force=false){
  const count=Number(officialTafState.generalCount)||3;
  const key=`${officialTafState.edition||''}:${count}`;
  if(!force && officialTafState.generalLoadedFor===key)return renderOfficialTafRanking();
  officialTafState.generalLoading=true;renderOfficialTafRanking();
  try{
    officialTafState.generalRows=await v55RpcAll('taf_ranking_geral_2cia',{p_token_militar:cloudSession.token,p_edicao:officialTafState.edition,p_quantidade_provas:count});
    officialTafState.generalLoadedFor=key;
  }catch(e){console.error(e);officialTafState.generalRows=[];officialTafState.generalLoadedFor='erro:'+key;}
  finally{officialTafState.generalLoading=false;renderOfficialTafRanking()}
}
function officialTafSetGeneralCount(n){officialTafState.generalCount=Number(n)||3;officialTafState.generalLoadedFor=null;officialTafLoadGeneral()}
function officialTafSetView(v){officialTafState.view=v==='general'?'general':'exercise';if(officialTafState.view==='general')officialTafLoadGeneral();else renderOfficialTafRanking()}
function otOfficialGeneralScopeRows(rows,scope){
  if(scope==='upto37')return rows.filter(r=>['18-22','23-27','28-32','33-37'].includes(r.faixa));
  if(scope==='38plus')return rows.filter(r=>['38-42','43-47','48-52','53-56','57-60'].includes(r.faixa));
  return rows;
}
function otOfficialGeneralCard(r,count){
  const medal=Number(r.posicao)<=3?['🥇','🥈','🥉'][Number(r.posicao)-1]:`${r.posicao}º`;
  const tests=[];
  tests.push(`🔥 Abdominal: <b>${r.abdominais??'—'}</b> • ${r.nota_abdominal??'—'} pts`);
  tests.push(`🏃 Corrida: <b>${r.corrida_segundos!=null?otTime(r.corrida_segundos):'—'}</b> • ${r.nota_corrida??'—'} pts`);
  if(count===3){const isFlex=String(r.terceira_prova||'').toUpperCase()==='FLEXAO';tests.push(`${isFlex?'🤸 Flexão':'💪 Barra'}: <b>${isFlex?(r.flexoes??'—'):(r.barras??'—')}</b> • ${r.nota_terceira_prova??'—'} pts`)}
  if(count>=4){tests.push(`💪 Barra: <b>${r.barras??'—'}</b> • ${r.nota_barra??'—'} pts`);tests.push(`🤸 Flexão: <b>${r.flexoes??'—'}</b> • ${r.nota_flexao??'—'} pts`)}
  if(count===5)tests.push(`🏊 Natação: <b>${r.natacao_segundos!=null?otTime(r.natacao_segundos):'—'}</b> • ${r.nota_natacao??'—'} pts`);
  return `<div class="card ot-rank ot-general-rank"><div class="ot-pos">${medal}</div><div class="ot-person"><b>${otEsc(r.nome)}</b><span>${otEsc(r.faixa||'')}</span><div class="ot-general-tests">${tests.map(x=>`<small>${x}</small>`).join('')}</div></div><div class="ot-index"><b>${r.total}/${count*10}</b><span>pontos</span></div></div>`;
}
function otGeneralRule(count){
  if(count===3)return 'Corrida + Abdominal + Flexão ou Barra (vale a opção com maior pontuação). Quem completou 4 ou 5 provas também participa.';
  if(count===4)return 'Corrida + Abdominal + Flexão + Barra. Quem completou 5 provas também participa.';
  return 'Corrida + Abdominal + Flexão + Barra + Natação. Participam apenas militares com as cinco provas.';
}
function otGeneralCard(x){
  const labels={run:'🏃 Corrida',swim:'🏊 Natação',bar:'💪 Barra',abs:'🔥 Abdominal',pushup:'🤸 Flexão'};
  const max=x.count*10;
  return `<div class="card ot-rank ot-general-rank"><div class="ot-pos">${x.rank<=3?['🥇','🥈','🥉'][x.rank-1]:x.rank+'º'}</div><div class="ot-person"><b>${otEsc(x.r.nome)}</b><span>${otEsc(x.r.graduacao||'BM')}</span><div class="ot-general-tests">${x.tests.map((k,i)=>`<small>${labels[k]}: <b>${otValueLabel(x.r,k)}</b> • ${x.points[i]} pts</small>`).join('')}</div></div><div class="ot-index"><b>${x.total}/${max}</b><span>pontos</span></div></div>`;
}

function renderOfficialTafRanking(){
 const box=byId('officialTafRankingContent');if(!box)return;const ed=officialTafState.editions.find(x=>x.codigo===officialTafState.edition);const rows=otScopeRows(officialTafState.rows.filter(r=>r.participou!==false),officialTafState.scope);
 const editionSelect=officialTafState.editions.map(e=>`<option value="${otEsc(e.codigo)}" ${e.codigo===officialTafState.edition?'selected':''}>${otEsc(e.titulo||e.codigo)}</option>`).join('');
 const modeTabs=`<div class="ot-mode-tabs"><button class="${officialTafState.view==='exercise'?'active':''}" onclick="officialTafSetView('exercise')">POR PROVA</button><button class="${officialTafState.view==='general'?'active':''}" onclick="officialTafSetView('general')">🏆 GERAL TAF</button></div>`;
 let content='';
 if(officialTafState.view==='general'){
   const count=officialTafState.generalCount||3;
   const ranked=otOfficialGeneralScopeRows(officialTafState.generalRows||[],officialTafState.scope);
   const status=officialTafState.generalLoading?`<div class="card"><p>Carregando classificação oficial…</p></div>`:(officialTafState.generalLoadedFor&&String(officialTafState.generalLoadedFor).startsWith('erro:')?`<div class="card"><p>Não foi possível carregar o Ranking Geral. Verifique se a função <b>taf_ranking_geral_2cia</b> foi instalada no Supabase.</p></div>`:(ranked.length?ranked.map(r=>otOfficialGeneralCard(r,count)).join(''):`<div class="card"><p>Nenhum militar classificado nesta seleção.</p></div>`));
   content=otGeneralTabs()+`<div class="card ot-rule"><b>Ranking Geral — ${count} provas</b><p>${otGeneralRule(count)} A classificação e os desempates são calculados oficialmente no banco de dados.</p></div>`+status;
 }else{
   const k=officialTafState.exercise;const ranked=otCompetitionRanks(rows,k);
   content=`<div class="card ot-rule"><b>Como funciona o ranking?</b><p>Mais repetições classificam melhor em Barras, Flexões e Abdominais. Na Corrida e na Natação, o menor tempo fica à frente. Campo sem índice não é tratado como zero.</p></div>`+otExerciseTabs()+(ranked.length?ranked.map(x=>`<div class="card ot-rank"><div class="ot-pos">${x.rank<=3?['🥇','🥈','🥉'][x.rank-1]:x.rank+'º'}</div><div class="ot-person"><b>${otEsc(x.r.nome)}</b><span>${otEsc(x.r.graduacao||'BM')} • ${x.r.faixa_etaria==='38+'?'38+':'Até 37'}</span></div><div class="ot-index"><b>${otValueLabel(x.r,k)}</b><span>${k==='run'||k==='swim'?'tempo':'repetições'}</span></div></div>`).join(''):`<div class="card"><p>Nenhum índice registrado para este exercício nesta seleção.</p></div>`);
 }
 box.innerHTML=`<div class="ot-hero"><span class="eyebrow">2ª CIA / 4º BBM • RESULTADO OFICIAL</span><h2>🏆 Ranking Oficial TAF</h2><p>Classificação pelos índices oficiais da edição selecionada.</p><label>Edição<select onchange="officialTafSetEdition(this.value)">${editionSelect}</select></label></div>${modeTabs}${otScopeTabs()}${content}<p class="v55-note">${ed?.observacao?otEsc(ed.observacao):'Dados oficiais alimentados pela Administração da unidade.'}</p>`;
}

/* Administração do TAF oficial — carregamento otimizado V67.21 */
const officialTafAdminCache={editions:[],rows:new Map()};
function officialTafAdminSetImmediateEdition(){
  const sel=byId('officialTafAdminEdition');
  if(!sel)return '2026.1';
  if(!sel.options.length){sel.innerHTML='<option value="2026.1">TAF 2026.1</option>';sel.value='2026.1'}
  return sel.value||'2026.1';
}
async function officialTafAdminLoad(){
  if(!adminSessionToken){
    const box=byId('officialTafAdminList');
    if(box)box.innerHTML='<div class="admin-empty">Sessão administrativa não encontrada. Entre novamente no Admin.</div>';
    return;
  }
  const sel=byId('officialTafAdminEdition'),box=byId('officialTafAdminList');
  const initialCode=officialTafAdminSetImmediateEdition();
  if(officialTafAdminCache.rows.has(initialCode))officialTafAdminRender(officialTafAdminCache.rows.get(initialCode));
  else if(box)box.innerHTML='<div class="admin-loading">Carregando índices oficiais…</div>';

  try{
    // V67.22: dispara as duas consultas juntas, mas mostra as edições assim que a
    // consulta pequena terminar. A lista não fica mais esperando todos os índices.
    const editionsPromise=v55RpcAll('admin_taf_oficial_listar_edicoes',{p_token:adminSessionToken});
    const initialRowsPromise=v55RpcAll('admin_taf_oficial_listar_resultados',{p_token:adminSessionToken,p_edicao:initialCode});

    const ed=await editionsPromise;
    officialTafAdminCache.editions=ed;

    let code=initialCode;
    if(sel){
      const keep=sel.value||initialCode;
      sel.innerHTML=ed.map(e=>`<option value="${otEsc(e.codigo)}">${otEsc(e.titulo||e.codigo)}</option>`).join('');
      code=ed.some(e=>e.codigo===keep)?keep:(ed[0]?.codigo||'');
      if(code)sel.value=code;
    }

    if(!code){
      if(box)box.innerHTML='<div class="admin-empty">Nenhuma edição cadastrada.</div>';
      return;
    }

    if(code===initialCode){
      const initialRows=await initialRowsPromise;
      officialTafAdminCache.rows.set(initialCode,initialRows);
      officialTafAdminRender(initialRows);
      return;
    }

    // A consulta inicial pode terminar em segundo plano; guarda no cache sem bloquear a edição escolhida.
    initialRowsPromise.then(rows=>officialTafAdminCache.rows.set(initialCode,rows)).catch(()=>{});

    if(officialTafAdminCache.rows.has(code)){
      officialTafAdminRender(officialTafAdminCache.rows.get(code));
      return;
    }

    if(box)box.innerHTML='<div class="admin-loading">Carregando índices oficiais…</div>';
    const rows=await v55RpcAll('admin_taf_oficial_listar_resultados',{p_token:adminSessionToken,p_edicao:code});
    officialTafAdminCache.rows.set(code,rows);
    officialTafAdminRender(rows);
  }catch(e){
    console.error(e);
    if(box)box.innerHTML='<div class="admin-empty">Não foi possível carregar o TAF oficial. Toque em ATUALIZAR ou reabra a Administração.</div>';
  }
}
function officialTafAdminRender(rows){const box=byId('officialTafAdminList');if(!box)return;box.innerHTML=rows.map(r=>`<div class="ot-admin-row" data-id="${r.id}"><div class="ot-admin-name"><b>${otEsc(r.nome)}</b><small>${otEsc(r.graduacao||'BM')}</small></div><div class="ot-admin-grid"><label>Faixa<select class="ot-age"><option value="ATE37" ${r.faixa_etaria==='ATE37'?'selected':''}>Até 37</option><option value="38+" ${r.faixa_etaria==='38+'?'selected':''}>38+</option></select></label><label>Barras<input class="ot-bar" type="number" min="0" value="${r.bar??''}"></label><label>Flexões<input class="ot-push" type="number" min="0" value="${r.pushup??''}"></label><label>Abd.<input class="ot-abs" type="number" min="0" value="${r.abs??''}"></label><label>Corrida<input class="ot-run" type="text" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="6:55" onblur="otNormalizeTimeInput(this)" value="${r.run_seconds!=null?otTime(r.run_seconds):''}"></label><label>Natação<input class="ot-swim" type="text" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="1:29" onblur="otNormalizeTimeInput(this)" value="${r.swim_seconds!=null?otTime(r.swim_seconds):''}"></label></div><div class="ot-admin-actions"><label><input class="ot-part" type="checkbox" ${r.participou!==false?'checked':''}> Participou</label><button onclick="officialTafAdminSave(${r.id})">SALVAR</button></div></div>`).join('')}
async function officialTafAdminSave(id){const row=document.querySelector(`.ot-admin-row[data-id="${id}"]`);if(!row)return;const val=(q)=>row.querySelector(q)?.value??'';try{await cloudRpc('admin_taf_oficial_salvar_resultado',{p_token:adminSessionToken,p_id:id,p_faixa_etaria:val('.ot-age'),p_bar:val('.ot-bar')===''?null:Number(val('.ot-bar')),p_pushup:val('.ot-push')===''?null:Number(val('.ot-push')),p_abs:val('.ot-abs')===''?null:Number(val('.ot-abs')),p_run_seconds:otSec(val('.ot-run')),p_swim_seconds:otSec(val('.ot-swim')),p_participou:row.querySelector('.ot-part').checked});officialTafAdminCache.rows.clear();adminMsg('Índice oficial salvo.','success')}catch(e){console.error(e);adminMsg('Não foi possível salvar o índice.','error')}}
async function officialTafAdminDeleteEdition(){
  if(!adminSessionToken)return;
  const sel=byId('officialTafAdminEdition');
  const code=String(sel?.value||'').trim();
  if(!code){adminMsg('Selecione uma edição para excluir.','error');return}
  const title=sel?.selectedOptions?.[0]?.textContent||code;
  if(!confirm(`Excluir definitivamente a edição ${title} e todos os índices vinculados a ela?\n\nEsta ação não pode ser desfeita.`))return;
  try{
    adminMsg('Excluindo edição…','');
    const row=await cloudRpc('admin_taf_oficial_excluir_edicao',{p_token:adminSessionToken,p_codigo:code});
    if(row?.excluido!==true){adminMsg('A edição não foi excluída.','error');return}
    officialTafAdminCache.editions=officialTafAdminCache.editions.filter(e=>e.codigo!==code);
    officialTafAdminCache.rows.delete(code);
    if(sel)Array.from(sel.options).find(o=>o.value===code)?.remove();
    const next=sel?.value||officialTafAdminCache.editions[0]?.codigo||'';
    if(sel&&next)sel.value=next;
    const box=byId('officialTafAdminList');
    if(!next){if(box)box.innerHTML='<div class="admin-empty">Nenhuma edição cadastrada.</div>';}
    else{
      if(box)box.innerHTML='<div class="admin-loading">Carregando edição…</div>';
      const rows=await v55RpcAll('admin_taf_oficial_listar_resultados',{p_token:adminSessionToken,p_edicao:next});
      officialTafAdminCache.rows.set(next,rows);officialTafAdminRender(rows);
    }
    adminMsg('Edição excluída com sucesso.','success');
  }catch(e){console.error(e);adminMsg('Não foi possível excluir a edição. Verifique se o SQL da V67.22 foi instalado.','error')}
}
async function officialTafAdminNewEdition(){const codeRaw=prompt('Código da nova edição (ex.: 2026.2):');if(!codeRaw)return;const code=codeRaw.trim();const title=(prompt('Título da edição:',`TAF ${code}`)||`TAF ${code}`).trim();try{adminMsg('Criando nova edição…','');await cloudRpc('admin_taf_oficial_criar_edicao',{p_token:adminSessionToken,p_codigo:code,p_titulo:title});const sel=byId('officialTafAdminEdition');if(sel&&!Array.from(sel.options).some(o=>o.value===code)){sel.insertAdjacentHTML('afterbegin',`<option value="${otEsc(code)}">${otEsc(title)}</option>`)}if(sel)sel.value=code;const box=byId('officialTafAdminList');if(box)box.innerHTML='<div class="admin-loading">Preparando nova edição…</div>';const rows=await v55RpcAll('admin_taf_oficial_listar_resultados',{p_token:adminSessionToken,p_edicao:code});officialTafAdminCache.rows.set(code,rows);officialTafAdminRender(rows);adminMsg('Nova edição criada com a tropa cadastrada.','success')}catch(e){console.error(e);adminMsg('Não foi possível criar a edição.','error')}}
const _v6721OpenAdmin=openAdmin;openAdmin=function(){_v6721OpenAdmin();if(adminSessionToken){officialTafAdminSetImmediateEdition();setTimeout(officialTafAdminLoad,20)}};

try{localStorage.setItem('t2_app_version','v67.55.0')}catch(e){}


/* ===== V67.57.0 — PERFIL ESPORTIVO DO MILITAR ===== */
let v6757ProfileActivities=[];
let v6757ProfileFilter='all';
function v6757OpenProfileByFeedId(feedId){
  const row=(Array.isArray(v6753FeedRows)?v6753FeedRows:[]).find(x=>Number(x?.id)===Number(feedId));
  const matricula=String(row?.matricula||'').trim();
  if(!matricula){alert('Não foi possível identificar este perfil agora. Atualize o Feed e tente novamente.');return}
  v6757OpenSportsProfile(matricula);
}
function v6757CloseSportsProfile(){
  const modal=byId('v6757SportsProfileModal');
  if(modal){modal.classList.remove('show');modal.setAttribute('aria-hidden','true')}
  document.body.classList.remove('v6757-profile-open');
}
function v6757ProfilePhoto(v){return v67381SafeProfilePhoto(v)}
function v6757FmtMinutes(n){
  const m=Math.max(0,Number(n)||0),h=Math.floor(m/60),r=m%60;
  return h?`${h}h${r?` ${r}min`:''}`:`${r} min`;
}
function v6757ActivityKind(a){
  const plan=String(a?.plano||'').toLowerCase(),cat=String(a?.categoria||'').toLowerCase(),wt=String(a?.workout_type||'').toLowerCase();
  if(plan.includes('natação')||plan.includes('natacao')||wt==='swim')return 'natacao';
  if(plan.includes('corrida')||wt==='run')return 'corrida';
  if(cat==='core'||wt==='core')return 'core';
  if(cat==='treino'||wt==='structured'||wt==='free')return 'musculacao';
  return 'cardio';
}
function v6757KindMeta(kind){
  return {musculacao:['🏋️','Musculação'],cardio:['❤️','Cardio'],core:['🛡️','Core'],corrida:['🏃','Corrida'],natacao:['🏊','Natação']}[kind]||['⚡','Atividade'];
}
function v6757RenderActivities(){
  const box=byId('v6757ProfileRecent');if(!box)return;
  const list=v6757ProfileActivities.filter(a=>v6757ProfileFilter==='all'||v6757ActivityKind(a)===v6757ProfileFilter);
  if(!list.length){box.innerHTML='<div class="v6757-empty">Nenhuma atividade nesta modalidade.</div>';return}
  box.innerHTML=list.map(a=>{
    const kind=v6757ActivityKind(a),meta=v6757KindMeta(kind),stats=[];
    if(Number(a.duracao)>0)stats.push(`${Number(a.duracao)} min`);
    if(kind==='musculacao'&&Number(a.exercicios)>0)stats.push(`${Number(a.exercicios)} exercícios`);
    if(kind==='musculacao'&&Number(a.series)>0)stats.push(`${Number(a.series)} séries`);
    if(Number(a.distancia_km)>0)stats.push(kind==='natacao'?`${Math.round(Number(a.distancia_km)*1000)} m`:`${Number(a.distancia_km).toLocaleString('pt-BR',{maximumFractionDigits:2})} km`);
    const dt=new Date(a.data_atividade);const when=Number.isFinite(dt.getTime())?dt.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}):'';
    const status=a.status_texto?`<div class="v6757-activity-status">“${v6738FeedEsc(a.status_texto)}”</div>`:'';
    return `<div class="v6757-activity"><div class="v6757-activity-icon">${meta[0]}</div><div><b>${v6738FeedEsc(a.plano||meta[1])}</b><span>${v6738FeedEsc(when)}</span>${status}<div class="v6757-activity-stats">${stats.map(x=>`<small>${v6738FeedEsc(x)}</small>`).join('')}</div></div></div>`;
  }).join('');
}
function v6757SetProfileFilter(filter,btn){
  v6757ProfileFilter=filter||'all';
  document.querySelectorAll('#v6757ProfileFilters button').forEach(b=>b.classList.toggle('active',b===btn));
  v6757RenderActivities();
}
async function v6757OpenSportsProfile(matricula){
  const modal=byId('v6757SportsProfileModal'),content=byId('v6757SportsProfileContent');
  if(!modal||!content)return;
  if(!cloudSession?.token){alert('Entre com sua matrícula para visualizar perfis esportivos.');return}
  if(!navigator.onLine){alert('Conecte-se à internet para visualizar o Perfil Esportivo.');return}
  modal.classList.add('show');modal.setAttribute('aria-hidden','false');document.body.classList.add('v6757-profile-open');
  content.innerHTML='<div class="v6757-loading">Carregando Perfil Esportivo…</div>';
  try{
    const [summaryRows,activities]=await Promise.all([
      v55RpcAll('perfil_esportivo_resumo_v6757',{p_token_militar:cloudSession.token,p_matricula_perfil:String(matricula)}),
      v55RpcAll('perfil_esportivo_atividades_v6757',{p_token_militar:cloudSession.token,p_matricula_perfil:String(matricula),p_limite:50})
    ]);
    const s=summaryRows?.[0];if(!s)throw new Error('Perfil não encontrado');
    v6757ProfileActivities=Array.isArray(activities)?activities:[];v6757ProfileFilter='all';
    const photo=v6757ProfilePhoto(s.foto_perfil),avatar=photo?`<div class="v6757-profile-avatar has-photo"><img src="${v6738FeedEsc(photo)}" alt="Foto de ${v6738FeedEsc(s.nome||'militar')}"></div>`:`<div class="v6757-profile-avatar">${v6738FeedInitials(s.nome)}</div>`;
    const distRun=Number(s.distancia_corrida_km)||0,distSwim=Number(s.distancia_natacao_m)||0;
    content.innerHTML=`
      <section class="v6757-profile-hero">${avatar}<div><small>PERFIL ESPORTIVO</small><h2>${v6738FeedEsc(s.graduacao||'BM')} ${v6738FeedEsc(s.nome||'Militar')}</h2><span>Atividades físicas registradas no app</span></div></section>
      <section class="v6757-summary-grid"><div><b>${Number(s.atividades_total)||0}</b><span>atividades</span></div><div><b>${Number(s.atividades_mes)||0}</b><span>neste mês</span></div><div><b>${v6738FeedEsc(v6757FmtMinutes(s.minutos_total))}</b><span>tempo total</span></div></section>
      <section class="v6757-section"><h3>Modalidades</h3><div class="v6757-modalities"><div><span>🏋️</span><b>${Number(s.musculacao)||0}</b><small>Musculação</small></div><div><span>❤️</span><b>${Number(s.cardio)||0}</b><small>Cardio</small></div><div><span>🛡️</span><b>${Number(s.core)||0}</b><small>Core</small></div><div><span>🏃</span><b>${Number(s.corrida)||0}</b><small>Corrida</small></div><div><span>🏊</span><b>${Number(s.natacao)||0}</b><small>Natação</small></div></div></section>
      ${(distRun>0||distSwim>0)?`<section class="v6757-section"><h3>Distâncias acumuladas</h3><div class="v6757-distance">${distRun>0?`<div>🏃 <b>${distRun.toLocaleString('pt-BR',{maximumFractionDigits:2})} km</b><span>Corrida</span></div>`:''}${distSwim>0?`<div>🏊 <b>${Math.round(distSwim).toLocaleString('pt-BR')} m</b><span>Natação</span></div>`:''}</div></section>`:''}
      <section class="v6757-section"><h3>Atividades realizadas</h3><div id="v6757ProfileFilters" class="v6757-filters"><button class="active" onclick="v6757SetProfileFilter('all',this)">Tudo</button><button onclick="v6757SetProfileFilter('musculacao',this)">Musculação</button><button onclick="v6757SetProfileFilter('cardio',this)">Cardio</button><button onclick="v6757SetProfileFilter('core',this)">Core</button><button onclick="v6757SetProfileFilter('corrida',this)">Corrida</button><button onclick="v6757SetProfileFilter('natacao',this)">Natação</button></div><div id="v6757ProfileRecent" class="v6757-recent"></div></section>`;
    v6757RenderActivities();
  }catch(e){
    console.warn('Falha ao abrir Perfil Esportivo:',e);
    content.innerHTML=`<div class="v6757-error">Não foi possível carregar este Perfil Esportivo agora.<small>${v6738FeedEsc(e?.message||'Tente novamente.')}</small></div>`;
  }
}


/* ===== V67.59.7 — DEEP LINK ROBUSTO + LISTA DE APOIOS ===== */
let v67597FeedTargetRunning=false;
let v67597BootFeedId=0;

// Captura ?feed no momento em que o JS é interpretado, antes que qualquer roteamento interno
// possa limpar a URL. O parâmetro é removido imediatamente para nunca reaparecer no refresh.
try{
  const u=new URL(location.href);
  v67597BootFeedId=Number(u.searchParams.get('feed')||0)||0;
  if(u.searchParams.has('feed')){
    u.searchParams.delete('feed');
    history.replaceState(history.state,'',u.pathname+u.search+u.hash);
  }
}catch(e){}

async function v67597OpenFeedTarget(feedId){
  const id=Number(feedId)||0;
  if(id<=0||v67597FeedTargetRunning||!cloudSession?.token)return false;
  v67597FeedTargetRunning=true;
  try{
    if(typeof showView==='function')showView('home');
    if(typeof v6738LoadFeed==='function')await v6738LoadFeed(true);
    let card=document.querySelector(`.sports-feed-card[data-feed-id="${id}"]`);
    if(!card && Array.isArray(v6753FeedRows)){
      const row=v6753FeedRows.find(r=>Number(r?.id)===id);
      if(row){
        const t=new Date(row.data_atividade||'').getTime();
        if(Number.isFinite(t))v6753FeedDays=Math.max(v6753FeedDays||7,Math.ceil((Date.now()-t)/86400000)+1);
        await v6740LoadSocialSummary(v6753FeedVisibleRows(v6753FeedRows));
        v6738RenderFeed(v6753FeedRows);
        card=document.querySelector(`.sports-feed-card[data-feed-id="${id}"]`);
      }
    }
    if(card){
      card.scrollIntoView({behavior:'smooth',block:'center'});
      card.classList.add('v67594-push-target');
      setTimeout(()=>card.classList.remove('v67594-push-target'),4200);
      return true;
    }
    return false;
  }catch(e){console.warn('Abrir atividade do Feed:',e);return false}
  finally{v67597FeedTargetRunning=false}
}

async function v67595OpenNotificationFeed(feedId){
  const id=Number(feedId)||0;if(id<=0)return;
  const panel=byId('feedNotificationsPanel');if(panel)panel.hidden=true;
  const bell=document.querySelector('.sports-feed-notifications');if(bell)bell.setAttribute('aria-expanded','false');
  await v67597OpenFeedTarget(id);
}

// Mantém compatibilidade com chamadas das versões anteriores.
async function v67594OpenFeedDeepLink(){
  const id=v67597BootFeedId;v67597BootFeedId=0;
  if(id<=0)return false;
  if(!cloudSession?.token){try{sessionStorage.setItem('v67597PendingFeedId',String(id))}catch(e){};return false}
  return v67597OpenFeedTarget(id);
}

// Quando o PWA já está aberto, o Service Worker envia o feed_id diretamente por mensagem.
navigator.serviceWorker?.addEventListener('message',event=>{
  const d=event.data||{};
  if(d.type==='OPEN_FEED_ACTIVITY'&&Number(d.feedId)>0){
    v67597OpenFeedTarget(Number(d.feedId));
  }
});

window.addEventListener('load',()=>{
  if(v67597BootFeedId>0){try{sessionStorage.setItem('v67597PendingFeedId',String(v67597BootFeedId))}catch(e){};v67597BootFeedId=0}
  let tries=0;
  const timer=setInterval(()=>{
    tries++;
    let pending=0;try{pending=Number(sessionStorage.getItem('v67597PendingFeedId')||0)||0}catch(e){}
    if(pending<=0){clearInterval(timer);return}
    if(cloudSession?.token){
      clearInterval(timer);try{sessionStorage.removeItem('v67597PendingFeedId')}catch(e){}
      setTimeout(()=>v67597OpenFeedTarget(pending),300);return;
    }
    if(tries>=120)clearInterval(timer);
  },500);
});

async function v67597LikeAction(feedId,button,event){
  if(event?.target?.closest?.('.feed-like-heart')){
    await v6738ToggleLike(feedId,button);
    return;
  }
  await v67597ToggleSupporters(feedId,button);
}

function v67597SupporterName(r){
  return `${String(r?.graduacao||'BM').trim()} ${String(r?.nome||'Militar').trim()}`.trim();
}
async function v67597ToggleSupporters(feedId,button){
  const id=Number(feedId)||0;if(id<=0||!cloudSession?.token)return;
  const card=document.querySelector(`.sports-feed-card[data-feed-id="${id}"]`);
  const panel=card?.querySelector('.feed-supporters-panel');if(!panel)return;
  const opening=panel.hidden;
  // Fecha comentários para manter apenas um detalhe social aberto por vez.
  const comments=card.querySelector('.feed-comments-panel');if(comments)comments.hidden=true;
  const cbtn=card.querySelector('.feed-comments-toggle');if(cbtn)cbtn.setAttribute('aria-expanded','false');
  panel.hidden=!opening;if(button)button.setAttribute('aria-expanded',opening?'true':'false');
  if(!opening)return;
  panel.innerHTML='<div class="feed-comment-state">Carregando apoios…</div>';
  try{
    const rows=await v55RpcAll('feed_apoios_listar_v67597',{p_token_militar:cloudSession.token,p_feed_id:id});
    const list=Array.isArray(rows)?rows:[];
    if(!list.length){panel.innerHTML='<div class="feed-supporter-empty">Ainda não há apoios nesta atividade.</div>';return}
    panel.innerHTML='<div class="feed-supporters-title">💪 Militares que apoiaram</div>'+list.map(r=>`<div class="feed-supporter-row"><span class="feed-supporter-avatar">${v6738FeedInitials(r.nome)}</span><div><b>${v6738FeedEsc(v67597SupporterName(r))}</b><small>${v6738FeedEsc(v67381FeedDateTime(r.criado_em))}</small></div></div>`).join('');
  }catch(e){
    console.warn('Lista de apoios:',e);
    panel.innerHTML='<div class="feed-comment-state error">Não foi possível carregar os apoios. Confirme o SQL da v67.59.7 no Supabase.</div>';
  }
}



/* V67.68.1 — módulo Nutrição */
const NUTRITION_PROFILE_KEY='t2_nutrition_profile_v1';
const NUTRITION_PLAN_KEY='t2_nutrition_plan_v1';
const NUTRITION_WEIGHT_KEY='t2_nutrition_weights_v1';
function nutritionSafeJson(key,fallback){try{return JSON.parse(localStorage.getItem(key)||'')||fallback}catch(e){return fallback}}
function nutritionSaveJson(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch(e){}}
let nutritionActiveTab='sim';
function openNutrition(tab='sim'){showView('nutrition');nutritionLoadProfile();nutritionRenderSavedPlan();nutritionRenderEvolution();nutritionTab(tab)}
function nutritionTab(tab){
  if(!['sim','plan','evolution'].includes(tab))tab='sim';
  nutritionActiveTab=tab;
  const map={sim:'nutritionSim',plan:'nutritionPlan',evolution:'nutritionEvolution'};
  Object.entries(map).forEach(([k,id])=>{const el=byId(id);if(el)el.hidden=k!==tab;const b=byId(k==='sim'?'nutritionTabSim':k==='plan'?'nutritionTabPlan':'nutritionTabEvolution');if(b)b.classList.toggle('active',k===tab)});
  if(tab==='plan')nutritionRenderSavedPlan();if(tab==='evolution')nutritionRenderEvolution();
  saveNavigationState('nutrition');
}
function nutritionLoadProfile(){const p=nutritionSafeJson(NUTRITION_PROFILE_KEY,null);if(!p)return;const ids={sex:'nutritionSex',age:'nutritionAge',weight:'nutritionWeight',height:'nutritionHeight',targetWeight:'nutritionTargetWeight',goal:'nutritionGoal',activity:'nutritionActivity',training:'nutritionTraining',meals:'nutritionMeals',mode:'nutritionMode',manualCalories:'nutritionManualCalories',restrictions:'nutritionRestrictions'};Object.entries(ids).forEach(([k,id])=>{const el=byId(id);if(el&&p[k]!==undefined&&p[k]!==null)el.value=p[k]})}
function nutritionNum(id){return Number(String(byId(id)?.value||'').replace(',','.'))}
function generateNutritionPlan(){
  const sex=byId('nutritionSex').value,age=nutritionNum('nutritionAge'),weight=nutritionNum('nutritionWeight'),height=nutritionNum('nutritionHeight'),targetWeight=nutritionNum('nutritionTargetWeight'),goal=byId('nutritionGoal').value,activity=nutritionNum('nutritionActivity'),training=nutritionNum('nutritionTraining'),meals=nutritionNum('nutritionMeals'),mode=byId('nutritionMode').value,manualCalories=nutritionNum('nutritionManualCalories'),restrictions=(byId('nutritionRestrictions').value||'').trim();
  const msg=byId('nutritionMessage');if(!(age>=18&&age<=80&&weight>=40&&weight<=250&&height>=130&&height<=220)){msg.textContent='Preencha idade, peso e altura com valores válidos.';return}
  const bmr=10*weight+6.25*height-5*age+(sex==='m'?5:-161),tdee=bmr*activity;
  let calories=manualCalories>=1200&&manualCalories<=6000?manualCalories:tdee+(goal==='loss'?-400:goal==='gain'?300:0);calories=Math.max(sex==='m'?1500:1200,Math.round(calories/10)*10);
  const protein=Math.round(weight*(goal==='maintain'?1.6:1.8)),fat=Math.round(weight*.8),carbs=Math.max(0,Math.round((calories-protein*4-fat*9)/4));
  const profile={sex,age,weight,height,targetWeight:targetWeight||'',goal,activity,training,meals,mode,manualCalories:manualCalories||'',restrictions};nutritionSaveJson(NUTRITION_PROFILE_KEY,profile);
  const plan={createdAt:new Date().toISOString(),...profile,bmr:Math.round(bmr),tdee:Math.round(tdee),calories:Math.round(calories),protein,fat,carbs,variant:0};nutritionSaveJson(NUTRITION_PLAN_KEY,plan);
  const weights=nutritionSafeJson(NUTRITION_WEIGHT_KEY,[]);if(!weights.length)nutritionSaveJson(NUTRITION_WEIGHT_KEY,[{date:new Date().toISOString(),weight}]);
  msg.textContent='✓ Plano estimado gerado e salvo neste aparelho.';nutritionRenderSavedPlan();nutritionTab('plan');
}
function nutritionFoodPools(mode){
 const pools={
  balanced:{
   breakfast:[['ovos mexidos',100],['omelete',120],['frango desfiado',100],['queijo minas',60],['iogurte natural',170]],
   carb:[['pão integral',60],['cuscuz cozido',120],['tapioca',70],['aveia',40],['batata-doce cozida',150],['macaxeira cozida',130]],
   fruit:[['banana',100],['mamão',150],['maçã',130],['melão',180],['manga',120],['laranja',160]],
   protein:[['peito de frango grelhado',150],['patinho moído',140],['carne bovina magra',140],['tilápia grelhada',170],['lombo suíno',150],['ovos',150]],
   starch:[['arroz cozido',130],['batata inglesa cozida',220],['batata-doce cozida',180],['macaxeira cozida',150],['cuscuz cozido',180],['macarrão cozido',150]],
   beans:[['feijão cozido',100],['lentilha cozida',100],['grão-de-bico cozido',90]],
   snack:[['iogurte natural',170],['leite',250],['queijo minas',60],['ovos cozidos',100],['frango desfiado',100]],
   veg:[['salada e legumes',180],['legumes cozidos',180],['salada variada',150]]
  },
  quartel:{
   breakfast:[['ovos na Air Fryer',100],['omelete rápido',120],['frango desfiado pronto',100],['iogurte proteico',160],['queijo minas',60]],
   carb:[['pão integral',60],['cuscuz pronto',120],['tapioca',70],['aveia',40],['wrap integral',70],['batata-doce pronta',150]],
   fruit:[['banana',100],['maçã',130],['mamão',150],['uva',120],['tangerina',160],['manga',120]],
   protein:[['frango desfiado',150],['frango na Air Fryer',160],['patinho moído',140],['carne magra em tiras',140],['tilápia na Air Fryer',170],['ovos cozidos',150]],
   starch:[['arroz pronto',130],['cuscuz',180],['batata na Air Fryer',220],['macaxeira cozida',150],['macarrão pronto',150],['wrap integral',100]],
   beans:[['feijão pronto',100],['lentilha pronta',100],['grão-de-bico',90]],
   snack:[['iogurte',170],['leite UHT',250],['sanduíche de frango',160],['ovos cozidos',100],['queijo + pão integral',120]],
   veg:[['legumes congelados',180],['salada pronta',150],['legumes na Air Fryer',180]]
  },
  economic:{
   breakfast:[['ovos',100],['omelete',120],['leite',250],['frango desfiado',100],['queijo coalho',50]],
   carb:[['cuscuz',120],['pão francês',50],['tapioca',70],['aveia',40],['macaxeira',130],['batata-doce',150]],
   fruit:[['banana',100],['mamão',150],['laranja',160],['melancia',200],['maçã',130],['manga',120]],
   protein:[['frango',150],['ovos',150],['sardinha',120],['patinho moído',140],['fígado bovino',140],['carne moída magra',140]],
   starch:[['arroz',130],['cuscuz',180],['macaxeira',150],['batata-doce',180],['macarrão',150],['batata inglesa',220]],
   beans:[['feijão',100],['lentilha',100],['feijão-fradinho',100]],
   snack:[['leite',250],['ovos',100],['banana + aveia',140],['pão + ovos',130],['iogurte natural',170]],
   veg:[['salada da estação',180],['legumes cozidos',180],['verduras refogadas',150]]
  }
 };return pools[mode]||pools.balanced;
}
function nutritionPick(a,n){return a[((n%a.length)+a.length)%a.length]}
function nutritionPortion(item,scale){const grams=Math.max(10,Math.round(item[1]*scale/5)*5);return `${item[0]} — ≈ ${grams} g`}
function nutritionMealTemplates(mode,variant,calories,mealCount){
 const p=nutritionFoodPools(mode),v=Math.max(0,Number(variant)||0),count=Math.max(3,Math.min(6,Number(mealCount)||4));
 const target=Math.max(300,Number(calories||2000)/count),scale=Math.max(.72,Math.min(1.55,target/500));
 const pick=(key,offset)=>nutritionPortion(nutritionPick(p[key],v*(offset+3)+offset*7),scale);
 const all=[
  ['Café da manhã',[pick('breakfast',1),pick('carb',2),pick('fruit',3)]],
  ['Almoço',[pick('protein',4),pick('starch',5),pick('beans',6),pick('veg',7)]],
  ['Lanche',[pick('snack',8),pick('fruit',9),pick('carb',10)]],
  ['Jantar',[pick('protein',11),pick('starch',12),pick('veg',13)]],
  ['Ceia',[pick('snack',14),pick('fruit',15)]],
  ['Refeição extra',[pick('protein',16),pick('carb',17),pick('fruit',18)]]
 ];
 return all.slice(0,count);
}
function nutritionRenderSavedPlan(){const box=byId('nutritionPlanContent');if(!box)return;const p=nutritionSafeJson(NUTRITION_PLAN_KEY,null);if(!p){box.innerHTML='<div class="nutrition-evolution-card"><b>Nenhum plano gerado ainda.</b><p>Abra o Simulador, informe seus dados e gere sua primeira estimativa.</p><div class="nutrition-plan-actions"><button type="button" onclick="nutritionResetPlan()">🗑 ZERAR PLANO</button></div></div>';return}const templates=nutritionMealTemplates(p.mode,p.variant||0,p.calories,p.meals),per=Math.round(p.calories/Math.max(1,templates.length));const meals=templates.map(m=>`<div class="nutrition-meal"><div class="nutrition-meal-head"><b>${m[0]}</b><span>≈ ${per} kcal</span></div><ul>${m[1].map(x=>`<li>${x}</li>`).join('')}</ul></div>`).join('');box.innerHTML=`<div class="nutrition-summary"><div class="nutrition-stat"><small>Meta diária</small><b>${p.calories} kcal</b></div><div class="nutrition-stat"><small>Gasto estimado</small><b>${p.tdee} kcal</b></div><div class="nutrition-stat"><small>Proteína</small><b>${p.protein} g</b></div><div class="nutrition-stat"><small>Carboidrato</small><b>${p.carbs} g</b></div><div class="nutrition-stat"><small>Gorduras</small><b>${p.fat} g</b></div><div class="nutrition-stat"><small>Treinos/semana</small><b>${p.training}</b></div></div><h3 class="nutrition-section-title">Sugestão de refeições</h3><div class="nutrition-disclaimer"><b>⚖️ Porções para balança:</b> os pesos abaixo são estimativas práticas e se referem ao alimento pronto para consumo, salvo indicação diferente.</div>${meals}${p.restrictions?`<div class="nutrition-disclaimer"><b>Preferências/restrições informadas:</b><br>${nutritionEscape(p.restrictions)}<br><br>O simulador não garante adequação clínica a alergias; confirme os alimentos antes do consumo.</div>`:''}<div class="nutrition-plan-actions"><button type="button" onclick="nutritionSwapPlan()">↻ TROCAR OPÇÕES</button><button type="button" onclick="nutritionTab('sim')">✎ AJUSTAR DADOS</button><button type="button" onclick="nutritionResetPlan()">🗑 ZERAR PLANO</button></div><div class="nutrition-disclaimer">“Trocar opções” combina diferentes fontes de proteína, carboidrato, frutas, lanches e acompanhamentos conforme o estilo escolhido, permitindo centenas de combinações. Pesos, calorias e macronutrientes são estimativas e variam conforme marca e preparo.</div>`}
function nutritionEscape(s){return String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}
function nutritionSwapPlan(){const p=nutritionSafeJson(NUTRITION_PLAN_KEY,null);if(!p)return;p.variant=(Number(p.variant)||0)+1;nutritionSaveJson(NUTRITION_PLAN_KEY,p);nutritionRenderSavedPlan()}
function nutritionResetSimulator(){if(!confirm('Zerar todos os dados preenchidos no simulador?'))return;localStorage.removeItem(NUTRITION_PROFILE_KEY);['nutritionAge','nutritionWeight','nutritionHeight','nutritionTargetWeight','nutritionManualCalories','nutritionRestrictions'].forEach(id=>{const e=byId(id);if(e)e.value=''});const defaults={nutritionSex:'m',nutritionGoal:'loss',nutritionActivity:'1.55',nutritionTraining:'4',nutritionMeals:'4',nutritionMode:'balanced'};Object.entries(defaults).forEach(([id,v])=>{const e=byId(id);if(e)e.value=v});const msg=byId('nutritionMessage');if(msg)msg.textContent='✓ Simulador zerado.'}
function nutritionResetPlan(){if(!confirm('Zerar o plano alimentar salvo?'))return;localStorage.removeItem(NUTRITION_PLAN_KEY);nutritionRenderSavedPlan()}
function nutritionResetEvolution(){if(!confirm('Zerar todo o histórico de evolução de peso?'))return;localStorage.removeItem(NUTRITION_WEIGHT_KEY);nutritionRenderEvolution()}
function nutritionRenderEvolution(){const box=byId('nutritionEvolutionContent');if(!box)return;const p=nutritionSafeJson(NUTRITION_PROFILE_KEY,null),w=nutritionSafeJson(NUTRITION_WEIGHT_KEY,[]);const current=w.length?Number(w[w.length-1].weight):Number(p?.weight||0),start=w.length?Number(w[0].weight):Number(p?.weight||0),target=Number(p?.targetWeight||0);let pct=0;if(target&&start!==target&&current)pct=Math.max(0,Math.min(100,Math.round(((start-current)/(start-target))*100)));const recent=w.map((x,i)=>({...x,_i:i})).slice(-6).reverse();box.innerHTML=`<div class="nutrition-evolution-card"><span class="sports-feed-kicker">ACOMPANHAMENTO</span><h3>Evolução de peso</h3>${current?`<p>Peso atual: <b>${current.toFixed(1)} kg</b>${target?` • Meta: <b>${target.toFixed(1)} kg</b>`:''}</p>`:'<p>Registre seu primeiro peso para começar.</p>'}${target?`<div class="nutrition-progress-track"><div class="nutrition-progress-fill" style="width:${pct}%"></div></div><small>${pct}% do caminho estimado até a meta</small>`:''}<div class="nutrition-weight-row"><input id="nutritionNewWeight" type="number" min="40" max="250" step="0.1" inputmode="decimal" placeholder="Novo peso (kg)"><button type="button" onclick="nutritionAddWeight()">REGISTRAR</button></div><div class="nutrition-plan-actions"><button type="button" onclick="nutritionResetEvolution()">🗑 ZERAR EVOLUÇÃO</button></div></div>${recent.length?`<h3 class="nutrition-section-title">Últimos registros</h3>${recent.map(x=>`<div class="nutrition-meal"><div class="nutrition-meal-head"><div><b>${Number(x.weight).toFixed(1)} kg</b><span style="display:block;margin-top:4px">${new Date(x.date).toLocaleDateString('pt-BR')}</span></div><div class="nutrition-record-actions"><button type="button" onclick="nutritionEditWeight(${x._i})">✏️ EDITAR</button><button type="button" onclick="nutritionDeleteWeight(${x._i})">🗑 EXCLUIR</button></div></div></div>`).join('')}`:''}`}

function nutritionSyncCurrentWeight(weights){const p=nutritionSafeJson(NUTRITION_PROFILE_KEY,null);if(!p)return;if(weights.length)p.weight=Number(weights[weights.length-1].weight);nutritionSaveJson(NUTRITION_PROFILE_KEY,p)}
function nutritionEditWeight(index){const w=nutritionSafeJson(NUTRITION_WEIGHT_KEY,[]);if(index<0||index>=w.length)return;const old=Number(w[index].weight);const typed=prompt('Corrigir peso deste registro (kg):',old.toFixed(1));if(typed===null)return;const v=Number(String(typed).replace(',','.'));if(!(v>=40&&v<=250)){alert('Informe um peso válido entre 40 e 250 kg.');return}w[index].weight=Math.round(v*10)/10;nutritionSaveJson(NUTRITION_WEIGHT_KEY,w);nutritionSyncCurrentWeight(w);nutritionRenderEvolution()}
function nutritionDeleteWeight(index){const w=nutritionSafeJson(NUTRITION_WEIGHT_KEY,[]);if(index<0||index>=w.length)return;const item=w[index];if(!confirm(`Excluir o registro de ${Number(item.weight).toFixed(1)} kg de ${new Date(item.date).toLocaleDateString('pt-BR')}?`))return;w.splice(index,1);nutritionSaveJson(NUTRITION_WEIGHT_KEY,w);nutritionSyncCurrentWeight(w);nutritionRenderEvolution()}

function nutritionAddWeight(){const el=byId('nutritionNewWeight'),v=Number(String(el?.value||'').replace(',','.'));if(!(v>=40&&v<=250)){alert('Informe um peso válido.');return}const w=nutritionSafeJson(NUTRITION_WEIGHT_KEY,[]);w.push({date:new Date().toISOString(),weight:v});nutritionSaveJson(NUTRITION_WEIGHT_KEY,w.slice(-100));const p=nutritionSafeJson(NUTRITION_PROFILE_KEY,null);if(p){p.weight=v;nutritionSaveJson(NUTRITION_PROFILE_KEY,p)}nutritionRenderEvolution()}
