<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { LeaveWorkflowApi } from '#/api';

import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElTag,
} from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createLeaveWorkflowApi,
  deleteLeaveWorkflowApi,
  getEmployeesApi,
  getLeaveWorkflowsApi,
  getLeaveWorkflowsMetaApi,
  updateLeaveWorkflowApi,
} from '#/api';

const router = useRouter();
const loading = ref(false);

const currentTime = ref('');
let timer: null | number = null;

const workflows = ref<any[]>([]);
const employees = ref<any[]>([]);
const regions = ref<string[]>([]);
const departments = ref<string[]>([]);
const positions = ref<string[]>([]);

const editingId = ref('');
const formTitle = ref('新增流程');

const workflowForm = reactive({
  name: '',
  priority: 100,
  match: {
    employee_id: '',
    region: '',
    department: '',
    position: '',
  },
  approvers: [] as {
    full_name: null | string;
    user_id: string;
    username: string;
  }[],
});

const approverLevels = ref<string[][]>([['']]);

const gridOptions: VxeGridProps<LeaveWorkflowApi.LeaveWorkflow> = {
  id: 'leave-workflow-index',
  rowConfig: {
    keyField: 'id',
  },
  columns: [
    {
      field: 'name',
      title: '名称',
      minWidth: 180,
      slots: { default: 'name' },
    },
    { field: 'priority', title: '优先级', width: 90 },
    {
      title: '匹配条件',
      minWidth: 220,
      slots: { default: 'match' },
    },
    {
      title: '审批链',
      minWidth: 260,
      slots: { default: 'approvers' },
    },
    {
      field: 'is_active',
      title: '状态',
      width: 90,
      slots: { default: 'status' },
    },
    {
      title: '操作',
      width: 180,
      fixed: 'right',
      slots: { default: 'action' },
    },
  ],
  proxyConfig: {
    enabled: false,
  },
  toolbarConfig: {
    zoom: true,
    custom: true,
    tools: [
      {
        code: 'manual-refresh',
        icon: 'vxe-icon-refresh',
        circle: true,
        name: '刷新',
      },
    ],
  },
  customConfig: {
    storage: false,
  },
};

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

function getApproverLevelsSummary() {
  return `已设置 ${approverLevels.value.length} 级`;
}

function addApproverLevel() {
  approverLevels.value.push(['']);
}

function removeApproverLevel(index: number) {
  if (approverLevels.value.length <= 1) return;
  approverLevels.value.splice(index, 1);
}

function clearApproverLevels() {
  approverLevels.value = [['']];
}

function syncApproversFromLevels() {
  workflowForm.approvers = approverLevels.value
    .map((level) => {
      const userId = level[0];
      if (!userId) return null;
      const emp = employeeOptions.value.find((e) => e.value === userId);
      if (!emp) return null;
      return {
        user_id: emp.value,
        username: emp.username,
        full_name: emp.full_name,
      };
    })
    .filter(
      (
        a,
      ): a is { full_name: null | string; user_id: string; username: string } =>
        a !== null,
    );
}

function validateApprovers() {
  const selectedIds = approverLevels.value
    .map((level) => level[0])
    .filter((id): id is string => !!id);
  if (selectedIds.length === 0) {
    ElMessage.error('请至少添加 1 级审批人');
    return false;
  }
  const seen = new Set<string>();
  const duplicates = selectedIds.filter((id) => {
    if (seen.has(id)) return true;
    seen.add(id);
    return false;
  });
  if (duplicates.length > 0) {
    ElMessage.error('审批人链中不能重复选择同一个人');
    return false;
  }
  return true;
}

