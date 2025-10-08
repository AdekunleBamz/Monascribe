import type { AppProps } from 'next/app'
import WalletConflictWarning from '../components/WalletConflictWarning'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <WalletConflictWarning />
      <style jsx global>{`
        .coin-logo {
          width: 40px !important;
          height: 40px !important;
          object-fit: contain !important;
        }
      `}</style>
      <Component {...pageProps} />
    </>
  )
}
