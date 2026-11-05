import { useTranslation } from 'react-i18next'
import './MapView.css'

function MapView({ image, onBack }) {
  const { t } = useTranslation()

  return (
    <section className="map-view">
      <div className="map-viewport">
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
