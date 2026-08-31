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
          getMyPendingApprovalsApi().catch(() => []),
          getMyApprovalRecordsApi().catch(() => []),
          getMyPendingClaimApprovalsApi().catch(() => []),
          getMyClaimApprovalRecordsApi().catch(() => []),
        ]);
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
