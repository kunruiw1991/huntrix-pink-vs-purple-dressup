// Main controller for PINK vs. PURPLE Huntrix Dress-Up Studio
// Instant-play wordless floating-pill interface + desktop/iPad touch + window.__GAME__ E2E hooks

import { STEPS, STUDIO_WIDTH, STUDIO_HEIGHT, SKETCHPAD, BOOK_ZONES } from "./data.js";
import { loadAllAssets } from "./assets.js";
import { StudioAudio } from "./audio.js";
import {
  createInitialState,
  loadState,
  saveState,
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
} from "./state.js";
import {
  ParticleSystem,
  renderStudioScene,
  hitTestMemoryTile,
  getMemoryTileRect,
} from "./art_scenes.js";

const canvas = document.getElementById("stage-canvas");
const ctx = canvas.getContext("2d");

const btnPrev = document.getElementById("btn-prev");
const btnNext = document.getElementById("btn-next");
const btnProgress = document.getElementById("btn-progress");
const btnGallery = document.getElementById("btn-gallery");
const btnGalleryClose = document.getElementById("btn-gallery-close");
const btnSound = document.getElementById("btn-sound");
const iconSoundOn = document.getElementById("icon-sound-on");
const iconSoundOff = document.getElementById("icon-sound-off");
const btnReset = document.getElementById("btn-reset");
const resetModal = document.getElementById("reset-modal");
const btnResetYes = document.getElementById("btn-reset-yes");
const btnResetNo = document.getElementById("btn-reset-no");
const teamDot = document.getElementById("team-dot");
const stepCounter = document.getElementById("step-counter");
const progressFill = document.getElementById("progress-fill");
const toolPill = document.getElementById("tool-pill");
const galleryOverlay = document.getElementById("gallery-overlay");
const galleryGrid = document.getElementById("gallery-grid");

let state = loadState();
let images = {};
let assetsReady = false;
const audio = new StudioAudio();
audio.setEnabled(state.soundEnabled);
const particles = new ParticleSystem();

const pointer = { down: false, x: 640, y: 360, lastX: 640, lastY: 360 };
let mismatchTimer = null;
let confettiTimer = 0;

function canvasCoords(evt) {
  const rect = canvas.getBoundingClientRect();
  const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
  const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
  return {
    x: ((clientX - rect.left) / rect.width) * STUDIO_WIDTH,
    y: ((clientY - rect.top) / rect.height) * STUDIO_HEIGHT,
  };
}

function updateTopHUD() {
  const step = getStepDef(state.currentStep);
  const ratio = getStepCompletionRatio(state, step.id);
  btnPrev.disabled = state.currentStep <= 0;
  btnNext.disabled = state.currentStep >= STEPS.length - 1;
  stepCounter.textContent = `${state.currentStep + 1}/${STEPS.length}`;
  teamDot.className = `team-dot ${step.team}`;
  const overall = (countCompletedSteps(state) + (state.completedSteps[step.id] ? 0 : ratio)) / STEPS.length;
  progressFill.style.width = `${Math.max(8, Math.round(overall * 100))}%`;

  btnSound.setAttribute("aria-pressed", String(state.soundEnabled));
  iconSoundOn.classList.toggle("hidden", !state.soundEnabled);
  iconSoundOff.classList.toggle("hidden", state.soundEnabled);
}

function renderToolPill() {
  const step = getStepDef(state.currentStep);
  const recommended = getRecommendedTool(state);
  const stepDone = Boolean(state.completedSteps[step.id]);
  toolPill.innerHTML = "";

  for (const t of step.tools) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tool-btn";
    if (step.team === "pink") btn.classList.add("pink-theme");
    if (state.activeTool === t.id) btn.classList.add("active");
    if (isToolCompleted(state, step.id, t.id)) btn.classList.add("done");
    if (recommended === t.id && !stepDone) btn.classList.add("recommended");
    if (t.swatch) {
      btn.classList.add("swatch");
      btn.style.background = `radial-gradient(circle at 32% 28%, #ffffff, ${t.swatch})`;
    }
    btn.setAttribute("aria-label", t.label);
    btn.title = t.label;
    btn.textContent = t.icon;
    btn.dataset.tool = t.id;

    btn.addEventListener("click", () => {
      audio.playPaperCrinkle();
      if (step.id === "pink_memory_shoes" && t.id === "wand") {
        const hint = triggerMemoryHint(state);
        if (hint.length) {
          audio.playGemPop();
          const r = getMemoryTileRect(hint[0]);
          particles.burst(r.x + r.w / 2, r.y + r.h / 2, 12, ["#ffbf3c", "#ffffff", "#ff3e9d"]);
        }
        return;
      }
      selectTool(state, t.id);
      if (step.id === "grand_showdown") {
        audio.playSparkleFanfare();
        particles.burst(640, 260, 44, ["#ff3e9d", "#7b3fe4", "#ffbf3c", "#ffffff"], "confetti");
      }
      saveState(state);
      renderToolPill();
      updateTopHUD();
    });
    toolPill.appendChild(btn);
  }

  // Pulsing next-scene circular button when current step is completed
  if (stepDone && state.currentStep < STEPS.length - 1) {
    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "tool-btn next-go";
    nextBtn.setAttribute("aria-label", "Next scene");
    nextBtn.title = "Next";
    nextBtn.textContent = "➜";
    nextBtn.addEventListener("click", () => {
      audio.playPaperCrinkle();
      goToStep(state.currentStep + 1);
    });
    toolPill.appendChild(nextBtn);
  }
}

