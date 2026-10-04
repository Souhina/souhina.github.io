// Calculateur : chape et ragréage sur la pièce dessinée.
export default {
  slug: 'chape-ragreage',
  titre: 'Calcul de chape et de ragréage',
  rubrique: 'Chape et ragréage',
  lot: 'sols',
  ordre: 2.5,
  teinte: 'chape',
  // Aide au choix : questions fermées qui préremplissent les champs de type liste ou case.
  aideAuChoix: {
    questions: [
      { id: 'epaisseur', question: 'Quelle épaisseur faut-il rattraper ?', options: [{ valeur: 'fine', libelle: 'Moins d’un centimètre' }, { valeur: 'moyenne', libelle: 'De 1 à 3 centimètres' }, { valeur: 'epaisse', libelle: 'Plus de 3 centimètres' }] },
      { id: 'chauffant', question: 'Faut-il enrober un plancher chauffant ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
      { id: 'surface', question: 'Faut-il couler une grande surface d’un seul coup (plusieurs pièces) ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
    ],
    regles: [
      { si: { chauffant: 'oui' }, alors: { produit: { valeur: 2, raison: 'car la chape fluide enrobe bien les tubes ; elle est coulée par un professionnel' }, bande: { valeur: 1, raison: 'car elle est indispensable autour d’un plancher chauffant' } } },
      { si: { epaisseur: 'epaisse', surface: 'oui' }, alors: { produit: { valeur: 2, raison: 'plus rapide sur une grande surface ; elle est coulée par un professionnel' } } },
      { si: { epaisseur: 'epaisse' }, alors: { produit: { valeur: 1, raison: 'car un ragréage ne monte pas à cette épaisseur' }, bande: { valeur: 1, raison: 'car une chape flottante se désolidarise des murs' } } },
      { si: { epaisseur: 'moyenne' }, alors: { produit: { valeur: 0, raison: 'certains ragréages fibrés montent à plusieurs centimètres : vérifiez l’épaisseur maximale sur le sac' }, primaire: { valeur: 1, raison: 'car un ragréage se coule sur primaire' } } },
      { si: {}, alors: { produit: { valeur: 0, raison: 'pour corriger une faible épaisseur' }, primaire: { valeur: 1, raison: 'car un ragréage se coule sur primaire' } } },
    ],
  },

  plan: true,
  description: 'Dessinez la pièce et calculez les sacs de ragréage ou de mortier de chape, ou le volume de chape fluide, avec le primaire et la bande périphérique.',
  intro: 'La surface et le périmètre viennent de la pièce dessinée. Indiquez l’épaisseur et la consommation inscrite sur le sac.',
  categorie: 'UtilitiesApplication',
  avertissement: 'ce calculateur estime des quantités. L’épaisseur minimale, le temps de séchage et la compatibilité avec un plancher chauffant dépendent du produit : suivez la fiche technique et le DTU 26.2.',

  champs: [
    {
      id: 'produit',
      type: 'choix',
      label: 'Produit',
      defaut: 0,
      options: [
        { valeur: 0, libelle: 'Ragréage autolissant en sacs' },
        { valeur: 1, libelle: 'Mortier de chape en sacs' },
        { valeur: 2, libelle: 'Chape fluide livrée (m³)' },
      ],
    },
    { id: 'epaisseur', label: 'Épaisseur moyenne', unite: 'mm', requis: true, min: 1, max: 100, defaut: 5, aide: 'Ragréage : souvent 3 à 10 mm. Chape : souvent 40 à 60 mm.' },
    { id: 'consommation', label: 'Consommation par millimètre', unite: 'kg par m² et par mm', min: 0.5, max: 3, defaut: 1.6, aide: 'Inscrite sur le sac : environ 1,5 à 1,7 pour un ragréage, environ 2 pour un mortier de chape.' },
    { id: 'poidsSac', label: 'Poids d’un sac', unite: 'kg', min: 1, defaut: 25 },
    { id: 'marge', label: 'Marge', unite: '%', min: 0, max: 30, defaut: 10, aide: 'Les supports ne sont jamais parfaitement plans.' },
    { id: 'primaire', type: 'case', label: 'Prévoir un primaire d’accrochage', defaut: true },
    { id: 'rendementPrimaire', label: 'Rendement du primaire', unite: 'm² par litre', min: 1, defaut: 6 },
    { id: 'contenancePrimaire', label: 'Contenance d’un bidon de primaire', unite: 'L', min: 0.5, defaut: 5 },
    { id: 'bande', type: 'case', label: 'Prévoir une bande périphérique', defaut: false },
    { id: 'longueurBande', label: 'Longueur d’un rouleau de bande', unite: 'm', min: 1, defaut: 25 },
    { id: 'prixSac', label: 'Prix d’un sac', unite: '€', min: 0 },
    { id: 'prixM3', label: 'Prix du m³ de chape fluide', unite: '€', min: 0 },
    { id: 'prixPrimaire', label: 'Prix d’un bidon de primaire', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'sacs', equivalent: { champ: 'poidsSac', unite: 'kg' }, label: 'Sacs', format: 'nombre', principal: true },
    { id: 'volumeFluide', label: 'Chape fluide à commander', format: 'nombre', unite: 'm³' },
    { id: 'masse', label: 'Produit nécessaire', format: 'nombre', unite: 'kg' },
    { id: 'bidonsPrimaire', label: 'Bidons de primaire', format: 'nombre' },
    { id: 'rouleauxBande', label: 'Rouleaux de bande périphérique', format: 'nombre' },
    { id: 'surface', label: 'Surface', format: 'nombre', unite: 'm²' },
  ],

  calculer(v, plan) {
    const marge = 1 + v.marge / 100;
    const fluide = v.produit === 2;
    const masse = plan.surface * v.epaisseur * v.consommation * marge;
    return {
      surface: plan.surface,
      masse: fluide ? null : Math.round(masse),
      sacs: fluide ? null : Math.ceil(masse / v.poidsSac - 1e-9),
      // Chape fluide : volume arrondi au dixième de m³ supérieur.
      volumeFluide: fluide ? Math.ceil(plan.surface * (v.epaisseur / 1000) * marge * 10 - 1e-9) / 10 : null,
      bidonsPrimaire: v.primaire ? Math.ceil(plan.surface / v.rendementPrimaire / v.contenancePrimaire - 1e-9) : 0,
      rouleauxBande: v.bande ? Math.ceil(plan.perimetre / v.longueurBande - 1e-9) : 0,
    };
  },

  devis: [
    { resultat: 'sacs', designation: 'Ragréage ou mortier de chape', unite: 'sac', prixChamp: 'prixSac', detail: '{surface} m² en {epaisseur} mm, {consommation} kg par m² et par mm' },
    { resultat: 'volumeFluide', designation: 'Chape fluide', unite: 'm³', prixChamp: 'prixM3', detail: '{surface} m² en {epaisseur} mm' },
    { resultat: 'bidonsPrimaire', designation: 'Primaire d’accrochage', unite: 'bidon', prixChamp: 'prixPrimaire', complement: true, detail: 'Bidons de {contenancePrimaire} L, {rendementPrimaire} m² par litre' },
    { resultat: 'rouleauxBande', designation: 'Bande périphérique', unite: 'rouleau', complement: true },
  ],

  explication: `
        <p>Produit nécessaire = surface × épaisseur en mm × consommation par mm, plus la marge. Un ragréage de 5 mm sur 12 m² à 1,6 kg par m² et par mm demande 96 kg, soit 106 kg avec 10 % de marge : 5 sacs de 25 kg.</p>
        <p>Pour une chape fluide livrée, le volume vaut surface × épaisseur, arrondi au dixième de m³ supérieur.</p>`,

  erreurs: [
    'Confondre chape et ragréage : le ragréage corrige une planéité sur quelques millimètres, la chape forme un support sur plusieurs centimètres.',
    'Oublier le primaire d’accrochage : sans lui, le ragréage peut cloquer ou se décoller.',
    'Poser le revêtement avant la fin du séchage : l’humidité restante abîme parquet, colle ou sol souple.',
    'Ignorer les joints de fractionnement et la bande périphérique.',
  ],

  conseils: [
    'Préparez toute la quantité nécessaire pour couler la pièce d’un seul tenant.',
    'Respectez le dosage en eau exact du sac.',
    'Protégez la chape des courants d’air et du soleil pendant le séchage.',
    'Sur un plancher chauffant, suivez la mise en chauffe progressive prévue par le fabricant.',
  ],

  normes: [
    {
      titre: 'NF DTU 26.2',
      url: 'https://www.batirama.com/article/11815-nf-dtu-26.2-chapes-et-dalles-a-base-de-liants-hydrauliques.html',
      description: 'chapes et dalles à base de liants hydrauliques',
    },
    {
      titre: 'NF DTU 52.10',
      url: 'https://www.batirama.com/article/2281-nf-dtu-52.10-mise-en-uvre-sous-couche-isolante-sous-chape-ou-dalle-flottantes-sous-carrelage.html',
      description: 'sous-couches isolantes sous chape ou dalle flottantes',
    },
  ],

  lies: ['quantite-carrelage', 'quantite-parquet', 'isolation-sol', 'plancher-chauffant'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Ragréage ou chape ?',
      reponse: 'Le ragréage lisse un support existant sur quelques millimètres. La chape crée un nouveau support, sur plusieurs centimètres, par exemple sur un isolant ou un plancher chauffant.',
    },
  ],

  exemples: [
    {
      plan: [[0, 0], [400, 0], [400, 300], [0, 300]],
      entrees: { produit: 0, epaisseur: 5, consommation: 1.6, poidsSac: 25, marge: 10, primaire: 1, rendementPrimaire: 6, contenancePrimaire: 5, bande: 0, longueurBande: 25, prixSac: 0, prixM3: 0, prixPrimaire: 0 },
      attendu: { surface: 12, masse: 106, sacs: 5, volumeFluide: null, bidonsPrimaire: 1, rouleauxBande: 0 },
    },
    {
      plan: [[0, 0], [400, 0], [400, 300], [0, 300]],
      entrees: { produit: 2, epaisseur: 50, consommation: 2, poidsSac: 25, marge: 10, primaire: 0, rendementPrimaire: 6, contenancePrimaire: 5, bande: 1, longueurBande: 25, prixSac: 0, prixM3: 0, prixPrimaire: 0 },
      attendu: { volumeFluide: 0.7, sacs: null, rouleauxBande: 1 },
    },
  ],
};
