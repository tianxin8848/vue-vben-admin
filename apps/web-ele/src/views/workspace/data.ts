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
      componentProps: {
        // 后端按自助清单里的 `full_name` 判定中文姓名可否编辑（不是 chinese_full_name）
        disabled: !editable('full_name'),
        maxlength: 50,
      },
      fieldName: 'chinese_full_name',
      label: t('page.workspace.profilePage.chineseFullName'),
      // 后端要求非空；不可编辑时不参与校验
      rules: editable('full_name') ? 'required' : null,
    },
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
      componentProps: { disabled: !editable('hkid_number') },
      fieldName: 'hkid_number',
      label: t('page.workspace.profilePage.hkidNumber'),
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
    chinese_full_name: profileRes.chinese_full_name || '',
    emergency_contact_name: profileRes.emergency_contact_name || '',
    emergency_contact_phone: profileRes.emergency_contact_phone || '',
    emergency_contact_relationship:
      profileRes.emergency_contact_relationship || '',
    english_address: profileRes.english_address || '',
    english_name: profileRes.english_name || '',
    gender: profileRes.gender || '',
    hire_date: profileRes.hire_date || '',
    hkid_number: profileRes.hkid_number || '',
    marital_status: profileRes.marital_status || '',
    passport_number: profileRes.passport_number || '',
    personal_email: profileRes.personal_email || '',
    work_start_date: profileRes.work_start_date || '',
  };
}

/** 构建 PATCH /me/basic-info 请求 payload（空串转 null） */
export function buildBasicUpdatePayload(
  values: Record<string, any>,
): EmployeeApi.EmployeeBasicInfoUpdate {
  return {
    department: values.department || null,
    email: values.email || null,
    full_name: values.full_name || null,
    phone: values.phone || null,
    position: values.position || null,
    region: values.region || null,
    username: values.username || null,
  };
}

/**
 * 构建 PATCH /me/profile 请求 payload（空串转 null）。
 *
 * 中文姓名（chinese_full_name）只在后端允许自助编辑时才提交：
 * 后端按自助清单里的 `full_name` 判定，若不在清单内还提交该字段会直接 400。
 */
export function buildProfileUpdatePayload(
  values: Record<string, any>,
  meta?: EmployeeApi.ProfileMetaResponse | null,
): Partial<EmployeeApi.EmployeeProfileUpdate> {
  const payload: Partial<EmployeeApi.EmployeeProfileUpdate> = {
    bank_account_name: values.bank_account_name || null,
    bank_account_number: values.bank_account_number || null,
    bank_name: values.bank_name || null,
    birth_date: values.birth_date || null,
    emergency_contact_name: values.emergency_contact_name || null,
    emergency_contact_phone: values.emergency_contact_phone || null,
    emergency_contact_relationship:
      values.emergency_contact_relationship || null,
    english_address: values.english_address || null,
    english_name: values.english_name || null,
    gender: values.gender || null,
    hire_date: values.hire_date || null,
    hkid_number: values.hkid_number || null,
    marital_status: values.marital_status || null,
    passport_number: values.passport_number || null,
    personal_email: values.personal_email || null,
    work_start_date: values.work_start_date || null,
  };
  if (isFieldEditable(meta, 'full_name')) {
    payload.chinese_full_name = values.chinese_full_name || null;
  }
  return payload;
}
