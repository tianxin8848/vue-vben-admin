<script lang="ts" setup>
import type { ProfileTab } from './data';

import type { EmployeeApi } from '#/api';

import { computed, nextTick, onMounted, ref } from 'vue';

import { Page, Profile, ProfileBaseSetting } from '@vben/common-ui';
import { useI18n } from '@vben/locales';

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

import {
  buildBasicSchema,
  buildBasicUpdatePayload,
  buildBasicValues,
  buildProfileSchema,
  buildProfileTabs,
  buildProfileUpdatePayload,
  buildProfileValues,
} from './data';

const { t } = useI18n();
const loading = ref(false);
const activeTab = ref<ProfileTab>('basic');

const basicFormRef = ref();
const profileFormRef = ref();

/** GET /me/basic-info 结果（基本信息 + 模块权限 + 头像） */
const basicInfo = ref<EmployeeApi.MyBasicInfoResponse | null>(null);
/** GET /me/profile-meta 结果（下拉选项 + 自助可编辑字段清单） */
const profileMeta = ref<EmployeeApi.ProfileMetaResponse | null>(null);
/** GET /me/profile 结果（详细档案），切 tab 时可用于重新赋值 */
const profileInfo = ref<EmployeeApi.EmployeeProfileResponse | null>(null);

/** 重复字段处理：hire_date / work_start_date 两个接口都返回，
 *  统一以 /me/profile 为准（在档案页签展示与编辑），基本信息页签不再展示 */
const tabs = computed(() => buildProfileTabs(t));

const headerUserInfo = computed(() => ({
  avatar: basicInfo.value?.avatar_url || '',
  realName: basicInfo.value?.full_name || '',
  userId: basicInfo.value?.user_id?.toString() || basicInfo.value?.id || '',
  username: basicInfo.value?.username || '',
}));

/** 基本信息表单（保存走 PATCH /me/basic-info） */
const basicSchema = computed(() => buildBasicSchema(t, profileMeta.value));

/** 详细档案表单（保存走 PATCH /me/profile） */
const profileSchema = computed(() => buildProfileSchema(t, profileMeta.value));

/**
 * 将值写入表单。
 * - 用 resetForm({ values }) 同时更新 vee-validate 的 initialState，
 *   避免时序/组件挂载导致的 setValues 丢失。
 * - 内部 await nextTick() 保证子组件 ProfileBaseSetting 已 mount，
 *   getFormApi() 能拿到可用的 form 实例。
 */
async function fillBasicForm(values: Record<string, any>) {
  await nextTick();
  const api = basicFormRef.value?.getFormApi();
  if (!api) return;
  try {
    await api.resetForm({ values });
  } catch {
    await api.setValues(values, false);
  }
}

async function fillProfileForm(values: Record<string, any>) {
  await nextTick();
  const api = profileFormRef.value?.getFormApi();
  if (!api) return;
  try {
    await api.resetForm({ values });
  } catch {
    await api.setValues(values, false);
  }
}

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
    profileInfo.value = profileRes;
    profileMeta.value = metaRes;

    const basicValues = buildBasicValues(basicRes);
    const profileValues = buildProfileValues(profileRes);

    // 先写基本信息表单（当前默认 tab，挂载优先级更高）
    await fillBasicForm(basicValues);
    // 再写档案表单（v-show 隐藏但已挂载）
    await fillProfileForm(profileValues);
  } finally {
    loading.value = false;
  }
}

async function handleUpdateBasicInfo(values: Record<string, any>) {
  try {
    await updateMyBasicInfoApi(buildBasicUpdatePayload(values));
    ElMessage.success(t('page.workspace.profilePage.basicUpdateSuccess'));
    await fetchData();
  } catch {
    ElMessage.error(t('page.workspace.profilePage.updateFailed'));
  }
}

async function handleUpdateProfile(values: Record<string, any>) {
  try {
    await updateMyProfileApi(buildProfileUpdatePayload(values));
    ElMessage.success(t('page.workspace.profilePage.profileUpdateSuccess'));
    await fetchData();
  } catch {
    ElMessage.error(t('page.workspace.profilePage.updateFailed'));
  }
}

/** 头像上传（PATCH /me/avatar），选择文件后立即上传 */
function handleAvatarChange(uploadFile: any) {
  const file = uploadFile?.raw;
  if (!file) return;
  updateMyAvatarApi(file as File)
    .then(() => {
      ElMessage.success(t('page.workspace.profilePage.avatarUpdateSuccess'));
      fetchData();
    })
    .catch(() => {
      ElMessage.error(t('page.workspace.profilePage.avatarUpdateFailed'));
    });
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <Page v-loading="loading">
    <Profile
      v-model:model-value="activeTab"
      :title="t('page.workspace.profilePage.title')"
      :user-info="headerUserInfo"
      :tabs="tabs"
    >
      <template #content>
        <!-- 基本信息：PATCH /me/basic-info -->
        <!-- 用 v-show 保证子表单始终挂载，ref 可用、表单值可写入 -->
        <div v-show="activeTab === 'basic'">
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
              {{
                basicInfo?.avatar_name
                  ? t('page.workspace.profilePage.changeAvatar')
                  : t('page.workspace.profilePage.uploadAvatar')
              }}
            </ElTag>
          </ElUpload>
        </div>

        <!-- 详细档案：PATCH /me/profile -->
        <ProfileBaseSetting
          v-show="activeTab === 'profile'"
          ref="profileFormRef"
          wrapper-class="grid-cols-2"
          :form-schema="profileSchema"
          @submit="handleUpdateProfile"
        />

        <!-- 模块权限：来自 GET /me/basic-info 的 module_permissions -->
        <div v-show="activeTab === 'permissions'">
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
                  {{ t('page.workspace.profilePage.permView') }}
                </ElTag>
                <ElTag v-if="perm.can_create" type="success" size="small">
                  {{ t('page.workspace.profilePage.permCreate') }}
                </ElTag>
                <ElTag v-if="perm.can_edit" type="warning" size="small">
                  {{ t('page.workspace.profilePage.permEdit') }}
                </ElTag>
                <ElTag v-if="perm.can_delete" type="danger" size="small">
                  {{ t('page.workspace.profilePage.permDelete') }}
                </ElTag>
                <ElTag v-if="perm.can_approve" type="primary" size="small">
                  {{ t('page.workspace.profilePage.permApprove') }}
                </ElTag>
              </ElSpace>
            </ElDescriptionsItem>
          </ElDescriptions>
          <ElEmpty
            v-else-if="basicInfo"
            :description="t('page.workspace.profilePage.noPermissions')"
            :image-size="80"
          />
        </div>
      </template>
    </Profile>
  </Page>
</template>
