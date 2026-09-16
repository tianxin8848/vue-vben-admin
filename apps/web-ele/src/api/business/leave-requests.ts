import { requestClient } from '#/api/request';

export namespace LeaveRequestApi {
  // 后端 leave_type 已从枚举放宽为 str（max_length=50），
  // 接口返回的任意 code（如 maternity/paternity/parental/Compensation/statutory_holiday）都允许
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
    annual_available_days: number;
    annual_available_raw: number;
    annual_entitlement_days: number;
    annual_entitlement_raw: number;
    annual_used_days: number;
    as_of: string;
    available_days: number;
    carry_over_projected_days: number;
    entitlement_days: number;
    region: null | string;
    usable_from: string;
    used_days: number;
    year: number;
  }

  /** 结转假期汇总响应（/me/leave-requests/bought-forward/summary） */
  export interface BoughtForwardSummary {
    carry_over_available_days: number;
    carry_over_granted_days: number;
    carry_over_used_days: number;
    expires_on: string;
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
    total_days: number;
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
    employee_id: string;
    lieu_available_days: number;
    lieu_capped: boolean;
    lieu_granted_days: number;
    lieu_used_days: number;
    year: number;
  }

  /** 单条调休发放明细（GET /leave-requests/lieu-leave/grants） */
  export interface LieuLeaveGrantResponse {
    created_at: null | string;
    days: number;
    employee_id: string;
    expires_on: null | string;
    granted_by_id: null | string;
    id: string;
    remarks: null | string;
    updated_at: null | string;
    work_date: null | string;
  }

  /** 增加调休额度请求体 */
  export interface AddLieuLeaveGrantParams {
    /** 员工 ID */
    employee_id: string;
    /** 加班日（调休来源日），格式 YYYY-MM-DD，必填 */
    work_date: string;
    days: number;
    /** 可选备注，最长 500 字符；后端会规整空串为 null */
    remarks?: null | string;
    /** 年份，后端实际按 work_date.year 落库，此字段仅作兼容保留（可选） */
    year?: null | number;
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

/** 撤回当前用户的请假申请（后端注册在 /me 前缀下） */
export async function withdrawLeaveRequestApi(
  id: string,
  data: LeaveRequestApi.WithdrawParams = {},
) {
  return requestClient.request<LeaveRequestApi.LeaveRequest>(
    `/me/leave-requests/${id}/withdraw`,
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

/** 当前用户指定年份的结转假期汇总（carry_over） */
export async function getBoughtForwardSummaryApi(year: number) {
  return requestClient.get<LeaveRequestApi.BoughtForwardSummary>(
    '/me/leave-requests/bought-forward/summary',
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

/** 列出指定员工、年份的调休发放明细（含加班日与备注，需 leave_calendar 权限） */
export async function listLieuLeaveGrantsApi(employeeId: string, year: number) {
  return requestClient.get<LeaveRequestApi.LieuLeaveGrantResponse[]>(
    '/leave-requests/lieu-leave/grants',
    { params: { employee_id: employeeId, year } },
  );
}
