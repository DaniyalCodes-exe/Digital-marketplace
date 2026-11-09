import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Globe2,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import StoreHeader from "@/components/StoreHeader";
import {
  formatPrice,
  getPublicPartners,
  getPublicProductsByPartner,
  productTypeLabel,
  type PublicPartner,
  type PublicProduct,
} from "@/lib/marketplace";

function getExternalUrl(value?: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function PublicPartnerPage() {
  const { slug = "" } = useParams();
  const [partner, setPartner] = useState<PublicPartner | null>(null);
  const [products, setProducts] = useState<PublicProduct[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        setStatus("loading");
        setError("");
        const partners = await getPublicPartners();
        const selectedPartner = partners.find(
          (item) => item.partnerProfile.slug?.toLowerCase() === slug.toLowerCase(),
        );
        if (!selectedPartner) {
          throw new Error("This creator profile is unavailable.");
        }
        const partnerProducts = await getPublicProductsByPartner(selectedPartner._id);
        if (active) {
          setPartner(selectedPartner);
          setProducts(partnerProducts);
          setStatus("ready");
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Could not load this creator.");
          setStatus("error");
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [slug]);

  const socialLinks = useMemo(() => {
    if (!partner) return [];
    const links = partner.partnerProfile.socialLink;
    return [
      { name: "YouTube", url: getExternalUrl(links?.youtube) },
      { name: "Instagram", url: getExternalUrl(links?.instagram) },
      { name: "LinkedIn", url: getExternalUrl(links?.linkedin) },
      { name: "GitHub", url: getExternalUrl(links?.github) },
    ].filter((link): link is typeof link & { url: string } => Boolean(link.url));
  }, [partner]);

  return (
    <main className="min-h-screen bg-[#f6f7fa] text-[#27313d]">
      <StoreHeader />
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:px-10">
        <Link
          to="/#creators"
          className="text-sm font-medium text-[#697483] transition hover:text-[#5945e8]"
        >
          Browse creators
        </Link>

        {status === "loading" ? (
          <p className="py-24 text-center text-sm text-[#7b8694]" role="status">
            Loading creator profile...
          </p>
        ) : status === "error" ? (
          <section className="mt-8 rounded-xl border border-red-200 bg-white p-7 text-sm text-red-700" role="alert">
            {error}
          </section>
        ) : partner ? (
          <>
            <section className="mt-6 overflow-hidden rounded-2xl border border-[#e4e8ee] bg-white shadow-sm">
              <div className="h-28 bg-gradient-to-r from-[#5945e8] via-[#7565ef] to-[#a59bff] sm:h-36" />
              <div className="px-6 pb-7 sm:px-9 sm:pb-9">
                <div className="-mt-12 flex flex-col gap-5 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex items-end gap-4">
                    {getExternalUrl(partner.profilePicture || "") ? (
                      <img
                        src={getExternalUrl(partner.profilePicture || "") || undefined}
                        alt=""
                        className="size-24 rounded-2xl border-4 border-white bg-white object-cover shadow-sm sm:size-28"
                      />
                    ) : (
                      <span className="flex size-24 items-center justify-center rounded-2xl border-4 border-white bg-[#f0efff] text-4xl font-semibold text-[#5945e8] shadow-sm sm:size-28">
                        {partner.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="pb-1">
                      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                        {partner.name}
                      </h1>
                      <p className="mt-1 text-sm text-[#7b8694]">
                        @{partner.partnerProfile.slug}
                      </p>
                    </div>
                  </div>
                  {getExternalUrl(partner.partnerProfile.website) && (
                    <a
                      href={getExternalUrl(partner.partnerProfile.website) || undefined}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#d9d4ff] px-4 py-2.5 text-sm font-semibold text-[#5945e8] transition hover:bg-[#f8f7ff]"
                    >
                      <Globe2 aria-hidden="true" className="size-4" />
                      Visit website
                    </a>
                  )}
                </div>
                {partner.partnerProfile.bio && (
                  <p className="mt-6 max-w-3xl whitespace-pre-wrap text-sm leading-7 text-[#697483]">
                    {partner.partnerProfile.bio}
                  </p>
                )}
                {socialLinks.length > 0 && (
                  <nav aria-label={`${partner.name} social profiles`} className="mt-5 flex flex-wrap gap-2">
                    {socialLinks.map(({ name, url }) => (
                      <a
                        key={name}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg border border-[#e4e8ee] px-3 py-2 text-xs font-medium text-[#697483] transition hover:border-[#d9d4ff] hover:bg-[#f8f7ff] hover:text-[#5945e8]"
                      >
                        <Globe2 aria-hidden="true" className="size-3.5" />
                        {name}
                      </a>
                    ))}
                  </nav>
                )}
                <div className="mt-6 flex flex-wrap gap-3 border-t border-[#edf0f3] pt-5 text-sm">
                  <span className="rounded-lg bg-[#f8f9fb] px-4 py-2 text-[#697483]">
                    <strong className="text-[#27313d]">{products.length}</strong>{" "}
                    {products.length === 1 ? "published product" : "published products"}
                  </span>
                  <span className="rounded-lg bg-[#f8f9fb] px-4 py-2 text-[#697483]">
                    <strong className="text-[#27313d]">{partner.totalSales}</strong> sales
                  </span>
                </div>
              </div>
            </section>

            <section className="mt-10">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#5945e8]">Creator collection</p>
                  <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                    Products by {partner.name}
                  </h2>
                </div>
              </div>
              {products.length ? (
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((product) => (
                    <article
                      key={product._id}
                      className="group flex min-h-64 flex-col rounded-xl border border-[#e4e8ee] bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg hover:shadow-[#5945e8]/10"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-[#f0efff] px-2.5 py-1 text-xs font-semibold text-[#5945e8]">
                          {productTypeLabel(product.type)}
                        </span>
                        <span className="text-sm font-semibold">{formatPrice(product.price)}</span>
                      </div>
                      <h3 className="mt-5 text-lg font-semibold tracking-tight">{product.tittle}</h3>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-[#697483]">
                        {product.description}
                      </p>
                      <Link
                        to={`/products/${encodeURIComponent(product.slug)}`}
                        className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-[#5945e8]"
                      >
                        View product
                        <ArrowRight aria-hidden="true" className="size-4 transition group-hover:translate-x-1" />
                      </Link>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="mt-6 rounded-xl border border-dashed border-[#cbd8e4] bg-white p-10 text-center text-sm text-[#7b8694]">
                  This creator has no published products yet.
                </p>
              )}
            </section>
          </>
        ) : null}
      </div>
      <footer className="mt-12 border-t border-[#e4e8ee] bg-white py-8 text-center text-sm text-[#7b8694]">
        DigiAi · Digital products from independent creators
      </footer>
    </main>
  );
}

export default PublicPartnerPage;
