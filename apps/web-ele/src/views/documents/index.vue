<script lang="ts" setup>
import type { MoveContext } from './data';

import type { DocumentApi } from '#/api';

import { computed, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { useI18n } from '@vben/locales';

import {
  ElBreadcrumb,
  ElBreadcrumbItem,
  ElButton,
  ElEmpty,
  ElInput,
  ElLink,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import DocumentDialog from './components/DocumentDialog.vue';
import MoveDialog from './components/MoveDialog.vue';
import { useDocumentsActions } from './composables/useDocumentsActions';
import { useDocumentsData } from './composables/useDocumentsData';
import { fileUrl, formatSize, formatTime, formatUploader } from './data';

const { t } = useI18n();

// ─── 数据层（目录浏览 + 权限 + 关键字过滤） ──────────────────────────────────
const {
  ancestors,
  canManage,
  currentFolderId,
  filteredDocuments,
  filteredFolders,
  keyword,
  loadBrowse,
  loading,
  meta,
  openFolder,
} = useDocumentsData();

// ─── 操作层（新建/重命名文件夹 + 删除，成功后由本页刷新） ─────────────────────
const {
  handleCreateFolder,
  handleDeleteDoc,
  handleDeleteFolder,
  handleRenameFolder,
} = useDocumentsActions();

// ─── 面包屑：根目录 + 后端返回的祖先链 ──────────────────────────────────────
const crumbs = computed(() => [
  { id: null as null | string, name: t('page.documents.root') },
  ...ancestors.value.map((f) => ({ id: f.id, name: f.name })),
]);

const currentFolderName = computed(
  () => crumbs.value[crumbs.value.length - 1]?.name || t('page.documents.root'),
);

// ─── 上传 / 编辑文件 弹窗 ────────────────────────────────────────────────────
const docDialogVisible = ref(false);
const docDialogMode = ref<'create' | 'edit'>('create');
const editingDoc = ref<DocumentApi.DocumentResponse | null>(null);

function openCreate() {
  docDialogMode.value = 'create';
  editingDoc.value = null;
  docDialogVisible.value = true;
}

function openEditDoc(row: DocumentApi.DocumentResponse) {
  docDialogMode.value = 'edit';
  editingDoc.value = row;
  docDialogVisible.value = true;
}

async function handleDocSuccess() {
  await loadBrowse();
}

// ─── 移动弹窗（文件 / 文件夹共用） ───────────────────────────────────────────
const moveDialogVisible = ref(false);
const moveContext = ref<MoveContext | null>(null);

function openMoveFile(row: DocumentApi.DocumentResponse) {
  moveContext.value = {
    id: row.id,
    kind: 'file',
    parentId: row.folder_id ?? null,
  };
  moveDialogVisible.value = true;
}

function openMoveFolder(folder: DocumentApi.FolderResponse) {
  moveContext.value = {
    id: folder.id,
    kind: 'folder',
    parentId: folder.parent_id ?? null,
    excludeId: folder.id,
  };
  moveDialogVisible.value = true;
}

async function handleMoveSuccess() {
  // 被移动的对象可能已不在当前目录
  await loadBrowse();
}

// ─── 文件夹 / 删除操作：成功后刷新当前目录 ──────────────────────────────────
async function onCreateFolder() {
  if (await handleCreateFolder(currentFolderId.value)) {
    await loadBrowse();
  }
}

async function onRenameFolder(folder: DocumentApi.FolderResponse) {
  if (await handleRenameFolder(folder)) {
    await loadBrowse();
  }
}

async function onDeleteDoc(row: DocumentApi.DocumentResponse) {
  if (await handleDeleteDoc(row)) {
    await loadBrowse();
  }
}

async function onDeleteFolder(folder: DocumentApi.FolderResponse) {
  if (await handleDeleteFolder(folder)) {
    await loadBrowse();
  }
}
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
            <ElButton @click="onCreateFolder">
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
              <ElButton size="small" @click="onRenameFolder(folder)">
                {{ t('page.documents.rename') }}
              </ElButton>
              <ElButton size="small" @click="openMoveFolder(folder)">
                {{ t('page.documents.move') }}
              </ElButton>
              <ElButton
                size="small"
                type="danger"
                @click="onDeleteFolder(folder)"
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
              {{ formatUploader(row as DocumentApi.DocumentResponse) }}
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
                  @click="onDeleteDoc(row as DocumentApi.DocumentResponse)"
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
    <DocumentDialog
      v-model:visible="docDialogVisible"
      :doc="editingDoc"
      :folder-id="currentFolderId"
      :folder-name="currentFolderName"
      :meta="meta"
      :mode="docDialogMode"
      @success="handleDocSuccess"
    />

    <!-- 移动 弹窗 -->
    <MoveDialog
      v-model:visible="moveDialogVisible"
      :context="moveContext"
      @success="handleMoveSuccess"
    />
  </Page>
</template>
