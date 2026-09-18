import type { LeaveRequestApi, SystemSettingsApi } from '#/api';

import { ref } from 'vue';

import { getSystemSettingsApi } from '#/api';

/** 搜索表单类型 */
export interface SearchForm {
  keyword: string;
  status: string;
  leave_type: string;
  department: string;
  region: string;
}

/**
 * 「老闆」岗位名，对齐后端 `CLAIM_BOSS_POSITION`（注意是繁体「老闆」）。
 * 岗位为老闆的用户可只读查看全部已通过报销（GET /me/claims/approved），
 * 但审批/驳回仍仅限当前审批人。
 */
export const CLAIM_BOSS_POSITION = '老闆';

/** 判断当前用户是否为老闆（决定审批页是否显示只读 Tab） */
export function isClaimBossPosition(position?: null | string): boolean {
  return String(position || '').trim() === CLAIM_BOSS_POSITION;
}

/**
 * 接口返回的请假类型映射（code → 直接显示文本，非 i18n key）。
 * 由 loadLeaveTypeLabels() 从 /api/v1/system-settings 的 leave_types 加载。
 */
export const leaveTypeLabelOverride = ref<Record<string, string>>({});

/**
 * 接口返回的请假类型下拉选项（{label, value}，label 为直接显示文本）。
 * 由 loadLeaveTypeLabels() 加载，供搜索栏下拉使用。
 */
export const leaveTypeOptionList = ref<Array<{ label: string; value: string }>>(
  [],
);

/** 从 system-settings 加载 leave_types，填充 override 与下拉选项 */
export async function loadLeaveTypeLabels() {
  try {
    const settings = await getSystemSettingsApi();
    const items: SystemSettingsApi.LeaveTypeItem[] = settings.leave_types || [];
    const map: Record<string, string> = {};
    const options: Array<{ label: string; value: string }> = [];
    items.forEach((item) => {
      if (!item.code) return;
      map[item.code] = item.label;
      options.push({ label: item.label, value: item.code });
    });
    leaveTypeLabelOverride.value = map;
    leaveTypeOptionList.value = options;
  } catch {
    // 加载失败时保持回退映射，不影响审批页基本可用
  }
}

/**
 * 解析请假类型 code → 显示文本（直接来自接口 leave_types.label）。
 * 未加载或未命中时回退到 code 本身。
 */
export function resolveLeaveTypeLabel(code: string): string {
  return leaveTypeLabelOverride.value[code] || code;
}

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
