import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import './MapView.css'

function MapView({ image, onBack }) {
  const { t } = useTranslation()
  const viewportRef = useRef(null)
  const dragRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  // Block wheel scrolling
  useEffect(() => {
    const viewport = viewportRef.current
    const blockWheel = (e) => e.preventDefault()
    viewport.addEventListener('wheel', blockWheel, { passive: false })
    return () => viewport.removeEventListener('wheel', blockWheel)
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
        <div className="map-canvas">
          {image && <img className="map-image" src={image.url} alt={image.name} draggable={false} />}
          {/* <div className="map-pin" style={{ left: 400, top: 250 }}>📍</div> */}
        </div>
      </div>

      <button type="button" className="map-back" onClick={onBack}>
        {t('map.back')}
      </button>
    </section>
  )
}

export default MapView
