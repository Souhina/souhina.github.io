// Calculateur : carrelage mural, calepiné mur par mur sur la pièce dessinée.
export default {
  slug: 'carrelage-mural',
  titre: 'Calcul de carrelage mural et de faïence',
  rubrique: 'Carrelage mural',
  lot: 'murs',
  ordre: 5,
  teinte: 'carrelage',
  // Aide au choix : questions fermées qui préremplissent les champs de type liste ou case.
  aideAuChoix: {
    questions: [
      { id: 'douche', question: 'Le carrelage est-il dans une douche ou autour d’une baignoire ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
      { id: 'support', question: 'Sur quel support ?', options: [{ valeur: 'maconnerie', libelle: 'Enduit de plâtre, béton ou maçonnerie' }, { valeur: 'plaque', libelle: 'Plaque de plâtre' }, { valeur: 'ancien', libelle: 'Un ancien carrelage' }] },
      { id: 'grandFormat', question: 'Les carreaux mesurent-ils 60 cm ou plus de côté ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
    ],
    regles: [
      { si: { douche: 'oui' }, alors: { spec: { valeur: 1, raison: 'pour la zone exposée à l’eau, selon le DTU 52.2' } } },
      { si: { support: 'ancien' }, alors: { colle: { valeur: 2, raison: 'pour coller sur un ancien carrelage, à vérifier sur la fiche de la colle' } } },
      { si: { grandFormat: 'oui' }, alors: { colle: { valeur: 1, raison: 'pour les grands formats, à vérifier sur la fiche de la colle' } } },
      { si: { douche: 'oui' }, alors: { colle: { valeur: 1, raison: 'en zone exposée à l’eau, à vérifier sur la fiche de la colle' } } },
      { si: {}, alors: { colle: { valeur: 0, raison: 'suffisante pour un petit format sur un support sain, à vérifier sur la fiche de la colle' } } },
    ],
  },

  plan: true,
  description: 'Dessinez la pièce et calculez les carreaux de faïence mur par mur, les coupes, les cartons, la colle, le joint et les profilés d’angle.',
  intro: 'Chaque mur de la pièce dessinée est calepiné sur la hauteur à carreler. Retirez les ouvertures et les murs qui ne sont pas carrelés.',
  categorie: 'UtilitiesApplication',

  groupes: {
    'Les murs': 'Les longueurs de murs viennent de la pièce dessinée.',
    'Les carreaux': 'Format et conditionnement inscrits sur le carton.',
  },

  champs: [
    { id: 'hauteur', groupe: 'Les murs', label: 'Hauteur à carreler', unite: 'm', requis: true, min: 0.1, max: 4, defaut: 2, aide: 'Crédence de cuisine : souvent 0,60 m. Douche : jusqu’au plafond.' },
    { id: 'ouvertures', remplacePar: 'surfaceOuvertures', groupe: 'Les murs', label: 'Surface des portes et fenêtres', unite: 'm²', min: 0, defaut: 1.6 },
    { id: 'longueurSansCarrelage', groupe: 'Les murs', label: 'Longueur de murs non carrelés', unite: 'm', min: 0, defaut: 0, aide: 'Par exemple un mur occupé par un meuble ou laissé en peinture.' },
    { id: 'largeurCarreau', groupe: 'Les carreaux', label: 'Largeur d’un carreau', unite: 'cm', requis: true, min: 1, defaut: 30 },
    { id: 'hauteurCarreau', groupe: 'Les carreaux', label: 'Hauteur d’un carreau', unite: 'cm', requis: true, min: 1, defaut: 60 },
    { id: 'joint', groupe: 'Les carreaux', label: 'Largeur des joints', unite: 'mm', min: 0, max: 10, defaut: 2 },
    { id: 'carreauxParCarton', groupe: 'Les carreaux', label: 'Carreaux par carton', requis: true, min: 1, defaut: 8 },
    { id: 'finitionHaut', type: 'case', label: 'Profilé de finition en haut du carrelage', defaut: false, aide: 'Utile quand le carrelage ne monte pas jusqu’au plafond.' },
    {
      id: 'colle',
      type: 'choix',
      label: 'Classe de colle',
      defaut: 1,
      aide: 'Classes de la norme NF EN 12004 ; suivez la fiche de la colle pour le support et le format.',
      options: [
        { valeur: 0, libelle: 'C1 : colle ordinaire' },
        { valeur: 1, libelle: 'C2 : colle améliorée' },
        { valeur: 2, libelle: 'C2 S1 : colle améliorée et déformable' },
      ],
    },
    { id: 'spec', type: 'case', label: 'Prévoir une protection à l’eau sous carrelage (SPEC)', defaut: false, aide: 'Dans la zone de douche ou autour de la baignoire.' },
    { id: 'surfaceSpec', label: 'Surface à protéger', unite: 'm²', min: 0, defaut: 6, aide: 'Murs de la douche ou autour de la baignoire.' },
    { id: 'surfaceKitSpec', label: 'Surface couverte par un kit de protection', unite: 'm²', min: 0.5, defaut: 5, aide: 'Indiquée sur le kit.' },
    { id: 'marge', label: 'Marge pour la casse', unite: '%', min: 0, max: 30, defaut: 10 },
    { id: 'consommationColle', avance: true, label: 'Consommation de colle', unite: 'kg par m²', min: 0, defaut: 4 },
    { id: 'poidsSac', avance: true, label: 'Poids d’un sac de colle', unite: 'kg', min: 1, defaut: 25 },
    { id: 'epaisseurCarreau', avance: true, label: 'Épaisseur des carreaux', unite: 'mm', min: 3, max: 30, defaut: 8 },
    { id: 'poidsSacJoint', avance: true, label: 'Poids d’un sac de joint', unite: 'kg', min: 1, defaut: 5 },
    { id: 'longueurProfile', avance: true, label: 'Longueur d’un profilé', unite: 'm', min: 1, defaut: 2.5 },
    { id: 'prixCarton', label: 'Prix d’un carton', unite: '€', min: 0 },
    { id: 'prixSac', label: 'Prix d’un sac de colle', unite: '€', min: 0 },
    { id: 'prixProfile', label: 'Prix d’un profilé', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'cartons', label: 'Cartons à acheter', format: 'nombre', principal: true },
    { id: 'carreauxAAcheter', label: 'Carreaux, marge comprise', format: 'nombre' },
    { id: 'entiers', label: 'Carreaux posés entiers', format: 'nombre' },
    { id: 'coupes', label: 'Coupes', format: 'nombre' },
    { id: 'surface', label: 'Surface carrelée', format: 'nombre', unite: 'm²' },
    { id: 'sacsColle', equivalent: { champ: 'poidsSac', unite: 'kg' }, label: 'Sacs de colle', format: 'nombre' },
    { id: 'sacsJoint', equivalent: { champ: 'poidsSacJoint', unite: 'kg' }, label: 'Sacs de joint', format: 'nombre' },
    { id: 'anglesSortants', label: 'Angles sortants', format: 'nombre' },
    { id: 'kitsSpec', label: 'Kits de protection à l’eau (SPEC)', format: 'nombre' },
    { id: 'profiles', label: 'Profilés d’angle et de finition', format: 'nombre' },
  ],

  calculer(v, plan, geo) {
    const hauteur = v.hauteur * 100;
    const points = plan.points;
    const n = points.length;

    // Calepinage de chaque mur, comme un rectangle longueur × hauteur à carreler.
    let entiers = 0;
    let coupes = 0;
    let carreauxPourCoupes = 0;
    for (let i = 0; i < n; i++) {
      const [x1, y1] = points[i];
      const [x2, y2] = points[(i + 1) % n];
      const longueur = Math.hypot(x2 - x1, y2 - y1);
      if (longueur < 1) continue;
      const mur = geo.calepiner([[0, 0], [longueur, 0], [longueur, hauteur], [0, hauteur]], {
        largeur: v.largeurCarreau,
        longueur: v.hauteurCarreau,
        joint: v.joint / 10,
      });
      if (!mur) return null;
      entiers += mur.entiers;
      coupes += mur.coupes;
      carreauxPourCoupes += mur.carreauxPourCoupes;
    }

    // Ouvertures et murs non carrelés : retirés en carreaux entiers.
    const aireCarreau = v.largeurCarreau * v.hauteurCarreau;
    const aireRetiree = v.ouvertures * 10000 + v.longueurSansCarrelage * 100 * hauteur;
    const entiersNets = Math.max(0, entiers - Math.floor(aireRetiree / aireCarreau));
    const carreauxAAcheter = Math.ceil((entiersNets + carreauxPourCoupes) * (1 + v.marge / 100) - 1e-9);
    const surface = Math.max(0, plan.perimetre * v.hauteur - v.ouvertures - v.longueurSansCarrelage * v.hauteur);

    // Angles sortants : sommets rentrants du plan (produit vectoriel de signe opposé au sens du tracé).
    let aireSignee = 0;
    for (let i = 0; i < n; i++) aireSignee += points[i][0] * points[(i + 1) % n][1] - points[(i + 1) % n][0] * points[i][1];
    let anglesSortants = 0;
    for (let i = 0; i < n; i++) {
      const [ax, ay] = points[(i - 1 + n) % n];
      const [bx, by] = points[i];
      const [cx, cy] = points[(i + 1) % n];
      const produit = (bx - ax) * (cy - by) - (by - ay) * (cx - bx);
      if (produit * aireSignee < 0) anglesSortants++;
    }

    const lineaireProfiles = anglesSortants * v.hauteur + (v.finitionHaut ? Math.max(0, plan.perimetre - v.longueurSansCarrelage) : 0);
    const longueurMm = v.hauteurCarreau * 10;
    const largeurMm = v.largeurCarreau * 10;
    const jointM2 = ((longueurMm + largeurMm) / (longueurMm * largeurMm)) * v.joint * v.epaisseurCarreau * 1.6;

    return {
      entiers: entiersNets,
      coupes,
      carreauxAAcheter,
      cartons: Math.ceil(carreauxAAcheter / v.carreauxParCarton - 1e-9),
      surface,
      sacsColle: v.consommationColle > 0 ? Math.ceil((surface * v.consommationColle) / v.poidsSac - 1e-9) : 0,
      sacsJoint: v.joint > 0 ? Math.ceil((surface * jointM2 * 1.1) / v.poidsSacJoint - 1e-9) : 0,
      anglesSortants,
      kitsSpec: v.spec ? Math.ceil(v.surfaceSpec / v.surfaceKitSpec - 1e-9) : 0,
      profiles: lineaireProfiles > 0 ? Math.ceil((lineaireProfiles * 1.05) / v.longueurProfile - 1e-9) : 0,
    };
  },

  devis: [
    { resultat: 'cartons', achat: 'carrelage', designation: 'Carrelage mural', unite: 'carton', prixChamp: 'prixCarton', detail: '{surface} m² sur {hauteur} m de haut, carreaux {largeurCarreau} × {hauteurCarreau} cm' },
    { resultat: 'sacsColle', designation: 'Colle pour carrelage mural', unite: 'sac', prixChamp: 'prixSac', complement: true, detail: 'Colle {colle:libelle}' },
    { resultat: 'kitsSpec', designation: 'Protection à l’eau sous carrelage (SPEC)', unite: 'kit', complement: true, detail: '{surfaceSpec} m² à protéger' },
    { resultat: 'sacsJoint', designation: 'Joint de carrelage', unite: 'sac', complement: true, detail: 'Joints de {joint} mm' },
    { resultat: 'profiles', designation: 'Profilés de carrelage', unite: 'profilé', prixChamp: 'prixProfile', complement: true, detail: '{anglesSortants} angle(s) sortant(s)' },
  ],

  explication: `
        <p>Chaque mur de la pièce dessinée est traité comme un rectangle de sa longueur sur la hauteur à carreler : les carreaux y sont posés virtuellement pour compter les entiers et les coupes, joints compris.</p>
        <p>Les ouvertures et les murs non carrelés sont retirés en carreaux entiers. Les angles sortants, par exemple l’angle d’une pièce en L ou un coffrage, reçoivent un profilé sur toute la hauteur ; un profilé de finition peut border le haut du carrelage.</p>`,

  erreurs: [
    'Oublier la protection à l’eau sous la faïence dans les zones de douche : un système d’étanchéité sous carrelage est souvent nécessaire.',
    'Oublier les tableaux, les retours et les profilés d’angle.',
    'Démarrer la pose au ras du sol ou de la baignoire au lieu de régler le premier rang sur une règle de niveau.',
    'Utiliser une colle pour sols sur un mur : elle peut ne pas retenir le poids des carreaux pendant la prise.',
  ],

  conseils: [
    'Fixez une règle de niveau au-dessus du premier rang, posez de la règle vers le plafond, puis posez le rang du bas en dernier.',
    'Centrez le calepinage sur l’élément le plus visible : vasque, fenêtre ou niche.',
    'Faites un joint souple dans les angles rentrants et autour des sanitaires.',
    'Sur plaque de plâtre en pièce humide, utilisez une plaque hydrofuge.',
  ],

  normes: [
    {
      titre: 'NF DTU 52.2',
      url: 'https://www.batirama.com/article/11424-nf-dtu-52.2-pose-collee-des-revetements-ceramiques-et-assimiles.html',
      description: 'pose collée des revêtements céramiques et assimilés, murs intérieurs compris',
    },
  ],

  lies: ['quantite-carrelage', 'plaques-de-platre', 'quantite-peinture'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Faut-il une étanchéité sous la faïence d’une douche ?',
      reponse: 'Dans les zones exposées aux projections d’eau, un système de protection à l’eau sous carrelage (SPEC) est recommandé sous la colle. Il se vend en kit, avec des bandes pour les angles.',
    },
    {
      question: 'Quelle colle pour la faïence ?',
      reponse: 'Un mortier-colle de classe C1 ou C2 selon le support et le format, ou une colle en pâte prête à l’emploi (classe D) pour les petits formats en intérieur sec. Les grands formats et les supports délicats demandent en général une colle C2 et parfois un double encollage : suivez la notice.',
    },
    {
      question: 'Par où commencer la pose ?',
      reponse: 'Fixez une règle de niveau à la hauteur du deuxième rang et commencez au-dessus : le premier rang, souvent coupé, se pose en dernier. Partez d’un axe centré sur le mur pour obtenir des coupes égales de chaque côté.',
    },
    {
      question: 'Peut-on carreler sur un ancien carrelage mural ?',
      reponse: 'Oui si l’ancien carrelage est bien adhérent, plan et sain : dégraissez-le, appliquez un primaire adapté et utilisez une colle prévue pour ce support. Vérifiez que la surépaisseur reste compatible avec les prises, les interrupteurs et les menuiseries.',
    },
  ],

  exemples: [
    {"plan":[[0,0],[300,0],[300,200],[0,200]],"entrees":{"hauteur":1.2,"ouvertures":0,"longueurSansCarrelage":0,"largeurCarreau":30,"hauteurCarreau":60,"joint":0,"carreauxParCarton":8,"finitionHaut":1,"marge":0,"consommationColle":4,"poidsSac":25,"epaisseurCarreau":8,"poidsSacJoint":5,"longueurProfile":2.5,"prixCarton":0,"prixSac":0,"prixProfile":0,"spec":1,"surfaceSpec":6,"surfaceKitSpec":5},"attendu":{"kitsSpec":2}},
    {
      // Pièce de 3 × 2 m sur 1,20 m en 30 × 60 : murs de 3 m sans coupe, murs de 2 m avec une colonne coupée sur 2 rangs.
      plan: [[0, 0], [300, 0], [300, 200], [0, 200]],
      entrees: { hauteur: 1.2, ouvertures: 0, longueurSansCarrelage: 0, largeurCarreau: 30, hauteurCarreau: 60, joint: 0, carreauxParCarton: 8, finitionHaut: 1, marge: 0, consommationColle: 4, poidsSac: 25, epaisseurCarreau: 8, poidsSacJoint: 5, longueurProfile: 2.5, prixCarton: 0, prixSac: 0, prixProfile: 0 },
      attendu: { entiers: 64, coupes: 4, carreauxAAcheter: 68, cartons: 9, surface: 12, sacsColle: 2, anglesSortants: 0, profiles: 5 },
    },
  ],
};
