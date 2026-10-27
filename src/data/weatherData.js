/**
 * Weather configurations and styling criteria for ClawsFit
 * Supports 5 key weather conditions: Sunny, Rainy, Chilly, Hot, Windy
 */

export const WEATHER_DATA = {
  sunny: {
    key: 'sunny',
    name: 'Sunny & Radiant',
    temp: '27°C (81°F)',
    tempValue: 27,
    icon: '☀️',
    summary: 'Clear blue skies, bright sunshine, moderate UV',
    humidity: '42%',
    wind: '12 km/h',
    badge: 'Sunlit Radiance',
    fabrics: 'Airy linen, crisp cotton poplin, and lightweight silk blends that breathe freely and reflect natural sunlight.',
    cautions: 'Avoid heavy synthetic polyesters and dark heat-trapping blacks during direct solar exposure.',
    reminder: "Don't forget UV-blocking sunglasses, SPF 50+ sunscreen, and a chic sun visor!"
  },
  rainy: {
    key: 'rainy',
    name: 'Rainy & Overcast',
    temp: '20°C (68°F)',
    tempValue: 20,
    icon: '🌧️',
    summary: 'Scattered downpours, wet sidewalks, overcast skies',
    humidity: '92%',
    wind: '18 km/h',
    badge: 'Wet Weather Advisory',
    fabrics: 'Water-repellent shells, treated leather footwear, and quick-drying performance technical fabrics.',
    cautions: 'Avoid delicate untreated suede, raw silk, and trailing wide hemlines that absorb puddle splashes.',
    reminder: 'Keep an umbrella, waterproof footwear, and a water-resistant shell on standby!'
  },
  chilly: {
    key: 'chilly',
    name: 'Chilly & Crisp',
    temp: '13°C (55°F)',
    tempValue: 13,
    icon: '❄️',
    summary: 'Brisk autumn chill, crisp morning air, low temperature',
    humidity: '52%',
    wind: '20 km/h',
    badge: 'Cool Temperature Advisory',
    fabrics: 'Thermal wool blends, plush cashmere knitwear, fleece-lined trousers, and insulated structured layers.',
    cautions: 'Avoid single-layer cotton garments and bare ankles that allow sudden chills to penetrate.',
    reminder: 'Layer up with an insulating knit sweater, warm booties, and a cozy scarf!'
  },
  hot: {
    key: 'hot',
    name: 'Hot & Humid',
    temp: '34°C (93°F)',
    tempValue: 34,
    icon: '🔥',
    summary: 'High UV index, solar heatwaves, heavy humid air',
    humidity: '76%',
    wind: '8 km/h',
    badge: 'Heatwave Alert',
    fabrics: 'Ultra-lightweight mulberry silk, open-weave raw linen, and breathable loose silhouettes.',
    cautions: 'Avoid tight restrictive synthetics, fleece, heavy denim, and closed insulated boots.',
    reminder: 'Hydrate constantly, wear open-toe breathable slides, and seek afternoon shade!'
  },
  windy: {
    key: 'windy',
    name: 'Windy & Gusty',
    temp: '18°C (64°F)',
    tempValue: 18,
    icon: '💨',
    summary: 'Turbulent crosswinds, blustery drafts, rustling foliage',
    humidity: '48%',
    wind: '38 km/h',
    badge: 'High Wind Advisory',
    fabrics: 'Structured wind-deflecting shells, vegan leather skirts, tapered trousers, and snug mock-neck knits.',
    cautions: 'Avoid ultra-loose billowing flared skirts or loose headwear that can flap wildly or blow away.',
    reminder: 'Choose windproof outerwear, secure your hair and accessories, and wear grounded sturdy shoes!'
  }
};
