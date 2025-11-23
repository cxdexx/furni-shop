// seed/scripts/generate-listings.ts
// Maps 500-1000 images to realistic Nigerian furniture listings

import fs from 'fs/promises';
import path from 'path';
import { faker } from '@faker-js/faker';

interface ImageData {
  id: string;
  url: string;
  thumbnailUrl: string;
  category: string;
  tags: string[];
  color: string;
  source: string;
  photographer: string;
  photographerUrl: string;
}

interface Listing {
  id: string;
  title: string;
  slug: string;
  description: string;
  price_ngn: number;
  city: string;
  condition: 'new' | 'excellent' | 'good' | 'fair';
  materials: string[];
  dimensions: {
    length?: number;
    width?: number;
    height?: number;
    diameter?: number;
    unit: 'cm' | 'inches';
  };
  images: string[];
  category: string;
  tags: string[];
  producerId?: string;
  stock: number;
  featured: boolean;
  createdAt: string;
}

// Nigerian cities with furniture market presence
const NIGERIAN_CITIES = [
  'Lagos', 'Port Harcourt', 'Abuja', 'Ibadan', 'Kano',
  'Enugu', 'Aba', 'Onitsha', 'Kaduna', 'Warri',
  'Benin City', 'Jos', 'Abeokuta', 'Akure', 'Owerri'
];

// Realistic Nigerian price ranges by category (in NGN)
const PRICE_RANGES: Record<string, { min: number; max: number }> = {
  'sofa': { min: 45000, max: 350000 },
  'dining-table': { min: 55000, max: 280000 },
  'bed': { min: 38000, max: 185000 },
  'wardrobe': { min: 52000, max: 220000 },
  'desk': { min: 28000, max: 125000 },
  'outdoor': { min: 65000, max: 250000 },
  'storage': { min: 22000, max: 95000 },
  'chair': { min: 15000, max: 85000 },
  'coffee-table': { min: 18000, max: 78000 },
  'entertainment': { min: 25000, max: 110000 }
};

// Material options by category
const MATERIALS_BY_CATEGORY: Record<string, string[]> = {
  'sofa': ['leather', 'fabric', 'velvet', 'suede', 'microfiber'],
  'dining-table': ['wood', 'mahogany', 'iroko', 'oak', 'glass', 'marble'],
  'bed': ['wood', 'metal', 'upholstered', 'leather', 'velvet'],
  'wardrobe': ['wood', 'plywood', 'MDF', 'solid wood', 'laminate'],
  'desk': ['wood', 'metal', 'glass', 'engineered wood'],
  'outdoor': ['wicker', 'rattan', 'teak', 'aluminum', 'plastic'],
  'storage': ['wood', 'metal', 'bamboo', 'MDF'],
  'chair': ['wood', 'metal', 'fabric', 'leather', 'plastic'],
  'coffee-table': ['wood', 'glass', 'metal', 'marble', 'acrylic'],
  'entertainment': ['wood', 'MDF', 'glass', 'metal']
};

// Title templates by category
const TITLE_TEMPLATES: Record<string, string[]> = {
  'sofa': [
    '{adj} {material} {seater}-Seater Sofa',
    'Modern {material} {style} Sofa',
    '{adj} L-Shaped {material} Sectional',
    'Contemporary {material} Loveseat'
  ],
  'dining-table': [
    '{adj} {material} Dining Table ({seats} Seater)',
    '{material} {style} Dining Set',
    'Executive {material} Dining Table',
    'Round {material} Dining Table'
  ],
  'bed': [
    '{size} {material} Bed Frame',
    '{adj} {material} Platform Bed',
    '{material} {style} Bed with Storage',
    'Upholstered {size} Bed'
  ],
  'wardrobe': [
    '{doors}-Door {material} Wardrobe',
    '{adj} Sliding Wardrobe',
    '{material} {style} Armoire',
    'Walk-in Closet System'
  ],
  'desk': [
    '{adj} {material} Office Desk',
    'Executive {material} Writing Desk',
    '{style} Study Table',
    'Computer Desk with Storage'
  ],
  'outdoor': [
    '{material} Patio Set ({pieces}-Piece)',
    '{adj} Garden Furniture Set',
    'Outdoor Dining Set',
    '{material} Lounge Chair'
  ],
  'storage': [
    '{adj} {material} Bookshelf',
    '{shelves}-Tier Display Cabinet',
    'Storage Unit with Drawers',
    '{material} {style} Bookcase'
  ],
  'chair': [
    '{adj} {material} Accent Chair',
    '{style} Dining Chair (Set of {qty})',
    'Executive Office Chair',
    '{material} Recliner'
  ],
  'coffee-table': [
    '{adj} {material} Coffee Table',
    '{shape} {material} Side Table',
    'Nesting Tables (Set of {qty})',
    '{material} End Table'
  ],
  'entertainment': [
    '{adj} TV Stand for {size}" TVs',
    '{material} Media Console',
    '{style} Entertainment Center',
    'Floating TV Unit'
  ]
};

