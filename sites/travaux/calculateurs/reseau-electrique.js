// Calculateur : quantités de gaine, de fil et de boîtes pour un réseau électrique.
export default {
  slug: 'reseau-electrique',
  titre: 'Calcul de gaine, de fil et de boîtes électriques',
  rubrique: 'Réseau électrique',
  lot: 'electricite',
  ordre: 1,
  teinte: 'electricite',
  description: 'Estimez les couronnes de gaine et de fil et le nombre de boîtes d’encastrement à partir du nombre de prises, de points lumineux et d’interrupteurs.',
  intro: 'Comptez les points à raccorder et la longueur moyenne de gaine par point : le calcul estime les quantités à acheter, sans concevoir l’installation.',
  categorie: 'UtilitiesApplication',
  avertissement: 'ce calculateur estime des longueurs et des quantités ; il ne conçoit pas une installation. Le nombre de circuits, la section des conducteurs, les protections et le nombre de prises par circuit relèvent de la norme NF C 15-100. Une installation neuve ou rénovée doit être conforme et, dans de nombreux cas, vérifiée par le Consuel avant la mise sous tension.',

  champs: [
    { id: 'prises', label: 'Prises de courant', min: 0, max: 200, defaut: 10 },
    { id: 'pointsLumineux', label: 'Points lumineux', min: 0, max: 100, defaut: 5 },
    { id: 'interrupteurs', label: 'Interrupteurs et va-et-vient', min: 0, max: 100, defaut: 5 },
    { id: 'circuitsSpecialises', label: 'Circuits spécialisés', min: 0, max: 30, defaut: 3, aide: 'Plaque de cuisson, four, lave-linge, lave-vaisselle, chauffe-eau…' },
    { id: 'longueurParPoint', label: 'Longueur moyenne de gaine par point', unite: 'm', requis: true, min: 1, max: 40, defaut: 6, aide: 'Du tableau ou du point précédent du même circuit : souvent 4 à 8 m dans une maison.' },
    { id: 'conducteurs', avance: true, label: 'Conducteurs par gaine', min: 2, max: 5, defaut: 3, aide: 'Phase, neutre et terre.' },
    { id: 'longueurCouronneGaine', avance: true, label: 'Longueur d’une couronne de gaine', unite: 'm', min: 5, defaut: 50 },
    { id: 'longueurCouronneFil', avance: true, label: 'Longueur d’une couronne de fil', unite: 'm', min: 5, defaut: 100 },
    { id: 'prixCouronneGaine', label: 'Prix d’une couronne de gaine', unite: '€', min: 0 },
    { id: 'prixCouronneFil', label: 'Prix d’une couronne de fil', unite: '€', min: 0 },
    { id: 'prixBoite', label: 'Prix d’une boîte d’encastrement', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'couronnesGaine', label: 'Couronnes de gaine', format: 'nombre', principal: true },
    { id: 'gaine', label: 'Longueur de gaine', format: 'nombre', unite: 'm' },
    { id: 'fil', label: 'Longueur de fil', format: 'nombre', unite: 'm' },
    { id: 'couronnesFil', label: 'Couronnes de fil', format: 'nombre' },
    { id: 'boites', label: 'Boîtes d’encastrement', format: 'nombre' },
  ],

  calculer(v) {
    const points = v.prises + v.pointsLumineux + v.interrupteurs + v.circuitsSpecialises;
    const gaine = Math.ceil(points * v.longueurParPoint * 1.1 - 1e-9);
    const fil = gaine * v.conducteurs;
    return {
      gaine,
      couronnesGaine: Math.ceil(gaine / v.longueurCouronneGaine - 1e-9),
      fil,
      couronnesFil: Math.ceil(fil / v.longueurCouronneFil - 1e-9),
      boites: v.prises + v.interrupteurs + v.pointsLumineux,
    };
  },

  devis: [
    { resultat: 'couronnesGaine', designation: 'Gaine électrique ICTA', unite: 'couronne', prixChamp: 'prixCouronneGaine', detail: '{gaine} m' },
    { resultat: 'couronnesFil', designation: 'Fil électrique', unite: 'couronne', prixChamp: 'prixCouronneFil', detail: '{fil} m, sections selon la NF C 15-100' },
    { resultat: 'boites', designation: 'Boîtes d’encastrement', unite: 'boîte', prixChamp: 'prixBoite', complement: true },
  ],

  explication: `
        <p>Gaine = nombre de points × longueur moyenne par point, plus 10 %. Chaque gaine contient en général trois conducteurs (phase, neutre, terre) : fil = gaine × 3. Chaque prise, interrupteur et point lumineux reçoit une boîte d’encastrement.</p>
        <p>Le calcul ne répartit pas les points en circuits et ne choisit pas les sections de fil : c’est l’objet de la norme NF C 15-100.</p>
        <p>Avant d’acheter, établissez la liste des circuits pièce par pièce. À titre de repère, l’édition 2024 de la norme NF C 15-100 (applicable aux projets lancés à partir de septembre 2025) prévoit notamment :</p>
        <ul>
        <li>éclairage : 8 points lumineux au plus par circuit, en fil de 1,5 mm² protégé à 16 A, et au moins deux circuits d’éclairage dès que le logement compte deux pièces principales ;</li>
        <li>prises de courant : 8 prises au plus sur un circuit en 1,5 mm² protégé à 16 A, 12 au plus sur un circuit en 2,5 mm² protégé à 20 A ;</li>
        <li>circuits spécialisés : plaque de cuisson en 6 mm² protégée à 32 A ; lave-linge, sèche-linge, lave-vaisselle et four, chacun sur son propre circuit en 2,5 mm² protégé à 20 A ;</li>
        <li>nombre minimal de prises : il dépend de la pièce et de sa surface (par exemple au moins 5 dans le séjour, et 6 dans une cuisine de plus de 4 m², dont 4 au-dessus du plan de travail) ; vérifiez le détail pièce par pièce avec votre électricien.</li>
        </ul>
        <p>Ces valeurs sont des repères à vérifier dans le texte de la norme en vigueur et avec votre électricien : ici, elles servent à compter les gaines et les couronnes, pas à concevoir l’installation.</p>
        <p>Le fil se vend par couleur : bleu pour le neutre, vert et jaune pour la terre, et une autre couleur pour la phase (souvent rouge, marron ou noir). Avec trois conducteurs par gaine, achetez environ un tiers de la longueur de fil dans chaque couleur, et un peu plus de phase pour les va-et-vient.</p>
        <p>La longueur moyenne par point se mesure sur plan, depuis le tableau : descentes dans les cloisons, passages en plafond et détours compris. Un point éloigné du tableau ou situé à l’étage peut demander deux fois la longueur moyenne.</p>`,

  erreurs: [
    'Mettre trop de prises ou de points lumineux sur un même circuit.',
    'Oublier les circuits spécialisés : four, lave-linge, plaque de cuisson.',
    'Choisir une section de fil sans la relier au calibre du disjoncteur.',
    'Acheter tout le fil d’une seule couleur : la phase, le neutre (bleu) et la terre (vert et jaune) doivent se distinguer.',
    'Faire passer trop de fils dans une gaine trop fine : ils chauffent et se tirent mal.',
  ],

  conseils: [
    'Faites la liste des points pièce par pièce avant d’acheter.',
    'Prévoyez des emplacements libres dans le tableau pour les évolutions.',
    'Faites contrôler l’installation par un professionnel qualifié, et par le Consuel pour une installation neuve.',
    'Laissez une gaine vide en attente vers les combles, le garage ou le jardin pour les besoins futurs.',
  ],

  normes: [
    {
      titre: 'NF C 15-100',
      description: 'installations électriques à basse tension',
    },
  ],

  lies: ['debit-vmc', 'plaques-de-platre'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Quelle section de fil acheter ?',
      reponse: 'Elle dépend du circuit : la norme NF C 15-100 fixe la section et la protection de chaque type de circuit (éclairage, prises, circuits spécialisés). Un électricien ou un guide conforme à la norme vous l’indiquera.',
    },
    {
      question: 'Combien de prises peut-on mettre sur un même circuit ?',
      reponse: 'Selon l’édition 2024 de la NF C 15-100, 8 prises au plus sur un circuit en 1,5 mm² protégé à 16 A, et 12 au plus sur un circuit en 2,5 mm² protégé à 20 A. Les prises de la cuisine et les gros appareils ont leurs propres circuits. Vérifiez ces repères avec votre électricien.',
    },
    {
      question: 'Quel diamètre de gaine choisir ?',
      reponse: 'Les fils ne doivent pas remplir la gaine : la règle usuelle limite leur section totale au tiers de celle de la gaine. En pratique, on utilise couramment une gaine de 16 mm pour trois fils de 1,5 mm², de 20 mm pour trois fils de 2,5 mm² et de 25 mm pour trois fils de 6 mm² (repères à vérifier selon la longueur et le nombre de coudes).',
    },
    {
      question: 'Le passage du Consuel est-il obligatoire ?',
      reponse: 'Une attestation de conformité visée par le Consuel est exigée pour mettre en service une installation neuve, et pour une rénovation complète lorsque l’alimentation a été coupée par le distributeur. Dans les autres cas, faire contrôler l’installation reste vivement recommandé.',
    },
    {
      question: 'Puis-je faire mon installation électrique moi-même ?',
      reponse: 'Un particulier peut réaliser l’installation de son propre logement, à condition qu’elle respecte la NF C 15-100. Coupez toujours le courant au disjoncteur général avant d’intervenir, et faites vérifier l’ensemble par un professionnel en cas de doute.',
    },
  ],

  exemples: [
    {
      entrees: { prises: 10, pointsLumineux: 5, interrupteurs: 5, circuitsSpecialises: 3, longueurParPoint: 6, conducteurs: 3, longueurCouronneGaine: 50, longueurCouronneFil: 100, prixCouronneGaine: 0, prixCouronneFil: 0, prixBoite: 0 },
      attendu: { gaine: 152, couronnesGaine: 4, fil: 456, couronnesFil: 5, boites: 20 },
    },
  ],
};
