import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import { DateCell } from "../../../../../admin/components/common/table/table-cells/date-cell";
import {
  TextCell,
  TextHeader,
} from "../../../../../admin/components/common/table/table-cells/text-cell";
import { QueryBrand } from "../../../../../types";
import { BrandActionsMenu } from "../brand-actions-menu";

const columnHelper = createColumnHelper<QueryBrand>();

export const useBrandsTableColumns = () => {
  return useMemo(
    () => [
      columnHelper.accessor("name", {
        header: () => <TextHeader text="Brand" />,
        cell: ({ getValue }) => <TextCell text={getValue()} maxWidth={260} />,
      }),
      columnHelper.accessor((brand) => brand.products?.length ?? 0, {
        id: "products_count",
        header: () => <TextHeader text="Linked Products" />,
        cell: ({ getValue }) => <TextCell text={getValue()} />,
      }),
      columnHelper.accessor(
        (brand) =>
          brand.products?.length
            ? brand.products.map((product) => product.title).join(", ")
            : undefined,
        {
          id: "products_preview",
          header: () => <TextHeader text="Products Preview" />,
          cell: ({ getValue }) => <TextCell text={getValue()} maxWidth={360} />,
        }
      ),
      columnHelper.accessor("updated_at", {
        header: () => <TextHeader text="Updated" />,
        cell: ({ getValue }) => <DateCell date={getValue()} />,
      }),
      columnHelper.display({
        id: "actions",
        header: () => <TextHeader text="Actions" />,
        cell: ({ row }) => <BrandActionsMenu brand={row.original} />,
      }),
    ],
    []
  );
};
