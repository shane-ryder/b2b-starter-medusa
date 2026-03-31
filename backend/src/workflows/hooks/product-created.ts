import { createProductsWorkflow } from "@medusajs/medusa/core-flows";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";
import { StepResponse } from "@medusajs/framework/workflows-sdk";
import { BRAND_MODULE } from "../../modules/brand";
import BrandModuleService from "../../modules/brand/service";

type ProductBrandLink = Record<string, Record<string, string>>;

createProductsWorkflow.hooks.productsCreated(
  async ({ products, additional_data }, { container }) => {
    const brandId = additional_data?.brand_id as string | undefined;

    if (!brandId) {
      return new StepResponse(undefined, []);
    }

    const brandModuleService =
      container.resolve<BrandModuleService>(BRAND_MODULE);

    await brandModuleService.retrieveBrand(brandId);

    const link = container.resolve(ContainerRegistrationKeys.LINK);
    const links: ProductBrandLink[] = products.map((product) => ({
      [Modules.PRODUCT]: {
        product_id: product.id,
      },
      [BRAND_MODULE]: {
        brand_id: brandId,
      },
    }));

    await Promise.all(links.map((linkData) => link.create(linkData)));

    return new StepResponse(undefined, links);
  },
  async (links: ProductBrandLink[], { container }) => {
    if (!links?.length) {
      return;
    }

    const link = container.resolve(ContainerRegistrationKeys.LINK);

    await Promise.all(links.map((linkData) => link.dismiss(linkData)));
  }
);
