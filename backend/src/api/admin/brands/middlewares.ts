import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework";
import { MiddlewareRoute } from "@medusajs/medusa";
import { adminBrandQueryConfig } from "./query-config";
import {
  AdminCreateBrand,
  AdminGetBrandParams,
  AdminUpdateBrand,
} from "./validators";

export const adminBrandsMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/brands",
    middlewares: [
      validateAndTransformQuery(AdminGetBrandParams, adminBrandQueryConfig.list),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/brands",
    middlewares: [
      validateAndTransformBody(AdminCreateBrand),
      validateAndTransformQuery(
        AdminGetBrandParams,
        adminBrandQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/brands/:id",
    middlewares: [
      validateAndTransformQuery(
        AdminGetBrandParams,
        adminBrandQueryConfig.retrieve
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/brands/:id",
    middlewares: [
      validateAndTransformBody(AdminUpdateBrand),
      validateAndTransformQuery(
        AdminGetBrandParams,
        adminBrandQueryConfig.retrieve
      ),
    ],
  },
];
