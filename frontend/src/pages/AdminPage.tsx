import { useEffect, useState } from "react";
import {
  BadgeIndianRupee,
  CheckCircle2,
  Clock3,
  LayoutDashboard,
  LoaderCircle,
  MoreHorizontal,
  Package,
  Receipt,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useGetCurrentUser } from "@/hooks/useGetCurrentUser";

type AdminStats = {
  totalSales: number;
  adminEarnings: number;
  totalPartners: number;
  totalProducts: number;
  paidOrders: number;
};

type PaymentDetails = {
  method?: "upi" | "bank";
  upiId?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
};

type AdminPartner = {
  _id: string;
  name: string;
  email: string;
  isActive: boolean;
  totalSales: number;
  totalRevenue: number;
  products: number;
  paidOutRevenue: number;
  payableAmount: number;
  paymentDetails?: PaymentDetails;
};

type AdminPayout = {
  _id: string;
  partnerName: string;
  partnerEmail: string;
  amount: number;
  paymentMethod: "upi" | "bank";
  upiId: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  status: "completed";
  createdAt: string;
};

type ApiResponse<T> = {
  success: boolean;
  message?: string;
} & T;

const cardClass =
  "rounded-xl border border-[#e4e8ee] bg-white shadow-sm";
const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#20242c] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#343a45] disabled:cursor-not-allowed disabled:opacity-60";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(value);
}

function getBackendUrl() {
  const url = import.meta.env.VITE_BACKEND_URL?.trim().replace(/\/+$/, "");
  if (!url) throw new Error("VITE_BACKEND_URL is not configured.");
  return url;
}

