'use client'

import Script from 'next/script'

export default function AmapLoader() {
  return (
    <>
      {/* 高德地图安全密钥 - 必须在地图 API 之前加载 */}
      <Script
        id="amap-security"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window._AMapSecurityConfig = {
              securityJsCode: '${process.env.NEXT_PUBLIC_AMAP_SECRET || ''}'
            };
          `,
        }}
      />
      {/* 高德地图 API */}
      <Script
        src={`https://webapi.amap.com/maps?v=2.0&key=${process.env.NEXT_PUBLIC_AMAP_KEY}`}
        strategy="beforeInteractive"
      />
    </>
  )
}