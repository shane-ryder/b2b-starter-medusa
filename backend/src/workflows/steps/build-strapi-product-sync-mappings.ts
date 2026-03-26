import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { Collection } from "../../modules/strapi/service"
import { StrapiProduct } from "./fetch-product-from-strapi"
import { StrapiMedusaIdUpdate } from "./update-strapi-medusa-ids"

type BuildStrapiProductSyncMappingsInput = {
  productId: string
  strapiProduct: StrapiProduct
}

type ProductMetadataUpdate = {
  id: string
  strapiId: number
  strapiDocumentId: string
}

type VariantMetadataUpdate = {
  variantId: string
  strapiId: number
  strapiDocumentId: string
}

type OptionValueMetadataUpdate = {
  id: string
  strapiId: number
  strapiDocumentId: string
}

type BuildStrapiProductSyncMappingsOutput = {
  productMetadata: ProductMetadataUpdate
  variantMetadataUpdates: VariantMetadataUpdate[]
  optionValueMetadataUpdates: OptionValueMetadataUpdate[]
  strapiMedusaIdUpdates: StrapiMedusaIdUpdate[]
}

type QueriedMedusaProduct = {
  id: string
  options?: {
    id: string
    title: string
    values?: {
      id: string
      value: string
    }[]
  }[]
  variants?: {
    id: string
    title: string
    sku?: string | null
    options?: {
      id: string
      value: string
      option?: {
        id?: string
        title?: string | null
      } | null
    }[]
  }[]
}

type QueriedMedusaVariant = NonNullable<QueriedMedusaProduct["variants"]>[number]
type StrapiVariantRecord = NonNullable<StrapiProduct["variants"]>[number]

const normalize = (value?: string | null) => (value || "").trim().toLowerCase()

