/**
 * ClawsFit Gemini AI Stylist Service
 * 
 * Provides intelligent, weather-aware, and color-theory-driven outfit matching
 * using the Google Gemini API with flexible category parsing, fresh state lookup,
 * and zero-crash automatic fallback pieces.
 */

import { INITIAL_CLOSET } from '../data/initialCloset';

/**
 * Flexible, case-insensitive category normalizer.
 * Maps diverse user inputs ("shirt", "sweater", "pants", "sneakers", etc.)
 * into standardized luxury wardrobe categories: 'Tops' | 'Bottoms' | 'Shoes'.
 */
export function normalizeCategory(category = '', name = '', description = '') {
  const combined = `${category} ${name} ${description}`.toLowerCase();
  const catLower = (category || '').toLowerCase().trim();

  // Shoes / Footwear identifiers
  const shoeKeywords = [
    'shoe', 'shoes', 'boot', 'boots', 'sneaker', 'sneakers', 'heel', 'heels',
    'stiletto', 'stilettos', 'sandal', 'sandals', 'slide', 'slides', 'mule', 'mules',
    'loafer', 'loafers', 'flat', 'flats', 'footwear', 'clog', 'clogs', 'trainer', 'trainers',
    'pump', 'pumps', 'oxford'
  ];

  // Bottoms / Lower-body identifiers
  const bottomKeywords = [
    'bottom', 'bottoms', 'pant', 'pants', 'trouser', 'trousers', 'jean', 'jeans',
    'denim', 'skirt', 'skirts', 'short', 'shorts', 'culotte', 'culottes',
    'legging', 'leggings', 'slacks', 'sweatpant', 'sweatpants', 'cargo',
    'jogger', 'joggers', 'chino', 'chinos', 'midi', 'mini'
  ];

  // Tops / Upper-body identifiers
  const topKeywords = [
    'top', 'tops', 'shirt', 'shirts', 't-shirt', 'tee', 'tees', 'blouse', 'blouses',
    'sweater', 'sweaters', 'knit', 'knitwear', 'cardigan', 'cardigans', 'hoodie', 'hoodies',
    'jacket', 'jackets', 'coat', 'coats', 'outerwear', 'camisole', 'camisoles',
    'tank', 'tanks', 'vest', 'vests', 'pullover', 'pullovers', 'tunic', 'trench',
    'parka', 'blazer', 'blazers', 'crop', 'mock-neck', 'turtleneck'
  ];

  // 1. Direct category match
  if (shoeKeywords.some((k) => catLower === k || catLower.includes(k))) return 'Shoes';
  if (bottomKeywords.some((k) => catLower === k || catLower.includes(k))) return 'Bottoms';
  if (topKeywords.some((k) => catLower === k || catLower.includes(k))) return 'Tops';

  // 2. Fallback to name/description keywords if category was ambiguous
  if (shoeKeywords.some((k) => combined.includes(k))) return 'Shoes';
  if (bottomKeywords.some((k) => combined.includes(k))) return 'Bottoms';
  if (topKeywords.some((k) => combined.includes(k))) return 'Tops';

  return 'Tops';
}

export const isTop = (item) => normalizeCategory(item?.category, item?.name, item?.description) === 'Tops';
export const isBottom = (item) => normalizeCategory(item?.category, item?.name, item?.description) === 'Bottoms';
export const isShoe = (item) => normalizeCategory(item?.category, item?.name, item?.description) === 'Shoes';

/**
 * Intelligently infers weather suitability tags from item properties,
 * keywords in name/description, warmth level, and breathability.
 */
