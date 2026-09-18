import type { ClaimApi } from '#/api';

import { ref } from 'vue';

import { useI18n } from '@vben/locales';

import {
  deleteClaimDraftApi,
  exportClaimsApi,
  exportMyClaimsApi,
  submitClaimBatchApi,
  submitClaimSingleApi,
  withdrawClaimApi,
} from '#/api';
import { buildTimestampedFileName, saveBlob } from '#/utils/download';
import {
  handleActionError,
  toastError,
  toastSuccess,
  toastWarning,
} from '#/utils/message';
import { confirmAction, confirmDelete, promptText } from '#/utils/modal';

/** 后端出错时会返回 JSON Blob 而非 xlsx，据此判断并走提示分支 */
function isJsonBlob(blob: Blob): boolean {
  return !!blob.type && blob.type.includes('application/json');
}

/** 从 JSON 错误 Blob 文本中提取可读信息（FastAPI detail / message） */
function parseBlobErrorMessage(text: string, fallback: string): string {
  try {
    const errObj = JSON.parse(text);
    if (errObj?.detail) {
      if (typeof errObj.detail === 'string') return errObj.detail;
      if (Array.isArray(errObj.detail) && errObj.detail.length > 0) {
        return errObj.detail.map((e: any) => e.msg || String(e)).join('; ');
      }
    } else if (errObj?.message) {
      return errObj.message;
    }
  } catch {
    /* ignore parse error */
  }
  return fallback;
}

export function useClaimActions() {
  const { t } = useI18n();

  const loading = ref(false);

  /** 撤回报销（可选填备注） */
  async function handleWithdraw(item: ClaimApi.ClaimResponse) {
    const withdrawComment = await promptText({
      inputType: 'textarea',
      message: t('page.claim.messages.withdrawPrompt'),
      placeholder: t('page.claim.form.withdrawCommentPlaceholder'),
      title: t('page.claim.buttons.withdraw'),
      type: 'warning',
      validate: (val: string) =>
        !val || val.length <= 500
          ? true
          : t('page.claim.messages.withdrawCommentTooLong'),
    });
    if (withdrawComment === null) return;

    loading.value = true;
    try {
      await withdrawClaimApi(item.id, withdrawComment || null);
      toastSuccess(t('page.claim.messages.withdrawSuccess'));
      return true;
    } catch (error) {
      handleActionError(
        'claim/useClaimActions',
        error,
        t('page.claim.messages.withdrawFailed'),
      );
      return false;
    } finally {
      loading.value = false;
    }
  }

  /** 提交单条草稿（draft → pending） */
  async function handleSubmitSingle(item: ClaimApi.ClaimResponse) {
    const confirmed = await confirmAction({
      message: t('page.claim.messages.submitSingleConfirm'),
      title: t('page.claim.buttons.submit'),
    });
    if (!confirmed) return;

    loading.value = true;
    try {
      await submitClaimSingleApi(item.id);
      toastSuccess(t('page.claim.messages.submitSuccess'));
      return true;
    } catch (error) {
      handleActionError(
        'claim/useClaimActions',
        error,
        t('page.claim.messages.submitFailed'),
      );
      return false;
    } finally {
      loading.value = false;
    }
  }

  /** 批量提交草稿（多条 draft 聚合为一条 pending） */
  async function handleSubmitBatch(itemIds: string[]) {
    if (itemIds.length === 0) {
      toastWarning(t('page.claim.messages.selectDraftFirst'));
      return false;
    }
    const confirmed = await confirmAction({
      message: t('page.claim.messages.submitBatchConfirm', {
        count: itemIds.length,
      }),
      title: t('page.claim.buttons.batchSubmit'),
    });
    if (!confirmed) return false;

    loading.value = true;
    try {
      await submitClaimBatchApi(itemIds);
      toastSuccess(t('page.claim.messages.batchSubmitSuccess'));
      return true;
    } catch (error) {
      handleActionError(
        'claim/useClaimActions',
        error,
        t('page.claim.messages.submitFailed'),
      );
      return false;
    } finally {
      loading.value = false;
    }
  }

  /** 删除草稿（仅 draft 状态） */
  async function handleDeleteDraft(item: ClaimApi.ClaimResponse) {
    const confirmed = await confirmDelete({
      message: t('page.claim.messages.deleteDraftConfirm'),
      title: t('page.claim.buttons.delete'),
    });
    if (!confirmed) return false;

    loading.value = true;
    try {
      await deleteClaimDraftApi(item.id);
      toastSuccess(t('page.claim.messages.deleteSuccess'));
      return true;
    } catch (error) {
      handleActionError(
        'claim/useClaimActions',
        error,
        t('page.claim.messages.deleteFailed'),
      );
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 导出报销 Excel
   * @param claimIds 可选，指定要导出的 claim_id 列表；不传则导出全部已通过（approved）
   */
  async function handleExport(claimIds?: string[]) {
    loading.value = true;
    try {
      const blob = await exportMyClaimsApi(claimIds);
      // 处理后端返回的错误信息（JSON 格式的错误 Blob）
      if (isJsonBlob(blob)) {
        const text = await blob.text();
        toastError(
          parseBlobErrorMessage(text, t('page.claim.messages.exportFailed')),
        );
        return false;
      }
      saveBlob(blob, buildTimestampedFileName('claims', 'xlsx'));
      toastSuccess(t('page.claim.messages.exportSuccess'));
      return true;
    } catch (error) {
      // 请求类错误由响应拦截器统一提示（responseType 为 blob，此处再解析 detail 也拿不到内容）
      handleActionError(
        'claim/useClaimActions',
        error,
        t('page.claim.messages.exportFailed'),
      );
      return false;
    } finally {
      loading.value = false;
    }
  }

  /**
   * 导出组织级报销 Excel（跨员工，仅已通过）。
   * 按提交月份（created_at）分 sheet；需 claim_management / claim_org_export 权限。
   * @param group 'month' → 每提交月一个 sheet；'person_month' → 每员工+提交月一个 sheet
   */
  async function handleOrgExport(group: 'month' | 'person_month') {
    loading.value = true;
    try {
      const blob = await exportClaimsApi(group);
      if (isJsonBlob(blob)) {
        const text = await blob.text();
        toastError(
          parseBlobErrorMessage(text, t('page.claim.messages.exportFailed')),
        );
        return false;
      }
      const base =
        group === 'person_month' ? '报销记录_按人月' : '报销记录_按月';
      saveBlob(blob, buildTimestampedFileName(base, 'xlsx'));
      toastSuccess(t('page.claim.messages.exportSuccess'));
      return true;
    } catch (error) {
      handleActionError(
        'claim/useClaimActions',
        error,
        t('page.claim.messages.exportFailed'),
      );
      return false;
    } finally {
      loading.value = false;
    }
  }

  return {
    actionLoading: loading,
    handleWithdraw,
    handleSubmitSingle,
    handleSubmitBatch,
    handleDeleteDraft,
    handleExport,
    handleOrgExport,
  };
}
