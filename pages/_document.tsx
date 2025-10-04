import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head>
        {/* Removed custom window.ethereum redefinition to avoid conflicts with wallet extensions */}
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
