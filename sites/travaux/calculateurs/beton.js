// Calculateur : volume de béton, puis toupie, sacs prêts à gâcher ou ciment, sable et gravier.
export default {
  slug: 'calcul-beton',
  titre: 'Calcul du volume de béton',
  rubrique: 'Béton',
  lot: 'gros-oeuvre',
  ordre: 1,
  teinte: 'grosoeuvre',
  description: 'Calculez le volume de béton d’une dalle, d’une semelle ou de poteaux, puis la toupie à commander ou les sacs de ciment, le sable et le gravier selon le dosage.',
  intro: 'Indiquez les dimensions de l’ouvrage et la façon dont le béton est fourni : le calcul donne le volume, puis les quantités à commander.',
  categorie: 'UtilitiesApplication',
  avertissement: 'ce calculateur estime des volumes et des quantités. Le dosage, la classe du béton, le ferraillage et les dimensions des fondations dépendent de l’ouvrage et du sol : suivez les DTU 13.1 et 13.3 et, pour un ouvrage porteur, l’avis d’un professionnel ou d’un bureau d’études.',

  groupes: {
    'L’ouvrage à couler': 'Dimensions intérieures du coffrage ou de la fouille.',
    'Fourniture du béton': 'Livré en toupie, en sacs prêts à gâcher, ou gâché sur place avec ciment, sable et gravier.',
  },

  // Dimensions dessinées sur un plan (zone) ou saisies.
  // Aide au choix : questions fermées qui préremplissent les champs de type liste ou case.
  aideAuChoix: {
    questions: [
      { id: 'ouvrage', question: 'Que coulez-vous ?', options: [{ valeur: 'dalle', libelle: 'Une dalle ou un dallage' }, { valeur: 'fondation', libelle: 'Une fondation (semelle)' }, { valeur: 'poteaux', libelle: 'Des poteaux ou des plots' }, { valeur: 'proprete', libelle: 'Un béton de propreté, sous une fondation' }] },
      { id: 'arme', question: 'Le béton sera-t-il armé (treillis soudé ou ferraillage) ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
      { id: 'quantite', question: 'Quelle quantité environ ?', options: [{ valeur: 'petite', libelle: 'Quelques brouettes' }, { valeur: 'moyenne', libelle: 'Moins d’un mètre cube' }, { valeur: 'grande', libelle: 'Plus d’un mètre cube' }] },
      { id: 'acces', question: 'Un camion toupie peut-il s’approcher du chantier ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
    ],
    regles: [
      { si: { ouvrage: 'dalle' }, alors: { ouvrage: { valeur: 0, raison: '' } } },
      { si: { ouvrage: 'fondation' }, alors: { ouvrage: { valeur: 1, raison: '' } } },
      { si: { ouvrage: 'proprete' }, alors: { ouvrage: { valeur: 1, raison: 'le béton de propreté se coule au fond de la fouille' }, dosage: { valeur: 250, raison: 'car il n’est pas armé et ne porte rien' } } },
      { si: { ouvrage: 'poteaux' }, alors: { ouvrage: { valeur: 2, raison: '' } } },
      { si: { arme: 'oui' }, alors: { dosage: { valeur: 350, raison: 'car le béton est armé ; suivez le DTU de l’ouvrage' } } },
      { si: { ouvrage: 'poteaux' }, alors: { dosage: { valeur: 350, raison: 'car les poteaux sont des éléments porteurs' } } },
      { si: {}, alors: { dosage: { valeur: 300, raison: 'pour une fondation ou un dallage courant ; suivez le DTU de l’ouvrage' } } },
      { si: { quantite: 'grande', acces: 'oui' }, alors: { fourniture: { valeur: 1, raison: 'plus régulier et bien moins pénible au-delà d’un mètre cube' } } },
      { si: { quantite: 'petite' }, alors: { fourniture: { valeur: 2, raison: 'le plus pratique pour quelques brouettes' } } },
      { si: {}, alors: { fourniture: { valeur: 0, raison: 'le plus économique quand le camion ne peut pas approcher ou pour un petit volume' } } },
    ],
  },

  plan: { nature: 'zone', saisie: true },

  champs: [
    {
      id: 'ouvrage',
      groupe: 'L’ouvrage à couler',
      type: 'choix',
      label: 'Ouvrage',
      defaut: 0,
      options: [
        { valeur: 0, libelle: 'Dalle ou dallage' },
        { valeur: 1, libelle: 'Semelle filante (fondation)' },
        { valeur: 2, libelle: 'Poteaux ou plots' },
      ],
    },
    { id: 'longueur', saisie: true, groupe: 'L’ouvrage à couler', label: 'Longueur', unite: 'm', requis: true, min: 0.05, defaut: 5, aide: 'Semelle : longueur totale de la fondation.' },
    { id: 'largeur', saisie: true, groupe: 'L’ouvrage à couler', label: 'Largeur', unite: 'm', requis: true, min: 0.05, defaut: 4 },
    { id: 'epaisseur', groupe: 'L’ouvrage à couler', label: 'Épaisseur ou hauteur', unite: 'cm', requis: true, min: 1, defaut: 12, aide: 'Dalle : épaisseur. Semelle et poteaux : hauteur coulée.' },
    { id: 'nombre', groupe: 'L’ouvrage à couler', label: 'Nombre d’éléments identiques', requis: true, min: 1, defaut: 1, aide: 'Pour des poteaux ou des plots.' },
    { id: 'marge', label: 'Marge de sécurité', unite: '%', min: 0, max: 30, defaut: 5 },
    {
      id: 'fourniture',
      groupe: 'Fourniture du béton',
      type: 'choix',
      label: 'Fourniture du béton',
      defaut: 0,
      options: [
        { valeur: 0, libelle: 'Gâché sur place : ciment, sable, gravier' },
        { valeur: 1, libelle: 'Béton prêt à l’emploi livré en toupie' },
        { valeur: 2, libelle: 'Sacs de béton prêt à gâcher' },
      ],
    },
    {
      id: 'dosage',
      groupe: 'Fourniture du béton',
      type: 'choix',
      label: 'Dosage en ciment (béton gâché)',
      defaut: 350,
      options: [
        { valeur: 250, libelle: '250 kg/m³ : béton de propreté' },
        { valeur: 300, libelle: '300 kg/m³ : fondations, dallage courant' },
        { valeur: 350, libelle: '350 kg/m³ : béton armé, dalle, poteaux' },
      ],
    },
    { id: 'poidsSacCiment', avance: true, label: 'Poids d’un sac de ciment', unite: 'kg', min: 1, defaut: 35 },
    { id: 'rendementSac', avance: true, label: 'Béton obtenu avec un sac prêt à gâcher', unite: 'litres', min: 1, defaut: 12, aide: 'Indiqué sur le sac (souvent 11 à 13 L pour 25 kg).' },
    { id: 'prixSacCiment', label: 'Prix d’un sac de ciment', unite: '€', min: 0 },
    { id: 'prixTonneSable', label: 'Prix d’une tonne de sable', unite: '€', min: 0 },
    { id: 'prixTonneGravier', label: 'Prix d’une tonne de gravier', unite: '€', min: 0 },
    { id: 'prixM3', label: 'Prix du m³ de béton livré', unite: '€', min: 0 },
    { id: 'prixSacBeton', label: 'Prix d’un sac prêt à gâcher', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'volume', label: 'Volume de béton, marge comprise', format: 'nombre', unite: 'm³', principal: true },
    { id: 'toupie', label: 'Volume à commander en toupie', format: 'nombre', unite: 'm³' },
    { id: 'sacsCiment', equivalent: { champ: 'poidsSacCiment', unite: 'kg' }, label: 'Sacs de ciment', format: 'nombre' },
    { id: 'sable', label: 'Sable 0/4', format: 'nombre', unite: 't' },
    { id: 'gravier', label: 'Gravier 4/20', format: 'nombre', unite: 't' },
    { id: 'eau', label: 'Eau de gâchage', format: 'nombre', unite: 'L' },
    { id: 'sacsBeton', label: 'Sacs de béton prêt à gâcher', format: 'nombre' },
  ],

  calculer(v, plan) {
    // Dessin : surface de la zone ; saisie : longueur × largeur.
    const surface = plan ? plan.surface : v.longueur * v.largeur;
    const volume = Math.round(surface * (v.epaisseur / 100) * v.nombre * (1 + v.marge / 100) * 1000) / 1000;
    const gache = v.fourniture === 0;
    // Recette indicative pour 1 m³ : dosage en ciment, 700 kg de sable, 1 100 kg de gravier, eau ≈ moitié du dosage.
    return {
      volume,
      toupie: v.fourniture === 1 ? Math.ceil(volume * 2 - 1e-9) / 2 : null,
      sacsCiment: gache ? Math.ceil((volume * v.dosage) / v.poidsSacCiment - 1e-9) : null,
      sable: gache ? Math.round(volume * 0.7 * 100) / 100 : null,
      gravier: gache ? Math.round(volume * 1.1 * 100) / 100 : null,
      eau: gache ? Math.round(volume * v.dosage * 0.5) : null,
      sacsBeton: v.fourniture === 2 ? Math.ceil((volume * 1000) / v.rendementSac - 1e-9) : null,
    };
  },

  devis: [
    { resultat: 'toupie', designation: 'Béton prêt à l’emploi', unite: 'm³', prixChamp: 'prixM3', detail: '{longueur} × {largeur} m sur {epaisseur} cm, livraison en toupie' },
    { resultat: 'sacsCiment', designation: 'Ciment', unite: 'sac', prixChamp: 'prixSacCiment', detail: '{volume} m³ dosés à {dosage} kg/m³, sacs de {poidsSacCiment} kg' },
    { resultat: 'sable', designation: 'Sable 0/4', unite: 't', prixChamp: 'prixTonneSable' },
    { resultat: 'gravier', designation: 'Gravier 4/20', unite: 't', prixChamp: 'prixTonneGravier' },
    { resultat: 'sacsBeton', designation: 'Béton prêt à gâcher', unite: 'sac', prixChamp: 'prixSacBeton', detail: '{volume} m³, {rendementSac} L par sac' },
  ],

  explication: `
        <p>Volume = longueur × largeur × épaisseur × nombre d’éléments, plus la marge. Une dalle de 5 × 4 m sur 12 cm fait 2,4 m³, soit 2,52 m³ avec 5 % de marge.</p>
        <p>En toupie, le volume est arrondi au demi-mètre cube supérieur. Gâché sur place, la recette indicative pour 1 m³ est : le dosage en ciment, environ 700 kg de sable 0/4, 1 100 kg de gravier 4/20, et une quantité d’eau voisine de la moitié du poids de ciment.</p>
        <p>Au-delà de 1 à 2 m³, la toupie est en général plus simple et plus régulière qu’un béton gâché à la bétonnière.</p>`,

  erreurs: [
    'Saisir l’épaisseur en mètres au lieu de centimètres : le volume est alors multiplié par cent.',
    'Oublier la marge : un fond de fouille irrégulier ou un coffrage qui se déforme consomment plus de béton que prévu.',
    'Ajouter de l’eau pour faciliter la mise en place : un béton trop mouillé perd une grande partie de sa résistance.',
    'Commander une toupie sans vérifier l’accès du camion, la portée de la goulotte ou le volume minimal de livraison.',
    'Couler par temps de gel, ou en plein soleil sans protéger la surface : le béton se fissure ou n’atteint pas sa résistance.',
  ],

  conseils: [
    'Au-delà de quelques brouettes, comparez avec le béton livré en toupie : il est plus régulier qu’un béton gâché à la main.',
    'Humidifiez le coffrage et le sol avant de couler, puis gardez le béton humide les premiers jours (cure).',
    'Vibrez ou piquez le béton pour chasser l’air, en particulier autour des armatures.',
    'Le dosage dépend de l’ouvrage : fondation, dalle ou béton de propreté n’ont pas les mêmes exigences. Suivez le DTU de l’ouvrage et la fiche du ciment.',
  ],

  normes: [
    {
      titre: 'NF DTU 21',
      url: 'https://www.batirama.com/article/12088-nf-dtu-21-execution-des-ouvrages-en-beton.html',
      description: 'exécution des ouvrages en béton',
    },
    {
      titre: 'NF DTU 13.1',
      url: 'https://www.batirama.com/article/1964-la-liste-des-dtu-documents-techniques-unifies-a-jour.html',
      description: 'fondations superficielles',
    },
    {
      titre: 'NF DTU 13.3',
      url: 'https://www.batirama.com/article/10538-nf-dtu-13.3-travaux-de-dallages.html',
      description: 'dallages : conception, calcul et exécution',
    },
    {
      titre: 'NF EN 206/CN',
      description: 'béton : spécification, performances, production et conformité',
    },
  ],

  lies: ['treillis-soude', 'mur-parpaings-briques', 'terrassement-deblai', 'chape-ragreage'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Quel dosage choisir ?',
      reponse: '250 kg/m³ pour un béton de propreté, 300 kg/m³ pour des fondations ou un dallage courant, 350 kg/m³ pour un béton armé. En toupie, la centrale fournit un béton normé : indiquez l’usage et la classe d’exposition.',
    },
    {
      question: 'Combien de sacs de béton pour 1 m³ ?',
      reponse: 'Cela dépend du sac : le volume de béton frais obtenu est indiqué sur l’emballage. Avec des sacs de 35 kg donnant environ 17 litres (repère à vérifier sur le sac), il en faut près de 60 par m³. C’est pourquoi la toupie devient plus simple au-delà d’un ou deux m³.',
    },
    {
      question: 'Au bout de combien de temps peut-on marcher sur une dalle ?',
      reponse: 'En repère courant, on peut marcher dessus après un ou deux jours, poser des charges légères après une semaine environ, et le béton atteint sa résistance de calcul à 28 jours. Le froid ralentit la prise : ces délais s’allongent en hiver.',
    },
    {
      question: 'Faut-il arroser le béton frais ?',
      reponse: 'Par temps chaud, sec ou venteux, oui : il faut le garder humide les premiers jours (arrosage en pluie fine, bâche ou produit de cure) pour éviter qu’il sèche trop vite et fissure. Ne coulez jamais par temps de gel.',
    },
  ],

  exemples: [
    {
      entrees: { ouvrage: 0, longueur: 5, largeur: 4, epaisseur: 12, nombre: 1, marge: 5, fourniture: 0, dosage: 350, poidsSacCiment: 35, rendementSac: 12, prixSacCiment: 0, prixTonneSable: 0, prixTonneGravier: 0, prixM3: 0, prixSacBeton: 0 },
      attendu: { volume: 2.52, sacsCiment: 26, sable: 1.76, gravier: 2.77, eau: 441, toupie: null, sacsBeton: null },
    },
    {
      entrees: { ouvrage: 1, longueur: 24, largeur: 0.5, epaisseur: 60, nombre: 1, marge: 5, fourniture: 1, dosage: 350, poidsSacCiment: 35, rendementSac: 12, prixSacCiment: 0, prixTonneSable: 0, prixTonneGravier: 0, prixM3: 0, prixSacBeton: 0 },
      attendu: { volume: 7.56, toupie: 8, sacsCiment: null },
    },
    {
      entrees: { ouvrage: 2, longueur: 0.2, largeur: 0.2, epaisseur: 100, nombre: 4, marge: 5, fourniture: 2, dosage: 350, poidsSacCiment: 35, rendementSac: 12, prixSacCiment: 0, prixTonneSable: 0, prixTonneGravier: 0, prixM3: 0, prixSacBeton: 0 },
      attendu: { volume: 0.168, sacsBeton: 14 },
    },
  ],
};
