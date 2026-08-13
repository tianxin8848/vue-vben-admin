import type { ClaimApi } from '#/api';

import { ref } from 'vue';

import { useI18n } from '@vben/locales';

import { ElMessage, ElMessageBox } from 'element-plus';

import { exportMyClaimsApi, withdrawClaimApi } from '#/api';

export function useClaimActions() {
  const { t } = useI18n();

  const loading = ref(false);

  async function handleWithdraw(item: ClaimApi.ClaimResponse) {
    try {
      await ElMessageBox.confirm(
        t('page.claim.messages.withdrawConfirm'),
        t('page.claim.buttons.withdraw'),
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
      await withdrawClaimApi(item.id);
      ElMessage.success(t('page.claim.messages.withdrawSuccess'));
      return true;
    } catch {
      ElMessage.error(t('page.claim.messages.withdrawFailed'));
      return false;
    } finally {
      loading.value = false;
    }
  }

  async function handleExport() {
    loading.value = true;
    try {
      const blob = await exportMyClaimsApi();
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
    } catch {
      ElMessage.error(t('page.claim.messages.exportFailed'));
      return false;
    } finally {
      loading.value = false;
    }
  }

  return {
    actionLoading: loading,
    handleWithdraw,
    handleExport,
  };
}
