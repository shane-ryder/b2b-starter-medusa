import { validateAndTransformBody } from "@medusajs/framework";
import { MiddlewareRoute } from "@medusajs/medusa";
import { AdminSetProductBrand } from "./validators";

export const adminProductsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/admin/products/:id/brand",
    middlewares: [validateAndTransformBody(AdminSetProductBrand)],
  },
];
