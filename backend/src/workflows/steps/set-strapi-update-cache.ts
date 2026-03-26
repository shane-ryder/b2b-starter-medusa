import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"

export type SetStrapiUpdateCacheInput = {
  model: string
  id: string
}

export const setStrapiUpdateCacheStep = createStep(
  "set-strapi-update-cache",
  async ({ model, id }: SetStrapiUpdateCacheInput, { container }) => {
    const cachingService = container.resolve(Modules.CACHING)

    await cachingService.set({
      key: `strapi-update:${model}:${id}`,
      data: { status: "processing", timestamp: Date.now() },
      ttl: 10,
    })

    return new StepResponse({ model, id })
  }
)
