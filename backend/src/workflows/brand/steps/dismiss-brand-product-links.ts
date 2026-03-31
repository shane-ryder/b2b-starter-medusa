import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";
import { BRAND_MODULE } from "../../../modules/brand";

type BrandProductLink = Record<string, Record<string, string>>;

export const dismissBrandProductLinksStep = createStep(
  "dismiss-brand-product-links",
  async (brandId: string, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY);
    const link = container.resolve(ContainerRegistrationKeys.LINK);

    const {
      data: [brand],
    } = await query.graph(
      {
        entity: "brand",
        fields: ["id", "products.id"],
        filters: { id: brandId },
      },
      { throwIfKeyNotFound: true }
    );

    const links: BrandProductLink[] =
      brand.products?.map((product: { id: string }) => ({
        [Modules.PRODUCT]: {
          product_id: product.id,
        },
        [BRAND_MODULE]: {
          brand_id: brandId,
        },
      })) ?? [];

    await Promise.all(links.map((linkData) => link.dismiss(linkData)));

    return new StepResponse(undefined, links);
  },
  async (links: BrandProductLink[] | undefined, { container }) => {
    if (!links?.length) {
      return;
    }

    const link = container.resolve(ContainerRegistrationKeys.LINK);

    await Promise.all(links.map((linkData) => link.create(linkData)));
  }
);
