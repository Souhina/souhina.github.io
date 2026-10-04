// Calculateur : puissance de chauffage indicative d'une pièce ou d'un logement.
export default {
  slug: 'puissance-chauffage',
  titre: 'Calcul de la puissance de chauffage nécessaire',
  rubrique: 'Puissance de chauffage',
  lot: 'plomberie',
  ordre: 2,
  teinte: 'chauffage',
  description: 'Estimez la puissance de chauffage d’une pièce ou d’un logement à partir du volume, du niveau d’isolation et de la température extérieure de base.',
  intro: 'Méthode simplifiée : volume chauffé × coefficient d’isolation × écart de température. Le résultat est un ordre de grandeur, pas un dimensionnement.',
  categorie: 'UtilitiesApplication',
  avertissement: 'ce résultat est indicatif. Seule une étude thermique (norme NF EN 12831), réalisée par un bureau d’études ou un installateur, permet de dimensionner une pompe à chaleur, une chaudière ou un réseau de radiateurs.',

  // Dimensions dessinées sur un plan (piece) ou saisies.
  // Aide au choix : questions fermées qui préremplissent les champs de type liste ou case.
  aideAuChoix: {
    questions: [
      { id: 'annee', question: 'Quand le logement a-t-il été construit ?', options: [{ valeur: 'apres2012', libelle: 'Après 2012' }, { valeur: 'de2000a2012', libelle: 'Entre 2000 et 2012' }, { valeur: 'de1975a2000', libelle: 'Entre 1975 et 2000' }, { valeur: 'avant1975', libelle: 'Avant 1975' }] },
      { id: 'travaux', question: 'L’isolation a-t-elle été refaite ?', options: [{ valeur: 'complete', libelle: 'Oui : combles, murs et fenêtres' }, { valeur: 'partielle', libelle: 'En partie' }, { valeur: 'aucune', libelle: 'Non' }] },
      { id: 'vitrage', question: 'Les fenêtres sont-elles toutes en double vitrage ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
    ],
    regles: [
      { si: { travaux: 'complete' }, alors: { isolation: { valeur: 0.75, raison: 'car l’isolation a été refaite' } } },
      { si: { annee: 'apres2012' }, alors: { isolation: { valeur: 0.75, raison: 'pour une construction récente' } } },
      { si: { annee: 'de2000a2012' }, alors: { isolation: { valeur: 1, raison: '' } } },
      { si: { annee: 'avant1975', travaux: 'aucune' }, alors: { isolation: { valeur: 1.6, raison: 'car le logement est ancien et n’a pas été isolé' } } },
      { si: { vitrage: 'non' }, alors: { isolation: { valeur: 1.3, raison: 'car une partie des fenêtres est en simple vitrage' } } },
      { si: { travaux: 'partielle' }, alors: { isolation: { valeur: 1.3, raison: '' } } },
      { si: { annee: 'de1975a2000' }, alors: { isolation: { valeur: 1.3, raison: '' } } },
      { si: { annee: 'avant1975' }, alors: { isolation: { valeur: 1.3, raison: '' } } },
      { si: {}, alors: { isolation: { valeur: 1, raison: '' } } },
    ],
  },

  plan: { nature: 'piece', saisie: true },

  champs: [
    { id: 'surface', saisie: true, label: 'Surface chauffée', unite: 'm²', requis: true, min: 1, max: 1000, defaut: 20 },
    { id: 'hauteur', saisie: true, label: 'Hauteur sous plafond', unite: 'm', requis: true, min: 1.8, max: 8, defaut: 2.5 },
    {
      id: 'isolation',
      type: 'choix',
      label: 'Niveau d’isolation',
      defaut: 1,
      aide: 'Coefficient indicatif de déperdition en W par m³ et par °C.',
      options: [
        { valeur: 0.75, libelle: 'Bonne : construction récente ou rénovation complète' },
        { valeur: 1, libelle: 'Correcte : isolation des années 2000' },
        { valeur: 1.3, libelle: 'Moyenne : isolation partielle ou ancienne' },
        { valeur: 1.6, libelle: 'Faible : logement peu ou pas isolé' },
      ],
    },
    { id: 'temperatureInterieure', label: 'Température intérieure souhaitée', unite: '°C', requis: true, min: 10, max: 26, defaut: 19 },
    { id: 'temperatureExterieure', label: 'Température extérieure de base', unite: '°C', requis: true, min: -30, max: 10, defaut: -7, aide: 'Température la plus froide retenue pour votre département : de -2 °C en bord de Méditerranée à -15 °C en montagne.' },
    { id: 'puissanceRadiateur', avance: true, label: 'Puissance d’un radiateur', unite: 'W', min: 100, defaut: 1000 },
  ],

  resultats: [
    { id: 'puissance', label: 'Puissance indicative', format: 'nombre', unite: 'W', principal: true },
    { id: 'puissanceM2', label: 'Soit par m²', format: 'nombre', unite: 'W' },
    { id: 'volume', label: 'Volume chauffé', format: 'nombre', unite: 'm³' },
    { id: 'radiateurs', label: 'Radiateurs de la puissance indiquée', format: 'nombre' },
  ],

  calculer(v, plan) {
    const ecart = v.temperatureInterieure - v.temperatureExterieure;
    if (ecart <= 0) return { erreur: 'La température intérieure doit être supérieure à la température extérieure de base.' };
    const surface = plan ? plan.surface : v.surface;
    const volume = surface * (plan ? plan.piece.hauteur : v.hauteur);
    const puissance = Math.round((volume * v.isolation * ecart) / 10) * 10;
    return {
      volume,
      puissance,
      puissanceM2: Math.round(puissance / surface),
      radiateurs: Math.ceil(puissance / v.puissanceRadiateur - 1e-9),
    };
  },

  devis: [
    { resultat: 'radiateurs', designation: 'Radiateurs', unite: 'radiateur', detail: '{puissance} W indicatifs pour {surface} m², radiateurs de {puissanceRadiateur} W' },
  ],

  explication: `
        <p>Puissance (W) = volume (m³) × coefficient d’isolation × (température intérieure − température extérieure de base). Une pièce de 20 m² sous 2,50 m, correctement isolée, à 19 °C pour −7 °C dehors : 50 × 1 × 26 = 1 300 W.</p>
        <p>Cette méthode simplifiée ne tient compte ni de l’orientation, ni des ponts thermiques, ni du renouvellement d’air réel : elle sert à se faire une idée, pas à choisir un appareil.</p>`,

  erreurs: [
    'Raisonner en watts au m² sans tenir compte de la hauteur sous plafond, de l’isolation et du climat.',
    'Surdimensionner une pompe à chaleur : elle fonctionne alors par cycles courts et s’use plus vite.',
    'Ignorer les apports et les pertes particulières : grandes baies vitrées, pièce sous combles, murs mitoyens.',
  ],

  conseils: [
    'Utilisez le résultat comme ordre de grandeur pour comparer les appareils.',
    'Pour une pompe à chaleur ou une chaudière, demandez une étude thermique à l’installateur.',
    'Isolez avant de changer le chauffage : la puissance nécessaire baisse d’autant.',
  ],

  normes: [
    {
      titre: 'NF EN 12831',
      description: 'méthode de calcul des déperditions et de la puissance de chauffage',
    },
  ],

  lies: ['plancher-chauffant', 'quantite-laine-de-verre', 'isolation-exterieur', 'debit-vmc'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Où trouver la température extérieure de base ?',
      reponse: 'Elle est donnée par département et par altitude dans les documents de calcul thermique ; un installateur ou un bureau d’études la connaît pour votre commune.',
    },
  ],

  exemples: [
    {
      entrees: { surface: 20, hauteur: 2.5, isolation: 1, temperatureInterieure: 19, temperatureExterieure: -7, puissanceRadiateur: 1000 },
      attendu: { volume: 50, puissance: 1300, puissanceM2: 65, radiateurs: 2 },
    },
    {
      entrees: { surface: 20, hauteur: 2.5, isolation: 1, temperatureInterieure: 5, temperatureExterieure: 8, puissanceRadiateur: 1000 },
      attendu: {},
    },
  ],
};
