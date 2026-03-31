import { Button, Drawer, Input, Label, Text } from "@medusajs/ui";
import { useEffect, useState } from "react";
import { AdminUpdateBrand, QueryBrand } from "../../../../types";

type BrandFormProps = {
  brand?: Pick<QueryBrand, "name">;
  handleSubmit: (data: AdminUpdateBrand) => Promise<void>;
  loading: boolean;
  error: Error | null;
};

export const BrandForm = ({
  brand,
  handleSubmit,
  loading,
  error,
}: BrandFormProps) => {
  const [formData, setFormData] = useState<AdminUpdateBrand>({
    name: brand?.name ?? "",
  });

  useEffect(() => {
    setFormData({
      name: brand?.name ?? "",
    });
  }, [brand?.name]);

  return (
    <form>
      <Drawer.Body className="p-4">
        <div className="flex flex-col gap-y-2">
          <Label htmlFor="brand-name">Brand Name</Label>
          <Input
            id="brand-name"
            value={formData.name}
            placeholder="Acme"
            onChange={(event) =>
              setFormData({ name: event.target.value })
            }
          />
          {error ? (
            <Text size="small" className="text-ui-fg-error">
              {error.message}
            </Text>
          ) : null}
        </div>
      </Drawer.Body>
      <Drawer.Footer>
        <Drawer.Close asChild>
          <Button
            type="button"
            variant="secondary"
            size="small"
            disabled={loading}
          >
            Cancel
          </Button>
        </Drawer.Close>
        <Button
          type="button"
          size="small"
          isLoading={loading}
          disabled={loading}
          onClick={async () => await handleSubmit(formData)}
        >
          Save
        </Button>
      </Drawer.Footer>
    </form>
  );
};
