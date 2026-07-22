export interface PageProps {
  /**
   * 根据content可见高度自适应
   */
  autoContentHeight?: boolean;
  contentClass?: string;
  description?: string;
  footerClass?: string;
  /**
   * Whether the footer is position: fixed.
   * When true, footer height is excluded from content height calculation.
   * @default false
   */
  footerFixed?: boolean;
  headerClass?: string;
  /**
   * Custom height offset value (in pixels) to adjust content area sizing
   * when used with autoContentHeight
   * @default 0
   */
  heightOffset?: number;
  title?: string;
}
