// Calculateur : plaquettes de parement (pierre, brique), angles et mortier-colle.
export default {
  slug: 'quantite-parement',
  titre: 'Calcul de parement mural',
  rubrique: 'Parement',
  lot: 'murs',
  ordre: 4,
  teinte: 'parement',
  description: 'Calculez le nombre de cartons de plaquettes de parement, d’angles et de sacs de mortier-colle pour un mur intérieur ou extérieur.',
  intro: 'Indiquez les dimensions du mur à habiller : le calcul déduit les ouvertures et ajoute la chute de coupe.',
  categorie: 'UtilitiesApplication',

  // Mur dessiné de face, ou dimensions saisies.
  plan: { nature: 'mur', saisie: true },

  champs: [
    { id: 'longueur', saisie: true, label: 'Longueur du mur', unite: 'm', requis: true, min: 0.1, defaut: 4 },
    { id: 'hauteur', saisie: true, label: 'Hauteur à habiller', unite: 'm', requis: true, min: 0.1, defaut: 2.5 },
    { id: 'ouvertures', saisie: true, label: 'Surface des ouvertures', unite: 'm²', min: 0, defaut: 0 },
    { id: 'angles', label: 'Longueur d’angles sortants', unite: 'm', min: 0, defaut: 0, aide: 'Angles de mur, tableaux de fenêtre : ils se couvrent avec des plaquettes d’angle vendues au mètre.' },
    { id: 'surfaceCarton', label: 'Surface couverte par un carton de plaquettes', unite: 'm²', requis: true, min: 0.05, defaut: 0.5 },
    { id: 'longueurCartonAngles', label: 'Longueur couverte par un carton d’angles', unite: 'm', min: 0.1, defaut: 1 },
    { id: 'marge', label: 'Chute de coupe', unite: '%', min: 0, max: 30, defaut: 10 },
    { id: 'consommationColle', label: 'Consommation de mortier-colle', unite: 'kg par m²', min: 0, defaut: 5, aide: 'Indiquée sur le sac ; elle dépend du poids des plaquettes.' },
    { id: 'poidsSac', label: 'Poids d’un sac de mortier-colle', unite: 'kg', min: 1, defaut: 25 },
    { id: 'prixCarton', label: 'Prix d’un carton de plaquettes', unite: '€', min: 0 },
    { id: 'prixCartonAngles', label: 'Prix d’un carton d’angles', unite: '€', min: 0 },
    { id: 'prixSac', label: 'Prix d’un sac de mortier-colle', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'cartons', label: 'Cartons de plaquettes', format: 'nombre', principal: true },
    { id: 'cartonsAngles', label: 'Cartons d’angles', format: 'nombre' },
    { id: 'sacs', label: 'Sacs de mortier-colle', format: 'nombre' },
    { id: 'surface', label: 'Surface à habiller', format: 'nombre', unite: 'm²' },
  ],

  calculer(v, plan) {
    // Dessin : face du mur vue de face (longueur et hauteur hors tout, ouvertures dessinées).
    const longueur = plan ? plan.longueur : v.longueur;
    const hauteur = plan ? plan.hauteur : v.hauteur;
    // Les angles couvrent une partie du mur : on la retire des plaquettes planes (environ 10 cm de retour).
    const surface = plan ? plan.surface : Math.max(0, longueur * hauteur - v.ouvertures);
    const surfacePlaquettes = Math.max(0, surface - v.angles * 0.1);
    return {
      surface,
      cartons: Math.ceil((surfacePlaquettes * (1 + v.marge / 100)) / v.surfaceCarton - 1e-9),
      cartonsAngles: v.angles > 0 ? Math.ceil(v.angles / v.longueurCartonAngles - 1e-9) : 0,
      sacs: v.consommationColle > 0 ? Math.ceil((surface * v.consommationColle) / v.poidsSac - 1e-9) : 0,
    };
  },

  devis: [
    { resultat: 'cartons', designation: 'Plaquettes de parement', unite: 'carton', prixChamp: 'prixCarton', detail: '{surface} m², cartons de {surfaceCarton} m², {marge} % de chute' },
    { resultat: 'cartonsAngles', designation: 'Angles de parement', unite: 'carton', prixChamp: 'prixCartonAngles', detail: '{angles} m d’angles sortants' },
    { resultat: 'sacs', designation: 'Mortier-colle pour parement', unite: 'sac', prixChamp: 'prixSac', detail: '{consommationColle} kg par m², sacs de {poidsSac} kg' },
  ],

  explication: `
        <p>Surface à habiller = longueur × hauteur − ouvertures. Les plaquettes d’angle couvrent environ 10 cm de chaque côté de l’angle : cette surface est retirée des plaquettes planes.</p>
        <p>La chute de coupe s’ajoute aux plaquettes planes ; le mortier-colle se calcule sur toute la surface, selon la consommation indiquée sur le sac.</p>
        <p>Le support décide de la colle et du poids admissible : un parement en pierre reconstituée ou naturelle pèse souvent plusieurs dizaines de kilos par m², un parement en plâtre beaucoup moins. Sur plaque de plâtre, vérifiez le poids maximal admis dans les notices du fabricant de plaques et du parement ; sur un mur peint, poncez ou décapez la peinture pour que la colle accroche au support et non à la peinture.</p>
        <p>Avec ou sans joint : un parement à joint creux se pose avec l’écart prévu par le fabricant, puis se jointoie au mortier ; un parement à joint sec se pose bord à bord. La surface couverte par carton, indiquée sur l’emballage, tient en général déjà compte du type de pose.</p>
        <p>Chaque mètre d’angle sortant (angle de mur, tableau de fenêtre, pilier) demande des plaquettes d’angle, vendues à part au mètre linéaire. Mesurez-les à part : elles coûtent plus cher que les plaquettes planes.</p>`,

  erreurs: [
    'Oublier les plaquettes d’angle pour les angles sortants et les tableaux.',
    'Poser un parement lourd sur un support qui ne le supporte pas.',
    'Utiliser une colle non prévue pour l’extérieur.',
    'Coller sur une peinture sans la poncer ni appliquer de primaire : la colle accroche à la peinture, pas au mur.',
  ],

  conseils: [
    'Faites un calepinage à sec pour mélanger les plaquettes.',
    'Commencez par les angles, puis remplissez les parties courantes.',
    'Respectez le temps ouvert de la colle.',
  ],

  normes: [
    {
      titre: 'NF DTU 52.2',
      url: 'https://www.batirama.com/article/11424-nf-dtu-52.2-pose-collee-des-revetements-ceramiques-et-assimiles.html',
      description: 'pose collée des revêtements céramiques et assimilés',
    },
  ],

  lies: ['quantite-peinture', 'enduit-facade', 'carrelage-mural'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Parement intérieur ou extérieur ?',
      reponse: 'Le calcul est le même. En extérieur, choisissez des plaquettes et un mortier-colle adaptés au gel et vérifiez la compatibilité avec le support.',
    },
    {
      question: 'Peut-on poser un parement sur une plaque de plâtre ?',
      reponse: 'Oui, si le poids du parement au m² reste dans la limite admise par la plaque et son ossature, et avec une colle adaptée. Les parements lourds en pierre demandent parfois une plaque spécifique ou un support maçonné : suivez les notices des deux fabricants.',
    },
    {
      question: 'Faut-il des plaquettes d’angle ?',
      reponse: 'Oui pour chaque angle sortant : angles de murs, tableaux de fenêtres, piliers. Sans elles, la tranche des plaquettes planes reste visible et l’angle paraît inachevé.',
    },
    {
      question: 'Quelle colle utiliser ?',
      reponse: 'Un mortier-colle prévu pour le type de parement et pour le support, et adapté à l’extérieur et au gel si besoin. Pour les plaquettes lourdes ou de grand format, un double encollage (colle sur le mur et au dos de la plaquette) améliore l’adhérence.',
    },
  ],

  exemples: [
    {
      entrees: { longueur: 4, hauteur: 2.5, ouvertures: 0, angles: 0, surfaceCarton: 0.5, longueurCartonAngles: 1, marge: 10, consommationColle: 5, poidsSac: 25, prixCarton: 0, prixCartonAngles: 0, prixSac: 0 },
      attendu: { surface: 10, cartons: 22, cartonsAngles: 0, sacs: 2 },
    },
    {
      entrees: { longueur: 5, hauteur: 2.5, ouvertures: 2.5, angles: 5, surfaceCarton: 0.5, longueurCartonAngles: 1, marge: 10, consommationColle: 5, poidsSac: 25, prixCarton: 0, prixCartonAngles: 0, prixSac: 0 },
      attendu: { surface: 10, cartons: 21, cartonsAngles: 5, sacs: 2 },
    },
  ],
};
