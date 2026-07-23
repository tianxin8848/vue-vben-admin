<script lang="ts" setup>
import { ref, reactive } from 'vue';

import { Page } from '@vben/common-ui';

import {
  ElButton,
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElSelect,
  ElTag,
} from 'element-plus';

import type { DataMigrationApi } from '#/api/business/data-migration';
import {
  backupDataApi,
  exportDataApi,
  getBackupsApi,
  importDataApi,
} from '#/api';

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
const importMessageType = ref<'success' | 'error' | ''>('');

const backups = ref<DataMigrationApi.BackupItem[]>([]);

const exportLoading = ref(false);
const backupLoading = ref(false);
const importLoading = ref(false);

function showMessage(type: 'success' | 'error', message: string) {
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
    const exclude = exportForm.scope === 'exclude_runtime' ? 'session' : undefined;
    const blob = await exportDataApi(exportForm.source, exclude);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data-migration-${exportForm.source}-${Date.now()}.ndjson`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    ElMessage.success('导出成功');
  } catch {
    ElMessage.error('导出失败');
  } finally {
    exportLoading.value = false;
  }
}

async function handleBackup() {
  const confirmText = `确认在服务器本地备份 ${exportForm.source} 数据库到 backup/ 目录？`;
  if (!confirm(confirmText)) {
    return;
  }
  backupLoading.value = true;
  clearMessage();
  try {
    const exclude = exportForm.scope === 'exclude_runtime' ? 'session' : undefined;
    const result = await backupDataApi(exportForm.source, exclude);
    showMessage('success', JSON.stringify(result, null, 2));
    await fetchBackups();
  } catch (error: any) {
    showMessage('error', error.message || '备份失败');
  } finally {
    backupLoading.value = false;
  }
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    importFile.value = target.files[0];
  }
}

async function handleImport() {
  if (!importFile.value) {
    ElMessage.warning('请先选择导入文件');
    return;
  }
  const confirmText =
    importForm.mode === 'overwrite'
      ? `将以覆盖模式导入到 ${importForm.target} 数据库，目标集合会被清空。确认继续？`
      : `将以合并模式导入到 ${importForm.target} 数据库。确认继续？`;
  if (!confirm(confirmText)) {
    return;
  }
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
    showMessage('error', error.message || '导入失败');
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
  <Page
    title="数据处理维护"
    description="用于在本地数据库与远程数据库之间进行备份/恢复、数据导出与数据导入。"
  >
    <ElCard header="数据导出">
      <p class="card-desc">导出格式为 NDJSON（逐行 JSON），支持 ObjectId 与日期类型。</p>
      <ElForm :model="exportForm" inline>
        <ElFormItem label="导出来源数据库">
          <ElSelect v-model="exportForm.source" style="width: 220px">
            <ElOption label="本地（127.0.0.1）" value="local" />
            <ElOption label="远程（192.168.131.44）" value="remote" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="导出集合（可选）">
          <ElSelect v-model="exportForm.scope" style="width: 220px">
            <ElOption label="全部集合" value="" />
            <ElOption label="跳过运行态集合（session 等）" value="exclude_runtime" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="handleExport" :loading="exportLoading">
            下载导出文件
          </ElButton>
        </ElFormItem>
        <ElFormItem>
          <ElButton @click="handleBackup" :loading="backupLoading">
            备份到服务器
          </ElButton>
        </ElFormItem>
      </ElForm>
      <p class="hint">提示：导出文件可能较大，建议在网络稳定时操作。</p>
    </ElCard>

    <ElCard header="数据导入">
      <p class="card-desc">可将导出的 NDJSON 文件导入到另一套数据库。</p>
      <ElForm :model="importForm" inline>
        <ElFormItem label="导入目标数据库">
          <ElSelect v-model="importForm.target" style="width: 220px">
            <ElOption label="远程（192.168.131.44）" value="remote" />
            <ElOption label="本地（127.0.0.1）" value="local" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="导入模式">
          <ElSelect v-model="importForm.mode" style="width: 200px">
            <ElOption label="覆盖（清空目标集合后导入）" value="overwrite" />
            <ElOption label="合并（按 _id upsert）" value="upsert" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="用户空值处理">
          <ElSelect v-model="importForm.userNullStrategy" style="width: 200px">
            <ElOption label="自动生成（推荐）" value="generate" />
            <ElOption label="跳过异常用户" value="skip" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="选择导出文件">
          <ElInput
            ref="importFileInput"
            type="file"
            accept=".ndjson,.jsonl,.txt"
            style="width: 220px"
            @change="handleFileChange"
          />
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="handleImport" :loading="importLoading">
            开始导入
          </ElButton>
        </ElFormItem>
      </ElForm>
      <p class="hint">覆盖模式会先删除目标集合数据，请确认选择正确的目标库。</p>
      <div
        v-if="importMessage"
        class="message"
        :class="importMessageType"
      >
        {{ importMessage }}
      </div>
    </ElCard>

    <ElCard header="数据备份/恢复">
      <p class="card-desc">服务器当前目录下 <code>backup/</code> 文件夹中的备份文件。可用于恢复（下载后再导入）。</p>
      <ElButton type="secondary" @click="fetchBackups" :loading="loading">
        刷新备份列表
      </ElButton>
      <div class="backup-list" v-loading="loading">
        <div v-if="backups.length === 0" class="empty-tip">暂无备份文件</div>
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
  </Page>
</template>
