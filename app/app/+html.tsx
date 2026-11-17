import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * The HTML shell of the web build (web only; native ignores this file). It makes "Add to Home Screen" open Dual full screen:
 * manifest + standalone meta tags for Android/Chrome, apple-touch-icon and status bar tags for iOS Safari.
 * `viewport-fit=cover` lets the app draw under the notch; the app pads itself with the safe-area insets.
 */
export default function Root({ children }: PropsWithChildren) {
  // headNodes / bodyNodes carry the script and style tags of the export: leaving them out gives a blank page.
  const { bodyAttributes, bodyNodes, htmlAttributes, headNodes } = useServerDocumentContext();
  return (
    <html lang="en" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>Dual</title>
        <meta name="description" content="Duel a friend for 7 days to keep up a hobby." />
        <meta name="theme-color" content="#6e1023" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Dual" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <ScrollViewStyleReset />
        {/* No rubber-band scrolling or tap flash on the page itself; the app scrolls inside its own views. */}
        <style dangerouslySetInnerHTML={{ __html: 'html,body{overscroll-behavior:none;-webkit-tap-highlight-color:transparent;-webkit-text-size-adjust:100%}' }} />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}
