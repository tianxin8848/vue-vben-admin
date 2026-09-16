<script lang="ts" setup>
import type { DataMigrationApi } from '#/api/business/data-migration';

import { reactive, ref } from 'vue';

import { Page, VbenButton } from '@vben/common-ui';

import {
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElTag,
} from 'element-plus';

import {
  backupDataApi,
  exportDataApi,
  getBackupsApi,
  importDataApi,
} from '#/api';
import { $t } from '#/locales';
import { saveBlob } from '#/utils/download';
import { confirmAction } from '#/utils/modal';

const loading = ref(false);

const exportForm = reactive({
  source: 'local',
  scope: '',
});

const importForm = reactive({
  target: 'remote',
  mode: 'overwrite',
  userNullStrategy: 'generate',
});

const importFile = ref<File | null>(null);
const importFileInput = ref<HTMLInputElement | null>(null);

const importMessage = ref('');
const importMessageType = ref<'' | 'error' | 'success'>('');

const backups = ref<DataMigrationApi.BackupItem[]>([]);

const exportLoading = ref(false);
const backupLoading = ref(false);
const importLoading = ref(false);

function showMessage(type: 'error' | 'success', message: string) {
  importMessageType.value = type;
  importMessage.value = message;
}

function clearMessage() {
  importMessageType.value = '';
  importMessage.value = '';
}

async function handleExport() {
  exportLoading.value = true;
  try {
    const exclude =
      exportForm.scope === 'exclude_runtime' ? 'session' : undefined;
    const blob = await exportDataApi(exportForm.source, exclude);
    saveBlob(blob, `data-migration-${exportForm.source}-${Date.now()}.ndjson`);
    ElMessage.success($t('page.system.dataMigrationDetail.exportSuccess'));
  } catch {
    ElMessage.error($t('page.system.dataMigrationDetail.exportFailed'));
  } finally {
    exportLoading.value = false;
  }
}

async function handleBackup() {
  const confirmText = $t('page.system.dataMigrationDetail.backupConfirm', {
    source: exportForm.source,
  });
  const confirmed = await confirmAction({
    message: confirmText,
    title: $t('page.system.dataMigrationDetail.backupConfirmTitle'),
  });
  if (!confirmed) return;
  backupLoading.value = true;
  clearMessage();
  try {
    const exclude =
      exportForm.scope === 'exclude_runtime' ? 'session' : undefined;
    const result = await backupDataApi(exportForm.source, exclude);
    showMessage('success', JSON.stringify(result, null, 2));
    await fetchBackups();
  } catch (error: any) {
    showMessage(
      'error',
      error.message || $t('page.system.dataMigrationDetail.backupFailed'),
    );
  } finally {
    backupLoading.value = false;
  }
}

function handleFileChange(_: string, event?: Event) {
  const target = (event?.target || event) as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    importFile.value = target.files[0] || null;
  }
}

async function handleImport() {
  if (!importFile.value) {
    ElMessage.warning($t('page.system.dataMigrationDetail.selectFileFirst'));
    return;
  }
  const confirmText =
    importForm.mode === 'overwrite'
      ? $t('page.system.dataMigrationDetail.overwriteImportConfirm', {
          target: importForm.target,
        })
      : $t('page.system.dataMigrationDetail.upsertImportConfirm', {
          target: importForm.target,
        });
  const confirmed = await confirmAction({
    message: confirmText,
    title: $t('page.system.dataMigrationDetail.importConfirmTitle'),
  });
  if (!confirmed) return;
  importLoading.value = true;
  clearMessage();
  try {
    const result = await importDataApi(
      importFile.value,
      importForm.target,
      importForm.mode,
      importForm.userNullStrategy,
    );
    showMessage('success', JSON.stringify(result, null, 2));
    importFile.value = null;
    if (importFileInput.value) {
      importFileInput.value.value = '';
    }
  } catch (error: any) {
    showMessage(
      'error',
      error.message || $t('page.system.dataMigrationDetail.importFailed'),
    );
  } finally {
    importLoading.value = false;
  }
}

