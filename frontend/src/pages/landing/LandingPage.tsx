import { Link } from "react-router-dom"
import { useThemeStore } from "@/store/themeStore"
import {
  Calendar,
  Users,
  BarChart3,
  CreditCard,
  CheckCircle2,
  ArrowRight,
  Scissors,
  Smartphone,
  Zap,
  Sparkles,
  Shield,
  Star,
  Clock,
  TrendingUp,
} from "lucide-react"

const features = [
  {
    icon: Calendar,
    title: "Agendamento Online",
    description: "Seus clientes agendam pelo celular 24h por dia, sem precisar ligar.",
  },
  {
    icon: Users,
    title: "Gestão de Clientes",
    description: "Histórico completo de atendimentos, preferências e dados de cada cliente.",
  },
  {
    icon: CreditCard,
    title: "Controle Financeiro",
    description: "Acompanhe receitas, despesas e fluxo de caixa em tempo real.",
  },
  {
    icon: BarChart3,
    title: "Relatórios Avançados",
    description: "Insights detalhados sobre desempenho, serviços mais populares e muito mais.",
  },
  {
    icon: Scissors,
    title: "Multi-Profissional",
    description: "Gerencie toda a equipe com controle de agenda e comissões individuais.",
  },
  {
    icon: Smartphone,
    title: "100% Mobile",
    description: "Interface otimizada para smartphone, perfeita para usar no salão.",
  },
]

const steps = [
  {
    number: "01",
    title: "Cadastre seu salão",
    description: "Crie sua conta em menos de 2 minutos e configure seu perfil.",
  },
  {
    number: "02",
    title: "Configure sua equipe",
    description: "Adicione profissionais, serviços, horários e valores.",
  },
  {
    number: "03",
    title: "Compartilhe o link",
    description: "Envie o link personalizado para seus clientes agendarem.",
  },
  {
    number: "04",
    title: "Gerencie tudo",
    description: "Acompanhe agenda, financeiro e relatórios em um só lugar.",
  },
]

const highlights = [
  { value: "24/7", label: "Agendamentos online" },
  { value: "1 link", label: "Para seus clientes agendar" },
  { value: "R$ 0", label: "Taxa por agendamento" },
  { value: "100%", label: "Funciona no celular" },
]

const agendaMock = [
  { time: "09:00", service: "Corte + Escova", client: "Ana Paula", color: "bg-primary/20 border-primary/40" },
  { time: "10:30", service: "Coloração", client: "Marcos Silva", color: "bg-[#22c55e]/15 border-[#22c55e]/35" },
  { time: "14:00", service: "Manicure", client: "Carla Mendes", color: "bg-[#f59e0b]/15 border-[#f59e0b]/35" },
]

const statsCardsMock = [
  { label: "Agendamentos", val: "47", color: "text-primary", icon: Calendar },
  { label: "Clientes", val: "183", color: "text-[#22c55e]", icon: Users },
  { label: "Receita", val: "R$4.2k", color: "text-[#f59e0b]", icon: TrendingUp },
  { label: "Ocupação", val: "87%", color: "text-primary", icon: Clock },
]

const testimonials = [
  {
    name: "Juliana Ferreira",
    role: "Proprietária — Studio Ju Hair",
    text: "Reduzi 70% das ligações para marcação. Meus clientes amam agendar pelo celular!",
    stars: 5,
  },
  {
    name: "Ricardo Alves",
    role: "Dono — Barbearia Alves",
    text: "Finalmente tenho controle de tudo: agenda, caixa e relatórios num só lugar.",
    stars: 5,
  },
  {
    name: "Patrícia Souza",
    role: "Gerente — Espaço Beleza Total",
    text: "A equipe toda usa no celular. Simples, rápido e muito profissional.",
    stars: 5,
  },
]

