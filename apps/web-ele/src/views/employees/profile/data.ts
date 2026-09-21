import type { EmployeeApi } from '#/api';

type TFunc = (key: string, named?: Record<string, any>) => string;

export interface SelectOption {
  label: string;
  value: string;
}

/** 证件类型：香港身份证 / 内地居民身份证（与后端 app/core/national_id.py 一致） */
export type IdKind = 'hkid' | 'prc_id';

/**
 * 基础信息表单状态（PATCH /employees/{id}/basic-info）。
 *
 * 字段类型统一放宽到 `null | string`：element-plus 的 Input/Select 在 clearable
 * 清空时给的是 `null`（Select 也可能是 `undefined`），写成 `string` 只会在模板里
 * 换来一堆无意义的类型断言。
 */
export interface BasicInfoForm {
  department: null | string;
  email: null | string;
  employee_code: null | string;
  full_name: null | string;
  phone: null | string;
  position: null | string;
  region: null | string;
  username: null | string;
}

/** 档案表单状态（证件/任职/紧急联系人/银行，全部走同一端点） */
export interface ProfileForm {
  bank_account_name: null | string;
  bank_account_number: null | string;
  bank_name: null | string;
  birth_date: null | string;
  emergency_contact_name: null | string;
  emergency_contact_phone: null | string;
  emergency_contact_relationship: null | string;
  english_address: null | string;
  english_name: null | string;
  gender: null | string;
  hire_date: null | string;
  hkid_number: null | string;
  id_kind: IdKind | null;
  last_employment_date: null | string;
  last_working_date: null | string;
  marital_status: null | string;
  passport_number: null | string;
  personal_email: null | string;
  work_start_date: null | string;
}

/**
 * 表单字段配置。
 *
 * `label` / `placeholder` 是 `page.employees.profileDetail.*` 下的 i18n key 片段，
 * 模板里拼成完整 key 后再翻译——把二十多个字段的 label 手抄进 template 重复得没必要。
 * `fieldName` 用泛型绑定到对应表单的 key，这样模板里 `form[field.fieldName]` 仍是
 * 类型安全的下标访问，不必退化成 `Record<string, any>`。
 */
export interface FieldConfig<K extends string = string> {
  fieldName: K;
  label: string;
  /** 后端对应字段的 max_length */
  maxlength?: number;
  placeholder?: string;
}

/** 基础信息文本项 */
export const BASIC_TEXT_FIELDS: FieldConfig<keyof BasicInfoForm>[] = [
  {
    fieldName: 'employee_code',
    label: 'employeeCode',
    maxlength: 32,
    placeholder: 'employeeCodePlaceholder',
  },
  {
    fieldName: 'email',
    label: 'loginEmail',
    placeholder: 'loginEmailPlaceholder',
  },
  {
    fieldName: 'full_name',
    label: 'chineseName',
    maxlength: 50,
    placeholder: 'chineseNamePlaceholder',
  },
  {
    fieldName: 'phone',
    label: 'phone',
    maxlength: 30,
    placeholder: 'phonePlaceholder',
  },
];

/** 基础信息下拉项，选项值来自后端组织目录（部门/岗位/地区） */
export const BASIC_SELECT_FIELDS: FieldConfig<keyof BasicInfoForm>[] = [
  { fieldName: 'department', label: 'department' },
  { fieldName: 'position', label: 'position' },
  { fieldName: 'region', label: 'region' },
];

/** 证件与身份信息文本项 */
export const IDENTITY_TEXT_FIELDS: FieldConfig<keyof ProfileForm>[] = [
  {
    fieldName: 'english_name',
    label: 'englishName',
    maxlength: 100,
    placeholder: 'englishNamePlaceholder',
  },
  {
    fieldName: 'personal_email',
    label: 'personalEmail',
    placeholder: 'personalEmailPlaceholder',
  },
  {
    fieldName: 'passport_number',
    label: 'passportNumber',
    maxlength: 50,
    placeholder: 'passportPlaceholder',
  },
];

