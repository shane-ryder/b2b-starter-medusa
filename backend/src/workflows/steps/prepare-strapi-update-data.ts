import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { MedusaError } from "@medusajs/framework/utils"
import { STRAPI_MODULE } from "../../modules/strapi"
import StrapiModuleService, { Collection } from "../../modules/strapi/service"

const toAbsoluteUrl = (media: { url?: string | null } | null | undefined, apiUrl: string) => {
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

const sleep = async (ms: number) =>
  await new Promise((resolve) => setTimeout(resolve, ms))

export const prepareStrapiUpdateDataStep = createStep(
  "prepare-strapi-update-data",
  async ({ entry }: { entry: any }, { container }) => {
    let data: Record<string, unknown> = {}
    const model = entry.model

    switch (model) {
      case "product": {
        const strapiService: StrapiModuleService = container.resolve(STRAPI_MODULE)
        const documentId = entry.entry?.documentId
        const entityId = entry.entry?.id
        const populate = {
          images: true,
          thumbnail: true,
        }

        const fetchProduct = async () => {
          if (documentId) {
            return await strapiService.findOne(Collection.PRODUCTS, documentId, {
              populate,
            })
          }

          if (typeof entityId !== "undefined") {
            return await strapiService.findFirst(
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
          }

          return undefined
        }

        let product = await fetchProduct()
        let medusaId = product?.medusaId || entry.entry?.medusaId

        for (let attempt = 0; attempt < 10 && !medusaId; attempt++) {
          await sleep(500)
          product = await fetchProduct()
          medusaId = product?.medusaId || entry.entry?.medusaId
        }

        if (!medusaId) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Strapi product ${documentId || entityId} doesn't have a Medusa ID yet`
          )
        }

        data = {
          id: medusaId,
          title: product?.title ?? entry.entry.title,
          subtitle: product?.subtitle ?? entry.entry.subtitle,
          description: product?.description ?? entry.entry.description,
          handle: product?.handle ?? entry.entry.handle,
          images: product
            ? (product.images || [])
                .map((image) => toAbsoluteUrl(image, strapiService.getApiUrl()))
                .filter((url): url is string => Boolean(url))
                .map((url) => ({ url }))
            : undefined,
          thumbnail: product
            ? toAbsoluteUrl(product.thumbnail, strapiService.getApiUrl()) || null
            : undefined,
        }
        break
      }
      case "product-variant":
        data = {
          id: entry.entry.medusaId,
          title: entry.entry.title,
          sku: entry.entry.sku,
        }
        break
      case "product-option":
        data = {
          selector: {
            id: entry.entry.medusaId,
          },
          update: {
            title: entry.entry.title,
          },
        }
        break
      case "product-option-value":
        data = {
          optionValueId: entry.entry.medusaId,
          value: entry.entry.value,
        }
        break
    }

    return new StepResponse({ data, model })
  }
)

