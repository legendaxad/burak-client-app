import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppScreen, BrandMark, Field, PageHeader, PrimaryButton, Surface } from '@/components/app-ui';
import { useAppData } from '@/context/app-context';
import { colors, spacing } from '@/theme/colors';

export default function MockProfileSetupScreen() {
  const { ready } = useAppData();
  if (!ready) return <AppScreen><PageHeader title="Your details" subtitle="Loading your local profile…" back /><View style={styles.loading}><ActivityIndicator color={colors.goldDeep} /></View></AppScreen>;
  return <ProfileSetupForm />;
}

function ProfileSetupForm() {
  const { customer, updateCustomer } = useAppData();
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [email, setEmail] = useState(customer.email);
  const [address, setAddress] = useState(customer.address);
  const [instructions, setInstructions] = useState(customer.instructions);
  const [error, setError] = useState('');

  const saveProfile = async () => {
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setError('Please add your name, phone number, and address.');
      return;
    }
    try {
      await updateCustomer({ name: name.trim(), phone: phone.trim(), email: email.trim(), address: address.trim(), instructions: instructions.trim() });
      router.back();
    } catch {
      setError('We couldn’t save these details. Please try again.');
    }
  };

  return (
    <AppScreen contentStyle={styles.screen}>
      <PageHeader title="Your details" subtitle="Save your favorites and make checkout quicker." back />
      <View style={styles.content}>
        <Surface style={styles.formCard}>
          <View style={styles.intro}><BrandMark /><Text style={styles.introText}>This is a local demo profile. No password or real account is required.</Text></View>
          <Field label="Full name" value={name} onChangeText={setName} placeholder="Your name" />
          <Field label="Phone number" value={phone} onChangeText={setPhone} placeholder="(555) 000-0000" keyboardType="phone-pad" />
          <Field label="Email (optional)" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" />
          <Field label="Saved delivery address" value={address} onChangeText={setAddress} placeholder="Street, city, apartment" />
          <Field label="Delivery instructions" value={instructions} onChangeText={setInstructions} placeholder="Gate code or delivery notes (optional)" multiline />
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          <PrimaryButton title="Save details on this device" onPress={() => void saveProfile()} icon="check" />
        </Surface>
        <Text style={styles.disclaimer}>Authentication is mocked. These details are only used to prefill local checkout.</Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingBottom: 32 },
  loading: { padding: 36, alignItems: 'center' },
  content: { paddingHorizontal: spacing.xl, gap: 11 },
  formCard: { gap: 13 },
  intro: { gap: 10, marginBottom: 2 },
  introText: { color: colors.muted, fontSize: 11, lineHeight: 17 },
  error: { color: colors.red, fontSize: 11, fontWeight: '700' },
  disclaimer: { color: colors.muted, fontSize: 10, lineHeight: 15, textAlign: 'center', paddingHorizontal: 10 },
});
