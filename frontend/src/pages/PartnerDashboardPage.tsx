import { useEffect, useState } from "react";
import { ArrowLeft, RefreshCw, Save, UserRound } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import AccountHeader from "@/components/AccountHeader";
import { useAppDispatch, useGetCurrentUser } from "@/hooks/useGetCurrentUser";
import { setCurrentUser, type CurrentUser } from "@/redux/userslice";

interface PartnerApiResponse {
  success: boolean;
  partner?: CurrentUser;
  message?: string;
}

interface PartnerProfileDraft {
  name: string;
  slug: string;
  bio: string;
  website: string;
  socialLink: {
    youtube: string;
    instagram: string;
    linkedin: string;
    github: string;
  };
}

function getRequestErrorMessage(error: unknown, fallback: string) {
  if (error instanceof TypeError) {
    return "Could not connect to the backend. Check that the gateway and required services are running.";
  }
  return error instanceof Error ? error.message : fallback;
}

async function readApiResponse<T>(response: Response, description: string): Promise<T> {
  try {
    return (await response.json()) as T;
  } catch {
    if (!response.ok) {
      if ([502, 503, 504].includes(response.status)) {
        throw new Error(
          `The backend service is unavailable (HTTP ${response.status}). Check that the gateway and service are running.`,
        );
      }
      throw new Error(`The request failed with HTTP ${response.status}.`);
    }
    throw new Error(`The server returned an unreadable ${description} response.`);
  }
}

const initialProfile: PartnerProfileDraft = {
  name: "",
  slug: "",
  bio: "",
  website: "",
  socialLink: { youtube: "", instagram: "", linkedin: "", github: "" },
};

const inputClassName =
  "mt-2 w-full rounded-lg border border-[#e2e6eb] bg-white px-3.5 py-2.5 text-sm text-[#27313d] outline-none placeholder:text-[#9aa3ae] focus:border-[#5945e8] focus:ring-2 focus:ring-[#5945e8]/10 disabled:bg-[#f3f5f7] disabled:text-[#7b8694]";

const labelClassName = "block text-sm font-medium text-[#46515e]";
const cardClassName = "rounded-xl border border-[#e4e8ee] bg-white p-5 sm:p-6";

function getProfileDraft(user: CurrentUser): PartnerProfileDraft {
  return {
    name: user.name || "",
    slug: user.partnerProfile?.slug || "",
    bio: user.partnerProfile?.bio || "",
    website: user.partnerProfile?.website || "",
    socialLink: {
      youtube: user.partnerProfile?.socialLink?.youtube || "",
      instagram: user.partnerProfile?.socialLink?.instagram || "",
      linkedin: user.partnerProfile?.socialLink?.linkedin || "",
      github: user.partnerProfile?.socialLink?.github || "",
    },
  };
}

function safeExternalUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function PartnerDashboardPage() {
  const { currentUser, isLoading, error } = useGetCurrentUser();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [partner, setPartner] = useState<CurrentUser | null>(null);
  const [profileDraft, setProfileDraft] = useState(initialProfile);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "partner") {
      return;
    }

    const controller = new AbortController();
    const loadPartner = async () => {
      setProfileLoading(true);
      setProfileError(null);
      setPartner(null);

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

        const result = await readApiResponse<PartnerApiResponse>(
          response,
          "partner profile",
        );

        if (!response.ok || !result.success || !result.partner) {
          throw new Error(result.message || "Could not load your partner profile.");
        }

        setPartner(result.partner);
        setProfileDraft(getProfileDraft(result.partner));
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }
        setProfileError(
          getRequestErrorMessage(loadError, "Could not load your partner profile."),
        );
      } finally {
        if (!controller.signal.aborted) {
          setProfileLoading(false);
        }
      }
    };

    void loadPartner();
    return () => controller.abort();
  }, [currentUser, refreshKey]);

  if (isLoading || (!currentUser && !error)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f6f7fa] text-[#27313d]">
        <p role="status">Loading your partner dashboard...</p>
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
      <main className="flex min-h-screen items-center justify-center bg-[#f6f7fa] px-4 text-[#27313d]">
        <p role="alert" className="text-sm text-[#697483]">This area is for partner accounts.</p>
      </main>
    );
  }

  const displayedUser = partner ?? currentUser;
  const publicProfile = partner?.partnerProfile;

  const updateProfileField = (
    field: "name" | "slug" | "bio" | "website",
    value: string,
  ) => {
    setProfileDraft((draft) => ({ ...draft, [field]: value }));
    setSaveError(null);
    setSaveSuccess(null);
  };

  const handleSave = async () => {
    if (!partner) {
      return;
    }

    setSaveError(null);
    setSaveSuccess(null);
    const slug = profileDraft.slug.trim().toLowerCase();
    const website = profileDraft.website.trim();
    if (!profileDraft.name.trim()) {
      setSaveError("Enter your display name.");
      return;
    }
    if (!slug) {
      setSaveError("A profile slug is required.");
      return;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setSaveError("Use lowercase letters, numbers, and single hyphens in your profile slug.");
      return;
    }
    if (website && !safeExternalUrl(website)) {
      setSaveError("Enter a website address starting with http:// or https://.");
      return;
    }
    const socialUrls = Object.values(profileDraft.socialLink);
    if (socialUrls.some((url) => url.trim() && !safeExternalUrl(url))) {
      setSaveError("Enter valid http:// or https:// URLs for your social links.");
      return;
    }
    setIsSaving(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "");
      if (!backendUrl) {
        throw new Error("VITE_BACKEND_URL is not configured.");
      }

      const response = await fetch(`${backendUrl}/api/partner/update`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileDraft.name.trim(),
          newpartnerProfile: {
            slug,
            bio: profileDraft.bio.trim(),
            website,
            socialLink: {
              youtube: profileDraft.socialLink.youtube.trim(),
              instagram: profileDraft.socialLink.instagram.trim(),
              linkedin: profileDraft.socialLink.linkedin.trim(),
              github: profileDraft.socialLink.github.trim(),
            },
          },
        }),
      });

      const result = await readApiResponse<PartnerApiResponse>(
        response,
        "save",
      );

      if (!response.ok || !result.success || !result.partner) {
        throw new Error(result.message || "Could not save your partner details.");
      }

      setPartner(result.partner);
      setProfileDraft(getProfileDraft(result.partner));
      dispatch(setCurrentUser(result.partner));
      setSaveSuccess("Your profile has been saved. Opening product management...");
      navigate("/products", {
        state: { notice: "Your partner profile is ready. Create or manage products here." },
      });
    } catch (saveFailure) {
      setSaveError(
        getRequestErrorMessage(saveFailure, "Could not save your partner details."),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f6f7fa] text-[#27313d]">
      <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:px-10">
        <AccountHeader currentUser={displayedUser} />

        <div className="py-8">
          <Link
            to="/home"
            className="inline-flex items-center gap-2 text-sm text-[#697483] hover:text-[#5945e8]"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to home
          </Link>
          <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#5945e8]">Partner profile</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                Hello, {displayedUser.name.split(" ")[0] || "creator"}
              </h1>
              <p className="mt-2 text-sm text-[#697483]">
                Set up your creator profile. Manage products on the separate products page.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {partner && (
                <span className="inline-flex items-center gap-2 rounded-full border border-[#e2e6eb] bg-white px-3 py-1.5 text-xs text-[#46515e]">
                  <span
                    className={`size-2 rounded-full ${partner.isActive === false ? "bg-red-500" : "bg-emerald-500"}`}
                  />
                  {partner.isActive === false ? "Account inactive" : "Account active"}
                </span>
              )}
            </div>
          </div>
        </div>

        {(saveError || saveSuccess) && (
          <div
            className={`mb-5 rounded-lg border px-4 py-3 text-sm ${
              saveError
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
            role={saveError ? "alert" : "status"}
            aria-live="polite"
          >
            {saveError || saveSuccess}
          </div>
        )}

        {profileLoading ? (
          <div className={`${cardClassName} flex items-center gap-3 text-sm text-[#697483]`} role="status">
            <RefreshCw aria-hidden="true" className="size-4 animate-spin" />
            Loading your partner details...
          </div>
        ) : profileError ? (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-red-200 bg-white p-5">
            <p className="text-sm text-red-700" role="alert">{profileError}</p>
            <button
              type="button"
              onClick={() => setRefreshKey((key) => key + 1)}
              className="rounded-lg border border-[#e2e6eb] px-3 py-2 text-sm font-medium hover:bg-[#f6f7fa]"
            >
              Try again
            </button>
          </div>
        ) : partner ? (
          <>
            <section className={`${cardClassName} mt-5`}>
                <div className="flex items-center gap-3 border-b border-[#edf0f3] pb-4">
                  <UserRound aria-hidden="true" className="size-5 text-[#5945e8]" />
                  <div>
                    <h2 className="font-semibold">Creator profile</h2>
                    <p className="mt-1 text-xs text-[#7b8694]">Your profile details and social links.</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className={labelClassName}>
                    Display name
                    <input
                      className={inputClassName}
                      value={profileDraft.name}
                      onChange={(event) => updateProfileField("name", event.target.value)}
                      autoComplete="name"
                      maxLength={100}
                      required
                    />
                  </label>
                  <label className={labelClassName}>
                    Profile slug
                    <input
                      className={inputClassName}
                      value={profileDraft.slug}
                      onChange={(event) => updateProfileField("slug", event.target.value)}
                      placeholder="your-creator-name"
                      disabled={Boolean(publicProfile?.slug)}
                      pattern="[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*"
                      title="Use letters, numbers, and single hyphens."
                      required
                    />
                    <span className="mt-1.5 block text-xs font-normal text-[#7b8694]">
                      {publicProfile?.slug ? "Your slug cannot be changed." : "Choose carefully; it cannot be changed later."}
                    </span>
                  </label>
                  <label className={`${labelClassName} sm:col-span-2`}>
                    Bio
                    <textarea
                      className={`${inputClassName} min-h-24 resize-y`}
                      value={profileDraft.bio}
                      onChange={(event) => updateProfileField("bio", event.target.value)}
                      placeholder="Tell people about what you create."
                      maxLength={500}
                    />
                  </label>
                  <label className={`${labelClassName} sm:col-span-2`}>
                    Website
                    <input
                      className={inputClassName}
                      type="url"
                      value={profileDraft.website}
                      onChange={(event) => updateProfileField("website", event.target.value)}
                      placeholder="https://yourwebsite.com"
                    />
                  </label>
                </div>

                <div className="mt-5 border-t border-[#edf0f3] pt-5">
                  <h3 className="text-sm font-medium">Social links</h3>
                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    {(
                      [
                        ["youtube", "YouTube"],
                        ["instagram", "Instagram"],
                        ["linkedin", "LinkedIn"],
                        ["github", "GitHub"],
                      ] as const
                    ).map(([field, label]) => (
                      <label key={field} className={labelClassName}>
                        {label}
                        <input
                          className={inputClassName}
                          type="url"
                          value={profileDraft.socialLink[field]}
                          onChange={(event) => {
                            setProfileDraft((draft) => ({
                              ...draft,
                              socialLink: {
                                ...draft.socialLink,
                                [field]: event.target.value,
                              },
                            }));
                            setSaveError(null);
                            setSaveSuccess(null);
                          }}
                          placeholder="https://"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-5 flex justify-end border-t border-[#edf0f3] pt-4">
                  <button
                    type="button"
                    onClick={() => void handleSave()}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#5945e8] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4935d7] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Save aria-hidden="true" className="size-4" />
                    {isSaving ? "Saving..." : "Save profile"}
                  </button>
                </div>
            </section>
          </>
        ) : null}

        <footer className="mt-8 border-t border-[#e4e8ee] py-5 text-center text-xs text-[#7b8694]">
          Partner dashboard
        </footer>
      </div>
    </main>
  );
}

export default PartnerDashboardPage;
