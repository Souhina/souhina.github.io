// moteur/escalier/page.js
// Script navigateur du configurateur d'escalier : lit le formulaire, calcule (geometrie.js),
// dessine la vue choisie (rendu.js), remplit les tableaux et tient le lien de partage à jour.
// La configuration vit dans l'ancre de l'adresse (#e=…) : rien n'est envoyé à un serveur.

import { T } from '../langue.js';
import { lireNombre } from '../nombres.js';
import { DEFAUTS, normaliser, encoder, decoder } from './modele.js';
import { calculerEscalier } from './geometrie.js';
import { planSvg, coupeSvg, axoSvg } from './rendu.js';

const CLES = Object.keys(DEFAUTS).filter((cle) => cle !== 'v');
const nombre = (valeur, decimales = 1) => new Intl.NumberFormat(T().locale, { maximumFractionDigits: decimales }).format(valeur);
const metres = (cm) => `${nombre(cm / 100, 2)} m`;
const cm = (valeur) => `${nombre(valeur)} cm`;

export function demarrer() {
  const E = T().escalier;
  const formulaire = document.getElementById('esc-formulaire');
  if (!formulaire) return;
  const dessin = document.getElementById('esc-dessin');
  const impression = document.getElementById('esc-impression');
  const champ = (cle) => formulaire.elements.namedItem(cle);
  const etapes = [...formulaire.querySelectorAll('.esc-etape')];
  const progression = document.getElementById('esc-progression');
  const navigation = formulaire.querySelector('.esc-navigation');
  const orientation = document.querySelector('.esc-orientation');
  const curseur = document.getElementById('esc-azimut');
  const plancher = document.getElementById('esc-plancher');
  let etape = 0;
  let vue = 'plan';
  let azimut = null; // null : orientation automatique selon le sens du virage
  let elevation = 30;
  let dernier = null;

  // --- Formulaire <-> configuration ---
  function lire() {
    const config = {};
    for (const cle of CLES) {
      const element = champ(cle);
      if (!element) continue;
      if (element.type === 'checkbox') config[cle] = element.checked;
      else if (element.tagName === 'SELECT') config[cle] = element.value;
      else {
        const valeur = lireNombre(element.value);
        const erreur = document.getElementById(`erreur-${cle}`);
        const invalide = Number.isNaN(valeur);
        element.toggleAttribute('aria-invalid', invalide);
        if (erreur) {
          erreur.hidden = !invalide;
          erreur.textContent = invalide ? T().formulaire.saisirNombre : '';
        }
        config[cle] = invalide || valeur === null ? DEFAUTS[cle] : valeur;
      }
    }
    return normaliser(config);
  }

  function remplir(config) {
    for (const cle of CLES) {
      const element = champ(cle);
      if (!element) continue;
      const valeur = config[cle];
      if (element.type === 'checkbox') element.checked = Boolean(valeur);
      else if (element.tagName === 'SELECT') element.value = valeur;
      else element.value = valeur === null ? '' : String(valeur).replace('.', T().separateurDecimal);
    }
  }

  // --- Étapes (pas à pas) ---
  function afficherEtape() {
    const assistant = formulaire.dataset.mode === 'assistant';
    etapes.forEach((element, index) => element.classList.toggle('esc-etape-active', index === etape));
    progression.hidden = !assistant;
    navigation.hidden = !assistant;
    progression.textContent = E.etape(etape + 1, etapes.length);
    const [precedent, suivant] = navigation.querySelectorAll('button');
    precedent.disabled = etape === 0;
    suivant.disabled = etape === etapes.length - 1;
  }

  formulaire.querySelector('.esc-mode').hidden = false;
  formulaire.dataset.mode = 'assistant';
  formulaire.addEventListener('change', (evenement) => {
    if (evenement.target.name === 'esc-mode') {
      formulaire.dataset.mode = evenement.target.value;
      afficherEtape();
    }
  });
  navigation.addEventListener('click', (evenement) => {
    const bouton = evenement.target.closest('[data-etape-nav]');
    if (!bouton) return;
    etape = Math.min(etapes.length - 1, Math.max(0, etape + Number(bouton.dataset.etapeNav)));
    afficherEtape();
    etapes[etape].querySelector('input, select')?.focus();
  });

  // --- Rendu ---
  function rendreVue(esc) {
    const az = azimut ?? (esc.config.forme === 'quart-palier' && esc.config.sens === 'droite' ? 135 : 225);
    curseur.value = String(az);
    orientation.hidden = vue !== 'perspective';
    for (const bouton of orientation.querySelectorAll('[data-azimut]')) {
      bouton.setAttribute('aria-pressed', String(Number(bouton.dataset.azimut) === az && Number(bouton.dataset.elevation) === elevation));
    }
    if (vue === 'plan') dessin.innerHTML = planSvg(esc, E);
    else if (vue === 'coupe') dessin.innerHTML = coupeSvg(esc, E);
    else dessin.innerHTML = axoSvg(esc, E, { azimut: az, elevation, plancher: plancher.checked, sol: plancher.checked });
  }

  function rendreChiffres(esc) {
    const c = esc.config;
    const enc = esc.encombrement;
    const lignes = [
      [E.hauteurs, `${esc.contremarches} × ${cm(esc.hauteurMarche)}`],
      [E.girons, cm(esc.giron)],
      [E.valeurBlondel, cm(esc.blondel)],
      [E.inclinaison, `${nombre(esc.angle)}°`],
      [E.encombrement, `${metres(enc.x1 - enc.x0)} × ${metres(enc.y1 - enc.y0)}`],
      [E.ligne, metres(esc.longueurLigne)],
      [E.tremie, E.tremieValeur(metres(esc.tremie.longueur), esc.tremie.longueurConseillee !== null && c.tremieLongueur !== null ? metres(esc.tremie.longueurConseillee) : null)],
      [E.libelles.echappee[0], esc.echappee.minimum === null ? E.sansObjet : metres(esc.echappee.minimum)],
    ];
    document.getElementById('esc-chiffres').innerHTML = lignes.map(([terme, valeur]) => `<dt>${terme}</dt><dd>${valeur}</dd>`).join('');

    const messages = [];
    if (esc.erreurs.includes('giron')) messages.push(E.erreurGiron);
    if (esc.tremie.longueurConseillee === null) messages.push(E.tremieImpossible);
    if (esc.tremie.enL) messages.push(E.tremieEnL);
    document.getElementById('esc-messages').textContent = messages.join(' ');

    const valeurPoint = (point) => {
      if (point.valeur === null) return E.sansObjet;
      return point.id === 'echappee' ? metres(point.valeur) : cm(point.valeur);
    };
    const reperePoint = (point) => (point.id === 'echappee' ? `${metres(c.echappeeVisee)} (${E.libelles.echappee[1]})` : E.libelles[point.id][1]);
    document.querySelector('#esc-points tbody').innerHTML = esc.points.map((point) => `<tr>
      <th scope="row">${E.libelles[point.id][0]}</th>
      <td>${valeurPoint(point)}</td>
      <td>${reperePoint(point)}</td>
      <td class="esc-statut-${point.statut}">${E.statuts[point.statut]}</td>
    </tr>`).join('');

    const q = esc.quantites;
    const valeurs = {
      marches: String(q.marches),
      palier: String(q.palier),
      contremarches: String(q.contremarches),
      limons: String(q.limons),
      longueurLimonMax: q.longueurLimonMax ? metres(q.longueurLimonMax) : E.sansObjet,
      poteaux: String(q.poteaux),
      volumeBois: `${nombre(q.volumeBois, 3)} m³`,
    };
    for (const cellule of document.querySelectorAll('#esc-quantites [data-quantite]')) cellule.textContent = valeurs[cellule.dataset.quantite] ?? E.sansObjet;
  }

  function mettreAJour({ adresse = true } = {}) {
    const config = lire();
    const quart = config.forme === 'quart-palier';
    for (const cle of ['sens', 'avantPalier']) champ(cle)?.closest('.champ')?.toggleAttribute('hidden', !quart);
    const esc = calculerEscalier(config);
    dernier = esc;
    rendreVue(esc);
    rendreChiffres(esc);
    if (adresse) history.replaceState(null, '', `#e=${encoder(config)}`);
  }

  // --- Événements ---
  formulaire.addEventListener('input', (evenement) => {
    if (evenement.target.name === 'esc-mode') return;
    mettreAJour();
  });
  formulaire.addEventListener('change', (evenement) => {
    if (evenement.target.tagName === 'SELECT' || evenement.target.type === 'checkbox') mettreAJour();
  });
  document.querySelector('.esc-choix-vue').addEventListener('change', (evenement) => {
    vue = evenement.target.value;
    rendreVue(dernier);
  });
  orientation.addEventListener('click', (evenement) => {
    const bouton = evenement.target.closest('[data-azimut]');
    if (!bouton) return;
    azimut = Number(bouton.dataset.azimut);
    elevation = Number(bouton.dataset.elevation);
    rendreVue(dernier);
  });
  curseur.addEventListener('input', () => {
    azimut = Number(curseur.value);
    if (elevation === 0) elevation = 30;
    rendreVue(dernier);
  });
  plancher.addEventListener('change', () => rendreVue(dernier));

  const statutLien = document.getElementById('esc-statut-lien');
  document.getElementById('esc-partager').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      statutLien.textContent = E.lienCopie;
    } catch {
      statutLien.textContent = E.lienNonCopie;
    }
  });
  document.getElementById('esc-imprimer').addEventListener('click', () => window.print());
  window.addEventListener('beforeprint', () => {
    if (!dernier) return;
    const az = azimut ?? (dernier.config.sens === 'droite' && dernier.config.forme === 'quart-palier' ? 135 : 225);
    impression.innerHTML = planSvg(dernier, E, 'esc-imp-plan') + coupeSvg(dernier, E, 'esc-imp-coupe') + axoSvg(dernier, E, { azimut: az, elevation: 30 }, 'esc-imp-axo');
  });

  // Configuration partagée dans l'adresse, sinon valeurs par défaut du formulaire.
  if (location.hash.startsWith('#e=')) remplir(decoder(location.hash.slice(3)));
  afficherEtape();
  mettreAJour({ adresse: location.hash.startsWith('#e=') });
}
