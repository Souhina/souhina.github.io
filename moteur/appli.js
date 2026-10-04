// moteur/appli.js
// Application installable (PWA) : enregistre le service worker, qui garde le site en cache
// pour l'utiliser sans réseau, et gère le bouton « Installer l'application ».

import { lireReglageImperial, ecrireReglageImperial } from './nombres.js';
import { T } from './langue.js';

// Équivalents impériaux : interrupteur « ft/lb » de l'en-tête et réglages du pied de page,
// synchronisés. Un événement « reglage-unites » prévient la page (calculateur) d'actualiser l'affichage.
export function demarrerReglagesUnites() {
  const interrupteur = document.getElementById('bascule-imperial');
  const caseReglage = document.getElementById('reglage-imperial');
  if (!interrupteur && !caseReglage) return;
  const radios = document.querySelectorAll('input[name="gallon"]');

  const afficher = (reglage) => {
    interrupteur?.setAttribute('aria-checked', String(reglage.actif));
    if (caseReglage) caseReglage.checked = reglage.actif;
    radios.forEach((radio) => {
      radio.checked = radio.value === reglage.gallon;
    });
  };
  const changer = (modification) => {
    const reglage = { ...lireReglageImperial(), ...modification };
    ecrireReglageImperial(reglage);
    afficher(reglage);
    document.dispatchEvent(new CustomEvent('reglage-unites', { detail: reglage }));
  };

  afficher(lireReglageImperial());
  interrupteur?.addEventListener('click', () => changer({ actif: interrupteur.getAttribute('aria-checked') !== 'true' }));
  caseReglage?.addEventListener('change', () => changer({ actif: caseReglage.checked }));
  radios.forEach((radio) => radio.addEventListener('change', () => changer({ gallon: radio.value })));
}

export function demarrerAppli() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js')
      .then(surveillerMisesAJour)
      .catch(() => {
        // Sans service worker (navigation privée, ancien navigateur), le site fonctionne normalement.
      });
  }

  const bloc = document.getElementById('installation');
  if (!bloc) return;

  // Déjà ouvert comme une application : inutile de proposer l'installation.
  const installee = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  if (installee) {
    bloc.hidden = true;
    return;
  }

  const bouton = document.getElementById('installer');
  const consigneIphone = document.getElementById('installation-iphone');
  const consigneAutre = document.getElementById('installation-autre');
  const iphone = /iphone|ipad|ipod/i.test(navigator.userAgent);
  consigneIphone.hidden = !iphone;
  consigneAutre.hidden = iphone;

  // Android et navigateurs compatibles : le navigateur fournit sa propre fenêtre d'installation.
  let demande = null;
  window.addEventListener('beforeinstallprompt', (evenement) => {
    evenement.preventDefault();
    demande = evenement;
    bouton.hidden = false;
    consigneAutre.hidden = true;
  });

  bouton.addEventListener('click', async () => {
    if (!demande) return;
    demande.prompt();
    await demande.userChoice;
    demande = null;
    bouton.hidden = true;
  });

  window.addEventListener('appinstalled', () => {
    bloc.hidden = true;
  });
}

// Mise à jour : quand une nouvelle version est prête, un bandeau propose de recharger.
// Les données locales (plan, récapitulatif, réglages) ne sont pas touchées : seul le cache
// des fichiers du site change.
function surveillerMisesAJour(enregistrement) {
  const bandeau = document.getElementById('bandeau-maj');
  if (!bandeau) return;
  let rechargementDemande = false;

  const proposer = (nouvelle) => {
    // Première installation : pas d'ancienne version à remplacer, rien à proposer.
    if (!navigator.serviceWorker.controller) return;
    bandeau.hidden = false;
    document.getElementById('bandeau-maj-recharger').onclick = () => {
      rechargementDemande = true;
      nouvelle.postMessage({ type: 'activer-nouvelle-version' });
    };
  };

  // Une version peut déjà attendre (onglet ouvert pendant la mise en ligne précédente).
  if (enregistrement.waiting) proposer(enregistrement.waiting);

  enregistrement.addEventListener('updatefound', () => {
    const nouvelle = enregistrement.installing;
    nouvelle?.addEventListener('statechange', () => {
      if (nouvelle.state === 'installed') proposer(nouvelle);
    });
  });

  // La nouvelle version a pris la main : on recharge une seule fois, à la demande de l'internaute.
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!rechargementDemande) return;
    rechargementDemande = false;
    window.location.reload();
  });

  document.getElementById('bandeau-maj-fermer').addEventListener('click', () => {
    bandeau.hidden = true;
  });

  // Vérifie les mises à jour quand l'appli revient au premier plan (téléphone rouvert sur le chantier).
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') enregistrement.update().catch(() => {});
  });
}

