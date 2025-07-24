const express = require('express');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();
const upload = multer({ storage: multer.memoryStorage() });
const axios = require('axios');
const tf = require('@tensorflow/tfjs-node');
const mobilenet = require('@tensorflow-models/mobilenet');

console.log('Backend starting...');

let mobilenetModel = null;

// Load the model once at startup
async function loadModel() {
  console.log('Loading MobileNet model...');
  if (!mobilenetModel) {
    try {
      mobilenetModel = await mobilenet.load();
      console.log('MobileNet model loaded');
    } catch (err) {
      console.error('Error loading MobileNet model:', err);
    }
  }
}

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

// In-memory carbon scores (kg CO2)
const CARBON_SCORES = {
  'T-shirt': 5,
  'Jeans': 10,
  'Jacket': 15,
  'Dress': 8,
  'Sweater': 7,
  'Shorts': 4,
  'Skirt': 6,
  'Shirt': 5,
  'Socks': 1,
  'Shoes': 12,
  'Sarong': 4,
  'Pillowcase': 2,
  'Dupatta': 3,
  'Kurta': 6,
  'Blazer': 14,
  'Overskirt': 6,
  'Pajamas': 5,
  'Blouse': 4,
  'Scarf': 2,
  'Coat': 16,
  'Suit': 18,
  'Tunic': 5,
  'Leggings': 3
};

// In-memory offers
const OFFERS = [
  { id: 1, name: '10% Off Eco Store', points: 10 },
  { id: 2, name: 'Free Reusable Bag', points: 20 },
  { id: 3, name: 'Plant a Tree in Your Name', points: 30 },
  { id: 4, name: 'EcoScan Badge', points: 5 },
  { id: 5, name: 'Free Eco Tote Bag', points: 8 },
  { id: 6, name: 'Discount on Sustainable Brands', points: 15 },
  { id: 7, name: 'Donate to Ocean Cleanup', points: 25 },
  { id: 8, name: 'Eco-Friendly Water Bottle', points: 12 },
  { id: 9, name: 'Sustainable Fashion Webinar Pass', points: 18 },
  { id: 10, name: 'EcoScan Super Saver Badge', points: 3 }
];

// Add a mapping for class descriptions (expand as needed)
const CLASS_DESCRIPTIONS = {
  'T-shirt': 'A T-shirt is a style of fabric shirt named after the T shape of its body and sleeves. It is typically made of cotton fabric, has short sleeves, and is worn as casual wear or sportswear.',
  'Jeans': 'Jeans are sturdy trousers made from denim or dungaree cloth. They are a popular form of casual dress around the world and are known for their durability and comfort.',
  'Jacket': 'A jacket is a mid-stomach–length garment for the upper body. It typically has sleeves and fastens in the front or slightly on the side. Jackets are often worn for warmth or fashion.',
  'Dress': 'A dress is a one-piece garment for a woman or girl that covers the body and extends down over the legs. Dresses are available in many styles and lengths.',
  'Sweater': 'A sweater is a knitted garment typically with long sleeves, worn over the upper body for warmth.',
  'Shorts': 'Shorts are short trousers that reach only to the knees or thighs, commonly worn in warm weather or for sports.',
  'Skirt': 'A skirt is a woman’s outer garment fastened around the waist and hanging down around the legs, available in various lengths and styles.',
  'Shirt': 'A shirt is a cloth garment for the upper body, typically having a collar, sleeves, and a front opening.',
  'Socks': 'Socks are garments for the foot and lower part of the leg, providing comfort and warmth.',
  'Shoes': 'Shoes are footwear intended to protect and comfort the human foot while doing various activities.',
  'Sarong': 'A sarong is a large tube or length of fabric, often wrapped around the waist and worn in Southeast Asia, the Pacific islands, and parts of Africa.',
  'Pillowcase': 'A pillowcase is a removable cover for a pillow, typically made of cotton or linen and used for hygiene and decoration.',
  'Dupatta': 'A dupatta is a long scarf that is essential to many South Asian women’s suits and matches the wearer’s garments.',
  'Kurta': 'A kurta is a loose collarless shirt worn in many regions of South Asia, often paired with pajamas or leggings.',
  'Blazer': 'A blazer is a type of jacket resembling a suit jacket but cut more casually, often worn as part of a smart-casual outfit.',
  'Overskirt': 'An overskirt is a skirt worn over another skirt, often for decorative or modesty purposes.',
  'Pajamas': 'Pajamas are loose-fitting garments worn for sleeping or lounging, typically consisting of a top and trousers.',
  'Blouse': 'A blouse is a loose-fitting upper garment, typically with a collar, buttons, and sleeves, worn by women.',
  'Scarf': 'A scarf is a piece of fabric worn around the neck or head for warmth, sun protection, cleanliness, fashion, or religious reasons.',
  'Coat': 'A coat is a long outer garment worn for warmth or fashion, typically extending below the hips.',
  'Suit': 'A suit is a set of garments made from the same cloth, usually consisting of a jacket and trousers, and sometimes a vest.',
  'Tunic': 'A tunic is a loose garment, typically sleeveless and reaching to the wearer’s knees, as worn in ancient Greece and Rome.',
  'Leggings': 'Leggings are tight-fitting stretch trousers, typically worn by women or girls for exercise or as casual wear.'
};

