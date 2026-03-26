import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { simpleHash, Modules } from "@medusajs/framework/utils"
import { 
  handleStrapiWebhookWorkflow, 
  WorkflowInput,
} from "../../../workflows/handle-strapi-webhook"
import { createProductInMedusaFromStrapiWorkflow } from "../../../workflows/create-product-in-medusa-from-strapi"

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {
  const body = req.body as Record<string, unknown>
  const logger = req.scope.resolve("logger")
  const cachingService = req.scope.resolve(Modules.CACHING)
  
  // Generate a hash of the webhook payload to detect duplicates
  const payloadHash = simpleHash(JSON.stringify(body))
  const cacheKey = `strapi-webhook:${payloadHash}`
  
  // Check if we've already processed this webhook
  const alreadyProcessed = await cachingService.get({ key: cacheKey })
  
  if (alreadyProcessed) {
    logger.debug(`Webhook already processed (hash: ${payloadHash}), skipping to prevent infinite loop`)
    res.status(200).send("OK - Already processed")
    return
  }
  
  const isCreateProductWebhook =
    body.event === "entry.create" && body.model === "product"

  const isUpdateWebhook = body.event === "entry.update"

  if (isUpdateWebhook || isCreateProductWebhook) {
    if (isUpdateWebhook) {
      await handleStrapiWebhookWorkflow(req.scope).run({
        input: {
          entry: body,
        } as WorkflowInput,
      })
    }

    if (isCreateProductWebhook) {
      await createProductInMedusaFromStrapiWorkflow(req.scope).run({
        input: {
          entry: body,
        },
      })
    }
    
    // Cache the hash to prevent reprocessing (TTL: 60 seconds)
    await cachingService.set({
      key: cacheKey,
      data: { status: "processed", timestamp: Date.now() },
      ttl: 60,
    })
    logger.debug(`Webhook processed and cached (hash: ${payloadHash})`)
  }

  res.status(200).send("OK")
}

