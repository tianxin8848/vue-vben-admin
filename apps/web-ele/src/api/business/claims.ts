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

  /**
   * 单笔报销的附件项。
   *
   * 后端新口径「一单一笔费用、同一笔可带最多 20 个附件」，
   * 因此 `ClaimResponse.attachments` 才是完整附件列表；
   * 旧的 `attachment_url` / `attachment_name` 只镜像第一个（主）附件，保留兼容。
   */
  export interface ClaimAttachmentOut {
    attachment_id: null | string;
    /** `invoice`（发票）| `supporting`（支持文件） */
    attachment_kind: string;
    attachment_name: null | string;
    attachment_url: null | string;
  }

  /** 报销附件类型 code，对齐后端 `claim_config_service.CLAIM_ATTACHMENT_KINDS` */
  export type ClaimAttachmentKind = 'invoice' | 'supporting';

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
    /** 原币金额（与 `amount` 同值，后端为后续改单留的字段） */
    original_amount: null | number;
    currency: string;
    exchange_rate_to_hkd: null | number;
    amount_hkd: null | number;
    /** 最终入账金额（与 `amount_hkd` 同值） */
    final_amount: null | number;
    approval_status: ClaimApprovalStatus;
    approval_chain: Record<string, unknown>[];
    current_approver_id: null | string;
    approval_history: Record<string, unknown>[];
    attachment_url: null | string;
    attachment_name: null | string;
    /** 主附件类型：`invoice` | `supporting` */
    attachment_kind: null | string;
    /** 完整附件列表（一单一笔可带多个附件） */
    attachments: ClaimAttachmentOut[];
    /** 开票日期（后端兼容字段，新流程通常为 null，旧数据可能有值） */
    invoice_date: null | string;
    /** 票号（后端兼容字段，新流程通常为 null，旧数据可能有值） */
    invoice_no: null | string;
    items: ClaimLineItem[];
    /** 是否为代老闆提交（true 时所有权归老闆，审批链走会计 → HR） */
    filed_on_behalf: boolean;
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

  /** 全员导出可选员工（GET /claims/export/employees） */
  export interface ClaimExportEmployee {
    id: string;
    name: string;
    username: string;
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

/**
 * 创建报销草稿。
 *
 * FormData 仍为「并行 Form 列表」协议：`reason_code` / `invoice_date` / `amount` /
 * `currency`（必填，等长）与 `invoice_no` / `description`（可选，整列不传或每行都传）
 * 按行重复 append；`attachment` 为按序文件列表。
 *
 * 口径已改为**一单一笔费用**：
 * - 一个文件算一个附件（**不再把多页 PDF 拆成多笔**）；
 * - 只传 1 行金额时，所有附件都挂在这一笔上（`attachment_kind` 逐个标注 invoice/supporting）；
 * - 传 N 行金额时，须同时给 N 个文件（一行一个文件），否则 400；
 * - 单笔最多 20 个附件。
 *
 * @param formData 已按上述协议组装好的 FormData（含可选 `attachment_kind` 列）
 */
export async function createClaimApi(formData: FormData) {
  return requestClient.post<ClaimApi.ClaimResponse[]>('/me/claims', formData, {
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

/**
 * 更新报销草稿（仅 draft 状态可更新）
 * 使用 multipart/form-data，所有字段均可选：省略则保留原值；
 * 空 description / invoice_no 会清空对应字段；不传文件则保留原附件。
 *
 * `attachment` 是**主附件（invoice）替换**语义：新文件取代主附件，
 * 其余 `attachments` 里的支持文件保留。后端已不再限制「多页 PDF 必须拆开」。
 */
export async function updateClaimDraftApi(
  claimId: string,
  data: {
    amount?: null | number;
    attachment?: File | null;
    currency?: null | string;
    description?: null | string;
    invoice_date?: null | string;
    invoice_no?: null | string;
    reason_code?: string;
  },
) {
  const formData = new FormData();
  if (data.reason_code !== undefined)
    formData.append('reason_code', data.reason_code);
  if (data.invoice_date !== undefined && data.invoice_date !== null) {
    formData.append('invoice_date', data.invoice_date);
  }
  if (data.invoice_no !== undefined) {
    formData.append('invoice_no', data.invoice_no || '');
  }
  if (data.description !== undefined) {
    formData.append('description', data.description || '');
  }
  if (data.amount !== undefined && data.amount !== null) {
    formData.append('amount', String(data.amount));
  }
  if (data.currency !== undefined && data.currency !== null) {
    formData.append('currency', data.currency);
  }
  if (data.attachment) {
    formData.append('attachment', data.attachment);
  }
  return requestClient.patch<ClaimApi.ClaimResponse>(
    `/me/claims/${claimId}`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
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

/**
 * 老闆（岗位 = 老闆）只读查看全部员工已通过报销。
 * 非老闆账号返回空数组（不是 403），所以调用方无需额外权限接口。
 * 只读：approve/reject 仍仅当前审批人可操作。
 */
export async function getMyApprovedClaimsApi() {
  return requestClient.get<ClaimApi.ClaimResponse[]>('/me/claims/approved');
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

/**
 * 导出我的报销记录为 Excel（.xlsx）
 * 后端仅导出 approval_status = approved 的记录
 * @param claimIds 可选，指定要导出的 claim_id 列表；不传则导出全部已通过
 */
export async function exportMyClaimsApi(claimIds?: string[]) {
  return requestClient.get<Blob>('/me/claims/export', {
    params:
      claimIds && claimIds.length > 0 ? { claim_id: claimIds } : undefined,
    paramsSerializer: 'repeat',
    responseType: 'blob',
    // 导出 Excel 可能耗时较长，单独放宽至 60s
    timeout: 60_000,
  });
}

/**
 * 全员导出可选员工列表（出现在已通过报销里的员工）。
 * 供导出下拉使用；权限同 exportClaimsApi。
 */
export async function getClaimExportEmployeesApi() {
  return requestClient.get<ClaimApi.ClaimExportEmployee[]>(
    '/claims/export/employees',
  );
}

/**
 * 导出组织级报销记录为 Excel（.xlsx），跨员工、按提交月份（created_at）分 sheet。
 * 后端仅导出 approval_status = approved 的记录；Date/Start/End 列仍为 invoice_date。
 * @param group 'month' → 每个提交月份一个 sheet（含 Name 列）；'person_month' → 每个员工 + 提交月份一个 sheet
 * @param employeeIds 可选，限定员工（可多个）；省略则导出全员
 * @permission claim_management 或 claim_org_export（内置 admin 不可用）
 */
export async function exportClaimsApi(
  group: 'month' | 'person_month',
  employeeIds?: string[],
) {
  return requestClient.get<Blob>('/claims/export', {
    params: {
      group,
      ...(employeeIds && employeeIds.length > 0
        ? { employee_id: employeeIds }
        : {}),
    },
    paramsSerializer: 'repeat',
    responseType: 'blob',
    // 导出 Excel 可能耗时较长，单独放宽至 60s
    timeout: 60_000,
  });
}
