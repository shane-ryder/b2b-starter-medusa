import { MedusaError } from "@medusajs/framework/utils";
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { BRAND_MODULE } from "../../../modules/brand";
import BrandModuleService from "../../../modules/brand/service";

export type ValidateBrandNameStepInput = {
  name: string;
  id?: string;
};

export const validateBrandNameStep = createStep(
  "validate-brand-name",
  async (input: ValidateBrandNameStepInput, { container }) => {
    const brandModuleService =
      container.resolve<BrandModuleService>(BRAND_MODULE);

    const normalizedName = input.name.trim();
    const existingBrands = await brandModuleService.listBrands({
      name: normalizedName,
    });

    if (existingBrands.some((brand) => brand.id !== input.id)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Brand "${normalizedName}" already exists`
      );
    }

    return new StepResponse({
      ...input,
      name: normalizedName,
    });
  }
);
