// moteur/panier.js
// Devis de matériaux cumulé entre les calculateurs.
// Les lignes restent dans le navigateur de l'internaute (localStorage) : aucun compte, aucun serveur.

import { lireNombre, formaterEuros, versSaisie, formater, lireReglageImperial } from './nombres.js';
import { genererRecapitulatif } from './pdf.js';
import { T } from './langue.js';

const CLE_STOCKAGE = 'devis-materiaux-v1';
const CLE_CHANTIER = 'devis-chantier-v1';
const CHAMPS_CHANTIER = ['nom', 'adresse', 'etabliPar'];
const CLE_REGROUPEMENT = 'devis-regroupement-v1';

// Clé de regroupement d'une ligne : son corps de métier ou sa pièce.
export function groupeLigne(ligne, regroupement) {
  return regroupement === 'piece' ? ligne.piece || T().devis.sansPiece : ligne.lot || T().devis.divers;
}

function lireRegroupement() {
  try {
    return localStorage.getItem(CLE_REGROUPEMENT) === 'piece' ? 'piece' : 'lot';
  } catch {
    return 'lot';
  }
}

function lireChantier() {
  try {
    const chantier = JSON.parse(localStorage.getItem(CLE_CHANTIER));
    return chantier && typeof chantier === 'object' ? chantier : {};
  } catch {
    return {};
  }
}

function enregistrerChantier(chantier) {
  try {
    localStorage.setItem(CLE_CHANTIER, JSON.stringify(chantier));
  } catch {
    // Navigation privée : les informations valent pour la page en cours seulement.
  }
}

// Lien de partage : le récapitulatif est encodé dans l'ancre de l'adresse (#r=…).
// L'ancre n'est jamais envoyée au serveur : les données restent entre les personnes qui s'échangent le lien.
export function encoderPartage(lignes, chantier) {
  const donnees = {
    v: 1,
    c: chantier,
    l: lignes.map((ligne) => [ligne.designation, ligne.lot, ligne.quantite, ligne.unite, ligne.prixUnitaire, ligne.detail ?? '', ligne.piece ?? '', ligne.achat ?? '']),
  };
  const octets = new TextEncoder().encode(JSON.stringify(donnees));
  let binaire = '';
  for (const octet of octets) binaire += String.fromCharCode(octet);
  return btoa(binaire).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}

// Les données d'un lien reçu sont contrôlées une à une : elles viennent de l'extérieur.
export function decoderPartage(code) {
  try {
    const base64 = code.replaceAll('-', '+').replaceAll('_', '/');
    const binaire = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
    const octets = Uint8Array.from(binaire, (caractere) => caractere.charCodeAt(0));
    const donnees = JSON.parse(new TextDecoder().decode(octets));
    if (donnees?.v !== 1 || !Array.isArray(donnees.l)) return null;

    const texte = (valeur, longueur) => String(valeur ?? '').slice(0, longueur);
    const nombre = (valeur) => (Number.isFinite(Number(valeur)) && Number(valeur) >= 0 ? Number(valeur) : 0);
    const lignes = donnees.l.slice(0, 500).map((ligne) => ({
      designation: texte(ligne[0], 200),
      lot: texte(ligne[1], 80),
      quantite: nombre(ligne[2]),
      unite: texte(ligne[3], 30),
      prixUnitaire: nombre(ligne[4]),
      detail: texte(ligne[5], 200),
      piece: texte(ligne[6], 60),
      achat: texte(ligne[7], 40).replace(/[^a-z0-9-]/g, ''),
    }));
    const chantier = {};
    for (const champ of CHAMPS_CHANTIER) chantier[champ] = texte(donnees.c?.[champ], 300);
    return { lignes, chantier };
  } catch {
    return null;
  }
}

// --- Envoi du récapitulatif (e-mail, partage) ---

// Longueur maximale d'un lien mailto: : au-delà, certaines messageries tronquent ou refusent le message.
export const LIMITE_MAILTO = 1800;

// « 18 carton » → « 18 cartons » ; les symboles (m², kg, L…) restent invariables.
function uniteAccordee(unite, quantite) {
  if (!unite || quantite <= 1 || !/^[a-zà-ÿ]{3,}( [a-zà-ÿ]+)*$/i.test(unite) || /[sx]$/.test(unite)) return unite ?? '';
  return unite.endsWith('eau') ? `${unite}x` : `${unite}s`;
}

