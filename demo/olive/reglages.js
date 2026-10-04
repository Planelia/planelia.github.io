// Réglages de la page d'Sauge & Nacre : thème « naturel / minimaliste » et agenda. Le contenu est dans contenu.js.
window.PRO.reglages = {
  semaineChargee: true,   // agenda fictif presque plein cette semaine (« Plus que N places » cohérent)
  theme: {
    vars: {
      'police-titre': '"Cormorant Garamond",Georgia,serif', 'police-texte': 'Jost,system-ui,sans-serif',
      'titre-graisse': '500', 'titre-espace': '.01em',
      fond: '#fbf8f2', 'fond-uni': '#fbf8f2',
      texte: '#2f3a2a', doux: '#5d6655', titre: '#2f3a2a',
      carte: '#ffffff', bord: '#e8dcc6', champ: '#ffffff', info: '#f1e9da',
      accent: '#5b6b3a', 'accent-texte': '#ffffff', 'accent-fond': '#f3f2e6',
      creneau: '#5b6b3a', 'creneau-texte': '#ffffff',
      entete: 'linear-gradient(180deg,#f1e9da,#e8dcc6)',
      rayon: '0', 'rayon-btn': '0', 'bord-ep': '1px',
    },
    css: `
      body{font-size:16.5px}
      header h1{font-size:2.6rem}
      h2{font-size:1.7rem;font-style:italic}
      .accroche{font-style:italic;font-size:1.3rem}
      h2 .n{background:none;color:var(--accent);border:1px solid var(--accent);font-style:normal}
      .btn{text-transform:uppercase;letter-spacing:.18em;font-weight:500;font-size:.85rem}
      .avatar{border-radius:0;border-width:6px}
      .badge,.places{border-radius:0}
      .banniere{height:130px}
      .vignette{border-radius:0}
      .galerie{gap:2px}
      .etoiles{color:var(--accent)}
      .carte .t b,.carte .prix,.faq summary,.question legend{font-weight:500}`,
  },
};
