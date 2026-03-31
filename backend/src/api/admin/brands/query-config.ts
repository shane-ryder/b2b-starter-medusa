export const adminBrandFields = [
  "id",
  "name",
  "created_at",
  "updated_at",
  "products.id",
  "products.title",
];

export const adminBrandQueryConfig = {
  list: {
    defaults: adminBrandFields,
    isList: true,
  },
  retrieve: {
    defaults: adminBrandFields,
    isList: false,
  },
};
