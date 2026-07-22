<script lang="ts" setup>
import type { LeaveRequestApi } from '#/api';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  ElButton,
  ElLink,
} from 'element-plus';

import {
  getAnnualLeaveSummaryApi,
  getMyLeaveRequestsApi,
  getMyPendingApprovalsApi,
  getUserInfoApi,
} from '#/api';

const router = useRouter();
const loading = ref(false);

const userInfo = ref<null | {
  full_name: string;
  id: string;
  is_admin: boolean;
  username: string;
}>(null);

const pendingApprovals = ref<LeaveRequestApi.LeaveRequest[]>([]);
const recentLeaves = ref<LeaveRequestApi.LeaveRequest[]>([]);
const annualLeaveSummary = ref<LeaveRequestApi.AnnualLeaveSummary | null>(null);

const currentYear = new Date().getFullYear();

const leaveTypeOptions: Record<string, string> = {
  sick: '病假',
  annual: '年假',
  personal: '事假',
  lieu: '调休',
  long: '长假',
};

const statusOptions: Record<string, string> = {
  pending: '待审批',
  approved: '已批准',
  rejected: '已拒绝',
  withdrawn: '已撤回',
};

const statusTypeMap: Record<string, 'danger' | 'info' | 'success' | 'warning'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  withdrawn: 'info',
};

async function fetchData() {
  loading.value = true;
  try {
    const [
      approvalsRes,
      myLeavesRes,
      annualLeaveRes,
      userRes,
    ] = await Promise.all([
      getMyPendingApprovalsApi(),
      getMyLeaveRequestsApi(),
      getAnnualLeaveSummaryApi(currentYear),
      getUserInfoApi(),
    ]);

    pendingApprovals.value = approvalsRes.slice(0, 5);
    recentLeaves.value = myLeavesRes.slice(0, 5);
    annualLeaveSummary.value = annualLeaveRes;
    userInfo.value = {
      id: userRes.userId,
      username: userRes.username,
      full_name: userRes.realName,
      is_admin: (userRes.roles || []).includes('admin'),
    };
  } catch (e) {
    console.error('Dashboard fetch error:', e);
  } finally {
    loading.value = false;
  }
}

function goToLeaveList() {
  router.push('/leave/list');
}

function goToMyLeave() {
  router.push('/leave/my-leave');
}

function goToMyApprovals() {
  router.push('/leave/my-approvals');
}

function goToCalendar() {
  router.push('/leave/calendar');
}

function viewLeaveDetail(id: string) {
  router.push(`/leave/detail/${id}`);
}

onMounted(() => {
  fetchData();
});
</script>

