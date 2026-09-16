<script lang="ts" setup>
import type { DocumentApi } from '#/api';

import { computed, reactive, ref, watch } from 'vue';

import { useI18n } from '@vben/locales';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
  ElUpload,
} from 'element-plus';

import { createDocumentApi, updateDocumentApi } from '#/api';
import { toastSuccess, toastWarning } from '#/utils/message';

const props = defineProps<{
  /** 编辑对象（mode = edit 时必填） */
  doc?: DocumentApi.DocumentResponse | null;
  /** 上传目标文件夹 id（null 表示根目录） */
  folderId?: null | string;
  /** 上传目标文件夹名（提示文案用） */
  folderName?: string;
  /** 上传规则与可选部门 */
  meta: DocumentApi.DocumentMeta;
  /** create = 上传 / edit = 编辑 */
  mode: 'create' | 'edit';
}>();

const emit = defineEmits<{ success: [] }>();

const visible = defineModel<boolean>('visible', { default: false });

const { t } = useI18n();

const submitting = ref(false);
const uploadRef = ref<InstanceType<typeof ElUpload>>();

const form = reactive<{
  departments: string[];
  file: File | null;
  title: string;
}>({
  departments: [],
  file: null,
  title: '',
});

const isCreate = computed(() => props.mode === 'create');

const dialogTitle = computed(() =>
  isCreate.value ? t('page.documents.upload') : t('page.documents.editTitle'),
);

const uploadAccept = computed(() =>
  (props.meta.allowed_extensions ?? []).join(','),
);

const uploadTip = computed(() =>
  t('page.documents.uploadTip', {
    ext: (props.meta.allowed_extensions ?? []).join(' / '),
    size: (props.meta.max_size / 1024 / 1024).toFixed(0),
  }),
);

// 打开时重置表单并回填编辑对象
watch(visible, (value) => {
  if (!value) return;
  form.title = props.doc?.title ?? '';
  form.departments = [...(props.doc?.viewer_departments ?? [])];
  form.file = null;
  uploadRef.value?.clearFiles();
});

function handleFileChange(uploadFile: { raw?: File }) {
  form.file = uploadFile.raw ?? null;
}

function validateFile(): boolean {
  const file = form.file;
  if (!file) {
    toastWarning(t('page.documents.fileRequired'));
    return false;
  }
  const ext = `.${file.name.split('.').pop()?.toLowerCase() ?? ''}`;
  const allowed = props.meta.allowed_extensions ?? [];
  if (allowed.length > 0 && !allowed.includes(ext)) {
    toastWarning(t('page.documents.extNotAllowed'));
    return false;
  }
  if (file.size > props.meta.max_size) {
    toastWarning(
      t('page.documents.fileTooLarge', {
        size: (props.meta.max_size / 1024 / 1024).toFixed(0),
      }),
    );
    return false;
  }
  return true;
}

async function handleSubmit() {
  if (isCreate.value) {
    if (!validateFile()) return;
  } else if (!form.title.trim()) {
    toastWarning(t('page.documents.titleRequired'));
    return;
  }

  submitting.value = true;
  try {
    if (isCreate.value) {
      const fd = new FormData();
      if (form.title.trim()) fd.append('title', form.title.trim());
      if (form.file) fd.append('file', form.file);
      // 上传到指定目录，空串表示根目录
      fd.append('folder_id', props.folderId ?? '');
      for (const dept of form.departments) {
        fd.append('viewer_departments', dept);
      }
      await createDocumentApi(fd);
      toastSuccess(t('page.documents.createSuccess'));
    } else if (props.doc) {
      await updateDocumentApi(props.doc.id, {
        title: form.title.trim(),
        viewer_departments: form.departments,
      });
      toastSuccess(t('page.documents.updateSuccess'));
    }
    visible.value = false;
    emit('success');
  } catch (error) {
    console.error('[documents] submit failed', error);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <ElDialog v-model="visible" :title="dialogTitle" width="560px">
    <ElForm label-position="top">
      <ElFormItem :label="t('page.documents.formTitle')">
        <ElInput
          v-model="form.title"
          :placeholder="t('page.documents.titlePlaceholder')"
          :maxlength="200"
          clearable
        />
      </ElFormItem>
      <ElFormItem v-if="isCreate" :label="t('page.documents.file')" required>
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
              folder: folderName || t('page.documents.root'),
            })
          }}
        </p>
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
      <ElButton @click="visible = false">
        {{ t('page.documents.cancel') }}
      </ElButton>
      <ElButton :loading="submitting" type="primary" @click="handleSubmit">
        {{ t('page.documents.save') }}
      </ElButton>
    </template>
  </ElDialog>
</template>
