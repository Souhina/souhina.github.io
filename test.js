// test.js
// Vérifie chaque calculateur de chaque site à partir de ses "exemples".
// Deux contrôles par exemple :
//   1. la formule donne le résultat attendu ;
//   2. la formule recopiée pour le navigateur (formule.js) donne le même résultat,
//      ce qui détecte une formule qui dépend d'une variable extérieure.
// Lancer avant chaque mise en ligne : node test.js

import { listerSites, chargerSite, serialiserFormule, verifierCalculateur } from './build.js';
import { lireNombre, formater } from './moteur/nombres.js';
import * as geo from './moteur/geometrie.js';
import { genererRecapitulatif } from './moteur/pdf.js';
import { equivalentImperial } from './moteur/nombres.js';
import { chargerChantier, pieceActive, nomLibre } from './moteur/chantier.js';
import { contourExterieur, totauxMurs, normaliserMurs, insererAngleMurs, supprimerAngleMurs } from './moteur/murs.js';
import { versEnsemble, disposer, aimanter, chevauchements, normaliserPosition } from './moteur/ensemble.js';
import { mursCommuns, infosPiece, mesures, piecesDePortee, normaliserNiveaux, niveauDe, normaliserElements } from './moteur/chantier-plan.js';
import { evaluerAideAuChoix, verifierAideAuChoix } from './moteur/aide-choix.js';
import { encoderPartage, decoderPartage, groupeLigne, resumeTexte, lienMailto, LIMITE_MAILTO } from './moteur/panier.js';
import { normaliserOuvertures, totauxOuvertures, insererAngle, supprimerAngle, appliquerOuvertures, emplacementLibre } from './moteur/ouvertures.js';

const tolerance = 0.01;
let reussis = 0;
let echecs = 0;

function egal(obtenu, attendu) {
  if (attendu === null) return obtenu === null;
  if (typeof attendu === 'string') return obtenu === attendu;
  return typeof obtenu === 'number' && Math.abs(obtenu - attendu) <= tolerance;
}

function verifier(condition, libelle) {
  if (condition) {
    reussis += 1;
  } else {
    echecs += 1;
    console.error(`  ✗ ${libelle}`);
  }
}

// Utilitaires du moteur
verifier(lireNombre('1 250,50') === 1250.5, 'lireNombre("1 250,50") vaut 1250.5');
verifier(lireNombre('') === null, 'lireNombre("") vaut null');
verifier(Number.isNaN(lireNombre('12abc')), 'lireNombre("12abc") vaut NaN');
verifier(formater(null, 'euros') === '—', 'formater(null) affiche un tiret');
verifier(formater(7.2, 'pourcent') === '7,20\u00a0%', 'formater(7.2, "pourcent") affiche "7,20 %"');
verifier(formater(12.5, 'nombre', 'm²') === '12,5\u00a0m²', 'formater(12.5, "nombre", "m²") affiche "12,5 m²"');

// Géométrie
const pieceEnL = [[0, 0], [500, 0], [500, 250], [300, 250], [300, 400], [0, 400]];
verifier(geo.aire([[0, 0], [400, 0], [400, 300], [0, 300]]) === 120000, 'aire d’un rectangle 4 m × 3 m = 120 000 cm²');
verifier(geo.aire(pieceEnL) === 170000, 'aire de la pièce en L = 17 m²');
verifier(geo.perimetre(pieceEnL) === 1800, 'périmètre de la pièce en L = 18 m');
verifier(geo.estSimple(pieceEnL), 'la pièce en L est une forme valide');
verifier(!geo.estSimple([[0, 0], [100, 100], [100, 0], [0, 100]]), 'une forme en nœud papillon est refusée');
verifier(!geo.estSimple([[0, 0], [100, 0]]), 'une forme à deux angles est refusée');
const decoupe = geo.decouper(pieceEnL, { x0: 250, y0: 200, x1: 350, y1: 300 });
verifier(Math.abs(geo.aire(decoupe) - 7500) < 1e-6, 'découpe d’un carreau à cheval sur l’angle rentrant du L = 7 500 cm²');
const poseDroite = geo.calepiner([[0, 0], [300, 0], [300, 200], [0, 200]], { largeur: 30, longueur: 60 });
verifier(poseDroite.entiers === 30 && poseDroite.coupes === 10 && poseDroite.carreauxPourCoupes === 5, 'calepinage 3 m × 2 m en 30 × 60 : 30 entiers, 10 coupes, 5 carreaux pour les coupes');
const poseDiagonale = geo.calepiner([[0, 0], [300, 0], [300, 200], [0, 200]], { largeur: 30, longueur: 30, type: 'diagonale' });
verifier(poseDiagonale.coupes > poseDroite.coupes, 'la pose diagonale produit plus de coupes que la pose droite');

// Récapitulatif PDF : structure valide et table des positions (xref) exacte
const pdf = genererRecapitulatif({
  lignes: [
    { designation: 'Carrelage – Cuisine', lot: 'Revêtements de sols', quantite: 18, unite: 'carton', prixUnitaire: 34.9, detail: '17 m², carreaux 30 × 60 cm' },
    { designation: 'Plaques de plâtre (BA13)', lot: 'Plâtrerie et isolation', quantite: 9, unite: 'plaque', prixUnitaire: 0 },
  ],
  chantier: { nom: 'Maison Dupont', adresse: '12 rue des Écoles\n86200 Lencloître', etabliPar: '' },
  site: { nom: 'Métré', adresse: 'https://www.exemple-metre.fr/', accent: '#C2410C' },
  lienPartage: 'https://www.exemple-metre.fr/devis/#r=abc',
});
const textePdf = String.fromCharCode(...pdf);
verifier(textePdf.startsWith('%PDF-1.4') && textePdf.trimEnd().endsWith('%%EOF'), 'le PDF commence par %PDF-1.4 et se termine par %%EOF');
const debutXref = Number(/startxref\n(\d+)/.exec(textePdf)?.[1]);
verifier(textePdf.slice(debutXref, debutXref + 4) === 'xref', 'startxref pointe sur la table xref');
const positions = [...textePdf.slice(debutXref).matchAll(/^(\d{10}) 00000 n $/gm)].map((trouve) => Number(trouve[1]));
verifier(positions.length > 0 && positions.every((position, index) => textePdf.startsWith(`${index + 1} 0 obj`, position)), 'chaque entrée xref pointe sur son objet');
verifier(textePdf.includes('(Maison Dupont)') && !textePdf.includes('(Établi par)'), 'le PDF reprend le chantier et omet les informations laissées vides');
verifier(textePdf.includes('/URI (https://www.exemple-metre.fr/devis/#r=abc)'), 'le lien de partage est cliquable dans le PDF');

