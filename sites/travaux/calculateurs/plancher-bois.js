// Calculateur : plancher bois (solives et panneaux), quantités seules.
export default {
  slug: 'plancher-bois',
  titre: 'Calcul d’un plancher bois : solives et panneaux',
  rubrique: 'Plancher bois',
  lot: 'menuiserie',
  ordre: 2,
  teinte: 'bois',
  description: 'Calculez le nombre et la longueur des solives et le nombre de panneaux OSB ou d’aggloméré d’un plancher bois, sans dimensionner les sections.',
  intro: 'Indiquez la longueur du plancher, la portée des solives et l’entraxe : le calcul compte les solives et les panneaux.',
  categorie: 'UtilitiesApplication',
  avertissement: 'ce calculateur donne des quantités, pas de dimensionnement. La section des solives, leur entraxe et leurs appuis dépendent de la portée et des charges : ils se déterminent avec un professionnel ou un bureau d’études (Eurocode 5), et la pose des panneaux suit le DTU 51.3.',

  // Dimensions dessinées sur un plan (piece) ou saisies.
  plan: { nature: 'piece', saisie: true },

  champs: [
    { id: 'longueur', saisie: true, label: 'Longueur du plancher, perpendiculaire aux solives', unite: 'm', requis: true, min: 0.5, max: 50, defaut: 4 },
    { id: 'portee', saisie: true, label: 'Portée des solives, entre appuis', unite: 'm', requis: true, min: 0.5, max: 12, defaut: 3.5 },
    {
      id: 'entraxe',
      type: 'choix',
      label: 'Entraxe des solives',
      defaut: 50,
      options: [
        { valeur: 40, libelle: '40 cm' },
        { valeur: 50, libelle: '50 cm' },
        { valeur: 60, libelle: '60 cm' },
      ],
    },
    { id: 'appui', avance: true, label: 'Appui à chaque extrémité', unite: 'cm', min: 0, defaut: 10 },
    { id: 'longueurVendue', avance: true, label: 'Longueur maximale des solives vendues', unite: 'm', min: 1, defaut: 5 },
    { id: 'surfacePanneau', avance: true, label: 'Surface d’un panneau', unite: 'm²', min: 0.2, defaut: 1.6875, aide: 'Panneau rainuré de 2,50 × 0,675 m : 1,6875 m².' },
    { id: 'visM2', avance: true, label: 'Vis par m² de panneaux', min: 0, defaut: 20 },
    { id: 'marge', label: 'Marge pour les coupes', unite: '%', min: 0, max: 30, defaut: 5 },
    { id: 'prixSolive', label: 'Prix d’une solive', unite: '€', min: 0 },
    { id: 'prixPanneau', label: 'Prix d’un panneau', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'solives', label: 'Solives', format: 'nombre', principal: true },
    { id: 'longueurSolive', label: 'Longueur d’une solive, appuis compris', format: 'nombre', unite: 'm' },
    { id: 'panneaux', label: 'Panneaux', format: 'nombre' },
    { id: 'vis', label: 'Vis', format: 'nombre' },
    { id: 'surface', label: 'Surface du plancher', format: 'nombre', unite: 'm²' },
  ],

  calculer(v, plan) {
    // Dessin : les solives franchissent la plus petite dimension de la pièce (portée).
    const longueur = plan ? Math.max(plan.longueur, plan.largeur) : v.longueur;
    const portee = plan ? Math.min(plan.longueur, plan.largeur) : v.portee;
    const lignes = Math.floor((longueur * 100) / v.entraxe + 1e-9) + 1;
    const longueurSolive = Math.round((portee + (2 * v.appui) / 100) * 100) / 100;
    const surface = plan ? plan.surface : longueur * portee;
    return {
      surface,
      longueurSolive,
      solives: lignes * Math.ceil(longueurSolive / v.longueurVendue - 1e-9),
      panneaux: Math.ceil((surface * (1 + v.marge / 100)) / v.surfacePanneau - 1e-9),
      vis: Math.ceil(surface * v.visM2 - 1e-9),
    };
  },

  devis: [
    { resultat: 'solives', designation: 'Solives', unite: 'solive', prixChamp: 'prixSolive', detail: 'Longueur {longueurSolive} m, entraxe {entraxe} cm' },
    { resultat: 'panneaux', designation: 'Panneaux de plancher', unite: 'panneau', prixChamp: 'prixPanneau', detail: '{surface} m²' },
    { resultat: 'vis', designation: 'Vis de plancher', unite: 'vis', complement: true },
  ],

  explication: `
        <p>Solives = longueur du plancher ÷ entraxe, plus une. Chaque solive mesure la portée plus un appui à chaque extrémité. Panneaux = surface × (1 + marge) ÷ surface d’un panneau.</p>
        <p>Un plancher bois se compose de solives, qui portent la charge, de panneaux (aggloméré ou OSB), qui forment le sol, et d’appuis : maçonnerie, muraillère ou sabots métalliques. Le calcul compte les solives et les panneaux ; les sabots se comptent à part, un par extrémité de solive fixée sur une poutre ou une muraillère.</p>
        <p>L’entraxe de 40, 50 ou 60 cm dépend surtout de l’épaisseur du panneau : plus le panneau est fin, plus les solives doivent être rapprochées. La fiche du panneau indique l’entraxe maximal admis pour son épaisseur et pour l’usage prévu.</p>
        <p>Choisissez des panneaux à rainure et languette, d’une classe adaptée à l’humidité de la pièce (par exemple aggloméré P5 ou OSB/3 en milieu humide), posés perpendiculairement aux solives, à joints décalés, avec les bords courts qui tombent sur une solive et un jeu le long des murs.</p>`,

  erreurs: [
    'Choisir la section des solives sans calcul : elle dépend de la portée et des charges.',
    'Oublier les chevêtres autour d’une trémie d’escalier.',
    'Poser des panneaux sans jeu de dilatation ni décalage des joints.',
    'Poser un plancher sur les fermettes de combles perdus, qui ne sont pas conçues pour porter cette charge.',
  ],

  conseils: [
    'Faites dimensionner les solives par un charpentier ou un bureau d’études.',
    'Collez et vissez les panneaux pour limiter les grincements.',
    'Posez les panneaux perpendiculairement aux solives.',
  ],

  normes: [
    {
      titre: 'NF DTU 51.3',
      url: 'https://www.batirama.com/article/1964-la-liste-des-dtu-documents-techniques-unifies-a-jour.html',
      description: 'planchers en bois ou en panneaux dérivés du bois',
    },
    {
      titre: 'NF DTU 31.1',
      url: 'https://www.batirama.com/article/12218-nf-dtu-31.1-charpente-en-bois.html',
      description: 'charpente en bois',
    },
  ],

  lies: ['calcul-escalier', 'quantite-parquet', 'chevrons-charpente'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Pourquoi le calculateur ne donne-t-il pas la section des solives ?',
      reponse: 'La section dépend de la portée, de l’usage (habitation, stockage), des cloisons posées dessus et de l’essence du bois : c’est un calcul de structure, fait avec les tableaux d’un fabricant ou par un bureau d’études.',
    },
    {
      question: 'Quel entraxe de solives choisir ?',
      reponse: 'Celui qu’autorise l’épaisseur du panneau pour l’usage prévu, indiqué sur sa fiche technique : on rencontre couramment 40 à 60 cm. La section des solives, elle, dépend de la portée et des charges et se calcule à part.',
    },
    {
      question: 'Faut-il des sabots de solive ?',
      reponse: 'Quand une solive ne repose pas directement sur un mur, elle se fixe sur une poutre ou une muraillère par un sabot métallique, un à chaque extrémité concernée, vissé ou pointé selon la notice du fabricant.',
    },
    {
      question: 'Peut-on poser un plancher dans des combles perdus ?',
      reponse: 'Pas sans vérification : les fermettes industrielles sont calculées pour porter la toiture, pas un plancher habitable avec meubles et occupants. Aménager des combles perdus demande l’avis d’un charpentier ou d’un bureau d’études.',
    },
  ],

  exemples: [
    {
      entrees: { longueur: 4, portee: 3.5, entraxe: 50, appui: 10, longueurVendue: 5, surfacePanneau: 1.6875, visM2: 20, marge: 5, prixSolive: 0, prixPanneau: 0 },
      attendu: { solives: 9, longueurSolive: 3.7, panneaux: 9, vis: 280, surface: 14 },
    },
  ],
};
