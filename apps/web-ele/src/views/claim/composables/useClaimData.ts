import type { TabKey } from '../data';

import type { ClaimApi } from '#/api';

import { computed, onMounted, ref, watch } from 'vue';

import {
  getClaimExportEmployeesApi,
  getClaimOptionsApi,
  getMyClaimsApi,
  getUserInfoApi,
} from '#/api';

import { HISTORY_STATUSES, MY_ACTIVE_STATUSES } from '../data';

export function useClaimData() {
  const loading = ref(false);

  const userInfo = ref<null | {
    full_name: string;
    username: string;
  }>(null);

  // ─── 组织级导出权限（对齐后端 can_export_org_claims） ────────────────────────
  const isAdmin = ref(false);
  const modulePermissions = ref<
    Array<{ can_view: boolean; module_code: string }>
  >([]);

  /**
   * 是否可导出组织级报销（GET /claims/export）：
   * 内置 admin 被后端拒绝；需具备 claim_management 或 claim_org_export 的查看权限。
   */
  const canOrgExport = computed(() => {
    if (isAdmin.value) return false;
    return modulePermissions.value.some(
      (perm) =>
        (perm.module_code === 'claim_management' ||
          perm.module_code === 'claim_org_export') &&
        perm.can_view !== false,
    );
  });

  const reasonOptions = ref<ClaimApi.ClaimReasonOption[]>([]);
  const currencyOptions = ref<ClaimApi.ClaimCurrencyOption[]>([]);

  // ─── 组织级导出：可选员工（仅出现在已通过报销里的员工） ──────────────────────
  const exportEmployees = ref<ClaimApi.ClaimExportEmployee[]>([]);

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

  async function loadUserInfo() {
    try {
      const user = await getUserInfoApi();
      userInfo.value = { username: user.username, full_name: user.realName };
      isAdmin.value = (user.roles ?? []).includes('admin');
      modulePermissions.value = (user.module_permissions ?? []).map((p) => ({
        module_code: p.module_code,
        can_view: p.can_view,
      }));
    } catch {
      userInfo.value = null;
      isAdmin.value = false;
      modulePermissions.value = [];
    }
  }

  /** 组织级导出下拉：可选员工（需先拿到权限判定，无权限则不请求） */
  async function loadExportEmployees() {
    if (!canOrgExport.value) {
      exportEmployees.value = [];
      return;
    }
    try {
      exportEmployees.value = await getClaimExportEmployeesApi();
    } catch {
      exportEmployees.value = [];
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
      // 权限判定（canOrgExport）依赖 loadUserInfo，员工下拉必须在其之后
      await Promise.all([loadOptions(), loadUserInfo()]);
      await Promise.all([
        loadMyClaims(),
        loadMyHistory(),
        loadExportEmployees(),
      ]);
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
    userInfo,
    canOrgExport,
    exportEmployees,
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
    loadExportEmployees,
  };
}
