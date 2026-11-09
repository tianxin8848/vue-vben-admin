<script lang="ts" setup>
import type { LeaveRequestApi } from '#/api';

import { computed } from 'vue';

import { ElTag } from 'element-plus';

import { $t } from '#/locales';

/**
 * 请假审批流程时间线。
 *
 * 后端 `approval_chain` 正常为两级（直属主管 → HR_APPROVER_USERNAME），
 * 但历史单据、列表快照或配置缺失时可能为空。为空时兜底展示默认两级，
 * 保证任何单据在前端都能看到完整审批流程，而不是一片空白。
 */
interface ChainNode {
  level: number;
  name: string;
  role: string;
  userId: string;
}

type FlowState =
  | 'approved'
  | 'current'
  | 'rejected'
  | 'skipped'
  | 'waiting'
  | 'withdrawn';

interface FlowNode extends ChainNode {
  comment: null | string;
  reviewedAt: null | string;
  state: FlowState;
}

const props = defineProps<{
  request: LeaveRequestApi.LeaveRequest;
}>();

const TAG_TYPE: Record<FlowState, 'danger' | 'info' | 'success' | 'warning'> = {
  approved: 'success',
  current: 'warning',
  rejected: 'danger',
  skipped: 'info',
  waiting: 'info',
  withdrawn: 'info',
};

function asRecordList(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, unknown> =>
      !!item && typeof item === 'object',
  );
}

function formatTime(value: unknown): null | string {
  if (!value) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('zh-CN', { hour12: false });
}

/** 角色标签：两条链为「直属主管 / HR 审批」，单条链不猜角色 */
function roleLabel(level: number, total: number): string {
  if (total === 1) return $t('page.leave.approvalFlow.role.approver');
  if (level === 1) return $t('page.leave.approvalFlow.role.manager');
  if (level === total) return $t('page.leave.approvalFlow.role.hr');
  return $t('page.leave.approvalFlow.role.level', { level });
}

/** 归一化审批链，为空时补上默认两级节点 */
function buildChain(request: LeaveRequestApi.LeaveRequest): ChainNode[] {
  const chain = asRecordList(request.approval_chain);
  if (chain.length === 0) {
    return [
      {
        level: 1,
        name: '',
        role: $t('page.leave.approvalFlow.role.manager'),
        userId: '',
      },
      {
        level: 2,
        name: '',
        role: $t('page.leave.approvalFlow.role.hr'),
        userId: '',
      },
    ];
  }
  return chain.map((node, index) => {
    const level = index + 1;
    return {
      level,
      name: String(node.full_name || node.username || ''),
      role: roleLabel(level, chain.length),
      userId: String(node.user_id || ''),
    };
  });
}

function findRecord(
  request: LeaveRequestApi.LeaveRequest,
  userId: string,
): Record<string, unknown> | undefined {
  if (!userId) return undefined;
  const history = asRecordList(request.approval_history);
  return [...history]
    .toReversed()
    .find((item) => String(item.approver_id || '') === userId);
}

function resolveState(
  request: LeaveRequestApi.LeaveRequest,
  record: Record<string, unknown> | undefined,
  node: ChainNode,
): FlowState {
  if (record?.action === 'approved') return 'approved';
  if (record?.action === 'rejected') return 'rejected';

  const status = request.approval_status;
  if (status === 'pending') {
    if (
      request.current_approver_id &&
      request.current_approver_id === node.userId
    ) {
      return 'current';
    }
    return 'waiting';
  }
  if (status === 'approved') return 'approved';
  if (status === 'withdrawn') return 'withdrawn';
  // rejected：后续节点不会再被审批
  return 'skipped';
}

function stateLabel(state: FlowState) {
  return $t(`page.leave.approvalFlow.state.${state}`);
}

const nodes = computed<FlowNode[]>(() => {
  const request = props.request;
  return buildChain(request).map((node) => {
    const record = findRecord(request, node.userId);
    return {
      ...node,
      state: resolveState(request, record, node),
      comment: record?.comment ? String(record.comment) : null,
      reviewedAt: record?.at ? formatTime(record.at) : null,
    };
  });
});
</script>

<template>
  <div class="approval-flow">
    <div class="flow-header">
      <span class="flow-title">
        {{ $t('page.leave.approvalFlow.title') }}
      </span>
      <span class="flow-sub">{{ $t('page.leave.approvalFlow.subtitle') }}</span>
    </div>
    <ul class="flow-list">
      <li
        v-for="(node, index) in nodes"
        :key="node.level"
        class="flow-item"
        :class="`is-${node.state}`"
      >
        <div class="flow-rail">
          <span class="flow-dot"></span>
          <span v-if="index < nodes.length - 1" class="flow-line"></span>
        </div>
        <div class="flow-content">
          <div class="flow-row">
            <span class="flow-role">{{ node.role }}</span>
            <span class="flow-name">
              {{ node.name || $t('page.leave.approvalFlow.unassigned') }}
            </span>
            <ElTag :type="TAG_TYPE[node.state]" size="small">
              {{ stateLabel(node.state) }}
            </ElTag>
          </div>
          <div v-if="node.comment" class="flow-comment">
            {{
              $t('page.leave.approvalFlow.comment', { comment: node.comment })
            }}
          </div>
          <div v-if="node.reviewedAt" class="flow-time">
            {{ node.reviewedAt }}
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.approval-flow {
  margin-top: 20px;
}

.flow-header {
  display: flex;
  gap: 8px;
  align-items: baseline;
  margin-bottom: 12px;
}

.flow-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.flow-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.flow-list {
  padding: 0;
  margin: 0;
  list-style: none;
}

.flow-item {
  display: flex;
  gap: 10px;
}

.flow-rail {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  align-items: center;
  width: 12px;
}

.flow-dot {
  flex-shrink: 0;
  width: 10px;
  height: 10px;
  margin-top: 5px;
  background: var(--el-border-color);
  border-radius: 50%;
}

.flow-line {
  flex: 1;
  width: 2px;
  margin-top: 2px;
  background: var(--el-border-color-lighter);
}

.flow-content {
  flex: 1;
  min-width: 0;
  padding-bottom: 16px;
}

.flow-item:last-child .flow-content {
  padding-bottom: 0;
}

.flow-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.flow-role {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.flow-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.flow-comment {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  overflow-wrap: break-word;
}

.flow-time {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.is-approved .flow-dot {
  background: var(--el-color-success);
}

.is-rejected .flow-dot {
  background: var(--el-color-danger);
}

.is-current .flow-dot {
  background: var(--el-color-warning);
  box-shadow: 0 0 0 3px var(--el-color-warning-light-8);
}

.is-current .flow-name {
  color: var(--el-color-warning);
}
</style>
