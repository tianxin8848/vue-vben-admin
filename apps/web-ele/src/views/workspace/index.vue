<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';
import type { EmployeeApi } from '#/api';

import { computed, onMounted, ref } from 'vue';

import { Page, Profile, ProfileBaseSetting } from '@vben/common-ui';

import {
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElMessage,
  ElSpace,
  ElTag,
  ElUpload,
} from 'element-plus';

import {
  getMyBasicInfoApi,
  getMyProfileApi,
  getMyProfileMetaApi,
  updateMyAvatarApi,
  updateMyBasicInfoApi,
  updateMyProfileApi,
} from '#/api';

const loading = ref(false);
const activeTab = ref<'basic' | 'permissions' | 'profile'>('basic');

const basicFormRef = ref();
const profileFormRef = ref();

/** GET /me/basic-info 结果（基本信息 + 模块权限 + 头像） */
const basicInfo = ref<EmployeeApi.MyBasicInfoResponse | null>(null);
/** GET /me/profile-meta 结果（下拉选项 + 自助可编辑字段清单） */
const profileMeta = ref<EmployeeApi.ProfileMetaResponse | null>(null);

/** 重复字段处理：hire_date / work_start_date 两个接口都返回，
 *  统一以 /me/profile 为准（在档案页签展示与编辑），基本信息页签不再展示 */
const tabs = [
  { label: '基本信息', value: 'basic' },
  { label: '详细档案', value: 'profile' },
  { label: '模块权限', value: 'permissions' },
];

/** 根据后端返回的自助可编辑字段清单判断是否可编辑 */
function isEditable(field: string) {
  const fields = profileMeta.value?.employee_self_editable_fields;
  if (!fields) return false;
  return fields.includes(field);
}

const headerUserInfo = computed(() => ({
  avatar: basicInfo.value?.avatar_url || '',
  realName: basicInfo.value?.full_name || '',
  userId: basicInfo.value?.user_id?.toString() || basicInfo.value?.id || '',
  username: basicInfo.value?.username || '',
}));

/** 基本信息表单（保存走 PATCH /me/basic-info） */
const basicSchema = computed<VbenFormSchema[]>(() => [
  {
    component: 'Input',
    componentProps: { disabled: !isEditable('username') },
    fieldName: 'username',
    label: '账号',
  },
  {
    component: 'Input',
    componentProps: { disabled: !isEditable('full_name') },
    fieldName: 'full_name',
    label: '姓名',
  },
  {
    component: 'Input',
    componentProps: { disabled: !isEditable('email') },
    fieldName: 'email',
    label: '邮箱',
  },
  {
    component: 'Input',
    componentProps: { disabled: !isEditable('phone') },
    fieldName: 'phone',
    label: '手机号',
  },
  {
    component: 'Select',
    componentProps: {
      clearable: true,
      disabled: !isEditable('department'),
      options: (profileMeta.value?.departments || []).map((d) => ({
        label: d,
        value: d,
      })),
      placeholder: '请选择部门',
    },
    fieldName: 'department',
    label: '部门',
  },
  {
    component: 'Select',
    componentProps: {
      clearable: true,
      disabled: !isEditable('position'),
      options: (profileMeta.value?.positions || []).map((p) => ({
        label: p,
        value: p,
      })),
      placeholder: '请选择职位',
    },
    fieldName: 'position',
    label: '职位',
  },
  {
    component: 'Select',
    componentProps: {
      clearable: true,
      disabled: !isEditable('region'),
      options: (profileMeta.value?.regions || []).map((r) => ({
        label: r,
        value: r,
      })),
      placeholder: '请选择区域',
    },
    fieldName: 'region',
    label: '区域',
  },
]);

