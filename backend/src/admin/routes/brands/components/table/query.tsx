import { useQueryParams } from "../../../../hooks/use-query-params";

export const useBrandsTableQuery = ({
  pageSize = 50,
  prefix,
}: {
  pageSize?: number;
  prefix?: string;
}) => {
  const raw = useQueryParams(["offset"], prefix);

  const { offset } = raw;

  const searchParams = {
    limit: pageSize,
    offset: offset ? Number(offset) : 0,
    fields: "id,name,created_at,updated_at,products.id,products.title",
  };

  return { searchParams, raw };
};
