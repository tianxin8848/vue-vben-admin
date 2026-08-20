import type { ColumnVisibility } from '../data';

import type { EmployeeApi } from '#/api';

import { reactive, ref } from 'vue';

import { getEmployeeManageMetaApi } from '#/api';

import { defaultColumnVisibility } from '../data';

export function useEmployeeData() {
  // ─── 列显示切换 ─────────────────────────────────────────────────
  const columnVisibility = reactive<ColumnVisibility>({
    ...defaultColumnVisibility,
  });

  // ─── 选项数据（部门 / 岗位 / 地区 / 模块） ───────────────────────
  const departmentOptions = ref<{ label: string; value: string }[]>([]);
  const positionOptions = ref<{ label: string; value: string }[]>([]);
  const regionOptions = ref<{ label: string; value: string }[]>([]);
  const moduleOptions = ref<EmployeeApi.EmployeeManageMeta['modules']>([]);

  // ─── 员工列表缓存（前端筛选 / 分页基于此数据） ───────────────────
  const allEmployees = ref<EmployeeApi.EmployeeResponse[]>([]);

  // ─── 重置密码弹窗 ───────────────────────────────────────────────
  const showResetModal = ref(false);
  const resetResult = ref<EmployeeApi.EmployeePasswordResetResponse | null>(
    null,
  );
  const resetEmployeeId = ref('');

  function invalidateEmployees() {
    allEmployees.value = [];
  }

  function openResetModal(id: string) {
    resetEmployeeId.value = id;
    resetResult.value = null;
    showResetModal.value = true;
  }

  async function fetchSystemSettings() {
    try {
      const meta = await getEmployeeManageMetaApi();
      departmentOptions.value = (meta.departments || []).map((d) => ({
        label: d,
        value: d,
      }));
      positionOptions.value = (meta.positions || []).map((p) => ({
        label: p,
        value: p,
      }));
      regionOptions.value = (meta.regions || []).map((r) => ({
        label: r,
        value: r,
      }));
      moduleOptions.value = meta.modules || [];
    } catch {
      // 获取系统设置失败时保持空选项
    }
  }

  function getInitialPasswordStatus(isInitial: number) {
    return isInitial === 1 ? '未修改' : '已修改';
  }

  function getPermissionLabels(permissions: EmployeeApi.ModulePermission[]) {
    return permissions
      .filter(
        (p) =>
          p.can_view ||
          p.can_create ||
          p.can_edit ||
          p.can_delete ||
          p.can_approve,
      )
      .map((p) => p.module_name)
      .join(', ');
  }

  return {
    allEmployees,
    columnVisibility,
    departmentOptions,
    fetchSystemSettings,
    getInitialPasswordStatus,
    getPermissionLabels,
    invalidateEmployees,
    moduleOptions,
    openResetModal,
    positionOptions,
    regionOptions,
    resetEmployeeId,
    resetResult,
    showResetModal,
  };
}
