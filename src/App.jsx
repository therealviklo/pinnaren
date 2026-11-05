import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import './App.css'
import MapView from './MapView'

function App() {
  const { t, i18n } = useTranslation()
  // Image entry structure: { id, file, name, url }
  const [images, setImages] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [view, setView] = useState('upload') // 'upload' | 'map'
  const nextId = useRef(0)

  function handleChange(e) {
    const picked = Array.from(e.target.files)
    if (picked.length === 0) return

    const added = picked.map((file) => ({
      id: nextId.current++,
      file,
      name: file.name,
      url: URL.createObjectURL(file),
    }))

    setImages((prev) => [...prev, ...added])
    // Show the first of the newly added images
    setSelectedId(added[0].id)
    e.target.value = ''
  }

  function handleRemove(id) {
    const target = images.find((img) => img.id === id)
    if (target) URL.revokeObjectURL(target.url)

    const remaining = images.filter((img) => img.id !== id)
    setImages(remaining)
    if (selectedId === id) {
      setSelectedId(remaining.length > 0 ? remaining[0].id : null)
    }
  }
  
  function handleRename(id, name) {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, name } : img))
    )
  }

  // Free all preview URLs when the component unmounts
  const imagesRef = useRef(images)
  imagesRef.current = images
  useEffect(() => {
    return () => imagesRef.current.forEach((img) => URL.revokeObjectURL(img.url))
  }, [])

  const selected = images.find((img) => img.id === selectedId)

  if (view === 'map') {
    return <MapView image={selected} onBack={() => setView('upload')} />
  }

  return (
    <section>
      <label className="language-switcher">
        {t('language.label')}
        <select
          value={i18n.resolvedLanguage}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
        >
          <option value="sv">Svenska</option>
          <option value="en">English</option>
        </select>
      </label>

      <h1>{t('main.title')}</h1>

      <h2>{t('upload.title')}</h2>

      <label className="upload-button">
        {t('upload.choose')}
        <input type="file" accept="image/*" multiple onChange={handleChange} hidden />
      </label>

      {images.length > 0 && (
        <ul className="file-list">
          {images.map((img) => (
            <li key={img.id} className={img.id === selectedId ? 'selected' : ''}>
              <button type="button" className="file-select" onClick={() => setSelectedId(img.id)}>
                <img src={img.url} alt="" className="thumb" />
                <span>{img.name}</span>
              </button>
              <button
                type="button"
                className="file-remove"
                onClick={() => handleRemove(img.id)}
                aria-label={t('upload.remove', { name: img.name })}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div className="preview">
          <input
            type="text"
            value={selected.name}
            onChange={(e) => handleRename(selected.id, e.target.value)}
            onBlur={(e) => {
              // Fallback to original filename if empty
              if (!e.target.value.trim()) handleRename(selected.id, selected.file.name)
            }}
            aria-label={t('preview.name')}
          />
          <img src={selected.url} alt={t('preview.alt')} style={{ maxWidth: '300px' }} />
        </div>
      )}

      <div>
        <button type="button" onClick={() => setView('map')}>
          {t('main.open')}
        </button>
      </div>
    </section>
  )
}

export default App