function renderGallery() {
  galleryGrid.innerHTML = "";
  for (const s of STEPS) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "thumb-card";
    if (s.index === state.currentStep) card.classList.add("current");
    card.setAttribute("aria-label", `Scene ${s.index + 1}`);

    const img = document.createElement("img");
    img.src = `assets/${s.bg}.jpg`;
    img.alt = "";
    card.appendChild(img);

    const badge = document.createElement("span");
    badge.className = "thumb-badge";
    badge.textContent = String(s.index + 1);
    card.appendChild(badge);

    const em = document.createElement("span");
    em.className = "thumb-emoji";
    em.textContent = s.icon;
    card.appendChild(em);

    if (state.completedSteps[s.id]) {
      const ck = document.createElement("span");
      ck.className = "thumb-check";
      ck.textContent = "✓";
      card.appendChild(ck);
    }

    card.addEventListener("click", () => {
      audio.playPaperCrinkle();
      goToStep(s.index);
      galleryOverlay.classList.add("hidden");
    });
    galleryGrid.appendChild(card);
  }
}

function goToStep(index) {
  selectStep(state, index);
  saveState(state);
  updateTopHUD();
  renderToolPill();
}

function celebrateStepComplete(x = 640, y = 320) {
  audio.playSparkleFanfare();
  particles.burst(x, y, 36, ["#ff3e9d", "#7b3fe4", "#ffbf3c", "#ffffff"], "confetti");
  particles.burst(x, y, 18, ["#ff85c8", "#c278ff", "#ffffff"], "heart");
}

