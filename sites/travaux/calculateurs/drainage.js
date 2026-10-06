// Calculateur : drainage périphérique des fondations (drain, membrane, géotextile, gravier, regards).
export default {
  slug: 'drainage-peripherique',
  titre: 'Calcul d’un drainage périphérique',
  rubrique: 'Drainage périphérique',
  lot: 'gros-oeuvre',
  ordre: 4,
  teinte: 'grosoeuvre',
  description: 'Calculez le drain, la membrane de protection, le géotextile, le gravier et les regards d’un drainage autour des fondations.',
  intro: 'Indiquez la longueur de mur enterré, sa hauteur et le nombre d’angles : un regard de visite se place à chaque changement de direction.',
  categorie: 'UtilitiesApplication',
  avertissement: 'ce calculateur estime des quantités. Le drain doit avoir une pente régulière vers un exutoire autorisé, à distance des fondations ; la conception d’un drainage suit le DTU 20.1 et, si le sol est argileux ou humide, une étude de sol.',

  champs: [
    { id: 'longueur', label: 'Longueur de mur enterré à drainer', unite: 'm', requis: true, min: 1, max: 500, defaut: 40 },
    { id: 'hauteur', label: 'Hauteur enterrée du mur', unite: 'm', requis: true, min: 0.2, max: 5, defaut: 1.5 },
    { id: 'angles', label: 'Nombre d’angles', min: 0, max: 30, defaut: 4 },
    { id: 'largeurTranchee', avance: true, label: 'Largeur du lit de gravier', unite: 'cm', min: 10, defaut: 40 },
    { id: 'epaisseurGravier', avance: true, label: 'Épaisseur du lit de gravier', unite: 'cm', min: 10, defaut: 30 },
    { id: 'longueurRouleauDrain', avance: true, label: 'Longueur d’un rouleau de drain', unite: 'm', min: 5, defaut: 50 },
    { id: 'surfaceMembrane', avance: true, label: 'Surface d’un rouleau de membrane', unite: 'm²', min: 1, defaut: 40 },
    { id: 'surfaceGeotextile', avance: true, label: 'Surface d’un rouleau de géotextile', unite: 'm²', min: 1, defaut: 50 },
    { id: 'prixRouleauDrain', label: 'Prix d’un rouleau de drain', unite: '€', min: 0 },
    { id: 'prixRouleauMembrane', label: 'Prix d’un rouleau de membrane', unite: '€', min: 0 },
    { id: 'prixTonneGravier', label: 'Prix d’une tonne de gravier', unite: '€', min: 0 },
    { id: 'prixRegard', label: 'Prix d’un regard', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'rouleauxDrain', label: 'Rouleaux de drain', format: 'nombre', principal: true },
    { id: 'rouleauxMembrane', label: 'Rouleaux de membrane à excroissances', format: 'nombre' },
    { id: 'rouleauxGeotextile', label: 'Rouleaux de géotextile', format: 'nombre' },
    { id: 'gravier', label: 'Gravier drainant', format: 'nombre', unite: 't' },
    { id: 'regards', label: 'Regards de visite', format: 'nombre' },
  ],

  calculer(v) {
    const largeur = v.largeurTranchee / 100;
    const epaisseur = v.epaisseurGravier / 100;
    // Le géotextile enveloppe le lit de gravier : son pourtour vaut deux largeurs et deux épaisseurs.
    const geotextile = v.longueur * (2 * largeur + 2 * epaisseur) * 1.1;
    return {
      rouleauxDrain: Math.ceil((v.longueur * 1.05) / v.longueurRouleauDrain - 1e-9),
      rouleauxMembrane: Math.ceil((v.longueur * v.hauteur * 1.1) / v.surfaceMembrane - 1e-9),
      rouleauxGeotextile: Math.ceil(geotextile / v.surfaceGeotextile - 1e-9),
      gravier: Math.round(v.longueur * largeur * epaisseur * 1.5 * 100) / 100,
      regards: Math.max(1, Math.round(v.angles)),
    };
  },

  devis: [
    { resultat: 'rouleauxDrain', designation: 'Drain agricole', unite: 'rouleau', prixChamp: 'prixRouleauDrain', detail: '{longueur} m de drain' },
    { resultat: 'rouleauxMembrane', designation: 'Membrane à excroissances', unite: 'rouleau', prixChamp: 'prixRouleauMembrane', detail: '{longueur} m sur {hauteur} m de haut' },
    { resultat: 'rouleauxGeotextile', designation: 'Géotextile', unite: 'rouleau', complement: true },
    { resultat: 'gravier', designation: 'Gravier drainant', unite: 't', prixChamp: 'prixTonneGravier', detail: 'Lit de {largeurTranchee} × {epaisseurGravier} cm' },
    { resultat: 'regards', designation: 'Regards de visite', unite: 'regard', prixChamp: 'prixRegard' },
  ],

  explication: `
        <p>Le drain court au pied des fondations, dans un lit de gravier enveloppé de géotextile, avec un regard à chaque angle. Une membrane à excroissances protège le mur enterré sur toute sa hauteur.</p>
        <p>Gravier (t) = longueur × largeur du lit × épaisseur × 1,5 : pour 40 m, un lit de 40 × 30 cm demande 4,8 m³, soit environ 7,2 t.</p>
        <p>Le drain se pose au pied des fondations, sans descendre sous le dessous des semelles pour ne pas affaiblir le sol qui les porte. Il garde une pente régulière vers l’exutoire, de l’ordre de 0,5 à 1 cm par mètre selon les guides courants (à vérifier avec le DTU 20.1 et la notice du drain).</p>
        <p>De bas en haut : le géotextile tapisse la tranchée, puis un lit de gravier lavé, le drain (souvent en Ø 100 mm, fentes vers le bas ou sur le côté selon le modèle), un nouveau lit de gravier, et le géotextile se referme par-dessus avant le remblai. La membrane à excroissances, plaquée contre le mur, laisse l’eau descendre jusqu’au drain.</p>
        <p>Un regard de visite à chaque angle permet de contrôler l’écoulement et de curer le drain. Avant de drainer, cherchez la cause de l’humidité : un défaut de gouttière ou une terrasse en contre-pente suffit parfois à mouiller un mur enterré.</p>`,

  erreurs: [
    'Poser le drain sans pente régulière vers l’exutoire.',
    'Poser le drain au-dessus du niveau des fondations.',
    'Oublier le géotextile : le drain se colmate avec la terre.',
    'Rejeter l’eau là où ce n’est pas autorisé.',
  ],

  conseils: [
    'Prévoyez des regards de visite aux changements de direction.',
    'Protégez le mur enterré avec une membrane à excroissances.',
    'Entourez le drain de gravier lavé, enveloppé dans un géotextile.',
    'Testez l’écoulement en versant de l’eau dans le regard le plus haut avant de remblayer.',
  ],

  normes: [
    {
      titre: 'NF DTU 20.1',
      url: 'https://www.batirama.com/article/2217-nf-dtu-20.1-monter-des-murs-en-maconnerie-de-petits-elements.html',
      description: 'ouvrages en maçonnerie de petits éléments, dispositions pour les murs enterrés',
    },
  ],

  lies: ['terrassement-deblai', 'gravier-remblai', 'gouttieres'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Où évacuer l’eau du drain ?',
      reponse: 'Vers un exutoire autorisé : puits perdu, fossé ou réseau d’eaux pluviales selon les règles de la commune. Jamais vers le réseau d’eaux usées.',
    },
    {
      question: 'Quelle pente donner au drain ?',
      reponse: 'Une pente régulière et continue vers l’exutoire, de l’ordre de 0,5 à 1 cm par mètre selon les guides courants. Sans pente, l’eau stagne et le drain se colmate ; vérifiez la valeur avec le DTU 20.1 et la notice du fabricant.',
    },
    {
      question: 'À quelle profondeur poser le drain ?',
      reponse: 'Au niveau du pied des fondations, sous le niveau du sol intérieur à protéger, mais sans descendre sous le dessous des semelles : creuser plus bas risquerait de décomprimer le sol qui porte la maison.',
    },
    {
      question: 'Quel gravier utiliser ?',
      reponse: 'Un gravier lavé, sans fines, de granulométrie moyenne (par exemple 10/20 ou 20/40 selon le fournisseur), enveloppé dans un géotextile qui empêche la terre de colmater le drain.',
    },
  ],

  exemples: [
    {
      entrees: { longueur: 40, hauteur: 1.5, angles: 4, largeurTranchee: 40, epaisseurGravier: 30, longueurRouleauDrain: 50, surfaceMembrane: 40, surfaceGeotextile: 50, prixRouleauDrain: 0, prixRouleauMembrane: 0, prixTonneGravier: 0, prixRegard: 0 },
      attendu: { rouleauxDrain: 1, rouleauxMembrane: 2, rouleauxGeotextile: 2, gravier: 7.2, regards: 4 },
    },
  ],
};
