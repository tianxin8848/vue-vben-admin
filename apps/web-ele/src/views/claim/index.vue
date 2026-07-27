<script lang="ts" setup>
import type { ClaimApi } from '#/api';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElCard,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
  ElUpload,
} from 'element-plus';

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

const segmentedOptions = computed(() => [
  {
    label: `我的报销${myClaims.value.length > 0 ? ` ${myClaims.value.length}` : ''}`,
    value: 'my',
  },
  {
    label: '历史记录',
    value: 'history',
  },
  {
    label: `待我审批${pendingApprovals.value.length > 0 ? ` ${pendingApprovals.value.length}` : ''}`,
    value: 'pending',
  },
  {
    label: '审批记录',
    value: 'records',
  },
]);

// ─── 数据列表 ────────────────────────────────────────────────────────────────
const myClaims = ref<ClaimApi.ClaimResponse[]>([]);
const myHistory = ref<ClaimApi.ClaimResponse[]>([]);
const pendingApprovals = ref<ClaimApi.ClaimResponse[]>([]);
const approvalRecords = ref<ClaimApi.ClaimApprovalRecord[]>([]);

// ─── 新建表单 ────────────────────────────────────────────────────────────────
const showCreateModal = ref(false);
const createForm = reactive({
  reason_code: '',
  description: '',
  amount: 0,
  currency: 'HKD',
  attachmentFile: null as File | null,
});
const submitting = ref(false);

// ─── 审批弹窗 ────────────────────────────────────────────────────────────────
const showReviewModal = ref(false);
const currentReviewItem = ref<ClaimApi.ClaimResponse | null>(null);
const reviewComment = ref('');

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

// ─── 计算属性 ────────────────────────────────────────────────────────────────
const selectedCurrencyRate = computed(() => {
  const found = currencyOptions.value.find(
    (c) => c.currency_code === createForm.currency,
  );
  return found?.to_hkd_rate ?? 1;
});

const estimatedHkd = computed(() => {
  return Math.round(createForm.amount * selectedCurrencyRate.value * 100) / 100;
});

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

// ─── 新建报销 ────────────────────────────────────────────────────────────────
function openCreateModal() {
  createForm.reason_code = '';
  createForm.description = '';
  createForm.amount = 0;
  createForm.currency = currencyOptions.value[0]?.currency_code || 'HKD';
  createForm.attachmentFile = null;
  showCreateModal.value = true;
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

  submitting.value = true;
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
    showCreateModal.value = false;
    await loadMyClaims();
  } catch {
    ElMessage.error('提交失败');
  } finally {
    submitting.value = false;
  }
}

// ─── 审批操作 ────────────────────────────────────────────────────────────────
function openReviewModal(item: ClaimApi.ClaimResponse) {
  currentReviewItem.value = item;
  reviewComment.value = '';
  showReviewModal.value = true;
}

async function submitReview(action: 'approved' | 'rejected') {
  if (!currentReviewItem.value) return;
  if (action === 'rejected' && !reviewComment.value.trim()) {
    ElMessage.warning('驳回必须填写原因');
    return;
  }
  try {
    await reviewClaimApi(currentReviewItem.value.id, {
      approval_status: action,
      review_comment: reviewComment.value.trim() || null,
    });
    ElMessage.success(action === 'approved' ? '已通过' : '已驳回');
    showReviewModal.value = false;
    await loadPendingApprovals();
    await loadApprovalRecords();
  } catch {
    ElMessage.error('操作失败');
  }
}

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

onMounted(() => {
  fetchAll();
});
</script>

