# Emergency workflow

## Intake and registration
Reception, nurses and administrators may register synthetic patients and create emergency cases. A new case starts in Waiting. One patient can have only one active case. Priority is entered by a human. Use the Patients page to register a record, then Emergency Operations to open an intake case.

## Doctor assignment
A nurse or administrator can assign an available doctor to a waiting case. The case becomes Assigned and the doctor becomes Busy. The operational recommendation orders available doctors by recent assignments. Specialty is shown for human review; the recommendation does not infer medical suitability.

## Bed allocation
A doctor must be assigned before a bed is allocated. Only an available, unoccupied bed can be selected. The case can have only one bed. Allocation marks the bed Occupied and links it to the patient. Use the Emergency Operations assignment action; do not edit a resource to bypass this workflow.

## Treatment and discharge
An assigned doctor or administrator can start treatment only after both a doctor and bed are linked. In Treatment can move to Completed, then Discharged. Completing treatment does not release resources. Discharge releases the doctor and bed in the same transaction, clears the bed patient assignment and records the workflow timestamps.
