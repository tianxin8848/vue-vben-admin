import { requestClient } from '#/api/request';

export namespace LeaveRequestApi {
  export type LeaveType = 'annual' | 'lieu' | 'long' | 'personal' | 'sick';
  export type LeaveSession = 'afternoon' | 'full_day' | 'morning';
  export type ApprovalStatus =
    | 'approved'
    | 'pending'
    | 'rejected'
    | 'withdrawn';

  /** 请假申请响应 */
  export interface LeaveRequest {
    approval_chain: Record<string, unknown>[];
    approval_history: Record<string, unknown>[];
    approval_status: ApprovalStatus;
    created_at: null | string;
    created_by_id: string;
    created_by_name: string;
    current_approver_id: null | string;
    date_keys: string[];
    employee_code: null | string;
    employee_department: null | string;
    employee_id: string;
    employee_name: string;
    employee_region: null | string;
    employee_user_id: null | number;
    employee_username: string;
    end_date: string;
    handover_to: null | string;
    id: string;
    leave_type: LeaveType;
    reason: null | string;
    review_comment: null | string;
    reviewed_at: null | string;
    reviewer_id: null | string;
    reviewer_name: null | string;
    session: LeaveSession;
    start_date: string;
    updated_at: null | string;
  }

  /** 创建请假申请请求参数 */
  export interface CreateLeaveRequestParams {
    employee_id?: null | string;
    end_date: string;
    handover_to?: null | string;
    leave_type: LeaveType;
    reason?: null | string;
    session?: LeaveSession;
    start_date: string;
  }

  /** 审批请求参数 */
  export interface ApprovalUpdateParams {
    approval_status: ApprovalStatus;
    review_comment?: null | string;
  }

  /** 撤回请求参数 */
  export interface WithdrawParams {
    withdraw_comment?: null | string;
  }

  /** 列表查询参数 */
  export interface ListParams {
    approval_status?: ApprovalStatus | null;
    employee_keyword?: null | string;
    region?: null | string;
    team?: null | string;
    year?: number | null;
  }

  /** 年假汇总响应 */
  export interface AnnualLeaveSummary {
    available_days: number;
    entitlement_days: number;
    region: null | string;
    used_days: number;
    year: number;
  }

  /** 请假日历响应 */
  export interface LeaveCalendar {
    items: LeaveRequest[];
    total: number;
    year: number;
  }

  /** 审批记录响应 */
  export interface ApprovalRecord {
    action: 'approved' | 'rejected' | 'submitted' | 'withdrawn';
    approval_status_after: ApprovalStatus;
    approval_status_before: ApprovalStatus | null;
    comment: null | string;
    created_at: null | string;
    current_approver_id_after: null | string;
    current_approver_id_before: null | string;
    current_approver_level_after: null | number;
    current_approver_name_after: null | string;
    employee_code: null | string;
    employee_department: null | string;
    employee_id: string;
    employee_name: string;
    employee_region: null | string;
    employee_user_id: null | number;
    employee_username: string;
    end_date: string;
    handover_to: null | string;
    id: string;
    is_flowing: boolean;
    leave_request_id: string;
    leave_type: LeaveType;
    operator_id: string;
    operator_name: null | string;
    operator_role: null | string;
    operator_username: string;
    reason: null | string;
    session: LeaveSession;
    start_date: string;
  }
}

// ─── 请假申请 ────────────────────────────────────────────────────────────────

/** 获取请假列表（管理员） */
export async function getLeaveRequestsApi(
  params?: LeaveRequestApi.ListParams,
) {
  return requestClient.get<LeaveRequestApi.LeaveRequest[]>(
    '/leave-requests',
    { params },
  );
}

/** 获取我的请假列表 */
export async function getMyLeaveRequestsApi() {
  return requestClient.get<LeaveRequestApi.LeaveRequest[]>(
    '/leave-requests/my',
  );
}

/** 获取我的待审批列表 */
export async function getMyPendingApprovalsApi() {
  return requestClient.get<LeaveRequestApi.LeaveRequest[]>(
    '/leave-requests/approvals/my',
  );
}

/** 获取我的审批记录 */
export async function getMyApprovalRecordsApi() {
  return requestClient.get<LeaveRequestApi.ApprovalRecord[]>(
    '/leave-requests/approvals/records/my',
  );
}

/** 获取年假汇总（year 必填） */
export async function getAnnualLeaveSummaryApi(year: number) {
  return requestClient.get<LeaveRequestApi.AnnualLeaveSummary>(
    '/leave-requests/annual-leave/summary',
    { params: { year } },
  );
}

/** 获取请假日历（year 必填） */
export async function getLeaveCalendarApi(
  year: number,
  params?: Omit<LeaveRequestApi.ListParams, 'year'>,
) {
  return requestClient.get<LeaveRequestApi.LeaveCalendar>(
    '/leave-requests/calendar',
    { params: { year, ...params } },
  );
}

/** 创建请假申请 */
export async function createLeaveRequestApi(
  data: LeaveRequestApi.CreateLeaveRequestParams,
) {
  return requestClient.post<LeaveRequestApi.LeaveRequest>(
    '/leave-requests',
    data,
  );
}

/** 获取单个请假申请详情 */
export async function getLeaveRequestApi(id: string) {
  return requestClient.get<LeaveRequestApi.LeaveRequest>(
    `/leave-requests/${id}`,
  );
}

/** 审批请假申请 */
export async function reviewLeaveRequestApi(
  id: string,
  data: LeaveRequestApi.ApprovalUpdateParams,
) {
  return requestClient.request<LeaveRequestApi.LeaveRequest>(
    `/leave-requests/${id}/approval`,
    { method: 'PATCH', data },
  );
}

/** 撤回请假申请 */
export async function withdrawLeaveRequestApi(
  id: string,
  data: LeaveRequestApi.WithdrawParams = {},
) {
  return requestClient.request<LeaveRequestApi.LeaveRequest>(
    `/leave-requests/${id}/withdraw`,
    { method: 'PATCH', data },
  );
}