async function saveWorkflow() {
  if (!workflowForm.name.trim()) {
    ElMessage.error('请输入流程名称');
    return;
  }
  if (!validateApprovers()) return;
  syncApproversFromLevels();

  const payload = {
    name: workflowForm.name.trim(),
    priority: Number(workflowForm.priority) || 100,
    match: {
      employee_id: workflowForm.match.employee_id || null,
      region: workflowForm.match.region || null,
      department: workflowForm.match.department || null,
      position: workflowForm.match.position || null,
    },
    approvers: workflowForm.approvers,
    is_active: true,
  };

  loading.value = true;
  try {
    if (editingId.value) {
      await updateLeaveWorkflowApi(editingId.value, payload);
      ElMessage.success('流程已更新');
    } else {
      await createLeaveWorkflowApi(payload);
      ElMessage.success('流程已创建');
    }
    resetForm();
    await fetchWorkflows();
  } catch {
    ElMessage.error('保存失败');
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  editingId.value = '';
  formTitle.value = '新增流程';
  workflowForm.name = '';
  workflowForm.priority = 100;
  workflowForm.match = {
    employee_id: '',
    region: '',
    department: '',
    position: '',
  };
  approverLevels.value = [['']];
}

function startEdit(workflow: any) {
  editingId.value = workflow.id;
  formTitle.value = '编辑流程';
  workflowForm.name = workflow.name || '';
  workflowForm.priority = workflow.priority || 100;
  workflowForm.match = {
    employee_id: (workflow.match && workflow.match.employee_id) || '',
    region: (workflow.match && workflow.match.region) || '',
    department: (workflow.match && workflow.match.department) || '',
    position: (workflow.match && workflow.match.position) || '',
  };
  approverLevels.value = (workflow.approvers || []).map((a: any) => [
    a.user_id,
  ]);
  if (approverLevels.value.length === 0) {
    approverLevels.value = [['']];
  }
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
    if (editingId.value === workflow.id) {
      resetForm();
    }
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

function goToCalendar() {
  router.push('/employee/manage/leave');
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

    <span class="subnav-link" @click="goToCalendar">请假日历</span>
    <span class="subnav-link active">流程维护</span>

    <ElCard class="card form-panel">
      <template #header>
        <h3>{{ formTitle }}</h3>
      </template>

      <ElForm :model="workflowForm" label-width="100px">
        <ElFormItem label="流程名称" required>
          <ElInput
            v-model="workflowForm.name"
            placeholder="例如：大陆-研发部-经理审批"
          />
        </ElFormItem>

        <div class="field-row">
          <ElFormItem label="优先级">
            <ElInput
              v-model.number="workflowForm.priority"
              type="number"
              :min="1"
              :max="9999"
            />
          </ElFormItem>
          <ElFormItem label="指定员工">
            <ElSelect
              v-model="workflowForm.match.employee_id"
              placeholder="不指定"
              clearable
            >
              <ElOption
                v-for="emp in employeeOptions"
                :key="emp.value"
                :label="emp.label"
                :value="emp.value"
              />
            </ElSelect>
          </ElFormItem>
        </div>

        <div class="field-row">
          <ElFormItem label="地区">
            <ElSelect
              v-model="workflowForm.match.region"
              placeholder="不限制"
              clearable
            >
              <ElOption v-for="r in regions" :key="r" :label="r" :value="r" />
            </ElSelect>
          </ElFormItem>
          <ElFormItem label="部门">
            <ElSelect
              v-model="workflowForm.match.department"
              placeholder="不限制"
              clearable
            >
              <ElOption
                v-for="d in departments"
                :key="d"
                :label="d"
                :value="d"
              />
            </ElSelect>
          </ElFormItem>
        </div>

        <ElFormItem label="岗位">
          <ElSelect
            v-model="workflowForm.match.position"
            placeholder="不限制"
            clearable
          >
            <ElOption v-for="p in positions" :key="p" :label="p" :value="p" />
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="审批人链">
          <div class="multi-select-box">
            <div class="multi-select-actions">
              <ElButton type="primary" @click="addApproverLevel">
                + 添加一级
              </ElButton>
              <ElButton @click="clearApproverLevels">清空</ElButton>
              <span class="multi-select-summary">{{
                getApproverLevelsSummary()
              }}</span>
            </div>
            <div class="approver-levels">
              <div
                v-for="(level, index) in approverLevels"
                :key="index"
                class="approver-level-row"
              >
                <span class="approver-level-badge">第{{ index + 1 }}级</span>
                <ElSelect
                  v-model="level[0]"
                  placeholder="请选择审批人"
                  clearable
                >
                  <ElOption
                    v-for="emp in employeeOptions"
                    :key="emp.value"
                    :label="emp.label"
                    :value="emp.value"
                  />
                </ElSelect>
                <ElButton
                  @click="removeApproverLevel(index)"
                  :disabled="approverLevels.length <= 1"
                >
                  删除
                </ElButton>
              </div>
            </div>
          </div>
          <div class="hint">
            审批会按第 1 级 → 第 N 级依次流转。流程会按"优先级 +
            条件匹配"选择一条审批路线。
          </div>
        </ElFormItem>

        <div class="form-actions">
          <ElButton type="primary" @click="saveWorkflow">
            {{ editingId ? '更新流程' : '保存流程' }}
          </ElButton>
          <ElButton v-if="editingId" @click="resetForm">取消编辑</ElButton>
        </div>
      </ElForm>
    </ElCard>

    <BasicTable :table-title="`流程列表（共 ${workflows.length} 条）`">
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
        <ElButton size="small" link type="primary" @click="startEdit(row)">
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
  </Page>
</template>