/** 任职信息日期项 */
export const EMPLOYMENT_DATE_FIELDS: FieldConfig<keyof ProfileForm>[] = [
  { fieldName: 'hire_date', label: 'hireDate' },
  { fieldName: 'work_start_date', label: 'workStartDate' },
  { fieldName: 'last_working_date', label: 'lastWorkingDate' },
  { fieldName: 'last_employment_date', label: 'lastEmploymentDate' },
];

/** 紧急联系人文本项 */
export const EMERGENCY_TEXT_FIELDS: FieldConfig<keyof ProfileForm>[] = [
  {
    fieldName: 'emergency_contact_name',
    label: 'emergencyContactName',
    maxlength: 50,
    placeholder: 'optionalPlaceholder',
  },
  {
    fieldName: 'emergency_contact_phone',
    label: 'emergencyContactPhone',
    maxlength: 30,
    placeholder: 'optionalPlaceholder',
  },
];

// ─── 头像 ────────────────────────────────────────────────────────────────────

/** 后端允许的头像扩展名（app/services/employee_avatar_service.py） */
export const AVATAR_ALLOWED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.heic',
  '.heif',
];

/** 头像文件大小上限，与后端 MAX_AVATAR_SIZE_BYTES 保持一致 */
export const AVATAR_MAX_SIZE_BYTES = 5 * 1024 * 1024;

/** 文件选择器 accept：既给 MIME 也给扩展名，兼容 HEIC 这种 MIME 不规范的浏览器 */
export const AVATAR_ACCEPT =
  'image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif';

/** 头像文件是否合规；返回不合规的原因，合规返回 null（与后端校验口径对齐） */
export function validateAvatarFile(file: File): 'size' | 'type' | null {
  const name = (file.name || '').toLowerCase();
  const dotIndex = name.lastIndexOf('.');
  const extension = dotIndex === -1 ? '' : name.slice(dotIndex);
  if (!AVATAR_ALLOWED_EXTENSIONS.includes(extension)) {
    return 'type';
  }
  if (file.size > AVATAR_MAX_SIZE_BYTES) {
    return 'size';
  }
  return null;
}

/** 无头像时的占位字符：优先姓名首字，其次用户名首字母，最后 '?' */
export function avatarFallbackText(
  name?: null | string,
  username?: null | string,
): string {
  const source = (name || username || '').trim();
  if (!source) {
    return '?';
  }
  // 中文取首字，英文取首字母
  return source.slice(0, 1).toUpperCase();
}

/** 银行资料文本项（银行账号单独渲染：要带「显示完整账号」按钮） */
export const BANK_TEXT_FIELDS: FieldConfig<keyof ProfileForm>[] = [
  {
    fieldName: 'bank_name',
    label: 'bankName',
    maxlength: 100,
    placeholder: 'bankNamePlaceholder',
  },
  {
    fieldName: 'bank_account_name',
    label: 'bankAccountName',
    maxlength: 100,
    placeholder: 'bankAccountNamePlaceholder',
  },
];

export function buildGenderOptions(t: TFunc): SelectOption[] {
  return [
    { label: t('page.employees.profileDetail.genderMale'), value: '男' },
    { label: t('page.employees.profileDetail.genderFemale'), value: '女' },
    { label: t('page.employees.profileDetail.genderOther'), value: '其他' },
  ];
}

export function buildMaritalOptions(t: TFunc): SelectOption[] {
  return [
    { label: t('page.employees.profileDetail.maritalSingle'), value: '未婚' },
    { label: t('page.employees.profileDetail.maritalMarried'), value: '已婚' },
    {
      label: t('page.employees.profileDetail.maritalDivorced'),
      value: '离异',
    },
    { label: t('page.employees.profileDetail.maritalWidowed'), value: '丧偶' },
  ];
}

