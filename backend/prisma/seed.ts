/**
 * Database Seed Script
 *
 * This script populates the database with initial reference data.
 * Run with: npm run db:seed
 *
 * What is seeding?
 * Seeding fills your database with starter data that your app needs to function.
 * For this app, we need:
 * - A list of common pesticide chemicals (users pick from this list)
 * - A list of target pest categories (what the pesticide targets)
 *
 * This script is IDEMPOTENT:
 * Running it multiple times won't create duplicates. It checks if data
 * already exists before inserting. This is important because you might
 * run the seed command multiple times during development.
 *
 * The data here represents common chemicals used in landscaping/lawn care.
 * In a real app, you might load this from a CSV file or external database.
 */

import { PrismaClient } from '@prisma/client';

// Create a Prisma client instance for database operations
const prisma = new PrismaClient();

// ===================
// CHEMICAL DATA
// ===================

/**
 * Array of common pesticide products used in landscaping
 *
 * Each chemical has:
 * - name: The product or active ingredient name
 * - epaNumber: EPA registration number (unique identifier for registered pesticides)
 * - activeIngredient: The chemical compound that does the work
 * - manufacturer: Company that makes the product
 * - signalWord: Danger level (DANGER > WARNING > CAUTION)
 *
 * Signal Words Explained:
 * - DANGER: Highly toxic, can cause severe injury or death
 * - WARNING: Moderately toxic
 * - CAUTION: Slightly toxic (most common for lawn care products)
 *
 * These EPA numbers are realistic examples but may not be current.
 * Always verify EPA numbers for actual use.
 */
