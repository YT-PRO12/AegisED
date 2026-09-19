import os,secrets
from contextlib import asynccontextmanager
from fastapi import FastAPI,Header,HTTPException,Depends
from .schemas import Features,Question
from .predictor import predict,bundle
from .knowledge import Knowledge
knowledge=None
@asynccontextmanager
async def lifespan(app):
    global knowledge
    bundle();knowledge=Knowledge()
    yield
app=FastAPI(title='CareFlow synthetic decision support',version='1.0.0',lifespan=lifespan)
def authorize(x_service_token:str=Header(default='')):
    expected=os.getenv('ML_SERVICE_TOKEN','')
    if os.getenv('NODE_ENV')=='production' and not expected:raise HTTPException(503,'Service token missing')
    if expected and not secrets.compare_digest(x_service_token,expected):raise HTTPException(401,'Invalid service token')
@app.get('/health')
def health():return {'status':'ok','modelVersion':bundle()['metrics']['modelVersion']}
@app.post('/predict',dependencies=[Depends(authorize)])
def prediction(features:Features):return predict(features.model_dump())
@app.get('/model',dependencies=[Depends(authorize)])
def model():return bundle()['metrics']
@app.post('/knowledge',dependencies=[Depends(authorize)])
def ask(question:Question):return knowledge.answer(question.question)
