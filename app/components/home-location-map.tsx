'use client'

import { useEffect, useState } from 'react'

type GeoPoint = [number, number]

type GeoJsonGeometry =
  | {
      type: 'Polygon'
      coordinates: GeoPoint[][]
    }
  | {
      type: 'MultiPolygon'
      coordinates: GeoPoint[][][]
    }

type GeoJsonFeature = {
  properties?: {
    adcode?: number
    name?: string
  }
  geometry?: GeoJsonGeometry
}

type GeoJsonFeatureCollection = {
  features?: GeoJsonFeature[]
}

type ProvincePath = {
  adcode: number
  name: string
  d: string
}

type CityPath = {
  id: string
  name: string
  d: string
}

type MapState = {
  provinces: ProvincePath[]
  guangdongPath: string
  cityPaths: CityPath[]
}

function buildProjector(features: GeoJsonFeature[], width: number, height: number, padding: number) {
  if (!features.length) {
    return ([lon, lat]: GeoPoint) => [lon, lat] as const
  }

  let minLon = Number.POSITIVE_INFINITY
  let maxLon = Number.NEGATIVE_INFINITY
  let minLat = Number.POSITIVE_INFINITY
  let maxLat = Number.NEGATIVE_INFINITY

  const updateBounds = ([lon, lat]: GeoPoint) => {
    minLon = Math.min(minLon, lon)
    maxLon = Math.max(maxLon, lon)
    minLat = Math.min(minLat, lat)
    maxLat = Math.max(maxLat, lat)
  }

  features.forEach((feature) => {
    const geometry = feature.geometry

    if (!geometry) {
      return
    }

    if (geometry.type === 'Polygon') {
      geometry.coordinates.forEach((ring) => ring.forEach(updateBounds))
      return
    }

    geometry.coordinates.forEach((polygon) => polygon.forEach((ring) => ring.forEach(updateBounds)))
  })

  const lonSpan = Math.max(0.000001, maxLon - minLon)
  const latSpan = Math.max(0.000001, maxLat - minLat)
  const innerWidth = width - padding * 2
  const innerHeight = height - padding * 2
  const scale = Math.min(innerWidth / lonSpan, innerHeight / latSpan)
  const offsetX = (width - lonSpan * scale) / 2
  const offsetY = (height - latSpan * scale) / 2

  return ([lon, lat]: GeoPoint) => {
    const x = offsetX + (lon - minLon) * scale
    const y = offsetY + (maxLat - lat) * scale
    return [x, y] as const
  }
}

function geometryToPathData(geometry: GeoJsonGeometry, project: (point: GeoPoint) => readonly [number, number]) {
  const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates
  const paths: string[] = []

  polygons.forEach((polygon) => {
    polygon.forEach((ring) => {
      if (!ring.length) {
        return
      }

      const [firstX, firstY] = project(ring[0])
      let segment = `M ${firstX.toFixed(2)} ${firstY.toFixed(2)}`

      for (let index = 1; index < ring.length; index += 1) {
        const [x, y] = project(ring[index])
        segment += ` L ${x.toFixed(2)} ${y.toFixed(2)}`
      }

      segment += ' Z'
      paths.push(segment)
    })
  })

  return paths.join(' ')
}

function featuresToPathData(
  features: GeoJsonFeature[],
  project: (point: GeoPoint) => readonly [number, number]
) {
  return features
    .filter((feature): feature is GeoJsonFeature & { geometry: GeoJsonGeometry } => Boolean(feature.geometry))
    .map((feature) => geometryToPathData(feature.geometry, project))
    .join(' ')
}

function buildMapState(chinaPayload: GeoJsonFeatureCollection, guangdongPayload: GeoJsonFeatureCollection): MapState {
  const chinaFeatures = chinaPayload.features || []
  const guangdongFeatures = guangdongPayload.features || []
  const project = buildProjector(guangdongFeatures, 1200, 740, 10)

  const provinces: ProvincePath[] = chinaFeatures
    .filter(
      (feature): feature is GeoJsonFeature & { properties: { adcode: number; name: string }; geometry: GeoJsonGeometry } =>
        Boolean(feature.geometry && feature.properties?.adcode && feature.properties?.name)
    )
    .map((feature) => ({
      adcode: feature.properties.adcode,
      name: feature.properties.name,
      d: geometryToPathData(feature.geometry, project),
    }))

  const cityPaths = guangdongFeatures
    .filter((feature): feature is GeoJsonFeature & { geometry: GeoJsonGeometry } => Boolean(feature.geometry))
    .map((feature, index) => ({
      id: `gd-city-${index}`,
      name: feature.properties?.name || `City ${index + 1}`,
      d: geometryToPathData(feature.geometry, project),
    }))

  return {
    provinces,
    guangdongPath: featuresToPathData(guangdongFeatures, project),
    cityPaths,
  }
}

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

export function HomeLocationMap() {
  const [mapState, setMapState] = useState<MapState | null>(null)
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadMap() {
      try {
        const [chinaResponse, guangdongResponse] = await Promise.all([
          fetch('/maps/china-100000-full.json'),
          fetch('/maps/china-440000.json'),
        ])

        if (!chinaResponse.ok || !guangdongResponse.ok) {
          throw new Error('Map data request failed')
        }

        const [chinaPayload, guangdongPayload] = (await Promise.all([
          chinaResponse.json(),
          guangdongResponse.json(),
        ])) as [GeoJsonFeatureCollection, GeoJsonFeatureCollection]

        if (!cancelled) {
          setMapState(buildMapState(chinaPayload, guangdongPayload))
        }
      } catch {
        if (!cancelled) {
          setMapState({
            provinces: [],
            guangdongPath: '',
            cityPaths: [],
          })
        }
      }
    }

    loadMap()

    return () => {
      cancelled = true
    }
  }, [])

  if (!mapState) {
    return <HomeLocationMapLoading />
  }

  if (!mapState.provinces.length || !mapState.guangdongPath) {
    return (
      <div className="atlas-location-geo-canvas atlas-location-geo-canvas-fallback" aria-hidden="true">
        <div className="atlas-location-geo-overlay atlas-location-geo-overlay-fallback">
          <div className="atlas-location-geo-skeleton atlas-location-geo-skeleton-grid" />
          <div className="atlas-location-geo-skeleton atlas-location-geo-skeleton-highlight atlas-location-geo-skeleton-highlight-fallback" />
        </div>
      </div>
    )
  }

  return (
    <div
      className="atlas-location-geo-canvas atlas-location-geo-canvas-ready"
      data-hovered={isHovered ? 'true' : 'false'}
      onPointerEnter={() => {
        setIsHovered(true)
      }}
      onPointerLeave={() => {
        setIsHovered(false)
      }}
    >
      <svg
        viewBox="0 0 1200 740"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Map of China with Guangdong as focus"
      >
        <g className="atlas-location-geo-provinces">
          {mapState.provinces.map((province) => (
            <path
              key={province.adcode}
              d={province.d}
              data-adcode={province.adcode}
              className="atlas-location-geo-province"
            >
              <title>{province.name}</title>
            </path>
          ))}
        </g>
        <path d={mapState.guangdongPath} className="atlas-location-geo-guangdong" />
        <g className="atlas-location-geo-city-lines">
          {mapState.cityPaths.map((city) => (
            <path key={city.id} d={city.d}>
              <title>{city.name}</title>
            </path>
          ))}
        </g>
      </svg>
      <div className="atlas-location-geo-overlay atlas-location-geo-overlay-ready" aria-hidden="true">
        <div className="atlas-location-geo-hover-glow" />
      </div>
    </div>
  )
}
