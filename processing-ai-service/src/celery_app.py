from celery import Celery

from src.config.settings import settings

celery_app = Celery(
    "processing_ai_service",
    broker=settings.broker_url,
    backend=settings.result_backend,
    include=[
        "src.tasks.processing_task",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,

    task_default_queue="processing",
    task_routes={
        "src.tasks.processing_task.process_learning_task": {
            "queue": "processing",
        },
    },
)