<template>
  <Page title="报销管理" description="提交报销申请、查看审批进度与历史记录">
    <template #actions>
      <ElButton type="primary" @click="openCreateModal">
        新建报销申请
      </ElButton>
    </template>

    <ElSegmented v-model="activeTab" :options="segmentedOptions" />
    <div
      v-if="userInfo"
      style="margin-bottom: 16px; font-size: 13px; color: #64748b"
    >
      当前用户：{{ userInfo.full_name }}（{{ userInfo.username }}）
    </div>

    <!-- 我的报销 -->
    <ElCard v-if="activeTab === 'my'">
      <ElTable
        v-if="myClaims.length"
        :data="myClaims"
        border
        v-loading="loading"
        style="width: 100%"
      >
        <ElTableColumn label="报销理由" min-width="140">
          <template #default="{ row }">
            <strong>{{ row.reason_label }}</strong>
          </template>
        </ElTableColumn>
        <ElTableColumn label="金额" min-width="130">
          <template #default="{ row }">
            <div>
              <span>{{ row.amount.toFixed(2) }} {{ row.currency }}</span>
              <div
                v-if="row.amount_hkd"
                style="font-size: 12px; color: #64748b"
              >
                ≈ HKD {{ row.amount_hkd.toFixed(2) }}
              </div>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="说明" min-width="160" prop="description">
          <template #default="{ row }">
            {{ row.description || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="状态" width="100">
          <template #default="{ row }">
            <ElTag :type="statusTypeMap[row.approval_status] || 'info'">
              {{ formatStatus(row.approval_status) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="提交时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="附件" width="100">
          <template #default="{ row }">
            <a
              v-if="row.attachment_url"
              :href="row.attachment_url"
              target="_blank"
            >
              {{ row.attachment_name || '查看' }}
            </a>
            <span v-else>-</span>
          </template>
        </ElTableColumn>
      </ElTable>
      <div v-else style="padding: 40px; color: #999; text-align: center">
        暂无进行中的报销申请
      </div>
    </ElCard>

    <!-- 历史记录 -->
    <ElCard v-if="activeTab === 'history'">
      <ElTable
        v-if="myHistory.length"
        :data="myHistory"
        border
        style="width: 100%"
      >
        <ElTableColumn label="报销理由" min-width="140">
          <template #default="{ row }">
            <strong>{{ row.reason_label }}</strong>
          </template>
        </ElTableColumn>
        <ElTableColumn label="金额" min-width="130">
          <template #default="{ row }">
            <div>
              <span>{{ row.amount.toFixed(2) }} {{ row.currency }}</span>
              <div
                v-if="row.amount_hkd"
                style="font-size: 12px; color: #64748b"
              >
                ≈ HKD {{ row.amount_hkd.toFixed(2) }}
              </div>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="说明" min-width="160" prop="description">
          <template #default="{ row }">
            {{ row.description || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="最终状态" width="100">
          <template #default="{ row }">
            <ElTag :type="statusTypeMap[row.approval_status] || 'info'">
              {{ formatStatus(row.approval_status) }}
            </ElTag>
          </template>
        </ElTableColumn>
        <ElTableColumn label="审批意见" min-width="140" prop="review_comment">
          <template #default="{ row }">
            {{ row.review_comment || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="提交时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </ElTableColumn>
      </ElTable>
      <div v-else style="padding: 40px; color: #999; text-align: center">
        暂无历史记录
      </div>
    </ElCard>

    <!-- 待我审批 -->
    <ElCard v-if="activeTab === 'pending'">
      <ElTable
        v-if="pendingApprovals.length"
        :data="pendingApprovals"
        border
        style="width: 100%"
      >
        <ElTableColumn label="申请人" min-width="150">
          <template #default="{ row }">
            <div>
              <strong>{{ row.employee_name }}</strong>
              <div style="font-size: 12px; color: #64748b">
                {{ row.employee_username }}
              </div>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="报销理由" min-width="130">
          <template #default="{ row }">
            {{ row.reason_label }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="金额" min-width="130">
          <template #default="{ row }">
            <div>
              <span>{{ row.amount.toFixed(2) }} {{ row.currency }}</span>
              <div
                v-if="row.amount_hkd"
                style="font-size: 12px; color: #64748b"
              >
                ≈ HKD {{ row.amount_hkd.toFixed(2) }}
              </div>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="说明" min-width="160" prop="description">
          <template #default="{ row }">
            {{ row.description || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="提交时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <ElButton
              size="small"
              type="primary"
              @click="openReviewModal(row as ClaimApi.ClaimResponse)"
            >
              审批
            </ElButton>
          </template>
        </ElTableColumn>
      </ElTable>
      <div v-else style="padding: 40px; color: #999; text-align: center">
        暂无待审批报销
      </div>
    </ElCard>

    <!-- 审批记录 -->
    <ElCard v-if="activeTab === 'records'">
      <ElTable
        v-if="approvalRecords.length"
        :data="approvalRecords"
        border
        style="width: 100%"
      >
        <ElTableColumn label="申请人" min-width="150">
          <template #default="{ row }">
            <div>
              <strong>{{ row.employee_name }}</strong>
              <div style="font-size: 12px; color: #64748b">
                {{ row.employee_username }}
              </div>
            </div>
          </template>
        </ElTableColumn>
        <ElTableColumn label="报销理由" min-width="130">
          <template #default="{ row }">
            {{ row.claim_reason_label }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="金额" min-width="120">
          <template #default="{ row }">
            <span>{{ row.amount.toFixed(2) }} {{ row.currency }}</span>
          </template>
        </ElTableColumn>
        <ElTableColumn label="操作" width="90">
          <template #default="{ row }">
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
        </ElTableColumn>
        <ElTableColumn label="备注" min-width="140" prop="comment">
          <template #default="{ row }">
            {{ row.comment || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn label="时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </ElTableColumn>
      </ElTable>
      <div v-else style="padding: 40px; color: #999; text-align: center">
        暂无审批记录
      </div>
    </ElCard>

    <!-- 新建报销弹窗 -->
    <ElDialog
      v-model="showCreateModal"
      title="新建报销申请"
      width="560px"
      :close-on-click-modal="false"
    >
      <ElForm label-width="90px">
        <ElFormItem label="报销理由" required>
          <ElSelect
            v-model="createForm.reason_code"
            placeholder="请选择"
            style="width: 100%"
          >
            <ElOption
              v-for="r in reasonOptions"
              :key="r.name"
              :label="r.name"
              :value="r.name"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="金额" required>
          <ElInputNumber
            v-model="createForm.amount"
            :min="0.01"
            :precision="2"
            :step="100"
            style="width: 200px"
          />
          <ElSelect
            v-model="createForm.currency"
            style="width: 120px; margin-left: 12px"
          >
            <ElOption
              v-for="c in currencyOptions"
              :key="c.currency_code"
              :label="c.currency_code"
              :value="c.currency_code"
            />
          </ElSelect>
        </ElFormItem>
        <ElFormItem v-if="createForm.currency !== 'HKD'" label="折合港币">
          <span>≈ HKD {{ estimatedHkd.toFixed(2) }}</span>
        </ElFormItem>
        <ElFormItem label="说明">
          <ElInput
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="可选，补充说明报销用途"
          />
        </ElFormItem>
        <ElFormItem label="附件" required>
          <ElUpload
            :auto-upload="false"
            :limit="1"
            accept="image/*,.pdf"
            @change="handleFileChange"
          >
            <ElButton>选择文件</ElButton>
            <template #tip>
              <div style="font-size: 12px; color: #999">
                支持图片或 PDF，用于报销凭证
              </div>
            </template>
          </ElUpload>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showCreateModal = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="submitCreate">
          提交申请
        </ElButton>
      </template>
    </ElDialog>

    <!-- 审批弹窗 -->
    <ElDialog
      v-model="showReviewModal"
      title="审批报销申请"
      width="560px"
      :close-on-click-modal="false"
    >
      <div v-if="currentReviewItem">
        <div style="margin-bottom: 12px">
          <span style="font-weight: 500; color: #64748b">申请人：</span>
          <strong>{{ currentReviewItem.employee_name }}</strong>
          （{{ currentReviewItem.employee_username }}）
        </div>
        <div style="margin-bottom: 12px">
          <span style="font-weight: 500; color: #64748b">部门/地区：</span>
          {{ currentReviewItem.employee_department || '-' }}
          /
          {{ currentReviewItem.employee_region || '-' }}
        </div>
        <div style="margin-bottom: 12px">
          <span style="font-weight: 500; color: #64748b">报销理由：</span>
          {{ currentReviewItem.reason_label }}
        </div>
        <div style="margin-bottom: 12px">
          <span style="font-weight: 500; color: #64748b">金额：</span>
          <span>
            {{ currentReviewItem.amount.toFixed(2) }}
            {{ currentReviewItem.currency }}
          </span>
          <span
            v-if="currentReviewItem.amount_hkd"
            style="font-size: 12px; color: #64748b"
          >
            ≈ HKD {{ currentReviewItem.amount_hkd.toFixed(2) }}
          </span>
        </div>
        <div style="margin-bottom: 12px">
          <span style="font-weight: 500; color: #64748b">说明：</span>
          {{ currentReviewItem.description || '无' }}
        </div>
        <div style="margin-bottom: 16px">
          <span style="font-weight: 500; color: #64748b">附件：</span>
          <a
            v-if="currentReviewItem.attachment_url"
            :href="currentReviewItem.attachment_url"
            target="_blank"
          >
            {{ currentReviewItem.attachment_name || '查看附件' }}
          </a>
          <span v-else>无</span>
        </div>
        <div>
          <div style="margin-bottom: 8px; font-weight: 500; color: #64748b">
            审批备注：
          </div>
          <ElInput
            v-model="reviewComment"
            type="textarea"
            :rows="3"
            placeholder="通过可不填；驳回必须填写原因"
          />
        </div>
      </div>
      <template #footer>
        <ElButton @click="showReviewModal = false">取消</ElButton>
        <ElButton type="danger" @click="submitReview('rejected')">
          驳回
        </ElButton>
        <ElButton type="primary" @click="submitReview('approved')">
          通过
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
