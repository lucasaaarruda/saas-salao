import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface CidadeComboboxProps {
  uf: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function CidadeCombobox({ uf, value, onChange, disabled }: CidadeComboboxProps) {
  const [open, setOpen] = useState(false)
  const [cidades, setCidades] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!uf || uf.length !== 2) {
      setCidades([])
      return
    }
    setLoading(true)
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`)
      .then((r) => r.json())
      .then((data: { nome: string }[]) => setCidades(data.map((c) => c.nome).sort()))
      .catch(() => setCidades([]))
      .finally(() => setLoading(false))
  }, [uf])

  const placeholder = loading
    ? "Carregando cidades..."
    : !uf
    ? "Selecione o estado primeiro"
    : "Selecionar cidade..."

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || !uf || loading}
          className="w-full justify-between font-normal"
        >
          <span className="truncate">{value || placeholder}</span>
          {loading
            ? <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
            : <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          }
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar cidade..." />
          <CommandList>
            <CommandEmpty>Nenhuma cidade encontrada.</CommandEmpty>
            <CommandGroup>
              {cidades.map((cidade) => (
                <CommandItem
                  key={cidade}
                  value={cidade}
                  onSelect={() => {
                    onChange(cidade)
                    setOpen(false)
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4 shrink-0", value === cidade ? "opacity-100" : "opacity-0")} />
                  {cidade}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
