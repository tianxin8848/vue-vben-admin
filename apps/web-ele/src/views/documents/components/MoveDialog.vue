<script lang="ts" setup>
import type { MoveContext } from '../data';

import type { DocumentApi } from '#/api';

import { ref, watch } from 'vue';

import { useI18n } from '@vben/locales';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElOption,
  ElSelect,
} from 'element-plus';

import {
  listFolderMoveTargetsApi,
  updateDocumentApi,
  updateFolderApi,
} from '#/api';
import { toastSuccess } from '#/utils/message';

const props = defineProps<{
  /** 移动对象上下文；null 时不加载目标列表 */
  context?: MoveContext | null;
}>();

const emit = defineEmits<{ success: [] }>();

const visible = defineModel<boolean>('visible', { default: false });

const { t } = useI18n();

const submitting = ref(false);
const targetsLoading = ref(false);
const targets = ref<DocumentApi.FolderMoveTarget[]>([]);
/** '' 代表根目录（后端 id = null） */
const targetId = ref('');

// 打开时按上下文加载可选目标目录，并预选当前所在目录
watch(visible, async (value) => {
  if (!value || !props.context) return;
  targetId.value = props.context.parentId ?? '';
  targets.value = [];
  targetsLoading.value = true;
  try {
    targets.value = await listFolderMoveTargetsApi(props.context.excludeId);
  } catch (error) {
    console.error('[documents] load move targets failed', error);
  } finally {
    targetsLoading.value = false;
  }
});

async function handleConfirm() {
  const ctx = props.context;
  if (!ctx) return;
  const target = targetId.value || null;
  submitting.value = true;
  try {
    await (ctx.kind === 'folder'
      ? updateFolderApi(ctx.id, { parent_id: target })
      : updateDocumentApi(ctx.id, { folder_id: target }));
    toastSuccess(t('page.documents.moveSuccess'));
    visible.value = false;
    emit('success');
  } catch (error) {
    console.error('[documents] move failed', error);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <ElDialog
    v-model="visible"
    :title="t('page.documents.moveTitle')"
    width="460px"
  >
    <ElForm label-position="top">
      <ElFormItem :label="t('page.documents.moveTarget')">
        <ElSelect v-model="targetId" class="w-full" :loading="targetsLoading">
          <ElOption
            v-for="target in targets"
            :key="target.id ?? 'root'"
            :label="target.label"
            :value="target.id ?? ''"
          />
        </ElSelect>
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="visible = false">
        {{ t('page.documents.cancel') }}
      </ElButton>
      <ElButton :loading="submitting" type="primary" @click="handleConfirm">
        {{ t('page.documents.save') }}
      </ElButton>
    </template>
  </ElDialog>
</template>
