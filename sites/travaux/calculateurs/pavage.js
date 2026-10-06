// Calculateur : allée ou cour pavée (couche de fondation, lit de pose, pavés, bordures, géotextile).
export default {
  slug: 'pavage-allee',
  titre: 'Calcul de pavés, sable et grave pour une allée',
  rubrique: 'Pavage',
  lot: 'exterieurs',
  ordre: 3,
  teinte: 'exterieur',
  description: 'Calculez le nombre de pavés, la grave de fondation, le sable de pose, le géotextile et les bordures d’une allée ou d’une cour pavée.',
  intro: 'Indiquez la surface à paver, l’usage (piétons ou véhicules) et le format des pavés.',
  categorie: 'UtilitiesApplication',
  avertissement: 'ce calculateur estime des quantités. L’épaisseur de fondation dépend du sol et des charges : pour une zone circulée par des véhicules, suivez les préconisations du fabricant de pavés et, en cas de doute, l’avis d’un professionnel.',

  // Dimensions dessinées sur un plan (zone) ou saisies.
  // Aide au choix : questions fermées qui préremplissent les champs de type liste ou case.
  aideAuChoix: {
    questions: [
      { id: 'vehicules', question: 'Des voitures rouleront-elles ou stationneront-elles sur les pavés ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
      { id: 'sol', question: 'Le sol est-il argileux ou souvent humide ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
    ],
    regles: [
      { si: { vehicules: 'oui' }, alors: { usage: { valeur: 25, raison: 'pour supporter les véhicules ; suivez la notice du fabricant' } } },
      { si: { sol: 'oui' }, alors: { usage: { valeur: 25, raison: 'car un sol argileux demande une fondation plus épaisse, à faire confirmer' } } },
      { si: {}, alors: { usage: { valeur: 15, raison: '' } } },
    ],
  },

  plan: { nature: 'zone', saisie: true },

  champs: [
    { id: 'surface', saisie: true, label: 'Surface à paver', unite: 'm²', requis: true, min: 0.5, max: 5000, defaut: 20 },
    { id: 'longueurBordures', label: 'Longueur de bordures', unite: 'm', min: 0, defaut: 20, aide: 'Le long des côtés non tenus par un mur.' },
    {
      id: 'usage',
      type: 'choix',
      label: 'Usage',
      defaut: 15,
      options: [
        { valeur: 15, libelle: 'Piétons : environ 15 cm de fondation' },
        { valeur: 25, libelle: 'Véhicules légers : environ 25 cm de fondation' },
      ],
    },
    { id: 'pavesM2', label: 'Pavés au m²', requis: true, min: 1, defaut: 50, aide: 'Indiqué par le fabricant ; environ 50 pour un pavé de 20 × 10 cm.' },
    { id: 'litPose', avance: true, label: 'Épaisseur du lit de sable', unite: 'cm', min: 1, max: 10, defaut: 4 },
    { id: 'longueurBordure', avance: true, label: 'Longueur d’une bordure', unite: 'm', min: 0.25, defaut: 1 },
    { id: 'surfaceGeotextile', avance: true, label: 'Surface d’un rouleau de géotextile', unite: 'm²', min: 1, defaut: 50 },
    { id: 'marge', label: 'Marge pour les coupes', unite: '%', min: 0, max: 30, defaut: 5 },
    { id: 'prixPave', label: 'Prix d’un pavé', unite: '€', min: 0 },
    { id: 'prixTonneGrave', label: 'Prix d’une tonne de grave', unite: '€', min: 0 },
    { id: 'prixTonneSable', label: 'Prix d’une tonne de sable', unite: '€', min: 0 },
    { id: 'prixBordure', label: 'Prix d’une bordure', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'paves', label: 'Pavés', format: 'nombre', principal: true },
    { id: 'grave', label: 'Grave de fondation 0/31,5', format: 'nombre', unite: 't' },
    { id: 'sable', label: 'Sable de pose 0/4', format: 'nombre', unite: 't' },
    { id: 'bordures', label: 'Bordures', format: 'nombre' },
    { id: 'rouleauxGeotextile', label: 'Rouleaux de géotextile', format: 'nombre' },
  ],

  calculer(v, plan) {
    // Dessin : surface de la zone, éléments déduits ; saisie : surface indiquée.
    const surface = plan ? plan.surface : v.surface;
    // Masses volumiques indicatives en place : grave compactée 2 t/m³, sable 1,6 t/m³.
    return {
      paves: Math.ceil(surface * v.pavesM2 * (1 + v.marge / 100) - 1e-9),
      grave: Math.round(surface * (v.usage / 100) * 2 * 100) / 100,
      sable: Math.round(surface * (v.litPose / 100) * 1.6 * 100) / 100,
      bordures: v.longueurBordures > 0 ? Math.ceil(v.longueurBordures / v.longueurBordure - 1e-9) : 0,
      rouleauxGeotextile: Math.ceil((surface * 1.1) / v.surfaceGeotextile - 1e-9),
    };
  },

  devis: [
    { resultat: 'paves', designation: 'Pavés', unite: 'pavé', prixChamp: 'prixPave', detail: '{surface} m² à {pavesM2} pavés au m²' },
    { resultat: 'grave', designation: 'Grave de fondation', unite: 't', prixChamp: 'prixTonneGrave', detail: '{usage} cm compactés' },
    { resultat: 'sable', designation: 'Sable de pose', unite: 't', prixChamp: 'prixTonneSable', detail: 'Lit de {litPose} cm' },
    { resultat: 'bordures', designation: 'Bordures', unite: 'bordure', prixChamp: 'prixBordure', detail: '{longueurBordures} m' },
    { resultat: 'rouleauxGeotextile', designation: 'Géotextile', unite: 'rouleau', complement: true },
  ],

  explication: `
        <p>Un pavage se compose, de bas en haut : un géotextile sur le sol décaissé, une couche de fondation en grave compactée, un lit de sable de 3 à 5 cm, puis les pavés, calés par des bordures et jointoyés au sable.</p>
        <p>Grave (t) = surface × épaisseur × 2 ; sable (t) = surface × épaisseur du lit × 1,6. Pour 20 m² en usage piéton : 6 t de grave et 1,3 t de sable.</p>`,

  erreurs: [
    'Sous-dimensionner la fondation : une allée carrossable demande une grave bien plus épaisse qu’une allée piétonne.',
    'Oublier la pente d’écoulement : l’eau stagne et le sol se dégrade.',
    'Poser sans bordures : les pavés se déplacent sur les côtés.',
    'Compacter le lit de sable avant la pose, ou le piétiner.',
  ],

  conseils: [
    'Décaissez, posez un géotextile, puis compactez la grave par couches.',
    'Tirez le lit de sable à la règle sur des guides.',
    'Compactez les pavés à la plaque vibrante munie d’une semelle de protection, puis balayez le sable dans les joints.',
    'Mélangez les pavés de plusieurs palettes pour répartir les nuances.',
  ],

  normes: [
    {
      titre: 'Notice du fabricant de pavés',
      description: 'épaisseurs de fondation et de lit de pose selon l’usage (piéton ou véhicules)',
    },
  ],

  lies: ['terrassement-deblai', 'gravier-remblai', 'terrasse-lames', 'conversion-pente'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Quelle profondeur décaisser ?',
      reponse: 'L’épaisseur de fondation, plus le lit de sable, plus l’épaisseur des pavés : environ 25 cm pour une allée piétonne, 35 cm pour une zone circulée.',
    },
    {
      question: 'Quelle pente donner à une allée pavée ?',
      reponse: 'Une légère pente vers l’extérieur, de l’ordre de 1,5 à 2 %, soit 1,5 à 2 cm par mètre, pour que l’eau ne stagne pas et ne s’écoule pas vers la maison.',
    },
    {
      question: 'Avec quoi remplir les joints ?',
      reponse: 'Du sable fin balayé dans les joints, puis compacté, ou un sable polymère qui durcit à l’humidité et limite les herbes. Les joints au mortier conviennent aux pavés posés sur une dalle béton, pas à une pose sur lit de sable.',
    },
  ],

  exemples: [
    {
      entrees: { surface: 20, longueurBordures: 20, usage: 15, pavesM2: 50, litPose: 4, longueurBordure: 1, surfaceGeotextile: 50, marge: 5, prixPave: 0, prixTonneGrave: 0, prixTonneSable: 0, prixBordure: 0 },
      attendu: { paves: 1050, grave: 6, sable: 1.28, bordures: 20, rouleauxGeotextile: 1 },
    },
  ],
};
