import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon, AppScreen, PageHeader, Surface } from '@/components/app-ui';
import { colors, radius, spacing } from '@/theme/colors';

const faqs = [
  { id: 'delivery', question: 'How long does delivery take?', answer: 'Most orders arrive in 25–35 minutes. Larger orders and busy dinner hours may take a little longer.' },
  { id: 'tracking', question: 'How can I follow my order?', answer: 'Open My Orders in the bottom menu and tap your active order to see its current status and delivery estimate.' },
  { id: 'address', question: 'Can I update my delivery address?', answer: 'Yes. Update your saved address from Profile before placing your next order.' },
  { id: 'payment', question: 'How do I pay?', answer: 'This demo supports mock payment choices only. Cash on delivery is selected by default; no real payment is collected.' },
  { id: 'allergies', question: 'Can I ask about ingredients?', answer: 'Please contact the restaurant before placing your order if you have allergies or ingredient questions.' },
];

export default function HelpScreen() {
  const [expanded, setExpanded] = useState<string | null>('delivery');
  return (
    <AppScreen contentStyle={styles.screen}>
      <PageHeader title="We’re here to help" subtitle="A few quick answers for a smoother meal." back />
      <View style={styles.content}>
        <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Frequently asked</Text><Text style={styles.sectionCaption}>Tap a question to see the answer.</Text></View>
        <View style={styles.faqList}>
          {faqs.map((faq) => {
            const open = expanded === faq.id;
            return (
              <Surface key={faq.id} style={styles.faqCard}>
                <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setExpanded(open ? null : faq.id)} style={styles.questionRow}>
                  <Text style={styles.question}>{faq.question}</Text><AppIcon name={open ? 'minus' : 'plus'} size={17} color={colors.goldDeep} />
                </Pressable>
                {open ? <Text style={styles.answer}>{faq.answer}</Text> : null}
              </Surface>
            );
          })}
        </View>

        <View style={styles.sectionHead}><Text style={styles.sectionTitle}>Talk to our team</Text><Text style={styles.sectionCaption}>We’re happy to help with your visit or order.</Text></View>
        <Surface style={styles.contactCard}>
          <View style={styles.contactRow}><View style={styles.contactIcon}><AppIcon name="phone" size={17} color={colors.goldDeep} /></View><View><Text style={styles.contactLabel}>Call the restaurant</Text><Text style={styles.contactValue}>+1 (212) 555-0184</Text></View></View>
          <View style={styles.divider} />
          <View style={styles.contactRow}><View style={styles.contactIcon}><AppIcon name="mail" size={17} color={colors.goldDeep} /></View><View><Text style={styles.contactLabel}>Email support</Text><Text style={styles.contactValue}>hello@burak.example</Text></View></View>
          <View style={styles.divider} />
          <View style={styles.contactRow}><View style={styles.contactIcon}><AppIcon name="clock" size={17} color={colors.goldDeep} /></View><View><Text style={styles.contactLabel}>Restaurant hours</Text><Text style={styles.contactValue}>Every day · 11:00 AM – 10:00 PM</Text></View></View>
        </Surface>
        <Text style={styles.note}>If an order arrives with an issue, please contact us as soon as you can so we can make it right.</Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 32 },
  content: { paddingHorizontal: spacing.xl, gap: 15 },
  sectionHead: { gap: 4 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  sectionCaption: { color: colors.muted, fontSize: 11, lineHeight: 16 },
  faqList: { gap: 8 },
  faqCard: { paddingVertical: 13, gap: 9 },
  questionRow: { minHeight: 23, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  question: { flex: 1, color: colors.text, fontSize: 12, fontWeight: '700' },
  answer: { color: colors.muted, fontSize: 11, lineHeight: 17, paddingRight: 16 },
  contactCard: { gap: 12 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  contactIcon: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#F5EBD9', alignItems: 'center', justifyContent: 'center' },
  contactLabel: { color: colors.muted, fontSize: 9, fontWeight: '700' },
  contactValue: { color: colors.text, fontSize: 11, fontWeight: '700', marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.line },
  note: { color: colors.muted, fontSize: 10, lineHeight: 15, textAlign: 'center', paddingHorizontal: 8 },
});
