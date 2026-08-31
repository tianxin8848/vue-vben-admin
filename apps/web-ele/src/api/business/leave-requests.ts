import { requestClient } from '#/api/request';

export namespace LeaveRequestApi {
  // 后端 leave_type 已从枚举放宽为 str（max_length=50），
  // 接口返回的任意 code（如 maternity/paternity/parental/compensatory/statutory_holiday）都允许
  export type LeaveType = string;
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
    medical_certificate_id: null | string;
    medical_certificate_name: null | string;
    medical_certificate_url: null | string;
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
    year?: null | number;
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

  /** 请假日历/审批页筛选下拉数据 */
  export interface LeaveRequestMeta {
    departments: string[];
    employees?: {
      department: null | string;
      employee_code: null | string;
      full_name: null | string;
      id: string;
      is_active: boolean;
      position: null | string;
      region: null | string;
      username: string;
    }[];
    positions?: string[];
    regional_holidays?: {
      date: string;
      holiday_name: string;
      region: string;
    }[];
    regions: string[];
  }

  /** 请假类型目录项（/me/leave-requests/leave-types） */
  export interface LeaveTypeOption {
    code: string;
    label: string;
  }

  /** 调休汇总（granted/used/available，capped 表示是否触顶） */
  export interface LieuLeaveSummary {
    available_days: number;
    capped: boolean;
    employee_id: string;
    granted_days: number;
    used_days: number;
    year: number;
  }

  /** 增加调休额度请求体 */
  export interface AddLieuLeaveGrantParams {
    days: number;
    employee_id: string;
    year: number;
  }
}

// ─── 请假申请 ────────────────────────────────────────────────────────────────

/** 获取请假列表（管理员） */
export async function getLeaveRequestsApi(params?: LeaveRequestApi.ListParams) {
  return requestClient.get<LeaveRequestApi.LeaveRequest[]>('/leave-requests', {
    params,
  });
}

/** 获取我的请假列表 */
export async function getMyLeaveRequestsApi() {
  return requestClient.get<LeaveRequestApi.LeaveRequest[]>(
    '/me/leave-requests',
  );
}

/** 获取我的待审批列表 */
export async function getMyPendingApprovalsApi() {
  return requestClient.get<LeaveRequestApi.LeaveRequest[]>(
    '/me/leave-requests/approvals',
  );
}

/** 获取我的审批记录 */
export async function getMyApprovalRecordsApi() {
  return requestClient.get<LeaveRequestApi.ApprovalRecord[]>(
    '/me/leave-requests/approval-records',
  );
}

/** 获取年假汇总（year 必填） */
export async function getAnnualLeaveSummaryApi(year: number) {
  return requestClient.get<LeaveRequestApi.AnnualLeaveSummary>(
    '/me/leave-requests/annual-leave/summary',
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

/** 创建请假申请（病假时通过 FormData 上传病假证明） */
export async function createLeaveRequestApi(
  data: LeaveRequestApi.CreateLeaveRequestParams,
  medicalCertificate?: File | null,
) {
  if (medicalCertificate) {
    const formData = new FormData();
    formData.append('leave_type', data.leave_type);
    formData.append('start_date', data.start_date);
    formData.append('end_date', data.end_date);
    formData.append('session', data.session ?? 'full_day');
    if (data.handover_to) formData.append('handover_to', data.handover_to);
    if (data.reason) formData.append('reason', data.reason);
    if (data.employee_id) formData.append('employee_id', data.employee_id);
    formData.append('medical_certificate', medicalCertificate);
    return requestClient.post<LeaveRequestApi.LeaveRequest>(
      '/me/leave-requests',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
  }
  return requestClient.post<LeaveRequestApi.LeaveRequest>(
    '/me/leave-requests',
    data,
  );
}

/** 获取单个请假申请详情 */
export async function getLeaveRequestApi(id: string) {
  return requestClient.get<LeaveRequestApi.LeaveRequest>(
    `/leave-requests/${id}`,
  );
}

/** 获取请假日历页筛选下拉数据（地区/部门/岗位/员工） */
export async function getLeaveCalendarMetaApi() {
  return requestClient.get<LeaveRequestApi.LeaveRequestMeta>(
    '/leave-requests/calendar/meta',
  );
}

/** 获取请假审批页筛选下拉数据（地区/部门） */
export async function getLeaveApprovalsMetaApi() {
  return requestClient.get<LeaveRequestApi.LeaveRequestMeta>(
    '/leave-requests/approvals/meta',
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

// ─── 今日后端新增接口 ────────────────────────────────────────────────────────

/** 当前用户可用请假类型目录 */
export async function getMyLeaveTypesApi() {
  return requestClient.get<LeaveRequestApi.LeaveTypeOption[]>(
    '/me/leave-requests/leave-types',
  );
}

/** 当前用户同部门同事的请假列表 */
export async function getMyDepartmentLeaveRequestsApi() {
  return requestClient.get<LeaveRequestApi.LeaveRequest[]>(
    '/me/leave-requests/department',
  );
}

/** 当前用户指定年份的调休汇总 */
export async function getMyLieuLeaveSummaryApi(year: number) {
  return requestClient.get<LeaveRequestApi.LieuLeaveSummary>(
    '/me/leave-requests/lieu-leave/summary',
    { params: { year } },
  );
}

/** 指定员工、年份的调休汇总（需 leave_calendar 权限） */
export async function getLieuLeaveSummaryApi(employeeId: string, year: number) {
  return requestClient.get<LeaveRequestApi.LieuLeaveSummary>(
    '/leave-requests/lieu-leave/summary',
    { params: { employee_id: employeeId, year } },
  );
}

/** 为指定员工、年份增加调休天数（需 leave_calendar 权限） */
export async function addLieuLeaveGrantApi(
  data: LeaveRequestApi.AddLieuLeaveGrantParams,
) {
  return requestClient.post<LeaveRequestApi.LieuLeaveSummary>(
    '/leave-requests/lieu-leave/grants',
    data,
  );
}
