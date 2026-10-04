// Calculateur : gravier, sable, terre ou remblai (volume, tonnes, sacs, big bags).
export default {
  slug: 'gravier-remblai',
  titre: 'Calcul de gravier, sable et remblai en tonnes',
  rubrique: 'Gravier et remblai',
  lot: 'exterieurs',
  ordre: 4,
  teinte: 'exterieur',
  description: 'Convertissez une surface et une épaisseur en volume, en tonnes, en sacs et en big bags de gravier, de sable, de terre ou de tout-venant.',
  intro: 'Indiquez les dimensions de la zone, l’épaisseur à étaler et le matériau : le calcul convertit le volume en poids avec sa masse volumique.',
  categorie: 'UtilitiesApplication',

  // Dimensions dessinées sur un plan (zone) ou saisies.
  // Aide au choix : questions fermées qui préremplissent les champs de type liste ou case.
  aideAuChoix: {
    questions: [
      { id: 'usage', question: 'À quoi servira le matériau ?', options: [{ valeur: 'allee', libelle: 'Une allée ou une cour décorative' }, { valeur: 'remblai', libelle: 'Un remblai ou une couche de fondation' }, { valeur: 'plantation', libelle: 'Un potager, un massif ou du gazon' }, { valeur: 'pose', libelle: 'Un lit de pose, du mortier ou un drainage' }] },
      { id: 'vehicules', question: 'Des véhicules rouleront-ils dessus ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
    ],
    regles: [
      { si: { usage: 'plantation' }, alors: { materiau: { valeur: 1.3, raison: '' } } },
      { si: { usage: 'remblai' }, alors: { materiau: { valeur: 2, raison: 'car il se compacte bien' } } },
      { si: { vehicules: 'oui' }, alors: { materiau: { valeur: 2, raison: 'en couche de fondation compactée, à recouvrir de gravier en finition' } } },
      { si: { usage: 'pose' }, alors: { materiau: { valeur: 1.6, raison: '' } } },
      { si: {}, alors: { materiau: { valeur: 1.5, raison: '' } } },
    ],
  },

  plan: { nature: 'zone', saisie: true },

  champs: [
    { id: 'longueur', saisie: true, label: 'Longueur', unite: 'm', requis: true, min: 0.1, max: 500, defaut: 6 },
    { id: 'largeur', saisie: true, label: 'Largeur', unite: 'm', requis: true, min: 0.1, max: 500, defaut: 3 },
    { id: 'epaisseur', label: 'Épaisseur', unite: 'cm', requis: true, min: 1, max: 200, defaut: 5, aide: 'Gravier décoratif : 4 à 5 cm. Remblai : selon la profondeur à combler.' },
    {
      id: 'materiau',
      type: 'choix',
      label: 'Matériau',
      defaut: 1.5,
      options: [
        { valeur: 1.5, libelle: 'Gravier ou gravillon décoratif (1,5 t/m³)' },
        { valeur: 1.6, libelle: 'Sable, galets (1,6 t/m³)' },
        { valeur: 1.3, libelle: 'Terre végétale (1,3 t/m³)' },
        { valeur: 2, libelle: 'Tout-venant ou grave compactée (2 t/m³)' },
      ],
    },
    { id: 'marge', label: 'Marge de tassement', unite: '%', min: 0, max: 40, defaut: 10 },
    { id: 'poidsSac', avance: true, label: 'Poids d’un sac', unite: 'kg', min: 1, defaut: 25 },
    { id: 'poidsBigBag', avance: true, label: 'Poids d’un big bag', unite: 'kg', min: 100, defaut: 1000 },
    { id: 'prixTonne', label: 'Prix à la tonne', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'tonnes', label: 'Poids à commander', format: 'nombre', unite: 't', principal: true },
    { id: 'volume', label: 'Volume, marge comprise', format: 'nombre', unite: 'm³' },
    { id: 'bigBags', equivalent: { champ: 'poidsBigBag', unite: 'kg' }, label: 'Big bags', format: 'nombre' },
    { id: 'sacs', equivalent: { champ: 'poidsSac', unite: 'kg' }, label: 'Sacs', format: 'nombre' },
  ],

  calculer(v, plan) {
    const surface = plan ? plan.surface : v.longueur * v.largeur;
    const volume = Math.round(surface * (v.epaisseur / 100) * (1 + v.marge / 100) * 1000) / 1000;
    const tonnes = Math.round(volume * v.materiau * 100) / 100;
    return {
      volume,
      tonnes,
      bigBags: Math.ceil((tonnes * 1000) / v.poidsBigBag - 1e-9),
      sacs: Math.ceil((tonnes * 1000) / v.poidsSac - 1e-9),
    };
  },

  devis: [
    { resultat: 'tonnes', designation: 'Gravier ou remblai', unite: 't', prixChamp: 'prixTonne', detail: '{longueur} × {largeur} m sur {epaisseur} cm, {volume} m³' },
  ],

  explication: `
        <p>Volume = longueur × largeur × épaisseur, plus la marge de tassement. Poids = volume × masse volumique du matériau. 6 × 3 m sur 5 cm de gravier donnent 0,99 m³ avec 10 % de marge, soit environ 1,5 t.</p>
        <p>Au-delà de quelques centaines de kilos, le big bag ou la livraison en vrac revient en général moins cher que les sacs.</p>`,

  erreurs: [
    'Commander en m³ un matériau vendu à la tonne sans passer par sa masse volumique : elle varie selon la nature et la granulométrie.',
    'Oublier le tassement : un remblai compacté occupe moins de volume que le matériau livré en vrac.',
    'Choisir une granulométrie inadaptée : allée, drainage et forme sous dalle ne demandent pas le même matériau.',
    'Poser le gravier directement sur la terre : il s’enfonce et se mélange au sol.',
  ],

  conseils: [
    'Demandez au fournisseur la masse volumique du produit livré et reportez-la dans le calculateur.',
    'Comparez sacs, big bags et vrac : au-delà de quelques m³, le vrac livré revient souvent moins cher.',
    'Posez un géotextile sous les allées pour séparer le gravier du sol.',
    'Compactez par couches successives plutôt qu’en une seule fois, et prévoyez des bordures.',
  ],

  normes: [
    {
      titre: 'Fiche technique du fournisseur',
      description: 'masse volumique et granulométrie du matériau livré (à vérifier pour chaque produit)',
    },
  ],

  lies: ['terrassement-deblai', 'pavage-allee', 'drainage-peripherique', 'terrasse-lames'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Faut-il un géotextile sous le gravier ?',
      reponse: 'Pour une allée ou un massif, oui : il empêche le gravier de s’enfoncer dans la terre et limite les herbes.',
    },
  ],

  exemples: [
    {
      entrees: { longueur: 6, largeur: 3, epaisseur: 5, materiau: 1.5, marge: 10, poidsSac: 25, poidsBigBag: 1000, prixTonne: 0 },
      attendu: { volume: 0.99, tonnes: 1.49, bigBags: 2, sacs: 60 },
    },
  ],
};
