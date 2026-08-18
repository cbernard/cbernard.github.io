import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const projects = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/projects" }),
  schema: z.object({
    slug: z.string(),
    order: z.number(),
    title: z.string(),
    client: z.string(),
    year: z.number(),
    services: z.array(z.string()),
    description: z.string(),
    background: z.string(),
    overlay: z.number().min(0).max(1).default(0),
    thumbnail: z.string(),
    medias: z.array(z.string()),
    url: z.string(),
  }),
});

export const collections = {
  projects,
};
