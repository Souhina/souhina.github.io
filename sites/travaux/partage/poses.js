// Schémas SVG des types de pose des revêtements en lames (viewBox 60 × 40, cadre ajouté par le moteur).
// Partagés par parquet.js et lambris-bardage.js ; tracés en currentColor pour suivre le thème.

const rangees = (joints) => joints
  .map((xs, i) => {
    const y = 2 + i * 9;
    return `<line x1="2" y1="${y + 9}" x2="58" y2="${y + 9}"/>${xs.map((x) => `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + 9}"/>`).join('')}`;
  })
  .join('');

export const SCHEMAS_POSE = {
  coupePerdue: rangees([[22, 48], [10, 36], [30, 54], [16, 42]]),
  jointsReguliers: rangees([[20, 40], [10, 30, 50], [20, 40], [10, 30, 50]]),
  diagonale: Array.from({ length: 13 }, (_, i) => {
    const x = -34 + i * 8;
    return `<line x1="${x}" y1="40" x2="${x + 40}" y2="0"/>`;
  }).join(''),
  batonsRompus: Array.from({ length: 5 }, (_, i) => {
    const y = -6 + i * 11;
    return `<polyline points="-4,${y} 8,${y + 12} 20,${y} 32,${y + 12} 44,${y} 56,${y + 12} 68,${y}"/>`
      + `<line x1="8" y1="${y + 12}" x2="4" y2="${y + 16}"/><line x1="32" y1="${y + 12}" x2="28" y2="${y + 16}"/><line x1="56" y1="${y + 12}" x2="52" y2="${y + 16}"/>`;
  }).join(''),
  pointDeHongrie: Array.from({ length: 7 }, (_, i) => {
    const y = -4 + i * 7;
    return `<polyline points="2,${y + 12} 30,${y} 58,${y + 12}"/>`;
  }).join('') + '<line x1="30" y1="2" x2="30" y2="38"/>',
};
