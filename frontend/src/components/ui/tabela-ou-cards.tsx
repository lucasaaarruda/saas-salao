import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export interface Coluna<T> {
  chave: string
  cabecalho: string
  render: (linha: T) => ReactNode
  className?: string
  cabecalhoClassName?: string
  ocultoMobile?: boolean
}

interface TabelaOuCardsProps<T> {
  dados: T[]
  colunas: Coluna<T>[]
  keyExtractor: (linha: T) => string
  acoes?: (linha: T) => ReactNode
  cardPrincipal: (linha: T) => ReactNode
  cardSecundario?: (linha: T) => ReactNode
  cardLateral?: (linha: T) => ReactNode
  onClickLinha?: (linha: T) => void
  className?: string
}

export function TabelaOuCards<T>({
  dados,
  colunas,
  keyExtractor,
  acoes,
  cardPrincipal,
  cardSecundario,
  cardLateral,
  onClickLinha,
  className,
}: TabelaOuCardsProps<T>) {
  return (
    <div className={className}>
      {/* Desktop — tabela */}
      <div className="hidden md:block rounded-lg border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {colunas.map((col) => (
                <th
                  key={col.chave}
                  className={cn(
                    "px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide",
                    col.cabecalhoClassName
                  )}
                >
                  {col.cabecalho}
                </th>
              ))}
              {acoes && <th className="w-16 px-4 py-2.5" />}
            </tr>
          </thead>
          <tbody>
            {dados.map((linha) => (
              <tr
                key={keyExtractor(linha)}
                onClick={() => onClickLinha?.(linha)}
                className={cn(
                  "group h-11 border-b border-border last:border-0 transition-colors duration-100",
                  "hover:bg-muted/30",
                  onClickLinha && "cursor-pointer"
                )}
              >
                {colunas.map((col, i) => (
                  <td
                    key={col.chave}
                    className={cn(
                      "px-4 py-0 text-sm",
                      i === 0
                        ? "font-medium text-foreground"
                        : "text-muted-foreground",
                      col.className
                    )}
                  >
                    {col.render(linha)}
                  </td>
                ))}
                {acoes && (
                  <td className="px-4 py-0">
                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                      {acoes(linha)}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile — cards */}
      <div className="flex flex-col gap-2 md:hidden">
        {dados.map((linha) => (
          <div
            key={keyExtractor(linha)}
            onClick={() => onClickLinha?.(linha)}
            className={cn(
              "flex items-center gap-3 rounded-lg border border-border bg-card px-4 min-h-16",
              onClickLinha && "cursor-pointer tap-scale active:bg-muted/30"
            )}
          >
            <div className="flex-1 min-w-0 py-3">
              <div className="text-sm font-medium text-foreground truncate">
                {cardPrincipal(linha)}
              </div>
              {cardSecundario && (
                <div className="mt-0.5 text-xs text-muted-foreground truncate">
                  {cardSecundario(linha)}
                </div>
              )}
            </div>
            {cardLateral && (
              <div className="shrink-0">
                {cardLateral(linha)}
              </div>
            )}
            {acoes && (
              <div className="shrink-0">
                {acoes(linha)}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
