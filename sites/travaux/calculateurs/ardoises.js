// Calculateur : couverture en ardoises (ardoises, crochets, liteaux, écran).
export default {
  slug: 'couverture-ardoises',
  titre: 'Calcul du nombre d’ardoises',
  rubrique: 'Ardoises',
  lot: 'couverture',
  ordre: 2,
  teinte: 'ardoise',
  description: 'Calculez le nombre d’ardoises au m² selon leur format et le recouvrement, les ardoises de la toiture, les crochets et les liteaux.',
  intro: 'Le nombre d’ardoises au m² se déduit du format et du recouvrement : plus le recouvrement est grand, plus il faut d’ardoises.',
  categorie: 'UtilitiesApplication',
  avertissement: 'ce calculateur estime des quantités. Le recouvrement minimal dépend de la pente, de la longueur du rampant et de la zone climatique : suivez le DTU 40.11 et la fiche du fabricant.',

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
      id: 'format',
      type: 'choix',
      label: 'Format des ardoises',
      defaut: 1,
      options: [
        { valeur: 0, libelle: '32 × 22 cm' },
        { valeur: 1, libelle: '40 × 24 cm' },
        { valeur: 2, libelle: '50 × 25 cm' },
        { valeur: 3, libelle: '60 × 30 cm' },
      ],
    },
    { id: 'recouvrement', label: 'Recouvrement', unite: 'cm', requis: true, min: 5, max: 20, defaut: 10, aide: 'Selon la pente et la zone : voir le DTU 40.11 ou le fabricant.' },
    { id: 'longueurLiteau', label: 'Longueur d’un liteau', unite: 'm', requis: true, min: 1, defaut: 4 },
    { id: 'surfaceEcran', label: 'Surface d’un rouleau d’écran de sous-toiture', unite: 'm²', min: 1, defaut: 75 },
    { id: 'voliges', type: 'case', label: 'Pose sur voliges (support continu) au lieu de liteaux', defaut: false },
    { id: 'surfaceBotteVoliges', avance: true, label: 'Surface couverte par une botte de voliges', unite: 'm²', min: 0.5, defaut: 2.5 },
    { id: 'chatieresPour10m2', label: 'Chatières de ventilation pour 10 m²', min: 0, defaut: 1, aide: 'La ventilation à prévoir dépend de la toiture et de l’écran : suivez la notice du fabricant ; 0 si aucune.' },
    { id: 'longueurNoues', label: 'Longueur de noues', unite: 'm', min: 0, defaut: 0, aide: 'Angles rentrants entre deux pans.' },
    { id: 'longueurSolins', label: 'Longueur de solins', unite: 'm', min: 0, defaut: 0, aide: 'Raccords contre un mur ou une cheminée.' },
    { id: 'longueurElementZinc', avance: true, label: 'Longueur d’un élément de noue ou de solin', unite: 'm', min: 0.5, defaut: 2 },
    { id: 'marge', label: 'Marge pour la casse et les coupes', unite: '%', min: 0, max: 30, defaut: 7 },
    { id: 'prixArdoise', label: 'Prix d’une ardoise', unite: '€', min: 0 },
    { id: 'prixLiteau', label: 'Prix d’un liteau', unite: '€', min: 0 },
    { id: 'prixEcran', label: 'Prix d’un rouleau d’écran', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'ardoises', label: 'Ardoises', format: 'nombre', principal: true },
    { id: 'ardoisesM2', label: 'Ardoises au m²', format: 'nombre' },
    { id: 'pureau', label: 'Pureau', format: 'nombre', unite: 'cm' },
    { id: 'surface', label: 'Surface de toiture', format: 'nombre', unite: 'm²' },
    { id: 'crochets', label: 'Crochets', format: 'nombre' },
    { id: 'liteaux', label: 'Liteaux', format: 'nombre' },
    { id: 'rouleauxEcran', label: 'Rouleaux d’écran de sous-toiture', format: 'nombre' },
    { id: 'faitage', label: 'Longueur de faîtage à traiter', format: 'nombre', unite: 'm' },
    { id: 'bottesVoliges', label: 'Bottes de voliges', format: 'nombre' },
    { id: 'chatieres', label: 'Chatières', format: 'nombre' },
    { id: 'noues', label: 'Éléments de noue', format: 'nombre' },
    { id: 'solins', label: 'Éléments de solin', format: 'nombre' },
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
    const formats = [[32, 22], [40, 24], [50, 25], [60, 30]];
    const [longueur, largeur] = formats[v.format] ?? formats[1];
    // Chaque ardoise est recouverte deux fois : pureau = (longueur − recouvrement) ÷ 2.
    const pureau = (longueur - v.recouvrement) / 2;
    if (pureau <= 0) return null;
    const ardoisesM2 = 10000 / (largeur * pureau);
    const ardoises = Math.ceil(surface * ardoisesM2 * (1 + v.marge / 100) - 1e-9);
    const rangsParPan = Math.ceil((rampant * 100) / pureau - 1e-9) + 1;
    return {
      surface,
      pureau,
      ardoisesM2,
      ardoises,
      crochets: ardoises,
      liteaux: v.voliges ? 0 : Math.ceil((plan ? (surface * 100) / pureau * 1.05 : pans * rangsParPan * longueurPan * 1.05) / v.longueurLiteau - 1e-9),
      bottesVoliges: v.voliges ? Math.ceil((surface * 1.05) / v.surfaceBotteVoliges - 1e-9) : 0,
      rouleauxEcran: Math.ceil((surface * 1.1) / v.surfaceEcran - 1e-9),
      faitage: longueurFaitage > 0 ? Math.ceil(longueurFaitage * 10 - 1e-9) / 10 : 0,
      chatieres: Math.ceil((surface / 10) * v.chatieresPour10m2 - 1e-9),
      noues: v.longueurNoues > 0 ? Math.ceil((v.longueurNoues * 1.1) / v.longueurElementZinc - 1e-9) : 0,
      solins: v.longueurSolins > 0 ? Math.ceil((v.longueurSolins * 1.1) / v.longueurElementZinc - 1e-9) : 0,
    };
  },

  devis: [
    { resultat: 'ardoises', designation: 'Ardoises', unite: 'ardoise', prixChamp: 'prixArdoise', detail: '{surface} m², pureau {pureau} cm, {ardoisesM2} ardoises au m²' },
    { resultat: 'crochets', designation: 'Crochets d’ardoise', unite: 'crochet' },
    { resultat: 'liteaux', designation: 'Liteaux', unite: 'liteau', prixChamp: 'prixLiteau', detail: 'Écartement de {pureau} cm, liteaux de {longueurLiteau} m' },
    { resultat: 'rouleauxEcran', designation: 'Écran de sous-toiture', unite: 'rouleau', prixChamp: 'prixEcran' },
    { resultat: 'bottesVoliges', designation: 'Voliges', unite: 'botte' },
    { resultat: 'chatieres', designation: 'Chatières de ventilation', unite: 'chatière', complement: true },
    { resultat: 'noues', designation: 'Noues', unite: 'élément', detail: '{longueurNoues} m' },
    { resultat: 'solins', designation: 'Solins', unite: 'élément', detail: '{longueurSolins} m' },
  ],

  explication: `
        <p>Chaque ardoise est recouverte par les deux rangs du dessus : la partie visible, le pureau, vaut (longueur − recouvrement) ÷ 2. Ardoises au m² = 1 ÷ (largeur × pureau).</p>
        <p>Avec des ardoises de 40 × 24 cm et 10 cm de recouvrement, le pureau est de 15 cm, soit environ 28 ardoises au m².</p>
        <p>Le faîtage d’un toit en ardoises se traite à part (tuiles faîtières, zinc ou lignolet) : sa longueur est donnée pour commander le matériau choisi.</p>`,

  erreurs: [
    'Reprendre le recouvrement d’une autre région : il dépend de la pente, de la longueur du rampant et de la zone climatique.',
    'Confondre ardoise naturelle et fibres-ciment : leurs règles de pose diffèrent.',
    'Oublier les crochets, les ardoises de doublis et les éléments de rive.',
  ],

  conseils: [
    'Contrôlez le pureau sur le premier rang avant de poursuivre.',
    'Utilisez des crochets inoxydables adaptés à l’épaisseur de l’ardoise.',
    'Gardez des ardoises de réserve du même lot.',
  ],

  normes: [
    {
      titre: 'NF DTU 40.11',
      url: 'https://www.batirama.com/article/1964-la-liste-des-dtu-documents-techniques-unifies-a-jour.html',
      description: 'couverture en ardoises naturelles',
    },
    {
      titre: 'NF DTU 40.13',
      url: 'https://www.batirama.com/article/1964-la-liste-des-dtu-documents-techniques-unifies-a-jour.html',
      description: 'couverture en ardoises en fibres-ciment',
    },
  ],

  lies: ['couverture-tuiles', 'chevrons-charpente', 'gouttieres'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Crochets ou clous ?',
      reponse: 'Le crochet inox est le plus courant pour l’ardoise naturelle, à raison d’un par ardoise. La pose au clou en demande deux par ardoise.',
    },
  ],

  exemples: [
    {
      entrees: { pans: 2, longueurToit: 10, largeurBatiment: 8, pente: 35, debordEgout: 0.3, debordRive: 0.2, format: 1, recouvrement: 10, longueurLiteau: 4, surfaceEcran: 75, voliges: 0, surfaceBotteVoliges: 2.5, chatieresPour10m2: 1, longueurNoues: 0, longueurSolins: 5, longueurElementZinc: 2, marge: 7, prixArdoise: 0, prixLiteau: 0, prixEcran: 0 },
      attendu: { pureau: 15, ardoisesM2: 27.7778, ardoises: 3205, crochets: 3205, liteaux: 197, rouleauxEcran: 2, faitage: 10.4, bottesVoliges: 0, chatieres: 11, solins: 3 },
    },
    {
      // Même toit sur voliges : plus de liteaux, 107,8 m² × 1,05 ÷ 2,5 = 46 bottes.
      entrees: { pans: 2, longueurToit: 10, largeurBatiment: 8, pente: 35, debordEgout: 0.3, debordRive: 0.2, format: 1, recouvrement: 10, longueurLiteau: 4, surfaceEcran: 75, voliges: 1, surfaceBotteVoliges: 2.5, chatieresPour10m2: 1, longueurNoues: 0, longueurSolins: 5, longueurElementZinc: 2, marge: 7, prixArdoise: 0, prixLiteau: 0, prixEcran: 0 },
      attendu: { liteaux: 0, bottesVoliges: 46 },
    },
  ],
};
