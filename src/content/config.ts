import { defineCollection, z } from "astro:content";

const projects = defineCollection({
  type: "data",
  schema: z.object({
    slug: z.string(),
    order: z.number(),
    title: z.string(),
    client: z.string(),
    year: z.number(),
    services: z.array(z.string()),
    description: z.string(),
    background: z.string(),
    thumbnail: z.string(),
    medias: z.array(z.string()),
    url: z.string(),
  }),
});

export const collections = {
  projects,
};
