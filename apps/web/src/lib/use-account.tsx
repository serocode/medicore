import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiFetch } from "./api-client";
import { useSession } from "./auth-client";
import type { AccountProfile } from "./types";

interface AccountState {
  data: AccountProfile | null;
  isLoading: boolean;
  error: string | null;
  /**
   * Adopt an account the server has just returned. The nav bar reads the same
   * value, so a name or photo change is visible everywhere immediately —
   * without a second round trip, and without waiting for the auth session's
   * own cached copy of the name to catch up.
   */
  setAccount: (account: AccountProfile) => void;
}

type AccountSnapshot = Omit<AccountState, "setAccount">;

const AccountContext = createContext<AccountState | null>(null);

/**
 * The signed-in person's own account: name in parts, plus their photo.
 *
 * Held once for the whole app rather than per screen, because the nav bar and
 * the account page show the same thing and must never disagree. Separate from
 * usePatientProfile because it is account-level rather than clinical — every
 * role has one, including staff and administrators with no patient record.
 */
export function AccountProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending: isSessionPending } = useSession();
  const userId = session?.user.id ?? null;
  const [state, setState] = useState<AccountSnapshot>({
    data: null,
    isLoading: true,
    error: null,
  });

  const load = useCallback(() => {
    let cancelled = false;
    apiFetch<{ account: AccountProfile }>("/api/account/me")
      .then((result) => {
        if (!cancelled) setState({ data: result.account, isLoading: false, error: null });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          data: null,
          isLoading: false,
          error: error instanceof Error ? error.message : "Failed to load your account",
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Keyed on the user so signing in loads the account and signing out drops
  // it. With no session there is nothing to fetch and nothing to report — the
  // public pages must not show an account error.
  useEffect(() => {
    if (userId) return load();
    setState({ data: null, isLoading: isSessionPending, error: null });
  }, [userId, isSessionPending, load]);

  const setAccount = useCallback((account: AccountProfile) => {
    setState({ data: account, isLoading: false, error: null });
  }, []);

  const value = useMemo(() => ({ ...state, setAccount }), [state, setAccount]);

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount(): AccountState {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error("useAccount must be used within an <AccountProvider>");
  }
  return context;
}
