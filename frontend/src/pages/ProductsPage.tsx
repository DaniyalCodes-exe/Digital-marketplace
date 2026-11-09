import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  BookOpen,
  ChevronDown,
  Filter,
  LayoutDashboard,
  ExternalLink,
  Pencil,
  Plus,
  Search,
  Share2,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import AccountHeader from "@/components/AccountHeader";
import { useGetCurrentUser } from "@/hooks/useGetCurrentUser";
import type { CurrentUser } from "@/redux/userslice";

type ProductType =
  | "course"
  | "source-code"
  | "ebook"
  | "ui-kit"
  | "templete"
  | "ai-prompt"
  | "software"
  | "other";

interface ProductRow {
  _id: string;
  partnerID: string;
  tittle: string;
  slug: string;
  description: string;
  type: ProductType;
  price: number;
  status: "draft" | "published";
  links?: Array<{ title?: string; tittle?: string; url: string }>;
  totalSales: number;
  totalRevenue: number;
  createdAt: string;
}

interface PartnerResponse {
  success: boolean;
  partner?: CurrentUser;
  message?: string;
}

interface ProductResponse {
  success: boolean;
  message?: string;
  Product?: ProductRow;
  product?: ProductRow;
}

interface ProductListResponse {
  success: boolean;
  message?: string;
  products?: ProductRow[];
}

interface ProductDraft {
  title: string;
  slug: string;
  description: string;
  type: ProductType;
  price: string;
  status: "draft" | "published";
  linkTitle: string;
  linkUrl: string;
}

const emptyDraft: ProductDraft = {
  title: "",
  slug: "",
  description: "",
  type: "other",
  price: "0",
  status: "draft",
  linkTitle: "",
  linkUrl: "",
};

const inputClassName =
  "mt-2 w-full rounded-lg border border-[#e2e6eb] bg-white px-3.5 py-2.5 text-sm text-[#27313d] outline-none placeholder:text-[#9aa3ae] focus:border-[#5945e8] focus:ring-2 focus:ring-[#5945e8]/10";
const labelClassName = "block text-sm font-medium text-[#46515e]";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(value);
}

function getNavigationProduct(state: unknown): ProductRow | null {
  if (typeof state !== "object" || state === null || !("createdProduct" in state)) {
    return null;
  }

  const product = state.createdProduct;
  if (
    typeof product !== "object" ||
    product === null ||
    !("_id" in product) ||
    typeof product._id !== "string" ||
    !("tittle" in product) ||
    typeof product.tittle !== "string" ||
    !("slug" in product) ||
    typeof product.slug !== "string" ||
    !("price" in product) ||
    typeof product.price !== "number" ||
    !("status" in product) ||
    (product.status !== "draft" && product.status !== "published")
  ) {
    return null;
  }

  return {
    _id: product._id,
    partnerID:
      "partnerID" in product && typeof product.partnerID === "string"
        ? product.partnerID
        : "",
    tittle: product.tittle,
    slug: product.slug,
    description:
      "description" in product && typeof product.description === "string"
        ? product.description
        : "",
    type:
      "type" in product && typeof product.type === "string"
        ? (product.type as ProductType)
        : "other",
    price: product.price,
    status: product.status,
    totalSales:
      "totalSales" in product && typeof product.totalSales === "number"
        ? product.totalSales
        : 0,
    totalRevenue:
      "totalRevenue" in product && typeof product.totalRevenue === "number"
        ? product.totalRevenue
        : 0,
    createdAt:
      "createdAt" in product && typeof product.createdAt === "string"
        ? product.createdAt
        : new Date().toISOString(),
  };
}

function mergeProducts(products: ProductRow[], product: ProductRow | null) {
  if (!product || products.some((item) => item._id === product._id)) {
    return products;
  }
  return [product, ...products];
}

