<script lang="ts" setup>
import type { DocumentApi } from '#/api';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useI18n } from '@vben/locales';

import dayjs from 'dayjs';
import {
  ElBreadcrumb,
  ElBreadcrumbItem,
  ElButton,
  ElDialog,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElLink,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
  ElUpload,
} from 'element-plus';

import {
  browseDocumentsApi,
  buildDocumentFileUrl,
  createDocumentApi,
  createFolderApi,
  deleteDocumentApi,
  deleteFolderApi,
  getDocumentMetaApi,
  getUserInfoApi,
  listFolderMoveTargetsApi,
  updateDocumentApi,
  updateFolderApi,
} from '#/api';

const { t } = useI18n();

// ─── 数据与权限 ─────────────────────────────────────────────────────────────
const loading = ref(false);
/** document_library_manage：可上传 / 新建文件夹 / 编辑 / 移动 / 删除 */
const canManage = ref(false);

const currentFolderId = ref<null | string>(null);
const ancestors = ref<DocumentApi.FolderResponse[]>([]);
const folders = ref<DocumentApi.FolderResponse[]>([]);
const documents = ref<DocumentApi.DocumentResponse[]>([]);
const keyword = ref('');

const meta = ref<DocumentApi.DocumentMeta>({
  allowed_extensions: [],
  departments: [],
  max_size: 20 * 1024 * 1024,
});

/** 面包屑：根目录 + 后端返回的祖先链 */
const crumbs = computed(() => [
  { id: null as null | string, name: t('page.documents.root') },
  ...ancestors.value.map((f) => ({ id: f.id, name: f.name })),
]);

const filteredFolders = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return folders.value;
  return folders.value.filter((f) => f.name?.toLowerCase().includes(kw));
});

const filteredDocuments = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return documents.value;
  return documents.value.filter(
    (d) =>
      d.title?.toLowerCase().includes(kw) ||
      d.original_name?.toLowerCase().includes(kw) ||
      d.uploader_full_name?.toLowerCase().includes(kw) ||
      d.uploader_username?.toLowerCase().includes(kw),
  );
});

const uploadAccept = computed(() =>
  (meta.value.allowed_extensions ?? []).join(','),
);

const uploadTip = computed(() =>
  t('page.documents.uploadTip', {
    ext: (meta.value.allowed_extensions ?? []).join(' / '),
    size: (meta.value.max_size / 1024 / 1024).toFixed(0),
  }),
);

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

async function loadMeta() {
  try {
    meta.value = await getDocumentMetaApi();
  } catch (error) {
    // 403 等异常由请求拦截器提示，页面保持默认规则
    console.warn('[documents] meta unavailable', error);
  }
}

function openFolder(folderId: null | string) {
  keyword.value = '';
  loadBrowse(folderId);
}

// ─── 上传 / 编辑文件 弹窗 ────────────────────────────────────────────────────
const docDialogVisible = ref(false);
const docDialogMode = ref<'create' | 'edit'>('create');
const docSubmitting = ref(false);
const uploadRef = ref<InstanceType<typeof ElUpload>>();
const editingId = ref<null | string>(null);

const docForm = reactive<{
  departments: string[];
  file: File | null;
  title: string;
}>({
  title: '',
  departments: [],
  file: null,
});

function resetDocForm() {
  docForm.title = '';
  docForm.departments = [];
  docForm.file = null;
  editingId.value = null;
  uploadRef.value?.clearFiles();
}

function openCreate() {
  docDialogMode.value = 'create';
  resetDocForm();
  docDialogVisible.value = true;
}

function openEditDoc(row: DocumentApi.DocumentResponse) {
  docDialogMode.value = 'edit';
  resetDocForm();
  editingId.value = row.id;
  docForm.title = row.title;
  docForm.departments = [...(row.viewer_departments ?? [])];
  docDialogVisible.value = true;
}

