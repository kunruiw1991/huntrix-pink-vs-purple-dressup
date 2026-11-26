// Deterministic, Node-testable state machine for the 12-step Pink vs. Purple Huntrix Dress-Up Studio
import { STEPS, MEMORY_TILES } from "./data.js";

export const STORAGE_KEY = "huntrix_pink_vs_purple_v1";

export function createInitialState() {
  return {
    currentStep: 0,
    activeTool: STEPS[0].tools[0].id,
    soundEnabled: true,
    completedSteps: {},
    progress: {
      bedroom_invite: { inviteRead: false, chainUnlocked: false },
      purple_wheel: { boxOpened: false, wheelSpun: false, wheelAngle: 0 },
      purple_sketch: { coverage: 0 },
      purple_paint: { coverage: 0, swatch: "#7b3fe4" },
      purple_cut_gems: { cut: 0, gems: [] },
      purple_runway: { dressed: false, heels: false, makeup: false },
      pink_wheel: { badgeStuck: false, wheelSpun: false, wheelAngle: 0 },
      pink_sketch: { coverage: 0 },
      pink_marker_glitter: { marker: 0, glitter: 0, fanDry: 0 },
      pink_memory_shoes: {
        flipped: [],
        matchedPairs: [],
        shoesUnlocked: false,
        hintIndices: [],
      },
      pink_runway: { dressed: false, heels: false, makeup: false },
      grand_showdown: { winner: null },
    },
  };
}

export function getStepDef(index) {
  const clamped = Math.max(0, Math.min(STEPS.length - 1, Number(index) || 0));
  return STEPS[clamped];
}

export function getRecommendedTool(state, stepIndex = state.currentStep) {
  const step = getStepDef(stepIndex);
  const p = state.progress[step.id];
  switch (step.id) {
    case "bedroom_invite":
      if (!p.inviteRead) return "invite";
      if (!p.chainUnlocked) return "key";
      return null;
    case "purple_wheel":
      if (!p.boxOpened) return "mystery";
      if (!p.wheelSpun) return "wheel";
      return null;
    case "purple_sketch":
      return p.coverage < 0.9 ? "pen" : null;
    case "purple_paint":
      return p.coverage < 0.9 ? (state.activeTool || "violet") : null;
    case "purple_cut_gems":
      if (p.cut < 0.9) return "scissors";
      if (p.gems.length < 6) return "gems";
      return null;
    case "purple_runway":
      if (!p.dressed) return "dress";
      if (!p.heels) return "heels";
      if (!p.makeup) return "makeup";
      return null;
    case "pink_wheel":
      if (!p.badgeStuck) return "badge";
      if (!p.wheelSpun) return "wheel";
      return null;
    case "pink_sketch":
      return p.coverage < 0.9 ? "pen" : null;
    case "pink_marker_glitter":
      if (p.marker < 0.9) return "marker";
      if (p.glitter < 0.9) return "glitter";
      if (p.fanDry < 0.9) return "fan";
      return null;
    case "pink_memory_shoes":
      return p.shoesUnlocked ? null : "wand";
    case "pink_runway":
      if (!p.dressed) return "dress";
      if (!p.heels) return "heels";
      if (!p.makeup) return "makeup";
      return null;
    case "grand_showdown":
      return p.winner ? null : "vote_both";
    default:
      return step.tools[0]?.id || null;
  }
}

export function getStepCompletionRatio(state, stepId) {
  const p = state.progress[stepId];
  if (!p) return 0;
  switch (stepId) {
    case "bedroom_invite":
      return (p.inviteRead ? 0.5 : 0) + (p.chainUnlocked ? 0.5 : 0);
    case "purple_wheel":
      return (p.boxOpened ? 0.5 : 0) + (p.wheelSpun ? 0.5 : 0);
    case "purple_sketch":
    case "purple_paint":
    case "pink_sketch":
      return Math.min(1, p.coverage / 0.9);
    case "purple_cut_gems":
      return Math.min(1, (Math.min(1, p.cut / 0.9) * 0.5) + (Math.min(1, p.gems.length / 6) * 0.5));
    case "purple_runway":
    case "pink_runway":
      return ((p.dressed ? 1 : 0) + (p.heels ? 1 : 0) + (p.makeup ? 1 : 0)) / 3;
    case "pink_wheel":
      return (p.badgeStuck ? 0.5 : 0) + (p.wheelSpun ? 0.5 : 0);
    case "pink_marker_glitter":
      return (
        Math.min(1, p.marker / 0.9) +
        Math.min(1, p.glitter / 0.9) +
        Math.min(1, p.fanDry / 0.9)
      ) / 3;
    case "pink_memory_shoes":
      return p.shoesUnlocked ? 1 : Math.min(0.95, p.matchedPairs.length / 4);
    case "grand_showdown":
      return p.winner ? 1 : 0;
    default:
      return 0;
  }
}

