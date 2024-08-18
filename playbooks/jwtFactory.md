# JWT Pizza Playbook

## Objectives
This playbook provides a structured approach for managing and recovering all things to do with jwt pizza service. This includes database crashes, routing errors, and connectivity / latency issues with JWT Factory. The RTO is set to 1 hour an dthe RPO is set to 15 minutes

## Roles and Responsiblities
* Incident Manager: Oversees that all steps of the recovery process are followed
    * Contact Jacob Trader 385 363 1305

* Backend Service Admin: Executes technical recovery of systems and triages problem
    * Contact Jacob Trader 385 363 1305

* Communications Lead: Handles communication with stakeholders and customers
    * Contact Jacob Trader 385 363 1305

## Communication Plan
* Internal: Use slack channel #backend-outage for team updates
* External: Notify customers over email
* Contact Info: Slack table named `backend-engineers contact info`

## Incident detection and notification
* Metrics
    * Auth failures / min
    * Creation failures /min
    * Latency
    * Errors in logs
* Alerting thresholds
    * Auth failures / min: > 5
    * Creation failures / min: > 5
    * Latency: > 100 ms
    * Errors in logs: > 10
* Esclation plans
    * Follow OnCall plan

## Diagnostic process
1. Identify Issue:
    * Check Grafana logs and dashboard
2. Tools and resources
    * Local development testing and debugging
    * Load testing
    * Factory software engineers
3. Initial Diagnosis:
    * Confirm Factory can be reached
    * Confirm DB is online

## Recovery Procedures
1. Automation and Self Healing
    * Run self healing scripts for common issues
2. Deploy new service update
    * Run github action to deploy new service update

## Post-recovery
1. System validation
    * Preform end-to-end validation testing
    * Monotor system for 1 hour to verify stablity
    * Preform load testing a few hours afterwards
2. Document Incident
    * Log incident details, recovery steps, and impact in designated files
    * Collect logs and data for further analysis
3. Prevention Tasks
    * Update playbook with lessons learned and improvements