import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, Check, Mail } from "lucide-react";
import Button from "@/components/common/Button";
import { GlassCard } from "@/components/common/Primitives";
import { verifyOtp, sendOtp } from "@/store/slices/authSlice";
import { fetchWorkspaces } from "@/store/slices/workspaceSlice";

export default function OtpVerify() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pendingEmail, loading } = useSelector((s) => s.auth);
  const [digits, setDigits] = useState(["","","","","",""]);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const inputs = useRef([]);

  useEffect(() => {
    if (!pendingEmail) navigate("/login", { replace: true });
  }, [pendingEmail, navigate]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  const setDigit = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 5) inputs.current[i + 1]?.focus();
  };

  const onKeyDown = (i, e) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) inputs.current[i + 1]?.focus();
    if (e.key === "Enter") verify(digits.join(""));
  };

  const onPaste = (e) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!text) return;
    e.preventDefault();
    const next = text.split("").concat(Array(6 - text.length).fill(""));
    setDigits(next);
    const focusIdx = Math.min(text.length, 5);
    inputs.current[focusIdx]?.focus();
    if (text.length === 6) verify(text);
  };

  const verify = async (code) => {
    if (code.length !== 6) return setErr("Please enter all 6 digits");
    setErr("");

    const result = await dispatch(verifyOtp({ email: pendingEmail, otp: code }));

    if (verifyOtp.fulfilled.match(result)) {
      setSuccess(true);
      const wsResult = await dispatch(fetchWorkspaces());
      let hasWorkspaces = false;
      if (fetchWorkspaces.fulfilled.match(wsResult)) {
        const list = wsResult.payload?.data || [];
        if (list.length > 0) {
          hasWorkspaces = true;
        }
      }
      await new Promise((r) => setTimeout(r, 900));
      if (hasWorkspaces) {
        navigate("/app/dashboard");
      } else {
        navigate("/onboarding");
      }
    } else {
      const msg = result.payload?.errors?.[0]?.message || result.payload?.message || "Invalid code. Please try again.";
      setErr(msg);
      toast.error(msg);
    }
  };

  const resend = async () => {
    if (loading || secondsLeft > 0) return;
    const result = await dispatch(sendOtp(pendingEmail));
    if (sendOtp.fulfilled.match(result)) {
      toast.success("New code sent!");
      setSecondsLeft(60);
      setDigits(["","","","","",""]);
      inputs.current[0]?.focus();
    } else {
      toast.error("Failed to resend. Try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <button onClick={() => navigate("/login")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft size={16} /> Back
        </button>

        <GlassCard strong className="p-8">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="py-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 320, damping: 16 }}
                  className="w-16 h-16 rounded-full bg-[color:var(--primary)] mx-auto flex items-center justify-center text-white"
                >
                  <Check size={28} strokeWidth={3} />
                </motion.div>
                <h2 className="font-display text-xl font-bold mt-5">You're in!</h2>
                <p className="text-sm text-muted-foreground mt-1">Setting up your workspace…</p>
              </motion.div>
            ) : (
              <motion.div key="form" exit={{ opacity: 0 }}>
                <div className="w-12 h-12 rounded-[12px] bg-[color:var(--primary)]/10 text-[color:var(--primary)] flex items-center justify-center mb-5">
                  <Mail size={20} />
                </div>
                <h2 className="font-display text-2xl font-bold">Enter the 6-digit code</h2>
                <p className="text-sm text-muted-foreground mt-1.5">
                  We sent it to <span className="text-foreground font-medium">{pendingEmail}</span>
                </p>

                <div className="mt-7 flex gap-2 sm:gap-3 justify-between" onPaste={onPaste}>
                  {digits.map((d, i) => (
                    <input
                      key={i} ref={(el) => (inputs.current[i] = el)}
                      inputMode="numeric" maxLength={1}
                      value={d}
                      onChange={(e) => setDigit(i, e.target.value)}
                      onKeyDown={(e) => onKeyDown(i, e)}
                      className="w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-semibold rounded-[12px] bg-foreground/[0.04] border border-border outline-none focus:border-[color:var(--primary)] focus:ring-2 focus:ring-[color:var(--primary)]/20 transition-colors"
                    />
                  ))}
                </div>
                {err && <p className="text-xs text-red-500 mt-3">{err}</p>}

                <Button size="lg" className="w-full mt-6" onClick={() => verify(digits.join(""))} disabled={loading}>
                  {loading ? "Verifying…" : "Verify and continue"}
                </Button>

                <div className="mt-5 text-center text-xs text-muted-foreground">
                  {secondsLeft > 0 ? (
                    <>Resend code in <span className="text-foreground font-medium">{secondsLeft}s</span></>
                  ) : (
                    <button 
                      onClick={resend} 
                      disabled={loading}
                      className="text-[color:var(--primary)] font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Resending..." : "Resend code"}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </motion.div>
    </div>
  );
}
