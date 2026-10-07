// Moteur de page de réservation Planélia.
// Lit window.PRO = contenu de la pro (contenu.js, généré depuis demos-contenu/<pro>/contenu.json par outils/integrer.js)
// + PRO.reglages (reglages.js : thème, agenda). Démo : rien n'est envoyé ni enregistré.
// Vraie page (rdv.planelia.fr) : charger.js remplit PRO depuis la base, et reglages.pris = créneaux occupés [[Date, Date]…].
(() => {
const P = window.PRO, R = P.reglages;
// Nombres forcés : prix, durées et frais sont insérés sans esc() dans le gabarit ; un texte glissé là devient NaN, jamais du HTML.
const nombres = (o, ...cles) => { if (o) for (const k of cles) if (k in o) o[k] = Number(o[k]); };
P.prestations.forEach(p => nombres(p, 'prix', 'duree_min'));
P.questions_avant_rdv?.forEach(q => q.options?.forEach(o => nombres(o, 'prix_plus', 'duree_plus')));
P.longueurs?.choix?.forEach(l => nombres(l, 'prix_plus', 'duree_plus'));
P.secteurs?.forEach(s => nombres(s, 'frais', 'trajet_min'));
P.avis?.forEach(a => nombres(a, 'note'));
nombres(P.conditions?.acompte, 'montant');
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
const hm = m => `${Math.floor(m/60)}h${String(m%60).padStart(2,'0')}`;
const enMin = s => { const [h, m] = s.split(':'); return h*60 + +m; };
const duree = m => m < 60 ? `${m} min` : `${Math.floor(m/60)} h${m%60 ? ' '+String(m%60).padStart(2,'0') : ''}`;
const plus = (prix, min) => [prix ? `+${prix} €` : '', min ? `+${min} min` : ''].filter(Boolean).join(' · ');
const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const REEL = !!R.pris;   // vraie page : pas de textes de démo, pas d'avis d'exemple
const ACTIF = REEL && R.reserver;   // vraie page où la réservation est branchée (charger.js fournit R.reserver)
// Signalement d'un contenu (DSA art. 16) : e-mail prérempli vers contact@, rien d'autre n'est transmis.
const signaler = () => 'mailto:contact@planelia.fr?subject=' + encodeURIComponent(`Signalement : ${P.nom || 'page Planélia'}`) + '&body=' + encodeURIComponent(
  `Adresse de la page signalée : ${location.origin + location.pathname}\n\nÉlément précis concerné (texte, photo, nom…) :\n\nCe qui pose problème, et pourquoi c'est illicite selon vous (soyez précis) :\n\n\n`
  + 'Vos nom et prénom (facultatif si le signalement concerne un mineur) :\nVotre adresse e-mail (facultatif si le signalement concerne un mineur) :\n\nJe déclare de bonne foi que les informations de ce signalement sont exactes et complètes.\n');
// agenda : {jours, ouverture, fermeture, par_jour: {"6": {fermeture}}, pas, delai_min, pause} ; pas, délai et pause (15 min par défaut) : réglages de la pro
const A = P.agenda || R.agenda, PAS = R.pas || A.pas || 30, DELAI = A.delai_min ?? 60, PAUSE = A.pause ?? 15;
const heures = d => { const h = {...A, ...A.par_jour?.[d.getDay()]}; return [enMin(h.ouverture), enMin(h.fermeture)]; };
const prenomPro = P.pro_prenom || P.nom.split(' ')[0];
const studio = P.lieu.studio, domicile = P.lieu.domicile;
const lieuxChoix = studio && domicile;
// Secteurs (un jour par ligne dans le contenu) regroupés par nom : {nom, frais, trajet, jours:[…]}
const zones = [];
for (const s of P.secteurs || []) {
  let z = zones.find(z => z.nom === s.secteur);
  if (!z) zones.push(z = {nom: s.secteur, frais: s.frais, trajet: s.trajet_min, jours: []});
  if (s.jour) z.jours.push(JOURS.indexOf(s.jour.toLowerCase()));
}
const principales = P.prestations.filter(p => !p.option), options = P.prestations.filter(p => p.option);
const longueurs = P.longueurs?.choix || [];
const aLongueur = p => p.longueur && (!P.longueurs?.applique_a || P.longueurs.applique_a.includes(p.id));
const photos = P.photos || {};
// Grille de 3 : on garde un multiple de 3 photos pour ne pas laisser de trou. Moins de 3 : cases « Photo à venir » sur une
// démo, galerie masquée sur une vraie page (la pro retire ses photos depuis son espace, jamais de case vide chez elle).
const galerie = photos.galerie?.length >= 3 ? photos.galerie.slice(0, photos.galerie.length - photos.galerie.length % 3) : REEL ? [] : Array(6).fill({});
const avatar = R.avatar || photos.profil;
// Cadrage (bannière, profil) choisi par la pro : image entière, point visé x/y (%) et zoom (%, depuis ce point). Nombres
// re-bornés ici (jamais de texte dans le style) ; zoom ≥ 100 % depuis un point du cadre : aucun vide possible.
const cadrage = c => { const n = (v, a, b, d) => Number.isInteger(v) && v >= a && v <= b ? v : d, x = n(c?.x, 0, 100, 50), y = n(c?.y, 0, 100, 50);
  return `object-position:${x}% ${y}%;transform-origin:${x}% ${y}%;transform:scale(${n(c?.zoom, 100, 300, 100) / 100})`; };

// Thème : variables CSS et CSS propre à la pro (polices servies par site/assets/fonts/polices.css)
// Styles (facultatif, contenu.json ou reglages.js) : [{nom, apercu, vars, css}] = ambiances proposées par « Essayez un autre style », appliquées par-dessus R.theme.
const STYLES = P.styles || R.styles;
// <couleurs> Couleurs perso (V3 lot 5) : la pro choisit seulement une couleur principale et un fond (+ photo de fond) ;
// toutes les variables en sont calculées ici. Contraste : mêmes paires et seuil (4,5:1) que outils/contraste.js.
const HEX = /^#[0-9a-f]{6}$/;
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const enHex = a => '#' + a.map(x => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0')).join('');
const melange = (a, b, t) => { const B = rgb(b); return enHex(rgb(a).map((x, i) => x + (B[i] - x) * t)); };   // t = 0 : a ; 1 : b
const lum = h => { const [r, g, b] = rgb(h).map(v => (v /= 255) <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return .2126 * r + .7152 * g + .0722 * b; };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + .05) / (y + .05); };
const PAIRES = [['texte', 'carte'], ['texte', 'fond-uni'], ['doux', 'carte'], ['doux', 'fond-uni'], ['titre', 'fond-uni'],
  ['accent-texte', 'accent'], ['creneau-texte', 'creneau'], ['texte', 'accent-fond'], ['accent', 'carte'], ['texte', 'info']];
const meilleur = (fond, ...c) => c.reduce((m, x) => ratio(x, fond) > ratio(m, fond) ? x : m);
function couleursVars(c) {
  if (!c || !HEX.test(c.principale) || !HEX.test(c.fond)) return null;
  const f = c.fond, a = c.principale, texte = meilleur(f, '#111111', '#ffffff'), clair = texte === '#111111';
  const carte = clair ? '#ffffff' : melange(f, '#000000', .25);
  let doux = texte;   // le plus proche du fond qui reste lisible sur la carte et le fond
  for (let t = .05; t <= .6; t += .05) { const d = melange(texte, f, t); if (ratio(d, carte) < 4.5 || ratio(d, f) < 4.5) break; doux = d; }
  const vars = {fond: f, 'fond-uni': f, texte, titre: texte, doux, carte, champ: carte, bord: melange(carte, texte, .18),
    info: melange(carte, a, .1), accent: a, 'accent-texte': meilleur(a, '#ffffff', '#111111'), 'accent-fond': melange(carte, a, .12),
    creneau: a, 'creneau-texte': meilleur(a, '#ffffff', '#111111'), entete: `linear-gradient(135deg,${melange(f, a, .25)},${f})`};
  // ponytail: photo de fond = blocs sur cartes à 94 % ; contraste calculé sur la carte seule, pas sur la photo vue au travers
  const css = typeof c.fond_photo === 'string' && /^[\w\-./:%]+$/.test(c.fond_photo)
    ? `body{background:${f} url("${c.fond_photo}") center/cover fixed}header,main{background:color-mix(in srgb,var(--carte) 94%,transparent)}main{border-radius:var(--rayon);padding-block:8px}` : '';
  return {vars, css};
}
const illisibles = v => PAIRES.filter(([x, y]) => ratio(v[x], v[y]) < 4.5);
// « Corriger pour moi » : la teinte la plus proche qui passe (fond, puis couleur principale, éclaircis ou assombris).
function corriger(c) {
  const r = {...c}, pousse = (cle, ok) => {
    for (const cible of ['#000000', '#ffffff']) for (let t = .05; t <= 1.0001; t += .05) {
      const x = melange(c[cle], cible, t); r[cle] = x; if (ok()) return;
    }
    r[cle] = c[cle];
  };
  const ok = () => !illisibles(couleursVars(r).vars).length;
  if (!ok()) pousse('fond', () => ratio(couleursVars(r).vars.texte, r.fond) >= 4.5);
  if (!ok()) pousse('principale', ok);
  return r;
}
window.planeliaCouleurs = {couleursVars, illisibles, corriger, ratio, PAIRES};
// </couleurs>
const perso = couleursVars(P.couleurs);
const theme = st => {
  document.documentElement.removeAttribute('style');
  for (const [k, v] of Object.entries({...R.theme.vars, ...st?.vars, ...perso?.vars})) document.documentElement.style.setProperty('--' + k, v);
  $('cssPro').textContent = (R.theme.css || '') + (st?.css || '') + (perso?.css || '');
};
document.head.insertAdjacentHTML('beforeend', '<style id="cssPro"></style>');
theme();
document.title = `${P.nom} — Réserver`;

// ---------- Agenda fictif : quelques RDV déjà pris, différents chaque jour ----------
const dimanche = new Date(); dimanche.setDate(dimanche.getDate() + (7 - dimanche.getDay()) % 7); dimanche.setHours(23, 59);
// Fenêtre du badge de places : vraie page = d'ici dimanche ; démos = 7 jours glissants (sinon « Complet » chaque samedi soir).
const FIN_PLACES = REEL ? dimanche : new Date(Date.now() + 7 * 864e5), QUAND_PLACES = REEL ? 'cette semaine' : 'ces 7 prochains jours';
function agendaDu(date, OUV, FERM) {
  if (R.pris) {   // vrais créneaux occupés, ramenés à l'heure MURALE de ce jour-là (heure de l'appareil) : pas en minutes
    // écoulées depuis minuit, fausses d'1 h les jours de changement d'heure (25 octobre, 29 mars)
    const j0 = new Date(date); j0.setHours(0, 0, 0, 0); const j1 = new Date(j0); j1.setDate(j1.getDate() + 1);
    const min = d => d <= j0 ? 0 : d >= j1 ? 1440 : d.getHours() * 60 + d.getMinutes();
    return R.pris.map(([a, b]) => ({debut: min(a), fin: min(b)})).filter(r => r.fin > r.debut && r.debut < 1440 && r.fin > 0);
  }
  const n = date.getDate(), L = FERM - OUV;
  // reglages.semaineChargee : sur la fenêtre du badge, journée prise sauf 1 trou de 2 h (≈ 1 RDV), matin ou après-midi selon le jour.
  if (R.semaineChargee && date <= FIN_PLACES) {
    const trous = [L > 300 ? L*(n%2 ? 0.15 : 0.6) : 0].map(d => OUV + Math.round(d/PAS)*PAS);
    return [OUV, ...trous.map(t => t + 120)].map((debut, k) => ({debut, fin: trous[k] ?? FERM})).filter(r => r.fin > r.debut);
  }
  return [[0, 90], [L*0.42 + (n%2)*30, 75 + (n%2)*30], [L*0.75 + (n%4)*15, 60]]
    .filter((_, k) => (n + k) % 4)
    .map(([d, l]) => { const debut = OUV + Math.round(d/PAS)*PAS; return {debut, fin: debut + l}; });
}
function joursOuverts(filtre, nb = 8) {
  const res = [];
  for (let d = new Date(), i = 0; res.length < nb && i < 60; d.setDate(d.getDate()+1), i++)
    if (A.jours.includes(d.getDay()) && (!filtre?.length || filtre.includes(d.getDay())))
      { const [ouv, ferm] = heures(d); res.push({date: new Date(d), ouv, ferm, pris: agendaDu(d, ouv, ferm)}); }
  return res;
}
// Un créneau est libre si son temps pris (trajet avant ; après : max(pause, trajet), comme calcul.js côté serveur)
// ne chevauche aucun temps déjà pris. Les vrais créneaux pris (R.pris) incluent déjà trajets et pauses.
// ponytail: démos : les faux RDV reçoivent un trajet fixe de 20 min (à domicile) et la pause de la pro.
function creneauxLibres(jour, dureeTot, trajet) {
  const now = new Date(), tot = jour.date.toDateString() === now.toDateString() ? now.getHours()*60 + now.getMinutes() + DELAI : 0;
  const avant = R.pris ? 0 : trajet ? 20 : 0, apres = R.pris ? 0 : Math.max(PAUSE, avant), libres = [];
  for (let t = Math.max(jour.ouv, Math.ceil(tot/PAS)*PAS); t + dureeTot <= jour.ferm; t += PAS) {
    const a = t - trajet, b = t + dureeTot + Math.max(PAUSE, trajet);
    if (jour.pris.every(r => b <= r.debut - avant || a >= r.fin + apres)) libres.push(t);
  }
  return libres;
}
// « Plus que N places » : RDV d'1 h 30 qu'on peut encore caser d'ici FIN_PLACES.
function placesSemaine() {
  let n = 0;
  for (const j of joursOuverts(null, 7).filter(j => j.date <= FIN_PLACES)) {
    let t = -1;
    for (const s of creneauxLibres(j, 90, 0)) if (s >= t) { n++; t = s + 90 + PAUSE; }
  }
  return n;
}

// ---------- Construction de la page ----------
const detailHTML = p => (p.description || p.inclus || p.tenue || p.conseils) ? `<details class="detail"><summary>Voir le détail</summary>
  ${p.description ? `<p>${esc(p.description)}</p>` : ''}
  ${p.inclus?.length ? `<p><b>Inclus :</b> ${p.inclus.map(esc).join(' · ')}</p>` : ''}
  ${p.tenue && p.tenue !== '—' ? `<p><b>Tenue :</b> ${esc(p.tenue)}</p>` : ''}
  ${p.conseils ? `<p><b>Conseil :</b> ${esc(p.conseils)}</p>` : ''}
  ${p.photo ? `<img src="${esc(p.photo)}" alt="${esc(p.nom)}" loading="lazy">` : ''}</details>` : '';

const cats = P.categories?.length ? P.categories : [{nom: ''}];
const prestaHTML = cats.map(c => {
  const liste = principales.filter(p => !c.id || p.categorie === c.id);
  return !liste.length ? '' : (c.nom && cats.length > 1 ? `<h3 class="cat">${esc(c.nom)}</h3>` : '') + `<div class="choix">` + liste.map(p => `
  <div class="presta">
    <label class="carte"><input type="radio" name="presta" value="${P.prestations.indexOf(p)}">
      <span class="t"><b>${esc(p.nom)}</b><span class="muted">${duree(p.duree_min)}${aLongueur(p) ? ' · selon la longueur' : ''}</span></span>
      <span class="prix">${p.a_partir_de ? '<small>à partir de</small>' : ''}${p.prix} €</span></label>
    ${detailHTML(p)}
  </div>`).join('') + `</div>`;
}).join('');

const optionHTML = o => `<div class="presta"><label class="carte"><input type="checkbox" name="option" value="${P.prestations.indexOf(o)}">
  <span class="t"><b>${esc(o.nom)}</b><span class="muted">+${duree(o.duree_min)}</span></span>
  <span class="prix">${o.a_partir_de ? '<small>dès</small>' : ''}+${o.prix} €${o.unite ? `<small>${esc(o.unite)}</small>` : ''}</span></label>${detailHTML(o)}</div>`;

const questionHTML = (q, i) => q.options ? `<fieldset class="question"><legend>${esc(q.question)}</legend>
  ${q.options.map((o, k) => `<label><input type="radio" name="q${i}" value="${k}"${k ? '' : ' checked'}><span>${esc(o.label)}</span>
    <small>${plus(o.prix_plus, o.duree_plus)}</small></label>`).join('')}</fieldset>`
  : REEL ? '' : `<label class="champ">${esc(q.question)} ${q.statut ? `<span class="prevu">${esc(q.statut)}</span>` : ''}</label>
     <input type="text" disabled placeholder="${esc(q.aide || 'Bientôt disponible')}" class="lien-off">`;

const cond = {...P.conditions};
if (REEL) delete cond.acompte;   // acompte = option payante pas encore codée : jamais affiché sur une vraie page
const conditionsListe = [...(cond.a_cocher || []), ...(cond.acompte ? [cond.acompte.texte] : [])];
const NOMS_CONTACT = {instagram: 'Instagram', whatsapp: 'WhatsApp', telephone: 'Appeler', tiktok: 'TikTok'};

// Mentions (V3 lot 5, champs et lignes fixes donnés par Juridique le 07/10) : remplies par la pro, texte brut ; champs vides
// non affichés (publication avec des vides : règle REGLES.mentionsObligatoires côté serveur).
function mentionsHTML() {
  const M = P.mentions || {}, societe = M.statut === 'Société', ligne = (nom, v) => v ? `<dt>${nom}</dt><dd>${esc(v)}</dd>` : '';
  const id = M.siret ? `${M.siret.length === 9 ? 'SIREN' : 'SIRET'} ${M.siret}` : '';
  return `<dialog id="mentions" aria-labelledby="mentionsTitre"><h2 id="mentionsTitre">Infos légales du salon</h2><dl>
  ${ligne(societe ? 'Dénomination sociale' : 'Nom et prénoms', M.nom)}${ligne('Nom commercial', M.nom_commercial)}${ligne('Statut', M.statut)}
  ${societe ? ligne('Forme', M.forme) + ligne('Capital', M.capital && M.capital + ' €') : ''}${ligne(M.siret?.length === 9 ? 'SIREN' : 'SIRET', M.siret)}
  ${ligne('Adresse', M.adresse)}${ligne('Téléphone', M.telephone)}${ligne('E-mail', M.email)}
  ${societe ? ligne('Directeur de la publication', M.directeur_publication) : ''}${ligne('Titre ou diplôme', M.titre_diplome)}</dl>
  ${M.nom ? `<p>Cette page est éditée par ${esc(M.nom)}${M.statut ? ` (${esc(M.statut)})` : ''}${id ? `, ${esc(id)}` : ''}.</p>` : ''}
  <p>Hébergement technique : Cloudflare, Inc., 101 Townsend Street, San Francisco, CA 94107, États-Unis, pour le compte du service Planélia (contact@planelia.fr).</p>
  <p>Données personnelles : <a href="${R.racine ?? '../../'}confidentialite.html">planelia.fr/confidentialite</a>.</p>
  <p><a href="${esc(signaler())}">Signaler cette page</a></p>
  <button type="button" class="btn sec" autofocus>Fermer</button></dialog>`;
}
// Blocs libres (V3 lot 5) : P.sections = [{id, titre?, masque?}] dans l'ordre voulu ; blocs absents de la liste ensuite,
// dans l'ordre par défaut ; titres par défaut si rien n'est choisi ; la réservation n'est jamais masquée.
const S = Object.fromEntries((Array.isArray(P.sections) ? P.sections : []).map(x => [x.id, x]));
const titre = (id, defaut) => esc(S[id]?.titre || defaut);
const BLOC = {
  realisations: () => `
  ${galerie.length ? `<h2>${titre('realisations', 'Réalisations')}</h2>
  <div class="galerie">${galerie.map((g, i) => g.fichier
    ? `<button type="button" class="vignette" data-i="${i}" aria-label="Agrandir : ${esc(g.legende)}"><img src="${esc(g.fichier)}" alt="${esc(g.legende)}" loading="lazy"></button>`
    : `<div class="vignette vide">Photo à venir</div>`).join('')}</div>` : ''}`,
  reservation: () => `
${S.reservation?.titre ? `<h2>${esc(S.reservation.titre)}</h2>` : ''}
<form id="resa" novalidate>
  <h2><span class="n">1</span>Prestation</h2>
  ${prestaHTML}
  <div class="precisions" id="precisions" hidden>
    <div id="blocLongueur" hidden><h3 class="cat" style="margin:6px 0 8px">Longueur</h3>
      <div class="longueurs">${longueurs.map((l, i) => `<label><input type="radio" name="longueur" value="${i}"${i ? '' : ' checked'}>${esc(l.id)}<small>${l.prix_plus ? '+' + l.prix_plus + ' €' : 'inclus'}</small></label>`).join('')}</div></div>
    ${options.length ? `<h3 class="cat" style="margin:6px 0 0">Options</h3>${options.map(optionHTML).join('')}` : ''}
    ${P.questions_avant_rdv?.length ? `<h3 class="cat" style="margin:6px 0 0">Pour prévoir le bon temps</h3>${P.questions_avant_rdv.map(questionHTML).join('')}` : ''}
  </div>

  <h2><span class="n">2</span>Lieu</h2>
  ${lieuxChoix ? `<div class="choix lieux">
    <label class="carte"><input type="radio" name="lieu" value="studio"><b>Chez ${esc(prenomPro)}</b><span class="muted">L’adresse exacte après réservation</span></label>
    <label class="carte"><input type="radio" name="lieu" value="domicile"><b>À domicile</b><span class="muted">${esc(prenomPro)} se déplace chez vous</span></label>
  </div>` : `<div class="carte lieu-unique"><input type="radio" name="lieu" value="${studio ? 'studio' : 'domicile'}" checked hidden>
    <span class="t"><b>${studio ? `Chez ${esc(prenomPro)}` : 'À domicile uniquement'}</b>${studio ? '' : `<span class="muted">${esc(P.lieu.texte || P.lieu.adresse_publique)}</span>`}</span></div>`}
  ${studio ? `<div id="blocStudio" class="info"${lieuxChoix ? ' hidden' : ''}>🔒 L’adresse exacte vous est communiquée une fois le rendez-vous confirmé.</div>` : ''}
  ${zones.length ? `<div id="blocDomicile" hidden>
    <label class="champ" for="zone">Votre secteur</label>
    <select id="zone">${zones.map((z, i) => `<option value="${i}">${esc(z.nom)} — ${z.frais ? '+' + z.frais + ' €' : 'sans frais'}</option>`).join('')}</select>
    <div id="infoZone" class="info"></div>
  </div>` : ''}

  <h2><span class="n">3</span>Date et heure</h2>
  <p id="aideCal" class="muted">Choisissez d’abord une prestation${lieuxChoix ? ' et un lieu' : ''}.</p>
  <div id="cal" hidden>
    <div class="jours" id="jours"></div>
    <div class="creneaux" id="creneaux"></div>
    <p id="noteTrajet" class="muted"></p>
    ${REEL ? '' : '<button type="button" class="btn sec" disabled style="font-size:.9rem;padding:10px">Prévenez-moi si un créneau se libère <span class="prevu">prévu</span></button>'}
  </div>

  <h2><span class="n">4</span>Vos coordonnées</h2>
  <label class="champ" for="prenom">Prénom</label>
  <input type="text" id="prenom" autocomplete="given-name">
  <label class="champ" for="email">E-mail</label>
  <input type="email" id="email" autocomplete="email" inputmode="email" required aria-describedby="aideEmail">
  <p id="aideEmail" class="muted" style="margin:6px 0 0">Vous recevrez un e-mail pour confirmer votre rendez-vous.</p>
  <label class="champ" for="tel">Téléphone</label>
  <input type="tel" id="tel" autocomplete="tel" inputmode="tel" placeholder="06 39 98 12 34" pattern="^(\\+33\\s?|0)[1-9]([\\s.\\-]?\\d{2}){4}$">
  <div id="blocAdresse" hidden>
    <label class="champ" for="adresse">Adresse du rendez-vous</label>
    <input type="text" id="adresse" autocomplete="street-address">
  </div>
  <p id="erreur" class="info" role="alert" hidden></p>
  <button class="btn">Vérifier ma réservation</button>
</form>

<section id="recap" class="panneau" hidden aria-live="polite">
  <h2 style="margin:0">Récapitulatif</h2>
  <dl id="recapListe"></dl>
  <div class="conditions">
    <details><summary>Conditions de ${esc(prenomPro)}</summary><ul>${conditionsListe.map(c => `<li>${esc(c)}</li>`).join('')}</ul></details>
    <label style="display:flex;gap:10px;margin-top:10px"><input type="checkbox" id="lu" aria-describedby="erreurLu" style="accent-color:var(--accent);width:20px;height:20px;flex:none"> J’ai lu et j’accepte les conditions (retard, annulation${cond.acompte ? ', acompte' : ''}).</label>
    <p id="erreurLu" class="info" role="alert" hidden>Cochez la case pour confirmer.</p>
  </div>
  <p id="erreurRecap" class="info" role="alert" hidden></p>
  ${R.apercu ? '<button class="btn" id="confirmer" disabled>Aperçu : la réservation est désactivée</button><p class="muted">Rien n’est envoyé depuis un aperçu.</p>'
    : REEL && !ACTIF ? '<button class="btn" id="confirmer" disabled>Réservation en ligne bientôt disponible</button><p class="muted">Rien n’a été envoyé ni enregistré.</p>'
    : '<button class="btn" id="confirmer">Confirmer le rendez-vous</button>'}
  <button class="btn sec" id="modifier">Modifier</button>
</section>

<section id="fini" class="panneau ok" hidden aria-live="polite">
  <div class="coche">✓</div>
  <h2 id="finiTitre"></h2>
  <p id="finiTexte"></p>
  ${REEL ? '' : `<p class="muted">Démonstration : aucun message n’a été envoyé et aucune donnée n’a été enregistrée. Dans la vraie version, un e-mail de confirmation vous serait envoyé.</p>
  <button class="btn sec" id="recommencer">Recommencer la démo</button>`}
</section>`,
  avis: () => `
  ${P.avis?.length && !REEL ? `<h2>${titre('avis', 'Avis')} <span class="prevu">avis d’exemple</span></h2>
  <div class="avis">${P.avis.map(a => `<figure><span class="etoiles" aria-label="${a.note} sur 5">${'★'.repeat(a.note)}${'☆'.repeat(5 - a.note)}</span>
    <blockquote>${esc(a.texte)}</blockquote><figcaption>${esc(a.prenom)} · ${esc(a.prestation)}</figcaption></figure>`).join('')}</div>` : ''}`,
  infos: () => `
  ${P.faq?.length ? `<h2>${titre('infos', 'Infos pratiques')}</h2>
  <div class="faq">${P.faq.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.r)}</p></details>`).join('')}</div>` : ''}`
};
const BLOCS = [...new Set([...Object.keys(S), ...Object.keys(BLOC)])].filter(id => Object.hasOwn(BLOC, id) && (id === 'reservation' || !S[id]?.masque));

document.body.innerHTML = `
<div class="banniere">${photos.banniere ? `<img src="${esc(photos.banniere)}" alt="" style="${cadrage(photos.cadrage?.banniere)}">` : ''}</div>
<header>
  ${avatar ? `<div class="avatar"><img src="${esc(avatar)}" alt="${esc(P.nom)}" style="${R.avatar ? '' : cadrage(photos.cadrage?.profil)}"></div>` : `<div class="avatar mono" aria-hidden="true">${esc(P.nom[0])}</div>`}
  <h1>${esc(P.nom)}</h1>
  <p class="metier">${esc(P.metier)} · ${esc(P.ville)}</p>
  ${STYLES?.length ? `<div class="styles" role="group" aria-labelledby="stylesTitre"><span id="stylesTitre">Essayez un autre style</span>
    ${STYLES.map((st, i) => `<button type="button" data-style="${i}" aria-pressed="${!i}"><i style="background:${esc(st.apercu)}"></i>${esc(st.nom)}</button>`).join('')}</div>` : ''}
  ${P.accroche ? `<p class="accroche">${esc(P.accroche)}</p>` : ''}
  <p class="bio">${esc(P.bio)}</p>
  <div class="badges"><span class="badge">📍 ${esc(P.lieu.adresse_publique)}</span>${P.horaires ? `<span class="badge">🕒 ${esc(P.horaires)}</span>` : ''}</div>
  ${P.badges?.length ? `<div class="confiance">${P.badges.map(c => `<span>${esc(c)}</span>`).join('')}</div>` : ''}
  ${REEL ? '' : `<div class="contacts">${Object.keys(P.contact || {}).filter(k => NOMS_CONTACT[k])
    .map(k => `<button type="button" disabled title="Désactivé dans la démo">${NOMS_CONTACT[k]}</button>`).join('')}</div>
  <p class="muted" style="margin:6px 0 0;font-size:.75rem">Contacts désactivés dans la démo</p>`}
  <span class="places" id="places" hidden></span>
  <a class="btn" href="#resa" style="max-width:320px;margin:16px auto 0">Prendre rendez-vous</a>
</header>
<main>
${BLOCS.map(id => BLOC[id]()).join('\n')}




  ${REEL ? '' : `<div class="pour-pros"><b>Vous êtes pro ? Votre page, sur mesure.</b><p>Couleurs, photos, prestations, infos : on la fait à votre image. On cherche 10&nbsp;pros pour tester gratuitement.</p><a class="pp-btn" href="https://tally.so/r/gDRAOJ?ref=demo" rel="noopener">Tester gratuitement</a><a class="pp-mail" href="https://www.instagram.com/planelia.fr/" rel="noopener">ou nous écrire sur Instagram</a><a class="pp-mail" href="mailto:contact@planelia.fr">ou par e-mail : contact@planelia.fr</a></div>`}
  <p class="signature">Réservation propulsée par <span>Planélia</span>${REEL ? '' : `<br><a href="${R.racine ?? '../../'}demo/index.html">Voir les autres exemples</a>`}</p>
  <p class="legal">${ACTIF ? 'Vos coordonnées servent uniquement à ce rendez-vous.' : REEL ? 'Aucune donnée n’est enregistrée tant que la réservation en ligne n’est pas active.' : 'Exemple fictif : aucune donnée n’est enregistrée.'}<br><a href="${R.racine ?? '../../'}mentions-legales.html">Mentions légales</a> · <a href="${R.racine ?? '../../'}confidentialite.html">Confidentialité</a>${REEL ? ` · <a href="${esc(signaler())}">Signaler cette page</a> · <a href="#mentions" id="lienMentions">Infos légales du salon</a>` : ''}</p>
</main>
<dialog id="zoom"><img alt=""><p></p><button type="button">Fermer</button></dialog>
${REEL ? mentionsHTML() : ''}
<div class="bandeau">${esc(R.bandeau || 'Exemple de démonstration — Planélia est en test')}</div>`;

// ---------- Essayez un autre style (démo polyvalente) ----------
if (STYLES?.length) {
  const boutons = document.querySelectorAll('[data-style]');
  document.querySelector('.styles').onclick = e => {
    const b = e.target.closest('[data-style]'); if (!b) return;
    theme(STYLES[b.dataset.style]);
    boutons.forEach(x => x.setAttribute('aria-pressed', x === b));
  };
  theme(STYLES[0]);
}

// ---------- Galerie : agrandissement au toucher ----------
if ($('mentions')) {
  $('lienMentions').onclick = e => { e.preventDefault(); $('mentions').showModal(); };
  $('mentions').querySelector('button').onclick = () => $('mentions').close();
}
const zoom = $('zoom');
const grille = document.querySelector('.galerie');
if (grille) grille.onclick = e => {
  const b = e.target.closest('.vignette[data-i]'); if (!b) return;
  const g = galerie[b.dataset.i];
  zoom.querySelector('img').src = g.fichier; zoom.querySelector('img').alt = g.legende; zoom.querySelector('p').textContent = g.legende;
  zoom.showModal();
};
zoom.onclick = () => zoom.close();

// ---------- État du formulaire ----------
const choisi = nom => document.querySelector(`[name="${nom}"]:checked`)?.value;
const etat = () => {
  const i = choisi('presta'), p = i != null ? P.prestations[i] : null;
  const lieu = choisi('lieu');
  const zone = lieu === 'domicile' && zones.length ? zones[$('zone').value] : null;
  const ajouts = [];   // {nom, prix, duree}
  if (p && aLongueur(p)) { const l = longueurs[choisi('longueur')]; if (l.prix_plus || l.duree_plus) ajouts.push({nom: 'Longueur ' + l.label, prix: l.prix_plus, duree: l.duree_plus}); }
  document.querySelectorAll('[name=option]:checked').forEach(x => { const o = P.prestations[x.value]; ajouts.push({nom: o.nom, prix: o.prix, duree: o.duree_min}); });
  (P.questions_avant_rdv || []).forEach((q, k) => {
    const o = q.options?.[choisi('q' + k)];
    if (o && (o.prix_plus || o.duree_plus)) ajouts.push({nom: o.note || (q.question ? `${q.question.replace(/\s*\?\s*$/, '')} : ${o.label}` : o.label), prix: o.prix_plus, duree: o.duree_plus});
  });
  const somme = c => ajouts.reduce((s, a) => s + (a[c] || 0), 0);
  return {p, lieu, zone, ajouts, prix: p ? p.prix + somme('prix') : 0, dureeTot: p ? p.duree_min + somme('duree') : 0,
    jour: choisi('jour'), heure: choisi('heure')};
};

let jours = [], cleJours = null;
function maj() {
  const s = etat();
  $('precisions').hidden = !s.p;
  $('blocLongueur').hidden = !(s.p && aLongueur(s.p));
  if (studio) $('blocStudio').hidden = s.lieu !== 'studio';
  if (zones.length) $('blocDomicile').hidden = s.lieu !== 'domicile';
  $('blocAdresse').hidden = s.lieu !== 'domicile';
  if (s.zone) $('infoZone').textContent = `🚗 Déplacement : ${s.zone.frais ? s.zone.frais + ' €' : 'offert'} · environ ${s.zone.trajet} min de trajet`
    + (s.zone.jours.length ? `. ${prenomPro} passe dans ce secteur le ${s.zone.jours.map(j => JOURS[j]).join(' et le ')} : en regroupant les rendez-vous par quartier, elle passe moins de temps sur la route et peut vous proposer plus de créneaux.` : '');

  const pret = s.p && s.lieu;
  $('cal').hidden = !pret; $('aideCal').hidden = pret;
  if (!pret) return;
  const cle = String(s.zone?.jours);
  if (cle !== cleJours) {          // les jours proposés dépendent du secteur
    cleJours = cle; jours = joursOuverts(s.zone?.jours);
    $('jours').innerHTML = jours.map((j, i) => `<label><input type="radio" name="jour" value="${i}"${i ? '' : ' checked'}>
      <small>${j.date.toLocaleDateString('fr-FR', {weekday: 'short'})}</small><b>${j.date.getDate()}</b>
      <small>${j.date.toLocaleDateString('fr-FR', {month: 'short'})}</small></label>`).join('');
  }
  const trajet = s.zone ? s.zone.trajet : 0;
  const libres = creneauxLibres(jours[choisi('jour')], s.dureeTot, trajet);
  $('creneaux').innerHTML = libres.length
    ? libres.map(t => `<label><input type="radio" name="heure" value="${t}"${String(t) === s.heure ? ' checked' : ''}>${hm(t)}</label>`).join('')
    : '<p class="muted" style="grid-column:1/-1">Plus de place ce jour-là, essayez un autre jour.</p>';
  $('noteTrajet').textContent = `Durée prévue : ${duree(s.dureeTot)}.` + (trajet ? ` Les horaires tiennent compte de ${trajet} min de trajet avant et après.` : '');
}
$('resa').addEventListener('change', e => { if (e.target.name !== 'heure') maj(); });
if (!lieuxChoix) maj();

const places = placesSemaine();
if (places <= 6 && (places || !REEL)) { $('places').hidden = false; $('places').textContent = places ? (places > 1 ? `Plus que ${places} places ${QUAND_PLACES}` : `Plus qu’une place ${QUAND_PLACES}`) : `Complet ${QUAND_PLACES}`; }

// ---------- Récap, conditions, confirmation ----------
const dateLongue = s => jours[s.jour].date.toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long'});
function recap() {
  const s = etat();
  const nbsp = t => String(t).replace(/ /g, ' ');
  const lignes = [['Prestation', s.p.nom], ['Prix', nbsp(`${s.p.a_partir_de ? 'dès ' : ''}${s.p.prix} €`)], ...s.ajouts.map(a => [a.nom, nbsp(plus(a.prix, a.duree))]),
    ['Durée', duree(s.dureeTot)], ['Quand', `${dateLongue(s)} à ${hm(+s.heure)}`],
    ['Où', s.lieu === 'domicile' ? `À domicile — ${$('adresse').value}` : `Chez ${prenomPro}`]];
  if (s.zone) lignes.push(['Déplacement', s.zone.frais ? s.zone.frais + ' €' : 'offert']);
  lignes.push(['Prénom', $('prenom').value], ['E-mail', $('email').value], ['Téléphone', nbsp($('tel').value)]);
  const estime = s.p.a_partir_de || [...document.querySelectorAll('[name=option]:checked')].some(x => P.prestations[x.value].a_partir_de);
  const total = s.prix + (s.zone ? s.zone.frais : 0);
  $('recapListe').innerHTML = lignes.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')
    + `<div class="total"><dt>Total${estime ? ' estimé' : ''}</dt><dd>${total} €</dd></div>`
    + (cond.acompte ? `<div><dt>Acompte <span class="prevu">${esc(cond.acompte.statut || 'prévu')}</span></dt><dd>${cond.acompte.montant} €</dd></div>` : '');
  return s;
}
$('resa').addEventListener('submit', ev => {
  ev.preventDefault();
  const s = etat();
  const manque = !s.p ? 'Choisissez une prestation.' : !s.lieu ? 'Choisissez un lieu.' : !s.heure ? 'Choisissez un horaire.'
    : !$('prenom').value.trim() ? 'Indiquez votre prénom.' : !$('email').value.trim() || !$('email').checkValidity() ? 'Indiquez une adresse e-mail valide.'
    : !$('tel').value.trim() || !$('tel').checkValidity() ? 'Indiquez un numéro de téléphone valide.'
    : s.lieu === 'domicile' && !$('adresse').value.trim() ? 'Indiquez l’adresse du rendez-vous.' : '';
  $('erreur').textContent = manque; $('erreur').hidden = !manque;
  if (manque) return;
  recap();
  $('resa').hidden = true; $('recap').hidden = false; $('recap').scrollIntoView();
});
if (!REEL) $('recommencer').onclick = () => location.reload();
$('modifier').onclick = () => { $('recap').hidden = true; $('resa').hidden = false; };
$('lu').onchange = () => { if ($('lu').checked) { $('erreurLu').hidden = true; $('lu').removeAttribute('aria-invalid'); } };
$('confirmer').onclick = () => {
  if (!$('lu').checked) { $('erreurLu').hidden = false; $('lu').setAttribute('aria-invalid', 'true'); $('lu').focus(); return; }
  if (ACTIF) return envoyer();
  const s = recap(), quand = `${dateLongue(s)} à ${hm(+s.heure)}`;
  const adresse = P.lieu.adresse_exacte_apres_resa || 'adresse fictive de démonstration';
  $('finiTitre').textContent = `C’est noté, ${$('prenom').value.trim()} !`;
  $('finiTexte').textContent = s.lieu === 'domicile'
    ? `${prenomPro} viendra chez vous ${quand}. Vous recevriez un e-mail de confirmation et un rappel la veille.`
    : `Rendez-vous ${quand}, au ${adresse}. Vous recevriez cette adresse par e-mail, avec un rappel la veille.`;
  $('recap').hidden = true; $('fini').hidden = false; $('fini').scrollIntoView();
};

// Vraie page : la demande part au serveur, qui recalcule tout et envoie un lien de confirmation par e-mail.
const ERREURS = {pris: 'Ce créneau vient d’être pris. Choisissez-en un autre.', trop: 'Vous avez déjà le nombre maximum de rendez-vous à venir ici.',
  refuse: `La réservation en ligne n’est pas possible. Contactez directement ${prenomPro}.`, robot: 'La vérification anti-robot n’a pas abouti. Réessayez dans un instant.',
  invalide: 'Une information semble incorrecte. Vérifiez vos choix et vos coordonnées.', indisponible: 'Cette page n’accepte pas de réservation pour le moment.',
  page_modifiee: 'Cette page vient d’être mise à jour. Elle se recharge : refaites votre choix.'};
async function envoyer() {
  const s = etat(), d = jours[s.jour].date, b = $('confirmer');
  b.disabled = true; b.textContent = 'Envoi…'; $('erreurRecap').hidden = true;
  const r = await R.reserver({prenom: $('prenom').value.trim(), email: $('email').value.trim(), telephone: $('tel').value.trim(), choix: {
    prestation: +choisi('presta'), options: [...document.querySelectorAll('[name=option]:checked')].map(x => +x.value),
    longueur: +(choisi('longueur') ?? 0), reponses: (P.questions_avant_rdv || []).map((q, k) => +(choisi('q' + k) ?? 0)),
    lieu: s.lieu, secteur: s.zone ? +$('zone').value : null, adresse: s.lieu === 'domicile' ? $('adresse').value.trim() : null,
    // ponytail: heure de l'appareil supposée = heure de Paris ; le serveur refuse un horaire hors grille
    debut: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, +s.heure).toISOString()}});
  b.disabled = false; b.textContent = 'Confirmer le rendez-vous';
  if (r.code !== 'ok') { $('erreurRecap').textContent = ERREURS[r.code] || 'Un problème est survenu. Réessayez dans un instant.'; $('erreurRecap').hidden = false; return; }
  $('finiTitre').textContent = `Plus qu’une étape, ${$('prenom').value.trim()} !`;
  $('finiTexte').textContent = `Nous venons d’envoyer un e-mail à ${$('email').value.trim()}. Cliquez sur le lien qu’il contient dans les 30 minutes pour confirmer votre rendez-vous. Pensez à regarder dans les courriers indésirables.`;
  document.querySelector('#fini .coche').textContent = '✉';
  $('recap').hidden = true; $('fini').hidden = false; $('fini').scrollIntoView();
}

})();
