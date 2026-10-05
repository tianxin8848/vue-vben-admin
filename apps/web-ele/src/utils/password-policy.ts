import { $t } from '@vben/locales';

/**
 * 密码策略（唯一出口）。
 *
 * 与后端 `app/core/security.py` 的 `validate_password_policy` 对齐：
 * 至少 12 位，且必须包含特殊字符（后端按 `string.punctuation` 判定）。
 * 前端在此基础上额外要求同时包含大写字母与小写字母。
 */
export const PASSWORD_MIN_LENGTH = 12;

/** 后端 `string.punctuation` 等价的 ASCII 特殊字符集合 */
export const PASSWORD_PATTERNS = {
  lowercase: /[a-z]/,
  uppercase: /[A-Z]/,
  special: /[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/,
} as const;

/** 逐条判定的密码要求（用于密码输入框下方的实时提示） */
export interface PasswordRequirement {
  /** 提示文案 */
  label: string;
  /** 判断当前密码是否满足该项要求 */
  test: (value: string) => boolean;
}

/** 校验失败时的提示文案 */
export function passwordMessages() {
  return {
    required: $t('profile.passwordRequired'),
    tooShort: $t('profile.passwordTooShort'),
    lowercase: $t('profile.passwordNeedLowercase'),
    uppercase: $t('profile.passwordNeedUppercase'),
    special: $t('profile.passwordNeedSpecial'),
  };
}

/**
 * 构建实时提示项，顺序与 `profile.passwordHint` 的表述一致：
 * 长度 → 大写字母 → 小写字母 → 特殊字符
 */
export function passwordRequirements(): PasswordRequirement[] {
  return [
    {
      label: $t('profile.passwordRuleLength', [PASSWORD_MIN_LENGTH]),
      test: (value) => value.length >= PASSWORD_MIN_LENGTH,
    },
    {
      label: $t('profile.passwordRuleUppercase'),
      test: (value) => PASSWORD_PATTERNS.uppercase.test(value),
    },
    {
      label: $t('profile.passwordRuleLowercase'),
      test: (value) => PASSWORD_PATTERNS.lowercase.test(value),
    },
    {
      label: $t('profile.passwordRuleSpecial'),
      test: (value) => PASSWORD_PATTERNS.special.test(value),
    },
  ];
}
