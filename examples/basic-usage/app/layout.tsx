import type { ReactNode } from 'react';
import { NeuronWebProvider } from '@omiron33/omi-neuron-web';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NeuronWebProvider config={{}}>{children}</NeuronWebProvider>
      </body>
    </html>
  );
}
