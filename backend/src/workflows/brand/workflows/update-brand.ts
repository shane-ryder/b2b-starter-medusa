import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  updateBrandStep,
  UpdateBrandStepInput,
  validateBrandNameStep,
} from "../steps";

export const updateBrandWorkflow = createWorkflow(
  "update-brand",
  function (input: UpdateBrandStepInput) {
    const validatedInput = validateBrandNameStep(input);
    const brand = updateBrandStep(validatedInput);

    return new WorkflowResponse(brand);
  }
);
