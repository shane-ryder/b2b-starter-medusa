import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  deleteBrandWorkflow,
  updateBrandWorkflow,
} from "../../../../workflows/brand/workflows";
import {
  AdminGetBrandParamsType,
  AdminUpdateBrandType,
} from "../validators";

export const GET = async (
  req: AuthenticatedMedusaRequest<AdminGetBrandParamsType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { id } = req.params;

  const {
    data: [brand],
  } = await query.graph(
    {
      entity: "brand",
      fields: req.queryConfig.fields,
      filters: { id },
    },
    { throwIfKeyNotFound: true }
  );

  res.json({ brand });
};

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateBrandType>,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const { id } = req.params;

  await updateBrandWorkflow.run({
    input: {
      id,
      ...req.validatedBody,
    },
    container: req.scope,
  });

  const {
    data: [brand],
  } = await query.graph(
    {
      entity: "brand",
      fields: req.queryConfig.fields,
      filters: { id },
    },
    { throwIfKeyNotFound: true }
  );

  res.json({ brand });
};

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params;

  await deleteBrandWorkflow.run({
    input: {
      id,
    },
    container: req.scope,
  });

  res.status(200).json({
    id,
    object: "brand",
    deleted: true,
  });
};
