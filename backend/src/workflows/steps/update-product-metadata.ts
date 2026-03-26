import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { IProductModuleService, ProductDTO } from "@medusajs/framework/types"

export type UpdateProductMetadataInput = {
  id: string
  strapiId: number
  strapiDocumentId: string
}

export const updateProductMetadataStep = createStep(
  "update-product-metadata",
  async (
    { id, strapiId, strapiDocumentId }: UpdateProductMetadataInput,
    { container }
  ) => {
    const productModuleService: IProductModuleService = container.resolve(
      Modules.PRODUCT
    )

    const originalProduct = await productModuleService.retrieveProduct(id)
    const updatedProduct = await productModuleService.updateProducts(id, {
      metadata: {
        ...originalProduct.metadata,
        strapi_id: strapiId,
        strapi_document_id: strapiDocumentId,
      },
    })

    return new StepResponse(updatedProduct, originalProduct)
  },
  async (compensationData: ProductDTO | undefined, { container }) => {
    if (!compensationData) {
      return
    }

    const productModuleService: IProductModuleService = container.resolve(
      Modules.PRODUCT
    )

    await productModuleService.updateProducts(compensationData.id, {
      metadata: compensationData.metadata,
    })
  }
)
