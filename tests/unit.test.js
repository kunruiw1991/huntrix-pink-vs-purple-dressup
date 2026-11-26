import test from "node:test";
import assert from "node:assert/strict";
import { STEPS, MEMORY_TILES } from "../js/data.js";
import {
  STORAGE_KEY,
  createInitialState,
  getStepDef,
  getRecommendedTool,
  getStepCompletionRatio,
  isToolCompleted,
  selectStep,
  selectTool,
  applyStepAction,
  flipMemoryTile,
  clearMemoryMismatch,
  triggerMemoryHint,
  completeStepInstantly,
  countCompletedSteps,
  saveState,
  loadState,
} from "../js/state.js";

test("initial state defines all 12 chronological steps cleanly", () => {
  assert.equal(STEPS.length, 12);
  const s = createInitialState();
  assert.equal(s.currentStep, 0);
  assert.equal(s.activeTool, "invite");
  assert.equal(countCompletedSteps(s), 0);
  assert.equal(getStepDef(-5).index, 0);
  assert.equal(getStepDef(999).index, 11);
});

test("Team Purple steps 1-6 progress deterministically through invite, wheel, sketch, paint, cut/gems, and runway", () => {
  const s = createInitialState();

  // Step 1: bedroom_invite
  assert.equal(getRecommendedTool(s), "invite");
  applyStepAction(s, { tool: "invite" });
  assert.equal(isToolCompleted(s, "bedroom_invite", "invite"), true);
  assert.equal(getRecommendedTool(s), "key");
  const r1 = applyStepAction(s, { tool: "key" });
  assert.equal(r1.justCompleted, true);
  assert.equal(getRecommendedTool(s), null);

  // Step 2: purple_wheel
  selectStep(s, 1);
  assert.equal(getRecommendedTool(s), "mystery");
  applyStepAction(s, { tool: "mystery" });
  assert.equal(getRecommendedTool(s), "wheel");
  const r2 = applyStepAction(s, { tool: "wheel" });
  assert.equal(r2.justCompleted, true);

  // Step 3: purple_sketch
  selectStep(s, 2);
  for (let i = 0; i < 6; i++) applyStepAction(s, { delta: 0.2 });
  assert.equal(s.completedSteps.purple_sketch, true);
  assert.equal(isToolCompleted(s, "purple_sketch", "pen"), true);

  // Step 4: purple_paint
  selectStep(s, 3);
  assert.equal(selectTool(s, "midnight"), true);
  assert.equal(selectTool(s, "nonexistent"), false);
  assert.equal(s.progress.purple_paint.swatch, "#3d1678");
  for (let i = 0; i < 5; i++) applyStepAction(s, { delta: 0.22 });
  assert.equal(s.completedSteps.purple_paint, true);

  // Step 5: purple_cut_gems
  selectStep(s, 4);
  assert.equal(getRecommendedTool(s), "scissors");
  for (let i = 0; i < 5; i++) applyStepAction(s, { tool: "scissors", delta: 0.22 });
  assert.equal(getRecommendedTool(s), "gems");
  for (let i = 0; i < 6; i++) applyStepAction(s, { tool: "gems", x: 750 + i * 20, y: 300 });
  assert.equal(s.completedSteps.purple_cut_gems, true);
  assert.equal(isToolCompleted(s, "purple_cut_gems", "gems"), true);

  // Step 6: purple_runway
  selectStep(s, 5);
  assert.equal(getRecommendedTool(s), "dress");
  applyStepAction(s, { tool: "dress" });
  assert.equal(getRecommendedTool(s), "heels");
  applyStepAction(s, { tool: "heels" });
  assert.equal(getRecommendedTool(s), "makeup");
  const r6 = applyStepAction(s, { tool: "makeup" });
  assert.equal(r6.justCompleted, true);
  assert.equal(isToolCompleted(s, "purple_runway", "makeup"), true);
});

