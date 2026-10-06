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
        <p>« 1 pour n » signifie 1 cm de dénivelé pour n cm horizontaux : 2 % équivalent à 1 pour 50.</p>
        <p>Correspondances utiles :</p>
        <ul>
        <li>1 % = 1 cm par mètre = 0,57° ; 2 % = 1,15° ; 5 % = 2,86° ; 10 % = 5,71° ;</li>
        <li>30 % = 16,7° ; 50 % = 26,57° ; 100 % = 45° ;</li>
        <li>dans l’autre sens, 30° = 57,7 % ; 35° = 70 % ; 40° = 83,9 %.</li>
        </ul>
        <p>Le pourcentage et les degrés ne sont pas proportionnels : doubler l’angle ne double pas le pourcentage. C’est pourquoi on ne convertit pas de tête au-delà de quelques pour cent.</p>
        <p>Ordres de grandeur selon l’ouvrage (à vérifier dans le DTU et la notice concernés) : 1 à 3 cm par mètre pour une évacuation d’eaux usées ; pour un toit plat, selon le support et l’avis technique de la membrane ; 1,5 à 2 % pour une terrasse ou une allée, vers l’extérieur ; pour une couverture en tuiles ou en ardoises, la pente minimale dépend du modèle, de la longueur du rampant et de la région. Pour une rampe accessible, l’arrêté du 24 décembre 2015 limite la pente à 5 % dans les logements neufs (8 % sur 2 m au plus, 10 % sur 50 cm au plus) ; les maisons construites par leur propriétaire pour son propre usage ne sont pas concernées.</p>`,

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
    {
      question: 'Combien de degrés font 30 % de pente ?',
      reponse: 'Environ 16,7°. La conversion passe par l’arctangente : degrés = arctan(pourcentage ÷ 100). 100 % correspondent à 45°, et non à 90°.',
    },
    {
      question: 'Comment mesurer la pente d’un toit ?',
      reponse: 'Depuis les combles, posez un niveau horizontal d’un mètre contre un chevron et mesurez la distance verticale entre le bout du niveau et le chevron : 40 cm donnent 40 %, soit environ 21,8°. On peut aussi relever la hauteur et la profondeur du pan sur un plan.',
    },
    {
      question: 'Quelle pente maximale pour une rampe d’accès ?',
      reponse: 'Pour une rampe accessible aux personnes en fauteuil, l’arrêté du 24 décembre 2015 retient 5 % au plus dans les logements neufs, avec des tolérances (8 % sur 2 m, 10 % sur 50 cm) et des paliers de repos ; une maison construite pour son propre usage n’y est pas soumise. Pour une rampe de garage, la pente peut être plus forte : vérifiez qu’un véhicule ne frotte pas en haut et en bas.',
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
