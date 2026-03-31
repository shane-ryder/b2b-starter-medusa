import { MiddlewareRoute } from "@medusajs/medusa";
import { adminBrandsMiddlewares } from "./brands/middlewares";
import { adminCompaniesMiddlewares } from "./companies/middlewares";
import { adminProductsMiddlewares } from "./products/middlewares";
import { adminQuotesMiddlewares } from "./quotes/middlewares";
import { adminApprovalsMiddlewares } from "./approvals/middlewares";

export const adminMiddlewares: MiddlewareRoute[] = [
  ...adminBrandsMiddlewares,
  ...adminCompaniesMiddlewares,
  ...adminProductsMiddlewares,
  ...adminQuotesMiddlewares,
  ...adminApprovalsMiddlewares,
];