// Résumé texte du récapitulatif, pour le corps d'un e-mail ou d'un partage.
export function resumeTexte({ lignes, chantier = {}, regroupement = 'lot', tva = { active: false, taux: 20 }, siteNom = '', siteAdresse = '' }) {
  const parties = [`${T().devis.titre}${chantier.nom ? ` – ${chantier.nom}` : ''}`];
  if (chantier.adresse) parties.push(`${T().email.adresse}${chantier.adresse.replace(/\s*\n\s*/g, ', ')}`);
  if (chantier.etabliPar) parties.push(`${T().email.etabliPar}${chantier.etabliPar}`);

  const groupes = new Map();
  for (const ligne of lignes) {
    const groupe = groupeLigne(ligne, regroupement);
    if (!groupes.has(groupe)) groupes.set(groupe, []);
    groupes.get(groupe).push(ligne);
  }
  for (const [groupe, lignesGroupe] of groupes) {
    parties.push('', groupe.toUpperCase());
    for (const ligne of lignesGroupe) {
      const precision = regroupement === 'piece' ? ligne.lot : ligne.piece;
      const montant = totalLigne(ligne) > 0 ? ` – ${formaterEuros(totalLigne(ligne))}` : '';
      parties.push(`- ${ligne.designation}${precision ? ` (${precision})` : ''} : ${formater(Number(ligne.quantite))} ${uniteAccordee(ligne.unite, Number(ligne.quantite))}${montant}`.replace(/\s+:/, ' :'));
    }
  }

  const totalHt = lignes.reduce((somme, ligne) => somme + totalLigne(ligne), 0);
  if (totalHt > 0) {
    parties.push('', `${T().email.totalHt}${formaterEuros(totalHt)}`);
    if (tva.active) {
      parties.push(T().email.tva(formater(tva.taux), formaterEuros((totalHt * tva.taux) / 100)), `${T().email.totalTtc}${formaterEuros(totalHt * (1 + tva.taux / 100))}`);
    }
  }
  if (siteNom) parties.push('', `${T().email.etabliAvec(siteNom)}${siteAdresse ? ` – ${siteAdresse}` : ''}`);
  return parties.join('\n');
}

// Lien mailto: avec sujet et corps. Le lien de partage est ajouté s'il tient dans la limite ;
// sinon le corps invite à joindre le PDF (lienInclus: false).
export function lienMailto({ sujet, corps, lienPartage, limite = LIMITE_MAILTO }) {
  const encoder = (texte) => encodeURIComponent(texte.replace(/\r?\n/g, '\r\n'));
  const construire = (texte) => `mailto:?subject=${encoder(sujet)}&body=${encoder(texte)}`;
  const avecLien = construire(`${corps}\n\n${T().email.ouvrir}\n${lienPartage}`);
  if (avecLien.length <= limite) return { url: avecLien, lienInclus: true };
  const noteSimple = T().email.pdfJoint;
  if (construire(corps + noteSimple).length <= limite) return { url: construire(corps + noteSimple), lienInclus: false, abrege: false };
  // Même sans lien, le résumé est trop long : on garde le début, ligne par ligne, et on renvoie au PDF.
  const lignes = corps.split('\n');
  let gardees = lignes.length;
  const abreger = (nombre) => `${lignes.slice(0, nombre).join('\n')}\n…${T().email.pdfJoint}`;
  while (gardees > 1 && construire(abreger(gardees)).length > limite) gardees--;
  return { url: construire(abreger(gardees)), lienInclus: false, abrege: true };
}

export function lireDevis() {
  try {
    const lignes = JSON.parse(localStorage.getItem(CLE_STOCKAGE));
    return Array.isArray(lignes) ? lignes : [];
  } catch {
    return [];
  }
}

function enregistrerDevis(lignes) {
  try {
    localStorage.setItem(CLE_STOCKAGE, JSON.stringify(lignes));
  } catch {
    // Navigation privée ou stockage plein : le devis ne sera pas conservé.
  }
  document.dispatchEvent(new CustomEvent('devis-change'));
}

