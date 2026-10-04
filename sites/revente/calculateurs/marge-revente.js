// Calculateur : bénéfice et marge d'une revente sur une plateforme.
export default {
  slug: 'marge-revente',
  titre: 'Calcul de marge sur une revente',
  rubrique: 'Marge sur une vente',
  teinte: 'marge',
  description: 'Calculez votre bénéfice réel et votre marge après commission de la plateforme, frais d’envoi et autres frais.',
  intro: 'Indiquez votre prix d’achat, votre prix de vente et les frais : le bénéfice qui vous reste s’affiche immédiatement.',
  categorie: 'FinanceApplication',

  champs: [
    { id: 'prixAchat', label: 'Prix d’achat de l’article', unite: '€', requis: true, min: 0 },
    { id: 'prixVente', label: 'Prix de vente', unite: '€', requis: true, min: 0 },
    { id: 'commissionPourcent', label: 'Commission de la plateforme', unite: '%', min: 0, max: 100, aide: 'Vérifiez le barème en vigueur sur votre plateforme.' },
    { id: 'commissionFixe', label: 'Frais fixes par vente', unite: '€', min: 0 },
    { id: 'fraisEnvoi', label: 'Frais d’envoi à votre charge', unite: '€', min: 0 },
    { id: 'autresFrais', label: 'Autres frais', unite: '€', min: 0, aide: 'Emballage, nettoyage, réparation…' },
  ],

  resultats: [
    { id: 'benefice', label: 'Bénéfice', format: 'euros', principal: true },
    { id: 'margePourcent', label: 'Marge sur le prix de vente', format: 'pourcent' },
    { id: 'coefficient', label: 'Coefficient de revente (vente ÷ achat)', format: 'nombre' },
    { id: 'commission', label: 'Commission totale prélevée', format: 'euros' },
  ],

  calculer(v) {
    const commission = (v.prixVente * v.commissionPourcent) / 100 + v.commissionFixe;
    const benefice = v.prixVente - commission - v.fraisEnvoi - v.autresFrais - v.prixAchat;
    return {
      commission,
      benefice,
      margePourcent: v.prixVente > 0 ? (benefice / v.prixVente) * 100 : null,
      coefficient: v.prixAchat > 0 ? v.prixVente / v.prixAchat : null,
    };
  },

  explication: `
        <p>Commission = prix de vente × commission en % + frais fixes.</p>
        <p>Bénéfice = prix de vente − commission − frais d’envoi − autres frais − prix d’achat.</p>
        <p>La marge est le bénéfice rapporté au prix de vente. Les impôts et cotisations éventuels ne sont pas déduits.</p>`,

  faq: [
    {
      question: 'Pourquoi le coefficient affiche-t-il un tiret ?',
      reponse: 'Le coefficient divise le prix de vente par le prix d’achat. Avec un prix d’achat à 0 (article reçu ou donné), la division est impossible.',
    },
    {
      question: 'Les commissions sont-elles à jour ?',
      reponse: 'Le calculateur n’impose aucun barème : vous saisissez la commission de votre plateforme, que vous pouvez vérifier dans ses conditions de vente.',
    },
  ],

  exemples: [
    {
      entrees: { prixAchat: 10, prixVente: 25, commissionPourcent: 5, commissionFixe: 0.7, fraisEnvoi: 0, autresFrais: 0 },
      attendu: { commission: 1.95, benefice: 13.05, margePourcent: 52.2, coefficient: 2.5 },
    },
    {
      entrees: { prixAchat: 0, prixVente: 0, commissionPourcent: 0, commissionFixe: 0, fraisEnvoi: 0, autresFrais: 0 },
      attendu: { benefice: 0, margePourcent: null, coefficient: null },
    },
  ],
};
