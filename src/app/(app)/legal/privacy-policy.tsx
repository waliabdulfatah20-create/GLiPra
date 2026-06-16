import type { LegalSection } from '@/components/legal/LegalDocScreen';

import * as React from 'react';
import { LegalDocScreen } from '@/components/legal/LegalDocScreen';

const SECTIONS: LegalSection[] = [
  {
    heading: '1. Who We Are',
    body: 'GLiPra is operated by Leonava, a Texas company. We are the controller of the personal information described in this Privacy Policy.\n\nPrivacy inquiries and data requests: legal@glipra.com',
  },
  {
    heading: '2. Information We Collect',
    body: 'We collect information you provide directly:\n\n• Account information: name, email address, password\n• Health profile: height, starting weight, activity level, health goals\n• Medication data: GLP-1 medication type, dosage strength, injection schedule\n• Injection logs: date, time, injection site, dose administered\n• Weight logs: date and weight measurement\n• Symptom logs: reported symptoms and severity\n• Meal data: food items, meal photos, nutritional estimates\n• Notes: free-text notes you add to logs\n\nWe also collect automatically:\n\n• Device information (model, OS version, app version)\n• Usage data (screens viewed, features used, crash logs)\n• Anonymous analytics identifiers: not your name or email\n\nWe do not collect your payment card details (handled by Apple or Google) or your precise GPS location.',
  },
  {
    heading: '3. How We Use Your Information',
    body: 'We use your information to:\n\n• Create and manage your account\n• Calculate your protein floor and daily nutrition targets\n• Track your injection cycle and estimate medication levels\n• Generate AI-assisted meal analyses when you use the photo feature (meal photos are transmitted to our servers, analyzed, and not used to train AI models)\n• Send injection reminders and phase-based guidance\n• Display progress charts and streak history\n• Identify symptoms that may warrant prescriber follow-up\n• Improve the Service using aggregated, de-identified analytics\n• Comply with applicable law\n\nAI prompts contain only anonymized, non-identifying context. We never send your name, email address, or other identifying information to our AI providers.',
  },
  {
    heading: '4. How We Share Your Information',
    body: 'We do not sell your personal information. We do not share your information for third-party advertising.\n\nWe share data only with service providers (subprocessors) who help us operate the Service under written data processing agreements, including:\n\n• Supabase: database, authentication, storage (US)\n• OpenAI: AI meal analysis and guidance, anonymized prompts only (US)\n• RevenueCat: subscription management (US)\n• PostHog: product analytics, no health data (US)\n• Sentry: crash reporting, no health data (US)\n• Apple / Google: app distribution and payments\n\nWe may also disclose information when required by law, in connection with a business transfer, or with your explicit consent.',
  },
  {
    heading: '5. Data Retention',
    body: 'We retain your data for as long as your account is active. When you delete your account, we initiate deletion within 30 days.\n\n• Health logs: retained for the duration of your account, deleted within 30 days of account deletion\n• Meal photos: deleted after AI analysis is returned (within 24 hours)\n• Anonymized analytics: up to 2 years in non-identifiable form\n• Crash logs: 90 days',
  },
  {
    heading: '6. Data Security',
    body: 'We implement industry-standard security measures including:\n\n• TLS 1.2+ encryption for all data in transit\n• Encryption at rest in our database\n• Row-level security: your data is inaccessible to other users at the database level\n• Access controls restricting employee access to production data\n\nNo system is completely secure. We will notify you of any breach as required by applicable law.',
  },
  {
    heading: '7. Washington Residents: My Health My Data Act',
    body: 'If you are a Washington state resident, the Washington My Health My Data Act (WMHMD Act) applies to your weight measurements, medication data, injection records, and symptom reports.\n\nWe use this data solely to provide the Service to you. We do not sell consumer health data.\n\nYour rights under the WMHMD Act:\n• Access: confirm whether we collect your health data and obtain a copy\n• Deletion: request deletion of your health data\n• Withdraw consent: withdraw previously granted consent\n• List of sharing: obtain a list of third parties with whom we shared your health data\n\nTo exercise these rights, email legal@glipra.com with subject "Washington Health Data Rights Request." We will respond within 45 days and may verify your identity before processing.',
  },
  {
    heading: '8. California Residents: CCPA / CPRA',
    body: 'California residents have the following rights:\n\n• Know what personal information we collect, use, and disclose\n• Delete personal information we hold about you\n• Correct inaccurate personal information\n• Opt out of sale or sharing: we do not sell or share personal information for targeted advertising\n• Limit use of sensitive personal information: we use health data only to provide the Service\n• Non-discrimination for exercising your rights\n\nWe have not sold personal information in the past 12 months. To submit a request, email legal@glipra.com. We will respond within 45 days.',
  },
  {
    heading: '9. Texas Residents: TDPSA',
    body: 'Texas residents have the right to access, correct, delete, and obtain a portable copy of their personal data, and to opt out of the sale of personal data and targeted advertising. We do not sell personal data or use it for targeted advertising.\n\nTo exercise these rights, email legal@glipra.com. We will respond within 45 days. If we deny your request you may appeal by emailing legal@glipra.com with "TDPSA Appeal" in the subject line.',
  },
  {
    heading: '10. Children\'s Privacy',
    body: 'GLiPra is not directed to children under 13. We do not knowingly collect personal information from children under 13. Users aged 13-17 must have parental or guardian consent to use the Service.\n\nIf you believe your child under 13 has provided us with personal information, contact legal@glipra.com and we will delete it.',
  },
  {
    heading: '11. Your Choices',
    body: 'Account information: Review and update in the app under Settings.\n\nAccount deletion: Delete your account through the account-deletion feature in the app or by contacting legal@glipra.com.\n\nPush notifications: Opt out through your device\'s notification settings or Settings > Notifications.\n\nHealth integrations: Revoke Apple Health or Google Health Connect access through your device\'s privacy settings at any time.',
  },
  {
    heading: '12. Third-Party Services',
    body: 'The Service integrates with Apple Health (iOS) and Google Health Connect (Android) at your option. Data from these services is governed by Apple\'s and Google\'s privacy policies. Downloads and purchases through the App Store or Google Play are also governed by their respective policies.',
  },
  {
    heading: '13. Changes to This Policy',
    body: 'We may update this Privacy Policy from time to time. If we make material changes, we will notify you by in-app notification, email, or by updating the "Last updated" date. Continued use after the effective date constitutes acceptance.',
  },
  {
    heading: '14. Contact Us',
    body: 'For privacy inquiries or to exercise any rights described in this Policy:\n\nEmail: legal@glipra.com\n\nWe aim to respond to all privacy inquiries within 30 days.',
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <LegalDocScreen
      title="Privacy Policy"
      effectiveDate="Effective date: See glipra.com for current version"
      intro="This policy explains what personal information GLiPra collects, how we use it, and your rights. We collect health-related data including weight, medication, and injection history. We do not sell your data."
      sections={SECTIONS}
    />
  );
}
