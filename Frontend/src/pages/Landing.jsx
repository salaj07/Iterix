import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Check,
  Trello,
  Users,
  BarChart3,
  Layers,
  Boxes,
  Star,
  Twitter,
  Github,
  Linkedin,
} from "lucide-react";
import Button from "@/components/common/Button";
import { GlassCard } from "@/components/common/Primitives";

const features = [
  {
    icon: Trello,
    title: "Kanban that feels alive",
    body: "Smooth drag-and-drop, instant updates, and layout animations across every column.",
  },
  {
    icon: Layers,
    title: "Agile sprints, organised",
    body: "Plan sprints, drag from the backlog, watch velocity in real time.",
  },
  {
    icon: Users,
    title: "Built for teams",
    body: "Admins, leads, developers — clear roles, clear ownership.",
  },
  {
    icon: BarChart3,
    title: "Workload analytics",
    body: "Spot bottlenecks before they happen with calm, glanceable charts.",
  },
  {
    icon: Boxes,
    title: "Multi-project at home",
    body: "Group projects in workspaces. Switch in a click.",
  },
];

const testimonials = [
  {
    name: "Priya Shah",
    role: "Engineering Manager, Northwind",
    q: "We replaced two tools with Iterix. The team actually looks forward to standup now.",
  },
  {
    name: "Tom Becker",
    role: "Product Lead, Foliant",
    q: "Finally a Kanban that doesn't get in the way. The motion makes status changes feel deliberate.",
  },
  {
    name: "Aiko Tanaka",
    role: "Founder, Pebbleworks",
    q: "The light theme alone made me switch. It just feels expensive.",
  },
];