test("Team Pink steps 7-11 cover Mira badge, wheel, sketch, marker + glitter + mini fan, 3x3 memory shoes, and pink runway", () => {
  const s = createInitialState();

  // Step 7: pink_wheel
  selectStep(s, 6);
  assert.equal(getRecommendedTool(s), "badge");
  applyStepAction(s, { tool: "badge" });
  assert.equal(getRecommendedTool(s), "wheel");
  applyStepAction(s, { tool: "wheel" });
  assert.equal(s.completedSteps.pink_wheel, true);

  // Step 8: pink_sketch
  selectStep(s, 7);
  for (let i = 0; i < 5; i++) applyStepAction(s, { delta: 0.25 });
  assert.equal(s.completedSteps.pink_sketch, true);

  // Step 9: pink_marker_glitter (marker -> glitter -> white mini fan)
  selectStep(s, 8);
  assert.equal(getRecommendedTool(s), "marker");
  for (let i = 0; i < 5; i++) applyStepAction(s, { tool: "marker", delta: 0.22 });
  assert.equal(getRecommendedTool(s), "glitter");
  for (let i = 0; i < 5; i++) applyStepAction(s, { tool: "glitter", delta: 0.22 });
  assert.equal(getRecommendedTool(s), "fan");
  for (let i = 0; i < 5; i++) applyStepAction(s, { tool: "fan", delta: 0.22 });
  assert.equal(s.completedSteps.pink_marker_glitter, true);
  assert.equal(isToolCompleted(s, "pink_marker_glitter", "fan"), true);

  // Step 10: 3x3 Pink Memory Match Shoes mini-game
  selectStep(s, 9);
  assert.equal(MEMORY_TILES.length, 9);
  assert.equal(flipMemoryTile(s, 99).outcome, "invalid");
  assert.equal(flipMemoryTile(s, 4).outcome, "locked_center");

  // Trigger hint and test mismatch + clear
  const hint = triggerMemoryHint(s);
  assert.equal(hint.length, 2);
  const f1 = flipMemoryTile(s, 0); // bow
  assert.equal(f1.outcome, "first_flip");
  assert.equal(flipMemoryTile(s, 0).outcome, "already_flipped");
  const mis = flipMemoryTile(s, 1); // crown != bow
  assert.equal(mis.outcome, "mismatch");
  assert.equal(clearMemoryMismatch(s), true);
  assert.equal(clearMemoryMismatch(s), false);

  // Match all 4 pairs: bow(0,5), crown(1,7), star(2,8), heart(3,6)
  flipMemoryTile(s, 0);
  assert.equal(flipMemoryTile(s, 5).outcome, "match");
  assert.equal(flipMemoryTile(s, 5).outcome, "already_matched");
  flipMemoryTile(s, 1);
  assert.equal(flipMemoryTile(s, 7).outcome, "match");
  flipMemoryTile(s, 2);
  assert.equal(flipMemoryTile(s, 8).outcome, "match");
  flipMemoryTile(s, 3);
  const win = flipMemoryTile(s, 6);
  assert.equal(win.outcome, "match_and_unlock");
  assert.equal(win.justCompleted, true);
  assert.equal(s.progress.pink_memory_shoes.shoesUnlocked, true);
  assert.equal(flipMemoryTile(s, 4).outcome, "already_done");
  assert.deepEqual(triggerMemoryHint(s), []);

  // Step 11: pink_runway
  selectStep(s, 10);
  applyStepAction(s, { tool: "dress" });
  applyStepAction(s, { tool: "heels" });
  const r11 = applyStepAction(s, { tool: "makeup" });
  assert.equal(r11.justCompleted, true);
});

test("Step 12 Grand Showdown winner vote, instant completion, and localStorage round-trip", () => {
  const s = createInitialState();
  selectStep(s, 11);
  assert.equal(getStepCompletionRatio(s, "grand_showdown"), 0);
  selectTool(s, "vote_pink");
  assert.equal(s.progress.grand_showdown.winner, "pink");
  assert.equal(isToolCompleted(s, "grand_showdown", "vote_pink"), true);
  assert.equal(s.completedSteps.grand_showdown, true);

  for (let i = 0; i < STEPS.length; i++) {
    completeStepInstantly(s, i);
  }
  assert.equal(countCompletedSteps(s), 12);

  // Mock localStorage round-trip + malformed JSON resilience
  const store = new Map();
  const mockStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
  };
  assert.equal(saveState(s, mockStorage), true);
  const restored = loadState(mockStorage);
  assert.equal(restored.currentStep, 11);
  assert.equal(countCompletedSteps(restored), 12);
  assert.equal(restored.progress.grand_showdown.winner, "pink");

  mockStorage.setItem(STORAGE_KEY, "{not valid json");
  const fallback = loadState(mockStorage);
  assert.equal(fallback.currentStep, 0);
  assert.equal(saveState(s, null), false);
});
