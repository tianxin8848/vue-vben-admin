<script setup lang="ts">
import type { Props } from './types';

import { preferences } from '@vben-core/preferences';
import {
  Card,
  Separator,
  Tabs,
  TabsList,
  TabsTrigger,
  VbenAvatar,
} from '@vben-core/shadcn-ui';

import { Page } from '../../components';

defineOptions({
  name: 'ProfileUI',
});

withDefaults(defineProps<Props>(), {
  title: '关于项目',
  tabs: () => [],
});

const tabsValue = defineModel<string>('modelValue');
</script>
<template>
  <Page auto-content-height>
    <!-- 间距收敛：卡片内边距 16 / 元素间距 10 / 分区分隔 12 / 双栏间隙 12
         去掉原先 Card 默认 gap-6 py-6 与 h-40、my-4、m-4 的多层叠加 -->
    <div class="flex size-full flex-col gap-3 lg:flex-row">
      <Card class="w-full flex-none gap-0 py-4 lg:w-60">
        <div class="flex-col-center gap-2.5 px-4">
          <VbenAvatar
            :src="userInfo?.avatar ?? preferences.app.defaultAvatar"
            class="size-16"
          />
          <div class="flex-col-center w-full gap-0.5">
            <span class="text-base leading-tight font-semibold">
              {{ userInfo?.realName ?? '' }}
            </span>
            <span
              class="max-w-full truncate text-xs text-foreground/70"
              :title="userInfo?.username ?? ''"
            >
              {{ userInfo?.username ?? '' }}
            </span>
          </div>
        </div>
        <Separator class="my-3" />
        <Tabs v-model="tabsValue" orientation="vertical" class="px-3">
          <TabsList class="grid w-full grid-cols-1 gap-1 bg-transparent p-0">
            <TabsTrigger
              v-for="tab in tabs"
              :key="tab.value"
              :value="tab.value"
              class="h-auto min-h-9 justify-start rounded-md px-3 py-2 text-left leading-snug break-words whitespace-normal transition-colors hover:bg-accent hover:text-accent-foreground data-[state=active]:bg-primary data-[state=active]:font-medium data-[state=active]:text-primary-foreground"
            >
              {{ tab.label }}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </Card>
      <Card class="min-w-0 flex-auto p-6">
        <slot name="content"></slot>
      </Card>
    </div>
  </Page>
</template>
