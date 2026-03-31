import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk";
import {
  deleteBrandStep,
  dismissBrandProductLinksStep,
} from "../steps";

export const deleteBrandWorkflow = createWorkflow(
  "delete-brand",
  function (input: { id: string }) {
    dismissBrandProductLinksStep(input.id);
    deleteBrandStep(input.id);

    return new WorkflowResponse(undefined);
  }
);
