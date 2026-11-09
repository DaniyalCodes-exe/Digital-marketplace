import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  BookOpen,
  Braces,
  FileText,
  Layers3,
  Link2,
  Palette,
  Sparkles,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import StoreHeader from "@/components/StoreHeader";

const categories = [
  { title: "Courses", description: "Learn practical new skills.", Icon: BookOpen },
  { title: "Source code", description: "Start building faster.", Icon: Braces },
  { title: "Templates", description: "Ready-to-use creative assets.", Icon: Layers3 },
  { title: "Ebooks", description: "Ideas and knowledge to keep.", Icon: FileText },
  { title: "AI prompts", description: "Get more from your AI tools.", Icon: Sparkles },
  { title: "Design assets", description: "Polished digital resources.", Icon: Palette },
];

function ProductIllustration() {
  return (
    <div className="relative mx-auto flex aspect-[1.08/1] w-full max-w-[500px] items-center justify-center overflow-hidden rounded-[2rem] border border-white/80 bg-white/70 p-5 shadow-[0_24px_70px_-35px_rgba(89,69,232,0.35)] backdrop-blur sm:p-8">
      <div className="absolute inset-5 rounded-[1.5rem] bg-gradient-to-br from-[#f3f1ff] via-white to-[#eefaff]" />
      <svg
        viewBox="0 0 480 380"
        role="img"
        aria-label="Abstract connected digital products illustration"
        className="relative z-10 h-full w-full"
        fill="none"
      >
        <defs>
          <linearGradient id="cube" x1="120" y1="100" x2="250" y2="260" gradientUnits="userSpaceOnUse">
            <stop stopColor="#C7C4FF" />
            <stop offset="1" stopColor="#7668E8" />
          </linearGradient>
          <linearGradient id="ring" x1="292" y1="224" x2="412" y2="310" gradientUnits="userSpaceOnUse">
            <stop stopColor="#AA9EFF" />
            <stop offset="1" stopColor="#5945E8" />
          </linearGradient>
          <radialGradient id="sphere" cx="0" cy="0" r="1" gradientTransform="matrix(74 89 -89 74 319 91)" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F4F2FF" />
            <stop offset=".55" stopColor="#C6C1FF" />
            <stop offset="1" stopColor="#7668E8" />
          </radialGradient>
          <filter id="shadow" x="85" y="58" width="330" height="284" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="9" />
          </filter>
        </defs>
        <g opacity=".32" stroke="#8D83E9" strokeWidth="2">
          <path d="m108 166 98-71 101 31 76 74-88 91-107-28-80-97Z" />
          <path d="m108 166 187 125M206 95l89 196m12-165 76 74m-76-74-101 71m101-71-88 91m88-91 88 74m-88 17-107-28m107 28 88-17" />
        </g>
        <g filter="url(#shadow)" opacity=".2">
          <path d="m142 127 61-36 66 38v75l-64 37-63-38v-76Z" fill="#5945E8" />
        </g>
        <path d="m142 118 63-37 66 38v75l-64 37-65-38v-75Z" fill="url(#cube)" />
        <path d="m142 118 65 38 64-37m-64 37v75m0-75-65-38" stroke="white" strokeOpacity=".8" strokeWidth="3" />
        <path d="m174 129 31-18 33 19v38l-32 19-32-19v-39Z" fill="#F6F5FF" fillOpacity=".72" stroke="white" strokeWidth="2" />
        <circle cx="318" cy="91" r="47" fill="url(#sphere)" />
        <circle cx="306" cy="78" r="11" fill="white" fillOpacity=".48" />
        <ellipse cx="347" cy="111" rx="8" ry="12" fill="#7869E8" fillOpacity=".38" />
        <path d="M288 257c0-22 28-40 62-40s62 18 62 40-28 40-62 40-62-18-62-40Z" fill="#5142C8" fillOpacity=".16" />
        <path d="M288 237c0-22 28-40 62-40s62 18 62 40-28 40-62 40-62-18-62-40Z" fill="url(#ring)" />
        <path d="M322 237c0-10 13-18 28-18s28 8 28 18-13 18-28 18-28-8-28-18Z" fill="#F4F3FF" />
        <path d="M288 237c0 22 28 40 62 40s62-18 62-40m-90 0c0 10 13 18 28 18s28-8 28-18" stroke="white" strokeOpacity=".7" strokeWidth="2" />
        <g fill="#5945E8" stroke="white" strokeWidth="4">
          <circle cx="108" cy="166" r="10" />
          <circle cx="206" cy="95" r="10" />
          <circle cx="307" cy="126" r="10" />
          <circle cx="383" cy="200" r="10" />
          <circle cx="295" cy="291" r="10" />
          <circle cx="188" cy="263" r="10" />
        </g>
        <circle cx="116" cy="107" r="5" fill="#9A8DF2" />
        <circle cx="390" cy="131" r="5" fill="#9A8DF2" />
        <circle cx="250" cy="321" r="5" fill="#9A8DF2" />
        <path d="M119 100v-14m-7 7h14m248 25v-14m-7 7h14m-92 207v-14m-7 7h14" stroke="#8A7EE7" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="absolute left-9 top-1/3 flex size-9 items-center justify-center rounded-xl border border-white bg-white/90 text-[#5945e8] shadow-sm">
        <Braces aria-hidden="true" className="size-4" />
      </span>
      <span className="absolute bottom-9 right-10 flex size-10 items-center justify-center rounded-full border border-white bg-white/90 text-[#5945e8] shadow-sm">
        <Sparkles aria-hidden="true" className="size-4" />
      </span>
    </div>
  );
}

