import { model } from "@medusajs/framework/utils";

export const Brand = model.define("brand", {
  id: model
    .id({
      prefix: "brd",
    })
    .primaryKey(),
  name: model.text(),
});
