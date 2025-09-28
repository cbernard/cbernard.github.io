// Dynamically import ALL images from the projects directory
const images = import.meta.glob<{ default: ImageMetadata }>(
  "../images/projects/*.{jpeg,jpg,png,gif,webp}",
  { eager: true },
);

// Create a clean mapping function for the new structure
export function getImageByPath(imagePath: string): ImageMetadata {
  // Convert "images/projects/piaget.webp" to "../images/projects/piaget.webp"
  const fullPath = `../${imagePath}`;

  // Try exact path match first
  if (images[fullPath]) {
    return images[fullPath].default;
  }

  // Fallback - find by filename only
  const filename = imagePath.split("/").pop();
  const matchingImage = Object.entries(images).find(([path]) =>
    path.includes(filename || ""),
  );

  if (matchingImage) {
    return matchingImage[1].default;
  }

  throw new Error(`Image not found: ${imagePath}`);
}
