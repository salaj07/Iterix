import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import Button from "@/components/common/Button";
import { GlassCard } from "@/components/common/Primitives";
import { fetchWorkspaces } from "@/store/slices/workspaceSlice";
import { fetchMyInvitations, acceptInvitationAsync } from "@/store/slices/orgSlice";
import { logoutUser } from "@/store/slices/authSlice";

export default function Onboarding() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(s => s.auth.user);
  const myInvitations = useSelector(s => s.org.myInvitations);
  
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      try {
        const [invRes, wsRes] = await Promise.all([
          dispatch(fetchMyInvitations()).unwrap(),
          dispatch(fetchWorkspaces()).unwrap(),
        ]);
        const invites = invRes.data || [];
        const list = wsRes.data || [];
        if (list.length > 0 && invites.length === 0) {
          navigate("/app/dashboard", { replace: true });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [dispatch, user, navigate]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const wsRes = await dispatch(fetchWorkspaces()).unwrap();
      const list = wsRes.data || [];
      if (list.length > 0) {
        navigate("/app/dashboard");
        return;
      }
      await dispatch(fetchMyInvitations()).unwrap();
      toast.success("Refreshed invitations list");
    } catch (e) {
      console.error(e);
      toast.error("Failed to check for updates");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (inviteId) => {
    setAcceptingId(inviteId);
    const result = await dispatch(acceptInvitationAsync(inviteId));
    if (acceptInvitationAsync.fulfilled.match(result)) {
      toast.success("Joined workspace successfully!");
      // Reload workspaces to verify membership
      const wsResult = await dispatch(fetchWorkspaces());
      if (fetchWorkspaces.fulfilled.match(wsResult)) {
        navigate("/app/dashboard");
      }
    } else {
      toast.error(result.payload?.message || "Failed to join workspace");
    }
    setAcceptingId(null);
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin text-primary mx-auto" size={40} />
          <p className="text-sm text-muted-foreground animate-pulse">Checking for invitations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 rounded-[10px] bg-[color:var(--primary)] flex items-center justify-center text-white font-bold">
            <Sparkles size={17} />
          </div>
          <span className="font-display font-bold text-lg">Iterix</span>
        </div>

        {myInvitations.length > 0 ? (
          <GlassCard strong className="p-8">
            <h2 className="font-display text-2xl font-bold text-center mb-2">You've been invited!</h2>
            <p className="text-sm text-muted-foreground text-center mb-6">
              You have pending invitations to join a workspace at Medicaps University.
            </p>
            <div className="space-y-3">
              {myInvitations.map(inv => (
                <div key={inv.id} className="p-4 border border-border rounded-xl flex items-center justify-between gap-4 bg-foreground/[0.01]">
                  <div>
                    <div className="font-semibold text-sm">{inv.name}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">Role: {inv.role}</div>
                  </div>
                  <Button onClick={() => handleAccept(inv.id)} disabled={acceptingId !== null}>
                    {acceptingId === inv.id ? <Loader2 className="animate-spin" size={14} /> : "Join"}
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-between items-center text-xs text-muted-foreground border-t border-border pt-4">
              <span>Logged in as {user.email}</span>
              <button onClick={handleLogout} className="hover:text-foreground underline">Log out</button>
            </div>
          </GlassCard>
        ) : (
          <GlassCard strong className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
              <Sparkles size={32} />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold">Access Pending</h2>
              <p className="text-xs text-primary font-semibold uppercase tracking-wider mt-1">Developer's Community</p>
              <p className="text-xs text-muted-foreground">Medicaps University</p>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Your account is active, but you are not a member of any workspace yet. 
              Please ask the community manager or your project leader to invite you.
            </p>
            <div className="p-3 border border-dashed border-border rounded-xl text-xs text-muted-foreground bg-foreground/[0.01]">
              If you want to create a new workspace or request admin permissions, please contact the community manager.
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <Button variant="outline" onClick={handleRefresh}>
                Check Again
              </Button>
              <Button variant="ghost" onClick={handleLogout}>
                Log out
              </Button>
            </div>
            <div className="text-xs text-muted-foreground pt-4 border-t border-border">
              Logged in as {user.email}
            </div>
          </GlassCard>
        )}
      </motion.div>
    </div>
  );
}
