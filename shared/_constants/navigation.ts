export interface NavItem {
  key: string;
  label: string;
  href: string;
  iconName:
    | 'dashboard'
    | 'invoices'
    | 'expenses'
    | 'customers'
    | 'products'
    | 'reports'
    | 'settings'
    | 'backup'
    | 'license';
  badge?: string;
  isBottomNav?: boolean;
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/dashboard',
    iconName: 'dashboard',
    isBottomNav: true,
  },
  {
    key: 'invoices',
    label: 'Invoices',
    href: '/invoices',
    iconName: 'invoices',
    isBottomNav: true,
  },
  {
    key: 'expenses',
    label: 'Expenses',
    href: '/expenses',
    iconName: 'expenses',
    isBottomNav: true,
  },
  {
    key: 'customers',
    label: 'Customers',
    href: '/customers',
    iconName: 'customers',
    isBottomNav: false,
  },
  {
    key: 'products',
    label: 'Products & Services',
    href: '/products',
    iconName: 'products',
    isBottomNav: false,
  },
  {
    key: 'reports',
    label: 'Reports',
    href: '/reports',
    iconName: 'reports',
    isBottomNav: true,
  },
];

export const SECONDARY_NAV_ITEMS: NavItem[] = [
  {
    key: 'settings',
    label: 'Settings',
    href: '/settings',
    iconName: 'settings',
  },
  {
    key: 'backup',
    label: 'Backup & Restore',
    href: '/backup',
    iconName: 'backup',
  },
  {
    key: 'license',
    label: 'License',
    href: '/license',
    iconName: 'license',
  },
];
