'use client'

import dynamic from 'next/dynamic'

function HomeLocationMapLoading() {
  return (
    <div className="atlas-location-geo-canvas atlas-location-geo-canvas-loading" aria-hidden="true">
      <div className="atlas-location-geo-overlay atlas-location-geo-overlay-loading">
        <div className="atlas-location-geo-skeleton atlas-location-geo-skeleton-grid" />
        <div className="atlas-location-geo-skeleton atlas-location-geo-skeleton-highlight" />
        <div className="atlas-location-geo-skeleton atlas-location-geo-skeleton-pulse" />
      </div>
    </div>
  )
}

const HomeLocationMap = dynamic(
  () => import('app/components/home-location-map').then((mod) => mod.HomeLocationMap),
  {
    ssr: false,
    loading: () => <HomeLocationMapLoading />,
  }
)

export function HomeLocationMapShell() {
  return <HomeLocationMap />
}
