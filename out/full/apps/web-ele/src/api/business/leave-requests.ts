import { requestClient } from '#/api/request';

export namespace LeaveRequestApi {
  export type LeaveType = 'annual' | 'lieu' | 'long' | 'personal' | 'sick';
  export type LeaveSession = 'afternoon' | 'full_day' | 'morning';
  export type ApprovalStatus =
    | 'approved'
    | 'pending'
    | 'rejected'
    | 'withdrawn';

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

  export interface CreateLeaveRequestParams {
    employee_id?: null | string;
    end_date: string;
    handover_to?: null | string;
    leave_type: LeaveType;
    reason?: null | string;
    session?: LeaveSession;
    start_date: string;
  }

  export interface ReviewParams {
    approval_status: ApprovalStatus;
    review_comment?: null | string;
  }

  export interface ListParams {
    employee_id?: string;
    end_date?: string;
    page?: number;
    pageSize?: number;
    start_date?: string;
    status?: string;
  }

  export interface AnnualLeaveSummary {
    available_days: number;
    entitlement_days: number;
    region: null | string;
    used_days: number;
    year: number;
  }

  export interface LeaveCalendar {
    items: LeaveRequest[];
    total: number;
    year: number;
  }

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

export async function getLeaveRequestsApi(params?: LeaveRequestApi.ListParams) {
  return requestClient.get<LeaveRequestApi.LeaveRequest[]>('/leave-requests', {
    params,
  });
}

export async function getMyLeaveRequestsApi() {
  return requestClient.get<LeaveRequestApi.LeaveRequest[]>(
    '/leave-requests/my',
  );
}

export async function getMyPendingApprovalsApi() {
  return requestClient.get<LeaveRequestApi.LeaveRequest[]>(
    '/leave-requests/approvals/my',
  );
}

export async function getMyApprovalRecordsApi() {
  return requestClient.get<LeaveRequestApi.ApprovalRecord[]>(
    '/leave-requests/approvals/records/my',
  );
}

export async function getAnnualLeaveSummaryApi() {
  return requestClient.get<LeaveRequestApi.AnnualLeaveSummary>(
    '/leave-requests/annual-leave/summary',
  );
}

export async function getLeaveCalendarApi() {
  return requestClient.get<LeaveRequestApi.LeaveCalendar>(
    '/leave-requests/calendar',
  );
}

export async function createLeaveRequestApi(
  data: LeaveRequestApi.CreateLeaveRequestParams,
) {
  return requestClient.post<LeaveRequestApi.LeaveRequest>(
    '/leave-requests',
    data,
  );
}

export async function getLeaveRequestApi(id: string) {
  return requestClient.get<LeaveRequestApi.LeaveRequest>(
    `/leave-requests/${id}`,
  );
}

export async function deleteLeaveRequestApi(id: string) {
  return requestClient.delete(`/leave-requests/${id}`);
}

export async function reviewLeaveRequestApi(
  id: string,
  data: LeaveRequestApi.ReviewParams,
) {
  return requestClient.post(`/leave-requests/${id}/review`, data);
}
