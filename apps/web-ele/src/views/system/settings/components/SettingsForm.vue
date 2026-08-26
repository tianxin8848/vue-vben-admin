<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';
import type { SystemSettingsApi } from '#/api';

import { computed, nextTick, onMounted, ref, watch } from 'vue';

import { useI18n } from '@vben/locales';

import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
} from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { ALL_MODULE_CATALOG, getSystemSettingsApi } from '#/api';

interface ListItem {
  id: string;
  name: string;
}

const props = defineProps<{
  deptStr: string;
  posStr: string;
  regionStr: string;
  selectedModules: string[];
}>();

const emit = defineEmits<{
  (
    e: 'update:deptStr' | 'update:posStr' | 'update:regionStr',
    value: string,
  ): void;
  (e: 'update:selectedModules', value: string[]): void;
  (e: 'save'): void;
}>();

const { t } = useI18n();

const localDeptStr = ref(props.deptStr);
const localPosStr = ref(props.posStr);
const localRegionStr = ref(props.regionStr);
const localSelectedModules = ref<string[]>([...props.selectedModules]);
const localModules = ref<SystemSettingsApi.SystemModuleItem[]>([]);

const deptList = ref<ListItem[]>([]);
const posList = ref<ListItem[]>([]);
const regionList = ref<ListItem[]>([]);

const showDeptDialog = ref(false);
const showPosDialog = ref(false);
const showRegionDialog = ref(false);
const newDeptName = ref('');
const newPosName = ref('');
const newRegionName = ref('');

function strToList(str: string): ListItem[] {
  return str
    .split('\n')
    .filter((s) => s.trim())
    .map((s, i) => ({
      id: String(i),
      name: s.trim(),
    }));
}

function listToStr(list: ListItem[]): string {
  return list.map((item) => item.name).join('\n');
}

function updateLists() {
  deptList.value = strToList(localDeptStr.value);
  posList.value = strToList(localPosStr.value);
  regionList.value = strToList(localRegionStr.value);
  deptTableApi.setGridOptions({ data: deptList.value });
  posTableApi.setGridOptions({ data: posList.value });
  regionTableApi.setGridOptions({ data: regionList.value });
}

function handleDeptAdd() {
  if (!newDeptName.value.trim()) {
    ElMessage.warning(
      t('page.system.settingsDetail.form.validation.deptNameRequired'),
    );
    return;
  }
  deptList.value.push({
    id: String(Date.now()),
    name: newDeptName.value.trim(),
  });
  localDeptStr.value = listToStr(deptList.value);
  emit('update:deptStr', localDeptStr.value);
  deptTableApi.setGridOptions({ data: deptList.value });
  newDeptName.value = '';
  showDeptDialog.value = false;
  emit('save');
}

function handlePosAdd() {
  if (!newPosName.value.trim()) {
    ElMessage.warning(
      t('page.system.settingsDetail.form.validation.posNameRequired'),
    );
    return;
  }
  posList.value.push({
    id: String(Date.now()),
    name: newPosName.value.trim(),
  });
  localPosStr.value = listToStr(posList.value);
  emit('update:posStr', localPosStr.value);
  posTableApi.setGridOptions({ data: posList.value });
  newPosName.value = '';
  showPosDialog.value = false;
  emit('save');
}

function handleRegionAdd() {
  if (!newRegionName.value.trim()) {
    ElMessage.warning(
      t('page.system.settingsDetail.form.validation.regionNameRequired'),
    );
    return;
  }
  regionList.value.push({
    id: String(Date.now()),
    name: newRegionName.value.trim(),
  });
  localRegionStr.value = listToStr(regionList.value);
  emit('update:regionStr', localRegionStr.value);
  regionTableApi.setGridOptions({ data: regionList.value });
  newRegionName.value = '';
  showRegionDialog.value = false;
  emit('save');
}

async function updateCheckboxState() {
  await nextTick();
  localModules.value.forEach((row) => {
    moduleTableApi.grid.setCheckboxRow(
      row,
      localSelectedModules.value.includes(row.module_code),
    );
  });
}

function handleCheckboxChange() {
  const records = moduleTableApi.grid.getCheckboxRecords();
  const newSelected = records.map((r) => r.module_code);
  localSelectedModules.value = newSelected;
  emit('update:selectedModules', [...newSelected]);
}

const sharedGridOptions = {
  rowConfig: { keyField: 'id' },
  proxyConfig: { enabled: false },
  toolbarConfig: {
    zoom: true,
    custom: false,
  },
  customConfig: { storage: false },
} satisfies VxeGridProps<ListItem>;

