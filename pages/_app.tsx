import { ChakraProvider } from '@chakra-ui/react';
import theme, { GlobalStyles } from '@livekit/livekit-chakra-theme';
import '@livekit/react-components/dist/index.css';
import type { AppProps } from 'next/app';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ChakraProvider theme={theme}>
      <GlobalStyles />
      <Component {...pageProps} />
    </ChakraProvider>
  );
}

export default MyApp;
