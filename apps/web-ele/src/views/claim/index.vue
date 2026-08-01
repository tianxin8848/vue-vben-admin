<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { ClaimApi } from '#/api';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { Page, useVbenDrawer } from '@vben/common-ui';

import {
  ElButton,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect,
  ElTag,
  ElUpload,
} from 'element-plus';

import { useVbenForm } from '#/adapter/form';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  createClaimApi,
  getClaimOptionsApi,
  getMyClaimApprovalRecordsApi,
  getMyClaimHistoryApi,
  getMyClaimsApi,
  getMyPendingClaimApprovalsApi,
  getUserInfoApi,
  reviewClaimApi,
} from '#/api';

const loading = ref(false);

const userInfo = ref<null | {
  full_name: string;
  username: string;
}>(null);

// ─── 选项数据 ────────────────────────────────────────────────────────────────
const reasonOptions = ref<ClaimApi.ClaimReasonOption[]>([]);
const currencyOptions = ref<ClaimApi.ClaimCurrencyOption[]>([]);

// ─── Tab 状态 ────────────────────────────────────────────────────────────────
type TabKey = 'history' | 'my' | 'pending' | 'records';
const activeTab = ref<TabKey>('my');

const myClaims = ref<ClaimApi.ClaimResponse[]>([]);
const myHistory = ref<ClaimApi.ClaimResponse[]>([]);
const pendingApprovals = ref<ClaimApi.ClaimResponse[]>([]);
const approvalRecords = ref<ClaimApi.ClaimApprovalRecord[]>([]);

const segmentedOptions = computed(() => [
  { label: '我的报销', value: 'my' },
  { label: '历史记录', value: 'history' },
  { label: '待我审批', value: 'pending' },
  { label: '审批记录', value: 'records' },
]);

const myClaimsTitle = computed(() => `我的报销（${myClaims.value.length} 条）`);
const historyTitle = computed(() => `历史记录（${myHistory.value.length} 条）`);
const pendingTitle = computed(
  () => `待我审批（${pendingApprovals.value.length} 条）`,
);
const recordsTitle = computed(
  () => `审批记录（${approvalRecords.value.length} 条）`,
);

const activeTableTitle = computed(() => {
  const titles: Record<TabKey, string> = {
    history: historyTitle.value,
    my: myClaimsTitle.value,
    pending: pendingTitle.value,
    records: recordsTitle.value,
  };
  return titles[activeTab.value];
});

// ─── 状态映射 ────────────────────────────────────────────────────────────────
const statusLabelMap: Record<string, string> = {
  approved: '已通过',
  pending: '审批中',
  rejected: '已驳回',
  withdrawn: '已撤回',
};

const statusTypeMap: Record<
  string,
  '' | 'danger' | 'info' | 'success' | 'warning'
> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
  withdrawn: 'info',
};

const actionLabelMap: Record<string, string> = {
  approved: '通过',
  created: '提交',
  rejected: '驳回',
  withdrawn: '撤回',
};

function formatStatus(status: string) {
  return statusLabelMap[status] || status;
}

function formatAction(action: string) {
  return actionLabelMap[action] || action;
}

function formatDate(dt: null | string) {
  if (!dt) return '-';
  return dt.replace('T', ' ').slice(0, 16);
}

