import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { STRAPI_MODULE } from "../../modules/strapi"
import StrapiModuleService, { Collection } from "../../modules/strapi/service"

export type StrapiMedia = {
  id: number
  documentId?: string
  url?: string | null
}

export type StrapiOptionValue = {
  id: number
  documentId: string
  medusaId?: string | null
  value: string
  option?: {
    id?: number
    title?: string | null
  } | null
}

export type StrapiOption = {
  id: number
  documentId: string
  medusaId?: string | null
  title: string
  values?: StrapiOptionValue[]
}

export type StrapiVariant = {
  id: number
  documentId: string
  medusaId?: string | null
  title: string
  sku?: string | null
  images?: StrapiMedia[]
  thumbnail?: StrapiMedia | null
  option_values?: StrapiOptionValue[]
}

export type StrapiProduct = {
  id: number
  documentId: string
  medusaId?: string | null
  title: string
  subtitle?: string | null
  description?: string | null
  handle?: string | null
  images?: StrapiMedia[]
  thumbnail?: StrapiMedia | null
  options?: StrapiOption[]
  variants?: StrapiVariant[]
}

export type FetchProductFromStrapiInput = {
  entry: {
    entry?: {
      documentId?: string
      id?: number | string
    }
  }
}

export const fetchProductFromStrapiStep = createStep(
  "fetch-product-from-strapi",
  async ({ entry }: FetchProductFromStrapiInput, { container }) => {
    const strapiService: StrapiModuleService = container.resolve(STRAPI_MODULE)
    const documentId = entry?.entry?.documentId
    const entityId = entry?.entry?.id

    if (!documentId && typeof entityId === "undefined") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Strapi product webhook payload must include documentId or id"
      )
    }

    const populate = {
      images: true,
      thumbnail: true,
      options: {
        populate: {
          values: true,
        },
      },
      variants: {
        populate: {
          images: true,
          thumbnail: true,
          option_values: {
            populate: {
              option: true,
            },
          },
        },
      },
    }

    const product = documentId
      ? await strapiService.findOne(Collection.PRODUCTS, documentId, { populate })
      : await strapiService.findFirst(
          Collection.PRODUCTS,
          {
            id: {
              $eq: entityId,
            },
          },
          {
            populate,
          }
        )

    if (!product) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Strapi product ${documentId || entityId} was not found`
      )
    }

    return new StepResponse({
      apiUrl: strapiService.getApiUrl(),
      product: product as unknown as StrapiProduct,
    })
  }
)
