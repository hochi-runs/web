import type { Metadata } from "next";
import { PageHeading } from "@/components/page-heading";
import { products } from "@/data/merch";

export const metadata: Metadata = {
  title: "Merch · Hochi Runs",
  description: "Hochi Runs merch.",
};

export default function MerchPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-14">
      <PageHeading title="Merch" />

      <p className="mb-8 rounded border border-red/40 bg-red/5 px-4 py-3 text-sm text-muted">
        Checkout isn&apos;t connected yet — this is a preview of the merch.
        We&apos;ll wire up real purchasing (Stripe, Shopify, or Bandcamp links)
        in a later pass.
      </p>

      <ul className="grid grid-cols-2 gap-6 sm:grid-cols-3">
        {products.map((product) => {
          const card = (
            <div className="flex h-full flex-col">
              <div className="flex aspect-square items-center justify-center rounded border border-yellow/10 bg-white/5 text-xs text-muted">
                {product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full rounded object-cover"
                  />
                ) : (
                  <span>Image coming soon</span>
                )}
              </div>
              <div className="mt-3">
                <p className="font-semibold text-yellow">{product.name}</p>
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
                  className="block text-yellow! hover:text-yellow!"
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
