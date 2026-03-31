import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { HttpTypes } from "@medusajs/framework/types";
import { DetailWidgetProps } from "@medusajs/framework/types";
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  Container,
  Drawer,
  Select,
  Text,
  toast,
} from "@medusajs/ui";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useBrands, useSetProductBrand } from "../hooks/api";
import { sdk } from "../lib/client";
import { AdminProductWithBrandResponse } from "../hooks/api/brands";

const NO_BRAND_VALUE = "__none__";

type ProductBrandEditDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productTitle: string;
  currentBrandId: string | null;
};

const ProductBrandEditDrawer = ({
  open,
  onOpenChange,
  productId,
  productTitle,
  currentBrandId,
}: ProductBrandEditDrawerProps) => {
  const [selectedBrandId, setSelectedBrandId] = useState(
    currentBrandId ?? NO_BRAND_VALUE
  );

  const { data: brandsData, isPending: isBrandsPending } = useBrands(
    {
      limit: 100,
      offset: 0,
      fields: "id,name",
    },
    {
      enabled: open,
    }
  );

  const { mutateAsync, isPending: isSaving } = useSetProductBrand(productId);

  useEffect(() => {
    if (open) {
      setSelectedBrandId(currentBrandId ?? NO_BRAND_VALUE);
    }
  }, [currentBrandId, open]);

  const handleSubmit = async () => {
    const nextBrandId =
      selectedBrandId === NO_BRAND_VALUE ? null : selectedBrandId;

    try {
      await mutateAsync(nextBrandId, {
        onSuccess: ({ product }) => {
          toast.success(
            product.brand
              ? `Brand ${product.brand.name} linked to ${product.title}`
              : `Brand removed from ${product.title}`
          );
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(error.message || "Failed to update product brand");
        },
      });
    } catch {
      // Error feedback is handled in the mutation callback above.
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Edit Brand</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="flex flex-1 flex-col gap-y-4 p-4">
          <div className="flex flex-col gap-y-1">
            <Text size="small" leading="compact" weight="plus">
              Product
            </Text>
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              {productTitle}
            </Text>
          </div>

          <div className="flex flex-col gap-y-2">
            <Text size="small" leading="compact" weight="plus">
              Brand
            </Text>
            {isBrandsPending ? (
              <Text
                size="small"
                leading="compact"
                className="text-ui-fg-subtle"
              >
                Loading brands...
              </Text>
            ) : (
              <Select
                value={selectedBrandId}
                onValueChange={setSelectedBrandId}
                disabled={isSaving}
              >
                <Select.Trigger>
                  <Select.Value placeholder="Select a brand" />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value={NO_BRAND_VALUE}>
                    No brand
                  </Select.Item>
                  {brandsData?.brands.map((brand) => (
                    <Select.Item key={brand.id} value={brand.id}>
                      {brand.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            )}
          </div>

          {!isBrandsPending && !brandsData?.brands.length ? (
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              No brands available yet. Create one from the Brands page first.
            </Text>
          ) : null}
        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button variant="secondary" size="small" disabled={isSaving}>
              Cancel
            </Button>
          </Drawer.Close>
          <Button
            size="small"
            onClick={handleSubmit}
            isLoading={isSaving}
            disabled={isSaving || isBrandsPending}
          >
            Save
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  );
};

const ProductBrandWidget = ({
  data: product,
}: DetailWidgetProps<HttpTypes.AdminProduct>) => {
  const [open, setOpen] = useState(false);

  const { data, isPending } = useQuery({
    queryKey: ["product-brand-widget", product.id],
    queryFn: () =>
      sdk.admin.product.retrieve(product.id, {
        fields: "+brand.*",
      }) as Promise<AdminProductWithBrandResponse>,
  });

  const brand = data?.product.brand;

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Brand
        </Text>
        <div className="flex items-center gap-x-2">
          <Button size="small" variant="secondary" onClick={() => setOpen(true)}>
            Edit
          </Button>
          <Button asChild size="small" variant="secondary">
            <Link to="/brands">View Brands</Link>
          </Button>
        </div>
      </div>

      <div className="px-6 py-4">
        {isPending ? (
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-ui-fg-subtle animate-pulse" />
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              Loading brand...
            </Text>
          </div>
        ) : brand ? (
          <div className="flex flex-col gap-y-1">
            <Text size="small" leading="compact" weight="plus">
              {brand.name}
            </Text>
            <Text size="small" leading="compact" className="text-ui-fg-subtle">
              Brand ID: {brand.id}
            </Text>
          </div>
        ) : (
          <Text size="small" leading="compact" className="text-ui-fg-subtle">
            No brand linked to this product yet.
          </Text>
        )}
      </div>
      <ProductBrandEditDrawer
        open={open}
        onOpenChange={setOpen}
        productId={product.id}
        productTitle={product.title}
        currentBrandId={brand?.id ?? null}
      />
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.after",
});

export default ProductBrandWidget;