const buildLookup = <T>(
  items: T[],
  getKey: (item: T) => string,
  context: string
) => {
  const lookup = new Map<string, T>()

  for (const item of items) {
    const key = getKey(item)

    if (!key) {
      continue
    }

    if (lookup.has(key)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Duplicate ${context} mapping key "${key}" found while syncing Strapi product`
      )
    }

    lookup.set(key, item)
  }

  return lookup
}

const getStrapiVariantKey = (variant: StrapiVariantRecord) => {
  if (variant.sku) {
    return `sku:${normalize(variant.sku)}`
  }

  const optionPairs = (variant.option_values || [])
    .map((optionValue) => {
      const optionTitle = optionValue.option?.title
      return `${normalize(optionTitle)}:${normalize(optionValue.value)}`
    })
    .filter((pair) => pair !== ":")
    .sort()
    .join("|")

  if (optionPairs) {
    return `options:${optionPairs}`
  }

  return `title:${normalize(variant.title)}`
}

const getMedusaVariantKey = (variant: QueriedMedusaVariant) => {
  if (variant.sku) {
    return `sku:${normalize(variant.sku)}`
  }

  const optionPairs = (variant.options || [])
    .map((optionValue) => {
      const optionTitle = optionValue.option?.title
      return `${normalize(optionTitle)}:${normalize(optionValue.value)}`
    })
    .filter((pair) => pair !== ":")
    .sort()
    .join("|")

  if (optionPairs) {
    return `options:${optionPairs}`
  }

  return `title:${normalize(variant.title)}`
}

export const buildStrapiProductSyncMappingsStep = createStep(
  "build-strapi-product-sync-mappings",
  async (
    { productId, strapiProduct }: BuildStrapiProductSyncMappingsInput,
    { container }
  ) => {
    const query = container.resolve("query")

    const { data } = await query.graph({
      entity: "product",
      fields: [
        "id",
        "options.id",
        "options.title",
        "options.values.id",
        "options.values.value",
        "variants.id",
        "variants.title",
        "variants.sku",
        "variants.options.id",
        "variants.options.value",
        "variants.options.option.id",
        "variants.options.option.title",
      ],
      filters: {
        id: productId,
      },
    })

    const medusaProduct = data?.[0] as QueriedMedusaProduct | undefined

    if (!medusaProduct) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Created Medusa product ${productId} was not found for Strapi sync`
      )
    }

    const strapiMedusaIdUpdates: StrapiMedusaIdUpdate[] = []
    const optionValueMetadataUpdates: OptionValueMetadataUpdate[] = []
    const variantMetadataUpdates: VariantMetadataUpdate[] = []

    if (strapiProduct.documentId && strapiProduct.medusaId !== medusaProduct.id) {
      strapiMedusaIdUpdates.push({
        collection: Collection.PRODUCTS,
        documentId: strapiProduct.documentId,
        medusaId: medusaProduct.id,
        previousMedusaId: strapiProduct.medusaId ?? null,
      })
    }

    const medusaOptionsByTitle = buildLookup(
      medusaProduct.options || [],
      (option) => normalize(option.title),
      "product option"
    )

    for (const strapiOption of strapiProduct.options || []) {
      const medusaOption = medusaOptionsByTitle.get(normalize(strapiOption.title))

      if (!medusaOption) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Failed to match Strapi option "${strapiOption.title}" to a Medusa option`
        )
      }

      if (strapiOption.documentId && strapiOption.medusaId !== medusaOption.id) {
        strapiMedusaIdUpdates.push({
          collection: Collection.PRODUCT_OPTIONS,
          documentId: strapiOption.documentId,
          medusaId: medusaOption.id,
          previousMedusaId: strapiOption.medusaId ?? null,
        })
      }

      const medusaValuesByValue = buildLookup(
        medusaOption.values || [],
        (value) => normalize(value.value),
        `option values for ${strapiOption.title}`
      )

      for (const strapiValue of strapiOption.values || []) {
        const medusaValue = medusaValuesByValue.get(normalize(strapiValue.value))

        if (!medusaValue) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Failed to match Strapi option value "${strapiValue.value}" to a Medusa option value`
          )
        }

        optionValueMetadataUpdates.push({
          id: medusaValue.id,
          strapiId: Number(strapiValue.id),
          strapiDocumentId: strapiValue.documentId,
        })

        if (strapiValue.documentId && strapiValue.medusaId !== medusaValue.id) {
          strapiMedusaIdUpdates.push({
            collection: Collection.PRODUCT_OPTION_VALUES,
            documentId: strapiValue.documentId,
            medusaId: medusaValue.id,
            previousMedusaId: strapiValue.medusaId ?? null,
          })
        }
      }
    }

    const medusaVariantsByKey = buildLookup(
      medusaProduct.variants || [],
      (variant) => getMedusaVariantKey(variant),
      "product variant"
    )

    for (const strapiVariant of strapiProduct.variants || []) {
      const medusaVariant = medusaVariantsByKey.get(getStrapiVariantKey(strapiVariant))

      if (!medusaVariant) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Failed to match Strapi variant "${strapiVariant.title}" to a Medusa variant`
        )
      }

      variantMetadataUpdates.push({
        variantId: medusaVariant.id,
        strapiId: Number(strapiVariant.id),
        strapiDocumentId: strapiVariant.documentId,
      })

      if (strapiVariant.documentId && strapiVariant.medusaId !== medusaVariant.id) {
        strapiMedusaIdUpdates.push({
          collection: Collection.PRODUCT_VARIANTS,
          documentId: strapiVariant.documentId,
          medusaId: medusaVariant.id,
          previousMedusaId: strapiVariant.medusaId ?? null,
        })
      }
    }

    return new StepResponse({
      productMetadata: {
        id: medusaProduct.id,
        strapiId: Number(strapiProduct.id),
        strapiDocumentId: strapiProduct.documentId,
      },
      variantMetadataUpdates,
      optionValueMetadataUpdates,
      strapiMedusaIdUpdates,
    } as BuildStrapiProductSyncMappingsOutput)
  }
)
