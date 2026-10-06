/* TREINO 2ª CIA — CADEIRA ABDUTORA v67725 */
(function(){
  const map = {'Cadeira abdutora':'assets/exercises/posters/cadeira-abdutora.webp'};
  const old = window.v676901PosterSrc;
  window.v676901PosterSrc = function(ex){
    const n = String(ex?.name || '').trim();
    if(map[n]) return map[n] + '?v=67725';
    return typeof old === 'function' ? old(ex) : (ex?.posterSrc || '');
  };
})();
