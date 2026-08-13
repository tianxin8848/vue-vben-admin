import type { VxeGridProps } from '#/adapter/vxe-table';
import type { ClaimApi } from '#/api';

export type TabKey = 'history' | 'my' | 'pending' | 'records';

export const statusTypeMap: Record<
  string,
  '' | 'danger' | 'info' | 'success' | 'warning'
> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
  withdrawn: 'info',
};

export function formatDate(dt: null | string) {
  if (!dt) return '-';
  return dt.replace('T', ' ').slice(0, 16);
}

export function buildSegmentedOptions(t: (key: string) => string) {
  return [
    { label: t('page.claim.tabs.my'), value: 'my' },
    { label: t('page.claim.tabs.history'), value: 'history' },
    { label: t('page.claim.tabs.pending'), value: 'pending' },
    { label: t('page.claim.tabs.records'), value: 'records' },
  ];
}

export function buildStatusLabelMap(t: (key: string) => string) {
  return {
    approved: t('page.claim.status.approved'),
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
 * 4 套表格列配置
 * 通过函数接收 t，避免在 data.ts 中引入 useI18n
 */
export function buildTabColumns(t: (key: string) => string) {
  const history: VxeGridProps['columns'] = [
    {
      field: 'reason_label',
      title: t('page.claim.columns.reason'),
      minWidth: 140,
      slots: { default: 'reason' },
    },
    {
      field: 'invoice_date',
      title: t('page.claim.columns.invoiceDate'),
      width: 120,
      slots: { default: 'invoice_date' },
    },
    {
      field: 'invoice_no',
      title: t('page.claim.columns.invoiceNo'),
      minWidth: 140,
      slots: { default: 'invoice_no' },
    },
    {
      field: 'amount',
      title: t('page.claim.columns.amount'),
      minWidth: 130,
      slots: { default: 'amount' },
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
    {
      field: 'reason_label',
      title: t('page.claim.columns.reason'),
      minWidth: 140,
      slots: { default: 'reason' },
    },
    {
      field: 'invoice_date',
      title: t('page.claim.columns.invoiceDate'),
      width: 120,
      slots: { default: 'invoice_date' },
    },
    {
      field: 'invoice_no',
      title: t('page.claim.columns.invoiceNo'),
      minWidth: 140,
      slots: { default: 'invoice_no' },
    },
    {
      field: 'amount',
      title: t('page.claim.columns.amount'),
      minWidth: 130,
      slots: { default: 'amount' },
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
      width: 100,
      fixed: 'right',
      slots: { default: 'my_action' },
    },
  ];

  const pending: VxeGridProps['columns'] = [
    {
      field: 'employee_name',
      title: t('page.claim.columns.applicant'),
      minWidth: 150,
      slots: { default: 'employee' },
    },
    {
      field: 'reason_label',
      title: t('page.claim.columns.reason'),
      minWidth: 130,
      slots: { default: 'reason' },
    },
    {
      field: 'invoice_date',
      title: t('page.claim.columns.invoiceDate'),
      width: 120,
      slots: { default: 'invoice_date' },
    },
    {
      field: 'amount',
      title: t('page.claim.columns.amount'),
      minWidth: 130,
      slots: { default: 'amount' },
    },
    {
      field: 'description',
      title: t('page.claim.columns.description'),
      minWidth: 160,
      slots: { default: 'description' },
    },
    {
      field: 'created_at',
      title: t('page.claim.columns.submitTime'),
      width: 160,
      slots: { default: 'created_at' },
    },
    {
      title: t('page.claim.columns.operation'),
      width: 100,
      fixed: 'right',
      slots: { default: 'action' },
    },
  ];

  const records: VxeGridProps['columns'] = [
    {
      field: 'employee_name',
      title: t('page.claim.columns.applicant'),
      minWidth: 150,
      slots: { default: 'employee' },
    },
    {
      field: 'claim_reason_label',
      title: t('page.claim.columns.reason'),
      minWidth: 130,
      slots: { default: 'reason' },
    },
    {
      field: 'amount',
      title: t('page.claim.columns.amount'),
      minWidth: 120,
      slots: { default: 'amount' },
    },
    {
      field: 'action',
      title: t('page.claim.columns.recordOperation'),
      width: 90,
      slots: { default: 'record_action' },
    },
    {
      field: 'comment',
      title: t('page.claim.columns.remark'),
      minWidth: 140,
      slots: { default: 'comment' },
    },
    {
      field: 'created_at',
      title: t('page.claim.columns.time'),
      width: 160,
      slots: { default: 'created_at' },
    },
  ];

  return { history, my, pending, records } as Record<
    TabKey,
    VxeGridProps['columns']
  >;
}

export function buildTableTitles(
  t: (key: string, params?: any) => string,
  lengths: Record<TabKey, number>,
) {
  return {
    my: t('page.claim.messages.myClaimsCount', { count: lengths.my }),
    history: t('page.claim.messages.historyCount', { count: lengths.history }),
    pending: t('page.claim.messages.pendingCount', { count: lengths.pending }),
    records: t('page.claim.messages.recordsCount', { count: lengths.records }),
  } as Record<TabKey, string>;
}

export function dataFor(
  tab: TabKey,
  refs: {
    history: ClaimApi.ClaimResponse[];
    my: ClaimApi.ClaimResponse[];
    pending: ClaimApi.ClaimResponse[];
    records: ClaimApi.ClaimApprovalRecord[];
  },
) {
  switch (tab) {
    case 'history': {
      return refs.history;
    }
    case 'my': {
      return refs.my;
    }
    case 'pending': {
      return refs.pending;
    }
    case 'records': {
      return refs.records;
    }
  }
}
