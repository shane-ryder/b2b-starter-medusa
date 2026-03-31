import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  createBrandStep,
  CreateBrandStepInput,
  validateBrandNameStep,
} from "../steps";

export type CreateBrandWorkflowInput = CreateBrandStepInput;

export const createBrandWorkflow = createWorkflow(
  "create-brand",
  function (input: CreateBrandWorkflowInput) {
    const validatedInput = validateBrandNameStep(input);
    const brand = createBrandStep(validatedInput);

    return new WorkflowResponse(brand);
  }
);
