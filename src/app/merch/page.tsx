import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { getProducts } from "@/lib/wordpress";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Merch · Hochi Runs",
  description: "Hochi Runs merch.",
};

export default async function MerchPage() {
  const products = await getProducts();
  return (
    <div className="mx-auto max-w-5xl px-5 pb-28 pt-24 sm:px-8 sm:pb-32 sm:pt-28">
      <PageHeading title="Shop" />

      <ul className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
        {products.map((product) => {
          const card = (
            <div className="group flex h-full flex-col">
              <div className="flex aspect-square items-center justify-center bg-surface text-xs uppercase tracking-widest text-muted">
                {product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-contain transition-opacity group-hover:opacity-90"
                  />
                ) : (
                  <span>{product.name}</span>
                )}
              </div>
              <div className="reading-surface mt-3">
                <p className="text-sm group-hover:underline">{product.name}</p>
                <p className="text-sm text-muted">{product.price}</p>
              </div>
            </div>
          );
          return (
            <li key={product.name}>
              {product.buyUrl ? (
                <a
                  href={product.buyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  {card}
                </a>
              ) : (
                card
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
