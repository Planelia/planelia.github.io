/* Formulaire « Je veux une place » (09/11) : remplace l'ouverture de la messagerie. Le lien mailto reste en secours sans JS.
   Envoi vers la fonction « contacter » (Turnstile + champ piège + limites côté serveur). Fichier externe : la CSP interdit le JS en ligne. */
(() => {
const FN = 'https://crwlkyzqgnxmjxgacvze.supabase.co/functions/v1/contacter';
const CLE = 'sb_publishable_aAwcGfY_-GqM3uYXO_WGMA_9O2eD8Ft';   // publique
const TURNSTILE = '0x4AAAAAAFMmS40Dz5fPkEGp';                  // clé de site, publique
const MESSAGES = {
  invalide: 'Vérifiez votre prénom, votre e-mail ou téléphone, et vos prestations.',
  trop: 'Votre demande est déjà bien arrivée. Réessayez dans une minute si vous voulez ajouter quelque chose.',
  ip: 'Plusieurs demandes sont déjà parties d’ici. Réessayez dans une heure, ou écrivez à contact@planelia.fr.'
};
const AUTRE = 'L’envoi n’a pas marché. Écrivez-nous à contact@planelia.fr, on vous répond vite.';
// Nos messages sous chaque champ, à la place des bulles du navigateur (form novalidate).
const AIDES = {
  prenom: {vide: 'Votre prénom, pour qu’on sache comment vous appeler 🙂'},
  contact: {vide: 'Un e-mail ou un téléphone, pour vous répondre', format: 'Il manque un petit bout, on dirait. Par exemple : nina@gmail.com ou 06 12 34 56 78'},
  prestations: {vide: 'Dites-nous quelques prestations et leurs prix'}
};
function verifie(champ) {
  if (!champ.value.trim()) champ.value = '';   // des espaces seuls comptent comme vide
  const ok = champ.checkValidity(), aide = AIDES[champ.name];
  champ.setAttribute('aria-invalid', String(!ok));
  document.getElementById('aide-' + champ.name).textContent = ok ? '' : champ.validity.valueMissing ? aide.vide : aide.format;
  return ok;
}

// Turnstile (anti-robot invisible) chargé seulement au moment d'envoyer, comme sur rdv.planelia.fr (charger.js).
let script;
const charge = src => new Promise((ok, ko) => { const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = ko; document.head.append(s); });
async function jetonAntiRobot(boite) {
  let id, minuterie;
  const muet = new Promise((_, ko) => minuterie = setTimeout(ko, 20000, 'robot'));
  try {
    await Promise.race([script ||= charge('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit').catch(() => { script = null; throw 'robot'; }), muet]);
    return await Promise.race([muet, new Promise((ok, ko) => {
      id = turnstile.render(boite, {sitekey: TURNSTILE, appearance: 'interaction-only', language: 'fr',
        callback: ok, 'error-callback': () => ko('robot'), 'timeout-callback': () => ko('robot'), 'expired-callback': () => ko('robot')});
    })]);
  } finally { clearTimeout(minuterie); if (id !== undefined) turnstile.remove(id); }
}

addEventListener('DOMContentLoaded', () => {
  const d = document.getElementById('place');
  if (!d || typeof d.showModal !== 'function') return;   // vieux navigateur : le lien mailto fait le travail
  const form = d.querySelector('form'), etat = d.querySelector('.etat'), bouton = form.querySelector('button[type=submit]');
  const ouvrir = e => { e.preventDefault(); d.classList.remove('ferme'); d.showModal(); form.prenom.focus({preventScroll: true}); };
  document.querySelectorAll('a[href^="mailto:contact@planelia.fr?subject=Je"]').forEach(a => a.addEventListener('click', ouvrir));
  if (location.hash === '#place') ouvrir(new Event('ouvrir'));   // lien « Débloquer ma page » d'un aperçu flouté (Joël 13/11)
  const fermer = () => { d.classList.add('ferme'); setTimeout(() => { d.close(); d.classList.remove('ferme'); }, 380); };
  d.querySelector('.fermer').addEventListener('click', fermer);
  d.addEventListener('click', e => { if (e.target === d) fermer(); });   // clic sur le voile
  d.addEventListener('cancel', e => { e.preventDefault(); fermer(); });  // touche Échap : même sortie en douceur

  form.addEventListener('input', e => { if (e.target.getAttribute('aria-invalid') === 'true') verifie(e.target); });   // le message part dès que c'est corrigé
  form.addEventListener('submit', async e => {
    e.preventDefault();
    etat.className = 'etat'; etat.textContent = '';
    const fautes = Object.keys(AIDES).map(n => form[n]).filter(c => !verifie(c));
    if (fautes.length) { fautes[0].focus(); return; }
    bouton.disabled = true; bouton.textContent = 'Envoi…';
    const v = n => form[n].value.trim();
    let code;
    try {
      const corps = {prenom: v('prenom'), contact: v('contact'), prestations: form.prestations.value, ville: v('ville'), instagram: v('instagram'),
        piege: form.site.value, source: new URLSearchParams(location.search).get('source') || undefined, turnstile: await jetonAntiRobot(d.querySelector('.robot'))};
      const r = await fetch(FN, {method: 'POST', headers: {apikey: CLE, 'Content-Type': 'application/json'}, body: JSON.stringify(corps)});
      code = (await r.json()).code;
    } catch { code = 'reseau'; }
    bouton.disabled = false; bouton.textContent = 'Envoyer ma demande';
    if (code === 'envoye') { d.classList.add('envoye'); return; }
    etat.className = 'etat erreur'; etat.textContent = MESSAGES[code] || AUTRE;
  });
});
})();
