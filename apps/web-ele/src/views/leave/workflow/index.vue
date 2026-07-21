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
  ElPagination,
  ElSelect,
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
const total = ref(0);
const page = ref(1);
const pageSize = ref(10);

const searchForm = reactive({
  leaveType: '',
  isActive: undefined as boolean | undefined,
});

const showCreateModal = ref(false);
const showEditModal = ref(false);

const workflowForm = reactive<Partial<LeaveWorkflowApi.CreateWorkflowParams>>({
  name: '',
  leaveType: 'all',
  description: '',
  nodes: [],
  isActive: true,
});

const editingId = ref('');

const leaveTypeOptions = [
  { label: '全部类型', value: 'all' },
  { label: '病假', value: 'sick' },
  { label: '年假', value: 'annual' },
  { label: '事假', value: 'personal' },
  { label: '产假', value: 'maternity' },
  { label: '陪产假', value: 'paternity' },
  { label: '其他', value: 'other' },
];

function formatLeaveType(type: string) {
  return leaveTypeOptions.find((o) => o.value === type)?.label || type;
}

async function fetchWorkflows() {
  loading.value = true;
  try {
    const res = await getLeaveWorkflowsApi({
      page: page.value,
      pageSize: pageSize.value,
      ...searchForm,
    });
    workflows.value = res.data;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  page.value = 1;
  fetchWorkflows();
}

function handleReset() {
  searchForm.leaveType = '';
  searchForm.isActive = undefined;
  fetchWorkflows();
}

function handlePageChange(val: number) {
  page.value = val;
  fetchWorkflows();
}

function handlePageSizeChange(val: number) {
  pageSize.value = val;
  page.value = 1;
  fetchWorkflows();
}

function openCreateModal() {
  workflowForm.name = '';
  workflowForm.leaveType = 'all';
  workflowForm.description = '';
  workflowForm.nodes = [];
  workflowForm.isActive = true;
  showCreateModal.value = true;
}

function openEditModal(workflow: any) {
  editingId.value = workflow.id;
  workflowForm.name = workflow.name;
  workflowForm.leaveType = workflow.leaveType;
  workflowForm.description = workflow.description;
  workflowForm.nodes = [...workflow.nodes];
  workflowForm.isActive = workflow.isActive;
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
      <ElFormItem label="请假类型">
        <ElSelect v-model="searchForm.leaveType" placeholder="请选择" clearable>
          <ElOption
            v-for="opt in leaveTypeOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="状态">
        <ElSelect v-model="searchForm.isActive" placeholder="请选择" clearable>
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
      <ElTableColumn prop="leaveType" label="适用类型">
        <template #default="{ row }">
          {{ formatLeaveType(row.leaveType) }}
        </template>
      </ElTableColumn>
      <ElTableColumn prop="description" label="描述" show-overflow-tooltip />
      <ElTableColumn prop="nodes" label="审批节点数">
        <template #default="{ row }">{{ row.nodes.length }} 个</template>
      </ElTableColumn>
      <ElTableColumn prop="isActive" label="状态">
        <template #default="{ row }">
          <ElTag :type="row.isActive ? 'success' : 'danger'">
            {{ row.isActive ? '启用' : '禁用' }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="createdAt" label="创建时间" />
      <ElTableColumn label="操作" width="200">
        <template #default="{ row }">
          <ElButton size="small" @click="openEditModal(row)">编辑</ElButton>
          <ElButton size="small" type="danger" @click="handleDelete(row.id)">
            删除
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>

    <ElPagination
      :current-page="page"
      :page-size="pageSize"
      :total="total"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handlePageSizeChange"
      @current-change="handlePageChange"
      class="pagination"
    />

    <ElDialog v-model="showCreateModal" title="新增审批流程" width="600px">
      <ElForm :model="workflowForm" label-width="100px">
        <ElFormItem label="流程名称">
          <ElInput v-model="workflowForm.name" />
        </ElFormItem>
        <ElFormItem label="适用类型">
          <ElSelect v-model="workflowForm.leaveType">
            <ElOption
              v-for="opt in leaveTypeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="描述">
          <ElInput
            v-model="workflowForm.description"
            type="textarea"
            :rows="3"
          />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSwitch
            v-model="workflowForm.isActive"
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
        <ElFormItem label="适用类型">
          <ElSelect v-model="workflowForm.leaveType">
            <ElOption
              v-for="opt in leaveTypeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="描述">
          <ElInput
            v-model="workflowForm.description"
            type="textarea"
            :rows="3"
          />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSwitch
            v-model="workflowForm.isActive"
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

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
