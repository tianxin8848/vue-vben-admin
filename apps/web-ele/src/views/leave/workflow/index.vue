<script lang="ts" setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

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
} from 'element-plus';

import {
  createLeaveWorkflowApi,
  deleteLeaveWorkflowApi,
  getEmployeesApi,
  getLeaveWorkflowsApi,
  getSystemSettingsApi,
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
  approvers: [] as { full_name: null | string; user_id: string; username: string; }[],
});

const approverLevels = ref<string[][]>([['']]);

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
  const weekLabels = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
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
    parts.push(`员工：${emp ? `${emp.username} / ${emp.full_name || '未命名'}` : match.employee_id}`);
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
    .filter((a): a is { full_name: null | string; user_id: string; username: string; } => a !== null);
}

function validateApprovers() {
  const selectedIds = approverLevels.value.map((level) => level[0]).filter((id): id is string => !!id);
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
  approverLevels.value = (workflow.approvers || []).map((a: any) => [a.user_id]);
  if (approverLevels.value.length === 0) {
    approverLevels.value = [['']];
  }
}

async function toggleWorkflowStatus(workflow: any) {
  loading.value = true;
  try {
    await updateLeaveWorkflowApi(workflow.id, { is_active: !workflow.is_active });
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
  } catch {
    workflows.value = [];
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
    const settings = await getSystemSettingsApi();
    regions.value = settings.regions || [];
    departments.value = settings.departments || [];
    positions.value = settings.positions || [];
  } catch {
    regions.value = [];
    departments.value = [];
    positions.value = [];
  }
}

