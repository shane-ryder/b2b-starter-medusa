import { z } from "@medusajs/framework/zod";

export type AdminSetProductBrandType = z.infer<typeof AdminSetProductBrand>;
export const AdminSetProductBrand = z
  .object({
    brand_id: z.string().nullish(),
  })
  .strict();
