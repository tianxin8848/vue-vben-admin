<script lang="ts" setup>
import type { DocumentApi } from '#/api';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useI18n } from '@vben/locales';

import dayjs from 'dayjs';
import {
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
  createDocumentApi,
  deleteDocumentApi,
  getDocumentMetaApi,
  getDocumentsApi,
  getUserInfoApi,
  updateDocumentApi,
} from '#/api';

const { t } = useI18n();

// ─── 数据与权限 ─────────────────────────────────────────────────────────────
const loading = ref(false);
const documents = ref<DocumentApi.DocumentResponse[]>([]);
const keyword = ref('');

/** document_library_manage：可上传 / 编辑 / 删除 */
const canManage = ref(false);
const meta = ref<DocumentApi.DocumentMeta>({
  allowed_extensions: [],
  departments: [],
  max_size: 20 * 1024 * 1024,
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

async function loadDocuments() {
  loading.value = true;
  try {
    documents.value = await getDocumentsApi();
  } catch (error) {
    console.error('[documents] load failed', error);
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

// ─── 上传 / 编辑 弹窗 ───────────────────────────────────────────────────────
const dialogVisible = ref(false);
const dialogMode = ref<'create' | 'edit'>('create');
const submitting = ref(false);
const uploadRef = ref<InstanceType<typeof ElUpload>>();
const editingId = ref<null | string>(null);

const form = reactive<{
  departments: string[];
  file: File | null;
  title: string;
}>({
  title: '',
  departments: [],
  file: null,
});

function resetForm() {
  form.title = '';
  form.departments = [];
  form.file = null;
  editingId.value = null;
  uploadRef.value?.clearFiles();
}

function openCreate() {
  dialogMode.value = 'create';
  resetForm();
  dialogVisible.value = true;
}

function openEdit(row: DocumentApi.DocumentResponse) {
  dialogMode.value = 'edit';
  resetForm();
  editingId.value = row.id;
  form.title = row.title;
  form.departments = [...(row.viewer_departments ?? [])];
  dialogVisible.value = true;
}

function handleFileChange(uploadFile: { raw?: File }) {
  form.file = uploadFile.raw ?? null;
}

function validateFile(): boolean {
  const file = form.file;
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

async function handleSubmit() {
  if (dialogMode.value === 'create') {
    if (!validateFile()) return;
  } else if (!form.title.trim()) {
    ElMessage.warning(t('page.documents.titleRequired'));
    return;
  }

  submitting.value = true;
  try {
    if (dialogMode.value === 'create') {
      const fd = new FormData();
      if (form.title.trim()) fd.append('title', form.title.trim());
      if (form.file) fd.append('file', form.file);
      for (const dept of form.departments) {
        fd.append('viewer_departments', dept);
      }
      await createDocumentApi(fd);
      ElMessage.success(t('page.documents.createSuccess'));
    } else if (editingId.value) {
      await updateDocumentApi(editingId.value, {
        title: form.title.trim(),
        viewer_departments: form.departments,
      });
      ElMessage.success(t('page.documents.updateSuccess'));
    }
    dialogVisible.value = false;
    await loadDocuments();
  } catch (error) {
    console.error('[documents] submit failed', error);
  } finally {
    submitting.value = false;
  }
}

// ─── 删除 ───────────────────────────────────────────────────────────────────
async function handleDelete(row: DocumentApi.DocumentResponse) {
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
    await loadDocuments();
  } catch (error) {
    console.error('[documents] delete failed', error);
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
  return row.file_url || `/api/v1/documents/${row.id}/file`;
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
  await loadDocuments();
});
</script>

<template>
  <Page :title="t('page.documents.title')">
    <div class="flex flex-col gap-4">
      <!-- 工具栏 -->
      <div
        class="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-3"
      >
        <ElInput
          v-model="keyword"
          :placeholder="t('page.documents.keywordPlaceholder')"
          clearable
          class="w-72"
        />
        <div class="flex items-center gap-2">
          <ElButton @click="loadDocuments">
            {{ t('page.documents.refresh') }}
          </ElButton>
          <ElButton v-if="canManage" type="primary" @click="openCreate">
            {{ t('page.documents.upload') }}
          </ElButton>
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
              <span v-else class="text-muted-foreground">-</span>
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
            :width="canManage ? 220 : 100"
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
                  @click="openEdit(row as DocumentApi.DocumentResponse)"
                >
                  {{ t('page.documents.edit') }}
                </ElLink>
                <ElLink
                  type="danger"
                  :underline="false"
                  @click="handleDelete(row as DocumentApi.DocumentResponse)"
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

    <!-- 上传 / 编辑 弹窗 -->
    <ElDialog
      v-model="dialogVisible"
      :title="
        dialogMode === 'create'
          ? t('page.documents.upload')
          : t('page.documents.editTitle')
      "
      width="560px"
    >
      <ElForm label-position="top">
        <ElFormItem :label="t('page.documents.formTitle')">
          <ElInput
            v-model="form.title"
            :placeholder="t('page.documents.titlePlaceholder')"
            :maxlength="200"
            clearable
          />
        </ElFormItem>
        <ElFormItem
          v-if="dialogMode === 'create'"
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
        </ElFormItem>
        <ElFormItem :label="t('page.documents.formDepartments')">
          <ElSelect
            v-model="form.departments"
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
        <ElButton @click="dialogVisible = false">
          {{ t('page.documents.cancel') }}
        </ElButton>
        <ElButton :loading="submitting" type="primary" @click="handleSubmit">
          {{ t('page.documents.save') }}
        </ElButton>
      </template>
    </ElDialog>
  </Page>
</template>
