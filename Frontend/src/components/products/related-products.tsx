import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { RelatedProduct } from "@/types/product";

export function RelatedProducts({ products }: { products: RelatedProduct[] }) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl border-t border-border px-4 py-12 sm:px-6">
      <h2 className="mb-8 font-heading text-xl text-foreground">You might also like</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {products.map((product) => (
          <Link key={product._id} href={`/menu/${product.slug}`} className="group">
            <div className="relative mb-3 aspect-3/4 overflow-hidden bg-muted">
              {product.images[0] && (
                <Image
                  src={product.images[0]}
                  alt={product.name}
                  fill
                  loading="eager"
                  className="object-cover transition-opacity group-hover:opacity-80"
                  sizes="(min-width: 768px) 25vw, 50vw"
                />
              )}
            </div>
            <p className="text-sm text-foreground">{product.name}</p>
            <p className="text-sm text-muted-foreground">{formatPrice(product.discountPrice ?? product.price)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
