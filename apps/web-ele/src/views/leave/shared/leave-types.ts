import type { SystemSettingsApi } from '#/api';

import { computed, ref } from 'vue';

import { getSystemSettingsApi } from '#/api';

/**
 * 请假类型显示文本映射（code → 直接显示文本，来自接口 system-settings.leave_types）。
 * 不再硬编码 leave type 列表，全部由接口驱动。
 */
export const leaveTypeLabelOverride = ref<Record<string, string>>({});

/**
 * 结转年假的后端规范 code。后端 10-05 把 `bought_forward` 更名为 `brought_forward`
 * （目录 normalize 会改写，但**历史单据不迁库**，仍带旧 code）。
 * 目录接口只返回新 code，故这里补一条旧 code 别名，避免历史记录显示裸 code。
 */
const BROUGHT_FORWARD_CODE = 'brought_forward';
const LEGACY_BROUGHT_FORWARD_CODE = 'bought_forward';

/**
 * 请假类型下拉选项（{label, value}，label 为接口返回的直接显示文本）。
 */
export const leaveTypeOptionList = ref<Array<{ label: string; value: string }>>(
  [],
);

/**
 * 请假类型调色板：按色相环均匀拉开的高区分度配色（兼顾色盲友好）。
 * 通过顺序分配（见 getLeaveTypeColor / loadLeaveTypeLabels）保证前 N 种类型各占一个
 * 明显不同的颜色，避免 hash 取模导致的相近色撞击（如年假 / 产假同落到黄色）。
 */
const LEAVE_TYPE_PALETTE = [
  '#2563eb', // 蓝
  '#dc2626', // 红
  '#16a34a', // 绿
  '#7c3aed', // 紫
  '#0891b2', // 青
  '#ea580c', // 橙
  '#db2777', // 品红
  '#ca8a04', // 金黄（深，区别于橙）
  '#64748b', // 灰（兜底：空 code / 超过调色板数量）
];

/**
 * code → 调色板索引的稳定映射。
 * 保证同一 code 永远同色，且接口顺序靠前的类型优先拿到高区分的前几个颜色，
 * 使图例与日历事件着色保持一致。
 */
const leaveTypeColorIndexMap = new Map<string, number>();

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
    // 历史单据仍是 bought_forward：补别名，使其与 brought_forward 显示同一文案
    if (map[BROUGHT_FORWARD_CODE]) {
      map[LEGACY_BROUGHT_FORWARD_CODE] = map[BROUGHT_FORWARD_CODE];
    }
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

/**
 * 解析请假类型 code → 高区分稳定颜色。
 * 优先使用接口加载时按序预分配的索引；未预分配（如接口尚未加载）时按首次出现顺序补齐，
 * 超出调色板数量再回退到 hash 取色，保证任意情况下同类同色。
 */
export function getLeaveTypeColor(rawCode: string): string {
  if (!rawCode) return '#64748b';
  // 旧 code 归一到新 code，保证同一类型的历史记录与新记录同色
  const code =
    rawCode === LEGACY_BROUGHT_FORWARD_CODE ? BROUGHT_FORWARD_CODE : rawCode;
  const assigned = leaveTypeColorIndexMap.get(code);
  if (assigned !== undefined) return LEAVE_TYPE_PALETTE[assigned] ?? '#64748b';

  const used = new Set(leaveTypeColorIndexMap.values());
  let idx = 0;
  while (used.has(idx)) idx += 1;
  if (idx >= LEAVE_TYPE_PALETTE.length) {
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      const cp = code.codePointAt(i);
      if (cp === undefined) continue;
      hash = cp + ((hash << 5) - hash);
    }
    idx = Math.abs(hash) % LEAVE_TYPE_PALETTE.length;
  }
  leaveTypeColorIndexMap.set(code, idx);
  return LEAVE_TYPE_PALETTE[idx] ?? '#64748b';
}

/** 图例项（供图例 v-for）：接口数据 + 算法颜色 */
export const leaveTypeLegendItems = computed(() =>
  leaveTypeOptionList.value.map((o) => ({
    key: o.value,
    label: o.label,
    color: getLeaveTypeColor(o.value),
  })),
);
