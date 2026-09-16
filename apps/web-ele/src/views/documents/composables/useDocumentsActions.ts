import type { DocumentApi } from '#/api';

import { ref } from 'vue';

import { useI18n } from '@vben/locales';

import { ElMessage } from 'element-plus';

import {
  createFolderApi,
  deleteDocumentApi,
  deleteFolderApi,
  updateFolderApi,
} from '#/api';
import { confirmDelete, promptText } from '#/utils/modal';

export function useDocumentsActions() {
  const { t } = useI18n();

  const loading = ref(false);

  /** 弹出输入框获取文件夹名；取消返回 null */
  async function promptFolderName(initial = ''): Promise<null | string> {
    return promptText({
      initialValue: initial,
      message: t('page.documents.folderNameLabel'),
      placeholder: t('page.documents.folderNamePlaceholder'),
      validate: (value: string) =>
        value.trim().length > 0 || t('page.documents.folderNameRequired'),
    });
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
    const confirmed = await confirmDelete({
      message: t('page.documents.confirmDelete', { name: row.title }),
      title: t('page.documents.deleteTitle'),
    });
    if (!confirmed) return false;
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
    const confirmed = await confirmDelete({
      message: t('page.documents.confirmDeleteFolder', { name: folder.name }),
      title: t('page.documents.deleteFolderTitle'),
    });
    if (!confirmed) return false;
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
