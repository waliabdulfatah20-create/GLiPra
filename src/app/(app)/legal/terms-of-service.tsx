import type { LegalSection } from '@/components/legal/LegalDocScreen';

import * as React from 'react';
import { LegalDocScreen } from '@/components/legal/LegalDocScreen';

const SECTIONS: LegalSection[] = [
  {
    heading: '1. Who We Are',
    body: 'GLiPra is a mobile application operated by PHARMSTRONG, a Texas company. GLiPra provides GLP-1 medication companion features including nutrition tracking, weight logging, injection-cycle tracking, and educational pharmacist content.\n\nLegal and privacy inquiries: legal@glipra.com',
  },
  {
    heading: '2. Acceptance of Terms',
    body: 'By downloading, installing, creating an account, or using GLiPra, you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.\n\nYou must be at least 13 years old to use GLiPra. If you are under 18, you must have your parent or legal guardian\'s permission.',
  },
  {
    heading: '3. Medical and Clinical Disclaimer',
    body: 'GLIPRA IS NOT A MEDICAL DEVICE, CLINICAL SERVICE, OR SUBSTITUTE FOR PROFESSIONAL MEDICAL ADVICE.\n\nAll content (including pharmacist-authored tips, nutrition guidance, injection-cycle tracking, medication level estimates, readiness scores, and AI-generated responses) is educational in nature and does not constitute medical advice, diagnosis, or treatment.\n\nGLiPra is designed by a licensed pharmacist but is not your pharmacist and does not establish a pharmacist-patient relationship. Medication level estimates are mathematical approximations. Actual serum levels vary by individual metabolism, body composition, timing, and other factors.\n\nAlways consult your prescribing physician, pharmacist, or other qualified healthcare provider before making any changes to your medication, diet, or treatment plan.\n\nIN A MEDICAL EMERGENCY, CALL 911 IMMEDIATELY.',
  },
  {
    heading: '4. Account Registration',
    body: 'To access most features you must create an account. You agree to provide accurate information, maintain the security of your password, and accept responsibility for all activity under your account. Notify us immediately at legal@glipra.com if you suspect unauthorized access.',
  },
  {
    heading: '5. Subscription and Payment',
    body: 'GLiPra offers a free tier and a paid Pro subscription. Subscriptions are billed through the Apple App Store or Google Play Store. We do not directly store your payment card information.\n\nSubscriptions automatically renew at the end of each billing period unless you cancel before the renewal date through your Apple or Google account settings.\n\nWe may change subscription prices with at least 30 days\' notice. Refund eligibility is governed by Apple\'s or Google\'s refund policies.',
  },
  {
    heading: '6. User Content',
    body: 'You retain ownership of content you submit (meal photos, notes, logs). By submitting content you grant PHARMSTRONG a worldwide, non-exclusive, royalty-free license to host, store, process, and display your content solely to provide and improve the Service. This license terminates when you delete the content or your account.\n\nWhen you use the photo meal-analysis feature, your meal photo is transmitted to our servers and processed using third-party AI services. We do not use your meal photos to train AI models.',
  },
  {
    heading: '7. Acceptable Use',
    body: 'You agree not to: reverse engineer or decompile any part of the Service; access the Service by automated means without written permission; use the Service to transmit spam or unsolicited communications; attempt to gain unauthorized access to any connected system; or use the Service for any commercial purpose other than personal health tracking.',
  },
  {
    heading: '8. Intellectual Property',
    body: 'All software, design, text, graphics, logos, and other materials in the Service are owned by PHARMSTRONG or its licensors. You receive a limited, non-exclusive, non-transferable, revocable license to use the Service for personal, non-commercial use. Nothing in these Terms transfers any intellectual property rights to you.',
  },
  {
    heading: '9. Disclaimer of Warranties',
    body: 'TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. LEONAVA SPECIFICALLY DISCLAIMS ALL IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.\n\nHEALTH AND MEDICAL INFORMATION PROVIDED THROUGH THE SERVICE IS NOT WARRANTED TO BE ACCURATE, COMPLETE, OR SUITABLE FOR YOUR INDIVIDUAL SITUATION.',
  },
  {
    heading: '10. Limitation of Liability',
    body: 'TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, LEONAVA WILL NOT BE LIABLE FOR: (A) ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES; (B) ANY HEALTH OUTCOME, CLINICAL COMPLICATION, OR MEDICAL EVENT ARISING FROM YOUR USE OF OR RELIANCE ON THE SERVICE; OR (C) ANY DAMAGES ARISING FROM YOUR USE OF AI-GENERATED NUTRITIONAL ESTIMATES OR MEDICATION LEVEL APPROXIMATIONS.\n\nLEONAVA\'S TOTAL LIABILITY SHALL NOT EXCEED THE GREATER OF THE AMOUNT YOU PAID IN THE TWELVE MONTHS PRECEDING THE CLAIM OR $50.00.',
  },
  {
    heading: '11. Indemnification',
    body: 'You agree to indemnify and hold harmless PHARMSTRONG and its officers, directors, employees, agents, and licensors from claims, liabilities, damages, and fees (including reasonable attorneys\' fees) arising out of your violation of these Terms, your User Content, or your use of the Service in violation of applicable law.',
  },
  {
    heading: '12. Termination',
    body: 'These Terms remain in effect as long as you use the Service. We may suspend or terminate your access at any time for any reason. You may terminate your account at any time through the account-deletion process in the app or by contacting legal@glipra.com.',
  },
  {
    heading: '13. Governing Law',
    body: 'These Terms are governed by the laws of the State of Texas, without regard to conflict-of-law principles.',
  },
  {
    heading: '14. Dispute Resolution: Mandatory Arbitration',
    body: 'READ THIS SECTION CAREFULLY. IT AFFECTS YOUR LEGAL RIGHTS.\n\nBefore filing any formal claim, contact us at legal@glipra.com to try to resolve the dispute informally within 30 days.\n\nIf informal resolution fails, any dispute arising out of or relating to these Terms shall be resolved by binding individual arbitration administered by the American Arbitration Association (AAA) under its Consumer Arbitration Rules. Arbitration will be conducted remotely in English by a single arbitrator.\n\nCLASS ACTION WAIVER: YOU AND LEONAVA EACH WAIVE THE RIGHT TO A JURY TRIAL AND THE RIGHT TO PARTICIPATE IN A CLASS ACTION OR CLASS ARBITRATION. All claims must be brought on an individual basis.\n\nEXCEPTIONS: Small claims court actions and emergency injunctive relief are not subject to arbitration.\n\nOPT-OUT: You may opt out of this arbitration agreement by sending written notice to legal@glipra.com with the subject line "Arbitration Opt-Out" within 30 days of first accepting these Terms.',
  },
  {
    heading: '15. Changes to Terms',
    body: 'We may modify these Terms at any time. If we make material changes, we will notify you by in-app notification, email, or by updating the "Last updated" date. Continued use after the effective date constitutes acceptance.',
  },
  {
    heading: '16. General Provisions',
    body: 'These Terms, together with the Privacy Policy and any in-app disclosures, constitute the entire agreement between you and PHARMSTRONG. If any provision is found unenforceable it will be modified to the minimum extent necessary. You may not assign your rights without our written consent. We may assign our rights without restriction.',
  },
];

export default function TermsOfServiceScreen() {
  return (
    <LegalDocScreen
      title="Terms of Service"
      effectiveDate="Effective date: See glipra.com for current version"
      intro="IMPORTANT: These Terms contain a mandatory arbitration clause and class action waiver in Section 14. By using GLiPra you agree to resolve disputes by binding individual arbitration. See Section 14 for your 30-day opt-out right."
      sections={SECTIONS}
    />
  );
}
