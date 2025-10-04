import type { AppProps } from 'next/app'
import WalletConflictWarning from '../components/WalletConflictWarning'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <WalletConflictWarning />
      <Component {...pageProps} />
    </>
  )
}