function goBackHome() {
  router.push('/employee');
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
  <div class="workflow-page" v-loading="loading">
    <div class="page-header">
      <div class="header-info">
        <h2>请假流程维护</h2>
        <p class="page-subtitle">为不同员工维护不同审批路线。优先级数字越小越优先匹配。</p>
        <div class="live-time">{{ currentTime }}</div>
      </div>
      <div class="header-actions">
        <ElButton @click="goBackHome">返回工作台</ElButton>
        <ElButton @click="fetchWorkflows">刷新</ElButton>
      </div>
    </div>

    <div class="subnav">
      <span class="subnav-link" @click="goToCalendar">请假日历</span>
      <span class="subnav-link active">流程维护</span>
    </div>

    <div class="panel-grid">
      <ElCard class="card form-panel">
        <template #header>
          <h3>{{ formTitle }}</h3>
        </template>

        <ElForm :model="workflowForm" label-width="100px">
          <ElFormItem label="流程名称" required>
            <ElInput v-model="workflowForm.name" placeholder="例如：大陆-研发部-经理审批" />
          </ElFormItem>

          <div class="field-row">
            <ElFormItem label="优先级">
              <ElInput v-model.number="workflowForm.priority" type="number" :min="1" :max="9999" />
            </ElFormItem>
            <ElFormItem label="指定员工">
              <ElSelect v-model="workflowForm.match.employee_id" placeholder="不指定" clearable>
                <ElOption v-for="emp in employeeOptions" :key="emp.value" :label="emp.label" :value="emp.value" />
              </ElSelect>
            </ElFormItem>
          </div>

          <div class="field-row">
            <ElFormItem label="地区">
              <ElSelect v-model="workflowForm.match.region" placeholder="不限制" clearable>
                <ElOption v-for="r in regions" :key="r" :label="r" :value="r" />
              </ElSelect>
            </ElFormItem>
            <ElFormItem label="部门">
              <ElSelect v-model="workflowForm.match.department" placeholder="不限制" clearable>
                <ElOption v-for="d in departments" :key="d" :label="d" :value="d" />
              </ElSelect>
            </ElFormItem>
          </div>

          <ElFormItem label="岗位">
            <ElSelect v-model="workflowForm.match.position" placeholder="不限制" clearable>
              <ElOption v-for="p in positions" :key="p" :label="p" :value="p" />
            </ElSelect>
          </ElFormItem>

          <ElFormItem label="审批人链">
            <div class="multi-select-box">
              <div class="multi-select-actions">
                <ElButton type="primary" @click="addApproverLevel">+ 添加一级</ElButton>
                <ElButton @click="clearApproverLevels">清空</ElButton>
                <span class="multi-select-summary">{{ getApproverLevelsSummary() }}</span>
              </div>
              <div class="approver-levels">
                <div v-for="(level, index) in approverLevels" :key="index" class="approver-level-row">
                  <span class="approver-level-badge">第{{ index + 1 }}级</span>
                  <ElSelect v-model="level[0]" placeholder="请选择审批人" clearable>
                    <ElOption v-for="emp in employeeOptions" :key="emp.value" :label="emp.label" :value="emp.value" />
                  </ElSelect>
                  <ElButton @click="removeApproverLevel(index)" :disabled="approverLevels.length <= 1">删除</ElButton>
                </div>
              </div>
            </div>
            <div class="hint">审批会按第 1 级 → 第 N 级依次流转。流程会按"优先级 + 条件匹配"选择一条审批路线。</div>
          </ElFormItem>

          <div class="form-actions">
            <ElButton type="primary" @click="saveWorkflow">{{ editingId ? '更新流程' : '保存流程' }}</ElButton>
            <ElButton v-if="editingId" @click="resetForm">取消编辑</ElButton>
          </div>
        </ElForm>
      </ElCard>

      <ElCard class="card list-panel">
        <template #header>
          <h3>流程列表</h3>
        </template>

        <div class="hint" style="margin-bottom:14px;">共 {{ workflows.length }} 条流程</div>

        <div class="table-container">
          <table class="workflow-table">
            <thead>
              <tr>
                <th>名称</th>
                <th>匹配条件</th>
                <th>审批链</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="workflows.length === 0">
                <td colspan="5" style="color:#64748b;">暂无数据</td>
              </tr>
              <tr v-for="workflow in workflows" :key="workflow.id">
                <td>
                  <strong>{{ workflow.name }}</strong>
                  <div class="hint" style="margin:6px 0 0;font-size:12px;">优先级：{{ workflow.priority }}</div>
                </td>
                <td>{{ buildMatchText(workflow.match) }}</td>
                <td>
                  <span v-for="(item, index) in workflow.approvers" :key="index" class="tag">
                    {{ (index as number) + 1 }}级：{{ item.username }}
                  </span>
                  <span v-if="!workflow.approvers.length">-</span>
                </td>
                <td>
                  <span class="tag" :class="[workflow.is_active ? 'tag-success' : 'tag-danger']">
                    {{ workflow.is_active ? '启用' : '禁用' }}
                  </span>
                </td>
                <td>
                  <span class="row-action" @click="startEdit(workflow)">编辑</span>
                  <br />
                  <span class="row-action muted" @click="toggleWorkflowStatus(workflow)">
                    {{ workflow.is_active ? '禁用' : '启用' }}
                  </span>
                  <br />
                  <span class="row-action muted" @click="deleteWorkflow(workflow)">删除</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </ElCard>
    </div>
  </div>
</template>

<style scoped>
.workflow-page {
  padding: 32px;
  background: #f8fafc;
  min-height: calc(100vh - 80px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 10px;
}

.header-info h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
}

.page-subtitle {
  margin: 8px 0 0;
  color: #64748b;
  font-size: 14px;
}

.live-time {
  margin-top: 10px;
  color: #2563eb;
  font-size: 14px;
  font-weight: 700;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.subnav {
  display: inline-flex;
  gap: 10px;
  margin: 6px 0 18px;
  padding: 6px;
  border-radius: 14px;
  background: #e2e8f0;
}

.subnav-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 14px;
  border-radius: 12px;
  color: #0f172a;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
}

.subnav-link.active {
  background: #2563eb;
  color: #fff;
}

.panel-grid {
  display: grid;
  grid-template-columns: minmax(380px, 0.9fr) 1.1fr;
  gap: 18px;
}

.card {
  border-radius: 18px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.card :deep(.el-card__header) {
  padding: 0 0 12px;
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

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.hint {
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
  margin-top: 8px;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.multi-select-box {
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  padding: 12px 14px;
  background: #f8fafc;
}

.multi-select-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 10px;
}

.multi-select-summary {
  color: #475569;
  font-size: 13px;
  font-weight: 700;
}

.approver-levels {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.approver-level-row {
  display: grid;
  grid-template-columns: 84px 1fr 72px;
  gap: 10px;
  align-items: center;
}

.approver-level-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 10px;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 800;
  text-align: center;
}

.table-container {
  overflow-x: auto;
}

.workflow-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.workflow-table th,
.workflow-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #e2e8f0;
  text-align: left;
  vertical-align: top;
}

.workflow-table th {
  color: #475569;
  font-weight: 700;
}

.tag {
  display: inline-block;
  margin: 2px 6px 2px 0;
  padding: 4px 8px;
  border-radius: 999px;
  background: #e0f2fe;
  color: #0369a1;
  font-size: 12px;
}

.tag-success {
  background: #dcfce7;
  color: #166534;
}

.tag-danger {
  background: #fee2e2;
  color: #991b1b;
}

.row-action {
  color: #2563eb;
  cursor: pointer;
  font-weight: 700;
}

.row-action.muted {
  color: #475569;
}

@media (max-width: 1280px) {
  .panel-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .field-row {
    grid-template-columns: 1fr;
  }
  .approver-level-row {
    grid-template-columns: 1fr;
  }
}
</style>
