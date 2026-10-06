// Calculateur : plinthes (bois, MDF ou carrelage) sur le périmètre de la pièce dessinée.
export default {
  slug: 'quantite-plinthes',
  titre: 'Calcul du nombre de plinthes',
  rubrique: 'Plinthes',
  lot: 'sols',
  ordre: 7,
  teinte: 'plinthes',
  description: 'Dessinez la pièce et calculez le nombre de plinthes en bois, en MDF ou en carrelage, les coupes d’angle et la colle de fixation.',
  intro: 'Le périmètre et le nombre d’angles viennent de la pièce dessinée. Retirez la largeur des portes, où l’on ne pose pas de plinthe.',
  categorie: 'UtilitiesApplication',
  plan: true,

  champs: [
    { id: 'largeurPortes', remplacePar: 'largeurPortes', label: 'Largeur totale des portes', unite: 'm', min: 0, defaut: 0.9 },
    { id: 'longueurPlinthe', label: 'Longueur d’une plinthe', unite: 'm', requis: true, min: 0.1, defaut: 2.4, aide: 'Bois ou MDF : souvent 2,20 à 2,50 m. Plinthe de carrelage : souvent 30 à 60 cm.' },
    { id: 'marge', label: 'Marge pour les coupes', unite: '%', min: 0, max: 30, defaut: 10 },
    { id: 'metresParCartouche', label: 'Mètres collés par cartouche de colle', unite: 'm', min: 0, defaut: 8, aide: 'Indiqué sur la cartouche ; 0 si les plinthes sont clouées ou vissées.' },
    { id: 'prixPlinthe', label: 'Prix d’une plinthe', unite: '€', min: 0 },
    { id: 'prixCartouche', label: 'Prix d’une cartouche de colle', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'plinthes', label: 'Plinthes', format: 'nombre', principal: true },
    { id: 'lineaire', label: 'Longueur à habiller', format: 'nombre', unite: 'm' },
    { id: 'angles', label: 'Angles à couper', format: 'nombre' },
    { id: 'cartouches', label: 'Cartouches de colle', format: 'nombre' },
  ],

  calculer(v, plan) {
    const lineaire = Math.max(0, plan.perimetre - v.largeurPortes);
    return {
      lineaire,
      angles: plan.points.length,
      plinthes: Math.ceil((lineaire * (1 + v.marge / 100)) / v.longueurPlinthe - 1e-9),
      cartouches: v.metresParCartouche > 0 ? Math.ceil(lineaire / v.metresParCartouche - 1e-9) : 0,
    };
  },

  devis: [
    { resultat: 'plinthes', designation: 'Plinthes', unite: 'plinthe', prixChamp: 'prixPlinthe', detail: '{lineaire} m linéaires, plinthes de {longueurPlinthe} m, {angles} angles' },
    { resultat: 'cartouches', designation: 'Colle pour plinthes', unite: 'cartouche', prixChamp: 'prixCartouche' },
  ],

  explication: `
        <p>Longueur à habiller = périmètre de la pièce − largeur des portes. Plinthes = longueur × (1 + marge) ÷ longueur d’une plinthe, arrondi à la plinthe supérieure.</p>
        <p>Chaque angle de la pièce demande une coupe d’onglet : la marge couvre ces coupes et les raccords en milieu de mur.</p>
        <p>Sur un parquet flottant, la plinthe doit couvrir le jeu de dilatation laissé le long des murs (de l’ordre de 8 à 10 mm selon la notice du parquet). Une plinthe de 7 à 10 cm de haut convient à la plupart des pièces ; une plinthe plus haute masque mieux un bas de mur abîmé.</p>
        <p>Fixation : collée au mastic-colle sur un mur plan, clouée ou vissée avec chevilles sur un mur irrégulier, ou clipsée sur des supports pour garder un accès aux câbles. Sur un parquet flottant, la plinthe se fixe toujours au mur, jamais au sol.</p>
        <p>Coupes : un angle sortant se coupe à 45° ; un angle rentrant se coupe à 45° ou, sur un profil mouluré, en contre-profil, qui masque un mur pas tout à fait d’équerre. Une boîte à onglets suffit pour quelques angles ; une scie à onglets fait gagner du temps et de la précision au-delà.</p>`,

  erreurs: [
    'Oublier de déduire la largeur des portes.',
    'Compter au mètre près sans marge : chaque angle consomme de la matière.',
    'Fixer la plinthe au parquet flottant : elle bloque sa dilatation.',
    'Couper toutes les plinthes d’après une seule mesure : chaque mur se mesure séparément, d’angle à angle.',
  ],

  conseils: [
    'Coupez les angles rentrants en contre-profil, ou à 45°, et les angles sortants à 45°.',
    'Choisissez une plinthe assez haute pour couvrir le jeu de dilatation du parquet.',
    'Peignez ou vernissez les plinthes avant la pose et faites les retouches ensuite.',
  ],

  normes: [
    {
      titre: 'NF DTU 51.11',
      url: 'https://www.batirama.com/article/2277-nf-dtu-51.11-parquets-flottants.html',
      description: 'jeu de dilatation périphérique des parquets flottants',
    },
  ],

  lies: ['quantite-parquet', 'quantite-carrelage', 'quantite-peinture'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Quelle marge prévoir ?',
      reponse: '10 % suffisent dans une pièce simple. Dans une pièce avec beaucoup d’angles ou de décrochés, comptez plutôt 15 %.',
    },
    {
      question: 'Quelle hauteur de plinthe choisir ?',
      reponse: 'Assez haute pour couvrir le jeu de dilatation du parquet et les irrégularités du bas de mur : 7 à 10 cm dans la plupart des pièces, davantage pour un style ancien ou des murs abîmés.',
    },
    {
      question: 'Coller ou clouer les plinthes ?',
      reponse: 'Le collage au mastic-colle convient à un mur plan et ne laisse pas de trous. Sur un mur irrégulier ou en plaque de plâtre, clouez ou vissez avec des chevilles adaptées. Les plinthes clipsées se démontent pour passer des câbles.',
    },
    {
      question: 'Et pour des plinthes en carrelage ?',
      reponse: 'Achetez des plinthes assorties au carrelage, ou découpez-les dans des carreaux du sol. Elles se collent au mortier-colle, avec un joint souple au pied si le sol peut bouger.',
    },
  ],

  exemples: [
    {
      plan: [[0, 0], [400, 0], [400, 300], [0, 300]],
      entrees: { largeurPortes: 0.9, longueurPlinthe: 2.4, marge: 10, metresParCartouche: 8, prixPlinthe: 0, prixCartouche: 0 },
      attendu: { lineaire: 13.1, angles: 4, plinthes: 7, cartouches: 2 },
    },
    {
      // Une porte de 83 cm et une porte-fenêtre de 120 cm sur le plan : 2,03 m sans plinthe.
      plan: [[0, 0], [400, 0], [400, 300], [0, 300]],
      ouvertures: [
        { type: 'porte', cote: 0, largeur: 83, hauteur: 204, position: 0 },
        { type: 'porte-fenetre', cote: 2, largeur: 120, hauteur: 215, position: 100 },
        { type: 'fenetre', cote: 1, largeur: 120, hauteur: 135, position: 90 },
      ],
      entrees: { largeurPortes: 0.9, longueurPlinthe: 2.4, marge: 10, metresParCartouche: 8, prixPlinthe: 0, prixCartouche: 0 },
      attendu: { lineaire: 11.97, plinthes: 6, cartouches: 2 },
    },
  ],
};
