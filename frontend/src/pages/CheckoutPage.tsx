import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, CreditCard, LoaderCircle, LockKeyhole } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import StoreHeader from "@/components/StoreHeader";
import { formatPrice, getPublishedProduct, type PublicProduct } from "@/lib/marketplace";

type CreateOrderResponse = { success: boolean; message?: string; razorpayOrderId?: string; amount?: number; key?: string };
type VerifyOrderResponse = { success: boolean; message?: string; order?: { links?: Array<{ tittle?: string; title?: string; url: string }> } };
type RazorpayResponse = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };

declare global { interface Window { Razorpay?: new (options: Record<string, unknown>) => { open: () => void } } }

function getBackendUrl() {
  const url = import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "");
  if (!url) throw new Error("Checkout is not configured yet.");
  return url;
}

function loadRazorpay() {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Could not load secure checkout.")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load secure checkout. Check your connection and try again."));
    document.body.appendChild(script);
  });
}

function CheckoutPage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        setProduct(await getPublishedProduct(slug));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "This product is unavailable.");
      }
    })();
  }, [slug]);

  const handlePayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!product) return;
    setError("");
    if (!customerName.trim() || !customerEmail.trim()) {
      setError("Enter your name and email to continue.");
      return;
    }

    setIsPaying(true);
    try {
      const backendUrl = getBackendUrl();
      const createResponse = await fetch(`${backendUrl}/api/order/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ProductId: product._id,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
        }),
      });
      const orderResult = (await createResponse.json()) as CreateOrderResponse;
      if (!createResponse.ok || !orderResult.success || !orderResult.razorpayOrderId || !orderResult.key) {
        throw new Error(orderResult.message || "Could not create your order.");
      }

      await loadRazorpay();
      if (!window.Razorpay) throw new Error("Secure checkout is unavailable.");
      const checkout = new window.Razorpay({
        key: orderResult.key,
        amount: Math.round((orderResult.amount ?? product.price) * 100),
        currency: "INR",
        name: "DigiAi",
        description: product.tittle,
        order_id: orderResult.razorpayOrderId,
        prefill: { name: customerName.trim(), email: customerEmail.trim() },
        theme: { color: "#5945e8" },
        config: {
          display: {
            blocks: {
              upi: {
                name: "Pay using UPI",
                instruments: [{ method: "upi" }],
              },
            },
            sequence: ["block.upi"],
            preferences: { show_default_blocks: true },
          },
        },
        modal: { ondismiss: () => setIsPaying(false) },
        handler: async (payment: RazorpayResponse) => {
          try {
            const verifyResponse = await fetch(`${backendUrl}/api/order/verify`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payment),
            });
            const verifyResult = (await verifyResponse.json()) as VerifyOrderResponse;
            if (!verifyResponse.ok || !verifyResult.success) {
              throw new Error(verifyResult.message || "Payment could not be verified.");
            }
            navigate(`/products/${encodeURIComponent(product.slug)}`, {
              replace: true,
              state: {
                paymentComplete: true,
                productSlug: product.slug,
                links: verifyResult.order?.links ?? [],
              },
            });
          } catch (verificationError) {
            setError(verificationError instanceof Error ? verificationError.message : "Payment verification failed.");
            setIsPaying(false);
          }
        },
      });
      checkout.open();
    } catch (paymentError) {
      setError(paymentError instanceof Error ? paymentError.message : "Could not start payment.");
      setIsPaying(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f7fa] text-[#27313d]">
      <StoreHeader />
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <Link to={product ? `/products/${product.slug}` : "/"} className="inline-flex items-center gap-2 text-sm font-medium text-[#697483] hover:text-[#5945e8]"><ArrowLeft className="size-4" />Back</Link>
        {error && !product ? <section className="mt-10 rounded-xl border border-red-200 bg-white p-7 text-red-700">{error}</section> : !product ? <p className="py-20 text-center text-sm text-[#7b8694]">Preparing checkout...</p> : <div className="mt-8 grid gap-7 lg:grid-cols-[.9fr_1.1fr]"><aside className="h-fit rounded-xl border border-[#e4e8ee] bg-white p-7 shadow-sm"><p className="text-sm text-[#697483]">You are purchasing</p><h1 className="mt-3 text-2xl font-semibold leading-tight">{product.tittle}</h1><div className="mt-8 border-t border-[#edf0f3] pt-5"><p className="text-sm text-[#697483]">Total</p><p className="mt-1 text-3xl font-semibold">{formatPrice(product.price)}</p></div><p className="mt-8 flex items-start gap-2 text-xs leading-5 text-[#697483]"><LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-[#5945e8]" />Your payment details are securely handled by Razorpay.</p></aside><section className="rounded-xl border border-[#e4e8ee] bg-white p-6 shadow-sm sm:p-8"><p className="text-sm font-semibold text-[#5945e8]">Secure checkout</p><h2 className="mt-2 text-2xl font-semibold">Your details</h2><p className="mt-2 text-sm leading-6 text-[#697483]">We’ll use these details for your purchase confirmation.</p><form onSubmit={handlePayment} className="mt-7 space-y-5"><label className="block text-sm font-medium">Full name<input required value={customerName} onChange={(event) => setCustomerName(event.target.value)} autoComplete="name" className="mt-2 w-full rounded-lg border border-[#e2e6eb] px-3.5 py-3 outline-none transition focus:border-[#5945e8] focus:ring-4 focus:ring-[#5945e8]/10" /></label><label className="block text-sm font-medium">Email address<input required type="email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} autoComplete="email" className="mt-2 w-full rounded-lg border border-[#e2e6eb] px-3.5 py-3 outline-none transition focus:border-[#5945e8] focus:ring-4 focus:ring-[#5945e8]/10" /></label>{error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">{error}</p>}<button disabled={isPaying} className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#5945e8] px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-[#4935d7] disabled:cursor-not-allowed disabled:opacity-60">{isPaying ? <><LoaderCircle className="size-4 animate-spin" />Opening secure payment...</> : <><CreditCard className="size-4" />Continue to payment</>}</button></form></section></div>}
      </div>
    </main>
  );
}

export default CheckoutPage;
