// Calculateur : capacité d'un ballon d'eau chaude selon le foyer.
export default {
  slug: 'ballon-eau-chaude',
  titre: 'Calcul de la capacité d’un ballon d’eau chaude',
  rubrique: 'Ballon d’eau chaude',
  lot: 'plomberie',
  ordre: 4,
  teinte: 'chauffage',
  description: 'Estimez le besoin d’eau chaude de votre foyer et la capacité de ballon (chauffe-eau à accumulation) qui y répond, baignoire comprise.',
  intro: 'Le besoin quotidien du foyer, exprimé en eau à 40 °C, est converti en capacité de ballon avec le volume d’eau mitigée qu’il fournit (V40).',
  categorie: 'UtilitiesApplication',
  avertissement: 'ce calcul donne un ordre de grandeur. Le V40 réel figure sur la fiche technique de chaque ballon ; un chauffe-eau thermodynamique ou solaire se dimensionne avec l’installateur.',

  champs: [
    { id: 'personnes', label: 'Personnes dans le foyer', requis: true, min: 1, max: 12, defaut: 4 },
    { id: 'baignoire', type: 'case', label: 'Des bains sont pris régulièrement', defaut: false, aide: 'Une baignoire demande environ 50 litres de capacité en plus.' },
    { id: 'coefficientV40', avance: true, label: 'Eau à 40 °C fournie par litre de ballon (V40)', min: 1, max: 2.5, defaut: 1.8, aide: 'Environ 1,8 pour un ballon chauffé vers 60 °C ; la valeur exacte est sur la fiche du ballon.' },
    { id: 'marge', avance: true, label: 'Marge pour les pointes de consommation', unite: '%', min: 0, max: 100, defaut: 50 },
  ],

  resultats: [
    { id: 'capaciteConseillee', label: 'Capacité de ballon conseillée', format: 'nombre', unite: 'L', principal: true },
    { id: 'besoin40', label: 'Besoin quotidien du foyer, à 40 °C', format: 'nombre', unite: 'L' },
    { id: 'capaciteMinimale', label: 'Capacité minimale, sans marge', format: 'nombre', unite: 'L' },
  ],

  calculer(v) {
    // Besoins quotidiens à 40 °C par foyer (guide technique de l'ADEME, analyse COSTIC) : 1 à 5 personnes ;
    // au-delà, 50 litres par personne supplémentaire (prolongement de la dernière tranche, à vérifier).
    const besoins = [80, 120, 150, 170, 220];
    const personnes = Math.round(v.personnes);
    const besoin40 = personnes <= 5 ? besoins[personnes - 1] : 220 + (personnes - 5) * 50;
    const capaciteMinimale = besoin40 / v.coefficientV40 + (v.baignoire ? 50 : 0);
    const visee = capaciteMinimale * (1 + v.marge / 100);
    // Capacités courantes des ballons du commerce.
    const tailles = [50, 75, 100, 150, 200, 250, 300, 400, 500];
    const capaciteConseillee = tailles.find((taille) => taille >= visee - 1e-9) ?? Math.ceil(visee / 50) * 50;
    return { besoin40, capaciteMinimale: Math.round(capaciteMinimale), capaciteConseillee };
  },

  explication: `
        <p>Le guide technique de l’ADEME sur les besoins d’eau chaude sanitaire retient, par foyer et par jour, environ 80 litres d’eau à 40 °C pour une personne, 120 pour deux, 150 pour trois, 170 pour quatre et 220 pour cinq. Un ballon chauffé vers 60 °C fournit environ 1,8 litre d’eau à 40 °C par litre de capacité (V40).</p>
        <p>Capacité conseillée = besoin ÷ 1,8, plus 50 litres pour les bains, plus la marge pour les pointes, arrondie à la taille du commerce supérieure. Pour quatre personnes : 170 ÷ 1,8 = 94 litres, 141 avec la marge, soit un ballon de 150 litres.</p>`,

  erreurs: [
    'Choisir le volume au nombre de chambres plutôt qu’au nombre d’occupants et à leurs habitudes (bains ou douches).',
    'Comparer les ballons à leur contenance au lieu de leur V40, la quantité d’eau à 40 °C réellement disponible.',
    'Oublier le groupe de sécurité et son raccordement à l’évacuation.',
    'Ignorer le poids du ballon plein : une cloison légère ne le supporte pas toujours.',
  ],

  conseils: [
    'Arrondissez au modèle supérieur disponible.',
    'Placez le ballon près des points de puisage les plus utilisés pour limiter l’attente d’eau chaude.',
    'Programmez la chauffe en heures creuses si votre contrat le permet.',
  ],

  lies: ['reseau-plomberie', 'puissance-chauffage'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Pourquoi pas simplement 50 litres par personne ?',
      reponse: 'C’est la règle d’usage, mais elle surdimensionne souvent : un ballon trop grand chauffe et perd de l’énergie pour rien. Le calcul part des besoins mesurés par foyer, puis ajoute une marge réglable.',
    },
  ],

  normes: [
    {
      titre: 'ADEME, Les besoins d’eau chaude sanitaire en habitat individuel et collectif',
      description: 'guide technique, besoins journaliers mesurés par foyer (analyse COSTIC)',
    },
  ],

  exemples: [
    {
      entrees: { personnes: 4, baignoire: 0, coefficientV40: 1.8, marge: 50 },
      attendu: { besoin40: 170, capaciteMinimale: 94, capaciteConseillee: 150 },
    },
    {
      entrees: { personnes: 1, baignoire: 0, coefficientV40: 1.8, marge: 50 },
      attendu: { besoin40: 80, capaciteConseillee: 75 },
    },
    {
      // 5 personnes avec bains : 220 ÷ 1,8 + 50 = 172 L, 258 avec la marge → 300 L.
      entrees: { personnes: 5, baignoire: 1, coefficientV40: 1.8, marge: 50 },
      attendu: { besoin40: 220, capaciteMinimale: 172, capaciteConseillee: 300 },
    },
  ],
};
