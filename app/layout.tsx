import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'नव-एस्ट्रो (NavaAstro) एआई प्लेटफ़ॉर्म',
  description: 'संपूर्ण स्वदेशी और स्वायत्त वैदिक ज्योतिष इंजन (100% Offline AI)',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="hi" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