export function buildRelationshipOptions(t: TFunc): SelectOption[] {
  return [
    { label: t('page.employees.profileDetail.relMother'), value: '母亲' },
    { label: t('page.employees.profileDetail.relFather'), value: '父亲' },
    { label: t('page.employees.profileDetail.relHusband'), value: '丈夫' },
    { label: t('page.employees.profileDetail.relWife'), value: '妻子' },
    { label: t('page.employees.profileDetail.relSister'), value: '姐妹' },
    { label: t('page.employees.profileDetail.relBrother'), value: '兄弟' },
    { label: t('page.employees.profileDetail.relCousin'), value: '表亲' },
    { label: t('page.employees.profileDetail.relFriend'), value: '朋友' },
    { label: t('page.employees.profileDetail.relPartner'), value: '伙伴' },
  ];
}

export function buildIdKindOptions(t: TFunc): SelectOption[] {
  return [
    { label: t('page.employees.profileDetail.idKindHkid'), value: 'hkid' },
    { label: t('page.employees.profileDetail.idKindPrc'), value: 'prc_id' },
  ];
}

export function toOptions(arr?: null | string[]): SelectOption[] {
  return (arr || []).map((v) => ({ label: v, value: v }));
}

/**
 * 按地区推断默认证件类型。
 *
 * 与后端 `app/core/national_id.py` 的 `id_kind_for_region` 用同一套判定，
 * 仅用于给表单一个默认值；用户可以在「证件类型」下拉里覆盖。
 */
export function idKindForRegion(region?: null | string): '' | IdKind {
  const value = String(region || '').trim();
  if (!value) {
    return '';
  }
  const folded = value.toLowerCase().replaceAll(/\s+/g, '');
  if (value.includes('香港') || folded === 'hongkong' || folded === 'hk') {
    return 'hkid';
  }
  if (
    value.includes('大陆') ||
    value.includes('大陸') ||
    folded.includes('mainland')
  ) {
    return 'prc_id';
  }
  return '';
}

/** 证件号码 label 的 i18n key 片段，随证件类型变化 */
export function nationalIdLabelKey(kind?: null | string): string {
  if (kind === 'hkid') {
    return 'nationalIdHkid';
  }
  if (kind === 'prc_id') {
    return 'nationalIdPrc';
  }
  return 'nationalId';
}

function text(value?: null | string): string {
  return value || '';
}

export function createBasicInfoForm(
  employee?: EmployeeApi.EmployeeResponse | null,
): BasicInfoForm {
  return {
    department: text(employee?.department),
    email: text(employee?.email),
    employee_code: text(employee?.employee_code),
    full_name: text(employee?.full_name),
    phone: text(employee?.phone),
    position: text(employee?.position),
    region: text(employee?.region),
    username: text(employee?.username),
  };
}

export function createProfileForm(
  profile?: EmployeeApi.EmployeeProfileResponse | null,
  employee?: EmployeeApi.EmployeeResponse | null,
): ProfileForm {
  return {
    bank_account_name: text(profile?.bank_account_name),
    bank_account_number: text(profile?.bank_account_number),
    bank_name: text(profile?.bank_name),
    birth_date: text(profile?.birth_date),
    emergency_contact_name: text(profile?.emergency_contact_name),
    emergency_contact_phone: text(profile?.emergency_contact_phone),
    emergency_contact_relationship: text(
      profile?.emergency_contact_relationship,
    ),
    english_address: text(profile?.english_address),
    english_name: text(profile?.english_name),
    gender: text(profile?.gender),
    hire_date: text(profile?.hire_date),
    // 后端把 national_id 与 hkid_number 互为镜像，取任一即可
    hkid_number: text(profile?.national_id || profile?.hkid_number),
    id_kind:
      (profile?.id_kind as IdKind) || idKindForRegion(employee?.region) || null,
    last_employment_date: text(profile?.last_employment_date),
    last_working_date: text(profile?.last_working_date),
    marital_status: text(profile?.marital_status),
    passport_number: text(profile?.passport_number),
    personal_email: text(profile?.personal_email),
    work_start_date: text(profile?.work_start_date),
  };
}

