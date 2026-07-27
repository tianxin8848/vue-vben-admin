<script lang="ts" setup>
import { ElButton, ElDialog } from 'element-plus';

interface Props {
  cancelText?: string;
  closable?: boolean;
  closeOnClickModal?: boolean;
  confirmText?: string;
  showCancel?: boolean;
  showConfirm?: boolean;
  title?: string;
  top?: string;
  visible: boolean;
  width?: string;
}

interface Emits {
  cancel: [];
  confirm: [];
  'update:visible': [value: boolean];
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  width: '500px',
  top: '20vh',
  closable: true,
  closeOnClickModal: false,
  confirmText: '确定',
  cancelText: '取消',
  showConfirm: true,
  showCancel: true,
});

const emit = defineEmits<Emits>();

function handleClose() {
  emit('update:visible', false);
}

function handleConfirm() {
  emit('confirm');
}

function handleCancel() {
  emit('cancel');
}

function handleUpdateVisible(val: boolean) {
  emit('update:visible', val);
}
</script>

<template>
  <ElDialog
    :visible="visible"
    :title="title"
    :width="width"
    :top="top"
    :closable="closable"
    :close-on-click-modal="closeOnClickModal"
    @close="handleClose"
    @update:visible="handleUpdateVisible"
  >
    <slot></slot>
    <template #footer>
      <ElButton v-if="showCancel" @click="handleCancel">
        {{ cancelText }}
      </ElButton>
      <ElButton v-if="showConfirm" type="primary" @click="handleConfirm">
        {{ confirmText }}
      </ElButton>
    </template>
  </ElDialog>
</template>
