// Réglages de la page de Maëlle : thème 2 « motifs manucure » (validé) et agenda. Le contenu est dans contenu.js.
window.PRO.reglages = {
  avatar: 'avatar.svg',                       // main dessinée validée (en-tête A) au lieu de photos/profil.jpg
  theme: {
    vars: {
      'police-titre': '"DM Serif Display",Georgia,serif', 'police-texte': 'Inter,system-ui,sans-serif',
      fond: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' fill='none' stroke='%23b0466a' stroke-opacity='.13' stroke-width='1.5' stroke-linejoin='round'%3E%3Cg transform='translate(18 18)'%3E%3Crect y='12' width='16' height='18' rx='4'/%3E%3Crect x='5' width='6' height='12' rx='1.5'/%3E%3C/g%3E%3Cpath d='M84 30c-4-6-12-3-10 3 1 4 10 9 10 9s9-5 10-9c2-6-6-9-10-3z'/%3E%3Cpath d='M30 76c-6 8-6 14 0 14s6-6 0-14z'/%3E%3Cg transform='translate(82 70)'%3E%3Cpath d='M0 24V9a8 8 0 0 1 16 0v15'/%3E%3Cpath d='M3.5 11a4.5 4.5 0 0 1 9 0v4h-9z'/%3E%3C/g%3E%3C/svg%3E") 0 0/120px 120px,#fdf6f5`,
      'fond-uni': '#fdf6f5',
      texte: '#2f3a33', doux: '#6e5a60', titre: '#5b3442',
      carte: '#fff', bord: '#f0dcdc', champ: '#fff', info: '#fbe8ec',
      accent: '#b0466a', 'accent-texte': '#fff', 'accent-fond': '#fdf0f3',
      creneau: '#b0466a', 'creneau-texte': '#fff',
      entete: 'linear-gradient(135deg,#f8d7dd,#fbe9e3 60%,#f3dfe1)',
    },
    css: `.banniere{height:140px}`,
  },
};