// Code d'intégration du widget : choix du thème et copie dans le presse-papiers.
export function demarrerIntegration() {
  const zone = document.getElementById('code-integration');
  if (!zone) return;
  const statut = document.getElementById('integration-statut');
  document.querySelectorAll('input[name="integrer-theme"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      zone.value = radio.value === 'nuit' ? zone.dataset.codeNuit : zone.dataset.codeJour;
      statut.textContent = '';
    });
  });
  document.getElementById('copier-integration').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(zone.value);
      statut.textContent = T().integration.copie;
    } catch {
      // Presse-papiers indisponible : on sélectionne le code pour une copie manuelle.
      zone.focus();
      zone.select();
      statut.textContent = T().integration.copieManuelle;
    }
  });
}

// Panneau de navigation « Calculateurs » : recherche, fermeture au clavier, types dépliés sur grand écran.
// Le panneau est un <details> natif : sans ce script, il s'ouvre et se ferme quand même.
export function demarrerNavigation() {
  const navigation = document.getElementById('navigation');
  if (!navigation) return;
  const bouton = navigation.querySelector('summary');
  const champ = document.getElementById('recherche-calculateur');
  const resultats = document.getElementById('recherche-resultats');
  const statut = document.getElementById('recherche-statut');
  const types = navigation.querySelector('.navigation-types');
  const grandEcran = window.matchMedia('(min-width: 64rem)');

  // Sur grand écran, tous les types sont dépliés et présentés en colonnes.
  navigation.addEventListener('toggle', () => {
    if (navigation.open && grandEcran.matches) navigation.querySelectorAll('.navigation-type').forEach((type) => { type.open = true; });
    if (navigation.open && grandEcran.matches) champ?.focus();
  });

  // Échap ferme le panneau et rend le focus au bouton ; un clic à l'extérieur le ferme aussi.
  navigation.addEventListener('keydown', (evenement) => {
    if (evenement.key !== 'Escape' || !navigation.open) return;
    navigation.open = false;
    bouton.focus();
  });
  document.addEventListener('click', (evenement) => {
    if (navigation.open && !navigation.contains(evenement.target)) navigation.open = false;
  });

  // Recherche : sans accents ni majuscules, sur le titre, la rubrique et le corps de métier.
  if (!champ) return;
  champ.closest('p').hidden = false;
  const normaliser = (texte) => texte.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const liens = [...new Map([...navigation.querySelectorAll('.navigation-type a')].map((lien) => [lien.getAttribute('href'), lien])).values()];
  const index = liens.map((lien) => ({ lien, texte: normaliser(`${lien.textContent} ${lien.dataset.mots ?? ''}`) }));

  champ.addEventListener('input', () => {
    const mots = normaliser(champ.value).split(/\s+/).filter(Boolean);
    resultats.replaceChildren();
    if (!mots.length) {
      resultats.hidden = true;
      types.hidden = false;
      statut.textContent = '';
      return;
    }
    const trouves = index.filter(({ texte }) => mots.every((mot) => texte.includes(mot)));
    for (const { lien } of trouves) {
      const element = document.createElement('li');
      element.append(lien.cloneNode(true));
      resultats.append(element);
    }
    resultats.hidden = trouves.length === 0;
    types.hidden = true;
    statut.textContent = trouves.length ? T().navigation.trouves(trouves.length) : T().navigation.aucun;
  });

  // Entrée ouvre le premier résultat.
  champ.addEventListener('keydown', (evenement) => {
    if (evenement.key !== 'Enter') return;
    const premier = resultats.querySelector('a');
    if (premier) {
      evenement.preventDefault();
      window.location.href = premier.href;
    }
  });
}
