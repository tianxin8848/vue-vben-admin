<script lang="ts" setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import { ElButton, ElMessage, ElTag } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteLeaveWorkflowApi,
  getEmployeesApi,
  getLeaveWorkflowsApi,
  getLeaveWorkflowsMetaApi,
  updateLeaveWorkflowApi,
} from '#/api';
import { $t } from '#/locales';
import { confirmDelete } from '#/utils/modal';

import WorkflowDrawer from './components/WorkflowDrawer.vue';
import { createGridOptions } from './data';

const loading = ref(false);

const currentTime = ref('');
let timer: null | number = null;

const workflows = ref<any[]>([]);
const employees = ref<any[]>([]);
const regions = ref<string[]>([]);
const departments = ref<string[]>([]);
const positions = ref<string[]>([]);

const gridOptions = computed(() => createGridOptions($t));

const [BasicTable, tableApi] = useVbenVxeGrid({
  gridOptions: gridOptions.value,
  gridEvents: {
    toolbarToolClick(event: { code: string }) {
      if (event.code === 'manual-refresh') {
        fetchWorkflows();
      }
    },
  },
});

watch(gridOptions, () => {
  tableApi.setGridOptions(gridOptions.value);
});

const employeeOptions = computed(() => {
  return employees.value.map((emp) => ({
    label: `${emp.username || ''} / ${emp.full_name || $t('page.leave.workflowMaintenance.unnamed')}`,
    value: emp.id,
    username: emp.username || '',
    full_name: emp.full_name || null,
  }));
});

const drawerRef = ref<InstanceType<typeof WorkflowDrawer>>();

function formatNow() {
  const now = new Date();
  const weekKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const weekLabels = weekKeys.map(
    (k) => $t(`page.leave.calendarView.weekdays.${k}`) as string,
  );
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
      `${$t('page.leave.workflowMaintenance.employeeLabel')}${emp ? `${emp.username} / ${emp.full_name || $t('page.leave.workflowMaintenance.unnamed')}` : match.employee_id}`,
    );
  }
  if (match.region)
    parts.push(
      `${$t('page.leave.workflowMaintenance.regionLabel')}${match.region}`,
    );
  if (match.department)
    parts.push(
      `${$t('page.leave.workflowMaintenance.departmentLabel')}${match.department}`,
    );
  if (match.position)
    parts.push(
      `${$t('page.leave.workflowMaintenance.positionLabel')}${match.position}`,
    );
  return parts.length > 0
    ? parts.join('，')
    : $t('page.leave.workflowMaintenance.globalDefault');
}

async function toggleWorkflowStatus(workflow: any) {
  loading.value = true;
  try {
    await updateLeaveWorkflowApi(workflow.id, {
      is_active: !workflow.is_active,
    });
    await fetchWorkflows();
    ElMessage.success(
      workflow.is_active
        ? $t('page.leave.workflowMaintenance.toggleDisabled')
        : $t('page.leave.workflowMaintenance.toggleEnabled'),
    );
  } catch {
    ElMessage.error($t('page.leave.workflowMaintenance.operationFailed'));
  } finally {
    loading.value = false;
  }
}

async function deleteWorkflow(workflow: any) {
  const confirmed = await confirmDelete({
    message: $t('page.leave.workflowMaintenance.confirmDelete', {
      name: workflow.name,
    }),
    title: $t('page.leave.workflowMaintenance.confirmDeleteTitle'),
  });
  if (!confirmed) return;
  loading.value = true;
  try {
    await deleteLeaveWorkflowApi(workflow.id);
    await fetchWorkflows();
    ElMessage.success($t('page.leave.workflowMaintenance.deleteSuccess'));
  } catch {
    ElMessage.error($t('page.leave.workflowMaintenance.deleteFailed'));
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
    <template #title>{{ $t('page.leave.workflowMaintenance.title') }}</template>
    <template #description>
      {{ $t('page.leave.workflowMaintenance.description') }}
    </template>
    <template #extra>
      <div style="display: flex; gap: 12px; align-items: center">
        <span style="font-size: 14px; font-weight: 700">{{ currentTime }}</span>
        <ElButton @click="fetchWorkflows">
          {{ $t('page.leave.workflowMaintenance.refresh') }}
        </ElButton>
      </div>
    </template>

    <BasicTable
      :table-title="
        $t('page.leave.workflowMaintenance.listTitle', {
          count: workflows.length,
        })
      "
    >
      <template #toolbar-tools>
        <ElButton type="primary" @click="openCreateDrawer">
          {{ $t('page.leave.workflowMaintenance.create') }}
        </ElButton>
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
          {{
            $t('page.leave.workflowMaintenance.approverLevel', {
              index: index + 1,
              username: item.username,
            })
          }}
        </ElTag>
        <span v-if="!row.approvers.length">-</span>
      </template>
      <template #status="{ row }">
        <ElTag :type="row.is_active ? 'success' : 'danger'" size="small">
          {{
            row.is_active
              ? $t('page.leave.workflowMaintenance.enabled')
              : $t('page.leave.workflowMaintenance.disabled')
          }}
        </ElTag>
      </template>
      <template #action="{ row }">
        <ElButton size="small" link type="primary" @click="openEditDrawer(row)">
          {{ $t('page.leave.workflowMaintenance.edit') }}
        </ElButton>
        <ElButton
          size="small"
          link
          type="primary"
          @click="toggleWorkflowStatus(row)"
        >
          {{
            row.is_active
              ? $t('page.leave.workflowMaintenance.disable')
              : $t('page.leave.workflowMaintenance.enable')
          }}
        </ElButton>
        <ElButton size="small" link type="danger" @click="deleteWorkflow(row)">
          {{ $t('page.leave.workflowMaintenance.delete') }}
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