function formatFileSize(bytes?: number): string {
  if (!bytes || typeof bytes !== 'number') return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function fetchBackups() {
  loading.value = true;
  try {
    const response = await getBackupsApi();
    backups.value = response.items || [];
  } catch {
    backups.value = [];
  } finally {
    loading.value = false;
  }
}

fetchBackups();
</script>

<template>
  <Page>
    <div class="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ElCard :header="$t('page.system.dataMigrationDetail.exportCard')">
        <p class="card-desc">
          {{ $t('page.system.dataMigrationDetail.exportDesc') }}
        </p>
        <ElForm :model="exportForm" inline>
          <ElFormItem
            :label="$t('page.system.dataMigrationDetail.exportSourceLabel')"
          >
            <ElSelect v-model="exportForm.source" class="form-select">
              <ElOption
                :label="$t('page.system.dataMigrationDetail.local')"
                value="local"
              />
              <ElOption
                :label="$t('page.system.dataMigrationDetail.remote')"
                value="remote"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem
            :label="$t('page.system.dataMigrationDetail.exportScopeLabel')"
          >
            <ElSelect v-model="exportForm.scope" class="form-select">
              <ElOption
                :label="$t('page.system.dataMigrationDetail.allCollections')"
                value=""
              />
              <ElOption
                :label="$t('page.system.dataMigrationDetail.skipRuntime')"
                value="exclude_runtime"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem>
            <VbenButton
              variant="default"
              @click="handleExport"
              :loading="exportLoading"
            >
              {{ $t('page.system.dataMigrationDetail.downloadExport') }}
            </VbenButton>
          </ElFormItem>
          <ElFormItem>
            <VbenButton @click="handleBackup" :loading="backupLoading">
              {{ $t('page.system.dataMigrationDetail.backupToServer') }}
            </VbenButton>
          </ElFormItem>
        </ElForm>
        <p class="hint">
          {{ $t('page.system.dataMigrationDetail.exportHint') }}
        </p>
      </ElCard>

      <ElCard :header="$t('page.system.dataMigrationDetail.importCard')">
        <p class="card-desc">
          {{ $t('page.system.dataMigrationDetail.importDesc') }}
        </p>
        <ElForm :model="importForm" inline>
          <ElFormItem
            :label="$t('page.system.dataMigrationDetail.importTargetLabel')"
          >
            <ElSelect v-model="importForm.target" class="form-select">
              <ElOption
                :label="$t('page.system.dataMigrationDetail.remote')"
                value="remote"
              />
              <ElOption
                :label="$t('page.system.dataMigrationDetail.local')"
                value="local"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem
            :label="$t('page.system.dataMigrationDetail.importModeLabel')"
          >
            <ElSelect v-model="importForm.mode" class="form-select-sm">
              <ElOption
                :label="$t('page.system.dataMigrationDetail.overwriteMode')"
                value="overwrite"
              />
              <ElOption
                :label="$t('page.system.dataMigrationDetail.upsertMode')"
                value="upsert"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem
            :label="$t('page.system.dataMigrationDetail.userNullStrategyLabel')"
          >
            <ElSelect
              v-model="importForm.userNullStrategy"
              class="form-select-sm"
            >
              <ElOption
                :label="$t('page.system.dataMigrationDetail.autoGenerate')"
                value="generate"
              />
              <ElOption
                :label="$t('page.system.dataMigrationDetail.skipInvalid')"
                value="skip"
              />
            </ElSelect>
          </ElFormItem>
          <ElFormItem
            :label="$t('page.system.dataMigrationDetail.selectExportFile')"
          >
            <ElInput
              ref="importFileInput"
              type="file"
              accept=".ndjson,.jsonl,.txt"
              class="form-select"
              @change="handleFileChange"
            />
          </ElFormItem>
          <ElFormItem>
            <VbenButton
              variant="default"
              @click="handleImport"
              :loading="importLoading"
            >
              {{ $t('page.system.dataMigrationDetail.startImport') }}
            </VbenButton>
          </ElFormItem>
        </ElForm>
        <p class="hint">
          {{ $t('page.system.dataMigrationDetail.overwriteHint') }}
        </p>
        <div v-if="importMessage" class="message" :class="importMessageType">
          {{ importMessage }}
        </div>
      </ElCard>

      <ElCard :header="$t('page.system.dataMigrationDetail.backupRestoreCard')">
        <p class="card-desc">
          {{ $t('page.system.dataMigrationDetail.backupDesc') }}
        </p>
        <VbenButton @click="fetchBackups" :loading="loading">
          {{ $t('page.system.dataMigrationDetail.refreshBackups') }}
        </VbenButton>
        <div class="backup-list" v-loading="loading">
          <div v-if="backups.length === 0" class="empty-tip">
            {{ $t('page.system.dataMigrationDetail.noBackups') }}
          </div>
          <div v-for="item in backups" :key="item.name" class="backup-item">
            <a
              :href="`/api/v1/data-migration/backups/${encodeURIComponent(item.name)}`"
              target="_blank"
              rel="noopener"
            >
              {{ item.name }}
            </a>
            <ElTag size="small">{{ formatFileSize(item.bytes) }}</ElTag>
            <span class="modified-time">{{ item.modified_at || '-' }}</span>
          </div>
        </div>
      </ElCard>
    </div>
  </Page>
</template>

<style scoped>
.form-select {
  width: 220px;
}

.form-select-sm {
  width: 200px;
}

.card-desc {
  margin: 0 0 16px;
  font-size: 14px;
  color: #64748b;
}

.hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: #94a3b8;
}

.hint code {
  padding: 2px 6px;
  font-size: 12px;
  background: #f1f5f9;
  border-radius: 4px;
}

.message {
  padding: 10px 14px;
  margin-top: 12px;
  font-size: 13px;
  line-height: 1.6;
  border-radius: 8px;
}

.message.success {
  color: #166534;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.message.error {
  color: #991b1b;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

.backup-list {
  max-height: 320px;
  margin-top: 12px;
  overflow-y: auto;
}

.backup-item {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}

.backup-item:last-child {
  border-bottom: none;
}

.backup-item a {
  font-weight: 500;
  color: hsl(221deg 83% 53%);
  text-decoration: none;
}

.backup-item a:hover {
  text-decoration: underline;
}

.modified-time {
  margin-left: auto;
  font-size: 13px;
  color: #94a3b8;
}

.empty-tip {
  padding: 24px;
  color: #94a3b8;
  text-align: center;
}
</style>
