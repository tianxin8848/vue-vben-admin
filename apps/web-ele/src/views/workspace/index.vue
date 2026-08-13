<script lang="ts" setup>
import type { EmployeeApi } from '#/api';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElCard,
  ElDescriptions,
  ElDescriptionsItem,
  ElEmpty,
  ElSpace,
  ElTag,
} from 'element-plus';

import { getUserInfoApi } from '#/api';

const router = useRouter();
const loading = ref(false);
const userInfo = ref<null | {
  department: null | string;
  email: string;
  full_name: string;
  id: string;
  is_admin: boolean;
  module_permissions: EmployeeApi.ModulePermission[];
  phone: null | string;
  position: null | string;
  region: null | string;
  username: string;
}>(null);

async function fetchData() {
  loading.value = true;
  try {
    const result = await getUserInfoApi();
    userInfo.value = {
      id: result.userId,
      username: result.username,
      full_name: result.realName,
      email: result.email,
      phone: result.phone || null,
      department: result.department || null,
      position: result.position || null,
      region: result.region || null,
      is_admin: (result.roles || []).includes('admin'),
      module_permissions: result.module_permissions || [],
    };
  } finally {
    loading.value = false;
  }
}

function goToProfile() {
  router.push('/employee/profile');
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <Page
    title="员工工作台"
    description="员工登录后的默认页面"
    v-loading="loading"
  >
    <ElButton size="large" @click="goToProfile">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
      <span class="ml-2">个人信息维护</span>
    </ElButton>

    <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ElCard header="个人信息">
        <ElDescriptions v-if="userInfo" :column="2" border>
          <ElDescriptionsItem label="姓名">
            {{ userInfo.full_name }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="账号">
            {{ userInfo.username }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="邮箱">
            {{ userInfo.email }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="手机号">
            {{ userInfo.phone || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="部门">
            {{ userInfo.department || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="职位">
            {{ userInfo.position || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="区域">
            {{ userInfo.region || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="身份">
            <ElTag :type="userInfo.is_admin ? 'danger' : 'info'" size="small">
              {{ userInfo.is_admin ? '管理员' : '普通员工' }}
            </ElTag>
          </ElDescriptionsItem>
        </ElDescriptions>
      </ElCard>

      <ElCard header="模块权限">
        <ElDescriptions
          v-if="userInfo && userInfo.module_permissions.length > 0"
          :column="1"
          border
        >
          <ElDescriptionsItem
            v-for="perm in userInfo.module_permissions"
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
          v-else-if="userInfo"
          description="暂无模块权限"
          :image-size="80"
        />
      </ElCard>
    </div>
  </Page>
</template>
