import json
from app.knowledge import Knowledge,ROOT
CASES=[('Who is allowed to create new staff accounts?','access-1'),('How do I assign a bed to a case?','workflow-3'),('Does completing treatment release the bed?','workflow-4'),('How are average waiting time and treatment duration measured?','analytics-2'),('Are model probabilities clinical confidence?','decision-support-3'),('What happens if the Python AI service is offline?','deployment-2'),('Why do I need a reason to override priority?','decision-support-2'),('How is bed utilization calculated?','analytics-3'),('What do audit logs contain?','access-3'),('How do I log out and revoke a session?','access-2')]
if __name__=='__main__':
 k=Knowledge();rows=[]
 for question,target in CASES:
  result=k.retrieve(question);ids=[r['id'] for r in result];rows.append({'question':question,'expected':target,'retrieved':ids,'hit_at_3':target in ids,'reciprocal_rank':1/(ids.index(target)+1) if target in ids else 0})
 report={'corpusSha256':k.digest,'queries':len(rows),'hit_at_3':sum(x['hit_at_3'] for x in rows)/len(rows),'mrr_at_3':sum(x['reciprocal_rank'] for x in rows)/len(rows),'method':'Small author-written operational query set; not an independent clinical benchmark','results':rows}
 (ROOT/'reports/retrieval.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
