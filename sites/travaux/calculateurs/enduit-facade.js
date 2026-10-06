// Calculateur : enduit de façade et crépi, en sacs, selon la surface des murs extérieurs.
export default {
  slug: 'enduit-facade',
  titre: 'Calcul d’enduit de façade et de crépi',
  rubrique: 'Enduit de façade',
  lot: 'facades',
  ordre: 1,
  teinte: 'facade',
  description: 'Calculez la surface de façade, pignons compris, et le nombre de sacs d’enduit ou de crépi selon l’épaisseur appliquée.',
  intro: 'Indiquez le tour de la maison, la hauteur des murs et les pignons : le calcul déduit les ouvertures et convertit l’épaisseur en sacs.',
  categorie: 'UtilitiesApplication',
  avertissement: 'ce calculateur estime des quantités. L’épaisseur, le nombre de couches et la compatibilité avec le support suivent les règles des enduits de façade (DTU 26.1) et la fiche technique du produit ; les conditions de température et d’humidité à la pose sont à respecter.',

  // Façade dessinée de face (pignon et ouvertures compris), ou dimensions saisies.
  // Aide au choix : questions fermées qui préremplissent les champs de type liste ou case.
  aideAuChoix: {
    questions: [
      { id: 'support', question: 'Sur quel support ?', options: [{ valeur: 'neuf', libelle: 'Parpaing ou brique neufs' }, { valeur: 'ancien', libelle: 'Un mur ancien : pierre, terre ou chaux' }, { valeur: 'enduit', libelle: 'Un enduit existant et sain, à rafraîchir' }] },
      { id: 'fissure', question: 'Le support est-il fissuré ou fait de matériaux différents ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
    ],
    regles: [
      { si: { support: 'ancien' }, alors: { typeEnduit: { valeur: 1, raison: 'perméable à la vapeur d’eau, compatible avec les maçonneries anciennes' } } },
      { si: { support: 'enduit' }, alors: { typeEnduit: { valeur: 2, raison: 'pour rafraîchir un enduit sain' } } },
      { si: {}, alors: { typeEnduit: { valeur: 0, raison: 'le plus courant sur parpaing ou brique' } } },
      { si: { fissure: 'oui' }, alors: { treillis: { valeur: 1, raison: 'pour renforcer l’enduit sur un support fissuré ou hétérogène' } } },
    ],
  },

  plan: { nature: 'mur', saisie: true },

  champs: [
    { id: 'perimetre', saisie: true, suggestionChantier: 'longueurFacades', label: 'Longueur totale des façades à enduire', unite: 'm', requis: true, min: 0.1, defaut: 40, aide: 'Le tour de la maison, ou la somme des murs concernés.' },
    { id: 'hauteur', saisie: true, label: 'Hauteur des murs, du sol à l’égout du toit', unite: 'm', requis: true, min: 0.5, defaut: 5.5 },
    { id: 'pignons', saisie: true, label: 'Nombre de pignons', min: 0, defaut: 2, aide: 'Les triangles de mur sous le toit, au-dessus de la hauteur indiquée.' },
    { id: 'largeurPignon', saisie: true, label: 'Largeur d’un pignon', unite: 'm', min: 0, defaut: 8 },
    { id: 'hauteurPignon', saisie: true, label: 'Hauteur d’un pignon', unite: 'm', min: 0, defaut: 3 },
    { id: 'ouvertures', saisie: true, label: 'Surface des portes et fenêtres', unite: 'm²', min: 0, defaut: 30 },
    { id: 'tableaux', suggestionChantier: 'surfaceTableauxExterieurs', label: 'Retours de tableau', unite: 'm²', min: 0, defaut: 0, aide: 'Côtés, dessus et appuis des ouvertures, sur l’épaisseur du mur.' },
    {
      id: 'typeEnduit',
      type: 'choix',
      label: 'Type d’enduit',
      defaut: 0,
      aide: 'Adaptez ensuite l’épaisseur et la consommation à la fiche du produit choisi.',
      options: [
        { valeur: 0, libelle: 'Monocouche, à base de ciment' },
        { valeur: 1, libelle: 'Enduit à la chaux, en plusieurs couches' },
        { valeur: 2, libelle: 'Crépi ou enduit de finition' },
      ],
    },
    { id: 'epaisseur', label: 'Épaisseur appliquée', unite: 'mm', requis: true, min: 1, max: 40, defaut: 15, aide: 'Enduit monocouche : souvent 10 à 20 mm. Crépi ou enduit de finition : quelques millimètres.' },
    { id: 'consommation', label: 'Consommation par millimètre', unite: 'kg par m² et par mm', requis: true, min: 0.5, max: 3, defaut: 1.4, aide: 'Indiquée sur la fiche technique du produit.' },
    { id: 'poidsSac', label: 'Poids d’un sac', unite: 'kg', requis: true, min: 1, defaut: 25 },
    { id: 'marge', label: 'Marge pour les pertes', unite: '%', min: 0, max: 30, defaut: 10 },
    { id: 'treillis', type: 'case', label: 'Prévoir un treillis d’armature', defaut: false, aide: 'Renforce l’enduit sur un support hétérogène ou fissuré et aux angles des ouvertures.' },
    { id: 'surfaceTreillis', avance: true, label: 'Surface d’un rouleau de treillis', unite: 'm²', min: 1, defaut: 50 },
    { id: 'prixSac', label: 'Prix d’un sac', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'sacs', equivalent: { champ: 'poidsSac', unite: 'kg' }, label: 'Sacs d’enduit', format: 'nombre', principal: true },
    { id: 'surface', label: 'Surface à enduire', format: 'nombre', unite: 'm²' },
    { id: 'masse', label: 'Enduit nécessaire, pertes comprises', format: 'nombre', unite: 'kg' },
    { id: 'consommationM2', label: 'Consommation au m²', format: 'nombre', unite: 'kg' },
    { id: 'rouleauxTreillis', label: 'Rouleaux de treillis d’armature', format: 'nombre' },
  ],

  calculer(v, plan) {
    // Dessin : surface de la face, pignon compris et ouvertures déduites ; « Tous les murs » additionne les faces.
    const surfacePignons = (v.pignons * v.largeurPignon * v.hauteurPignon) / 2;
    const surface = plan ? plan.surface + (v.tableaux ?? 0) : Math.max(0, v.perimetre * v.hauteur + surfacePignons - v.ouvertures + (v.tableaux ?? 0));
    const consommationM2 = v.epaisseur * v.consommation;
    const masse = surface * consommationM2 * (1 + v.marge / 100);
    return {
      surface,
      consommationM2,
      masse: Math.round(masse),
      sacs: Math.ceil(masse / v.poidsSac - 1e-9),
      // Treillis : 10 cm de recouvrement entre lés et renforts d'angles, environ 15 % de plus.
      rouleauxTreillis: v.treillis ? Math.ceil((surface * 1.15) / v.surfaceTreillis - 1e-9) : 0,
    };
  },

  devis: [
    { resultat: 'sacs', designation: 'Enduit de façade', unite: 'sac', prixChamp: 'prixSac', detail: '{typeEnduit:libelle}, {surface} m² en {epaisseur} mm, sacs de {poidsSac} kg' },
    { resultat: 'rouleauxTreillis', designation: 'Treillis d’armature d’enduit', unite: 'rouleau', complement: true },
  ],

  explication: `
        <p>Surface = longueur des façades × hauteur, plus les pignons (triangles : largeur × hauteur ÷ 2), moins les ouvertures.</p>
        <p>Consommation au m² = épaisseur en millimètres × consommation par millimètre du produit. Avec 1,4 kg par m² et par mm, une épaisseur de 15 mm demande environ 21 kg par m².</p>
        <p>Pour un enduit en plusieurs couches (gobetis, corps d’enduit, finition), faites un calcul par couche avec l’épaisseur et la consommation de chacune.</p>`,

  erreurs: [
    'Appliquer par temps de gel, de forte chaleur, de vent fort ou de pluie : l’enduit sèche mal et fissure.',
    'Choisir un enduit incompatible avec le support : un mur ancien en pierre ou en terre demande un enduit perméable à la vapeur, souvent à la chaux.',
    'Oublier les baguettes d’angle et les arrêts d’enduit.',
    'Sous-estimer l’épaisseur sur un mur irrégulier.',
  ],

  conseils: [
    'Travaillez par pans entiers, sans arrêt au milieu d’un mur, pour éviter les reprises visibles.',
    'Humidifiez le support s’il est très absorbant, selon la fiche du produit.',
    'Posez une trame d’armature aux points sensibles, comme les angles des ouvertures.',
  ],

  normes: [
    {
      titre: 'NF DTU 26.1',
      url: 'https://www.batirama.com/article/1964-la-liste-des-dtu-documents-techniques-unifies-a-jour.html',
      description: 'travaux d’enduits de mortiers',
    },
  ],

  lies: ['mur-parpaings-briques', 'peinture-facade', 'isolation-exterieur'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Enduit ou crépi ?',
      reponse: 'Le crépi désigne souvent l’aspect de finition projeté, granuleux. Il peut s’agir d’une couche de finition sur un enduit ou d’un enduit monocouche projeté : le calcul se fait de la même façon, avec l’épaisseur et la consommation du produit choisi.',
    },
    {
      question: 'Enduit à la chaux ou au ciment ?',
      reponse: 'Sur un mur ancien en pierre, en brique pleine ou en terre, un enduit à la chaux laisse passer la vapeur d’eau et suit les mouvements du mur. Sur un mur en parpaings ou en briques modernes, un enduit monocouche ou à base de ciment convient.',
    },
    {
      question: 'Combien de couches faut-il ?',
      reponse: 'Un enduit traditionnel en compte trois : le gobetis d’accrochage, le corps d’enduit et la couche de finition. Un enduit monocouche s’applique en une seule couche, souvent en deux passes successives, selon la notice.',
    },
  ],

  exemples: [
    {
      entrees: { perimetre: 40, hauteur: 5.5, pignons: 2, largeurPignon: 8, hauteurPignon: 3, ouvertures: 30, epaisseur: 15, consommation: 1.4, poidsSac: 25, marge: 10, treillis: 1, surfaceTreillis: 50, prixSac: 0 },
      attendu: { surface: 214, consommationM2: 21, masse: 4943, sacs: 198, rouleauxTreillis: 5 },
    },
  ],
};
