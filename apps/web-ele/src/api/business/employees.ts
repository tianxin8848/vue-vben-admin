import { requestClient } from '#/api/request';

export namespace EmployeeApi {
  /** 模块权限 */
  export interface ModulePermission {
    can_approve?: boolean;
    can_create?: boolean;
    can_delete?: boolean;
    can_edit?: boolean;
    can_view?: boolean;
    module_code: string;
    module_name: string;
  }

  /** 员工响应（列表 & 通用） */
  export interface EmployeeResponse {
    access_control_id: null | string;
    created_at: null | string;
    department: null | string;
    email: string;
    employee_code: null | string;
    full_name: null | string;
    hire_date: null | string;
    id: string;
    is_active: boolean;
    is_initial_password: number;
    module_permissions: ModulePermission[];
    phone: null | string;
    position: null | string;
    region: null | string;
    temporary_password: null | string;
    updated_at: null | string;
    user_id: null | number;
    username: string;
    work_start_date: null | string;
  }

  /** 当前用户基本信息响应（GET /me/basic-info） */
  export interface MyBasicInfoResponse {
    access_control_id: null | string;
    avatar_name: null | string;
    avatar_url: null | string;
    department: null | string;
    email: string;
    employee_code: null | string;
    full_name: null | string;
    hire_date: null | string;
    id: string;
    is_active: boolean;
    is_initial_password: number;
    module_permissions: ModulePermission[];
    phone: null | string;
    position: null | string;
    region: null | string;
    temporary_password: null | string;
    user_id: null | number;
    username: string;
    work_start_date: null | string;
  }

  /** 当前用户档案元数据响应（GET /me/profile-meta） */
  export interface ProfileMetaResponse {
    departments: string[];
    employee_self_editable_fields: string[];
    positions: string[];
    regions: string[];
  }

  /** 员工详细档案响应 */
  export interface EmployeeProfileResponse {
    bank_account_name: null | string;
    bank_account_number: null | string;
    bank_name: null | string;
    birth_date: null | string;
    /**
     * 中文姓名（后端等于 employee.full_name）。
     * 可编辑性由自助可编辑清单中的 `full_name` 决定，不是 `chinese_full_name`。
     */
    chinese_full_name: null | string;
    created_at: null | string;
    employee_id: string;
    emergency_contact_name: null | string;
    emergency_contact_phone: null | string;
    emergency_contact_relationship: null | string;
    english_address: null | string;
    english_name: null | string;
    gender: null | string;
    hire_date: null | string;
    hkid_number: null | string;
    marital_status: null | string;
    passport_number: null | string;
    personal_email: null | string;
    updated_at: null | string;
    work_start_date: null | string;
  }

  /** 创建员工请求参数 */
  export interface EmployeeCreate {
    department: string;
    email: string;
    employee_code?: null | string;
    full_name: string;
    is_active?: boolean;
    module_permissions?: ModulePermission[];
    phone?: null | string;
    position?: null | string;
    region?: null | string;
    /**
     * 登录名。后端已将登录账号锁定为邮箱：不传时由 email 派生，
     * 传了也会被后端归一为小写邮箱。前端创建抽屉不再收集该字段。
     */
    username?: string;
  }

  /** 更新基本信息请求参数（PATCH /me/basic-info 与 /employees/{id}/basic-info 共用） */
  export interface EmployeeBasicInfoUpdate {
    department?: null | string;
    email?: null | string;
    employee_code?: null | string;
    full_name?: null | string;
    phone?: null | string;
    position?: null | string;
    region?: null | string;
    username?: null | string;
  }

  /** 更新档案请求参数 */
  export interface EmployeeProfileUpdate {
    bank_account_name?: null | string;
    bank_account_number?: null | string;
    bank_name?: null | string;
    birth_date?: null | string;
    /** 中文姓名（2–50 字）。后端写入 employee.full_name。 */
    chinese_full_name?: null | string;
    emergency_contact_name?: null | string;
    emergency_contact_phone?: null | string;
    emergency_contact_relationship?: null | string;
    english_address?: null | string;
    english_name?: null | string;
    gender?: null | string;
    hire_date?: null | string;
    hkid_number?: null | string;
    marital_status?: null | string;
    passport_number?: null | string;
    personal_email?: null | string;
    work_start_date?: null | string;
  }

  /** 更新状态请求参数 */
  export interface EmployeeStatusUpdate {
    is_active: boolean;
  }

  /** 更新权限请求参数 */
  export interface EmployeePermissionUpdate {
    module_permissions: ModulePermission[];
  }

  /** 更新门禁ID请求参数 */
  export interface EmployeeAccessControlUpdate {
    access_control_id: string;
  }

  /** 重置密码响应 */
  export interface EmployeePasswordResetResponse {
    employee_code: null | string;
    id: string;
    is_initial_password: number;
    temporary_password: string;
    user_id: null | number;
    username: string;
  }

  /** 员工管理页筛选下拉数据（地区/部门/岗位/模块清单） */
  export interface EmployeeManageMeta {
    departments: string[];
    modules: { module_code: string; module_name: string }[];
    positions: string[];
    regions: string[];
  }
}

// ─── 员工列表 ────────────────────────────────────────────────────────────────

/** 获取员工列表 */
export async function getEmployeesApi() {
  return requestClient.get<EmployeeApi.EmployeeResponse[]>('/employees');
}

/** 获取员工管理页筛选下拉数据（地区/部门/岗位/模块清单） */
export async function getEmployeeManageMetaApi() {
  return requestClient.get<EmployeeApi.EmployeeManageMeta>(
    '/employees/manage/meta',
  );
}

