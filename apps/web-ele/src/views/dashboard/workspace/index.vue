<script lang="ts" setup>
import type { SystemSettingsApi } from '#/api';

import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { ElButton, ElCard, ElTag } from 'element-plus';

import {
  getAnnualLeaveSummaryApi,
  getMyLeaveRequestsApi,
  getMyPendingApprovalsApi,
  getSystemSettingsApi,
  getUserInfoApi,
} from '#/api';

const router = useRouter();
const loading = ref(false);

const currentTime = ref('');
let timer: null | number = null;

const userInfo = ref<null | {
  department: null | string;
  email: string;
  full_name: string;
  id: string;
  is_admin: boolean;
  module_permissions: Array<{
    can_view: boolean;
    module_code: string;
    module_name: string;
  }>;
  phone: null | string;
  position: null | string;
  region: null | string;
  username: string;
}>(null);

const pendingApprovals = ref<any[]>([]);
const myLeaveRequests = ref<any[]>([]);
const annualLeaveSummary = ref<null | {
  available_days: number;
  entitlement_days: number;
  used_days: number;
}>(null);

const currentYear = new Date().getFullYear();

const modules = ref<SystemSettingsApi.SystemModuleItem[]>([]);

const modulePathMap: Record<string, string> = {
  employee_home: '/employee',
  employee_password: '/employee/change-password',
  employee_leave: '/employee/my-leave',
  admin_dashboard: '/dashboard/workspace',
  user_management: '/employee/manage/users',
  leave_calendar: '/employee/manage/leave',
  leave_workflows: '/employee/manage/leave-workflows',
  approval_management: '/employee/manage/approvals',
  system_settings: '/employee/manage/settings',
  data_migration: '/employee/manage/data-migration',
  access_control: '/employee/manage/access-control',
  claim_management: '/employee/claims',
};

const hasLeavePermission = computed(() => {
  if (!userInfo.value) return false;
  return userInfo.value.module_permissions.some(
    (p) => p.module_code === 'employee_leave' && p.can_view !== false,
  );
});

const hasApprovalPermission = computed(() => {
  if (!userInfo.value) return false;
  return userInfo.value.module_permissions.some(
    (p) => p.module_code === 'approval_management' && p.can_view !== false,
  );
});

const hasPendingApprovals = computed(() => {
  return pendingApprovals.value.length > 0;
});

