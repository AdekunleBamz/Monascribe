import type { AppProps } from 'next/app'
import { useEffect } from 'react'

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Suppress wallet extension conflicts for clean console
    const originalError = console.error
    const originalLog = console.log
    
    console.error = (...args: any[]) => {
      const message = args.join(' ').toString()
      
      // Suppress wallet extension conflicts and bundler errors (keep real app errors visible)
      if (
        message.includes('Cannot redefine property: ethereum') ||
        message.includes('MetaMask encountered an error setting the global Ethereum provider') ||
        message.includes('Cannot set property ethereum') ||
        message.includes('Sender: Failed to get initial state') ||
        message.includes('Cannot access \'c\' before initialization') ||
        message.includes('eth_estimateUserOperationGas') ||
        message.includes('Method not found') ||
        message.includes('The message port closed before a response was received') ||
        message.includes('Could not establish connection. Receiving end does not exist') ||
        message.includes('dispatchMessage') ||
        message.includes('event>>>>>>>>') ||
        message.includes('Event captured:') ||
        message.includes('Event data sent to background') ||
        message.includes('content.js:1 event') ||
        message.includes('message.js:') ||
        message.includes('content.bundle.js:1') ||
        message.includes('Cannot read properties of null') ||
        message.includes('tagName') ||
        message.includes('Unchecked runtime.lastError')
      ) {
        return // Suppress these wallet and bundler conflicts
      }
      
      originalError.apply(console, args)
    }
    
    console.log = (...args: any[]) => {
      const message = args[0]?.toString() || ''
      
      // Suppress wallet extension log spam
      if (
        message.includes('dispatchMessage') ||
        message.includes('event>>>>>>>>') ||
        message.includes('Event captured:') ||
        message.includes('Event data sent to background') ||
        message.includes('content.js:1') ||
        message.includes('content.bundle.js:1')
      ) {
        return // Suppress wallet extension log spam
      }
      
      originalLog.apply(console, args)
    }
    
    // Cleanup
    return () => {
      console.error = originalError
      console.log = originalLog
    }
  }, [])

  return <Component {...pageProps} />
}
