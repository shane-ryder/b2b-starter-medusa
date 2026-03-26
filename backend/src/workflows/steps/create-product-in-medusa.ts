import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { CreateProductDTO, IProductModuleService, ProductDTO } from "@medusajs/framework/types"

export type CreateProductInMedusaInput = {
  product: CreateProductDTO
}

export const createProductInMedusaStep = createStep(
  "create-product-in-medusa",
  async ({ product }: CreateProductInMedusaInput, { container }) => {
    const productModuleService: IProductModuleService = container.resolve(
      Modules.PRODUCT
    )

    const createdProduct = await productModuleService.createProducts(
      product
    ) as ProductDTO

    return new StepResponse(createdProduct, createdProduct.id)
  },
  async (productId, { container }) => {
    if (!productId) {
      return
    }

    const productModuleService: IProductModuleService = container.resolve(
      Modules.PRODUCT
    )

    await productModuleService.deleteProducts([productId])
  }
)
