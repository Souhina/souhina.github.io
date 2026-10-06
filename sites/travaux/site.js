// sites/travaux/site.js — Métré, calculateurs de quantités pour les travaux.
// Charte jour : Béton brut (gris béton, graphite, un seul orange signalétique).
// Charte nuit : Nuit de chantier (anthracite, craie, ambre ; chiffres en chasse fixe).
export default {
  nom: 'Métré',
  marqueHtml: 'Métré<span style="color: var(--couleur-lien)">.</span>',
  domaine: 'https://www.exemple-metre.fr', // à remplacer par le vrai nom de domaine
  slogan: 'Mesurer, couper, poser, sans gaspiller',
  titreAccueil: 'Calculateurs de matériaux pour vos travaux',
  descriptionAccueil: 'Dessinez votre pièce et calculez les quantités exactes de peinture, de carrelage et de matériaux, puis cumulez-les dans un devis.',
  introAccueil: 'Dessinez la forme réelle de votre pièce une seule fois : elle est reprise par chaque calculateur. Ajoutez ensuite les quantités à votre devis pour obtenir la liste complète des achats.',

  // Active le lien « Mon devis » et génère la page /devis/ (récapitulatif PDF).
  devis: true,

  // Corps de métier, dans l'ordre d'affichage. Seuls ceux qui ont au moins un calculateur
  // apparaissent sur le site ; les autres sont prêts pour les prochains calculateurs.
  // Navigation par type de chantier : chaque type liste ses calculateurs (slugs). Un calculateur
  // peut figurer dans plusieurs types. build.js vérifie que chaque slug existe.
  typesChantier: [
    { id: 'construction', nom: 'Construction et gros œuvre', calculateurs: ['terrassement-deblai', 'calcul-beton', 'treillis-soude', 'mur-parpaings-briques', 'linteaux', 'drainage-peripherique', 'calcul-escalier', 'configurateur-escalier', 'plancher-bois'] },
    { id: 'isolation', nom: 'Isolation et cloisons', calculateurs: ['quantite-laine-de-verre', 'quantite-laine-de-roche', 'isolation-soufflee', 'isolation-sol', 'plaques-de-platre', 'plafond-suspendu'] },
    { id: 'sols', nom: 'Sols', calculateurs: ['chape-ragreage', 'plancher-chauffant', 'quantite-carrelage', 'quantite-parquet', 'quantite-moquette', 'quantite-lino', 'quantite-plinthes'] },
    { id: 'murs', nom: 'Murs et finitions', calculateurs: ['quantite-peinture', 'quantite-papier-peint', 'quantite-tenture-murale', 'quantite-parement', 'carrelage-mural', 'lambris-bardage'] },
    { id: 'toiture', nom: 'Toiture et façade', calculateurs: ['chevrons-charpente', 'couverture-tuiles', 'couverture-ardoises', 'couverture-plaques', 'toit-plat-epdm', 'gouttieres', 'enduit-facade', 'peinture-facade', 'isolation-exterieur', 'lambris-bardage'] },
    { id: 'reseaux', nom: 'Réseaux et confort', calculateurs: ['reseau-plomberie', 'reseau-electrique', 'puissance-chauffage', 'debit-vmc', 'ballon-eau-chaude', 'plancher-chauffant'] },
    { id: 'exterieur', nom: 'Extérieur', calculateurs: ['terrasse-lames', 'cloture', 'pavage-allee', 'gravier-remblai', 'conversion-pente'] },
  ],

  lots: [
    { id: 'gros-oeuvre', nom: 'Gros œuvre et maçonnerie', description: 'Béton, murs en blocs et linteaux : les quantités pour les ouvrages de maçonnerie. Le dimensionnement des éléments porteurs reste l’affaire d’un bureau d’études.' },
    { id: 'platrerie-isolation', nom: 'Plâtrerie et isolation', description: 'Plaques de plâtre, ossature métallique et isolants : les quantités pour cloisons, doublages et combles.' },
    { id: 'menuiserie', nom: 'Menuiserie', description: 'Lambris, bardage, planchers bois et panneaux : les quantités de lames, de tasseaux et de panneaux.' },
    { id: 'plomberie', nom: 'Plomberie, chauffage et ventilation', description: 'Réseaux d’eau, puissance de chauffage, ballon d’eau chaude et débits de ventilation : des estimations, à valider par un installateur.' },
    { id: 'electricite', nom: 'Électricité', description: 'Gaines, fils et boîtes d’encastrement : des quantités seulement, la conception d’une installation relève de la norme NF C 15-100.' },
    { id: 'exterieurs', nom: 'Aménagements extérieurs', description: 'Terrasse, clôture, allée pavée, gravier et remblai : les quantités pour aménager le jardin.' },
    { id: 'sols', nom: 'Sols', description: 'Isolation sous chape, plancher chauffant, carrelage, parquet, moquette et lino : toutes les couches d’un sol, calculées sur la forme réelle de la pièce.' },
    { id: 'murs', nom: 'Murs intérieurs', description: 'Peinture, papier peint, tenture murale et parement : les quantités calculées sur le périmètre réel de la pièce dessinée.' },
    { id: 'facades', nom: 'Façades', description: 'Enduit de façade et crépi : les quantités de sacs selon la surface des murs extérieurs et l’épaisseur appliquée.' },
    { id: 'charpente', nom: 'Charpente', description: 'Chevrons et contre-liteaux : le nombre et les longueurs de pièces selon la géométrie du toit. Les sections se déterminent avec un charpentier ou un bureau d’études.' },
    { id: 'couverture', nom: 'Couverture', description: 'Tuiles, ardoises, faîtières, rives, liteaux et écran sous toiture, calculés sur la surface réelle des pans.' },
  ],

  // Application installable sur mobile (icônes dans sites/travaux/icones/).
  // raccourcis : calculateurs proposés par un appui long sur l'icône (Android).
  // Interrupteur « ft/lb » : équivalents impériaux affichés à côté des résultats métriques.
  unitesImperiales: true,

  application: {
    nom: 'Métré, calculateurs de matériaux',
    nomCourt: 'Métré',
    raccourcis: ['quantite-carrelage', 'quantite-peinture', 'calcul-beton'],
  },

  theme: {
    couleurPrincipale: '#17181A',
    couleurFond: '#E7E5E1',
    couleurSurface: '#F4F3F1',
    couleurTexte: '#17181A',
    couleurDiscret: '#55585C',
    couleurLigne: '#C9C6C0',
    couleurBordureChamp: '#55585C',
    couleurLien: '#A8380A',     // orange utilisable en texte (5,2:1)
    couleurFocus: '#1D4ED8',
    couleurAccent: '#C2410C',   // orange en aplat uniquement (4,1:1 sur le fond)
    couleurErreur: '#B42318',
    couleurSucces: '#2F6B2F',

    policeTitres: 'Bahnschrift, "DIN Alternate", "Arial Nova", "Helvetica Neue", Arial, sans-serif',
    policeTexte: 'Bahnschrift, "DIN Alternate", "Arial Nova", "Helvetica Neue", Arial, sans-serif',
    policeChiffres: 'Bahnschrift, "DIN Alternate", "Arial Nova", Arial, sans-serif',
    titresGraisse: '600',
    titresEtirement: '87.5%',
    titresInterlettrage: '-0.01em',
    surtitreInterlettrage: '0.12em',

    trait: '2px',
    rayon: '0',
    rayonBouton: '0',
    rayonChamp: '0',

    champFond: 'transparent',
    champBordure: '0 solid transparent',
    champBordureBas: '2px solid #55585C',
    champRetrait: '0',

    boutonFond: '#C2410C',
    boutonTexte: '#FFFFFF',
    boutonFondSurvol: '#17181A',
    boutonTexteSurvol: '#FFFFFF',
    boutonCasse: 'uppercase',
    boutonInterlettrage: '0.08em',

    resultatsFond: '#F4F3F1',
    resultatsTexte: '#17181A',
    resultatsDiscret: '#55585C',
    resultatsBordure: '2px solid #C9C6C0',
    resultatsFilet: '4px',

    planFond: '#F4F3F1',
    planGrille: '#E2E0DB',
    planGrilleMetre: '#CFCBC4',
    planTrait: '#17181A',

    teintes: {
      peinture: '#9B2C5A',
      carrelage: '#0E6E82',
      platrerie: '#56509A',
      parquet: '#7A4A1E',
      moquette: '#8A2E62',
      lino: '#2A6B58',
      chauffage: '#A3361C',
      papierpeint: '#6A3D8F',
      tenture: '#2F5E8C',
      parement: '#7A5230',
      facade: '#4F5B64',
      chape: '#5C5346',
      exterieur: '#3F6B2A',
      bois: '#6E4B2A',
      zinguerie: '#4A5A66',
      plinthes: '#7A4A1E',
      linteau: '#3D4046',
      charpente: '#5A4632',
      tuiles: '#A1401F',
      ardoise: '#3B4652',
      grosoeuvre: '#3D4046',
      isolation: '#4D6B14',
      plomberie: '#1D4ED8',
      electricite: '#8A4B00',
      devis: '#C2410C',
    },
  },

  themeNuit: {
    couleurPrincipale: '#ECEAE6',
    couleurFond: '#0E1012',
    couleurSurface: '#171A1D',
    couleurTexte: '#ECEAE6',
    couleurDiscret: '#A3A7AB',
    couleurLigne: '#2C3136',
    couleurBordureChamp: '#3A4046',
    couleurLien: '#F0A93B',
    couleurFocus: '#F5C84B',
    couleurAccent: '#F0A93B',
    couleurErreur: '#FF8A7A',
    couleurSucces: '#B7CF6A',

    policeTitres: 'Bahnschrift, "DIN Alternate", "Arial Nova", "Helvetica Neue", Arial, sans-serif',
    policeTexte: '"Segoe UI Variable Text", "Segoe UI", "Helvetica Neue", system-ui, sans-serif',
    policeChiffres: '"Cascadia Mono", "SF Mono", Consolas, "JetBrains Mono", monospace',
    titresGraisse: '300',
    titresEtirement: '75%',
    titresInterlettrage: '-0.01em',
    surtitreInterlettrage: '0.2em',

    trait: '1px',
    rayon: '6px',
    rayonBouton: '6px',
    rayonChamp: '6px',

    champFond: '#0E1012',
    champBordure: '1px solid #3A4046',
    champBordureBas: '1px solid #3A4046',
    champRetrait: '0.75rem',

    boutonFond: '#F0A93B',
    boutonTexte: '#0E1012',
    boutonFondSurvol: '#F5C84B',
    boutonTexteSurvol: '#0E1012',
    boutonCasse: 'none',
    boutonInterlettrage: '0.02em',

    resultatsFond: '#171A1D',
    resultatsTexte: '#ECEAE6',
    resultatsDiscret: '#A3A7AB',
    resultatsBordure: '1px solid #2C3136',
    resultatsFilet: '4px',

    planFond: '#121518',
    planGrille: '#1E2327',
    planGrilleMetre: '#2A3035',
    planTrait: '#ECEAE6',

    teintes: {
      peinture: '#F28B6B',
      carrelage: '#5CC8C2',
      platrerie: '#B3A8F0',
      parquet: '#E0A86E',
      moquette: '#E58FC4',
      lino: '#6FCFB0',
      chauffage: '#FF9B7A',
      papierpeint: '#C9A6E8',
      tenture: '#8DB8E8',
      parement: '#E0B089',
      facade: '#B7C2CC',
      chape: '#C7BFB2',
      exterieur: '#9FD18B',
      bois: '#D9B38C',
      zinguerie: '#A9BCC9',
      plinthes: '#E0A86E',
      linteau: '#C7BFB2',
      charpente: '#D6B48A',
      tuiles: '#F29A74',
      ardoise: '#A9B8C8',
      grosoeuvre: '#C7BFB2',
      isolation: '#B7CF6A',
      plomberie: '#6FA8F5',
      electricite: '#F5C84B',
      devis: '#F0A93B',
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
    // Liens partenaires. Une entrée avec id (par exemple 'carrelage') ajoute aussi un bouton « Acheter »
    // aux lignes du récapitulatif qui portent achat: 'carrelage' (carrelage, peinture, parquet,
    // plaques-platre, isolant, papier-peint). Exemple, à adapter avec un vrai programme d'affiliation :
    // { id: 'carrelage', texte: 'Carrelage chez notre partenaire.', libelleLien: 'Voir les carrelages', url: 'https://…', pages: ['quantite-carrelage'] },
    affiliation: [],
  },
};
