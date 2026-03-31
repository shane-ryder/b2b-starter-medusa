import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { BRAND_MODULE } from "../../../modules/brand";
import BrandModuleService from "../../../modules/brand/service";

export const deleteBrandStep = createStep(
  "delete-brand",
  async (brandId: string, { container }) => {
    const brandModuleService =
      container.resolve<BrandModuleService>(BRAND_MODULE);

    await brandModuleService.softDeleteBrands([brandId]);

    return new StepResponse(undefined, [brandId]);
  },
  async (brandIds: string[] | undefined, { container }) => {
    if (!brandIds?.length) {
      return;
    }

    const brandModuleService =
      container.resolve<BrandModuleService>(BRAND_MODULE);

    await brandModuleService.restoreBrands(brandIds);
  }
);