const chemicals = [
  // =========================================
  // HERBICIDES (Weed Killers)
  // =========================================
  {
    name: 'Roundup Pro Concentrate',
    epaNumber: '524-529',
    activeIngredient: 'Glyphosate 50.2%',
    manufacturer: 'Bayer',
    signalWord: 'CAUTION',
  },
  {
    name: 'Roundup QuikPro',
    epaNumber: '524-535',
    activeIngredient: 'Glyphosate 73.3%, Diquat dibromide 2.9%',
    manufacturer: 'Bayer',
    signalWord: 'CAUTION',
  },
  {
    name: '2,4-D Amine 4',
    epaNumber: '228-93',
    activeIngredient: '2,4-Dichlorophenoxyacetic acid 46.8%',
    manufacturer: 'Albaugh',
    signalWord: 'DANGER',
  },
  {
    name: 'Trimec Classic',
    epaNumber: '9198-10',
    activeIngredient: '2,4-D, Dicamba, MCPP',
    manufacturer: 'PBI Gordon',
    signalWord: 'CAUTION',
  },
  {
    name: 'Trimec Southern',
    epaNumber: '9198-49',
    activeIngredient: '2,4-D, Dicamba, MCPP-p',
    manufacturer: 'PBI Gordon',
    signalWord: 'CAUTION',
  },
  {
    name: 'Celsius WG',
    epaNumber: '432-1508',
    activeIngredient: 'Thiencarbazone-methyl, Iodosulfuron, Dicamba',
    manufacturer: 'Bayer',
    signalWord: 'CAUTION',
  },
  {
    name: 'Dismiss Turf Herbicide',
    epaNumber: '279-3311',
    activeIngredient: 'Sulfentrazone 39.6%',
    manufacturer: 'FMC',
    signalWord: 'WARNING',
  },
  {
    name: 'Speedzone Southern',
    epaNumber: '9198-86',
    activeIngredient: 'Carfentrazone-ethyl, 2,4-D, MCPP-p, Dicamba',
    manufacturer: 'PBI Gordon',
    signalWord: 'CAUTION',
  },
  {
    name: 'Barricade 4FL',
    epaNumber: '100-1139',
    activeIngredient: 'Prodiamine 40.7%',
    manufacturer: 'Syngenta',
    signalWord: 'CAUTION',
  },
  {
    name: 'Dimension 2EW',
    epaNumber: '62719-542',
    activeIngredient: 'Dithiopyr 24%',
    manufacturer: 'Corteva',
    signalWord: 'CAUTION',
  },
  {
    name: 'Pennant Magnum',
    epaNumber: '100-950',
    activeIngredient: 'S-metolachlor 83.7%',
    manufacturer: 'Syngenta',
    signalWord: 'CAUTION',
  },
  {
    name: 'Sedgehammer Plus',
    epaNumber: '81880-30',
    activeIngredient: 'Halosulfuron-methyl 75%',
    manufacturer: 'Gowan',
    signalWord: 'CAUTION',
  },
  {
    name: 'Certainty Turf Herbicide',
    epaNumber: '59639-131',
    activeIngredient: 'Sulfosulfuron 75%',
    manufacturer: 'Monsanto',
    signalWord: 'CAUTION',
  },
  {
    name: 'MSMA Target 6 Plus',
    epaNumber: '8660-13',
    activeIngredient: 'Monosodium acid methanearsonate 47.9%',
    manufacturer: 'Drexel',
    signalWord: 'WARNING',
  },

  // =========================================
  // INSECTICIDES (Bug Killers)
  // =========================================
  {
    name: 'Bifen I/T',
    epaNumber: '53883-118',
    activeIngredient: 'Bifenthrin 7.9%',
    manufacturer: 'Control Solutions',
    signalWord: 'CAUTION',
  },
  {
    name: 'Talstar Professional',
    epaNumber: '279-3206',
    activeIngredient: 'Bifenthrin 7.9%',
    manufacturer: 'FMC',
    signalWord: 'CAUTION',
  },
  {
    name: 'Permethrin SFR',
    epaNumber: '53883-117',
    activeIngredient: 'Permethrin 36.8%',
    manufacturer: 'Control Solutions',
    signalWord: 'CAUTION',
  },
  {
    name: 'Sevin SL',
    epaNumber: '432-1227',
    activeIngredient: 'Carbaryl 43.0%',
    manufacturer: 'Bayer',
    signalWord: 'CAUTION',
  },
  {
    name: 'Merit 75 WP',
    epaNumber: '432-1312',
    activeIngredient: 'Imidacloprid 75%',
    manufacturer: 'Bayer',
    signalWord: 'CAUTION',
  },
  {
    name: 'Acelepryn',
    epaNumber: '352-838',
    activeIngredient: 'Chlorantraniliprole 18.4%',
    manufacturer: 'Syngenta',
    signalWord: 'CAUTION',
  },
  {
    name: 'Arena 50 WDG',
    epaNumber: '59639-133',
    activeIngredient: 'Clothianidin 50%',
    manufacturer: 'Valent',
    signalWord: 'CAUTION',
  },
  {
    name: 'Scimitar GC',
    epaNumber: '100-1076',
    activeIngredient: 'Lambda-cyhalothrin 9.7%',
    manufacturer: 'Syngenta',
    signalWord: 'CAUTION',
  },
  {
    name: 'Tempo SC Ultra',
    epaNumber: '432-1363',
    activeIngredient: 'beta-Cyfluthrin 11.8%',
    manufacturer: 'Bayer',
    signalWord: 'CAUTION',
  },
  {
    name: 'Dylox 420 SL',
    epaNumber: '432-1285',
    activeIngredient: 'Trichlorfon 38.8%',
    manufacturer: 'Bayer',
    signalWord: 'WARNING',
  },
  {
    name: 'Demand CS',
    epaNumber: '100-1066',
    activeIngredient: 'Lambda-cyhalothrin 9.7%',
    manufacturer: 'Syngenta',
    signalWord: 'CAUTION',
  },
  {
    name: 'Suspend SC',
    epaNumber: '432-763',
    activeIngredient: 'Deltamethrin 4.75%',
    manufacturer: 'Bayer',
    signalWord: 'CAUTION',
  },
  {
    name: 'Crosscheck Plus',
    epaNumber: '53883-346',
    activeIngredient: 'Bifenthrin 7.9%, Zeta-cypermethrin 0.85%',
    manufacturer: 'Control Solutions',
    signalWord: 'CAUTION',
  },

  // =========================================
  // FUNGICIDES (Disease Control)
  // =========================================
  {
    name: 'Daconil Ultrex',
    epaNumber: '100-1215',
    activeIngredient: 'Chlorothalonil 82.5%',
    manufacturer: 'Syngenta',
    signalWord: 'WARNING',
  },
  {
    name: 'Daconil Weatherstik',
    epaNumber: '50534-202',
    activeIngredient: 'Chlorothalonil 40.4%',
    manufacturer: 'Syngenta',
    signalWord: 'WARNING',
  },
  {
    name: 'Banner Maxx II',
    epaNumber: '100-1623',
    activeIngredient: 'Propiconazole 14.3%',
    manufacturer: 'Syngenta',
    signalWord: 'CAUTION',
  },
  {
    name: 'Propiconazole 14.3 MEC',
    epaNumber: '9779-373',
    activeIngredient: 'Propiconazole 14.3%',
    manufacturer: 'Quali-Pro',
    signalWord: 'CAUTION',
  },
  {
    name: 'Heritage G',
    epaNumber: '100-1326',
    activeIngredient: 'Azoxystrobin 0.31%',
    manufacturer: 'Syngenta',
    signalWord: 'CAUTION',
  },
  {
    name: 'Headway G',
    epaNumber: '100-1398',
    activeIngredient: 'Azoxystrobin 0.31%, Propiconazole 0.75%',
    manufacturer: 'Syngenta',
    signalWord: 'CAUTION',
  },
  {
    name: 'Copper Fungicide',
    epaNumber: '4-636',
    activeIngredient: 'Copper octanoate 10%',
    manufacturer: 'Bonide',
    signalWord: 'CAUTION',
  },
  {
    name: 'Bordeaux Mixture',
    epaNumber: '4-51',
    activeIngredient: 'Copper sulfate 52%',
    manufacturer: 'Bonide',
    signalWord: 'WARNING',
  },
  {
    name: 'Eagle 20EW',
    epaNumber: '62719-463',
    activeIngredient: 'Myclobutanil 19.7%',
    manufacturer: 'Corteva',
    signalWord: 'CAUTION',
  },
  {
    name: 'Tartan Stressgard',
    epaNumber: '432-1516',
    activeIngredient: 'Triticonazole 3.4%, Trifloxystrobin 3.4%',
    manufacturer: 'Bayer',
    signalWord: 'CAUTION',
  },
  {
    name: 'Pillar G Intrinsic',
    epaNumber: '7969-328',
    activeIngredient: 'Pyraclostrobin 0.38%, Triticonazole 0.43%',
    manufacturer: 'BASF',
    signalWord: 'CAUTION',
  },
  {
    name: 'Mancozeb Flowable',
    epaNumber: '9779-261',
    activeIngredient: 'Mancozeb 37%',
    manufacturer: 'Quali-Pro',
    signalWord: 'CAUTION',
  },
];

