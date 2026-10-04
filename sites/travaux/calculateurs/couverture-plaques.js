// Calculateur : couverture en plaques (ondulées, bac acier) ou en bardeaux bitumés (shingle).
export default {
  slug: 'couverture-plaques',
  titre: 'Calcul de plaques de couverture et de shingle',
  rubrique: 'Couverture en plaques',
  lot: 'couverture',
  ordre: 4,
  teinte: 'tuiles',
  description: 'Calculez le nombre de plaques ondulées ou de bac acier, les fixations et les faîtières, ou les paquets de shingle, pour un abri, un garage ou une dépendance.',
  intro: 'Indiquez les dimensions du bâtiment et la pente : le calcul déduit la longueur du rampant, puis les rangées de plaques avec leur recouvrement.',
  categorie: 'UtilitiesApplication',
  avertissement: 'ce calculateur estime des quantités. La pente minimale, les recouvrements, l’écartement des supports et le nombre de fixations dépendent du produit et de l’exposition au vent : suivez la notice du fabricant.',

  // Pan de toit dessiné vu du dessus, ou dimensions de la toiture saisies.
  // Aide au choix : questions fermées qui préremplissent les champs de type liste ou case.
  aideAuChoix: {
    questions: [
      { id: 'support', question: 'Le toit a-t-il un support continu en panneaux de bois (OSB, voliges) ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
      { id: 'aspect', question: 'Quel aspect recherchez-vous ?', options: [{ valeur: 'toiture', libelle: 'Proche de la tuile ou de l’ardoise' }, { valeur: 'economique', libelle: 'Indifférent : le plus simple et le moins cher' }] },
      { id: 'deuxPans', question: 'Le toit a-t-il deux pans ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
    ],
    regles: [
      { si: { support: 'non' }, alors: { type: { valeur: 0, raison: 'car le shingle demande un support continu' } } },
      { si: { aspect: 'toiture' }, alors: { type: { valeur: 1, raison: 'il se pose sur un support continu, avec sous-couche' } } },
      { si: {}, alors: { type: { valeur: 0, raison: '' } } },
      { si: { deuxPans: 'oui' }, alors: { pans: { valeur: 2, raison: '' } } },
      { si: {}, alors: { pans: { valeur: 1, raison: '' } } },
    ],
  },

  plan: { nature: 'pan', saisie: true },

  champs: [
    {
      id: 'type',
      type: 'choix',
      label: 'Couverture',
      defaut: 0,
      options: [
        { valeur: 0, libelle: 'Plaques ondulées ou bac acier' },
        { valeur: 1, libelle: 'Bardeaux bitumés (shingle)' },
      ],
    },
    {
      id: 'pans',
      type: 'choix',
      label: 'Forme du toit',
      defaut: 1,
      options: [
        { valeur: 1, libelle: 'Un seul pan (appentis)' },
        { valeur: 2, libelle: 'Deux pans identiques' },
      ],
    },
    { id: 'longueurToit', saisie: true, label: 'Longueur du toit, le long du faîtage ou de l’égout', unite: 'm', requis: true, min: 0.5, max: 100, defaut: 6 },
    { id: 'largeurBatiment', saisie: true, label: 'Largeur du bâtiment', unite: 'm', requis: true, min: 0.5, max: 50, defaut: 3 },
    { id: 'pente', label: 'Pente du toit', unite: 'degrés', requis: true, min: 3, max: 70, defaut: 15 },
    { id: 'debordEgout', saisie: true, label: 'Débord en bas de pente', unite: 'm', min: 0, defaut: 0.2 },
    { id: 'debordRive', saisie: true, label: 'Débord sur les côtés', unite: 'm', min: 0, defaut: 0.1 },
    { id: 'largeurUtile', avance: true, label: 'Largeur utile d’une plaque', unite: 'm', min: 0.3, defaut: 1, aide: 'Largeur couverte une fois les plaques recouvertes sur le côté.' },
    { id: 'longueurPlaque', avance: true, label: 'Longueur d’une plaque', unite: 'm', min: 0.5, defaut: 2.5 },
    { id: 'recouvrement', avance: true, label: 'Recouvrement entre rangées', unite: 'cm', min: 5, defaut: 20 },
    { id: 'fixationsParPlaque', avance: true, label: 'Fixations par plaque', min: 1, defaut: 6 },
    { id: 'longueurFaitiere', avance: true, label: 'Longueur utile d’une faîtière', unite: 'm', min: 0.3, defaut: 1 },
    { id: 'surfacePaquet', avance: true, label: 'Surface couverte par un paquet de shingle', unite: 'm²', min: 0.5, defaut: 3 },
    { id: 'surfaceSousCouche', avance: true, label: 'Surface d’un rouleau de sous-couche (shingle)', unite: 'm²', min: 1, defaut: 20 },
    { id: 'prixPlaque', label: 'Prix d’une plaque', unite: '€', min: 0 },
    { id: 'prixPaquet', label: 'Prix d’un paquet de shingle', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'plaques', label: 'Plaques', format: 'nombre', principal: true },
    { id: 'paquets', label: 'Paquets de shingle', format: 'nombre' },
    { id: 'surface', label: 'Surface de toiture', format: 'nombre', unite: 'm²' },
    { id: 'rampant', label: 'Longueur du rampant', format: 'nombre', unite: 'm' },
    { id: 'rangees', label: 'Rangées de plaques par pan', format: 'nombre' },
    { id: 'fixations', label: 'Fixations', format: 'nombre' },
    { id: 'faitieres', label: 'Faîtières', format: 'nombre' },
    { id: 'rouleauxSousCouche', label: 'Rouleaux de sous-couche', format: 'nombre' },
  ],

  calculer(v, plan) {
    // Dessin : un pan vu du dessus (projection, débords compris) ; la pente donne la surface réelle,
    // exacte quelle que soit la forme (trapèze, triangle). Saisie : toiture à 1 ou 2 pans identiques.
    const cosPente = Math.cos((v.pente * Math.PI) / 180);
    const pans = plan ? 1 : v.pans;
    const portee = plan ? plan.largeur : v.pans === 2 ? v.largeurBatiment / 2 : v.largeurBatiment;
    const rampant = portee / cosPente + (plan ? 0 : v.debordEgout);
    const longueurPan = plan ? plan.longueur : v.longueurToit + 2 * v.debordRive;
    const surface = plan ? plan.surface / cosPente : pans * longueurPan * rampant;
    // Faîtage d'un pan dessiné : son bord haut, partagé avec le pan opposé quand la toiture a deux pans.
    let arete = 0;
    if (plan) {
      const haut = Math.min(...plan.points.map((point) => point[1]));
      const xs = plan.points.filter((point) => Math.abs(point[1] - haut) < 1).map((point) => point[0]);
      arete = (Math.max(...xs) - Math.min(...xs)) / 100;
    }
    const longueurFaitage = plan ? (v.pans === 2 ? arete / 2 : 0) : v.pans === 2 ? longueurPan : 0;
    const faitieres = longueurFaitage > 0 ? Math.ceil(longueurFaitage / v.longueurFaitiere - 1e-9) : 0;

    if (v.type === 1) {
      return {
        surface,
        rampant,
        paquets: Math.ceil((surface * 1.1) / v.surfacePaquet - 1e-9),
        rouleauxSousCouche: Math.ceil((surface * 1.1) / v.surfaceSousCouche - 1e-9),
        plaques: null,
        rangees: null,
        fixations: null,
        faitieres: null,
      };
    }

    const recouvrement = v.recouvrement / 100;
    const rangees = rampant <= v.longueurPlaque ? 1 : Math.ceil((rampant - recouvrement) / (v.longueurPlaque - recouvrement) - 1e-9);
    const plaques = pans * rangees * Math.ceil(longueurPan / v.largeurUtile - 1e-9);
    return {
      surface,
      rampant,
      rangees,
      plaques,
      fixations: plaques * v.fixationsParPlaque,
      faitieres,
      paquets: null,
      rouleauxSousCouche: null,
    };
  },

  devis: [
    { resultat: 'plaques', designation: 'Plaques de couverture', unite: 'plaque', prixChamp: 'prixPlaque', detail: '{surface} m², {rangees} rangée(s) par pan, plaques de {longueurPlaque} m' },
    { resultat: 'fixations', designation: 'Fixations de plaques', unite: 'pièce', complement: true },
    { resultat: 'faitieres', designation: 'Faîtières', unite: 'faîtière', complement: true },
    { resultat: 'paquets', designation: 'Bardeaux bitumés (shingle)', unite: 'paquet', prixChamp: 'prixPaquet', detail: '{surface} m²' },
    { resultat: 'rouleauxSousCouche', designation: 'Sous-couche pour shingle', unite: 'rouleau', complement: true },
  ],

  explication: `
        <p>Rampant = portée ÷ cosinus de la pente, plus le débord. Si le rampant dépasse la longueur d’une plaque, plusieurs rangées se recouvrent : rangées = (rampant − recouvrement) ÷ (longueur de plaque − recouvrement), arrondi à l’entier supérieur.</p>
        <p>Le shingle se pose sur un support continu (voliges ou panneaux) couvert d’une sous-couche ; les paquets sont comptés sur la surface, plus 10 % pour les coupes et les recouvrements.</p>`,

  erreurs: [
    'Poser sous la pente minimale du produit.',
    'Oublier les recouvrements latéraux et longitudinaux dans le nombre de plaques.',
    'Visser dans le creux de l’onde au lieu du sommet, quand la notice demande une fixation en sommet.',
    'Poser du shingle sans support continu ni sous-couche.',
  ],

  conseils: [
    'Posez les plaques dans le sens opposé aux vents dominants.',
    'Utilisez les fixations et les rondelles d’étanchéité prévues par le fabricant.',
    'Prévoyez des closoirs pour fermer les ondes en faîtage et en égout.',
  ],

  normes: [
    {
      titre: 'NF DTU 40.35',
      url: 'https://www.batirama.com/article/1964-la-liste-des-dtu-documents-techniques-unifies-a-jour.html',
      description: 'couverture en plaques nervurées issues de tôles d’acier revêtues',
    },
    {
      titre: 'NF DTU 40.37',
      url: 'https://www.batirama.com/article/1964-la-liste-des-dtu-documents-techniques-unifies-a-jour.html',
      description: 'couverture en plaques ondulées en fibres-ciment',
    },
    {
      titre: 'NF DTU 40.14',
      url: 'https://www.batirama.com/article/1964-la-liste-des-dtu-documents-techniques-unifies-a-jour.html',
      description: 'couverture en bardeaux bitumés',
    },
  ],

  lies: ['gouttieres', 'conversion-pente', 'chevrons-charpente'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Quelle pente minimale pour des plaques ondulées ?',
      reponse: 'Elle dépend du produit et du recouvrement : les fabricants indiquent souvent une pente minimale d’une dizaine de degrés, davantage pour le shingle. Vérifiez la notice avant de choisir.',
    },
  ],

  exemples: [
    {
      // Appentis de 6 × 3 m à 15° : rampant 3,31 m, deux rangées de plaques de 2,50 m.
      entrees: { type: 0, pans: 1, longueurToit: 6, largeurBatiment: 3, pente: 15, debordEgout: 0.2, debordRive: 0.1, largeurUtile: 1, longueurPlaque: 2.5, recouvrement: 20, fixationsParPlaque: 6, longueurFaitiere: 1, surfacePaquet: 3, surfaceSousCouche: 20, prixPlaque: 0, prixPaquet: 0 },
      attendu: { rampant: 3.3058, surface: 20.4966, rangees: 2, plaques: 14, fixations: 84, faitieres: 0, paquets: null },
    },
    {
      entrees: { type: 1, pans: 1, longueurToit: 6, largeurBatiment: 3, pente: 15, debordEgout: 0.2, debordRive: 0.1, largeurUtile: 1, longueurPlaque: 2.5, recouvrement: 20, fixationsParPlaque: 6, longueurFaitiere: 1, surfacePaquet: 3, surfaceSousCouche: 20, prixPlaque: 0, prixPaquet: 0 },
      attendu: { paquets: 8, rouleauxSousCouche: 2, plaques: null },
    },
  ],
};
