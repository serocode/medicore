import { useCallback, useEffect, useState } from "react";
import { ApiError, apiFetch } from "../lib/api-client";
import { useSession } from "../lib/auth-client";
import type { StaffInvite, UserAccount, UserAccountRole } from "../lib/types";
import { Button } from "./Button";
import { Field, Select, TextInput } from "./Field";

interface StaffOverview {
  accounts: UserAccount[];
  pendingInvites: StaffInvite[];
}

const ROLE_LABELS: Record<UserAccountRole, string> = {
  patient: "Patient",
  doctor: "Doctor",
  nurse: "Nurse",
  admin: "Administrator",
};

export function StaffManagementSection() {
  const { data: session } = useSession();
  const ownUserId = session?.user.id;

  const [overview, setOverview] = useState<StaffOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"doctor" | "nurse" | "admin">("nurse");
  const [inviteError, setInviteError] = useState<string | undefined>(undefined);
  const [isInviting, setIsInviting] = useState(false);

  const refresh = useCallback(() => {
    setError(null);
    apiFetch<StaffOverview>("/api/admin/staff")
      .then(setOverview)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Failed to load staff"),
      );
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function changeRole(userId: string, role: UserAccountRole) {
    setBusyUserId(userId);
    setError(null);
    try {
      await apiFetch(`/api/admin/staff/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change role");
    } finally {
      setBusyUserId(null);
    }
  }

  async function toggleDisabled(account: UserAccount) {
    setBusyUserId(account.id);
    setError(null);
    try {
      await apiFetch(`/api/admin/staff/${account.id}`, {
        method: "PATCH",
        body: JSON.stringify({ disabled: !account.disabledAt }),
      });
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update account status");
    } finally {
      setBusyUserId(null);
    }
  }

  async function sendInvite() {
    setInviteError(undefined);
    setIsInviting(true);
    try {
      await apiFetch("/api/admin/invites", {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      setInviteEmail("");
      refresh();
    } catch (err) {
      setInviteError(
        err instanceof ApiError ? err.message : "Failed to invite — check the email address",
      );
    } finally {
      setIsInviting(false);
    }
  }

  async function revokeInvite(email: string) {
    setError(null);
    try {
      await apiFetch(`/api/admin/invites/${encodeURIComponent(email)}`, { method: "DELETE" });
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke invite");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="font-medium text-slate-900">Staff &amp; administrators</h2>
        </div>

        {error && <p className="px-5 py-3 text-sm text-red-600">{error}</p>}
        {!error && overview === null && (
          <p className="px-5 py-6 text-center text-sm text-slate-500">Loading…</p>
        )}

        {overview && (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {overview.accounts.map((account) => {
                const isSelf = account.id === ownUserId;
                const isBusy = busyUserId === account.id;
                return (
                  <tr key={account.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 text-slate-900">
                      {account.name}
                      {isSelf && <span className="ml-2 text-xs text-slate-400">(you)</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{account.email}</td>
                    <td className="px-4 py-3">
                      <Select
                        aria-label={`Role for ${account.name}`}
                        value={account.role}
                        disabled={isSelf || isBusy}
                        onChange={(event) =>
                          changeRole(account.id, event.target.value as UserAccountRole)
                        }
                      >
                        {(Object.keys(ROLE_LABELS) as UserAccountRole[]).map((role) => (
                          <option key={role} value={role}>
                            {ROLE_LABELS[role]}
                          </option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      {account.disabledAt ? (
                        <span className="rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700">
                          Disabled
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant={account.disabledAt ? "secondary" : "danger"}
                        disabled={isSelf || isBusy}
                        onClick={() => toggleDisabled(account)}
                      >
                        {account.disabledAt ? "Activate" : "Disable"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {overview.accounts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                    No staff or administrator accounts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="font-medium text-slate-900">Invite staff</h2>
          <p className="text-sm text-slate-500">
            Grants a role to an email address. It takes effect the next time that person signs in.
          </p>
        </div>
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Field label="Email" htmlFor="inviteEmail">
              <TextInput
                id="inviteEmail"
                type="email"
                placeholder="name@example.com"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
              />
            </Field>
          </div>
          <div>
            <Field label="Role" htmlFor="inviteRole">
              <Select
                id="inviteRole"
                value={inviteRole}
                onChange={(event) =>
                  setInviteRole(event.target.value as "doctor" | "nurse" | "admin")
                }
              >
                <option value="doctor">Doctor</option>
                <option value="nurse">Nurse</option>
                <option value="admin">Administrator</option>
              </Select>
            </Field>
          </div>
          <Button disabled={isInviting || !inviteEmail} onClick={sendInvite}>
            {isInviting ? "Sending…" : "Send invite"}
          </Button>
        </div>
        {inviteError && <p className="px-5 pb-4 text-sm text-red-600">{inviteError}</p>}

        {overview && overview.pendingInvites.length > 0 && (
          <ul className="divide-y divide-slate-100 border-t border-slate-200">
            {overview.pendingInvites.map((invite) => (
              <li
                key={invite.email}
                className="flex items-center justify-between px-5 py-3 text-sm"
              >
                <span className="text-slate-700">
                  {invite.email} — {ROLE_LABELS[invite.role]}
                  <span className="ml-2 text-xs text-slate-400">pending</span>
                </span>
                <Button size="sm" variant="secondary" onClick={() => revokeInvite(invite.email)}>
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
