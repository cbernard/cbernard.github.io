const images = import.meta.glob<{ default: ImageMetadata }>(
  "../images/projects/**/*.{jpeg,jpg,png,gif,webp}",
  { eager: true },
);

export function getImageByPath(imagePath: string): ImageMetadata {
  const fullPath = `../${imagePath}`;

  if (images[fullPath]) {
    return images[fullPath].default;
  }

  const filename = imagePath.split("/").pop();
  const matchingImage = Object.entries(images).find(([path]) =>
    path.includes(filename || ""),
  );

  if (matchingImage) {
    return matchingImage[1].default;
  }

  throw new Error(`Image not found: ${imagePath}`);
}

export function getImageUrl(imagePath: string): string {
  return getImageByPath(imagePath).src;
}

// The loader preloads the backgrounds at these exact widths so it fetches the
// files the pages show.
export const backgroundWidths = [400, 800, 1440];
export const backgroundSizes = "(orientation: landscape) 50vw, 100vw";
