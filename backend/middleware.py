from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "https://quantumchattingapp-frontend.onrender.com",  # your frontend origin
]

def corsPolicy(app: FastAPI):

    app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
