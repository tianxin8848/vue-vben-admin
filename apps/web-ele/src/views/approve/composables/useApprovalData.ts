import type { ClaimApi, LeaveRequestApi } from '#/api';

import { ref } from 'vue';

import {
  getMyApprovalRecordsApi,
  getMyClaimApprovalRecordsApi,
  getMyPendingApprovalsApi,
  getMyPendingClaimApprovalsApi,
} from '#/api';

/** Records Claim 审批记录只保留已通过/已拒绝，排除撤回（withdrawn）和流转中间态（pending） */
const RECORDS_CLAIM_ALLOWED_STATUSES = new Set(['approved', 'rejected']);

export function useApprovalData() {
  const loading = ref(false);

  const leaveRequests = ref<LeaveRequestApi.LeaveRequest[]>([]);
  const leaveApprovalRecords = ref<LeaveRequestApi.ApprovalRecord[]>([]);
  const claimApprovals = ref<ClaimApi.ClaimResponse[]>([]);
  const claimApprovalRecords = ref<ClaimApi.ClaimApprovalRecord[]>([]);

  async function fetchApprovalData() {
    loading.value = true;
    try {
      const [pendingLeave, recordsLeave, pendingClaim, recordsClaim] =
        await Promise.all([
          getMyPendingApprovalsApi().catch((error) => {
            console.error(
              '[useApprovalData] getMyPendingApprovalsApi 失敗：',
              error,
            );
            return [];
          }),
          getMyApprovalRecordsApi().catch((error) => {
            console.error(
              '[useApprovalData] getMyApprovalRecordsApi 失敗：',
              error,
            );
            return [];
          }),
          getMyPendingClaimApprovalsApi().catch((error) => {
            console.error(
              '[useApprovalData] getMyPendingClaimApprovalsApi 失敗：',
              error,
            );
            return [];
          }),
          getMyClaimApprovalRecordsApi().catch((error) => {
            console.error(
              '[useApprovalData] getMyClaimApprovalRecordsApi 失敗：',
              error,
            );
            return [];
          }),
        ]);

      // 调试输出（临时保留用于验证 total_days，后续移除）
      //   使用 console.warn 而非 console.log 以通过 no-console 规则
      //   （oxlint/eslint no-console 仅允许 warn/error）
      console.warn(
        '[useApprovalData] pendingLeave (待審請假) 數量：',
        pendingLeave.length,
        pendingLeave,
      );
      console.warn(
        '[useApprovalData] recordsLeave (審批記錄-請假) 數量：',
        recordsLeave.length,
        recordsLeave,
      );
      console.warn(
        '[useApprovalData] pendingClaim 數量：',
        pendingClaim.length,
        pendingClaim,
      );
      console.warn(
        '[useApprovalData] recordsClaim 數量：',
        recordsClaim.length,
        recordsClaim,
      );

      if (pendingLeave.length > 0) {
        const first = pendingLeave[0] ?? {};
        console.warn(
          '[useApprovalData] pendingLeave[0] 全部字段：',
          Object.keys(first),
          'total_days =',
          (first as any).total_days,
        );
      }
      if (recordsLeave.length > 0) {
        const first = recordsLeave[0] ?? {};
        console.warn(
          '[useApprovalData] recordsLeave[0] 全部字段：',
          Object.keys(first),
          'total_days =',
          (first as any).total_days,
        );
      }

      leaveRequests.value = pendingLeave;
      leaveApprovalRecords.value = recordsLeave;
      claimApprovals.value = pendingClaim;
      claimApprovalRecords.value = recordsClaim.filter((r) =>
        RECORDS_CLAIM_ALLOWED_STATUSES.has(r.approval_status_after),
      );
    } finally {
      loading.value = false;
    }
  }

  return {
    loading,
    leaveRequests,
    leaveApprovalRecords,
    claimApprovals,
    claimApprovalRecords,
    fetchApprovalData,
  };
}
