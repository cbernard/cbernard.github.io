import aboutImage from "../images/about.jpg";
import travelImage from "../images/about_travel.jpg";
import wavesImage from "../images/about_waves.jpg";
import hikingImage from "../images/about_hiking.jpg";
import cyclingImage from "../images/about_cycling.jpg";

export { aboutImage };

export const pins = [
  { label: "Switzerland", image: hikingImage },
  { label: "out on his bike", image: cyclingImage },
  { label: "off somewhere new", image: travelImage },
  { label: "chasing a few waves", image: wavesImage },
];

// The loader preloads these pictures at these exact widths so it fetches the
// files the page shows.
export const aboutWidths = [400, 800];
export const pinWidths = [400, 800, 1200, 1600];
export const postcardWidths = [400, 800, 1200];
export const postcardSizes = "90vw";
