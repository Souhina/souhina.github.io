// Calculateur : terrasse en lames bois ou composite (lames, lambourdes, plots, vis ou clips).
export default {
  slug: 'terrasse-lames',
  titre: 'Calcul d’une terrasse en lames bois ou composite',
  rubrique: 'Terrasse',
  lot: 'exterieurs',
  ordre: 1,
  teinte: 'exterieur',
  description: 'Calculez le nombre de lames, de lambourdes, de plots et de vis ou de clips pour une terrasse en bois ou en composite.',
  intro: 'Indiquez les dimensions de la terrasse et le format des lames : les lames sont posées dans le sens de la longueur, sur des lambourdes perpendiculaires.',
  categorie: 'UtilitiesApplication',
  avertissement: 'ce calculateur estime des quantités. L’entraxe des lambourdes, l’espacement entre lames et la ventilation sous la terrasse dépendent du matériau : suivez la notice du fabricant et le DTU 51.4 pour les terrasses en bois.',

  groupes: {
    'La terrasse': 'Les lames sont posées dans le sens de la longueur.',
    'Les lames': 'Format inscrit sur l’étiquette ou la fiche du produit.',
    'L’ossature et la fixation': 'Lambourdes perpendiculaires aux lames, posées sur plots réglables.',
  },

  // Dimensions dessinées sur un plan (zone) ou saisies.
  // Aide au choix : questions fermées qui préremplissent les champs de type liste ou case.
  aideAuChoix: {
    questions: [
      { id: 'materiau', question: 'Vos lames sont-elles en bois ou en composite ?', options: [{ valeur: 'bois', libelle: 'En bois' }, { valeur: 'composite', libelle: 'En composite' }] },
      { id: 'epaisses', question: 'Les lames sont-elles épaisses, avec un entraxe de 60 cm autorisé par la notice ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
      { id: 'invisible', question: 'Voulez-vous des fixations invisibles ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
    ],
    regles: [
      { si: { materiau: 'composite' }, alors: { entraxe: { valeur: 40, raison: 'suivez l’entraxe indiqué sur la notice des lames' } } },
      { si: { epaisses: 'oui' }, alors: { entraxe: { valeur: 60, raison: 'seulement si la notice des lames l’autorise' } } },
      { si: {}, alors: { entraxe: { valeur: 50, raison: 'suivez l’entraxe indiqué sur la notice des lames' } } },
      { si: { invisible: 'oui' }, alors: { fixation: { valeur: 1, raison: '' } } },
      { si: {}, alors: { fixation: { valeur: 2, raison: '' } } },
    ],
  },

  plan: { nature: 'zone', saisie: true },

  champs: [
    { id: 'longueur', saisie: true, groupe: 'La terrasse', label: 'Longueur de la terrasse', unite: 'm', requis: true, min: 0.5, max: 50, defaut: 5 },
    { id: 'largeur', saisie: true, groupe: 'La terrasse', label: 'Largeur de la terrasse', unite: 'm', requis: true, min: 0.5, max: 50, defaut: 4 },
    { id: 'largeurLame', groupe: 'Les lames', label: 'Largeur d’une lame', unite: 'cm', requis: true, min: 5, max: 40, defaut: 14.5 },
    { id: 'longueurLame', groupe: 'Les lames', label: 'Longueur d’une lame', unite: 'm', requis: true, min: 0.5, max: 6, defaut: 2.4 },
    { id: 'espacement', groupe: 'Les lames', label: 'Espacement entre lames', unite: 'mm', min: 0, max: 15, defaut: 5 },
    {
      id: 'entraxe',
      groupe: 'L’ossature et la fixation',
      type: 'choix',
      label: 'Entraxe des lambourdes',
      defaut: 50,
      options: [
        { valeur: 50, libelle: '50 cm, lames bois courantes' },
        { valeur: 40, libelle: '40 cm, lames composites' },
        { valeur: 60, libelle: '60 cm, lames bois épaisses' },
      ],
    },
    { id: 'longueurLambourde', avance: true, label: 'Longueur d’une lambourde', unite: 'm', min: 1, defaut: 4 },
    { id: 'entraxePlots', avance: true, label: 'Écartement des plots sous une lambourde', unite: 'cm', min: 20, defaut: 60 },
    {
      id: 'fixation',
      groupe: 'L’ossature et la fixation',
      type: 'choix',
      label: 'Fixation des lames',
      defaut: 2,
      options: [
        { valeur: 2, libelle: 'Vis : 2 par lame et par lambourde' },
        { valeur: 1, libelle: 'Clips invisibles : 1 par croisement' },
      ],
    },
    { id: 'fixationsParBoite', avance: true, label: 'Vis ou clips par boîte', min: 1, defaut: 200 },
    { id: 'marge', label: 'Marge pour les coupes', unite: '%', min: 0, max: 30, defaut: 10 },
    { id: 'prixLame', label: 'Prix d’une lame', unite: '€', min: 0 },
    { id: 'prixLambourde', label: 'Prix d’une lambourde', unite: '€', min: 0 },
    { id: 'prixPlot', label: 'Prix d’un plot', unite: '€', min: 0 },
    { id: 'prixBoite', label: 'Prix d’une boîte de vis ou de clips', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'lames', label: 'Lames', format: 'nombre', principal: true },
    { id: 'rangees', label: 'Rangées de lames', format: 'nombre' },
    { id: 'lambourdes', label: 'Lambourdes', format: 'nombre' },
    { id: 'plots', label: 'Plots réglables', format: 'nombre' },
    { id: 'fixations', label: 'Vis ou clips', format: 'nombre' },
    { id: 'boites', label: 'Boîtes de vis ou de clips', format: 'nombre' },
    { id: 'surface', label: 'Surface de la terrasse', format: 'nombre', unite: 'm²' },
  ],

  calculer(v, plan) {
    const marge = 1 + v.marge / 100;
    // Rangées de lames sur la largeur, joint compris.
    // Dessin : lames posées sur les dimensions hors tout de la zone (prudent pour une forme non rectangulaire).
    const longueur = plan ? plan.longueur : v.longueur;
    const largeur = plan ? plan.largeur : v.largeur;
    const rangees = Math.ceil((largeur * 100) / (v.largeurLame + v.espacement / 10) - 1e-9);
    const lames = Math.ceil((rangees * longueur * marge) / v.longueurLame - 1e-9);
    // Lambourdes perpendiculaires aux lames, à l'entraxe choisi sur la longueur.
    const lignesLambourdes = Math.floor((longueur * 100) / v.entraxe + 1e-9) + 1;
    const lambourdes = Math.ceil((lignesLambourdes * largeur * 1.05) / v.longueurLambourde - 1e-9);
    const plots = lignesLambourdes * (Math.floor((largeur * 100) / v.entraxePlots + 1e-9) + 1);
    const fixations = Math.ceil(rangees * lignesLambourdes * v.fixation * 1.05 - 1e-9);
    return {
      surface: plan ? plan.surface : longueur * largeur,
      rangees,
      lames,
      lambourdes,
      plots,
      fixations,
      boites: Math.ceil(fixations / v.fixationsParBoite - 1e-9),
    };
  },

  devis: [
    { resultat: 'lames', designation: 'Lames de terrasse', unite: 'lame', prixChamp: 'prixLame', detail: '{surface} m², {rangees} rangées, lames de {longueurLame} m' },
    { resultat: 'lambourdes', designation: 'Lambourdes', unite: 'lambourde', prixChamp: 'prixLambourde', detail: 'Entraxe {entraxe} cm, lambourdes de {longueurLambourde} m' },
    { resultat: 'plots', designation: 'Plots réglables', unite: 'plot', prixChamp: 'prixPlot', complement: true },
    { resultat: 'boites', designation: 'Vis ou clips de terrasse', unite: 'boîte', prixChamp: 'prixBoite', complement: true, detail: '{fixations} pièces' },
  ],

  explication: `
        <p>Rangées = largeur ÷ (largeur de lame + espacement). Chaque rangée court sur toute la longueur ; les lames nécessaires sont la longueur totale de lames, plus la marge, divisée par la longueur d’une lame.</p>
        <p>Les lambourdes sont posées tous les 40 à 60 cm selon le matériau, avec un plot à chaque extrémité et environ tous les 60 cm. Les vis se comptent par deux à chaque croisement entre une lame et une lambourde ; les clips invisibles, un par croisement.</p>`,

  erreurs: [
    'Oublier la pente d’écoulement et la ventilation sous les lames : une structure qui reste humide se dégrade vite.',
    'Espacer les lambourdes plus que ne l’autorise la notice des lames, surtout en composite.',
    'Utiliser des vis non adaptées à l’extérieur : elles rouillent et tachent le bois.',
    'Poser les lames sans espacement : le bois gonfle, le composite se dilate, et l’eau ne s’évacue plus.',
    'Poser les lambourdes directement sur la terre.',
  ],

  conseils: [
    'Posez les lambourdes sur des plots réglables ou des cales imputrescibles, sur un sol stabilisé.',
    'Choisissez une essence ou un traitement adapté à l’usage extérieur (classe d’emploi).',
    'Préperçez les lames en bois dur avant de visser.',
    'Posez un géotextile sous la structure pour limiter les mauvaises herbes.',
  ],

  normes: [
    {
      titre: 'NF DTU 51.4',
      url: 'https://www.batirama.com/article/1964-la-liste-des-dtu-documents-techniques-unifies-a-jour.html',
      description: 'platelages extérieurs en bois',
    },
  ],

  lies: ['pavage-allee', 'gravier-remblai', 'cloture', 'conversion-pente'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Faut-il un géotextile sous la terrasse ?',
      reponse: 'Oui en général : posé sur le sol préparé, il limite la repousse des herbes sous la terrasse. Comptez la surface de la terrasse plus 10 % de recouvrement.',
    },
  ],

  exemples: [
    {
      entrees: { longueur: 5, largeur: 4, largeurLame: 14.5, longueurLame: 2.4, espacement: 5, entraxe: 50, longueurLambourde: 4, entraxePlots: 60, fixation: 2, fixationsParBoite: 200, marge: 10, prixLame: 0, prixLambourde: 0, prixPlot: 0, prixBoite: 0 },
      attendu: { surface: 20, rangees: 27, lames: 62, lambourdes: 12, plots: 77, fixations: 624, boites: 4 },
    },
  ],
};
