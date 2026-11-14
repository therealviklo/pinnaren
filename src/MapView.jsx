import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useTranslation } from 'react-i18next'
import './MapView.css'

const MIN_ZOOM = 0.1
const MAX_ZOOM = 8

function MapView({ image, onBack }) {
  const { t } = useTranslation()
  const viewportRef = useRef(null)
  const canvasRef = useRef(null)
  const dragRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [size, setSize] = useState(null)
  const [zoom, setZoom] = useState(1)
  const zoomRef = useRef(1)

  useEffect(() => {
    const viewport = viewportRef.current
    function handleWheel(e) {
      e.preventDefault()
      const delta = e.deltaY * (e.deltaMode === 1 ? 33 : 1) * (e.ctrlKey ? 10 : 1)
      const oldZoom = zoomRef.current
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, oldZoom * Math.exp(-delta * 0.0015)))
      if (newZoom === oldZoom) return

      const canvas = canvasRef.current
      const viewportRect = viewport.getBoundingClientRect()
      const canvasRect = canvas.getBoundingClientRect()
      const mx = e.clientX - viewportRect.left
      const my = e.clientY - viewportRect.top
      const x = (e.clientX - canvasRect.left) / oldZoom
      const y = (e.clientY - canvasRect.top) / oldZoom

      zoomRef.current = newZoom
      flushSync(() => setZoom(newZoom)) // resize the canvas now so the scroll below isn't clamped
      viewport.scrollLeft = canvas.offsetLeft + x * newZoom - mx
      viewport.scrollTop = canvas.offsetTop + y * newZoom - my
    }
    viewport.addEventListener('wheel', handleWheel, { passive: false })
    return () => viewport.removeEventListener('wheel', handleWheel)
  }, [])

  function handlePointerDown(e) {
    if (e.pointerType === 'touch' || e.button !== 0) return
    const viewport = viewportRef.current
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
    }
    viewport.setPointerCapture(e.pointerId)
    setDragging(true)
  }

  function handlePointerMove(e) {
    const drag = dragRef.current
    if (!drag) return
    const viewport = viewportRef.current
    viewport.scrollLeft = drag.scrollLeft - (e.clientX - drag.x)
    viewport.scrollTop = drag.scrollTop - (e.clientY - drag.y)
  }

  function handlePointerUp(e) {
    if (!dragRef.current) return
    dragRef.current = null
    viewportRef.current.releasePointerCapture(e.pointerId)
    setDragging(false)
  }

  return (
    <section className="map-view">
      <div
        ref={viewportRef}
        className={`map-viewport${dragging ? ' is-dragging' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          ref={canvasRef}
          className="map-canvas"
          style={size ? { width: size.width * zoom, height: size.height * zoom } : undefined}
        >
          <div className="map-content" style={{ transform: `scale(${zoom})` }}>
            {image && (
              <img
                className="map-image"
                src={image.url}
                alt={image.name}
                draggable={false}
                onLoad={(e) => setSize({ width: e.target.naturalWidth, height: e.target.naturalHeight })}
              />
            )}
            {/* <div className="map-pin" style={{ left: 400, top: 250 }}>📍</div> */}
          </div>
        </div>
      </div>

      <button type="button" className="map-back" onClick={onBack}>
        {t('map.back')}
      </button>
    </section>
  )
}

export default MapView
