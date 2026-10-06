import { SCHEMAS_POSE } from '../partage/poses.js';

// Calculateur : parquet, sous-couche et plinthes.
export default {
  slug: 'quantite-parquet',
  titre: 'Calcul de parquet et de plinthes',
  rubrique: 'Parquet',
  lot: 'sols',
  ordre: 4,
  teinte: 'parquet',
  description: 'Dessinez la pièce et calculez le nombre de paquets de parquet selon le type de pose, la sous-couche et les plinthes.',
  intro: 'La surface et le périmètre viennent de la pièce dessinée. La chute dépend du type de pose.',
  categorie: 'UtilitiesApplication',
  // Aide au choix : questions fermées qui préremplissent les champs de type liste ou case.
  aideAuChoix: {
    questions: [
      { id: 'humide', question: 'La pièce est-elle humide (salle de bains, cuisine, buanderie) ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
      { id: 'chauffant', question: 'Le sol a-t-il un plancher chauffant ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
      { id: 'style', question: 'Quel rendu recherchez-vous ?', options: [{ valeur: 'lames', libelle: 'Des lames classiques' }, { valeur: 'motif', libelle: 'Un motif : bâtons rompus ou point de Hongrie' }, { valeur: 'dalles', libelle: 'Des dalles' }] },
    ],
    regles: [
      { si: { style: 'dalles' }, alors: { revetement: { valeur: 2, raison: '' } } },
      { si: { humide: 'oui' }, alors: { revetement: { valeur: 1, raison: 'car il résiste à l’eau ; certains stratifiés le sont aussi, voyez la notice' } } },
      { si: {}, alors: { revetement: { valeur: 0, raison: '' } } },
      { si: { style: 'motif' }, alors: { typePose: { valeur: 3, raison: 'le point de Hongrie demande des lames coupées en biais, vendues à part' } } },
      { si: {}, alors: { typePose: { valeur: 0, raison: 'la pose qui produit le moins de chutes' } } },
      { si: { chauffant: 'oui' }, alors: { sousCouche: { valeur: 1, raison: 'choisissez-la compatible avec le plancher chauffant' } } },
      { si: {}, alors: { sousCouche: { valeur: 1, raison: 'pour atténuer les bruits ; certaines lames l’intègrent déjà' } } },
    ],
  },

  plan: true,

  champs: [
    {
      id: 'revetement',
      type: 'choix',
      label: 'Revêtement',
      defaut: 0,
      aide: 'Même calcul au m² ; le revêtement est repris dans le récapitulatif.',
      options: [
        { valeur: 0, libelle: 'Parquet ou stratifié' },
        { valeur: 1, libelle: 'Lames vinyle clipsables' },
        { valeur: 2, libelle: 'Dalles vinyle ou dalles de moquette' },
      ],
    },
    {
      id: 'typePose',
      type: 'choix',
      presentation: 'vignettes',
      label: 'Type de pose',
      defaut: 0,
      aide: 'Pose droite : les lames sont calepinées sur la pièce dessinée. Poses en motif : taux forfaitaire, modifiable dans les réglages avancés.',
      options: [
        { valeur: 0, libelle: 'Droite, à coupe perdue', schema: SCHEMAS_POSE.coupePerdue },
        { valeur: 1, libelle: 'Droite, joints réguliers (demi-lame)', schema: SCHEMAS_POSE.jointsReguliers },
        { valeur: 2, libelle: 'En diagonale', schema: SCHEMAS_POSE.diagonale },
        { valeur: 3, libelle: 'Bâtons rompus', schema: SCHEMAS_POSE.batonsRompus },
        { valeur: 4, libelle: 'Point de Hongrie', schema: SCHEMAS_POSE.pointDeHongrie },
      ],
    },
    { id: 'largeurLame', label: 'Largeur d’une lame', unite: 'cm', requis: true, min: 3, max: 60, defaut: 19, aide: 'Indiquée sur le paquet.' },
    { id: 'longueurLame', label: 'Longueur d’une lame', unite: 'cm', requis: true, min: 20, max: 300, defaut: 128 },
    { id: 'tauxChute', avance: true, label: 'Taux de chute personnalisé', unite: '%', min: 0, max: 50, aide: 'Laissez vide pour le taux calculé ou le forfait de la pose.' },
    { id: 'reserve', avance: true, label: 'Réserve pour la casse et les réparations', unite: '%', min: 0, max: 20, defaut: 0 },
    { id: 'surfacePaquet', label: 'Surface d’un paquet', unite: 'm²', requis: true, min: 0.1, defaut: 2, aide: 'Indiquée sur le paquet.' },
    { id: 'sousCouche', type: 'case', label: 'Prévoir une sous-couche', defaut: true },
    { id: 'surfaceSousCouche', label: 'Surface d’un rouleau de sous-couche', unite: 'm²', min: 1, defaut: 15 },
    { id: 'plinthes', type: 'case', label: 'Prévoir des plinthes', defaut: true },
    { id: 'largeurPortes', remplacePar: 'largeurPortes', label: 'Largeur totale des portes', unite: 'm', min: 0, defaut: 0.9, aide: 'Pas de plinthe au droit des portes.' },
    { id: 'longueurPlinthe', label: 'Longueur d’une plinthe', unite: 'm', min: 0.5, defaut: 2.4 },
    { id: 'seuils', remplacePar: 'nombrePortes', label: 'Barres de seuil', min: 0, max: 20, defaut: 1, aide: 'Une par porte donnant sur un autre revêtement.' },
    { id: 'prixPaquet', label: 'Prix d’un paquet', unite: '€', min: 0 },
    { id: 'prixSeuil', label: 'Prix d’une barre de seuil', unite: '€', min: 0 },
    { id: 'prixSousCouche', label: 'Prix d’un rouleau de sous-couche', unite: '€', min: 0 },
    { id: 'prixPlinthe', label: 'Prix d’une plinthe', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'tauxChute', label: 'Taux de chute appliqué', format: 'pourcent' },
    { id: 'sourceChute', label: 'Source du taux', format: 'texte' },
    { id: 'lames', label: 'Lames posées, chutes comprises', format: 'nombre' },
    { id: 'paquets', label: 'Paquets de parquet', format: 'nombre', principal: true },
    { id: 'surfaceAchetee', label: 'Surface achetée', format: 'nombre', unite: 'm²' },
    { id: 'rouleauxSousCouche', label: 'Rouleaux de sous-couche', format: 'nombre' },
    { id: 'plinthesNecessaires', label: 'Plinthes', format: 'nombre' },
    { id: 'barresSeuil', label: 'Barres de seuil', format: 'nombre' },
    { id: 'surface', label: 'Surface de la pièce', format: 'nombre', unite: 'm²' },
  ],

  calculer(v, plan, geo) {
    // Taux forfaitaires des poses en motif (voir partage/poses.js : recommandations des distributeurs).
    const forfaits = {
      2: { taux: 15, source: 'forfait courant des distributeurs pour la diagonale (12 à 15 %), à vérifier' },
      3: { taux: 12, source: 'forfait courant des distributeurs pour les bâtons rompus (10 à 15 %), à vérifier' },
      4: { taux: 15, source: 'forfait courant des distributeurs pour le point de Hongrie (15 %, jusqu’à 17 % pour des angles de 52 à 60°), à vérifier' },
    };
    const surfaceLame = (v.largeurLame * v.longueurLame) / 10000;
    let lames = null;
    let taux;
    let source;

    if (v.tauxChute > 0) {
      taux = v.tauxChute;
      source = 'taux saisi';
    } else if (forfaits[v.typePose]) {
      ({ taux, source } = forfaits[v.typePose]);
    } else {
      // Pose droite : lames dans le sens de la plus grande dimension de la pièce, rangées de la largeur d'une lame.
      const xs0 = plan.points.map((point) => point[0]);
      const ys0 = plan.points.map((point) => point[1]);
      const pivoter = Math.max(...ys0) - Math.min(...ys0) > Math.max(...xs0) - Math.min(...xs0);
      const points = pivoter ? plan.points.map(([x, y]) => [y, x]) : plan.points;

      if (v.typePose === 1) {
        // Joints réguliers : calepinage décalé d'une demi-lame (moteur/geometrie.js).
        const calepinage = geo.calepiner(points, { largeur: v.longueurLame, longueur: v.largeurLame, type: 'decalee', decalage: 0.5 });
        if (!calepinage) return null;
        lames = calepinage.entiers + calepinage.carreauxPourCoupes;
      } else {
        // Coupe perdue : la chute de fin de rangée démarre la rangée suivante si elle mesure au moins 30 cm.
        const xs = points.map((point) => point[0]);
        const ys = points.map((point) => point[1]);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        lames = 0;
        let chute = 0;
        for (let y = Math.min(...ys); y < Math.max(...ys) - 1e-9; y += v.largeurLame) {
          const bande = geo.decouper(points, { x0: minX - 1, y0: y, x1: maxX + 1, y1: y + v.largeurLame });
          if (bande.length < 3 || geo.aire(bande) < 1e-6) continue;
          const xsBande = bande.map((point) => point[0]);
          let reste = Math.max(...xsBande) - Math.min(...xsBande);
          if (chute >= 30) {
            const utilise = Math.min(chute, reste);
            reste -= utilise;
            chute -= utilise;
          }
          const entieres = Math.floor(reste / v.longueurLame + 1e-9);
          lames += entieres;
          reste -= entieres * v.longueurLame;
          chute = 0;
          if (reste > 1e-9) {
            lames += 1;
            chute = v.longueurLame - reste;
          }
        }
      }
      taux = Math.max(0, ((lames * surfaceLame) / plan.surface - 1) * 100);
      source = 'calepinage des lames sur la pièce dessinée';
    }

    const surfaceAPrevoir = plan.surface * (1 + taux / 100) * (1 + v.reserve / 100);
    const paquets = Math.ceil(surfaceAPrevoir / v.surfacePaquet - 1e-9);
    // Plinthes : périmètre moins les portes, plus 10 % pour les coupes d'angle.
    const lineairePlinthes = Math.max(0, plan.perimetre - v.largeurPortes) * 1.1;
    return {
      surface: plan.surface,
      tauxChute: Math.round(taux * 10) / 10,
      sourceChute: source,
      lames,
      paquets,
      surfaceAchetee: paquets * v.surfacePaquet,
      rouleauxSousCouche: v.sousCouche ? Math.ceil((plan.surface * 1.05) / v.surfaceSousCouche) : null,
      plinthesNecessaires: v.plinthes ? Math.ceil(lineairePlinthes / v.longueurPlinthe) : null,
      barresSeuil: Math.round(v.seuils),
    };
  },

  devis: [
    { resultat: 'paquets', achat: 'parquet', designation: 'Parquet', unite: 'paquet', prixChamp: 'prixPaquet', detail: '{revetement:libelle}, pose {typePose:libelle}, {surface} m², {tauxChute} % de chute' },
    { resultat: 'rouleauxSousCouche', designation: 'Sous-couche de parquet', unite: 'rouleau', prixChamp: 'prixSousCouche', detail: 'Rouleaux de {surfaceSousCouche} m²' },
    { resultat: 'plinthesNecessaires', designation: 'Plinthes', unite: 'plinthe', prixChamp: 'prixPlinthe', detail: 'Plinthes de {longueurPlinthe} m' },
    { resultat: 'barresSeuil', designation: 'Barres de seuil', unite: 'barre', prixChamp: 'prixSeuil', complement: true },
  ],

  explication: `
        <p><strong>Chutes selon la pose.</strong> En pose droite, les lames sont posées virtuellement sur la pièce dessinée, dans le sens de sa plus grande dimension, rangée par rangée. À coupe perdue, la chute de fin de rangée démarre la rangée suivante si elle mesure au moins 30 cm : c’est la pose la plus économe. À joints réguliers, chaque rangée commence décalée d’une demi-lame, ce qui laisse davantage de chutes. Pour la diagonale, les bâtons rompus et le point de Hongrie, le calcul applique un forfait courant des distributeurs (12 à 15 %), affiché avec sa source et modifiable dans les réglages avancés : il n’existe pas de valeur normative.</p>
        <p>Paquets = surface × (1 + chute) ÷ surface d’un paquet, arrondi au paquet supérieur. La chute augmente avec les coupes en biais de la pose en diagonale et des motifs.</p>
        <p>Les lames vinyle clipsables et les dalles se calculent de la même façon, au m² ; leur sous-couche est parfois déjà intégrée aux lames : décochez-la alors.</p>
        <p>Les plinthes couvrent le périmètre de la pièce, moins la largeur des portes, avec 10 % de plus pour les coupes d’angle.</p>`,

  erreurs: [
    'Oublier le jeu de dilatation en périphérie et au droit des seuils : le parquet gonfle avec l’humidité et se soulève.',
    'Poser sans acclimatation : les paquets doivent reposer fermés dans la pièce le temps indiqué par le fabricant.',
    'Négliger la sous-couche : elle corrige les petits défauts, atténue les bruits d’impact et, sur un sol minéral, doit comporter un film contre l’humidité.',
    'Oublier les chutes : la dernière lame de chaque rang est recoupée, et les poses à l’anglaise ou en chevrons en consomment davantage.',
    'Poser sur une chape encore humide.',
  ],

  conseils: [
    'Posez les lames dans le sens de la plus grande longueur de la pièce, ou de la lumière principale.',
    'Décalez les joints d’about d’un rang à l’autre ; réutilisez la chute de fin de rang pour démarrer le rang suivant quand sa longueur le permet.',
    'Sur un plancher chauffant, choisissez un parquet et une sous-couche compatibles, et respectez la mise en chauffe progressive.',
    'Vérifiez la planéité et l’humidité du support avant la pose.',
  ],

  normes: [
    {
      titre: 'NF DTU 51.11',
      url: 'https://www.batirama.com/article/2277-nf-dtu-51.11-parquets-flottants.html',
      description: 'pose flottante des parquets contrecollés',
    },
    {
      titre: 'NF DTU 51.2',
      url: 'https://www.batirama.com/article/1964-la-liste-des-dtu-documents-techniques-unifies-a-jour.html',
      description: 'pose des parquets à coller',
    },
    {
      titre: 'NF DTU 51.1',
      url: 'https://www.batirama.com/article/1964-la-liste-des-dtu-documents-techniques-unifies-a-jour.html',
      description: 'pose des parquets à clouer',
    },
  ],

  lies: ['quantite-plinthes', 'chape-ragreage', 'isolation-sol', 'plancher-chauffant'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Faut-il laisser le parquet s’acclimater ?',
      reponse: 'Oui : les fabricants recommandent de stocker les paquets fermés dans la pièce 48 heures environ avant la pose, pour qu’ils prennent la température et l’humidité ambiantes.',
    },
    {
      question: 'Quelle sous-couche choisir ?',
      reponse: 'Sur un sol minéral (chape, carrelage), une sous-couche avec film pare-vapeur protège le parquet de l’humidité. Une sous-couche acoustique atténue les bruits d’impact, souvent exigée en appartement. Sur un plancher chauffant, choisissez une sous-couche compatible, à faible résistance thermique.',
    },
    {
      question: 'Quel jeu de dilatation laisser ?',
      reponse: 'En général 8 à 10 mm le long des murs, autour des tuyaux et au droit des seuils, selon la notice du parquet et la taille de la pièce. Les plinthes ou des barres de seuil masquent ce jeu.',
    },
    {
      question: 'Parquet flottant, collé ou cloué ?',
      reponse: 'Le flottant, posé sur une sous-couche, est le plus simple et le plus courant. Le collé est plus silencieux et convient bien au plancher chauffant. Le cloué, sur lambourdes ou plancher bois, concerne surtout le parquet massif.',
    },
  ],

  exemples: [
    {
      plan: [[0, 0], [400, 0], [400, 300], [0, 300]],
      entrees: { revetement: 0, seuils: 1, prixSeuil: 0, typePose: 2, largeurLame: 19, longueurLame: 128, tauxChute: 0, reserve: 0, surfacePaquet: 2, sousCouche: 1, surfaceSousCouche: 15, plinthes: 1, largeurPortes: 0.9, longueurPlinthe: 2.4, prixPaquet: 0, prixSousCouche: 0, prixPlinthe: 0 },
      attendu: { surface: 12, paquets: 7, surfaceAchetee: 14, rouleauxSousCouche: 1, plinthesNecessaires: 7, barresSeuil: 1 },
    },
    {
      // Deux portes intérieures sur le plan : deux barres de seuil, 1,66 m sans plinthe.
      plan: [[0, 0], [400, 0], [400, 300], [0, 300]],
      ouvertures: [
        { type: 'porte', cote: 0, largeur: 83, hauteur: 204, position: 0 },
        { type: 'porte', cote: 2, largeur: 83, hauteur: 204, position: 200 },
      ],
      entrees: { revetement: 0, seuils: 1, prixSeuil: 0, typePose: 2, largeurLame: 19, longueurLame: 128, tauxChute: 0, reserve: 0, surfacePaquet: 2, sousCouche: 1, surfaceSousCouche: 15, plinthes: 1, largeurPortes: 0.9, longueurPlinthe: 2.4, prixPaquet: 0, prixSousCouche: 0, prixPlinthe: 0 },
      attendu: { barresSeuil: 2, plinthesNecessaires: 6 },
    },
    {
      // Coupe perdue, 4 × 3 m en lames de 19 × 128 cm : 16 rangées, la chute de chaque rangée
      // (au moins 30 cm) démarre la suivante ; cycle de 7 rangées (4 + 6 × 3 lames) → 51 lames, 3,4 % de chute.
      plan: [[0, 0], [400, 0], [400, 300], [0, 300]],
      entrees: { revetement: 0, typePose: 0, largeurLame: 19, longueurLame: 128, tauxChute: 0, reserve: 0, surfacePaquet: 2, sousCouche: 0, surfaceSousCouche: 15, plinthes: 0, largeurPortes: 0.9, longueurPlinthe: 2.4, seuils: 1, prixPaquet: 0, prixSeuil: 0, prixSousCouche: 0, prixPlinthe: 0 },
      attendu: { lames: 51, tauxChute: 3.4, paquets: 7, sourceChute: 'calepinage des lames sur la pièce dessinée' },
    },
    {
      // Joints réguliers : la demi-lame de départ empêche de réutiliser les chutes → 57 lames, 15,5 %.
      plan: [[0, 0], [400, 0], [400, 300], [0, 300]],
      entrees: { revetement: 0, typePose: 1, largeurLame: 19, longueurLame: 128, tauxChute: 0, reserve: 0, surfacePaquet: 2, sousCouche: 0, surfaceSousCouche: 15, plinthes: 0, largeurPortes: 0.9, longueurPlinthe: 2.4, seuils: 1, prixPaquet: 0, prixSeuil: 0, prixSousCouche: 0, prixPlinthe: 0 },
      attendu: { lames: 57, tauxChute: 15.5, paquets: 7 },
    },
    {
      // Point de Hongrie : forfait de 15 % ; 20 m² × 1,15 = 23 m² → 12 paquets de 2 m².
      plan: [[0, 0], [500, 0], [500, 400], [0, 400]],
      entrees: { revetement: 0, typePose: 4, largeurLame: 9, longueurLame: 60, tauxChute: 0, reserve: 0, surfacePaquet: 2, sousCouche: 0, surfaceSousCouche: 15, plinthes: 0, largeurPortes: 0.9, longueurPlinthe: 2.4, seuils: 1, prixPaquet: 0, prixSeuil: 0, prixSousCouche: 0, prixPlinthe: 0 },
      attendu: { lames: null, tauxChute: 15, paquets: 12, sourceChute: 'forfait courant des distributeurs pour le point de Hongrie (15 %, jusqu’à 17 % pour des angles de 52 à 60°), à vérifier' },
    },
    {
      // Taux saisi par l'internaute (18 %) et réserve de 5 % : 20 × 1,18 × 1,05 = 24,78 m² → 13 paquets.
      plan: [[0, 0], [500, 0], [500, 400], [0, 400]],
      entrees: { revetement: 0, typePose: 3, largeurLame: 9, longueurLame: 60, tauxChute: 18, reserve: 5, surfacePaquet: 2, sousCouche: 0, surfaceSousCouche: 15, plinthes: 0, largeurPortes: 0.9, longueurPlinthe: 2.4, seuils: 1, prixPaquet: 0, prixSeuil: 0, prixSousCouche: 0, prixPlinthe: 0 },
      attendu: { tauxChute: 18, paquets: 13, sourceChute: 'taux saisi' },
    },
  ],
};
