// Calculateur : escalier droit, formule de Blondel.
export default {
  slug: 'calcul-escalier',
  titre: 'Calcul d’un escalier : formule de Blondel',
  rubrique: 'Escalier',
  lot: 'gros-oeuvre',
  ordre: 5,
  teinte: 'grosoeuvre',
  description: 'Calculez le nombre de marches, la hauteur, le giron et la longueur au sol d’un escalier droit, avec la formule de Blondel.',
  intro: 'Indiquez la hauteur à monter, du sol fini au sol fini : le calcul répartit les marches et vérifie le confort avec la formule de Blondel.',
  categorie: 'UtilitiesApplication',
  avertissement: 'ce calculateur donne un pré-dimensionnement de confort. L’échappée (hauteur libre au-dessus des marches), la largeur, les garde-corps et, dans les établissements recevant du public, les règles d’accessibilité s’ajoutent : faites valider le projet par un professionnel.',

  champs: [
    { id: 'hauteur', label: 'Hauteur à monter, sol fini à sol fini', unite: 'cm', requis: true, min: 30, max: 600, defaut: 270 },
    { id: 'hauteurCible', label: 'Hauteur de marche visée', unite: 'cm', min: 14, max: 21, defaut: 17.5, aide: 'Confort usuel : 16 à 18 cm.' },
    { id: 'blondel', avance: true, label: 'Valeur de Blondel visée', unite: 'cm', min: 58, max: 66, defaut: 63, aide: '2 × hauteur + giron, entre 60 et 64 cm pour un pas confortable.' },
  ],

  resultats: [
    { id: 'contremarches', label: 'Contremarches (hauteurs)', format: 'nombre', principal: true },
    { id: 'marches', label: 'Marches (girons), arrivée sur le palier', format: 'nombre' },
    { id: 'hauteurMarche', label: 'Hauteur d’une marche', format: 'nombre', unite: 'cm' },
    { id: 'giron', label: 'Giron (profondeur de pas)', format: 'nombre', unite: 'cm' },
    { id: 'reculement', label: 'Longueur au sol (reculement)', format: 'nombre', unite: 'cm' },
    { id: 'valeurBlondel', label: '2 × hauteur + giron', format: 'nombre', unite: 'cm' },
    { id: 'angle', label: 'Inclinaison', format: 'nombre', unite: '°' },
    { id: 'confort', label: 'Confort', format: 'texte' },
  ],

  calculer(v) {
    const contremarches = Math.max(1, Math.round(v.hauteur / v.hauteurCible));
    const hauteurMarche = v.hauteur / contremarches;
    const giron = v.blondel - 2 * hauteurMarche;
    if (giron <= 0) return { erreur: 'La hauteur de marche est trop grande pour la valeur de Blondel visée.' };
    const marches = contremarches - 1;
    const valeurBlondel = 2 * hauteurMarche + giron;
    const confortable = hauteurMarche >= 16 && hauteurMarche <= 18 && valeurBlondel >= 60 && valeurBlondel <= 64;
    return {
      contremarches,
      marches,
      hauteurMarche: Math.round(hauteurMarche * 10) / 10,
      giron: Math.round(giron * 10) / 10,
      reculement: Math.round(marches * giron),
      valeurBlondel: Math.round(valeurBlondel * 10) / 10,
      angle: Math.round((Math.atan(hauteurMarche / giron) * 180) / Math.PI * 10) / 10,
      confort: confortable
        ? 'dans les valeurs de confort usuelles'
        : 'hors des valeurs de confort usuelles (hauteur 16 à 18 cm, Blondel 60 à 64 cm)',
    };
  },

  explication: `
        <p>Nombre de contremarches = hauteur à monter ÷ hauteur visée, arrondi. Hauteur réelle = hauteur à monter ÷ nombre de contremarches. La formule de Blondel, règle de confort classique, relie la hauteur h et le giron g d’une marche : 2h + g doit être compris entre 60 et 64 cm, longueur d’un pas.</p>
        <p>Pour 2,70 m à monter : 15 contremarches de 18 cm, un giron de 27 cm (2 × 18 + 27 = 63) et 14 marches, soit 3,78 m au sol.</p>`,

  erreurs: [
    'Mesurer la hauteur à monter sans les revêtements de sol finis, en bas comme en haut : la première ou la dernière marche devient irrégulière.',
    'Négliger l’échappée : la hauteur libre au-dessus des marches doit permettre de passer sans se cogner.',
    'Faire des marches de hauteurs différentes : c’est une cause fréquente de chute.',
    'Oublier le garde-corps et la main courante.',
  ],

  conseils: [
    'Vérifiez le confort avec la formule de Blondel : deux hauteurs de marche plus un giron.',
    'Dimensionnez la trémie dès la conception : sa longueur conditionne l’échappée.',
    'Pour un escalier tournant, contrôlez le giron sur la ligne de foulée.',
    'Faites valider la structure et le garde-corps par un professionnel.',
  ],

  normes: [
    {
      titre: 'NF DTU 36.3',
      url: 'https://www.ffbatiment.fr/techniques-batiment/amenagement-finitions/menuiseries-interieures/calepin/escalier-bois-essentiel-nf-dtu-36-3',
      description: 'escaliers en bois et garde-corps associés',
    },
  ],

  lies: ['plancher-bois', 'calcul-beton', 'conversion-pente'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Pourquoi une marche de moins que de contremarches ?',
      reponse: 'La dernière hauteur arrive sur le palier ou le plancher d’étage, qui sert de dernière marche : un escalier droit compte une marche de moins que de contremarches.',
    },
  ],

  exemples: [
    {
      entrees: { hauteur: 270, hauteurCible: 17.5, blondel: 63 },
      attendu: { contremarches: 15, marches: 14, hauteurMarche: 18, giron: 27, reculement: 378, valeurBlondel: 63, angle: 33.7, confort: 'dans les valeurs de confort usuelles' },
    },
    {
      entrees: { hauteur: 300, hauteurCible: 20, blondel: 63 },
      attendu: { contremarches: 15, hauteurMarche: 20, giron: 23, confort: 'hors des valeurs de confort usuelles (hauteur 16 à 18 cm, Blondel 60 à 64 cm)' },
    },
  ],
};
