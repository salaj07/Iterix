import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowRight, Mail, Sparkles, Check, Boxes, Trello, BarChart3 } from "lucide-react";
import Button from "@/components/common/Button";
import { Input, Label, GlassCard } from "@/components/common/Primitives";
import { issueOtp, loginSuccess } from "@/store/slices/authSlice";
import { uid } from "@/lib/uid";

const emailSchema = z.string().email("Please enter a valid email");

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const sendOtp = async () => {
    setErr("");
    const r = emailSchema.safeParse(email.trim());
    if (!r.success) return setErr(r.error.issues[0].message);
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    dispatch(issueOtp({ email: email.trim(), otp }));
    toast.success(`Your code: ${otp}`, { description: `Sent to ${email.trim()}`, duration: 8000 });
    setLoading(false);
    navigate("/login/otp");
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    dispatch(loginSuccess({
      id: uid(),
      name: "Demo User",
      email: "demo@Iterix.app",
      avatarColor: "#FF6044",
    }));
    toast.success("Welcome back!");
    navigate("/app/dashboard");
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden bg-foreground/[0.02] border-r border-border">
        <button onClick={() => navigate("/")} className="flex items-center gap-2.5 self-start">
          <div className="w-9 h-9 rounded-[10px] bg-[color:var(--primary)] flex items-center justify-center text-white">
            <Sparkles size={17} />
          </div>
          <span className="font-display font-bold text-lg">Iterix</span>
        </button>

        <div className="max-w-md">
          <h1 className="font-display text-4xl xl:text-5xl font-bold leading-[1.05] tracking-tight">
            The calm home for your team's work.
          </h1>
          <p className="mt-5 text-muted-foreground">
            Plan sprints, track Kanban, and ship together — without the chaos.
          </p>
          <ul className="mt-10 space-y-3">
            {[
              { icon: Trello, t: "Premium Kanban with smooth drag-and-drop" },
              { icon: Boxes, t: "Multi-workspace, multi-project from day one" },
              { icon: BarChart3, t: "Velocity & workload at a glance" },
            ].map(({icon: Ic, t}) => (
              <li key={t} className="flex items-center gap-3 text-sm">
                <span className="w-8 h-8 rounded-[10px] bg-foreground/5 flex items-center justify-center text-[color:var(--primary)]">
                  <Ic size={15} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        <ProductPreview />
      </div>

      {/* Right auth panel */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md"
        >
          <button onClick={() => navigate("/")} className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-[10px] bg-[color:var(--primary)] flex items-center justify-center text-white">
              <Sparkles size={16} />
            </div>
            <span className="font-display font-bold">Iterix</span>
          </button>

          <GlassCard strong className="p-8">
            <h2 className="font-display text-2xl font-bold">Welcome back</h2>
            <p className="text-sm text-muted-foreground mt-1.5">Sign in with email or your Google account.</p>

            <div className="mt-7 space-y-3">
              <Button variant="outline" size="lg" className="w-full" onClick={loginWithGoogle} disabled={loading}>
                <GoogleIcon /> Continue with Google
              </Button>

              <div className="flex items-center gap-3 my-1">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div>
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email" type="email" autoFocus
                  className="mt-1.5"
                  placeholder="you@company.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendOtp()}
                />
                {err && <p className="text-xs text-red-500 mt-1.5">{err}</p>}
              </div>
              <Button size="lg" className="w-full" onClick={sendOtp} disabled={loading}>
                <Mail size={16} /> {loading ? "Sending..." : "Continue with email"}
                {!loading && <ArrowRight size={16} />}
              </Button>
            </div>

            <p className="text-[11px] text-muted-foreground text-center mt-6 leading-relaxed">
              By continuing you agree to our <a className="underline">Terms</a> and <a className="underline">Privacy Policy</a>.
            </p>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4.1-5.5 4.1-3.3 0-6-2.7-6-6.2 0-3.4 2.7-6.2 6-6.2 1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.1 14.7 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.7 0 9.5-4 9.5-9.7 0-.7-.1-1.2-.2-1.7L12 10.2z" />
    </svg>
  );
}

function ProductPreview() {
  return (
    <div className="relative mt-12 hidden xl:block">
      <div className="glass-strong p-4">
        <div className="flex items-center gap-1.5 mb-3">
          <div className="w-2 h-2 rounded-full bg-foreground/20" />
          <div className="w-2 h-2 rounded-full bg-foreground/20" />
          <div className="w-2 h-2 rounded-full bg-foreground/20" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {["Todo","Doing","Done"].map((c, ci) => (
            <div key={c} className="glass-flat p-2 min-h-[140px]">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">{c}</div>
              {[0,1].map(i => (
                <div key={i} className="rounded-md bg-background/60 border border-border p-2 mb-1.5">
                  <div className="text-[10px] text-muted-foreground">FB-{12 + ci*2 + i}</div>
                  <div className="text-[11px] font-medium mt-0.5">Task title here</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
