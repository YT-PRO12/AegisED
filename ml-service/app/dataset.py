"""Entirely synthetic scenarios. These distributions are NOT clinical guidelines."""
import numpy as np
import pandas as pd
FEATURES=['age','heartRate','systolicBP','respiratoryRate','temperature','oxygenSaturation']
CLASSES=['Critical','Stable','Urgent']
def generate(n=6000,seed=42):
    rng=np.random.default_rng(seed)
    label=rng.choice(['Stable','Urgent','Critical'],n,p=[.52,.33,.15])
    severity=np.array([{'Stable':0,'Urgent':1,'Critical':2}[x] for x in label])
    # Arbitrary, overlapping simulation distributions teach evaluation, not triage.
    data=pd.DataFrame({
      'age':rng.integers(18,90,n),
      'heartRate':rng.normal(78+severity*19,16,n),
      'systolicBP':rng.normal(123-severity*10,19,n),
      'respiratoryRate':rng.normal(17+severity*4.5,4,n),
      'temperature':rng.normal(36.9+severity*.35,.65,n),
      'oxygenSaturation':rng.normal(98-severity*3.5,2.5,n)
    })
    bounds=[(18,89),(25,250),(50,250),(5,60),(30,43),(50,100)]
    for name,(lo,hi) in zip(FEATURES,bounds):
        data[name]=data[name].clip(lo,hi).round(1)
    for name in FEATURES[1:]:
        data.loc[rng.random(n)<.035,name]=np.nan
    data['priority']=label
    return data
