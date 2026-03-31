import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Tag } from "@medusajs/icons";
import { Container, Heading, Toaster } from "@medusajs/ui";
import { BrandCreateModal } from "./components/brand-create-modal";
import { BrandsTable } from "./components/brands-table";

const BrandsPage = () => {
  return (
    <>
      <Container className="flex flex-col p-0 overflow-hidden">
        <div className="flex items-center justify-between p-6 pb-0">
          <Heading className="font-sans font-medium h1-core">Brands</Heading>
          <BrandCreateModal />
        </div>

        <BrandsTable />
      </Container>
      <Toaster />
    </>
  );
};

export const config = defineRouteConfig({
  label: "Brands",
  icon: Tag,
});

export default BrandsPage;
