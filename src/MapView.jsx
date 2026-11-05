import { useTranslation } from 'react-i18next'

// image: { id, file, name, url } or undefined if nothing is selected
function MapView({ image, onBack }) {
  const { t } = useTranslation()

  return (
    <section>
      <button type="button" onClick={onBack}>
        {t('map.back')}
      </button>
      {image && <img src={image.url} alt={image.name} style={{ maxWidth: '100%' }} />}
    </section>
  )
}

export default MapView
