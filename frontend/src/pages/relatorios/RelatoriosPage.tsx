import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { format, startOfMonth } from "date-fns"
import { BarChart2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs"
import api from "@/lib/api"
import { formatarMoeda } from "@/lib/utils"
import type {
  RelatorioAgendamentos,
  RelatorioProfissional,
  RelatorioServico,
  RelatorioCliente,
} from "@/types"

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-foreground">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </CardContent>
    </Card>
  )
}

export default function RelatoriosPage() {
  const hoje = format(new Date(), "yyyy-MM-dd")
  const inicioMes = format(startOfMonth(new Date()), "yyyy-MM-dd")
  const [dataInicio, setDataInicio] = useState(inicioMes)
  const [dataFim, setDataFim] = useState(hoje)
  const [gerado, setGerado] = useState(false)

  const params = { data_inicio: dataInicio, data_fim: dataFim }

  const { data: relAgend, isLoading: loadingAgend } = useQuery({
    queryKey: ["rel-agend", dataInicio, dataFim],
    queryFn: async () => {
      const res = await api.get<RelatorioAgendamentos>("/reports/appointments", { params })
      return res.data
    },
    enabled: gerado,
  })

  const { data: relProfs, isLoading: loadingProfs } = useQuery({
    queryKey: ["rel-profs", dataInicio, dataFim],
    queryFn: async () => {
      const res = await api.get<RelatorioProfissional[]>("/reports/professionals", { params })
      return res.data
    },
    enabled: gerado,
  })

  const { data: relServs, isLoading: loadingServs } = useQuery({
    queryKey: ["rel-servs", dataInicio, dataFim],
    queryFn: async () => {
      const res = await api.get<RelatorioServico[]>("/reports/services", { params })
      return res.data
    },
    enabled: gerado,
  })

  const { data: relClient, isLoading: loadingClient } = useQuery({
    queryKey: ["rel-client", dataInicio, dataFim],
    queryFn: async () => {
      const res = await api.get<RelatorioCliente>("/reports/clients", { params })
      return res.data
    },
    enabled: gerado,
  })

  function handleDateChange(field: "inicio" | "fim", value: string) {
    if (field === "inicio") setDataInicio(value)
    else setDataFim(value)
    setGerado(false)
  }

  const isLoading = loadingAgend || loadingProfs || loadingServs || loadingClient

  return (
    <div className="fade-in-up p-4 sm:p-6 space-y-5">
      <h1 className="text-xl font-bold tracking-tight">Relatórios</h1>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Label className="text-sm text-foreground">De:</Label>
            <DatePicker value={dataInicio} onChange={(v) => handleDateChange("inicio", v)} />
            <Label className="text-sm text-foreground">Até:</Label>
            <DatePicker value={dataFim} onChange={(v) => handleDateChange("fim", v)} />
            <Button onClick={() => setGerado(true)} disabled={gerado && isLoading}>
              {gerado && isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <BarChart2 className="mr-2 h-4 w-4" />
              )}
              Gerar relatório
            </Button>
          </div>
        </CardContent>
      </Card>

      {!gerado ? (
        <p className="text-sm text-muted-foreground text-center py-12">
          Selecione o período e clique em &quot;Gerar relatório&quot;
        </p>
      ) : (
        <Tabs defaultValue="agendamentos">
          <TabsList>
            <TabsTrigger value="agendamentos">Agendamentos</TabsTrigger>
            <TabsTrigger value="profissionais">Profissionais</TabsTrigger>
            <TabsTrigger value="servicos">Serviços</TabsTrigger>
            <TabsTrigger value="clientes">Clientes</TabsTrigger>
          </TabsList>

          <TabsContent value="agendamentos" className="mt-4">
            {loadingAgend ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-20" />)}
              </div>
            ) : relAgend ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <MetricCard label="Total" value={relAgend.total} />
                <MetricCard label="Concluídos" value={relAgend.concluidos} />
                <MetricCard label="Cancelados" value={relAgend.cancelados} />
                <MetricCard label="Não compareceu" value={relAgend.no_show} />
                <MetricCard label="Taxa de conclusão" value={`${relAgend.taxa_conclusao.toFixed(1)}%`} />
                <MetricCard label="Receita total" value={formatarMoeda(relAgend.receita_total)} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Sem dados no período</p>
            )}
          </TabsContent>

          <TabsContent value="profissionais" className="mt-4">
            {loadingProfs ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : relProfs?.length ? (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Profissional</TableHead>
                        <TableHead className="text-right">Agendamentos</TableHead>
                        <TableHead className="text-right hidden md:table-cell">Concluídos</TableHead>
                        <TableHead className="text-right">Receita</TableHead>
                        <TableHead className="text-right hidden lg:table-cell">Comissão</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relProfs.map((p) => (
                        <TableRow key={p.professional_id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="text-right">{p.total_agendamentos}</TableCell>
                          <TableCell className="text-right hidden md:table-cell">
                            {p.agendamentos_concluidos}
                          </TableCell>
                          <TableCell className="text-right">{formatarMoeda(p.receita_gerada)}</TableCell>
                          <TableCell className="text-right hidden lg:table-cell">
                            {formatarMoeda(p.comissao_estimada)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Sem dados no período</p>
            )}
          </TabsContent>

          <TabsContent value="servicos" className="mt-4">
            {loadingServs ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : relServs?.length ? (
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Serviço</TableHead>
                        <TableHead className="text-right">Agendamentos</TableHead>
                        <TableHead className="text-right">Receita</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {relServs.map((s) => (
                        <TableRow key={s.service_id}>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell className="text-right">{s.total_agendamentos}</TableCell>
                          <TableCell className="text-right">{formatarMoeda(s.receita_gerada)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Sem dados no período</p>
            )}
          </TabsContent>

          <TabsContent value="clientes" className="mt-4">
            {loadingClient ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20" />)}
              </div>
            ) : relClient ? (
              <div className="grid grid-cols-2 gap-3">
                <MetricCard label="Total de clientes" value={relClient.total_clientes} />
                <MetricCard label="Novos no período" value={relClient.novos_no_periodo} />
                <MetricCard label="Clientes recorrentes" value={relClient.clientes_recorrentes} />
                <MetricCard label="Ticket médio" value={formatarMoeda(relClient.ticket_medio)} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Sem dados no período</p>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