// ─── 表格列配置 ──────────────────────────────────────────────────────────────
const tabColumns: Record<TabKey, VxeGridProps['columns']> = {
  history: [
    {
      field: 'reason_label',
      title: '报销理由',
      minWidth: 140,
      slots: { default: 'reason' },
    },
    {
      field: 'amount',
      title: '金额',
      minWidth: 130,
      slots: { default: 'amount' },
    },
    {
      field: 'description',
      title: '说明',
      minWidth: 160,
      slots: { default: 'description' },
    },
    {
      field: 'approval_status',
      title: '最终状态',
      width: 100,
      slots: { default: 'status' },
    },
    {
      field: 'review_comment',
      title: '审批意见',
      minWidth: 140,
      slots: { default: 'review_comment' },
    },
    {
      field: 'created_at',
      title: '提交时间',
      width: 160,
      slots: { default: 'created_at' },
    },
  ],
  my: [
    {
      field: 'reason_label',
      title: '报销理由',
      minWidth: 140,
      slots: { default: 'reason' },
    },
    {
      field: 'amount',
      title: '金额',
      minWidth: 130,
      slots: { default: 'amount' },
    },
    {
      field: 'description',
      title: '说明',
      minWidth: 160,
      slots: { default: 'description' },
    },
    {
      field: 'approval_status',
      title: '状态',
      width: 100,
      slots: { default: 'status' },
    },
    {
      field: 'created_at',
      title: '提交时间',
      width: 160,
      slots: { default: 'created_at' },
    },
    {
      field: 'attachment_url',
      title: '附件',
      width: 100,
      slots: { default: 'attachment' },
    },
  ],
  pending: [
    {
      field: 'employee_name',
      title: '申请人',
      minWidth: 150,
      slots: { default: 'employee' },
    },
    {
      field: 'reason_label',
      title: '报销理由',
      minWidth: 130,
      slots: { default: 'reason' },
    },
    {
      field: 'amount',
      title: '金额',
      minWidth: 130,
      slots: { default: 'amount' },
    },
    {
      field: 'description',
      title: '说明',
      minWidth: 160,
      slots: { default: 'description' },
    },
    {
      field: 'created_at',
      title: '提交时间',
      width: 160,
      slots: { default: 'created_at' },
    },
    {
      title: '操作',
      width: 100,
      fixed: 'right',
      slots: { default: 'action' },
    },
  ],
  records: [
    {
      field: 'employee_name',
      title: '申请人',
      minWidth: 150,
      slots: { default: 'employee' },
    },
    {
      field: 'claim_reason_label',
      title: '报销理由',
      minWidth: 130,
      slots: { default: 'reason' },
    },
    {
      field: 'amount',
      title: '金额',
      minWidth: 120,
      slots: { default: 'amount' },
    },
    {
      field: 'action',
      title: '操作',
      width: 90,
      slots: { default: 'record_action' },
    },
    {
      field: 'comment',
      title: '备注',
      minWidth: 140,
      slots: { default: 'comment' },
    },
    {
      field: 'created_at',
      title: '时间',
      width: 160,
      slots: { default: 'created_at' },
    },
  ],
};

function dataFor(tab: TabKey) {
  switch (tab) {
    case 'history': {
      return myHistory.value;
    }
    case 'my': {
      return myClaims.value;
    }
    case 'pending': {
      return pendingApprovals.value;
    }
    case 'records': {
      return approvalRecords.value;
    }
  }
}

const sharedToolbarConfig: VxeGridProps['toolbarConfig'] = {
  custom: true,
  tools: [
    {
      code: 'manual-refresh',
      icon: 'vxe-icon-refresh',
      circle: true,
      name: '刷新',
    },
  ],
};

const [BasicTable, tableApi] = useVbenVxeGrid({
  gridOptions: {
    id: 'claim-index',
    rowConfig: { keyField: 'id' },
    columns: tabColumns.my,
    proxyConfig: { enabled: false },
    height: 'auto',
    keepSource: true,
    toolbarConfig: sharedToolbarConfig,
  },
  gridEvents: {
    toolbarToolClick(event: { code: string }) {
      if (event.code === 'manual-refresh') reloadActiveTab();
    },
  },
});

function refreshTable() {
  tableApi.setGridOptions({
    columns: tabColumns[activeTab.value],
    data: dataFor(activeTab.value),
  });
}

watch(activeTab, () => {
  refreshTable();
});

// ─── 新建报销 ────────────────────────────────────────────────────────────────
const createForm = reactive({
  reason_code: '',
  description: '',
  amount: 0,
  currency: 'HKD',
  attachmentFile: null as File | null,
});

const selectedCurrencyRate = computed(() => {
  const found = currencyOptions.value.find(
    (c) => c.currency_code === createForm.currency,
  );
  return found?.to_hkd_rate ?? 1;
});

const estimatedHkd = computed(() => {
  return Math.round(createForm.amount * selectedCurrencyRate.value * 100) / 100;
});

