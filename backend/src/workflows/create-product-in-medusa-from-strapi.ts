import {
  createWorkflow,
  transform,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { CreateProductDTO } from "@medusajs/framework/types"
import {
  fetchProductFromStrapiStep,
  StrapiMedia,
  StrapiProduct,
} from "./steps/fetch-product-from-strapi"
import {
  CreateProductInMedusaInput,
  createProductInMedusaStep,
} from "./steps/create-product-in-medusa"
import { buildStrapiProductSyncMappingsStep } from "./steps/build-strapi-product-sync-mappings"
import { updateProductMetadataStep } from "./steps/update-product-metadata"
import { updateProductOptionValuesMetadataStep } from "./steps/update-product-option-values-metadata"
import { updateProductVariantsMetadataStep } from "./steps/update-product-variants-metadata"
import { updateStrapiMedusaIdsStep } from "./steps/update-strapi-medusa-ids"

export type CreateProductInMedusaFromStrapiWorkflowInput = {
  entry: any
}

type StrapiVariantRecord = NonNullable<StrapiProduct["variants"]>[number]

const toAbsoluteUrl = (media: StrapiMedia | null | undefined, apiUrl: string) => {
  const mediaUrl = media?.url

  if (!mediaUrl) {
    return undefined
  }

  try {
    return new URL(mediaUrl, apiUrl).toString()
  } catch {
    return mediaUrl
  }
}

const uniqueValues = (values: string[]) => [...new Set(values)]

const buildVariantOptions = (
  variant: StrapiVariantRecord
): Record<string, string> | undefined => {
  const options = Object.fromEntries(
    (variant.option_values || [])
      .map((optionValue) => {
        const optionTitle = optionValue.option?.title?.trim()
        const optionValueText = optionValue.value?.trim()

        if (!optionTitle || !optionValueText) {
          return null
        }

        return [optionTitle, optionValueText]
      })
      .filter(Boolean) as [string, string][]
  )

  return Object.keys(options).length ? options : undefined
}

export const createProductInMedusaFromStrapiWorkflow = createWorkflow(
  "create-product-in-medusa-from-strapi",
  (input: CreateProductInMedusaFromStrapiWorkflowInput) => {
    const fetchedProduct = fetchProductFromStrapiStep({
      entry: input.entry,
    })

    const createInput = transform({ fetchedProduct }, (data) => {
      const product = data.fetchedProduct.product
      const apiUrl = data.fetchedProduct.apiUrl
      const images = (product.images || [])
        .map((image) => toAbsoluteUrl(image, apiUrl))
        .filter(Boolean)
        .map((url) => ({ url })) as { url: string }[]

      const medusaProduct: CreateProductDTO = {
        title: product.title,
        subtitle: product.subtitle || undefined,
        description: product.description || undefined,
        handle: product.handle || undefined,
        thumbnail: toAbsoluteUrl(product.thumbnail, apiUrl),
        images: images.length ? images : undefined,
        options: (product.options || []).length
          ? (product.options || []).map((option) => ({
              title: option.title,
              values: uniqueValues(
                (option.values || [])
                  .map((value) => value.value)
                  .filter((value): value is string => Boolean(value))
              ),
            }))
          : undefined,
        variants: (product.variants || []).length
          ? (product.variants || []).map((variant) => ({
              title: variant.title,
              sku: variant.sku || undefined,
              options: buildVariantOptions(variant),
            }))
          : undefined,
      }

      return {
        product: medusaProduct,
      } as CreateProductInMedusaInput
    })

    const createdProduct = createProductInMedusaStep(createInput)

    const syncMappings = buildStrapiProductSyncMappingsStep({
      productId: createdProduct.id,
      strapiProduct: fetchedProduct.product,
    })

    updateProductMetadataStep(syncMappings.productMetadata)

    when({ syncMappings }, (data) => data.syncMappings.optionValueMetadataUpdates.length > 0)
      .then(() => {
        updateProductOptionValuesMetadataStep({
          updates: syncMappings.optionValueMetadataUpdates,
        })
      })

    when({ syncMappings }, (data) => data.syncMappings.variantMetadataUpdates.length > 0)
      .then(() => {
        updateProductVariantsMetadataStep({
          updates: syncMappings.variantMetadataUpdates,
        })
      })

    when({ syncMappings }, (data) => data.syncMappings.strapiMedusaIdUpdates.length > 0)
      .then(() => {
        updateStrapiMedusaIdsStep({
          updates: syncMappings.strapiMedusaIdUpdates,
        })
      })

    return new WorkflowResponse({
      product_id: createdProduct.id,
    })
  }
)
