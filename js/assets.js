// Preloader for painterly 16:9 studio plates & flood-fill chroma-keyed RGBA paper-doll sprites

export const ASSET_MANIFEST = {
  bg_bedroom_split:    "assets/bg_bedroom_split.jpg",
  bg_design_book:      "assets/bg_design_book.jpg",
  bg_runway_purple:    "assets/bg_runway_purple.jpg",
  bg_runway_pink:      "assets/bg_runway_pink.jpg",
  bg_showdown_stage:   "assets/bg_showdown_stage.jpg",
  doll_rumi_base:      "assets/doll_rumi_base.png",
  doll_rumi_dressed:   "assets/doll_rumi_dressed.png",
  doll_mira_base:      "assets/doll_mira_base.png",
  doll_mira_dressed:   "assets/doll_mira_dressed.png",
  dress_purple:        "assets/dress_purple.png",
  dress_purple_sketch: "assets/dress_purple_sketch.png",
  dress_pink:          "assets/dress_pink.png",
  dress_pink_sketch:   "assets/dress_pink_sketch.png",
};

export function loadAllAssets() {
  const images = {};
  const entries = Object.entries(ASSET_MANIFEST);
  const promises = entries.map(([key, src]) => new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      images[key] = img;
      resolve(key);
    };
    img.onerror = () => reject(new Error(`Failed to load asset: ${src}`));
    img.src = src;
  }));
  return Promise.all(promises).then(() => images);
}
