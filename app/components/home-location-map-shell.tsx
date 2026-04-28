'use client'

import dynamic from 'next/dynamic'

const HomeLocationMap = dynamic(
  () => import('app/components/home-location-map').then((mod) => mod.HomeLocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="atlas-location-geo-canvas atlas-location-geo-canvas-loading" aria-hidden="true">
        <div className="atlas-location-geo-skeleton atlas-location-geo-skeleton-main" />
        <div className="atlas-location-geo-skeleton atlas-location-geo-skeleton-highlight" />
        <div className="atlas-location-geo-skeleton atlas-location-geo-skeleton-grid" />
      </div>
    ),
  }
)

export function HomeLocationMapShell() {
  return <HomeLocationMap />
}
