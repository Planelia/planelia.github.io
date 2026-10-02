// Réglages de la page de Zélia : thème « bold » (sombre, chrome, néon) et agenda. Le contenu est dans contenu.js.
window.PRO.reglages = {
  theme: {
    vars: {
      'police-titre': 'Unbounded,system-ui,sans-serif', 'police-texte': '"Space Grotesk",system-ui,sans-serif',
      'titre-graisse': '800', 'titre-casse': 'uppercase', 'titre-espace': '.01em',
      fond: 'radial-gradient(120% 60% at 100% 0,#4a1550 0,transparent 60%),radial-gradient(90% 50% at 0 45%,#2a1045 0,transparent 60%),#14101a',
      'fond-uni': '#14101a',
      texte: '#f5f0fa', doux: '#c9bfd6', titre: '#ffffff',
      carte: '#221a2b', bord: '#3d2850', champ: '#221a2b', info: '#2a1d36',
      accent: '#ff3ea5', 'accent-texte': '#14101a', 'accent-fond': '#2e1634',
      creneau: '#a970ff', 'creneau-texte': '#14101a',
      entete: 'linear-gradient(120deg,#ff3ea5,#a970ff 45%,#2b0f3a)',
      rayon: '4px', 'rayon-btn': '4px', 'bord-ep': '2px',
    },
    css: `
      h1{background:linear-gradient(100deg,#fff 0,#b9bccb 30%,#fff 50%,#8f95ad 70%,#fff 100%);-webkit-background-clip:text;background-clip:text;color:transparent;font-size:1.9rem}
      h2{font-size:1.05rem}
      .accroche{font-size:.95rem;color:#ff3ea5;text-transform:uppercase;letter-spacing:.04em}
      .btn{text-transform:uppercase;letter-spacing:.08em;box-shadow:0 0 22px #ff3ea555}
      .btn.sec{box-shadow:none}
      .presta:has(input:checked),.carte:has(input:checked){box-shadow:0 0 0 1px var(--accent),0 0 18px #ff3ea540}
      .lieu-unique{box-shadow:none!important;border-color:var(--bord)!important;background:var(--carte)!important}
      .creneaux label:has(input:checked),.longueurs label:has(input:checked){box-shadow:0 0 16px #a970ff66}
      .avatar{border-color:#ff3ea5;box-shadow:0 0 24px #ff3ea566}
      .banniere{height:170px}
      h2 .n{border-radius:4px}
      .etoiles{color:#ffd23f}
      .signature span{background:var(--sauge-clair)}`,
  },
};
