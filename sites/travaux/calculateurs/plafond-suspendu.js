// Calculateur : plafond suspendu en plaques de plâtre sur ossature métallique.
export default {
  slug: 'plafond-suspendu',
  titre: 'Calcul d’un plafond suspendu en plaques de plâtre',
  rubrique: 'Plafond suspendu',
  lot: 'platrerie-isolation',
  ordre: 2,
  teinte: 'platrerie',
  // Aide au choix : questions fermées qui préremplissent les champs de type liste ou case.
  aideAuChoix: {
    questions: [
      { id: 'isolant', question: 'Un isolant sera-t-il posé sur le plafond ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
      { id: 'humide', question: 'La pièce est-elle humide (salle de bains, buanderie) ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
    ],
    regles: [
      { si: { isolant: 'oui' }, alors: { entraxe: { valeur: 40, raison: 'car l’isolant charge le plafond ; vérifiez sur la fiche du système' } } },
      { si: { humide: 'oui' }, alors: { entraxe: { valeur: 40, raison: 'souvent demandé pour les plaques hydrofuges en plafond, à vérifier sur la fiche du système' } } },
      { si: {}, alors: { entraxe: { valeur: 50, raison: 'cas courant ; vérifiez sur la fiche du système' } } },
    ],
  },

  plan: true,
  description: 'Dessinez la pièce et calculez les plaques de plâtre, les fourrures, les suspentes, les cornières de rive et les vis d’un plafond suspendu.',
  intro: 'La surface et le périmètre viennent de la pièce dessinée. Les fourrures sont posées à l’entraxe choisi et tenues par des suspentes.',
  categorie: 'UtilitiesApplication',
  avertissement: 'ce calculateur estime des quantités. L’entraxe des fourrures, l’espacement des suspentes et leur fixation au support dépendent de la plaque, de l’isolant posé dessus et du support : suivez la notice du fabricant et le DTU 25.41.',

  champs: [
    {
      id: 'longueurPlaque',
      type: 'choix',
      label: 'Longueur des plaques (largeur 1,20 m)',
      defaut: 2.5,
      options: [
        { valeur: 2.5, libelle: '2,50 m' },
        { valeur: 2.6, libelle: '2,60 m' },
        { valeur: 3, libelle: '3,00 m' },
      ],
    },
    {
      id: 'entraxe',
      type: 'choix',
      label: 'Entraxe des fourrures',
      defaut: 50,
      options: [
        { valeur: 50, libelle: '50 cm, cas courant' },
        { valeur: 40, libelle: '40 cm, plafond chargé ou plaque plus souple' },
        { valeur: 60, libelle: '60 cm, selon le fabricant' },
      ],
    },
    { id: 'espacementSuspentes', avance: true, label: 'Espacement des suspentes sur une fourrure', unite: 'm', min: 0.3, defaut: 1.2 },
    { id: 'longueurFourrure', avance: true, label: 'Longueur d’une fourrure ou d’une cornière', unite: 'm', min: 1, defaut: 3 },
    { id: 'visParPlaque', avance: true, label: 'Vis par plaque', min: 0, defaut: 40, aide: 'Indicatif : une vis tous les 20 cm environ sur chaque fourrure.' },
    { id: 'marge', label: 'Marge pour les coupes', unite: '%', min: 0, max: 30, defaut: 5 },
    { id: 'prixPlaque', label: 'Prix d’une plaque', unite: '€', min: 0 },
    { id: 'prixFourrure', label: 'Prix d’une fourrure', unite: '€', min: 0 },
    { id: 'prixSuspente', label: 'Prix d’une suspente', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'plaques', label: 'Plaques de plâtre', format: 'nombre', principal: true },
    { id: 'fourrures', label: 'Fourrures', format: 'nombre' },
    { id: 'suspentes', label: 'Suspentes', format: 'nombre' },
    { id: 'cornieres', label: 'Cornières de rive', format: 'nombre' },
    { id: 'vis', label: 'Vis', format: 'nombre' },
    { id: 'surface', label: 'Surface du plafond', format: 'nombre', unite: 'm²' },
  ],

  calculer(v, plan) {
    const surfacePlaque = 1.2 * v.longueurPlaque;
    // Longueur de fourrures : surface ÷ entraxe, plus 10 % pour les recouvrements et les chutes.
    const lineaireFourrures = (plan.surface / (v.entraxe / 100)) * 1.1;
    return {
      surface: plan.surface,
      plaques: Math.ceil((plan.surface * (1 + v.marge / 100)) / surfacePlaque - 1e-9),
      fourrures: Math.ceil(lineaireFourrures / v.longueurFourrure - 1e-9),
      suspentes: Math.ceil(lineaireFourrures / v.espacementSuspentes - 1e-9),
      cornieres: Math.ceil((plan.perimetre * 1.05) / v.longueurFourrure - 1e-9),
      vis: Math.ceil(plan.surface / surfacePlaque - 1e-9) * v.visParPlaque,
    };
  },

  devis: [
    { resultat: 'plaques', designation: 'Plaques de plâtre pour plafond', unite: 'plaque', prixChamp: 'prixPlaque', detail: '{surface} m², plaques de 1,20 × {longueurPlaque} m' },
    { resultat: 'fourrures', designation: 'Fourrures', unite: 'fourrure', prixChamp: 'prixFourrure', detail: 'Entraxe {entraxe} cm' },
    { resultat: 'suspentes', designation: 'Suspentes', unite: 'suspente', prixChamp: 'prixSuspente', detail: 'Une tous les {espacementSuspentes} m' },
    { resultat: 'cornieres', designation: 'Cornières de rive', unite: 'cornière', complement: true },
    { resultat: 'vis', designation: 'Vis pour plaques de plâtre', unite: 'vis', complement: true },
  ],

  explication: `
        <p>Plaques = surface × (1 + marge) ÷ surface d’une plaque (1,20 m × longueur). Les fourrures couvrent la surface à l’entraxe choisi : à 50 cm, il en faut 2 mètres linéaires par m², plus 10 % pour les recouvrements.</p>
        <p>Les suspentes tiennent les fourrures environ tous les 1,20 m ; les cornières de rive font le tour de la pièce pour recevoir les extrémités des fourrures.</p>`,

  erreurs: [
    'Espacer les fourrures plus que ne l’autorise la fiche du système.',
    'Oublier que l’isolant posé sur le plafond ajoute du poids, ce qui réduit l’espacement des suspentes.',
    'Oublier les trappes de visite et les renforts autour des spots.',
  ],

  conseils: [
    'Tracez le niveau du plafond au laser sur tout le pourtour de la pièce.',
    'Posez les plaques perpendiculairement aux fourrures, joints décalés.',
    'Respectez l’écart au feu des spots encastrés.',
  ],

  normes: [
    {
      titre: 'NF DTU 25.41',
      url: 'https://www.batirama.com/article/2262-nf-dtu-25.41-ouvrages-en-plaques-de-platre-plaques-a-faces-cartonnees.html',
      description: 'ouvrages en plaques de plâtre, plafonds compris',
    },
    {
      titre: 'NF DTU 58.1',
      url: 'https://www.batirama.com/article/1964-la-liste-des-dtu-documents-techniques-unifies-a-jour.html',
      description: 'plafonds suspendus',
    },
  ],

  lies: ['plaques-de-platre', 'isolation-soufflee', 'quantite-peinture'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Peut-on poser un isolant sur un plafond suspendu ?',
      reponse: 'Oui, mais son poids doit être pris en compte : l’entraxe des fourrures et le type de suspentes sont alors choisis selon les tableaux du fabricant.',
    },
  ],

  exemples: [
    {
      plan: [[0, 0], [400, 0], [400, 300], [0, 300]],
      entrees: { longueurPlaque: 2.5, entraxe: 50, espacementSuspentes: 1.2, longueurFourrure: 3, visParPlaque: 40, marge: 5, prixPlaque: 0, prixFourrure: 0, prixSuspente: 0 },
      attendu: { surface: 12, plaques: 5, fourrures: 9, suspentes: 22, cornieres: 5, vis: 160 },
    },
  ],
};
