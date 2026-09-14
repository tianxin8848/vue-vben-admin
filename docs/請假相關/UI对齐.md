# 直接对照你实际渲染出来的英文UI标签（用户层）

| UI显示英文标签 | 前端vue变量 | 后端字段 | 样例输出值 |
| --- | --- | --- | --- |
| Annual leave entitlement | stats.annualEntitlement | annual_entitlement_days | 11 |
| Annual leave accrual | stats.annualLeaveAccrual | annual_entitlement_raw | 10.652054794520549 |
| Annual Leave Taken | stats.annualUsed | annual_used_days | 2 |
| Annual Leave Balance | stats.annualAvailable | annual_available_days | 0 |
| Compensation leave granted | stats.lieuGranted | lieu_granted_days | 4 |
| Compensation leave available | stats.lieuAvailable | lieu_available_days | 4 |
| Compensation leave taken | stats.lieuUsed | lieu_used_days | 0 |
| Leave Carry Forward (current year) | stats.carryForward | carry_over_used_days | 0 |
| Leave Brought Forward (current year) | stats.broughtForward | carry_over_available_days | 0 |

✅ **9项全部一一对应，字段来源齐全**
