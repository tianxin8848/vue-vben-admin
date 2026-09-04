import type { VxeGridProps } from '#/adapter/vxe-table';
import type { ClaimApi } from '#/api';

export type TabKey = 'history' | 'my';

export const statusTypeMap: Record<
  string,
  '' | 'danger' | 'info' | 'success' | 'warning'
> = {
  approved: 'success',
  draft: 'info',
  pending: 'warning',
  rejected: 'danger',
  withdrawn: 'info',
};

/** 「我的报销」Tab 的状态过滤：草稿 + 审批中（进行中） */
export const MY_ACTIVE_STATUSES: ClaimApi.ClaimApprovalStatus[] = [
  'draft',
  'pending',
];

/** 「历史记录」Tab 的状态过滤：仅显示已批准（approved） */
export const HISTORY_STATUSES: ClaimApi.ClaimApprovalStatus[] = ['approved'];

export function formatDate(dt: null | string) {
  if (!dt) return '-';
  return dt.replace('T', ' ').slice(0, 16);
}

/**
 * 按 invoice_date 进行客户端日期范围过滤。
 * - 未选范围时视为无筛选
 * - 选中范围后排除无 invoice_date 的记录及范围外的记录
 */
export function filterByInvoiceDate(
  list: ClaimApi.ClaimResponse[],
  range: [string, string] | null,
): ClaimApi.ClaimResponse[] {
  if (!range || (!range[0] && !range[1])) return list;
  const [start, end] = range;
  return list.filter((item) => {
    if (!item.invoice_date) return false;
    if (start && item.invoice_date < start) return false;
    if (end && item.invoice_date > end) return false;
    return true;
  });
}

export function buildSegmentedOptions(t: (key: string) => string) {
  return [
    { label: t('page.claim.tabs.my'), value: 'my' },
    { label: t('page.claim.tabs.history'), value: 'history' },
  ];
}

export function buildStatusLabelMap(t: (key: string) => string) {
  return {
    approved: t('page.claim.status.approved'),
    draft: t('page.claim.status.draft'),
    pending: t('page.claim.status.pending'),
    rejected: t('page.claim.status.rejected'),
    withdrawn: t('page.claim.status.withdrawn'),
  };
}

export function buildActionLabelMap(t: (key: string) => string) {
  return {
    approved: t('page.claim.action.approved'),
    created: t('page.claim.action.created'),
    rejected: t('page.claim.action.rejected'),
    submitted: t('page.claim.action.submitted'),
    withdrawn: t('page.claim.action.withdrawn'),
  };
}

export function formatStatus(status: string, labelMap: Record<string, string>) {
  return labelMap[status] || status;
}

export function formatAction(action: string, labelMap: Record<string, string>) {
  return labelMap[action] || action;
}

export function buildSharedToolbarConfig(t: (key: string) => string) {
  return {
    custom: true,
    tools: [
      {
        code: 'manual-refresh',
        icon: 'vxe-icon-refresh',
        circle: true,
        name: t('common.refresh'),
      },
    ],
  } satisfies VxeGridProps['toolbarConfig'];
}

/**
 * 表格列配置（my / history）
 * 通过函数接收 t，避免在 data.ts 中引入 useI18n
 */
export function buildTabColumns(t: (key: string) => string) {
  const history: VxeGridProps['columns'] = [
    { type: 'checkbox', width: 50, fixed: 'left' },
    {
      field: 'reason_label',
      title: t('page.claim.columns.reason'),
      minWidth: 140,
      slots: { default: 'reason' },
    },
    {
      field: 'amount',
      title: t('page.claim.columns.amount'),
      minWidth: 130,
      slots: { default: 'amount' },
    },
    {
      field: 'invoice_no',
      title: t('page.claim.columns.invoiceNo'),
      width: 130,
      slots: { default: 'invoice_no' },
    },
    {
      field: 'invoice_date',
      title: t('page.claim.columns.invoiceDate'),
      width: 130,
      slots: { default: 'invoice_date' },
    },
    {
      field: 'description',
      title: t('page.claim.columns.description'),
      minWidth: 160,
      slots: { default: 'description' },
    },
    {
      field: 'approval_status',
      title: t('page.claim.columns.finalStatus'),
      width: 100,
      slots: { default: 'status' },
    },
    {
      field: 'review_comment',
      title: t('page.claim.columns.reviewComment'),
      minWidth: 140,
      slots: { default: 'review_comment' },
    },
    {
      field: 'created_at',
      title: t('page.claim.columns.submitTime'),
      width: 160,
      slots: { default: 'created_at' },
    },
  ];

  const my: VxeGridProps['columns'] = [
    { type: 'checkbox', width: 50, fixed: 'left' },
    {
      field: 'reason_label',
      title: t('page.claim.columns.reason'),
      minWidth: 140,
      slots: { default: 'reason' },
    },
    {
      field: 'amount',
      title: t('page.claim.columns.amount'),
      minWidth: 130,
      slots: { default: 'amount' },
    },
    {
      field: 'invoice_no',
      title: t('page.claim.columns.invoiceNo'),
      width: 130,
      slots: { default: 'invoice_no' },
    },
    {
      field: 'invoice_date',
      title: t('page.claim.columns.invoiceDate'),
      width: 130,
      slots: { default: 'invoice_date' },
    },
    {
      field: 'description',
      title: t('page.claim.columns.description'),
      minWidth: 160,
      slots: { default: 'description' },
    },
    {
      field: 'approval_status',
      title: t('page.claim.columns.status'),
      width: 100,
      slots: { default: 'status' },
    },
    {
      field: 'created_at',
      title: t('page.claim.columns.submitTime'),
      width: 160,
      slots: { default: 'created_at' },
    },
    {
      field: 'attachment_url',
      title: t('page.claim.columns.attachment'),
      width: 100,
      slots: { default: 'attachment' },
    },
    {
      title: t('page.claim.columns.operation'),
      width: 300,
      fixed: 'right',
      slots: { default: 'my_action' },
    },
  ];

  return { history, my } as Record<TabKey, VxeGridProps['columns']>;
}

export function buildTableTitles(
  t: (key: string, params?: any) => string,
  lengths: Record<TabKey, number>,
) {
  return {
    my: t('page.claim.messages.myClaimsCount', { count: lengths.my }),
    history: t('page.claim.messages.historyCount', { count: lengths.history }),
  } as Record<TabKey, string>;
}

export function dataFor(
  tab: TabKey,
  refs: {
    history: ClaimApi.ClaimResponse[];
    my: ClaimApi.ClaimResponse[];
  },
) {
  switch (tab) {
    case 'history': {
      return refs.history;
    }
    case 'my': {
      return refs.my;
    }
  }
}