export function isToolCompleted(state, stepId, toolId) {
  const p = state.progress[stepId];
  if (!p) return false;
  switch (stepId) {
    case "bedroom_invite":
      return toolId === "invite" ? p.inviteRead : p.chainUnlocked;
    case "purple_wheel":
      return toolId === "mystery" ? p.boxOpened : p.wheelSpun;
    case "purple_sketch":
    case "pink_sketch":
      return p.coverage >= 0.9;
    case "purple_paint":
      return p.coverage >= 0.9;
    case "purple_cut_gems":
      return toolId === "scissors" ? p.cut >= 0.9 : p.gems.length >= 6;
    case "purple_runway":
    case "pink_runway":
      if (toolId === "dress") return p.dressed;
      if (toolId === "heels") return p.heels;
      if (toolId === "makeup") return p.makeup;
      return false;
    case "pink_wheel":
      return toolId === "badge" ? p.badgeStuck : p.wheelSpun;
    case "pink_marker_glitter":
      if (toolId === "marker") return p.marker >= 0.9;
      if (toolId === "glitter") return p.glitter >= 0.9;
      if (toolId === "fan") return p.fanDry >= 0.9;
      return false;
    case "pink_memory_shoes":
      return p.shoesUnlocked;
    case "grand_showdown":
      return p.winner === toolId.replace("vote_", "");
    default:
      return false;
  }
}

function checkAndMarkComplete(state, stepId) {
  const ratio = getStepCompletionRatio(state, stepId);
  const wasDone = Boolean(state.completedSteps[stepId]);
  if (ratio >= 0.999) {
    state.completedSteps[stepId] = true;
    return !wasDone;
  }
  return false;
}

export function selectStep(state, index) {
  const step = getStepDef(index);
  state.currentStep = step.index;
  const rec = getRecommendedTool(state, step.index);
  state.activeTool = rec || step.tools[0].id;
  return step;
}

export function selectTool(state, toolId) {
  const step = getStepDef(state.currentStep);
  const found = step.tools.find((t) => t.id === toolId);
  if (!found) return false;
  state.activeTool = found.id;
  if (step.id === "purple_paint" && found.swatch) {
    state.progress.purple_paint.swatch = found.swatch;
  }
  if (step.id === "grand_showdown") {
    state.progress.grand_showdown.winner = found.id.replace("vote_", "");
    checkAndMarkComplete(state, step.id);
  }
  return true;
}