const [CreateForm] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2 gap-x-4',
  schema: [
    {
      component: 'Input',
      fieldName: 'reason_code',
      label: '报销理由',
      rules: 'required',
      formItemClass: 'col-span-2',
    },
    {
      component: 'Input',
      fieldName: 'amount',
      label: '金额',
      rules: 'required',
      formItemClass: 'col-span-1',
    },
    {
      component: 'Input',
      fieldName: 'currency',
      label: '币种',
      rules: 'required',
      formItemClass: 'col-span-1',
    },
    {
      component: 'Input',
      fieldName: 'description',
      label: '说明',
      formItemClass: 'col-span-2',
    },
    {
      component: 'Input',
      fieldName: 'attachment',
      label: '附件',
      rules: 'required',
      formItemClass: 'col-span-2',
    },
  ],
});

const [CreateDrawer, createDrawerApi] = useVbenDrawer({
  title: '新建报销申请',
  confirmText: '提交申请',
  onConfirm: submitCreate,
  onClosed: resetCreateForm,
});

function resetCreateForm() {
  createForm.reason_code = '';
  createForm.description = '';
  createForm.amount = 0;
  createForm.currency = currencyOptions.value[0]?.currency_code || 'HKD';
  createForm.attachmentFile = null;
}

function openCreateDrawer() {
  resetCreateForm();
  createDrawerApi.open();
}

function handleFileChange(uploadFile: any) {
  createForm.attachmentFile = uploadFile.raw || null;
}

async function submitCreate() {
  if (!createForm.reason_code) {
    ElMessage.warning('请选择报销理由');
    return;
  }
  if (createForm.amount <= 0) {
    ElMessage.warning('金额必须大于 0');
    return;
  }
  if (!createForm.attachmentFile) {
    ElMessage.warning('请上传附件');
    return;
  }

  createDrawerApi.lock(true);
  try {
    const fd = new FormData();
    fd.append('reason_code', createForm.reason_code);
    fd.append('amount', String(createForm.amount));
    fd.append('currency', createForm.currency);
    if (createForm.description) {
      fd.append('description', createForm.description);
    }
    fd.append('attachment', createForm.attachmentFile);
    await createClaimApi(fd);
    ElMessage.success('报销申请已提交');
    createDrawerApi.close();
    await loadMyClaims();
    refreshTable();
  } catch {
    ElMessage.error('提交失败');
  } finally {
    createDrawerApi.lock(false);
  }
}

// ─── 审批 ────────────────────────────────────────────────────────────────────
const currentReviewItem = ref<ClaimApi.ClaimResponse | null>(null);

const [ReviewForm, reviewFormApi] = useVbenForm({
  layout: 'vertical',
  showDefaultActions: false,
  schema: [
    {
      component: 'Input',
      fieldName: 'employee',
      label: '申请人',
      componentProps: { disabled: true },
    },
    {
      component: 'Input',
      fieldName: 'dept_region',
      label: '部门/地区',
      componentProps: { disabled: true },
    },
    {
      component: 'Input',
      fieldName: 'reason',
      label: '报销理由',
      componentProps: { disabled: true },
    },
    {
      component: 'Input',
      fieldName: 'amount_text',
      label: '金额',
      componentProps: { disabled: true },
    },
    {
      component: 'Input',
      fieldName: 'description',
      label: '说明',
      componentProps: { disabled: true, type: 'textarea', rows: 2 },
    },
    {
      component: 'Input',
      fieldName: 'attachment',
      label: '附件',
    },
    {
      component: 'Input',
      fieldName: 'review_comment',
      label: '审批备注',
      componentProps: {
        type: 'textarea',
        rows: 3,
        placeholder: '通过可不填；驳回必须填写原因',
      },
    },
  ],
});

const [ReviewDrawer, reviewDrawerApi] = useVbenDrawer({
  title: '审批报销申请',
  confirmText: '通过',
  onConfirm: () => submitReview('approved'),
  onClosed() {
    reviewFormApi.resetForm();
    currentReviewItem.value = null;
  },
});

