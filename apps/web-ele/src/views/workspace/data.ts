import type { VbenFormSchema } from '#/adapter/form';
import type { EmployeeApi } from '#/api';

type TFunc = (key: string, named?: Record<string, any>) => string;

export type ProfileTab = 'basic' | 'permissions' | 'profile';

type SelectOption = { label: string; value: string };

const toOptions = (arr?: null | string[]): SelectOption[] =>
  (arr || []).map((v) => ({ label: v, value: v }));

/** 头部 tabs 配置（i18n 切换时通过 computed 重新求值） */
export function buildProfileTabs(
  t: TFunc,
): { label: string; value: ProfileTab }[] {
  return [
    { label: t('page.workspace.profilePage.tabBasic'), value: 'basic' },
    { label: t('page.workspace.profilePage.tabProfile'), value: 'profile' },
    {
      label: t('page.workspace.profilePage.tabPermissions'),
      value: 'permissions',
    },
  ];
}

/** 根据后端返回的自助可编辑字段清单判断是否可编辑 */
export function isFieldEditable(
  meta: EmployeeApi.ProfileMetaResponse | null | undefined,
  field: string,
): boolean {
  const fields = meta?.employee_self_editable_fields;
  if (!fields) return false;
  return fields.includes(field);
}

/** 基本信息表单 schema（保存走 PATCH /me/basic-info） */
export function buildBasicSchema(
  t: TFunc,
  meta: EmployeeApi.ProfileMetaResponse | null,
): VbenFormSchema[] {
  const editable = (field: string) => isFieldEditable(meta, field);
  return [
    {
      component: 'Input',
      componentProps: { disabled: !editable('username') },
      fieldName: 'username',
      label: t('page.workspace.profilePage.account'),
    },
    {
      component: 'Input',
      componentProps: { disabled: !editable('full_name') },
      fieldName: 'full_name',
      label: t('page.workspace.profilePage.fullName'),
    },
    {
      component: 'Input',
      componentProps: {
        disabled: !editable('chinese_name'),
        maxlength: 50,
      },
      fieldName: 'chinese_name',
      label: t('page.workspace.profilePage.chineseName'),
    },
    {
      component: 'Input',
      componentProps: { disabled: !editable('email') },
      fieldName: 'email',
      label: t('page.workspace.profilePage.email'),
    },
    {
      component: 'Input',
      componentProps: { disabled: !editable('phone') },
      fieldName: 'phone',
      label: t('page.workspace.profilePage.phone'),
    },
    {
      component: 'Select',
      componentProps: {
        clearable: true,
        disabled: !editable('department'),
        options: toOptions(meta?.departments),
        placeholder: t('page.workspace.profilePage.departmentPlaceholder'),
      },
      fieldName: 'department',
      label: t('page.workspace.profilePage.department'),
    },
    {
      component: 'Select',
      componentProps: {
        clearable: true,
        disabled: !editable('position'),
        options: toOptions(meta?.positions),
        placeholder: t('page.workspace.profilePage.positionPlaceholder'),
      },
      fieldName: 'position',
      label: t('page.workspace.profilePage.position'),
    },
    {
      component: 'Select',
      componentProps: {
        clearable: true,
        disabled: !editable('region'),
        options: toOptions(meta?.regions),
        placeholder: t('page.workspace.profilePage.regionPlaceholder'),
      },
      fieldName: 'region',
      label: t('page.workspace.profilePage.region'),
    },
  ];
}

