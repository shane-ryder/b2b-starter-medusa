export interface StrapiMedia {
  id: number
  url: string
  alternativeText?: string
  caption?: string
  width?: number
  height?: number
  formats?: {
    thumbnail?: { url: string; width: number; height: number }
    small?: { url: string; width: number; height: number }
    medium?: { url: string; width: number; height: number }
    large?: { url: string; width: number; height: number }
  }
}

export interface StrapiProductOptionValue {
  id: number
  medusaId: string
  value: string
  locale: string
  option?: StrapiProductOption
  variants?: StrapiProductVariant[]
}

export interface StrapiProductOption {
  id: number
  medusaId: string
  title: string
  locale: string
  product?: StrapiProduct
  values?: StrapiProductOptionValue[]
}

export interface StrapiProductVariant {
  id: number
  medusaId: string
  title: string
  sku?: string
  locale: string
  product?: StrapiProduct
  option_values?: StrapiProductOptionValue[]
  images?: StrapiMedia[]
  thumbnail?: StrapiMedia
}

export interface StrapiProduct {
  id: number
  medusaId: string
  title: string
  subtitle?: string
  description?: string
  handle: string
  images?: StrapiMedia[]
  thumbnail?: StrapiMedia
  locale: string
  variants?: StrapiProductVariant[]
  options?: StrapiProductOption[]
}