// ===================
// TARGET PEST DATA
// ===================

/**
 * Array of pest categories that pesticides target
 *
 * These are organized into general categories to make it easier for
 * applicators to log what they're treating. In a real application,
 * you might want to add sub-categories (e.g., specific weed types).
 *
 * Category types:
 * - weed: Unwanted plants
 * - insect: Bugs and insects
 * - disease: Fungal/bacterial plant diseases
 * - other: Miscellaneous pest types
 */
const targetPests = [
  // =========================================
  // WEED CATEGORIES
  // =========================================
  {
    name: 'Broadleaf Weeds',
    category: 'weed',
    description: 'Dandelions, clover, chickweed, plantain, and other flat-leaved weeds',
  },
  {
    name: 'Grassy Weeds',
    category: 'weed',
    description: 'Crabgrass, goosegrass, dallisgrass, and other grass-type weeds',
  },
  {
    name: 'Sedges',
    category: 'weed',
    description: 'Nutsedge, yellow nutsedge, purple nutsedge, and kyllinga',
  },
  {
    name: 'Annual Weeds',
    category: 'weed',
    description: 'Weeds that complete their lifecycle in one year (crabgrass, annual bluegrass)',
  },
  {
    name: 'Perennial Weeds',
    category: 'weed',
    description: 'Weeds that return year after year (dandelion, clover, ground ivy)',
  },
  {
    name: 'Woody Brush',
    category: 'weed',
    description: 'Woody plants, vines, brambles, and brush that require clearing',
  },

  // =========================================
  // INSECT CATEGORIES
  // =========================================
  {
    name: 'Ants',
    category: 'insect',
    description: 'Fire ants, carpenter ants, Argentine ants, and other ant species',
  },
  {
    name: 'Mosquitoes',
    category: 'insect',
    description: 'Adult mosquitoes and larvae control',
  },
  {
    name: 'Grubs',
    category: 'insect',
    description: 'Japanese beetle grubs, June bug larvae, and other lawn-damaging grubs',
  },
  {
    name: 'Chinch Bugs',
    category: 'insect',
    description: 'Southern chinch bugs and hairy chinch bugs that damage turf',
  },
  {
    name: 'Aphids',
    category: 'insect',
    description: 'Plant-sucking insects found on ornamentals and shrubs',
  },
  {
    name: 'Armyworms',
    category: 'insect',
    description: 'Fall armyworms and other caterpillars that damage turf',
  },
  {
    name: 'Sod Webworms',
    category: 'insect',
    description: 'Larvae that create dead patches in lawns',
  },
  {
    name: 'Mole Crickets',
    category: 'insect',
    description: 'Burrowing insects that damage turf roots and create tunnels',
  },
  {
    name: 'Scale Insects',
    category: 'insect',
    description: 'Soft scales and armored scales on ornamental plants',
  },
  {
    name: 'Spider Mites',
    category: 'insect',
    description: 'Two-spotted spider mites and other mite species on ornamentals',
  },
  {
    name: 'Whiteflies',
    category: 'insect',
    description: 'Whiteflies on ornamental plants and shrubs',
  },
  {
    name: 'Fleas and Ticks',
    category: 'insect',
    description: 'Outdoor flea and tick control in lawns and landscapes',
  },
  {
    name: 'General Insects',
    category: 'insect',
    description: 'Multiple insect types or general perimeter pest control',
  },

  // =========================================
  // DISEASE CATEGORIES
  // =========================================
  {
    name: 'Brown Patch',
    category: 'disease',
    description: 'Rhizoctonia fungal disease causing circular dead patches',
  },
  {
    name: 'Dollar Spot',
    category: 'disease',
    description: 'Fungal disease creating small bleached spots in turf',
  },
  {
    name: 'Lawn Fungus (General)',
    category: 'disease',
    description: 'Multiple or unidentified fungal turf diseases',
  },
  {
    name: 'Powdery Mildew',
    category: 'disease',
    description: 'White powdery coating on leaves of plants and turf',
  },
  {
    name: 'Take-All Root Rot',
    category: 'disease',
    description: 'Root disease in St. Augustine grass causing yellowing and decline',
  },
  {
    name: 'Fire Blight',
    category: 'disease',
    description: 'Bacterial disease affecting fruit trees and ornamentals',
  },
  {
    name: 'Leaf Spot',
    category: 'disease',
    description: 'Various fungal leaf diseases on turf and ornamentals',
  },
  {
    name: 'Rust Disease',
    category: 'disease',
    description: 'Orange/rust colored fungal spores on grass blades',
  },

  // =========================================
  // OTHER CATEGORIES
  // =========================================
  {
    name: 'Moss/Algae',
    category: 'other',
    description: 'Moss and algae growth in lawns and hardscapes',
  },
];

