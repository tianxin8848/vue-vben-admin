<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { SystemSettingsApi } from '#/api';

import { computed, nextTick, onMounted, watch } from 'vue';

import { useI18n } from '@vben/locales';

import { ElButton } from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

import DictionaryListEditor from './DictionaryListEditor.vue';

/**
 * 基础参数表单：部门 / 岗位 / 地区三组字典列表 + 系统模块开关。
 *
 * 三组字典列表由 DictionaryListEditor 承担（它们只是同一件事的三份文案），
 * 这里只负责装配，并把「模块目录」这一项自己维护。
 */
const props = defineProps<{
  /** 模块全量目录，父级已把后端返回的名称与目录外的模块合并进来 */
  modules: SystemSettingsApi.SystemModuleItem[];
}>();

const emit = defineEmits<{ save: [] }>();
/** 字典列表的值：换行分隔字符串，与父级直接双向绑定 */
const deptStr = defineModel<string>('deptStr', { required: true });
const posStr = defineModel<string>('posStr', { required: true });
const regionStr = defineModel<string>('regionStr', { required: true });
/** 已启用的模块 code */
const selectedModules = defineModel<string[]>('selectedModules', {
  required: true,
});

const { t } = useI18n();

const moduleGridOptions = computed<
  VxeGridProps<SystemSettingsApi.SystemModuleItem>
>(() => ({
  id: 'settings-module-list',
  checkboxConfig: { highlight: true, checkRowKeys: [] },
  columns: [
    { type: 'checkbox', width: 50 },
    {
      field: 'module_name',
      title: t('page.system.settingsDetail.form.column.moduleName'),
      minWidth: 150,
    },
    {
      field: 'module_code',
      title: t('page.system.settingsDetail.form.column.moduleCode'),
      minWidth: 150,
    },
  ],
  customConfig: { storage: false },
  proxyConfig: { enabled: false },
  rowConfig: { keyField: 'module_code' },
  toolbarConfig: { zoom: true, custom: false },
}));

const [ModuleTable, moduleTableApi] = useVbenVxeGrid({
  gridOptions: moduleGridOptions.value,
  gridEvents: {
    checkboxAll: handleCheckboxChange,
    checkboxChange: handleCheckboxChange,
  },
});

/** 表格勾选状态以 selectedModules 为准，变更后回填 */
async function updateCheckboxState() {
  await nextTick();
  for (const row of props.modules) {
    moduleTableApi.grid.setCheckboxRow(
      row,
      selectedModules.value.includes(row.module_code),
    );
  }
}

function handleCheckboxChange() {
  selectedModules.value = moduleTableApi.grid
    .getCheckboxRecords()
    .map((r) => r.module_code);
}

function selectAllModules() {
  moduleTableApi.grid.setAllCheckboxRow(true);
  handleCheckboxChange();
}

function clearModules() {
  moduleTableApi.grid.setAllCheckboxRow(false);
  handleCheckboxChange();
}

watch(moduleGridOptions, () => {
  moduleTableApi.setGridOptions(moduleGridOptions.value);
});

watch(
  () => props.modules,
  async () => {
    moduleTableApi.setGridOptions({ data: props.modules });
    await updateCheckboxState();
  },
  { deep: true },
);

watch(
  selectedModules,
  async () => {
    await updateCheckboxState();
  },
  { deep: true },
);

onMounted(async () => {
  moduleTableApi.setGridOptions({ data: props.modules });
  await updateCheckboxState();
});
</script>

<template>
  <div>
    <div class="grid grid-cols-2 gap-6">
      <DictionaryListEditor
        v-model="deptStr"
        kind="dept"
        @save="emit('save')"
      />
      <DictionaryListEditor v-model="posStr" kind="pos" @save="emit('save')" />
      <DictionaryListEditor
        v-model="regionStr"
        kind="region"
        @save="emit('save')"
      />

      <!-- 模块列表 -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="text-base font-semibold">
            {{
              t('page.system.settingsDetail.form.moduleCount', {
                selected: selectedModules.length,
                total: modules.length,
              })
            }}
          </span>
          <div class="flex gap-2">
            <ElButton size="small" @click="selectAllModules">
              {{ t('page.system.settingsDetail.form.selectAll') }}
            </ElButton>
            <ElButton size="small" @click="clearModules">
              {{ t('page.system.settingsDetail.form.clear') }}
            </ElButton>
          </div>
        </div>
        <ModuleTable />
        <p class="text-xs text-muted-foreground">
          {{ t('page.system.settingsDetail.form.moduleHint') }}
        </p>
      </div>
    </div>

    <div class="flex justify-end pt-6">
      <ElButton type="primary" @click="emit('save')">
        {{ t('page.system.settingsDetail.saveSystemSettings') }}
      </ElButton>
    </div>
  </div>
</template>
