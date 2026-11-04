import { SymbolView } from 'expo-symbols';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/theme/colors';
import type { Order, OrderStatus, Product } from '@/types/models';

const iconNames: Record<string, { ios: string; android: string; web: string }> = {
  home: { ios: 'house.fill', android: 'home', web: 'home' },
  menu: { ios: 'fork.knife', android: 'restaurant_menu', web: 'restaurant_menu' },
  bag: { ios: 'bag.fill', android: 'shopping_bag', web: 'shopping_bag' },
  orders: { ios: 'list.bullet.rectangle', android: 'receipt_long', web: 'receipt_long' },
  profile: { ios: 'person.fill', android: 'person', web: 'person' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  star: { ios: 'star.fill', android: 'star', web: 'star' },
  plus: { ios: 'plus', android: 'add', web: 'add' },
  minus: { ios: 'minus', android: 'remove', web: 'remove' },
  arrow: { ios: 'arrow.left', android: 'arrow_back', web: 'arrow_back' },
  next: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  trash: { ios: 'trash', android: 'delete_outline', web: 'delete_outline' },
  pin: { ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' },
  clock: { ios: 'clock', android: 'schedule', web: 'schedule' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  receipt: { ios: 'receipt', android: 'receipt_long', web: 'receipt_long' },
  help: { ios: 'questionmark.circle', android: 'help_outline', web: 'help_outline' },
  phone: { ios: 'phone', android: 'call', web: 'call' },
  mail: { ios: 'envelope', android: 'mail', web: 'mail' },
  settings: { ios: 'gearshape', android: 'settings', web: 'settings' },
  info: { ios: 'info.circle', android: 'info', web: 'info' },
  truck: { ios: 'car', android: 'delivery_dining', web: 'delivery_dining' },
};

export function AppIcon({ name, size = 20, color = colors.text }: { name: string; size?: number; color?: string }) {
  return <SymbolView name={iconNames[name] ?? iconNames.info} size={size} tintColor={color} />;
}

export function AppScreen({ children, contentStyle, scroll = true }: { children: ReactNode; contentStyle?: StyleProp<ViewStyle>; scroll?: boolean }) {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      {scroll ? (
        <ScrollView contentContainerStyle={[styles.screenContent, contentStyle]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.contentWidth}>{children}</View>
        </ScrollView>
      ) : <View style={[styles.screenContent, styles.contentWidth, contentStyle]}>{children}</View>}
    </SafeAreaView>
  );
}

export function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <View style={styles.brandMark}>
      <Text style={[styles.brandName, light && styles.brandNameLight]}>BURAK</Text>
      <Text style={[styles.brandCaption, light && styles.brandCaptionLight]}>MODERN TURKISH KITCHEN</Text>
    </View>
  );
}

export function PageHeader({ title, subtitle, back = false, action }: { title: string; subtitle?: string; back?: boolean; action?: ReactNode }) {
  return (
    <View style={styles.pageHeader}>
      <View style={styles.pageHeaderRow}>
        {back ? <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} hitSlop={8} style={styles.backButton}><AppIcon name="arrow" size={20} /></Pressable> : <BrandMark />}
        {action}
      </View>
      <Text style={styles.pageTitle}>{title}</Text>
      {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function SectionTitle({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {actionLabel && onAction ? <Pressable accessibilityRole="button" onPress={onAction} hitSlop={6}><Text style={styles.sectionAction}>{actionLabel}</Text></Pressable> : null}
    </View>
  );
}

export function SearchField({ value, onChangeText, placeholder = 'Search dishes, ingredients…', onFocus, onSubmitEditing }: { value: string; onChangeText: (value: string) => void; placeholder?: string; onFocus?: () => void; onSubmitEditing?: () => void }) {
  return (
    <View style={styles.searchField}>
      <AppIcon name="search" size={19} color={colors.muted} />
      <TextInput value={value} onChangeText={onChangeText} onFocus={onFocus} onSubmitEditing={onSubmitEditing} placeholder={placeholder} placeholderTextColor="#99948C" style={styles.searchInput} returnKeyType="search" accessibilityLabel={placeholder} />
      {value ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => onChangeText('')} hitSlop={8}><Text style={styles.clearSearch}>×</Text></Pressable> : null}
    </View>
  );
}

export function PrimaryButton({ title, onPress, icon, secondary = false, disabled = false, loading = false }: { title: string; onPress: () => void; icon?: string; secondary?: boolean; disabled?: boolean; loading?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled: disabled || loading }} disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [styles.primaryButton, secondary && styles.secondaryButton, (disabled || loading) && styles.disabledButton, pressed && !disabled && !loading && styles.pressed]}>
      {icon ? <AppIcon name={icon} size={17} color={secondary ? colors.text : colors.ink} /> : null}
      <Text style={[styles.primaryButtonText, secondary && styles.secondaryButtonText]}>{loading ? 'Please wait…' : title}</Text>
    </Pressable>
  );
}