function formatNow() {
  const now = new Date();
  const weekLabels = [
    '星期日',
    '星期一',
    '星期二',
    '星期三',
    '星期四',
    '星期五',
    '星期六',
  ];
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${weekLabels[now.getDay()]}`;
}

function startLiveClock() {
  currentTime.value = formatNow();
  timer = window.setInterval(() => {
    currentTime.value = formatNow();
  }, 1000);
}

async function fetchData() {
  loading.value = true;
  try {
    const [userRes, approvalsRes, leaveRes, annualRes, settingsRes] =
      await Promise.all([
        getUserInfoApi(),
        getMyPendingApprovalsApi(),
        getMyLeaveRequestsApi(),
        getAnnualLeaveSummaryApi(currentYear),
        getSystemSettingsApi(),
      ]);

    userInfo.value = {
      id: userRes.userId,
      username: userRes.username,
      full_name: userRes.realName,
      department: userRes.department || null,
      position: userRes.position || null,
      email: userRes.email,
      phone: userRes.phone || null,
      region: userRes.region || null,
      is_admin: (userRes.roles || []).includes('admin'),
      module_permissions: [],
    };

    pendingApprovals.value = approvalsRes;
    myLeaveRequests.value = leaveRes;
    annualLeaveSummary.value = annualRes;
    modules.value = settingsRes.modules || [];

    const detailedUser = await getUserInfoApi();
    if ('module_permissions' in detailedUser) {
      userInfo.value.module_permissions =
        detailedUser.module_permissions as any;
    }
  } catch (error) {
    console.error('Dashboard fetch error:', error);
  } finally {
    loading.value = false;
  }
}

function goToLeave() {
  router.push('/employee/my-leave');
}

function goToApprovals() {
  router.push('/employee/manage/approvals');
}

function goToChangePassword() {
  router.push('/employee/change-password');
}

function goToProfile() {
  router.push('/employee');
}

onMounted(() => {
  startLiveClock();
  fetchData();
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
  }
});
</script>

<template>
  <div class="workspace-page" v-loading="loading">
    <div class="page-header">
      <div class="header-info">
        <h2>工作台首页</h2>
        <p class="page-subtitle">员工登录后的默认页面</p>
        <div class="live-time">{{ currentTime }}</div>
      </div>
      <div class="header-actions">
        <ElButton @click="goToChangePassword">修改密码</ElButton>
        <ElButton type="primary" @click="goToLeave">提交请假申请</ElButton>
      </div>
    </div>

    <div class="grid">
      <ElCard class="card">
        <template #header>
          <h3>个人信息</h3>
        </template>
        <div v-if="userInfo" class="profile-content">
          <div>邮箱：{{ userInfo.email }}</div>
          <div>手机号：{{ userInfo.phone || '-' }}</div>
          <div>岗位：{{ userInfo.position || '-' }}</div>
          <div>地区：{{ userInfo.region || '-' }}</div>
        </div>
        <div v-else>加载中...</div>
        <div class="card-action" @click="goToProfile">查看详情</div>
      </ElCard>

      <ElCard class="card">
        <template #header>
          <h3>模块权限</h3>
        </template>
        <div class="permissions-content">
          <template v-if="userInfo">
            <ElTag
              v-for="perm in userInfo.module_permissions"
              :key="perm.module_code"
              class="permission-tag"
            >
              {{ perm.module_name }}
            </ElTag>
            <ElTag v-if="userInfo.is_admin" class="permission-tag admin-tag">
              系统管理模块
            </ElTag>
          </template>
          <span v-else>加载中...</span>
        </div>
      </ElCard>

      <ElCard v-if="hasLeavePermission" class="card">
        <template #header>
          <h3>请假模块</h3>
        </template>
        <p>可在这里查看自己的请假记录，并提交新的请假申请。</p>
        <div class="leave-stats">
          <span class="stat-item">
            <span class="stat-value">{{ myLeaveRequests.length }}</span>
            <span class="stat-label">请假记录</span>
          </span>
          <span class="stat-item">
            <span class="stat-value">{{
              annualLeaveSummary?.available_days || '-'
            }}</span>
            <span class="stat-label">年假余额</span>
          </span>
        </div>
        <ElButton type="primary" @click="goToLeave">进入请假模块</ElButton>
      </ElCard>

      <ElCard v-if="hasApprovalPermission || hasPendingApprovals" class="card">
        <template #header>
          <h3>审批中心</h3>
        </template>
        <p>
          <template v-if="hasPendingApprovals">
            你当前有 {{ pendingApprovals.length }} 条待审批请假。
          </template>
          <template v-else>
            如果你在某些流程中被设定为审批人，可以在这里处理待办。
          </template>
        </p>
        <div class="approval-stats">
          <span class="stat-item">
            <span class="stat-value pending">{{
              pendingApprovals.length
            }}</span>
            <span class="stat-label">待审批</span>
          </span>
        </div>
        <ElButton type="primary" @click="goToApprovals">进入审批中心</ElButton>
      </ElCard>

      <ElCard v-if="userInfo?.is_admin" class="card admin-card">
        <template #header>
          <h3>系统管理模块</h3>
        </template>
        <div class="module-grid">
          <div
            v-for="mod in modules"
            :key="mod.module_code"
            class="module-link"
            @click="router.push(modulePathMap[mod.module_code] || '/employee')"
          >
            <div class="module-title">{{ mod.module_name }}</div>
            <small>{{ mod.module_code }}</small>
          </div>
        </div>
      </ElCard>
    </div>
  </div>
</template>

<style scoped>
.workspace-page {
  min-height: calc(100vh - 80px);
  padding: 32px;
  background: #f8fafc;
}

.page-header {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}

.header-info h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
}

.page-subtitle {
  margin: 8px 0 0;
  font-size: 14px;
  color: #64748b;
}

.live-time {
  margin-top: 10px;
  font-size: 14px;
  font-weight: 700;
  color: #2563eb;
  letter-spacing: 0.2px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.header-actions button {
  padding: 10px 16px;
  font-weight: 700;
  border-radius: 10px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.card {
  padding: 22px;
  border-radius: 16px;
  box-shadow: 0 8px 24px rgb(15 23 42 / 8%);
}

.card :deep(.el-card__header) {
  padding: 0 0 16px;
  border-bottom: none;
}

.card :deep(.el-card__header) h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
}

.card :deep(.el-card__body) {
  padding: 0;
}

.profile-content {
  font-size: 14px;
  line-height: 1.8;
  color: #0f172a;
}

.profile-content div {
  margin-top: 8px;
}

.profile-content div:first-child {
  margin-top: 0;
}

.card-action {
  margin-top: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #2563eb;
  cursor: pointer;
}

.permissions-content {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.permission-tag {
  padding: 4px 8px;
  font-size: 12px;
  color: #1d4ed8;
  background: #dbeafe;
  border-radius: 999px;
}

.permission-tag.admin-tag {
  color: #d97706;
  background: #fef3c7;
}

.leave-stats,
.approval-stats {
  display: flex;
  gap: 20px;
  margin: 16px 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
}

.stat-value.pending {
  color: #d97706;
}

.stat-label {
  margin-top: 4px;
  font-size: 13px;
  color: #64748b;
}

.card :deep(.el-button) {
  margin-top: 16px;
}

.admin-card {
  grid-column: span 2;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.module-link {
  padding: 14px 16px;
  color: #1d4ed8;
  cursor: pointer;
  background: #eff6ff;
  border-radius: 14px;
  transition: all 0.2s ease;
}

.module-link:hover {
  background: #dbeafe;
  transform: translateY(-2px);
}

.module-title {
  font-weight: 700;
}

.module-link small {
  display: block;
  margin-top: 6px;
  font-weight: 400;
  line-height: 1.5;
  color: #475569;
}

@media (max-width: 900px) {
  .admin-card {
    grid-column: span 1;
  }

  .module-grid {
    grid-template-columns: 1fr;
  }
}
</style>
