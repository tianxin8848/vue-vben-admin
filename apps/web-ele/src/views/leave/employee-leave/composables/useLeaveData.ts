import type { LeaveRequestApi } from '#/api';

import { computed, onMounted, ref } from 'vue';

import {
  getAnnualLeaveSummaryApi,
  getBoughtForwardSummaryApi,
  getMyLeaveRequestsApi,
  getMyLieuLeaveSummaryApi,
  withdrawLeaveRequestApi,
} from '#/api';
import { $t } from '#/locales';
import { handleActionError, toastSuccess } from '#/utils/message';

import { loadLeaveTypeLabels } from '../../shared/leave-types';

/** 统计卡片数值（数值或占位 '-'） */
export type LeaveStats = Record<string, number | string>;

/**
 * 员工请假页数据层：请假记录、年假/调休/结转汇总、筛选、年历映射与统计。
 * 所有请求失败均回退为空数据，避免打断页面渲染。
 */
export function useLeaveData() {
  const loading = ref(false);

  const leaveRequests = ref<LeaveRequestApi.LeaveRequest[]>([]);
  const annualSummary = ref<LeaveRequestApi.AnnualLeaveSummary | null>(null);
  const lieuSummary = ref<LeaveRequestApi.LieuLeaveSummary | null>(null);
  const boughtForwardSummary = ref<LeaveRequestApi.BoughtForwardSummary | null>(
    null,
  );
  const hideWithdrawnOrRejected = ref(false);

  // 年历基准年份
  const currentYear = ref(new Date().getFullYear());

  // ─── 派生数据 ──────────────────────────────────────────────────────────────

  /** 筛选后的请假记录（可隐藏已撤回 / 已驳回） */
  const filteredLeaveRequests = computed(() => {
    if (!hideWithdrawnOrRejected.value) {
      return leaveRequests.value;
    }
    return leaveRequests.value.filter(
      (item) =>
        item.approval_status !== 'withdrawn' &&
        item.approval_status !== 'rejected',
    );
  });

  /** 年历数据映射：日期 → 当日请假条目（仅当前年份） */
  const dayMap = computed(() => {
    const map: Record<string, LeaveRequestApi.LeaveRequest[]> = {};
    filteredLeaveRequests.value.forEach((record) => {
      (record.date_keys || []).forEach((dateKey) => {
        if (!dateKey.startsWith(`${currentYear.value}-`)) return;
        map[dateKey] = map[dateKey] || [];
        map[dateKey].push({ ...record });
      });
    });
    return map;
  });

  /** 统计数据（年假 / 调休 / 结转汇总卡片） */
  const stats = computed<LeaveStats>(() => {
    const yearRecords = filteredLeaveRequests.value.filter((item) =>
      (item.date_keys || []).some((dateKey) =>
        dateKey.startsWith(`${currentYear.value}-`),
      ),
    );

    // 年假累计（原始精度）：data1.annual_entitlement_raw，前端四舍五入到整数
    const accrualRaw = annualSummary.value?.annual_entitlement_raw;

    return {
      recordCount: yearRecords.length,
      dayCount: Object.keys(dayMap.value).length,
      pendingCount: yearRecords.filter(
        (item) => item.approval_status === 'pending',
      ).length,
      // 年假：data1.annual_entitlement_days
      annualEntitlement: annualSummary.value?.annual_entitlement_days ?? '-',
      annualLeaveAccrual:
        accrualRaw === null || accrualRaw === undefined
          ? '-'
          : Math.round(accrualRaw),
      // 年假已用：data1.annual_used_days
      annualUsed: annualSummary.value?.annual_used_days ?? '-',
      // 年假可用：data1.annual_available_days
      annualAvailable: annualSummary.value?.annual_available_days ?? '-',
      // 调休已授予：data2.lieu_granted_days
      lieuGranted: lieuSummary.value?.lieu_granted_days ?? '-',
      // 调休可用：data2.lieu_available_days
      lieuAvailable: lieuSummary.value?.lieu_available_days ?? '-',
      // 调休已用：data2.lieu_used_days
      lieuUsed: lieuSummary.value?.lieu_used_days ?? '-',
      // 结转已用：data3.carry_over_used_days
      carryForward: boughtForwardSummary.value?.carry_over_used_days ?? '-',
      // 结转可用：data3.carry_over_available_days
      broughtForward:
        boughtForwardSummary.value?.carry_over_available_days ?? '-',
    };
  });

  // ─── 数据加载 ──────────────────────────────────────────────────────────────

  /** 并行加载：请假记录 + 年假 / 调休 / 结转汇总 */
  async function fetchData() {
    loading.value = true;
    try {
      const [requests, summary, lieu, boughtForward] = await Promise.all([
        getMyLeaveRequestsApi().catch((error) => {
          console.error('[employee-leave] getMyLeaveRequestsApi 失敗：', error);
          return [];
        }),
        getAnnualLeaveSummaryApi(currentYear.value).catch((error) => {
          console.error(
            '[employee-leave] getAnnualLeaveSummaryApi 失敗：',
            error,
          );
          return null;
        }),
        getMyLieuLeaveSummaryApi(currentYear.value).catch((error) => {
          console.error(
            '[employee-leave] getMyLiuLeaveSummaryApi 失敗：',
            error,
          );
          return null;
        }),
        getBoughtForwardSummaryApi(currentYear.value).catch((error) => {
          console.error(
            '[employee-leave] getBoughtForwardSummaryApi 失敗：',
            error,
          );
          return null;
        }),
      ]);

      // 调试输出（临时保留用于验证 total_days，后续移除）
      //   使用 console.warn 而非 console.log 以通过 no-console 规则
      //   （oxlint/eslint no-console 仅允许 warn/error）
      console.warn(
        '[employee-leave] getMyLeaveRequestsApi 返回數量：',
        requests?.length,
        requests,
      );
      console.warn('[employee-leave] annualSummary：', summary);
      console.warn('[employee-leave] lieuSummary：', lieu);
      console.warn('[employee-leave] boughtForwardSummary：', boughtForward);

      if (requests && requests.length > 0) {
        const first = requests[0] ?? {};
        console.warn(
          '[employee-leave] requests[0] 全部字段：',
          Object.keys(first),
          'total_days =',
          (first as any).total_days,
        );
      }

      leaveRequests.value = requests || [];
      annualSummary.value = summary;
      lieuSummary.value = lieu;
      boughtForwardSummary.value = boughtForward;
    } catch (error) {
      console.error('[employee-leave] fetchData 整體失敗：', error);
      leaveRequests.value = [];
      annualSummary.value = null;
      lieuSummary.value = null;
      boughtForwardSummary.value = null;
    } finally {
      loading.value = false;
    }
  }

  // ─── 交互 ──────────────────────────────────────────────────────────────────

  /** 撤回请假申请（PATCH /api/v1/me/leave-requests/{id}/withdraw） */
  async function handleWithdraw(id: string) {
    // withdrawLeaveRequestApi 实际请求：PATCH /api/v1/me/leave-requests/{id}/withdraw
    console.warn('[withdraw] request =>', {
      method: 'PATCH',
      url: `/api/v1/me/leave-requests/${id}/withdraw`,
      id,
    });
    try {
      const result = await withdrawLeaveRequestApi(id);
      console.warn('[withdraw] response =>', result);
      toastSuccess($t('page.leave.employeeLeave.message.withdrawSuccess'));
      await fetchData();
    } catch (error) {
      handleActionError(
        'leave/employee-leave',
        error,
        $t('page.leave.employeeLeave.message.withdrawFailed'),
      );
    }
  }

  onMounted(() => {
    fetchData();
    // 加载请假类型目录（来自 system-settings.leave_types）
    loadLeaveTypeLabels();
  });

  return {
    // 状态
    currentYear,
    hideWithdrawnOrRejected,
    leaveRequests,
    loading,
    // 派生
    dayMap,
    filteredLeaveRequests,
    stats,
    // 方法
    fetchData,
    handleWithdraw,
  };
}
