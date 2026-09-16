<script lang="ts" setup>
import type { WorkflowForm } from '../data';

import { reactive, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { useI18n } from '@vben/locales';

import {
  ElButton,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
} from 'element-plus';

import { createLeaveWorkflowApi, updateLeaveWorkflowApi } from '#/api';
import { handleActionError, toastError, toastSuccess } from '#/utils/message';

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

const { t } = useI18n();

const editingId = ref('');

const workflowForm = reactive<WorkflowForm>(createDefaultWorkflowForm());
const approverLevels = ref<string[][]>(createDefaultApproverLevels());

const [Drawer, drawerApi] = useVbenDrawer({
  confirmText: t('page.leave.workflowMaintenance.drawer.save'),
  cancelText: t('page.leave.workflowMaintenance.drawer.cancel'),
  onClosed: resetForm,
  onConfirm: saveWorkflow,
  title: t('page.leave.workflowMaintenance.drawer.addTitle'),
});

function getApproverLevelsSummary() {
  return t('page.leave.workflowMaintenance.drawer.summary', {
    count: approverLevels.value.length,
  });
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
    toastError(
      t('page.leave.workflowMaintenance.drawer.validation.atLeastOneApprover'),
    );
    return false;
  }
  const seen = new Set<string>();
  const duplicates = selectedIds.filter((id) => {
    if (seen.has(id)) return true;
    seen.add(id);
    return false;
  });
  if (duplicates.length > 0) {
    toastError(
      t('page.leave.workflowMaintenance.drawer.validation.noDuplicate'),
    );
    return false;
  }
  return true;
}

async function saveWorkflow() {
  if (!workflowForm.name.trim()) {
    toastError(
      t('page.leave.workflowMaintenance.drawer.validation.nameRequired'),
    );
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
      toastSuccess(t('page.leave.workflowMaintenance.drawer.message.updated'));
    } else {
      await createLeaveWorkflowApi(payload);
      toastSuccess(t('page.leave.workflowMaintenance.drawer.message.created'));
    }
    drawerApi.close();
    emit('success');
  } catch (error) {
    handleActionError(
      'leave/leave-workflows/WorkflowDrawer',
      error,
      t('page.leave.workflowMaintenance.drawer.message.saveFailed'),
    );
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
      title: t('page.leave.workflowMaintenance.drawer.editTitle'),
      confirmText: t('page.leave.workflowMaintenance.drawer.updateConfirm'),
    });
  } else {
    resetForm();
    drawerApi.setState({
      title: t('page.leave.workflowMaintenance.drawer.addTitle'),
      confirmText: t('page.leave.workflowMaintenance.drawer.save'),
    });
  }
  drawerApi.open();
}

defineExpose({ open });
</script>

<template>
  <Drawer class="w-[640px]">
    <ElForm :model="workflowForm" label-width="100px">
      <ElFormItem
        :label="t('page.leave.workflowMaintenance.drawer.form.nameLabel')"
        required
      >
        <ElInput
          v-model="workflowForm.name"
          :placeholder="
            t('page.leave.workflowMaintenance.drawer.form.namePlaceholder')
          "
        />
      </ElFormItem>

      <div class="field-row">
        <ElFormItem
          :label="t('page.leave.workflowMaintenance.drawer.form.priorityLabel')"
        >
          <ElInput
            v-model.number="workflowForm.priority"
            type="number"
            :min="1"
            :max="9999"
          />
        </ElFormItem>
        <ElFormItem
          :label="t('page.leave.workflowMaintenance.drawer.form.employeeLabel')"
        >
          <ElSelect
            v-model="workflowForm.match.employee_id"
            :placeholder="
              t(
                'page.leave.workflowMaintenance.drawer.form.employeePlaceholder',
              )
            "
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
        <ElFormItem
          :label="t('page.leave.workflowMaintenance.drawer.form.regionLabel')"
        >
          <ElSelect
            v-model="workflowForm.match.region"
            :placeholder="
              t('page.leave.workflowMaintenance.drawer.form.regionPlaceholder')
            "
            clearable
          >
            <ElOption v-for="r in regions" :key="r" :label="r" :value="r" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem
          :label="
            t('page.leave.workflowMaintenance.drawer.form.departmentLabel')
          "
        >
          <ElSelect
            v-model="workflowForm.match.department"
            :placeholder="
              t(
                'page.leave.workflowMaintenance.drawer.form.departmentPlaceholder',
              )
            "
            clearable
          >
            <ElOption v-for="d in departments" :key="d" :label="d" :value="d" />
          </ElSelect>
        </ElFormItem>
      </div>

      <ElFormItem
        :label="t('page.leave.workflowMaintenance.drawer.form.positionLabel')"
      >
        <ElSelect
          v-model="workflowForm.match.position"
          :placeholder="
            t('page.leave.workflowMaintenance.drawer.form.positionPlaceholder')
          "
          clearable
        >
          <ElOption v-for="p in positions" :key="p" :label="p" :value="p" />
        </ElSelect>
      </ElFormItem>

      <ElFormItem
        :label="
          t('page.leave.workflowMaintenance.drawer.form.approverChainLabel')
        "
      >
        <div class="multi-select-box">
          <div class="multi-select-actions">
            <ElButton type="primary" @click="addApproverLevel">
              {{ t('page.leave.workflowMaintenance.drawer.form.addLevel') }}
            </ElButton>
            <ElButton @click="clearApproverLevels">
              {{ t('page.leave.workflowMaintenance.drawer.form.clear') }}
            </ElButton>
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
              <span class="approver-level-badge">{{
                t('page.leave.workflowMaintenance.drawer.form.levelBadge', {
                  index: index + 1,
                })
              }}</span>
              <ElSelect
                v-model="level[0]"
                :placeholder="
                  t(
                    'page.leave.workflowMaintenance.drawer.form.approverPlaceholder',
                  )
                "
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
                :disabled="approverLevels.length <= 1"
                @click="removeApproverLevel(index)"
              >
                {{ t('page.leave.workflowMaintenance.drawer.form.delete') }}
              </ElButton>
            </div>
          </div>
        </div>
        <div class="hint">
          {{ t('page.leave.workflowMaintenance.drawer.form.hint') }}
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
