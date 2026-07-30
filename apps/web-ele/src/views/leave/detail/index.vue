<script lang="ts" setup>
import type { LeaveRequestApi } from '#/api';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  ElButton,
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElTag,
} from 'element-plus';

import { getLeaveRequestApi, reviewLeaveRequestApi } from '#/api';

const route = useRoute();
const router = useRouter();
const loading = ref(false);

const requestId = route.params.id as string;
const leaveRequest = ref<LeaveRequestApi.LeaveRequest | null>(null);
const showReviewModal = ref(false);
const reviewComment = ref('');

const leaveTypeOptions: Record<string, string> = {
  sick: '病假',
  annual: '年假',
  personal: '事假',
  lieu: '调休',
  long: '长假',
};

const statusOptions: Record<string, string> = {
  pending: '待审批',
  approved: '已批准',
  rejected: '已拒绝',
  withdrawn: '已撤回',
};

async function fetchDetail() {
  loading.value = true;
  try {
    leaveRequest.value = await getLeaveRequestApi(requestId);
  } finally {
    loading.value = false;
  }
}

async function handleApprove() {
  try {
    await reviewLeaveRequestApi(requestId, {
      approval_status: 'approved',
      review_comment: reviewComment.value,
    });
    ElMessage.success('审批成功');
    showReviewModal.value = false;
    reviewComment.value = '';
    fetchDetail();
  } catch {
    ElMessage.error('审批失败');
  }
}

async function handleReject() {
  try {
    await reviewLeaveRequestApi(requestId, {
      approval_status: 'rejected',
      review_comment: reviewComment.value,
    });
    ElMessage.success('已拒绝');
    showReviewModal.value = false;
    reviewComment.value = '';
    fetchDetail();
  } catch {
    ElMessage.error('操作失败');
  }
}

function goBack() {
  router.push('/employee/leave');
}

onMounted(() => {
  fetchDetail();
});
</script>

<template>
  <div class="leave-detail-page" v-loading="loading">
    <div class="page-header">
      <ElButton @click="goBack">返回</ElButton>
      <h2>请假申请详情</h2>
    </div>

    <ElCard v-if="leaveRequest">
      <div class="detail-section">
        <div class="detail-row">
          <span class="label">申请人</span>
          <span class="value">{{ leaveRequest.employee_name }}</span>
        </div>
        <div class="detail-row">
          <span class="label">请假类型</span>
          <span class="value">{{
            leaveTypeOptions[leaveRequest.leave_type]
          }}</span>
        </div>
        <div class="detail-row">
          <span class="label">开始日期</span>
          <span class="value">{{ leaveRequest.start_date }}</span>
        </div>
        <div class="detail-row">
          <span class="label">结束日期</span>
          <span class="value">{{ leaveRequest.end_date }}</span>
        </div>
        <div class="detail-row">
          <span class="label">当前状态</span>
          <ElTag
            :type="
              (
                {
                  pending: 'warning',
                  approved: 'success',
                  rejected: 'danger',
                  withdrawn: 'info',
                } as Record<
                  string,
                  'primary' | 'success' | 'warning' | 'info' | 'danger'
                >
              )[leaveRequest.approval_status] || 'info'
            "
          >
            {{ statusOptions[leaveRequest.approval_status] }}
          </ElTag>
        </div>
        <div class="detail-row">
          <span class="label">申请时间</span>
          <span class="value">{{ leaveRequest.created_at }}</span>
        </div>
        <div class="detail-row">
          <span class="label">请假原因</span>
          <p class="value text-area">{{ leaveRequest.reason }}</p>
        </div>

        <div v-if="leaveRequest.reviewer_name" class="review-section">
          <h4>审批记录</h4>
          <div class="detail-row">
            <span class="label">审批人</span>
            <span class="value">{{ leaveRequest.reviewer_name }}</span>
          </div>
          <div class="detail-row">
            <span class="label">审批时间</span>
            <span class="value">{{ leaveRequest.reviewed_at }}</span>
          </div>
          <div class="detail-row">
            <span class="label">审批意见</span>
            <p class="value text-area">
              {{ leaveRequest.review_comment || '无' }}
            </p>
          </div>
        </div>
      </div>

      <div
        class="action-section"
        v-if="leaveRequest.approval_status === 'pending'"
      >
        <ElButton type="primary" @click="showReviewModal = true">审批</ElButton>
      </div>
    </ElCard>

    <ElDialog v-model="showReviewModal" title="审批请假申请">
      <ElForm label-width="80px">
        <ElFormItem label="审批意见">
          <ElInput v-model="reviewComment" type="textarea" :rows="3" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showReviewModal = false">取消</ElButton>
        <ElButton type="danger" @click="handleReject">拒绝</ElButton>
        <ElButton type="primary" @click="handleApprove">同意</ElButton>
      </template>
    </ElDialog>
  </div>
</template>


