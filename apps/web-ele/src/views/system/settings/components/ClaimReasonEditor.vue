<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useI18n } from '@vben/locales';

import { ElButton, ElInput, ElMessage, ElTag } from 'element-plus';

const props = defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const { t } = useI18n();

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
    ElMessage.warning(
      t(
        'page.system.settingsDetail.claimReasonEditor.validation.reasonRequired',
      ),
    );
    return;
  }
  if (reasons.value.includes(name)) {
    ElMessage.warning(
      t(
        'page.system.settingsDetail.claimReasonEditor.validation.reasonDuplicate',
      ),
    );
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
      <h3 class="text-lg">
        {{ t('page.system.settingsDetail.claimReasonEditor.title') }}
      </h3>
      <span class="text-sm text-muted-foreground">
        {{
          t('page.system.settingsDetail.claimReasonEditor.count', {
            count: reasons.length,
          })
        }}
      </span>
    </div>
    <p class="mb-4 text-sm text-muted-foreground">
      {{ t('page.system.settingsDetail.claimReasonEditor.hint') }}
    </p>

    <div class="mb-4 flex gap-2">
      <ElInput
        v-model="newReason"
        :placeholder="
          t('page.system.settingsDetail.claimReasonEditor.placeholder')
        "
        class="flex-1"
        @keyup.enter="handleAdd"
      />
      <ElButton type="primary" @click="handleAdd">
        {{ t('page.system.settingsDetail.claimReasonEditor.add') }}
      </ElButton>
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
        {{ t('page.system.settingsDetail.claimReasonEditor.empty') }}
      </span>
    </div>

    <p class="mt-2 text-xs text-muted-foreground">
      {{ t('page.system.settingsDetail.claimReasonEditor.footerHint') }}
    </p>
  </section>
</template>
