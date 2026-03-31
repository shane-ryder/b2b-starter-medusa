import { createFindParams, createOperatorMap } from "@medusajs/medusa/api/utils/validators";
import { z } from "@medusajs/framework/zod";

export type AdminGetBrandParamsType = z.infer<typeof AdminGetBrandParams>;
export const AdminGetBrandParams = createFindParams({
  limit: 50,
  offset: 0,
})
  .merge(
    z.object({
      id: z
        .union([z.string(), z.array(z.string()), createOperatorMap()])
        .optional(),
      name: z
        .union([z.string(), z.array(z.string()), createOperatorMap()])
        .optional(),
    })
  )
  .strict();

export type AdminCreateBrandType = z.infer<typeof AdminCreateBrand>;
export const AdminCreateBrand = z
  .object({
    name: z.string().min(1),
  })
  .strict();

export type AdminUpdateBrandType = z.infer<typeof AdminUpdateBrand>;
export const AdminUpdateBrand = z
  .object({
    name: z.string().min(1),
  })
  .strict();
