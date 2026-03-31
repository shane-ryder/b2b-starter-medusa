import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils";
import { BRAND_MODULE } from "../../../../../modules/brand";
import BrandModuleService from "../../../../../modules/brand/service";
import { AdminSetProductBrandType } from "../../validators";

type ProductWithBrand = {
  id: string;
  title: string;
  brand?: {
    id: string;
    name: string;
  } | null;
};

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminSetProductBrandType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const link = req.scope.resolve(ContainerRegistrationKeys.LINK);
  const brandModuleService =
    req.scope.resolve<BrandModuleService>(BRAND_MODULE);

  const { id: productId } = req.params;
  const nextBrandId = req.validatedBody.brand_id ?? null;

  const {
    data: [existingProduct],
  } = await query.graph(
    {
      entity: "product",
      fields: ["id", "title", "brand.id"],
      filters: { id: productId },
    },
    { throwIfKeyNotFound: true }
  );

  const currentBrandId = (existingProduct as ProductWithBrand).brand?.id ?? null;

  if (nextBrandId && nextBrandId !== currentBrandId) {
    await brandModuleService.retrieveBrand(nextBrandId);
  }

  if (currentBrandId && currentBrandId !== nextBrandId) {
    await link.dismiss({
      [Modules.PRODUCT]: {
        product_id: productId,
      },
      [BRAND_MODULE]: {
        brand_id: currentBrandId,
      },
    });
  }

  if (nextBrandId && nextBrandId !== currentBrandId) {
    await link.create({
      [Modules.PRODUCT]: {
        product_id: productId,
      },
      [BRAND_MODULE]: {
        brand_id: nextBrandId,
      },
    });
  }

  const {
    data: [product],
  } = await query.graph(
    {
      entity: "product",
      fields: ["id", "title", "brand.*"],
      filters: { id: productId },
    },
    { throwIfKeyNotFound: true }
  );

  res.json({ product });
};
