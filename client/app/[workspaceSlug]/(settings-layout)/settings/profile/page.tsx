/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import useAuthentication from "@/features/auth/hooks/useAuthentication";
import { classNames } from "@/shared/styles/classNames";
import { AlertTriangle, Camera, Check, Moon, Sun, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

type ThemeMode = "dark" | "light";

type ProfileForm = {
  fullName: string;
  username: string;
  phoneNo: string;
  title: string;
  avatarImageURL: string;
  avatarFile: File | null;
};

const THEME_CHANGE_EVENT = "app-theme-change";

function getThemeSnapshot(): ThemeMode {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function subscribeToThemeChange(onStoreChange: () => void) {
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
}

export default function SettingsProfilePage() {
  const { userInfo, isAuthenticated, isLoading, error } = useAuthentication();

  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const theme = useSyncExternalStore(
    subscribeToThemeChange,
    getThemeSnapshot,
    () => "dark"
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [avatarPreviewURL, setAvatarPreviewURL] = useState("");
  const [form, setForm] = useState<ProfileForm>({
    fullName: "",
    username: "",
    phoneNo: "",
    title: "",
    avatarImageURL: "",
    avatarFile: null,
  });

  useEffect(() => {
    if (!userInfo) return;

    setForm({
      fullName: userInfo.fullName ?? "",
      username: userInfo.username ?? "",
      phoneNo: userInfo.phoneNo ?? "",
      title: userInfo.title ?? "",
      avatarImageURL: userInfo.avatarImageURL ?? "",
      avatarFile: null,
    });

    setAvatarPreviewURL(userInfo.avatarImageURL ?? "");
  }, [userInfo]);

  const initialForm = useMemo<ProfileForm>(
    () => ({
      fullName: userInfo?.fullName ?? "",
      username: userInfo?.username ?? "",
      phoneNo: userInfo?.phoneNo ?? "",
      title: userInfo?.title ?? "",
      avatarImageURL: userInfo?.avatarImageURL ?? "",
      avatarFile: null,
    }),
    [userInfo]
  );

  const hasChanges =
    form.fullName !== initialForm.fullName ||
    form.username !== initialForm.username ||
    form.phoneNo !== initialForm.phoneNo ||
    form.title !== initialForm.title ||
    !!form.avatarFile;

  const displayName = form.fullName || form.username || "User";
  const avatarInitial = displayName.charAt(0).toUpperCase();

  const updateField = (key: keyof ProfileForm, value: string | File | null) => {
    setForm((curr) => ({ ...curr, [key]: value }));
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";

    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem("theme", nextTheme);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  };

  const handleCancel = () => {
    setForm(initialForm);
    setAvatarPreviewURL(initialForm.avatarImageURL);
  };

  const handleSelectAvatar = (file: File | undefined) => {
    if (!file || !file.type.startsWith("image/")) return;

    const nextPreviewURL = URL.createObjectURL(file);

    setAvatarPreviewURL((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return nextPreviewURL;
    });

    setForm((curr) => ({
      ...curr,
      avatarFile: file,
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);

      const payload = new FormData();
      payload.append("fullName", form.fullName.trim());
      payload.append("username", form.username.trim());
      payload.append("phoneNo", form.phoneNo.trim());
      payload.append("title", form.title.trim());

      if (form.avatarFile) {
        payload.append("avatar", form.avatarFile);
      }

      // TODO: await updateProfile(payload);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeletingAccount(true);

      // TODO: await deleteAccount();

      setIsDeleteModalOpen(false);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (isLoading) {
    return (
      <main className="w-full max-w-3xl px-10 py-10">
        <div className="h-8 w-40 animate-pulse rounded bg-[var(--secondary)]" />
        <div className="mt-8 h-56 animate-pulse rounded-xl bg-[var(--secondary)]" />
      </main>
    );
  }

  if (error || !isAuthenticated || !userInfo) {
    return (
      <main className="w-full max-w-3xl px-10 py-10">
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className={`mt-2 text-sm ${classNames.text.secondary}`}>
          Unable to load your profile.
        </p>
      </main>
    );
  }

  return (
    <>
      <main className="w-full max-w-5xl px-10 py-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-(--text-primary)">
            Profile
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-(--text-secondary)">
            Update your personal information, avatar, and account details that
            are visible to other workspace members.
          </p>
        </div>

        <section className="mt-8 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <SettingRow
            label="Avatar"
            description="Recommended size is 256x256px"
          >
            <div className="relative ml-auto">
              {avatarPreviewURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreviewURL}
                  alt={displayName}
                  className="h-9 w-9 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--primary)] text-xs font-semibold text-white">
                  {avatarInitial}
                </div>
              )}

              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) =>
                  handleSelectAvatar(event.target.files?.[0])
                }
              />

              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 opacity-0 transition hover:opacity-100"
              >
                <Camera size={15} className="text-white" />
              </button>
            </div>
          </SettingRow>

          <SettingRow label="Name">
            <Input
              value={form.fullName}
              onChange={(value) => updateField("fullName", value)}
              placeholder="Your full name"
            />
          </SettingRow>

          <SettingRow label="Username">
            <Input
              value={form.username}
              onChange={(value) => updateField("username", value)}
              placeholder="username"
            />
          </SettingRow>

          <SettingRow label="Email">
            <div className={`truncate text-sm ${classNames.text.secondary}`}>
              {userInfo.email}
            </div>
          </SettingRow>

          <SettingRow label="Phone">
            <Input
              value={form.phoneNo}
              onChange={(value) => updateField("phoneNo", value)}
              placeholder="Phone number"
            />
          </SettingRow>

          <SettingRow label="Title">
            <Input
              value={form.title}
              onChange={(value) => updateField("title", value)}
              placeholder="Product designer, engineer..."
            />
          </SettingRow>
        </section>

        <SectionTitle>Preferences</SectionTitle>

        <section className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <SettingRow
            label="Theme"
            description="Choose how the interface appears on this device"
          >
            <button
              type="button"
              onClick={toggleTheme}
              className="ml-auto inline-flex items-center gap-2 rounded-lg bg-[var(--secondary)] px-3 py-2 text-sm font-medium"
            >
              {theme === "dark" ? <Moon size={15} /> : <Sun size={15} />}
              {theme === "dark" ? "Dark" : "Light"}
            </button>
          </SettingRow>
        </section>

        <SectionTitle>Danger zone</SectionTitle>

        <section className="rounded-xl border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center justify-between px-4 py-5">
            <div>
              <div className="text-sm font-semibold">Delete account</div>
              <p className={`text-sm ${classNames.text.secondary}`}>
                Permanently delete your account and profile data
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="text-sm font-semibold text-red-400 hover:text-red-300"
            >
              Delete account
            </button>
          </div>
        </section>

        <AnimatePresence mode="wait">
          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, translateX: -100 }}
              animate={{ opacity: 1, translateX: 1 }}
              exit={{ opacity: 0, translateX: -100 }}
              transition={{
                type: "spring",
                duration: 0.5,
                bounce: 0.5,
              }}
              className="
                flex items-center justify-between
                px-4 py-4 mt-
                "
            >
              <span className={`text-sm ${classNames.text.secondary}`}>
                You have unsaved changes
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="
                    inline-flex items-center gap-2
                    rounded-lg
                    bg-[var(--secondary)]
                    px-4 py-2
                    text-sm font-medium
                    hover:opacity-90
                    disabled:opacity-60
                    "
                >
                  <X size={15} />
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="
                    inline-flex items-center gap-2
                    rounded-lg
                    bg-[var(--primary)]
                    px-4 py-2
                    text-sm font-medium
                    text-white
                    hover:opacity-90
                    disabled:opacity-60"
                >
                  <Check size={15} />
                  {isSaving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        isLoading={isDeletingAccount}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
      />
    </>
  );
}

function DeleteAccountModal({
  isOpen,
  isLoading,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.button
            type="button"
            aria-label="Close delete account modal"
            onClick={onClose}
            className="absolute inset-0 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18 }}
            className="relative w-full max-w-md rounded-2xl border border-(--border) bg-background p-5 shadow-lg"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-400">
                <AlertTriangle size={20} />
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold">Delete account?</h2>
                <p className={`mt-1 text-sm ${classNames.text.secondary}`}>
                  This action cannot be undone. Your profile and account data
                  will be permanently removed.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className={`rounded-lg p-1 hover:bg-[var(--secondary)] disabled:opacity-60 ${classNames.text.secondary}`}
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="rounded-lg bg-[var(--secondary)] px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-60"
              >
                {isLoading ? "Deleting..." : "Delete account"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 mt-12 px-4 text-sm font-semibold">{children}</h2>;
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[1fr_256px] items-center gap-5 border-b border-[var(--border)] px-4 py-4 last:border-b-0">
      <div className="min-w-0">
        <div className="text-sm font-semibold">{label}</div>
        {description && (
          <div className={`mt-1 text-sm ${classNames.text.secondary}`}>
            {description}
          </div>
        )}
      </div>

      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="
        w-full rounded-lg border border-[var(--border)] bg-transparent
        px-3 py-2 text-sm font-semibold outline-none
        placeholder:font-normal placeholder:text-[var(--muted-foreground)]
        focus:border-[var(--primary)]
      "
    />
  );
}
