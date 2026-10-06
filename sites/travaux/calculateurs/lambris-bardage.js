import { SCHEMAS_POSE } from '../partage/poses.js';

// Calculateur : lambris intérieur ou bardage de façade (lames, tasseaux, fixations, pare-pluie).
export default {
  slug: 'lambris-bardage',
  titre: 'Calcul de lambris et de bardage',
  rubrique: 'Lambris et bardage',
  lot: 'menuiserie',
  ordre: 1,
  teinte: 'bois',
  description: 'Calculez le nombre de lames de lambris ou de bardage, les tasseaux d’ossature, les fixations et le pare-pluie d’une façade.',
  intro: 'Indiquez les dimensions du mur, le sens de pose et la largeur utile des lames : les tasseaux sont posés perpendiculairement aux lames.',
  categorie: 'UtilitiesApplication',
  avertissement: 'ce calculateur estime des quantités. Un bardage de façade demande une lame d’air ventilée, un pare-pluie et des fixations adaptées à l’exposition : suivez la notice du fabricant et le DTU 41.2.',

  groupes: {
    'Le mur': 'Mur intérieur à lambrisser ou façade à barder.',
    'Les lames': 'La largeur utile est la partie visible une fois les lames emboîtées, indiquée sur l’étiquette.',
  },

  // Mur dessiné de face, ou dimensions saisies.
  plan: { nature: 'mur', saisie: true },

  champs: [
    {
      id: 'usage',
      groupe: 'Le mur',
      type: 'choix',
      label: 'Usage',
      defaut: 0,
      options: [
        { valeur: 0, libelle: 'Lambris intérieur' },
        { valeur: 1, libelle: 'Bardage de façade' },
      ],
    },
    { id: 'longueur', saisie: true, groupe: 'Le mur', label: 'Longueur du mur', unite: 'm', requis: true, min: 0.2, max: 200, defaut: 4 },
    { id: 'hauteur', saisie: true, groupe: 'Le mur', label: 'Hauteur du mur', unite: 'm', requis: true, min: 0.2, max: 20, defaut: 2.5 },
    { id: 'ouvertures', saisie: true, groupe: 'Le mur', label: 'Surface des portes et fenêtres', unite: 'm²', min: 0, defaut: 0 },
    {
      id: 'sens',
      groupe: 'Les lames',
      type: 'choix',
      label: 'Sens de pose des lames',
      defaut: 0,
      options: [
        { valeur: 0, libelle: 'Lames horizontales, tasseaux verticaux' },
        { valeur: 1, libelle: 'Lames verticales, tasseaux horizontaux' },
      ],
    },
    {
      id: 'poseLames',
      groupe: 'Les lames',
      type: 'choix',
      presentation: 'vignettes',
      label: 'Type de pose',
      defaut: 0,
      aide: 'Pose droite : la marge des réglages avancés. Diagonale et chevrons : forfait, modifiable.',
      options: [
        { valeur: 0, libelle: 'Droite', schema: SCHEMAS_POSE.coupePerdue },
        { valeur: 1, libelle: 'En diagonale', schema: SCHEMAS_POSE.diagonale },
        { valeur: 2, libelle: 'En chevrons', schema: SCHEMAS_POSE.batonsRompus },
      ],
    },
    { id: 'largeurUtile', groupe: 'Les lames', label: 'Largeur utile d’une lame', unite: 'cm', requis: true, min: 3, max: 40, defaut: 12 },
    { id: 'longueurLame', groupe: 'Les lames', label: 'Longueur d’une lame', unite: 'm', requis: true, min: 0.5, max: 6, defaut: 2.5 },
    {
      id: 'entraxe',
      type: 'choix',
      label: 'Entraxe des tasseaux',
      defaut: 50,
      options: [
        { valeur: 40, libelle: '40 cm' },
        { valeur: 50, libelle: '50 cm' },
        { valeur: 60, libelle: '60 cm' },
      ],
    },
    { id: 'pareP', type: 'case', label: 'Prévoir un pare-pluie (bardage de façade)', defaut: false },
    { id: 'longueurTasseau', avance: true, label: 'Longueur d’un tasseau', unite: 'm', min: 0.5, defaut: 2.4 },
    { id: 'fixationsM2', avance: true, label: 'Fixations par m²', min: 0, defaut: 20, aide: 'Pointes, agrafes, clips ou vis, selon la lame et la notice.' },
    { id: 'surfacePareP', avance: true, label: 'Surface d’un rouleau de pare-pluie', unite: 'm²', min: 1, defaut: 75 },
    { id: 'marge', label: 'Marge pour les coupes en pose droite', unite: '%', min: 0, max: 30, defaut: 10 },
    { id: 'tauxChute', avance: true, label: 'Taux de chute personnalisé', unite: '%', min: 0, max: 50, aide: 'Laissez vide pour la marge ou le forfait de la pose.' },
    { id: 'prixLame', label: 'Prix d’une lame', unite: '€', min: 0 },
    { id: 'prixTasseau', label: 'Prix d’un tasseau', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'lames', label: 'Lames', format: 'nombre', principal: true },
    { id: 'surface', label: 'Surface à habiller', format: 'nombre', unite: 'm²' },
    { id: 'tauxChute', label: 'Taux de chute appliqué', format: 'pourcent' },
    { id: 'sourceChute', label: 'Source du taux', format: 'texte' },
    { id: 'tasseaux', label: 'Tasseaux', format: 'nombre' },
    { id: 'fixations', label: 'Fixations', format: 'nombre' },
    { id: 'rouleauxPareP', label: 'Rouleaux de pare-pluie', format: 'nombre' },
  ],

  calculer(v, plan) {
    // Dessin : face du mur vue de face (longueur et hauteur hors tout, ouvertures dessinées).
    const longueur = plan ? plan.longueur : v.longueur;
    const hauteur = plan ? plan.hauteur : v.hauteur;
    const surface = plan ? plan.surface : Math.max(0, longueur * hauteur - v.ouvertures);
    const surfaceLame = (v.largeurUtile / 100) * v.longueurLame;
    // Tasseaux perpendiculaires aux lames, répartis à l'entraxe.
    const horizontales = v.sens === 0;
    const lignes = Math.floor(((horizontales ? longueur : hauteur) * 100) / v.entraxe + 1e-9) + 1;
    const lineaireTasseaux = lignes * (horizontales ? hauteur : longueur) * 1.05;
    // Taux de chute : saisi, sinon forfait de la pose en motif (recommandations des distributeurs), sinon marge.
    const forfaits = {
      1: { taux: 15, source: 'forfait courant des distributeurs pour la diagonale (12 à 15 %), à vérifier' },
      2: { taux: 15, source: 'forfait courant des distributeurs pour les chevrons (10 à 15 %), à vérifier' },
    };
    const { taux, source } = v.tauxChute > 0
      ? { taux: v.tauxChute, source: 'taux saisi' }
      : forfaits[v.poseLames] ?? { taux: v.marge, source: 'marge saisie pour la pose droite' };
    return {
      surface,
      tauxChute: taux,
      sourceChute: source,
      lames: Math.ceil((surface * (1 + taux / 100)) / surfaceLame - 1e-9),
      tasseaux: Math.ceil(lineaireTasseaux / v.longueurTasseau - 1e-9),
      fixations: Math.ceil(surface * v.fixationsM2 - 1e-9),
      rouleauxPareP: v.pareP ? Math.ceil((surface * 1.1) / v.surfacePareP - 1e-9) : 0,
    };
  },

  devis: [
    { resultat: 'lames', designation: 'Lames de lambris ou de bardage', unite: 'lame', prixChamp: 'prixLame', detail: '{surface} m², pose {poseLames:libelle}, {tauxChute} % de chute, lames de {longueurLame} m' },
    { resultat: 'tasseaux', designation: 'Tasseaux', unite: 'tasseau', prixChamp: 'prixTasseau', detail: 'Entraxe {entraxe} cm' },
    { resultat: 'fixations', designation: 'Fixations de lames', unite: 'pièce', complement: true },
    { resultat: 'rouleauxPareP', designation: 'Pare-pluie', unite: 'rouleau', complement: true },
  ],

  explication: `
        <p>Lames = surface × (1 + marge) ÷ (largeur utile × longueur d’une lame). La largeur utile ne compte pas la languette qui s’emboîte dans la lame voisine.</p>
        <p>Les tasseaux sont posés perpendiculairement aux lames, à l’entraxe choisi : verticaux sous des lames horizontales, horizontaux sous des lames verticales.</p>`,

  erreurs: [
    'Oublier la lame d’air ventilée derrière un bardage extérieur.',
    'Fixer les lames avec des pointes non inoxydables : elles tachent le bois.',
    'Oublier l’acclimatation des lames de lambris dans la pièce avant la pose.',
    'Bloquer les lames en haut et en bas : le bois doit pouvoir travailler.',
  ],

  conseils: [
    'Posez les tasseaux perpendiculairement au sens des lames, à l’entraxe indiqué par le fabricant.',
    'En bardage, posez un pare-pluie sur l’isolant et des grilles anti-rongeurs en bas et en haut de la lame d’air.',
    'Traitez les coupes en bout de lame.',
    'Contrôlez régulièrement l’aplomb pendant la pose.',
  ],

  normes: [
    {
      titre: 'NF DTU 41.2',
      url: 'https://www.batirama.com/article/1964-la-liste-des-dtu-documents-techniques-unifies-a-jour.html',
      description: 'revêtements extérieurs en bois (bardages)',
    },
    {
      titre: 'NF DTU 45.4',
      url: 'https://www.boutique.afnor.org/fr-fr/norme/nf-dtu-454/travaux-de-batiment-systemes-disolation-thermique-par-lexterieur-en-bardage/fa207402/343524',
      description: 'isolation thermique par l’extérieur en bardage rapporté avec lame d’air ventilée',
    },
  ],

  lies: ['isolation-exterieur', 'peinture-facade', 'quantite-plinthes'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Faut-il traiter le bois d’un bardage ?',
      reponse: 'Selon l’essence et la classe d’emploi : certaines essences s’utilisent brutes et grisent naturellement, d’autres demandent un traitement ou une finition (lasure, saturateur) renouvelée régulièrement.',
    },
    {
      question: 'Pose horizontale ou verticale ?',
      reponse: 'Les deux sont possibles. En pose horizontale, la languette se place vers le haut pour que l’eau ne pénètre pas dans l’assemblage. La pose verticale facilite l’écoulement de l’eau en bardage et allonge visuellement le mur.',
    },
    {
      question: 'Faut-il une lame d’air derrière un bardage ?',
      reponse: 'Oui : un bardage extérieur se pose sur tasseaux avec une lame d’air ventilée, ouverte en bas et en haut, pour que le bois sèche des deux côtés. Le NF DTU 41.2 en fixe l’épaisseur minimale à 2 cm, avec des entrées et sorties d’air de section suffisante.',
    },
  ],

  exemples: [
    {
      entrees: { usage: 0, poseLames: 0, tauxChute: 0, longueur: 4, hauteur: 2.5, ouvertures: 0, sens: 0, largeurUtile: 12, longueurLame: 2.5, entraxe: 50, pareP: 0, longueurTasseau: 2.4, fixationsM2: 20, surfacePareP: 75, marge: 10, prixLame: 0, prixTasseau: 0 },
      attendu: { surface: 10, lames: 37, tasseaux: 10, fixations: 200, rouleauxPareP: 0 },
    },
    {
      // En chevrons : forfait de 15 % ; 10 m² × 1,15 ÷ 0,30 m² par lame = 38,3 → 39 lames.
      entrees: { usage: 0, poseLames: 2, tauxChute: 0, longueur: 4, hauteur: 2.5, ouvertures: 0, sens: 0, largeurUtile: 12, longueurLame: 2.5, entraxe: 50, pareP: 0, longueurTasseau: 2.4, fixationsM2: 20, surfacePareP: 75, marge: 10, prixLame: 0, prixTasseau: 0 },
      attendu: { lames: 39, tauxChute: 15, sourceChute: 'forfait courant des distributeurs pour les chevrons (10 à 15 %), à vérifier' },
    },
  ],
};
