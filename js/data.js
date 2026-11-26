// Chronological 12-step Pink vs. Purple Huntrix Paper-Doll Dream Dress Studio
// Faithfully mapped from YouTube znyzrXWXHyE ("PINK vs. PURPLE Huntrix Dress-Up | Designing a Dream Dress!")

export const STUDIO_WIDTH = 1280;
export const STUDIO_HEIGHT = 720;

// Exact sketchpad bounds inside bg_design_book.jpg (1280x720)
export const SKETCHPAD = {
  x: 684,
  y: 164,
  w: 348,
  h: 410,
  cx: 858,
  cy: 369,
};

// Interactive hotzones on MY DESIGN BOOK (1280x720)
export const BOOK_ZONES = {
  mysteryBox: { x: 306, y: 152, w: 78, h: 74, cx: 345, cy: 189 },
  colorWheel: { cx: 525, cy: 502, r: 92 },
};

// 3x3 Pink Memory Match Shoes board ("play game to get shoes", sb0_02 f12-14)
// 4 matching pairs + 1 sparkling Pink Heels center treasure unlocked when all 4 pairs match!
export const MEMORY_TILES = [
  { id: 0, pair: "bow",    icon: "🎀", color: "#ff72b8" },
  { id: 1, pair: "crown",  icon: "👑", color: "#ffbf3c" },
  { id: 2, pair: "star",   icon: "✨", color: "#c26dff" },
  { id: 3, pair: "heart",  icon: "💖", color: "#ff4785" },
  { id: 4, pair: "heels",  icon: "👠", color: "#ff2e93", bonusCenter: true },
  { id: 5, pair: "bow",    icon: "🎀", color: "#ff72b8" },
  { id: 6, pair: "heart",  icon: "💖", color: "#ff4785" },
  { id: 7, pair: "crown",  icon: "👑", color: "#ffbf3c" },
  { id: 8, pair: "star",   icon: "✨", color: "#c26dff" },
];

export const WATERCOLOR_SWATCHES = [
  { id: "midnight", hex: "#3d1678", icon: "🎨" },
  { id: "violet",   hex: "#7b3fe4", icon: "🎨" },
  { id: "lavender", hex: "#b882ff", icon: "🎨" },
  { id: "galaxy",   hex: "#4b4ded", icon: "🎨" },
];

export const MARKER_SWATCHES = [
  { id: "hotpink",  hex: "#ff2e93", icon: "🖍️" },
  { id: "rose",     hex: "#ff69b4", icon: "🖍️" },
  { id: "bubble",   hex: "#ffa8d8", icon: "🖍️" },
];

export const STEPS = [
  {
    id: "bedroom_invite",
    index: 0,
    team: "both",
    bg: "bg_bedroom_split",
    icon: "🔑",
    kind: "tap_unlock",
    timestamp: "00:05",
    tools: [
      { id: "invite", icon: "💌", label: "Contest Invite" },
      { id: "key",    icon: "🔑", label: "Unlock Chain" },
    ],
  },
  {
    id: "purple_wheel",
    index: 1,
    team: "purple",
    bg: "bg_design_book",
    icon: "🎡",
    kind: "wheel_box",
    timestamp: "01:05",
    tools: [
      { id: "mystery", icon: "🎁", label: "Mystery Box" },
      { id: "wheel",   icon: "🎡", label: "Spin Purple" },
    ],
  },
  {
    id: "purple_sketch",
    index: 2,
    team: "purple",
    bg: "bg_design_book",
    icon: "✒️",
    kind: "brush_reveal",
    timestamp: "02:15",
    tools: [
      { id: "pen", icon: "✒️", label: "Fine-liner Pen" },
    ],
  },
  {
    id: "purple_paint",
    index: 3,
    team: "purple",
    bg: "bg_design_book",
    icon: "🎨",
    kind: "brush_reveal",
    timestamp: "03:20",
    tools: [
      { id: "midnight", icon: "💜", swatch: "#3d1678", label: "Midnight" },
      { id: "violet",   icon: "🟣", swatch: "#7b3fe4", label: "Violet" },
      { id: "lavender", icon: "🔮", swatch: "#b882ff", label: "Lavender" },
      { id: "galaxy",   icon: "🌌", swatch: "#4b4ded", label: "Galaxy" },
    ],
  },
  {
    id: "purple_cut_gems",
    index: 4,
    team: "purple",
    bg: "bg_design_book",
    icon: "✂️",
    kind: "cut_and_gems",
    timestamp: "04:40",
    tools: [
      { id: "scissors", icon: "✂️", label: "Golden Scissors" },
      { id: "gems",     icon: "💎", label: "Pearl Rhinestones" },
    ],
  },
  {
    id: "purple_runway",
    index: 5,
    team: "purple",
    bg: "bg_runway_purple",
    icon: "💜",
    kind: "runway_dressup",
    timestamp: "06:10",
    tools: [
      { id: "dress",  icon: "👗", label: "Cosmic Gowns" },
      { id: "heels",  icon: "👠", label: "Purple Heels" },
      { id: "makeup", icon: "💄", label: "Heart Makeup" },
    ],
  },
  {
    id: "pink_wheel",
    index: 6,
    team: "pink",
    bg: "bg_design_book",
    icon: "🎀",
    kind: "wheel_box",
    timestamp: "07:10",
    tools: [
      { id: "badge", icon: "🎀", label: "Mira Badge" },
      { id: "wheel", icon: "🎡", label: "Spin Pink" },
    ],
  },
  {
    id: "pink_sketch",
    index: 7,
    team: "pink",
    bg: "bg_design_book",
    icon: "✒️",
    kind: "brush_reveal",
    timestamp: "07:55",
    tools: [
      { id: "pen", icon: "✒️", label: "Fine-liner Pen" },
    ],
  },
  {
    id: "pink_marker_glitter",
    index: 8,
    team: "pink",
    bg: "bg_design_book",
    icon: "🌀",
    kind: "marker_glitter_fan",
    timestamp: "08:50",
    tools: [
      { id: "marker",  icon: "🖍️", swatch: "#ff2e93", label: "Pink Marker" },
      { id: "glitter", icon: "✨", label: "Pink Glitter" },
      { id: "fan",     icon: "🌀", label: "Mini Fan Dryer" },
    ],
  },
  {
    id: "pink_memory_shoes",
    index: 9,
    team: "pink",
    bg: "bg_runway_pink",
    icon: "🧩",
    kind: "memory_shoes",
    timestamp: "10:15",
    tools: [
      { id: "wand", icon: "🪄", label: "Match Hint" },
    ],
  },
  {
    id: "pink_runway",
    index: 10,
    team: "pink",
    bg: "bg_runway_pink",
    icon: "💖",
    kind: "runway_dressup",
    timestamp: "11:05",
    tools: [
      { id: "dress",  icon: "👗", label: "Rose Ballgowns" },
      { id: "heels",  icon: "👠", label: "Pink Heels" },
      { id: "makeup", icon: "💖", label: "Glitter Shimmer" },
    ],
  },
  {
    id: "grand_showdown",
    index: 11,
    team: "finale",
    bg: "bg_showdown_stage",
    icon: "👑",
    kind: "showdown_vote",
    timestamp: "11:45",
    tools: [
      { id: "vote_purple", icon: "💜", label: "Team Purple" },
      { id: "vote_pink",   icon: "💖", label: "Team Pink" },
      { id: "vote_both",   icon: "👑", label: "Both Win" },
    ],
  },
];
