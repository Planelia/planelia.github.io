// Nélia anime son coucou en haut de l'accueil (animation 2D de Kate, validée par Renzo le 15/10) :
// rebond, coucou de 0 à 2,7 s puis arrêt, double battement du cœur, antennes souples.
// Fixe sous prefers-reduced-motion ; en pause quand elle n'est pas à l'écran.
(() => {
  const svg = document.getElementById('nelia-svg');
  if (!svg || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const $ = id => document.getElementById(id);
  const lisse = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
  const pic = (x, c, l) => Math.exp(-(((x - c) / l) ** 2));
  const p = 2 * Math.PI;
  function rendu(t) {
    const haut = 0.5 - 0.5 * Math.cos(p * t);            // 0 au sol, 1 en haut (1 rebond/s)
    const sy = 1 - 0.03 * (1 - haut) + 0.015 * haut, sx = 1 / sy;
    $('tout').setAttribute('transform', `translate(0 ${-10 * haut}) translate(200 415) scale(${sx} ${sy}) translate(-200 -415)`);
    $('ombre').setAttribute('transform', `translate(200 430) scale(${1 - 0.12 * haut} 1) translate(-200 -430)`);
    $('ombre').setAttribute('opacity', 0.16 - 0.05 * haut);
    const env = lisse(t / 0.35) * (1 - lisse((t - 2.3) / 0.45));  // coucou de 0 à ~2,7 s, une seule fois
    $('brasD').setAttribute('transform', `rotate(${-24 * Math.sin(p * 2.2 * t) * env} 328 250)`);
    const tr = (t - 0.12) * p;                            // antennes en retard = souplesse
    $('antG').setAttribute('transform', `rotate(${-4 * Math.sin(tr)} 145 114)`);
    $('antD').setAttribute('transform', `rotate(${4 * Math.sin(tr)} 255 114)`);
    const b = t % 1, s = 1 + 0.10 * pic(b, 0.30, 0.05) + 0.06 * pic(b, 0.46, 0.05);
    $('coeur').setAttribute('transform', `translate(200 284) scale(${s}) translate(-200 -284)`);
  }
  let t = 0, avant = 0, id = 0;                           // t = temps d'animation, figé pendant la pause
  const image = maintenant => { if (avant) t += (maintenant - avant) / 1000; avant = maintenant; rendu(t); id = requestAnimationFrame(image); };
  new IntersectionObserver(([e]) => {
    cancelAnimationFrame(id); avant = 0;
    if (e.isIntersecting) id = requestAnimationFrame(image);
  }).observe(svg);
})();
