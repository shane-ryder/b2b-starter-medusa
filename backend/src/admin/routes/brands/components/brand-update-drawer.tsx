import { Drawer, toast } from "@medusajs/ui";
import { QueryBrand } from "../../../../types";
import { useUpdateBrand } from "../../../hooks/api";
import { BrandForm } from "./brand-form";

type BrandUpdateDrawerProps = {
  brand: QueryBrand;
  open: boolean;
  setOpen: (open: boolean) => void;
};

export const BrandUpdateDrawer = ({
  brand,
  open,
  setOpen,
}: BrandUpdateDrawerProps) => {
  const { mutateAsync, isPending, error } = useUpdateBrand(brand.id);

  const handleSubmit = async ({ name }: { name: string }) => {
    await mutateAsync(
      { name },
      {
        onSuccess: ({ brand: updatedBrand }) => {
          setOpen(false);
          toast.success(`Brand ${updatedBrand.name} updated successfully`);
        },
        onError: (updateError) => {
          toast.error(updateError.message || "Failed to update brand");
        },
      }
    );
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Edit Brand</Drawer.Title>
        </Drawer.Header>
        <BrandForm
          brand={brand}
          handleSubmit={handleSubmit}
          loading={isPending}
          error={error}
        />
      </Drawer.Content>
    </Drawer>
  );
};