// Ouvertures placées sur le plan
{
  const rectangle = [[0, 0], [400, 0], [400, 300], [0, 300]];
  const liste = normaliserOuvertures([
    { type: 'porte', cote: 0, largeur: 83, hauteur: 204, position: 350 },
    { type: 'fenetre', cote: 1, largeur: 120, hauteur: 135, position: 90 },
    { type: 'inconnu', cote: 0, largeur: 50, hauteur: 50, position: 0 },
    { type: 'fenetre', cote: 9, largeur: 50, hauteur: 50, position: 0 },
  ], rectangle);
  verifier(liste.length === 2, 'ouvertures : les types inconnus et les côtés inexistants sont écartés');
  verifier(liste[0].position === 317, 'ouvertures : une porte qui dépasse du mur est ramenée à l’intérieur (400 − 83 = 317)');
  const totaux = totauxOuvertures(liste);
  verifier(Math.abs(totaux.surfaceOuvertures - 3.3132) < 1e-9 && totaux.largeurPortes === 0.83 && totaux.nombrePortes === 1, 'ouvertures : surface 3,3132 m², 0,83 m de portes, 1 porte');
  verifier(totaux.descriptionOuvertures === '1 porte, 1 fenêtre', 'ouvertures : description « 1 porte, 1 fenêtre »');

  // Angle ajouté au milieu du côté 0 (à 200 cm) : la porte (centre à 358 cm) passe sur le nouveau côté 1,
  // la fenêtre du côté 1 passe au côté 2.
  const apresInsertion = insererAngle(liste, rectangle, 0, [200, 0]);
  verifier(apresInsertion[0].cote === 1 && apresInsertion[0].position === 117 && apresInsertion[1].cote === 2, 'ouvertures : recalage après ajout d’un angle');
  // Suppression de cet angle : retour à la situation de départ.
  const pentagone = [[0, 0], [200, 0], [400, 0], [400, 300], [0, 300]];
  const apresSuppression = supprimerAngle(apresInsertion, pentagone, 1);
  verifier(apresSuppression[0].cote === 0 && Math.abs(apresSuppression[0].position - 317) < 1e-9 && apresSuppression[1].cote === 1, 'ouvertures : recalage après suppression d’un angle');

  // Nouvelle ouverture : jamais sur une autre. Sur un rectangle 400 × 300 avec une porte au milieu du mur A-B
  // (160 à 243 cm), le plus grand espace libre est le mur C-D, de 400 cm.
  const place = emplacementLibre([{ type: 'porte', cote: 0, largeur: 83, hauteur: 204, position: 160 }], rectangle, 120);
  verifier(place.cote === 2 && place.position === 140, 'ouvertures : une nouvelle ouverture va dans le plus grand espace libre, centrée');

  const champs = [{ id: 'ouvertures', remplacePar: 'surfaceOuvertures' }, { id: 'hauteur' }];
  verifier(appliquerOuvertures(champs, { ouvertures: 5, hauteur: 2.5 }, { ouvertures: [], surfaceOuvertures: 0 }).ouvertures === 5, 'ouvertures : sans ouverture sur le plan, le champ manuel est conservé');
  verifier(appliquerOuvertures(champs, { ouvertures: 5, hauteur: 2.5 }, { ouvertures: liste, ...totaux }).ouvertures === totaux.surfaceOuvertures, 'ouvertures : avec des ouvertures, le champ prend la valeur du plan');
}

// Guide enrichi : validation des nouvelles clés par build.js
{
  const base = (await import('./sites/travaux/calculateurs/beton.js')).default;
  const refuse = (modif, motif) => {
    let message = '';
    try {
      verifierCalculateur({ ...base, ...modif }, 'travaux');
    } catch (erreur) {
      message = erreur.message;
    }
    verifier(message.includes(motif), `build : refuse ${motif}`);
  };
  refuse({ majLe: '2026-02-30' }, 'majLe "2026-02-30" invalide');
  refuse({ majLe: '2999-01-01' }, 'dans le futur');
  refuse({ normes: [{ titre: 'DTU', url: 'http://exemple.fr' }] }, 'lien invalide');
  refuse({ normes: [{ url: 'https://exemple.fr' }] }, 'titre manquant');
  refuse({ erreurs: ['ok', ''] }, 'erreurs doit être une liste de textes non vides');
  let accepte = true;
  try {
    verifierCalculateur({ ...base, majLe: '2026-09-30', erreurs: ['Texte'], conseils: ['Texte'], normes: [{ titre: 'NF DTU', url: 'https://www.exemple.fr/norme' }], lies: ['cloture'] }, 'travaux');
  } catch {
    accepte = false;
  }
  verifier(accepte, 'build : accepte un guide complet et valide');
}

// Équivalents impériaux : une seule fonction de conversion, appelée à l'affichage
{
  const cas = [
    [12.5, 'm²', {}, '134,5 sq ft'],
    [35, 'kg', {}, '77 lb'],
    [0.5, 'kg', {}, '1,1 lb'],
    [2.5, 'm', {}, '8 ft 2 in'],
    [0.2, 'm', {}, '7,9 in'],
    [60, 'cm', {}, '23,6 in'],
    [2.52, 'm³', {}, '3,3 cu yd'],
    [10, 'L', {}, '2,2 gal (UK)'],
    [10, 'L', { gallon: 'us' }, '2,6 gal (US)'],
    [1.49, 't', {}, '3 285 lb'],
  ];
  for (const [valeur, unite, options, attendu] of cas) {
    verifier(equivalentImperial(valeur, unite, options)?.replace(/[\u00a0\u202f]/g, ' ') === attendu, `impérial : ${valeur} ${unite} → ${attendu}`);
  }
  verifier(equivalentImperial(1300, 'W') === null && equivalentImperial(Number.NaN, 'm') === null, 'impérial : unité non convertible ou valeur invalide → rien');

  const pdfImperial = String.fromCharCode(...genererRecapitulatif({
    imperial: { actif: true, gallon: 'uk' },
    lignes: [{ designation: 'Chape fluide', lot: 'Sols', quantite: 2.5, unite: 'm³', prixUnitaire: 0 }],
    site: { nom: 'Métré', adresse: 'https://www.exemple-metre.fr/', accent: '#C2410C' },
  }));
  verifier(pdfImperial.includes('soit 3,27 cu yd'), 'PDF : équivalent impérial ajouté au détail quand le réglage est actif');
}

