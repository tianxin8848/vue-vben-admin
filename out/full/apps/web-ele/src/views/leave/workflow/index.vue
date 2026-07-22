<script lang="ts" setup>
import type { LeaveWorkflowApi } from '#/api';

import { reactive, ref } from 'vue';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import {
  createLeaveWorkflowApi,
  deleteLeaveWorkflowApi,
  getLeaveWorkflowsApi,
  updateLeaveWorkflowApi,
} from '#/api';

const loading = ref(false);
const workflows = ref<LeaveWorkflowApi.LeaveWorkflow[]>([]);

const searchForm = reactive({
  is_active: undefined as boolean | undefined,
});

const showCreateModal = ref(false);
const showEditModal = ref(false);

const workflowForm = reactive<Partial<LeaveWorkflowApi.CreateWorkflowParams>>({
  name: '',
  priority: 0,
  is_active: true,
  match: {
    employee_id: null,
    department: null,
    region: null,
    position: null,
  },
  approvers: [],
});

const editingId = ref('');

async function fetchWorkflows() {
  loading.value = true;
  try {
    workflows.value = await getLeaveWorkflowsApi(searchForm);
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  fetchWorkflows();
}

function handleReset() {
  searchForm.is_active = undefined;
  fetchWorkflows();
}

function openCreateModal() {
  workflowForm.name = '';
  workflowForm.priority = 0;
  workflowForm.is_active = true;
  workflowForm.match = {
    employee_id: null,
    department: null,
    region: null,
    position: null,
  };
  workflowForm.approvers = [];
  showCreateModal.value = true;
}

function openEditModal(workflow: LeaveWorkflowApi.LeaveWorkflow) {
  editingId.value = workflow.id;
  workflowForm.name = workflow.name;
  workflowForm.priority = workflow.priority;
  workflowForm.is_active = workflow.is_active;
  workflowForm.match = { ...workflow.match };
  workflowForm.approvers = [...workflow.approvers];
  showEditModal.value = true;
}

async function handleCreate() {
  if (!workflowForm.name) {
    ElMessage.warning('请输入流程名称');
    return;
  }
  try {
    await createLeaveWorkflowApi(
      workflowForm as LeaveWorkflowApi.CreateWorkflowParams,
    );
    ElMessage.success('创建成功');
    showCreateModal.value = false;
    fetchWorkflows();
  } catch {
    ElMessage.error('创建失败');
  }
}

async function handleEdit() {
  if (!workflowForm.name) {
    ElMessage.warning('请输入流程名称');
    return;
  }
  try {
    await updateLeaveWorkflowApi(editingId.value, workflowForm);
    ElMessage.success('更新成功');
    showEditModal.value = false;
    fetchWorkflows();
  } catch {
    ElMessage.error('更新失败');
  }
}

async function handleDelete(id: string) {
  try {
    await deleteLeaveWorkflowApi(id);
    ElMessage.success('删除成功');
    fetchWorkflows();
  } catch {
    ElMessage.error('删除失败');
  }
}

fetchWorkflows();
</script>

<template>
  <div class="workflow-page">
    <h2>审批流程管理</h2>
    <ElForm :model="searchForm" inline class="search-form">
      <ElFormItem label="状态">
        <ElSelect v-model="searchForm.is_active" placeholder="请选择" clearable>
          <ElOption label="启用" :value="true" />
          <ElOption label="禁用" :value="false" />
        </ElSelect>
      </ElFormItem>
      <ElButton type="primary" @click="handleSearch">搜索</ElButton>
      <ElButton @click="handleReset">重置</ElButton>
      <ElButton type="primary" @click="openCreateModal">新增流程</ElButton>
    </ElForm>

    <ElTable :data="workflows" border stripe v-loading="loading">
      <ElTableColumn prop="name" label="流程名称" />
      <ElTableColumn prop="priority" label="优先级" />
      <ElTableColumn label="匹配条件">
        <template #default="{ row }">
          <span v-if="row.match.department">{{ row.match.department }}</span>
          <span v-else-if="row.match.position">{{ row.match.position }}</span>
          <span v-else-if="row.match.region">{{ row.match.region }}</span>
          <span v-else-if="row.match.employee_id">{{
            row.match.employee_id
          }}</span>
          <span v-else class="text-muted">全部</span>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="approvers" label="审批人">
        <template #default="{ row }">
          {{
            (row as LeaveWorkflowApi.LeaveWorkflow).approvers
              .map(
                (a: LeaveWorkflowApi.WorkflowApprover) =>
                  a.full_name || a.username,
              )
              .join(', ') || '-'
          }}
        </template>
      </ElTableColumn>
      <ElTableColumn prop="is_active" label="状态">
        <template #default="{ row }">
          <ElTag :type="row.is_active ? 'success' : 'danger'">
            {{ row.is_active ? '启用' : '禁用' }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="created_at" label="创建时间" />
      <ElTableColumn label="操作" width="200">
        <template #default="{ row }">
          <ElButton
            size="small"
            @click="openEditModal(row as LeaveWorkflowApi.LeaveWorkflow)"
            >
编辑
</ElButton>
          <ElButton size="small" type="danger" @click="handleDelete(row.id)">
            删除
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>

    <ElDialog v-model="showCreateModal" title="新增审批流程" width="600px">
      <ElForm :model="workflowForm" label-width="100px">
        <ElFormItem label="流程名称">
          <ElInput v-model="workflowForm.name" />
        </ElFormItem>
        <ElFormItem label="优先级">
          <ElInput v-model.number="workflowForm.priority" type="number" />
        </ElFormItem>
        <ElFormItem label="匹配部门">
          <ElInput
            v-model="workflowForm.match!.department"
            placeholder="为空则不限制"
          />
        </ElFormItem>
        <ElFormItem label="匹配职位">
          <ElInput
            v-model="workflowForm.match!.position"
            placeholder="为空则不限制"
          />
        </ElFormItem>
        <ElFormItem label="匹配区域">
          <ElInput
            v-model="workflowForm.match!.region"
            placeholder="为空则不限制"
          />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSwitch
            v-model="workflowForm.is_active"
            active-text="启用"
            inactive-text="禁用"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showCreateModal = false">取消</ElButton>
        <ElButton type="primary" @click="handleCreate">确定</ElButton>
      </template>
    </ElDialog>

    <ElDialog v-model="showEditModal" title="编辑审批流程" width="600px">
      <ElForm :model="workflowForm" label-width="100px">
        <ElFormItem label="流程名称">
          <ElInput v-model="workflowForm.name" />
        </ElFormItem>
        <ElFormItem label="优先级">
          <ElInput v-model.number="workflowForm.priority" type="number" />
        </ElFormItem>
        <ElFormItem label="匹配部门">
          <ElInput
            v-model="workflowForm.match!.department"
            placeholder="为空则不限制"
          />
        </ElFormItem>
        <ElFormItem label="匹配职位">
          <ElInput
            v-model="workflowForm.match!.position"
            placeholder="为空则不限制"
          />
        </ElFormItem>
        <ElFormItem label="匹配区域">
          <ElInput
            v-model="workflowForm.match!.region"
            placeholder="为空则不限制"
          />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSwitch
            v-model="workflowForm.is_active"
            active-text="启用"
            inactive-text="禁用"
          />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showEditModal = false">取消</ElButton>
        <ElButton type="primary" @click="handleEdit">确定</ElButton>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
.workflow-page {
  padding: 20px;
}

.search-form {
  margin-bottom: 20px;
}

.text-muted {
  color: #999;
}
</style>