function identifiant() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ajouterLignes(nouvelles) {
  const lignes = lireDevis();
  for (const ligne of nouvelles) lignes.push({ id: identifiant(), ...ligne });
  enregistrerDevis(lignes);
}

const totalLigne = (ligne) => (Number(ligne.quantite) || 0) * (Number(ligne.prixUnitaire) || 0);

// Nombre de lignes affiché à côté du lien « Mon devis », sur toutes les pages.
export function afficherCompteur() {
  const compteur = document.getElementById('compteur-devis');
  if (!compteur) return;
  const mettreAJour = () => {
    const nombre = lireDevis().length;
    compteur.textContent = nombre ? `\u00a0(${nombre})` : '';
  };
  mettreAJour();
  document.addEventListener('devis-change', mettreAJour);
  window.addEventListener('storage', mettreAJour);
}

// Page /devis/
export function demarrerDevis() {
  const titre = document.getElementById('titre-devis');
  const blocVide = document.getElementById('devis-vide');
  const blocContenu = document.getElementById('devis-contenu');
  const corps = document.getElementById('devis-lignes');
  const piedLots = document.getElementById('devis-totaux-lots');
  const totaux = document.getElementById('devis-totaux');
  const tvaActive = document.getElementById('tva-active');
  const tvaTaux = document.getElementById('tva-taux');

  function cellule(balise, texte, classe) {
    const element = document.createElement(balise);
    if (texte !== undefined) element.textContent = texte;
    if (classe) element.className = classe;
    return element;
  }

  function saisie(ligne, champ, libelle) {
    const input = document.createElement('input');
    input.type = 'text';
    input.inputMode = 'decimal';
    input.autocomplete = 'off';
    input.value = versSaisie(Number(ligne[champ]) || 0);
    input.dataset.id = ligne.id;
    input.dataset.champ = champ;
    input.setAttribute('aria-label', `${libelle} : ${ligne.designation}`);
    return input;
  }

  // Liens d'achat configurés pour le site : { id: url } (voir monetisation.affiliation).
  let liensAchat = {};
  try {
    liensAchat = JSON.parse(document.querySelector('.devis')?.dataset.achats || '{}');
  } catch {
    liensAchat = {};
  }

  let regroupement = lireRegroupement();
  const radioRegroupement = document.querySelector(`input[name="regroupement"][value="${regroupement}"]`);
  if (radioRegroupement) radioRegroupement.checked = true;
  document.querySelectorAll('input[name="regroupement"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      regroupement = radio.value === 'piece' ? 'piece' : 'lot';
      try {
        localStorage.setItem(CLE_REGROUPEMENT, regroupement);
      } catch {
        // Stockage indisponible : le choix vaut pour la page en cours.
      }
      rendre();
    });
  });

  function rendreLigne(ligne) {
    const tr = document.createElement('tr');
    tr.dataset.id = ligne.id;

    const designation = cellule('th', ligne.designation);
    designation.scope = 'row';
    if (ligne.detail) designation.append(document.createElement('br'), cellule('small', ligne.detail, 'detail-ligne'));
    // Lien d'achat partenaire, seulement si l'affiliation correspondante est configurée.
    const urlAchat = ligne.achat ? liensAchat[ligne.achat] : '';
    if (urlAchat) {
      const achat = document.createElement('a');
      achat.href = urlAchat;
      achat.rel = 'sponsored noopener';
      achat.target = '_blank';
      achat.className = 'lien-achat';
      achat.textContent = T().achat.acheter;
      achat.setAttribute('aria-label', T().achat.acheterEtiquette(ligne.designation));
      designation.append(document.createElement('br'), achat, ' ', cellule('small', T().commun.lienPartenaire, 'mention-partenaire'));
    }
    tr.append(designation, cellule('td', ligne.piece ?? ''), cellule('td', ligne.lot ?? ''));

    const quantite = cellule('td', undefined, 'nombre');
    quantite.append(saisie(ligne, 'quantite', T().devis.quantite));
    const prix = cellule('td', undefined, 'nombre');
    prix.append(saisie(ligne, 'prixUnitaire', T().devis.prixEtiquette));
    tr.append(quantite, cellule('td', ligne.unite ?? ''), prix, cellule('td', formaterEuros(totalLigne(ligne)), 'nombre total-ligne'));

    const action = cellule('td');
    const bouton = cellule('button', T().devis.retirer);
    bouton.type = 'button';
    bouton.dataset.retirer = ligne.id;
    bouton.setAttribute('aria-label', T().devis.retirerEtiquette(ligne.designation));
    action.append(bouton);
    tr.append(action);
    return tr;
  }

  function rendreTotaux(lignes) {
    const parGroupe = new Map();
    for (const ligne of lignes) {
      const groupe = groupeLigne(ligne, regroupement);
      parGroupe.set(groupe, (parGroupe.get(groupe) ?? 0) + totalLigne(ligne));
    }

    piedLots.replaceChildren();
    for (const [groupe, montant] of parGroupe) {
      const tr = document.createElement('tr');
      const entete = cellule('th', `Sous-total ${groupe}`);
      entete.scope = 'row';
      entete.colSpan = 6;
      tr.append(entete, cellule('td', formaterEuros(montant), 'nombre'), cellule('td'));
      piedLots.append(tr);
    }

    const total = lignes.reduce((somme, ligne) => somme + totalLigne(ligne), 0);
    const couples = [];
    if (tvaActive.checked) {
      const taux = Number(tvaTaux.value);
      const tva = (total * taux) / 100;
      couples.push([T().devis.totalHt, total], [T().devis.tvaA(String(taux).replace('.', T().separateurDecimal)), tva], [T().devis.totalTtc, total + tva]);
    } else {
      couples.push(['Total', total]);
    }
    totaux.replaceChildren();
    for (const [libelle, montant] of couples) totaux.append(cellule('dt', libelle), cellule('dd', formaterEuros(montant)));
  }

  function rendre() {
    // Lignes affichées groupe par groupe, dans l'ordre d'apparition de chaque groupe.
    const brutes = lireDevis();
    const ordre = [...new Set(brutes.map((ligne) => groupeLigne(ligne, regroupement)))];
    const lignes = [...brutes].sort((a, b) => ordre.indexOf(groupeLigne(a, regroupement)) - ordre.indexOf(groupeLigne(b, regroupement)));
    blocVide.hidden = lignes.length > 0;
    blocContenu.hidden = lignes.length === 0;
    corps.replaceChildren(...lignes.map(rendreLigne));
    rendreTotaux(lignes);
  }

  // Modification d'une quantité ou d'un prix : on ne reconstruit pas le tableau pour garder le focus.
  corps.addEventListener('input', (evenement) => {
    const input = evenement.target;
    if (!input.dataset.champ) return;
    const valeur = lireNombre(input.value);
    if (valeur === null || Number.isNaN(valeur) || valeur < 0) {
      input.setAttribute('aria-invalid', 'true');
      return;
    }
    input.removeAttribute('aria-invalid');
    const lignes = lireDevis();
    const ligne = lignes.find((element) => element.id === input.dataset.id);
    if (!ligne) return;
    ligne[input.dataset.champ] = valeur;
    enregistrerDevis(lignes);
    input.closest('tr').querySelector('.total-ligne').textContent = formaterEuros(totalLigne(ligne));
    rendreTotaux(lignes);
  });

  corps.addEventListener('click', (evenement) => {
    const bouton = evenement.target.closest('[data-retirer]');
    if (!bouton) return;
    const boutons = [...corps.querySelectorAll('[data-retirer]')];
    const position = boutons.indexOf(bouton);
    enregistrerDevis(lireDevis().filter((ligne) => ligne.id !== bouton.dataset.retirer));
    rendre();
    const restants = corps.querySelectorAll('[data-retirer]');
    (restants[Math.min(position, restants.length - 1)] ?? titre).focus();
  });

  tvaActive.addEventListener('change', () => {
    tvaTaux.disabled = !tvaActive.checked;
    rendreTotaux(lireDevis());
  });
  tvaTaux.addEventListener('change', () => rendreTotaux(lireDevis()));
  tvaTaux.disabled = !tvaActive.checked;

  document.getElementById('devis-imprimer').addEventListener('click', () => window.print());

  document.getElementById('devis-csv').addEventListener('click', () => {
    const decimal = (nombre) => (Number(nombre) || 0).toFixed(2).replace('.', T().separateurDecimal);
    const champ = (texte) => `"${String(texte ?? '').replaceAll('"', '""')}"`;
    const lignes = lireDevis().map((ligne) =>
      [champ(ligne.designation), champ(ligne.piece), champ(ligne.detail), champ(ligne.lot), decimal(ligne.quantite), champ(ligne.unite), decimal(ligne.prixUnitaire), decimal(totalLigne(ligne))].join(';')
    );
    // Point-virgule et BOM UTF-8 : ouverture directe et correcte dans Excel en français.
    const contenu = '\ufeff' + [T().devis.enteteCsv, ...lignes].join('\r\n');
    const lien = document.createElement('a');
    lien.href = URL.createObjectURL(new Blob([contenu], { type: 'text/csv;charset=utf-8' }));
    lien.download = 'devis-materiaux.csv';
    lien.click();
    setTimeout(() => URL.revokeObjectURL(lien.href), 1000);
  });

  document.getElementById('devis-vider').addEventListener('click', () => {
    if (!window.confirm(T().devis.confirmerVider)) return;
    enregistrerDevis([]);
    rendre();
    titre.focus();
  });

  // Informations du chantier (facultatives), mémorisées dans le navigateur.
  const champsChantier = Object.fromEntries(CHAMPS_CHANTIER.map((champ) => [champ, document.getElementById(`chantier-${champ}`)]));
  function remplirChantier(chantier) {
    for (const champ of CHAMPS_CHANTIER) champsChantier[champ].value = chantier[champ] ?? '';
  }
  function chantierSaisi() {
    return Object.fromEntries(CHAMPS_CHANTIER.map((champ) => [champ, champsChantier[champ].value.trim()]));
  }
  remplirChantier(lireChantier());
  for (const champ of CHAMPS_CHANTIER) {
    champsChantier[champ].addEventListener('input', () => enregistrerChantier(chantierSaisi()));
  }

  const statutPartage = document.getElementById('devis-partage-statut');
  const racineDevis = document.querySelector('.devis');
  const lienDePartage = () => `${location.origin}/devis/#r=${encoderPartage(lireDevis(), chantierSaisi())}`;

  function produirePdf() {
    const octets = genererRecapitulatif({
      achats: liensAchat,
      regroupement,
      imperial: lireReglageImperial(),
      lignes: lireDevis(),
      chantier: chantierSaisi(),
      tva: { active: tvaActive.checked, taux: Number(tvaTaux.value) },
      lienPartage: lienDePartage(),
      site: { nom: racineDevis.dataset.siteNom, adresse: racineDevis.dataset.siteAdresse, accent: racineDevis.dataset.accent },
    });
    const nomFichier = `recapitulatif-${(chantierSaisi().nom || 'chantier').toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'chantier'}.pdf`;
    return { octets, nomFichier };
  }

  function telechargerPdf() {
    const { octets, nomFichier } = produirePdf();
    const lien = document.createElement('a');
    lien.href = URL.createObjectURL(new Blob([octets], { type: 'application/pdf' }));
    lien.download = nomFichier;
    lien.click();
    setTimeout(() => URL.revokeObjectURL(lien.href), 1000);
  }

  document.getElementById('devis-pdf').addEventListener('click', telechargerPdf);

  const texteRecapitulatif = () => resumeTexte({
    lignes: lireDevis(),
    chantier: chantierSaisi(),
    regroupement,
    tva: { active: tvaActive.checked, taux: Number(tvaTaux.value) },
    siteNom: racineDevis.dataset.siteNom,
    siteAdresse: racineDevis.dataset.siteAdresse,
  });
  const sujet = () => `${T().devis.titre} – ${chantierSaisi().nom || racineDevis.dataset.siteNom}`;

  // E-mail : ouvre la messagerie de l'appareil. Aucune adresse n'est demandée ni enregistrée.
  document.getElementById('devis-email').addEventListener('click', () => {
    const { url, lienInclus } = lienMailto({ sujet: sujet(), corps: texteRecapitulatif(), lienPartage: lienDePartage() });
    if (!lienInclus) {
      telechargerPdf();
      statutPartage.textContent = T().email.tropLong;
    } else {
      statutPartage.textContent = T().email.ouverture;
    }
    const lien = document.createElement('a');
    lien.href = url;
    lien.click();
  });

  // Partage natif (mobile surtout) : le PDF en pièce jointe si l'appareil l'accepte, sinon le texte et le lien.
  const boutonPartage = document.getElementById('devis-partage-natif');
  if (typeof navigator.share === 'function') {
    boutonPartage.hidden = false;
    boutonPartage.addEventListener('click', async () => {
      const { octets, nomFichier } = produirePdf();
      const fichier = typeof File === 'function' ? new File([octets], nomFichier, { type: 'application/pdf' }) : null;
      const donnees = fichier && navigator.canShare?.({ files: [fichier] })
        ? { title: sujet(), text: T().partage.pdfJoint(sujet()), files: [fichier] }
        : { title: sujet(), text: texteRecapitulatif(), url: lienDePartage() };
      try {
        await navigator.share(donnees);
        statutPartage.textContent = donnees.files ? T().partage.partagePdf : T().partage.partage;
      } catch (erreur) {
        // Partage annulé par l'internaute : rien à signaler.
        if (erreur?.name !== 'AbortError') statutPartage.textContent = T().partage.echec;
      }
    });
  }

  document.getElementById('devis-partager').addEventListener('click', async () => {
    const adresse = lienDePartage();
    const champLien = document.getElementById('devis-lien');
    champLien.value = adresse;
    champLien.hidden = false;
    try {
      await navigator.clipboard.writeText(adresse);
      statutPartage.textContent = T().partage.lienCopie;
    } catch {
      champLien.select();
      statutPartage.textContent = T().partage.copierManuel;
    }
  });

  // Ouverture d'un lien de partage : on propose l'import, sans rien écraser d'office.
  const blocImport = document.getElementById('devis-import');
  const partage = location.hash.startsWith('#r=') ? decoderPartage(location.hash.slice(3)) : null;
  if (partage && partage.lignes.length) {
    document.getElementById('devis-import-texte').textContent =
      T().partage.importTexte(partage.lignes.length, partage.chantier.nom);
    blocImport.hidden = false;

    const terminerImport = (remplacer, ajouter) => {
      if (remplacer || ajouter) {
        const lignes = remplacer ? [] : lireDevis();
        for (const ligne of partage.lignes) lignes.push({ id: identifiant(), ...ligne });
        enregistrerDevis(lignes);
        if (remplacer || !chantierSaisi().nom) {
          remplirChantier(partage.chantier);
          enregistrerChantier(partage.chantier);
        }
      }
      blocImport.hidden = true;
      history.replaceState(null, '', location.pathname);
      rendre();
      titre.focus();
    };
    document.getElementById('devis-import-remplacer').addEventListener('click', () => terminerImport(true, false));
    document.getElementById('devis-import-ajouter').addEventListener('click', () => terminerImport(false, true));
    document.getElementById('devis-import-ignorer').addEventListener('click', () => terminerImport(false, false));
  }

  // Article au forfait : une ligne saisie à la main, sans calculateur.
  const formulaireArticle = document.getElementById('article-formulaire');
  formulaireArticle?.addEventListener('submit', (evenement) => {
    evenement.preventDefault();
    const statut = document.getElementById('article-statut');
    const designation = document.getElementById('article-designation');
    const quantite = lireNombre(document.getElementById('article-quantite').value);
    const prix = lireNombre(document.getElementById('article-prix').value);
    if (!designation.value.trim()) {
      statut.textContent = T().article.designationManquante;
      designation.focus();
      return;
    }
    if (!(quantite > 0)) {
      statut.textContent = T().article.quantiteManquante;
      document.getElementById('article-quantite').focus();
      return;
    }
    const lignes = lireDevis();
    lignes.push({
      id: identifiant(),
      designation: designation.value.trim().slice(0, 200),
      lot: document.getElementById('article-lot').value,
      quantite,
      unite: document.getElementById('article-unite').value.trim().slice(0, 30),
      prixUnitaire: prix > 0 ? prix : 0,
      detail: '',
      origine: T().article.origine,
    });
    enregistrerDevis(lignes);
    rendre();
    statut.textContent = T().article.ajoute(designation.value.trim());
    formulaireArticle.reset();
    designation.focus();
  });

  // Mise à jour si le devis est modifié dans un autre onglet.
  window.addEventListener('storage', rendre);
  rendre();
}