async function adminRequest<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const response = await fetch(`${getBackendUrl()}/api/admin${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  let result: ApiResponse<T>;
  try {
    result = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new Error("The server returned an unreadable admin response.");
  }
  if (!response.ok || !result.success) {
    throw new Error(result.message || "The admin request failed.");
  }
  return result;
}

function AdminPage() {
  const { currentUser, isLoading: userLoading, error: userError } = useGetCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();
  const isPayoutPage = location.pathname.startsWith("/admin/payouts");
  const [payoutTab, setPayoutTab] = useState<"partners" | "history">("partners");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [partners, setPartners] = useState<AdminPartner[]>([]);
  const [payouts, setPayouts] = useState<AdminPayout[]>([]);
  const [pageError, setPageError] = useState("");
  const [loadedKey, setLoadedKey] = useState("");
  const [errorKey, setErrorKey] = useState("");
  const [selectedPartner, setSelectedPartner] = useState<AdminPartner | null>(null);
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [actionError, setActionError] = useState("");

  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") return;
    let active = true;
    const requestKey = isPayoutPage ? "payouts" : "dashboard";

    void (async () => {
      try {
        if (isPayoutPage) {
          const [partnerResult, payoutResult] = await Promise.all([
            adminRequest<{ partners: AdminPartner[] }>("/partners"),
            adminRequest<{ payouts: AdminPayout[] }>("/payouts"),
          ]);
          if (active) {
            setPageError("");
            setErrorKey("");
            setPartners(partnerResult.partners);
            setPayouts(payoutResult.payouts);
          }
        } else {
          const [dashboardResult, partnerResult] = await Promise.all([
            adminRequest<{ stats: AdminStats }>("/dashboard"),
            adminRequest<{ partners: AdminPartner[] }>("/partners"),
          ]);
          if (active) {
            setPageError("");
            setErrorKey("");
            setStats(dashboardResult.stats);
            setPartners(partnerResult.partners);
          }
        }
      } catch (loadError) {
        if (active) {
          setErrorKey(requestKey);
          setPageError(
            loadError instanceof Error ? loadError.message : "Could not load admin data.",
          );
        }
      } finally {
        if (active) setLoadedKey(requestKey);
      }
    })();

    return () => {
      active = false;
    };
  }, [currentUser, isPayoutPage]);
  const requestKey = isPayoutPage ? "payouts" : "dashboard";
  const isLoading = currentUser?.role === "admin" &&
    loadedKey !== requestKey &&
    errorKey !== requestKey;
  const visiblePageError = errorKey === requestKey ? pageError : "";

  const markPayoutComplete = async () => {
    if (!selectedPartner) return;
    setIsSubmittingPayout(true);
    setActionError("");
    try {
      await adminRequest<{ payout: AdminPayout }>(
        `/payouts/${encodeURIComponent(selectedPartner._id)}/complete`,
        { method: "POST", body: JSON.stringify({}) },
      );
      setSelectedPartner(null);
      const [partnerResult, payoutResult] = await Promise.all([
        adminRequest<{ partners: AdminPartner[] }>("/partners"),
        adminRequest<{ payouts: AdminPayout[] }>("/payouts"),
      ]);
      setPartners(partnerResult.partners);
      setPayouts(payoutResult.payouts);
    } catch (requestError) {
      setActionError(
        requestError instanceof Error ? requestError.message : "Could not record this payout.",
      );
    } finally {
      setIsSubmittingPayout(false);
    }
  };

  if (userLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f7fa]">
        <p role="status" className="text-sm text-[#697483]">Loading admin access...</p>
      </main>
    );
  }

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f7fa] px-5 text-[#27313d]">
        <section className={`${cardClass} max-w-md p-7 text-center`}>
          <h1 className="text-xl font-semibold">Admin access required</h1>
          <p role="alert" className="mt-2 text-sm leading-6 text-[#697483]">
            {userError || "Sign in with an administrator account to continue."}
          </p>
          <button type="button" onClick={() => navigate("/login")} className={`${buttonClass} mt-5`}>
            Go to sign in
          </button>
        </section>
      </main>
    );
  }

  const statsItems = [
    { label: "Total sales", value: formatCurrency(stats?.totalSales ?? 0), Icon: BadgeIndianRupee },
    { label: "Admin earnings", value: formatCurrency(stats?.adminEarnings ?? 0), Icon: Wallet },
    { label: "Total partners", value: String(stats?.totalPartners ?? 0), Icon: Users },
    { label: "Total products", value: String(stats?.totalProducts ?? 0), Icon: Package },
  ];

  return (
    <main className="min-h-screen bg-[#f6f7fa] text-[#27313d]">
      <header className="border-b border-[#e4e8ee] bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link to="/admin" className="flex items-center gap-2.5 font-semibold">
            <span className="flex size-9 items-center justify-center rounded-lg bg-[#20242c] text-sm font-bold text-white">
              D
            </span>
            <span>Admin Panel</span>
          </Link>
          <nav aria-label="Admin navigation" className="flex items-center gap-2">
            <Link
              to="/admin"
              aria-current={!isPayoutPage ? "page" : undefined}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                !isPayoutPage ? "bg-[#20242c] text-white" : "text-[#596474] hover:bg-[#f3f5f7]"
              }`}
            >
              <LayoutDashboard aria-hidden="true" className="size-4" />
              Dashboard
            </Link>
            <Link
              to="/admin/payouts"
              aria-current={isPayoutPage ? "page" : undefined}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                isPayoutPage ? "bg-[#20242c] text-white" : "text-[#596474] hover:bg-[#f3f5f7]"
              }`}
            >
              <Wallet aria-hidden="true" className="size-4" />
              Pay to partner
            </Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
        {!isPayoutPage ? (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-semibold tracking-tight">
                Admin Dashboard - Hello, {currentUser.name.split(" ")[0]} 👋
              </h1>
              <p className="mt-1 text-sm text-[#7b8694]">
                Monitor your marketplace, partners, products, and earnings.
              </p>
            </div>
            {visiblePageError && (
              <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {visiblePageError}
              </p>
            )}
            <section aria-label="Marketplace statistics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {statsItems.map(({ label, value, Icon }) => (
                <article key={label} className={`${cardClass} p-5`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-[#7b8694]">{label}</p>
                    <span className="flex size-9 items-center justify-center rounded-lg bg-[#f0efff] text-[#5945e8]">
                      <Icon aria-hidden="true" className="size-4" />
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-semibold tracking-tight">{isLoading ? "—" : value}</p>
                </article>
              ))}
            </section>
            <section className={`${cardClass} mt-6 overflow-hidden`}>
              <div className="border-b border-[#edf0f3] px-5 py-4">
                <h2 className="font-semibold">All partners</h2>
                <p className="mt-1 text-sm text-[#7b8694]">Partner accounts and marketplace activity.</p>
              </div>
              <PartnerTable
                partners={partners}
                isLoading={isLoading}
                showPayout={false}
                onPayout={(partner) => setSelectedPartner(partner)}
              />
            </section>
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight">Partner payments</h1>
                <p className="mt-1 text-sm text-[#697483]">
                  Manage partners and view your complete payment history.
                </p>
              </div>
              <div className="flex rounded-lg border border-[#e4e8ee] bg-white p-1">
                <button
                  type="button"
                  onClick={() => setPayoutTab("partners")}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    payoutTab === "partners" ? "bg-[#20242c] text-white" : "text-[#596474]"
                  }`}
                >
                  <Users aria-hidden="true" className="mr-1.5 inline size-4" />
                  Partners
                </button>
                <button
                  type="button"
                  onClick={() => setPayoutTab("history")}
                  className={`rounded-md px-3 py-2 text-sm font-medium ${
                    payoutTab === "history" ? "bg-[#20242c] text-white" : "text-[#596474]"
                  }`}
                >
                  <Clock3 aria-hidden="true" className="mr-1.5 inline size-4" />
                  History
                </button>
              </div>
            </div>
            {visiblePageError && (
              <p role="alert" className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {visiblePageError}
              </p>
            )}
            <section className={`${cardClass} mt-6 overflow-hidden`}>
              <div className="border-b border-[#edf0f3] px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-[#f0efff] text-[#5945e8]">
                    {payoutTab === "partners" ? (
                      <Receipt aria-hidden="true" className="size-5" />
                    ) : (
                      <Clock3 aria-hidden="true" className="size-5" />
                    )}
                  </span>
                  <div>
                    <h2 className="font-semibold">
                      {payoutTab === "partners" ? "Eligible For Payment" : "Payout History"}
                    </h2>
                    <p className="mt-1 text-sm text-[#7b8694]">
                      {payoutTab === "partners"
                        ? `${partners.filter((partner) => partner.payableAmount > 0).length} partner(s) ready for payout.`
                        : "Latest recorded partner payouts."}
                    </p>
                  </div>
                </div>
              </div>
              {payoutTab === "partners" ? (
                <PartnerTable
                  partners={partners}
                  isLoading={isLoading}
                  showPayout
                  onPayout={(partner) => setSelectedPartner(partner)}
                />
              ) : (
                <PayoutHistory payouts={payouts} isLoading={isLoading} />
              )}
            </section>
          </>
        )}
      </div>

      {selectedPartner && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-[#17202b]/20 p-4 backdrop-blur-[3px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSubmittingPayout) {
              setSelectedPartner(null);
              setActionError("");
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="payout-heading"
            className="my-auto w-full max-w-md rounded-xl border border-[#e4e8ee] bg-white p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="payout-heading" className="text-lg font-semibold">Partner Payment</h2>
                <p className="mt-1 text-sm text-[#697483]">
                  Review the payment details before marking this payout as completed.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close payout dialog"
                onClick={() => {
                  setSelectedPartner(null);
                  setActionError("");
                }}
                disabled={isSubmittingPayout}
                className="rounded-md p-1.5 text-[#7b8694] hover:bg-[#f3f5f7]"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>
            <div className="mt-5 flex items-center gap-3 rounded-lg border border-[#e4e8ee] bg-[#f8f9fb] p-3.5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#f0efff] text-sm font-semibold text-[#5945e8]">
                {selectedPartner.name.trim().charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{selectedPartner.name}</p>
                <p className="truncate text-xs text-[#7b8694]">{selectedPartner.email}</p>
              </div>
            </div>
            <div className="mt-3 rounded-lg border border-[#e4e8ee] p-3.5">
              <p className="text-xs text-[#7b8694]">Payment Amount</p>
              <p className="mt-1 text-2xl font-semibold">{formatCurrency(selectedPartner.payableAmount)}</p>
            </div>
            <div className="mt-3 rounded-lg border border-[#e4e8ee] p-3.5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#697483]">Payment method</p>
                <span className="rounded-full bg-[#f3f5f7] px-2.5 py-1 text-[10px] font-semibold uppercase">
                  {selectedPartner.paymentDetails?.method || "UPI"}
                </span>
              </div>
              {selectedPartner.paymentDetails?.method === "bank" ? (
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-[#7b8694]">Account holder</dt>
                    <dd className="text-right font-medium">{selectedPartner.paymentDetails.accountHolderName || "Not set"}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[#7b8694]">Account number</dt>
                    <dd className="text-right font-medium">{selectedPartner.paymentDetails.accountNumber || "Not set"}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-[#7b8694]">IFSC</dt>
                    <dd className="text-right font-medium">{selectedPartner.paymentDetails.ifscCode || "Not set"}</dd>
                  </div>
                </dl>
              ) : (
                <div className="mt-3">
                  <p className="text-xs text-[#7b8694]">UPI ID</p>
                  <p className="mt-1 break-all text-sm font-medium">
                    {selectedPartner.paymentDetails?.upiId || "Not set"}
                  </p>
                </div>
              )}
            </div>
            <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-900">
              Send the payment using your bank or UPI app first. This action only records the payout in DigiAi; it does not transfer money.
            </p>
            {actionError && (
              <p role="alert" className="mt-3 text-sm text-red-700">{actionError}</p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={isSubmittingPayout}
                onClick={() => {
                  setSelectedPartner(null);
                  setActionError("");
                }}
                className="rounded-lg border border-[#e2e6eb] px-4 py-2.5 text-sm font-medium hover:bg-[#f7f8fa] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingPayout || selectedPartner.payableAmount <= 0}
                onClick={() => void markPayoutComplete()}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {isSubmittingPayout ? (
                  <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                ) : (
                  <CheckCircle2 aria-hidden="true" className="size-4" />
                )}
                Payment succeeded
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function PartnerTable({
  partners,
  isLoading,
  showPayout,
  onPayout,
}: {
  partners: AdminPartner[];
  isLoading: boolean;
  showPayout: boolean;
  onPayout: (partner: AdminPartner) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left">
        <thead className="bg-[#f8f9fb] text-xs font-medium text-[#7b8694]">
          <tr>
            <th className="px-5 py-3">Partner</th>
            {!showPayout && <th className="px-4 py-3">Products</th>}
            <th className="px-4 py-3">Total Sales</th>
            <th className="px-4 py-3">{showPayout ? "Payable Amount" : "Revenue"}</th>
            {showPayout && <th className="px-5 py-3 text-right">Action</th>}
            {!showPayout && <><th className="px-4 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></>}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf0f3]">
          {isLoading ? (
            <tr><td colSpan={showPayout ? 4 : 6} className="px-5 py-12 text-center text-sm text-[#7b8694]">Loading partner data...</td></tr>
          ) : partners.length ? (
            partners.map((partner) => (
              <tr key={partner._id} className="hover:bg-[#fcfcfd]">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-[#e4e8ee] bg-[#f8f9fb] text-xs font-medium text-[#7b8694]">
                      {partner.name.trim().charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{partner.name}</span>
                      <span className="mt-0.5 block truncate text-xs text-[#7b8694]">{partner.email}</span>
                    </span>
                  </div>
                </td>
                {!showPayout && <td className="px-4 py-3.5 text-sm">{partner.products}</td>}
                <td className="px-4 py-3.5 text-sm">{partner.totalSales}</td>
                <td className="px-4 py-3.5 text-sm font-medium">
                  {formatCurrency(showPayout ? partner.payableAmount : partner.totalRevenue)}
                </td>
                {showPayout ? (
                  <td className="px-5 py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => onPayout(partner)}
                      disabled={partner.payableAmount <= 0 || !partner.isActive}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#20242c] px-3 py-2 text-xs font-semibold text-white hover:bg-[#343a45] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <BadgeIndianRupee aria-hidden="true" className="size-3.5" />
                      Pay partner
                    </button>
                  </td>
                ) : (
                  <>
                    <td className="px-4 py-3.5">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${partner.isActive ? "bg-emerald-50 text-emerald-700" : "bg-[#f3f5f7] text-[#697483]"}`}>
                        {partner.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => onPayout(partner)}
                        aria-label={`Open payout details for ${partner.name}`}
                        className="rounded-md p-1.5 text-[#7b8694] hover:bg-[#f3f5f7] hover:text-[#27313d]"
                      >
                        <MoreHorizontal aria-hidden="true" className="size-4" />
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))
          ) : (
            <tr><td colSpan={showPayout ? 4 : 6} className="px-5 py-12 text-center text-sm text-[#7b8694]">No partners found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function PayoutHistory({ payouts, isLoading }: { payouts: AdminPayout[]; isLoading: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left">
        <thead className="bg-[#f8f9fb] text-xs font-medium text-[#7b8694]">
          <tr>
            <th className="px-5 py-3">Partner</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Method</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-5 py-3">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf0f3]">
          {isLoading ? (
            <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-[#7b8694]">Loading payout history...</td></tr>
          ) : payouts.length ? (
            payouts.map((payout) => (
              <tr key={payout._id}>
                <td className="px-5 py-3.5">
                  <p className="text-sm font-semibold">{payout.partnerName}</p>
                  <p className="mt-0.5 text-xs text-[#7b8694]">{payout.partnerEmail}</p>
                </td>
                <td className="px-4 py-3.5 text-sm font-medium">{formatCurrency(payout.amount)}</td>
                <td className="px-4 py-3.5 text-sm capitalize">{payout.paymentMethod}</td>
                <td className="px-4 py-3.5 text-sm text-[#697483]">{new Date(payout.createdAt).toLocaleString()}</td>
                <td className="px-5 py-3.5">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    {payout.status}
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-[#7b8694]">No payouts recorded yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default AdminPage;
