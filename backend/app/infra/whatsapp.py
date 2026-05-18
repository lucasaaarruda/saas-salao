"""Cliente HTTP para a Evolution API (WhatsApp)."""

import logging
import re

import httpx

logger = logging.getLogger(__name__)


def _formatar_numero(phone: str) -> str:
    """Normaliza para o formato internacional BR: 5511999999999."""
    numeros = re.sub(r"\D", "", phone)
    if not numeros.startswith("55"):
        numeros = "55" + numeros
    return numeros


async def enviar_mensagem(numero: str, mensagem: str) -> bool:
    """
    Envia uma mensagem de texto via Evolution API.
    Retorna True em caso de sucesso, False caso contrário.
    Nunca levanta exceção — falhas são apenas logadas.
    """
    from app.core.config import settings

    if not settings.EVOLUTION_API_URL or not settings.EVOLUTION_API_KEY or not settings.EVOLUTION_INSTANCE:
        logger.warning("WhatsApp não configurado (EVOLUTION_API_URL/KEY/INSTANCE vazios) — mensagem ignorada")
        return False

    numero_formatado = _formatar_numero(numero)
    url = f"{settings.EVOLUTION_API_URL.rstrip('/')}/message/sendText/{settings.EVOLUTION_INSTANCE}"

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                url,
                json={"number": numero_formatado, "text": mensagem},
                headers={"apikey": settings.EVOLUTION_API_KEY, "Content-Type": "application/json"},
            )
            if response.status_code not in (200, 201):
                logger.warning(
                    "Evolution API retornou %d para %s: %s",
                    response.status_code,
                    numero_formatado,
                    response.text[:300],
                )
                return False
            return True
    except Exception as exc:
        logger.error("Erro ao enviar WhatsApp para %s: %s", numero_formatado, exc)
        return False
