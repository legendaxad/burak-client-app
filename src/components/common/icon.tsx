import { SymbolView } from 'expo-symbols';
import type { ColorValue } from 'react-native';

import { useTheme } from '@/theme';

/** SF Symbols on iOS, Material Symbols on Android/web. */
const iconNames = {
  home: { ios: 'house.fill', android: 'home', web: 'home' },
  menu: { ios: 'fork.knife', android: 'restaurant_menu', web: 'restaurant_menu' },
  bag: { ios: 'bag.fill', android: 'shopping_bag', web: 'shopping_bag' },
  orders: { ios: 'list.bullet.rectangle', android: 'receipt_long', web: 'receipt_long' },
  profile: { ios: 'person.fill', android: 'person', web: 'person' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  back: { ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' },
  next: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  info: { ios: 'info.circle', android: 'info', web: 'info' },
  warning: { ios: 'exclamationmark.triangle', android: 'warning', web: 'warning' },
  refresh: { ios: 'arrow.clockwise', android: 'refresh', web: 'refresh' },
  eye: { ios: 'eye', android: 'visibility', web: 'visibility' },
  eyeOff: { ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' },
  phone: { ios: 'phone', android: 'call', web: 'call' },
  star: { ios: 'star.fill', android: 'star', web: 'star' },
  logout: { ios: 'rectangle.portrait.and.arrow.right', android: 'logout', web: 'logout' },
  photo: { ios: 'photo', android: 'image', web: 'image' },
  views: { ios: 'eye', android: 'visibility', web: 'visibility' },
  sort: { ios: 'arrow.up.arrow.down', android: 'swap_vert', web: 'swap_vert' },
  dish: { ios: 'fork.knife', android: 'restaurant', web: 'restaurant' },
  salad: { ios: 'leaf', android: 'eco', web: 'eco' },
  dessert: { ios: 'birthday.cake', android: 'cake', web: 'cake' },
  drink: { ios: 'cup.and.saucer', android: 'local_cafe', web: 'local_cafe' },
  other: { ios: 'square.grid.2x2', android: 'apps', web: 'apps' },
} as const;

export type IconName = keyof typeof iconNames;

export function Icon({ name, size = 20, color }: { name: IconName; size?: number; color?: ColorValue }) {
  const { colors } = useTheme();
  return <SymbolView name={iconNames[name]} size={size} tintColor={color ?? colors.text} />;
}
