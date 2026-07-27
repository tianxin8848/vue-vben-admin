<script lang="ts" setup>
import type { EmployeeApi } from '#/api';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { ElCard, ElTag } from 'element-plus';

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
  <Page title="员工工作台" description="员工登录后的默认页面" v-loading="loading">
    <div class="quick-actions">
      <div class="action-card" @click="goToProfile">
        <div class="action-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
        </div>
        <span class="action-text">个人信息维护</span>
      </div>
    </div>

    <div class="content-grid">
      <ElCard class="info-card" header="个人信息">
        <div v-if="userInfo" class="info-grid">
          <div class="info-item">
            <span class="info-label">姓名</span>
            <span class="info-value">{{ userInfo.full_name }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">账号</span>
            <span class="info-value">{{ userInfo.username }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">邮箱</span>
            <span class="info-value">{{ userInfo.email }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">手机号</span>
            <span class="info-value">{{ userInfo.phone || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">部门</span>
            <span class="info-value">{{ userInfo.department || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">职位</span>
            <span class="info-value">{{ userInfo.position || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">区域</span>
            <span class="info-value">{{ userInfo.region || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">身份</span>
            <ElTag :type="userInfo.is_admin ? 'danger' : 'info'" size="small">
              {{ userInfo.is_admin ? '管理员' : '普通员工' }}
            </ElTag>
          </div>
        </div>
      </ElCard>

      <ElCard class="permissions-card" header="模块权限">
        <div v-if="userInfo" class="permissions-list">
          <div
            v-for="perm in userInfo.module_permissions"
            :key="perm.module_code"
            class="permission-item"
          >
            <span class="permission-name">{{ perm.module_name }}</span>
            <div class="permission-actions">
              <span v-if="perm.can_view" class="action-tag view">查看</span>
              <span v-if="perm.can_create" class="action-tag create">创建</span>
              <span v-if="perm.can_edit" class="action-tag edit">编辑</span>
              <span v-if="perm.can_delete" class="action-tag delete">删除</span>
              <span v-if="perm.can_approve" class="action-tag approve">审批</span>
            </div>
          </div>
          <div v-if="userInfo.module_permissions.length === 0" class="empty-permissions">
            暂无模块权限
          </div>
        </div>
      </ElCard>
    </div>
  </Page>
</template>

<style scoped>

.quick-actions {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #e4e7ed;
}

.action-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #409eff;
}

.action-icon {
  color: #409eff;
  font-size: 24px;
}

.action-text {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 992px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

.info-card {
  height: fit-content;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 13px;
  color: #909399;
}

.info-value {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.permissions-card {
  height: fit-content;
}

.permissions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.permission-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
}

.permission-name {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.permission-actions {
  display: flex;
  gap: 8px;
}

.action-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.action-tag.view {
  background: #e8f4fd;
  color: #409eff;
}

.action-tag.create {
  background: #e8f5e9;
  color: #67c23a;
}

.action-tag.edit {
  background: #fff3e0;
  color: #e6a23c;
}

.action-tag.delete {
  background: #fee2e2;
  color: #f56c6c;
}

.action-tag.approve {
  background: #f3e8ff;
  color: #9b59b6;
}

.empty-permissions {
  text-align: center;
  padding: 20px;
  color: #909399;
  font-size: 14px;
}
</style>
