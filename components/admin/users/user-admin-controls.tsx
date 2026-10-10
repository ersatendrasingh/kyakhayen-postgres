"use client";

import { UserRole } from "@prisma/client";
import {
  Ban,
  BellRing,
  CalendarPlus2,
  ImagePlus,
  Mail,
  Pencil,
  PhoneCall,
  RotateCcw,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import { toast } from "sonner";

import { MediaLibraryDialog } from "@/components/admin/media/media-library-dialog";
import { TargetedNotificationDialog } from "@/components/admin/notifications/targeted-notification-dialog";
import type { ManagedUser, UserAdminOptions } from "@/components/admin/users/user-types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function inputDate(value: Date | null | undefined) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

function apiDate(value: string) {
  return value ? new Date(`${value}T00:00:00`).toISOString() : null;
}

function displayDate(value: Date | null | undefined) {
  return value
    ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(value))
    : "No expiry";
}

export function UserAdminControls({
  user,
  options,
}: {
  user: ManagedUser;
  options: UserAdminOptions;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileImageOpen, setProfileImageOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [membershipOpen, setMembershipOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [deletingAssignmentId, setDeletingAssignmentId] = useState<string | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState(user.suspensionReason || "");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const [profile, setProfile] = useState({
    name: user.name || "",
    email: user.email || "",
    phoneNumber: user.phoneNumber || "",
    bio: user.bio || "",
    image: user.image || null,
    role: user.role,
    emailVerified: Boolean(user.emailVerified),
  });
  const [preferences, setPreferences] = useState({
    foodPreferenceId: user.foodPreferenceId || "",
    cookingSkillId: user.cookingSkillId || "",
    cuisineIds: user.userCuisines.map(({ cuisineId }) => cuisineId),
    allergyIds: user.UserAllrgies.map(({ allergyId }) => allergyId),
  });
  const [membership, setMembership] = useState({
    assignmentId: "",
    planId: options.plans[0]?.id || "",
    startDate: inputDate(new Date()),
    endDate: "",
  });

  function membershipForEdit(assignment?: ManagedUser["UserPlan"][number]) {
    if (assignment) {
      setMembership({
        assignmentId: assignment.id,
        planId: assignment.planId,
        startDate: inputDate(assignment.startDate),
        endDate: inputDate(assignment.endDate),
      });
    } else {
      const plan = options.plans[0];
      const start = new Date();
      const end = plan?.durationDays
        ? new Date(start.getTime() + plan.durationDays * 86_400_000)
        : null;
      setMembership({
        assignmentId: "",
        planId: plan?.id || "",
        startDate: inputDate(start),
        endDate: inputDate(end),
      });
    }
    setMembershipOpen(true);
  }

  function updateMembershipPlan(planId: string) {
    const plan = options.plans.find((entry) => entry.id === planId);
    const startDate = membership.startDate ? new Date(`${membership.startDate}T00:00:00`) : new Date();
    const endDate = plan?.durationDays
      ? new Date(startDate.getTime() + plan.durationDays * 86_400_000)
      : null;
    setMembership((current) => ({ ...current, planId, endDate: inputDate(endDate) }));
  }

  function toggleSelection(key: "cuisineIds" | "allergyIds", id: string, checked: boolean) {
    setPreferences((current) => ({
      ...current,
      [key]: checked ? [...current[key], id] : current[key].filter((value) => value !== id),
    }));
  }

  async function saveProfile() {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profile,
          name: profile.name || null,
          email: profile.email || null,
          phoneNumber: profile.phoneNumber || null,
          bio: profile.bio || null,
        }),
      });
      if (!response.ok) throw new Error(await response.json());
      toast.success("Customer account updated.");
      setProfileOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update customer account.");
    } finally {
      setSaving(false);
    }
  }

  async function savePreferences() {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/preferences`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...preferences,
          foodPreferenceId: preferences.foodPreferenceId || null,
          cookingSkillId: preferences.cookingSkillId || null,
        }),
      });
      if (!response.ok) throw new Error(await response.json());
      toast.success("Customer food choices updated.");
      setPreferencesOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update customer choices.");
    } finally {
      setSaving(false);
    }
  }

  async function saveMembership() {
    if (!membership.planId || !membership.startDate) {
      toast.error("Select a membership and start date.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/memberships`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: membership.assignmentId || null,
          planId: membership.planId,
          startDate: apiDate(membership.startDate),
          endDate: apiDate(membership.endDate),
        }),
      });
      if (!response.ok) throw new Error(await response.json());
      toast.success(membership.assignmentId ? "Membership access updated." : "Membership access assigned.");
      setMembershipOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save membership.");
    } finally {
      setSaving(false);
    }
  }

  async function removeMembership() {
    if (!deletingAssignmentId) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/memberships`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId: deletingAssignmentId }),
      });
      if (!response.ok) throw new Error(await response.json());
      toast.success("Membership access removed.");
      setDeletingAssignmentId(null);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to remove membership.");
    } finally {
      setSaving(false);
    }
  }

  async function updateAccountStatus() {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: !user.isActive,
          reason: user.isActive ? suspensionReason.trim() || null : null,
        }),
      });
      if (!response.ok) throw new Error(await response.json());
      toast.success(user.isActive ? "Customer account suspended." : "Customer account reactivated.");
      setStatusOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update customer status.");
    } finally {
      setSaving(false);
    }
  }

  async function permanentlyDeleteUser() {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: deleteConfirmation }),
      });
      if (!response.ok) throw new Error(await response.json());
      toast.success("Customer and related account data permanently deleted.");
      router.push("/admin/users");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to permanently delete customer.");
      setSaving(false);
    }
  }

  const deletionConfirmationValue = user.email || user.id;

  return (
    <>
      <TooltipProvider delayDuration={100}>
        <div className="flex items-center gap-1.5 rounded-2xl border border-[#e7c9a4] bg-background/80 p-1.5 shadow-sm dark:border-white/10 dark:bg-white/[0.05]">
          {user.email && (
            <ActionIcon label="Email customer">
              <Button asChild size="icon" variant="ghost" className="rounded-xl">
                <a href={`mailto:${user.email}`} aria-label="Email customer"><Mail /></a>
              </Button>
            </ActionIcon>
          )}
          {user.phoneNumber && (
            <ActionIcon label="Call customer">
              <Button asChild size="icon" variant="ghost" className="rounded-xl">
                <a href={`tel:${user.phoneNumber}`} aria-label="Call customer"><PhoneCall /></a>
              </Button>
            </ActionIcon>
          )}
          <ActionIcon label="Send push notification">
            <Button size="icon" variant="ghost" className="rounded-xl" aria-label="Send push notification" onClick={() => setNotificationOpen(true)}>
              <BellRing />
            </Button>
          </ActionIcon>
          <ActionIcon label="Edit account">
            <Button size="icon" variant="ghost" className="rounded-xl" aria-label="Edit account" onClick={() => setProfileOpen(true)}>
              <Pencil />
            </Button>
          </ActionIcon>
          <ActionIcon label="Edit food choices">
            <Button size="icon" variant="ghost" className="rounded-xl" aria-label="Edit food choices" onClick={() => setPreferencesOpen(true)}>
              <Settings2 />
            </Button>
          </ActionIcon>
          <ActionIcon label="Manage membership">
            <Button size="icon" variant="ghost" className="rounded-xl" aria-label="Manage membership" onClick={() => membershipForEdit()}>
              <CalendarPlus2 />
            </Button>
          </ActionIcon>
          <span className="mx-1 h-7 w-px bg-border" />
          <ActionIcon label={user.isActive ? "Suspend account" : "Reactivate account"}>
            <Button
              size="icon"
              variant="ghost"
              className={user.isActive ? "rounded-xl text-amber-700" : "rounded-xl text-emerald-700"}
              aria-label={user.isActive ? "Suspend account" : "Reactivate account"}
              onClick={() => setStatusOpen(true)}
            >
              {user.isActive ? <Ban /> : <RotateCcw />}
            </Button>
          </ActionIcon>
          <ActionIcon label="Permanently delete customer">
            <Button
              size="icon"
              variant="ghost"
              className="rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
              aria-label="Permanently delete customer"
              onClick={() => setDeleteUserOpen(true)}
            >
              <Trash2 />
            </Button>
          </ActionIcon>
        </div>
      </TooltipProvider>

      <TargetedNotificationDialog
        open={notificationOpen}
        onOpenChange={setNotificationOpen}
        user={{ id: user.id, name: user.name, email: user.email }}
      />

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[28px] sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit customer account</DialogTitle>
            <DialogDescription>Update photo, identity, contact details and account access level.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-2">
            <Field label="Profile picture" className="sm:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-muted/20 p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="size-16 border bg-background shadow-sm">
                    <AvatarImage src={profile.image || undefined} alt="" />
                    <AvatarFallback className="text-lg">
                      {(profile.name || profile.email || "User").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{profile.image ? "Customer photo selected" : "No profile photo"}</p>
                    <p className="text-xs text-muted-foreground">Choose or upload an image from the media library.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {profile.image ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="rounded-xl"
                      aria-label="Remove profile picture"
                      onClick={() => setProfile((current) => ({ ...current, image: null }))}
                    >
                      <X />
                    </Button>
                  ) : null}
                  <Button type="button" variant="outline" onClick={() => setProfileImageOpen(true)}>
                    <ImagePlus />
                    {profile.image ? "Replace" : "Choose image"}
                  </Button>
                </div>
              </div>
            </Field>
            <Field label="Name">
              <Input value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} />
            </Field>
            <Field label="Email">
              <Input type="email" value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} />
            </Field>
            <Field label="Phone number">
              <Input value={profile.phoneNumber} onChange={(event) => setProfile({ ...profile, phoneNumber: event.target.value })} />
            </Field>
            <Field label="Role">
              <Select value={profile.role} onValueChange={(role) => setProfile({ ...profile, role: role as UserRole })}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={UserRole.USER}>Customer</SelectItem>
                  <SelectItem value={UserRole.ADMIN}>Administrator</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Internal note" className="sm:col-span-2">
              <Textarea value={profile.bio} rows={4} onChange={(event) => setProfile({ ...profile, bio: event.target.value })} />
            </Field>
            <label className="flex items-center justify-between gap-4 rounded-xl border p-4 sm:col-span-2">
              <div>
                <p className="text-sm font-medium">Email verified</p>
                <p className="text-xs text-muted-foreground">Override verification only after confirming ownership.</p>
              </div>
              <Switch
                checked={profile.emailVerified}
                onCheckedChange={(emailVerified) => setProfile({ ...profile, emailVerified })}
              />
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileOpen(false)}>Cancel</Button>
            <Button disabled={saving} onClick={() => void saveProfile()}>Save account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <MediaLibraryDialog
        open={profileImageOpen}
        onOpenChange={setProfileImageOpen}
        accept="image"
        title="Choose customer profile picture"
        onSelect={(asset) => {
          setProfile((current) => ({ ...current, image: asset.url }));
          setProfileImageOpen(false);
        }}
      />

      <Dialog open={preferencesOpen} onOpenChange={setPreferencesOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-hidden rounded-[28px] p-0 sm:max-w-3xl">
          <DialogHeader className="border-b px-6 py-5">
            <DialogTitle>Edit food choices</DialogTitle>
            <DialogDescription>Manage the preference inputs used for upcoming meal plans.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[calc(100vh-220px)] space-y-6 overflow-y-auto px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Food style">
                <Select value={preferences.foodPreferenceId || "none"} onValueChange={(value) => setPreferences({ ...preferences, foodPreferenceId: value === "none" ? "" : value })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not selected</SelectItem>
                    {options.foodPreferences.map((entry) => <SelectItem key={entry.id} value={entry.id}>{entry.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Cooking comfort">
                <Select value={preferences.cookingSkillId || "none"} onValueChange={(value) => setPreferences({ ...preferences, cookingSkillId: value === "none" ? "" : value })}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not selected</SelectItem>
                    {options.cookingSkills.map((entry) => <SelectItem key={entry.id} value={entry.id}>{entry.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <ChoiceChecks
              title="Favourite cuisines"
              choices={options.cuisines}
              selected={preferences.cuisineIds}
              onChange={(id, checked) => toggleSelection("cuisineIds", id, checked)}
            />
            <ChoiceChecks
              title="Ingredients to exclude"
              choices={options.allergies}
              selected={preferences.allergyIds}
              onChange={(id, checked) => toggleSelection("allergyIds", id, checked)}
            />
          </div>
          <DialogFooter className="border-t px-6 py-4">
            <Button variant="outline" onClick={() => setPreferencesOpen(false)}>Cancel</Button>
            <Button disabled={saving} onClick={() => void savePreferences()}>Save choices</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={membershipOpen} onOpenChange={setMembershipOpen}>
        <DialogContent className="max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[28px] sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{membership.assignmentId ? "Edit access period" : "Assign membership access"}</DialogTitle>
            <DialogDescription>Admin changes apply to access only and do not overwrite saved meal-plan history.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2 sm:grid-cols-3">
            <Field label="Membership" className="sm:col-span-3">
              <Select value={membership.planId} onValueChange={updateMembershipPlan}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select membership" /></SelectTrigger>
                <SelectContent>
                  {options.plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} {plan.durationDays ? `(${plan.durationDays} days)` : "(No expiry)"} {!plan.isPublished ? "- Draft" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Starts">
              <Input type="date" value={membership.startDate} onChange={(event) => setMembership({ ...membership, startDate: event.target.value })} />
            </Field>
            <Field label="Ends">
              <Input type="date" value={membership.endDate} onChange={(event) => setMembership({ ...membership, endDate: event.target.value })} />
            </Field>
            <div className="flex items-end">
              <Button className="w-full" disabled={saving || !options.plans.length} onClick={() => void saveMembership()}>
                {membership.assignmentId ? "Update access" : "Assign access"}
              </Button>
            </div>
          </div>
          <div className="mt-3 space-y-2 border-t pt-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Assigned access periods</p>
            {user.UserPlan.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                <div>
                  <p className="text-sm font-medium">{assignment.plan.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {displayDate(assignment.startDate)} - {displayDate(assignment.endDate)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="icon-sm" variant="ghost" aria-label="Edit access" onClick={() => membershipForEdit(assignment)}>
                    <Pencil />
                  </Button>
                  <Button size="icon-sm" variant="ghost" className="text-destructive" aria-label="Remove access" onClick={() => setDeletingAssignmentId(assignment.id)}>
                    <Trash2 />
                  </Button>
                </div>
              </div>
            ))}
            {!user.UserPlan.length && <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">No access assigned yet.</p>}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deletingAssignmentId)} onOpenChange={(open) => !open && setDeletingAssignmentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this access period?</AlertDialogTitle>
            <AlertDialogDescription>
              The customer will lose this membership assignment. Previously generated meal plans remain in history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={saving} onClick={() => void removeMembership()}>
              Remove access
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent className="rounded-[28px] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{user.isActive ? "Suspend this account?" : "Reactivate this account?"}</DialogTitle>
            <DialogDescription>
              {user.isActive
                ? "The customer will be blocked from signing in until an admin restores access."
                : "The customer can sign in again immediately after reactivation."}
            </DialogDescription>
          </DialogHeader>
          {user.isActive && (
            <Field label="Reason for suspension">
              <Textarea
                value={suspensionReason}
                rows={4}
                placeholder="Reason visible to the admin team"
                onChange={(event) => setSuspensionReason(event.target.value)}
              />
            </Field>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusOpen(false)}>Cancel</Button>
            <Button
              variant={user.isActive ? "destructive" : "default"}
              disabled={saving || (user.isActive && !suspensionReason.trim())}
              onClick={() => void updateAccountStatus()}
            >
              {user.isActive ? "Suspend account" : "Reactivate account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteUserOpen}
        onOpenChange={(open) => {
          setDeleteUserOpen(open);
          if (!open) setDeleteConfirmation("");
        }}
      >
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently delete this customer?</AlertDialogTitle>
            <AlertDialogDescription>
              This erases their account, access periods, orders, preferences, saved activity,
              meal plans and authored content. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="confirm-customer-deletion">
              Type <span className="font-semibold text-foreground">{deletionConfirmationValue}</span> to confirm
            </Label>
            <Input
              id="confirm-customer-deletion"
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              autoComplete="off"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={saving || deleteConfirmation !== deletionConfirmationValue}
              onClick={(event) => {
                event.preventDefault();
                void permanentlyDeleteUser();
              }}
            >
              Permanently delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ActionIcon({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent sideOffset={6}>{label}</TooltipContent>
    </Tooltip>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="mb-2 block">{label}</Label>
      {children}
    </div>
  );
}

function ChoiceChecks({
  title,
  choices,
  selected,
  onChange,
}: {
  title: string;
  choices: Array<{ id: string; title: string }>;
  selected: string[];
  onChange: (id: string, checked: boolean) => void;
}) {
  return (
    <section>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {choices.map((choice) => (
          <label key={choice.id} className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm">
            <Checkbox
              checked={selected.includes(choice.id)}
              onCheckedChange={(checked) => onChange(choice.id, checked === true)}
            />
            {choice.title}
          </label>
        ))}
      </div>
    </section>
  );
}
