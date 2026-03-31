import { useState } from "react";
import { Button, FocusModal, Input, Label, Text, toast } from "@medusajs/ui";
import { AdminCreateBrand } from "../../../../types";
import { useCreateBrand } from "../../../hooks/api";

const initialFormState: AdminCreateBrand = {
  name: "",
};

export const BrandCreateModal = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<AdminCreateBrand>(initialFormState);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { mutateAsync, isPending } = useCreateBrand();

  const handleSubmit = async () => {
    const normalizedName = formData.name.trim();

    if (!normalizedName) {
      setErrorMessage("Brand name is required");
      return;
    }

    try {
      await mutateAsync(
        { name: normalizedName },
        {
          onSuccess: ({ brand }) => {
            toast.success(`Brand ${brand.name} created successfully`);
            setFormData(initialFormState);
            setErrorMessage(null);
            setOpen(false);
          },
          onError: (error) => {
            toast.error(error.message || "Failed to create brand");
          },
        }
      );
    } catch {
      // Error feedback is surfaced through the mutation callback above.
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      setFormData(initialFormState);
      setErrorMessage(null);
    }
  };

  return (
    <FocusModal open={open} onOpenChange={handleOpenChange}>
      <FocusModal.Trigger asChild>
        <Button size="small">Create Brand</Button>
      </FocusModal.Trigger>
      <FocusModal.Content>
        <div className="flex h-full flex-col overflow-hidden">
          <FocusModal.Header>
            <div className="flex items-center justify-end gap-x-2">
              <FocusModal.Close asChild>
                <Button
                  size="small"
                  variant="secondary"
                  disabled={isPending}
                >
                  Cancel
                </Button>
              </FocusModal.Close>
              <Button
                size="small"
                onClick={handleSubmit}
                isLoading={isPending}
                disabled={isPending}
              >
                Save
              </Button>
            </div>
          </FocusModal.Header>

          <FocusModal.Body className="flex-1 overflow-auto">
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-y-6 px-6 py-4">
              <div className="flex flex-col gap-y-2">
                <Text size="small" leading="compact" weight="plus">
                  Create Brand
                </Text>
                <Text
                  size="small"
                  leading="compact"
                  className="text-ui-fg-subtle"
                >
                  Add a brand so it can be linked to products in Admin.
                </Text>
              </div>

              <div className="flex flex-col gap-y-2">
                <Label htmlFor="brand-name">Brand Name</Label>
                <Input
                  id="brand-name"
                  value={formData.name}
                  placeholder="Acme"
                  onChange={(event) => {
                    setFormData({ name: event.target.value });
                    setErrorMessage(null);
                  }}
                  autoFocus
                />
                {errorMessage ? (
                  <Text size="small" className="text-ui-fg-error">
                    {errorMessage}
                  </Text>
                ) : null}
              </div>
            </div>
          </FocusModal.Body>
        </div>
      </FocusModal.Content>
    </FocusModal>
  );
};