/** 详细档案表单（保存走 PATCH /me/profile） */
const profileSchema = computed<VbenFormSchema[]>(() => [
  {
    component: 'Input',
    componentProps: { disabled: !isEditable('english_name') },
    fieldName: 'english_name',
    label: '英文名',
  },
  {
    component: 'Select',
    componentProps: {
      clearable: true,
      disabled: !isEditable('gender'),
      options: [
        { label: '男', value: '男' },
        { label: '女', value: '女' },
      ],
      placeholder: '请选择性别',
    },
    fieldName: 'gender',
    label: '性别',
  },
  {
    component: 'DatePicker',
    componentProps: {
      disabled: !isEditable('birth_date'),
      placeholder: '请选择日期',
      type: 'date',
      valueFormat: 'YYYY-MM-DD',
    },
    fieldName: 'birth_date',
    label: '出生日期',
  },
  {
    component: 'Select',
    componentProps: {
      clearable: true,
      disabled: !isEditable('marital_status'),
      options: [
        { label: '未婚', value: '未婚' },
        { label: '已婚', value: '已婚' },
        { label: '离异', value: '离异' },
        { label: '丧偶', value: '丧偶' },
      ],
      placeholder: '请选择婚姻状况',
    },
    fieldName: 'marital_status',
    label: '婚姻状况',
  },
  {
    component: 'Input',
    componentProps: { disabled: !isEditable('hkid_number') },
    fieldName: 'hkid_number',
    label: '香港身份证号',
  },
  {
    component: 'Input',
    componentProps: { disabled: !isEditable('passport_number') },
    fieldName: 'passport_number',
    label: '护照号',
  },
  {
    component: 'Input',
    componentProps: { disabled: !isEditable('personal_email') },
    fieldName: 'personal_email',
    label: '个人邮箱',
  },
  {
    component: 'Input',
    componentProps: { disabled: !isEditable('english_address') },
    fieldName: 'english_address',
    label: '英文住址',
  },
  {
    component: 'DatePicker',
    componentProps: {
      disabled: !isEditable('hire_date'),
      placeholder: '请选择日期',
      type: 'date',
      valueFormat: 'YYYY-MM-DD',
    },
    fieldName: 'hire_date',
    label: '入职日期',
  },
  {
    component: 'DatePicker',
    componentProps: {
      disabled: !isEditable('work_start_date'),
      placeholder: '请选择日期',
      type: 'date',
      valueFormat: 'YYYY-MM-DD',
    },
    fieldName: 'work_start_date',
    label: '工作开始日期',
  },
  {
    component: 'Input',
    componentProps: { disabled: !isEditable('emergency_contact_name') },
    fieldName: 'emergency_contact_name',
    label: '紧急联系人',
  },
  {
    component: 'Input',
    componentProps: { disabled: !isEditable('emergency_contact_phone') },
    fieldName: 'emergency_contact_phone',
    label: '紧急联系电话',
  },
  {
    component: 'Input',
    componentProps: {
      disabled: !isEditable('emergency_contact_relationship'),
    },
    fieldName: 'emergency_contact_relationship',
    label: '紧急联系人关系',
  },
  {
    component: 'Input',
    componentProps: { disabled: !isEditable('bank_name') },
    fieldName: 'bank_name',
    label: '银行名称',
  },
  {
    component: 'Input',
    componentProps: { disabled: !isEditable('bank_account_name') },
    fieldName: 'bank_account_name',
    label: '银行户名',
  },
  {
    component: 'Input',
    componentProps: { disabled: !isEditable('bank_account_number') },
    fieldName: 'bank_account_number',
    label: '银行账号',
  },
]);

async function fetchData() {
  loading.value = true;
  try {
    // 一个界面并发请求三个接口：基本信息 + 详细档案 + 档案元数据
    const [basicRes, profileRes, metaRes] = await Promise.all([
      getMyBasicInfoApi(),
      getMyProfileApi(),
      getMyProfileMetaApi(),
    ]);
    basicInfo.value = basicRes;
    profileMeta.value = metaRes;

    basicFormRef.value?.getFormApi().setValues({
      department: basicRes.department || '',
      email: basicRes.email,
      full_name: basicRes.full_name || '',
      phone: basicRes.phone || '',
      position: basicRes.position || '',
      region: basicRes.region || '',
      username: basicRes.username,
    });

    profileFormRef.value?.getFormApi().setValues({
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
      hkid_number: profileRes.hkid_number || '',
      marital_status: profileRes.marital_status || '',
      passport_number: profileRes.passport_number || '',
      personal_email: profileRes.personal_email || '',
      work_start_date: profileRes.work_start_date || '',
    });
  } finally {
    loading.value = false;
  }
}

