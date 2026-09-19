"""Reproducible 70/15/15 stratified experiment; preprocessing fits on training only."""
from pathlib import Path
import hashlib,json,platform
import numpy as np
import pandas as pd
import joblib,sklearn
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report,confusion_matrix,roc_auc_score,f1_score,accuracy_score,log_loss
from sklearn.inspection import permutation_importance
from app.dataset import generate,FEATURES,CLASSES
ROOT=Path(__file__).parent

def train():
    for d in ['data','model','reports']:(ROOT/d).mkdir(exist_ok=True)
    df=generate();csv=df.to_csv(index=False);(ROOT/'data/synthetic-triage.csv').write_text(csv)
    X,y=df[FEATURES],df.priority
    train_i,temp_i=train_test_split(np.arange(len(df)),test_size=.30,random_state=42,stratify=y)
    val_i,test_i=train_test_split(temp_i,test_size=.50,random_state=42,stratify=y.iloc[temp_i])
    models={
      'majority_baseline':DummyClassifier(strategy='most_frequent'),
      'logistic_regression':LogisticRegression(max_iter=1500,class_weight='balanced',random_state=42),
      'decision_tree':DecisionTreeClassifier(max_depth=7,min_samples_leaf=15,class_weight='balanced',random_state=42),
      'random_forest':RandomForestClassifier(n_estimators=180,max_depth=10,min_samples_leaf=5,class_weight='balanced',random_state=42,n_jobs=1)
    }
    pipelines={};comparisons={}
    for name,model in models.items():
        pipeline=make_pipeline(SimpleImputer(strategy='median'),StandardScaler(),model)
        pipeline.fit(X.iloc[train_i],y.iloc[train_i]);pred=pipeline.predict(X.iloc[val_i])
        comparisons[name]={'validation_macro_f1':f1_score(y.iloc[val_i],pred,average='macro'),'validation_report':classification_report(y.iloc[val_i],pred,output_dict=True,zero_division=0)}
        pipelines[name]=pipeline
    best=max(comparisons,key=lambda n:comparisons[n]['validation_macro_f1'])
    pipeline=pipelines[best] # No refit on validation: preserves the stated training-only fit.
    pred=pipeline.predict(X.iloc[test_i]);proba=pipeline.predict_proba(X.iloc[test_i])
    importance=permutation_importance(pipeline,X.iloc[val_i],y.iloc[val_i],n_repeats=5,random_state=42,scoring='f1_macro')
    metrics={
      'modelVersion':'synthetic-v1','selectedModel':best,'datasetSha256':hashlib.sha256(csv.encode()).hexdigest(),
      'samples':len(df),'split':{'train':len(train_i),'validation':len(val_i),'test':len(test_i)},'randomSeed':42,
      'selection':'Highest validation macro F1; held-out test used once after selection',
      'classDistribution':y.value_counts().to_dict(),'missingValues':X.isna().sum().to_dict(),
      'comparison':comparisons,
      'test':{'accuracy':accuracy_score(y.iloc[test_i],pred),'macro_f1':f1_score(y.iloc[test_i],pred,average='macro'),'weighted_f1':f1_score(y.iloc[test_i],pred,average='weighted'),'roc_auc_ovr_macro':roc_auc_score(y.iloc[test_i],proba,multi_class='ovr',labels=pipeline.classes_),'log_loss':log_loss(y.iloc[test_i],proba,labels=pipeline.classes_),'classification_report':classification_report(y.iloc[test_i],pred,output_dict=True,zero_division=0),'confusion_matrix':confusion_matrix(y.iloc[test_i],pred,labels=CLASSES).tolist(),'class_order':CLASSES},
      'validationPermutationImportance':[{'feature':n,'mean':float(m),'std':float(s)} for n,m,s in zip(FEATURES,importance.importances_mean,importance.importances_std)],
      'versions':{'python':platform.python_version(),'sklearn':sklearn.__version__,'numpy':np.__version__},
      'limitations':['Labels and features come from the same invented simulator. Test metrics measure simulator recovery, not real patient outcomes.','Adults only; no pediatric validation. No clinical validation or fairness assessment.','Probabilities are uncalibrated model scores. No confidence or clinical risk percentage is claimed.','Missing values are imputed using training medians; live endpoint requires complete vitals.']
    }
    joblib.dump({'pipeline':pipeline,'features':FEATURES,'metrics':metrics,'medians':X.iloc[train_i].median().to_dict()},ROOT/'model/triage.joblib')
    (ROOT/'reports/metrics.json').write_text(json.dumps(metrics,indent=2))
    (ROOT/'reports/eda.json').write_text(json.dumps({'shape':list(df.shape),'duplicateRows':int(df.duplicated().sum()),'summary':X.describe().to_dict(),'correlations':X.corr().to_dict()},indent=2))
    np.savez(ROOT/'reports/splits.npz',train=train_i,validation=val_i,test=test_i)
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    fig,axes=plt.subplots(1,2,figsize=(11,4))
    counts=y.value_counts().reindex(CLASSES);axes[0].bar(counts.index,counts.values,color=['#b94350','#168675','#d89334']);axes[0].set_title('Synthetic class distribution');axes[0].set_ylabel('Scenarios')
    cm=np.array(metrics['test']['confusion_matrix']);axes[1].imshow(cm,cmap='Blues');axes[1].set_xticks(range(3),CLASSES);axes[1].set_yticks(range(3),CLASSES);axes[1].set_xlabel('Predicted');axes[1].set_ylabel('Simulated label');axes[1].set_title('Held-out test confusion matrix')
    for i in range(3):
      for j in range(3):axes[1].text(j,i,str(cm[i,j]),ha='center',va='center',color='white' if cm[i,j]>cm.max()/2 else '#18312e')
    fig.tight_layout();fig.savefig(ROOT/'reports/evaluation.png',dpi=160);plt.close(fig)
    print(json.dumps({'selected':best,'test':metrics['test']},indent=2))
    return metrics
if __name__=='__main__':train()