export function ChoiceChip({ label, selected, onPress, icon }: { label: string; selected: boolean; onPress: () => void; icon?: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={[styles.choiceChip, selected && styles.choiceChipSelected]}>
      {icon ? <Text style={styles.categoryEmoji}>{icon}</Text> : null}
      <Text style={[styles.choiceChipText, selected && styles.choiceChipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function Price({ value, style }: { value: number; style?: StyleProp<TextStyle> }) {
  return <Text style={[styles.price, style]}>{`$${value.toFixed(2)}`}</Text>;
}

export function ProductCard({ product, onPress, onQuickAdd, horizontal = false }: { product: Product; onPress: () => void; onQuickAdd?: () => void; horizontal?: boolean }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  return (
    <View style={[styles.productCard, horizontal && styles.productCardHorizontal]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${product.name}, $${product.price.toFixed(2)}, ${product.rating} stars`} onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
        <View style={[styles.productImageWrap, horizontal && styles.productImageWrapHorizontal]}>
          <Image source={product.image} style={styles.productImage} contentFit="cover" cachePolicy="memory-disk" transition={180} onLoad={() => setImageLoaded(true)} />
          {!imageLoaded ? <View pointerEvents="none" style={styles.imagePlaceholder} /> : null}
          {product.isBestSeller ? <View style={styles.bestSellerBadge}><Text style={styles.bestSellerText}>BEST SELLER</Text></View> : null}
        </View>
        <View style={styles.productCardBody}>
          <Text style={styles.productCategory}>{product.category}</Text>
          <Text numberOfLines={1} style={styles.productName}>{product.name}</Text>
          <View style={styles.productMetaRow}>
            <View style={styles.ratingRow}><AppIcon name="star" size={13} color={colors.goldDeep} /><Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text></View>
            <Text style={styles.prepText}>{product.prepMinutes} min</Text>
          </View>
          <View style={styles.productBottomRow}><Price value={product.price} /><Text style={[styles.availabilityText, product.availability === 'Sold out' && styles.soldOutText]}>{product.availability === 'Available' ? 'Available' : 'Sold out'}</Text></View>
        </View>
      </Pressable>
      {onQuickAdd && product.availability === 'Available' ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Add ${product.name} to cart`} onPress={onQuickAdd} hitSlop={6} style={({ pressed }) => [styles.quickAdd, pressed && styles.pressed]}><AppIcon name="plus" size={17} color={colors.ink} /></Pressable>
      ) : null}
    </View>
  );
}

export function ProductRow({ product, onPress, onQuickAdd }: { product: Product; onPress: () => void; onQuickAdd?: () => void }) {
  return (
    <View style={styles.productRow}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${product.name}, $${product.price.toFixed(2)}`} onPress={onPress} style={({ pressed }) => [styles.productRowMain, pressed && styles.pressed]}>
        <Image source={product.image} style={styles.productRowImage} contentFit="cover" cachePolicy="memory-disk" transition={160} />
        <View style={styles.productRowCopy}>
          <Text style={styles.productCategory}>{product.category}</Text>
          <Text numberOfLines={1} style={styles.productName}>{product.name}</Text>
          <Text numberOfLines={2} style={styles.productRowDescription}>{product.description}</Text>
          <View style={styles.productMetaRow}><View style={styles.ratingRow}><AppIcon name="star" size={12} color={colors.goldDeep} /><Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text></View><Text style={styles.prepText}>{product.prepMinutes} min</Text></View>
          <View style={styles.productBottomRow}><Price value={product.price} /><Text style={[styles.availabilityText, product.availability === 'Sold out' && styles.soldOutText]}>{product.availability === 'Available' ? 'Available' : 'Sold out'}</Text></View>
        </View>
      </Pressable>
      {onQuickAdd && product.availability === 'Available' ? <Pressable accessibilityRole="button" accessibilityLabel={`Add ${product.name} to cart`} onPress={onQuickAdd} hitSlop={5} style={({ pressed }) => [styles.rowQuickAdd, pressed && styles.pressed]}><AppIcon name="plus" size={17} color={colors.ink} /></Pressable> : null}
    </View>
  );
}

export function QuantityStepper({ value, onChange, compact = false }: { value: number; onChange: (value: number) => void; compact?: boolean }) {
  return (
    <View style={[styles.stepper, compact && styles.stepperCompact]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Decrease quantity" onPress={() => onChange(value - 1)} hitSlop={6} style={styles.stepperButton}><AppIcon name="minus" size={15} color={colors.text} /></Pressable>
      <Text style={styles.stepperValue}>{value}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Increase quantity" onPress={() => onChange(value + 1)} hitSlop={6} style={styles.stepperButton}><AppIcon name="plus" size={15} color={colors.text} /></Pressable>
    </View>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const tone = status === 'Completed' ? styles.statusComplete : status === 'Cancelled' ? styles.statusCancelled : status === 'Ready' ? styles.statusReady : styles.statusActive;
  return <View style={[styles.statusBadge, tone]}><Text style={[styles.statusText, status === 'Completed' ? styles.statusCompleteText : status === 'Cancelled' ? styles.statusCancelledText : status === 'Ready' ? styles.statusReadyText : styles.statusActiveText]}>{status}</Text></View>;
}

export function OrderCard({ order, onPress }: { order: Order; onPress: () => void }) {
  const description = order.items.map((item) => `${item.quantity} × ${item.name}`).join(' · ');
  const date = new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`Order ${order.id}, ${order.status}, $${order.total.toFixed(2)}`} onPress={onPress} style={({ pressed }) => [styles.orderCard, pressed && styles.pressed]}>
      <View style={styles.orderTopRow}><View><Text style={styles.orderNumber}>{order.id}</Text><Text style={styles.orderDate}>{date}</Text></View><StatusBadge status={order.status} /></View>
      <View style={styles.orderDivider} />
      <Text numberOfLines={1} style={styles.orderItems}>{description}</Text>
      <View style={styles.orderBottomRow}><Text style={styles.orderEta}>{order.eta}</Text><Text style={styles.orderTotal}>{`$${order.total.toFixed(2)}`}</Text></View>
    </Pressable>
  );
}

export function EmptyState({ icon = 'bag', title, message, action }: { icon?: string; title: string; message: string; action?: ReactNode }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}><AppIcon name={icon} size={25} color={colors.goldDeep} /></View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyMessage}>{message}</Text>
      {action}
    </View>
  );
}

export function Field({ label, value, onChangeText, placeholder, keyboardType, multiline = false, secureTextEntry = false }: { label: string; value: string; onChangeText: (value: string) => void; placeholder?: string; keyboardType?: 'default' | 'email-address' | 'phone-pad'; multiline?: boolean; secureTextEntry?: boolean }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#A6A198" keyboardType={keyboardType} multiline={multiline} secureTextEntry={secureTextEntry} style={[styles.textField, multiline && styles.multilineField]} textAlignVertical={multiline ? 'top' : 'center'} />
    </View>
  );
}

export function Surface({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.surface, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.cream },
  screenContent: { flexGrow: 1, paddingBottom: 36 },
  contentWidth: { width: '100%', maxWidth: 760, alignSelf: 'center' },
  brandMark: { alignSelf: 'flex-start' },
  brandName: { color: colors.ink, fontSize: 20, fontWeight: '900', letterSpacing: 1.5 },
  brandNameLight: { color: colors.gold },
  brandCaption: { color: colors.muted, fontSize: 7, letterSpacing: 1.5, marginTop: 1, fontWeight: '700' },
  brandCaptionLight: { color: '#D6D0C4' },
  pageHeader: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.lg, gap: 5 },
  pageHeaderRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  pageTitle: { color: colors.text, fontSize: 27, fontWeight: '800', letterSpacing: -0.5 },
  pageSubtitle: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '800', letterSpacing: -0.25 },
  sectionAction: { color: colors.goldDeep, fontSize: 13, fontWeight: '700' },
  searchField: { minHeight: 50, paddingHorizontal: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchInput: { flex: 1, color: colors.text, fontSize: 14, paddingVertical: 10 },
  clearSearch: { color: colors.muted, fontSize: 22, paddingHorizontal: 4 },
  primaryButton: { minHeight: 50, borderRadius: radius.md, backgroundColor: colors.gold, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  primaryButtonText: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  secondaryButton: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  secondaryButtonText: { color: colors.text },
  disabledButton: { opacity: 0.5 },
  pressed: { opacity: 0.74 },
  choiceChip: { minHeight: 39, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  choiceChipSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  choiceChipText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  choiceChipTextSelected: { color: colors.gold },
  categoryEmoji: { fontSize: 14 },
  price: { color: colors.text, fontSize: 15, fontWeight: '800' },
  productCard: { width: 214, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, overflow: 'hidden', position: 'relative' },
  productCardHorizontal: { width: 230 },
  productImageWrap: { height: 142, overflow: 'hidden', backgroundColor: '#E6E0D6' },
  productImageWrapHorizontal: { height: 150 },
  productImage: { width: '100%', height: '100%' },
  imagePlaceholder: { ...StyleSheet.absoluteFillObject, backgroundColor: '#E6E0D6' },
  bestSellerBadge: { position: 'absolute', left: 10, top: 10, paddingHorizontal: 8, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: 'rgba(23,22,21,0.86)' },
  bestSellerText: { color: colors.gold, fontSize: 8, letterSpacing: 0.5, fontWeight: '800' },
  productCardBody: { padding: 12, gap: 5 },
  productCategory: { color: colors.goldDeep, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  productName: { color: colors.text, fontSize: 14, fontWeight: '800' },
  productMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { color: colors.text, fontSize: 11, fontWeight: '700' },
  prepText: { color: colors.muted, fontSize: 11 },
  productBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 },
  availabilityText: { color: colors.green, fontSize: 10, fontWeight: '700' },
  soldOutText: { color: colors.red },
  quickAdd: { position: 'absolute', right: 11, bottom: 55, width: 34, height: 34, borderRadius: 17, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  productRow: { minHeight: 126, flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  productRowMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 12 },
  productRowImage: { width: 94, height: 104, borderRadius: radius.md, backgroundColor: '#E6E0D6' },
  productRowCopy: { flex: 1, minWidth: 0, gap: 4 },
  productRowDescription: { color: colors.muted, fontSize: 10, lineHeight: 14 },
  rowQuickAdd: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center' },
  stepper: { height: 40, paddingHorizontal: 8, borderRadius: radius.pill, backgroundColor: colors.surfaceWarm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  stepperCompact: { height: 34, gap: 7, paddingHorizontal: 5 },
  stepperButton: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  stepperValue: { minWidth: 16, color: colors.text, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.pill, alignSelf: 'flex-start' },
  statusText: { fontSize: 10, fontWeight: '800' },
  statusComplete: { backgroundColor: colors.greenPale },
  statusCompleteText: { color: colors.green },
  statusActive: { backgroundColor: '#F5EBD9' },
  statusActiveText: { color: '#9A7139' },
  statusReady: { backgroundColor: colors.bluePale },
  statusReadyText: { color: colors.blue },
  statusCancelled: { backgroundColor: colors.redPale },
  statusCancelledText: { color: colors.red },
  orderCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 11 },
  orderTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  orderNumber: { color: colors.text, fontSize: 14, fontWeight: '800' },
  orderDate: { color: colors.muted, fontSize: 11, marginTop: 3 },
  orderDivider: { height: 1, backgroundColor: colors.line },
  orderItems: { color: colors.muted, fontSize: 12 },
  orderBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  orderEta: { color: colors.blue, fontSize: 11, fontWeight: '700' },
  orderTotal: { color: colors.text, fontSize: 15, fontWeight: '800' },
  emptyState: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.xl, alignItems: 'center', paddingHorizontal: 24, paddingVertical: 32, gap: 11 },
  emptyIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#F5EBD9', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '800', textAlign: 'center' },
  emptyMessage: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center', maxWidth: 280 },
  fieldWrap: { gap: 7 },
  fieldLabel: { color: colors.text, fontSize: 12, fontWeight: '700' },
  textField: { minHeight: 48, paddingHorizontal: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, color: colors.text, fontSize: 14 },
  multilineField: { minHeight: 88, paddingTop: 12 },
  surface: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 16 },
});
