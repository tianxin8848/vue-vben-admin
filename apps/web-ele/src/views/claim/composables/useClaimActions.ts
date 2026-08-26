import type { ClaimApi } from '#/api';

import { ref } from 'vue';

import { useI18n } from '@vben/locales';

import { ElMessage, ElMessageBox } from 'element-plus';

import {
  deleteClaimDraftApi,
  exportMyClaimsApi,
  submitClaimBatchApi,
  submitClaimSingleApi,
  withdrawClaimApi,
} from '#/api';

export function useClaimActions() {
  const { t } = useI18n();

  const loading = ref(false);

  /** 撤回报销（可选填备注） */
  async function handleWithdraw(item: ClaimApi.ClaimResponse) {
    let withdrawComment: string;
    try {
      const { value } = await ElMessageBox.prompt(
        t('page.claim.messages.withdrawPrompt'),
        t('page.claim.buttons.withdraw'),
        {
          type: 'warning',
          confirmButtonText: t('common.confirm'),
          cancelButtonText: t('common.cancel'),
          inputType: 'textarea',
          inputPlaceholder: t('page.claim.form.withdrawCommentPlaceholder'),
          inputValidator: (val: string) => {
            if (val && val.length > 500) {
              return t('page.claim.messages.withdrawCommentTooLong');
            }
            return true;
          },
        },
      );
      withdrawComment = (value || '').trim();
    } catch {
      return;
    }

    loading.value = true;
    try {
      await withdrawClaimApi(item.id, withdrawComment || null);
      ElMessage.success(t('page.claim.messages.withdrawSuccess'));
      return true;
    } catch {
      ElMessage.error(t('page.claim.messages.withdrawFailed'));
      return false;
    } finally {
      loading.value = false;
    }
  }

  /** 提交单条草稿（draft → pending） */
  async function handleSubmitSingle(item: ClaimApi.ClaimResponse) {
    try {
      await ElMessageBox.confirm(
        t('page.claim.messages.submitSingleConfirm'),
        t('page.claim.buttons.submit'),
        {
          type: 'warning',
          confirmButtonText: t('common.confirm'),
          cancelButtonText: t('common.cancel'),
        },
      );
    } catch {
      return;
    }

    loading.value = true;
    try {
      await submitClaimSingleApi(item.id);
      ElMessage.success(t('page.claim.messages.submitSuccess'));
      return true;
    } catch {
      ElMessage.error(t('page.claim.messages.submitFailed'));
      return false;
    } finally {
      loading.value = false;
    }
  }

  /** 批量提交草稿（多条 draft 聚合为一条 pending） */
  async function handleSubmitBatch(itemIds: string[]) {
    if (itemIds.length === 0) {
      ElMessage.warning(t('page.claim.messages.selectDraftFirst'));
      return false;
    }
    try {
      await ElMessageBox.confirm(
        t('page.claim.messages.submitBatchConfirm', { count: itemIds.length }),
        t('page.claim.buttons.batchSubmit'),
        {
          type: 'warning',
          confirmButtonText: t('common.confirm'),
          cancelButtonText: t('common.cancel'),
        },
      );
    } catch {
      return;
    }

    loading.value = true;
    try {
      await submitClaimBatchApi(itemIds);
      ElMessage.success(t('page.claim.messages.batchSubmitSuccess'));
      return true;
    } catch {
      ElMessage.error(t('page.claim.messages.submitFailed'));
      return false;
    } finally {
      loading.value = false;
    }
  }

  /** 删除草稿（仅 draft 状态） */
  async function handleDeleteDraft(item: ClaimApi.ClaimResponse) {
    try {
      await ElMessageBox.confirm(
        t('page.claim.messages.deleteDraftConfirm'),
        t('page.claim.buttons.delete'),
        {
          type: 'error',
          confirmButtonText: t('common.confirm'),
          cancelButtonText: t('common.cancel'),
        },
      );
    } catch {
      return;
    }

    loading.value = true;
    try {
      await deleteClaimDraftApi(item.id);
      ElMessage.success(t('page.claim.messages.deleteSuccess'));
      return true;
    } catch {
      ElMessage.error(t('page.claim.messages.deleteFailed'));
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
      if (blob.type && blob.type.includes('application/json')) {
        const text = await blob.text();
        let msg = t('page.claim.messages.exportFailed');
        try {
          const errObj = JSON.parse(text);
          if (errObj?.detail) {
            if (typeof errObj.detail === 'string') {
              msg = errObj.detail;
            } else if (
              Array.isArray(errObj.detail) &&
              errObj.detail.length > 0
            ) {
              msg = errObj.detail
                .map((e: any) => e.msg || String(e))
                .join('; ');
            }
          } else if (errObj?.message) {
            msg = errObj.message;
          }
        } catch {
          /* ignore parse error */
        }
        ElMessage.error(msg);
        return false;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const now = new Date();
      const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      a.download = `claims_${ymd}.xlsx`;
      document.body.append(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      ElMessage.success(t('page.claim.messages.exportSuccess'));
      return true;
    } catch (error: any) {
      // 优先使用后端返回的错误详情
      const detail = error?.response?.data?.detail || error?.message;
      let msg = t('page.claim.messages.exportFailed');
      if (typeof detail === 'string') {
        msg = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        msg = detail.map((e: any) => e.msg || String(e)).join('; ');
      }
      ElMessage.error(msg);
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
  };
}
