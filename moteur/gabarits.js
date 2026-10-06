// moteur/gabarits.js
// Gabarits HTML communs à tous les sites.
// Les textes courts (titres, libellés) sont échappés.
// Les champs "intro", "introAccueil", "explication" et "reponse" acceptent du HTML :
// c'est du contenu que tu rédiges toi-même, jamais une saisie d'internaute.

import { T, textesDe } from './langue.js';
import { ELEMENTS_PAR_NATURE } from './chantier-plan.js';

export function echapper(texte = '') {
  return String(texte)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function sansBalises(html = '') {
  return String(html).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

// Empêche une chaîne "</script>" de fermer la balise script prématurément.
function jsonPourScript(objet) {
  return JSON.stringify(objet).replace(/</g, '\\u003c');
}

// --- Langues : adresses des pages ---
// Langues du site (la première est la langue par défaut, servie à la racine ; les autres sous /<code>/).
let languesDuSite = ['fr'];
// Calculateurs du site, pour le panneau de navigation (défini par build.js avant la génération).
let calculateursDuSite = [];
export function definirCalculateurs(calculateurs) {
  calculateursDuSite = calculateurs;
}
export function definirLangues(langues) {
  languesDuSite = langues;
}
const prefixeDe = (code) => (code === languesDuSite[0] ? '' : `/${code}`);

// Adresse d'une page dans une langue (la langue active par défaut), slug traduit compris :
// page = { type: 'accueil' | 'calculateur' | 'lot' | 'devis' | 'mentions' | 'confidentialite', calc?, lot? }.
export function cheminDe(page, textes = T()) {
  const prefixe = prefixeDe(textes.code);
  const segments = textes.chemins;
  switch (page.type) {
    case 'calculateur':
      return `${prefixe}/${page.calc.slugs?.[textes.code] ?? page.calc.slug}/`;
    case 'lot':
      return `${prefixe}/${segments.corpsDeMetier}/${page.lot.id}/`;
    case 'devis':
      return `${prefixe}/${segments.devis}/`;
    case 'mentions':
      return `${prefixe}/${segments.mentionsLegales}/`;
    case 'confidentialite':
      return `${prefixe}/${segments.confidentialite}/`;
    default:
      return `${prefixe}/`;
  }
}

// Balises hreflang réciproques vers chaque langue, et x-default vers la langue par défaut.
// Rien si le site n'a qu'une langue.
function alternatives(site, page) {
  if (!page || languesDuSite.length < 2) return '';
  const balise = (hreflang, code) => `\n  <link rel="alternate" hreflang="${hreflang}" href="${echapper(adresse(site, cheminDe(page, textesDe(code))))}">`;
  return languesDuSite.map((code) => balise(code, code)).join('') + balise('x-default', languesDuSite[0]);
}

function adresse(site, chemin) {
  return site.domaine.replace(/\/$/, '') + chemin;
}

// Transforme { couleurPrincipale: '#123' } en "--couleur-principale: #123;".
// La clé "teintes" produit une variable par calculateur : { carrelage: '#0E6E82' } → --teinte-carrelage.
function declarations(theme, retrait = '  ') {
  const lignes = [];
  for (const [cle, valeur] of Object.entries(theme)) {
    if (cle === 'teintes') {
      for (const [nom, couleur] of Object.entries(valeur)) lignes.push(`${retrait}--teinte-${nom}: ${couleur};`);
      continue;
    }
    lignes.push(`${retrait}--${cle.replace(/[A-Z]/g, (lettre) => '-' + lettre.toLowerCase())}: ${valeur};`);
  }
  return lignes.join('\n');
}

// Thème du site. Avec un thème de nuit :
// - l'appareil en mode sombre affiche la nuit, sauf si l'internaute a choisi le jour ;
// - le bouton « Mode nuit » force l'un ou l'autre (attribut data-theme sur <html>) ;
// - l'impression repasse toujours en jour (devis lisible sur papier).
export function themeCss(theme = {}, themeNuit = null) {
  let css = `/* Généré par build.js à partir de site.js : ne pas modifier à la main. */\n:root {\n  color-scheme: light;\n${declarations(theme)}\n}\n`;
  if (!themeNuit) return css;

  css += `
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="jour"]) {
    color-scheme: dark;
${declarations(themeNuit, '    ')}
  }
}

:root[data-theme="nuit"] {
  color-scheme: dark;
${declarations(themeNuit)}
}

@media print {
  :root[data-theme],
  :root:not([data-theme]) {
    color-scheme: light;
${declarations(theme, '    ')}
  }
}
`;
  return css;
}

function blocsJsonLd(donnees) {
  return donnees
    .map((objet) => `<script type="application/ld+json">${jsonPourScript(objet)}</script>`)
    .join('\n  ');
}

// Menu des corps de métier, présent sur toutes les pages des sites qui en déclarent.
// site.menuLots est calculé par build.js (corps de métier ayant au moins un calculateur).
// lotActif : 'accueil', l'id du corps de métier de la page, ou null.
// Panneau de navigation : un <details> natif (utilisable sans JavaScript) dont le titre est le bouton
// « Calculateurs ». Il contient la recherche (activée par appli.js), les calculateurs par type de
// chantier (site.typesChantier) et les pages de corps de métier. Rien si le site n'a pas de types.
function navigationHtml(site, chemin) {
  if (!site.typesChantier?.length) return '';
  const parSlug = new Map(calculateursDuSite.map((calc) => [calc.slug, calc]));
  const lien = (calc) => {
    const href = cheminDe({ type: 'calculateur', calc });
    const courant = href === chemin ? ' aria-current="page"' : '';
    const mots = [calc.rubrique, site.lots?.find((lot) => lot.id === calc.lot)?.nom, calc.description].filter(Boolean).join(' ');
    return `<li><a href="${href}"${courant} data-mots="${echapper(mots)}">${echapper(calc.titre)}</a></li>`;
  };
  const types = site.typesChantier
    .map((type) => `
          <details class="navigation-type">
            <summary>${echapper(type.nom)}</summary>
            <ul>
              ${type.calculateurs.map((slug) => parSlug.get(slug)).filter(Boolean).map(lien).join('\n              ')}
            </ul>
          </details>`)
    .join('');
  const corps = (site.menuLots ?? [])
    .map((lot) => {
      const href = cheminDe({ type: 'lot', lot });
      return `<li><a href="${href}"${href === chemin ? ' aria-current="page"' : ''}>${echapper(lot.nom)}</a></li>`;
    })
    .join('\n            ');
  return `
    <details class="navigation" id="navigation">
      <summary class="navigation-bouton"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg><span class="navigation-bouton-texte">${T().navigation.bouton}</span></summary>
      <section class="navigation-panneau" aria-label="${T().navigation.panneau}">
        <p class="navigation-recherche" hidden>
          <label for="recherche-calculateur">${T().navigation.recherche}</label>
          <input id="recherche-calculateur" type="search" autocomplete="off" spellcheck="false" placeholder="${T().navigation.exemple}" aria-describedby="recherche-statut">
        </p>
        <p class="navigation-statut" id="recherche-statut" role="status"></p>
        <ul class="navigation-resultats" id="recherche-resultats" hidden></ul>
        <section class="navigation-types" aria-labelledby="navigation-titre-types">
          <p class="navigation-titre" id="navigation-titre-types">${T().navigation.parType}</p>
          <section class="navigation-grille">${types}
          </section>
        </section>
        <section class="navigation-corps" aria-labelledby="navigation-titre-corps">
          <p class="navigation-titre" id="navigation-titre-corps">${T().navigation.parCorps}</p>
          <ul>
            <li><a href="${cheminDe({ type: 'accueil' })}">${T().page.tousLesCalculateurs}</a></li>
            ${corps}
          </ul>
        </section>
      </section>
    </details>`;
}

function miseEnPage(site, { titre, description, chemin, contenu, jsonLd = '', script = '', indexer = true, lotActif = null, publicite = true, page = null }) {
  const annee = new Date().getFullYear();
  const url = adresse(site, chemin);
  return `<!doctype html>
<html lang="${T().code}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${echapper(titre)}</title>
  <meta name="description" content="${echapper(description)}">
  ${indexer ? `<link rel="canonical" href="${echapper(url)}">${alternatives(site, page)}` : '<meta name="robots" content="noindex">'}
  <meta property="og:type" content="website">
  <meta property="og:locale" content="${T().ogLocale}">
  <meta property="og:site_name" content="${echapper(site.nom)}">
  <meta property="og:title" content="${echapper(titre)}">
  <meta property="og:description" content="${echapper(description)}">
  <meta property="og:url" content="${echapper(url)}">
  ${site.themeNuit ? `<script>try{var t=localStorage.getItem('theme-affichage');if(t==='jour'||t==='nuit')document.documentElement.dataset.theme=t}catch(e){}</script>
  ` : ''}<link rel="manifest" href="/manifest.webmanifest">
  <link rel="icon" href="/icones/favicon-32.png" sizes="32x32" type="image/png">
  <link rel="apple-touch-icon" href="/icones/apple-touch-icon.png">
  <meta name="apple-mobile-web-app-title" content="${echapper(site.application?.nomCourt ?? site.nom)}">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="theme-color" content="${echapper(site.theme?.couleurFond ?? '#ffffff')}"${site.themeNuit ? ` media="(prefers-color-scheme: light)">
  <meta name="theme-color" content="${echapper(site.themeNuit.couleurFond)}" media="(prefers-color-scheme: dark)"` : ''}>
  <link rel="stylesheet" href="/assets/style.css">
  <link rel="stylesheet" href="/assets/theme.css">
  ${adsense(site) ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsense(site).client}" crossorigin="anonymous"></script>` : ''}
  ${site.monetisation?.scriptEntete ?? ''}
  ${jsonLd}
</head>
<body${publicite && pubsLaterales(site) ? ' class="avec-pub-laterale"' : ''}>
  <a class="evitement" href="#contenu">${T().page.evitement}</a>
  <section class="bandeau-maj" id="bandeau-maj" role="status" aria-label="${T().page.miseAJour}" hidden>
    <p>${T().page.nouvelleVersion(echapper(site.application?.nomCourt ?? site.nom))}</p>
    <p class="bandeau-maj-actions">
      <button type="button" class="bouton-principal" id="bandeau-maj-recharger">${T().page.recharger}</button>
      <button type="button" id="bandeau-maj-fermer">${T().page.plusTard}</button>
    </p>
  </section>
  <header class="entete">
    <a class="marque" href="${cheminDe({ type: 'accueil' })}">${site.marqueHtml ?? echapper(site.nom)}</a>
    <p class="slogan">${echapper(site.slogan ?? '')}</p>${navigationHtml(site, chemin)}${site.devis || site.themeNuit ? `
    <nav class="entete-nav" aria-label="${T().page.navigationPrincipale}">
      <ul>${site.themeNuit ? `
        <li><button type="button" id="bascule-theme" class="bascule-theme"><svg class="icone-nuit" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg><svg class="icone-jour" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg><span class="bascule-texte">${T().theme.modeNuit}</span></button></li>` : ''}${site.unitesImperiales ? `
        <li><button type="button" id="bascule-imperial" class="bascule-imperial" role="switch" aria-checked="false" aria-label="${T().unites.interrupteur}" title="${T().unites.interrupteurTitre}">ft/lb</button></li>` : ''}${site.devis ? `
        <li><a href="${cheminDe({ type: 'devis' })}"><span class="devis-long">${T().page.monDevis}</span><span class="devis-court">${T().page.monDevisCourt}</span> <span id="compteur-devis"></span></a></li>` : ''}
      </ul>
    </nav>` : ''}
  </header>
  <main id="contenu">
${contenu}
  </main>
${publicite ? pubsLaterales(site) : ''}
  <footer class="pied">
${site.unitesImperiales ? `    <details class="reglages-unites">
      <summary>${T().unites.titre}</summary>
      <p class="champ-case"><input type="checkbox" id="reglage-imperial"><label for="reglage-imperial">${T().unites.case}</label></p>
      <fieldset class="reglage-gallon">
        <legend>${T().unites.gallon}</legend>
        <p class="champ-case"><input type="radio" name="gallon" id="gallon-uk" value="uk" checked><label for="gallon-uk">${T().unites.gallonUk}</label></p>
        <p class="champ-case"><input type="radio" name="gallon" id="gallon-us" value="us"><label for="gallon-us">${T().unites.gallonUs}</label></p>
      </fieldset>
      <p>${T().unites.explication}</p>
    </details>
` : ''}    <details class="installation" id="installation">
      <summary>${T().appli.installerTitre(echapper(site.application?.nomCourt ?? site.nom))}</summary>
      <p>${T().appli.installerTexte}</p>
      <p><button type="button" id="installer" class="bouton-principal" hidden>${T().appli.installerBouton}</button></p>
      <p id="installation-iphone" hidden>${T().appli.installerIphone}</p>
      <p id="installation-autre">${T().appli.installerAutre}</p>
    </details>
    <p>© ${annee} ${echapper(site.nom)}</p>
    <nav aria-label="${T().page.informationsLegales}">
      <ul>
        <li><a href="${cheminDe({ type: 'mentions' })}">${T().page.mentionsLegales}</a></li>
        <li><a href="${cheminDe({ type: 'confidentialite' })}">${T().page.confidentialite}</a></li>${adsense(site) ? `
        <li><button type="button" class="lien-bouton" id="gerer-cookies">${T().page.gererCookies}</button></li>` : ''}
      </ul>
    </nav>
  </footer>
${script}
  <script type="module">
    import { demarrerAppli, demarrerReglagesUnites, demarrerIntegration, demarrerNavigation } from '/assets/appli.js';
    demarrerNavigation();
    demarrerAppli();
    demarrerReglagesUnites();
    demarrerIntegration();
  </script>${adsense(site) ? `
  <script>
    // Rouvre la fenêtre de consentement de Google (CMP certifiée) pour modifier ses choix.
    document.getElementById('gerer-cookies')?.addEventListener('click', function () {
      window.googlefc = window.googlefc || {};
      window.googlefc.callbackQueue = window.googlefc.callbackQueue || [];
      window.googlefc.callbackQueue.push(function () { window.googlefc.showRevocationMessage(); });
    });
  </script>` : ''}${site.devis || site.themeNuit ? `
  <script type="module">${site.themeNuit ? `
    import { brancherBascule } from '/assets/theme.js';
    brancherBascule();` : ''}${site.devis ? `
    import { afficherCompteur } from '/assets/panier.js';
    afficherCompteur();` : ''}
  </script>` : ''}${adsense(site) ? `
  <script>
    // Annonces : une unité masquée à cette largeur (bandeaux latéraux sur mobile, emplacement dans
    // le contenu sur grand écran) est retirée ; seules les unités affichées sont demandées à la régie.
    document.querySelectorAll('ins.adsbygoogle').forEach((ins) => { if (!ins.offsetWidth) ins.remove(); });
    document.querySelectorAll('ins.adsbygoogle').forEach(() => (window.adsbygoogle = window.adsbygoogle || []).push({}));
  </script>` : ''}
</body>
</html>
`;
}

function champHtml(champ) {
  const aide = champ.aide ? `<small id="aide-${champ.id}">${echapper(champ.aide)}</small>` : '';
  const decritAide = champ.aide ? ` aria-describedby="aide-${champ.id}"` : '';

  if (champ.type === 'case') {
    return `
          <p class="champ champ-case">
            <input id="champ-${champ.id}" name="${champ.id}" type="checkbox"${champ.defaut ? ' checked' : ''}${decritAide}>
            <label for="champ-${champ.id}">${echapper(champ.label)}</label>
            ${aide}
          </p>`;
  }

  // Liste à vignettes : boutons radio illustrés d'un petit schéma SVG (types de pose, par exemple).
  if (champ.type === 'choix' && champ.presentation === 'vignettes') {
    const vignettes = champ.options
      .map((option, index) => `
              <label class="vignette">
                <input type="radio" name="${champ.id}" value="${option.valeur}"${option.valeur === champ.defaut ? ' checked' : ''}>
                <svg viewBox="0 0 60 40" width="72" height="48" role="img" aria-labelledby="schema-${champ.id}-${index}"><title id="schema-${champ.id}-${index}">${T().formulaire.schema(echapper(option.libelle.toLowerCase()))}</title><defs><clipPath id="cadre-${champ.id}-${index}"><rect x="2" y="2" width="56" height="36"/></clipPath></defs><g clip-path="url(#cadre-${champ.id}-${index})">${option.schema ?? ''}</g><rect class="schema-cadre" x="2" y="2" width="56" height="36"/></svg>
                <span>${echapper(option.libelle)}</span>
              </label>`)
      .join('');
    return `
          <fieldset class="champ champ-vignettes" id="champ-${champ.id}"${champ.aide ? ` aria-describedby="aide-${champ.id}"` : ''}>
            <legend>${echapper(champ.label)}</legend>
            <p class="vignettes">${vignettes}
            </p>
            ${aide}
          </fieldset>`;
  }

  if (champ.type === 'choix') {
    const options = champ.options
      .map((option) => `<option value="${option.valeur}"${option.valeur === champ.defaut ? ' selected' : ''}>${echapper(option.libelle)}</option>`)
      .join('');
    return `
          <p class="champ">
            <label for="champ-${champ.id}">${echapper(champ.label)}</label>
            <select id="champ-${champ.id}" name="${champ.id}"${decritAide}>${options}</select>
            ${aide}
          </p>`;
  }

  const decrit = [champ.aide ? `aide-${champ.id}` : null, champ.remplacePar ? `auto-${champ.id}` : null, champ.suggestionChantier ? `suggestion-${champ.id}` : null, `erreur-${champ.id}`].filter(Boolean).join(' ');
  const libelle = champ.unite ? `${champ.label} (${champ.unite})` : champ.label;
  const valeurParDefaut = champ.defaut === undefined ? '' : String(champ.defaut).replace('.', T().separateurDecimal);
  return `
          <p class="champ">
            <label for="champ-${champ.id}">${echapper(libelle)}${champ.requis ? '' : ` <small class="facultatif">${T().formulaire.facultatif}</small>`}</label>
            <input id="champ-${champ.id}" name="${champ.id}" type="text" inputmode="decimal" autocomplete="off" spellcheck="false" value="${echapper(valeurParDefaut)}" aria-describedby="${decrit}"${champ.requis ? ' required' : ''}>
            ${aide}${champ.remplacePar ? `
            <small id="auto-${champ.id}" class="auto" hidden>${T().formulaire.calculeOuvertures}</small>` : ''}${champ.suggestionChantier ? `
            <small id="suggestion-${champ.id}" class="suggestion" role="status" hidden></small>` : ''}
            <small id="erreur-${champ.id}" class="erreur" hidden></small>
          </p>`;
}

// Aide au choix : questions fermées en boutons radio ; la recommandation préremplit les champs,
// qui restent modifiables (voir moteur/aide-choix.js).
function aideAuChoixHtml(calc) {
  const aide = calc.aideAuChoix;
  if (!aide) return '';
  const questions = aide.questions
    .map((question) => `
            <fieldset class="aide-choix-question">
              <legend>${echapper(question.question)}</legend>
              <p class="aide-choix-reponses">${question.options
                .map((option) => `
                <span class="champ-case"><input type="radio" name="aide-${question.id}" id="aide-${question.id}-${option.valeur}" value="${echapper(option.valeur)}"><label for="aide-${question.id}-${option.valeur}">${echapper(option.libelle)}</label></span>`)
                .join('')}
              </p>
            </fieldset>`)
    .join('');
  return `
          <details class="aide-choix">
            <summary>${T().aideChoix.titre}</summary>
            <p class="groupe-intro">${T().aideChoix.intro}</p>${questions}
            <p class="aide-choix-resultat" id="aide-choix-resultat" role="status"></p>
          </details>`;
}

// Regroupement des champs en sections titrées, pour un formulaire lisible.
// - champ.groupe : nom de la section (dans l'ordre de première apparition) ;
//   sans groupe, le champ va dans « Vos données » ;
// - les prix facultatifs (champ de prix d'une ligne de devis, ou id commençant par « prix ») vont
//   dans une section repliée ; un prix obligatoire reste avec les données ;
// - les champs marqués avance: true, ou nommés « marge », vont dans « Réglages avancés », repliée.
// calc.groupes (facultatif) : { 'Nom du groupe': 'phrase d’introduction' }.
function groupesHtml(calc) {
  const sections = new Map();
  const ajouter = (nom, champ) => {
    if (!sections.has(nom)) sections.set(nom, []);
    sections.get(nom).push(champ);
  };
  const avances = [];
  const prix = [];
  // Section « Prix pour le récapitulatif » : les prix facultatifs repris dans le devis. Un prix
  // obligatoire (prix d'achat d'un bien, prix de vente…) est une donnée du calcul : il reste visible.
  const prixDuDevis = new Set((calc.devis ?? []).map((ligne) => ligne.prixChamp).filter(Boolean));
  for (const champ of calc.champs) {
    if (!champ.requis && (prixDuDevis.has(champ.id) || champ.id.startsWith('prix'))) prix.push(champ);
    else if (champ.avance || champ.id === 'marge') avances.push(champ);
    else ajouter(champ.groupe ?? T().formulaire.vosDonnees, champ);
  }

  const identifiant = (nom) => 'groupe-' + nom.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const ouverts = [...sections].map(([nom, champs]) => `
          <fieldset class="groupe">
            <legend>${echapper(nom)}</legend>
            ${calc.groupes?.[nom] ? `<p class="groupe-intro" id="${identifiant(nom)}">${echapper(calc.groupes[nom])}</p>` : ''}
            <section class="groupe-champs" aria-label="${echapper(nom)}">${champs.map(champHtml).join('')}
            </section>
          </fieldset>`).join('');

  const replie = (titre, intro, champs) => champs.length ? `
          <details class="groupe groupe-replie">
            <summary>${echapper(titre)}</summary>
            <p class="groupe-intro">${echapper(intro)}</p>
            <section class="groupe-champs" aria-label="${echapper(titre)}">${champs.map(champHtml).join('')}
            </section>
          </details>` : '';

  return ouverts
    + replie(T().formulaire.reglagesAvances, T().formulaire.reglagesAvancesIntro, avances)
    + replie(T().formulaire.prix, T().formulaire.prixIntro, prix);
}

// Éditeur de plan : le contenu du SVG et du tableau est produit par moteur/plan.js.
// utiliseOuvertures : la section « Portes et fenêtres » est ouverte d'emblée si le calculateur s'en sert.
// Plan d'un calculateur. nature : pièce (plan intérieur), zone extérieure, mur (vue de face) ou pan de
// toit (dessiné à plat). avecSaisie : choix « Dessiner / Saisir les dimensions » (piloté par calcul.js).
function planHtml(utiliseOuvertures = false, nature = 'piece', avecSaisie = false) {
  const n = T().natures[nature];
  const estPiece = nature === 'piece';
  const avecEnsemble = nature === 'piece' || nature === 'zone';
  const modelesNature = { piece: ['l', 'libre'], zone: ['l', 'libre'], mur: ['pignon', 'libre'], pan: ['trapeze', 'triangle', 'libre'] }[nature];
  const portees = estPiece ? ['piece', 'niveau', 'chantier'] : ['piece', 'chantier'];
  const libellePortee = (portee) => (portee === 'piece' ? n.ceci : portee === 'chantier' ? n.tous : T().portee.niveau);
  return `
        <fieldset class="plan" id="plan" data-nature="${nature}"${avecSaisie ? ' data-mode="saisie"' : ''}>
          <legend>${n.titre}</legend>${avecSaisie ? `
          <fieldset class="mode-dimensions">
            <legend>${T().modeDimensions.titre}</legend>
            <p class="champ-case"><input type="radio" name="mode-dimensions" id="mode-saisie" value="saisie" checked><label for="mode-saisie">${T().modeDimensions.saisie}</label></p>
            <p class="champ-case"><input type="radio" name="mode-dimensions" id="mode-dessin" value="dessin"><label for="mode-dessin">${T().modeDimensions.dessin}</label></p>
          </fieldset>` : ''}
          <details class="aide-plan">
            <summary>${T().aidePlan.titre}</summary>
            <p>${T().aidePlan.rassurance}</p>
            <ol>
${T().aidePlan.etapes[nature].map((etape) => `              <li>${etape}</li>`).join('\n')}
            </ol>
          </details>
          <section class="pieces" aria-label="${estPiece ? T().pieces.region : n.titre}">
            <p class="champ">
              <label for="piece-active">${n.objet}</label>
              <select id="piece-active" aria-describedby="pieces-statut pieces-aide"></select>
            </p>
            <p class="pieces-statut" id="pieces-statut"></p>
            <p class="champ">
              <label for="piece-nom">${n.nom}</label>
              <input id="piece-nom" type="text" autocomplete="off" maxlength="60">
            </p>
${estPiece ? `
            <p class="champ">
              <label for="piece-hauteur">${T().pieces.hauteur}</label>
              <input id="piece-hauteur" type="text" inputmode="decimal" autocomplete="off">
            </p>` : ''}${avecEnsemble ? `
            <p class="champ">
              <label for="piece-niveau">${T().niveaux.niveauPiece}</label>
              <select id="piece-niveau"></select>
            </p>` : ''}
            <p class="pieces-actions">
              <button type="button" data-piece-action="ajouter">${n.nouvelle}</button>
              <button type="button" data-piece-action="dupliquer">${T().pieces.dupliquer}</button>
              <button type="button" data-piece-action="supprimer">${T().pieces.supprimer}</button>
            </p>
            <small id="pieces-aide" class="pieces-aide">${n.aide}</small>
          </section>${nature === 'mur' ? `
          <details class="plan-depuis">
            <summary>${T().depuisPlan.titre}</summary>
            <p class="plan-depuis-choix">
              <label for="depuis-mur">${T().depuisPlan.libelle}</label>
              <select id="depuis-mur"></select>
              <button type="button" id="depuis-creer">${T().depuisPlan.creer}</button>
            </p>
            <p class="plan-consigne" id="depuis-statut" role="status"></p>
          </details>` : ''}${avecEnsemble ? `
          <p class="plan-vues" role="group" aria-label="${T().ensemble.choixVue}">
            <button type="button" data-vue="piece" aria-pressed="true">${T().ensemble.vuePiece}</button>
            <button type="button" data-vue="ensemble" aria-pressed="false">${T().ensemble.vueEnsemble}</button>
          </p>` : ''}
          <fieldset class="portee">
            <legend>${T().portee.titre}</legend>
            ${portees.map((portee) => `<p class="champ-case"><input type="radio" name="portee-calcul" id="portee-${portee}" value="${portee}"${portee === 'piece' ? ' checked' : ''}><label for="portee-${portee}">${libellePortee(portee)}</label></p>`).join('\n            ')}
          </fieldset>${avecEnsemble ? `
          <section class="ensemble" aria-label="${T().ensemble.vueEnsemble}" hidden>
            <p class="plan-consigne">${T().ensemble.consigne}</p>
            <p class="ensemble-niveaux">
              <span class="champ"><label for="ensemble-niveau">${T().niveaux.affiche}</label><select id="ensemble-niveau"></select></span>
              <span class="champ"><label for="niveau-nom">${T().niveaux.nom}</label><input id="niveau-nom" type="text" maxlength="60" autocomplete="off"></span>
              <button type="button" data-ensemble="niveau-ajouter">${T().niveaux.ajouter}</button>
            </p>
            <svg class="plan-svg ensemble-svg" role="img" aria-labelledby="ensemble-resume" xmlns="http://www.w3.org/2000/svg"></svg>
            <p class="plan-resume" id="ensemble-resume" aria-live="polite"></p>
            <p class="ensemble-actions">
              <button type="button" data-ensemble="tourner">${T().ensemble.tourner}</button>
              <button type="button" data-ensemble="modifier">${T().ensemble.modifier}</button>
            </p>
            <details class="ensemble-positions">
              <summary>${T().ensemble.clavier}</summary>
              <table class="plan-points">
                <caption>${T().ensemble.legende}</caption>
                <thead>
                  <tr><th scope="col">${T().commun.piece}</th><th scope="col">${T().ensemble.colX}</th><th scope="col">${T().ensemble.colY}</th><th scope="col">${T().ensemble.colRotation}</th><th scope="col">${T().commun.action}</th></tr>
                </thead>
                <tbody></tbody>
              </table>
            </details>
          </section>` : ''}
          <p class="plan-consigne">${T().plan.consigne}</p>
          <details class="plan-aide">
            <summary>${T().plan.aideTitre}</summary>
            <p>${T().plan.aideTexte}</p>
          </details>
          <p class="plan-rapide">
            <label for="plan-largeur">${n.largeur}</label>
            <input id="plan-largeur" type="text" inputmode="numeric" autocomplete="off" value="${n.largeurDefaut}">
            <label for="plan-longueur">${n.longueur}</label>
            <input id="plan-longueur" type="text" inputmode="numeric" autocomplete="off" value="${n.longueurDefaut}">
            <button type="button" data-modele="rectangle">${n.rectangle}</button>
          </p>
          <p class="plan-modeles">
            ${modelesNature.map((modele) => `<button type="button" data-modele="${modele}">${T().modeles[modele]}</button>`).join('\n            ')}
          </p>
          <svg class="plan-svg" role="img" aria-labelledby="plan-resume" xmlns="http://www.w3.org/2000/svg"></svg>
          <p class="plan-resume" id="plan-resume" aria-live="polite"></p>
          <details class="plan-coordonnees">
            <summary>${T().plan.coordonnees}</summary>
            <table class="plan-points plan-coordonnees">
              <caption>${T().plan.coordonneesLegende}</caption>
              <thead>
                <tr><th scope="col">${T().plan.colAngle}</th><th scope="col">${T().plan.colHorizontal}</th><th scope="col">${T().plan.colVertical}</th><th scope="col">${T().plan.colCote}</th><th scope="col">${T().commun.action}</th></tr>
              </thead>
              <tbody></tbody>
            </table>
            <p><button type="button" data-action="ajouter">${T().plan.ajouterAngle}</button></p>
          </details>
${estPiece ? `
          <details class="plan-murs">
            <summary>${T().murs.titre}</summary>
            <p class="plan-consigne">${T().murs.consigne}</p>
            <p class="plan-murs-tous">
              <label for="murs-tous">${T().murs.tousLibelle}</label>
              <select id="murs-tous">${Object.entries(T().murs.types).map(([cle, libelle]) => `<option value="${cle}">${libelle}</option>`).join('')}</select>
              <button type="button" id="murs-appliquer">${T().murs.appliquer}</button>
            </p>
            <table class="plan-points plan-murs-tableau">
              <caption>${T().murs.legende}</caption>
              <thead>
                <tr><th scope="col">${T().murs.colMur}</th><th scope="col">${T().murs.colLongueur}</th><th scope="col">${T().murs.colType}</th><th scope="col">${T().murs.colEpaisseur}</th></tr>
              </thead>
              <tbody></tbody>
            </table>
          </details>` : ''}
          <details class="plan-elements">
            <summary>${n.elementsTitre}</summary>
            <p class="plan-consigne">${n.consigneElements}</p>
            <p class="plan-elements-ajout">
              <label for="element-type">${T().elements.typeLibelle}</label>
              <select id="element-type">${ELEMENTS_PAR_NATURE[nature].map((cle) => `<option value="${cle}">${T().elements.types[cle]}</option>`).join('')}</select>
              <button type="button" id="element-ajouter">${T().elements.ajouter}</button>
            </p>
            <table class="plan-points plan-elements-tableau">
              <caption>${T().elements.legende}</caption>
              <thead>
                <tr><th scope="col">${T().elements.colElement}</th><th scope="col">${T().ensemble.colX}</th><th scope="col">${T().ensemble.colY}</th><th scope="col">${T().elements.colLargeur}</th><th scope="col">${T().elements.colLongueur}</th><th scope="col">${T().commun.action}</th></tr>
              </thead>
              <tbody></tbody>
            </table>
          </details>
${estPiece ? `
          <details class="plan-ouvertures"${utiliseOuvertures ? ' open' : ''}>
            <summary>${T().ouvertures.titre}<span class="plan-ouvertures-nombre"></span></summary>
            <p class="plan-consigne">${T().ouvertures.consigne}</p>
            <p class="plan-modeles">
              <button type="button" data-ajout-ouverture="porte">${T().ouvertures.ajouterPorte}</button>
              <button type="button" data-ajout-ouverture="fenetre">${T().ouvertures.ajouterFenetre}</button>
              <button type="button" data-ajout-ouverture="porte-fenetre">${T().ouvertures.ajouterPorteFenetre}</button>
            </p>
            <table class="plan-points plan-ouvertures-tableau">
              <caption>${T().ouvertures.legende}</caption>
              <thead>
                <tr><th scope="col">${T().commun.nom}</th><th scope="col">${T().ouvertures.colType}</th><th scope="col">${T().ouvertures.colMur}</th><th scope="col">${T().ouvertures.colLargeur}</th><th scope="col">${T().ouvertures.colHauteur}</th><th scope="col">${T().ouvertures.colPosition}</th><th scope="col">${T().commun.action}</th></tr>
              </thead>
              <tbody></tbody>
            </table>
          </details>` : ''}
        </fieldset>`;
}

function devisHtml(calc) {
  // Zone saisie pour le devis : calculateurs sans plan, ou en mode « Saisir les dimensions ».
  const champPiece = calc.plan && !calc.plan.saisie
    ? ''
    : `
            <label for="nom-piece">${T().devis.zone}</label>
            <input id="nom-piece" type="text" autocomplete="off" maxlength="60">`;
  if (!calc.devis?.length) return '';
  const complements = calc.devis.filter((ligne) => ligne.complement);
  const caseComplements = complements.length
    ? `
          <p class="champ-case devis-complements">
            <input id="devis-complements" type="checkbox" checked>
            <label for="devis-complements">${T().devis.complements}${echapper(complements.map((ligne) => ligne.designation.toLowerCase()).join(', '))}</label>
          </p>`
    : '';
  return `${caseComplements}
          <p class="devis-ajout">${champPiece}
            <button type="button" id="ajouter-devis">${T().devis.ajouter}${calc.plan ? ' <span class="devis-piece" id="devis-piece"></span>' : ''}</button>
            <a href="${cheminDe({ type: 'devis' })}">${T().devis.voir}</a>
          </p>
          <p class="devis-statut" id="devis-statut" role="status"></p>`;
}

function resultatHtml(resultat, estPrincipal, idsChamps) {
  const classe = estPrincipal ? ' class="resultat-principal"' : '';
  // Seul le résultat principal est annoncé par les lecteurs d'écran à chaque modification.
  const annonce = estPrincipal ? '' : ' aria-live="off"';
  return `
            <dt${classe}>${echapper(resultat.label)}</dt>
            <dd${classe}><output id="res-${resultat.id}" for="${idsChamps}"${annonce}>—</output><small class="equivalent" id="eq-${resultat.id}" hidden></small></dd>`;
}

// Liens d'achat du récapitulatif : { id: url } pour chaque lien d'affiliation qui porte un id.
export function liensAchat(site) {
  return Object.fromEntries((site.monetisation?.affiliation ?? []).filter((lien) => lien.id && lien.url).map((lien) => [lien.id, lien.url]));
}

function affiliationsHtml(site, slug) {
  const liens = (site.monetisation?.affiliation ?? []).filter((lien) => !lien.pages || lien.pages.includes(slug));
  return liens
    .map(
      (lien) => `
      <aside class="affiliation" aria-label="${T().commun.lienPartenaire}">
        <p class="affiliation-mention">${T().commun.lienPartenaire}</p>
        <p>${echapper(lien.texte)} <a href="${echapper(lien.url)}" rel="sponsored noopener">${echapper(lien.libelleLien)}</a></p>
      </aside>`
    )
    .join('');
}

// Bandeaux publicitaires latéraux : hors de la colonne de contenu, visibles seulement
// sur les grands écrans (voir style.css). Taille fixe réservée pour éviter tout décalage.
// monetisation.pubLaterale = { gauche, droite, largeur, hauteur, apercu }.

// Régie Google AdSense : active seulement si un identifiant éditeur valide est renseigné.
// monetisation.adsense = { client: 'ca-pub-…', emplacements: { gauche, droite, contenu } }.
export function adsense(site) {
  const regie = site.monetisation?.adsense;
  return /^ca-pub-\d{10,20}$/.test(regie?.client ?? '') ? regie : null;
}

// Unité d'annonce AdSense : taille fixe (bandeaux) ou adaptative (emplacement dans le contenu).
function uniteAdsense(regie, slot, taille = null) {
  if (!/^\d{5,20}$/.test(slot ?? '')) return '';
  const style = taille ? `display:inline-block;width:${taille.largeur}px;height:${taille.hauteur}px` : 'display:block';
  const adaptatif = taille ? '' : ' data-ad-format="auto" data-full-width-responsive="true"';
  // Pas de demande d'annonce ici : le script de fin de page (miseEnPage) ne demande que les unités affichées.
  return `<ins class="adsbygoogle" style="${style}" data-ad-client="${regie.client}" data-ad-slot="${slot}"${adaptatif}></ins>`;
}

function pubsLaterales(site) {
  const pub = site.monetisation?.pubLaterale;
  if (!pub) return '';
  const largeur = pub.largeur ?? 160;
  const hauteur = pub.hauteur ?? 600;
  const regie = adsense(site);
  const bloc = (cote, codeManuel) => {
    const code = codeManuel || (regie ? uniteAdsense(regie, regie.emplacements?.[cote], { largeur, hauteur }) : '');
    if (!code && !pub.apercu) return '';
    const contenu = code || `<span class="pub-apercu">${T().commun.apercuLateral(largeur, hauteur)}</span>`;
    return `
  <aside class="pub-laterale pub-${cote}" aria-label="${T().commun.publicite}" style="--pub-largeur: ${largeur}px; --pub-hauteur: ${hauteur}px">
    <p class="pub-mention">${T().commun.publicite}</p>
    ${contenu}
  </aside>`;
  };
  return bloc('gauche', pub.gauche) + bloc('droite', pub.droite);
}

// Emplacement publicitaire dans le contenu, pour les écrans où les bandeaux latéraux
// n'ont pas la place (moins de 1 280 px). Placé après l'explication du calcul, loin des
// champs et des boutons. monetisation.pubContenu = { code, apercu }.
function pubContenuHtml(site) {
  const pub = site.monetisation?.pubContenu;
  const regie = adsense(site);
  const code = pub?.code || (regie ? uniteAdsense(regie, regie.emplacements?.contenu) : '');
  if (!pub || (!code && !pub.apercu)) return '';
  const contenu = code || T().commun.apercuContenu;
  return `
      <aside class="pub-contenu" aria-label="${T().commun.publicite}">
        <p class="pub-mention">${T().commun.publicite}</p>
        ${contenu}
      </aside>`;
}

function pubHtml(site) {
  const bloc = site.monetisation?.blocPub;
  return bloc ? `\n      <aside class="pub" aria-label="${T().commun.publicite}">${bloc}</aside>` : '';
}

// « 2026-09-30 » → « 30 septembre 2026 ».
const dateLongue = (iso) => new Intl.DateTimeFormat(T().locale, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));

// Fil d'Ariane : liste d'étapes { nom, chemin } ; la dernière est la page courante.
function filAriane(site, etapes) {
  const html = `
      <nav class="fil-ariane" aria-label="${T().page.filAriane}">
        <ol>
          ${etapes.map((etape, index) => index === etapes.length - 1
            ? `<li aria-current="page">${echapper(etape.nom)}</li>`
            : `<li><a href="${etape.chemin}">${echapper(etape.nom)}</a></li>`).join('\n          ')}
        </ol>
      </nav>`;
  const donnees = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: etapes.map((etape, index) => ({ '@type': 'ListItem', position: index + 1, name: etape.nom, item: adresse(site, etape.chemin) })),
  };
  return { html, donnees };
}

// Guide enrichi : erreurs fréquentes, conseils de mise en œuvre, normes de référence.
function guideHtml(calc) {
  const liste = (id, titre, elements) => elements?.length ? `
      <section class="texte" aria-labelledby="titre-${id}">
        <h2 id="titre-${id}">${titre}</h2>
        <ul>
          ${elements.map((element) => `<li>${element}</li>`).join('\n          ')}
        </ul>
      </section>` : '';
  const normes = calc.normes?.length ? `
      <section class="texte" aria-labelledby="titre-normes">
        <h2 id="titre-normes">${T().guide.normes}</h2>
        <ul class="normes">
          ${calc.normes.map((norme) => `<li>${norme.url ? `<a href="${echapper(norme.url)}" rel="noopener">${echapper(norme.titre)}</a>` : `<strong>${echapper(norme.titre)}</strong>`}${norme.description ? ` : ${echapper(norme.description)}` : ''}</li>`).join('\n          ')}
        </ul>
      </section>` : '';
  return liste('erreurs', T().guide.erreurs, calc.erreurs) + liste('conseils', T().guide.conseils, calc.conseils) + normes;
}

// Calculateurs liés : la liste « lies » du calculateur, sinon les autres du même corps de métier.
function calculateursLies(calc, tous) {
  if (calc.lies?.length) return calc.lies.map((slug) => tous.find((autre) => autre.slug === slug)).filter(Boolean);
  const memeLot = tous.filter((autre) => autre.slug !== calc.slug && calc.lot && autre.lot === calc.lot);
  return memeLot.length ? memeLot : tous.filter((autre) => autre.slug !== calc.slug).slice(0, 6);
}

// Informations utiles au script du calculateur (pas les textes). widget : sans ajout au devis.
function configNavigateur(site, calc, indexPrincipal, { widget = false } = {}) {
  return {
    titre: calc.titre,
    plan: Boolean(calc.plan),
    planSaisie: Boolean(calc.plan?.saisie),
    slug: calc.slug,
    champs: calc.champs.map(({ id, label, type = 'nombre', requis = false, min, max, options, remplacePar, lienPiece, suggestionChantier, saisie }) => ({ id, label, type, requis, min, max, remplacePar, lienPiece, suggestionChantier, saisie, options: type === 'choix' ? options.map(({ valeur, libelle }) => ({ valeur, libelle })) : undefined })),
    resultats: calc.resultats.map(({ id, format, unite, equivalent, cumul }) => ({ id, format, unite, equivalent, cumul })),
    aideAuChoix: calc.aideAuChoix ? { questions: calc.aideAuChoix.questions.map(({ id }) => ({ id })), regles: calc.aideAuChoix.regles } : undefined,
    principal: calc.resultats[indexPrincipal].id,
    // Chaque ligne du devis prend le corps de métier du calculateur, sauf indication contraire.
    devis: widget ? [] : (calc.devis ?? []).map((ligne) => ({ ...ligne, lot: ligne.lot ?? nomDuLot(site, calc) })),
  };}

// Formulaire du calculateur : plan, données et résultats. Partagé par la page et par le widget.
function formulaireCalculateur(calc, indexPrincipal, idsChamps, { widget = false } = {}) {
  return `
      <form class="calculateur-formulaire" id="formulaire" novalidate>${calc.plan ? planHtml(calc.champs.some((champ) => champ.remplacePar), calc.plan.nature ?? 'piece', Boolean(calc.plan.saisie)) : ''}
        <section class="donnees" aria-label="${T().formulaire.vosDonnees}">${aideAuChoixHtml(calc)}${groupesHtml(calc)}
          <p class="actions"><button type="reset">${T().formulaire.reinitialiser}</button></p>
        </section>

        <section class="resultats" aria-labelledby="titre-resultats">
          <h2 id="titre-resultats">${T().resultat.titre}</h2>
          <p class="resultats-attente" id="attente">${calc.plan ? T().resultat.attentePlan : T().resultat.attente}</p>
          <dl>${calc.resultats.map((resultat, index) => resultatHtml(resultat, index === indexPrincipal, idsChamps)).join('')}
          </dl>${calc.plan ? '\n          <table class="detail-pieces" id="detail-pieces" hidden></table>' : ''}${widget ? '' : devisHtml(calc)}
        </section>
      </form>`;
}

export function pageCalculateur(site, calc, tous) {
  const page = { type: 'calculateur', calc };
  const chemin = cheminDe(page);
  const idsChamps = calc.champs.map((champ) => `champ-${champ.id}`).join(' ');
  const indexPrincipal = Math.max(0, calc.resultats.findIndex((resultat) => resultat.principal));
  const lies = calculateursLies(calc, tous);
  const lot = site.lots?.find((element) => element.id === calc.lot);
  const fil = filAriane(site, [
    { nom: T().page.accueil, chemin: cheminDe({ type: 'accueil' }) },
    ...(lot ? [{ nom: lot.nom, chemin: cheminDe({ type: 'lot', lot }) }] : []),
    { nom: calc.titre, chemin },
  ]);

  const donnees = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: calc.titre,
      description: calc.description,
      url: adresse(site, chemin),
      applicationCategory: calc.categorie ?? 'UtilitiesApplication',
      operatingSystem: 'Tous',
      inLanguage: T().code,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
      ...(calc.majLe ? { dateModified: calc.majLe } : {}),
    },
    fil.donnees,
  ];
  if (calc.faq?.length) {
    donnees.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: calc.faq.map((entree) => ({
        '@type': 'Question',
        name: entree.question,
        acceptedAnswer: { '@type': 'Answer', text: sansBalises(entree.reponse) },
      })),
    });
  }

  const config = configNavigateur(site, calc, indexPrincipal);


  const contenu = `
    <article class="calculateur"${calc.teinte ? ` style="--teinte: var(--teinte-${calc.teinte})"` : ''}>${fil.html}
      <header>
        ${calc.rubrique ? `<p class="surtitre">${T().calculateur.surtitre(echapper(calc.rubrique))}</p>` : ''}
        <h1>${echapper(calc.titre)}</h1>
        <p class="chapo">${calc.intro ?? ''}</p>
      </header>
      ${calc.avertissement ? `<p class="avertissement-norme"><strong>${T().calculateur.aSavoir}</strong> ${calc.avertissement}</p>` : ''}
${formulaireCalculateur(calc, indexPrincipal, idsChamps)}
      <a class="barre-resultat" href="#titre-resultats">
        <span class="barre-libelle">${echapper(calc.resultats[indexPrincipal].label)}</span>
        <span class="barre-valeur" id="barre-valeur">—</span>
        <span class="barre-action">${T().resultat.voirDetail}</span>
      </a>
      <noscript><p class="avertissement">${T().calculateur.javascript}</p></noscript>${calc.majLe ? `
      <p class="maj">${T().calculateur.verifieLe}<time datetime="${calc.majLe}">${dateLongue(calc.majLe)}</time>.</p>` : ''}
${pubContenuHtml(site)}
${affiliationsHtml(site, calc.slug)}
      ${calc.explication ? `<section class="texte" aria-labelledby="titre-explication">
        <h2 id="titre-explication">${T().calculateur.explication}</h2>
        ${calc.explication}
      </section>` : ''}${guideHtml(calc)}

      ${calc.faq?.length ? `<section class="texte" aria-labelledby="titre-faq">
        <h2 id="titre-faq">${T().calculateur.faq}</h2>
        ${calc.faq.map((entree) => `<details>
          <summary>${echapper(entree.question)}</summary>
          <p>${entree.reponse}</p>
        </details>`).join('\n        ')}
      </section>` : ''}
${pubHtml(site)}
      ${lies.length ? `<nav class="texte" aria-labelledby="titre-lies">
        <h2 id="titre-lies">${T().calculateur.lies}</h2>
        <ul>
          ${lies.map((autre) => `<li><a href="${cheminDe({ type: 'calculateur', calc: autre })}">${echapper(autre.titre)}</a></li>`).join('\n          ')}
        </ul>${lot ? `
        <p><a href="${cheminDe({ type: 'lot', lot })}">${T().calculateur.tousDuCorps(echapper(lot.nom))}</a></p>` : ''}
      </nav>` : ''}${integrationHtml(site, calc)}
    </article>`;

  const script = `  <script type="module">
    import { demarrer } from '/assets/calcul.js';
    import calculer from '/${calc.slug}/formule.js';
    demarrer(calculer, ${jsonPourScript(config)});
  </script>`;

  return miseEnPage(site, {
    lotActif: calc.lot ?? null,
    titre: `${calc.titre} | ${site.nom}`,
    description: calc.description,
    chemin,
    page,
    contenu,
    jsonLd: blocsJsonLd(donnees),
    script,
  });
}

// --- Widget intégrable ---

// Type du message envoyé par le widget à la page qui l'intègre (hauteur du contenu, en pixels).
export const MESSAGE_WIDGET = 'calculateur-hauteur';

// Code à copier pour intégrer le calculateur : iframe, lien texte visible hors de l'iframe, et petit
// script qui ajuste la hauteur en ne croyant que les messages venant de l'origine du site.
export function codeIntegration(site, calc, theme = 'jour') {
  const origine = new URL(adresse(site, '/')).origin;
  const source = adresse(site, `/widget/${calc.slug}/`) + (theme === 'nuit' ? '?theme=nuit' : '');
  return `<iframe src="${source}" title="${echapper(calc.titre)} – ${echapper(site.nom)}" width="100%" height="900" style="border:0;max-width:100%" loading="lazy" data-calculateur-widget></iframe>
<p><a href="${adresse(site, cheminDe({ type: 'calculateur', calc }))}">${echapper(calc.titre)}</a>${T().integration.credit(echapper(site.nom))}</p>
<script>
window.addEventListener('message', function (e) {
  if (e.origin !== '${origine}' || !e.data || e.data.type !== '${MESSAGE_WIDGET}') return;
  document.querySelectorAll('iframe[data-calculateur-widget]').forEach(function (f) {
    if (f.contentWindow === e.source) f.style.height = Math.min(Math.max(Number(e.data.hauteur) || 0, 200), 6000) + 'px';
  });
});
</script>`;
}

function integrationHtml(site, calc) {
  return `
      <details class="integrer">
        <summary>${T().integration.titre}</summary>
        <p>${T().integration.texte}</p>
        <fieldset class="integrer-theme">
          <legend>${T().integration.theme}</legend>
          <p class="champ-case"><input type="radio" name="integrer-theme" id="integrer-jour" value="jour" checked><label for="integrer-jour">${T().integration.clair}</label></p>
          <p class="champ-case"><input type="radio" name="integrer-theme" id="integrer-nuit" value="nuit"><label for="integrer-nuit">${T().integration.sombre}</label></p>
        </fieldset>
        <p class="champ">
          <label for="code-integration">${T().integration.code}</label>
          <textarea id="code-integration" readonly rows="9" spellcheck="false" data-code-jour="${echapper(codeIntegration(site, calc, 'jour'))}" data-code-nuit="${echapper(codeIntegration(site, calc, 'nuit'))}">${echapper(codeIntegration(site, calc, 'jour'))}</textarea>
        </p>
        <p><button type="button" id="copier-integration">${T().integration.copier}</button> <span id="integration-statut" role="status"></span></p>
      </details>`;
}

// Page du widget : le calculateur seul, sans en-tête, pied de page, publicité ni ajout au devis.
// Thème choisi par ?theme=nuit ; noindex et lien canonique vers la page du calculateur.
export function pageWidget(site, calc) {
  const indexPrincipal = Math.max(0, calc.resultats.findIndex((resultat) => resultat.principal));
  const idsChamps = calc.champs.map((champ) => `champ-${champ.id}`).join(' ');
  const config = configNavigateur(site, calc, indexPrincipal, { widget: true });
  return `<!doctype html>
<html lang="${T().code}" data-theme="jour">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${echapper(calc.titre)} | ${echapper(site.nom)}</title>
  <meta name="robots" content="noindex">
  <link rel="canonical" href="${adresse(site, cheminDe({ type: 'calculateur', calc }))}">
  <script>
    // Thème imposé par la page qui intègre le widget (?theme=nuit), sans toucher au réglage du site.
    document.documentElement.dataset.theme = new URLSearchParams(location.search).get('theme') === 'nuit' ? 'nuit' : 'jour';
  </script>
  <link rel="stylesheet" href="/assets/theme.css">
  <link rel="stylesheet" href="/assets/style.css">
</head>
<body class="widget">
  <main id="contenu">
    <article class="calculateur"${calc.teinte ? ` style="--teinte: var(--teinte-${calc.teinte})"` : ''}>
      <h1 class="widget-titre">${echapper(calc.titre)}</h1>
      ${calc.avertissement ? `<p class="avertissement-norme"><strong>${T().calculateur.aSavoir}</strong> ${calc.avertissement}</p>` : ''}
${formulaireCalculateur(calc, indexPrincipal, idsChamps, { widget: true })}
      <noscript><p class="avertissement">${T().calculateur.javascript}</p></noscript>
      <p class="widget-source"><a href="${adresse(site, cheminDe({ type: 'calculateur', calc }))}" target="_blank" rel="noopener">${T().integration.source(echapper(calc.titre), echapper(site.nom))}</a></p>
    </article>
  </main>
  <script type="module">
    import { demarrer } from '/assets/calcul.js';
    import calculer from '/${calc.slug}/formule.js';
    demarrer(calculer, ${jsonPourScript(config)});
  </script>
  <script>
    // Hauteur du contenu envoyée à la page qui intègre le widget, à chaque changement de taille.
    if (window.parent !== window) {
      const envoyer = () => window.parent.postMessage({ type: '${MESSAGE_WIDGET}', hauteur: Math.ceil(document.documentElement.scrollHeight) }, '*');
      if ('ResizeObserver' in window) new ResizeObserver(envoyer).observe(document.body);
      window.addEventListener('load', envoyer);
      envoyer();
    }
  </script>
</body>
</html>
`;
}

export function nomDuLot(site, calc) {
  return site.lots?.find((lot) => lot.id === calc.lot)?.nom ?? calc.rubrique ?? 'Divers';
}

// Corps de métier qui ont au moins un calculateur, dans l'ordre déclaré dans site.js.
export function lotsUtilises(site, calculateurs) {
  return (site.lots ?? [])
    .map((lot) => ({ ...lot, calculateurs: calculateurs.filter((calc) => calc.lot === lot.id) }))
    .filter((lot) => lot.calculateurs.length > 0);
}

function listeCalculateurs(calculateurs) {
  return `<ul class="liste-calculateurs">
        ${calculateurs.map((calc) => `<li style="--teinte: var(--teinte-${calc.teinte ?? 'aucune'}, var(--couleur-accent))">
          <a href="${cheminDe({ type: 'calculateur', calc })}">${echapper(calc.titre)}</a>
          <p>${echapper(calc.description)}</p>
        </li>`).join('\n        ')}
      </ul>`;
}

export function pageAccueil(site, calculateurs) {
  const lots = lotsUtilises(site, calculateurs);
  // Publicité dans le contenu après le deuxième corps de métier (ou après la liste) : sur mobile,
  // tout en bas de l'accueil, elle ne serait presque jamais vue.
  const pubApres = Math.min(2, lots.length);
  const corps = lots.length
    ? lots.map((lot, index) => `
      <section class="lot" aria-labelledby="lot-${lot.id}">
        <h2 id="lot-${lot.id}"><a href="${cheminDe({ type: 'lot', lot })}">${echapper(lot.nom)}</a></h2>
        ${listeCalculateurs(lot.calculateurs)}
      </section>${index + 1 === pubApres ? pubContenuHtml(site) : ''}`).join('')
    : listeCalculateurs(calculateurs) + pubContenuHtml(site);

  const contenu = `
    <section class="accueil" aria-labelledby="titre-accueil">
      <h1 id="titre-accueil">${echapper(site.titreAccueil)}</h1>
      <p class="chapo">${site.introAccueil ?? ''}</p>
      ${corps}
    </section>
${pubHtml(site)}`;

  const donnees = [{ '@context': 'https://schema.org', '@type': 'WebSite', name: site.nom, url: adresse(site, '/'), inLanguage: T().code }];

  return miseEnPage(site, {
    lotActif: 'accueil',
    titre: `${site.titreAccueil} | ${site.nom}`,
    description: site.descriptionAccueil ?? site.slogan ?? '',
    chemin: cheminDe({ type: 'accueil' }),
    page: { type: 'accueil' },
    contenu,
    jsonLd: blocsJsonLd(donnees),
  });
}

export function pageLot(site, lot) {
  const page = { type: 'lot', lot };
  const chemin = cheminDe(page);
  const fil = filAriane(site, [{ nom: T().page.accueil, chemin: cheminDe({ type: 'accueil' }) }, { nom: lot.nom, chemin }]);
  const contenu = `${fil.html}
    <section class="accueil" aria-labelledby="titre-lot">
      <p class="surtitre">${T().commun.corpsDeMetier}</p>
      <h1 id="titre-lot">${echapper(lot.nom)}</h1>
      <p class="chapo">${lot.description ?? ''}</p>
      ${listeCalculateurs(lot.calculateurs)}
      <p class="retour"><a href="${cheminDe({ type: 'accueil' })}">${T().page.tousLesCorps}</a></p>
    </section>
${pubContenuHtml(site)}${pubHtml(site)}`;

  const donnees = [{
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: lot.nom,
    description: lot.description ?? '',
    url: adresse(site, chemin),
    inLanguage: T().code,
  }, fil.donnees];

  return miseEnPage(site, {
    lotActif: lot.id,
    titre: `Calculateurs ${lot.nom.toLowerCase()} | ${site.nom}`,
    description: lot.descriptionCourte ?? lot.description ?? '',
    chemin,
    page,
    contenu,
    jsonLd: blocsJsonLd(donnees),
  });
}

export function pageMentionsLegales(site) {
  const editeur = site.editeur ?? {};
  const hebergeur = site.hebergeur ?? {};
  const contenu = `
    <article class="texte">
      <h1>${T().page.mentionsLegales}</h1>
      <section aria-labelledby="titre-editeur">
        <h2 id="titre-editeur">${T().mentions.editeur}</h2>
        <dl class="fiche">
          <dt>${T().commun.nom}</dt><dd>${echapper(editeur.nom ?? T().commun.aCompleter)}</dd>
          <dt>${T().mentions.statut}</dt><dd>${echapper(editeur.statut ?? T().commun.aCompleter)}</dd>
          <dt>SIRET</dt><dd>${echapper(editeur.siret ?? T().commun.aCompleter)}</dd>
          <dt>${T().mentions.adresse}</dt><dd>${echapper(editeur.adresse ?? T().commun.aCompleter)}</dd>
          <dt>${T().mentions.contact}</dt><dd>${echapper(editeur.email ?? T().commun.aCompleter)}</dd>
          <dt>${T().mentions.directeur}</dt><dd>${echapper(editeur.directeurPublication ?? editeur.nom ?? T().commun.aCompleter)}</dd>
        </dl>
      </section>
      <section aria-labelledby="titre-hebergeur">
        <h2 id="titre-hebergeur">${T().mentions.hebergement}</h2>
        <dl class="fiche">
          <dt>${T().mentions.hebergeur}</dt><dd>${echapper(hebergeur.nom ?? T().commun.aCompleter)}</dd>
          <dt>${T().mentions.adresse}</dt><dd>${echapper(hebergeur.adresse ?? T().commun.aCompleter)}</dd>
        </dl>
      </section>
      <section aria-labelledby="titre-responsabilite">
        <h2 id="titre-responsabilite">${T().mentions.limites}</h2>
        <p>${T().mentions.limitesTexte}</p>
      </section>
    </article>`;

  return miseEnPage(site, {
    titre: `${T().page.mentionsLegales} | ${site.nom}`,
    description: T().mentions.description(site.nom),
    chemin: cheminDe({ type: 'mentions' }),
    page: { type: 'mentions' },
    contenu,
  });
}

export function pageDevis(site) {
  const contenu = `
    <article class="devis" data-site-nom="${echapper(site.nom)}" data-site-adresse="${echapper(adresse(site, '/'))}" data-accent="${echapper(site.theme?.couleurAccent ?? '#000000')}" data-achats="${echapper(JSON.stringify(liensAchat(site)))}">
      <h1 id="titre-devis" tabindex="-1">${T().devis.titre}</h1>
      <p class="chapo">${T().devis.chapo}</p>

      <section id="devis-import" class="devis-import" aria-labelledby="titre-import" hidden>
        <h2 id="titre-import">${T().devis.partageTitre}</h2>
        <p id="devis-import-texte"></p>
        <p class="devis-actions">
          <button type="button" id="devis-import-remplacer" class="bouton-principal">${T().devis.importOuvrir}</button>
          <button type="button" id="devis-import-ajouter">${T().devis.importAjouter}</button>
          <button type="button" id="devis-import-ignorer">${T().devis.importIgnorer}</button>
        </p>
      </section>

      <details class="article-libre">
        <summary>${T().article.titre}</summary>
        <p class="chantier-aide">${T().article.aide}</p>
        <form id="article-formulaire" class="article-formulaire" novalidate>
          <p class="champ">
            <label for="article-designation">${T().devis.designation}</label>
            <input id="article-designation" type="text" autocomplete="off" required>
          </p>
          <p class="champ">
            <label for="article-lot">${T().commun.corpsDeMetier}</label>
            <select id="article-lot">
              ${[...(site.lots ?? []).map((lot) => lot.nom), 'Divers'].map((nom) => `<option>${echapper(nom)}</option>`).join('')}
            </select>
          </p>
          <p class="champ">
            <label for="article-quantite">${T().devis.quantite}</label>
            <input id="article-quantite" type="text" inputmode="decimal" autocomplete="off" value="1" required>
          </p>
          <p class="champ">
            <label for="article-unite">${T().devis.unite}</label>
            <input id="article-unite" type="text" autocomplete="off" value="${T().article.uniteParDefaut}">
          </p>
          <p class="champ">
            <label for="article-prix">${T().article.prix}</label>
            <input id="article-prix" type="text" inputmode="decimal" autocomplete="off">
          </p>
          <p class="actions"><button type="submit" class="bouton-principal">${T().article.ajouter}</button></p>
          <p class="devis-partage-statut" id="article-statut" role="status"></p>
        </form>
      </details>

      <p id="devis-vide">${T().devis.vide} <a href="${cheminDe({ type: 'accueil' })}">${T().devis.voirCalculateurs}</a></p>
      <section id="devis-contenu" aria-labelledby="titre-lignes" hidden>
        <fieldset class="chantier">
          <legend>${T().chantier.titre}</legend>
          <p class="chantier-aide">${T().chantier.aide}</p>
          <p class="champ">
            <label for="chantier-nom">${T().chantier.nom}</label>
            <input id="chantier-nom" type="text" autocomplete="off">
          </p>
          <p class="champ">
            <label for="chantier-adresse">${T().chantier.adresse}</label>
            <textarea id="chantier-adresse" rows="3" autocomplete="off"></textarea>
          </p>
          <p class="champ">
            <label for="chantier-etabliPar">${T().chantier.etabliPar}</label>
            <input id="chantier-etabliPar" type="text" autocomplete="organization">
          </p>
        </fieldset>

        <h2 id="titre-lignes">${T().devis.materiaux}</h2>
        <fieldset class="regroupement">
          <legend>${T().devis.regrouperPar}</legend>
          <p class="champ-case"><input type="radio" name="regroupement" id="regroupement-lot" value="lot" checked><label for="regroupement-lot">${T().commun.corpsDeMetier}</label></p>
          <p class="champ-case"><input type="radio" name="regroupement" id="regroupement-piece" value="piece"><label for="regroupement-piece">${T().commun.piece}</label></p>
        </fieldset>
        <section class="defilement" tabindex="0" aria-label="${T().devis.tableau}">
          <table class="tableau-devis">
            <thead>
              <tr><th scope="col">${T().devis.designation}</th><th scope="col">${T().commun.piece}</th><th scope="col">${T().commun.corpsDeMetier}</th><th scope="col" class="nombre">${T().devis.quantite}</th><th scope="col">${T().devis.unite}</th><th scope="col" class="nombre">${T().devis.prixUnitaire}</th><th scope="col" class="nombre">${T().devis.total}</th><th scope="col">${T().commun.action}</th></tr>
            </thead>
            <tbody id="devis-lignes"></tbody>
            <tfoot id="devis-totaux-lots"></tfoot>
          </table>
        </section>
        <fieldset class="tva">
          <legend>TVA</legend>
          <p class="champ-case">
            <input id="tva-active" type="checkbox" aria-describedby="tva-aide">
            <label for="tva-active">${T().devis.tvaCase}</label>
          </p>
          <p class="champ">
            <label for="tva-taux">${T().devis.tvaTaux}</label>
            <select id="tva-taux">
              <option value="20">20 %</option>
              <option value="10">10 %</option>
              <option value="5.5">5,5 %</option>
            </select>
          </p>
          <small id="tva-aide">${T().devis.tvaAide}</small>
        </fieldset>
        <dl class="devis-totaux" id="devis-totaux"></dl>
        <p class="devis-actions">
          <button type="button" id="devis-pdf" class="bouton-principal">${T().devis.pdf}</button>
          <button type="button" id="devis-email">${T().devis.email}</button>
          <button type="button" id="devis-partage-natif" hidden>${T().devis.partager}</button>
          <button type="button" id="devis-partager">${T().devis.copierLien}</button>
          <button type="button" id="devis-csv">${T().devis.csv}</button>
          <button type="button" id="devis-imprimer">${T().devis.imprimer}</button>
          <button type="button" id="devis-vider">${T().devis.vider}</button>
        </p>
        <p class="devis-partage-statut" id="devis-partage-statut" role="status"></p>
        <p><input id="devis-lien" class="devis-lien" type="text" readonly aria-label="${T().devis.lienPartage}" hidden></p>
      </section>
    </article>`;

  const script = `  <script type="module">
    import { demarrerDevis } from '/assets/panier.js';
    demarrerDevis();
  </script>`;

  return miseEnPage(site, {
    publicite: false,
    titre: `${T().devis.titre} | ${site.nom}`,
    description: T().devis.description,
    chemin: cheminDe({ type: 'devis' }),
    page: { type: 'devis' },
    contenu,
    script,
    indexer: false,
  });
}

export function pageConfidentialite(site) {
  const regie = adsense(site);
  const editeur = site.editeur ?? {};
  const contenu = `
    <article class="texte">
      <h1>${T().confidentialite.titre}</h1>
      <section aria-labelledby="titre-donnees">
        <h2 id="titre-donnees">${T().confidentialite.donneesTitre}</h2>
        ${T().confidentialite.donnees(echapper(site.nom), Boolean(site.devis))}
      </section>
      <section aria-labelledby="titre-publicite">
        <h2 id="titre-publicite">${T().confidentialite.publiciteTitre}</h2>
        ${T().confidentialite.publicite(Boolean(regie))}
      </section>
      <section aria-labelledby="titre-droits">
        <h2 id="titre-droits">${T().confidentialite.droitsTitre}</h2>
        ${T().confidentialite.droits(echapper(editeur.email ?? T().commun.aCompleter))}
      </section>
    </article>`;

  return miseEnPage(site, {
    titre: `${T().confidentialite.titre} | ${site.nom}`,
    description: T().confidentialite.description(site.nom),
    chemin: cheminDe({ type: 'confidentialite' }),
    page: { type: 'confidentialite' },
    contenu,
    publicite: false,
  });
}

// Fichier ads.txt exigé par Google : il déclare le compte autorisé à vendre les emplacements.
export function adsTxt(site) {
  const regie = adsense(site);
  return regie ? `google.com, ${regie.client.replace('ca-', '')}, DIRECT, f08c47fec0942fa0\n` : null;
}

export function page404(site) {
  const contenu = `
    <section class="texte" aria-labelledby="titre-404">
      <h1 id="titre-404">${T().introuvable.titre}</h1>
      <p>${T().introuvable.texte}</p>
      <p><a href="${cheminDe({ type: 'accueil' })}">${T().introuvable.lien}</a></p>
    </section>`;
  return miseEnPage(site, {
    publicite: false,
    titre: `${T().introuvable.titreCourt} | ${site.nom}`,
    description: T().introuvable.description,
    chemin: '/404.html',
    contenu,
    indexer: false,
  });
}

export function sitemap(site, calculateurs, date) {
  // lastmod : date de vérification du calculateur (majLe) si elle existe, sinon date de génération.
  const pages = [
    [{ type: 'accueil' }, date],
    ...lotsUtilises(site, calculateurs).map((lot) => [{ type: 'lot', lot }, date]),
    ...calculateurs.map((calc) => [{ type: 'calculateur', calc }, calc.majLe ?? date]),
    [{ type: 'mentions' }, date],
    [{ type: 'confidentialite' }, date],
  ];
  const plusieurs = languesDuSite.length > 1;
  const urls = languesDuSite
    .flatMap((code) => pages.map(([page, modifie]) => {
      const alternatives = plusieurs
        ? languesDuSite.map((autre) => `\n    <xhtml:link rel="alternate" hreflang="${autre}" href="${echapper(adresse(site, cheminDe(page, textesDe(autre))))}"/>`).join('')
        : '';
      return `  <url><loc>${echapper(adresse(site, cheminDe(page, textesDe(code))))}</loc><lastmod>${modifie}</lastmod>${alternatives}${plusieurs ? '\n  ' : ''}</url>`;
    }))
    .join('\n');
  const espaces = plusieurs ? ' xmlns:xhtml="http://www.w3.org/1999/xhtml"' : '';
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${espaces}>\n${urls}\n</urlset>\n`;
}

// Manifeste de l'application installable (nom, icônes, couleurs, raccourcis).
export function manifeste(site, calculateurs) {
  const application = site.application ?? {};
  const raccourcis = [];
  if (site.devis) raccourcis.push({ name: T().appli.raccourciRecapitulatif, short_name: T().appli.raccourciCourt, url: '/devis/' });
  for (const slug of application.raccourcis ?? []) {
    const calc = calculateurs.find((element) => element.slug === slug);
    if (calc) raccourcis.push({ name: calc.titre, short_name: calc.rubrique ?? calc.titre, url: `/${calc.slug}/` });
  }
  return JSON.stringify({
    id: '/',
    name: application.nom ?? site.nom,
    short_name: application.nomCourt ?? site.nom,
    description: site.descriptionAccueil ?? site.slogan ?? '',
    lang: T().code,
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: site.theme?.couleurFond ?? '#ffffff',
    theme_color: site.theme?.couleurFond ?? '#ffffff',
    icons: [
      { src: '/icones/icone-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icones/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icones/icone-masquable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: raccourcis.slice(0, 4).map((raccourci) => ({
      ...raccourci,
      icons: [{ src: '/icones/icone-192.png', sizes: '192x192', type: 'image/png' }],
    })),
  }, null, 2);
}

