<script setup lang="ts">
import type { PasswordRequirement } from './types';

import { computed } from 'vue';

import { Circle, CircleCheckBig } from '@vben-core/icons';
import { cn } from '@vben-core/shared/utils';

const props = withDefaults(
  defineProps<{
    password?: string;
    requirements?: PasswordRequirement[];
  }>(),
  {
    password: '',
    requirements: () => [],
  },
);

/** 逐条实时判定，满足的显示绿色对勾，未满足的显示空心圆 */
const evaluated = computed(() => {
  const password = props.password ?? '';
  return props.requirements.map((item) => ({
    label: item.label,
    passed: item.test(password),
  }));
});
</script>

<template>
  <ul v-if="evaluated.length > 0" class="mt-1.5 grid gap-1">
    <li
      v-for="item in evaluated"
      :key="item.label"
      :class="
        cn(
          'flex items-center gap-1 text-xs',
          item.passed
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-muted-foreground',
        )
      "
    >
      <CircleCheckBig v-if="item.passed" class="size-3.5 shrink-0" />
      <Circle v-else class="size-3.5 shrink-0" />
      <span>{{ item.label }}</span>
    </li>
  </ul>
</template>
