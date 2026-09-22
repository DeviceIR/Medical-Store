"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Check, Copy, KeyRound, ShieldCheck, Smartphone, UserPlus } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/components/AuthProvider";
import { ApiError, api, safeNextPath } from "@/lib/utils";
import { isIranMobile, looksLikeEmail, normalizeIranPhone } from "@medical/shared";
import { RevealText, easeOut } from "@/components/motion";
import { HeroScene } from "@/components/HeroScene";
import { MotionButton } from "@/components/Button";

type Mode = "otp" | "password" | "register";
type OtpStep = "phone" | "code";

function authMessage(t: ReturnType<typeof useTranslations>, code: string) {
  const map: Record<string, string> = {
    INVALID_PHONE: t("errors.INVALID_PHONE"),
    INVALID_EMAIL: t("errors.INVALID_EMAIL"),
    INVALID_CREDENTIALS: t("errors.INVALID_CREDENTIALS"),
    PASSWORD_NOT_SET: t("errors.PASSWORD_NOT_SET"),
    PASSWORD_SHORT: t("errors.PASSWORD_SHORT"),
    PASSWORD_MISMATCH: t("errors.PASSWORD_MISMATCH"),
    EMAIL_TAKEN: t("errors.EMAIL_TAKEN"),
    PHONE_TAKEN: t("errors.PHONE_TAKEN"),
    EMAIL_OR_PHONE_REQUIRED: t("errors.EMAIL_OR_PHONE_REQUIRED"),
    NAME_REQUIRED: t("errors.NAME_REQUIRED"),
    OTP_EXPIRED: t("errors.OTP_EXPIRED"),
    OTP_INVALID: t("errors.OTP_INVALID"),
    OTP_LOCKED: t("errors.OTP_LOCKED"),
    OTP_COOLDOWN: t("errors.OTP_COOLDOWN"),
    REFRESH_INVALID: t("errors.REFRESH_INVALID"),
    Unauthorized: t("errors.Unauthorized"),
  };
  if (code.includes("Too Many Requests")) return t("errors.OTP_COOLDOWN");
  return map[code] ?? t("errors.GENERIC");
}

