import { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { batchProductsWorkflow } from "@medusajs/medusa/core-flows"
import { Readable } from "stream"
import { parser } from "stream-json"
import { pick } from "stream-json/filters/Pick"
import { streamArray } from "stream-json/streamers/StreamArray"
import { chain } from "stream-chain"

const API_FETCH_SIZE = 200
const PROCESS_BATCH_SIZE = 50
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000
const FETCH_TIMEOUT_MS = 30000

async function fetchWithRetry(
    url: string,
    retries = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

      const response = await fetch(url, {
        signal: controller.signal,
        // Keep connection alive for efficiency with multiple requests
        headers: {
          "Connection": "keep-alive",
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response
    } catch (error: any) {
      lastError = error
      const isRetryable =
          error.code === "UND_ERR_SOCKET" ||
          error.code === "ECONNREFUSED" ||
          error.code === "ECONNRESET" ||
          error.code === "ETIMEDOUT" ||
          error.name === "AbortError"

      if (isRetryable && attempt < retries) {
        // Exponential backoff: 1s → 2s → 4s
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1)
        await new Promise((resolve) => setTimeout(resolve, delay))
      } else {
        break
      }
    }
  }

  throw lastError
}

/**
 * Streams products from the external API using incremental JSON parsing
 * Products are yielded one by one as they're parsed from the response stream
 */
async function* streamProductsFromApi() {
  let offset = 0
  let hasMore = true

  while (hasMore) {
    const url = `https://third-party-api.com/products?limit=${API_FETCH_SIZE}&offset=${offset}`

    const response = await fetchWithRetry(url)

    // Convert web ReadableStream to Node.js Readable
    const nodeStream = Readable.fromWeb(response.body as any)

    // Create a streaming JSON parser pipeline that:
    // 1. Parses JSON incrementally
    // 2. Picks only the "products" array
    // 3. Streams each array item individually
    const pipeline = chain([
      nodeStream,
      parser(),
      pick({ filter: "products" }),
      streamArray(),
    ])

    let productCount = 0

    // Yield each product as it's parsed - memory stays constant
    try {
      for await (const { value } of pipeline) {
        yield value
        productCount++

        // Yield to event loop periodically to prevent blocking
        if (productCount % 100 === 0) {
          await new Promise((resolve) => setImmediate(resolve))
        }
      }
    } catch (streamError: any) {
      // Handle stream errors (socket closed mid-stream)
      if (streamError.code === "UND_ERR_SOCKET" || streamError.code === "ECONNRESET") {
        throw new MedusaError(
            MedusaError.Types.UNEXPECTED_STATE,
            `Stream interrupted after ${productCount} products: ${streamError.message}`
        )
      }
      throw streamError
    }

    // If the products are less than expected, there are no more products
    if (productCount < API_FETCH_SIZE) {
      hasMore = false
    } else {
      offset += productCount
    }
  }
}

/**
 * Collects products into batches of the specified size
 */
async function* batchProducts(
    products: AsyncGenerator,
    batchSize: number
): AsyncGenerator<any[]> {
  let batch: any[] = []

  for await (const product of products) {
    batch.push(product)

    if (batch.length >= batchSize) {
      yield batch
      // Release reference for GC
      batch = []
    }
  }

  // Yield remaining products
  if (batch.length > 0) {
    yield batch
  }
}

export default async function syncProductsJob(container: MedusaContainer) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const workflowEngine = container.resolve(Modules.WORKFLOW_ENGINE)

  let totalCreated = 0
  let totalUpdated = 0
  let batchNumber = 0

  // Stream products from API and process in batches
  // Memory stays constant - we only hold PROCESS_BATCH_SIZE products at a time
  const productStream = streamProductsFromApi()
  const batchedProducts = batchProducts(productStream, PROCESS_BATCH_SIZE)

  for await (const batch of batchedProducts) {
    batchNumber++

    // Extract external IDs from this batch to look up in Medusa
    const externalIds = batch.map((p) => p.id)

    // Query Medusa for products matching these external IDs
    const { data: existingProducts } = await query.graph(
        {
          entity: "product",
          fields: ["id", "updated_at", "external_id"],
          filters: {
            external_id: externalIds,
          },
        }
    )

    // Build a map for quick lookup
    const existingByExternalId = new Map(
        existingProducts.map((p) => [p.external_id, {
          id: p.id,
          updatedAt: p.updated_at,
        }])
    )

    const productsToCreate: any[] = []
    const productsToUpdate: any[] = []

    for (const externalProduct of batch) {
      const existing = existingByExternalId.get(externalProduct.id)

      if (existing) {
        // Product exists - prepare update
        productsToUpdate.push({
          id: existing.id,
          title: externalProduct.title,
          description: externalProduct.description ?? undefined,
          metadata: {
            external_id: externalProduct.id,
            last_synced: new Date().toISOString(),
          },
        })
      } else {
        // New product - prepare create
        productsToCreate.push({
          title: externalProduct.title,
          description: externalProduct.description ?? undefined,
          handle: externalProduct.handle,
          status: "draft",
          metadata: {
            external_id: externalProduct.id,
            last_synced: new Date().toISOString(),
          },
          options: [
            {
              title: "Default",
              values: ["Default"],
            },
          ],
          variants: externalProduct.variants.map((v) => ({
            title: v.title ?? "Default Variant",
            sku: v.sku ?? undefined,
            options: {
              Default: "Default",
            },
            prices: [
              {
                amount: v.price,
                currency_code: "usd",
              },
            ],
          })),
        })
      }
    }

    // Execute batch workflow for this batch
    if (productsToCreate.length > 0 || productsToUpdate.length > 0) {
      await batchProductsWorkflow(container).run({
        input: {
          create: productsToCreate,
          update: productsToUpdate,
        },
      })

      totalCreated += productsToCreate.length
      totalUpdated += productsToUpdate.length
    }
    // Yield to event loop between batches
    await new Promise((resolve) => setImmediate(resolve))
  }
}

export const config = {
  name: "sync-products",
  schedule: "0 0 * * *", // Run at midnight every day
}
