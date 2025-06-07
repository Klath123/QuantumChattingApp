from fastapi import FastAPI
from middleware import corsPolicy
from src.routes.auth import authRouter
from src.routes.user import userRouter
from src.routes.chat import chatRouter

version = "v1"
app = FastAPI(
    title= "login",
    description="A simple login page",
    version=version
)

corsPolicy(app)

app.include_router(authRouter, prefix=f"/api/{version}/auth")
app.include_router(userRouter, prefix="/api/{version}/user")
app.include_router(chatRouter, prefix="/api/{version}")

