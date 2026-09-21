<script setup lang="ts">
import type { Recordable } from '@vben/types';

import type { VbenFormSchema } from '@vben-core/form-ui';

import { computed, reactive } from 'vue';

import { $t } from '@vben/locales';

import { useVbenForm } from '@vben-core/form-ui';
import { VbenButton } from '@vben-core/shadcn-ui';

interface Props {
  formSchema?: VbenFormSchema[];
  wrapperClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  formSchema: () => [],
  wrapperClass: 'grid-cols-1',
});

const emit = defineEmits<{
  submit: [Recordable<any>];
}>();

const [Form, formApi] = useVbenForm(
  reactive({
    commonConfig: {
      // 标签列宽需容纳最长的英文标签（如 Emergency Contact Relationship），避免折行
      labelWidth: 220,
      // 所有表单项
      componentProps: {
        class: 'w-full',
      },
    },
    layout: 'horizontal',
    schema: computed(() => props.formSchema),
    showDefaultActions: false,
    wrapperClass: props.wrapperClass,
  }),
);

async function handleSubmit() {
  const { valid } = await formApi.validate();
  const values = await formApi.getValues();
  if (valid) {
    emit('submit', values);
  }
}

defineExpose({
  getFormApi: () => formApi,
});
</script>
<template>
  <div @keydown.enter.prevent="handleSubmit">
    <Form />
    <div class="mt-4 flex items-center justify-end gap-3">
      <!-- 次要动作区（如更换头像），留空时不影响提交按钮靠右 -->
      <div v-if="$slots['footer-extra']" class="mr-auto">
        <slot name="footer-extra"></slot>
      </div>
      <VbenButton type="submit" @click="handleSubmit">
        {{ $t('profile.updateBasicProfile') }}
      </VbenButton>
    </div>
  </div>
</template>
