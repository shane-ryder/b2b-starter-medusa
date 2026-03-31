import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { createBrandWorkflow } from "../../../workflows/brand/workflows";
import { AdminCreateBrandType, AdminGetBrandParamsType } from "./validators";

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetBrandParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { fields, pagination } = req.queryConfig;

  const { data: brands, metadata } = await query.graph({
    entity: "brand",
    fields,
    filters: req.filterableFields,
    pagination,
  });

  res.json({
    brands,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  });
};

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateBrandType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);

  const { result: createdBrand } = await createBrandWorkflow.run({
    input: req.validatedBody,
    container: req.scope,
  });

  const {
    data: [brand],
  } = await query.graph(
    {
      entity: "brand",
      fields: req.queryConfig.fields,
      filters: { id: createdBrand.id },
    },
    { throwIfKeyNotFound: true }
  );

  res.json({ brand });
};
