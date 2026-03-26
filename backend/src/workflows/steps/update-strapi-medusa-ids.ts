import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { STRAPI_MODULE } from "../../modules/strapi"
import StrapiModuleService, { Collection } from "../../modules/strapi/service"

export type StrapiMedusaIdUpdate = {
  collection: Collection
  documentId: string
  medusaId: string
  previousMedusaId?: string | null
}

export type UpdateStrapiMedusaIdsInput = {
  updates: StrapiMedusaIdUpdate[]
}

export const updateStrapiMedusaIdsStep = createStep(
  "update-strapi-medusa-ids",
  async ({ updates }: UpdateStrapiMedusaIdsInput, { container }) => {
    const strapiService: StrapiModuleService = container.resolve(STRAPI_MODULE)
    const appliedUpdates: StrapiMedusaIdUpdate[] = []

    for (const update of updates) {
      await strapiService.update(update.collection, update.documentId, {
        medusaId: update.medusaId,
      })
      appliedUpdates.push(update)
    }

    return new StepResponse(appliedUpdates, appliedUpdates)
  },
  async (compensationData: StrapiMedusaIdUpdate[] | undefined, { container }) => {
    if (!compensationData?.length) {
      return
    }

    const strapiService: StrapiModuleService = container.resolve(STRAPI_MODULE)

    for (const update of [...compensationData].reverse()) {
      if (!update.previousMedusaId) {
        continue
      }

      await strapiService.update(update.collection, update.documentId, {
        medusaId: update.previousMedusaId,
      })
    }
  }
)
