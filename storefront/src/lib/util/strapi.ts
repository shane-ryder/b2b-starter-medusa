import { HttpTypes } from "@medusajs/types"
import {
  StrapiProduct,
  StrapiMedia,
} from "../../types/strapi"

/**
 * Get Strapi product data from a Medusa product
 */
export function getStrapiProduct(
    product: HttpTypes.StoreProduct
): StrapiProduct | undefined {
  return (product as any).strapi_product as StrapiProduct | undefined
}

/**
 * Get product title from Strapi, fallback to Medusa
 */
export function getProductTitle(
    product: HttpTypes.StoreProduct
): string {
  const strapiProduct = getStrapiProduct(product)
  return strapiProduct?.title || product.title || ""
}

/**
 * Get product subtitle from Strapi
 */
export function getProductSubtitle(
    product: HttpTypes.StoreProduct
): string | undefined {
  const strapiProduct = getStrapiProduct(product)
  return strapiProduct?.subtitle
}

/**
 * Get product description from Strapi, fallback to Medusa
 */
export function getProductDescription(
    product: HttpTypes.StoreProduct
): string | null {
  const strapiProduct = getStrapiProduct(product)
  if (strapiProduct?.description) {
    // Strapi richtext is typically stored as a string or structured data
    // For now, we'll handle it as a string. You may need to parse it based on your Strapi configuration
    return typeof strapiProduct.description === "string"
        ? strapiProduct.description
        : JSON.stringify(strapiProduct.description)
  }
  return product.description
}

/**
 * Get product thumbnail from Strapi, fallback to Medusa
 */
export function getProductThumbnail(
    product: HttpTypes.StoreProduct
): string | null {
  const strapiProduct = getStrapiProduct(product)

  if (strapiProduct?.thumbnail?.url) {
    return strapiProduct.thumbnail.url
  }

  return product.thumbnail || null
}

/**
 * Get product images from Strapi, fallback to Medusa
 */
export function getProductImages(
    product: HttpTypes.StoreProduct
): HttpTypes.StoreProductImage[] {
  const strapiProduct = getStrapiProduct(product)

  if (strapiProduct?.images && strapiProduct.images.length > 0) {
    // Convert Strapi media to Medusa product image format
    return strapiProduct.images.map((image: StrapiMedia, index: number) => ({
      id: image.id.toString(),
      url: image.url,
      metadata: {
        alt: image.alternativeText || `Product image ${index + 1}`,
      },
      rank: index + 1,
    })) as HttpTypes.StoreProductImage[]
  }

  return product.images || []
}

/**
 * Get variant title from Strapi, fallback to Medusa
 */
export function getVariantTitle(
    variant: HttpTypes.StoreProductVariant,
    product: HttpTypes.StoreProduct
): string {
  const strapiProduct = getStrapiProduct(product)
  const strapiVariant = strapiProduct?.variants?.find(
      (v) => v.medusaId === variant.id
  )
  return strapiVariant?.title || variant.title || ""
}

/**
 * Get option title from Strapi, fallback to Medusa
 */
export function getOptionTitle(
    option: HttpTypes.StoreProductOption,
    product: HttpTypes.StoreProduct
): string {
  const strapiProduct = getStrapiProduct(product)
  const strapiOption = strapiProduct?.options?.find(
      (o) => o.medusaId === option.id
  )
  return strapiOption?.title || option.title || ""
}

/**
 * Get option value text from Strapi, fallback to Medusa
 */
export function getOptionValueText(
    optionValue: { id: string; option_id: string; value: string },
    product: HttpTypes.StoreProduct
): string {
  const strapiProduct = getStrapiProduct(product)
  const strapiOption = strapiProduct?.options?.find(
      (o) => o.medusaId === optionValue.option_id
  )
  const strapiOptionValue = strapiOption?.values?.find(
      (v) => v.medusaId === optionValue.id
  )
  return strapiOptionValue?.value || optionValue.value
}

/**
 * Get all option values for a variant with Strapi labels
 */
export function getVariantOptionValues(
    variant: HttpTypes.StoreProductVariant,
    product: HttpTypes.StoreProduct
): Array<{ optionTitle: string; value: string }> {
  if (!variant.options || variant.options.length === 0) {
    return []
  }

  return variant.options
      .filter((opt) => opt.option_id && opt.id)
      .map((opt) => {
        const option = product.options?.find((o) => o.id === opt.option_id)
        const optionTitle = option
            ? getOptionTitle(option, product)
            : ""
        const value = getOptionValueText(
            { id: opt.id, option_id: opt.option_id!, value: opt.value! },
            product
        )
        return { optionTitle, value }
      })
      .filter((opt) => opt.optionTitle && opt.value)
}

/**
 * Get images for a specific variant from Strapi
 */
export function getVariantImages(
    variant: HttpTypes.StoreProductVariant,
    product: HttpTypes.StoreProduct
): HttpTypes.StoreProductImage[] {
  const strapiProduct = getStrapiProduct(product)
  const strapiVariant = strapiProduct?.variants?.find(
      (v) => v.medusaId === variant.id
  )

  // If variant has specific images in Strapi, use those
  if (strapiVariant?.images && strapiVariant.images.length > 0) {
    return strapiVariant.images.map((image: StrapiMedia, index: number) => ({
      id: image.id.toString(),
      url: image.url,
      metadata: {
        alt: image.alternativeText || `Variant image ${index + 1}`,
      },
      rank: index + 1,
    })) as HttpTypes.StoreProductImage[]
  }

  // Fall back to Medusa variant images
  if ((variant as any).images && (variant as any).images.length > 0) {
    return (variant as any).images
  }

  // Finally, fall back to product images
  return getProductImages(product)
}
