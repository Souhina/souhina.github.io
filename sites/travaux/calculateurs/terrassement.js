// Calculateur : terrassement et déblai, avec foisonnement des terres.
export default {
  slug: 'terrassement-deblai',
  titre: 'Calcul de terrassement et de déblai avec foisonnement',
  rubrique: 'Terrassement',
  lot: 'gros-oeuvre',
  ordre: 0.5,
  teinte: 'grosoeuvre',
  description: 'Calculez le volume de terre à extraire, son volume foisonné une fois sortie du sol, et le nombre de bennes ou de camions pour l’évacuer.',
  intro: 'La terre extraite occupe plus de place qu’en place dans le sol : c’est le foisonnement. Le calcul en tient compte pour l’évacuation.',
  categorie: 'UtilitiesApplication',
  avertissement: 'ce calculateur estime des volumes. Une fouille profonde, près d’un bâtiment ou en terrain instable demande un blindage ou un talutage et l’avis d’un professionnel ; un affouillement de plus de 2 m de profondeur et de plus de 100 m² peut nécessiter une autorisation d’urbanisme.',

  // Dimensions dessinées sur un plan (zone) ou saisies.
  // Aide au choix : questions fermées qui préremplissent les champs de type liste ou case.
  aideAuChoix: {
    questions: [
      { id: 'roche', question: 'Faut-il casser de la roche ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
      { id: 'argile', question: 'La terre colle-t-elle aux bottes et forme-t-elle des mottes compactes ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
      { id: 'sable', question: 'Voit-on surtout du sable ou des cailloux ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
    ],
    regles: [
      { si: { roche: 'oui' }, alors: { sol: { valeur: 1.5, raison: '' } } },
      { si: { argile: 'oui' }, alors: { sol: { valeur: 1.35, raison: 'faites confirmer la nature du sol par le terrassier' } } },
      { si: { sable: 'oui' }, alors: { sol: { valeur: 1.12, raison: '' } } },
      { si: {}, alors: { sol: { valeur: 1.25, raison: 'faites confirmer la nature du sol par le terrassier' } } },
    ],
  },

  plan: { nature: 'zone', saisie: true },

  champs: [
    { id: 'longueur', saisie: true, label: 'Longueur de la fouille', unite: 'm', requis: true, min: 0.1, max: 500, defaut: 10 },
    { id: 'largeur', saisie: true, label: 'Largeur de la fouille', unite: 'm', requis: true, min: 0.1, max: 500, defaut: 8 },
    { id: 'profondeur', label: 'Profondeur moyenne', unite: 'm', requis: true, min: 0.05, max: 20, defaut: 0.4 },
    {
      id: 'sol',
      type: 'choix',
      label: 'Nature du sol',
      defaut: 1.25,
      aide: 'Coefficients de foisonnement d’usage (tables de travaux publics), variables selon l’humidité : à vérifier.',
      options: [
        { valeur: 1.12, libelle: 'Sable, gravier (1,12)' },
        { valeur: 1.25, libelle: 'Terre végétale ou terre ordinaire (1,25)' },
        { valeur: 1.35, libelle: 'Argile (1,35)' },
        { valeur: 1.5, libelle: 'Roche fragmentée (1,50)' },
      ],
    },
    { id: 'coefficient', avance: true, label: 'Coefficient de foisonnement personnalisé', min: 1, max: 2.5, aide: 'Laissez vide pour le coefficient de la nature du sol.' },
    { id: 'capacite', label: 'Contenance d’une benne ou d’un camion', unite: 'm³', requis: true, min: 0.5, max: 40, defaut: 10, aide: 'Mini-benne : 3 à 6 m³ ; camion benne : environ 10 à 15 m³.' },
    { id: 'prixBenne', label: 'Prix d’une benne ou d’une rotation', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'volumeFoisonne', label: 'Volume foisonné à évacuer', format: 'nombre', unite: 'm³', principal: true },
    { id: 'volumeEnPlace', label: 'Volume de terre en place', format: 'nombre', unite: 'm³' },
    { id: 'bennes', label: 'Bennes ou rotations de camion', format: 'nombre' },
    { id: 'coefficientApplique', label: 'Coefficient de foisonnement appliqué', format: 'nombre' },
  ],

  calculer(v, plan) {
    const coefficient = v.coefficient > 0 ? v.coefficient : v.sol;
    const surface = plan ? plan.surface : v.longueur * v.largeur;
    const volumeEnPlace = Math.round(surface * v.profondeur * 1000) / 1000;
    const volumeFoisonne = Math.round(volumeEnPlace * coefficient * 100) / 100;
    return {
      volumeEnPlace,
      coefficientApplique: coefficient,
      volumeFoisonne,
      bennes: Math.ceil(volumeFoisonne / v.capacite - 1e-9),
    };
  },

  devis: [
    { resultat: 'bennes', designation: 'Évacuation des déblais', unite: 'benne', prixChamp: 'prixBenne', detail: '{volumeEnPlace} m³ en place, {volumeFoisonne} m³ foisonnés, bennes de {capacite} m³' },
  ],

  explication: `
        <p>Volume en place = longueur × largeur × profondeur. Volume foisonné = volume en place × coefficient de foisonnement. Une fouille de 10 × 8 m sur 40 cm représente 32 m³ en place ; en terre ordinaire (1,25), il faut en évacuer 40 m³, soit 4 camions de 10 m³.</p>
        <p>Les coefficients sont des valeurs d’usage : ils varient selon l’humidité et la compacité du sol. Demandez celui de votre terrassier, ou saisissez-le dans les réglages avancés.</p>`,

  erreurs: [
    'Oublier le foisonnement : la terre extraite occupe plus de volume que dans le sol, ce qui change le nombre de bennes.',
    'Creuser sans repérer les réseaux enterrés : une déclaration est obligatoire avant des travaux près des réseaux.',
    'Sous-estimer l’évacuation : le prix de mise en décharge dépend de la nature des terres.',
    'Creuser sans blindage ni talutage une fouille profonde ou proche d’un bâtiment.',
  ],

  conseils: [
    'Faites votre déclaration de projet de travaux (DT-DICT) sur le guichet unique avant de creuser.',
    'Gardez la terre végétale à part pour la réutiliser.',
    'Faites confirmer le coefficient de foisonnement par le terrassier selon la nature du sol.',
  ],

  normes: [
    {
      titre: 'Guichet unique des réseaux',
      description: 'déclaration DT-DICT avant des travaux à proximité de réseaux enterrés',
    },
  ],

  lies: ['gravier-remblai', 'calcul-beton', 'drainage-peripherique', 'pavage-allee'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Et pour remblayer avec la terre extraite ?',
      reponse: 'Une fois compactée, la terre retrouve un volume proche de son volume en place, un peu plus grand (foisonnement résiduel). Pour un remblai, partez du volume en place à combler, pas du volume foisonné.',
    },
    {
      question: 'Qu’est-ce que le foisonnement ?',
      reponse: 'Une fois extraite, la terre se décompacte et occupe plus de volume que dans le sol. Le calculateur propose des valeurs d’usage : 1,12 pour un sable ou un gravier, 1,25 pour une terre ordinaire, 1,35 pour une argile et 1,50 pour une roche fragmentée. Votre terrassier peut vous donner la valeur de votre terrain.',
    },
    {
      question: 'Faut-il déclarer des travaux de terrassement ?',
      reponse: 'Avant de creuser près de réseaux enterrés (gaz, électricité, eau, télécoms), une déclaration de projet de travaux et une déclaration d’intention de commencement de travaux (DT-DICT) sont obligatoires, via le guichet unique des réseaux. Un permis ou une déclaration d’urbanisme peut aussi être nécessaire selon le projet.',
    },
  ],

  exemples: [
    {
      entrees: { longueur: 10, largeur: 8, profondeur: 0.4, sol: 1.25, coefficient: 0, capacite: 10, prixBenne: 0 },
      attendu: { volumeEnPlace: 32, volumeFoisonne: 40, bennes: 4, coefficientApplique: 1.25 },
    },
    {
      // Tranchée de 40 × 0,60 m sur 0,80 m en argile (coefficient saisi 1,30) : 19,2 m³ en place, 24,96 m³ foisonnés.
      entrees: { longueur: 40, largeur: 0.6, profondeur: 0.8, sol: 1.35, coefficient: 1.3, capacite: 6, prixBenne: 0 },
      attendu: { volumeEnPlace: 19.2, volumeFoisonne: 24.96, bennes: 5, coefficientApplique: 1.3 },
    },
  ],
};
