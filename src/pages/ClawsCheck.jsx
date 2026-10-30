import { useState } from 'react';
import data from '../data/ClawsCheck.json';
import './ClawsCheck.css';

export default function ClawsCheck() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="clawscheck-page">
      <header className="clawscheck-header">
        <h1>ClawsCheck</h1>
        <p>Learn to recognise common nail conditions and what they may indicate about your health.</p>
      </header>

      <div className="clawscheck-grid">
        {data.map((item) => (
          <button
            key={item.id}
            className={`condition-card ${selected?.id === item.id ? 'condition-card--open' : ''}`}
            onClick={() => setSelected(selected?.id === item.id ? null : item)}
            aria-expanded={selected?.id === item.id}
          >
            <div className="card-image-wrap">
              <img
                src={item.image_link}
                alt={item.name}
                className="card-image"
                loading="lazy"
              />
              <div className="card-image-overlay" />
            </div>
            <div className="card-body">
              <h2 className="card-title">{item.name}</h2>
              <span className="card-caret">{selected?.id === item.id ? '▲' : '▼'}</span>
            </div>

            {selected?.id === item.id && (
              <div className="card-description" onClick={(e) => e.stopPropagation()}>
                <p>{item.description}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Disclaimer */}
      <p className="clawscheck-disclaimer">
        ⚕️ ClawsCheck is for informational purposes only. Always consult a dermatologist for a proper diagnosis.
      </p>
    </div>
  );
}