export default function Landing() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-background/70 border-b border-border">
        <div className="max-w-7xl mx-auto h-16 px-6 flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-[color:var(--primary)] flex items-center justify-center text-white">
              <Sparkles size={16} />
            </div>
            <span className="font-display font-bold tracking-tight">Iterix</span>
          </Link>
          <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#testimonials" className="hover:text-foreground transition-colors">
              Customers
            </a>
            <a href="#about" className="hover:text-foreground transition-colors">
              About
            </a>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Sign in
            </Button>
            <Button onClick={() => navigate("/login")}>
              Get started <ArrowRight size={15} />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 pt-20 md:pt-28 pb-20 grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-flat text-xs text-muted-foreground mb-6"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--primary)]" />
                New: smart sprint planning
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="font-display text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.02]"
              >
                The project tool your team will actually open.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mt-6 text-lg text-muted-foreground max-w-xl"
              >
                Iterix brings together Kanban, sprints, and team workload into one calm, premium
                workspace — without the bloat.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="mt-8 flex flex-wrap items-center gap-3"
              >
                <Button size="lg" onClick={() => navigate("/login")}>
                  Start free <ArrowRight size={16} />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() =>
                    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Explore features
                </Button>
              </motion.div>
              <div className="mt-8 flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Check size={14} className="text-[color:var(--primary)]" /> No credit card
                </span>
                <span className="flex items-center gap-1.5">
                  <Check size={14} className="text-[color:var(--primary)]" /> 14-day trial
                </span>
                <span className="flex items-center gap-1.5">
                  <Check size={14} className="text-[color:var(--primary)]" /> Unlimited projects
                </span>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-6"
            >
              <ProductMock />
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 border-t border-border">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-2xl">
              <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
                Everything your team needs.
                <br />
                <span className="text-muted-foreground">Nothing it doesn't.</span>
              </h2>
            </div>
            <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <GlassCard className="h-full">
                    <div className="w-10 h-10 rounded-[12px] bg-[color:var(--primary)]/10 text-[color:var(--primary)] flex items-center justify-center mb-4">
                      <f.icon size={18} />
                    </div>
                    <h3 className="font-display font-semibold text-lg mb-1.5">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Screenshots strip */}
        <section className="py-20 border-t border-border">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight max-w-xl">
              A workspace that scales from solo to 200 engineers.
            </h2>
            <div className="mt-12 grid md:grid-cols-3 gap-5">
              {["Kanban board", "Sprint planning", "Team analytics"].map((label, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  className="glass overflow-hidden p-0"
                >
                  <ScreenMock variant={i} />
                  <div className="p-4 text-sm font-medium">{label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-24 border-t border-border">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight max-w-2xl">
              Loved by product teams who care about craft.
            </h2>
            <div className="mt-12 grid md:grid-cols-3 gap-5">
              {testimonials.map((t, i) => (
                <motion.div
                  key={t.name}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                >
                  <GlassCard className="h-full">
                    <div className="flex gap-1 text-[color:var(--primary)] mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill="currentColor" />
                      ))}
                    </div>
                    <p className="text-sm leading-relaxed mb-5">"{t.q}"</p>
                    <div className="text-xs">
                      <span className="font-semibold">{t.name}</span>
                      <span className="text-muted-foreground"> — {t.role}</span>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section id="about" className="py-24 border-t border-border">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight">
              Ship the next sprint, calmly.
            </h2>
            <p className="mt-5 text-muted-foreground">
              Set up your first workspace in under a minute.
            </p>
            <div className="mt-8">
              <Button size="lg" onClick={() => navigate("/login")}>
                Create your workspace <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[color:var(--primary)] flex items-center justify-center text-white">
              <Sparkles size={12} />
            </div>
            <span className="font-display font-semibold text-foreground">Iterix</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-foreground">
              <Twitter size={16} />
            </a>
            <a href="#" className="hover:text-foreground">
              <Github size={16} />
            </a>
            <a href="#" className="hover:text-foreground">
              <Linkedin size={16} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProductMock() {
  return (
    <div className="glass-strong p-0 overflow-hidden">
      <div className="h-9 border-b border-border flex items-center gap-1.5 px-3.5">
        <span className="w-2.5 h-2.5 rounded-full bg-foreground/20" />
        <span className="w-2.5 h-2.5 rounded-full bg-foreground/20" />
        <span className="w-2.5 h-2.5 rounded-full bg-foreground/20" />
        <span className="mx-auto text-[11px] text-muted-foreground">
          Iterix.app / atlas / board
        </span>
      </div>
      <div className="p-4 grid grid-cols-3 gap-3 bg-foreground/[0.02]">
        {["Todo", "In Progress", "Done"].map((col, c) => (
          <div key={col} className="glass-flat p-3">
            <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground mb-2.5">
     sp         <span className="uppercase tracking-wider">{col}</span>
              <span>{c === 0 ? 4 : c === 1 ? 2 : 3}</span>
            </div>
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + (c * 3 + i) * 0.05 }}
                  className="rounded-[10px] bg-background/60 border border-border p-2.5"
                >
                  <div className="text-[11px] text-muted-foreground">ATL-{12 + c * 3 + i}</div>
                  <div className="text-[12px] font-medium mt-0.5">
                    {
                      [
                        "Refactor sprint API",
                        "Polish onboarding",
                        "Audit colour tokens",
                        "Sticky filter bar",
                        "Move review queue",
                      ][(c * 3 + i) % 5]
                    }
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[color:var(--primary)]/15 text-[color:var(--primary)]">
                      {["Story", "Bug", "Task"][i % 3]}
                    </span>
                    <div className="w-5 h-5 rounded-full bg-[color:var(--primary)]/40" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScreenMock({ variant }) {
  if (variant === 1) {
    return (
      <div className="aspect-[16/10] bg-foreground/[0.03] p-4">
        <div className="flex justify-between mb-3">
          <div className="h-3 w-32 bg-foreground/10 rounded" />
          <div className="h-3 w-16 bg-foreground/10 rounded" />
        </div>
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-9 rounded-lg bg-background/60 border border-border flex items-center px-3 gap-3"
            >
              <div className="w-1 h-5 rounded-full bg-[color:var(--primary)]/60" />
              <div className="h-2.5 flex-1 bg-foreground/10 rounded" />
              <div className="h-2.5 w-12 bg-foreground/10 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (variant === 2) {
    return (
      <div className="aspect-[16/10] bg-foreground/[0.03] p-4 grid grid-cols-2 gap-3">
        <div className="glass-flat p-3">
          <div className="h-2.5 w-20 bg-foreground/10 rounded mb-3" />
          <div className="h-24 flex items-end gap-1.5">
            {[0.4, 0.7, 0.5, 0.85, 0.6, 0.95].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm bg-[color:var(--primary)]/50"
                style={{ height: `${h * 100}%` }}
              />
            ))}
          </div>
        </div>
        <div className="glass-flat p-3">
          <div className="h-2.5 w-24 bg-foreground/10 rounded mb-3" />
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-3 bg-foreground/10 rounded"
                style={{ width: `${90 - i * 15}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
  return <ProductMock />;
}
