import type { ClaimApi } from '#/api';

import { computed, onMounted, ref } from 'vue';

import { useI18n } from '@vben/locales';

import {
  exportClaimsApi,
  getClaimExportEmployeesApi,
  getUserInfoApi,
} from '#/api';
import { buildTimestampedFileName, saveBlob } from '#/utils/download';
import { handleActionError, toastError, toastSuccess } from '#/utils/message';

/** 后端出错时会返回 JSON Blob 而非 xlsx，据此判断并走提示分支 */
function isJsonBlob(blob: Blob): boolean {
  return !!blob.type && blob.type.includes('application/json');
}

/** 从 JSON 错误 Blob 文本中提取可读信息（FastAPI detail / message） */
function parseBlobErrorMessage(text: string, fallback: string): string {
  try {
    const errObj = JSON.parse(text);
    if (errObj?.detail) {
      if (typeof errObj.detail === 'string') return errObj.detail;
      if (Array.isArray(errObj.detail) && errObj.detail.length > 0) {
        return errObj.detail.map((e: any) => e.msg || String(e)).join('; ');
      }
    } else if (errObj?.message) {
      return errObj.message;
    }
  } catch {
    /* ignore parse error */
  }
  return fallback;
}

/**
 * 组织级报销导出（全员，支持按员工 / 分组方式筛选）。
 * - 仅当具备 claim_management / claim_org_export 查看权限且非内置 admin 时，canOrgExport 为真
 * - 员工下拉来自 GET /claims/export/employees（仅出现在已通过报销里的员工）
 * - 导出：GET /claims/export?group=...&employee_id=...（省略 employee_id = 全员）
 */
export function useOrgExport() {
  const { t } = useI18n();

  const loading = ref(false);

  // ─── 权限判定（对齐后端 can_export_org_claims） ─────────────────────────────
  const isAdmin = ref(false);
  const modulePermissions = ref<
    Array<{ can_view: boolean; module_code: string }>
  >([]);

  const canOrgExport = computed(() => {
    if (isAdmin.value) return false;
    return modulePermissions.value.some(
      (perm) =>
        (perm.module_code === 'claim_management' ||
          perm.module_code === 'claim_org_export') &&
        perm.can_view !== false,
    );
  });

  // ─── 可选员工（仅出现在已通过报销里的员工） ────────────────────────────────
  const exportEmployees = ref<ClaimApi.ClaimExportEmployee[]>([]);

  // ─── 筛选状态 ──────────────────────────────────────────────────────────────
  const orgExportGroup = ref<'month' | 'person_month'>('month');
  const orgExportEmployee = ref('');

  const orgExportEmployeeOptions = computed(() => [
    { label: t('page.claim.exportEmployee.all'), value: '' },
    ...exportEmployees.value.map((person) => ({
      label:
        person.username && person.username !== person.name
          ? `${person.name} / ${person.username}`
          : person.name,
      value: person.id,
    })),
  ]);

  async function loadPermissionAndEmployees() {
    try {
      const user = await getUserInfoApi();
      isAdmin.value = (user.roles ?? []).includes('admin');
      modulePermissions.value = (user.module_permissions ?? []).map((p) => ({
        module_code: p.module_code,
        can_view: p.can_view,
      }));
    } catch {
      isAdmin.value = false;
      modulePermissions.value = [];
    }
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

  /**
   * 导出组织级报销 Excel（跨员工，仅已通过）。
   * @param group 'month' → 每提交月一个 sheet；'person_month' → 每员工+提交月一个 sheet
   * @param employeeIds 可选，限定员工（可多个）；省略则导出全员
   */
  async function handleOrgExport(
    group: 'month' | 'person_month',
    employeeIds?: string[],
  ) {
    loading.value = true;
    try {
      const blob = await exportClaimsApi(group, employeeIds);
      if (isJsonBlob(blob)) {
        const text = await blob.text();
        toastError(
          parseBlobErrorMessage(text, t('page.claim.messages.exportFailed')),
        );
        return false;
      }
      const base =
        group === 'person_month' ? '报销记录_按人月' : '报销记录_按月';
      saveBlob(blob, buildTimestampedFileName(base, 'xlsx'));
      toastSuccess(t('page.claim.messages.exportSuccess'));
      return true;
    } catch (error) {
      handleActionError(
        'claim/useOrgExport',
        error,
        t('page.claim.messages.exportFailed'),
      );
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function onOrgExport() {
    await handleOrgExport(
      orgExportGroup.value,
      orgExportEmployee.value ? [orgExportEmployee.value] : undefined,
    );
  }

  onMounted(loadPermissionAndEmployees);

  return {
    loading,
    canOrgExport,
    orgExportEmployeeOptions,
    orgExportGroup,
    orgExportEmployee,
    onOrgExport,
    handleOrgExport,
  };
}
