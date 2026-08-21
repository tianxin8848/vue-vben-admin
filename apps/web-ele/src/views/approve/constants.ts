import type { LeaveRequestApi } from '#/api';

/** 搜索表单类型 */
export interface SearchForm {
  keyword: string;
  status: string;
  leave_type: string;
  department: string;
  region: string;
}

export const leaveTypeLabelMap: Record<string, string> = {
  annual: '年假',
  personal: '事假',
  sick: '病假',
  lieu: '调休',
  long: '长假',
};

export const sessionLabelMap: Record<string, string> = {
  full_day: '全天',
  morning: '上午',
  afternoon: '下午',
};

export const statusLabelMap: Record<string, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
  withdrawn: '已撤回',
  draft: '草稿',
};

export const actionLabelMap: Record<string, string> = {
  approved: '已通过',
  rejected: '已驳回',
  submitted: '已提交',
  withdrawn: '已撤回',
  created: '已创建',
};

export const statusTypeMap: Record<
  string,
  'danger' | 'info' | 'success' | 'warning'
> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  withdrawn: 'info',
  draft: 'info',
};

export const actionTypeMap: Record<
  string,
  'danger' | 'info' | 'success' | 'warning'
> = {
  approved: 'success',
  rejected: 'danger',
  submitted: 'warning',
  withdrawn: 'info',
  created: 'info',
};

/** 请假状态选项（用于搜索栏下拉） */
export const statusOptions: Array<{ label: string; value: string }> = [
  { label: '待审批', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已驳回', value: 'rejected' },
  { label: '已撤回', value: 'withdrawn' },
];

/** 请假类型选项（用于搜索栏下拉，仅在请假 Tab 显示） */
export const leaveTypeOptions: Array<{ label: string; value: string }> = [
  { label: '年假', value: 'annual' },
  { label: '事假', value: 'personal' },
  { label: '病假', value: 'sick' },
  { label: '调休', value: 'lieu' },
  { label: '长假', value: 'long' },
];

/** 把 ApprovalRecord 还原成 LeaveRequest，用于详情弹窗展示 */
export function leaveRequestFromRecord(
  record: LeaveRequestApi.ApprovalRecord,
): LeaveRequestApi.LeaveRequest {
  return {
    id: record.leave_request_id,
    employee_id: record.employee_id,
    employee_user_id: null as unknown as number,
    employee_name: record.employee_name,
    employee_username: record.employee_username,
    employee_code: record.employee_code,
    employee_department: record.employee_department,
    employee_region: record.employee_region,
    leave_type: record.leave_type,
    session: record.session,
    start_date: record.start_date,
    end_date: record.end_date,
    approval_status: record.approval_status_after,
    handover_to: record.handover_to,
    reason: record.reason,
    review_comment: record.comment,
    reviewer_id: record.operator_id,
    reviewer_name: record.operator_name,
    reviewed_at: record.created_at,
    current_approver_id: null,
    approval_chain: [],
    approval_history: [],
    date_keys: [],
    created_at: record.created_at,
    created_by_id: record.employee_id,
    created_by_name: record.employee_name,
    updated_at: null,
  } as unknown as LeaveRequestApi.LeaveRequest;
}