export function inferWeatherSuitability(item = {}) {
  const name = (item.name || '').toLowerCase();
  const desc = (item.description || '').toLowerCase();
  const cat = (item.category || '').toLowerCase();
  const text = `${name} ${desc} ${cat}`;

  const warmth = item.warmth || 'medium';
  const breathable = item.breathable !== false; // defaults to true if undefined

  const matched = new Set();

  // Keyword-based matching
  const rainyKeywords = [
    'rain', 'waterproof', 'water-repellent', 'water-resistant', 'repellent', 'resistant',
    'shell', 'chelsea', 'boot', 'boots', 'trench', 'parka', 'cargo', 'nylon', 'rubber',
    'puddle', 'storm', 'umbrella'
  ];
  const chillyKeywords = [
    'chilly', 'cold', 'frost', 'sweater', 'cardigan', 'knit', 'knitwear', 'wool',
    'cashmere', 'turtleneck', 'fleece', 'thermal', 'heavy', 'warm', 'coat', 'winter',
    'autumn', 'insulat', 'slacks', 'jacket', 'parka'
  ];
  const windyKeywords = [
    'wind', 'windbreaker', 'breeze', 'trench', 'leather', 'denim', 'cargo',
    'jacket', 'parka', 'trouser', 'trousers', 'combat', 'structured', 'mock-neck',
    'hoodie', 'gust', 'blazer'
  ];
  const hotKeywords = [
    'hot', 'summer', 'heat', 'linen', 'silk', 'camisole', 'tank', 'crop',
    'culotte', 'culottes', 'short', 'shorts', 'slide', 'slides', 'sandal', 'sandals',
    'sleeveless', 'airy', 'ventil', 'cool'
  ];
  const sunnyKeywords = [
    'sunny', 'sun', 'solar', 'light', 'linen', 'cotton', 'poplin', 'silk',
    'shirt', 'blouse', 'dress', 'skirt', 'tee', 't-shirt', 'sneaker', 'sneakers',
    'sandal', 'sandals', 'slides', 'mule', 'mules'
  ];

  if (rainyKeywords.some((k) => text.includes(k))) matched.add('rainy');
  if (chillyKeywords.some((k) => text.includes(k))) matched.add('chilly');
  if (windyKeywords.some((k) => text.includes(k))) matched.add('windy');
  if (hotKeywords.some((k) => text.includes(k))) matched.add('hot');
  if (sunnyKeywords.some((k) => text.includes(k))) matched.add('sunny');

  // Warmth & Breathability logic
  if (warmth === 'warm') {
    matched.add('chilly');
    matched.add('windy');
    matched.delete('hot'); // Heavy warm items should not be marked hot
  }

  if (warmth === 'light') {
    matched.add('hot');
    matched.add('sunny');
    matched.delete('chilly'); // Light items should not be marked chilly
  }

  if (breathable && warmth !== 'warm') {
    matched.add('sunny');
  }

  if (!breathable && warmth !== 'light') {
    matched.add('windy');
  }

  // Fallback defaults if nothing specific was inferred
  if (matched.size === 0) {
    if (warmth === 'warm') return ['chilly', 'windy'];
    if (warmth === 'light') return ['hot', 'sunny'];
    return ['sunny', 'windy'];
  }

  return Array.from(matched);
}

/**
 * Resolves an item's real weather suitability tags, automatically repairing
 * any items that were erroneously hardcoded to ['sunny'] during upload.
 */
export function resolveItemWeather(item = {}) {
  if (!item) return ['sunny'];

  const tags = Array.isArray(item.weatherSuitability) ? item.weatherSuitability : [];

  // Check if item was affected by the "only sunny" bug:
  // e.g. exactly 1 tag that is 'sunny', but it's a winter sweater, heavy knit, coat, boot, or warmth='warm'
  const text = `${item.name || ''} ${item.description || ''} ${item.category || ''}`.toLowerCase();
  const isErroneousSunny =
    tags.length === 1 &&
    tags[0] === 'sunny' &&
    (item.warmth === 'warm' ||
      /sweater|cardigan|coat|turtleneck|jacket|hoodie|wind|boot|fleece|wool|rain|waterproof|cargo|slacks|insulat|parka|combat/i.test(
        text
      ));

  if (tags.length === 0 || isErroneousSunny) {
    return inferWeatherSuitability(item);
  }

  return tags;
}

/**
 * Standard luxury fallback pieces used when a category is empty in user's wardrobe.
 */
export const DEFAULT_FALLBACK_TOP = INITIAL_CLOSET.find(isTop) || {
  id: 'fallback-top',
  name: 'Ivory Silk Camisole',
  category: 'Tops',
  color: '#fdf6f0',
  colorName: 'Ivory Cream',
  image: 'https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=500&auto=format&fit=crop&q=80',
  breathable: true,
  warmth: 'light',
  description: 'Classic minimalist top layer providing effortless elegance.'
};

export const DEFAULT_FALLBACK_BOTTOM = INITIAL_CLOSET.find(isBottom) || {
  id: 'fallback-bottom',
  name: 'Tailored Rose Trousers',
  category: 'Bottoms',
  color: '#c9919c',
  colorName: 'Dusty Rose',
  image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=500&auto=format&fit=crop&q=80',
  breathable: true,
  warmth: 'medium',
  description: 'Versatile tailored bottoms with flattering cut and drape.'
};

