# Analytics definitions

## Metrics and date filters
The Analytics page aggregates stored PostgreSQL records in UTC. Date filters use arrival time, from the start date inclusive through the end date inclusive. Emergency volume counts arrivals in the interval. Discharges counts cases in that arrival cohort that are currently discharged. Trend discharge values also follow the arrival cohort; they are not a discharge-date time series.

## Waiting and treatment duration
Average waiting time is arrival to doctor assignment among cases with both timestamps. Patients still waiting are excluded from that average. Treatment duration is treatment start to completion among cases with both timestamps. The API reports sample counts so missing legacy timestamps are visible. Historical timestamps are not invented during migration.

## Beds and utilization
Bed occupancy is the current occupied-bed count divided by the current total bed count. It is a snapshot even when a historical date range is selected. Utilization is the sum of occupied hours overlapping the selected interval divided by current bed count times elapsed hours in that interval. This approximation assumes bed inventory was constant; inventory history is not tracked.

## Demonstration data
Demo records are synthetic and are clearly named Demo Patient. The seed command creates an empty-database demonstration with historical and active cases. It is idempotent and refuses to mix into a nonempty patient database. No real patient information should be entered into this portfolio prototype.
