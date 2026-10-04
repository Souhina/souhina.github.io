// Calculateur : gouttières et descentes d'eaux pluviales (quantités, pas de dimensionnement).
export default {
  slug: 'gouttieres',
  titre: 'Calcul des gouttières et des descentes',
  rubrique: 'Gouttières',
  lot: 'couverture',
  ordre: 3,
  teinte: 'zinguerie',
  description: 'Calculez les longueurs de gouttière, les crochets, les descentes, les coudes et les colliers pour un toit à un ou deux pans.',
  intro: 'Indiquez la forme du toit, sa longueur et la hauteur des descentes : une gouttière court sous chaque égout, débords compris.',
  categorie: 'UtilitiesApplication',
  avertissement: 'ce calculateur estime des quantités. La section des gouttières et le nombre de descentes dépendent de la surface de toiture et de la pluviométrie de la région : suivez le DTU 40.5 et les tableaux du fabricant.',

  champs: [
    {
      id: 'pans',
      type: 'choix',
      label: 'Forme du toit',
      defaut: 2,
      options: [
        { valeur: 2, libelle: 'Deux pans : deux égouts' },
        { valeur: 1, libelle: 'Un seul pan : un égout' },
      ],
    },
    { id: 'longueurToit', label: 'Longueur du toit, le long de l’égout', unite: 'm', requis: true, min: 1, max: 100, defaut: 10 },
    { id: 'debordRive', label: 'Débord de toit sur les pignons', unite: 'm', min: 0, defaut: 0.2 },
    { id: 'hauteurDescente', label: 'Hauteur des descentes', unite: 'm', requis: true, min: 0.5, max: 30, defaut: 5, aide: 'De la gouttière au sol ou au regard.' },
    { id: 'longueurMaxDescente', avance: true, label: 'Longueur de gouttière par descente', unite: 'm', min: 2, defaut: 12, aide: 'Au-delà, une descente supplémentaire ; à adapter selon le DTU et le fabricant.' },
    { id: 'longueurElement', avance: true, label: 'Longueur d’une gouttière', unite: 'm', min: 1, defaut: 4 },
    { id: 'longueurTuyau', avance: true, label: 'Longueur d’un tuyau de descente', unite: 'm', min: 0.5, defaut: 2 },
    { id: 'prixGouttiere', label: 'Prix d’une gouttière', unite: '€', min: 0 },
    { id: 'prixTuyau', label: 'Prix d’un tuyau de descente', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'gouttieres', label: 'Gouttières', format: 'nombre', principal: true },
    { id: 'lineaire', label: 'Longueur de gouttière', format: 'nombre', unite: 'm' },
    { id: 'crochets', label: 'Crochets (un tous les 50 cm)', format: 'nombre' },
    { id: 'descentes', label: 'Descentes et naissances', format: 'nombre' },
    { id: 'tuyaux', label: 'Tuyaux de descente', format: 'nombre' },
    { id: 'coudes', label: 'Coudes', format: 'nombre' },
    { id: 'colliers', label: 'Colliers de descente', format: 'nombre' },
    { id: 'fonds', label: 'Fonds de gouttière', format: 'nombre' },
  ],

  calculer(v) {
    const longueurEgout = v.longueurToit + 2 * v.debordRive;
    const lineaire = v.pans * longueurEgout;
    const descentesParEgout = Math.ceil(longueurEgout / v.longueurMaxDescente - 1e-9);
    const descentes = v.pans * descentesParEgout;
    return {
      lineaire,
      gouttieres: Math.ceil((lineaire * 1.05) / v.longueurElement - 1e-9),
      crochets: v.pans * (Math.ceil(longueurEgout / 0.5 - 1e-9) + 1),
      descentes,
      tuyaux: descentes * Math.ceil(v.hauteurDescente / v.longueurTuyau - 1e-9),
      coudes: descentes * 2,
      colliers: descentes * Math.ceil(v.hauteurDescente / 1.5 - 1e-9),
      fonds: v.pans * 2,
    };
  },

  devis: [
    { resultat: 'gouttieres', designation: 'Gouttières', unite: 'gouttière', prixChamp: 'prixGouttiere', detail: '{lineaire} m, éléments de {longueurElement} m' },
    { resultat: 'crochets', designation: 'Crochets de gouttière', unite: 'crochet', complement: true },
    { resultat: 'descentes', designation: 'Naissances', unite: 'naissance', complement: true },
    { resultat: 'tuyaux', designation: 'Tuyaux de descente', unite: 'tuyau', prixChamp: 'prixTuyau', detail: '{descentes} descente(s) de {hauteurDescente} m' },
    { resultat: 'coudes', designation: 'Coudes de descente', unite: 'coude', complement: true },
    { resultat: 'colliers', designation: 'Colliers de descente', unite: 'collier', complement: true },
    { resultat: 'fonds', designation: 'Fonds de gouttière', unite: 'fond', complement: true },
  ],

  explication: `
        <p>Une gouttière court sous chaque égout, sur la longueur du toit plus les débords. Les crochets se posent environ tous les 50 cm, avec une légère pente vers les descentes.</p>
        <p>Chaque descente compte une naissance, deux coudes pour contourner le débord de toit, des tuyaux sur toute sa hauteur et un collier environ tous les 1,50 m.</p>`,

  erreurs: [
    'Poser la gouttière sans pente vers la descente.',
    'Sous-dimensionner les descentes pour la surface de toiture.',
    'Oublier la dilatation sur les grandes longueurs de zinc ou de PVC.',
  ],

  conseils: [
    'Dimensionnez avec la surface de toiture en projection horizontale.',
    'Posez une crapaudine à l’entrée de chaque descente.',
    'Respectez l’espacement des crochets préconisé par le fabricant.',
  ],

  normes: [
    {
      titre: 'XP DTU 40.5',
      url: 'https://www.batirama.com/article/1964-la-liste-des-dtu-documents-techniques-unifies-a-jour.html',
      description: 'travaux d’évacuation des eaux pluviales',
    },
  ],

  lies: ['couverture-tuiles', 'couverture-ardoises', 'drainage-peripherique'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Quelle pente donner à la gouttière ?',
      reponse: 'Une pente faible et régulière vers la descente, de l’ordre de quelques millimètres par mètre : la notice du fabricant donne la valeur exacte selon le matériau.',
    },
  ],

  exemples: [
    {
      entrees: { pans: 2, longueurToit: 10, debordRive: 0.2, hauteurDescente: 5, longueurMaxDescente: 12, longueurElement: 4, longueurTuyau: 2, prixGouttiere: 0, prixTuyau: 0 },
      attendu: { lineaire: 20.8, gouttieres: 6, crochets: 44, descentes: 2, tuyaux: 6, coudes: 4, colliers: 8, fonds: 4 },
    },
  ],
};
