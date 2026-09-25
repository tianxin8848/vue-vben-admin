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

  // ─── 选项数据（部门 / 岗位 / 地区 / 权限角色 / 模块） ───────────
  const departmentOptions = ref<{ label: string; value: string }[]>([]);
  const positionOptions = ref<{ label: string; value: string }[]>([]);
  const regionOptions = ref<{ label: string; value: string }[]>([]);
  const permissionRoleOptions = ref<
    EmployeeApi.EmployeeManageMeta['permission_roles']
  >([]);
  /** 可分配的模块清单（权限弹窗的勾选来源） */
  const moduleOptions = ref<EmployeeApi.EmployeeManageMeta['modules']>([]);

  // ─── 员工列表缓存（前端筛选 / 分页基于此数据） ───────────────────────────
  const allEmployees = ref<EmployeeApi.EmployeeResponse[]>([]);

  // ─── 权限弹窗 ───────────────────────────────────────────────────
  const showPermissionModal = ref(false);
  const permissionTarget = ref<EmployeeApi.EmployeeResponse | null>(null);
  const permissionLoading = ref(false);

  function openPermissionModal(employee: EmployeeApi.EmployeeResponse) {
    permissionTarget.value = employee;
    showPermissionModal.value = true;
  }

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
      permissionRoleOptions.value = meta.permission_roles || [];
      moduleOptions.value = meta.modules || [];
    } catch {
      // 获取系统设置失败时保持空选项
    }
  }

  function getInitialPasswordStatus(isInitial: number) {
    return isInitial === 1 ? '未修改' : '已修改';
  }

  /**
   * 判定员工是否具有用户管理权限（用于"身份"列展示）。
   * 后端没有 is_admin 字段，统一通过 user_management 模块的 can_view 来体现。
   */
  function isManager(permissions: EmployeeApi.ModulePermission[]) {
    return permissions.some(
      (p) => p.module_code === 'user_management' && p.can_view,
    );
  }

  return {
    allEmployees,
    columnVisibility,
    departmentOptions,
    fetchSystemSettings,
    getInitialPasswordStatus,
    invalidateEmployees,
    isManager,
    moduleOptions,
    openPermissionModal,
    openResetModal,
    permissionLoading,
    permissionRoleOptions,
    permissionTarget,
    positionOptions,
    regionOptions,
    resetEmployeeId,
    resetResult,
    showPermissionModal,
    showResetModal,
  };
}