/** 创建员工 */
export async function createEmployeeApi(data: EmployeeApi.EmployeeCreate) {
  return requestClient.post<EmployeeApi.EmployeeResponse>('/employees', data);
}

/** 删除员工 */
export async function deleteEmployeeApi(employeeId: string) {
  return requestClient.delete(`/employees/${employeeId}`);
}

// ─── 员工权限 / 状态 / 管理员 ────────────────────────────────────────────────

/** 更新员工权限 */
export async function updateEmployeePermissionsApi(
  employeeId: string,
  data: EmployeeApi.EmployeePermissionUpdate,
) {
  return requestClient.request<EmployeeApi.EmployeeResponse>(
    `/employees/${employeeId}/permissions`,
    { method: 'PATCH', data },
  );
}

/** 重置员工密码（后端自动生成临时密码，无请求体） */
export async function resetEmployeePasswordApi(employeeId: string) {
  return requestClient.post<EmployeeApi.EmployeePasswordResetResponse>(
    `/employees/${employeeId}/reset-password`,
  );
}

/** 更新员工状态 */
export async function updateEmployeeStatusApi(
  employeeId: string,
  data: EmployeeApi.EmployeeStatusUpdate,
) {
  return requestClient.request<EmployeeApi.EmployeeResponse>(
    `/employees/${employeeId}/status`,
    { method: 'PATCH', data },
  );
}

/** 更新员工门禁ID */
export async function updateEmployeeAccessControlApi(
  employeeId: string,
  data: EmployeeApi.EmployeeAccessControlUpdate,
) {
  return requestClient.request<EmployeeApi.EmployeeResponse>(
    `/employees/${employeeId}/access-control-id`,
    { method: 'PATCH', data },
  );
}

// ─── 门禁专用接口（走 access_control 模块权限） ────────────────────────────

/** 门禁员工列表项（精简结构） */
export interface AccessControlEmployeeItem {
  access_control_id: null | string;
  full_name: null | string;
  id: string;
  username: string;
}

/** 获取门禁员工列表（使用 /employees 端点作为后端 access-control 端点的替代） */
export async function getAccessControlEmployeesApi() {
  const employees =
    await requestClient.get<EmployeeApi.EmployeeResponse[]>('/employees');
  return employees.map((e) => ({
    id: e.id,
    username: e.username,
    full_name: e.full_name,
    access_control_id: e.access_control_id,
  }));
}

/** 更新员工门禁ID（使用旧端点 /employees/{id}/access-control-id） */
export async function updateEmployeeAccessControlV2Api(
  employeeId: string,
  data: EmployeeApi.EmployeeAccessControlUpdate,
) {
  return requestClient.request<EmployeeApi.EmployeeResponse>(
    `/employees/${employeeId}/access-control-id`,
    { method: 'PATCH', data },
  );
}

// ─── 基本信息 ────────────────────────────────────────────────────────────────

/** 获取我的基本信息（含模块权限与头像） */
export async function getMyBasicInfoApi() {
  return requestClient.get<EmployeeApi.MyBasicInfoResponse>('/me/basic-info');
}

/** 获取我的档案元数据（下拉选项 + 自助可编辑字段清单） */
export async function getMyProfileMetaApi() {
  return requestClient.get<EmployeeApi.ProfileMetaResponse>('/me/profile-meta');
}

/** 更新我的头像（multipart/form-data） */
export async function updateMyAvatarApi(file: File) {
  const formData = new FormData();
  formData.append('avatar', file);
  return requestClient.request<EmployeeApi.MyBasicInfoResponse>('/me/avatar', {
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' },
    method: 'PATCH',
  });
}

/** 更新我的基本信息 */
export async function updateMyBasicInfoApi(
  data: EmployeeApi.EmployeeBasicInfoUpdate,
) {
  return requestClient.request<EmployeeApi.EmployeeResponse>('/me/basic-info', {
    method: 'PATCH',
    data,
  });
}

/** 更新员工基本信息 */
export async function updateEmployeeBasicInfoApi(
  employeeId: string,
  data: EmployeeApi.EmployeeBasicInfoUpdate,
) {
  return requestClient.request<EmployeeApi.EmployeeResponse>(
    `/employees/${employeeId}/basic-info`,
    { method: 'PATCH', data },
  );
}

// ─── 详细档案 ────────────────────────────────────────────────────────────────

/** 获取我的详细档案 */
export async function getMyProfileApi() {
  return requestClient.get<EmployeeApi.EmployeeProfileResponse>('/me/profile');
}

/** 更新我的详细档案 */
export async function updateMyProfileApi(
  data: Partial<EmployeeApi.EmployeeProfileUpdate>,
) {
  return requestClient.request<EmployeeApi.EmployeeProfileResponse>(
    '/me/profile',
    { method: 'PATCH', data },
  );
}

/** 获取员工详细档案 */
export async function getEmployeeProfileApi(employeeId: string) {
  return requestClient.get<EmployeeApi.EmployeeProfileResponse>(
    `/employees/${employeeId}/profile`,
  );
}

/** 更新员工详细档案 */
export async function updateEmployeeProfileApi(
  employeeId: string,
  data: Partial<EmployeeApi.EmployeeProfileUpdate>,
) {
  return requestClient.request<EmployeeApi.EmployeeProfileResponse>(
    `/employees/${employeeId}/profile`,
    { method: 'PATCH', data },
  );
}
