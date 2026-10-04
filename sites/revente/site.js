// sites/revente/site.js — Marge Revente, calculateurs pour les vendeurs en ligne.
// Charte : Atelier (lin, terre cuite et olive ; Palatino italique pour les titres),
// avec des arrondis réduits à 4 px pour un rendu plus haut de gamme.
export default {
  nom: 'Marge Revente',
  domaine: 'https://www.exemple-marge-revente.fr', // à remplacer par le vrai nom de domaine
  slogan: 'Ce qu’il vous reste vraiment après une vente',
  titreAccueil: 'Calculateurs pour la revente en ligne',
  descriptionAccueil: 'Calculateurs gratuits de marge et de bénéfice pour les vendeurs sur les plateformes en ligne.',
  introAccueil: 'Calculez votre bénéfice réel après commissions et frais d’envoi, avant de fixer un prix.',

  // Application installable sur mobile (icônes dans sites/revente/icones/).
  // raccourcis : calculateurs proposés par un appui long sur l'icône (Android).
  application: {
    nom: 'Marge Revente',
    nomCourt: 'Marge Revente',
    raccourcis: ['marge-revente'],
  },

  theme: {
    couleurPrincipale: '#2A2420',
    couleurFond: '#EFE8DC',
    couleurSurface: '#F8F3EA',
    couleurTexte: '#2A2420',
    couleurDiscret: '#6A5E52',
    couleurLigne: '#D8CCBA',
    couleurBordureChamp: '#A89684',
    couleurLien: '#9A4A2C',
    couleurFocus: '#1D4ED8',
    couleurAccent: '#9A4A2C',
    couleurErreur: '#A12A1E',
    couleurSucces: '#56613A',

    policeTitres: '"Palatino Linotype", "Book Antiqua", Palatino, "Iowan Old Style", Georgia, serif',
    policeTexte: '"Segoe UI Variable Text", "Segoe UI", "Helvetica Neue", system-ui, sans-serif',
    policeChiffres: '"Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif',
    titresGraisse: '400',
    titresStyle: 'italic',
    titresInterlettrage: '-0.01em',
    surtitreInterlettrage: '0.16em',

    trait: '1px',
    rayon: '4px',
    rayonBouton: '3px',
    rayonChamp: '4px',

    champFond: '#EFE8DC',
    champBordure: '1px solid #A89684',
    champBordureBas: '1px solid #A89684',
    champRetrait: '0.9rem',

    boutonFond: '#9A4A2C',
    boutonTexte: '#FFFFFF',
    boutonFondSurvol: '#2A2420',
    boutonTexteSurvol: '#FFFFFF',
    boutonCasse: 'none',
    boutonInterlettrage: '0.01em',

    resultatsFond: '#F8F3EA',
    resultatsTexte: '#2A2420',
    resultatsDiscret: '#6A5E52',
    resultatsBordure: '1px solid #D8CCBA',
    resultatsFilet: '4px',

    teintes: {
      marge: '#9A4A2C',
    },
  },

  editeur: {
    nom: 'À compléter',
    statut: 'Entrepreneur individuel',
    siret: 'À compléter',
    adresse: 'À compléter',
    email: 'À compléter',
  },
  hebergeur: { nom: 'À compléter', adresse: 'À compléter' },

  monetisation: {
    scriptEntete: '',
    blocPub: '',      // emplacement dans le contenu (visible aussi sur mobile)
    // Emplacements par largeur d'écran (voir moteur/style.css) :
    // - 1 600 px et plus : bandeaux gauche et droit ; 1 280 à 1 600 px : bandeau droit seul ;
    // - moins de 1 280 px : emplacement dans le contenu (300 × 250 sur mobile, 728 × 90 sur tablette).
    // Coller le code de la régie dans "gauche", "droite" et "code" ; passer apercu à false avant la mise en ligne.
    pubLaterale: { gauche: '', droite: '', largeur: 160, hauteur: 600, apercu: true },
    pubContenu: { code: '', apercu: true },

    // Google AdSense. Tant que "client" est vide, rien n'est chargé et les aperçus restent affichés.
    // 1. client : identifiant éditeur (Compte › Informations sur le compte), de la forme ca-pub-0000000000000000.
    // 2. emplacements : identifiants des blocs d'annonces créés dans AdSense (Annonces › Par bloc d'annonces),
    //    la valeur data-ad-slot, par exemple '1234567890'. Gauche et droite : bloc display 160 × 600 ;
    //    contenu : bloc display adaptatif.
    // 3. Consentement : activer dans AdSense › Confidentialité et messages › Europe un message RGPD
    //    (CMP certifiée de Google), avec le bouton « Ne pas autoriser » au premier niveau.
    adsense: {
      client: '',
      emplacements: { gauche: '', droite: '', contenu: '' },
    },
    affiliation: [
      {
        // Exemple à remplacer avant la mise en ligne.
        texte: 'Exemple de lien partenaire : fournisseur d’emballages d’expédition.',
        libelleLien: 'Voir l’offre',
        url: 'https://exemple.fr/lien-partenaire',
        pages: ['marge-revente'],
      },
    ],
  },
};
