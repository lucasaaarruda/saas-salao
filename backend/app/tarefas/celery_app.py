from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery = Celery(
    "salao",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tarefas.lembretes"],
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Sao_Paulo",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    beat_schedule={
        # Verifica lembretes a cada 15 minutos
        "verificar-lembretes": {
            "task": "app.tarefas.lembretes.verificar_lembretes_pendentes",
            "schedule": crontab(minute="*/15"),
        },
        # Marca no-show a cada hora (agendamentos passados ainda como scheduled/confirmed)
        "marcar-no-show": {
            "task": "app.tarefas.lembretes.marcar_no_shows",
            "schedule": crontab(minute=0),
        },
    },
)
