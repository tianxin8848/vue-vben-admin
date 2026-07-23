import { requestClient } from '#/api/request';

export namespace ClaimApi {
  /** 报销审批状态 */
  export type ClaimApprovalStatus =
    | 'approved'
    | 'pending'
    | 'rejected'
    | 'withdrawn';

  /** 报销选项中的理由项 */
  export interface ClaimReasonOption {
    name: string;
  }

  /** 报销选项中的币种项 */
  export interface ClaimCurrencyOption {
    currency_code: string;
    to_hkd_rate: number;
  }

  /** 报销选项 */
  export interface ClaimOptions {
    claim_currencies: ClaimCurrencyOption[];
    claim_reasons: ClaimReasonOption[];
  }

  /** 报销申请响应 */
  export interface ClaimResponse {
    id: string;
    employee_id: string;
    employee_username: string;
    employee_name: string;
    employee_department: null | string;
    employee_region: null | string;
    reason_code: string;
    reason_label: string;
    description: null | string;
    amount: number;
    currency: string;
    exchange_rate_to_hkd: null | number;
    amount_hkd: null | number;
    approval_status: ClaimApprovalStatus;
    approval_chain: Record<string, unknown>[];
    current_approver_id: null | string;
    approval_history: Record<string, unknown>[];
    attachment_url: null | string;
    attachment_name: null | string;
    created_by_id: string;
    created_by_name: string;
    review_comment: null | string;
    reviewed_at: null | string;
    created_at: null | string;
    updated_at: null | string;
  }

  /** 报销审批记录响应 */
  export interface ClaimApprovalRecord {
    id: string;
    claim_request_id: string;
    action: string;
    operator_id: string;
    operator_username: string;
    operator_name: null | string;
    operator_role: null | string;
    employee_id: string;
    employee_username: string;
    employee_name: string;
    employee_department: null | string;
    employee_region: null | string;
    claim_reason_code: string;
    claim_reason_label: string;
    amount: number;
    currency: string;
    amount_hkd: null | number;
    comment: null | string;
    approval_status_before: null | ClaimApprovalStatus;
    approval_status_after: ClaimApprovalStatus;
    current_approver_id_before: null | string;
    current_approver_id_after: null | string;
    current_approver_name_after: null | string;
    current_approver_level_after: null | number;
    is_flowing: boolean;
    created_at: null | string;
  }
}

// ─── 报销选项 ────────────────────────────────────────────────────────────────

/** 获取报销选项（理由、币种） */
export async function getClaimOptionsApi() {
  return requestClient.get<ClaimApi.ClaimOptions>('/claims/options');
}

// ─── 我的报销 ────────────────────────────────────────────────────────────────

/** 获取我当前进行中的报销申请 */
export async function getMyClaimsApi() {
  return requestClient.get<ClaimApi.ClaimResponse[]>('/claims/my');
}

/** 获取我的报销历史记录 */
export async function getMyClaimHistoryApi() {
  return requestClient.get<ClaimApi.ClaimResponse[]>('/claims/history/my');
}

/** 创建报销申请（FormData: reason_code, description, amount, currency, attachment） */
export async function createClaimApi(formData: FormData) {
  return requestClient.post<ClaimApi.ClaimResponse>('/claims', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

// ─── 报销审批 ────────────────────────────────────────────────────────────────

/** 获取我待审批的报销申请 */
export async function getMyPendingClaimApprovalsApi() {
  return requestClient.get<ClaimApi.ClaimResponse[]>(
    '/claims/approvals/my',
  );
}

/** 获取我的报销审批记录 */
export async function getMyClaimApprovalRecordsApi() {
  return requestClient.get<ClaimApi.ClaimApprovalRecord[]>(
    '/claims/approvals/records/my',
  );
}

/** 审批报销申请 */
export async function reviewClaimApi(
  claimId: string,
  data: { approval_status: string; review_comment?: null | string },
) {
  const formData = new FormData();
  formData.append('approval_status', data.approval_status);
  if (data.review_comment) {
    formData.append('review_comment', data.review_comment);
  }
  return requestClient.patch<ClaimApi.ClaimResponse>(
    `/claims/${claimId}/approval`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
}
