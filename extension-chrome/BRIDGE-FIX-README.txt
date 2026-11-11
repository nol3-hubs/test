Badoc Hub Extension v1.0.5

Includes the existing Badoc bridge and POD/POOH checker, plus First Mile export support copied from the NOL3 Bridge workflow.

First Mile Orders:
- GET /api/admin/pickup/fm_hub/pickup_order/export
- Created Time: selected Philippine date and previous 14 days
- Status IDs: 2,0,4,13 (Assigned, Created, Picked up, Pickup Retry)
- Bulky types: 1,0,2 (Bulky, N/A, Non-Bulky)

First Mile Tasks:
- GET /api/admin/pickup/fm_hub/pickup_task/export
- Status IDs: 8,2,7 (Arrived, Accepted, Pickup Done)
- No explicit date filter, matching NOL3 Bridge behavior.

The extension accepts BADOC_START_FIRST_MILE_ORDERS_SYNC and BADOC_START_FIRST_MILE_TASKS_SYNC messages and returns CSVs using BADOC_SPX_FIRST_MILE_ORDERS_CSV and BADOC_SPX_FIRST_MILE_TASKS_CSV. The dashboard needs corresponding controls/import handlers to expose these jobs in its UI.
