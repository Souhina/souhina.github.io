// Calculateur : mur en parpaings, briques, béton cellulaire ou carreaux de plâtre.
export default {
  slug: 'mur-parpaings-briques',
  titre: 'Calcul de parpaings, briques et blocs pour un mur',
  rubrique: 'Mur en blocs',
  lot: 'gros-oeuvre',
  ordre: 2,
  teinte: 'grosoeuvre',
  description: 'Calculez le nombre de parpaings, de briques, de blocs de béton cellulaire ou de carreaux de plâtre pour un mur, les blocs d’angle et le mortier.',
  intro: 'Choisissez le bloc et indiquez les dimensions du mur : le calcul déduit les ouvertures, compte les rangs et ajoute les blocs d’angle.',
  categorie: 'UtilitiesApplication',
  avertissement: 'ce calculateur estime des quantités. Un mur porteur demande des chaînages, des fondations et des linteaux adaptés : suivez le DTU 20.1 et l’avis d’un professionnel.',

  // Mur dessiné de face (pignon compris), ou dimensions saisies.
  // Aide au choix : questions fermées qui préremplissent les champs de type liste ou case.
  aideAuChoix: {
    questions: [
      { id: 'usage', question: 'Quel mur montez-vous ?', options: [{ valeur: 'porteur', libelle: 'Un mur porteur ou un mur extérieur' }, { valeur: 'cloison', libelle: 'Une cloison intérieure, non porteuse' }, { valeur: 'muret', libelle: 'Un muret ou un mur de clôture' }] },
      { id: 'isolant', question: 'Le mur doit-il isoler du froid par lui-même, avec un doublage mince ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
      { id: 'leger', question: 'Cherchez-vous un bloc léger, facile à couper et à porter ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
    ],
    regles: [
      { si: { usage: 'cloison' }, alors: { bloc: { valeur: 3, raison: 'pour une cloison intérieure ; prenez des carreaux hydrofuges en pièce humide' } } },
      { si: { usage: 'porteur', isolant: 'oui' }, alors: { bloc: { valeur: 1, raison: 'car la brique isole mieux que le parpaing ; le béton cellulaire est une autre option' } } },
      { si: { leger: 'oui' }, alors: { bloc: { valeur: 2, raison: 'léger et facile à couper ; vérifiez auprès du fabricant son usage en mur porteur' } } },
      { si: {}, alors: { bloc: { valeur: 0, raison: 'le bloc le plus courant et le moins cher' } } },
      { si: { usage: 'porteur' }, alors: { chainages: { valeur: 1, raison: 'car un mur porteur demande des chaînages, selon le DTU 20.1' } } },
    ],
  },

  plan: { nature: 'mur', saisie: true },

  champs: [
    {
      id: 'bloc',
      type: 'choix',
      label: 'Type de bloc',
      defaut: 0,
      options: [
        { valeur: 0, libelle: 'Parpaing 20 × 50 cm, joint de 1 cm' },
        { valeur: 1, libelle: 'Brique de construction 20 × 50 cm, joint mince collé' },
        { valeur: 2, libelle: 'Béton cellulaire 25 × 62,5 cm, joint mince collé' },
        { valeur: 3, libelle: 'Carreau de plâtre 50 × 66 cm, collé' },
        { valeur: 4, libelle: 'Autre format : dimensions ci-dessous' },
      ],
    },
    { id: 'hauteurBloc', label: 'Hauteur du bloc, format autre', unite: 'cm', min: 1, defaut: 20 },
    { id: 'longueurBloc', label: 'Longueur du bloc, format autre', unite: 'cm', min: 1, defaut: 50 },
    { id: 'jointAutre', label: 'Épaisseur du joint, format autre', unite: 'mm', min: 0, max: 30, defaut: 10 },
    { id: 'longueur', saisie: true, label: 'Longueur du mur', unite: 'm', requis: true, min: 0.1, defaut: 10 },
    { id: 'hauteur', saisie: true, label: 'Hauteur du mur', unite: 'm', requis: true, min: 0.1, defaut: 2.5 },
    { id: 'ouvertures', saisie: true, label: 'Surface des portes et fenêtres', unite: 'm²', min: 0, defaut: 2 },
    { id: 'angles', label: 'Nombre d’angles du mur', min: 0, defaut: 0, aide: 'Chaque angle demande un bloc d’angle par rang.' },
    { id: 'marge', label: 'Marge pour la casse et les coupes', unite: '%', min: 0, max: 30, defaut: 5 },
    { id: 'mortier', label: 'Mortier ou colle', unite: 'kg par m²', min: 0, defaut: 20, aide: 'Selon le fabricant : environ 20 à 25 kg par m² pour un parpaing monté au mortier, quelques kg en joint mince collé.' },
    { id: 'poidsSac', label: 'Poids d’un sac de mortier ou de colle', unite: 'kg', min: 1, defaut: 25 },
    { id: 'chainages', type: 'case', label: 'Prévoir les chaînages', defaut: false, aide: 'Chaînage horizontal en haut du mur et chaînage vertical à chaque angle, en armatures préfabriquées.' },
    { id: 'longueurChainage', avance: true, label: 'Longueur d’une armature de chaînage', unite: 'm', min: 1, defaut: 6 },
    { id: 'sectionChainage', avance: true, label: 'Section de béton d’un chaînage', unite: 'cm²', min: 50, defaut: 300, aide: '15 × 20 cm = 300 cm² ; selon le bloc de chaînage utilisé.' },
    { id: 'hauteurHydrofuge', label: 'Hauteur à enduire en hydrofuge', unite: 'm', min: 0, defaut: 0, aide: 'Partie enterrée ou soubassement exposé aux remontées d’humidité ; 0 si aucun.' },
    { id: 'consommationHydrofuge', avance: true, label: 'Enduit hydrofuge par m²', unite: 'kg', min: 0, defaut: 20, aide: 'Selon l’épaisseur : environ 1,5 à 2 kg par m² et par mm.' },
    { id: 'prixBloc', label: 'Prix d’un bloc', unite: '€', min: 0 },
    { id: 'prixSac', label: 'Prix d’un sac de mortier ou de colle', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'blocs', label: 'Blocs courants', format: 'nombre', principal: true },
    { id: 'blocsAngle', label: 'Blocs d’angle', format: 'nombre' },
    { id: 'blocsM2', label: 'Blocs au m²', format: 'nombre' },
    { id: 'rangs', label: 'Rangs', format: 'nombre' },
    { id: 'surface', label: 'Surface de mur', format: 'nombre', unite: 'm²' },
    { id: 'sacs', equivalent: { champ: 'poidsSac', unite: 'kg' }, label: 'Sacs de mortier ou de colle', format: 'nombre' },
    { id: 'armaturesChainage', label: 'Armatures de chaînage', format: 'nombre' },
    { id: 'betonChainage', label: 'Béton de chaînage', format: 'nombre', unite: 'm³' },
    { id: 'sacsHydrofuge', equivalent: { champ: 'poidsSac', unite: 'kg' }, label: 'Sacs d’enduit hydrofuge', format: 'nombre' },
  ],

  calculer(v, plan) {
    // Dessin : face du mur vue de face (longueur et hauteur hors tout, ouvertures dessinées).
    const longueur = plan ? plan.longueur : v.longueur;
    const hauteur = plan ? plan.hauteur : v.hauteur;
    // Formats en cm : hauteur, longueur, joint (mm).
    const formats = [[20, 50, 10], [20, 50, 1], [25, 62.5, 2], [50, 66, 0], [v.hauteurBloc, v.longueurBloc, v.jointAutre]];
    const [hauteurBloc, longueurBloc, joint] = formats[v.bloc] ?? formats[0];
    const pasHauteur = hauteurBloc + joint / 10;
    const pasLongueur = longueurBloc + joint / 10;
    const blocsM2 = 10000 / (pasHauteur * pasLongueur);
    const surface = plan ? plan.surface : Math.max(0, longueur * hauteur - v.ouvertures);
    const rangs = Math.ceil((hauteur * 100) / pasHauteur - 1e-9);
    const blocsAngle = v.angles * rangs;
    return {
      surface,
      blocsM2,
      rangs,
      blocsAngle,
      blocs: Math.max(0, Math.ceil(surface * blocsM2 * (1 + v.marge / 100) - blocsAngle - 1e-9)),
      sacs: v.mortier > 0 ? Math.ceil((surface * v.mortier) / v.poidsSac - 1e-9) : 0,
      // Chaînages : un horizontal sur toute la longueur, un vertical par angle ; recouvrements de 10 %.
      armaturesChainage: v.chainages ? Math.ceil(((longueur + v.angles * hauteur) * 1.1) / v.longueurChainage - 1e-9) : 0,
      betonChainage: v.chainages ? Math.round((longueur + v.angles * hauteur) * (v.sectionChainage / 10000) * 1000) / 1000 : 0,
      sacsHydrofuge: v.hauteurHydrofuge > 0 ? Math.ceil((longueur * v.hauteurHydrofuge * v.consommationHydrofuge) / v.poidsSac - 1e-9) : 0,
    };
  },

  devis: [
    { resultat: 'blocs', designation: 'Blocs de maçonnerie', unite: 'bloc', prixChamp: 'prixBloc', detail: '{surface} m² de mur, {blocsM2} blocs au m²' },
    { resultat: 'blocsAngle', designation: 'Blocs d’angle', unite: 'bloc', detail: '{angles} angle(s) sur {rangs} rangs' },
    { resultat: 'sacs', designation: 'Mortier ou colle de montage', unite: 'sac', prixChamp: 'prixSac', complement: true, detail: '{mortier} kg par m², sacs de {poidsSac} kg' },
    { resultat: 'armaturesChainage', designation: 'Armatures de chaînage', unite: 'armature', complement: true, detail: 'Chaînage horizontal et {angles} chaînage(s) vertical(aux)' },
    { resultat: 'betonChainage', designation: 'Béton de chaînage', unite: 'm³', complement: true },
    { resultat: 'sacsHydrofuge', designation: 'Enduit hydrofuge', unite: 'sac', detail: '{longueur} m sur {hauteurHydrofuge} m de haut' },
  ],

  explication: `
        <p>Blocs au m² = 1 ÷ ((hauteur du bloc + joint) × (longueur du bloc + joint)). Un parpaing de 20 × 50 cm avec un joint de 1 cm donne environ 9,3 blocs au m² ; sans joint, 10.</p>
        <p>Surface = longueur × hauteur − ouvertures. Les blocs d’angle remplacent les blocs courants aux angles, à raison d’un par rang et par angle.</p>`,

  erreurs: [
    'Oublier les blocs d’angle, les chaînages et les blocs spéciaux (linteaux, poteaux) dans la commande.',
    'Confondre mortier traditionnel et mortier-colle : les blocs rectifiés se montent au joint mince, avec une consommation bien plus faible.',
    'Démarrer sans arase de niveau : un premier rang mal réglé se répercute sur toute la hauteur du mur.',
    'Monter un mur porteur sans fondation ni chaînages adaptés.',
  ],

  conseils: [
    'Posez le premier rang sur un lit de mortier parfaitement de niveau, puis contrôlez l’aplomb à chaque rang.',
    'Croisez les joints verticaux d’un rang à l’autre.',
    'Protégez le haut du mur de la pluie à la fin de la journée.',
    'Par temps chaud, humidifiez les blocs si le fabricant le recommande ; ne maçonnez pas par temps de gel.',
  ],

  normes: [
    {
      titre: 'NF DTU 20.1',
      url: 'https://www.batirama.com/article/2217-nf-dtu-20.1-monter-des-murs-en-maconnerie-de-petits-elements.html',
      description: 'ouvrages en maçonnerie de petits éléments : parois et murs',
    },
  ],

  lies: ['calcul-beton', 'linteaux', 'enduit-facade', 'drainage-peripherique'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Faut-il déduire les ouvertures ?',
      reponse: 'Oui pour les grandes ouvertures. Pour de petites fenêtres, beaucoup de maçons ne les déduisent qu’à moitié, pour couvrir les coupes autour.',
    },
  ],

  exemples: [
    {
      entrees: { bloc: 3, hauteurBloc: 20, longueurBloc: 50, jointAutre: 10, longueur: 4, hauteur: 2.5, ouvertures: 0, angles: 0, marge: 0, mortier: 0, poidsSac: 25, chainages: 0, longueurChainage: 6, sectionChainage: 300, hauteurHydrofuge: 0, consommationHydrofuge: 20, prixBloc: 0, prixSac: 0 },
      attendu: { surface: 10, blocsM2: 3.0303, rangs: 5, blocs: 31, blocsAngle: 0 },
    },
    {
      entrees: { bloc: 0, hauteurBloc: 20, longueurBloc: 50, jointAutre: 10, longueur: 10, hauteur: 2.5, ouvertures: 2, angles: 2, marge: 5, mortier: 20, poidsSac: 25, chainages: 1, longueurChainage: 6, sectionChainage: 300, hauteurHydrofuge: 0.5, consommationHydrofuge: 20, prixBloc: 0, prixSac: 0 },
      attendu: { surface: 23, blocsM2: 9.3371, rangs: 12, blocsAngle: 24, blocs: 202, sacs: 19, armaturesChainage: 3, betonChainage: 0.45, sacsHydrofuge: 4 },
    },
  ],
};
