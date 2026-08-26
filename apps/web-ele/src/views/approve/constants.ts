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
  annual: 'page.leave.leaveTypes.annual',
  personal: 'page.leave.leaveTypes.personal',
  sick: 'page.leave.leaveTypes.sick',
  lieu: 'page.leave.leaveTypes.lieu',
  long: 'page.leave.leaveTypes.long',
};

export const sessionLabelMap: Record<string, string> = {
  full_day: 'page.leave.session.full_day',
  morning: 'page.leave.session.morning',
  afternoon: 'page.leave.session.afternoon',
};

export const statusLabelMap: Record<string, string> = {
  pending: 'page.leave.approvalStatus.pending',
  approved: 'page.leave.approvalStatus.approved',
  rejected: 'page.leave.approvalStatus.rejected',
  withdrawn: 'page.leave.approvalStatus.withdrawn',
  draft: 'page.leave.approvalStatus.draft',
};

export const actionLabelMap: Record<string, string> = {
  approved: 'page.leave.approvalStatus.approved',
  rejected: 'page.leave.approvalStatus.rejected',
  submitted: 'page.leave.actionStatus.submitted',
  withdrawn: 'page.leave.approvalStatus.withdrawn',
  created: 'page.leave.actionStatus.created',
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

/** 请假状态选项（用于搜索栏下拉，label 为 i18n 键路径，使用时需 $t() 包裹） */
export const statusOptions: Array<{ label: string; value: string }> = [
  { label: 'page.leave.approvalStatus.pending', value: 'pending' },
  { label: 'page.leave.approvalStatus.approved', value: 'approved' },
  { label: 'page.leave.approvalStatus.rejected', value: 'rejected' },
  { label: 'page.leave.approvalStatus.withdrawn', value: 'withdrawn' },
];

/** 请假类型选项（用于搜索栏下拉，仅在请假 Tab 显示，label 为 i18n 键路径） */
export const leaveTypeOptions: Array<{ label: string; value: string }> = [
  { label: 'page.leave.leaveTypes.annual', value: 'annual' },
  { label: 'page.leave.leaveTypes.personal', value: 'personal' },
  { label: 'page.leave.leaveTypes.sick', value: 'sick' },
  { label: 'page.leave.leaveTypes.lieu', value: 'lieu' },
  { label: 'page.leave.leaveTypes.long', value: 'long' },
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
