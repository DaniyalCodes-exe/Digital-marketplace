import { CheckCircle2, Download, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import StoreHeader from "@/components/StoreHeader";

type PurchaseState = {
  productTitle?: string;
  links?: Array<{ tittle?: string; title?: string; url: string }>;
};

function PurchaseSuccessPage() {
  const location = useLocation();
  const state = (location.state || {}) as PurchaseState;

  return (
    <main className="min-h-screen bg-[#f6f7fa] text-[#27313d]">
      <StoreHeader />
      <div className="mx-auto max-w-2xl px-5 py-16 text-center sm:px-8">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#f0efff] text-[#5945e8]"><CheckCircle2 className="size-9" /></span>
        <p className="mt-6 text-sm font-semibold text-[#5945e8]">Payment complete</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight">You’re all set.</h1>
        <p className="mt-4 text-[#697483]">{state.productTitle ? `Your purchase of ${state.productTitle} is ready.` : "Your purchase is ready."}</p>
        {state.links?.length ? <section className="mt-8 rounded-xl border border-[#e4e8ee] bg-white p-6 text-left"><h2 className="font-semibold">Your digital delivery</h2><div className="mt-4 space-y-2">{state.links.map((link) => <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-lg bg-[#f0efff] px-4 py-3 text-sm font-semibold text-[#5945e8] hover:bg-[#e8e5ff]"><span>{link.title || link.tittle || "Open download"}</span><Download className="size-4" /></a>)}</div></section> : <p className="mt-7 text-sm text-[#697483]">Your creator will share delivery details using the email address provided.</p>}
        <Link to="/" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[#5945e8] px-5 py-3 text-sm font-semibold text-white hover:bg-[#4935d7]"><Home className="size-4" />Explore more products</Link>
      </div>
    </main>
  );
}

export default PurchaseSuccessPage;