export const DEFAULT_FALLBACK_SHOES = INITIAL_CLOSET.find(isShoe) || {
  id: 'fallback-shoes',
  name: 'Classic Pearl White Sneakers',
  category: 'Shoes',
  color: '#ffffff',
  colorName: 'Pearl White',
  image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&auto=format&fit=crop&q=80',
  breathable: true,
  warmth: 'medium',
  description: 'Clean, comfortable footwear that coordinates with every silhouette.'
};

/**
 * Helper to retrieve Gemini API key from custom UI input, localStorage, or Vite env
 */
export function getGeminiApiKey() {
  try {
    const stored = localStorage.getItem('preptogo_gemini_api_key') || localStorage.getItem('clawson_gemini_api_key');
    if (stored && stored.trim()) {
      return stored.trim();
    }
  } catch (err) {
    console.warn('Could not read API key from localStorage:', err);
  }

  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey && envKey.trim() && envKey !== 'your_gemini_api_key_here') {
    return envKey.trim();
  }

  return '';
}

/**
 * Resolves fresh wardrobe pools with guaranteed fallback items for missing categories.
 */
function resolveWardrobePools(closetItems) {
  const safeItems = Array.isArray(closetItems) && closetItems.length > 0 ? closetItems : INITIAL_CLOSET;

  let tops = safeItems.filter(isTop);
  let bottoms = safeItems.filter(isBottom);
  let shoes = safeItems.filter(isShoe);

  let usedFallback = false;

  if (tops.length === 0) {
    tops = [DEFAULT_FALLBACK_TOP];
    usedFallback = true;
  }
  if (bottoms.length === 0) {
    bottoms = [DEFAULT_FALLBACK_BOTTOM];
    usedFallback = true;
  }
  if (shoes.length === 0) {
    shoes = [DEFAULT_FALLBACK_SHOES];
    usedFallback = true;
  }

  return { tops, bottoms, shoes, usedFallback };
}

/**
 * Intelligent Local Fallback Matcher (runs when API key is missing or network fails).
 * Analyzes weather tags, warmth, breathability, and color palettes to create a balanced fit.
 */
