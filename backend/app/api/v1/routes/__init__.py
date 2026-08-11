from fastapi import APIRouter
from app.api.v1.routes.auth import router as auth_router
from app.api.v1.routes.groups import router as groups_router
from app.api.v1.routes.checkins import router as checkins_router
from app.api.v1.routes.leaderboard import router as leaderboard_router
from app.api.v1.routes.fines import router as fines_router
from app.api.v1.routes.calendar import router as calendar_router
from app.api.v1.routes.gamification import router as gamification_router
from app.api.v1.routes.books import router as books_router
from app.api.v1.routes.discussions import router as discussions_router
from app.api.v1.routes.whatsapp import router as whatsapp_router
from app.api.v1.routes.notifications import router as notifications_router
from app.api.v1.routes.nudges import router as nudges_router
from app.api.v1.routes.stats import router as stats_router
from app.api.v1.routes.reader import router as reader_router

api_v1_router = APIRouter(prefix="/api/v1")
api_v1_router.include_router(auth_router)
api_v1_router.include_router(groups_router)
api_v1_router.include_router(checkins_router)
api_v1_router.include_router(leaderboard_router)
api_v1_router.include_router(fines_router)
api_v1_router.include_router(calendar_router)
api_v1_router.include_router(gamification_router)
api_v1_router.include_router(books_router)
api_v1_router.include_router(discussions_router)
api_v1_router.include_router(whatsapp_router)
api_v1_router.include_router(notifications_router)
api_v1_router.include_router(nudges_router)
api_v1_router.include_router(stats_router)
api_v1_router.include_router(reader_router)
