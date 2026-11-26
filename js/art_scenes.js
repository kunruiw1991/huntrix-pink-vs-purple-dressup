// Studio 2D Canvas renderer for PINK vs. PURPLE Huntrix Dress-Up Studio
// Composites 16:9 painterly plates + flood-fill chroma-keyed RGBA paper dolls + tactile craft overlays

import {
  STUDIO_WIDTH,
  STUDIO_HEIGHT,
  SKETCHPAD,
  BOOK_ZONES,
  MEMORY_TILES,
  WATERCOLOR_SWATCHES,
} from "./data.js";
import { getStepDef, getStepCompletionRatio } from "./state.js";

// Geometry of the 3x3 Pink Memory Match Shoes grid on 1280x720 stage
export const MEMORY_GRID = {
  cols: 3,
  rows: 3,
  tileSize: 112,
  gap: 14,
  originX: 640 - (112 * 3 + 14 * 2) / 2,
  originY: 360 - (112 * 3 + 14 * 2) / 2,
};

export function getMemoryTileRect(index) {
  const col = index % 3;
  const row = Math.floor(index / 3);
  return {
    x: MEMORY_GRID.originX + col * (MEMORY_GRID.tileSize + MEMORY_GRID.gap),
    y: MEMORY_GRID.originY + row * (MEMORY_GRID.tileSize + MEMORY_GRID.gap),
    w: MEMORY_GRID.tileSize,
    h: MEMORY_GRID.tileSize,
  };
}

export function hitTestMemoryTile(x, y) {
  for (let i = 0; i < MEMORY_TILES.length; i++) {
    const r = getMemoryTileRect(i);
    if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
      return i;
    }
  }
  return -1;
}

export class ParticleSystem {
  constructor() {
    this.items = [];
  }

  burst(x, y, count = 18, palette = ["#ff3e9d", "#b388ff", "#ffbf3c", "#ffffff"], kind = "star") {
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.45;
      const spd = 1.6 + Math.random() * 4.6;
      this.items.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - (kind === "confetti" ? 2.5 : 1.0),
        size: kind === "confetti" ? 6 + Math.random() * 6 : 5 + Math.random() * 7,
        color: palette[i % palette.length],
        life: 1,
        decay: 0.015 + Math.random() * 0.018,
        rot: Math.random() * Math.PI * 2,
        vrot: (Math.random() - 0.5) * 0.16,
        kind,
      });
    }
  }

  emitWind(x, y) {
    for (let i = 0; i < 4; i++) {
      this.items.push({
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 60,
        vx: 7 + Math.random() * 6,
        vy: (Math.random() - 0.5) * 2.4,
        size: 10 + Math.random() * 14,
        color: i % 2 === 0 ? "rgba(255,255,255,0.85)" : "#ff85c8",
        life: 1,
        decay: 0.035,
        rot: 0,
        vrot: 0,
        kind: i % 2 === 0 ? "wind" : "star",
      });
    }
  }

  update() {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const p = this.items[i];
      p.x += p.vx;
      p.y += p.vy;
      if (p.kind === "confetti") {
        p.vy += 0.11;
        p.vx *= 0.985;
      } else if (p.kind !== "wind") {
        p.vy += 0.04;
      }
      p.rot += p.vrot;
      p.life -= p.decay;
      if (p.life <= 0) this.items.splice(i, 1);
    }
  }

  draw(ctx) {
    for (const p of this.items) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      if (p.kind === "heart") {
        ctx.fillStyle = p.color;
        drawHeartShape(ctx, 0, 0, p.size);
        ctx.fill();
      } else if (p.kind === "confetti") {
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size * 0.5, -p.size * 0.3, p.size, p.size * 0.6);
      } else if (p.kind === "wind") {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-p.size, 0);
        ctx.quadraticCurveTo(0, -5, p.size, 0);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        drawFourPointStar(ctx, 0, 0, p.size, p.size * 0.35);
        ctx.fill();
      }
      ctx.restore();
    }
  }
}