// Use TensorFlow.js MobileNet for image recognition
async function recognizeClothingItemsWithTF(imageBuffer) {
  await loadModel();
  console.log('Decoding image buffer...');
  let imageTensor;
  try {
    imageTensor = tf.node.decodeImage(imageBuffer, 3);
  } catch (err) {
    console.error('Error decoding image buffer:', err);
    throw err;
  }
  console.log('Running model prediction...');
  let predictions;
  try {
    predictions = await mobilenetModel.classify(imageTensor, 3); // top 3
  } catch (err) {
    console.error('Error running model prediction:', err);
    imageTensor.dispose();
    throw err;
  }
  imageTensor.dispose();
  console.log('Predictions:', predictions);
  return predictions;
}

// POST /analyze-image
app.post('/analyze-image', upload.single('image'), async (req, res) => {
  console.log('--- /analyze-image called ---');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  if (!req.file) {
    console.error('No image uploaded');
    return res.status(400).json({ error: 'No image uploaded' });
  }
  console.log('File field:', req.file.fieldname);
  console.log('File originalname:', req.file.originalname);
  console.log('File mimetype:', req.file.mimetype);
  console.log('File size:', req.file.size);
  try {
    console.log('Received image for analysis, buffer size:', req.file.buffer.length);
    // Use TensorFlow.js MobileNet ONLY
    const predictions = await recognizeClothingItemsWithTF(req.file.buffer);
    console.log('Predicted items:', predictions);
    // Use partial matching for carbonScore, just like /eco-score
    const results = predictions.map(pred => {
      const name = pred.className;
      let matched = null;
      for (const key of Object.keys(CARBON_SCORES)) {
        if (name.toLowerCase().includes(key.toLowerCase())) {
          matched = key;
          break;
        }
      }
      const carbonScore = matched ? CARBON_SCORES[matched] : 0;
      const description = matched ? CLASS_DESCRIPTIONS[matched] : `No clothing description available for: ${name}`;
      return {
        name,
        probability: pred.probability,
        carbonScore,
        description
      };
    });
    // Calculate eco-score for recognized clothing items
    const clothingItems = results.filter(r => r.carbonScore > 0);
    let totalCarbon = 0;
    clothingItems.forEach(item => {
      totalCarbon += item.carbonScore;
    });
    const points = Math.floor(totalCarbon / 2);
    // If none are clothing, add a message and eco-score as zero
    if (clothingItems.length === 0) {
      return res.json({
        items: results,
        message: 'No recognizable clothing items found in the image.',
        ecoScore: { totalCarbon: 0, points: 0 }
      });
    }
    res.json({
      items: results,
      ecoScore: { totalCarbon, points }
    });
  } catch (err) {
    console.error('Error in /analyze-image:', err);
    res.status(500).json({ error: 'Image analysis failed: ' + err.message });
  }
});

// POST /eco-score
app.post('/eco-score', (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'No items provided' });
  }
  let totalCarbon = 0;
  for (const item of items) {
    // Try to find a matching clothing item by partial match
    let matched = null;
    for (const key of Object.keys(CARBON_SCORES)) {
      if (item.toLowerCase().includes(key.toLowerCase())) {
        matched = key;
        break;
      }
    }
    if (matched) {
      totalCarbon += CARBON_SCORES[matched];
    }
    // else skip unknown items (do not return error)
  }
  // 1 point per 2kg CO2 saved (arbitrary logic)
  const points = Math.floor(totalCarbon / 2);
  res.json({ totalCarbon, points });
});

// GET /offers
app.get('/offers', (req, res) => {
  const points = parseInt(req.query.points, 10);
  if (isNaN(points)) {
    return res.status(400).json({ error: 'Invalid points value' });
  }
  const available = OFFERS.filter(offer => offer.points <= points);
  res.json({ offers: available });
});

// GET /test
app.get('/test', (req, res) => {
  res.json({ message: 'Backend is reachable!' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`EcoScan backend running on port ${PORT}`);
});

module.exports = app;

// Force model load at startup for debugging
loadModel().catch(err => {
  console.error('Fatal error loading MobileNet model at startup:', err);
  process.exit(1);
}); 
