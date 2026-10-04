// Calculateur : isolation thermique par l'extérieur sous enduit (quantités seules).
export default {
  slug: 'isolation-exterieur',
  titre: 'Calcul d’une isolation thermique par l’extérieur (ITE)',
  rubrique: 'Isolation par l’extérieur',
  lot: 'facades',
  ordre: 2,
  teinte: 'facade',
  description: 'Calculez la surface de façade, l’épaisseur d’isolant, les panneaux, la colle, les chevilles, l’enduit armé et le treillis d’une isolation par l’extérieur sous enduit.',
  intro: 'Indiquez les façades à isoler, pignons compris, et la résistance thermique visée : le calcul donne l’épaisseur et chaque composant du système.',
  categorie: 'UtilitiesApplication',
  avertissement: 'ce calculateur estime des quantités. Un système d’isolation par l’extérieur se pose selon son évaluation technique (Avis technique ou Document technique d’application), avec les règles de sécurité incendie applicables, et demande en général une déclaration préalable en mairie. Faites valider le projet par un professionnel.',

  // Façade dessinée de face (pignon et ouvertures compris), ou dimensions saisies.
  // Aide au choix : questions fermées qui préremplissent les champs de type liste ou case.
  aideAuChoix: {
    questions: [
      { id: 'batiment', question: 'Quel bâtiment ?', options: [{ valeur: 'maison', libelle: 'Une maison individuelle' }, { valeur: 'immeuble', libelle: 'Un immeuble ou un bâtiment de plusieurs étages' }] },
      { id: 'ancien', question: 'Le mur est-il ancien (pierre, terre, brique pleine) ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
      { id: 'epaisseur', question: 'L’épaisseur disponible est-elle limitée (débord de toit, limite de propriété) ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
      { id: 'budget', question: 'Le budget est-il la priorité ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
    ],
    regles: [
      { si: { ancien: 'oui' }, alors: { isolant: { valeur: 0.036, raison: 'perméable à la vapeur d’eau, adaptée aux murs anciens ; vérifiez le système complet' } } },
      { si: { batiment: 'immeuble' }, alors: { isolant: { valeur: 0.036, raison: 'incombustible ; la sécurité incendie impose des dispositions particulières, à vérifier' } } },
      { si: { epaisseur: 'oui' }, alors: { isolant: { valeur: 0.031, raison: 'il isole mieux à épaisseur égale' } } },
      { si: { budget: 'oui' }, alors: { isolant: { valeur: 0.038, raison: 'le moins cher, mais plus épais à résistance égale' } } },
      { si: {}, alors: { isolant: { valeur: 0.031, raison: 'le plus courant sur une maison' } } },
    ],
  },

  plan: { nature: 'mur', saisie: true },

  champs: [
    { id: 'perimetre', saisie: true, suggestionChantier: 'longueurFacades', label: 'Longueur totale des façades à isoler', unite: 'm', requis: true, min: 0.5, defaut: 40 },
    { id: 'hauteur', saisie: true, label: 'Hauteur des murs, jusqu’à l’égout du toit', unite: 'm', requis: true, min: 0.5, defaut: 5.5 },
    { id: 'pignons', saisie: true, label: 'Nombre de pignons', min: 0, defaut: 2 },
    { id: 'largeurPignon', saisie: true, label: 'Largeur d’un pignon', unite: 'm', min: 0, defaut: 8 },
    { id: 'hauteurPignon', saisie: true, label: 'Hauteur d’un pignon', unite: 'm', min: 0, defaut: 3 },
    { id: 'ouvertures', saisie: true, label: 'Surface des portes et fenêtres', unite: 'm²', min: 0, defaut: 30 },
    { id: 'resistance', label: 'Résistance thermique visée (R)', unite: 'm².K/W', requis: true, min: 0.5, max: 10, defaut: 3.7 },
    {
      id: 'isolant',
      type: 'choix',
      label: 'Isolant',
      defaut: 0,
      aide: 'Valeurs de λ indicatives ; celle du produit choisi figure sur sa fiche technique.',
      options: [
        { valeur: 0, libelle: 'Autre : λ saisi ci-dessous' },
        { valeur: 0.031, libelle: 'Polystyrène graphité (λ ≈ 0,031)' },
        { valeur: 0.038, libelle: 'Polystyrène blanc (λ ≈ 0,038)' },
        { valeur: 0.036, libelle: 'Laine de roche (λ ≈ 0,036)' },
      ],
    },
    { id: 'lambda', label: 'Conductivité de l’isolant (λ)', unite: 'W/m.K', requis: true, min: 0.015, max: 0.06, defaut: 0.032, aide: 'Polystyrène graphité : environ 0,031. Polystyrène blanc : environ 0,038. Laine de roche : environ 0,036.' },
    { id: 'surfacePanneau', avance: true, label: 'Surface d’un panneau', unite: 'm²', min: 0.1, defaut: 0.5 },
    { id: 'colleM2', avance: true, label: 'Colle', unite: 'kg par m²', min: 0, defaut: 5 },
    { id: 'chevillesM2', avance: true, label: 'Chevilles par m²', min: 0, defaut: 6, aide: 'Selon le support, la hauteur et l’exposition au vent : voir le cahier technique du système.' },
    { id: 'enduitBaseM2', avance: true, label: 'Enduit de base armé', unite: 'kg par m²', min: 0, defaut: 5 },
    { id: 'finitionM2', avance: true, label: 'Enduit de finition', unite: 'kg par m²', min: 0, defaut: 2.5 },
    { id: 'poidsSac', avance: true, label: 'Poids d’un sac ou d’un seau', unite: 'kg', min: 1, defaut: 25 },
    { id: 'surfaceTreillis', avance: true, label: 'Surface d’un rouleau de treillis', unite: 'm²', min: 1, defaut: 50 },
    { id: 'marge', label: 'Marge pour les coupes', unite: '%', min: 0, max: 30, defaut: 5 },
    { id: 'prixPanneau', label: 'Prix d’un panneau isolant', unite: '€', min: 0 },
    { id: 'prixSac', label: 'Prix d’un sac de colle ou d’enduit de base', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'panneaux', label: 'Panneaux isolants', format: 'nombre', principal: true },
    { id: 'epaisseur', label: 'Épaisseur d’isolant, arrondie au cm', format: 'nombre', unite: 'cm' },
    { id: 'surface', label: 'Surface à isoler', format: 'nombre', unite: 'm²' },
    { id: 'sacsColle', equivalent: { champ: 'poidsSac', unite: 'kg' }, label: 'Sacs de colle', format: 'nombre' },
    { id: 'chevilles', label: 'Chevilles', format: 'nombre' },
    { id: 'sacsEnduitBase', equivalent: { champ: 'poidsSac', unite: 'kg' }, label: 'Sacs d’enduit de base', format: 'nombre' },
    { id: 'rouleauxTreillis', label: 'Rouleaux de treillis d’armature', format: 'nombre' },
    { id: 'profilsDepart', label: 'Profilés de départ (2,50 m)', format: 'nombre' },
    { id: 'seauxFinition', equivalent: { champ: 'poidsSac', unite: 'kg' }, label: 'Seaux d’enduit de finition', format: 'nombre' },
  ],

  calculer(v, plan) {
    // Dessin : surface de la face, pignon compris et ouvertures déduites ; « Tous les murs » additionne les faces.
    const surface = plan ? plan.surface : Math.max(0, v.perimetre * v.hauteur + (v.pignons * v.largeurPignon * v.hauteurPignon) / 2 - v.ouvertures);
    // Isolant choisi : son λ remplace celui saisi.
    const lambda = v.isolant > 0 ? v.isolant : v.lambda;
    const epaisseur = Math.ceil(v.resistance * lambda * 100 - 1e-9);
    return {
      surface,
      epaisseur,
      panneaux: Math.ceil((surface * (1 + v.marge / 100)) / v.surfacePanneau - 1e-9),
      sacsColle: Math.ceil((surface * v.colleM2) / v.poidsSac - 1e-9),
      chevilles: Math.ceil(surface * v.chevillesM2 - 1e-9),
      sacsEnduitBase: Math.ceil((surface * v.enduitBaseM2) / v.poidsSac - 1e-9),
      // Treillis : 10 cm de recouvrement entre lés et renforts d'angles, environ 15 % de plus.
      rouleauxTreillis: Math.ceil((surface * 1.15) / v.surfaceTreillis - 1e-9),
      profilsDepart: Math.ceil(((plan ? plan.longueur : v.perimetre) * 1.05) / 2.5 - 1e-9),
      seauxFinition: Math.ceil((surface * v.finitionM2) / v.poidsSac - 1e-9),
    };
  },

  devis: [
    { resultat: 'panneaux', designation: 'Panneaux isolants d’ITE', unite: 'panneau', prixChamp: 'prixPanneau', detail: '{surface} m², {epaisseur} cm pour R = {resistance}' },
    { resultat: 'sacsColle', designation: 'Colle d’ITE', unite: 'sac', prixChamp: 'prixSac', complement: true },
    { resultat: 'chevilles', designation: 'Chevilles d’ITE', unite: 'cheville', complement: true },
    { resultat: 'sacsEnduitBase', designation: 'Enduit de base armé', unite: 'sac', prixChamp: 'prixSac', complement: true },
    { resultat: 'rouleauxTreillis', designation: 'Treillis d’armature', unite: 'rouleau', complement: true },
    { resultat: 'profilsDepart', designation: 'Profilés de départ', unite: 'profilé', complement: true },
    { resultat: 'seauxFinition', designation: 'Enduit de finition', unite: 'seau', complement: true },
  ],

  explication: `
        <p>Surface = longueur des façades × hauteur, plus les pignons, moins les ouvertures. Épaisseur = R × λ, arrondie au centimètre supérieur : R = 3,7 avec un λ de 0,032 demande 12 cm.</p>
        <p>Le système se compose de panneaux collés et chevillés, d’un enduit de base armé d’un treillis, puis d’un enduit de finition. Un profilé de départ court en bas des façades.</p>`,

  erreurs: [
    'Oublier les retours en tableaux de fenêtres : ce sont des ponts thermiques.',
    'Panacher les composants de plusieurs systèmes : seul un système complet est couvert par son évaluation technique.',
    'Oublier les démarches d’urbanisme : l’ITE modifie l’aspect de la façade.',
    'Oublier de prolonger les appuis de fenêtres.',
  ],

  conseils: [
    'Faites appel à un professionnel RGE si vous visez une aide.',
    'Prévoyez les rails de départ, les profilés d’angle et les chevilles du système complet.',
    'Traitez les points singuliers : appuis, descentes d’eau, éclairages et boîtes aux lettres.',
  ],

  normes: [
    {
      titre: 'CPT 3035 (CSTB)',
      url: 'https://www.ffbatiment.fr/actualites-batiment/actualite-bam/isolation-thermique-exterieure-enduit-isolant-regles-art-evoluent',
      description: 'dispositions communes aux systèmes d’isolation thermique extérieure par enduit sur isolant',
    },
    {
      titre: 'NF DTU 45.4',
      url: 'https://www.boutique.afnor.org/fr-fr/norme/nf-dtu-454/travaux-de-batiment-systemes-disolation-thermique-par-lexterieur-en-bardage/fa207402/343524',
      description: 'isolation thermique par l’extérieur en bardage rapporté avec lame d’air ventilée',
    },
  ],

  lies: ['enduit-facade', 'lambris-bardage', 'peinture-facade', 'puissance-chauffage'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Faut-il une autorisation pour isoler par l’extérieur ?',
      reponse: 'En général une déclaration préalable, car l’aspect de la façade change ; la mairie peut imposer une teinte ou une finition. L’épaisseur ajoutée peut aussi empiéter sur une limite de propriété.',
    },
  ],

  exemples: [
    {"entrees":{"perimetre":40,"hauteur":5.5,"pignons":2,"largeurPignon":8,"hauteurPignon":3,"ouvertures":30,"resistance":3.7,"lambda":0.032,"surfacePanneau":0.5,"colleM2":5,"chevillesM2":6,"enduitBaseM2":5,"finitionM2":2.5,"poidsSac":25,"surfaceTreillis":50,"marge":5,"prixPanneau":0,"prixSac":0,"isolant":0.038},"attendu":{"epaisseur":15}},
    {
      entrees: { perimetre: 40, hauteur: 5.5, pignons: 2, largeurPignon: 8, hauteurPignon: 3, ouvertures: 30, resistance: 3.7, lambda: 0.032, surfacePanneau: 0.5, colleM2: 5, chevillesM2: 6, enduitBaseM2: 5, finitionM2: 2.5, poidsSac: 25, surfaceTreillis: 50, marge: 5, prixPanneau: 0, prixSac: 0 },
      attendu: { surface: 214, epaisseur: 12, panneaux: 450, sacsColle: 43, chevilles: 1284, sacsEnduitBase: 43, rouleauxTreillis: 5, profilsDepart: 17, seauxFinition: 22 },
    },
  ],
};
