import type { DocumentApi } from '#/api';

import { computed, onMounted, ref } from 'vue';

import { browseDocumentsApi, getDocumentMetaApi, getUserInfoApi } from '#/api';

import { DEFAULT_DOCUMENT_META, matchesKeyword } from '../data';

export function useDocumentsData() {
  const loading = ref(false);
  /** document_library_manage：可上传 / 新建文件夹 / 编辑 / 移动 / 删除 */
  const canManage = ref(false);

  const currentFolderId = ref<null | string>(null);
  const ancestors = ref<DocumentApi.FolderResponse[]>([]);
  const folders = ref<DocumentApi.FolderResponse[]>([]);
  const documents = ref<DocumentApi.DocumentResponse[]>([]);
  const keyword = ref('');

  const meta = ref<DocumentApi.DocumentMeta>({ ...DEFAULT_DOCUMENT_META });

  // ─── 关键字过滤（文件夹名 / 文件标题、原文件名、上传人） ────────────────────
  const normalizedKeyword = computed(() => keyword.value.trim().toLowerCase());

  const filteredFolders = computed(() =>
    folders.value.filter((f) =>
      matchesKeyword(normalizedKeyword.value, f.name),
    ),
  );

  const filteredDocuments = computed(() =>
    documents.value.filter((d) =>
      matchesKeyword(
        normalizedKeyword.value,
        d.title,
        d.original_name,
        d.uploader_full_name,
        d.uploader_username,
      ),
    ),
  );

  // ─── 目录浏览 ──────────────────────────────────────────────────────────────
  async function loadBrowse(folderId: null | string = currentFolderId.value) {
    loading.value = true;
    try {
      const data = await browseDocumentsApi(folderId);
      currentFolderId.value = data.folder_id ?? null;
      ancestors.value = data.ancestors ?? [];
      folders.value = data.folders ?? [];
      documents.value = data.documents ?? [];
    } catch (error) {
      console.error('[documents] browse failed', error);
      // 文件夹可能已被删除：退回根目录
      if (folderId) {
        await loadBrowse(null);
      }
    } finally {
      loading.value = false;
    }
  }

  /** 打开文件夹：清空关键字并加载该目录 */
  function openFolder(folderId: null | string) {
    keyword.value = '';
    loadBrowse(folderId);
  }

  // ─── 上传规则（仅 document_library_manage） ────────────────────────────────
  async function loadMeta() {
    try {
      meta.value = await getDocumentMetaApi();
    } catch (error) {
      // 403 等异常由请求拦截器提示，页面保持默认规则
      console.warn('[documents] meta unavailable', error);
    }
  }

  // ─── 权限 ─────────────────────────────────────────────────────────────────
  async function initPermissions() {
    try {
      const me = await getUserInfoApi();
      canManage.value = (me.module_permissions ?? []).some(
        (p) =>
          p.module_code === 'document_library_manage' && p.can_view !== false,
      );
    } catch (error) {
      console.warn('[documents] failed to read user permissions', error);
    }
  }

  // ─── 初始化：权限 → 上传规则 → 根目录 ─────────────────────────────────────
  onMounted(async () => {
    await initPermissions();
    if (canManage.value) {
      await loadMeta();
    }
    await loadBrowse(null);
  });

  return {
    // state
    loading,
    canManage,
    currentFolderId,
    ancestors,
    folders,
    documents,
    keyword,
    meta,
    filteredFolders,
    filteredDocuments,
    // actions
    loadBrowse,
    openFolder,
  };
}
