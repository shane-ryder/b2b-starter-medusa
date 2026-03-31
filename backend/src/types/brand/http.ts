import { PaginatedResponse } from "@medusajs/types";
import { QueryBrand } from "./query";

export type AdminBrandResponse = {
  brand: QueryBrand;
};

export type AdminBrandsResponse = PaginatedResponse<{
  brands: QueryBrand[];
}>;

export type AdminCreateBrand = {
  name: string;
};

export type AdminUpdateBrand = AdminCreateBrand;
