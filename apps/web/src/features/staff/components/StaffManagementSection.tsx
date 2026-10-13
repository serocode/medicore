import { ApiError, apiFetch } from "@/shared/lib/api-client";
import { useSession } from "@/shared/lib/auth-client";
import { formatDate } from "@/shared/lib/format";
import type { StaffInvite, UserAccount, UserAccountRole } from "@/shared/lib/types";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { Card, CardHeader } from "@/shared/ui/Card";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { EmptyState } from "@/shared/ui/EmptyState";
import { Field, Select, TextInput } from "@/shared/ui/Field";
import { Modal } from "@/shared/ui/Modal";
import { StatusMessage } from "@/shared/ui/StatusMessage";
import { MailPlus, Search, UserPlus } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";

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

type PendingStatusChange = { account: UserAccount };

export function StaffManagementSection() {
  const { data: session } = useSession();
  const ownUserId = session?.user.id;

  const [overview, setOverview] = useState<StaffOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [pendingStatusChange, setPendingStatusChange] = useState<PendingStatusChange | null>(null);

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"doctor" | "nurse" | "admin">("nurse");
  const [inviteError, setInviteError] = useState<string | undefined>(undefined);
  const [isInviting, setIsInviting] = useState(false);

  const refresh = useCallback(() => {
    setError(null);
    apiFetch<StaffOverview>("/api/admin/staff")
      .then(setOverview)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "We couldn't load staff accounts."),
      );
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function changeRole(account: UserAccount, role: UserAccountRole) {
    setBusyUserId(account.id);
    setError(null);
    setNotice(null);
    try {
      await apiFetch(`/api/admin/staff/${account.id}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      setNotice(`${account.name || account.email} is now a ${ROLE_LABELS[role].toLowerCase()}.`);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't change that role.");
    } finally {
      setBusyUserId(null);
    }
  }

  async function toggleDisabled(account: UserAccount) {
    const disabling = !account.disabledAt;
    await apiFetch(`/api/admin/staff/${account.id}`, {
      method: "PATCH",
      body: JSON.stringify({ disabled: disabling }),
    });
    setPendingStatusChange(null);
    setNotice(
      disabling
        ? `${account.name || account.email} can no longer sign in.`
        : `${account.name || account.email} can sign in again.`,
    );
    refresh();
  }

  async function sendInvite(event: FormEvent) {
    event.preventDefault();
    setInviteError(undefined);
    setIsInviting(true);
    try {
      const { emailSent } = await apiFetch<{ emailSent: boolean }>("/api/admin/invites", {
        method: "POST",
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const role = ROLE_LABELS[inviteRole].toLowerCase();
      setNotice(
        emailSent
          ? `Invitation sent to ${inviteEmail}. They'll be a ${role} the first time they sign in.`
          : `${inviteEmail} will be a ${role} the first time they sign in, but the invitation email couldn't be sent — let them know to sign in.`,
      );
      setInviteEmail("");
      setIsInviteOpen(false);
      refresh();
    } catch (err) {
      setInviteError(
        err instanceof ApiError ? err.message : "We couldn't send that invite. Check the address.",
      );
    } finally {
      setIsInviting(false);
    }
  }

  async function revokeInvite(email: string) {
    setError(null);
    try {
      await apiFetch(`/api/admin/invites/${encodeURIComponent(email)}`, { method: "DELETE" });
      setNotice(`The invite for ${email} has been revoked.`);
      refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't revoke that invite.");
    }
  }

  const accounts = useMemo(() => {
    if (!overview) return null;
    const term = query.trim().toLowerCase();
    if (!term) return overview.accounts;
    return overview.accounts.filter(
      (account) =>
        account.name.toLowerCase().includes(term) || account.email.toLowerCase().includes(term),
    );
  }, [overview, query]);

  return (
    <div className="flex flex-col gap-6">
      {error && <StatusMessage tone="error">{error}</StatusMessage>}
      {notice && <StatusMessage tone="success">{notice}</StatusMessage>}

      <Card>
        <CardHeader
          title="Staff and administrators"
          description="Role changes and sign-in access take effect immediately."
          action={
            <Button onClick={() => setIsInviteOpen(true)}>
              <UserPlus aria-hidden="true" className="h-4 w-4" />
              Invite staff
            </Button>
          }
        />

        {overview && overview.accounts.length > 5 && (
          <div className="border-b border-line px-5 py-3">
            <div className="max-w-xs">
              <Field label="Search staff" htmlFor="staff-search">
                <TextInput
                  id="staff-search"
                  type="search"
                  icon={Search}
                  placeholder="Search by name or email"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </Field>
            </div>
          </div>
        )}

        {!error && overview === null && (
          <output className="block px-5 py-6 text-center text-sm text-ink-muted">
            Loading staff accounts…
          </output>
        )}

        {accounts?.length === 0 && (
          <EmptyState
            bare
            icon={UserPlus}
            title={query ? "No accounts match that search" : "No staff accounts yet"}
            description={
              query
                ? "Check the spelling, or clear the search to see everyone."
                : "Invite a colleague by email — their role applies the first time they sign in."
            }
            action={
              query ? undefined : (
                <Button onClick={() => setIsInviteOpen(true)}>Invite your first colleague</Button>
              )
            }
          />
        )}

        {accounts && accounts.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-3xl text-left text-sm">
              <thead className="bg-surface-low text-ink-muted">
                <tr>
                  <th scope="col" className="px-5 py-3 font-display font-semibold">
                    Person
                  </th>
                  <th scope="col" className="px-4 py-3 font-display font-semibold">
                    Role
                  </th>
                  <th scope="col" className="px-4 py-3 font-display font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-3 font-display font-semibold">
                    Joined
                  </th>
                  <th scope="col" className="px-5 py-3 text-right font-display font-semibold">
                    Sign-in access
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {accounts.map((account) => {
                  const isSelf = account.id === ownUserId;
                  const isBusy = busyUserId === account.id;
                  return (
                    <tr key={account.id} className="hover:bg-surface">
                      <th scope="row" className="px-5 py-3 text-left font-normal">
                        <div className="flex min-w-0 items-center gap-3">
                          <Avatar name={account.name || account.email} size={36} />
                          {/* Signing in by OTP doesn't set a display name, so an
                              account can be in use and still be nameless — lead
                              with the email rather than claiming they never
                              signed in. */}
                          <div className="min-w-0">
                            <p className="truncate font-display font-semibold text-ink">
                              {account.name || account.email}
                              {isSelf && (
                                <span className="ml-2 text-caption font-normal text-ink-subtle">
                                  (you)
                                </span>
                              )}
                            </p>
                            <p className="truncate text-caption text-ink-subtle">
                              {account.name ? account.email : "No display name set"}
                            </p>
                          </div>
                        </div>
                      </th>
                      <td className="px-4 py-3">
                        <Select
                          aria-label={`Role for ${account.name || account.email}`}
                          value={account.role}
                          disabled={isSelf || isBusy}
                          onChange={(event) =>
                            changeRole(account, event.target.value as UserAccountRole)
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
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-danger-soft px-2.5 py-1 font-display text-xs font-semibold text-on-danger-soft">
                            Disabled
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-primary-soft px-2.5 py-1 font-display text-xs font-semibold text-on-primary-soft">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-ink-muted">
                        {formatDate(account.createdAt)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={isSelf || isBusy}
                            title={isSelf ? "You can't change your own access" : undefined}
                            onClick={() => setPendingStatusChange({ account })}
                          >
                            {account.disabledAt ? "Restore access" : "Disable"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {overview && overview.pendingInvites.length > 0 && (
        <Card>
          <CardHeader
            title="Pending invites"
            description="These roles apply the first time the person signs in."
          />
          <ul className="divide-y divide-line">
            {overview.pendingInvites.map((invite) => (
              <li
                key={invite.email}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-on-accent-soft">
                    <MailPlus aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-semibold text-ink">
                      {invite.email}
                    </p>
                    <p className="text-caption text-ink-subtle">
                      {ROLE_LABELS[invite.role]} · invited {formatDate(invite.createdAt)}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="secondary" onClick={() => revokeInvite(invite.email)}>
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {isInviteOpen && (
        <Modal
          title="Invite a colleague"
          description="Emails them an invitation to sign in. The role applies the first time they do."
          onClose={() => setIsInviteOpen(false)}
        >
          <form onSubmit={sendInvite} className="flex flex-col gap-5">
            <Field label="Email address" htmlFor="inviteEmail" error={inviteError} required>
              <TextInput
                id="inviteEmail"
                type="email"
                required
                autoFocus
                placeholder="name@example.com"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
              />
            </Field>
            <Field label="Role" htmlFor="inviteRole" required>
              <Select
                id="inviteRole"
                value={inviteRole}
                onChange={(event) =>
                  setInviteRole(event.target.value as "doctor" | "nurse" | "admin")
                }
              >
                <option value="nurse">Nurse</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Administrator</option>
              </Select>
            </Field>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setIsInviteOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isInviting || !inviteEmail.trim()}>
                {isInviting ? "Saving…" : "Send invite"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {pendingStatusChange && (
        <ConfirmDialog
          title={
            pendingStatusChange.account.disabledAt
              ? "Restore sign-in access?"
              : "Disable this account?"
          }
          description={
            pendingStatusChange.account.disabledAt
              ? `${pendingStatusChange.account.name || pendingStatusChange.account.email} will be able to sign in again with their existing role.`
              : `${pendingStatusChange.account.name || pendingStatusChange.account.email} will be signed out and blocked from signing in. Their records stay in place, and you can restore access at any time.`
          }
          confirmLabel={
            pendingStatusChange.account.disabledAt ? "Restore access" : "Disable account"
          }
          pendingLabel="Saving…"
          tone={pendingStatusChange.account.disabledAt ? "primary" : "danger"}
          onConfirm={() => toggleDisabled(pendingStatusChange.account)}
          onClose={() => setPendingStatusChange(null)}
        />
      )}
    </div>
  );
}
