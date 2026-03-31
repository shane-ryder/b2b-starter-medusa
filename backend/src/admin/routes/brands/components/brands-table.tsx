import { DataTable } from "../../../../admin/components";
import { useDataTable } from "../../../../admin/hooks";
import { useBrands } from "../../../../admin/hooks/api";
import { useBrandsTableColumns } from "./table/columns";
import { useBrandsTableQuery } from "./table/query";

const PAGE_SIZE = 50;

export const BrandsTable = () => {
  const { searchParams, raw } = useBrandsTableQuery({
    pageSize: PAGE_SIZE,
  });

  const { data, isPending } = useBrands({
    ...searchParams,
  });

  const columns = useBrandsTableColumns();

  const { table } = useDataTable({
    data: data?.brands,
    columns,
    enablePagination: true,
    count: data?.count,
    pageSize: PAGE_SIZE,
  });

  return (
    <div className="flex size-full flex-col overflow-hidden">
      <DataTable
        columns={columns}
        table={table}
        pagination
        count={data?.count}
        isLoading={isPending}
        pageSize={PAGE_SIZE}
        orderBy={["name", "updated_at"]}
        queryObject={raw}
        noRecords={{
          title: "No brands found",
          message: "Create a brand from the button above to see it here.",
        }}
      />
    </div>
  );
};
