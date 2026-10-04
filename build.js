// build.js
// Génère un site statique par dossier présent dans sites/.
//   node build.js          → construit tous les sites
//   node build.js immo     → construit uniquement sites/immo
// Résultat : dist/<nom-du-site>/, prêt à déposer sur un hébergement statique.

import { readdir, mkdir, writeFile, copyFile, rm, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { formatsAutorises, UNITES_CONVERTIBLES } from './moteur/nombres.js';
import { VALEURS_OUVERTURES } from './moteur/ouvertures.js';
import { verifierAideAuChoix } from './moteur/aide-choix.js';
import { SUGGESTIONS_CHANTIER } from './moteur/chantier-plan.js';
import { utiliserLangue, enregistrerLangue } from './moteur/langue.js';
import {
  pageCalculateur,
  pageAccueil,
  pageMentionsLegales,
  pageConfidentialite,
  pageWidget,
  definirLangues,
  definirCalculateurs,
  cheminDe,
  adsTxt,
  page404,
  pageDevis,
  pageLot,
  lotsUtilises,
  sitemap,
  manifeste,
  serviceWorker,
  robots,
  themeCss,
} from './moteur/gabarits.js';

const racine = dirname(fileURLToPath(import.meta.url));
const dossierSites = join(racine, 'sites');
const dossierSortie = join(racine, 'dist');
const fichiersMoteur = ['calcul.js', 'nombres.js', 'geometrie.js', 'plan.js', 'ouvertures.js', 'murs.js', 'ensemble.js', 'chantier-plan.js', 'chantier.js', 'aide-choix.js', 'langue.js', 'panier.js', 'pdf.js', 'theme.js', 'appli.js', 'style.css'];
const typesDeChamp = ['nombre', 'case', 'choix'];

export async function listerSites() {
  const entrees = await readdir(dossierSites, { withFileTypes: true });
  return entrees.filter((entree) => entree.isDirectory()).map((entree) => entree.name);
}

export async function chargerSite(nomSite) {
  const dossier = join(dossierSites, nomSite);
  const site = (await import(pathToFileURL(join(dossier, 'site.js')))).default;
  const fichiers = (await readdir(join(dossier, 'calculateurs'))).filter((fichier) => fichier.endsWith('.js'));

  const calculateurs = [];
  for (const fichier of fichiers) {
    const module = await import(pathToFileURL(join(dossier, 'calculateurs', fichier)));
    calculateurs.push(module.default);
  }
  // Ordre d'affichage : clé "ordre" du calculateur si elle existe, sinon ordre alphabétique.
  calculateurs.sort((a, b) => (a.ordre ?? 999) - (b.ordre ?? 999) || a.titre.localeCompare(b.titre, 'fr'));
  return { site, calculateurs };
}

// La formule est recopiée telle quelle dans le navigateur via toString().
// Elle doit donc être autonome : aucune variable ni fonction définie hors de calculer().
// Elle reçoit (valeurs, plan, geo) : plan et geo ne servent qu'aux calculateurs avec plan.
export function serialiserFormule(fonction) {
  const source = fonction.toString().trim();
  // Méthode raccourcie : calculer(v) { ... }
  if (/^calculer\s*\(/.test(source)) return `({ ${source} }).calculer`;
  // Fonction fléchée ou fonction classique
  return `(${source})`;
}

export function verifierCalculateur(calc, nomSite) {
  const prefixe = `[${nomSite}/${calc?.slug ?? '?'}]`;
  const erreurs = [];

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(calc.slug ?? '')) erreurs.push('slug absent ou invalide (minuscules, chiffres, tirets)');
  if (!calc.titre) erreurs.push('titre manquant');

  // Guide enrichi : listes de textes non vides, normes avec un titre et, si un lien est donné, en https.
  for (const cle of ['erreurs', 'conseils']) {
    if (calc[cle] !== undefined && !(Array.isArray(calc[cle]) && calc[cle].every((texte) => typeof texte === 'string' && texte.trim()))) {
      erreurs.push(`${cle} doit être une liste de textes non vides`);
    }
  }
  if (calc.normes !== undefined) {
    if (!Array.isArray(calc.normes)) erreurs.push('normes doit être une liste');
    else calc.normes.forEach((norme, index) => {
      if (!norme?.titre) erreurs.push(`normes[${index}] : titre manquant`);
      if (norme?.url !== undefined && !/^https:\/\/[^\s"<>]+$/.test(norme.url)) erreurs.push(`normes[${index}] : lien invalide (https:// attendu)`);
    });
  }
  // Date de vérification des valeurs : date réelle au format AAAA-MM-JJ, pas dans le futur.
  if (calc.majLe !== undefined) {
    const date = new Date(`${calc.majLe}T00:00:00Z`);
    const valide = /^\d{4}-\d{2}-\d{2}$/.test(calc.majLe) && !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === calc.majLe;
    if (!valide) erreurs.push(`majLe "${calc.majLe}" invalide (format AAAA-MM-JJ)`);
    else if (date > new Date()) erreurs.push(`majLe "${calc.majLe}" est dans le futur`);
  }
  // Équivalent impérial d'un conditionnement : un champ du calculateur et une unité convertible.
  for (const resultat of calc.resultats ?? []) {
    if (resultat.equivalent === undefined) continue;
    if (!calc.champs?.some((champ) => champ.id === resultat.equivalent?.champ)) erreurs.push(`résultat "${resultat.id}" : equivalent.champ "${resultat.equivalent?.champ}" n'est pas un champ du calculateur`);
    if (!UNITES_CONVERTIBLES.includes(resultat.equivalent?.unite)) erreurs.push(`résultat "${resultat.id}" : equivalent.unite doit être parmi ${UNITES_CONVERTIBLES.join(', ')}`);
  }
  if (calc.aideAuChoix !== undefined) erreurs.push(...verifierAideAuChoix(calc.aideAuChoix, calc.champs ?? []));
  // Plan : true (pièce, plan seul) ou { nature: 'piece' | 'zone' | 'mur' | 'pan', saisie: true|false }.
  if (calc.plan !== undefined && calc.plan !== true && calc.plan !== false) {
    if (!['piece', 'zone', 'mur', 'pan'].includes(calc.plan?.nature)) erreurs.push(`plan.nature doit être piece, zone, mur ou pan`);
    if (calc.plan.saisie !== undefined && typeof calc.plan.saisie !== 'boolean') erreurs.push(`plan.saisie doit valoir true ou false`);
  }
  // Champs de dimension (saisie: true) : seulement si le calculateur propose « Saisir les dimensions ».
  for (const champ of (calc.champs ?? []).filter((element) => element.saisie)) {
    if (!calc.plan?.saisie) erreurs.push(`champ "${champ.id}" : saisie: true demande plan: { nature, saisie: true }`);
    if (champ.requis && !calc.plan?.saisie) erreurs.push(`champ "${champ.id}" : champ de dimension sans mode de saisie`);
  }
  // Suggestion issue du plan d'ensemble : valeur connue, sur un champ numérique d'un calculateur sans plan.
  for (const champ of (calc.champs ?? []).filter((element) => element.suggestionChantier !== undefined)) {
    if (!SUGGESTIONS_CHANTIER.includes(champ.suggestionChantier)) erreurs.push(`champ "${champ.id}" : suggestionChantier doit être parmi ${SUGGESTIONS_CHANTIER.join(', ')}`);
    if (calc.plan && !calc.plan.saisie) erreurs.push(`champ "${champ.id}" : suggestionChantier est réservé aux calculateurs avec saisie des dimensions (les autres reçoivent le plan directement)`);
    if (champ.type && champ.type !== 'nombre') erreurs.push(`champ "${champ.id}" : suggestionChantier demande un champ numérique`);
  }
  if (calc.lies !== undefined && !(Array.isArray(calc.lies) && calc.lies.every((slug) => typeof slug === 'string'))) erreurs.push('lies doit être une liste de slugs');
  if (!calc.description) erreurs.push('description manquante (utilisée pour le SEO)');
  if (typeof calc.calculer !== 'function') erreurs.push('fonction calculer manquante');
  if (!Array.isArray(calc.champs) || calc.champs.length === 0) erreurs.push('aucun champ déclaré');
  if (!Array.isArray(calc.resultats) || calc.resultats.length === 0) erreurs.push('aucun résultat déclaré');

  const ids = new Set();
  for (const champ of calc.champs ?? []) {
    if (!/^[a-zA-Z][a-zA-Z0-9]*$/.test(champ.id ?? '')) erreurs.push(`id de champ invalide : "${champ.id}"`);
    if (ids.has(champ.id)) erreurs.push(`id de champ en double : "${champ.id}"`);
    ids.add(champ.id);
    if (!typesDeChamp.includes(champ.type ?? 'nombre')) erreurs.push(`type de champ inconnu pour "${champ.id}" : ${champ.type}`);
    if (champ.type === 'choix' && !champ.options?.length) erreurs.push(`le champ "${champ.id}" de type choix n'a pas d'options`);
    if (champ.presentation !== undefined) {
      if (champ.type !== 'choix' || champ.presentation !== 'vignettes') erreurs.push(`le champ "${champ.id}" : presentation "vignettes" réservée aux champs de type choix`);
      else if (!champ.options.every((option) => typeof option.schema === 'string' && option.schema.trim())) erreurs.push(`le champ "${champ.id}" : chaque option d'une liste à vignettes demande un schéma SVG (clé schema)`);
    }
    if (champ.lienPiece !== undefined) {
      if (!calc.plan) erreurs.push(`le champ "${champ.id}" utilise lienPiece, réservé aux calculateurs avec plan`);
      if (champ.lienPiece !== 'hauteur') erreurs.push(`le champ "${champ.id}" : lienPiece "${champ.lienPiece}" inconnu (attendu : hauteur)`);
    }
    if (champ.remplacePar !== undefined) {
      if (!calc.plan) erreurs.push(`le champ "${champ.id}" utilise remplacePar, réservé aux calculateurs avec plan`);
      if (!VALEURS_OUVERTURES.includes(champ.remplacePar)) erreurs.push(`le champ "${champ.id}" : remplacePar "${champ.remplacePar}" inconnu (attendu : ${VALEURS_OUVERTURES.join(', ')})`);
    }
  }

  const idsResultats = new Set((calc.resultats ?? []).map((resultat) => resultat.id));
  for (const ligne of calc.devis ?? []) {
    if (!idsResultats.has(ligne.resultat)) erreurs.push(`ligne de devis "${ligne.designation}" : résultat inconnu "${ligne.resultat}"`);
    if (ligne.prixChamp && !ids.has(ligne.prixChamp)) erreurs.push(`ligne de devis "${ligne.designation}" : champ de prix inconnu "${ligne.prixChamp}"`);
    if (ligne.achat !== undefined && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(ligne.achat)) erreurs.push(`ligne de devis "${ligne.designation}" : achat "${ligne.achat}" invalide (minuscules, chiffres, tirets)`);
    for (const [, cle, libelle] of (ligne.detail ?? '').matchAll(/\{(\w+)(:libelle)?\}/g)) {
      if (!ids.has(cle) && !idsResultats.has(cle)) erreurs.push(`ligne de devis "${ligne.designation}" : {${cle}} n'est ni un champ ni un résultat`);
      if (libelle && calc.champs.find((champ) => champ.id === cle)?.type !== 'choix') erreurs.push(`ligne de devis "${ligne.designation}" : {${cle}:libelle} demande un champ de type choix`);
    }
  }
  for (const resultat of calc.resultats ?? []) {
    if (!formatsAutorises.includes(resultat.format)) {
      erreurs.push(`format inconnu pour "${resultat.id}" : ${resultat.format} (attendu : ${formatsAutorises.join(', ')})`);
    }
  }

  if (erreurs.length) throw new Error(`${prefixe}\n  - ${erreurs.join('\n  - ')}`);
}

export async function construireSite(nomSite) {
  const { site: configuration, calculateurs } = await chargerSite(nomSite);
  // Menu des corps de métier : seuls ceux qui ont au moins un calculateur y figurent.
  const site = { ...configuration, menuLots: lotsUtilises(configuration, calculateurs) };
  calculateurs.forEach((calc) => verifierCalculateur(calc, nomSite));

  // Chaque teinte utilisée par un calculateur doit exister dans le thème (et dans le thème de nuit s'il y en a un).
  for (const calc of calculateurs.filter((calc) => calc.teinte)) {
    for (const [nomTheme, theme] of [['theme', site.theme], ['themeNuit', site.themeNuit]]) {
      if (theme && !theme.teintes?.[calc.teinte]) {
        throw new Error(`[${nomSite}/${calc.slug}] la teinte "${calc.teinte}" manque dans ${nomTheme}.teintes de site.js`);
      }
    }
  }

  // Avec des corps de métier déclarés, chaque calculateur doit en indiquer un existant.
  if (site.lots) {
    const idsLots = new Set(site.lots.map((lot) => lot.id));
    for (const calc of calculateurs) {
      if (!idsLots.has(calc.lot)) throw new Error(`[${nomSite}/${calc.slug}] corps de métier inconnu ou manquant : "${calc.lot}" (voir lots dans site.js)`);
    }
  }

  const slugs = calculateurs.map((calc) => calc.slug);
  const doublon = slugs.find((slug, index) => slugs.indexOf(slug) !== index);
  if (doublon) throw new Error(`[${nomSite}] slug en double : ${doublon}`);

  // Liens d'affiliation : id unique (repris par la clé achat des lignes de devis), lien en https.
  const affiliation = site.monetisation?.affiliation ?? [];
  const idsAchat = affiliation.filter((lien) => lien.id).map((lien) => lien.id);
  const doublonAchat = idsAchat.find((id, index) => idsAchat.indexOf(id) !== index);
  if (doublonAchat) throw new Error(`[${nomSite}] affiliation : id en double "${doublonAchat}"`);
  for (const lien of affiliation) {
    if (lien.id !== undefined && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(lien.id)) throw new Error(`[${nomSite}] affiliation : id "${lien.id}" invalide (minuscules, chiffres, tirets)`);
    if (!/^https:\/\/[^\s"<>]+$/.test(lien.url ?? '')) throw new Error(`[${nomSite}] affiliation : lien "${lien.url}" invalide (https:// attendu)`);
  }
  // Clé achat sans lien correspondant : aucun bouton « Acheter », simple avertissement.
  if (idsAchat.length) {
    const manquants = [...new Set(calculateurs.flatMap((calc) => (calc.devis ?? []).map((ligne) => ligne.achat)).filter((cle) => cle && !idsAchat.includes(cle)))];
    if (manquants.length) console.warn(`⚠ [${nomSite}] lignes de devis sans lien d'achat configuré (aucun bouton affiché) : ${manquants.join(', ')}`);
  }

  // Types de chantier (navigation) : id unique, nom, et des calculateurs qui existent.
  for (const [index, type] of (site.typesChantier ?? []).entries()) {
    if (!type?.id || !type.nom || !Array.isArray(type.calculateurs) || !type.calculateurs.length) throw new Error(`[${nomSite}] typesChantier[${index}] : id, nom et liste de calculateurs attendus`);
    const inconnus = type.calculateurs.filter((slug) => !slugs.includes(slug));
    if (inconnus.length) throw new Error(`[${nomSite}] type de chantier "${type.id}" : calculateur inconnu ${inconnus.join(', ')}`);
  }
  if (site.typesChantier?.length) {
    const ranges = new Set(site.typesChantier.flatMap((type) => type.calculateurs));
    const absents = slugs.filter((slug) => !ranges.has(slug));
    if (absents.length) console.warn(`⚠ [${nomSite}] calculateurs absents de la navigation par type de chantier : ${absents.join(', ')}`);
  }

  // Calculateurs liés : chaque slug doit exister sur le site, sans renvoyer vers soi-même.
  for (const calc of calculateurs.filter((element) => element.lies)) {
    for (const slug of calc.lies) {
      if (slug === calc.slug) throw new Error(`[${nomSite}/${calc.slug}] lies contient le calculateur lui-même`);
      if (!slugs.includes(slug)) throw new Error(`[${nomSite}/${calc.slug}] lies : calculateur inconnu "${slug}"`);
    }
  }

  // Langues du site (site.js, clé langues) : la première est la langue par défaut, servie à la racine.
  const langues = site.langues ?? ['fr'];
  if (!Array.isArray(langues) || !langues.length || langues.some((code) => !/^[a-z]{2}(-[a-z]{2})?$/.test(code)) || new Set(langues).size !== langues.length) {
    throw new Error(`[${nomSite}] langues : liste de codes de langue attendue, sans doublon (par exemple ['fr', 'en'])`);
  }
  for (const code of langues) {
    try {
      enregistrerLangue((await import(`./moteur/langues/${code}.js`)).default);
    } catch {
      throw new Error(`[${nomSite}] langue "${code}" : fichier moteur/langues/${code}.js introuvable ou invalide`);
    }
  }
  // Slugs traduits : seulement pour des langues du site, sans doublon dans une même langue.
  for (const code of langues) {
    const slugsLangue = calculateurs.map((calc) => calc.slugs?.[code] ?? calc.slug);
    const doublonLangue = slugsLangue.find((slug, index) => slugsLangue.indexOf(slug) !== index);
    if (doublonLangue) throw new Error(`[${nomSite}] langue "${code}" : adresse en double "${doublonLangue}"`);
  }
  for (const calc of calculateurs.filter((element) => element.slugs)) {
    for (const [code, slug] of Object.entries(calc.slugs)) {
      if (!langues.includes(code)) throw new Error(`[${nomSite}/${calc.slug}] slugs : langue "${code}" absente de site.langues`);
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw new Error(`[${nomSite}/${calc.slug}] slugs.${code} invalide (minuscules, chiffres, tirets)`);
    }
  }
  const sortie = join(dossierSortie, nomSite);
  await rm(sortie, { recursive: true, force: true });
  await mkdir(join(sortie, 'assets'), { recursive: true });

  for (const fichier of fichiersMoteur) {
    await copyFile(join(racine, 'moteur', fichier), join(sortie, 'assets', fichier));
  }
  // Textes de l'interface : seulement les langues du site ; langue.js les enregistre toutes.
  await mkdir(join(sortie, 'assets', 'langues'), { recursive: true });
  for (const code of langues) {
    await copyFile(join(racine, 'moteur', 'langues', `${code}.js`), join(sortie, 'assets', 'langues', `${code}.js`));
  }
  if (langues.length > 1) {
    const supplementaires = langues.filter((code) => code !== 'fr');
    const source = await readFile(join(racine, 'moteur', 'langue.js'), 'utf8');
    await writeFile(join(sortie, 'assets', 'langue.js'), source
      .replace("import fr from './langues/fr.js';", ["import fr from './langues/fr.js';", ...supplementaires.map((code) => `import ${code} from './langues/${code}.js';`)].join('\n'))
      .replace('const LANGUES = { fr };', `const LANGUES = { fr, ${supplementaires.join(', ')} };`));
  }
  await writeFile(join(sortie, 'assets', 'theme.css'), themeCss(site.theme, site.themeNuit));

  // Pages, une fois par langue : la langue par défaut à la racine, les autres sous /<code>/.
  definirLangues(langues);
  definirCalculateurs(calculateurs);
  for (const code of langues) {
    utiliserLangue(code);
    const ecrirePage = async (chemin, html) => {
      const dossier = join(sortie, ...chemin.split('/').filter(Boolean));
      await mkdir(dossier, { recursive: true });
      await writeFile(join(dossier, 'index.html'), html);
    };

    await ecrirePage(cheminDe({ type: 'accueil' }), pageAccueil(site, calculateurs));
    for (const calc of calculateurs) {
      await ecrirePage(cheminDe({ type: 'calculateur', calc }), pageCalculateur(site, calc, calculateurs));
    }
    for (const lot of lotsUtilises(site, calculateurs)) {
      await ecrirePage(cheminDe({ type: 'lot', lot }), pageLot(site, lot));
    }
    await ecrirePage(cheminDe({ type: 'mentions' }), pageMentionsLegales(site));
    await ecrirePage(cheminDe({ type: 'confidentialite' }), pageConfidentialite(site));
    if (site.devis) await ecrirePage(cheminDe({ type: 'devis' }), pageDevis(site));
  }
  utiliserLangue(langues[0]);

  // Fichiers communs à toutes les langues : formules (sous le slug par défaut), widgets, page 404.
  for (const calc of calculateurs) {
    await writeFile(join(sortie, calc.slug, 'formule.js'), `export default ${serialiserFormule(calc.calculer)};\n`);
    // Widgets intégrables : une page par calculateur, hors du sitemap.
    await mkdir(join(sortie, 'widget', calc.slug), { recursive: true });
    await writeFile(join(sortie, 'widget', calc.slug, 'index.html'), pageWidget(site, calc));
  }
  const fichierAds = adsTxt(site);
  if (fichierAds) await writeFile(join(sortie, 'ads.txt'), fichierAds);
  await writeFile(join(sortie, '404.html'), page404(site));

  const date = new Date().toISOString().slice(0, 10);
  await writeFile(join(sortie, 'sitemap.xml'), sitemap(site, calculateurs, date));
  await writeFile(join(sortie, 'robots.txt'), robots(site));

  // Application installable : icônes, manifeste, puis service worker qui met en cache
  // tous les fichiers générés (le site fonctionne ensuite hors ligne).
  await mkdir(join(sortie, 'icones'), { recursive: true });
  for (const icone of await readdir(join(dossierSites, nomSite, 'icones'))) {
    await copyFile(join(dossierSites, nomSite, 'icones', icone), join(sortie, 'icones', icone));
  }
  await writeFile(join(sortie, 'manifest.webmanifest'), manifeste(site, calculateurs));

  const fichiers = (await readdir(sortie, { recursive: true, withFileTypes: true }))
    .filter((entree) => entree.isFile())
    .map((entree) => join(entree.parentPath ?? entree.path, entree.name))
    .sort();
  const empreinte = createHash('sha256');
  for (const fichier of fichiers) empreinte.update(fichier).update(await readFile(fichier));
  // Chemins d'URL : séparateurs « / » (y compris sous Windows) et pages sans « index.html ».
  const adresses = fichiers
    .map((fichier) => '/' + fichier.slice(sortie.length + 1).split(/[\\/]/).join('/'))
    .map((adresse) => adresse.replace(/index\.html$/, ''))
    // Les widgets s'affichent chez d'autres sites, en ligne : inutile de les garder hors ligne.
    .filter((adresse) => !adresse.startsWith('/widget/'));
  await writeFile(join(sortie, 'sw.js'), serviceWorker(`${nomSite}-${empreinte.digest('hex').slice(0, 12)}`, adresses));

  console.log(`✓ ${nomSite} : ${calculateurs.length} calculateur(s) → dist/${nomSite}/`);
}

async function principal() {
  const demande = process.argv[2];
  const sites = demande ? [demande] : await listerSites();
  for (const nomSite of sites) await construireSite(nomSite);
}

// N'exécute la génération que si le fichier est lancé directement (pas quand test.js l'importe).
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  principal().catch((erreur) => {
    console.error(`✗ ${erreur.message}`);
    process.exit(1);
  });
}
