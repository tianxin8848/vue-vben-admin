import type { BasicInfoForm, ProfileForm, SelectOption } from '../data';

import type { EmployeeApi } from '#/api';

import { computed, onMounted, reactive, ref } from 'vue';

import {
  getEmployeeBasicInfoApi,
  getEmployeeProfileApi,
  getEmployeeProfileMetaApi,
  revealEmployeeBankApi,
  updateEmployeeBasicInfoApi,
  updateEmployeeProfileApi,
} from '#/api';
import { $t } from '#/locales';
import { handleActionError, toastSuccess, toastWarning } from '#/utils/message';

import {
  buildBasicInfoPayload,
  buildGenderOptions,
  buildIdKindOptions,
  buildMaritalOptions,
  buildProfilePayload,
  buildRelationshipOptions,
  createBasicInfoForm,
  createProfileForm,
  idKindForRegion,
  nationalIdLabelKey,
  toOptions,
} from '../data';

/**
 * 员工档案页（HR 视角）的数据装配与保存动作。
 *
 * 后端两条写入通道必须分清：
 * - 基础信息 → PATCH /employees/{id}/basic-info（工号、邮箱、姓名、电话、部门/岗位/地区）
 * - 档案信息 → PATCH /employees/{id}/profile（证件、任职日期、紧急联系人、银行）
 * 两者都只校验 user_management，`allowed_fields=None`，所以 HR 没有字段白名单限制。
 */
export function useEmployeeProfile(employeeId: string) {
  const loading = ref(false);
  const saving = ref(false);
  const employee = ref<EmployeeApi.EmployeeResponse | null>(null);
  const profile = ref<EmployeeApi.EmployeeProfileResponse | null>(null);

  const departmentOptions = ref<SelectOption[]>([]);
  const positionOptions = ref<SelectOption[]>([]);
  const regionOptions = ref<SelectOption[]>([]);

  const basicForm = reactive<BasicInfoForm>(createBasicInfoForm());
  const profileForm = reactive<ProfileForm>(createProfileForm());

  /** 本人或有 bank_data 权限才能读写银行字段，否则后端 403 */
  const canWriteBank = computed(() =>
    Boolean(profile.value?.can_reveal_bank_account),
  );
  /** 已填写最後工作日 = 已离职，此时不允许通过本表单清空 */
  const isLeaver = computed(() => Boolean(profile.value?.last_working_date));

  /** 选项里补上当前值，避免历史数据不在组织目录里时被下拉静默清空 */
  function withCurrentValue(
    options: SelectOption[],
    current?: null | string,
  ): SelectOption[] {
    if (!current || options.some((option) => option.value === current)) {
      return options;
    }
    return [...options, { label: current, value: current }];
  }

  const selectOptions = computed<Record<string, SelectOption[]>>(() => ({
    department: withCurrentValue(departmentOptions.value, basicForm.department),
    position: withCurrentValue(positionOptions.value, basicForm.position),
    region: withCurrentValue(regionOptions.value, basicForm.region),
  }));

  const genderOptions = computed(() => buildGenderOptions($t));
  const maritalOptions = computed(() => buildMaritalOptions($t));
  const relationshipOptions = computed(() => buildRelationshipOptions($t));
  const idKindOptions = computed(() => buildIdKindOptions($t));

  /** 证件号码 label 随证件类型变化（香港身份证号码 / 居民身份证号码） */
  const nationalIdLabel = computed(() =>
    $t(
      `page.employees.profileDetail.${nationalIdLabelKey(profileForm.id_kind)}`,
    ),
  );

  async function fetchOrgOptions() {
    try {
      const meta = await getEmployeeProfileMetaApi(employeeId);
      departmentOptions.value = toOptions(meta.departments);
      positionOptions.value = toOptions(meta.positions);
      regionOptions.value = toOptions(meta.regions);
    } catch (error) {
      handleActionError('employees/profile', error);
    }
  }

  async function fetchData() {
    loading.value = true;
    try {
      const [employeeRes, profileRes] = await Promise.all([
        getEmployeeBasicInfoApi(employeeId),
        getEmployeeProfileApi(employeeId),
      ]);
      employee.value = employeeRes;
      profile.value = profileRes;
      Object.assign(basicForm, createBasicInfoForm(employeeRes));
      Object.assign(profileForm, createProfileForm(profileRes, employeeRes));
    } catch (error) {
      handleActionError(
        'employees/profile',
        error,
        $t('page.employees.profileDetail.loadFailed'),
      );
    } finally {
      loading.value = false;
    }
  }

  /** 读取完整银行账号（会写 bank_data 审计日志） */
  async function revealBank() {
    if (!canWriteBank.value) {
      return;
    }
    try {
      const revealed = await revealEmployeeBankApi(employeeId);
      profileForm.bank_name = revealed.bank_name || '';
      profileForm.bank_account_name = revealed.bank_account_name || '';
      profileForm.bank_account_number = revealed.bank_account_number || '';
    } catch (error) {
      handleActionError(
        'employees/profile',
        error,
        $t('page.employees.profileDetail.revealFailed'),
      );
    }
  }

  /**
   * 保存。先基础信息、后档案——顺序不能反：
   * 地区在基础信息里，而证件类型的默认值由地区推导。
   */
  async function save() {
    if (
      !(basicForm.email || '').trim() ||
      !(basicForm.full_name || '').trim()
    ) {
      toastWarning($t('page.employees.profileDetail.requiredBasicInfo'));
      return;
    }
    saving.value = true;
    try {
      const updatedEmployee = await updateEmployeeBasicInfoApi(
        employeeId,
        buildBasicInfoPayload(basicForm),
      );
      employee.value = updatedEmployee;
      Object.assign(basicForm, createBasicInfoForm(updatedEmployee));
      if (!profileForm.id_kind) {
        profileForm.id_kind = idKindForRegion(updatedEmployee.region) || null;
      }

      try {
        const updatedProfile = await updateEmployeeProfileApi(
          employeeId,
          buildProfilePayload(profileForm, {
            canWriteBank: canWriteBank.value,
            hasLastWorkingDate: isLeaver.value,
          }),
        );
        profile.value = updatedProfile;
        Object.assign(
          profileForm,
          createProfileForm(updatedProfile, updatedEmployee),
        );
        toastSuccess($t('page.employees.profileDetail.updateSuccess'));
      } catch (error) {
        // 基础信息已落库、档案部分失败，必须说清楚，否则用户会以为整单没保存
        toastWarning($t('page.employees.profileDetail.basicInfoSaved'));
        handleActionError(
          'employees/profile',
          error,
          $t('page.employees.profileDetail.updateFailed'),
        );
      }
    } catch (error) {
      handleActionError(
        'employees/profile',
        error,
        $t('page.employees.profileDetail.updateFailed'),
      );
    } finally {
      saving.value = false;
    }
  }

  onMounted(() => {
    fetchData();
    fetchOrgOptions();
  });

  return {
    basicForm,
    canWriteBank,
    employee,
    fetchData,
    fetchOrgOptions,
    genderOptions,
    idKindOptions,
    isLeaver,
    loading,
    maritalOptions,
    nationalIdLabel,
    profileForm,
    relationshipOptions,
    revealBank,
    save,
    saving,
    selectOptions,
  };
}