/** 空串转 null：后端对多数文本字段以 null 表示清空 */
function toText(value?: null | string): null | string {
  return (value || '').trim() || null;
}

/**
 * 构建 PATCH /employees/{id}/basic-info 的 payload。
 *
 * 三个后端行为需要对着写：
 * - 提交 `email` 会连带把登录账号（username）改成同一个邮箱，所以这里不发 username；
 * - `employee_code` / `email` / `full_name` 后端要求非空，空着提交会 400，
 *   因此留空时干脆不带这个 key，避免「只改了电话却因为工号为空而整单失败」；
 * - 部门/岗位/地区必须命中组织目录，否则 400。
 */
export function buildBasicInfoPayload(
  form: BasicInfoForm,
): EmployeeApi.EmployeeBasicInfoUpdate {
  const payload: EmployeeApi.EmployeeBasicInfoUpdate = {
    department: toText(form.department),
    phone: toText(form.phone),
    position: toText(form.position),
    region: toText(form.region),
  };
  const email = toText(form.email);
  if (email) {
    payload.email = email;
  }
  const fullName = toText(form.full_name);
  if (fullName) {
    payload.full_name = fullName;
  }
  const employeeCode = toText(form.employee_code);
  if (employeeCode) {
    payload.employee_code = employeeCode;
  }
  return payload;
}

export interface ProfilePayloadContext {
  /** 当前登录者能否写入银行字段（本人或有 bank_data 权限） */
  canWriteBank: boolean;
  /** 档案里原本是否已有「最後工作日」——有则不允许通过本表单清空 */
  hasLastWorkingDate: boolean;
}

/**
 * 构建 PATCH /employees/{id}/profile 的 payload。
 *
 * 注意点：
 * - 不发 `chinese_full_name`：中文姓名走 basic-info 的 `full_name`（写的是同一个
 *   employee.full_name），而 /profile 的 `chinese_full_name` 传空会直接 400。
 * - 银行字段在无权限时一律不发，否则 403；账号里带 `*`（GET 返回的掩码）也不能回传。
 * - `last_working_date` 已存在时后端拒绝清空（要求走復職），所以留空则跳过该 key。
 */
export function buildProfilePayload(
  form: ProfileForm,
  context: ProfilePayloadContext,
): Partial<EmployeeApi.EmployeeProfileUpdate> {
  const payload: Partial<EmployeeApi.EmployeeProfileUpdate> = {
    birth_date: toText(form.birth_date),
    emergency_contact_name: toText(form.emergency_contact_name),
    emergency_contact_phone: toText(form.emergency_contact_phone),
    emergency_contact_relationship: toText(form.emergency_contact_relationship),
    english_address: toText(form.english_address),
    english_name: toText(form.english_name),
    gender: toText(form.gender),
    hire_date: toText(form.hire_date),
    hkid_number: toText(form.hkid_number),
    last_employment_date: toText(form.last_employment_date),
    marital_status: toText(form.marital_status),
    passport_number: toText(form.passport_number),
    personal_email: toText(form.personal_email),
    work_start_date: toText(form.work_start_date),
  };
  if (form.id_kind) {
    payload.id_kind = form.id_kind;
  }
  if (!(context.hasLastWorkingDate && !form.last_working_date)) {
    payload.last_working_date = toText(form.last_working_date);
  }
  if (context.canWriteBank) {
    payload.bank_account_name = toText(form.bank_account_name);
    payload.bank_name = toText(form.bank_name);
    if (!form.bank_account_number?.includes('*')) {
      payload.bank_account_number = toText(form.bank_account_number);
    }
  }
  return payload;
}