async function handleUpdateBasicInfo(values: Record<string, any>) {
  try {
    await updateMyBasicInfoApi({
      department: values.department || null,
      email: values.email || null,
      full_name: values.full_name || null,
      phone: values.phone || null,
      position: values.position || null,
      region: values.region || null,
      username: values.username || null,
    });
    ElMessage.success('基本信息更新成功');
    await fetchData();
  } catch {
    ElMessage.error('更新失败');
  }
}

async function handleUpdateProfile(values: Record<string, any>) {
  try {
    await updateMyProfileApi({
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
    });
    ElMessage.success('档案信息更新成功');
    await fetchData();
  } catch {
    ElMessage.error('更新失败');
  }
}

/** 头像上传（PATCH /me/avatar），选择文件后立即上传 */
function handleAvatarChange(uploadFile: any) {
  const file = uploadFile?.raw;
  if (!file) return;
  updateMyAvatarApi(file as File)
    .then(() => {
      ElMessage.success('头像更新成功');
      fetchData();
    })
    .catch(() => {
      ElMessage.error('头像更新失败');
    });
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <Page
    title="员工工作台"
    description="个人信息维护与模块权限"
    v-loading="loading"
  >
    <Profile
      v-model:model-value="activeTab"
      title="个人信息维护"
      :user-info="headerUserInfo"
      :tabs="tabs"
    >
      <template #content>
        <!-- 基本信息：PATCH /me/basic-info -->
        <template v-if="activeTab === 'basic'">
          <ProfileBaseSetting
            ref="basicFormRef"
            :form-schema="basicSchema"
            @submit="handleUpdateBasicInfo"
          />
          <ElUpload
            :on-change="handleAvatarChange"
            :show-file-list="false"
            :auto-upload="false"
            accept="image/*"
            class="mt-4"
          >
            <ElTag type="primary">
              {{ basicInfo?.avatar_name ? '更换头像' : '上传头像' }}
            </ElTag>
          </ElUpload>
        </template>

        <!-- 详细档案：PATCH /me/profile -->
        <ProfileBaseSetting
          v-else-if="activeTab === 'profile'"
          ref="profileFormRef"
          :form-schema="profileSchema"
          @submit="handleUpdateProfile"
        />

        <!-- 模块权限：来自 GET /me/basic-info 的 module_permissions -->
        <template v-else>
          <ElDescriptions
            v-if="basicInfo && basicInfo.module_permissions.length > 0"
            :column="1"
            border
          >
            <ElDescriptionsItem
              v-for="perm in basicInfo.module_permissions"
              :key="perm.module_code"
              :label="perm.module_name"
            >
              <ElSpace :size="4" wrap>
                <ElTag v-if="perm.can_view" type="info" size="small">
                  查看
                </ElTag>
                <ElTag v-if="perm.can_create" type="success" size="small">
                  创建
                </ElTag>
                <ElTag v-if="perm.can_edit" type="warning" size="small">
                  编辑
                </ElTag>
                <ElTag v-if="perm.can_delete" type="danger" size="small">
                  删除
                </ElTag>
                <ElTag v-if="perm.can_approve" type="primary" size="small">
                  审批
                </ElTag>
              </ElSpace>
            </ElDescriptionsItem>
          </ElDescriptions>
          <ElEmpty
            v-else-if="basicInfo"
            description="暂无模块权限"
            :image-size="80"
          />
        </template>
      </template>
    </Profile>
  </Page>
</template>
