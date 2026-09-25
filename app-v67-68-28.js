/* Treino 2ª CIA — v67.68.22 */

const DATA=window.APP_DATA;
let currentGroup="", currentListMode="group", currentExercise=null, currentSet=1, timer=90, tick=null;
let activePlanName="", activePlanExercises=[], activePlanIndex=-1, workoutStartedAt=null;


const byId=id=>document.getElementById(id);

function footerGoHome(){
  try{ if(typeof stopExerciseMotion==='function') stopExerciseMotion(); }catch(e){}
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
    v67623CancelResumeTimers();
    v67621StopMusic(false);
  }else{
    v67623ResumeMusicAfterReturn();
  }
});
window.addEventListener('pageshow',v67623ResumeMusicAfterReturn);
window.addEventListener('focus',v67623ResumeMusicAfterReturn);
document.addEventListener('resume',v67623ResumeMusicAfterReturn);


/* ===== V67.58.0 — ABERTURA MOTIVACIONAL ===== */
const V6758_MOTIVATION_PHRASES=[
  'Corpo forte. Mente pronta. Missão cumprida.',
  'O preparo de hoje sustenta a missão de amanhã.',
  'Quando a ocorrência chama, seu corpo precisa estar pronto.',
  'Treine como quem pode ser chamado a qualquer momento.',
  'Disciplina no treino. Eficiência na missão.',
  'Sua melhor ferramenta em uma ocorrência ainda é você.',
  'A farda exige preparo. O preparo exige constância.',
  'Força para servir. Resistência para proteger.',
  'Não treinamos apenas por desempenho. Treinamos para estar prontos.',
  'Cada treino é parte da preparação para a próxima missão.',
  'Prontidão não se improvisa. Constrói-se todos os dias.',
  'O uniforme representa a missão. O preparo honra a farda.',
  'Treino é disciplina antes que a missão exija coragem.',
  'Quem serve precisa estar pronto. Quem treina se prepara para servir.',
  'Condicionamento é parte da missão.',
  'A ocorrência não escolhe hora. O preparo também não pode escolher.',
  'Fortaleça o corpo. Preserve a mente. Honre a missão.',
  'Constância no treino. Segurança na resposta.',
  'Cada repetição fortalece quem estará pronto para ajudar alguém.',
  'Preparar-se também é uma forma de proteger.'
];
let v6758MotivationShown=false;
let v6758MotivationTimer=null;
let v67582LoginMotivationPending=false;
function v67581IsStandaloneApp(){
  try{return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone===true}catch(e){return false}
}
function v67581NavigationType(){
  try{return performance.getEntriesByType('navigation')[0]?.type||'navigate'}catch(e){return 'navigate'}
}
// V67.62.0 — uma nova execução do documento no PWA é uma abertura real.
// Não usamos sessionStorage como trava: no Android ele pode sobreviver ao fechamento
// do PWA e impedir a frase na abertura seguinte. Voltar de outro app não recria o
// documento, portanto não rearma a frase. Atualizar/reload continua sem frase.
const V67581_MOTIVATION_ELIGIBLE = v67581IsStandaloneApp() && v67581NavigationType()!=='reload';
function releaseSplash(){
  const splash=document.getElementById('splash');if(!splash)return;
  splash.classList.remove('show');splash.classList.add('hide');splash.setAttribute('aria-hidden','true');
}
function v6758ShowMotivation(forceLogin=false){
  if(!cloudSession?.token)return false;
  if(!forceLogin && (!V67581_MOTIVATION_ELIGIBLE||v6758MotivationShown))return false;
  const splash=document.getElementById('splash'),phrase=document.getElementById('v6758MotivationPhrase');
  if(!splash||!phrase)return false;
  v6758MotivationShown=true;
  const pick=V6758_MOTIVATION_PHRASES[Math.floor(Math.random()*V6758_MOTIVATION_PHRASES.length)];
  phrase.textContent=pick;
  splash.classList.remove('hide');
  splash.classList.add('show');
  splash.setAttribute('aria-hidden','false');
  clearTimeout(v6758MotivationTimer);
  v6758MotivationTimer=setTimeout(releaseSplash,5000);
  return true;
}
// O splash possui seu próprio temporizador de 5 s. Erros não relacionados ao app
// não devem ocultar a mensagem motivacional prematuramente.

const NAV_STATE_KEY='t2_nav_state_v6730_session';
const LEGACY_NAV_STATE_KEY='t2_nav_state_v47';
function navigationLoadType(){
  try{return performance.getEntriesByType('navigation')[0]?.type||'navigate'}catch(e){return 'navigate'}
}
const NAV_RESTORE_ON_BOOT = navigationLoadType()==='reload';
let navRestoring=false;
let navHistoryIndex=null;

function navStateSnapshot(viewId){
  return {
    matricula: cloudSession?.matricula || '',
    view: viewId || document.querySelector('.view.active')?.id || 'home',
    currentGroup,
    currentListMode,
    activePlanName,
    activePlanIndex,
    currentExerciseId: currentExercise?.id ?? null,
    currentSet,
    workoutStartedAt,
    customBuilderEditingId: typeof customBuilderEditingId!=='undefined' ? customBuilderEditingId : null,
    historyIndex: navHistoryIndex,
    mobilityRoutineKey: typeof mobilityRoutineKey!=='undefined' ? mobilityRoutineKey : null,
    mobilityStep: typeof mobilityStep!=='undefined' ? mobilityStep : 0,
    mobilityRemaining: typeof mobilityRemaining!=='undefined' ? mobilityRemaining : 0,
    mobilityRunning: typeof mobilityRunning!=='undefined' ? mobilityRunning : false,
    coreRoutineKey: typeof coreRoutineKey!=='undefined' ? coreRoutineKey : null,
    coreStep: typeof coreStep!=='undefined' ? coreStep : 0,
    coreRemaining: typeof coreRemaining!=='undefined' ? coreRemaining : 0,
    coreRunning: typeof coreRunning!=='undefined' ? coreRunning : false,
    officialTafEdition: typeof officialTafState!=='undefined' ? officialTafState.edition : null,
    officialTafScope: typeof officialTafState!=='undefined' ? officialTafState.scope : 'all',
    officialTafExercise: typeof officialTafState!=='undefined' ? officialTafState.exercise : 'pushup',
    serviceDay: typeof v66WorkoutServiceDay!=='undefined' ? v66WorkoutServiceDay : null,
    freeWorkoutGroups: [...document.querySelectorAll('#freeMuscleGroups .free-muscle.selected')].map(x=>x.dataset.group),
    freeWorkoutMinutes: document.getElementById('freeWorkoutMinutes')?.value || '',
    freeWorkoutExercises: typeof freeWorkoutExerciseState!=='undefined' ? freeWorkoutExerciseState : {},
    cardioMachine: typeof cardioSelectedMachine!=='undefined' ? cardioSelectedMachine : '',
    cardioMinutes: document.getElementById('cardioMinutes')?.value || '',
    cardioDistance: document.getElementById('cardioDistance')?.value || '',
    cardioRunDistance: document.getElementById('cardioRunDistance')?.value || '',
    cardioCalories: document.getElementById('cardioCalories')?.value || '',
    cardioIncline: document.getElementById('cardioIncline')?.value || '',
    cardioBikeIntensity: document.getElementById('cardioBikeIntensity')?.value || '',
    cardioBikeWatch: document.getElementById('cardioBikeWatch')?.checked || false,
    cardioBikeHrAvg: document.getElementById('cardioBikeHrAvg')?.value || '',
    cardioBikeHrMax: document.getElementById('cardioBikeHrMax')?.value || '',
    cardioBikeCalories: document.getElementById('cardioBikeCalories')?.value || '',
    cardioRowerDistance: document.getElementById('cardioRowerDistance')?.value || '',
    cardioRowerSpm: document.getElementById('cardioRowerSpm')?.value || '',
    cardioRowerCalories: document.getElementById('cardioRowerCalories')?.value || '',
    cardioSwimDistance: document.getElementById('cardioSwimDistance')?.value || '',
    cardioSwimType: document.getElementById('cardioSwimType')?.value || 'pool',
    cardioPoolLength: document.getElementById('cardioPoolLength')?.value || '25',
    cardioPoolCustomLength: document.getElementById('cardioPoolCustomLength')?.value || '',
    cardioPoolLaps: document.getElementById('cardioPoolLaps')?.value || '',
    cardioLocationText: document.getElementById('cardioLocationText')?.value || '',
    cardioSwimLocationText: document.getElementById('cardioSwimLocationText')?.value || '',
    nutritionTab: typeof nutritionActiveTab!=='undefined' ? nutritionActiveTab : 'sim',
    scrollY: window.scrollY || 0,
    savedAt: Date.now()
  };
}
function saveNavigationState(viewId){
  if(navRestoring || !cloudSession?.token) return;
  try{
    sessionStorage.setItem(NAV_STATE_KEY,JSON.stringify(navStateSnapshot(viewId)));
  }catch(e){}
}
function clearNavigationState(){
  try{sessionStorage.removeItem(NAV_STATE_KEY)}catch(e){}
  try{localStorage.removeItem(LEGACY_NAV_STATE_KEY)}catch(e){}
}
let browserNavHandling=false;

/* ===== V67.60.10 — VOLTAR NATIVO DO ANDROID =====
   A navegação interna não depende mais de history.back().
   Mantemos uma pilha própria de snapshots e, quando disponível, usamos CloseWatcher,
   API do Chromium criada justamente para pedidos nativos de fechamento/Voltar.
   Na Home não há watcher: o Android continua livre para minimizar/sair do PWA. */
const V67610_NAV_STACK_KEY='t2_nav_stack_v67610';
let v67610CloseWatcher=null;
let v67610InternalBackRunning=false;

function appHistorySnapshot(viewId){
  try{return {...navStateSnapshot(viewId),view:viewId}}
  catch(e){return {view:viewId}}
}
function v67610ReadStack(){
  try{const a=JSON.parse(sessionStorage.getItem(V67610_NAV_STACK_KEY)||'[]');return Array.isArray(a)?a:[]}
  catch(e){return []}
}
function v67610WriteStack(a){
  try{sessionStorage.setItem(V67610_NAV_STACK_KEY,JSON.stringify((Array.isArray(a)?a:[]).slice(-40)))}catch(e){}
}
function v67610ClearStack(){v67610WriteStack([])}
function v67610PushSnapshot(snapshot){
  if(!snapshot?.view)return;
  const a=v67610ReadStack();
  const last=a[a.length-1];
  // Evita duplicar a mesma tela em chamadas encadeadas do mesmo clique.
  if(!last || last.view!==snapshot.view || Number(last.savedAt)!==Number(snapshot.savedAt))a.push(snapshot);
  v67610WriteStack(a);
}
function v67610DestroyCloseWatcher(){
  try{v67610CloseWatcher?.destroy?.()}catch(e){}
  v67610CloseWatcher=null;
}
function v67610ArmCloseWatcher(){
  const active=document.querySelector('.view.active')?.id||'home';
  v67610DestroyCloseWatcher();
  if(active==='home' || !cloudSession?.token || !('CloseWatcher' in window))return;
  try{
    const watcher=new CloseWatcher();
    v67610CloseWatcher=watcher;
    watcher.addEventListener('cancel',event=>{
      // Pedido nativo de Voltar do Android: consome dentro do app.
      try{if(event.cancelable)event.preventDefault()}catch(e){}
      v67610InternalBack();
    });
    watcher.addEventListener('close',()=>{
      // Alguns builds do Chromium chegam diretamente em close.
      if(v67610CloseWatcher===watcher)v67610CloseWatcher=null;
      const activeNow=document.querySelector('.view.active')?.id||'home';
      if(activeNow!=='home')v67610InternalBack();
    });
  }catch(e){console.warn('CloseWatcher indisponível:',e)}
}
function v67610RestoreSnapshot(snap){
  if(!snap?.view)return false;
  try{
    sessionStorage.setItem(NAV_STATE_KEY,JSON.stringify({...snap,matricula:cloudSession.matricula}));
    restoreNavigationState(true);
    setTimeout(v67610ArmCloseWatcher,0);
    return true;
  }catch(e){console.warn('Falha ao voltar dentro do app:',e);return false}
}
function v67610InternalBack(fallbackView='home',fallbackAction=null){
  if(v67610InternalBackRunning)return true;
  v67610InternalBackRunning=true;
  try{
    const stack=v67610ReadStack();
    while(stack.length){
      const snap=stack.pop();
      v67610WriteStack(stack);
      if(snap?.view && snap.view!==(document.querySelector('.view.active')?.id||'')){
        return v67610RestoreSnapshot(snap);
      }
    }
    if(typeof fallbackAction==='function'){
      navRestoring=true;try{fallbackAction()}finally{navRestoring=false}
      saveNavigationState(document.querySelector('.view.active')?.id||fallbackView);
      setTimeout(v67610ArmCloseWatcher,0);
      return true;
    }
    if(fallbackView){
      navRestoring=true;
      try{
        document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
        byId(fallbackView)?.classList.add('active');
      }finally{navRestoring=false}
      saveNavigationState(fallbackView);
      if(fallbackView==='home'){
        setTimeout(()=>v6738LoadFeed?.(false),60);
        setTimeout(()=>v6748RenderDashboard?.(),20);
      }
      setTimeout(v67610ArmCloseWatcher,0);
      return true;
    }
    return false;
  }finally{
    setTimeout(()=>{v67610InternalBackRunning=false},0);
  }
}

function ensureAppHistoryState(){
  // Mantém apenas um estado neutro; não usamos History API para a pilha interna.
  try{window.history.replaceState({t2App:true,t2NavVersion:67610},'',location.pathname+location.search)}catch(e){}
}

function showView(id){
  const target=byId(id);if(!target)return;
  const previous=document.querySelector('.view.active')?.id||null;
  if(!navRestoring && !browserNavHandling && previous && previous!==id){
    v67610PushSnapshot(appHistorySnapshot(previous));
  }
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  target.classList.add('active');
  if(id==='home' && typeof v6738LoadFeed==='function')setTimeout(()=>v6738LoadFeed(false),60);
  if(id==='home' && typeof v6748RenderDashboard==='function')setTimeout(()=>v6748RenderDashboard(),20);
  if(!navRestoring)scrollTo({top:0,behavior:'smooth'});
  saveNavigationState(id);
  // V67.62.4 — enquanto o militar navega pelo app, a trilha deve estar ativa.
  // Se o navegador tiver pausado o áudio ao voltar de outro app, esta troca de
  // tela faz nova tentativa. Em treino ativo v67621ShouldPlayMusic() bloqueia.
  if(typeof v67621PlayMusic==='function')setTimeout(()=>v67621PlayMusic(true),0);
  setTimeout(v67610ArmCloseWatcher,0);
}

function appBack(fallbackView='home',fallbackAction=null){
  v67610InternalBack(fallbackView,fallbackAction);
}

// Fallback para navegadores que ainda entreguem um popstate interno.
window.addEventListener('popstate',()=>{
  if(!cloudSession?.token)return;
  const active=document.querySelector('.view.active')?.id||'home';
  if(active!=='home'){
    browserNavHandling=true;
    try{v67610InternalBack('home')}finally{setTimeout(()=>{browserNavHandling=false},0)}
  }
});

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>ensureAppHistoryState(),{once:true});
else ensureAppHistoryState();
window.addEventListener('pageshow',()=>{ensureAppHistoryState();setTimeout(v67610ArmCloseWatcher,0)});


function exByName(n){return DATA.exercises.find(x=>x.name===n)}
function openGroups(){
  currentListMode="group";
  const gs=[...new Set(DATA.exercises.map(x=>x.group))].filter(g=>g!=="Alongamento");
  byId('groupGrid').innerHTML=gs.map(g=>`<button class="rowbtn" onclick="openGroup('${g.replaceAll("'","\\'")}')"><b>${g}</b><span>${DATA.exercises.filter(x=>x.group===g).length} exercícios</span></button>`).join('');
  showView('groups');
}
function openGroup(g){
  currentGroup=g;currentListMode="group";byId('listTitle').textContent=g;
  renderExerciseButtons(DATA.exercises.filter(x=>x.group===g));showView('list');
}


function showSavedConfirmation(onClose){
  let overlay=document.getElementById('savedConfirmOverlay');
  if(!overlay){
    overlay=document.createElement('div');
    overlay.id='savedConfirmOverlay';
    overlay.className='saved-confirm-overlay';
    overlay.innerHTML=`<div class="saved-confirm-box">
      <div class="saved-confirm-check">✓</div>
      <h3>Treino salvo.</h3>
      <button type="button" id="savedConfirmOk">OK</button>
    </div>`;
    document.body.appendChild(overlay);
  }
  overlay.classList.add('show');
  const ok=document.getElementById('savedConfirmOk');
  ok.onclick=()=>{
    overlay.classList.remove('show');
    if(typeof onClose==='function')onClose();
  };
}

// V66.1 — confirmação visual universal ao salvar treino
function showWorkoutSavedMessage(){
  let el=document.getElementById('workoutSavedToast');
  if(!el){
    el=document.createElement('div');
    el.id='workoutSavedToast';
    el.className='workout-saved-toast';
    el.setAttribute('role','status');
    el.setAttribute('aria-live','polite');
    document.body.appendChild(el);
  }
  el.textContent='✓ Treino salvo.';
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  clearTimeout(showWorkoutSavedMessage._t);
  showWorkoutSavedMessage._t=setTimeout(()=>el.classList.remove('show'),2400);
}

// ===== V66 — Planejamento do treino + situação de serviço =====
const V66_SERVICE_KEY='t2_workout_service_choice_v66';
const V66_FREE_GROUPS=['Peito','Costas','Ombros','Bíceps','Tríceps','Pernas','Glúteos','Core','Corpo inteiro'];
let freeWorkoutExerciseState={};
const FREE_GROUP_ALIASES={Core:['core','abdomen','abdominal'],Pernas:['perna','quadriceps','posterior','panturrilha'],Glúteos:['gluteo'],Ombros:['ombro'],Bíceps:['biceps'],Tríceps:['triceps'],Peito:['peito','peitoral'],Costas:['costas','dorsal']};
let v66WorkoutServiceDay=null;

function openWorkoutChooser(){
  v66WorkoutServiceDay=null;
  sessionStorage.removeItem(V66_SERVICE_KEY);
  updateServiceChoiceUI();
  showView('workoutChooser');
}
function setWorkoutServiceDay(value){
  v66WorkoutServiceDay=!!value;
  sessionStorage.setItem(V66_SERVICE_KEY,v66WorkoutServiceDay?'1':'0');
  updateServiceChoiceUI();
}
function updateServiceChoiceUI(){
  const y=byId('serviceYes'),n=byId('serviceNo'),h=byId('serviceChoiceHint');
  if(y)y.classList.toggle('selected',v66WorkoutServiceDay===true);
  if(n)n.classList.toggle('selected',v66WorkoutServiceDay===false);
  if(h)h.textContent=v66WorkoutServiceDay===null?'Selecione uma opção para continuar.':
    (v66WorkoutServiceDay?'Treino com presença validada na unidade.':'Esta atividade será registrada, mas não pontuará no Ranking.');
}
function requireServiceChoice(){
  if(v66WorkoutServiceDay===null){
    const s=sessionStorage.getItem(V66_SERVICE_KEY);
    if(s==='1'||s==='0')v66WorkoutServiceDay=s==='1';
  }
  if(v66WorkoutServiceDay===null){alert('Escolha primeiro se deseja validar o treino de hoje.');return false}
  return true;
}

function restoreWorkoutChooserV667(state){
  if(state && (state.serviceDay===true || state.serviceDay===false)){
    v66WorkoutServiceDay=state.serviceDay;
    sessionStorage.setItem(V66_SERVICE_KEY,v66WorkoutServiceDay?'1':'0');
  }else{
    const s=sessionStorage.getItem(V66_SERVICE_KEY);
    v66WorkoutServiceDay=(s==='1')?true:(s==='0'?false:null);
  }
  updateServiceChoiceUI();
  showView('workoutChooser');
}

function restoreFreeWorkoutV667(state){
  if(state && (state.serviceDay===true || state.serviceDay===false)){
    v66WorkoutServiceDay=state.serviceDay;
    sessionStorage.setItem(V66_SERVICE_KEY,v66WorkoutServiceDay?'1':'0');
  }else{
    const s=sessionStorage.getItem(V66_SERVICE_KEY);
    v66WorkoutServiceDay=(s==='1')?true:(s==='0'?false:null);
  }

  const box=byId('freeMuscleGroups');
  const selected=new Set(Array.isArray(state?.freeWorkoutGroups)?state.freeWorkoutGroups:[]);
  if(box){
    box.innerHTML=V66_FREE_GROUPS.map(g=>
      `<button type="button" class="free-muscle${selected.has(g)?' selected':''}" data-group="${g}" onclick="toggleFreeMuscle(this)">${g}</button>`
    ).join('');
  }
  freeWorkoutExerciseState=state?.freeWorkoutExercises&&typeof state.freeWorkoutExercises==='object'?state.freeWorkoutExercises:{};
  renderFreeExercises();

  const mins=byId('freeWorkoutMinutes');
  if(mins){ mins.value=state?.freeWorkoutMinutes||''; mins.oninput=()=>{updateFreeEligibility();saveNavigationState('freeWorkout')}; }
  updateFreeEligibility();

  const savedMsg=document.getElementById('freeWorkoutSavedMessage');
  if(savedMsg){
    savedMsg.classList.remove('show');
    savedMsg.style.display='none';
  }

  const saveBtn=document.getElementById('saveFreeWorkoutBtn');
  if(saveBtn){
    saveBtn.disabled=false;
    saveBtn.textContent='SALVAR TREINO LIVRE';
  }

  showView('freeWorkout');
}
const CARDIO_MACHINE_META={
  treadmill:{label:'Esteira',icon:'🏃'},
  run:{label:'Corrida ao ar livre',icon:'🏃‍♂️'},
  bike:{label:'Bicicleta ergométrica',icon:'🚴'},
  rower:{label:'Simulador de remo',icon:'🚣'},
  swim:{label:'Natação',icon:'🏊'}
};
let cardioSelectedMachine='';
/* ===== V67.67.2 — LOCALIZAÇÃO UNIVERSAL + MAPA GPS AJUSTÁVEL ===== */
let v67670ActivityLocation={mode:'',label:'',lat:null,lng:null,accuracy:null,status:'',manualOpen:false,mapOpen:false,mapLat:null,mapLng:null,mapZoom:18,namingGps:false};
const V67671_DEFAULT_LOCATION='Academia 2ª CIA/4º BBM - Currais Novos/RN';
function v67670Esc(v){return String(v||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function v67670ResetActivityLocation(){v67670ActivityLocation={mode:'',label:'',lat:null,lng:null,accuracy:null,status:'',manualOpen:false,mapOpen:false,mapLat:null,mapLng:null,mapZoom:18,namingGps:false};v67670RenderLocationHosts()}
function v67672MapMarkup(){const v=v67670ActivityLocation;if(!v.mapOpen||!Number.isFinite(v.mapLat)||!Number.isFinite(v.mapLng))return '';return `<div class="v67672-map-panel"><div class="v67672-map-title">📍 Ajuste o ponto da atividade</div><p>O mapa abriu na posição detectada pelo GPS. Toque em qualquer ponto do mapa para mover o marcador.</p><div id="v67672GpsMap" class="v67672-gps-map" role="application" aria-label="Mapa para selecionar localização"></div><div class="v67672-coords"><span>Lat: <b>${Number(v.mapLat).toFixed(6)}</b></span><span>Lng: <b>${Number(v.mapLng).toFixed(6)}</b></span>${v.accuracy?`<span>Precisão GPS: <b>±${v.accuracy} m</b></span>`:''}</div><div class="v67672-map-actions"><button type="button" onclick="v67672RecenterGps()">🎯 VOLTAR AO GPS</button><button type="button" class="v67672-confirm-map" onclick="v67672ConfirmMapLocation()">✓ CONFIRMAR LOCALIZAÇÃO</button></div><small class="v67672-map-credit">Mapa © OpenStreetMap</small></div>`}
function v67670LocationCard(){
  const v=v67670ActivityLocation;
  const gpsOk=v.mode==='gps'&&Number.isFinite(v.lat)&&Number.isFinite(v.lng);
  const status=v.status || (v.label?(v.mode==='gps'?'✓ Localização GPS confirmada.':'✓ Local informado.'):(gpsOk?'✓ Localização GPS confirmada.':'Nenhuma localização adicionada.'));
  const manual=v.manualOpen?`<div class="v67671-manual-location"><div class="v67671-quick-title">Escolha o local</div><button class="v67671-quick-location" type="button" onclick="v67671UseDefaultLocation()">📍 ${V67671_DEFAULT_LOCATION}</button><button class="v67671-other-location" type="button" onclick="v67671UseOtherLocation()">✏️ OUTRO LOCAL</button><div class="v67671-other-wrap" style="${v.manualOther?'':'display:none'}"><input class="v67670-location-input" type="text" maxlength="80" placeholder="Digite o local da atividade" value="${v67670Esc(v.manualOther?v.label:'')}" oninput="v67670LocationInput(this.value)"></div></div>`:'';
  return `<div class="activity-location-card v67670-location-card"><b>📍 Local da atividade <small class="field-optional">opcional</small></b><p>Use o GPS para abrir o mapa e ajustar o ponto exato, ou informe o local manualmente.</p><div class="location-actions"><button type="button" onclick="v67670CaptureLocation()">USAR LOCALIZAÇÃO ATUAL</button><button type="button" onclick="v67670ChooseManualLocation()">INFORMAR LOCAL</button></div>${v67672MapMarkup()}${v67673GpsNamingMarkup()}${manual}<div class="activity-location-status">${v67670Esc(status)}</div>${v.label&&!v.manualOther&&!v.namingGps?`<div class="v67671-selected-location">📍 ${v67670Esc(v.label)}</div>`:''}</div>`;
}
function v67670RenderLocationHosts(){['freeActivityLocationHost','planActivityLocationHost','coreActivityLocationHost','cardioActivityLocationHost'].forEach(id=>{const h=byId(id);if(h)h.innerHTML=v67670LocationCard()});setTimeout(v67672InitVisibleMap,0)}
function v67670LocationInput(value){v67670ActivityLocation.label=String(value||'').trim().slice(0,80);v67670ActivityLocation.mode='manual';v67670ActivityLocation.mapOpen=false;v67670ActivityLocation.status=v67670ActivityLocation.label?'✓ Outro local informado.':'Digite o local da atividade.';const active=document.querySelector('.view.active .activity-location-status');if(active)active.textContent=v67670ActivityLocation.status}
function v67670ChooseManualLocation(){v67670ActivityLocation.manualOpen=true;v67670ActivityLocation.mapOpen=false;v67670ActivityLocation.status='Escolha um local pré-definido ou selecione Outro local.';v67670RenderLocationHosts()}
function v67671UseDefaultLocation(){v67670ActivityLocation={mode:'manual',label:V67671_DEFAULT_LOCATION,lat:null,lng:null,accuracy:null,status:'✓ Local pré-definido selecionado.',manualOpen:true,manualOther:false,mapOpen:false,mapLat:null,mapLng:null,mapZoom:18,namingGps:false};v67670RenderLocationHosts()}
function v67671UseOtherLocation(){v67670ActivityLocation.mode='manual';v67670ActivityLocation.label='';v67670ActivityLocation.lat=null;v67670ActivityLocation.lng=null;v67670ActivityLocation.accuracy=null;v67670ActivityLocation.status='Digite o local da atividade.';v67670ActivityLocation.manualOpen=true;v67670ActivityLocation.manualOther=true;v67670ActivityLocation.mapOpen=false;v67670RenderLocationHosts();setTimeout(()=>document.querySelector('.view.active .v67670-location-input')?.focus(),0)}
async function v67670CaptureLocation(){
  if(!navigator.geolocation){v67670ActivityLocation.status='⚠️ Geolocalização indisponível neste aparelho.';v67670RenderLocationHosts();return}
  v67670ActivityLocation.status='⏳ Obtendo localização atual para abrir o mapa…';v67670ActivityLocation.manualOpen=false;v67670ActivityLocation.mapOpen=false;v67670RenderLocationHosts();
  try{
    const pos=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:true,timeout:20000,maximumAge:0}));
    const c=pos.coords,lat=Number(c.latitude),lng=Number(c.longitude);
    v67670ActivityLocation={mode:'gps-pending',label:'',lat:null,lng:null,accuracy:Math.round(c.accuracy||0),status:'📍 GPS encontrado. Ajuste o marcador no mapa e confirme.',manualOpen:false,manualOther:false,mapOpen:true,mapLat:lat,mapLng:lng,mapGpsLat:lat,mapGpsLng:lng,mapZoom:18,namingGps:false};
    v67670RenderLocationHosts();
  }catch(e){
    const msg=e&&e.code===1?'Permissão de localização negada. Libere o acesso ao GPS para este site/app e tente novamente.':e&&e.code===2?'Não foi possível determinar sua localização. Verifique se o GPS do celular está ligado.':e&&e.code===3?'O GPS demorou para responder. Tente novamente em um local com melhor sinal.':'Não foi possível obter sua localização. Verifique o GPS e tente novamente.';
    v67670ActivityLocation.status='⚠️ '+msg;v67670RenderLocationHosts();
  }
}
function v67672LngToX(lng,z){return (lng+180)/360*Math.pow(2,z)*256}
function v67672LatToY(lat,z){const r=lat*Math.PI/180,n=Math.pow(2,z);return (1-Math.asinh(Math.tan(r))/Math.PI)/2*n*256}
function v67672XToLng(x,z){return x/(Math.pow(2,z)*256)*360-180}
function v67672YToLat(y,z){const n=Math.PI-2*Math.PI*y/(Math.pow(2,z)*256);return 180/Math.PI*Math.atan(Math.sinh(n))}
function v67672InitVisibleMap(){const map=document.querySelector('.view.active #v67672GpsMap');if(!map||!v67670ActivityLocation.mapOpen)return;v67672DrawMap(map);map.onclick=e=>{const r=map.getBoundingClientRect(),z=v67670ActivityLocation.mapZoom||18,cx=v67672LngToX(v67670ActivityLocation.mapLat,z),cy=v67672LatToY(v67670ActivityLocation.mapLat,z),px=cx+(e.clientX-r.left-r.width/2),py=cy+(e.clientY-r.top-r.height/2);v67670ActivityLocation.mapLng=v67672XToLng(px,z);v67670ActivityLocation.mapLat=v67672YToLat(py,z);v67670ActivityLocation.status='📍 Ponto ajustado. Confirme a localização.';v67670RenderLocationHosts()}}
function v67672DrawMap(map){const z=v67670ActivityLocation.mapZoom||18,lat=v67670ActivityLocation.mapLat,lng=v67670ActivityLocation.mapLng,w=map.clientWidth||320,h=map.clientHeight||280,cx=v67672LngToX(lng,z),cy=v67672LatToY(lat,z),tx0=Math.floor((cx-w/2)/256),ty0=Math.floor((cy-h/2)/256),tx1=Math.floor((cx+w/2)/256),ty1=Math.floor((cy+h/2)/256),n=Math.pow(2,z);map.innerHTML='';for(let x=tx0;x<=tx1;x++)for(let y=ty0;y<=ty1;y++){if(y<0||y>=n)continue;const img=document.createElement('img');img.className='v67672-map-tile';img.alt='';img.draggable=false;img.src=`https://tile.openstreetmap.org/${z}/${((x%n)+n)%n}/${y}.png`;img.style.left=(x*256-(cx-w/2))+'px';img.style.top=(y*256-(cy-h/2))+'px';map.appendChild(img)}const marker=document.createElement('div');marker.className='v67672-map-marker';marker.innerHTML='📍';marker.style.left=(w/2)+'px';marker.style.top=(h/2)+'px';map.appendChild(marker)}
function v67672RecenterGps(){if(Number.isFinite(v67670ActivityLocation.mapGpsLat)&&Number.isFinite(v67670ActivityLocation.mapGpsLng)){v67670ActivityLocation.mapLat=v67670ActivityLocation.mapGpsLat;v67670ActivityLocation.mapLng=v67670ActivityLocation.mapGpsLng;v67670ActivityLocation.status='🎯 Marcador reposicionado no ponto detectado pelo GPS.';v67670RenderLocationHosts()}}
async function v67672ConfirmMapLocation(){
  const v=v67670ActivityLocation;if(!Number.isFinite(v.mapLat)||!Number.isFinite(v.mapLng))return;
  v.mode='gps';v.lat=Number(v.mapLat.toFixed(6));v.lng=Number(v.mapLng.toFixed(6));v.mapOpen=false;v.manualOpen=false;v.manualOther=false;
  v.label='';v.namingGps=true;v.status='🔎 Identificando o local marcado no mapa…';v67670RenderLocationHosts();
  let suggested='';
  try{
    const u=`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(v.lat)}&lon=${encodeURIComponent(v.lng)}&zoom=18&addressdetails=1&accept-language=pt-BR`;
    const r=await fetch(u,{headers:{'Accept':'application/json'}});if(!r.ok)throw new Error('reverse');
    const d=await r.json(),a=d.address||{};
    const poi=d.name||a.amenity||a.building||a.leisure||a.shop||'';
    const road=a.road||a.pedestrian||a.residential||a.neighbourhood||a.suburb||'';
    const city=a.city||a.town||a.municipality||a.village||'';
    const state=a.state||'';
    suggested=[poi,road,city,state].filter((x,i,arr)=>x&&arr.indexOf(x)===i).join(' - ');
    if(!suggested)suggested=String(d.display_name||'').split(',').slice(0,4).join(', ').trim();
  }catch(e){}
  v.label=String(suggested||'').slice(0,80);v.namingGps=true;
  v.status=v.label?'✓ Endereço encontrado. Confirme ou edite o nome antes de salvar.':'⚠️ Não foi possível identificar o nome automaticamente. Digite um nome para este local.';
  v67670RenderLocationHosts();
}
function v67673GpsNameInput(value){v67670ActivityLocation.label=String(value||'').trim().slice(0,80)}
function v67673ConfirmGpsName(){const v=v67670ActivityLocation;if(!String(v.label||'').trim()){v.status='Digite um nome para o local antes de confirmar.';v67670RenderLocationHosts();return}v.namingGps=false;v.status=`✓ Local confirmado: ${v.label}`;v67670RenderLocationHosts()}
function v67673GpsNamingMarkup(){const v=v67670ActivityLocation;if(!v.namingGps||v.mode!=='gps'||!Number.isFinite(v.lat)||!Number.isFinite(v.lng))return '';return `<div class="v67673-gps-name"><div class="v67671-quick-title">📌 Nome do local</div><p>Confira o local identificado automaticamente. Você pode editar antes de salvar.</p><input class="v67670-location-input" type="text" maxlength="80" placeholder="Ex.: Academia 2ª CIA/4º BBM - Currais Novos/RN" value="${v67670Esc(v.label||'')}" oninput="v67673GpsNameInput(this.value)"><div class="v67673-gps-meta">GPS: ${Number(v.lat).toFixed(6)}, ${Number(v.lng).toFixed(6)}${v.accuracy?` • ±${v.accuracy} m`:''}</div><button type="button" class="v67672-confirm-map" onclick="v67673ConfirmGpsName()">✓ CONFIRMAR NOME DO LOCAL</button></div>`}
function v67670LocationFields(){const v=v67670ActivityLocation,label=String(v.label||'').trim();return {activityLocationMode:v.mode==='gps'?'gps':(v.mode==='manual'?'manual':null),activityLocationLabel:label||null,activityLocationGps:v.mode==='gps'?{lat:v.lat,lng:v.lng,accuracy:v.accuracy}:null,feedLocation:label||null}}
setTimeout(v67670RenderLocationHosts,0);

let cardioActivityLocation={mode:'',label:'',lat:null,lng:null,accuracy:null};
function isCardioRecord(w){return !!(w&&['treadmill','run','bike','rower','swim'].includes(w.cardioMachine))}


function resetCardioActivityLocation(){
  v67670ResetActivityLocation();
  cardioActivityLocation={mode:'',label:'',lat:null,lng:null,accuracy:null};
  ['cardioLocationText','cardioSwimLocationText'].forEach(id=>{const e=byId(id);if(e)e.value=''});
  ['cardioLocationStatus','cardioSwimLocationStatus'].forEach(id=>{const e=byId(id);if(e)e.textContent='Nenhuma localização adicionada.'});
}
function activeCardioLocationEls(){
  const swim=cardioSelectedMachine==='swim';
  return {input:byId(swim?'cardioSwimLocationText':'cardioLocationText'),status:byId(swim?'cardioSwimLocationStatus':'cardioLocationStatus')};
}
async function captureCardioLocation(){
  // Compatibilidade: qualquer botão legado de Cardio usa o novo fluxo universal com mapa.
  return v67670CaptureLocation();
}
function chooseCardioManualLocation(){
  // Compatibilidade: abre as opções Academia 2ª CIA/4º BBM ou Outro local.
  return v67670ChooseManualLocation();
}
function cardioLocationManualInput(swim=false){const input=byId(swim?'cardioSwimLocationText':'cardioLocationText'),status=byId(swim?'cardioSwimLocationStatus':'cardioLocationStatus');const label=String(input?.value||'').trim();cardioActivityLocation.label=label;if(!cardioActivityLocation.mode)cardioActivityLocation.mode='manual';if(status&&cardioActivityLocation.mode==='manual')status.textContent=label?'✓ Local informado manualmente.':'Nenhuma localização adicionada.';saveNavigationState('cardioWorkout');}
function toggleSwimTypeFields(){
  const type=byId('cardioSwimType')?.value||'pool';
  const pool=byId('cardioPoolFields'),loc=byId('cardioSwimLocation'); if(pool)pool.style.display=type==='pool'?'block':'none';if(loc)loc.style.display='block';
  updateCardioPace();saveNavigationState('cardioWorkout');
}
function updateSwimDistanceFromLaps(){
  const sel=byId('cardioPoolLength')?.value||'25',custom=byId('cardioPoolCustomLength'),wrap=byId('cardioPoolCustomWrap');if(wrap)wrap.style.display=sel==='custom'?'block':'none';
  const len=sel==='custom'?Number(custom?.value||0):Number(sel),laps=Number(byId('cardioPoolLaps')?.value||0),dist=byId('cardioSwimDistance');if(len>0&&laps>0&&dist)dist.value=String(Math.round(len*laps));updateCardioPace();saveNavigationState('cardioWorkout');
}

function cardioResetSavedState(){
  const msg=byId('cardioSavedMessage');
  if(msg){msg.classList.remove('show');msg.style.display='none';msg.textContent='✓ Cardio salvo.'}
  const btn=byId('saveCardioWorkoutBtn');
  if(btn){btn.disabled=false;btn.textContent=cardioSelectedMachine==='swim'?'SALVAR NATAÇÃO':cardioSelectedMachine==='run'?'SALVAR CORRIDA AO AR LIVRE':'SALVAR CARDIO'}
}
function cardioUsesClockInput(){return ['treadmill','run','rower','swim'].includes(cardioSelectedMachine)}
function cardioTimeInput(el){
  if(!el||!cardioUsesClockInput())return;
  const digits=String(el.value||'').replace(/\D/g,'').slice(0,5);
  if(!digits){el.value='';return}
  if(digits.length<=2){el.value=digits;return}
  el.value=`${digits.slice(0,-2)}:${digits.slice(-2)}`;
}
function cardioTimeSeconds(value){
  const raw=String(value??'').trim();
  if(!raw)return 0;
  if(raw.includes(':')){
    const [m,s='0']=raw.split(':');
    const mm=Number(m),ss=Number(s);
    if(!Number.isFinite(mm)||!Number.isFinite(ss)||mm<0||ss<0||ss>59)return 0;
    return Math.round(mm*60+ss);
  }
  const mins=Number(raw);
  return Number.isFinite(mins)&&mins>0?Math.round(mins*60):0;
}
function cardioFormatPace(minutes,distanceKm){
  const mins=cardioTimeSeconds(minutes)/60, km=Number(String(distanceKm??'').replace(',','.'));
  if(!Number.isFinite(mins)||mins<=0||!Number.isFinite(km)||km<=0)return '--:-- min/km';
  const totalSeconds=Math.round((mins*60)/km);
  const paceMin=Math.floor(totalSeconds/60), paceSec=totalSeconds%60;
  return `${paceMin}:${String(paceSec).padStart(2,'0')} min/km`;
}
function updateCardioPace(){
  const el=byId('cardioPace');
  if(el)el.textContent=cardioSelectedMachine==='treadmill'?cardioFormatPace(byId('cardioMinutes')?.value,byId('cardioDistance')?.value):'--:-- min/km';
  const runEl=byId('cardioRunPace');
  if(runEl)runEl.textContent=cardioSelectedMachine==='run'?cardioFormatPace(byId('cardioMinutes')?.value,byId('cardioRunDistance')?.value):'--:-- min/km';
  const rowerEl=byId('cardioRowerPace');
  if(rowerEl){
    const secs=cardioTimeSeconds(byId('cardioMinutes')?.value),meters=Number(byId('cardioRowerDistance')?.value||0);
    if(cardioSelectedMachine==='rower'&&secs>0&&meters>0){const ps=Math.round(secs/(meters/500));rowerEl.textContent=`${Math.floor(ps/60)}:${String(ps%60).padStart(2,'0')} /500 m`;}
    else rowerEl.textContent='--:-- /500 m';
  }
  const swimEl=byId('cardioSwimPace');
  if(swimEl){
    const mins=cardioTimeSeconds(byId('cardioMinutes')?.value)/60,meters=Number(byId('cardioSwimDistance')?.value||0);
    if(cardioSelectedMachine==='swim'&&mins>0&&meters>0){const sec=Math.round(mins*60/(meters/100));swimEl.textContent=`${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')} /100 m`;}
    else swimEl.textContent='--:-- /100 m';
  }
}
function cardioBindInputs(){
  ['cardioMinutes','cardioDistance','cardioCalories','cardioIncline','cardioBikeIntensity','cardioBikeHrAvg','cardioBikeHrMax','cardioBikeCalories','cardioRowerDistance','cardioRowerSpm','cardioRowerCalories','cardioRunDistance','cardioSwimDistance'].forEach(id=>{
    const el=byId(id); if(el)el.oninput=()=>{if(id==='cardioMinutes')cardioTimeInput(el);updateCardioPace();updateCardioRankingHint();saveNavigationState('cardioWorkout')};
  });
  updateCardioPace();
}
function openCardioWorkout(){
  if(!requireServiceChoice())return;
  cardioSelectedMachine='';
  resetCardioActivityLocation();
  document.querySelectorAll('.cardio-machine').forEach(x=>x.classList.remove('selected'));
  const form=byId('cardioFormCard'); if(form)form.style.display='none';
  ['cardioMinutes','cardioDistance','cardioCalories','cardioIncline','cardioBikeIntensity','cardioBikeHrAvg','cardioBikeHrMax','cardioBikeCalories','cardioRowerDistance','cardioRowerSpm','cardioRowerCalories','cardioRunDistance','cardioSwimDistance'].forEach(id=>{const el=byId(id);if(el)el.value=''});
  const bw=byId('cardioBikeWatch');if(bw)bw.checked=false;toggleCardioWatchFields();
  cardioResetSavedState();
  cardioBindInputs();
  showView('cardioWorkout');
  saveNavigationState('cardioWorkout');
}
function toggleCardioWatchFields(){
  const checked=!!byId('cardioBikeWatch')?.checked; const box=byId('cardioBikeWatchFields'); if(box)box.style.display=checked?'block':'none';
  saveNavigationState('cardioWorkout');
}
function selectCardioMachine(machine,restoring=false){
  v67670RenderLocationHosts();
  if(!CARDIO_MACHINE_META[machine])return;
  cardioSelectedMachine=machine;
  document.querySelectorAll('.cardio-machine').forEach(x=>x.classList.toggle('selected',x.dataset.cardio===machine));
  const meta=CARDIO_MACHINE_META[machine];
  const form=byId('cardioFormCard'); if(form)form.style.display='block';
  const title=byId('cardioFormTitle'); if(title)title.textContent=`${meta.icon} ${meta.label}`;
  const treadmill=byId('cardioTreadmillFields'); if(treadmill)treadmill.style.display=machine==='treadmill'?'block':'none';
  const bike=byId('cardioBikeFields'); if(bike)bike.style.display=machine==='bike'?'block':'none';
  const rower=byId('cardioRowerFields'); if(rower)rower.style.display=machine==='rower'?'block':'none';
  const run=byId('cardioRunFields'); if(run)run.style.display=machine==='run'?'block':'none';
  const swim=byId('cardioSwimFields'); if(swim)swim.style.display=machine==='swim'?'block':'none';
  if(machine!=='treadmill'){ const d=byId('cardioDistance'),c=byId('cardioCalories'); if(d)d.value=''; if(c)c.value=''; }
  if(machine!=='run'){const rd=byId('cardioRunDistance');if(rd)rd.value='';}
  if(machine!=='swim'){const sd=byId('cardioSwimDistance');if(sd)sd.value='';}
  if(machine==='swim')toggleSwimTypeFields();
  const timeInput=byId('cardioMinutes');
  const timeLabel=timeInput?.closest('label');
  if(timeInput){
    if(cardioUsesClockInput()){timeInput.type='text';timeInput.inputMode='numeric';timeInput.maxLength=6;timeInput.placeholder='Ex.: 2530 → 25:30';}
    else{timeInput.type='number';timeInput.inputMode='numeric';timeInput.removeAttribute('maxlength');timeInput.placeholder='Ex.: 30';}
  }
  if(timeLabel&&timeLabel.firstChild)timeLabel.firstChild.textContent=cardioUsesClockInput()?'Tempo (min:ss)':'Tempo (minutos)';
  cardioResetSavedState();
  cardioBindInputs();
  updateCardioPace();
  updateCardioRankingHint();
  if(!restoring){saveNavigationState('cardioWorkout');form?.scrollIntoView({behavior:'smooth',block:'start'})}
}
function updateCardioRankingHint(){
  const hint=byId('cardioRankingHint'); if(!hint)return;
  const seconds=cardioTimeSeconds(byId('cardioMinutes')?.value);
  const minutes=seconds/60;
  if(cardioSelectedMachine==='swim'){hint.className='cardio-ranking-hint';hint.textContent='🏊 Natação é registrada no Histórico, Evolução e Feed, mas não pontua no Ranking de Frequência.';return;}
  if(cardioSelectedMachine==='run'){hint.className='cardio-ranking-hint';hint.textContent='🏃‍♂️ Corrida ao ar livre é registrada no Histórico, Evolução e Feed, mas não pontua no Ranking de Frequência.';return;}
  if(minutes>=30){
    hint.className='cardio-ranking-hint eligible';
    hint.textContent=v66WorkoutServiceDay===true
      ? '✓ Critério de tempo atingido. O Cardio pode gerar 1 ponto se esta validação ainda não tiver pontuado com outro treino principal.'
      : '✓ Critério de tempo atingido. Esta atividade será registrada, mas não pontuará no Ranking.';
  }else{
    hint.className='cardio-ranking-hint';
    hint.textContent=`Mínimo de 30 minutos para pontuar${seconds>0?` • faltam ${Math.max(0,Math.ceil((1800-seconds)/60))} min`:'.'}`;
  }
}
function restoreCardioWorkoutV6733(state){
  if(state && (state.serviceDay===true || state.serviceDay===false)){
    v66WorkoutServiceDay=state.serviceDay;
    sessionStorage.setItem(V66_SERVICE_KEY,v66WorkoutServiceDay?'1':'0');
  }
  showView('cardioWorkout');
  cardioResetSavedState();
  cardioBindInputs();
  cardioSelectedMachine='';
  document.querySelectorAll('.cardio-machine').forEach(x=>x.classList.remove('selected'));
  const form=byId('cardioFormCard'); if(form)form.style.display='none';
  if(state?.cardioMachine && CARDIO_MACHINE_META[state.cardioMachine]){
    selectCardioMachine(state.cardioMachine,true);
    const m=byId('cardioMinutes'),d=byId('cardioDistance'),c=byId('cardioCalories');
    if(m)m.value=state.cardioMinutes||'';
    if(d)d.value=state.cardioDistance||'';
    if(c)c.value=state.cardioCalories||'';
    const ci=byId('cardioIncline');if(ci)ci.value=state.cardioIncline||'';
    const bi=byId('cardioBikeIntensity');if(bi)bi.value=state.cardioBikeIntensity||'';
    const bw=byId('cardioBikeWatch');if(bw)bw.checked=state.cardioBikeWatch===true;
    const bha=byId('cardioBikeHrAvg');if(bha)bha.value=state.cardioBikeHrAvg||'';
    const bhm=byId('cardioBikeHrMax');if(bhm)bhm.value=state.cardioBikeHrMax||'';
    const bkc=byId('cardioBikeCalories');if(bkc)bkc.value=state.cardioBikeCalories||'';
    const rdist=byId('cardioRowerDistance');if(rdist)rdist.value=state.cardioRowerDistance||'';
    const rspm=byId('cardioRowerSpm');if(rspm)rspm.value=state.cardioRowerSpm||'';
    const rcal=byId('cardioRowerCalories');if(rcal)rcal.value=state.cardioRowerCalories||'';
    toggleCardioWatchFields();
    const rd=byId('cardioRunDistance');if(rd)rd.value=state.cardioRunDistance||'';
    const sd=byId('cardioSwimDistance');if(sd)sd.value=state.cardioSwimDistance||'';
    const st=byId('cardioSwimType');if(st)st.value=state.cardioSwimType||'pool';
    const pl=byId('cardioPoolLength');if(pl)pl.value=state.cardioPoolLength||'25';
    const pc=byId('cardioPoolCustomLength');if(pc)pc.value=state.cardioPoolCustomLength||'';
    const laps=byId('cardioPoolLaps');if(laps)laps.value=state.cardioPoolLaps||'';
    const rl=byId('cardioLocationText');if(rl)rl.value=state.cardioLocationText||'';
    const sl=byId('cardioSwimLocationText');if(sl)sl.value=state.cardioSwimLocationText||'';
    toggleSwimTypeFields();updateSwimDistanceFromLaps();
    updateCardioPace();
    updateCardioRankingHint();
  }
}
function saveCardioWorkout(){
  if(!requireServiceChoice())return;
  const machine=cardioSelectedMachine, meta=CARDIO_MACHINE_META[machine];
  if(!meta){alert('Escolha o equipamento de cardio.');return}
  const durationSeconds=cardioTimeSeconds(byId('cardioMinutes')?.value);
  if(!Number.isFinite(durationSeconds)||durationSeconds<60){alert(cardioUsesClockInput()?'Informe o tempo da atividade. Ex.: 2530 para 25:30.':'Informe o tempo da atividade em minutos.');return}
  const minutes=durationSeconds/60;
  const durationMinutes=Math.floor(minutes);
  let distance=null,runDistance=null,calories=null,swimMeters=null,swimType='pool',incline=null,bikeIntensity='',bikeWatch=false,bikeHrAvg=null,bikeHrMax=null,bikeCalories=null,rowerMeters=null,rowerSpm=null,rowerCalories=null;
  if(machine==='run'){runDistance=Number(String(byId('cardioRunDistance')?.value||'').replace(',','.'));if(!Number.isFinite(runDistance)||runDistance<=0){alert('Informe a distância percorrida na corrida ao ar livre.');return}}
  if(machine==='swim'){swimType=String(byId('cardioSwimType')?.value||'pool');swimMeters=Number(byId('cardioSwimDistance')?.value||0);if(!Number.isFinite(swimMeters)||swimMeters<=0){alert('Informe a distância nadada em metros.');return}}
  if(machine==='treadmill'){
    distance=Number(String(byId('cardioDistance')?.value||'').replace(',','.'));
    calories=Number(byId('cardioCalories')?.value||0); incline=Number(String(byId('cardioIncline')?.value||'').replace(',','.'));
    if(!Number.isFinite(distance)||distance<=0){alert('Informe a distância percorrida na esteira.');return}
  }
  if(machine==='bike'){
    bikeIntensity=String(byId('cardioBikeIntensity')?.value||''); if(!bikeIntensity){alert('Informe a intensidade predominante da bicicleta.');return}
    bikeWatch=!!byId('cardioBikeWatch')?.checked; bikeHrAvg=Number(byId('cardioBikeHrAvg')?.value||0); bikeHrMax=Number(byId('cardioBikeHrMax')?.value||0); bikeCalories=Number(byId('cardioBikeCalories')?.value||0);
  }
  if(machine==='rower'){
    rowerMeters=Number(byId('cardioRowerDistance')?.value||0); if(!Number.isFinite(rowerMeters)||rowerMeters<=0){alert('Informe a distância percorrida no simulador de remo.');return}
    rowerSpm=Number(byId('cardioRowerSpm')?.value||0); rowerCalories=Number(byId('cardioRowerCalories')?.value||0);
  }
  const ended=new Date();
  const record={
    atividadeId:v67383NewActivityId(),
    date:ended.toISOString(),startedAt:new Date(ended.getTime()-durationSeconds*1000).toISOString(),
    plan:`Cardio — ${meta.label}`,duration:durationMinutes,cardioDurationSeconds:durationSeconds,
    exercisesPlanned:0,exercisesDone:0,sets:0,reps:0,volume:0,byExercise:[],
    // Compatibilidade com o ranking em nuvem: cardio usa a estrutura de treino livre,
    // mas só recebe serviceDay=true quando atingir os 30 min exigidos.
    schemaVersion:67383,excludedFromStats:false,workoutType:'cardio',rankingCategory:'cardio',muscleGroups:['Cardio'],cardioMachine:machine,
    cardioDistanceKm:machine==='treadmill'?Math.round(distance*100)/100:(machine==='run'?Math.round(runDistance*100)/100:(machine==='swim'?Math.round(swimMeters)/1000:null)),
    swimDistanceMeters:machine==='swim'?Math.round(swimMeters):null,
    swimType:machine==='swim'?swimType:null,
    poolLengthMeters:machine==='swim'&&swimType==='pool'?Number((byId('cardioPoolLength')?.value==='custom'?byId('cardioPoolCustomLength')?.value:byId('cardioPoolLength')?.value)||0)||null:null,
    poolLaps:machine==='swim'&&swimType==='pool'?Number(byId('cardioPoolLaps')?.value||0)||null:null,
    ...v67670LocationFields(),
    swimPaceSecondsPer100m:machine==='swim'?Math.round(durationSeconds/(swimMeters/100)):null,
    cardioCalories:machine==='treadmill'&&calories>0?Math.round(calories):(machine==='rower'&&rowerCalories>0?Math.round(rowerCalories):(machine==='bike'&&bikeCalories>0?Math.round(bikeCalories):null)),
    cardioInclinePercent:machine==='treadmill'&&Number.isFinite(incline)&&incline>=0?incline:null,
    bikeIntensity:machine==='bike'?bikeIntensity:null,bikeSmartwatch:machine==='bike'?bikeWatch:null,
    bikeHrAvg:machine==='bike'&&bikeHrAvg>0?Math.round(bikeHrAvg):null,bikeHrMax:machine==='bike'&&bikeHrMax>0?Math.round(bikeHrMax):null,
    rowerDistanceMeters:machine==='rower'?Math.round(rowerMeters):null,rowerPaceSecondsPer500m:machine==='rower'?Math.round(durationSeconds/(rowerMeters/500)):null,rowerSpm:machine==='rower'&&rowerSpm>0?Math.round(rowerSpm):null,
    cardioPaceSecondsPerKm:machine==='treadmill'?Math.round(durationSeconds/distance):(machine==='run'?Math.round(durationSeconds/runDistance):null),
    cardioEligible:!['swim','run'].includes(machine)&&durationSeconds>=1800,cardioServiceDay:!['swim','run'].includes(machine)&&v66WorkoutServiceDay===true,
    serviceDay:!['swim','run'].includes(machine)&&v66WorkoutServiceDay===true && durationSeconds>=1800,
    // V67.37 — identifica de forma única a janela de validação operacional.
    // Todas as modalidades usam a mesma serviceWindowKey. Na V67.39, a janela inteira
    // pode gerar no máximo 1 ponto, independentemente de ser Treino ou Cardio.
    serviceValidatedAt:(v66WorkoutServiceDay===true&&serviceValidationStatus?.validatedAt)||null,
    serviceExpiresAt:(v66WorkoutServiceDay===true&&serviceValidationStatus?.expiresAt)||null,
    serviceWindowKey:v66WorkoutServiceDay===true
      ? serviceOperationalWindowKey(ended)
      : null
  };
  const wh=workoutHistory(); wh.unshift(record); saveWorkoutHistory(wh);
  localStorage.setItem('t2_last',`${record.plan} • ${durationMinutes} min`);
  v6738QueueFeedActivity(record);
  showWorkoutSavedMessage();
  setTimeout(()=>v6750ShowPostWorkout(record),120);
  try{updateLast()}catch(e){}
  if(typeof cloudPushNow==='function'&&cloudSession?.token&&navigator.onLine)setTimeout(()=>cloudPushNow(),50);
  const msg=byId('cardioSavedMessage');
  if(msg){
    const eligible=!['swim','run'].includes(machine)&&durationSeconds>=1800&&v66WorkoutServiceDay===true;
    msg.textContent=machine==='run'
      ? '✓ Corrida ao ar livre salva. Esta atividade será registrada, mas não pontuará no Ranking.'
      : machine==='swim'
        ? '✓ Natação salva. Esta atividade será registrada, mas não pontuará no Ranking.'
        : eligible
          ? '✓ Cardio salvo. Com 30 minutos ou mais, pode gerar 1 ponto se esta validação ainda não tiver pontuado com outro treino principal.'
          : durationSeconds>=1800
            ? '✓ Cardio salvo. Esta atividade será registrada, mas não pontuará no Ranking.'
            : '✓ Cardio salvo. Com menos de 30 minutos, a atividade fica no histórico, mas não gera ponto.';
    msg.style.display='block';msg.classList.add('show');msg.style.visibility='visible';msg.style.opacity='1';
  }
  const btn=byId('saveCardioWorkoutBtn'); if(btn){btn.textContent=machine==='run'?'✓ CORRIDA AO AR LIVRE SALVA':machine==='swim'?'✓ NATAÇÃO SALVA':'✓ CARDIO SALVO';btn.disabled=true}
  ['cardioMinutes','cardioDistance','cardioCalories','cardioIncline','cardioBikeIntensity','cardioBikeHrAvg','cardioBikeHrMax','cardioBikeCalories','cardioRowerDistance','cardioRowerSpm','cardioRowerCalories','cardioRunDistance','cardioSwimDistance'].forEach(id=>{const el=byId(id);if(el)el.value=''});
  const bw2=byId('cardioBikeWatch');if(bw2)bw2.checked=false;toggleCardioWatchFields();
  updateCardioRankingHint();
  requestAnimationFrame(()=>msg?.scrollIntoView({behavior:'smooth',block:'center'}));
}

function openReadyPlans(){
  if(!requireServiceChoice())return;
  openPlans('ready');
}
function openPersonalizedWorkouts(){
  if(!requireServiceChoice())return;
  openPlans('custom');
}
function freeNorm(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function freeGroupsSelected(){return [...document.querySelectorAll('#freeMuscleGroups .free-muscle.selected')].map(x=>x.dataset.group)}
function freeExerciseMatchesGroup(ex,group){
  if(group==='Corpo inteiro')return true;
  const eg=freeNorm(ex?.group), aliases=FREE_GROUP_ALIASES[group]||[freeNorm(group)];
  return aliases.some(a=>eg.includes(freeNorm(a)));
}
function freeExerciseKey(name){return freeNorm(name).replace(/[^a-z0-9]+/g,'_')}
function toggleFreeMuscle(btn){
  btn.classList.toggle('selected');
  renderFreeExercises(); updateFreeEligibility(); saveNavigationState('freeWorkout');
}
function freeExerciseChanged(key){
  const row=document.querySelector(`.free-exercise-row[data-key="${CSS.escape(key)}"]`); if(!row)return;
  const checked=row.querySelector('.free-ex-check')?.checked===true;
  const name=row.dataset.name||'';
  const custom=row.dataset.custom==='1';
  freeWorkoutExerciseState[key]={checked,name,custom,customName:row.querySelector('.free-custom-name')?.value||'',sets:row.querySelector('.free-sets')?.value||'',reps:row.querySelector('.free-reps')?.value||'',weight:row.querySelector('.free-weight')?.value||''};
  row.classList.toggle('selected',checked);
  row.querySelectorAll('.free-ex-fields input').forEach(i=>i.disabled=!checked);
  updateFreeEligibility(); saveNavigationState('freeWorkout');
}
function v67678FreeLastSetHtml(name,key,checked){
  const row=v67678LastValidSet(name,null); if(!row)return '';
  const w=Number(row.weight||0), r=Number(row.reps||0);
  const d=row.date?new Date(row.date):null, when=d&&!Number.isNaN(d.getTime())?d.toLocaleDateString('pt-BR'):'';
  return `<div class="free-last-set"><span>↶ ÚLTIMO: <b>${v67678FormatLastSet(row)}</b>${when?` • ${when}`:''}</span><button type="button" ${checked?'':'disabled'} onclick="v67678UseFreeLastSet('${key}',${w},${r})">USAR</button></div>`;
}
function v67678UseFreeLastSet(key,weight,reps){
  const row=document.querySelector(`.free-exercise-row[data-key="${CSS.escape(key)}"]`); if(!row)return;
  if(Number(weight)>0)row.querySelector('.free-weight').value=weight;
  if(Number(reps)>0)row.querySelector('.free-reps').value=reps;
  freeExerciseChanged(key);
}
window.v67678UseFreeLastSet=v67678UseFreeLastSet;
function freeExerciseRow(name,custom=false){
  const key=custom?'__outro__':freeExerciseKey(name), st=freeWorkoutExerciseState[key]||{};
  const checked=st.checked===true;
  return `<div class="free-exercise-row${checked?' selected':''}" data-key="${key}" data-name="${String(name).replaceAll('"','&quot;')}" data-custom="${custom?'1':'0'}">
    <label class="free-exercise-check"><input class="free-ex-check" type="checkbox" ${checked?'checked':''} onchange="freeExerciseChanged('${key}')"><span>${custom?'＋ Outro exercício':name}</span></label>
    <div class="free-ex-fields">
      ${custom?`<label class="free-custom-label">Nome<input class="free-custom-name" type="text" maxlength="80" placeholder="Digite o exercício" value="${String(st.customName||'').replaceAll('"','&quot;')}" ${checked?'':'disabled'} oninput="freeExerciseChanged('${key}')"></label>`:''}
      <label>Séries<input class="free-sets" type="number" min="1" max="99" inputmode="numeric" value="${st.sets||''}" ${checked?'':'disabled'} oninput="freeExerciseChanged('${key}')"></label>
      <label>Repetições<input class="free-reps" type="number" min="1" max="999" inputmode="numeric" value="${st.reps||''}" ${checked?'':'disabled'} oninput="freeExerciseChanged('${key}')"></label>
      <label>Carga (kg)<input class="free-weight" type="number" min="0" step="0.5" inputmode="decimal" placeholder="Opcional" value="${st.weight||''}" ${checked?'':'disabled'} oninput="freeExerciseChanged('${key}')"></label>
    </div>
    ${!custom?v67678FreeLastSetHtml(name,key,checked):''}
  </div>`;
}
function renderFreeExercises(){
  const groups=freeGroupsSelected(), card=byId('freeExerciseCard'), list=byId('freeExerciseList'); if(!card||!list)return;
  if(!groups.length){card.style.display='none';list.innerHTML='';return}
  const all=Array.isArray(DATA?.exercises)?DATA.exercises:[];
  const exercises=all.filter(ex=>groups.some(g=>freeExerciseMatchesGroup(ex,g))).filter((ex,i,a)=>a.findIndex(y=>y.name===ex.name)===i).sort((a,b)=>String(a.name).localeCompare(String(b.name),'pt-BR'));
  card.style.display='block';
  list.innerHTML=(exercises.length?exercises.map(ex=>freeExerciseRow(ex.name)).join(''):'<p class="free-note">Nenhum exercício cadastrado para este grupo. Use “Outro exercício”.</p>')+freeExerciseRow('Outro exercício',true);
}
function collectFreeExercises(){
  const out=[];
  document.querySelectorAll('#freeExerciseList .free-exercise-row').forEach(row=>{
    if(row.querySelector('.free-ex-check')?.checked!==true)return;
    const custom=row.dataset.custom==='1';
    const name=(custom?row.querySelector('.free-custom-name')?.value:row.dataset.name||'').trim();
    const sets=Number(row.querySelector('.free-sets')?.value||0), reps=Number(row.querySelector('.free-reps')?.value||0), weight=Number(String(row.querySelector('.free-weight')?.value||0).replace(',','.'))||0;
    out.push({name,sets,reps,weight,volume:weight>0&&sets>0&&reps>0?weight*sets*reps:0,valid:!!name&&sets>=1&&reps>=1});
  });
  return out;
}
function freeEligibility(){
  const groups=freeGroupsSelected(), minutes=Number(byId('freeWorkoutMinutes')?.value||0), exercises=collectFreeExercises(), validExercises=exercises.filter(x=>x.valid);
  return {groups,minutes,exercises,validExercises,eligible:groups.length>=1&&minutes>=20&&validExercises.length>=1};
}
function updateFreeEligibility(){
  const el=byId('freeWorkoutEligibility'); if(!el)return; const x=freeEligibility();
  const missing=[]; if(!x.groups.length)missing.push('selecione 1 grupo muscular'); if(x.minutes<20)missing.push('complete 20 minutos'); if(!x.validExercises.length)missing.push('registre 1 exercício com séries e repetições');
  el.className='free-eligibility'+(x.eligible?' eligible':'');
  el.textContent=x.eligible?'✓ Requisitos mínimos do Treino Livre atingidos.':`Para pontuar: ${missing.join(' • ')}.`;
}
function openFreeWorkout(){
  v67670ResetActivityLocation();
  if(!requireServiceChoice())return;
  freeWorkoutExerciseState={};
  const savedMsg=byId('freeWorkoutSavedMessage'); if(savedMsg){savedMsg.classList.remove('show');savedMsg.style.display='none';savedMsg.textContent='✓ Treino salvo.'}
  const summary=byId('freeWorkoutSummary'); if(summary){summary.style.display='none';summary.innerHTML=''}
  const saveBtn=byId('saveFreeWorkoutBtn'); if(saveBtn){saveBtn.disabled=false;saveBtn.textContent='SALVAR TREINO LIVRE'}
  const box=byId('freeMuscleGroups'); if(box)box.innerHTML=V66_FREE_GROUPS.map(g=>`<button type="button" class="free-muscle" data-group="${g}" onclick="toggleFreeMuscle(this)">${g}</button>`).join('');
  const mins=byId('freeWorkoutMinutes'); if(mins){mins.value='';mins.oninput=()=>{updateFreeEligibility();saveNavigationState('freeWorkout')}}
  renderFreeExercises(); updateFreeEligibility(); showView('freeWorkout');
}
let v67605FreeWorkoutSaving=false;
function saveFreeWorkout(){
  if(v67605FreeWorkoutSaving)return;
  if(!requireServiceChoice())return;
  const x=freeEligibility(), groups=x.groups, minutes=x.minutes;
  if(!groups.length){alert('Selecione pelo menos um grupo muscular.');return}
  if(!Number.isFinite(minutes)||minutes<1){alert('Informe o tempo do treino em minutos.');return}
  if(!x.exercises.length){alert('Marque pelo menos um exercício realizado.');return}
  const invalid=x.exercises.find(e=>!e.valid);
  if(invalid){alert('Preencha o nome (quando for Outro), as séries e as repetições de todos os exercícios marcados.');return}

  v67605FreeWorkoutSaving=true;
  const earlySaveBtn=byId('saveFreeWorkoutBtn'); if(earlySaveBtn){earlySaveBtn.disabled=true;earlySaveBtn.textContent='SALVANDO…'}
  const ended=new Date(), wh=workoutHistory();
  const totalSets=x.validExercises.reduce((a,e)=>a+e.sets,0), totalReps=x.validExercises.reduce((a,e)=>a+(e.sets*e.reps),0), totalVolume=x.validExercises.reduce((a,e)=>a+e.volume,0);
  const byExercise=x.validExercises.map(e=>({name:e.name,sets:e.sets,reps:e.sets*e.reps,volume:e.volume,maxWeight:e.weight||0,weight:e.weight||0,repsPerSet:e.reps}));
  const record={
    atividadeId:v67383NewActivityId(),date:ended.toISOString(),startedAt:new Date(ended.getTime()-minutes*60000).toISOString(),
    plan:'Treino livre — '+groups.join(' + '),duration:minutes,exercisesPlanned:x.validExercises.length,exercisesDone:x.validExercises.length,sets:totalSets,reps:totalReps,volume:totalVolume,byExercise,
    schemaVersion:67640,excludedFromStats:false,workoutType:'free',muscleGroups:groups,freeWorkoutEligible:x.eligible,
    ...v67670LocationFields(),
    serviceDay:v66WorkoutServiceDay===true,serviceValidatedAt:(v66WorkoutServiceDay===true&&serviceValidationStatus?.validatedAt)||null,serviceExpiresAt:(v66WorkoutServiceDay===true&&serviceValidationStatus?.expiresAt)||null,
    serviceWindowKey:v66WorkoutServiceDay===true?serviceOperationalWindowKey(ended):null
  };
  // V67.67.8 — Treino Livre também alimenta a memória de carga/repetições por exercício.
  try{
    const sh=history();
    x.validExercises.forEach(e=>{for(let n=1;n<=e.sets;n++)sh.unshift({date:ended.toISOString(),group:groups.join(' + '),exercise:e.name,set:n,weight:Number(e.weight||0),reps:Number(e.reps||0),plan:record.plan});});
    saveHistory(sh);
  }catch(e){console.warn('Memória de carga do treino livre:',e)}
  wh.unshift(record);saveWorkoutHistory(wh);localStorage.setItem('t2_last',`${record.plan} • ${minutes} min`);v6738QueueFeedActivity(record);setTimeout(()=>v6750ShowPostWorkout(record),120);showWorkoutSavedMessage();
  try{updateLast()}catch(e){console.warn('updateLast:',e)}
  if(typeof cloudPushNow==='function'&&cloudSession?.token&&navigator.onLine)setTimeout(()=>cloudPushNow(),50);

  const presence=v66WorkoutServiceDay===true;
  const pointsEligible=x.eligible&&presence;
  const savedMsg=byId('freeWorkoutSavedMessage');
  if(savedMsg){savedMsg.textContent=pointsEligible?'✓ Treino salvo. Requisitos mínimos atingidos para pontuação.':'✓ Treino salvo. Não elegível para pontuação.';savedMsg.classList.add('show');savedMsg.style.display='block';savedMsg.style.visibility='visible';savedMsg.style.opacity='1'}
  const summary=byId('freeWorkoutSummary');
  if(summary){
    const exerciseHtml=x.validExercises.map(e=>`<li><b>${e.name}</b><span>${e.sets} × ${e.reps}${e.weight>0?` • ${e.weight} kg`:''}</span></li>`).join('');
    const reason=!x.eligible?(minutes<20?'Tempo mínimo de 20 minutos não atingido.':'Requisitos mínimos não atingidos.') : !presence?'Presença operacional não validada.':'';
    summary.innerHTML=`<span class="eyebrow">RESUMO DO TREINO</span><h3>Treino Livre concluído 💪</h3><div class="free-summary-stats"><div><b>${minutes}</b><span>min</span></div><div><b>${groups.length}</b><span>grupos</span></div><div><b>${x.validExercises.length}</b><span>exercícios</span></div><div><b>${totalSets}</b><span>séries</span></div></div><p><b>Grupos:</b> ${groups.join(' • ')}</p><ul>${exerciseHtml}</ul><p><b>Repetições totais:</b> ${totalReps}</p>${totalVolume>0?`<p><b>Volume com carga informada:</b> ${totalVolume.toLocaleString('pt-BR',{maximumFractionDigits:1})} kg</p>`:''}<div class="free-summary-status ${pointsEligible?'ok':'no'}">${pointsEligible?'🏆 Elegível para pontuação no Ranking':'Não elegível para pontuação'+(reason?` • ${reason}`:'')}</div>`;
    summary.style.display='block';
  }
  const saveBtn=byId('saveFreeWorkoutBtn'); if(saveBtn){saveBtn.textContent='✓ TREINO SALVO';saveBtn.disabled=true}
  requestAnimationFrame(()=>summary?.scrollIntoView({behavior:'smooth',block:'start'}));
  setTimeout(()=>{v67605FreeWorkoutSaving=false},500);
}
function v66ServiceDayForActiveWorkout(){
  if(v66WorkoutServiceDay===null){
    const s=sessionStorage.getItem(V66_SERVICE_KEY);
    if(s==='1'||s==='0')v66WorkoutServiceDay=s==='1';
  }
  return v66WorkoutServiceDay===true;
}

/* ===== V67.67.5 — RECONCILIAÇÃO DA PRESENÇA NA CONCLUSÃO =====
   A fonte final é a validação do servidor na mesma janela 07h→07h.
   Isso evita perder pontuação quando o treino foi iniciado antes da validação
   ou quando o estado local foi restaurado como false durante a navegação. */
async function v67675ResolveServicePresence(ended=new Date()){
  const endKey=serviceOperationalWindowKey(ended);
  // Respeita somente uma escolha OFF explícita ainda ativa nesta sessão.
  if(serviceActivityMode==='off')return {valid:false,validatedAt:null,expiresAt:null,windowKey:null};
  let st=serviceValidationStatus||{};
  if(cloudSession?.token && navigator.onLine){
    try{ st=await refreshServiceValidationStatus(); }catch(e){ console.warn('v67675 refresh presence:',e); }
  }
  const validatedAt=st?.validatedAt||null;
  const sameWindow=st?.valid===true && validatedAt && serviceOperationalWindowKey(new Date(validatedAt))===endKey;
  const valid=!!sameWindow;
  if(valid){
    v66WorkoutServiceDay=true;
    try{sessionStorage.setItem(V66_SERVICE_KEY,'1')}catch(e){}
    if(serviceActivityMode===null)serviceActivityMode='operational';
  }
  return {valid,validatedAt:valid?validatedAt:null,expiresAt:valid?(st?.expiresAt||null):null,windowKey:valid?endKey:null};
}
function openPlans(mode='all'){
  if(mode!=='all'&&!requireServiceChoice())return;
  const grid=byId('planGrid');
  const customLabel=document.querySelector('#plans .custom-label');
  const customBox=byId('customPlanList');
  const build=document.querySelector('#plans .build-workout-cta');
  const readyLabel=document.querySelector('#plans .section-label:not(.custom-label)');
  const title=byId('plansModeTitle');

  if(mode==='custom'){
    if(title)title.textContent='Treino personalizado';
    if(grid)grid.style.display='none';
    if(readyLabel)readyLabel.style.display='none';
    if(build)build.style.display='';
    if(customLabel)customLabel.style.display='';
    if(customBox)customBox.style.display='';
  }else if(mode==='ready'){
    if(title)title.textContent='Treino pronto';
    if(grid)grid.style.display='';
    if(readyLabel)readyLabel.style.display='';
    if(build)build.style.display='none';
    if(customLabel)customLabel.style.display='none';
    if(customBox)customBox.style.display='none';
  }else{
    if(title)title.textContent='Treinos';
    if(grid)grid.style.display='';
    if(readyLabel)readyLabel.style.display='';
    if(build)build.style.display='';
    if(customLabel)customLabel.style.display='';
    if(customBox)customBox.style.display='';
  }

  grid.innerHTML=Object.entries(DATA.plans).map(([name,list],idx)=>`
    <button class="rowbtn plan-btn" data-plan-index="${idx}">
      <b>${name}</b><span>${list.length} exercícios</span><small class="v6742-last-plan">${v6742LastPlanInfo(name)}</small>
    </button>`).join('');
  const names=Object.keys(DATA.plans);
  grid.querySelectorAll('.plan-btn').forEach(btn=>{
    btn.onclick=()=>openPlan(names[Number(btn.dataset.planIndex)]);
  });
  renderPlansWithCustom();
  showView('plans');
}
function openPlan(name){
  const plan = DATA.plans[name];
  if(!plan){
    alert('Não foi possível abrir este treino.');
    return;
  }
  currentListMode='plan';
  activePlanName=name;
  activePlanExercises=plan.map(exByName).filter(Boolean);
  activePlanIndex=-1;
  byId('listTitle').textContent=name;
  renderExerciseButtons(activePlanExercises);
  const startBox=byId('planStartBox');
  if(startBox) startBox.innerHTML=`<button type="button" class="big red plan-start" onclick="startPlanWorkout(); return false;">▶ INICIAR ${name.split('—')[0].trim()}</button><small>${activePlanExercises.length} exercícios • registro série por série</small>`;
  showView('list');
}
function goListBack(){showView(currentListMode==="plan"?"plans":"groups")}
function renderExerciseButtons(list){
  byId('exerciseList').innerHTML=list.map((x,i)=>`<button class="rowbtn" onclick="${currentListMode==='plan'?`openPlanExercise(${i})`:`openExercise(${x.id})`}"><b>${i+1}. ${x.name}</b><span>${x.customMethodLabel?`⚙ ${x.customMethodLabel} • `:''}${x.sets} séries • ${x.reps} • descanso ${x.rest}s</span></button>`).join('');
}

/* ===== V67.60.5 — PAUSAR / RETOMAR / CANCELAR TREINO ===== */
function v67604ActivePlanState(){
  try{
    const x=JSON.parse(localStorage.getItem('t2_active_plan')||'null');
    return x&&x.name&&x.startedAt?x:null;
  }catch(e){return null}
}
function v67603ActivePlanState(){return v67604ActivePlanState()}

function v67604SaveActivePlanState(extra={}){
  if(!activePlanName || activePlanIndex<0 || !workoutStartedAt)return;
  const old=v67604ActivePlanState()||{};
  const exerciseId=currentExercise?.id ?? activePlanExercises[activePlanIndex]?.id ?? old.currentExerciseId ?? null;
  const state={
    ...old,
    name:activePlanName,
    index:activePlanIndex,
    startedAt:workoutStartedAt,
    serviceDay:v66ServiceDayForActiveWorkout(),
    currentExerciseId:exerciseId,
    currentSet:Math.max(1,Number(currentSet)||1),
    status:old.status||'running',
    pausedAt:old.pausedAt||null,
    pausedTotalMs:Math.max(0,Number(old.pausedTotalMs)||0),
    updatedAt:new Date().toISOString(),
    ...extra
  };
  try{localStorage.setItem('t2_active_plan',JSON.stringify(state))}catch(e){}
  if(typeof cloudScheduleSync==='function')cloudScheduleSync();
  v67604RenderActiveWorkoutCard();
}
function v67603SaveActivePlanState(){v67604SaveActivePlanState()}

function v67604PlanExercises(name){
  if(DATA.plans[name])return DATA.plans[name].map(exByName).filter(Boolean);
  if(String(name||'').startsWith('Personalizado — ')){
    const customName=String(name).replace(/^Personalizado — /,'');
    const w=getCustomWorkouts().find(x=>x.name===customName);
    return w?w.exercises.map(customWorkoutExercise).filter(Boolean):[];
  }
  return [];
}
function v67604LoadActivePlanContext(saved){
  if(!saved)return false;
  activePlanName=String(saved.name||'');
  activePlanExercises=v67604PlanExercises(activePlanName);
  if(!activePlanExercises.length)return false;
  activePlanIndex=Math.max(0,Math.min(Number(saved.index)||0,activePlanExercises.length-1));
  workoutStartedAt=saved.startedAt||null;
  if(typeof saved.serviceDay==='boolean'){
    v66WorkoutServiceDay=saved.serviceDay;
    try{sessionStorage.setItem(V66_SERVICE_KEY,saved.serviceDay?'1':'0')}catch(e){}
  }
  const targetId=saved.currentExerciseId ?? activePlanExercises[activePlanIndex]?.id;
  const targetIndex=activePlanExercises.findIndex(x=>String(x.id)===String(targetId));
  if(targetIndex>=0)activePlanIndex=targetIndex;
  return true;
}
function v67604EffectiveElapsedMs(saved=v67604ActivePlanState(), now=Date.now()){
  if(!saved?.startedAt)return 0;
  const started=new Date(saved.startedAt).getTime();
  if(!Number.isFinite(started))return 0;
  let paused=Math.max(0,Number(saved.pausedTotalMs)||0);
  if(saved.status==='paused'&&saved.pausedAt){
    const p=new Date(saved.pausedAt).getTime();
    if(Number.isFinite(p))paused+=Math.max(0,now-p);
  }
  return Math.max(0,now-started-paused);
}
function v67604FormatDuration(ms){
  const min=Math.max(0,Math.floor(ms/60000));
  const h=Math.floor(min/60),m=min%60;
  return h?`${h}h ${String(m).padStart(2,'0')}min`:`${m} min`;
}
function v67604RenderActiveWorkoutCard(){
  const host=byId('v67604ActiveWorkoutCard');
  if(!host)return;
  const saved=v67604ActivePlanState();
  if(!saved){host.style.display='none';host.innerHTML='';return}
  const exs=v67604PlanExercises(saved.name);
  const idx=Math.max(0,Math.min(Number(saved.index)||0,Math.max(0,exs.length-1)));
  const ex=exs[idx];
  const paused=saved.status==='paused';
  host.style.display='block';
  host.innerHTML=`<div class="v67604-active-head"><span>${paused?'⏸':'🏋️'}</span><div><small>${paused?'TREINO PAUSADO':'TREINO EM ANDAMENTO'}</small><b>${escapeHtml(saved.name)}</b></div></div>
    <div class="v67604-active-meta"><span>${ex?`Exercício ${idx+1} de ${exs.length} • ${escapeHtml(ex.name)}`:'Progresso preservado'}</span><span>Série ${Math.max(1,Number(saved.currentSet)||1)} • ${v67604FormatDuration(v67604EffectiveElapsedMs(saved))} efetivos</span></div>
    <div class="v67604-active-actions">
      <button type="button" class="red" onclick="v67604ResumeActivePlan()">▶ RETOMAR TREINO</button>
      ${paused?'':`<button type="button" onclick="v67604PauseWorkout(true)">⏸ PAUSAR</button>`}
      <button type="button" class="v67604-cancel" onclick="v67604CancelWorkout()">✕ CANCELAR</button>
    </div>`;
}
function v67604PauseWorkout(goHome=false){
  const saved=v67604ActivePlanState();
  if(!saved)return false;
  pauseTimer();
  if(saved.status!=='paused')v67604SaveActivePlanState({status:'paused',pausedAt:new Date().toISOString()});
  if(goHome){showView('home');setTimeout(v67604RenderActiveWorkoutCard,20)}
  return true;
}
function v67604ResumeActivePlan(){
  const saved=v67604ActivePlanState();
  if(!saved)return false;
  if(!v67604LoadActivePlanContext(saved))return false;
  let pausedTotal=Math.max(0,Number(saved.pausedTotalMs)||0);
  if(saved.status==='paused'&&saved.pausedAt){
    const p=new Date(saved.pausedAt).getTime();
    if(Number.isFinite(p))pausedTotal+=Math.max(0,Date.now()-p);
  }
  const ex=activePlanExercises[activePlanIndex];
  openExercise(ex.id,true);
  currentSet=Math.max(1,Math.min(Number(saved.currentSet)||1,currentExercise?.sets||1));
  if(byId('setLabel')&&currentExercise)byId('setLabel').textContent=`Série ${currentSet} de ${currentExercise.sets}`;
  v67604SaveActivePlanState({status:'running',pausedAt:null,pausedTotalMs:pausedTotal});
  saveNavigationState('exercise');
  return true;
}
function v67603ResumeActivePlan(){return v67604ResumeActivePlan()}
function v67604CancelWorkout(){
  const saved=v67604ActivePlanState();
  if(!saved)return;
  if(!confirm('Cancelar este treino? Todo o progresso deste treino em andamento será descartado.'))return;
  const started=new Date(saved.startedAt).getTime();
  try{
    const h=history().filter(x=>{
      const t=new Date(x.date).getTime();
      return !(Number.isFinite(t)&&t>=started&&x.plan===saved.name);
    });
    saveHistory(h);
  }catch(e){}
  try{localStorage.removeItem('t2_active_plan')}catch(e){}
  pauseTimer();
  activePlanName='';activePlanExercises=[];activePlanIndex=-1;workoutStartedAt=null;currentExercise=null;currentSet=1;
  v67604RenderActiveWorkoutCard();
  showView('home');
  setTimeout(()=>v67621PlayMusic(),120);
  if(typeof cloudScheduleSync==='function')cloudScheduleSync();
}

let v676819StartingPlan=false;
function startPlanWorkout(){
  // V67.68.22 — início resiliente: a abertura visual do exercício é o marco de
  // sucesso. Falhas auxiliares posteriores não podem gerar um alerta falso nem
  // impedir o treino de continuar.
  if(v676819StartingPlan)return true;
  if(!Array.isArray(activePlanExercises)||!activePlanExercises.length){
    alert('Não foi possível iniciar: este treino não possui exercícios disponíveis.');
    return false;
  }
  v676819StartingPlan=true;
  const unlock=()=>setTimeout(()=>{v676819StartingPlan=false},700);
  try{
    let existing=v67604ActivePlanState();
    if(existing && !v67604PlanExercises(existing.name).length){
      try{localStorage.removeItem('t2_active_plan')}catch(e){}
      existing=null;
    }
    if(existing && String(existing.name||'')!==String(activePlanName||'')){
      if(confirm('Já existe outro treino em andamento. Deseja retomá-lo?')){
        let ok=false;
        try{ok=v67604ResumeActivePlan()}catch(e){console.warn('Falha ao retomar sessão anterior:',e)}
        unlock();
        if(ok)return true;
        try{localStorage.removeItem('t2_active_plan')}catch(e){}
      }else{ unlock(); return false; }
    }else if(existing){
      try{localStorage.removeItem('t2_active_plan')}catch(e){}
    }

    try{v67670ResetActivityLocation()}catch(e){console.warn('Localização não impediu início:',e)}
    workoutStartedAt=new Date().toISOString();
    activePlanIndex=0;
    currentSet=1;
    try{v67621StopMusic(true)}catch(e){console.warn('Falha ao parar música:',e)}

    const first=activePlanExercises[0];
    let opened=false;
    try{
      opened=openExercise(first.id,true)!==false;
    }catch(e){
      // Algumas rotinas acessórias de openExercise podem falhar depois que a
      // tela já foi aberta. Se o exercício correto está carregado, o início é válido.
      console.warn('Rotina acessória do exercício falhou, mantendo treino aberto:',e);
      opened=!!currentExercise && String(currentExercise.id)===String(first.id);
      if(opened){ try{showView('exercise')}catch(_e){} }
    }
    if(!opened)throw new Error('Primeiro exercício não pôde ser aberto.');

    currentSet=1;
    // Persistência e navegação são independentes da abertura visual. A gravação
    // local ocorre dentro de v67604SaveActivePlanState antes de rotinas de nuvem/UI.
    try{
      v67604SaveActivePlanState({
        status:'running',pausedAt:null,pausedTotalMs:0,
        currentExerciseId:first.id,currentSet:1
      });
    }catch(e){console.warn('Treino abriu; falha auxiliar ao atualizar sessão:',e)}
    try{saveNavigationState('exercise')}catch(e){console.warn('Treino abriu; falha ao salvar navegação:',e)}
    unlock();
    return true;
  }catch(err){
    console.error('Falha real ao iniciar treino:',err);
    unlock();
    alert('Não foi possível iniciar o treino. Tente novamente.');
    return false;
  }
}
function openPlanExercise(index){
  if(!activePlanExercises[index])return;
  activePlanIndex=index;
  if(!workoutStartedAt) workoutStartedAt=new Date().toISOString();
  openExercise(activePlanExercises[index].id,true);
  v67604SaveActivePlanState();
}

function workoutHistory(){
  try{const x=JSON.parse(localStorage.getItem('t2_workouts')||'[]');return Array.isArray(x)?x:[]}
  catch(e){console.warn('Histórico de treinos local inválido; usando lista vazia.',e);return []}
}
function saveWorkoutHistory(h){
  localStorage.setItem('t2_workouts',JSON.stringify(h));
  if(typeof cloudScheduleSync==='function') cloudScheduleSync();
  if(typeof v6748RenderDashboard==='function') v6748RenderDashboard();
  if(typeof v6749RenderPerformance==='function') v6749RenderPerformance(true);
}

function getActiveWorkoutMetrics(){
  const h=history();
  if(!workoutStartedAt) return {sets:0,reps:0,volume:0,exerciseCount:0,byExercise:[]};
  const startedMs=new Date(workoutStartedAt).getTime();
  const relevant=h.filter(x=>{
    const t=new Date(x.date).getTime();
    return t>=startedMs && x.plan===activePlanName;
  });
  const by={};
  let totalReps=0,totalVolume=0;
  relevant.forEach(x=>{
    const repsNum=numericRepValue(x.reps);
    const weightNum=Number(x.weight)||0;
    totalReps+=repsNum;
    totalVolume+=weightNum>0?weightNum*repsNum:0;
    if(!by[x.exercise]) by[x.exercise]={name:x.exercise,sets:0,reps:0,volume:0,maxWeight:0};
    by[x.exercise].sets++;
    by[x.exercise].reps+=repsNum;
    by[x.exercise].volume+=weightNum>0?weightNum*repsNum:0;
    by[x.exercise].maxWeight=Math.max(by[x.exercise].maxWeight,weightNum);
  });
  return {
    sets:relevant.length,
    reps:totalReps,
    volume:Math.round(totalVolume*10)/10,
    exerciseCount:Object.keys(by).length,
    byExercise:Object.values(by)
  };
}

async function finishPlanWorkout(){
  const ended=new Date();
  const presence=await v67675ResolveServicePresence(ended);
  const started=workoutStartedAt?new Date(workoutStartedAt):ended;
  const activeState=v67604ActivePlanState();
  const effectiveMs=activeState?v67604EffectiveElapsedMs(activeState,ended.getTime()):Math.max(0,ended-started);
  const minutes=Math.max(1,Math.round(effectiveMs/60000));
  const metrics=getActiveWorkoutMetrics();

  const wh=workoutHistory();
  const record={
    atividadeId:v67383NewActivityId(),
    date:ended.toISOString(),
    startedAt:workoutStartedAt,
    plan:activePlanName,
    duration:minutes,
    exercisesPlanned:activePlanExercises.length,
    exercisesDone:metrics.exerciseCount,
    sets:metrics.sets,
    reps:metrics.reps,
    volume:metrics.volume,
    byExercise:metrics.byExercise,
    schemaVersion:67383,
    workoutType: String(activePlanName||'').toLowerCase().includes('personal')?'custom':'structured',
    ...v67670LocationFields(),
    serviceDay:presence.valid,
    excludedFromStats:false,
    // V67.67.5 — usa a presença reconciliada com o servidor na janela 07h→07h.
    serviceValidatedAt:presence.validatedAt,
    serviceExpiresAt:presence.expiresAt,
    serviceWindowKey:presence.windowKey
  };
  wh.unshift(record);
  saveWorkoutHistory(wh);
  v6738QueueFeedActivity(record);
  showWorkoutSavedMessage();

  localStorage.setItem('t2_last',`${activePlanName} • ${metrics.sets} séries • ${minutes} min`);
  localStorage.removeItem('t2_active_plan');
  pauseTimer();
  updateLast();

  byId('finishPlanName').textContent=activePlanName;
  byId('finishPlanStats').innerHTML=`
    <div class="finish-stats">
      <div><strong>${metrics.exerciseCount}</strong><span>exercícios</span></div>
      <div><strong>${metrics.sets}</strong><span>séries</span></div>
      <div><strong>${minutes}</strong><span>min</span></div>
      <div><strong>${metrics.volume.toLocaleString('pt-BR')}</strong><span>kg de volume</span></div>
    </div>`;
  byId('finishExerciseSummary').innerHTML=metrics.byExercise.length
    ? metrics.byExercise.map(x=>`
      <div class="finish-ex-row">
        <div><b>${x.name}</b><small>${x.sets} séries • ${isLegacyRangeValue(x.reps)?x.reps+' reps (registro antigo)':x.reps+' reps'}</small></div>
        <span>${x.maxWeight ? `${x.maxWeight} kg máx.` : 'peso corporal'}</span>
      </div>`).join('')
    : '<div class="hist">Nenhuma série registrada.</div>';
  const fc=byId('finishComparison');
  if(fc) fc.innerHTML=smartComparisonHtml(record);

  activePlanIndex=-1;
  workoutStartedAt=null;
  showView('workoutDone');
  setTimeout(()=>v67621PlayMusic(true),120);
  setTimeout(()=>v6750ShowPostWorkout(record),180);
  // Ao finalizar, envia imediatamente o treino completo para a nuvem.
  if(typeof cloudPushNow==='function' && cloudSession?.token && navigator.onLine){
    setTimeout(()=>cloudPushNow(),50);
  }

}
function v676821ForceNewExerciseSetOne(){
  if(!currentExercise)return;
  currentSet=1;
  const totalSets=Math.max(1,parseInt(currentExercise.sets,10)||1);
  const label=byId('setLabel'); if(label)label.textContent=`Série 1 de ${totalSets}`;
  const dots=byId('setProgressDots');
  if(dots)dots.innerHTML=Array.from({length:totalSets},(_,i)=>`<i class="${i===0?'current':''}"></i>`).join('');
  const next=byId('nextExerciseBtn'); if(next)next.style.display='none';
  try{v67603SaveActivePlanState()}catch(e){console.warn('Falha ao salvar início do novo exercício:',e)}
  try{saveNavigationState('exercise')}catch(e){console.warn('Falha ao salvar navegação do novo exercício:',e)}
}
function nextPlanExercise(){
  if(activePlanIndex<0)return;
  if(activePlanIndex < activePlanExercises.length-1){
    activePlanIndex++;
    pauseTimer();
    currentSet=1;
    try{openExercise(activePlanExercises[activePlanIndex].id,true)}catch(e){console.warn('Rotina visual do novo exercício falhou; mantendo núcleo do treino:',e)}
    // V67.68.22 — o novo exercício começa sempre em 1/X, mesmo se alguma rotina
    // visual do personalizado falhar depois que a tela já foi aberta.
    v676822ApplyExecutionCoreUI(true);
    v676821ForceNewExerciseSetOne();
    try{requestAnimationFrame(v676821ForceNewExerciseSetOne)}catch(e){}
    setTimeout(v676821ForceNewExerciseSetOne,60);
    setTimeout(v676821ForceNewExerciseSetOne,220);
    v67612UpdateWorkoutVisuals();
    // V67.68.28 — ao ENTRAR em um novo exercício, o relógio fica no tempo
    // completo e PARADO. Ele só inicia quando a série atual for concluída/pulada.
    pauseTimer();
    timer=Math.max(0,Number(currentExercise?.rest)||0);
    updateClock();
  }else finishPlanWorkout();
}



function numericRepValue(value){
  if(typeof value==='number' && Number.isFinite(value)) return value;
  const s=String(value??'').trim().replace(',','.');
  if(!s) return 0;
  const exact=Number(s);
  if(Number.isFinite(exact)) return exact;
  const m=s.match(/\d+(?:\.\d+)?/);
  return m?Number(m[0]):0;
}


function normText(value){
  return String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
}
function isBodyweightName(name){
  const n=normText(name);
  return [
    'barra fixa','barra-fixa','pull up','pull-up','chin up','chin-up','calistenia',
    'prancha','dead bug','crunch','abdominal','flexao','flexão','paralela','mergulho','dips'
  ].some(k=>n.includes(normText(k)));
}
function workoutQuality(w){
  const sets=getWorkoutSets(w);
  const reasons=[];

  if(sets.some(x=>isLegacyRangeValue(x.reps))){
    reasons.push('repetições antigas em faixa');
  }

  if(sets.some(x=>isBodyweightName(x.exercise) && Number(x.weight||0)>0)){
    reasons.push('carga corporal registrada como carga externa');
  }

  return {legacy:reasons.length>0,reasons};
}
function migrateWorkoutQuality(){
  const wh=workoutHistory();
  let changed=false;

  wh.forEach(w=>{
    const q=workoutQuality(w);
    const modern=Number(w.schemaVersion||0)>=12;

    if(q.legacy){
      if(!w.legacyData){w.legacyData=true;changed=true}
      const rs=q.reasons.join(' • ');
      if(w.qualityReason!==rs){w.qualityReason=rs;changed=true}
    }else{
      // Treinos produzidos pelas versões atuais voltam automaticamente
      // para a evolução caso tenham sido marcados por engano.
      if(modern && w.legacyData){
        w.legacyData=false;
        changed=true;
      }
      if(modern && w.qualityReason){
        delete w.qualityReason;
        changed=true;
      }
    }

    if(w.excludedFromStats==null){
      w.excludedFromStats=false;
      changed=true;
    }
  });

  if(changed) saveWorkoutHistory(wh);
  return wh;
}
function reliableWorkouts(){
  // V67.35 — Cardio é um treino válido para a Evolução.
  // Ele participa das contagens de treinos/minutos/dias, mas continua fora
  // dos gráficos de carga/volume em kg, onde não faria sentido.
  return migrateWorkoutQuality().filter(w=>!w.legacyData && !w.excludedFromStats);
}
function toggleWorkoutStats(index){
  const wh=migrateWorkoutQuality(), w=wh[index]; if(!w)return;
  w.excludedFromStats=!w.excludedFromStats;
  saveWorkoutHistory(wh);
  openWorkoutHistory(index);
}

function isLegacyRangeValue(value){
  const s=String(value??'').trim();
  return /^\d+\s*[–—-]\s*\d+/.test(s);
}
function hasUsableSetForVolume(x){
  return Number(x.weight||0)>0 && !isLegacyRangeValue(x.reps) && numericRepValue(x.reps)>0;
}

function setVolume(x){
  if(!hasUsableSetForVolume(x)) return 0;
  const w=Number(x.weight||0);
  const r=numericRepValue(x.reps);
  return w*r;
}
function getWorkoutSets(w){
  const all=history();
  const end=new Date(w.date).getTime();
  let start=w.startedAt?new Date(w.startedAt).getTime():NaN;
  if(!Number.isFinite(start)){
    const wh=workoutHistory();
    const idx=wh.findIndex(x=>x.date===w.date && x.plan===w.plan);
    if(idx>=0 && wh[idx+1]) start=new Date(wh[idx+1].date).getTime()+1;
    else start=end-6*60*60*1000;
  }

  const rows=all.filter(x=>{
    const t=new Date(x.date).getTime();
    return x.plan===w.plan && t>=start && t<=end;
  });

  // Se a mesma série tiver sido gravada duas vezes (ex.: recarga/sincronização),
  // usa apenas o registro mais recente, em vez de invalidar o treino inteiro.
  const byKey=new Map();
  rows
    .slice()
    .sort((a,b)=>new Date(a.date)-new Date(b.date))
    .forEach(x=>{
      const key=`${normText(x.exercise)}|${Number(x.set)||0}`;
      byKey.set(key,x);
    });

  return [...byKey.values()].sort((a,b)=>new Date(a.date)-new Date(b.date));
}
function deriveWorkoutMetrics(w){
  const sets=getWorkoutSets(w);
  const by={};
  let volume=0,reps=0,legacy=false,usableWeightedSets=0;
  sets.forEach(x=>{
    if(isLegacyRangeValue(x.reps)) legacy=true;
    if(hasUsableSetForVolume(x)) usableWeightedSets++;
    volume+=setVolume(x);
    reps+=numericRepValue(x.reps);
    if(!by[x.exercise]) by[x.exercise]={name:x.exercise,sets:0,reps:0,volume:0,maxWeight:0};
    by[x.exercise].sets++;
    by[x.exercise].reps+=numericRepValue(x.reps);
    by[x.exercise].volume+=setVolume(x);
    by[x.exercise].maxWeight=Math.max(by[x.exercise].maxWeight,Number(x.weight||0));
  });
  return {
    sets:sets.length,
    reps,
    volume:Math.round(volume*10)/10,
    legacy,
    usableWeightedSets,
    exercisesDone:Object.keys(by).length,
    byExercise:Object.values(by)
  };
}
function reconcileWorkoutHistory(){
  const wh=workoutHistory();
  let changed=false;
  wh.forEach(w=>{
    const d=deriveWorkoutMetrics(w);
    if((!Number(w.sets)||Number(w.sets)===0) && d.sets){w.sets=d.sets;changed=true}
    if((!Number(w.exercisesDone)||Number(w.exercisesDone)===0) && d.exercisesDone){w.exercisesDone=d.exercisesDone;changed=true}
    // Recompute volume whenever we can derive a better value from the raw set history.
    if(d.volume>0 && Number(w.volume||0)!==d.volume){w.volume=d.volume;changed=true}
    if(d.legacy && !w.legacyData){w.legacyData=true;changed=true}
    if(d.byExercise.length && (!Array.isArray(w.byExercise)||!w.byExercise.length)){w.byExercise=d.byExercise;changed=true}
    if(d.reps>0 && !Number(w.reps)){w.reps=d.reps;changed=true}
  });
  if(changed) saveWorkoutHistory(wh);
  return wh;
}

function isTimedExercise(ex){
  if(!ex) return false;
  const r=String(ex.reps||'').toLowerCase();
  return /\bseg\b|\bsegundos?\b|\d+\s*s\b|prancha|isometr/i.test(r+' '+ex.name);
}
function isBodyweightExercise(ex){
  if(!ex) return false;
  const name=normText(ex.name);
  const t=normText(ex.name+' '+(ex.group||'')+' '+(ex.muscle||''));
  // V67.68.22 — exercícios explicitamente sem carga externa.
  // Barra fixa e flexão de braço nunca exibem/solicitam Carga (kg), inclusive variações do nome.
  if(name.includes('barra fixa') || name.includes('flexao de braco') || name.includes('flexao de bracos') || name==='flexao' || name.startsWith('flexao ')) return true;
  return isTimedExercise(ex) || isBodyweightName(ex.name) || /dead bug|abdominal|crunch|prancha|alongamento|mobilidade/.test(t);
}

function formatSetRecord(x){
  const ex=exByName(x.exercise);
  const timed=isTimedExercise(ex);
  const w=Number(x.weight||0);
  const val=String(x.reps??'');
  if(timed) return `${val || ex?.reps || ''}${/s|seg/i.test(val)?'':' s'}`;
  return `${w>0?`${w} kg • `:''}${val || ex?.reps || ''} reps`;
}

/* ===== V67.62.5 — SINCRONIZAÇÃO VISUAL DA SÉRIE ATUAL =====
   A série válida continua sendo currentSet. Este helper apenas redesenha o card
   para impedir que o texto/bolinhas fiquem presos na série anterior. */
function v67625RenderCurrentSetUI(){
  if(!currentExercise)return;
  const totalSets=Math.max(1,parseInt(currentExercise.sets,10)||1);
  const setNo=Math.max(1,Math.min(parseInt(currentSet,10)||1,totalSets));
  const label=byId('setLabel');
  if(label)label.textContent=`Série ${setNo} de ${totalSets}`;
  const dots=byId('setProgressDots');
  if(dots)dots.innerHTML=Array.from({length:totalSets},(_,i)=>`<i class="${i+1<setNo?'done':i+1===setNo?'current':''}"></i>`).join('');
}
function v67625SyncCurrentSetUI(){
  v67625RenderCurrentSetUI();
  try{requestAnimationFrame(()=>v67625RenderCurrentSetUI())}catch(e){}
  setTimeout(()=>v67625RenderCurrentSetUI(),40);
}

/* ===== V67.61.2 — VISUAL DO TREINO (sem alterar splash/timer estáveis) ===== */
function v67612UpdateWorkoutVisuals(){
  if(!currentExercise)return;
  const totalSets=Math.max(1,parseInt(currentExercise.sets,10)||1);
  const setNo=Math.max(1,Math.min(parseInt(currentSet,10)||1,totalSets));
  const label=byId('setLabel'); if(label)label.textContent=`Série ${setNo} de ${totalSets}`;
  const dots=byId('setProgressDots');
  if(dots)dots.innerHTML=Array.from({length:totalSets},(_,i)=>`<i class="${i+1<setNo?'done':i+1===setNo?'current':''}"></i>`).join('');
  const fill=byId('workoutProgressFill');
  if(fill){
    const total=Math.max(1,activePlanExercises.length||1);
    const idx=Math.max(0,activePlanIndex);
    const pct=activePlanIndex>=0?Math.min(100,Math.max(2,((idx+(setNo-1)/totalSets)/total)*100)):0;
    fill.style.width=`${pct}%`;
  }
}
function v67690TargetReps(ex=currentExercise,setNo=currentSet){
  if(!ex)return null; if(Array.isArray(ex.customPyramidReps)&&ex.customPyramidReps.length)return Number(ex.customPyramidReps[Math.max(0,Number(setNo)-1)])||null;return null;
}
function v67690RenderMethodGuide(){
  let host=byId('customMethodGuide');if(!host){host=document.createElement('div');host.id='customMethodGuide';host.className='custom-method-guide';byId('exPrescription')?.parentElement?.after(host)}
  if(!currentExercise?.customMethodLabel){host.style.display='none';return}const target=v67690TargetReps();let extra='';
  if(currentExercise.customMethod==='dropset')extra='Ao terminar a série, reduza a carga e continue sem descanso.';
  else if(currentExercise.customMethod==='biset')extra=`Em seguida: ${currentExercise.customPairWith||'exercício parceiro'} • descanse após completar os dois.`;
  else if(currentExercise.customMethod==='restpause')extra='Após atingir as reps, faça uma pausa curta e complete repetições adicionais.';
  else if(currentExercise.customMethod==='pyramid_up'||currentExercise.customMethod==='pyramid_down')extra=`Meta desta série: ${target||currentExercise.reps} reps.`;
  else extra='Execução tradicional configurada no treino personalizado.';
  host.innerHTML=`<b>⚙ ${escapeHtml(currentExercise.customMethodLabel)}</b><span>${escapeHtml(extra)}</span>`;host.style.display='flex';
  const reps=byId('reps');if(reps&&target)reps.placeholder=`Meta: ${target}`;
}
/* ===== V67.68.23 — NÚCLEO RESILIENTE DO EXERCÍCIO PERSONALIZADO =====
   Aplica primeiro os controles essenciais. Assim imagens/guias/sincronização
   nunca deixam série, carga ou descanso herdados do exercício anterior. */
function v676822ApplyExecutionCoreUI(resetSet=true){
  if(!currentExercise)return;
  if(resetSet)currentSet=1;
  const totalSets=Math.max(1,parseInt(currentExercise.sets,10)||1);
  currentSet=Math.max(1,Math.min(parseInt(currentSet,10)||1,totalSets));
  const timed=isTimedExercise(currentExercise);
  const bodyweight=isBodyweightExercise(currentExercise);
  const label=byId('setLabel'); if(label)label.textContent=`Série ${currentSet} de ${totalSets}`;
  const dots=byId('setProgressDots');
  if(dots)dots.innerHTML=Array.from({length:totalSets},(_,i)=>`<i class="${i+1<currentSet?'done':i+1===currentSet?'current':''}"></i>`).join('');
  const weightField=byId('weightField'), weight=byId('weight');
  if(weightField){weightField.style.display=bodyweight?'none':'block';weightField.hidden=!!bodyweight;}
  if(weight){weight.disabled=!!bodyweight;if(bodyweight)weight.value='';}
  const repsLabel=byId('repsLabel'), reps=byId('reps');
  if(repsLabel)repsLabel.textContent=timed?'Tempo (segundos)':'Repetições';
  if(reps){reps.type='number';reps.placeholder=timed?'Ex.: 30':'';if(resetSet)reps.value='';}
  pauseTimer(); timer=Math.max(0,Number(currentExercise.rest)||0); updateClock();
  const next=byId('nextExerciseBtn');if(next)next.style.display='none';
}
function v676823StartRest(seconds=null){
  if(!currentExercise && seconds===null)return;
  const restSeconds=Math.max(0,Number(seconds===null?currentExercise.rest:seconds)||0);
  pauseTimer();timer=restSeconds;updateClock();
  if(timer<=0)return;
  // Inicia imediatamente e reforça após as atualizações visuais/persistência do personalizado.
  // Algumas rotinas do fluxo custom chamam pauseTimer/resetam a tela logo após concluir a série.
  startTimer();
  const ensure=()=>{
    if(document.visibilityState==='hidden')return;
    if(timer>0 && !tick)startTimer();
  };
  try{requestAnimationFrame(ensure)}catch(e){}
  setTimeout(ensure,40);
  setTimeout(ensure,140);
  setTimeout(ensure,320);
}
// Compatibilidade com chamadas da v67.68.22.
function v676822StartRest(seconds=null){return v676823StartRest(seconds)}
// V67.68.28 — nos personalizados, dispara o descanso APÓS toda a cadeia da série.
// Isso evita que persistência/renderização posterior cancele o intervalo nas séries intermediárias.
function v676824StartCustomRestAfterSet(seconds=null){
  const sec=Math.max(0,Number(seconds===null?currentExercise?.rest:seconds)||0);
  // V67.68.28 — mesmo ciclo dos treinos prontos: cada conclusão/pulo
  // encerra qualquer descanso anterior, volta ao tempo cheio e inicia UMA vez.
  pauseTimer();
  timer=sec;
  updateClock();
  if(sec>0) startTimer();
}

function openExercise(id,inPlan=false){
  currentExercise=(activePlanIndex>=0&&activePlanExercises[activePlanIndex]&&String(activePlanExercises[activePlanIndex].id)===String(id))?activePlanExercises[activePlanIndex]:DATA.exercises.find(x=>String(x.id)===String(id));
  if(!currentExercise){ console.error('Exercício não encontrado:',id); return false; }
  // V67.68.22 — entra na tela de execução IMEDIATAMENTE. Assim nenhuma rotina
  // visual/acessória posterior pode impedir o início efetivo do treino.
  showView('exercise');
  currentGroup=currentExercise.group;currentSet=1;timer=currentExercise.rest;pauseTimer();
  // Para personalizados, os controles essenciais são montados antes das rotinas visuais.
  if(String(activePlanName||'').startsWith('Personalizado — ')) v676822ApplyExecutionCoreUI(true);
  byId('exTitle').textContent=currentExercise.name;
  const realisticByName={
    // Treino A
    'Supino reto':'1',
    'Supino inclinado':'supino-inclinado',
    'Crucifixo com halteres':'crucifixo-halteres',
    'Crucifixo':'crucifixo-halteres',
    'Crossover médio':'crossover-medio',
    'Crossover':'crossover-medio',
    'Tríceps corda':'triceps-corda',
    'Tríceps na polia (corda)':'triceps-corda',
    'Tríceps testa':'triceps-testa',
    'Tríceps testa (barra W)':'triceps-testa',
    'Tríceps francês':'triceps-frances',
    'Tríceps francês (halter)':'triceps-frances',

    // Treino B
    'Puxada frontal':'puxada-frontal',
    'Puxada alta':'puxada-frontal',
    'Puxada alta pronada':'puxada-frontal',
    'Puxada pronada':'puxada-frontal',
    'Remada baixa':'remada-baixa',
    'Remada baixa (cabo)':'remada-baixa',
    'Remada curvada':'remada-curvada',
    'Remada curvada (barra)':'remada-curvada',
    'Levantamento terra':'levantamento-terra',
    'Terra':'levantamento-terra',
    'Barra fixa':'barra-fixa',
    'Barra fixa pronada':'barra-fixa',
    'Barra fixa (pegada pronada)':'barra-fixa',
    'Remada unilateral':'remada-unilateral',
    'Remada unilateral (halter)':'remada-unilateral',
    'Rosca direta':'rosca-direta',
    'Rosca direta (barra)':'rosca-direta',
    'Elevação pélvica':'elevacao-pelvica',
    'Elevacao pelvica':'elevacao-pelvica',
    'Hip thrust':'elevacao-pelvica',
    "Supino declinado":"supino-declinado",
    "Supino declinado (barra)":"supino-declinado",
    "Crossover alto":"crossover-alto",
    "Crossover baixo":"crossover-baixo",
    "Peck deck":"peck-deck",
    "Peck deck (voador)":"peck-deck",
    "Flexão de braços":"flexao-bracos",
    "Flexao de bracos":"flexao-bracos",
    "Puxada neutra":"puxada-neutra",
    "Remada cavalinho":"remada-cavalinho",
    "Remada cavalinho (T-bar)":"remada-cavalinho",
    "Desenvolvimento na máquina":"desenvolvimento-maquina",
    "Desenvolvimento na maquina":"desenvolvimento-maquina",
    "Crucifixo inverso":"crucifixo-inverso",
    "Remada alta":"remada-alta",
    "Rosca na polia":"rosca-polia",
    "Rosca inclinada":"rosca-inclinada",
    "Tríceps barra":"triceps-barra",
    "Triceps barra":"triceps-barra",
    "Tríceps unilateral polia":"triceps-unilateral-polia",
    "Tríceps unilateral na polia":"triceps-unilateral-polia",
    "Mergulho em banco":"mergulho-banco",
    "Paralelas":"paralelas",
    "Mergulho em paralelas":"paralelas",
    "Mesa flexora":"mesa-flexora",
    "Afundo":"afundo",
    "Agachamento búlgaro":"agachamento-bulgaro",
    "Agachamento bulgaro":"agachamento-bulgaro",
    "Crunch tradicional":"crunch-tradicional",
    "Crunch na polia":"crunch-polia",
    "Abdominal bicicleta":"abdominal-bicicleta",
    "Abdominal oblíquo":"abdominal-obliquo",
    "Abdominal obliquo":"abdominal-obliquo",
    "Dead bug":"dead-bug",
    'Rosca alternada':'rosca-alternada',
    'Rosca alternada (halteres)':'rosca-alternada',
    'Rosca martelo':'rosca-martelo',
    'Rosca concentrada':'rosca-concentrada',
    'Pullover na polia':'pullover-polia',
    'Pullover polia':'pullover-polia',
    'Pullover no cabo':'pullover-polia',
    'Rosca Scott':'rosca-scott',
    'Rosca scott':'rosca-scott',
    'Rosca direta barra':'rosca-direta',
    'Rosca direta (barra)':'rosca-direta',

    // Treino C
    'Agachamento livre':'agachamento-livre',
    'Agachamento':'agachamento-livre',
    'Agachamento livre (barra)':'agachamento-livre',
    'Leg press':'leg-press',
    'Leg press 45°':'leg-press',
    'Leg press 45':'leg-press',
    'Cadeira extensora':'cadeira-extensora',
    'Extensora':'cadeira-extensora',
    'Cadeira flexora':'cadeira-flexora',
    'Flexora':'cadeira-flexora',
    'Avanço':'avanco',
    'Passada':'avanco',
    'Avanço (passada)':'avanco',
    'Stiff':'stiff',
    'Stiff (barra)':'stiff',
    'Cadeira adutora':'cadeira-adutora',
    'Adutora':'cadeira-adutora',
    'Cadeira abdutora':'cadeira-abdutora',
    'Abdutora':'cadeira-abdutora',
    'Panturrilha em pé':'panturrilha-em-pe',
    'Panturrilha em pé (máquina)':'panturrilha-em-pe',
    'Panturrilha sentado':'panturrilha-sentado',
    'Panturrilha sentada':'panturrilha-sentado',

    // Treino D — Ombros + Core
    'Desenvolvimento com barra':'desenvolvimento-barra',
    'Desenvolvimento (barra)':'desenvolvimento-barra',
    'Desenvolvimento com halteres':'desenvolvimento-halteres',
    'Desenvolvimento halteres':'desenvolvimento-halteres',
    'Desenvolvimento (halteres)':'desenvolvimento-halteres',
    'Elevação lateral':'elevacao-lateral',
    'Elevação lateral com halteres':'elevacao-lateral',
    'Elevação frontal':'elevacao-frontal',
    'Elevação frontal com halteres':'elevacao-frontal',
    'Crucifixo invertido':'crucifixo-invertido',
    'Crucifixo invertido (peck deck)':'crucifixo-invertido',
    'Encolhimento':'encolhimento',
    'Encolhimento de ombros':'encolhimento',
    'Encolhimento de ombros (halteres)':'encolhimento',
    'Face pull':'face-pull',
    'Face pull (corda)':'face-pull',
    'Elevação lateral no cabo':'elevacao-lateral-cabo',
    'Prancha':'prancha-frontal',
    'Prancha frontal':'prancha-frontal',
    'Prancha abdominal':'prancha-frontal',
    'Elevação de pernas':'elevacao-pernas',
    'Elevação de pernas (barra)':'elevacao-pernas',
    'Abdominal na máquina':'abdominal-maquina',
    'Abdominal máquina':'abdominal-maquina',
    'Prancha lateral':'prancha-lateral'
  };
  const realisticKey=realisticByName[currentExercise.name];
  const hasRealistic=!!realisticKey;
  const imgStart=byId('imgStart'), imgEnd=byId('imgEnd');
  imgStart.classList.toggle('realistic-exercise',hasRealistic);
  imgEnd.classList.toggle('realistic-exercise',hasRealistic);
  imgStart.onerror=()=>{imgStart.onerror=null;imgStart.src=`assets/exercises/${currentExercise.id}-inicio.svg`;imgStart.classList.remove('realistic-exercise');};
  imgEnd.onerror=()=>{imgEnd.onerror=null;imgEnd.src=`assets/exercises/${currentExercise.id}-fim.svg`;imgEnd.classList.remove('realistic-exercise');};
  imgStart.src=hasRealistic?`assets/exercises/${realisticKey}-inicio.webp?v=37.0`:`assets/exercises/${currentExercise.id}-inicio.svg`;
  imgEnd.src=hasRealistic?`assets/exercises/${realisticKey}-fim.webp?v=37.0`:`assets/exercises/${currentExercise.id}-fim.svg`;
  bindExerciseImageZoom();
  updateMotionButton(hasRealistic);
  const hdPortrait=[
    'Elevação pélvica','Elevacao pelvica','Hip thrust',
    'Pullover na polia','Pullover polia','Pullover no cabo','Rosca Scott','Rosca scott','Rosca direta','Rosca direta barra','Rosca direta (barra)',
    'Desenvolvimento com halteres','Desenvolvimento com barra','Desenvolvimento (barra)',
    'Elevação lateral','Elevação lateral com halteres','Elevação frontal','Elevação frontal com halteres',
    'Crucifixo invertido','Crucifixo invertido (peck deck)','Encolhimento','Encolhimento de ombros',
    'Encolhimento de ombros (halteres)','Face pull','Face pull (corda)','Elevação lateral no cabo',
    'Prancha','Prancha frontal','Prancha abdominal','Elevação de pernas','Elevação de pernas (barra)',
    'Abdominal na máquina','Abdominal máquina','Prancha lateral'
  ].includes(currentExercise.name);
  imgStart.classList.toggle('hd-portrait',hdPortrait);
  imgEnd.classList.toggle('hd-portrait',hdPortrait);
  byId('exMuscle').textContent=currentExercise.muscle;
  byId('exPrescription').textContent=`${currentExercise.sets} x ${currentExercise.reps}${currentExercise.customMethodLabel?' • '+currentExercise.customMethodLabel:''}`;
  byId('exTip').textContent=currentExercise.tip;byId('exAvoid').textContent=currentExercise.avoid;v67690RenderMethodGuide();
  byId('setLabel').textContent=`Série 1 de ${currentExercise.sets}`;byId('weight').value=getLastWeight(currentExercise.name)||"";
  byId('reps').value="";
  const timed=isTimedExercise(currentExercise);
  const bodyweight=isBodyweightExercise(currentExercise);
  const weightField=byId('weightField'), repsLabel=byId('repsLabel'), repsInput=byId('reps');
  if(weightField){ weightField.style.display=bodyweight?'none':'block'; weightField.hidden=!!bodyweight; }
  if(repsLabel) repsLabel.textContent=timed?'Tempo (segundos)':'Repetições';
  if(repsInput){
    repsInput.type='number';
    repsInput.placeholder=timed?'Ex.: 30':'';
  }
  if(bodyweight){ byId('weight').value=''; byId('weight').disabled=true; } else { byId('weight').disabled=false; }
  v67678RenderLastSetReference();
  const wp=byId('workoutProgress');
  if(wp){
    if(inPlan && activePlanIndex>=0){
      wp.style.display='block';
      byId('workoutPlanLabel').textContent=activePlanName;
      byId('workoutStepLabel').textContent=`Exercício ${activePlanIndex+1} de ${activePlanExercises.length}`;
    }else wp.style.display='none';
  }
  v67612UpdateWorkoutVisuals();
  const next=byId('nextExerciseBtn'); if(next) next.style.display='none';
  updateClock();const skipBtn=byId('skipSetBtn'), skipExerciseBtn=byId('skipExerciseBtn');
  if(skipBtn) skipBtn.style.display=activePlanIndex>=0?'block':'none';
  if(skipExerciseBtn) skipExerciseBtn.style.display=activePlanIndex>=0?'block':'none';
  showView('exercise');
  return true;
}
function history(){
  try{const x=JSON.parse(localStorage.getItem('t2_history')||'[]');return Array.isArray(x)?x:[]}
  catch(e){console.warn('Histórico de séries local inválido; usando lista vazia.',e);return []}
}
function saveHistory(h){
  localStorage.setItem('t2_history',JSON.stringify(h));
  try{if(typeof cloudScheduleSync==='function') cloudScheduleSync();}catch(e){console.warn('Falha auxiliar na sincronização do histórico:',e)}
}
function v67678ExerciseKey(name){return String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function v67678LastValidSet(name,setNo=null){
  const key=v67678ExerciseKey(name); if(!key)return null;
  const rows=history().filter(x=>v67678ExerciseKey(x?.exercise)===key && Number(x?.reps)>0);
  if(!rows.length)return null;
  if(setNo!=null){const same=rows.find(x=>Number(x?.set)===Number(setNo)); if(same)return same;}
  return rows[0]||null;
}
function v67678FormatLastSet(row){
  if(!row)return '';
  const w=Number(row.weight||0), reps=Number(row.reps||0);
  return `${w>0?`${String(w).replace('.',',')} kg × `:''}${String(reps).replace('.',',')} reps`;
}
function v67678RenderLastSetReference(){
  const box=byId('lastSetReference'); if(!box||!currentExercise)return;
  if(isTimedExercise(currentExercise)){box.style.display='none';return;}
  const row=v67678LastValidSet(currentExercise.name,currentSet);
  if(!row){box.style.display='none';box.dataset.weight='';box.dataset.reps='';return;}
  box.dataset.weight=String(Number(row.weight||0)); box.dataset.reps=String(Number(row.reps||0));
  const date=row.date?new Date(row.date):null;
  const when=date&&!Number.isNaN(date.getTime())?date.toLocaleDateString('pt-BR'):'registro anterior';
  const text=byId('lastSetReferenceText'); if(text)text.textContent=`${v67678FormatLastSet(row)} • ${when}`;
  const use=byId('useLastSetBtn'); if(use)use.style.display=Number(row.weight||0)>0||Number(row.reps||0)>0?'inline-flex':'none';
  box.style.display='flex';
}
function v67678UseLastSet(){
  const box=byId('lastSetReference'); if(!box)return;
  const w=Number(box.dataset.weight||0), r=Number(box.dataset.reps||0);
  if(w>0 && byId('weight') && byId('weightField')?.style.display!=='none')byId('weight').value=w;
  if(r>0 && byId('reps'))byId('reps').value=r;
}
window.v67678UseLastSet=v67678UseLastSet;
function getLastWeight(name){const h=history().find(x=>v67678ExerciseKey(x.exercise)===v67678ExerciseKey(name)&&Number(x.weight)>0);return h?h.weight:""}
// V67.68.28 — descanso usa o mesmo comando-base do treino pronto.
// Não existe mais um timer paralelo para personalizado: resetTimer + startTimer.
function v676827StartRestLikeReadyWorkout(){
  if(!currentExercise)return;
  resetTimer();
  if(Number(timer)>0)startTimer();
}

function skipCurrentSet(){
  if(!currentExercise || activePlanIndex<0)return false;
  const totalSets=Math.max(1,parseInt(currentExercise.sets,10)||1);
  const setNo=Math.max(1,parseInt(currentSet,10)||1);
  pauseTimer();
  if(setNo<totalSets){
    currentSet=setNo+1;
    const label=byId('setLabel'); if(label)label.textContent=`Série ${currentSet} de ${totalSets}`;
    const reps=byId('reps'); if(reps)reps.value='';
    v67612UpdateWorkoutVisuals();
    v67625SyncCurrentSetUI();
    v67678RenderLastSetReference();
    v67690RenderMethodGuide();
    v676827StartRestLikeReadyWorkout();
    try{v67603SaveActivePlanState()}catch(e){console.warn('Falha ao persistir série pulada:',e)}
    try{saveNavigationState('exercise')}catch(e){console.warn('Falha ao salvar navegação da série pulada:',e)}
    return true;
  }
  nextPlanExercise();
  return true;
}
function skipCurrentExercise(){
  if(!currentExercise || activePlanIndex<0)return false;
  pauseTimer();
  nextPlanExercise();
  return true;
}
// Exportação explícita para os botões do PWA instalado no Android.
window.skipCurrentSet=skipCurrentSet;
window.skipCurrentExercise=skipCurrentExercise;

function completeSet(){
  if(!currentExercise)return;
  const timed=isTimedExercise(currentExercise), bodyweight=isBodyweightExercise(currentExercise);
  const repsRaw=String(byId('reps').value||'').trim();
  if(!repsRaw){
    alert(timed?'Informe o tempo realizado em segundos.':'Informe quantas repetições você realizou.');
    byId('reps').focus();
    return;
  }
  const reps=numericRepValue(repsRaw);
  if(!(reps>0)){
    alert(timed?'Informe um tempo válido em segundos.':'Informe uma quantidade válida de repetições.');
    byId('reps').focus();
    return;
  }
  const weight=bodyweight?0:Number(byId('weight').value||0);
  const h=history();
  h.unshift({
    date:new Date().toISOString(),group:currentExercise.group,exercise:currentExercise.name,
    set:currentSet,weight,reps,plan:activePlanIndex>=0?activePlanName:""
  });
  const wasPR=!bodyweight && checkNewPR(currentExercise.name,weight);
  saveHistory(h);
  localStorage.setItem('t2_last',`${currentExercise.group} • ${currentExercise.name} • ${weight} kg • ${reps} reps`);
  updateLast();
  if(wasPR && weight>0){
    const toast=byId('prToast');
    if(toast){
      const prev=previousBestBefore(currentExercise.name,new Date().toISOString());
      const diff=prev>0?weight-prev:0;
      const pct=prev>0?diff/prev*100:null;
      toast.innerHTML=`🏆 <b>NOVO RECORDE</b><span>${currentExercise.name}: ${weight} kg</span>${prev>0?`<small>${prev} → ${weight} kg • +${diff.toFixed(diff%1?1:0)} kg • +${pct.toFixed(1)}%</small>`:''}`;
      toast.classList.add('show');
      setTimeout(()=>toast.classList.remove('show'),3200);
    }
  }

  if(currentSet<currentExercise.sets){
    // V67.62.6 — a interface avança ANTES de qualquer persistência/sincronização.
    // Assim uma falha secundária nunca deixa o card visual preso na série anterior.
    currentSet++;
    v67625SyncCurrentSetUI();
    v67612UpdateWorkoutVisuals();
    const repsInput=byId('reps'); if(repsInput)repsInput.value="";
    v67678RenderLastSetReference();
    v67690RenderMethodGuide();
    v676827StartRestLikeReadyWorkout();
    try{v67603SaveActivePlanState()}catch(e){console.warn('Falha ao persistir série atual:',e)}
    try{saveNavigationState('exercise')}catch(e){console.warn('Falha ao salvar navegação da série:',e)}
  }else{
    // V67.68.22 — a última série também conta visualmente como concluída e
    // inicia o descanso automaticamente antes do próximo exercício.
    const totalSets=Math.max(1,parseInt(currentExercise.sets,10)||1);
    const dots=byId('setProgressDots');
    if(dots)dots.innerHTML=Array.from({length:totalSets},()=>`<i class="done"></i>`).join('');
    v676827StartRestLikeReadyWorkout();
    try{saveNavigationState('exercise')}catch(e){console.warn('Falha ao salvar navegação após última série:',e)};
    const btn=byId('nextExerciseBtn');
    byId('setLabel').innerHTML=`<span class="done-inline">✓ Exercício concluído</span><small>${currentExercise.sets}/${currentExercise.sets} séries realizadas</small>`;
    if(activePlanIndex>=0 && btn){
      btn.style.display='block';
      btn.textContent=activePlanIndex<activePlanExercises.length-1
        ? `PRÓXIMO EXERCÍCIO → ${activePlanExercises[activePlanIndex+1].name}`
        : 'FINALIZAR TREINO ✓';
      btn.scrollIntoView({behavior:'smooth',block:'center'});
    }else{
      alert("Exercício concluído. Bom treino!");
    }
  }
}
function updateClock(){byId('clock').textContent=`${String(Math.floor(timer/60)).padStart(2,'0')}:${String(timer%60).padStart(2,'0')}`}
function startTimer(){if(tick)return;tick=setInterval(()=>{timer=Math.max(0,timer-1);updateClock();if(timer===0){pauseTimer();if(navigator.vibrate)navigator.vibrate([250,100,250]);

}},1000)}
function pauseTimer(){clearInterval(tick);tick=null}
function resetTimer(){pauseTimer();timer=currentExercise?currentExercise.rest:90;updateClock()}
/* ===== V67.48 — DASHBOARD ESPORTIVO / META SEMANAL ===== */
const V6748_WEEKLY_GOAL_KEY='t2_weekly_goal_v6748';
function v6748WeeklyGoal(){
  const n=Number(localStorage.getItem(V6748_WEEKLY_GOAL_KEY)||3);
  return Number.isFinite(n)&&n>=1&&n<=7?Math.round(n):3;
}
function v6748SetWeeklyGoal(){
  const current=v6748WeeklyGoal();
  const raw=prompt('Quantos treinos você quer fazer por semana?\nEscolha de 1 a 7.',String(current));
  if(raw===null)return;
  const n=Math.round(Number(String(raw).replace(',','.')));
  if(!Number.isFinite(n)||n<1||n>7){alert('Escolha uma meta entre 1 e 7 treinos por semana.');return}
  localStorage.setItem(V6748_WEEKLY_GOAL_KEY,String(n));
  v6748RenderDashboard();
}
function v6748StartOfWeek(date=new Date()){
  const d=new Date(date.getFullYear(),date.getMonth(),date.getDate(),0,0,0,0);
  const day=(d.getDay()+6)%7; d.setDate(d.getDate()-day); return d;
}
function v6748DashboardWorkouts(){
  try{return migrateWorkoutQuality().filter(w=>w&&w.date&&w.excludedFromStats!==true)}catch(e){return workoutHistory().filter(w=>w&&w.date&&w.excludedFromStats!==true)}
}
function v6748WeekRecords(start,records){
  const end=new Date(start);end.setDate(end.getDate()+7);
  return records.filter(w=>{const d=new Date(w.date);return !Number.isNaN(d.getTime())&&d>=start&&d<end});
}
function v6748WeekStreak(records,goal){
  const current=v6748StartOfWeek(); let streak=0;
  // Conta semanas anteriores completas que atingiram a meta; a semana atual entra quando já bateu a meta.
  for(let offset=0;offset<52;offset++){
    const start=new Date(current);start.setDate(start.getDate()-offset*7);
    const count=v6748WeekRecords(start,records).length;
    if(count>=goal)streak++; else {if(offset===0)continue;break}
  }
  return streak;
}
function v6748Greeting(){
  const h=new Date().getHours();return h<12?'Bom dia':h<18?'Boa tarde':'Boa noite';
}
function v6748FirstName(){
  const raw=String(cloudSession?.nome||'').trim();
  if(!raw)return 'BM';
  return raw.split(/\s+/)[0].toUpperCase();
}
function v6748RenderDashboard(){
  const box=byId('v6748Dashboard');if(!box)return;
  const records=v6748DashboardWorkouts();
  const start=v6748StartOfWeek(); const week=v6748WeekRecords(start,records);
  const goal=v6748WeeklyGoal(); const count=week.length;
  const minutes=Math.round(week.reduce((a,w)=>a+Number(w.duration||0),0));
  const pct=Math.min(100,Math.round((count/goal)*100));
  const streak=v6748WeekStreak(records,goal);
  const days=[]; const labels=['SEG','TER','QUA','QUI','SEX','SÁB','DOM'];
  let max=1;
  for(let i=0;i<7;i++){
    const d=new Date(start);d.setDate(d.getDate()+i);
    const next=new Date(d);next.setDate(next.getDate()+1);
    const mins=week.filter(w=>{const x=new Date(w.date);return x>=d&&x<next}).reduce((a,w)=>a+Number(w.duration||0),0);
    max=Math.max(max,mins);days.push({label:labels[i],mins});
  }
  const bars=days.map(d=>`<div class="v6748-day"><div class="v6748-bar-track"><i style="height:${d.mins?Math.max(12,Math.round(d.mins/max*100)):4}%"></i></div><b>${d.label}</b><small>${Math.round(d.mins)||'—'}</small></div>`).join('');
  box.innerHTML=`<div class="v6748-head"><div><span class="v6748-eyebrow">SEU DESEMPENHO</span><h2>${v6748Greeting()}, ${v6748FirstName()} 👋</h2><p>Resumo da sua semana de treinamento.</p></div><span class="v6748-live">SEMANA ATUAL</span></div>
  <div class="v6748-stats"><div><strong>${count}</strong><span>treinos</span></div><div><strong>${minutes}</strong><span>minutos</span></div><div><strong>🔥 ${streak}</strong><span>${streak===1?'semana na meta':'semanas na meta'}</span></div></div>
  <div class="v6748-goal"><div class="v6748-goal-head"><div><b>🎯 Meta semanal</b><span>${count}/${goal} treinos • ${pct}%</span></div><button type="button" onclick="v6748SetWeeklyGoal()">EDITAR</button></div><div class="v6748-progress"><i style="width:${pct}%"></i></div><small>${count>=goal?'Meta da semana alcançada. Excelente consistência!':`Faltam ${Math.max(0,goal-count)} ${goal-count===1?'treino':'treinos'} para sua meta.`}</small></div>
  <div class="v6748-chart"><div class="v6748-chart-head"><b>Atividade nos últimos dias</b><span>min/dia</span></div><div class="v6748-bars">${bars}</div></div>`;
}
/* ===== V67.49 — RECORDES PESSOAIS / CONQUISTAS ===== */
const V6749_ACH_SEEN='t2_achievements_seen_v6749';
function v6749FmtPace(sec,unit){
  sec=Math.round(Number(sec)||0);if(sec<=0)return '—';
  return `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')} ${unit}`;
}
function v6749PerformanceData(){
  const records=v6748DashboardWorkouts();
  let maxWeight=0,maxWeightEx='',maxVolume=0,maxVolumePlan='';
  let bestRunPace=Infinity,maxRun=0,bestSwimPace=Infinity,maxSwim=0;
  records.forEach(w=>{
    const vol=Number(w.volume||0);if(vol>maxVolume){maxVolume=vol;maxVolumePlan=String(w.plan||'Treino')}
    const by=Array.isArray(w.byExercise)?w.byExercise:[];
    by.forEach(x=>{const kg=Number(x.maxWeight||0);if(kg>maxWeight){maxWeight=kg;maxWeightEx=String(x.name||'Exercício')}});
    if(['treadmill','run'].includes(w.cardioMachine)){
      const km=Number(w.cardioDistanceKm||0),pace=Number(w.cardioPaceSecondsPerKm||0);
      if(km>maxRun)maxRun=km;if(pace>0&&pace<bestRunPace)bestRunPace=pace;
    }
    if(w.cardioMachine==='swim'){
      const m=Number(w.swimDistanceMeters||0),pace=Number(w.swimPaceSecondsPer100m||0);
      if(m>maxSwim)maxSwim=m;if(pace>0&&pace<bestSwimPace)bestSwimPace=pace;
    }
  });
  const goal=v6748WeeklyGoal(),weekCount=v6748WeekRecords(v6748StartOfWeek(),records).length,streak=v6748WeekStreak(records,goal);
  const achievements=[
    {id:'first',icon:'🎖️',name:'Primeiro passo',desc:'Conclua seu primeiro treino.',ok:records.length>=1},
    {id:'ten',icon:'🏅',name:'10 treinos',desc:'Complete 10 atividades.',ok:records.length>=10},
    {id:'twentyfive',icon:'🥉',name:'25 treinos',desc:'Complete 25 atividades.',ok:records.length>=25},
    {id:'fifty',icon:'🥈',name:'50 treinos',desc:'Complete 50 atividades.',ok:records.length>=50},
    {id:'hundred',icon:'🥇',name:'Centenário',desc:'Complete 100 atividades.',ok:records.length>=100},
    {id:'cardio30',icon:'❤️',name:'Cardio 30+',desc:'Faça 30 minutos de cardio em uma atividade.',ok:records.some(w=>w.cardioMachine&&!['swim','run'].includes(w.cardioMachine)&&Number(w.duration)>=30)},
    {id:'run5k',icon:'🏃',name:'Primeiros 5 km',desc:'Complete uma corrida de 5 km.',ok:records.some(w=>['treadmill','run'].includes(w.cardioMachine)&&Number(w.cardioDistanceKm)>=5)},
    {id:'swim1k',icon:'🏊',name:'1 km nadando',desc:'Complete 1.000 m de natação.',ok:records.some(w=>w.cardioMachine==='swim'&&Number(w.swimDistanceMeters)>=1000)},
    {id:'weekly',icon:'🎯',name:'Meta cumprida',desc:'Alcance sua meta semanal.',ok:weekCount>=goal},
    {id:'streak4',icon:'🔥',name:'Consistência',desc:'Mantenha a meta por 4 semanas.',ok:streak>=4}
  ];
  return {records,maxWeight,maxWeightEx,maxVolume,maxVolumePlan,bestRunPace,maxRun,bestSwimPace,maxSwim,achievements};
}
function v6749RecordCard(icon,label,value,detail){
  return `<div class="v6749-record"><span>${icon}</span><div><small>${label}</small><strong>${value}</strong><em>${detail||'Ainda sem registro'}</em></div></div>`;
}
function v6749AchievementToast(a){
  let t=byId('v6749AchievementToast');if(!t){t=document.createElement('div');t.id='v6749AchievementToast';t.className='v6749-ach-toast';document.body.appendChild(t)}
  t.innerHTML=`<span>${a.icon}</span><div><b>CONQUISTA DESBLOQUEADA</b><strong>${a.name}</strong><small>${a.desc}</small></div>`;
  t.classList.add('show');setTimeout(()=>t.classList.remove('show'),4200);
}
function v6749CheckNewAchievements(list,celebrate){
  const unlocked=list.filter(a=>a.ok);let seen=[];try{seen=JSON.parse(localStorage.getItem(V6749_ACH_SEEN)||'null')}catch(e){}
  if(!Array.isArray(seen)){localStorage.setItem(V6749_ACH_SEEN,JSON.stringify(unlocked.map(a=>a.id)));return}
  const fresh=unlocked.filter(a=>!seen.includes(a.id));
  if(fresh.length){localStorage.setItem(V6749_ACH_SEEN,JSON.stringify([...new Set([...seen,...fresh.map(a=>a.id)])]));if(celebrate)v6749AchievementToast(fresh[0])}
}
function v6749RenderPerformance(celebrate=false){
  const box=byId('v6749Performance');if(!box)return;const d=v6749PerformanceData();
  const runP=Number.isFinite(d.bestRunPace)?v6749FmtPace(d.bestRunPace,'/km'):'—';
  const swimP=Number.isFinite(d.bestSwimPace)?v6749FmtPace(d.bestSwimPace,'/100 m'):'—';
  const records=[
    v6749RecordCard('🏋️','Maior carga',d.maxWeight?`${d.maxWeight.toLocaleString('pt-BR')} kg`:'—',d.maxWeightEx),
    v6749RecordCard('⚡','Maior volume',d.maxVolume?`${Math.round(d.maxVolume).toLocaleString('pt-BR')} kg`:'—',d.maxVolumePlan),
    v6749RecordCard('🏃','Melhor pace',runP,d.maxRun?`Corrida • maior distância ${d.maxRun.toLocaleString('pt-BR',{maximumFractionDigits:2})} km`:'Corrida'),
    v6749RecordCard('🏊','Melhor ritmo',swimP,d.maxSwim?`Natação • maior distância ${Math.round(d.maxSwim).toLocaleString('pt-BR')} m`:'Natação')
  ].join('');
  const unlocked=d.achievements.filter(a=>a.ok).length;
  const achCard=a=>`<div class="v6749-ach ${a.ok?'unlocked':'locked'}"><span>${a.ok?a.icon:'🔒'}</span><div><b>${a.name}</b><small>${a.desc}</small></div>${a.ok?'<i>CONQUISTADA</i>':''}</div>`;
  const ordered=[...d.achievements.filter(a=>a.ok),...d.achievements.filter(a=>!a.ok)];
  const preview=ordered.slice(0,3).map(achCard).join('');
  const ach=d.achievements.map(achCard).join('');
  box.innerHTML=`<div class="v6749-section-head"><div><span>EVOLUÇÃO PESSOAL</span><h2>🏆 Recordes pessoais</h2></div><small>Atualizados automaticamente</small></div><div class="v6749-record-grid">${records}</div><div class="v6750-ach-preview">${preview}</div><details class="v6749-achievements"><summary><span><b>🏅 Conquistas</b><small>${unlocked}/${d.achievements.length} desbloqueadas</small></span><strong>VER TODAS</strong></summary><div class="v6749-ach-grid">${ach}</div></details>`;
  v6749CheckNewAchievements(d.achievements,celebrate);
}
/* ===== V67.50 — RESUMO PÓS-TREINO PROFISSIONAL ===== */
function v6750Escape(s){return String(s??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}
function v6750PriorRecords(record){return workoutHistory().filter(w=>String(w?.atividadeId||'')!==String(record?.atividadeId||''))}
function v6750Qualifies(record){
  if(['swim','run'].includes(record?.cardioMachine)||record?.workoutType==='core'||record?.rankingCategory==='core')return false;
  if(record?.cardioMachine)return Number(record.duration||0)>=30;
  if(record?.workoutType==='free')return Number(record.duration||0)>=20 && (record.muscleGroups||[]).length>0;
  return Number(record.exercisesDone||record.exerciseCount||0)>=3 && Number(record.sets||0)>=6;
}
function v6750RankingLine(record){
  if(record?.cardioMachine==='swim')return {icon:'🏊',title:'Registro esportivo',text:'Natação não pontua no Ranking de Frequência.',kind:'neutral'};
  if(record?.cardioMachine==='run')return {icon:'🏃‍♂️',title:'Registro esportivo',text:'Corrida não pontua no Ranking de Frequência.',kind:'neutral'};
  if(record?.workoutType==='core'||record?.rankingCategory==='core')return {icon:'🛡️',title:'Registro esportivo',text:'Core não pontua no Ranking de Frequência.',kind:'neutral'};
  if(record?.serviceDay!==true)return {icon:'⚠️',title:'Atividade registrada',text:'Esta atividade será registrada, mas não pontuará no Ranking.',kind:'neutral'};
  if(!v6750Qualifies(record))return {icon:'✓',title:'Atividade registrada',text:'Ainda não atingiu o critério mínimo para pontuar.',kind:'neutral'};
  const key=String(record?.serviceWindowKey||'');
  const already=key && v6750PriorRecords(record).some(w=>String(w?.serviceWindowKey||'')===key && w?.serviceDay===true && v6750Qualifies(w));
  return already?{icon:'🏆',title:'Jornada já contabilizada',text:'Esta presença já possui uma atividade principal válida.',kind:'ok'}:{icon:'🏆',title:'+1 no Ranking de Frequência',text:'Atividade principal válida com presença confirmada.',kind:'gold'};
}
function v6750NewRecordLines(record){
  const prev=v6750PriorRecords(record), lines=[];
  const vol=Number(record?.volume||0); if(vol>0 && vol>Math.max(0,...prev.map(w=>Number(w?.volume||0))))lines.push('⚡ Novo recorde de volume');
  let maxKg=0; (record?.byExercise||[]).forEach(x=>maxKg=Math.max(maxKg,Number(x?.maxWeight||0)));
  let prevKg=0; prev.forEach(w=>(w?.byExercise||[]).forEach(x=>prevKg=Math.max(prevKg,Number(x?.maxWeight||0))));
  if(maxKg>0&&maxKg>prevKg)lines.push('🏋️ Novo recorde de carga');
  if(['treadmill','run'].includes(record?.cardioMachine)){
    const p=Number(record.cardioPaceSecondsPerKm||0), old=prev.filter(w=>w?.cardioMachine===record.cardioMachine).map(w=>Number(w?.cardioPaceSecondsPerKm||0)).filter(Boolean);
    if(p>0&&(!old.length||p<Math.min(...old)))lines.push('🏃 Novo melhor pace');
  }
  if(record?.cardioMachine==='swim'){
    const p=Number(record.swimPaceSecondsPer100m||0), old=prev.filter(w=>w?.cardioMachine==='swim').map(w=>Number(w?.swimPaceSecondsPer100m||0)).filter(Boolean);
    if(p>0&&(!old.length||p<Math.min(...old)))lines.push('🏊 Novo melhor ritmo na natação');
  }
  return lines;
}
function v6750FreshAchievement(record){
  const d=v6749PerformanceData(); let seen=[];try{seen=JSON.parse(localStorage.getItem(V6749_ACH_SEEN)||'[]')}catch(e){}
  if(!Array.isArray(seen))seen=[]; return d.achievements.find(a=>a.ok&&!seen.includes(a.id))||null;
}
function v6750MetricCards(record){
  const cards=[]; cards.push(`<div><strong>${Math.round(Number(record?.duration||0))}</strong><span>min</span></div>`);
  if(record?.cardioMachine==='swim'){
    cards.push(`<div><strong>${Math.round(Number(record.swimDistanceMeters||0)).toLocaleString('pt-BR')}</strong><span>metros</span></div>`);
    cards.push(`<div><strong>${v6749FmtPace(record.swimPaceSecondsPer100m,'/100 m')}</strong><span>ritmo</span></div>`);
  }else if(record?.cardioMachine==='rower'){
    cards.push(`<div><strong>${Math.round(Number(record.rowerDistanceMeters||0)).toLocaleString('pt-BR')}</strong><span>metros</span></div>`);
    cards.push(`<div><strong>${v6749FmtPace(record.rowerPaceSecondsPer500m,'/500 m')}</strong><span>ritmo</span></div>`);
  }else if(record?.cardioMachine==='bike'){
    cards.push(`<div><strong>${v6750Escape(record.bikeIntensity||'—')}</strong><span>intensidade</span></div>`);
  }else if(['treadmill','run'].includes(record?.cardioMachine)){
    cards.push(`<div><strong>${Number(record.cardioDistanceKm||0).toLocaleString('pt-BR',{maximumFractionDigits:2})}</strong><span>km</span></div>`);
    cards.push(`<div><strong>${v6749FmtPace(record.cardioPaceSecondsPerKm,'/km')}</strong><span>pace</span></div>`);
  }else if(record?.cardioMachine){cards.push(`<div><strong>${CARDIO_MACHINE_META[record.cardioMachine]?.icon||'❤️'}</strong><span>${v6750Escape(CARDIO_MACHINE_META[record.cardioMachine]?.label||'Cardio')}</span></div>`)}
  else if(record?.workoutType==='free'){cards.push(`<div><strong>${(record.muscleGroups||[]).length}</strong><span>grupos</span></div>`)}
  else {cards.push(`<div><strong>${Number(record.sets||0)}</strong><span>séries</span></div>`);cards.push(`<div><strong>${Math.round(Number(record.volume||0)).toLocaleString('pt-BR')}</strong><span>kg volume</span></div>`)}
  return cards.join('');
}
/* ===== V67.63.1 — CARD OFICIAL DE COMPARTILHAMENTO PREMIUM ===== */
let v67630ShareRecord=null;
let v67685SharePrepared=null;
let v67685SharePreparing=null;
function v67630FmtInt(n){return Math.round(Number(n||0)).toLocaleString('pt-BR')}
function v67630FmtDate(iso){const d=new Date(iso||Date.now());return {date:d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'}).replace('.','').toUpperCase(),time:d.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}}
function v67630ShortPlan(record){return String(record?.plan||'TREINO CONCLUÍDO').replace(/^Treino\s*/i,'TREINO ').toUpperCase()}
function v67630MetricData(record){
  const out=[['⏱',`${v67630FmtInt(record?.duration)} min`,'DURAÇÃO']];
  if(record?.cardioMachine==='swim'){
    out.push(['◈',`${v67630FmtInt(record.swimDistanceMeters)} m`,'DISTÂNCIA']);out.push(['⌁',v6749FmtPace(record.swimPaceSecondsPer100m,'/100 m'),'RITMO']);
  }else if(record?.cardioMachine==='rower'){
    out.push(['◈',`${v67630FmtInt(record.rowerDistanceMeters)} m`,'DISTÂNCIA']);out.push(['⌁',v6749FmtPace(record.rowerPaceSecondsPer500m,'/500 m'),'RITMO']);
  }else if(record?.cardioMachine==='bike'){
    out.push(['◆',String(record.bikeIntensity||'—').toUpperCase(),'INTENSIDADE']);
  }else if(['treadmill','run'].includes(record?.cardioMachine)){
    out.push(['◈',`${Number(record.cardioDistanceKm||0).toLocaleString('pt-BR',{maximumFractionDigits:2})} km`,'DISTÂNCIA']);out.push(['⌁',v6749FmtPace(record.cardioPaceSecondsPerKm,'/km'),'PACE']);
  }else{
    // V67.68.28 — musculação (pronto, personalizado e livre):
    // sempre Duração + Exercícios + Séries. Sem contador de grupos/status/volume.
    out.push(['◆',`${v67630FmtInt(record.exercisesDone||record.exerciseCount||record.exercisesPlanned)}`,'EXERCÍCIOS']);
    out.push(['↻',`${v67630FmtInt(record.sets)}`,'SÉRIES']);
  }
  return out;
}
function v67630RoundRect(ctx,x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke()}}
function v67630FitText(ctx,text,maxWidth,start,min=24){let size=start;while(size>min){ctx.font=`900 ${size}px Arial, sans-serif`;if(ctx.measureText(text).width<=maxWidth)break;size-=2}return size}
function v67630LoadImage(src){return new Promise(resolve=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>resolve(null);im.src=src})}
async function v67630BuildShareCard(record){
  const W=1080,H=1920,c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  // V67.63.1 — usa a arte cinematográfica aprovada como base real do card.
  const art=await v67630LoadImage('share-card-premium-v67631.png?v=67.63.1');
  if(art){
    const scale=Math.max(W/art.width,H/art.height),dw=art.width*scale,dh=art.height*scale;
    x.drawImage(art,(W-dw)/2,(H-dh)/2,dw,dh);
  }else{
    const bg=x.createLinearGradient(0,0,W,H);bg.addColorStop(0,'#090909');bg.addColorStop(.5,'#250406');bg.addColorStop(1,'#020202');x.fillStyle=bg;x.fillRect(0,0,W,H);
  }
  // Faixa central redesenhada: cobre os números demonstrativos da arte-base e recebe apenas dados reais.
  const panelY=720,panelH=610;
  const shade=x.createLinearGradient(0,panelY,0,panelY+panelH);shade.addColorStop(0,'rgba(2,2,2,.96)');shade.addColorStop(.5,'rgba(8,8,8,.985)');shade.addColorStop(1,'rgba(2,2,2,.94)');
  x.fillStyle=shade;x.fillRect(54,panelY,972,panelH);
  x.strokeStyle='rgba(225,20,29,.65)';x.lineWidth=4;x.strokeRect(54,panelY,972,panelH);
  x.fillStyle='#e3131b';x.fillRect(54,panelY,972,7);

  const plan=v67630ShortPlan(record);const dt=v67630FmtDate(record?.date);
  x.textAlign='center';x.fillStyle='#fff';x.font=`900 ${v67630FitText(x,plan,890,50,29)}px Arial`;x.fillText(plan,W/2,790);
  x.fillStyle='#aaa';x.font='700 23px Arial';x.fillText(`${dt.date}  •  ${dt.time}`,W/2,832);

  const metrics=v67630MetricData(record),gap=14,left=75,totalW=930,boxW=(totalW-gap*(metrics.length-1))/metrics.length,y=875;
  metrics.forEach((m,i)=>{const bx=left+i*(boxW+gap);v67630RoundRect(x,bx,y,boxW,176,18,'rgba(15,15,15,.96)','#454545');x.textAlign='center';x.fillStyle='#ed151f';x.font='900 34px Arial';x.fillText(m[0],bx+boxW/2,y+45);x.fillStyle='#fff';x.font=`900 ${v67630FitText(x,m[1],boxW-20,36,21)}px Arial`;x.fillText(m[1],bx+boxW/2,y+104);x.fillStyle='#aaa';x.font='700 18px Arial';x.fillText(m[2],bx+boxW/2,y+143)});

  const prs=v6750NewRecordLines(record);let yy=1080;
  if(prs.length){
    v67630RoundRect(x,125,yy,830,210,22,'rgba(18,12,2,.97)','#d9a514');x.textAlign='center';x.fillStyle='#f6c62e';x.font='900 31px Arial';x.fillText(`🏆 ${prs.length} ${prs.length===1?'NOVO RECORDE':'NOVOS RECORDES'}`,W/2,yy+48);
    x.strokeStyle='rgba(246,198,46,.4)';x.beginPath();x.moveTo(210,yy+68);x.lineTo(870,yy+68);x.stroke();x.textAlign='left';x.fillStyle='#fff';x.font='700 26px Arial';prs.slice(0,3).forEach((p,i)=>x.fillText(p.replace(/^[^\wÀ-ÿ]+/u,''),185,yy+112+i*38));
  }else{
    v67630RoundRect(x,125,yy,830,210,22,'rgba(8,8,8,.97)','#4a4a4a');x.textAlign='center';x.fillStyle='#e3131b';x.font='900 28px Arial';x.fillText('DISCIPLINA • CONSTÂNCIA • PRONTIDÃO',W/2,yy+68);x.fillStyle='#fff';x.font='700 27px Arial';x.fillText('NÃO É SÓ UM TREINO.',W/2,yy+120);x.fillStyle='#aaa';x.font='700 23px Arial';x.fillText('É PREPARAÇÃO PARA ALGO MAIOR.',W/2,yy+158);
  }

  // V67.68.28 — limpa qualquer texto demonstrativo residual da arte-base
  // (ex.: "25 kg • 15 repetições") antes das assinaturas reais.
  x.fillStyle='rgba(2,2,2,.98)';x.fillRect(170,1318,740,62);

  // Nome real do militar que executou a atividade.
  v67630RoundRect(x,190,1375,700,118,58,'rgba(2,2,2,.98)','#6b0d10');x.textAlign='center';x.fillStyle='#fff';x.font='900 38px Arial';x.fillText(v6748FirstName(),W/2,1425);x.fillStyle='#aaa';x.font='700 20px Arial';x.fillText('TREINO 2ª CIA',W/2,1460);

  // Assinatura institucional do card: substitui definitivamente o "Thiago"
  // gravado na arte-base e deixa claro que os dados vieram do aplicativo.
  v67630RoundRect(x,205,1510,670,116,54,'rgba(2,2,2,.99)','#6b0d10');x.fillStyle='#fff';x.font='900 34px Arial';x.fillText('APLICATIVO',W/2,1558);x.fillStyle='#aaa';x.font='700 20px Arial';x.fillText('TREINO 2ª CIA',W/2,1592);
  return c;
}
function v67685DownloadShareBlob(blob,fileName){
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=fileName;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
}
async function v67685PrepareShareCard(record){
  const key=String(record?.atividadeId||record?.id||record?.date||'')+'|'+String(record?.plan||'');
  if(v67685SharePrepared?.key===key)return v67685SharePrepared;
  if(v67685SharePreparing?.key===key)return v67685SharePreparing.promise;
  const promise=(async()=>{
    const canvas=await v67630BuildShareCard(record);
    const blob=await new Promise(res=>canvas.toBlob(res,'image/png',.96));
    if(!blob)throw new Error('Falha ao gerar imagem');
    const fileName=`treino-2cia-premium-${Date.now()}.png`;
    const prepared={key,blob,file:new File([blob],fileName,{type:'image/png'}),fileName};
    v67685SharePrepared=prepared;return prepared;
  })();
  v67685SharePreparing={key,promise};
  try{return await promise}finally{if(v67685SharePreparing?.key===key)v67685SharePreparing=null}
}
function v67685StartPreparingShare(record){
  const btn=document.getElementById('v67630ShareBtn');
  if(btn){btn.disabled=true;btn.textContent='PREPARANDO CARD…'}
  v67685PrepareShareCard(record).then(()=>{const b=document.getElementById('v67630ShareBtn');if(b){b.disabled=false;b.textContent='↗ COMPARTILHAR RESULTADO'}}).catch(e=>{console.error('Preparar card:',e);const b=document.getElementById('v67630ShareBtn');if(b){b.disabled=false;b.textContent='↗ TENTAR GERAR CARD'}});
}
async function v67630ShareResult(){
  const record=v67630ShareRecord;if(!record){alert('Não foi possível localizar o resultado deste treino.');return}
  const btn=document.getElementById('v67630ShareBtn');
  // V67.68.5: o card é pré-gerado antes do toque. Assim navigator.share() é chamado
  // diretamente pelo gesto do usuário e não perde a ativação transitória no Android/PWA.
  let prepared=v67685SharePrepared;
  const key=String(record?.atividadeId||record?.id||record?.date||'')+'|'+String(record?.plan||'');
  if(!prepared||prepared.key!==key){
    if(btn){btn.disabled=true;btn.textContent='PREPARANDO CARD…'}
    try{await v67685PrepareShareCard(record)}catch(e){console.error('Compartilhar resultado:',e);alert('Não foi possível gerar o card. Tente novamente.');if(btn){btn.disabled=false;btn.textContent='↗ TENTAR GERAR CARD'};return}
    if(btn){btn.disabled=false;btn.textContent='↗ COMPARTILHAR RESULTADO'}
    // O primeiro toque foi usado para preparar. Um novo toque preserva o gesto exigido pelo Android.
    return;
  }
  try{
    const {blob,file,fileName}=prepared;
    if(navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))){
      await navigator.share({files:[file],title:'Treino 2ª CIA',text:'Treino concluído. Missão cumprida!'});
    }else{
      v67685DownloadShareBlob(blob,fileName);
      alert('O compartilhamento direto não está disponível neste aparelho. O card foi salvo como imagem.');
    }
  }catch(e){
    if(e?.name!=='AbortError'){
      console.error('Compartilhar resultado:',e);
      // fallback real: não perde o card já gerado
      try{v67685DownloadShareBlob(prepared.blob,prepared.fileName);alert('O Android não abriu o compartilhamento. O card foi salvo como imagem para você compartilhar manualmente.')}catch(_){alert('Não foi possível compartilhar o card agora. Tente novamente.')}
    }
  }
}
window.v67630ShareResult=v67630ShareResult;

function v6750ClosePostWorkout(){document.getElementById('v6750PostWorkout')?.classList.remove('show')}
function v6750OpenFeed(){v6750ClosePostWorkout();showView('home');setTimeout(()=>document.querySelector('.sports-feed-shell')?.scrollIntoView({behavior:'smooth',block:'start'}),180)}
function v6750ShowPostWorkout(record){
  if(!record)return; v67630ShareRecord=record; const rank=v6750RankingLine(record), prs=v6750NewRecordLines(record), ach=v6750FreshAchievement(record);
  let el=byId('v6750PostWorkout');if(!el){el=document.createElement('div');el.id='v6750PostWorkout';el.className='v6750-post';document.body.appendChild(el)}
  const highlights=[...prs];if(ach)highlights.push(`${ach.icon} Conquista: ${ach.name}`);
  el.innerHTML=`<div class="v6750-sheet"><div class="v6750-check">✓</div><span class="v6750-kicker">ATIVIDADE CONCLUÍDA</span><h2>${v6750Escape(record.plan||'Treino concluído')}</h2><div class="v6750-metrics">${v6750MetricCards(record)}</div>${highlights.length?`<div class="v6750-highlights">${highlights.map(x=>`<b>${v6750Escape(x)}</b>`).join('')}</div>`:''}<div class="v6750-rank ${rank.kind}"><span>${rank.icon}</span><div><b>${rank.title}</b><small>${rank.text}</small></div></div><div class="v67630-share-wrap"><button id="v67630ShareBtn" class="big red v67630-share-btn" onclick="v67630ShareResult()">↗ COMPARTILHAR RESULTADO</button><small>Gera uma arte 9:16 pronta para WhatsApp, Instagram e outros apps.</small></div><div class="v6750-actions"><button class="big" onclick="v6750ClosePostWorkout()">CONCLUIR</button><button class="big" onclick="v6750OpenFeed()">VER NO FEED</button></div></div>`;
  el.classList.add('show');
  v67685SharePrepared=null; v67685SharePreparing=null;
  setTimeout(()=>v67685StartPreparingShare(record),60);
  try{v6749RenderPerformance(false)}catch(e){}
}

function updateLast(){
  const el=byId('lastWorkout');
  if(el) el.textContent=localStorage.getItem('t2_last')||"Nenhum treino registrado.";
}
function cardioHistoryMeta(w){
  const meta=CARDIO_MACHINE_META[w?.cardioMachine]||{label:'Cardio',icon:'❤️'};
  const extras=[];
  if(w?.cardioMachine==='swim'){
    if(w?.swimType==='open')extras.push('Águas abertas'); else if(w?.swimType==='pool')extras.push('Piscina');
    if(w?.activityLocationLabel)extras.push(`📍 ${w.activityLocationLabel}`);
    const meters=Number(w?.swimDistanceMeters||0);if(meters>0)extras.push(meters>=1000?`${(meters/1000).toLocaleString('pt-BR',{maximumFractionDigits:2})} km`:`${Math.round(meters)} m`);
    const ps=Number(w?.swimPaceSecondsPer100m||0);if(ps>0)extras.push(`${Math.floor(ps/60)}:${String(ps%60).padStart(2,'0')} /100 m`);
  }
  if(w?.cardioMachine==='rower'){
    if(Number(w?.rowerDistanceMeters)>0)extras.push(`${Math.round(Number(w.rowerDistanceMeters)).toLocaleString('pt-BR')} m`);
    const ps=Number(w?.rowerPaceSecondsPer500m||0);if(ps>0)extras.push(`${Math.floor(ps/60)}:${String(ps%60).padStart(2,'0')} /500 m`);
    if(Number(w?.rowerSpm)>0)extras.push(`${Math.round(Number(w.rowerSpm))} SPM`);
  }
  if(w?.cardioMachine==='bike'){if(w?.bikeIntensity)extras.push(`Intensidade ${w.bikeIntensity}`);if(Number(w?.bikeHrAvg)>0)extras.push(`FC méd. ${Math.round(Number(w.bikeHrAvg))} bpm`);}
  if(['treadmill','run'].includes(w?.cardioMachine)){
    if(w?.cardioMachine==='run'&&w?.activityLocationLabel)extras.push(`📍 ${w.activityLocationLabel}`);
    if(Number(w?.cardioDistanceKm)>0)extras.push(`${Number(w.cardioDistanceKm).toLocaleString('pt-BR',{maximumFractionDigits:2})} km`);
    const paceSec=Number(w?.cardioPaceSecondsPerKm)>0?Number(w.cardioPaceSecondsPerKm):(Number(w?.duration)>0&&Number(w?.cardioDistanceKm)>0?Math.round(Number(w.duration)*60/Number(w.cardioDistanceKm)):0);
    if(paceSec>0)extras.push(`${Math.floor(paceSec/60)}:${String(Math.round(paceSec%60)).padStart(2,'0')} min/km`);
    if(Number(w?.cardioCalories)>0)extras.push(`${Math.round(Number(w.cardioCalories))} kcal`);
  }
  return `${meta.icon} ${meta.label} • ${Number(w?.duration||0)} min${extras.length?' • '+extras.join(' • '):''}`;
}
function v6742LocalDayKey(value){
  const d=value instanceof Date?value:new Date(value);
  if(Number.isNaN(d.getTime()))return '';
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function v6742DayLabel(date,offset){
  if(offset===0)return 'Hoje';
  if(offset===1)return 'Ontem';
  const weekday=date.toLocaleDateString('pt-BR',{weekday:'short'}).replace('.','');
  return `${weekday.charAt(0).toUpperCase()+weekday.slice(1)} • ${date.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}`;
}
function v6742WorkoutShortLabel(w){
  if(!w)return 'Atividade';
  if(isCardioRecord(w)){
    const meta=CARDIO_MACHINE_META[w.cardioMachine]||{label:'Cardio',icon:'❤️'};
    return `${meta.icon} ${meta.label}`;
  }
  if(w.workoutType==='core')return '🛡️ Core Operacional';
  if(w.workoutType==='free'){
    const groups=(w.muscleGroups||[]).filter(Boolean);
    return `🏋️ Treino Livre${groups.length?' — '+groups.join(' / '):''}`;
  }
  return `🏋️ ${w.plan||'Treino'}`;
}
function v6742WorkoutShortMeta(w){
  if(isCardioRecord(w)){if(w.cardioMachine==='swim'&&Number(w.swimDistanceMeters)>0)return `${Number(w.swimDistanceMeters)>=1000?(Number(w.swimDistanceMeters)/1000).toLocaleString('pt-BR',{maximumFractionDigits:2})+' km':Math.round(Number(w.swimDistanceMeters))+' m'} • ${Number(w.duration||0)} min`;return `${Number(w.duration||0)} min`;}
  if(w.workoutType==='core')return `${Number(w.duration||0)} min`;
  if(w.workoutType==='free')return `${Number(w.duration||0)} min`;
  const parts=[];
  if(Number(w.exercisesDone??w.exercises)>0)parts.push(`${Number(w.exercisesDone??w.exercises)} exercícios`);
  if(Number(w.duration)>0)parts.push(`${Number(w.duration)} min`);
  return parts.join(' • ')||'Treino concluído';
}
function v6742RecentSevenDaysHtml(workouts){
  const now=new Date();
  const rows=[];
  let activityCount=0;
  for(let offset=0;offset<7;offset++){
    const d=new Date(now.getFullYear(),now.getMonth(),now.getDate()-offset,12,0,0,0);
    const key=v6742LocalDayKey(d);
    const dayItems=(workouts||[])
      .filter(w=>v6742LocalDayKey(w.date)===key)
      .slice()
      .sort((a,b)=>new Date(b.date)-new Date(a.date));
    activityCount+=dayItems.length;
    rows.push(`<div class="v6742-week-day ${dayItems.length?'has-training':'rest-day'}">
      <div class="v6742-week-date"><b>${v6742DayLabel(d,offset)}</b><span>${dayItems.length?`${dayItems.length} ${dayItems.length===1?'atividade':'atividades'}`:'Descanso / sem registro'}</span></div>
      <div class="v6742-week-items">${dayItems.length?dayItems.map(w=>`<div class="v6742-week-item"><div><strong>${escapeCustomHtml(v6742WorkoutShortLabel(w))}</strong><small>${escapeCustomHtml(v6742WorkoutShortMeta(w))}</small></div><time>${new Date(w.date).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</time></div>`).join(''):'<div class="v6742-rest">—</div>'}</div>
    </div>`);
  }
  return `<div class="card v6742-week-card">
    <div class="v6742-week-head"><div><span class="eyebrow">VISÃO RÁPIDA</span><h3>Últimos 7 dias</h3></div><span class="v6742-week-count">${activityCount} ${activityCount===1?'atividade':'atividades'}</span></div>
    <p class="muted">Veja o que você treinou recentemente antes de escolher o próximo treino.</p>
    <div class="v6742-week-list">${rows.join('')}</div>
  </div>`;
}
function v6742LastPlanInfo(planName){
  const target=String(planName||'').trim();
  if(!target)return '';
  const wh=migrateWorkoutQuality()
    .filter(w=>String(w.plan||'').trim()===target && w.date)
    .sort((a,b)=>new Date(b.date)-new Date(a.date));
  if(!wh.length)return 'Ainda não realizado';
  const last=new Date(wh[0].date);
  if(Number.isNaN(last.getTime()))return '';
  const today=new Date();
  const a=new Date(today.getFullYear(),today.getMonth(),today.getDate());
  const b=new Date(last.getFullYear(),last.getMonth(),last.getDate());
  const days=Math.max(0,Math.round((a-b)/86400000));
  if(days===0)return 'Último: hoje';
  if(days===1)return 'Último: ontem';
  return `Último: há ${days} dias`;
}
function renderHistory(){
  const h=history(); reconcileWorkoutHistory(); const wh=migrateWorkoutQuality();
  const tafList=(typeof tafGetRecords==='function'?tafGetRecords():[]);
  const detail=byId('historyDetail'); if(detail) detail.style.display='none';
  const list=byId('historyList'); if(list) list.style.display='block';
  let out='';

  out+=v6742RecentSevenDaysHtml(wh);

  if(wh.length){
    out+=`<div class="card"><h3>Treinos concluídos</h3><p class="muted">Toque em um treino para ver o resumo completo.</p>${wh.slice(0,30).map((x,i)=>`
      <button class="workout-hist workout-open" onclick="openWorkoutHistory(${i})">
        <b>${x.plan}</b>
        <span>${isCardioRecord(x)
          ? cardioHistoryMeta(x)
          : x.workoutType==='free'
            ? `${(x.muscleGroups||[]).join(' • ')||'Treino livre'} • ${x.duration} min`
            : `${x.exercisesDone??x.exercises??0} exercícios • ${x.sets??0} séries • ${x.duration} min`}</span>
        <span>${isCardioRecord(x)
          ? `${x.cardioServiceDay===true?'📍 Presença validada':'Sem validação'} • ${Number(x.duration||0)>=30?'mínimo de 30 min atingido':'menos de 30 min — não pontua'}`
          : x.workoutType==='free'
            ? (x.serviceDay===true?'📍 Presença validada':'Sem validação de presença')
            : (x.legacyData?'Registro antigo — fora da evolução':(x.excludedFromStats?'Ignorado na evolução':Number(x.volume||0).toLocaleString('pt-BR')+' kg de volume'))}</span>
        <small>${new Date(x.date).toLocaleString('pt-BR')}</small>
      </button>`).join('')}</div>`;
  } else {
    out+='<div class="card">Nenhum treino concluído ainda.</div>';
  }

  out+=`<div class="card history-taf-card">
    <div class="history-taf-title">
      <div><span class="eyebrow">MEU TAF</span><h3>Histórico de TAF</h3></div>
      <span class="history-taf-count">${tafList.length} ${tafList.length===1?'registro':'registros'}</span>
    </div>
    ${tafList.length
      ? tafList.slice(0,30).map(r=>{
          const max=r.mode==='4'?40:30;
          const d=new Date((r.date||'')+'T12:00:00');
          const dateText=Number.isNaN(d.getTime())?String(r.date||''):d.toLocaleDateString('pt-BR');
          return `<div class="history-taf-item">
            <div class="history-taf-head">
              <div><b>TAF • ${r.mode} exercícios</b><small>${dateText} • ${r.age} anos</small></div>
              <div class="history-taf-result"><strong>${r.sum}/${max}</strong><span>${escapeCustomHtml(r.classification||'')}</span></div>
            </div>
            <div class="history-taf-data">
              ${r.mode==='4'||r.choice==='pushup'?`<span>Flexão <b>${Number.isFinite(r.values?.pushup)?r.values.pushup:'—'}</b> • ${r.points?.pushup??'—'} pts</span>`:''}
              ${r.mode==='4'||r.choice==='bar'?`<span>Barra <b>${Number.isFinite(r.values?.bar)?r.values.bar:'—'}</b> • ${r.points?.bar??'—'} pts</span>`:''}
              <span>Abdominal <b>${Number.isFinite(r.values?.abs)?r.values.abs:'—'}</b> • ${r.points?.abs??'—'} pts</span>
              <span>Corrida <b>${tafFmtTime(r.values?.run)}</b> • ${r.points?.run??'—'} pts</span>
              ${r.values?.swim!=null?`<span>Natação extra <b>${tafFmtTime(r.values.swim)}</b> • ${r.points?.swim??'—'} pts</span>`:''}
            </div>
          </div>`;
        }).join('')
      : '<div class="custom-empty">Nenhum TAF realizado ainda.</div>'}
  </div>`;

  byId('historyList').innerHTML=out;
}
function openWorkoutHistory(index){
  navHistoryIndex=index;
  saveNavigationState('history');
  reconcileWorkoutHistory(); const wh=migrateWorkoutQuality(), w=wh[index]; if(!w)return;
  if(isCardioRecord(w)&&w.cardioMachine==='swim'){
    byId('historyList').style.display='none';const d=byId('historyDetail');d.style.display='block';
    const meters=Number(w.swimDistanceMeters||0),ps=Number(w.swimPaceSecondsPer100m||0);
    const dist=meters>=1000?`${(meters/1000).toLocaleString('pt-BR',{maximumFractionDigits:2})} km`:`${Math.round(meters)} m`;
    const pace=ps>0?`${Math.floor(ps/60)}:${String(ps%60).padStart(2,'0')}`:'--:--';
    d.innerHTML=`<div class="bar"><button onclick="closeWorkoutHistory()">←</button><h2>Resumo da natação</h2></div><div class="card workout-summary cardio-summary"><div class="eyebrow">NATAÇÃO CONCLUÍDA</div><h3>🏊 Natação</h3><div class="finish-stats cardio-finish-stats"><div><strong>${dist}</strong><span>distância</span></div><div><strong>${Number(w.duration||0)}</strong><span>min</span></div><div><strong>${pace}</strong><span>/100 m</span></div></div><p class="cardio-detail-status">Registro esportivo • não pontua no Ranking de Frequência.</p><small>${new Date(w.date).toLocaleString('pt-BR')}</small><button class="big danger-mini v67382-delete-history" onclick="v67382DeleteWorkoutHistory(${index})">EXCLUIR ATIVIDADE</button></div>`;scrollTo({top:0,behavior:'smooth'});return;
  }
  if(isCardioRecord(w)){
    byId('historyList').style.display='none';
    const d=byId('historyDetail'); d.style.display='block';
    const meta=CARDIO_MACHINE_META[w.cardioMachine]||{label:'Cardio',icon:'❤️'};
    const extra=['treadmill','run'].includes(w.cardioMachine)
      ? (()=>{const ps=Number(w.cardioPaceSecondsPerKm)>0?Number(w.cardioPaceSecondsPerKm):(Number(w.duration)>0&&Number(w.cardioDistanceKm)>0?Math.round(Number(w.duration)*60/Number(w.cardioDistanceKm)):0);const pace=ps>0?`${Math.floor(ps/60)}:${String(Math.round(ps%60)).padStart(2,'0')}`:'--:--';return `<div><strong>${Number(w.cardioDistanceKm||0).toLocaleString('pt-BR',{maximumFractionDigits:2})}</strong><span>km</span></div><div><strong>${pace}</strong><span>min/km</span></div>${Number(w.cardioCalories)>0?`<div><strong>${Math.round(Number(w.cardioCalories))}</strong><span>kcal</span></div>`:''}${w.cardioMachine==='treadmill'&&Number.isFinite(Number(w.cardioInclinePercent))?`<div><strong>${Number(w.cardioInclinePercent).toLocaleString('pt-BR')}%</strong><span>inclinação</span></div>`:''}`})()
      : w.cardioMachine==='rower'
        ? `<div><strong>${Math.round(Number(w.rowerDistanceMeters||0)).toLocaleString('pt-BR')}</strong><span>m</span></div><div><strong>${v6749FmtPace(w.rowerPaceSecondsPer500m,'/500 m')}</strong><span>ritmo</span></div>${Number(w.rowerSpm)>0?`<div><strong>${Math.round(Number(w.rowerSpm))}</strong><span>SPM</span></div>`:''}`
        : w.cardioMachine==='bike'
          ? `<div><strong>${v6750Escape(w.bikeIntensity||'—')}</strong><span>intensidade</span></div>${Number(w.bikeHrAvg)>0?`<div><strong>${Math.round(Number(w.bikeHrAvg))}</strong><span>FC média</span></div>`:''}${Number(w.bikeHrMax)>0?`<div><strong>${Math.round(Number(w.bikeHrMax))}</strong><span>FC máxima</span></div>`:''}${Number(w.cardioCalories)>0?`<div><strong>${Math.round(Number(w.cardioCalories))}</strong><span>kcal</span></div>`:''}`
          : '';
    d.innerHTML=`<div class="bar"><button onclick="closeWorkoutHistory()">←</button><h2>Resumo do cardio</h2></div>
      <div class="card workout-summary cardio-summary">
        <div class="eyebrow">CARDIO CONCLUÍDO</div><h3>${meta.icon} ${meta.label}</h3>
        <div class="finish-stats cardio-finish-stats">
          <div><strong>${Number(w.duration||0)}</strong><span>min</span></div>${extra}
        </div>
        <p class="cardio-detail-status">${w.cardioMachine==='run'?'Registro esportivo • não pontua no Ranking de Frequência.':(Number(w.duration||0)>=30?'✓ Critério mínimo de 30 minutos atingido.':'Atividade abaixo de 30 minutos: não gera ponto no ranking.')}</p>
        <p class="muted">${w.cardioServiceDay===true?'📍 Presença na unidade validada.':'Registrado sem validação de presença.'}</p>
        <small>${new Date(w.date).toLocaleString('pt-BR')}</small>
        <button class="big danger-mini v67382-delete-history" onclick="v67382DeleteWorkoutHistory(${index})">EXCLUIR ATIVIDADE</button>
      </div>`;
    scrollTo({top:0,behavior:'smooth'});
    return;
  }
  const all=history();
  const start=w.startedAt?new Date(w.startedAt).getTime():0, end=new Date(w.date).getTime();
  let sets=all.filter(x=>{
    const t=new Date(x.date).getTime();
    return x.plan===w.plan && t>=start && t<=end;
  });
  const grouped={};
  sets.forEach(x=>{(grouped[x.exercise]??=[]).push(x)});
  const rows=Object.entries(grouped).map(([name,items])=>`
    <div class="detail-ex">
      <b>${name}</b>
      ${items.sort((a,b)=>a.set-b.set).map(x=>`<span>Série ${x.set}: ${formatSetRecord(x)}</span>`).join('')}
    </div>`).join('');
  byId('historyList').style.display='none';
  const d=byId('historyDetail'); d.style.display='block';
  d.innerHTML=`<div class="bar"><button onclick="closeWorkoutHistory()">←</button><h2>Resumo do treino</h2></div>
    <div class="card workout-summary">
      <div class="eyebrow">TREINO CONCLUÍDO</div><h3>${w.plan}</h3>
      <div class="finish-stats">
        <div><strong>${w.exercisesDone??0}</strong><span>exercícios</span></div>
        <div><strong>${w.sets??0}</strong><span>séries</span></div>
        <div><strong>${w.duration??0}</strong><span>min</span></div>
        <div><strong>${Number(w.volume||0).toLocaleString('pt-BR')}</strong><span>kg volume</span></div>
      </div>
      <small>${new Date(w.date).toLocaleString('pt-BR')}</small>
      ${w.legacyData?`<div class="quality-warning">⚠ Registro antigo/inconsistente. Não entra nos cálculos de evolução.${w.qualityReason?`<small>${w.qualityReason}</small>`:''}</div>`:''}
      ${!w.legacyData?`<button class="big stats-toggle" onclick="toggleWorkoutStats(${index})">${w.excludedFromStats?'INCLUIR NA EVOLUÇÃO':'IGNORAR NA EVOLUÇÃO'}</button>`:''}
      <button class="big danger-mini v67382-delete-history" onclick="v67382DeleteWorkoutHistory(${index})">EXCLUIR ATIVIDADE</button>
    </div>
    ${!w.legacyData&&!w.excludedFromStats?`<div class="card"><h3>Comparação com treino anterior</h3>${smartComparisonHtml(w)}</div>`:''}
    <div class="card"><h3>Séries realizadas</h3>${rows||'<p>Sem séries detalhadas.</p>'}</div>`;
  scrollTo({top:0,behavior:'smooth'});
}
function closeWorkoutHistory(){
  navHistoryIndex=null;
  saveNavigationState('history');
  byId('historyDetail').style.display='none';byId('historyList').style.display='block';scrollTo({top:0,behavior:'smooth'});
}

async function v67382DeleteWorkoutHistory(index){
  const wh=migrateWorkoutQuality(),w=wh[index];if(!w)return;
  const label=w.plan||'esta atividade';
  if(!confirm(`Excluir "${label}" do histórico?\n\nA publicação correspondente também será removida do Feed Esportivo.`))return;

  // v67.38.7: primeiro confirma a remoção no servidor. Só depois apaga localmente.
  // Assim Histórico/Ranking/Evolução nunca ficam divergentes do Feed quando há internet.
  if(!navigator.onLine||!cloudSession?.token){
    alert('Para excluir uma atividade publicada no Feed, conecte-se à internet e tente novamente.');
    return;
  }

  let feedOk=false;
  try{
    feedOk=await v67383DeleteFeedActivity(w);
    if(!feedOk){
      // V67.60.5 — se a atividade nunca chegou a ser publicada no Feed,
      // a ausência confirmada no servidor é um estado seguro para apagar só o Histórico.
      const stillExists=await v67386FeedPostStillExists(w);
      if(stillExists){
        alert('Não foi possível remover a publicação do Feed. A atividade foi mantida no Histórico para evitar divergência. Tente novamente.');
        return;
      }
      feedOk=true;
      v67605RemovePendingFeedDelete(w);
    }
  }catch(e){
    console.warn('Falha ao confirmar exclusão do Feed:',e);
    alert('Não foi possível confirmar a exclusão no Feed. A atividade foi mantida no Histórico.');
    return;
  }

  const end=new Date(w.date).getTime();
  const start=w.startedAt?new Date(w.startedAt).getTime():NaN;
  const remainingHistory=history().filter(x=>{
    if(x.plan!==w.plan)return true;
    const t=new Date(x.date).getTime();
    if(Number.isFinite(start))return !(t>=start&&t<=end);
    return x.date!==w.date;
  });
  const remainingWorkouts=wh.filter((_,i)=>i!==index);
  saveHistory(remainingHistory);saveWorkoutHistory(remainingWorkouts);

  navHistoryIndex=null;renderHistory();updateLast();
  await v6738LoadFeed(true);
  if(document.querySelector('.view.active')?.id==='home')await v67382RefreshFeed();
}


function validTrainingSets(){
  return reliableWorkouts().flatMap(w=>getWorkoutSets(w));
}
function standaloneSets(){
  return history().filter(x=>!x.plan);
}
function exercisePRHistory(exercise){
  return validTrainingSets()
    .filter(x=>x.exercise===exercise && Number(x.weight)>0 && !isLegacyRangeValue(x.reps))
    .slice()
    .sort((a,b)=>new Date(a.date)-new Date(b.date));
}
function previousBestBefore(exercise,date){
  const t=new Date(date).getTime();
  const vals=exercisePRHistory(exercise).filter(x=>new Date(x.date).getTime()<t).map(x=>Number(x.weight));
  return vals.length?Math.max(...vals):0;
}

function personalRecords(){
  const sets=validTrainingSets();
  const prs={};
  sets.forEach(x=>{
    const ex=exByName(x.exercise);
    if(Number(x.weight)>0 && !isBodyweightExercise(ex) && !isBodyweightName(x.exercise) && !isLegacyRangeValue(x.reps)){
      const w=Number(x.weight);
      if(!prs[x.exercise] || w>prs[x.exercise].weight){
        prs[x.exercise]={exercise:x.exercise,weight:w,date:x.date};
      }
    }
  });
  return Object.values(prs).map(p=>{
    const prev=previousBestBefore(p.exercise,p.date);
    const gain=prev>0?p.weight-prev:0;
    const pct=prev>0?gain/prev*100:null;
    return {...p,previous:prev,gain,pct};
  }).sort((a,b)=>b.weight-a.weight);
}

function workoutExerciseBestMap(w){
  const sets=getWorkoutSets(w);
  const map={};
  sets.forEach(x=>{
    const ex=exByName(x.exercise);
    if(Number(x.weight)>0 && !isBodyweightExercise(ex) && !isBodyweightName(x.exercise) && !isLegacyRangeValue(x.reps)){
      map[x.exercise]=Math.max(map[x.exercise]||0,Number(x.weight));
    }
  });
  return map;
}

function validWorkoutsSorted(){
  return getWorkouts().filter(w=>!w.ignored && Number(w.series||0)>0).sort((a,b)=>new Date(a.date)-new Date(b.date));
}
function dayKey(d){
  const x=new Date(d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;
}
function consistencyStats(){
  const ws=validWorkoutsSorted();
  const days=[...new Set(ws.map(w=>dayKey(w.date)))].sort();
  if(!days.length) return {current:0,best:0,last7:0,last30:0};
  const toDay=s=>Math.floor(new Date(s+"T12:00:00").getTime()/86400000);
  let best=1, run=1;
  for(let i=1;i<days.length;i++){
    if(toDay(days[i])-toDay(days[i-1])===1) run++; else run=1;
    best=Math.max(best,run);
  }
  let current=1;
  for(let i=days.length-1;i>0;i--){
    if(toDay(days[i])-toDay(days[i-1])===1) current++; else break;
  }
  const now=Date.now();
  return {
    current,best,
    last7:ws.filter(w=>now-new Date(w.date).getTime()<=7*86400000).length,
    last30:ws.filter(w=>now-new Date(w.date).getTime()<=30*86400000).length
  };
}
function weeklySummaryHtml(){
  const s=consistencyStats();
  const ws=validWorkoutsSorted();
  if(!ws.length) return '';
  const recent=ws.filter(w=>Date.now()-new Date(w.date).getTime()<=7*86400000);
  const volume=recent.reduce((a,w)=>a+Number(w.volume||0),0);
  return `<section class="card weekly-card">
    <h2>Consistência</h2>
    <div class="weekly-grid">
      <div><strong>${s.last7}</strong><span>treinos / 7 dias</span></div>
      <div><strong>${s.current}</strong><span>dias em sequência</span></div>
      <div><strong>${s.best}</strong><span>melhor sequência</span></div>
      <div><strong>${Math.round(volume).toLocaleString('pt-BR')}</strong><span>kg / 7 dias</span></div>
    </div>
  </section>`;
}


function openExerciseImageZoom(src,label){
  let overlay=document.getElementById('exerciseZoom');
  if(!overlay){
    overlay=document.createElement('div');
    overlay.id='exerciseZoom';
    overlay.className='exercise-zoom';
    overlay.innerHTML=`<button class="exercise-zoom-close" aria-label="Fechar">×</button>
      <div class="exercise-zoom-card">
        <div class="exercise-zoom-label"></div>
        <img alt="">
        <div class="exercise-zoom-hint">Toque fora da imagem para fechar</div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click',e=>{
      if(e.target===overlay || e.target.classList.contains('exercise-zoom-close')) overlay.classList.remove('show');
    });
  }
  overlay.querySelector('img').src=src;
  overlay.querySelector('img').alt=label||'Execução do exercício';
  overlay.querySelector('.exercise-zoom-label').textContent=label||'Execução';
  overlay.classList.add('show');
}
function bindExerciseImageZoom(){
  const s=byId('imgStart'), e=byId('imgEnd');
  if(s && !s.dataset.zoomBound){
    s.dataset.zoomBound='1';
    s.addEventListener('click',()=>openExerciseImageZoom(s.src,'POSIÇÃO INICIAL'));
  }
  if(e && !e.dataset.zoomBound){
    e.dataset.zoomBound='1';
    e.addEventListener('click',()=>openExerciseImageZoom(e.src,'POSIÇÃO FINAL'));
  }
}


let exerciseMotionTimer=null;
function stopExerciseMotion(){
  if(exerciseMotionTimer){ clearInterval(exerciseMotionTimer); exerciseMotionTimer=null; }
  const ov=document.getElementById('exerciseMotion');
  if(ov) ov.classList.remove('show');
}
function openExerciseMotion(){
  const start=byId('imgStart'), end=byId('imgEnd');
  if(!start || !end) return;
  let ov=document.getElementById('exerciseMotion');
  if(!ov){
    ov=document.createElement('div');
    ov.id='exerciseMotion';
    ov.className='exercise-motion';
    ov.innerHTML=`<button class="exercise-motion-close" aria-label="Fechar">×</button>
      <div class="exercise-motion-card">
        <div class="exercise-motion-top"><b>EXECUÇÃO DO MOVIMENTO</b><span id="motionLabel">POSIÇÃO INICIAL</span></div>
        <img id="motionImage" alt="Animação da execução">
        <div class="exercise-motion-progress"><i></i></div>
        <small>Visualização alternada entre início e fim • movimento real deve ser controlado</small>
      </div>`;
    document.body.appendChild(ov);
    ov.addEventListener('click',e=>{
      if(e.target===ov || e.target.classList.contains('exercise-motion-close')) stopExerciseMotion();
    });
  }
  const img=ov.querySelector('#motionImage');
  const label=ov.querySelector('#motionLabel');
  const frames=[{src:start.src,label:'POSIÇÃO INICIAL'},{src:end.src,label:'POSIÇÃO FINAL'}];
  let frame=0;
  img.src=frames[0].src; label.textContent=frames[0].label;
  ov.classList.add('show');
  if(exerciseMotionTimer) clearInterval(exerciseMotionTimer);
  exerciseMotionTimer=setInterval(()=>{
    frame=(frame+1)%2;
    img.classList.remove('motion-pop');
    void img.offsetWidth;
    img.src=frames[frame].src;
    label.textContent=frames[frame].label;
    img.classList.add('motion-pop');
  },950);
}
function updateMotionButton(hasRealistic){
  let btn=document.getElementById('motionBtn');
  const visual=document.querySelector('.visual');
  if(!visual) return;
  if(!btn){
    btn=document.createElement('button');
    btn.id='motionBtn';
    btn.className='motion-btn';
    btn.type='button';
    btn.innerHTML='▶ VER MOVIMENTO';
    visual.insertAdjacentElement('afterend',btn);
    btn.addEventListener('click',openExerciseMotion);
  }
  btn.style.display=hasRealistic?'flex':'none';
}

function smartWorkoutComparison(current){
  const prev=previousWorkoutSamePlan(current);
  if(!prev) return null;
  const curMap=workoutExerciseBestMap(current);
  const prevMap=workoutExerciseBestMap(prev);
  let increased=0, maintained=0, decreased=0, newPRs=0;
  const details=[];
  Object.keys(curMap).forEach(name=>{
    const cur=curMap[name];
    const old=prevMap[name];
    if(old==null){
      details.push({name,status:'novo',old:null,cur,diff:null,pct:null});
      return;
    }
    const diff=cur-old;
    const pct=old>0?diff/old*100:null;
    if(diff>0){
      increased++;
      const allBefore=validTrainingSets().filter(x=>x.exercise===name && new Date(x.date)<new Date(current.date) && Number(x.weight)>0);
      const bestBefore=allBefore.length?Math.max(...allBefore.map(x=>Number(x.weight))):0;
      if(cur>bestBefore) newPRs++;
    }else if(diff===0) maintained++;
    else decreased++;
    details.push({name,status:diff>0?'up':diff<0?'down':'same',old,cur,diff,pct});
  });
  const curVol=Number(current.volume||0), prevVol=Number(prev.volume||0);
  const volDiff=curVol-prevVol;
  const volPct=prevVol>0?volDiff/prevVol*100:null;
  return {prev,increased,maintained,decreased,newPRs,details,curVol,prevVol,volDiff,volPct};
}
function smartComparisonHtml(current){
  const c=smartWorkoutComparison(current);
  if(!c) return '<p class="muted">Ainda não há treino anterior válido deste mesmo plano para comparar.</p>';
  const sign=c.volDiff>0?'+':'';
  const top=c.details.slice().sort((a,b)=>(b.diff||0)-(a.diff||0)).slice(0,5);
  return `<div class="smart-compare">
    <div class="smart-grid">
      <div><strong class="${c.volDiff>0?'pos':c.volDiff<0?'neg':'neu'}">${sign}${Math.round(c.volDiff).toLocaleString('pt-BR')} kg</strong><span>volume</span></div>
      <div><strong>${c.increased}</strong><span>cargas ↑</span></div>
      <div><strong>${c.maintained}</strong><span>mantidas</span></div>
      <div><strong>${c.decreased}</strong><span>abaixo</span></div>
    </div>
    <div class="smart-volume">
      <span>${Math.round(c.prevVol).toLocaleString('pt-BR')} kg</span>
      <b>→</b>
      <span>${Math.round(c.curVol).toLocaleString('pt-BR')} kg</span>
      <strong class="${c.volDiff>0?'pos':c.volDiff<0?'neg':'neu'}">${c.volPct==null?'':`${sign}${c.volPct.toFixed(1)}%`}</strong>
    </div>
    ${c.newPRs?`<div class="smart-pr">🏆 ${c.newPRs} novo${c.newPRs===1?' recorde':'s recordes'} neste treino</div>`:''}
    <div class="smart-detail">${top.map(x=>`<div><span>${x.name}</span><b class="${x.status==='up'?'pos':x.status==='down'?'neg':'neu'}">${
      x.old==null?`${x.cur} kg`
      : x.status==='same'?'mantido'
      : `${x.old} → ${x.cur} kg (${x.diff>0?'+':''}${x.diff} kg)`
    }</b></div>`).join('')}</div>
  </div>`;
}

function previousWorkoutSamePlan(current){
  const wh=reliableWorkouts().slice().sort((a,b)=>new Date(b.date)-new Date(a.date));
  const same=wh.filter(x=>x.plan===current.plan);
  const idx=same.findIndex(x=>x.date===current.date);
  return idx>=0?same[idx+1]||null:null;
}
function workoutComparisonHtmlLegacy(current){
  const prev=previousWorkoutSamePlan(current);
  if(!prev) return '<p class="muted">Ainda não há treino anterior válido deste mesmo plano para comparar.</p>';
  const curVol=Number(current.volume||0), prevVol=Number(prev.volume||0);
  const diff=curVol-prevVol;
  const pct=prevVol>0?diff/prevVol*100:null;
  const sign=diff>0?'+':'';
  return `<div class="compare-box">
    <div><span>Treino anterior</span><b>${Math.round(prevVol).toLocaleString('pt-BR')} kg</b></div>
    <div><span>Treino atual</span><b>${Math.round(curVol).toLocaleString('pt-BR')} kg</b></div>
    <div class="${diff>0?'compare-up':diff<0?'compare-down':'compare-flat'}">
      <span>Diferença</span><b>${sign}${Math.round(diff).toLocaleString('pt-BR')} kg${pct===null?'':` • ${sign}${pct.toFixed(1)}%`}</b>
    </div>
  </div>`;
}
function checkNewPR(exercise, weight){
  if(!(weight>0) || !exercise) return false;
  const ex=exByName(exercise);
  if(isBodyweightExercise(ex) || isBodyweightName(exercise)) return false;
  const prior=history().filter(x=>
    x.exercise===exercise &&
    Number(x.weight)>0 &&
    Number(x.weight)<Number(weight) &&
    !isLegacyRangeValue(x.reps)
  );
  const previousBest=prior.length?Math.max(...prior.map(x=>Number(x.weight))):0;
  return Number(weight)>previousBest;
}

function renderProgress(){
  const h=history(); reconcileWorkoutHistory(); const whAll=migrateWorkoutQuality(), wh=reliableWorkouts(), now=new Date();
  const reliableDates=new Set(wh.map(w=>w.date.slice(0,10)));
  const days=new Set([...reliableDates]);
  const totalVolume=wh.reduce((sum,x)=>sum+Number(x.volume||0),0);
  const reliableSeries=wh.reduce((sum,w)=>sum+Number(w.sets||0),0);
  byId('progressSummary').innerHTML=`<div class="stat"><strong>${wh.length}</strong><small>treinos válidos</small></div><div class="stat"><strong>${reliableSeries}</strong><small>séries válidas</small></div><div class="stat"><strong>${days.size}</strong><small>dias treinados</small></div><div class="stat"><strong>${Math.round(totalVolume).toLocaleString('pt-BR')}</strong><small>kg de volume</small></div>`;

  const weekAgo=Date.now()-7*86400000, monthAgo=Date.now()-30*86400000;
  const week=wh.filter(x=>new Date(x.date).getTime()>=weekAgo).length;
  const month=wh.filter(x=>new Date(x.date).getTime()>=monthAgo).length;
  byId('periodStats').innerHTML=`<div class="period-row"><span>Últimos 7 dias</span><b>${week} treino${week===1?'':'s'}</b></div><div class="period-row"><span>Últimos 30 dias</span><b>${month} treino${month===1?'':'s'}</b></div>`;
  const ignored=whAll.filter(x=>x.legacyData||x.excludedFromStats).length;
  const dq=byId('dataQuality'); if(dq) dq.innerHTML=ignored?`<div class="quality-note">ℹ ${ignored} treino${ignored===1?'':'s'} antigo${ignored===1?'':'s'} ou ignorado${ignored===1?'':'s'} não entra${ignored===1?'':'m'} na evolução.</div>`:'<div class="quality-ok">✓ Todos os treinos contabilizados são válidos.</div>';

  const reliableSets=wh.flatMap(w=>getWorkoutSets(w));
  const best={};reliableSets.forEach(x=>{
    const ex=exByName(x.exercise);
    if(Number(x.weight)>0 && !isBodyweightExercise(ex) && !isBodyweightName(x.exercise) && !isLegacyRangeValue(x.reps)){
      best[x.exercise]=Math.max(best[x.exercise]||0,Number(x.weight));
    }
  });
  const rows=Object.entries(best).sort((a,b)=>b[1]-a[1]).slice(0,15);
  byId('bestLoads').innerHTML=rows.length?rows.map(([n,w])=>`<div class="best"><span>${n}</span><b>${w} kg</b></div>`).join(''):'Sem cargas registradas ainda.';
  const prs=personalRecords();
  const prBox=byId('personalRecords');
  if(prBox) prBox.innerHTML=prs.length?prs.slice(0,12).map(p=>{
    const increased=p.previous>0 && p.gain>0;
    const maintained=p.previous>0 && p.gain===0;
    return `<div class="pr-card ${increased?'pr-new':'pr-steady'}">
      <div class="pr-title-row">
        <span class="pr-medal">${increased?'🏆':'◆'}</span>
        <div class="pr-title"><b>${p.exercise}</b><small class="pr-date">${new Date(p.date).toLocaleDateString('pt-BR')}</small></div>
      </div>
      <div class="pr-weight">${p.weight} kg</div>
      <div class="pr-meta">${
        increased
          ? `Anterior: ${p.previous} kg <span>→</span> Atual: ${p.weight} kg <strong>+${p.gain.toFixed(p.gain%1?1:0)} kg (+${p.pct.toFixed(1)}%)</strong>`
          : maintained
            ? `Recorde mantido: <strong>${p.weight} kg</strong>`
            : 'Primeiro recorde válido registrado'
      }</div>
    </div>`;
  }).join(''):'<p class="muted">Registre cargas para criar seus recordes pessoais.</p>';

  // Volume só faz sentido quando houve carga externa registrada.
  // Treino livre, exercícios apenas com peso corporal e treinos sem carga não aparecem neste gráfico.
  const volumeEligible=wh.filter(w=>{
    if(isCardioRecord(w))return false;
    if(w.workoutType==='free')return false;
    return getWorkoutSets(w).some(s=>{
      const ex=exByName(s.exercise);
      return Number(s.weight||0)>0 && !isBodyweightExercise(ex) && !isBodyweightName(s.exercise);
    });
  });
  const recent=volumeEligible.slice(0,8).reverse();
  const maxVol=Math.max(1,...recent.map(x=>Number(x.volume||0)));
  byId('volumeChart').innerHTML=recent.length?recent.map(x=>{
    const pct=Math.max(4,Math.round(Number(x.volume||0)/maxVol*100));
    return `<div class="chart-row"><span>${String(x.plan).split('—')[0].trim()}</span><div class="bar-track"><i style="width:${pct}%"></i></div><b>${Math.round(Number(x.volume||0)).toLocaleString('pt-BR')} kg</b></div>`;
  }).join(''):'<p class="muted">Nenhum treino com carga registrada ainda.</p>';

  const avulsos=standaloneSets().filter(x=>Number(x.weight)>0 && !isBodyweightName(x.exercise));
  const avBox=byId('standaloneRecords');
  if(avBox){
    avBox.innerHTML=avulsos.length?avulsos.slice(0,10).map(x=>{
      const dt=new Date(x.date);
      return `<div class="standalone-card">
        <b>${x.exercise}</b>
        <span>${x.weight} kg × ${x.reps} reps</span>
        <small>${dt.toLocaleDateString('pt-BR')} • ${dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</small>
      </div>`;
    }).join(''):'<p class="muted">Nenhum registro avulso.</p>';
  }

  const names=[...new Set(reliableSets.filter(x=>
    Number(x.weight)>0 &&
    !isBodyweightExercise(exByName(x.exercise)) &&
    !isBodyweightName(x.exercise) &&
    !isLegacyRangeValue(x.reps)
  ).map(x=>x.exercise))].sort();
  const sel=byId('progressExercise');
  sel.innerHTML=names.length?names.map(n=>`<option value="${n.replaceAll('"','&quot;')}">${n}</option>`).join(''):'<option>Sem dados</option>';
  if(names.length) renderExerciseProgress(names[0]); else byId('exerciseProgressChart').innerHTML='<p class="muted">Registre cargas para acompanhar a evolução.</p>';
}
function renderExerciseProgress(name){
  const pts=validTrainingSets()
    .filter(x=>x.exercise===name&&Number(x.weight)>0&&!isLegacyRangeValue(x.reps))
    .slice()
    .sort((a,b)=>new Date(a.date)-new Date(b.date));

  const daily={};
  pts.forEach(x=>{
    const d=x.date.slice(0,10);
    daily[d]=Math.max(daily[d]||0,Number(x.weight));
  });
  const entries=Object.entries(daily).slice(-12);
  const box=byId('exerciseProgressChart');
  if(!entries.length){
    box.innerHTML='<p class="muted">Sem dados para este exercício.</p>';
    return;
  }

  const first=entries[0][1], last=entries[entries.length-1][1];
  const diff=last-first;
  const pct=first>0?diff/first*100:0;
  const max=Math.max(...entries.map(x=>x[1]),1);

  const summary=entries.length>1
    ? `<div class="exercise-summary">
        <div><span>Primeira carga</span><b>${first} kg</b></div>
        <div><span>Melhor atual</span><b>${last} kg</b></div>
        <div class="${diff>0?'gain-positive':diff<0?'gain-negative':'gain-neutral'}">
          <span>Evolução</span><b>${diff>0?'+':''}${diff} kg • ${diff>0?'+':''}${pct.toFixed(1)}%</b>
        </div>
      </div>`
    : `<div class="exercise-summary one"><div><span>Primeiro registro</span><b class="summary-value">${last} kg</b></div></div>`;

  const timeline=`<div class="progress-timeline">${entries.map(([d,w],i)=>{
    const prev=i?entries[i-1][1]:null;
    const delta=prev===null?null:w-prev;
    return `<div class="progress-point">
      <div class="progress-date">${new Date(d+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</div>
      <div class="progress-track"><i style="width:${Math.max(6,Math.round(w/max*100))}%"></i></div>
      <div class="progress-value"><b>${w} kg</b>${delta===null?'':`<small class="${delta>0?'up':delta<0?'down':'same'}">${delta>0?'+':''}${delta} kg</small>`}</div>
    </div>`;
  }).join('')}</div>`;

  box.innerHTML=summary+timeline;
}


const CORE_VISUALS = {
  'Prancha frontal': {demo:'assets/core-operacional/prancha_frontal-demo.webp',guide:'assets/core-operacional/prancha_frontal-guia.webp'},
  'Wood chop controlado — direita': {demo:'assets/core-operacional/woodchopper-demo.webp',guide:'assets/core-operacional/woodchopper-guia.webp'},
  'Wood chop controlado — esquerda': {demo:'assets/core-operacional/woodchopper-demo.webp',guide:'assets/core-operacional/woodchopper-guia.webp'},
  'Cable chop alto-baixo — direita': {demo:'assets/core-operacional/cable_chop-demo.webp',guide:'assets/core-operacional/cable_chop-guia.webp'},
  'Cable chop alto-baixo — esquerda': {demo:'assets/core-operacional/cable_chop-demo.webp',guide:'assets/core-operacional/cable_chop-guia.webp'},
  'Farmer carry': {demo:'assets/core-operacional/farmer_carry-demo.webp',guide:'assets/core-operacional/farmer_carry-guia.webp'},
  'Farmer carry pesado': {demo:'assets/core-operacional/farmer_carry-demo.webp',guide:'assets/core-operacional/farmer_carry-guia.webp'},
  'Suitcase carry — direita': {demo:'assets/core-operacional/suitcase_carry-demo.webp',guide:'assets/core-operacional/suitcase_carry-guia.webp'},
  'Suitcase carry — esquerda': {demo:'assets/core-operacional/suitcase_carry-demo.webp',guide:'assets/core-operacional/suitcase_carry-guia.webp'},
  'Suitcase carry pesado — direita': {demo:'assets/core-operacional/suitcase_carry-demo.webp',guide:'assets/core-operacional/suitcase_carry-guia.webp'},
  'Suitcase carry pesado — esquerda': {demo:'assets/core-operacional/suitcase_carry-demo.webp',guide:'assets/core-operacional/suitcase_carry-guia.webp'},
  'Suitcase carry pesado': {demo:'assets/core-operacional/suitcase_carry-demo.webp',guide:'assets/core-operacional/suitcase_carry-guia.webp'},
  'Bear-hug carry com sandbag': {demo:'assets/core-operacional/bear_hug_carry-demo.webp',guide:'assets/core-operacional/bear_hug_carry-guia.webp'},
  'Carga frontal abraçada': {demo:'assets/core-operacional/bear_hug_carry-demo.webp',guide:'assets/core-operacional/bear_hug_carry-guia.webp'},
  'Arrasto de peso em prancha': {demo:'assets/core-operacional/prancha_arrasto-demo.webp',guide:'assets/core-operacional/prancha_arrasto-guia.webp'},
  'Prancha com arrasto lateral': {demo:'assets/core-operacional/prancha_arrasto-demo.webp',guide:'assets/core-operacional/prancha_arrasto-guia.webp'},
  'Plank drag com anilha': {demo:'assets/core-operacional/prancha_arrasto-demo.webp',guide:'assets/core-operacional/prancha_arrasto-guia.webp'},
  'Plank drag pesado': {demo:'assets/core-operacional/prancha_arrasto-demo.webp',guide:'assets/core-operacional/prancha_arrasto-guia.webp'},
  'Arrasto de sled': {demo:'assets/core-operacional/arrasto_sled-demo.webp',guide:'assets/core-operacional/arrasto_sled-guia.webp'},
  'Desenvolvimento com halteres': {demo:'assets/core-operacional/shoulder_press-demo.webp',guide:'assets/core-operacional/shoulder_press-guia.webp'}
};


// V67.4 — cobertura visual ampliada do Core Operacional.
Object.assign(CORE_VISUALS,{
  'Respiração 360° + brace': {demo:'assets/core-operacional/respiracao_brace-demo2.webp',guide:'assets/core-operacional/respiracao_brace-painel.webp'},
  'Dead bug': {demo:'assets/core-operacional/dead_bug-demo2.webp',guide:'assets/core-operacional/dead_bug-painel.webp'},
  'Dead bug com puxada': {demo:'assets/core-operacional/dead_bug-demo2.webp',guide:'assets/core-operacional/dead_bug-painel.webp'},
  'Dead bug com pulldown': {demo:'assets/core-operacional/dead_bug-demo2.webp',guide:'assets/core-operacional/dead_bug-painel.webp'},
  'Bird dog': {demo:'assets/core-operacional/bird_dog-demo2.webp',guide:'assets/core-operacional/bird_dog-painel.webp'},
  'Prancha frontal': {demo:'assets/core-operacional/prancha_frontal-demo2.webp',guide:'assets/core-operacional/prancha_frontal-painel.webp'},
  'Prancha lateral direita': {demo:'assets/core-operacional/prancha_lateral_direita-demo2.webp',guide:'assets/core-operacional/prancha_lateral_direita-painel.webp'},
  'Prancha lateral esquerda': {demo:'assets/core-operacional/prancha_lateral_esquerda-demo2.webp',guide:'assets/core-operacional/prancha_lateral_esquerda-painel.webp'},
  'Prancha lateral alternada': {demo:'assets/core-operacional/prancha_lateral_direita-demo2.webp',guide:'assets/core-operacional/prancha_lateral_direita-painel.webp'},
  'Prancha lateral com alcance — direita': {demo:'assets/core-operacional/prancha_lateral_direita-demo2.webp',guide:'assets/core-operacional/prancha_lateral_direita-painel.webp'},
  'Prancha lateral com alcance — esquerda': {demo:'assets/core-operacional/prancha_lateral_esquerda-demo2.webp',guide:'assets/core-operacional/prancha_lateral_esquerda-painel.webp'},
  'Ponte com marcha': {demo:'assets/core-operacional/ponte_marcha-demo2.webp',guide:'assets/core-operacional/ponte_marcha-painel.webp'},
  'Prancha com arrasto lateral': {demo:'assets/core-operacional/prancha_arrasto-demo2.webp',guide:'assets/core-operacional/prancha_arrasto-painel.webp'},
  'Arrasto de peso em prancha': {demo:'assets/core-operacional/prancha_arrasto-demo2.webp',guide:'assets/core-operacional/prancha_arrasto-painel.webp'},
  'Prancha com puxada de halter': {demo:'assets/core-operacional/prancha_arrasto-demo2.webp',guide:'assets/core-operacional/prancha_arrasto-painel.webp'},
  'Plank drag com anilha': {demo:'assets/core-operacional/prancha_arrasto-demo2.webp',guide:'assets/core-operacional/prancha_arrasto-painel.webp'},
  'Plank drag pesado': {demo:'assets/core-operacional/prancha_arrasto-demo2.webp',guide:'assets/core-operacional/prancha_arrasto-painel.webp'},
  'Cable chop alto-baixo — direita': {demo:'assets/core-operacional/cable_chop-demo2.webp',guide:'assets/core-operacional/cable_chop-painel.webp'},
  'Cable chop alto-baixo — esquerda': {demo:'assets/core-operacional/cable_chop-demo2.webp',guide:'assets/core-operacional/cable_chop-painel.webp'},
  'Wood chop controlado — direita': {demo:'assets/core-operacional/cable_chop-demo2.webp',guide:'assets/core-operacional/cable_chop-painel.webp'},
  'Wood chop controlado — esquerda': {demo:'assets/core-operacional/cable_chop-demo2.webp',guide:'assets/core-operacional/cable_chop-painel.webp'},
  'Bear-hug carry com sandbag': {demo:'assets/core-operacional/bear_hug_carry-demo2.webp',guide:'assets/core-operacional/bear_hug_carry-painel.webp'},
  'Carga frontal abraçada': {demo:'assets/core-operacional/bear_hug_carry-demo2.webp',guide:'assets/core-operacional/bear_hug_carry-painel.webp'},
  'Suitcase carry — direita': {demo:'assets/core-operacional/suitcase_carry-demo2.webp',guide:'assets/core-operacional/suitcase_carry-painel.webp'},
  'Suitcase carry — esquerda': {demo:'assets/core-operacional/suitcase_carry-demo2.webp',guide:'assets/core-operacional/suitcase_carry-painel.webp'},
  'Suitcase carry pesado — direita': {demo:'assets/core-operacional/suitcase_carry-demo2.webp',guide:'assets/core-operacional/suitcase_carry-painel.webp'},
  'Suitcase carry pesado — esquerda': {demo:'assets/core-operacional/suitcase_carry-demo2.webp',guide:'assets/core-operacional/suitcase_carry-painel.webp'},
  'Suitcase carry pesado': {demo:'assets/core-operacional/suitcase_carry-demo2.webp',guide:'assets/core-operacional/suitcase_carry-painel.webp'},
  'Arrasto de sled': {demo:'assets/core-operacional/arrasto_sled-demo2.webp',guide:'assets/core-operacional/arrasto_sled-painel.webp'}
});


// V67.5 — novas artes específicas das sequências restantes.
Object.assign(CORE_VISUALS,{
  'Prancha com toque no ombro': {demo:'assets/core-operacional/prancha_toque_ombro-demo.webp',guide:'assets/core-operacional/prancha_toque_ombro-painel.webp'},

  'Pallof press': {demo:'assets/core-operacional/pallof_press-demo.webp',guide:'assets/core-operacional/pallof_press-painel.webp'},
  'Pallof press — direita': {demo:'assets/core-operacional/pallof_press-demo.webp',guide:'assets/core-operacional/pallof_press-painel.webp'},
  'Pallof press — esquerda': {demo:'assets/core-operacional/pallof_press-demo.webp',guide:'assets/core-operacional/pallof_press-painel.webp'},
  'Pallof press pesado — direita': {demo:'assets/core-operacional/pallof_press-demo.webp',guide:'assets/core-operacional/pallof_press-painel.webp'},
  'Pallof press pesado — esquerda': {demo:'assets/core-operacional/pallof_press-demo.webp',guide:'assets/core-operacional/pallof_press-painel.webp'},

  // A marcha unilateral usa o mesmo padrão visual do suitcase carry:
  // carga unilateral + tronco vertical + deslocamento sem inclinação.
  'Marcha unilateral — direita': {demo:'assets/core-operacional/suitcase_carry-demo2.webp',guide:'assets/core-operacional/suitcase_carry-painel.webp'},
  'Marcha unilateral — esquerda': {demo:'assets/core-operacional/suitcase_carry-demo2.webp',guide:'assets/core-operacional/suitcase_carry-painel.webp'}
});


// V67.6 — artes avançadas restantes.
Object.assign(CORE_VISUALS,{
  'Marcha front rack': {demo:'assets/core-operacional/front_rack-demo.webp',guide:'assets/core-operacional/front_rack-painel.webp'},
  'Front rack hold': {demo:'assets/core-operacional/front_rack-demo.webp',guide:'assets/core-operacional/front_rack-painel.webp'},
  'Front rack carry': {demo:'assets/core-operacional/front_rack-demo.webp',guide:'assets/core-operacional/front_rack-painel.webp'},

  'Goblet squat com pausa': {demo:'assets/core-operacional/front_squat-demo.webp',guide:'assets/core-operacional/front_squat-painel.webp'},
  'Front squat': {demo:'assets/core-operacional/front_squat-demo.webp',guide:'assets/core-operacional/front_squat-painel.webp'},

  'Step-up com carga frontal': {demo:'assets/core-operacional/step_up_carga-demo.webp',guide:'assets/core-operacional/step_up_carga-painel.webp'},
  'Step-up com farmer carry': {demo:'assets/core-operacional/step_up_carga-demo.webp',guide:'assets/core-operacional/step_up_carga-painel.webp'},
  'Step-up unilateral — carga direita': {demo:'assets/core-operacional/step_up_carga-demo.webp',guide:'assets/core-operacional/step_up_carga-painel.webp'},
  'Step-up unilateral — carga esquerda': {demo:'assets/core-operacional/step_up_carga-demo.webp',guide:'assets/core-operacional/step_up_carga-painel.webp'},

  'Landmine press meio-ajoelhado — direita': {demo:'assets/core-operacional/landmine_press-demo.webp',guide:'assets/core-operacional/landmine_press-painel.webp'},
  'Landmine press meio-ajoelhado — esquerda': {demo:'assets/core-operacional/landmine_press-demo.webp',guide:'assets/core-operacional/landmine_press-painel.webp'},
  'Meio-ajoelhado com press': {demo:'assets/core-operacional/landmine_press-demo.webp',guide:'assets/core-operacional/landmine_press-painel.webp'},

  'Remada unilateral em meio-ajoelhado — direita': {demo:'assets/core-operacional/remada_unilateral-demo.webp',guide:'assets/core-operacional/remada_unilateral-painel.webp'},
  'Remada unilateral em meio-ajoelhado — esquerda': {demo:'assets/core-operacional/remada_unilateral-demo.webp',guide:'assets/core-operacional/remada_unilateral-painel.webp'},

  'Suitcase deadlift — direita': {demo:'assets/core-operacional/deadlift-demo.webp',guide:'assets/core-operacional/deadlift-painel.webp'},
  'Suitcase deadlift — esquerda': {demo:'assets/core-operacional/deadlift-demo.webp',guide:'assets/core-operacional/deadlift-painel.webp'},

  'Battle rope alternada': {demo:'assets/core-operacional/battle_rope_alternada-demo.webp',guide:'assets/core-operacional/battle_rope_alternada-painel.webp'},
  'Battle rope slam': {demo:'assets/core-operacional/battle_rope_slam-demo.webp',guide:'assets/core-operacional/battle_rope_slam-painel.webp'},

  'Farmer hold pesado': {demo:'assets/core-operacional/farmer_carry_dupla-demo.webp',guide:'assets/core-operacional/farmer_carry_dupla-painel.webp'},
  'Overhead carry': {demo:'assets/core-operacional/overhead_carry-demo.webp',guide:'assets/core-operacional/overhead_carry-painel.webp'}
});


// V67.7 — cobertura visual 100% dos exercícios atualmente citados no Core Operacional.
Object.assign(CORE_VISUALS,{
  'Bear crawl controlado': {demo:'assets/core-operacional/bear_crawl-demo.webp',guide:'assets/core-operacional/bear_crawl-painel.webp'},
  'Crawl reverso': {demo:'assets/core-operacional/crawl_reverso-demo.webp',guide:'assets/core-operacional/crawl_reverso-painel.webp'},
  'Suitcase carry': {demo:'assets/core-operacional/suitcase_carry_exato-demo.webp',guide:'assets/core-operacional/suitcase_carry_exato-painel.webp'}
});



// V67.8 — substituição das 17 ilustrações defeituosas por artes HD com enquadramento completo.
Object.assign(CORE_VISUALS,{
  'Pallof press — direita': {demo:'assets/core-operacional/v67-8-hd/pallof_press_direita.webp',guide:'assets/core-operacional/v67-8-hd/pallof_press_direita.webp'},
  'Pallof press pesado — direita': {demo:'assets/core-operacional/v67-8-hd/pallof_press_direita.webp',guide:'assets/core-operacional/v67-8-hd/pallof_press_direita.webp'},
  'Pallof press — esquerda': {demo:'assets/core-operacional/v67-8-hd/pallof_press_esquerda.webp',guide:'assets/core-operacional/v67-8-hd/pallof_press_esquerda.webp'},
  'Pallof press pesado — esquerda': {demo:'assets/core-operacional/v67-8-hd/pallof_press_esquerda.webp',guide:'assets/core-operacional/v67-8-hd/pallof_press_esquerda.webp'},
  'Front rack hold': {demo:'assets/core-operacional/v67-8-hd/front_rack_hold.webp',guide:'assets/core-operacional/v67-8-hd/front_rack_hold.webp'},
  'Front rack carry': {demo:'assets/core-operacional/v67-8-hd/front_rack_hold.webp',guide:'assets/core-operacional/v67-8-hd/front_rack_hold.webp'},
  'Front squat': {demo:'assets/core-operacional/v67-8-hd/front_squat.webp',guide:'assets/core-operacional/v67-8-hd/front_squat.webp'},
  'Step-up com carga frontal': {demo:'assets/core-operacional/v67-8-hd/step_up_carga_frontal.webp',guide:'assets/core-operacional/v67-8-hd/step_up_carga_frontal.webp'},
  'Step-up unilateral — carga esquerda': {demo:'assets/core-operacional/v67-8-hd/step_up_unilateral_esquerda.webp',guide:'assets/core-operacional/v67-8-hd/step_up_unilateral_esquerda.webp'},
  'Remada unilateral em meio-ajoelhado — direita': {demo:'assets/core-operacional/v67-8-hd/remada_meio_ajoelhado_direita.webp',guide:'assets/core-operacional/v67-8-hd/remada_meio_ajoelhado_direita.webp'},
  'Remada unilateral em meio-ajoelhado — esquerda': {demo:'assets/core-operacional/v67-8-hd/remada_meio_ajoelhado_esquerda.webp',guide:'assets/core-operacional/v67-8-hd/remada_meio_ajoelhado_esquerda.webp'},
  'Suitcase deadlift — direita': {demo:'assets/core-operacional/v67-8-hd/suitcase_deadlift_direita.webp',guide:'assets/core-operacional/v67-8-hd/suitcase_deadlift_direita.webp'},
  'Suitcase deadlift — esquerda': {demo:'assets/core-operacional/v67-8-hd/suitcase_deadlift_esquerda.webp',guide:'assets/core-operacional/v67-8-hd/suitcase_deadlift_esquerda.webp'},
  'Farmer hold pesado': {demo:'assets/core-operacional/v67-8-hd/farmer_hold_pesado.webp',guide:'assets/core-operacional/v67-8-hd/farmer_hold_pesado.webp'},
  'Overhead carry': {demo:'assets/core-operacional/v67-8-hd/overhead_carry.webp',guide:'assets/core-operacional/v67-8-hd/overhead_carry.webp'},
  'Battle rope alternada': {demo:'assets/core-operacional/v67-8-hd/battle_rope_alternada.webp',guide:'assets/core-operacional/v67-8-hd/battle_rope_alternada.webp'},
  'Battle rope slam': {demo:'assets/core-operacional/v67-8-hd/battle_rope_slam.webp',guide:'assets/core-operacional/v67-8-hd/battle_rope_slam.webp'},
  'Landmine press meio-ajoelhado — direita': {demo:'assets/core-operacional/v67-8-hd/landmine_press_direita.webp',guide:'assets/core-operacional/v67-8-hd/landmine_press_direita.webp'},
  'Landmine press meio-ajoelhado — esquerda': {demo:'assets/core-operacional/v67-8-hd/landmine_press_esquerda.webp',guide:'assets/core-operacional/v67-8-hd/landmine_press_esquerda.webp'},
  'Dead bug com pulldown': {demo:'assets/core-operacional/v67-8-hd/dead_bug_pulldown.webp',guide:'assets/core-operacional/v67-8-hd/dead_bug_pulldown.webp'},
  'Dead bug com puxada': {demo:'assets/core-operacional/v67-8-hd/dead_bug_pulldown.webp',guide:'assets/core-operacional/v67-8-hd/dead_bug_pulldown.webp'}
});

// V67.9 — 29 ilustrações revisadas do Core Operacional.
Object.assign(CORE_VISUALS,{
  'Pallof press — direita': {demo:'assets/core-operacional/v67-9-hd/01_pallof_press_direita.webp',guide:'assets/core-operacional/v67-9-hd/01_pallof_press_direita.webp'},
  'Pallof press — esquerda': {demo:'assets/core-operacional/v67-9-hd/02_pallof_press_esquerda.webp',guide:'assets/core-operacional/v67-9-hd/02_pallof_press_esquerda.webp'},
  'Marcha front rack': {demo:'assets/core-operacional/v67-9-hd/03_marcha_front_rack.webp',guide:'assets/core-operacional/v67-9-hd/03_marcha_front_rack.webp'},
  'Dead bug com puxada': {demo:'assets/core-operacional/v67-9-hd/04_dead_bug_com_puxada.webp',guide:'assets/core-operacional/v67-9-hd/04_dead_bug_com_puxada.webp'},
  'Meio-ajoelhado com press': {demo:'assets/core-operacional/v67-9-hd/05_meio_ajoelhado_com_press.webp',guide:'assets/core-operacional/v67-9-hd/05_meio_ajoelhado_com_press.webp'},
  'Crawl reverso': {demo:'assets/core-operacional/v67-9-hd/06_crawl_reverso.webp',guide:'assets/core-operacional/v67-9-hd/06_crawl_reverso.webp'},
  'Pallof press': {demo:'assets/core-operacional/v67-9-hd/07_pallof_press.webp',guide:'assets/core-operacional/v67-9-hd/07_pallof_press.webp'},
  'Suitcase carry': {demo:'assets/core-operacional/v67-9-hd/08_suitcase_carry.webp',guide:'assets/core-operacional/v67-9-hd/08_suitcase_carry.webp'},
  'Goblet squat com pausa': {demo:'assets/core-operacional/v67-9-hd/09_goblet_squat_com_pausa.webp',guide:'assets/core-operacional/v67-9-hd/09_goblet_squat_com_pausa.webp'},
  'Front rack hold': {demo:'assets/core-operacional/v67-9-hd/10_front_rack_hold.webp',guide:'assets/core-operacional/v67-9-hd/10_front_rack_hold.webp'},
  'Suitcase deadlift — direita': {demo:'assets/core-operacional/v67-9-hd/11_suitcase_deadlift_direita.webp',guide:'assets/core-operacional/v67-9-hd/11_suitcase_deadlift_direita.webp'},
  'Suitcase deadlift — esquerda': {demo:'assets/core-operacional/v67-9-hd/12_suitcase_deadlift_esquerda.webp',guide:'assets/core-operacional/v67-9-hd/12_suitcase_deadlift_esquerda.webp'},
  'Overhead carry': {demo:'assets/core-operacional/v67-9-hd/13_overhead_carry.webp',guide:'assets/core-operacional/v67-9-hd/13_overhead_carry.webp'},
  'Remada unilateral em meio-ajoelhado — direita': {demo:'assets/core-operacional/v67-9-hd/14_remada_unilateral_meio_ajoelhado_direita.webp',guide:'assets/core-operacional/v67-9-hd/14_remada_unilateral_meio_ajoelhado_direita.webp'},
  'Remada unilateral em meio-ajoelhado — esquerda': {demo:'assets/core-operacional/v67-9-hd/15_remada_unilateral_meio_ajoelhado_esquerda.webp',guide:'assets/core-operacional/v67-9-hd/15_remada_unilateral_meio_ajoelhado_esquerda.webp'},
  'Battle rope alternada': {demo:'assets/core-operacional/v67-9-hd/16_battle_rope_alternada.webp',guide:'assets/core-operacional/v67-9-hd/16_battle_rope_alternada.webp'},
  'Battle rope slam': {demo:'assets/core-operacional/v67-9-hd/17_battle_rope_slam.webp',guide:'assets/core-operacional/v67-9-hd/17_battle_rope_slam.webp'},
  'Front rack carry': {demo:'assets/core-operacional/v67-9-hd/18_front_rack_carry.webp',guide:'assets/core-operacional/v67-9-hd/18_front_rack_carry.webp'},
  'Step-up com carga frontal': {demo:'assets/core-operacional/v67-9-hd/19_step_up_com_carga_frontal.webp',guide:'assets/core-operacional/v67-9-hd/19_step_up_com_carga_frontal.webp'},
  'Step-up com farmer carry': {demo:'assets/core-operacional/v67-9-hd/20_step_up_com_farmer_carry.webp',guide:'assets/core-operacional/v67-9-hd/20_step_up_com_farmer_carry.webp'},
  'Step-up unilateral — carga direita': {demo:'assets/core-operacional/v67-9-hd/21_step_up_unilateral_carga_direita.webp',guide:'assets/core-operacional/v67-9-hd/21_step_up_unilateral_carga_direita.webp'},
  'Step-up unilateral — carga esquerda': {demo:'assets/core-operacional/v67-9-hd/22_step_up_unilateral_carga_esquerda.webp',guide:'assets/core-operacional/v67-9-hd/22_step_up_unilateral_carga_esquerda.webp'},
  'Farmer hold pesado': {demo:'assets/core-operacional/v67-9-hd/23_farmer_hold_pesado.webp',guide:'assets/core-operacional/v67-9-hd/23_farmer_hold_pesado.webp'},
  'Front squat': {demo:'assets/core-operacional/v67-9-hd/24_front_squat.webp',guide:'assets/core-operacional/v67-9-hd/24_front_squat.webp'},
  'Pallof press pesado — direita': {demo:'assets/core-operacional/v67-9-hd/25_pallof_press_pesado_direita.webp',guide:'assets/core-operacional/v67-9-hd/25_pallof_press_pesado_direita.webp'},
  'Pallof press pesado — esquerda': {demo:'assets/core-operacional/v67-9-hd/26_pallof_press_pesado_esquerda.webp',guide:'assets/core-operacional/v67-9-hd/26_pallof_press_pesado_esquerda.webp'},
  'Landmine press meio-ajoelhado — direita': {demo:'assets/core-operacional/v67-9-hd/27_landmine_press_meio_ajoelhado_direita.webp',guide:'assets/core-operacional/v67-9-hd/27_landmine_press_meio_ajoelhado_direita.webp'},
  'Landmine press meio-ajoelhado — esquerda': {demo:'assets/core-operacional/v67-9-hd/28_landmine_press_meio_ajoelhado_esquerda.webp',guide:'assets/core-operacional/v67-9-hd/28_landmine_press_meio_ajoelhado_esquerda.webp'},
  'Dead bug com pulldown': {demo:'assets/core-operacional/v67-9-hd/29_dead_bug_com_pulldown.webp',guide:'assets/core-operacional/v67-9-hd/29_dead_bug_com_pulldown.webp'}
});
function coreVisualFor(name){ return CORE_VISUALS[name] || null; }

function openCoreVisual(src,title){
  let overlay=document.getElementById('coreVisualOverlay');
  if(!overlay){
    overlay=document.createElement('div');
    overlay.id='coreVisualOverlay';
    overlay.className='core-visual-overlay';
    overlay.innerHTML=`
      <div class="core-visual-modal">
        <div class="core-visual-modal-head">
          <b id="coreVisualTitle">Execução visual</b>
          <button type="button" onclick="closeCoreVisual()">✕</button>
        </div>
        <img id="coreVisualFull" alt="Demonstração detalhada do exercício">
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click',e=>{if(e.target===overlay)closeCoreVisual()});
  }
  const img=document.getElementById('coreVisualFull');
  const ttl=document.getElementById('coreVisualTitle');
  if(img)img.src=src;
  if(ttl)ttl.textContent=title||'Execução visual';
  overlay.classList.add('show');
  document.body.style.overflow='hidden';
}
function closeCoreVisual(){
  const overlay=document.getElementById('coreVisualOverlay');
  if(overlay)overlay.classList.remove('show');
  document.body.style.overflow='';
}

const CORE_OPERATIONAL_ROUTINES={
  base:{
    title:'Base Blindada',
    icon:'🛡️',
    subtitle:'Estabilidade lombopélvica e controle do tronco',
    duration:'6 min',
    mission:'Protege o tronco em flexões, agachamentos, levantamento de materiais e permanência com EPI.',
    steps:[
      {name:'Respiração 360° + brace',time:40,why:'Cria pressão abdominal antes de levantar, puxar ou transportar carga.',detail:'Deitado ou em pé, inspire expandindo abdômen e laterais das costelas. Trave o abdômen como se fosse receber um impacto, sem prender a respiração.'},
      {name:'Dead bug',time:45,why:'Treina estabilidade da lombar enquanto braços e pernas se movimentam.',detail:'Mantenha a lombar neutra e alterne braço e perna opostos. Reduza a amplitude se a lombar sair do controle.'},
      {name:'Bird dog',time:45,why:'Melhora estabilidade cruzada útil em deslocamentos, subida e trabalho assimétrico.',detail:'Em quatro apoios, estenda braço e perna opostos sem girar o quadril.'},
      {name:'Prancha frontal',time:40,why:'Aumenta resistência do tronco para sustentar equipamento e postura sob fadiga.',detail:'Contraia abdômen e glúteos. Mantenha cabeça, tronco e quadril alinhados.'},
      {name:'Prancha lateral direita',time:35,why:'Reforça controle lateral para carga unilateral e movimentos de tração.',detail:'Cotovelos sob o ombro, quadril elevado e corpo alinhado.'},
      {name:'Prancha lateral esquerda',time:35,why:'Reforça controle lateral para carga unilateral e movimentos de tração.',detail:'Cotovelos sob o ombro, quadril elevado e corpo alinhado.'},
      {name:'Ponte com marcha',time:45,why:'Integra glúteos e core para estabilizar a pelve ao caminhar com peso.',detail:'Eleve o quadril e alterne a retirada de um pé do chão sem deixar a pelve cair ou girar.'}
    ]
  },
  antiRotation:{
    title:'Anti-rotação & Mangueiras',
    icon:'↔️',
    subtitle:'Resistir à rotação durante tração e trabalho unilateral',
    duration:'7 min',
    mission:'Ajuda no controle do tronco ao manejar mangueiras, ferramentas e cargas que puxam o corpo para um lado.',
    steps:[
      {name:'Pallof press — direita',time:45,why:'Treina o tronco a resistir à rotação sob força lateral.',detail:'Com elástico ou cabo ao lado do corpo, empurre as mãos à frente sem deixar o tronco girar.'},
      {name:'Pallof press — esquerda',time:45,why:'Equilibra a capacidade anti-rotação nos dois lados.',detail:'Repita do lado oposto, mantendo quadris e ombros voltados para frente.'},
      {name:'Marcha unilateral — direita',time:50,why:'Simula caminhar com ferramenta ou equipamento pesado em um lado.',detail:'Segure uma carga ao lado direito e marche sem inclinar o tronco.'},
      {name:'Marcha unilateral — esquerda',time:50,why:'Reforça controle lateral do lado oposto.',detail:'Segure a carga ao lado esquerdo e mantenha o tronco vertical.'},
      {name:'Prancha com toque no ombro',time:45,why:'Treina estabilidade sem deixar o quadril rodar enquanto um apoio é retirado.',detail:'Em prancha alta, toque a mão no ombro oposto alternando os lados. Afaste mais os pés se necessário.'},
      {name:'Wood chop controlado — direita',time:45,why:'Integra quadril e tronco em movimentos diagonais usados em ferramentas e resgate.',detail:'Com elástico ou cabo, conduza o movimento em diagonal com abdômen firme e sem puxar apenas com os braços.'},
      {name:'Wood chop controlado — esquerda',time:45,why:'Treina a diagonal oposta.',detail:'Repita o padrão para o outro lado com a mesma postura.'}
    ]
  },
  carry:{
    title:'Carga & Transporte',
    icon:'🧰',
    subtitle:'Core firme para maca, ferramentas e equipamentos',
    duration:'7 min',
    mission:'Foca na habilidade de caminhar e transportar carga sem perder alinhamento do tronco.',
    steps:[
      {name:'Farmer carry',time:60,why:'Fortalece brace, pegada e postura durante transporte bilateral de carga.',detail:'Caminhe com uma carga em cada mão. Costelas alinhadas, abdômen firme e passos controlados.'},
      {name:'Suitcase carry — direita',time:50,why:'Simula transporte unilateral de ferramenta ou cilindro.',detail:'Segure uma carga apenas à direita e resista à inclinação lateral.'},
      {name:'Suitcase carry — esquerda',time:50,why:'Equilibra a resistência lateral.',detail:'Repita com a carga no lado esquerdo.'},
      {name:'Carga frontal abraçada',time:60,why:'Aproxima o padrão de carregar mangueira enrolada, bolsa ou material junto ao corpo.',detail:'Abrance uma carga junto ao tórax e caminhe mantendo o tronco alto e abdômen ativo.'},
      {name:'Marcha front rack',time:50,why:'Exige estabilidade do tronco com carga mais alta e anterior.',detail:'Segure a carga junto aos ombros e marche sem arquear a lombar.'},
      {name:'Arrasto de peso em prancha',time:45,why:'Une apoio, tração e resistência à rotação.',detail:'Em prancha alta, arraste uma carga leve de um lado para o outro sem girar excessivamente a pelve.'}
    ]
  },
  rescue:{
    title:'Resgate & Arrasto',
    icon:'🚒',
    subtitle:'Controle do tronco em solo, tração e deslocamento',
    duration:'7 min',
    mission:'Prepara padrões usados ao aproximar-se baixo, puxar, arrastar e estabilizar o corpo durante resgates.',
    steps:[
      {name:'Bear crawl controlado',time:45,why:'Integra ombros, quadris e core em deslocamento baixo.',detail:'Joelhos poucos centímetros do chão. Avance mão e pé opostos mantendo o tronco estável.'},
      {name:'Prancha com arrasto lateral',time:45,why:'Treina puxar carga sem perder o controle da pelve.',detail:'Arraste uma carga pequena por baixo do corpo alternando as mãos.'},
      {name:'Dead bug com puxada',time:45,why:'Combina tração de braços com estabilidade lombar.',detail:'Use elástico acima da cabeça e faça uma puxada leve enquanto mantém o dead bug controlado.'},
      {name:'Meio-ajoelhado com press',time:45,why:'Reforça estabilidade do tronco em base estreita e posições de trabalho ajoelhadas.',detail:'Em meio-ajoelhado, empurre elástico ou carga à frente sem arquear a lombar.'},
      {name:'Prancha lateral com alcance — direita',time:40,why:'Integra estabilidade lateral e alcance.',detail:'Na prancha lateral, alcance o braço livre à frente sem perder a linha do corpo.'},
      {name:'Prancha lateral com alcance — esquerda',time:40,why:'Treina o lado oposto.',detail:'Repita do outro lado com controle.'},
      {name:'Crawl reverso',time:45,why:'Exige coordenação e brace ao deslocar-se para trás em posição baixa.',detail:'Mantenha joelhos próximos do chão e recue lentamente sem balançar o quadril.'},
      {name:'Arrasto de sled',time:60,why:'Integra força de pernas, pegada e rigidez do tronco em um padrão diretamente transferível para arrasto de cargas.',detail:'Prenda as alças/arnês ao trenó, incline levemente o tronco e avance com passos curtos e firmes sem perder a postura.',load:'Carga desafiadora com passada contínua e técnica preservada.'}
    ]
  },
  complete:{
    title:'Circuito Operacional',
    icon:'🔥',
    subtitle:'Core completo para resistência sob fadiga',
    duration:'8 min',
    mission:'Combina estabilidade, anti-rotação, transporte e deslocamento em uma rotina única.',
    steps:[
      {name:'Respiração 360° + brace',time:35,why:'Prepara o tronco antes da carga.',detail:'Crie tensão abdominal sem prender a respiração.'},
      {name:'Dead bug',time:45,why:'Controle lombar com movimento dos membros.',detail:'Movimente braço e perna opostos mantendo a lombar estável.'},
      {name:'Prancha com toque no ombro',time:45,why:'Anti-rotação em apoio.',detail:'Alterne toques no ombro evitando girar o quadril.'},
      {name:'Farmer carry',time:60,why:'Resistência de tronco e postura com carga.',detail:'Caminhe com carga bilateral e abdômen ativo.'},
      {name:'Pallof press',time:50,why:'Resistência à rotação.',detail:'Faça metade do tempo com cada lado voltado para o ponto de ancoragem.'},
      {name:'Bear crawl controlado',time:45,why:'Deslocamento baixo com estabilidade global.',detail:'Avance devagar mantendo o quadril baixo e estável.'},
      {name:'Suitcase carry',time:60,why:'Controle lateral sob carga unilateral.',detail:'Troque o lado na metade do tempo.'},
      {name:'Prancha lateral alternada',time:50,why:'Resistência lateral do core.',detail:'Faça metade do tempo de cada lado.'},
      {name:'Ponte com marcha',time:45,why:'Estabilidade de pelve e extensão de quadril.',detail:'Mantenha o quadril alto enquanto alterna os pés.'}
    ]
  },
  strength:{
    title:'Força Bruta do Core',
    icon:'🏋️',
    subtitle:'Carga externa e tensão máxima com técnica',
    duration:'10 min',
    mission:'Desenvolve força do tronco para levantar, estabilizar e transferir cargas pesadas sem perder a posição.',
    level:'AVANÇADO',
    equipment:'Halteres • barra • anilha',
    steps:[
      {name:'Goblet squat com pausa',time:60,why:'Integra pernas e core para levantar cargas do solo com tronco firme.',detail:'Segure halter pesado junto ao peito. Desça controlado, pause 2 s no fundo e suba mantendo abdômen travado.',load:'Carga desafiadora, sem perder profundidade ou alinhamento.'},
      {name:'Front rack hold',time:45,why:'Exige brace intenso para sustentar carga anterior semelhante ao controle de equipamentos pesados.',detail:'Segure barra ou halteres na posição frontal e permaneça alto, sem hiperestender a lombar.',load:'Carga alta que permita postura perfeita por todo o intervalo.'},
      {name:'Suitcase deadlift — direita',time:50,why:'Treina levantamento assimétrico e resistência à inclinação.',detail:'Carga ao lado direito. Levante usando quadril e pernas sem inclinar ou girar o tronco.',load:'Moderada/alta, mantendo ombros nivelados.'},
      {name:'Suitcase deadlift — esquerda',time:50,why:'Fortalece o padrão assimétrico do lado oposto.',detail:'Repita com a carga à esquerda, mantendo coluna neutra.',load:'Moderada/alta, mesma técnica do lado direito.'},
      {name:'Overhead carry',time:50,why:'Exige estabilidade do core e cintura escapular com carga acima da cabeça.',detail:'Caminhe com um ou dois halteres acima da cabeça, costelas baixas e abdômen firme.',load:'Moderada; reduza se perder alinhamento dos ombros ou lombar.'},
      {name:'Plank drag com anilha',time:50,why:'Combina força de apoio, tração e anti-rotação.',detail:'Em prancha alta, arraste uma anilha ou halter por baixo do corpo alternando os lados.',load:'Carga que permita quadril praticamente imóvel.'}
    ]
  },
  hosePower:{
    title:'Potência de Mangueira',
    icon:'🚒',
    subtitle:'Tração, rotação controlada e base forte',
    duration:'10 min',
    mission:'Treina padrões de puxar, recolher, estabilizar e redirecionar forças semelhantes às impostas por mangueiras e ferramentas.',
    level:'INTENSO',
    equipment:'Cabo/elástico • corda • anilha',
    steps:[
      {name:'Remada unilateral em meio-ajoelhado — direita',time:50,why:'Une tração forte com estabilidade pélvica e anti-rotação.',detail:'Puxe cabo ou elástico com o braço direito sem rodar o tronco.',load:'Pesado, mas sem compensar com a lombar.'},
      {name:'Remada unilateral em meio-ajoelhado — esquerda',time:50,why:'Equilibra a capacidade de tração.',detail:'Repita do lado esquerdo com quadril e costelas alinhados.',load:'Mesmo esforço do lado oposto.'},
      {name:'Cable chop alto-baixo — direita',time:50,why:'Treina transferência diagonal de força entre tronco, quadril e braços.',detail:'Conduza o cabo em diagonal com rotação controlada do tronco e quadril.',load:'Moderada; velocidade firme sem perder controle.'},
      {name:'Cable chop alto-baixo — esquerda',time:50,why:'Treina a diagonal contrária.',detail:'Repita para o outro lado com o mesmo padrão.',load:'Moderada.'},
      {name:'Battle rope alternada',time:40,why:'Exige brace contínuo enquanto os braços produzem força repetida.',detail:'Base atlética, joelhos semiflexionados e ondas fortes sem balançar excessivamente o tronco.',load:'Máxima intensidade sustentável com técnica.'},
      {name:'Battle rope slam',time:35,why:'Integra quadril, tronco e membros superiores em produção rápida de força.',detail:'Eleve a corda e golpeie o chão usando o corpo inteiro, recuperando a posição a cada repetição.',load:'Explosivo; pare se a lombar assumir o movimento.'}
    ]
  },
  victimCarry:{
    title:'Transporte de Vítima',
    icon:'🧑‍🚒',
    subtitle:'Carga pesada, marcha e estabilidade total',
    duration:'10 min',
    mission:'Eleva a tolerância do tronco para transporte de cargas pesadas e assimétricas, mantendo postura durante deslocamento.',
    level:'AVANÇADO',
    equipment:'Halteres • kettlebell • sandbag',
    steps:[
      {name:'Farmer carry pesado',time:60,why:'Desenvolve resistência global para transportar carga bilateral.',detail:'Caminhe com cargas pesadas nas duas mãos, passos firmes e tronco alto.',load:'Pesado: termine o intervalo exigido, mas sem perder postura.'},
      {name:'Bear-hug carry com sandbag',time:60,why:'Aproxima o transporte de uma carga volumosa junto ao tronco.',detail:'Abrace sandbag ou carga segura contra o peito e caminhe sem arredondar a lombar.',load:'Moderada/alta.'},
      {name:'Front rack carry',time:55,why:'Aumenta demanda anterior sobre o core e respiração sob carga.',detail:'Caminhe com kettlebells/halteres junto aos ombros mantendo costelas alinhadas.',load:'Moderada/alta.'},
      {name:'Suitcase carry pesado — direita',time:50,why:'Resistência lateral intensa com carga unilateral.',detail:'Caminhe sem inclinar o tronco para compensar o peso.',load:'Pesado com controle.'},
      {name:'Suitcase carry pesado — esquerda',time:50,why:'Treina o lado oposto.',detail:'Repita mantendo a mesma postura e distância.',load:'Pesado com controle.'},
      {name:'Step-up com carga frontal',time:55,why:'Integra subida, carga e estabilidade do tronco.',detail:'Suba em caixa baixa/estável segurando carga junto ao peito. Alterne as pernas.',load:'Moderada; prioridade total à estabilidade do joelho e tronco.'}
    ]
  },
  stairSCBA:{
    title:'Escadas & EPI',
    icon:'🪜',
    subtitle:'Core sob fadiga, carga e deslocamento vertical',
    duration:'9 min',
    mission:'Prepara o tronco para manter controle durante subida, descida e deslocamento carregado, cenário comum com EPI e equipamentos.',
    level:'INTENSO',
    equipment:'Halteres • caixa/step • colete opcional',
    steps:[
      {name:'Step-up com farmer carry',time:60,why:'Combina subida e transporte bilateral.',detail:'Suba e desça de um step estável segurando halteres ao lado do corpo.',load:'Moderada/alta, cadência constante.'},
      {name:'Marcha front rack',time:55,why:'Eleva demanda respiratória e do core com carga anterior.',detail:'Marche elevando joelhos de forma controlada com cargas junto aos ombros.',load:'Moderada.'},
      {name:'Step-up unilateral — carga direita',time:50,why:'Cria desafio assimétrico durante subida.',detail:'Carga em uma mão, suba alternando as pernas sem inclinar o tronco.',load:'Moderada.'},
      {name:'Step-up unilateral — carga esquerda',time:50,why:'Equilibra o padrão assimétrico.',detail:'Repita com carga no lado oposto.',load:'Moderada.'},
      {name:'Prancha com puxada de halter',time:50,why:'Mantém o core ativo após fadiga de deslocamento.',detail:'Em prancha, faça remada ou arrasto alternado com carga leve/moderada sem girar o quadril.',load:'Carga controlável.'},
      {name:'Farmer hold pesado',time:45,why:'Finaliza exigindo brace e pegada sob fadiga acumulada.',detail:'Fique em pé segurando cargas pesadas, postura alta e respiração controlada.',load:'Pesado, sem perder alinhamento.'}
    ]
  },
  steelCore:{
    title:'Core de Aço',
    icon:'⚙️',
    subtitle:'Circuito avançado de academia',
    duration:'12 min',
    mission:'Sessão de alta exigência para militares já treinados, combinando carga, anti-rotação, transporte e resistência do tronco.',
    level:'MÁXIMO CONTROLADO',
    equipment:'Barra • halteres • cabo • anilha',
    steps:[
      {name:'Front squat',time:55,why:'Alta demanda de brace com transferência para levantar e sustentar cargas.',detail:'Barra na posição frontal, desça mantendo tronco firme e suba sem colapsar a postura.',load:'RPE 7–8/10; deixe 2–3 repetições em reserva.'},
      {name:'Pallof press pesado — direita',time:45,why:'Anti-rotação sob tensão elevada.',detail:'Pressione o cabo à frente sem permitir rotação.',load:'Pesado com controle.'},
      {name:'Pallof press pesado — esquerda',time:45,why:'Equilibra a resistência anti-rotação.',detail:'Repita para o outro lado.',load:'Pesado com controle.'},
      {name:'Farmer carry pesado',time:60,why:'Core, pegada e postura sob carga.',detail:'Caminhe com passos firmes e sem encurtar a postura.',load:'RPE 8/10, técnica preservada.'},
      {name:'Landmine press meio-ajoelhado — direita',time:50,why:'Integra empurrar, anti-extensão e estabilidade do quadril.',detail:'Pressione a barra em diagonal sem arquear a lombar.',load:'Moderada/alta.'},
      {name:'Landmine press meio-ajoelhado — esquerda',time:50,why:'Treina o lado oposto.',detail:'Repita mantendo pelve e costelas alinhadas.',load:'Moderada/alta.'},
      {name:'Plank drag pesado',time:50,why:'Anti-rotação dinâmica com carga.',detail:'Arraste halter/anilha alternando lados, mantendo quadril estável.',load:'Moderada.'},
      {name:'Suitcase carry pesado',time:60,why:'Resistência lateral máxima controlada.',detail:'Troque o lado aos 30 segundos sem inclinar o tronco.',load:'RPE 8/10.'},
      {name:'Dead bug com pulldown',time:50,why:'Finaliza reforçando controle lombar sob tração.',detail:'Faça pulldown com cabo/elástico enquanto alterna pernas sem perder a lombar neutra.',load:'Leve/moderada; execução perfeita.'},
      {name:'Desenvolvimento com halteres',time:55,why:'Exige estabilização do tronco ao produzir força acima da cabeça, útil em tarefas elevadas e manejo de equipamentos.',detail:'Sentado ou em pé, pressione os halteres acima da cabeça sem arquear a lombar. Mantenha costelas alinhadas e core firme.',load:'Moderada/alta; pare antes de perder o alinhamento lombar.'}
    ]
  }

};

let coreRoutineKey=null;
let coreStep=0;
let coreRemaining=0;
let coreTick=null;
let coreRunning=false;
let coreRoutineStartedAt=null;
let coreCompletionSaved=false;
let coreLastCompletionMessage='';
const CORE_SERVICE_KEY='t2_core_service_choice_v67_10';
let coreServiceDay=null;

function coreLocalDateKey(){
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function loadCoreServiceChoice(){
  coreServiceDay=null;
  try{
    const x=JSON.parse(localStorage.getItem(CORE_SERVICE_KEY)||'null');
    if(x&&x.date===coreLocalDateKey()&&(x.value===true||x.value===false)) coreServiceDay=x.value;
  }catch(e){}
  return coreServiceDay;
}
function setCoreServiceDay(value){
  coreServiceDay=!!value;
  localStorage.setItem(CORE_SERVICE_KEY,JSON.stringify({date:coreLocalDateKey(),value:coreServiceDay}));
  updateCoreServiceChoiceUI();
  saveNavigationState('coreOperational');
}
function updateCoreServiceChoiceUI(){
  const y=byId('coreServiceYes'),n=byId('coreServiceNo'),h=byId('coreServiceChoiceHint');
  if(y)y.classList.toggle('selected',coreServiceDay===true);
  if(n)n.classList.toggle('selected',coreServiceDay===false);
  if(h)h.textContent=coreServiceDay===null?'Selecione uma opção antes de iniciar uma rotina.':
    (coreServiceDay?'Presença validada pelo sistema. O Core será registrado como atividade complementar e não gera ponto no Ranking de Frequência.':'Core registrado sem validação de presença. A rotina será salva normalmente e não pontuará.');
}
function requireCoreServiceChoice(){
  if(coreServiceDay===null)loadCoreServiceChoice();
  if(coreServiceDay===null){
    alert('Escolha primeiro se deseja validar o treino de hoje.');
    return false;
  }
  return true;
}
function saveCompletedCoreRoutine(r){
  if(!r||coreCompletionSaved)return;
  coreCompletionSaved=true;
  const ended=new Date();
  const started=coreRoutineStartedAt?new Date(coreRoutineStartedAt):ended;
  const minutes=Math.max(1,Math.round((ended-started)/60000));
  const wh=workoutHistory();
  const record={
    atividadeId:v67383NewActivityId(),
    date:ended.toISOString(),
    startedAt:coreRoutineStartedAt||ended.toISOString(),
    plan:`Core Operacional — ${r.title}`,
    duration:minutes,
    exercisesPlanned:r.steps.length,
    exercisesDone:r.steps.length,
    sets:0,reps:0,volume:0,byExercise:[],
    schemaVersion:67383,
    workoutType:'core',
    coreComplete:true,
    coreRoutineKey:coreRoutineKey,
    coreStepsPlanned:r.steps.length,
    coreStepsCompleted:r.steps.length,
    ...v67670LocationFields(),
    serviceDay:coreServiceDay===true,
    excludedFromStats:false,
    // V67.37 — Core usa exatamente a mesma janela da validação operacional ativa.
    serviceValidatedAt:(coreServiceDay===true&&serviceValidationStatus?.validatedAt)||null,
    serviceExpiresAt:(coreServiceDay===true&&serviceValidationStatus?.expiresAt)||null,
    serviceWindowKey:coreServiceDay===true
      ? serviceOperationalWindowKey(ended)
      : null
  };
  wh.unshift(record);
  saveWorkoutHistory(wh);
  localStorage.setItem('t2_last',`${record.plan} • concluído`);
  v6738QueueFeedActivity(record);
  try{updateLast();}catch(e){console.warn('updateLast core:',e)}
  if(typeof cloudPushNow==='function'&&cloudSession?.token&&navigator.onLine)setTimeout(()=>cloudPushNow(),50);
  coreLastCompletionMessage=`✅ ${r.title} concluído e salvo. O Core é uma atividade complementar e não gera ponto no Ranking de Frequência.`;
}

function coreFmt(sec){
  const s=Math.max(0,Number(sec)||0);
  return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}
function coreStopTick(){
  if(coreTick){clearInterval(coreTick);coreTick=null}
  coreRunning=false;
}
function openCoreOperational(){
  v67670ResetActivityLocation();
  coreStopTick();
  coreRoutineKey=null;
  coreStep=0;
  coreRemaining=0;
  coreRoutineStartedAt=null;
  coreCompletionSaved=false;
  loadCoreServiceChoice();
  showView('coreOperational');
  renderCoreOperational();
}
function renderCoreOperational(){
  coreStopTick();
  coreRoutineKey=null;
  const box=byId('coreOperationalList');
  if(!box)return;
  box.innerHTML=`
    <div class="core-op-hero">
      <div class="eyebrow">CORE OPERACIONAL</div>
      <h3>Força que transfere para a ocorrência</h3>
      <p>Rotinas progressivas para estabilizar e fortalecer o tronco em transporte de carga, tração, arrasto, escadas, ferramentas e trabalho com EPI. Há opções com peso livre, cabo, corda, sandbag e equipamentos de academia.</p>
      <div class="core-op-principles">
        <span>🛡️ Estabilidade</span>
        <span>↔️ Anti-rotação</span>
        <span>🧰 Transporte</span>
        <span>🚒 Resgate</span>
      </div>
      <button type="button" class="core-atlas-btn" onclick="openCoreVisual('assets/core-operacional/core_operacional_final_100-guia.webp','Atlas visual completo — Core Operacional')">🗂️ VER ATLAS VISUAL DO CORE</button>
    </div>
    ${coreLastCompletionMessage?`<div class="card core-ranking-result"><b>${coreLastCompletionMessage}</b></div>`:''}
    <div id="coreServiceValidationCard" class="card service-validation-card pending">
      <span class="eyebrow">SITUAÇÃO DO CORE</span>
      <h3 id="coreServiceValidationTitle">Verificando validação…</h3>
      <p id="coreServiceValidationText">Valide sua presença na unidade ou continue sem validar. O Core continua sem pontuar.</p>
      <div class="service-mode-grid">
        <button id="coreServiceValidationOperational" class="service-mode-btn operational" type="button" onclick="chooseOperationalService()">📍 VALIDAR TREINO DE HOJE</button>
        <button id="coreServiceValidationOff" class="service-mode-btn off" type="button" onclick="chooseOffDutyTraining()">CONTINUAR SEM VALIDAR</button>
      </div>
      <small id="coreServiceValidationHint">Core continua no histórico e na evolução, com ou sem validação; não pontua.</small>
    </div>
    <div class="core-op-grid">
      ${Object.entries(CORE_OPERATIONAL_ROUTINES).map(([key,r])=>`
        <button class="core-op-card" onclick="openCoreRoutine('${key}')">
          <span class="core-op-icon">${r.icon}</span>
          <span class="core-op-copy">
            <b>${r.title}</b>
            <small>${r.subtitle}</small>
            <em>${r.mission}</em>
            ${r.equipment?`<i class="core-op-equipment">${r.equipment}</i>`:''}
          </span>
          <span class="core-op-time">${r.duration}${r.level?`<small>${r.level}</small>`:''}<small class="core-visual-count">${r.steps.filter(s=>coreVisualFor(s.name)).length}/${r.steps.length} HD</small></span>
        </button>`).join('')}
    </div>
    <div class="core-op-note"><b>Alta exigência, técnica primeiro.</b> Nas rotinas avançadas, trabalhe em torno de RPE 7–8/10: pesado e desafiador, mas sem chegar à falha técnica. Aumente a carga somente com tronco e pelve estáveis. Dor aguda, formigamento, tontura ou perda de controle são sinais para interromper.</div>`;
  updateCoreServiceChoiceUI();
  saveNavigationState('coreOperational');
}
function openCoreRoutine(key){
  const r=CORE_OPERATIONAL_ROUTINES[key];
  if(!r)return;
  if(!requireCoreServiceChoice())return;
  coreStopTick();
  coreRoutineKey=key;
  coreStep=0;
  coreRemaining=r.steps[0]?.time||0;
  coreRoutineStartedAt=new Date().toISOString();
  coreCompletionSaved=false;
  coreLastCompletionMessage='';
  showView('coreOperational');
  renderCoreRoutine();
  saveNavigationState('coreOperational');
}
function backToCoreHome(){
  coreStopTick();
  coreRoutineKey=null;
  coreStep=0;
  coreRemaining=0;
  coreRoutineStartedAt=null;
  coreCompletionSaved=false;
  renderCoreOperational();
  saveNavigationState('coreOperational');
}
function renderCoreRoutine(){
  const r=CORE_OPERATIONAL_ROUTINES[coreRoutineKey];
  const box=byId('coreOperationalList');
  if(!r||!box)return;
  const step=r.steps[coreStep];
  const pct=Math.round((coreStep/r.steps.length)*100);
  box.innerHTML=`
    <div class="core-op-routine-head">
      <button class="mobility-mini-back" onclick="backToCoreHome()">← Rotinas</button>
      <div class="eyebrow">CORE OPERACIONAL</div>
      <h3>${r.icon} ${r.title}</h3>
      <p>${r.mission}</p>
      ${r.equipment?`<div class="core-routine-meta"><span>🏋️ ${r.equipment}</span><span>${r.level||'GUIADO'}</span></div>`:''}
    </div>
    <div class="mobility-progress"><span style="width:${pct}%"></span></div>
    <div class="core-op-step-card">
      <div class="mobility-step-label">ETAPA ${coreStep+1} DE ${r.steps.length}</div>
      <h2>${step.name}</h2>
      ${(()=>{const v=coreVisualFor(step.name);return v?`
        <div class="core-step-visual">
          <img src="${v.demo}" alt="Posição inicial e final de ${step.name}" loading="lazy">
          <button type="button" onclick="openCoreVisual('${v.guide}','${step.name.replace(/'/g,"&#39;")}')">🔎 VER GUIA COMPLETO EM HD</button>
        </div>`:''})()}
      <div class="core-op-why"><b>Transferência para o serviço</b><span>${step.why}</span></div>
      <p>${step.detail}</p>
      ${step.load?`<div class="core-op-load"><b>CARGA / INTENSIDADE</b><span>${step.load}</span></div>`:''}
      <div class="core-op-cue">
        <b>COMANDO</b>
        <span>Costelas alinhadas • abdômen firme • respiração controlada • movimento sem compensar</span>
      </div>
      <div id="coreClock" class="mobility-clock">${coreFmt(coreRemaining)}</div>
      <div class="mobility-controls">
        <button class="ghost" onclick="corePrev()" ${coreStep===0?'disabled':''}>ANTERIOR</button>
        <button id="corePlayBtn" class="primary" onclick="coreToggle()">${coreRunning?'PAUSAR':'INICIAR'}</button>
        <button class="ghost" onclick="coreNext()">${coreStep===r.steps.length-1?'CONCLUIR':'PRÓXIMO'}</button>
      </div>
    </div>
    <div class="mobility-list">
      ${r.steps.map((s,i)=>`
        <div class="mobility-list-row ${i===coreStep?'active':''} ${i<coreStep?'done':''}">
          <span>${i<coreStep?'✓':i+1}</span>
          <div><b>${s.name}${coreVisualFor(s.name)?' <i class="core-hd-badge">HD</i>':''}</b><small>${coreFmt(s.time)}</small></div>
        </div>`).join('')}
    </div>`;
}
function coreToggle(){
  const r=CORE_OPERATIONAL_ROUTINES[coreRoutineKey];
  if(!r)return;
  if(coreRunning){
    coreStopTick();
    renderCoreRoutine();
    saveNavigationState('coreOperational');
    return;
  }
  if(coreRemaining<=0)coreRemaining=r.steps[coreStep].time;
  coreRunning=true;
  saveNavigationState('coreOperational');
  const btn=byId('corePlayBtn');
  if(btn)btn.textContent='PAUSAR';
  coreTick=setInterval(()=>{
    coreRemaining=Math.max(0,coreRemaining-1);
    const clock=byId('coreClock');
    if(clock)clock.textContent=coreFmt(coreRemaining);
    if(coreRemaining<=0){
      coreStopTick();
      if(coreStep<r.steps.length-1){
        coreStep++;
        coreRemaining=r.steps[coreStep].time;
        renderCoreRoutine();
      }else{
        renderCoreRoutine();
      }
      saveNavigationState('coreOperational');
    }
  },1000);
}
function corePrev(){
  const r=CORE_OPERATIONAL_ROUTINES[coreRoutineKey];
  if(!r)return;
  coreStopTick();
  coreStep=Math.max(0,coreStep-1);
  coreRemaining=r.steps[coreStep].time;
  renderCoreRoutine();
  saveNavigationState('coreOperational');
}
function coreNext(){
  const r=CORE_OPERATIONAL_ROUTINES[coreRoutineKey];
  if(!r)return;
  coreStopTick();
  if(coreStep>=r.steps.length-1){
    saveCompletedCoreRoutine(r);
    coreRoutineKey=null;
    coreStep=0;
    coreRemaining=0;
    coreRoutineStartedAt=null;
    renderCoreOperational();
    return;
  }
  coreStep++;
  coreRemaining=r.steps[coreStep].time;
  renderCoreRoutine();
  saveNavigationState('coreOperational');
}

const MOBILITY_ROUTINES={
  shoulders:{
    title:'Ombros',
    icon:'◒',
    subtitle:'Mobilidade, estabilidade e saúde articular dos ombros',
    duration:'8 min',
    steps:[
      {name:'Rotação externa com elástico',time:45,detail:'Mantenha o cotovelo junto ao corpo e gire o antebraço para fora sem rodar o tronco.'},
      {name:'Rotação interna com elástico',time:45,detail:'Mantenha o cotovelo junto ao corpo e puxe o antebraço para dentro de forma lenta e controlada.'},
      {name:'Elevação frontal',time:40,detail:'Eleve os braços à frente até a altura dos ombros, sem arquear a lombar ou encolher os ombros.'},
      {name:'Elevação lateral',time:40,detail:'Eleve os braços lateralmente até a linha dos ombros, mantendo os cotovelos levemente flexionados.'},
      {name:'Desenvolvimento de ombros',time:45,detail:'Partindo dos cotovelos flexionados, eleve os braços acima da cabeça sem compensar com a lombar.'},
      {name:'Mobilidade com bastão',time:50,detail:'Segure o bastão com pegada confortável e conduza-o acima da cabeça dentro de uma amplitude sem dor.'},
      {name:'Alongamento de ombro atrás do corpo',time:40,detail:'Cruze um braço à frente do peito e use o outro para aproximá-lo suavemente do corpo.'},
      {name:'Mobilidade torácica em quadrupedia',time:50,detail:'Em quatro apoios, gire o tronco e leve um braço para cima, mantendo os quadris estáveis.'},
      {name:'Círculos de ombro',time:40,detail:'Faça círculos amplos e lentos com os ombros, mantendo o tronco estável e o movimento confortável.'}
    ]
  },
  spine:{
    title:'Coluna & Lombar',
    icon:'↕',
    subtitle:'Mobilidade de coluna e relaxamento do tronco',
    duration:'6 min',
    steps:[
      {name:'Gato-vaca',time:50,detail:'Alterne extensão e flexão da coluna de forma lenta, coordenando o movimento com a respiração.'},
      {name:'Rotação torácica',time:50,detail:'Em quatro apoios, gire o tórax mantendo o quadril estável e sem forçar a amplitude.'},
      {name:'Postura da criança com alcance lateral',time:50,detail:'Leve o quadril em direção aos calcanhares e alcance os braços à frente e levemente para cada lado.'},
      {name:'Rotação lombar deitado',time:50,detail:'Deitado com os joelhos flexionados, mova-os suavemente de um lado ao outro.'},
      {name:'Extensão de tronco',time:50,detail:'Eleve o peito gradualmente, mantendo o movimento confortável e sem comprimir a lombar.'},
      {name:'Alongamento lateral do tronco',time:50,detail:'Incline o tronco para o lado com controle, mantendo os quadris estáveis e sem girar o corpo.'}
    ]
  },
  hips:{
    title:'Quadril',
    icon:'◇',
    subtitle:'Amplitude do quadril e preparação para membros inferiores',
    duration:'7 min',
    steps:[
      {name:'90/90 de quadril',time:60,detail:'Alterne os joelhos de um lado para o outro mantendo controle.'},
      {name:'Afundo com mobilidade',time:50,detail:'Leve o quadril suavemente à frente mantendo o tronco ereto.'},
      {name:'Agachamento profundo assistido',time:50,detail:'Segure em um apoio e permaneça em posição confortável.'},
      {name:'Rotação interna do quadril',time:50,detail:'Movimento lento, sem tirar o pé do chão de forma brusca.'},
      {name:'Ponte de glúteos',time:50,detail:'Eleve o quadril contraindo glúteos sem hiperestender a lombar.'},
      {name:'Alongamento de glúteo',time:45,detail:'Cruze uma perna sobre a outra e aproxime suavemente.'}
    ]
  },
  knees:{
    title:'Joelhos',
    icon:'⌁',
    subtitle:'Mobilidade, estabilidade e preparação dos joelhos',
    duration:'5 min',
    steps:[
      {name:'Flexão e extensão de joelho',time:40,detail:'Com apoio, flexione o joelho levando o calcanhar em direção ao glúteo e retorne lentamente.'},
      {name:'Agachamento parcial controlado',time:50,detail:'Desça apenas até uma amplitude confortável, mantendo joelhos alinhados com os pés.'},
      {name:'Passada reversa curta',time:50,detail:'Dê um passo para trás, flexione os joelhos com controle e retorne à posição inicial.'},
      {name:'Elevação de panturrilha',time:50,detail:'Eleve os calcanhares, sustente brevemente no alto e desça de forma controlada.'},
      {name:'Isometria de parede leve',time:35,detail:'Apoie as costas na parede e mantenha uma flexão confortável dos joelhos, sem buscar fadiga máxima.'}
    ]
  },
  ankles:{
    title:'Tornozelos',
    icon:'◜',
    subtitle:'Mobilidade, estabilidade e amplitude dos tornozelos',
    duration:'5 min',
    steps:[
      {name:'Círculos de tornozelo',time:40,detail:'Sentado, eleve o pé e faça círculos lentos e completos nas duas direções, sem movimentar o joelho.'},
      {name:'Joelho à parede',time:50,detail:'Leve o joelho à frente em direção à parede mantendo o calcanhar totalmente apoiado no chão.'},
      {name:'Elevação de panturrilha',time:50,detail:'Eleve os calcanhares até ficar apoiado nas pontas dos pés, sustente brevemente e desça com controle.'},
      {name:'Inversão e eversão do tornozelo',time:45,detail:'Sentado, mova o pé lentamente para dentro e para fora, controlando a amplitude sem girar o joelho.'},
      {name:'Alongamento de panturrilha na parede',time:50,detail:'Com as mãos na parede, mantenha o calcanhar de trás no chão e avance o corpo até sentir alongamento confortável.'}
    ]
  },
  full:{
    title:'Corpo Inteiro',
    icon:'✦',
    subtitle:'Mobilidade global, estabilidade e recuperação',
    duration:'9 min',
    steps:[
      {name:'Agachamento profundo com alcance',time:50,detail:'Desça em agachamento profundo dentro da amplitude confortável e alcance um braço para cima, mantendo o peito aberto.'},
      {name:'Avanço com rotação de tronco',time:50,detail:'Entre em posição de avanço e gire o tronco para o lado da perna da frente, mantendo o quadril estável.'},
      {name:'Toque de pé com joelhos estendidos',time:45,detail:'Com os joelhos estendidos sem travar, incline o tronco à frente e alcance em direção aos pés sem forçar.'},
      {name:'Prancha com alcance alternado',time:45,detail:'Em prancha alta, eleve um braço à frente por vez sem deixar o quadril girar excessivamente.'},
      {name:'Mobilidade de quadril em pé',time:45,detail:'Eleve um joelho à frente e movimente o quadril de forma controlada, mantendo equilíbrio e tronco ereto.'},
      {name:'Rotação de coluna em quadrupedia',time:50,detail:'Em quatro apoios, gire o tronco levando um braço para cima, mantendo os quadris estáveis.'},
      {name:'Alongamento global em Y',time:40,detail:'Em pé, eleve os braços formando um Y e alongue o corpo para cima, respirando de forma lenta.'},
      {name:'Passada lateral com alcance',time:50,detail:'Desloque o peso para um lado, flexione o joelho e alcance em direção ao chão sem perder o alinhamento.'},
      {name:'Respiração e mobilidade global',time:45,detail:'Inspire abrindo os braços e o peito; expire retornando com controle e relaxando ombros e tronco.'}
    ]
  }
};
let mobilityRoutineKey=null;
let mobilityStep=0;
let mobilityRemaining=0;
let mobilityTick=null;
let mobilityRunning=false;

function mobilityFmt(sec){
  const s=Math.max(0,Number(sec)||0);
  return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
}
function mobilityStopTick(){
  if(mobilityTick){clearInterval(mobilityTick);mobilityTick=null}
  mobilityRunning=false;
}
function backToMobilityHome(){
  mobilityStopTick();
  mobilityRoutineKey=null;
  mobilityStep=0;
  mobilityRemaining=0;
  renderStretch();
  saveNavigationState('stretch');
}
function renderStretch(){
  mobilityStopTick();
  mobilityRoutineKey=null;
  const box=byId('stretchList');
  if(!box)return;
  box.innerHTML=`
    <div class="mobility-hero">
      <div class="eyebrow">MOBILIDADE & RECUPERAÇÃO</div>
      <h3>Escolha a região</h3>
      <p>Rotinas curtas para preparar o movimento, reduzir rigidez e recuperar a amplitude com controle.</p>
    </div>
    <div class="mobility-grid">
      ${Object.entries(MOBILITY_ROUTINES).map(([key,r])=>`
        <button class="mobility-card" onclick="openMobilityRoutine('${key}')">
          <span class="mobility-icon">${r.icon}</span>
          <span class="mobility-copy"><b>${r.title}</b><small>${r.subtitle}</small></span>
          <span class="mobility-time">${r.duration}</span>
        </button>`).join('')}
    </div>
    <div class="mobility-note"><b>Movimento sem dor.</b> Use amplitude confortável e interrompa se surgir dor aguda, tontura ou mal-estar.</div>`;
}
function openMobilityRoutine(key){
  const r=MOBILITY_ROUTINES[key];
  if(!r)return;
  mobilityStopTick();
  mobilityRoutineKey=key;
  mobilityStep=0;
  mobilityRemaining=r.steps[0]?.time||0;
  renderMobilityRoutine();
  saveNavigationState('stretch');
}

function mobilityVisualType(name=''){
  const n=normText(name);
  if(/circulos de ombro/.test(n)) return 'shoulder';
  if(/deslizamento na parede|passagem de bracos/.test(n)) return 'arms';
  if(/rotacao toracica|rotacao lombar/.test(n)) return 'twist';
  if(/peitoral/.test(n)) return 'pec';
  if(/respiracao|cervical|soltura escapular/.test(n)) return 'breath';
  if(/gato-vaca/.test(n)) return 'catcow';
  if(/postura da crianca/.test(n)) return 'child';
  if(/joelhos ao peito/.test(n)) return 'knees';
  if(/bird-dog/.test(n)) return 'birddog';
  if(/90\/90/.test(n)) return 'hip90';
  if(/afundo|passada reversa/.test(n)) return 'lunge';
  if(/agachamento/.test(n)) return 'squat';
  if(/rotacao interna do quadril/.test(n)) return 'hiprot';
  if(/ponte de gluteos/.test(n)) return 'bridge';
  if(/alongamento de gluteo/.test(n)) return 'glute';
  if(/flexao e extensao de joelho/.test(n)) return 'kneeflex';
  if(/panturrilha/.test(n)) return 'calf';
  if(/isometria de parede/.test(n)) return 'wallsit';
  if(/circulos de tornozelo/.test(n)) return 'ankle';
  if(/joelho a parede/.test(n)) return 'kneewall';
  if(/ponta do pe/.test(n)) return 'toe';
  if(/transferencia de peso/.test(n)) return 'shift';
  return 'general';
}


const MOBILITY_HD={
  'Rotação externa com elástico':['assets/mobility/ombros/rotacao-externa-a.webp','assets/mobility/ombros/rotacao-externa-b.webp'],
  'Rotação interna com elástico':['assets/mobility/ombros/rotacao-interna-a.webp','assets/mobility/ombros/rotacao-interna-b.webp'],
  'Elevação frontal':['assets/mobility/ombros/elevacao-frontal-a.webp','assets/mobility/ombros/elevacao-frontal-b.webp'],
  'Elevação lateral':['assets/mobility/ombros/elevacao-lateral-a.webp','assets/mobility/ombros/elevacao-lateral-b.webp'],
  'Desenvolvimento de ombros':['assets/mobility/ombros/desenvolvimento-a.webp','assets/mobility/ombros/desenvolvimento-b.webp'],
  'Mobilidade com bastão':['assets/mobility/ombros/bastao-a.webp','assets/mobility/ombros/bastao-b.webp'],
  'Alongamento de ombro atrás do corpo':['assets/mobility/ombros/alongamento-ombro-a.webp','assets/mobility/ombros/alongamento-ombro-b.webp'],
  'Mobilidade torácica em quadrupedia':['assets/mobility/ombros/toracica-quadrupedia-a.webp','assets/mobility/ombros/toracica-quadrupedia-b.webp'],
  'Círculos de ombro':['assets/mobility/ombros/circulos-a.webp','assets/mobility/ombros/circulos-b.webp'],
  'Agachamento profundo com alcance':['assets/mobility/corpo-inteiro/agachamento-alcance-a.webp','assets/mobility/corpo-inteiro/agachamento-alcance-b.webp'],
  'Avanço com rotação de tronco':['assets/mobility/corpo-inteiro/avanco-rotacao-a.webp','assets/mobility/corpo-inteiro/avanco-rotacao-b.webp'],
  'Toque de pé com joelhos estendidos':['assets/mobility/corpo-inteiro/toque-pe-a.webp','assets/mobility/corpo-inteiro/toque-pe-b.webp'],
  'Prancha com alcance alternado':['assets/mobility/corpo-inteiro/prancha-alcance-a.webp','assets/mobility/corpo-inteiro/prancha-alcance-b.webp'],
  'Mobilidade de quadril em pé':['assets/mobility/corpo-inteiro/quadril-em-pe-a.webp','assets/mobility/corpo-inteiro/quadril-em-pe-b.webp'],
  'Rotação de coluna em quadrupedia':['assets/mobility/corpo-inteiro/rotacao-coluna-a.webp','assets/mobility/corpo-inteiro/rotacao-coluna-b.webp'],
  'Alongamento global em Y':['assets/mobility/corpo-inteiro/alongamento-y-a.webp','assets/mobility/corpo-inteiro/alongamento-y-b.webp'],
  'Passada lateral com alcance':['assets/mobility/corpo-inteiro/passada-lateral-a.webp','assets/mobility/corpo-inteiro/passada-lateral-b.webp'],
  'Respiração e mobilidade global':['assets/mobility/corpo-inteiro/respiracao-global-a.webp','assets/mobility/corpo-inteiro/respiracao-global-b.webp'],
  'Círculos de tornozelo':['assets/mobility/tornozelos/circulos-a.webp','assets/mobility/tornozelos/circulos-b.webp'],
  'Joelho à parede':['assets/mobility/tornozelos/joelho-parede-a.webp','assets/mobility/tornozelos/joelho-parede-b.webp'],
  'Elevação de panturrilha':['assets/mobility/tornozelos/panturrilha-a.webp','assets/mobility/tornozelos/panturrilha-b.webp'],
  'Inversão e eversão do tornozelo':['assets/mobility/tornozelos/inversao-eversao-a.webp','assets/mobility/tornozelos/inversao-eversao-b.webp'],
  'Alongamento de panturrilha na parede':['assets/mobility/tornozelos/alongamento-panturrilha-a.webp','assets/mobility/tornozelos/alongamento-panturrilha-b.webp'],  'Flexão e extensão de joelho':['assets/mobility/joelhos/flexao-extensao-a.webp','assets/mobility/joelhos/flexao-extensao-b.webp'],
  'Agachamento parcial controlado':['assets/mobility/joelhos/agachamento-parcial-a.webp','assets/mobility/joelhos/agachamento-parcial-b.webp'],
  'Passada reversa curta':['assets/mobility/joelhos/passada-reversa-a.webp','assets/mobility/joelhos/passada-reversa-b.webp'],
  'Elevação de panturrilha':['assets/mobility/joelhos/panturrilha-a.webp','assets/mobility/joelhos/panturrilha-b.webp'],
  'Isometria de parede leve':['assets/mobility/joelhos/isometria-parede-a.webp','assets/mobility/joelhos/isometria-parede-b.webp'],
  'Gato-vaca':['assets/mobility/coluna-lombar/gato-vaca-a.webp','assets/mobility/coluna-lombar/gato-vaca-b.webp'],
  'Rotação torácica':['assets/mobility/coluna-lombar/rotacao-toracica-a.webp','assets/mobility/coluna-lombar/rotacao-toracica-b.webp'],
  'Postura da criança com alcance lateral':['assets/mobility/coluna-lombar/crianca-a.webp','assets/mobility/coluna-lombar/crianca-b.webp'],
  'Rotação lombar deitado':['assets/mobility/coluna-lombar/rotacao-lombar-a.webp','assets/mobility/coluna-lombar/rotacao-lombar-b.webp'],
  'Extensão de tronco':['assets/mobility/coluna-lombar/extensao-tronco-a.webp','assets/mobility/coluna-lombar/extensao-tronco-b.webp'],
  'Alongamento lateral do tronco':['assets/mobility/coluna-lombar/alongamento-lateral-a.webp','assets/mobility/coluna-lombar/alongamento-lateral-b.webp'],  '90/90 de quadril':['assets/mobility/quadril/90-90-a.webp','assets/mobility/quadril/90-90-b.webp'],
  'Afundo com mobilidade':['assets/mobility/quadril/afundo-a.webp','assets/mobility/quadril/afundo-b.webp'],
  'Agachamento profundo assistido':['assets/mobility/quadril/agachamento-a.webp','assets/mobility/quadril/agachamento-b.webp'],
  'Ponte de glúteos':['assets/mobility/quadril/ponte-a.webp','assets/mobility/quadril/ponte-b.webp'],
  'Rotação interna do quadril':['assets/mobility/quadril/rotacao-quadril-a.webp','assets/mobility/quadril/rotacao-quadril-b.webp'],
  'Alongamento de glúteo':['assets/mobility/quadril/gluteo-a.webp','assets/mobility/quadril/gluteo-b.webp']
};
function mobilityHdVisual(name=''){
  const pair=MOBILITY_HD[name];
  if(!pair)return '';
  return `
    <div class="mobility-hd-stage" aria-label="Demonstração visual de ${name}">
      <div class="mobility-hd-badge">MOVIMENTO REALISTA</div>
      <div class="mobility-hd-frame-wrap">
        <img class="mobility-hd-frame mobility-hd-a" src="${pair[0]}" alt="Posição inicial de ${name}">
        <img class="mobility-hd-frame mobility-hd-b" src="${pair[1]}" alt="Posição final de ${name}">
        <div class="mobility-hd-label mobility-hd-label-a">INÍCIO</div>
        <div class="mobility-hd-label mobility-hd-label-b">MOVIMENTO</div>
      </div>
      <div class="mobility-hd-caption">A imagem alterna entre as duas posições para facilitar a assimilação do movimento.</div>
    </div>`;
}

function mobilityAnimationSvg(name=''){
  const type=mobilityVisualType(name);

  const anim={
    shoulder:{
      left:`<animateTransform attributeName="transform" type="rotate" values="0 160 78;-70 160 78;0 160 78" dur="2.4s" repeatCount="indefinite"/>`,
      right:`<animateTransform attributeName="transform" type="rotate" values="0 160 78;70 160 78;0 160 78" dur="2.4s" repeatCount="indefinite"/>`
    },
    arms:{
      left:`<animateTransform attributeName="transform" type="rotate" values="0 160 78;-85 160 78;0 160 78" dur="2.2s" repeatCount="indefinite"/>`,
      right:`<animateTransform attributeName="transform" type="rotate" values="0 160 78;85 160 78;0 160 78" dur="2.2s" repeatCount="indefinite"/>`
    },
    twist:{
      torso:`<animateTransform attributeName="transform" type="rotate" values="-12 160 110;12 160 110;-12 160 110" dur="2.4s" repeatCount="indefinite"/>`
    },
    lunge:{
      body:`<animateTransform attributeName="transform" type="translate" values="0 0;0 24;0 0" dur="2s" repeatCount="indefinite"/>`,
      left:`<animateTransform attributeName="transform" type="rotate" values="0 160 126;24 160 126;0 160 126" dur="2s" repeatCount="indefinite"/>`,
      right:`<animateTransform attributeName="transform" type="rotate" values="0 160 126;-28 160 126;0 160 126" dur="2s" repeatCount="indefinite"/>`
    },
    squat:{
      body:`<animateTransform attributeName="transform" type="translate" values="0 0;0 34;0 0" dur="1.8s" repeatCount="indefinite"/>`,
      left:`<animateTransform attributeName="transform" type="rotate" values="0 160 126;26 160 126;0 160 126" dur="1.8s" repeatCount="indefinite"/>`,
      right:`<animateTransform attributeName="transform" type="rotate" values="0 160 126;-26 160 126;0 160 126" dur="1.8s" repeatCount="indefinite"/>`
    },
    ankle:{
      right:`<animateTransform attributeName="transform" type="rotate" from="0 188 184" to="360 188 184" dur="1.8s" repeatCount="indefinite"/>`
    },
    kneewall:{
      body:`<animateTransform attributeName="transform" type="translate" values="0 0;18 0;0 0" dur="2s" repeatCount="indefinite"/>`
    },
    calf:{
      body:`<animateTransform attributeName="transform" type="translate" values="0 0;0 -15;0 0" dur="1.6s" repeatCount="indefinite"/>`
    },
    bridge:{
      torso:`<animateTransform attributeName="transform" type="translate" values="0 0;0 -25;0 0" dur="1.9s" repeatCount="indefinite"/>`
    },
    birddog:{
      right:`<animateTransform attributeName="transform" type="rotate" values="0 160 78;-55 160 78;0 160 78" dur="2s" repeatCount="indefinite"/>`,
      leftleg:`<animateTransform attributeName="transform" type="rotate" values="0 160 126;52 160 126;0 160 126" dur="2s" repeatCount="indefinite"/>`
    },
    hip90:{
      leftleg:`<animateTransform attributeName="transform" type="rotate" values="-30 160 126;35 160 126;-30 160 126" dur="2.2s" repeatCount="indefinite"/>`,
      rightleg:`<animateTransform attributeName="transform" type="rotate" values="30 160 126;-35 160 126;30 160 126" dur="2.2s" repeatCount="indefinite"/>`
    },
    hiprot:{
      leftleg:`<animateTransform attributeName="transform" type="rotate" values="-22 160 126;24 160 126;-22 160 126" dur="2.2s" repeatCount="indefinite"/>`,
      rightleg:`<animateTransform attributeName="transform" type="rotate" values="22 160 126;-24 160 126;22 160 126" dur="2.2s" repeatCount="indefinite"/>`
    },
    kneeflex:{
      rightleg:`<animateTransform attributeName="transform" type="rotate" values="0 160 126;-58 160 126;0 160 126" dur="1.8s" repeatCount="indefinite"/>`
    },
    toe:{
      body:`<animateTransform attributeName="transform" type="translate" values="0 0;0 -10;0 0" dur="1.5s" repeatCount="indefinite"/>`
    },
    shift:{
      body:`<animateTransform attributeName="transform" type="translate" values="-16 0;16 0;-16 0" dur="2.2s" repeatCount="indefinite"/>`
    },
    breath:{
      focus:`<animate attributeName="r" values="25;42;25" dur="3s" repeatCount="indefinite"/><animate attributeName="opacity" values=".2;.65;.2" dur="3s" repeatCount="indefinite"/>`
    },
    general:{focus:`<animate attributeName="opacity" values=".15;.65;.15" dur="2s" repeatCount="indefinite"/>`}
  }[type]||{};

  const torsoAnim=anim.torso||anim.body||'';
  const headAnim=anim.body||'';
  const armLAnim=anim.left||anim.body||'';
  const armRAnim=anim.right||anim.body||'';
  const legLAnim=anim.leftleg||anim.left||anim.body||'';
  const legRAnim=anim.rightleg||anim.right||anim.body||'';
  const focusAnim=anim.focus||'';

  return `
    <svg viewBox="0 0 320 220" role="img" aria-label="Animação auxiliar de ${name}"
         style="display:block;width:100%;max-height:220px;margin:0 auto;overflow:visible">
      <defs>
        <filter id="mobGlow"><feGaussianBlur stdDeviation="2.2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <marker id="mobArrowHead" markerWidth="8" markerHeight="8" refX="6" refY="3.5" orient="auto"><polygon points="0 0,7 3.5,0 7" fill="#e1262f"/></marker>
      </defs>

      <circle cx="160" cy="81" r="34" fill="none" stroke="#e1262f" stroke-width="3" opacity=".28">${focusAnim}</circle>

      <g>
        ${headAnim}
        <circle cx="160" cy="45" r="18" fill="#171717" stroke="#f4f4f4" stroke-width="5"/>
        <line x1="160" y1="63" x2="160" y2="126" stroke="#f4f4f4" stroke-width="9" stroke-linecap="round">${torsoAnim}</line>

        <line x1="160" y1="78" x2="115" y2="104" stroke="#f4f4f4" stroke-width="9" stroke-linecap="round">${armLAnim}</line>
        <line x1="160" y1="78" x2="205" y2="104" stroke="#f4f4f4" stroke-width="9" stroke-linecap="round">${armRAnim}</line>

        <line x1="160" y1="126" x2="132" y2="184" stroke="#f4f4f4" stroke-width="9" stroke-linecap="round">${legLAnim}</line>
        <line x1="160" y1="126" x2="188" y2="184" stroke="#f4f4f4" stroke-width="9" stroke-linecap="round">${legRAnim}</line>
      </g>

      <path d="M76 100 Q52 56 96 30" fill="none" stroke="#e1262f" stroke-width="6" stroke-linecap="round" marker-end="url(#mobArrowHead)" filter="url(#mobGlow)"/>
      <path d="M244 100 Q268 56 224 30" fill="none" stroke="#e1262f" stroke-width="6" stroke-linecap="round" marker-end="url(#mobArrowHead)" filter="url(#mobGlow)"/>

      <text x="160" y="210" text-anchor="middle" fill="#b7b7b7" font-size="12" font-weight="700">${name}</text>
    </svg>`;
}

function renderMobilityRoutine(){
  const r=MOBILITY_ROUTINES[mobilityRoutineKey];
  const box=byId('stretchList');
  if(!r||!box){renderStretch();return}
  const step=r.steps[mobilityStep];
  const pct=Math.round(((mobilityStep)/r.steps.length)*100);
  box.innerHTML=`
    <div class="mobility-routine-head">
      <button class="mobility-mini-back" onclick="backToMobilityHome()">← Rotinas</button>
      <div class="eyebrow">${r.title.toUpperCase()}</div>
      <h3>${r.title}</h3>
      <p>${r.subtitle}</p>
    </div>
    <div class="mobility-progress"><span style="width:${pct}%"></span></div>
    <div class="mobility-step-card">
      <div class="mobility-step-label">ETAPA ${mobilityStep+1} DE ${r.steps.length}</div>
      <h2>${step.name}</h2>
      <p>${step.detail}</p>
      <div class="mobility-animation-card">
        <div class="mobility-animation-label">ANIMAÇÃO GUIADA</div>
        ${mobilityHdVisual(step.name) || mobilityAnimationSvg(step.name)}
        <div class="mobility-animation-hint">Observe a mudança de posição e execute de forma lenta e controlada.</div>
      </div>
      <div id="mobilityClock" class="mobility-clock">${mobilityFmt(mobilityRemaining)}</div>
      <div class="mobility-controls">
        <button class="ghost" onclick="mobilityPrev()" ${mobilityStep===0?'disabled':''}>ANTERIOR</button>
        <button id="mobilityPlayBtn" class="primary" onclick="mobilityToggle()">${mobilityRunning?'PAUSAR':'INICIAR'}</button>
        <button class="ghost" onclick="mobilityNext()">${mobilityStep===r.steps.length-1?'CONCLUIR':'PRÓXIMO'}</button>
      </div>
    </div>
    <div class="mobility-list">
      ${r.steps.map((s,i)=>`
        <div class="mobility-list-row ${i===mobilityStep?'active':''} ${i<mobilityStep?'done':''}">
          <span>${i<mobilityStep?'✓':i+1}</span>
          <div><b>${s.name}</b><small>${mobilityFmt(s.time)}</small></div>
        </div>`).join('')}
    </div>`;
}
function mobilityToggle(){
  const r=MOBILITY_ROUTINES[mobilityRoutineKey];
  if(!r)return;
  if(mobilityRunning){mobilityStopTick();renderMobilityRoutine();saveNavigationState('stretch');return}
  if(mobilityRemaining<=0)mobilityRemaining=r.steps[mobilityStep].time;
  mobilityRunning=true;
  saveNavigationState('stretch');
  const btn=byId('mobilityPlayBtn'); if(btn)btn.textContent='PAUSAR';
  mobilityTick=setInterval(()=>{
    mobilityRemaining=Math.max(0,mobilityRemaining-1);
    const clock=byId('mobilityClock'); if(clock)clock.textContent=mobilityFmt(mobilityRemaining);
    if(mobilityRemaining<=0){
      mobilityStopTick();
      try{navigator.vibrate?.([120,80,120])}catch(e){}
      if(mobilityStep<r.steps.length-1){
        mobilityStep++;
        mobilityRemaining=r.steps[mobilityStep].time;
        renderMobilityRoutine();
        saveNavigationState('stretch');
      }else{
        renderMobilityComplete();
      }
    }
  },1000);
}
function mobilityPrev(){
  const r=MOBILITY_ROUTINES[mobilityRoutineKey]; if(!r)return;
  mobilityStopTick();
  mobilityStep=Math.max(0,mobilityStep-1);
  mobilityRemaining=r.steps[mobilityStep].time;
  renderMobilityRoutine();
  saveNavigationState('stretch');
}
function mobilityNext(){
  const r=MOBILITY_ROUTINES[mobilityRoutineKey]; if(!r)return;
  mobilityStopTick();
  if(mobilityStep>=r.steps.length-1){renderMobilityComplete();saveNavigationState('stretch');return}
  mobilityStep++;
  mobilityRemaining=r.steps[mobilityStep].time;
  renderMobilityRoutine();
  saveNavigationState('stretch');
}
function renderMobilityComplete(){
  mobilityStopTick();
  const r=MOBILITY_ROUTINES[mobilityRoutineKey];
  const box=byId('stretchList'); if(!box||!r)return;
  box.innerHTML=`
    <div class="mobility-complete">
      <div class="mobility-complete-icon">✓</div>
      <div class="eyebrow">ROTINA CONCLUÍDA</div>
      <h2>${r.title}</h2>
      <p>${r.steps.length} etapas finalizadas • ${r.duration}</p>
      <button class="primary" onclick="backToMobilityHome()">VOLTAR ÀS ROTINAS</button>
    </div>`;
}

function exportHistory(){
  const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),version:'v37',history:history(),workouts:migrateWorkoutQuality()},null,2)],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='treino-2cia-backup.json';a.click();URL.revokeObjectURL(a.href);
}
function importHistory(ev){
  const f=ev.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const o=JSON.parse(r.result);if(!Array.isArray(o.history))throw 0;saveHistory(o.history);if(Array.isArray(o.workouts))saveWorkoutHistory(o.workouts);alert('Backup importado com sucesso.');renderHistory()}catch(e){alert('Arquivo de backup inválido.')}};r.readAsText(f)
}
async function clearData(){if(confirm('Apagar todo o histórico deste celular? As publicações correspondentes deste militar também serão removidas do Feed Esportivo.')){localStorage.removeItem('t2_history');localStorage.removeItem('t2_workouts');localStorage.removeItem('t2_active_plan');localStorage.removeItem('t2_last');v6738PendingWrite([]);await v67382DeleteAllMyFeed();updateLast();if(document.querySelector('.view.active')?.id==='home')await v67382RefreshFeed();alert('Histórico apagado e Feed atualizado.')}}
function copyCurrentBase(){navigator.clipboard?.writeText(location.origin+location.pathname).then(()=>alert('Endereço copiado.')).catch(()=>alert(location.origin+location.pathname))}

/* V67.68.10 — limpa apenas estado fantasma de personalizado criado pelas versões 67.68.6–.9. */
(function v67690CleanupPersonalizedPhantom(){
  try{
    const raw=localStorage.getItem('t2_active_plan'); if(!raw)return;
    const s=JSON.parse(raw); if(!s?.name?.startsWith('Personalizado — ')||!s.startedAt)return;
    const start=new Date(s.startedAt).getTime();
    const hasProgress=history().some(x=>{const t=new Date(x?.date).getTime();return Number.isFinite(start)&&Number.isFinite(t)&&t>=start&&x?.plan===s.name});
    if(!hasProgress){localStorage.removeItem('t2_active_plan');workoutStartedAt=null;}
  }catch(e){}
})();

try{reconcileWorkoutHistory();}catch(e){console.warn('Reconcile startup:',e)}
// V67.60.10 — replay automático do Histórico para o Feed removido.
// V67.60.10: não republica histórico no online; evita alterar localização de posts antigos.
// V67.60.10: recuperação automática Histórico→Feed desativada por segurança.
try{migrateWorkoutQuality();}catch(e){console.warn('Migration startup:',e)}
try{updateLast();}catch(e){console.warn('Last startup:',e)}
try{v6748RenderDashboard();}catch(e){console.warn('Dashboard startup:',e)}
try{v6749RenderPerformance(false);}catch(e){console.warn('Performance startup:',e)}
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw-v67-68-26.js', {updateViaCache:'none'}));
const params=new URLSearchParams(location.search);const direct=Number(params.get('exercise'));if(direct)setTimeout(()=>openExercise(direct),50);



localStorage.setItem('t2_app_version','v67.68.28');



/* ===== V67.68.6 — TREINOS PERSONALIZADOS + MÉTODOS ===== */
const CUSTOM_WORKOUTS_KEY='t2_custom_workouts';
let customBuilderSelected=[];
let customBuilderEditingId=null;
let customConfigIndex=null;
const CUSTOM_METHODS={
  traditional:{label:'Tradicional',hint:'Séries e repetições convencionais.'},
  dropset:{label:'Drop set',hint:'Após a série principal, reduza a carga e continue sem descanso.'},
  biset:{label:'Bi-série',hint:'Execute este exercício e o exercício parceiro em sequência, descansando depois dos dois.'},
  pyramid_up:{label:'Pirâmide crescente',hint:'A carga tende a subir enquanto as repetições diminuem.'},
  pyramid_down:{label:'Pirâmide decrescente',hint:'A carga tende a cair enquanto as repetições aumentam.'},
  restpause:{label:'Rest-pause',hint:'Faça uma pausa curta e complete repetições adicionais.'}
};
function getCustomWorkouts(){try{const x=JSON.parse(localStorage.getItem(CUSTOM_WORKOUTS_KEY)||'[]');return Array.isArray(x)?x:[]}catch(e){return []}}
function saveCustomWorkouts(list){localStorage.setItem(CUSTOM_WORKOUTS_KEY,JSON.stringify(list));if(typeof cloudScheduleSync==='function')cloudScheduleSync()}
function customWorkoutById(id){return getCustomWorkouts().find(x=>x.id===id)}
function customEntry(v){
  if(typeof v==='string')return {name:v,method:'traditional',sets:null,reps:null,rest:null,pyramidReps:[],pairWith:''};
  return {name:String(v?.name||''),method:CUSTOM_METHODS[v?.method]?v.method:'traditional',sets:Number(v?.sets)||null,reps:v?.reps??null,rest:Number(v?.rest)||null,pyramidReps:Array.isArray(v?.pyramidReps)?v.pyramidReps:[],pairWith:String(v?.pairWith||'')};
}
function customWorkoutExercise(entry){
  const cfg=customEntry(entry),base=DATA.exercises.find(x=>x.name===cfg.name);if(!base)return null;
  const sets=Math.max(1,Math.min(20,Number(cfg.sets)||Number(base.sets)||3));
  let reps=cfg.reps||base.reps;
  if((cfg.method==='pyramid_up'||cfg.method==='pyramid_down')&&cfg.pyramidReps.length)reps=cfg.pyramidReps.slice(0,sets).join(' / ');
  return {...base,sets,reps,rest:Math.max(0,Math.min(600,Number(cfg.rest)||Number(base.rest)||60)),customMethod:cfg.method,customMethodLabel:CUSTOM_METHODS[cfg.method].label,customPyramidReps:cfg.pyramidReps.slice(0,sets),customPairWith:cfg.pairWith};
}
function renderPlansWithCustom(){
 const customBox=byId('customPlanList');if(!customBox)return;const list=getCustomWorkouts();
 if(!list.length){customBox.innerHTML='<div class="custom-empty">Você ainda não criou nenhum treino personalizado.</div>';return}
 customBox.innerHTML=list.map(w=>`<div class="custom-plan-card"><button class="custom-plan-open" onclick="openCustomPlan('${w.id}')"><b>${escapeCustomHtml(w.name)}</b><span>${w.exercises.length} exercícios</span><small class="v6742-last-plan">${v6742LastPlanInfo('Personalizado — '+w.name)}</small></button><div class="custom-plan-actions"><button onclick="editCustomWorkout('${w.id}')">✎</button><button class="danger-mini" onclick="deleteCustomWorkout('${w.id}')">×</button></div></div>`).join('')
}
function escapeCustomHtml(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function openCustomPlan(id){
 const w=customWorkoutById(id);if(!w){alert('Treino personalizado não encontrado.');return}
 activePlanName='Personalizado — '+w.name;activePlanExercises=w.exercises.map(customWorkoutExercise).filter(Boolean);activePlanIndex=-1;currentListMode='plan';
 if(!activePlanExercises.length){alert('Este treino não possui exercícios disponíveis.');return}
 byId('listTitle').textContent=w.name;renderExerciseButtons(activePlanExercises);const startBox=byId('planStartBox');
 if(startBox)startBox.innerHTML=`<button type="button" class="big red plan-start" onclick="startPlanWorkout(); return false;">▶ INICIAR TREINO</button><small>${activePlanExercises.length} exercícios • treino personalizado</small>`;showView('list')
}
function openCustomBuilder(id=null){
 customBuilderEditingId=id;const saved=id?customWorkoutById(id):null;customBuilderSelected=saved?saved.exercises.map(customEntry):[];customConfigIndex=null;
 const name=byId('customWorkoutName');if(name)name.value=saved?saved.name:'';const title=byId('customBuilderTitle');if(title)title.textContent=saved?'Editar treino':'Montar meu treino';renderCustomBuilder();showView('customBuilder')
}
function customCfgSummary(cfg){
 const base=DATA.exercises.find(x=>x.name===cfg.name),sets=cfg.sets||base?.sets||3,reps=cfg.reps||base?.reps||'10';
 const method=CUSTOM_METHODS[cfg.method||'traditional']?.label||'Tradicional';
 if((cfg.method==='pyramid_up'||cfg.method==='pyramid_down')&&cfg.pyramidReps?.length)return `${method} • ${sets} séries • ${cfg.pyramidReps.slice(0,sets).join(' / ')} reps`;
 return `${method} • ${sets} × ${reps}`;
}
function renderCustomBuilder(){
 const groups=[...new Set(DATA.exercises.map(x=>x.group))].filter(g=>g!=='Alongamento');const library=byId('customExerciseLibrary');
 if(library)library.innerHTML=groups.map(g=>`<div class="builder-group"><div class="builder-group-title">${escapeCustomHtml(g)}</div>${DATA.exercises.filter(x=>x.group===g).map(ex=>{const selected=customBuilderSelected.some(v=>v.name===ex.name);return `<button type="button" class="builder-exercise ${selected?'selected':''}" onclick="toggleCustomExercise(${JSON.stringify(ex.name).replace(/"/g,'&quot;')})"><span class="builder-check">${selected?'✓':'+'}</span><span><b>${escapeCustomHtml(ex.name)}</b><small>${ex.sets} séries • ${escapeCustomHtml(ex.reps)}</small></span></button>`}).join('')}</div>`).join('');
 const selected=byId('customSelectedExercises'),count=byId('customSelectedCount');if(count)count.textContent=`${customBuilderSelected.length} selecionado${customBuilderSelected.length===1?'':'s'}`;
 if(selected)selected.innerHTML=customBuilderSelected.length?customBuilderSelected.map((cfg,i)=>`<div class="selected-exercise-row v67686-selected"><span class="selected-order">${i+1}</span><span class="selected-name"><b>${escapeCustomHtml(cfg.name)}</b><small>${escapeCustomHtml(customCfgSummary(cfg))}</small></span><div class="selected-move"><button class="v67686-config" onclick="openCustomExerciseConfig(${i})">⚙</button><button ${i===0?'disabled':''} onclick="moveCustomExercise(${i},-1)">↑</button><button ${i===customBuilderSelected.length-1?'disabled':''} onclick="moveCustomExercise(${i},1)">↓</button><button class="remove" onclick="removeCustomExercise(${i})">×</button></div></div>`).join(''):'<div class="custom-empty">Escolha os exercícios na biblioteca abaixo.</div>';
 renderCustomExerciseConfig()
}
function toggleCustomExercise(name){const i=customBuilderSelected.findIndex(v=>v.name===name);if(i>=0)customBuilderSelected.splice(i,1);else customBuilderSelected.push(customEntry(name));renderCustomBuilder()}
function removeCustomExercise(i){customBuilderSelected.splice(i,1);if(customConfigIndex===i)customConfigIndex=null;renderCustomBuilder()}
function moveCustomExercise(i,dir){const j=i+dir;if(j<0||j>=customBuilderSelected.length)return;[customBuilderSelected[i],customBuilderSelected[j]]=[customBuilderSelected[j],customBuilderSelected[i]];renderCustomBuilder()}
function openCustomExerciseConfig(i){customConfigIndex=i;renderCustomExerciseConfig();setTimeout(()=>byId('customExerciseConfig')?.scrollIntoView({behavior:'smooth',block:'center'}),30)}
function renderCustomExerciseConfig(){
 const host=byId('customExerciseConfig');if(!host)return;if(customConfigIndex==null||!customBuilderSelected[customConfigIndex]){host.style.display='none';host.innerHTML='';return}
 const cfg=customBuilderSelected[customConfigIndex],base=DATA.exercises.find(x=>x.name===cfg.name),sets=cfg.sets||base?.sets||3,reps=cfg.reps||base?.reps||10,rest=cfg.rest||base?.rest||60;
 const pairs=customBuilderSelected.filter((_,i)=>i!==customConfigIndex).map(x=>`<option value="${escapeCustomHtml(x.name)}" ${cfg.pairWith===x.name?'selected':''}>${escapeCustomHtml(x.name)}</option>`).join('');
 host.style.display='block';host.innerHTML=`<div class="v67686-config-head"><div><span class="eyebrow">CONFIGURAR EXERCÍCIO</span><h3>${escapeCustomHtml(cfg.name)}</h3></div><button onclick="closeCustomExerciseConfig()">×</button></div><label>Método<select id="customMethod" onchange="customMethodChanged()">${Object.entries(CUSTOM_METHODS).map(([k,v])=>`<option value="${k}" ${cfg.method===k?'selected':''}>${v.label}</option>`).join('')}</select></label><p id="customMethodHint" class="muted">${CUSTOM_METHODS[cfg.method].hint}</p><div class="grid2"><label>Séries<input id="customSets" type="number" min="1" max="20" value="${sets}" oninput="customMethodChanged()"></label><label>Repetições<input id="customReps" type="number" min="1" max="999" value="${parseInt(reps)||10}"></label></div><label>Descanso após série (segundos)<input id="customRest" type="number" min="0" max="600" value="${rest}"></label><div id="customPyramidBox"></div><div id="customBiSetBox"></div><button class="big red" onclick="saveCustomExerciseConfig()">APLICAR CONFIGURAÇÃO</button>`;customMethodChanged()
}
function customMethodChanged(){
 const method=byId('customMethod')?.value||'traditional',sets=Math.max(1,Math.min(20,Number(byId('customSets')?.value)||3)),cfg=customBuilderSelected[customConfigIndex]||{};const hint=byId('customMethodHint');if(hint)hint.textContent=CUSTOM_METHODS[method].hint;
 const p=byId('customPyramidBox');if(p)p.innerHTML=(method==='pyramid_up'||method==='pyramid_down')?`<div class="v67686-pyramid"><b>Repetições por série</b><div>${Array.from({length:sets},(_,i)=>`<label>S${i+1}<input class="custom-pyr-rep" type="number" min="1" value="${Number(cfg.pyramidReps?.[i])||Math.max(1,(method==='pyramid_up'?12-i*2:6+i*2))}"></label>`).join('')}</div></div>`:'';
 const b=byId('customBiSetBox');if(b)b.innerHTML=method==='biset'?`<label>Exercício parceiro<select id="customPair"><option value="">Escolha...</option>${customBuilderSelected.filter((_,i)=>i!==customConfigIndex).map(x=>`<option value="${escapeCustomHtml(x.name)}" ${cfg.pairWith===x.name?'selected':''}>${escapeCustomHtml(x.name)}</option>`).join('')}</select></label>`:''
}
function saveCustomExerciseConfig(){
 const cfg=customBuilderSelected[customConfigIndex];if(!cfg)return;const method=byId('customMethod')?.value||'traditional';cfg.method=method;cfg.sets=Math.max(1,Math.min(20,Number(byId('customSets')?.value)||3));cfg.reps=Math.max(1,Number(byId('customReps')?.value)||10);cfg.rest=Math.max(0,Math.min(600,Number(byId('customRest')?.value)||60));cfg.pyramidReps=[...document.querySelectorAll('.custom-pyr-rep')].map(x=>Math.max(1,Number(x.value)||1));cfg.pairWith=method==='biset'?(byId('customPair')?.value||''):'';if(method==='biset'&&!cfg.pairWith){alert('Escolha o segundo exercício da bi-série.');return}customConfigIndex=null;renderCustomBuilder()
}
function closeCustomExerciseConfig(){customConfigIndex=null;renderCustomExerciseConfig()}
function saveCustomWorkout(){
 const name=(byId('customWorkoutName')?.value||'').trim();if(!name){alert('Digite um nome para o treino.');byId('customWorkoutName')?.focus();return}if(!customBuilderSelected.length){alert('Escolha pelo menos um exercício.');return}
 const list=getCustomWorkouts();const exercises=customBuilderSelected.map(customEntry);if(customBuilderEditingId){const i=list.findIndex(x=>x.id===customBuilderEditingId);if(i>=0)list[i]={...list[i],name,exercises,updatedAt:new Date().toISOString()}}else list.unshift({id:'cw_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7),name,exercises,createdAt:new Date().toISOString()});saveCustomWorkouts(list);customBuilderEditingId=null;customBuilderSelected=[];openPlans('custom')
}
function editCustomWorkout(id){
  openCustomBuilder(id);
}
function deleteCustomWorkout(id){
  const w=customWorkoutById(id);
  if(!w) return;
  if(!confirm(`Excluir o treino "${w.name}"?`)) return;
  saveCustomWorkouts(getCustomWorkouts().filter(x=>x.id!==id));
  renderPlansWithCustom();
}




/* ===== V67.26 — NAVEGAÇÃO INTERNA + RESTAURAÇÃO ===== */
function restorePlanContext(state){
  try{
    const saved=JSON.parse(localStorage.getItem('t2_active_plan')||'null');
    if(saved&&typeof saved.serviceDay==='boolean'){
      v66WorkoutServiceDay=saved.serviceDay;
      sessionStorage.setItem(V66_SERVICE_KEY,saved.serviceDay?'1':'0');
    }
  }catch(e){}

  activePlanName=state.activePlanName||'';
  activePlanIndex=Number.isInteger(state.activePlanIndex)?state.activePlanIndex:-1;
  workoutStartedAt=state.workoutStartedAt||null;

  if(activePlanName && DATA.plans[activePlanName]){
    activePlanExercises=DATA.plans[activePlanName].map(exByName).filter(Boolean);
    return true;
  }

  if(activePlanName.startsWith('Personalizado — ')){
    const customName=activePlanName.replace(/^Personalizado — /,'');
    const w=getCustomWorkouts().find(x=>x.name===customName);
    if(w){
      activePlanExercises=w.exercises.map(customWorkoutExercise).filter(Boolean);
      return true;
    }
  }

  activePlanExercises=[];
  return false;
}

function restoreNavigationState(force=false){
  if(!cloudSession?.token)return;

  // V67.29 — em uma abertura nova do PWA/site, começa sempre na página inicial.
  // A restauração da tela anterior fica restrita a recarregamento da página
  // (F5/atualizar) e ao botão Voltar/Avançar do navegador.
  if(!force && !NAV_RESTORE_ON_BOOT){
    // V67.60.5: treino preservado volta como cartão na Home; o militar decide retomar ou cancelar.
    clearNavigationState();
    navRestoring=true;
    try{
      document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
      byId('home')?.classList.add('active');
      setTimeout(v67604RenderActiveWorkoutCard,20);
      window.scrollTo({top:0,behavior:'auto'});
      v67610ClearStack();
      ensureAppHistoryState();
    }catch(e){}
    finally{navRestoring=false}
    return;
  }

  let state=null;
  try{state=JSON.parse(sessionStorage.getItem(NAV_STATE_KEY)||'null')}catch(e){}
  if(!state || state.matricula!==cloudSession.matricula)return;

  navRestoring=true;
  try{
    currentGroup=state.currentGroup||'';
    currentListMode=state.currentListMode||'group';
    currentSet=Math.max(1,Number(state.currentSet)||1);
    navHistoryIndex=Number.isInteger(state.historyIndex)?state.historyIndex:null;
    restorePlanContext(state);

    switch(state.view){
      case 'plans':
        openPlans();
        break;
      case 'groups':
        openGroups();
        break;
      case 'list':
        if(state.currentListMode==='plan' && state.activePlanName){
          if(state.activePlanName.startsWith('Personalizado — ')){
            const customName=state.activePlanName.replace(/^Personalizado — /,'');
            const w=getCustomWorkouts().find(x=>x.name===customName);
            if(w) openCustomPlan(w.id); else openPlans();
          }else if(DATA.plans[state.activePlanName]){
            openPlan(state.activePlanName);
          }else{
            openPlans();
          }
        }else if(state.currentGroup){
          openGroup(state.currentGroup);
        }else{
          openGroups();
        }
        break;
      case 'exercise':
        if(state.currentExerciseId!=null){
          const inPlan=!!state.activePlanName && state.activePlanIndex>=0;
          openExercise(state.currentExerciseId,inPlan);
          currentSet=Math.max(1,Number(state.currentSet)||1);
          if(currentExercise){
            const finished=currentSet>currentExercise.sets;
            byId('setLabel').textContent=finished
              ? `Série ${currentExercise.sets} de ${currentExercise.sets}`
              : `Série ${currentSet} de ${currentExercise.sets}`;
          }
        }else showView('home');
        break;
      case 'history':
        renderHistory();
        showView('history');
        if(navHistoryIndex!==null) openWorkoutHistory(navHistoryIndex);
        break;
      case 'progress':
        showView('progress');
        renderProgress();
        break;
      case 'stretch':
        showView('stretch');
        if(state.mobilityRoutineKey && MOBILITY_ROUTINES[state.mobilityRoutineKey]){
          mobilityStopTick();
          mobilityRoutineKey=state.mobilityRoutineKey;
          const r=MOBILITY_ROUTINES[mobilityRoutineKey];
          mobilityStep=Math.max(0,Math.min(Number(state.mobilityStep)||0,r.steps.length-1));
          mobilityRemaining=Math.max(0,Number(state.mobilityRemaining)||r.steps[mobilityStep]?.time||0);
          mobilityRunning=false;
          renderMobilityRoutine();
        }else{
          renderStretch();
        }
        break;
      case 'coreOperational':
        loadCoreServiceChoice();
        showView('coreOperational');
        if(state.coreRoutineKey && CORE_OPERATIONAL_ROUTINES[state.coreRoutineKey]){
          if(coreServiceDay===null){ renderCoreOperational(); break; }
          coreRoutineStartedAt=new Date().toISOString();
          coreCompletionSaved=false;
          coreStopTick();
          coreRoutineKey=state.coreRoutineKey;
          const r=CORE_OPERATIONAL_ROUTINES[coreRoutineKey];
          coreStep=Math.max(0,Math.min(Number(state.coreStep)||0,r.steps.length-1));
          coreRemaining=Math.max(0,Number(state.coreRemaining)||r.steps[coreStep]?.time||0);
          coreRunning=false;
          renderCoreRoutine();
        }else{
          renderCoreOperational();
        }
        break;
      case 'nutrition':
        openNutrition(state.nutritionTab||'sim');
        break;
      case 'tools':
        showView('tools');
        break;
      case 'taf':
        openTAF();
        break;
      case 'v55Profile':
        openV55Profile();
        break;
      case 'v55Ranking':
        showView('v55Ranking');
        v55LoadRanking();
        break;
      case 'officialTafRanking':
        if(typeof officialTafState!=='undefined'){
          officialTafState.edition=state.officialTafEdition||officialTafState.edition;
          officialTafState.scope=state.officialTafScope||'all';
          officialTafState.exercise=state.officialTafExercise||'pushup';
        }
        openOfficialTafRanking();
        break;
      case 'admin':
        openAdmin();
        break;
      case 'customBuilder':
        openCustomBuilder(state.customBuilderEditingId||null);
        break;
      case 'workoutDone':
        renderHistory();
        showView('history');
        break;
      case 'workoutChooser':
        restoreWorkoutChooserV667(state);
        break;
      case 'freeWorkout':
        restoreFreeWorkoutV667(state);
        break;
      case 'cardioWorkout':
        restoreCardioWorkoutV6733(state);
        break;
      case 'home':
      default:
        showView('home');
        break;
    }

    requestAnimationFrame(()=>window.scrollTo({top:Number(state.scrollY)||0,behavior:'auto'}));
  }catch(e){
    console.warn('Não foi possível restaurar a tela anterior:',e);
    showView('home');
  }finally{
    navRestoring=false;
    const activeNow=document.querySelector('.view.active')?.id||'home';
    saveNavigationState(activeNow);

    ensureAppHistoryState();
    setTimeout(v67610ArmCloseWatcher,0);
  }
}

window.addEventListener('pagehide',()=>{
  v67603SaveActivePlanState();
  saveNavigationState(document.querySelector('.view.active')?.id||'home');
});

window.addEventListener('beforeunload',()=>{
  v67603SaveActivePlanState();
  const active=document.querySelector('.view.active')?.id||'home';
  try{
    const s=navStateSnapshot(active);
    s.scrollY=window.scrollY||0;
    sessionStorage.setItem(NAV_STATE_KEY,JSON.stringify(s));
  }catch(e){}
});


/* ===== V67.38.5 — FEED ESPORTIVO DA 2ª CIA ===== */
const V6738_FEED_PENDING_KEY='t2_feed_pending_v6738';
const V6738_FEED_LOCATION_ENABLED='t2_feed_location_enabled_v6738';
const V6738_FEED_LOCATION_TEXT='t2_feed_location_text_v6738';
let v6738FeedLoading=false;
let v6738FeedLastLoad=0;
let v6753FeedRows=[];
let v6753FeedDays=7;
const V6753_FEED_FETCH_LIMIT=500;
let v67382NotificationTimer=null;
const V67382_FEED_DELETE_PENDING='t2_feed_delete_pending_v67382';
const V67382_FEED_DELETE_ALL_PENDING='t2_feed_delete_all_pending_v67382';

function v6738FeedEsc(v){
  return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function v6738FeedPrefs(){
  return {
    enabled:localStorage.getItem(V6738_FEED_LOCATION_ENABLED)==='1',
    text:String(localStorage.getItem(V6738_FEED_LOCATION_TEXT)||'').trim().slice(0,80)
  };
}
function v6738RestoreFeedLocationPrefs(){
  const p=v6738FeedPrefs(),cb=byId('feedLocationEnabled'),input=byId('feedLocationText');
  if(cb)cb.checked=p.enabled;
  if(input){input.value=p.text;input.disabled=!p.enabled}
}
function v6738SaveFeedLocationPrefs(){
  const cb=byId('feedLocationEnabled'),input=byId('feedLocationText');
  const enabled=!!cb?.checked;
  const text=String(input?.value||'').trim().slice(0,80);
  localStorage.setItem(V6738_FEED_LOCATION_ENABLED,enabled?'1':'0');
  if(text)localStorage.setItem(V6738_FEED_LOCATION_TEXT,text); else localStorage.removeItem(V6738_FEED_LOCATION_TEXT);
  if(input)input.disabled=!enabled;
}
function v67383NewActivityId(){
  try{if(globalThis.crypto?.randomUUID)return globalThis.crypto.randomUUID()}catch(e){}
  return `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,12)}`;
}
function v67382DeletePendingRead(){
  try{
    const a=JSON.parse(localStorage.getItem(V67382_FEED_DELETE_PENDING)||'[]');
    if(!Array.isArray(a))return [];
    return a.map(x=>typeof x==='string'?{sourceKey:x}:x).filter(x=>x&&typeof x==='object');
  }catch(e){return []}
}
function v67382DeletePendingWrite(a){
  try{
    const seen=new Set(),out=[];
    for(const raw of (a||[])){
      const x=typeof raw==='string'?{sourceKey:raw}:raw;
      if(!x||typeof x!=='object')continue;
      const key=String(x.activityId||'')+'|'+String(x.sourceKey||'')+'|'+String(x.date||'')+'|'+String(x.plan||'');
      if(seen.has(key))continue;seen.add(key);out.push(x);
    }
    localStorage.setItem(V67382_FEED_DELETE_PENDING,JSON.stringify(out.slice(-80)));
  }catch(e){}
}
function v67383DeleteDescriptor(w){
  return {
    activityId:String(w?.atividadeId||w?.activityId||'').trim()||null,
    sourceKey:String(w?.date||w?.finishedAt||'').trim()||null,
    date:String(w?.date||w?.finishedAt||'').trim()||null,
    plan:String(w?.plan||'').trim()||null
  };
}
async function v67383DeleteFeedDescriptor(desc,queueOnFail=true){
  const d=desc&&typeof desc==='object'?desc:{sourceKey:String(desc||'').trim()};
  if(!d.activityId&&!d.sourceKey&&!d.date)return false;
  if(!navigator.onLine||!cloudSession?.token){
    if(queueOnFail){const a=v67382DeletePendingRead();a.push(d);v67382DeletePendingWrite(a)}
    return false;
  }
  try{
    // v67.38.7: para atividades novas, usa primeiro a RPC por atividade_id
    // que foi validada diretamente no Supabase. Só cai no fallback legado
    // quando não há ID ou quando nenhum registro foi removido por ele.
    if(d.activityId){
      const byId=await cloudRpc('feed_excluir_atividade_id_v67383',{
        p_token_militar:cloudSession.token,
        p_atividade_id:d.activityId
      });
      const okById=byId?.excluido===true||Number(byId?.quantidade)>0;
      if(okById)return true;
    }

    const fallback=await cloudRpc('feed_excluir_atividade_v67384',{
      p_token_militar:cloudSession.token,
      p_atividade_id:d.activityId||null,
      p_source_key:d.sourceKey||null,
      p_data_atividade:d.date||null,
      p_plano:d.plan||null
    });
    const okFallback=fallback?.excluido===true||Number(fallback?.quantidade)>0;
    if(okFallback)return true;

    console.warn('Feed: nenhuma publicação correspondente foi encontrada para exclusão.',d);
    if(queueOnFail){const a=v67382DeletePendingRead();a.push(d);v67382DeletePendingWrite(a)}
    return false;
  }catch(e){
    console.warn('Exclusão do feed pendente:',e);
    if(queueOnFail){const a=v67382DeletePendingRead();a.push(d);v67382DeletePendingWrite(a)}
    return false;
  }
}

function v67384CurrentHistoryDescriptors(){
  try{
    return workoutHistory().map(w=>v67383DeleteDescriptor(w)).filter(d=>d.activityId||d.sourceKey||d.date).slice(0,1200);
  }catch(e){return []}
}
async function v67384ReconcileMyFeed(){
  if(!navigator.onLine||!cloudSession?.token)return false;
  const items=v67384CurrentHistoryDescriptors();
  try{
    // V67.38.7: se o Histórico estiver vazio, o Feed próprio também deve ficar vazio.
    // Isso corrige o caso em que a última atividade é apagada e sobra um post órfão.
    if(!items.length){
      await cloudRpc('feed_excluir_minhas_atividades',{p_token_militar:cloudSession.token});
      return true;
    }
    await cloudRpc('feed_reconciliar_historico_v67384',{
      p_token_militar:cloudSession.token,
      p_atividades:items
    });
    return true;
  }catch(e){console.warn('Não foi possível reconciliar o Feed com o Histórico:',e);return false}
}
async function v67383DeleteFeedActivity(w){
  return v67383DeleteFeedDescriptor(v67383DeleteDescriptor(w),true);
}
function v67605RemovePendingFeedDelete(w){
  try{
    const d=v67383DeleteDescriptor(w);
    const keep=v67382DeletePendingRead().filter(x=>{
      const sameId=d.activityId&&String(x?.activityId||'')===d.activityId;
      const sameLegacy=!d.activityId&&String(x?.date||'')===String(d.date||'')&&String(x?.plan||'')===String(d.plan||'');
      return !(sameId||sameLegacy);
    });
    v67382DeletePendingWrite(keep);
  }catch(e){}
}
async function v67386FeedPostStillExists(w){
  if(!navigator.onLine||!cloudSession?.token)return true;
  const d=v67383DeleteDescriptor(w);
  try{
    const rows=await cloudRpc('feed_listar_v67381',{p_token_militar:cloudSession.token,p_limite:60});
    const list=Array.isArray(rows)?rows:(rows?[rows]:[]);
    const myMat=cloudNormalize(cloudSession?.matricula||'');
    const targetTime=new Date(d.date||'').getTime();
    const targetPlan=String(d.plan||'').trim().toLocaleLowerCase('pt-BR');
    return list.some(r=>{
      if(myMat&&cloudNormalize(r?.matricula||'')!==myMat)return false;
      if(d.activityId&&String(r?.atividade_id||r?.atividadeId||'').trim()===d.activityId)return true;
      const rp=String(r?.plano||'').trim().toLocaleLowerCase('pt-BR');
      const rt=new Date(r?.data_atividade||'').getTime();
      const samePlan=!targetPlan||rp===targetPlan;
      const sameTime=Number.isFinite(targetTime)&&Number.isFinite(rt)&&Math.abs(rt-targetTime)<=15000;
      return samePlan&&sameTime;
    });
  }catch(e){
    console.warn('Não foi possível verificar o Feed após a exclusão:',e);
    return true;
  }
}
// Compatibilidade com chamadas antigas da v67.38.2.
async function v67382DeleteFeedSource(sourceKey){
  return v67383DeleteFeedDescriptor({sourceKey:String(sourceKey||'').trim(),date:String(sourceKey||'').trim()},true);
}
async function v67382FlushFeedDeletes(){
  if(!navigator.onLine||!cloudSession?.token)return false;
  if(localStorage.getItem(V67382_FEED_DELETE_ALL_PENDING)==='1'){
    try{
      await cloudRpc('feed_excluir_minhas_atividades',{p_token_militar:cloudSession.token});
      localStorage.removeItem(V67382_FEED_DELETE_ALL_PENDING);
      v67382DeletePendingWrite([]);
    }catch(e){console.warn('Exclusão geral do feed pendente:',e);return false}
  }
  const rows=v67382DeletePendingRead();if(!rows.length)return true;
  const keep=[];
  for(const d of rows){
    const ok=await v67383DeleteFeedDescriptor(d,false);
    if(!ok)keep.push(d);
  }
  v67382DeletePendingWrite(keep);return keep.length===0;
}
async function v67382DeleteAllMyFeed(){
  if(!navigator.onLine||!cloudSession?.token){localStorage.setItem(V67382_FEED_DELETE_ALL_PENDING,'1');return false}
  try{
    await cloudRpc('feed_excluir_minhas_atividades',{p_token_militar:cloudSession.token});
    localStorage.removeItem(V67382_FEED_DELETE_ALL_PENDING);v67382DeletePendingWrite([]);return true;
  }catch(e){localStorage.setItem(V67382_FEED_DELETE_ALL_PENDING,'1');console.warn('Não foi possível limpar o feed agora:',e);return false}
}
function v6738CompactActivity(w){
  const category=w?.workoutType==='core'?'core':((w?.workoutType==='cardio'||w?.rankingCategory==='cardio'||w?.cardioMachine)?'cardio':'treino');
  const activityId=String(w?.atividadeId||w?.activityId||'').trim();
  // V67.38.7: a localização vira parte da própria atividade no momento em que ela
  // é concluída. Mudar a preferência depois não altera publicações anteriores.
  const activityLocation=w?.feedLocation||w?.activityLocationLabel||null;
  return {
    activityId:activityId||null,
    sourceKey:String(w?.date||w?.finishedAt||activityId||(`${Date.now()}-${Math.random()}`)),
    date:String(w?.date||new Date().toISOString()),
    plan:String(w?.plan||'Atividade concluída').slice(0,180),
    workoutType:String(w?.workoutType||'').slice(0,30),
    category,
    duration:Math.max(0,Number(w?.duration)||0),
    exercisesDone:Math.max(0,Number(w?.exercisesDone)||0),
    sets:Math.max(0,Number(w?.sets)||0),
    serviceDay:w?.serviceDay===true,
    rankingValid:(typeof v55ValidWorkout==='function')?!!v55ValidWorkout(w):false,
    cardioMachine:w?.cardioMachine?String(w.cardioMachine).slice(0,30):null,
    cardioDistanceKm:Number.isFinite(Number(w?.cardioDistanceKm))?Number(w.cardioDistanceKm):null,
    coreComplete:w?.coreComplete===true,
    feedLocation:activityLocation
  };
}
function v6738PendingRead(){
  try{const a=JSON.parse(localStorage.getItem(V6738_FEED_PENDING_KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return []}
}
function v6738PendingWrite(a){
  try{localStorage.setItem(V6738_FEED_PENDING_KEY,JSON.stringify(a.slice(-40)))}catch(e){}
}
function v6738QueueFeedActivity(record){
  if(!record)return;
  // Congela a localização na própria atividade antes de enfileirar.
  if(!Object.prototype.hasOwnProperty.call(record,'feedLocation'))record.feedLocation=record.activityLocationLabel||null;
  const item=v6738CompactActivity(record),items=v6738PendingRead();
  if(!items.some(x=>(item.activityId&&x.activityId===item.activityId)||(!item.activityId&&x.sourceKey===item.sourceKey)))items.push(item);
  v6738PendingWrite(items);
  if(navigator.onLine&&cloudSession?.token)setTimeout(v6738FlushFeedPending,180);
}

/* ===== V67.60.10 — RECUPERAÇÃO HISTÓRICO → FEED (MANUAL/DESATIVADA) =====
   Reenfileira somente atividades modernas que possuem atividadeId estável.
   A RPC feed_publicar_atividade_v67383 é idempotente pelo atividade_id, então
   registros já publicados não são duplicados. Isto recupera atividades que
   foram salvas localmente mas cuja publicação falhou antes de entrar na fila. */
let v67607FeedRecoveryRunning=false;
async function v67607RecoverMissingFeedActivities(){
  if(v67607FeedRecoveryRunning||!navigator.onLine||!cloudSession?.token)return false;
  v67607FeedRecoveryRunning=true;
  try{
    const rows=workoutHistory();
    let queued=0;
    for(const w of rows){
      const activityId=String(w?.atividadeId||w?.activityId||'').trim();
      if(!activityId)continue;
      const item=v6738CompactActivity(w);
      const pending=v6738PendingRead();
      if(!pending.some(x=>String(x?.activityId||'')===activityId)){
        pending.push(item);
        v6738PendingWrite(pending);
        queued++;
      }
    }
    // Mesmo que queued seja zero, descarrega eventual fila já existente.
    await v6738FlushFeedPending();
    return true;
  }catch(e){
    console.warn('Recuperação Histórico → Feed:',e);
    return false;
  }finally{
    v67607FeedRecoveryRunning=false;
  }
}
async function v6738FlushFeedPending(){
  if(!navigator.onLine||!cloudSession?.token)return false;
  let items=v6738PendingRead(); if(!items.length)return true;
  const pref=v6738FeedPrefs();
  const pending=[];
  for(const item of items){
    try{
      // Itens novos carregam a localização congelada no momento da conclusão.
      // O fallback abaixo atende apenas pendências antigas criadas antes da v67.38.5.
      const postLocation=Object.prototype.hasOwnProperty.call(item,'feedLocation')
        ? (item.feedLocation||null)
        : ((pref.enabled&&pref.text)?pref.text:null);
      if(item.activityId){
        await cloudRpc('feed_publicar_atividade_v67383',{
          p_token_militar:cloudSession.token,
          p_atividade_id:item.activityId,
          p_source_key:item.sourceKey,
          p_atividade:item,
          p_localizacao:postLocation
        });
      }else{
        await cloudRpc('feed_publicar_atividade',{
          p_token_militar:cloudSession.token,
          p_source_key:item.sourceKey,
          p_atividade:item,
          p_localizacao:postLocation
        });
      }
    }catch(e){
      console.warn('Feed pendente:',e);pending.push(item);
    }
  }
  v6738PendingWrite(pending);
  if(!pending.length&&document.querySelector('.view.active')?.id==='home')setTimeout(()=>v6738LoadFeed(true),150);
  return pending.length===0;
}
function v6738FeedWhen(iso){
  const d=new Date(iso); if(!Number.isFinite(d.getTime()))return '';
  const diff=Math.max(0,Date.now()-d.getTime()),min=Math.floor(diff/60000);
  if(min<1)return 'agora'; if(min<60)return `há ${min} min`;
  const h=Math.floor(min/60); if(h<24)return `há ${h} h`;
  const days=Math.floor(h/24); if(days<7)return `há ${days} d`;
  return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'});
}
function v67381FeedDateTime(iso){
  const d=new Date(iso); if(!Number.isFinite(d.getTime()))return '';
  return d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false}).replace(',', ' •');
}
function v67381SafeProfilePhoto(v){
  const s=String(v||'').trim();
  if(/^data:image\/(?:png|jpe?g|webp|gif);base64,/i.test(s))return s;
  if(/^https:\/\//i.test(s))return s;
  return '';
}
async function v67381SyncFeedProfile(){
  if(!cloudSession?.token||!navigator.onLine)return false;
  const photo=String(localStorage.getItem('t2_profile_photo_v6717')||'');
  try{
    await cloudRpc('feed_atualizar_perfil',{p_token_militar:cloudSession.token,p_foto_perfil:photo||null});
    return true;
  }catch(e){
    console.warn('Não foi possível sincronizar a foto do perfil com o feed:',e);
    return false;
  }
}
function v6738CategoryIcon(cat){return cat==='cardio'?'🏃':cat==='core'?'🛡️':'🏋️'}
function v6738FeedInitials(name){
  const p=String(name||'BM').trim().split(/\s+/).filter(Boolean);return ((p[0]?.[0]||'B')+(p.length>1?(p[p.length-1]?.[0]||''):'')).toUpperCase();
}
/* ===== V67.40.0 — STATUS + COMENTÁRIOS NO FEED ===== */
let v6740SocialMap=new Map();

function v6740SocialFor(feedId){
  return v6740SocialMap.get(Number(feedId))||{status_texto:'',comentarios_count:0,propria:false};
}
async function v6740LoadSocialSummary(feedRows){
  const ids=(Array.isArray(feedRows)?feedRows:[]).map(r=>Number(r.id)).filter(Number.isFinite);
  v6740SocialMap=new Map();
  if(!ids.length||!cloudSession?.token||!navigator.onLine)return;
  try{
    const rows=await v55RpcAll('feed_social_listar_v6740',{p_token_militar:cloudSession.token,p_feed_ids:ids});
    (Array.isArray(rows)?rows:[]).forEach(r=>v6740SocialMap.set(Number(r.feed_id),r));
  }catch(e){
    console.warn('Complemento social do feed ainda não disponível:',e);
  }
}
function v6740CommentCountLabel(n){
  const x=Math.max(0,Number(n)||0);return `${x} ${x===1?'comentário':'comentários'}`;
}
async function v6740EditStatus(feedId){
  if(!cloudSession?.token||!navigator.onLine){alert('Conecte-se à internet para editar o status.');return}
  const current=String(v6740SocialFor(feedId).status_texto||'');
  const value=prompt('Status da atividade (até 150 caracteres):',current);
  if(value===null)return;
  const text=String(value).trim();
  if(text.length>150){alert('O status pode ter no máximo 150 caracteres.');return}
  try{
    await cloudRpc('feed_status_atualizar_v6740',{p_token_militar:cloudSession.token,p_feed_id:Number(feedId),p_status:text||null});
    v6738FeedLastLoad=0;await v6738LoadFeed(true);
  }catch(e){console.error(e);alert('Não foi possível atualizar o status agora.')}
}
async function v6740ToggleComments(feedId,button){
  const card=document.querySelector(`.sports-feed-card[data-feed-id="${Number(feedId)}"]`);
  const panel=card?.querySelector('.feed-comments-panel');if(!panel)return;
  const opening=panel.hidden;
  panel.hidden=!opening;
  if(button)button.setAttribute('aria-expanded',opening?'true':'false');
  if(opening)await v6740LoadComments(feedId);
}
async function v6740LoadComments(feedId){
  const card=document.querySelector(`.sports-feed-card[data-feed-id="${Number(feedId)}"]`);
  const panel=card?.querySelector('.feed-comments-panel');if(!panel)return;
  if(!cloudSession?.token){panel.innerHTML='<div class="feed-comment-state">Entre para visualizar comentários.</div>';return}
  if(!navigator.onLine){panel.innerHTML='<div class="feed-comment-state">Conecte-se à internet para carregar comentários.</div>';return}
  panel.innerHTML='<div class="feed-comment-state">Carregando comentários…</div>';
  try{
    const rows=await v55RpcAll('feed_comentarios_listar_v6740',{p_token_militar:cloudSession.token,p_feed_id:Number(feedId)});
    v6740RenderComments(feedId,rows);
  }catch(e){console.error(e);panel.innerHTML='<div class="feed-comment-state error">Não foi possível carregar os comentários.</div>'}
}
function v6740RenderComments(feedId,rows){
  const card=document.querySelector(`.sports-feed-card[data-feed-id="${Number(feedId)}"]`);
  const panel=card?.querySelector('.feed-comments-panel');if(!panel)return;
  const list=Array.isArray(rows)?rows:[];
  const comments=list.length?list.map(c=>{
    const photo=v67381SafeProfilePhoto(c.foto_perfil);
    const avatar=photo?`<div class="feed-comment-avatar has-photo"><img src="${v6738FeedEsc(photo)}" alt=""></div>`:`<div class="feed-comment-avatar">${v6738FeedInitials(c.nome)}</div>`;
    const mine=c.meu===true;
    const ownDelete=mine?`<button class="feed-comment-delete" type="button" onclick="v6740DeleteOwnComment(${Number(c.id)},${Number(feedId)})">Excluir</button>`:'';
    const adminDelete=(!mine&&adminSessionToken)?`<button class="feed-comment-admin-delete" type="button" onclick="v6740AdminDeleteComment(${Number(c.id)},${Number(feedId)})">🛡️ Remover</button>`:'';
    return `<div class="feed-comment-item" data-comment-id="${Number(c.id)}">${avatar}<div class="feed-comment-main"><div class="feed-comment-head"><b>${v6738FeedEsc(c.graduacao||'BM')} ${v6738FeedEsc(c.nome||'Militar')}</b><small>${v6738FeedEsc(v67381FeedDateTime(c.criado_em))}</small></div><p>${v6738FeedEsc(c.texto||'')}</p><div class="feed-comment-actions">${ownDelete}${adminDelete}</div></div></div>`;
  }).join(''):'<div class="feed-comment-empty">Ainda não há comentários. Seja o primeiro a interagir. 💬</div>';
  panel.innerHTML=`<div class="feed-comments-list">${comments}</div><div class="feed-comment-compose"><textarea id="feedCommentInput-${Number(feedId)}" maxlength="300" rows="2" placeholder="Escreva um comentário…"></textarea><div><small>Até 300 caracteres</small><button type="button" onclick="v6740SubmitComment(${Number(feedId)},this)">ENVIAR</button></div></div>`;
}
async function v6740SubmitComment(feedId,button){
  const input=byId(`feedCommentInput-${Number(feedId)}`);const text=String(input?.value||'').trim();
  if(!text){input?.focus();return}if(text.length>300){alert('O comentário pode ter no máximo 300 caracteres.');return}
  if(button)button.disabled=true;
  try{
    await cloudRpc('feed_comentario_criar_v6740',{p_token_militar:cloudSession.token,p_feed_id:Number(feedId),p_texto:text});
    v6743SendFeedPush('comentario',feedId);
    if(input)input.value='';await v6740LoadComments(feedId);await v6740RefreshCommentCount(feedId);
  }catch(e){console.error(e);alert('Não foi possível publicar o comentário agora.')}finally{if(button)button.disabled=false}
}
async function v6740DeleteOwnComment(commentId,feedId){
  if(!confirm('Excluir este comentário?'))return;
  try{
    await cloudRpc('feed_comentario_excluir_v6740',{p_token_militar:cloudSession.token,p_comentario_id:Number(commentId)});
    await v6740LoadComments(feedId);await v6740RefreshCommentCount(feedId);
  }catch(e){console.error(e);alert('Não foi possível excluir o comentário.')}
}
async function v6740AdminDeleteComment(commentId,feedId){
  if(!adminSessionToken){alert('Abra a Administração e valide o código administrativo para moderar comentários.');return}
  const motivo=prompt('Motivo da remoção do comentário:','Conteúdo inadequado/ofensivo');if(motivo===null)return;
  try{
    await cloudRpc('feed_comentario_admin_excluir_v6740',{p_token_admin:adminSessionToken,p_token_militar:cloudSession.token,p_comentario_id:Number(commentId),p_motivo:String(motivo||'').trim()||'Moderação administrativa'});
    await v6740LoadComments(feedId);await v6740RefreshCommentCount(feedId);
  }catch(e){console.error(e);alert('Não foi possível remover o comentário. Confirme sua sessão administrativa.')}
}
async function v6740RefreshCommentCount(feedId){
  try{
    const rows=await v55RpcAll('feed_social_listar_v6740',{p_token_militar:cloudSession.token,p_feed_ids:[Number(feedId)]});
    const r=Array.isArray(rows)?rows[0]:null;if(!r)return;v6740SocialMap.set(Number(feedId),r);
    const card=document.querySelector(`.sports-feed-card[data-feed-id="${Number(feedId)}"]`);const el=card?.querySelector('.feed-comment-count');
    if(el)el.textContent=v6740CommentCountLabel(r.comentarios_count);
  }catch(e){}
}
async function v6740LoadCommentNotifications(){
  if(!cloudSession?.token||!navigator.onLine)return [];
  try{return await v55RpcAll('feed_comentario_notificacoes_listar_v6740',{p_token_militar:cloudSession.token,p_limite:30})}catch(e){return []}
}
function v6753FeedVisibleRows(rows){
  const list=Array.isArray(rows)?rows:[];
  const cutoff=Date.now()-(Math.max(7,Number(v6753FeedDays)||7)*24*60*60*1000);
  return list.filter(r=>{
    const t=new Date(r?.data_atividade||'').getTime();
    return Number.isFinite(t)&&t>=cutoff;
  });
}
async function v6753FeedLoadMore(){
  v6753FeedDays+=7;
  const visible=v6753FeedVisibleRows(v6753FeedRows);
  await v6740LoadSocialSummary(visible);
  v6738RenderFeed(v6753FeedRows);
}
function v6738RenderFeed(rows){
  const box=byId('sportsFeed');if(!box)return;
  v6753FeedRows=Array.isArray(rows)?rows:[];
  if(!v6753FeedRows.length){box.innerHTML='<div class="sports-feed-state">Ainda não há atividades publicadas. A próxima atividade concluída inaugura o feed. 💪</div>';return}
  const visible=v6753FeedVisibleRows(v6753FeedRows);
  if(!visible.length){box.innerHTML='<div class="sports-feed-state">Nenhuma atividade publicada nos últimos '+v6753FeedDays+' dias.</div>';return}
  const cards=visible.map(r=>{
    const liked=r.curtido_por_mim===true,likes=Number(r.curtidas)||0;
    const social=v6740SocialFor(r.id),comments=Number(social.comentarios_count)||0,own=social.propria===true;
    const stats=[];
    if(Number(r.duracao)>0)stats.push(`${Number(r.duracao)} min`);
    if(r.categoria==='treino'&&Number(r.exercicios)>0)stats.push(`${Number(r.exercicios)} exercícios`);
    if(r.categoria==='treino'&&Number(r.series)>0)stats.push(`${Number(r.series)} séries`);
    if(r.categoria==='cardio'&&Number(r.distancia_km)>0)stats.push(`${Number(r.distancia_km).toLocaleString('pt-BR',{maximumFractionDigits:2})} km`);
    const planLower=String(r.plano||'').toLowerCase();
    const workoutType=String(r.workout_type||'').toLowerCase();
    // V67.59.1 — treino personalizado/estruturado tem prioridade sobre palavras no título.
    // Ex.: "Treino de Perna para corrida" continua sendo treino, não Corrida ao ar livre.
    const isStrength=workoutType==='custom'||workoutType==='structured'||r.categoria==='treino';
    const isSwim=!isStrength&&(workoutType==='swim'||planLower.includes('natação')||planLower.includes('natacao'));
    const isRun=!isStrength&&(workoutType==='run'||planLower.includes('corrida'));
    const rank=isSwim?'<span class="feed-rank neutral">🏊 Natação • não pontua no ranking</span>':(isRun?'<span class="feed-rank neutral">🏃 Corrida • não pontua no ranking</span>':(r.categoria==='core'?'<span class="feed-rank neutral">🛡️ Core • não pontua no ranking</span>':(r.ranking_valido===true?'<span class="feed-rank valid">🏆 Válido para o ranking</span>':'<span class="feed-rank neutral">Registro esportivo</span>')));
    const loc=r.localizacao?`<div class="feed-location">📍 ${v6738FeedEsc(r.localizacao)}</div>`:'';
    const status=social.status_texto?`<div class="feed-activity-status">“${v6738FeedEsc(social.status_texto)}”</div>`:'';
    const photo=v67381SafeProfilePhoto(r.foto_perfil);
    const avatar=photo?`<div class="feed-avatar has-photo v6757-profile-link" role="button" tabindex="0" onclick="v6757OpenProfileByFeedId(${Number(r.id)})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();v6757OpenProfileByFeedId(${Number(r.id)})}"><img src="${v6738FeedEsc(photo)}" alt="Foto de ${v6738FeedEsc(r.nome||'militar')}"></div>`:`<div class="feed-avatar v6757-profile-link" role="button" tabindex="0" onclick="v6757OpenProfileByFeedId(${Number(r.id)})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();v6757OpenProfileByFeedId(${Number(r.id)})}">${v6738FeedInitials(r.nome)}</div>`;
    const exact=v67381FeedDateTime(r.data_atividade);const relative=v6738FeedWhen(r.data_atividade);
    const statusBtn=own?`<button class="feed-status-edit" type="button" onclick="v6740EditStatus(${Number(r.id)})">✏️ <small>${social.status_texto?'Editar status':'Adicionar status'}</small></button>`:'';
    return `<article class="sports-feed-card" data-feed-id="${Number(r.id)}">
      <header class="feed-card-head">${avatar}<div class="feed-author"><b class="v6757-profile-name" role="button" tabindex="0" onclick="v6757OpenProfileByFeedId(${Number(r.id)})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();v6757OpenProfileByFeedId(${Number(r.id)})}">${v6738FeedEsc(r.graduacao||'BM')} ${v6738FeedEsc(r.nome||'Militar')}</b><span class="feed-relative-time">${v6738FeedEsc(relative)}</span><span class="feed-exact-time">${v6738FeedEsc(exact)}</span></div><div class="feed-type-icon">${v6738CategoryIcon(r.categoria)}</div></header>
      <div class="feed-card-body"><h4>${v6738FeedEsc(r.plano||'Atividade concluída')}</h4>${status}<div class="feed-stats">${stats.map(x=>`<span>${v6738FeedEsc(x)}</span>`).join('')}</div>${loc}<div class="feed-rank-row">${rank}</div><div class="feed-temp-photo" data-feed-photo="${Number(r.id)}" hidden></div></div>
      <footer class="feed-card-actions"><button class="feed-like ${liked?'liked':''}" type="button" onclick="v67597LikeAction(${Number(r.id)},this,event)" aria-expanded="false" aria-pressed="${liked?'true':'false'}"><span class="feed-like-heart">${liked?'💪':'🤍'}</span><b>${likes}</b><small>${likes===1?'apoio':'apoios'}</small></button><button class="feed-comments-toggle" type="button" onclick="v6740ToggleComments(${Number(r.id)},this)" aria-expanded="false"><span>💬</span><b class="feed-comment-count">${v6740CommentCountLabel(comments)}</b></button>${own?`<button class="feed-photo-add" data-feed-photo-btn="${Number(r.id)}" type="button" onclick="v6756ChooseFeedPhoto(${Number(r.id)})"><span>📷</span><small>Foto 24h</small></button>`:''}${statusBtn}</footer>
      <section class="feed-supporters-panel" hidden></section><section class="feed-comments-panel" hidden></section>
    </article>`;
  }).join('');
  const hiddenOlder=v6753FeedRows.some(r=>{
    const t=new Date(r?.data_atividade||'').getTime();
    const cutoff=Date.now()-(v6753FeedDays*24*60*60*1000);
    return Number.isFinite(t)&&t<cutoff;
  });
  const more=hiddenOlder?`<div class="v6753-feed-more"><small>Mostrando os últimos ${v6753FeedDays} dias</small><button type="button" onclick="v6753FeedLoadMore()">CARREGAR MAIS</button></div>`:`<div class="v6753-feed-more done"><small>Mostrando atividades dos últimos ${v6753FeedDays} dias</small></div>`;
  box.innerHTML=cards+more;
  if(typeof v6756LoadVisibleFeedPhotos==='function')setTimeout(v6756LoadVisibleFeedPhotos,80);
}
async function v6738LoadFeed(force=false){
  const box=byId('sportsFeed');if(!box)return;
  v6738RestoreFeedLocationPrefs();
  if(!cloudSession?.token){box.innerHTML='<div class="sports-feed-state">Entre com sua matrícula para visualizar o feed.</div>';return}
  if(!navigator.onLine){box.innerHTML='<div class="sports-feed-state">Conecte-se à internet para atualizar o feed.</div>';return}
  if(v6738FeedLoading)return;
  if(!force&&Date.now()-v6738FeedLastLoad<15000)return;
  v6738FeedLoading=true;
  if(!v6738FeedLastLoad)box.innerHTML='<div class="sports-feed-state">Carregando atividades…</div>';
  try{
    await v67382FlushFeedDeletes();
    await v6738FlushFeedPending();
    await v67381SyncFeedProfile();
    const rows=await v55RpcAll('feed_listar_v67381',{p_token_militar:cloudSession.token,p_limite:V6753_FEED_FETCH_LIMIT});
    v6753FeedRows=Array.isArray(rows)?rows:[];
    v6753FeedDays=7;
    const visible=v6753FeedVisibleRows(v6753FeedRows);
    await v6740LoadSocialSummary(visible);
    v6738FeedLastLoad=Date.now();v6738RenderFeed(v6753FeedRows);
    v67382LoadNotifications(false);
  }catch(e){
    console.warn('Falha ao carregar feed:',e);
    box.innerHTML='<div class="sports-feed-state error">Não foi possível carregar o feed agora. Verifique se o complemento SQL da v67.38.1 já foi instalado no Supabase.</div>';
  }finally{v6738FeedLoading=false}
}
function v67382NotificationWhen(iso){
  return v6738FeedWhen(iso);
}
function v67382RenderNotifications(rows){
  const badge=byId('feedNotificationBadge'),panel=byId('feedNotificationsPanel');
  const list=Array.isArray(rows)?rows:[];const unread=list.filter(x=>x.lida!==true).length;
  if(badge){badge.textContent=unread>99?'99+':String(unread);badge.hidden=unread<1}
  if(!panel)return;
  if(!list.length){panel.innerHTML='<div class="feed-notification-empty">Nenhuma notificação por enquanto.</div>';return}
  panel.innerHTML=list.slice(0,30).map(n=>{const comment=n.tipo==='comentario';const feedId=Number(n.feed_id??n.feedId??0)||0;return `<div class="feed-notification-item ${n.lida===true?'':'unread'}${feedId?' clickable':''}" ${feedId?`role="button" tabindex="0" onclick="v67595OpenNotificationFeed(${feedId})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();v67595OpenNotificationFeed(${feedId})}"`:''}><span class="feed-notification-icon">${comment?'💬':'💪'}</span><div><b>${v6738FeedEsc(n.ator_graduacao||'BM')} ${v6738FeedEsc(n.ator_nome||'Militar')}</b><p>${comment?'comentou na sua atividade.':'apoiou sua atividade.'}</p><small>${v6738FeedEsc(v67382NotificationWhen(n.criado_em))}</small></div></div>`}).join('');
}
async function v67382LoadNotifications(markRead=false){
  if(!cloudSession?.token||!navigator.onLine)return [];
  try{
    const likes=await v55RpcAll('feed_notificacoes_listar',{p_token_militar:cloudSession.token,p_limite:30});
    const comments=await v6740LoadCommentNotifications();
    const rows=[...(Array.isArray(likes)?likes.map(x=>({...x,tipo:'apoio'})):[]),...(Array.isArray(comments)?comments:[])].sort((a,b)=>new Date(b.criado_em)-new Date(a.criado_em));
    v67382RenderNotifications(rows);
    if(markRead&&rows.some(x=>x.lida!==true)){
      await cloudRpc('feed_notificacoes_marcar_lidas',{p_token_militar:cloudSession.token});
      try{await cloudRpc('feed_comentario_notificacoes_marcar_lidas_v6740',{p_token_militar:cloudSession.token})}catch(e){}
      rows.forEach(x=>x.lida=true);v67382RenderNotifications(rows);
    }
    return rows;
  }catch(e){console.warn('Falha ao carregar notificações do feed:',e);return []}
}
async function v67382ToggleNotifications(button){
  const panel=byId('feedNotificationsPanel');if(!panel)return;
  const opening=panel.hidden;
  panel.hidden=!opening;
  if(button)button.setAttribute('aria-expanded',opening?'true':'false');
  if(opening){panel.innerHTML='<div class="feed-notification-empty">Carregando notificações…</div>';await v67382LoadNotifications(true)}
}
async function v67382RefreshFeed(button){
  const btn=button||document.querySelector('.sports-feed-refresh');
  if(btn){btn.disabled=true;btn.classList.add('refreshing')}
  try{
    v6738FeedLastLoad=0;
    // V67.60.10: não republica atividades antigas ao atualizar o Feed.
    // A localização já publicada permanece imutável.
    await v67384ReconcileMyFeed();
    await v6738LoadFeed(true);
    await v67382LoadNotifications(false);
  }finally{
    if(btn){btn.disabled=false;btn.classList.remove('refreshing')}
  }
}
function v67382StartNotificationPolling(){
  if(v67382NotificationTimer)clearInterval(v67382NotificationTimer);
  v67382NotificationTimer=setInterval(()=>{
    if(document.querySelector('.view.active')?.id==='home'&&navigator.onLine&&cloudSession?.token)v67382LoadNotifications(false);
  },30000);
}
async function v6738ToggleLike(feedId,button){
  if(!cloudSession?.token||!navigator.onLine)return;
  if(button)button.disabled=true;
  try{
    const wasLiked=button?.getAttribute('aria-pressed')==='true';
    await cloudRpc('feed_alternar_curtida',{p_token_militar:cloudSession.token,p_feed_id:Number(feedId)});
    if(!wasLiked)v6743SendFeedPush('apoio',feedId);
    await v6738LoadFeed(true);
  }catch(e){console.warn('Falha ao apoiar atividade:',e);alert('Não foi possível registrar o apoio agora.')}finally{if(button)button.disabled=false}
}
window.addEventListener('online',()=>{if(cloudSession?.token){v67382FlushFeedDeletes();v6738FlushFeedPending();if(document.querySelector('.view.active')?.id==='home'){v6738LoadFeed(true);v67382LoadNotifications(false)}}});
v67382StartNotificationPolling();




/* ===== V67.56.2 — FOTO TEMPORÁRIA DO TREINO (24H) + EXCLUSÃO MANUAL ===== */
const V6756_FEED_PHOTO_FUNCTION='/functions/v1/feed-fotos-24h';
const V6756_MAX_IMAGE_DIMENSION=1280;
const V6756_WEBP_QUALITY=.78;
const v6756FeedPhotoState=new Map();
let v6756PhotoInput=null;
let v6756PhotoFeedId=null;

async function v6756Edge(body){
  const r=await cloudApi(V6756_FEED_PHOTO_FUNCTION,{method:'POST',body:JSON.stringify(body)});
  const data=await r.json().catch(()=>null);
  if(!r.ok)throw new Error((data&&(data.erro||data.message))||'Falha no serviço de fotos');
  return data||{};
}
function v6756PhotoInputEnsure(){
  if(v6756PhotoInput)return v6756PhotoInput;
  const input=document.createElement('input');
  input.type='file';input.accept='image/*';input.hidden=true;input.id='v6756FeedPhotoInput';
  input.addEventListener('change',async()=>{
    const file=input.files?.[0]||null,feedId=v6756PhotoFeedId;
    input.value='';
    if(!file||!feedId)return;
    await v6756UploadFeedPhoto(feedId,file);
  });
  document.body.appendChild(input);v6756PhotoInput=input;return input;
}
function v6756ChooseFeedPhoto(feedId){
  if(!cloudSession?.token){alert('Entre com sua matrícula para adicionar a foto.');return}
  if(!navigator.onLine){alert('Conecte-se à internet para enviar a foto.');return}
  const st=v6756FeedPhotoState.get(Number(feedId));
  if(st?.disponivel){alert('Esta atividade já possui uma foto temporária ativa. Ela poderá receber uma nova foto após expirar.');return}
  v6756PhotoFeedId=Number(feedId);v6756PhotoInputEnsure().click();
}
async function v6756ImageToWebp(file){
  if(!file||!String(file.type||'').startsWith('image/'))throw new Error('Selecione uma imagem válida.');
  const bitmap=await createImageBitmap(file);
  const scale=Math.min(1,V6756_MAX_IMAGE_DIMENSION/Math.max(bitmap.width,bitmap.height));
  const width=Math.max(1,Math.round(bitmap.width*scale)),height=Math.max(1,Math.round(bitmap.height*scale));
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx)throw new Error('Não foi possível preparar a imagem.');
  ctx.drawImage(bitmap,0,0,width,height);if(typeof bitmap.close==='function')bitmap.close();
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',V6756_WEBP_QUALITY));
  if(!blob)throw new Error('Não foi possível converter a foto.');
  if(blob.size>5*1024*1024)throw new Error('A foto ficou maior que 5 MB. Escolha outra imagem.');
  return blob;
}
function v6756SetPhotoButton(feedId,state){
  const btn=document.querySelector(`.feed-photo-add[data-feed-photo-btn="${Number(feedId)}"]`);
  if(!btn)return;
  if(state==='loading'){btn.disabled=true;btn.innerHTML='<span>⏳</span><small>Enviando…</small>';return}
  if(state==='active'){btn.disabled=false;btn.classList.add('active');btn.onclick=()=>v67562DeleteFeedPhoto(Number(feedId));btn.innerHTML='<span>🗑️</span><small>Excluir foto</small>';return}
  btn.disabled=false;btn.classList.remove('active');btn.onclick=()=>v6756ChooseFeedPhoto(Number(feedId));btn.innerHTML='<span>📷</span><small>Foto 24h</small>';
}
async function v6756UploadFeedPhoto(feedId,file){
  const id=Number(feedId);v6756SetPhotoButton(id,'loading');
  try{
    const blob=await v6756ImageToWebp(file);
    const prep=await v6756Edge({acao:'upload',token_militar:cloudSession.token,feed_id:id});
    if(!prep?.signed_url||!prep?.storage_path)throw new Error('O servidor não preparou o envio da foto.');
    const upload=await fetch(prep.signed_url,{method:'PUT',headers:{'Content-Type':'image/webp','x-upsert':'false'},body:blob});
    if(!upload.ok){const detail=await upload.text().catch(()=>'');throw new Error(detail||'Falha ao enviar a imagem para o armazenamento.');}
    const reg=await v6756Edge({acao:'registrar',token_militar:cloudSession.token,feed_id:id,storage_path:prep.storage_path});
    if(!reg?.sucesso)throw new Error('A foto foi enviada, mas não pôde ser registrada.');
    v6756FeedPhotoState.delete(id);
    await v6756LoadFeedPhoto(id,true);
  }catch(e){
    console.error('Foto temporária do feed:',e);v6756SetPhotoButton(id,'idle');alert(e?.message||'Não foi possível enviar a foto agora.');
  }
}
async function v67562DeleteFeedPhoto(feedId){
  const id=Number(feedId);
  if(!cloudSession?.token||!Number.isFinite(id))return;
  if(!navigator.onLine){alert('Conecte-se à internet para excluir a foto.');return}
  if(!confirm('Excluir esta foto agora? A atividade, os apoios e os comentários serão mantidos.'))return;
  const btn=document.querySelector(`.feed-photo-add[data-feed-photo-btn="${id}"]`);
  if(btn){btn.disabled=true;btn.innerHTML='<span>⏳</span><small>Excluindo…</small>'}
  try{
    const data=await v6756Edge({acao:'excluir',token_militar:cloudSession.token,feed_id:id});
    if(!data?.sucesso)throw new Error('Não foi possível excluir a foto.');
    v6756FeedPhotoState.delete(id);
    const slot=document.querySelector(`.feed-temp-photo[data-feed-photo="${id}"]`);
    if(slot){slot.hidden=true;slot.innerHTML=''}
    v6756SetPhotoButton(id,'idle');
  }catch(e){
    console.error('Exclusão da foto temporária:',e);
    v6756SetPhotoButton(id,'active');
    alert(e?.message||'Não foi possível excluir a foto agora.');
  }
}
function v6756RenderPhoto(feedId,data){
  const id=Number(feedId),slot=document.querySelector(`.feed-temp-photo[data-feed-photo="${id}"]`);
  if(!slot)return;
  const available=data?.disponivel===true&&/^https:\/\//i.test(String(data?.url||''));
  v6756FeedPhotoState.set(id,{disponivel:available,expira_em:data?.expira_em||null});
  if(!available){slot.hidden=true;slot.innerHTML='';v6756SetPhotoButton(id,'idle');return}
  const expiry=data?.expira_em?new Date(data.expira_em):null;
  let label='Foto temporária • até 24h';
  if(expiry&&Number.isFinite(expiry.getTime()))label=`Foto temporária • expira ${expiry.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}`;
  slot.hidden=false;
  slot.innerHTML=`<img src="${v6738FeedEsc(data.url)}" alt="Foto temporária da atividade" loading="lazy"><small>⏱️ ${v6738FeedEsc(label)}</small>`;
  v6756SetPhotoButton(id,'active');
}
async function v6756LoadFeedPhoto(feedId,force=false){
  const id=Number(feedId);if(!Number.isFinite(id)||!cloudSession?.token||!navigator.onLine)return;
  if(!force&&v6756FeedPhotoState.has(id)){const st=v6756FeedPhotoState.get(id);if(st?.disponivel)v6756SetPhotoButton(id,'active');return}
  try{const data=await v6756Edge({acao:'view',token_militar:cloudSession.token,feed_id:id});v6756RenderPhoto(id,data)}
  catch(e){console.warn('Foto 24h indisponível no feed',id,e);}
}
function v6756LoadVisibleFeedPhotos(){
  // V67.56.1 — o cache de fotos pertence à renderização/sessão atual.
  // Ao trocar de matrícula sem recarregar a página, força nova consulta ao backend
  // para que a foto 24h também apareça para os outros militares.
  v6756FeedPhotoState.clear();
  const ids=[...document.querySelectorAll('.sports-feed-card[data-feed-id]')].map(x=>Number(x.dataset.feedId)).filter(Number.isFinite);
  ids.forEach((id,i)=>setTimeout(()=>v6756LoadFeedPhoto(id,true),Math.min(i*45,450)));
}


/* ===== V67.43.0 — WEB PUSH DO FEED ===== */
const V6743_VAPID_PUBLIC_KEY='BKnP-jhPxGf7t3ancI0hjwUeknWKggd1SWaiSoeQ-mDd3vsWd0QVdQlKO6kloxTN5dhB5IrazO1D6ZMPr97opwU';
const V6743_PUSH_DEVICE_KEY='t2_push_device_v6743';
function v6743PushSupported(){return 'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window}
function v6743PushDeviceId(){
  let id=localStorage.getItem(V6743_PUSH_DEVICE_KEY)||'';
  if(!id){id=(crypto?.randomUUID?.()||('dev-'+Date.now()+'-'+Math.random().toString(36).slice(2)));localStorage.setItem(V6743_PUSH_DEVICE_KEY,id)}
  return id;
}
function v6743Base64ToBytes(value){
  const pad='='.repeat((4-value.length%4)%4),b64=(value+pad).replace(/-/g,'+').replace(/_/g,'/');
  const raw=atob(b64);return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)));
}
function v67593BytesToBase64Url(value){
  if(!value)return '';
  const bytes=new Uint8Array(value),chunk=0x8000;let raw='';
  for(let i=0;i<bytes.length;i+=chunk)raw+=String.fromCharCode(...bytes.subarray(i,i+chunk));
  return btoa(raw).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function v67593SubscriptionUsesCurrentVapid(sub){
  try{
    const key=sub?.options?.applicationServerKey;
    return !!key&&v67593BytesToBase64Url(key)===V6743_VAPID_PUBLIC_KEY;
  }catch(e){return false}
}
async function v67593MigratePushSubscription(reg,sub){
  if(!sub||v67593SubscriptionUsesCurrentVapid(sub))return sub;
  const oldEndpoint=sub.endpoint;
  try{
    if(cloudSession?.token&&navigator.onLine){
      await cloudRpc('push_subscription_desativar_v6743',{p_token_militar:cloudSession.token,p_endpoint:oldEndpoint});
    }
  }catch(e){console.warn('Não foi possível desativar a inscrição PUSH antiga no banco:',e)}
  try{await sub.unsubscribe()}catch(e){console.warn('Não foi possível cancelar a inscrição PUSH antiga:',e)}
  const fresh=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:v6743Base64ToBytes(V6743_VAPID_PUBLIC_KEY)});
  await v6743SaveSubscription(fresh);
  return fresh;
}
function v6743SetPushUi(text,active=false,busy=false){
  const st=byId('pushNotificationStatus'),btn=byId('pushNotificationButton');
  if(st)st.textContent=text;
  if(btn){btn.disabled=busy;btn.classList.toggle('active',active);btn.textContent=busy?'AGUARDE…':(active?'DESATIVAR':'ATIVAR')}
}
async function v6743Registration(){
  let reg=await navigator.serviceWorker.getRegistration();
  if(!reg)reg=await navigator.serviceWorker.register('sw-v67-68-26.js', {updateViaCache:'none'});
  await navigator.serviceWorker.ready;return reg;
}
async function v6743CurrentSubscription(){
  if(!v6743PushSupported())return null;
  const reg=await v6743Registration();return await reg.pushManager.getSubscription();
}
async function v6743SaveSubscription(sub){
  if(!cloudSession?.token||!sub)return false;
  const json=sub.toJSON(),keys=json.keys||{};
  const row=await cloudRpc('push_subscription_salvar_v6743',{
    p_token_militar:cloudSession.token,p_endpoint:sub.endpoint,p_p256dh:keys.p256dh||'',p_auth:keys.auth||'',
    p_device_id:v6743PushDeviceId(),p_user_agent:String(navigator.userAgent||'').slice(0,500)
  });
  return row?.salvo!==false;
}
async function v6743RefreshPushStatus(){
  if(!v6743PushSupported()){v6743SetPushUi('Este navegador não oferece suporte a notificações Push.');return false}
  if(Notification.permission==='denied'){v6743SetPushUi('Permissão bloqueada no navegador. Libere as notificações nas configurações do site.');return false}
  try{
    const reg=await v6743Registration();
    let sub=await reg.pushManager.getSubscription();
    if(!sub){v6743SetPushUi(Notification.permission==='granted'?'Notificações permitidas, mas este aparelho ainda não está cadastrado.':'Notificações ainda não ativadas neste aparelho.');return false}
    if(Notification.permission==='granted'&&!v67593SubscriptionUsesCurrentVapid(sub)){
      v6743SetPushUi('Atualizando notificações deste aparelho…',false,true);
      sub=await v67593MigratePushSubscription(reg,sub);
    }
    if(cloudSession?.token&&navigator.onLine){
      try{await cloudRpc('push_subscription_status_v6743',{p_token_militar:cloudSession.token,p_endpoint:sub.endpoint})}catch(e){}
    }
    v6743SetPushUi('Ativas neste aparelho.',true);return true;
  }catch(e){console.warn('Status PUSH:',e);v6743SetPushUi('Não foi possível verificar o Push agora.');return false}
}
async function v6743EnablePush(){
  if(!cloudSession?.token){alert('Entre com sua matrícula antes de ativar as notificações.');return false}
  if(!navigator.onLine){alert('Conecte-se à internet para ativar as notificações.');return false}
  if(!v6743PushSupported()){alert('Este navegador não oferece suporte a notificações Push.');return false}
  const permission=await Notification.requestPermission();
  if(permission!=='granted'){v6743SetPushUi(permission==='denied'?'Permissão bloqueada no navegador.':'Permissão de notificações não concedida.');return false}
  const reg=await v6743Registration();
  let sub=await reg.pushManager.getSubscription();
  if(sub&&!v67593SubscriptionUsesCurrentVapid(sub))sub=await v67593MigratePushSubscription(reg,sub);
  if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:v6743Base64ToBytes(V6743_VAPID_PUBLIC_KEY)});
  await v6743SaveSubscription(sub);v6743SetPushUi('Ativas neste aparelho.',true);return true;
}
async function v6743DisablePush(silent=false){
  try{
    const sub=await v6743CurrentSubscription();
    if(sub&&cloudSession?.token&&navigator.onLine){
      try{await cloudRpc('push_subscription_desativar_v6743',{p_token_militar:cloudSession.token,p_endpoint:sub.endpoint})}catch(e){if(!silent)throw e}
    }
    if(sub)await sub.unsubscribe();
    v6743SetPushUi('Notificações desativadas neste aparelho.');return true;
  }catch(e){console.error('Desativar PUSH:',e);if(!silent)alert('Não foi possível desativar as notificações agora.');return false}
}
async function v6743TogglePush(button){
  if(button)button.disabled=true;
  try{const sub=await v6743CurrentSubscription();if(sub)await v6743DisablePush();else await v6743EnablePush()}
  catch(e){console.error('PUSH:',e);alert('Não foi possível configurar as notificações neste aparelho.');await v6743RefreshPushStatus()}
  finally{if(button)button.disabled=false}
}
async function v6743SyncExistingPush(){
  if(!cloudSession?.token||!navigator.onLine||!v6743PushSupported()||Notification.permission!=='granted'){v6743RefreshPushStatus();return}
  try{
    const reg=await v6743Registration();let sub=await reg.pushManager.getSubscription();
    if(sub&&!v67593SubscriptionUsesCurrentVapid(sub))sub=await v67593MigratePushSubscription(reg,sub);
    if(sub)await v6743SaveSubscription(sub);
  }catch(e){console.warn('Sincronização PUSH:',e)}
  v6743RefreshPushStatus();
}
async function v6743SendFeedPush(tipo,feedId){
  if(!cloudSession?.token||!navigator.onLine)return;
  const c=cloudCfg(),key=c.publishableKey||c.anonKey;if(!c.supabaseUrl||!key)return;
  try{
    const r=await fetch(c.supabaseUrl.replace(/\/$/,'')+'/functions/v1/enviar-push-2cia',{
      method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},
      body:JSON.stringify({token_militar:cloudSession.token,feed_id:Number(feedId),tipo:String(tipo)})
    });
    if(!r.ok){const x=await r.json().catch(()=>null);console.warn('Edge PUSH não confirmou:',x||r.status)}
  }catch(e){console.warn('Falha ao disparar PUSH do feed:',e)}
}
window.addEventListener('load',()=>setTimeout(v6743RefreshPushStatus,1500));

/* ===== V41 — ACESSO INDIVIDUAL POR MATRÍCULA / SUPABASE ===== */
const CLOUD_SESSION_KEY='t2_matricula_session_v41';
const CLOUD_TRACKED_KEYS=['t2_history','t2_workouts','t2_active_plan','t2_last','t2_custom_workouts','t2_taf_records','t2_taf_profile','t2_profile_photo_v6717'];
const CLOUD_LOCAL_OWNER_KEY='t2_local_owner_v52';
const CLOUD_CLEAN_MIGRATION_PREFIX='t2_clean_migration_v53_';
let cloudSession=null, cloudApplying=false, cloudSyncTimer=null;
let cloudPushPromise=null, cloudRetryTimer=null, cloudRetryCount=0;
let v6719StorageAlertShown=false;
const _t2SetItem=Storage.prototype.setItem;
const _t2RemoveItem=Storage.prototype.removeItem;

function v6719IsQuotaError(e){
  return !!e && (e.name==='QuotaExceededError' || e.name==='NS_ERROR_DOM_QUOTA_REACHED' || e.code===22 || e.code===1014);
}
function v6719StorageWarning(){
  if(v6719StorageAlertShown)return;
  v6719StorageAlertShown=true;
  setTimeout(()=>alert('O armazenamento deste navegador está quase cheio. Seus dados já sincronizados continuam na nuvem. Evite limpar os dados do site e conecte-se à internet para concluir a sincronização.'),0);
}
Storage.prototype.setItem=function(k,v){
  try{
    _t2SetItem.call(this,k,v);
  }catch(e){
    if(this===localStorage && v6719IsQuotaError(e))v6719StorageWarning();
    throw e;
  }
  if(this===localStorage && CLOUD_TRACKED_KEYS.includes(k) && !cloudApplying) cloudScheduleSync();
};
Storage.prototype.removeItem=function(k){
  _t2RemoveItem.call(this,k);
  if(this===localStorage && CLOUD_TRACKED_KEYS.includes(k) && !cloudApplying) cloudScheduleSync();
};


function cloudCurrentOwner(){ return String(localStorage.getItem(CLOUD_LOCAL_OWNER_KEY)||''); }
function cloudSetOwner(matricula){
  const m=cloudNormalize(matricula);
  if(m) _t2SetItem.call(localStorage,CLOUD_LOCAL_OWNER_KEY,m);
  else _t2RemoveItem.call(localStorage,CLOUD_LOCAL_OWNER_KEY);
}
function cloudClearTrackedLocal(){
  cloudApplying=true;
  try{
    CLOUD_TRACKED_KEYS.forEach(k=>_t2RemoveItem.call(localStorage,k));
    try{sessionStorage.removeItem(NAV_STATE_KEY)}catch(e){}
    try{_t2RemoveItem.call(localStorage,LEGACY_NAV_STATE_KEY)}catch(e){}
  }finally{cloudApplying=false}
  try{updateLast()}catch(e){}
}
function cloudEnsureOwner(matricula,clearOnMismatch=true){
  const next=cloudNormalize(matricula);
  const current=cloudNormalize(cloudCurrentOwner());
  if(!next)return false;
  if(current!==next){
    if(clearOnMismatch)cloudClearTrackedLocal();
    cloudSetOwner(next);
    return false;
  }
  return true;
}

function cloudMigrationKey(matricula){
  return CLOUD_CLEAN_MIGRATION_PREFIX+cloudNormalize(matricula);
}
function cloudNeedsCleanMigration(matricula){
  const m=cloudNormalize(matricula);
  if(!m)return false;
  return localStorage.getItem(cloudMigrationKey(m))!=='1';
}
function cloudMarkCleanMigration(matricula){
  const m=cloudNormalize(matricula);
  if(m)_t2SetItem.call(localStorage,cloudMigrationKey(m),'1');
}

function cloudCfg(){ return window.T2_CLOUD_CONFIG||{}; }
function cloudConfigured(){
  const c=cloudCfg();
  return !!(c.enabled && c.supabaseUrl && (c.publishableKey || c.anonKey));
}
async function cloudApi(path,options={}){
  const c=cloudCfg();
  const key=c.publishableKey || c.anonKey;
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),12000);
  try{
    return await fetch(c.supabaseUrl.replace(/\/$/,'')+path,{
      ...options,
      signal:controller.signal,
      headers:Object.assign({
        apikey:key,
        Authorization:'Bearer '+key,
        'Content-Type':'application/json'
      },options.headers||{})
    });
  }finally{
    clearTimeout(timeout);
  }
}
async function cloudRpc(fn,payload={}){
  const r=await cloudApi('/rest/v1/rpc/'+fn,{method:'POST',body:JSON.stringify(payload)});
  const data=await r.json().catch(()=>null);
  if(!r.ok) throw new Error((data&&(data.message||data.details||data.hint))||'Falha no servidor');
  return Array.isArray(data)?data[0]:data;
}
function cloudNormalize(v){ return String(v||'').trim().replace(/\s+/g,'').toUpperCase(); }
function cloudMask(v){ const s=String(v||''); return s.length<=4?s:'••••'+s.slice(-4); }
function cloudMsg(t,type=''){ const e=document.getElementById('authMessage'); if(e){e.textContent=t||'';e.className='auth-message '+type;} }
function cloudShowGate(){ document.body.classList.add('auth-locked'); document.getElementById('authGate')?.classList.add('show'); }
function cloudHideGate(afterLogin=false){
  document.body.classList.remove('auth-locked');
  document.getElementById('authGate')?.classList.remove('show');
  v6758ShowMotivation(afterLogin===true);
  cloudRenderUser();
  setTimeout(restoreNavigationState,0);
  try{serviceDirectAfterAuth()}catch(e){}
}
function cloudSaveSession(s){
  cloudSession=s||null;
  if(s) _t2SetItem.call(localStorage,CLOUD_SESSION_KEY,JSON.stringify(s));
  else _t2RemoveItem.call(localStorage,CLOUD_SESSION_KEY);
  cloudRenderUser();
}
function cloudLoadSession(){
  try{ const s=JSON.parse(localStorage.getItem(CLOUD_SESSION_KEY)||'null'); cloudSession=s?.token?s:null; }
  catch(e){ cloudSession=null; }
}
function cloudRenderUser(){
  const bar=document.getElementById('cloudUserBar');
  if(!bar)return;
  if(!cloudSession?.token){bar.style.display='none';return;}
  bar.style.display='flex';
  document.getElementById('cloudUserName').textContent=cloudSession.nome||'Militar';
  if(typeof v6748RenderDashboard==='function')v6748RenderDashboard();
  document.getElementById('cloudUserGraduacao').textContent=cloudSession.graduacao||'Militar';
  document.getElementById('cloudUserMatricula').textContent='Matrícula '+cloudMask(cloudSession.matricula);
  document.getElementById('cloudUserStatus').textContent=navigator.onLine?'Sincronizado':'Offline';
  v6718RenderHomeProfilePhoto();
}
function cloudSnapshot(){
  let active=null;
  try{active=JSON.parse(localStorage.getItem('t2_active_plan')||'null')}catch(e){}
  return {
    ownerMatricula: cloudSession?.matricula || cloudCurrentOwner() || '',
    history:history(),
    workouts:workoutHistory(),
    customWorkouts:typeof getCustomWorkouts==='function'?getCustomWorkouts():[],
    tafRecords:typeof tafGetRecords==='function'?tafGetRecords():[],
    tafProfile:typeof tafGetProfile==='function'?tafGetProfile():{},
    profilePhoto:localStorage.getItem('t2_profile_photo_v6717')||'',
    activePlan:active,
    last:localStorage.getItem('t2_last')||'',
    savedAt:new Date().toISOString()
  };
}
function cloudNormalizeRemoteData(v){
  if(!v)return {};
  if(typeof v==='string'){
    try{return JSON.parse(v)||{}}catch(e){return {}}
  }
  return (typeof v==='object')?v:{};
}
function cloudDataCounts(d={}){
  return {
    history:Array.isArray(d.history)?d.history.length:0,
    workouts:Array.isArray(d.workouts)?d.workouts.length:0,
    custom:Array.isArray(d.customWorkouts)?d.customWorkouts.length:0
  };
}
function cloudMergeArray(a,b){
  const out=[],seen=new Set();
  [...(Array.isArray(a)?a:[]),...(Array.isArray(b)?b:[])].forEach(x=>{
    let k;
    try{k=x?.id||x?.workoutId||x?.sessionId||[x?.date,x?.finishedAt,x?.exercise,x?.exerciseName,x?.weight,x?.reps,x?.set].join('|')||JSON.stringify(x)}
    catch(e){k=JSON.stringify(x)}
    if(!seen.has(k)){seen.add(k);out.push(x)}
  });
  return out;
}
function cloudMergeCustom(a,b){
  const m=new Map();
  [...(Array.isArray(b)?b:[]),...(Array.isArray(a)?a:[])].forEach(x=>{const k=x?.id||x?.name;if(k)m.set(k,x)});
  return [...m.values()];
}
function cloudMerge(local,remote={}){
  return {
    history:cloudMergeArray(local.history,remote.history),
    workouts:cloudMergeArray(local.workouts,remote.workouts),
    customWorkouts:cloudMergeCustom(local.customWorkouts,remote.customWorkouts),
    tafRecords:cloudMergeArray(local.tafRecords,remote.tafRecords),
    tafProfile:Object.assign({},remote.tafProfile||{},local.tafProfile||{}),
    profilePhoto:local.profilePhoto||remote.profilePhoto||'',
    activePlan:local.activePlan||null,
    last:local.last||remote.last||'',
    savedAt:new Date().toISOString()
  };
}
function cloudApply(d){
  if(cloudSession?.matricula) cloudSetOwner(cloudSession.matricula);
  cloudApplying=true;
  try{
    _t2SetItem.call(localStorage,'t2_history',JSON.stringify(d.history||[]));
    _t2SetItem.call(localStorage,'t2_workouts',JSON.stringify(d.workouts||[]));
    _t2SetItem.call(localStorage,'t2_custom_workouts',JSON.stringify(d.customWorkouts||[]));
    _t2SetItem.call(localStorage,'t2_taf_records',JSON.stringify(d.tafRecords||[]));
    _t2SetItem.call(localStorage,'t2_taf_profile',JSON.stringify(d.tafProfile||{}));
    if(d.profilePhoto)_t2SetItem.call(localStorage,'t2_profile_photo_v6717',d.profilePhoto); else _t2RemoveItem.call(localStorage,'t2_profile_photo_v6717');
    if(d.activePlan)_t2SetItem.call(localStorage,'t2_active_plan',JSON.stringify(d.activePlan)); else _t2RemoveItem.call(localStorage,'t2_active_plan');
    if(d.last)_t2SetItem.call(localStorage,'t2_last',d.last); else _t2RemoveItem.call(localStorage,'t2_last');
  }finally{cloudApplying=false}
  try{reconcileWorkoutHistory();migrateWorkoutQuality();updateLast()}catch(e){}
}
async function cloudLogin(){
  const matricula=cloudNormalize(document.getElementById('loginMatricula')?.value);
  if(!matricula){cloudMsg('Informe sua matrícula.','error');return;}
  cloudMsg('Verificando matrícula…');
  try{
    const row=await cloudRpc('entrar_por_matricula',{p_matricula:matricula});
    if(!row?.autorizado||!row?.token){cloudMsg('Matrícula não autorizada. Procure o administrador.','error');return;}
    const nextSession={token:row.token,matricula:cloudNormalize(row.matricula||matricula),nome:row.nome||'Militar',graduacao:row.graduacao||''};
    cloudEnsureOwner(nextSession.matricula,true);
    cloudSaveSession(nextSession);
    await cloudInitialSync(true);
    v6738FlushFeedPending();
    await adminRefreshVisibility();
    cloudMsg('');
    cloudHideGate(true);
    setTimeout(v6743SyncExistingPush,250);
  }catch(e){
    console.error(e);
    if(e&&e.name==='AbortError')cloudMsg('O Supabase demorou para responder. Tente novamente.','error');
    else cloudMsg('Não foi possível acessar. Verifique sua conexão e tente novamente.','error');
  }
}
async function cloudValidate(){
  if(!cloudSession?.token)return false;
  if(!navigator.onLine)return null;
  try{
    const row=await cloudRpc('validar_sessao_militar',{p_token:cloudSession.token});
    if(row?.valido===false)return false;
    if(!row || row?.valido!==true)return null;
    cloudSession.nome=row.nome||cloudSession.nome;
    cloudSession.graduacao=row.graduacao||cloudSession.graduacao;
    cloudSession.matricula=row.matricula||cloudSession.matricula;
    cloudSaveSession(cloudSession);
    return true;
  }catch(e){
    console.warn('Falha temporária ao validar sessão:',e);
    return null;
  }
}
async function cloudInitialSync(freshLogin=false){
  if(!navigator.onLine||!cloudSession?.token)return false;
  const status=document.getElementById('cloudUserStatus');
  const sameOwner=cloudEnsureOwner(cloudSession.matricula,true);
  try{
    if(status)status.textContent='Sincronizando…';
    const remoteRow=await cloudRpc('ler_dados_militar',{p_token:cloudSession.token});
    if(!remoteRow?.autorizado)throw new Error('Sessão inválida');
    const remote=cloudNormalizeRemoteData(remoteRow.dados);
    let finalData;
    if(freshLogin||!sameOwner){
      finalData={
        ownerMatricula:cloudSession.matricula,
        history:Array.isArray(remote.history)?remote.history:[],
        workouts:Array.isArray(remote.workouts)?remote.workouts:[],
        customWorkouts:Array.isArray(remote.customWorkouts)?remote.customWorkouts:[],
        tafRecords:Array.isArray(remote.tafRecords)?remote.tafRecords:[],
        tafProfile:(remote.tafProfile&&typeof remote.tafProfile==='object')?remote.tafProfile:{},
        profilePhoto:typeof remote.profilePhoto==='string'?remote.profilePhoto:'',
        activePlan:null,
        last:remote.last||'',
        savedAt:remote.savedAt||new Date().toISOString()
      };
    }else{
      finalData=cloudMerge(cloudSnapshot(),remote);
      finalData.ownerMatricula=cloudSession.matricula;
    }
    cloudApply(finalData);
    if(freshLogin||!sameOwner) cloudMarkCleanMigration(cloudSession.matricula);
    const saved=await cloudRpc('salvar_dados_militar',{p_token:cloudSession.token,p_dados:finalData});
    if(saved?.salvo!==true)throw new Error('Servidor não confirmou o salvamento');
    if(status)status.textContent='Sincronizado';
    const active=document.querySelector('.view.active')?.id;
    if(active==='history')renderHistory();
    if(active==='progress')renderProgress();
    updateLast();
    return true;
  }catch(e){
    console.warn('Falha de sincronização inicial:',e);
    if(status)status.textContent='Pendente';
    return false;
  }
}
function cloudScheduleSync(){
  if(!cloudConfigured()||!cloudSession?.token||cloudApplying||!navigator.onLine)return;
  if(cloudNormalize(cloudCurrentOwner())!==cloudNormalize(cloudSession.matricula))return;
  clearTimeout(cloudSyncTimer);
  const s=document.getElementById('cloudUserStatus');if(s)s.textContent='Salvando…';
  cloudSyncTimer=setTimeout(cloudPushNow,1200);
}
function v6719ScheduleCloudRetry(){
  if(!cloudSession?.token||!navigator.onLine)return;
  clearTimeout(cloudRetryTimer);
  const waits=[5000,15000,45000,90000];
  const wait=waits[Math.min(cloudRetryCount,waits.length-1)];
  cloudRetryCount=Math.min(cloudRetryCount+1,waits.length-1);
  cloudRetryTimer=setTimeout(()=>{cloudRetryTimer=null;cloudPushNow();},wait);
}
async function v6719CloudPushInner(){
  if(!cloudSession?.token||!navigator.onLine)return false;
  if(cloudNormalize(cloudCurrentOwner())!==cloudNormalize(cloudSession.matricula))return false;
  const status=document.getElementById('cloudUserStatus');
  try{
    if(status)status.textContent='Salvando…';
    const snapshot=cloudSnapshot();
    let result=null,lastError=null;
    for(let attempt=0;attempt<2;attempt++){
      try{
        result=await cloudRpc('salvar_dados_militar',{p_token:cloudSession.token,p_dados:snapshot});
        if(result?.salvo===true)break;
      }catch(e){
        lastError=e;
        if(attempt===0)await new Promise(r=>setTimeout(r,900));
      }
    }
    if(result?.salvo===true){
      clearTimeout(cloudRetryTimer);cloudRetryTimer=null;cloudRetryCount=0;
      if(status)status.textContent='Sincronizado';
      return true;
    }
    if(lastError)throw lastError;
    const validity=await cloudValidate();
    if(validity===false){
      cloudSaveSession(null);
      cloudShowGate();
      cloudMsg('Matrícula inativa ou acesso encerrado. Procure o administrador.','error');
      return false;
    }
    if(status)status.textContent='Pendente';
    v6719ScheduleCloudRetry();
    return false;
  }catch(e){
    console.warn('Falha temporária de sincronização:',e);
    if(status)status.textContent='Pendente';
    v6719ScheduleCloudRetry();
    return false;
  }
}
async function cloudPushNow(){
  if(cloudPushPromise)return cloudPushPromise;
  cloudPushPromise=v6719CloudPushInner().finally(()=>{cloudPushPromise=null});
  return cloudPushPromise;
}
async function cloudLogout(){
  if(!confirm('Sair deste acesso neste aparelho?'))return;
  v67621StopMusic(true);
  try{if(cloudSession?.token&&navigator.onLine)await cloudPushNow();}catch(e){}
  try{await v6743DisablePush(true)}catch(e){}
  try{if(cloudSession?.token&&navigator.onLine)await cloudRpc('encerrar_sessao_militar',{p_token:cloudSession.token});}catch(e){}
  try{adminSessionToken='';sessionStorage.removeItem(ADMIN_SESSION_KEY);}catch(e){}
  adminSetEntryVisible(false);
  clearNavigationState();
  cloudClearTrackedLocal();
  cloudSetOwner('');
  cloudSaveSession(null);
  cloudMsg('');
  cloudShowGate();
}
async function cloudInit(){
  cloudLoadSession();
  if(!cloudConfigured()){cloudShowGate();cloudMsg('Configuração da nuvem ausente.','error');return;}

  if(cloudSession?.token){
    const owner=cloudNormalize(cloudCurrentOwner());
    const currentMat=cloudNormalize(cloudSession.matricula);

    // V53: uma única vez por matrícula neste aparelho, descarta qualquer
    // dado local herdado das versões anteriores e restaura da nuvem.
    // Isso corrige aparelhos que já estavam contaminados antes da V52.
    const forceClean=cloudNeedsCleanMigration(currentMat);
    const needsFreshRestore=forceClean || owner!==currentMat;

    if(needsFreshRestore){
      cloudClearTrackedLocal();
      cloudSetOwner(currentMat);
    }

    if(!navigator.onLine){
      adminSetEntryVisible(false);
      cloudHideGate();
      const status=document.getElementById('cloudUserStatus');
      if(status && forceClean) status.textContent='Aguardando internet';
      return;
    }

    const validity=await cloudValidate();

    if(validity===true){
      await cloudInitialSync(needsFreshRestore);
      await adminRefreshVisibility();
      cloudHideGate();
      setTimeout(v6743SyncExistingPush,250);
      return;
    }

    if(validity===null){
      cloudHideGate();
      const status=document.getElementById('cloudUserStatus');
      if(status)status.textContent='Pendente';
      return;
    }

    if(validity===false){
      cloudClearTrackedLocal();
      cloudSetOwner('');
      cloudSaveSession(null);
      cloudShowGate();
      cloudMsg('Matrícula inativa ou acesso encerrado.','error');
      return;
    }
  }

  cloudShowGate();
}


/* ===== V65 — MEU TAF ===== */
const TAF_RECORDS_KEY='t2_taf_records';
const TAF_PROFILE_KEY='t2_taf_profile';

function tafGetRecords(){
  try{const x=JSON.parse(localStorage.getItem(TAF_RECORDS_KEY)||'[]');return Array.isArray(x)?x:[]}
  catch(e){return []}
}
function tafSaveRecords(list){ localStorage.setItem(TAF_RECORDS_KEY,JSON.stringify(list||[])); }
function tafGetProfile(){
  try{const x=JSON.parse(localStorage.getItem(TAF_PROFILE_KEY)||'{}');return x&&typeof x==='object'?x:{}}
  catch(e){return {}}
}
function tafSaveProfile(p){ localStorage.setItem(TAF_PROFILE_KEY,JSON.stringify(p||{})); }

function tafAgeBand(age){
  age=Number(age);
  if(age>=18&&age<=22)return 0;if(age<=27)return 1;if(age<=32)return 2;if(age<=37)return 3;
  if(age<=42)return 4;if(age<=47)return 5;if(age<=52)return 6;if(age<=56)return 7;if(age<=60)return 8;
  return -1;
}
function tafSwimBand(age){
  age=Number(age);
  if(age>=18&&age<=22)return 0;if(age<=27)return 1;if(age<=32)return 2;if(age<=37)return 3;if(age>=38)return 4;
  return -1;
}
function tafTimeInput(el){
  if(!el)return;
  const raw=String(el.value||'').replace(/\D/g,'').slice(0,4);
  if(!raw){el.value='';return}
  if(raw.length<=2){el.value=raw;return}
  const sec=raw.slice(-2);
  const min=raw.slice(0,-2).replace(/^0+(?=\d)/,'')||'0';
  el.value=`${min}:${sec}`;
}
function tafParseTime(v){
  const s=String(v||'').trim();
  if(!s)return null;
  if(/^\d+:\d{1,2}$/.test(s)){
    const [m,sec]=s.split(':').map(Number);
    if(sec>=60)return null;
    return m*60+sec;
  }
  const digits=s.replace(/\D/g,'');
  if(digits.length>=3){
    const sec=Number(digits.slice(-2)), min=Number(digits.slice(0,-2));
    if(sec>=60)return null;
    return min*60+sec;
  }
  const n=Number(digits);
  return Number.isFinite(n)?n:null;
}
function tafFmtTime(sec){
  if(sec==null||!Number.isFinite(sec))return '—';
  sec=Math.max(0,Math.round(sec));
  return `${Math.floor(sec/60)}:${String(sec%60).padStart(2,'0')}`;
}
function tafPace1600(sec){
  if(sec==null)return '—';
  return tafFmtTime(sec/1.6)+'/km';
}
function tafPaceSwim(sec){
  if(sec==null)return '—';
  return tafFmtTime(sec)+'/100m';
}
function tafScoreRange(value, rows, lowerBetter=false){
  value=Number(value);
  if(!Number.isFinite(value))return null;
  for(let pts=10;pts>=0;pts--){
    const r=rows[pts];
    if(!r)continue;
    const [min,max]=r;
    if(lowerBetter){
      if(value>=min && value<=max)return pts;
    }else{
      if(value>=min && value<=max)return pts;
    }
  }
  return 0;
}
function tafRepScore(kind,age,reps){
  const b=tafAgeBand(age); if(b<0)return null;
  const tables={
    pushup:[
      [[0,24],[25,27],[28,30],[31,34],[35,37],[38,40],[41,44],[45,47],[48,50],[51,54],[55,999]],
      [[0,19],[20,22],[23,26],[27,29],[30,32],[33,36],[37,39],[40,42],[43,46],[47,49],[50,999]],
      [[0,15],[16,18],[19,22],[23,25],[26,28],[29,32],[33,35],[36,38],[39,42],[43,45],[46,999]],
      [[0,12],[13,15],[16,18],[19,22],[23,25],[26,28],[29,32],[33,35],[36,38],[39,42],[43,999]],
      [[0,9],[10,12],[13,15],[16,19],[20,22],[23,25],[26,29],[30,32],[33,35],[36,39],[40,999]],
      [[0,6],[7,9],[10,12],[13,16],[17,19],[20,22],[23,26],[27,29],[30,32],[33,36],[37,999]],
      [[0,3],[4,7],[8,10],[11,13],[14,17],[18,20],[21,23],[24,27],[28,30],[31,33],[34,999]],
      [[0,2],[3,3],[4,6],[7,9],[10,13],[14,16],[17,19],[20,23],[24,26],[27,29],[30,999]],
      [[0,0],[1,1],[2,2],[3,5],[6,9],[10,12],[13,15],[16,19],[20,22],[23,25],[26,999]]
    ],
    bar:[
      [[0,4],[5,6],[7,7],[8,8],[9,10],[11,12],[13,14],[15,15],[16,17],[18,20],[21,999]],
      [[0,2],[3,3],[4,5],[6,6],[7,7],[8,9],[10,11],[12,13],[14,15],[16,17],[18,999]],
      [[0,0],[1,1],[2,3],[4,4],[5,6],[7,7],[8,9],[10,11],[12,13],[14,15],[16,999]],
      [[0,0],[1,1],[2,3],[4,4],[5,6],[7,8],[9,10],[11,12],[13,14],[15,15],[16,999]],
      [[0,0],[1,1],[2,2],[3,5],[6,7],[8,8],[9,9],[10,10],[11,11],[12,12],[13,999]],
      [[0,0],[1,1],[2,3],[4,6],[7,7],[8,8],[9,9],[10,10],[11,11],[12,999],[13,999]],
      [[0,0],[999,998],[999,998],[999,998],[1,2],[3,5],[4,6],[7,7],[8,8],[9,9],[10,999]],
      [[0,0],[999,998],[999,998],[999,998],[1,2],[3,3],[4,4],[5,5],[6,6],[7,7],[8,999]],
      [[0,0],[999,998],[999,998],[999,998],[1,1],[2,2],[3,3],[4,4],[5,5],[6,6],[7,999]]
    ],
    abs:[
      [[0,31],[32,33],[34,36],[37,39],[40,41],[42,44],[45,47],[48,49],[50,52],[53,55],[56,999]],
      [[0,27],[28,30],[31,32],[33,35],[36,38],[39,40],[41,43],[44,46],[47,48],[49,51],[52,999]],
      [[0,23],[24,26],[27,29],[30,32],[33,34],[35,37],[38,40],[41,42],[43,45],[46,48],[49,999]],
      [[0,20],[21,23],[24,26],[27,28],[29,31],[32,34],[35,36],[37,39],[40,42],[43,44],[45,999]],
      [[0,17],[18,20],[21,23],[24,26],[27,28],[29,31],[32,34],[35,36],[37,39],[40,42],[43,999]],
      [[0,15],[16,18],[19,20],[21,23],[24,26],[27,28],[29,31],[32,34],[35,36],[37,39],[40,999]],
      [[0,12],[13,15],[16,18],[19,21],[22,23],[24,26],[27,29],[29,31],[32,34],[35,37],[38,999]],
      [[0,8],[9,11],[12,14],[15,17],[18,19],[20,22],[23,25],[24,27],[28,30],[31,33],[34,999]],
      [[0,4],[5,7],[8,10],[11,13],[14,15],[16,18],[19,21],[22,23],[24,26],[27,29],[30,999]]
    ]
  };
  const col=tables[kind]?.[b]; if(!col)return null;
  for(let pts=10;pts>=0;pts--){const r=col[pts];if(reps>=r[0]&&reps<=r[1])return pts}
  return 0;
}
function tafRunScore(age,sec){
  const b=tafAgeBand(age); if(b<0||sec==null)return null;
  const cols=[
    [531,850,819,787,716,404,390,379,366,354,332],
    [547,906,514,484,452,420,408,395,382,369,350],
    [566,925,532,500,469,438,425,412,400,387,366],
    [583,942,550,519,487,456,443,429,418,405,385],
    [601,1000,568,537,505,474,462,449,436,423,403],
    [620,1019,587,556,525,493,481,468,456,442,423],
    [653,1052,621,589,557,526,513,501,488,475,456],
    [713,1152,681,649,617,586,573,561,548,535,516],
    [773,1252,741,709,677,646,633,621,608,595,576]
  ];
  // Exact ranges from table, represented as max thresholds by score.
  const thresholds=[
    [530,499,467,436,404,390,379,366,354,332],
    [546,514,484,452,420,408,395,382,369,350],
    [565,532,500,469,438,425,412,400,387,366],
    [582,550,519,487,456,443,429,418,405,385],
    [600,568,537,505,474,462,449,436,423,403],
    [619,587,556,525,493,481,468,456,442,423],
    [652,621,589,557,526,513,501,488,475,456],
    [712,681,649,617,586,573,561,548,535,516],
    [772,741,709,677,646,633,621,608,595,576]
  ][b];
  // score 10 if faster than the score-9 lower boundary shown in table
  if(sec < thresholds[9]) return 10;
  // Score ranges, descending from 9 to 1, based on table boundaries
  const ranges=[
    null,
    [b===0?500:b===1?515:b===2?533:b===3?551:b===4?569:b===5?588:b===6?622:b===7?682:742, b===0?530:b===1?546:b===2?565:b===3?582:b===4?600:b===5?619:b===6?652:b===7?712:772],
    [b===0?468:b===1?485:b===2?501:b===3?520:b===4?538:b===5?557:b===6?590:b===7?650:710, b===0?499:b===1?514:b===2?532:b===3?550:b===4?568:b===5?587:b===6?621:b===7?681:741],
    [b===0?437:b===1?453:b===2?470:b===3?488:b===4?506:b===5?526:b===6?558:b===7?618:678, b===0?467:b===1?484:b===2?500:b===3?519:b===4?537:b===5?556:b===6?589:b===7?649:709],
    [b===0?405:b===1?421:b===2?439:b===3?457:b===4?475:b===5?494:b===6?527:b===7?587:647, b===0?436:b===1?452:b===2?469:b===3?487:b===4?505:b===5?525:b===6?557:b===7?617:677],
    [b===0?391:b===1?409:b===2?426:b===3?444:b===4?463:b===5?482:b===6?514:b===7?574:634, b===0?404:b===1?420:b===2?438:b===3?456:b===4?474:b===5?493:b===6?526:b===7?586:646],
    [b===0?380:b===1?396:b===2?413:b===3?430:b===4?450:b===5?469:b===6?502:b===7?562:622, b===0?390:b===1?408:b===2?425:b===3?443:b===4?462:b===5?481:b===6?513:b===7?573:633],
    [b===0?367:b===1?383:b===2?401:b===3?419:b===4?437:b===5?457:b===6?489:b===7?549:609, b===0?379:b===1?395:b===2?412:b===3?429:b===4?449:b===5?468:b===6?501:b===7?561:621],
    [b===0?355:b===1?370:b===2?388:b===3?406:b===4?424:b===5?443:b===6?476:b===7?536:596, b===0?366:b===1?382:b===2?400:b===3?418:b===4?436:b===5?456:b===6?488:b===7?548:608],
    [b===0?333:b===1?351:b===2?367:b===3?386:b===4?404:b===5?424:b===6?457:b===7?517:577, b===0?354:b===1?369:b===2?387:b===3?405:b===4?423:b===5?442:b===6?475:b===7?535:595]
  ];
  for(let pts=9;pts>=1;pts--){const r=ranges[pts];if(sec>=r[0]&&sec<=r[1])return pts}
  return 0;
}
function tafSwimScore(age,sec){
  const b=tafSwimBand(age); if(b<0||sec==null)return null;
  const ranges=[
    [[124,999],[117,123],[110,116],[105,109],[100,104],[96,99],[92,95],[88,91],[83,87],[78,82],[0,77]],
    [[127,999],[120,126],[113,119],[108,112],[103,107],[99,102],[95,98],[91,94],[86,90],[81,85],[0,80]],
    [[130,999],[123,129],[116,122],[111,115],[106,110],[102,105],[98,101],[94,97],[89,93],[84,88],[0,83]],
    [[134,999],[127,133],[120,126],[115,119],[110,114],[106,109],[102,105],[98,101],[93,97],[88,92],[0,87]],
    [[141,999],[134,140],[127,133],[122,126],[117,121],[113,116],[109,112],[105,108],[100,104],[95,99],[0,94]]
  ][b];
  for(let pts=10;pts>=0;pts--){const r=ranges[pts];if(sec>=r[0]&&sec<=r[1])return pts}
  return 0;
}
function tafClassify(sum,count,zeroed){
  if(zeroed)return {label:'INAPTO',cls:'bad'};
  if(count===4){
    if(sum<=8)return {label:'INAPTO',cls:'bad'};
    if(sum<=18)return {label:'REGULAR',cls:'warn'};
    if(sum<=28)return {label:'BOM',cls:'ok'};
    if(sum<=36)return {label:'MUITO BOM',cls:'great'};
    return {label:'EXCEPCIONAL',cls:'excellent'};
  }
  if(count===3){
    if(sum<=6)return {label:'INAPTO',cls:'bad'};
    if(sum<=14)return {label:'REGULAR',cls:'warn'};
    if(sum<=22)return {label:'BOM',cls:'ok'};
    if(sum<=27)return {label:'MUITO BOM',cls:'great'};
    return {label:'EXCEPCIONAL',cls:'excellent'};
  }
  return {label:'—',cls:''};
}
function openTAF(){
  renderTAF();
  showView('taf');
}
function renderTAF(){
  const box=byId('tafContent'); if(!box)return;
  const p=tafGetProfile();
  const rec=tafGetRecords();
  box.innerHTML=`
    <div class="taf-hero">
      <span class="eyebrow">APTIDÃO FÍSICA • CBMRN</span>
      <h3>Meu TAF</h3>
      <p>Registre seus índices oficiais e acompanhe sua evolução individual.</p>
    </div>

    <div class="card">
      <h3>Configuração</h3>
      <div class="taf-grid">
        <label>Idade
          <input id="tafAge" type="number" min="18" max="80" inputmode="numeric" value="${p.age||''}" oninput="tafProfileChanged()">
        </label>
        <label>Modalidade
          <select id="tafMode" onchange="tafProfileChanged()">
            <option value="4" ${String(p.mode||'4')==='4'?'selected':''}>4 exercícios</option>
            <option value="3" ${String(p.mode)==='3'?'selected':''}>3 exercícios (38+)</option>
          </select>
        </label>
        <label id="tafChoiceWrap" style="display:none">Escolha da força
          <select id="tafChoice" onchange="tafProfileChanged()">
            <option value="pushup" ${p.choice==='pushup'?'selected':''}>Flexão no chão</option>
            <option value="bar" ${p.choice==='bar'?'selected':''}>Flexão na barra</option>
          </select>
        </label>
      </div>
      <div id="tafRuleNote" class="taf-note"></div>
    </div>

    <div class="card">
      <h3>Novo registro</h3>
      <label>Data<input id="tafDate" type="date" value="${new Date().toISOString().slice(0,10)}"></label>
      <div class="taf-test-grid">
        <div class="taf-test"><b>Flexão no chão</b><label>Repetições<input id="tafPushup" type="number" min="0" inputmode="numeric" oninput="tafPreview()"></label><span id="tafPushupPts">—</span></div>
        <div class="taf-test"><b>Flexão na barra</b><label>Repetições<input id="tafBar" type="number" min="0" inputmode="numeric" oninput="tafPreview()"></label><span id="tafBarPts">—</span></div>
        <div class="taf-test"><b>Abdominal remador</b><label>Repetições<input id="tafAbs" type="number" min="0" inputmode="numeric" oninput="tafPreview()"></label><span id="tafAbsPts">—</span></div>
        <div class="taf-test"><b>Corrida 1.600 m</b>
          <label>Seu tempo<input id="tafRun" placeholder="Digite 730 → 7:30" inputmode="numeric" maxlength="5" oninput="tafTimeInput(this);tafPreview()"></label>
          <div class="taf-metric"><span>Pace</span><b id="tafRunPace">—</b></div>
          <label>Tempo-meta<input id="tafRunGoal" placeholder="Digite 640 → 6:40" inputmode="numeric" maxlength="5" oninput="tafTimeInput(this);tafPreview()"></label>
          <div class="taf-metric"><span>Pace da meta</span><b id="tafRunGoalPace">—</b></div>
          <span id="tafRunPts">—</span>
        </div>
      </div>

      <div class="taf-extra">
        <div>
          <span class="eyebrow">EXERCÍCIO EXTRA • NÃO ALTERA O TAF PRINCIPAL</span>
          <h3>Natação 100 m</h3>
        </div>
        <label>Seu tempo<input id="tafSwim" placeholder="Digite 140 → 1:40" inputmode="numeric" maxlength="5" oninput="tafTimeInput(this);tafPreview()"></label>
        <div class="taf-metric"><span>Pace 100 m</span><b id="tafSwimPace">—</b></div>
        <label>Tempo-meta<input id="tafSwimGoal" placeholder="Digite 130 → 1:30" inputmode="numeric" maxlength="5" oninput="tafTimeInput(this);tafPreview()"></label>
        <div class="taf-metric"><span>Pace da meta</span><b id="tafSwimGoalPace">—</b></div>
        <div class="taf-swim-score-grid">
          <div><span>Pontuação provável</span><b id="tafSwimPts">—</b><small>resultado atual • máximo 10</small></div>
          <div><span>Pontuação da meta</span><b id="tafSwimGoalPts">—</b><small>simulação • máximo 10</small></div>
        </div>
      </div>

      <div id="tafPreviewBox" class="taf-result-box"></div>
      <label>Observação<input id="tafObs" placeholder="Ex.: simulado, teste oficial, pós-serviço"></label>
      <button class="big red" onclick="tafSaveCurrent()">SALVAR RESULTADO</button>
    </div>

    <div class="card">
      <h3>Histórico do TAF</h3>
      <div id="tafHistory">${rec.length?'':'<div class="custom-empty">Nenhum registro salvo ainda.</div>'}</div>
    </div>`;
  tafProfileChanged(false);
  tafRenderHistory();
}
function tafProfileChanged(save=true){
  const age=Number(byId('tafAge')?.value||0);
  const mode=String(byId('tafMode')?.value||'4');
  const choice=String(byId('tafChoice')?.value||'pushup');
  const wrap=byId('tafChoiceWrap');
  const note=byId('tafRuleNote');
  if(wrap)wrap.style.display=mode==='3'?'block':'none';
  if(note){
    if(mode==='3'&&age<38)note.innerHTML='<b>3 exercícios:</b> disponível apenas para militar com 38 anos ou mais.';
    else if(mode==='3')note.innerHTML='<b>3 exercícios:</b> corrida + abdominal + escolha entre flexão no chão ou barra.';
    else note.innerHTML='<b>4 exercícios:</b> corrida + abdominal + flexão no chão + barra.';
  }
  if(save)tafSaveProfile({age,mode,choice});
  tafPreview();
}
function tafPreview(){
  const age=Number(byId('tafAge')?.value||0);
  const mode=String(byId('tafMode')?.value||'4');
  const choice=String(byId('tafChoice')?.value||'pushup');
  const push=Number(byId('tafPushup')?.value);
  const bar=Number(byId('tafBar')?.value);
  const abs=Number(byId('tafAbs')?.value);
  const run=tafParseTime(byId('tafRun')?.value);
  const swim=tafParseTime(byId('tafSwim')?.value);
  const runGoal=tafParseTime(byId('tafRunGoal')?.value);
  const swimGoal=tafParseTime(byId('tafSwimGoal')?.value);
  const pp=Number.isFinite(push)?tafRepScore('pushup',age,push):null;
  const bp=Number.isFinite(bar)?tafRepScore('bar',age,bar):null;
  const ap=Number.isFinite(abs)?tafRepScore('abs',age,abs):null;
  const rp=run!=null?tafRunScore(age,run):null;
  const sp=swim!=null?tafSwimScore(age,swim):null;
  const sgp=swimGoal!=null?tafSwimScore(age,swimGoal):null;
  if(byId('tafPushupPts'))byId('tafPushupPts').textContent=pp==null?'—':`${pp} ponto${pp===1?'':'s'}`;
  if(byId('tafBarPts'))byId('tafBarPts').textContent=bp==null?'—':`${bp} ponto${bp===1?'':'s'}`;
  if(byId('tafAbsPts'))byId('tafAbsPts').textContent=ap==null?'—':`${ap} ponto${ap===1?'':'s'}`;
  if(byId('tafRunPts'))byId('tafRunPts').textContent=rp==null?'—':`${rp} ponto${rp===1?'':'s'}`;
  if(byId('tafSwimPts'))byId('tafSwimPts').textContent=sp==null?'—':`${sp}/10`;
  if(byId('tafSwimGoalPts'))byId('tafSwimGoalPts').textContent=sgp==null?'—':`${sgp}/10`;
  if(byId('tafRunPace'))byId('tafRunPace').textContent=tafPace1600(run);
  if(byId('tafRunGoalPace'))byId('tafRunGoalPace').textContent=tafPace1600(runGoal);
  if(byId('tafSwimPace'))byId('tafSwimPace').textContent=tafPaceSwim(swim);
  if(byId('tafSwimGoalPace'))byId('tafSwimGoalPace').textContent=tafPaceSwim(swimGoal);

  let selected=[];
  if(mode==='4')selected=[pp,bp,ap,rp];
  else selected=[choice==='pushup'?pp:bp,ap,rp];
  const complete=selected.every(x=>x!=null);
  const sum=selected.reduce((a,b)=>a+(b||0),0);
  const zeroed=complete&&selected.some(x=>x===0);
  const cls=complete?tafClassify(sum,mode==='4'?4:3,zeroed):{label:'PREENCHA OS ÍNDICES',cls:''};
  const box=byId('tafPreviewBox');
  if(box)box.innerHTML=`<div><span>Pontuação principal</span><b>${complete?sum:'—'}${complete?` / ${mode==='4'?40:30}`:''}</b></div><div><span>Classificação</span><b class="${cls.cls}">${cls.label}</b></div>`;
}
function tafSaveCurrent(){
  const age=Number(byId('tafAge')?.value||0), mode=String(byId('tafMode')?.value||'4'), choice=String(byId('tafChoice')?.value||'pushup');
  if(age<18){alert('Informe a idade do militar.');return}
  if(mode==='3'&&age<38){alert('A opção de 3 exercícios é permitida somente a partir de 38 anos.');return}
  const vals={
    pushup:Number(byId('tafPushup')?.value),
    bar:Number(byId('tafBar')?.value),
    abs:Number(byId('tafAbs')?.value),
    run:tafParseTime(byId('tafRun')?.value),
    swim:tafParseTime(byId('tafSwim')?.value),
    runGoal:tafParseTime(byId('tafRunGoal')?.value),
    swimGoal:tafParseTime(byId('tafSwimGoal')?.value)
  };
  const pts={
    pushup:Number.isFinite(vals.pushup)?tafRepScore('pushup',age,vals.pushup):null,
    bar:Number.isFinite(vals.bar)?tafRepScore('bar',age,vals.bar):null,
    abs:Number.isFinite(vals.abs)?tafRepScore('abs',age,vals.abs):null,
    run:vals.run!=null?tafRunScore(age,vals.run):null,
    swim:vals.swim!=null?tafSwimScore(age,vals.swim):null
  };
  const selected=mode==='4'?[pts.pushup,pts.bar,pts.abs,pts.run]:[choice==='pushup'?pts.pushup:pts.bar,pts.abs,pts.run];
  if(!selected.every(x=>x!=null)){alert('Preencha todos os índices obrigatórios do TAF principal.');return}
  const sum=selected.reduce((a,b)=>a+b,0), zeroed=selected.some(x=>x===0), classification=tafClassify(sum,mode==='4'?4:3,zeroed).label;
  const r={
    id:'taf-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),
    date:byId('tafDate')?.value||new Date().toISOString().slice(0,10),
    age,mode,choice,values:vals,points:pts,sum,classification,
    obs:String(byId('tafObs')?.value||'').trim(),
    savedAt:new Date().toISOString()
  };
  const list=tafGetRecords(); list.unshift(r); tafSaveRecords(list);
  tafSaveProfile({age,mode,choice});
  tafRenderHistory();
  alert('Resultado do TAF salvo.');
}
function tafDelete(id){
  if(!confirm('Excluir este registro do TAF?'))return;
  tafSaveRecords(tafGetRecords().filter(x=>x.id!==id)); tafRenderHistory();
}
function tafRenderHistory(){
  const box=byId('tafHistory'); if(!box)return;
  const list=tafGetRecords();
  if(!list.length){box.innerHTML='<div class="custom-empty">Nenhum registro salvo ainda.</div>';return}
  box.innerHTML=list.map(r=>`
    <div class="taf-history-item">
      <div class="taf-history-head"><div><b>${new Date(r.date+'T12:00:00').toLocaleDateString('pt-BR')}</b><small>${r.mode} exercícios • ${r.age} anos</small></div><button onclick="tafDelete('${r.id}')">×</button></div>
      <div class="taf-history-score"><strong>${r.sum}/${r.mode==='4'?40:30}</strong><span>${r.classification}</span></div>
      <div class="taf-history-grid">
        ${r.mode==='4'||r.choice==='pushup'?`<span>Flexão: <b>${Number.isFinite(r.values.pushup)?r.values.pushup:'—'}</b> (${r.points.pushup??'—'} pts)</span>`:''}
        ${r.mode==='4'||r.choice==='bar'?`<span>Barra: <b>${Number.isFinite(r.values.bar)?r.values.bar:'—'}</b> (${r.points.bar??'—'} pts)</span>`:''}
        <span>Abdominal: <b>${Number.isFinite(r.values.abs)?r.values.abs:'—'}</b> (${r.points.abs??'—'} pts)</span>
        <span>Corrida: <b>${tafFmtTime(r.values.run)}</b> • ${tafPace1600(r.values.run)} (${r.points.run??'—'} pts)</span>
        ${r.values.runGoal!=null?`<span>Meta corrida: <b>${tafFmtTime(r.values.runGoal)}</b> • ${tafPace1600(r.values.runGoal)}</span>`:''}
        ${r.values.swim!=null?`<span>Natação extra: <b>${tafFmtTime(r.values.swim)}</b> • ${tafPaceSwim(r.values.swim)} (${r.points.swim??'—'} pts)</span>`:''}
        ${r.values.swimGoal!=null?`<span>Meta natação: <b>${tafFmtTime(r.values.swimGoal)}</b> • ${tafPaceSwim(r.values.swimGoal)}</span>`:''}
      </div>
      ${r.obs?`<small class="taf-history-obs">${escapeCustomHtml(r.obs)}</small>`:''}
    </div>`).join('');
}

/* ===== V51 — ÁREA DO ADMINISTRADOR ===== */
const ADMIN_SESSION_KEY='t2_admin_session_v51';
let adminSessionToken=sessionStorage.getItem(ADMIN_SESSION_KEY)||'';
let adminMilitaresCache=[];
let adminIsAuthorized=!!adminSessionToken;


function adminSetEntryVisible(visible){
  adminIsAuthorized=!!visible;
  const card=document.getElementById('adminEntryCard');
  if(card)card.style.display=adminIsAuthorized?'block':'none';

  // Se a sessão administrativa ficou salva, mas a matrícula atual não é admin,
  // encerra apenas a sessão administrativa local.
  if(!adminIsAuthorized){
    adminSessionToken='';
    try{sessionStorage.removeItem(ADMIN_SESSION_KEY);}catch(e){}
    if(document.querySelector('.view.active')?.id==='admin') showView('tools');
  }
}

async function adminRefreshVisibility(){
  // V67.22: não apaga a sessão administrativa durante uma simples atualização da página.
  // Enquanto a verificação está em andamento, preserva o token já existente em sessionStorage.
  const card=document.getElementById('adminEntryCard');
  if(card && !adminIsAuthorized)card.style.display='none';
  if(!cloudSession?.token) return false;
  if(!navigator.onLine){
    if(adminSessionToken){adminIsAuthorized=true;if(card)card.style.display='block';return true;}
    return false;
  }
  try{
    const row=await cloudRpc('verificar_admin_militar',{p_token_militar:cloudSession.token});
    const ok=row?.administrador===true;
    adminSetEntryVisible(ok);
    return ok;
  }catch(e){
    console.warn('Não foi possível verificar perfil administrativo:',e);
    // Falha transitória de rede não deve deslogar o administrador.
    if(adminSessionToken){adminIsAuthorized=true;if(card)card.style.display='block';return true;}
    return false;
  }
}

function adminMsg(text,type=''){
  const el=document.getElementById('adminMessage');
  if(!el)return;
  el.textContent=text||'';
  el.className='admin-message '+type;
}
function adminEscape(v){
  return String(v??'').replace(/[&<>"']/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]));
}
function openAdmin(){
  if(!adminIsAuthorized){
    showView('tools');
    return;
  }
  showView('admin');
  const login=document.getElementById('adminLoginBox');
  const panel=document.getElementById('adminPanel');
  if(adminSessionToken){
    login.style.display='none';
    panel.style.display='block';
    adminLoadMilitares();
  }else{
    login.style.display='block';
    panel.style.display='none';
    setTimeout(()=>document.getElementById('adminCode')?.focus(),100);
  }
}
async function adminLogin(){
  if(!cloudSession?.token){
    adminMsg('Entre primeiro com sua matrícula.','error');
    return;
  }
  const code=String(document.getElementById('adminCode')?.value||'').trim();
  if(!code){
    adminMsg('Informe o código administrativo.','error');
    return;
  }
  adminMsg('Verificando acesso…');
  try{
    const row=await cloudRpc('entrar_admin',{
      p_token_militar:cloudSession.token,
      p_codigo:code
    });
    if(!row?.autorizado||!row?.token){
      adminMsg('Acesso administrativo não autorizado.','error');
      return;
    }
    adminSessionToken=row.token;
    sessionStorage.setItem(ADMIN_SESSION_KEY,adminSessionToken);
    document.getElementById('adminCode').value='';
    document.getElementById('adminLoginBox').style.display='none';
    document.getElementById('adminPanel').style.display='block';
    adminMsg('');
    await adminLoadMilitares();
  }catch(e){
    console.error(e);
    adminMsg('Não foi possível validar o acesso administrativo.','error');
  }
}
async function adminLoadMilitares(){
  if(!adminSessionToken)return;
  const list=document.getElementById('adminMilitaryList');
  if(list) list.innerHTML='<div class="admin-loading">Carregando militares…</div>';
  try{
    const res=await cloudApi('/rest/v1/rpc/admin_listar_militares',{
      method:'POST',
      body:JSON.stringify({p_token:adminSessionToken})
    });
    const data=await res.json().catch(()=>[]);
    if(!res.ok) throw new Error(data?.message||'Falha ao listar');
    adminMilitaresCache=Array.isArray(data)?data:[];
    adminRenderMilitares();
  }catch(e){
    console.error(e);
    if(list)list.innerHTML='<div class="admin-empty">Não foi possível carregar a lista.</div>';
  }
}
function adminRenderMilitares(){
  const list=document.getElementById('adminMilitaryList');
  const search=String(document.getElementById('adminSearch')?.value||'').toLowerCase().trim();
  if(!list)return;
  const rows=adminMilitaresCache.filter(m=>{
    const hay=`${m.nome||''} ${m.matricula||''} ${m.graduacao||''}`.toLowerCase();
    return !search||hay.includes(search);
  });
  document.getElementById('adminMilitaryCount').textContent=`${adminMilitaresCache.length} militar${adminMilitaresCache.length===1?'':'es'}`;
  if(!rows.length){
    list.innerHTML='<div class="admin-empty">Nenhum militar encontrado.</div>';
    return;
  }
  list.innerHTML=rows.map(m=>`
    <div class="admin-military-row ${m.ativo?'':'is-inactive'}">
      <div class="admin-military-main">
        <b>${adminEscape(m.nome||'Sem nome')}</b>
        <span>${adminEscape(m.graduacao||'')} • Matrícula ${adminEscape(m.matricula||'')}</span>
      </div>
      <div class="admin-military-actions">
        <button class="admin-edit" type="button"
          onclick="adminOpenEditMilitary('${adminEscape(m.matricula)}')">✏️ EDITAR</button>
        <button class="${m.ativo?'admin-disable':'admin-enable'}" type="button"
          onclick="adminToggleMilitary('${adminEscape(m.matricula)}',${!m.ativo})">
          ${m.ativo?'DESATIVAR':'ATIVAR'}
        </button>
      </div>
    </div>`).join('');
}
function adminOpenEditMilitary(matricula){
  if(!adminSessionToken){
    adminMsg('Valide o acesso administrativo para editar militares.','error');
    return;
  }
  const target=String(matricula||'');
  const m=adminMilitaresCache.find(x=>String(x.matricula||'')===target);
  if(!m){adminMsg('Militar não encontrado na lista atual.','error');return;}
  const overlay=document.getElementById('adminEditMilitaryOverlay');
  if(!overlay)return;
  document.getElementById('adminEditMatricula').value=String(m.matricula||'');
  document.getElementById('adminEditNome').value=String(m.nome||'');
  document.getElementById('adminEditGraduacao').value=String(m.graduacao||'');
  document.getElementById('adminEditMilitaryMessage').textContent='';
  overlay.hidden=false;
  document.body.classList.add('admin-modal-open');
  setTimeout(()=>document.getElementById('adminEditGraduacao')?.focus(),80);
}
function adminCloseEditMilitary(){
  const overlay=document.getElementById('adminEditMilitaryOverlay');
  if(overlay)overlay.hidden=true;
  document.body.classList.remove('admin-modal-open');
}
async function adminSaveMilitaryEdit(){
  if(!adminSessionToken)return;
  const matricula=cloudNormalize(document.getElementById('adminEditMatricula')?.value);
  const nome=String(document.getElementById('adminEditNome')?.value||'').trim();
  const graduacao=String(document.getElementById('adminEditGraduacao')?.value||'').trim();
  const msg=document.getElementById('adminEditMilitaryMessage');
  if(!matricula||!nome||!graduacao){if(msg){msg.textContent='Preencha nome e graduação.';msg.className='admin-message error'}return;}
  if(msg){msg.textContent='Salvando alterações…';msg.className='admin-message'}
  try{
    const row=await cloudRpc('admin_editar_militar_v6759',{
      p_token:adminSessionToken,
      p_matricula:matricula,
      p_nome:nome,
      p_graduacao:graduacao
    });
    if(row?.salvo!==true)throw new Error('Alteração não confirmada');
    if(msg){msg.textContent='Dados atualizados com sucesso.';msg.className='admin-message success'}
    await adminLoadMilitares();
    if(cloudSession?.matricula===matricula){
      cloudSession.nome=row.nome||nome;
      cloudSession.graduacao=row.graduacao||graduacao;
      cloudSaveSession(cloudSession);
      cloudRenderUser();
    }
    setTimeout(()=>{adminCloseEditMilitary();adminMsg('Militar atualizado com sucesso.','success')},650);
  }catch(e){
    console.error(e);
    if(msg){msg.textContent='Não foi possível salvar a alteração. Confirme sua sessão administrativa.';msg.className='admin-message error'}
  }
}

async function adminSaveMilitary(){
  if(!adminSessionToken)return;
  const matricula=cloudNormalize(document.getElementById('adminNewMatricula')?.value);
  const nome=String(document.getElementById('adminNewNome')?.value||'').trim();
  const graduacao=String(document.getElementById('adminNewGraduacao')?.value||'').trim();
  if(!matricula||!nome||!graduacao){
    adminMsg('Preencha matrícula, nome e graduação.','error');
    return;
  }
  adminMsg('Salvando militar…');
  try{
    const row=await cloudRpc('admin_salvar_militar',{
      p_token:adminSessionToken,
      p_matricula:matricula,
      p_nome:nome,
      p_graduacao:graduacao,
      p_ativo:true
    });
    if(row?.salvo!==true){
      adminMsg('O Supabase não confirmou o cadastro.','error');
      return;
    }
    document.getElementById('adminNewMatricula').value='';
    document.getElementById('adminNewNome').value='';
    document.getElementById('adminNewGraduacao').value='';
    adminMsg('Militar salvo com sucesso.','success');
    await adminLoadMilitares();
  }catch(e){
    console.error(e);
    adminMsg('Não foi possível salvar o militar.','error');
  }
}
async function adminToggleMilitary(matricula,ativo){
  if(!adminSessionToken)return;
  const action=ativo?'reativar':'desativar';
  if(!confirm(`Deseja ${action} a matrícula ${matricula}?`))return;
  try{
    const row=await cloudRpc('admin_alterar_status',{
      p_token:adminSessionToken,
      p_matricula:matricula,
      p_ativo:ativo
    });
    if(row?.salvo!==true)throw new Error('Não confirmado');
    adminMsg(`Matrícula ${ativo?'ativada':'desativada'} com sucesso.`,'success');
    await adminLoadMilitares();
  }catch(e){
    console.error(e);
    adminMsg('Não foi possível alterar o acesso.','error');
  }
}
async function adminChangeCode(){
  const atual=String(document.getElementById('adminCurrentCode')?.value||'').trim();
  const novo=String(document.getElementById('adminNewCode')?.value||'').trim();
  const confirmar=String(document.getElementById('adminConfirmCode')?.value||'').trim();
  if(!atual||!novo||!confirmar){
    adminMsg('Preencha os três campos do código.','error');
    return;
  }
  if(novo.length<8){
    adminMsg('O novo código deve ter pelo menos 8 caracteres.','error');
    return;
  }
  if(novo!==confirmar){
    adminMsg('A confirmação do novo código não confere.','error');
    return;
  }
  try{
    const row=await cloudRpc('admin_trocar_codigo',{
      p_token:adminSessionToken,
      p_codigo_atual:atual,
      p_codigo_novo:novo
    });
    if(row?.alterado!==true){
      adminMsg('Código atual incorreto ou alteração recusada.','error');
      return;
    }
    ['adminCurrentCode','adminNewCode','adminConfirmCode'].forEach(id=>document.getElementById(id).value='');
    adminMsg('Código administrativo alterado com sucesso.','success');
  }catch(e){
    console.error(e);
    adminMsg('Não foi possível alterar o código.','error');
  }
}
async function adminLogout(){
  try{
    if(adminSessionToken){
      await cloudRpc('admin_sair',{p_token:adminSessionToken});
    }
  }catch(e){}
  adminSessionToken='';
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
  document.getElementById('adminPanel').style.display='none';
  document.getElementById('adminLoginBox').style.display='block';
  adminMsg('');
}

window.addEventListener('online',async()=>{
  cloudRenderUser();
  if(!cloudSession?.token)return;
  const validity=await cloudValidate();
  if(validity===false){
    cloudSaveSession(null);
    cloudShowGate();
    cloudMsg('Matrícula inativa ou acesso encerrado.','error');
    return;
  }
  if(validity===true)await cloudInitialSync(false);
});
window.addEventListener('offline',cloudRenderUser);
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='hidden'){
    // V67.68.13 — ao sair/minimizar o app, treino em andamento fica PAUSADO
    // e preservado no ponto exato. Ao voltar, o militar decide quando retomar.
    const active=v67604ActivePlanState();
    if(active && active.status!=='paused')v67604PauseWorkout(false);
    else v67604SaveActivePlanState();
    saveNavigationState(document.querySelector('.view.active')?.id||'home');
  }
  if(document.visibilityState==='visible'){
    // Se o mesmo documento continuou vivo, permanecemos exatamente na tela atual.
    // A sincronização em nuvem pode ocorrer sem alterar a navegação.
    if(cloudSession?.token && navigator.onLine)cloudInitialSync(false);
  }
});
// V67.68.12 — redundância para Android/PWA: se o documento for descarregado
// sem um visibilitychange confiável, preserva a sessão como pausada.
window.addEventListener('pagehide',()=>{
  const active=v67604ActivePlanState();
  if(active && active.status!=='paused')v67604PauseWorkout(false);
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