export function generateSmartLocalOutfit({ closetItems, weatherCondition, weatherInfo }) {
  const { tops, bottoms, shoes, usedFallback } = resolveWardrobePools(closetItems);

  // Filter or score candidates by weather suitability
  const filterByWeather = (items) => {
    // 1. Items with resolved weather tags (auto-heals single 'sunny' tags for warm items)
    const tagged = items.filter((item) => {
      const weathers = resolveItemWeather(item);
      return Array.isArray(weathers) && weathers.includes(weatherCondition);
    });
    if (tagged.length > 0) return tagged;

    // 2. Heuristic based on warmth / breathability
    if (weatherCondition === 'hot' || weatherCondition === 'sunny') {
      const breezy = items.filter((i) => i.warmth === 'light' || i.breathable);
      if (breezy.length) return breezy;
    } else if (weatherCondition === 'chilly') {
      const warm = items.filter((i) => i.warmth === 'warm' || !i.breathable);
      if (warm.length) return warm;
    } else if (weatherCondition === 'rainy' || weatherCondition === 'windy') {
      const resistant = items.filter((i) => i.warmth !== 'light');
      if (resistant.length) return resistant;
    }

    return items;
  };

  const candidateTops = filterByWeather(tops);
  const candidateBottoms = filterByWeather(bottoms);
  const candidateShoes = filterByWeather(shoes);

  // Pick top, bottom, shoes
  const top = candidateTops[Math.floor(Math.random() * candidateTops.length)];
  const bottom = candidateBottoms[Math.floor(Math.random() * candidateBottoms.length)];
  const shoe = candidateShoes[Math.floor(Math.random() * candidateShoes.length)];

  const weatherComments = {
    sunny: {
      score: 96,
      title: 'Sunlit Minimalist Elegance',
      advice: `Balancing the tone of ${top.name} with ${bottom.name}. Light hues diffuse solar warmth while ${shoe.name} ground the look with understated luxury.`,
      weatherVerdict: 'Breathable, lightweight construction lets air circulate freely under radiant sunlight.',
      nail: { shadeName: 'Rose Quartz Glaze', hex: '#e8bfb8', shape: 'almond' }
    },
    rainy: {
      score: 94,
      title: 'Protected Urban Chic',
      advice: `Pairing ${top.name} with structured ${bottom.name} ensures clean hemlines, while ${shoe.name} provide reliable traction on wet pavement.`,
      weatherVerdict: 'Engineered to handle overcast mist, puddles, and damp sidewalks without compromising aesthetic flair.',
      nail: { shadeName: 'Onyx Noir Gloss', hex: '#222222', shape: 'square' }
    },
    chilly: {
      score: 98,
      title: 'Luxe Insulated Harmony',
      advice: `The insulating structure of ${top.name} merges seamlessly with ${bottom.name}, elevated by the plush comfort of ${shoe.name}.`,
      weatherVerdict: 'Thermal-preserving layers lock in essential body heat against brisk cold snaps.',
      nail: { shadeName: 'Cabernet Velvet', hex: '#661d2d', shape: 'oval' }
    },
    hot: {
      score: 97,
      title: 'Breezy Heatwave Radiance',
      advice: `The effortless silhouette of ${top.name} harmonizes with breezy ${bottom.name}, finished with open-air comfort from ${shoe.name}.`,
      weatherVerdict: 'Ultra-cooling fabrics minimize thermal buildup during scorching afternoon heat.',
      nail: { shadeName: 'Champagne Shimmer', hex: '#c9a96e', shape: 'stiletto' }
    },
    windy: {
      score: 95,
      title: 'Sculpted Wind-Defying Silhouette',
      advice: `Tapered proportions of ${bottom.name} prevent billowing, complemented by the aerodynamic cut of ${top.name} and grounded ${shoe.name}.`,
      weatherVerdict: 'Wind-resistant weave keeps drafts at bay while maintaining clean sartorial lines.',
      nail: { shadeName: 'Emerald Chrome', hex: '#1f4e3b', shape: 'almond' }
    }
  };

  const template = weatherComments[weatherCondition] || weatherComments.sunny;

  return {
    outfit: {
      top,
      bottom,
      shoes: shoe,
      score: template.score,
      styleTitle: template.title,
      stylingAdvice: template.advice + (usedFallback ? ' (Includes staple wardrobe piece for missing category).' : ''),
      weatherSuitability: template.weatherVerdict,
      nailRecommendation: template.nail,
      source: 'local-fallback',
      weather: weatherInfo
    },
    isAi: false
  };
}

/**
 * Main Outfit Generator
 * Connects directly to Google Gemini API (gemini-2.5-flash / gemini-1.5-flash)
 * with flexible category matching, fresh state pools, and automatic fallback piece injection.
 */