function MarketplacePage() {
  const navigate = useNavigate();
  const [sharedLink, setSharedLink] = useState("");
  const [linkError, setLinkError] = useState("");

  const openSharedProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLinkError("");
    const value = sharedLink.trim();
    if (!value) {
      setLinkError("Paste the product link shared by the creator.");
      return;
    }

    try {
      const url = new URL(value, window.location.origin);
      const pathMatch = url.pathname.match(/^\/products\/([^/]+)\/?$/);
      if (!pathMatch) {
        setLinkError("Enter a DigiAi product link, such as /products/product-name.");
        return;
      }
      const slug = decodeURIComponent(pathMatch[1] || "");
      if (!slug) {
        setLinkError("That product link is incomplete.");
        return;
      }
      navigate(`/products/${encodeURIComponent(slug)}`);
    } catch {
      setLinkError("Enter a valid product link.");
    }
  };

  return (
    <main className="min-h-screen bg-white text-[#202431]">
      <StoreHeader />
      <section className="relative overflow-hidden bg-gradient-to-br from-[#f2f4ff] via-white to-[#effbfc]">
        <div className="mx-auto grid min-h-[520px] max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 md:grid-cols-2 md:py-20 lg:min-h-[570px] lg:px-10">
          <div className="relative z-10">
            <span className="inline-flex items-center rounded-full bg-[#e6e8ff] px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#5142c8]">
              Premium marketplace
            </span>
            <h1 className="mt-6 max-w-xl text-4xl font-semibold leading-[1.12] tracking-tight sm:text-5xl">
              Discover Premium Digital Products Built by Creators
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[#697483]">
              Buy courses, source codes, templates, AI prompts, ebooks and digital assets from trusted creators. Elevate your projects with top-tier resources.
            </p>
            <Link
              to="/login"
              className="mt-7 inline-flex items-center gap-2 rounded-lg bg-[#5142e8] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#4334d5]"
            >
              Become a Partner
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <p className="mt-3 text-xs text-[#7b8694]">
              Customers can buy from a shared product link without signing in.
            </p>
          </div>
          <div className="relative">
            <div className="absolute -inset-10 rounded-full bg-[#7565ef]/10 blur-3xl" />
            <ProductIllustration />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-10 pt-12 text-center sm:px-8 lg:px-10">
        <h2 className="text-xl font-semibold tracking-tight">Popular Categories</h2>
        <p className="mt-2 text-sm text-[#7b8694]">
          Explore the kinds of high-quality digital assets available from creators.
        </p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map(({ title, description, Icon }) => (
            <article
              key={title}
              className="flex items-center gap-4 rounded-xl border border-[#e8eaf0] bg-white p-4 text-left transition hover:border-[#d7d2ff] hover:shadow-sm"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#f0efff] text-[#5945e8]">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold">{title}</span>
                <span className="mt-1 block text-xs text-[#7b8694]">{description}</span>
              </span>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-16 pt-6 sm:px-8">
        <div className="rounded-2xl border border-[#e4e8ee] bg-[#f8f9fc] p-6 sm:p-8">
          <div className="mx-auto max-w-xl text-center">
            <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-white text-[#5945e8] shadow-sm">
              <Link2 aria-hidden="true" className="size-5" />
            </span>
            <h2 className="mt-4 text-xl font-semibold">Have a product link?</h2>
            <p className="mt-2 text-sm leading-6 text-[#697483]">
              Paste the link your creator shared to view the product and continue to secure Razorpay checkout. No sign-in required.
            </p>
            <form onSubmit={openSharedProduct} className="mt-5 text-left">
              <label htmlFor="shared-product-link" className="text-sm font-medium text-[#46515e]">
                Product link
              </label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  id="shared-product-link"
                  value={sharedLink}
                  onChange={(event) => setSharedLink(event.target.value)}
                  placeholder="Paste the link shared by the creator"
                  className="min-w-0 flex-1 rounded-lg border border-[#e2e6eb] bg-white px-3.5 py-3 text-sm outline-none transition focus:border-[#5945e8] focus:ring-4 focus:ring-[#5945e8]/10"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#5142e8] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#4334d5]"
                >
                  Open product
                  <ArrowRight aria-hidden="true" className="size-4" />
                </button>
              </div>
              {linkError && <p role="alert" className="mt-2 text-sm text-red-700">{linkError}</p>}
            </form>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#e8eaf0] bg-white py-6 text-center text-xs text-[#7b8694]">
        DigiAi · Digital products from independent creators
      </footer>
    </main>
  );
}

export default MarketplacePage;
