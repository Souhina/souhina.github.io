// Calculateur : chevrons et contre-liteaux (quantités ; les sections relèvent d'un calcul de structure).
export default {
  slug: 'chevrons-charpente',
  titre: 'Calcul du nombre de chevrons',
  rubrique: 'Charpente',
  lot: 'charpente',
  ordre: 1,
  teinte: 'charpente',
  description: 'Calculez le nombre et la longueur des chevrons d’une toiture à un ou deux pans, et les contre-liteaux sous un écran de sous-toiture.',
  intro: 'Indiquez les dimensions du bâtiment et la pente : le calcul déduit la longueur du rampant, puis le nombre de chevrons selon l’entraxe.',
  categorie: 'UtilitiesApplication',
  avertissement: 'ce calculateur donne des quantités et des longueurs. La section des chevrons, leur entraxe et la charpente qui les porte (pannes, fermes) dépendent de la portée, des charges de neige et de vent et de l’essence du bois : ils se déterminent avec un charpentier ou un bureau d’études (DTU 31.1, Eurocode 5).',

  // Pan de toit dessiné vu du dessus, ou dimensions de la toiture saisies.
  plan: { nature: 'pan', saisie: true },

  champs: [
    {
      id: 'pans',
      type: 'choix',
      label: 'Forme du toit',
      defaut: 2,
      options: [
        { valeur: 2, libelle: 'Deux pans identiques' },
        { valeur: 1, libelle: 'Un seul pan (appentis)' },
      ],
    },
    { id: 'longueurToit', saisie: true, label: 'Longueur du toit, le long du faîtage', unite: 'm', requis: true, min: 0.5, defaut: 10 },
    { id: 'largeurBatiment', saisie: true, label: 'Largeur du bâtiment, d’un mur gouttereau à l’autre', unite: 'm', requis: true, min: 0.5, defaut: 8 },
    { id: 'pente', label: 'Pente du toit', unite: 'degrés', requis: true, min: 5, max: 70, defaut: 35, aide: 'Repères : 30° ≈ 58 %, 35° ≈ 70 %, 45° = 100 %.' },
    { id: 'debordEgout', saisie: true, label: 'Débord de toit en bas de pente', unite: 'm', min: 0, defaut: 0.3 },
    { id: 'debordRive', saisie: true, label: 'Débord de toit sur les pignons', unite: 'm', min: 0, defaut: 0.2 },
    {
      id: 'entraxe',
      type: 'choix',
      label: 'Entraxe des chevrons',
      defaut: 60,
      options: [
        { valeur: 60, libelle: '60 cm' },
        { valeur: 50, libelle: '50 cm' },
        { valeur: 40, libelle: '40 cm' },
      ],
    },
    { id: 'longueurVendue', label: 'Longueur maximale des chevrons vendus', unite: 'm', requis: true, min: 1, defaut: 6, aide: 'Au-delà, un chevron est fait de deux pièces raboutées sur une panne.' },
    { id: 'contreLiteaux', type: 'case', label: 'Prévoir des contre-liteaux (écran de sous-toiture)', defaut: true },
    { id: 'prixChevron', label: 'Prix d’un chevron', unite: '€', min: 0 },
    { id: 'prixMetreContreLiteau', label: 'Prix au mètre de contre-liteau', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'chevrons', label: 'Chevrons à commander', format: 'nombre', principal: true },
    { id: 'rampant', label: 'Longueur du rampant, débord compris', format: 'nombre', unite: 'm' },
    { id: 'chevronsParPan', label: 'Chevrons par pan', format: 'nombre' },
    { id: 'contreLiteauxMetres', label: 'Contre-liteaux', format: 'nombre', unite: 'm' },
    { id: 'surface', label: 'Surface de toiture', format: 'nombre', unite: 'm²' },
  ],

  calculer(v, plan) {
    // Géométrie commune : longueur du rampant (de l'égout au faîtage) et longueur d'un pan.
    // Dessin : un pan vu du dessus (projection, débords compris) ; la pente donne la surface réelle,
    // exacte quelle que soit la forme (trapèze, triangle). Saisie : toiture à 1 ou 2 pans identiques.
    const cosPente = Math.cos((v.pente * Math.PI) / 180);
    const pans = plan ? 1 : v.pans;
    const portee = plan ? plan.largeur : v.pans === 2 ? v.largeurBatiment / 2 : v.largeurBatiment;
    const rampant = portee / cosPente + (plan ? 0 : v.debordEgout);
    const longueurPan = plan ? plan.longueur : v.longueurToit + 2 * v.debordRive;
    const surface = plan ? plan.surface / cosPente : pans * longueurPan * rampant;
    // Faîtage d'un pan dessiné : son bord haut, partagé avec le pan opposé quand la toiture a deux pans.
    let arete = 0;
    if (plan) {
      const haut = Math.min(...plan.points.map((point) => point[1]));
      const xs = plan.points.filter((point) => Math.abs(point[1] - haut) < 1).map((point) => point[0]);
      arete = (Math.max(...xs) - Math.min(...xs)) / 100;
    }
    const longueurFaitage = plan ? (v.pans === 2 ? arete / 2 : 0) : v.pans === 2 ? longueurPan : 0;
    const chevronsParPan = Math.floor((longueurPan * 100) / v.entraxe + 1e-9) + 1;
    const piecesParChevron = Math.ceil(rampant / v.longueurVendue - 1e-9);
    const lignes = pans * chevronsParPan;
    return {
      surface,
      rampant,
      chevronsParPan,
      chevrons: lignes * piecesParChevron,
      contreLiteauxMetres: v.contreLiteaux ? Math.ceil(lignes * rampant * 1.05) : 0,
    };
  },

  devis: [
    { resultat: 'chevrons', designation: 'Chevrons', unite: 'chevron', prixChamp: 'prixChevron', detail: '{chevronsParPan} par pan à {entraxe} cm, rampant de {rampant} m' },
    { resultat: 'contreLiteauxMetres', designation: 'Contre-liteaux', unite: 'm', prixChamp: 'prixMetreContreLiteau', detail: 'Sur chaque chevron, pour ventiler sous l’écran' },
  ],

  explication: `
        <p>Rampant = demi-largeur du bâtiment (toute la largeur pour un appentis) ÷ cosinus de la pente, plus le débord en bas de pente. Chaque pan mesure la longueur du toit plus les débords sur les pignons.</p>
        <p>Chevrons par pan = longueur du pan ÷ entraxe, plus un. Si le rampant dépasse la longueur vendue, chaque chevron compte plusieurs pièces.</p>
        <p>Les contre-liteaux se clouent sur les chevrons, par-dessus l’écran de sous-toiture, pour ménager une lame d’air ventilée.</p>`,

  erreurs: [
    'Choisir la section ou l’entraxe des chevrons sans calcul : ils dépendent de la portée, de la couverture et des charges de neige et de vent.',
    'Oublier les débords de toit dans la longueur des chevrons.',
    'Utiliser un bois sans traitement adapté à la classe d’emploi.',
  ],

  conseils: [
    'Faites valider la charpente par un charpentier ou un bureau d’études.',
    'Prévoyez des contre-liteaux sous un écran de sous-toiture pour ventiler.',
    'Stockez le bois à plat et à l’abri avant la pose.',
  ],

  normes: [
    {
      titre: 'NF DTU 31.1',
      url: 'https://www.batirama.com/article/12218-nf-dtu-31.1-charpente-en-bois.html',
      description: 'charpente en bois',
    },
    {
      titre: 'NF EN 1995 (Eurocode 5)',
      description: 'calcul des structures en bois',
    },
  ],

  lies: ['couverture-tuiles', 'couverture-ardoises', 'conversion-pente'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Pourquoi la section des chevrons n’est-elle pas calculée ?',
      reponse: 'Elle dépend de la distance entre pannes, du poids de la couverture, de la neige et du vent de votre région : c’est un calcul de structure, fait par un charpentier ou un bureau d’études.',
    },
    {
      question: 'Quel entraxe entre les chevrons ?',
      reponse: 'On rencontre couramment 40 à 60 cm, mais l’entraxe dépend de la section des chevrons, du poids de la couverture et des charges de neige et de vent. Il se fixe avec le charpentier ou d’après les tableaux du fabricant de couverture.',
    },
    {
      question: 'Quel traitement pour le bois de charpente ?',
      reponse: 'Un bois de classe d’emploi 2 au moins pour une charpente abritée sous la couverture, soit par son essence, soit par un traitement préventif contre les insectes et les champignons. Les bois exposés à la pluie demandent une classe supérieure.',
    },
    {
      question: 'À quoi servent les contre-liteaux ?',
      reponse: 'Cloués sur les chevrons par-dessus l’écran de sous-toiture, ils créent une lame d’air ventilée sous les liteaux et la couverture : l’humidité et l’eau qui passeraient s’écoulent sans mouiller les liteaux.',
    },
  ],

  exemples: [
    {
      entrees: { pans: 2, longueurToit: 10, largeurBatiment: 8, pente: 35, debordEgout: 0.3, debordRive: 0.2, entraxe: 60, longueurVendue: 6, contreLiteaux: 1, prixChevron: 0, prixMetreContreLiteau: 0 },
      attendu: { surface: 107.8084, rampant: 5.1831, chevronsParPan: 18, chevrons: 36, contreLiteauxMetres: 196 },
    },
  ],
};
