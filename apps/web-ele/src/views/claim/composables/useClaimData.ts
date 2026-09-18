import type { TabKey } from '../data';

import type { ClaimApi } from '#/api';

import { onMounted, ref, watch } from 'vue';

import { getClaimOptionsApi, getMyClaimsApi } from '#/api';

import { HISTORY_STATUSES, MY_ACTIVE_STATUSES } from '../data';

export function useClaimData() {
  const loading = ref(false);

  const reasonOptions = ref<ClaimApi.ClaimReasonOption[]>([]);
  const currencyOptions = ref<ClaimApi.ClaimCurrencyOption[]>([]);

  const activeTab = ref<TabKey>('my');

  const myClaims = ref<ClaimApi.ClaimResponse[]>([]);
  const myHistory = ref<ClaimApi.ClaimResponse[]>([]);

  // ─── 单个数据加载函数 ──────────────────────────────────────────────────────
  async function loadOptions() {
    try {
      const opts = await getClaimOptionsApi();
      reasonOptions.value = (opts as any).claim_reasons || [];
      currencyOptions.value = (opts as any).claim_currencies || [];
    } catch {
      reasonOptions.value = [];
      currencyOptions.value = [];
    }
  }

  /** 我的报销（进行中：草稿 + 审批中） */
  async function loadMyClaims() {
    try {
      myClaims.value = await getMyClaimsApi(MY_ACTIVE_STATUSES);
    } catch {
      myClaims.value = [];
    }
  }

  /** 历史记录：仅已批准（approved） */
  async function loadMyHistory() {
    try {
      myHistory.value = await getMyClaimsApi(HISTORY_STATUSES);
    } catch {
      myHistory.value = [];
    }
  }

  // ─── 批量加载 ──────────────────────────────────────────────────────────────
  async function fetchAll() {
    loading.value = true;
    try {
      await Promise.all([loadOptions(), loadMyClaims(), loadMyHistory()]);
    } catch (error) {
      console.error('Fetch all error:', error);
    } finally {
      loading.value = false;
    }
  }

  // ─── 按 Tab 重新加载 ───────────────────────────────────────────────────────
  async function reloadActiveTab() {
    loading.value = true;
    try {
      switch (activeTab.value) {
        case 'history': {
          await loadMyHistory();
          break;
        }
        case 'my': {
          await loadMyClaims();
          break;
        }
      }
    } finally {
      loading.value = false;
    }
  }

  const tabLengths = () => ({
    my: myClaims.value.length,
    history: myHistory.value.length,
  });

  const dataRefs = () => ({
    my: myClaims.value,
    history: myHistory.value,
  });

  onMounted(fetchAll);
  watch(activeTab, reloadActiveTab);

  return {
    // state
    loading,
    reasonOptions,
    currencyOptions,
    activeTab,
    myClaims,
    myHistory,
    // helpers
    tabLengths,
    dataRefs,
    // actions
    fetchAll,
    reloadActiveTab,
    // child loaders (for success callbacks)
    loadMyClaims,
    loadMyHistory,
  };
}
