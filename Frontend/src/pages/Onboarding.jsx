import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Sparkles, Loader2, Users, ArrowRight } from "lucide-react";
import Button from "@/components/common/Button";
import { GlassCard } from "@/components/common/Primitives";
import { fetchWorkspaces } from "@/store/slices/workspaceSlice";
import { listAllWorkspaces } from "@/services/workspace.api";
import {
  fetchMyInvitations,
  acceptInvitationAsync,
  fetchMyJoinRequestsAsync,
  submitJoinRequestAsync,
} from "@/store/slices/orgSlice";
import { logoutUser } from "@/store/slices/authSlice";

export default function Onboarding() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(s => s.auth.user);
  const myInvitations = useSelector(s => s.org.myInvitations);
  const myJoinRequests = useSelector(s => s.org.myJoinRequests);
  
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);
  const [allWorkspaces, setAllWorkspaces] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      try {
        const [invRes, wsRes, reqRes] = await Promise.all([
          dispatch(fetchMyInvitations()).unwrap(),
          dispatch(fetchWorkspaces()).unwrap(),
          dispatch(fetchMyJoinRequestsAsync()).unwrap(),
        ]);
        const invites = invRes.data || [];
        const list = wsRes.data || [];
        if (list.length > 0 && invites.length === 0) {
          navigate("/app/dashboard", { replace: true });
          return;
        }

        // Fetch all workspaces for potential request to join if user has no workspaces
        if (list.length === 0) {
          const allWsRes = await listAllWorkspaces();
          setAllWorkspaces(allWsRes.data?.data || []);
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
      await Promise.all([
        dispatch(fetchMyInvitations()).unwrap(),
        dispatch(fetchMyJoinRequestsAsync()).unwrap(),
      ]);
      toast.success("Refreshed invitations and request status");
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
      const wsResult = await dispatch(fetchWorkspaces());
      if (fetchWorkspaces.fulfilled.match(wsResult)) {
        navigate("/app/dashboard");
      }
    } else {
      toast.error(result.payload?.message || "Failed to join workspace");
    }
    setAcceptingId(null);
  };

  const handleRequestJoin = async () => {
    if (!selectedWorkspaceId) {
      toast.error("Please select a workspace to request access");
      return;
    }
    setSubmittingRequest(true);
    const result = await dispatch(submitJoinRequestAsync(selectedWorkspaceId));
    if (submitJoinRequestAsync.fulfilled.match(result)) {
      toast.success("Join request submitted successfully!");
      // Re-fetch pending requests to show the pending message
      await dispatch(fetchMyJoinRequestsAsync()).unwrap();
    } else {
      toast.error(result.payload || "Failed to submit request to join");
    }
    setSubmittingRequest(false);
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
          <p className="text-sm text-muted-foreground animate-pulse">Checking access status...</p>
        </div>
      </div>
    );
  }

  // Find user's active/pending join request if any
  const pendingRequest = myJoinRequests.find(r => r.status === "PENDING");

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
        ) : pendingRequest ? (
          <GlassCard strong className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-2">
              <Users size={32} />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold">Request Pending</h2>
              <p className="text-xs text-amber-500 font-semibold uppercase tracking-wider mt-1">Pending Admin Approval</p>
              <p className="text-xs text-muted-foreground">Medicaps University</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground text-center">
                Your join request for the workspace <span className="font-semibold text-foreground">"{pendingRequest.workspace?.name || "Workspace"}"</span> is pending review.
              </p>
              <p className="text-xs text-muted-foreground/80 italic bg-foreground/[0.02] p-3 rounded-lg border border-border/40 text-center">
                You can only submit one join request at a time. A notification has been sent to the workspace admins.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
              <Button variant="outline" onClick={handleRefresh}>
                Check Status
              </Button>
              <Button variant="ghost" onClick={handleLogout}>
                Log out
              </Button>
            </div>
            <div className="text-xs text-muted-foreground pt-4 border-t border-border">
              Logged in as {user.email}
            </div>
          </GlassCard>
        ) : (
          <GlassCard strong className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
              <Sparkles size={32} />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold">Welcome, {user.name || "Developer"}</h2>
              <p className="text-xs text-primary font-semibold uppercase tracking-wider mt-1">SDC Developer's Community</p>
              <p className="text-xs text-muted-foreground">Medicaps University</p>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Your account is active, but you are not a member of any workspace yet. Ask your project manager for an invite, or request to join a community workspace below.
            </p>

            {allWorkspaces.length > 0 ? (
              <div className="space-y-3 text-left border-t border-border pt-4">
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Select Workspace to Join</label>
                <select
                  value={selectedWorkspaceId}
                  onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)] text-foreground"
                >
                  <option value="">-- Choose a Workspace --</option>
                  {allWorkspaces.map(ws => (
                    <option key={ws._id || ws.id} value={ws._id || ws.id}>
                      {ws.name}
                    </option>
                  ))}
                </select>
                <Button
                  className="w-full mt-2"
                  onClick={handleRequestJoin}
                  disabled={submittingRequest || !selectedWorkspaceId}
                >
                  {submittingRequest ? <Loader2 className="animate-spin" size={16} /> : (
                    <>
                      Request Access <ArrowRight size={16} />
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="p-3 border border-dashed border-border rounded-xl text-xs text-muted-foreground bg-foreground/[0.01]">
                No workspaces available to request join. Please contact the community manager to set up a workspace first.
              </div>
            )}

            <div className="pt-2 flex justify-center">
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
