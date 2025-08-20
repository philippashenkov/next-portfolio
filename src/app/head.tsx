export default function Head() {
  return (
    <>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      {/* Early connection and texture preload for faster first render */}
      <link rel="preconnect" href="/" />
      <link rel="preload" as="fetch" href="/textures/earth-2k.ktx2" crossOrigin="anonymous" />
    </>
  );
}
