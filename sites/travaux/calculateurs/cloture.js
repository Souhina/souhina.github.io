// Calculateur : clôture en panneaux rigides ou en grillage souple (poteaux, scellement, accessoires).
export default {
  slug: 'cloture',
  titre: 'Calcul d’une clôture : panneaux, grillage et poteaux',
  rubrique: 'Clôture',
  lot: 'exterieurs',
  ordre: 2,
  teinte: 'exterieur',
  description: 'Calculez le nombre de panneaux rigides ou de rouleaux de grillage, de poteaux, et le béton de scellement pour une clôture.',
  intro: 'Indiquez la longueur de la clôture et le nombre d’angles : chaque angle ajoute un poteau.',
  categorie: 'UtilitiesApplication',

  // Aide au choix : questions fermées qui préremplissent les champs de type liste ou case.
  aideAuChoix: {
    questions: [
      { id: 'occultant', question: 'Voulez-vous masquer la vue ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
      { id: 'budget', question: 'Le petit budget et la grande longueur sont-ils prioritaires ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
      { id: 'muret', question: 'Les poteaux seront-ils fixés sur un muret ou une dalle ?', options: [{ valeur: 'oui', libelle: 'Oui' }, { valeur: 'non', libelle: 'Non' }] },
    ],
    regles: [
      { si: { occultant: 'oui' }, alors: { type: { valeur: 0, raison: 'car les panneaux rigides acceptent des lamelles d’occultation' } } },
      { si: { budget: 'oui' }, alors: { type: { valeur: 1, raison: 'le plus économique sur de grandes longueurs' } } },
      { si: {}, alors: { type: { valeur: 0, raison: '' } } },
      { si: { muret: 'oui' }, alors: { scellement: { valeur: 1, raison: '' } } },
      { si: {}, alors: { scellement: { valeur: 0, raison: '' } } },
    ],
  },

  champs: [
    {
      id: 'type',
      type: 'choix',
      label: 'Type de clôture',
      defaut: 0,
      options: [
        { valeur: 0, libelle: 'Panneaux rigides' },
        { valeur: 1, libelle: 'Grillage souple en rouleau' },
      ],
    },
    { id: 'longueur', label: 'Longueur de la clôture', unite: 'm', requis: true, min: 1, max: 1000, defaut: 25 },
    { id: 'angles', label: 'Nombre d’angles', min: 0, max: 50, defaut: 1 },
    { id: 'largeurPanneau', label: 'Largeur d’un panneau, ou écart entre poteaux pour le grillage', unite: 'm', requis: true, min: 0.5, max: 5, defaut: 2.5 },
    { id: 'longueurRouleau', label: 'Longueur d’un rouleau de grillage', unite: 'm', min: 5, defaut: 25 },
    {
      id: 'scellement',
      type: 'choix',
      label: 'Fixation des poteaux',
      defaut: 0,
      options: [
        { valeur: 0, libelle: 'Scellés au béton' },
        { valeur: 1, libelle: 'Sur platines, fixées sur un muret ou une dalle' },
      ],
    },
    { id: 'coteTrou', avance: true, label: 'Côté du trou de scellement', unite: 'cm', min: 10, defaut: 30 },
    { id: 'profondeurTrou', avance: true, label: 'Profondeur du trou de scellement', unite: 'cm', min: 20, defaut: 50 },
    { id: 'rendementSac', avance: true, label: 'Béton obtenu avec un sac prêt à gâcher', unite: 'litres', min: 1, defaut: 12 },
    { id: 'prixPanneau', label: 'Prix d’un panneau', unite: '€', min: 0 },
    { id: 'prixRouleau', label: 'Prix d’un rouleau de grillage', unite: '€', min: 0 },
    { id: 'prixPoteau', label: 'Prix d’un poteau', unite: '€', min: 0 },
    { id: 'prixSac', label: 'Prix d’un sac de béton', unite: '€', min: 0 },
  ],

  resultats: [
    { id: 'poteaux', label: 'Poteaux', format: 'nombre', principal: true },
    { id: 'panneaux', label: 'Panneaux rigides', format: 'nombre' },
    { id: 'rouleaux', label: 'Rouleaux de grillage', format: 'nombre' },
    { id: 'filTension', label: 'Fil de tension (3 rangs)', format: 'nombre', unite: 'm' },
    { id: 'sacsBeton', label: 'Sacs de béton prêt à gâcher', format: 'nombre' },
  ],

  calculer(v) {
    const panneauxRigides = v.type === 0;
    // Chaque angle interrompt la ligne : un poteau de plus.
    const travees = Math.ceil(v.longueur / v.largeurPanneau - 1e-9);
    const poteaux = travees + 1 + Math.round(v.angles);
    const volumeParTrou = (v.coteTrou / 100) ** 2 * (v.profondeurTrou / 100);
    return {
      poteaux,
      panneaux: panneauxRigides ? travees : null,
      rouleaux: panneauxRigides ? null : Math.ceil((v.longueur * 1.05) / v.longueurRouleau - 1e-9),
      filTension: panneauxRigides ? null : Math.ceil(3 * v.longueur * 1.05),
      sacsBeton: v.scellement === 0 ? Math.ceil((poteaux * volumeParTrou * 1000) / v.rendementSac - 1e-9) : 0,
    };
  },

  devis: [
    { resultat: 'panneaux', designation: 'Panneaux de clôture', unite: 'panneau', prixChamp: 'prixPanneau', detail: '{longueur} m de clôture, panneaux de {largeurPanneau} m' },
    { resultat: 'rouleaux', designation: 'Grillage', unite: 'rouleau', prixChamp: 'prixRouleau', detail: '{longueur} m de clôture, rouleaux de {longueurRouleau} m' },
    { resultat: 'poteaux', designation: 'Poteaux de clôture', unite: 'poteau', prixChamp: 'prixPoteau', detail: '{angles} angle(s)' },
    { resultat: 'filTension', designation: 'Fil de tension', unite: 'm', complement: true },
    { resultat: 'sacsBeton', designation: 'Béton de scellement', unite: 'sac', prixChamp: 'prixSac', complement: true, detail: 'Trous de {coteTrou} × {coteTrou} cm sur {profondeurTrou} cm' },
  ],

  explication: `
        <p>Travées = longueur ÷ largeur d’un panneau (ou écart entre poteaux pour le grillage). Poteaux = travées + 1, plus un par angle.</p>
        <p>Pour le scellement, chaque trou fait côté × côté × profondeur : un trou de 30 × 30 cm sur 50 cm contient 45 litres, soit 4 sacs de béton prêt à gâcher de 12 litres.</p>`,

  erreurs: [
    'Oublier les démarches : une clôture peut être soumise à déclaration préalable selon la commune.',
    'Se tromper de limite de propriété : un bornage évite les litiges.',
    'Sous-estimer le scellement des poteaux exposés au vent, surtout avec des panneaux occultants.',
    'Oublier les poteaux d’angle, de départ et de portail, et les accessoires de fixation.',
  ],

  conseils: [
    'Consultez le plan local d’urbanisme : hauteur, aspect et couleur de la clôture peuvent être imposés.',
    'Tendez un cordeau entre les poteaux d’extrémité avant de sceller les poteaux intermédiaires.',
    'Vérifiez l’entraxe des poteaux sur la notice des panneaux avant de creuser.',
  ],

  normes: [
    {
      titre: 'Plan local d’urbanisme',
      description: 'règles de hauteur et d’aspect des clôtures, à consulter en mairie',
    },
  ],

  lies: ['calcul-beton', 'terrasse-lames', 'pavage-allee'],

  majLe: '2026-10-01',

  faq: [
    {
      question: 'Faut-il une déclaration préalable pour une clôture ?',
      reponse: 'Cela dépend de la commune : certaines l’exigent, et le plan local d’urbanisme peut fixer une hauteur ou un aspect. Renseignez-vous en mairie avant les travaux.',
    },
    {
      question: 'À quelle profondeur sceller les poteaux ?',
      reponse: 'En repère courant, 40 à 60 cm selon la hauteur de la clôture, sa prise au vent et la nature du sol : une clôture occultante, qui offre beaucoup de prise au vent, demande un scellement plus profond. La notice du fabricant fait foi.',
    },
    {
      question: 'Quelle hauteur maximale pour une clôture ?',
      reponse: 'Il n’existe pas de hauteur maximale unique : c’est le plan local d’urbanisme, ou le règlement du lotissement, qui la fixe le plus souvent, parfois avec un aspect imposé. Renseignez-vous en mairie avant de choisir vos panneaux.',
    },
    {
      question: 'Panneaux rigides ou grillage souple ?',
      reponse: 'Les panneaux rigides se posent vite, restent droits et ne demandent pas de fils de tension. Le grillage souple coûte moins cher sur de grandes longueurs, mais demande des fils de tension et des jambes de force aux angles.',
    },
  ],

  exemples: [
    {
      entrees: { type: 0, longueur: 25, angles: 1, largeurPanneau: 2.5, longueurRouleau: 25, scellement: 0, coteTrou: 30, profondeurTrou: 50, rendementSac: 12, prixPanneau: 0, prixRouleau: 0, prixPoteau: 0, prixSac: 0 },
      attendu: { panneaux: 10, poteaux: 12, sacsBeton: 45, rouleaux: null },
    },
    {
      entrees: { type: 1, longueur: 40, angles: 2, largeurPanneau: 2.5, longueurRouleau: 25, scellement: 1, coteTrou: 30, profondeurTrou: 50, rendementSac: 12, prixPanneau: 0, prixRouleau: 0, prixPoteau: 0, prixSac: 0 },
      attendu: { poteaux: 19, rouleaux: 2, filTension: 126, sacsBeton: 0, panneaux: null },
    },
  ],
};
