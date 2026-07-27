import type { VNode } from 'vue';

export interface IconPickerProps {
  /** 是否自动请求API以获得图标集的数据.提供prefix时有效 */
  autoFetchApi?: boolean;
  /** 图标样式 */
  iconClass?: string;
  /**
   * 图标列表
   */
  icons?: string[];
  /** 图标插槽名，预览图标将被渲染到此插槽中 */
  iconSlot?: string;
  /** Input组件 */
  inputComponent?: VNode;
  /** input组件的值属性名称 */
  modelValueProp?: string;
  pageSize?: number;
  /** 图标集的名字 */
  prefix?: string;
  type?: 'icon' | 'input';
}
