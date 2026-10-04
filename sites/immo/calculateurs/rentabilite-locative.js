// Calculateur : rentabilité locative brute et nette.
export default {
  slug: 'rentabilite-locative',
  titre: 'Calcul de rentabilité locative',
  rubrique: 'Rentabilité locative',
  teinte: 'rentabilite',
  description: 'Calculez la rentabilité brute et nette d’un investissement locatif à partir du prix, des frais de notaire, des travaux, du loyer et des charges.',
  intro: 'Rendement brut et net à partir du prix, des frais d’acquisition, des travaux et des charges réelles.',
  categorie: 'FinanceApplication',

  champs: [
    { id: 'prix', label: 'Prix d’achat', unite: '€', requis: true, min: 1, aide: 'Net vendeur, hors frais d’agence.' },
    { id: 'notaire', label: 'Frais de notaire', unite: '€', min: 0, aide: 'Estimation dans l’ancien, à affiner selon le département.' },
    { id: 'travaux', label: 'Travaux', unite: '€', min: 0, aide: 'Montant de votre devis de travaux.' },
    { id: 'loyer', label: 'Loyer mensuel hors charges', unite: '€ / mois', requis: true, min: 0 },
    { id: 'charges', label: 'Charges non récupérables', unite: '€ / an', min: 0, aide: 'Taxe foncière, assurance, copropriété, gestion.' },
  ],

  resultats: [
    { id: 'nette', label: 'Rendement net', format: 'pourcent', principal: true },
    { id: 'brute', label: 'Rendement brut', format: 'pourcent' },
    { id: 'loyersAnnuels', label: 'Loyers annuels', format: 'euros' },
    { id: 'revenuNetMensuel', label: 'Revenu net mensuel, avant crédit et impôts', format: 'euros' },
    { id: 'coutTotal', label: 'Coût total de l’acquisition', format: 'euros' },
  ],

  // Fonction pure et autonome : elle est recopiée telle quelle dans le navigateur.
  calculer(v) {
    const coutTotal = v.prix + v.notaire + v.travaux;
    const loyersAnnuels = v.loyer * 12;
    const revenuNetAnnuel = loyersAnnuels - v.charges;
    return {
      brute: v.prix > 0 ? (loyersAnnuels / v.prix) * 100 : null,
      nette: coutTotal > 0 ? (revenuNetAnnuel / coutTotal) * 100 : null,
      loyersAnnuels,
      revenuNetMensuel: revenuNetAnnuel / 12,
      coutTotal,
    };
  },

  explication: `
        <p>Le <strong>rendement brut</strong> rapporte les loyers annuels au prix d’achat : loyer mensuel × 12 ÷ prix × 100.</p>
        <p>Le <strong>rendement net</strong> retire les charges non récupérables des loyers et ajoute les frais de notaire et les travaux au coût du bien : (loyers annuels − charges) ÷ (prix + notaire + travaux) × 100.</p>
        <p>Ni le crédit ni la fiscalité ne sont pris en compte. Ces résultats décrivent des faits calculés et ne constituent pas un conseil en investissement.</p>`,

  faq: [
    {
      question: 'Quelle différence entre rendement brut et net ?',
      reponse: 'Le rendement brut ignore les frais et les charges. Le net les intègre et donne une image plus proche de ce que le bien rapporte réellement.',
    },
    {
      question: 'Pourquoi mon résultat diffère-t-il de celui d’une agence ?',
      reponse: 'Les annonces affichent souvent le rendement brut, plus flatteur. Vérifiez aussi quelles charges ont été comptées.',
    },
  ],

  exemples: [
    {
      entrees: { prix: 185000, notaire: 14060, travaux: 25000, loyer: 1150, charges: 2400 },
      attendu: { brute: 7.4595, nette: 5.0880, loyersAnnuels: 13800, revenuNetMensuel: 950, coutTotal: 224060 },
    },
  ],
};