const deptGridOptions = computed<VxeGridProps<ListItem>>(() => ({
  ...sharedGridOptions,
  id: 'settings-dept-list',
  columns: [
    {
      type: 'seq',
      width: 70,
      title: t('page.system.settingsDetail.form.column.seq'),
    },
    {
      field: 'name',
      title: t('page.system.settingsDetail.form.column.deptName'),
      minWidth: 150,
    },
  ],
}));

const posGridOptions = computed<VxeGridProps<ListItem>>(() => ({
  ...sharedGridOptions,
  id: 'settings-pos-list',
  columns: [
    {
      type: 'seq',
      width: 70,
      title: t('page.system.settingsDetail.form.column.seq'),
    },
    {
      field: 'name',
      title: t('page.system.settingsDetail.form.column.posName'),
      minWidth: 150,
    },
  ],
}));

const regionGridOptions = computed<VxeGridProps<ListItem>>(() => ({
  ...sharedGridOptions,
  id: 'settings-region-list',
  columns: [
    {
      type: 'seq',
      width: 70,
      title: t('page.system.settingsDetail.form.column.seq'),
    },
    {
      field: 'name',
      title: t('page.system.settingsDetail.form.column.regionName'),
      minWidth: 150,
    },
  ],
}));

const moduleGridOptions = computed<
  VxeGridProps<SystemSettingsApi.SystemModuleItem>
>(() => ({
  id: 'settings-module-list',
  rowConfig: { keyField: 'module_code' },
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
  proxyConfig: { enabled: false },
  toolbarConfig: { zoom: true, custom: false },
  customConfig: { storage: false },
}));

const [DeptTable, deptTableApi] = useVbenVxeGrid({
  gridOptions: deptGridOptions.value,
});
const [PosTable, posTableApi] = useVbenVxeGrid({
  gridOptions: posGridOptions.value,
});
const [RegionTable, regionTableApi] = useVbenVxeGrid({
  gridOptions: regionGridOptions.value,
});
const [ModuleTable, moduleTableApi] = useVbenVxeGrid({
  gridOptions: moduleGridOptions.value,
  gridEvents: {
    checkboxChange: handleCheckboxChange,
    checkboxAll: handleCheckboxChange,
  },
});

watch(deptGridOptions, () => {
  deptTableApi.setGridOptions(deptGridOptions.value);
});

watch(posGridOptions, () => {
  posTableApi.setGridOptions(posGridOptions.value);
});

watch(regionGridOptions, () => {
  regionTableApi.setGridOptions(regionGridOptions.value);
});

watch(moduleGridOptions, () => {
  moduleTableApi.setGridOptions(moduleGridOptions.value);
});

onMounted(async () => {
  updateLists();
  // 始终以全量目录为基础，保证所有模块行始终展示，仅通过勾选状态区分是否启用
  localModules.value = ALL_MODULE_CATALOG.map((m) => ({ ...m }));
  try {
    const settings = await getSystemSettingsApi();
    const backendModules = settings?.modules || [];
    // 用后端返回的名称更新目录中同名模块，并合并目录中不存在的后端模块
    localModules.value = localModules.value.map((m) => {
      const backend = backendModules.find(
        (b) => b.module_code === m.module_code,
      );
      return backend ? { ...m, module_name: backend.module_name } : m;
    });
    const existingCodes = new Set(localModules.value.map((m) => m.module_code));
    for (const b of backendModules) {
      if (!existingCodes.has(b.module_code)) {
        localModules.value.push({ ...b });
      }
    }
  } catch {
    // 保持全量目录不变
  }
  moduleTableApi.setGridOptions({ data: localModules.value });
  await updateCheckboxState();
});

watch(
  () => props.deptStr,
  (newVal) => {
    if (newVal !== localDeptStr.value) {
      localDeptStr.value = newVal;
      updateLists();
    }
  },
);

watch(
  () => props.posStr,
  (newVal) => {
    if (newVal !== localPosStr.value) {
      localPosStr.value = newVal;
      updateLists();
    }
  },
);

watch(
  () => props.regionStr,
  (newVal) => {
    if (newVal !== localRegionStr.value) {
      localRegionStr.value = newVal;
      updateLists();
    }
  },
);

watch(localDeptStr, (newVal) => {
  emit('update:deptStr', newVal);
});

watch(localPosStr, (newVal) => {
  emit('update:posStr', newVal);
});

watch(localRegionStr, (newVal) => {
  emit('update:regionStr', newVal);
});

