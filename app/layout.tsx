import '@livekit/components-styles';
import '@livekit/components-styles/prefabs';
import '../styles/participant-tile.css';
import '../styles/globals.css';
import type { Metadata, Viewport } from 'next';
import Providers from './providers/providers';

export const metadata: Metadata = {
  title: {
    default: 'Sphinx Meet',
    template: '%s',
  },
  description: 'Ideas have shapes',
  icons: {
    icon: {
      rel: 'icon',
      url: '/favicon.ico',
    },
    apple: [
      {
        rel: 'apple-touch-icon',
        url: '/images/livekit-apple-touch.png',
        sizes: '180x180',
      },
      { rel: 'mask-icon', url: '/images/livekit-safari-pinned-tab.svg', color: '#070707' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: '#070707',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
