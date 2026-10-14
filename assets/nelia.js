// Nélia animée : un seul moteur pour planelia.fr et rdv.planelia.fr (copié tel quel par outil/nelia-dessins.mjs).
// Dessins de Kate dans nelia-dessins.js (à charger avant). Chaque geste a son visage (qui reste après le geste, avec
// un clignement toutes les 3 à 5 s) et se rejoue tant que Nélia est à l'écran : toutes les 9 à 14 s (enveloppe : 6 à
// 8 s ; oups : une seule fois) et au retour sur l'onglet. Entre deux, repos (rebond lent, cœur qui bat).
// Fixe sous prefers-reduced-motion ; en pause hors écran.
// Dans la page : <span class="nelia-anim" data-humeur="contente" data-geste="coucou"></span> (le geste part à la
// première apparition à l'écran) ; en script : Nelia.jouer(element, humeur, geste).
(() => {
  const D = window.NELIA_DESSINS;
  if (!D) return;
  const fixe = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const P = 2 * Math.PI, sin = Math.sin;
  const lisse = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
  const pic = (x, c, l) => Math.exp(-(((x - c) / l) ** 2));
  const cloche = (t, d, f = 0.35) => lisse(t / f) * (1 - lisse((t - d + f) / f));   // 0 → 1 → 0 sur la durée d
  const melange = (repos, cible, k) => repos + (cible - repos) * k;
  const hasard = (a, b) => a + Math.random() * (b - a);

  // Un geste : durée d (s), f(t) qui renvoie ce qu'il change, relance [min, max] en s (absent = une seule fois),
  // acc = accessoire de Kate (bras cachés pendant qu'il est là ; garde = reste affiché après le geste).
  // Bras : angle visé en degrés (0 = vers la droite, -90 = en haut), mêlé à la pose de l'humeur selon k.
  // Corps : dy (vers le bas), sx/sy (écrasement aux pieds), rot. a = opacité de l'accessoire, pied = rotation du pied droit.
  const GESTES = {
    coucou: { d: 3, relance: [9, 14], f: t => ({ k: cloche(t, 3), bd: -57 - 27 * sin(P * 2.2 * t) }) },
    montre: { d: 2.8, relance: [9, 14], f: t => {
      const k = cloche(t, 2.8);
      return { k, bd: -2 + 6 * sin(P * 3 * t) * lisse((t - 0.5) / 0.3), rot: 8 * k, dy: 4 * k };
    } },
    joie: { d: 2, relance: [9, 14], acc: 'etoiles', f: t => {
      const accroupi = pic(t, 0.25, 0.1), vol = t > 0.35 && t < 0.95 ? sin(P * (t - 0.35) / 1.2) : 0, atterrit = pic(t, 1.05, 0.08);
      return { k: cloche(t, 2, 0.3), bd: -80, bg: 260, a: cloche(t, 2, 0.3), dy: 12 * accroupi - 70 * vol, sy: 1 - 0.1 * accroupi - 0.14 * atterrit, sx: 1 + 0.06 * accroupi + 0.16 * atterrit };
    } },
    enveloppe: { d: 3, relance: [6, 8], acc: 'enveloppe-2mains', f: t => {
      const a = cloche(t, 3, 0.3), sursaut = pic(t, 1.5, 0.1);
      return { a, accS: 0.75 + 0.25 * lisse(t / 0.9), dy: -14 * sursaut, sy: 1 + 0.04 * sursaut };
    } },
    calme: { d: 4, relance: [9, 14], acc: 'mains-jointes', garde: true, f: t => {
      const k = cloche(t, 4, 0.6), souffle = (1 - Math.cos(P * t / 4)) / 2;
      return { a: 1, dy: 3 * souffle * k, sy: 1 + 0.035 * souffle * k, sx: 1 + 0.02 * souffle * k, rot: -2 * souffle * k };
    } },
    oups: { d: 2.4, f: t => {
      const saut = pic(t, 0.12, 0.08), tremble = 10 * sin(P * 13 * t) * (1 - lisse((t - 0.3) / 0.9));
      return { k: cloche(t, 2.4, 0.3), dy: -18 * saut, sy: 1 + 0.05 * saut, ag: tremble, ad: -tremble, kbg: lisse((t - 0.9) / 0.4) * (1 - lisse((t - 2.1) / 0.3)), bg: 262 };
    } },
    patience: { d: 3.2, relance: [9, 14], f: t => ({ rot: 3 * sin(P * t / 1.6) * cloche(t, 3.2, 0.6), pied: -14 * Math.max(0, sin(P * 2.5 * t)) * cloche(t, 3.2, 0.4) }) },
  };

  const vues = new Set();
  const angle = g => { const [x, y, x2, y2] = g.querySelector('path').getAttribute('d').match(/-?[\d.]+/g).map(Number); return { x, y, a: Math.atan2(y2 - y, x2 - x) * 180 / Math.PI }; };
  const dessiner = n => {
    n.el.innerHTML = D[n.humeur] || D.sereine;
    const q = p => n.el.querySelector(`[data-p="${p}"]`), g = GESTES[n.geste] || {};
    if (D.visages[n.geste]) q('visage').innerHTML = D.visages[n.geste];     // le visage du geste remplace celui de l'humeur
    n.p = { tout: q('tout'), ombre: q('ombre'), bd: q('brasD'), bg: q('brasG'), ag: q('antG'), ad: q('antD'), coeur: q('coeur'), pied: q('piedD') };
    n.repos = { bd: angle(n.p.bd), bg: angle(n.p.bg) };
    n.yeux = [...n.el.querySelectorAll('[data-p="yeux"]')].map(y => {     // centre vertical des yeux, pour le clignement
      const cy = [...y.querySelectorAll('ellipse')].map(e => +e.getAttribute('cy'));
      return { y, c: cy.reduce((s, v) => s + v, 0) / cy.length };
    });
    n.p.acc = null;
    if (g.acc && D.acc[g.acc]) {
      n.p.tout.insertAdjacentHTML('beforeend', `<g data-p="acc" opacity="${g.garde ? 1 : 0}">${D.acc[g.acc]}</g>`);
      n.p.acc = q('acc');
      n.etoiles = [...n.p.acc.querySelectorAll('.etoile')].map((e, i) => ({ e, t: e.getAttribute('transform') || '', i }));
      if (g.garde) n.p.bd.style.display = n.p.bg.style.display = 'none';
    }
  };
  const bras = (g, r, cible, k) => g.setAttribute('transform', `rotate(${melange(0, cible - r.a, k)} ${r.x} ${r.y})`);
  const rendu = n => {
    const h = n.h, t = n.t, p = n.p, g = GESTES[n.geste] || {}, tg = g.f && t < g.d ? g.f(t) : {}, k = tg.k || 0;
    const haut = (1 - Math.cos(P * h / 2)) / 2;              // repos : rebond lent (1 toutes les 2 s)
    const dy = -5 * haut + (tg.dy || 0), sy = (tg.sy || 1) * (1 - 0.015 * (1 - haut)), sx = (tg.sx || 1) / (1 - 0.015 * (1 - haut));
    p.tout.setAttribute('transform', `translate(0 ${dy}) rotate(${tg.rot || 0} 200 415) translate(200 415) scale(${sx} ${sy}) translate(-200 -415)`);
    const envol = Math.min(1, Math.max(0, -dy / 70));
    p.ombre.setAttribute('transform', `translate(200 430) scale(${1 - 0.3 * envol} 1) translate(-200 -430)`);
    bras(p.bd, n.repos.bd, tg.bd ?? n.repos.bd.a, tg.bd === undefined ? 0 : k);
    bras(p.bg, n.repos.bg, tg.bg ?? n.repos.bg.a, tg.bg === undefined ? 0 : (tg.kbg ?? k));
    const souple = 3 * sin(P * (h - 0.15) / 2);              // antennes en retard sur le rebond
    p.ag.setAttribute('transform', `rotate(${-souple + (tg.ag || 0)} 145 114)`);
    p.ad.setAttribute('transform', `rotate(${souple + (tg.ad || 0)} 255 114)`);
    const b = h % 1.2 / 1.2, s = 1 + 0.08 * pic(b, 0.3, 0.05) + 0.05 * pic(b, 0.46, 0.05);
    p.coeur.setAttribute('transform', `translate(200 284) scale(${s}) translate(-200 -284)`);
    p.pied.setAttribute('transform', `rotate(${tg.pied || 0} 215 410)`);   // talon posé, la pointe tapote
    const c =n.cligneDebut !== undefined ? pic(h - n.cligneDebut, 0.08, 0.05) : 0;
    for (const { y, c: cy } of n.yeux) y.setAttribute('transform', `translate(0 ${cy}) scale(1 ${1 - 0.9 * c}) translate(0 ${-cy})`);
    if (p.acc && !g.garde) {
      const a = tg.a || 0;
      p.acc.setAttribute('opacity', a);
      p.acc.setAttribute('transform', `translate(200 366) scale(${tg.accS || 1}) translate(-200 -366)`);
      if (g.acc !== 'etoiles') p.bd.style.opacity = p.bg.style.opacity = a > 0.5 ? 0 : 1;   // ses moufles tiennent l'accessoire
      for (const e of n.etoiles || []) {                       // les étoiles scintillent, chacune à son rythme
        const sc = 0.6 + 0.4 * (1 + sin(P * (1.6 * t + e.i * 0.37))) / 2;
        e.e.setAttribute('transform', `${e.t} scale(${sc}) rotate(${20 * sin(P * (t + e.i * 0.21))})`);
      }
    }
  };

  // Horloges : h tourne toujours (repos, clignement), t repart à 0 à chaque geste ; prochain = quand rejouer.
  const relancer = n => { const r = (GESTES[n.geste] || {}).relance; n.prochain = r ? (GESTES[n.geste].d + hasard(...r)) : Infinity; };
  const avancer = (n, dt) => {
    n.h += dt; n.t += dt;
    if (n.t >= n.prochain) { n.t = 0; relancer(n); }
    if (n.yeux.length && n.h >= n.cligne) { n.cligneDebut = n.h; n.cligne = n.h + hasard(3, 5); }
  };
  let avant = 0, id = 0;
  const image = maintenant => {
    const dt = avant ? Math.min(0.1, (maintenant - avant) / 1000) : 0;
    avant = maintenant;
    for (const n of vues) { avancer(n, dt); rendu(n); }
    id = vues.size ? requestAnimationFrame(image) : (avant = 0);
  };
  const observateur = fixe ? null : new IntersectionObserver(es => {
    for (const e of es) e.isIntersecting ? vues.add(e.target.nelia) : vues.delete(e.target.nelia);
    if (vues.size && !id) id = requestAnimationFrame(image);
  });
  if (!fixe) document.addEventListener('visibilitychange', () => {   // retour sur l'onglet : elle rejoue son geste (sauf oups)
    if (document.hidden) return;
    avant = 0;
    for (const n of vues) if (GESTES[n.geste]?.relance) { n.t = 0; relancer(n); }
  });

  const jouer = (el, humeur, geste) => {
    const n = el.nelia || (el.nelia = { el, h: 0 });
    const neuf = n.humeur !== humeur || n.geste !== geste;
    Object.assign(n, { humeur, geste, t: 0 });
    Object.assign(el.dataset, { humeur, geste });         // lisible par les tests
    if (neuf || !n.p) dessiner(n);
    relancer(n);
    n.cligne = n.h + hasard(3, 5);
    if (fixe) return;
    rendu(n);
    if (!n.suivi) { observateur.observe(el); n.suivi = true; }
  };
  window.Nelia = { jouer, GESTES: Object.keys(GESTES) };
  for (const el of document.querySelectorAll('.nelia-anim[data-humeur]')) jouer(el, el.dataset.humeur, el.dataset.geste);
})();
