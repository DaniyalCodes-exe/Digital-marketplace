export type ProductType =
  | "course"
  | "source-code"
  | "ebook"
  | "ui-kit"
  | "templete"
  | "ai-prompt"
  | "software"
  | "other";

export interface PublicProduct {
  _id: string;
  tittle: string;
  slug: string;
  description: string;
  type: ProductType;
  price: number;
  totalSales: number;
  totalRevenue: number;
  createdAt: string;
}

export interface PublicPartner {
  _id: string;
  name: string;
  profilePicture?: string | null;
  partnerProfile: {
    slug: string | null;
    bio?: string;
    website?: string;
    socialLink?: {
      youtube?: string;
      instagram?: string;
      linkedin?: string;
      github?: string;
    };
  };
  totalSales: number;
  totalRevenue: number;
}

type PublicProductsResponse = {
  success: boolean;
  message?: string;
  products?: PublicProduct[];
};

type PublicPartnersResponse = {
  success: boolean;
  message?: string;
  partners?: PublicPartner[];
};

type PublicProductResponse = {
  success: boolean;
  message?: string;
  product?: PublicProduct;
};

function backendUrl() {
  const url = import.meta.env.VITE_BACKEND_URL?.trim().replace(/\/+$/, "");
  if (!url) throw new Error("Store is not configured yet.");
  return url;
}

async function readJson<T>(response: Response): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    throw new Error("The server returned an unreadable response.");
  }
}

export async function getPublishedProducts() {
  const response = await fetch(`${backendUrl()}/api/public-product/all`, {
    cache: "no-store",
  });
  const result = await readJson<PublicProductsResponse>(response);
  if (!response.ok || !result.success || !Array.isArray(result.products)) {
    throw new Error(result.message || "Could not load products right now.");
  }
  return result.products;
}

export async function getPublicProductsByPartner(partnerId: string) {
  const response = await fetch(
    `${backendUrl()}/api/public-product/partner/${encodeURIComponent(partnerId)}`,
    { cache: "no-store" },
  );
  const result = await readJson<PublicProductsResponse>(response);
  if (!response.ok || !result.success || !Array.isArray(result.products)) {
    throw new Error(result.message || "Could not load this creator's products.");
  }
  return result.products;
}

export async function getPublicPartners() {
  const response = await fetch(`${backendUrl()}/api/partner/all`, {
    cache: "no-store",
  });
  const result = await readJson<PublicPartnersResponse>(response);
  if (!response.ok || !result.success || !Array.isArray(result.partners)) {
    throw new Error(result.message || "Could not load creators right now.");
  }
  return result.partners;
}

export async function getPublishedProduct(slug: string) {
  const response = await fetch(
    `${backendUrl()}/api/public-product/${encodeURIComponent(slug)}`,
    { cache: "no-store" },
  );
  const result = await readJson<PublicProductResponse>(response);
  if (!response.ok || !result.success || !result.product) {
    throw new Error(result.message || "This product is unavailable.");
  }
  return result.product;
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

export function productTypeLabel(type: ProductType) {
  return (
    {
      course: "Course",
      "source-code": "Source code",
      ebook: "Ebook",
      "ui-kit": "UI kit",
      templete: "Template",
      "ai-prompt": "AI prompt",
      software: "Software",
      other: "Digital product",
    }[type] || "Digital product"
  );
}