function ProductsPage() {
  const { currentUser, isLoading, error } = useGetCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const navigationNotice =
    typeof location.state === "object" &&
    location.state !== null &&
    "notice" in location.state &&
    typeof location.state.notice === "string"
      ? location.state.notice
      : null;
  const [visibleNavigationNotice, setVisibleNavigationNotice] = useState(navigationNotice);
  const navigationProduct = useMemo(
    () => getNavigationProduct(location.state),
    [location.state],
  );
  const [partner, setPartner] = useState<CurrentUser | null>(null);
  const [partnerLoading, setPartnerLoading] = useState(false);
  const [partnerError, setPartnerError] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productsRefreshKey, setProductsRefreshKey] = useState(0);
  const [productsActionError, setProductsActionError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdProduct, setCreatedProduct] = useState<ProductRow | null>(null);
  const [copiedProductId, setCopiedProductId] = useState<string | null>(null);

  useEffect(() => {
    if (!visibleNavigationNotice) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setVisibleNavigationNotice(null);
      navigate(location.pathname, { replace: true, state: null });
    }, 4000);
    return () => window.clearTimeout(timeoutId);
  }, [location.pathname, navigate, visibleNavigationNotice]);

  useEffect(() => {
    if (!createdProduct) {
      return;
    }

    const timeoutId = window.setTimeout(() => setCreatedProduct(null), 4000);
    return () => window.clearTimeout(timeoutId);
  }, [createdProduct]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "partner") {
      return;
    }

    const controller = new AbortController();
    const loadPartner = async () => {
      setPartnerLoading(true);
      setPartnerError(null);
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "");
        if (!backendUrl) {
          throw new Error("VITE_BACKEND_URL is not configured.");
        }

        const response = await fetch(`${backendUrl}/api/partner/get`, {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        const result = (await response.json()) as PartnerResponse;
        if (!response.ok || !result.success || !result.partner) {
          throw new Error(result.message || "Could not load your creator profile.");
        }
        setPartner(result.partner);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setPartnerError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load your creator profile.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setPartnerLoading(false);
        }
      }
    };

    void loadPartner();
    return () => controller.abort();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "partner") {
      return;
    }

    const controller = new AbortController();
    const loadProducts = async () => {
      setProductsLoading(true);
      setProductsError(null);
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "");
        if (!backendUrl) {
          throw new Error("VITE_BACKEND_URL is not configured.");
        }

        const response = await fetch(`${backendUrl}/api/product/all`, {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });

        let result: ProductListResponse;
        try {
          result = (await response.json()) as ProductListResponse;
        } catch {
          throw new Error("The server returned an unreadable products response.");
        }

        if (!response.ok || !result.success || !Array.isArray(result.products)) {
          throw new Error(result.message || "Could not load your products.");
        }
        setProducts(mergeProducts(result.products, navigationProduct));
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setProducts((currentProducts) =>
            mergeProducts(currentProducts, navigationProduct),
          );
          setProductsError(
            loadError instanceof Error ? loadError.message : "Could not load your products.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setProductsLoading(false);
        }
      }
    };

    void loadProducts();
    return () => controller.abort();
  }, [currentUser, navigationProduct, productsRefreshKey]);

  const profileComplete = Boolean(partner?.partnerProfile?.slug);
  const visibleProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesSearch = `${product.tittle} ${product.slug}`
          .toLowerCase()
          .includes(search.trim().toLowerCase());
        const matchesStatus = statusFilter === "all" || product.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [products, search, statusFilter],
  );

  const handleSaveProduct = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateError(null);
    if (!profileComplete) {
      setCreateError("Create and save your creator profile before managing products.");
      return;
    }

    const slug = draft.slug.trim().toLowerCase();
    const price = Number(draft.price);
    if (!editingProduct && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setCreateError("Use lowercase letters, numbers, and single hyphens in the product slug.");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      setCreateError("Enter a valid price of 0 or more.");
      return;
    }
    if (
      Boolean(draft.linkTitle.trim()) !== Boolean(draft.linkUrl.trim()) ||
      (draft.linkUrl.trim() &&
        !/^https?:\/\/.+/i.test(draft.linkUrl.trim()))
    ) {
      setCreateError("Add both a link title and a valid http:// or https:// URL, or leave both empty.");
      return;
    }
    setIsCreating(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "");
      if (!backendUrl) {
        throw new Error("VITE_BACKEND_URL is not configured.");
      }

      const productPayload = {
        tittle: draft.title.trim(),
        description: draft.description.trim(),
        type: draft.type,
        price,
        status: draft.status,
        links: draft.linkTitle.trim()
          ? [{ title: draft.linkTitle.trim(), url: draft.linkUrl.trim() }]
          : [],
      };
      if (editingProduct) {
        const response = await fetch(`${backendUrl}/api/product/update`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingProduct._id, ...productPayload }),
        });
        let result: ProductResponse;
        try {
          result = (await response.json()) as ProductResponse;
        } catch {
          throw new Error("The server returned an unreadable product update response.");
        }
        const updatedProduct = result.product;
        if (!response.ok || !result.success || !updatedProduct?._id) {
          throw new Error(result.message || "Could not update the product.");
        }
        setProducts((currentProducts) =>
          currentProducts.map((product) =>
            product._id === updatedProduct._id ? updatedProduct : product,
          ),
        );
        setCreatedProduct(updatedProduct);
      } else {
        const response = await fetch(`${backendUrl}/api/product/create`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...productPayload, slug }),
        });
        let result: ProductResponse;
        try {
          result = (await response.json()) as ProductResponse;
        } catch {
          throw new Error("The server returned an unreadable product response.");
        }
        if (!response.ok || !result.success || !result.Product?._id) {
          throw new Error(result.message || "Could not create the product.");
        }
        setProducts((currentProducts) => [
          result.Product!,
          ...currentProducts.filter((product) => product._id !== result.Product!._id),
        ]);
        setCreatedProduct(result.Product);
      }

      setDraft(emptyDraft);
      setEditingProduct(null);
      setCreateError(null);
      setIsCreateOpen(false);
    } catch (submissionError) {
      setCreateError(
        submissionError instanceof Error
          ? submissionError.message
          : `Could not ${editingProduct ? "update" : "create"} the product.`,
      );
    } finally {
      setIsCreating(false);
    }
  };

  const openCreateProduct = () => {
    setCreateError(null);
    setCreatedProduct(null);
    setEditingProduct(null);
    setDraft(emptyDraft);
    setIsCreateOpen(true);
  };

  const getShareUrl = (slug: string) =>
    new URL(`/products/${encodeURIComponent(slug)}`, window.location.origin).toString();

  const handleShareProduct = async (product: ProductRow) => {
    if (product.status !== "published") {
      setProductsActionError("Publish this product before sharing its public page.");
      return;
    }

    try {
      await navigator.clipboard.writeText(getShareUrl(product.slug));
      setProductsActionError(null);
      setCopiedProductId(product._id);
      window.setTimeout(() => {
        setCopiedProductId((id) => id === product._id ? null : id);
      }, 2500);
    } catch {
      setProductsActionError(
        "Could not copy the product link. Open the public product page and copy its browser address.",
      );
    }
  };

  const openEditProduct = (product: ProductRow) => {
    setCreateError(null);
    setEditingProduct(product);
    setDraft({
      title: product.tittle,
      slug: product.slug,
      description: product.description,
      type: product.type,
      price: String(product.price),
      status: product.status,
      linkTitle: product.links?.[0]?.title || product.links?.[0]?.tittle || "",
      linkUrl: product.links?.[0]?.url || "",
    });
    setIsCreateOpen(true);
  };

  const handleDeleteProduct = async (product: ProductRow) => {
    if (!window.confirm(`Delete "${product.tittle}"? This cannot be undone.`)) {
      return;
    }
    setProductsActionError(null);
    setDeletingProductId(product._id);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "");
      if (!backendUrl) {
        throw new Error("VITE_BACKEND_URL is not configured.");
      }
      const response = await fetch(
        `${backendUrl}/api/product/delete/${encodeURIComponent(product._id)}`,
        { method: "DELETE", credentials: "include" },
      );
      let result: { success: boolean; message?: string };
      try {
        result = (await response.json()) as { success: boolean; message?: string };
      } catch {
        throw new Error("The server returned an unreadable delete response.");
      }
      if (!response.ok || !result.success) {
        throw new Error(result.message || "Could not delete the product.");
      }
      setProducts((currentProducts) =>
        currentProducts.filter((item) => item._id !== product._id),
      );
    } catch (deleteError) {
      setProductsActionError(
        deleteError instanceof Error ? deleteError.message : "Could not delete the product.",
      );
    } finally {
      setDeletingProductId(null);
    }
  };

  if (isLoading || (!currentUser && !error)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f7fa] text-[#27313d]">
        <p role="status">Loading your products...</p>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f7fa] px-4 text-[#27313d]">
        <div className="text-center">
          <p role="alert">{error || "Please sign in to continue."}</p>
          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="mt-4 rounded-lg bg-[#5945e8] px-4 py-2 font-semibold text-white"
          >
            Go to sign in
          </button>
        </div>
      </main>
    );
  }

  if (currentUser.role === "admin") {
    return <Navigate to="/admin" replace />;
  }
  if (currentUser.role !== "partner") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f7fa] px-4 text-[#27313d]">
        <p role="alert" className="text-sm text-[#697483]">This area is for partner accounts.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f7fa] text-[#27313d]">
      <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8 lg:px-10">
        <div className="rounded-t-xl bg-white px-5 sm:px-7">
          <AccountHeader currentUser={currentUser} />
          <nav aria-label="Main navigation" className="flex justify-end gap-2 border-t border-[#edf0f3] py-3">
            <Link
              to="/home"
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#596474] hover:bg-[#f4f5f8]"
            >
              <LayoutDashboard aria-hidden="true" className="size-4" />
              Dashboard
            </Link>
            <Link
              to="/partner"
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#596474] hover:bg-[#f4f5f8]"
            >
              <UserRound aria-hidden="true" className="size-4" />
              Profile
            </Link>
            <span className="inline-flex items-center gap-2 rounded-lg bg-[#20242c] px-3 py-2 text-sm font-medium text-white">
              <BookOpen aria-hidden="true" className="size-4" />
              Product
            </span>
          </nav>
        </div>

        <section className="px-1 pb-10 pt-8 sm:px-7 sm:pt-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm text-[#8a94a2]">Products &gt; All Products</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">Products</h1>
              <p className="mt-2 text-sm text-[#697483]">
                Manage your digital products and sell them to customers.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreateProduct}
              className="inline-flex items-center gap-2 rounded-lg bg-[#5945e8] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4935d7]"
            >
              <Plus aria-hidden="true" className="size-4" />
              Create Product
            </button>
          </div>

          {visibleNavigationNotice && (
            <p
              className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              role="status"
            >
              {visibleNavigationNotice}
            </p>
          )}

          {createdProduct && (
            <p className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
              “{createdProduct.tittle}” saved successfully.
            </p>
          )}

          {(partnerError || productsError || productsActionError) && (
            <div className="mt-5 space-y-2">
              {partnerError && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Creator profile could not be verified: {partnerError}
                </p>
              )}
              {productsError && (
                <p className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
                  <span>{productsError}</span>
                  <button
                    type="button"
                    onClick={() => setProductsRefreshKey((key) => key + 1)}
                    className="font-semibold underline"
                  >
                    Try again
                  </button>
                </p>
              )}
              {productsActionError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
                  {productsActionError}
                </p>
              )}
            </div>
          )}

          <div className="mt-6 rounded-xl border border-[#e4e8ee] bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0f3] p-4">
              <label className="flex w-full max-w-sm items-center gap-2 rounded-lg border border-[#e5e8ed] px-3 py-2 text-sm text-[#7b8694] focus-within:border-[#5945e8]">
                <Search aria-hidden="true" className="size-4 shrink-0" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Filter products..."
                  aria-label="Filter products"
                  className="w-full bg-transparent text-[#27313d] outline-none placeholder:text-[#929ba7]"
                />
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsFilterOpen((open) => !open)}
                  aria-expanded={isFilterOpen}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#e5e8ed] px-3 py-2 text-sm font-medium text-[#394453] hover:bg-[#f7f8fa]"
                >
                  <Filter aria-hidden="true" className="size-4" />
                  Filter
                  <ChevronDown aria-hidden="true" className="size-4" />
                </button>
                {isFilterOpen && (
                  <div className="absolute right-0 top-full z-10 mt-2 w-40 rounded-lg border border-[#e4e8ee] bg-white p-2 shadow-lg">
                    {(["all", "published", "draft"] as const).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => {
                          setStatusFilter(status);
                          setIsFilterOpen(false);
                        }}
                        className={`block w-full rounded-md px-3 py-2 text-left text-sm capitalize ${
                          statusFilter === status
                            ? "bg-[#f0efff] font-medium text-[#5945e8]"
                            : "text-[#46515e] hover:bg-[#f7f8fa]"
                        }`}
                      >
                        {status === "all" ? "All statuses" : status}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left">
                <thead className="bg-[#f8f9fb] text-[11px] font-semibold uppercase tracking-wide text-[#778290]">
                  <tr>
                    <th className="px-4 py-3 sm:px-5">Product</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Total sales</th>
                    <th className="px-4 py-3">Revenue</th>
                    <th className="px-4 py-3">Created at</th>
                    <th className="px-4 py-3">Share link</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf0f3]">
                  {productsLoading || partnerLoading ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-sm text-[#778290]">
                        Loading your products...
                      </td>
                    </tr>
                  ) : visibleProducts.length ? (
                    visibleProducts.map((product) => (
                      <tr key={product._id} className="hover:bg-[#fcfcfd]">
                        <td className="px-4 py-3.5 sm:px-5">
                          <div className="flex items-center gap-3">
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#eef4ff] text-[#5380d8]">
                              <BookOpen aria-hidden="true" className="size-4" />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-medium text-[#303a47]">
                                {product.tittle}
                              </span>
                              <span className="block truncate text-xs text-[#8b95a1]">/{product.slug}</span>
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-sm">{formatCurrency(product.price)}</td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              product.status === "published"
                                ? "bg-[#eaf7ef] text-[#368454]"
                                : "bg-[#fff4df] text-[#a66a13]"
                            }`}
                          >
                            {product.status === "published" ? "Published" : "Draft"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-sm">{product.totalSales}</td>
                        <td className="px-4 py-3.5 text-sm">{formatCurrency(product.totalRevenue)}</td>
                        <td className="px-4 py-3.5 text-sm text-[#727e8b]">
                          {new Date(product.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-3.5">
                          {product.status === "published" ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => void handleShareProduct(product)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-[#d9d4ff] px-3 py-2 text-xs font-semibold text-[#5945e8] hover:bg-[#f8f7ff]"
                              >
                                <Share2 aria-hidden="true" className="size-3.5" />
                                {copiedProductId === product._id ? "Copied" : "Copy link"}
                              </button>
                              <a
                                href={getShareUrl(product.slug)}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`Open public page for ${product.tittle}`}
                                className="rounded-lg p-2 text-[#596474] hover:bg-[#f0efff] hover:text-[#5945e8]"
                              >
                                <ExternalLink aria-hidden="true" className="size-4" />
                              </a>
                            </div>
                          ) : (
                            <span className="text-xs text-[#7b8694]">Publish to share</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditProduct(product)}
                              aria-label={`Edit ${product.tittle}`}
                              className="rounded-md p-2 text-[#596474] hover:bg-[#f0efff] hover:text-[#5945e8]"
                            >
                              <Pencil aria-hidden="true" className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteProduct(product)}
                              disabled={deletingProductId === product._id}
                              aria-label={`Delete ${product.tittle}`}
                              className="rounded-md p-2 text-[#596474] hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                            >
                              <Trash2 aria-hidden="true" className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-5 py-14 text-center">
                        <BookOpen aria-hidden="true" className="mx-auto size-8 text-[#b3bbc5]" />
                        <p className="mt-3 text-sm font-medium text-[#46515e]">
                          {search || statusFilter !== "all"
                            ? "No products match your filters."
                            : "No products found."}
                        </p>
                        {!search && statusFilter === "all" && (
                          <button
                            type="button"
                            onClick={openCreateProduct}
                            className="mt-3 text-sm font-semibold text-[#5945e8] hover:underline"
                          >
                            Create your first product
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-[#edf0f3] px-4 py-3 text-xs text-[#7b8694] sm:px-5">
              <span>
                Showing {visibleProducts.length} of {products.length} products
              </span>
              <span>Products are synced from your account.</span>
            </div>
          </div>
        </section>
      </div>

      {isCreateOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-[#17202b]/45 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsCreateOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-form-heading"
            className="my-auto max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white p-5 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#edf0f3] pb-4">
              <div>
                <h2 id="product-form-heading" className="text-xl font-semibold">
                  {editingProduct ? "Edit Product" : "Create Product"}
                </h2>
                <p className="mt-1 text-sm text-[#727e8b]">
                  {editingProduct
                    ? "Update your product details."
                    : "Add a digital product and choose where earnings should be paid."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                aria-label="Close product form"
                className="rounded-lg p-2 text-[#727e8b] hover:bg-[#f3f5f7]"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>

            {!profileComplete && !partnerLoading && (
              <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Create and save your creator profile before adding products.{" "}
                <Link to="/partner" className="font-semibold underline">
                  Set up profile
                </Link>
              </p>
            )}
            {createError && (
              <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {createError}
              </p>
            )}
            <form
              onSubmit={handleSaveProduct}
              className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,.8fr)]"
            >
              <fieldset disabled={!profileComplete || isCreating} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={labelClassName}>
                    Product title
                    <input
                      className={inputClassName}
                      value={draft.title}
                      onChange={(event) => setDraft((value) => ({ ...value, title: event.target.value }))}
                      maxLength={150}
                      autoComplete="off"
                      required
                    />
                  </label>
                  <label className={labelClassName}>
                    Product slug
                    <input
                      className={inputClassName}
                      value={draft.slug}
                      onChange={(event) => setDraft((value) => ({ ...value, slug: event.target.value }))}
                      placeholder="my-first-product"
                      pattern="[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*"
                      disabled={Boolean(editingProduct)}
                      title={editingProduct ? "Product slugs cannot be changed." : undefined}
                      autoComplete="off"
                      required
                    />
                    {editingProduct && (
                      <span className="mt-1 block text-xs font-normal text-[#7b8694]">
                        Product slugs cannot be changed.
                      </span>
                    )}
                    <span className="mt-1 block break-all text-xs font-normal text-[#7b8694]">
                      {getShareUrl(draft.slug.trim() || "your-product")}
                    </span>
                  </label>
                  <label className={labelClassName}>
                    Product type
                    <select
                      className={inputClassName}
                      value={draft.type}
                      onChange={(event) =>
                        setDraft((value) => ({ ...value, type: event.target.value as ProductType }))
                      }
                    >
                      <option value="course">Course</option>
                      <option value="source-code">Source code</option>
                      <option value="ebook">Ebook</option>
                      <option value="ui-kit">UI kit</option>
                      <option value="templete">Template</option>
                      <option value="ai-prompt">AI prompt</option>
                      <option value="software">Software</option>
                      <option value="other">Other</option>
                    </select>
                  </label>
                  <label className={labelClassName}>
                    Price (INR)
                    <input
                      className={inputClassName}
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.price}
                      onChange={(event) => setDraft((value) => ({ ...value, price: event.target.value }))}
                      required
                    />
                  </label>
                  <label className={labelClassName}>
                    Status
                    <select
                      className={inputClassName}
                      value={draft.status}
                      onChange={(event) =>
                        setDraft((value) => ({
                          ...value,
                          status: event.target.value as ProductDraft["status"],
                        }))
                      }
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                    </select>
                  </label>
                  <label className={`${labelClassName} sm:col-span-2`}>
                    Description
                    <textarea
                      className={`${inputClassName} min-h-24 resize-y`}
                      value={draft.description}
                      onChange={(event) =>
                        setDraft((value) => ({ ...value, description: event.target.value }))
                      }
                      maxLength={3000}
                      required
                    />
                  </label>
                  <label className={labelClassName}>
                    Download link title <span className="font-normal text-[#8b95a1]">(optional)</span>
                    <input
                      className={inputClassName}
                      value={draft.linkTitle}
                      onChange={(event) => setDraft((value) => ({ ...value, linkTitle: event.target.value }))}
                      placeholder="Download"
                      autoComplete="off"
                    />
                  </label>
                  <label className={labelClassName}>
                    Download link URL <span className="font-normal text-[#8b95a1]">(optional)</span>
                    <input
                      className={inputClassName}
                      type="url"
                      value={draft.linkUrl}
                      onChange={(event) => setDraft((value) => ({ ...value, linkUrl: event.target.value }))}
                      placeholder="https://..."
                      autoComplete="off"
                    />
                  </label>
                </div>
              </fieldset>
              <aside className="h-fit rounded-xl border border-[#e4e8ee] bg-[#f8f9fb] p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#303a47]">Customer page preview</p>
                    <p className="mt-1 text-xs text-[#7b8694]">
                      Customers see this button on your public product page.
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                      draft.status === "published"
                        ? "bg-[#eaf7ef] text-[#368454]"
                        : "bg-[#fff4df] text-[#a66a13]"
                    }`}
                  >
                    {draft.status === "published" ? "Published" : "Draft"}
                  </span>
                </div>
                <div className="mt-4 overflow-hidden rounded-xl border border-[#e4e8ee] bg-white shadow-sm">
                  <div className="flex h-36 items-center justify-center bg-gradient-to-br from-[#f0efff] via-[#f7f5ff] to-[#e9e5ff]">
                    <BookOpen aria-hidden="true" className="size-12 text-[#5945e8]/70" />
                  </div>
                  <div className="p-5">
                    <span className="rounded-full bg-[#f0efff] px-2.5 py-1 text-[11px] font-semibold capitalize text-[#5945e8]">
                      {draft.type.replace("-", " ")}
                    </span>
                    <h3 className="mt-3 break-words text-lg font-semibold text-[#27313d]">
                      {draft.title.trim() || "Your product title"}
                    </h3>
                    <p className="mt-2 line-clamp-4 min-h-20 whitespace-pre-wrap text-sm leading-6 text-[#697483]">
                      {draft.description.trim() || "Your product description will appear here."}
                    </p>
                    <div className="mt-4 border-t border-[#edf0f3] pt-4">
                      <p className="text-xs text-[#7b8694]">One-time purchase</p>
                      <p className="mt-1 text-2xl font-semibold text-[#27313d]">
                        {formatCurrency(Number(draft.price) || 0)}
                      </p>
                      <div
                        aria-hidden="true"
                        className="mt-4 cursor-default rounded-lg bg-[#5945e8] px-4 py-3 text-center text-sm font-semibold text-white"
                      >
                        Buy now
                      </div>
                    </div>
                  </div>
                </div>
                {draft.linkUrl && (
                  <p className="mt-3 break-all rounded-lg border border-[#e4e8ee] bg-white px-3 py-2 text-xs text-[#697483]">
                    {draft.linkTitle.trim() || "Download"}: {draft.linkUrl}
                  </p>
                )}
              </aside>
              <div className="flex justify-end gap-3 border-t border-[#edf0f3] pt-4 lg:col-span-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingProduct(null);
                  }}
                  className="rounded-lg border border-[#e2e6eb] px-4 py-2.5 text-sm font-medium text-[#46515e] hover:bg-[#f7f8fa]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!profileComplete || isCreating}
                  className="rounded-lg bg-[#5945e8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4935d7] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isCreating
                    ? editingProduct ? "Saving..." : "Creating..."
                    : editingProduct ? "Save changes" : "Create Product"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

export default ProductsPage;
