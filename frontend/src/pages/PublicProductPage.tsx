import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Download, ShieldCheck } from "lucide-react";
import { Link, useLocation, useParams } from "react-router-dom";
import StoreHeader from "@/components/StoreHeader";
import { formatPrice, getPublishedProduct, productTypeLabel, type PublicProduct } from "@/lib/marketplace";

function PublicProductPage() {
  const { slug = "" } = useParams();
  const location = useLocation();
  const [product, setProduct] = useState<PublicProduct | null>(null);
  const [error, setError] = useState("");
  const paymentState =
    typeof location.state === "object" && location.state !== null
      ? location.state
      : null;
  const paymentComplete =
    paymentState !== null &&
    "paymentComplete" in paymentState &&
    paymentState.paymentComplete === true &&
    "productSlug" in paymentState &&
    paymentState.productSlug === slug;
  const downloadLinks =
    paymentComplete &&
    "links" in paymentState &&
    Array.isArray(paymentState.links)
      ? paymentState.links.filter(
          (link): link is { title?: string; tittle?: string; url: string } => {
            if (
              typeof link !== "object" ||
              link === null ||
              !("url" in link) ||
              typeof link.url !== "string"
            ) {
              return false;
            }
            try {
              const url = new URL(link.url);
              return url.protocol === "https:" || url.protocol === "http:";
            } catch {
              return false;
            }
          },
        )
      : [];

  useEffect(() => {
    void (async () => {
      try { setProduct(await getPublishedProduct(slug)); } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "This product is unavailable."); }
    })();
  }, [slug]);

  return (
    <main className="min-h-screen bg-[#f6f7fa] text-[#27313d]">
      <StoreHeader />
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:px-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-[#697483] hover:text-[#5945e8]">
          <ArrowLeft className="size-4" />
          Back to explore
        </Link>
        {error ? (
          <section className="mt-10 rounded-xl border border-red-200 bg-white p-8 text-red-700">{error}</section>
        ) : !product ? (
          <p className="py-20 text-center text-sm text-[#7b8694]">Loading product...</p>
        ) : (
          <section className="mt-8 grid gap-8 lg:grid-cols-[1.25fr_.75fr]">
            <article className="rounded-xl border border-[#e4e8ee] bg-white p-7 sm:p-10">
              <span className="rounded-full bg-[#f0efff] px-3 py-1.5 text-xs font-semibold text-[#5945e8]">
                {productTypeLabel(product.type)}
              </span>
              <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{product.tittle}</h1>
              <p className="mt-6 whitespace-pre-wrap text-base leading-8 text-[#697483]">{product.description}</p>
              <div className="mt-10 grid gap-3 border-t border-[#edf0f3] pt-7 sm:grid-cols-3">
                {["Digital delivery", "Secure payment", "Ready after purchase"].map((benefit) => (
                  <p key={benefit} className="flex items-center gap-2 text-sm font-medium">
                    <Check className="size-4 text-[#5945e8]" />
                    {benefit}
                  </p>
                ))}
              </div>
            </article>
            <aside className="h-fit rounded-xl border border-[#e4e8ee] bg-white p-6 shadow-sm">
              <p className="text-sm text-[#697483]">One-time purchase</p>
              <p className="mt-2 text-4xl font-semibold">{formatPrice(product.price)}</p>
              <Link
                to={`/checkout/${encodeURIComponent(product.slug)}`}
                className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-[#5945e8] px-4 py-3.5 text-sm font-semibold text-white hover:bg-[#4935d7]"
              >
                Buy now
                <ArrowRight className="size-4" />
              </Link>
              <p className="mt-4 flex items-center gap-2 text-xs leading-5 text-[#697483]">
                <ShieldCheck className="size-4 shrink-0 text-[#5945e8]" />
                Payments are handled securely through Razorpay.
              </p>
            </aside>
          </section>
        )}
        {product && paymentComplete && (
          <section
            aria-labelledby="included-resources-heading"
            className="mt-6 rounded-xl border border-[#e4e8ee] bg-white p-6 sm:p-8"
          >
            <h2
              id="included-resources-heading"
              className="flex items-center gap-2 text-lg font-semibold"
            >
              <Download aria-hidden="true" className="size-5 text-[#5945e8]" />
              Included resources
            </h2>
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
              Your payment is successful. Download your purchased resources below.
            </p>
            {downloadLinks.length ? (
              <div className="mt-4 space-y-2">
                {downloadLinks.map((link, index) => (
                  <a
                    key={`${link.url}-${index}`}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="flex items-center justify-between gap-3 rounded-lg border border-[#edf0f3] bg-[#f8f9fb] px-4 py-3 text-sm font-semibold text-[#303a47] hover:border-[#d9d4ff] hover:bg-[#f8f7ff]"
                  >
                    <span className="min-w-0 break-all">
                      {link.title || link.tittle || "Download"}
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-2 rounded-md bg-[#20242c] px-3 py-2 text-xs text-white">
                      <Download aria-hidden="true" className="size-3.5" />
                      Download
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-[#697483]">
                No download files were added for this product. Please contact the creator.
              </p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

export default PublicProductPage;