/** 详细档案表单 schema（保存走 PATCH /me/profile） */
export function buildProfileSchema(
  t: TFunc,
  meta: EmployeeApi.ProfileMetaResponse | null,
): VbenFormSchema[] {
  const editable = (field: string) => isFieldEditable(meta, field);
  return [
    {
      component: 'Input',
      componentProps: { disabled: !editable('english_name') },
      fieldName: 'english_name',
      label: t('page.workspace.profilePage.englishName'),
    },
    {
      component: 'Select',
      componentProps: {
        clearable: true,
        disabled: !editable('gender'),
        options: [
          { label: t('page.workspace.profilePage.male'), value: '男' },
          { label: t('page.workspace.profilePage.female'), value: '女' },
        ],
        placeholder: t('page.workspace.profilePage.genderPlaceholder'),
      },
      fieldName: 'gender',
      label: t('page.workspace.profilePage.gender'),
    },
    {
      component: 'DatePicker',
      componentProps: {
        disabled: !editable('birth_date'),
        // 显示与手打解析均为 DD-MM-YYYY（如 21-09-2026），回传后端仍是 ISO
        editable: true,
        format: 'DD-MM-YYYY',
        placeholder: t('page.workspace.profilePage.datePlaceholder'),
        type: 'date',
        valueFormat: 'YYYY-MM-DD',
      },
      fieldName: 'birth_date',
      label: t('page.workspace.profilePage.birthDate'),
    },
    {
      component: 'Select',
      componentProps: {
        clearable: true,
        disabled: !editable('marital_status'),
        options: [
          { label: t('page.workspace.profilePage.single'), value: '未婚' },
          { label: t('page.workspace.profilePage.married'), value: '已婚' },
          { label: t('page.workspace.profilePage.divorced'), value: '离异' },
          { label: t('page.workspace.profilePage.widowed'), value: '丧偶' },
        ],
        placeholder: t('page.workspace.profilePage.maritalPlaceholder'),
      },
      fieldName: 'marital_status',
      label: t('page.workspace.profilePage.maritalStatus'),
    },
    {
      component: 'Input',
      componentProps: { disabled: !editable('national_id') },
      fieldName: 'national_id',
      label: t('page.workspace.profilePage.nationalId'),
    },
    {
      component: 'Input',
      componentProps: { disabled: !editable('passport_number') },
      fieldName: 'passport_number',
      label: t('page.workspace.profilePage.passportNumber'),
    },
    {
      component: 'Input',
      componentProps: { disabled: !editable('personal_email') },
      fieldName: 'personal_email',
      label: t('page.workspace.profilePage.personalEmail'),
    },
    {
      component: 'Input',
      componentProps: { disabled: !editable('english_address') },
      fieldName: 'english_address',
      label: t('page.workspace.profilePage.englishAddress'),
    },
    {
      component: 'DatePicker',
      componentProps: {
        disabled: !editable('hire_date'),
        editable: true,
        format: 'DD-MM-YYYY',
        placeholder: t('page.workspace.profilePage.datePlaceholder'),
        type: 'date',
        valueFormat: 'YYYY-MM-DD',
      },
      fieldName: 'hire_date',
      label: t('page.workspace.profilePage.hireDate'),
    },
    {
      component: 'DatePicker',
      componentProps: {
        disabled: !editable('work_start_date'),
        editable: true,
        format: 'DD-MM-YYYY',
        placeholder: t('page.workspace.profilePage.datePlaceholder'),
        type: 'date',
        valueFormat: 'YYYY-MM-DD',
      },
      fieldName: 'work_start_date',
      label: t('page.workspace.profilePage.workStartDate'),
    },
    {
      component: 'Input',
      componentProps: { disabled: !editable('emergency_contact_name') },
      fieldName: 'emergency_contact_name',
      label: t('page.workspace.profilePage.emergencyContact'),
    },
    {
      component: 'Input',
      componentProps: { disabled: !editable('emergency_contact_phone') },
      fieldName: 'emergency_contact_phone',
      label: t('page.workspace.profilePage.emergencyContactPhone'),
    },
    {
      component: 'Input',
      componentProps: {
        disabled: !editable('emergency_contact_relationship'),
      },
      fieldName: 'emergency_contact_relationship',
      label: t('page.workspace.profilePage.emergencyContactRelationship'),
    },
    {
      component: 'Input',
      componentProps: { disabled: !editable('bank_name') },
      fieldName: 'bank_name',
      label: t('page.workspace.profilePage.bankName'),
    },
    {
      component: 'Input',
      componentProps: { disabled: !editable('bank_account_name') },
      fieldName: 'bank_account_name',
      label: t('page.workspace.profilePage.bankAccountName'),
    },
    {
      component: 'Input',
      componentProps: { disabled: !editable('bank_account_number') },
      fieldName: 'bank_account_number',
      label: t('page.workspace.profilePage.bankAccountNumber'),
    },
  ];
}

