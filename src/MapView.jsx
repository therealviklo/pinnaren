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
    const canvas = canvasRef.current

    // Zoom so that map point (x, y), in unzoomed image pixels, ends up at
    // client position (clientX, clientY).
    function zoomTo(newZoom, x, y, clientX, clientY) {
      newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom))
      const viewportRect = viewport.getBoundingClientRect()
      if (newZoom !== zoomRef.current) {
        zoomRef.current = newZoom
        flushSync(() => setZoom(newZoom)) // resize the canvas now so the scroll below isn't clamped
      }
      viewport.scrollLeft = canvas.offsetLeft + x * newZoom - (clientX - viewportRect.left)
      viewport.scrollTop = canvas.offsetTop + y * newZoom - (clientY - viewportRect.top)
    }

    function mapPoint(clientX, clientY) {
      const canvasRect = canvas.getBoundingClientRect()
      return {
        x: (clientX - canvasRect.left) / zoomRef.current,
        y: (clientY - canvasRect.top) / zoomRef.current,
      }
    }

    function handleWheel(e) {
      e.preventDefault()
      const delta = e.deltaY * (e.deltaMode === 1 ? 33 : 1) * (e.ctrlKey ? 10 : 1)
      const oldZoom = zoomRef.current
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, oldZoom * Math.exp(-delta * 0.0015)))
      if (newZoom === oldZoom) return
      const { x, y } = mapPoint(e.clientX, e.clientY)
      zoomTo(newZoom, x, y, e.clientX, e.clientY)
    }

    let pinch = null

    function pinchInfo(touches) {
      const [a, b] = touches
      return {
        distance: Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY),
        cx: (a.clientX + b.clientX) / 2,
        cy: (a.clientY + b.clientY) / 2,
      }
    }

    function handleTouchStart(e) {
      if (e.touches.length !== 2) {
        pinch = null
        return
      }
      e.preventDefault()
      const { distance, cx, cy } = pinchInfo(e.touches)
      pinch = { distance, zoom: zoomRef.current, ...mapPoint(cx, cy) }
    }

    function handleTouchMove(e) {
      if (!pinch || e.touches.length !== 2) return
      e.preventDefault()
      const { distance, cx, cy } = pinchInfo(e.touches)
      zoomTo(pinch.zoom * (distance / pinch.distance), pinch.x, pinch.y, cx, cy)
    }

    function handleTouchEnd(e) {
      if (e.touches.length < 2) pinch = null
    }

    viewport.addEventListener('wheel', handleWheel, { passive: false })
    viewport.addEventListener('touchstart', handleTouchStart, { passive: false })
    viewport.addEventListener('touchmove', handleTouchMove, { passive: false })
    viewport.addEventListener('touchend', handleTouchEnd)
    viewport.addEventListener('touchcancel', handleTouchEnd)
    return () => {
      viewport.removeEventListener('wheel', handleWheel)
      viewport.removeEventListener('touchstart', handleTouchStart)
      viewport.removeEventListener('touchmove', handleTouchMove)
      viewport.removeEventListener('touchend', handleTouchEnd)
      viewport.removeEventListener('touchcancel', handleTouchEnd)
    }
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