// Envoi du récapitulatif : résumé texte et lien mailto:
{
  const lignes = [
    { designation: 'Carrelage', lot: 'Sols', piece: 'Cuisine', quantite: 18, unite: 'carton', prixUnitaire: 34.9 },
    { designation: 'Colle pour carrelage', lot: 'Sols', piece: 'Cuisine', quantite: 4, unite: 'sac', prixUnitaire: 0 },
    { designation: 'Peinture murs', lot: 'Murs intérieurs', piece: 'Chambre 1', quantite: 3, unite: 'pot', prixUnitaire: 39 },
    { designation: 'Enduit à joint', lot: 'Plâtrerie et isolation', piece: '', quantite: 1, unite: 'seau', prixUnitaire: 0 },
    { designation: 'Béton prêt à l’emploi', lot: 'Gros œuvre', piece: '', quantite: 2.5, unite: 'm³', prixUnitaire: 0 },
  ];
  const texte = resumeTexte({ lignes, chantier: { nom: 'Maison Dupont', adresse: '12 rue des Lilas\n86200 Loudun' }, tva: { active: true, taux: 20 }, siteNom: 'Métré', siteAdresse: 'https://www.exemple-metre.fr/' });
  verifier(texte.startsWith('Récapitulatif des besoins – Maison Dupont\nAdresse : 12 rue des Lilas, 86200 Loudun'), 'e-mail : titre et adresse sur une ligne');
  verifier(texte.includes('SOLS\n- Carrelage (Cuisine) : 18 cartons – 628,20') && texte.includes('- Colle pour carrelage (Cuisine) : 4 sacs\n'), 'e-mail : lignes groupées par corps de métier, avec pièce, pluriel et montant');
  verifier(texte.includes(': 1 seau') && texte.includes(': 2,5 m³'), 'e-mail : singulier gardé, symboles d’unité invariables');
  verifier(texte.includes('Total HT : 745,20') && texte.includes('Total TTC : 894,24'), 'e-mail : totaux HT et TTC');
  verifier(resumeTexte({ lignes, regroupement: 'piece' }).includes('CHAMBRE 1\n- Peinture murs (Murs intérieurs) : 3 pots'), 'e-mail : regroupement par pièce, corps de métier en précision');

  const court = lienMailto({ sujet: 'Récapitulatif – Maison Dupont', corps: 'Texte court', lienPartage: 'https://www.exemple-metre.fr/devis/#r=abc' });
  verifier(court.lienInclus && court.url.startsWith('mailto:?subject=R%C3%A9capitulatif') && court.url.includes('%0D%0A') && decodeURIComponent(court.url).includes('#r=abc'), 'e-mail : lien court inclus, retours à la ligne encodés');
  const long = lienMailto({ sujet: 'Récapitulatif', corps: 'Texte', lienPartage: `https://www.exemple-metre.fr/devis/#r=${'x'.repeat(3000)}` });
  verifier(!long.lienInclus && !long.abrege && long.url.length <= LIMITE_MAILTO && decodeURIComponent(long.url).includes('PDF joint'), 'e-mail : lien trop long remplacé par l’invitation à joindre le PDF');
  const tresLong = lienMailto({ sujet: 'Récapitulatif', corps: Array.from({ length: 80 }, (_, i) => `- Article ${i} : ${i + 1} cartons`).join('\n'), lienPartage: 'https://www.exemple-metre.fr/devis/#r=abc' });
  verifier(tresLong.abrege && tresLong.url.length <= LIMITE_MAILTO && decodeURIComponent(tresLong.url).includes('- Article 0 :') && decodeURIComponent(tresLong.url).includes('PDF joint'),
    'e-mail : résumé trop long abrégé sous la limite, avec renvoi au PDF');
}

// Formulaires : aucun champ obligatoire dans une section repliée (réglages avancés ou prix)
{
  const { pageCalculateur } = await import('./moteur/gabarits.js');
  for (const nomSite of await listerSites()) {
    const { site, calculateurs } = await chargerSite(nomSite);
    for (const calc of calculateurs) {
      const html = pageCalculateur(site, calc, calculateurs);
      const replies = [...html.matchAll(/<details class="groupe groupe-replie">([\s\S]*?)<\/details>/g)].map((m) => m[1]).join('');
      const caches = calc.champs.filter((champ) => champ.requis && replies.includes(`id="champ-${champ.id}"`)).map((champ) => champ.id);
      verifier(caches.length === 0, `${nomSite}/${calc.slug} : aucun champ obligatoire masqué dans une section repliée${caches.length ? ` (${caches.join(', ')})` : ''}`);
    }
  }
}

// Moteur : syntaxe de chaque script, y compris ceux qui ne tournent que dans le navigateur
// (une erreur de syntaxe bloque tout le script, sans que les autres contrôles la voient).
{
  const { readdir } = await import('node:fs/promises');
  const { execFileSync } = await import('node:child_process');
  for (const fichier of (await readdir('./moteur')).filter((nom) => nom.endsWith('.js'))) {
    let message = '';
    try {
      execFileSync(process.execPath, ['--check', `./moteur/${fichier}`], { stdio: 'pipe' });
    } catch (erreur) {
      message = String(erreur.stderr).split('\n').find((ligne) => ligne.includes('Error')) ?? 'erreur';
    }
    verifier(!message, `moteur/${fichier} : syntaxe valide${message ? ` (${message})` : ''}`);
  }
}

// Configuration transmise au navigateur : toutes les clés de champ et de résultat que calcul.js lit.
// (Une clé oubliée ici est silencieusement ignorée dans le navigateur.)
{
  const source = (await import('node:fs')).readFileSync('./moteur/gabarits.js', 'utf8');
  for (const cle of ['remplacePar', 'lienPiece', 'suggestionChantier', 'saisie', 'options']) verifier(new RegExp(`champs: calc\\.champs\\.map\\(\\(\\{[^}]*\\b${cle}\\b`).test(source), `configuration navigateur : la clé de champ « ${cle} » est transmise`);
  for (const cle of ['format', 'unite', 'equivalent', 'cumul']) verifier(new RegExp(`resultats: calc\\.resultats\\.map\\(\\(\\{[^}]*\\b${cle}\\b`).test(source), `configuration navigateur : la clé de résultat « ${cle} » est transmise`);
}

// Calculateurs : aucune clé de premier niveau en double. JavaScript ne garderait que la dernière,
// sans erreur (cas d'une liste « normes » ajoutée deux fois dans un même fichier).
{
  const { readdir, readFile } = await import('node:fs/promises');
  for (const nomSite of await listerSites()) {
    const dossier = `./sites/${nomSite}/calculateurs`;
    for (const fichier of await readdir(dossier)) {
      const source = await readFile(`${dossier}/${fichier}`, 'utf8');
      const cles = [...source.matchAll(/^ {2}(\w+):/gm)].map((m) => m[1]);
      const doublons = [...new Set(cles.filter((cle, index) => cles.indexOf(cle) !== index))];
      verifier(doublons.length === 0, `${nomSite}/${fichier} : aucune clé en double${doublons.length ? ` (${doublons.join(', ')})` : ''}`);
    }
  }
}

