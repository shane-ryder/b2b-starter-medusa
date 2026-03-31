import { HttpTypes } from "@medusajs/types"

export type StoreBrand = {
  id: string
  name: string
}

export type StoreProductWithBrand = HttpTypes.StoreProduct & {
  brand?: StoreBrand | null
}