// Adjectives
const ADJECTIVES = [
  'Modern', 'Contemporary', 'Classic', 'Elegant', 'Luxury',
  'Minimalist', 'Rustic', 'Industrial', 'Scandinavian', 'Vintage',
  'Premium', 'Executive', 'Stylish', 'Sleek', 'Sophisticated'
];

class ListingGenerator {
  private images: ImageData[] = [];
  private usedImageIds = new Set<string>();
  
  async loadImages(): Promise<void> {
    const imagePath = path.join(__dirname, '../images/unsplash_urls.json');
    const data = await fs.readFile(imagePath, 'utf-8');
    const parsed = JSON.parse(data);
    this.images = parsed.images || [];
    console.log(`📂 Loaded ${this.images.length} images`);
  }
  
  // Generate realistic title
  generateTitle(category: string, material: string): string {
    const templates = TITLE_TEMPLATES[category] || ['{adj} {material} Furniture'];
    const template = faker.helpers.arrayElement(templates);
    
    return template
      .replace('{adj}', faker.helpers.arrayElement(ADJECTIVES))
      .replace('{material}', material)
      .replace('{style}', faker.helpers.arrayElement(['Modern', 'Classic', 'Contemporary']))
      .replace('{seater}', faker.helpers.arrayElement(['2', '3', '5', '7']))
      .replace('{seats}', faker.helpers.arrayElement(['4', '6', '8']))
      .replace('{size}', faker.helpers.arrayElement(['Queen', 'King', 'Twin', 'Full']))
      .replace('{doors}', faker.helpers.arrayElement(['2', '3', '4', '5']))
      .replace('{pieces}', faker.helpers.arrayElement(['3', '4', '5', '7']))
      .replace('{shelves}', faker.helpers.arrayElement(['3', '4', '5', '6']))
      .replace('{qty}', faker.helpers.arrayElement(['2', '4', '6']))
      .replace('{shape}', faker.helpers.arrayElement(['Round', 'Square', 'Rectangular', 'Oval']))
      .replace('{size}', faker.helpers.arrayElement(['32', '43', '50', '55', '65', '75']));
  }
  
  // Generate description with Nigerian context
  generateDescription(title: string, material: string, condition: string, city: string): string {
    const intros = [
      `Elevate your space with this ${title.toLowerCase()}.`,
      `Quality ${title.toLowerCase()} for your home or office.`,
      `Premium ${title.toLowerCase()} crafted with attention to detail.`,
      `Transform your living space with this beautiful ${title.toLowerCase()}.`
    ];
    
    const features = [
      `Made from high-quality ${material} for durability and style.`,
      `Features a ${condition} finish that complements any décor.`,
      `Sturdy construction designed to last for years.`,
      `Easy to clean and maintain.`,
      `Comfortable and functional design.`
    ];
    
    const delivery = [
      `Available for delivery within ${city} and surrounding areas.`,
      `Fast delivery available across ${city}.`,
      `Contact us for delivery options to your location in ${city}.`
    ];
    
    return [
      faker.helpers.arrayElement(intros),
      faker.helpers.arrayElements(features, faker.number.int({ min: 2, max: 3 })).join(' '),
      faker.helpers.arrayElement(delivery),
      'Meet the producer option available for local pickup.'
    ].join(' ');
  }
  
  // Generate realistic dimensions
  generateDimensions(category: string): Listing['dimensions'] {
    const dims: Record<string, any> = { unit: 'cm' };
    
    switch (category) {
      case 'sofa':
        dims.length = faker.number.int({ min: 160, max: 240 });
        dims.width = faker.number.int({ min: 80, max: 110 });
        dims.height = faker.number.int({ min: 75, max: 95 });
        break;
      case 'dining-table':
        dims.length = faker.number.int({ min: 140, max: 240 });
        dims.width = faker.number.int({ min: 80, max: 120 });
        dims.height = 75;
        break;
      case 'bed':
        dims.length = faker.number.int({ min: 190, max: 210 });
        dims.width = faker.number.int({ min: 140, max: 200 });
        dims.height = faker.number.int({ min: 40, max: 60 });
        break;
      case 'wardrobe':
        dims.width = faker.number.int({ min: 120, max: 250 });
        dims.height = faker.number.int({ min: 180, max: 220 });
        dims.width = faker.number.int({ min: 50, max: 70 });
        break;
      case 'desk':
        dims.length = faker.number.int({ min: 100, max: 160 });
        dims.width = faker.number.int({ min: 50, max: 80 });
        dims.height = 75;
        break;
      case 'chair':
        dims.width = faker.number.int({ min: 45, max: 70 });
        dims.height = faker.number.int({ min: 80, max: 110 });
        break;
      case 'coffee-table':
        dims.length = faker.number.int({ min: 80, max: 140 });
        dims.width = faker.number.int({ min: 50, max: 90 });
        dims.height = faker.number.int({ min: 40, max: 55 });
        break;
      default:
        dims.length = faker.number.int({ min: 80, max: 200 });
        dims.width = faker.number.int({ min: 40, max: 100 });
        dims.height = faker.number.int({ min: 40, max: 180 });
    }
    
    return dims;
  }
  