async function openReviewDrawer(item: ClaimApi.ClaimResponse) {
  currentReviewItem.value = item;
  await reviewFormApi.resetForm();
  await reviewFormApi.setValues({
    employee: `${item.employee_name}（${item.employee_username}）`,
    dept_region: `${item.employee_department || '-'} / ${item.employee_region || '-'}`,
    reason: item.reason_label,
    amount_text: `${item.amount.toFixed(2)} ${item.currency}${item.amount_hkd ? ` ≈ HKD ${item.amount_hkd.toFixed(2)}` : ''}`,
    description: item.description || '无',
    review_comment: '',
  });
  reviewDrawerApi.open();
}

async function submitReview(action: 'approved' | 'rejected') {
  const item = currentReviewItem.value;
  if (!item) return;
  const values = await reviewFormApi.getValues();
  const comment = (values.review_comment || '').trim();
  if (action === 'rejected' && !comment) {
    ElMessage.warning('驳回必须填写原因');
    return;
  }
  reviewDrawerApi.lock(true);
  try {
    await reviewClaimApi(item.id, {
      approval_status: action,
      review_comment: comment || null,
    });
    ElMessage.success(action === 'approved' ? '已通过' : '已驳回');
    reviewDrawerApi.close();
    await loadPendingApprovals();
    await loadApprovalRecords();
    refreshTable();
  } catch {
    ElMessage.error('操作失败');
  } finally {
    reviewDrawerApi.lock(false);
  }
}

// ─── 数据加载 ────────────────────────────────────────────────────────────────
async function fetchAll() {
  loading.value = true;
  try {
    await Promise.all([
      loadOptions(),
      loadUserInfo(),
      loadMyClaims(),
      loadMyHistory(),
      loadPendingApprovals(),
      loadApprovalRecords(),
    ]);
  } catch (error) {
    console.error('Fetch all error:', error);
  } finally {
    loading.value = false;
  }
  refreshTable();
}

async function reloadActiveTab() {
  loading.value = true;
  try {
    switch (activeTab.value) {
      case 'history': {
        await loadMyHistory();
        break;
      }
      case 'my': {
        await loadMyClaims();
        break;
      }
      case 'pending': {
        await loadPendingApprovals();
        break;
      }
      case 'records': {
        await loadApprovalRecords();
        break;
      }
    }
  } finally {
    loading.value = false;
  }
  refreshTable();
}

async function loadOptions() {
  try {
    const opts = await getClaimOptionsApi();
    reasonOptions.value = (opts as any).claim_reasons || [];
    currencyOptions.value = (opts as any).claim_currencies || [];
  } catch {
    reasonOptions.value = [];
    currencyOptions.value = [];
  }
}

async function loadUserInfo() {
  try {
    const user = await getUserInfoApi();
    userInfo.value = { username: user.username, full_name: user.realName };
  } catch {
    userInfo.value = null;
  }
}

async function loadMyClaims() {
  try {
    myClaims.value = await getMyClaimsApi();
  } catch {
    myClaims.value = [];
  }
}

async function loadMyHistory() {
  try {
    myHistory.value = await getMyClaimHistoryApi();
  } catch {
    myHistory.value = [];
  }
}

async function loadPendingApprovals() {
  try {
    pendingApprovals.value = await getMyPendingClaimApprovalsApi();
  } catch {
    pendingApprovals.value = [];
  }
}

async function loadApprovalRecords() {
  try {
    approvalRecords.value = await getMyClaimApprovalRecordsApi();
  } catch {
    approvalRecords.value = [];
  }
}

onMounted(() => {
  fetchAll();
});
</script>

