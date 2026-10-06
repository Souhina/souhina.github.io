// Outil : configurateur d'escalier (moteur/escalier/). Plan, coupe et perspective en SVG,
// points à vérifier et nomenclature indicative. Ce n'est pas un plan d'exécution.
export default {
  slug: 'configurateur-escalier',
  outil: 'escalier',
  titre: 'Configurateur d’escalier : plan, coupe et perspective',
  rubrique: 'Escalier',
  lot: 'gros-oeuvre',
  ordre: 9,
  teinte: 'grosoeuvre',
  description: 'Dessinez votre escalier droit ou quart tournant : plan coté, coupe avec l’échappée, perspective sous plusieurs angles, points à vérifier et nomenclature des pièces.',
  intro: 'Choisissez la forme, la hauteur à franchir et la largeur : l’outil répartit les marches, dessine le plan, la coupe et la perspective, et vérifie l’échappée sous la trémie.',
  avertissement: 'cet outil aide à concevoir et à visualiser un escalier ; ce n’est pas un plan d’exécution. Les sections des limons et des marches, les fixations, le garde-corps et la trémie se font valider par un menuisier, un métallier ou un bureau d’études.',
  explication: `
        <p>Le nombre de hauteurs (contremarches) est la hauteur à franchir divisée par la hauteur de marche visée, arrondie. Le giron se déduit de la formule de Blondel : 2 h + g, réglée à 63 cm par défaut, la longueur moyenne d’un pas. Un escalier droit compte une marche de moins que de hauteurs, car la dernière hauteur arrive sur le plancher.</p>
        <p>Sur un quart tournant avec palier, le palier remplace une marche à l’endroit du virage : il est carré, de la largeur de l’escalier. Les marches restent toutes identiques, sans marches balancées.</p>
        <p>L’échappée est contrôlée tous les 2 cm le long de la ligne de marche, au milieu de l’emmarchement : c’est la hauteur libre entre la marche et la sous-face du plancher haut. La longueur de trémie conseillée est la plus courte qui garde l’échappée visée partout ; sur un quart tournant, la trémie passe parfois au-dessus du palier et d’une partie de la première volée, en L.</p>
        <p>La perspective est calculée à partir des mêmes pièces que le plan et la coupe : chaque face est projetée puis dessinée de la plus éloignée à la plus proche. Le lien de partage contient tous vos réglages, dans l’adresse de la page, sans rien enregistrer sur un serveur.</p>`,
  erreurs: [
    'Mesurer la hauteur à franchir sans les revêtements de sol finis, en bas comme en haut.',
    'Prévoir une trémie trop courte : l’échappée devient insuffisante dans le haut de l’escalier.',
    'Oublier le garde-corps du côté du vide et autour de la trémie.',
    'Considérer la nomenclature comme un dimensionnement : les sections saisies sont des hypothèses à faire valider.',
  ],
  conseils: [
    'Commencez par la hauteur exacte et l’emplacement de la trémie : ce sont eux qui fixent l’encombrement.',
    'Comparez plusieurs hauteurs de marche visées : une demi-hauteur de plus ou de moins change le reculement de plusieurs dizaines de centimètres.',
    'Imprimez le plan et la coupe, et tracez l’escalier au sol à l’échelle 1 avant de commander.',
    'Envoyez le lien de partage au menuisier : il retrouve exactement votre configuration.',
  ],
  normes: [
    { titre: 'NF DTU 36.3', url: 'https://www.ffbatiment.fr/techniques-batiment/amenagement-finitions/menuiseries-interieures/calepin/escalier-bois-essentiel-nf-dtu-36-3', description: 'escaliers en bois et garde-corps associés' },
    { titre: 'NF P01-012', description: 'dimensions des garde-corps (version révisée en novembre 2024)' },
  ],
  lies: ['calcul-escalier', 'plancher-bois', 'conversion-pente'],
  majLe: '2026-10-06',
  faq: [
    {
      question: 'Le configurateur remplace-t-il un plan de menuisier ?',
      reponse: 'Non. Il aide à choisir la forme, à vérifier l’encombrement et l’échappée, et à préparer la discussion avec le fabricant. Les sections, les assemblages, les fixations et le garde-corps relèvent du menuisier, du métallier ou d’un bureau d’études.',
    },
    {
      question: 'Pourquoi la trémie conseillée est-elle si longue ?',
      reponse: 'Pour garder l’échappée visée, 1,90 m par défaut, au-dessus de chaque marche qui reste sous le plancher. Plus le plancher est épais ou l’escalier raide, plus la trémie doit être longue. Vous pouvez saisir votre propre longueur : le contrôle d’échappée se met à jour.',
    },
    {
      question: 'Quand arrivent les quarts tournants balancés et le colimaçon ?',
      reponse: 'Ils sont prévus dans une prochaine version : le balancement des marches et les formes hélicoïdales demandent un calcul plus fin, sur la ligne de foulée.',
    },
    {
      question: 'Mes réglages sont-ils enregistrés ?',
      reponse: 'Ils sont dans l’adresse de la page, après le signe #e=. Copiez le lien pour retrouver ou partager votre projet ; rien n’est envoyé sur un serveur.',
    },
  ],
};
