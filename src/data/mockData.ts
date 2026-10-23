import type { VideoChannel } from '../types';

/**
 * Amazon links use clean, high-precision SEARCH URLs (https://www.amazon.com/s?k=...)
 * instead of /dp/ASIN deep links. Direct ASIN pages frequently go out of stock or
 * 404, whereas a brand+model search always opens real, in-stock, buyable listings.
 *
 * Thumbnails intentionally omit photo URLs — the drawer renders clean category
 * vector icons (watch / sunglasses / jacket / tech) so a watch never shows a
 * photo of jeans or sneakers.
 */
export const CHANNELS: VideoChannel[] = [
  {
    id: 'ch-01',
    sceneId: 'sceneA_watch',
    channelNumber: 1,
    title: 'Macro Focus: Fossil Q Hybrid',
    subtitle: 'Extreme macro close-up of a Fossil Q Hybrid smartwatch filling the frame',
    url: 'https://assets.mixkit.co/videos/28896/28896-720.mp4',
    poster: 'https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?auto=format&fit=crop&w=1280&q=80',
    defaultItems: [
      {
        id: 'watch-fossil-q',
        label: 'watch',
        displayLabel: 'Fossil Q Hybrid Chronograph Smartwatch',
        category: 'watch',
        // Giant macro watch case fills the center of the frame.
        x_min: 140,
        y_min: 60,
        x_max: 830,
        y_max: 940,
        confidence: 0.97,
        exactMatch: {
          title: "Fossil Men's Q Nate / Grant Hybrid Stainless Steel Smartwatch",
          asin: null,
          estimatedPrice: '$175.00',
          amazonUrl: 'https://www.amazon.com/s?k=Fossil+Nate+Chronograph+Stainless+Steel+Watch',
          brand: 'Fossil',
          rating: 4.4,
          reviewsCount: 5600,
          keySpecs: ['Hybrid Smartwatch (Analog + Smart)', 'Stainless Steel Case & Band', 'Activity & Sleep Tracking', 'Smartphone Notifications']
        },
        budgetAlternative: {
          title: 'Casio Edifice EFV-650D Stainless Steel Chronograph',
          asin: null,
          estimatedPrice: '$89.99',
          amazonUrl: 'https://www.amazon.com/s?k=Casio+Edifice+Chronograph+Stainless+Steel+Watch',
          brand: 'Casio',
          rating: 4.6,
          reviewsCount: 3100,
          keySpecs: ['Analog Chronograph Movement', 'Solid Stainless Steel Band', '100m Water Resistant', 'Mineral Glass Face']
        }
      }
    ]
  },
  {
    id: 'ch-02',
    sceneId: 'sceneB_biker',
    channelNumber: 2,
    title: 'Highway Ops: Leather & Shades',
    subtitle: 'Biker standing on the RIGHT side of the frame in black leather jacket and shades',
    url: 'https://assets.mixkit.co/videos/45/45-720.mp4',
    poster: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1280&q=80',
    defaultItems: [
      {
        id: 'sunglasses-biker',
        label: 'sunglasses',
        displayLabel: 'Clubmaster Polarized Sunglasses',
        category: 'sunglasses',
        // On his face — right side of frame.
        x_min: 715,
        y_min: 310,
        x_max: 775,
        y_max: 355,
        confidence: 0.92,
        exactMatch: {
          title: 'Ray-Ban RB4416 New Clubmaster Polarized',
          asin: null,
          estimatedPrice: '$213.00',
          amazonUrl: 'https://www.amazon.com/s?k=Ray-Ban+Clubmaster+Polarized+Sunglasses',
          brand: 'Ray-Ban',
          rating: 4.8,
          reviewsCount: 4280,
          keySpecs: ['100% UV Protection Polarized Crystal Lenses', 'Slim Contemporary Metal Browline', 'Original Ray-Ban Case & Cloth']
        },
        budgetAlternative: {
          title: 'SOJOS Retro Polarized Square Sunglasses (SJ2229)',
          asin: null,
          estimatedPrice: '$14.99',
          amazonUrl: 'https://www.amazon.com/s?k=SOJOS+Retro+Polarized+Sunglasses',
          brand: 'SOJOS',
          rating: 4.5,
          reviewsCount: 18900,
          keySpecs: ['HD Polarized TAC Lenses', 'Lightweight Composite Frame', 'Reinforced Metal Hinges']
        }
      },
      {
        id: 'watch-biker',
        label: 'watch',
        displayLabel: 'Chronograph Wristwatch',
        category: 'watch',
        // On his raised wrist — right side of frame.
        x_min: 700,
        y_min: 470,
        x_max: 740,
        y_max: 515,
        confidence: 0.89,
        exactMatch: {
          title: 'Fossil Men\'s Nate Chronograph Stainless Steel Watch',
          asin: null,
          estimatedPrice: '$149.00',
          amazonUrl: 'https://www.amazon.com/s?k=Fossil+Nate+Chronograph+Stainless+Steel+Watch',
          brand: 'Fossil',
          rating: 4.5,
          reviewsCount: 4100,
          keySpecs: ['Analog Chronograph Movement', 'Stainless Steel Case & Band', 'Mineral Crystal Face', '50m Water Resistant']
        },
        budgetAlternative: {
          title: 'Casio Edifice Stainless Steel Chronograph Watch',
          asin: null,
          estimatedPrice: '$89.99',
          amazonUrl: 'https://www.amazon.com/s?k=Casio+Edifice+Chronograph+Stainless+Steel+Watch',
          brand: 'Casio',
          rating: 4.6,
          reviewsCount: 3100,
          keySpecs: ['Analog Chronograph Movement', 'Solid Stainless Steel Band', '100m Water Resistant', 'Mineral Glass Face']
        }
      },
      {
        id: 'jacket-biker',
        label: 'jacket',
        displayLabel: 'Black Leather Biker Jacket',
        category: 'jacket',
        // On his torso — right side of frame.
        x_min: 680,
        y_min: 380,
        x_max: 835,
        y_max: 910,
        confidence: 0.94,
        exactMatch: {
          title: "Men's Genuine Leather Motorcycle Biker Jacket (Black)",
          asin: null,
          estimatedPrice: '$229.00',
          amazonUrl: 'https://www.amazon.com/s?k=Mens+Genuine+Leather+Motorcycle+Biker+Jacket+Black',
          brand: 'Leather',
          rating: 4.7,
          reviewsCount: 2100,
          keySpecs: ['Genuine Cowhide Leather', 'Asymmetric Moto Zipper', 'Quilted Lining', 'Snap Collar']
        },
        budgetAlternative: {
          title: "Men's Faux Leather Motorcycle Bomber Jacket (Black)",
          asin: null,
          estimatedPrice: '$69.99',
          amazonUrl: 'https://www.amazon.com/s?k=Mens+Faux+Leather+Motorcycle+Bomber+Jacket+Black',
          brand: 'Generic',
          rating: 4.4,
          reviewsCount: 9200,
          keySpecs: ['Water-Resistant Faux Leather', 'Ribbed Cuffs & Hem', 'Twin Zip Pockets', 'Machine Washable']
        }
      }
    ]
  },
  {
    id: 'ch-03',
    sceneId: 'sceneC_recon',
    channelNumber: 3,
    title: 'Urban Reconnaissance: Polarized Shades',
    subtitle: 'Man in dark jacket and sunglasses navigating city traffic',
    url: 'https://assets.mixkit.co/videos/101/101-720.mp4',
    poster: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1280&q=80',
    defaultItems: [
      {
        id: 'sunglasses-recon',
        label: 'sunglasses',
        displayLabel: 'Clubmaster Polarized Sunglasses',
        category: 'sunglasses',
        // Centered on the walking man's face.
        x_min: 300,
        y_min: 360,
        x_max: 445,
        y_max: 450,
        confidence: 0.93,
        exactMatch: {
          title: 'Ray-Ban RB4416 New Clubmaster Polarized',
          asin: null,
          estimatedPrice: '$213.00',
          amazonUrl: 'https://www.amazon.com/s?k=Ray-Ban+Clubmaster+Polarized+Sunglasses',
          brand: 'Ray-Ban',
          rating: 4.8,
          reviewsCount: 4280,
          keySpecs: ['100% UV Protection Polarized Crystal Lenses', 'Slim Contemporary Metal Browline']
        },
        budgetAlternative: {
          title: 'SOJOS Retro Polarized Square Sunglasses (SJ2229)',
          asin: null,
          estimatedPrice: '$14.99',
          amazonUrl: 'https://www.amazon.com/s?k=SOJOS+Retro+Polarized+Sunglasses',
          brand: 'SOJOS',
          rating: 4.5,
          reviewsCount: 18900,
          keySpecs: ['HD Polarized TAC Lenses', 'Lightweight Composite Frame']
        }
      },
      {
        id: 'jacket-recon',
        label: 'jacket',
        displayLabel: 'Black Shearling Bomber Jacket',
        category: 'jacket',
        // Centered on the walking man's torso + body.
        x_min: 120,
        y_min: 575,
        x_max: 610,
        y_max: 985,
        confidence: 0.91,
        exactMatch: {
          title: "Men's Genuine Leather Motorcycle Biker Jacket (Black)",
          asin: null,
          estimatedPrice: '$229.00',
          amazonUrl: 'https://www.amazon.com/s?k=Mens+Genuine+Leather+Motorcycle+Biker+Jacket+Black',
          brand: 'Leather',
          rating: 4.7,
          reviewsCount: 2100,
          keySpecs: ['Genuine Cowhide Leather', 'Asymmetric Moto Zipper']
        },
        budgetAlternative: {
          title: "Men's Faux Leather Motorcycle Bomber Jacket (Black)",
          asin: null,
          estimatedPrice: '$69.99',
          amazonUrl: 'https://www.amazon.com/s?k=Mens+Faux+Leather+Motorcycle+Bomber+Jacket+Black',
          brand: 'Generic',
          rating: 4.4,
          reviewsCount: 9200,
          keySpecs: ['Water-Resistant Faux Leather', 'Ribbed Cuffs & Hem']
        }
      }
    ]
  },
  {
    id: 'ch-04',
    sceneId: 'sceneD_moonphase',
    channelNumber: 4,
    title: 'Luxury Vault: Moonphase Macro',
    subtitle: 'Extreme macro of a luxury Swiss moonphase dial (Frederique Constant Geneve)',
    url: 'https://assets.mixkit.co/videos/3649/3649-720.mp4',
    poster: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1280&q=80',
    defaultItems: [
      {
        id: 'watch-moonphase-vault',
        label: 'watch',
        displayLabel: 'Frederique Constant Classics Heart Beat Moonphase',
        category: 'watch',
        // Precise bounds capturing the circular macro dial.
        x_min: 70,
        y_min: 5,
        x_max: 760,
        y_max: 950,
        confidence: 0.95,
        exactMatch: {
          title: 'Classics Heart Beat Moonphase Automatic Watch',
          asin: null,
          estimatedPrice: '$1,850.00',
          amazonUrl: 'https://www.amazon.com/s?k=Frederique+Constant+Classics+Moonphase+Watch',
          brand: 'FREDERIQUE CONSTANT',
          rating: 4.8,
          reviewsCount: 210,
          keySpecs: ['Swiss Automatic Movement', 'Open Heart Beat & Moonphase Dial', 'Sapphire Crystal', 'Genuine Leather Strap']
        },
        budgetAlternative: {
          title: 'Discover More Chronograph Calendar Watch',
          asin: null,
          estimatedPrice: '$145.00',
          amazonUrl: 'https://www.amazon.com/s?k=Seiko+Neo+Classic+Moonphase+Watch',
          brand: 'SEIKO',
          rating: 4.6,
          reviewsCount: 5400,
          keySpecs: ['Japanese Quartz Chronograph', 'Day/Date Calendar Dial', 'Hardlex Crystal', 'Stainless Steel Case & Band']
        }
      }
    ]
  }
];
