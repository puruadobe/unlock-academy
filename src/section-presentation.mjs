// Presentation only: canonical answer indexes and evidence IDs never change.
// The saved mission start time is the seed, so refreshes and retries stay put.
export function shuffled(values, seed) {
  let n = 2166136261;
  for (const c of String(seed)) n = Math.imul(n ^ c.charCodeAt(0), 16777619);
  const random = () => {
    n += 0x6D2B79F5;
    let t = Math.imul(n ^ (n >>> 15), n | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function missionSeed(room, seed = 0) {
  return JSON.stringify([room.id, room.topic, room.title, seed]);
}
const orders = [[0,1,2],[0,2,1],[1,0,2],[1,2,0],[2,0,1],[2,1,0]];
export function sectionOrder(room, puzzle, seed = 0) {
  const index = room.puzzles.indexOf(puzzle);
  const key = missionSeed(room, seed);
  const options = shuffled(orders, key + '/answers')[(index < 0 ? room.puzzles.length : index) % orders.length];
  return {
    options: [...options],
    evidence: shuffled(puzzle.evidence || [], key + '/' + index + '/' + puzzle.id + '/evidence'),
  };
}
