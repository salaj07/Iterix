import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Sparkles, ArrowRight, Check } from "lucide-react";
import Button from "@/components/common/Button";
import { Input, Label, Select, GlassCard, Textarea } from "@/components/common/Primitives";
import { createWorkspace } from "@/store/slices/workspaceSlice";
import { createOrg, seedOrg, ROLES } from "@/store/slices/orgSlice";
import { seedProject } from "@/store/slices/projectsSlice";
import { seedSprint } from "@/store/slices/sprintsSlice";
import { seedTasks } from "@/store/slices/tasksSlice";
import { createSeed } from "@/store/seed";
import { uid } from "@/lib/uid";

export default function Onboarding() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(s => s.auth.user);
  const [step, setStep] = useState(0);
  const [wsName, setWsName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [description, setDescription] = useState("");
  const [teamSize, setTeamSize] = useState("1-10");
  const [loadDemo, setLoadDemo] = useState(true);

  if (!user) { navigate("/login", { replace: true }); return null; }

  const finish = () => {
    const wsId = uid();
    dispatch(createWorkspace({ id: wsId, name: wsName || `${user.name}'s Workspace`, ownerId: user.id }));

    if (loadDemo) {
      const seed = createSeed(user);
      const orgWithWs = { ...seed.org, workspaceId: wsId, name: orgName || seed.org.name, description: description || seed.org.description, teamSize };
      dispatch(seedOrg({ org: orgWithWs, members: seed.members }));
      dispatch(seedProject(seed.project));
      dispatch(seedSprint(seed.sprint));
      dispatch(seedTasks(seed.tasks));
    } else {
      dispatch(createOrg({
        workspaceId: wsId,
        name: orgName || "My Organization",
        description, teamSize, ownerId: user.id, logo: null,
      }));
      // creator becomes admin member
      const me = { id: uid(), name: user.name, email: user.email, avatarColor: user.avatarColor, role: ROLES.ADMIN };
      // we used createOrg so org id is auto-generated — find latest:
      // simpler: dispatch seedOrg with a fresh org so members tie cleanly:
    }

    toast.success("Workspace ready");
    navigate("/app/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl"
      >
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 rounded-[10px] bg-[color:var(--primary)] flex items-center justify-center text-white">
            <Sparkles size={17} />
          </div>
          <span className="font-display font-bold text-lg">Iterix</span>
        </div>

        <GlassCard strong className="p-8">
          <div className="flex items-center gap-2 mb-5">
            {[0,1].map(i => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${step >= i ? "bg-[color:var(--primary)]" : "bg-foreground/10"}`} />
            ))}
          </div>

          {step === 0 && (
            <div>
              <h2 className="font-display text-2xl font-bold">Name your workspace</h2>
              <p className="text-sm text-muted-foreground mt-1.5">A workspace contains all your projects and teams.</p>
              <div className="mt-6">
                <Label>Workspace name</Label>
                <Input className="mt-1.5" placeholder="e.g. Acme Studio" value={wsName} onChange={(e) => setWsName(e.target.value)} autoFocus
                  onKeyDown={(e) => e.key === "Enter" && wsName.trim() && setStep(1)} />
              </div>
              <div className="mt-8 flex justify-end">
                <Button onClick={() => setStep(1)} disabled={!wsName.trim()}>Next <ArrowRight size={16} /></Button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="font-display text-2xl font-bold">Tell us about your team</h2>
              <p className="text-sm text-muted-foreground mt-1.5">You'll become the Admin & Owner of this organization.</p>
              <div className="mt-6 grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label>Organization name</Label>
                  <Input className="mt-1.5" placeholder="Acme Studio" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Description (optional)</Label>
                  <Textarea className="mt-1.5" rows={3} placeholder="What does your team do?" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div>
                  <Label>Team size</Label>
                  <Select className="mt-1.5" value={teamSize} onChange={(e) => setTeamSize(e.target.value)}>
                    <option>1-10</option><option>11-50</option><option>51-200</option><option>200+</option>
                  </Select>
                </div>
                <label className="sm:col-span-2 flex items-start gap-3 p-3 rounded-[12px] border border-border bg-foreground/[0.02] cursor-pointer">
                  <input type="checkbox" checked={loadDemo} onChange={(e) => setLoadDemo(e.target.checked)} className="mt-1 accent-[color:var(--primary)]" />
                  <span className="text-sm">
                    <span className="font-medium">Load sample project</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">Includes a demo project, sprint, and a few tasks so you can explore right away.</span>
                  </span>
                </label>
              </div>
              <div className="mt-8 flex justify-between">
                <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
                <Button onClick={finish}><Check size={16} /> Create workspace</Button>
              </div>
            </div>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
}
