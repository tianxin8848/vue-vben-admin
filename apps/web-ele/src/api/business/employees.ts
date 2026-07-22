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
    created_at: null | string;
    department: null | string;
    email: string;
    employee_code: null | string;
    full_name: null | string;
    hire_date: null | string;
    id: string;
    is_active: boolean;
    is_admin: boolean;
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

  /** 员工详细档案响应 */
  export interface EmployeeProfileResponse {
    address: null | string;
    birth_date: null | string;
    created_at: null | string;
    emergency_contact_name: null | string;
    emergency_contact_phone: null | string;
    employee_id: string;
    hire_date: null | string;
    id_number: null | string;
    updated_at: null | string;
    work_start_date: null | string;
  }

  /** 创建员工请求参数 */
  export interface EmployeeCreate {
    department: string;
    email: string;
    full_name: string;
    is_active?: boolean;
    is_admin?: boolean;
    module_permissions?: ModulePermission[];
    phone?: null | string;
    position?: null | string;
    region?: null | string;
    username: string;
  }

  /** 更新基本信息请求参数 */
  export interface EmployeeBasicInfoUpdate {
    department?: null | string;
    position?: null | string;
    region?: null | string;
  }

  /** 更新档案请求参数 */
  export interface EmployeeProfileUpdate {
    address?: null | string;
    birth_date?: null | string;
    emergency_contact_name?: null | string;
    emergency_contact_phone?: null | string;
    hire_date?: null | string;
    id_number?: null | string;
    work_start_date?: null | string;
  }

  /** 更新状态请求参数 */
  export interface EmployeeStatusUpdate {
    is_active: boolean;
  }

  /** 更新管理员请求参数 */
  export interface EmployeeAdminUpdate {
    is_admin: boolean;
  }

  /** 更新权限请求参数 */
  export interface EmployeePermissionUpdate {
    module_permissions: ModulePermission[];
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
}

// ─── 员工列表 ────────────────────────────────────────────────────────────────

/** 获取员工列表 */
export async function getEmployeesApi() {
  return requestClient.get<EmployeeApi.EmployeeResponse[]>('/employees');
}

/** 创建员工 */
export async function createEmployeeApi(data: EmployeeApi.EmployeeCreate) {
  return requestClient.post<EmployeeApi.EmployeeResponse>('/employees', data);
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

/** 更新员工管理员状态 */
export async function updateEmployeeAdminApi(
  employeeId: string,
  data: EmployeeApi.EmployeeAdminUpdate,
) {
  return requestClient.request<EmployeeApi.EmployeeResponse>(
    `/employees/${employeeId}/admin`,
    { method: 'PATCH', data },
  );
}

// ─── 基本信息 ────────────────────────────────────────────────────────────────

/** 更新我的基本信息 */
export async function updateMyBasicInfoApi(
  data: EmployeeApi.EmployeeBasicInfoUpdate,
) {
  return requestClient.request<EmployeeApi.EmployeeResponse>(
    '/employees/me/basic-info',
    { method: 'PATCH', data },
  );
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
  return requestClient.get<EmployeeApi.EmployeeProfileResponse>(
    '/employees/me/profile',
  );
}

/** 更新我的详细档案 */
export async function updateMyProfileApi(
  data: Partial<EmployeeApi.EmployeeProfileUpdate>,
) {
  return requestClient.request<EmployeeApi.EmployeeProfileResponse>(
    '/employees/me/profile',
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