export function applyStepAction(state, payload = {}) {
  const step = getStepDef(state.currentStep);
  const p = state.progress[step.id];
  const tool = payload.tool || state.activeTool;
  const delta = typeof payload.delta === "number" ? payload.delta : 0.14;
  let changed = false;

  switch (step.id) {
    case "bedroom_invite": {
      if (tool === "invite" && !p.inviteRead) {
        p.inviteRead = true;
        state.activeTool = "key";
        changed = true;
      } else if ((tool === "key" || p.inviteRead) && !p.chainUnlocked) {
        p.inviteRead = true;
        p.chainUnlocked = true;
        changed = true;
      }
      break;
    }
    case "purple_wheel": {
      if (tool === "mystery" && !p.boxOpened) {
        p.boxOpened = true;
        state.activeTool = "wheel";
        changed = true;
      } else if (tool === "wheel" && !p.wheelSpun) {
        p.boxOpened = true;
        p.wheelSpun = true;
        p.wheelAngle = (p.wheelAngle || 0) + Math.PI * 4.35;
        changed = true;
      }
      break;
    }
    case "purple_sketch":
    case "pink_sketch": {
      if (p.coverage < 1) {
        p.coverage = Math.min(1, p.coverage + delta);
        changed = true;
      }
      break;
    }
    case "purple_paint": {
      if (p.coverage < 1) {
        p.coverage = Math.min(1, p.coverage + delta);
        changed = true;
      }
      break;
    }
    case "purple_cut_gems": {
      if (tool === "scissors" && p.cut < 1) {
        p.cut = Math.min(1, p.cut + delta);
        if (p.cut >= 0.9) state.activeTool = "gems";
        changed = true;
      } else if (tool === "gems" && p.gems.length < 18) {
        if (p.cut < 0.9) p.cut = 0.95;
        const gx = typeof payload.x === "number" ? payload.x : 858 + (p.gems.length - 3) * 24;
        const gy = typeof payload.y === "number" ? payload.y : 350 + ((p.gems.length % 3) - 1) * 42;
        p.gems.push({ x: Math.round(gx), y: Math.round(gy), kind: p.gems.length % 2 === 0 ? "pearl" : "star" });
        changed = true;
      }
      break;
    }
    case "purple_runway":
    case "pink_runway": {
      if (tool === "dress" && !p.dressed) {
        p.dressed = true;
        state.activeTool = "heels";
        changed = true;
      } else if (tool === "heels" && !p.heels) {
        p.dressed = true;
        p.heels = true;
        state.activeTool = "makeup";
        changed = true;
      } else if (tool === "makeup" && !p.makeup) {
        p.dressed = true;
        p.heels = true;
        p.makeup = true;
        changed = true;
      }
      break;
    }
    case "pink_wheel": {
      if (tool === "badge" && !p.badgeStuck) {
        p.badgeStuck = true;
        state.activeTool = "wheel";
        changed = true;
      } else if (tool === "wheel" && !p.wheelSpun) {
        p.badgeStuck = true;
        p.wheelSpun = true;
        p.wheelAngle = (p.wheelAngle || 0) + Math.PI * 4.85;
        changed = true;
      }
      break;
    }
    case "pink_marker_glitter": {
      if (tool === "marker" && p.marker < 1) {
        p.marker = Math.min(1, p.marker + delta);
        if (p.marker >= 0.9) state.activeTool = "glitter";
        changed = true;
      } else if (tool === "glitter" && p.glitter < 1) {
        if (p.marker < 0.9) p.marker = 0.95;
        p.glitter = Math.min(1, p.glitter + delta);
        if (p.glitter >= 0.9) state.activeTool = "fan";
        changed = true;
      } else if (tool === "fan" && p.fanDry < 1) {
        if (p.marker < 0.9) p.marker = 0.95;
        if (p.glitter < 0.9) p.glitter = 0.95;
        p.fanDry = Math.min(1, p.fanDry + delta);
        changed = true;
      }
      break;
    }
    case "grand_showdown": {
      const winner = (tool || "vote_both").replace("vote_", "");
      p.winner = winner;
      changed = true;
      break;
    }
    default:
      break;
  }

  const justCompleted = checkAndMarkComplete(state, step.id);
  return { changed, justCompleted, ratio: getStepCompletionRatio(state, step.id) };
}

// 3x3 Pink Memory Match Shoes mini-game ("play game to get shoes")
export function flipMemoryTile(state, tileIndex) {
  const p = state.progress.pink_memory_shoes;
  const tile = MEMORY_TILES[tileIndex];
  if (!tile) return { outcome: "invalid" };
  if (p.shoesUnlocked) return { outcome: "already_done" };

  // Center tile (index 4) is the sparkling Pink Heels treasure box
  if (tile.bonusCenter) {
    if (p.matchedPairs.length >= 4) {
      p.shoesUnlocked = true;
      const justCompleted = checkAndMarkComplete(state, "pink_memory_shoes");
      return { outcome: "unlocked", justCompleted };
    }
    return { outcome: "locked_center" };
  }

  if (p.matchedPairs.includes(tile.pair)) return { outcome: "already_matched" };
  if (p.flipped.includes(tileIndex)) return { outcome: "already_flipped" };

  // Clear stale 2-card mismatch if user taps a 3rd card immediately
  if (p.flipped.length >= 2) {
    p.flipped = [];
  }

  p.flipped.push(tileIndex);
  p.hintIndices = [];

  if (p.flipped.length === 1) {
    return { outcome: "first_flip", tileIndex };
  }

  const [firstIdx, secondIdx] = p.flipped;
  const firstTile = MEMORY_TILES[firstIdx];
  const secondTile = MEMORY_TILES[secondIdx];

  if (firstTile.pair === secondTile.pair) {
    p.matchedPairs.push(firstTile.pair);
    p.flipped = [];
    if (p.matchedPairs.length >= 4) {
      p.shoesUnlocked = true;
      const justCompleted = checkAndMarkComplete(state, "pink_memory_shoes");
      return { outcome: "match_and_unlock", pair: firstTile.pair, justCompleted };
    }
    return { outcome: "match", pair: firstTile.pair };
  }

  return { outcome: "mismatch", flipped: [...p.flipped] };
}

