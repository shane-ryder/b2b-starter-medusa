import { PencilSquare, Trash } from "@medusajs/icons";
import { toast } from "@medusajs/ui";
import { useState } from "react";
import { ActionMenu, DeletePrompt } from "../../../components/common";
import { useDeleteBrand } from "../../../hooks/api";
import { QueryBrand } from "../../../../types";
import { BrandUpdateDrawer } from "./brand-update-drawer";

type BrandActionsMenuProps = {
  brand: QueryBrand;
};

export const BrandActionsMenu = ({ brand }: BrandActionsMenuProps) => {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { mutateAsync, isPending } = useDeleteBrand(brand.id);

  const handleDelete = () => {
    mutateAsync(undefined, {
      onSuccess: () => {
        toast.success(`Brand ${brand.name} deleted successfully`);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to delete brand");
      },
    });
  };

  return (
    <>
      <ActionMenu
        groups={[
          {
            actions: [
              {
                icon: <PencilSquare />,
                label: "Edit brand",
                onClick: () => setEditOpen(true),
              },
            ],
          },
          {
            actions: [
              {
                icon: <Trash />,
                label: "Delete",
                onClick: () => setDeleteOpen(true),
              },
            ],
          },
        ]}
      />

      <BrandUpdateDrawer brand={brand} open={editOpen} setOpen={setEditOpen} />
      <DeletePrompt
        handleDelete={handleDelete}
        loading={isPending}
        open={deleteOpen}
        setOpen={setDeleteOpen}
      />
    </>
  );
};