// Service worker : met tout le site en cache pour un usage hors ligne.
// La version dépend du contenu : chaque génération modifiée remplace l'ancien cache.
export function serviceWorker(version, fichiers) {
  return `// Généré par build.js : ne pas modifier à la main.
const VERSION = ${JSON.stringify(version)};
const FICHIERS = ${JSON.stringify(fichiers, null, 2)};

// Installation : la nouvelle version se met en cache puis attend (état « waiting »).
// Elle ne remplace l'ancienne que sur demande de la page (bouton « Recharger »),
// pour ne jamais changer les fichiers sous les pieds d'un internaute en plein calcul.
self.addEventListener('install', (evenement) => {
  evenement.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(FICHIERS)));
});

self.addEventListener('message', (evenement) => {
  if (evenement.data?.type === 'activer-nouvelle-version') self.skipWaiting();
});

self.addEventListener('activate', (evenement) => {
  evenement.waitUntil(
    caches.keys()
      .then((cles) => Promise.all(cles.filter((cle) => cle !== VERSION).map((cle) => caches.delete(cle))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (evenement) => {
  const requete = evenement.request;
  if (requete.method !== 'GET' || new URL(requete.url).origin !== location.origin) return;

  // Pages : le réseau d'abord (contenu à jour), le cache si le téléphone est hors ligne.
  if (requete.mode === 'navigate') {
    evenement.respondWith(
      fetch(requete)
        .then((reponse) => {
          const copie = reponse.clone();
          caches.open(VERSION).then((cache) => cache.put(requete, copie));
          return reponse;
        })
        .catch(() => caches.match(requete).then((reponse) => reponse ?? caches.match('/404.html')))
    );
    return;
  }

  // Styles, scripts et icônes : le cache d'abord (versionné à chaque génération).
  evenement.respondWith(caches.match(requete).then((reponse) => reponse ?? fetch(requete)));
});
`;
}

export function robots(site) {
  return `User-agent: *\nAllow: /\n\nSitemap: ${adresse(site, '/sitemap.xml')}\n`;
}