// Langues : chaque fichier de moteur/langues a exactement les mêmes clés que fr.js
{
  const { readdir } = await import('node:fs/promises');
  const fr = (await import('./moteur/langues/fr.js')).default;
  const cles = (objet, prefixe = '') => Object.entries(objet).flatMap(([cle, valeur]) =>
    valeur && typeof valeur === 'object' && !Array.isArray(valeur) ? cles(valeur, `${prefixe}${cle}.`) : [`${prefixe}${cle}`]);
  const reference = cles(fr).sort();
  verifier(reference.length > 200 && typeof fr.devis.lignesAjoutees(2) === 'string', `langues : fr.js complet (${reference.length} clés)`);
  for (const fichier of await readdir('./moteur/langues')) {
    const langue = (await import(`./moteur/langues/${fichier}`)).default;
    const manquantes = reference.filter((cle) => !cles(langue).includes(cle));
    verifier(manquantes.length === 0 && langue.code === fichier.replace('.js', ''), `langues : ${fichier} a toutes les clés de fr.js${manquantes.length ? ` (manquent : ${manquantes.slice(0, 5).join(', ')})` : ''}`);
  }
  const { cheminDe } = await import('./moteur/gabarits.js');
  verifier(cheminDe({ type: 'calculateur', calc: { slug: 'quantite-carrelage', slugs: { en: 'tile-calculator' } } }) === '/quantite-carrelage/' && cheminDe({ type: 'devis' }) === '/devis/',
    'langues : adresses de la langue par défaut, à la racine et sans préfixe');
}

