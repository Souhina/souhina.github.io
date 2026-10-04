// sites/immo/site.js — Pierre Angulaire, calculateurs immobiliers.
// Charte : Maison de pierre (ivoire, encre et laiton ; Didone pour titres et montants).
export default {
  nom: 'Pierre Angulaire',
  // Logo en HTML : « Angulaire » en laiton italique, comme dans la charte.
  marqueHtml: 'Pierre <span style="font-style: italic; color: var(--couleur-lien)">Angulaire</span>',
  domaine: 'https://www.exemple-pierre-angulaire.fr', // à remplacer par le vrai nom de domaine
  slogan: 'Chaque acquisition mérite un calcul juste',
  titreAccueil: 'Calculateurs immobiliers',
  descriptionAccueil: 'Calculateurs gratuits pour estimer la rentabilité et le coût de vos investissements immobiliers.',
  introAccueil: 'Des outils sobres pour chiffrer un investissement avant de vous engager. Aucune inscription, aucun enregistrement de vos données.',

  // Application installable sur mobile (icônes dans sites/immo/icones/).
  // raccourcis : calculateurs proposés par un appui long sur l'icône (Android).
  application: {
    nom: 'Pierre Angulaire, calculateurs immobiliers',
    nomCourt: 'Pierre Angulaire',
    raccourcis: ['rentabilite-locative'],
  },

  theme: {
    couleurPrincipale: '#1C1A17',
    couleurFond: '#F5F0E6',
    couleurSurface: '#FBF8F2',
    couleurTexte: '#1C1A17',
    couleurDiscret: '#5E574C',
    couleurLigne: '#D9D0BF',
    couleurBordureChamp: '#5E574C',
    couleurLien: '#7D5F24',
    couleurFocus: '#1D4ED8',
    couleurAccent: '#7D5F24',
    couleurErreur: '#A12A1E',
    couleurSucces: '#2F6B3A',

    // Didot n'existe pas sous Windows : Bodoni MT (Office) puis Georgia prennent le relais.
    // Pour un rendu identique partout, auto-héberger Playfair Display (licence OFL) en WOFF2.
    policeTitres: 'Didot, "Bodoni 72", "Bodoni MT", "Playfair Display", Georgia, serif',
    policeTexte: '"Palatino Linotype", "Book Antiqua", Palatino, "Iowan Old Style", Georgia, serif',
    policeChiffres: 'Didot, "Bodoni 72", "Bodoni MT", "Playfair Display", Georgia, serif',
    titresGraisse: '400',
    titresInterlettrage: '-0.02em',
    surtitreInterlettrage: '0.28em',

    trait: '1px',
    rayon: '0',
    rayonBouton: '0',
    rayonChamp: '0',

    // Champs soulignés seulement
    champFond: 'transparent',
    champBordure: '0 solid transparent',
    champBordureBas: '2px solid #5E574C',
    champRetrait: '0',

    // L'encre pour agir, le laiton au survol
    boutonFond: '#1C1A17',
    boutonTexte: '#F5F0E6',
    boutonFondSurvol: '#7D5F24',
    boutonTexteSurvol: '#FFFFFF',
    boutonCasse: 'uppercase',
    boutonInterlettrage: '0.14em',

    resultatsFond: '#FBF8F2',
    resultatsTexte: '#1C1A17',
    resultatsDiscret: '#5E574C',
    resultatsBordure: '1px solid #D9D0BF',
    resultatsFilet: '4px',

    teintes: {
      rentabilite: '#2F5A4A',
      notaire: '#2E4A6B',
      revente: '#7A3B2E',
      emprunt: '#5C5346',
      mensualite: '#5E5D22',
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
    scriptEntete: '', // script de la régie publicitaire + bannière de consentement
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
    affiliation: [],
  },
};
