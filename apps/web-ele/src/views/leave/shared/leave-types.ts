import type { SystemSettingsApi } from '#/api';

import { computed, ref } from 'vue';

import { getSystemSettingsApi } from '#/api';

/**
 * 请假类型显示文本映射（code → 直接显示文本，来自接口 system-settings.leave_types）。
 * 不再硬编码 leave type 列表，全部由接口驱动。
 */
export const leaveTypeLabelOverride = ref<Record<string, string>>({});

/**
 * 请假类型下拉选项（{label, value}，label 为接口返回的直接显示文本）。
 */
export const leaveTypeOptionList = ref<Array<{ label: string; value: string }>>(
  [],
);

/**
 * 请假类型颜色调色板（按 code hash 取色，保证同一 code 永远同色）。
 * 不再为每种类型硬编码颜色，新增类型自动分配稳定颜色。
 */
const LEAVE_TYPE_PALETTE = [
  '#60a5fa',
  '#fb923c',
  '#f87171',
  '#4ade80',
  '#a78bfa',
  '#f472b6',
  '#2dd4bf',
  '#facc15',
  '#94a3b8',
];

/** 从 system-settings 加载 leave_types，填充 override 与下拉选项 */
export async function loadLeaveTypeLabels() {
  try {
    const settings = await getSystemSettingsApi();
    const items: SystemSettingsApi.LeaveTypeItem[] = settings.leave_types || [];
    const map: Record<string, string> = {};
    const options: Array<{ label: string; value: string }> = [];
    items.forEach((item) => {
      if (!item.code) return;
      map[item.code] = item.label;
      options.push({ label: item.label, value: item.code });
    });
    leaveTypeLabelOverride.value = map;
    leaveTypeOptionList.value = options;
  } catch {
    // 加载失败保持空映射，调用方回退到 code 本身
  }
}

/** 解析请假类型 code → 显示文本（接口 label），未命中回退到 code */
export function resolveLeaveTypeLabel(code: string): string {
  return leaveTypeLabelOverride.value[code] || code;
}

/** 按 code 生成稳定颜色（hash → 调色板索引） */
export function getLeaveTypeColor(code: string): string {
  if (!code) return '#94a3b8';
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    const cp = code.codePointAt(i);
    if (cp === undefined) continue;
    hash = cp + ((hash << 5) - hash);
  }
  const color = LEAVE_TYPE_PALETTE[Math.abs(hash) % LEAVE_TYPE_PALETTE.length];
  return color ?? '#94a3b8';
}

/** 图例项（供图例 v-for）：接口数据 + 算法颜色 */
export const leaveTypeLegendItems = computed(() =>
  leaveTypeOptionList.value.map((o) => ({
    key: o.value,
    label: o.label,
    color: getLeaveTypeColor(o.value),
  })),
);