// Widget intégrable : page sans habillage, et code d'intégration sûr
{
  const { pageWidget, codeIntegration, MESSAGE_WIDGET } = await import('./moteur/gabarits.js');
  const { site, calculateurs } = await chargerSite('travaux');
  const calc = calculateurs.find((element) => element.slug === 'quantite-carrelage');
  const widget = pageWidget(site, calc);
  const origine = new URL(site.domaine.startsWith('http') ? site.domaine : `https://${site.domaine}`).origin;
  verifier(widget.includes('<meta name="robots" content="noindex">') && widget.includes(`<link rel="canonical" href="${origine}/quantite-carrelage/">`), 'widget : noindex et lien canonique vers la page du calculateur');
  verifier(!/class="(entete|pied|menu-lots|pub-|barre-resultat)/.test(widget) && !widget.includes('ajouter-devis') && !widget.includes('adsbygoogle'), 'widget : sans en-tête, pied, menu, publicité, barre ni ajout au devis');
  verifier(widget.includes("get('theme') === 'nuit'") && widget.includes(`type: '${MESSAGE_WIDGET}'`), 'widget : thème par paramètre et envoi de la hauteur');
  verifier(!widget.includes('<div'), 'widget : aucun <div>');
  const code = codeIntegration(site, calc, 'nuit');
  verifier(code.includes(`src="${origine}/widget/quantite-carrelage/?theme=nuit"`) && code.includes(`e.origin !== '${origine}'`), 'intégration : source du widget et vérification de l’origine des messages');
  verifier(code.indexOf('</iframe>') < code.indexOf(`<a href="${origine}/quantite-carrelage/">`), 'intégration : lien texte visible, placé hors de l’iframe');
}

// Liens d'achat : PDF et lien de partage
{
  const lignes = [
    { designation: 'Carrelage', lot: 'Sols', quantite: 18, unite: 'carton', prixUnitaire: 0, achat: 'carrelage' },
    { designation: 'Colle', lot: 'Sols', quantite: 4, unite: 'sac', prixUnitaire: 0, achat: 'colle-non-configuree' },
  ];
  const pdf = String.fromCharCode(...genererRecapitulatif({ lignes, achats: { carrelage: 'https://partenaire.exemple/carrelage' }, site: { nom: 'Métré', adresse: 'https://www.exemple-metre.fr/', accent: '#C2410C' } }));
  verifier(pdf.includes('(Acheter \\(lien partenaire\\))') && pdf.includes('(https://partenaire.exemple/carrelage)'), 'PDF : lien « Acheter (lien partenaire) » cliquable sur la ligne configurée');
  verifier((pdf.match(/Acheter/g) ?? []).length === 1, 'PDF : pas de lien d’achat sans affiliation configurée');
  const sansAffiliation = String.fromCharCode(...genererRecapitulatif({ lignes, site: { nom: 'Métré', adresse: 'https://www.exemple-metre.fr/', accent: '#C2410C' } }));
  verifier(!sansAffiliation.includes('Acheter'), 'PDF : aucun lien d’achat quand l’affiliation n’est pas configurée');
  const retour = decoderPartage(encoderPartage(lignes, {}));
  verifier(retour.lignes[0].achat === 'carrelage', 'partage : la clé d’achat fait l’aller-retour dans le lien');
}

// Aide au choix : règles par priorité, phrase de recommandation, validation
{
  const plaques = (await import('./sites/travaux/calculateurs/plaques-platre.js')).default;
  const aide = plaques.aideAuChoix;
  const evaluer = (reponses) => evaluerAideAuChoix(aide, reponses, plaques.champs);
  verifier(evaluer({ humide: '', acoustique: '', feu: '' }).phrase === '', 'aide au choix : rien n’est recommandé sans réponse');
  verifier(evaluer({ humide: 'non', acoustique: 'non', feu: 'non' }).valeurs.typePlaque === 0, 'aide au choix : aucun besoin → plaque standard');
  const humideEtBruit = evaluer({ humide: 'oui', acoustique: 'oui', feu: 'non' });
  verifier(humideEtBruit.valeurs.typePlaque === 1 && humideEtBruit.valeurs.isolant === 1, 'aide au choix : pièce humide et acoustique → hydrofuge et isolant');
  verifier(humideEtBruit.phrase.startsWith('Recommandation. Type de plaque : hydrofuge (pièces humides), car la pièce est humide') && humideEtBruit.phrase.includes('isolant acoustique entre les montants : oui'), 'aide au choix : phrase de recommandation');
  verifier(evaluer({ humide: 'oui', acoustique: 'non', feu: 'oui' }).valeurs.typePlaque === 3, 'aide au choix : l’exigence feu est prioritaire');
  verifier(evaluer({ humide: 'non', acoustique: 'oui', feu: '' }).valeurs.typePlaque === 2, 'aide au choix : acoustique seule → plaque phonique');

  verifier(verifierAideAuChoix(aide, plaques.champs).length === 0, 'aide au choix : configuration des plaques valide');
  const mauvaise = { questions: aide.questions, regles: [{ si: { humide: 'peut-être' }, alors: { typePlaque: { valeur: 9 }, inconnu: { valeur: 1 } } }] };
  const erreurs = verifierAideAuChoix(mauvaise, plaques.champs).join(' | ');
  verifier(erreurs.includes('réponse "peut-être" inconnue') && erreurs.includes('valeur 9 absente') && erreurs.includes('champ inconnu "inconnu"'), 'aide au choix : build refuse une réponse, une valeur ou un champ inconnus');
  verifier(verifierAideAuChoix({ questions: [aide.questions[0]], regles: aide.regles }, plaques.champs).some((erreur) => erreur.includes('2 à 4 questions')), 'aide au choix : 2 à 4 questions exigées');
}

// Murs : épaisseurs vers l'extérieur, contour hors tout, recalage
{
  const rect = [[0, 0], [400, 0], [400, 300], [0, 300]];
  const proche = (a, b) => Math.abs(a - b) < 1e-6;
  const dix = rect.map(() => ({ type: 'cloison', epaisseur: 10 }));
  const totaux = totauxMurs(rect, dix);
  verifier(proche(totaux.surfaceHorsTout, 13.44) && proche(totaux.perimetreHorsTout, 14.8) && proche(totaux.longueurCloisons, 14),
    'murs : 4 × 3 m avec des murs de 10 cm → 4,20 × 3,20 m hors tout (13,44 m², 14,80 m)');
  const mixte = [{ type: 'exterieur', epaisseur: 30 }, { type: 'cloison', epaisseur: 7 }, { type: 'cloison', epaisseur: 7 }, { type: 'cloison', epaisseur: 7 }];
  const angle = contourExterieur(rect, mixte)[0];
  verifier(proche(angle[0], -7) && proche(angle[1], -30), 'murs : angle propre entre un mur de 30 cm et une cloison de 7 cm');
  const L = [[0, 0], [500, 0], [500, 250], [300, 250], [300, 400], [0, 400]];
  const rentrant = contourExterieur(L, L.map(() => ({ type: 'porteur', epaisseur: 20 })))[3];
  verifier(proche(rentrant[0], 320) && proche(rentrant[1], 270), 'murs : angle rentrant d’une pièce en L');
  const inverse = contourExterieur([...rect].reverse(), dix);
  verifier(inverse.some(([x, y]) => proche(x, -10) && proche(y, -10)), 'murs : même contour quel que soit le sens du tracé');
  verifier(totauxMurs(rect, mixte).longueurMursExterieurs === 4, 'murs : longueur des murs extérieurs (4 m)');
  const normalises = normaliserMurs([{ type: 'exterieur', epaisseur: 35 }, { type: 'inconnu' }, { type: 'porteur', epaisseur: 500 }], 4);
  verifier(normalises[0].epaisseur === 35 && normalises[1].type === 'cloison' && normalises[2].epaisseur === 20 && normalises.length === 4,
    'murs : types inconnus, épaisseurs hors limites et murs manquants remplacés par les valeurs par défaut');
  verifier(insererAngleMurs(mixte, 0).map((m) => m.epaisseur).join() === '30,30,7,7,7' && supprimerAngleMurs(mixte, 1).map((m) => m.epaisseur).join() === '30,7,7',
    'murs : recalage à l’ajout et à la suppression d’un angle');
  const ancien = chargerChantier((cle) => (cle === 'chantier-v1' ? JSON.stringify({ version: 1, active: 'a', pieces: [{ id: 'a', nom: 'Séjour', hauteur: 2.5, points: rect, ouvertures: [] }] }) : null));
  verifier(pieceActive(ancien).murs.length === 4 && pieceActive(ancien).murs.every((m) => m.type === 'cloison' && m.epaisseur === 7), 'murs : une pièce enregistrée sans murs reçoit des cloisons de 7 cm');
}

// Plan d'ensemble : disposition, aimantation à l'épaisseur du mur, chevauchements, rotation
{
  const rect = [[0, 0], [400, 0], [400, 300], [0, 300]];
  const murs = (e) => rect.map(() => ({ type: 'cloison', epaisseur: e }));
  const A = { id: 'a', points: rect, murs: murs(7), position: { x: 0, y: 0, rotation: 0 } };
  const B = { id: 'b', points: rect, murs: murs(20) };
  const positions = disposer([A, B]);
  verifier(positions.get('b').x === 527 && positions.get('b').y === 13, 'ensemble : pièce posée à 1 m des murs de la précédente, haut des murs aligné');
  const C = { id: 'c', points: rect, murs: murs(7) };
  const r = aimanter(C, { x: 420, y: 5, rotation: 0 }, [{ piece: A, position: A.position }], 20);
  verifier(r.position.x === 407 && r.position.y === 0 && r.aimant?.avec === 'a', 'ensemble : aimantation à la cloison de 7 cm, extrémités alignées');
  const mur20 = aimanter(B, { x: 425, y: 0, rotation: 0 }, [{ piece: A, position: A.position }], 20);
  verifier(mur20.position.x === 420, 'ensemble : l’écart retenu est le mur le plus épais des deux (20 cm)');
  verifier(aimanter(C, { x: 460, y: 0, rotation: 0 }, [{ piece: A, position: A.position }], 20).aimant === null, 'ensemble : pas d’aimantation au-delà du seuil');
  const avec = (x) => new Map([['a', A.position], ['c', { x, y: 0, rotation: 0 }]]);
  verifier(chevauchements([A, C], avec(407)).length === 0, 'ensemble : deux pièces séparées par leur mur ne se chevauchent pas');
  verifier(chevauchements([A, C], avec(400)).length === 1 && chevauchements([A, C], avec(200)).length === 1, 'ensemble : chevauchement signalé (mur sans place, pièces superposées)');
  const p = versEnsemble([400, 0], { x: 10, y: 20, rotation: 1 });
  verifier(p[0] === 10 && p[1] === 420, 'ensemble : rotation d’un quart de tour puis translation');
  verifier(normaliserPosition({ x: '12.4', y: 3, rotation: 5 })?.rotation === 1 && normaliserPosition({ x: 'a' }) === null, 'ensemble : position nettoyée (rotation ramenée à 0-3, valeurs invalides écartées)');
}

// Formulaires : un champ ne partage son nom ni son identifiant avec aucun autre élément du formulaire
// (sinon le navigateur renvoie un groupe d'éléments au lieu du champ ; cas réel : « portee »).
{
  const { pageCalculateur } = await import('./moteur/gabarits.js');
  for (const nomSite of await listerSites()) {
    const { site, calculateurs } = await chargerSite(nomSite);
    for (const calc of calculateurs) {
      const html = pageCalculateur(site, calc, calculateurs);
      const formulaire = html.slice(html.indexOf('<form'), html.indexOf('</form>'));
      const conflits = calc.champs.filter((champ) => {
        const memeNom = [...formulaire.matchAll(new RegExp(`<(input|select|textarea)\\b[^>]*\\bname="${champ.id}"[^>]*>`, 'g'))].map((m) => m[0]);
        const autres = memeNom.filter((balise) => !balise.includes(`id="champ-${champ.id}"`) && !(champ.presentation === 'vignettes' && balise.includes('type="radio"')));
        return autres.length > 0 || formulaire.includes(` id="${champ.id}"`);
      }).map((champ) => champ.id);
      verifier(conflits.length === 0, `${nomSite}/${calc.slug} : aucun nom de champ en conflit dans le formulaire${conflits.length ? ` (${conflits.join(', ')})` : ''}`);
    }
  }
}

// Dessiner ou saisir : un dessin identique à la saisie (rectangle de mêmes dimensions) donne les mêmes résultats.
{
  const { site, calculateurs } = await chargerSite('travaux');
  const rect = (l, h) => [[0, 0], [Math.round(l * 100), 0], [Math.round(l * 100), Math.round(h * 100)], [0, Math.round(h * 100)]];
  // Pour chaque calculateur : comment construire le rectangle à partir des entrées, et les entrées à neutraliser
  // (ouvertures, pignons, débords) pour que les deux modes décrivent exactement la même surface.
  const equivalences = {
    'plancher-bois': (e) => rect(e.longueur, e.portee),
    'isolation-soufflee': (e) => rect(e.surface, 1),
    'puissance-chauffage': (e) => rect(e.surface, 1),
    'calcul-beton': (e) => rect(e.longueur, e.largeur),
    'treillis-soude': (e) => rect(e.longueur, e.largeur),
    'terrasse-lames': (e) => rect(e.longueur, e.largeur),
    'pavage-allee': (e) => rect(e.surface, 1),
    'gravier-remblai': (e) => rect(e.longueur, e.largeur),
    'toit-plat-epdm': (e) => rect(e.longueur, e.largeur),
    'terrassement-deblai': (e) => rect(e.longueur, e.largeur),
    'plaques-de-platre': (e) => rect(e.longueur, e.hauteur),
    'mur-parpaings-briques': (e) => rect(e.longueur, e.hauteur),
    'quantite-parement': (e) => rect(e.longueur, e.hauteur),
    'lambris-bardage': (e) => rect(e.longueur, e.hauteur),
    'quantite-laine-de-verre': (e) => rect(e.surface, 1),
    'quantite-laine-de-roche': (e) => rect(e.surface, 1),
    'enduit-facade': (e) => rect(e.perimetre, e.hauteur),
    'peinture-facade': (e) => rect(e.perimetre, e.hauteur),
    'isolation-exterieur': (e) => rect(e.perimetre, e.hauteur),
    'couverture-tuiles': (e) => rect(e.longueurToit, e.largeurBatiment),
    'couverture-ardoises': (e) => rect(e.longueurToit, e.largeurBatiment),
    'couverture-plaques': (e) => rect(e.longueurToit, e.largeurBatiment),
    'chevrons-charpente': (e) => rect(e.longueurToit, e.largeurBatiment),
  };
  const neutres = { ouvertures: 0, pignons: 0, debordEgout: 0, debordRive: 0, pans: 1 };
  const differents = { 'couverture-tuiles': ['liteaux'], 'couverture-ardoises': ['liteaux'] };
  const avecDessin = calculateurs.filter((calc) => calc.plan?.saisie);
  verifier(avecDessin.length === 23 && avecDessin.every((calc) => equivalences[calc.slug]), `dessiner ou saisir : 23 calculateurs proposent les deux modes (${avecDessin.length})`);
  for (const calc of avecDessin) {
    const entrees = { ...calc.exemples[0].entrees };
    for (const [cle, valeur] of Object.entries(neutres)) if (cle in entrees) entrees[cle] = valeur;
    const saisie = calc.calculer(entrees, null, geo);
    const plan = infosPiece({ id: 'e', nom: 'Essai', hauteur: entrees.hauteur ?? 2.5, nature: calc.plan.nature, points: equivalences[calc.slug](entrees), elements: [] }, { pieces: [] });
    const dessin = calc.calculer(entrees, plan, geo);
    const ecarts = Object.keys(saisie ?? {}).filter((cle) => !(differents[calc.slug] ?? []).includes(cle))
      .filter((cle) => typeof saisie[cle] === 'number' && !(Math.abs(saisie[cle] - dessin?.[cle]) <= 1e-6));
    verifier(saisie && dessin && ecarts.length === 0, `${calc.slug} : dessin équivalent à la saisie${ecarts.length ? ` (écarts : ${ecarts.map((cle) => `${cle} ${saisie[cle]} ≠ ${dessin[cle]}`).join(', ')})` : ''}`);
  }
}

// Affichage : le zéro négatif (Math.ceil(0 − 1e-9)) s'affiche « 0 »
{
  const { formater } = await import('./moteur/nombres.js');
  verifier(formater(Math.ceil(-1e-9)) === '0' && formater(-0, 'nombre', 'm') === '0\u00a0m', 'affichage : zéro négatif affiché « 0 »');
}

// Dessins non rectangulaires, vérifiés à la main
{
  const { calculateurs } = await chargerSite('travaux');
  const calc = (slug) => calculateurs.find((element) => element.slug === slug);
  const dessin = (nature, points, elements = []) => infosPiece({ id: 'e', nom: 'Essai', hauteur: 2.5, nature, points, elements }, { pieces: [] });
  // Dalle en L : 5 × 2,5 m + 3 × 1,5 m = 17 m² ; 12 cm, sans marge → 2,04 m³.
  const beton = calc('calcul-beton');
  const dalle = beton.calculer({ ...beton.exemples[0].entrees, epaisseur: 12, nombre: 1, marge: 0 }, dessin('zone', [[0, 0], [500, 0], [500, 250], [300, 250], [300, 400], [0, 400]]), geo);
  verifier(Math.abs(dalle.volume - 2.04) < 1e-9, `dessin : dalle en L de 17 m² sur 12 cm → 2,04 m³ (${dalle.volume})`);
  // Mur à pignon de 8 m × 2,5 m, pointe de 2,8 m, une fenêtre de 120 × 135 : 20 + 11,2 − 1,62 = 29,58 m².
  const blocs = calc('mur-parpaings-briques');
  const pignon = dessin('mur', [[0, 280], [400, 0], [800, 280], [800, 530], [0, 530]], [{ type: 'fenetre', x: 340, y: 330, largeur: 120, longueur: 135 }]);
  const mur = blocs.calculer(blocs.exemples[0].entrees, pignon, geo);
  verifier(Math.abs(mur.surface - 29.58) < 1e-9, `dessin : mur à pignon avec fenêtre → 29,58 m² (${mur.surface})`);
  // Pan de croupe en trapèze : 10 m à l'égout, 4,5 m de profondeur, faîtage de 1 m ; pente 35°.
  const tuiles = calc('couverture-tuiles');
  const pan = dessin('pan', [[450, 0], [550, 0], [1000, 450], [0, 450]]);
  const toit = tuiles.calculer({ ...tuiles.exemples[0].entrees, pente: 35, pans: 2 }, pan, geo);
  const attendu = 24.75 / Math.cos((35 * Math.PI) / 180);
  verifier(Math.abs(toit.surface - attendu) < 1e-9 && Math.abs(attendu - 30.21) < 0.01, `dessin : pan de croupe de 24,75 m² vus du dessus, pente 35° → ${attendu.toFixed(2)} m² de couverture`);
  verifier(toit.closoir === 1 && toit.faitieres > 0, `dessin : faîtage du pan de croupe = moitié du bord haut de 1 m, partagé avec le pan opposé (closoir ${toit.closoir} m)`);
  const triangle = tuiles.calculer({ ...tuiles.exemples[0].entrees, pente: 35, pans: 2 }, dessin('pan', [[500, 0], [1000, 450], [0, 450]]), geo);
  verifier(triangle.closoir === 0, 'dessin : un pan triangulaire (croupe) n’a pas de faîtage');
}

// Chantier assemblé : murs communs, ouvertures partagées, retours de tableau, éléments, mesures
{
  const rect = (l, h) => [[0, 0], [l, 0], [l, h], [0, h]];
  const M = (types) => types.map((t) => ({ type: t, epaisseur: t === 'exterieur' ? 30 : 7 }));
  const proche = (a, b) => Math.abs(a - b) < 0.006;
  // Séjour 5 × 4 m et cuisine 3 × 4 m, séparés par une cloison de 7 cm : maison de 8,67 × 4,60 m hors tout.
  const chantier = { pieces: [
    { id: 's', nom: 'Séjour', hauteur: 2.5, points: rect(500, 400), murs: M(['exterieur', 'cloison', 'exterieur', 'exterieur']), position: { x: 0, y: 0, rotation: 0 },
      ouvertures: [{ type: 'porte', cote: 1, largeur: 83, hauteur: 204, position: 100 }, { type: 'fenetre', cote: 0, largeur: 120, hauteur: 135, position: 190 }] },
    { id: 'c', nom: 'Cuisine', hauteur: 2.5, points: rect(300, 400), murs: M(['exterieur', 'exterieur', 'exterieur', 'cloison']), position: { x: 507, y: 0, rotation: 0 }, ouvertures: [],
      elements: [{ type: 'gaine', x: 0, y: 0, largeur: 40, longueur: 40 }] },
  ] };
  const communs = mursCommuns(chantier);
  verifier(communs.length === 1 && communs[0].longueur === 400 && communs[0].epaisseur === 7 && communs[0].cloison, 'plan : mur commun de 4 m reconnu entre le séjour et la cuisine (cloison de 7 cm)');
  const cuisine = infosPiece(chantier.pieces[1], chantier, communs);
  verifier(cuisine.ouvertures.length === 1 && cuisine.ouvertures[0].partagee && cuisine.ouvertures[0].position === 217 && cuisine.nombrePortes === 1,
    'plan : la porte du séjour apparaît dans la cuisine, à sa place sur le mur commun');
  verifier(proche(cuisine.surface, 11.84) && proche(cuisine.surfaceBrute, 12), 'plan : la gaine de 40 × 40 cm est déduite de la cuisine (12 → 11,84 m²)');
  verifier(proche(infosPiece(chantier.pieces[0], chantier, communs).surfaceTableaux, 1.53), 'plan : retours de tableau de la fenêtre dans un mur de 30 cm (1,53 m²), pas de la porte dans la cloison');
  const m = mesures(chantier);
  verifier(proche(m.longueurFacades, 26.54) && proche(m.emprise, 39.88) && proche(m.surfaceHabitable, 31.84) && proche(m.longueurCloisons, 4),
    'plan : façades 26,54 m, emprise 39,88 m², surface habitable 31,84 m², cloison commune comptée une fois');
  chantier.pieces[1].position = { x: 507, y: 100, rotation: 0 };
  verifier(proche(mesures(chantier).longueurCloisons, 5), 'plan : mur commun partiel (3 m) : 4 + 4 − 3 = 5 m de cloisons');
  chantier.pieces[1].position = { x: 600, y: 0, rotation: 0 };
  verifier(mursCommuns(chantier).length === 0 && infosPiece(chantier.pieces[1], chantier).ouvertures.length === 0, 'plan : pièces éloignées, pas de mur commun ni d’ouverture partagée');
  const etages = { niveaux: [{ id: 'n0', nom: 'Rez-de-chaussée' }, { id: 'n1', nom: 'Étage 1' }], pieces: [
    { id: 'a', nom: 'A', points: rect(400, 300), niveau: 'n0' }, { id: 'b', nom: 'B', points: rect(400, 300), niveau: 'n1', position: { x: 407, y: 0, rotation: 0 } }, { id: 'c', nom: 'C', points: rect(300, 300) } ] };
  verifier(piecesDePortee(etages, 'niveau', 'a').map((p) => p.id).join() === 'a,c' && piecesDePortee(etages, 'chantier', 'a').length === 3 && piecesDePortee(etages, 'piece', 'b')[0].id === 'b',
    'plan : portée du calcul (pièce, niveau, chantier) ; une pièce sans niveau va au premier niveau');
  etages.pieces[0].position = { x: 0, y: 0, rotation: 0 };
  verifier(mursCommuns(etages).length === 0, 'plan : pas de mur commun entre deux niveaux');
  verifier(normaliserNiveaux(undefined)[0].id === 'n0' && niveauDe({ niveau: 'inconnu' }, etages) === 'n0', 'plan : niveau par défaut, niveau inconnu ramené au premier');
  const elements = normaliserElements([{ type: 'tremie' }, { type: 'inconnu' }, { type: 'gaine', largeur: -5 }]);
  verifier(elements.length === 2 && elements[0].largeur === 90 && elements[0].longueur === 250 && elements[1].largeur === 40, 'plan : éléments nettoyés (types connus, dimensions courantes par défaut)');
}

// Chantier : plusieurs pièces, migration des anciens plans
{
  const lecteur = (valeurs) => (cle) => valeurs[cle] ?? null;
  const planL = [[0, 0], [500, 0], [500, 250], [300, 250], [300, 400], [0, 400]];

  const depuisV2 = chargerChantier(lecteur({ 'plan-piece-v2': JSON.stringify({ points: planL, ouvertures: [{ type: 'porte', cote: 0, largeur: 83, hauteur: 204, position: 50 }] }) }));
  verifier(depuisV2.pieces.length === 1 && pieceActive(depuisV2).nom === 'Pièce 1' && pieceActive(depuisV2).ouvertures.length === 1 && pieceActive(depuisV2).hauteur === 2.5,
    'chantier : un plan v2 (avec ouvertures) devient « Pièce 1 », hauteur 2,50 m');
  const depuisV1 = chargerChantier(lecteur({ 'plan-piece-v1': JSON.stringify(planL) }));
  verifier(pieceActive(depuisV1).points.length === 6 && pieceActive(depuisV1).ouvertures.length === 0, 'chantier : un plan v1 (sans ouverture) devient « Pièce 1 »');
  const vide = chargerChantier(lecteur({}));
  verifier(vide.pieces.length === 1 && pieceActive(vide).points.length === 4, 'chantier : sans rien d’enregistré, une pièce rectangulaire par défaut');

  const existant = {
    version: 1,
    active: 'b',
    pieces: [
      { id: 'a', nom: 'Séjour', hauteur: 2.5, points: planL, ouvertures: [] },
      { id: 'b', nom: 'Chambre 1', hauteur: 2.4, points: [[0, 0], [300, 0], [300, 300], [0, 300]], ouvertures: [] },
      { id: 'c', nom: 'Abîmée', hauteur: 2.5, points: [[0, 0], [100, 100], [100, 0], [0, 100]], ouvertures: [] },
    ],
  };
  const lu = chargerChantier(lecteur({ 'chantier-v1': JSON.stringify(existant), 'plan-piece-v2': JSON.stringify({ points: planL }) }));
  verifier(lu.pieces.length === 2 && pieceActive(lu).nom === 'Chambre 1' && pieceActive(lu).hauteur === 2.4,
    'chantier : le chantier enregistré l’emporte ; une pièce à la forme invalide est écartée');
  verifier(nomLibre(lu) === 'Pièce 3', 'chantier : nom proposé pour une nouvelle pièce');

  // Lien de partage : les anciens liens (sans pièce) restent lisibles ; les nouveaux portent la pièce.
  const ancienLien = Buffer.from(JSON.stringify({ v: 1, c: {}, l: [['Carrelage – Cuisine', 'Sols', 18, 'carton', 34.9, '17 m²']] })).toString('base64url');
  const ancien = decoderPartage(ancienLien);
  verifier(ancien?.lignes[0].designation === 'Carrelage – Cuisine' && ancien.lignes[0].piece === '', 'partage : un ancien lien sans pièce reste lisible');
  const aller = decoderPartage(encoderPartage([{ designation: 'Peinture murs', lot: 'Murs intérieurs', quantite: 3, unite: 'pot', prixUnitaire: 39, detail: '', piece: 'Chambre 1' }], {}));
  verifier(aller?.lignes[0].piece === 'Chambre 1', 'partage : la pièce fait l’aller-retour dans le lien');
  verifier(groupeLigne({ lot: 'Sols', piece: '' }, 'piece') === 'Sans pièce' && groupeLigne({ lot: 'Sols', piece: 'Cuisine' }, 'lot') === 'Sols', 'récapitulatif : clé de regroupement par pièce ou par corps de métier');

  // PDF regroupé par pièce : une rubrique par pièce, le corps de métier dans le détail.
  const pdfPieces = String.fromCharCode(...genererRecapitulatif({
    regroupement: 'piece',
    lignes: [
      { designation: 'Carrelage', lot: 'Sols', piece: 'Cuisine', quantite: 18, unite: 'carton', prixUnitaire: 0 },
      { designation: 'Peinture murs', lot: 'Murs intérieurs', piece: 'Chambre 1', quantite: 3, unite: 'pot', prixUnitaire: 0 },
    ],
    site: { nom: 'Métré', adresse: 'https://www.exemple-metre.fr/', accent: '#C2410C' },
  }));
  verifier(pdfPieces.includes('(CUISINE)') && pdfPieces.includes('(CHAMBRE 1)') && pdfPieces.includes('(Sols)'), 'PDF : rubriques par pièce, corps de métier dans le détail');
}

for (const nomSite of await listerSites()) {
  const { calculateurs } = await chargerSite(nomSite);

  for (const calc of calculateurs) {
    const nom = `${nomSite}/${calc.slug}`;
    try {
      verifierCalculateur(calc, nomSite);
    } catch (erreur) {
      verifier(false, erreur.message);
      continue;
    }

    const formuleNavigateur = new Function(`return ${serialiserFormule(calc.calculer)};`)();
    verifier((calc.exemples ?? []).length > 0, `${nom} : au moins un exemple est déclaré`);

    for (const [index, exemple] of (calc.exemples ?? []).entries()) {
      // Pour les calculateurs avec plan, l'exemple fournit les angles de la pièce en cm.
      // Les ouvertures éventuelles passent par les mêmes fonctions que dans le navigateur.
      const ouverturesExemple = exemple.plan ? normaliserOuvertures(exemple.ouvertures ?? [], exemple.plan) : [];
      const naturePlan = typeof calc.plan === 'object' ? calc.plan.nature : 'piece';
      const plan = exemple.plan && naturePlan !== 'piece'
        ? infosPiece({ id: 'exemple', nom: 'Exemple', hauteur: 2.5, nature: naturePlan, points: exemple.plan, elements: exemple.elements ?? [] }, { pieces: [] })
        : exemple.plan
        ? {
            valide: true,
            points: exemple.plan,
            surface: geo.aire(exemple.plan) / 10000,
            perimetre: geo.perimetre(exemple.plan) / 100,
            ouvertures: ouverturesExemple,
            ...totauxOuvertures(ouverturesExemple),
          }
        : null;
      exemple.entrees = appliquerOuvertures(calc.champs, exemple.entrees, plan);
      // Calculateur avec plan seulement : chaque exemple fournit un plan. Avec « Dessiner / Saisir »,
      // un exemple sans plan teste la saisie des dimensions.
      if (calc.plan === true) verifier(plan !== null, `${nom}, exemple ${index + 1} : un plan est fourni`);
      const direct = calc.calculer(exemple.entrees, plan, geo);
      let recopie = null;
      try {
        recopie = formuleNavigateur(exemple.entrees, plan, geo);
      } catch (erreur) {
        verifier(false, `${nom}, exemple ${index + 1} : la formule recopiée plante (${erreur.message}). Elle utilise sans doute une variable définie hors de calculer().`);
        continue;
      }

      if (direct?.erreur) {
        verifier(Object.keys(exemple.attendu).length === 0, `${nom}, exemple ${index + 1} : erreur inattendue « ${direct.erreur} »`);
        continue;
      }
      if (Object.keys(exemple.attendu).length === 0) {
        verifier(false, `${nom}, exemple ${index + 1} : une erreur était attendue`);
        continue;
      }
      for (const resultat of calc.resultats) {
        verifier(resultat.id in direct, `${nom}, exemple ${index + 1} : calculer() renvoie "${resultat.id}"`);
      }
      for (const [cle, attendu] of Object.entries(exemple.attendu)) {
        verifier(egal(direct[cle], attendu), `${nom}, exemple ${index + 1} : ${cle} = ${direct[cle]} (attendu ${attendu})`);
        verifier(egal(recopie[cle], attendu), `${nom}, exemple ${index + 1} : ${cle} identique dans formule.js`);
      }
    }
  }
}

console.log(`\n${reussis} contrôle(s) réussi(s), ${echecs} échec(s).`);
process.exit(echecs === 0 ? 0 : 1);
