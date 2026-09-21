import { $t } from '@vben/locales';

import { ElMessageBox } from 'element-plus';

/**
 * 确认弹窗的统一出口。
 *
 * 替代 `ElMessageBox.confirm(...)` 的样板：
 * - 按钮文案、图标类型、标题默认值统一，不再每个页面各写一遍 i18n key。
 * - **用户取消时返回 false 而不是抛异常**，所以调用方不需要再包 try/catch，
 *   也不会把「用户主动取消」和「真正的失败」混在同一个 catch 里。
 *
 * @example
 * ```ts
 * async function handleDelete(row: Customer) {
 *   const ok = await confirmDelete({
 *     message: t('page.fuximap.confirmDelete', { name: row.name }),
 *   });
 *   if (!ok) return;
 *   await deleteCustomerApi(row.id);
 *   toastSuccess(t('page.fuximap.deleteSuccess'));
 * }
 * ```
 */

export interface ConfirmOptions {
  /** 正文，如「确认删除 xxx 吗？」 */
  message: string;
  /** 标题，默认取 `common.prompt`（提示） */
  title?: string;
  /** 确认按钮文案，默认取 `common.confirm`（确认） */
  confirmButtonText?: string;
  /** 取消按钮文案，默认取 `common.cancel`（取消） */
  cancelButtonText?: string;
  /** 图标类型，默认 `warning` */
  type?: 'error' | 'info' | 'success' | 'warning';
  /** 确认按钮附加 class，如 `el-button--danger` 显示为红色 */
  confirmButtonClass?: string;
}

/**
 * 弹出确认框。返回用户是否点了确认。
 * 用户取消 / 关闭弹窗一律返回 false，不抛异常。
 */
export async function confirmAction(options: ConfirmOptions): Promise<boolean> {
  const {
    message,
    title = $t('common.prompt'),
    confirmButtonText = $t('common.confirm'),
    cancelButtonText = $t('common.cancel'),
    type = 'warning',
    confirmButtonClass,
  } = options;

  try {
    await ElMessageBox.confirm(message, title, {
      cancelButtonText,
      confirmButtonClass,
      confirmButtonText,
      type,
    });
    return true;
  } catch {
    // 用户取消（reject 值为 'cancel'/'close'），不是错误
    return false;
  }
}

/**
 * 危险操作确认（删除等）。返回用户是否点了确认。
 *
 * 默认值做了三处统一（原先 15 处删除确认里这三项各写各的）：
 * - 确认按钮文案 `common.delete`（删除/Delete），比通用「确认」更贴合删除语义
 * - 确认按钮加 `el-button--danger`（红色）——原先只有 4 处加了
 * - 图标 `warning`
 * 任意一项都可以通过入参覆盖。
 */
export function confirmDelete(
  options: Omit<ConfirmOptions, 'confirmButtonText' | 'type'>,
): Promise<boolean> {
  return confirmAction({
    confirmButtonClass: 'el-button--danger',
    confirmButtonText: $t('common.delete'),
    ...options,
    type: 'warning',
  });
}

export interface PromptOptions {
  /** 提示正文 */
  message: string;
  /** 标题，省略则不显示标题栏 */
  title?: string;
  /** 输入框初始值 */
  initialValue?: string;
  /** 输入框占位文案 */
  placeholder?: string;
  /** 输入框类型，多行备注用 `textarea` */
  inputType?: 'text' | 'textarea';
  /** 图标类型，省略则不显示图标 */
  type?: 'error' | 'info' | 'success' | 'warning';
  /**
   * 校验函数。返回 `true` 表示通过，返回字符串表示错误文案（element-plus 会显示在输入框下方）。
   */
  validate?: (value: string) => boolean | string;
}

/**
 * 弹出单行/多行输入框。返回用户输入的内容（已 trim）；**用户取消返回 null**。
 *
 * @example
 * ```ts
 * const comment = await promptText({
 *   message: t('page.claim.messages.withdrawPrompt'),
 *   inputType: 'textarea',
 *   title: t('page.claim.buttons.withdraw'),
 * });
 * if (comment === null) return; // 用户取消
 * ```
 */
export async function promptText(
  options: PromptOptions,
): Promise<null | string> {
  const {
    message,
    title,
    initialValue = '',
    placeholder,
    inputType = 'text',
    type,
    validate,
  } = options;

  try {
    const { value } = await ElMessageBox.prompt(message, title ?? '', {
      cancelButtonText: $t('common.cancel'),
      confirmButtonText: $t('common.confirm'),
      inputPlaceholder: placeholder,
      inputType,
      inputValidator: validate,
      inputValue: initialValue,
      type,
    });
    return (value ?? '').trim();
  } catch {
    // 用户取消（reject 值为 'cancel'/'close'），不是错误
    return null;
  }
}
