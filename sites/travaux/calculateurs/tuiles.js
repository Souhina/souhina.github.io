// Calculateur : couverture en tuiles (tuiles, faîtières, rives, liteaux, écran, closoir).
export default {
  slug: 'couverture-tuiles',
  titre: 'Calcul du nombre de tuiles',
  rubrique: 'Tuiles',
  lot: 'couverture',
  ordre: 1,
  teinte: 'tuiles',
  description: 'Calculez la surface du toit et le nombre de tuiles, de faîtières, de tuiles de rive, de liteaux et de rouleaux d’écran de sous-toiture.',
  intro: 'Indiquez les dimensions du bâtiment, la pente et les caractéristiques de la tuile choisie, données par le fabricant.',
  categorie: 'UtilitiesApplication',
  avertissement: 'ce calculateur estime des quantités. La pente minimale, le recouvrement et la fixation des tuiles dépendent du modèle, de la région et de l’exposition : suivez la fiche du fabricant et le DTU de la série 40.2.',

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
    { id: 'tuilesM2', label: 'Tuiles au m²', requis: true, min: 1, defaut: 13, aide: 'Indiqué par le fabricant : environ 10 à 15 pour une tuile mécanique, bien plus pour une petite tuile plate.' },
    { id: 'pureau', label: 'Pureau, soit l’écartement des liteaux', unite: 'cm', requis: true, min: 5, defaut: 34, aide: 'Indiqué par le fabricant pour le modèle de tuile et la pente.' },
    { id: 'faitieresParMetre', label: 'Faîtières par mètre', requis: true, min: 0.5, defaut: 2.5 },
    { id: 'rivesParMetre', label: 'Tuiles de rive par mètre', min: 0, defaut: 3 },
    { id: 'longueurLiteau', label: 'Longueur d’un liteau', unite: 'm', requis: true, min: 1, defaut: 4 },
    { id: 'surfaceEcran', label: 'Surface d’un rouleau d’écran de sous-toiture', unite: 'm²', min: 1, defaut: 75 },
    { id: 'chatieresPour10m2', label: 'Chatières de ventilation pour 10 m²', min: 0, defaut: 1, aide: 'La ventilation à prévoir dépend de la toiture et de l’écran : suivez la notice du fabricant ; 0 si aucune.' },
    { id: 'longueurNoues', label: 'Longueur de noues', unite: 'm', min: 0, defaut: 0, aide: 'Angles rentrants entre deux pans.' },
    { id: 'longueurSolins', label: 'Longueur de solins', unite: 'm', min: 0, defaut: 0, aide: 'Raccords contre un mur ou une cheminée.' },
    { id: 'longueurElementZinc', avance: true, label: 'Longueur d’un élément de noue ou de solin', unite: 'm', min: 0.5, defaut: 2 },
    { id: 'marge', label: 'Marge pour la casse et les coupes', unite: '%', min: 0, max: 30, defaut: 5 },
    { id: 'prixTuile', label: 'Prix d’une tuile', unite: '€', min: 0 },
    { id: 'prixFaitiere', label: 'Prix d’une faîtière', unite: '€', min: 0 },
    { id: 'prixRive', label: 'Prix d’une tuile de rive', unite: '€', min: 0 },
    { id: 'prixLiteau', label: 'Prix d’un liteau', unite: '€', min: 0 },
    { id: 'prixEcran', label: 'Prix d’un rouleau d’écran', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'tuiles', label: 'Tuiles', format: 'nombre', principal: true },
    { id: 'surface', label: 'Surface de toiture', format: 'nombre', unite: 'm²' },
    { id: 'faitieres', label: 'Faîtières', format: 'nombre' },
    { id: 'rives', label: 'Tuiles de rive', format: 'nombre' },
    { id: 'liteaux', label: 'Liteaux', format: 'nombre' },
    { id: 'rouleauxEcran', label: 'Rouleaux d’écran de sous-toiture', format: 'nombre' },
    { id: 'closoir', label: 'Closoir de faîtage', format: 'nombre', unite: 'm' },
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
    const marge = 1 + v.marge / 100;
    const faitage = longueurFaitage;
    const rangsParPan = Math.ceil((rampant * 100) / v.pureau - 1e-9) + 1;
    return {
      surface,
      tuiles: Math.ceil(surface * v.tuilesM2 * marge - 1e-9),
      faitieres: Math.ceil(faitage * v.faitieresParMetre * marge - 1e-9),
      rives: Math.ceil(2 * pans * rampant * v.rivesParMetre * marge - 1e-9),
      liteaux: Math.ceil((plan ? (surface * 100) / v.pureau * 1.05 : pans * rangsParPan * longueurPan * 1.05) / v.longueurLiteau - 1e-9),
      rouleauxEcran: Math.ceil((surface * 1.1) / v.surfaceEcran - 1e-9),
      closoir: Math.ceil(faitage),
      chatieres: Math.ceil((surface / 10) * v.chatieresPour10m2 - 1e-9),
      noues: v.longueurNoues > 0 ? Math.ceil((v.longueurNoues * 1.1) / v.longueurElementZinc - 1e-9) : 0,
      solins: v.longueurSolins > 0 ? Math.ceil((v.longueurSolins * 1.1) / v.longueurElementZinc - 1e-9) : 0,
    };
  },

  devis: [
    { resultat: 'tuiles', designation: 'Tuiles', unite: 'tuile', prixChamp: 'prixTuile', detail: '{surface} m² à {tuilesM2} tuiles au m², pente {pente}°' },
    { resultat: 'faitieres', designation: 'Faîtières', unite: 'faîtière', prixChamp: 'prixFaitiere' },
    { resultat: 'rives', designation: 'Tuiles de rive', unite: 'tuile', prixChamp: 'prixRive' },
    { resultat: 'liteaux', designation: 'Liteaux', unite: 'liteau', prixChamp: 'prixLiteau', detail: 'Pureau de {pureau} cm, liteaux de {longueurLiteau} m' },
    { resultat: 'rouleauxEcran', designation: 'Écran de sous-toiture', unite: 'rouleau', prixChamp: 'prixEcran' },
    { resultat: 'closoir', designation: 'Closoir de faîtage', unite: 'm' },
    { resultat: 'chatieres', designation: 'Chatières de ventilation', unite: 'chatière', complement: true },
    { resultat: 'noues', designation: 'Noues', unite: 'élément', detail: '{longueurNoues} m' },
    { resultat: 'solins', designation: 'Solins', unite: 'élément', detail: '{longueurSolins} m' },
  ],

  explication: `
        <p>Surface = nombre de pans × longueur d’un pan (débords de rive compris) × rampant (débord d’égout compris). Tuiles = surface × tuiles au m², plus la marge.</p>
        <p>Les liteaux sont posés tous les pureaux, du bas au haut de chaque pan, sur toute sa longueur. Les faîtières couvrent la ligne de faîtage ; les tuiles de rive, les deux côtés de chaque pan.</p>
        <p>L’écran de sous-toiture est compté avec 10 % de plus pour les recouvrements.</p>`,

  erreurs: [
    'Calculer la surface au sol au lieu de la surface du rampant : plus le toit est pentu, plus la différence est grande.',
    'Oublier les accessoires : faîtières, tuiles de rive, closoirs, chatières et abergements.',
    'Reprendre le nombre de tuiles au m² d’un autre modèle : il varie fortement d’une tuile à l’autre.',
    'Poser sous la pente minimale du modèle.',
  ],

  conseils: [
    'Faites confirmer le pureau par le fabricant : il fixe l’écartement des liteaux.',
    'Prévoyez des tuiles de réserve, car un modèle peut être retiré du catalogue.',
    'Ventilez la sous-face avec des chatières ou un closoir ventilé.',
    'Ne travaillez jamais sur un toit sans protection contre les chutes.',
  ],

  normes: [
    {
      titre: 'Série NF DTU 40.2',
      url: 'https://www.batirama.com/article/1964-la-liste-des-dtu-documents-techniques-unifies-a-jour.html',
      description: 'couvertures en tuiles de terre cuite ou de béton',
    },
    {
      titre: 'NF DTU 40.29',
      url: 'https://www.batirama.com/article/1964-la-liste-des-dtu-documents-techniques-unifies-a-jour.html',
      description: 'mise en œuvre des écrans souples de sous-toiture',
    },
  ],

  lies: ['chevrons-charpente', 'gouttieres', 'conversion-pente', 'couverture-ardoises'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Où trouver le nombre de tuiles au m² ?',
      reponse: 'Sur la fiche technique du modèle : il dépend du format de la tuile et du pureau, qui varie lui-même avec la pente.',
    },
    {
      question: 'Tuiles mécaniques ou tuiles plates ?',
      reponse: 'Les tuiles mécaniques à emboîtement se posent vite, avec une dizaine à une quinzaine de tuiles au m² selon le moule. Les tuiles plates se posent en recouvrement, avec plusieurs dizaines de tuiles au m², pour un aspect traditionnel. Le nombre exact figure sur la fiche du modèle.',
    },
    {
      question: 'Faut-il un écran de sous-toiture ?',
      reponse: 'Il est vivement recommandé : il recueille l’eau ou la neige poudreuse qui passerait sous les tuiles et protège l’isolant. Selon la pente, la longueur du rampant et la zone, le DTU de la couverture peut l’exiger. Choisissez un écran HPV (hautement perméable à la vapeur) sur un comble isolé.',
    },
  ],

  exemples: [
    {
      entrees: { pans: 2, longueurToit: 10, largeurBatiment: 8, pente: 35, debordEgout: 0.3, debordRive: 0.2, tuilesM2: 13, pureau: 34, faitieresParMetre: 2.5, rivesParMetre: 3, longueurLiteau: 4, surfaceEcran: 75, chatieresPour10m2: 1, longueurNoues: 0, longueurSolins: 5, longueurElementZinc: 2, marge: 5, prixTuile: 0, prixFaitiere: 0, prixRive: 0, prixLiteau: 0, prixEcran: 0 },
      attendu: { surface: 107.8084, tuiles: 1472, faitieres: 28, rives: 66, liteaux: 93, rouleauxEcran: 2, closoir: 11, chatieres: 11, noues: 0, solins: 3 },
    },
  ],
};
