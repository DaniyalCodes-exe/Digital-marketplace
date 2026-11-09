import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { BrainCircuit, ChevronDown, LogOut } from "lucide-react";
import { useAppDispatch } from "@/hooks/useGetCurrentUser";
import { clearCurrentUser, type CurrentUser } from "@/redux/userslice";
import { auth } from "@/utils/firebase";

interface AccountHeaderProps {
  currentUser: CurrentUser;
}

function AccountHeader({ currentUser }: AccountHeaderProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [firebasePhotoUrl, setFirebasePhotoUrl] = useState<string | null>(null);
  const [failedPhotoUrl, setFailedPhotoUrl] = useState<string | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setFirebasePhotoUrl(firebaseUser?.photoURL ?? null);
    });

    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, "");
      if (!backendUrl) {
        throw new Error("VITE_BACKEND_URL is not configured.");
      }

      const response = await fetch(`${backendUrl}/api/auth/logout`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("The server could not end your session. Please try again.");
      }

      const result: { success?: boolean; message?: string } = await response.json();
      if (!result.success) {
        throw new Error(result.message || "The server could not end your session.");
      }

      await signOut(auth);
      dispatch(clearCurrentUser());
      navigate("/login", { replace: true, state: { signedOut: true } });
    } catch (logoutFailure) {
      setLogoutError(
        logoutFailure instanceof Error
          ? logoutFailure.message
          : "Sign out failed. Please try again.",
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  const initials = currentUser.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || currentUser.email[0]?.toUpperCase() || "U";
  const profilePicture = currentUser.profilePicture || firebasePhotoUrl;

  return (
    <>
      <header className="flex items-center justify-between border-b border-[#e4e8ee] pb-5">
        <Link to="/home" className="flex items-center gap-3" aria-label="DigiAi home">
          <span className="flex size-10 items-center justify-center rounded-lg bg-[#5945e8] text-white">
            <BrainCircuit aria-hidden="true" className="size-6" />
          </span>
          <span className="text-xl font-semibold tracking-tight text-[#27313d]">
            Digi<span className="text-[#5945e8]">Ai</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="max-w-48 truncate text-sm font-medium text-[#27313d]">
              {currentUser.name}
            </p>
            <p className="max-w-48 truncate text-xs text-[#7b8694]">
              {currentUser.email}
            </p>
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((isOpen) => !isOpen)}
              aria-label="Open profile options"
              aria-haspopup="menu"
              aria-expanded={isProfileMenuOpen}
              aria-controls="profile-menu"
              className="flex items-center gap-2 rounded-full p-1 transition hover:bg-[#f0efff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5945e8]"
            >
              {profilePicture && failedPhotoUrl !== profilePicture ? (
                <img
                  src={profilePicture}
                  alt=""
                  className="size-10 rounded-full border border-[#e2e6eb] object-cover"
                  referrerPolicy="no-referrer"
                  onError={() => setFailedPhotoUrl(profilePicture)}
                />
              ) : (
                <span className="flex size-10 items-center justify-center rounded-full border border-[#e2e6eb] bg-[#f0efff] text-sm font-semibold text-[#5945e8]">
                  {initials}
                </span>
              )}
              <ChevronDown aria-hidden="true" className="size-4 text-[#7b8694]" />
            </button>
            {isProfileMenuOpen && (
              <div
                id="profile-menu"
                role="menu"
                className="absolute right-0 top-full z-30 mt-3 w-64 rounded-xl border border-[#e4e8ee] bg-white p-3 shadow-lg shadow-black/10"
              >
                <div className="border-b border-[#edf0f3] px-3 pb-3">
                  <p className="truncate text-sm font-semibold text-[#27313d]">
                    {currentUser.name}
                  </p>
                  <p className="mt-1 truncate text-xs text-[#7b8694]">
                    {currentUser.email}
                  </p>
                  <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-[#5945e8]">
                    {currentUser.role}
                  </p>
                </div>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    void handleLogout();
                  }}
                  disabled={isLoggingOut}
                  className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-[#46515e] transition hover:bg-[#f3f5f7] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogOut aria-hidden="true" className="size-4" />
                  {isLoggingOut ? "Signing out..." : "Sign out"}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      {logoutError && (
        <p
          role="alert"
          className="fixed bottom-5 right-5 z-40 max-w-sm rounded-xl border border-red-200 bg-white px-4 py-3 text-sm text-red-700 shadow-xl"
        >
          {logoutError}
        </p>
      )}
    </>
  );
}

export default AccountHeader;
