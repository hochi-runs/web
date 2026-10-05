/**
 * Shop products. This is a *showcase* — there is no checkout wired up in v1
 * (the original site used WooCommerce + Stripe). Each product can point to an
 * external buy URL (e.g. Bandcamp merch) via `buyUrl`. Wire real checkout
 * (Stripe/Shopify) later if desired.
 */

export type Product = {
  name: string;
  /** display price, e.g. "$47.28 – $53.90" */
  price: string;
  /** optional image under /public, e.g. "/merch/hoodie.jpg" */
  image?: string;
  /** optional external purchase link */
  buyUrl?: string;
};

export const products: Product[] = [
  {
    name: "Hochi Runs — Limited T-Shirt",
    price: "Limited event release",
    image: "/merch/hochi-runs-limited-shirt-2026.jpg",
  },
  { name: "Hochi Hoodie", price: "$47.28 – $53.90" },
  { name: "Unisex Softstyle T-Shirt", price: "$17.28 – $25.53" },
  { name: "Hochi Runs Stickers", price: "$1.81 – $2.91" },
];
