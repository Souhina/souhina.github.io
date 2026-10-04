// Calculateur : lino et sol vinyle en rouleau, découpé en lés selon la forme réelle de la pièce.
export default {
  slug: 'quantite-lino',
  titre: 'Calcul de lino et de sol vinyle en rouleau',
  rubrique: 'Lino et sol vinyle',
  lot: 'sols',
  ordre: 6,
  teinte: 'lino',
  description: 'Dessinez la pièce et calculez la longueur de lino ou de sol vinyle en rouleau à acheter, le nombre de lés et la chute.',
  intro: 'Le calcul découpe la pièce dessinée en lés de la largeur du rouleau, dans le sens qui demande le moins de métrage.',
  categorie: 'UtilitiesApplication',
  // Aide au choix : questions fermées qui préremplissent les champs de type liste ou case.
  aideAuChoix: {
    questions: [
      { id: 'passage', question: 'La pièce est-elle très fréquentée (entrée, couloir, local professionnel) ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
      { id: 'grande', question: 'La pièce fait-elle plus de 20 m² ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
      { id: 'retirer', question: 'Voulez-vous pouvoir retirer le sol facilement (location) ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
    ],
    regles: [
      { si: { retirer: 'oui', grande: 'non', passage: 'non' }, alors: { fixation: { valeur: 0, raison: 'facile à retirer dans une petite pièce peu fréquentée' } } },
      { si: { passage: 'oui' }, alors: { fixation: { valeur: 1, raison: 'car le sol doit tenir dans une pièce très fréquentée' } } },
      { si: { grande: 'oui' }, alors: { fixation: { valeur: 1, raison: 'car une grande surface non collée risque de gondoler ; voyez la notice' } } },
      { si: { retirer: 'oui' }, alors: { fixation: { valeur: 2, raison: 'se retire plus facilement qu’un sol collé' } } },
      { si: {}, alors: { fixation: { valeur: 2, raison: '' } } },
    ],
  },

  plan: true,

  champs: [
    {
      id: 'largeurRouleau',
      type: 'choix',
      label: 'Largeur du rouleau',
      defaut: 4,
      options: [
        { valeur: 4, libelle: '4 m, largeur la plus courante' },
        { valeur: 3, libelle: '3 m' },
        { valeur: 2, libelle: '2 m' },
      ],
    },
    {
      id: 'typeRaccord',
      type: 'choix',
      label: 'Type de raccord',
      defaut: 0,
      aide: 'Indiqué sur l’étiquette. Droit : le motif se prolonge à la même hauteur. Sauté : il est décalé d’un lé à l’autre.',
      options: [
        { valeur: 0, libelle: 'Libre (uni, sans motif)' },
        { valeur: 1, libelle: 'Droit' },
        { valeur: 2, libelle: 'Sauté (décalé)' },
      ],
    },
    { id: 'raccord', label: 'Hauteur du raccord', unite: 'cm', min: 0, max: 200, defaut: 0, aide: 'Hauteur de répétition du motif, indiquée par le fabricant.' },
    {
      id: 'fixation',
      type: 'choix',
      label: 'Fixation',
      defaut: 1,
      options: [
        { valeur: 0, libelle: 'Pose libre ou tendue, sans colle' },
        { valeur: 1, libelle: 'Collée en plein' },
        { valeur: 2, libelle: 'Adhésif double face en périphérie et aux raccords' },
      ],
    },
    { id: 'colleM2', avance: true, label: 'Colle par m²', unite: 'kg', min: 0, defaut: 0.35, aide: 'Indiquée sur le seau selon le revêtement et la spatule.' },
    { id: 'poidsSeau', avance: true, label: 'Poids d’un seau de colle', unite: 'kg', min: 1, defaut: 15 },
    { id: 'longueurAdhesif', avance: true, label: 'Longueur d’un rouleau d’adhésif double face', unite: 'm', min: 1, defaut: 25 },
    { id: 'prixM2', label: 'Prix au m²', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'metresLineaires', label: 'Longueur de rouleau à acheter', format: 'nombre', unite: 'm', principal: true },
    { id: 'les', label: 'Nombre de lés', format: 'nombre' },
    { id: 'surfaceAchetee', label: 'Surface achetée', format: 'nombre', unite: 'm²' },
    { id: 'surplusRaccord', label: 'Dont longueur due au raccord', format: 'nombre', unite: 'm' },
    { id: 'chute', label: 'Chute', format: 'pourcent' },
    { id: 'seauxColle', label: 'Seaux de colle', format: 'nombre' },
    { id: 'rouleauxAdhesif', label: 'Rouleaux d’adhésif double face', format: 'nombre' },
    { id: 'surface', label: 'Surface de la pièce', format: 'nombre', unite: 'm²' },
  ],

  // Les lés sont posés en bandes parallèles. Pour chaque bande, geo.decouper donne la partie
  // de la pièce qu'elle couvre : sa longueur, plus 10 cm d'arasement et le raccord de motif.
  calculer(v, plan, geo) {
    if (v.typeRaccord > 0 && !(v.raccord > 0)) {
      return { erreur: 'Revêtement à motif : indiquez la hauteur du raccord, donnée par le fabricant.' };
    }
    const largeur = v.largeurRouleau * 100;
    const raccord = v.typeRaccord > 0 ? v.raccord : 0;

    // Longueur de chaque lé mesurée sur la forme dessinée, plus 10 cm d'arasement.
    function metrage(points) {
      const xs = points.map((point) => point[0]);
      const ys = points.map((point) => point[1]);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      let total = 0;
      let les = 0;
      for (let y = Math.min(...ys); y < Math.max(...ys) - 1e-9; y += largeur) {
        const bande = geo.decouper(points, { x0: minX - 1, y0: y, x1: maxX + 1, y1: y + largeur });
        if (bande.length < 3 || geo.aire(bande) < 1e-6) continue;
        const xsBande = bande.map((point) => point[0]);
        total += Math.max(...xsBande) - Math.min(...xsBande) + 10;
        les++;
      }
      // Le raccord ne compte que s'il y a plusieurs lés à aligner : un raccord complet par lé, par prudence.
      const supplement = les > 1 ? les * raccord : 0;
      return { total: total + supplement, sansRaccord: total, les };
    }

    const sensLongueur = metrage(plan.points);
    const sensLargeur = metrage(plan.points.map(([x, y]) => [y, x]));
    const meilleur = sensLongueur.total <= sensLargeur.total ? sensLongueur : sensLargeur;
    const arrondir = (centimetres) => Math.ceil(centimetres / 10 - 1e-9) / 10; // aux 10 cm, comme à la coupe
    const metresLineaires = arrondir(meilleur.total);
    const surfaceAchetee = metresLineaires * v.largeurRouleau;
    return {
      surface: plan.surface,
      metresLineaires,
      les: meilleur.les,
      surplusRaccord: Math.round((metresLineaires - arrondir(meilleur.sansRaccord)) * 100) / 100,
      surfaceAchetee,
      chute: surfaceAchetee > 0 ? ((surfaceAchetee - plan.surface) / surfaceAchetee) * 100 : null,
      seauxColle: v.fixation === 1 ? Math.ceil((plan.surface * v.colleM2 * 1.05) / v.poidsSeau - 1e-9) : 0,
      // Adhésif : tour de la pièce, plus les raccords entre lés.
      rouleauxAdhesif: v.fixation === 2
        ? Math.ceil((plan.perimetre * 1.1 + (meilleur.les - 1) * (metresLineaires / meilleur.les)) / v.longueurAdhesif - 1e-9)
        : 0,
    };
  },

  devis: [
    { resultat: 'surfaceAchetee', designation: 'Lino ou sol vinyle', unite: 'm²', prixChamp: 'prixM2', detail: '{metresLineaires} m de rouleau de {largeurRouleau} m, {les} lé(s)' },
    { resultat: 'seauxColle', designation: 'Colle pour revêtement de sol', unite: 'seau', complement: true },
    { resultat: 'rouleauxAdhesif', designation: 'Adhésif double face', unite: 'rouleau', complement: true },
  ],

  explication: `
        <p>Le rouleau est déroulé en lés parallèles. Pour chaque lé, la longueur utile est mesurée sur la forme dessinée, puis augmentée de 10 cm pour l’arasement contre les murs.</p>
        <p><strong>Attention aux motifs.</strong> Dès qu’il faut plusieurs lés, le motif doit se prolonger de l’un à l’autre : chaque lé est coupé plus long, de la hauteur du raccord. Une pièce couverte par un seul lé n’a pas de raccord à faire. Le résultat indique la longueur ajoutée par le raccord.</p>
        <p>Les deux sens de pose sont comparés et le calcul retient celui qui demande le moins de métrage. Dans une pièce en L, un lé court suffit dans la partie étroite.</p>
        <p>Dans une pièce plus étroite que le rouleau, une seule pièce de revêtement évite tout raccord : c’est le cas le plus simple et le plus étanche.</p>`,

  erreurs: [
    'Poser sur un support irrégulier : le moindre défaut marque le sol souple.',
    'Oublier le raccord du motif entre deux lés.',
    'Découper au ras des murs avant que le revêtement ne se soit stabilisé.',
  ],

  conseils: [
    'Ragréez si le support n’est pas plan, puis laissez sécher complètement.',
    'Déroulez le revêtement dans la pièce avant la pose pour qu’il s’acclimate.',
    'Soudez ou collez les joints selon la préconisation du fabricant.',
  ],

  normes: [
    {
      titre: 'NF DTU 53.12',
      url: 'https://www.batirama.com/article/57034-nf-dtu-53.12-preparation-du-support-et-revetements-de-sol-souples.html',
      description: 'préparation du support et revêtements de sol souples',
    },
  ],

  lies: ['quantite-moquette', 'chape-ragreage', 'quantite-plinthes'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Lino ou sol vinyle ?',
      reponse: 'Le terme « lino » désigne souvent le sol vinyle en rouleau. Le vrai linoléum est fabriqué à partir d’huile de lin et de matières naturelles ; les deux se calculent de la même façon.',
    },
  ],

  exemples: [
    {
      plan: [[0, 0], [400, 0], [400, 300], [0, 300]],
      entrees: { largeurRouleau: 4, typeRaccord: 0, raccord: 0, fixation: 1, colleM2: 0.35, poidsSeau: 15, longueurAdhesif: 25, prixM2: 0 },
      attendu: { seauxColle: 1, rouleauxAdhesif: 0, surface: 12, metresLineaires: 3.1, les: 1, surfaceAchetee: 12.4, chute: 3.2258 },
    },
    {
      plan: [[0, 0], [500, 0], [500, 250], [300, 250], [300, 400], [0, 400]],
      entrees: { largeurRouleau: 4, typeRaccord: 0, raccord: 0, fixation: 2, colleM2: 0.35, poidsSeau: 15, longueurAdhesif: 25, prixM2: 0 },
      attendu: { surface: 17, metresLineaires: 5.1, les: 1, surfaceAchetee: 20.4 },
    },
    {
      // 6 m × 5 m avec un rouleau de 4 m : deux lés de 6,10 m (5 m de large = 4 m + 1 m).
      plan: [[0, 0], [600, 0], [600, 500], [0, 500]],
      entrees: { largeurRouleau: 4, typeRaccord: 0, raccord: 0, fixation: 2, colleM2: 0.35, poidsSeau: 15, longueurAdhesif: 25, prixM2: 0 },
      attendu: { surface: 30, metresLineaires: 10.2, les: 2, surfaceAchetee: 40.8, surplusRaccord: 0, rouleauxAdhesif: 2, seauxColle: 0 },
    },
    {
      // Même pièce, motif à raccord droit de 50 cm : deux lés de 5,10 + 0,50 m.
      plan: [[0, 0], [600, 0], [600, 500], [0, 500]],
      entrees: { largeurRouleau: 4, typeRaccord: 1, raccord: 50, fixation: 0, colleM2: 0.35, poidsSeau: 15, longueurAdhesif: 25, prixM2: 0 },
      attendu: { metresLineaires: 11.2, les: 2, surplusRaccord: 1 },
    },
    {
      // Un seul lé : pas de raccord à faire, même avec un motif.
      plan: [[0, 0], [400, 0], [400, 300], [0, 300]],
      entrees: { largeurRouleau: 4, typeRaccord: 2, raccord: 50, fixation: 0, colleM2: 0.35, poidsSeau: 15, longueurAdhesif: 25, prixM2: 0 },
      attendu: { metresLineaires: 3.1, les: 1, surplusRaccord: 0 },
    },
    {
      plan: [[0, 0], [400, 0], [400, 300], [0, 300]],
      entrees: { largeurRouleau: 4, typeRaccord: 1, raccord: 0, fixation: 0, colleM2: 0.35, poidsSeau: 15, longueurAdhesif: 25, prixM2: 0 },
      attendu: {},
    },
  ],
};
