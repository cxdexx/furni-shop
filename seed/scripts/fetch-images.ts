// seed/scripts/fetch-images.ts
// Fetches 500-1000 furniture images from Unsplash/Pexels with resumable progress

import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

interface ImageMetadata {
  id: string;
  url: string;
  thumbnailUrl: string;
  category: string;
  tags: string[];
  width: number;
  height: number;
  color: string;
  source: 'unsplash' | 'pexels';
  photographer: string;
  photographerUrl: string;
  license: string;
}

interface ProgressState {
  completed: number;
  lastCategory: string;
  images: ImageMetadata[];
}

// Furniture categories with search queries
const FURNITURE_CATEGORIES = [
  { category: 'sofa', queries: ['sofa', 'couch', 'sectional', 'loveseat'], target: 150 },
  { category: 'dining-table', queries: ['dining table', 'kitchen table', 'dining set'], target: 100 },
  { category: 'bed', queries: ['bed', 'bed frame', 'bedroom furniture'], target: 100 },
  { category: 'wardrobe', queries: ['wardrobe', 'closet', 'armoire'], target: 80 },
  { category: 'desk', queries: ['desk', 'office desk', 'study table'], target: 80 },
  { category: 'outdoor', queries: ['outdoor furniture', 'patio set', 'garden furniture'], target: 70 },
  { category: 'storage', queries: ['bookshelf', 'cabinet', 'storage unit'], target: 70 },
  { category: 'chair', queries: ['chair', 'accent chair', 'armchair'], target: 100 },
  { category: 'coffee-table', queries: ['coffee table', 'side table', 'end table'], target: 80 },
  { category: 'entertainment', queries: ['tv stand', 'media console', 'entertainment center'], target: 70 },
];

const PROGRESS_FILE = path.join(__dirname, '../images/progress.json');
const OUTPUT_FILE = path.join(__dirname, '../images/unsplash_urls.json');
const PEXELS_OUTPUT = path.join(__dirname, '../images/pexels_urls.json');

const UNSPLASH_API = 'https://api.unsplash.com';
const PEXELS_API = 'https://api.pexels.com/v1';

const RATE_LIMIT_DELAY = 1100; // Slightly over 1 second to be safe
const MAX_RETRIES = 3;

class ImageFetcher {
  private unsplashKey: string;
  private pexelsKey: string;
  private progress: ProgressState;
  
  constructor() {
    this.unsplashKey = process.env.UNSPLASH_ACCESS_KEY || '';
    this.pexelsKey = process.env.PEXELS_API_KEY || '';
    
    if (!this.unsplashKey && !this.pexelsKey) {
      throw new Error('At least one API key required: UNSPLASH_ACCESS_KEY or PEXELS_API_KEY');
    }
    
    this.progress = {
      completed: 0,
      lastCategory: '',
      images: []
    };
  }
  
  // Load existing progress
  async loadProgress(): Promise<void> {
    try {
      const data = await fs.readFile(PROGRESS_FILE, 'utf-8');
      this.progress = JSON.parse(data);
      console.log(`📂 Resuming from ${this.progress.completed} images...`);
    } catch (err) {
      console.log('🆕 Starting fresh fetch...');
      await fs.mkdir(path.dirname(PROGRESS_FILE), { recursive: true });
    }
  }
  
  // Save progress (resumable)
  async saveProgress(): Promise<void> {
    await fs.writeFile(PROGRESS_FILE, JSON.stringify(this.progress, null, 2));
  }
  
