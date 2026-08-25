import { requestClient } from '#/api/request';

export namespace SystemSettingsApi {
  /** 系统模块 */
  export interface SystemModuleItem {
    module_code: string;
    module_name: string;
  }

  /** 区域假日项 */
  export interface RegionalHolidayItem {
    date: string;
    holiday_name: string;
    region: string;
  }

  /** 区域假日目录项 */
  export interface RegionalHolidayCatalogItem {
    holiday_names: string[];
    region: string;
  }

  /** 报销理由项 */
  export interface ClaimReasonItem {
    name: string;
  }

  /** 币种项 */
  export interface ClaimCurrencyItem {
    currency_code: string;
    to_hkd_rate: number;
  }

  /** 员工档案字段目录项 */
  export interface EmployeeEditableFieldItem {
    code: string;
    group: string;
    label: string;
  }

  /** 系统设置响应 */
  export interface SystemSettingsResponse {
    claim_currencies: ClaimCurrencyItem[];
    claim_reasons: ClaimReasonItem[];
    created_at: null | string;
    departments: string[];
    employee_profile_field_catalog: EmployeeEditableFieldItem[];
    employee_self_editable_fields: string[];
    employee_self_editable_fields_initialized: boolean;
    id: string;
    modules: SystemModuleItem[];
    positions: string[];
    regional_holiday_catalogs: RegionalHolidayCatalogItem[];
    regional_holidays: RegionalHolidayItem[];
    regions: string[];
    updated_at: null | string;
  }

  /** 更新系统设置请求参数 */
  export interface SystemSettingsUpdate {
    claim_currencies?: ClaimCurrencyItem[];
    claim_reasons?: ClaimReasonItem[];
    departments?: string[];
    employee_self_editable_fields?: string[];
    modules?: SystemModuleItem[];
    positions?: string[];
    regional_holiday_catalogs?: RegionalHolidayCatalogItem[];
    regional_holidays?: RegionalHolidayItem[];
    regions?: string[];
  }

  /** 新增/更新区域假日请求参数 */
  export interface RegionalHolidayUpsert {
    date: string;
    holiday_name: string;
    region: string;
  }

  /** 删除区域假日请求参数 */
  export interface RegionalHolidayDelete {
    date: string;
    region: string;
  }

  /** 批量新增/更新区域假日请求参数 */
  export interface RegionalHolidayRangeUpsert {
    end_date?: null | string;
    holiday_name: string;
    region: string;
    start_date: string;
  }

  /** 批量删除区域假日请求参数 */
  export interface RegionalHolidayRangeDelete {
    end_date?: null | string;
    region: string;
    start_date: string;
  }
}

/**
 * 全量模块目录（前端固定维护）
 *
 * 保证系统参数管理页面的模块列表始终展示所有可选模块，勾选状态仅控制是否启用，
 * 不会因为取消勾选并保存而导致行从界面中消失。
 * module_code 与 router/module-permission-map.ts 中的定义保持一致。
 */
export const ALL_MODULE_CATALOG: SystemSettingsApi.SystemModuleItem[] = [
  { module_code: 'user_management', module_name: '用户管理' },
  { module_code: 'leave_calendar', module_name: '请假管理' },
  { module_code: 'leave_workflows', module_name: '请假流程' },
  { module_code: 'approval_management', module_name: '审批管理' },
  { module_code: 'system_settings', module_name: '系统设置' },
  { module_code: 'data_migration', module_name: '数据处理维护' },
  { module_code: 'access_control', module_name: '门禁管理' },
  { module_code: 'employee_leave', module_name: '请假申请' },
  { module_code: 'claim_management', module_name: '报销管理' },
];

// ─── 系统设置 ────────────────────────────────────────────────────────────────

/** 获取系统设置 */
export async function getSystemSettingsApi() {
  return requestClient.get<SystemSettingsApi.SystemSettingsResponse>(
    '/system-settings',
  );
}

/** 更新系统设置 */
export async function updateSystemSettingsApi(
  data: SystemSettingsApi.SystemSettingsUpdate,
) {
  return requestClient.put<SystemSettingsApi.SystemSettingsResponse>(
    '/system-settings',
    data,
  );
}

// ─── 区域假日 ────────────────────────────────────────────────────────────────

/** 新增/更新单个区域假日 */
export async function upsertRegionalHolidayApi(
  data: SystemSettingsApi.RegionalHolidayUpsert,
) {
  return requestClient.put<SystemSettingsApi.SystemSettingsResponse>(
    '/system-settings/regional-holidays',
    data,
  );
}

/** 删除单个区域假日 */
export async function deleteRegionalHolidayApi(
  data: SystemSettingsApi.RegionalHolidayDelete,
) {
  return requestClient.delete<SystemSettingsApi.SystemSettingsResponse>(
    '/system-settings/regional-holidays',
    { data },
  );
}

/** 批量新增/更新区域假日 */
export async function upsertRegionalHolidayRangeApi(
  data: SystemSettingsApi.RegionalHolidayRangeUpsert,
) {
  return requestClient.put<SystemSettingsApi.SystemSettingsResponse>(
    '/system-settings/regional-holidays/range',
    data,
  );
}

/** 批量删除区域假日 */
export async function deleteRegionalHolidayRangeApi(
  data: SystemSettingsApi.RegionalHolidayRangeDelete,
) {
  return requestClient.delete<SystemSettingsApi.SystemSettingsResponse>(
    '/system-settings/regional-holidays/range',
    { data },
  );
}