watch(
  () => props.selectedModules,
  async (newVal) => {
    localSelectedModules.value = [...newVal];
    await updateCheckboxState();
  },
  { deep: true },
);

function selectAllModules() {
  moduleTableApi.grid.setAllCheckboxRow(true);
  handleCheckboxChange();
}

function clearModules() {
  moduleTableApi.grid.setAllCheckboxRow(false);
  handleCheckboxChange();
}
</script>

<template>
  <div>
    <div class="grid grid-cols-2 gap-6">
      <!-- 部门列表 -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="text-base font-semibold">{{
            t('page.system.settingsDetail.form.deptList')
          }}</span>
          <ElButton size="small" type="primary" @click="showDeptDialog = true">
            {{ t('page.system.settingsDetail.form.addDept') }}
          </ElButton>
        </div>
        <DeptTable />
      </div>

      <!-- 岗位列表 -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="text-base font-semibold">{{
            t('page.system.settingsDetail.form.posList')
          }}</span>
          <ElButton size="small" type="primary" @click="showPosDialog = true">
            {{ t('page.system.settingsDetail.form.addPos') }}
          </ElButton>
        </div>
        <PosTable />
      </div>

      <!-- 地区列表 -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="text-base font-semibold">{{
            t('page.system.settingsDetail.form.regionList')
          }}</span>
          <ElButton
            size="small"
            type="primary"
            @click="showRegionDialog = true"
          >
            {{ t('page.system.settingsDetail.form.addRegion') }}
          </ElButton>
        </div>
        <RegionTable />
      </div>

      <!-- 模块列表 -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="text-base font-semibold">
            {{
              t('page.system.settingsDetail.form.moduleCount', {
                selected: localSelectedModules.length,
                total: localModules.length,
              })
            }}
          </span>
          <div class="flex gap-2">
            <ElButton size="small" @click="selectAllModules">
{{
              t('page.system.settingsDetail.form.selectAll')
            }}
</ElButton>
            <ElButton size="small" @click="clearModules">
{{
              t('page.system.settingsDetail.form.clear')
            }}
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
      <ElButton type="primary" @click="$emit('save')">
        {{ t('page.system.settingsDetail.saveSystemSettings') }}
      </ElButton>
    </div>
  </div>

  <ElDialog
    v-model="showDeptDialog"
    :title="t('page.system.settingsDetail.form.dialog.deptTitle')"
    width="400px"
  >
    <ElForm :model="{ name: newDeptName }" label-width="80px">
      <ElFormItem :label="t('page.system.settingsDetail.form.column.deptName')">
        <ElInput
          v-model="newDeptName"
          :placeholder="
            t('page.system.settingsDetail.form.dialog.deptPlaceholder')
          "
        />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="showDeptDialog = false">
{{
        t('page.system.settingsDetail.form.dialog.cancel')
      }}
</ElButton>
      <ElButton type="primary" @click="handleDeptAdd">
{{
        t('page.system.settingsDetail.form.dialog.confirm')
      }}
</ElButton>
    </template>
  </ElDialog>

  <ElDialog
    v-model="showPosDialog"
    :title="t('page.system.settingsDetail.form.dialog.posTitle')"
    width="400px"
  >
    <ElForm :model="{ name: newPosName }" label-width="80px">
      <ElFormItem :label="t('page.system.settingsDetail.form.column.posName')">
        <ElInput
          v-model="newPosName"
          :placeholder="
            t('page.system.settingsDetail.form.dialog.posPlaceholder')
          "
        />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="showPosDialog = false">
{{
        t('page.system.settingsDetail.form.dialog.cancel')
      }}
</ElButton>
      <ElButton type="primary" @click="handlePosAdd">
{{
        t('page.system.settingsDetail.form.dialog.confirm')
      }}
</ElButton>
    </template>
  </ElDialog>

  <ElDialog
    v-model="showRegionDialog"
    :title="t('page.system.settingsDetail.form.dialog.regionTitle')"
    width="400px"
  >
    <ElForm :model="{ name: newRegionName }" label-width="80px">
      <ElFormItem
        :label="t('page.system.settingsDetail.form.column.regionName')"
      >
        <ElInput
          v-model="newRegionName"
          :placeholder="
            t('page.system.settingsDetail.form.dialog.regionPlaceholder')
          "
        />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="showRegionDialog = false">
{{
        t('page.system.settingsDetail.form.dialog.cancel')
      }}
</ElButton>
      <ElButton type="primary" @click="handleRegionAdd">
{{
        t('page.system.settingsDetail.form.dialog.confirm')
      }}
</ElButton>
    </template>
  </ElDialog>
</template>
