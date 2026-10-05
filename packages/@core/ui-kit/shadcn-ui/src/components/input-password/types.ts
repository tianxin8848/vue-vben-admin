export interface PasswordRequirement {
  /** 提示文案，由调用方提供（本组件不依赖 i18n） */
  label: string;
  /** 判断当前密码是否满足该项要求 */
  test: (value: string) => boolean;
}
