from functools import lru_cache
from pathlib import Path
from datetime import datetime,timezone
import joblib
import pandas as pd
ROOT=Path(__file__).resolve().parents[1]
@lru_cache
def bundle():
    # Trusted, locally trained artifact only; never load a user-supplied pickle.
    return joblib.load(ROOT/'model/triage.joblib')
def predict(features):
    b=bundle();p=b['pipeline'];x=pd.DataFrame([features],columns=b['features'])
    probabilities=p.predict_proba(x)[0];idx=probabilities.argmax();label=str(p.classes_[idx])
    factors=[]
    # Median replacement is a sensitivity probe, not a causal/SHAP explanation.
    for feature in b['features']:
        changed=x.copy();changed[feature]=b['medians'][feature]
        delta=float(probabilities[idx]-p.predict_proba(changed)[0][idx])
        factors.append({'feature':feature,'value':features[feature],'scoreDelta':round(delta,4)})
    factors.sort(key=lambda v:abs(v['scoreDelta']),reverse=True)
    return {'predictedPriority':label,'classScores':{str(c):round(float(v),5) for c,v in zip(p.classes_,probabilities)},'modelVersion':b['metrics']['modelVersion'],'modelType':b['metrics']['selectedModel'],'timestamp':datetime.now(timezone.utc).isoformat(),'factors':factors,'explanationMethod':'One-feature median replacement sensitivity; not causal importance','disclaimer':'Synthetic adult demonstration only. Uncalibrated model scores are not clinical confidence. Human review required.'}
