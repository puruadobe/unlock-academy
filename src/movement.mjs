// Movement is capped per frame so a resumed tab cannot tunnel through furniture.
export function movePlayer(position, input, yaw, seconds, colliders = []) {
  const dt = Math.max(0, Math.min(seconds, .05));
  const length = Math.max(1, Math.hypot(input.x, input.z));
  const x = input.x / length, z = input.z / length;
  const dx = (x * Math.cos(yaw) + z * Math.sin(yaw)) * dt * 3.2;
  const dz = (-x * Math.sin(yaw) + z * Math.cos(yaw)) * dt * 3.2;
  const blocked = (px, pz) => px < -5.55 || px > 5.55 || pz < -4 || pz > 6.6 ||
    colliders.some(c => Math.abs(px - c.x) < c.w / 2 + .24 && Math.abs(pz - c.z) < c.d / 2 + .24);
  let px = position.x, pz = position.z;
  if (!blocked(px + dx, pz)) px += dx;
  if (!blocked(px, pz + dz)) pz += dz;
  return { x: px, z: pz };
}