<template>
  <Page
    title="报销管理"
    description="提交报销申请、查看审批进度与历史记录"
    :auto-content-height="true"
    v-loading="loading"
  >
    <div class="flex h-full flex-col gap-2">
      <ElSegmented v-model="activeTab" :options="segmentedOptions" />
      <p v-if="userInfo" class="text-sm text-muted-foreground">
        当前用户：{{ userInfo.full_name }}（{{ userInfo.username }}）
      </p>

      <BasicTable :table-title="activeTableTitle" class="min-h-0 flex-1">
        <template #toolbar-tools>
          <ElButton
            v-if="activeTab === 'my'"
            type="primary"
            @click="openCreateDrawer"
          >
            新建报销申请
          </ElButton>
        </template>
        <template #reason="{ row }">
          <strong v-if="activeTab === 'my' || activeTab === 'history'">
            {{ row.reason_label }}
          </strong>
          <template v-else>
            {{ row.claim_reason_label || row.reason_label }}
          </template>
        </template>
        <template #amount="{ row }">
          <span>{{ row.amount.toFixed(2) }} {{ row.currency }}</span>
          <span
            v-if="row.amount_hkd"
            class="block text-xs text-muted-foreground"
          >
            ≈ HKD {{ row.amount_hkd.toFixed(2) }}
          </span>
        </template>
        <template #description="{ row }">
          {{ row.description || '-' }}
        </template>
        <template #status="{ row }">
          <ElTag :type="statusTypeMap[row.approval_status] || 'info'">
            {{ formatStatus(row.approval_status) }}
          </ElTag>
        </template>
        <template #created_at="{ row }">
          {{ formatDate(row.created_at) }}
        </template>
        <template #attachment="{ row }">
          <a
            v-if="row.attachment_url"
            :href="row.attachment_url"
            target="_blank"
          >
            {{ row.attachment_name || '查看' }}
          </a>
          <span v-else>-</span>
        </template>
        <template #review_comment="{ row }">
          {{ row.review_comment || '-' }}
        </template>
        <template #employee="{ row }">
          <strong>{{ row.employee_name }}</strong>
          <span class="block text-xs text-muted-foreground">
            {{ row.employee_username }}
          </span>
        </template>
        <template #action="{ row }">
          <ElButton
            size="small"
            type="primary"
            @click="openReviewDrawer(row as ClaimApi.ClaimResponse)"
          >
            审批
          </ElButton>
        </template>
        <template #record_action="{ row }">
          <ElTag
            :type="
              row.action === 'approved'
                ? 'success'
                : row.action === 'rejected'
                  ? 'danger'
                  : 'info'
            "
          >
            {{ formatAction(row.action) }}
          </ElTag>
        </template>
        <template #comment="{ row }">
          {{ row.comment || '-' }}
        </template>
      </BasicTable>
    </div>

    <!-- 新建报销抽屉 -->
    <CreateDrawer class="w-[600px]">
      <CreateForm>
        <template #reason_code>
          <ElSelect
            v-model="createForm.reason_code"
            placeholder="请选择"
            class="w-full"
          >
            <ElOption
              v-for="r in reasonOptions"
              :key="r.name"
              :label="r.name"
              :value="r.name"
            />
          </ElSelect>
        </template>
        <template #amount>
          <ElInputNumber
            v-model="createForm.amount"
            :min="0.01"
            :precision="2"
            :step="100"
            class="w-full"
          />
        </template>
        <template #currency>
          <ElSelect v-model="createForm.currency" class="w-full">
            <ElOption
              v-for="c in currencyOptions"
              :key="c.currency_code"
              :label="c.currency_code"
              :value="c.currency_code"
            />
          </ElSelect>
          <span
            v-if="createForm.currency !== 'HKD'"
            class="mt-1 block text-xs text-muted-foreground"
          >
            ≈ HKD {{ estimatedHkd.toFixed(2) }}
          </span>
        </template>
        <template #description>
          <ElInput
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="可选，补充说明报销用途"
          />
        </template>
        <template #attachment>
          <ElUpload
            :auto-upload="false"
            :limit="1"
            accept="image/*,.pdf"
            @change="handleFileChange"
          >
            <ElButton>选择文件</ElButton>
            <template #tip>
              <span class="block text-xs text-muted-foreground">
                支持图片或 PDF，用于报销凭证
              </span>
            </template>
          </ElUpload>
        </template>
      </CreateForm>
    </CreateDrawer>

    <!-- 审批抽屉 -->
    <ReviewDrawer class="w-[600px]">
      <ReviewForm>
        <template #attachment>
          <a
            v-if="currentReviewItem?.attachment_url"
            :href="currentReviewItem.attachment_url"
            target="_blank"
          >
            {{ currentReviewItem.attachment_name || '查看附件' }}
          </a>
          <span v-else>无</span>
        </template>
      </ReviewForm>
      <template #center-footer>
        <ElButton type="danger" @click="submitReview('rejected')">
          驳回
        </ElButton>
      </template>
    </ReviewDrawer>
  </Page>
</template>