// ===================
// MAIN SEED FUNCTION
// ===================

/**
 * Main function that seeds the database
 *
 * This function:
 * 1. Checks if chemicals already exist (skip if yes)
 * 2. Inserts all chemicals if database is empty
 * 3. Checks if target pests already exist (skip if yes)
 * 4. Inserts all target pests if database is empty
 *
 * The idempotent check uses count() to see if any records exist.
 * This is simpler than checking each individual record.
 */
async function main() {
  console.log('Starting database seed...\n');

  // ===================
  // SEED CHEMICALS
  // ===================
  console.log('Checking for existing chemicals...');

  // Count existing chemicals in database
  const existingChemicalCount = await prisma.chemical.count();

  if (existingChemicalCount > 0) {
    // Data already exists, skip to avoid duplicates
    console.log(`Found ${existingChemicalCount} existing chemicals. Skipping chemical seed.\n`);
  } else {
    // No chemicals exist, let's add them
    console.log('No chemicals found. Seeding chemicals...');

    // Use createMany for efficient bulk insert
    // Note: createMany doesn't return the created records, just a count
    const chemicalResult = await prisma.chemical.createMany({
      data: chemicals.map((chemical) => ({
        name: chemical.name,
        epaNumber: chemical.epaNumber,
        activeIngredient: chemical.activeIngredient,
        manufacturer: chemical.manufacturer,
        signalWord: chemical.signalWord,
        isActive: true,
      })),
    });

    console.log(`Successfully seeded ${chemicalResult.count} chemicals!\n`);
  }

  // ===================
  // SEED TARGET PESTS
  // ===================
  console.log('Checking for existing target pests...');

  // Count existing target pests in database
  const existingPestCount = await prisma.targetPest.count();

  if (existingPestCount > 0) {
    // Data already exists, skip to avoid duplicates
    console.log(`Found ${existingPestCount} existing target pests. Skipping pest seed.\n`);
  } else {
    // No target pests exist, let's add them
    console.log('No target pests found. Seeding target pests...');

    // Use createMany for efficient bulk insert
    const pestResult = await prisma.targetPest.createMany({
      data: targetPests.map((pest) => ({
        name: pest.name,
        category: pest.category,
        description: pest.description,
        isActive: true,
      })),
    });

    console.log(`Successfully seeded ${pestResult.count} target pests!\n`);
  }

  // ===================
  // SUMMARY
  // ===================
  // Get final counts to display summary
  const [finalChemicalCount, finalPestCount] = await Promise.all([
    prisma.chemical.count(),
    prisma.targetPest.count(),
  ]);

  console.log('===========================================');
  console.log('DATABASE SEED COMPLETE');
  console.log('===========================================');
  console.log(`Total chemicals in database: ${finalChemicalCount}`);
  console.log(`Total target pests in database: ${finalPestCount}`);
  console.log('===========================================');
}

// ===================
// EXECUTE SEED
// ===================

/**
 * Execute the main function and handle errors
 *
 * This pattern is common in Node.js scripts:
 * - Call main()
 * - If successful, disconnect from database and exit cleanly
 * - If error, log it, disconnect, and exit with error code
 *
 * The finally block ensures we always disconnect from the database,
 * even if an error occurred. This prevents hanging connections.
 */
main()
  .then(async () => {
    // Success! Disconnect from database
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    // Error occurred, log it and exit with error code
    console.error('Error during seed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });

// Export main function for testing or external use
export { main };
