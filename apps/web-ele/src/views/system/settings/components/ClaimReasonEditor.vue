<script lang="ts" setup>
import { computed, ref } from 'vue';

import { ElButton, ElInput, ElMessage, ElTag } from 'element-plus';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const reasons = computed<string[]>(() =>
  props.modelValue
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean),
);

const newReason = ref('');

function syncToParent(list: string[]) {
  emit('update:modelValue', list.join('\n'));
}

function handleAdd() {
  const name = newReason.value.trim();
  if (!name) {
    ElMessage.warning('请输入报销理由');
    return;
  }
  if (reasons.value.includes(name)) {
    ElMessage.warning('该报销理由已存在');
    return;
  }
  syncToParent([...reasons.value, name]);
  newReason.value = '';
}

function handleRemove(idx: number) {
  const next = [...reasons.value];
  next.splice(idx, 1);
  syncToParent(next);
}
</script>

<template>
  <section>
    <div class="mb-3 flex items-center justify-between">
      <h3 class="text-lg">报销理由维护</h3>
      <span class="text-sm text-muted-foreground">
        共 {{ reasons.length }} 项
      </span>
    </div>
    <p class="mb-4 text-sm text-muted-foreground">
      在这里维护员工报销页面可勾选的报销理由。
    </p>

    <div class="mb-4 flex gap-2">
      <ElInput
        v-model="newReason"
        placeholder="输入新的报销理由，例如：餐饮报销"
        class="flex-1"
        @keyup.enter="handleAdd"
      />
      <ElButton type="primary" @click="handleAdd">新增</ElButton>
    </div>

    <div
      class="flex flex-wrap gap-2 rounded border border-border bg-muted/30 p-3 min-h-[80px]"
    >
      <template v-if="reasons.length">
        <ElTag
          v-for="(item, idx) in reasons"
          :key="idx"
          closable
          type="primary"
          effect="light"
          @close="handleRemove(idx)"
        >
          {{ item }}
        </ElTag>
      </template>
      <span v-else class="text-xs text-muted-foreground">
        暂无报销理由，请在上方新增
      </span>
    </div>

    <p class="mt-2 text-xs text-muted-foreground">
      保存系统参数后，员工报销页面的“报销理由”下拉会直接读取这里的配置。
    </p>
  </section>
</template>
