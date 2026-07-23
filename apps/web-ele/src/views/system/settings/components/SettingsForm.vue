<script lang="ts" setup>
import type { SystemSettingsApi } from '#/api';
import { computed } from 'vue';
import { ElButton, ElCheckbox, ElForm, ElFormItem, ElInput } from 'element-plus';

const props = defineProps<{
  deptStr: string;
  posStr: string;
  regionStr: string;
  selectedModules: Set<string>;
  modules: SystemSettingsApi.ModuleItem[];
}>();

const emit = defineEmits<{
  (e: 'update:deptStr', value: string): void;
  (e: 'update:posStr', value: string): void;
  (e: 'update:regionStr', value: string): void;
  (e: 'update:selectedModules', value: Set<string>): void;
  (e: 'save'): void;
}>();

const modulesSummary = computed(() => `已选择 ${props.selectedModules.size} 个模块`);

function selectAllModules() {
  const newSet = new Set(props.selectedModules);
  props.modules.forEach((m) => newSet.add(m.module_code));
  emit('update:selectedModules', newSet);
}

function clearModules() {
  emit('update:selectedModules', new Set());
}

function toggleModule(code: string) {
  const newSet = new Set(props.selectedModules);
  if (newSet.has(code)) {
    newSet.delete(code);
  } else {
    newSet.add(code);
  }
  emit('update:selectedModules', newSet);
}
</script>

<template>
  <ElForm label-width="120px">
    <ElFormItem label="部门列表">
      <ElInput
        :value="deptStr"
        type="textarea"
        :rows="3"
        placeholder="例如：&#10;研发部&#10;运营部&#10;行政部"
        @input="$emit('update:deptStr', $event)"
      />
    </ElFormItem>

    <ElFormItem label="岗位列表">
      <ElInput
        :value="posStr"
        type="textarea"
        :rows="3"
        placeholder="例如：&#10;前端开发&#10;后端开发&#10;人事专员"
        @input="$emit('update:posStr', $event)"
      />
    </ElFormItem>

    <ElFormItem label="地区列表">
      <ElInput
        :value="regionStr"
        type="textarea"
        :rows="3"
        placeholder="例如：&#10;深圳&#10;广州&#10;上海"
        @input="$emit('update:regionStr', $event)"
      />
    </ElFormItem>

    <ElFormItem label="模块列表">
      <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 12px">
        <ElButton size="small" type="default" @click="selectAllModules">全选模块</ElButton>
        <ElButton size="small" type="default" @click="clearModules">清空选择</ElButton>
        <span style="color: #2563eb; font-weight: 700">{{ modulesSummary }}</span>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px">
        <div
          v-for="mod in modules"
          :key="mod.module_code"
          style="padding: 14px 16px; border: 1px solid #dbeafe; border-radius: 12px; background: #f8fbff; cursor: pointer;"
          @click="toggleModule(mod.module_code)"
        >
          <ElCheckbox :checked="selectedModules.has(mod.module_code)" style="margin-right: 10px" />
          <div>
            <div style="font-weight: 700">{{ mod.module_name }}</div>
            <div style="color: #64748b; font-size: 12px; margin-top: 4px">{{ mod.module_code }}</div>
          </div>
        </div>
      </div>
      <p style="color: #64748b; font-size: 12px; margin-top: 8px">这里展示的是数据库中当前维护的系统模块，勾选后才会出现在用户权限分配中。</p>
    </ElFormItem>

    <ElFormItem>
      <ElButton type="primary" @click="$emit('save')">保存系统参数</ElButton>
    </ElFormItem>
  </ElForm>
</template>