export default function LandingPage() {
  const { theme } = useThemeStore()
  const logoSrc = theme === "dark" ? "/logo-tema-claro.png" : "/logo-tema-escuro.png"

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src="/icon.png" alt="Bellezi" className="h-9 w-9 rounded-xl object-cover" />
              <span className="text-lg font-bold tracking-tight text-foreground">Bellezi</span>
            </div>

            <nav className="hidden items-center gap-6 sm:flex">
              <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Recursos
              </a>
              <a href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Como funciona
              </a>
              <a href="#depoimentos" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Depoimentos
              </a>
            </nav>

            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="hidden items-center px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
              >
                Entrar
              </Link>
              <Link
                to="/register"
                className="tap-scale inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Começar grátis
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-28 pt-10 sm:px-6 sm:pt-16">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 flex items-start justify-center overflow-hidden">
          <div className="h-[600px] w-[1000px] -translate-y-1/4 rounded-full bg-primary/8 blur-3xl" />
        </div>
        <div className="pointer-events-none absolute left-1/4 top-0 h-[300px] w-[300px] rounded-full bg-primary/5 blur-3xl" />
        <div className="pointer-events-none absolute right-1/4 top-10 h-[250px] w-[250px] rounded-full bg-primary/5 blur-3xl" />

        <div className="relative mx-auto max-w-4xl text-center">
          {/* Logo grande no hero */}
          <div className="fade-in-up mb-3 flex justify-center">
            <img src={logoSrc} alt="Bellezi" className="h-56 w-auto rounded-2xl" />
          </div>

          <div className="fade-in-up mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
            <Zap className="h-3 w-3" />
            Sistema completo para salões de beleza
          </div>

          <h1 className="fade-in-up-delay-1 mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Gerencie seu salão{" "}
            <span className="text-primary">com inteligência</span>
          </h1>

          <p className="fade-in-up-delay-2 mx-auto mb-10 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Agendamento online, gestão de clientes, controle financeiro e relatórios em uma
            plataforma simples. Seus clientes agendam pelo celular, você gerencia tudo.
          </p>

          <div className="fade-in-up-delay-3 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/register"
              className="tap-scale inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
            >
              Criar conta gratuitamente
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="tap-scale inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-7 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-accent sm:w-auto"
            >
              Já tenho conta
            </Link>
          </div>

          <p className="fade-in-up-delay-4 mt-4 text-xs text-muted-foreground">
            Cadastro gratuito · Sem cartão de crédito · Sem taxas por agendamento
          </p>
        </div>

        {/* Dashboard mockup */}
        <div className="fade-in-up-delay-4 relative mx-auto mt-20 max-w-5xl">
          <div className="rounded-2xl border border-border bg-card p-1 shadow-modal">
            <div className="overflow-hidden rounded-xl border border-border/50 bg-background">
              {/* Browser bar */}
              <div className="flex h-9 items-center gap-2 border-b border-border bg-card/50 px-4">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#22c55e]/60" />
                </div>
                <div className="mx-4 h-4 max-w-[180px] flex-1 rounded-md bg-muted/60" />
              </div>

              <div className="grid min-h-[300px] grid-cols-4 sm:min-h-[380px]">
                {/* Sidebar mock */}
                <div className="col-span-1 hidden space-y-1 border-r border-border bg-card/50 p-3 sm:block">
                  <div className="mb-3 flex items-center gap-2 px-1">
                    <img src="/icon.png" alt="" className="h-5 w-5 rounded" />
                    <div className="h-2.5 w-12 rounded bg-foreground/20" />
                  </div>
                  {["Dashboard", "Agenda", "Clientes", "Financeiro"].map((item, i) => (
                    <div
                      key={item}
                      className={`flex h-7 items-center gap-2 rounded-md px-2 ${i === 0 ? "bg-primary/20" : ""}`}
                    >
                      <div className={`h-3 w-3 rounded ${i === 0 ? "bg-primary/70" : "bg-muted-foreground/30"}`} />
                      <div className={`h-2 rounded ${i === 0 ? "w-14 bg-primary/50" : "w-12 bg-muted-foreground/20"}`} />
                    </div>
                  ))}
                </div>

                {/* Main content mock */}
                <div className="col-span-4 space-y-4 p-4 sm:col-span-3">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {statsCardsMock.map((s) => (
                      <div key={s.label} className="rounded-lg border border-border bg-card p-3">
                        <div className="mb-1.5 text-[10px] text-muted-foreground">{s.label}</div>
                        <div className={`text-lg font-bold ${s.color}`}>{s.val}</div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="mb-2.5 flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">Hoje — Agenda</span>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        3 agendamentos
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {agendaMock.map((a) => (
                        <div key={a.time} className={`flex items-center gap-2 rounded border ${a.color} px-2 py-1.5`}>
                          <span className="w-8 shrink-0 text-[10px] text-muted-foreground">{a.time}</span>
                          <span className="truncate text-xs font-medium">{a.service}</span>
                          <span className="ml-auto hidden truncate text-[10px] text-muted-foreground sm:block">{a.client}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium shadow-card-md whitespace-nowrap">
            <div className="h-2 w-2 animate-pulse rounded-full bg-[#22c55e]" />
            Agendamentos em tempo real
          </div>
        </div>
      </section>

      {/* Highlights */}
      <section className="border-y border-border bg-card/30 py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-8 text-center sm:grid-cols-4">
            {highlights.map((h) => (
              <div key={h.label}>
                <div className="text-3xl font-bold text-primary sm:text-4xl">{h.value}</div>
                <div className="mt-1.5 text-sm text-muted-foreground">{h.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" />
              Recursos
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              Tudo que você precisa em um lugar
            </h2>
            <p className="mt-3 text-muted-foreground">
              Ferramentas pensadas para o dia a dia do salão de beleza
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-card-md"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-card/20 px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-14 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Zap className="h-3 w-3" />
              Simples assim
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">Como funciona</h2>
            <p className="mt-3 text-muted-foreground">
              Em menos de 10 minutos seu salão já pode receber agendamentos online
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <div key={step.number} className="relative flex flex-col items-center text-center">
                {i < steps.length - 1 && (
                  <div className="absolute left-[calc(50%+36px)] top-5 hidden h-px w-[calc(100%-72px)] bg-border lg:block" />
                )}
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm font-bold text-primary">
                  {step.number}
                </div>
                <h3 className="mb-2 text-sm font-semibold text-foreground">{step.title}</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="depoimentos" className="px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Star className="h-3 w-3" />
              Depoimentos
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              O que dizem nossos clientes
            </h2>
            <p className="mt-3 text-muted-foreground">
              Salões que já transformaram sua gestão com a Bellezi
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-xl border border-border bg-card p-6">
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="mb-5 text-sm leading-relaxed text-muted-foreground">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                    {t.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plano */}
      <section className="bg-card/20 px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-2xl">
          <div className="mb-12 text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3 w-3" />
              Plano único
            </div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">Comece agora</h2>
            <p className="mt-3 text-muted-foreground">
              Crie sua conta gratuitamente e comece a receber agendamentos online.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-primary/25 bg-card shadow-modal">
            <div className="bg-primary/8 px-8 py-7 text-center">
              <h3 className="text-xl font-bold">Acesso completo</h3>
              <p className="mt-1 text-sm text-muted-foreground">Tudo incluso, sem surpresas</p>
            </div>

            <div className="px-8 py-7">
              <ul className="space-y-3">
                {[
                  "Agendamento online para seus clientes",
                  "Notificações automáticas via WhatsApp",
                  "Gestão completa de clientes e agenda",
                  "Controle financeiro e relatórios",
                  "Multi-profissionais e comissões",
                  "Sem cartão de crédito para começar",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className="tap-scale mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Criar conta gratuitamente
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Sem cartão de crédito · Sem taxas por agendamento
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-y border-border px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-3">
            {[
              {
                icon: Shield,
                title: "Dados seguros",
                desc: "Criptografia e backups automáticos diários.",
              },
              {
                icon: Zap,
                title: "Suporte ágil",
                desc: "Atendimento via chat em menos de 2h em dias úteis.",
              },
              {
                icon: Sparkles,
                title: "Atualizações grátis",
                desc: "Novos recursos sem custo adicional.",
              },
            ].map((b) => (
              <div key={b.title} className="flex flex-col items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <b.icon className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold text-foreground">{b.title}</div>
                <div className="text-xs text-muted-foreground">{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-4 py-24 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 px-8 py-14">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-[300px] w-[500px] rounded-full bg-primary/8 blur-3xl" />
            </div>
            <div className="relative">
              <div className="mb-3 flex justify-center">
                <img src={logoSrc} alt="Bellezi" className="h-44 w-auto rounded-2xl" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Pronto para modernizar seu salão?
              </h2>
              <p className="mt-3 text-muted-foreground">
                Experimente gratuitamente e leve o seu salão para o próximo nível.
              </p>
              <Link
                to="/register"
                className="tap-scale mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Começar agora — é grátis
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div className="flex flex-col items-center gap-2 sm:items-start">
              <div className="flex items-center gap-2">
                <img src="/icon.png" alt="Bellezi" className="h-8 w-8 rounded-lg object-cover" />
                <span className="text-base font-bold tracking-tight text-foreground">Bellezi</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Sistema de agendamento para salões de beleza
              </p>
            </div>

            <div className="flex gap-6">
              <a href="#features" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                Recursos
              </a>
              <a href="#how-it-works" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                Como funciona
              </a>
              <a href="#depoimentos" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                Depoimentos
              </a>
            </div>

            <div className="flex gap-4">
              <Link to="/login" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
                Entrar
              </Link>
              <Link
                to="/register"
                className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
              >
                Criar conta
              </Link>
            </div>
          </div>

          <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} Bellezi · Todos os direitos reservados
          </div>
        </div>
      </footer>
    </div>
  )
}
