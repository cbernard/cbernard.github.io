import { defineCollection, z } from "astro:content";

const projects = defineCollection({
  type: "data",
  schema: z.object({
    order: z.number(),
    title: z.string(),
    client: z.string(),
    year: z.number(),
  }),
});

export const collections = {
  projects,
};