/** 构建 /me/basic-info 表单初值 */
export function buildBasicValues(
  basicRes: EmployeeApi.MyBasicInfoResponse,
): Record<string, any> {
  return {
    chinese_name: basicRes.chinese_name || '',
    department: basicRes.department || '',
    email: basicRes.email,
    full_name: basicRes.full_name || '',
    phone: basicRes.phone || '',
    position: basicRes.position || '',
    region: basicRes.region || '',
    username: basicRes.username,
  };
}

/** 构建 /me/profile 表单初值 */
export function buildProfileValues(
  profileRes: EmployeeApi.EmployeeProfileResponse,
): Record<string, any> {
  return {
    bank_account_name: profileRes.bank_account_name || '',
    bank_account_number: profileRes.bank_account_number || '',
    bank_name: profileRes.bank_name || '',
    birth_date: profileRes.birth_date || '',
    emergency_contact_name: profileRes.emergency_contact_name || '',
    emergency_contact_phone: profileRes.emergency_contact_phone || '',
    emergency_contact_relationship:
      profileRes.emergency_contact_relationship || '',
    english_address: profileRes.english_address || '',
    english_name: profileRes.english_name || '',
    gender: profileRes.gender || '',
    hire_date: profileRes.hire_date || '',
    marital_status: profileRes.marital_status || '',
    // 规范字段是 national_id；hkid_number 后端已弃用（仅镜像回显）
    national_id: profileRes.national_id || profileRes.hkid_number || '',
    passport_number: profileRes.passport_number || '',
    personal_email: profileRes.personal_email || '',
    work_start_date: profileRes.work_start_date || '',
  };
}

/**
 * 自助可提交的 `/me/basic-info` 字段。
 *
 * 后端 `update_my_basic_info` 会把自助清单（`employee_self_editable_fields`）
 * 作为 `allowed_fields` 逐个校验：**payload 里出现清单外的 key 一律 400**，
 * 哪怕值是 null。所以这里必须按清单过滤，不能整表提交。
 */
const BASIC_UPDATE_FIELDS = [
  'username',
  'email',
  'full_name',
  'chinese_name',
  'phone',
  'department',
  'position',
  'region',
  'employee_code',
] as const;

/**
 * 自助可提交的 `/me/profile` 字段（文本类）。
 *
 * 后端 `update_profile_fields` 有两道闸：
 * ① 命中 `HR_ONLY_SELF_EDIT_FIELDS`（工号/组织/任职日期/证件/护照/银行）直接 403；
 * ② 不在自助清单内则 400。
 * 所以证件、任职日期、银行等一律不进 payload。
 */
const PROFILE_UPDATE_FIELDS = [
  'english_name',
  'personal_email',
  'gender',
  'marital_status',
  'birth_date',
  'english_address',
  'emergency_contact_name',
  'emergency_contact_phone',
  'emergency_contact_relationship',
] as const;

/** 构建 PATCH /me/basic-info 请求 payload（仅提交自助清单内的字段） */
export function buildBasicUpdatePayload(
  values: Record<string, any>,
  meta?: EmployeeApi.ProfileMetaResponse | null,
): EmployeeApi.EmployeeBasicInfoUpdate {
  const payload: EmployeeApi.EmployeeBasicInfoUpdate = {};
  for (const code of BASIC_UPDATE_FIELDS) {
    if (!isFieldEditable(meta, code)) {
      continue;
    }
    payload[code] = values[code] || null;
  }
  return payload;
}

/** 构建 PATCH /me/profile 请求 payload（仅提交自助清单内的字段） */
export function buildProfileUpdatePayload(
  values: Record<string, any>,
  meta?: EmployeeApi.ProfileMetaResponse | null,
): Partial<EmployeeApi.EmployeeProfileUpdate> {
  const payload: Partial<EmployeeApi.EmployeeProfileUpdate> = {};
  for (const code of PROFILE_UPDATE_FIELDS) {
    if (!isFieldEditable(meta, code)) {
      continue;
    }
    payload[code] = values[code] || null;
  }
  return payload;
}
