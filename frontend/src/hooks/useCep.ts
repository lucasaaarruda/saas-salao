import { useState, useCallback } from "react"

interface CepData {
  logradouro: string
  localidade: string
  uf: string
}

export function useCep() {
  const [loading, setLoading] = useState(false)

  const buscarCep = useCallback(async (cep: string): Promise<CepData | null> => {
    const cleaned = cep.replace(/\D/g, "")
    if (cleaned.length !== 8) return null
    setLoading(true)
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`)
      const data = await res.json()
      if (data.erro) return null
      return data as CepData
    } catch {
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { buscarCep, loading }
}
