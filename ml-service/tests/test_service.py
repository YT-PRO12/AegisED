import os,json
import numpy as np
import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError
from app.main import app
from app.dataset import generate
from app.schemas import Features
from app.predictor import ROOT,bundle,predict
from app.knowledge import Knowledge
FEATURES={'age':42,'heartRate':110,'systolicBP':105,'respiratoryRate':25,'temperature':37.8,'oxygenSaturation':92}
@pytest.fixture
def client():
    with TestClient(app) as client:yield client

def test_schema_and_boundaries(client):
    assert client.post('/predict',json={**FEATURES,'age':10},headers={'X-Service-Token':os.getenv('ML_SERVICE_TOKEN','')}).status_code==422
    with pytest.raises(ValidationError):Features(**{**FEATURES,'temperature':float('nan')})
    with pytest.raises(ValidationError):Features(**{**FEATURES,'age':42.5})
    with pytest.raises(ValidationError):Features(**{**FEATURES,'unknown':3})
def test_real_prediction_is_reproducible():
    a,b=predict(FEATURES),predict(FEATURES)
    assert a['classScores']==b['classScores']
    assert a['predictedPriority']==max(a['classScores'],key=a['classScores'].get)
    assert abs(sum(a['classScores'].values())-1)<.0001
    assert 'confidence' not in a and 'riskScore' not in a
    assert len(a['factors'])==6

def test_training_imputer_only_saw_training_partition():
    df=generate();split=np.load(ROOT/'reports/splits.npz')
    assert not set(split['train'])&set(split['validation'])
    assert not set(split['test'])&set(split['train'])
    assert not set(split['test'])&set(split['validation'])
    medians=df[bundle()['features']].iloc[split['train']].median().values
    np.testing.assert_allclose(bundle()['pipeline'].steps[0][1].statistics_,medians)

def test_generator_deterministic_and_has_missing_values():
    a,b=generate(100),generate(100)
    assert a.equals(b)
    assert a.isna().sum().sum()>0

def test_service_auth_and_health(client,monkeypatch):
    monkeypatch.setenv('ML_SERVICE_TOKEN','unit-test-secret')
    assert client.get('/health').status_code==200
    assert client.post('/predict',json=FEATURES).status_code==401
    assert client.post('/predict',json=FEATURES,headers={'X-Service-Token':'unit-test-secret'}).status_code==200

def test_retrieval_sources_and_unknown_query():
    k=Knowledge();a=k.answer('How do I assign a bed to a case?')
    assert a['mode']=='retrieval_only'
    assert any(s['id']=='workflow-3' for s in a['sources'])
    assert all(s['path'] and s['title'] and s['section'] and s['license'] for s in a['sources'])
    assert k.answer('zyxwvu qqqzzzzz')['mode']=='insufficient_context'
    assert k.answer('What medication dosage do you prescribe?')['sources']==[]

def test_small_retrieval_benchmark():
    from evaluate_retrieval import CASES
    k=Knowledge();hits=sum(any(s['id']==target for s in k.retrieve(q)) for q,target in CASES)
    assert hits/len(CASES)>=.8

def test_optional_llm_falls_back_when_unavailable(monkeypatch):
    import httpx
    monkeypatch.setenv('OLLAMA_URL','http://localhost:11434');monkeypatch.setenv('OLLAMA_MODEL','unavailable')
    def unavailable(*args,**kwargs):raise httpx.ConnectError('offline')
    monkeypatch.setattr(httpx,'post',unavailable)
    a=Knowledge().answer('How do I assign a bed?')
    assert a['mode']=='retrieval_only' and 'unavailable' in a['limitation']

def test_llm_evidence_validation(monkeypatch):
    import httpx
    monkeypatch.setenv('OLLAMA_URL','http://localhost:11434');monkeypatch.setenv('OLLAMA_MODEL','contract-test')
    class Response:
      def raise_for_status(self):pass
      def json(self):return {'response':json.dumps({'claims':[{'text':'Invented assertion','source_id':'missing','quote':'This quote is not in a document'}]})}
    monkeypatch.setattr(httpx,'post',lambda *a,**kw:Response())
    a=Knowledge().answer('How do I assign a bed?')
    assert a['mode']=='retrieval_only'