  // Generate single listing
  generateListing(images: ImageData[]): Listing {
    const category = images[0].category;
    const condition = faker.helpers.weightedArrayElement([
      { value: 'new', weight: 0.6 },
      { value: 'excellent', weight: 0.25 },
      { value: 'good', weight: 0.1 },
      { value: 'fair', weight: 0.05 }
    ]) as Listing['condition'];
    
    const materials = faker.helpers.arrayElements(
      MATERIALS_BY_CATEGORY[category] || ['wood', 'metal'],
      faker.number.int({ min: 1, max: 2 })
    );
    
    const primaryMaterial = materials[0];
    const title = this.generateTitle(category, primaryMaterial);
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + faker.string.alphanumeric(6);
    
    const city = faker.helpers.arrayElement(NIGERIAN_CITIES);
    const priceRange = PRICE_RANGES[category] || { min: 20000, max: 150000 };
    
    // Price influenced by condition
    const conditionMultipliers = { new: 1, excellent: 0.85, good: 0.65, fair: 0.45 };
    const basePrice = faker.number.int(priceRange);
    const price = Math.round(basePrice * conditionMultipliers[condition] / 1000) * 1000; // Round to nearest 1000
    
    const description = this.generateDescription(title, primaryMaterial, condition, city);
    
    // Mark as featured (10% chance)
    const featured = Math.random() < 0.1;
    
    return {
      id: faker.string.uuid(),
      title,
      slug,
      description,
      price_ngn: price,
      city,
      condition,
      materials,
      dimensions: this.generateDimensions(category),
      images: images.map(img => img.url),
      category,
      tags: [...new Set([...images[0].tags, category, ...materials, condition])],
      stock: faker.number.int({ min: 1, max: 8 }),
      featured,
      createdAt: faker.date.past({ years: 1 }).toISOString()
    };
  }
  
  // Group images into listings (1-5 images per listing)
  async generateAllListings(): Promise<void> {
    console.log('🏗️  Generating listings...\n');
    
    const listings: Listing[] = [];
    const imagesByCategory = this.images.reduce((acc, img) => {
      acc[img.category] = acc[img.category] || [];
      acc[img.category].push(img);
      return acc;
    }, {} as Record<string, ImageData[]>);
    
    // Process each category
    for (const [category, categoryImages] of Object.entries(imagesByCategory)) {
      console.log(`📦 ${category}: ${categoryImages.length} images`);
      
      let i = 0;
      const categoryListings: Listing[] = [];
      
      while (i < categoryImages.length) {
        // Randomly assign 1-5 images per listing
        const imagesPerListing = faker.number.int({ min: 1, max: Math.min(5, categoryImages.length - i) });
        const listingImages = categoryImages.slice(i, i + imagesPerListing);
        
        const listing = this.generateListing(listingImages);
        categoryListings.push(listing);
        
        i += imagesPerListing;
      }
      
      listings.push(...categoryListings);
      console.log(`   ✅ Generated ${categoryListings.length} listings`);
    }
    
    // Save output
    const output = {
      meta: {
        totalListings: listings.length,
        totalImages: this.images.length,
        categories: Object.keys(imagesByCategory),
        generatedAt: new Date().toISOString(),
        priceRange: {
          min: Math.min(...listings.map(l => l.price_ngn)),
          max: Math.max(...listings.map(l => l.price_ngn)),
          currency: 'NGN'
        }
      },
      listings
    };
    
    const outputPath = path.join(__dirname, '../data/listings_large.json');
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(output, null, 2));
    
    console.log(`\n✅ Generated ${listings.length} listings`);
    console.log(`💾 Saved to ${outputPath}`);
    
    // Category breakdown
    const byCategory = listings.reduce((acc, l) => {
      acc[l.category] = (acc[l.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    console.log('\n📊 Listings by Category:');
    Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .forEach(([cat, count]) => {
        console.log(`   ${cat.padEnd(20)} ${count} listings`);
      });
    
    console.log('\n💰 Price Statistics:');
    console.log(`   Lowest:  ₦${output.meta.priceRange.min.toLocaleString()}`);
    console.log(`   Highest: ₦${output.meta.priceRange.max.toLocaleString()}`);
    console.log(`   Average: ₦${Math.round(listings.reduce((sum, l) => sum + l.price_ngn, 0) / listings.length).toLocaleString()}`);
    
    console.log('\n✨ Ready to seed database: npm run seed:db');
  }
}

// CLI execution
async function main() {
  console.log('🪑 Furniture Listing Generator');
  console.log('==============================\n');
  
  const generator = new ListingGenerator();
  
  try {
    await generator.loadImages();
    await generator.generateAllListings();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();