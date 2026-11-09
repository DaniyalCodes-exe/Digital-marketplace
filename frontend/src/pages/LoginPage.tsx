import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { BrainCircuit } from "lucide-react";
import { signInWithPopup, type UserCredential } from "firebase/auth";
import { useLocation, useNavigate } from "react-router-dom";
import { auth, provider } from "@/utils/firebase";
import { useAppDispatch } from "@/hooks/useGetCurrentUser";
import { setCurrentUser } from "@/redux/userslice";

type Notice = {
  kind: "success" | "error";
  text: string;
};

type BackendAuthResult = {
  success: boolean;
  sessionCreated: boolean;
  userDoc: {
    _id: string;
    firebaseuid: string;
    name: string;
    email: string;
    profilePicture: string | null;
    role: string;
    partnerProfile: {
      slug: string | null;
      bio: string;
      website: string;
      socialLink: {
        youtube: string;
        instagram: string;
        linkedin: string;
        github: string;
      };
    };
    totalSales: number;
    totalRevenue: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
};

const createBackendSession = async (credential: UserCredential) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "");
  if (!backendUrl) {
    throw new Error("VITE_BACKEND_URL is not configured.");
  }

  const token = await credential.user.getIdToken();
  const response = await fetch(`${backendUrl}/api/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  let result: BackendAuthResult | { success?: false; message?: string };
  try {
    result = await response.json();
  } catch {
    throw new Error("The authentication service returned an unreadable response.");
  }

  if (!response.ok || !result.success || !result.sessionCreated) {
    throw new Error(
      "message" in result && result.message
        ? result.message
        : "The authentication service could not complete sign-in.",
    );
  }

  return result;
};

const getAuthErrorMessage = (error: unknown) => {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = error.code;
    if (typeof code === "string") {
      switch (code) {
        case "auth/popup-closed-by-user":
          return "Google sign-in was cancelled.";
        case "auth/popup-blocked":
          return "The sign-in popup was blocked. Allow popups and try again.";
        case "auth/unauthorized-domain":
          return "This domain is not authorized for Firebase sign-in.";
        case "auth/network-request-failed":
          return "A network error occurred. Check your connection and try again.";
      }
    }
  }

  return error instanceof Error ? error.message : "Google sign-in failed. Please try again.";
};

const logSuccessfulSignIn = async (
  credential: UserCredential,
  result: BackendAuthResult,
) => {
  if (!import.meta.env.DEV) {
    return;
  }

  try {
    const tokenResult = await credential.user.getIdTokenResult();
    console.info("Google sign-in successful", {
      operationType: credential.operationType,
      user: {
        uid: credential.user.uid,
        email: credential.user.email,
        displayName: credential.user.displayName,
        providerId: credential.providerId,
      },
      token: {
        available: Boolean(tokenResult.token),
        issuedAt: tokenResult.issuedAtTime,
        expiresAt: tokenResult.expirationTime,
        value: "[REDACTED]",
      },
      backend: {
        sessionCreated: result.sessionCreated,
        profile: result.userDoc,
      },
    });
  } catch {
    console.warn("Sign-in succeeded, but diagnostic metadata could not be read.");
  }
};

function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [notice, setNotice] = useState<Notice | null>(() =>
    location.state?.signedOut
      ? { kind: "success", text: "Signed out successfully." }
      : null,
  );
  const dispatch = useAppDispatch();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setNotice(null);

    try {
      const credential = await signInWithPopup(auth, provider);
      const result = await createBackendSession(credential);
      dispatch(
        setCurrentUser({
          ...result.userDoc,
          profilePicture:
            result.userDoc.profilePicture || credential.user.photoURL,
        }),
      );
      await logSuccessfulSignIn(credential, result);
      navigate(result.userDoc.role === "admin" ? "/admin" : "/home", { replace: true });
    } catch (error) {
      setNotice({ kind: "error", text: getAuthErrorMessage(error) });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f6f7fa] px-4 py-10 text-[#27313d]">
      <div className="pointer-events-none absolute -left-40 -top-40 size-[30rem] rounded-full bg-[#e5e1ff]/70 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-48 -right-36 size-[34rem] rounded-full bg-[#eeecff]/80 blur-[140px]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 size-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e9e6ff]/50 blur-[130px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(89,69,232,0.06),transparent_55%)]" />

      <section className="relative z-10 w-full max-w-[440px]">
        <div className="absolute -inset-px rounded-[2rem] bg-gradient-to-br from-[#5945e8]/15 via-[#e4e8ee] to-[#5945e8]/10 blur-sm" />
        <div className="relative overflow-hidden rounded-[2rem] border border-[#e4e8ee] bg-white/95 p-7 shadow-[0_30px_100px_rgba(38,51,47,0.12)] backdrop-blur-xl sm:p-10">
          <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full border border-[#e4e8ee]" />
          <div className="pointer-events-none absolute -right-12 -top-16 size-48 rounded-full border border-[#e5e1ff]" />

          <header className="relative mb-8 text-center">
            <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl border border-[#5945e8]/15 bg-[#5945e8] shadow-[0_8px_35px_rgba(89,69,232,0.16)]">
              <BrainCircuit aria-hidden="true" className="size-9 text-white" strokeWidth={1.8} />
            </div>
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.34em] text-[#5945e8]">
              Welcome
            </p>
            <h1 className="font-serif text-4xl font-medium tracking-tight text-[#27313d]">
              Digi<span className="text-[#5945e8]">Ai</span>
            </h1>
            <p className="mt-3 text-sm text-[#697483]">
              Sign in or create your creator account to continue
            </p>
          </header>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#5945e8] bg-[#5945e8] px-4 py-3 text-sm font-semibold text-white shadow-[0_6px_25px_rgba(38,51,47,0.12)] transition hover:bg-[#4935d7] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FcGoogle className="size-5" />
            {isLoading ? "Connecting..." : "Continue with Google"}
          </button>

          {notice && (
            <p
              role="status"
              aria-live="polite"
              className={`mt-5 rounded-xl border px-4 py-3 text-sm leading-relaxed ${
                notice.kind === "error"
                  ? "border-red-300/20 bg-red-950/30 text-red-200"
                  : "border-emerald-300/20 bg-emerald-950/30 text-emerald-200"
              }`}
            >
              {notice.text}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
