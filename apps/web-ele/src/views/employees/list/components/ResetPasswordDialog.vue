<script lang="ts" setup>
import type { EmployeeApi } from '#/api';

import { ElButton, ElDialog, ElTag } from 'element-plus';

defineProps<{
  result: EmployeeApi.EmployeePasswordResetResponse | null;
}>();

const emit = defineEmits<{
  confirm: [];
}>();

const visible = defineModel<boolean>('visible', { default: false });

function handleClose() {
  visible.value = false;
}
</script>

<template>
  <ElDialog v-model="visible" title="重置密码" width="400px">
    <div v-if="result" class="py-5 text-center">
      <p class="mb-3">密码已重置成功！</p>
      <p>
        临时密码：
        <ElTag type="warning" size="large">
          {{ result.temporary_password }}
        </ElTag>
      </p>
      <p class="mt-2 text-xs text-muted-foreground">
        请通知用户使用该临时密码登录并及时修改
      </p>
    </div>
    <div v-else class="py-5 text-center">
      <p>确认重置该员工密码？</p>
      <p class="text-xs text-muted-foreground">系统将自动生成临时密码</p>
    </div>
    <template #footer>
      <ElButton @click="handleClose">
        {{ result ? '关闭' : '取消' }}
      </ElButton>
      <ElButton v-if="!result" type="primary" @click="emit('confirm')">
        确认重置
      </ElButton>
    </template>
  </ElDialog>
</template>
