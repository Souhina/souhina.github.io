// Calculateur : quantité de peinture pour les murs et le plafond d'une pièce.
export default {
  slug: 'quantite-peinture',
  titre: 'Calcul de la quantité de peinture',
  rubrique: 'Peinture',
  lot: 'murs',
  ordre: 1,
  teinte: 'peinture',
  description: 'Dessinez votre pièce et calculez la surface à peindre, les litres et le nombre de pots de peinture pour les murs et le plafond.',
  intro: 'Dessinez la pièce, indiquez la hauteur sous plafond et les ouvertures : les litres et le nombre de pots s’affichent immédiatement.',
  categorie: 'UtilitiesApplication',
  // Aide au choix : questions fermées qui préremplissent les champs de type liste ou case.
  aideAuChoix: {
    questions: [
      { id: 'piece', question: 'Quelle pièce peignez-vous ?', options: [{ valeur: 'vie', libelle: 'Une pièce de vie ou une chambre' }, { valeur: 'humide', libelle: 'Une cuisine ou une salle de bains' }, { valeur: 'passage', libelle: 'Une entrée ou un couloir, très sollicités' }] },
      { id: 'support', question: 'Sur quel support ?', options: [{ valeur: 'neuf', libelle: 'Plâtre ou plaque de plâtre neufs' }, { valeur: 'sain', libelle: 'Une peinture en bon état' }, { valeur: 'repare', libelle: 'Un mur taché, poreux ou rebouché par endroits' }] },
      { id: 'couleur', question: 'Changez-vous nettement de couleur (du foncé vers le clair, par exemple) ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
      { id: 'plafond', question: 'Peignez-vous aussi le plafond ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
    ],
    regles: [
      { si: { piece: 'humide' }, alors: { finition: { valeur: 2, raison: 'car elle résiste à l’humidité et se lessive' } } },
      { si: { piece: 'passage' }, alors: { finition: { valeur: 2, raison: 'car elle résiste aux frottements et se lessive' } } },
      { si: {}, alors: { finition: { valeur: 1, raison: 'bon compromis entre aspect et entretien' } } },
      { si: { support: 'neuf' }, alors: { sousCouche: { valeur: 1, raison: 'car un plâtre neuf boit la peinture' } } },
      { si: { support: 'repare' }, alors: { sousCouche: { valeur: 1, raison: 'pour uniformiser un support taché ou rebouché' } } },
      { si: { couleur: 'oui' }, alors: { sousCouche: { valeur: 1, raison: 'pour couvrir un changement de couleur marqué' } } },
      { si: {}, alors: { sousCouche: { valeur: 0, raison: 'inutile sur une peinture saine de couleur proche' } } },
      { si: { plafond: 'oui' }, alors: { plafond: { valeur: 1, raison: 'le plafond se peint d’habitude avec une peinture mate spéciale plafond' } } },
      { si: { plafond: 'non' }, alors: { plafond: { valeur: 0, raison: '' } } },
    ],
  },

  plan: true,

  champs: [
    { id: 'hauteur', lienPiece: 'hauteur', label: 'Hauteur sous plafond', unite: 'm', requis: true, min: 0.5, max: 10, defaut: 2.5 },
    { id: 'tableaux', remplacePar: 'surfaceTableaux', avance: true, label: 'Retours de tableau à peindre', unite: 'm²', min: 0, defaut: 0, aide: 'Côtés et dessus des portes et fenêtres dans un mur épais. Calculés d’après le plan quand il contient des ouvertures.' },
    { id: 'ouvertures', remplacePar: 'surfaceOuvertures', label: 'Surface des portes et fenêtres', unite: 'm²', min: 0, defaut: 0, aide: 'À déduire des murs. Repère : une porte fait environ 1,7 m², une fenêtre courante environ 1,5 m².' },
    { id: 'couches', label: 'Nombre de couches', requis: true, min: 1, max: 5, defaut: 2 },
    {
      id: 'finition',
      type: 'choix',
      label: 'Finition de la peinture des murs',
      defaut: 1,
      aide: 'Même calcul pour toutes les finitions ; la finition est reprise dans le récapitulatif.',
      options: [
        { valeur: 0, libelle: 'Mate : masque les défauts du mur' },
        { valeur: 1, libelle: 'Velours : pièces de vie, se nettoie mieux' },
        { valeur: 2, libelle: 'Satinée : pièces humides, cuisine, boiseries' },
        { valeur: 3, libelle: 'Brillante : boiseries, effet décoratif' },
      ],
    },
    { id: 'rendement', label: 'Rendement de la peinture', unite: 'm² par litre', requis: true, min: 1, defaut: 10, aide: 'Indiqué sur le pot, pour une couche.' },
    { id: 'contenance', label: 'Contenance d’un pot', unite: 'litres', requis: true, min: 0.1, defaut: 2.5 },
    { id: 'plafond', type: 'case', label: 'Peindre aussi le plafond', defaut: false },
    { id: 'sousCouche', type: 'case', label: 'Prévoir une sous-couche d’impression', defaut: false, aide: 'Sur plâtre neuf, support poreux, taché ou changement de couleur marqué.' },
    { id: 'rendementSousCouche', avance: true, label: 'Rendement de la sous-couche', unite: 'm² par litre', min: 1, defaut: 10 },
    { id: 'prixPotSousCouche', label: 'Prix d’un pot de sous-couche', unite: '€', min: 0 },
    { id: 'prixPot', label: 'Prix d’un pot pour les murs', unite: '€', min: 0 },
    { id: 'prixPotPlafond', label: 'Prix d’un pot pour le plafond', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'potsMurs', equivalent: { champ: 'contenance', unite: 'L' }, label: 'Pots de peinture pour les murs', format: 'nombre', principal: true },
    { id: 'litresMurs', label: 'Litres nécessaires pour les murs', format: 'nombre', unite: 'L' },
    { id: 'surfaceMurs', label: 'Surface des murs à peindre', format: 'nombre', unite: 'm²' },
    { id: 'potsPlafond', equivalent: { champ: 'contenance', unite: 'L' }, label: 'Pots de peinture pour le plafond', format: 'nombre' },
    { id: 'litresPlafond', label: 'Litres nécessaires pour le plafond', format: 'nombre', unite: 'L' },
    { id: 'potsSousCouche', equivalent: { champ: 'contenance', unite: 'L' }, label: 'Pots de sous-couche', format: 'nombre' },
  ],

  // Reçoit la forme dessinée : plan.perimetre et plan.surface sont en mètres et m².
  calculer(v, plan) {
    const surfaceMurs = Math.max(0, plan.perimetre * v.hauteur - v.ouvertures + (v.tableaux ?? 0));
    const litresMurs = (surfaceMurs * v.couches) / v.rendement;
    const surfacePlafond = v.plafond ? plan.surface : 0;
    const litresPlafond = (surfacePlafond * v.couches) / v.rendement;
    return {
      surfaceMurs,
      litresMurs,
      potsMurs: Math.ceil(litresMurs / v.contenance),
      litresPlafond: v.plafond ? litresPlafond : null,
      potsPlafond: v.plafond ? Math.ceil(litresPlafond / v.contenance) : null,
      // Sous-couche : une seule couche, sur les murs et le plafond s'il est peint.
      potsSousCouche: v.sousCouche ? Math.ceil((surfaceMurs + surfacePlafond) / v.rendementSousCouche / v.contenance - 1e-9) : 0,
    };
  },

  devis: [
    { resultat: 'potsMurs', achat: 'peinture', detail: '{surfaceMurs} m² de murs, {couches} couches, pots de {contenance} L, finition {finition:libelle}', designation: 'Peinture murs', unite: 'pot', prixChamp: 'prixPot' },
    { resultat: 'potsPlafond', detail: '{couches} couches, pots de {contenance} L', designation: 'Peinture plafond', unite: 'pot', prixChamp: 'prixPotPlafond' },
    { resultat: 'potsSousCouche', designation: 'Sous-couche d’impression', unite: 'pot', prixChamp: 'prixPotSousCouche', complement: true, detail: 'Une couche, pots de {contenance} L' },
  ],

  explication: `
        <p>La surface des murs est le périmètre de la pièce dessinée multiplié par la hauteur sous plafond, moins la surface des portes et fenêtres.</p>
        <p>Litres = surface × nombre de couches ÷ rendement. Le nombre de pots est arrondi à l’unité supérieure.</p>
        <p>Le plafond est compté à part, car on utilise en général une peinture spécifique. Un support poreux ou très foncé peut demander une sous-couche ou une couche supplémentaire.</p>`,

  majLe: '2026-09-30',

  erreurs: [
    'Oublier la sous-couche sur un plâtre neuf ou une plaque de plâtre : le support boit la peinture, qui se met à « faire des reprises » et demande une couche de plus.',
    'Calculer une seule couche : un rendu uniforme en demande presque toujours deux, surtout pour un changement de couleur.',
    'Prendre le rendement indiqué sur le pot pour un support lisse alors que le mur est rugueux ou poreux : il faut alors prévoir davantage de peinture.',
    'Acheter au dernier moment un pot de complément : une teinte fabriquée à la machine peut varier d’un lot à l’autre. Mieux vaut tout acheter en une fois, et mélanger les pots entre eux.',
    'Peindre sur un support humide, gras ou poussiéreux : la peinture accroche mal et s’écaille.',
  ],

  conseils: [
    'Lessivez les murs, rebouchez les trous et les fissures, poncez les reprises, puis dépoussiérez avant la première couche.',
    'Protégez les sols et les huisseries, et démontez les caches des prises et interrupteurs après avoir coupé le courant.',
    'Commencez par le plafond, puis les murs, et terminez par les boiseries.',
    'Peignez d’abord les angles et les bords au pinceau, puis les surfaces au rouleau, en croisant les passes et en finissant dans le même sens.',
    'Respectez le temps de séchage entre deux couches indiqué sur le pot, et aérez la pièce pendant et après les travaux.',
    'En intérieur, préférez une peinture étiquetée A+ : c’est la classe d’émissions de polluants volatils la plus faible.',
  ],

  normes: [
    {
      titre: 'NF DTU 59.1 P1-1',
      url: 'https://www.boutique.afnor.org/fr-fr/norme/nf-dtu-591-p11/travaux-de-batiment-revetements-de-peinture-en-feuil-mince-semiepais-ou-epa/fa170291/41498',
      description: 'travaux de peinture des bâtiments, conditions de mise en œuvre en intérieur et en extérieur (AFNOR, juin 2013)',
    },
    {
      titre: 'Étiquetage des émissions en polluants volatils',
      url: 'https://www.ecologie.gouv.fr/politiques-publiques/etiquetage-produits-construction',
      description: 'classes de A+ à C affichées sur les peintures (arrêté du 19 avril 2011), présentées par le ministère de la Transition écologique',
    },
  ],

  lies: ['quantite-papier-peint', 'plaques-de-platre', 'quantite-plinthes', 'peinture-facade'],

  faq: [
    {
      question: 'Faut-il toujours deux couches ?',
      reponse: 'Deux couches sont la règle pour un rendu uniforme. Une seule peut suffire pour rafraîchir un mur de même couleur avec une peinture couvrante.',
    },
    {
      question: 'Où trouver le rendement de ma peinture ?',
      reponse: 'Il est indiqué sur le pot ou sur la fiche technique, en m² par litre et pour une couche. Il baisse sur un support rugueux ou poreux.',
    },
    {
      question: 'Combien de litres de peinture pour une pièce de 12 m² ?',
      reponse: 'Pour une pièce de 3 × 4 m sous 2,50 m : 14 m de périmètre × 2,50 m = 35 m² de murs, moins environ 3 m² d’ouvertures, soit 32 m². En deux couches à 10 m² par litre, il faut environ 6,4 litres, sans compter le plafond.',
    },
    {
      question: 'Mat, velours ou satiné ?',
      reponse: 'Le mat masque les défauts du mur mais se nettoie moins bien ; le velours est un bon compromis pour les pièces de vie ; le satiné se lessive facilement et convient aux cuisines, salles de bains et boiseries, mais il révèle les défauts du support.',
    },
  ],

  exemples: [
    {
      plan: [[0, 0], [400, 0], [400, 300], [0, 300]],
      entrees: { hauteur: 2.5, tableaux: 0, ouvertures: 3.2, couches: 2, rendement: 10, contenance: 2.5, plafond: 1, sousCouche: 1, rendementSousCouche: 10, prixPotSousCouche: 0, prixPot: 0, prixPotPlafond: 0 },
      attendu: { potsSousCouche: 2, surfaceMurs: 31.8, litresMurs: 6.36, potsMurs: 3, litresPlafond: 2.4, potsPlafond: 1 },
    },
    {
      plan: [[0, 0], [500, 0], [500, 250], [300, 250], [300, 400], [0, 400]],
      entrees: { hauteur: 2.5, tableaux: 0, ouvertures: 0, couches: 2, rendement: 10, contenance: 2.5, plafond: 0, sousCouche: 0, rendementSousCouche: 10, prixPotSousCouche: 0, prixPot: 0, prixPotPlafond: 0 },
      attendu: { surfaceMurs: 45, litresMurs: 9, potsMurs: 4, potsPlafond: null },
    },
    {
      // Ouvertures placées sur le plan : une porte 83 × 204 et une fenêtre 120 × 135, soit 3,3132 m².
      // Le champ manuel (0 m²) est remplacé : murs = 14 × 2,5 − 3,3132 = 31,6868 m².
      plan: [[0, 0], [400, 0], [400, 300], [0, 300]],
      ouvertures: [
        { type: 'porte', cote: 0, largeur: 83, hauteur: 204, position: 50 },
        { type: 'fenetre', cote: 1, largeur: 120, hauteur: 135, position: 90 },
      ],
      entrees: { hauteur: 2.5, tableaux: 0, ouvertures: 0, couches: 2, rendement: 10, contenance: 2.5, plafond: 0, sousCouche: 0, rendementSousCouche: 10, prixPotSousCouche: 0, prixPot: 0, prixPotPlafond: 0 },
      attendu: { surfaceMurs: 31.6868, litresMurs: 6.3374, potsMurs: 3 },
    },
  ],
};