  // Fetch from Unsplash
  async fetchUnsplash(query: string, page: number, perPage: number = 30): Promise<ImageMetadata[]> {
    if (!this.unsplashKey) return [];
    
    let retries = 0;
    
    while (retries < MAX_RETRIES) {
      try {
        const response = await axios.get(`${UNSPLASH_API}/search/photos`, {
          params: {
            query,
            page,
            per_page: perPage,
            orientation: 'landscape',
            content_filter: 'high'
          },
          headers: {
            'Authorization': `Client-ID ${this.unsplashKey}`,
            'Accept-Version': 'v1'
          }
        });
        
        return response.data.results.map((img: any) => ({
          id: img.id,
          url: img.urls.regular,
          thumbnailUrl: img.urls.thumb,
          category: query,
          tags: img.tags?.map((t: any) => t.title) || [],
          width: img.width,
          height: img.height,
          color: img.color,
          source: 'unsplash' as const,
          photographer: img.user.name,
          photographerUrl: img.user.links.html,
          license: 'Unsplash License (free to use, attribution appreciated)'
        }));
      } catch (error: any) {
        retries++;
        if (error.response?.status === 429) {
          const waitTime = 60000; // Wait 1 minute on rate limit
          console.log(`⏳ Rate limited. Waiting ${waitTime / 1000}s...`);
          await this.sleep(waitTime);
        } else if (retries >= MAX_RETRIES) {
          console.error(`❌ Failed to fetch from Unsplash after ${MAX_RETRIES} retries:`, error.message);
          return [];
        }
        await this.sleep(2000 * retries); // Exponential backoff
      }
    }
    
    return [];
  }
  
  // Fetch from Pexels
  async fetchPexels(query: string, page: number, perPage: number = 30): Promise<ImageMetadata[]> {
    if (!this.pexelsKey) return [];
    
    let retries = 0;
    
    while (retries < MAX_RETRIES) {
      try {
        const response = await axios.get(`${PEXELS_API}/search`, {
          params: {
            query,
            page,
            per_page: perPage,
            orientation: 'landscape'
          },
          headers: {
            'Authorization': this.pexelsKey
          }
        });
        
        return response.data.photos.map((img: any) => ({
          id: String(img.id),
          url: img.src.large,
          thumbnailUrl: img.src.small,
          category: query,
          tags: [query, 'furniture'],
          width: img.width,
          height: img.height,
          color: img.avg_color,
          source: 'pexels' as const,
          photographer: img.photographer,
          photographerUrl: img.photographer_url,
          license: 'Pexels License (free to use, attribution appreciated)'
        }));
      } catch (error: any) {
        retries++;
        if (error.response?.status === 429) {
          console.log(`⏳ Pexels rate limited. Waiting...`);
          await this.sleep(60000);
        } else if (retries >= MAX_RETRIES) {
          console.error(`❌ Failed to fetch from Pexels:`, error.message);
          return [];
        }
        await this.sleep(2000 * retries);
      }
    }
    
    return [];
  }
  