<template>
  <div class="dashboard-page" v-loading="loading">
    <div class="page-header">
      <div class="header-info">
        <h2>欢迎回来，{{ userInfo?.full_name || '用户' }}</h2>
        <p class="page-desc">今天是 {{ new Date().toLocaleDateString('zh-CN') }}</p>
      </div>
      <div class="header-actions">
        <ElButton type="primary" @click="goToLeaveList">
          提交请假申请
        </ElButton>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon pending">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ pendingApprovals.length }}</div>
          <div class="stat-label">待审批</div>
        </div>
        <ElLink type="primary" :underline="false" @click="goToMyApprovals" class="stat-link">
          查看全部
        </ElLink>
      </div>

      <div class="stat-card">
        <div class="stat-icon annual">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2v4" /><path d="M16 2v4" /><rect x="3" y="6" width="18" height="14" rx="2" /><path d="M3 10h18" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /></svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">
            {{ annualLeaveSummary?.available_days || 0 }}
            <span class="stat-unit">天</span>
          </div>
          <div class="stat-label">
            {{ currentYear }}年年假余额
          </div>
        </div>
        <div class="stat-detail">
          已使用 {{ annualLeaveSummary?.used_days || 0 }} / 总计 {{ annualLeaveSummary?.entitlement_days || 0 }} 天
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon recent">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ recentLeaves.length }}</div>
          <div class="stat-label">最近请假记录</div>
        </div>
        <ElLink type="primary" :underline="false" @click="goToMyLeave" class="stat-link">
          查看全部
        </ElLink>
      </div>

      <div class="stat-card">
        <div class="stat-icon calendar">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
        </div>
        <div class="stat-content">
          <div class="stat-value">📅</div>
          <div class="stat-label">请假日历</div>
        </div>
        <ElLink type="primary" :underline="false" @click="goToCalendar" class="stat-link">
          查看日历
        </ElLink>
      </div>
    </div>

    <div class="content-grid">
      <ElCard class="section-card" header="待审批列表">
        <div v-if="pendingApprovals.length === 0" class="empty-state">
          暂无待审批的请假申请
        </div>
        <ElTable
          v-else
          :data="pendingApprovals"
          border
          size="small"
          highlight-current-row
          @row-click="(row) => viewLeaveDetail(row.id)"
        >
          <ElTableColumn prop="employee_name" label="申请人" width="120" />
          <ElTableColumn prop="leave_type" label="请假类型" width="100">
            <template #default="{ row }">
              {{ leaveTypeOptions[row.leave_type] }}
            </template>
          </ElTableColumn>
          <ElTableColumn prop="start_date" label="开始日期" width="120" />
          <ElTableColumn prop="end_date" label="结束日期" width="120" />
          <ElTableColumn prop="reason" label="原因" min-width="150" show-overflow-tooltip />
          <ElTableColumn prop="created_at" label="申请时间" width="150" />
          <ElTableColumn label="操作" width="80">
            <template #default="{ row }">
              <ElButton size="small" type="primary" @click="viewLeaveDetail(row.id)">
                审批
              </ElButton>
            </template>
          </ElTableColumn>
        </ElTable>
      </ElCard>

      <ElCard class="section-card" header="我的最近请假">
        <div v-if="recentLeaves.length === 0" class="empty-state">
          暂无请假记录
        </div>
        <ElTable
          v-else
          :data="recentLeaves"
          border
          size="small"
          highlight-current-row
          @row-click="(row) => viewLeaveDetail(row.id)"
        >
          <ElTableColumn prop="leave_type" label="类型" width="80">
            <template #default="{ row }">
              {{ leaveTypeOptions[row.leave_type] }}
            </template>
          </ElTableColumn>
          <ElTableColumn prop="start_date" label="开始日期" width="120" />
          <ElTableColumn prop="end_date" label="结束日期" width="120" />
          <ElTableColumn prop="approval_status" label="状态" width="100">
            <template #default="{ row }">
              <ElTag :type="statusTypeMap[row.approval_status]">
                {{ statusOptions[row.approval_status] }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn prop="reason" label="原因" min-width="150" show-overflow-tooltip />
          <ElTableColumn prop="created_at" label="申请时间" width="150" />
          <ElTableColumn label="操作" width="80">
            <template #default="{ row }">
              <ElButton size="small" @click="viewLeaveDetail(row.id)">
                详情
              </ElButton>
            </template>
          </ElTableColumn>
        </ElTable>
      </ElCard>
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  padding: 24px;
  background: #f5f5f5;
  min-height: calc(100vh - 80px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.header-info h2 {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.page-desc {
  font-size: 14px;
  color: #909399;
  margin: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}

.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.pending {
  background: #fef3c7;
  color: #d97706;
}

.stat-icon.annual {
  background: #dbeafe;
  color: #2563eb;
}

.stat-icon.recent {
  background: #dcfce7;
  color: #16a34a;
}

.stat-icon.calendar {
  background: #f3e8ff;
  color: #9333ea;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

.stat-unit {
  font-size: 14px;
  font-weight: 400;
  color: #909399;
  margin-left: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.stat-detail {
  font-size: 12px;
  color: #c0c4cc;
}

.stat-link {
  font-size: 13px;
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

.section-card {
  height: fit-content;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: #909399;
  font-size: 14px;
}
</style>
