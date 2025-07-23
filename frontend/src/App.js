import React, { useRef, useState } from 'react';
import './App.css';

function App() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [items, setItems] = useState([]);
  const [totalCarbon, setTotalCarbon] = useState(null);
  const [points, setPoints] = useState(null);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef();
  const videoRef = useRef();
  const [cameraActive, setCameraActive] = useState(false);

  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
      setError('');
    }
  };

  // Handle camera capture
  const handleStartCamera = async () => {
    setCameraActive(true);
    setError('');
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    }
  };

  const handleCapture = () => {
    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    if (video) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext('2d').drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        setImage(blob);
        setPreview(URL.createObjectURL(blob));
        setCameraActive(false);
        // Stop camera
        if (video.srcObject) {
          video.srcObject.getTracks().forEach(track => track.stop());
        }
      }, 'image/jpeg');
    }
  };

  // Handle submit to backend
  const handleAnalyze = async () => {
    if (!image) {
      setError('Please upload or capture an image.');
      return;
    }
    setLoading(true);
    setError('');
    setItems([]);
    setTotalCarbon(null);
    setPoints(null);
    setOffers([]);
    try {
      // 1. Send image to backend
      const formData = new FormData();
      formData.append('image', image);
      console.log('Sending image to backend at http://localhost:5050/analyze-image');
      const res = await fetch('http://localhost:5050/analyze-image', {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Image analysis failed');
      const data = await res.json();
      setItems(data.items);
      // 2. Get eco-score
      const ecoRes = await fetch('http://localhost:5050/eco-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: data.items.map(i => i.name) })
      });
      if (!ecoRes.ok) throw new Error('Eco-score calculation failed');
      const ecoData = await ecoRes.json();
      setTotalCarbon(ecoData.totalCarbon);
      setPoints(ecoData.points);
      // 3. Get offers
      const offersRes = await fetch(`http://localhost:5050/offers?points=${ecoData.points}`);
      if (!offersRes.ok) throw new Error('Offers retrieval failed');
      const offersData = await offersRes.json();
      setOffers(offersData.offers);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>EcoScan: Clothing Carbon Footprint</h1>
      <div className="upload-section">
        <input
          type="file"
          accept="image/png, image/jpeg, image/jpg, image/bmp, image/gif"
          onChange={handleFileChange}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
        <button onClick={() => fileInputRef.current.click()}>Upload Image</button>
        <span style={{ margin: '0 10px' }}>or</span>
        <button onClick={handleStartCamera}>Use Camera</button>
      </div>
      {cameraActive && (
        <div className="camera-section">
          <video ref={videoRef} autoPlay width={320} height={240} />
          <button onClick={handleCapture}>Capture</button>
        </div>
      )}
      {preview && (
        <div className="preview-section">
          <h3>Preview:</h3>
          <img src={preview} alt="Preview" className="preview-img" />
        </div>
      )}
      <div>
        <button onClick={handleAnalyze} disabled={loading} style={{ marginTop: 20 }}>
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>
      {error && <div className="error">{error}</div>}

      {/* Eco-Score Display */}
      {(totalCarbon !== null && points !== null) && (
        <div className="eco-score-box">
          <h2>Eco-Score</h2>
          <div>Total Carbon Score: <b>{totalCarbon} kg CO₂</b></div>
          <div>Eco-Reward Points: <b>{points}</b></div>
        </div>
      )}

      {/* Identified Items */}
      {items.length > 0 && (
        <div>
          <h2>Identified Items</h2>
          <div className="item-grid">
            {items.map((item, idx) => (
              <div className="item-card" key={idx}>
                <div className="item-name">{item.name}</div>
                <div>Probability: {(item.probability * 100).toFixed(1)}%</div>
                <div>Carbon Score: {item.carbonScore} kg CO₂</div>
                <div className="item-desc">{item.description}</div>
                {item.carbonScore === 0 && (
                  <div className="not-clothing">Not recognized as clothing</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Offers */}
      {offers.length > 0 && (
        <div>
          <h2>Offers You Can Redeem</h2>
          <div className="offers-grid">
            {offers.map((offer) => (
              <div className="offer-card" key={offer.id}>
                <div className="offer-name">{offer.name}</div>
                <div>Points Required: {offer.points}</div>
                <button className="redeem-btn" disabled={points < offer.points}>
                  Redeem
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
