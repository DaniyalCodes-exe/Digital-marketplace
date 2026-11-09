import { useEffect, useState } from "react";
import {
  BadgeIndianRupee,
  ExternalLink,
  Package,
  Plus,
  UserRound,
} from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AccountHeader from "@/components/AccountHeader";
import { useGetCurrentUser } from "@/hooks/useGetCurrentUser";
import type { CurrentUser } from "@/redux/userslice";

interface PartnerResponse {
  success: boolean;
  partner?: CurrentUser;
  message?: string;
}

interface ProductSummary {
  _id: string;
  tittle: string;
  slug: string;
  status: "draft" | "published";
  totalSales: number;
  totalRevenue: number;
}

interface ProductListResponse {
  success: boolean;
  message?: string;
  products?: ProductSummary[];
}

function HomePage() {
  const { currentUser, isLoading, error } = useGetCurrentUser();
  const navigate = useNavigate();
  const [partner, setPartner] = useState<CurrentUser | null>(null);
  const [partnerLoading, setPartnerLoading] = useState(false);
  const [partnerError, setPartnerError] = useState<string | null>(null);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState("");

  useEffect(() => {
    if (!currentUser || currentUser.role !== "partner") return;
    const controller = new AbortController();
    void (async () => {
      setProductsLoading(true);
      setProductsError("");
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL?.trim().replace(/\/+$/, "");
        if (!backendUrl) throw new Error("VITE_BACKEND_URL is not configured.");
        const response = await fetch(`${backendUrl}/api/product/all`, {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
        const result = (await response.json()) as ProductListResponse;
        if (!response.ok || !result.success || !Array.isArray(result.products)) {
          throw new Error(result.message || "Could not load your products.");
        }
        setProducts(result.products);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setProductsError(loadError instanceof Error ? loadError.message : "Could not load your products.");
        }
      } finally {
        if (!controller.signal.aborted) setProductsLoading(false);
      }
    })();
    return () => controller.abort();
  }, [currentUser]);

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

        let result: PartnerResponse;
        try {
          result = (await response.json()) as PartnerResponse;
        } catch {
          throw new Error("The server returned an unreadable partner profile.");
        }

        if (!response.ok || !result.success || !result.partner) {
          throw new Error(result.message || "Could not load your partner summary.");
        }
        setPartner(result.partner);
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }
        setPartnerError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load your partner summary.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setPartnerLoading(false);
        }
      }
    };

    void loadPartner();
    return () => controller.abort();
  }, [currentUser]);

  if (isLoading || (!currentUser && !error)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f7fa] text-[#27313d]">
        <p role="status">Loading your account...</p>
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
            className="mt-4 rounded-lg bg-[#5945e8] px-4 py-2 font-semibold text-white hover:bg-[#4935d7]"
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
      <main className="flex min-h-screen items-center justify-center bg-[#f6f7fa] px-5 text-[#27313d]">
        <p role="alert" className="text-sm text-[#697483]">This area is for partner accounts.</p>
      </main>
    );
  }

  const account = partner ?? currentUser;
  const currency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  const availableBalance = Math.max(
    0,
    (account.totalRevenue ?? 0) - (account.paidOutRevenue ?? 0),
  );
  const dashboardStats = [
    { title: "Total sales", value: String(account.totalSales ?? 0), Icon: Package },
    { title: "Total revenue", value: currency(account.totalRevenue ?? 0), Icon: BadgeIndianRupee },
    { title: "Available balance", value: currency(availableBalance), Icon: BadgeIndianRupee },
    { title: "Total products", value: String(products.length), Icon: Package },
  ];

  return (
    <main className="min-h-screen bg-[#f6f7fa] text-[#27313d]">
      <div className="mx-auto max-w-7xl px-5 py-5 sm:px-8 lg:px-10">
        <AccountHeader currentUser={currentUser} />

        <section className="py-8 sm:py-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Partner Dashboard - Hello, {account.name.split(" ")[0]} 👋
              </h1>
              <p className="mt-2 text-sm text-[#7b8694]">
                Monitor your products, sales, and earnings.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/partner"
                className="inline-flex items-center gap-2 rounded-lg border border-[#e2e6eb] bg-white px-4 py-2.5 text-sm font-semibold text-[#46515e] hover:bg-[#f7f8fa]"
              >
                <UserRound aria-hidden="true" className="size-4" />
                Profile
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 rounded-lg bg-[#5945e8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4935d7]"
              >
                <Plus aria-hidden="true" className="size-4" />
                Add your own product
              </Link>
            </div>
          </div>
          {(partnerError || productsError) && (
            <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {partnerError || productsError}
            </p>
          )}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {dashboardStats.map(({ title, value, Icon }) => (
              <article key={title} className="rounded-xl border border-[#e4e8ee] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-[#7b8694]">{title}</p>
                  <span className="flex size-9 items-center justify-center rounded-lg bg-[#f0efff] text-[#5945e8]">
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                </div>
                <p className="mt-3 text-2xl font-semibold tracking-tight">
                  {partnerLoading || productsLoading ? "—" : value}
                </p>
              </article>
            ))}
          </div>
          <section className="mt-6 overflow-hidden rounded-xl border border-[#e4e8ee] bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0f3] px-5 py-4">
              <div>
                <h2 className="font-semibold">My products</h2>
                <p className="mt-1 text-sm text-[#7b8694]">
                  Share a published product link with customers to let them view and buy it without signing in.
                </p>
              </div>
              <Link to="/products" className="text-sm font-semibold text-[#5945e8] hover:underline">
                Manage products
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead className="bg-[#f8f9fb] text-xs font-medium text-[#7b8694]">
                  <tr>
                    <th className="px-5 py-3">Product</th>
                    <th className="px-4 py-3">Sales</th>
                    <th className="px-4 py-3">Revenue</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf0f3]">
                  {productsLoading ? (
                    <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-[#7b8694]">Loading products...</td></tr>
                  ) : products.length ? (
                    products.slice(0, 8).map((product) => (
                      <tr key={product._id}>
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-semibold">{product.tittle}</p>
                          <p className="mt-0.5 text-xs text-[#7b8694]">/{product.slug}</p>
                        </td>
                        <td className="px-4 py-3.5 text-sm">{product.totalSales}</td>
                        <td className="px-4 py-3.5 text-sm">{currency(product.totalRevenue)}</td>
                        <td className="px-4 py-3.5">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${product.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-800"}`}>
                            {product.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {product.status === "published" ? (
                            <Link
                              to={`/products/${encodeURIComponent(product.slug)}`}
                              target="_blank"
                              aria-label={`Open public page for ${product.tittle}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[#e2e6eb] px-3 py-2 text-xs font-semibold text-[#596474] hover:border-[#d9d4ff] hover:text-[#5945e8]"
                            >
                              <ExternalLink aria-hidden="true" className="size-3.5" />
                              View link
                            </Link>
                          ) : (
                            <span className="text-xs text-[#7b8694]">Publish to share</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center">
                        <p className="text-sm text-[#7b8694]">You have not created any products yet.</p>
                        <Link to="/products" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[#5945e8]">
                          <Plus aria-hidden="true" className="size-4" />
                          Create your first product
                        </Link>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
          {account.partnerProfile?.slug && (
            <p className="mt-4 text-sm text-[#697483]">
              Public creator profile:{" "}
              <Link
                to={`/profile/${encodeURIComponent(account.partnerProfile.slug)}`}
                className="font-medium text-[#5945e8] hover:underline"
              >
                /profile/{account.partnerProfile.slug}
              </Link>
            </p>
          )}
        </section>

        <footer className="border-t border-[#e4e8ee] py-5 text-center text-xs text-[#7b8694]">
          Partner workspace
        </footer>
      </div>
    </main>
  );
}

export default HomePage;