function LoginForm() {
  const t = useTranslations("auth");
  const th = useTranslations("home");
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const { user, loading: authLoading, refresh } = useAuth();
  const reduce = useReducedMotion();

  const [mode, setMode] = useState<Mode>("otp");
  const [otpStep, setOtpStep] = useState<OtpStep>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [previewCode, setPreviewCode] = useState("");
  const [channel, setChannel] = useState<"preview" | "sms">("preview");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!authLoading && user) router.replace(next);
  }, [authLoading, user, next, router]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = window.setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [secondsLeft]);

  const phoneHint = useMemo(() => {
    const n = normalizeIranPhone(phone);
    return isIranMobile(n) ? n : "";
  }, [phone]);

  async function afterAuth() {
    await refresh();
    router.push(next);
    router.refresh();
  }

  async function requestCode() {
    setError("");
    const normalized = normalizeIranPhone(phone);
    if (!isIranMobile(normalized)) {
      setError(t("errors.INVALID_PHONE"));
      return;
    }
    setBusy(true);
    try {
      const res = await api<{
        code?: string;
        channel?: "preview" | "sms";
        resendAfter?: number;
        phone: string;
      }>("/auth/otp/request", { method: "POST", body: JSON.stringify({ phone: normalized }) });
      setPhone(res.phone);
      setPreviewCode(res.channel === "preview" ? res.code ?? "" : "");
      setCode(res.channel === "preview" ? res.code ?? "" : "");
      setChannel(res.channel ?? "preview");
      setOtpStep("code");
      setSecondsLeft(res.resendAfter ?? 45);
    } catch (err) {
      setError(authMessage(t, err instanceof ApiError ? err.code : "GENERIC"));
    } finally {
      setBusy(false);
    }
  }

  async function sendOtp(e: FormEvent) {
    e.preventDefault();
    await requestCode();
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await api("/auth/otp/verify", {
        method: "POST",
        body: JSON.stringify({ phone: normalizeIranPhone(phone), code }),
      });
      await afterAuth();
    } catch (err) {
      setError(authMessage(t, err instanceof ApiError ? err.code : "GENERIC"));
    } finally {
      setBusy(false);
    }
  }

  async function login(e: FormEvent) {
    e.preventDefault();
    setError("");
    const id = identifier.trim();
    if (!looksLikeEmail(id) && !isIranMobile(id)) {
      setError(t("errors.EMAIL_OR_PHONE_REQUIRED"));
      return;
    }
    setBusy(true);
    try {
      await api("/auth/login", { method: "POST", body: JSON.stringify({ identifier: id, password }) });
      await afterAuth();
    } catch (err) {
      setError(authMessage(t, err instanceof ApiError ? err.code : "GENERIC"));
    } finally {
      setBusy(false);
    }
  }

  async function register(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError(t("errors.PASSWORD_MISMATCH"));
      return;
    }
    if (!email.trim() && !regPhone.trim()) {
      setError(t("errors.EMAIL_OR_PHONE_REQUIRED"));
      return;
    }
    setBusy(true);
    try {
      await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || undefined,
          phone: regPhone.trim() || undefined,
          password,
        }),
      });
      await afterAuth();
    } catch (err) {
      setError(authMessage(t, err instanceof ApiError ? err.code : "GENERIC"));
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    if (!previewCode) return;
    await navigator.clipboard.writeText(previewCode).catch(() => undefined);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  const tabs: { id: Mode; label: string; icon: typeof Smartphone }[] = [
    { id: "otp", label: t("otp"), icon: Smartphone },
    { id: "password", label: t("login"), icon: KeyRound },
    { id: "register", label: t("register"), icon: UserPlus },
  ];

  return (
    <motion.div
      className="overflow-hidden rounded-[28px] border border-[var(--line)] bg-[var(--bg-elev)] shadow-[var(--shadow)] md:grid md:grid-cols-[0.9fr_1.1fr]"
      initial={reduce ? false : { opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: easeOut }}
    >
      <aside className="relative hidden min-h-[520px] overflow-hidden bg-[var(--navy-deep)] p-8 text-white md:flex md:flex-col md:justify-between">
        <div className="pointer-events-none absolute inset-0 opacity-90">
          <HeroScene
            compact
            labels={{
              surgical: th("sceneSurgical"),
              diagnostic: th("sceneDiagnostic"),
              laboratory: th("sceneLab"),
              imaging: th("sceneImaging"),
            }}
          />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,42,56,0.82)_0%,rgba(7,42,56,0.22)_42%,rgba(7,42,56,0.22)_62%,rgba(7,42,56,0.88)_100%)]" />
        <motion.div
          className="pointer-events-none absolute -left-10 top-0 size-56 rounded-full bg-teal-400/20 blur-3xl"
          animate={reduce ? undefined : { x: [0, 16, 0], y: [0, 10, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative z-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-200">{t("asideKicker")}</p>
          <RevealText as="h1" text={t("asideTitle")} className="mt-4 text-3xl font-extrabold leading-snug" />
          <p className="mt-3 text-sm leading-6 text-white/70">{t("asideBody")}</p>
        </div>
        <ul className="relative z-10 mt-10 space-y-3 text-sm text-white/80">
          {[t("aside1"), t("aside2"), t("aside3")].map((item, i) => (
            <motion.li
              key={item}
              className="flex gap-2"
              initial={reduce ? false : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.08, duration: 0.4, ease: easeOut }}
            >
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-teal-200" />
              {item}
            </motion.li>
          ))}
        </ul>
      </aside>

      <div className="p-6 sm:p-8">
        <div className="mb-6 md:hidden">
          <h1 className="text-2xl font-extrabold">{t("title")}</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{t("subtitle")}</p>
        </div>
        <div className="mb-6 grid grid-cols-3 gap-1 rounded-2xl bg-[var(--bg)] p-1">
          {tabs.map(({ id, label, icon: Icon }) => (
            <MotionButton
              key={id}
              type="button"
              className={`relative flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-semibold sm:text-sm ${
                mode === id ? "text-[var(--navy)]" : "text-[var(--muted)]"
              }`}
              onClick={() => {
                setMode(id);
                setError("");
              }}
            >
              {mode === id ? (
                <motion.span layoutId="auth-tab" className="absolute inset-0 rounded-xl bg-white shadow-sm" transition={{ type: "spring", stiffness: 380, damping: 32 }} />
              ) : null}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon className="size-3.5" />
                <span className="truncate">{label}</span>
              </span>
            </MotionButton>
          ))}
        </div>

        {error ? (
          <motion.p className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-[var(--danger)]" role="alert" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
            {error}
          </motion.p>
        ) : null}

        <AnimatePresence mode="wait">
          <motion.div
            key={`${mode}-${otpStep}`}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: easeOut }}
          >

        {mode === "otp" ? (
          otpStep === "phone" ? (
            <form className="space-y-4" onSubmit={sendOtp}>
              <label className="field">
                <span>{t("phone")}</span>
                <input
                  className="input"
                  dir="ltr"
                  inputMode="numeric"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0912xxxxxxx"
                />
              </label>
              <p className="text-xs text-[var(--muted)]">{t("phoneHelp")}</p>
              <MotionButton className="btn btn-primary w-full" disabled={busy}>
                {busy ? t("sending") : t("sendOtp")}
              </MotionButton>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={verify}>
              <p className="text-sm text-[var(--muted)]">
                {t("sentTo")} <span className="font-semibold text-[var(--ink)]" dir="ltr">{phoneHint || phone}</span>
                <MotionButton
                  type="button"
                  className="ms-2 text-[var(--teal)]"
                  onClick={() => {
                    setOtpStep("phone");
                    setPreviewCode("");
                    setCode("");
                    setError("");
                  }}
                >
                  {t("changePhone")}
                </MotionButton>
              </p>
              {previewCode ? (
                <div className="rounded-2xl border border-dashed border-[var(--teal)] bg-[var(--teal-soft)] px-4 py-3">
                  <p className="text-xs font-semibold text-[var(--teal)]">
                    {channel === "preview" ? t("smsPreview") : t("smsSent")}
                  </p>
                  <div className="mt-1 flex items-center justify-between gap-3">
                    <p className="otp-preview" dir="ltr">
                      {previewCode}
                    </p>
                    <MotionButton type="button" className="btn btn-ghost px-3 py-2 text-xs" onClick={copyCode}>
                      {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                      {copied ? t("copied") : t("copy")}
                    </MotionButton>
                  </div>
                </div>
              ) : null}
              <label className="field">
                <span>{t("otpCode")}</span>
                <input
                  className="input text-center text-2xl tracking-[0.4em]"
                  dir="ltr"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="------"
                />
              </label>
              <MotionButton className="btn btn-primary w-full" disabled={busy || code.trim().length < 4}>
                {busy ? t("verifying") : t("verify")}
              </MotionButton>
              <MotionButton
                type="button"
                className="btn btn-ghost w-full"
                disabled={busy || secondsLeft > 0}
                onClick={() => requestCode()}
              >
                {secondsLeft > 0 ? t("resendIn", { seconds: secondsLeft }) : t("resend")}
              </MotionButton>
            </form>
          )
        ) : null}

        {mode === "password" ? (
          <form className="space-y-4" onSubmit={login}>
            <label className="field">
              <span>{t("identifier")}</span>
              <input
                className="input"
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={t("identifierPlaceholder")}
              />
            </label>
            <label className="field">
              <span>{t("password")}</span>
              <input
                className="input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("password")}
              />
            </label>
            <MotionButton className="btn btn-primary w-full" disabled={busy}>
              {busy ? t("signingIn") : t("submitLogin")}
            </MotionButton>
            <p className="text-center text-sm text-[var(--muted)]">
              {t("noAccount")}{" "}
              <MotionButton type="button" className="font-semibold text-[var(--teal)]" onClick={() => setMode("register")}>
                {t("register")}
              </MotionButton>
            </p>
          </form>
        ) : null}

        {mode === "register" ? (
          <form className="space-y-4" onSubmit={register}>
            <label className="field">
              <span>{t("name")}</span>
              <input className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="field">
              <span>{t("phone")}</span>
              <input
                className="input"
                dir="ltr"
                inputMode="numeric"
                autoComplete="tel"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                placeholder="0912xxxxxxx"
              />
            </label>
            <label className="field">
              <span>
                {t("email")} <span className="font-normal text-[var(--muted)]">({t("optional")})</span>
              </span>
              <input
                className="input"
                dir="ltr"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="field">
              <span>{t("password")}</span>
              <input
                className="input"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label className="field">
              <span>{t("confirmPassword")}</span>
              <input
                className="input"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </label>
            <p className="text-xs text-[var(--muted)]">{t("registerHelp")}</p>
            <MotionButton className="btn btn-primary w-full" disabled={busy}>
              {busy ? t("creating") : t("submitRegister")}
            </MotionButton>
          </form>
        ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <div className="container-page max-w-4xl py-10 md:py-16">
      <Suspense fallback={<div className="card h-[420px] animate-pulse" />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
