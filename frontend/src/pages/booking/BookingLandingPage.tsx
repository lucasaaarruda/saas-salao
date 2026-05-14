import { useParams, useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { AlertCircle, Calendar, Clock, MapPin, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useClienteAuthStore } from "@/store/clienteAuthStore"
import { getInfoSalao } from "@/api/booking"

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

export default function BookingLandingPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, slug: authSlug } = useClienteAuthStore()

  const { data: salao, isLoading, isError } = useQuery({
    queryKey: ["booking-salao", slug],
    queryFn: () => getInfoSalao(slug!),
  })

  function handleAgendar() {
    if (isAuthenticated && authSlug === slug) {
      navigate(`/booking/${slug}/agendar`)
    } else {
      navigate(`/booking/${slug}/auth?next=agendar`)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4 fade-in-up">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    )
  }

  if (isError || !salao) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center fade-in-up">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">Salão não encontrado</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Verifique o link e tente novamente.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 fade-in-up">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{salao.name}</h1>
        <p className="text-muted-foreground mt-1.5 flex items-center gap-1.5 text-sm">
          <MapPin className="h-4 w-4 shrink-0" />
          {salao.city}, {salao.state}
        </p>
      </div>

      <Card>
        <CardContent className="pt-5 space-y-3.5">
          <div className="flex items-center gap-2.5 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>{salao.phone}</span>
          </div>
          <div className="flex items-center gap-2.5 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
            <span>
              {salao.opening_time.slice(0, 5)} – {salao.closing_time.slice(0, 5)}
            </span>
          </div>
          <div className="flex items-start gap-2.5 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="flex gap-1 flex-wrap">
              {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                <span
                  key={d}
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    salao.working_days.includes(d)
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground opacity-50"
                  }`}
                >
                  {DIAS[d]}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {!salao.allow_online_booking ? (
        <div className="flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
          <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-sm">Agendamento online desativado</p>
            <p className="text-muted-foreground text-sm mt-0.5">
              Entre em contato pelo telefone{" "}
              <strong className="text-foreground">{salao.phone}</strong> para agendar.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Button className="w-full h-12 text-base" onClick={handleAgendar}>
            Agendar um serviço
          </Button>
          {isAuthenticated && authSlug === slug && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate(`/booking/${slug}/meus-agendamentos`)}
            >
              Ver meus agendamentos
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
