import { StoreProductWithBrand } from "@/types"
import { Heading, Text } from "@medusajs/ui"

type ProductInfoProps = {
  product: StoreProductWithBrand
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  return (
    <div id="product-info">
      <div className="flex flex-col gap-y-4 w-full">
        {product.brand?.name ? (
          <div className="flex flex-col gap-y-1">
            <Text className="text-sm uppercase tracking-[0.2em] text-ui-fg-subtle">
              Brand
            </Text>
            <Text className="text-base text-ui-fg-base" data-testid="product-brand">
              {product.brand.name}
            </Text>
          </div>
        ) : null}
        <Heading
          level="h1"
          className="text-[2.5rem] leading-10 text-ui-fg-base"
          data-testid="product-title"
        >
          {product.title}
        </Heading>

        <Text
          className="text-2xl text-ui-fg-subtle whitespace-pre-line"
          data-testid="product-description"
        >
          {product.subtitle}
        </Text>
      </div>
    </div>
  )
}

export default ProductInfo
