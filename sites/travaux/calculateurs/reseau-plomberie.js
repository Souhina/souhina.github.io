// Calculateur : réseau de plomberie, estimé par point d'eau (quantités seules).
export default {
  slug: 'reseau-plomberie',
  titre: 'Calcul d’un réseau de plomberie par point d’eau',
  rubrique: 'Réseau de plomberie',
  lot: 'plomberie',
  ordre: 1,
  teinte: 'plomberie',
  description: 'Estimez les couronnes de tube PER ou multicouche, les sorties de nourrice, les tubes PVC d’évacuation et les raccords à partir du nombre de points d’eau.',
  intro: 'Comptez vos appareils : chaque point reçoit l’eau froide, l’eau chaude s’il en a besoin, et une évacuation.',
  categorie: 'UtilitiesApplication',
  avertissement: 'ce calculateur donne une estimation de quantités. Le diamètre des tubes, la pente des évacuations (en général 1 à 3 cm par mètre) et la ventilation du réseau suivent les DTU 60.1, 60.11 et 60.33 : faites valider l’installation par un plombier.',

  groupes: {
    'Les points d’eau': 'Nombre d’appareils à raccorder.',
    'Les distances': 'Longueurs moyennes, de la nourrice au point d’eau et du point d’eau à la chute d’évacuation.',
  },

  champs: [
    { id: 'lavabos', groupe: 'Les points d’eau', label: 'Lavabos et vasques', min: 0, max: 50, defaut: 1 },
    { id: 'eviers', groupe: 'Les points d’eau', label: 'Éviers', min: 0, max: 20, defaut: 1 },
    { id: 'douches', groupe: 'Les points d’eau', label: 'Douches', min: 0, max: 20, defaut: 1 },
    { id: 'baignoires', groupe: 'Les points d’eau', label: 'Baignoires', min: 0, max: 20, defaut: 0 },
    { id: 'wc', groupe: 'Les points d’eau', label: 'WC', min: 0, max: 20, defaut: 1 },
    { id: 'laveLinge', groupe: 'Les points d’eau', label: 'Lave-linge', min: 0, max: 10, defaut: 1 },
    { id: 'laveVaisselle', groupe: 'Les points d’eau', label: 'Lave-vaisselle', min: 0, max: 10, defaut: 1 },
    { id: 'distanceAlimentation', groupe: 'Les distances', label: 'Distance moyenne nourrice – point d’eau', unite: 'm', requis: true, min: 0.5, max: 50, defaut: 6 },
    { id: 'distanceEvacuation', groupe: 'Les distances', label: 'Distance moyenne point d’eau – chute', unite: 'm', requis: true, min: 0.5, max: 50, defaut: 4 },
    { id: 'longueurCouronne', avance: true, label: 'Longueur d’une couronne de tube', unite: 'm', min: 5, defaut: 50 },
    { id: 'longueurBarre', avance: true, label: 'Longueur d’une barre de PVC', unite: 'm', min: 1, defaut: 4 },
    { id: 'prixCouronne', label: 'Prix d’une couronne', unite: '€', min: 0 },
    { id: 'prixBarre100', label: 'Prix d’une barre de PVC Ø 100', unite: '€', min: 0 },
    { id: 'prixBarre40', label: 'Prix d’une barre de PVC Ø 40', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'tube', label: 'Tube d’alimentation', format: 'nombre', unite: 'm', principal: true },
    { id: 'couronnes', label: 'Couronnes de tube', format: 'nombre' },
    { id: 'sortiesEauFroide', label: 'Sorties de nourrice, eau froide', format: 'nombre' },
    { id: 'sortiesEauChaude', label: 'Sorties de nourrice, eau chaude', format: 'nombre' },
    { id: 'barres100', label: 'Barres de PVC Ø 100 (WC)', format: 'nombre' },
    { id: 'barres40', label: 'Barres de PVC Ø 40 (autres appareils)', format: 'nombre' },
    { id: 'raccordsAlimentation', label: 'Raccords d’alimentation', format: 'nombre' },
    { id: 'raccordsEvacuation', label: 'Coudes et raccords PVC', format: 'nombre' },
  ],

  calculer(v) {
    const eauFroide = v.lavabos + v.eviers + v.douches + v.baignoires + v.wc + v.laveLinge + v.laveVaisselle;
    const eauChaude = v.lavabos + v.eviers + v.douches + v.baignoires;
    const evacuations40 = eauFroide - v.wc;
    const tube = Math.ceil((eauFroide + eauChaude) * v.distanceAlimentation * 1.1 - 1e-9);
    return {
      tube,
      couronnes: Math.ceil(tube / v.longueurCouronne - 1e-9),
      sortiesEauFroide: eauFroide,
      sortiesEauChaude: eauChaude,
      barres100: Math.ceil((v.wc * v.distanceEvacuation * 1.1) / v.longueurBarre - 1e-9),
      barres40: Math.ceil((evacuations40 * v.distanceEvacuation * 1.1) / v.longueurBarre - 1e-9),
      // Environ 2 raccords par départ (nourrice et sortie de cloison), 3 pièces PVC par évacuation.
      raccordsAlimentation: 2 * (eauFroide + eauChaude),
      raccordsEvacuation: 3 * eauFroide,
    };
  },

  devis: [
    { resultat: 'couronnes', designation: 'Tube PER ou multicouche', unite: 'couronne', prixChamp: 'prixCouronne', detail: '{tube} m pour {sortiesEauFroide} départs d’eau froide et {sortiesEauChaude} d’eau chaude' },
    { resultat: 'barres100', designation: 'Tube PVC d’évacuation Ø 100', unite: 'barre', prixChamp: 'prixBarre100' },
    { resultat: 'barres40', designation: 'Tube PVC d’évacuation Ø 40', unite: 'barre', prixChamp: 'prixBarre40' },
    { resultat: 'raccordsAlimentation', designation: 'Raccords d’alimentation', unite: 'raccord', complement: true },
    { resultat: 'raccordsEvacuation', designation: 'Coudes et raccords PVC', unite: 'pièce', complement: true },
  ],

  explication: `
        <p>Tous les appareils reçoivent l’eau froide ; lavabos, éviers, douches et baignoires reçoivent aussi l’eau chaude. En distribution par nourrice, chaque départ est un tube continu : longueur = nombre de départs × distance moyenne, plus 10 %.</p>
        <p>Les WC s’évacuent en Ø 100, les autres appareils en Ø 32 à 40 selon le cas. Le nombre de raccords est une estimation à affiner sur plan.</p>
        <p>Repères courants pour l’alimentation en PER ou multicouche : un tube de 16 mm (diamètre extérieur) pour la plupart des points d’eau, 20 mm pour une baignoire, une douche à fort débit ou un chauffe-eau, et un diamètre plus gros (26 à 32 mm en multicouche) pour l’arrivée générale et la nourrice, selon le débit. Ces valeurs dépendent de la pression et des longueurs : faites-les valider par votre plombier.</p>
        <p>Évacuations : Ø 100 mm pour les WC, Ø 40 mm pour la douche, la baignoire, l’évier, le lave-linge et le lave-vaisselle, Ø 32 à 40 mm pour un lavabo. La pente reste comprise entre 1 et 3 cm par mètre : trop faible, l’eau stagne ; trop forte, l’eau part sans entraîner les matières. Chaque appareil a son siphon.</p>
        <p>La chute (le tuyau vertical où se rejoignent les évacuations) doit être ventilée, prolongée jusqu’en toiture ou, selon les cas prévus par le DTU, équipée d’un clapet aérateur. Sans ventilation, les siphons se vident et les odeurs remontent.</p>`,

  erreurs: [
    'Mélanger les raccords et les tubes de systèmes différents.',
    'Oublier les fourreaux pour le PER encastré.',
    'Donner trop peu de pente aux évacuations.',
    'Oublier la ventilation de la chute.',
  ],

  conseils: [
    'Comptez les longueurs depuis la nourrice jusqu’à chaque point d’eau.',
    'Repérez l’eau chaude et l’eau froide par une couleur différente.',
    'Faites un essai de pression avant de refermer les cloisons.',
  ],

  normes: [
    {
      titre: 'NF DTU 60.11',
      url: 'https://progineer.fr/workspace/regulation/dtu-60-11/',
      description: 'règles de calcul des installations de plomberie sanitaire et d’eaux pluviales',
    },
  ],

  lies: ['ballon-eau-chaude', 'conversion-pente', 'carrelage-mural'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'PER ou multicouche ?',
      reponse: 'Le PER se pose facilement en gaine dans les murs et les sols ; le multicouche, plus rigide, garde sa forme et convient bien aux parties apparentes. Les deux se raccordent par sertissage ou à glissement.',
    },
    {
      question: 'Quel diamètre de tube pour l’alimentation ?',
      reponse: 'En repère courant, 16 mm pour la plupart des points d’eau, 20 mm pour une baignoire ou un chauffe-eau, et 26 à 32 mm en multicouche pour l’arrivée générale et la nourrice. La longueur du réseau et la pression disponible peuvent changer ce choix : demandez l’avis d’un plombier.',
    },
    {
      question: 'Quelle pente pour les évacuations ?',
      reponse: 'Entre 1 et 3 cm par mètre, de façon régulière. En dessous, l’eau stagne et les dépôts bouchent le tuyau ; au-dessus, l’eau s’écoule trop vite et laisse les matières sur place.',
    },
    {
      question: 'Distribution par nourrice ou en série ?',
      reponse: 'Avec une nourrice, chaque point d’eau a son tube continu, sans raccord caché dans les murs, et peut être coupé séparément. La distribution en série (en « pieuvre » ou en ligne) demande moins de tube mais des raccords encastrés et des pertes de débit quand plusieurs robinets coulent.',
    },
  ],

  exemples: [
    {
      entrees: { lavabos: 1, eviers: 1, douches: 1, baignoires: 0, wc: 1, laveLinge: 1, laveVaisselle: 1, distanceAlimentation: 6, distanceEvacuation: 4, longueurCouronne: 50, longueurBarre: 4, prixCouronne: 0, prixBarre100: 0, prixBarre40: 0 },
      attendu: { tube: 60, couronnes: 2, sortiesEauFroide: 6, sortiesEauChaude: 3, barres100: 2, barres40: 6, raccordsAlimentation: 18, raccordsEvacuation: 18 },
    },
  ],
};
