// Calculateur : longueur de tube et nombre de boucles d'un plancher chauffant à eau.
export default {
  slug: 'plancher-chauffant',
  titre: 'Calcul d’un plancher chauffant',
  rubrique: 'Plancher chauffant',
  lot: 'sols',
  ordre: 2,
  teinte: 'chauffage',
  description: 'Dessinez la pièce et calculez la longueur de tube, le nombre de boucles et de couronnes pour un plancher chauffant à eau.',
  intro: 'La surface vient de la pièce dessinée. Indiquez le pas de pose et la distance jusqu’au collecteur : le calcul répartit le tube en boucles.',
  categorie: 'UtilitiesApplication',
  // Aide au choix : questions fermées qui préremplissent les champs de type liste ou case.
  aideAuChoix: {
    questions: [
      { id: 'projet', question: 'Quel est votre projet ?', options: [{ valeur: 'neuf', libelle: 'Une construction neuve ou une chape à refaire' }, { valeur: 'renovation', libelle: 'Une rénovation avec peu d’épaisseur disponible' }] },
      { id: 'generateur', question: 'Avez-vous ou prévoyez-vous une pompe à chaleur ou une chaudière ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
      { id: 'role', question: 'Le plancher sera-t-il le chauffage principal ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
      { id: 'salleDeBains', question: 'S’agit-il d’une salle de bains ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
    ],
    regles: [
      { si: { generateur: 'oui' }, alors: { energie: { valeur: 0, raison: 'car il se raccorde à votre générateur' } } },
      { si: { projet: 'renovation' }, alors: { energie: { valeur: 1, raison: 'plus mince, mais plus cher à l’usage' } } },
      { si: { role: 'non' }, alors: { energie: { valeur: 1, raison: 'adapté à un chauffage d’appoint' } } },
      { si: {}, alors: { energie: { valeur: 0, raison: '' } } },
      { si: { salleDeBains: 'oui' }, alors: { pas: { valeur: 10, raison: 'pour une salle de bains ; le pas réel se fixe par l’étude thermique' } } },
      { si: {}, alors: { pas: { valeur: 15, raison: 'cas courant ; le pas réel se fixe par l’étude thermique' } } },
    ],
  },

  plan: true,
  avertissement: 'ce calculateur estime des quantités. Pour un plancher à eau, le pas de pose, la longueur des boucles et la température d’eau se déterminent par une étude thermique (DTU 65.14) ; pour un plancher électrique, la puissance et le raccordement relèvent de la notice du fabricant et de la norme NF C 15-100. Faites valider l’installation par un professionnel.',

  champs: [
    {
      id: 'energie',
      type: 'choix',
      label: 'Type de plancher chauffant',
      defaut: 0,
      options: [
        { valeur: 0, libelle: 'À eau (tube relié à un collecteur)' },
        { valeur: 1, libelle: 'Électrique (trame ou câble chauffant)' },
      ],
    },
    { id: 'zonesNonChauffees', label: 'Surface non chauffée', unite: 'm²', min: 0, defaut: 0, aide: 'Sous les meubles fixes, la cuisine équipée, la baignoire ou le bac de douche.' },
    {
      id: 'pas',
      type: 'choix',
      label: 'Pas de pose',
      defaut: 15,
      options: [
        { valeur: 10, libelle: '10 cm, salle de bain ou forte déperdition' },
        { valeur: 15, libelle: '15 cm, cas courant' },
        { valeur: 20, libelle: '20 cm, faible besoin de chauffage' },
      ],
    },
    { id: 'longueurMaxBoucle', label: 'Longueur maximale d’une boucle', unite: 'm', requis: true, min: 20, defaut: 100, aide: 'Selon le diamètre du tube et le fabricant, souvent entre 80 et 120 m.' },
    { id: 'distanceCollecteur', label: 'Distance entre le collecteur et la pièce', unite: 'm', min: 0, defaut: 5, aide: 'Comptée à l’aller et au retour de chaque boucle.' },
    { id: 'longueurCouronne', label: 'Longueur d’une couronne de tube', unite: 'm', requis: true, min: 10, defaut: 200 },
    {
      id: 'puissanceM2',
      type: 'choix',
      label: 'Puissance de la trame électrique',
      defaut: 100,
      aide: 'Selon le fabricant et l’usage : chauffage principal ou simple confort.',
      options: [
        { valeur: 100, libelle: '100 W/m²' },
        { valeur: 130, libelle: '130 W/m²' },
        { valeur: 160, libelle: '160 W/m²' },
      ],
    },
    { id: 'marge', label: 'Marge', unite: '%', min: 0, max: 30, defaut: 5 },
    { id: 'prixCouronne', label: 'Prix d’une couronne', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'tubeTotal', label: 'Tube nécessaire', format: 'nombre', unite: 'm', principal: true },
    { id: 'boucles', label: 'Boucles, soit départs au collecteur', format: 'nombre' },
    { id: 'couronnes', label: 'Couronnes de tube', format: 'nombre' },
    { id: 'surfaceChauffee', label: 'Surface chauffée', format: 'nombre', unite: 'm²' },
    { id: 'surfaceTrame', label: 'Trame chauffante électrique', format: 'nombre', unite: 'm²' },
    { id: 'puissanceTotale', label: 'Puissance électrique installée', format: 'nombre', unite: 'W' },
    { id: 'thermostats', label: 'Thermostats avec sonde de sol', format: 'nombre' },
  ],

  calculer(v, plan) {
    const surfaceChauffee = Math.max(0, plan.surface - v.zonesNonChauffees);
    // Électrique : la trame couvre la surface chauffée (vendue en kits au m²), un thermostat par pièce.
    if (v.energie === 1) {
      return {
        surfaceChauffee,
        surfaceTrame: Math.ceil(surfaceChauffee * 2 - 1e-9) / 2,
        puissanceTotale: Math.round(surfaceChauffee * v.puissanceM2),
        thermostats: 1,
        tubeTotal: null,
        boucles: null,
        couronnes: null,
      };
    }
    const tubePose = surfaceChauffee / (v.pas / 100);
    const disponibleParBoucle = v.longueurMaxBoucle - 2 * v.distanceCollecteur;
    if (disponibleParBoucle <= 0) return null;
    const boucles = Math.max(1, Math.ceil(tubePose / disponibleParBoucle - 1e-9));
    const tubeTotal = Math.ceil((tubePose + boucles * 2 * v.distanceCollecteur) * (1 + v.marge / 100));
    return {
      surfaceChauffee,
      tubeTotal,
      boucles,
      couronnes: Math.ceil(tubeTotal / v.longueurCouronne),
      surfaceTrame: null,
      puissanceTotale: null,
      thermostats: null,
    };
  },

  devis: [
    { resultat: 'couronnes', designation: 'Tube de plancher chauffant', unite: 'couronne', prixChamp: 'prixCouronne', detail: '{tubeTotal} m au pas de {pas} cm, {boucles} boucle(s)' },
    { resultat: 'surfaceTrame', designation: 'Trame chauffante électrique', unite: 'm²', detail: '{puissanceM2:libelle}, {puissanceTotale} W au total' },
    { resultat: 'thermostats', designation: 'Thermostat avec sonde de sol', unite: 'pièce', complement: true },
  ],

  explication: `
        <p>Longueur de tube posé = surface chauffée ÷ pas de pose. À 15 cm, il faut environ 6,7 m de tube par m².</p>
        <p>Le tube est réparti en boucles qui ne dépassent pas la longueur maximale, liaisons avec le collecteur comprises (aller et retour). Chaque boucle occupe un départ du collecteur.</p>
        <p>L’isolant sous le plancher chauffant se calcule avec le calculateur d’isolation du sol.</p>
        <p>Le pas de pose règle la puissance : plus les tubes sont rapprochés, plus le sol émet de chaleur. On resserre souvent le pas le long des baies vitrées et dans les salles de bains, et on l’élargit dans les pièces bien isolées. La température de surface du sol reste limitée, de l’ordre de 28 °C au plus dans les pièces de vie selon le DTU 65.14 (repère à vérifier) : c’est ce qui rend ce chauffage confortable et doux.</p>
        <p>Le revêtement compte : le carrelage transmet très bien la chaleur ; un parquet, un sol souple ou une moquette doivent être déclarés compatibles par leur fabricant, avec une résistance thermique faible (repère courant : 0,15 m².K/W au plus pour un plancher chauffant, 0,09 pour un plancher rafraîchissant, d’après les guides de fabricants citant le DTU 65.14).</p>
        <p>Après le coulage, la chape sèche avant la première mise en chauffe, puis la température monte progressivement, sur plusieurs jours. Les délais dépendent de la chape (ciment ou anhydrite) : suivez sa fiche technique et le protocole de l’installateur.</p>`,

  erreurs: [
    'Faire passer le tube sous les meubles fixes et les sanitaires.',
    'Dépasser la longueur maximale d’une boucle.',
    'Oublier l’isolant sous le tube et la bande périphérique.',
    'Choisir un revêtement de sol non compatible.',
  ],

  conseils: [
    'Faites dimensionner le pas de pose par une étude thermique.',
    'Faites un essai d’étanchéité avant de couler la chape.',
    'Respectez la mise en chauffe progressive.',
  ],

  normes: [
    {
      titre: 'NF DTU 65.14',
      url: 'https://www.batirama.com/article/24957-nf-dtu-65.14-planchers-a-eau-chauffants-et-chauffants-reversibles.html',
      description: 'planchers chauffants à eau chaude',
    },
    {
      titre: 'NF DTU 52.10',
      url: 'https://www.batirama.com/article/2281-nf-dtu-52.10-mise-en-uvre-sous-couche-isolante-sous-chape-ou-dalle-flottantes-sous-carrelage.html',
      description: 'sous-couches isolantes sous chape',
    },
  ],

  lies: ['isolation-sol', 'chape-ragreage', 'puissance-chauffage', 'quantite-carrelage'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Pourquoi limiter la longueur d’une boucle ?',
      reponse: 'Au-delà d’une certaine longueur, la perte de charge et l’écart de température entre l’entrée et la sortie deviennent trop importants : la pièce chaufferait de façon inégale.',
    },
    {
      question: 'Quel pas de pose choisir ?',
      reponse: '15 cm est le cas courant ; 10 cm dans une salle de bains ou le long de grandes baies vitrées ; 20 cm dans une pièce bien isolée. Le pas exact se fixe par l’étude thermique, pièce par pièce.',
    },
    {
      question: 'Peut-on poser du parquet sur un plancher chauffant ?',
      reponse: 'Oui, si le fabricant du parquet le déclare compatible : en général un parquet contrecollé ou un stratifié, collé ou flottant sur une sous-couche adaptée, avec une résistance thermique faible. Un parquet massif épais freine trop la chaleur.',
    },
    {
      question: 'Quand peut-on allumer le chauffage après la chape ?',
      reponse: 'Après le temps de séchage indiqué sur la fiche de la chape, puis avec une montée en température progressive sur plusieurs jours. Une chauffe trop rapide fait fissurer la chape et décoller le revêtement.',
    },
  ],

  exemples: [
    {
      plan: [[0, 0], [400, 0], [400, 300], [0, 300]],
      entrees: { energie: 0, puissanceM2: 100, zonesNonChauffees: 0, pas: 15, longueurMaxBoucle: 100, distanceCollecteur: 5, longueurCouronne: 200, marge: 5, prixCouronne: 0 },
      attendu: { surfaceChauffee: 12, tubeTotal: 95, boucles: 1, couronnes: 1 },
    },
    {
      plan: [[0, 0], [600, 0], [600, 500], [0, 500]],
      entrees: { energie: 0, puissanceM2: 100, zonesNonChauffees: 2, pas: 10, longueurMaxBoucle: 100, distanceCollecteur: 5, longueurCouronne: 200, marge: 0, prixCouronne: 0 },
      attendu: { surfaceChauffee: 28, tubeTotal: 320, boucles: 4, couronnes: 2 },
    },
    {
      // Électrique : 12 m² dont 1,5 m² non chauffés → 10,5 m² de trame à 130 W/m², 1 365 W.
      plan: [[0, 0], [400, 0], [400, 300], [0, 300]],
      entrees: { energie: 1, puissanceM2: 130, zonesNonChauffees: 1.5, pas: 15, longueurMaxBoucle: 100, distanceCollecteur: 5, longueurCouronne: 200, marge: 5, prixCouronne: 0 },
      attendu: { surfaceChauffee: 10.5, surfaceTrame: 10.5, puissanceTotale: 1365, thermostats: 1, tubeTotal: null },
    },
  ],
};
