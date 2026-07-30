import { useEffect, useState } from "react";
import { useRequestEmailSignIn } from "@workspace/api-client-react";
import { useLanguage, usePremium } from "@workspace/feelzlike-shell";
import { X, Mail, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { track } from "@/lib/analytics";

/**
 * Free sign-up / sign-in modal · passwordless email magic link.
 * Opened only via explicit taps (PremiumGate, sign-up buttons) · never on
 * page load. One component serves both sign-up and sign-in: the server
 * finds-or-creates the account when the link is clicked, and existing
 * alert-email subscribers claim their account with the same email.
 */

interface Props {
  open: boolean;
  initialEmail?: string;
  feature?: string;
  returnTo: string;
  onClose: () => void;
}

export function SignUpSheet({ open, initialEmail, feature, returnTo, onClose }: Props) {
  const { t } = useLanguage();
  const { isPromoPeriod, promoEndsAt } = usePremium();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [sent, setSent] = useState<{ message: string; devVerifyUrl?: string } | null>(null);
  const mutation = useRequestEmailSignIn();

  // Re-seed local state each time the sheet opens.
  useEffect(() => {
    if (open) {
      setEmail(initialEmail ?? "");
      setSent(null);
      mutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialEmail]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || mutation.isPending) return;
    try {
      const result = await mutation.mutateAsync({ data: { email, returnTo } });
      setSent({
        message: result.message,
        devVerifyUrl: (result as { devVerifyUrl?: string }).devVerifyUrl,
      });
      track("signup_email_requested", { category: "auth", data: { feature: feature ?? "unknown" } });
    } catch {
      // mutation.error surfaces below
    }
  };

  const errMessage = mutation.error ? extractErrorMessage(mutation.error) : null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("create your free account", "無料アカウントを作成")}
    >
      <button
        type="button"
        aria-label={t("close", "閉じる")}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-md bg-background rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl p-6 space-y-4">
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close", "閉じる")}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-black/5 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {sent ? (
          <>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
              <h3 className="text-lg font-bold text-foreground">{t("check your email", "メールをご確認ください")}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{sent.message}</p>
            {sent.devVerifyUrl && (
              <div className="text-xs bg-black/5 rounded p-3 border border-border">
                <div className="text-muted-foreground mb-1 font-bold uppercase tracking-wider">Dev mode - no email sent</div>
                <a href={sent.devVerifyUrl} className="text-sky-700 break-all hover:underline">{sent.devVerifyUrl}</a>
              </div>
            )}
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2 pr-8">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 border border-primary/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                <Sparkles className="w-3 h-3" /> {t("free account", "無料アカウント")}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground leading-tight">
                {t("create your free account", "無料アカウントを作成")}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {t(
                  "no password · we email you a sign-in link. already got powder alerts? use the same email to claim your account.",
                  "パスワード不要 · サインインリンクをメールでお送りします。パウダーアラート登録済みの方は同じメールでアカウントを利用できます。",
                )}
              </p>
              {isPromoPeriod && promoEndsAt && (
                <p className="text-xs text-primary/90 mt-1.5 font-medium">
                  {t(
                    `every premium feature is free for members until ${formatDate(promoEndsAt)} · no card needed`,
                    `${formatDate(promoEndsAt)}までプレミアム機能はメンバー無料 · カード不要`,
                  )}
                </p>
              )}
            </div>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> {t("Email", "メール")}
              </span>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
                className="mt-1.5 w-full rounded-lg bg-black/5 border border-border px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </label>

            {errMessage && (
              <div className="text-xs text-rose-500 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
                {errMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={!email || mutation.isPending}
              className="w-full rounded-lg bg-primary text-primary-foreground font-bold text-sm py-3 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {mutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {t("email me a sign-in link", "サインインリンクを送信")}
            </button>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {t("by continuing you agree to the ", "続行すると次に同意したことになります: ")}
              <a href="/legal/terms" className="underline hover:text-foreground">{t("terms", "利用規約")}</a>
              {" · "}
              <a href="/legal/privacy" className="underline hover:text-foreground">{t("privacy policy", "プライバシーポリシー")}</a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-AU", { month: "long", day: "numeric", year: "numeric" }).toLowerCase();
}

function extractErrorMessage(err: unknown): string {
  if (typeof err === "object" && err !== null) {
    const anyErr = err as { message?: string; data?: { message?: string }; response?: { data?: { message?: string } } };
    return anyErr.response?.data?.message ?? anyErr.data?.message ?? anyErr.message ?? "Something went wrong. Try again.";
  }
  return "Something went wrong. Try again.";
}
