// Calculateur : peinture de façade, sans plan (façades, pignons, ouvertures).
export default {
  slug: 'peinture-facade',
  titre: 'Calcul de peinture de façade',
  rubrique: 'Peinture de façade',
  lot: 'facades',
  ordre: 3,
  teinte: 'facade',
  description: 'Calculez la surface de façade, pignons compris, les litres et les pots de peinture de façade et de fixateur.',
  intro: 'Indiquez le tour de la maison, la hauteur des murs et les pignons : le calcul déduit les ouvertures et tient compte du rendement plus faible sur un support rugueux.',
  categorie: 'UtilitiesApplication',
  avertissement: 'ce calculateur estime des quantités. Le support doit être sain, propre et sec ; les fissures se traitent avant peinture, et les conditions de température et d’humidité à l’application sont indiquées sur le pot.',

  // Façade dessinée de face (pignon et ouvertures compris), ou dimensions saisies.
  // Aide au choix : questions fermées qui préremplissent les champs de type liste ou case.
  aideAuChoix: {
    questions: [
      { id: 'support', question: 'Sur quel support ?', options: [{ valeur: 'ancien', libelle: 'Un mur ancien : pierre, chaux ou terre' }, { valeur: 'ciment', libelle: 'Un enduit ciment ou du béton' }, { valeur: 'peint', libelle: 'Une façade déjà peinte' }] },
      { id: 'pluie', question: 'La façade est-elle très exposée à la pluie ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
      { id: 'frais', question: 'Peindrez-vous par temps frais ou humide (automne, hiver) ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
      { id: 'farinant', question: 'Le support farine-t-il quand on passe la main dessus, ou est-il poreux ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
    ],
    regles: [
      { si: { support: 'ancien' }, alors: { typePeinture: { valeur: 3, raison: 'perméable à la vapeur d’eau, adaptée aux maçonneries anciennes ; vérifiez la compatibilité avec le support' } } },
      { si: { frais: 'oui' }, alors: { typePeinture: { valeur: 1, raison: 'elle s’applique par temps plus frais et humide, voyez la notice' } } },
      { si: { pluie: 'oui' }, alors: { typePeinture: { valeur: 2, raison: 'hydrofuge et microporeuse' } } },
      { si: {}, alors: { typePeinture: { valeur: 0, raison: 'la plus courante sur enduit ciment ou béton' } } },
      { si: { farinant: 'oui' }, alors: { fixateur: { valeur: 1, raison: 'pour fixer un support farineux ou poreux' } } },
      { si: { farinant: 'non' }, alors: { fixateur: { valeur: 0, raison: 'souvent inutile sur un support sain, voyez la notice de la peinture' } } },
    ],
  },

  plan: { nature: 'mur', saisie: true },

  champs: [
    { id: 'perimetre', saisie: true, suggestionChantier: 'longueurFacades', label: 'Longueur totale des façades à peindre', unite: 'm', requis: true, min: 0.5, defaut: 40 },
    { id: 'hauteur', saisie: true, label: 'Hauteur des murs, jusqu’à l’égout du toit', unite: 'm', requis: true, min: 0.5, defaut: 5.5 },
    { id: 'pignons', saisie: true, label: 'Nombre de pignons', min: 0, defaut: 2 },
    { id: 'largeurPignon', saisie: true, label: 'Largeur d’un pignon', unite: 'm', min: 0, defaut: 8 },
    { id: 'hauteurPignon', saisie: true, label: 'Hauteur d’un pignon', unite: 'm', min: 0, defaut: 3 },
    { id: 'ouvertures', saisie: true, label: 'Surface des portes et fenêtres', unite: 'm²', min: 0, defaut: 30 },
    { id: 'tableaux', suggestionChantier: 'surfaceTableauxExterieurs', label: 'Retours de tableau', unite: 'm²', min: 0, defaut: 0, aide: 'Côtés, dessus et appuis des ouvertures, sur l’épaisseur du mur.' },
    {
      id: 'typePeinture',
      type: 'choix',
      label: 'Type de peinture',
      defaut: 0,
      aide: 'Même calcul pour tous les types ; le rendement dépend du produit, voyez le pot.',
      options: [
        { valeur: 0, libelle: 'Acrylique, en phase aqueuse' },
        { valeur: 1, libelle: 'Pliolite, en phase solvant' },
        { valeur: 2, libelle: 'Siloxane' },
        { valeur: 3, libelle: 'Minérale : silicate ou chaux' },
      ],
    },
    { id: 'couches', label: 'Nombre de couches', requis: true, min: 1, max: 4, defaut: 2 },
    { id: 'rendement', label: 'Rendement de la peinture', unite: 'm² par litre', requis: true, min: 1, defaut: 6, aide: 'Indiqué sur le pot pour une couche ; plus faible sur un crépi ou un enduit rugueux (souvent 4 à 8).' },
    { id: 'contenance', label: 'Contenance d’un pot', unite: 'litres', requis: true, min: 0.5, defaut: 10 },
    { id: 'fixateur', type: 'case', label: 'Prévoir un fixateur ou une impression', defaut: true, aide: 'Sur un support farineux, poreux ou neuf.' },
    { id: 'rendementFixateur', avance: true, label: 'Rendement du fixateur', unite: 'm² par litre', min: 1, defaut: 8 },
    { id: 'prixPot', label: 'Prix d’un pot de peinture', unite: '€', min: 0 },
    { id: 'prixPotFixateur', label: 'Prix d’un pot de fixateur', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'pots', equivalent: { champ: 'contenance', unite: 'L' }, label: 'Pots de peinture', format: 'nombre', principal: true },
    { id: 'litres', label: 'Peinture nécessaire', format: 'nombre', unite: 'L' },
    { id: 'surface', label: 'Surface à peindre', format: 'nombre', unite: 'm²' },
    { id: 'potsFixateur', equivalent: { champ: 'contenance', unite: 'L' }, label: 'Pots de fixateur', format: 'nombre' },
  ],

  calculer(v, plan) {
    // Dessin : surface de la face, pignon compris et ouvertures déduites ; « Tous les murs » additionne les faces.
    const surface = plan ? plan.surface + (v.tableaux ?? 0) : Math.max(0, v.perimetre * v.hauteur + (v.pignons * v.largeurPignon * v.hauteurPignon) / 2 - v.ouvertures + (v.tableaux ?? 0));
    const litres = Math.round(((surface * v.couches) / v.rendement) * 10) / 10;
    return {
      surface,
      litres,
      pots: Math.ceil(litres / v.contenance - 1e-9),
      potsFixateur: v.fixateur ? Math.ceil(surface / v.rendementFixateur / v.contenance - 1e-9) : 0,
    };
  },

  devis: [
    { resultat: 'pots', designation: 'Peinture de façade', unite: 'pot', prixChamp: 'prixPot', detail: '{surface} m², {couches} couches, pots de {contenance} L, peinture {typePeinture:libelle}' },
    { resultat: 'potsFixateur', designation: 'Fixateur ou impression de façade', unite: 'pot', prixChamp: 'prixPotFixateur', complement: true },
  ],

  explication: `
        <p>Surface = longueur des façades × hauteur, plus les pignons (largeur × hauteur ÷ 2), moins les ouvertures. Litres = surface × couches ÷ rendement.</p>
        <p>Pour 214 m² en deux couches à 6 m² par litre, il faut environ 71 litres, soit 8 pots de 10 litres.</p>`,

  erreurs: [
    'Peindre une façade sale, moussue ou farinante.',
    'Peindre en plein soleil, par temps humide ou quand un risque de gel existe dans la nuit.',
    'Recouvrir un mur ancien d’une peinture qui empêche la vapeur d’eau de s’échapper.',
    'Peindre sans traiter les fissures.',
  ],

  conseils: [
    'Nettoyez et traitez la façade contre les mousses avant de peindre.',
    'Rebouchez les fissures avec un produit adapté à leur largeur.',
    'Appliquez un fixateur si le support est poreux ou farinant.',
  ],

  normes: [
    {
      titre: 'NF DTU 59.1',
      url: 'https://www.batirama.com/article/11276-nf-dtu-59.1-revetements-de-peinture.html',
      description: 'travaux de peinture des bâtiments',
    },
    {
      titre: 'NF DTU 42.1',
      url: 'https://www.batirama.com/article/1964-la-liste-des-dtu-documents-techniques-unifies-a-jour.html',
      description: 'réfection de façades par revêtements d’imperméabilité',
    },
  ],

  lies: ['enduit-facade', 'lambris-bardage', 'quantite-peinture'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Pourquoi le rendement est-il plus faible en façade ?',
      reponse: 'Un crépi ou un enduit rugueux présente une surface réelle bien plus grande qu’un mur lisse, et il absorbe davantage : la peinture couvre moins de m² par litre.',
    },
  ],

  exemples: [
    {
      entrees: { perimetre: 40, hauteur: 5.5, pignons: 2, largeurPignon: 8, hauteurPignon: 3, ouvertures: 30, couches: 2, rendement: 6, contenance: 10, fixateur: 1, rendementFixateur: 8, prixPot: 0, prixPotFixateur: 0 },
      attendu: { surface: 214, litres: 71.3, pots: 8, potsFixateur: 3 },
    },
  ],
};
