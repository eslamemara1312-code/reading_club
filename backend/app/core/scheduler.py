import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler

from app.tasks.daily_close import check_and_run_daily_closes
from app.tasks.weekly_titles import calculate_weekly_titles
from app.tasks.reminder_job import send_evening_reminders
from app.tasks.monthly_summary import generate_monthly_summaries

logger = logging.getLogger("reading_club.scheduler")
scheduler = AsyncIOScheduler()


def start_scheduler():
    """Start APScheduler in FastAPI process."""
    if not scheduler.running:
        # Run daily close check every 15 minutes
        scheduler.add_job(
            check_and_run_daily_closes,
            trigger="interval",
            minutes=15,
            id="daily_close_check",
            replace_existing=True
        )
        # Run weekly titles every Monday at 00:05 AM
        scheduler.add_job(
            calculate_weekly_titles,
            trigger="cron",
            day_of_week="mon",
            hour=0,
            minute=5,
            id="weekly_titles_job",
            replace_existing=True
        )
        # Run evening 22:00 PM reminders daily
        scheduler.add_job(
            send_evening_reminders,
            trigger="cron",
            hour=22,
            minute=0,
            id="evening_reminders_job",
            replace_existing=True
        )
        # Run monthly summary on the 1st of each month at 00:10
        scheduler.add_job(
            generate_monthly_summaries,
            trigger="cron",
            day=1,
            hour=0,
            minute=10,
            id="monthly_summary_job",
            replace_existing=True
        )
        scheduler.start()
        logger.info("APScheduler started successfully")


def stop_scheduler():
    """Stop APScheduler on shutdown."""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler stopped")
