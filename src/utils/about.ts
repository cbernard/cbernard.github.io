import type { ImageMetadata } from "astro";
import aboutImage from "../images/about.jpg";
import travelImage from "../images/about_travel.jpg";
import wavesImage from "../images/about_waves.jpg";
import hikingImage from "../images/about_hiking.jpg";

export { aboutImage };

// A pin shows a picture, or a clip from `public` by its path.
export const pins: { label: string; image?: ImageMetadata; video?: string }[] =
  [
    { label: "Switzerland", image: hikingImage },
    {
      label: "thoughtful interactions",
      video: "videos/projects/ov-2023/06.mp4",
    },
    { label: "wandering through new places", image: travelImage },
    { label: "chasing a few waves", image: wavesImage },
  ];

// The loader preloads these pictures at these exact widths so it fetches the
// files the page shows.
export const aboutWidths = [400, 800];
export const pinWidths = [400, 800, 1200, 1600, 2400];
export const postcardWidths = [400, 800, 1200];
export const postcardSizes = "90vw";