export async function generateOutfitWithGemini({ closetItems, weatherCondition, weatherInfo, customKey }) {
  // 1. Resolve fresh wardrobe pools with automatic fallbacks for any missing category
  const { tops, bottoms, shoes, usedFallback } = resolveWardrobePools(closetItems);

  // Consolidated active pool including any injected fallbacks
  const activePool = [
    ...tops,
    ...bottoms.filter((b) => !tops.some((t) => t.id === b.id)),
    ...shoes.filter((s) => !tops.some((t) => t.id === s.id) && !bottoms.some((b) => b.id === s.id))
  ];

  const apiKey = (customKey || getGeminiApiKey()).trim();

  // If no API key is provided, execute intelligent local matching immediately
  if (!apiKey) {
    const fallbackResult = generateSmartLocalOutfit({ closetItems: activePool, weatherCondition, weatherInfo });
    return {
      ...fallbackResult,
      notice: ''
    };
  }

  // Build high-context prompt for Gemini personal stylist with normalized categories
  const closetSummary = activePool.map((item) => ({
    id: item.id,
    name: item.name,
    category: normalizeCategory(item.category, item.name, item.description),
    originalLabel: item.category,
    colorName: item.colorName,
    colorHex: item.color,
    warmth: item.warmth || 'medium',
    breathable: Boolean(item.breathable),
    weatherSuitability: resolveItemWeather(item),
    description: item.description || ''
  }));

  const systemPrompt = `You are an elite haute-couture personal fashion stylist and master color theorist for the luxury app "PrepToGo".
Analyze the user's available wardrobe pieces and current weather to assemble the single most flattering, cohesive 3-piece outfit.

Current Weather: ${weatherInfo.name} (${weatherInfo.temp})
Atmosphere: ${weatherInfo.summary}
Humidity: ${weatherInfo.humidity} | Wind: ${weatherInfo.wind}
Weather Styling Guidance: ${weatherInfo.fabrics}
Cautions: ${weatherInfo.cautions}

Available Digital Wardrobe Pieces:
${JSON.stringify(closetSummary, null, 2)}

Requirements:
1. Select exactly ONE Top ("topId"), ONE Bottom ("bottomId"), and ONE pair of Shoes ("shoesId") strictly using the provided item IDs.
2. Newly uploaded items from the user should be actively prioritized and matched if their color and style are suitable.
3. Evaluate Color Harmony: Ensure the color combination follows proven principles (monochromatic, analogous, complementary, or neutral-anchor).
4. Evaluate Weather Suitability: E.g., waterproof & puddle-safe for Rainy, airy & breathable for Hot/Sunny, insulating layers for Chilly, windproof & snug for Windy.
5. Recommend a matching Nail Styling (color hex, color name, nail shape) that completes this luxury aesthetic.

You MUST respond strictly with a valid JSON object formatted as follows:
{
  "topId": "<exact id of chosen Top>",
  "bottomId": "<exact id of chosen Bottom>",
  "shoesId": "<exact id of chosen Shoes>",
  "harmonyScore": <integer between 90 and 99>,
  "styleTitle": "<Creative high-fashion fit name, e.g. 'Effortless Parisian Minimalist'>",
  "stylingAdvice": "<2-3 sentences explaining color theory harmony, fabric textures, and silhouette balance>",
  "weatherSuitability": "<1-2 sentences explaining why this fit keeps the user comfortable in today's weather>",
  "nailRecommendation": {
    "shadeName": "<e.g. Dust Rose Gloss, Midnight Velvet>",
    "hex": "<hex color code, e.g. #c9919c>",
    "shape": "<oval | square | almond | stiletto>"
  }
}`;

  // Call Gemini API with model fallback
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
  let lastError = null;

  for (const model of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: systemPrompt }]
            }
          ],
          generationConfig: {
            temperature: 0.5,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error?.message || `HTTP ${response.status} ${response.statusText}`;
        throw new Error(message);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error('Gemini API returned an empty response.');
      }

      // Clean markdown code blocks if present
      let cleanJson = rawText.trim();
      if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
      }

      const parsed = JSON.parse(cleanJson);

      // Verify returned items exist in active wardrobe pool with flexible category matching
      let selectedTop = tops.find((i) => i.id === parsed.topId) || activePool.find((i) => i.id === parsed.topId && isTop(i));
      let selectedBottom = bottoms.find((i) => i.id === parsed.bottomId) || activePool.find((i) => i.id === parsed.bottomId && isBottom(i));
      let selectedShoes = shoes.find((i) => i.id === parsed.shoesId) || activePool.find((i) => i.id === parsed.shoesId && isShoe(i));

      // Safe automatic fallback if any ID was not resolved
      if (!selectedTop) selectedTop = tops[0];
      if (!selectedBottom) selectedBottom = bottoms[0];
      if (!selectedShoes) selectedShoes = shoes[0];

      return {
        outfit: {
          top: selectedTop,
          bottom: selectedBottom,
          shoes: selectedShoes,
          score: typeof parsed.harmonyScore === 'number' ? parsed.harmonyScore : 96,
          styleTitle: parsed.styleTitle || 'Haute Coordinated Ensemble',
          stylingAdvice: (parsed.stylingAdvice || 'Elegantly proportioned ensemble curated by Gemini AI.') + (usedFallback ? ' (Includes wardrobe staple for unstocked category).' : ''),
          weatherSuitability: parsed.weatherSuitability || 'Comfortably matched for current weather conditions.',
          nailRecommendation: parsed.nailRecommendation || {
            shadeName: selectedTop.colorName || 'Rose Blush',
            hex: selectedTop.color || '#e8bfb8',
            shape: 'almond'
          },
          source: 'gemini',
          modelUsed: model,
          weather: weatherInfo
        },
        isAi: true
      };
    } catch (err) {
      console.warn(`Attempt with ${model} failed:`, err.message);
      lastError = err;
    }
  }

  // If Gemini API calls failed, smoothly fall back to local styling without crashing
  console.warn('Gemini API request failed. Activating graceful local fallback:', lastError);
  const fallback = generateSmartLocalOutfit({ closetItems: activePool, weatherCondition, weatherInfo });
  return {
    ...fallback,
    notice: ''
  };
}
