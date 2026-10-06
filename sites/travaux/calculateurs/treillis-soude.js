// Calculateur : treillis soudé d'une dalle (panneaux, recouvrements, cales).
export default {
  slug: 'treillis-soude',
  titre: 'Calcul de treillis soudé pour une dalle',
  rubrique: 'Treillis soudé',
  lot: 'gros-oeuvre',
  ordre: 1.2,
  teinte: 'grosoeuvre',
  description: 'Calculez le nombre de panneaux de treillis soudé d’une dalle ou d’un dallage, recouvrements compris, et les cales d’enrobage.',
  intro: 'Indiquez les dimensions de la dalle et le format des panneaux : les panneaux se recouvrent sur leurs bords.',
  categorie: 'UtilitiesApplication',
  avertissement: 'ce calculateur donne des quantités, pas un dimensionnement. Le type de treillis (section des fils, maille), les recouvrements et l’enrobage dépendent de l’ouvrage et des charges : dallage selon le DTU 13.3, dalle porteuse selon l’étude d’un bureau d’études.',

  // Dimensions dessinées sur un plan (zone) ou saisies.
  plan: { nature: 'zone', saisie: true },

  champs: [
    { id: 'longueur', saisie: true, label: 'Longueur de la dalle', unite: 'm', requis: true, min: 0.5, max: 200, defaut: 6 },
    { id: 'largeur', saisie: true, label: 'Largeur de la dalle', unite: 'm', requis: true, min: 0.5, max: 200, defaut: 4 },
    { id: 'longueurPanneau', label: 'Longueur d’un panneau', unite: 'm', requis: true, min: 1, max: 12, defaut: 6, aide: 'Format courant : 6,00 × 2,40 m.' },
    { id: 'largeurPanneau', label: 'Largeur d’un panneau', unite: 'm', requis: true, min: 0.5, max: 4, defaut: 2.4 },
    { id: 'recouvrement', label: 'Recouvrement entre panneaux', unite: 'cm', min: 0, max: 100, defaut: 20, aide: 'Souvent deux mailles ; la valeur exacte dépend du treillis et de l’ouvrage : à vérifier.' },
    { id: 'calesM2', avance: true, label: 'Cales d’enrobage par m²', min: 0, defaut: 4, aide: 'Valeur indicative, à vérifier : elles maintiennent le treillis dans l’épaisseur du béton.' },
    { id: 'prixPanneau', label: 'Prix d’un panneau', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'panneaux', label: 'Panneaux de treillis soudé', format: 'nombre', principal: true },
    { id: 'panneauxLongueur', label: 'Panneaux dans la longueur', format: 'nombre' },
    { id: 'panneauxLargeur', label: 'Rangées dans la largeur', format: 'nombre' },
    { id: 'cales', label: 'Cales d’enrobage', format: 'nombre' },
    { id: 'surface', label: 'Surface de la dalle', format: 'nombre', unite: 'm²' },
  ],

  calculer(v, plan) {
    const recouvrement = v.recouvrement / 100;
    // Panneaux posés dans le sens de la longueur ; chaque raccord consomme un recouvrement.
    const nombre = (cote, panneau) => (cote <= panneau ? 1 : Math.ceil((cote - recouvrement) / (panneau - recouvrement) - 1e-9));
    if (recouvrement >= v.largeurPanneau) return { erreur: 'Le recouvrement doit être plus petit que la largeur d’un panneau.' };
    // Dessin : panneaux posés sur les dimensions hors tout de la zone (prudent pour une forme non rectangulaire).
    const longueur = plan ? plan.longueur : v.longueur;
    const largeur = plan ? plan.largeur : v.largeur;
    const panneauxLongueur = nombre(longueur, v.longueurPanneau);
    const panneauxLargeur = nombre(largeur, v.largeurPanneau);
    const surface = plan ? plan.surface : longueur * largeur;
    return {
      surface,
      panneauxLongueur,
      panneauxLargeur,
      panneaux: panneauxLongueur * panneauxLargeur,
      cales: Math.ceil(surface * v.calesM2 - 1e-9),
    };
  },

  devis: [
    { resultat: 'panneaux', designation: 'Treillis soudé', unite: 'panneau', prixChamp: 'prixPanneau', detail: 'Dalle de {longueur} × {largeur} m, panneaux de {longueurPanneau} × {largeurPanneau} m, recouvrement {recouvrement} cm' },
    { resultat: 'cales', designation: 'Cales d’enrobage', unite: 'cale', complement: true },
  ],

  explication: `
        <p>Les panneaux sont posés dans le sens de la longueur de la dalle et se recouvrent sur leurs bords. Nombre de panneaux sur un côté = (côté − recouvrement) ÷ (dimension du panneau − recouvrement), arrondi au-dessus. Une dalle de 6 × 4 m avec des panneaux de 6 × 2,40 m et 20 cm de recouvrement demande 1 × 2 = 2 panneaux.</p>
        <p>Les cales maintiennent le treillis à la bonne hauteur dans le béton, pour qu’il soit enrobé de tous côtés.</p>`,

  erreurs: [
    'Oublier les recouvrements entre panneaux.',
    'Poser le treillis directement sur le sol : il doit être enrobé de béton, sur des cales.',
    'Choisir le treillis au hasard : sa section et sa maille dépendent de l’ouvrage et des charges.',
  ],

  conseils: [
    'Utilisez des cales d’enrobage adaptées à l’épaisseur de béton prévue.',
    'Ligaturez les panneaux entre eux pour qu’ils ne bougent pas pendant le coulage.',
    'Faites dimensionner le ferraillage d’un ouvrage porteur par un bureau d’études.',
  ],

  normes: [
    {
      titre: 'NF DTU 13.3',
      url: 'https://www.batirama.com/article/10538-nf-dtu-13.3-travaux-de-dallages.html',
      description: 'dallages : conception, calcul et exécution',
    },
    {
      titre: 'NF DTU 21',
      url: 'https://www.batirama.com/article/12088-nf-dtu-21-execution-des-ouvrages-en-beton.html',
      description: 'exécution des ouvrages en béton',
    },
  ],

  lies: ['calcul-beton', 'terrassement-deblai', 'linteaux'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Quel treillis choisir ?',
      reponse: 'La désignation (par exemple ST 25 C) indique la section des fils et la maille. Elle se choisit selon l’ouvrage : dallage de garage, terrasse, dalle porteuse. Le DTU 13.3 encadre les dallages ; une dalle porteuse demande une étude.',
    },
    {
      question: 'Quel recouvrement entre deux panneaux ?',
      reponse: 'En repère courant, au moins deux mailles, soit une vingtaine de centimètres pour une maille de 10 cm. La notice du treillis et le DTU 13.3 font foi.',
    },
    {
      question: 'À quelle hauteur placer le treillis dans la dalle ?',
      reponse: 'Jamais au contact du sol : des cales le maintiennent dans l’épaisseur du béton pour qu’il soit enrobé de tous côtés. La hauteur exacte dépend de l’ouvrage et de son rôle (anti-fissuration ou armature) : suivez le DTU 13.3 et la fiche du treillis.',
    },
  ],

  exemples: [
    {
      entrees: { longueur: 6, largeur: 4, longueurPanneau: 6, largeurPanneau: 2.4, recouvrement: 20, calesM2: 4, prixPanneau: 0 },
      attendu: { panneauxLongueur: 1, panneauxLargeur: 2, panneaux: 2, cales: 96, surface: 24 },
    },
    {
      // 10 × 7 m : 2 panneaux dans la longueur ((10 − 0,2) ÷ 5,8), 4 rangées ((7 − 0,2) ÷ 2,2 = 3,09).
      entrees: { longueur: 10, largeur: 7, longueurPanneau: 6, largeurPanneau: 2.4, recouvrement: 20, calesM2: 4, prixPanneau: 0 },
      attendu: { panneauxLongueur: 2, panneauxLargeur: 4, panneaux: 8 },
    },
  ],
};
