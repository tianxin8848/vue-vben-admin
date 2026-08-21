<script lang="ts" setup>
import type { WorkflowForm } from '../data';

import { reactive, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import {
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
} from 'element-plus';

import { createLeaveWorkflowApi, updateLeaveWorkflowApi } from '#/api';

import {
  createDefaultApproverLevels,
  createDefaultWorkflowForm,
} from '../data';

interface EmployeeOption {
  full_name: null | string;
  label: string;
  username: string;
  value: string;
}

const props = defineProps<{
  departments: string[];
  employeeOptions: EmployeeOption[];
  positions: string[];
  regions: string[];
}>();

const emit = defineEmits<{
  success: [];
}>();

const editingId = ref('');

const workflowForm = reactive<WorkflowForm>(createDefaultWorkflowForm());
const approverLevels = ref<string[][]>(createDefaultApproverLevels());

const [Drawer, drawerApi] = useVbenDrawer({
  confirmText: '保存流程',
  cancelText: '取消',
  onClosed: resetForm,
  onConfirm: saveWorkflow,
  title: '新增流程',
});

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
  approverLevels.value = createDefaultApproverLevels();
}

function syncApproversFromLevels() {
  workflowForm.approvers = approverLevels.value
    .map((level) => {
      const userId = level[0];
      if (!userId) return null;
      const emp = props.employeeOptions.find((e) => e.value === userId);
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

  drawerApi.lock(true);
  try {
    if (editingId.value) {
      await updateLeaveWorkflowApi(editingId.value, payload);
      ElMessage.success('流程已更新');
    } else {
      await createLeaveWorkflowApi(payload);
      ElMessage.success('流程已创建');
    }
    drawerApi.close();
    emit('success');
  } catch {
    ElMessage.error('保存失败');
  } finally {
    drawerApi.lock(false);
  }
}

function resetForm() {
  editingId.value = '';
  Object.assign(workflowForm, createDefaultWorkflowForm());
  approverLevels.value = createDefaultApproverLevels();
}

function open(workflow?: any) {
  if (workflow) {
    editingId.value = workflow.id;
    workflowForm.name = workflow.name || '';
    workflowForm.priority = workflow.priority || 100;
    workflowForm.match = {
      employee_id: workflow.match?.employee_id || '',
      region: workflow.match?.region || '',
      department: workflow.match?.department || '',
      position: workflow.match?.position || '',
    };
    approverLevels.value = (workflow.approvers || []).map((a: any) => [
      a.user_id,
    ]);
    if (approverLevels.value.length === 0) {
      approverLevels.value = [['']];
    }
    drawerApi.setState({
      title: '编辑流程',
      confirmText: '更新流程',
    });
  } else {
    resetForm();
    drawerApi.setState({
      title: '新增流程',
      confirmText: '保存流程',
    });
  }
  drawerApi.open();
}

defineExpose({ open });
</script>

<template>
  <Drawer class="w-[640px]">
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
            <ElOption v-for="d in departments" :key="d" :label="d" :value="d" />
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
              <ElSelect v-model="level[0]" placeholder="请选择审批人" clearable>
                <ElOption
                  v-for="emp in employeeOptions"
                  :key="emp.value"
                  :label="emp.label"
                  :value="emp.value"
                />
              </ElSelect>
              <ElButton
                :disabled="approverLevels.length <= 1"
                @click="removeApproverLevel(index)"
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
    </ElForm>
  </Drawer>
</template>

<style scoped>
.field-row {
  display: flex;
  gap: 12px;
}

.field-row > * {
  flex: 1;
}

.multi-select-box {
  width: 100%;
}

.multi-select-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.multi-select-summary {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.approver-levels {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.approver-level-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.approver-level-badge {
  flex-shrink: 0;
  padding: 2px 8px;
  font-size: 12px;
  color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
  border-radius: 4px;
}

.hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