function handleFileChange(uploadFile: { raw?: File }) {
  docForm.file = uploadFile.raw ?? null;
}

function validateFile(): boolean {
  const file = docForm.file;
  if (!file) {
    ElMessage.warning(t('page.documents.fileRequired'));
    return false;
  }
  const ext = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`;
  const allowed = meta.value.allowed_extensions ?? [];
  if (allowed.length > 0 && !allowed.includes(ext)) {
    ElMessage.warning(t('page.documents.extNotAllowed'));
    return false;
  }
  if (file.size > meta.value.max_size) {
    ElMessage.warning(
      t('page.documents.fileTooLarge', {
        size: (meta.value.max_size / 1024 / 1024).toFixed(0),
      }),
    );
    return false;
  }
  return true;
}

async function handleDocSubmit() {
  if (docDialogMode.value === 'create') {
    if (!validateFile()) return;
  } else if (!docForm.title.trim()) {
    ElMessage.warning(t('page.documents.titleRequired'));
    return;
  }

  docSubmitting.value = true;
  try {
    if (docDialogMode.value === 'create') {
      const fd = new FormData();
      if (docForm.title.trim()) fd.append('title', docForm.title.trim());
      if (docForm.file) fd.append('file', docForm.file);
      // 上传到当前所在目录，空串表示根目录
      fd.append('folder_id', currentFolderId.value ?? '');
      for (const dept of docForm.departments) {
        fd.append('viewer_departments', dept);
      }
      await createDocumentApi(fd);
      ElMessage.success(t('page.documents.createSuccess'));
    } else if (editingId.value) {
      await updateDocumentApi(editingId.value, {
        title: docForm.title.trim(),
        viewer_departments: docForm.departments,
      });
      ElMessage.success(t('page.documents.updateSuccess'));
    }
    docDialogVisible.value = false;
    await loadBrowse();
  } catch (error) {
    console.error('[documents] submit failed', error);
  } finally {
    docSubmitting.value = false;
  }
}

// ─── 新建 / 重命名 文件夹 ────────────────────────────────────────────────────
/** 弹出输入框获取文件夹名；取消返回 null */
async function promptFolderName(initial = ''): Promise<null | string> {
  try {
    const res = await ElMessageBox.prompt(t('page.documents.folderNameLabel'), {
      confirmButtonText: t('page.documents.confirm'),
      cancelButtonText: t('page.documents.cancel'),
      inputValue: initial,
      inputPlaceholder: t('page.documents.folderNamePlaceholder'),
      inputValidator: (value: string) =>
        value.trim().length > 0 || t('page.documents.folderNameRequired'),
    });
    return (res.value ?? '').trim();
  } catch {
    return null;
  }
}

async function handleCreateFolder() {
  const name = await promptFolderName();
  if (!name) return;
  try {
    await createFolderApi({
      name,
      parent_id: currentFolderId.value,
    });
    ElMessage.success(t('page.documents.folderCreateSuccess'));
    await loadBrowse();
  } catch (error) {
    console.error('[documents] create folder failed', error);
  }
}

async function handleRenameFolder(folder: DocumentApi.FolderResponse) {
  const name = await promptFolderName(folder.name);
  if (!name) return;
  try {
    await updateFolderApi(folder.id, { name });
    ElMessage.success(t('page.documents.folderRenameSuccess'));
    await loadBrowse();
  } catch (error) {
    console.error('[documents] rename folder failed', error);
  }
}

// ─── 移动（文件 / 文件夹共用一个弹窗） ───────────────────────────────────────
const moveDialogVisible = ref(false);
const moveSubmitting = ref(false);
const moveTargets = ref<DocumentApi.FolderMoveTarget[]>([]);
/** '' 代表根目录（后端 id = null） */
const moveTargetId = ref('');
const moveContext = ref<{
  excludeId?: null | string;
  id: string;
  kind: 'file' | 'folder';
  parentId: null | string;
}>({ id: '', kind: 'file', parentId: null });

async function openMoveFile(row: DocumentApi.DocumentResponse) {
  await prepareMove({
    id: row.id,
    kind: 'file',
    parentId: row.folder_id ?? null,
  });
}

async function openMoveFolder(folder: DocumentApi.FolderResponse) {
  await prepareMove({
    id: folder.id,
    kind: 'folder',
    parentId: folder.parent_id ?? null,
    excludeId: folder.id,
  });
}

async function prepareMove(ctx: {
  excludeId?: null | string;
  id: string;
  kind: 'file' | 'folder';
  parentId: null | string;
}) {
  moveContext.value = ctx;
  moveTargetId.value = ctx.parentId ?? '';
  moveTargets.value = [];
  moveDialogVisible.value = true;
  try {
    moveTargets.value = await listFolderMoveTargetsApi(ctx.excludeId);
  } catch (error) {
    console.error('[documents] load move targets failed', error);
  }
}

async function confirmMove() {
  const target = moveTargetId.value || null;
  moveSubmitting.value = true;
  try {
    moveContext.value.kind === 'folder'
      ? await updateFolderApi(moveContext.value.id, { parent_id: target })
      : await updateDocumentApi(moveContext.value.id, { folder_id: target });
    ElMessage.success(t('page.documents.moveSuccess'));
    moveDialogVisible.value = false;
    // 被移动的对象可能已不在当前目录
    await loadBrowse();
  } catch (error) {
    console.error('[documents] move failed', error);
  } finally {
    moveSubmitting.value = false;
  }
}

// ─── 删除（文件 / 文件夹） ───────────────────────────────────────────────────
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
    return;
  }
  try {
    await deleteDocumentApi(row.id);
    ElMessage.success(t('page.documents.deleteSuccess'));
    await loadBrowse();
  } catch (error) {
    console.error('[documents] delete failed', error);
  }
}

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
    return;
  }
  try {
    await deleteFolderApi(folder.id);
    ElMessage.success(t('page.documents.deleteFolderSuccess'));
    await loadBrowse();
  } catch (error) {
    console.error('[documents] delete folder failed', error);
  }
}

// ─── 展示辅助 ───────────────────────────────────────────────────────────────
function formatSize(bytes: number) {
  if (bytes === null || bytes === undefined) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function formatTime(v?: null | string) {
  return v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-';
}

function fileUrl(row: DocumentApi.DocumentResponse) {
  return row.file_url || buildDocumentFileUrl(row.id);
}

// ─── 初始化 ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const me = await getUserInfoApi();
    canManage.value = (me.module_permissions ?? []).some(
      (p) =>
        p.module_code === 'document_library_manage' && p.can_view !== false,
    );
  } catch (error) {
    console.warn('[documents] failed to read user permissions', error);
  }
  if (canManage.value) {
    await loadMeta();
  }
  await loadBrowse(null);
});
</script>

<template>
  <Page :title="t('page.documents.title')">
    <div class="flex flex-col gap-4">
      <!-- 工具栏：面包屑 + 搜索 + 操作 -->
      <div
        class="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3"
      >
        <div class="flex flex-wrap items-center gap-4">
          <ElBreadcrumb separator="/">
            <ElBreadcrumbItem
              v-for="(crumb, idx) in crumbs"
              :key="crumb.id ?? 'root'"
            >
              <ElLink
                v-if="idx < crumbs.length - 1"
                :underline="false"
                @click="openFolder(crumb.id)"
              >
                {{ crumb.name }}
              </ElLink>
              <span v-else class="font-medium">{{ crumb.name }}</span>
            </ElBreadcrumbItem>
          </ElBreadcrumb>
          <ElInput
            v-model="keyword"
            :placeholder="t('page.documents.keywordPlaceholder')"
            clearable
            class="w-64"
          />
        </div>
        <div class="flex items-center gap-2">
          <ElButton @click="loadBrowse()">
            {{ t('page.documents.refresh') }}
          </ElButton>
          <template v-if="canManage">
            <ElButton @click="handleCreateFolder">
              {{ t('page.documents.newFolder') }}
            </ElButton>
            <ElButton type="primary" @click="openCreate">
              {{ t('page.documents.upload') }}
            </ElButton>
          </template>
        </div>
      </div>

      <!-- 文件夹 -->
      <div
        v-if="filteredFolders.length"
        class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <div
          v-for="folder in filteredFolders"
          :key="folder.id"
          class="flex flex-col gap-2 rounded-lg border bg-card p-4 shadow-sm transition-colors hover:border-primary"
        >
          <div class="flex items-start justify-between gap-2">
            <ElTag type="warning" size="small">
              {{ t('page.documents.folderTag') }}
            </ElTag>
          </div>
          <button
            type="button"
            class="truncate text-left text-sm font-semibold text-foreground hover:text-primary"
            :title="folder.name"
            @click="openFolder(folder.id)"
          >
            {{ folder.name }}
          </button>
          <div class="mt-1 flex flex-wrap gap-1">
            <ElButton size="small" @click="openFolder(folder.id)">
              {{ t('page.documents.open') }}
            </ElButton>
            <template v-if="canManage">
              <ElButton size="small" @click="handleRenameFolder(folder)">
                {{ t('page.documents.rename') }}
              </ElButton>
              <ElButton size="small" @click="openMoveFolder(folder)">
                {{ t('page.documents.move') }}
              </ElButton>
              <ElButton
                size="small"
                type="danger"
                @click="handleDeleteFolder(folder)"
              >
                {{ t('page.documents.delete') }}
              </ElButton>
            </template>
          </div>
        </div>
      </div>

      <!-- 文件列表 -->
      <div class="rounded-lg border bg-card">
        <ElTable
          v-loading="loading"
          :data="filteredDocuments"
          row-key="id"
          stripe
        >
          <ElTableColumn
            :label="t('page.documents.titleCol')"
            min-width="220"
            prop="title"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              <ElLink
                :href="fileUrl(row as DocumentApi.DocumentResponse)"
                target="_blank"
                type="primary"
                :underline="false"
              >
                {{ row.title }}
              </ElLink>
            </template>
          </ElTableColumn>
          <ElTableColumn
            :label="t('page.documents.fileName')"
            min-width="180"
            prop="original_name"
            show-overflow-tooltip
          />
          <ElTableColumn
            :label="t('page.documents.size')"
            prop="size_bytes"
            width="110"
          >
            <template #default="{ row }">
              {{ formatSize(row.size_bytes) }}
            </template>
          </ElTableColumn>
          <ElTableColumn
            :label="t('page.documents.viewerDepartments')"
            min-width="180"
          >
            <template #default="{ row }">
              <template v-if="row.viewer_departments?.length">
                <ElTag
                  v-for="dept in row.viewer_departments"
                  :key="dept"
                  class="mb-1 mr-1"
                  size="small"
                  type="info"
                >
                  {{ dept }}
                </ElTag>
              </template>
              <span v-else class="text-muted-foreground">{{
                t('page.documents.managersOnly')
              }}</span>
            </template>
          </ElTableColumn>
          <ElTableColumn
            :label="t('page.documents.uploader')"
            min-width="120"
            prop="uploader_full_name"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              {{ row.uploader_full_name || row.uploader_username || '-' }}
            </template>
          </ElTableColumn>
          <ElTableColumn
            :label="t('page.documents.createdAt')"
            prop="created_at"
            width="160"
          >
            <template #default="{ row }">
              <span class="text-xs text-muted-foreground">
                {{ formatTime(row.created_at) }}
              </span>
            </template>
          </ElTableColumn>
          <ElTableColumn
            :label="t('page.documents.actions')"
            fixed="right"
            :width="canManage ? 270 : 100"
          >
            <template #default="{ row }">
              <ElLink
                :href="fileUrl(row as DocumentApi.DocumentResponse)"
                target="_blank"
                class="mr-3"
                type="primary"
                :underline="false"
              >
                {{ t('page.documents.view') }}
              </ElLink>
              <template v-if="canManage">
                <ElLink
                  class="mr-3"
                  type="warning"
                  :underline="false"
                  @click="openEditDoc(row as DocumentApi.DocumentResponse)"
                >
                  {{ t('page.documents.edit') }}
                </ElLink>
                <ElLink
                  class="mr-3"
                  type="info"
                  :underline="false"
                  @click="openMoveFile(row as DocumentApi.DocumentResponse)"
                >
                  {{ t('page.documents.move') }}
                </ElLink>
                <ElLink
                  type="danger"
                  :underline="false"
                  @click="handleDeleteDoc(row as DocumentApi.DocumentResponse)"
                >
                  {{ t('page.documents.delete') }}
                </ElLink>
              </template>
            </template>
          </ElTableColumn>
          <template #empty>
            <ElEmpty :description="t('page.documents.empty')" />
          </template>
        </ElTable>
      </div>
    </div>

    <!-- 上传 / 编辑文件 弹窗 -->
    <ElDialog
      v-model="docDialogVisible"
      :title="
        docDialogMode === 'create'
          ? t('page.documents.upload')
          : t('page.documents.editTitle')
      "
      width="560px"
    >
      <ElForm label-position="top">
        <ElFormItem :label="t('page.documents.formTitle')">
          <ElInput
            v-model="docForm.title"
            :placeholder="t('page.documents.titlePlaceholder')"
            :maxlength="200"
            clearable
          />
        </ElFormItem>
        <ElFormItem
          v-if="docDialogMode === 'create'"
          :label="t('page.documents.file')"
          required
        >
          <ElUpload
            ref="uploadRef"
            :accept="uploadAccept"
            :auto-upload="false"
            :limit="1"
            @change="handleFileChange"
          >
            <ElButton>{{ t('page.documents.selectFile') }}</ElButton>
            <template #tip>
              <span class="block text-xs text-muted-foreground">
                {{ uploadTip }}
              </span>
            </template>
          </ElUpload>
          <p class="mt-1 text-xs text-muted-foreground">
            {{
              t('page.documents.uploadLocation', {
                folder:
                  crumbs[crumbs.length - 1]?.name || t('page.documents.root'),
              })
            }}
          </p>
        </ElFormItem>
        <ElFormItem :label="t('page.documents.formDepartments')">
          <ElSelect
            v-model="docForm.departments"
            :placeholder="t('page.documents.departmentsPlaceholder')"
            class="w-full"
            clearable
            collapse-tags
            collapse-tags-tooltip
            multiple
          >
            <ElOption
              v-for="dept in meta.departments"
              :key="dept"
              :label="dept"
              :value="dept"
            />
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="docDialogVisible = false">
          {{ t('page.documents.cancel') }}
        </ElButton>
        <ElButton
          :loading="docSubmitting"
          type="primary"
          @click="handleDocSubmit"
        >
          {{ t('page.documents.save') }}
        </ElButton>
      </template>
    </ElDialog>

    <!-- 移动 弹窗 -->
    <ElDialog
      v-model="moveDialogVisible"
      :title="t('page.documents.moveTitle')"
      width="460px"
    >
      <ElForm label-position="top">
        <ElFormItem :label="t('page.documents.moveTarget')">
          <ElSelect v-model="moveTargetId" class="w-full">
            <ElOption
              v-for="target in moveTargets"
              :key="target.id ?? 'root'"
              :label="target.label"
              :value="target.id ?? ''"
            />
          </ElSelect>
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="moveDialogVisible = false">
          {{ t('page.documents.cancel') }}
        </ElButton>
        <ElButton :loading="moveSubmitting" type="primary" @click="confirmMove">
          {{ t('page.documents.save') }}
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