  // Main fetch orchestration
  async fetchAll(targetTotal: number = 800): Promise<void> {
    console.log(`🎯 Target: ${targetTotal} furniture images\n`);
    
    await this.loadProgress();
    
    for (const catConfig of FURNITURE_CATEGORIES) {
      const { category, queries, target } = catConfig;
      
      // Skip if already processed
      if (this.progress.lastCategory && 
          FURNITURE_CATEGORIES.findIndex(c => c.category === this.progress.lastCategory) > 
          FURNITURE_CATEGORIES.findIndex(c => c.category === category)) {
        continue;
      }
      
      console.log(`\n📸 Fetching ${category} (target: ${target} images)...`);
      
      let categoryCount = 0;
      const perQuery = Math.ceil(target / queries.length);
      
      for (const query of queries) {
        if (categoryCount >= target) break;
        
        console.log(`  🔍 Query: "${query}"`);
        
        let page = 1;
        let fetchedForQuery = 0;
        
        while (fetchedForQuery < perQuery && this.progress.completed < targetTotal) {
          // Try Unsplash first
          if (this.unsplashKey) {
            const unsplashImages = await this.fetchUnsplash(query, page, 30);
            
            if (unsplashImages.length > 0) {
              unsplashImages.forEach(img => {
                img.category = category; // Override with our category
              });
              
              this.progress.images.push(...unsplashImages);
              this.progress.completed += unsplashImages.length;
              categoryCount += unsplashImages.length;
              fetchedForQuery += unsplashImages.length;
              
              console.log(`    ✅ Unsplash: +${unsplashImages.length} (total: ${this.progress.completed})`);
              
              await this.saveProgress();
              await this.sleep(RATE_LIMIT_DELAY);
            }
          }
          
          // Fallback to Pexels if needed
          if (fetchedForQuery < perQuery && this.pexelsKey && this.progress.completed < targetTotal) {
            const pexelsImages = await this.fetchPexels(query, page, 30);
            
            if (pexelsImages.length > 0) {
              pexelsImages.forEach(img => {
                img.category = category;
              });
              
              this.progress.images.push(...pexelsImages);
              this.progress.completed += pexelsImages.length;
              categoryCount += pexelsImages.length;
              fetchedForQuery += pexelsImages.length;
              
              console.log(`    ✅ Pexels: +${pexelsImages.length} (total: ${this.progress.completed})`);
              
              await this.saveProgress();
              await this.sleep(RATE_LIMIT_DELAY);
            }
          }
          
          page++;
          
          // Break if no more results
          if (page > 10) break; // Max 10 pages per query
        }
      }
      
      this.progress.lastCategory = category;
      await this.saveProgress();
      
      console.log(`  ✨ ${category}: ${categoryCount} images fetched`);
      
      if (this.progress.completed >= targetTotal) {
        console.log(`\n🎉 Target reached! Total: ${this.progress.completed} images`);
        break;
      }
    }
    
    await this.finalize();
  }
  
  // Finalize and save output files
  async finalize(): Promise<void> {
    console.log('\n📊 Finalizing...');
    
    // Deduplicate by ID
    const uniqueImages = Array.from(
      new Map(this.progress.images.map(img => [img.id, img])).values()
    );
    
    console.log(`   Deduped: ${this.progress.images.length} → ${uniqueImages.length}`);
    
    // Separate by source
    const unsplashImages = uniqueImages.filter(img => img.source === 'unsplash');
    const pexelsImages = uniqueImages.filter(img => img.source === 'pexels');
    
    // Category breakdown
    const byCategory = uniqueImages.reduce((acc, img) => {
      acc[img.category] = (acc[img.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const output = {
      meta: {
        totalImages: uniqueImages.length,
        unsplashCount: unsplashImages.length,
        pexelsCount: pexelsImages.length,
        categories: byCategory,
        fetchedAt: new Date().toISOString(),
        license: 'All images are free to use. Attribution appreciated where specified.'
      },
      images: uniqueImages
    };
    
    // Save main output
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2));
    console.log(`✅ Saved ${uniqueImages.length} images to ${OUTPUT_FILE}`);
    
    // Save source-specific files
    if (unsplashImages.length > 0) {
      await fs.writeFile(
        OUTPUT_FILE,
        JSON.stringify({ ...output, images: unsplashImages }, null, 2)
      );
      console.log(`✅ Unsplash: ${unsplashImages.length} images`);
    }
    
    if (pexelsImages.length > 0) {
      await fs.writeFile(
        PEXELS_OUTPUT,
        JSON.stringify({ ...output, images: pexelsImages }, null, 2)
      );
      console.log(`✅ Pexels: ${pexelsImages.length} images`);
    }
    
    // Category report
    console.log('\n📈 Category Breakdown:');
    Object.entries(byCategory)
      .sort(([, a], [, b]) => b - a)
      .forEach(([cat, count]) => {
        console.log(`   ${cat.padEnd(20)} ${count}`);
      });
    
    console.log(`\n✨ Complete! Ready to run: npm run seed:listings`);
    
    // Clean up progress file
    try {
      await fs.unlink(PROGRESS_FILE);
    } catch {}
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  const target = parseInt(args[0]) || 800; // Default 800, adjust as needed
  
  console.log('🪑 Furniture Image Fetcher');
  console.log('==========================\n');
  
  const fetcher = new ImageFetcher();
  
  try {
    await fetcher.fetchAll(target);
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

main();