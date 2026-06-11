import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import { toast } from "sonner";
import { Moon, Sun, Trash2 } from "lucide-react";
import { GlassCard, Input, Label, Textarea } from "@/components/common/Primitives";
import Button from "@/components/common/Button";
import Avatar from "@/components/common/Avatar";
import { setTheme } from "@/store/slices/themeSlice";
import { updateProfile } from "@/store/slices/authSlice";
import { clearState } from "@/store/persist";

export default function Settings() {
  const dispatch = useDispatch();
  const user = useSelector(s => s.auth.user);
  const orgs = useSelector(s => s.org.orgs);
  const theme = useSelector(s => s.theme.mode);
  const org = orgs[0];

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-3xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your profile, organization, and appearance.</p>
      </div>

      <GlassCard>
        <h3 className="font-display font-semibold mb-4">Profile</h3>
        <div className="flex items-center gap-4 mb-5">
          <Avatar name={name} color={user?.avatarColor} size={56} />
          <div className="text-sm text-muted-foreground">Avatar is generated from your initials.</div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Name</Label><Input className="mt-1.5" value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div><Label>Email</Label><Input className="mt-1.5" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        </div>
        <div className="mt-5">
          <Button onClick={() => { dispatch(updateProfile({ name, email })); toast.success("Profile updated"); }}>Save changes</Button>
        </div>
      </GlassCard>

      {org && (
        <GlassCard>
          <h3 className="font-display font-semibold mb-4">Organization</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Name</Label><Input className="mt-1.5" defaultValue={org.name} disabled /></div>
            <div><Label>Team size</Label><Input className="mt-1.5" defaultValue={org.teamSize} disabled /></div>
            <div className="sm:col-span-2"><Label>Description</Label><Textarea className="mt-1.5" defaultValue={org.description} disabled /></div>
          </div>
        </GlassCard>
      )}

      <GlassCard>
        <h3 className="font-display font-semibold mb-4">Appearance</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: "light", label: "Light", icon: Sun },
            { id: "dark", label: "Dark", icon: Moon },
          ].map(({ id, label, icon: Ic }) => (
            <button key={id} onClick={() => dispatch(setTheme(id))}
              className={`p-4 rounded-[14px] border text-left ${theme === id ? "border-[color:var(--primary)] bg-[color:var(--primary)]/8" : "border-border hover:bg-foreground/5"}`}>
              <Ic size={18} className="mb-2 text-[color:var(--primary)]" />
              <div className="font-medium text-sm">{label}</div>
              <div className="text-xs text-muted-foreground">{id === "dark" ? "#121313 + coral accents" : "#FFF2E1 + warm taupe"}</div>
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <h3 className="font-display font-semibold mb-1 text-red-500">Danger zone</h3>
        <p className="text-xs text-muted-foreground mb-4">Reset all local data and start fresh.</p>
        <Button variant="danger" onClick={() => { clearState(); toast.success("Local data cleared"); setTimeout(() => location.reload(), 600); }}>
          <Trash2 size={15} /> Clear all data
        </Button>
      </GlassCard>
    </div>
  );
}
