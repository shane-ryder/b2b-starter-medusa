import { HttpTypes } from "@medusajs/framework/types";

export type QueryBrandProduct = Pick<HttpTypes.AdminProduct, "id" | "title">;

export type QueryBrand = {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  products: QueryBrandProduct[];
};
