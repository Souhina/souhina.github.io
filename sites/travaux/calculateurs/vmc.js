// Calculateur : débits d'extraction de VMC selon l'arrêté du 24 mars 1982 (article 3).
export default {
  slug: 'debit-vmc',
  titre: 'Calcul du débit de VMC par pièce',
  rubrique: 'Débit de VMC',
  lot: 'plomberie',
  ordre: 3,
  teinte: 'plomberie',
  description: 'Calculez les débits d’extraction réglementaires de la cuisine, des salles d’eau et des WC, et le débit total de la VMC, selon l’arrêté du 24 mars 1982.',
  intro: 'Les débits ne dépendent pas de la surface mais du nombre de pièces principales (séjour et chambres) : le calcul reprend le tableau de l’article 3 de l’arrêté du 24 mars 1982.',
  categorie: 'UtilitiesApplication',
  avertissement: 'ce calculateur reprend les débits nominaux de l’arrêté du 24 mars 1982 relatif à l’aération des logements. Le choix et le réglage d’une VMC (simple flux, hygroréglable, double flux) relèvent de son avis technique et d’un installateur, qui mesure les débits à la mise en service.',

  champs: [
    {
      id: 'pieces',
      type: 'choix',
      label: 'Pièces principales (séjour et chambres)',
      defaut: 4,
      aide: 'Un séjour ouvert sur une chambre sans cloison compte pour deux pièces principales.',
      options: [1, 2, 3, 4, 5, 6, 7].map((n) => ({ valeur: n, libelle: n === 7 ? '7 et plus' : String(n) })),
    },
    { id: 'sallesDeBains', label: 'Salles de bains ou de douches', min: 0, max: 10, defaut: 1 },
    { id: 'wcSepares', label: 'WC séparés (pièces WC)', min: 0, max: 10, defaut: 1 },
    { id: 'wcDansSalleDEau', type: 'case', label: 'Un WC se trouve aussi dans une salle de bains', defaut: false, aide: 'Il compte pour savoir si les WC sont « multiples ».' },
  ],

  resultats: [
    { id: 'debitTotal', label: 'Débit total extrait', format: 'nombre', unite: 'm³/h', principal: true },
    { id: 'debitCuisine', label: 'Cuisine', format: 'nombre', unite: 'm³/h' },
    { id: 'debitSallesDEau', label: 'Salles de bains et salles d’eau', format: 'nombre', unite: 'm³/h' },
    { id: 'debitWc', label: 'WC séparés', format: 'nombre', unite: 'm³/h' },
    { id: 'debitReduitMinimal', label: 'Débit total minimal en débit réduit (article 4)', format: 'nombre', unite: 'm³/h' },
  ],

  calculer(v) {
    // Article 3 de l'arrêté du 24 mars 1982 (m³/h), colonnes pour 1, 2, 3, 4, 5 pièces principales et plus.
    const rang = Math.min(v.pieces, 5) - 1;
    const cuisine = [75, 90, 105, 120, 135][rang];
    const salleDeBains = [15, 15, 30, 30, 30][rang];
    const autreSalleDEau = 15;
    const wcUnique = [15, 15, 15, 30, 30][rang];
    const wcMultiple = 15;
    // Article 4 : débit total minimal en débit réduit, de 1 à 7 pièces principales.
    const reduit = [35, 60, 75, 90, 105, 120, 135][Math.min(v.pieces, 7) - 1];

    const sallesDeBains = Math.round(v.sallesDeBains);
    const wcSepares = Math.round(v.wcSepares);
    // WC multiples : au moins deux dans le logement, même si l'un est dans une salle d'eau.
    const multiples = wcSepares + (v.wcDansSalleDEau ? 1 : 0) >= 2;
    const debitSallesDEau = sallesDeBains > 0 ? salleDeBains + (sallesDeBains - 1) * autreSalleDEau : 0;
    const debitWc = wcSepares * (multiples ? wcMultiple : wcUnique);
    return {
      debitCuisine: cuisine,
      debitSallesDEau,
      debitWc,
      debitTotal: cuisine + debitSallesDEau + debitWc,
      debitReduitMinimal: reduit,
    };
  },

  explication: `
        <p>L’arrêté du 24 mars 1982 fixe, pièce de service par pièce de service, le débit d’extraction que la ventilation doit pouvoir atteindre, selon le nombre de pièces principales du logement. Le débit total est la somme : un logement de 4 pièces principales avec une salle de bains et un WC séparé demande 120 + 30 + 30 = 180 m³/h.</p>
        <p>La première salle de bains prend le débit de la colonne « salle de bains », les suivantes celui d’une « autre salle d’eau » (15 m³/h). Les WC sont « multiples » s’il y en a au moins deux dans le logement : chacun est alors à 15 m³/h.</p>`,

  erreurs: [
    'Oublier les entrées d’air dans les pièces de vie : sans elles, la VMC ne renouvelle pas l’air.',
    'Ne pas détalonner les portes intérieures : l’air ne circule plus vers les pièces humides.',
    'Boucher les bouches ou les entrées d’air.',
    'Allonger les gaines et multiplier les coudes : le débit réel baisse.',
  ],

  conseils: [
    'Placez le caisson au plus près du centre du réseau pour raccourcir les gaines.',
    'Isolez les gaines qui traversent des combles non chauffés.',
    'Nettoyez les bouches et les entrées d’air régulièrement.',
  ],

  normes: [
    {
      titre: 'Arrêté du 24 mars 1982 relatif à l’aération des logements, article 3',
      url: 'https://www.legifrance.gouv.fr/loda/article_lc/LEGIARTI000006830557',
      description: 'débits extraits par pièce de service selon le nombre de pièces principales',
    },
    {
      titre: 'NF DTU 68.3',
      url: 'https://www.batirama.com/article/52881-nf-dtu-68.3-installations-de-ventilation-mecanique.html',
      description: 'installations de ventilation mécanique',
    },
  ],

  lies: ['puissance-chauffage', 'reseau-electrique'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Et dans un studio ?',
      reponse: 'Dans un logement d’une seule pièce principale, la salle de bains et le WC, s’ils sont contigus, peuvent partager une sortie d’air commune située dans le WC, avec un débit de 15 m³/h (article 3 de l’arrêté).',
    },
  ],

  exemples: [
    {
      entrees: { pieces: 4, sallesDeBains: 1, wcSepares: 1, wcDansSalleDEau: 0 },
      attendu: { debitCuisine: 120, debitSallesDEau: 30, debitWc: 30, debitTotal: 180, debitReduitMinimal: 90 },
    },
    {
      // 3 pièces principales, une salle de bains et un WC séparé : WC unique à 15 m³/h → 150 m³/h.
      entrees: { pieces: 3, sallesDeBains: 1, wcSepares: 1, wcDansSalleDEau: 0 },
      attendu: { debitTotal: 150, debitWc: 15 },
    },
    {
      // 5 pièces, deux salles de bains (30 + 15), deux WC séparés (multiples, 2 × 15) : 135 + 45 + 30 = 210 m³/h.
      entrees: { pieces: 5, sallesDeBains: 2, wcSepares: 2, wcDansSalleDEau: 0 },
      attendu: { debitSallesDEau: 45, debitWc: 30, debitTotal: 210 },
    },
    {
      // 4 pièces, un WC séparé et un WC dans la salle de bains : WC multiples, le WC séparé passe à 15 m³/h.
      entrees: { pieces: 4, sallesDeBains: 1, wcSepares: 1, wcDansSalleDEau: 1 },
      attendu: { debitWc: 15, debitTotal: 165 },
    },
  ],
};
