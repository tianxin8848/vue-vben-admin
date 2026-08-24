<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { ElButton, ElMessage, ElMessageBox, ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteLeaveWorkflowApi,
  getEmployeesApi,
  getLeaveWorkflowsApi,
  getLeaveWorkflowsMetaApi,
  updateLeaveWorkflowApi,
} from '#/api';

import WorkflowDrawer from './components/WorkflowDrawer.vue';
import { gridOptions } from './data';

const loading = ref(false);

const currentTime = ref('');
let timer: null | number = null;

const workflows = ref<any[]>([]);
const employees = ref<any[]>([]);
const regions = ref<string[]>([]);
const departments = ref<string[]>([]);
const positions = ref<string[]>([]);

const [BasicTable, tableApi] = useVbenVxeGrid({
  gridOptions,
  gridEvents: {
    toolbarToolClick(event: { code: string }) {
      if (event.code === 'manual-refresh') {
        fetchWorkflows();
      }
    },
  },
});

const employeeOptions = computed(() => {
  return employees.value.map((emp) => ({
    label: `${emp.username || ''} / ${emp.full_name || '未命名'}`,
    value: emp.id,
    username: emp.username || '',
    full_name: emp.full_name || null,
  }));
});

const drawerRef = ref<InstanceType<typeof WorkflowDrawer>>();

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

function buildMatchText(match: any) {
  const parts: string[] = [];
  if (match.employee_id) {
    const emp = employees.value.find((e) => e.id === match.employee_id);
    parts.push(
      `员工：${emp ? `${emp.username} / ${emp.full_name || '未命名'}` : match.employee_id}`,
    );
  }
  if (match.region) parts.push(`地区：${match.region}`);
  if (match.department) parts.push(`部门：${match.department}`);
  if (match.position) parts.push(`岗位：${match.position}`);
  return parts.length > 0 ? parts.join('，') : '全局默认';
}

async function toggleWorkflowStatus(workflow: any) {
  loading.value = true;
  try {
    await updateLeaveWorkflowApi(workflow.id, {
      is_active: !workflow.is_active,
    });
    await fetchWorkflows();
    ElMessage.success(workflow.is_active ? '流程已禁用' : '流程已启用');
  } catch {
    ElMessage.error('操作失败');
  } finally {
    loading.value = false;
  }
}

async function deleteWorkflow(workflow: any) {
  try {
    await ElMessageBox.confirm(`确认删除流程：${workflow.name}？`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    });
  } catch {
    return;
  }
  loading.value = true;
  try {
    await deleteLeaveWorkflowApi(workflow.id);
    await fetchWorkflows();
    ElMessage.success('流程已删除');
  } catch {
    ElMessage.error('删除失败');
  } finally {
    loading.value = false;
  }
}

async function fetchWorkflows() {
  loading.value = true;
  try {
    workflows.value = await getLeaveWorkflowsApi();
    tableApi.setGridOptions({ data: workflows.value });
  } catch {
    workflows.value = [];
    tableApi.setGridOptions({ data: [] });
  } finally {
    loading.value = false;
  }
}

async function fetchEmployees() {
  try {
    const data = await getEmployeesApi();
    employees.value = data.filter((item: any) => item.is_active !== false);
  } catch {
    employees.value = [];
  }
}

async function loadSystemSettings() {
  try {
    const meta = await getLeaveWorkflowsMetaApi();
    regions.value = meta.regions || [];
    departments.value = meta.departments || [];
    positions.value = meta.positions || [];
  } catch {
    regions.value = [];
    departments.value = [];
    positions.value = [];
  }
}

function openCreateDrawer() {
  drawerRef.value?.open();
}

function openEditDrawer(workflow: any) {
  drawerRef.value?.open(workflow);
}

async function handleDrawerSuccess() {
  await fetchWorkflows();
}

onMounted(() => {
  startLiveClock();
  Promise.all([fetchWorkflows(), fetchEmployees(), loadSystemSettings()]);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <Page v-loading="loading">
    <template #title>请假流程维护</template>
    <template #description>
      为不同员工维护不同审批路线。优先级数字越小越优先匹配。
    </template>
    <template #extra>
      <div style="display: flex; gap: 12px; align-items: center">
        <span style="font-size: 14px; font-weight: 700">{{ currentTime }}</span>
        <ElButton @click="fetchWorkflows">刷新</ElButton>
      </div>
    </template>

    <BasicTable :table-title="`流程列表（共 ${workflows.length} 条）`">
      <template #toolbar-tools>
        <ElButton type="primary" @click="openCreateDrawer">新增流程</ElButton>
      </template>
      <template #name="{ row }">
        <strong>{{ row.name }}</strong>
      </template>
      <template #match="{ row }">
        {{ buildMatchText(row.match) }}
      </template>
      <template #approvers="{ row }">
        <ElTag
          v-for="(item, index) in row.approvers"
          :key="index"
          size="small"
          type="info"
          style="margin-right: 4px"
        >
          {{ index + 1 }}级：{{ item.username }}
        </ElTag>
        <span v-if="!row.approvers.length">-</span>
      </template>
      <template #status="{ row }">
        <ElTag :type="row.is_active ? 'success' : 'danger'" size="small">
          {{ row.is_active ? '启用' : '禁用' }}
        </ElTag>
      </template>
      <template #action="{ row }">
        <ElButton size="small" link type="primary" @click="openEditDrawer(row)">
          编辑
        </ElButton>
        <ElButton
          size="small"
          link
          type="primary"
          @click="toggleWorkflowStatus(row)"
        >
          {{ row.is_active ? '禁用' : '启用' }}
        </ElButton>
        <ElButton size="small" link type="danger" @click="deleteWorkflow(row)">
          删除
        </ElButton>
      </template>
    </BasicTable>

    <WorkflowDrawer
      ref="drawerRef"
      :employee-options="employeeOptions"
      :regions="regions"
      :departments="departments"
      :positions="positions"
      @success="handleDrawerSuccess"
    />
  </Page>
</template>
