import { requestClient } from '#/api/request';

export namespace ClaimApi {
  /** 报销审批状态 */
  export type ClaimApprovalStatus =
    | 'approved'
    | 'draft'
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

  /** 报销明细项（line item） */
  export interface ClaimLineItem {
    item_id: null | string;
    reason_code: string;
    reason_label: string;
    description: null | string;
    amount: number;
    currency: string;
    exchange_rate_to_hkd: null | number;
    amount_hkd: null | number;
    /** 开票日期（后端兼容字段，新流程通常为 null） */
    invoice_date: null | string;
    /** 票号（后端兼容字段，新流程通常为 null） */
    invoice_no: null | string;
    attachment_url: null | string;
    attachment_name: null | string;
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
    /** 开票日期（后端兼容字段，新流程通常为 null，旧数据可能有值） */
    invoice_date: null | string;
    /** 票号（后端兼容字段，新流程通常为 null，旧数据可能有值） */
    invoice_no: null | string;
    items: ClaimLineItem[];
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
    approval_status_before: ClaimApprovalStatus | null;
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

// ─── 我的报销（/me/claims） ──────────────────────────────────────────────────

/** 获取我的报销（含草稿），可按状态过滤（status 可重复） */
export async function getMyClaimsApi(status?: ClaimApi.ClaimApprovalStatus[]) {
  return requestClient.get<ClaimApi.ClaimResponse[]>('/me/claims', {
    params: status ? { status } : undefined,
    paramsSerializer: 'repeat',
  });
}

/** 创建报销草稿（FormData: reason_code, description, amount, currency, attachment） */
export async function createClaimApi(formData: FormData) {
  return requestClient.post<ClaimApi.ClaimResponse>('/me/claims', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/** 批量提交报销草稿（多条草稿聚合为一条 pending） */
export async function submitClaimBatchApi(itemIds: string[]) {
  return requestClient.post<ClaimApi.ClaimResponse>(
    '/me/claims/submit',
    { item_ids: itemIds },
    { headers: { 'Content-Type': 'application/json' } },
  );
}

/** 提交单条报销草稿（draft → pending） */
export async function submitClaimSingleApi(claimId: string) {
  return requestClient.post<ClaimApi.ClaimResponse>(
    `/me/claims/${claimId}/submit`,
  );
}

/** 删除报销草稿（仅 draft 状态可删除） */
export async function deleteClaimDraftApi(claimId: string) {
  return requestClient.delete(`/me/claims/${claimId}`);
}

/** 撤回报销（withdraw_comment 为查询参数，含中文时需 URL 编码） */
export async function withdrawClaimApi(
  claimId: string,
  withdrawComment?: null | string,
) {
  return requestClient.patch<ClaimApi.ClaimResponse>(
    `/me/claims/${claimId}/withdraw`,
    undefined,
    {
      params: withdrawComment
        ? { withdraw_comment: withdrawComment }
        : undefined,
    },
  );
}

// ─── 报销审批 ────────────────────────────────────────────────────────────────

/** 获取我待审批的报销申请 */
export async function getMyPendingClaimApprovalsApi() {
  return requestClient.get<ClaimApi.ClaimResponse[]>('/me/claims/approvals');
}

/** 获取我的报销审批记录 */
export async function getMyClaimApprovalRecordsApi() {
  return requestClient.get<ClaimApi.ClaimApprovalRecord[]>(
    '/me/claims/approval-records',
  );
}

/** 审批报销申请（application/x-www-form-urlencoded，支持部分驳回 rejected_item_ids） */
export async function reviewClaimApi(
  claimId: string,
  data: {
    approval_status: string;
    rejected_item_ids?: string[];
    review_comment?: null | string;
  },
) {
  const params = new URLSearchParams();
  params.append('approval_status', data.approval_status);
  if (data.review_comment) {
    params.append('review_comment', data.review_comment);
  }
  if (data.rejected_item_ids && data.rejected_item_ids.length > 0) {
    data.rejected_item_ids.forEach((id) =>
      params.append('rejected_item_ids', id),
    );
  }
  return requestClient.patch<ClaimApi.ClaimResponse>(
    `/claims/${claimId}/approval`,
    params,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );
}

// ─── 导出 ────────────────────────────────────────────────────────────────────

/** 导出我的报销记录为 Excel（.xlsx，不含草稿） */
export async function exportMyClaimsApi() {
  return requestClient.get<Blob>('/me/claims/export', {
    responseType: 'blob',
  });
}
