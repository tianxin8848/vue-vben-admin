import {
  i18n,
  loadLocaleMessages,
  loadLocalesMap,
  loadLocalesMapFromDir,
  setupI18n,
} from './i18n';

const $t = i18n.global.t;
const $te = i18n.global.te;
// tm 返回原始翻译消息（保留数组/对象结构），用于读取 list 型 i18n 数据（如 monthNames 数组）。
// $t 对 list 型消息会做翻译拼接返回字符串，无法直接拿到数组。
const $tm = i18n.global.tm;

export {
  $t,
  $te,
  $tm,
  i18n,
  loadLocaleMessages,
  loadLocalesMap,
  loadLocalesMapFromDir,
  setupI18n,
};
export {
  type ImportLocaleFn,
  type LocaleSetupOptions,
  type SupportedLanguagesType,
} from './typing';
export type { CompileError } from '@intlify/core-base';

export { useI18n } from 'vue-i18n';

export type { Locale } from 'vue-i18n';
