import React, { useRef, useState } from 'react';
import './App.css';

function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [results, setResults] = useState([]);
  const [ecoScore, setEcoScore] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setResults([]);
      setEcoScore(null);
      setOffers([]);
      setError('');
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    setError('');
    setResults([]);
    setEcoScore(null);
    setOffers([]);
    try {
      const formData = new FormData();
      formData.append('image', image);
      const res = await fetch('http://localhost:5050/analyze-image', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Image analysis failed');
      const data = await res.json();
      setResults(data.items || []);
      // Eco-score
      const ecoRes = await fetch('http://localhost:5050/eco-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: (data.items || []).map(i => i.name) })
      });
      if (!ecoRes.ok) throw new Error('Eco-score calculation failed');
      const ecoData = await ecoRes.json();
      setEcoScore(ecoData);
      // Offers
      const offersRes = await fetch(`http://localhost:5050/offers?points=${ecoData.points}`);
      if (!offersRes.ok) throw new Error('Failed to fetch offers');
      const offersData = await offersRes.json();
      setOffers(offersData.offers || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImage(null);
    setPreview(null);
    setResults([]);
    setEcoScore(null);
    setOffers([]);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="App">
      <header className="header">
        <h1>EcoScan <span role="img" aria-label="leaf">🌱</span></h1>
        <p className="subtitle">Scan your clothing, get your eco-score, and unlock green rewards!</p>
      </header>
      <section className="upload-section">
        <input
          type="file"
          accept="image/png, image/jpeg, image/jpg, image/bmp, image/gif"
          onChange={handleFileChange}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
        <button className="upload-btn" onClick={() => fileInputRef.current.click()}>
          {image ? 'Change Image' : 'Upload Image'}
        </button>
        {image && <button className="reset-btn" onClick={handleReset}>Reset</button>}
      </section>
      {preview && (
        <section className="preview-section">
          <h2>Image Preview</h2>
          <img src={preview} alt="Preview" className="preview-img" />
        </section>
      )}
      <section className="analyze-section">
        <button className="analyze-btn" onClick={handleAnalyze} disabled={!image || loading}>
          {loading ? 'Analyzing...' : 'Analyze Image'}
        </button>
      </section>
      {error && <div className="error-msg">{error}</div>}
      {ecoScore && (
        <section className="eco-score-box" aria-live="polite">
          <h2>Eco-Score Summary</h2>
          <div className="eco-score-details">
            <span><strong>Total Carbon:</strong> {ecoScore.totalCarbon} kg CO₂</span>
            <span><strong>Eco-Reward Points:</strong> {ecoScore.points}</span>
          </div>
        </section>
      )}
      {results.length > 0 && (
        <section className="item-section">
          <h2>Identified Items</h2>
          <div className="item-grid">
            {results.map((item, idx) => (
              <article className="item-card" key={idx} tabIndex={0} aria-label={`Item: ${item.name}`}>
                <h3>{item.name}</h3>
                <div className="item-prob">Probability: {(item.probability * 100).toFixed(1)}%</div>
                <div className="item-carbon">Carbon Score: {item.carbonScore} kg CO₂</div>
                <div className="item-desc">{item.description || 'No description available.'}</div>
              </article>
            ))}
          </div>
        </section>
      )}
      {offers.length > 0 && (
        <section className="offers-section">
          <h2>Available Offers</h2>
          <div className="offers-grid">
            {offers.map((offer) => (
              <div className="offer-card" key={offer.id} tabIndex={0} aria-label={`Offer: ${offer.name}`}>
                <h4>{offer.name}</h4>
                <div className="offer-points">Requires: {offer.points} pts</div>
                <div className="offer-desc">{offer.description || 'Eco-friendly reward!'}</div>
                <button className="redeem-btn" disabled={ecoScore && ecoScore.points < offer.points}>
                  {ecoScore && ecoScore.points >= offer.points ? 'Redeem' : 'Not enough points'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
      <footer className="footer">
        <small>EcoScan &copy; {new Date().getFullYear()} &mdash; Built for a greener future 🌍</small>
      </footer>
    </div>
  );
}

export default App;
