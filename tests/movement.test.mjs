import test from 'node:test';
import assert from 'node:assert/strict';
import { movePlayer } from '../src/movement.mjs';
test('3D movement follows the camera and does not accelerate diagonally', () => {
  const straight = movePlayer({x:0,z:0}, {x:0,z:-1}, 0, .05);
  const diagonal = movePlayer({x:0,z:0}, {x:1,z:-1}, 0, .05);
  assert.ok(Math.abs(Math.hypot(diagonal.x,diagonal.z) - Math.abs(straight.z)) < 1e-9);
  const rotated = movePlayer({x:0,z:0}, {x:0,z:-1}, Math.PI/2, .05);
  assert.ok(rotated.x < 0 && Math.abs(rotated.z) < 1e-9);
});
test('3D player stops at walls and slides alongside furniture', () => {
  const edge = movePlayer({x:5.5,z:0}, {x:1,z:0}, 0, .05);
  assert.equal(edge.x,5.5);
  const obstacle = [{x:1,z:0,w:1,d:2}];
  const slide = movePlayer({x:.25,z:0}, {x:1,z:1}, 0, .05, obstacle);
  assert.equal(slide.x,.25);
  assert.ok(slide.z > 0);
});
test('resuming a suspended frame cannot teleport through the room', () => {
  const start = {x:0,z:0};
  assert.deepEqual(movePlayer(start,{x:0,z:-1},0,40), movePlayer(start,{x:0,z:-1},0,.05));
  assert.deepEqual(start,{x:0,z:0});
  assert.deepEqual(movePlayer(start,{x:0,z:0},0,.05),start);
});
