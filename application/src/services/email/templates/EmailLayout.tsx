import * as React from 'react';
import { Html, Head, Preview, Section, Text } from '@react-email/components';

/**
 * Parent email layout component for transactional emails.
 * Renders the main title and wraps the provided children as content.
 */
export function EmailLayout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Section style={{ background: '#0061EB', padding: '32px 0' }}>
        <Text style={{ color: '#fff', fontSize: '24px', textAlign: 'center', margin: 0 }}>
          SeaStocks - {title}
        </Text>
      </Section>
      {children}
    </Html>
  );
}