function drawFourPointStar(ctx, cx, cy, outerR, innerR) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (Math.PI * i) / 4;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawHeartShape(ctx, cx, cy, size) {
  const s = size * 0.55;
  ctx.beginPath();
  ctx.moveTo(cx, cy + s);
  ctx.bezierCurveTo(cx - s * 1.6, cy, cx - s * 1.4, cy - s * 1.4, cx, cy - s * 0.5);
  ctx.bezierCurveTo(cx + s * 1.4, cy - s * 1.4, cx + s * 1.6, cy, cx, cy + s);
  ctx.closePath();
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawSpriteContain(ctx, img, boxX, boxY, boxW, boxH, shadow = true) {
  if (!img) return null;
  const scale = Math.min(boxW / img.width, boxH / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = boxX + (boxW - dw) / 2;
  const dy = boxY + (boxH - dh) / 2;
  ctx.save();
  if (shadow) {
    ctx.shadowColor = "rgba(44, 14, 72, 0.28)";
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 8;
  }
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
  return { x: dx, y: dy, w: dw, h: dh };
}

function drawPulseTarget(ctx, x, y, r, color, time) {
  const pulse = 0.5 + 0.5 * Math.sin(time * 0.005);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.globalAlpha = 0.45 + pulse * 0.45;
  ctx.beginPath();
  ctx.arc(x, y, r + pulse * 10, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.beginPath();
  ctx.arc(x, y, r * 0.72, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawProgressiveReveal(ctx, img, box, ratio, mode = "vertical") {
  if (!img || ratio <= 0.001) return;
  const clamped = Math.max(0, Math.min(1, ratio));
  ctx.save();
  ctx.beginPath();
  if (mode === "vertical") {
    ctx.rect(box.x - 4, box.y - 4, box.w + 8, (box.h + 8) * clamped);
  } else {
    ctx.rect(box.x - 4, box.y - 4, (box.w + 8) * clamped, box.h + 8);
  }
  ctx.clip();
  ctx.drawImage(img, box.x, box.y, box.w, box.h);
  ctx.restore();
}

function drawFlowerWatercolorPalette(ctx, cx, cy, activeHex, time) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.shadowColor = "rgba(64, 24, 108, 0.24)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 6;

  // White flower palette petals
  ctx.fillStyle = "#fff9fe";
  ctx.strokeStyle = "#d9c2f0";
  ctx.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI * 2 * i) / 6;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * 34, Math.sin(a) * 34, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, 32, 0, Math.PI * 2);
  ctx.fill();

  // Paint wells
  const wellColors = [
    WATERCOLOR_SWATCHES[0].hex,
    WATERCOLOR_SWATCHES[1].hex,
    WATERCOLOR_SWATCHES[2].hex,
    WATERCOLOR_SWATCHES[3].hex,
    "#ff73c9",
    "#ffffff",
  ];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI * 2 * i) / 6;
    const wx = Math.cos(a) * 34;
    const wy = Math.sin(a) * 34;
    ctx.fillStyle = wellColors[i];
    ctx.beginPath();
    ctx.arc(wx, wy, 17, 0, Math.PI * 2);
    ctx.fill();
    if (wellColors[i] === activeHex) {
      ctx.strokeStyle = "#ffbf3c";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(wx, wy, 20 + Math.sin(time * 0.008) * 1.5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  // Center glossy star well
  ctx.fillStyle = activeHex || "#7b3fe4";
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHeartMakeupCompact(ctx, x, y, team, time) {
  ctx.save();
  ctx.translate(x, y + Math.sin(time * 0.004) * 5);
  ctx.shadowColor = "rgba(50, 16, 90, 0.28)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 6;

  // Compact shell
  ctx.fillStyle = team === "purple" ? "#934dff" : "#ff4fa3";
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 4;
  drawHeartShape(ctx, 0, 0, 82);
  ctx.fill();
  ctx.stroke();

  // Inner shimmer mirror glow
  const grad = ctx.createLinearGradient(-35, -35, 35, 35);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.45, team === "purple" ? "#d9b8ff" : "#ffc2e5");
  grad.addColorStop(1, "#ffef9f");
  ctx.fillStyle = grad;
  drawHeartShape(ctx, 0, 2, 58);
  ctx.fill();

  // Glossy sparkle star
  ctx.fillStyle = "#ffffff";
  drawFourPointStar(ctx, -12, -10, 14, 4);
  ctx.fill();
  ctx.restore();
}

function drawMiniFan(ctx, x, y, time, spinning) {
  ctx.save();
  ctx.translate(x, y);
  ctx.shadowColor = "rgba(90, 24, 120, 0.25)";
  ctx.shadowBlur = 14;
  ctx.shadowOffsetY = 6;

  // White ergonomic handle
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#f2b8db";
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, -16, 44, 32, 76, 15);
  ctx.fill();
  ctx.stroke();

  // Pink power button on handle
  ctx.fillStyle = "#ff3e9d";
  ctx.beginPath();
  ctx.arc(0, 74, 7, 0, Math.PI * 2);
  ctx.fill();

  // Circular fan cage
  ctx.fillStyle = "rgba(255, 250, 255, 0.92)";
  ctx.strokeStyle = "#ffd1ea";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, 56, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Spinning pink-white blades
  ctx.save();
  ctx.rotate(spinning ? time * 0.028 : time * 0.005);
  for (let i = 0; i < 5; i++) {
    ctx.rotate((Math.PI * 2) / 5);
    ctx.fillStyle = i % 2 === 0 ? "#ffb3de" : "#ffe0f1";
    ctx.beginPath();
    ctx.ellipse(0, -24, 12, 23, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Center hub
  ctx.fillStyle = "#ff5cb0";
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();

  // Outer wire grille ring
  ctx.strokeStyle = "rgba(255, 160, 210, 0.65)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 40, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawCrown(ctx, cx, cy, scale = 1, time = 0) {
  ctx.save();
  ctx.translate(cx, cy + Math.sin(time * 0.005) * 6);
  ctx.scale(scale, scale);
  ctx.shadowColor = "rgba(255, 191, 60, 0.6)";
  ctx.shadowBlur = 18;

  const g = ctx.createLinearGradient(-46, -24, 46, 26);
  g.addColorStop(0, "#ffe46b");
  g.addColorStop(0.5, "#ffbf3c");
  g.addColorStop(1, "#ff9900");
  ctx.fillStyle = g;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(-44, 22);
  ctx.lineTo(-50, -16);
  ctx.lineTo(-20, 2);
  ctx.lineTo(0, -28);
  ctx.lineTo(20, 2);
  ctx.lineTo(50, -16);
  ctx.lineTo(44, 22);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Crown gems
  const gems = [
    { x: -24, y: 10, c: "#ff3e9d" },
    { x: 0, y: 8, c: "#7b3fe4" },
    { x: 24, y: 10, c: "#ff3e9d" },
  ];
  for (const gem of gems) {
    ctx.fillStyle = gem.c;
    ctx.beginPath();
    ctx.arc(gem.x, gem.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function renderStudioScene(ctx, state, images, time, pointer, particles) {
  const step = getStepDef(state.currentStep);
  const p = state.progress[step.id];

  // 1. Paint full-bleed 16:9 studio plate
  ctx.clearRect(0, 0, STUDIO_WIDTH, STUDIO_HEIGHT);
  const bg = images[step.bg];
  if (bg) {
    ctx.drawImage(bg, 0, 0, STUDIO_WIDTH, STUDIO_HEIGHT);
  } else {
    ctx.fillStyle = "#f9d8ec";
    ctx.fillRect(0, 0, STUDIO_WIDTH, STUDIO_HEIGHT);
  }

  const idleBob = Math.sin(time * 0.003) * 4;

  // 2. Scene-specific painterly compositions
  switch (step.id) {
    case "bedroom_invite": {
      // Split bedroom: Pink side (LEFT) = Mira + Mini Mira; Purple side (RIGHT) = Rumi + Mini Rumi
      drawSpriteContain(ctx, images.doll_mira_base, 65, 195 + idleBob, 380, 440);
      drawSpriteContain(ctx, images.doll_rumi_base, 835, 195 - idleBob, 380, 440);

      // Center floating Dream Dress Contest Invite + Chained MY DESIGN BOOK
      ctx.save();
      ctx.translate(640, 355 + Math.sin(time * 0.004) * 5);

      // Glowing aura behind invite
      const aura = ctx.createRadialGradient(0, 0, 20, 0, 0, 170);
      aura.addColorStop(0, "rgba(255, 255, 255, 0.85)");
      aura.addColorStop(0.6, "rgba(255, 130, 210, 0.25)");
      aura.addColorStop(1, "rgba(123, 63, 228, 0)");
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(0, 0, 170, 0, Math.PI * 2);
      ctx.fill();

      // Glossy purple MY DESIGN BOOK card
      ctx.shadowColor = "rgba(68, 20, 110, 0.34)";
      ctx.shadowBlur = 22;
      ctx.shadowOffsetY = 10;
      const bookGrad = ctx.createLinearGradient(-115, -135, 115, 135);
      bookGrad.addColorStop(0, "#9b5cff");
      bookGrad.addColorStop(0.5, "#7430d8");
      bookGrad.addColorStop(1, "#ff4da6");
      ctx.fillStyle = bookGrad;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 6;
      drawRoundedRect(ctx, -112, -136, 224, 272, 26);
      ctx.fill();
      ctx.stroke();

      // Inner gold frame
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#ffe07d";
      ctx.lineWidth = 3;
      drawRoundedRect(ctx, -96, -120, 192, 240, 18);
      ctx.stroke();

      // Crown emblem on book cover
      drawCrown(ctx, 0, -48, 0.92, time);

      // Invite envelope badge or open sparkle heart
      ctx.font = "60px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.inviteRead ? "✨👗✨" : "💌", 0, 42);

      // Golden chain & padlock until unlocked
      if (!p.chainUnlocked) {
        ctx.strokeStyle = "#ffcf4d";
        ctx.lineWidth = 8;
        ctx.setLineDash([12, 8]);
        ctx.beginPath();
        ctx.moveTo(-114, -22);
        ctx.lineTo(114, 30);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-114, 30);
        ctx.lineTo(114, -22);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#ffbf3c";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        drawRoundedRect(ctx, -26, -14, 52, 46, 12);
        ctx.fill();
        ctx.stroke();
        ctx.font = "28px sans-serif";
        ctx.fillText("🔒", 0, 10);
      } else {
        ctx.font = "34px sans-serif";
        ctx.fillText("🔓", 0, 102);
      }
      ctx.restore();

      if (!p.chainUnlocked) {
        drawPulseTarget(ctx, 640, 365, 68, p.inviteRead ? "#ffbf3c" : "#ff3e9d", time);
      }
      break;
    }

    case "purple_wheel": {
      // Rumi + Mini Rumi waiting on left desk margin (matching sb0_01 f4-f12)
      drawSpriteContain(ctx, images.doll_rumi_base, 10, 210 + idleBob, 175, 360);

      // Interactive highlights on Mystery Box & Color Wheel
      if (!p.boxOpened) {
        drawPulseTarget(ctx, BOOK_ZONES.mysteryBox.cx, BOOK_ZONES.mysteryBox.cy, 44, "#38bdf8", time);
      } else {
        // Mystery Box opened ribbon burst badge
        ctx.save();
        ctx.fillStyle = "rgba(123, 63, 228, 0.9)";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        drawRoundedRect(ctx, 300, 148, 88, 80, 14);
        ctx.fill();
        ctx.stroke();
        ctx.font = "40px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🌌", 344, 190);
        ctx.restore();
      }

      // Color wheel pointer + spin glow
      drawColorWheelOverlay(ctx, BOOK_ZONES.colorWheel, p.wheelAngle, p.wheelSpun, "#7b3fe4", time);
      if (p.boxOpened && !p.wheelSpun) {
        drawPulseTarget(ctx, BOOK_ZONES.colorWheel.cx, BOOK_ZONES.colorWheel.cy, 72, "#7b3fe4", time);
      }

      // Preview blueprint silhouette on white sketchpad once spun
      if (p.wheelSpun) {
        ctx.save();
        ctx.globalAlpha = 0.25 + 0.1 * Math.sin(time * 0.006);
        drawSpriteContain(ctx, images.dress_purple_sketch, SKETCHPAD.x + 12, SKETCHPAD.y + 18, SKETCHPAD.w - 24, SKETCHPAD.h - 36, false);
        ctx.restore();
      }
      break;
    }

    case "purple_sketch": {
      drawSpriteContain(ctx, images.doll_rumi_base, 10, 210 + idleBob, 175, 360);
      const box = fitBox(images.dress_purple_sketch, SKETCHPAD.x + 14, SKETCHPAD.y + 18, SKETCHPAD.w - 28, SKETCHPAD.h - 36);
      // Faint guide outline
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.drawImage(images.dress_purple_sketch, box.x, box.y, box.w, box.h);
      ctx.restore();
      // Progressive dark ink sketch reveal
      drawProgressiveReveal(ctx, images.dress_purple_sketch, box, Math.min(1, p.coverage / 0.92), "vertical");
      if (p.coverage < 0.9) {
        drawPulseTarget(ctx, SKETCHPAD.cx, SKETCHPAD.y + 70 + p.coverage * 260, 44, "#7b3fe4", time);
      }
      break;
    }

    case "purple_paint": {
      drawSpriteContain(ctx, images.doll_rumi_base, 10, 210 + idleBob, 175, 360);
      const box = fitBox(images.dress_purple, SKETCHPAD.x + 14, SKETCHPAD.y + 18, SKETCHPAD.w - 28, SKETCHPAD.h - 36);
      // Base fine-liner sketch
      ctx.drawImage(images.dress_purple_sketch, box.x, box.y, box.w, box.h);
      // Painted galaxy dress progressive reveal
      drawProgressiveReveal(ctx, images.dress_purple, box, Math.min(1, p.coverage / 0.92), "vertical");
      // Iconic Flower-Shaped Watercolor Palette on the right desk margin (sb0_01 f1-2)
      drawFlowerWatercolorPalette(ctx, 1170, 365, p.swatch, time);
      if (p.coverage < 0.9) {
        drawPulseTarget(ctx, SKETCHPAD.cx, SKETCHPAD.y + 80 + p.coverage * 250, 48, p.swatch || "#7b3fe4", time);
      }
      break;
    }

    case "purple_cut_gems": {
      drawSpriteContain(ctx, images.doll_rumi_base, 10, 210 + idleBob, 175, 360);
      const cutDone = p.cut >= 0.9;
      const lift = cutDone ? -8 : 0;
      const box = drawSpriteContain(
        ctx,
        images.dress_purple,
        SKETCHPAD.x + 14,
        SKETCHPAD.y + 18 + lift,
        SKETCHPAD.w - 28,
        SKETCHPAD.h - 36,
        cutDone
      );
      if (!cutDone && box) {
        // Golden dashed scissor cutline around dresses
        ctx.save();
        ctx.strokeStyle = "#ffbf3c";
        ctx.lineWidth = 4;
        ctx.setLineDash([12, 9]);
        ctx.lineDashOffset = -time * 0.04;
        drawRoundedRect(ctx, box.x - 10, box.y - 10, box.w + 20, box.h + 20, 26);
        ctx.stroke();
        ctx.restore();
        drawPulseTarget(ctx, box.x + box.w * (0.2 + p.cut * 0.65), box.y + box.h * 0.5, 42, "#ffbf3c", time);
      }

      // Draw placed crystal pearls & star gems
      for (const g of p.gems) {
        ctx.save();
        ctx.translate(g.x, g.y + lift);
        if (g.kind === "pearl") {
          const pg = ctx.createRadialGradient(-3, -3, 1, 0, 0, 9);
          pg.addColorStop(0, "#ffffff");
          pg.addColorStop(0.6, "#f3e6ff");
          pg.addColorStop(1, "#b388ff");
          ctx.fillStyle = pg;
          ctx.beginPath();
          ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillStyle = "#fff7c2";
          ctx.shadowColor = "#ffffff";
          ctx.shadowBlur = 10;
          drawFourPointStar(ctx, 0, 0, 12, 4.5);
          ctx.fill();
        }
        ctx.restore();
      }
      if (cutDone && p.gems.length < 6) {
        drawPulseTarget(ctx, SKETCHPAD.cx, SKETCHPAD.cy, 52, "#e0b3ff", time);
      }
      break;
    }

    case "purple_runway": {
      if (!p.dressed) {
        // Undressed Rumi + Mini Rumi on runway with finished purple gowns waiting on left (sb0_01 f13)
        drawSpriteContain(ctx, images.doll_rumi_base, 440, 105 + idleBob, 450, 520);
        drawSpriteContain(ctx, images.dress_purple, 130, 195 - idleBob, 280, 340);
        drawPulseTarget(ctx, 645, 355, 68, "#b388ff", time);
      } else {
        // Crisp swap to dressed cosmic purple Rumi & Mini Rumi (ZERO muddy crossfade!)
        drawSpriteContain(ctx, images.doll_rumi_dressed, 390, 92 + idleBob, 510, 540);
        if (p.heels) {
          drawHeelShimmer(ctx, 575, 588, "#c084fc", time);
          drawHeelShimmer(ctx, 785, 575, "#c084fc", time);
        } else {
          drawPulseTarget(ctx, 635, 560, 52, "#a855f7", time);
        }
        if (p.makeup) {
          drawHeartMakeupCompact(ctx, 1030, 330, "purple", time);
          drawFloatingHearts(ctx, 640, 260, "#d98cff", time);
        } else if (p.heels) {
          drawHeartMakeupCompact(ctx, 1030, 330, "purple", time);
          drawPulseTarget(ctx, 645, 250, 54, "#ff75d8", time);
        }
      }
      break;
    }

    case "pink_wheel": {
      // Mira + Mini Mira standing on right desk margin (exact match to sb0_01 f19-25 & sb0_02 f1-9!)
      drawSpriteContain(ctx, images.doll_mira_base, 1088, 210 + idleBob, 178, 365);

      // Mira pink badge in top-right corner of MY DESIGN BOOK
      if (p.badgeStuck) {
        ctx.save();
        ctx.translate(1038, 168);
        ctx.fillStyle = "#ff3e9d";
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 34, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.font = "30px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("🎀", 0, 2);
        ctx.restore();
      } else {
        drawPulseTarget(ctx, 1038, 168, 42, "#ff3e9d", time);
      }

      drawColorWheelOverlay(ctx, BOOK_ZONES.colorWheel, p.wheelAngle, p.wheelSpun, "#ff3e9d", time);
      if (p.badgeStuck && !p.wheelSpun) {
        drawPulseTarget(ctx, BOOK_ZONES.colorWheel.cx, BOOK_ZONES.colorWheel.cy, 72, "#ff3e9d", time);
      }

      if (p.wheelSpun) {
        ctx.save();
        ctx.globalAlpha = 0.25 + 0.1 * Math.sin(time * 0.006);
        drawSpriteContain(ctx, images.dress_pink_sketch, SKETCHPAD.x + 12, SKETCHPAD.y + 18, SKETCHPAD.w - 24, SKETCHPAD.h - 36, false);
        ctx.restore();
      }
      break;
    }

    case "pink_sketch": {
      drawSpriteContain(ctx, images.doll_mira_base, 1088, 210 + idleBob, 178, 365);
      const box = fitBox(images.dress_pink_sketch, SKETCHPAD.x + 14, SKETCHPAD.y + 18, SKETCHPAD.w - 28, SKETCHPAD.h - 36);
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.drawImage(images.dress_pink_sketch, box.x, box.y, box.w, box.h);
      ctx.restore();
      drawProgressiveReveal(ctx, images.dress_pink_sketch, box, Math.min(1, p.coverage / 0.92), "vertical");
      if (p.coverage < 0.9) {
        drawPulseTarget(ctx, SKETCHPAD.cx, SKETCHPAD.y + 70 + p.coverage * 260, 44, "#ff3e9d", time);
      }
      break;
    }

    case "pink_marker_glitter": {
      drawSpriteContain(ctx, images.doll_mira_base, 1088, 210 + idleBob, 178, 365);
      const box = fitBox(images.dress_pink, SKETCHPAD.x + 14, SKETCHPAD.y + 18, SKETCHPAD.w - 28, SKETCHPAD.h - 36);
      ctx.drawImage(images.dress_pink_sketch, box.x, box.y, box.w, box.h);
      drawProgressiveReveal(ctx, images.dress_pink, box, Math.min(1, p.marker / 0.92), "vertical");

      // Glitter specks overlay (excess glitter clears as mini fan dries!)
      if (p.glitter > 0.05) {
        const excessFactor = Math.max(0.25, 1 - p.fanDry * 0.78);
        const count = Math.floor(42 * Math.min(1, p.glitter / 0.9));
        ctx.save();
        for (let i = 0; i < count; i++) {
          const sx = SKETCHPAD.x + 30 + ((i * 73) % (SKETCHPAD.w - 60));
          const sy = SKETCHPAD.y + 30 + ((i * 97) % (SKETCHPAD.h - 60));
          const twinkle = 0.45 + 0.55 * Math.sin(time * 0.008 + i);
          ctx.globalAlpha = twinkle * excessFactor;
          ctx.fillStyle = i % 3 === 0 ? "#ffffff" : (i % 3 === 1 ? "#ff69c0" : "#ffe066");
          drawFourPointStar(ctx, sx, sy, 6 + (i % 4) * 2, 2.2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Iconic White Handheld Mini Fan (sb0_02 f6-7) — shown when fan tool is active
      if (state.activeTool === "fan") {
        const fx = pointer.down ? pointer.x : 605;
        const fy = pointer.down ? pointer.y : 350 + Math.sin(time * 0.005) * 8;
        drawMiniFan(ctx, fx, fy, time, pointer.down || p.fanDry > 0.05);
      }

      if (p.fanDry < 0.9) {
        drawPulseTarget(ctx, SKETCHPAD.cx, SKETCHPAD.cy, 52, state.activeTool === "fan" ? "#38bdf8" : "#ff3e9d", time);
      }
      break;
    }

    case "pink_memory_shoes": {
      // Mira & Mini Mira peeking eagerly from the left side of the 3x3 Pink Shoes Memory Board
      drawSpriteContain(ctx, images.doll_mira_dressed, 40, 175 + idleBob, 330, 420);

      // Cute pastel blue cloud bubble badge ("👠 ❓" / "👠 ✓") matching sb0_02 f12-14
      ctx.save();
      ctx.translate(1065, 275 + Math.sin(time * 0.004) * 5);
      ctx.fillStyle = "#d9f4ff";
      ctx.strokeStyle = "#3c1e5c";
      ctx.lineWidth = 4;
      drawRoundedRect(ctx, -95, -52, 190, 104, 38);
      ctx.fill();
      ctx.stroke();
      ctx.font = "44px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(p.shoesUnlocked ? "👠✨" : "🧩👠", 0, 2);
      ctx.restore();

      // Glossy Hot-Pink 3x3 Memory Board Frame
      const boardPad = 18;
      const bw = MEMORY_GRID.tileSize * 3 + MEMORY_GRID.gap * 2 + boardPad * 2;
      const bh = bw;
      ctx.save();
      ctx.shadowColor = "rgba(180, 20, 108, 0.32)";
      ctx.shadowBlur = 26;
      ctx.shadowOffsetY = 10;
      ctx.fillStyle = "#ff3e9d";
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 6;
      drawRoundedRect(ctx, MEMORY_GRID.originX - boardPad, MEMORY_GRID.originY - boardPad, bw, bh, 26);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Render all 9 tiles
      for (let i = 0; i < MEMORY_TILES.length; i++) {
        const tile = MEMORY_TILES[i];
        const rect = getMemoryTileRect(i);
        const isMatched = tile.bonusCenter
          ? p.shoesUnlocked
          : p.matchedPairs.includes(tile.pair);
        const isFlipped = isMatched || p.flipped.includes(i);
        const isHinted = p.hintIndices && p.hintIndices.includes(i);

        ctx.save();
        if (tile.bonusCenter) {
          ctx.fillStyle = p.shoesUnlocked ? "#fff3b0" : "#ffd6ec";
        } else {
          ctx.fillStyle = isFlipped ? "#ffffff" : "#ff82c4";
        }
        ctx.strokeStyle = isHinted ? "#ffbf3c" : (isMatched ? "#22c55e" : "#ffffff");
        ctx.lineWidth = isHinted ? 5.5 : 3.5;
        drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 18);
        ctx.fill();
        ctx.stroke();

        ctx.font = "46px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (tile.bonusCenter) {
          ctx.fillText(p.shoesUnlocked ? "👠" : "🔒", rect.x + rect.w / 2, rect.y + rect.h / 2 + 2);
        } else if (isFlipped) {
          ctx.fillText(tile.icon, rect.x + rect.w / 2, rect.y + rect.h / 2 + 2);
        } else {
          ctx.fillStyle = "rgba(255,255,255,0.92)";
          ctx.font = "42px sans-serif";
          ctx.fillText("💖", rect.x + rect.w / 2, rect.y + rect.h / 2 + 2);
        }
        ctx.restore();
      }
      break;
    }

    case "pink_runway": {
      if (!p.dressed) {
        drawSpriteContain(ctx, images.doll_mira_base, 430, 105 + idleBob, 450, 520);
        drawSpriteContain(ctx, images.dress_pink, 125, 195 - idleBob, 290, 340);
        drawPulseTarget(ctx, 645, 355, 68, "#ff3e9d", time);
      } else {
        drawSpriteContain(ctx, images.doll_mira_dressed, 395, 90 + idleBob, 510, 540);
        if (p.heels) {
          drawHeelShimmer(ctx, 565, 586, "#ff3e9d", time);
          drawHeelShimmer(ctx, 790, 578, "#ff3e9d", time);
        } else {
          drawPulseTarget(ctx, 635, 560, 52, "#ff3e9d", time);
        }
        if (p.makeup) {
          drawHeartMakeupCompact(ctx, 1035, 330, "pink", time);
          drawFloatingHearts(ctx, 640, 260, "#ff6ec4", time);
        } else if (p.heels) {
          drawHeartMakeupCompact(ctx, 1035, 330, "pink", time);
          drawPulseTarget(ctx, 645, 250, 54, "#ffbf3c", time);
        }
      }
      break;
    }

    case "grand_showdown": {
      // Sweeping concert laser beams (sb0_02 f16)
      drawConcertLasers(ctx, time);

      // Left pink spotlight: Team Pink (Mira + Mini Mira)
      // Right purple spotlight: Team Purple (Rumi + Mini Rumi) — matches bg_showdown_stage & sb0_02 f16!
      const pinkBoost = p.winner === "pink" || p.winner === "both" ? -10 : 0;
      const purpleBoost = p.winner === "purple" || p.winner === "both" ? -10 : 0;

      drawSpriteContain(ctx, images.doll_mira_dressed, 90, 128 + idleBob + pinkBoost, 480, 505);
      drawSpriteContain(ctx, images.doll_rumi_dressed, 710, 128 - idleBob + purpleBoost, 480, 505);

      // Floating winner crown(s)
      if (p.winner === "pink" || p.winner === "both") {
        drawCrown(ctx, 330, 102, 1.05, time);
      }
      if (p.winner === "purple" || p.winner === "both") {
        drawCrown(ctx, 950, 102, 1.05, time);
      }
      if (!p.winner) {
        drawPulseTarget(ctx, 330, 350, 62, "#ff3e9d", time);
        drawPulseTarget(ctx, 950, 350, 62, "#a855f7", time);
      }
      break;
    }
  }

  // 3. Subtle circular step progress halo around active pointer while brushing/cutting
  if (pointer.down && ["purple_sketch", "purple_paint", "purple_cut_gems", "pink_sketch", "pink_marker_glitter"].includes(step.id)) {
    const toolObj = step.tools.find((t) => t.id === state.activeTool);
    ctx.save();
    ctx.font = "36px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(toolObj ? toolObj.icon : "✨", pointer.x + 14, pointer.y - 16);
    ctx.restore();
  }

  // 4. Particles on top
  particles.draw(ctx);

  // Return completion ratio for HUD sync
  return getStepCompletionRatio(state, step.id);
}

function fitBox(img, bx, by, bw, bh) {
  if (!img) return { x: bx, y: by, w: bw, h: bh };
  const s = Math.min(bw / img.width, bh / img.height);
  const w = img.width * s;
  const h = img.height * s;
  return { x: bx + (bw - w) / 2, y: by + (bh - h) / 2, w, h };
}

function drawColorWheelOverlay(ctx, zone, angle, spun, targetHex, time) {
  ctx.save();
  ctx.translate(zone.cx, zone.cy);
  // Subtle rotating shimmer ring when spinning/spun
  if (spun) {
    ctx.strokeStyle = targetHex;
    ctx.lineWidth = 7;
    ctx.shadowColor = targetHex;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(0, 0, zone.r + 4, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Golden pointer arrow rotating smoothly
  ctx.rotate(spun ? angle : Math.sin(time * 0.004) * 0.4);
  ctx.fillStyle = "#ffbf3c";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -zone.r + 14);
  ctx.lineTo(-14, -14);
  ctx.lineTo(14, -14);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Center jewel button
  ctx.fillStyle = spun ? targetHex : "#ffffff";
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawHeelShimmer(ctx, x, y, color, time) {
  ctx.save();
  const s = 1 + 0.14 * Math.sin(time * 0.008);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.5;
  ctx.globalAlpha = 0.72;
  ctx.beginPath();
  ctx.ellipse(x, y, 58 * s, 18 * s, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  drawFourPointStar(ctx, x - 34, y - 10, 10 * s, 3.5);
  ctx.fill();
  drawFourPointStar(ctx, x + 36, y - 6, 9 * s, 3);
  ctx.fill();
  ctx.restore();
}

function drawFloatingHearts(ctx, cx, cy, color, time) {
  for (let i = 0; i < 6; i++) {
    const phase = (time * 0.0012 + i * 0.19) % 1;
    const x = cx + Math.sin(time * 0.002 + i * 1.4) * 185;
    const y = cy + 120 - phase * 220;
    ctx.save();
    ctx.globalAlpha = Math.sin(phase * Math.PI) * 0.9;
    ctx.fillStyle = i % 2 === 0 ? color : "#ffffff";
    drawHeartShape(ctx, x, y, 14 + (i % 3) * 4);
    ctx.fill();
    ctx.restore();
  }
}

function drawConcertLasers(ctx, time) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const beams = [
    { ox: 180, color: "rgba(168, 85, 247, 0.28)", phase: 0 },
    { ox: 440, color: "rgba(192, 132, 252, 0.22)", phase: 1.2 },
    { ox: 840, color: "rgba(255, 110, 196, 0.22)", phase: 2.4 },
    { ox: 1100, color: "rgba(255, 62, 157, 0.28)", phase: 3.6 },
  ];
  for (const b of beams) {
    const sway = Math.sin(time * 0.0018 + b.phase) * 180;
    ctx.fillStyle = b.color;
    ctx.beginPath();
    ctx.moveTo(b.ox - 18, 0);
    ctx.lineTo(b.ox + 18, 0);
    ctx.lineTo(b.ox + sway + 140, STUDIO_HEIGHT);
    ctx.lineTo(b.ox + sway - 140, STUDIO_HEIGHT);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
