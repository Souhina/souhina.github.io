// Calculateur : longueurs et nombre de linteaux préfabriqués (quantités, pas de dimensionnement).
export default {
  slug: 'linteaux',
  titre: 'Calcul des longueurs de linteaux',
  rubrique: 'Linteaux',
  lot: 'gros-oeuvre',
  ordre: 3,
  teinte: 'linteau',
  description: 'Calculez la longueur des linteaux à commander pour vos portes et fenêtres, appuis compris, et leur nombre par largeur d’ouverture.',
  intro: 'Indiquez jusqu’à trois largeurs d’ouverture et leur nombre : chaque linteau dépasse de l’appui de chaque côté, puis sa longueur est arrondie aux longueurs vendues.',
  categorie: 'UtilitiesApplication',
  avertissement: 'ce calculateur donne des longueurs et des quantités. La section, les armatures et l’appui minimal d’un linteau dépendent de la portée, des charges et de la maçonnerie : suivez la fiche du fabricant ou l’étude d’un bureau d’études.',

  champs: [
    { id: 'largeur1', label: 'Largeur des ouvertures, type 1', unite: 'm', requis: true, min: 0.1, defaut: 0.9 },
    { id: 'nombre1', label: 'Nombre d’ouvertures, type 1', requis: true, min: 0, defaut: 2 },
    { id: 'largeur2', label: 'Largeur des ouvertures, type 2', unite: 'm', min: 0, defaut: 1.2 },
    { id: 'nombre2', label: 'Nombre d’ouvertures, type 2', min: 0, defaut: 3 },
    { id: 'largeur3', label: 'Largeur des ouvertures, type 3', unite: 'm', min: 0, defaut: 0 },
    { id: 'nombre3', label: 'Nombre d’ouvertures, type 3', min: 0, defaut: 0 },
    { id: 'appui', label: 'Appui de chaque côté', unite: 'cm', requis: true, min: 5, defaut: 20, aide: 'Longueur posée sur la maçonnerie de part et d’autre, selon le fabricant.' },
    { id: 'pas', label: 'Pas des longueurs vendues', unite: 'm', requis: true, min: 0.05, defaut: 0.2, aide: 'Les linteaux préfabriqués existent souvent de 20 cm en 20 cm.' },
    { id: 'prix1', label: 'Prix d’un linteau, type 1', unite: '€', min: 0 },
    { id: 'prix2', label: 'Prix d’un linteau, type 2', unite: '€', min: 0 },
    { id: 'prix3', label: 'Prix d’un linteau, type 3', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'total', label: 'Linteaux à commander', format: 'nombre', principal: true },
    { id: 'longueur1', label: 'Longueur des linteaux, type 1', format: 'nombre', unite: 'm' },
    { id: 'longueur2', label: 'Longueur des linteaux, type 2', format: 'nombre', unite: 'm' },
    { id: 'longueur3', label: 'Longueur des linteaux, type 3', format: 'nombre', unite: 'm' },
    { id: 'metresLineaires', label: 'Longueur totale', format: 'nombre', unite: 'm' },
    { id: 'quantite1', label: 'Linteaux de type 1', format: 'nombre' },
    { id: 'quantite2', label: 'Linteaux de type 2', format: 'nombre' },
    { id: 'quantite3', label: 'Linteaux de type 3', format: 'nombre' },
  ],

  calculer(v) {
    // Longueur = ouverture + deux appuis, arrondie au pas des longueurs vendues.
    function longueur(largeur) {
      if (!(largeur > 0)) return null;
      const brute = largeur + (2 * v.appui) / 100;
      return Math.round(Math.ceil(brute / v.pas - 1e-9) * v.pas * 100) / 100;
    }
    const types = [[v.largeur1, v.nombre1], [v.largeur2, v.nombre2], [v.largeur3, v.nombre3]].map(([largeur, nombre]) => ({
      longueur: longueur(largeur),
      nombre: largeur > 0 ? Math.round(nombre) : 0,
    }));
    return {
      longueur1: types[0].longueur,
      longueur2: types[1].longueur,
      longueur3: types[2].longueur,
      quantite1: types[0].nombre,
      quantite2: types[1].nombre,
      quantite3: types[2].nombre,
      total: types.reduce((somme, type) => somme + type.nombre, 0),
      metresLineaires: Math.round(types.reduce((somme, type) => somme + (type.longueur ?? 0) * type.nombre, 0) * 100) / 100,
    };
  },

  devis: [
    // Une ligne par type d'ouverture ; les types sans ouverture n'apparaissent pas dans le récapitulatif.
    { resultat: 'quantite1', designation: 'Linteaux, ouvertures type 1', unite: 'linteau', prixChamp: 'prix1', detail: 'Longueur {longueur1} m pour une ouverture de {largeur1} m' },
    { resultat: 'quantite2', designation: 'Linteaux, ouvertures type 2', unite: 'linteau', prixChamp: 'prix2', detail: 'Longueur {longueur2} m pour une ouverture de {largeur2} m' },
    { resultat: 'quantite3', designation: 'Linteaux, ouvertures type 3', unite: 'linteau', prixChamp: 'prix3', detail: 'Longueur {longueur3} m pour une ouverture de {largeur3} m' },
  ],

  explication: `
        <p>Longueur d’un linteau = largeur de l’ouverture + deux appuis, arrondie à la longueur vendue immédiatement supérieure. Avec 20 cm d’appui, une porte de 90 cm demande un linteau de 1,30 m, commandé en 1,40 m si les longueurs vont de 20 cm en 20 cm.</p>
        <p>Le calcul regroupe les ouvertures par largeur pour donner une liste de commande.</p>`,

  erreurs: [
    'Commander un linteau à la largeur de l’ouverture sans ses appuis.',
    'Choisir la section sans tenir compte des charges.',
    'Poser un linteau préfabriqué à l’envers.',
  ],

  conseils: [
    'Faites dimensionner les linteaux d’un mur porteur par un professionnel.',
    'Étayez le linteau coulé en place jusqu’à la fin de la prise.',
    'Respectez le sens de pose marqué sur le linteau préfabriqué.',
  ],

  normes: [
    {
      titre: 'NF DTU 20.1',
      url: 'https://www.batirama.com/article/2217-nf-dtu-20.1-monter-des-murs-en-maconnerie-de-petits-elements.html',
      description: 'ouvrages en maçonnerie de petits éléments',
    },
    {
      titre: 'NF EN 1992 (Eurocode 2)',
      description: 'calcul des structures en béton',
    },
  ],

  lies: ['mur-parpaings-briques', 'calcul-beton', 'treillis-soude'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Pourquoi le calculateur ne donne-t-il pas la section du linteau ?',
      reponse: 'La section et les armatures dépendent de ce que le linteau porte (plancher, toiture, maçonnerie au-dessus) : c’est un calcul de structure, fait par le fabricant dans ses tableaux de charges ou par un bureau d’études.',
    },
  ],

  exemples: [
    {
      entrees: { largeur1: 0.9, nombre1: 2, largeur2: 1.2, nombre2: 3, largeur3: 0, nombre3: 0, appui: 20, pas: 0.2, prix1: 0, prix2: 0, prix3: 0 },
      attendu: { total: 5, longueur1: 1.4, longueur2: 1.6, longueur3: null, metresLineaires: 7.6, quantite1: 2, quantite2: 3, quantite3: 0 },
    },
  ],
};