export function clearMemoryMismatch(state) {
  const p = state.progress.pink_memory_shoes;
  if (p.flipped.length >= 2) {
    p.flipped = [];
    return true;
  }
  return false;
}

export function triggerMemoryHint(state) {
  const p = state.progress.pink_memory_shoes;
  if (p.shoesUnlocked) return [];
  const unmatched = MEMORY_TILES.filter((t) => !t.bonusCenter && !p.matchedPairs.includes(t.pair));
  if (unmatched.length < 2) return [];
  const targetPair = unmatched[0].pair;
  const indices = MEMORY_TILES.filter((t) => t.pair === targetPair).map((t) => t.id);
  p.hintIndices = indices;
  return indices;
}

export function completeStepInstantly(state, stepIndex = state.currentStep) {
  const step = getStepDef(stepIndex);
  const p = state.progress[step.id];
  switch (step.id) {
    case "bedroom_invite":
      p.inviteRead = true;
      p.chainUnlocked = true;
      break;
    case "purple_wheel":
      p.boxOpened = true;
      p.wheelSpun = true;
      p.wheelAngle = Math.PI * 4.35;
      break;
    case "purple_sketch":
    case "purple_paint":
    case "pink_sketch":
      p.coverage = 1;
      break;
    case "purple_cut_gems":
      p.cut = 1;
      if (p.gems.length < 6) {
        p.gems = [
          { x: 770, y: 280, kind: "pearl" },
          { x: 820, y: 345, kind: "star" },
          { x: 790, y: 420, kind: "pearl" },
          { x: 920, y: 300, kind: "star" },
          { x: 945, y: 370, kind: "pearl" },
          { x: 870, y: 460, kind: "star" },
        ];
      }
      break;
    case "purple_runway":
    case "pink_runway":
      p.dressed = true;
      p.heels = true;
      p.makeup = true;
      break;
    case "pink_wheel":
      p.badgeStuck = true;
      p.wheelSpun = true;
      p.wheelAngle = Math.PI * 4.85;
      break;
    case "pink_marker_glitter":
      p.marker = 1;
      p.glitter = 1;
      p.fanDry = 1;
      break;
    case "pink_memory_shoes":
      p.matchedPairs = ["bow", "crown", "star", "heart"];
      p.flipped = [];
      p.shoesUnlocked = true;
      break;
    case "grand_showdown":
      p.winner = p.winner || "both";
      break;
  }
  state.completedSteps[step.id] = true;
}

export function countCompletedSteps(state) {
  return STEPS.reduce((acc, s) => acc + (state.completedSteps[s.id] ? 1 : 0), 0);
}

export function saveState(state, storage = typeof localStorage !== "undefined" ? localStorage : null) {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function loadState(storage = typeof localStorage !== "undefined" ? localStorage : null) {
  const fresh = createInitialState();
  if (!storage) return fresh;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return fresh;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return fresh;
    const merged = {
      ...fresh,
      currentStep: Math.max(0, Math.min(STEPS.length - 1, Number(parsed.currentStep) || 0)),
      soundEnabled: parsed.soundEnabled !== false,
      completedSteps: { ...(parsed.completedSteps || {}) },
      progress: { ...fresh.progress },
    };
    for (const s of STEPS) {
      if (parsed.progress && parsed.progress[s.id]) {
        merged.progress[s.id] = { ...fresh.progress[s.id], ...parsed.progress[s.id] };
      }
    }
    merged.activeTool = getRecommendedTool(merged) || getStepDef(merged.currentStep).tools[0].id;
    return merged;
  } catch {
    return fresh;
  }
}
