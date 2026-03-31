import { FetchError } from "@medusajs/js-sdk";
import { HttpTypes } from "@medusajs/framework/types";
import {
  AdminBrandResponse,
  AdminBrandsResponse,
  AdminCreateBrand,
  AdminUpdateBrand,
  QueryBrand,
} from "../../../types";
import {
  QueryKey,
  useMutation,
  UseMutationOptions,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { queryKeysFactory } from "../../lib/query-key-factory";
import { sdk } from "../../lib/client";

export const brandQueryKey = queryKeysFactory("brand");

export type AdminProductWithBrandResponse = {
  product: HttpTypes.AdminProduct & {
    brand?: QueryBrand | null;
  };
};

export const useBrands = (
  query?: Record<string, any>,
  options?: Omit<
    UseQueryOptions<
      AdminBrandsResponse,
      FetchError,
      AdminBrandsResponse,
      QueryKey
    >,
    "queryKey" | "queryFn"
  >
) => {
  const filterQuery = new URLSearchParams(query).toString();

  const fetchBrands = async () =>
    sdk.client.fetch<AdminBrandsResponse>(
      `/admin/brands${filterQuery ? `?${filterQuery}` : ""}`,
      {
        method: "GET",
      }
    );

  return useQuery({
    queryKey: brandQueryKey.list(query),
    queryFn: fetchBrands,
    ...options,
  });
};

export const useCreateBrand = (
  options?: UseMutationOptions<AdminBrandResponse, FetchError, AdminCreateBrand>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (brand: AdminCreateBrand) =>
      sdk.client.fetch<AdminBrandResponse>("/admin/brands", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: brand,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: brandQueryKey.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: brandQueryKey.detail(data.brand.id),
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useSetProductBrand = (
  productId: string,
  options?: UseMutationOptions<
    AdminProductWithBrandResponse,
    FetchError,
    string | null
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (brandId: string | null) =>
      sdk.client.fetch<AdminProductWithBrandResponse>(
        `/admin/products/${productId}/brand`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: {
            brand_id: brandId,
          },
        }
      ),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: brandQueryKey.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: ["product-brand-widget", productId],
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useUpdateBrand = (
  brandId: string,
  options?: UseMutationOptions<AdminBrandResponse, FetchError, AdminUpdateBrand>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (brand: AdminUpdateBrand) =>
      sdk.client.fetch<AdminBrandResponse>(`/admin/brands/${brandId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: brand,
      }),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: brandQueryKey.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: brandQueryKey.detail(brandId),
      });
      queryClient.invalidateQueries({
        queryKey: ["product-brand-widget"],
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};

export const useDeleteBrand = (
  brandId: string,
  options?: UseMutationOptions<
    { id: string; object: string; deleted: boolean },
    FetchError,
    void
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      sdk.client.fetch<{ id: string; object: string; deleted: boolean }>(
        `/admin/brands/${brandId}`,
        {
          method: "DELETE",
        }
      ),
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: brandQueryKey.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: ["product-brand-widget"],
      });
      options?.onSuccess?.(data, variables, context);
    },
    ...options,
  });
};
