import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Plus, Mail, MoreHorizontal, Trash2 } from "lucide-react";
import { GlassCard, Badge, Input, Label, Select } from "@/components/common/Primitives";
import Button from "@/components/common/Button";
import Modal from "@/components/common/Modal";
import Avatar from "@/components/common/Avatar";
import { roleLabel, roleTone, formatRelative } from "@/lib/format";
import { inviteMember, acceptInvitation, removeMember, updateMemberRole } from "@/store/slices/orgSlice";
import { ROLES } from "@/store/seed";

export default function Teams() {
  const dispatch = useDispatch();
  const members = useSelector(s => s.org.members);
  const invitations = useSelector(s => s.org.invitations);
  const orgs = useSelector(s => s.org.orgs);
  const orgId = orgs[0]?.id;

  const [inviteOpen, setInviteOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: ROLES.DEVELOPER });

  const send = () => {
    if (!form.name.trim() || !form.email.trim() || !orgId) return;
    dispatch(inviteMember({ orgId, name: form.name.trim(), email: form.email.trim(), role: form.role }));
    toast.success(`Invitation sent to ${form.email}`);
    setForm({ name: "", email: "", role: ROLES.DEVELOPER });
    setInviteOpen(false);
  };

  const accept = (id) => {
    dispatch(acceptInvitation(id));
    toast.success("Invitation accepted (mock)");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Team</h1>
          <p className="text-sm text-muted-foreground mt-1">{members.length} members · {invitations.filter(i => i.status === "pending").length} pending invites</p>
        </div>
        <Button onClick={() => setInviteOpen(true)}><Plus size={16} /> Invite member</Button>
      </div>

      <GlassCard className="p-0 overflow-hidden">
        <div className="px-5 py-3 border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground grid grid-cols-12 gap-3">
          <div className="col-span-5">Member</div>
          <div className="col-span-3 hidden md:block">Email</div>
          <div className="col-span-3 md:col-span-2">Role</div>
          <div className="col-span-4 md:col-span-2 text-right">Actions</div>
        </div>
        {members.map(m => (
          <div key={m.id} className="px-5 py-3 grid grid-cols-12 gap-3 items-center border-b border-border last:border-b-0 hover:bg-foreground/[0.02]">
            <div className="col-span-5 flex items-center gap-3 min-w-0">
              <Avatar name={m.name} color={m.avatarColor} />
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{m.name}</div>
                <div className="text-xs text-muted-foreground md:hidden truncate">{m.email}</div>
              </div>
            </div>
            <div className="col-span-3 hidden md:block text-sm text-muted-foreground truncate">{m.email}</div>
            <div className="col-span-3 md:col-span-2">
              <Select value={m.role} onChange={(e) => dispatch(updateMemberRole({ id: m.id, role: e.target.value }))} className="h-8 text-xs py-0">
                <option value={ROLES.ADMIN}>Admin</option>
                <option value={ROLES.TEAM_LEAD}>Team Lead</option>
                <option value={ROLES.DEVELOPER}>Developer</option>
              </Select>
            </div>
            <div className="col-span-4 md:col-span-2 text-right">
              <button onClick={() => { dispatch(removeMember(m.id)); toast.success("Member removed"); }}
                className="p-1.5 rounded-md hover:bg-foreground/5 text-muted-foreground">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </GlassCard>

      <GlassCard>
        <h3 className="font-display font-semibold mb-3 flex items-center gap-2"><Mail size={15} /> Invitations</h3>
        {invitations.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No invitations sent yet.</p>
        ) : (
          <ul className="divide-y divide-border -mx-2">
            {invitations.map(inv => (
              <li key={inv.id} className="px-2 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-foreground/5 flex items-center justify-center text-muted-foreground"><Mail size={14} /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{inv.name} — <span className="text-muted-foreground">{inv.email}</span></div>
                  <div className="text-xs text-muted-foreground">Sent {formatRelative(inv.sentAt)} · {roleLabel(inv.role)}</div>
                </div>
                <Badge tone={inv.status === "accepted" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"}>
                  {inv.status}
                </Badge>
                {inv.status === "pending" && <Button size="sm" variant="outline" onClick={() => accept(inv.id)}>Simulate accept</Button>}
              </li>
            ))}
          </ul>
        )}
      </GlassCard>

      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite a member"
        footer={<div className="flex justify-end gap-2"><Button variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</Button><Button onClick={send} disabled={!form.name.trim() || !form.email.trim()}>Send invitation</Button></div>}>
        <div className="space-y-4">
          <div><Label>Name</Label><Input className="mt-1.5" autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Email</Label><Input className="mt-1.5" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><Label>Role</Label>
            <Select className="mt-1.5" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value={ROLES.ADMIN}>Admin</option>
              <option value={ROLES.TEAM_LEAD}>Team Lead</option>
              <option value={ROLES.DEVELOPER}>Developer</option>
            </Select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
