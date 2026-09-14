import type { DocumentApi } from '#/api';

import { ref } from 'vue';

import { useI18n } from '@vben/locales';

import { ElMessage, ElMessageBox } from 'element-plus';

import {
  createFolderApi,
  deleteDocumentApi,
  deleteFolderApi,
  updateFolderApi,
} from '#/api';

export function useDocumentsActions() {
  const { t } = useI18n();

  const loading = ref(false);

  /** 弹出输入框获取文件夹名；取消返回 null */
  async function promptFolderName(initial = ''): Promise<null | string> {
    try {
      const res = await ElMessageBox.prompt(
        t('page.documents.folderNameLabel'),
        {
          confirmButtonText: t('page.documents.confirm'),
          cancelButtonText: t('page.documents.cancel'),
          inputValue: initial,
          inputPlaceholder: t('page.documents.folderNamePlaceholder'),
          inputValidator: (value: string) =>
            value.trim().length > 0 || t('page.documents.folderNameRequired'),
        },
      );
      return (res.value ?? '').trim();
    } catch {
      return null;
    }
  }

  /** 新建文件夹（parentId = null 表示根目录）；成功返回 true */
  async function handleCreateFolder(parentId: null | string) {
    const name = await promptFolderName();
    if (!name) return false;
    loading.value = true;
    try {
      await createFolderApi({ name, parent_id: parentId });
      ElMessage.success(t('page.documents.folderCreateSuccess'));
      return true;
    } catch (error) {
      console.error('[documents] create folder failed', error);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /** 重命名文件夹；成功返回 true */
  async function handleRenameFolder(folder: DocumentApi.FolderResponse) {
    const name = await promptFolderName(folder.name);
    if (!name) return false;
    loading.value = true;
    try {
      await updateFolderApi(folder.id, { name });
      ElMessage.success(t('page.documents.folderRenameSuccess'));
      return true;
    } catch (error) {
      console.error('[documents] rename folder failed', error);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /** 删除文件（二次确认）；成功返回 true */
  async function handleDeleteDoc(row: DocumentApi.DocumentResponse) {
    try {
      await ElMessageBox.confirm(
        t('page.documents.confirmDelete', { name: row.title }),
        t('page.documents.deleteTitle'),
        {
          confirmButtonText: t('page.documents.confirmDeleteBtn'),
          cancelButtonText: t('page.documents.cancel'),
          type: 'warning',
          confirmButtonClass: 'el-button--danger',
        },
      );
    } catch {
      return false;
    }
    loading.value = true;
    try {
      await deleteDocumentApi(row.id);
      ElMessage.success(t('page.documents.deleteSuccess'));
      return true;
    } catch (error) {
      console.error('[documents] delete failed', error);
      return false;
    } finally {
      loading.value = false;
    }
  }

  /** 删除空文件夹（二次确认）；成功返回 true */
  async function handleDeleteFolder(folder: DocumentApi.FolderResponse) {
    try {
      await ElMessageBox.confirm(
        t('page.documents.confirmDeleteFolder', { name: folder.name }),
        t('page.documents.deleteFolderTitle'),
        {
          confirmButtonText: t('page.documents.confirmDeleteBtn'),
          cancelButtonText: t('page.documents.cancel'),
          type: 'warning',
          confirmButtonClass: 'el-button--danger',
        },
      );
    } catch {
      return false;
    }
    loading.value = true;
    try {
      await deleteFolderApi(folder.id);
      ElMessage.success(t('page.documents.deleteFolderSuccess'));
      return true;
    } catch (error) {
      console.error('[documents] delete folder failed', error);
      return false;
    } finally {
      loading.value = false;
    }
  }

  return {
    actionLoading: loading,
    handleCreateFolder,
    handleRenameFolder,
    handleDeleteDoc,
    handleDeleteFolder,
  };
}
