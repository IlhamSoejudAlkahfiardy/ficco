'use client';

import React from 'react';
import { Select as AntdSelect, ConfigProvider, theme as antdTheme } from 'antd';
import type { SelectProps as AntdSelectProps, DefaultOptionType } from 'antd/es/select';
import { useTheme } from '../_hooks/use-theme';

export interface AppSelectProps<
  ValueType = any,
  OptionType extends DefaultOptionType = DefaultOptionType,
> extends Omit<AntdSelectProps<ValueType, OptionType>, 'size'> {
  /**
   * Ukuran select. Default: 'middle' (medium)
   */
  size?: 'small' | 'middle' | 'large' | 'medium';
}

/**
 * Shared Global Select Component berbasis Ant Design.
 *
 * Fitur:
 * - Searchable select by default (`showSearch: true` & pencarian berbasis label).
 * - Ukuran default 'middle' / medium, dapat diubah via props `size`.
 * - Theme-aware: otomatis beradaptasi dengan mode gelap (dark) dan terang (light).
 * - Meneruskan seluruh props Ant Design Select (`options`, `value`, `onChange`, `placeholder`, `allowClear`, dll).
 */
export const AppSelect = <
  ValueType = any,
  OptionType extends DefaultOptionType = DefaultOptionType,
>({
  showSearch = true,
  size = 'middle',
  filterOption = (input, option) => {
    const label = option?.label ?? '';
    return String(label).toLowerCase().includes(input.toLowerCase());
  },
  optionFilterProp = 'label',
  className = '',
  ...props
}: AppSelectProps<ValueType, OptionType>) => {
  const { isDark } = useTheme();
  const resolvedSize = size === 'medium' ? 'middle' : size;

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#2563eb', // Blue-600
          borderRadius: 10,
          fontFamily: 'inherit',
          colorBgContainer: isDark ? '#18181b' : '#ffffff', // zinc-900 / white
          colorBgElevated: isDark ? '#18181b' : '#ffffff', // dropdown popup background
          colorBorder: isDark ? '#27272a' : '#e2e8f0', // zinc-800 / slate-200
          colorText: isDark ? '#f4f4f5' : '#0f172a', // zinc-100 / slate-900
          colorTextPlaceholder: isDark ? '#71717a' : '#94a3b8',
        },
      }}
    >
      <AntdSelect<ValueType, OptionType>
        showSearch={showSearch}
        size={resolvedSize}
        filterOption={filterOption}
        optionFilterProp={optionFilterProp}
        className={`app-select ${className}`}
        {...props}
      />
    </ConfigProvider>
  );
};

export const Select = AppSelect;
export default AppSelect;
