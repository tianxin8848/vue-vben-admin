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

  /**
   * 权限角色（创建员工 / 改权限时的快捷模板）。
   *
   * 角色与模块的对应关系由后端下发（`module_codes` 已按当前系统模块清单过滤），
   * 前端不要硬编码，避免两边清单漂移。
   */
  export interface PermissionRoleOption {
    /** `employee`（普通员工）| `administrator`（管理员） */
    code: string;
    /** 后端中文标签，仅作为 i18n 缺失时的兜底 */
    label: string;
    module_codes: string[];
  }

  /** 权限角色 code，对齐后端 `Literal["employee", "administrator"]` */
  export type PermissionRole = 'administrator' | 'employee';

  /**
   * 用工类型。对齐后端 `app/core/employment.py::EmploymentType`，
   * 未填写时后端按 `full_time` 归一；只有 `full_time` 可申请年假，
   * `full_time` / `probation` 计入年假额度。
   */
  export type EmploymentType =
    | 'full_time'
    | 'intern'
    | 'part_time'
    | 'probation';

  /**
   * 证件类型。后端 `app/core/national_id.py` 的应用层枚举，
   * 写成 `Annotated[Literal[...], BeforeValidator]`：服务端额外接受
   * `HKID` / `PRC ID` 等别名，传其它值一律 422。
   */
  export type IdKind = 'hkid' | 'prc_id';

  /** 员工响应（列表 & 通用） */
  export interface EmployeeResponse {
    access_control_id: null | string;
    avatar_id: null | string;
    avatar_name: null | string;
    avatar_url: null | string;
    /** 中文姓名（可选，非中文员工为空） */
    chinese_name: null | string;
    created_at: null | string;
    department: null | string;
    email: string;
    employee_code: null | string;
    /** 用工类型；后端未存值时归一为 `full_time` */
    employment_type: EmploymentType;
    full_name: null | string;
    hire_date: null | string;
    id: string;
    is_active: boolean;
    is_initial_password: number;
    /** 直属上司的**员工 ID**（非姓名）；创建/更新时后端会校验该用户存在且非内置 admin */
    line_manager_id: null | string;
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
    /** 中文姓名（可选，非中文员工为空） */
    chinese_name: null | string;
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
    /** GET 永远返回掩码（含 `*`），完整账号需走 bank-reveal 端点 */
    bank_account_number: null | string;
    bank_name: null | string;
    birth_date: null | string;
    /** 当前登录者是否可以写入/查看完整银行账号（本人或有 bank_data 模块权限） */
    can_reveal_bank_account: boolean;
    created_at: null | string;
    emergency_contact_name: null | string;
    emergency_contact_phone: null | string;
    emergency_contact_relationship: null | string;
    employee_id: string;
    english_address: null | string;
    english_name: null | string;
    gender: null | string;
    hire_date: null | string;
    /**
     * @deprecated 后端已弃用，读写都请用 `national_id`（服务端仍会把两者互为镜像返回）。
     */
    hkid_number: null | string;
    /** 证件类型：`hkid`（香港身份证）/ `prc_id`（内地居民身份证） */
    id_kind: IdKind | null;
    last_employment_date: null | string;
    /** 已填写即为「已离职」，PATCH 时不可清空，须走復職通道 */
    last_working_date: null | string;
    marital_status: null | string;
    /** 证件号码（规范字段）；后端会把 `hkid_number` 与本字段互为镜像 */
    national_id: null | string;
    passport_number: null | string;
    personal_email: null | string;
    updated_at: null | string;
    work_start_date: null | string;
  }

  /** 创建员工请求参数 */
  export interface EmployeeCreate {
    /** 中文姓名（≤50 字，可选；后端对非中文员工允许留空） */
    chinese_name?: null | string;
    department: string;
    email: string;
    employee_code?: null | string;
    /** 用工类型；不传按 `full_time` 处理 */
    employment_type?: EmploymentType | null;
    full_name: string;
    is_active?: boolean;
    /** 直属上司的员工 ID；不能是自己，也不能是内置 admin */
    line_manager_id?: null | string;
    module_permissions?: ModulePermission[];
    phone?: null | string;
    position?: null | string;
    region?: null | string;
    /**
     * 权限角色快捷模板。传了就按角色的模块清单开通（忽略 module_permissions）；
     * 不传且 module_permissions 也为空时，后端默认按 `employee` 角色开通。
     */
    permission_role?: null | PermissionRole;
    /**
     * 登录名。后端已将登录账号锁定为邮箱：不传时由 email 派生，
     * 传了也会被后端归一为小写邮箱。前端创建抽屉不再收集该字段。
     */
    username?: string;
  }

  /** 更新基本信息请求参数（PATCH /me/basic-info 与 /employees/{id}/basic-info 共用） */
  export interface EmployeeBasicInfoUpdate {
    /**
     * 中文姓名（≤50 字）。传空串即清空。
     *
     * 与 `full_name`（姓名/法定姓名）是两个字段：外籍员工可只填 `full_name`。
     * 自助修改走 `/me/basic-info` 时受 `employee_self_editable_fields` 门控，
     * 该 code 默认**未开通**，未开通还提交会 400。
     */
    chinese_name?: null | string;
    department?: null | string;
    email?: null | string;
    employee_code?: null | string;
    /**
     * 用工类型。与 `line_manager_id` 一样属于 **HR 专属字段**：
     * 出现在 `HR_ONLY_SELF_EDIT_FIELDS` 里，自助 `/me/basic-info` 提交会被 403。
     */
    employment_type?: EmploymentType | null;
    full_name?: null | string;
    /** 直属上司的员工 ID（非姓名）；不能是自己或内置 admin */
    line_manager_id?: null | string;
    phone?: null | string;
    position?: null | string;
    region?: null | string;
    username?: null | string;
  }

  /** 更新档案请求参数 */
  export interface EmployeeProfileUpdate {
    bank_account_name?: null | string;
    /** 含 `*` 的掩码值会被后端忽略（不会覆盖真实账号） */
    bank_account_number?: null | string;
    bank_name?: null | string;
    birth_date?: null | string;
    emergency_contact_name?: null | string;
    emergency_contact_phone?: null | string;
    emergency_contact_relationship?: null | string;
    english_address?: null | string;
    english_name?: null | string;
    gender?: null | string;
    hire_date?: null | string;
    /**
     * @deprecated 后端已弃用（仍接受并原样回显）。请改传 `national_id`。
     */
    hkid_number?: null | string;
    /** `hkid` | `prc_id`；与 national_id 一起决定证件号码的校验规则，传别的值 422 */
    id_kind?: IdKind | null;
    last_employment_date?: null | string;
    /** 填写即自动停用该员工账号；已填写时不可通过本接口清空 */
    last_working_date?: null | string;
    marital_status?: null | string;
    /** 证件号码（规范字段）。已设 `id_kind` 时后端会做 HKID / GB 11643 校验位校验 */
    national_id?: null | string;
    passport_number?: null | string;
    personal_email?: null | string;
    work_start_date?: null | string;
  }

  /** 员工银行账号明文响应（POST /employees/{id}/profile/bank-reveal） */
  export interface EmployeeBankRevealResponse {
    bank_account_name: null | string;
    bank_account_number: null | string;
    bank_name: null | string;
  }

  /** 更新状态请求参数 */
  export interface EmployeeStatusUpdate {
    is_active: boolean;
  }

  /** 更新模块权限请求参数（PATCH /employees/{id}/permissions） */
  export interface EmployeePermissionUpdate {
    /**
     * 权限角色快捷模板。**传了以后端角色清单为准，module_permissions 会被忽略**；
     * 只做「按角色一键开通」时才传，逐项勾选请只传 module_permissions。
     */
    permission_role?: null | PermissionRole;
    /**
     * 完整覆盖该员工的模块权限（后端不做增量合并）。
     * 传空数组 = 撤销全部模块权限。
     */
    module_permissions?: ModulePermission[];
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

  /** 员工管理页筛选下拉数据（地区/部门/岗位/模块清单/权限角色/用工类型） */
  export interface EmployeeManageMeta {
    departments: string[];
    /** 可选用工类型 code 清单（后端 `EMPLOYMENT_TYPES`），展示名由前端 i18n 映射 */
    employment_types: string[];
    modules: { module_code: string; module_name: string }[];
    /** 权限角色模板目录：创建员工时按角色一键开通模块 */
    permission_roles: PermissionRoleOption[];
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

/**
 * 更新员工模块权限。
 *
 * 需要 `user_management`（HR 侧）。全量覆盖语义：请求体里的 module_permissions
 * 会替换该员工现有权限，未勾选的模块将被移除。
 */
export async function updateEmployeePermissionsApi(
  employeeId: string,
  data: EmployeeApi.EmployeePermissionUpdate,
) {
  return requestClient.request<EmployeeApi.EmployeeResponse>(
    `/employees/${employeeId}/permissions`,
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

/** 获取员工基本信息（比拉全量 /employees 再 find 更轻） */
export async function getEmployeeBasicInfoApi(employeeId: string) {
  return requestClient.get<EmployeeApi.EmployeeResponse>(
    `/employees/${employeeId}/basic-info`,
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

// ─── 头像 ────────────────────────────────────────────────────────────────────

/**
 * 更新指定员工的头像（multipart/form-data，字段名 `avatar`）。
 *
 * 需要 `user_management`，即 HR 侧专用；自助修改走 `PATCH /me/avatar`。
 * 后端会校验扩展名（JPG/PNG/WEBP/HEIC）与大小（≤5MB），HEIC 会转成 JPEG 存储。
 */
export async function updateEmployeeAvatarApi(employeeId: string, file: File) {
  const formData = new FormData();
  formData.append('avatar', file);
  return requestClient.request<EmployeeApi.EmployeeResponse>(
    `/employees/${employeeId}/avatar`,
    {
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
      method: 'PATCH',
    },
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

/**
 * 获取指定员工的档案元数据（部门/岗位/地区下拉）。
 *
 * 需要 user_management —— 比 /system-settings（需要 system_settings 模块）更贴合
 * 员工档案页的权限边界，HR 没有 system_settings 也能拿到下拉选项。
 */
export async function getEmployeeProfileMetaApi(employeeId: string) {
  return requestClient.get<EmployeeApi.ProfileMetaResponse>(
    `/employees/${employeeId}/profile-meta`,
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

/**
 * 查看员工银行账号明文（会写 bank_data 审计日志）。
 *
 * 需要本人或有 `bank_data` 模块权限，否则 403。
 */
export async function revealEmployeeBankApi(employeeId: string) {
  return requestClient.post<EmployeeApi.EmployeeBankRevealResponse>(
    `/employees/${employeeId}/profile/bank-reveal`,
  );
}
