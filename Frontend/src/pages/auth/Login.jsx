import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { z } from "zod";
import { ArrowRight, Mail, Sparkles, Check, Boxes, Trello, BarChart3 } from "lucide-react";
import Button from "@/components/common/Button";
import { Input, Label, GlassCard } from "@/components/common/Primitives";
import { useGoogleLogin  } from "@react-oauth/google";
import { sendOtp, googleLoginAsync } from "@/store/slices/authSlice";
import { fetchWorkspaces } from "@/store/slices/workspaceSlice";

const emailSchema = z
  .string()
  .email("Please enter a valid email")
  .refine(
    (val) => val.endsWith("@medicaps.ac.in"),
    "Only Medicaps University email addresses (@medicaps.ac.in) are allowed to log in."
  );

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [hasClientId, setHasClientId] = useState(false);

  const clientId = null;

  useEffect(() => {
    if (!clientId) return;
    setHasClientId(true);

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            setLoading(true);
            const result = await dispatch(googleLoginAsync(response.credential));
            if (googleLoginAsync.fulfilled.match(result)) {
              toast.success("Logged in with Google!");
              const wsResult = await dispatch(fetchWorkspaces());
              const list = wsResult.payload?.data || [];
              if (list.length > 0) {
                navigate("/app/dashboard");
              } else {
                navigate("/onboarding");
              }
            } else {
              toast.error(result.payload?.message || "Google Sign-In failed.");
            }
            setLoading(false);
          },
        });
        window.google.accounts.id.renderButton(
          document.getElementById("google-signin-btn"),
          { theme: "outline", size: "large", type: "standard", shape: "rectangular", width: "100%" }
        );
      }
    };

    return () => {
      try {
        document.body.removeChild(script);
      } catch (e) {}
    };
  }, [dispatch, navigate, clientId]);

  const handleSendOtp = async () => {
    setErr("");
    const r = emailSchema.safeParse(email.trim());
    if (!r.success) return setErr(r.error.issues[0].message);

    setLoading(true);
    const result = await dispatch(sendOtp(email.trim()));

    if (sendOtp.fulfilled.match(result)) {
      toast.success("OTP sent!", { description: `Check your inbox at ${email.trim()}` });
      navigate("/login/otp");
    } else {
      const msg = result.payload?.message || "Failed to send OTP. Please try again.";
      setErr(msg);
      toast.error(msg);
    }
    setLoading(false);
  };


  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const result = await dispatch(
          googleLoginAsync(tokenResponse.access_token)
        );

        if (googleLoginAsync.fulfilled.match(result)) {
          toast.success("Logged in successfully!");

          const wsResult = await dispatch(fetchWorkspaces());
          const list = wsResult.payload?.data || [];

          navigate(list.length > 0 ? "/app/dashboard" : "/onboarding");
        } else {
          toast.error(result.payload?.message || "Google Sign-In failed");
        }
      } catch (err) {
        toast.error("Login failed");
      }
    },
    onError: () => {
      toast.error("Google Login Failed");
    },
  });

  const handleGoogleSignIn = () => {
    googleLogin();
  };


  const handleMockGoogleSignIn = async () => {
    setLoading(true);
    const result = await dispatch(googleLoginAsync("mock-google-token"));
    if (googleLoginAsync.fulfilled.match(result)) {
      toast.success("Logged in with Demo Google account!");
      const wsResult = await dispatch(fetchWorkspaces());
      const list = wsResult.payload?.data || [];
      if (list.length > 0) {
        navigate("/app/dashboard");
      } else {
        navigate("/onboarding");
      }
    } else {
      toast.error(result.payload?.message || "Google Sign-In failed.");
    }
    setLoading(false);
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
            <p className="text-sm text-muted-foreground mt-1.5">Enter your email to receive a sign-in code.</p>

            <div className="mt-7 space-y-3">
              <div>
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email" type="email" autoFocus
                  className="mt-1.5"
                  placeholder="you@company.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                />
                {err && <p className="text-xs text-red-500 mt-1.5">{err}</p>}
              </div>
              <Button size="lg" className="w-full" onClick={handleSendOtp} disabled={loading}>
                <Mail size={16} /> {loading ? "Sending..." : "Continue with email"}
                {!loading && <ArrowRight size={16} />}
              </Button>
            </div>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-popover px-2 text-muted-foreground">Or</span></div>
            </div>

            {hasClientId ? (
              <div id="google-signin-btn" className="w-full min-h-[40px] flex justify-center" />
            ) : (
              <Button
                variant="outline"
                size="lg"
                className="w-full flex items-center justify-center gap-2"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    className="fill-[#4285F4]"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    className="fill-[#34A853]"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    className="fill-[#FBBC05]"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    className="fill-[#EA4335]"
                  />
                </svg>
                Continue with Google
              </Button>
            )}

            <p className="text-[11px] text-muted-foreground text-center mt-6 leading-relaxed">
              By continuing you agree to our <a className="underline">Terms</a> and <a className="underline">Privacy Policy</a>.
            </p>
          </GlassCard>
        </motion.div>
      </div>
    </div>
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
