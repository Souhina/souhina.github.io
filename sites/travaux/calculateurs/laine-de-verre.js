// Calculateur : quantité de laine de verre pour atteindre une résistance thermique visée.
export default {
  slug: 'quantite-laine-de-verre',
  titre: 'Calcul de la quantité de laine de verre',
  rubrique: 'Isolation',
  lot: 'platrerie-isolation',
  teinte: 'isolation',
  description: 'Calculez l’épaisseur de laine de verre nécessaire pour atteindre la résistance thermique visée, le nombre de couches et le nombre de rouleaux ou de panneaux.',
  intro: 'Indiquez la surface à isoler, la résistance thermique visée et les caractéristiques inscrites sur l’emballage : l’épaisseur et le nombre de colis s’affichent immédiatement.',
  categorie: 'UtilitiesApplication',
  avertissement: 'ce calculateur estime des quantités d’isolant. Respectez les écarts au feu autour des conduits de fumée et des spots encastrés, et vérifiez auprès du fabricant la nécessité d’un pare-vapeur côté chauffé.',

  // Mur ou rampant dessiné de face, ou surface saisie.
  // Aide au choix : questions fermées qui préremplissent les champs de type liste ou case.
  aideAuChoix: {
    questions: [
      { id: 'paroi', question: 'Que voulez-vous isoler ?', options: [{ valeur: 'combles', libelle: 'Des combles perdus (plancher du grenier)' }, { valeur: 'rampants', libelle: 'Des rampants ou le plafond de combles aménagés' }, { valeur: 'murs', libelle: 'Des murs, par l’intérieur' }, { valeur: 'plancher', libelle: 'Un plancher sur cave, garage ou vide sanitaire' }] },
      { id: 'membrane', question: 'Un pare-vapeur ou une membrane est-il déjà en place côté chauffé ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
    ],
    regles: [
      { si: { paroi: 'combles' }, alors: { paroi: { valeur: 7, raison: 'seuil des aides à la rénovation, à vérifier chaque année' } } },
      { si: { paroi: 'rampants' }, alors: { paroi: { valeur: 6, raison: 'seuil des aides à la rénovation, à vérifier chaque année' } } },
      { si: { paroi: 'murs' }, alors: { paroi: { valeur: 3.7, raison: 'seuil des aides à la rénovation, à vérifier chaque année' } } },
      { si: { paroi: 'plancher' }, alors: { paroi: { valeur: 3, raison: 'seuil des aides à la rénovation, à vérifier chaque année' } } },
      { si: { membrane: 'oui' }, alors: { pareVapeur: { valeur: 0, raison: 'car une membrane est déjà en place' } } },
      { si: { membrane: 'non' }, alors: { pareVapeur: { valeur: 1, raison: 'côté chauffé, sauf si la notice de l’isolant ne l’exige pas' } } },
    ],
  },

  plan: { nature: 'mur', saisie: true },

  champs: [
    { id: 'surface', saisie: true, label: 'Surface à isoler', unite: 'm²', requis: true, min: 0.1, defaut: 50 },
    { id: 'resistance', label: 'Résistance thermique visée (R)', unite: 'm².K/W', requis: true, min: 0.5, max: 15, defaut: 7, aide: 'Fixée par votre projet ou par les conditions des aides à la rénovation.' },
    {
      id: 'paroi',
      type: 'choix',
      label: 'Paroi à isoler',
      defaut: 0,
      aide: 'Résistances minimales demandées pour les aides à la rénovation (MaPrimeRénov’, CEE), à vérifier chaque année sur france-renov.gouv.fr.',
      options: [
        { valeur: 0, libelle: 'Autre : résistance saisie ci-dessus' },
        { valeur: 7, libelle: 'Combles perdus : R = 7' },
        { valeur: 6, libelle: 'Rampants ou plafond de combles aménagés : R = 6' },
        { valeur: 3.7, libelle: 'Murs : R = 3,7' },
        { valeur: 3, libelle: 'Plancher bas : R = 3' },
      ],
    },
    { id: 'lambda', label: 'Conductivité thermique de l’isolant (λ)', unite: 'W/m.K', requis: true, min: 0.015, max: 0.1, defaut: 0.032, aide: 'Inscrite sur l’emballage : plus elle est basse, plus l’isolant est performant à épaisseur égale.' },
    { id: 'epaisseurProduit', label: 'Épaisseur d’un rouleau ou d’un panneau', unite: 'cm', requis: true, min: 1, defaut: 20 },
    { id: 'surfaceColis', label: 'Surface couverte par un colis', unite: 'm²', requis: true, min: 0.1, defaut: 4, aide: 'Inscrite sur l’emballage du rouleau ou du paquet de panneaux.' },
    { id: 'marge', label: 'Marge pour les découpes', unite: '%', min: 0, max: 50, defaut: 5 },
    { id: 'pareVapeur', type: 'case', label: 'Prévoir un pare-vapeur et son adhésif d’étanchéité', defaut: true, aide: 'Côté chauffé ; certains isolants ou systèmes n’en demandent pas : voir la notice.' },
    { id: 'surfacePareVapeur', avance: true, label: 'Surface d’un rouleau de pare-vapeur', unite: 'm²', min: 1, defaut: 40 },
    { id: 'adhesifM2', avance: true, label: 'Adhésif par m² de pare-vapeur', unite: 'm', min: 0, defaut: 1, aide: 'Raccords entre lés et en périphérie : environ 1 m par m².' },
    { id: 'longueurAdhesif', avance: true, label: 'Longueur d’un rouleau d’adhésif', unite: 'm', min: 1, defaut: 25 },
    { id: 'prixColis', label: 'Prix d’un colis', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'colis', label: 'Rouleaux ou colis de panneaux', format: 'nombre', principal: true },
    { id: 'resistanceVisee', label: 'Résistance thermique visée', format: 'nombre', unite: 'm².K/W' },
    { id: 'epaisseurNecessaire', label: 'Épaisseur nécessaire', format: 'nombre', unite: 'cm' },
    { id: 'couches', label: 'Couches à poser', format: 'nombre' },
    { id: 'resistanceObtenue', label: 'Résistance obtenue avec ces couches', format: 'nombre', unite: 'm².K/W' },
    { id: 'rouleauxPareVapeur', label: 'Rouleaux de pare-vapeur', format: 'nombre' },
    { id: 'rouleauxAdhesif', label: 'Rouleaux d’adhésif d’étanchéité', format: 'nombre' },
  ],

  // Épaisseur (m) = R × λ. Les couches sont arrondies au produit entier supérieur.
  calculer(v, plan) {
    const surface = plan ? plan.surface : v.surface;
    // Paroi choisie : sa résistance remplace celle saisie.
    const resistanceVisee = v.paroi > 0 ? v.paroi : v.resistance;
    const epaisseurNecessaire = resistanceVisee * v.lambda * 100;
    const couches = Math.ceil(epaisseurNecessaire / v.epaisseurProduit - 1e-9);
    const colis = Math.ceil((surface * couches * (1 + v.marge / 100)) / v.surfaceColis);
    return {
      resistanceVisee,
      epaisseurNecessaire,
      couches,
      colis,
      resistanceObtenue: (couches * v.epaisseurProduit) / 100 / v.lambda,
      // Pare-vapeur : 15 % de plus pour les recouvrements de 10 cm et les relevés.
      rouleauxPareVapeur: v.pareVapeur ? Math.ceil((surface * 1.15) / v.surfacePareVapeur - 1e-9) : 0,
      rouleauxAdhesif: v.pareVapeur && v.adhesifM2 > 0 ? Math.ceil((surface * v.adhesifM2) / v.longueurAdhesif - 1e-9) : 0,
    };
  },

  devis: [
    { resultat: 'colis', achat: 'isolant', detail: '{surface} m², R = {resistanceVisee}, {couches} couche(s) de {epaisseurProduit} cm', designation: 'Laine de verre', unite: 'colis', prixChamp: 'prixColis' },
    { resultat: 'rouleauxPareVapeur', designation: 'Pare-vapeur', unite: 'rouleau', complement: true, detail: 'Rouleaux de {surfacePareVapeur} m², recouvrements compris' },
    { resultat: 'rouleauxAdhesif', designation: 'Adhésif d’étanchéité à l’air', unite: 'rouleau', complement: true },
  ],

  explication: `
        <p>L’épaisseur nécessaire se déduit de la résistance thermique visée : épaisseur (en mètres) = R × λ. Avec un λ de 0,032 et un R de 7, il faut environ 22,4 cm d’isolant.</p>
        <p>Le nombre de couches est arrondi au produit entier supérieur. Deux couches se posent croisées pour couper les ponts thermiques. Le nombre de colis tient compte de toutes les couches et de la marge de découpe.</p>
        <p>La résistance obtenue est souvent supérieure à la valeur visée, car on ne pose que des épaisseurs entières : comparez plusieurs épaisseurs de produit pour vous rapprocher de la cible.</p>`,

  erreurs: [
    'Comparer les isolants à l’épaisseur : c’est la résistance thermique R qui compte, et elle dépend aussi du lambda.',
    'Tasser la laine ou la comprimer derrière une ossature : elle perd une partie de son pouvoir isolant.',
    'Oublier le pare-vapeur ou la membrane hygrorégulante côté chauffé quand le fabricant l’exige.',
    'Ne pas respecter les distances de sécurité autour des conduits de fumée et des spots encastrés.',
  ],

  conseils: [
    'Posez deux couches croisées quand c’est possible : les joints de la première sont couverts par la seconde.',
    'Découpez la laine légèrement plus large que l’espace à remplir pour qu’elle tienne sans vide.',
    'Portez gants, lunettes, masque et vêtements couvrants pendant la pose.',
    'Vérifiez le niveau de R exigé si vous visez une aide à la rénovation.',
  ],

  normes: [
    {
      titre: 'NF DTU 45.10',
      url: 'https://www.isover.fr/nous-connaitre/nos-actualites/nouveau-parution-du-dtu-4510-isolation-des-combles-en-panneaux-et',
      description: 'isolation des combles par panneaux ou rouleaux en laines minérales manufacturées',
    },
    {
      titre: 'NF DTU 25.41',
      url: 'https://www.batirama.com/article/2262-nf-dtu-25.41-ouvrages-en-plaques-de-platre-plaques-a-faces-cartonnees.html',
      description: 'doublages en plaques de plâtre',
    },
  ],

  lies: ['quantite-laine-de-roche', 'isolation-soufflee', 'plaques-de-platre'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Laine de verre ou laine de roche ?',
      reponse: 'La laine de verre est légère et souvent moins chère à performance égale. La laine de roche est plus dense : elle résiste mieux au feu et atténue mieux certains bruits.',
    },
    {
      question: 'Rouleaux ou panneaux ?',
      reponse: 'Les rouleaux conviennent aux grandes surfaces horizontales comme les combles. Les panneaux se tiennent mieux debout, entre des montants ou des chevrons.',
    },
  ],

  exemples: [
    {"entrees":{"surface":50,"resistance":7,"lambda":0.035,"epaisseurProduit":20,"surfaceColis":4,"marge":5,"pareVapeur":1,"surfacePareVapeur":40,"adhesifM2":1,"longueurAdhesif":25,"prixColis":0,"paroi":3.7},"attendu":{"resistanceVisee":3.7,"epaisseurNecessaire":12.950000000000003}},
    {
      entrees: { surface: 50, resistance: 7, lambda: 0.035, epaisseurProduit: 20, surfaceColis: 4, marge: 5, pareVapeur: 1, surfacePareVapeur: 40, adhesifM2: 1, longueurAdhesif: 25, prixColis: 0 },
      attendu: { epaisseurNecessaire: 24.5, couches: 2, colis: 27, resistanceObtenue: 11.4286, rouleauxPareVapeur: 2, rouleauxAdhesif: 2 },
    },
    {
      entrees: { surface: 20, resistance: 4, lambda: 0.04, epaisseurProduit: 16, surfaceColis: 5, marge: 0, pareVapeur: 0, surfacePareVapeur: 40, adhesifM2: 1, longueurAdhesif: 25, prixColis: 0 },
      attendu: { epaisseurNecessaire: 16, couches: 1, colis: 4, resistanceObtenue: 4 },
    },
  ],
};
