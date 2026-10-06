// Calculateur : isolation soufflée des combles perdus (laine de verre, de roche ou ouate de cellulose).
export default {
  slug: 'isolation-soufflee',
  titre: 'Calcul d’isolation soufflée des combles',
  rubrique: 'Isolation soufflée',
  lot: 'platrerie-isolation',
  ordre: 5,
  teinte: 'isolation',
  description: 'Calculez l’épaisseur d’isolant soufflé, le poids et le nombre de sacs de laine ou d’ouate pour isoler des combles perdus à la résistance visée.',
  intro: 'Indiquez la surface des combles et la résistance thermique visée. Le fabricant donne, pour chaque résistance, l’épaisseur et le poids au m² à souffler : ses tableaux font foi.',
  categorie: 'UtilitiesApplication',
  avertissement: 'ce calculateur estime des quantités. Respectez les écarts au feu autour des conduits de fumée et des spots, protégez les boîtiers électriques et la trappe d’accès, et suivez les tableaux du fabricant, qui tiennent compte du tassement.',

  // Dimensions dessinées sur un plan (piece) ou saisies.
  // Aide au choix : questions fermées qui préremplissent les champs de type liste ou case.
  aideAuChoix: {
    questions: [
      { id: 'feu', question: 'Les combles comptent-ils des points chauds (conduit de fumée, spots encastrés) ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
      { id: 'humidite', question: 'Les combles risquent-ils de prendre l’humidité (toiture ancienne, traces de fuite) ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
      { id: 'ete', question: 'Le confort d’été, la chaleur sous le toit, est-il prioritaire ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
    ],
    regles: [
      { si: { feu: 'oui' }, alors: { produit: { valeur: 1, raison: 'car elle est incombustible ; les écarts au feu restent obligatoires' } } },
      { si: { humidite: 'oui' }, alors: { produit: { valeur: 0, raison: 'les laines minérales craignent moins l’humidité que la ouate ; réparez d’abord la toiture' } } },
      { si: { ete: 'oui' }, alors: { produit: { valeur: 2, raison: 'plus dense, elle ralentit davantage la chaleur en été' } } },
      { si: {}, alors: { produit: { valeur: 0, raison: 'la plus courante et la moins chère' } } },
    ],
  },

  plan: { nature: 'piece', saisie: true },

  champs: [
    { id: 'surface', saisie: true, label: 'Surface des combles', unite: 'm²', requis: true, min: 1, max: 2000, defaut: 50 },
    { id: 'resistance', label: 'Résistance thermique visée (R)', unite: 'm².K/W', requis: true, min: 1, max: 12, defaut: 7 },
    {
      id: 'produit',
      type: 'choix',
      label: 'Isolant',
      defaut: 0,
      aide: 'Valeurs courantes de conductivité et de masse volumique en place ; corrigez-les avec la fiche du produit dans les réglages avancés.',
      options: [
        { valeur: 0, libelle: 'Laine de verre soufflée' },
        { valeur: 1, libelle: 'Laine de roche soufflée' },
        { valeur: 2, libelle: 'Ouate de cellulose' },
      ],
    },
    { id: 'lambda', avance: true, label: 'Conductivité thermique (λ), si différente', unite: 'W/m.K', min: 0, max: 0.1, defaut: 0, aide: '0 : valeur courante du produit choisi.' },
    { id: 'masseVolumique', avance: true, label: 'Masse volumique en place, si différente', unite: 'kg/m³', min: 0, max: 80, defaut: 0, aide: '0 : valeur courante du produit choisi.' },
    { id: 'poidsSac', avance: true, label: 'Poids d’un sac', unite: 'kg', min: 1, defaut: 15 },
    { id: 'prixSac', label: 'Prix d’un sac', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'sacs', equivalent: { champ: 'poidsSac', unite: 'kg' }, label: 'Sacs d’isolant', format: 'nombre', principal: true },
    { id: 'epaisseur', label: 'Épaisseur à souffler', format: 'nombre', unite: 'cm' },
    { id: 'masse', label: 'Isolant nécessaire', format: 'nombre', unite: 'kg' },
    { id: 'masseM2', label: 'Poids au m²', format: 'nombre', unite: 'kg' },
  ],

  calculer(v, plan) {
    // Valeurs courantes indicatives : λ (W/m.K), masse volumique en place (kg/m³), tassement prévu.
    const produits = [
      { lambda: 0.045, densite: 12, tassement: 0.05 },
      { lambda: 0.046, densite: 30, tassement: 0.05 },
      { lambda: 0.04, densite: 35, tassement: 0.2 },
    ];
    const produit = produits[v.produit] ?? produits[0];
    const lambda = v.lambda > 0 ? v.lambda : produit.lambda;
    const densite = v.masseVolumique > 0 ? v.masseVolumique : produit.densite;
    // L'épaisseur soufflée est augmentée du tassement prévu, pour garder la résistance dans le temps.
    const epaisseur = v.resistance * lambda * (1 + produit.tassement) * 100;
    const masseM2 = (epaisseur / 100) * densite;
    const surface = plan ? plan.surface : v.surface;
    const masse = masseM2 * surface;
    return {
      epaisseur: Math.round(epaisseur * 10) / 10,
      masseM2: Math.round(masseM2 * 100) / 100,
      masse: Math.round(masse),
      sacs: Math.ceil(masse / v.poidsSac - 1e-9),
    };
  },

  devis: [
    { resultat: 'sacs', designation: 'Isolant soufflé', unite: 'sac', prixChamp: 'prixSac', detail: '{surface} m² à R = {resistance}, {epaisseur} cm soufflés' },
  ],

  explication: `
        <p>Épaisseur = R × λ, augmentée du tassement prévu : environ 5 % pour les laines minérales, jusqu’à 20 % pour l’ouate de cellulose. Poids = épaisseur × masse volumique en place × surface.</p>
        <p>Pour 50 m² de laine de verre soufflée à R = 7, il faut environ 33 cm d’isolant et 200 kg, soit 14 sacs de 15 kg. Les tableaux du fabricant donnent les valeurs exactes pour son produit.</p>`,

  erreurs: [
    'Oublier le tassement : l’épaisseur à souffler dépend de l’isolant et de son tassement, indiqués par le fabricant.',
    'Recouvrir les spots, les boîtiers électriques ou les conduits de fumée sans protection.',
    'Oublier les piges de repérage de l’épaisseur.',
    'Souffler sur un plancher qui ne supporte pas le poids, ou sans traiter les fuites d’air.',
  ],

  conseils: [
    'Calculez le nombre de sacs à partir du pouvoir couvrant indiqué sur le sac pour la résistance visée.',
    'Installez une rehausse autour de la trappe d’accès.',
    'Faites appel à un professionnel RGE si vous visez une aide.',
  ],

  normes: [
    {
      titre: 'NF DTU 45.11',
      url: 'https://snisolation.fr/parution-dtu-souflage/',
      description: 'isolation thermique de combles par soufflage d’isolant en vrac',
    },
  ],

  lies: ['quantite-laine-de-verre', 'quantite-laine-de-roche', 'plafond-suspendu'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Faut-il des repères d’épaisseur ?',
      reponse: 'Oui : des piges graduées, réparties dans les combles, permettent de vérifier la hauteur soufflée. Le fabricant et les aides à la rénovation les demandent souvent.',
    },
    {
      question: 'Laine de verre, laine de roche ou ouate de cellulose ?',
      reponse: 'Les laines minérales sont légères et tassent peu ; l’ouate de cellulose, plus dense, tasse davantage mais ralentit mieux la chaleur en été. Le choix se fait sur la résistance visée, le confort d’été et le prix au m² pour un même R.',
    },
    {
      question: 'Peut-on souffler l’isolant soi-même ?',
      reponse: 'Oui : des souffleuses se louent et les sacs se vendent en magasin. En revanche, les aides à la rénovation demandent en général une pose par une entreprise qualifiée RGE.',
    },
    {
      question: 'Quelle épaisseur souffler pour R = 7 ?',
      reponse: 'Elle dépend du lambda et du tassement de l’isolant : environ 33 cm de laine de verre soufflée dans l’exemple du calculateur, davantage pour un isolant plus tassant. Le tableau du fabricant donne l’épaisseur à souffler pour chaque R.',
    },
  ],

  exemples: [
    {
      entrees: { surface: 50, resistance: 7, produit: 0, lambda: 0, masseVolumique: 0, poidsSac: 15, prixSac: 0 },
      attendu: { epaisseur: 33.1, masseM2: 3.97, masse: 198, sacs: 14 },
    },
    {
      entrees: { surface: 50, resistance: 7, produit: 2, lambda: 0, masseVolumique: 0, poidsSac: 12.5, prixSac: 0 },
      attendu: { epaisseur: 33.6, masseM2: 11.76, masse: 588, sacs: 48 },
    },
  ],
};
