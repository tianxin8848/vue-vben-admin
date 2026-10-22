<script lang="ts" setup>
/**
 * 系统参数管理页统一卡片容器。
 *
 * 样式与工作台「系统参数管理配置」快捷导航卡（shadcn Card）完全对齐：
 * rounded-xl / border / shadow-sm / py-6，标题与内容左右内边距均为 24px（px-6）。
 * 用它取代各分区的 ElCard，避免两套卡片（ElCard 20px 内边距 + 默认阴影）混用
 * 导致页边距、圆角、阴影与其它界面不一致。
 */
interface Props {
  description?: string;
  title?: string;
}

withDefaults(defineProps<Props>(), {
  description: undefined,
  title: undefined,
});
</script>

<template>
  <div
    data-slot="card"
    class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm"
  >
    <div
      v-if="title || description"
      data-slot="card-header"
      class="grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6"
    >
      <h3 v-if="title" class="text-lg leading-none font-semibold">
        {{ title }}
      </h3>
      <p v-if="description" class="text-sm text-muted-foreground">
        {{ description }}
      </p>
    </div>
    <div class="px-6">
      <slot></slot>
    </div>
  </div>
</template>
