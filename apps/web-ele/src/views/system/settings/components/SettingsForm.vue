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
  ElMessageBox,
} from 'element-plus';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { ALL_MODULE_CATALOG, getSystemSettingsApi } from '#/api';

interface ListItem {
  id: string;
  name: string;
}

type EmitUpdateName = 'update:deptStr' | 'update:posStr' | 'update:regionStr';

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

/**
 * 创建一个字符串列表的增/改/删处理器。
 *
 * 后端 PUT /api/v1/system-settings 是全量更新：每次都要把整个 string[]
 * 一起发过去，无法只改单条。这里在本地维护 list，每次单条变更后
 * 通过 emit('update:xxxStr') 同步字符串给父组件，再 emit('save') 触发
 * 父组件全量 PUT。
 */
function createListOps(
  listRef: typeof deptList,
  localStrRef: typeof localDeptStr,
  emitName: EmitUpdateName,
  tableApiRef: { setGridOptions: (opts: { data: ListItem[] }) => void },
  validationKey: string,
) {
  const mode = ref<'add' | 'edit'>('add');
  const editingId = ref('');
  const inputValue = ref('');
  const dialogVisible = ref(false);

  function openAdd() {
    mode.value = 'add';
    editingId.value = '';
    inputValue.value = '';
    dialogVisible.value = true;
  }

  function openEdit(row: ListItem) {
    mode.value = 'edit';
    editingId.value = row.id;
    inputValue.value = row.name;
    dialogVisible.value = true;
  }

  function submit() {
    const value = inputValue.value.trim();
    if (!value) {
      ElMessage.warning(t(validationKey));
      return;
    }

    if (mode.value === 'add') {
      listRef.value.push({ id: String(Date.now()), name: value });
    } else {
      const target = listRef.value.find((i) => i.id === editingId.value);
      if (target) {
        target.name = value;
      }
    }

    localStrRef.value = listToStr(listRef.value);
    emit(emitName, localStrRef.value);
    tableApiRef.setGridOptions({ data: listRef.value });
    inputValue.value = '';
    editingId.value = '';
    dialogVisible.value = false;
    emit('save');
  }

  async function remove(row: ListItem) {
    try {
      await ElMessageBox.confirm(
        t('page.system.settingsDetail.form.dialog.deleteConfirm', {
          name: row.name,
        }),
        t('page.system.settingsDetail.form.dialog.deleteConfirmTitle'),
        {
          confirmButtonText: t(
            'page.system.settingsDetail.form.dialog.confirm',
          ),
          cancelButtonText: t('page.system.settingsDetail.form.dialog.cancel'),
          type: 'warning',
        },
      );
      listRef.value = listRef.value.filter((i) => i.id !== row.id);
      localStrRef.value = listToStr(listRef.value);
      emit(emitName, localStrRef.value);
      tableApiRef.setGridOptions({ data: listRef.value });
      emit('save');
    } catch {
      // 用户取消删除
    }
  }

  return {
    mode,
    editingId,
    inputValue,
    dialogVisible,
    openAdd,
    openEdit,
    submit,
    remove,
  };
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
    {
      title: t('page.system.settingsDetail.form.column.action'),
      width: 140,
      fixed: 'right',
      slots: { default: 'action' },
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
    {
      title: t('page.system.settingsDetail.form.column.action'),
      width: 140,
      fixed: 'right',
      slots: { default: 'action' },
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
    {
      title: t('page.system.settingsDetail.form.column.action'),
      width: 140,
      fixed: 'right',
      slots: { default: 'action' },
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

// 部门 / 岗位 / 地区 三组列表的增删改处理器（共享同一套逻辑）
const deptOps = createListOps(
  deptList,
  localDeptStr,
  'update:deptStr',
  deptTableApi,
  'page.system.settingsDetail.form.validation.deptNameRequired',
);
const posOps = createListOps(
  posList,
  localPosStr,
  'update:posStr',
  posTableApi,
  'page.system.settingsDetail.form.validation.posNameRequired',
);
const regionOps = createListOps(
  regionList,
  localRegionStr,
  'update:regionStr',
  regionTableApi,
  'page.system.settingsDetail.form.validation.regionNameRequired',
);

// 三个 dialog 标题根据 mode 动态切换"新增/编辑"
const deptDialogTitle = computed(() =>
  deptOps.mode.value === 'edit'
    ? t('page.system.settingsDetail.form.dialog.deptEditTitle')
    : t('page.system.settingsDetail.form.dialog.deptTitle'),
);
const posDialogTitle = computed(() =>
  posOps.mode.value === 'edit'
    ? t('page.system.settingsDetail.form.dialog.posEditTitle')
    : t('page.system.settingsDetail.form.dialog.posTitle'),
);
const regionDialogTitle = computed(() =>
  regionOps.mode.value === 'edit'
    ? t('page.system.settingsDetail.form.dialog.regionEditTitle')
    : t('page.system.settingsDetail.form.dialog.regionTitle'),
);

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
          <ElButton size="small" type="primary" @click="deptOps.openAdd()">
            {{ t('page.system.settingsDetail.form.addDept') }}
          </ElButton>
        </div>
        <DeptTable>
          <template #action="{ row }">
            <ElButton
              size="small"
              link
              type="primary"
              @click="deptOps.openEdit(row as ListItem)"
            >
              {{ t('page.system.settingsDetail.form.edit') }}
            </ElButton>
            <ElButton
              size="small"
              link
              type="danger"
              @click="deptOps.remove(row as ListItem)"
            >
              {{ t('page.system.settingsDetail.form.delete') }}
            </ElButton>
          </template>
        </DeptTable>
      </div>

      <!-- 岗位列表 -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="text-base font-semibold">{{
            t('page.system.settingsDetail.form.posList')
          }}</span>
          <ElButton size="small" type="primary" @click="posOps.openAdd()">
            {{ t('page.system.settingsDetail.form.addPos') }}
          </ElButton>
        </div>
        <PosTable>
          <template #action="{ row }">
            <ElButton
              size="small"
              link
              type="primary"
              @click="posOps.openEdit(row as ListItem)"
            >
              {{ t('page.system.settingsDetail.form.edit') }}
            </ElButton>
            <ElButton
              size="small"
              link
              type="danger"
              @click="posOps.remove(row as ListItem)"
            >
              {{ t('page.system.settingsDetail.form.delete') }}
            </ElButton>
          </template>
        </PosTable>
      </div>

      <!-- 地区列表 -->
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="text-base font-semibold">{{
            t('page.system.settingsDetail.form.regionList')
          }}</span>
          <ElButton size="small" type="primary" @click="regionOps.openAdd()">
            {{ t('page.system.settingsDetail.form.addRegion') }}
          </ElButton>
        </div>
        <RegionTable>
          <template #action="{ row }">
            <ElButton
              size="small"
              link
              type="primary"
              @click="regionOps.openEdit(row as ListItem)"
            >
              {{ t('page.system.settingsDetail.form.edit') }}
            </ElButton>
            <ElButton
              size="small"
              link
              type="danger"
              @click="regionOps.remove(row as ListItem)"
            >
              {{ t('page.system.settingsDetail.form.delete') }}
            </ElButton>
          </template>
        </RegionTable>
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
      <ElButton type="primary" @click="$emit('save')">
        {{ t('page.system.settingsDetail.saveSystemSettings') }}
      </ElButton>
    </div>
  </div>

  <!-- 部门新增/编辑对话框 -->
  <ElDialog
    v-model="deptOps.dialogVisible.value"
    :title="deptDialogTitle"
    width="400px"
  >
    <ElForm :model="{ name: deptOps.inputValue.value }" label-width="80px">
      <ElFormItem :label="t('page.system.settingsDetail.form.column.deptName')">
        <ElInput
          v-model="deptOps.inputValue.value"
          :placeholder="
            t('page.system.settingsDetail.form.dialog.deptPlaceholder')
          "
        />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="deptOps.dialogVisible.value = false">
        {{ t('page.system.settingsDetail.form.dialog.cancel') }}
      </ElButton>
      <ElButton type="primary" @click="deptOps.submit">
        {{ t('page.system.settingsDetail.form.dialog.confirm') }}
      </ElButton>
    </template>
  </ElDialog>

  <!-- 岗位新增/编辑对话框 -->
  <ElDialog
    v-model="posOps.dialogVisible.value"
    :title="posDialogTitle"
    width="400px"
  >
    <ElForm :model="{ name: posOps.inputValue.value }" label-width="80px">
      <ElFormItem :label="t('page.system.settingsDetail.form.column.posName')">
        <ElInput
          v-model="posOps.inputValue.value"
          :placeholder="
            t('page.system.settingsDetail.form.dialog.posPlaceholder')
          "
        />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="posOps.dialogVisible.value = false">
        {{ t('page.system.settingsDetail.form.dialog.cancel') }}
      </ElButton>
      <ElButton type="primary" @click="posOps.submit">
        {{ t('page.system.settingsDetail.form.dialog.confirm') }}
      </ElButton>
    </template>
  </ElDialog>

  <!-- 地区新增/编辑对话框 -->
  <ElDialog
    v-model="regionOps.dialogVisible.value"
    :title="regionDialogTitle"
    width="400px"
  >
    <ElForm :model="{ name: regionOps.inputValue.value }" label-width="80px">
      <ElFormItem
        :label="t('page.system.settingsDetail.form.column.regionName')"
      >
        <ElInput
          v-model="regionOps.inputValue.value"
          :placeholder="
            t('page.system.settingsDetail.form.dialog.regionPlaceholder')
          "
        />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="regionOps.dialogVisible.value = false">
        {{ t('page.system.settingsDetail.form.dialog.cancel') }}
      </ElButton>
      <ElButton type="primary" @click="regionOps.submit">
        {{ t('page.system.settingsDetail.form.dialog.confirm') }}
      </ElButton>
    </template>
  </ElDialog>
</template>
