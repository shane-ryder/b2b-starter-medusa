import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { BRAND_MODULE } from "../../../modules/brand";
import BrandModuleService from "../../../modules/brand/service";

export type UpdateBrandStepInput = {
  id: string;
  name: string;
};

export const updateBrandStep = createStep(
  "update-brand",
  async (input: UpdateBrandStepInput, { container }) => {
    const brandModuleService =
      container.resolve<BrandModuleService>(BRAND_MODULE);

    const previousBrand = await brandModuleService.retrieveBrand(input.id);
    const updatedBrand = await brandModuleService.updateBrands(input);

    return new StepResponse(updatedBrand, {
      id: previousBrand.id,
      name: previousBrand.name,
    });
  },
  async (previousBrand: UpdateBrandStepInput | undefined, { container }) => {
    if (!previousBrand) {
      return;
    }

    const brandModuleService =
      container.resolve<BrandModuleService>(BRAND_MODULE);

    await brandModuleService.updateBrands(previousBrand);
  }
);