function handleTapAction(x, y) {
  const step = getStepDef(state.currentStep);

  // Special interactive 3x3 Pink Memory Match Shoes mini-game
  if (step.id === "pink_memory_shoes") {
    const idx = hitTestMemoryTile(x, y);
    if (idx < 0) return;
    if (mismatchTimer) {
      clearTimeout(mismatchTimer);
      mismatchTimer = null;
      clearMemoryMismatch(state);
    }
    const res = flipMemoryTile(state, idx);
    const rect = getMemoryTileRect(idx);
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;

    if (res.outcome === "first_flip") {
      audio.playCardFlip();
    } else if (res.outcome === "match") {
      audio.playGemPop();
      particles.burst(cx, cy, 20, ["#ff3e9d", "#ffbf3c", "#ffffff"], "star");
    } else if (res.outcome === "match_and_unlock" || res.outcome === "unlocked") {
      celebrateStepComplete(640, 360);
    } else if (res.outcome === "mismatch") {
      audio.playCardFlip();
      mismatchTimer = setTimeout(() => {
        clearMemoryMismatch(state);
        mismatchTimer = null;
      }, 650);
    } else if (res.outcome === "locked_center") {
      audio.playPaperCrinkle();
    }
    saveState(state);
    updateTopHUD();
    renderToolPill();
    return;
  }

  // Grand showdown click on Pink (left) or Purple (right) side votes for that team!
  if (step.id === "grand_showdown") {
    const voteTool = x < 540 ? "vote_pink" : (x > 740 ? "vote_purple" : "vote_both");
    selectTool(state, voteTool);
    celebrateStepComplete(x, y);
    saveState(state);
    updateTopHUD();
    renderToolPill();
    return;
  }

  // Context-aware direct-manipulation on MY DESIGN BOOK wheel steps
  let toolOverride = state.activeTool;
  if (step.id === "purple_wheel") {
    const inBox =
      x >= BOOK_ZONES.mysteryBox.x - 25 &&
      x <= BOOK_ZONES.mysteryBox.x + BOOK_ZONES.mysteryBox.w + 25 &&
      y >= BOOK_ZONES.mysteryBox.y - 25 &&
      y <= BOOK_ZONES.mysteryBox.y + BOOK_ZONES.mysteryBox.h + 25;
    const distWheel = Math.hypot(x - BOOK_ZONES.colorWheel.cx, y - BOOK_ZONES.colorWheel.cy);
    if (inBox) toolOverride = "mystery";
    else if (distWheel <= BOOK_ZONES.colorWheel.r + 30) toolOverride = "wheel";
  } else if (step.id === "pink_wheel") {
    const distWheel = Math.hypot(x - BOOK_ZONES.colorWheel.cx, y - BOOK_ZONES.colorWheel.cy);
    if (distWheel <= BOOK_ZONES.colorWheel.r + 30) toolOverride = "wheel";
  }

  const res = applyStepAction(state, { tool: toolOverride, delta: 0.16, x, y });
  if (res.changed) {
    if (step.id === "bedroom_invite") {
      state.progress.bedroom_invite.chainUnlocked ? audio.playUnlockChain() : audio.playPaperCrinkle();
      particles.burst(640, 355, 24, ["#ffbf3c", "#ff3e9d", "#9b5cff", "#ffffff"], "star");
    } else if (step.id === "purple_wheel" || step.id === "pink_wheel") {
      audio.playWheelTick();
      particles.burst(x, y, 22, step.team === "purple" ? ["#7b3fe4", "#d9b8ff", "#ffffff"] : ["#ff3e9d", "#ffc2e4", "#ffffff"]);
    } else if (step.id === "purple_cut_gems") {
      if (state.activeTool === "gems" || state.progress.purple_cut_gems.cut >= 0.9) {
        audio.playGemPop();
        particles.burst(x, y, 12, ["#ffffff", "#e0b3ff", "#ffbf3c"]);
      } else {
        audio.playScissorSnip();
      }
    } else if (step.id === "purple_runway" || step.id === "pink_runway") {
      audio.playGemPop();
      particles.burst(x, y, 26, step.team === "purple" ? ["#a855f7", "#ffffff", "#ff85c8"] : ["#ff3e9d", "#ffbf3c", "#ffffff"], "heart");
    } else if (step.id === "pink_marker_glitter" && state.activeTool === "fan") {
      audio.playMiniFan();
      particles.emitWind(x, y);
    } else {
      audio.playBrushSwish();
      particles.burst(x, y, 8, step.team === "purple" ? ["#9b5cff", "#ffffff"] : ["#ff4da6", "#ffffff"]);
    }
    if (res.justCompleted) {
      celebrateStepComplete(x, y);
    }
    saveState(state);
    updateTopHUD();
    renderToolPill();
  }
}

function handleDragAction(x, y, dist) {
  const step = getStepDef(state.currentStep);
  const dragSteps = [
    "purple_sketch",
    "purple_paint",
    "purple_cut_gems",
    "pink_sketch",
    "pink_marker_glitter",
  ];
  if (!dragSteps.includes(step.id)) return;
  if (step.id === "purple_cut_gems" && state.activeTool === "gems") return;

  // Check generous proximity to sketchpad
  const nearPad =
    x >= SKETCHPAD.x - 90 &&
    x <= SKETCHPAD.x + SKETCHPAD.w + 90 &&
    y >= SKETCHPAD.y - 70 &&
    y <= SKETCHPAD.y + SKETCHPAD.h + 70;
  if (!nearPad) return;

  const delta = Math.min(0.08, dist * 0.0014);
  if (delta < 0.004) return;
  const res = applyStepAction(state, { delta, x, y });
  if (!res.changed) return;

  if (step.id === "purple_sketch" || step.id === "pink_sketch") {
    audio.playPenStroke();
  } else if (step.id === "purple_paint") {
    audio.playBrushSwish();
    particles.burst(x, y, 3, [state.progress.purple_paint.swatch || "#7b3fe4", "#ffffff"]);
  } else if (step.id === "purple_cut_gems") {
    audio.playScissorSnip();
    particles.burst(x, y, 3, ["#ffbf3c", "#ffffff"]);
  } else if (step.id === "pink_marker_glitter") {
    if (state.activeTool === "marker") {
      audio.playBrushSwish();
      particles.burst(x, y, 3, ["#ff3e9d", "#ff99cc"]);
    } else if (state.activeTool === "glitter") {
      audio.playGlitterShake();
      particles.burst(x, y, 5, ["#ffffff", "#ff69c0", "#ffe066"]);
    } else if (state.activeTool === "fan") {
      audio.playMiniFan();
      particles.emitWind(x, y);
    }
  }

  if (res.justCompleted) {
    celebrateStepComplete(SKETCHPAD.cx, SKETCHPAD.cy);
  }
  saveState(state);
  updateTopHUD();
  renderToolPill();
}

