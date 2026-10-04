// moteur/aide-choix.js
// Aide au choix du produit : quelques questions fermées, des règles qui préremplissent des champs.
// Module pur : utilisé par le navigateur (calcul.js), par build.js (validation) et par test.js.
//
// aideAuChoix: {
//   questions: [{ id, question, options: [{ valeur: 'oui', libelle: 'Oui' }, …] }],   // 2 à 4 questions
//   regles: [{ si: { idQuestion: 'valeur' }, alors: { idChamp: { valeur, raison } } }], // par priorité
// }
// Pour chaque champ, la première règle applicable qui le vise l'emporte : les règles sont donc
// classées de la plus prioritaire à la moins prioritaire. Une règle sans condition (si: {}) sert de défaut.

import { T } from './langue.js';

// Met l'initiale en minuscule, sauf pour un sigle ou une abréviation (C2, R = 6, PSE).
function minusculeInitiale(texte) {
  return /^\p{Lu}\p{Ll}/u.test(texte) ? texte.charAt(0).toLowerCase() + texte.slice(1) : texte;
}

// Évalue les réponses ; renvoie les valeurs à préremplir et la phrase qui explique la recommandation.
// Tant qu'aucune question n'a de réponse, rien n'est recommandé.
export function evaluerAideAuChoix(aide, reponses, champs) {
  if (!Object.values(reponses ?? {}).some(Boolean)) return { valeurs: {}, phrase: '' };
  const valeurs = {};
  const raisons = [];
  for (const regle of aide.regles) {
    const applicable = Object.entries(regle.si ?? {}).every(([question, valeur]) => reponses[question] === valeur);
    if (!applicable) continue;
    for (const [idChamp, { valeur, raison }] of Object.entries(regle.alors)) {
      if (idChamp in valeurs) continue;
      valeurs[idChamp] = valeur;
      const champ = champs.find((element) => element.id === idChamp);
      const choix = champ?.type === 'case'
        ? (valeur ? T().aideChoix.oui : T().aideChoix.non)
        : minusculeInitiale(champ?.options?.find((option) => option.valeur === valeur)?.libelle ?? String(valeur));
      const libelle = champ?.label ?? idChamp;
      // Après un point-virgule, le libellé du champ prend une minuscule.
      const debut = raisons.length ? libelle.charAt(0).toLowerCase() + libelle.slice(1) : libelle;
      raisons.push(`${debut} : ${choix}${raison ? `, ${raison}` : ''}`);
    }
  }
  return { valeurs, phrase: raisons.length ? T().aideChoix.recommandation(raisons) : '' };
}

// Contrôle de la configuration (appelé par build.js) : renvoie la liste des erreurs.
export function verifierAideAuChoix(aide, champs) {
  const erreurs = [];
  if (!aide || typeof aide !== 'object') return ['aideAuChoix doit être un objet { questions, regles }'];
  const questions = Array.isArray(aide.questions) ? aide.questions : [];
  if (questions.length < 2 || questions.length > 4) erreurs.push('aideAuChoix : 2 à 4 questions attendues');
  for (const question of questions) {
    if (!question?.id || !question.question) erreurs.push('aideAuChoix : chaque question demande un id et un texte');
    if (!(question?.options?.length >= 2)) erreurs.push(`aideAuChoix : la question "${question?.id}" demande au moins deux réponses`);
  }
  if (!Array.isArray(aide.regles) || !aide.regles.length) erreurs.push('aideAuChoix : au moins une règle attendue');
  for (const [index, regle] of (aide.regles ?? []).entries()) {
    for (const [idQuestion, valeur] of Object.entries(regle?.si ?? {})) {
      const question = questions.find((element) => element.id === idQuestion);
      if (!question) erreurs.push(`aideAuChoix : règle ${index + 1}, question inconnue "${idQuestion}"`);
      else if (!question.options.some((option) => option.valeur === valeur)) erreurs.push(`aideAuChoix : règle ${index + 1}, réponse "${valeur}" inconnue pour "${idQuestion}"`);
    }
    if (!regle?.alors || !Object.keys(regle.alors).length) erreurs.push(`aideAuChoix : règle ${index + 1} sans champ à préremplir`);
    for (const [idChamp, cible] of Object.entries(regle?.alors ?? {})) {
      const champ = champs.find((element) => element.id === idChamp);
      if (!champ) erreurs.push(`aideAuChoix : règle ${index + 1}, champ inconnu "${idChamp}"`);
      else if (champ.type === 'choix' && !champ.options.some((option) => option.valeur === cible?.valeur)) erreurs.push(`aideAuChoix : règle ${index + 1}, valeur ${cible?.valeur} absente du champ "${idChamp}"`);
      else if (champ.type === 'case' && ![0, 1].includes(cible?.valeur)) erreurs.push(`aideAuChoix : règle ${index + 1}, le champ "${idChamp}" attend 0 ou 1`);
      else if (champ.type !== 'choix' && champ.type !== 'case') erreurs.push(`aideAuChoix : règle ${index + 1}, le champ "${idChamp}" doit être une liste ou une case`);
    }
  }
  return erreurs;
}
