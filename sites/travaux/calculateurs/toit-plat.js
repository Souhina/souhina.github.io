// Calculateur : étanchéité d'un toit plat en membrane EPDM d'un seul tenant.
export default {
  slug: 'toit-plat-epdm',
  titre: 'Calcul de membrane EPDM pour un toit plat',
  rubrique: 'Toit plat',
  lot: 'couverture',
  ordre: 5,
  teinte: 'ardoise',
  description: 'Calculez les dimensions et la surface de la membrane EPDM d’un seul tenant, la colle et les profilés de rive d’un toit plat.',
  intro: 'Indiquez les dimensions du toit et la hauteur des relevés : la membrane doit remonter sur les rives et les acrotères.',
  categorie: 'UtilitiesApplication',
  avertissement: 'ce calculateur estime des quantités. Un toit plat demande une pente minimale vers les évacuations, un support adapté et, le plus souvent, un isolant et un trop-plein : suivez la notice du fabricant et les DTU de la série 43 pour l’étanchéité des toitures-terrasses.',

  // Dimensions dessinées sur un plan (pan) ou saisies.
  plan: { nature: 'pan', saisie: true },

  champs: [
    { id: 'longueur', saisie: true, label: 'Longueur du toit', unite: 'm', requis: true, min: 0.5, max: 30, defaut: 5 },
    { id: 'largeur', saisie: true, label: 'Largeur du toit', unite: 'm', requis: true, min: 0.5, max: 30, defaut: 4 },
    { id: 'releve', label: 'Hauteur des relevés', unite: 'cm', requis: true, min: 0, max: 60, defaut: 15, aide: 'Hauteur dont la membrane remonte sur les rives ou les acrotères.' },
    { id: 'colleM2', avance: true, label: 'Colle', unite: 'litres par m²', min: 0, defaut: 0.3, aide: 'Indiquée sur le pot, selon le support.' },
    { id: 'contenancePot', avance: true, label: 'Contenance d’un pot de colle', unite: 'L', min: 0.5, defaut: 5 },
    { id: 'longueurProfile', avance: true, label: 'Longueur d’un profilé de rive', unite: 'm', min: 0.5, defaut: 2.5 },
    { id: 'prixM2', label: 'Prix de la membrane au m²', unite: '€', min: 0 },
    { id: 'prixPot', label: 'Prix d’un pot de colle', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'surfaceMembrane', label: 'Membrane à commander', format: 'nombre', unite: 'm²', principal: true },
    { id: 'longueurMembrane', label: 'Longueur de la membrane', format: 'nombre', unite: 'm' },
    { id: 'largeurMembrane', label: 'Largeur de la membrane', format: 'nombre', unite: 'm' },
    { id: 'potsColle', label: 'Pots de colle', format: 'nombre' },
    { id: 'profiles', label: 'Profilés de rive', format: 'nombre' },
    { id: 'surface', label: 'Surface du toit', format: 'nombre', unite: 'm²' },
  ],

  calculer(v, plan) {
    // Membrane d'un seul tenant : dimensions du toit + 2 relevés + 10 cm de chaque côté pour la fixation.
    const ajout = 2 * (v.releve / 100 + 0.1);
    // Dessin : membrane taillée sur les dimensions hors tout ; relevés sur le pourtour du dessin.
    const longueur = plan ? plan.longueur : v.longueur;
    const largeur = plan ? plan.largeur : v.largeur;
    const longueurMembrane = Math.round((longueur + ajout) * 100) / 100;
    const largeurMembrane = Math.round((largeur + ajout) * 100) / 100;
    const surfaceMembrane = Math.round(longueurMembrane * largeurMembrane * 100) / 100;
    return {
      surface: plan ? plan.surface : longueur * largeur,
      longueurMembrane,
      largeurMembrane,
      surfaceMembrane,
      potsColle: Math.ceil((surfaceMembrane * v.colleM2) / v.contenancePot - 1e-9),
      profiles: Math.ceil(((plan ? plan.perimetre : 2 * (longueur + largeur)) * 1.05) / v.longueurProfile - 1e-9),
    };
  },

  devis: [
    { resultat: 'surfaceMembrane', designation: 'Membrane EPDM', unite: 'm²', prixChamp: 'prixM2', detail: 'Une pièce de {longueurMembrane} × {largeurMembrane} m' },
    { resultat: 'potsColle', designation: 'Colle pour EPDM', unite: 'pot', prixChamp: 'prixPot', complement: true },
    { resultat: 'profiles', designation: 'Profilés de rive', unite: 'profilé', complement: true },
  ],

  explication: `
        <p>La membrane EPDM se commande d’un seul tenant, découpée aux dimensions : longueur et largeur du toit, plus deux fois la hauteur des relevés, plus 10 cm de chaque côté pour la fixation. Un toit de 5 × 4 m avec 15 cm de relevés demande une membrane de 5,50 × 4,50 m.</p>
        <p>Un toit plat doit évacuer l’eau vers ses évacuations. La pente minimale dépend du support et de l’avis technique de la membrane : une pente nulle est admise sur certains supports maçonnés, avec des dispositions particulières, alors que les supports en bois ou en bac acier demandent en général 1 à 3 % au moins. Une forme de pente (chape ou isolant taillé en pente) se prévoit avant la pose si le support est horizontal.</p>
        <p>Les relevés remontent sur les acrotères et les murs, en général d’au moins 15 cm au-dessus de la surface finie (repère du DTU 43.1, à vérifier pour votre cas). Dès que la toiture est entourée de relevés, un trop-plein évacue l’eau si une évacuation se bouche.</p>
        <p>La membrane EPDM existe en plusieurs épaisseurs, souvent 1,14 ou 1,52 mm : la plus épaisse résiste mieux au poinçonnement et aux passages. Sur une toiture isolée, l’isolant doit être prévu pour recevoir une étanchéité et supporter les charges.</p>`,

  erreurs: [
    'Poser sur un toit sans pente vers les évacuations : l’eau stagne.',
    'Oublier les relevés : la membrane doit remonter sur les acrotères et les murs.',
    'Utiliser une colle non prévue pour l’EPDM ou pour le support.',
    'Oublier le trop-plein.',
  ],

  conseils: [
    'Choisissez une membrane d’un seul tenant pour éviter les jonctions.',
    'Laissez la membrane se détendre à plat avant de la coller.',
    'Posez la membrane sur un support propre, sec et sans aspérités.',
  ],

  normes: [
    {
      titre: 'NF DTU 43.4',
      url: 'https://www.batirama.com/article/1964-la-liste-des-dtu-documents-techniques-unifies-a-jour.html',
      description: 'toitures en éléments porteurs en bois et panneaux dérivés, avec revêtement d’étanchéité',
    },
    {
      titre: 'Avis technique de la membrane',
      description: 'conditions de pose propres au produit EPDM choisi',
    },
  ],

  lies: ['gouttieres', 'conversion-pente', 'couverture-plaques'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Quelle pente pour un toit plat ?',
      reponse: 'Elle dépend du support et de l’avis technique de la membrane : une pente nulle est admise sur certains supports maçonnés, avec des dispositions particulières, et les supports en bois ou en bac acier demandent en général 1 à 3 % au moins. Une pente vers les évacuations évite que l’eau stagne.',
    },
    {
      question: 'Quelle hauteur de relevé prévoir ?',
      reponse: 'En général au moins 15 cm au-dessus de la surface finie de la toiture, repère du DTU 43.1 à vérifier selon votre configuration et la notice de la membrane. Le calculateur ajoute à chaque dimension deux fois cette hauteur, plus 10 cm de fixation de chaque côté.',
    },
    {
      question: 'Faut-il un trop-plein ?',
      reponse: 'Oui dès que la toiture est entourée d’acrotères ou de relevés : si l’évacuation principale se bouche, le trop-plein empêche l’eau de monter au-dessus des relevés et d’entrer dans le bâtiment.',
    },
    {
      question: 'Quelle épaisseur de membrane EPDM choisir ?',
      reponse: '1,14 mm convient aux petites toitures peu circulées (abri, garage) ; 1,52 mm résiste mieux au poinçonnement, aux passages d’entretien et aux toitures végétalisées. Suivez l’avis technique de la membrane.',
    },
  ],

  exemples: [
    {
      entrees: { longueur: 5, largeur: 4, releve: 15, colleM2: 0.3, contenancePot: 5, longueurProfile: 2.5, prixM2: 0, prixPot: 0 },
      attendu: { surface: 20, longueurMembrane: 5.5, largeurMembrane: 4.5, surfaceMembrane: 24.75, potsColle: 2, profiles: 8 },
    },
  ],
};
