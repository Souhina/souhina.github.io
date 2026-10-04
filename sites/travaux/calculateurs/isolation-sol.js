// Calculateur : isolation d'un sol sous chape (panneaux isolants, film et bande périphérique).
export default {
  slug: 'isolation-sol',
  titre: 'Calcul de l’isolation d’un sol',
  rubrique: 'Isolation du sol',
  lot: 'sols',
  ordre: 1,
  teinte: 'isolation',
  description: 'Dessinez la pièce et calculez l’épaisseur et le nombre de panneaux isolants pour un sol sous chape, avec le film et la bande périphérique.',
  intro: 'La surface et le périmètre viennent de la pièce dessinée. Indiquez la résistance thermique visée et les caractéristiques des panneaux.',
  categorie: 'UtilitiesApplication',
  // Aide au choix : questions fermées qui préremplissent les champs de type liste ou case.
  aideAuChoix: {
    questions: [
      { id: 'epaisseur', question: 'L’épaisseur disponible est-elle limitée (seuils, hauteur sous plafond) ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
      { id: 'humidite', question: 'Le sol est-il sur terre-plein ou exposé à l’humidité ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
      { id: 'chauffant', question: 'Un plancher chauffant sera-t-il posé dessus ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
    ],
    regles: [
      { si: { epaisseur: 'oui' }, alors: { isolant: { valeur: 1, raison: 'il isole mieux à épaisseur égale' } } },
      { si: { humidite: 'oui' }, alors: { isolant: { valeur: 2, raison: 'il résiste bien à l’humidité' } } },
      { si: {}, alors: { isolant: { valeur: 0, raison: 'le plus courant et le moins cher' } } },
      { si: { humidite: 'oui' }, alors: { film: { valeur: 1, raison: 'pour protéger l’isolant de l’humidité du support' } } },
      { si: { chauffant: 'oui' }, alors: { bande: { valeur: 1, raison: 'indispensable sous une chape de plancher chauffant' } } },
    ],
  },

  plan: true,
  avertissement: 'ce calculateur estime des quantités. La nature de l’isolant sous chape (résistance à la compression) et l’épaisseur de la chape dépendent de l’usage et du revêtement : suivez l’avis technique du fabricant et le DTU applicable.',

  champs: [
    { id: 'resistance', label: 'Résistance thermique visée (R)', unite: 'm².K/W', requis: true, min: 0.5, max: 10, defaut: 3 },
    {
      id: 'isolant',
      type: 'choix',
      label: 'Type d’isolant',
      defaut: 0,
      aide: 'Reportez ensuite le λ et l’épaisseur du produit choisi ; vérifiez sa classe de compressibilité sous chape.',
      options: [
        { valeur: 0, libelle: 'Polystyrène expansé (PSE)' },
        { valeur: 1, libelle: 'Polyuréthane (PUR ou PIR)' },
        { valeur: 2, libelle: 'Polystyrène extrudé (XPS)' },
      ],
    },
    { id: 'lambda', label: 'Conductivité thermique de l’isolant (λ)', unite: 'W/m.K', requis: true, min: 0.015, max: 0.1, defaut: 0.03, aide: 'Inscrite sur l’emballage des panneaux.' },
    { id: 'epaisseurPanneau', label: 'Épaisseur d’un panneau', unite: 'cm', requis: true, min: 1, defaut: 6 },
    { id: 'surfaceColis', label: 'Surface couverte par un colis', unite: 'm²', requis: true, min: 0.1, defaut: 4 },
    { id: 'marge', label: 'Marge pour les découpes', unite: '%', min: 0, max: 50, defaut: 5 },
    { id: 'film', type: 'case', label: 'Prévoir un film polyéthylène sous l’isolant', defaut: true },
    { id: 'surfaceFilm', label: 'Surface d’un rouleau de film', unite: 'm²', min: 1, defaut: 50 },
    { id: 'bande', type: 'case', label: 'Prévoir une bande périphérique', defaut: true },
    { id: 'longueurBande', label: 'Longueur d’un rouleau de bande', unite: 'm', min: 1, defaut: 25 },
    { id: 'prixColis', label: 'Prix d’un colis de panneaux', unite: '€', min: 0 },
    { id: 'prixFilm', label: 'Prix d’un rouleau de film', unite: '€', min: 0 },
    { id: 'prixBande', label: 'Prix d’un rouleau de bande', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'colis', label: 'Colis de panneaux isolants', format: 'nombre', principal: true },
    { id: 'epaisseurNecessaire', cumul: false, label: 'Épaisseur nécessaire', format: 'nombre', unite: 'cm' },
    { id: 'couches', cumul: false, label: 'Couches de panneaux', format: 'nombre' },
    { id: 'resistanceObtenue', cumul: false, label: 'Résistance obtenue', format: 'nombre', unite: 'm².K/W' },
    { id: 'rouleauxFilm', label: 'Rouleaux de film', format: 'nombre' },
    { id: 'rouleauxBande', label: 'Rouleaux de bande périphérique', format: 'nombre' },
  ],

  calculer(v, plan) {
    const epaisseurNecessaire = v.resistance * v.lambda * 100;
    const couches = Math.ceil(epaisseurNecessaire / v.epaisseurPanneau - 1e-9);
    return {
      epaisseurNecessaire,
      couches,
      colis: Math.ceil((plan.surface * couches * (1 + v.marge / 100)) / v.surfaceColis),
      resistanceObtenue: (couches * v.epaisseurPanneau) / 100 / v.lambda,
      // Film : recouvrement des lés de 20 cm et relevés en pied de mur, environ 20 % de plus.
      rouleauxFilm: v.film ? Math.ceil((plan.surface * 1.2) / v.surfaceFilm) : null,
      rouleauxBande: v.bande ? Math.ceil(plan.perimetre / v.longueurBande) : null,
    };
  },

  devis: [
    { resultat: 'colis', designation: 'Panneaux isolants de sol', unite: 'colis', prixChamp: 'prixColis', detail: '{isolant:libelle}, R = {resistance}, {couches} couche(s) de {epaisseurPanneau} cm' },
    { resultat: 'rouleauxFilm', designation: 'Film polyéthylène', unite: 'rouleau', prixChamp: 'prixFilm', detail: 'Rouleaux de {surfaceFilm} m², recouvrements compris' },
    { resultat: 'rouleauxBande', designation: 'Bande périphérique', unite: 'rouleau', prixChamp: 'prixBande', detail: 'Rouleaux de {longueurBande} m' },
  ],

  explication: `
        <p>Épaisseur nécessaire = R × λ. Le nombre de couches est arrondi au panneau entier supérieur ; deux couches se posent à joints décalés.</p>
        <p>Le film est compté avec environ 20 % de plus pour les recouvrements entre lés et les relevés contre les murs. La bande périphérique fait le tour de la pièce pour désolidariser la chape des murs.</p>`,

  erreurs: [
    'Choisir un isolant trop compressible sous une chape.',
    'Oublier la bande périphérique : la chape transmet alors les bruits et risque de fissurer.',
    'Oublier la hauteur totale du complexe : seuils et portes doivent suivre.',
  ],

  conseils: [
    'Posez les panneaux à joints décalés et bien jointifs.',
    'Posez le film polyéthylène avec des recouvrements.',
    'Vérifiez la classe de compressibilité de l’isolant selon le revêtement prévu.',
  ],

  normes: [
    {
      titre: 'NF DTU 52.10',
      url: 'https://www.batirama.com/article/2281-nf-dtu-52.10-mise-en-uvre-sous-couche-isolante-sous-chape-ou-dalle-flottantes-sous-carrelage.html',
      description: 'sous-couches isolantes sous chape ou dalle flottantes',
    },
    {
      titre: 'NF DTU 26.2',
      url: 'https://www.batirama.com/article/11815-nf-dtu-26.2-chapes-et-dalles-a-base-de-liants-hydrauliques.html',
      description: 'chapes et dalles à base de liants hydrauliques',
    },
  ],

  lies: ['chape-ragreage', 'plancher-chauffant', 'quantite-carrelage'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Pourquoi une bande périphérique ?',
      reponse: 'Elle sépare la chape des murs pour absorber sa dilatation et limiter la transmission des bruits d’impact.',
    },
  ],

  exemples: [
    {
      plan: [[0, 0], [400, 0], [400, 300], [0, 300]],
      entrees: { resistance: 3, lambda: 0.03, epaisseurPanneau: 6, surfaceColis: 4, marge: 5, film: 1, surfaceFilm: 50, bande: 1, longueurBande: 25, prixColis: 0, prixFilm: 0, prixBande: 0 },
      attendu: { epaisseurNecessaire: 9, couches: 2, colis: 7, resistanceObtenue: 4, rouleauxFilm: 1, rouleauxBande: 1 },
    },
  ],
};
