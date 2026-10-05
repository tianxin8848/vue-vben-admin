import type { ColumnVisibility } from '../data';

import type { EmployeeApi } from '#/api';

import { reactive, ref } from 'vue';

import { getEmployeeManageMetaApi, getEmployeesApi } from '#/api';

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
  /** 可选用工类型 code 清单（后端 EMPLOYMENT_TYPES），展示名由 i18n 映射 */
  const employmentTypeCodes = ref<string[]>([]);

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

  /**
   * 确保员工列表已缓存，并返回它。
   * 「直属上司」下拉需要 id → 姓名 的映射，而创建/编辑入口可能在列表首次取数之前打开。
   */
  async function loadEmployees() {
    if (allEmployees.value.length === 0) {
      allEmployees.value = await getEmployeesApi();
    }
    return allEmployees.value;
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
      employmentTypeCodes.value = meta.employment_types || [];
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
    employmentTypeCodes,
    fetchSystemSettings,
    getInitialPasswordStatus,
    invalidateEmployees,
    isManager,
    loadEmployees,
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