// Pointer / Touch listeners on Canvas
canvas.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  canvas.setPointerCapture?.(e.pointerId);
  const pt = canvasCoords(e);
  pointer.down = true;
  pointer.x = pt.x;
  pointer.y = pt.y;
  pointer.lastX = pt.x;
  pointer.lastY = pt.y;
  handleTapAction(pt.x, pt.y);
});

canvas.addEventListener("pointermove", (e) => {
  const pt = canvasCoords(e);
  const dist = Math.hypot(pt.x - pointer.lastX, pt.y - pointer.lastY);
  pointer.x = pt.x;
  pointer.y = pt.y;
  if (pointer.down) {
    handleDragAction(pt.x, pt.y, dist);
    pointer.lastX = pt.x;
    pointer.lastY = pt.y;
  }
});

const endPointer = () => {
  pointer.down = false;
};
canvas.addEventListener("pointerup", endPointer);
canvas.addEventListener("pointercancel", endPointer);
canvas.addEventListener("pointerleave", endPointer);

// Top pill controls
btnPrev.addEventListener("click", () => {
  if (state.currentStep > 0) {
    audio.playPaperCrinkle();
    goToStep(state.currentStep - 1);
  }
});

btnNext.addEventListener("click", () => {
  if (state.currentStep < STEPS.length - 1) {
    audio.playPaperCrinkle();
    goToStep(state.currentStep + 1);
  }
});

const openGallery = () => {
  audio.playPaperCrinkle();
  renderGallery();
  galleryOverlay.classList.remove("hidden");
};
btnGallery.addEventListener("click", openGallery);
btnProgress.addEventListener("click", openGallery);
btnGalleryClose.addEventListener("click", () => galleryOverlay.classList.add("hidden"));
galleryOverlay.addEventListener("click", (e) => {
  if (e.target === galleryOverlay) galleryOverlay.classList.add("hidden");
});

btnSound.addEventListener("click", () => {
  state.soundEnabled = !state.soundEnabled;
  audio.setEnabled(state.soundEnabled);
  if (state.soundEnabled) audio.playGemPop();
  saveState(state);
  updateTopHUD();
});

// Destructive-action isolation with centered dimmed-backdrop modal (Cancel safe default)
const closeResetModal = () => resetModal.classList.add("hidden");
btnReset.addEventListener("click", () => {
  resetModal.classList.remove("hidden");
  btnResetNo.focus();
});
btnResetNo.addEventListener("click", closeResetModal);
resetModal.addEventListener("click", (e) => {
  if (e.target === resetModal) closeResetModal();
});
btnResetYes.addEventListener("click", () => {
  state = createInitialState();
  saveState(state);
  closeResetModal();
  audio.playPaperCrinkle();
  updateTopHUD();
  renderToolPill();
});

// Keyboard shortcuts
window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" && state.currentStep < STEPS.length - 1) goToStep(state.currentStep + 1);
  if (e.key === "ArrowLeft" && state.currentStep > 0) goToStep(state.currentStep - 1);
  if (e.key === "Escape") {
    galleryOverlay.classList.add("hidden");
    closeResetModal();
  }
});

// Main animation loop
function tick(time) {
  particles.update();
  const step = getStepDef(state.currentStep);
  if (step.id === "grand_showdown" && state.progress.grand_showdown.winner) {
    confettiTimer += 1;
    if (confettiTimer % 34 === 0) {
      particles.burst(
        220 + Math.random() * 840,
        90 + Math.random() * 80,
        14,
        ["#ff3e9d", "#7b3fe4", "#ffbf3c", "#ffffff"],
        "confetti"
      );
    }
  }
  renderStudioScene(ctx, state, images, time, pointer, particles);
  requestAnimationFrame(tick);
}

// Expose deterministic verification hooks for Playwright E2E
window.__GAME__ = {
  getState: () => state,
  isReady: () => assetsReady,
  goToStep: (idx) => goToStep(idx),
  selectTool: (toolId) => {
    selectTool(state, toolId);
    renderToolPill();
    updateTopHUD();
  },
  completeStep: (idx = state.currentStep) => {
    completeStepInstantly(state, idx);
    saveState(state);
    updateTopHUD();
    renderToolPill();
  },
  flipMemory: (tileIndex) => {
    const r = flipMemoryTile(state, tileIndex);
    saveState(state);
    updateTopHUD();
    renderToolPill();
    return r;
  },
  reset: () => {
    state = createInitialState();
    saveState(state);
    updateTopHUD();
    renderToolPill();
  },
};

// Boot immediately (instant play on load!)
updateTopHUD();
renderToolPill();
loadAllAssets()
  .then((loaded) => {
    images = loaded;
    assetsReady = true;
    requestAnimationFrame(tick);
  })
  .catch((err) => {
    console.error("Asset preload failed:", err);
  });
