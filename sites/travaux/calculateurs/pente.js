// Calculateur : conversion de pente (pourcentage, degrés, cm par mètre, 1 pour n).
export default {
  slug: 'conversion-pente',
  titre: 'Conversion de pente : pourcentage, degrés, cm par mètre',
  rubrique: 'Conversion de pente',
  lot: 'gros-oeuvre',
  ordre: 6,
  teinte: 'grosoeuvre',
  description: 'Convertissez une pente en pourcentage, en degrés, en centimètres par mètre ou en « 1 pour n », et calculez le dénivelé sur une longueur.',
  intro: 'Saisissez la pente dans l’unité que vous connaissez : le calcul donne toutes les autres, et le dénivelé sur la longueur indiquée.',
  categorie: 'UtilitiesApplication',

  champs: [
    { id: 'valeur', label: 'Pente', requis: true, min: 0, max: 1000, defaut: 2 },
    {
      id: 'unite',
      type: 'choix',
      label: 'Unité de la pente saisie',
      defaut: 0,
      options: [
        { valeur: 0, libelle: 'Pourcentage (%)' },
        { valeur: 1, libelle: 'Degrés (°)' },
        { valeur: 2, libelle: 'Centimètres par mètre' },
        { valeur: 3, libelle: '« 1 pour n » (1 cm de dénivelé pour n cm)' },
      ],
    },
    { id: 'longueur', label: 'Longueur horizontale', unite: 'm', min: 0, defaut: 5, aide: 'Pour calculer le dénivelé correspondant.' },
  ],

  resultats: [
    { id: 'pourcent', label: 'Pente en pourcentage', format: 'pourcent', principal: true },
    { id: 'degres', label: 'Pente en degrés', format: 'nombre', unite: '°' },
    { id: 'cmParMetre', label: 'Centimètres par mètre', format: 'nombre', unite: 'cm/m' },
    { id: 'unPour', label: '1 pour…', format: 'nombre' },
    { id: 'denivele', label: 'Dénivelé sur la longueur', format: 'nombre', unite: 'cm' },
  ],

  calculer(v) {
    if (v.unite === 1 && v.valeur >= 90) return { erreur: 'Une pente en degrés doit être inférieure à 90°.' };
    if (v.unite === 3 && !(v.valeur > 0)) return { erreur: '« 1 pour n » demande un nombre n supérieur à zéro.' };
    const pourcent = v.unite === 1
      ? Math.tan((v.valeur * Math.PI) / 180) * 100
      : v.unite === 3
        ? 100 / v.valeur
        : v.valeur; // le pourcentage et les cm par mètre sont la même mesure
    return {
      pourcent: Math.round(pourcent * 100) / 100,
      degres: Math.round((Math.atan(pourcent / 100) * 180) / Math.PI * 100) / 100,
      cmParMetre: Math.round(pourcent * 100) / 100,
      unPour: pourcent > 0 ? Math.round((100 / pourcent) * 10) / 10 : null,
      denivele: Math.round(v.longueur * pourcent * 10) / 10,
    };
  },

  explication: `
        <p>Une pente de 1 % correspond à 1 cm de dénivelé par mètre horizontal : le pourcentage et les centimètres par mètre sont la même mesure. En degrés, pente (°) = arctangente (pourcentage ÷ 100) : 100 % correspondent à 45°.</p>
        <p>« 1 pour n » signifie 1 cm de dénivelé pour n cm horizontaux : 2 % équivalent à 1 pour 50.</p>`,

  erreurs: [
    'Confondre degrés et pourcentage : 100 % correspond à 45°, et non à 90°.',
    'Mesurer la longueur du rampant au lieu de la distance horizontale.',
    'Ignorer la pente minimale du matériau de couverture choisi : elle dépend du modèle, de la région et de l’exposition.',
  ],

  conseils: [
    'Un niveau à bulle et un mètre suffisent : mesurez la hauteur gagnée sur un mètre à l’horizontale.',
    'Notez la pente dans les deux unités : les fabricants de couverture l’expriment en pourcentage ou en degrés.',
    'Pour une évacuation, une terrasse ou une allée, exprimez la pente en centimètres par mètre.',
  ],

  normes: [
    {
      titre: 'Série NF DTU 40',
      url: 'https://www.batirama.com/article/1964-la-liste-des-dtu-documents-techniques-unifies-a-jour.html',
      description: 'travaux de couverture : pentes minimales selon le matériau et la zone',
    },
  ],

  lies: ['couverture-tuiles', 'chevrons-charpente', 'reseau-plomberie', 'toit-plat-epdm'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Quelle pente pour une évacuation ou une terrasse ?',
      reponse: 'Les valeurs dépendent de l’ouvrage et de son DTU : quelques centimètres par mètre pour une évacuation d’eaux usées, un ou deux pour cent pour une terrasse. Vérifiez la valeur exigée pour votre cas.',
    },
  ],

  exemples: [
    {
      entrees: { valeur: 2, unite: 0, longueur: 5 },
      attendu: { pourcent: 2, degres: 1.15, cmParMetre: 2, unPour: 50, denivele: 10 },
    },
    {
      entrees: { valeur: 45, unite: 1, longueur: 2 },
      attendu: { pourcent: 100, degres: 45, unPour: 1, denivele: 200 },
    },
    {
      entrees: { valeur: 100, unite: 3, longueur: 10 },
      attendu: { pourcent: 1, denivele: 10 },
    },
    {
      entrees: { valeur: 95, unite: 1, longueur: 2 },
      attendu: {},
    },
  ],
};
