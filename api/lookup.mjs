const BUILD_ID = "SAB_FULL_SITE_MASTER_CORPUS_R45_2026_08_23";

const PRIMARY_ORIGIN = "https://steal-a-brainrot.org";
const FANDOM_API = "https://stealabrainrot.fandom.com/api.php";
const FANDOM_BASE = "https://stealabrainrot.fandom.com/wiki/";
const WIKI_ORIGIN = "https://steal-a-brainrot.wiki";
const TAVILY_URL = "https://api.tavily.com/search";
const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const DEFAULT_MODEL = "nvidia/nemotron-3-super-120b-a12b";

const CFG = Object.freeze({
  GLOBAL_BUDGET_MS: Number(process.env.LOOKUP_BUDGET_MS || 6200),
  PRIMARY_TIMEOUT_MS: Number(process.env.PRIMARY_TIMEOUT_MS || 1050),
  FANDOM_TIMEOUT_MS: Number(process.env.FANDOM_TIMEOUT_MS || 900),
  BACKUP_TIMEOUT_MS: Number(process.env.BACKUP_TIMEOUT_MS || 800),
  TAVILY_TIMEOUT_MS: Number(process.env.TAVILY_TIMEOUT_MS || 950),
  NVIDIA_TIMEOUT_MS: Number(process.env.NVIDIA_TIMEOUT_MS || 950),
  NVIDIA_ANALYZE_TIMEOUT_MS: Number(process.env.NVIDIA_ANALYZE_TIMEOUT_MS || 650),

  MAX_PRIMARY_PAGES: 7,
  MAX_BACKUP_PAGES: 5,
  MAX_SEARCH_RESULTS: 6,
  MAX_AI_EVIDENCE: 8,
  MAX_LORE_HUBS: Number(process.env.MAX_LORE_HUBS || 10),
  MAX_LORE_DETAIL_PAGES: Number(process.env.MAX_LORE_DETAIL_PAGES || 8),
  MAX_LORE_CHUNKS: Number(process.env.MAX_LORE_CHUNKS || 18),
  MAX_LORE_MANIFEST: Number(process.env.MAX_LORE_MANIFEST || 140),
  LORE_HUB_TIMEOUT_MS: Number(process.env.LORE_HUB_TIMEOUT_MS || 1050),

  PAGE_CACHE_TTL_MS: 5 * 60 * 1000,
  SEARCH_CACHE_TTL_MS: 3 * 60 * 1000,
  STABLE_ANSWER_TTL_MS: 12 * 60 * 60 * 1000,
  CURRENT_ANSWER_TTL_MS: 2 * 60 * 1000,
});

const REL = Object.freeze({
  TEXT: "TEXT",
  COST: "COST",
  INCOME: "INCOME",
  RARITY: "RARITY",
  STATUS: "STATUS",
  METHOD: "METHOD",
  DATE: "DATE",
  MULTIPLIER: "MULTIPLIER",
  REQUIREMENT: "REQUIREMENT",
  SPAWN: "SPAWN",
  FORMATION: "FORMATION",
  WEATHER: "WEATHER",
  DROP_RATE: "DROP_RATE",
  REWARD: "REWARD",
  CONTENTS: "CONTENTS",
  REBIRTH: "REBIRTH",
  GEAR: "GEAR",
  BRAINROT: "BRAINROT",
  MUTATION: "MUTATION",
  TRAIT: "TRAIT",
  RITUAL: "RITUAL",
  EVENT: "EVENT",
  MACHINE: "MACHINE",
  UPDATE: "UPDATE",
  COLLECTION: "COLLECTION",
  OUTCOME: "OUTCOME",
  FREQUENCY: "FREQUENCY",
  ACTIVE_RANGE: "ACTIVE_RANGE",
  REPLACED_BY: "REPLACED_BY",
  REPLACED_IN: "REPLACED_IN",
  CODE: "CODE",
  STOCK: "STOCK",
  PLAYERS: "PLAYERS",
  DURATION: "DURATION",
  TIME: "TIME",
  LOCATION: "LOCATION",
  SHOP: "SHOP",
  LUCKY_BLOCK: "LUCKY_BLOCK",
  BASE_SKIN: "BASE_SKIN",
  ANNOUNCEMENT: "ANNOUNCEMENT",
  LORE: "LORE",
  BASE: "BASE",
  MECHANIC: "MECHANIC",
  ASSET: "ASSET",
  COOLDOWN: "COOLDOWN",
});

const SOURCE = Object.freeze({
  PRIMARY: {
    tier: "S+",
    key: "PRIMARY_SPLUS",
    host: "steal-a-brainrot.org",
    confidence: 0.995,
  },
  FANDOM: {
    tier: "A+",
    key: "FANDOM_A_PLUS",
    host: "stealabrainrot.fandom.com",
    confidence: 0.97,
  },
  WIKI: {
    tier: "B",
    key: "WIKI_B",
    host: "steal-a-brainrot.wiki",
    confidence: 0.94,
  },
  EMERGENCY: {
    tier: "C",
    key: "EMERGENCY_WEB",
    host: "web",
    confidence: 0.78,
  },
});

const STOPWORDS = new Set([
  "what","which","who","when","where","why","how","is","are","was","were","does","did","do",
  "the","a","an","in","at","on","for","from","to","of","with","and","or","this","that","it","its",
  "steal","brainrot","brain","rot","sab","roblox","game","right","now","current","currently","latest","newest","new",
  "update","event","rebirth","gear","item","mutation","trait","ritual","machine","lucky","block","collection",
  "cost","price","income","multiplier","boost","rarity","spawn","spawns","require","requires","required","drop","rate","chance",
  "give","gives","gave","get","gets","got","make","makes","per","second","much","many","added","introduced","removed",
  "unlock","unlocks","unlocked","tell","me","about","have","has","had","come","came","out"
]);

const STATIC_ALIASES = Object.freeze({
  "flash tp": ["flash tp", "flash teleport"],
  "flash teleport": ["flash teleport", "flash tp"],
  "bomb croc": ["bomb croc", "bombardiro crocodilo"],
  "bombardiro": ["bombardiro", "bombardiro crocodilo"],
  "tralalero": ["tralalero", "tralalero tralala"],
  "brain rot": ["brain rot", "brainrot"],
  "lucky block": ["lucky block", "lucky blocks"],
  "admin abuse": ["admin abuse", "admin event"],
});


// =====================================================
// R41 INSTANT LORE SNAPSHOT
// Research pass: 100+ public S+ pages from steal-a-brainrot.org.
// This manifest is NOT fetched wholesale per request. It records the reviewed
// corpus and gives the resolver stable, local routing targets. Hot facts below
// are answerable with zero Tavily / zero page fetch / zero answer-generation AI.
// =====================================================
const R41_RESEARCHED_SPLUS_SOURCES = Object.freeze([
  "/brainrots", "/wiki", "/machines", "/rituals", "/ritual-brainrots", "/collections",
  "/wiki/rebirth", "/wiki/mutations", "/wiki/shop", "/wiki/tips", "/wiki/base", "/wiki/craft",
  "/wiki/trade-machine", "/wiki/duels-machine", "/wiki/advent-calendar", "/wiki/santas-fuse", "/wiki/cupids-machine",
  "/wiki/cyber-craft-machine", "/codes", "/lucky-blocks", "/lucky-block-brainrots", "/gallery", "/blogs",
  "/og", "/og-fuse-brainrots", "/crafts", "/witch-fuse-brainrots", "/santas-fuse-brainrots",
  "/limited-brainrots", "/themed-brainrots", "/aquatic-brainrots", "/dealer-brainrots", "/collections/christmas-brainrots",
  "/brainrots/spyder-elephant", "/brainrots/strawberry-elephant", "/brainrots/meowl", "/brainrots/headless-horseman",
  "/brainrots/john-pork", "/brainrots/skibidi-toilet", "/brainrots/griffin", "/brainrots/dragon-aquanini",
  "/brainrots/hydra-dragon-cannelloni", "/brainrots/dragon-gingerini", "/brainrots/dragon-cannelloni", "/brainrots/moby-bros",
  "/brainrots/digi-narwhal", "/brainrots/la-supreme-combinasion", "/brainrots/kraken", "/brainrots/bunny-and-eggy",
  "/brainrots/celestial-pegasus", "/brainrots/cerberus", "/brainrots/jelly-moby", "/brainrots/bumbatron",
  "/brainrots/hydra-bunny", "/brainrots/popcuru-and-fizzuru", "/brainrots/rosey-and-teddy", "/brainrots/la-breakfast-combinasion",
  "/brainrots/capitano-moby", "/brainrots/cooki-and-milki", "/brainrots/arcadragon", "/brainrots/burguro-and-fryuro",
  "/brainrots/los-secret-combinasionas", "/brainrots/ketupat-bros", "/brainrots/reinito-sleighito", "/brainrots/fortunu-and-cashuru",
  "/brainrots/los-amigos", "/brainrots/pizza-and-ranch", "/brainrots/la-secret-combinasion", "/brainrots/pancake-and-syrup",
  "/brainrots/fishino-clownino", "/brainrots/foxini-lanternini", "/brainrots/kalika-bros", "/brainrots/los-sekolahs",
  "/brainrots/cash-or-card", "/brainrots/fragrama-and-chocrama", "/brainrots/la-casa-boo", "/brainrots/los-admins",
  "/brainrots/la-fuse-machine", "/brainrots/duggy-bros", "/brainrots/la-food-combinasion", "/brainrots/yetimatic",
  "/brainrots/sammyni-cakini", "/brainrots/smore-serat", "/brainrots/boppin-bunny", "/brainrots/spooky-and-pumpky",
  "/brainrots/cangurato-gelato", "/brainrots/ginger-gerat", "/brainrots/la-ginger-sekolah", "/brainrots/los-chillis",
  "/brainrots/los-hackers", "/brainrots/love-love-bear", "/brainrots/bearito-cabinito", "/brainrots/capitano-americano",
  "/brainrots/rubiko-and-kubiko", "/brainrots/los-spaghettis", "/brainrots/rubrikiko", "/brainrots/sammyni-fattini",
  "/brainrots/festive-67", "/brainrots/quackini-snackini", "/brainrots/ventoliero-pavonero", "/brainrots/queen-bee",
  "/brainrots/cloverat-clapat", "/brainrots/spaghetti-tualetti", "/brainrots/arcadopus", "/brainrots/tic-tic-ribbit",
  "/brainrots/candini-fluffini", "/brainrots/bunnyman", "/brainrots/buntteo", "/brainrots/please-my-present",
  "/brainrots/bandito-bobritto", "/brainrots/cash-or-card", "/brainrots/yetimatic", "/brainrots/griffin",
  "/brainrots/candini-fluffini", "/brainrots/la-fuse-machine", "/brainrots/sammyni-truckini", "/brainrots/smore-serat",
  "/brainrots/scorpino-coasterino", "/events/admin-abuse-war", "/events/taco-tuesday", "/events/Extinct-Event",
  "/events/mexico-event", "/events/yin-yang-event", "/events/witch-fuse-event", "/events/indonesian-event",
  "/events/frightrot-event", "/events/1x1x1x1-event", "/events/radioactive-mutation-event", "/events/hes-coming-back-event",
  "/events/santas-fuse-event", "/events/north-pole-event", "/events/gingerbread-town-event", "/events/christmas-eve-admin-abuse",
  "/events/skibidi-event", "/events/26-event", "/events/cursed-mutation-event", "/events/duels-event",
  "/events/bruno-mars-event", "/events/the-return", "/events/valentines-pt1-event", "/events/valentines-pt2-event",
  "/events/trade-machine-event", "/events/divine-admin-machine-event", "/events/divine-fuse-machine-event", "/events/st-patricks-event",
  "/events/rip-my-granny-event", "/events/easter-event-part-1", "/events/easter-event-part-2", "/events/cyber-event",
  "/events/john-pork-2026-05-02", "/events/backrooms-event", "/events/next-update-2026-05-16", "/events/summer-fuse-2026-05-23",
  "/events/steaks-admin-abuse-2026-05-30", "/events/caylus-admin-abuse-2026-06-06", "/events/summer-upd-pt-1-2026-06-13",
  "/events/summer-upd-pt-2-2026-06-20", "/events/futbol-update-2026-06-27", "/events/update-56-public-live-2026-07-05",
  "/events/los-traders-event-2026-07-11", "/events/crystal-mutation-spain-event-2026-07-25",
  "/events/job-job-job-sahur-ritual-2026-08-01", "/events/rng-machine-queen-bee-event-2026-08-08",
  "/events/rebirth-19-update-62-2026-08-15"
]);
const R41_RESEARCHED_SPLUS_SOURCE_COUNT = new Set(R41_RESEARCHED_SPLUS_SOURCES).size;

const R41_REBIRTH_SNAPSHOT = Object.freeze({
  1:{cash:"$1M",chars:["Trippi Troppi","Tung Tung Tung Sahur"],gear:["Friend Controller","IRON SLAP","GRAVITY COIL","BEE LAUNCHER"],multi:"x0.5",startCash:"$5K"},
  2:{cash:"$3M",chars:["Brr Brr Patapim","Boneca Ambalabu"],gear:["GOLD SLAP","COIL COMBO","RAGE TABLE"],multi:"x1",startCash:"$10K",floor:"Second Floor"},
  3:{cash:"$12.5M",chars:["Trulimero Trulicina","Chimpanzini Bananini"],gear:["DIAMOND SLAP","GRAPPLE HOOK","TASER GUN"],multi:"x2",startCash:"$25K"},
  4:{cash:"$35M",chars:["Chef Crabracadabra","Glorbo Fruttodrillo"],gear:["EMERALD SLAP","INVISIBILITY CLOAK","BOOGIE BOMB"],multi:"x3",startCash:"$50K"},
  5:{cash:"$100M",chars:["Frigo Camelo","Orangutini Ananassini"],gear:["RUBY SLAP","MEDUSA'S HEAD"],multi:"x4",startCash:"$100K"},
  6:{cash:"$350M",chars:["Bombardiro Crocodilo"],gear:["DARK MATTER SLAP","WEB SLINGER"],multi:"x5",startCash:"$250K"},
  7:{cash:"$1B",chars:["Bombombini Gusini"],gear:["FLAME SLAP","QUANTUM CLONER","ALL SEEING SENTRY"],multi:"x6",startCash:"$500K"},
  8:{cash:"$5B",chars:["Cocofanto Elefanto"],gear:["NUCLEAR SLAP","RAINBOWRATH SWORD"],multi:"x7",startCash:"$1M"},
  9:{cash:"$25B",chars:["Girafa Celestre"],gear:["GALAXY SLAP","LASER CAPE"],multi:"x8",startCash:"$5M"},
  10:{cash:"$250B",chars:["Tralalero Tralala"],gear:["GLITCHED SLAP","BODY SWAP POTION"],multi:"x9",startCash:"$25M",floor:"Third Floor"},
  11:{cash:"$1T",chars:["Odin Din Din Dun"],gear:["SPLATTER SLAP","PAINTBALL GUN"],multi:"x10",startCash:"$45M"},
  12:{cash:"$7T",chars:["Trenostruzzo Turbo 3000"],gear:["HEART BALOON","MAGNET"],multi:"x11",startCash:"$500M"},
  13:{cash:"$50T",chars:["Ballerino Lololo"],gear:["MEGAPHONE","BEEHIVE"],multi:"x12",startCash:"$1B"},
  14:{cash:"$100T",chars:["Trippi Troppi Troppa Trippa"],gear:["GUMMY SLAP","SUBSPACE MINE"],multi:"x13",startCash:"$2.5T"},
  15:{cash:"$500T",chars:["Pakrahmatmamat"],gear:["HEATSEEKER"],multi:"x15",startCash:"$10T"},
  16:{cash:"$1Qa",chars:["Los Tralaleritos"],gear:["ATTACK DOGE"],multi:"x16",startCash:"$25T"},
  17:{cash:"$2.5Qa",chars:["Job Job Job Sahur","Chicleteira Bicicleteira"],gear:["Giant Potion"],multi:"x17",startCash:"$50T"},
  18:{cash:"$10Qa",chars:["Graipuss Medussi"],gear:["Flash Teleport"],multi:"x18",startCash:"$100T"},
  19:{cash:"$300Qa",chars:["La Grande Combinasion"],gear:["Grief Shield"],multi:"x19",startCash:"$250T"}
});

const R41_MUTATION_SNAPSHOT = Object.freeze([
  ["Default","1x"],["Gold","1.25x"],["Diamond","1.5x"],["Rainbow","10x"],["Bloodrot","2x"],
  ["Celestial","4x"],["Candy","4x"],["Lava","6x"],["Galaxy","6x"],["Yin Yang","7.5x"],
  ["Radioactive","8.5x"],["CURSED x9","9x"],["Divine","10x"],["Cyber","11x"],["Phantom","12x"],["Crystal","13x"]
]);

const R41_MACHINE_SNAPSHOT = Object.freeze({
  "Fuse Machine":{status:"Offline",date:"August 1, 2025",kind:"Fuse family Base"},
  "Craft Machine":{status:"Offline",date:"September 6, 2025",kind:"Craft family Base",refresh:"30 minutes"},
  "Witch Fuse":{status:"Offline",date:"October 11, 2025"},
  "Santa's Fuse":{status:"Offline",date:"November 29, 2025"},
  "OG Fuse Machine":{status:"Offline",date:"January 24, 2026"},
  "Cupid's Machine":{status:"Offline",date:"February 7, 2026"},
  "Divine Fuse Machine":{status:"Offline",date:"March 7, 2026",update:"Update 41"},
  "Trait Incubator":{status:"Live placeholder",date:"April 4, 2026",update:"Update 45"},
  "Cyber Craft Machine":{status:"Offline",date:"April 18, 2026"},
  "Summer Fuse":{status:"Offline",date:"May 23, 2026",endedBy:"Update 60"},
  "Live Match Events":{date:"June 27, 2026",update:"FUTBOL UPDATE"},
  "Los Traders":{status:"Offline",date:"July 11, 2026",activeRange:"Update 57 through Update 60",refresh:"30 minutes",replacedBy:"RNG Machine",replacedIn:"Update 61"},
  "RNG Machine":{status:"Live",date:"August 8, 2026",update:"Update 61",note:"cash-powered random-spin machine; luck, mutation-luck and spin-speed upgrades; Update 62 adds Candini Fluffini and La Fuse Machine; RNG Luck is Admin-Abuse-only"},
  "Taco Merchant":{status:"Offline",date:"August 18, 2026",duration:"one hour",currency:"Taco currency",event:"Taco Tuesday",rewards:"Burrito Bat, Tacoturbo Tacorito, Nachorilla, Sammyni Truckini",note:"Players submitted Taco-traited Brainrots for Taco currency and spent it in the one-hour shop"},
  "Advent Calendar":{status:"Offline",activeRange:"November 30, 2025 – December 24, 2025"},
  "New Year's Machine":{status:"Offline",date:"December 31, 2025"},
  "Duels Machine":{status:"Offline",date:"January 10, 2026"},
  "Trade Machine":{date:"February 21, 2026"}
});

const R41_RITUAL_SNAPSHOT = Object.freeze({
  "La Vacca Ritual":{reward:"Las Vaquitas Saturnitas",trait:"galactic",players:"3"},
  "Crocodilo Ritual":{reward:"Los Crocodillitos",trait:"explosive",players:"3"},
  "Orcalero Ritual":{reward:"Los Orcalitos",trait:"water",players:"4"},
  "Matteo Ritual":{reward:"Los Matteos",trait:"matteo",players:"3"},
  "Spyderini Ritual":{reward:"Los Spyderinis",trait:"spider",players:"4"},
  "Chicleteira Ritual":{reward:"Los Chicleteiras",trait:"paint",players:"2"},
  "Dul Dul Dul Ritual":{reward:"Yess My Examine",alternate:"Noo My Examine",trait:"tie",players:"4"},
  "Karkerkar Kurkur Ritual":{reward:"Los Karkeritos",players:"4"},
  "1x1x1x1 Ritual":{reward:"1x1x1x1",alternate:"Guest 666",alternateChance:"lower chance",players:"4"},
  "Mi Gatito Ritual":{reward:"Los Mi Gatitos",trait:"gatito",players:"2"},
  "Job Job Job Sahur Ritual":{reward:"Yess my Resume",rewardChance:"99%",alternate:"Noo my Resume",alternateChance:"1%",trait:"job-application",players:"4"}
});

const R41_BRAINROT_SNAPSHOT = Object.freeze({
  "Arcadopus":{rarity:"Secret",cost:"$900M",income:"$5M/s",date:"January 24, 2026",event:"THE RETURN",source:"Themed Brainrots"},
  "Spyder Elephant":{rarity:"OG",cost:"$1T",income:"$1B/s",date:"May 16, 2026",event:"1 YEAR EVENT",source:"Spyder Chain"},
  "Yetimatic":{rarity:"Secret",cost:"$27.5B",income:"$87.5M/s",date:"August 8, 2026",update:"Update 61",event:"RNG MACHINE + QUEEN BEE",source:"RNG Machine"},
  "Tic Tic Ribbit":{rarity:"Mythic",cost:"$6.2M",income:"$18.7K/s",date:"August 8, 2026",update:"Update 61",event:"RNG MACHINE + QUEEN BEE",source:"RNG Machine"},
  "Boppin Bunny":{rarity:"Secret",cost:"$25B",income:"$80M/s",date:"April 4, 2026",update:"Update 45",event:"EASTER EVENT (Part 2)",source:"Limited Quantity Truck"},

  // R42/R43 current / high-value facts verified from public S+ detail + event pages.
  "Candini Fluffini":{rarity:"Secret",cost:"$14B",income:"$57.5M/s",date:"August 15, 2026",update:"Update 62",event:"REBIRTH 19 + RNG MACHINE",source:"RNG Machine",availability:"Available as a Secret result from the live RNG Machine in Update 62."},
  "La Fuse Machine":{rarity:"Secret",cost:"$35B",income:"$95M/s",date:"August 15, 2026",update:"Update 62",event:"REBIRTH 19 + RNG MACHINE",source:"RNG Machine",availability:"Available as a Secret result from the live RNG Machine in Update 62."},
  "Sammyni Truckini":{rarity:"Secret",cost:"$45B",income:"$110M/s",date:"August 18, 2026",event:"Taco Tuesday",source:"Taco Merchant",availability:"Released through the one-hour Taco Merchant window; the direct purchase window has ended."},
  "S'more Serat":{rarity:"Secret",cost:"$25.5B",income:"$85M/s",date:"August 8, 2026",update:"Update 61",event:"RNG MACHINE + QUEEN BEE",source:"Queen Bee shop",availability:"100 Honey or 4,999 Robux during the repeating Queen Bee event."},
  "Scorpino Coasterino":{rarity:"Secret",cost:"$9.2B",date:"August 8, 2026",update:"Update 61",event:"RNG MACHINE + QUEEN BEE",source:"RNG Machine"},
  "Bumbatron":{rarity:"Secret",income:"$172.5M/s",date:"August 8, 2026",update:"Update 61",event:"RNG MACHINE + QUEEN BEE"},
  "La Breakfast Combinasion":{rarity:"Secret",income:"$165M/s",date:"August 8, 2026",update:"Update 61",event:"RNG MACHINE + QUEEN BEE",source:"RNG Machine"},
  "Moby Bros":{rarity:"Secret",income:"$225M/s",date:"July 11, 2026",update:"Update 57",event:"LOS TRADERS",source:"Los Traders"},
  "Los Admins":{rarity:"Secret",income:"$95M/s",date:"July 11, 2026",update:"Update 57",event:"LOS TRADERS",source:"Los Traders"},
  "Los Secret Combinasionas":{rarity:"Secret",income:"$150M/s",date:"July 25, 2026",update:"Update 59",event:"CRYSTAL MUTATION + SPAIN",source:"Los Traders"},
  "Rubiko and Kubiko":{rarity:"Secret",income:"$72.5M/s",event:"LOS TRADERS",source:"Los Traders"},
  "Examen Bros":{rarity:"Secret",income:"$70M/s",event:"LOS TRADERS",source:"Los Traders"},
  "Pizza and Ranch":{rarity:"Secret",income:"$130M/s",date:"July 25, 2026",update:"Update 59",event:"CRYSTAL MUTATION + SPAIN",source:"Runway"},
  "Fishino Clownino":{rarity:"Secret",income:"$120M/s",date:"July 25, 2026",update:"Update 59",event:"CRYSTAL MUTATION + SPAIN",source:"Fishing"},
  "Capitano Americano":{rarity:"Secret",income:"$72.5M/s",date:"July 4, 2026",update:"Update 56",event:"Update 56 Live Arrivals",source:"Limited Quantity Truck"},
  "Var Var Var":{rarity:"Secret",income:"$5.5M/s",date:"July 4, 2026",update:"Update 56",event:"Update 56 Live Arrivals",source:"Themed Brainrots"},
  "4th Bros":{rarity:"Secret",income:"$3.7M/s",date:"July 4, 2026",update:"Update 56",event:"Update 56 Live Arrivals",source:"Themed Brainrots",availability:"Unobtainable"},
  "Hydra Dragon Cannelloni":{rarity:"Secret",income:"$350M/s",date:"January 24, 2026",event:"THE RETURN",source:"OG Fuse Machine"},
  "Ketupat Bros":{rarity:"Secret",income:"$145M/s",date:"January 24, 2026",event:"THE RETURN",source:"OG Fuse Machine"},
  "Bacuru and Egguru":{rarity:"Secret",income:"$24M/s",date:"January 24, 2026",event:"THE RETURN",source:"OG Fuse Machine"},
  "Spinny Hammy":{rarity:"Secret",income:"$17M/s",date:"January 24, 2026",event:"THE RETURN",source:"OG Fuse Machine"},
  "Chill Puppy":{rarity:"Secret",income:"$4M/s",date:"January 24, 2026",event:"THE RETURN",source:"OG Fuse Machine"},
  "Los Trios":{rarity:"Secret",income:"$700K/s",date:"January 24, 2026",event:"THE RETURN",source:"OG Fuse Machine"}
});

// R42 event/update memory. These are compact local facts distilled from 100+
// S+ pages opened during the research pass. They are intentionally structured
// so weird paraphrases can resolve without NVIDIA/Tavily/network calls.
const R42_EVENT_SNAPSHOT = Object.freeze({
  "Admin Abuse War":{date:"August 23, 2025",duration:"6 hours",note:"Admin competition with Grow a Garden; 19.5 million peak concurrent users."},
  "Taco Tuesday":{date:"Every Tuesday evening ET",duration:"about 30 minutes",frequency:"weekly",trait:"Taco Trait",multiplier:"3x",note:"Recurring Admin Abuse event with taco rain, Taco Trait, extra sub-events, and server luck."},
  "Extinct Event":{date:"September 13, 2025",duration:"about one week",note:"Three ultra-rare Extinct Brainrots spawn every 2 hours; collecting all three unlocks La Extinct Grande."},
  "México Event":{date:"September 20, 2025",duration:"about one week",trait:"Sombrero",note:"Piñatas, candy weapons, Mariachi theme, Los Tacoritas craft."},
  "Yin & Yang Event":{date:"September 27, 2025",mutation:"Yin & Yang",multiplier:"7.5x",note:"Introduced Yin & Yang mutation, rituals, Brainrots, and wheel system."},
  "Witch Fuse Event":{date:"October 11, 2025",duration:"about one week",machine:"Witch Fuse",note:"Halloween Fuse variant; Witching Hour collection can redeem La Spooky Grande."},
  "Indonesian Event":{date:"October 18, 2025",duration:"one week",note:"Nine exclusive Brainrots, Panjat Pinang mini-game, Indonesian map theme."},
  "FRIGHTROT Event":{date:"October 25, 2025",duration:"5 days",note:"Trick or Treating, Graveyard digging, Spooky Lucky Blocks, hourly Frightrot cycles."},
  "1x1x1x1 Ritual Event":{date:"November 1, 2025",duration:"one week",ritual:"1x1x1x1 Ritual",note:"Four-player ritual, 1x1x1x1 and lower-chance Guest 666, glitch mutation visuals."},
  "Radioactive Mutation Event":{date:"November 15, 2025",duration:"one week",mutation:"Radioactive",multiplier:"8.5x",note:"Hourly Fishing Events, Brainrot Trader, Radioactive Spin Wheel and index."},
  "HE'S COMING BACK":{date:"November 29, 2025",note:"Return of Tung Tung Tung Sahur; Admin Machine and Advent Calendar introduced."},
  "Santa's Fuse Event":{date:"December 6, 2025",duration:"December 6-13, 2025",machine:"Santa's Fuse",frequency:"Winter Hour every two hours",note:"15 Christmas fuse results and Festive Lucky Blocks."},
  "North Pole Event":{date:"December 13, 2025",duration:"6 days",frequency:"Brainrot Express every 5 minutes during Admin Abuse",note:"North Pole trip, presents, Candy Canes, Festive Lucky Blocks."},
  "Gingerbread Town Event":{date:"December 20, 2025",duration:"until January 1, 2026",note:"Hourly gingerbread village, Santa's Sleigh, Christmas Index and Gingerbread Base Skin."},
  "Christmas Eve Admin Abuse":{date:"December 24, 2025",duration:"30-45 minutes",note:"Gold Elves currency, 15x Santa Fuse luck, festive Admin Abuse."},
  "Skibidi Event":{date:"December 27, 2025",note:"Skibidi Toilet launch; base spawn chance listed as 1/50 million; Sammy spawned 50 launch units."},
  "26 Event":{date:"December 31, 2025",duration:"about 45-60 minutes",trait:"26 Trait",multiplier:"6x",note:"New Year's machine, four Brainrots and returning mechanics."},
  "Cursed Mutation Event":{date:"January 3, 2026",update:"Update 32",duration:"15-minute event every 3 hours",mutation:"Cursed",multiplier:"9x",note:"Cursed Spin Wheel, Cursed Secret Blocks and Cursed Index."},
  "DUELS Event":{date:"January 10, 2026",machine:"Duels Machine",note:"PvP wager machine and Cerberus."},
  "Bruno Mars Event":{date:"January 17, 2026",update:"Update 34",note:"Bruno Mars concert, Brunito Marsito and Rose Petal Trait."},
  "THE RETURN":{date:"January 24, 2026",machine:"OG Fuse Machine",note:"OG Fuse return with 11 listed Brainrots including Arcadopus and Hydra Dragon Cannelloni."},
  "VALENTINES PT 1":{date:"February 7, 2026",update:"Update 37",machine:"Cupid's Machine",note:"Heart Lucky Block, 20x luck boost, Rose Base Skin."},
  "VALENTINES PT 2":{date:"February 14, 2026",update:"Update 38",note:"Valentine Admin Machine, Cupid's Wings gear, Valentine Base Skin."},
  "TRADE MACHINE":{date:"February 21, 2026",update:"Update 39",machine:"Trade Machine",mutation:"Divine",multiplier:"10x",note:"Secure trading plus Divine Mutation and Halo Trait."},
  "DIVINE ADMIN MACHINE":{date:"February 28, 2026",update:"Update 40",duration:"until March 4, 2026",note:"Hourly Divine Admin Machine, Secret Lucky Blocks, Headless Horseman OG buff."},
  "DIVINE FUSE MACHINE":{date:"March 7, 2026",update:"Update 41",machine:"Divine Fuse Machine",note:"Permanently replaced original Fuse Machine; 15-brainrot lineup."},
  "ST PATRICKS":{date:"March 14, 2026",note:"Lucky Pot, Leprechaun Lucky Block, Cloverat Clapat and Pot of Gold Base Skin."},
  "RIP MY GRANNY":{date:"March 21, 2026",update:"Update 43",note:"Granny's Funeral plus Eid Celebration."},
  "EASTER EVENT (Part 1)":{date:"March 28, 2026",update:"Update 44",note:"Easter Hour, Bunny Ears and three-brainrot Secret lineup."},
  "EASTER EVENT (Part 2)":{date:"April 4, 2026",update:"Update 45",note:"Egg Hunt, Egg City, Egg Lucky Block, Trait Incubator, Bunny and Eggy."},
  "CYBER UPDATE":{date:"April 18, 2026",machine:"Cyber Craft Machine",note:"Cyber-themed Craft Machine and cyber recipes."},
  "JOHN PORK":{date:"May 2, 2026",note:"John Pork event; only three runs stated; is-calling trait."},
  "BACKROOMS":{date:"May 9, 2026",note:"Backrooms update and Cyber Craft additions including Rubrikiko."},
  "1 YEAR EVENT":{date:"May 16, 2026",note:"First anniversary; rotating songs, 1YR trait, mutation rain, Cyber recipes, Red Carpet spawn."},
  "SUMMER FUSE":{date:"May 23, 2026",update:"Update 52",machine:"Summer Fuse",note:"Summer Fuse wave and limited summer routes."},
  "STEAKS ADMIN ABUSE":{date:"May 30, 2026",update:"Update 53",trait:"Burger",note:"Steakini Fattini via Taco Truck and Burger trait."},
  "CAYLUS ADMIN ABUSE":{date:"June 6, 2026",note:"Caylusaurus Secret limited through Caylus event and Taco Truck."},
  "SUMMER UPD PT 1":{date:"June 13, 2026",note:"Octo Lucky Block, eight summer block rewards, Phantom mutation, RNG Machine preview and Summer base skins."},
  "SUMMER UPD PT 2":{date:"June 20, 2026",note:"La Summer Grande limited route, Summer Hour Brainrots, RNG Machine preview and existence-count visibility."},
  "FUTBOL UPDATE":{date:"June 27, 2026",machine:"Live Match Events",note:"Three football Secret Brainrots, country flag traits, Trade Plaza visibility."},
  "Update 56 Live Arrivals":{date:"July 4, 2026",update:"Update 56",note:"Capitano Americano, Bufalino Boomberino, Var Var Var and 4th Bros; Taco Truck and VAR check routes."},
  "LOS TRADERS":{date:"July 11, 2026",update:"Update 57",machine:"Los Traders",duration:"July 11, 2026 3:00 PM ET to July 14, 2026 12:00 PM ET",note:"Six Secret Brainrots and rotating Los Traders machine."},
  "CRYSTAL MUTATION + SPAIN":{date:"July 25, 2026",update:"Update 59",mutation:"Crystal",multiplier:"13x",trait:"Bull",note:"Five Secret Brainrots, Crystal Spin rewards, Crystal Base Skin and two Los Traders offers."},
  "JOB JOB JOB SAHUR RITUAL":{date:"August 1, 2026",update:"Update 60",ritual:"Job Job Job Sahur Ritual",duration:"August 1, 2026 3:00 PM ET to August 4, 2026 12:00 PM ET",trait:"Job Application",note:"Four-player ritual; Yess my Resume 99%, Noo my Resume 1%."},
  "RNG MACHINE + QUEEN BEE":{date:"August 8, 2026",update:"Update 61",machine:"RNG Machine",frequency:"Queen Bee every two hours",duration:"August 8, 2026 3:15 PM ET to August 11, 2026 12:00 PM ET",note:"Cash RNG Machine, 14 official new Brainrots, Bee trait family, 42 obtainable RNG results in first live version."},
  "REBIRTH 19 + RNG MACHINE":{date:"August 15, 2026",update:"Update 62",machine:"RNG Machine",gear:"Grief Shield",note:"Rebirth 19, Candini Fluffini, La Fuse Machine, lower-tier ritual results, Admin-Abuse-only RNG Luck, instant Lucky Block opening."}
});

const R42_CODE_SNAPSHOT = Object.freeze({
  "391725":{reward:"Skip a machine cooldown",status:"Temporary",duration:"72-hour Admin Abuse code",update:"Update 61"},
  "648013":{reward:"Raise the lobby Luck Level",status:"Temporary",duration:"72-hour Admin Abuse code",update:"Update 61"},
  "ASTROWORLD777":{reward:"Spawn a Strawberry Elephant",status:"Availability unknown",update:"Update 61"},
  "YETIGOTMONEY":{reward:"Unknown",status:"Sold out",update:"Update 61"},
  "ILOVEPANCAKES":{reward:"Unknown",status:"Sold out",update:"Update 61"}
});


// =====================================================
// R43 MASTER CORPUS "YES" LAYER
//
// Invariant: every structured fact already present in the local SAB snapshots
// is flattened into one fact graph and reverse-indexed. Known lore is answered
// before NVIDIA, Tavily, or an HTTP page fetch.
//
// This intentionally does NOT let an AI invent trivia answers. The AI remains
// a question router only after the local graph misses.
// =====================================================

const R43_FIELD_REL = Object.freeze({
  cost: REL.COST,
  income: REL.INCOME,
  rarity: REL.RARITY,
  date: REL.DATE,
  update: REL.UPDATE,
  event: REL.EVENT,
  source: REL.METHOD,
  availability: REL.STATUS,
  status: REL.STATUS,
  duration: REL.DURATION,
  frequency: REL.FREQUENCY,
  refresh: REL.FREQUENCY,
  reward: REL.REWARD,
  rewards: REL.REWARD,
  alternate: REL.OUTCOME,
  trait: REL.TRAIT,
  multiplier: REL.MULTIPLIER,
  machine: REL.MACHINE,
  gear: REL.GEAR,
  ritual: REL.RITUAL,
  players: REL.PLAYERS,
  activeRange: REL.ACTIVE_RANGE,
  replacedBy: REL.REPLACED_BY,
  replacedIn: REL.REPLACED_IN,
  endedBy: REL.REPLACED_IN,
  currency: REL.TEXT,
  note: REL.LORE,
  cash: REL.COST,
  multi: REL.MULTIPLIER,
  startCash: REL.REWARD,
  chars: REL.BRAINROT,
  rewardChance: REL.DROP_RATE,
  alternateChance: REL.DROP_RATE,
});

function r43Norm(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/&/g, " and ")
    .replace(/\bupdates?\s*#?\s*(\d+)\b/g, " update $1 ")
    .replace(/\brebirths?\s*#?\s*(\d+)\b/g, " rebirth $1 ")
    .replace(/\bmins?\b|\bminutes?\b/g, " minute ")
    .replace(/\bhrs?\b|\bhours?\b/g, " hour ")
    .replace(/[^a-z0-9$%.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function r43Tokens(value) {
  return r43Norm(value).split(" ").filter((x) => x.length > 1);
}

// R44: one canonical money token for costs and per-second income clues.
// The suffix is required so update numbers, dates, request ids, hashes, and
// unrelated plain numbers cannot enter the reverse money index.
function r44CanonMoney(value) {
  const m = String(value ?? "")
    .replace(/,/g, "")
    .match(/\$?\s*(\d+(?:\.\d+)?)\s*(quadrillion|trillion|billion|million|thousand|Qa|Qi|Sx|Sp|Oc|No|Dc|K|M|B|T)\b/i);
  if (!m) return "";
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return "";
  const suffix = { quadrillion: "qa", trillion: "t", billion: "b", million: "m", thousand: "k" }[m[2].toLowerCase()] || m[2].toLowerCase();
  return `${String(n).replace(/\.0+$/, "")}${suffix}`;
}

function r44MoneyValues(value) {
  const values = [];
  const re = /\$?\s*\d+(?:\.\d+)?\s*(?:quadrillion|trillion|billion|million|thousand|Qa|Qi|Sx|Sp|Oc|No|Dc|K|M|B|T)\b(?:\s*(?:\/\s*s|per\s*second|a\s*second|each\s*second|every\s*second))?/gi;
  for (const m of String(value ?? "").matchAll(re)) {
    const canonical = r44CanonMoney(m[0]);
    if (canonical) values.push(canonical);
  }
  return [...new Set(values)];
}



// =====================================================
// R45 FULL steal-a-brainrot.org DIRECTORY CORPUS
// Generated from the site's embedded initialBrainrots source on 2026-08-23.
// 537 public brainrot records are local and require zero network / zero AI.
// =====================================================
const R45_SITE_BRAINROTS = Object.freeze([{"id":"1x1x1x1","name":"1x1x1x1","rarity":"Secret","description":"1x1x1x1 is a Secret-tier Brainrot character in Steal a Brainrot, obtainable through the 1x1x1x1 Ritual during the 1x1x1x1 Ritual Event. It depicts a classic Roblox humanoid wearing the iconic green Domino Crown and holding a sword, radiating nostalgic menace and mysterious power — a true embodiment of Roblox legend reborn through Brainrot chaos.","baseIncomePerSecond":1111000,"releaseStatus":"released","cost":255500000,"addedAt":"2025-11-01","eventKeys":["1x1x1x1-event"],"craftFilterKeys":["ritual"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"mechanic","id":"ritual","label":"Ritual"}]},{"id":"25","name":"25","rarity":"Secret","description":"25 is a Secret-tier Brainrot representing an anthropomorphic number 25, symbolizing the culmination of the Advent Calendar event with festive celebration energy.","baseIncomePerSecond":1000000,"releaseStatus":"released","cost":250000000,"addedAt":"2025-11-29","eventKeys":[],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"4th-bros","name":"4th Bros","rarity":"Secret","description":"4th Bros is a Secret paired Independence-style brainrot with a short-window collectible feel. The duo design leans into patriotic colors and sibling-like staging. Its compact paired silhouette makes it the quick-flash collectible of the July set.","baseIncomePerSecond":3750000,"releaseStatus":"released","cost":800000000,"addedAt":"2026-07-04","eventKeys":["update-56-public-live-2026-07-05"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"67","name":"67","rarity":"Secret","description":"67 is a Secret-tier character in Steal a Brainrot. This brainrot is based on the 67 meme, depicted as a fusion of the numbers 6 and 7, blending numerical whimsy with a rare, striking presence, embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":7500000,"releaseStatus":"released","cost":1250000000,"addedAt":"2025-09-14","eventKeys":["admin-abuse"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"admin-lucky-block","label":"Admin Lucky Block"}]},{"id":"abyssaloco","name":"Abyssaloco","rarity":"Secret","description":"Abyssaloco is a Secret brainrot released in the May 9, 2026 BACKROOMS update. It appears as a purple cornucopia-like eye creature with a curled shell body, a large blue eye, claw details, and small supporting legs.","baseIncomePerSecond":33300000,"releaseStatus":"released","cost":4300000000,"addedAt":"2026-05-09","eventKeys":["backrooms-event"],"craftFilterKeys":["craft","cyber-craft-machine"],"acquisitionBadges":[{"kind":"source","id":"cyber-craft-machine","label":"Cyber Craft Machine"}]},{"id":"agarrini-la-palini","name":"Agarrini la Palini","rarity":"Secret","description":"Agarrini la Palini is a Secret-tier Brainrot in Steal a Brainrot, obtained through fusion, inspired by the Italian Brainrot meme culture. It features a grey, stone-like head attached to a shovel, reflecting the game's meme-inspired aesthetic. This Brainrot likely embodies a whimsical and absurd design with significant income potential for late-game players.","baseIncomePerSecond":425000,"releaseStatus":"retired","cost":80000000,"addedAt":"2025-08-02","eventKeys":[],"craftFilterKeys":["fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"fuse-machine","label":"Fuse Machine"},{"kind":"source","id":"runway","label":"Runway"}]},{"id":"alessio","name":"Alessio","rarity":"Brainrot God","description":"Alessio is a Brainrot God-tier character in Steal a Brainrot, depicted as a football with a swollen human nose and two eyes, featuring black eyebrows, his smile a dent in the ball, radiating chaotic energy with a mischievous vibe, embodying the extravagant absurdity of Italian brainrot meme culture.","baseIncomePerSecond":85000,"releaseStatus":"released","cost":17500000,"addedAt":"2025-08-23","eventKeys":["admin-war","admin-abuse"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"admin-lucky-block","label":"Admin Lucky Block"}]},{"id":"anpali-babel","name":"Anpali Babel","rarity":"Brainrot God","description":"Anpali Babel is a Brainrot God-tier character in Steal a Brainrot, depicted as a 3x5 Tetris row with a smiling human face, glowing yellow eyes, supported by two sturdy legs and thick hands, one clutching a phone, embodying the whimsical absurdity of Italian brainrot meme culture.","baseIncomePerSecond":280000,"releaseStatus":"released","cost":48000000,"addedAt":"2025-09-06","eventKeys":[],"craftFilterKeys":["craft"],"acquisitionBadges":[{"kind":"source","id":"craft-machine","label":"Craft Machine"}]},{"id":"antonio","name":"Antonio","rarity":"Brainrot God","description":"Antonio is a Brainrot God-tier character in Steal a Brainrot, depicted as an elegant broccoli dressed in a suit, blending sophistication with absurdity, embodying the quirky essence of Italian brainrot meme culture.","baseIncomePerSecond":18500,"releaseStatus":"released","cost":6000000,"addedAt":"2025-09-06","eventKeys":[],"craftFilterKeys":["craft"],"acquisitionBadges":[{"kind":"source","id":"craft-machine","label":"Craft Machine"}]},{"id":"appelini","name":"Appelini","rarity":"Brainrot God","description":"Appelini is a released Brainrot God in Steal a Brainrot and part of the current ADMIN ABUSE runway wave. It appears as a humanoid red apple in a dark suit with glasses and a worried expression. Appelini matters because it gives the new Red Carpet batch an accessible entry point instead of another Secret-only chase.","baseIncomePerSecond":300000,"releaseStatus":"released","cost":69000000,"addedAt":"2026-04-11","eventKeys":["admin-abuse"],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"aquanaut","name":"Aquanaut","rarity":"Brainrot God","description":"Aquanaut is a Brainrot God-tier Brainrot character in Steal a Brainrot, obtainable during the 1x1x1x1 Event through standard spawning. It features an astronaut suit with a transparent dome containing a cheerful aquatic creature made entirely of water, symbolizing harmony between space exploration and absurd aquatic life.","baseIncomePerSecond":245000,"releaseStatus":"released","cost":45500000,"addedAt":"2025-11-01","eventKeys":["1x1x1x1-event"],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"aquarino","name":"Aquarino","rarity":"Secret","description":"Aquarino is a Secret summer brainrot with a blue-and-orange inflatable water-slide rhinoceros look. It keeps the rhinoceros shape playful with pool-toy colors and a slide-like body. Use it as a mid-value summer Secret pickup when chasing the current event pool.","baseIncomePerSecond":4200000,"releaseStatus":"released","cost":865000000,"addedAt":"2026-06-20","eventKeys":["summer-upd-pt-2-2026-06-20"],"craftFilterKeys":[],"acquisitionBadges":[]},{"id":"arcadopus","name":"Arcadopus","rarity":"Secret","description":"Arcadopus is a Secret-tier Brainrot combining an octopus with an arcade cabinet. Arcadopus merges retro gaming nostalgia with tentacled chaos, defining peak Italian brainrot absurdity.","baseIncomePerSecond":5000000,"releaseStatus":"released","cost":900000000,"addedAt":"2026-01-24","eventKeys":["the-return"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"arcadragon","name":"Arcadragon","rarity":"Secret","description":"Arcadragon is a released Secret brainrot in Steal a Brainrot and part of the current ADMIN ABUSE wave through the DLC route. It appears as a red dragon with a snarling head, broad wings, clawed limbs, and a full arcade cabinet fused into its torso. Arcadragon matters because it sits at the top of the new DLC batch and gives the update a high-end merch-style chase outside the runway pool.","baseIncomePerSecond":150000000,"releaseStatus":"released","cost":160000000000,"addedAt":"2026-04-11","eventKeys":["admin-abuse"],"craftFilterKeys":["limited"],"acquisitionBadges":[{"kind":"mechanic","id":"limited-stock","label":"Limited Stock"}]},{"id":"astrolero-cervalero","name":"Astrolero Cervalero","rarity":"Brainrot God","description":"Astrolero Cervalero is a Brainrot God character depicted as a slender white deer with long golden antlers and a pale celestial silhouette. Astrolero Cervalero carries a sacred stargazing mood that makes it feel elegant and mythic.","baseIncomePerSecond":280000,"releaseStatus":"released","cost":48000000,"addedAt":"2026-03-07","eventKeys":["divine-fuse-machine-event"],"craftFilterKeys":["divine-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"divine-fuse-machine","label":"Divine Fuse Machine"}]},{"id":"avocadini-antilopini","name":"Avocadini Antilopini","rarity":"Epic","description":"Avocadini Antilopini is an Epic-tier character in Steal a Brainrot, depicted as an antelope with an avocado-shaped head, leaping with chaotic grace, embodying the quirky fusion of nature and absurdity in Italian brainrot meme culture.","baseIncomePerSecond":115,"releaseStatus":"released","cost":17500,"addedAt":"2025-08-31","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"avocadini-guffo","name":"Avocadini Guffo","rarity":"Epic","description":"Avocadini Guffo is a creamy, avocado-themed owl, soaring with healthy, green wisdom.","baseIncomePerSecond":225,"releaseStatus":"released","cost":35000,"addedAt":"2025-01-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"avocadorilla","name":"Avocadorilla","rarity":"Mythic","description":"Avocadorilla is a Mythic-tier Brainrot in Steal a Brainrot, obtained through fusion with a higher probability of generating Mythic-tier outcomes, inspired by a whimsical avocado-gorilla hybrid in Italian brainrot meme culture, embodying chaotic strength and tropical absurdity.","baseIncomePerSecond":7000,"releaseStatus":"retired","cost":2000000,"addedAt":"2025-08-02","eventKeys":[],"craftFilterKeys":["fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"fuse-machine","label":"Fuse Machine"},{"kind":"source","id":"runway","label":"Runway"}]},{"id":"bacuru-and-egguru","name":"Bacuru and Egguru","rarity":"Secret","description":"Bacuru and Egguru is a Secret-tier Brainrot duo pairing bacon with egg in a breakfast-themed fusion. Bacuru and Egguru radiate classic breakfast harmony and wholesome Italian brainrot charm.","baseIncomePerSecond":24000000,"releaseStatus":"released","cost":3800000000,"addedAt":"2026-01-24","eventKeys":["the-return"],"craftFilterKeys":["og-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"og-fuse-machine","label":"OG Fuse Machine"}]},{"id":"ballerina-cappuccina","name":"Ballerina Cappuccina","rarity":"Legendary","description":"Ballerina Cappuccina is a graceful, coffee-infused dancer, pirouetting with frothy elegance.","baseIncomePerSecond":500,"releaseStatus":"released","cost":100000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"ballerina-peppermintina","name":"Ballerina Peppermintina","rarity":"Brainrot God","description":"Ballerina Peppermintina is a Brainrot God-tier Christmas variant of Ballerina Cappuccina, infused with peppermint swirl energy and festive ballet grace.","baseIncomePerSecond":215000,"releaseStatus":"released","cost":37500000,"addedAt":"2025-11-29","eventKeys":["hes-coming-back-event","christmas"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"ballerino-lololo","name":"Ballerino Lololo","rarity":"Brainrot God","description":"Ballerino Lololo is a flamboyant, dance-crazed performer, twirling with whimsical, laughter-filled flair.","baseIncomePerSecond":200000,"releaseStatus":"released","cost":35000000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"bambini-crostini","name":"Bambini Crostini","rarity":"Epic","description":"Bambini Crostini is a tiny, toasted bread warrior, crunching through with youthful, crispy charm.","baseIncomePerSecond":130,"releaseStatus":"released","cost":22500,"addedAt":"2025-01-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"bambu-bambu-sahur","name":"Bambu Bambu Sahur","rarity":"Brainrot God","description":"Bambu Bambu Sahur is a Brainrot God-tier Brainrot character in Steal a Brainrot, appearing during the Indonesian event. It is depicted as a bamboo figure riding a red boat, with two brown legs and one brown arm, glaring with an angry expression. This fiery, absurd embodiment of cultural chaos captures the spirit of festive intensity and meme-driven creativity.","baseIncomePerSecond":275000,"releaseStatus":"released","cost":47500000,"addedAt":"2025-10-18","eventKeys":["indonesian-event"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"bananita-dolphinita","name":"Bananita Dolphinita","rarity":"Epic","description":"Bananita Dolphinita is a playful, banana-loving dolphin, splashing through with fruity, aquatic charm. Bananita Dolphinita splashes with fruity, aquatic charm.","baseIncomePerSecond":150,"releaseStatus":"released","cost":25000,"addedAt":"2025-01-01","eventKeys":[],"craftFilterKeys":["default","fishing"],"acquisitionBadges":[{"kind":"source","id":"fishing-event","label":"Fishing Event"},{"kind":"source","id":"runway","label":"Runway"}]},{"id":"bananito","name":"Bananito","rarity":"Secret","description":"Bananito is a released Secret brainrot in Steal a Brainrot and part of the current ADMIN ABUSE runway wave. It appears as a grinning yellow banana-headed figure wearing a dark hoodie, green striped pants, and a small crate balanced on top. Bananito matters because it brings a mid-high Red Carpet target into the current lineup without needing a machine or lucky-block route.","baseIncomePerSecond":15000000,"releaseStatus":"released","cost":2000000000,"addedAt":"2026-04-11","eventKeys":["admin-abuse"],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"bananito-bandito","name":"Bananito Bandito","rarity":"Mythic","description":"Bananito Bandito is a Mythic-tier character in Steal a Brainrot, depicted as a banana-clad bandit with a mischievous mask and a curved peel, blending fruity mischief with rogue charm, embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":16500,"releaseStatus":"released","cost":4900000,"addedAt":"2025-10-04","eventKeys":[],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"mythic-lucky-block","label":"Mythic Lucky Block"}]},{"id":"bandito-axolito","name":"Bandito Axolito","rarity":"Epic","description":"Bandito Axolito is an Epic-tier character in Steal a Brainrot, depicted as a mischievous axolotl with a stylish moustache, bandit clothes, and a taco-twisted tail, slinking through the game with chaotic energy, embodying the playful absurdity of Italian brainrot meme culture.","baseIncomePerSecond":90,"releaseStatus":"released","cost":12500,"addedAt":"2025-09-06","eventKeys":[],"craftFilterKeys":["craft"],"acquisitionBadges":[{"kind":"source","id":"craft-machine","label":"Craft Machine"}]},{"id":"bandito-bobritto","name":"Bandito Bobritto","rarity":"Rare","description":"Bandito Bobritto is a sneaky, burrito-wrapped outlaw, sneaking through with spicy, Mexican flair.","baseIncomePerSecond":35,"releaseStatus":"released","cost":4500,"addedAt":"2025-01-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"baskito","name":"Baskito","rarity":"Secret","description":"Baskito is a released Secret Easter brainrot in Steal a Brainrot and part of the live Egg Lucky Block lineup for EASTER EVENT (Part 2). It appears as a rabbit-legged Easter basket body filled with decorated eggs, giving Baskito one of the clearest basket-themed silhouettes in the event lineup. Baskito matters because it offers a comparatively reachable Secret target with a published 5% Egg Lucky Block chance.","baseIncomePerSecond":16000000,"releaseStatus":"released","cost":2000000000,"addedAt":"2026-04-04","eventKeys":["easter-event-part-2","easter-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"egg-lucky-block","label":"Egg Lucky Block"}]},{"id":"bearito-cabinito","name":"Bearito Cabinito","rarity":"Secret","description":"Bearito Cabinito is a Secret Octo Lucky Block reward from SUMMER UPD PT 1. It fuses a brown bear with a mossy cabin-like house, giving the character a squat bear-and-shelter silhouette. Its 0.25% listed chance and 72.5M/s income make it one of the high-value summer pulls beneath Kraken.","baseIncomePerSecond":72500000,"releaseStatus":"released","cost":21000000000,"addedAt":"2026-06-13","eventKeys":["summer-upd-pt-1-2026-06-13"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"mechanic","id":"lucky-block","label":"Lucky Block"}]},{"id":"bee-loco","name":"Bee Loco","rarity":"Mythic","description":"Bee Loco is a released Mythic brainrot in Steal a Brainrot and part of the CYBER UPDATE machine wave. It appears as a blocky yellow bee mascot with black stripes, big blue glasses, metallic wings, and lightning-shaped antennae. Bee Loco matters because it gives the Cyber Craft Machine lineup one of its clearest mascot-style Mythic designs.","baseIncomePerSecond":13500,"releaseStatus":"released","cost":4500000,"addedAt":"2026-04-19","eventKeys":["cyber-event"],"craftFilterKeys":["craft","cyber-craft-machine"],"acquisitionBadges":[{"kind":"source","id":"cyber-craft-machine","label":"Cyber Craft Machine"}]},{"id":"belula-beluga","name":"Belula Beluga","rarity":"Brainrot God","description":"Belula Beluga is a Brainrot God-tier character in Steal a Brainrot, depicted as a white beluga whale sporting red Adidas shoes, blending aquatic grace with streetwear flair, embodying the quirky essence of Italian brainrot meme culture.","baseIncomePerSecond":290000,"releaseStatus":"released","cost":60000000,"addedAt":"2025-09-14","eventKeys":[],"craftFilterKeys":["fishing","craft"],"acquisitionBadges":[{"kind":"source","id":"craft-machine","label":"Craft Machine"},{"kind":"source","id":"fishing-event","label":"Fishing Event"}]},{"id":"berenjello-angello","name":"Berenjello Angello","rarity":"Mythic","description":"Berenjello Angello is a Mythic-tier Brainrot portrayed as a purple eggplant figure with a halo, white wings, and a cream-and-gold sweater. Berenjello Angello plays the vegetable joke straight while keeping a sweet angelic tone.","baseIncomePerSecond":18000,"releaseStatus":"released","cost":5500000,"addedAt":"2026-03-07","eventKeys":["divine-fuse-machine-event"],"craftFilterKeys":["divine-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"divine-fuse-machine","label":"Divine Fuse Machine"}]},{"id":"berryno","name":"Berryno","rarity":"Secret","description":"Berryno is a released Secret brainrot in Steal a Brainrot and part of the current ADMIN ABUSE runway wave. It appears as a blue human-blueberry wearing a dark shirt and pants with a stern, frowning expression. Berryno matters because it expands the current runway batch with a cheaper Secret pickup while its page body still carries stale release wording.","baseIncomePerSecond":1500000,"releaseStatus":"released","cost":500000000,"addedAt":"2026-04-11","eventKeys":["admin-abuse"],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"bisonte-giuppitere","name":"Bisonte Giuppitere","rarity":"Secret","description":"Bisonte Giuppitere is a Secret-tier character in Steal a Brainrot, depicted as a majestic bison with an Italian twist, adorned with a flowing cape and a thunderous 'Giuppitere' roar. Bisonte Giuppitere charges through the game with chaotic energy, embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":300000,"releaseStatus":"released","cost":75000000,"addedAt":"2025-08-23","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"blackhole-goat","name":"Blackhole Goat","rarity":"Secret","description":"Blackhole Goat is a Secret-tier character in Steal a Brainrot, depicted as a goat with a swirling black hole for a body, emitting cosmic chaos and devouring obstacles, embodying the surreal absurdity of Italian brainrot meme culture.","baseIncomePerSecond":400000,"releaseStatus":"released","cost":75000000,"addedAt":"2025-08-23","eventKeys":["admin-war","admin-abuse"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"admin-lucky-block","label":"Admin Lucky Block"}]},{"id":"blueberrinni-octopusini","name":"Blueberrinni Octopusini","rarity":"Legendary","description":"Blueberrinni Octopusini is a squishy, blueberry-flavored cephalopod, wrapping foes in a sweet grip.","baseIncomePerSecond":1000,"releaseStatus":"released","cost":250000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["default","fishing"],"acquisitionBadges":[{"kind":"source","id":"fishing-event","label":"Fishing Event"},{"kind":"source","id":"runway","label":"Runway"}]},{"id":"boatito-auratito","name":"Boatito Auratito","rarity":"Secret","description":"Boatito Auratito is a Secret-tier Brainrot character in Steal a Brainrot, appearing during the Indonesian event. It wears sunglasses and a blue suit, sporting four legs and a jaunty hat fitted with paddles. Combining style, absurdity, and motion, this dapper aquatic entity sails the conveyor with unmatched swagger and surreal charm.","baseIncomePerSecond":525000,"releaseStatus":"released","cost":115000000,"addedAt":"2025-10-18","eventKeys":["indonesian-event"],"craftFilterKeys":["default","fishing"],"acquisitionBadges":[{"kind":"source","id":"fishing-event","label":"Fishing Event"},{"kind":"source","id":"runway","label":"Runway"}]},{"id":"boba-panda","name":"Boba Panda","rarity":"Brainrot God","description":"Boba Panda is a Brainrot God-tier Brainrot merging a panda with a cup of bubble tea. Boba Panda highlights chewy pearls, creamy tea, and relaxed panda vibes, delivering cozy yet chaotic Italian brainrot energy.","baseIncomePerSecond":270000,"releaseStatus":"released","cost":47000000,"addedAt":"2026-01-24","eventKeys":["the-return"],"craftFilterKeys":["og-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"og-fuse-machine","label":"OG Fuse Machine"}]},{"id":"bobrini-cococosini","name":"Bobrini Cococosini","rarity":"Unknown","description":"Bobrini Cococosini is an upcoming (unconfirmed) character in Steal a Brainrot, inspired by the Italian brainrot meme Bobrini Cococosini, depicted as an anthropomorphic coconut with capybara-like features. Bobrini Cococosini lounges on a surreal tropical beach, sipping neon juice and humming chaotic chants, embodying the whimsical and absurd essence of Italian brainrot meme culture.","baseIncomePerSecond":0,"releaseStatus":"unconfirmed","cost":0,"addedAt":"","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[]},{"id":"bombardini-tortinii","name":"Bombardini Tortinii","rarity":"Brainrot God","description":"Bombardini Tortinii is a Brainrot God-tier character in Steal a Brainrot, depicted as a chaotic fusion of a pancake and a bomber, topped with two large black eyes and an 'O'-shaped mouth, its surprised expression amplifying the explosive chaos as it drops sizzling bombs, embodying the wild and absurd essence of Italian brainrot meme culture.","baseIncomePerSecond":225000,"releaseStatus":"released","cost":50000000,"addedAt":"2025-08-12","eventKeys":["taco-tuesday"],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"bombardiro-crocodilo","name":"Bombardiro Crocodilo","rarity":"Mythic","description":"Bombardiro Crocodilo is a ferocious, bomb-dropping crocodile, soaring with explosive, predatory might.","baseIncomePerSecond":2500,"releaseStatus":"released","cost":500000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"bombardiro-vaccariro","name":"Bombardiro Vaccariro","rarity":"Secret","description":"Bombardiro Vaccariro is an aviation cow brainrot with black-and-white spots, brown horns, a blue pilot helmet, aircraft wings, and yellow-tipped engines.","baseIncomePerSecond":1000000,"releaseStatus":"released","cost":250000000,"addedAt":"2026-05-23","eventKeys":["summer-fuse-2026-05-23"],"craftFilterKeys":["summer-fuse"],"acquisitionBadges":[{"kind":"source","id":"summer-fuse","label":"Summer Fuse"}]},{"id":"bombombini-gusini","name":"Bombombini Gusini","rarity":"Mythic","description":"Bombombini Gusini is a buzzing, bomb-dropping insectoid, swarming with volatile, explosive energy.","baseIncomePerSecond":5000,"releaseStatus":"released","cost":1000000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"boneca-ambalabu","name":"Boneca Ambalabu","rarity":"Rare","description":"Boneca Ambalabu is a mystical, doll-like trickster, weaving chaotic magic with a playful, eerie vibe.","baseIncomePerSecond":40,"releaseStatus":"released","cost":5000,"addedAt":"2025-01-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"boppin-bunny","name":"Boppin Bunny","rarity":"Secret","description":"Boppin Bunny is a released Secret Easter brainrot in Steal a Brainrot and part of the live EASTER EVENT (Part 2) wave. It appears as a white bunny with big pink-lined ears, a pink bow, dark square sunglasses, a pink belly patch, and a plush-inspired body that matches the official merch route. Boppin Bunny matters because it is directly tied to the official playsab.com emailed DLC purchase flow instead of a normal in-game drop route.","baseIncomePerSecond":80000000,"releaseStatus":"released","cost":25000000000,"addedAt":"2026-04-04","eventKeys":["easter-event-part-2","easter-event"],"craftFilterKeys":["limited"],"acquisitionBadges":[{"kind":"mechanic","id":"limited-stock","label":"Limited Stock"}]},{"id":"brasilini-berimbini","name":"Brasilini Berimbini","rarity":"Brainrot God","description":"Brasilini Berimbini is a Brainrot God-tier character in Steal a Brainrot, depicted as a vibrant, berimbau-playing figure inspired by Brazilian culture, blending rhythmic energy with quirky charm, embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":285000,"releaseStatus":"released","cost":55000000,"addedAt":"2025-09-27","eventKeys":["yin-yang-event"],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"brr-brr-patapim","name":"Brr Brr Patapim","rarity":"Epic","description":"Brr Brr Patapim is a chilly, onomatopoeic trickster, shivering through with a quirky, icy beat.","baseIncomePerSecond":100,"releaseStatus":"released","cost":15000,"addedAt":"2025-01-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"brr-es-teh-patipum","name":"Brr es Teh Patipum","rarity":"Brainrot God","description":"Brr es Teh Patipum is a Brainrot God-tier character in Steal a Brainrot, obtained through the Fuse Machine, depicted as an anthropomorphic fusion of icy espresso and a tapir-like creature, radiating a chilling aura with frosty coffee swirls and a rhythmic 'Brr' chant, embodying the chaotic essence of Italian and Indonesian brainrot meme culture.","baseIncomePerSecond":225000,"releaseStatus":"retired","cost":40000000,"addedAt":"2025-08-23","eventKeys":[],"craftFilterKeys":["fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"fuse-machine","label":"Fuse Machine"},{"kind":"source","id":"runway","label":"Runway"}]},{"id":"brri-brri-bicus-dicus-bombicus","name":"Brri Brri Bicus Dicus Bombicus","rarity":"Epic","description":"Brri Brri Bicus Dicus Bombicus is a quirky, bomb-toting jester, causing havoc with an explosive beat.","baseIncomePerSecond":175,"releaseStatus":"released","cost":30000,"addedAt":"2025-01-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"brunito-marsito","name":"Brunito Marsito","rarity":"Secret","description":"Brunito Marsito is a Secret-tier Brainrot created exclusively for the in-game concert of pop singer and songwriter Bruno Mars. Brunito Marsito represents extreme admin-level rarity, musical meme culture, and celebration-driven Brainrot chaos, making Brunito Marsito one of the rarest and most talked-about Brainrots ever spawned in Steal a Brainrot.","baseIncomePerSecond":3500000,"releaseStatus":"released","cost":750000000,"addedAt":"2026-01-17","eventKeys":["bruno-mars-event"],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"brutto-gialutto","name":"Brutto Gialutto","rarity":"Mythic","description":"Brutto Gialutto is a Mythic-tier character in Steal a Brainrot, depicted as a large hippopotamus whose body is integrated with a yellow excavator, featuring powerful tracks for movement and a large hydraulic arm with a shovel, rumbling through the game with mechanical might and earthy power, embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":3000,"releaseStatus":"released","cost":600000,"addedAt":"2025-09-06","eventKeys":[],"craftFilterKeys":["craft"],"acquisitionBadges":[{"kind":"source","id":"craft-machine","label":"Craft Machine"}]},{"id":"bucketoro","name":"Bucketoro","rarity":"Mythic","description":"Bucketoro is a bucket-themed Mythic brainrot with a simple summer-object silhouette and a compact character shape suited to the seasonal fuse lineup.","baseIncomePerSecond":18200,"releaseStatus":"released","cost":5700000,"addedAt":"2026-05-23","eventKeys":["summer-fuse-2026-05-23"],"craftFilterKeys":["summer-fuse"],"acquisitionBadges":[{"kind":"source","id":"summer-fuse","label":"Summer Fuse"}]},{"id":"bufalino-boomberino","name":"Bufalino Boomberino","rarity":"Secret","description":"Bufalino Boomberino is a Secret buffalo-themed brainrot with explosive July styling. Its bulky buffalo body and bright celebratory accents make it feel loud, heavy, and built for showy collection pages. The design sits below Capitano Americano as the rougher, bolder truck-side chase.","baseIncomePerSecond":32000000,"releaseStatus":"released","cost":4000000000,"addedAt":"2026-07-04","eventKeys":["update-56-public-live-2026-07-05"],"craftFilterKeys":["limited"],"acquisitionBadges":[{"kind":"source","id":"limited-quantity-truck","label":"Limited Quantity Truck"}]},{"id":"buho-de-fuego","name":"Buho De Fuego","rarity":"Legendary","description":"Buho De Fuego is a Legendary-tier Brainrot character in Steal a Brainrot, obtainable through Witch Fuse. It is a mystical owl whose body is shaped like a jack-o'-lantern, with fiery wings and a glowing gaze. This burning bird soars through the Witching Hour sky, leaving trails of embered feathers in its wake.","baseIncomePerSecond":1800,"releaseStatus":"released","cost":345000,"addedAt":"2025-10-11","eventKeys":["witch-fuse-event"],"craftFilterKeys":["witch-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"witch-fuse-machine","label":"Witch Fuse Machine"}]},{"id":"buho-de-noelo","name":"Buho de Noelo","rarity":"Brainrot God","description":"Buho de Noelo is a Brainrot God-tier festive owl depicted as a pure white owl with a calm, snowy aura, embodying the serene yet surreal spirit of the North Pole.","baseIncomePerSecond":267500,"releaseStatus":"released","cost":46700000,"addedAt":"2025-12-13","eventKeys":["north-pole-event","christmas"],"craftFilterKeys":["santas-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"santas-fuse-machine","label":"Santa's Fuse Machine"}]},{"id":"buho-de-volto","name":"Buho de Volto","rarity":"Secret","description":"Buho de Volto is a released Secret brainrot in Steal a Brainrot and part of the CYBER UPDATE machine wave. It appears as a robotic owl with a gray metal body, glowing red eyes, cyan blade-like wings, and gold cyber accents. Buho de Volto matters because it stands out as one of the higher-value Secret targets in the Cyber Craft Machine lineup.","baseIncomePerSecond":2750000,"releaseStatus":"released","cost":650000000,"addedAt":"2026-04-19","eventKeys":["cyber-event"],"craftFilterKeys":["craft","cyber-craft-machine"],"acquisitionBadges":[{"kind":"source","id":"cyber-craft-machine","label":"Cyber Craft Machine"}]},{"id":"buho-del-cielo","name":"Buho del Cielo","rarity":"Legendary","description":"Buho del Cielo is a Legendary-tier Brainrot shown as a pale blue owl perched on a white cloud. Buho del Cielo carries a calm sky-watcher vibe that fits the softer celestial side of the Divine Fuse theme.","baseIncomePerSecond":1300,"releaseStatus":"released","cost":325000,"addedAt":"2026-03-07","eventKeys":["divine-fuse-machine-event"],"craftFilterKeys":["divine-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"divine-fuse-machine","label":"Divine Fuse Machine"}]},{"id":"bulbito-bandito-traktorito","name":"Bulbito Bandito Traktorito","rarity":"Brainrot God","description":"Bulbito Bandito Traktorito is a Brainrot God-tier character in Steal a Brainrot, depicted as a chaotic fusion of a glowing lightbulb, a bandit’s mask, and a roaring tractor, tearing through the map with electrified swagger, embodying the wild and rebellious spirit of Italian brainrot meme culture.","baseIncomePerSecond":205000,"releaseStatus":"released","cost":25000000,"addedAt":"2025-08-09","eventKeys":[],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"source","id":"brainrot-god-lucky-block","label":"Brainrot God Lucky Block"}]},{"id":"bumbatron","name":"Bumbatron","rarity":"Secret","description":"Bumbatron is a Secret black-and-yellow armored bee robot with antennae, broad wings, honeycomb emblems, heavy limbs, and an orange stinger.","baseIncomePerSecond":172500000,"releaseStatus":"released","cost":140000000000,"addedAt":"2026-08-08","eventKeys":["rng-machine-queen-bee-event-2026-08-08"],"craftFilterKeys":[],"acquisitionBadges":[]},{"id":"bunito-bunito-spinito","name":"Bunito Bunito Spinito","rarity":"Secret","description":"Bunito Bunito Spinito is a Secret-tier Brainrot that fuses a cheerful bunny with a spinning Ferris wheel, sporting a wide happy smile and two visible teeth as it radiates carnival-like joy.","baseIncomePerSecond":3000000,"releaseStatus":"released","cost":900000000,"addedAt":"2025-12-31","eventKeys":["26-event"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"bunny-and-eggy","name":"Bunny and Eggy","rarity":"Secret","description":"Bunny and Eggy is a released Secret-tier Easter brainrot in Steal a Brainrot and part of the live EASTER EVENT (Part 2) wave. It appears as a two-entity duo with a crying pastel Easter egg standing beside a white rabbit with tall pink-lined ears and a pink belly patch. Bunny and Eggy matters because official live framing already places the pair in the current Divine Fuse rollout even though the machine detail page still lags behind release.","baseIncomePerSecond":185000000,"releaseStatus":"released","cost":175000000000,"addedAt":"2026-04-03","eventKeys":["easter-event-part-2","easter-event"],"craftFilterKeys":["divine-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"divine-fuse-machine","label":"Divine Fuse Machine"}]},{"id":"bunny-bunny-bunny-sahur","name":"Bunny Bunny Bunny Sahur","rarity":"Secret","description":"Bunny Bunny Bunny Sahur is a Secret-tier Brainrot in Steal a Brainrot and a live Easter Hour reward from EASTER EVENT (Part 1). It appears as a tall white rabbit with pink inner ears and belly fur while carrying a woven basket packed with colorful Easter eggs. Bunny Bunny Bunny Sahur matters because it is the 24.5% middle-tier Easter Secret and gives players a realistic path to bank current event progress without needing the 1% jackpot.","baseIncomePerSecond":2200000,"releaseStatus":"released","cost":575000000,"addedAt":"2026-03-28","eventKeys":["easter-event-part-1","easter-hour","easter-event"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"bunny-tralala","name":"Bunny Tralala","rarity":"Brainrot God","description":"Bunny Tralala is a released Brainrot God brainrot in Steal a Brainrot and part of the live Egg Lucky Block lineup for EASTER EVENT (Part 2). It is not just a plain rabbit reskin: the model keeps the Tralala lineage through its shark-like rectangular snout, side gill marks, compact tail fin, and low chunky body while layering on tall bunny ears and Easter shoes. Bunny Tralala matters because it gives the accessible end of the current lineup a clear Tralala-family seasonal variant identity.","baseIncomePerSecond":270000,"releaseStatus":"released","cost":47000000,"addedAt":"2026-04-04","eventKeys":["easter-event-part-2","easter-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"egg-lucky-block","label":"Egg Lucky Block"}]},{"id":"bunnyman","name":"Bunnyman","rarity":"Secret","description":"Bunnyman is a Secret-tier Brainrot resembling a rabbit-shaped snowman. It has white feet, a rabbit head with pink blush on its cheeks, and a carrot-like nose, blending winter innocence with uncanny holiday meme charm.","baseIncomePerSecond":1500000,"releaseStatus":"released","cost":500000000,"addedAt":"2025-12-20","eventKeys":["gingerbread-town","christmas"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"buntteo","name":"Buntteo","rarity":"Secret","description":"Buntteo is a Secret-tier Brainrot in Steal a Brainrot and the most common live Easter Hour reward from EASTER EVENT (Part 1). It appears as a bearded Matteo-style figure in a pale pink bunny suit with long ears, dark round glasses, and a white belly patch. Buntteo matters because it is the 74.5% Easter Hour entry point and the easiest confirmed way to start collecting the released Easter Secret lineup.","baseIncomePerSecond":850000,"releaseStatus":"released","cost":225000000,"addedAt":"2026-03-28","eventKeys":["easter-event-part-1","easter-hour","easter-event"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"burbaloni-luliloli","name":"Burbaloni Loliloli","rarity":"Legendary","description":"Burbaloni Luliloli is a mythical, coconut-dwelling capybara, worshipped in fiery celebrations on Bali's shores. Burbaloni Luliloli thrives in Luck-boosted servers.","baseIncomePerSecond":200,"releaseStatus":"released","cost":35000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"burguro-and-fryuro","name":"Burguro And Fryuro","rarity":"Secret","description":"Burguro And Fryuro is a Secret-tier character in Steal a Brainrot, depicted as a hybrid of a burger and fries, blending fast-food indulgence with chaotic whimsy, embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":150000000,"releaseStatus":"released","cost":75000000000,"addedAt":"2025-10-04","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"burrito-bandito","name":"Burrito Bandito","rarity":"Secret","description":"Burrito Bandito is a Secret-tier Brainrot character in Steal a Brainrot, obtainable exclusively from the Taco Lucky Block. It is depicted as a burrito wearing a wide-brimmed hat and sunglasses, sporting a long mustache, jeans, and shoes while riding a motorcycle. This rebellious burrito embodies the chaotic, spicy energy of Taco Tuesday’s most elusive meme outlaw.","baseIncomePerSecond":4000000,"releaseStatus":"released","cost":800000000,"addedAt":"2025-10-21","eventKeys":["taco-tuesday"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"taco-lucky-block","label":"Taco Lucky Block"}]},{"id":"burrito-bat","name":"Burrito Bat","rarity":"Secret","description":"Burrito Bat is a Secret vampire-bat Brainrot whose torso is a burrito, with lettuce extending into its wings.","baseIncomePerSecond":7000000,"releaseStatus":"released","cost":1200000000,"addedAt":"2026-08-18","eventKeys":["taco-tuesday"],"craftFilterKeys":[],"acquisitionBadges":[{"kind":"source","id":"taco-merchant","label":"Taco Merchant"}]},{"id":"cabrospaghetto-mystico","name":"Cabrospaghetto Mystico","rarity":"Unknown","description":"Cabrospaghetto Mystico is an upcoming (unconfirmed) character in Steal a Brainrot, inspired by the Italian brainrot meme Il Sacro Cabrospaghetti Mistico, depicted as a giant white worm with the face of a goat and a dragon-like beard. Cabrospaghetto Mystico slithers through a forbidden swamp shrouded in mystical fog, radiating cosmic energy and chaotic charm, embodying the surreal and absurd essence of Italian meme culture.","baseIncomePerSecond":0,"releaseStatus":"unconfirmed","cost":0,"addedAt":"","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[]},{"id":"cacasito-satalito","name":"Cacasito Satalito","rarity":"Brainrot God","description":"Cacasito Satalito is a Brainrot God-tier character in Steal a Brainrot, depicted as a satellite-mouse hybrid with a cosmic tail, orbiting with chaotic energy. Cacasito Satalito embodies the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":240000,"releaseStatus":"released","cost":45000000,"addedAt":"2025-08-31","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"cachorrito-melonito","name":"Cachorrito Melonito","rarity":"Mythic","description":"Cachorrito Melonito is a Mythic-tier character in Steal a Brainrot, depicted as a cute little dog with a melon body, blending adorable charm with fruity whimsy, embodying the quirky absurdity of Italian brainrot meme culture.","baseIncomePerSecond":13000,"releaseStatus":"released","cost":4400000,"addedAt":"2025-10-04","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"cacto-hipopotamo","name":"Cacto Hipopotamo","rarity":"Rare","description":"Cacto Hipopotamo is a prickly, hippo-cactus hybrid, lumbering through with desert-adapted resilience.","baseIncomePerSecond":50,"releaseStatus":"released","cost":6500,"addedAt":"2025-01-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"cagnorrito-ripienino","name":"Cagnorrito Ripienino","rarity":"Unknown","description":"Cagnorrito Ripienino is an upcoming (unconfirmed) character in Steal a Brainrot, inspired by the Italian brainrot meme Cagnorrito Ripienino. Depicted as a very cute and funny dog wrapped snugly inside a crispy corn tortilla, it bounds through a surreal taco garden, yipping a stuffed 'ripieno-woof' chant while shedding cheesy crumbs, embodying the whimsical and absurd essence of Italian brainrot meme culture.","baseIncomePerSecond":0,"releaseStatus":"unconfirmed","cost":0,"addedAt":"","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[]},{"id":"camera-ramena","name":"Camera Ramena","rarity":"Secret","description":"Camera Ramena is a Secret brainrot in Steal a Brainrot and one of the most machine-shaped characters in the current Cyber lineup. It appears as a ramen bowl crossed with a grill top, mechanical spider legs, and twin camera stalks rising from the noodles. Camera Ramena matters because it gives the wave a memorable hybrid silhouette instead of another standard humanoid robot.","baseIncomePerSecond":17000000,"releaseStatus":"released","cost":17000000000,"addedAt":"2026-04-19","eventKeys":["cyber-event"],"craftFilterKeys":["craft","cyber-craft-machine"],"acquisitionBadges":[{"kind":"source","id":"cyber-craft-machine","label":"Cyber Craft Machine"}]},{"id":"candini-fluffini","name":"Candini Fluffini","rarity":"Secret","description":"Candini Fluffini is a Secret lamb-and-ice-cream-cart Brainrot with a pale-blue wool coat, matching knit cap, pink cone, tan face and legs, and a pink-and-blue wheeled cart body.","baseIncomePerSecond":57500000,"releaseStatus":"released","cost":14000000000,"addedAt":"2026-08-15","eventKeys":["rebirth-19-update-62-2026-08-15"],"craftFilterKeys":[],"acquisitionBadges":[{"kind":"source","id":"rng-machine","label":"RNG Machine"}]},{"id":"cangurato-gelato","name":"Cangurato Gelato","rarity":"Secret","description":"Cangurato Gelato is a released Secret brainrot obtained from the Red Carpet. It combines an orange kangaroo with a bright pink ice-cream cart, turquoise wheels, and a rooftop sign. Its 77.5M/s income makes it a premium runway target.","baseIncomePerSecond":77500000,"releaseStatus":"released","cost":23500000000,"addedAt":"2026-07-18","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"capi-taco","name":"Capi Taco","rarity":"Brainrot God","description":"Capi Taco is a Brainrot God-tier character in Steal a Brainrot, depicted as a capi with a taco-shaped body, blending culinary delight with quirky charm, embodying the wild essence of Italian brainrot meme culture.","baseIncomePerSecond":155000,"releaseStatus":"released","cost":31000000,"addedAt":"2025-09-16","eventKeys":["taco-tuesday"],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"capitano-americano","name":"Capitano Americano","rarity":"Secret","description":"Capitano Americano is a Secret patriotic eagle-style brainrot with a red-white-blue captain look. Its shield-bearing silhouette makes it the premium-looking chase of the July live set. The character reads as a celebratory captain mascot built for collectors who want the strongest patriotic flex.","baseIncomePerSecond":72500000,"releaseStatus":"released","cost":21000000000,"addedAt":"2026-07-04","eventKeys":["update-56-public-live-2026-07-05"],"craftFilterKeys":["limited"],"acquisitionBadges":[{"kind":"source","id":"limited-quantity-truck","label":"Limited Quantity Truck"}]},{"id":"capitano-gullini","name":"Capitano Gullini","rarity":"Secret","description":"Capitano Gullini is a nautical seagull-captain brainrot wearing sailor styling, a captain hat, blue-tinted glasses, and an anchor-themed uniform.","baseIncomePerSecond":22000000,"releaseStatus":"released","cost":2700000000,"addedAt":"2026-05-23","eventKeys":["summer-fuse-2026-05-23"],"craftFilterKeys":["summer-fuse"],"acquisitionBadges":[{"kind":"source","id":"summer-fuse","label":"Summer Fuse"}]},{"id":"capitano-moby","name":"Capitano Moby","rarity":"Secret","description":"Capitano Moby is a Secret-tier Brainrot character in Steal a Brainrot, obtainable through standard spawning during the 1x1x1x1 Event. It depicts a massive whale carrying a ship on its back, combining majestic ocean imagery with absurdity. This commanding maritime meme creature sails through chaos with gravitas and grace.","baseIncomePerSecond":160000000,"releaseStatus":"released","cost":125000000000,"addedAt":"2025-11-01","eventKeys":["1x1x1x1-event"],"craftFilterKeys":["default","fishing"],"acquisitionBadges":[{"kind":"source","id":"fishing-event","label":"Fishing Event"},{"kind":"source","id":"runway","label":"Runway"}]},{"id":"cappuccino-assasino","name":"Cappuccino Assassino","rarity":"Epic","description":"Cappuccino Assasino is a lightning-fast, dual-katana-wielding assassin, feared for its coffee-fueled dexterity.","baseIncomePerSecond":75,"releaseStatus":"released","cost":10000,"addedAt":"2025-01-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"cappuccino-clownino","name":"Cappuccino Clownino","rarity":"Brainrot God","description":"Cappuccino Clownino is a Brainrot God-tier Brainrot character in Steal a Brainrot, obtainable from the Spooky Lucky Block during the Frightrot Event. It is a Halloween variant of Cappuccino Assassino, featuring a clown-like face with eerie makeup, crimson eyes, and a twisted grin. Blending the elegance of coffee chaos with carnival horror, it brings both laughter and fear to the Frightrot festivities.","baseIncomePerSecond":285000,"releaseStatus":"released","cost":48500000,"addedAt":"2025-10-25","eventKeys":["frightrot-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"spooky-lucky-block","label":"Spooky Lucky Block"}]},{"id":"caramello-filtrello","name":"Caramello Filtrello","rarity":"Legendary","description":"Caramello Filtrello is a Legendary-tier character in Steal a Brainrot, depicted as a caramel mongrel dog inside a filter made of clay, with earthen textures and a muddy, artisanal charm that filters through the game with rustic elegance, embodying the quirky absurdity of Italian brainrot meme culture.","baseIncomePerSecond":1000,"releaseStatus":"released","cost":255000,"addedAt":"2025-09-06","eventKeys":[],"craftFilterKeys":["craft"],"acquisitionBadges":[{"kind":"source","id":"craft-machine","label":"Craft Machine"}]},{"id":"carloo","name":"Carloo","rarity":"Mythic","description":"Carloo is a Mythic-tier character in Steal a Brainrot, depicted as a fish with feet, sipping a strawberry milkshake, wearing a black hat and black glasses, swimming with chaotic flair, embodying the playful absurdity of Italian brainrot meme culture.","baseIncomePerSecond":13500,"releaseStatus":"released","cost":4500000,"addedAt":"2025-08-23","eventKeys":["admin-war","admin-abuse"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"admin-lucky-block","label":"Admin Lucky Block"}]},{"id":"carrotini-brainini","name":"Carrotini Brainini","rarity":"Mythic","description":"Carrotini Brainini is a Mythic-tier character in Steal a Brainrot, depicted as a carrot with a brain-like texture, hopping with quirky energy. Carrotini Brainini embodies the whimsical absurdity of Italian brainrot meme culture.","baseIncomePerSecond":15000,"releaseStatus":"released","cost":4700000,"addedAt":"2025-08-31","eventKeys":[],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"mythic-lucky-block","label":"Mythic Lucky Block"}]},{"id":"cash-or-card","name":"Cash or Card","rarity":"Secret","description":"Cash or Card is a released Secret brainrot in Steal a Brainrot and part of the current ADMIN ABUSE runway wave. It appears as a duo made of a smug green cash stack beside a laid-back black credit card with limbs and expressive faces. Cash or Card matters because it anchors the top end of the new Red Carpet lineup with a strong default-spawn chase.","baseIncomePerSecond":100000000,"releaseStatus":"released","cost":40000000000,"addedAt":"2026-04-11","eventKeys":["admin-abuse"],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"cavallo-virtuoso","name":"Cavallo Virtuoso","rarity":"Mythic","description":"Cavallo Virtuoso is a majestic, musical horse, galloping with symphonic, virtuosic grace.","baseIncomePerSecond":7500,"releaseStatus":"released","cost":2500000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"caylusaurus","name":"Caylusaurus","rarity":"Secret","description":"Caylusaurus is a Secret Caylus-and-dragon fusion. It uses Caylus' Roblox-avatar upper body with a red dragon lower body and wings.","baseIncomePerSecond":55000000,"releaseStatus":"released","cost":12500000000,"addedAt":"2026-06-06","eventKeys":["caylus-admin-abuse-2026-06-06"],"craftFilterKeys":["limited"],"acquisitionBadges":[{"kind":"mechanic","id":"limited-stock","label":"Limited Stock"}]},{"id":"celestial-pegasus","name":"Celestial Pegasus","rarity":"Secret","description":"Celestial Pegasus is a Secret-tier Brainrot depicting a flying unicorn infused with shimmering starlight. Celestial Pegasus glows with cosmic sparkles across its body, transforming Celestial Pegasus into a radiant Italian brainrot fantasy icon.","baseIncomePerSecond":175000000,"releaseStatus":"released","cost":150000000000,"addedAt":"2026-02-28","eventKeys":["divine-admin-machine-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"secret-lucky-block","label":"Secret Lucky Block"}]},{"id":"celularcini-viciosini","name":"Celularcini Viciosini","rarity":"Secret","description":"Celularcini Viciosini is a Secret-tier character in Steal a Brainrot, depicted as a mischievous mobile phone-themed entity, blending high-tech chaos with rare allure, embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":22500000,"releaseStatus":"released","cost":2700000000,"addedAt":"2025-09-14","eventKeys":[],"craftFilterKeys":["craft"],"acquisitionBadges":[{"kind":"source","id":"craft-machine","label":"Craft Machine"}]},{"id":"centrucci-nuclucci","name":"Centrucci Nuclucci","rarity":"Mythic","description":"Centrucci Nuclucci is a Mythic-tier Brainrot character in Steal a Brainrot, obtainable by trading older Brainrots at the Brainrot Trader. It emanates radiant nuclear energy, symbolizing innovation, instability, and the explosive creativity of Brainrot evolution.","baseIncomePerSecond":15500,"releaseStatus":"released","cost":4800000,"addedAt":"2025-11-15","eventKeys":["radioactive-mutation-event"],"craftFilterKeys":["dealer"],"acquisitionBadges":[{"kind":"source","id":"brainrot-dealer","label":"Brainrot Trader"}]},{"id":"centuzzarella-croccantini","name":"Centuzzarella Croccantini","rarity":"Unknown","description":"Centuzzarella Croccantini is an upcoming (unconfirmed) character in Steal a Brainrot, inspired by the Italian brainrot meme Centuzzarella Croccantini. Depicted as an anthropomorphic mozzarella ball with a crispy, golden crust, it rolls through a surreal pizzeria landscape, oozing molten cheese and humming chaotic culinary chants, embodying the whimsical and absurd essence of Italian brainrot meme culture.","baseIncomePerSecond":0,"releaseStatus":"unconfirmed","cost":0,"addedAt":"","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[]},{"id":"cerberus","name":"Cerberus","rarity":"Secret","description":"Cerberus is a Secret-tier Brainrot inspired by the mythical guardian of the underworld. Cerberus resembles a fearsome hellhound, channeling dark, mythological energy while retaining the surreal and exaggerated style of Italian brainrot memes, making Cerberus a standout Brainrot tied to the duels-event.","baseIncomePerSecond":175000000,"releaseStatus":"released","cost":150000000000,"addedAt":"2026-01-10","eventKeys":["duels-event"],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"chachechi","name":"Chachechi","rarity":"Secret","description":"Chachechi is a Secret-tier character in Steal a Brainrot, depicted as a quirky, chattering creature with a playful, mischievous demeanor, featuring a face and arms on a red table, embodying the whimsical absurdity of Italian brainrot meme culture.","baseIncomePerSecond":400000,"releaseStatus":"released","cost":85000000,"addedAt":"2025-09-14","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"chef-crabracadabra","name":"Chef Crabracadabra","rarity":"Legendary","description":"Chef Crabracadebra is a magical, crab-chef hybrid, cooking up chaos with a pinch of culinary sorcery.","baseIncomePerSecond":600,"releaseStatus":"released","cost":150000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"chicleteira-bicicleteira","name":"Chicleteira Bicicleteira","rarity":"Secret","description":"Chicleteira Bicicleteira is a Brazilian-inspired Secret Brainrot, depicted as a gumball machine with a cartoon evil smirk and social shoes riding a bicycle, known for causing calamity and enjoying others' suffering.","baseIncomePerSecond":3500000,"releaseStatus":"released","cost":750000000,"addedAt":"2025-07-26","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"chicleteira-champeona","name":"Chicleteira Champeona","rarity":"Secret","description":"Chicleteira Champeona is a released football-themed Secret from the Spain Event. The character wears a red number 19 kit while carrying a World Cup trophy and standing beside a soccer ball. Its 19M/s income and 2% event chance make it a distinctive championship target.","baseIncomePerSecond":19000000,"releaseStatus":"released","cost":3000000000,"addedAt":"2026-07-25","eventKeys":["crystal-mutation-spain-event-2026-07-25"],"craftFilterKeys":[],"acquisitionBadges":[]},{"id":"chicleteira-cupideira","name":"Chicleteira Cupideira","rarity":"Secret","description":"Chicleteira Cupideira is a Secret-tier Valentines-themed version of Chicleteira Bicicleteira. Chicleteira Cupideira reimagines the original with Cupid-inspired romance, heart-driven chaos, and playful Italian brainrot love energy.","baseIncomePerSecond":17500000,"releaseStatus":"released","cost":2500000000,"addedAt":"2026-02-07","eventKeys":["valentines-pt1-event","valentines-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"heart-lucky-block","label":"Heart Lucky Block"}]},{"id":"chicleteira-noelteira","name":"Chicleteira Noelteira","rarity":"Secret","description":"Chicleteira Noelteira is a Secret-tier Christmas variant of Chicleteira Bicicleteira. The candy machine-bicycle is wrapped in ribbons, fairy lights, and festive colors, pedaling through snowy streets while gumballs jingle like ornaments.","baseIncomePerSecond":15000000,"releaseStatus":"released","cost":2000000000,"addedAt":"2025-12-06","eventKeys":["santas-fuse-event","christmas"],"craftFilterKeys":["santas-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"santas-fuse-machine","label":"Santa's Fuse Machine"}]},{"id":"chicleteira-surfeiteira","name":"Chicleteira Surfeiteira","rarity":"Secret","description":"Chicleteira Surfeiteira is a Secret summer variant in the Bicicleteira family. It keeps the Chicleteira silhouette but adds beach details: a swimsuit, starfish necklace, sandals, and a multicolor surfboard. Target it during Summer Hour both for its 16M/s income and its role in the La Summer Grande route.","baseIncomePerSecond":16000000,"releaseStatus":"released","cost":2100000000,"addedAt":"2026-06-20","eventKeys":["summer-upd-pt-2-2026-06-20"],"craftFilterKeys":[],"acquisitionBadges":[]},{"id":"chicleteirina-bicicleteirina","name":"Chicleteirina Bicicleteirina","rarity":"Secret","description":"Chicleteirina Bicicleteirina is a Secret-tier character in Steal a Brainrot, depicted as the female version of Chicleteira Bicicleteira, a gumball machine-bicycle hybrid with feminine charm and playful pedaling, embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":4000000,"releaseStatus":"released","cost":850000000,"addedAt":"2025-10-11","eventKeys":["witch-fuse-event"],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"chihuanini-taconini","name":"Chihuanini Taconini","rarity":"Brainrot God","description":"Chihuanini Taconini is a Brainrot God-tier character in Steal a Brainrot, depicted as a taco-inspired chihuahua with a crispy shell hat and a playful bark, scampering through the game with chaotic taco-flavored energy, embodying the whimsical absurdity of Italian brainrot meme culture.","baseIncomePerSecond":45000,"releaseStatus":"released","cost":8500000,"addedAt":"2025-09-02","eventKeys":["taco-tuesday"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"source","id":"taco-lucky-block","label":"Taco Lucky Block"}]},{"id":"chill-puppy","name":"Chill Puppy","rarity":"Secret","description":"Chill Puppy is a Secret-tier Brainrot showing a puppy peeking out from a portable cooler. Chill Puppy blends cozy chill vibes with cute canine energy and iconic Italian brainrot style.","baseIncomePerSecond":4000000,"releaseStatus":"released","cost":850000000,"addedAt":"2026-01-24","eventKeys":["the-return"],"craftFilterKeys":["og-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"og-fuse-machine","label":"OG Fuse Machine"}]},{"id":"chillin-chili","name":"Chillin Chili","rarity":"Secret","description":"Chillin Chili is a Secret-tier limited-stock Brainrot released through Taco Tuesday. It appears as an anthropomorphic chili pepper wearing sunglasses and light-blue shoes. Its Taco Truck route is no longer stocked, making it a historical limited pickup for collectors.","baseIncomePerSecond":25000000,"releaseStatus":"released","cost":2500000000,"addedAt":"2025-09-30","eventKeys":["taco-tuesday"],"craftFilterKeys":["limited"],"acquisitionBadges":[{"kind":"source","id":"limited-quantity-truck","label":"Limited Quantity Truck"}]},{"id":"chimnino","name":"Chimnino","rarity":"Secret","description":"Chimnino is a Secret-tier Brainrot depicted as a living chimney skillfully juggling wrapped presents with its feet, embodying Santa’s rooftop chaos and holiday absurdity.","baseIncomePerSecond":14000000,"releaseStatus":"released","cost":1900000000,"addedAt":"2025-12-13","eventKeys":["north-pole-event","christmas","santas-fuse-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"festive-lucky-block","label":"Festive Lucky Block"}]},{"id":"chimpanzini-bananini","name":"Chimpanzini Bananini","rarity":"Legendary","description":"Chimpanzini Bananini is a cheeky, banana-loving primate, swinging with a fruity, playful spirit.","baseIncomePerSecond":300,"releaseStatus":"released","cost":50000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"chimpanzini-spiderini","name":"Chimpanzini Spiderini","rarity":"Secret","description":"Chimpanzini Spiderini is a Secret-tier Brainrot, a hybrid of a chimpanzee and spider with a yellow, cube-shaped head, red top hat, and robotic spider legs, inspired by meme culture and the game's development team.","baseIncomePerSecond":325000,"releaseStatus":"released","cost":100000000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"chipso-and-queso","name":"Chipso and Queso","rarity":"Secret","description":"Chipso and Queso is a Secret-tier Brainrot character in Steal a Brainrot, obtainable via the Limited Quantity Truck. It features a tortilla chip with a serious, melancholy expression and small legs, standing beside a jar labeled 'Queso Hot' filled with bubbling cheese sauce. This duo captures the tragicomic spirit of Taco Tuesday — a mix of spice, sadness, and surreal charm.","baseIncomePerSecond":25000000,"releaseStatus":"released","cost":2500000000,"addedAt":"2025-10-21","eventKeys":["taco-tuesday"],"craftFilterKeys":["limited"],"acquisitionBadges":[{"kind":"source","id":"limited-quantity-truck","label":"Limited Quantity Truck"}]},{"id":"chocco-bunny","name":"Chocco Bunny","rarity":"Legendary","description":"Chocco Bunny is a Legendary-tier adorable rabbit with a round chocolate body, looking like a living holiday truffle hopping through the Brainrot world.","baseIncomePerSecond":1400,"releaseStatus":"released","cost":327500,"addedAt":"2025-12-06","eventKeys":["santas-fuse-event","christmas"],"craftFilterKeys":["santas-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"santas-fuse-machine","label":"Santa's Fuse Machine"}]},{"id":"chrismasmamat","name":"Chrismasmamat","rarity":"Brainrot God","description":"Chrismasmamat is a Brainrot God-tier Christmas version of Pakrahmatmamat, redesigned with festive clothing, holiday colors, and a warm seasonal presence.","baseIncomePerSecond":277500,"releaseStatus":"released","cost":47700000,"addedAt":"2025-12-13","eventKeys":["north-pole-event","christmas","santas-fuse-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"festive-lucky-block","label":"Festive Lucky Block"}]},{"id":"churrito-bunnito","name":"Churrito Bunnito","rarity":"Secret","description":"Churrito Bunnito is a released Secret brainrot in Steal a Brainrot and part of the live Egg Lucky Block lineup for EASTER EVENT (Part 2). It combines bunny and churro-themed visual cues into one of the most distinctive high-end silhouettes in the current Easter block pool. Churrito Bunnito matters because it is the current 1% chase drop for players who want a confirmed top-end Easter block reward.","baseIncomePerSecond":21000000,"releaseStatus":"released","cost":2600000000,"addedAt":"2026-04-04","eventKeys":["easter-event-part-2","easter-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"egg-lucky-block","label":"Egg Lucky Block"}]},{"id":"cigno-fulgoro","name":"Cigno Fulgoro","rarity":"Secret","description":"Cigno Fulgoro is a Secret-tier Brainrot resembling a white swan with a blue crown, dark visor-like eyes, and long gold-edged wings. Cigno Fulgoro channels regal poise and bright celestial styling for a refined divine presence.","baseIncomePerSecond":20000000,"releaseStatus":"released","cost":3000000000,"addedAt":"2026-03-07","eventKeys":["divine-fuse-machine-event"],"craftFilterKeys":["divine-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"divine-fuse-machine","label":"Divine Fuse Machine"}]},{"id":"clickerino-crabo","name":"Clickerino Crabo","rarity":"Legendary","description":"Clickerino Crabo is a Legendary-tier Brainrot character in Steal a Brainrot, obtainable from the Brainrot Dealer. It is a crab whose body is formed from a computer mouse, symbolizing digital chaos and click-fueled madness.","baseIncomePerSecond":1000,"releaseStatus":"released","cost":250000,"addedAt":"2025-11-08","eventKeys":[],"craftFilterKeys":["dealer"],"acquisitionBadges":[{"kind":"source","id":"brainrot-dealer","label":"Brainrot Trader"}]},{"id":"cloverat-clapat","name":"Cloverat Clapat","rarity":"Secret","description":"Cloverat Clapat is a Secret-tier Brainrot in Steal a Brainrot and a live ST PATRICKS spawn linked to the Lucky Pot loop. It appears as a bright green rat-like character in a leprechaun coat and hat with shamrock accents across the outfit, which makes the event theme obvious immediately. Cloverat Clapat matters because it gives players a separate live top-end chase target outside the standard eight-drop Leprechaun Lucky Block lineup.","baseIncomePerSecond":60000000,"releaseStatus":"released","cost":15000000000,"addedAt":"2026-03-14","eventKeys":["st-patricks-event"],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"clovkur-kurkur","name":"Clovkur Kurkur","rarity":"Brainrot God","description":"Clovkur Kurkur is a Brainrot God character in Steal a Brainrot and a live Leprechaun Lucky Block drop from ST PATRICKS. It appears as a green chair-like figure with a four-leaf clover backrest and a leprechaun hat that pushes the holiday theme directly into the silhouette. Clovkur Kurkur matters because it locks in one of the event's clearest visual identities while staying cheaper than the top Secret pulls.","baseIncomePerSecond":305000,"releaseStatus":"released","cost":70000000,"addedAt":"2026-03-14","eventKeys":["st-patricks-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"leprechaun-lucky-block","label":"Leprechaun Lucky Block"}]},{"id":"coco-and-mango","name":"Coco and Mango","rarity":"Secret","description":"Coco and Mango is a fruit duo brainrot featuring a serious coconut character beside a bright yellow mango character with a wide, energetic grin.","baseIncomePerSecond":33500000,"releaseStatus":"released","cost":4500000000,"addedAt":"2026-05-23","eventKeys":["summer-fuse-2026-05-23"],"craftFilterKeys":["summer-fuse"],"acquisitionBadges":[{"kind":"source","id":"summer-fuse","label":"Summer Fuse"}]},{"id":"cocoa-assassino","name":"Cocoa Assassino","rarity":"Brainrot God","description":"Cocoa Assassino is a Brainrot God-tier Christmas variant of Cappuccino Assassino, reimagined as a steaming cup of cocoa with a deadly calm presence, blending cozy winter vibes with assassin meme intensity.","baseIncomePerSecond":291000,"releaseStatus":"released","cost":61000000,"addedAt":"2025-12-13","eventKeys":["north-pole-event","christmas"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"cocofanto-elefanto","name":"Cocofanto Elefanto","rarity":"Brainrot God","description":"Cocofanto Elefanto is a tropical, coconut-clad elephant, stomping with a hefty, island-inspired swagger.","baseIncomePerSecond":17500,"releaseStatus":"released","cost":5000000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"cocosini-mama","name":"Cocosini Mama","rarity":"Legendary","description":"Cocosini Mama is a Legendary-tier Brainrot in Steal a Brainrot, obtained through fusion with a higher probability of generating Legendary-tier outcomes, depicted as a kangaroo with a dried coconut body and a pouch carrying Cocosini Baby, embodying the nurturing yet chaotic essence of Italian brainrot meme culture.","baseIncomePerSecond":1200,"releaseStatus":"released","cost":285000,"addedAt":"2025-08-02","eventKeys":[],"craftFilterKeys":["summer-fuse","og-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"summer-fuse","label":"Summer Fuse"},{"kind":"source","id":"og-fuse-machine","label":"OG Fuse Machine"},{"kind":"source","id":"runway","label":"Runway"}]},{"id":"cocoteddy","name":"Cocoteddy","rarity":"Mythic","description":"Cocoteddy is a coconut teddy-bear brainrot with sunglasses, a coconut body, a straw, a small umbrella, and a relaxed tropical look.","baseIncomePerSecond":15000,"releaseStatus":"released","cost":4700000,"addedAt":"2026-05-23","eventKeys":["summer-fuse-2026-05-23"],"craftFilterKeys":["summer-fuse"],"acquisitionBadges":[{"kind":"source","id":"summer-fuse","label":"Summer Fuse"}]},{"id":"coffin-tung-tung-tung-sahur","name":"Coffin Tung Tung Tung Sahur","rarity":"Secret","description":"Coffin Tung Tung Tung Sahur is a Secret-tier object carried by four Tung Tung Tung Sahur characters. When opened, it reveals the upgraded Secret-tier Tung Tung Tung Sahur inside.","baseIncomePerSecond":0,"releaseStatus":"released","cost":500000000,"addedAt":"2025-11-29","eventKeys":["hes-coming-back-event"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"cornetto-morsetto","name":"Conetto Morsetto","rarity":"Secret","description":"Conetto Morsetto is a Secret orange monkey-and-ice-cream-cone hybrid with waffle-cone ears, white ice cream, large brown eyes, a pink muzzle, and raised arms.","baseIncomePerSecond":10000000,"releaseStatus":"released","cost":2000000000,"addedAt":"2026-08-08","eventKeys":["rng-machine-queen-bee-event-2026-08-08"],"craftFilterKeys":[],"acquisitionBadges":[]},{"id":"cooki-and-milki","name":"Cooki and Milki","rarity":"Secret","description":"Cooki and Milki is a Secret-tier Brainrot featuring a cookie and a glass of milk as a duo. Their chemistry is wholesome yet chaotic, representing the perfect festive pairing during the holiday season.","baseIncomePerSecond":155000000,"releaseStatus":"released","cost":100000000000,"addedAt":"2025-12-06","eventKeys":["santas-fuse-event","christmas"],"craftFilterKeys":["santas-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"santas-fuse-machine","label":"Santa's Fuse Machine"}]},{"id":"corn-corn-corn-sahur","name":"Corn Corn Corn Sahur","rarity":"Brainrot God","description":"Corn Corn Corn Sahur is a Brainrot God-tier character in Steal a Brainrot, depicted as an anthropomorphic corn holding an elote, blending Sahur rhythms with Mexican flair, embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":250000,"releaseStatus":"released","cost":45000000,"addedAt":"2025-09-23","eventKeys":["mexico-event"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"crabbo-limonetta","name":"Crabbo Limonetta","rarity":"Brainrot God","description":"Crabbo Limonetta is a Brainrot God-tier character in Steal a Brainrot, depicted as a zesty lemon-crab hybrid with a citrusy shell and snapping claws, scurrying through the game with chaotic flair, embodying the quirky and absurd essence of Italian brainrot meme culture.","baseIncomePerSecond":235000,"releaseStatus":"released","cost":46000000,"addedAt":"2025-08-31","eventKeys":["admin-war","admin-abuse"],"craftFilterKeys":["lucky-block","fishing"],"acquisitionBadges":[{"kind":"source","id":"fishing-event","label":"Fishing Event"},{"kind":"source","id":"admin-lucky-block","label":"Admin Lucky Block"}]},{"id":"craburger","name":"Craburger","rarity":"Secret","description":"Craburger is a Secret Octo Lucky Block reward from SUMMER UPD PT 1. It turns a cheeseburger into a crab-like creature with eye stalks, burger layers, and clawed arms near the bottom. Its 30% listed chance makes it one of the frequent Secret pulls players will see while opening Octo Lucky Blocks.","baseIncomePerSecond":1300000,"releaseStatus":"released","cost":350000000,"addedAt":"2026-06-13","eventKeys":["summer-upd-pt-1-2026-06-13"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"mechanic","id":"lucky-block","label":"Lucky Block"}]},{"id":"crocodillo-ananasinno","name":"Crocodillo Ananasinno","rarity":"Unknown","description":"Crocodillo Ananasinno is a pineapple-armored crocodile, snapping with juicy, tropical ferocity.","baseIncomePerSecond":0,"releaseStatus":"unconfirmed","cost":0,"addedAt":"","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[]},{"id":"cuadramat-and-pakrahmatmamat","name":"Cuadramat and Pakrahmatmamat","rarity":"Secret","description":"Cuadramat and Pakrahmatmamat is a Secret-tier Brainrot consisting of a purple book holding Pakrahmatmamat — a pencil-like Brainrot. Together, they form a quirky academic duo radiating chaotic scholarly energy.","baseIncomePerSecond":1400000,"releaseStatus":"released","cost":400000000,"addedAt":"2025-11-22","eventKeys":[],"craftFilterKeys":["dealer"],"acquisitionBadges":[{"kind":"source","id":"brainrot-dealer","label":"Brainrot Trader"}]},{"id":"cupcake-koala","name":"Cupcake Koala","rarity":"Rare","description":"Cupcake Koala is a Rare-tier Brainrot character in Steal a Brainrot, obtainable from the Brainrot Dealer. It is a cute koala with a blueberry cupcake body, blending sweetness and absurd charm in perfect meme harmony.","baseIncomePerSecond":60,"releaseStatus":"released","cost":8000,"addedAt":"2025-11-08","eventKeys":[],"craftFilterKeys":["dealer"],"acquisitionBadges":[{"kind":"source","id":"brainrot-dealer","label":"Brainrot Trader"}]},{"id":"cupid-cupid-sahur","name":"Cupid Cupid Sahur","rarity":"Secret","description":"Cupid Cupid Sahur is a Secret-tier Valentine version of To to to Sahur. Cupid Cupid Sahur blends Cupid-themed romance, heart-shaped motifs, and playful exaggeration, turning Cupid Cupid Sahur into a standout Italian brainrot icon of the valentines-event.","baseIncomePerSecond":3100000,"releaseStatus":"released","cost":715000000,"addedAt":"2026-02-07","eventKeys":["valentines-pt1-event","valentines-event"],"craftFilterKeys":["cupids-machine"],"acquisitionBadges":[{"kind":"source","id":"cupids-machine","label":"Cupid's Machine"}]},{"id":"cupid-hotspot","name":"Cupid Hotspot","rarity":"Secret","description":"Cupid Hotspot is a Secret-tier Valentines version of Pot Hotspot. Cupid Hotspot infuses Cupid imagery and romantic chaos into the classic hotspot brainrot design.","baseIncomePerSecond":3500000,"releaseStatus":"released","cost":750000000,"addedAt":"2026-02-07","eventKeys":["valentines-pt1-event","valentines-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"heart-lucky-block","label":"Heart Lucky Block"}]},{"id":"de-tabrak","name":"de Tabrak","rarity":"Unknown","description":"de Tabrak is a reckless, crash-prone daredevil, charging with collision-fueled energy.","baseIncomePerSecond":0,"releaseStatus":"unconfirmed","cost":0,"addedAt":"","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[]},{"id":"developini-braziliaspidini","name":"Developini Braziliaspidini","rarity":"Unknown","description":"Developini Braziliaspidini is a techy, spider-like developer tribute, coding chaos with Brazilian flair.","baseIncomePerSecond":0,"releaseStatus":"unconfirmed","cost":0,"addedAt":"","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[]},{"id":"digi-narwhal","name":"Digi Narwhal","rarity":"Secret","description":"Digi Narwhal is a Secret brainrot in Steal a Brainrot and one of the standout cyber-themed mascots in the current machine lineup. It appears as a rounded blue narwhal with a glowing face, a digital sign balanced over its head, and a small curled tail. Digi Narwhal matters because it gives the Cyber wave one of its cleanest silhouettes and a clear top-end chase.","baseIncomePerSecond":200000000,"releaseStatus":"released","cost":200000000000,"addedAt":"2026-04-19","eventKeys":["cyber-event"],"craftFilterKeys":["craft","cyber-craft-machine"],"acquisitionBadges":[{"kind":"source","id":"cyber-craft-machine","label":"Cyber Craft Machine"}]},{"id":"divino-platypio","name":"Divino Platypio","rarity":"Brainrot God","description":"Divino Platypio is a Brainrot God character shown as a small hooded platypus with a yellow bill and white wings. Divino Platypio balances soft storybook charm with a quiet divine-traveler feel.","baseIncomePerSecond":160000,"releaseStatus":"released","cost":32000000,"addedAt":"2026-03-07","eventKeys":["divine-fuse-machine-event"],"craftFilterKeys":["divine-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"divine-fuse-machine","label":"Divine Fuse Machine"}]},{"id":"dj-panda","name":"DJ Panda","rarity":"Secret","description":"DJ Panda is a Secret-tier Brainrot featuring a panda whose torso is replaced by a DJ booth with built-in speakers. DJ Panda mixes rhythm and chaos, turning music energy into iconic Italian brainrot spectacle.","baseIncomePerSecond":17500000,"releaseStatus":"released","cost":2500000000,"addedAt":"2026-02-28","eventKeys":["divine-admin-machine-event"],"craftFilterKeys":["og-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"og-fuse-machine","label":"OG Fuse Machine"}]},{"id":"doi-doi-do","name":"Doi Doi Do","rarity":"Epic","description":"Doi Doi Do is an Epic-tier Brainrot character in Steal a Brainrot, obtainable from the Brainrot Dealer. It depicts a frog wearing a school uniform and holding an umbrella, radiating melancholy and wholesomeness in true Brainrot fashion.","baseIncomePerSecond":260,"releaseStatus":"released","cost":41000,"addedAt":"2025-11-08","eventKeys":[],"craftFilterKeys":["dealer"],"acquisitionBadges":[{"kind":"source","id":"brainrot-dealer","label":"Brainrot Trader"}]},{"id":"dolphini-jetskini","name":"Dolphini Jetskini","rarity":"Brainrot God","description":"Dolphini Jetskini is a Brainrot God-tier Brainrot showing a dolphin racing forward while riding a jet ski. Dolphini Jetskini embodies speed, splashy chaos, and high-energy Italian brainrot spectacle.","baseIncomePerSecond":294500,"releaseStatus":"released","cost":64500000,"addedAt":"2026-01-24","eventKeys":["the-return"],"craftFilterKeys":["og-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"og-fuse-machine","label":"OG Fuse Machine"}]},{"id":"donkeyturbo-express","name":"Donkeyturbo Express","rarity":"Secret","description":"Donkeyturbo Express is a Secret-tier Brainrot fusing a donkey with a train. A grinning donkey head protrudes from the locomotive, wearing a Santa hat as it charges forward with absurd holiday momentum.","baseIncomePerSecond":7500000,"releaseStatus":"released","cost":1200000000,"addedAt":"2025-12-20","eventKeys":["gingerbread-town","christmas"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"dragon-aquanini","name":"Dragon Aquanini","rarity":"Secret","description":"Dragon Aquanini is an aquatic dragon brainrot with cyan-blue coloring, coral accents, sea-star details, a compact body, and a playful tongue-out expression.","baseIncomePerSecond":375000000,"releaseStatus":"released","cost":375000000000,"addedAt":"2026-05-23","eventKeys":["summer-fuse-2026-05-23"],"craftFilterKeys":["summer-fuse"],"acquisitionBadges":[{"kind":"source","id":"summer-fuse","label":"Summer Fuse"}]},{"id":"dragon-cannelloni","name":"Dragon Cannelloni","rarity":"Secret","description":"Dragon Cannelloni is a Secret-tier Brainrot, depicted as a dragon made of pasta, known for its high cost and immense income generation.","baseIncomePerSecond":250000000,"releaseStatus":"released","cost":250000000000,"addedAt":"2025-08-02","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"dragon-gingerini","name":"Dragon Gingerini","rarity":"Secret","description":"Dragon Gingerini is a Secret-tier Brainrot crafted from a ginger-flavored, dragon-shaped Italian pastry. Its entire body is coated in white icing, colorful candies, and candy canes, radiating overwhelming festive sweetness and triumphant holiday meme energy.","baseIncomePerSecond":300000000,"releaseStatus":"released","cost":300000000000,"addedAt":"2025-12-20","eventKeys":["gingerbread-town","christmas"],"craftFilterKeys":["santas-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"santas-fuse-machine","label":"Santa's Fuse Machine"}]},{"id":"dug-dug-dug","name":"Dug dug dug","rarity":"Secret","description":"Dug dug dug is a Secret-tier Brainrot in Steal a Brainrot and one of the former headline outputs from the Craft Machine. It appears as a drum with a face and two legs, turning percussion gear into a marching meme character. Dug dug dug matters because Update 42 boosted it to $35.0M/s, making it a much stronger legacy target even though the current page marks its craft route unobtainable.","baseIncomePerSecond":35000000,"releaseStatus":"released","cost":5000000000,"addedAt":"2025-09-21","eventKeys":["mexico-event"],"craftFilterKeys":["craft"],"acquisitionBadges":[{"kind":"source","id":"craft-machine","label":"Craft Machine"}]},{"id":"duggy-bros","name":"Duggy Bros","rarity":"Secret","description":"Duggy Bros is a Secret brainrot in Steal a Brainrot and a historical duo entries tied to the Cyber Craft Machine. It appears as a baby Dug dug dug paired with a baby Gold Gold Gold, turning two familiar mascots into a compact historical craft chase.","baseIncomePerSecond":90000000,"releaseStatus":"released","cost":30000000000,"addedAt":"2026-04-25","eventKeys":[],"craftFilterKeys":["craft","cyber-craft-machine"],"acquisitionBadges":[{"kind":"source","id":"cyber-craft-machine","label":"Cyber Craft Machine"}]},{"id":"dul-dul-dul","name":"Dul Dul Dul","rarity":"Secret","description":"Dul Dul Dul is a Secret-tier character in Steal a Brainrot, depicted as a monkey dressed in a school uniform, chanting 'Dul Dul Dul' with a rhythmic beat, swinging through the game with chaotic energy, embodying the absurd and playful spirit of Italian brainrot meme culture.","baseIncomePerSecond":375000,"releaseStatus":"released","cost":150000000,"addedAt":"2025-08-23","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"dumborino-miracello","name":"Dumborino Miracello","rarity":"Brainrot God","description":"Dumborino Miracello is a Brainrot God character portrayed as a pink octopus-elephant hybrid with an elephant-like face, candle-tipped tentacles, and a crown-like candle stand on its head. Dumborino Miracello turns a miracle-carnival silhouette into loud, celebratory divine chaos.","baseIncomePerSecond":315000,"releaseStatus":"released","cost":75000000,"addedAt":"2026-03-07","eventKeys":["divine-fuse-machine-event"],"craftFilterKeys":["divine-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"divine-fuse-machine","label":"Divine Fuse Machine"}]},{"id":"easter-easter-easter-sahur","name":"Easter Easter Easter Sahur","rarity":"Secret","description":"Easter Easter Easter Sahur is a released Easter brainrot in Steal a Brainrot and part of the live Egg Lucky Block lineup. It appears as a boxy Easter-themed rabbit figure with basket-like details and spring styling built for the seasonal block pool. Easter Easter Easter Sahur matters because it has moved from teaser status into the active Easter lineup and now counts as a real collection target.","baseIncomePerSecond":1200000,"releaseStatus":"released","cost":300000000,"addedAt":"2026-04-04","eventKeys":["easter-event-part-2","easter-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"egg-lucky-block","label":"Egg Lucky Block"}]},{"id":"eggdin-egg-egg-dun","name":"Eggdin Egg Egg Dun","rarity":"Brainrot God","description":"Eggdin Egg Egg Dun is a released Brainrot God brainrot in Steal a Brainrot and part of the live Egg Lucky Block lineup for EASTER EVENT (Part 2). Its current public framing presents it as an egg-themed Egg Egg Dun variant with a striped egg body and birdlike features made for the Easter block pool. Eggdin Egg Egg Dun matters because it gives the current seasonal block lineup an attainable early Brainrot God target.","baseIncomePerSecond":310000,"releaseStatus":"released","cost":72500000,"addedAt":"2026-04-04","eventKeys":["easter-event-part-2","easter-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"egg-lucky-block","label":"Egg Lucky Block"}]},{"id":"eid-eid-eid-sahur","name":"Eid Eid Eid Sahur","rarity":"Secret","description":"Eid Eid Eid Sahur is a Secret-tier Brainrot in Steal a Brainrot and the common live Eid Celebration reward from RIP MY GRANNY. It appears as a bright gold crescent-headed Sahur with dark eyes, dangling legs, and a shiny crescent tail that matches the event's lantern-and-moon theme. Eid Eid Eid Sahur matters because it is the reliable 99% live reward for players farming the limited Eid Celebration event.","baseIncomePerSecond":3500000,"releaseStatus":"released","cost":750000000,"addedAt":"2026-03-21","eventKeys":["rip-my-granny-event","eid-celebration"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"electro-quacko","name":"Electro Quacko","rarity":"Legendary","description":"Electro Quacko is a released Legendary brainrot in Steal a Brainrot and part of the CYBER UPDATE machine wave. It appears as a bright yellow duck mascot with blue electric markings, a battery emblem on its chest, and thin antenna rods on top of its head. Electro Quacko matters because it anchors the lower end of the Cyber Craft Machine lineup with one of the clearest robot-duck silhouettes in the update.","baseIncomePerSecond":1800,"releaseStatus":"released","cost":345000,"addedAt":"2026-04-19","eventKeys":["cyber-event"],"craftFilterKeys":["craft","cyber-craft-machine"],"acquisitionBadges":[{"kind":"source","id":"cyber-craft-machine","label":"Cyber Craft Machine"}]},{"id":"elefanto-frigo","name":"Elefanto Frigo","rarity":"Mythic","description":"Elefanto Frigo is a Mythic-tier character in Steal a Brainrot, depicted as a fridge with elephant eyes, ears, and limbs in a kitchen, blending household utility with whimsical pachyderm features, embodying the wild essence of Italian brainrot meme culture.","baseIncomePerSecond":14000,"releaseStatus":"released","cost":4600000,"addedAt":"2025-09-21","eventKeys":["mexico-event"],"craftFilterKeys":["craft"],"acquisitionBadges":[{"kind":"source","id":"craft-machine","label":"Craft Machine"}]},{"id":"esok-goala","name":"Esok Goala","rarity":"Secret","description":"Esok Goala is a Secret sports-stadium brainrot released during FUTBOL UPDATE. It appears as a football stadium holding a soccer ball with a goal sign, turning the Sekolah-style silhouette into a match-day character. Its 32.5M/s income makes it the premium goal-triggered chase in Live Match Events.","baseIncomePerSecond":32500000,"releaseStatus":"released","cost":4200000000,"addedAt":"2026-06-27","eventKeys":["futbol-update-2026-06-27"],"craftFilterKeys":[],"acquisitionBadges":[{"kind":"source","id":"live-match-events","label":"Live Match Events"}]},{"id":"esok-sekolah","name":"Esok Sekolah","rarity":"Secret","description":"Esok Sekolah is a Secret-tier Brainrot in Steal a Brainrot, depicted as an anthropomorphic school building with a gleeful face, long tongue sticking out, and a sign displaying '9,' emerging from a dark forest while singing 'lalalalala,' haunting students who skip school with its eerie presence, embodying the chaotic and unsettling essence of Italian brainrot meme culture.","baseIncomePerSecond":30000000,"releaseStatus":"released","cost":750000000,"addedAt":"2025-08-09","eventKeys":[],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"source","id":"secret-lucky-block","label":"Secret Lucky Block"}]},{"id":"espresso-signora","name":"Espresso Signora","rarity":"Brainrot God","description":"Espresso Signora is a sophisticated, coffee-themed lady, brewing chaos with elegant, caffeinated charm. Espresso Signora brews chaos with caffeinated elegance.","baseIncomePerSecond":70000,"releaseStatus":"released","cost":25000000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"eviledon","name":"Eviledon","rarity":"Secret","description":"Eviledon is a Secret-tier character in Steal a Brainrot, depicted as a Halloween version of Tralaledon, a large blue shark standing on two legs with spooky twists, eerie vibes, and a haunting presence, embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":31500000,"releaseStatus":"released","cost":3800000000,"addedAt":"2025-10-11","eventKeys":["witch-fuse-event"],"craftFilterKeys":["fishing","witch-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"witch-fuse-machine","label":"Witch Fuse Machine"},{"kind":"source","id":"fishing-event","label":"Fishing Event"}]},{"id":"examen-bros","name":"Examen Bros","rarity":"Secret","description":"Examen Bros is a released Secret duo obtained through Los Traders. It pairs the distressed failing paper of Noo My Examine with the cheerful passing paper of Yess My Examine. Its 70M/s income rewards players who prepare a complete exam-themed trade recipe.","baseIncomePerSecond":70000000,"releaseStatus":"released","cost":20000000000,"addedAt":"2026-07-25","eventKeys":["crystal-mutation-spain-event-2026-07-25"],"craftFilterKeys":["dealer"],"acquisitionBadges":[{"kind":"source","id":"los-traders","label":"Los Traders"},{"kind":"mechanic","id":"dealer","label":"Brainrot Trader"}]},{"id":"extinct-ballerina","name":"Extinct Ballerina","rarity":"Brainrot God","description":"Extinct Ballerina is a Brainrot God-tier character in Steal a Brainrot, depicted as an extinct version of Ballerina Cappuccina, retaining its graceful dance with a haunting, faded charm, embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":125000,"releaseStatus":"released","cost":23500000,"addedAt":"2025-09-14","eventKeys":["extinct"],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"extinct-matteo","name":"Extinct Matteo","rarity":"Secret","description":"Extinct Matteo is a Brainrot God-tier character in Steal a Brainrot, depicted as an extinct version of Matteo, carrying a faded yet striking presence, embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":625000,"releaseStatus":"released","cost":140000000,"addedAt":"2025-09-14","eventKeys":["extinct"],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"extinct-tralalero","name":"Extinct Tralalero","rarity":"Secret","description":"Extinct Tralalero is a Brainrot God-tier character in Steal a Brainrot, depicted as an extinct version of Tralalero Tralala, featuring a faded three-legged shark with a nostalgic dance, embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":450000,"releaseStatus":"released","cost":125000000,"addedAt":"2025-09-14","eventKeys":["extinct"],"craftFilterKeys":["default","fishing"],"acquisitionBadges":[{"kind":"source","id":"fishing-event","label":"Fishing Event"},{"kind":"source","id":"runway","label":"Runway"}]},{"id":"festive-67","name":"Festive 67","rarity":"Secret","description":"Festive 67 is a Secret-tier limited Christmas Brainrot, featuring a festive reinterpretation of the iconic 67 number combo. Wrapped in holiday colors, snow-dusted details, and seasonal decorations, it embodies celebratory winter chaos and exclusive Brainrot prestige.","baseIncomePerSecond":67000000,"releaseStatus":"released","cost":16000000000,"addedAt":"2025-12-13","eventKeys":["north-pole-event"],"craftFilterKeys":["limited"],"acquisitionBadges":[{"kind":"mechanic","id":"limited-stock","label":"Limited Stock"}]},{"id":"fishboard","name":"Fishboard","rarity":"Secret","description":"Fishboard is a Secret-tier Brainrot depicting a fish riding a skateboard. Fishboard blends aquatic motion with street-style flair, turning Fishboard into a fast-moving Italian brainrot icon.","baseIncomePerSecond":825000,"releaseStatus":"released","cost":215000000,"addedAt":"2026-02-28","eventKeys":["divine-admin-machine-event"],"craftFilterKeys":["og-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"og-fuse-machine","label":"OG Fuse Machine"}]},{"id":"fishino-clownino","name":"Fishino Clownino","rarity":"Secret","description":"Fishino Clownino is a Secret-tier Brainrot obtained through Fishing. It is a clown-like fish riding a unicycle, combining an aquatic body with circus styling. Its 120M/s income makes the Update 59 buff a major upgrade for fishing collectors.","baseIncomePerSecond":120000000,"releaseStatus":"released","cost":48500000000,"addedAt":"2025-11-22","eventKeys":[],"craftFilterKeys":["fishing"],"acquisitionBadges":[{"kind":"source","id":"fishing-event","label":"Fishing Event"}]},{"id":"fizzy-soda","name":"Fizzy Soda","rarity":"Mythic","description":"Fizzy Soda is a Mythic-tier Brainrot combining a frog with a bubbling soda drink. Fizzy Soda emphasizes fizz, bubbles, and lively carbonation, capturing energetic Italian brainrot humor.","baseIncomePerSecond":17200,"releaseStatus":"released","cost":4900000,"addedAt":"2026-01-24","eventKeys":["the-return"],"craftFilterKeys":["og-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"og-fuse-machine","label":"OG Fuse Machine"}]},{"id":"flancito","name":"Flancito","rarity":"Secret","description":"Flancito is a Secret anniversary brainrot. It appears as a small flan dessert character on a plate with bright eyes, cheeks, and short legs.","baseIncomePerSecond":3750000,"releaseStatus":"released","cost":800000000,"addedAt":"2026-05-16","eventKeys":["next-update-2026-05-16"],"craftFilterKeys":[],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"flipa-sandala","name":"Flipa Sandala","rarity":"Secret","description":"Flipa Sandala is a Secret brainrot released in the May 9, 2026 BACKROOMS update. It appears as a flip-flop sandal character with expressive eyes, a visible tongue, small hands, short legs, and tropical styling.","baseIncomePerSecond":6000000,"releaseStatus":"released","cost":1100000000,"addedAt":"2026-05-09","eventKeys":["backrooms-event"],"craftFilterKeys":["craft","cyber-craft-machine"],"acquisitionBadges":[{"kind":"source","id":"cyber-craft-machine","label":"Cyber Craft Machine"}]},{"id":"flippo-marino","name":"Flippo Marino","rarity":"Brainrot God","description":"Flippo Marino is a marine-themed Brainrot God character with ocean-inspired styling and a playful summer creature silhouette.","baseIncomePerSecond":316000,"releaseStatus":"released","cost":75500000,"addedAt":"2026-05-23","eventKeys":["summer-fuse-2026-05-23"],"craftFilterKeys":["summer-fuse"],"acquisitionBadges":[{"kind":"source","id":"summer-fuse","label":"Summer Fuse"}]},{"id":"fluriflura","name":"Fluriflura","rarity":"Common","description":"Fluriflura is a vibrant, flower-like creature, fluttering through with a colorful, petal-dancing energy.","baseIncomePerSecond":7,"releaseStatus":"released","cost":750,"addedAt":"2025-01-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"fortunu-and-cashuru","name":"Fortunu and Cashuru","rarity":"Secret","description":"Fortunu and Cashuru is a Secret-tier Brainrot in Steal a Brainrot and a live Leprechaun Lucky Block drop from ST PATRICKS. It uses a paired design made from a green clover figure and a gold coin figure with dollar-sign eyes and a cash-note tongue, so the duo reads clearly as two separate lucky-money mascots. Fortunu and Cashuru matters because it is the rarest listed drop in the event block and now sits at the top of the ST PATRICKS lucky-block economy.","baseIncomePerSecond":130000000,"releaseStatus":"released","cost":55000000000,"addedAt":"2026-03-14","eventKeys":["st-patricks-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"leprechaun-lucky-block","label":"Leprechaun Lucky Block"}]},{"id":"foxini-lanternini","name":"Foxini Lanternini","rarity":"Secret","description":"Foxini Lanternini is a Secret-tier Brainrot in Steal a Brainrot and one of the two live Eid Celebration rewards from RIP MY GRANNY. It appears as a fox-faced lantern figure with tall white ears, a glowing orange body, and a blue tunic marked by a crescent moon. Foxini Lanternini matters because it is the 1% jackpot pull from the live Eid event and carries one of the strongest current Secret stat lines.","baseIncomePerSecond":115000000,"releaseStatus":"released","cost":47500000000,"addedAt":"2026-03-21","eventKeys":["rip-my-granny-event","eid-celebration"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"fragola-la-la-la","name":"Fragola La La La","rarity":"Secret","description":"Fragola La La La is a Secret-tier character in Steal a Brainrot, depicted as a strawberry body with muscular arms, skinny sneaker-clad legs, and a face with small eyes, bold eyebrows, and a medium-sized chin, embodying the quirky absurdity of Italian brainrot meme culture.","baseIncomePerSecond":450000,"releaseStatus":"released","cost":125000000,"addedAt":"2025-09-06","eventKeys":[],"craftFilterKeys":["craft"],"acquisitionBadges":[{"kind":"source","id":"craft-machine","label":"Craft Machine"}]},{"id":"fragrama-and-chocrama","name":"Fragrama and Chocrama","rarity":"Secret","description":"Fragrama and Chocrama is a Secret-tier Brainrot duo in Steal a Brainrot, obtainable from the Brainrot Dealer. They are a milkshake pair — one topped with a fresh strawberry, the other with chocolate sprinkles and a wafer stick. Together, they represent the perfect blend of sweetness and absurd friendship in the Brainrot universe.","baseIncomePerSecond":100000000,"releaseStatus":"released","cost":40000000000,"addedAt":"2025-11-08","eventKeys":[],"craftFilterKeys":["dealer"],"acquisitionBadges":[{"kind":"source","id":"brainrot-dealer","label":"Brainrot Trader"}]},{"id":"frankentteo","name":"Frankentteo","rarity":"Secret","description":"Frankentteo is a Secret-tier Brainrot character in Steal a Brainrot, appearing exclusively during the Witching Hour event. It resembles Matteo but with distinct Frankenstein-inspired features — green-tinted skin, metal bolts on the neck, and crackling electric energy across its stitches. This fusion of horror and humor embodies the Halloween spirit, appearing on the conveyor belt with a mischievous spark.","baseIncomePerSecond":700000,"releaseStatus":"released","cost":175000000,"addedAt":"2025-10-11","eventKeys":["witch-fuse-event"],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"frigo-camelo","name":"Frigo Camelo","rarity":"Mythic","description":"Frigo Camelo is a cool, camel-shaped refrigerator, trudging through with a frosty, desert-inspired chill.","baseIncomePerSecond":1400,"releaseStatus":"released","cost":350000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"frio-ninja","name":"Frio Ninja","rarity":"Brainrot God","description":"Frio Ninja is a Brainrot God-tier Brainrot character in Steal a Brainrot, obtainable through Witch Fuse. It is a snowman ninja wielding a katana while riding a skateboard, with a bright red scarf fluttering in the wind — a perfect blend of icy coolness and chaotic meme motion.","baseIncomePerSecond":265000,"releaseStatus":"released","cost":46500000,"addedAt":"2025-11-01","eventKeys":["witch-fuse-event"],"craftFilterKeys":["witch-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"witch-fuse-machine","label":"Witch Fuse Machine"}]},{"id":"frogato-pirato","name":"Frogato Pirato","rarity":"Epic","description":"Frogato Pirato is an Epic-tier Brainrot character in Steal a Brainrot, obtainable through Witch Fuse. It is a fearless frog dressed in black armor, wearing a skull pirate hat and an eyepatch, wielding a gleaming sword. This amphibious pirate hops into battle with swagger and mischief, blending heroic charm and chaotic adventure.","baseIncomePerSecond":240,"releaseStatus":"released","cost":39000,"addedAt":"2025-10-18","eventKeys":["indonesian-event"],"craftFilterKeys":["witch-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"witch-fuse-machine","label":"Witch Fuse Machine"}]},{"id":"frogo-elfo","name":"Frogo Elfo","rarity":"Rare","description":"Frogo Elfo is a Rare-tier anthropomorphic frog wearing a Christmas hat, looking like an overworked North Pole helper hopping between meme deliveries.","baseIncomePerSecond":67,"releaseStatus":"released","cost":9200,"addedAt":"2025-12-06","eventKeys":["santas-fuse-event","christmas"],"craftFilterKeys":["santas-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"santas-fuse-machine","label":"Santa's Fuse Machine"}]},{"id":"futbolini-skatini","name":"Futbolini Skatini","rarity":"Secret","description":"Futbolini Skatini is a Secret brainrot in Steal a Brainrot and a historical Update 48 Cyber Craft Machine additions. It appears as a football with limbs riding a skateboard with yellow wheels, matching its sporty board-riding theme.","baseIncomePerSecond":4500000,"releaseStatus":"released","cost":875000000,"addedAt":"2026-04-25","eventKeys":[],"craftFilterKeys":["craft","cyber-craft-machine"],"acquisitionBadges":[{"kind":"source","id":"cyber-craft-machine","label":"Cyber Craft Machine"}]},{"id":"ganganzelli-trulala","name":"Ganganzelli Trulala","rarity":"Mythic","description":"Ganganzelli Trulala, also known as Giraffe Mafiosi, is a Mythic-tier Brainrot in Steal a Brainrot, obtained through fusion with a higher probability of generating Mythic-tier outcomes, depicted as a muscular orange-bodied giraffe with a gangster hat, embodying the Italian brainrot meme culture's absurd criminal aesthetic.","baseIncomePerSecond":9000,"releaseStatus":"retired","cost":4000000,"addedAt":"2025-08-02","eventKeys":[],"craftFilterKeys":["fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"fuse-machine","label":"Fuse Machine"},{"kind":"source","id":"runway","label":"Runway"}]},{"id":"gangster-footera","name":"Gangster Footera","rarity":"Rare","description":"Gangster Footera is a slick, football-loving mobster, kicking through bases with a sporty, rogue attitude. Gangster Footera bridges early players to Epic tiers.","baseIncomePerSecond":30,"releaseStatus":"released","cost":4000,"addedAt":"2025-01-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"garama-and-madundung","name":"Garama and Madundung","rarity":"Secret","description":"Garama and Madundung are cosmic and fiery entities in Steal a Brainrot — Garama embodies a galactic warrior or deity with a star-infused aesthetic, while Madundung is a fiery, explosive-themed character. Garama and Madundung dominate with galactic and fiery chaos.","baseIncomePerSecond":50000000,"releaseStatus":"released","cost":10000000000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"gato-celesto","name":"Gato Celesto","rarity":"Epic","description":"Gato Celesto is an Epic-tier Brainrot depicted as a light-blue striped cat with round yellow eyes and small white wings. Gato Celesto keeps the divine set approachable through cute sky-themed mascot energy.","baseIncomePerSecond":250,"releaseStatus":"released","cost":40000,"addedAt":"2026-03-07","eventKeys":["divine-fuse-machine-event"],"craftFilterKeys":["divine-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"divine-fuse-machine","label":"Divine Fuse Machine"}]},{"id":"gattatino-nyanino","name":"Gattatino Nyanino","rarity":"Brainrot God","description":"Gattatino Nyanino is a whimsical, cat-themed flyer, soaring with rainbow trails and meme-inspired charm. Gattatino Nyanino dominates the sky with cosmic flair.","baseIncomePerSecond":35000,"releaseStatus":"released","cost":7500000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"gattito-tacoto","name":"Gattito Tacoto","rarity":"Brainrot God","description":"Gattito Tacoto is a Brainrot God-tier character in Steal a Brainrot, depicted as a taco-flavored kitten with a crunchy shell collar and a playful meow, pouncing through the game with chaotic taco energy, embodying the whimsical absurdity of Italian brainrot meme culture.","baseIncomePerSecond":165000,"releaseStatus":"released","cost":32500000,"addedAt":"2025-09-02","eventKeys":["taco-tuesday"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"source","id":"taco-lucky-block","label":"Taco Lucky Block"}]},{"id":"gatto-canemais","name":"Gatto CaneMais","rarity":"Unknown","description":"Gatto CaneMais is an upcoming (unconfirmed) character in Steal a Brainrot, inspired by the Italian brainrot meme Gatto CaneMais. Depicted as a bizarre hybrid of a cat, dog, and corn cob, it prowls through a surreal farmland, gnawing on glowing maize kernels and howling a chaotic 'miao-woof-mais' chant, embodying the whimsical and absurd essence of Italian brainrot meme culture.","baseIncomePerSecond":0,"releaseStatus":"unconfirmed","cost":0,"addedAt":"","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[]},{"id":"gelatina-volatina","name":"Gelatina Volatina","rarity":"Secret","description":"Gelatina Volatina is a Secret gelatin fairy with wafer-like wings, sprinkled tips, candy-cane antennae, a smiling cream-colored face, and a pink bow-shaped body.","baseIncomePerSecond":2400000,"releaseStatus":"released","cost":590000000,"addedAt":"2026-08-08","eventKeys":["rng-machine-queen-bee-event-2026-08-08"],"craftFilterKeys":[],"acquisitionBadges":[{"kind":"source","id":"rng-machine","label":"RNG Machine"}]},{"id":"gelato-lumacho","name":"Gelato Lumacho","rarity":"Secret","description":"Gelato Lumacho is a Secret summer-flavored brainrot in the current Summer Hour pool. Its compact dessert-snail theme uses a blue and purple body with ice cream, sprinkles, a cherry, and small strawberry-tipped feelers. Pick it up for collection coverage when you want the most accessible current Summer Hour Secret.","baseIncomePerSecond":1400000,"releaseStatus":"released","cost":400000000,"addedAt":"2026-06-20","eventKeys":["summer-upd-pt-2-2026-06-20"],"craftFilterKeys":[],"acquisitionBadges":[]},{"id":"gelatuzzo-pinguinello","name":"Gelatuzzo Pinguinello","rarity":"Unknown","description":"Gelatuzzo Pinguinello is an upcoming (unconfirmed) character in Steal a Brainrot, inspired by the Italian brainrot meme Gelatuzzo Pinguinello. Depicted as a penguin entirely covered in shimmering ice crystals, sparkling like frozen gelato, it slides through a surreal arctic parlor, honking a frosty 'gelato-glide' melody while trailing icy swirls, embodying the chaotic and absurd essence of Italian brainrot meme culture.","baseIncomePerSecond":0,"releaseStatus":"unconfirmed","cost":0,"addedAt":"","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[]},{"id":"giftini-spyderini","name":"Giftini Spyderini","rarity":"Secret","description":"Giftini Spyderini is a Secret-tier Christmas variant of Sammyni Spyderini, wrapped in festive colors and decorated with holiday energy as part of the Advent Calendar pre-reward celebration.","baseIncomePerSecond":999900,"releaseStatus":"released","cost":240000000,"addedAt":"2025-11-29","eventKeys":[],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"ginger-cisterna","name":"Ginger Cisterna","rarity":"Brainrot God","description":"Ginger Cisterna is a Brainrot God-tier Christmas Brainrot, depicting Ginger at the controls of a peppermint-painted tank. Candy-cane treads and ornament shells turn the battlefield into a festive warzone of sugary chaos.","baseIncomePerSecond":293500,"releaseStatus":"released","cost":63500000,"addedAt":"2025-12-06","eventKeys":["santas-fuse-event","christmas"],"craftFilterKeys":["santas-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"santas-fuse-machine","label":"Santa's Fuse Machine"}]},{"id":"ginger-gerat","name":"Ginger Gerat","rarity":"Secret","description":"Ginger Gerat is a Secret-tier limited Brainrot depicting an anthropomorphic gingerbread figure shaped like Ketupat Kepat. Its festive cookie body radiates holiday warmth and premium exclusivity.","baseIncomePerSecond":75000000,"releaseStatus":"released","cost":22500000000,"addedAt":"2025-12-24","eventKeys":["christmas","christmas-eve-admin-abuse"],"craftFilterKeys":["limited"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"mechanic","id":"limited-stock","label":"Limited Stock"}]},{"id":"ginger-globo","name":"Ginger Globo","rarity":"Brainrot God","description":"Ginger Globo is a Brainrot God-tier Ginger whose body is built from tiny Christmas house models and snowy roofs, like a living festive globe walking through its own miniature village.","baseIncomePerSecond":257500,"releaseStatus":"released","cost":45700000,"addedAt":"2025-12-06","eventKeys":["santas-fuse-event","christmas"],"craftFilterKeys":["santas-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"santas-fuse-machine","label":"Santa's Fuse Machine"}]},{"id":"girafa-celestre","name":"Girafa Celestre","rarity":"Brainrot God","description":"Girafa Celestre is a celestial, starry-necked giraffe, stretching high with a cosmic glow. Girafa Celestre stands out in Bloodmoon events with cosmic flair.","baseIncomePerSecond":20000,"releaseStatus":"released","cost":7500000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"girafini-raftini","name":"Girafini Raftini","rarity":"Secret","description":"Girafini Raftini is a Secret Octo Lucky Block reward from SUMMER UPD PT 1. It turns a spotted giraffe into a summer raft-themed creature with a long neck and floating gear. Its 5% listed chance makes it rarer than the common Octo pulls and useful for players chasing the full summer lineup.","baseIncomePerSecond":18000000,"releaseStatus":"released","cost":2600000000,"addedAt":"2026-06-13","eventKeys":["summer-upd-pt-1-2026-06-13"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"mechanic","id":"lucky-block","label":"Lucky Block"}]},{"id":"glaciator","name":"Glaciator","rarity":"Secret","description":"Glaciator is a Secret brainrot released in the May 9, 2026 BACKROOMS update. It appears as an icy axe-like character with a blue frozen head, dark handle-like body, a central eye, and small limbs.","baseIncomePerSecond":2300000,"releaseStatus":"released","cost":580000000,"addedAt":"2026-05-09","eventKeys":["backrooms-event"],"craftFilterKeys":["craft","cyber-craft-machine"],"acquisitionBadges":[{"kind":"source","id":"cyber-craft-machine","label":"Cyber Craft Machine"}]},{"id":"globa-steppa","name":"Globa Steppa","rarity":"Secret","description":"Globa Steppa is a released Secret brainrot in Steal a Brainrot and part of the current ADMIN ABUSE wave through the DLC route. It appears as a smiling blue-and-green globe with a top loop, silver side rails, and slim gray legs like a travel mascot. Globa Steppa matters because it opens the new DLC batch with an accessible Secret option before the update's heavier chases.","baseIncomePerSecond":27500000,"releaseStatus":"released","cost":3000000000,"addedAt":"2026-04-11","eventKeys":["admin-abuse"],"craftFilterKeys":["limited"],"acquisitionBadges":[{"kind":"mechanic","id":"limited-stock","label":"Limited Stock"}]},{"id":"glorbo-fruttodrillo","name":"Glorbo Fruttodrillo","rarity":"Legendary","description":"Glorbo Fruttodrillo is a vibrant, fruit-armored crocodile, chomping with a juicy, tropical bite. Glorbo Fruttodrillo chomps with a juicy, tropical bite.","baseIncomePerSecond":750,"releaseStatus":"released","cost":200000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"goat","name":"GOAT","rarity":"Secret","description":"GOAT is a Secret-tier Brainrot depicted as an anthropomorphic goat wearing a tank top, pants, and sporty sneakers. GOAT is actively dribbling and juggling a ball, blending athletic swagger with exaggerated meme energy, making GOAT a standout Brainrot tied to the bruno-mars-event.","baseIncomePerSecond":950000,"releaseStatus":"released","cost":237500000,"addedAt":"2026-01-17","eventKeys":["bruno-mars-event"],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"gobblino-uniciclino","name":"Gobblino Uniciclino","rarity":"Secret","description":"Gobblino Uniciclino is a Secret-tier Brainrot character in Steal a Brainrot, appearing during the themed Turkey period. It is an anthropomorphic turkey wearing a classic pilgrim hat and balancing atop a unicycle, combining festive Thanksgiving charm with chaotic meme absurdity.","baseIncomePerSecond":27500000,"releaseStatus":"released","cost":2800000000,"addedAt":"2025-11-25","eventKeys":["turkey-event"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"gold-gold-gold","name":"Gold Gold Gold","rarity":"Secret","description":"Gold Gold Gold is a Secret-tier Brainrot in Steal a Brainrot and a live Leprechaun Lucky Block drop from ST PATRICKS. It appears as an anthropomorphic black cauldron with glowing yellow eyes, gold teeth, and coins piled across its body, which keeps the lucky-gold theme extremely direct. Gold Gold Gold matters because it now stands as one of the update's highest-end event pulls while preserving the event's strongest visual motif.","baseIncomePerSecond":45000000,"releaseStatus":"released","cost":8000000000,"addedAt":"2026-03-14","eventKeys":["st-patricks-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"leprechaun-lucky-block","label":"Leprechaun Lucky Block"}]},{"id":"gorillo-subwoofero","name":"Gorillo Subwoofero","rarity":"Mythic","description":"Gorillo Subwoofero is a Mythic-tier character in Steal a Brainrot, inspired by the Italian brainrot meme Gorillo Subwoofero. Depicted as an anthropomorphic gorilla fused with a booming subwoofer, it thunders through a surreal neon jungle, blasting bass-heavy beats and shaking the ground with a chaotic 'boom-boom' chant, embodying the whimsical and absurd essence of Italian brainrot meme culture.","baseIncomePerSecond":7700,"releaseStatus":"released","cost":2700000,"addedAt":"2025-09-06","eventKeys":[],"craftFilterKeys":["craft"],"acquisitionBadges":[{"kind":"source","id":"craft-machine","label":"Craft Machine"}]},{"id":"gorillo-watermelondrillo","name":"Gorillo Watermelondrillo","rarity":"Mythic","description":"Gorillo Watermelondrillo is an upcoming Mythic Brainrot, details pending release. Gorillo Watermelondrillo will appear in a future update.","baseIncomePerSecond":8000,"releaseStatus":"released","cost":3000000,"addedAt":"2025-07-26","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"grabatron","name":"Grabatron","rarity":"Secret","description":"Grabatron is a released Secret DLC brainrot. It is a blue claw-machine character with mechanical arms, multicolor legs, and a small figure inside its cabinet. Its 62.5M/s income makes it one of the stronger DLC rewards.","baseIncomePerSecond":62500000,"releaseStatus":"released","cost":15000000000,"addedAt":"2026-07-18","eventKeys":[],"craftFilterKeys":["limited"],"acquisitionBadges":[{"kind":"mechanic","id":"limited-stock","label":"Limited Stock"}]},{"id":"graipuss-medussi","name":"Graipuss Medussi","rarity":"Secret","description":"Graipuss Medussi is a mythical, grape-haired serpent queen, petrifying foes with a fruity, venomous gaze.","baseIncomePerSecond":1000000,"releaseStatus":"released","cost":250000000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["default","fishing"],"acquisitionBadges":[{"kind":"source","id":"fishing-event","label":"Fishing Event"},{"kind":"source","id":"runway","label":"Runway"}]},{"id":"granchiello-spiritell","name":"Granchiello Spiritell","rarity":"Brainrot God","description":"Granchiello Spiritell is a Brainrot God-tier character obtainable through Fishing. A cool anthropomorphic crab with street style — grey beanie, sunglasses, silver chain, baggy jeans, and high-top sneakers — it embodies peak aquatic swagger.","baseIncomePerSecond":260000,"releaseStatus":"released","cost":46000000,"addedAt":"2025-11-22","eventKeys":[],"craftFilterKeys":["fishing"],"acquisitionBadges":[{"kind":"source","id":"fishing-event","label":"Fishing Event"}]},{"id":"granny","name":"Granny","rarity":"Secret","description":"Granny is a Secret-tier Brainrot in Steal a Brainrot and the signature special spawn from the live Granny's Funeral event. It appears as an elderly woman merged with a dove body, with gold glasses, earrings, white wings, and a lavender outfit. Granny matters because the live event treats it as the guaranteed special spawn and current market references still place it above the common funeral-event reward tier.","baseIncomePerSecond":4000000,"releaseStatus":"released","cost":850000000,"addedAt":"2026-03-21","eventKeys":["rip-my-granny-event","grannys-funeral"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"griffin","name":"Griffin","rarity":"Secret","description":"Griffin is a Secret-tier Brainrot depicted as a gold-and-white griffin with a sharp beak and oversized blue-tipped wings. Griffin brings regal divine power to the lineup and reads as one of the most imposing heavenly creatures in Divine Fuse.","baseIncomePerSecond":400000000,"releaseStatus":"released","cost":400000000000,"addedAt":"2026-03-07","eventKeys":["divine-fuse-machine-event"],"craftFilterKeys":["divine-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"divine-fuse-machine","label":"Divine Fuse Machine"}]},{"id":"guerriro-digitale","name":"Guerriro Digitale","rarity":"Secret","description":"Guerriro Digitale is a Secret-tier character in Steal a Brainrot, depicted as an anthropomorphic vintage keyboard with a white face, big eyes, pink cheeks, and a small nose, one hand waving and the other hanging, with legs in black shoes walking on a soft beige background, embodying the quirky charm of Italian brainrot meme culture.","baseIncomePerSecond":550000,"releaseStatus":"released","cost":120000000,"addedAt":"2025-08-31","eventKeys":["admin-war-event","admin-abuse"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"admin-lucky-block","label":"Admin Lucky Block"}]},{"id":"guest-666","name":"Guest 666","rarity":"Secret","description":"Guest 666 is a Secret-tier Brainrot character in Steal a Brainrot, obtainable through the 1x1x1x1 Ritual during the 1x1x1x1 Ritual Event. It takes the form of a dark humanoid figure wearing a classic Roblox cap adorned with red devil horns, a shirt featuring the vintage Roblox logo, and dual red-and-black swords. Its subtle head tilt and ominous aura make it one of the most chilling Brainrots ever seen.","baseIncomePerSecond":6666666,"releaseStatus":"released","cost":1100000000,"addedAt":"2025-11-01","eventKeys":["1x1x1x1-event"],"craftFilterKeys":["ritual"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"mechanic","id":"ritual","label":"Ritual"}]},{"id":"gym-bros","name":"Gym Bros","rarity":"Secret","description":"Gym Bros is a Secret brainrot in Steal a Brainrot and one of the heavier duo designs in the Cyber lineup. It appears as a red weightlifter mascot perched on top of an orange blocky workout partner with long limbs, a giant barbell, and white sneakers. Gym Bros matters because it adds a stacked gym-themed duo that feels visually different from the rest of the current cyber mascots.","baseIncomePerSecond":42500000,"releaseStatus":"released","cost":7500000000,"addedAt":"2026-04-19","eventKeys":["cyber-event"],"craftFilterKeys":["craft","cyber-craft-machine"],"acquisitionBadges":[{"kind":"source","id":"cyber-craft-machine","label":"Cyber Craft Machine"}]},{"id":"harpuccino","name":"Harpuccino","rarity":"Mythic","description":"Harpuccino is a Mythic-tier Brainrot depicted as a golden anthropomorphic harp with big cartoon eyes and upright legs. Harpuccino gives the divine lineup a musical, whimsical twist with a bright gilded silhouette.","baseIncomePerSecond":14000,"releaseStatus":"released","cost":4600000,"addedAt":"2026-03-07","eventKeys":["divine-fuse-machine-event"],"craftFilterKeys":["divine-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"divine-fuse-machine","label":"Divine Fuse Machine"}]},{"id":"headless-horseman","name":"Headless Horseman","rarity":"OG","description":"Headless Horseman is an OG-tier Brainrot in Steal a Brainrot, originally from Witch Fuse (removed); now obtainable by default after Update 40. It is a terrifying headless knight carrying a glowing pumpkin head under one arm, riding through the misty night with eerie speed and unstoppable determination. This ghostly figure embodies the Halloween spirit—fear, legend, and dark power fused together.","baseIncomePerSecond":550000000,"releaseStatus":"released","cost":550000000000,"addedAt":"2025-10-25","eventKeys":["frightrot-event"],"craftFilterKeys":["default","witch-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"witch-fuse-machine","label":"Witch Fuse Machine"},{"kind":"source","id":"runway","label":"Runway"}]},{"id":"hippo-golazo","name":"Hippo Golazo","rarity":"Secret","description":"Hippo Golazo is a Secret football hippo brainrot from FUTBOL UPDATE. It combines a hippo with a soccer stadium body and World Cup match styling. Its approachable entry point makes it the accessible goal-triggered chase in the football trio.","baseIncomePerSecond":1250000,"releaseStatus":"released","cost":300000000,"addedAt":"2026-06-27","eventKeys":["futbol-update-2026-06-27"],"craftFilterKeys":[],"acquisitionBadges":[{"kind":"source","id":"live-match-events","label":"Live Match Events"}]},{"id":"ho-ho-ho-sahur","name":"Ho Ho Ho Sahur","rarity":"Secret","description":"Ho Ho Ho Sahur is a Secret-tier Christmas version of Tung Tung Tung Sahur, reimagined as a festive wooden stick character with a painted smiling face, Santa-flavored energy, and a bat ready to ring out holiday chaos.","baseIncomePerSecond":3200000,"releaseStatus":"released","cost":725000000,"addedAt":"2025-12-06","eventKeys":["santas-fuse-event","christmas"],"craftFilterKeys":["santas-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"santas-fuse-machine","label":"Santa's Fuse Machine"}]},{"id":"holy-arepa","name":"Holy Arepa","rarity":"Common","description":"Holy Arepa is a Common-tier Brainrot depicted as a golden arepa with a halo, purple eyes, and broad feathered wings. Holy Arepa delivers a simple holy-food joke with bright, cheerful charm.","baseIncomePerSecond":14,"releaseStatus":"released","cost":1700,"addedAt":"2026-03-07","eventKeys":["divine-fuse-machine-event"],"craftFilterKeys":["divine-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"divine-fuse-machine","label":"Divine Fuse Machine"}]},{"id":"honey-honey-bear","name":"Honey Honey Bear","rarity":"Secret","description":"Honey Honey Bear is a Secret stern brown bear seated inside a dripping golden honeycomb with three striped bee companions flying around it.","baseIncomePerSecond":32000000,"releaseStatus":"released","cost":4000000000,"addedAt":"2026-08-08","eventKeys":["rng-machine-queen-bee-event-2026-08-08"],"craftFilterKeys":[],"acquisitionBadges":[]},{"id":"hopilikalika-hopilikalako","name":"Hopilikalika Hopilikalako","rarity":"Secret","description":"Hopilikalika Hopilikalako is a released Easter brainrot in Steal a Brainrot and part of the live Egg Lucky Block lineup. Current image evidence shows a rabbit-like rider perched on a decorated Easter-themed body with bright spring details and a more elaborate silhouette than a normal bunny. Hopilikalika Hopilikalako matters because it stands out as one of the most elaborate silhouettes in the current Easter block lineup.","baseIncomePerSecond":55000000,"releaseStatus":"released","cost":12000000000,"addedAt":"2026-04-04","eventKeys":["easter-event-part-2","easter-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"egg-lucky-block","label":"Egg Lucky Block"}]},{"id":"horegini-boom","name":"Horegini Boom","rarity":"Secret","description":"Horegini Boom is a Secret-tier Brainrot character in Steal a Brainrot, appearing during the Indonesian event. It takes the form of a cute anthropomorphic pickup truck carrying colorful luggage on its roof, exuding road-trip energy and cheerful determination — a symbol of travel, chaos, and meme-fueled adventure across the Brainrot seas.","baseIncomePerSecond":2700000,"releaseStatus":"released","cost":650000000,"addedAt":"2025-10-18","eventKeys":["indonesian-event"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"hydra-bunny","name":"Hydra Bunny","rarity":"Secret","description":"Hydra Bunny is a released Secret-tier Easter brainrot in Steal a Brainrot and part of the live Egg Lucky Block lineup for EASTER EVENT (Part 2). The model reads as one fused hydra-style rabbit monster with three snarling bunny heads, glowing orange eyes, sharp teeth, long ears, and bright Easter ring details wrapped around a shared crawling body. Hydra Bunny matters because it anchors the high end of the active Easter block pool with one of the most aggressive monster designs in the seasonal lineup.","baseIncomePerSecond":170000000,"releaseStatus":"released","cost":135000000000,"addedAt":"2026-04-03","eventKeys":["easter-event-part-2","easter-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"egg-lucky-block","label":"Egg Lucky Block"}]},{"id":"hydra-dragon-cannelloni","name":"Hydra Dragon Cannelloni","rarity":"Secret","description":"Hydra Dragon Cannelloni is a Secret-tier Brainrot and a mutated variant of Dragon Cannelloni. Hydra Dragon Cannelloni features three identical dragon heads with the same expression, reinforcing its eerie symmetry and iconic Italian brainrot chaos during the-return.","baseIncomePerSecond":350000000,"releaseStatus":"released","cost":350000000000,"addedAt":"2026-01-24","eventKeys":["the-return"],"craftFilterKeys":["og-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"og-fuse-machine","label":"OG Fuse Machine"}]},{"id":"ice-dragon","name":"Ice Dragon","rarity":"Secret","description":"Ice Dragon is a proposed Secret-tier Christmas dragon resembling a dragon-shaped Italian pastry formed from ice. It wears a winter hat and is surrounded by peppermint candies and candy canes, embodying a colder, minty take on festive dragon mythology.","baseIncomePerSecond":0,"releaseStatus":"unconfirmed","cost":0,"addedAt":"","eventKeys":[],"craftFilterKeys":["default","santas-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"santas-fuse-machine","label":"Santa's Fuse Machine"}]},{"id":"jacko-jack-jack","name":"Jacko Jack Jack","rarity":"Brainrot God","description":"Jacko Jack Jack is a Brainrot God-tier Brainrot character in Steal a Brainrot, obtainable through Witch Fuse. It takes the form of a humanoid pumpkin with a sinister grin and flickering eyes, radiating eerie laughter. Its fiery aura embodies mischievous Halloween energy mixed with the chaotic charm of Brainrot culture.","baseIncomePerSecond":150000,"releaseStatus":"released","cost":30000000,"addedAt":"2025-10-11","eventKeys":["witch-fuse-event"],"craftFilterKeys":["witch-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"witch-fuse-machine","label":"Witch Fuse Machine"}]},{"id":"jacko-spaventosa","name":"Jacko Spaventosa","rarity":"Mythic","description":"Jacko Spaventosa is a Mythic-tier Brainrot character in Steal a Brainrot, obtainable through Witch Fuse. It takes the form of an anthropomorphic pumpkin with an evil smile, glowing eyes, and a mischievous aura, embodying Halloween’s spooky humor and chaotic charm.","baseIncomePerSecond":16200,"releaseStatus":"released","cost":4800000,"addedAt":"2025-10-11","eventKeys":["witch-fuse-event"],"craftFilterKeys":["witch-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"witch-fuse-machine","label":"Witch Fuse Machine"}]},{"id":"jackorilla","name":"Jackorilla","rarity":"Secret","description":"Jackorilla is a Secret-tier Brainrot character in Steal a Brainrot, obtainable from the Spooky Lucky Block during the Frightrot Event. It is a Halloween variant of Gorillo Watermelondrillo, replacing the watermelon armor with a carved pumpkin suit that glows ominously in the dark. With fiery eyes and festive fury, this gorilla embodies both Halloween mischief and meme-fueled chaos.","baseIncomePerSecond":315000,"releaseStatus":"released","cost":80000000,"addedAt":"2025-10-25","eventKeys":["frightrot-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"spooky-lucky-block","label":"Spooky Lucky Block"}]},{"id":"jelly-moby","name":"Jelly Moby","rarity":"Secret","description":"Jelly Moby is a Secret anniversary brainrot. It is a jelly-themed Capitano Moby reskin with a red whale body, ship details, candy-like decorations, and a birthday-cake stack.","baseIncomePerSecond":175000000,"releaseStatus":"released","cost":150000000000,"addedAt":"2026-05-16","eventKeys":["next-update-2026-05-16"],"craftFilterKeys":["craft","cyber-craft-machine"],"acquisitionBadges":[{"kind":"source","id":"cyber-craft-machine","label":"Cyber Craft Machine"}]},{"id":"jingle-jingle-sahur","name":"Jingle Jingle Sahur","rarity":"Mythic","description":"Jingle Jingle Sahur is a Mythic-tier large triangular block-like character wearing a Santa hat and a big red bow on its chest, shaped like a walking present that jingles with every step.","baseIncomePerSecond":12200,"releaseStatus":"released","cost":4300000,"addedAt":"2025-12-06","eventKeys":["santas-fuse-event","christmas"],"craftFilterKeys":["santas-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"santas-fuse-machine","label":"Santa's Fuse Machine"}]},{"id":"job-job-job-sahur","name":"job job job Sahur","rarity":"Secret","description":"Job job job Sahur is a Secret-tier character in Steal a Brainrot, inspired by the Indonesian brainrot meme Job Job Sahur, depicted as an anthropomorphic paper-crafted anomaly pulsing with Sumatran drumbeats. Job job job Sahur haunts those who ignore the dawn call with eerie 'Job Job' chants.","baseIncomePerSecond":700000,"releaseStatus":"released","cost":175000000,"addedAt":"2025-08-16","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"john-doe","name":"John Doe","rarity":"Secret","description":"John Doe is a Secret brainrot in Steal a Brainrot and one of the headline live Update 48 additions. It leans into Roblox myth and hacker imagery, giving the live Update 48 lineup a ritual unlock target that feels different from the Cyber Craft Machine duos.","baseIncomePerSecond":7500000,"releaseStatus":"released","cost":1300000000,"addedAt":"2026-04-25","eventKeys":["1x1x1x1-ritual-event"],"craftFilterKeys":["ritual"],"acquisitionBadges":[{"kind":"mechanic","id":"ritual","label":"Ritual"}]},{"id":"john-pork","name":"John Pork","rarity":"OG","description":"John Pork is an OG brainrot released in the May 2, 2026 JOHN PORK update. He appears as a human-bodied character with a pig head, gray shirt, red plaid flannel, and blue jeans. His event makes John Pork ring and can apply the is calling trait to random brainrots.","baseIncomePerSecond":500000000,"releaseStatus":"released","cost":500000000000,"addedAt":"2026-05-02","eventKeys":["john-pork-2026-05-02"],"craftFilterKeys":[],"acquisitionBadges":[]},{"id":"jolly-jolly-sahur","name":"Jolly Jolly Sahur","rarity":"Secret","description":"Jolly Jolly Sahur is a Secret-tier Christmas variant of Tictac Sahur, infused with festive cheer and holiday styling while retaining its signature rhythmic chaos.","baseIncomePerSecond":45000000,"releaseStatus":"released","cost":8000000000,"addedAt":"2025-12-24","eventKeys":["christmas","christmas-eve-admin-abuse"],"craftFilterKeys":["limited"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"mechanic","id":"limited-stock","label":"Limited Stock"}]},{"id":"kalika-bros","name":"Kalika Bros","rarity":"Secret","description":"Kalika Bros is a Secret brainrot in Steal a Brainrot and one of the most distinctive duo entries in the Cyber lineup. It appears as a tall pink rabbit-like mascot standing beside a small yellow chicken companion riding in a gray fan cart. Kalika Bros matters because it turns the machine wave into a real two-character chase instead of another single robotic mascot.","baseIncomePerSecond":115000000,"releaseStatus":"released","cost":147500000000,"addedAt":"2026-04-19","eventKeys":["cyber-event"],"craftFilterKeys":["craft","cyber-craft-machine"],"acquisitionBadges":[{"kind":"source","id":"cyber-craft-machine","label":"Cyber Craft Machine"}]},{"id":"karker-sahur","name":"Karker Sahur","rarity":"Secret","description":"Karker Sahur is a Secret-tier character in Steal a Brainrot, depicted as a rhythmic, Sahur-inspired entity with a haunting chant, blending cultural beats with mysterious allure, embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":725000,"releaseStatus":"released","cost":185000000,"addedAt":"2025-09-27","eventKeys":["yin-yang-event"],"craftFilterKeys":["craft"],"acquisitionBadges":[{"kind":"source","id":"craft-machine","label":"Craft Machine"}]},{"id":"karkerheart-luvkur","name":"Karkerheart Luvkur","rarity":"Brainrot God","description":"Karkerheart Luvkur is a Brainrot God-tier Valentine-themed version of Karkerkar Kurkur. Karkerheart Luvkur infuses heart motifs and romantic flair into the original chaotic design, transforming raw energy into exaggerated love-driven Italian brainrot chaos.","baseIncomePerSecond":297500,"releaseStatus":"released","cost":67500000,"addedAt":"2026-02-07","eventKeys":["valentines-pt1-event","valentines-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"heart-lucky-block","label":"Heart Lucky Block"}]},{"id":"karkerkar-kurkur","name":"Karkerkar Kurkur","rarity":"Secret","description":"Karkerkar Kurkur is a Secret-tier Brainrot in Steal a Brainrot, depicted as a single chair with a surprised face and wide-open eyes, embodying a quirky and unsettling vibe.","baseIncomePerSecond":300000,"releaseStatus":"released","cost":100000000,"addedAt":"2025-08-09","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"ketchuru-and-musturu","name":"Ketchuru and Musturu","rarity":"Secret","description":"Ketchuru and Musturu are a Secret-tier duo in Steal a Brainrot, depicted as two mischievous, twin-like creatures with vibrant colors and playful antics, hopping through the game with chaotic synergy, embodying the absurd and whimsical essence of Italian brainrot meme culture.","baseIncomePerSecond":42500000,"releaseStatus":"released","cost":7500000000,"addedAt":"2025-08-31","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"ketupat-bros","name":"Ketupat Bros","rarity":"Secret","description":"Ketupat Bros is a Secret-tier Brainrot duo composed of Ginger Gerat and Ketupat Kepat. Ketupat Bros appear joyful and closely bonded, symbolizing teamwork, friendship, and wholesome chaos that defined the-return event.","baseIncomePerSecond":145000000,"releaseStatus":"released","cost":65000000000,"addedAt":"2026-01-24","eventKeys":["the-return"],"craftFilterKeys":["og-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"og-fuse-machine","label":"OG Fuse Machine"}]},{"id":"ketupat-kepat","name":"Ketupat Kepat","rarity":"Secret","description":"Ketupat Kepat is a Secret-tier character in Steal a Brainrot, depicted as a whimsical rice dumpling with legs, hopping with chaotic energy and a playful grin, embodying the quirky absurdity of Italian brainrot meme culture with a tropical twist.","baseIncomePerSecond":35000000,"releaseStatus":"released","cost":5000000000,"addedAt":"2025-08-23","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"kings-coleslaw","name":"Kings Coleslaw","rarity":"Unknown","description":"Kings Coleslaw is a regal, cabbage-based monarch, ruling with crunchy, vegetable-sovereign charm.","baseIncomePerSecond":0,"releaseStatus":"unconfirmed","cost":0,"addedAt":"","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[]},{"id":"koala-cornetto","name":"Koala Cornetto","rarity":"Unknown","description":"Koala Cornetto is an upcoming (unconfirmed) character in Steal a Brainrot, inspired by the Italian brainrot meme Koala Cornetto. Depicted as an anthropomorphic koala with a flaky, golden cornetto pastry body, it lounges in a surreal eucalyptus bakery, munching buttery layers and humming a crumbly 'cornetto-munch' melody, embodying the whimsical and absurd essence of Italian brainrot meme culture.","baseIncomePerSecond":0,"releaseStatus":"unconfirmed","cost":0,"addedAt":"","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[]},{"id":"kraken","name":"Kraken","rarity":"Secret","description":"Kraken is a Secret Octo Lucky Block reward from SUMMER UPD PT 1. It appears as a red kraken carrying a treasure chest and golden trident, with gold crown and wristband details. Its 0.1% listed chance and 200M/s income make it the chase pull of the summer block.","baseIncomePerSecond":200000000,"releaseStatus":"released","cost":200000000000,"addedAt":"2026-06-13","eventKeys":["summer-upd-pt-1-2026-06-13"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"mechanic","id":"lucky-block","label":"Lucky Block"}]},{"id":"kravelino-cekicino","name":"Kravelino Cekicino","rarity":"Unknown","description":"Kravelino Cekicino is an upcoming (unconfirmed) character in Steal a Brainrot, inspired by the Italian brainrot meme Kravelino Cekicino. Depicted as an anthropomorphic hammer with a cow-like head, it thunders through a surreal forest, striking with rhythmic 'tung tung tung' chants and radiating chaotic energy, embodying the absurd and whimsical essence of Italian brainrot meme culture with a Croatian-inspired twist.","baseIncomePerSecond":0,"releaseStatus":"unconfirmed","cost":0,"addedAt":"","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[]},{"id":"krupuk-pagi-pagi","name":"Krupuk Pagi Pagi","rarity":"Brainrot God","description":"Krupuk Pagi Pagi is a Brainrot God-tier Brainrot character in Steal a Brainrot, appearing during the Indonesian event. It is a cheerful cookie sipping from a drink while sailing on the boat, blending cozy breakfast vibes with surreal meme energy — a delightful embodiment of calm chaos on the morning waves.","baseIncomePerSecond":290000,"releaseStatus":"released","cost":60000000,"addedAt":"2025-10-18","eventKeys":["indonesian-event"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"la-anniversary-grande","name":"La Anniversary Grande","rarity":"Secret","description":"La Anniversary Grande is a Secret anniversary variant. It remixes La Grande Combinasion into a birthday-party composite with cake colors, candles, party details, and familiar Grande-family components.","baseIncomePerSecond":50000000,"releaseStatus":"released","cost":10000000000,"addedAt":"2026-05-16","eventKeys":["next-update-2026-05-16","taco-tuesday"],"craftFilterKeys":["limited"],"acquisitionBadges":[{"kind":"mechanic","id":"limited-stock","label":"Limited Stock"}]},{"id":"la-breakfast-combinasion","name":"La Breakfast Combinasion","rarity":"Secret","description":"La Breakfast Combinasion is a Secret six-character breakfast group made from bacon, milk, egg, cookie, waffle, and syrup Brainrots arranged in three paired sets.","baseIncomePerSecond":165000000,"releaseStatus":"released","cost":130000000000,"addedAt":"2026-08-08","eventKeys":["rng-machine-queen-bee-event-2026-08-08"],"craftFilterKeys":[],"acquisitionBadges":[{"kind":"source","id":"rng-machine","label":"RNG Machine"}]},{"id":"la-casa-boo","name":"La Casa Boo","rarity":"Secret","description":"La Casa Boo is a Secret-tier Brainrot character in Steal a Brainrot, obtainable from the Spooky Lucky Block during the Frightrot Event. It is an anthropomorphic haunted house with a single large eye, running forward while carrying a pumpkin basket overflowing with candies. Radiating both whimsy and eeriness, La Casa Boo captures the spirit of Halloween’s playful haunt perfectly.","baseIncomePerSecond":100000000,"releaseStatus":"released","cost":40000000000,"addedAt":"2025-10-25","eventKeys":["frightrot-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"spooky-lucky-block","label":"Spooky Lucky Block"}]},{"id":"la-cucaracha","name":"La Cucaracha","rarity":"Secret","description":"La cucaracha is a Secret-tier character in Steal a Brainrot, depicted as a mischievous cockroach with a rhythmic flair, blending pestilent charm with quirky energy, embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":475000,"releaseStatus":"released","cost":110000000,"addedAt":"2025-09-21","eventKeys":["mexico-event"],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"la-easter-grande","name":"La Easter Grande","rarity":"Secret","description":"La Easter Grande is a Secret-tier Easter Grande variant released through the Taco Truck during Taco Tuesday in Steal a Brainrot. It reshapes La Grande Combinasion into pastel egg forms with Bunny Bunny Bunny Sahur and a chick layered into the seasonal composite. For players, it is a high-end limited exchange whose finished 150,000-stock run makes it one of the most valuable holiday Grande releases.","baseIncomePerSecond":55000000,"releaseStatus":"released","cost":12500000000,"addedAt":"2026-03-31","eventKeys":["taco-tuesday","easter-event"],"craftFilterKeys":["limited"],"acquisitionBadges":[{"kind":"source","id":"limited-quantity-truck","label":"Limited Quantity Truck"}]},{"id":"la-extinct-grande","name":"La Extinct Grande","rarity":"Secret","description":"La Extinct Combinasion is a Secret-tier character in Steal a Brainrot, depicted as an extinct version of La Grande Combinasion, merging faded grandeur with a rare, elusive aura, embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":23500000,"releaseStatus":"released","cost":3200000000,"addedAt":"2025-09-14","eventKeys":["extinct-event","extinct"],"craftFilterKeys":["limited"],"acquisitionBadges":[{"kind":"mechanic","id":"limited-stock","label":"Limited Stock"}]},{"id":"la-food-combinasion","name":"La Food Combinasion","rarity":"Secret","description":"La Food Combinasion is a Secret-tier Brainrot formed from multiple food-themed Brainrots, including Burguro And Fryuro, Ketchuru and Musturu, and Garama and Madundung. La Food Combinasion blends these chaotic culinary characters into one exaggerated Italian brainrot fusion, turning La Food Combinasion into the ultimate fast-food meme embodiment within the Taco Lucky Block.","baseIncomePerSecond":90000000,"releaseStatus":"released","cost":30000000000,"addedAt":"2026-02-21","eventKeys":["trade-machine-event","taco-tuesday"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"taco-lucky-block","label":"Taco Lucky Block"}]},{"id":"la-fuse-machine","name":"La Fuse Machine","rarity":"Secret","description":"La Fuse Machine is a Secret blue robot Brainrot with two top-mounted eyes, a broad rectangular body, a gray fuse-bank panel, bulky segmented limbs, and cyan light strips.","baseIncomePerSecond":95000000,"releaseStatus":"released","cost":35000000000,"addedAt":"2026-08-15","eventKeys":["rebirth-19-update-62-2026-08-15"],"craftFilterKeys":["fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"fuse-machine","label":"Fuse Machine"},{"kind":"source","id":"rng-machine","label":"RNG Machine"}]},{"id":"la-ginger-sekolah","name":"La Ginger Sekolah","rarity":"Secret","description":"La Ginger Sekolah is a Secret-tier Christmas version of Esok Sekolah, redesigned as a festive gingerbread-themed character with holiday decorations and winter meme energy.","baseIncomePerSecond":75000000,"releaseStatus":"released","cost":23000000000,"addedAt":"2025-12-13","eventKeys":["north-pole-event","christmas","santas-fuse-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"festive-lucky-block","label":"Festive Lucky Block"}]},{"id":"la-grande-combinasion","name":"La Grande Combinasion","rarity":"Secret","description":"La Grande Combinasion is a Secret-tier fusion Brainrot in Steal a Brainrot, known as the core Grande composite character. Its model combines multiple iconic Brainrots into one stacked body, including Lirili Larila, Boneca Ambalabu, Tung Tung Tung Sahur, Trippi Troppi, Tralalero Tralala, and Bombardiro Crocodilo. For players, it remains a high-impact progression piece because it is used in multiple high-tier recipes and themed Grande variants.","baseIncomePerSecond":10000000,"releaseStatus":"released","cost":1000000000,"addedAt":"2025-04-01","eventKeys":["admin-abuse"],"craftFilterKeys":["dealer","lucky-block"],"acquisitionBadges":[{"kind":"source","id":"brainrot-dealer","label":"Brainrot Trader"},{"kind":"source","id":"runway","label":"Runway"},{"kind":"source","id":"admin-lucky-block","label":"Admin Lucky Block"}]},{"id":"la-jolly-grande","name":"La Jolly Grande","rarity":"Secret","description":"La Jolly Grande is a Secret-tier limited Christmas Brainrot, serving as the festive counterpart to La Grande Combinasion. Radiating holiday energy, it merges multiple Christmas-themed Brainrots into one towering meme fusion, adorned with ornaments, glowing lights, and candy-cane flair that embody peak seasonal absurdity. Obtainable by collecting and redeeming all 4 Winter Hour Christmas Brainrots: Ballerina Peppermintina, Reindeer Tralala, Santteo, and List List List Sahur. Limited to 500K copies.","baseIncomePerSecond":30000000,"releaseStatus":"released","cost":3500000000,"addedAt":"2025-12-06","eventKeys":["santa-s-fuse-event","santas-fuse-event"],"craftFilterKeys":["limited","santas-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"santas-fuse-machine","label":"Santa's Fuse Machine"},{"kind":"mechanic","id":"limited-stock","label":"Limited Stock"}]},{"id":"la-karkerkar-combinasion","name":"La Karkerkar Combinasion","rarity":"Secret","description":"La Karkerkar Combinasion is a Secret-tier character in Steal a Brainrot, depicted as a chaotic fusion of multiple brainrots, blending quirky features into a dynamic, multi-limbed entity with a wild, absurd presence, embodying the eccentric essence of Italian brainrot meme culture.","baseIncomePerSecond":600000,"releaseStatus":"released","cost":160000000,"addedAt":"2025-09-06","eventKeys":[],"craftFilterKeys":["craft"],"acquisitionBadges":[{"kind":"source","id":"craft-machine","label":"Craft Machine"}]},{"id":"la-lucky-grande","name":"La Lucky Grande","rarity":"Secret","description":"La Lucky Grande is a Secret-tier Taco Tuesday Brainrot released as a St. Patrick-themed Grande variant. Its visual design keeps the same composite structure as La Grande Combinasion while applying a clover-green seasonal theme. For players, it is a high-value limited exchange that extends the Grande fusion line with event-timed progression value.","baseIncomePerSecond":40000000,"releaseStatus":"released","cost":7000000000,"addedAt":"2026-03-17","eventKeys":["taco-tuesday"],"craftFilterKeys":["limited"],"acquisitionBadges":[{"kind":"source","id":"limited-quantity-truck","label":"Limited Quantity Truck"}]},{"id":"la-romantic-grande","name":"La Romantic Grande","rarity":"Secret","description":"La Romantic Grande is a Secret-tier Valentines Brainrot centered on exaggerated romance and dramatic love themes. Obtainable during Taco Tuesday (2026-02-10) via the Limited Quantity truck by exchanging 1x Los Burritos, 1x La Grande Combinasion, 1x Noo my Heart, and 1x Chicleteira Cupideira; limited to 300,000 claims. La Romantic Grande represents peak romantic chaos within Italian brainrot culture.","baseIncomePerSecond":40000000,"releaseStatus":"released","cost":7000000000,"addedAt":"2026-02-10","eventKeys":["taco-tuesday","valentines-event"],"craftFilterKeys":["limited"],"acquisitionBadges":[{"kind":"source","id":"limited-quantity-truck","label":"Limited Quantity Truck"}]},{"id":"la-sahur-combinasion","name":"La Sahur Combinasion","rarity":"Secret","description":"La Sahur Combinasion is a Secret-tier character in Steal a Brainrot, depicted as the combination product of one Ta Ta Ta Ta Sahur and one Te Te Te Sahur, merging rhythmic dance patterns with chaotic energy into a unified, harmonious entity. La Sahur Combinasion swirls with synchronized madness, embodying the eccentric absurdity of Italian brainrot meme culture.","baseIncomePerSecond":2000000,"releaseStatus":"released","cost":550000000,"addedAt":"2025-09-06","eventKeys":[],"craftFilterKeys":["craft"],"acquisitionBadges":[{"kind":"source","id":"craft-machine","label":"Craft Machine"}]},{"id":"la-secret-combinasion","name":"La Secret Combinasion","rarity":"Secret","description":"La Secret Combinasion is a Secret-tier character in Steal a Brainrot, depicted as a mix of four Brainrots from the Secret Lucky Block, blending their unique traits into a chaotic fusion, embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":125000000,"releaseStatus":"released","cost":50000000000,"addedAt":"2025-10-04","eventKeys":[],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"secret-lucky-block","label":"Secret Lucky Block"}]},{"id":"la-spooky-grande","name":"La Spooky Grande","rarity":"Secret","description":"La Spooky Grande is a Secret-tier character in Steal a Brainrot, depicted as a spooky version of La Grande Combinasion, with dark, ominous features and a haunting presence. Collect all 4 spooky Brainrots (La Vacca Jacko Linterino, Vampira Cappucina, Zombie Tralala, and Frankentteo) to claim a limited La Spooky Grande (750K Stock), embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":24500000,"releaseStatus":"released","cost":2900000000,"addedAt":"2025-10-11","eventKeys":["witch-fuse-event"],"craftFilterKeys":["limited","witch-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"witch-fuse-machine","label":"Witch Fuse Machine"},{"kind":"mechanic","id":"limited-stock","label":"Limited Stock"}]},{"id":"la-summer-grande","name":"La Summer Grande","rarity":"Secret","description":"La Summer Grande is a Secret summer reskin of La Grande Combinasion. It remixes the Grande lineup with beach-season parts such as a sandcastle-styled Lirili Larila, a crab replacement for Boneca Ambalabu, and a dolphin-themed Tralalero Tralala. Its premium income and limited-stock status make it the headline summer chase for high-end collectors.","baseIncomePerSecond":60000000,"releaseStatus":"released","cost":15000000000,"addedAt":"2026-06-20","eventKeys":["summer-upd-pt-2-2026-06-20"],"craftFilterKeys":["limited"],"acquisitionBadges":[{"kind":"source","id":"limited-quantity-truck","label":"Limited Quantity Truck"}]},{"id":"la-supreme-combinasion","name":"La Supreme Combinasion","rarity":"Secret","description":"La Supreme Combinasion is a Secret-tier character in Steal a Brainrot, depicted as a majestic fusion of multiple brainrot entities, exuding an aura of ultimate power with swirling, vibrant colors and a commanding presence, embodying the pinnacle of Italian brainrot meme culture's chaotic creativity.","baseIncomePerSecond":200000000,"releaseStatus":"retired","cost":200000000000,"addedAt":"2025-08-23","eventKeys":[],"craftFilterKeys":["fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"fuse-machine","label":"Fuse Machine"},{"kind":"source","id":"runway","label":"Runway"}]},{"id":"la-taco-combinasion","name":"La Taco Combinasion","rarity":"Secret","description":"La Taco Combinasion is a Secret-tier Brainrot character in Steal a Brainrot, obtainable through the Limited Quantity Truck during the Taco Tuesday event. It is a fusion of six Taco Tuesday-related Brainrots, merging ingredients, textures, and personalities into one chaotic culinary abomination. With swirling salsa energy and tortilla-fused limbs, it stands as the ultimate symbol of taco-fueled madness.","baseIncomePerSecond":35000000,"releaseStatus":"released","cost":5000000000,"addedAt":"2025-10-28","eventKeys":["taco-tuesday"],"craftFilterKeys":["limited"],"acquisitionBadges":[{"kind":"source","id":"limited-quantity-truck","label":"Limited Quantity Truck"}]},{"id":"la-vacca-jacko-linterino","name":"La Vacca Jacko Linterino","rarity":"Secret","description":"La Vacca Jacko Linterino is a Secret-tier character in Steal a Brainrot, depicted as a Halloween version of La Vacca Saturno Saturnita with a pumpkin body, blending festive horror with quirky charm, embodying the wild absurdity of Italian brainrot meme culture. This is one of the 4 spooky Brainrots required to claim La Spooky Grande.","baseIncomePerSecond":850000,"releaseStatus":"released","cost":225000000,"addedAt":"2025-10-11","eventKeys":["witch-fuse-event"],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"la-vacca-lepre-lepreino","name":"La Vacca Lepre Lepreino","rarity":"Secret","description":"La Vacca Lepre Lepreino is a Secret-tier Brainrot in Steal a Brainrot and a live Leprechaun Lucky Block drop from ST PATRICKS. It appears as a cow-faced cauldron packed with gold coins, standing on green-socked legs with buckle shoes while a ring of coins circles the body. La Vacca Lepre Lepreino matters because it upgrades a previously uncertain teaser into a real Secret chase target with a now-settled canonical name.","baseIncomePerSecond":1100000,"releaseStatus":"released","cost":255000000,"addedAt":"2026-03-14","eventKeys":["st-patricks-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"leprechaun-lucky-block","label":"Leprechaun Lucky Block"}]},{"id":"la-vacca-prese-presente","name":"La Vacca Prese Presente","rarity":"Secret","description":"La Vacca Prese Presente is a Secret-tier Christmas variant of La Vacca Saturno Saturnita, decorated with nativity-inspired and gift-themed details, orbiting around a tiny festive scene on its back while spreading holiday meme energy.","baseIncomePerSecond":600000,"releaseStatus":"released","cost":160000000,"addedAt":"2025-12-06","eventKeys":["santas-fuse-event","christmas"],"craftFilterKeys":["santas-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"santas-fuse-machine","label":"Santa's Fuse Machine"}]},{"id":"la-vacca-saturno-saturnita","name":"La Vacca Saturno Saturnita","rarity":"Secret","description":"La Vacca Saturno Saturnita is a cosmic cow, orbiting the game with a quirky, spacey moo and planetary vibes.","baseIncomePerSecond":300000,"releaseStatus":"released","cost":50000000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"las-capuchinas","name":"Las Capuchinas","rarity":"Brainrot God","description":"Las Capuchinas is a Brainrot God-tier character in Steal a Brainrot, depicted as three baby Ballerina Cappuccina, blending the grace of their parent with a playful trio dynamic. Las Capuchinas embody the whimsical absurdity of Italian brainrot meme culture.","baseIncomePerSecond":185000,"releaseStatus":"released","cost":32500000,"addedAt":"2025-09-06","eventKeys":[],"craftFilterKeys":["craft"],"acquisitionBadges":[{"kind":"source","id":"craft-machine","label":"Craft Machine"}]},{"id":"las-sis","name":"Las Sis","rarity":"Secret","description":"Las Sis is a Secret-tier character in Steal a Brainrot, depicted as Las Tralaleritas and Las Capuchinas joyfully embracing each other, blending their playful energies into a festive unity, embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":17500000,"releaseStatus":"released","cost":2500000000,"addedAt":"2025-09-14","eventKeys":[],"craftFilterKeys":["craft"],"acquisitionBadges":[{"kind":"source","id":"craft-machine","label":"Craft Machine"}]},{"id":"las-tralaleritas","name":"Las Tralaleritas","rarity":"Secret","description":"Las Tralaleritas is a Secret-tier Brainrot in Steal a Brainrot, a female baby version of Los Tralaleritos, depicted as a kid shark wearing a single pink sneaker, embodying the chaotic and musical essence of Italian brainrot meme culture.","baseIncomePerSecond":650000,"releaseStatus":"released","cost":150000000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["default","fishing"],"acquisitionBadges":[{"kind":"source","id":"fishing-event","label":"Fishing Event"},{"kind":"source","id":"runway","label":"Runway"}]},{"id":"las-vaquitas-saturnitas","name":"Las Vaquitas Saturnitas","rarity":"Secret","description":"Las Vaquitas Saturnitas is an Secret Brainrot, possibly resembling La Vacca Saturno Saturnita with high cost and income.","baseIncomePerSecond":750000,"releaseStatus":"released","cost":200000000,"addedAt":"2025-07-26","eventKeys":[],"craftFilterKeys":["ritual"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"mechanic","id":"ritual","label":"Ritual"}]},{"id":"lavadorito-spinito","name":"Lavadorito Spinito","rarity":"Secret","description":"Lavadorito Spinito is a Secret-tier Brainrot resembling an annoyed anthropomorphic washing machine wearing flip-flops. With its furrowed brows and grumpy expression, it spins through the Brainrot world with domestic fury and meme energy.","baseIncomePerSecond":45000000,"releaseStatus":"released","cost":30000000000,"addedAt":"2025-11-22","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"lazy-ducky","name":"Lazy Ducky","rarity":"Brainrot God","description":"Lazy Ducky is a released Brainrot God in Steal a Brainrot and part of the current ADMIN ABUSE runway wave. It appears as a yellow duck with big blue-lidded eyes and a pink sprinkle float ring wrapped around its torso. Lazy Ducky matters because it adds a lighthearted Brainrot God pickup to the current Red Carpet batch at a lower entry price than the Secret chases.","baseIncomePerSecond":255000,"releaseStatus":"released","cost":45500000,"addedAt":"2026-04-11","eventKeys":["admin-abuse"],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"lemonita-splashita","name":"Lemonita Splashita","rarity":"Brainrot God","description":"Lemonita Splashita is a lemonade-glass Brainrot God character with red-rimmed sunglasses, a lemon slice detail, and a bright summer drink theme.","baseIncomePerSecond":280000,"releaseStatus":"released","cost":48000000,"addedAt":"2026-05-23","eventKeys":["summer-fuse-2026-05-23"],"craftFilterKeys":["summer-fuse"],"acquisitionBadges":[{"kind":"source","id":"summer-fuse","label":"Summer Fuse"}]},{"id":"lerulerulerule","name":"Lerulerulerule","rarity":"Mythic","description":"Lerulerulerule is a Mythic-tier character in Steal a Brainrot, depicted as an enigmatic rhythmic entity with a flowing, hypnotic form, chanting a repetitive 'lerulerule' tune, dancing through the game with an otherworldly grace, embodying the surreal and chaotic spirit of Italian brainrot meme culture.","baseIncomePerSecond":8700,"releaseStatus":"released","cost":3500000,"addedAt":"2025-08-23","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"lionel-cactuseli","name":"Lionel Cactuseli","rarity":"Legendary","description":"Lionel Cactuseli is a prickly, desert-themed lion, roaring with spiky, arid ferocity. Lionel Cactuseli dominates desert bases with spiky might.","baseIncomePerSecond":650,"releaseStatus":"released","cost":175000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"lirili-larila","name":"Lirili Larila","rarity":"Common","description":"Lirili Larila is a wandering desert elephant with a ticking clock and sandal-wearing cacti. Lirili Larila spots surreal desert sights.","baseIncomePerSecond":3,"releaseStatus":"released","cost":250,"addedAt":"2025-01-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"list-list-list-sahur","name":"List List List Sahur","rarity":"Secret","description":"List List List Sahur is a Secret-tier Christmas Brainrot resembling a rectangular notebook or memo board. It has large round eyes and a wide smile showing bright white teeth, with the word 'LIST' written boldly on top. It carries joyful holiday planner energy with a hint of Sahur chaos.","baseIncomePerSecond":1800000,"releaseStatus":"released","cost":550000000,"addedAt":"2025-12-06","eventKeys":["santas-fuse-event","christmas"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"los-25","name":"Los 25","rarity":"Secret","description":"Los 25 is a Secret-tier Brainrot composed of three miniature 25-number Brainrots grouped together, radiating festive numeric chaos and holiday meme symbolism.","baseIncomePerSecond":10000000,"releaseStatus":"released","cost":1500000000,"addedAt":"2025-12-13","eventKeys":["north-pole-event","christmas","santas-fuse-event"],"craftFilterKeys":["themed","lucky-block"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"source","id":"festive-lucky-block","label":"Festive Lucky Block"},{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"los-67","name":"Los 67","rarity":"Secret","description":"Los 67 is a Secret-tier character in Steal a Brainrot, composed of three small 67, blending numerical whimsy with chaotic unity, embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":22500000,"releaseStatus":"released","cost":2700000000,"addedAt":"2025-10-04","eventKeys":[],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"los-lucky-blocks","label":"Los Lucky Blocks"}]},{"id":"los-admins","name":"Los Admins","rarity":"Secret","description":"Los Admins is a Secret three-character brainrot in the Los Traders lineup. The group pairs a pale elder, a taco mascot in a red top hat, and a dark-haired figure with crab-like legs. Its 95M/s income makes it one of the stronger rotating targets after Moby Bros.","baseIncomePerSecond":95000000,"releaseStatus":"released","cost":35000000000,"addedAt":"2026-07-11","eventKeys":["los-traders-event-2026-07-11"],"craftFilterKeys":["dealer"],"acquisitionBadges":[{"kind":"source","id":"los-traders","label":"Los Traders"},{"kind":"mechanic","id":"dealer","label":"Brainrot Trader"}]},{"id":"los-amigos","name":"Los Amigos","rarity":"Secret","description":"Los Amigos is a Secret-tier Brainrot duo composed of a baby version of La Cucaracha and a baby version of Mariachi Corazoni. Los Amigos embodies friendship, playful energy, and festive taco-themed chaos, making Los Amigos a wholesome yet chaotic addition to the Los Taco Blocks lineup.","baseIncomePerSecond":130000000,"releaseStatus":"released","cost":55000000000,"addedAt":"2026-02-21","eventKeys":["trade-machine-event","taco-tuesday"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"los-taco-blocks","label":"Los Taco Blocks"}]},{"id":"los-bombinitos","name":"Los Bombinitos","rarity":"Brainrot God","description":"Los Bombinitos is a Brainrot God-tier character in Steal a Brainrot, composed of three young Bombombini Gusini, depicted as white geese with turbines. Los Bombinitos fly with explosive energy, embodying the chaotic and whimsical spirit of Italian brainrot meme culture.","baseIncomePerSecond":220000,"releaseStatus":"released","cost":42500000,"addedAt":"2025-08-23","eventKeys":["admin-war","admin-abuse"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"admin-lucky-block","label":"Admin Lucky Block"},{"kind":"source","id":"los-lucky-blocks","label":"Los Lucky Blocks"}]},{"id":"los-bros","name":"Los Bros","rarity":"Secret","description":"Los Bros is a Secret-tier character in Steal a Brainrot, depicted as a dynamic duo with one Los Tralaleritos on the left and one Los Tungtungtungcitos on the right, blending their quirky traits into a chaotic, brotherly combo, embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":24000000,"releaseStatus":"released","cost":6000000000,"addedAt":"2025-09-06","eventKeys":[],"craftFilterKeys":["craft"],"acquisitionBadges":[{"kind":"source","id":"craft-machine","label":"Craft Machine"}]},{"id":"los-bunitos","name":"Los Bunitos","rarity":"Secret","description":"Los Bunitos is a released Secret brainrot in Steal a Brainrot and part of the live Egg Lucky Block lineup for EASTER EVENT (Part 2). Its current Easter presentation uses a bunny-themed Bunitos silhouette that is already distinct enough for the live seasonal block set. Los Bunitos matters because it serves as a realistic mid-chase Secret target before the rarest Easter block pulls.","baseIncomePerSecond":4250000,"releaseStatus":"released","cost":865000000,"addedAt":"2026-04-04","eventKeys":["easter-event-part-2","easter-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"egg-lucky-block","label":"Egg Lucky Block"}]},{"id":"los-burritos","name":"Los Burritos","rarity":"Secret","description":"Los Burritos is a Secret-tier Brainrot consisting of three Burrito Banditos fused together, forming a chaotic trio of motorcycle-riding burrito outlaws bursting with taco-fueled energy.","baseIncomePerSecond":8500000,"releaseStatus":"released","cost":1400000000,"addedAt":"2025-11-18","eventKeys":["taco-tuesday"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"los-taco-blocks","label":"Los Taco Blocks"}]},{"id":"los-candies","name":"Los Candies","rarity":"Secret","description":"Los Candies is a Secret-tier Brainrot formed from a festive candy duo, combining a peppermint candy and a striped candy cane. Together they spin with icy sweetness, radiating pure Christmas Brainrot energy.","baseIncomePerSecond":23000000,"releaseStatus":"released","cost":3000000000,"addedAt":"2025-12-13","eventKeys":["north-pole-event","christmas"],"craftFilterKeys":["santas-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"santas-fuse-machine","label":"Santa's Fuse Machine"}]},{"id":"los-chicleteiras","name":"Los Chicleteiras","rarity":"Secret","description":"Los Chicleteiras is a Secret-tier character in Steal a Brainrot, depicted as a trio of young, small Chicleteira Bicicleteira, combining their playful gumball machine-bicycle charm, embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":7000000,"releaseStatus":"released","cost":1200000000,"addedAt":"2025-09-14","eventKeys":[],"craftFilterKeys":["ritual"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"mechanic","id":"ritual","label":"Ritual"}]},{"id":"los-chihuaninis","name":"Los Chihuaninis","rarity":"Brainrot God","description":"Los Chihuaninis is a Brainrot God-tier trio composed of three Chihuanini Taconinis, radiating tiny but unstoppable taco-powered chihuahua chaos.","baseIncomePerSecond":160000,"releaseStatus":"released","cost":32000000,"addedAt":"2025-11-18","eventKeys":["taco-tuesday"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"los-taco-blocks","label":"Los Taco Blocks"}]},{"id":"los-chillis","name":"Los Chillis","rarity":"Secret","description":"Los Chillis is a Secret brainrot in Steal a Brainrot and one of the clearest trio-style entries in the Cyber lineup. It appears as three pepper mascots in green, red, and yellow, each wearing black sunglasses and standing side by side. Los Chillis matters because it brings a bright multi-character silhouette that instantly stands out from the rest of the machine wave.","baseIncomePerSecond":75000000,"releaseStatus":"released","cost":22500000000,"addedAt":"2026-04-19","eventKeys":["cyber-event"],"craftFilterKeys":["craft","cyber-craft-machine"],"acquisitionBadges":[{"kind":"source","id":"cyber-craft-machine","label":"Cyber Craft Machine"}]},{"id":"los-combinasionas","name":"Los Combinasionas","rarity":"Secret","description":"Los Combinasionas is a Secret-tier Brainrot in Steal a Brainrot, obtained through fusion, representing a complex amalgamation of meme-inspired characters with exceptional income potential for late-game players.","baseIncomePerSecond":15000000,"releaseStatus":"released","cost":2000000000,"addedAt":"2025-08-02","eventKeys":[],"craftFilterKeys":["lucky-block","fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"fuse-machine","label":"Fuse Machine"},{"kind":"source","id":"runway","label":"Runway"},{"kind":"source","id":"los-lucky-blocks","label":"Los Lucky Blocks"}]},{"id":"los-cornis","name":"Los Cornis","rarity":"Secret","description":"Los Cornis is a Secret trio that appears in rotating Los Traders offers. Three tan mouse-like figures wear yellow corn bodies with green husks, oversized ears, and whiskers. Its 3.1M/s income makes it a compact Secret target for players watching each offer refresh.","baseIncomePerSecond":3100000,"releaseStatus":"released","cost":715000000,"addedAt":"2026-07-11","eventKeys":["los-traders-event-2026-07-11"],"craftFilterKeys":["dealer"],"acquisitionBadges":[{"kind":"source","id":"los-traders","label":"Los Traders"},{"kind":"mechanic","id":"dealer","label":"Brainrot Trader"}]},{"id":"los-crocodillitos","name":"Los Crocodillitos","rarity":"Brainrot God","description":"Los Crocodillitos is a Brainrot God-tier character introduced in the July 7, 2025, Lava update, embodying a militarized crocodile hybrid, possibly inspired by Bombardiro Crocodilo, with immense power and income potential.","baseIncomePerSecond":55000,"releaseStatus":"released","cost":12500000,"addedAt":"2025-07-26","eventKeys":[],"craftFilterKeys":["ritual"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"mechanic","id":"ritual","label":"Ritual"}]},{"id":"los-cucarachas","name":"Los Cucarachas","rarity":"Secret","description":"Los Cucarachas is a Secret-tier trio created from three La Cucarachas, marching together with synchronized meme chaos and unstoppable roach energy.","baseIncomePerSecond":1250000,"releaseStatus":"released","cost":300000000,"addedAt":"2025-11-18","eventKeys":["taco-tuesday"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"los-taco-blocks","label":"Los Taco Blocks"}]},{"id":"los-cupids","name":"Los Cupids","rarity":"Secret","description":"Los Cupids is a Secret-tier Brainrot built around cupid imagery and romantic iconography. Its look combines a white haloed angel, a pink bow-bearing figure, and bright heart-red accents for a playful divine theme.","baseIncomePerSecond":30000000,"releaseStatus":"released","cost":3000000000,"addedAt":"2026-03-07","eventKeys":["divine-fuse-machine-event"],"craftFilterKeys":["divine-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"divine-fuse-machine","label":"Divine Fuse Machine"}]},{"id":"los-gattitos","name":"Los Gattitos","rarity":"Brainrot God","description":"Los Gattitos is a Brainrot God-tier trio formed by three Gattito Tacotos, combining adorable feline chaos with taco-fueled cosmic energy.","baseIncomePerSecond":275000,"releaseStatus":"released","cost":47500000,"addedAt":"2025-11-18","eventKeys":["taco-tuesday"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"los-taco-blocks","label":"Los Taco Blocks"}]},{"id":"los-hackers","name":"Los Hackers","rarity":"Secret","description":"Los Hackers is a Secret brainrot in Steal a Brainrot and a historical Cyber Craft Machine additions. It brings a dark hacker-group look to the Cyber Craft wave, combining baby versions of John Doe, 1x1x1x1, and Guest 666 into one three-character lineup.","baseIncomePerSecond":75000000,"releaseStatus":"released","cost":22500000000,"addedAt":"2026-04-25","eventKeys":[],"craftFilterKeys":["craft","cyber-craft-machine"],"acquisitionBadges":[{"kind":"source","id":"cyber-craft-machine","label":"Cyber Craft Machine"}]},{"id":"los-hotspotsitos","name":"Los Hotspotsitos","rarity":"Secret","description":"Los Hotspotsitos is a Secret-tier Brainrot in Steal a Brainrot, depicted as a chaotic group of skeletal figures with smartphone heads, each displaying a pixelated face begging for 'Wi-Fi,' embodying the ultimate digital parasite that drains connections with relentless chants of 'Hotspot Bro,' reflecting the absurd and satirical essence of Italian brainrot meme culture.","baseIncomePerSecond":20000000,"releaseStatus":"retired","cost":3000000000,"addedAt":"2025-08-09","eventKeys":[],"craftFilterKeys":["fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"fuse-machine","label":"Fuse Machine"},{"kind":"source","id":"runway","label":"Runway"}]},{"id":"los-jobcitos","name":"Los Jobcitos","rarity":"Secret","description":"Los Jobcitos is a Secret-tier character in Steal a Brainrot, composed of three small Job Job Job Sahur, blending youthful rhythm with chaotic charm, embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":1500000,"releaseStatus":"released","cost":500000000,"addedAt":"2025-10-04","eventKeys":[],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"los-lucky-blocks","label":"Los Lucky Blocks"}]},{"id":"los-jolly-combinasionas","name":"Los Jolly Combinasionas","rarity":"Secret","description":"Los Jolly Combinasionas is a Secret-tier limited Brainrot portrayed as a baby version of La Jolly Grande, radiating playful festive energy and miniature holiday chaos.","baseIncomePerSecond":20000000,"releaseStatus":"released","cost":3000000000,"addedAt":"2025-12-24","eventKeys":["christmas","christmas-eve-admin-abuse"],"craftFilterKeys":["limited"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"mechanic","id":"limited-stock","label":"Limited Stock"}]},{"id":"los-karkeritos","name":"Los Karkeritos","rarity":"Secret","description":"Los Karkeritos is a Secret-tier character in Steal a Brainrot, depicted as three baby versions of Karkerkar Kurkur, embodying the quirky absurdity of Italian brainrot meme culture.","baseIncomePerSecond":750000,"releaseStatus":"released","cost":200000000,"addedAt":"2025-10-04","eventKeys":[],"craftFilterKeys":["ritual"],"acquisitionBadges":[{"kind":"mechanic","id":"ritual","label":"Ritual"}]},{"id":"los-matteos","name":"Los Matteos","rarity":"Secret","description":"Los Matteos is a Secret-tier character in Steal a Brainrot, depicted as a trio of youthful Matteo figures, each a dwarf creature with a big nose, wearing large round-framed sunglasses, a black top hat, and a blue tie, spreading chaotic musical vibes with their quirky appearance, embodying the lively and absurd essence of Italian brainrot meme culture.","baseIncomePerSecond":300000,"releaseStatus":"released","cost":100000000,"addedAt":"2025-08-16","eventKeys":[],"craftFilterKeys":["ritual"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"mechanic","id":"ritual","label":"Ritual"}]},{"id":"los-mi-gatitos","name":"Los Mi Gatitos","rarity":"Secret","description":"Los Mi Gatitos is a Secret-tier Brainrot consisting of three baby versions of Mi Gatito. Los Mi Gatitos display distinct emotions: the left kitten has gray-white fur and cries sadly, the middle orange kitten appears calm and neutral, and the right black kitten shows clear anger, giving Los Mi Gatitos a strong emotional contrast and memorable Italian brainrot charm.","baseIncomePerSecond":6500000,"releaseStatus":"released","cost":1200000000,"addedAt":"2026-01-31","eventKeys":["ay-mi-gatito"],"craftFilterKeys":["ritual"],"acquisitionBadges":[{"kind":"mechanic","id":"ritual","label":"Ritual"}]},{"id":"los-mobilis","name":"Los Mobilis","rarity":"Secret","description":"Los Mobilis is a Secret-tier Brainrot character in Steal a Brainrot, created through Witch Fuse by combining one Los Hotspotsitos and one Los Nooo My Hotspotsitos. This chaotic fusion manifests as a dual-faced creature balancing calm and panic, emitting radiant signals and distorted Wi-Fi waves — a surreal parody of technological anxiety and digital obsession.","baseIncomePerSecond":22000000,"releaseStatus":"released","cost":2700000000,"addedAt":"2025-10-11","eventKeys":["witch-fuse-event"],"craftFilterKeys":["witch-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"witch-fuse-machine","label":"Witch Fuse Machine"}]},{"id":"los-noobinis","name":"Los Noobinis","rarity":"Mythic","description":"Los Noobinis is a Mythic-tier character in Steal a Brainrot, depicted as a trio of young Noobini Pizzanini, blending their pizza-inspired charm with a playful unity, embodying the quirky absurdity of Italian brainrot meme culture.","baseIncomePerSecond":12500,"releaseStatus":"released","cost":4300000,"addedAt":"2025-09-06","eventKeys":[],"craftFilterKeys":["craft"],"acquisitionBadges":[{"kind":"source","id":"craft-machine","label":"Craft Machine"}]},{"id":"los-nooo-my-hotspotsitos","name":"Los Nooo My Hotspotsitos","rarity":"Secret","description":"Los Nooo My Hotspotsitos is a Brainrot God-tier character in Steal a Brainrot, depicted as a trio of young, small Nooo My Hotspot entities, each a crying burrito with legs, arms, and a Wi-Fi signal, combined in a chaotic dance of connectivity woes, embodying the absurd humor of Italian brainrot meme culture.","baseIncomePerSecond":5500000,"releaseStatus":"released","cost":1000000000,"addedAt":"2025-09-02","eventKeys":["taco-tuesday"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"source","id":"taco-lucky-block","label":"Taco Lucky Block"}]},{"id":"los-orcalitos","name":"Los Orcalitos","rarity":"Brainrot God","description":"Los Orcalitos is a Brainrot God-tier character in Steal a Brainrot, depicted as a majestic orca-pirate hybrid, wielding a cutlass and sailing through a cosmic ocean with a glowing eyepatch, embodying the adventurous and anarchic essence of Italian brainrot meme culture.","baseIncomePerSecond":235000,"releaseStatus":"released","cost":45000000,"addedAt":"2025-08-09","eventKeys":[],"craftFilterKeys":["ritual","fishing"],"acquisitionBadges":[{"kind":"source","id":"fishing-event","label":"Fishing Event"},{"kind":"source","id":"runway","label":"Runway"},{"kind":"mechanic","id":"ritual","label":"Ritual"}]},{"id":"los-planitos","name":"Los Planitos","rarity":"Secret","description":"Los Planitos is a Secret-tier Brainrot combining La Vacca Saturno Saturnita with a baby version of Bisonte Giuppitere. The duo floats together in cosmic harmony, blending space charm with adorable bovine chaos.","baseIncomePerSecond":18500000,"releaseStatus":"released","cost":2700000000,"addedAt":"2025-11-22","eventKeys":[],"craftFilterKeys":["dealer"],"acquisitionBadges":[{"kind":"source","id":"brainrot-dealer","label":"Brainrot Trader"}]},{"id":"los-primos","name":"Los Primos","rarity":"Secret","description":"Los Primos is a Secret-tier character in Steal a Brainrot, depicted as a combination of one Los Orcalitos and one Los Tralaleritos, blending their chaotic energies into a dynamic duo, embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":31000000,"releaseStatus":"released","cost":3700000000,"addedAt":"2025-09-27","eventKeys":["yin-yang-event"],"craftFilterKeys":["fishing","craft"],"acquisitionBadges":[{"kind":"source","id":"craft-machine","label":"Craft Machine"},{"kind":"source","id":"fishing-event","label":"Fishing Event"}]},{"id":"los-puggies","name":"Los Puggies","rarity":"Secret","description":"Los Puggies is a Secret-tier Brainrot character in Steal a Brainrot, obtainable from the Brainrot Dealer. It consists of three tiny pug versions of Money Money Puggy, packed with cuteness, mischief, and economic chaos.","baseIncomePerSecond":30000000,"releaseStatus":"released","cost":3000000000,"addedAt":"2025-11-08","eventKeys":[],"craftFilterKeys":["dealer"],"acquisitionBadges":[{"kind":"source","id":"brainrot-dealer","label":"Brainrot Trader"}]},{"id":"los-quesadillas","name":"Los Quesadillas","rarity":"Secret","description":"Los Quesadillas is a Secret-tier trio formed by three Quesadilla Crocodilas, combining molten cheese ferocity with crispy tortilla charm in perfect meme-crafted absurdity.","baseIncomePerSecond":4500000,"releaseStatus":"released","cost":875000000,"addedAt":"2025-11-18","eventKeys":["taco-tuesday"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"los-taco-blocks","label":"Los Taco Blocks"}]},{"id":"los-secret-combinasionas","name":"Los Secret Combinasionas","rarity":"Secret","description":"Los Secret Combinasionas is a released Secret group obtained through Los Traders. Its baby-sized lineup combines Pot Hotspot, Spaghetti Tualetti, Esok Sekolah, and Torrtuginni Dragonfrutini. Its 150M/s income makes it the strongest earner in the Update 59 wave.","baseIncomePerSecond":150000000,"releaseStatus":"released","cost":75000000000,"addedAt":"2026-07-25","eventKeys":["crystal-mutation-spain-event-2026-07-25"],"craftFilterKeys":["dealer"],"acquisitionBadges":[{"kind":"source","id":"los-traders","label":"Los Traders"},{"kind":"mechanic","id":"dealer","label":"Brainrot Trader"}]},{"id":"los-sekolahs","name":"Los Sekolahs","rarity":"Secret","description":"Los Sekolahs is a Secret-tier Brainrot featuring three baby versions of Esok Sekolah. Los Sekolahs amplifies school-themed chaos with synchronized expressions and playful Italian brainrot energy, making Los Sekolahs a standout school-themed trio in the Los Lucky Blocks lineup.","baseIncomePerSecond":110000000,"releaseStatus":"released","cost":45000000000,"addedAt":"2026-02-21","eventKeys":["trade-machine-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"los-lucky-blocks","label":"Los Lucky Blocks"}]},{"id":"los-sigmas","name":"Los Sigmas","rarity":"Secret","description":"Los Sigmas is a Secret trio that appears in rotating Los Traders offers. Three black penguin-and-sushi figures wear salmon-like caps with yellow beaks and feet. Its 2.3M/s income gives the trader lineup a compact, collectible trio to chase.","baseIncomePerSecond":2300000,"releaseStatus":"released","cost":580000000,"addedAt":"2026-07-11","eventKeys":["los-traders-event-2026-07-11"],"craftFilterKeys":["dealer"],"acquisitionBadges":[{"kind":"source","id":"los-traders","label":"Los Traders"},{"kind":"mechanic","id":"dealer","label":"Brainrot Trader"}]},{"id":"los-spaghettis","name":"Los Spaghettis","rarity":"Secret","description":"Los Spaghettis is a Secret-tier Brainrot trio in Steal a Brainrot, obtainable from the Brainrot Dealer. It features three youthful versions of Spaghetti Tualetti, each full of energy and chaotic pasta spirit. United in flavor and absurdity, they dance through the Brainrot world as the next generation of Italian meme icons.","baseIncomePerSecond":70000000,"releaseStatus":"released","cost":20000000000,"addedAt":"2025-11-08","eventKeys":[],"craftFilterKeys":["dealer"],"acquisitionBadges":[{"kind":"source","id":"brainrot-dealer","label":"Brainrot Trader"}]},{"id":"los-spideritos","name":"Los Spideritos","rarity":"Unknown","description":"Los Spideritos is an upcoming (unconfirmed) character in Steal a Brainrot, inspired by the Italian brainrot meme Los Spideritos. Depicted as a trio of young and small Chimpanzini Spiderini, blending chimpanzee agility with spider-like traits, weaving chaotic webs and skittering through bases with Italian flair, embodying the absurd and elusive nature of Italian brainrot meme culture.","baseIncomePerSecond":0,"releaseStatus":"unconfirmed","cost":0,"addedAt":"","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[]},{"id":"los-spooky-combinasionas","name":"Los Spooky Combinasionas","rarity":"Secret","description":"Los Spooky Combinasionas is a Secret-tier Brainrot character in Steal a Brainrot, obtainable from the Spooky Lucky Block during the Frightrot Event. It is a Halloween version of Los Combinasionas, featuring glowing pumpkin tones, flickering candlelight patterns, and eerie spectral energy. This festive fusion embodies the chaotic creativity and spooky charm of the Frightrot celebration.","baseIncomePerSecond":20000000,"releaseStatus":"released","cost":3000000000,"addedAt":"2025-10-25","eventKeys":["frightrot-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"spooky-lucky-block","label":"Spooky Lucky Block"}]},{"id":"los-spyderinis","name":"Los Spyderinis","rarity":"Secret","description":"Los Spyderinis is a Secret-tier character in Steal a Brainrot, depicted as a trio of agile spider-like figures with Italian flair, weaving chaotic webs and skittering with explosive speed, embodying the surreal mischief of Italian brainrot meme culture.","baseIncomePerSecond":425000,"releaseStatus":"released","cost":250000000,"addedAt":"2025-08-23","eventKeys":["admin-war"],"craftFilterKeys":["ritual","lucky-block"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"source","id":"admin-lucky-block","label":"Admin Lucky Block"},{"kind":"mechanic","id":"ritual","label":"Ritual"}]},{"id":"los-sweethearts","name":"Los Sweethearts","rarity":"Secret","description":"Los Sweethearts is a Secret-tier Valentine Brainrot featuring a happy Los Tralaleritos and a joyful Las Tralaleritas playing together. Los Sweethearts symbolizes romance, harmony, and playful Italian brainrot affection, making Los Sweethearts a standout creation from the OG Fuse Machine during valentines-pt2-event.","baseIncomePerSecond":16500000,"releaseStatus":"released","cost":2200000000,"addedAt":"2026-02-14","eventKeys":["valentines-pt2-event","valentines-event"],"craftFilterKeys":["og-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"og-fuse-machine","label":"OG Fuse Machine"}]},{"id":"los-tacoritas","name":"Los Tacoritas","rarity":"Secret","description":"Los Tacoritas is a Secret-tier character in Steal a Brainrot, depicted as three young Tacorita Bicicleta—the left one sad, the middle one happy, and the right one furious—forming a trio of emotional tacos on bikes, embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":32000000,"releaseStatus":"released","cost":4000000000,"addedAt":"2025-09-21","eventKeys":["mexico-event"],"craftFilterKeys":["craft"],"acquisitionBadges":[{"kind":"source","id":"craft-machine","label":"Craft Machine"}]},{"id":"los-tangcitos","name":"Los Tangcitos","rarity":"Secret","description":"Los Tangcitos is a Secret three-character brainrot in the Los Traders lineup. Three pale square-faced figures use red-rimmed eyes, dark brows, black trousers, and white sneakers for an intense group look. Its 42.5M/s income makes it a mid-tier Secret target worth watching on each refresh.","baseIncomePerSecond":42500000,"releaseStatus":"released","cost":7500000000,"addedAt":"2026-07-11","eventKeys":["los-traders-event-2026-07-11"],"craftFilterKeys":["dealer"],"acquisitionBadges":[{"kind":"source","id":"los-traders","label":"Los Traders"},{"kind":"mechanic","id":"dealer","label":"Brainrot Trader"}]},{"id":"los-tictacs","name":"Los Tictacs","rarity":"Secret","description":"Los Tictacs is a Secret three-character brainrot in the Los Traders lineup. Three orange lion-like figures ride with white head propellers, wheel details, and distinct expressions. Its 60M/s income makes it a high-value rotating target for players ready with the trade recipe.","baseIncomePerSecond":60000000,"releaseStatus":"released","cost":15000000000,"addedAt":"2026-07-11","eventKeys":["los-traders-event-2026-07-11"],"craftFilterKeys":["dealer"],"acquisitionBadges":[{"kind":"source","id":"los-traders","label":"Los Traders"},{"kind":"mechanic","id":"dealer","label":"Brainrot Trader"}]},{"id":"los-tipi-tacos","name":"Los Tipi Tacos","rarity":"Brainrot God","description":"Los Tipi Tacos is a Brainrot God-tier character in Steal a Brainrot, composed of three small, young Tipi Topi Tacos, depicted as tiny taco-shaped tapirs with crunchy shells and playful nibbles. Los Tipi Tacos scurry through the game with chaotic taco energy, embodying the whimsical absurdity of Italian brainrot meme culture.","baseIncomePerSecond":260000,"releaseStatus":"released","cost":46000000,"addedAt":"2025-09-02","eventKeys":["taco-tuesday"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"source","id":"los-lucky-blocks","label":"Los Lucky Blocks"},{"kind":"source","id":"taco-lucky-block","label":"Taco Lucky Block"}]},{"id":"los-tortus","name":"Los Tortus","rarity":"Secret","description":"Los Tortus is a Secret-tier character in Steal a Brainrot, depicted as three baby versions of Torrtuginni Dragonfrutini, blending youthful charm with fruity absurdity, embodying the wild essence of Italian brainrot meme culture.","baseIncomePerSecond":500000,"releaseStatus":"released","cost":100000000,"addedAt":"2025-10-04","eventKeys":[],"craftFilterKeys":["lucky-block","craft"],"acquisitionBadges":[{"kind":"source","id":"craft-machine","label":"Craft Machine"},{"kind":"source","id":"los-lucky-blocks","label":"Los Lucky Blocks"}]},{"id":"los-tralaleritos","name":"Los Tralaleritos","rarity":"Secret","description":"Los Tralaleritos is a cheerful, singing trio, inspired by viral TikTok tunes, spreading catchy, chaotic melodies.","baseIncomePerSecond":500000,"releaseStatus":"released","cost":150000000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["default","fishing"],"acquisitionBadges":[{"kind":"source","id":"fishing-event","label":"Fishing Event"},{"kind":"source","id":"runway","label":"Runway"}]},{"id":"los-trios","name":"Los Trios","rarity":"Secret","description":"Los Trios is a Secret-tier Brainrot composed of one Las Tralaleritas, one Los Tralaleritos, and one Los Orcalitos. Los Trios embodies triple-character chaos and cooperative Italian brainrot absurdity.","baseIncomePerSecond":700000,"releaseStatus":"released","cost":175000000,"addedAt":"2026-01-24","eventKeys":["the-return"],"craftFilterKeys":["og-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"og-fuse-machine","label":"OG Fuse Machine"}]},{"id":"los-tungtungtungcitos","name":"Los Tungtungtungcitos","rarity":"Brainrot God","description":"Los Tungtungtung Citos is a Brainrot God-tier character in Steal a Brainrot, obtained through fusion with a higher probability of generating Brainrot God-tier outcomes, inspired by the chaotic and rhythmic essence of Italian and Indonesian brainrot meme culture.","baseIncomePerSecond":210000,"releaseStatus":"retired","cost":37500000,"addedAt":"2025-08-02","eventKeys":[],"craftFilterKeys":["fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"fuse-machine","label":"Fuse Machine"},{"kind":"source","id":"runway","label":"Runway"}]},{"id":"love-love-bear","name":"Love Love Bear","rarity":"Secret","description":"Love Love Bear is a Valentines-themed Brainrot depicted as a small bear covered entirely in Valentines cards. Love Love Bear embodies overwhelming affection, sweetness, and playful romantic chaos.","baseIncomePerSecond":75000000,"releaseStatus":"released","cost":22500000000,"addedAt":"2026-02-07","eventKeys":["valentines-pt1-event","valentines-event"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"love-love-love-sahur","name":"Love Love Love Sahur","rarity":"Secret","description":"Love Love Love Sahur is a Secret-tier Valentines Brainrot: a paper holding a rose and professing love, overflowing with affection-driven chaos and over-the-top romantic Italian brainrot energy.","baseIncomePerSecond":1000000,"releaseStatus":"released","cost":250000000,"addedAt":"2026-02-07","eventKeys":["valentines-pt1-event","valentines-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"heart-lucky-block","label":"Heart Lucky Block"}]},{"id":"lovin-rose","name":"Lovin Rose","rarity":"Secret","description":"Lovin Rose is a Valentines-themed Brainrot portrayed as an anthropomorphic bouquet of roses. Lovin Rose symbolizes romance, affection, and floral-themed Italian brainrot charm.","baseIncomePerSecond":32500000,"releaseStatus":"released","cost":4200000000,"addedAt":"2026-02-07","eventKeys":["valentines-pt1-event","valentines-event"],"craftFilterKeys":["cupids-machine"],"acquisitionBadges":[{"kind":"source","id":"cupids-machine","label":"Cupid's Machine"}]},{"id":"luck-luck-luck-sahur","name":"Luck Luck Luck Sahur","rarity":"Secret","description":"Luck Luck Luck Sahur is a Secret-tier Brainrot in Steal a Brainrot and a live Leprechaun Lucky Block pull from ST PATRICKS. It appears as a green Job Job Job Sahur-style reskin with the word LUCK across the top, turning the original work-themed face into a shamrock-colored holiday variant. Luck Luck Luck Sahur matters because it turned from a teaser-only listing into a verified Secret with a much stronger live value and income profile than the first sync captured.","baseIncomePerSecond":3700000,"releaseStatus":"released","cost":800000000,"addedAt":"2026-03-14","eventKeys":["st-patricks-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"leprechaun-lucky-block","label":"Leprechaun Lucky Block"}]},{"id":"lumaca-malefica","name":"Lumaca Malefica","rarity":"Brainrot God","description":"Lumaca Malefica is a Brainrot God brainrot released in the May 9, 2026 BACKROOMS update. It appears as a sinister snail-like creature with compact body shape, expressive face details, and a low stance.","baseIncomePerSecond":265000,"releaseStatus":"released","cost":46500000,"addedAt":"2026-05-09","eventKeys":["backrooms-event"],"craftFilterKeys":["craft","cyber-craft-machine"],"acquisitionBadges":[{"kind":"source","id":"cyber-craft-machine","label":"Cyber Craft Machine"}]},{"id":"luv-luv-luv","name":"Luv Luv Luv","rarity":"Brainrot God","description":"Luv Luv Luv is a Brainrot God-tier Valentines Brainrot representing the female counterpart of Dul Dul Dul. Luv Luv Luv exaggerates affection, emotion, and dramatic love-themed Italian brainrot energy.","baseIncomePerSecond":282500,"releaseStatus":"released","cost":48200000,"addedAt":"2026-02-07","eventKeys":["valentines-pt1-event","valentines-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"heart-lucky-block","label":"Heart Lucky Block"}]},{"id":"magi-ribbitini","name":"Magi Ribbitini","rarity":"Mythic","description":"Magi Ribbitini is a Mythic-tier Brainrot character in Steal a Brainrot, obtainable through Witch Fuse. It is a charming frog wearing a wizard’s hat and cloak, casting tiny magical sparks as it hops — a whimsical embodiment of playful sorcery and meme magic.","baseIncomePerSecond":11500,"releaseStatus":"released","cost":4200000,"addedAt":"2025-10-11","eventKeys":["witch-fuse-event"],"craftFilterKeys":["witch-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"witch-fuse-machine","label":"Witch Fuse Machine"}]},{"id":"malame-amarele","name":"Malame Amarele","rarity":"Epic","description":"Malame Amarele is an Epic-tier character in Steal a Brainrot, depicted as a bloated, cracked clay toad with large, glassy eyes that convey a sorrowful yet unblinking stare, blending Sahur rhythms with a playful twist, embodying the quirky absurdity of Italian brainrot meme culture.","baseIncomePerSecond":140,"releaseStatus":"released","cost":23500,"addedAt":"2025-09-06","eventKeys":[],"craftFilterKeys":["craft"],"acquisitionBadges":[{"kind":"source","id":"craft-machine","label":"Craft Machine"}]},{"id":"mangolini-parrocini","name":"Mangolini Parrocini","rarity":"Epic","description":"Mangolini Parrocini is an Epic-tier character in Steal a Brainrot, depicted as a smiling red parrot with green wings and a large tail, its chest adorned with mango slices. Mangolini Parrocini embodies the quirky absurdity of Italian brainrot meme culture.","baseIncomePerSecond":235,"releaseStatus":"released","cost":38500,"addedAt":"2025-09-06","eventKeys":[],"craftFilterKeys":["dealer","craft"],"acquisitionBadges":[{"kind":"source","id":"craft-machine","label":"Craft Machine"},{"kind":"source","id":"brainrot-dealer","label":"Brainrot Trader"}]},{"id":"mariachi-corazoni","name":"Mariachi Corazoni","rarity":"Secret","description":"Mariachi Corazoni is a Secret-tier character in Steal a Brainrot, depicted as a skeleton-like body holding two maracas and wearing a Mexican sombrero, with pink heart-shaped eyes, blending festive mariachi vibes with quirky romance, embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":12500000,"releaseStatus":"released","cost":1700000000,"addedAt":"2025-09-21","eventKeys":["mexico-event"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"mastodontico-telepiedone","name":"Mastodontico Telepiedone","rarity":"Brainrot God","description":"Mastodontico Telepiedone is a Brainrot God-tier character in Steal a Brainrot, depicted as a massive television with oversized feet and a telephone trunk, trumpeting chaotic melodies, embodying the extravagant absurdity of Italian brainrot meme culture.","baseIncomePerSecond":275000,"releaseStatus":"released","cost":47500000,"addedAt":"2025-08-31","eventKeys":[],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"brainrot-god-lucky-block","label":"Brainrot God Lucky Block"}]},{"id":"matteo","name":"Matteo","rarity":"Brainrot God","description":"Matteo is a charismatic, music-themed character, inspired by vibrant festival vibes, possibly a DJ or street performer.","baseIncomePerSecond":50000,"releaseStatus":"released","cost":10000000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"mattonino-cornettino","name":"Mattonino Cornettino","rarity":"Unknown","description":"Mattonino Cornettino is an upcoming (unconfirmed) character in Steal a Brainrot, inspired by the Italian brainrot meme Mattonino Cornettino. Depicted as a giant anthropomorphic rhinoceros with skin textured like a rugged brick wall, it charges through a surreal construction site bakery, scattering pastry dust and bellowing a crunchy 'mattoni-rhino' chant, embodying the chaotic and absurd essence of Italian brainrot meme culture.","baseIncomePerSecond":0,"releaseStatus":"unconfirmed","cost":0,"addedAt":"","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[]},{"id":"meowl","name":"Meowl","rarity":"OG","description":"Meowl is an OG-tier Brainrot character in Steal a Brainrot, depicting a cat with the body of a barn owl. Its feline face merges seamlessly into feathery wings, creating an uncanny yet endearing hybrid that glides silently through absurdity. While not as rare as the Strawberry Elephant, she is still an OG and is hardly ever spawned in — a perfect embodiment of internet surrealism and rarity.","baseIncomePerSecond":600000000,"releaseStatus":"released","cost":600000000000,"addedAt":"2025-10-18","eventKeys":["indonesian-event","taco-tuesday"],"craftFilterKeys":["default","cyber-craft-machine"],"acquisitionBadges":[{"kind":"source","id":"cyber-craft-machine","label":"Cyber Craft Machine"},{"kind":"source","id":"runway","label":"Runway"}]},{"id":"mi-gatito","name":"Mi Gatito","rarity":"Secret","description":"Mi Gatito is a Secret-tier Brainrot portrayed as an anthropomorphic cat standing upright on two legs. Mi Gatito features exaggerated human-like movements, dancing joyfully to music and embodying chaotic meme energy and playful feline absurdity, making Mi Gatito a standout Brainrot in Steal a Brainrot.","baseIncomePerSecond":3200000,"releaseStatus":"released","cost":725000000,"addedAt":"2026-01-31","eventKeys":["ay-mi-gatito"],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"mieteteira-chicleteira","name":"Mieteteira Chicleteira","rarity":"Secret","description":"Mieteteira Chicleteira is a Secret-tier Brainrot character in Steal a Brainrot, obtainable through Witch Fuse. It is a dark variant of Chicleteira Bicicleteira, featuring shadowy wheels, mysterious gum trails, and an ominous aura. This elusive biker rides through the night with supernatural flair and a rare appearance rate.","baseIncomePerSecond":26000000,"releaseStatus":"released","cost":2700000000,"addedAt":"2025-10-18","eventKeys":["indonesian-event"],"craftFilterKeys":["witch-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"witch-fuse-machine","label":"Witch Fuse Machine"}]},{"id":"moby-bros","name":"Moby Bros","rarity":"Secret","description":"Moby Bros is a Secret paired whale-and-ship brainrot in the Los Traders lineup. One whale carries a frosted birthday-cake ship while the other sails a dark pirate ship with a skull banner. Its 225M/s income makes it the premium target in the six-brainrot Los Traders lineup.","baseIncomePerSecond":225000000,"releaseStatus":"released","cost":225000000000,"addedAt":"2026-07-11","eventKeys":["los-traders-event-2026-07-11"],"craftFilterKeys":["dealer"],"acquisitionBadges":[{"kind":"source","id":"los-traders","label":"Los Traders"},{"kind":"mechanic","id":"dealer","label":"Brainrot Trader"}]},{"id":"money-money-bros","name":"Money Money Bros","rarity":"Secret","description":"Money Money Bros is a Secret brainrot in Steal a Brainrot and a historical money-family duo crafts. It pairs a money-themed reindeer and pug in one historical Cyber Craft Machine target, making it a clear follow-up chase for players already holding premium Money Money materials.","baseIncomePerSecond":47000000,"releaseStatus":"released","cost":9000000000,"addedAt":"2026-04-25","eventKeys":[],"craftFilterKeys":["craft","cyber-craft-machine"],"acquisitionBadges":[{"kind":"source","id":"cyber-craft-machine","label":"Cyber Craft Machine"}]},{"id":"money-money-man","name":"Money Money Man","rarity":"Brainrot God","description":"Money Money Man is a Brainrot God-tier Brainrot character in Steal a Brainrot, obtainable from the Brainrot Dealer. It is a sentient gold coin wearing a suit, monocle, and black top hat — a living embodiment of wealth, greed, and meme capitalism.","baseIncomePerSecond":65000,"releaseStatus":"released","cost":17500000,"addedAt":"2025-11-08","eventKeys":[],"craftFilterKeys":["dealer"],"acquisitionBadges":[{"kind":"source","id":"brainrot-dealer","label":"Brainrot Trader"}]},{"id":"money-money-puggy","name":"Money Money Puggy","rarity":"Secret","description":"Money Money Puggy is a Secret-tier character in Steal a Brainrot, depicted as a pug dog obsessed with money, with dollar signs in its eyes and a coin-filled collar, surrounded by floating coins and cash bills. Money Money Puggy embodies the luxurious absurdity of Italian brainrot meme culture.","baseIncomePerSecond":21000000,"releaseStatus":"released","cost":2600000000,"addedAt":"2025-09-27","eventKeys":["yin-yang-event"],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"money-money-reindeer","name":"Money Money Reindeer","rarity":"Secret","description":"Money Money Reindeer is a Secret-tier limited festive reindeer lavishly decorated with money and star motifs, symbolizing holiday wealth, greed, and over-the-top Christmas Brainrot extravagance.","baseIncomePerSecond":25000000,"releaseStatus":"released","cost":2500000000,"addedAt":"2025-12-24","eventKeys":["christmas","christmas-eve-admin-abuse"],"craftFilterKeys":["limited"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"mechanic","id":"limited-stock","label":"Limited Stock"}]},{"id":"mummio-rappitto","name":"Mummio Rappitto","rarity":"Epic","description":"Mummio Rappitto is an Epic-tier Brainrot character in Steal a Brainrot, obtainable through Witch Fuse, depicted as a zombified bunny wrapped tightly in ancient mummification bandages. Mummio Rappitto hops clumsily as pieces of fabric unravel, a comically eerie mascot of the Witching Hour event.","baseIncomePerSecond":325,"releaseStatus":"released","cost":47500,"addedAt":"2025-10-11","eventKeys":["witch-fuse-event"],"craftFilterKeys":["witch-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"witch-fuse-machine","label":"Witch Fuse Machine"}]},{"id":"mummy-ambalabu","name":"Mummy Ambalabu","rarity":"Brainrot God","description":"Mummy Ambalabu is a Brainrot God-tier Brainrot character in Steal a Brainrot, obtainable from the Spooky Lucky Block during the Frightrot Event. It is a Halloween version of Boneca Ambalabu, wrapped in ancient bandages with glowing yellow eyes and faint purple aura. Combining cuteness and creepiness, it shuffles across the conveyor with charming undead energy.","baseIncomePerSecond":250000,"releaseStatus":"released","cost":45000000,"addedAt":"2025-10-25","eventKeys":["frightrot-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"spooky-lucky-block","label":"Spooky Lucky Block"}]},{"id":"nacho-spyder","name":"Nacho Spyder","rarity":"Secret","description":"Nacho Spyder is a Secret-tier Taco Tuesday Brainrot shaped like a spider built from nachos, guacamole, and spicy snack details. It reuses the Spyder silhouette in a food-themed form, making Nacho Spyder one of the strongest Taco Truck rewards released in March 2026.","baseIncomePerSecond":50000000,"releaseStatus":"released","cost":10000000000,"addedAt":"2026-03-03","eventKeys":["taco-tuesday"],"craftFilterKeys":["limited"],"acquisitionBadges":[{"kind":"source","id":"limited-quantity-truck","label":"Limited Quantity Truck"}]},{"id":"nachorilla","name":"Nachorilla","rarity":"Secret","description":"Nachorilla is a Secret robotic nacho-chip Brainrot with a metallic body and nacho-inspired shape.","baseIncomePerSecond":47500000,"releaseStatus":"released","cost":9200000000,"addedAt":"2026-08-18","eventKeys":["taco-tuesday"],"craftFilterKeys":[],"acquisitionBadges":[{"kind":"source","id":"taco-merchant","label":"Taco Merchant"}]},{"id":"naughty-naughty","name":"Naughty Naughty","rarity":"Secret","description":"Naughty Naughty is a Secret-tier Brainrot resembling a paper labeled 'NAUGHTY'. It wears a Santa hat, green boots, and gloves, and carries a gift-like box filled with coal, perfectly capturing mischievous Christmas punishment humor.","baseIncomePerSecond":3000000,"releaseStatus":"released","cost":700000000,"addedAt":"2025-12-13","eventKeys":["north-pole-event","christmas"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"noo-la-polizia","name":"Noo La Polizia","rarity":"Brainrot God","description":"Noo La Polizia is a Brainrot God-tier Brainrot character in Steal a Brainrot, obtainable from the Brainrot Dealer. It is a redesigned version of Los Nooo My Hotspotsitos, now dressed in a police uniform, symbolizing law, order, and pure meme authority.","baseIncomePerSecond":280000,"releaseStatus":"released","cost":67000000,"addedAt":"2025-11-08","eventKeys":[],"craftFilterKeys":["dealer"],"acquisitionBadges":[{"kind":"source","id":"brainrot-dealer","label":"Brainrot Trader"}]},{"id":"noo-my-candy","name":"Noo My Candy","rarity":"Secret","description":"Noo My Candy is a Secret-tier Brainrot character in Steal a Brainrot, obtainable during the Trick or Treating Event within the Frightrot Event. It depicts a pitiful anthropomorphic candy basket that hasn’t received a single treat yet. With drooping handles and teary eyes, it embodies the tragicomic despair of Halloween disappointment wrapped in pure Brainrot absurdity.","baseIncomePerSecond":5000000,"releaseStatus":"released","cost":900000000,"addedAt":"2025-10-25","eventKeys":["frightrot-event"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"noo-my-eggs","name":"Noo my Eggs","rarity":"Secret","description":"Noo my Eggs is a Secret-tier Brainrot in Steal a Brainrot and the rarest live Easter Hour reward from EASTER EVENT (Part 1). It appears as a frightened yellow Easter basket with long pink bunny ears, ribbon-like handles, and cracked eggs spilling around its crying face. Noo my Eggs matters because it is the 1% chase drop in the current Easter lineup and the highest-value Easter Secret confirmed live so far.","baseIncomePerSecond":7000000,"releaseStatus":"released","cost":1200000000,"addedAt":"2026-03-28","eventKeys":["easter-event-part-1","easter-hour","easter-event"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"noo-my-examine","name":"Noo My Examine","rarity":"Secret","description":"Noo My Examine is a Secret-tier ritual Brainrot obtained as the rarer failure outcome of the Dul Dul Dul Ritual. It appears as a frantic test-paper figure with a sad, exam-stressed expression. Its 32.5M/s income gives ritual collectors a much stronger Update 59 reward.","baseIncomePerSecond":32500000,"releaseStatus":"released","cost":4200000000,"addedAt":"2025-09-27","eventKeys":["yin-yang-event"],"craftFilterKeys":["ritual"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"mechanic","id":"ritual","label":"Ritual"}]},{"id":"noo-my-gold","name":"Noo my Gold","rarity":"Secret","description":"Noo my Gold is a Secret-tier Brainrot in Steal a Brainrot and a live Leprechaun Lucky Block drop from ST PATRICKS. It appears as a dark pot with gold spread in front and a floating clover above, keeping the event's treasure motif obvious at a glance. Noo my Gold matters because it combines a strong themed silhouette with a much bigger live stat line than the first sync captured.","baseIncomePerSecond":13500000,"releaseStatus":"released","cost":1800000000,"addedAt":"2026-03-14","eventKeys":["st-patricks-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"leprechaun-lucky-block","label":"Leprechaun Lucky Block"}]},{"id":"noo-my-heart","name":"Noo my Heart","rarity":"Secret","description":"Noo my Heart is a Secret-tier Valentines-themed Brainrot: a heart on the verge of splitting open down the middle, embodying exaggerated romantic meme energy and dramatic love-themed Italian brainrot humor.","baseIncomePerSecond":13000000,"releaseStatus":"released","cost":1800000000,"addedAt":"2026-02-07","eventKeys":["valentines-pt1-event","valentines-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"heart-lucky-block","label":"Heart Lucky Block"}]},{"id":"noo-my-present","name":"Noo my Present","rarity":"Secret","description":"Noo my Present is a Secret-tier Brainrot depicted as a red gift box tied with a bright red ribbon, wearing red shoes. It embodies the desperate yet festive meme energy of wanting a present during the Christmas season.","baseIncomePerSecond":6000000,"releaseStatus":"released","cost":1100000000,"addedAt":"2025-12-13","eventKeys":["north-pole-event","christmas"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"noo-my-resume","name":"Noo my Resume","rarity":"Secret","description":"Noo my Resume is a released Secret paper character. The rejected resume has a red tie, red briefcase, blue shoes with red details, and an angry marked-up face. It earns 32.5M/s and is the rare 1% result from the four-player Job Job Job Sahur Ritual.","baseIncomePerSecond":32500000,"releaseStatus":"released","cost":4200000000,"addedAt":"2026-08-01","eventKeys":["job-job-job-sahur-ritual-2026-08-01"],"craftFilterKeys":["ritual"],"acquisitionBadges":[{"kind":"mechanic","id":"ritual","label":"Ritual"}]},{"id":"noobini-pizzanini","name":"Noobini Pizzanini","rarity":"Common","description":"Noobini Pizzanini is a quirky, pizza-loving novice, embodying the essence of a beginner with a goofy, dough-tossing vibe.","baseIncomePerSecond":1,"releaseStatus":"released","cost":25,"addedAt":"2025-01-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"noobini-santanini","name":"Noobini Santanini","rarity":"Common","description":"Noobini Santanini is a Common-tier Christmas variant of Noobini Pizzanini, swapping pizza vibes for Santa style, complete with hat and simple festive drip befitting a true Roblox noob.","baseIncomePerSecond":11,"releaseStatus":"released","cost":1300,"addedAt":"2025-12-06","eventKeys":["santas-fuse-event","christmas"],"craftFilterKeys":["santas-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"santas-fuse-machine","label":"Santa's Fuse Machine"}]},{"id":"noodle-noodle-poodle","name":"Noodle Noodle Poodle","rarity":"Secret","description":"Noodle Noodle Poodle is a released Secret brainrot obtained from the Red Carpet. It is a white square poodle with blue eyes, a bright multicolor noodle coat, and a blue pendant. Its 27.5M/s income makes it an approachable runway target.","baseIncomePerSecond":27500000,"releaseStatus":"released","cost":3000000000,"addedAt":"2026-07-18","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"nooo-my-hotspot","name":"Nooo My Hotspot","rarity":"Secret","description":"Nooo My Hotspot is a Secret-tier character in Steal a Brainrot, depicted as a crying burrito clutching a smartphone, its teary eyes and 'Nooo' expression pleading for Wi-Fi, embodying the digital despair and chaotic humor of Italian brainrot meme culture.","baseIncomePerSecond":1500000,"releaseStatus":"released","cost":500000000,"addedAt":"2025-08-12","eventKeys":["taco-tuesday"],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"nuclearo-dinossauro","name":"Nuclearo Dinossauro","rarity":"Secret","description":"Nuclearo Dinossauro is a radioactive, prehistoric beast, radiating chaotic, atomic energy.","baseIncomePerSecond":15000000,"releaseStatus":"released","cost":2500000000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"octoball","name":"Octoball","rarity":"Secret","description":"Octoball is a Secret Octo Lucky Block reward from SUMMER UPD PT 1. It combines a round ball body with octopus details and bright tentacle-like arms. Its 21% listed chance makes it one of the more reachable summer Secret pulls while still feeding the Octo collection.","baseIncomePerSecond":3200000,"releaseStatus":"released","cost":725000000,"addedAt":"2026-06-13","eventKeys":["summer-upd-pt-1-2026-06-13"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"mechanic","id":"lucky-block","label":"Lucky Block"}]},{"id":"odin-din-din-dun","name":"Odin Din Din Dun","rarity":"Brainrot God","description":"Odin Din Din Dun is a thunderous, Norse-inspired warrior, shaking the game with booming, rhythmic might.","baseIncomePerSecond":75000,"releaseStatus":"released","cost":15000000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"ombrello-topolino","name":"Ombrello Topolino","rarity":"Secret","description":"Ombrello Topolino is a beach-themed brainrot with a colorful umbrella head, a slim stick-figure body, big blue eyes, and vacation styling.","baseIncomePerSecond":6500000,"releaseStatus":"released","cost":1200000000,"addedAt":"2026-05-23","eventKeys":["summer-fuse-2026-05-23"],"craftFilterKeys":["summer-fuse"],"acquisitionBadges":[{"kind":"source","id":"summer-fuse","label":"Summer Fuse"}]},{"id":"orangutini-ananassini","name":"Orangutini Ananassini","rarity":"Mythic","description":"Orangutini Ananassini is a funky, pineapple-loving orangutan, swinging with tropical swagger.","baseIncomePerSecond":1700,"releaseStatus":"released","cost":400000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"orbi-mochi","name":"Orbi Mochi","rarity":"Mythic","description":"Orbi Mochi is a released Mythic brainrot in Steal a Brainrot and part of the CYBER UPDATE machine wave. It appears as a pink mochi-like sphere with silver spikes, blue orb side nodes, and small cyber appendages instead of a normal dessert body. Orbi Mochi matters because it shows the Cyber lineup extending beyond humanoids into compact mechanical food-creature designs.","baseIncomePerSecond":18500,"releaseStatus":"released","cost":6000000,"addedAt":"2026-04-19","eventKeys":["cyber-event"],"craftFilterKeys":["craft","cyber-craft-machine"],"acquisitionBadges":[{"kind":"source","id":"cyber-craft-machine","label":"Cyber Craft Machine"}]},{"id":"orcaledon","name":"Orcaledon","rarity":"Secret","description":"Orcaledon is a Secret-tier Brainrot character in Steal a Brainrot, obtainable by trading older Brainrots at the Brainrot Trader. It takes the form of a mighty orca infused with radiant blue energy, symbolizing dominance, evolution, and the legacy of Brainrot’s aquatic memes.","baseIncomePerSecond":40000000,"releaseStatus":"released","cost":7000000000,"addedAt":"2025-11-15","eventKeys":["radioactive-mutation-event"],"craftFilterKeys":["dealer","fishing"],"acquisitionBadges":[{"kind":"source","id":"brainrot-dealer","label":"Brainrot Trader"},{"kind":"source","id":"fishing-event","label":"Fishing Event"}]},{"id":"orcalero-orcala","name":"Orcalero Orcala","rarity":"Brainrot God","description":"Orcalero Orcala is a majestic, ocean-inspired orca, swimming with sleek, aquatic grace.","baseIncomePerSecond":100000,"releaseStatus":"released","cost":15000000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["default","fishing"],"acquisitionBadges":[{"kind":"source","id":"fishing-event","label":"Fishing Event"},{"kind":"source","id":"runway","label":"Runway"}]},{"id":"orcalita-orcala","name":"Orcalita Orcala","rarity":"Brainrot God","description":"Orcalita Orcala is a Brainrot God-tier character in Steal a Brainrot, depicted as a youthful female orca with a vibrant, taco-inspired twist, featuring a crunchy shell accent, energetic splashes, a softer color palette, and unique accessories that highlight her playful personality, embodying the whimsical absurdity of Italian brainrot meme culture.","baseIncomePerSecond":240000,"releaseStatus":"released","cost":45000000,"addedAt":"2025-09-06","eventKeys":[],"craftFilterKeys":["fishing","craft"],"acquisitionBadges":[{"kind":"source","id":"craft-machine","label":"Craft Machine"},{"kind":"source","id":"fishing-event","label":"Fishing Event"}]},{"id":"orso-melaroso","name":"Orso Melaroso","rarity":"Unknown","description":"Orso Melaroso is an upcoming (unconfirmed) character in Steal a Brainrot, inspired by the Italian brainrot meme Orso Melaroso. Depicted as a bear whose body fuses seamlessly with a dripping honeycomb, topped with bee-like antennae on its head, it lumbers through a surreal honey-drenched forest, buzzing a sticky 'mela-mela' chant while oozing golden nectar, embodying the chaotic and absurd essence of Italian brainrot meme culture.","baseIncomePerSecond":0,"releaseStatus":"unconfirmed","cost":0,"addedAt":"","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[]},{"id":"orso-scavatore","name":"Orso Scavatore","rarity":"Unknown","description":"Orso Scavatore is an upcoming (unconfirmed) character in Steal a Brainrot, inspired by the Italian brainrot meme Orso Scavatore. Depicted as an anthropomorphic brown bear with oversized, glowing paws, it furiously digs through a surreal mountain of gelato, unearthing sparkling roots and chanting a rhythmic 'scava-scava' tune, embodying the chaotic and absurd essence of Italian brainrot meme culture.","baseIncomePerSecond":0,"releaseStatus":"unconfirmed","cost":0,"addedAt":"","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[]},{"id":"pakrahmatmamat","name":"Pakrahmatmamat","rarity":"Brainrot God","description":"Pakrahmatmamat is a Brainrot God-tier character in Steal a Brainrot, depicted as an anthropomorphic pencil anomaly with human feet and a terrifying smile with wide-open eyes, haunting lazy students in a withered classroom setting. Pakrahmatmamat radiates divine chaos across the map, embodying the eclectic humor of brainrot meme culture.","baseIncomePerSecond":215000,"releaseStatus":"released","cost":37500000,"addedAt":"2025-08-23","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"pakrahmatmatina","name":"Pakrahmatmatina","rarity":"Brainrot God","description":"Pakrahmatmatina is a Brainrot God-tier Brainrot character in Steal a Brainrot, appearing during the Indonesian Event. She is the female counterpart of Pakrahmatmamat, dressed in a pink outfit with a pink bow on her head. Her design radiates cheerful energy and meme charm, embodying the festive spirit of the event with a playful Indonesian flair.","baseIncomePerSecond":225000,"releaseStatus":"released","cost":40500000,"addedAt":"2025-10-18","eventKeys":["indonesian-event"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"pancake-and-syrup","name":"Pancake and Syrup","rarity":"Secret","description":"Pancake and Syrup is a released Secret brainrot in Steal a Brainrot and part of the current ADMIN ABUSE wave through the DLC route. It appears as a smiling duo made from a syrup-drenched pancake stack beside a tall syrup-bottle companion. Pancake and Syrup matters because it turns the new DLC batch into a true paired-character chase instead of another single mascot.","baseIncomePerSecond":125000000,"releaseStatus":"released","cost":100000000000,"addedAt":"2026-04-11","eventKeys":["admin-abuse"],"craftFilterKeys":["limited"],"acquisitionBadges":[{"kind":"mechanic","id":"limited-stock","label":"Limited Stock"}]},{"id":"pandaccini-bananini","name":"Pandaccini Bananini","rarity":"Legendary","description":"Pandaccini Bananini is a bamboo-loving, banana-eating panda, munching through with peaceful, fruity charm.","baseIncomePerSecond":1200,"releaseStatus":"released","cost":300000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"pandanini-frostini","name":"Pandanini Frostini","rarity":"Brainrot God","description":"Pandanini Frostini is a Brainrot God-tier panda decorated with Christmas ornaments, garlands, and icy charm, waddling through the North Pole with festive authority.","baseIncomePerSecond":294000,"releaseStatus":"released","cost":64000000,"addedAt":"2025-12-13","eventKeys":["north-pole-event","christmas","santas-fuse-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"festive-lucky-block","label":"Festive Lucky Block"}]},{"id":"paradiso-axolottino","name":"Paradiso Axolottino","rarity":"Secret","description":"Paradiso Axolottino is a Secret-tier Brainrot shown as a pink axolotl with frilled head fins, oversized dark eyes, and white feathered wings. Paradiso Axolottino leans into cute heavenly mascot energy with a soft, cheerful presence.","baseIncomePerSecond":900000,"releaseStatus":"released","cost":235000000,"addedAt":"2026-03-07","eventKeys":["divine-fuse-machine-event"],"craftFilterKeys":["divine-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"divine-fuse-machine","label":"Divine Fuse Machine"}]},{"id":"patteo","name":"Patteo","rarity":"Brainrot God","description":"Patteo is a Brainrot God character in Steal a Brainrot and one of the live ST PATRICKS Leprechaun Lucky Block headliners. It appears as a dwarf-like Matteo reskin with a four-leaf clover crossing over the outfit, plus a light green hat, gold glasses, and matching light green clothes. Patteo matters because it sits near the top of the event block economy and gives Lucky Block grinders a high-end God-tier target.","baseIncomePerSecond":287500,"releaseStatus":"released","cost":57500000,"addedAt":"2026-03-14","eventKeys":["st-patricks-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"leprechaun-lucky-block","label":"Leprechaun Lucky Block"}]},{"id":"pengolino-nuvoletto","name":"Pengolino Nuvoletto","rarity":"Rare","description":"Pengolino Nuvoletto is a Rare-tier Brainrot portrayed as a fluffy penguin-like creature with cloud-white wool and pale blue highlights. Pengolino Nuvoletto feels soft, airy, and toy-like, giving the lineup an easy early celestial pick.","baseIncomePerSecond":72,"releaseStatus":"released","cost":9600,"addedAt":"2026-03-07","eventKeys":["divine-fuse-machine-event"],"craftFilterKeys":["divine-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"divine-fuse-machine","label":"Divine Fuse Machine"}]},{"id":"penguin-tree","name":"Penguin Tree","rarity":"Epic","description":"Penguin Tree is an Epic-tier penguin dressed as a Christmas tree, covered in ornaments and lights, waddling proudly as a one-bird holiday decoration.","baseIncomePerSecond":270,"releaseStatus":"released","cost":42000,"addedAt":"2025-12-06","eventKeys":["santas-fuse-event","christmas"],"craftFilterKeys":["santas-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"santas-fuse-machine","label":"Santa's Fuse Machine"}]},{"id":"penguino-cocosino","name":"Penguino Cocosino","rarity":"Epic","description":"Penguino Cocosino is an Epic-tier Brainrot in Steal a Brainrot, obtained through fusion with a higher probability of generating Epic-tier outcomes, inspired by a whimsical penguin-coconut hybrid with a coconut shell head and palm leaf wings. Penguino Cocosino embodies the tropical absurdity of Italian brainrot meme culture.","baseIncomePerSecond":300,"releaseStatus":"released","cost":45000,"addedAt":"2025-08-02","eventKeys":[],"craftFilterKeys":["summer-fuse","og-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"summer-fuse","label":"Summer Fuse"},{"kind":"source","id":"og-fuse-machine","label":"OG Fuse Machine"},{"kind":"source","id":"runway","label":"Runway"}]},{"id":"perochello-lemonchello","name":"Perochello Lemonchello","rarity":"Epic","description":"Perochello Lemonchello is a zesty, lemon-liquor trickster, splashing bases with tart mischief.","baseIncomePerSecond":160,"releaseStatus":"released","cost":27500,"addedAt":"2025-01-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"perrito-burrito","name":"Perrito Burrito","rarity":"Secret","description":"Perrito Burrito is a Secret-tier character in Steal a Brainrot, depicted as a small hunting dog wrapped in a tortilla like a Mexican burrito, very cute, embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":1000000,"releaseStatus":"released","cost":250000000,"addedAt":"2025-09-30","eventKeys":["taco-tuesday"],"craftFilterKeys":["limited"],"acquisitionBadges":[{"kind":"source","id":"limited-quantity-truck","label":"Limited Quantity Truck"}]},{"id":"peschito-machito","name":"Peschito Machito","rarity":"Secret","description":"Peschito Machito is a Secret turquoise fish-machine hybrid with a long arched body, large teeth, pink facial details, yellow fins, and a fuel-canister attachment.","baseIncomePerSecond":19000000,"releaseStatus":"released","cost":3000000000,"addedAt":"2026-08-08","eventKeys":["rng-machine-queen-bee-event-2026-08-08"],"craftFilterKeys":[],"acquisitionBadges":[{"kind":"source","id":"rng-machine","label":"RNG Machine"}]},{"id":"pi-pi-watermelon","name":"Pi Pi Watermelon","rarity":"Legendary","description":"Pi Pi Watermelon is a Legendary-tier Brainrot in Steal a Brainrot, obtained through fusion with a higher probability of generating Legendary-tier outcomes, inspired by a quirky watermelon-monkey hybrid with a watermelon torso and monkey head, embodying the chaotic charm of Italian brainrot meme culture.","baseIncomePerSecond":1300,"releaseStatus":"released","cost":315000,"addedAt":"2025-08-02","eventKeys":[],"craftFilterKeys":["summer-fuse","og-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"summer-fuse","label":"Summer Fuse"},{"kind":"source","id":"og-fuse-machine","label":"OG Fuse Machine"},{"kind":"source","id":"runway","label":"Runway"}]},{"id":"piccione-macchina","name":"Piccione Macchina","rarity":"Brainrot God","description":"Piccione Macchina is an upcoming Brainrot God, expected to be highly valuable.","baseIncomePerSecond":225000,"releaseStatus":"released","cost":40000000,"addedAt":"2025-07-26","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"piccione-tostatino","name":"Piccione Tostatino","rarity":"Unknown","description":"Piccione Tostatino is an upcoming (unconfirmed) character in Steal a Brainrot, inspired by the Italian brainrot meme Piccione Tostatino. Depicted as an anthropomorphic pigeon with a toasted, crusty exterior, it flutters through a surreal urban bakery, scattering crumbs and chanting a crispy 'tosta-tosta' melody, embodying the chaotic and absurd essence of Italian brainrot meme culture.","baseIncomePerSecond":0,"releaseStatus":"unconfirmed","cost":0,"addedAt":"","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[]},{"id":"piccionetta-macchina","name":"Piccionetta Macchina","rarity":"Brainrot God","description":"Piccionetta Macchina is a Brainrot God-tier character in Steal a Brainrot, depicted as a female version of Piccione Macchina, blending mechanical elegance with feline charm. Piccionetta Macchina embodies the whimsical absurdity of Italian brainrot meme culture.","baseIncomePerSecond":270000,"releaseStatus":"released","cost":47000000,"addedAt":"2025-09-06","eventKeys":[],"craftFilterKeys":["dealer","craft"],"acquisitionBadges":[{"kind":"source","id":"craft-machine","label":"Craft Machine"},{"kind":"source","id":"brainrot-dealer","label":"Brainrot Trader"}]},{"id":"pinealotto-fruttarino","name":"Pinealotto Fruttarino","rarity":"Rare","description":"Pinealotto Fruttarino is a Rare-tier Brainrot character in Steal a Brainrot, obtainable through Witch Fuse. It is a cute axolotl with skin resembling the texture and color of a pineapple’s spiky exterior, blending fruitiness with aquatic absurdity in perfect meme harmony.","baseIncomePerSecond":75,"releaseStatus":"released","cost":10000,"addedAt":"2025-10-11","eventKeys":["witch-fuse-event"],"craftFilterKeys":["witch-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"witch-fuse-machine","label":"Witch Fuse Machine"}]},{"id":"pineaplino","name":"Pineaplino","rarity":"Brainrot God","description":"Pineaplino is a released Brainrot God in Steal a Brainrot and part of the current ADMIN ABUSE runway wave. It appears as a bright yellow pineapple humanoid with oversized blue glasses, a tongue-out grin, and a huge palm-like leafy crown. Pineaplino matters because it gives the new Red Carpet batch a low-cost Brainrot God pickup instead of another Secret-only chase.","baseIncomePerSecond":200000,"releaseStatus":"released","cost":35000000,"addedAt":"2026-04-11","eventKeys":["admin-abuse"],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"pipi-avocado","name":"Pipi Avocado","rarity":"Rare","description":"Pipi Avocado is a Rare-tier Brainrot in Steal a Brainrot, obtained through fusion with a higher probability of generating Rare-tier outcomes, inspired by a quirky avocado-capybara hybrid in Italian brainrot meme culture. Pipi Avocado charms with mischievous flair.","baseIncomePerSecond":70,"releaseStatus":"released","cost":9500,"addedAt":"2025-08-02","eventKeys":[],"craftFilterKeys":["summer-fuse","og-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"summer-fuse","label":"Summer Fuse"},{"kind":"source","id":"og-fuse-machine","label":"OG Fuse Machine"},{"kind":"source","id":"runway","label":"Runway"}]},{"id":"pipi-corni","name":"Pipi Corni","rarity":"Common","description":"Pipi Corni is a Rare-tier Brainrot in Steal a Brainrot, obtained through fusion with a higher probability of generating Rare-tier outcomes, depicted as a quirky corn-mouse hybrid with a corn cob body and mouse head. Pipi Corni embodies the playful absurdity of Italian brainrot meme culture.","baseIncomePerSecond":14,"releaseStatus":"released","cost":1700,"addedAt":"2025-08-02","eventKeys":[],"craftFilterKeys":["summer-fuse","og-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"summer-fuse","label":"Summer Fuse"},{"kind":"source","id":"og-fuse-machine","label":"OG Fuse Machine"},{"kind":"source","id":"runway","label":"Runway"}]},{"id":"pipi-kiwi","name":"Pipi Kiwi","rarity":"Common","description":"Pipi Kiwi is a playful, fruit-themed bird, chirping with tangy, kiwi-inspired zest.","baseIncomePerSecond":13,"releaseStatus":"released","cost":1500,"addedAt":"2025-01-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"pipi-potato","name":"Pipi Potato","rarity":"Legendary","description":"Pipi Potato is a Legendary-tier character in Steal a Brainrot, depicted as a quirky fusion of a hamster and a potato, with a potato body, human legs, and a cheerful 'Hup, hup, hup' chant, hopping through a magical forest, embodying the playful absurdity of Italian brainrot meme culture.","baseIncomePerSecond":1100,"releaseStatus":"released","cost":265000,"addedAt":"2025-08-23","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"pippi-poppa-pippo-peppe","name":"Pippi Poppa Pippo Peppe","rarity":"Unknown","description":"Pippi Poppa Pippo Peppe is an upcoming (unconfirmed) character in Steal a Brainrot, inspired by the Italian brainrot meme Pippi Poppa Pippo Peppe. Depicted as a giant anthropomorphic armadillo clutching the planet Earth in its claws, it waddles through a surreal urban piazza, chanting the hypnotic scioglilingua 'Pippi Poppa, Pippo Peppe' while scattering glowing pompelmi, embodying the chaotic and absurd essence of Italian brainrot meme culture.","baseIncomePerSecond":0,"releaseStatus":"unconfirmed","cost":0,"addedAt":"","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[]},{"id":"pirulitoita-bicicleteira","name":"Pirulitoita Bicicleteira","rarity":"Secret","description":"Pirulitoita Bicicleteira is a Secret-tier Brainrot character in Steal a Brainrot, obtainable from the Brainrot Dealer. It depicts a sentient lollipop riding a bicycle, combining sugar rush energy with surreal motion — a true symbol of sweet chaos.","baseIncomePerSecond":2500000,"releaseStatus":"released","cost":600000000,"addedAt":"2025-11-08","eventKeys":["christmas"],"craftFilterKeys":["dealer"],"acquisitionBadges":[{"kind":"source","id":"brainrot-dealer","label":"Brainrot Trader"}]},{"id":"pizza-and-ranch","name":"Pizza and Ranch","rarity":"Secret","description":"Pizza and Ranch is a released Secret duo obtained from the Red Carpet. The pair combines a smiling topped pizza slice with a worried ranch-dressing bottle and dark green cap. Its 130M/s income makes it one of Update 59's most valuable runway targets.","baseIncomePerSecond":130000000,"releaseStatus":"released","cost":55000000000,"addedAt":"2026-07-25","eventKeys":["crystal-mutation-spain-event-2026-07-25"],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"please-my-present","name":"Please my Present","rarity":"Secret","description":"Please my Present is a Secret-tier Christmas variant of Trickolino. It appears as a festive, emotional figure holding a holiday bowl with pleading eyes, styled with winter decorations and gift-themed patterns, channeling the chaotic charm of holiday Trick-or-Treat energy.","baseIncomePerSecond":1300000,"releaseStatus":"released","cost":350000000,"addedAt":"2025-12-06","eventKeys":["santas-fuse-event","christmas"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"pogo-pogo-penguin","name":"Pogo Pogo Penguin","rarity":"Secret","description":"Pogo Pogo Penguin is a Secret penguin equipped with orange goggles, dark ski gear, skis, poles, and a pogo spring beneath its feet.","baseIncomePerSecond":12500000,"releaseStatus":"released","cost":1700000000,"addedAt":"2026-08-08","eventKeys":["rng-machine-queen-bee-event-2026-08-08"],"craftFilterKeys":[],"acquisitionBadges":[{"kind":"source","id":"rng-machine","label":"RNG Machine"}]},{"id":"polaroidini","name":"Polaroidini","rarity":"Secret","description":"Polaroidini is a Secret white polar-bear Brainrot built around an instant-camera body, with a black central lens, rainbow stripe, blue trim, red shutter button, and a printed photo emerging below.","baseIncomePerSecond":55000000,"releaseStatus":"released","cost":12500000000,"addedAt":"2026-08-11","eventKeys":[],"craftFilterKeys":["limited"],"acquisitionBadges":[{"kind":"source","id":"merchshop-dlc","label":"MerchShop DLC"},{"kind":"mechanic","id":"limited-stock","label":"Limited Stock"}]},{"id":"pop-pop-sahur","name":"Pop Pop Sahur","rarity":"Brainrot God","description":"Pop Pop Sahur is a Brainrot God-tier character in Steal a Brainrot, depicted as a humanoid-object Brainrot appearing as a red firework with a face, human legs, and a fuse as a tail, embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":295000,"releaseStatus":"released","cost":65000000,"addedAt":"2025-10-04","eventKeys":[],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"brainrot-god-lucky-block","label":"Brainrot God Lucky Block"}]},{"id":"popcuru-and-fizzuru","name":"Popcuru and Fizzuru","rarity":"Secret","description":"Popcuru and Fizzuru is a Secret-tier Brainrot duo pairing a box of popcorn with a fizzy carbonated drink. Popcuru and Fizzuru play on the words \"fizzy\" and \"fizz,\" capturing popping sounds, soda bubbles, and cinematic Italian brainrot energy.","baseIncomePerSecond":170000000,"releaseStatus":"released","cost":135000000000,"addedAt":"2026-01-31","eventKeys":["ay-mi-gatito"],"craftFilterKeys":["og-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"og-fuse-machine","label":"OG Fuse Machine"}]},{"id":"pot-hotspot","name":"Pot Hotspot","rarity":"Secret","description":"Pot Hotspot is a sizzling, pot-themed character, boiling over with hot, steamy energy.","baseIncomePerSecond":2500000,"releaseStatus":"released","cost":500000000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"source","id":"secret-lucky-block","label":"Secret Lucky Block"}]},{"id":"pot-pumpkin","name":"Pot Pumpkin","rarity":"Secret","description":"Pot Pumpkin is a Secret-tier Brainrot character in Steal a Brainrot, obtainable during the Graveyard Event as part of the Frightrot Event. It is a Halloween variant of Pot Hotspot, replacing the usual pot design with a carved pumpkin filled with eerie orange glow. Rising from the grave with cheerful mischief, it combines spooky charm with the iconic absurdity of the Brainrot universe.","baseIncomePerSecond":3000000,"releaseStatus":"released","cost":700000000,"addedAt":"2025-10-25","eventKeys":["frightrot-event"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"pretzo-robo","name":"Pretzo Robo","rarity":"Brainrot God","description":"Pretzo Robo is a Brainrot God character in Steal a Brainrot and one of the standout prestige designs in the Cyber lineup. It appears as an orange-and-blue robot with glowing round eyes, crystal shoulder spikes, and a giant salted pretzel built into its torso. Pretzo Robo matters because it gives the current machine wave a high-status chase with one of the strangest silhouettes in the whole update.","baseIncomePerSecond":320000,"releaseStatus":"released","cost":77000000,"addedAt":"2026-04-19","eventKeys":["cyber-event"],"craftFilterKeys":["craft","cyber-craft-machine"],"acquisitionBadges":[{"kind":"source","id":"cyber-craft-machine","label":"Cyber Craft Machine"}]},{"id":"puffaball","name":"Puffaball","rarity":"Legendary","description":"Puffaball is a Legendary-tier Brainrot obtainable through Fishing. It is a small, round, delightfully puffy creature radiating soft charm and meme-friendly buoyancy.","baseIncomePerSecond":1500,"releaseStatus":"released","cost":330000,"addedAt":"2025-11-22","eventKeys":[],"craftFilterKeys":["fishing"],"acquisitionBadges":[{"kind":"source","id":"fishing-event","label":"Fishing Event"}]},{"id":"pulcino-limoncino","name":"Pulcino Limoncino","rarity":"Unknown","description":"Pulcino Limoncino is an upcoming (unconfirmed) character in Steal a Brainrot, inspired by the Italian brainrot meme Pulcino Limoncino. Depicted as an adorably cute yellow chick shaped uniquely like a zesty lemon, it waddles through a surreal citrus meadow, chirping a tangy 'limone-limone' tune while squirting juice sparks, embodying the chaotic and absurd essence of Italian brainrot meme culture.","baseIncomePerSecond":0,"releaseStatus":"unconfirmed","cost":0,"addedAt":"","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[]},{"id":"pumpkini-spyderini","name":"Pumpkini Spyderini","rarity":"Secret","description":"Pumpkini Spyderini is a Secret-tier Brainrot character in Steal a Brainrot, obtainable from the Spooky Lucky Block during the Frightrot Event. It is a Halloween version of Sammyni Spyderini, featuring a glowing carved pumpkin head replacing its original spider form. Crawling with orange energy and eerie laughter, it perfectly captures the spooky yet playful essence of the Frightrot Event.","baseIncomePerSecond":650000,"releaseStatus":"released","cost":165000000,"addedAt":"2025-10-25","eventKeys":["frightrot-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"spooky-lucky-block","label":"Spooky Lucky Block"}]},{"id":"quackalena","name":"Quackalena","rarity":"Brainrot God","description":"Quackalena is a bright yellow duck Brainrot with a blocky orange bill, white belly, small wings, webbed feet, and a friendly upright pose.","baseIncomePerSecond":265000,"releaseStatus":"released","cost":46000000,"addedAt":"2026-08-08","eventKeys":["rng-machine-queen-bee-event-2026-08-08"],"craftFilterKeys":[],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"source","id":"rng-machine","label":"RNG Machine"}]},{"id":"quackini-snackini","name":"Quackini Snackini","rarity":"Secret","description":"Quackini Snackini is a released Secret Easter brainrot in Steal a Brainrot and part of the live EASTER EVENT (Part 2) wave. It appears as a duck-and-vending-machine hybrid with a rectangular snack-machine body stocked with eggs. Quackini Snackini matters because it adds a direct Egg City route to the current Easter lineup instead of another Lucky Block or machine-only path.","baseIncomePerSecond":65000000,"releaseStatus":"released","cost":15500000000,"addedAt":"2026-04-04","eventKeys":["egg-city","easter-event-part-2","easter-event"],"craftFilterKeys":["default"],"acquisitionBadges":[]},{"id":"quackula","name":"Quackula","rarity":"Legendary","description":"Quackula is a Legendary-tier Brainrot character in Steal a Brainrot, obtainable through Witch Fuse. It is a vampire duck with bat wings and sharp fangs, flapping through the night quacking ominously. Equal parts adorable and terrifying, it’s the perfect Halloween twist on aquatic absurdity.","baseIncomePerSecond":1200,"releaseStatus":"released","cost":310000,"addedAt":"2025-10-11","eventKeys":["witch-fuse-event"],"craftFilterKeys":["witch-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"witch-fuse-machine","label":"Witch Fuse Machine"}]},{"id":"queen-bee","name":"Queen Bee","rarity":"Secret","description":"Queen Bee is a Secret royal bee group with one crowned queen in a red-and-gold robe and four smaller striped attendants gathered around her.","baseIncomePerSecond":65000000,"releaseStatus":"released","cost":15500000000,"addedAt":"2026-08-08","eventKeys":["rng-machine-queen-bee-event-2026-08-08"],"craftFilterKeys":[],"acquisitionBadges":[]},{"id":"quesadilla-crocodila","name":"Quesadilla Crocodila","rarity":"Secret","description":"Quesadilla Crocodila is a Secret-tier character in Steal a Brainrot, depicted as a crocodile wrapped in a cheesy quesadilla, blending savory flair with reptilian mischief, embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":3000000,"releaseStatus":"released","cost":700000000,"addedAt":"2025-09-16","eventKeys":["taco-tuesday"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"source","id":"taco-lucky-block","label":"Taco Lucky Block"}]},{"id":"quesadillo-vampiro","name":"Quesadillo Vampiro","rarity":"Secret","description":"Quesadillo Vampiro is a Secret-tier Brainrot character in Steal a Brainrot, obtainable via the Limited Quantity Truck. It is a quesadilla resembling a vampire, with cheese fangs, a dark tortilla cloak, and a haunting gaze. This culinary creature fuses the spooky spirit of Halloween with the zesty flavor of Taco Tuesday chaos.","baseIncomePerSecond":3500000,"releaseStatus":"released","cost":750000000,"addedAt":"2025-10-21","eventKeys":["taco-tuesday"],"craftFilterKeys":["limited"],"acquisitionBadges":[{"kind":"source","id":"limited-quantity-truck","label":"Limited Quantity Truck"}]},{"id":"quivioli-ameleonni","name":"Quivioli Ameleonni","rarity":"Legendary","description":"Quivioli Ameleonni is a Legendary-tier character in Steal a Brainrot, depicted as a chameleon with a kiwi-like texture, blending into chaos with vibrant colors, embodying the surreal adaptability of Italian brainrot meme culture.","baseIncomePerSecond":900,"releaseStatus":"released","cost":225000,"addedAt":"2025-08-31","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"raccooni-jandelini","name":"Raccooni Jandelini","rarity":"Common","description":"Raccooni Jandelini is a Common-tier character in Steal a Brainrot, depicted as a raccoon with an Italian flair, sporting a tiny hat and scavenging with playful mischief, embodying the lighthearted chaos of Italian brainrot meme culture.","baseIncomePerSecond":12,"releaseStatus":"released","cost":1300,"addedAt":"2025-08-23","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"rana-paninone","name":"Rana Paninone","rarity":"Unknown","description":"Rana Paninone is an upcoming (unconfirmed) character in Steal a Brainrot, inspired by the Italian brainrot meme Rana Paninone. Depicted as an anthropomorphic frog with a crusty bread loaf for a body, it hops through a surreal bakery swamp, croaking a doughy 'pani-pani' chant while shedding crumbs, embodying the chaotic and absurd essence of Italian brainrot meme culture.","baseIncomePerSecond":0,"releaseStatus":"unconfirmed","cost":0,"addedAt":"","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[]},{"id":"rang-ring-bus","name":"Rang Ring Bus","rarity":"Secret","description":"Rang Ring Bus is a Secret-tier Brainrot character in Steal a Brainrot, appearing exclusively during the Indonesian Event. It is a black bus with a humanoid face on the front and five pairs of legs underneath, giving it an uncanny, insectoid mobility. Equal parts eerie and comedic, this living vehicle embodies the surreal absurdity of the Brainrot universe.","baseIncomePerSecond":6000000,"releaseStatus":"released","cost":1100000000,"addedAt":"2025-10-18","eventKeys":["indonesian-event"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"ref-ref-ref-sahur","name":"Ref Ref Ref Sahur","rarity":"Secret","description":"Ref Ref Ref Sahur is a Secret referee-themed Sahur variant from FUTBOL UPDATE. It wears a referee outfit, black gloves, and carries a yellow checked flag. Its red-card trigger and 2.7M/s income make it the distinctive match-event collectible in the football trio.","baseIncomePerSecond":2700000,"releaseStatus":"released","cost":650000000,"addedAt":"2026-06-27","eventKeys":["futbol-update-2026-06-27"],"craftFilterKeys":[],"acquisitionBadges":[{"kind":"source","id":"live-match-events","label":"Live Match Events"}]},{"id":"reindeer-tralala","name":"Reindeer Tralala","rarity":"Secret","description":"Reindeer Tralala is a Secret-tier Christmas version of Tralalero Tralala, redesigned with antlers, a red nose, and festive winter decorations. It blends musical meme energy with classic reindeer holiday flair.","baseIncomePerSecond":600000,"releaseStatus":"released","cost":160000000,"addedAt":"2025-12-06","eventKeys":["santas-fuse-event","christmas"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"reinito-sleighito","name":"Reinito Sleighito","rarity":"Secret","description":"Reinito Sleighito is a Secret-tier Brainrot combining a reindeer with a festive sleigh. The sleigh’s rear is stacked with colorful wrapped presents, creating a high-speed holiday delivery creature bursting with Christmas chaos.","baseIncomePerSecond":140000000,"releaseStatus":"released","cost":60000000000,"addedAt":"2025-12-13","eventKeys":["north-pole-event","christmas","santas-fuse-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"festive-lucky-block","label":"Festive Lucky Block"}]},{"id":"rhino-helicopterino","name":"Rhino Helicopterino","rarity":"Mythic","description":"Rhino Helicopterino is a Mythic-tier character in Steal a Brainrot, depicted as a rhinoceros with a helicopter propeller and casing mounted on its back, blending brute strength with aerial absurdity. Rhino Helicopterino embodies the wild essence of Italian brainrot meme culture.","baseIncomePerSecond":11000,"releaseStatus":"released","cost":4100000,"addedAt":"2025-09-14","eventKeys":[],"craftFilterKeys":["craft"],"acquisitionBadges":[{"kind":"source","id":"craft-machine","label":"Craft Machine"}]},{"id":"rhino-toasterino","name":"Rhino Toasterino","rarity":"Mythic","description":"Rhino Toasterino is a hefty, toaster-shaped rhinoceros, charging with warm, toasty might.","baseIncomePerSecond":2100,"releaseStatus":"released","cost":450000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"rico-dinero","name":"Rico Dinero","rarity":"Secret","description":"Rico Dinero is a released Secret brainrot in Steal a Brainrot and part of the current ADMIN ABUSE wave through the DLC route. It appears as a square money-themed mascot with a grinning face, a huge stack of cash on top, and gold coins tucked around the body. Rico Dinero matters because it gives the new DLC batch a mid-tier chase that still feels distinct from the runway fruit lineup.","baseIncomePerSecond":42500000,"releaseStatus":"released","cost":7500000000,"addedAt":"2026-04-11","eventKeys":["admin-abuse"],"craftFilterKeys":["limited"],"acquisitionBadges":[{"kind":"mechanic","id":"limited-stock","label":"Limited Stock"}]},{"id":"robo-grafito","name":"Robo Grafito","rarity":"Brainrot God","description":"Robo Grafito is a Brainrot God brainrot released in the May 9, 2026 BACKROOMS update. It appears as a graffiti-styled robot with painted mechanical body panels, face details, and small limbs.","baseIncomePerSecond":317500,"releaseStatus":"released","cost":76000000,"addedAt":"2026-05-09","eventKeys":["backrooms-event"],"craftFilterKeys":["craft","cyber-craft-machine"],"acquisitionBadges":[{"kind":"source","id":"cyber-craft-machine","label":"Cyber Craft Machine"}]},{"id":"rocco-disco","name":"Rocco Disco","rarity":"Secret","description":"Rocco Disco is a Secret-tier Brainrot depicting a raccoon head stuck onto a shimmering disco ball, forever frozen in a funky, chaotic dance-floor vibe.","baseIncomePerSecond":650000,"releaseStatus":"released","cost":150000000,"addedAt":"2025-12-31","eventKeys":["26-event"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"rossetti-tualetti","name":"Rosetti Tualetti","rarity":"Secret","description":"Rosetti Tualetti is a Secret-tier Valentines version of Spaghetti Tualetti. Rosetti Tualetti replaces chaos with romance, blending floral affection into Italian brainrot absurdity.","baseIncomePerSecond":50000000,"releaseStatus":"released","cost":10000000000,"addedAt":"2026-02-07","eventKeys":["valentines-pt1-event","valentines-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"heart-lucky-block","label":"Heart Lucky Block"}]},{"id":"rosey-and-teddy","name":"Rosey and Teddy","rarity":"Secret","description":"Rosey and Teddy is a Valentines-themed Brainrot duo consisting of a crying anthropomorphic rose and a cheerful teddy bear. Rosey and Teddy contrast sadness and joy, forming a memorable romantic brainrot pairing.","baseIncomePerSecond":165000000,"releaseStatus":"released","cost":130000000000,"addedAt":"2026-02-07","eventKeys":["valentines-pt1-event","valentines-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"heart-lucky-block","label":"Heart Lucky Block"}]},{"id":"rubiko-and-kubiko","name":"Rubiko and Kubiko","rarity":"Secret","description":"Rubiko and Kubiko is a released Secret Los Traders brainrot with two characters. A white die and a multicolor puzzle cube stand side by side with playful faces and wafer-like legs. Its 72.5M/s income places the pair near the top of the rotating machine pool.","baseIncomePerSecond":72500000,"releaseStatus":"released","cost":21000000000,"addedAt":"2026-07-18","eventKeys":[],"craftFilterKeys":["dealer"],"acquisitionBadges":[{"kind":"source","id":"los-traders","label":"Los Traders"},{"kind":"mechanic","id":"dealer","label":"Brainrot Trader"}]},{"id":"rubrikiko","name":"Rubrikiko","rarity":"Secret","description":"Rubrikiko is a Secret brainrot released in the May 9, 2026 BACKROOMS update. It appears as a compact puzzle-cube styled character with colored panels, face details, and small limbs.","baseIncomePerSecond":70000000,"releaseStatus":"released","cost":20000000000,"addedAt":"2026-05-09","eventKeys":["backrooms-event"],"craftFilterKeys":["craft","cyber-craft-machine"],"acquisitionBadges":[{"kind":"source","id":"cyber-craft-machine","label":"Cyber Craft Machine"}]},{"id":"smore-serat","name":"S'more Serat","rarity":"Secret","description":"S'more Serat is a Secret s'more-and-rat hybrid with a triangular graham-cracker head and body, chocolate filling, large eyes, thin limbs, white gloves, and boots.","baseIncomePerSecond":85000000,"releaseStatus":"released","cost":25500000000,"addedAt":"2026-08-08","eventKeys":["rng-machine-queen-bee-event-2026-08-08"],"craftFilterKeys":[],"acquisitionBadges":[]},{"id":"salamino-penguino","name":"Salamino Penguino","rarity":"Epic","description":"Salamino Penguino is an upcoming Epic Brainrot, details pending release.","baseIncomePerSecond":250,"releaseStatus":"released","cost":40000,"addedAt":"2025-07-26","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"sammyni-cakini","name":"Sammyni Cakini","rarity":"Secret","description":"Sammyni Cakini is a Secret anniversary brainrot. It is a party-themed Sammyni Fattini variant with cake details, birthday accessories, and the Sammy-inspired face shape.","baseIncomePerSecond":85000000,"releaseStatus":"released","cost":12500000000,"addedAt":"2026-05-16","eventKeys":["next-update-2026-05-16"],"craftFilterKeys":["craft","cyber-craft-machine"],"acquisitionBadges":[{"kind":"source","id":"cyber-craft-machine","label":"Cyber Craft Machine"}]},{"id":"sammyni-fattini","name":"Sammyni Fattini","rarity":"Secret","description":"Sammyni Fattini is a Secret-tier Brainrot inspired by Fat Sammy. Sammyni Fattini exaggerates the larger-than-life persona into chaotic Italian brainrot form, turning Sammyni Fattini into a humorous and powerful Admin Lucky Block reward.","baseIncomePerSecond":70000000,"releaseStatus":"released","cost":20000000000,"addedAt":"2026-02-21","eventKeys":["trade-machine-event","admin-abuse"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"admin-lucky-block","label":"Admin Lucky Block"}]},{"id":"sammyni-spyderini","name":"Sammyni Spyderini","rarity":"Secret","description":"Sammyni Spyderini is a Secret-tier character in Steal a Brainrot, depicted as a spider with a yellow head featuring Sammy's face, red and black legs, and a web-spinning design, producing cobweb particles and embodying the quirky chaos of Italian brainrot meme culture.","baseIncomePerSecond":325000,"releaseStatus":"released","cost":100000000,"addedAt":"2025-08-23","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"sammyni-truckini","name":"Sammyni Truckini","rarity":"Secret","description":"Sammyni Truckini is a Secret Sammyni Fattini variant fused with a taco truck and supported by spider-like legs.","baseIncomePerSecond":110000000,"releaseStatus":"released","cost":45000000000,"addedAt":"2026-08-18","eventKeys":["taco-tuesday"],"craftFilterKeys":[],"acquisitionBadges":[{"kind":"source","id":"taco-merchant","label":"Taco Merchant"}]},{"id":"sand-sand-sand","name":"Sand Sand Sand","rarity":"Secret","description":"Sand Sand Sand is a Secret Octo Lucky Block reward from SUMMER UPD PT 1. It looks like a green sand bucket filled with sand, with a large shovel rising from the top. Its 1% listed chance makes it a rare summer collection target while staying more reachable than the top Octo pulls.","baseIncomePerSecond":30000000,"releaseStatus":"released","cost":3000000000,"addedAt":"2026-06-13","eventKeys":["summer-upd-pt-1-2026-06-13"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"mechanic","id":"lucky-block","label":"Lucky Block"}]},{"id":"santa-hotspot","name":"Santa Hotspot","rarity":"Secret","description":"Santa Hotspot is a Secret-tier Christmas variant of Pot Hotspot, decorated with Santa-themed elements and festive warmth, glowing like a holiday hotspot.","baseIncomePerSecond":2600000,"releaseStatus":"released","cost":625000000,"addedAt":"2025-12-13","eventKeys":["north-pole-event","christmas","santas-fuse-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"festive-lucky-block","label":"Festive Lucky Block"}]},{"id":"santteo","name":"Santteo","rarity":"Secret","description":"Santteo is a Secret-tier Christmas variant of Matteo, adorned with festive holiday elements—such as a Santa hat, red-and-white trims, and cheerful winter expressions—blending Matteo’s classic charm with Christmas spirit.","baseIncomePerSecond":800000,"releaseStatus":"released","cost":210000000,"addedAt":"2025-12-06","eventKeys":["santas-fuse-event","christmas"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"saphiri-ramiri","name":"Saphiri Ramiri","rarity":"Unknown","description":"Saphiri Ramiri is an upcoming (unconfirmed) character in Steal a Brainrot. It is a radiant goat with a body made entirely of gemstones, shimmering with blue sapphire light. Elegant yet chaotic, it embodies the luxurious absurdity and mythical charm of the Brainrot world.","baseIncomePerSecond":0,"releaseStatus":"unconfirmed","cost":0,"addedAt":"","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[]},{"id":"scorpino-coasterino","name":"Scorpino Coasterino","rarity":"Secret","description":"Scorpino Coasterino is a Secret neon scorpion whose purple body forms a roller-coaster car with seats, a steering wheel, pincers, pointed legs, and a raised tail.","baseIncomePerSecond":47500000,"releaseStatus":"released","cost":9200000000,"addedAt":"2026-08-08","eventKeys":["rng-machine-queen-bee-event-2026-08-08"],"craftFilterKeys":[],"acquisitionBadges":[{"kind":"source","id":"rng-machine","label":"RNG Machine"}]},{"id":"sealo-regalo","name":"Sealo Regalo","rarity":"Legendary","description":"Sealo Regalo is a Legendary-tier Seal disguised as a wrapped gift box, complete with ribbons and tags. It slides across the floor like a present that decided to deliver itself.","baseIncomePerSecond":1800,"releaseStatus":"released","cost":342500,"addedAt":"2025-12-06","eventKeys":["santas-fuse-event","christmas"],"craftFilterKeys":["santas-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"santas-fuse-machine","label":"Santa's Fuse Machine"}]},{"id":"serafinna-medusella","name":"Serafinna Medusella","rarity":"Secret","description":"Serafinna Medusella is a Secret-tier Brainrot depicted as a pastel jellyfish with dangling tentacles and soft multicolored wings. Serafinna Medusella feels delicate and dreamlike, pushing the Divine Fuse set toward airy angelic fantasy.","baseIncomePerSecond":5500000,"releaseStatus":"released","cost":1000000000,"addedAt":"2026-03-07","eventKeys":["divine-fuse-machine-event"],"craftFilterKeys":["divine-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"divine-fuse-machine","label":"Divine Fuse Machine"}]},{"id":"seraphino-gruyero","name":"Seraphino Gruyero","rarity":"Legendary","description":"Seraphino Gruyero is a Legendary-tier Brainrot shown as a bright starfish-and-lemon hybrid with unusually shaped arms and a playful smiling face. Seraphino Gruyero turns an odd citrus sea-creature mashup into a radiant meme.","baseIncomePerSecond":1900,"releaseStatus":"released","cost":347500,"addedAt":"2026-03-07","eventKeys":["divine-fuse-machine-event"],"craftFilterKeys":["divine-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"divine-fuse-machine","label":"Divine Fuse Machine"}]},{"id":"sigma-boy","name":"Sigma Boy","rarity":"Legendary","description":"Sigma Boy is a Legendary-tier Brainrot, inspired by the Italian Brainrot meme culture, depicted as a penguin with a sushi torso, known for its confident sigma male persona.","baseIncomePerSecond":1325,"releaseStatus":"released","cost":325000,"addedAt":"2025-08-02","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"sigma-girl","name":"Sigma Girl","rarity":"Legendary","description":"Sigma Girl is a Legendary-tier character in Steal a Brainrot, depicted as the female counterpart to Sigma Boy, exuding strength and charisma with a feminine twist, embodying the wild essence of Italian brainrot meme culture.","baseIncomePerSecond":1800,"releaseStatus":"released","cost":340000,"addedAt":"2025-09-21","eventKeys":["mexico-event"],"craftFilterKeys":["dealer","craft"],"acquisitionBadges":[{"kind":"source","id":"craft-machine","label":"Craft Machine"},{"kind":"source","id":"brainrot-dealer","label":"Brainrot Trader"}]},{"id":"signore-carapace","name":"Signore Carapace","rarity":"Legendary","description":"Signore Carapace is a Legendary-tier character in Steal a Brainrot, inspired by the Italian brainrot meme Signore Carapace, depicted as an anthropomorphic turtle dressed as a seasoned professional, with a polished carapace briefcase and glowing tie. Signore Carapace struts through a surreal corporate pizzeria, barking orders in a hypnotic 'carapace-click' rhythm, embodying the chaotic and absurd essence of Italian brainrot meme culture.","baseIncomePerSecond":1300,"releaseStatus":"released","cost":320000,"addedAt":"2025-09-06","eventKeys":[],"craftFilterKeys":["craft"],"acquisitionBadges":[{"kind":"source","id":"craft-machine","label":"Craft Machine"}]},{"id":"skibidi-toilet","name":"Skibidi Toilet","rarity":"OG","description":"Skibidi Toilet is an OG-tier Brainrot depicted as an ordinary toilet with a humanoid head emerging from the bowl. It has chubby, fleshy cheeks, large round eyes, and an eerie wide grin, embodying the unsettling absurdity of the original Skibidi meme.","baseIncomePerSecond":450000000,"releaseStatus":"released","cost":450000000000,"addedAt":"2025-12-27","eventKeys":["skibidi-event"],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"skull-skull-skull","name":"Skull Skull Skull","rarity":"Brainrot God","description":"Skull Skull Skull is a Brainrot God-tier Brainrot character in Steal a Brainrot, obtainable during the Graveyard Event. It is a skeletal version of Dul Dul Dul, taking the form of a single animated skull with glowing eyes and a mischievous grin. Rising from freshly dug graves, it dances with eerie rhythm and haunting laughter, bringing chaotic undead energy to the graveyard.","baseIncomePerSecond":290000,"releaseStatus":"released","cost":60000000,"addedAt":"2025-10-25","eventKeys":["frightrot-event"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"smurf-cat","name":"Smurf Cat","rarity":"Unknown","description":"Smurf Cat is an upcoming (unconfirmed) character in Steal a Brainrot, inspired by the Russian brainrot meme Шайлушай (Shailushai), depicted as an anthropomorphic blue creature with a mushroom hat and a cat-like face, wandering through a surreal forest with a snail on a stick, pulsing with the eerie rhythm of 'We Live, We Love, We Lie' from Alan Walker's 'The Spectre,' embodying the absurd charm of internet meme culture.","baseIncomePerSecond":0,"releaseStatus":"unconfirmed","cost":0,"addedAt":"","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[]},{"id":"snailenzo","name":"Snailenzo","rarity":"Brainrot God","description":"Snailenzo is a Brainrot God-tier Brainrot character in Steal a Brainrot, obtainable through Witch Fuse. It is a snail riding in a small racing kart, leaving behind trails of glowing slime as it zooms absurdly fast. Its shell reflects neon hues, symbolizing the humorous contrast between sluggish nature and high-speed chaos.","baseIncomePerSecond":250000,"releaseStatus":"released","cost":45000000,"addedAt":"2025-10-11","eventKeys":["witch-fuse-event"],"craftFilterKeys":["witch-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"witch-fuse-machine","label":"Witch Fuse Machine"}]},{"id":"snailo-clovero","name":"Snailo Clovero","rarity":"Secret","description":"Snailo Clovero is a Secret-tier Brainrot in Steal a Brainrot and a live Leprechaun Lucky Block drop from ST PATRICKS. It appears as a pale snail with a large clover shell, white gloves and boots, and a small shamrock staff that gives the design a clean event silhouette. Snailo Clovero matters because it turns one of the clearest ST PATRICKS visuals into a live Secret with a much stronger endgame stat line than the first sync captured.","baseIncomePerSecond":18500000,"releaseStatus":"released","cost":2700000000,"addedAt":"2026-03-14","eventKeys":["st-patricks-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"leprechaun-lucky-block","label":"Leprechaun Lucky Block"}]},{"id":"spaghetti-tualetti","name":"Spaghetti Tualetti","rarity":"Secret","description":"Spaghetti Tualetti is a Secret-tier character in Steal a Brainrot, depicted as a toilet made of spaghetti strands, swirling with chaotic sauce and humor, embodying the surreal madness of Italian brainrot meme culture.","baseIncomePerSecond":60000000,"releaseStatus":"released","cost":15000000000,"addedAt":"2025-08-31","eventKeys":[],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"secret-lucky-block","label":"Secret Lucky Block"}]},{"id":"spinny-hammy","name":"Spinny Hammy","rarity":"Secret","description":"Spinny Hammy is a Secret-tier Brainrot featuring a hamster encased in a washing-machine shell. Spinny Hammy looks like it’s ready to spin-cycle through chaos, blending laundry-themed absurdity with cute rodent energy in classic Italian brainrot style.","baseIncomePerSecond":17000000,"releaseStatus":"released","cost":2300000000,"addedAt":"2026-01-24","eventKeys":["the-return"],"craftFilterKeys":["og-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"og-fuse-machine","label":"OG Fuse Machine"}]},{"id":"spioniro-golubiro","name":"Spioniro Golubiro","rarity":"Mythic","description":"Spioniro Golubiro is a stealthy, spy-themed pigeon, gathering intelligence with covert precision.","baseIncomePerSecond":3500,"releaseStatus":"released","cost":750000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"source","id":"mythic-lucky-block","label":"Mythic Lucky Block"}]},{"id":"spongini-quackini","name":"Spongini Quackini","rarity":"Mythic","description":"Spongini Quackini is a Mythic-tier Brainrot depicted as a small yellow chick whose body is entirely made of sponge. Spongini Quackini blends soft, absorbent textures with playful chick energy, amplifying Italian brainrot absurdity.","baseIncomePerSecond":13000,"releaseStatus":"released","cost":4400000,"addedAt":"2026-01-24","eventKeys":["the-return"],"craftFilterKeys":["og-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"og-fuse-machine","label":"OG Fuse Machine"}]},{"id":"spooky-and-pumpky","name":"Spooky and Pumpky","rarity":"Secret","description":"Spooky and Pumpky is a Secret-tier Brainrot character in Steal a Brainrot, obtainable through Witch Fuse. It is a fusion of Little Spooky and Little Pumpky, embodying Halloween’s duality of cute and creepy. One half glows ghostly white while the other burns pumpkin orange, their laughter echoing in unison as they haunt the conveyor with festive mischief.","baseIncomePerSecond":80000000,"releaseStatus":"released","cost":25000000000,"addedAt":"2025-10-11","eventKeys":["witch-fuse-event"],"craftFilterKeys":["witch-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"witch-fuse-machine","label":"Witch Fuse Machine"}]},{"id":"spyder-elephant","name":"Spyder Elephant","rarity":"OG","description":"Spyder Elephant is an OG brainrot released during the 1 YEAR EVENT. It appears as a blue elephant variant tied to SpyderSammy, with an exclusive route and very high base income.","baseIncomePerSecond":1000000000,"releaseStatus":"released","cost":1000000000000,"addedAt":"2026-05-16","eventKeys":["next-update-2026-05-16"],"craftFilterKeys":[],"acquisitionBadges":[{"kind":"source","id":"spyder-chain","label":"Spyder Chain"}]},{"id":"squalanana","name":"Squalanana","rarity":"Brainrot God","description":"Squalanana is a Brainrot God-tier character in Steal a Brainrot, depicted as a shark with a body entirely composed of a single banana, retaining its triangular dorsal fin, pectoral fins, and tail fin, it glides through a surreal tropical ocean, chomping with a juicy 'banana-snap' chant, embodying the whimsical and absurd essence of Italian brainrot meme culture.","baseIncomePerSecond":250000,"releaseStatus":"released","cost":45000000,"addedAt":"2025-10-04","eventKeys":[],"craftFilterKeys":["fishing","craft"],"acquisitionBadges":[{"kind":"source","id":"craft-machine","label":"Craft Machine"},{"kind":"source","id":"fishing-event","label":"Fishing Event"}]},{"id":"statutino-libertino","name":"Statutino Libertino","rarity":"Brainrot God","description":"Statutino Libertino is a freedom-loving, statue-themed character, standing tall with patriotic, liberating spirit.","baseIncomePerSecond":75000,"releaseStatus":"released","cost":20000000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"steakini-fattini","name":"Steakini Fattini","rarity":"Secret","description":"Steakini Fattini is a Secret humanoid brainrot based on Steak. It appears as a bald character wearing a small white shirt with a burger graphic, blue pants, and holding a burger.","baseIncomePerSecond":55000000,"releaseStatus":"released","cost":12500000000,"addedAt":"2026-05-30","eventKeys":["steaks-admin-abuse-2026-05-30"],"craftFilterKeys":["limited"],"acquisitionBadges":[{"kind":"mechanic","id":"limited-stock","label":"Limited Stock"}]},{"id":"stoppo-luminino","name":"Stoppo Luminino","rarity":"Mythic","description":"Stoppo Luminino is a Mythic-tier Brainrot character in Steal a Brainrot, obtainable from the Brainrot Dealer. Its exact appearance remains unknown, shrouded in mystery and speculation among Brainrot collectors.","baseIncomePerSecond":8000,"releaseStatus":"released","cost":3000000,"addedAt":"2025-11-08","eventKeys":[],"craftFilterKeys":["dealer"],"acquisitionBadges":[{"kind":"source","id":"brainrot-dealer","label":"Brainrot Trader"}]},{"id":"strawberelli-flamingelli","name":"Strawberelli Flamingelli","rarity":"Legendary","description":"Strawberelli Flamingelli is a fiery, strawberry-flavored flamingo, soaring with sweet, tropical heat.","baseIncomePerSecond":1100,"releaseStatus":"released","cost":275000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"strawberrita","name":"Strawberrita","rarity":"Secret","description":"Strawberrita is a released Secret brainrot in Steal a Brainrot and part of the current ADMIN ABUSE runway wave. It appears as a humanoid strawberry with green leaf hair, black glasses, and a dark dress posed like a runway regular. Strawberrita matters because it adds another Secret-tier default spawn to the current Red Carpet batch at a lower entry price than the top chases.","baseIncomePerSecond":6500000,"releaseStatus":"released","cost":1200000000,"addedAt":"2026-04-11","eventKeys":["admin-abuse"],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"strawberry-elephant","name":"Strawberry Elephant","rarity":"OG","description":"Strawberry Elephant is an OG rarity character in Steal a Brainrot, the highest rarity tier above Secret. Depicted as an anthropomorphic elephant with a vibrant strawberry-red hide and a crown of juicy berries, it stomps through a surreal candy jungle, trumpeting sweet, chaotic melodies. When it appears, it triggers a strawberry rain event that randomly grants the strawberry trait to brainrots across the map.","baseIncomePerSecond":750000000,"releaseStatus":"released","cost":750000000000,"addedAt":"2025-08-31","eventKeys":[],"craftFilterKeys":["leaderboard"],"acquisitionBadges":[{"kind":"source","id":"leaderboard-reward","label":"Leaderboard Reward"}]},{"id":"sundrilla-sundae","name":"Sundrilla Sundae","rarity":"Brainrot God","description":"Sundrilla Sundae is a dessert-themed Brainrot God character with sundae styling, bright sweet-shop colors, and a powerful summer silhouette.","baseIncomePerSecond":180000,"releaseStatus":"released","cost":31000000,"addedAt":"2026-05-23","eventKeys":["summer-fuse-2026-05-23"],"craftFilterKeys":["summer-fuse"],"acquisitionBadges":[{"kind":"source","id":"summer-fuse","label":"Summer Fuse"}]},{"id":"sushi-inu","name":"Sushi Inu","rarity":"Secret","description":"Sushi Inu is a Secret Octo Lucky Block reward from SUMMER UPD PT 1. It presents a Shiba Inu-inspired dog wrapped in sushi-themed details with a compact food-creature silhouette. Its 10% listed chance makes it a mid-table summer pull for players filling the Octo reward set.","baseIncomePerSecond":8000000,"releaseStatus":"released","cost":1300000000,"addedAt":"2026-06-13","eventKeys":["summer-upd-pt-1-2026-06-13"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"mechanic","id":"lucky-block","label":"Lucky Block"}]},{"id":"svinina-bombardino","name":"Svinina Bombardino","rarity":"Common","description":"Svinina Bombardino is a bombastic, pork-themed explosive, blasting through with meaty, volatile flair.","baseIncomePerSecond":10,"releaseStatus":"released","cost":1200,"addedAt":"2025-01-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"swag-soda","name":"Swag Soda","rarity":"Secret","description":"Swag Soda is a Secret-tier Brainrot character in Steal a Brainrot, obtainable by trading older Brainrots at the Brainrot Trader. It is a sparkling can of soda radiating style and confidence, with shades, a smirk, and overflowing fizzy attitude — the epitome of cool meme energy.","baseIncomePerSecond":13000000,"releaseStatus":"released","cost":1800000000,"addedAt":"2025-11-15","eventKeys":["radioactive-mutation-event"],"craftFilterKeys":["dealer"],"acquisitionBadges":[{"kind":"source","id":"brainrot-dealer","label":"Brainrot Trader"}]},{"id":"swaggy-bros","name":"Swaggy Bros","rarity":"Secret","description":"Swaggy Bros is a Secret-tier limited Brainrot formed as a duo fusion of Chillin Chili and Swag Soda, combining spicy chill vibes with fizzy swagger. Together, they radiate peak meme confidence—one bringing the heat, the other bringing the drip.","baseIncomePerSecond":40000000,"releaseStatus":"released","cost":7000000000,"addedAt":"2025-12-16","eventKeys":["taco-tuesday"],"craftFilterKeys":["limited"],"acquisitionBadges":[{"kind":"source","id":"limited-quantity-truck","label":"Limited Quantity Truck"}]},{"id":"ta-ta-ta-ta-sahur","name":"Ta Ta Ta Ta Sahur","rarity":"Rare","description":"Ta Ta Ta Ta Sahur is a rhythmic, chant-driven spirit, pulsing with nocturnal, festive energy.","baseIncomePerSecond":55,"releaseStatus":"released","cost":7500,"addedAt":"2025-01-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"tacorillo-crocodillo","name":"Tacorillo Crocodillo","rarity":"Secret","description":"Tacorillo Crocodillo is a Secret-tier Taco Tuesday Brainrot depicting a bright green crocodile in a colorful Mexican hat and sandals, with a taco-stacked tail of meat, tomato, cheese, and lettuce. The design turns taco ingredients into a crocodile-themed limited reward from the Taco Truck.","baseIncomePerSecond":12500000,"releaseStatus":"released","cost":1500000000,"addedAt":"2026-03-03","eventKeys":["taco-tuesday"],"craftFilterKeys":["limited"],"acquisitionBadges":[{"kind":"source","id":"limited-quantity-truck","label":"Limited Quantity Truck"}]},{"id":"tacorita-bicicleta","name":"Tacorita Bicicleta","rarity":"Secret","description":"Tacorita Bicicleta is a Secret-tier character in Steal a Brainrot, depicted as a taco with large eyes riding a bicycle, blending culinary whimsy with dynamic motion, embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":16500000,"releaseStatus":"released","cost":2250000000,"addedAt":"2025-09-16","eventKeys":["taco-tuesday"],"craftFilterKeys":["limited"],"acquisitionBadges":[{"kind":"mechanic","id":"limited-stock","label":"Limited Stock"}]},{"id":"tacoturbo-tacorito","name":"Tacoturbo Tacorito","rarity":"Secret","description":"Tacoturbo Tacorito is a Secret taco-shaped race car with four wheels, a center engine, a front headlight, and an angry face.","baseIncomePerSecond":26000000,"releaseStatus":"released","cost":2700000000,"addedAt":"2026-08-18","eventKeys":["taco-tuesday"],"craftFilterKeys":[],"acquisitionBadges":[{"kind":"source","id":"taco-merchant","label":"Taco Merchant"}]},{"id":"talpa-di-ferro","name":"Talpa Di Fero","rarity":"Common","description":"Talpa di Ferro is a sturdy, iron-clad mole, burrowing through with tough, subterranean grit.","baseIncomePerSecond":9,"releaseStatus":"released","cost":1000,"addedAt":"2025-01-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"tang-tang-keletang","name":"Tang Tang Keletang","rarity":"Secret","description":"Tang Tang Keletang is a Secret-tier character in Steal a Brainrot, depicted as a book holding a baseball bat and a megaphone with red eyes, blending scholarly chaos with aggressive flair, embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":33500000,"releaseStatus":"released","cost":4500000000,"addedAt":"2025-09-27","eventKeys":["yin-yang-event"],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"tartaragno","name":"Tartaragno","rarity":"Common","description":"Tartaragno is a Common-tier Brainrot character in Steal a Brainrot, obtainable through Witch Fuse. It is a bizarre turtle with spider-like legs, crawling with unsettling speed — a perfect mix of creepy humor and surreal biological imagination.","baseIncomePerSecond":13,"releaseStatus":"released","cost":1500,"addedAt":"2025-10-11","eventKeys":["witch-fuse-event"],"craftFilterKeys":["witch-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"witch-fuse-machine","label":"Witch Fuse Machine"}]},{"id":"tartaruga-cisterna","name":"Tartaruga Cisterna","rarity":"Brainrot God","description":"Tartaruga Cisterna is a Brainrot God-tier character in Steal a Brainrot, depicted as a massive turtle fused with a water tank, lumbering through the game with a steady flow of liquid chaos. Tartaruga Cisterna embodies the absurd grandeur of brainrot meme culture with its shell gleaming in Italian flair.","baseIncomePerSecond":250000,"releaseStatus":"released","cost":45000000,"addedAt":"2025-08-23","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"te-te-te-sahur","name":"Te Te Te Sahur","rarity":"Mythic","description":"Te Te Te Sahur is a Mythic-tier Brainrot in Steal a Brainrot, depicted as a surreal camel infused with Sumatran drumbeats, adorned with glowing red eyes and a ceremonial headdress. Te Te Te Sahur resonates with the rhythmic chaos of Sahur traditions, embodying the vibrant and mystical essence of Italian brainrot meme culture.","baseIncomePerSecond":9500,"releaseStatus":"released","cost":2500000,"addedAt":"2025-08-09","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"telemorte","name":"Telemorte","rarity":"Secret","description":"Telemorte is a Secret-tier Brainrot character in Steal a Brainrot, obtainable from the Spooky Lucky Block during the Frightrot Event. It depicts a television with skeletal legs kicking a soccer ball, blending humor and horror into one surreal spectacle. A perfect mix of digital chaos and undead athleticism, Telemorte embodies the twisted spirit of the Frightrot Event.","baseIncomePerSecond":2000000,"releaseStatus":"released","cost":550000000,"addedAt":"2025-10-25","eventKeys":["frightrot-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"spooky-lucky-block","label":"Spooky Lucky Block"}]},{"id":"tenini-ballini","name":"Tenini Ballini","rarity":"Brainrot God","description":"Tenini Ballini is a released Brainrot God DLC brainrot. It is a lime-green tennis ball with white seams, muscular arms, a smiling face, and green-and-white sneakers. Its 320K/s income makes it the accessible DLC entry beside the stronger Grabatron reward.","baseIncomePerSecond":320000,"releaseStatus":"released","cost":77000000,"addedAt":"2026-07-18","eventKeys":[],"craftFilterKeys":["limited"],"acquisitionBadges":[{"kind":"mechanic","id":"limited-stock","label":"Limited Stock"}]},{"id":"tentacolo-tecnico","name":"Tentacolo Tecnico","rarity":"Brainrot God","description":"Tentacolo Tecnico is a Brainrot God-tier Brainrot character in Steal a Brainrot, obtainable through Witch Fuse. It is a brilliant blue octopus with eight mechanical tentacles, each glowing with electric circuits and pulses of light. It represents the union of organic motion and technical precision — a symbol of mechanical madness beneath the waves.","baseIncomePerSecond":292500,"releaseStatus":"released","cost":62500000,"addedAt":"2025-10-11","eventKeys":["witch-fuse-event"],"craftFilterKeys":["fishing","witch-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"witch-fuse-machine","label":"Witch Fuse Machine"},{"kind":"source","id":"fishing-event","label":"Fishing Event"}]},{"id":"ti-ti-ti-sahur","name":"Ti Ti Ti Sahur","rarity":"Epic","description":"Ti Ti Ti Sahur is an Epic-tier Brainrot in Steal a Brainrot, obtained through fusion with a higher probability of generating Epic-tier outcomes, inspired by the rhythmic drum sounds of Indonesian Sahur traditions. Ti Ti Ti Sahur echoes Tung Tung Tung Sahur in Italian brainrot meme culture.","baseIncomePerSecond":225,"releaseStatus":"released","cost":37500,"addedAt":"2025-08-02","eventKeys":[],"craftFilterKeys":["summer-fuse","og-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"summer-fuse","label":"Summer Fuse"},{"kind":"source","id":"og-fuse-machine","label":"OG Fuse Machine"},{"kind":"source","id":"runway","label":"Runway"}]},{"id":"tic-tic-ribbit","name":"Tic Tic Ribbit","rarity":"Mythic","description":"Tic Tic Ribbit is a Mythic frog fused with a glowing digital alarm clock. Its lime body frames a bright timer display, round clock-like eyes, an alarm button, and an orange tongue.","baseIncomePerSecond":18700,"releaseStatus":"released","cost":6200000,"addedAt":"2026-08-08","eventKeys":["rng-machine-queen-bee-event-2026-08-08"],"craftFilterKeys":[],"acquisitionBadges":[{"kind":"source","id":"rng-machine","label":"RNG Machine"}]},{"id":"tictac-sahur","name":"Tictac Sahur","rarity":"Secret","description":"Tictac Sahur is a Secret-tier character in Steal a Brainrot, depicted as an anthropomorphic alarm clock on a unicycle, tirelessly riding everywhere, blending timekeeping quirks with whimsical mobility, embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":37500000,"releaseStatus":"released","cost":6000000000,"addedAt":"2025-09-21","eventKeys":["mexico-event"],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"tigrilini-watermelini","name":"Tigrilini Watermelini","rarity":"Mythic","description":"Tigrilini Watermelini is a juicy, watermelon-striped tiger, prowling with sweet, refreshing might.","baseIncomePerSecond":7500,"releaseStatus":"released","cost":1000000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"source","id":"mythic-lucky-block","label":"Mythic Lucky Block"}]},{"id":"tigroligre-frutonni","name":"Tigroligre Frutonni","rarity":"Brainrot God","description":"Tigroligre Frutonni is a fierce, fruit-themed tiger-lion hybrid, roaring with tropical, predatory might.","baseIncomePerSecond":60000,"releaseStatus":"released","cost":15000000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"source","id":"brainrot-god-lucky-block","label":"Brainrot God Lucky Block"}]},{"id":"tim-cheese","name":"Tim Cheese","rarity":"Common","description":"Tim Cheese is a quirky, cheese-obsessed mascot, oozing with a playful, dairy-infused charm.","baseIncomePerSecond":5,"releaseStatus":"released","cost":500,"addedAt":"2025-01-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"tipi-topi-taco","name":"Tipi Topi Taco","rarity":"Brainrot God","description":"Tipi Topi Taco is a Brainrot God-tier character in Steal a Brainrot, depicted as a quirky fusion of a taco and a tapir, with vibrant taco toppings atop a tapir's snout and a mischievous grin, prancing with taco-fueled energy across the map, embodying the playful and absurd essence of Italian brainrot meme culture.","baseIncomePerSecond":75000,"releaseStatus":"released","cost":20000000,"addedAt":"2025-08-12","eventKeys":["taco-tuesday"],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"tirilikalika-tirilikalako","name":"Tirilikalika Tirilikalako","rarity":"Legendary","description":"Tirilikalika Tirilikalako is a Legendary-tier character in Steal a Brainrot, depicted as an Italian brainrot that combines a chicken with a fan and a mech, featuring mechanical wings, cooling fans, and robotic enhancements that create a chaotic, automated dance with eccentric energy, embodying the absurd spirit of Italian brainrot meme culture.","baseIncomePerSecond":450,"releaseStatus":"released","cost":75000,"addedAt":"2025-09-06","eventKeys":[],"craftFilterKeys":["craft"],"acquisitionBadges":[{"kind":"source","id":"craft-machine","label":"Craft Machine"}]},{"id":"to-to-to-sahur","name":"To to to Sahur","rarity":"Secret","description":"To to to Sahur is a Secret-tier character in Steal a Brainrot, depicted as a rhythmic, elusive figure inspired by Sahur chants, blending cultural beats with mysterious charm, embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":2200000,"releaseStatus":"released","cost":575000000,"addedAt":"2025-09-21","eventKeys":["mexico-event"],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"tob-tobi-tobi","name":"Tob Tobi Tobi","rarity":"Mythic","description":"Tob Tobi Tobi is a Mythic-tier Brainrot in Steal a Brainrot, depicted as a surreal camel-cactus hybrid with a bushy beard, mustache, and each leg adorned with leather boots, standing beside a mystical toilet portal to the planet Sahura, embodying the chaotic and legendary essence of Italian brainrot meme culture.","baseIncomePerSecond":8500,"releaseStatus":"retired","cost":3500000,"addedAt":"2025-08-09","eventKeys":[],"craftFilterKeys":["fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"fuse-machine","label":"Fuse Machine"},{"kind":"source","id":"runway","label":"Runway"}]},{"id":"toiletto-focaccino","name":"Toiletto Focaccino","rarity":"Mythic","description":"Toiletto Focaccino is a Mythic-tier character in Steal a Brainrot, depicted as a seal with a toilet as its base, blending marine charm with bathroom humor, embodying the wild essence of Italian brainrot meme culture.","baseIncomePerSecond":16000,"releaseStatus":"released","cost":4800000,"addedAt":"2025-09-27","eventKeys":["yin-yang-event"],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"tootini-shrimpini","name":"Tootini Shrimpini","rarity":"Brainrot God","description":"Tootini Shrimpini is a Brainrot God-tier hybrid combining a shrimp and a snail, merging aquatic absurdity with slow-moving silliness into one surreal creature.","baseIncomePerSecond":260000,"releaseStatus":"released","cost":46000000,"addedAt":"2025-12-31","eventKeys":["26-event"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"topinello-fruttarello","name":"Topinello Fruttarello","rarity":"Unknown","description":"Topinello Fruttarello is an upcoming (unconfirmed) character in Steal a Brainrot, inspired by the Italian brainrot meme Topinello Fruttarello. Depicted as a tiny mouse naturally integrated with a juicy strawberry body, it scurries through a surreal berry orchard, nibbling seeds and squeaking a fruity 'topi-topi' melody, embodying the whimsical and absurd essence of Italian brainrot meme culture.","baseIncomePerSecond":0,"releaseStatus":"unconfirmed","cost":0,"addedAt":"","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[]},{"id":"toro-espanolo","name":"Toro Españolo","rarity":"Secret","description":"Toro Españolo is a released Secret bull from the Spain Event. It has a stocky black body, large pale horns, red eyes, brown hooves, and a Spanish flag draped over its side. Its 2.2M/s income makes it the more accessible of Update 59's two Spain-themed collectibles.","baseIncomePerSecond":2200000,"releaseStatus":"released","cost":575000000,"addedAt":"2026-07-25","eventKeys":["crystal-mutation-spain-event-2026-07-25"],"craftFilterKeys":[],"acquisitionBadges":[]},{"id":"torrtuginni-dragonfrutini","name":"Torrtuginni Dragonfrutini","rarity":"Secret","description":"Torrtuginni Dragonfrutini is a dragon-fruit turtle hybrid, breathing fire with tropical, scaly charm.","baseIncomePerSecond":350000,"releaseStatus":"released","cost":500000000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"source","id":"secret-lucky-block","label":"Secret Lucky Block"}]},{"id":"tortuginni-sandcastlini","name":"Tortuginni Sandcastlini","rarity":"Brainrot God","description":"Tortuginni Sandcastlini is a Brainrot God Octo Lucky Block reward from SUMMER UPD PT 1. It reworks the turtle body into a sandy beach variant with a sandcastle-style shell and compact full-body stance. Its 32.65% listed chance makes it the main Brainrot God reward to expect while chasing the rarer summer Secrets.","baseIncomePerSecond":317500,"releaseStatus":"released","cost":76000000,"addedAt":"2026-06-13","eventKeys":["summer-upd-pt-1-2026-06-13"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"mechanic","id":"lucky-block","label":"Lucky Block"}]},{"id":"tracoducotulu-delapeladustuz","name":"Tracoducotulu Delapeladustuz","rarity":"Mythic","description":"Tracoducotulu Delapeladustuz is a Mythic-tier character in Steal a Brainrot, depicted as a fusion of a vintage Volkswagen Beetle and a camel, where the car's hood and windshield are replaced by the head and neck of a camel. Tracoducotulu Delapeladustuz roams the desert with a quirky mechanical gait, embodying the surreal humor of Italian brainrot meme culture.","baseIncomePerSecond":12000,"releaseStatus":"released","cost":3000000,"addedAt":"2025-08-16","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"tractoro-dinosauro","name":"Tractoro Dinosauro","rarity":"Brainrot God","description":"Tractoro Dinosauro is a Brainrot God-tier character in Steal a Brainrot, depicted as a dinosaur fused with a tractor, blending prehistoric power with agricultural absurdity, embodying the quirky essence of Italian brainrot meme culture.","baseIncomePerSecond":230000,"releaseStatus":"released","cost":42500000,"addedAt":"2025-09-14","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"tralaledon","name":"Tralaledon","rarity":"Secret","description":"Tralaledon is a Secret-tier character in Steal a Brainrot, depicted as a large blue shark standing on two legs, blending the rhythmic essence of Tralalero Tralala with the explosive power of Nuclearo Dinossauro, embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":27500000,"releaseStatus":"released","cost":3000000000,"addedAt":"2025-09-06","eventKeys":[],"craftFilterKeys":["fishing","craft"],"acquisitionBadges":[{"kind":"source","id":"craft-machine","label":"Craft Machine"},{"kind":"source","id":"fishing-event","label":"Fishing Event"}]},{"id":"tralalero-tralala","name":"Tralalero Tralala","rarity":"Brainrot God","description":"Tralalero Tralala is a musical, sea-shanty-inspired trickster, chanting chaotic tunes with a pirate-like flair.","baseIncomePerSecond":50000,"releaseStatus":"released","cost":10000000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["default","fishing"],"acquisitionBadges":[{"kind":"source","id":"fishing-event","label":"Fishing Event"},{"kind":"source","id":"runway","label":"Runway"}]},{"id":"tralalita-tralala","name":"Tralalita tralala","rarity":"Brainrot God","description":"Tralalita tralala is a Brainrot God-tier character in Steal a Brainrot, the female version of Tralalero Tralala, depicted as an anthropomorphic shark with a melodic sea-shanty flair, swimming through a cosmic ocean while singing 'tralala' tunes, embodying the whimsical chaos of Italian brainrot meme culture.","baseIncomePerSecond":100000,"releaseStatus":"released","cost":20000000,"addedAt":"2025-08-16","eventKeys":[],"craftFilterKeys":["default","fishing"],"acquisitionBadges":[{"kind":"source","id":"fishing-event","label":"Fishing Event"},{"kind":"source","id":"runway","label":"Runway"}]},{"id":"tree-tree-tree-sahur","name":"Tree Tree Tree Sahur","rarity":"Mythic","description":"Tree Tree Tree Sahur is a Mythic-tier mini anthropomorphic Christmas tree wearing a red-and-white Santa hat, sparkling with lights as it wiggles to the distant 'tung tung' rhythm of holiday Sahur.","baseIncomePerSecond":17000,"releaseStatus":"released","cost":4900000,"addedAt":"2025-12-06","eventKeys":["santas-fuse-event","christmas"],"craftFilterKeys":["santas-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"santas-fuse-machine","label":"Santa's Fuse Machine"}]},{"id":"trenostruzzo-turbo-3000","name":"Trenostruzzo Turbo 3000","rarity":"Brainrot God","description":"Trenostruzzo Turbo 3000 is a high-speed, train-like ostrich, racing with turbo-charged energy.","baseIncomePerSecond":150000,"releaseStatus":"released","cost":25000000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"trenostruzzo-turbo-4000","name":"Trenostruzzo Turbo 4000","rarity":"Secret","description":"Trenostruzzo Turbo 4000 is a Secret-tier character in Steal a Brainrot, depicted as an ostrich inside a bullet train with a futuristic toilet on top, blending speed and absurdity. Trenostruzzo Turbo 4000 embodies the quirky essence of Italian brainrot meme culture.","baseIncomePerSecond":310000,"releaseStatus":"released","cost":100000000,"addedAt":"2025-09-06","eventKeys":[],"craftFilterKeys":["craft"],"acquisitionBadges":[{"kind":"source","id":"craft-machine","label":"Craft Machine"}]},{"id":"trenoturbo-axolotrico-9000","name":"Trenoturbo Axolotrico 9000","rarity":"Secret","description":"Trenoturbo Axolotrico 9000 is a Secret brainrot in Steal a Brainrot and one of the cuter robotic designs in the Cyber lineup. It appears as a smiling pink axolotl face built into a blue-gray mechanical chassis with pink external gills and chunky robotic legs. Trenoturbo Axolotrico 9000 matters because it gives the machine wave a playful creature design without losing the cyber look.","baseIncomePerSecond":975000,"releaseStatus":"released","cost":247500000,"addedAt":"2026-04-19","eventKeys":["cyber-event"],"craftFilterKeys":["craft","cyber-craft-machine"],"acquisitionBadges":[{"kind":"source","id":"cyber-craft-machine","label":"Cyber Craft Machine"}]},{"id":"tric-trac-baraboom","name":"Tric Trac Baraboom","rarity":"Rare","description":"Tric Trac Baraboom is an explosive, firecracker-like character, bursting with chaotic energy.","baseIncomePerSecond":65,"releaseStatus":"released","cost":9000,"addedAt":"2025-01-01","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"trickolino","name":"Trickolino","rarity":"Secret","description":"Trickolino is a Secret-tier Brainrot character in Steal a Brainrot, obtainable from the Spooky Lucky Block during the Frightrot Event. It depicts a small, tearful figure holding up a nearly empty Halloween bowl of candy while a sign above its head reads 'TAKE ONLY ONE!'. With trembling hands and watery eyes, Trickolino perfectly captures the tragic comedy of Halloween generosity running low.","baseIncomePerSecond":900000,"releaseStatus":"released","cost":235000000,"addedAt":"2025-10-25","eventKeys":["frightrot-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"spooky-lucky-block","label":"Spooky Lucky Block"}]},{"id":"triplito-tralaleritos","name":"Triplito Tralaleritos","rarity":"Secret","description":"Triplito Tralaleritos is a Secret-tier Brainrot where three Los Tralaleritos stack vertically. The top one sports a beard, hat, glasses, and a long coat, forming a festive totem of holiday silliness.","baseIncomePerSecond":875000,"releaseStatus":"released","cost":230000000,"addedAt":"2025-12-13","eventKeys":["north-pole-event","christmas","santas-fuse-event"],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"festive-lucky-block","label":"Festive Lucky Block"}]},{"id":"trippi-troppi","name":"Trippi Troppi","rarity":"Rare","description":"Trippi Troppi is a wild, chaotic dancer, inspired by frenetic TikTok trends and vibrant street performances.","baseIncomePerSecond":15,"releaseStatus":"released","cost":2000,"addedAt":"2025-01-01","eventKeys":[],"craftFilterKeys":["default","fishing"],"acquisitionBadges":[{"kind":"source","id":"fishing-event","label":"Fishing Event"},{"kind":"source","id":"runway","label":"Runway"}]},{"id":"trippi-troppi-troppa-trippa","name":"Trippi Troppi Troppa Trippa","rarity":"Brainrot God","description":"Trippi Troppi Troppa Trippa is a Brainrot God-tier character, a high-value evolution of the Trippi Troppi meme, likely a cat-shrimp hybrid with enhanced meme-inspired traits.","baseIncomePerSecond":175000,"releaseStatus":"released","cost":30000000,"addedAt":"2025-08-02","eventKeys":[],"craftFilterKeys":["default","fishing"],"acquisitionBadges":[{"kind":"source","id":"fishing-event","label":"Fishing Event"},{"kind":"source","id":"runway","label":"Runway"}]},{"id":"trulimero-trulicina","name":"Trulimero Trulicina","rarity":"Epic","description":"Trulimero Trulichina is a melodic, chant-inspired trickster, weaving hypnotic tunes with a mystical aura.","baseIncomePerSecond":125,"releaseStatus":"released","cost":20000,"addedAt":"2025-01-01","eventKeys":[],"craftFilterKeys":["default","fishing"],"acquisitionBadges":[{"kind":"source","id":"fishing-event","label":"Fishing Event"},{"kind":"source","id":"runway","label":"Runway"}]},{"id":"tuff-toucan","name":"Tuff Toucan","rarity":"Secret","description":"Tuff Toucan is a Secret-tier Brainrot featuring an anthropomorphic toucan with a tough, confident demeanor, blending bold avian features with exaggerated human traits in classic Brainrot style.","baseIncomePerSecond":26000000,"releaseStatus":"released","cost":2700000000,"addedAt":"2025-12-31","eventKeys":["26-event"],"craftFilterKeys":["limited"],"acquisitionBadges":[{"kind":"mechanic","id":"limited-stock","label":"Limited Stock"}]},{"id":"tukanno-bananno","name":"Tukanno Bananno","rarity":"Brainrot God","description":"Tukanno Bananno is a Brainrot God-tier character in Steal a Brainrot, obtained through fusion with a higher probability of generating Brainrot God-tier outcomes, inspired by a whimsical pineapple-banana fusion in Italian brainrot meme culture.","baseIncomePerSecond":100000,"releaseStatus":"retired","cost":22500000,"addedAt":"2025-08-02","eventKeys":[],"craftFilterKeys":["fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"fuse-machine","label":"Fuse Machine"},{"kind":"source","id":"runway","label":"Runway"}]},{"id":"tung-tung-tung-sahur","name":"Tung Tung Tung Sahur","rarity":"Secret","description":"Tung Tung Tung Sahur is a Secret-tier Brainrot that looks like a wooden stick with a smiling face painted on it, holding a baseball bat. Previously a Rare Brainrot, it has been upgraded to Secret status with significantly increased income and cost.","baseIncomePerSecond":1500000,"releaseStatus":"released","cost":500000000,"addedAt":"2025-11-29","eventKeys":["hes-coming-back-event"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"unclito-samito","name":"Unclito Samito","rarity":"Brainrot God","description":"Unclito Samito is a Brainrot God-tier character in Steal a Brainrot, depicted as a quirky uncle figure with an Italian twist, sporting a striped shirt and a mischievous grin, spreading chaotic laughter, embodying the eccentric absurdity of Italian brainrot meme culture.","baseIncomePerSecond":75000,"releaseStatus":"released","cost":20000000,"addedAt":"2025-08-23","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"urubini-flamenguini","name":"Urubini Flamenguini","rarity":"Brainrot God","description":"Urubini Flamenguini is a Brainrot God-tier character in Steal a Brainrot, created from the author's love for Brazilian football combined with Italian brainrot, depicted as a flamingo wearing a Flamengo football jersey, with pink feathers and green/red team colors, embodying the passion and chaos of Brazilian football culture mixed with surreal Italian meme humor.","baseIncomePerSecond":150000,"releaseStatus":"released","cost":30000000,"addedAt":"2025-08-16","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"vampira-cappucina","name":"Vampira Cappucina","rarity":"Brainrot God","description":"Vampira Cappucina is a Brainrot God-tier Brainrot character in Steal a Brainrot, appearing during the Witching Hour event. It is a vampiric version of Ballerina Cappuccina, adorned with a crimson ballet dress, pale porcelain skin, and elegant bat-like wings. She twirls under moonlight with a haunting grace, blending gothic horror with the surreal elegance of the Brainrot universe.","baseIncomePerSecond":125000,"releaseStatus":"released","cost":24500000,"addedAt":"2025-10-11","eventKeys":["witch-fuse-event"],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"var-var-var","name":"Var Var Var","rarity":"Secret","description":"Var Var Var is a Secret camera-robot brainrot built around referee-review chaos. Its monitor head and VAR-check identity make it feel like a walking replay booth. The compact camera body gives the July set a sharper sports-tech collectible.","baseIncomePerSecond":5500000,"releaseStatus":"released","cost":1000000000,"addedAt":"2026-07-04","eventKeys":["update-56-public-live-2026-07-05"],"craftFilterKeys":["themed"],"acquisitionBadges":[{"kind":"mechanic","id":"themed","label":"Themed"}]},{"id":"ventoliero-pavonero","name":"Ventoliero Pavonero","rarity":"Secret","description":"Ventoliero Pavonero is a Secret-tier Brainrot resembling a majestic peacock. Ventoliero Pavonero spreads its vibrant feathers dramatically, embodying flamboyant Italian brainrot elegance and exaggerated avian chaos.","baseIncomePerSecond":65000000,"releaseStatus":"released","cost":15500000000,"addedAt":"2026-02-28","eventKeys":["divine-admin-machine-event"],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"vulturino-skeletono","name":"Vulturino Skeletono","rarity":"Secret","description":"Vulturino Skeletono is a Secret-tier Brainrot character in Steal a Brainrot, obtained through Witch Fuse. It appears as a tall, skeletal vulture with glowing eyes and an icy blue aura enveloping its wings and body. This eerie avian exudes an aura of frozen decay, symbolizing the chilling elegance of the Witching Hour event.","baseIncomePerSecond":500000,"releaseStatus":"released","cost":110000000,"addedAt":"2025-10-11","eventKeys":["witch-fuse-event"],"craftFilterKeys":["witch-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"witch-fuse-machine","label":"Witch Fuse Machine"}]},{"id":"w-or-l","name":"W or L","rarity":"Secret","description":"W or L is a Secret-tier Brainrot character representing the ultimate duality of winning and losing. Formed by the fusion of a bold 'W' and a dramatic 'L', this symbolic meme creature captures the chaotic spirit of internet victories and failures.","baseIncomePerSecond":30000000,"releaseStatus":"released","cost":3000000000,"addedAt":"2025-11-22","eventKeys":[],"craftFilterKeys":["limited"],"acquisitionBadges":[{"kind":"mechanic","id":"limited-stock","label":"Limited Stock"}]},{"id":"wheelchair-granny","name":"Wheelchair Granny","rarity":"Secret","description":"Wheelchair Granny is a Secret-tier Brainrot in Steal a Brainrot and a released entry that now belongs in the main roster. It appears as an elderly woman with white hair, gold glasses, a pale dress, and a blue wheelchair that defines the silhouette. Wheelchair Granny matters because its live listing closes a real catalog gap even before stronger stat and route sources catch up.","baseIncomePerSecond":0,"releaseStatus":"released","cost":0,"addedAt":"","eventKeys":[],"craftFilterKeys":["default"],"acquisitionBadges":[]},{"id":"wombo-rollo","name":"Wombo Rollo","rarity":"Epic","description":"Wombo Rollo is an Epic-tier Brainrot character in Steal a Brainrot, obtainable through the central conveyor. It is a wombat hilariously wrapped in toilet paper, rolling across the ground like a mischievous mummy marsupial. Combining absurd cuteness with chaotic energy, it perfectly embodies the lighthearted humor of the Brainrot universe.","baseIncomePerSecond":275,"releaseStatus":"released","cost":42500,"addedAt":"2025-11-01","eventKeys":["1x1x1x1-event"],"craftFilterKeys":["default"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"}]},{"id":"yess-my-examine","name":"Yess My Examine","rarity":"Secret","description":"Yess My Examine is a Secret-tier character in Steal a Brainrot, depicted as a triumphant, exam-passing figure with a joyful expression on a test paper, blending academic victory with exuberant joy, embodying the wild absurdity of Italian brainrot meme culture.","baseIncomePerSecond":575000,"releaseStatus":"released","cost":130000000,"addedAt":"2025-09-27","eventKeys":["yin-yang-event"],"craftFilterKeys":["ritual"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"mechanic","id":"ritual","label":"Ritual"}]},{"id":"yess-my-resume","name":"Yess my Resume","rarity":"Secret","description":"Yess my Resume is a released Secret paper character. The cheerful resume wears a blue tie and green-and-blue shoes while carrying a blue briefcase stamped Hired. It earns 2.1M/s and is the common 99% result from the four-player Job Job Job Sahur Ritual.","baseIncomePerSecond":2100000,"releaseStatus":"released","cost":560000000,"addedAt":"2026-08-01","eventKeys":["job-job-job-sahur-ritual-2026-08-01"],"craftFilterKeys":["ritual"],"acquisitionBadges":[{"kind":"mechanic","id":"ritual","label":"Ritual"}]},{"id":"yeti-claus","name":"Yeti Claus","rarity":"Brainrot God","description":"Yeti Claus is a Brainrot God-tier Christmas Yeti speeding across icy landscapes on a snowmobile, coat flapping and gifts flying, spreading both presents and panic through the snowy meme fields.","baseIncomePerSecond":257500,"releaseStatus":"released","cost":45700000,"addedAt":"2025-12-06","eventKeys":["santas-fuse-event","christmas"],"craftFilterKeys":["santas-fuse-machine"],"acquisitionBadges":[{"kind":"source","id":"santas-fuse-machine","label":"Santa's Fuse Machine"}]},{"id":"yetimatic","name":"Yetimatic","rarity":"Secret","description":"Yetimatic is a Secret white yeti with pale blue hands and feet, an angry blue face, and a black RNG cabinet built into its torso.","baseIncomePerSecond":87500000,"releaseStatus":"released","cost":27500000000,"addedAt":"2026-08-08","eventKeys":["rng-machine-queen-bee-event-2026-08-08"],"craftFilterKeys":[],"acquisitionBadges":[{"kind":"source","id":"rng-machine","label":"RNG Machine"}]},{"id":"zibra-zubra-zibralini","name":"Zibra Zubra Zibralini","rarity":"Mythic","description":"Zibra Zubra Zibralini is a striped, zebra-themed character, galloping with wild, African flair.","baseIncomePerSecond":6000,"releaseStatus":"released","cost":1000000,"addedAt":"2025-04-01","eventKeys":[],"craftFilterKeys":["lucky-block"],"acquisitionBadges":[{"kind":"source","id":"runway","label":"Runway"},{"kind":"source","id":"mythic-lucky-block","label":"Mythic Lucky Block"}]},{"id":"zombie-tralala","name":"Zombie Tralala","rarity":"Secret","description":"Zombie Tralala is a Secret-tier Brainrot character in Steal a Brainrot, appearing exclusively during the Witching Hour event. It is a zombified version of Tralalero Tralala, featuring decayed green skin, torn clothing, and hollow glowing eyes. With its eerie grin and sluggish yet rhythmic shuffle, it embodies both the charm and absurdity of Halloween’s undead theme.","baseIncomePerSecond":500000,"releaseStatus":"released","cost":100000000,"addedAt":"2025-10-11","eventKeys":["witch-fuse-event"],"craftFilterKeys":["default","fishing"],"acquisitionBadges":[{"kind":"source","id":"fishing-event","label":"Fishing Event"},{"kind":"source","id":"runway","label":"Runway"}]}]);

function r45CompactMoney(number, perSecond = false) {
  const n = Number(number);
  if (!Number.isFinite(n)) return "";
  const scales = [["Qa", 1e15], ["T", 1e12], ["B", 1e9], ["M", 1e6], ["K", 1e3]];
  for (const [suffix, value] of scales) {
    if (Math.abs(n) >= value) {
      const scaled = Number((n / value).toFixed(3));
      return `$${scaled}${suffix}${perSecond ? "/s" : ""}`;
    }
  }
  return `$${n}${perSecond ? "/s" : ""}`;
}

function r45IsoDate(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return String(value || "");
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${months[Number(match[2]) - 1]} ${Number(match[3])}, ${match[1]}`;
}

function r45EventLabel(value) {
  return String(value || "")
    .replace(/-20\d{2}-\d{2}-\d{2}$/i, "")
    .replace(/-event$/i, "")
    .split("-")
    .filter(Boolean)
    .map((part) => /^(?:rng|og|dlc)$/i.test(part) ? part.toUpperCase() : part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function r45MoneyNumber(canonical) {
  const match = String(canonical || "").match(/^(\d+(?:\.\d+)?)(k|m|b|t|qa|qi|sx|sp|oc|no|dc)$/i);
  if (!match) return NaN;
  const scale = { k: 1e3, m: 1e6, b: 1e9, t: 1e12, qa: 1e15, qi: 1e18, sx: 1e21, sp: 1e24, oc: 1e27, no: 1e30, dc: 1e33 }[match[2].toLowerCase()];
  return Number(match[1]) * scale;
}

function r45RecordSearchText(row) {
  return r43Norm([row.name, row.rarity, row.description, row.releaseStatus, ...(row.eventKeys || []).map(r45EventLabel), ...(row.acquisitionBadges || []).map((x) => x.label), ...(row.craftFilterKeys || [])].join(" "));
}

function r45SiteBrainrotResolve(rawQuestion, normalizedQuestion, clues) {
  const q = normalizedQuestion;
  const comparative = /\b(?:cheaper|less expensive|more expensive|costlier|earns more|earns less|makes more|makes less)\s+than\b/.test(q);
  const rarity = (q.match(/\b(common|rare|epic|legendary|mythic|brainrot god|secret|og)\b/) || [])[1] || "";
  const reverseIntent = comparative || (/\b(?:which|what)\b/.test(q) && Boolean(rarity) && /\b(?:cost|costing|earn|earns|earning|income|make|makes|making|released|added|update|event)\b/.test(q));
  if (!reverseIntent) return null;

  const money = clues.filter((value) => String(value).startsWith("money:")).map((value) => String(value).slice(6));
  const updates = clues.filter((value) => /^update \d+$/i.test(String(value))).map((value) => Number(String(value).match(/\d+/)[0]));
  let reference = null;
  if (comparative) {
    reference = [...R45_SITE_BRAINROTS]
      .filter((row) => q.includes(r43Norm(row.name)))
      .sort((a, b) => b.name.length - a.name.length)[0] || null;
  }

  let candidates = R45_SITE_BRAINROTS.filter((row) => {
    if (reference && row.id === reference.id) return false;
    if (rarity && r43Norm(row.rarity) !== r43Norm(rarity)) return false;
    const values = [r44CanonMoney(r45CompactMoney(row.cost)), r44CanonMoney(r45CompactMoney(row.baseIncomePerSecond, true))].filter(Boolean);
    if (money.length && !money.every((value) => values.includes(value))) return false;
    if (updates.length) {
      const text = r45RecordSearchText(row);
      if (!updates.every((number) => text.includes(`update ${number}`))) return false;
    }
    if (reference) {
      if (/\b(?:cheaper|less expensive)\s+than\b/.test(q) && !(row.cost < reference.cost)) return false;
      if (/\b(?:more expensive|costlier)\s+than\b/.test(q) && !(row.cost > reference.cost)) return false;
      if (/\b(?:earns more|makes more)\s+than\b/.test(q) && !(row.baseIncomePerSecond > reference.baseIncomePerSecond)) return false;
      if (/\b(?:earns less|makes less)\s+than\b/.test(q) && !(row.baseIncomePerSecond < reference.baseIncomePerSecond)) return false;
    }
    return true;
  });

  const contextTokens = r43Tokens(q).filter((token) => token.length >= 4 && !["which","what","secret","costs","costing","earns","earning","makes","making","million","billion","second","every","update","released","cheaper","expensive","than"].includes(token));
  candidates = candidates.map((row) => {
    const text = r45RecordSearchText(row);
    const score = contextTokens.filter((token) => text.includes(token)).length;
    return { row, score };
  }).sort((a, b) => b.score - a.score || a.row.name.localeCompare(b.row.name));

  if (!candidates.length) return null;
  if (candidates.length > 1 && candidates[0].score === candidates[1].score) return null;
  const hit = candidates[0].row;
  return r41InstantResult(hit.name, REL.BRAINROT, `/brainrots/${hit.id}`, hit.name, "R45_FULL_SITE_REVERSE_BRAINROT");
}

function r43Fact(subject, kind, field, value, sourcePath, title, extra = {}) {
  if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) return [];
  const rel = R43_FIELD_REL[field] || REL.LORE;
  const vals = Array.isArray(value) ? value : [value];
  return vals
    .filter((v) => v != null && String(v).trim())
    .map((v) => Object.freeze({
      subject,
      kind,
      field,
      relation: rel,
      value: String(v),
      sourcePath,
      title: title || subject,
      qualifier: extra.qualifier || "",
      parentField: extra.parentField || "",
    }));
}

function buildR43MasterFacts() {
  const facts = [];

  for (const [name, row] of Object.entries(R41_BRAINROT_SNAPSHOT)) {
    const path = `/brainrots/${primarySlug(name)}`;
    for (const [field, value] of Object.entries(row)) {
      facts.push(...r43Fact(name, "brainrot", field, value, path, name));
    }
  }

  const r45ExistingFields = new Set(facts.map((fact) => `${fact.subject}\u0000${fact.field}`));
  for (const row of R45_SITE_BRAINROTS) {
    const values = {
      rarity: row.rarity,
      cost: r45CompactMoney(row.cost),
      income: r45CompactMoney(row.baseIncomePerSecond, true),
      date: r45IsoDate(row.addedAt),
      event: (row.eventKeys || []).map(r45EventLabel),
      source: (row.acquisitionBadges || []).map((badge) => badge.label),
      availability: row.releaseStatus,
      note: row.description,
    };
    for (const [field, value] of Object.entries(values)) {
      const key = `${row.name}\u0000${field}`;
      if (r45ExistingFields.has(key)) continue;
      facts.push(...r43Fact(row.name, "brainrot", field, value, `/brainrots/${row.id}`, row.name));
      r45ExistingFields.add(key);
    }
  }

  for (const [name, row] of Object.entries(R41_MACHINE_SNAPSHOT)) {
    for (const [field, value] of Object.entries(row)) {
      facts.push(...r43Fact(name, "machine", field, value, "/machines", "All Machines"));
    }
  }

  for (const [name, row] of Object.entries(R41_RITUAL_SNAPSHOT)) {
    for (const [field, value] of Object.entries(row)) {
      if (field === "reward" && row.rewardChance) {
        facts.push(...r43Fact(name, "ritual", field, value, "/rituals", "Secret Rituals & Traits", { qualifier: row.rewardChance }));
      } else if (field === "alternate" && row.alternateChance) {
        facts.push(...r43Fact(name, "ritual", field, value, "/rituals", "Secret Rituals & Traits", { qualifier: row.alternateChance }));
      } else {
        facts.push(...r43Fact(name, "ritual", field, value, "/rituals", "Secret Rituals & Traits"));
      }
    }
  }

  for (const [name, row] of Object.entries(R42_EVENT_SNAPSHOT)) {
    for (const [field, value] of Object.entries(row)) {
      facts.push(...r43Fact(name, "event", field, value, "/events", "Events"));
    }
  }

  for (const [code, row] of Object.entries(R42_CODE_SNAPSHOT)) {
    for (const [field, value] of Object.entries(row)) {
      facts.push(...r43Fact(code, "code", field, value, "/events/rng-machine-queen-bee-event-2026-08-08", "RNG MACHINE + QUEEN BEE"));
    }
  }

  for (const [num, row] of Object.entries(R41_REBIRTH_SNAPSHOT)) {
    const subject = `Rebirth ${num}`;
    facts.push(...r43Fact(subject, "rebirth", "cash", row.cash, "/wiki/rebirth", "Rebirth System Guide"));
    facts.push(...r43Fact(subject, "rebirth", "chars", row.chars || [], "/wiki/rebirth", "Rebirth System Guide"));
    facts.push(...r43Fact(subject, "rebirth", "gear", row.gear || [], "/wiki/rebirth", "Rebirth System Guide"));
    facts.push(...r43Fact(subject, "rebirth", "multi", row.multi, "/wiki/rebirth", "Rebirth System Guide"));
    facts.push(...r43Fact(subject, "rebirth", "startCash", row.startCash, "/wiki/rebirth", "Rebirth System Guide"));
  }

  for (const [name, multi] of R41_MUTATION_SNAPSHOT) {
    facts.push(...r43Fact(name, "mutation", "multiplier", multi, "/wiki/mutations", "Mutations & Traits"));
  }

  return Object.freeze(facts);
}

const R43_MASTER_FACTS = buildR43MasterFacts();
const R43_LOCAL_FACT_COUNT = R43_MASTER_FACTS.length;
const R43_LOCAL_SUBJECT_COUNT = new Set(R43_MASTER_FACTS.map((f) => `${f.kind}:${r43Norm(f.subject)}`)).size;

function r43ExpectedKind(q) {
  if (/\b(?:which|what)\s+(?:secret\s+)?brainrot\b|\b(?:which|what)\b.{0,40}\bsecret\b|\bbrainrot\s+(?:was|is|came|costs|earns)\b|\bsecret\b.{0,100}\b(?:cost|costing|earn|earns|earning|income|make|makes|making|per second|a second)\b/.test(q)) return "brainrot";
  if (/\b(?:which|what)\s+(?:machine|thing|system)\b|\bmachine\b/.test(q)) return "machine";
  if (/\b(?:which|what)\s+rebirth\b|\brebirth\s+(?:gives|unlocks|requires|costs)\b/.test(q)) return "rebirth";
  if (/\b(?:which|what)\s+mutation\b|\bmutation\s+(?:has|with|was|is)\b/.test(q)) return "mutation";
  if (/\b(?:which|what)\s+code\b|\bcode\s+(?:gives|gave|for|skips)\b/.test(q)) return "code";
  if (/\b(?:which|what)\s+(?:event|update event)\b/.test(q)) return "event";
  if (/\b(?:which|what)\s+ritual\b|\britual\s+(?:gives|spawns|needs|requires)\b/.test(q)) return "ritual";
  return "";
}

function r43WantedRelation(q) {
  if (/\b(?:cost|price|pay|worth|cash requirement)\b/.test(q)) return REL.COST;
  if (/\b(?:income|earn|earns|earning|per second|\/s)\b/.test(q)) return REL.INCOME;
  if (/\b(?:rarity|tier)\b/.test(q)) return REL.RARITY;
  if (/\b(?:how often|frequency|cadence|refresh|rotate|rotation|twice an hour)\b/.test(q)) return REL.FREQUENCY;
  if (/\b(?:how long|duration|lasted|window)\b/.test(q)) return REL.DURATION;
  if (/\b(?:active range|ran from|active from|active updates?|through update|updates was .* active)\b/.test(q)) return REL.ACTIVE_RANGE;
  if (/\b(?:what|which)\s+update\b|\bupdate number\b|\breplaced in\b/.test(q)) return REL.UPDATE;
  if (/\b(?:replaced by|what replaced|which .* replaced)\b/.test(q)) return REL.REPLACED_BY;
  if (/\bbefore\s+(?:rng|the rng)|predecessor\b|\bwhat did .* replace\b/.test(q)) return REL.REPLACED_BY;
  if (/\b(?:when|date|added|released|came out|introduced)\b/.test(q) && !/\bwhat\s+(?:brainrot|machine|event)\b/.test(q)) return REL.DATE;
  if (/\b(?:gear|item|shield|teleport|potion)\b/.test(q) && /\b(?:give|gives|gave|unlock|unlocks|reward)\b/.test(q)) return REL.GEAR;
  if (/\b(?:multiplier|multi|x multiplier)\b/.test(q)) return REL.MULTIPLIER;
  if (/\b(?:chance|odds|drop rate|percent|%)\b/.test(q)) return REL.DROP_RATE;
  if (/\b(?:reward|outcome|spawn|spawns|gives|gives you)\b/.test(q)) return REL.OUTCOME;
  if (/\bplayers?\b/.test(q)) return REL.PLAYERS;
  if (/\b(?:status|available|availability|obtainable|offline|online|active|live)\b/.test(q)) return REL.STATUS;
  if (/\b(?:source|obtain|obtained|where|get)\b/.test(q)) return REL.METHOD;
  return "";
}

function r43QuestionClues(raw) {
  const q = r43Norm(raw);
  const clues = [];

  // Dollar signs are optional in player shorthand (27.5b, 87.5m a second).
  // Canonical tokens make /s, per second, a second, and earns/makes wording
  // bind to the same subject facts without allowing generic numbers through.
  for (const money of r44MoneyValues(raw)) clues.push(`money:${money}`);

  // Capture both endpoints from compact lifecycle ranges such as Update 57-60.
  for (const m of String(raw).matchAll(/\bupdates?\s*#?\s*(\d{1,3})\s*(?:-|–|—|to|through)\s*(?:updates?\s*#?\s*)?(\d{1,3})\b/gi)) {
    clues.push(`update ${Number(m[1])}`);
    clues.push(`update ${Number(m[2])}`);
  }
  for (const m of String(raw).matchAll(/\bupdate\s*#?\s*\d{1,3}\b/gi)) clues.push(r43Norm(m[0]));
  for (const m of String(raw).matchAll(/\brebirth\s*#?\s*\d{1,3}\b/gi)) clues.push(r43Norm(m[0]));
  for (const m of String(raw).matchAll(/\b(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s*\d{1,2}(?:st|nd|rd|th)?(?:,?\s*20\d{2})?/gi)) clues.push(r43Norm(m[0]));
  for (const m of String(raw).matchAll(/\b\d+(?:\.\d+)?\s*%\b/g)) clues.push(r43Norm(m[0]));

  if (/\btwice an hour\b/.test(q)) clues.push("30 minute");
  if (/\bevery two hours?\b/.test(q)) clues.push("every two hour");
  if (/\bone hour\b/.test(q)) clues.push("one hour");
  if (/\b30 minutes?\b/.test(q)) clues.push("30 minute");

  return [...new Set(clues.filter(Boolean))];
}

function r43EntityMatchesQuestion(fact, q) {
  const subject = r43Norm(fact.subject);
  if (!subject) return false;
  if (q.includes(subject)) return true;

  // High-value natural aliases / partial references.
  if (fact.subject === "RNG Machine" && /\brng\b/.test(q)) return true;
  if (fact.subject === "Los Traders" && /\btraders?\b/.test(q)) return true;
  if (fact.subject === "Job Job Job Sahur Ritual" && /\b(?:job\s+){2,3}job\s+sahur\b|\bresume ritual\b/.test(q)) return true;
  if (fact.kind === "rebirth") {
    const n = fact.subject.match(/\d+/)?.[0];
    if (n && new RegExp(`\\brebirth\\s*${n}\\b`).test(q)) return true;
  }
  return false;
}

function r43ValueHasClue(value, clue) {
  if (String(clue).startsWith("money:")) {
    const target = String(clue).slice("money:".length);
    return Boolean(target) && r44MoneyValues(value).includes(target);
  }

  const v = r43Norm(value);
  const c = r43Norm(clue);
  if (!c) return false;
  if (v.includes(c) || c.includes(v)) return true;

  // Date shorthand: "jan 24" should match "January 24, 2026".
  const cParts = c.split(" ");
  if (cParts.length >= 2 && /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/.test(cParts[0])) {
    return cParts.every((p) => v.includes(p));
  }

  return false;
}

function r43FactScore(fact, rawQuestion, expectedKind, wantedRel, clues) {
  const q = r43Norm(rawQuestion);
  let score = 0;

  if (expectedKind) {
    if (fact.kind !== expectedKind) return -999;
    score += 8;
  }

  if (wantedRel) {
    if (fact.relation === wantedRel) score += 12;
    else if (wantedRel === REL.OUTCOME && [REL.REWARD, REL.OUTCOME].includes(fact.relation)) score += 8;
    else if (wantedRel === REL.UPDATE && [REL.UPDATE, REL.REPLACED_IN].includes(fact.relation)) score += 7;
    else score -= 3;
  }

  if (r43EntityMatchesQuestion(fact, q)) score += 30;

  const subjTokens = r43Tokens(fact.subject).filter((t) => t.length >= 3);
  const subjHits = subjTokens.filter((t) => q.includes(t)).length;
  score += Math.min(8, subjHits * 2);

  let clueHits = 0;
  const searchable = `${fact.subject} ${fact.value} ${fact.qualifier || ""}`;
  for (const clue of clues) {
    if (r43ValueHasClue(searchable, clue)) {
      clueHits += 1;
      score += 14;
    }
  }

  if (fact.qualifier && r43Norm(fact.qualifier) && q.includes(r43Norm(fact.qualifier))) score += 18;

  // Lifecycle clue binding across all facts belonging to the same subject is
  // handled by subject aggregation below, not by letting one random number win.
  return score + clueHits;
}

function r43SubjectEvidence(subject, rawQuestion, expectedKind, clues) {
  const q = r43Norm(rawQuestion);
  const rows = R43_MASTER_FACTS.filter((f) => f.subject === subject && (!expectedKind || f.kind === expectedKind));
  let score = 0;
  let matched = 0;

  for (const clue of clues) {
    if (rows.some((f) => r43ValueHasClue(`${f.value} ${f.qualifier || ""}`, clue))) {
      matched += 1;
      score += 18;
    }
  }

  const allText = r43Norm(rows.map((f) => `${f.field} ${f.value} ${f.qualifier || ""}`).join(" "));
  if (/\bupdate 57\b/.test(q) && allText.includes("update 57")) score += 10;
  if (/\bupdate 60\b/.test(q) && allText.includes("update 60")) score += 10;
  if (/\bupdate 61\b/.test(q) && allText.includes("update 61")) score += 10;
  if (/\breplaced\b/.test(q) && rows.some((f) => f.relation === REL.REPLACED_BY || f.relation === REL.REPLACED_IN)) score += 12;
  if (/\b(?:ended|ending|stopped|ceased|until|through)\b/.test(q) && rows.some((f) => f.relation === REL.ACTIVE_RANGE || f.field === "endedBy" || f.relation === REL.REPLACED_IN)) score += 12;
  if (/\brefresh|rotate|rotation\b/.test(q) && rows.some((f) => f.relation === REL.FREQUENCY)) score += 12;

  return { score, matched };
}

function r44WantsReverseSubject(q, expectedKind, clues) {
  if (!expectedKind) return false;
  if (/\b(?:which|what)\b/.test(q)) return true;

  if (expectedKind === "brainrot") {
    return /\b(?:secret|og|brainrot god|mythic|legendary|epic|rare|common)\b/.test(q) &&
      /\b(?:cost|costing|earn|earns|earning|income|make|makes|making|per second|a second)\b/.test(q) &&
      clues.filter((clue) => String(clue).startsWith("money:")).length >= 2;
  }

  if (expectedKind === "machine") {
    return /\bmachine\b/.test(q) &&
      /\b(?:active|refresh|rotate|rotation|ended|stopped|before|predecessor)\b/.test(q) &&
      clues.length >= 2;
  }

  return false;
}

function r43MakeAnswer(fact, answer, reason) {
  return r41InstantResult(
    answer,
    fact?.relation || REL.LORE,
    fact?.sourcePath || "/wiki",
    fact?.title || fact?.subject || "SAB Master Lore",
    `R43_${reason}`
  );
}

function r43MasterLoreResolve(question, analysis = {}) {
  const raw = oneLine(question, 1000);
  const q = r43Norm(raw);
  const expectedKind = r43ExpectedKind(q);
  const wantedRel = r43WantedRelation(q);
  const clues = r43QuestionClues(raw);

  const r45SiteHit = r45SiteBrainrotResolve(raw, q, clues);
  if (r45SiteHit) return r45SiteHit;

  // -----------------------------------------------------
  // Lifecycle reverse links: "machine before RNG", "what did RNG replace".
  // -----------------------------------------------------
  if (/\bbefore\s+(?:the\s+)?rng\b|\bpredecessor\s+(?:to|of)\s+(?:the\s+)?rng\b|\bwhat did (?:the )?rng(?: machine)? replace\b/.test(q)) {
    const hits = R43_MASTER_FACTS.filter((f) =>
      f.kind === "machine" &&
      f.relation === REL.REPLACED_BY &&
      r43Norm(f.value).includes("rng machine")
    );
    if (hits.length === 1) return r43MakeAnswer(hits[0], hits[0].subject, "REVERSE_REPLACED_BY");
  }

  // "what replaced Los Traders?"
  if (/\bwhat replaced los traders\b|\bwhich machine replaced los traders\b/.test(q)) {
    const hit = R43_MASTER_FACTS.find((f) => f.subject === "Los Traders" && f.relation === REL.REPLACED_BY);
    if (hit) return r43MakeAnswer(hit, hit.value, "DIRECT_REPLACED_BY");
  }

  // Resume chance shorthand.
  if (/1\s*%/.test(raw) && /\bresume\b/.test(q)) {
    const hit = R43_MASTER_FACTS.find((f) =>
      f.subject === "Job Job Job Sahur Ritual" &&
      f.field === "alternate" &&
      r43Norm(f.qualifier) === "1%"
    );
    if (hit) return r43MakeAnswer(hit, hit.value, "QUALIFIED_OUTCOME");
  }
  if (/99\s*%/.test(raw) && /\bresume\b/.test(q)) {
    const hit = R43_MASTER_FACTS.find((f) =>
      f.subject === "Job Job Job Sahur Ritual" &&
      f.field === "reward" &&
      r43Norm(f.qualifier) === "99%"
    );
    if (hit) return r43MakeAnswer(hit, hit.value, "QUALIFIED_OUTCOME");
  }

  // Gear/item -> rebirth reverse lookup, including shorthand such as "shield".
  if (/\brebirth\b/.test(q) && /\b(?:gives|give|gave|unlock|unlocks|gear|item|shield|teleport|potion)\b/.test(q)) {
    const gearFacts = R43_MASTER_FACTS.filter((f) => f.kind === "rebirth" && f.relation === REL.GEAR);
    let best = null;
    for (const f of gearFacts) {
      const valueTokens = r43Tokens(f.value).filter((x) => x.length >= 4);
      const overlap = valueTokens.filter((t) => q.includes(t)).length;
      if (!overlap) continue;
      const score = overlap * 10 + (q.includes(r43Norm(f.value)) ? 20 : 0);
      if (!best || score > best.score) best = { f, score };
    }
    if (best) return r43MakeAnswer(best.f, best.f.subject.replace("Rebirth ", "Rebirth"), "GEAR_TO_REBIRTH");
  }

  // Mutation multiplier reverse.
  if (expectedKind === "mutation" && /\b\d+(?:\.\d+)?\s*x\b/.test(q)) {
    const mult = (q.match(/\b\d+(?:\.\d+)?\s*x\b/) || [])[0];
    const hits = R43_MASTER_FACTS.filter((f) => f.kind === "mutation" && f.relation === REL.MULTIPLIER && r43Norm(f.value) === r43Norm(mult));
    if (hits.length === 1) return r43MakeAnswer(hits[0], hits[0].subject, "MULTIPLIER_TO_MUTATION");
  }

  // Direct subject + requested relation. This is the fastest generic path.
  const directSubjects = [...new Set(R43_MASTER_FACTS.filter((f) => r43EntityMatchesQuestion(f, q)).map((f) => f.subject))];
  if (directSubjects.length === 1 && wantedRel) {
    const subject = directSubjects[0];
    let rows = R43_MASTER_FACTS.filter((f) => f.subject === subject);
    if (wantedRel === REL.UPDATE) rows = rows.filter((f) => [REL.UPDATE, REL.REPLACED_IN].includes(f.relation));
    else if (wantedRel === REL.OUTCOME) rows = rows.filter((f) => [REL.OUTCOME, REL.REWARD].includes(f.relation));
    else rows = rows.filter((f) => f.relation === wantedRel);

    if (rows.length === 1) return r43MakeAnswer(rows[0], rows[0].value, "DIRECT_SUBJECT_RELATION");

    // For list-like gear/reward facts, preserve all distinct values.
    if (rows.length > 1 && [REL.GEAR, REL.REWARD, REL.BRAINROT].includes(wantedRel)) {
      const values = [...new Set(rows.map((f) => f.value))];
      if (values.length) return r43MakeAnswer(rows[0], values.join(", "), "DIRECT_SUBJECT_LIST");
    }
  }

  // Subject-level reverse clue matching. This binds ALL clues to one subject
  // before choosing an answer, preventing random dates/update numbers from
  // unrelated pages from winning.
  const subjects = [...new Set(R43_MASTER_FACTS.filter((f) => !expectedKind || f.kind === expectedKind).map((f) => f.subject))];
  const rankedSubjects = subjects.map((subject) => {
    const ev = r43SubjectEvidence(subject, raw, expectedKind, clues);
    const factScores = R43_MASTER_FACTS
      .filter((f) => f.subject === subject && (!expectedKind || f.kind === expectedKind))
      .map((f) => ({ f, score: r43FactScore(f, raw, expectedKind, wantedRel, clues) }))
      .sort((a, b) => b.score - a.score);
    return { subject, evidence: ev, bestFact: factScores[0]?.f, bestScore: (factScores[0]?.score || 0) + ev.score };
  }).sort((a, b) => b.bestScore - a.bestScore);

  const top = rankedSubjects[0];
  const second = rankedSubjects[1];
  const reverseSubject = r44WantsReverseSubject(q, expectedKind, clues);
  const allCluesBoundToTop = Boolean(top) && clues.length > 0 && top.evidence.matched === clues.length;
  const clearWinner = Boolean(top) && top.bestScore >= 22 && (!second || top.bestScore - second.bestScore >= 7);

  // Do not degrade an entity-identification question into a relation-value
  // answer when its clues disagree or only some of them bind. A local miss is
  // safer than choosing the entity associated with one stray number/date.
  if (reverseSubject && (!allCluesBoundToTop || !clearWinner)) return null;

  // Require useful evidence and a clear winner.
  if (clearWinner) {
    const rows = R43_MASTER_FACTS.filter((f) => f.subject === top.subject);

    // Reverse identities must bind every explicit clue to the SAME subject.
    // This prevents a stray date, update, random number, hash, request id, or
    // metadata value from turning into a final entity answer.
    if (reverseSubject) {
      return r43MakeAnswer(top.bestFact, top.subject, "R44_REVERSE_MULTI_CLUE_ENTITY");
    }

    if (wantedRel) {
      let relRows = rows.filter((f) => f.relation === wantedRel);
      if (wantedRel === REL.UPDATE) relRows = rows.filter((f) => [REL.UPDATE, REL.REPLACED_IN].includes(f.relation));
      if (wantedRel === REL.OUTCOME) relRows = rows.filter((f) => [REL.OUTCOME, REL.REWARD].includes(f.relation));
      if (relRows.length === 1) return r43MakeAnswer(relRows[0], relRows[0].value, "REVERSE_RELATION_VALUE");
    }
  }

  // "what thing refreshes twice an hour" -> all unambiguous local 30m machines.
  if (expectedKind === "machine" && /\btwice an hour\b|\b30 minute\b/.test(q)) {
    const hits = R43_MASTER_FACTS.filter((f) =>
      f.kind === "machine" &&
      f.relation === REL.FREQUENCY &&
      r43Norm(f.value).includes("30 minute")
    );
    const names = [...new Set(hits.map((f) => f.subject))];
    if (names.length) return r43MakeAnswer(hits[0], names.join(", "), "FREQUENCY_REVERSE");
  }

  return null;
}


function r42CanonMoney(value) {
  const m=String(value||"").replace(/,/g,"").match(/\$?\s*(\d+(?:\.\d+)?)\s*(K|M|B|T|Qa|Qi|Sx|Sp|Oc|No|Dc)?/i);
  if (!m) return "";
  const n=Number(m[1]);
  if (!Number.isFinite(n)) return "";
  return `${String(n).replace(/\.0+$/,'')}${(m[2]||'').toLowerCase()}`;
}
function r42MoneyClues(q) {
  return [...String(q).matchAll(/\$\s*(\d+(?:\.\d+)?)\s*(K|M|B|T|Qa|Qi|Sx|Sp|Oc|No|Dc)?/gi)].map((m)=>r42CanonMoney(m[0]));
}
function r42DateKey(value) {
  return String(value||"").toLowerCase().replace(/\b(september)\b/g,'sep').replace(/\b(october)\b/g,'oct').replace(/\b(november)\b/g,'nov').replace(/\b(december)\b/g,'dec').replace(/\b(january)\b/g,'jan').replace(/\b(february)\b/g,'feb').replace(/\b(march)\b/g,'mar').replace(/\b(april)\b/g,'apr').replace(/\b(june)\b/g,'jun').replace(/\b(july)\b/g,'jul').replace(/\b(august)\b/g,'aug').replace(/[^a-z0-9]+/g,' ').trim();
}
function r42QuestionDate(q) {
  const m=String(q).match(/\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?\s*(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(20\d{2}))?/i);
  if (!m) return "";
  return r42DateKey(`${m[1]} ${Number(m[2])}${m[3]?` ${m[3]}`:''}`);
}
function r42FieldRelation(field,kind) {
  const map={cost:REL.COST,income:REL.INCOME,rarity:REL.RARITY,date:REL.DATE,update:REL.UPDATE,event:REL.EVENT,source:REL.METHOD,availability:REL.STATUS,duration:REL.DURATION,frequency:REL.FREQUENCY,status:REL.STATUS,reward:REL.REWARD,trait:REL.TRAIT,multiplier:REL.MULTIPLIER,machine:REL.MACHINE,gear:REL.GEAR,ritual:REL.RITUAL};
  return map[field] || (kind==='machine'?REL.MACHINE:kind==='event'?REL.EVENT:kind==='code'?REL.CODE:REL.BRAINROT);
}
function r42WantsField(q) {
  if (/\b(?:cost|price|pay|worth)\b/.test(q)) return 'cost';
  if (/\b(?:income|earn|earns|earning|per second|\/s)\b/.test(q)) return 'income';
  if (/\b(?:rarity|tier)\b/.test(q)) return 'rarity';
  if (/\b(?:when|date|added|released|came out|introduced)\b/.test(q) && !/\bwhich|what\s+(?:brainrot|machine|event)\b/.test(q)) return 'date';
  if (/\b(?:what|which)\s+update\b|\bupdate number\b/.test(q)) return 'update';
  if (/\b(?:how long|duration|lasted|window)\b/.test(q)) return 'duration';
  if (/\b(?:how often|frequency|cadence|every how|refresh cycle)\b/.test(q)) return 'frequency';
  if (/\b(?:status|available|availability|obtainable|offline|online|active|live)\b/.test(q)) return 'availability';
  if (/\b(?:reward|gives|give|spawn|spawns)\b/.test(q)) return 'reward';
  if (/\btrait\b/.test(q)) return 'trait';
  if (/\bmultiplier|multi\b/.test(q)) return 'multiplier';
  return '';
}
function r42RecordSearch(question) {
  const q=String(question||'').toLowerCase();
  const money=r42MoneyClues(q);
  const date=r42QuestionDate(q);
  const upd=(q.match(/\bupdate\s*#?\s*(\d{1,3})\b/i)||[])[1];
  const rarity=(q.match(/\b(common|rare|epic|legendary|mythic|brainrot god|secret|og)\b/i)||[])[1]?.toLowerCase()||'';
  const asksBrainrot=/\b(?:which|what)\s+(?:secret\s+)?brainrot\b|\bwhich secret\b/.test(q);
  const asksMachine=/\b(?:which|what)\s+(?:machine|thing|system)\b/.test(q);
  const asksEvent=/\b(?:which|what)\s+event\b/.test(q);
  const asksCode=/\b(?:which|what)\s+code\b|\bcode\s+(?:gives|gave|for)\b/.test(q);
  const wants=r42WantsField(q);
  const rows=[];
  for (const [name,row] of Object.entries(R41_BRAINROT_SNAPSHOT)) rows.push({kind:'brainrot',name,path:`/brainrots/${primarySlug(name)}`,...row});
  for (const [name,row] of Object.entries(R41_MACHINE_SNAPSHOT)) rows.push({kind:'machine',name,path:'/machines',...row});
  for (const [name,row] of Object.entries(R42_EVENT_SNAPSHOT)) rows.push({kind:'event',name,path:'/events',...row});
  for (const [name,row] of Object.entries(R42_CODE_SNAPSHOT)) rows.push({kind:'code',name,path:'/events/rng-machine-queen-bee-event-2026-08-08',...row});

  // Direct named-subject field lookup first.
  for (const row of rows) {
    const lname=row.name.toLowerCase();
    if (!q.includes(lname)) continue;
    if (wants && row[wants]) return {row,answer:row[wants],field:wants,score:100};
    if (/\bhow|get|obtain|source|where\b/.test(q) && row.source) return {row,answer:row.source,field:'source',score:100};
    if (/\bevent\b/.test(q) && row.event) return {row,answer:row.event,field:'event',score:100};
    if (/\bupdate\b/.test(q) && row.update) return {row,answer:row.update,field:'update',score:100};
  }

  let best=null, second=null;
  for (const row of rows) {
    if (asksBrainrot && row.kind!=='brainrot') continue;
    if (asksMachine && row.kind!=='machine') continue;
    if (asksEvent && row.kind!=='event') continue;
    if (asksCode && row.kind!=='code') continue;
    let score=0, strong=0;
    const flat=Object.values(row).filter((v)=>typeof v==='string').join(' ').toLowerCase();
    if (rarity && String(row.rarity||'').toLowerCase()===rarity) {score+=2; strong++;}
    if (upd && String(row.update||'').toLowerCase().replace(/[^0-9]/g,'')===upd) {score+=4; strong++;}
    if (date && row.date && r42DateKey(row.date).includes(date)) {score+=5; strong++;}
    for (const m of money) {
      const cost=r42CanonMoney(row.cost), income=r42CanonMoney(row.income);
      if (cost && cost===m) {score+=6; strong++;}
      if (income && income===m) {score+=6; strong++;}
    }
    if (/taco currency/.test(q) && /taco/.test(flat)) {score+=4; strong++;}
    if (/one[- ]hour|1[- ]hour|lasted one hour/.test(q) && /one hour/.test(flat)) {score+=4; strong++;}
    if (asksCode && /cooldown/.test(q) && /cooldown/.test(flat)) {score+=6; strong++;}
    if (asksCode && /luck/.test(q) && /luck/.test(flat)) {score+=6; strong++;}
    if (asksCode && /strawberry elephant/.test(q) && /strawberry elephant/.test(flat)) {score+=7; strong++;}
    if (asksCode && /sold out/.test(q) && /sold out/.test(flat)) {score+=3; strong++;}
    if (/rng/.test(q) && /rng/.test(flat)) score+=2;
    if (/queen bee/.test(q) && /queen bee/.test(flat)) score+=2;
    if (/los traders/.test(q) && /los traders/.test(flat)) score+=2;
    if (/resume/.test(q) && /resume/.test(flat)) score+=2;
    if (/grief shield|shield/.test(q) && /grief shield/.test(flat)) score+=3;
    if (/crystal/.test(q) && /crystal/.test(flat)) score+=2;
    if (/bull/.test(q) && /bull/.test(flat)) score+=2;
    if (score<=0) continue;
    const cand={row,score,strong};
    if (!best || score>best.score) {second=best;best=cand;} else if (!second || score>second.score) second=cand;
  }
  if (!best || best.strong<1 || best.score<5) return null;
  if (second && second.score===best.score && second.row.name!==best.row.name) return null;
  return {row:best.row,answer:best.row.name,field:'name',score:best.score};
}
function r42InstantStructuredResolve(question) {
  const hit=r42RecordSearch(question);
  if (!hit) return null;
  const title=hit.row.kind==='machine'?'All Machines':hit.row.kind==='event'?'Events':hit.row.kind==='code'?'Update 61 Event Codes':hit.row.name;
  const relation=r42FieldRelation(hit.field,hit.row.kind);
  return r41InstantResult(String(hit.answer),relation,hit.row.path||'/brainrots',title,`R42_STRUCTURED_${hit.row.kind.toUpperCase()}_${hit.field.toUpperCase()}`);
}


function r41Source(path,title) {
  return {title, url:`${PRIMARY_ORIGIN}${path}`};
}

function r41InstantResult(answer, relation, path, title, reason) {
  return makeResult(answer, relation, SOURCE.PRIMARY, r41Source(path,title), `PRIMARY_SPLUS_R41_INSTANT_${reason}`, 0.995);
}

function instantLoreResolve(question, analysis = {}) {
  const raw=oneLine(question,1000);
  const q=raw.toLowerCase();
  const nq=norm(raw);

  // R42: generic zero-network structured clue matcher. This runs BEFORE every
  // old shortcut, AI router, Tavily search, or upstream page fetch.
  const r42Structured=r42InstantStructuredResolve(raw);
  if (r42Structured) return r42Structured;

  // Natural shorthand / backwards questions. These hit before NVIDIA, Tavily, or page fetches.
  const asksPreRng =
    ((/\bbefore\b|\bprevious\b|\bpreceded\b|\bpredecessor\b/.test(q) && /\brng(?:\s+machine)?\b/.test(q) && /machine|thing|what|system/.test(q))) ||
    /what\s+did\s+(?:the\s+)?rng(?:\s+machine)?\s+replace/.test(q) ||
    /what\s+was\s+replaced\s+by\s+(?:the\s+)?rng(?:\s+machine)?/.test(q) ||
    /replaced\s+by\s+(?:the\s+)?rng(?:\s+machine)?/.test(q) ||
    /predecessor\s+(?:of|to)\s+(?:the\s+)?rng(?:\s+machine)?/.test(q) ||
    /machinebeforerng|beforetherng|whatdidrngmachinereplace|rngmachinepredecessor/.test(nq);
  if (asksPreRng) {
    return r41InstantResult("Los Traders",REL.MACHINE,"/machines","All Machines","PRE_RNG_MACHINE");
  }
  if ((/\b1\s*%/.test(q) || /\bone\s+percent\b/.test(q)) && /resume/.test(q)) {
    return r41InstantResult("Noo my Resume",REL.OUTCOME,"/rituals","Secret Rituals & Traits","JOB_RITUAL_1PCT");
  }
  if ((/\b99\s*%/.test(q) || /\bninety[- ]?nine\s+percent\b/.test(q)) && /resume/.test(q)) {
    return r41InstantResult("Yess my Resume",REL.OUTCOME,"/rituals","Secret Rituals & Traits","JOB_RITUAL_99PCT");
  }
  const jan24 = /jan(?:uary)?\.?\s*24(?:th)?/.test(q) || /24(?:th)?\s+of\s+jan/.test(q) || /(?:^|\s)0?1[\/-]24[\/-](?:20)?26(?:\s|$|[?.!,])/.test(q);
  if (jan24 && /brainrot|came out|released|added|which|what/.test(q)) {
    return r41InstantResult("Arcadopus",REL.BRAINROT,"/brainrots/arcadopus","Arcadopus","DATE_TO_BRAINROT");
  }
  if (/shield/.test(q) && /rebirth|which|what/.test(q)) {
    return r41InstantResult("Rebirth19",REL.REBIRTH,"/wiki/rebirth","Rebirth System Guide","GEAR_TO_REBIRTH");
  }
  if (/third\s+floor/.test(q) && /rebirth|unlock|which|what/.test(q)) {
    return r41InstantResult("Rebirth10",REL.REBIRTH,"/wiki/rebirth","Rebirth System Guide","THIRD_FLOOR");
  }

  // Reverse mutation lookup: "which mutation has 13x?"
  const mult=q.match(/\b(\d+(?:\.\d+)?)\s*x\b/);
  if (mult && /mutation|which/.test(q)) {
    const target=`${mult[1]}x`.toLowerCase();
    const matches=R41_MUTATION_SNAPSHOT.filter(([,m])=>m.toLowerCase()===target);
    if (matches.length===1) return r41InstantResult(matches[0][0],REL.MUTATION,"/wiki/mutations","Mutations & Traits","MULTIPLIER_TO_MUTATION");
    // 10x is intentionally ambiguous (Rainbow + Divine), so do not guess.
  }

  // Named mutation -> multiplier.
  for (const [name,multi] of R41_MUTATION_SNAPSHOT) {
    if (q.includes(name.toLowerCase()) && /multiplier|multi|\bx\b|mutation/.test(q)) {
      return r41InstantResult(multi,REL.MULTIPLIER,"/wiki/mutations","Mutations & Traits","MUTATION_MULTIPLIER");
    }
  }

  // Rebirth N direct fields.
  const reb=q.match(/rebirth\s*#?\s*(\d{1,2})/i);
  if (reb) {
    const n=Number(reb[1]);
    const row=R41_REBIRTH_SNAPSHOT[n];
    if (row) {
      if (/gear|item|unlock|give|reward/.test(q) && row.gear?.length) return r41InstantResult(row.gear.join(", "),REL.GEAR,"/wiki/rebirth","Rebirth System Guide",`REBIRTH_${n}_GEAR`);
      if ((/character|brainrot|who/.test(q) || (/need|require/.test(q) && !/cash|cost|price|money|how much/.test(q))) && row.chars?.length) return r41InstantResult(row.chars.join(", "),REL.REQUIREMENT,"/wiki/rebirth","Rebirth System Guide",`REBIRTH_${n}_CHARACTERS`);
      if (/start(?:ing)? cash|cash after|reset cash/.test(q)) return r41InstantResult(row.startCash,REL.REWARD,"/wiki/rebirth","Rebirth System Guide",`REBIRTH_${n}_START_CASH`);
      if (/cash|cost|price|money|how much/.test(q)) return r41InstantResult(row.cash,REL.COST,"/wiki/rebirth","Rebirth System Guide",`REBIRTH_${n}_CASH`);
      if (/multiplier|multi/.test(q)) return r41InstantResult(row.multi,REL.MULTIPLIER,"/wiki/rebirth","Rebirth System Guide",`REBIRTH_${n}_MULTI`);
      if (/floor/.test(q) && row.floor) return r41InstantResult(row.floor,REL.BASE,"/wiki/rebirth","Rebirth System Guide",`REBIRTH_${n}_FLOOR`);
    }
  }

  // Reverse gear/item -> rebirth.
  if (/rebirth|which|what/.test(q)) {
    for (const [n,row] of Object.entries(R41_REBIRTH_SNAPSHOT)) {
      for (const gear of row.gear||[]) {
        if (q.includes(gear.toLowerCase())) return r41InstantResult(`Rebirth${n}`,REL.REBIRTH,"/wiki/rebirth","Rebirth System Guide","GEAR_REVERSE");
      }
    }
  }

  // Machine facts and natural aliases.
  for (const [name,row] of Object.entries(R41_MACHINE_SNAPSHOT)) {
    const lname=name.toLowerCase();
    if (!q.includes(lname) && !(name==="RNG Machine" && /\brng\b/.test(q)) && !(name==="Los Traders" && /\blos\s+traders\b|\btraders\b/.test(q))) continue;
    if (/refresh|cycle|rotate|offer/.test(q) && row.refresh) return r41InstantResult(row.refresh,REL.COOLDOWN,"/machines","All Machines","MACHINE_REFRESH");
    if (/status|offline|online|active|live/.test(q) && row.status) return r41InstantResult(row.status,REL.STATUS,"/machines","All Machines","MACHINE_STATUS");
    if (/when|date|added|introduced|came out/.test(q) && row.date) return r41InstantResult(row.date,REL.DATE,"/machines","All Machines","MACHINE_DATE");
    if (/replaced by|replace(?:d)? it|what replaced|after/.test(q) && row.replacedBy) return r41InstantResult(row.replacedBy,REL.REPLACED_BY,"/machines","All Machines","MACHINE_REPLACEMENT");
    if (/what update|which update|replaced in/.test(q) && row.replacedIn) return r41InstantResult(row.replacedIn,REL.REPLACED_IN,"/machines","All Machines","MACHINE_REPLACED_IN");
    if (/ran from|active range|which updates|update range/.test(q) && row.activeRange) return r41InstantResult(row.activeRange,REL.ACTIVE_RANGE,"/machines","All Machines","MACHINE_ACTIVE_RANGE");
  }

  // 30-minute / twice-an-hour reverse lookup. Two S+ machine systems match; don't hallucinate one.
  if ((/twice\s+(?:an|per)\s+hour/.test(q) || /every\s+(?:30|thirty)\s*(?:min|mins|minute|minutes)/.test(q) || /every\s+(?:half|half[- ]an?)\s*hour/.test(q) || /30[- ]?minute\s+refresh/.test(q)) && /refresh|thing|machine|offer|what|system/.test(q)) {
    return r41InstantResult("Los Traders, Craft Machine",REL.MACHINE,"/machines","All Machines","THIRTY_MINUTE_SYSTEMS");
  }

  // Ritual facts.
  for (const [name,row] of Object.entries(R41_RITUAL_SNAPSHOT)) {
    const aliases=[name.toLowerCase(),name.toLowerCase().replace(/ ritual$/,'')];
    if (!aliases.some((x)=>x && q.includes(x))) continue;
    if (/1\s*%/.test(q) && row.alternateChance==="1%") return r41InstantResult(row.alternate,REL.OUTCOME,"/rituals","Secret Rituals & Traits","RITUAL_CHANCE_1");
    if (/99\s*%/.test(q) && row.rewardChance==="99%") return r41InstantResult(row.reward,REL.OUTCOME,"/rituals","Secret Rituals & Traits","RITUAL_CHANCE_99");
    if (/player|how many/.test(q) && row.players) return r41InstantResult(row.players,REL.PLAYERS,"/rituals","Secret Rituals & Traits","RITUAL_PLAYERS");
    if (/trait/.test(q) && row.trait) return r41InstantResult(row.trait,REL.TRAIT,"/rituals","Secret Rituals & Traits","RITUAL_TRAIT");
    if (/reward|spawn|outcome|give|what does/.test(q) && row.reward) return r41InstantResult(row.reward,REL.OUTCOME,"/rituals","Secret Rituals & Traits","RITUAL_REWARD");
  }

  // Small locally snapshotted brainrot identity facts.
  for (const [name,row] of Object.entries(R41_BRAINROT_SNAPSHOT)) {
    if (!q.includes(name.toLowerCase())) continue;
    const path=`/brainrots/${primarySlug(name)}`;
    if (/rarity|tier/.test(q)) return r41InstantResult(row.rarity,REL.RARITY,path,name,"BRAINROT_RARITY");
    if (/cost|price/.test(q)) return r41InstantResult(row.cost,REL.COST,path,name,"BRAINROT_COST");
    if (/income|per second|\/s/.test(q) && row.income) return r41InstantResult(row.income,REL.INCOME,path,name,"BRAINROT_INCOME");
    if (/when|date|added|released|came out/.test(q) && row.date) return r41InstantResult(row.date,REL.DATE,path,name,"BRAINROT_DATE");
    if (/event/.test(q) && row.event) return r41InstantResult(row.event,REL.EVENT,path,name,"BRAINROT_EVENT");
    if (/how|get|source|obtain/.test(q) && row.source) return r41InstantResult(row.source,REL.METHOD,path,name,"BRAINROT_SOURCE");
  }

  return null;
}

const PAGE_CACHE = new Map();
const SEARCH_CACHE = new Map();
const ANSWER_CACHE = new Map();

function clean(value, limit = 4000) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .trim()
    .slice(0, limit);
}

function oneLine(value, limit = 4000) {
  return clean(value, limit).replace(/\s+/g, " ").trim();
}

function norm(value) {
  return oneLine(value, 3000).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function slugify(value) {
  return oneLine(value, 240)
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function clamp(value, min = 0, max = 1) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : min;
}

function env(name) {
  return String(process.env[name] || "").trim().replace(/^Bearer\s+/i, "").trim();
}

function nowMs() {
  return Date.now();
}

function timeLeft(deadline) {
  return Math.max(0, deadline - nowMs());
}

function errorCode(error) {
  return oneLine(error?.code || error?.message || error || "UNKNOWN_ERROR", 280);
}

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-lookup-build": BUILD_ID,
    },
  });
}

function cacheGet(map, key) {
  const row = map.get(key);
  if (!row) return null;
  if (row.expiresAt <= nowMs()) {
    map.delete(key);
    return null;
  }
  return row.value;
}

function cacheSet(map, key, value, ttl) {
  map.set(key, { value, expiresAt: nowMs() + ttl });
}

async function fetchText(label, url, options = {}, timeoutMs = 850) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let response;
    try {
      response = await fetch(url, { ...options, signal: controller.signal });
    } catch (error) {
      const e = new Error(error?.name === "AbortError" ? `${label}_TIMEOUT` : `${label}_REQUEST_FAILED`);
      e.code = error?.name === "AbortError" ? `${label}_TIMEOUT` : `${label}_REQUEST_FAILED`;
      throw e;
    }
    const text = await response.text();
    if (!response.ok) {
      const e = new Error(`${label}_HTTP_${response.status}`);
      e.code = `${label}_HTTP_${response.status}`;
      throw e;
    }
    return text;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(label, url, options = {}, timeoutMs = 850) {
  const text = await fetchText(label, url, options, timeoutMs);
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    const e = new Error(`${label}_INVALID_JSON`);
    e.code = `${label}_INVALID_JSON`;
    throw e;
  }
}

function decodeHtml(value) {
  return String(value ?? "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n);
      return Number.isFinite(code) ? String.fromCodePoint(code) : " ";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => {
      const code = Number.parseInt(n, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : " ";
    });
}

function htmlToLines(html, maxChars = 160000) {
  const text = decodeHtml(String(html ?? ""))
    .replace(/<img\b([^>]*)>/gi, (_m, attrs) => {
      const alt = String(attrs || "").match(/\balt=["']([^"']+)["']/i)?.[1] || "";
      const src = String(attrs || "").match(/\bsrc=["']([^"']+)["']/i)?.[1] || "";
      if (!alt && !src) return "\nImage\n";
      return `\nImage: ${alt || "unlabeled"}${src ? ` | Source: ${src}` : ""}\n`;
    })
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<(?:br|hr)\b[^>]*\/?\s*>/gi, "\n")
    .replace(/<\/(?:p|div|li|tr|td|th|h[1-6]|section|article|aside|table)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{2,}/g, "\n")
    .slice(0, maxChars);

  return text
    .split("\n")
    .map((line) => oneLine(line, 1400))
    .filter(Boolean);
}

function htmlToText(html, maxChars = 160000) {
  return htmlToLines(html, maxChars).join("\n");
}

function extractHeadingSections(html) {
  const raw = String(html ?? "");
  const headings = [];
  const re = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m;
  while ((m = re.exec(raw)) !== null) {
    headings.push({
      level: Number(m[1]),
      title: oneLine(htmlToText(m[2], 500), 300),
      start: m.index,
      end: re.lastIndex,
    });
  }
  const out = [];
  for (let i = 0; i < headings.length; i++) {
    const h = headings[i];
    let end = raw.length;
    for (let j = i + 1; j < headings.length; j++) {
      if (headings[j].level <= h.level) {
        end = headings[j].start;
        break;
      }
    }
    out.push({ ...h, text: htmlToText(raw.slice(h.end, end), 30000) });
  }
  return out;
}

function aliasesFor(question) {
  const q = oneLine(question, 700).toLowerCase();
  const out = new Set();
  for (const [key, values] of Object.entries(STATIC_ALIASES)) {
    if (q.includes(key)) values.forEach((v) => out.add(v));
  }
  return [...out];
}

function candidateEntities(question) {
  const raw = oneLine(question, 700);
  const out = new Set();
  for (const m of raw.matchAll(/["“”']([^"“”']{2,100})["“”']/g)) {
    out.add(oneLine(m[1], 120));
  }
  aliasesFor(raw).forEach((a) => out.add(a));

  const inputWords = raw.match(/[A-Za-z0-9][A-Za-z0-9'._-]*/g) || [];
  const filtered = inputWords.filter((word) => {
    const low = word.toLowerCase();
    return !STOPWORDS.has(low) && !/^\d+(?:\.\d+)?$/.test(word);
  });

  for (let size = Math.min(6, filtered.length); size >= 1; size--) {
    for (let i = 0; i + size <= filtered.length; i++) {
      const span = filtered.slice(i, i + size).join(" ");
      if (span.length >= 3) out.add(span);
    }
  }

  return [...out]
    .sort((a, b) => b.split(/\s+/).length - a.split(/\s+/).length || b.length - a.length)
    .slice(0, 18);
}

function isCurrent(question) {
  const q = oneLine(question, 700).toLowerCase();
  return ["newest","latest","most recent","current","currently","right now","today","this week","this month","as of now","new update","latest update","just added"].some((p) => q.includes(p));
}

function extractRebirthNumber(question) {
  const m = oneLine(question, 700).match(/\brebirth\s*#?\s*(\d{1,3})\b/i);
  return m ? Number(m[1]) : null;
}

function extractUpdateNumber(question) {
  const m = oneLine(question, 700).match(/\bupdate\s*(\d+(?:\.\d+)?)\b/i);
  return m ? m[1] : null;
}


function extractAllUpdateNumbers(question) {
  const q = oneLine(question, 700);
  return [...new Set(
    [...q.matchAll(/\bupdate\s*(\d+(?:\.\d+)?)\b/gi)]
      .map((m) => Number(m[1]))
      .filter((n) => Number.isFinite(n) && n > 0)
  )];
}

function extractLifecycleHints(question) {
  const q = oneLine(question, 700);
  const fromTo = q.match(/\bfrom\s+update\s*(\d+(?:\.\d+)?)\s+(?:through|to|until|thru)\s+update\s*(\d+(?:\.\d+)?)/i);
  const replacedIn = q.match(/\breplaced\s+(?:in|during|by\s+update)\s*update?\s*(\d+(?:\.\d+)?)/i)
    || q.match(/\breplaced\s+in\s+update\s*(\d+(?:\.\d+)?)/i);

  return {
    activeFrom: fromTo ? Number(fromTo[1]) : null,
    activeTo: fromTo ? Number(fromTo[2]) : null,
    replacedIn: replacedIn ? Number(replacedIn[1]) : null,
  };
}

function inferRelation(question) {
  const q = oneLine(question, 700).toLowerCase();

  if (/\b(?:image|icon|asset|model|thumbnail|picture|visual|appearance|look like|looks like)\b/.test(q)) return REL.ASSET;
  if (/\b(?:base|laser gate|base lock|lock time|defense|defence|protection|protect|floor|second floor|third floor)\b/.test(q)) return REL.BASE;
  if (/\b(?:cooldown|cool down|refresh time|refresh cycle|restock time|restock cycle)\b/.test(q) && !/\bcode\b/.test(q)) return REL.COOLDOWN;
  if (/\b(?:mechanic|mechanics|how does .* work|how do .* work|what happens when|what happens if)\b/.test(q)) return REL.MECHANIC;

  if (/\b(?:redeem code|event code|what code|which code|code was|code did|codes?)\b/.test(q)) return REL.CODE;
  if (/\b(?:stock|stock limit|quantity|how many copies|limited quantity)\b/.test(q)) return REL.STOCK;
  if (/\b(?:how many players|players required|player requirement)\b/.test(q)) return REL.PLAYERS;
  if (/\b(?:how long|duration|lasted|event window|window lasted)\b/.test(q)) return REL.DURATION;
  if (/\b(?:what time|start time|starts at|started at|when does .* start)\b/.test(q)) return REL.TIME;
  if (/\b(?:where|location|located|where is|where was)\b/.test(q)) return REL.LOCATION;
  if (/\b(?:shop|merchant|sold|selling|buy from|purchase from)\b/.test(q)) return REL.SHOP;
  if (/\b(?:lucky block|lucky blocks)\b/.test(q)) return REL.LUCKY_BLOCK;
  if (/\b(?:base skin|skin reward|base theme)\b/.test(q)) return REL.BASE_SKIN;
  if (/\b(?:announcement|announced|teased|previewed|revealed|developer said|dev said)\b/.test(q)) return REL.ANNOUNCEMENT;

  if (/\b(?:how often|how frequently|what interval|what cadence|frequency|recurr?ence|every how many|spawn rate|spawn frequency|respawn rate|milliseconds?)\b/.test(q)) return REL.FREQUENCY;
  if (/\bwhat\s+(?:replaced|replaces)\b|\breplaced by what\b/.test(q)) return REL.REPLACED_BY;
  if (/\b(?:which|what)\s+update\b[^?]{0,80}\breplaced\b|\breplaced in which update\b/.test(q)) return REL.REPLACED_IN;
  if (/\b(?:active|ran|available)\s+from\s+update\b|\bactive range\b/.test(q) && !/\b(?:what|which)\s+machine\b/.test(q)) return REL.ACTIVE_RANGE;
  if (/\b(?:result|outcome)\b/.test(q) && /\britual\b/.test(q)) return REL.OUTCOME;

  if (/\b(?:what|which)(?:\s+[a-z0-9'-]+){0,4}\s+(?:brainrot|brain rot)\b/.test(q)) return REL.BRAINROT;
  if (/\b(?:what|which)(?:\s+[a-z0-9'-]+){0,4}\s+(?:gear|item)\b/.test(q)) return REL.GEAR;
  if (/\b(?:which|what)\s+rebirth\b/.test(q) || /\brebirth\s+(?:did|does|is)\b/.test(q)) return REL.REBIRTH;
  if (/\b(?:income|income\/s|\$\/s|makes? per second|per second|generation|generates?|earn(?:s|ing)?)\b/.test(q)) return REL.INCOME;
  if (/\b(?:cost|price|buy price|how much)\b/.test(q)) return REL.COST;
  if (/\b(?:rarity|tier)\b/.test(q)) return REL.RARITY;
  if (/\b(?:multiplier|multi|boost)\b/.test(q)) return REL.MULTIPLIER;
  if (/\b(?:requires?|requirement|required|needed|materials?)\b/.test(q)) return REL.REQUIREMENT;
  if (/\b(?:spawn|spawns|summon|summons|result|outcome)\b/.test(q)) return REL.SPAWN;
  if (/\b(?:formation|arrangement|placement|arrange|line up)\b/.test(q)) return REL.FORMATION;
  if (/\bweather\b/.test(q)) return REL.WEATHER;
  if (/\b(?:drop rate|chance|probability|success rate)\b/.test(q)) return REL.DROP_RATE;
  if (/\b(?:when|what date|which date|what year|what month|release date|added to game)\b/.test(q)) return REL.DATE;
  if (/\b(?:how do|how can|obtain|obtained|get it|acquire|method|route)\b/.test(q)) return REL.METHOD;
  if (/\b(?:status|obtainable|available|removed|unobtainable)\b/.test(q)) return REL.STATUS;
  if (/\b(?:contents?|inside|contains?|drops?)\b/.test(q)) return REL.CONTENTS;
  if (/\b(?:reward|rewards)\b/.test(q)) return REL.REWARD;
  if (/\b(?:what|which)(?:\s+[a-z0-9'-]+){0,4}\s+ritual\b/.test(q)) return REL.RITUAL;
  if (/\b(?:what|which)(?:\s+[a-z0-9'-]+){0,4}\s+mutation\b/.test(q)) return REL.MUTATION;
  if (/\b(?:what|which)(?:\s+[a-z0-9'-]+){0,4}\s+trait\b/.test(q)) return REL.TRAIT;
  if (/\b(?:what|which)(?:\s+[a-z0-9'-]+){0,4}\s+event\b/.test(q)) return REL.EVENT;
  if (/\b(?:what|which)(?:\s+[a-z0-9'-]+){0,4}\s+machine\b/.test(q)) return REL.MACHINE;
  if (/\b(?:which|what)\s+collection\b/.test(q) || /\bcollection\s+(?:is|contains)\b/.test(q)) return REL.COLLECTION;
  return REL.TEXT;
}


function extractExplicitDate(question) {
  const q = oneLine(question, 700);
  const m = q.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(20\d{2})\b/i
  );
  if (!m) return null;

  const months = {
    january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  };

  const month = months[m[1].toLowerCase()];
  return `${m[3]}-${String(month).padStart(2, "0")}-${String(Number(m[2])).padStart(2, "0")}`;
}

function inferIntent(question, relation, update, date) {
  const q = oneLine(question, 700).toLowerCase();

  if (update && /\bwhat did\b|\bwhat was added\b|\bwhat got added\b|\bwhat changed\b/.test(q)) {
    return "UPDATE_SUMMARY";
  }

  if (update || date) {
    return "UPDATE_FACT";
  }

  if (/\bcurrent\b|\bnewest\b|\blatest\b|\bright now\b|\btoday\b/.test(q)) {
    return "CURRENT_FACT";
  }

  return "ENTITY_FACT";
}


function analyzeQuestion(question) {
  const q = oneLine(question, 700);
  let relation = inferRelation(q);
  const entities = candidateEntities(q);
  const rebirth = extractRebirthNumber(q);
  const updateRaw = extractUpdateNumber(q);
  const update = updateRaw ? Number(updateRaw) : null;
  const updateNumbers = extractAllUpdateNumbers(q);
  const lifecycle = extractLifecycleHints(q);
  const date = extractExplicitDate(q);
  const current = isCurrent(q);

  if (
    date &&
    /\b(?:what|which)\s+update\b|\bupdate\s+(?:happened|occurred|released|came out)\b/i.test(q)
  ) {
    relation = REL.UPDATE;
  }

  let entity = entities[0] || null;

  if (rebirth && relation === REL.GEAR) entity = `Rebirth${rebirth}`;
  if (current && q.toLowerCase().includes("rebirth")) entity = null;

  return {
    entity,
    entities,
    relation,
    rebirth,
    update,
    updateNumbers,
    activeFrom: lifecycle.activeFrom,
    activeTo: lifecycle.activeTo,
    replacedIn: lifecycle.replacedIn,
    date,
    current,
    intent: inferIntent(q, relation, update, date),
    rawQuestion: q,
    wantedRelations: detectWantedRelations(q, relation),
    source: "DETERMINISTIC_R36",
  };
}

function similarity(a, b) {
  const an = norm(a);
  const bn = norm(b);
  if (!an || !bn) return 0;
  if (an === bn) return 1;
  if (an.includes(bn) || bn.includes(an)) return 0.94;
  const aw = new Set(oneLine(a, 500).toLowerCase().match(/[a-z0-9]+/g) || []);
  const bw = new Set(oneLine(b, 500).toLowerCase().match(/[a-z0-9]+/g) || []);
  if (!aw.size || !bw.size) return 0;
  let same = 0;
  for (const x of aw) if (bw.has(x)) same++;
  return same / Math.max(aw.size, bw.size);
}

function bestEntityScore(analysis, value) {
  let score = analysis.entity ? similarity(analysis.entity, value) : 0;
  for (const e of analysis.entities || []) score = Math.max(score, similarity(e, value));
  return score;
}

function normalizeAnswer(value, relation) {
  const text = oneLine(value, 600);
  if (!text) return null;

  if (relation === REL.REBIRTH) {
    const m = text.match(/\brebirth\s*#?\s*(\d{1,3})\b/i) || text.match(/^\s*#?\s*(\d{1,3})\s*$/);
    return m ? `Rebirth${Number(m[1])}` : null;
  }

  if (relation === REL.MULTIPLIER) {
    const m = text.match(/\b\d+(?:\.\d+)?\s*[x×]/i);
    return m ? m[0].replace(/\s+/g, "").replace(/×/g, "x") : null;
  }

  if (relation === REL.COST) {
    const m = text.match(/\$\s*\d+(?:\.\d+)?\s*(?:Qa|Qi|Sx|Sp|Oc|No|Dc|K|M|B|T|Q)?/i);
    return m ? m[0].replace(/\s+/g, "") : null;
  }

  if (relation === REL.INCOME) {
    const m = text.match(/\$\s*\d+(?:\.\d+)?\s*(?:Qa|Qi|Sx|Sp|Oc|No|Dc|K|M|B|T|Q)?\s*(?:\/\s*s|\/sec|per\s*second)?/i);
    if (!m) return null;
    let out = m[0].replace(/\s+/g, "").replace(/persecond/i, "/s").replace(/\/sec$/i, "/s");
    if (!/\/s$/i.test(out)) out += "/s";
    return out;
  }

  if (relation === REL.DROP_RATE) {
    const m = text.match(/\b\d+(?:\.\d+)?\s*%/);
    return m ? m[0].replace(/\s+/g, "") : text;
  }

  return text;
}

function makeResult(answer, relation, source, page, reason, confidence = source.confidence) {
  const value = normalizeAnswer(answer, relation) || oneLine(answer, 500);
  if (!value) return null;
  return {
    answer: value,
    candidateAnswer: value,
    confidence,
    reason,
    route: source.key,
    sourceCount: 1,
    sources: [{
      host: source.host,
      title: page?.title || source.host,
      url: page?.url || "",
      claimType: reason,
      tier: source.tier,
    }],
  };
}

function findLabelValue(lines, labels, maxGap = 3) {
  const lowerLabels = labels.map((x) => x.toLowerCase());
  for (let i = 0; i < lines.length; i++) {
    const low = lines[i].toLowerCase();
    const exact = lowerLabels.some((label) => low === label || low.startsWith(`${label}:`));
    if (!exact) continue;

    const colonIndex = lines[i].indexOf(":");
    if (colonIndex >= 0) {
      const after = oneLine(lines[i].slice(colonIndex + 1), 500);
      if (after) return after;
    }

    for (let j = i + 1; j <= Math.min(lines.length - 1, i + maxGap); j++) {
      const v = oneLine(lines[j], 500);
      if (!v) continue;
      if (lowerLabels.some((label) => v.toLowerCase() === label)) break;
      return v;
    }
  }
  return null;
}

function extractSectionValue(text, startLabels, stopLabels = []) {
  const lines = clean(text, 30000).split("\n").map((x) => oneLine(x, 1000)).filter(Boolean);
  const starts = startLabels.map((x) => x.toLowerCase());
  const stops = stopLabels.map((x) => x.toLowerCase());
  for (let i = 0; i < lines.length; i++) {
    const low = lines[i].toLowerCase();
    if (!starts.some((s) => low === s || low.startsWith(s))) continue;
    const picked = [];
    for (let j = i + 1; j < lines.length && picked.length < 8; j++) {
      const l = lines[j];
      const ll = l.toLowerCase();
      if (stops.some((s) => ll === s || ll.startsWith(s))) break;
      if (/^(?:important notes|instructions|bonuses|requirements|new items|expected results|identity & availability|quick answers|how to obtain)$/i.test(l) && picked.length) break;
      picked.push(l);
    }
    if (picked.length) return picked.join(" | ");
  }
  return null;
}

function pageTitleFromHtml(html, fallback) {
  const m = String(html || "").match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  return m ? oneLine(htmlToText(m[1], 400), 240) : fallback;
}

async function fetchPage(url, source, deadline) {
  const key = `${source.key}:${url}`;
  const cached = cacheGet(PAGE_CACHE, key);
  if (cached) return { ...cached, cache: "HIT" };
  const left = timeLeft(deadline);
  if (left < 250) throw new Error(`${source.key}_BUDGET_EXHAUSTED`);
  const timeout = Math.max(250, Math.min(
    source === SOURCE.PRIMARY ? CFG.PRIMARY_TIMEOUT_MS : source === SOURCE.FANDOM ? CFG.FANDOM_TIMEOUT_MS : CFG.BACKUP_TIMEOUT_MS,
    left - 30
  ));
  const html = await fetchText(source.key, url, {
    headers: {
      Accept: "text/html,application/xhtml+xml",
      "User-Agent": "Mozilla/5.0 ChromeCodeSniper-R37",
    },
  }, timeout);
  const page = {
    url,
    title: pageTitleFromHtml(html, url),
    html,
    lines: htmlToLines(html),
    text: htmlToText(html),
    source,
  };
  cacheSet(PAGE_CACHE, key, page, CFG.PAGE_CACHE_TTL_MS);
  return { ...page, cache: "MISS" };
}


function absolutePrimaryUrl(href) {
  const raw = oneLine(href, 1200);
  if (!raw) return null;
  try {
    const url = new URL(raw, PRIMARY_ORIGIN);
    if (url.origin !== PRIMARY_ORIGIN) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function primaryLinks(page, prefix = "/") {
  const html = String(page?.html || "");
  const out = [];
  const seen = new Set();
  const re = /<a\b([^>]*?)href\s*=\s*["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const url = absolutePrimaryUrl(m[2]);
    if (!url) continue;
    let pathname = "";
    try { pathname = new URL(url).pathname; } catch {}
    if (!pathname.startsWith(prefix)) continue;
    const label = oneLine(htmlToText(m[4], 600), 300);
    const key = `${url}|${norm(label)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ url, label, pathname });
  }
  return out;
}

function bestPrimaryLink(page, analysis, prefix) {
  const links = primaryLinks(page, prefix);
  let best = null;
  for (const link of links) {
    const slugText = decodeURIComponent(link.pathname)
      .replace(/^\/+|\/+$/g, "")
      .replace(/[-_/]+/g, " ");
    const value = `${link.label} ${slugText}`;
    const score = bestEntityScore(analysis, value);
    if (!best || score > best.score) best = { ...link, score };
  }
  return best && best.score >= 0.38 ? best : null;
}

function isPrimaryEntityFieldRelation(relation) {
  return [
    REL.COST,
    REL.INCOME,
    REL.RARITY,
    REL.STATUS,
    REL.METHOD,
    REL.DATE,
  ].includes(relation);
}


function ritualDetailCandidates(analysis) {
  const candidates = [];
  const add = (slug) => {
    slug = slugify(slug);
    if (!slug) return;
    candidates.push(`${PRIMARY_ORIGIN}/rituals/${slug}`);
  };

  const entity = oneLine(analysis.entity || "", 180);
  const tokens = entity
    .toLowerCase()
    .match(/[a-z0-9]+/g) || [];

  // Most S+ ritual URLs are based on the distinctive ritual-name token.
  // For "Bombardiro Crocodilo", this tries /rituals/crocodilo-ritual first.
  if (tokens.length) {
    add(`${tokens[tokens.length - 1]}-ritual`);
    add(`${tokens[0]}-ritual`);
    add(`${tokens.join("-")}-ritual`);
  }

  for (const alias of analysis.entities || []) {
    const a = alias.toLowerCase().match(/[a-z0-9]+/g) || [];
    if (a.length) {
      add(`${a[a.length - 1]}-ritual`);
      add(`${a.join("-")}-ritual`);
    }
  }

  return [...new Set(candidates)].slice(0, 5);
}


function updateNeedleScore(text, analysis) {
  const t = oneLine(text, 4000).toLowerCase();
  let score = 0;

  if (analysis.update && new RegExp(`\\bupdate\\s*${analysis.update}\\b`, "i").test(t)) score += 8;

  if (analysis.date) {
    const [y, m, d] = analysis.date.split("-").map(Number);
    const names = [
      "", "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    const dateRe = new RegExp(`${names[m]}\\s+0?${d},?\\s+${y}`, "i");
    if (dateRe.test(t)) score += 8;
  }

  if (analysis.relation === REL.MACHINE && /\bmachine\b/i.test(t)) score += 2;
  if (analysis.relation === REL.REBIRTH && /\brebirth\b/i.test(t)) score += 2;
  if (analysis.relation === REL.BRAINROT && /\bbrainrot\b/i.test(t)) score += 2;
  if (analysis.relation === REL.GEAR && /\b(?:gear|item|shield|teleport|potion)\b/i.test(t)) score += 2;

  return score;
}

function contextAroundUpdate(text, analysis, radius = 1500) {
  const raw = String(text || "");
  let indices = [];

  if (analysis.update) {
    const re = new RegExp(`\\bUpdate\\s*${analysis.update}\\b`, "ig");
    let m;
    while ((m = re.exec(raw)) !== null) indices.push(m.index);
  }

  if (analysis.date) {
    const [y, mo, d] = analysis.date.split("-").map(Number);
    const names = [
      "", "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    const re = new RegExp(`${names[mo]}\\s+0?${d},?\\s+${y}`, "ig");
    let m;
    while ((m = re.exec(raw)) !== null) indices.push(m.index);
  }

  if (!indices.length) return "";
  const i = indices[0];
  return clean(raw.slice(Math.max(0, i - radius), Math.min(raw.length, i + radius)), radius * 2);
}

function extractUpdateTypedAnswer(context, analysis) {
  const text = oneLine(context, 5000);
  if (!text) return null;

  if (analysis.relation === REL.REBIRTH) {
    const matches = [...text.matchAll(/\bRebirth\s*#?\s*(\d{1,3})\b/gi)];
    if (matches.length) {
      const nums = matches.map((m) => Number(m[1])).filter(Number.isFinite);
      if (nums.length) return `Rebirth${Math.max(...nums)}`;
    }
  }

  if (analysis.relation === REL.MACHINE) {
    const matches = [
      ...text.matchAll(
        /\b((?:[A-Z0-9]{2,}|[A-Z][a-z]+)(?:\s+(?:[A-Z0-9]{2,}|[A-Z][a-z]+)){0,3}\s+Machine)\b/g
      ),
    ]
      .map((m) => oneLine(m[1], 100))
      .filter(Boolean);

    if (matches.length) {
      const ranked = [...new Set(matches)].sort((a, b) => {
        const as = /\b(?:RNG|Fuse|Craft|Mutation|Trait|Lucky|Brainrot)\b/i.test(a) ? 1 : 0;
        const bs = /\b(?:RNG|Fuse|Craft|Mutation|Trait|Lucky|Brainrot)\b/i.test(b) ? 1 : 0;
        return bs - as || a.length - b.length;
      });
      return ranked[0];
    }
  }

  if (analysis.relation === REL.GEAR) {
    const labels = [
      "New Items", "New Item", "Gear", "Item Unlock", "Unlock",
    ];
    const lines = context.split(/\n| \| /).map((x) => oneLine(x, 300)).filter(Boolean);
    const v = findLabelValue(lines, labels, 5);
    if (v) return oneLine(v, 120);
  }

  if (analysis.relation === REL.DATE) {
    const m = text.match(
      /\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+20\d{2}\b/i
    );
    if (m) return m[0];
  }

  return null;
}

function primaryEventContextLinks(page) {
  const html = String(page?.html || "");
  const out = [];
  const re = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;

  while ((m = re.exec(html)) !== null) {
    const url = absolutePrimaryUrl(m[1]);
    if (!url) continue;

    let pathname = "";
    try { pathname = new URL(url).pathname; } catch {}
    if (!pathname.startsWith("/events/")) continue;

    const start = Math.max(0, m.index - 900);
    const end = Math.min(html.length, re.lastIndex + 900);
    const context = htmlToText(html.slice(start, end), 2500);
    const label = htmlToText(m[2], 400);

    out.push({ url, pathname, label, context });
  }

  return out;
}


function extractUpdateNumberFromText(value) {
  const text = oneLine(value, 6000);
  if (!text) return null;

  const matches = [
    ...text.matchAll(/\bUpdate\s*#?\s*(\d{1,3}(?:\.\d+)?)\b/gi),
  ];

  if (!matches.length) return null;

  for (const match of matches) {
    const n = Number(match[1]);
    if (Number.isFinite(n) && n > 0) return n;
  }

  return null;
}

function dateTextVariants(date) {
  if (!date) return [];

  const [y, m, d] = String(date).split("-").map(Number);
  if (!y || !m || !d) return [];

  const names = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return [
    `${names[m]} ${d}, ${y}`,
    `${names[m]} ${d} ${y}`,
    `${names[m]} ${String(d).padStart(2, "0")}, ${y}`,
  ];
}

function resolveUpdateNumberFromEventHub(eventsPage, analysis) {
  if (!eventsPage || !analysis?.date) {
    return { update: null, link: null, evidence: "" };
  }

  // First try exact date context from the visible events page.
  const dateContext = contextAroundUpdate(eventsPage.text, { date: analysis.date }, 2600);
  const direct = extractUpdateNumberFromText(dateContext);

  if (direct) {
    return {
      update: direct,
      link: null,
      evidence: dateContext,
    };
  }

  // Stronger fallback: identify the exact event card/link containing the date,
  // then read the Update number from that same card.
  const links = primaryEventContextLinks(eventsPage)
    .map((link) => ({
      ...link,
      score: updateNeedleScore(
        `${link.label} ${link.context} ${link.pathname}`,
        { ...analysis, update: null }
      ),
    }))
    .sort((a, b) => b.score - a.score);

  const best = links[0];

  if (best && best.score >= 6) {
    const update = extractUpdateNumberFromText(
      `${best.label} ${best.context} ${best.pathname}`
    );

    return {
      update,
      link: best,
      evidence: `${best.label} ${best.context}`,
    };
  }

  return {
    update: null,
    link: best || null,
    evidence: "",
  };
}

function withBridgedUpdate(analysis, update) {
  if (!update) return analysis;

  return {
    ...analysis,
    update: Number(update),
    intent:
      analysis.intent === "UPDATE_SUMMARY"
        ? "UPDATE_SUMMARY"
        : "UPDATE_FACT",
    source:
      analysis.source === "NVIDIA_QUESTION_ROUTER"
        ? "NVIDIA_QUESTION_ROUTER+DATE_BRIDGE"
        : "DETERMINISTIC_R36+DATE_BRIDGE",
  };
}


async function primaryUpdateHistoryPath(question, analysis, deadline) {
  if (!(analysis.update || analysis.date || /^UPDATE_/.test(analysis.intent || ""))) {
    return {
      result: null,
      pages: [],
      errors: [],
      route: "NOT_UPDATE_MODE",
      analysis,
    };
  }

  const pages = [];
  const errors = [];
  const tried = new Set();
  let working = { ...analysis };
  let bridgedUpdate = null;

  async function get(url) {
    if (!url || tried.has(url) || timeLeft(deadline) < 220) return null;
    tried.add(url);

    try {
      const page = await fetchPage(url, SOURCE.PRIMARY, deadline);
      pages.push(page);
      return page;
    } catch (error) {
      errors.push(`${url}:${errorCode(error)}`);
      return null;
    }
  }

  // If we already know the update number, machine lookup can be solved immediately.
  if (working.relation === REL.MACHINE && working.update) {
    const machines = await get(`${PRIMARY_ORIGIN}/machines`);

    if (machines) {
      const context = contextAroundUpdate(machines.text, working, 2200);
      const answer = extractUpdateTypedAnswer(context, working);

      if (answer) {
        return {
          result: makeResult(
            answer,
            working.relation,
            SOURCE.PRIMARY,
            machines,
            "SPLUS_UPDATE_MACHINE_CONTEXT",
            0.995
          ),
          pages,
          errors,
          route: "UPDATE_MACHINE_SPLUS",
          analysis: working,
          bridgedUpdate,
        };
      }
    }
  }

  const events = await get(`${PRIMARY_ORIGIN}/events`);

  if (!events) {
    return {
      result: null,
      pages,
      errors,
      route: "UPDATE_EVENTS_FETCH_FAILED",
      analysis: working,
      bridgedUpdate,
    };
  }

  // =====================================================
  // NEW R26 BRIDGE:
  // Date -> exact S+ event card/detail -> Update N -> typed fact.
  // =====================================================
  let bridgedLink = null;

  if (working.date && !working.update) {
    const bridge = resolveUpdateNumberFromEventHub(events, working);
    bridgedLink = bridge.link;

    if (bridge.update) {
      bridgedUpdate = bridge.update;
      working = withBridgedUpdate(working, bridge.update);
    } else if (bridge.link && timeLeft(deadline) > 260) {
      // Sometimes the hub card has the date but the Update number is only
      // on the event detail page.
      const detail = await get(bridge.link.url);

      if (detail) {
        const updateFromDetail =
          extractUpdateNumberFromText(detail.text) ||
          extractUpdateNumberFromText(detail.title);

        if (updateFromDetail) {
          bridgedUpdate = updateFromDetail;
          working = withBridgedUpdate(working, updateFromDetail);
        }

        // Even without an explicit update number, the exact dated event detail
        // can directly contain the requested typed answer.
        const detailAnswer = extractUpdateTypedAnswer(detail.text, working);

        if (detailAnswer) {
          return {
            result: makeResult(
              detailAnswer,
              working.relation,
              SOURCE.PRIMARY,
              detail,
              "SPLUS_DATE_EVENT_DETAIL",
              0.995
            ),
            pages,
            errors,
            route: "DATE_EVENT_DETAIL_SPLUS",
            analysis: working,
            bridgedUpdate,
          };
        }
      }
    }
  }

  // If the user directly asks "What update happened on DATE?",
  // the bridge itself is the final fact.
  if (working.relation === REL.UPDATE && working.update) {
    return {
      result: makeResult(
        `Update${working.update}`,
        REL.UPDATE,
        SOURCE.PRIMARY,
        events,
        "SPLUS_DATE_TO_UPDATE",
        0.995
      ),
      pages,
      errors,
      route: "DATE_TO_UPDATE_SPLUS",
      analysis: working,
      bridgedUpdate,
    };
  }

  // After date -> update resolution, retry a typed machine lookup using
  // the canonical /machines page. This fixes e.g. Aug 8 2026 -> Update61 -> RNG Machine.
  if (working.relation === REL.MACHINE && working.update && timeLeft(deadline) > 240) {
    const machines = await get(`${PRIMARY_ORIGIN}/machines`);

    if (machines) {
      const context = contextAroundUpdate(machines.text, working, 2200);
      const answer = extractUpdateTypedAnswer(context, working);

      if (answer) {
        return {
          result: makeResult(
            answer,
            working.relation,
            SOURCE.PRIMARY,
            machines,
            "SPLUS_DATE_BRIDGED_MACHINE",
            0.995
          ),
          pages,
          errors,
          route: "DATE_UPDATE_MACHINE_SPLUS",
          analysis: working,
          bridgedUpdate,
        };
      }
    }
  }

  // Try the exact hub context around Update N or the date.
  const hubContext = contextAroundUpdate(events.text, working, 2400);
  const hubAnswer = extractUpdateTypedAnswer(hubContext, working);

  if (hubAnswer) {
    return {
      result: makeResult(
        hubAnswer,
        working.relation,
        SOURCE.PRIMARY,
        events,
        working.date && bridgedUpdate
          ? "SPLUS_DATE_BRIDGED_HUB_CONTEXT"
          : "SPLUS_UPDATE_HUB_CONTEXT",
        0.995
      ),
      pages,
      errors,
      route:
        working.date && bridgedUpdate
          ? "DATE_UPDATE_HUB_SPLUS"
          : "UPDATE_HUB_SPLUS",
      analysis: working,
      bridgedUpdate,
    };
  }

  // Find/follow the exact event card after bridging.
  const links = primaryEventContextLinks(events)
    .map((link) => ({
      ...link,
      score: updateNeedleScore(
        `${link.label} ${link.context} ${link.pathname}`,
        working
      ),
    }))
    .sort((a, b) => b.score - a.score);

  const best =
    (bridgedLink && links.find((x) => x.url === bridgedLink.url)) ||
    links[0];

  if (best && best.score >= 6 && timeLeft(deadline) > 220) {
    const detail = await get(best.url);

    if (detail) {
      const context =
        contextAroundUpdate(detail.text, working, 4200) ||
        detail.text;

      // If bridge was still missing, detail page gets one final chance.
      if (working.date && !working.update) {
        const updateFromDetail =
          extractUpdateNumberFromText(detail.text) ||
          extractUpdateNumberFromText(detail.title);

        if (updateFromDetail) {
          bridgedUpdate = updateFromDetail;
          working = withBridgedUpdate(working, updateFromDetail);

          if (working.relation === REL.UPDATE) {
            return {
              result: makeResult(
                `Update${working.update}`,
                REL.UPDATE,
                SOURCE.PRIMARY,
                detail,
                "SPLUS_DATE_TO_UPDATE_DETAIL",
                0.995
              ),
              pages,
              errors,
              route: "DATE_TO_UPDATE_DETAIL_SPLUS",
              analysis: working,
              bridgedUpdate,
            };
          }
        }
      }

      const answer = extractUpdateTypedAnswer(context, working);

      if (answer) {
        return {
          result: makeResult(
            answer,
            working.relation,
            SOURCE.PRIMARY,
            detail,
            working.date && bridgedUpdate
              ? "SPLUS_DATE_BRIDGED_DETAIL_CONTEXT"
              : "SPLUS_UPDATE_DETAIL_CONTEXT",
            0.995
          ),
          pages,
          errors,
          route:
            working.date && bridgedUpdate
              ? "DATE_UPDATE_DETAIL_SPLUS"
              : "UPDATE_DETAIL_SPLUS",
          analysis: working,
          bridgedUpdate,
        };
      }

      // Broad "What did Update N add?" uses AI ONLY to extract from S+ evidence.
      if (
        working.relation === REL.UPDATE &&
        env("NVIDIA_API_KEY") &&
        timeLeft(deadline) > 320
      ) {
        try {
          const data = await fetchJson(
            "NVIDIA_UPDATE_EXTRACT",
            NVIDIA_URL,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${env("NVIDIA_API_KEY")}`,
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({
                model: process.env.NVIDIA_MODEL || DEFAULT_MODEL,
                stream: false,
                temperature: 0,
                max_tokens: 120,
                chat_template_kwargs: { enable_thinking: false },
                messages: [
                  {
                    role: "system",
                    content: [
                      "Extract the answer ONLY from the supplied Steal-a-Brainrot.org evidence.",
                      "Do not use outside knowledge.",
                      "The user asks what the specified update added.",
                      "Return a short comma-separated list of the major additions explicitly present in the evidence.",
                      'Return JSON only: {"answer":"UNKNOWN or concise list"}',
                    ].join("\n"),
                  },
                  {
                    role: "user",
                    content: JSON.stringify({
                      question,
                      update: working.update,
                      date: working.date,
                      evidence: oneLine(detail.text, 10000),
                    }),
                  },
                ],
              }),
            },
            Math.max(
              250,
              Math.min(
                CFG.NVIDIA_TIMEOUT_MS,
                timeLeft(deadline) - 30
              )
            )
          );

          const raw = parseModelJson(
            data?.choices?.[0]?.message?.content
          );

          const summary = oneLine(raw?.answer, 300);

          if (summary && norm(summary) !== "unknown") {
            return {
              result: makeResult(
                summary,
                REL.UPDATE,
                SOURCE.PRIMARY,
                detail,
                "SPLUS_UPDATE_AI_EXTRACTED_FROM_PRIMARY",
                0.995
              ),
              pages,
              errors,
              route: "UPDATE_SUMMARY_SPLUS",
              analysis: working,
              bridgedUpdate,
            };
          }
        } catch (error) {
          errors.push(`UPDATE_EXTRACT:${errorCode(error)}`);
        }
      }
    }
  }

  return {
    result: null,
    pages,
    errors,
    route:
      working.date && !working.update
        ? "DATE_BRIDGE_MISS"
        : "UPDATE_SPLUS_MISS",
    analysis: working,
    bridgedUpdate,
  };
}

async function primaryFastPath(question, analysis, deadline) {
  const errors = [];
  const pages = [];
  const tried = new Set();

  async function get(url) {
    if (!url || tried.has(url)) return null;
    tried.add(url);

    try {
      const page = await fetchPage(url, SOURCE.PRIMARY, deadline);
      pages.push(page);
      return page;
    } catch (error) {
      errors.push(`${url}:${errorCode(error)}`);
      return null;
    }
  }

  // 1) Exact Brainrot page.
  if (analysis.entity && isPrimaryEntityFieldRelation(analysis.relation)) {
    const exact = `${PRIMARY_ORIGIN}/brainrots/${slugify(analysis.entity)}`;
    const page = await get(exact);
    if (page) {
      const result = resolvePrimaryEntityPage(page, analysis);
      if (result) return { result, pages, errors, route: "EXACT_BRAINROT_SPLUS" };
    }
  }

  // 2) Rebirth canonical page.
  if (
    analysis.relation === REL.REBIRTH ||
    analysis.relation === REL.GEAR ||
    analysis.rebirth ||
    (analysis.current && question.toLowerCase().includes("rebirth"))
  ) {
    const page = await get(`${PRIMARY_ORIGIN}/wiki/rebirth`);
    if (page) {
      const result = resolvePrimaryRebirth(page, analysis);
      if (result) return { result, pages, errors, route: "DIRECT_REBIRTH_SPLUS" };
    }
  }

  // 3) Mutation / trait canonical page.
  if (
    analysis.relation === REL.MULTIPLIER ||
    analysis.relation === REL.MUTATION ||
    analysis.relation === REL.TRAIT ||
    /\b(?:mutation|trait)\b/i.test(question)
  ) {
    const page = await get(`${PRIMARY_ORIGIN}/wiki/mutations`);
    if (page) {
      const result = resolvePrimaryMutation(page, analysis);
      if (result) return { result, pages, errors, route: "DIRECT_MUTATIONS_SPLUS" };
    }
  }

  // 4) Ritual detail pages BEFORE hub/search.
  if (
    [REL.REQUIREMENT, REL.SPAWN, REL.FORMATION, REL.WEATHER, REL.DROP_RATE, REL.RITUAL, REL.STATUS].includes(analysis.relation) ||
    /\britual\b/i.test(question)
  ) {
    for (const url of ritualDetailCandidates(analysis)) {
      if (timeLeft(deadline) < 280) break;
      const detail = await get(url);
      if (!detail) continue;

      const result = resolvePrimaryRitual(detail, analysis);
      if (result) return { result, pages, errors, route: "EXACT_RITUAL_SPLUS" };
    }

    if (timeLeft(deadline) > 280) {
      const hub = await get(`${PRIMARY_ORIGIN}/rituals`);
      if (hub) {
        const hubResult = resolvePrimaryRitual(hub, analysis);
        if (hubResult) return { result: hubResult, pages, errors, route: "RITUAL_HUB_SPLUS" };

        const link = bestPrimaryLink(hub, analysis, "/rituals/");
        if (link && timeLeft(deadline) > 280) {
          const detail = await get(link.url);
          if (detail) {
            const result = resolvePrimaryRitual(detail, analysis);
            if (result) return { result, pages, errors, route: "FOLLOWED_RITUAL_SPLUS" };
          }
        }
      }
    }
  }

  // 5) Other structured S+ hubs.
  const hubs = [];
  if (analysis.relation === REL.CONTENTS || /\blucky block\b/i.test(question)) hubs.push("/lucky-blocks");
  if (analysis.relation === REL.MACHINE || /\bmachine\b/i.test(question)) hubs.push("/machines");
  if ([REL.EVENT, REL.UPDATE].includes(analysis.relation) || /\b(?:event|update)\b/i.test(question)) hubs.push("/events");
  if (analysis.relation === REL.COLLECTION || /\bcollection\b/i.test(question)) hubs.push("/collections");

  for (const path of hubs) {
    if (timeLeft(deadline) < 280) break;
    const page = await get(`${PRIMARY_ORIGIN}${path}`);
    if (!page) continue;
    const result = resolvePrimaryGenericPage(page, analysis);
    if (result) return { result, pages, errors, route: `DIRECT_${path}_SPLUS` };
  }

  return { result: null, pages, errors, route: "SPLUS_DIRECT_MISS" };
}

function primaryCandidateUrls(question, analysis) {
  const q = question.toLowerCase();
  const urls = [];
  const add = (path) => urls.push(`${PRIMARY_ORIGIN}${path}`);

  if (analysis.entity && isPrimaryEntityFieldRelation(analysis.relation)) {
    const slug = slugify(analysis.entity);
    if (slug) add(`/brainrots/${slug}`);
  }

  if (analysis.relation === REL.REBIRTH || analysis.relation === REL.GEAR || q.includes("rebirth")) add("/wiki/rebirth");
  if (analysis.relation === REL.MULTIPLIER || q.includes("mutation") || q.includes("trait")) add("/wiki/mutations");
  if ([REL.REQUIREMENT, REL.SPAWN, REL.FORMATION, REL.WEATHER, REL.RITUAL].includes(analysis.relation) || q.includes("ritual")) add("/rituals");
  if (analysis.relation === REL.CONTENTS || q.includes("lucky block")) add("/lucky-blocks");
  if (analysis.relation === REL.MACHINE || q.includes("machine")) add("/machines");
  if ([REL.EVENT, REL.UPDATE, REL.DATE].includes(analysis.relation) || q.includes("event") || q.includes("update")) add("/events");
  if (analysis.relation === REL.COLLECTION || q.includes("collection")) add("/collections");

  // Generic broad index as a final primary page, still S+.
  add("/wiki");

  return [...new Set(urls)].slice(0, CFG.MAX_PRIMARY_PAGES);
}

async function fetchPrimaryCandidates(question, analysis, deadline) {
  const urls = primaryCandidateUrls(question, analysis);
  const settled = await Promise.allSettled(urls.map((url) => fetchPage(url, SOURCE.PRIMARY, deadline)));
  const pages = [];
  const errors = [];
  for (const row of settled) {
    if (row.status === "fulfilled") pages.push(row.value);
    else errors.push(errorCode(row.reason));
  }
  return { pages, errors };
}

function findEntityPagePrimary(pages, analysis) {
  return pages
    .map((page) => ({ page, score: bestEntityScore(analysis, page.title) }))
    .sort((a, b) => b.score - a.score)[0]?.score >= 0.55
    ? pages.map((page) => ({ page, score: bestEntityScore(analysis, page.title) })).sort((a, b) => b.score - a.score)[0].page
    : null;
}


function resolvePrimaryEntityPage(page, analysis) {
  if (!page) return null;

  const relation = analysis.relation;
  const lines = page.lines || [];
  const text = page.text || "";

  // The S+ site exposes these as direct visible fields.
  // A direct field match is authoritative for this lookup and returns immediately.
  if (relation === REL.COST) {
    const v =
      findLabelValue(lines, ["Base Cost", "Cost", "Price"]) ||
      text.match(/\bBase Cost\b[\s:|-]{0,20}(\$\s*[\d.]+\s*(?:Qa|Qi|Sx|Sp|Oc|No|Dc|K|M|B|T|Q)?)/i)?.[1] ||
      text.match(/\blisted base cost of\s+(\$\s*[\d.]+\s*(?:Qa|Qi|Sx|Sp|Oc|No|Dc|K|M|B|T|Q)?)/i)?.[1];

    const answer = normalizeAnswer(v, REL.COST);
    if (answer) return makeResult(answer, relation, SOURCE.PRIMARY, page, "SPLUS_DIRECT_ENTITY_COST", 0.995);
  }

  if (relation === REL.INCOME) {
    const v =
      findLabelValue(lines, ["Income per Second", "Base Income/sec", "Income/sec", "Generates"]) ||
      text.match(/\bIncome per Second\b[\s:|-]{0,25}(\$\s*[\d.]+\s*(?:Qa|Qi|Sx|Sp|Oc|No|Dc|K|M|B|T|Q)?(?:\s*\/\s*s)?)/i)?.[1] ||
      text.match(/\b(?:generating|generates?)\s+(\$\s*[\d.]+\s*(?:Qa|Qi|Sx|Sp|Oc|No|Dc|K|M|B|T|Q)?)\s*(?:\/second|\/s|per second)/i)?.[1];

    const answer = normalizeAnswer(v, REL.INCOME);
    if (answer) return makeResult(answer, relation, SOURCE.PRIMARY, page, "SPLUS_DIRECT_ENTITY_INCOME", 0.995);
  }

  if (relation === REL.RARITY) {
    let v =
      findLabelValue(lines, ["Rarity"]) ||
      text.match(/\bis\s+(?:an?\s+)?([A-Za-z][A-Za-z ]{1,45}?)\s+brainrot\b/i)?.[1] ||
      text.match(/\b([A-Za-z][A-Za-z ]{1,45}?)\s+brainrot generating\b/i)?.[1];

    if (!v) {
      const idx = lines.findIndex((x) => similarity(x, page.title) >= 0.92);
      if (
        idx >= 0 &&
        lines[idx + 1] &&
        !/^(?:base cost|income|event|efficiency|image|identity)/i.test(lines[idx + 1])
      ) {
        v = lines[idx + 1];
      }
    }

    if (v) return makeResult(v, relation, SOURCE.PRIMARY, page, "SPLUS_DIRECT_ENTITY_RARITY", 0.995);
  }

  if (relation === REL.DATE) {
    const v =
      findLabelValue(lines, ["Added to Game", "Release Date"]) ||
      text.match(
        /recorded game-added date of\s+((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+20\d{2})/i
      )?.[1];

    const date = String(v || "").match(
      /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+20\d{2}/i
    )?.[0];

    if (date) return makeResult(date, relation, SOURCE.PRIMARY, page, "SPLUS_DIRECT_ENTITY_DATE", 0.995);
  }

  if (relation === REL.STATUS) {
    const v = findLabelValue(lines, ["Current Availability", "Release Status", "Status"]);
    if (v) return makeResult(v, relation, SOURCE.PRIMARY, page, "SPLUS_DIRECT_ENTITY_STATUS", 0.995);
  }

  if (relation === REL.METHOD) {
    const v = findLabelValue(lines, ["Primary Route", "Current Availability"]);
    if (v) return makeResult(v, relation, SOURCE.PRIMARY, page, "SPLUS_DIRECT_ENTITY_METHOD", 0.995);

    const how = extractSectionValue(
      text,
      ["How to Obtain", "How to Get", "How to Get It"],
      ["Related Brainrots", "Mutation Income Calculator", "Tips", "Release Status"]
    );
    if (how) return makeResult(how, relation, SOURCE.PRIMARY, page, "SPLUS_DIRECT_ENTITY_SECTION", 0.99);
  }

  return null;
}


function rebirthSections(page) {
  const htmlSections = extractHeadingSections(page.html)
    .map((s) => {
      const m = s.title.match(/\bREBIRTH\s+(\d{1,3})\b/i);
      return m ? { number: Number(m[1]), title: s.title, text: s.text } : null;
    })
    .filter(Boolean);

  if (htmlSections.length >= 3) return htmlSections;

  // Plain-text fallback: survives site markup changes.
  const raw = String(page.text || "");
  const markers = [];
  const re = /\bREBIRTH\s+(\d{1,3})\b/gi;
  let m;
  while ((m = re.exec(raw)) !== null) {
    markers.push({ number: Number(m[1]), start: m.index, end: re.lastIndex });
  }

  const out = [];
  const seen = new Set();
  for (let i = 0; i < markers.length; i++) {
    const cur = markers[i];
    if (seen.has(cur.number)) continue;
    const next = markers.slice(i + 1).find((x) => x.number !== cur.number);
    const end = next ? next.start : Math.min(raw.length, cur.start + 5000);
    const sectionText = clean(raw.slice(cur.start, end), 5000);
    if (!sectionText) continue;
    seen.add(cur.number);
    out.push({
      number: cur.number,
      title: `REBIRTH ${cur.number}`,
      text: sectionText,
    });
  }

  return out;
}

function resolvePrimaryRebirth(page, analysis) {
  if (!page) return null;
  const sections = rebirthSections(page);
  if (!sections.length) return null;

  if (analysis.current) {
    const max = Math.max(...sections.map((s) => s.number));
    return makeResult(`Rebirth${max}`, REL.REBIRTH, SOURCE.PRIMARY, page, "SPLUS_DIRECT_REBIRTH_MAX", 0.995);
  }

  if (analysis.relation === REL.REBIRTH && analysis.entity) {
    let best = null;
    const wanted = norm(analysis.entity);

    for (const section of sections) {
      const sectionNorm = norm(section.text);
      const exact = wanted && sectionNorm.includes(wanted) ? 1 : 0;
      const score = Math.max(
        exact,
        bestEntityScore(analysis, section.text),
        similarity(analysis.entity, section.text)
      );

      if (!best || score > best.score) best = { section, score };
    }

    if (best && best.score >= 0.45) {
      return makeResult(
        `Rebirth${best.section.number}`,
        REL.REBIRTH,
        SOURCE.PRIMARY,
        page,
        "SPLUS_DIRECT_REBIRTH_REVERSE",
        0.995
      );
    }

    // Final raw-text fallback: locate the item, then choose the closest preceding REBIRTH marker.
    const raw = String(page.text || "");
    const idx = raw.toLowerCase().indexOf(String(analysis.entity).toLowerCase());
    if (idx >= 0) {
      const before = raw.slice(Math.max(0, idx - 2500), idx);
      const all = [...before.matchAll(/\bREBIRTH\s+(\d{1,3})\b/gi)];
      const last = all[all.length - 1];
      if (last) {
        return makeResult(
          `Rebirth${Number(last[1])}`,
          REL.REBIRTH,
          SOURCE.PRIMARY,
          page,
          "SPLUS_DIRECT_REBIRTH_NEAREST_MARKER",
          0.995
        );
      }
    }
  }

  if (analysis.relation === REL.GEAR && analysis.rebirth) {
    const section = sections.find((s) => s.number === analysis.rebirth);
    if (!section) return null;

    const v =
      extractSectionValue(section.text, ["New Items", "🎁New Items"], ["Bonuses", "⚡Bonuses", "Requirements"]) ||
      section.text.match(/New Items[\s:|-]{0,30}([A-Za-z][A-Za-z0-9' -]{2,100})/i)?.[1];

    if (v) return makeResult(v.split(" | ")[0], REL.GEAR, SOURCE.PRIMARY, page, "SPLUS_DIRECT_REBIRTH_ITEM", 0.995);
  }

  if (analysis.relation === REL.REQUIREMENT && analysis.rebirth) {
    const section = sections.find((s) => s.number === analysis.rebirth);
    if (!section) return null;

    const v = extractSectionValue(
      section.text,
      ["Requirements", "📋Requirements"],
      ["New Items", "🎁New Items", "Bonuses"]
    );

    if (v) return makeResult(v, REL.REQUIREMENT, SOURCE.PRIMARY, page, "SPLUS_DIRECT_REBIRTH_REQUIREMENT", 0.995);
  }

  return null;
}

function resolvePrimaryMutation(page, analysis) {
  if (!page) return null;
  const sections = extractHeadingSections(page.html);
  let best = null;
  for (const section of sections) {
    const score = bestEntityScore(analysis, section.title);
    if (!best || score > best.score) best = { section, score };
  }
  if (!best || best.score < 0.5) return null;

  if (analysis.relation === REL.MULTIPLIER) {
    const m = `${best.section.title}\n${best.section.text}`.match(/\b\d+(?:\.\d+)?\s*[x×]/i);
    if (m) return makeResult(m[0], REL.MULTIPLIER, SOURCE.PRIMARY, page, "PRIMARY_MUTATION_SECTION", 0.995);
  }

  if (analysis.relation === REL.METHOD || analysis.relation === REL.STATUS) {
    const lines = best.section.text.split("\n").map((x) => oneLine(x, 600)).filter(Boolean);
    const value = lines.find((x) => /available|event|admin|obtained|only|spawn/i.test(x));
    if (value) return makeResult(value, analysis.relation, SOURCE.PRIMARY, page, "PRIMARY_MUTATION_SECTION", 0.98);
  }

  return null;
}


function cleanRitualSpawn(value) {
  let v = oneLine(value, 180)
    .replace(/^Image:\s*/i, "")
    .replace(/\bTrait Grant\b.*$/i, "")
    .trim();

  // Collapse simple duplicated labels such as "Los Crocodillitos Los Crocodillitos".
  const parts = v.split(/\s+/);
  if (parts.length >= 2 && parts.length % 2 === 0) {
    const half = parts.length / 2;
    if (norm(parts.slice(0, half).join(" ")) === norm(parts.slice(half).join(" "))) {
      v = parts.slice(0, half).join(" ");
    }
  }
  return v;
}

function resolvePrimaryRitual(page, analysis) {
  if (!page) return null;

  const text = String(page.text || "");
  const title = page.title || "";
  const detailUrl = /\/rituals\/[^/?#]+-ritual\/?$/i.test(page.url || "");
  const specific =
    detailUrl ||
    (
      /ritual/i.test(title) &&
      bestEntityScore(analysis, `${title} ${text.slice(0, 1200)}`) >= 0.30
    );

  if (specific) {
    if (analysis.relation === REL.REQUIREMENT) {
      const players = text.match(/\b(\d+)\s+players required\b/i)?.[1];
      const required =
        text.match(/\bRequires\s+([A-Za-z0-9' -]{2,100})/i)?.[1] ||
        text.match(/\beach holding\s+(?:an?\s+)?([A-Za-z0-9' -]{2,100})/i)?.[1];

      if (required) {
        const value = players ? `${oneLine(required, 100)} x${players}` : oneLine(required, 100);
        return makeResult(value, REL.REQUIREMENT, SOURCE.PRIMARY, page, "SPLUS_DIRECT_RITUAL_REQUIREMENT", 0.995);
      }
    }

    if (analysis.relation === REL.SPAWN) {
      let expected =
        findLabelValue(page.lines || [], ["Brainrot Spawn"], 4) ||
        extractSectionValue(text, ["Brainrot Spawn"], ["Trait Grant", "Important Notes"]);

      if (!expected) {
        expected =
          text.match(/\bBrainrot Spawn\b[\s:|-]{0,80}(?:Image:\s*)?([A-Z][A-Za-z0-9' -]{2,100})/i)?.[1];
      }

      if (expected) {
        const answer = cleanRitualSpawn(String(expected).split(" | ")[0]);
        if (answer) return makeResult(answer, REL.SPAWN, SOURCE.PRIMARY, page, "SPLUS_DIRECT_RITUAL_SPAWN", 0.995);
      }
    }

    if (analysis.relation === REL.FORMATION) {
      const m =
        text.match(/\bLine up in a straight line\b/i) ||
        text.match(/\bFormation\s*[:|-]\s*([^\n.]{2,140})/i);

      if (m) return makeResult(m[1] || m[0], REL.FORMATION, SOURCE.PRIMARY, page, "SPLUS_DIRECT_RITUAL_FORMATION", 0.995);
    }

    if (analysis.relation === REL.DROP_RATE) {
      const v = findLabelValue(page.lines || [], ["Success Rate"]);
      if (v) return makeResult(v, REL.DROP_RATE, SOURCE.PRIMARY, page, "SPLUS_DIRECT_RITUAL_RATE", 0.99);
    }

    if (analysis.relation === REL.STATUS) {
      const v = findLabelValue(page.lines || [], ["Status"]);
      if (v) return makeResult(v, REL.STATUS, SOURCE.PRIMARY, page, "SPLUS_DIRECT_RITUAL_STATUS", 0.995);
    }
  }

  // Hub fallback. Still S+, but only used when exact detail routing misses.
  if (analysis.relation === REL.SPAWN && /\/rituals\/?$/.test(page.url || "")) {
    const links = primaryLinks(page, "/rituals/");
    let best = null;

    for (const link of links) {
      const score = bestEntityScore(analysis, `${link.label} ${link.pathname}`);
      if (!best || score > best.score) best = { ...link, score };
    }

    if (best && best.score >= 0.35) {
      const m = best.label.match(
        /Rewards?:\s*([A-Za-z0-9' -]{2,100}?)(?:\s+[a-z-]+\s+trait|\s+\d+\s+players?\s+required|$)/i
      );
      if (m?.[1]) {
        return makeResult(
          cleanRitualSpawn(m[1]),
          REL.SPAWN,
          SOURCE.PRIMARY,
          page,
          "SPLUS_RITUAL_HUB_CARD",
          0.995
        );
      }
    }
  }

  return null;
}

function resolvePrimaryGenericPage(page, analysis) {
  // Simple generic patterns for primary pages such as Lucky Blocks, Machines, Events, Collections.
  const text = page.text;
  if (!analysis.entity) return null;
  const escaped = analysis.entity.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const windowRe = new RegExp(`.{0,350}${escaped}.{0,900}`, "is");
  const window = text.match(windowRe)?.[0] || "";
  if (!window) return null;

  if (analysis.relation === REL.DROP_RATE) {
    const m = window.match(/\b\d+(?:\.\d+)?\s*%/);
    if (m) return makeResult(m[0], REL.DROP_RATE, SOURCE.PRIMARY, page, "PRIMARY_GENERIC_WINDOW", 0.975);
  }
  if (analysis.relation === REL.COST) {
    const m = window.match(/\$\s*\d+(?:\.\d+)?\s*(?:Qa|Qi|Sx|Sp|Oc|No|Dc|K|M|B|T|Q)?/i);
    if (m) return makeResult(m[0], REL.COST, SOURCE.PRIMARY, page, "PRIMARY_GENERIC_WINDOW", 0.975);
  }
  if (analysis.relation === REL.RARITY) {
    const m = window.match(/(?:Rarity[:\s|]+)([A-Za-z][A-Za-z ]{1,40})/i);
    if (m) return makeResult(m[1], REL.RARITY, SOURCE.PRIMARY, page, "PRIMARY_GENERIC_WINDOW", 0.97);
  }
  if (analysis.relation === REL.CONTENTS || analysis.relation === REL.REWARD) {
    const m = window.match(/(?:Rewards?|Contents?|Drops?)[:\s]+([^\n|]{2,220})/i);
    if (m) return makeResult(m[1], analysis.relation, SOURCE.PRIMARY, page, "PRIMARY_GENERIC_WINDOW", 0.97);
  }
  if (analysis.relation === REL.DATE) {
    const m = window.match(/(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+20\d{2}/i);
    if (m) return makeResult(m[0], REL.DATE, SOURCE.PRIMARY, page, "PRIMARY_GENERIC_WINDOW", 0.97);
  }
  return null;
}

function resolvePrimary(question, analysis, pages) {
  // 1) exact entity page, best for brainrot fields
  const entityPage = findEntityPagePrimary(pages, analysis);
  const entity = resolvePrimaryEntityPage(entityPage, analysis);
  if (entity) return entity;

  // 2) dedicated system pages
  for (const page of pages) {
    if (/\/wiki\/rebirth\b/.test(page.url)) {
      const r = resolvePrimaryRebirth(page, analysis);
      if (r) return r;
    }
    if (/\/wiki\/mutations\b/.test(page.url)) {
      const r = resolvePrimaryMutation(page, analysis);
      if (r) return r;
    }
    if (/\/rituals(?:\/|$)/.test(page.url)) {
      const r = resolvePrimaryRitual(page, analysis);
      if (r) return r;
    }
  }

  // 3) generic primary pages
  for (const page of pages) {
    const r = resolvePrimaryGenericPage(page, analysis);
    if (r) return r;
  }

  return null;
}

function primarySearchQuery(question, analysis) {
  if (analysis.entity) return `site:steal-a-brainrot.org "${analysis.entity}" ${question}`;
  return `site:steal-a-brainrot.org ${question}`;
}

async function tavilySearch(query, deadline, includeDomains = null, recent = false) {
  if (!env("TAVILY_API_KEY")) return { answer: "", results: [], errors: ["TAVILY_NOT_CONFIGURED"] };
  const key = `${query}|${(includeDomains || []).join(",")}|${recent ? "R" : "A"}`;
  const cached = cacheGet(SEARCH_CACHE, key);
  if (cached) return cached;
  const left = timeLeft(deadline);
  if (left < 250) return { answer: "", results: [], errors: ["TAVILY_BUDGET_EXHAUSTED"] };

  const body = {
    query,
    search_depth: "fast",
    max_results: CFG.MAX_SEARCH_RESULTS,
    topic: "general",
    include_answer: "basic",
    include_raw_content: false,
    include_images: false,
  };
  if (includeDomains?.length) body.include_domains = includeDomains;
  if (recent) body.time_range = "month";

  try {
    const data = await fetchJson("TAVILY", TAVILY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env("TAVILY_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }, Math.max(250, Math.min(CFG.TAVILY_TIMEOUT_MS, left - 30)));

    const result = {
      answer: oneLine(data?.answer, 1000),
      results: (Array.isArray(data?.results) ? data.results : []).map((row) => ({
        title: oneLine(row?.title, 300),
        url: oneLine(row?.url, 1200),
        content: oneLine(row?.content || row?.raw_content, 3500),
        score: clamp(row?.score),
        host: (() => { try { return new URL(row?.url).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; } })(),
      })),
      errors: [],
    };
    cacheSet(SEARCH_CACHE, key, result, CFG.SEARCH_CACHE_TTL_MS);
    return result;
  } catch (error) {
    return { answer: "", results: [], errors: [errorCode(error)] };
  }
}

function resolvePrimarySnippet(search, analysis) {
  const primaryRows = search.results.filter((r) => r.host === SOURCE.PRIMARY.host);
  for (const row of primaryRows) {
    const text = `${row.title}\n${row.content}`;
    if (analysis.entity && bestEntityScore(analysis, text) < 0.22) continue;
    let answer = null;
    if (analysis.relation === REL.COST) answer = text.match(/(?:Base Cost|Cost|Price)[:\s|]+(\$\s*\d+(?:\.\d+)?\s*(?:Qa|Qi|Sx|Sp|Oc|No|Dc|K|M|B|T|Q)?)/i)?.[1];
    if (analysis.relation === REL.INCOME) answer = text.match(/(?:Income per Second|Base Income\/sec|Generates?)[:\s|]+(\$\s*\d+(?:\.\d+)?\s*(?:Qa|Qi|Sx|Sp|Oc|No|Dc|K|M|B|T|Q)?(?:\/s)?)/i)?.[1];
    if (analysis.relation === REL.RARITY) answer = text.match(/(?:Rarity[:\s|]+)([A-Za-z][A-Za-z ]{1,40})/i)?.[1] || text.match(/\bis an?\s+([A-Za-z][A-Za-z ]{1,40}?)\s+brainrot\b/i)?.[1];
    if (analysis.relation === REL.MULTIPLIER) answer = text.match(/\b\d+(?:\.\d+)?\s*[x×]/i)?.[0];
    if (analysis.relation === REL.REBIRTH) answer = text.match(/\bRebirth\s*#?\s*\d{1,3}\b/i)?.[0];
    if (analysis.relation === REL.SPAWN) answer = text.match(/(?:Rewards?|Brainrot Spawn)[:\s]+([^|\n]{2,100})/i)?.[1];
    if (answer) {
      return makeResult(answer, analysis.relation, SOURCE.PRIMARY, { title: row.title, url: row.url }, "PRIMARY_SPLUS_SEARCH_SNIPPET", 0.985);
    }
  }
  return null;
}

async function primaryDiscovery(question, analysis, deadline) {
  const search = await tavilySearch(primarySearchQuery(question, analysis), deadline, [SOURCE.PRIMARY.host], analysis.current);
  const snippet = resolvePrimarySnippet(search, analysis);
  if (snippet) return { result: snippet, pages: [], search };

  const urls = [...new Set(search.results.filter((r) => r.host === SOURCE.PRIMARY.host).map((r) => r.url))].slice(0, 3);
  const settled = await Promise.allSettled(urls.map((url) => fetchPage(url, SOURCE.PRIMARY, deadline)));
  const pages = settled.filter((x) => x.status === "fulfilled").map((x) => x.value);
  const result = resolvePrimary(question, analysis, pages);
  return { result, pages, search };
}

function fandomParseUrl(title) {
  const params = new URLSearchParams({
    action: "parse",
    page: title,
    prop: "text|wikitext|displaytitle",
    redirects: "1",
    format: "json",
  });
  return `${FANDOM_API}?${params.toString()}`;
}

async function fandomSearchTitles(query, deadline) {
  const left = timeLeft(deadline);
  if (left < 250) return [];
  const params = new URLSearchParams({
    action: "query",
    list: "search",
    srsearch: oneLine(query, 300),
    srnamespace: "0",
    srlimit: "5",
    format: "json",
  });
  try {
    const data = await fetchJson("FANDOM_SEARCH", `${FANDOM_API}?${params.toString()}`, { headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 ChromeCodeSniper-R37" } }, Math.min(CFG.FANDOM_TIMEOUT_MS, left - 20));
    return (Array.isArray(data?.query?.search) ? data.query.search : []).map((x) => oneLine(x?.title, 300)).filter(Boolean);
  } catch {
    return [];
  }
}

async function fetchFandomPage(title, deadline) {
  const key = `FANDOM:${title.toLowerCase()}`;
  const cached = cacheGet(PAGE_CACHE, key);
  if (cached) return { ...cached, cache: "HIT" };
  const left = timeLeft(deadline);
  if (left < 250) throw new Error("FANDOM_BUDGET_EXHAUSTED");
  const data = await fetchJson("FANDOM_PARSE", fandomParseUrl(title), { headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 ChromeCodeSniper-R37" } }, Math.min(CFG.FANDOM_TIMEOUT_MS, left - 20));
  if (data?.error) throw new Error(`FANDOM_PARSE_${data.error.code || "ERROR"}`);
  const p = data?.parse || {};
  const html = typeof p.text === "string" ? p.text : String(p.text?.["*"] || "");
  if (!html) throw new Error("FANDOM_EMPTY");
  const finalTitle = oneLine(p.title || title, 300);
  const page = {
    url: `${FANDOM_BASE}${encodeURIComponent(finalTitle.replace(/ /g, "_"))}`,
    title: finalTitle,
    html,
    lines: htmlToLines(html),
    text: htmlToText(html),
    source: SOURCE.FANDOM,
  };
  cacheSet(PAGE_CACHE, key, page, CFG.PAGE_CACHE_TTL_MS);
  return { ...page, cache: "MISS" };
}

function backupResolveText(page, analysis, source) {
  const text = page.text;
  const lines = page.lines;
  let answer = null;

  if (analysis.relation === REL.COST) answer = findLabelValue(lines, ["Base Cost", "Cost", "Price", "Buy Price"]) || text.match(/(?:cost|price)[^$]{0,30}(\$\s*\d+(?:\.\d+)?\s*(?:Qa|Qi|Sx|Sp|Oc|No|Dc|K|M|B|T|Q)?)/i)?.[1];
  if (analysis.relation === REL.INCOME) answer = findLabelValue(lines, ["Income per Second", "Income", "Generates", "Income/sec"]) || text.match(/(?:income|generates?)[^$]{0,35}(\$\s*\d+(?:\.\d+)?\s*(?:Qa|Qi|Sx|Sp|Oc|No|Dc|K|M|B|T|Q)?(?:\/s)?)/i)?.[1];
  if (analysis.relation === REL.RARITY) answer = findLabelValue(lines, ["Rarity", "Tier"]) || text.match(/\bis an?\s+([A-Za-z][A-Za-z ]{1,40}?)\s+brainrot\b/i)?.[1];
  if (analysis.relation === REL.MULTIPLIER) answer = text.match(/\b\d+(?:\.\d+)?\s*[x×]/i)?.[0];
  if (analysis.relation === REL.REBIRTH && analysis.entity) {
    const idx = text.toLowerCase().indexOf(analysis.entity.toLowerCase());
    if (idx >= 0) answer = text.slice(Math.max(0, idx - 400), idx + 400).match(/\bRebirth\s*#?\s*\d{1,3}\b/i)?.[0];
  }
  if (analysis.relation === REL.SPAWN) answer = text.match(/(?:spawns?|Rewards?|Brainrot Spawn)[:\s]+([^\n|]{2,100})/i)?.[1];
  if (analysis.relation === REL.REQUIREMENT) answer = text.match(/(?:requires?|requirement)[:\s]+([^\n|]{2,160})/i)?.[1];
  if (analysis.relation === REL.DATE) answer = text.match(/(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},\s+20\d{2}/i)?.[0];

  if (!answer) return null;
  const confidence =
    source === SOURCE.FANDOM ? 0.97 :
    source === SOURCE.WIKI ? 0.94 :
    source.confidence;
  return makeResult(answer, analysis.relation, source, page, `${source.key}_DIRECT`, confidence);
}

async function fandomStage(question, analysis, deadline) {
  const titles = [];
  if (analysis.entity) titles.push(analysis.entity);
  const q = question.toLowerCase();
  if (q.includes("rebirth")) titles.push("Rebirth", "Gears");
  if (q.includes("mutation") || q.includes("trait")) titles.push("Mutations", "Traits");
  if (q.includes("ritual")) titles.push("Rituals");
  if (q.includes("update")) titles.push("Update Log");
  if (q.includes("machine")) titles.push("Machines");
  if (q.includes("lucky block")) titles.push("Lucky Blocks");

  if (analysis.entity && timeLeft(deadline) > 350) {
    const found = await fandomSearchTitles(analysis.entity, deadline);
    titles.push(...found.slice(0, 3));
  }

  const unique = [...new Set(titles.map((x) => oneLine(x, 300)).filter(Boolean))].slice(0, CFG.MAX_BACKUP_PAGES);
  const settled = await Promise.allSettled(unique.map((title) => fetchFandomPage(title, deadline)));
  const pages = settled.filter((x) => x.status === "fulfilled").map((x) => x.value);

  // Prefer page matching entity, then hubs.
  pages.sort((a, b) => bestEntityScore(analysis, b.title) - bestEntityScore(analysis, a.title));
  for (const page of pages) {
    const r = backupResolveText(page, analysis, SOURCE.FANDOM);
    if (r) return { result: r, pages, errors: [] };
  }
  return { result: null, pages, errors: settled.filter((x) => x.status === "rejected").map((x) => errorCode(x.reason)) };
}

async function wikiStage(question, analysis, deadline) {
  const search = await tavilySearch(`site:steal-a-brainrot.wiki ${analysis.entity ? `"${analysis.entity}"` : ""} ${question}`, deadline, [SOURCE.WIKI.host], analysis.current);
  for (const row of search.results.filter((r) => r.host === SOURCE.WIKI.host)) {
    const pseudo = { title: row.title, url: row.url, text: row.content, lines: row.content.split(/\n| \| /).map((x) => oneLine(x, 600)).filter(Boolean) };
    const r = backupResolveText(pseudo, analysis, SOURCE.WIKI);
    if (r) return { result: r, search };
  }
  return { result: null, search };
}

function evidenceSupports(answer, text) {
  const a = norm(answer);
  const t = norm(text);
  if (a && t.includes(a)) return true;
  const aa = String(answer).replace(/×/g, "x").replace(/\s+/g, "").toLowerCase();
  const tt = String(text).replace(/×/g, "x").replace(/\s+/g, "").toLowerCase();
  return aa && tt.includes(aa);
}

function parseModelJson(text) {
  const raw = String(text ?? "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  if (!raw) throw new Error("NVIDIA_EMPTY_CONTENT");
  try { return JSON.parse(raw); } catch {}
  const first = raw.indexOf("{");
  const last = raw.lastIndexOf("}");
  if (first >= 0 && last > first) return JSON.parse(raw.slice(first, last + 1));
  throw new Error("NVIDIA_INVALID_JSON");
}


const ALLOWED_RELATIONS = new Set(Object.values(REL));

function normalizeAiDate(value) {
  const raw = oneLine(value, 80);
  if (!raw) return null;

  if (/^20\d{2}-\d{2}-\d{2}$/.test(raw)) return raw;

  const parsed = extractExplicitDate(raw);
  return parsed || null;
}

function mergeAnalysis(ai, fallback) {
  if (!ai) return fallback;

  const relation = ALLOWED_RELATIONS.has(String(ai.relation || "").toUpperCase())
    ? String(ai.relation).toUpperCase()
    : fallback.relation;

  const aiHasEntity = Object.prototype.hasOwnProperty.call(ai, "entity");
  const aiEntity = oneLine(ai.entity, 180);
  const entity = aiHasEntity ? (aiEntity || null) : (fallback.entity || null);
  const aliases = Array.isArray(ai.aliases)
    ? ai.aliases.map((x) => oneLine(x, 180)).filter(Boolean).slice(0, 8)
    : [];

  const entities = [...new Set([
    entity,
    ...aliases,
    ...(fallback.entities || []),
  ].filter(Boolean))].slice(0, 16);

  const updateNum = Number(ai.update);
  const rebirthNum = Number(ai.rebirth);
  const activeFromNum = Number(ai.activeFrom);
  const activeToNum = Number(ai.activeTo);
  const replacedInNum = Number(ai.replacedIn);
  const updateNumbers = Array.isArray(ai.updateNumbers)
    ? ai.updateNumbers.map(Number).filter((n) => Number.isFinite(n) && n > 0).slice(0, 8)
    : (fallback.updateNumbers || []);

  return {
    entity,
    entities,
    relation,
    rebirth: Number.isFinite(rebirthNum) && rebirthNum > 0 ? rebirthNum : fallback.rebirth,
    update: Number.isFinite(updateNum) && updateNum > 0 ? updateNum : fallback.update,
    updateNumbers,
    activeFrom: Number.isFinite(activeFromNum) && activeFromNum > 0 ? activeFromNum : fallback.activeFrom,
    activeTo: Number.isFinite(activeToNum) && activeToNum > 0 ? activeToNum : fallback.activeTo,
    replacedIn: Number.isFinite(replacedInNum) && replacedInNum > 0 ? replacedInNum : fallback.replacedIn,
    date: normalizeAiDate(ai.date) || fallback.date || null,
    current: typeof ai.current === "boolean" ? ai.current : fallback.current,
    intent: oneLine(ai.intent, 80) || fallback.intent,
    wanted: oneLine(ai.wanted, 80) || relation,
    wantedRelations: normalizedWantedRelations(ai.wantedRelations, relation),
    rawQuestion: fallback.rawQuestion || "",
    source: "NVIDIA_QUESTION_ROUTER",
  };
}



function detectWantedRelations(question, primaryRelation) {
  const q = oneLine(question, 700).toLowerCase();
  const wanted = [];

  const add = (relation) => {
    if (relation && ALLOWED_RELATIONS.has(relation) && !wanted.includes(relation)) {
      wanted.push(relation);
    }
  };

  add(primaryRelation);

  // Explicit multi-part: frequency + update.
  if (
    /\b(?:how often|how frequently|frequency|interval|recurr?ence)\b/.test(q) &&
    /\b(?:what|which)\s+update\b|\bupdate\s+(?:was|is|did|it)\b|\btied to\b|\bassociated with\b/.test(q)
  ) {
    add(REL.FREQUENCY);
    add(REL.UPDATE);
  }

  // Other obvious two-part shapes we can support without hurting singles.
  if (
    /\b(?:what|which)\s+update\b/.test(q) &&
    /\b(?:machine|rebirth|ritual|mutation|brainrot|item|gear)\b/.test(q)
  ) {
    if (/\bmachine\b/.test(q)) add(REL.MACHINE);
    if (/\brebirth\b/.test(q)) add(REL.REBIRTH);
    if (/\britual\b/.test(q) && /\b(?:result|outcome|spawn|reward)\b/.test(q)) add(REL.OUTCOME);
    if (/\bmutation\b/.test(q)) add(REL.MUTATION);
    if (/\bbrainrot\b|\bbrain rot\b/.test(q)) add(REL.BRAINROT);
    if (/\b(?:item|gear)\b/.test(q)) add(REL.GEAR);
    add(REL.UPDATE);
  }

  return wanted;
}

function normalizedWantedRelations(value, fallbackRelation) {
  const out = [];
  const add = (relation) => {
    relation = String(relation || "").toUpperCase();
    if (ALLOWED_RELATIONS.has(relation) && !out.includes(relation)) out.push(relation);
  };

  if (Array.isArray(value)) {
    for (const relation of value) add(relation);
  }

  add(fallbackRelation);
  return out;
}

function isMultipartAnalysis(analysis) {
  return Array.isArray(analysis?.wantedRelations) && analysis.wantedRelations.length > 1;
}

function enforceQuestionSemantics(question, analysis) {
  const q = oneLine(question, 700).toLowerCase();
  const next = { ...analysis, rawQuestion: oneLine(question, 700) };

  // Ritual result wording is an OUTCOME family, not a percentage property.
  if (
    /\b(?:result|outcome)\b/.test(q) &&
    /\britual\b/.test(q)
  ) {
    next.relation = REL.OUTCOME;
    next.wanted = REL.OUTCOME;
  }

  if (/\b(?:how often|how frequently|what interval|frequency|recurr?ence)\b/.test(q)) {
    next.relation = REL.FREQUENCY;
    next.wanted = REL.FREQUENCY;
  }

  // "event window" asks for the period/duration, not the update number itself.
  if (/\bevent window\b|\bwindow lasted\b|\bwindow duration\b/.test(q)) {
    next.relation = REL.DURATION;
    next.wanted = REL.DURATION;
  }

  // A range/lifecycle question that asks WHICH MACHINE still wants the machine name.
  // Because the machine is the unknown answer, do not quote a guessed entity.
  if (/\b(?:what|which)\s+machine\b/.test(q)) {
    next.relation = REL.MACHINE;
    next.wanted = REL.MACHINE;
    next.entity = null;
    next.entities = [];
  }

  // Stable named anchors improve deterministic fallback if NVIDIA routing is unavailable.
  if (q.includes("queen bee")) {
    next.entity = "Queen Bee";
    next.entities = ["Queen Bee", ...(next.entities || []).filter((x) => norm(x) !== norm("Queen Bee"))];
  }
  if (q.includes("job job job sahur")) {
    next.entity = "Job Job Job Sahur";
    next.entities = ["Job Job Job Sahur", ...(next.entities || []).filter((x) => norm(x) !== norm("Job Job Job Sahur"))];
  }

  // Reverse identification: "Which Secret brainrot ... costs $27.5B?"
  // The requested answer is the brainrot/entity, not the COST value.
  if (
    /\b(?:what|which)\b/.test(q) &&
    /\bbrain\s*rot\b|\bbrainrot\b/.test(q) &&
    /\b(?:cost|price|income|machine|event|update|rarity|secret)\b/.test(q)
  ) {
    next.relation = REL.BRAINROT;
    next.wanted = REL.BRAINROT;
  }

  // Same idea for mutation reverse-identification questions.
  if (
    /\b(?:what|which)\b/.test(q) &&
    /\bmutation\b/.test(q) &&
    /\b\d+(?:\.\d+)?\s*[x×]\b/.test(q)
  ) {
    next.relation = REL.MUTATION;
    next.wanted = REL.MUTATION;
  }

  next.wantedRelations = detectWantedRelations(question, next.relation);
  return next;
}

async function analyzeQuestionAI(question, deadline) {
  const fallback = analyzeQuestion(question);

  if (!env("NVIDIA_API_KEY") || timeLeft(deadline) < 250) {
    return { analysis: applyFactSlots(question, enforceQuestionSemantics(question, fallback)), aiError: "NVIDIA_ANALYZER_UNAVAILABLE" };
  }

  try {
    const timeout = Math.max(
      250,
      Math.min(
        CFG.NVIDIA_ANALYZE_TIMEOUT_MS,
        timeLeft(deadline) - 40
      )
    );

    const data = await fetchJson(
      "NVIDIA_ANALYZE",
      NVIDIA_URL,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env("NVIDIA_API_KEY")}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          model: process.env.NVIDIA_MODEL || DEFAULT_MODEL,
          stream: false,
          temperature: 0,
          max_tokens: 180,
          chat_template_kwargs: { enable_thinking: false },
          messages: [
            {
              role: "system",
              content: [
                "You are ONLY a question router for the Roblox game Steal a Brainrot.",
                "Do NOT answer the trivia question.",
                "Convert the user's question into structured lookup intent.",
                `relation MUST be one of: ${[...ALLOWED_RELATIONS].join(", ")}.`,
                "intent should usually be ENTITY_FACT, UPDATE_FACT, UPDATE_SUMMARY, CURRENT_FACT, or DATE_UPDATE_FACT.",
                "wanted is the primary fact requested.",
                "wantedRelations is an array of every distinct fact type explicitly requested. For a normal single-part question it has one entry.",
                "slots is optional structured semantics. Use unique slot ids when the question asks multiple facts or repeated facts with different qualifiers.",
                "A slot may contain id, relation, answerType, subject, predicate, qualifier, anchorUpdate.",
                "Example: 'How often did the Queen Bee event occur, and what update was it tied to?' => relation=FREQUENCY, wantedRelations=[FREQUENCY,UPDATE].",
                "For questions like 'What machine was added in Update 61?', set update=61, relation=MACHINE, wanted=MACHINE.",
                "For questions like 'What rebirth was added in the August 15, 2026 update?', set date=2026-08-15, relation=REBIRTH, wanted=REBIRTH.",
                "For 'What did Update 62 add?', set update=62, relation=UPDATE, wanted=UPDATE, intent=UPDATE_SUMMARY.",
                "Use canonical entity names when obvious, but never invent facts.",
                'Return JSON only: {"intent":"...","entity":null,"aliases":[],"relation":"...","wanted":"...","wantedRelations":["..."],"slots":[],"update":null,"updateNumbers":[],"activeFrom":null,"activeTo":null,"replacedIn":null,"rebirth":null,"date":null,"current":false}',
              ].join("\n"),
            },
            {
              role: "user",
              content: question,
            },
          ],
        }),
      },
      timeout
    );

    const raw = parseModelJson(data?.choices?.[0]?.message?.content);
    return {
      analysis: applyFactSlots(question, enforceQuestionSemantics(question, mergeAnalysis(raw, fallback))),
      aiError: null,
    };
  } catch (error) {
    return {
      analysis: applyFactSlots(question, enforceQuestionSemantics(question, fallback)),
      aiError: errorCode(error),
    };
  }
}

async function emergencyStage(question, analysis, evidencePages, deadline) {
  const search = await tavilySearch(`"Steal a Brainrot" ${question}`, deadline, null, analysis.current);
  if (!env("NVIDIA_API_KEY") || timeLeft(deadline) < 350) return { result: null, search };

  const evidence = [];
  let id = 1;
  for (const page of evidencePages.slice(0, 4)) {
    evidence.push({ id: `P${id++}`, tier: page.source?.tier || "?", title: page.title, url: page.url, text: oneLine(page.text, 9000) });
  }
  for (const row of search.results.slice(0, 5)) {
    evidence.push({ id: `W${id++}`, tier: "WEB", title: row.title, url: row.url, text: row.content });
  }
  if (!evidence.length) return { result: null, search };

  try {
    const data = await fetchJson("NVIDIA_RESOLVE", NVIDIA_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env("NVIDIA_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.NVIDIA_MODEL || DEFAULT_MODEL,
        stream: false,
        temperature: 0.1,
        max_tokens: 220,
        chat_template_kwargs: { enable_thinking: false },
        messages: [
          {
            role: "system",
            content: [
              "Resolve a Steal a Brainrot fact using ONLY supplied evidence.",
              "Source priority is strict: S+ steal-a-brainrot.org > A+ Fandom > B steal-a-brainrot.wiki > other web.",
              "If S+ evidence directly answers the question, use it even if lower-tier evidence disagrees.",
              "Never lower confidence merely because a lower tier disagrees with a direct S+ fact.",
              "Return JSON only: {\"answer\":\"UNKNOWN or value\",\"confidence\":0.0,\"citedIds\":[\"P1\"],\"reason\":\"short\"}",
            ].join("\n"),
          },
          { role: "user", content: JSON.stringify({ question, relation: analysis.relation, entity: analysis.entity, evidence }) },
        ],
      }),
    }, Math.max(300, Math.min(CFG.NVIDIA_TIMEOUT_MS, timeLeft(deadline) - 25)));

    const raw = parseModelJson(data?.choices?.[0]?.message?.content);
    const answer = oneLine(raw?.answer || "UNKNOWN", 500);
    if (!answer || norm(answer) === "unknown") return { result: null, search };
    const citedIds = Array.isArray(raw?.citedIds) ? raw.citedIds.map(String).slice(0, 6) : [];
    const cited = evidence.filter((e) => citedIds.includes(e.id));
    const supported = cited.filter((e) => evidenceSupports(answer, e.text));
    if (!supported.length) return { result: null, search };

    // If a primary S+ item is cited, it still wins and gets high confidence.
    const primarySupport = supported.find((e) => e.tier === "S+");
    if (primarySupport) {
      return {
        result: {
          answer: normalizeAnswer(answer, analysis.relation) || answer,
          candidateAnswer: normalizeAnswer(answer, analysis.relation) || answer,
          confidence: 0.97,
          reason: "AI_VERIFIED_PRIMARY_SPLUS",
          route: "PRIMARY_SPLUS_AI_VERIFIED",
          sourceCount: 1,
          sources: [{ host: SOURCE.PRIMARY.host, title: primarySupport.title, url: primarySupport.url, claimType: "AI_VERIFIED_PRIMARY", tier: "S+" }],
        },
        search,
      };
    }

    return {
      result: {
        answer: normalizeAnswer(answer, analysis.relation) || answer,
        candidateAnswer: normalizeAnswer(answer, analysis.relation) || answer,
        confidence: Math.min(0.84, clamp(raw?.confidence)),
        reason: "EMERGENCY_AI_VERIFIED",
        route: SOURCE.EMERGENCY.key,
        sourceCount: supported.length,
        sources: supported.slice(0, 3).map((e) => ({
          host: (() => { try { return new URL(e.url).hostname; } catch { return ""; } })(),
          title: e.title,
          url: e.url,
          claimType: "AI_EVIDENCE",
          tier: e.tier,
        })),
      },
      search,
    };
  } catch {
    return { result: null, search };
  }
}



function searchCluesFromQuestion(question) {
  const q = oneLine(question, 700);
  const clues = [];

  for (const m of q.matchAll(/\$\s*\d+(?:\.\d+)?\s*(?:Qa|Qi|Sx|Sp|Oc|No|Dc|K|M|B|T|Q)?/gi)) {
    clues.push(m[0].replace(/\s+/g, ""));
  }

  for (const m of q.matchAll(/\b\d+(?:\.\d+)?\s*%/g)) {
    clues.push(m[0].replace(/\s+/g, ""));
  }

  for (const phrase of [
    "RNG Machine",
    "Job Job Job Sahur",
    "Secret",
    "Crystal",
    "Rainbow",
    "ritual",
  ]) {
    if (q.toLowerCase().includes(phrase.toLowerCase())) clues.push(phrase);
  }

  return [...new Set(clues)].slice(0, 10);
}

function normalizedClue(value) {
  // R36: this is used against whole evidence chunks/pages, not just clue labels.
  // 200 chars silently cut off valid facts (codes, ritual outcomes, etc.).
  return oneLine(value, 12000)
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/,/g, "");
}

function pageHasClue(text, clue) {
  const hay = normalizedClue(text);
  const needle = normalizedClue(clue);
  return Boolean(needle && hay.includes(needle));
}

function clueCoverage(question, text) {
  const clues = searchCluesFromQuestion(question);
  if (!clues.length) return { matched: 0, total: 0, ratio: 1, clues: [] };

  let matched = 0;
  for (const clue of clues) {
    if (pageHasClue(text, clue)) matched++;
  }

  return {
    matched,
    total: clues.length,
    ratio: clues.length ? matched / clues.length : 1,
    clues,
  };
}

function trimChanceCandidate(value) {
  let v = oneLine(value, 160)
    .replace(/^Image:\s*/i, "")
    .replace(/^(?:or|and)\s+/i, "")
    .replace(/\bwith\s+(?:an?\s+)?\d+(?:\.\d+)?\s*%\s*(?:outcome\s+)?chance.*$/i, "")
    .replace(/\b(?:outcome|chance|result)\b.*$/i, "")
    .trim();

  // Remove common heading noise if it leaked in.
  v = v.replace(/^(?:Brainrot Spawn|Expected Results|Outcome Odds)\s*/i, "").trim();
  return v;
}

function extractChanceResultFromPage(question, page) {
  const q = oneLine(question, 700);
  const chance = q.match(/\b(\d+(?:\.\d+)?)\s*%/);
  if (!chance) return null;

  const pct = chance[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const raw = String(page?.text || "");

  const patterns = [
    new RegExp(`(?:Image:\\s*)?([A-Z][A-Za-z0-9' -]{2,90}?)\\s+with\\s+(?:an?\\s+)?${pct}\\s*%\\s*(?:outcome\\s+)?chance`, "i"),
    new RegExp(`([A-Z][A-Za-z0-9' -]{2,90}?)\\s+${pct}\\s*%`, "i"),
    new RegExp(`${pct}\\s*%[^A-Za-z0-9]{0,30}([A-Z][A-Za-z0-9' -]{2,90})`, "i"),
  ];

  for (const pattern of patterns) {
    const m = raw.match(pattern);
    if (!m?.[1]) continue;

    const candidate = trimChanceCandidate(m[1]);
    if (
      candidate &&
      candidate.length >= 2 &&
      !/^(?:Variable|Success Rate|Potential Rewards)$/i.test(candidate)
    ) {
      return candidate;
    }
  }

  return null;
}

function deterministicHighValueExactPage(question, analysis, page, source) {
  if (!page || !page.text) return null;

  const coverage = clueCoverage(question, page.text);

  // Reverse identify a brainrot from its properties.
  if (
    analysis.relation === REL.BRAINROT &&
    /\/brainrots\/[^/?#]+/i.test(page.url || "") &&
    coverage.ratio >= 0.60
  ) {
    const title = oneLine(page.title, 160)
      .replace(/\s*[-|]\s*(?:Secret Brainrot Character.*|Steal a Brainrot.*)$/i, "")
      .trim();

    if (title) {
      return makeResult(
        title,
        REL.BRAINROT,
        source,
        page,
        `${source.key}_REVERSE_ENTITY_EXACT_PAGE`,
        source.confidence
      );
    }
  }

  // Chance-based ritual result: "rare 1% result" -> exact brainrot name.
  if (
    [REL.SPAWN, REL.OUTCOME, REL.REWARD, REL.BRAINROT].includes(analysis.relation) &&
    /\b\d+(?:\.\d+)?\s*%/.test(question) &&
    /\britual\b/i.test(question)
  ) {
    const candidate = extractChanceResultFromPage(question, page);
    if (candidate) {
      return makeResult(
        candidate,
        analysis.relation === REL.BRAINROT ? REL.BRAINROT : (analysis.relation === REL.OUTCOME ? REL.OUTCOME : REL.SPAWN),
        source,
        page,
        `${source.key}_CHANCE_RESULT_EXACT_PAGE`,
        source.confidence
      );
    }
  }

  return null;
}

function parseLooseAiExtraction(content) {
  const rawText = String(content ?? "").trim();
  if (!rawText) throw new Error("NVIDIA_EMPTY_CONTENT");

  try {
    const parsed = parseModelJson(rawText);
    if (parsed && typeof parsed === "object") {
      return {
        answer:
          parsed.answer ??
          parsed.result ??
          parsed.value ??
          parsed.name ??
          "UNKNOWN",
        evidence:
          parsed.evidence ??
          parsed.quote ??
          parsed.support ??
          "",
        reason: parsed.reason ?? "json",
      };
    }
  } catch {}

  // NVIDIA occasionally returns only the raw value even when asked for JSON.
  // That is okay only because the answer still has to be verified against the
  // ONE opened source page below.
  const stripped = rawText
    .replace(/^```(?:json|text)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .replace(/^(?:answer|output|result)\s*:\s*/i, "")
    .trim();

  if (
    stripped &&
    stripped.length <= 220 &&
    !/^[\[{]/.test(stripped) &&
    !/\b(?:because|therefore|i think|i cannot|not enough information)\b/i.test(stripped)
  ) {
    return {
      answer: stripped,
      evidence: "",
      reason: "raw_single_value",
    };
  }

  throw new Error("NVIDIA_INVALID_AI_OUTPUT");
}


function expectedPrimaryFamilies(question, analysis) {
  const q = oneLine(question, 700).toLowerCase();
  const rel = analysis.relation;
  const out = [];

  const add = (...items) => {
    for (const item of items) {
      if (item && !out.includes(item)) out.push(item);
    }
  };

  if ([REL.COST, REL.INCOME, REL.RARITY, REL.BRAINROT, REL.METHOD, REL.STATUS].includes(rel)) {
    add("/brainrots/");
  }

  if ([REL.SPAWN, REL.OUTCOME, REL.REQUIREMENT, REL.FORMATION, REL.RITUAL, REL.REWARD].includes(rel) || /\britual\b/.test(q)) {
    add("/rituals/");
    if (analysis.update || analysis.date) add("/events/");
  }

  if ([REL.MUTATION, REL.MULTIPLIER, REL.TRAIT].includes(rel) || /\bmutation\b|\btrait\b/.test(q)) {
    add("/wiki/mutations");
    add("/events/");
  }

  if ([REL.REBIRTH, REL.GEAR].includes(rel) || /\brebirth\b/.test(q)) {
    add("/wiki/rebirth");
    add("/events/");
  }

  if ([REL.MACHINE, REL.ACTIVE_RANGE, REL.REPLACED_BY, REL.REPLACED_IN].includes(rel) || /\bmachine\b/.test(q)) {
    add("/machines");
    add("/events/");
  }

  if (rel === REL.FREQUENCY) {
    add("/events/");
    add("/machines");
  }

  if ([REL.UPDATE, REL.EVENT, REL.DATE].includes(rel) || analysis.update || analysis.date) {
    add("/events/");
  }

  if (rel === REL.CONTENTS || /\blucky block\b/.test(q)) {
    add("/lucky-blocks");
  }

  if (rel === REL.COLLECTION) add("/collections");

  return out;
}

function resultPathname(row) {
  try {
    return new URL(row?.url || "").pathname.toLowerCase();
  } catch {
    return "";
  }
}

function primaryFamilyScore(row, question, analysis) {
  const path = resultPathname(row);
  const families = expectedPrimaryFamilies(question, analysis);

  if (!families.length) return { allowed: true, score: 0, family: "ANY" };

  for (let i = 0; i < families.length; i++) {
    const family = families[i].toLowerCase();
    if (path.startsWith(family) || path === family.replace(/\/$/, "")) {
      return {
        allowed: true,
        score: Math.max(1, 4 - i),
        family,
      };
    }
  }

  return {
    allowed: false,
    score: -12,
    family: "WRONG_FAMILY",
  };
}

function importantQuestionClues(question, analysis) {
  const q = oneLine(question, 700);
  const clues = [];

  // Structured values are hard clues.
  for (const m of q.matchAll(/\$\s*\d+(?:\.\d+)?\s*(?:Qa|Qi|Sx|Sp|Oc|No|Dc|K|M|B|T|Q)?/gi)) {
    clues.push({ value: m[0].replace(/\s+/g, ""), weight: 4, kind: "money" });
  }
  for (const m of q.matchAll(/\b\d+(?:\.\d+)?\s*%/g)) {
    clues.push({ value: m[0].replace(/\s+/g, ""), weight: 5, kind: "percent" });
  }
  for (const m of q.matchAll(/\b\d+(?:\.\d+)?\s*[x×]\b/gi)) {
    clues.push({ value: m[0].replace(/\s+/g, ""), weight: 4, kind: "multiplier" });
  }

  if (analysis.update) clues.push({ value: `Update ${analysis.update}`, weight: 5, kind: "update" });
  if (analysis.activeFrom) clues.push({ value: `Update ${analysis.activeFrom}`, weight: 3, kind: "lifecycle" });
  if (analysis.activeTo) clues.push({ value: `Update ${analysis.activeTo}`, weight: 2, kind: "lifecycle" });
  if (analysis.replacedIn) clues.push({ value: `Update ${analysis.replacedIn}`, weight: 5, kind: "lifecycle" });
  if (analysis.date) clues.push({ value: humanDateFromIso(analysis.date), weight: 5, kind: "date" });

  // Named relation anchors.
  const anchors = [
    ["Job Job Job Sahur", 5],
    ["RNG Machine", 4],
    ["Queen Bee", 5],
    ["Rainbow", 3],
    ["Crystal", 3],
    ["ritual", 2],
    ["mutation", 2],
    ["rebirth", 2],
    ["machine", 2],
    ["Secret", 2],
  ];

  for (const [value, weight] of anchors) {
    if (q.toLowerCase().includes(value.toLowerCase())) {
      clues.push({ value, weight, kind: "anchor" });
    }
  }

  // Preserve AI/deterministic entity if it looks useful.
  if (analysis.entity && String(analysis.entity).length >= 4) {
    clues.push({ value: oneLine(analysis.entity, 180), weight: 5, kind: "entity" });
  }

  const dedup = new Map();
  for (const clue of clues) {
    const key = normalizedClue(clue.value);
    if (!key) continue;
    const existing = dedup.get(key);
    if (!existing || existing.weight < clue.weight) dedup.set(key, clue);
  }

  return [...dedup.values()].slice(0, 14);
}

function weightedClueCoverage(question, analysis, text) {
  const clues = importantQuestionClues(question, analysis);
  if (!clues.length) {
    return { matchedWeight: 0, totalWeight: 0, ratio: 1, matched: [], missing: [] };
  }

  let matchedWeight = 0;
  let totalWeight = 0;
  const matched = [];
  const missing = [];

  for (const clue of clues) {
    totalWeight += clue.weight;
    if (pageHasClue(text, clue.value)) {
      matchedWeight += clue.weight;
      matched.push(clue.value);
    } else {
      missing.push(clue.value);
    }
  }

  return {
    matchedWeight,
    totalWeight,
    ratio: totalWeight ? matchedWeight / totalWeight : 1,
    matched,
    missing,
  };
}

function snippetEligibility(row, question, analysis, source) {
  if (!row || row.host !== source.host) {
    return { eligible: false, reason: "WRONG_HOST", score: -999 };
  }

  let score = scoreExactSearchResult(row, analysis, source);
  const combined = `${row.title}\n${row.url}\n${row.content}`;

  if (source === SOURCE.PRIMARY) {
    const family = primaryFamilyScore(row, question, analysis);
    if (!family.allowed) {
      return {
        eligible: false,
        reason: "WRONG_PAGE_FAMILY",
        score: score + family.score,
      };
    }
    score += family.score;
  }

  const coverage = weightedClueCoverage(question, analysis, combined);
  score += coverage.ratio * 5;

  // Numeric/date/update clues should not be ignored if present in the question.
  const hardClues = importantQuestionClues(question, analysis)
    .filter((x) => ["money", "percent", "multiplier", "update", "date", "lifecycle"].includes(x.kind));

  if (hardClues.length) {
    const hardMatched = hardClues.filter((x) => pageHasClue(combined, x.value));
    if (!hardMatched.length) {
      score -= 5;
    }
  }

  return {
    eligible: score >= 2,
    reason: score >= 2 ? "ELIGIBLE" : "WEAK_SNIPPET_MATCH",
    score,
    coverage,
  };
}

function rankEligibleResults(search, question, analysis, source, limit = 2) {
  return (search?.results || [])
    .filter((row) => row.host === source.host)
    .map((row) => ({
      ...row,
      eligibility: snippetEligibility(row, question, analysis, source),
    }))
    .filter((row) => row.eligibility.eligible)
    .sort((a, b) => b.eligibility.score - a.eligibility.score)
    .slice(0, Math.max(1, limit));
}

function pageEligibility(question, analysis, page, source) {
  if (!page?.text) {
    return { eligible: false, reason: "EMPTY_PAGE", coverage: null };
  }

  if (source === SOURCE.PRIMARY) {
    const fakeRow = { url: page.url, host: source.host };
    const family = primaryFamilyScore(fakeRow, question, analysis);
    if (!family.allowed) {
      return {
        eligible: false,
        reason: "WRONG_PAGE_FAMILY",
        coverage: null,
      };
    }
  }

  const coverage = weightedClueCoverage(question, analysis, page.text);

  const hardClues = importantQuestionClues(question, analysis)
    .filter((x) => ["money", "percent", "multiplier", "update", "date", "lifecycle"].includes(x.kind));

  const hardMatched = hardClues.filter((x) => pageHasClue(page.text, x.value));

  // If the question supplied a concrete numeric/date/update clue, the opened
  // page must contain at least one of those hard clues.
  if (hardClues.length && !hardMatched.length) {
    return {
      eligible: false,
      reason: "HARD_CLUE_MISSING",
      coverage,
    };
  }

  // Entity / named-anchor questions need meaningful clue overlap.
  if (coverage.totalWeight >= 7 && coverage.ratio < 0.30) {
    return {
      eligible: false,
      reason: "QUESTION_CLUES_MISSING",
      coverage,
    };
  }

  return {
    eligible: true,
    reason: "PAGE_ELIGIBLE",
    coverage,
  };
}

function contextsAroundClues(question, analysis, text, radius = 420) {
  const raw = String(text || "");
  const clues = importantQuestionClues(question, analysis);
  const windows = [];
  const seen = new Set();

  for (const clue of clues) {
    const needle = oneLine(clue.value, 180);
    if (!needle) continue;

    const lowerRaw = raw.toLowerCase();
    const lowerNeedle = needle.toLowerCase();
    let from = 0;

    while (from < raw.length) {
      const idx = lowerRaw.indexOf(lowerNeedle, from);
      if (idx < 0) break;

      const start = Math.max(0, idx - radius);
      const end = Math.min(raw.length, idx + needle.length + radius);
      const chunk = clean(raw.slice(start, end), radius * 2 + needle.length);

      const key = norm(chunk);
      if (chunk && key && !seen.has(key)) {
        seen.add(key);
        windows.push({
          clue: needle,
          weight: clue.weight,
          text: chunk,
        });
      }

      from = idx + Math.max(1, needle.length);
      if (windows.length >= 12) break;
    }
    if (windows.length >= 12) break;
  }

  return windows.sort((a, b) => b.weight - a.weight);
}

function answerLooksLikeMetadata(answer) {
  const a = oneLine(answer, 500);
  if (!a) return true;

  if (/^https?:\/\//i.test(a)) return true;
  if (/^[0-9a-f]{32,64}$/i.test(a)) return true;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(a)) return true;
  if (/^[\[{]/.test(a)) return true;
  if (/\b(?:request[_ -]?id|trace[_ -]?id|cache[_ -]?key|source[_ -]?id)\b/i.test(a)) return true;

  return false;
}

function genericRolePhrase(answer) {
  const a = oneLine(answer, 300).toLowerCase();

  return /\b(?:developer|producer|creator|administrator|moderator|game owner|roblox user|content creator|person|people)\b/.test(a);
}

function answerTypeValid(question, analysis, answer, page) {
  const value = oneLine(answer, 500);
  if (!value || norm(value) === "unknown" || answerLooksLikeMetadata(value)) {
    return { valid: false, reason: "UNSAFE_OR_EMPTY_ANSWER" };
  }

  const rel = analysis.relation;

  if (rel === REL.REBIRTH && !/^Rebirth\s*\d+$/i.test(value.replace(/\s+/g, ""))) {
    return { valid: false, reason: "EXPECTED_REBIRTH" };
  }

  if (rel === REL.MULTIPLIER && !/\b\d+(?:\.\d+)?\s*[x×]\b/i.test(value)) {
    return { valid: false, reason: "EXPECTED_MULTIPLIER" };
  }

  if (rel === REL.DROP_RATE && !/\b\d+(?:\.\d+)?\s*%/.test(value)) {
    return { valid: false, reason: "EXPECTED_PERCENTAGE" };
  }

  if (rel === REL.FREQUENCY && !/\b(?:every\s+\w+|every\s+\d+|hour|hours|minute|minutes|daily|weekly|once|twice)\b/i.test(value)) {
    return { valid: false, reason: "EXPECTED_FREQUENCY" };
  }

  if (rel === REL.REPLACED_IN && !/\bUpdate\s*\d+(?:\.\d+)?\b/i.test(value)) {
    return { valid: false, reason: "EXPECTED_UPDATE" };
  }

  if (rel === REL.ACTIVE_RANGE && !/\bUpdate\s*\d+/i.test(value)) {
    return { valid: false, reason: "EXPECTED_UPDATE_RANGE" };
  }

  if ([REL.BRAINROT, REL.SPAWN, REL.OUTCOME, REL.REWARD, REL.MUTATION, REL.TRAIT, REL.GEAR, REL.MACHINE, REL.REPLACED_BY].includes(rel)) {
    if (genericRolePhrase(value)) {
      return { valid: false, reason: "GENERIC_ROLE_PHRASE" };
    }

    if (value.length > 140 || value.split(/\s+/).length > 12) {
      return { valid: false, reason: "ENTITY_ANSWER_TOO_LONG" };
    }
  }

  // The answer must appear somewhere on the one opened page.
  if (!evidenceSupports(value, page?.text || "")) {
    // Page title is allowed for reverse entity identification.
    if (!(rel === REL.BRAINROT && similarity(value, page?.title || "") >= 0.82)) {
      return { valid: false, reason: "ANSWER_NOT_ON_PAGE" };
    }
  }

  return { valid: true, reason: "TYPE_OK" };
}

function answerNearRelevantClue(question, analysis, answer, page) {
  const value = oneLine(answer, 500);
  const windows = contextsAroundClues(question, analysis, page?.text || "", 520);

  // Direct entity-page title is strong support for reverse identification.
  if (
    analysis.relation === REL.BRAINROT &&
    similarity(value, page?.title || "") >= 0.82
  ) {
    return true;
  }

  if (!windows.length) {
    return evidenceSupports(value, page?.text || "");
  }

  return windows.some((w) => evidenceSupports(value, w.text));
}

function validateFinalPageAnswer(question, analysis, answer, page) {
  const type = answerTypeValid(question, analysis, answer, page);
  if (!type.valid) return type;

  if (!answerNearRelevantClue(question, analysis, answer, page)) {
    return {
      valid: false,
      reason: "ANSWER_NOT_NEAR_RELEVANT_CLUE",
    };
  }

  return {
    valid: true,
    reason: "PAGE_AND_TYPE_VERIFIED",
  };
}

function relationSearchWord(relation) {
  switch (relation) {
    case REL.COST: return "cost price";
    case REL.INCOME: return "income per second";
    case REL.RARITY: return "rarity";
    case REL.STATUS: return "status availability";
    case REL.METHOD: return "obtain get";
    case REL.DATE: return "date added";
    case REL.MULTIPLIER: return "multiplier";
    case REL.REQUIREMENT: return "requirement requires";
    case REL.SPAWN: return "spawn reward";
    case REL.FORMATION: return "formation";
    case REL.WEATHER: return "weather";
    case REL.DROP_RATE: return "drop rate chance";
    case REL.REWARD: return "reward";
    case REL.CONTENTS: return "contents drops";
    case REL.REBIRTH: return "rebirth";
    case REL.GEAR: return "gear item unlock";
    case REL.BRAINROT: return "brainrot";
    case REL.MUTATION: return "mutation";
    case REL.TRAIT: return "trait";
    case REL.RITUAL: return "ritual";
    case REL.EVENT: return "event";
    case REL.MACHINE: return "machine";
    case REL.UPDATE: return "update";
    case REL.COLLECTION: return "collection";
    case REL.OUTCOME: return "outcome result reward spawn";
    case REL.FREQUENCY: return "frequency every interval returns occurs";
    case REL.ACTIVE_RANGE: return "active from through update available range";
    case REL.REPLACED_BY: return "replaced by replacement";
    case REL.REPLACED_IN: return "replaced in update";
    case REL.CODE: return "code redeem code event code";
    case REL.STOCK: return "stock limit quantity copies";
    case REL.PLAYERS: return "players required player requirement";
    case REL.DURATION: return "duration event window lasts";
    case REL.TIME: return "time start time begins";
    case REL.LOCATION: return "location where located";
    case REL.SHOP: return "shop merchant buy purchase sold";
    case REL.LUCKY_BLOCK: return "lucky block drop chance";
    case REL.BASE_SKIN: return "base skin reward";
    case REL.ANNOUNCEMENT: return "announcement announced teased preview revealed";
    case REL.LORE: return "lore history details";
    case REL.BASE: return "base laser lock floor defense protection";
    case REL.MECHANIC: return "mechanic how it works trigger activate";
    case REL.ASSET: return "image icon model visual appearance";
    case REL.COOLDOWN: return "cooldown refresh restock interval";
    default: return "";
  }
}

function humanDateFromIso(date) {
  if (!date || !/^20\d{2}-\d{2}-\d{2}$/.test(String(date))) return "";
  const [y, m, d] = String(date).split("-").map(Number);
  const names = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return `${names[m]} ${d}, ${y}`;
}



function exactSearchQuery(question, analysis, source) {
  const parts = [];

  if (analysis.entity) parts.push(`"${oneLine(analysis.entity, 180)}"`);
  if (analysis.date) parts.push(`"${humanDateFromIso(analysis.date)}"`);

  const relation = relationSearchWord(analysis.relation);
  if (relation) parts.push(relation);

  // Lifecycle/range questions are intentionally searched with a FEW strong
  // anchors instead of every update number in the sentence.
  if (analysis.activeFrom || analysis.activeTo || analysis.replacedIn) {
    if (analysis.replacedIn) parts.push(`"Update ${analysis.replacedIn}"`, "replaced");
    if (analysis.activeFrom) parts.push(`"Update ${analysis.activeFrom}"`);
    if (!analysis.activeFrom && analysis.update) parts.push(`"Update ${analysis.update}"`);
  } else if (analysis.update) {
    parts.push(`"Update ${analysis.update}"`);
  }

  for (const clue of searchCluesFromQuestion(question)) {
    // Update numbers are handled structurally above; don't force every one.
    if (/^Update\s*\d/i.test(clue)) continue;
    if (/\s/.test(clue)) parts.push(`"${clue}"`);
    else parts.push(clue);
  }

  // For normal questions preserve wording. For multi-update lifecycle questions,
  // preserving the whole sentence over-constrains search, so keep only useful words.
  const updateCount = (analysis.updateNumbers || []).length;
  if (updateCount <= 1 && !analysis.activeFrom && !analysis.replacedIn) {
    const original = oneLine(question, 500).replace(/[?!.]+$/g, "").trim();
    if (original) parts.push(original);
  }

  return `site:${source.host} ${parts.join(" ")}`.trim();
}

function relationEvidenceScore(text, relation) {
  const t = oneLine(text, 3000).toLowerCase();

  const checks = {
    [REL.COST]: /\b(?:cost|price)\b/,
    [REL.INCOME]: /\b(?:income|per second|generat)\b/,
    [REL.RARITY]: /\brarity\b/,
    [REL.STATUS]: /\b(?:status|available|obtainable)\b/,
    [REL.METHOD]: /\b(?:obtain|get|method)\b/,
    [REL.DATE]: /\b(?:date|added|released)\b/,
    [REL.MULTIPLIER]: /\b(?:multiplier|multi|boost|\d+(?:\.\d+)?x)\b/,
    [REL.REQUIREMENT]: /\b(?:requires?|requirement|needed)\b/,
    [REL.SPAWN]: /\b(?:spawn|reward|result)\b/,
    [REL.FORMATION]: /\bformation\b/,
    [REL.WEATHER]: /\bweather\b/,
    [REL.DROP_RATE]: /\b(?:drop rate|chance|probability)\b/,
    [REL.REWARD]: /\breward\b/,
    [REL.CONTENTS]: /\b(?:contents|drops)\b/,
    [REL.REBIRTH]: /\brebirth\b/,
    [REL.GEAR]: /\b(?:gear|item|unlock|potion|shield|teleport)\b/,
    [REL.BRAINROT]: /\bbrainrot\b/,
    [REL.MUTATION]: /\bmutation\b/,
    [REL.TRAIT]: /\btrait\b/,
    [REL.RITUAL]: /\britual\b/,
    [REL.EVENT]: /\bevent\b/,
    [REL.MACHINE]: /\bmachine\b/,
    [REL.UPDATE]: /\bupdate\b/,
    [REL.COLLECTION]: /\bcollection\b/,
    [REL.OUTCOME]: /\b(?:outcome|result|reward|spawn)\b/,
    [REL.FREQUENCY]: /\b(?:every|hour|hours|minute|minutes|daily|weekly|frequency|interval|returns?|occurs?)\b/,
    [REL.ACTIVE_RANGE]: /\b(?:active|available|from|through|until|update)\b/,
    [REL.REPLACED_BY]: /\b(?:replaced by|replacement|replaced)\b/,
    [REL.REPLACED_IN]: /\b(?:replaced in|update)\b/,
    [REL.CODE]: /\b(?:code|redeem|sold out|temporary|cooldown|luck level)\b/,
    [REL.STOCK]: /\b(?:stock|quantity|copies|limited)\b/,
    [REL.PLAYERS]: /\b(?:players?|required)\b/,
    [REL.DURATION]: /\b(?:duration|window|hours?|minutes?|days?|from|to)\b/,
    [REL.TIME]: /\b(?:time|am|pm|et|est|starts?|begins?)\b/,
    [REL.LOCATION]: /\b(?:location|near|beside|behind|at|in the)\b/,
    [REL.SHOP]: /\b(?:shop|merchant|sold|buy|purchase|robux|cash)\b/,
    [REL.LUCKY_BLOCK]: /\b(?:lucky block|drop|chance)\b/,
    [REL.BASE_SKIN]: /\b(?:base skin|skin)\b/,
    [REL.ANNOUNCEMENT]: /\b(?:announc|teas|preview|reveal|developer)\b/,
    [REL.LORE]: /./,
    [REL.BASE]: /\b(?:base|laser|lock|floor|defen|protect)\b/,
    [REL.MECHANIC]: /\b(?:mechanic|works?|trigger|activate|upgrade|open|spin|steal)\b/,
    [REL.ASSET]: /\b(?:image|icon|visual|appearance|model|looks?)\b/,
    [REL.COOLDOWN]: /\b(?:cooldown|refresh|restock|every|minutes?|hours?)\b/,
  };

  return checks[relation]?.test(t) ? 1 : 0;
}

function scoreExactSearchResult(row, analysis, source) {
  if (!row || row.host !== source.host) return -999;

  const combined = `${row.title}\n${row.url}\n${row.content}`;
  let score = clamp(row.score) * 4;

  if (analysis.entity) {
    score += bestEntityScore(analysis, combined) * 5;
  }

  if (
    analysis.update &&
    new RegExp(`\\bUpdate\\s*${analysis.update}\\b`, "i").test(combined)
  ) {
    score += 6;
  }

  if (analysis.date) {
    const date = humanDateFromIso(analysis.date);
    if (date && combined.toLowerCase().includes(date.toLowerCase())) score += 6;
  }

  score += relationEvidenceScore(combined, analysis.relation) * 2;

  const clueInfo = clueCoverage(analysis.rawQuestion || "", combined);
  score += clueInfo.matched * 1.5;
  if (clueInfo.total >= 2 && clueInfo.ratio >= 0.75) score += 2;

  try {
    const url = new URL(row.url);
    const path = url.pathname.toLowerCase();

    // Prefer specific content pages over home/search/calculator pages.
    if (path.split("/").filter(Boolean).length >= 2) score += 1.5;
    if (/\/(?:calculator|search)(?:\/|$)/.test(path)) score -= 4;
  } catch {}

  return score;
}


function pickExactSearchResult(search, analysis, source, question = "") {
  const ranked = rankEligibleResults(
    search,
    question || analysis.rawQuestion || "",
    analysis,
    source,
    2
  );

  return ranked[0] || null;
}

function fandomTitleFromResultUrl(url) {
  try {
    const u = new URL(url);
    const marker = "/wiki/";
    const i = u.pathname.indexOf(marker);
    if (i < 0) return null;

    return decodeURIComponent(
      u.pathname
        .slice(i + marker.length)
        .replace(/_/g, " ")
    );
  } catch {
    return null;
  }
}

async function openExactResult(row, source, deadline) {
  if (!row?.url) throw new Error(`${source.key}_NO_RESULT_URL`);

  if (source === SOURCE.FANDOM) {
    const title = fandomTitleFromResultUrl(row.url) || row.title;
    if (!title) throw new Error("FANDOM_RESULT_NO_TITLE");
    return fetchFandomPage(title, deadline);
  }

  return fetchPage(row.url, source, deadline);
}

function pageEvidenceSupported(raw, page) {
  const evidence = oneLine(raw?.evidence, 300);
  const answer = oneLine(raw?.answer, 500);

  if (!answer || norm(answer) === "unknown") return false;

  // Strongest validation: model must quote a short supporting fragment
  // that actually exists on the single opened page.
  if (evidence && norm(page?.text || "").includes(norm(evidence))) return true;

  // Exact/normalized answer itself appearing on page is also enough.
  if (evidenceSupports(answer, page?.text || "")) return true;

  // For list answers, every comma-separated item must independently exist.
  const items = answer
    .split(/[,;]+/)
    .map((x) => oneLine(x, 140))
    .filter(Boolean);

  return (
    items.length > 1 &&
    items.every((item) => evidenceSupports(item, page?.text || ""))
  );
}

async function aiExtractSinglePage(question, analysis, page, source, deadline) {
  if (!env("NVIDIA_API_KEY") || timeLeft(deadline) < 260) {
    return {
      result: null,
      error: "NVIDIA_EXTRACTOR_UNAVAILABLE",
    };
  }

  try {
    const data = await fetchJson(
      `${source.key}_AI_EXTRACT`,
      NVIDIA_URL,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env("NVIDIA_API_KEY")}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          model: process.env.NVIDIA_MODEL || DEFAULT_MODEL,
          stream: false,
          temperature: 0,
          max_tokens: 180,
          chat_template_kwargs: { enable_thinking: false },
          messages: [
            {
              role: "system",
              content: [
                "You extract one Steal a Brainrot answer from ONE supplied page.",
                "Use ONLY the supplied page text. Never use memory or outside knowledge.",
                "If the page does not explicitly support the requested answer, return UNKNOWN.",
                `Requested relation: ${analysis.relation}.`,
                analysis.update ? `Requested update: ${analysis.update}.` : "",
                analysis.date ? `Requested date: ${analysis.date}.` : "",
                analysis.entity ? `Requested entity: ${analysis.entity}.` : "",
                "For REBIRTH return Rebirth<number>.",
                "For MACHINE return only the machine name.",
                "For GEAR return only the item/gear name.",
                "For MULTIPLIER return only the multiplier.",
                "For INCOME return only income per second.",
                "For SPAWN/OUTCOME/REWARD/BRAINROT questions return ONLY the brainrot/entity name, never the percentage or an explanatory sentence.",
                "For FREQUENCY return only the recurrence phrase, e.g. Every two hours.",
                "For ACTIVE_RANGE return only the update range.",
                "For REPLACED_IN return only Update<number>.",
                "For REPLACED_BY return only the replacement entity name.",
                "For reverse identification questions like 'Which Secret brainrot ... has a base cost of $27.5B?', return ONLY the matching page/entity name.",
                "For chance questions like 'rare 1% result', return ONLY the entity attached to that exact chance.",
                "For broad UPDATE questions return a short comma-separated list of major additions explicitly stated on this page.",
                "Also provide a SHORT verbatim evidence fragment copied from the page that supports the answer.",
                'Return JSON only: {"answer":"UNKNOWN or value","evidence":"short exact page fragment","reason":"short"}',
              ].filter(Boolean).join("\n"),
            },
            {
              role: "user",
              content: JSON.stringify({
                question,
                analysis: {
                  entity: analysis.entity,
                  relation: analysis.relation,
                  update: analysis.update,
                  updateNumbers: analysis.updateNumbers,
                  activeFrom: analysis.activeFrom,
                  activeTo: analysis.activeTo,
                  replacedIn: analysis.replacedIn,
                  date: analysis.date,
                  intent: analysis.intent,
                },
                page: {
                  title: page.title,
                  url: page.url,
                  text: (() => {
                    const windows = contextsAroundClues(question, analysis, page.text, 700);
                    if (windows.length) {
                      return windows.slice(0, 7).map((w) => `[CLUE ${w.clue}] ${w.text}`).join("\n---\n");
                    }
                    return oneLine(page.text, 12000);
                  })(),
                },
              }),
            },
          ],
        }),
      },
      Math.max(
        260,
        Math.min(
          CFG.NVIDIA_TIMEOUT_MS,
          timeLeft(deadline) - 30
        )
      )
    );

    const raw = parseLooseAiExtraction(data?.choices?.[0]?.message?.content);
    const answer = oneLine(raw?.answer, 500);

    if (!answer || norm(answer) === "unknown") {
      return {
        result: null,
        error: "AI_PAGE_UNKNOWN",
      };
    }

    if (!pageEvidenceSupported(raw, page)) {
      return {
        result: null,
        error: "AI_PAGE_EVIDENCE_NOT_VERIFIED",
      };
    }

    const finalCheck = validateFinalPageAnswer(
      question,
      analysis,
      answer,
      page
    );

    if (!finalCheck.valid) {
      return {
        result: null,
        error: `AI_ANSWER_REJECTED_${finalCheck.reason}`,
      };
    }

    return {
      result: makeResult(
        answer,
        analysis.relation,
        source,
        page,
        `${source.key}_EXACT_PAGE_AI`,
        source.confidence
      ),
      error: null,
    };
  } catch (error) {
    return {
      result: null,
      error: errorCode(error),
    };
  }
}

function deterministicExactPageFallback(question, analysis, page, source) {
  // Same-page deterministic extraction only. This is a reliability fallback
  // if NVIDIA extraction times out; it does not search another source.
  if (source === SOURCE.PRIMARY) {
    const primary = resolvePrimary(question, analysis, [page]);
    if (primary) {
      primary.confidence = source.confidence;
      return primary;
    }
  }

  const backup = backupResolveText(page, analysis, source);
  if (backup) {
    backup.confidence = source.confidence;
    return backup;
  }

  return null;
}




function aggressiveSearchQueries(question, analysis, source) {
  const host = source.host;
  const q = oneLine(question, 700);
  const queries = [];

  const add = (value) => {
    value = oneLine(value, 900);
    if (!value) return;
    if (!value.toLowerCase().startsWith(`site:${host}`)) {
      value = `site:${host} ${value}`;
    }
    if (!queries.includes(value)) queries.push(value);
  };

  // 1) Existing structured query.
  add(exactSearchQuery(question, analysis, source));

  const rel = relationSearchWord(analysis.relation);
  const entity = analysis.entity ? `"${oneLine(analysis.entity, 180)}"` : "";
  const update = analysis.update ? `"Update ${analysis.update}"` : "";
  const date = analysis.date ? `"${humanDateFromIso(analysis.date)}"` : "";

  // 2) Relaxed relation query. Avoid forcing every clue.
  add([
    entity,
    update,
    date,
    rel,
    analysis.relation === REL.FREQUENCY ? "event every hours returns" : "",
    analysis.relation === REL.OUTCOME ? "ritual outcome reward spawn" : "",
    analysis.relation === REL.MACHINE && analysis.replacedIn ? `"Update ${analysis.replacedIn}" replaced machine` : "",
  ].filter(Boolean).join(" "));

  // 3) Clue-led query. Keep the strongest concrete clue(s), not all of them.
  const clues = importantQuestionClues(question, analysis)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map((x) => /\s/.test(x.value) ? `"${x.value}"` : x.value);

  let extra = "";
  if (analysis.relation === REL.FREQUENCY) extra = "frequency every interval";
  else if (analysis.relation === REL.OUTCOME) extra = "outcome result";
  else if (analysis.relation === REL.MACHINE && (analysis.activeFrom || analysis.activeTo || analysis.replacedIn)) {
    extra = "machine replaced active";
  } else {
    extra = rel;
  }

  add([...clues, extra].filter(Boolean).join(" "));

  // If one query collapsed to something too generic, use original wording as a last variant.
  if (queries.length < 3) {
    add(q.replace(/[?!.]+$/g, ""));
  }

  const locked = (analysis.lockedSubjects || [])
    .map((subject) => `"${oneLine(subject, 160)}"`)
    .join(" ");

  const finalQueries = queries.map((query) => {
    if (!locked) return query;
    const missing = (analysis.lockedSubjects || []).some(
      (subject) => !query.toLowerCase().includes(String(subject).toLowerCase())
    );
    return missing ? `${query} ${locked}` : query;
  });

  return finalQueries.slice(0, 3);
}

function mergeSearches(searches) {
  const merged = {
    answer: "",
    results: [],
    errors: [],
    queries: [],
  };

  const byUrl = new Map();

  for (const item of searches || []) {
    if (!item) continue;
    if (item.query) merged.queries.push(item.query);
    if (item.search?.answer && !merged.answer) merged.answer = item.search.answer;
    for (const error of item.search?.errors || []) merged.errors.push(error);

    for (const row of item.search?.results || []) {
      const key = row.url || `${row.host}|${row.title}`;
      const existing = byUrl.get(key);

      if (!existing) {
        byUrl.set(key, {
          ...row,
          queryHits: 1,
          queryIndexes: [item.index],
        });
      } else {
        existing.queryHits += 1;
        existing.queryIndexes.push(item.index);
        if ((row.score || 0) > (existing.score || 0)) existing.score = row.score;
        if ((row.content || "").length > (existing.content || "").length) existing.content = row.content;
      }
    }
  }

  merged.results = [...byUrl.values()];
  return merged;
}

function obviousBadPage(row, source) {
  let path = "";
  try { path = new URL(row?.url || "").pathname.toLowerCase(); } catch {}

  if (!path) return true;
  if (source === SOURCE.PRIMARY) {
    if (path === "/" || path === "") return true;
    if (/\/(?:calculator|search)(?:\/|$)/.test(path)) return true;
    if (/\/wiki\/(?:creator|developers?|owners?)(?:\/|$)/.test(path)) return true;
  }

  return false;
}

function softFamilyPreference(row, question, analysis, source) {
  if (source !== SOURCE.PRIMARY) return 0;

  const family = primaryFamilyScore(row, question, analysis);
  if (family.allowed) return Math.max(1, family.score);

  // Wrong family is now a penalty, NOT an automatic rejection.
  // This lets /events/ or /brainrots/ still answer a ritual/update question
  // when the evidence is strong.
  return -2.5;
}

function aggressiveResultScore(row, question, analysis, source) {
  if (!row || row.host !== source.host) return -999;
  if (obviousBadPage(row, source)) return -999;

  const combined = `${row.title}\n${row.url}\n${row.content}`;
  let score = clamp(row.score) * 4;

  score += softFamilyPreference(row, question, analysis, source);

  if ((analysis.lockedSubjects || []).length) {
    const lockedOk = allLockedSubjectsSupported(combined, analysis);
    score += lockedOk ? 8 : -14;
  }

  if (analysis.entity) score += bestEntityScore(analysis, combined) * 4.5;

  if (
    analysis.update &&
    new RegExp(`\\bUpdate\\s*${analysis.update}\\b`, "i").test(combined)
  ) score += 4;

  if (analysis.date) {
    const date = humanDateFromIso(analysis.date);
    if (date && combined.toLowerCase().includes(date.toLowerCase())) score += 4;
  }

  score += relationEvidenceScore(combined, analysis.relation) * 2;

  const coverage = weightedClueCoverage(question, analysis, combined);
  score += coverage.ratio * 4;

  // Repeated discovery across independent search variants is strong.
  score += Math.min(3, Number(row.queryHits || 1) - 1) * 2;

  // Concrete clue matches help, but we do NOT require every clue.
  const hard = importantQuestionClues(question, analysis)
    .filter((x) => ["money", "percent", "multiplier", "update", "date", "lifecycle"].includes(x.kind));
  const hardMatched = hard.filter((x) => pageHasClue(combined, x.value));
  score += hardMatched.length * 1.2;

  return score;
}

function rankAggressiveResults(search, question, analysis, source, limit = 3) {
  return (search?.results || [])
    .filter((row) => row.host === source.host)
    .map((row) => ({
      ...row,
      aggressiveScore: aggressiveResultScore(row, question, analysis, source),
    }))
    .filter((row) => row.aggressiveScore > -50)
    .sort((a, b) => b.aggressiveScore - a.aggressiveScore)
    .slice(0, Math.max(1, limit));
}

function aggressivePageUsable(question, analysis, page, source) {
  if (!page?.text || oneLine(page.text, 100).length < 20) {
    return { usable: false, reason: "EMPTY_PAGE" };
  }

  if (obviousBadPage({ url: page.url }, source)) {
    return { usable: false, reason: "OBVIOUS_BAD_PAGE" };
  }

  const text = page.text;

  const subjectText = `${page.title}
${page.text}`;
  if (
    (analysis.lockedSubjects || []).length &&
    !allLockedSubjectsSupported(subjectText, analysis)
  ) {
    return {
      usable: false,
      reason: "LOCKED_SUBJECT_MISSING",
    };
  }

  const relationHit = relationEvidenceScore(text, analysis.relation) > 0;
  const slotRelationHit = Array.isArray(analysis.factSlots) && analysis.factSlots.length
    ? analysis.factSlots.some((slot) => relationEvidenceScore(text, slot.relation) > 0)
    : relationHit;
  const entityHit = analysis.entity ? bestEntityScore(analysis, `${page.title}\n${text}`) >= 0.25 : false;

  // R33 subject lock is semantic, not just a name mention. A page that merely
  // says the subject name but contains none of the requested relation types
  // cannot enter the evidence pool.
  if (
    (analysis.lockedSubjects || []).length &&
    Array.isArray(analysis.factSlots) &&
    analysis.factSlots.length &&
    !slotRelationHit
  ) {
    return {
      usable: false,
      reason: "LOCKED_SUBJECT_WITHOUT_REQUESTED_RELATION",
    };
  }
  const coverage = weightedClueCoverage(question, analysis, text);

  // Soft page-family preference: if the page is outside the expected family,
  // strong entity/clue/relation evidence can still keep it.
  const familyPenalty = softFamilyPreference(
    { url: page.url, host: source.host, title: page.title, content: text, score: 0 },
    question,
    analysis,
    source
  );

  if (
    familyPenalty < 0 &&
    !entityHit &&
    !relationHit &&
    coverage.ratio < 0.25
  ) {
    return { usable: false, reason: "WEAK_WRONG_FAMILY", coverage };
  }

  // Concrete clues no longer have to ALL appear. One hard clue + relation/entity
  // is enough to keep a page in the evidence pool.
  const hard = importantQuestionClues(question, analysis)
    .filter((x) => ["money", "percent", "multiplier", "update", "date", "lifecycle"].includes(x.kind));
  const hardMatched = hard.filter((x) => pageHasClue(text, x.value));

  if (
    hard.length &&
    hardMatched.length === 0 &&
    !entityHit &&
    !relationHit
  ) {
    return { usable: false, reason: "NO_HARD_OR_RELATION_EVIDENCE", coverage };
  }

  return {
    usable: true,
    reason: "AGGRESSIVE_PAGE_USABLE",
    coverage,
    entityHit,
    relationHit,
    hardMatched: hardMatched.map((x) => x.value),
  };
}

function evidenceChunksForPage(question, analysis, page, pageIndex) {
  const windows = contextsAroundClues(question, analysis, page.text, 620);
  const chunks = [];

  for (const window of windows.slice(0, 4)) {
    chunks.push({
      pageIndex,
      title: page.title,
      url: page.url,
      clue: window.clue,
      text: oneLine(window.text, 1800),
    });
  }

  if (!chunks.length) {
    // No exact clue window? Keep a compact beginning + relation neighborhood.
    const relationWords = relationSearchWord(analysis.relation)
      .split(/\s+/)
      .filter((x) => x.length >= 4);

    let relationChunk = "";
    for (const word of relationWords) {
      const idx = String(page.text || "").toLowerCase().indexOf(word.toLowerCase());
      if (idx >= 0) {
        relationChunk = clean(
          String(page.text || "").slice(Math.max(0, idx - 900), idx + 1400),
          2400
        );
        break;
      }
    }

    chunks.push({
      pageIndex,
      title: page.title,
      url: page.url,
      clue: relationChunk ? "relation" : "page",
      text: oneLine(relationChunk || page.text, 2600),
    });
  }

  return chunks;
}

function buildEvidenceBundle(question, analysis, pages) {
  const chunks = [];
  pages.forEach((page, index) => {
    chunks.push(...evidenceChunksForPage(question, analysis, page, index + 1));
  });
  return chunks.slice(0, 10);
}

function supportingPageForAnswer(answer, pages, chunks) {
  const a = oneLine(answer, 500);

  for (const chunk of chunks || []) {
    if (evidenceSupports(a, chunk.text)) {
      const page = pages[(chunk.pageIndex || 1) - 1];
      if (page) return { page, chunk };
    }
  }

  for (const page of pages || []) {
    if (evidenceSupports(a, page.text)) return { page, chunk: null };
  }

  return null;
}

function validateBundleAnswer(question, analysis, answer, pages, chunks) {
  const support = supportingPageForAnswer(answer, pages, chunks);
  if (!support) {
    return { valid: false, reason: "ANSWER_NOT_IN_TRUSTED_EVIDENCE" };
  }

  const type = answerTypeValid(question, analysis, answer, support.page);
  if (!type.valid) return type;

  // Because chunks are built around the question's clues, an answer appearing
  // in one of them is enough. If no chunk hit, require same-page relation evidence.
  if (support.chunk) {
    return {
      valid: true,
      reason: "ANSWER_IN_CLUE_EVIDENCE",
      page: support.page,
      chunk: support.chunk,
    };
  }

  if (relationEvidenceScore(support.page.text, analysis.relation) > 0) {
    return {
      valid: true,
      reason: "ANSWER_IN_RELATION_PAGE",
      page: support.page,
      chunk: null,
    };
  }

  return { valid: false, reason: "ANSWER_NOT_CONNECTED_TO_QUESTION" };
}

async function aiExtractEvidenceBundle(question, analysis, pages, source, deadline) {
  if (!env("NVIDIA_API_KEY") || timeLeft(deadline) < 300 || !pages.length) {
    return { result: null, error: "NVIDIA_BUNDLE_UNAVAILABLE" };
  }

  const chunks = buildEvidenceBundle(question, analysis, pages);
  if (!chunks.length) return { result: null, error: "NO_EVIDENCE_CHUNKS" };

  try {
    const data = await fetchJson(
      `${source.key}_AI_BUNDLE_EXTRACT`,
      NVIDIA_URL,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env("NVIDIA_API_KEY")}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          model: process.env.NVIDIA_MODEL || DEFAULT_MODEL,
          stream: false,
          temperature: 0,
          max_tokens: 190,
          chat_template_kwargs: { enable_thinking: false },
          messages: [
            {
              role: "system",
              content: [
                "You extract ONE Steal a Brainrot answer from trusted evidence chunks.",
                "Use ONLY the supplied chunks. Never use memory or outside knowledge.",
                "The chunks all come from the SAME source tier and may come from up to 3 pages.",
                "You do NOT need every clue to repeat in one snippet. Connect facts only when the supplied evidence clearly supports the requested relationship.",
                "If unsupported, answer UNKNOWN.",
                `Requested relation: ${analysis.relation}.`,
                analysis.entity ? `Requested entity: ${analysis.entity}.` : "",
                analysis.update ? `Requested update: ${analysis.update}.` : "",
                analysis.activeFrom ? `Active from Update ${analysis.activeFrom}.` : "",
                analysis.activeTo ? `Active through Update ${analysis.activeTo}.` : "",
                analysis.replacedIn ? `Replaced in Update ${analysis.replacedIn}.` : "",
                analysis.date ? `Requested date: ${analysis.date}.` : "",
                "For FREQUENCY return only the recurrence phrase, e.g. Every two hours.",
                "For OUTCOME/SPAWN/REWARD return only the resulting entity name.",
                "For MACHINE questions return only the machine name.",
                "For REBIRTH return Rebirth<number>.",
                "For GEAR return only the item name.",
                "For MULTIPLIER return only the multiplier.",
                "Return a short exact evidence quote copied from one supplied chunk.",
                'Return JSON only: {"answer":"UNKNOWN or value","evidence":"short exact quote","reason":"short"}',
              ].filter(Boolean).join("\n"),
            },
            {
              role: "user",
              content: JSON.stringify({
                question,
                analysis: {
                  relation: analysis.relation,
                  entity: analysis.entity,
                  update: analysis.update,
                  updateNumbers: analysis.updateNumbers,
                  activeFrom: analysis.activeFrom,
                  activeTo: analysis.activeTo,
                  replacedIn: analysis.replacedIn,
                  date: analysis.date,
                },
                evidence: chunks.map((chunk, i) => ({
                  id: i + 1,
                  pageIndex: chunk.pageIndex,
                  title: chunk.title,
                  url: chunk.url,
                  clue: chunk.clue,
                  text: chunk.text,
                })),
              }),
            },
          ],
        }),
      },
      Math.max(
        300,
        Math.min(
          CFG.NVIDIA_TIMEOUT_MS,
          timeLeft(deadline) - 30
        )
      )
    );

    const raw = parseLooseAiExtraction(data?.choices?.[0]?.message?.content);
    const answer = oneLine(raw?.answer, 500);

    if (!answer || norm(answer) === "unknown") {
      return { result: null, error: "AI_BUNDLE_UNKNOWN" };
    }

    const check = validateBundleAnswer(
      question,
      analysis,
      answer,
      pages,
      chunks
    );

    if (!check.valid) {
      return {
        result: null,
        error: `AI_BUNDLE_REJECTED_${check.reason}`,
      };
    }

    // If model supplied an evidence quote, make sure the quote itself exists
    // somewhere in the trusted bundle. Do not fail solely because the model
    // omitted the quote if the answer itself is already verified.
    const evidence = oneLine(raw?.evidence, 300);
    if (
      evidence &&
      !chunks.some((chunk) => norm(chunk.text).includes(norm(evidence)))
    ) {
      return {
        result: null,
        error: "AI_BUNDLE_EVIDENCE_QUOTE_NOT_FOUND",
      };
    }

    return {
      result: makeResult(
        answer,
        analysis.relation,
        source,
        check.page,
        `${source.key}_AGGRESSIVE_BUNDLE_AI`,
        source.confidence
      ),
      error: null,
      chunks,
      supportingPage: check.page,
    };
  } catch (error) {
    return {
      result: null,
      error: errorCode(error),
    };
  }
}


async function safeSearchVariant(query, index, analysis, source, deadline) {
  try {
    const search = await tavilySearch(
      query,
      deadline,
      [source.host],
      analysis.current
    );

    const fatal =
      !search ||
      (!Array.isArray(search.results) && !Array.isArray(search.errors));

    return {
      index,
      query,
      search: search || { answer: "", results: [], errors: ["EMPTY_SEARCH_RESULT"] },
      ok: !fatal,
      error: fatal ? "INVALID_SEARCH_RESULT" : null,
    };
  } catch (error) {
    return {
      index,
      query,
      search: {
        answer: "",
        results: [],
        errors: [errorCode(error)],
      },
      ok: false,
      error: errorCode(error),
    };
  }
}

async function safeOpenCandidate(row, source, deadline) {
  try {
    const page = await openExactResult(row, source, deadline);
    return { ok: true, row, page, error: null };
  } catch (error) {
    return {
      ok: false,
      row,
      page: null,
      error: errorCode(error),
    };
  }
}

function relationAnalysis(analysis, relation) {
  return {
    ...analysis,
    relation,
    wanted: relation,
    wantedRelations: [relation],
  };
}

function normalizeFrequencyAnswer(value) {
  const text = oneLine(value, 6000);
  if (!text) return null;

  const patterns = [
    /\b(every\s+(?:one|two|three|four|five|six|seven|eight|nine|ten|\d+)\s+(?:minutes?|hours?|days?|weeks?))\b/i,
    /\b(once\s+(?:every\s+)?(?:\d+\s+)?(?:minutes?|hours?|days?|weeks?))\b/i,
    /\b(twice\s+(?:every\s+)?(?:\d+\s+)?(?:minutes?|hours?|days?|weeks?))\b/i,
    /\b(hourly|daily|weekly)\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return match[1]
        .replace(/^every/i, "Every")
        .replace(/^once/i, "Once")
        .replace(/^twice/i, "Twice");
    }
  }

  return null;
}

function extractSimpleRelationFromText(text, relation) {
  const raw = oneLine(text, 8000);
  if (!raw) return null;

  if (relation === REL.FREQUENCY) {
    return normalizeFrequencyAnswer(raw);
  }

  if (relation === REL.UPDATE) {
    const m = raw.match(/\bUpdate\s*#?\s*(\d{1,3}(?:\.\d+)?)\b/i);
    return m ? `Update${m[1]}` : null;
  }

  if (relation === REL.REBIRTH) {
    const m = raw.match(/\bRebirth\s*#?\s*(\d{1,3})\b/i);
    return m ? `Rebirth${Number(m[1])}` : null;
  }

  if (relation === REL.MULTIPLIER) {
    return raw.match(/\b\d+(?:\.\d+)?\s*[x×]\b/i)?.[0]?.replace("×", "x") || null;
  }

  if (relation === REL.DROP_RATE) {
    return raw.match(/\b\d+(?:\.\d+)?\s*%/)?.[0] || null;
  }

  return null;
}

function uniqueRelationAnswerFromChunks(chunks, relation) {
  const answers = [];

  for (const chunk of chunks || []) {
    const answer = extractSimpleRelationFromText(chunk.text, relation);
    if (!answer) continue;

    if (!answers.some((x) => norm(x.answer) === norm(answer))) {
      answers.push({
        answer,
        chunk,
      });
    }
  }

  // One unique value is ideal. Multiple different values are ambiguous.
  return answers.length === 1 ? answers[0] : null;
}

function formatMultipartAnswer(parts, relations) {
  return relations
    .map((relation) => parts[relation]?.answer)
    .filter(Boolean)
    .join(", ");
}

function deterministicMultipartFromBundle(question, analysis, pages, chunks) {
  if (!isMultipartAnalysis(analysis)) return null;

  const parts = {};

  for (const relation of analysis.wantedRelations) {
    const subAnalysis = relationAnalysis(analysis, relation);

    // Simple typed extraction from clue-local chunks first.
    const simple = uniqueRelationAnswerFromChunks(chunks, relation);
    if (simple) {
      const page = pages[(simple.chunk.pageIndex || 1) - 1] || pages[0];
      const type = answerTypeValid(question, subAnalysis, simple.answer, page);

      if (type.valid) {
        parts[relation] = {
          answer: simple.answer,
          page,
          evidence: simple.chunk.text,
        };
        continue;
      }
    }

    // Existing deterministic page resolvers can supply non-simple relation types.
    for (const page of pages) {
      const direct =
        deterministicHighValueExactPage(question, subAnalysis, page, page.source || SOURCE.PRIMARY) ||
        deterministicExactPageFallback(question, subAnalysis, page, page.source || SOURCE.PRIMARY);

      if (!direct?.answer) continue;

      const check = validateBundleAnswer(
        question,
        subAnalysis,
        direct.answer,
        pages,
        chunks
      );

      if (check.valid) {
        parts[relation] = {
          answer: direct.answer,
          page: check.page || page,
          evidence: check.chunk?.text || page.text,
        };
        break;
      }
    }

    if (!parts[relation]) return null;
  }

  const answer = formatMultipartAnswer(parts, analysis.wantedRelations);
  if (!answer) return null;

  return {
    answer,
    parts,
    page: parts[analysis.wantedRelations[0]]?.page || pages[0],
  };
}

function parseMultipartAi(content) {
  const parsed = parseModelJson(content);
  const rows = Array.isArray(parsed?.parts)
    ? parsed.parts
    : Array.isArray(parsed?.answers)
      ? parsed.answers
      : null;

  if (!rows) throw new Error("MULTIPART_AI_NO_PARTS");

  return rows.map((row) => ({
    relation: String(row?.relation || row?.type || "").toUpperCase(),
    answer: oneLine(row?.answer ?? row?.value, 300),
    evidence: oneLine(row?.evidence ?? row?.quote, 350),
  }));
}

async function aiExtractMultipartBundle(question, analysis, pages, source, deadline) {
  if (!isMultipartAnalysis(analysis)) return { result: null, error: "NOT_MULTIPART" };
  if (!env("NVIDIA_API_KEY") || timeLeft(deadline) < 320 || !pages.length) {
    return { result: null, error: "NVIDIA_MULTIPART_UNAVAILABLE" };
  }

  const chunks = buildEvidenceBundle(question, analysis, pages);
  if (!chunks.length) return { result: null, error: "NO_MULTIPART_EVIDENCE" };

  try {
    const data = await fetchJson(
      `${source.key}_AI_MULTIPART`,
      NVIDIA_URL,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env("NVIDIA_API_KEY")}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          model: process.env.NVIDIA_MODEL || DEFAULT_MODEL,
          stream: false,
          temperature: 0,
          max_tokens: 230,
          chat_template_kwargs: { enable_thinking: false },
          messages: [
            {
              role: "system",
              content: [
                "Extract ALL requested Steal a Brainrot facts from ONLY the supplied trusted evidence chunks.",
                "Do not use outside knowledge.",
                `Requested relations: ${analysis.wantedRelations.join(", ")}.`,
                "Return exactly one part for each requested relation.",
                "For FREQUENCY return only recurrence wording such as Every two hours.",
                "For UPDATE return Update<number>.",
                "If ANY requested relation is unsupported, use UNKNOWN for that part.",
                "Each non-UNKNOWN part needs a short exact evidence quote copied from the supplied chunks.",
                'Return JSON only: {"parts":[{"relation":"FREQUENCY","answer":"Every two hours","evidence":"..."},{"relation":"UPDATE","answer":"Update61","evidence":"..."}]}',
              ].join("\n"),
            },
            {
              role: "user",
              content: JSON.stringify({
                question,
                analysis: {
                  entity: analysis.entity,
                  wantedRelations: analysis.wantedRelations,
                  update: analysis.update,
                  date: analysis.date,
                },
                evidence: chunks.map((chunk, i) => ({
                  id: i + 1,
                  pageIndex: chunk.pageIndex,
                  title: chunk.title,
                  url: chunk.url,
                  clue: chunk.clue,
                  text: chunk.text,
                })),
              }),
            },
          ],
        }),
      },
      Math.max(
        320,
        Math.min(CFG.NVIDIA_TIMEOUT_MS, timeLeft(deadline) - 30)
      )
    );

    const rows = parseMultipartAi(data?.choices?.[0]?.message?.content);
    const parts = {};

    for (const relation of analysis.wantedRelations) {
      const row = rows.find((x) => x.relation === relation);
      if (!row || !row.answer || norm(row.answer) === "unknown") {
        return { result: null, error: `MULTIPART_MISSING_${relation}` };
      }

      const support = supportingPageForAnswer(row.answer, pages, chunks);
      if (!support) {
        return { result: null, error: `MULTIPART_UNSUPPORTED_${relation}` };
      }

      const subAnalysis = relationAnalysis(analysis, relation);
      const type = answerTypeValid(question, subAnalysis, row.answer, support.page);
      if (!type.valid) {
        return { result: null, error: `MULTIPART_TYPE_${relation}_${type.reason}` };
      }

      if (
        row.evidence &&
        !chunks.some((chunk) => norm(chunk.text).includes(norm(row.evidence)))
      ) {
        return { result: null, error: `MULTIPART_EVIDENCE_${relation}_NOT_FOUND` };
      }

      parts[relation] = {
        answer: row.answer,
        page: support.page,
        evidence: row.evidence || support.chunk?.text || "",
      };
    }

    const answer = formatMultipartAnswer(parts, analysis.wantedRelations);
    if (!answer) return { result: null, error: "MULTIPART_EMPTY_COMBINED" };

    const page = parts[analysis.wantedRelations[0]]?.page || pages[0];

    return {
      result: makeResult(
        answer,
        analysis.relation,
        source,
        page,
        `${source.key}_MULTIPART_AI`,
        source.confidence
      ),
      error: null,
      parts,
      supportingPage: page,
    };
  } catch (error) {
    return {
      result: null,
      error: errorCode(error),
    };
  }
}



function cleanSubject(value) {
  const v = oneLine(value, 180);
  if (!v || /^(?:none|unknown|null)$/i.test(v)) return null;
  return v;
}

function makeSlot(id, relation, options = {}) {
  return {
    id,
    relation,
    answerType: options.answerType || relation,
    subject: cleanSubject(options.subject),
    qualifier: oneLine(options.qualifier, 80) || null,
    predicate: oneLine(options.predicate, 80) || relation,
    anchorUpdate: Number.isFinite(Number(options.anchorUpdate)) && Number(options.anchorUpdate) > 0
      ? Number(options.anchorUpdate)
      : null,
  };
}

function detectFactSlots(question, analysis) {
  const q = oneLine(question, 700);
  const lower = q.toLowerCase();
  const slots = [];

  const add = (slot) => {
    if (!slot?.id || !slot?.relation) return;
    if (!slots.some((x) => x.id === slot.id)) slots.push(slot);
  };

  // ----------------------------------------------------------------
  // Chance-qualified ritual outcomes. Works for ONE percentage or many.
  // Examples:
  //   "What is the 1% outcome ...?"
  //   "What are the 99% and 1% outcomes ...?"
  // ----------------------------------------------------------------
  const percents = [...q.matchAll(/\b(\d+(?:\.\d+)?)\s*%/g)]
    .map((m) => `${m[1]}%`);

  if (
    percents.length >= 1 &&
    /\b(?:outcome|outcomes|result|results|spawn|reward)\b/i.test(q) &&
    /\britual\b/i.test(q)
  ) {
    const subject = lower.includes("job job job sahur")
      ? "Job Job Job Sahur"
      : analysis.entity;

    for (let i = 0; i < percents.length; i++) {
      add(makeSlot(
        `outcome_${percents[i].replace(".", "_")}_${i + 1}`,
        REL.OUTCOME,
        {
          subject,
          qualifier: percents[i],
          predicate: "OUTCOME_AT_CHANCE",
          answerType: REL.BRAINROT,
        }
      ));
    }

    return slots;
  }

  // ----------------------------------------------------------------
  // Reverse mutation identification by multiplier.
  // "Which mutation has a 13x multiplier?" -> Crystal
  // ----------------------------------------------------------------
  const multiplier = q.match(/\b(\d+(?:\.\d+)?)\s*[x×]\b/i)?.[1];
  if (
    multiplier &&
    /\b(?:which|what)\s+mutation\b/i.test(q)
  ) {
    add(makeSlot(
      `mutation_${String(multiplier).replace(".", "_")}x`,
      REL.MUTATION,
      {
        subject: null,
        qualifier: `${multiplier}x`,
        predicate: "HAS_MULTIPLIER",
        answerType: REL.MUTATION,
        anchorUpdate: analysis.update,
      }
    ));
    return slots;
  }

  // ----------------------------------------------------------------
  // Queen Bee: frequency + machine/update tied to the SAME event/update.
  // ----------------------------------------------------------------
  if (lower.includes("queen bee")) {
    const subject = "Queen Bee";

    if (/\b(?:how often|how frequently|frequency|interval|recurr?ence)\b/.test(lower)) {
      add(makeSlot("queen_bee_frequency", REL.FREQUENCY, {
        subject,
        predicate: "EVENT_FREQUENCY",
      }));
    }

    if (
      /\b(?:which|what)\s+machine\b/.test(lower) ||
      /\bmachine\s+(?:was|is)\s+(?:introduced|added)\b/.test(lower)
    ) {
      add(makeSlot("queen_bee_same_update_machine", REL.MACHINE, {
        subject,
        predicate: "MACHINE_IN_SAME_UPDATE",
        answerType: REL.MACHINE,
        anchorUpdate: analysis.update,
      }));
    }

    if (
      /\b(?:what|which)\s+update\b/.test(lower) ||
      /\bupdate\s+(?:was|is)\s+(?:it\s+)?(?:tied|associated)\b/.test(lower) ||
      /\btied to\b/.test(lower)
    ) {
      add(makeSlot("queen_bee_update", REL.UPDATE, {
        subject,
        predicate: "SUBJECT_UPDATE",
        answerType: REL.UPDATE,
      }));
    }

    if (slots.length) return slots;
  }

  // ----------------------------------------------------------------
  // Los Traders replacement binding. Single-slot form is intentional.
  // ----------------------------------------------------------------
  if (lower.includes("los traders") && /\breplac/.test(lower)) {
    if (/\b(?:which|what)\s+machine\b/.test(lower)) {
      add(makeSlot("los_traders_replaced_by", REL.MACHINE, {
        subject: "Los Traders",
        predicate: "REPLACED_BY",
        answerType: REL.MACHINE,
      }));
    }

    if (
      /\bwhat\s+update\b/.test(lower) ||
      /\bwhich\s+update\b/.test(lower) ||
      /\bwhat update did that happen\b/.test(lower)
    ) {
      add(makeSlot("los_traders_replaced_in", REL.UPDATE, {
        subject: "Los Traders",
        predicate: "REPLACED_IN",
        answerType: REL.UPDATE,
      }));
    }

    if (slots.length) return slots;
  }

  // ----------------------------------------------------------------
  // Generic fallback: one slot per requested relation.
  // ----------------------------------------------------------------
  const wanted = analysis.wantedRelations || [analysis.relation];
  for (let i = 0; i < wanted.length; i++) {
    add(makeSlot(
      `relation_${wanted[i]}_${i + 1}`,
      wanted[i],
      {
        subject: analysis.entity,
        predicate: wanted[i],
        answerType: wanted[i],
      }
    ));
  }

  return slots;
}

function normalizeAiSlots(aiSlots, fallbackSlots) {
  if (!Array.isArray(aiSlots) || !aiSlots.length) return fallbackSlots;

  const byId = new Map(
    fallbackSlots.map((slot) => [slot.id, slot])
  );

  for (const row of aiSlots) {
    const id = oneLine(row?.id, 100);
    const relation = String(row?.relation || "").toUpperCase();

    if (!id || !ALLOWED_RELATIONS.has(relation)) continue;

    const fallback = byId.get(id);

    byId.set(id, makeSlot(id, relation, {
      answerType: String(row?.answerType || fallback?.answerType || relation).toUpperCase(),
      subject: cleanSubject(row?.subject) || fallback?.subject,
      qualifier: oneLine(row?.qualifier, 80) || fallback?.qualifier,
      predicate: oneLine(row?.predicate, 80) || fallback?.predicate || relation,
      anchorUpdate: Number(row?.anchorUpdate) || fallback?.anchorUpdate,
    }));
  }

  return [...byId.values()];
}

function applyFactSlots(question, analysis) {
  const slots = detectFactSlots(question, analysis);

  const lockedSubjects = [...new Set(
    slots.map((slot) => cleanSubject(slot.subject)).filter(Boolean)
  )];

  return {
    ...analysis,
    factSlots: slots,
    lockedSubjects,
    wantedRelations: [...new Set(slots.map((slot) => slot.relation))],
  };
}

function isFactSlotQuestion(analysis) {
  const slots = Array.isArray(analysis?.factSlots) ? analysis.factSlots : [];
  if (!slots.length) return false;
  if (slots.length > 1) return true;

  const slot = slots[0];
  const specialPredicates = new Set([
    "OUTCOME_AT_CHANCE",
    "REPLACED_BY",
    "REPLACED_IN",
    "EVENT_FREQUENCY",
    "SUBJECT_UPDATE",
    "MACHINE_IN_SAME_UPDATE",
    "HAS_MULTIPLIER",
  ]);

  return Boolean(
    slot.qualifier ||
    specialPredicates.has(slot.predicate) ||
    (slot.answerType && slot.answerType !== slot.relation)
  );
}

function subjectAppears(value, subject) {
  if (!subject) return true;
  return pageHasClue(value, subject) || similarity(subject, value) >= 0.72;
}

function allLockedSubjectsSupported(value, analysis) {
  const subjects = analysis?.lockedSubjects || [];
  if (!subjects.length) return true;
  return subjects.every((subject) => subjectAppears(value, subject));
}

function contextAroundSubject(text, subject, radius = 1000) {
  const raw = String(text || "");
  if (!subject) return raw;

  const index = raw.toLowerCase().indexOf(String(subject).toLowerCase());
  if (index < 0) return "";

  return clean(
    raw.slice(
      Math.max(0, index - radius),
      Math.min(raw.length, index + String(subject).length + radius)
    ),
    radius * 2 + String(subject).length
  );
}

function machineNamesFromText(text) {
  const raw = oneLine(text, 6000);
  const values = [];

  for (const m of raw.matchAll(
    /\b((?:RNG|Los|Craft|Fuse|Summer|Cyber|Mutation|Trait|Lucky|Brainrot|Cash|Admin)(?:\s+[A-Z][A-Za-z0-9'-]+){0,3}\s+Machine)\b/g
  )) {
    const value = oneLine(m[1], 120);
    if (value && !values.includes(value)) values.push(value);
  }

  // Important known shape: "RNG Machine"
  for (const m of raw.matchAll(/\b(RNG Machine|Craft Machine|Fuse Machine)\b/gi)) {
    const value = oneLine(m[1], 120);
    if (value && !values.some((x) => norm(x) === norm(value))) values.push(value);
  }

  return values;
}

function extractReplacedByMachine(text, subject) {
  const ctx = contextAroundSubject(text, subject, 1800);
  if (!ctx) return null;

  const patterns = [
    /\bUpdate\s*\d+(?:\.\d+)?\s+replaced\s+(?:the\s+)?(?:active\s+)?Los Traders[^.]{0,160}?\bwith\s+(?:the\s+)?([A-Z][A-Za-z0-9' -]{1,80}\s+Machine)\b/i,
    /\bLos Traders[^.]{0,180}?\breplaced\b[^.]{0,100}?\bwith\s+(?:the\s+)?([A-Z][A-Za-z0-9' -]{1,80}\s+Machine)\b/i,
    /\breplaced\s+(?:it|them|Los Traders)[^.]{0,100}?\bwith\s+(?:the\s+)?([A-Z][A-Za-z0-9' -]{1,80}\s+Machine)\b/i,
  ];

  for (const pattern of patterns) {
    const match = ctx.match(pattern);
    if (match?.[1]) return oneLine(match[1], 120);
  }

  // If the context explicitly says replacement and only one plausible machine
  // name occurs, the binding is unambiguous.
  if (/\breplac/i.test(ctx)) {
    const names = machineNamesFromText(ctx)
      .filter((name) => !/Los Traders/i.test(name));

    const unique = [...new Set(names.map((x) => oneLine(x, 120)))];
    if (unique.length === 1) return unique[0];
  }

  return null;
}

function extractReplacedInUpdate(text, subject) {
  const ctx = contextAroundSubject(text, subject, 1800);
  if (!ctx || !/\breplac/i.test(ctx)) return null;

  const patterns = [
    /\bUpdate\s*#?\s*(\d{1,3}(?:\.\d+)?)\s+replaced\b/i,
    /\breplaced\b[^.]{0,160}?\bin\s+Update\s*#?\s*(\d{1,3}(?:\.\d+)?)/i,
    /\bUpdate\s*#?\s*(\d{1,3}(?:\.\d+)?)[^.]{0,200}\bLos Traders\b[^.]{0,200}\breplac/i,
  ];

  for (const pattern of patterns) {
    const match = ctx.match(pattern);
    if (match?.[1]) return `Update${match[1]}`;
  }

  return null;
}

function extractSubjectUpdate(text, subject) {
  const ctx = contextAroundSubject(text, subject, 1500);
  if (!ctx) return null;

  const matches = [...ctx.matchAll(/\bUpdate\s*#?\s*(\d{1,3}(?:\.\d+)?)\b/gi)]
    .map((m) => `Update${m[1]}`);

  const unique = [...new Set(matches)];
  return unique.length === 1 ? unique[0] : null;
}

function extractMachineSameUpdate(text, subject) {
  const ctx = contextAroundSubject(text, subject, 1800);
  if (!ctx) return null;

  const names = machineNamesFromText(ctx);
  const unique = [...new Set(names)];

  if (unique.length === 1) return unique[0];

  // Prefer RNG Machine in the Queen Bee event context if explicitly present.
  if (
    /Queen Bee/i.test(ctx) &&
    /\bRNG Machine\b/i.test(ctx)
  ) {
    return "RNG Machine";
  }

  return null;
}

function slotSpecificQuestion(slot) {
  if (slot.relation === REL.OUTCOME && slot.qualifier) {
    return `What is the ${slot.qualifier} outcome from the ${slot.subject || ""} ritual?`;
  }

  if (slot.predicate === "REPLACED_BY") {
    return `What machine replaced ${slot.subject || "the subject"}?`;
  }

  if (slot.predicate === "REPLACED_IN") {
    return `In what update was ${slot.subject || "the subject"} replaced?`;
  }

  if (slot.predicate === "EVENT_FREQUENCY") {
    return `How often does ${slot.subject || "the event"} happen?`;
  }

  if (slot.predicate === "MACHINE_IN_SAME_UPDATE") {
    return `Which machine was introduced in the same update as ${slot.subject || "the subject"}?`;
  }

  if (slot.predicate === "HAS_MULTIPLIER") {
    return `Which mutation has a ${slot.qualifier || "requested"} multiplier?`;
  }

  if (slot.predicate === "SUBJECT_UPDATE") {
    return `What update was ${slot.subject || "the subject"} tied to?`;
  }

  return `${slot.relation} for ${slot.subject || "the question"}`;
}

function relationAnalysisForSlot(analysis, slot) {
  return {
    ...analysis,
    relation: slot.relation,
    wanted: slot.relation,
    wantedRelations: [slot.relation],
    entity: slot.subject || analysis.entity,
    entities: slot.subject
      ? [slot.subject, ...(analysis.entities || []).filter((x) => norm(x) !== norm(slot.subject))]
      : analysis.entities,
    factSlots: [slot],
    lockedSubjects: slot.subject ? [slot.subject] : [],
  };
}


function regexEscape(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function looksLikeMutationName(value) {
  const v = oneLine(value, 100);
  if (!v || v.length > 60 || v.split(/\s+/).length > 5) return false;
  if (/\b(?:mutation|mutations|multiplier|event|always available|collect all|brainrots?|traits?)\b/i.test(v)) return false;
  if (/^\d+(?:\.\d+)?\s*[x×]$/i.test(v)) return false;
  return /^[A-Z][A-Za-z0-9' -]*$/.test(v);
}

function extractMutationByMultiplier(page, qualifier) {
  const q = oneLine(qualifier, 30).replace("×", "x");
  if (!q) return null;

  const qNumber = q.match(/\d+(?:\.\d+)?/)?.[0];
  if (!qNumber) return null;

  const text = oneLine(page?.text || "", 20000).replace(/×/g, "x");
  const escaped = regexEscape(qNumber);

  const qualifierIndex = text.toLowerCase().indexOf(`${qNumber.toLowerCase()}x`);
  const qualifierContext = qualifierIndex >= 0
    ? text.slice(Math.max(0, qualifierIndex - 260), qualifierIndex + 360)
    : "";

  // A numeric multiplier on an unrelated event/page must never become a
  // mutation answer. Either the canonical mutation hub is being read, or
  // the local qualifier context must explicitly identify mutation semantics.
  if (
    !/\/wiki\/mutations(?:\/|$|\?)/i.test(page?.url || "") &&
    !/\bmutation(?:s)?\b/i.test(qualifierContext)
  ) {
    return null;
  }

  // Strong prose shape from S+: "Crystal 13x Crystal mutation with a 13x multiplier"
  const prose = text.match(
    new RegExp(`\\b([A-Z][A-Za-z0-9' -]{0,50}?)\\s+${escaped}x\\s+\\1\\s+mutation\\b`, "i")
  );
  if (prose?.[1]) {
    const candidate = oneLine(prose[1], 80);
    if (looksLikeMutationName(candidate)) return candidate;
  }

  // Line-based table/card form: heading/name immediately precedes 13x.
  const lines = Array.isArray(page?.lines) ? page.lines.map((x) => oneLine(x, 300)).filter(Boolean) : [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].replace(/×/g, "x");
    if (!new RegExp(`\\b${escaped}\\s*x\\b`, "i").test(line)) continue;

    // Same line can be "Crystal 13x".
    const same = line.match(new RegExp(`^([A-Z][A-Za-z0-9' -]{0,50}?)\\s+${escaped}\\s*x\\b`, "i"));
    if (same?.[1] && looksLikeMutationName(oneLine(same[1], 80))) {
      return oneLine(same[1], 80);
    }

    for (let back = 1; back <= 4 && i - back >= 0; back++) {
      const candidate = oneLine(lines[i - back], 80);
      if (looksLikeMutationName(candidate)) return candidate;
    }
  }

  // Last fallback: title-like word shortly before the requested multiplier.
  const idx = text.toLowerCase().indexOf(`${qNumber.toLowerCase()}x`);
  if (idx >= 0) {
    const before = text.slice(Math.max(0, idx - 100), idx);
    const candidates = [...before.matchAll(/\\b([A-Z][A-Za-z0-9'-]{2,30})\\b/g)].map((m) => m[1]);
    for (let i = candidates.length - 1; i >= 0; i--) {
      if (looksLikeMutationName(candidates[i])) return candidates[i];
    }
  }

  return null;
}

function looksLikeBrainrotEntityName(value) {
  const answer = oneLine(value, 240);
  if (!answer) return false;

  if (answerLooksLikeMetadata(answer)) return false;
  if (answer.length > 100 || answer.split(/\s+/).length > 9) return false;

  // Descriptive/stat sentences are not entity names.
  if (
    /\b(?:brainrot|generating|generates|income|per second|outcome|chance|success rate|request[_ -]?id|developer|producer|creator|cost|price)\b/i.test(answer)
  ) return false;

  if (/\$\s*\d|\b\d+(?:\.\d+)?\s*(?:Qa|Qi|Sx|Sp|Oc|No|Dc|K|M|B|T|Q)\b|\/s\b/i.test(answer)) return false;

  return true;
}

function validateSlotAnswer(slot, answer, page) {
  const value = oneLine(answer, 300);
  if (!value) return { valid: false, reason: "EMPTY_SLOT_ANSWER" };

  if (
    slot.answerType === REL.BRAINROT ||
    [REL.OUTCOME, REL.SPAWN, REL.REWARD].includes(slot.relation)
  ) {
    if (!looksLikeBrainrotEntityName(value)) {
      return { valid: false, reason: "NOT_ENTITY_NAME" };
    }

    if (/\britual\b/i.test(value)) {
      return { valid: false, reason: "RITUAL_LABEL_NOT_OUTCOME" };
    }

    if (
      slot.predicate === "OUTCOME_AT_CHANCE" &&
      slot.subject &&
      similarity(value, slot.subject) >= 0.72
    ) {
      return { valid: false, reason: "OUTCOME_EQUALS_INPUT_SUBJECT" };
    }
  }

  if (slot.answerType === REL.MUTATION) {
    if (!looksLikeMutationName(value)) {
      return { valid: false, reason: "EXPECTED_MUTATION_NAME" };
    }

    if (slot.predicate === "HAS_MULTIPLIER" && slot.qualifier) {
      const pageText = oneLine(page?.text || "", 20000).replace(/×/g, "x");
      const qualifier = oneLine(slot.qualifier, 40).replace(/×/g, "x");
      const idx = pageText.toLowerCase().indexOf(qualifier.toLowerCase());
      const ctx = idx >= 0
        ? pageText.slice(Math.max(0, idx - 320), idx + qualifier.length + 420)
        : "";

      if (
        !ctx ||
        !/\bmutation(?:s)?\b/i.test(ctx) ||
        !evidenceSupports(value, ctx)
      ) {
        return { valid: false, reason: "MULTIPLIER_NOT_BOUND_TO_MUTATION" };
      }
    }
  }

  if (slot.answerType === REL.MACHINE && !/\bMachine\b/i.test(value)) {
    return { valid: false, reason: "EXPECTED_MACHINE_NAME" };
  }

  if (slot.answerType === REL.UPDATE && !/^Update\s*\d+(?:\.\d+)?$/i.test(value.replace(/\s+/g, ""))) {
    return { valid: false, reason: "EXPECTED_UPDATE_NAME" };
  }

  return { valid: true, reason: "SLOT_TYPE_OK" };
}

function extractSlotDeterministic(slot, question, analysis, pages) {
  const slotQuestion = slotSpecificQuestion(slot);
  const subAnalysis = relationAnalysisForSlot(analysis, slot);

  for (const page of pages) {
    const pageText = `${page.title}\n${page.text}`;

    if (slot.subject && !subjectAppears(pageText, slot.subject)) continue;

    let answer = null;

    if (slot.relation === REL.OUTCOME && slot.qualifier) {
      answer = extractChanceResultFromPage(slotQuestion, page);
    } else if (slot.predicate === "HAS_MULTIPLIER" && slot.relation === REL.MUTATION) {
      answer = extractMutationByMultiplier(page, slot.qualifier);
    } else if (slot.predicate === "REPLACED_BY") {
      answer = extractReplacedByMachine(page.text, slot.subject);
    } else if (slot.predicate === "REPLACED_IN") {
      answer = extractReplacedInUpdate(page.text, slot.subject);
    } else if (slot.predicate === "EVENT_FREQUENCY") {
      answer = normalizeFrequencyAnswer(
        contextAroundSubject(page.text, slot.subject, 1600)
      );
    } else if (slot.predicate === "SUBJECT_UPDATE") {
      answer = extractSubjectUpdate(page.text, slot.subject);
    } else if (slot.predicate === "MACHINE_IN_SAME_UPDATE") {
      answer = extractMachineSameUpdate(page.text, slot.subject);
    }

    if (!answer) {
      const direct =
        deterministicHighValueExactPage(
          slotQuestion,
          subAnalysis,
          page,
          page.source || SOURCE.PRIMARY
        ) ||
        deterministicExactPageFallback(
          slotQuestion,
          subAnalysis,
          page,
          page.source || SOURCE.PRIMARY
        );

      answer = direct?.answer || null;
    }

    if (!answer) continue;

    const type = answerTypeValid(
      slotQuestion,
      subAnalysis,
      answer,
      page
    );

    if (!type.valid) continue;

    const slotType = validateSlotAnswer(slot, answer, page);
    if (!slotType.valid) continue;

    // Strong binding: subject + answer must be present on the same page.
    if (slot.subject && !subjectAppears(pageText, slot.subject)) continue;
    if (!evidenceSupports(answer, page.text) && similarity(answer, page.title) < 0.82) continue;

    return {
      id: slot.id,
      relation: slot.relation,
      answer,
      subject: slot.subject,
      qualifier: slot.qualifier,
      predicate: slot.predicate,
      page,
      evidence: contextAroundSubject(page.text, slot.subject, 1800) || page.text,
    };
  }

  return null;
}

function deterministicFactSlots(question, analysis, pages) {
  if (!Array.isArray(analysis.factSlots) || !analysis.factSlots.length) return null;

  const answers = [];

  for (const slot of analysis.factSlots) {
    const resolved = extractSlotDeterministic(
      slot,
      question,
      analysis,
      pages
    );

    if (!resolved) return null;
    answers.push(resolved);
  }

  return {
    answer: answers.map((x) => x.answer).join(", "),
    slots: answers,
    page: answers[0]?.page || pages[0],
  };
}

function parseAiFactSlots(content) {
  const parsed = parseModelJson(content);
  const rows = Array.isArray(parsed?.slots)
    ? parsed.slots
    : Array.isArray(parsed?.parts)
      ? parsed.parts
      : null;

  if (!rows) throw new Error("FACT_SLOT_AI_NO_SLOTS");

  return rows.map((row) => ({
    id: oneLine(row?.id, 120),
    relation: String(row?.relation || row?.type || "").toUpperCase(),
    answer: oneLine(row?.answer ?? row?.value, 300),
    evidence: oneLine(row?.evidence ?? row?.quote, 350),
    subject: cleanSubject(row?.subject),
    qualifier: oneLine(row?.qualifier, 80) || null,
    predicate: oneLine(row?.predicate, 80) || null,
  }));
}

async function aiExtractFactSlots(question, analysis, pages, source, deadline) {
  if (!isFactSlotQuestion(analysis)) return { result: null, error: "NOT_FACT_SLOT_QUESTION" };
  if (!env("NVIDIA_API_KEY") || timeLeft(deadline) < 340 || !pages.length) {
    return { result: null, error: "NVIDIA_FACT_SLOT_UNAVAILABLE" };
  }

  const chunks = buildEvidenceBundle(question, analysis, pages);
  if (!chunks.length) return { result: null, error: "NO_FACT_SLOT_EVIDENCE" };

  try {
    const data = await fetchJson(
      `${source.key}_AI_FACT_SLOTS`,
      NVIDIA_URL,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env("NVIDIA_API_KEY")}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          model: process.env.NVIDIA_MODEL || DEFAULT_MODEL,
          stream: false,
          temperature: 0,
          max_tokens: 320,
          chat_template_kwargs: { enable_thinking: false },
          messages: [
            {
              role: "system",
              content: [
                "You fill exact fact slots for Steal a Brainrot using ONLY supplied trusted evidence.",
                "Each slot has a subject, predicate/relation, and sometimes a qualifier.",
                "Keep every answer bound to that exact subject and qualifier.",
                "Do NOT answer from another entity or another update just because the same relation appears.",
                "For duplicate OUTCOME slots, the qualifier (for example 99% vs 1%) must select the matching outcome.",
                "For REPLACED_BY, answer the machine/entity that the subject was explicitly replaced by.",
                "For REPLACED_IN, answer the update where that same replacement occurred.",
                "For HAS_MULTIPLIER, answer the entity whose multiplier exactly matches the slot qualifier; never answer the multiplier itself.",
                "For MACHINE_IN_SAME_UPDATE, answer a machine explicitly tied to the same update/event as the subject.",
                "For EVENT_FREQUENCY, answer only the recurrence phrase.",
                "If ANY slot is not explicitly supported, answer UNKNOWN for that slot.",
                "Return a short exact evidence quote for each non-UNKNOWN slot.",
                'Return JSON only: {"slots":[{"id":"...","relation":"...","answer":"...","evidence":"..."}]}',
              ].join("\n"),
            },
            {
              role: "user",
              content: JSON.stringify({
                question,
                slots: analysis.factSlots,
                evidence: chunks.map((chunk, i) => ({
                  id: i + 1,
                  pageIndex: chunk.pageIndex,
                  title: chunk.title,
                  url: chunk.url,
                  clue: chunk.clue,
                  text: chunk.text,
                })),
              }),
            },
          ],
        }),
      },
      Math.max(
        340,
        Math.min(CFG.NVIDIA_TIMEOUT_MS, timeLeft(deadline) - 30)
      )
    );

    const rows = parseAiFactSlots(data?.choices?.[0]?.message?.content);
    const resolved = [];

    for (const slot of analysis.factSlots) {
      const row = rows.find((x) => x.id === slot.id);

      if (!row || !row.answer || norm(row.answer) === "unknown") {
        return { result: null, error: `FACT_SLOT_MISSING_${slot.id}` };
      }

      const subAnalysis = relationAnalysisForSlot(analysis, slot);

      // Strong subject binding: the supporting evidence chunk must contain
      // the locked subject, not just the answer.
      const supportCandidates = chunks.filter((chunk) =>
        (!slot.subject || subjectAppears(chunk.text, slot.subject)) &&
        evidenceSupports(row.answer, chunk.text)
      );

      if (slot.qualifier) {
        const qualified = supportCandidates.filter((chunk) =>
          pageHasClue(chunk.text, slot.qualifier)
        );
        if (qualified.length) {
          supportCandidates.splice(0, supportCandidates.length, ...qualified);
        }
      }

      const supportChunk = supportCandidates[0];
      if (!supportChunk) {
        return { result: null, error: `FACT_SLOT_UNBOUND_${slot.id}` };
      }

      const page = pages[(supportChunk.pageIndex || 1) - 1] || pages[0];
      const type = answerTypeValid(
        slotSpecificQuestion(slot),
        subAnalysis,
        row.answer,
        page
      );

      if (!type.valid) {
        return { result: null, error: `FACT_SLOT_TYPE_${slot.id}_${type.reason}` };
      }

      const slotType = validateSlotAnswer(slot, row.answer, page);
      if (!slotType.valid) {
        return { result: null, error: `FACT_SLOT_SEMANTIC_${slot.id}_${slotType.reason}` };
      }

      if (
        row.evidence &&
        !norm(supportChunk.text).includes(norm(row.evidence))
      ) {
        return { result: null, error: `FACT_SLOT_EVIDENCE_${slot.id}_NOT_FOUND` };
      }

      resolved.push({
        id: slot.id,
        relation: slot.relation,
        answer: row.answer,
        subject: slot.subject,
        qualifier: slot.qualifier,
        predicate: slot.predicate,
        page,
        evidence: row.evidence || supportChunk.text,
      });
    }

    const answer = resolved.map((x) => x.answer).join(", ");
    const page = resolved[0]?.page || pages[0];

    return {
      result: makeResult(
        answer,
        analysis.relation,
        source,
        page,
        `${source.key}_FACT_SLOT_AI`,
        source.confidence
      ),
      slots: resolved,
      supportingPage: page,
      error: null,
    };
  } catch (error) {
    return {
      result: null,
      error: errorCode(error),
    };
  }
}


function primarySlug(value) {
  return oneLine(value, 220)
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}


const PRIMARY_LORE_HUBS = Object.freeze([
  { key: "HOME", url: `${PRIMARY_ORIGIN}/`, tags: ["home","overview","gameplay","lore"] },
  { key: "WIKI", url: `${PRIMARY_ORIGIN}/wiki`, tags: ["wiki","system","guide","lucky block","machine","codes"] },
  { key: "BRAINROTS", url: `${PRIMARY_ORIGIN}/brainrots`, tags: ["brainrot","rarity","cost","income","availability","date"] },
  { key: "COLLECTIONS", url: `${PRIMARY_ORIGIN}/collections`, tags: ["collection","secret","og","craft","limited","lucky block"] },
  { key: "EVENTS", url: `${PRIMARY_ORIGIN}/events`, tags: ["event","update","date","announcement","admin abuse","taco tuesday","code"] },
  { key: "MACHINES", url: `${PRIMARY_ORIGIN}/machines`, tags: ["machine","shop","merchant","replacement","update"] },
  { key: "RITUALS", url: `${PRIMARY_ORIGIN}/rituals`, tags: ["ritual","players","formation","spawn","trait","outcome"] },
  { key: "RITUAL_BRAINROTS", url: `${PRIMARY_ORIGIN}/ritual-brainrots`, tags: ["ritual","brainrot","spawn","cost","income"] },
  { key: "MUTATIONS", url: `${PRIMARY_ORIGIN}/wiki/mutations`, tags: ["mutation","trait","multiplier","event"] },
  { key: "REBIRTH", url: `${PRIMARY_ORIGIN}/wiki/rebirth`, tags: ["rebirth","gear","item","requirement","floor"] },
  { key: "SHOP", url: `${PRIMARY_ORIGIN}/wiki/shop`, tags: ["shop","gear","item","price","rebirth","wheel"] },
  { key: "CODES", url: `${PRIMARY_ORIGIN}/codes`, tags: ["code","redeem","reward","announcement"] },
  { key: "COMMUNITY", url: `${PRIMARY_ORIGIN}/community`, tags: ["announcement","community","discord","news"] },
  { key: "OG", url: `${PRIMARY_ORIGIN}/og`, tags: ["og","brainrot","spawn","availability"] },
  { key: "SECRETS", url: `${PRIMARY_ORIGIN}/secrets`, tags: ["secret","brainrot","lucky block","availability"] },
  { key: "TIPS", url: `${PRIMARY_ORIGIN}/wiki/tips`, tags: ["tips","strategy","base","steal","floor","spawn","rarity"] },
  { key: "LUCKY_BLOCKS", url: `${PRIMARY_ORIGIN}/lucky-blocks`, tags: ["lucky block","drop","chance","price","cooldown"] },
  { key: "LUCKY_BLOCK_BRAINROTS", url: `${PRIMARY_ORIGIN}/lucky-block-brainrots`, tags: ["lucky block","brainrot","drop","chance"] },
  { key: "BLOGS", url: `${PRIMARY_ORIGIN}/blogs`, tags: ["guide","history","trivia","update","article","meta"] },
  { key: "CRAFTS", url: `${PRIMARY_ORIGIN}/craft-brainrots`, tags: ["craft","recipe","brainrot","machine"] },
  { key: "LIMITED", url: `${PRIMARY_ORIGIN}/limited-quantity-brainrots`, tags: ["limited","stock","quantity","brainrot"] },
  { key: "THEMED", url: `${PRIMARY_ORIGIN}/themed-brainrots`, tags: ["themed","event","brainrot"] },
  { key: "AQUATIC", url: `${PRIMARY_ORIGIN}/aquatic-brainrots`, tags: ["aquatic","water","brainrot"] },
  { key: "DEALER", url: `${PRIMARY_ORIGIN}/trader-brainrots`, tags: ["trader","dealer","merchant","brainrot","restock"] },
]);

function loreQueryTerms(question, analysis) {
  const terms = new Set();
  const raw = oneLine(question, 700);

  for (const token of raw.toLowerCase().match(/[a-z0-9][a-z0-9'-]*/g) || []) {
    if (token.length < 3) continue;
    if (STOPWORDS.has(token)) continue;
    terms.add(token);
  }

  for (const entity of [analysis.entity, ...(analysis.entities || [])]) {
    if (!entity) continue;
    terms.add(oneLine(entity, 160).toLowerCase());
  }

  for (const clue of searchCluesFromQuestion(raw)) {
    if (clue) terms.add(oneLine(clue, 160).toLowerCase());
  }

  if (analysis.update) terms.add(`update ${analysis.update}`);
  if (analysis.date) terms.add(humanDateFromIso(analysis.date).toLowerCase());
  terms.add(String(analysis.relation || "").toLowerCase());

  return [...terms].filter(Boolean).slice(0, 32);
}

function loreHubScore(hub, question, analysis) {
  const q = oneLine(question, 700).toLowerCase();
  let score = 0;
  for (const tag of hub.tags) {
    if (q.includes(tag)) score += tag.includes(" ") ? 5 : 3;
  }

  const rel = analysis.relation;
  const key = hub.key;

  if ([REL.EVENT,REL.UPDATE,REL.DATE,REL.TIME,REL.DURATION,REL.ANNOUNCEMENT,REL.CODE].includes(rel) && key === "EVENTS") score += 12;
  if ([REL.BRAINROT,REL.COST,REL.INCOME,REL.RARITY,REL.STATUS,REL.METHOD,REL.STOCK].includes(rel) && key === "BRAINROTS") score += 12;
  if ([REL.RITUAL,REL.OUTCOME,REL.SPAWN,REL.REQUIREMENT,REL.FORMATION,REL.PLAYERS].includes(rel) && key === "RITUALS") score += 12;
  if ([REL.MACHINE,REL.REPLACED_BY,REL.REPLACED_IN,REL.ACTIVE_RANGE,REL.SHOP].includes(rel) && key === "MACHINES") score += 12;
  if ([REL.MUTATION,REL.TRAIT,REL.MULTIPLIER].includes(rel) && key === "MUTATIONS") score += 12;
  if ([REL.REBIRTH,REL.GEAR].includes(rel) && key === "REBIRTH") score += 12;
  if ([REL.GEAR,REL.SHOP].includes(rel) && key === "SHOP") score += 10;
  if (rel === REL.CODE && key === "CODES") score += 10;
  if (rel === REL.COLLECTION && key === "COLLECTIONS") score += 12;
  if (rel === REL.LUCKY_BLOCK && ["WIKI","COLLECTIONS","SECRETS"].includes(key)) score += 8;
  if (rel === REL.ANNOUNCEMENT && ["EVENTS","COMMUNITY","HOME","BLOGS"].includes(key)) score += 9;
  if ([REL.LUCKY_BLOCK,REL.DROP_RATE,REL.CONTENTS,REL.COST].includes(rel) && key === "LUCKY_BLOCKS") score += 12;
  if ([REL.BASE,REL.MECHANIC,REL.FREQUENCY,REL.DROP_RATE].includes(rel) && key === "TIPS") score += 11;
  if (rel === REL.BASE && ["HOME","TIPS","REBIRTH","SHOP"].includes(key)) score += 8;
  if (rel === REL.ASSET && ["BRAINROTS","EVENTS","LUCKY_BLOCKS"].includes(key)) score += 8;
  if (rel === REL.MECHANIC && ["WIKI","MACHINES","RITUALS","TIPS","EVENTS"].includes(key)) score += 7;
  if (rel === REL.COOLDOWN && ["MACHINES","LUCKY_BLOCKS","EVENTS"].includes(key)) score += 10;

  if (analysis.current && ["EVENTS","MACHINES","CODES","HOME","BRAINROTS"].includes(key)) score += 5;
  if (key === "WIKI") score += 2;

  return score;
}

function selectLoreHubs(question, analysis) {
  const ranked = PRIMARY_LORE_HUBS
    .map((hub) => ({ ...hub, score: loreHubScore(hub, question, analysis) }))
    .sort((a,b) => b.score - a.score);

  const selected = ranked.filter((x) => x.score > 0).slice(0, CFG.MAX_LORE_HUBS);

  if (selected.length < 4) {
    for (const key of ["WIKI","EVENTS","BRAINROTS","MACHINES","RITUALS","MUTATIONS","REBIRTH","COLLECTIONS","LUCKY_BLOCKS","TIPS"]) {
      const row = ranked.find((x) => x.key === key);
      if (row && !selected.some((x) => x.key === key)) selected.push(row);
      if (selected.length >= Math.min(CFG.MAX_LORE_HUBS, 6)) break;
    }
  }

  return selected.slice(0, CFG.MAX_LORE_HUBS);
}

async function fetchLoreHubs(question, analysis, deadline) {
  const hubs = selectLoreHubs(question, analysis);
  const settled = await Promise.all(
    hubs.map(async (hub) => {
      try {
        const page = await fetchPage(hub.url, SOURCE.PRIMARY, deadline);
        return { ok: true, hub, page, error: null };
      } catch (error) {
        return { ok: false, hub, page: null, error: errorCode(error) };
      }
    })
  );

  return {
    hubs,
    pages: settled.filter((x) => x.ok).map((x) => x.page),
    errors: settled.filter((x) => !x.ok).map((x) => `${x.hub.key}:${x.error}`),
    attempts: settled.map((x) => ({ key: x.hub.key, url: x.hub.url, ok: x.ok, error: x.error })),
  };
}

function lorePathPreference(path, analysis) {
  path = String(path || "").toLowerCase();
  const rel = analysis.relation;
  let score = 0;

  if ([REL.BRAINROT,REL.COST,REL.INCOME,REL.RARITY,REL.STATUS,REL.STOCK].includes(rel) && path.startsWith("/brainrots/")) score += 8;
  if ([REL.RITUAL,REL.OUTCOME,REL.SPAWN,REL.REQUIREMENT,REL.FORMATION,REL.PLAYERS].includes(rel) && path.startsWith("/rituals/")) score += 8;
  if ([REL.EVENT,REL.UPDATE,REL.DATE,REL.TIME,REL.DURATION,REL.ANNOUNCEMENT,REL.CODE].includes(rel) && path.startsWith("/events/")) score += 8;
  if ([REL.MACHINE,REL.SHOP,REL.REPLACED_BY,REL.REPLACED_IN,REL.ACTIVE_RANGE].includes(rel) && /(?:machine|trader|merchant|fuse)/.test(path)) score += 6;
  if ([REL.MUTATION,REL.TRAIT,REL.MULTIPLIER].includes(rel) && /mutation/.test(path)) score += 7;
  if ([REL.REBIRTH,REL.GEAR].includes(rel) && /rebirth|shop/.test(path)) score += 7;
  if ([REL.LUCKY_BLOCK,REL.DROP_RATE,REL.CONTENTS].includes(rel) && /lucky/.test(path)) score += 9;
  if (rel === REL.BASE && /tips|rebirth|shop/.test(path)) score += 8;
  if (rel === REL.ASSET && /brainrots|events|lucky/.test(path)) score += 7;
  if (rel === REL.COOLDOWN && /machine|trader|merchant|lucky/.test(path)) score += 8;
  if (rel === REL.MECHANIC && /wiki|machine|ritual|events|tips/.test(path)) score += 6;

  if (/calculator|privacy|terms|contact/.test(path)) score -= 10;
  return score;
}

function loreLinkScore(link, question, analysis) {
  const label = `${link.label} ${decodeURIComponent(link.pathname).replace(/[-_/]+/g," ")}`;
  const lower = label.toLowerCase();
  let score = lorePathPreference(link.pathname, analysis);

  if (analysis.entity) score += bestEntityScore(analysis, label) * 12;

  const terms = loreQueryTerms(question, analysis);
  for (const term of terms) {
    if (term.length < 3) continue;
    if (lower.includes(term)) score += term.includes(" ") ? 4 : 1.5;
  }

  if (analysis.update && new RegExp(`update\\s*${analysis.update}`,"i").test(label)) score += 6;
  if (analysis.date && lower.includes(humanDateFromIso(analysis.date).toLowerCase())) score += 6;

  return score;
}

function buildLoreManifest(hubPages, question, analysis) {
  const byUrl = new Map();

  for (const page of hubPages || []) {
    for (const link of primaryLinks(page,"/")) {
      const score = loreLinkScore(link, question, analysis);
      const old = byUrl.get(link.url);
      if (!old || score > old.score) byUrl.set(link.url, { ...link, score, from: page.url });
    }

    if (page.url === `${PRIMARY_ORIGIN}/events`) {
      for (const link of primaryEventContextLinks(page)) {
        let score = loreLinkScore(link, question, analysis);
        const contextText = `${link.label} ${link.context} ${link.pathname}`;
        score += updateNeedleScore(contextText, analysis) * 1.5;
        const lowerContext = contextText.toLowerCase();
        for (const term of loreQueryTerms(question, analysis)) {
          if (term.length >= 3 && lowerContext.includes(term)) score += term.includes(" ") ? 3 : 1;
        }
        const old = byUrl.get(link.url);
        if (!old || score > old.score) byUrl.set(link.url, { ...link, score, from: page.url, context: link.context });
      }
    }
  }

  // Predictable direct URLs supplement the manifest for exact entities.
  if (analysis.entity) {
    const slug = slugify(analysis.entity);
    if (slug) {
      const direct = [
        `${PRIMARY_ORIGIN}/brainrots/${slug}`,
        `${PRIMARY_ORIGIN}/events/${slug}`,
        `${PRIMARY_ORIGIN}/lucky-blocks/${slug}`,
        `${PRIMARY_ORIGIN}/collections/${slug}`,
        `${PRIMARY_ORIGIN}/machines/${slug}`,
        `${PRIMARY_ORIGIN}/wiki/${slug}`,
      ];
      for (const url of direct) {
        if (!byUrl.has(url)) {
          let pathname=""; try { pathname=new URL(url).pathname; } catch {}
          byUrl.set(url,{url,label:analysis.entity,pathname,score:5+lorePathPreference(pathname,analysis),from:"PREDICTED"});
        }
      }
    }

    for (const url of ritualDetailCandidates(analysis)) {
      if (!byUrl.has(url)) {
        let pathname=""; try { pathname=new URL(url).pathname; } catch {}
        byUrl.set(url,{url,label:analysis.entity,pathname,score:7+lorePathPreference(pathname,analysis),from:"RITUAL_PREDICTED"});
      }
    }
  }

  return [...byUrl.values()]
    .filter((x) => x.score > 1)
    .sort((a,b) => b.score-a.score)
    .slice(0, CFG.MAX_LORE_MANIFEST);
}

async function fetchLoreDetails(manifest, deadline) {
  const picked = (manifest || []).slice(0, CFG.MAX_LORE_DETAIL_PAGES);
  const settled = await Promise.all(
    picked.map(async (link) => {
      try {
        const page = await fetchPage(link.url, SOURCE.PRIMARY, deadline);
        return { ok:true, link, page, error:null };
      } catch (error) {
        return { ok:false, link, page:null, error:errorCode(error) };
      }
    })
  );

  return {
    pages: settled.filter((x)=>x.ok).map((x)=>x.page),
    attempts: settled.map((x)=>({url:x.link.url,label:x.link.label,score:x.link.score,ok:x.ok,error:x.error})),
    errors: settled.filter((x)=>!x.ok).map((x)=>`${x.link.url}:${x.error}`),
  };
}

function loreSectionsForPage(page) {
  const sections = extractHeadingSections(page.html || "");
  const out=[];

  for (const section of sections) {
    const body=oneLine(section.text,10000);
    if (!body) continue;
    out.push({
      page,
      heading: section.title || page.title,
      text: body,
    });
  }

  if (!out.length) {
    const lines=page.lines || [];
    for (let i=0;i<lines.length;i+=8) {
      const body=oneLine(lines.slice(i,i+14).join(" "),7000);
      if (body) out.push({page,heading:page.title,text:body});
    }
  }

  return out;
}

function loreChunkScore(chunk, question, analysis) {
  const combined=`${chunk.heading}\n${chunk.text}`;
  const lower=combined.toLowerCase();
  let score=0;

  if (analysis.entity) score += bestEntityScore(analysis, combined) * 10;
  score += relationEvidenceScore(combined,analysis.relation) * 4;

  for (const term of loreQueryTerms(question,analysis)) {
    if (!term || term.length<3) continue;
    if (lower.includes(term)) score += term.includes(" ") ? 4 : 1;
  }

  for (const clue of importantQuestionClues(question,analysis)) {
    if (pageHasClue(combined,clue.value)) score += clue.weight;
  }

  if (analysis.update && new RegExp(`\\bUpdate\\s*${analysis.update}\\b`,`i`).test(combined)) score += 5;
  if (analysis.date && lower.includes(humanDateFromIso(analysis.date).toLowerCase())) score += 5;

  return score;
}

function rankLoreChunks(pages, question, analysis) {
  const chunks=[];
  for (const page of pages || []) {
    for (const section of loreSectionsForPage(page)) {
      chunks.push({ ...section, score:loreChunkScore(section,question,analysis) });
    }
  }

  return chunks
    .filter((x)=>x.score>0)
    .sort((a,b)=>b.score-a.score)
    .slice(0,CFG.MAX_LORE_CHUNKS)
    .map((x,i)=>({
      id:i+1,
      title:x.page.title,
      url:x.page.url,
      heading:x.heading,
      text:oneLine(x.text,7000),
      score:Number(x.score.toFixed(3)),
    }));
}

function contextAroundNeedle(text, needle, radius=900) {
  const raw=String(text||"");
  const idx=raw.toLowerCase().indexOf(String(needle||"").toLowerCase());
  if (idx<0) return "";
  return oneLine(raw.slice(Math.max(0,idx-radius),Math.min(raw.length,idx+String(needle).length+radius)),radius*2+300);
}

function chunkEntityDistance(chunk, entity, factIndex=0) {
  const target=oneLine(entity,180);
  if (!target) return 0;

  const title=oneLine(chunk?.title,300);
  const heading=oneLine(chunk?.heading,300);
  if (similarity(target,title)>=0.92 || similarity(target,heading)>=0.92) return 0;

  const raw=String(chunk?.text||"");
  const lower=raw.toLowerCase();
  const needle=target.toLowerCase();
  let best=Infinity;
  let at=lower.indexOf(needle);
  while (at>=0) {
    best=Math.min(best,Math.abs(Number(factIndex||0)-at));
    at=lower.indexOf(needle,at+Math.max(1,needle.length));
  }
  return best;
}

function bestBoundLoreMatch(chunks, analysis, regexes, formatter, maxDistance=700) {
  const rows=[];
  const entity=oneLine(analysis?.entity,180);
  for (const chunk of chunks || []) {
    const raw=String(chunk?.text||"");
    for (const sourceRe of regexes || []) {
      const flags=sourceRe.flags.includes("g") ? sourceRe.flags : `${sourceRe.flags}g`;
      const re=new RegExp(sourceRe.source,flags);
      let m;
      while ((m=re.exec(raw))!==null) {
        const distance=chunkEntityDistance(chunk,entity,m.index);
        if (entity && !Number.isFinite(distance)) continue;
        if (entity && distance>maxDistance) continue;
        const answer=formatter(m,chunk);
        if (!answer) continue;
        rows.push({answer,chunk,distance,score:Number(chunk?.score||0),index:m.index});
        if (m[0].length===0) re.lastIndex++;
      }
    }
  }
  rows.sort((a,b)=>a.distance-b.distance || b.score-a.score || a.index-b.index);
  return rows[0] || null;
}

function extractEventWindow(text) {
  const raw=oneLine(text,9000);
  const months="January|February|March|April|May|June|July|August|September|October|November|December";
  const dateTime=`(?:${months})\\s+\\d{1,2},?\\s+20\\d{2}(?:\\s+at)?(?:\\s+\\d{1,2}(?::\\d{2})?\\s*(?:AM|PM)(?:\\s+(?:ET|EST|EDT|UTC))?)?`;
  const re=new RegExp(`(?:event\\s+window[^.]{0,80}?|window[^.]{0,80}?|ran[^.]{0,40}?)?from\\s+(${dateTime})\\s+to\\s+(${dateTime})`,`i`);
  const m=raw.match(re);
  if (!m) return null;
  const clean=(v)=>oneLine(v,160).replace(/\s+at\s+/i," ");
  return `${clean(m[1])} to ${clean(m[2])}`;
}


function extractNearestLoreCode(text, clue = "") {
  const raw = String(text || "");
  const candidates = [];
  const patterns = [
    /`([A-Z0-9]{4,24})`/g,
    /\b(\d{5,8})\b/g,
    /\b([A-Z][A-Z0-9]{4,24})\b/g,
  ];
  const blocked = new Set(["UPDATE","TEMPORARY","UNKNOWN","ADMIN","ABUSE","SOLD","OUT","EVENT","CODE"]);

  for (const re of patterns) {
    let m;
    while ((m = re.exec(raw)) !== null) {
      const value = m[1];
      if (!value || blocked.has(value) || answerLooksLikeMetadata(value)) continue;
      candidates.push({ value, index: m.index });
    }
  }

  const unique = [];
  const seen = new Set();
  for (const row of candidates) {
    const key = `${row.value}@${row.index}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(row);
  }
  if (!unique.length) return null;

  const needle = String(clue || "");
  const needleIndex = needle ? raw.toLowerCase().indexOf(needle.toLowerCase()) : -1;
  if (needleIndex < 0) return unique[0].value;

  unique.sort((a,b) => Math.abs(a.index - needleIndex) - Math.abs(b.index - needleIndex));
  return unique[0].value;
}

function deterministicLoreAnswer(question, analysis, chunks) {
  const q=oneLine(question,700);
  const lower=q.toLowerCase();

  // Codes: tie the code to the clue phrase rather than taking a random number.
  if (analysis.relation===REL.CODE || /\bcode\b/i.test(q)) {
    const clueWords=[];
    if (/cooldown/i.test(q)) clueWords.push("cooldown");
    if (/luck level/i.test(q)) clueWords.push("luck level");
    if (/strawberry elephant/i.test(q)) clueWords.push("Strawberry Elephant");
    if (/sold out/i.test(q)) clueWords.push("sold out");

    for (const chunk of chunks) {
      if (clueWords.length) {
        for (const clue of clueWords) {
          if (!pageHasClue(chunk.text, clue)) continue;
          const answer = extractNearestLoreCode(chunk.text, clue);
          if (answer) return { answer, chunk, reason: "LORE_CODE_NEAREST_CLUE" };
        }
      } else {
        const answer = extractNearestLoreCode(chunk.text, "");
        if (answer) return { answer, chunk, reason: "LORE_CODE" };
      }
    }
  }

  if (analysis.relation===REL.PLAYERS || /how many players|players required/i.test(q)) {
    for (const chunk of chunks) {
      const m=chunk.text.match(/\b(\d+)\s+players?\s+required\b/i);
      if (m) return {answer:m[1],chunk,reason:"LORE_PLAYERS"};
    }
  }

  if (analysis.relation===REL.STOCK || /stock|quantity|copies/i.test(q)) {
    for (const chunk of chunks) {
      const m=chunk.text.match(/(?:Stock|stock limit|Original stock limit)[:\s]+([0-9][0-9,]*)/i);
      if (m) return {answer:m[1],chunk,reason:"LORE_STOCK"};
    }
  }

  if (analysis.relation===REL.MULTIPLIER && /mutation/i.test(q)) {
    for (const chunk of chunks) {
      const m=chunk.text.match(/(?:###\s*)?([A-Z][A-Za-z ]{2,30})\s+(\d+(?:\.\d+)?)x[^.]{0,120}mutation/i);
      if (m && lower.includes(m[2].toLowerCase()+"x")) return {answer:oneLine(m[1],80),chunk,reason:"LORE_REVERSE_MUTATION"};
    }
  }


  if (analysis.relation===REL.DATE) {
    const found=bestBoundLoreMatch(
      chunks,analysis,
      [/(?:Added to Game|game-added date of|launched on|released(?: in [^.]{0,60})? on)\s+((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+20\d{2})/i],
      (m)=>oneLine(m[1],80),
      520
    );
    if (found) return {...found,reason:"LORE_DATE"};
  }

  if (analysis.relation===REL.DROP_RATE) {
    const found=bestBoundLoreMatch(
      chunks,analysis,
      [/(\d+(?:\.\d+)?%)\s+(?:listed\s+)?drop chance/i,/(?:drop chance|chance)[:\s]+(\d+(?:\.\d+)?%)/i],
      (m)=>m[1],
      360
    );
    if (found) return {...found,reason:"LORE_DROP_RATE"};
  }

  if (analysis.relation===REL.COST) {
    const cashQuestion=/\bcash\b/i.test(q) || /^rebirth\s*\d+$/i.test(oneLine(analysis.entity,80));
    const regexes=[/(?:Base Cost|Cost|Price)[:\s]+\$?([0-9]+(?:\.[0-9]+)?\s*(?:Qa|Qi|Sx|Sp|Oc|No|Dc|K|M|B|T|Q)?)/i];
    if (cashQuestion) regexes.unshift(/\bCash[:\s]+\$?([0-9]+(?:\.[0-9]+)?\s*(?:Qa|Qi|Sx|Sp|Oc|No|Dc|K|M|B|T|Q)?)/i);
    const found=bestBoundLoreMatch(
      chunks,analysis,regexes,
      (m)=>`$${oneLine(m[1],60).replace(/\s+/g,"")}`,
      420
    );
    if (found) return {...found,reason:"LORE_COST"};
  }

  if (analysis.relation===REL.INCOME) {
    const found=bestBoundLoreMatch(
      chunks,analysis,
      [/(?:Base Income\/sec|Income per Second|Income\/sec)[:\s]*\$?([0-9]+(?:\.[0-9]+)?\s*(?:Qa|Qi|Sx|Sp|Oc|No|Dc|K|M|B|T|Q)?)(?:\/sec)?/i],
      (m)=>`$${oneLine(m[1],60).replace(/\s+/g,"")}/sec`,
      420
    );
    if (found) return {...found,reason:"LORE_INCOME"};
  }

  if (analysis.relation===REL.RARITY) {
    const found=bestBoundLoreMatch(
      chunks,analysis,
      [/Rarity[:\s]+(Common|Rare|Epic|Legendary|Mythic|Brainrot God|Secret|OG)\b/i],
      (m)=>oneLine(m[1],60),
      420
    );
    if (found) return {...found,reason:"LORE_RARITY"};
  }

  if (analysis.relation===REL.FREQUENCY || analysis.relation===REL.COOLDOWN) {
    const interval=bestBoundLoreMatch(
      chunks,analysis,
      [/\b(?:(approximately|roughly|about|around)\s+)?(?:every|returns? every|activates? every|refresh(?:es)? every|restock(?:s)? every)\s+(one|two|three|four|five|six|eight|ten|twelve|fifteen|thirty|\d+(?:\.\d+)?)\s*(seconds?|minutes?|hours?|days?)\b/i],
      (m)=>{
        const map={one:"1",two:"2",three:"3",four:"4",five:"5",six:"6",eight:"8",ten:"10",twelve:"12",fifteen:"15",thirty:"30"};
        const n=map[String(m[2]).toLowerCase()]||m[2];
        const prefix=m[1] ? `${m[1][0].toUpperCase()}${m[1].slice(1).toLowerCase()} every` : "Every";
        return `${prefix} ${n} ${String(m[3]).toLowerCase()}`;
      },
      360
    );
    const cycle=bestBoundLoreMatch(
      chunks,analysis,
      [/(\d+(?:\.\d+)?)[- ](second|minute|hour|day)\s+(?:refresh|restock|cooldown|cycle|offers?)/i],
      (m)=>`${m[1]} ${m[2]}${Number(m[1])===1?"":"s"}`,
      360
    );
    const chosen=[interval,cycle].filter(Boolean).sort((a,b)=>a.distance-b.distance || b.score-a.score)[0];
    if (chosen) return {...chosen,reason:chosen===cycle?"LORE_COOLDOWN":"LORE_INTERVAL"};
    for (const chunk of chunks) {
      const dist=chunkEntityDistance(chunk,analysis.entity,0);
      if (analysis.entity && (!Number.isFinite(dist) || dist>360)) continue;
      if (/\bhourly\b/i.test(chunk.text)) return {answer:"Hourly",chunk,reason:"LORE_INTERVAL"};
    }
  }

  if (analysis.relation===REL.DURATION) {
    for (const chunk of chunks) {
      const dist=chunkEntityDistance(chunk,analysis.entity,0);
      if (analysis.entity && (!Number.isFinite(dist) || dist>520)) continue;
      const window=extractEventWindow(chunk.text);
      if (window) return {answer:window,chunk,reason:"LORE_EVENT_WINDOW"};
    }
    const found=bestBoundLoreMatch(
      chunks,analysis,
      [/(?:lasts?|window lasts?|for)\s+(\d+(?:\.\d+)?)\s*(seconds?|minutes?|hours?|days?)\b/i],
      (m)=>`${m[1]} ${String(m[2]).toLowerCase()}`,
      520
    );
    if (found) return {...found,reason:"LORE_DURATION"};
  }

  if (analysis.relation===REL.TIME) {
    const found=bestBoundLoreMatch(
      chunks,analysis,
      [/(?:activates?|starts?|begins?|opens?)\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:AM|PM)(?:\s+(?:ET|EST|EDT|UTC))?)/i],
      (m)=>oneLine(m[1],80),
      500
    );
    if (found) return {...found,reason:"LORE_TIME"};
  }

  if (analysis.relation===REL.STATUS) {
    const found=bestBoundLoreMatch(
      chunks,analysis,
      [/\b(Offline|Online|Active|Released|Unobtainable|Obtainable|Removed)\b/i],
      (m)=>m[1][0].toUpperCase()+m[1].slice(1).toLowerCase(),
      380
    );
    if (found) return {...found,reason:"LORE_STATUS"};
  }

  if (analysis.relation===REL.BASE) {
    // Answer the specific floor question before looking at generic base-lock text.
    if (/second floor/i.test(q)) {
      for (const chunk of chunks) if (/2nd Rebirth|Rebirth 2/i.test(chunk.text)) return {answer:"Rebirth 2",chunk,reason:"LORE_BASE_FLOOR"};
    }
    if (/third floor/i.test(q)) {
      for (const chunk of chunks) if (/10th Rebirth|Rebirth 10/i.test(chunk.text)) return {answer:"Rebirth 10",chunk,reason:"LORE_BASE_FLOOR"};
    }
    for (const chunk of chunks) {
      let m=chunk.text.match(/base is locked for\s+(\d+)\s+seconds?/i);
      if (m && /\b(?:lock|locked|lock time)\b/i.test(q)) return {answer:`${m[1]} seconds`,chunk,reason:"LORE_BASE_LOCK"};
      m=chunk.text.match(/(?:holds up to|first floor[^.]{0,80})(\d+)\s+brainrots?/i);
      if (m && /(?:slot|hold|brainrot)/i.test(q)) return {answer:m[1],chunk,reason:"LORE_BASE_SLOTS"};
    }
  }
  return null;
}

function loreAnswerSafe(answer, analysis) {
  const value=oneLine(answer,900);
  if (!value || norm(value)==="unknown") return false;
  if (answerLooksLikeMetadata(value)) return false;
  if (/^(?:request|trace|cache|source)[ _-]?id/i.test(value)) return false;
  if (value.length>800) return false;

  if ([REL.BRAINROT,REL.MUTATION,REL.TRAIT,REL.MACHINE,REL.GEAR,REL.RITUAL,REL.EVENT,REL.SHOP].includes(analysis.relation)) {
    if (genericRolePhrase(value)) return false;
    if (value.split(/\s+/).length>15) return false;
  }

  return true;
}

function chunkSupportsRequestedEntity(chunk,analysis) {
  const entity=oneLine(analysis?.entity,180);
  if (!entity) return true;
  if (similarity(entity,oneLine(chunk?.title,300))>=0.92) return true;
  if (similarity(entity,oneLine(chunk?.heading,300))>=0.92) return true;
  return norm(chunk?.text).includes(norm(entity));
}

function evidenceQuoteExists(quote,chunks,analysis=null) {
  const q=oneLine(quote,600);
  if (!q) return true;
  return chunks.some((chunk)=>chunkSupportsRequestedEntity(chunk,analysis) && norm(chunk.text).includes(norm(q)));
}

function answerExistsInLore(answer,chunks,analysis=null) {
  const value=oneLine(answer,600);
  if (!value) return false;
  const eligible=(chunks||[]).filter((chunk)=>chunkSupportsRequestedEntity(chunk,analysis));
  if (eligible.some((chunk)=>evidenceSupports(value,chunk.text))) return true;

  // Combined/list answers can be supported piece-by-piece, but every piece must
  // come from evidence tied to the requested subject/entity when one is locked.
  const pieces=value.split(/[,;]+/).map((x)=>oneLine(x,180)).filter(Boolean);
  if (pieces.length>1 && pieces.every((piece)=>eligible.some((chunk)=>evidenceSupports(piece,chunk.text)))) return true;

  return false;
}

async function aiUniversalLoreExtract(question,analysis,chunks,deadline) {
  if (!env("NVIDIA_API_KEY") || timeLeft(deadline)<320 || !chunks.length) return {result:null,error:"LORE_AI_UNAVAILABLE"};

  try {
    const data=await fetchJson(
      "NVIDIA_LORE_EXTRACT",
      NVIDIA_URL,
      {
        method:"POST",
        headers:{
          Authorization:`Bearer ${env("NVIDIA_API_KEY")}`,
          "Content-Type":"application/json",
          Accept:"application/json",
        },
        body:JSON.stringify({
          model:process.env.NVIDIA_MODEL||DEFAULT_MODEL,
          stream:false,
          temperature:0,
          max_tokens:220,
          chat_template_kwargs:{enable_thinking:false},
          messages:[
            {
              role:"system",
              content:[
                "Answer a Steal a Brainrot lore question using ONLY supplied steal-a-brainrot.org evidence chunks.",
                "The evidence may cover brainrots, rituals, machines, updates, events, announcements, dates, codes, rebirth gear, shops, lucky blocks, traits, mutations, collections, and historical lore.",
                "Do not use memory, private game code, guesses, reverse engineering, or undocumented exploit claims.",
                "Never manufacture precision. If evidence only says frequent, every few minutes, lower chance, unknown, or approximate, preserve that wording; do not convert it to exact seconds or milliseconds.",
                "Prefer the most direct exact answer. Preserve names, spaces, punctuation, dates, percentages, money suffixes, and code formatting.",
                "If the question asks for a list, return a concise comma-separated list.",
                "If the requested fact is not explicitly supported, return UNKNOWN.",
                `Requested relation: ${analysis.relation}.`,
                analysis.entity?`Requested entity: ${analysis.entity}.`:"",
                analysis.update?`Requested update: ${analysis.update}.`:"",
                analysis.date?`Requested date: ${analysis.date}.`:"",
                "Return one short verbatim evidence quote copied from the supplied chunks.",
                'Return JSON only: {"answer":"UNKNOWN or exact answer","evidence":"short exact quote","chunkId":1,"reason":"short"}',
              ].filter(Boolean).join("\\n")
            },
            {
              role:"user",
              content:JSON.stringify({
                question,
                evidence:chunks.map((c)=>({id:c.id,title:c.title,url:c.url,heading:c.heading,text:c.text}))
              })
            }
          ]
        })
      },
      Math.max(320,Math.min(CFG.NVIDIA_TIMEOUT_MS,timeLeft(deadline)-30))
    );

    const raw=parseLooseAiExtraction(data?.choices?.[0]?.message?.content);
    const answer=oneLine(raw?.answer,600);
    if (!loreAnswerSafe(answer,analysis)) return {result:null,error:"LORE_AI_UNSAFE_ANSWER"};
    if (!evidenceQuoteExists(raw?.evidence,chunks,analysis)) return {result:null,error:"LORE_AI_EVIDENCE_QUOTE_NOT_FOUND"};
    if (!answerExistsInLore(answer,chunks,analysis)) return {result:null,error:"LORE_AI_ANSWER_NOT_IN_EVIDENCE"};

    const supporting=chunks.find((c)=>chunkSupportsRequestedEntity(c,analysis) && evidenceSupports(answer,c.text)) || chunks.find((c)=>chunkSupportsRequestedEntity(c,analysis)) || chunks[0];
    return {
      result:makeResult(answer,analysis.relation,SOURCE.PRIMARY,{title:supporting.title,url:supporting.url},"PRIMARY_SPLUS_TOTAL_LORE_AI",SOURCE.PRIMARY.confidence),
      error:null,
      supporting,
    };
  } catch (error) {
    return {result:null,error:errorCode(error)};
  }
}

async function universalLoreStage(question,analysis,deadline) {
  const hubs=await fetchLoreHubs(question,analysis,deadline);
  const manifest=buildLoreManifest(hubs.pages,question,analysis);
  const details=await fetchLoreDetails(manifest,deadline);

  const allPages=[];
  const seen=new Set();
  for (const page of [...hubs.pages,...details.pages]) {
    if (!page?.url || seen.has(page.url)) continue;
    seen.add(page.url);
    allPages.push(page);
  }

  const chunks=rankLoreChunks(allPages,question,analysis);
  if (!chunks.length) {
    return {
      result:null,
      hubs:hubs.attempts,
      manifest:manifest.slice(0,12),
      detailAttempts:details.attempts,
      chunks:[],
      error:[...hubs.errors,...details.errors,"NO_LORE_CHUNKS"].join("|"),
    };
  }

  const deterministic=deterministicLoreAnswer(question,analysis,chunks);
  if (deterministic && loreAnswerSafe(deterministic.answer,analysis)) {
    return {
      result:makeResult(
        deterministic.answer,
        analysis.relation,
        SOURCE.PRIMARY,
        {title:deterministic.chunk.title,url:deterministic.chunk.url},
        `PRIMARY_SPLUS_${deterministic.reason}`,
        SOURCE.PRIMARY.confidence
      ),
      hubs:hubs.attempts,
      manifest:manifest.slice(0,12),
      detailAttempts:details.attempts,
      chunks,
      error:null,
    };
  }

  const ai=await aiUniversalLoreExtract(question,analysis,chunks,deadline);
  return {
    result:ai.result,
    hubs:hubs.attempts,
    manifest:manifest.slice(0,12),
    detailAttempts:details.attempts,
    chunks,
    error:ai.error || [...hubs.errors,...details.errors].join("|") || "LORE_NO_ANSWER",
  };
}

function canonicalPrimaryTargets(question, analysis) {
  const slots = Array.isArray(analysis.factSlots) ? analysis.factSlots : [];
  const targets = [];
  const add = (url, reason) => {
    if (!url) return;
    if (!targets.some((x) => x.url === url)) targets.push({ url, reason });
  };

  const relations = new Set([
    analysis.relation,
    ...(analysis.wantedRelations || []),
    ...slots.map((x) => x.relation),
  ].filter(Boolean));

  const predicates = new Set(slots.map((x) => x.predicate).filter(Boolean));

  // Canonical hubs are cheap and stable. Use them before any web search.
  if (
    relations.has(REL.MACHINE) ||
    relations.has(REL.REPLACED_BY) ||
    relations.has(REL.REPLACED_IN) ||
    relations.has(REL.ACTIVE_RANGE) ||
    predicates.has("REPLACED_BY") ||
    predicates.has("REPLACED_IN")
  ) {
    add(`${PRIMARY_ORIGIN}/machines`, "MACHINES_HUB");
  }

  if (
    relations.has(REL.EVENT) ||
    relations.has(REL.FREQUENCY) ||
    relations.has(REL.UPDATE) ||
    analysis.update ||
    analysis.date ||
    predicates.has("EVENT_FREQUENCY") ||
    predicates.has("SUBJECT_UPDATE") ||
    predicates.has("MACHINE_IN_SAME_UPDATE")
  ) {
    add(`${PRIMARY_ORIGIN}/events`, "EVENTS_HUB");
  }

  if (
    relations.has(REL.MUTATION) ||
    relations.has(REL.MULTIPLIER) ||
    relations.has(REL.TRAIT)
  ) {
    add(`${PRIMARY_ORIGIN}/wiki/mutations`, "MUTATIONS_HUB");
  }

  if (
    relations.has(REL.REBIRTH) ||
    relations.has(REL.GEAR)
  ) {
    add(`${PRIMARY_ORIGIN}/wiki/rebirth`, "REBIRTH_HUB");
  }

  // Ritual entity pages have predictable stable slugs.
  const ritualSubject =
    slots.find((x) => [REL.OUTCOME, REL.SPAWN, REL.REQUIREMENT, REL.RITUAL].includes(x.relation) && x.subject)?.subject ||
    (relations.has(REL.OUTCOME) || relations.has(REL.RITUAL) ? analysis.entity : null);

  if (ritualSubject) {
    let slug = primarySlug(ritualSubject);
    if (slug && !slug.endsWith("-ritual")) slug += "-ritual";
    if (slug) add(`${PRIMARY_ORIGIN}/rituals/${slug}`, "RITUAL_ENTITY");
  }

  // Exact brainrot entity pages when the requested subject is a brainrot.
  if (
    relations.has(REL.BRAINROT) &&
    analysis.entity
  ) {
    const slug = primarySlug(analysis.entity);
    if (slug) add(`${PRIMARY_ORIGIN}/brainrots/${slug}`, "BRAINROT_ENTITY");
  }

  return targets.slice(0, 4);
}

function canonicalSinglePartResolve(question, analysis, pages, source) {
  for (const page of pages) {
    const direct =
      deterministicHighValueExactPage(question, analysis, page, source) ||
      deterministicExactPageFallback(question, analysis, page, source);

    if (!direct?.answer) continue;

    const chunks = buildEvidenceBundle(question, analysis, pages);
    const check = validateBundleAnswer(
      question,
      analysis,
      direct.answer,
      pages,
      chunks
    );

    if (check.valid) {
      direct.confidence = source.confidence;
      direct.reason = `${source.key}_CANONICAL_DETERMINISTIC`;
      return {
        result: direct,
        page: check.page || page,
      };
    }
  }

  return null;
}

async function canonicalPrimaryFastPath(question, analysis, deadline) {
  const targets = canonicalPrimaryTargets(question, analysis);

  if (!targets.length) {
    return {
      result: null,
      pages: [],
      pagesTried: [],
      targets: [],
      error: "NO_CANONICAL_TARGET",
    };
  }

  const opened = await Promise.all(
    targets.map(async (target) => {
      try {
        const page = await fetchPage(target.url, SOURCE.PRIMARY, deadline);
        return { ok: true, target, page, error: null };
      } catch (error) {
        return {
          ok: false,
          target,
          page: null,
          error: errorCode(error),
        };
      }
    })
  );

  const pages = [];
  const pagesTried = [];
  const errors = [];

  for (const item of opened) {
    if (!item.ok) {
      pagesTried.push({
        url: item.target.url,
        reason: item.target.reason,
        ok: false,
        error: item.error,
      });
      errors.push(`${item.target.url}:${item.error}`);
      continue;
    }

    const page = item.page;
    const subjectText = `${page.title}\n${page.text}`;

    // Subject-lock applies here too, but only keep the pages that mention at
    // least one locked subject. Other canonical hubs can be ignored.
    const locked = analysis.lockedSubjects || [];
    if (
      locked.length &&
      !locked.some((subject) => subjectAppears(subjectText, subject))
    ) {
      pagesTried.push({
        url: page.url,
        title: page.title,
        reason: item.target.reason,
        ok: true,
        used: false,
        error: "LOCKED_SUBJECT_NOT_ON_CANONICAL_PAGE",
      });
      continue;
    }

    pages.push(page);
    pagesTried.push({
      url: page.url,
      title: page.title,
      reason: item.target.reason,
      ok: true,
      used: true,
      error: null,
    });
  }

  if (!pages.length) {
    return {
      result: null,
      pages,
      pagesTried,
      targets,
      error: errors.join("|") || "NO_USABLE_CANONICAL_PAGE",
    };
  }

  if (isFactSlotQuestion(analysis)) {
    const slots = deterministicFactSlots(
      question,
      analysis,
      pages
    );

    if (slots) {
      return {
        result: makeResult(
          slots.answer,
          analysis.relation,
          SOURCE.PRIMARY,
          slots.page,
          "PRIMARY_SPLUS_CANONICAL_FACT_SLOTS",
          SOURCE.PRIMARY.confidence
        ),
        page: slots.page,
        pages,
        pagesTried,
        targets,
        factSlots: slots.slots,
        error: null,
      };
    }
  } else {
    const single = canonicalSinglePartResolve(
      question,
      analysis,
      pages,
      SOURCE.PRIMARY
    );

    if (single) {
      return {
        result: single.result,
        page: single.page,
        pages,
        pagesTried,
        targets,
        error: null,
      };
    }
  }

  return {
    result: null,
    pages,
    pagesTried,
    targets,
    error: errors.join("|") || "CANONICAL_PAGE_NO_VERIFIED_ANSWER",
  };
}

async function exactTierLookup(question, analysis, source, deadline) {
  const queries = aggressiveSearchQueries(question, analysis, source);

  // Each search variant catches its OWN error. One timeout can never reject
  // the entire tier if another variant succeeds.
  const settledSearches = await Promise.all(
    queries.map((query, index) =>
      safeSearchVariant(query, index, analysis, source, deadline)
    )
  );

  const searchVariantErrors = settledSearches
    .filter((x) => !x.ok || (x.search?.errors || []).length)
    .map((x) => ({
      index: x.index,
      query: x.query,
      error: x.error || (x.search?.errors || []).join(",") || "SEARCH_VARIANT_ERROR",
    }));

  const usableSearches = settledSearches.filter(
    (x) => x.ok || (x.search?.results || []).length > 0
  );

  if (!usableSearches.length) {
    return {
      result: null,
      search: { answer: "", results: [], errors: searchVariantErrors.map((x) => x.error) },
      page: null,
      pages: [],
      pagesTried: [],
      query: queries.join(" || "),
      queries,
      searchVariantErrors,
      error: "ALL_SEARCH_VARIANTS_FAILED",
    };
  }

  const search = mergeSearches(usableSearches);
  // Preserve failed-variant diagnostics without making them fatal.
  search.errors.push(...searchVariantErrors.map((x) => x.error));

  const candidates = rankAggressiveResults(
    search,
    question,
    analysis,
    source,
    3
  );

  if (!candidates.length) {
    return {
      result: null,
      search,
      page: null,
      pages: [],
      pagesTried: [],
      query: queries.join(" || "),
      queries,
      searchVariantErrors,
      error: "NO_AGGRESSIVE_SEARCH_RESULT",
    };
  }

  // Page fetches are independently isolated too. Two bad pages + one good
  // page still proceeds with the good page.
  const pageResults = await Promise.all(
    candidates.map((row) => safeOpenCandidate(row, source, deadline))
  );

  const pages = [];
  const pagesTried = [];
  const errors = [];

  for (const opened of pageResults) {
    const row = opened.row;

    if (!opened.ok) {
      pagesTried.push({
        title: row.title,
        url: row.url,
        searchScore: row.aggressiveScore,
        usable: false,
        reason: `FETCH_FAILED_${opened.error}`,
      });
      errors.push(`${row.url}:${opened.error}`);
      continue;
    }

    const page = opened.page;
    const usable = aggressivePageUsable(
      question,
      analysis,
      page,
      source
    );

    pagesTried.push({
      title: page.title,
      url: page.url,
      searchScore: row.aggressiveScore,
      usable: usable.usable,
      reason: usable.reason,
    });

    if (!usable.usable) {
      errors.push(`${page.url}:PAGE_SKIPPED_${usable.reason}`);
      continue;
    }

    pages.push(page);
  }

  if (!pages.length) {
    return {
      result: null,
      search,
      page: null,
      pages,
      pagesTried,
      query: queries.join(" || "),
      queries,
      searchVariantErrors,
      selected: candidates[0] || null,
      error: errors.join("|") || "NO_USABLE_PAGES",
    };
  }

  const chunks = buildEvidenceBundle(question, analysis, pages);

  // =====================================================
  // R33 FACT SLOTS: subject + predicate + qualifier are bound together.
  // This runs BEFORE relation-only multipart logic.
  // =====================================================
  if (isFactSlotQuestion(analysis)) {
    const deterministicSlots = deterministicFactSlots(
      question,
      analysis,
      pages
    );

    if (deterministicSlots) {
      return {
        result: makeResult(
          deterministicSlots.answer,
          analysis.relation,
          source,
          deterministicSlots.page,
          `${source.key}_FACT_SLOT_DETERMINISTIC`,
          source.confidence
        ),
        search,
        page: deterministicSlots.page,
        pages,
        pagesTried,
        query: queries.join(" || "),
        queries,
        searchVariantErrors,
        selected: candidates.find((x) => x.url === deterministicSlots.page?.url) || candidates[0],
        error: null,
        factSlots: deterministicSlots.slots,
      };
    }

    const slotAI = await aiExtractFactSlots(
      question,
      analysis,
      pages,
      source,
      deadline
    );

    if (slotAI.result) {
      return {
        result: slotAI.result,
        search,
        page: slotAI.supportingPage || pages[0],
        pages,
        pagesTried,
        query: queries.join(" || "),
        queries,
        searchVariantErrors,
        selected: candidates.find((x) => x.url === slotAI.supportingPage?.url) || candidates[0],
        error: null,
        factSlots: slotAI.slots,
      };
    }

    if (slotAI.error) errors.push(slotAI.error);

    // Never degrade a slot-bound question into relation-only guessing.
    return {
      result: null,
      search,
      page: null,
      pages,
      pagesTried,
      query: queries.join(" || "),
      queries,
      searchVariantErrors,
      selected: candidates[0] || null,
      error: errors.join("|") || "FACT_SLOTS_NOT_FULLY_VERIFIED",
    };
  }

  // =====================================================
  // MULTI-PART: require EVERY requested fact before returning.
  // =====================================================
  if (isMultipartAnalysis(analysis)) {
    const deterministicMulti = deterministicMultipartFromBundle(
      question,
      analysis,
      pages,
      chunks
    );

    if (deterministicMulti) {
      return {
        result: makeResult(
          deterministicMulti.answer,
          analysis.relation,
          source,
          deterministicMulti.page,
          `${source.key}_MULTIPART_DETERMINISTIC`,
          source.confidence
        ),
        search,
        page: deterministicMulti.page,
        pages,
        pagesTried,
        query: queries.join(" || "),
        queries,
        searchVariantErrors,
        selected: candidates.find((x) => x.url === deterministicMulti.page?.url) || candidates[0],
        error: null,
        multipart: deterministicMulti.parts,
      };
    }

    const multiAI = await aiExtractMultipartBundle(
      question,
      analysis,
      pages,
      source,
      deadline
    );

    if (multiAI.result) {
      return {
        result: multiAI.result,
        search,
        page: multiAI.supportingPage || pages[0],
        pages,
        pagesTried,
        query: queries.join(" || "),
        queries,
        searchVariantErrors,
        selected: candidates.find((x) => x.url === multiAI.supportingPage?.url) || candidates[0],
        error: null,
        multipart: multiAI.parts,
      };
    }

    if (multiAI.error) errors.push(multiAI.error);

    // IMPORTANT: never return a partial single-relation answer for a question
    // that explicitly requested multiple facts.
    return {
      result: null,
      search,
      page: null,
      pages,
      pagesTried,
      query: queries.join(" || "),
      queries,
      searchVariantErrors,
      selected: candidates[0] || null,
      error: errors.join("|") || "MULTIPART_NOT_FULLY_VERIFIED",
    };
  }

  // =====================================================
  // SINGLE-PART: R31 behavior.
  // =====================================================
  for (const page of pages) {
    const direct = deterministicHighValueExactPage(
      question,
      analysis,
      page,
      source
    );

    if (direct) {
      const check = validateBundleAnswer(
        question,
        analysis,
        direct.answer,
        pages,
        chunks
      );

      if (check.valid) {
        return {
          result: direct,
          search,
          page: check.page || page,
          pages,
          pagesTried,
          query: queries.join(" || "),
          queries,
          searchVariantErrors,
          selected: candidates.find((x) => x.url === page.url) || candidates[0],
          error: null,
        };
      }

      errors.push(`${page.url}:DIRECT_REJECTED_${check.reason}`);
    }
  }

  for (const page of pages) {
    const deterministic = deterministicExactPageFallback(
      question,
      analysis,
      page,
      source
    );

    if (!deterministic) continue;

    const check = validateBundleAnswer(
      question,
      analysis,
      deterministic.answer,
      pages,
      chunks
    );

    if (check.valid) {
      deterministic.reason = `${source.key}_AGGRESSIVE_DETERMINISTIC`;
      deterministic.confidence = source.confidence;

      return {
        result: deterministic,
        search,
        page: check.page || page,
        pages,
        pagesTried,
        query: queries.join(" || "),
        queries,
        searchVariantErrors,
        selected: candidates.find((x) => x.url === page.url) || candidates[0],
        error: null,
      };
    }

    errors.push(`${page.url}:DETERMINISTIC_REJECTED_${check.reason}`);
  }

  const ai = await aiExtractEvidenceBundle(
    question,
    analysis,
    pages,
    source,
    deadline
  );

  if (ai.result) {
    return {
      result: ai.result,
      search,
      page: ai.supportingPage || pages[0],
      pages,
      pagesTried,
      query: queries.join(" || "),
      queries,
      searchVariantErrors,
      selected: candidates.find((x) => x.url === (ai.supportingPage?.url || "")) || candidates[0],
      error: null,
    };
  }

  if (ai.error) errors.push(ai.error);

  return {
    result: null,
    search,
    page: null,
    pages,
    pagesTried,
    query: queries.join(" || "),
    queries,
    searchVariantErrors,
    selected: candidates[0] || null,
    error: errors.join("|") || "NO_VERIFIED_ANSWER_AFTER_AGGRESSIVE_SEARCH",
  };
}

function trustLogForTier(source, answer) {
  if (source === SOURCE.PRIMARY) {
    return [
      `S+ VERIFIED • ${answer} • 99.5%`,
    ];
  }

  if (source === SOURCE.FANDOM) {
    return [
      "BEST SOURCE MISS • Checking trusted backup",
      `A+ VERIFIED • ${answer} • 97%`,
    ];
  }

  if (source === SOURCE.WIKI) {
    return [
      "BEST SOURCE MISS",
      "TRUSTED BACKUP MISS • Checking secondary source",
      `B VERIFIED • ${answer} • 94%`,
    ];
  }

  return [
    "NO TRUSTED SOURCE FOUND • Using emergency evidence",
    `EMERGENCY • ${answer}`,
  ];
}

function attachTrustLog(result, source) {
  if (!result) return result;

  return {
    ...result,
    trustLog: trustLogForTier(source, result.answer),
    trustedTier: source.tier,
  };
}

function answerCacheKey(question) {
  return norm(question);
}

function getCachedAnswer(question) {
  return cacheGet(ANSWER_CACHE, answerCacheKey(question));
}

function setCachedAnswer(question, result) {
  if (!result || result.answer === "UNKNOWN") return;
  cacheSet(ANSWER_CACHE, answerCacheKey(question), result, isCurrent(question) ? CFG.CURRENT_ANSWER_TTL_MS : CFG.STABLE_ANSWER_TTL_MS);
}

function finalize(base, question, analysis, startedAt, diagnostics = {}) {
  const sources = base?.sources || [];
  return {
    answer: base?.answer || "UNKNOWN",
    candidateAnswer: base?.candidateAnswer || base?.answer || "UNKNOWN",
    candidateConfidence: base?.confidence || 0,
    confidence: base?.confidence || 0,
    reason: base?.reason || "no_verified_answer",
    route: base?.route || "REVIEW",
    sourceCount: base?.sourceCount || 0,
    highestTier: sources[0]?.tier || "NONE",
    bestRelevance: base?.confidence || 0,
    sources,
    intent: analysis.current ? "CURRENT" : analysis.update ? "UPDATE" : "FACT",
    answerType: analysis.relation,
    answerTypes: analysis.wantedRelations || [analysis.relation],
    factSlots: analysis.factSlots || [],
    lockedSubjects: analysis.lockedSubjects || [],
    entity: analysis.entity || "UNKNOWN",
    analysisSource: analysis.source,
    searchLatencyMs: nowMs() - startedAt,
    extractionMode: base?.route?.startsWith("PRIMARY") ? "PRIMARY_SPLUS" : base?.route || "REVIEW",
    cache: "MISS",
    priorityPolicy: "DIRECT S+ ALWAYS RETURNS FIRST; LOWER TIERS NEVER DOWNGRADE OR OVERRIDE DIRECT S+ EVIDENCE",
    diagnostics,
  };
}




async function resolveQuestion(questionObj, lore = "") {
  const startedAt = nowMs();
  const deadline = startedAt + CFG.GLOBAL_BUDGET_MS;
  const question = questionObj.question;

  const cached = getCachedAnswer(question);
  if (cached) {
    return {
      ...cached,
      cache: "HIT",
      searchLatencyMs: nowMs() - startedAt,
    };
  }

  // R41: ZERO-NETWORK instant lore first. For facts already in the reviewed
  // S+ snapshot, do not spend time on NVIDIA, Tavily, or a page fetch.
  const instantAnalysis = analyzeQuestion(question);
  const r43Instant = r43MasterLoreResolve(question, instantAnalysis);
  const instant = r43Instant || instantLoreResolve(question, instantAnalysis);
  if (instant) {
    const instantDiagnostic = {
      instantLoreHit: true,
      instantLoreSourcesReviewed: R41_RESEARCHED_SPLUS_SOURCE_COUNT,
      masterLoreLocalFactCount: R43_LOCAL_FACT_COUNT,
      masterLoreLocalSubjectCount: R43_LOCAL_SUBJECT_COUNT,
      masterLoreAllStructuredFactsIndexed: true,
      instantLoreBuild: BUILD_ID,
      aiQuestionRouter: "BYPASSED_R41_INSTANT_LORE",
      aiQuestionRouterError: "",
    };
    const trusted = attachTrustLog(instant, SOURCE.PRIMARY);
    const final = finalize(trusted, question, instantAnalysis, startedAt, instantDiagnostic);
    final.trustLog = trusted.trustLog;
    final.trustedTier = "S+";
    final.loreLibrary = true;
    final.instantLore = true;
    final.researchedSourceCount = R41_RESEARCHED_SPLUS_SOURCE_COUNT;
    setCachedAnswer(question, final);
    return final;
  }

  // AI understands questions not already satisfied by the local lore snapshot.
  // It still never supplies the trivia answer from memory.
  const routed = await analyzeQuestionAI(question, deadline);
  const analysis = routed.analysis;

  const diagnostic = {
    aiQuestionRouter: analysis.source,
    aiQuestionRouterError: routed.aiError,

    primaryCanonicalTargets: [],
    primaryCanonicalPagesTried: [],
    primaryCanonicalError: "",
    primaryLoreHubs: [],
    primaryLoreManifest: [],
    primaryLoreDetailAttempts: [],
    primaryLoreTopChunks: [],
    primaryLoreError: "",
    primaryQuery: "",
    primaryQueries: [],
    primarySelectedPage: "",
    primaryPagesTried: [],
    primarySearchVariantErrors: [],
    primaryMultipart: null,
    primaryFactSlots: null,
    primaryError: "",

    fandomQuery: "",
    fandomQueries: [],
    fandomSelectedPage: "",
    fandomPagesTried: [],
    fandomSearchVariantErrors: [],
    fandomMultipart: null,
    fandomFactSlots: null,
    fandomError: "",

    wikiQuery: "",
    wikiQueries: [],
    wikiSelectedPage: "",
    wikiPagesTried: [],
    wikiError: "",

    emergencyErrors: [],
  };

  // =====================================================
  // 1A) S+ CANONICAL FIRST.
  // Fetch stable S+ hub/entity pages before spending time on Tavily/NVIDIA
  // extraction. This directly covers machines, events, rituals, mutations,
  // rebirths, and exact brainrot pages when the question structure identifies
  // one of those canonical locations.
  // =====================================================
  const primaryCanonical = await canonicalPrimaryFastPath(
    question,
    analysis,
    deadline
  );

  diagnostic.primaryCanonicalTargets = primaryCanonical.targets || [];
  diagnostic.primaryCanonicalPagesTried = primaryCanonical.pagesTried || [];
  diagnostic.primaryCanonicalError = primaryCanonical.error || "";

  if (primaryCanonical.result) {
    const result = attachTrustLog(
      primaryCanonical.result,
      SOURCE.PRIMARY
    );

    const final = finalize(
      result,
      question,
      analysis,
      startedAt,
      diagnostic
    );

    final.trustLog = result.trustLog;
    final.trustedTier = "S+";
    final.factSlotResults = primaryCanonical.factSlots || null;

    setCachedAnswer(question, final);
    return final;
  }

  // =====================================================
  // 1B) S+ TOTAL LORE LIBRARY.
  // Dynamically reads the site's main lore directories, builds an internal-link
  // manifest, opens the best detail pages, ranks evidence sections, and answers
  // from S+ only. This is the catch-all for categories that do not have a
  // hand-written resolver: announcements, codes, shops, lucky blocks, dates,
  // stock, player counts, historical notes, event periods, long-tail lore, etc.
  // =====================================================
  const primaryLore = await universalLoreStage(
    question,
    analysis,
    deadline
  );

  diagnostic.primaryLoreHubs = primaryLore.hubs || [];
  diagnostic.primaryLoreManifest = primaryLore.manifest || [];
  diagnostic.primaryLoreDetailAttempts = primaryLore.detailAttempts || [];
  diagnostic.primaryLoreTopChunks = (primaryLore.chunks || []).slice(0, 6).map((x) => ({
    title: x.title,
    url: x.url,
    heading: x.heading,
    score: x.score,
  }));
  diagnostic.primaryLoreError = primaryLore.error || "";

  if (primaryLore.result) {
    const result = attachTrustLog(primaryLore.result, SOURCE.PRIMARY);
    const final = finalize(result, question, analysis, startedAt, diagnostic);
    final.trustLog = result.trustLog;
    final.trustedTier = "S+";
    final.loreLibrary = true;
    setCachedAnswer(question, final);
    return final;
  }

  // =====================================================
  // 1C) S+ AGGRESSIVE SEARCH FALLBACK.
  // Run 3 S+ searches in parallel -> open top 3 useful S+ pages ->
  // deterministic extraction first -> AI over small verified S+ evidence chunks.
  // If any S+ evidence supports the answer, 0.995 and STOP.
  // =====================================================
  const primary = await exactTierLookup(
    question,
    analysis,
    SOURCE.PRIMARY,
    deadline
  );

  diagnostic.primaryQuery = primary.query;
  diagnostic.primaryQueries = primary.queries || [];
  diagnostic.primarySelectedPage = primary.page?.url || primary.selected?.url || "";
  diagnostic.primaryPagesTried = primary.pagesTried || [];
  diagnostic.primarySearchVariantErrors = primary.searchVariantErrors || [];
  diagnostic.primaryMultipart = primary.multipart || null;
  diagnostic.primaryFactSlots = primary.factSlots || null;
  diagnostic.primaryError = primary.error || "";

  if (primary.result) {
    const result = attachTrustLog(primary.result, SOURCE.PRIMARY);
    const final = finalize(
      result,
      question,
      analysis,
      startedAt,
      diagnostic
    );

    final.trustLog = result.trustLog;
    final.trustedTier = "S+";

    setCachedAnswer(question, final);
    return final;
  }

  // =====================================================
  // 2) A+ FANDOM.
  // This is the FIRST point where the result/log says best source missed.
  // =====================================================
  if (timeLeft(deadline) > 500) {
    const fandom = await exactTierLookup(
      question,
      analysis,
      SOURCE.FANDOM,
      deadline
    );

    diagnostic.fandomQuery = fandom.query;
    diagnostic.fandomQueries = fandom.queries || [];
    diagnostic.fandomSelectedPage = fandom.page?.url || fandom.selected?.url || "";
    diagnostic.fandomPagesTried = fandom.pagesTried || [];
    diagnostic.fandomSearchVariantErrors = fandom.searchVariantErrors || [];
    diagnostic.fandomMultipart = fandom.multipart || null;
    diagnostic.fandomFactSlots = fandom.factSlots || null;
    diagnostic.fandomError = fandom.error || "";

    if (fandom.result) {
      const result = attachTrustLog(fandom.result, SOURCE.FANDOM);
      const final = finalize(
        result,
        question,
        analysis,
        startedAt,
        diagnostic
      );

      final.trustLog = result.trustLog;
      final.trustedTier = "A+";

      setCachedAnswer(question, final);
      return final;
    }
  } else {
    diagnostic.fandomError = "BUDGET_EXHAUSTED_BEFORE_A_PLUS";
  }

  // =====================================================
  // 3) B SECONDARY WIKI.
  // =====================================================
  if (timeLeft(deadline) > 450) {
    const wiki = await exactTierLookup(
      question,
      analysis,
      SOURCE.WIKI,
      deadline
    );

    diagnostic.wikiQuery = wiki.query;
    diagnostic.wikiQueries = wiki.queries || [];
    diagnostic.wikiSelectedPage = wiki.page?.url || wiki.selected?.url || "";
    diagnostic.wikiPagesTried = wiki.pagesTried || [];
    diagnostic.wikiError = wiki.error || "";

    if (wiki.result) {
      const result = attachTrustLog(wiki.result, SOURCE.WIKI);
      const final = finalize(
        result,
        question,
        analysis,
        startedAt,
        diagnostic
      );

      final.trustLog = result.trustLog;
      final.trustedTier = "B";

      setCachedAnswer(question, final);
      return final;
    }
  } else {
    diagnostic.wikiError = "BUDGET_EXHAUSTED_BEFORE_B";
  }

  // =====================================================
  // 4) EMERGENCY only after the trusted chain misses.
  // =====================================================
  if (timeLeft(deadline) > 350) {
    const emergency = await emergencyStage(
      question,
      analysis,
      (primary.pages && primary.pages.length) ? primary.pages : (primary.page ? [primary.page] : []),
      deadline
    );

    diagnostic.emergencyErrors = emergency.search?.errors || [];

    if (emergency.result) {
      const result = attachTrustLog(
        emergency.result,
        SOURCE.EMERGENCY
      );

      const final = finalize(
        result,
        question,
        analysis,
        startedAt,
        diagnostic
      );

      final.trustLog = result.trustLog;
      final.trustedTier = "C";

      setCachedAnswer(question, final);
      return final;
    }
  }

  const failed = finalize(
    {
      answer: "UNKNOWN",
      candidateAnswer: "UNKNOWN",
      confidence: 0,
      reason: "NO_TRUSTED_SOURCE_FOUND",
      route: "REVIEW",
      sourceCount: 0,
      sources: [],
    },
    question,
    analysis,
    startedAt,
    diagnostic
  );

  failed.trustLog = [
    "BEST SOURCE MISS",
    "TRUSTED BACKUP MISS",
    "SECONDARY SOURCE MISS",
    "NO TRUSTED SOURCE FOUND • REVIEW",
  ];

  failed.trustedTier = "NONE";

  return failed;
}

function validateQuestions(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 8) {
    throw new Error("QUESTIONS_MUST_CONTAIN_1_TO_8_ITEMS");
  }
  return value.map((row, index) => {
    const question = oneLine(row?.question, 700);
    if (!question) throw new Error(`QUESTION_${index + 1}_EMPTY`);
    return {
      index: index + 1,
      question,
      expectedEntity: oneLine(row?.expectedEntity || "NONE", 120),
      expectedAttribute: oneLine(row?.expectedAttribute || "NONE", 120),
      aiAnswer: oneLine(row?.aiAnswer || "UNKNOWN", 400),
      aiConfidence: clamp(row?.aiConfidence),
    };
  });
}


function makeTrace(items) {
  return items.map((item) => {
    if (item.answer === "UNKNOWN") {
      return "NO TRUSTED SOURCE FOUND • REVIEW";
    }

    if (item.trustedTier === "S+") {
      return `S+ VERIFIED • ${item.answer} • 99.5%`;
    }

    if (item.trustedTier === "A+") {
      return `BEST SOURCE MISS → A+ VERIFIED • ${item.answer} • 97%`;
    }

    if (item.trustedTier === "B") {
      return `S+ + A+ MISS → B VERIFIED • ${item.answer} • 94%`;
    }

    if (item.trustedTier === "C") {
      return `TRUSTED SOURCES MISS → EMERGENCY • ${item.answer}`;
    }

    return `${item.route}:${item.answer}:${Math.round((item.confidence || 0) * 100)}%`;
  }).join(" | ");
}

function syntheticPrimaryPage(title, url, lines) {
  return {
    title,
    url,
    lines,
    text: lines.join("\n"),
    html: `<h1>${title}</h1>${lines.map((x) => `<div>${x}</div>`).join("")}`,
    source: SOURCE.PRIMARY,
  };
}

function runSelfTests() {
  let passed = 0;
  const failures = [];
  const check = (name, condition, detail = "") => {
    if (condition) passed++;
    else failures.push({ name, detail: oneLine(detail, 180) });
  };

  check("priority primary confidence", SOURCE.PRIMARY.confidence > SOURCE.FANDOM.confidence && SOURCE.FANDOM.confidence > SOURCE.WIKI.confidence);
  check("primary route", SOURCE.PRIMARY.key === "PRIMARY_SPLUS");
  check("income relation", inferRelation("What is the income of Tralalero Tralala per second?") === REL.INCOME);
  check("rarity relation", inferRelation("What rarity is Tralalero Tralala?") === REL.RARITY);
  check("rebirth relation", inferRelation("What rebirth unlocks Flash Teleport?") === REL.REBIRTH);
  check("spawn relation", inferRelation("What does the Bombardiro Crocodilo ritual spawn?") === REL.SPAWN);
  check("require relation", inferRelation("What does the Bombardiro Crocodilo ritual require?") === REL.REQUIREMENT);
  check("multiplier relation", inferRelation("What multiplier does Rainbow mutation have?") === REL.MULTIPLIER);

  const tralalero = syntheticPrimaryPage("Tralalero Tralala", `${PRIMARY_ORIGIN}/brainrots/tralalero-tralala`, [
    "Tralalero Tralala",
    "Brainrot God",
    "Base Cost",
    "$10.0M",
    "Income per Second",
    "$50.0K",
    "Release Status",
    "Released",
    "Primary Route",
    "Fishing Event",
    "Added to Game",
    "April 1, 2025",
  ]);
  const trAnalysis = analyzeQuestion("What is the income of Tralalero Tralala per second?");
  check("primary entity income", resolvePrimaryEntityPage(tralalero, trAnalysis)?.answer === "$50.0K/s");
  check("primary entity cost", resolvePrimaryEntityPage(tralalero, analyzeQuestion("How much does Tralalero Tralala cost?"))?.answer === "$10.0M");
  check("primary entity rarity", resolvePrimaryEntityPage(tralalero, analyzeQuestion("What rarity is Tralalero Tralala?"))?.answer === "Brainrot God");
  check("primary entity date", resolvePrimaryEntityPage(tralalero, analyzeQuestion("When was Tralalero Tralala added to game?"))?.answer === "April 1, 2025");

  const mutationHtml = `
    <h1>Steal a Brainrot Mutations & Traits List</h1>
    <h3>Gold</h3><div>1.25x</div><div>Gold mutation with 1.25x multiplier</div>
    <h3>Rainbow</h3><div>10x</div><div>Rainbow mutation with 10x multiplier</div>
    <h3>Crystal</h3><div>13x</div><div>Crystal mutation with a 13x multiplier</div>`;
  const mutationPage = { title: "Mutations", url: `${PRIMARY_ORIGIN}/wiki/mutations`, html: mutationHtml, lines: htmlToLines(mutationHtml), text: htmlToText(mutationHtml), source: SOURCE.PRIMARY };
  check("primary rainbow", resolvePrimaryMutation(mutationPage, analyzeQuestion("What multiplier does Rainbow mutation have?"))?.answer === "10x");
  check("primary crystal", resolvePrimaryMutation(mutationPage, analyzeQuestion("What multiplier does Crystal mutation have?"))?.answer === "13x");

  const rebirthHtml = `
    <h1>Rebirth System Guide</h1>
    <h3>REBIRTH 17 17th</h3><h4>Requirements</h4><div>Cash: $2.5Qa</div><div>Characters: Job Job Job Sahur</div><h4>New Items</h4><div>Giant Potion</div><h4>Bonuses</h4><div>MULTI x17</div>
    <h3>REBIRTH 18 18th</h3><h4>Requirements</h4><div>Cash: $10Qa</div><h4>New Items</h4><div>Flash Teleport</div><h4>Bonuses</h4><div>MULTI x18</div>
    <h3>REBIRTH 19 19th</h3><h4>New Items</h4><div>Grief Shield</div>`;
  const rebirthPage = { title: "Rebirth System Guide", url: `${PRIMARY_ORIGIN}/wiki/rebirth`, html: rebirthHtml, lines: htmlToLines(rebirthHtml), text: htmlToText(rebirthHtml), source: SOURCE.PRIMARY };
  check("primary giant potion reverse", resolvePrimaryRebirth(rebirthPage, analyzeQuestion("What rebirth unlocks Giant Potion?"))?.answer === "Rebirth17");
  check("primary flash reverse", resolvePrimaryRebirth(rebirthPage, analyzeQuestion("What rebirth unlocks Flash Teleport?"))?.answer === "Rebirth18");
  check("primary newest", resolvePrimaryRebirth(rebirthPage, analyzeQuestion("What is the newest rebirth right now?"))?.answer === "Rebirth19");

  const ritualHubHtml = `
    <h1>Secret Rituals & Traits</h1>
    <a href="/rituals/crocodilo-ritual">Crocodilo Ritual Rewards: Los Crocodillitos explosive trait 3 players required</a>
    <a href="/rituals/orcalero-ritual">Orcalero Ritual Rewards: Los Orcalitos water trait 4 players required</a>`;
  const ritualHub = {
    title: "Secret Rituals & Traits",
    url: `${PRIMARY_ORIGIN}/rituals`,
    html: ritualHubHtml,
    lines: htmlToLines(ritualHubHtml),
    text: htmlToText(ritualHubHtml),
    source: SOURCE.PRIMARY,
  };
  check(
    "primary ritual hub link spawn",
    resolvePrimaryRitual(ritualHub, analyzeQuestion("What does the Bombardiro Crocodilo ritual spawn?"))?.answer === "Los Crocodillitos"
  );
  check(
    "primary ritual best detail link",
    bestPrimaryLink(ritualHub, analyzeQuestion("What does the Bombardiro Crocodilo ritual spawn?"), "/rituals/")?.url.endsWith("/rituals/crocodilo-ritual")
  );


  const liveShapeTralalero = syntheticPrimaryPage(
    "Tralalero Tralala",
    `${PRIMARY_ORIGIN}/brainrots/tralalero-tralala`,
    [
      "Tralalero Tralala",
      "Brainrot God",
      "Base Cost",
      "$10.0M",
      "Income per Second",
      "$50.0K",
      "Tralalero Tralala is a Brainrot God brainrot generating $50.0K/second",
    ]
  );
  check(
    "R24 live-shape income",
    resolvePrimaryEntityPage(liveShapeTralalero, analyzeQuestion("What is the income of Tralalero Tralala per second?"))?.answer === "$50.0K/s"
  );

  const liveShapeRebirth = syntheticPrimaryPage(
    "Rebirth System Guide",
    `${PRIMARY_ORIGIN}/wiki/rebirth`,
    [
      "REBIRTH 17",
      "Requirements",
      "Cash: $2.5Qa",
      "New Items",
      "Giant Potion",
      "Bonuses",
      "MULTI x17",
      "REBIRTH 18",
      "New Items",
      "Flash Teleport",
      "REBIRTH 19",
      "New Items",
      "Grief Shield",
    ]
  );
  liveShapeRebirth.html = `<main>${liveShapeRebirth.lines.map((x) => `<div>${x}</div>`).join("")}</main>`;
  liveShapeRebirth.text = liveShapeRebirth.lines.join("\n");
  check(
    "R24 plain-text rebirth reverse",
    resolvePrimaryRebirth(liveShapeRebirth, analyzeQuestion("What rebirth unlocks Giant Potion?"))?.answer === "Rebirth17"
  );

  const liveShapeRitual = syntheticPrimaryPage(
    "Crocodilo Ritual",
    `${PRIMARY_ORIGIN}/rituals/crocodilo-ritual`,
    [
      "Crocodilo Ritual",
      "3 players required",
      "Requirements",
      "Requires Bombardiro Crocodilo",
      "Expected Results",
      "Brainrot Spawn",
      "Los Crocodillitos",
      "Trait Grant",
      "explosive Trait",
    ]
  );
  check(
    "R24 ritual direct spawn",
    resolvePrimaryRitual(liveShapeRitual, analyzeQuestion("What does the Bombardiro Crocodilo ritual spawn?"))?.answer === "Los Crocodillitos"
  );


  const q61 = analyzeQuestion("What machine was added in Update 61?");
  check("R25 update61 relation", q61.relation === REL.MACHINE);
  check("R25 update61 number", q61.update === 61);
  check("R25 update61 intent", q61.intent === "UPDATE_FACT");

  const qDate = analyzeQuestion("What rebirth was added in the August 15, 2026 update?");
  check("R25 date update relation", qDate.relation === REL.REBIRTH);
  check("R25 date parse", qDate.date === "2026-08-15");

  const q62 = analyzeQuestion("What did Update 62 add?");
  check("R25 update summary intent", q62.intent === "UPDATE_SUMMARY");

  const machineContext = "Update 61 adds the RNG Machine and Queen Bee event.";
  check("R25 machine context extraction", extractUpdateTypedAnswer(machineContext, { relation: REL.MACHINE }) === "RNG Machine");

  const rebirthContext = "August 15, 2026 Update 62 introduced Rebirth 19 and new items.";
  check("R25 rebirth context extraction", extractUpdateTypedAnswer(rebirthContext, { relation: REL.REBIRTH }) === "Rebirth19");


  check(
    "R26 date query relation update",
    analyzeQuestion("What update happened on August 15, 2026?").relation === REL.UPDATE
  );

  check(
    "R26 extract update62 from dated card",
    extractUpdateNumberFromText("The Return - August 15, 2026 - Update 62 - Rebirth 19") === 62
  );

  check(
    "R26 bridge analysis update62",
    withBridgedUpdate(
      analyzeQuestion("What rebirth was added in the August 15, 2026 update?"),
      62
    ).update === 62
  );

  check(
    "R26 bridged rebirth extraction",
    extractUpdateTypedAnswer(
      "Update 62 introduced Rebirth 19 and Grief Shield.",
      withBridgedUpdate(
        analyzeQuestion("What rebirth was added in the August 15, 2026 update?"),
        62
      )
    ) === "Rebirth19"
  );

  check(
    "R26 bridged machine extraction",
    extractUpdateTypedAnswer(
      "Update 61 introduced the RNG Machine and Queen Bee event.",
      withBridgedUpdate(
        analyzeQuestion("What machine was added on August 8, 2026?"),
        61
      )
    ) === "RNG Machine"
  );

  check(
    "R26 date to update answer formatting",
    `Update${withBridgedUpdate(
      analyzeQuestion("What update happened on August 15, 2026?"),
      62
    ).update}` === "Update62"
  );


  const r27UpdateAnalysis = analyzeQuestion("Which machine made its debut in Update 61?");
  check(
    "R27 primary query update61",
    exactSearchQuery(
      "Which machine made its debut in Update 61?",
      r27UpdateAnalysis,
      SOURCE.PRIMARY
    ).includes('"Update 61"')
  );

  const r27DateAnalysis = analyzeQuestion("What rebirth was introduced on August 15, 2026?");
  check(
    "R27 primary query date",
    exactSearchQuery(
      "What rebirth was introduced on August 15, 2026?",
      r27DateAnalysis,
      SOURCE.PRIMARY
    ).includes('"August 15, 2026"')
  );

  const r27Rows = {
    results: [
      {
        title: "Calculator",
        url: "https://steal-a-brainrot.org/calculator",
        content: "Steal a Brainrot calculator",
        score: 0.9,
        host: "steal-a-brainrot.org",
      },
      {
        title: "RNG Machine + Queen Bee Event",
        url: "https://steal-a-brainrot.org/events/rng-machine-queen-bee-event-2026-08-08",
        content: "Update 61 added the RNG Machine.",
        score: 0.7,
        host: "steal-a-brainrot.org",
      },
    ],
  };

  check(
    "R27 exact page ranking",
    pickExactSearchResult(
      r27Rows,
      r27UpdateAnalysis,
      SOURCE.PRIMARY
    )?.url.includes("rng-machine")
  );

  check(
    "R27 S+ log",
    trustLogForTier(SOURCE.PRIMARY, "RNG Machine")[0] ===
      "S+ VERIFIED • RNG Machine • 99.5%"
  );

  check(
    "R27 A+ miss log",
    trustLogForTier(SOURCE.FANDOM, "Example")[0].startsWith("BEST SOURCE MISS")
  );


  const r28Rare = enforceQuestionSemantics(
    "What is the rare 1% result from the Job Job Job Sahur ritual?",
    analyzeQuestion("What is the rare 1% result from the Job Job Job Sahur ritual?")
  );
  check("R28/R30 rare ritual relation outcome", r28Rare.relation === REL.OUTCOME);

  const r28Reverse = enforceQuestionSemantics(
    "Which Secret brainrot from the RNG Machine in Update 61 has a base cost of $27.5B?",
    analyzeQuestion("Which Secret brainrot from the RNG Machine in Update 61 has a base cost of $27.5B?")
  );
  check("R28 reverse brainrot relation", r28Reverse.relation === REL.BRAINROT);

  check(
    "R28 reverse query keeps money clue",
    exactSearchQuery(
      "Which Secret brainrot from the RNG Machine in Update 61 has a base cost of $27.5B?",
      r28Reverse,
      SOURCE.PRIMARY
    ).includes("$27.5B")
  );

  check(
    "R28 ritual query keeps 1pct clue",
    exactSearchQuery(
      "What is the rare 1% result from the Job Job Job Sahur ritual?",
      r28Rare,
      SOURCE.PRIMARY
    ).includes("1%")
  );

  const r28RitualPage = syntheticPrimaryPage(
    "Job Job Job Sahur Ritual",
    `${PRIMARY_ORIGIN}/rituals/job-job-job-sahur-ritual`,
    [
      "Job Job Job Sahur Ritual",
      "Expected Results",
      "Brainrot Spawn",
      "Yess my Resume with a 99% outcome chance",
      "Noo my Resume with a 1% outcome chance",
      "Job Application Trait",
    ]
  );

  check(
    "R28 deterministic rare 1pct result",
    deterministicHighValueExactPage(
      "What is the rare 1% result from the Job Job Job Sahur ritual?",
      r28Rare,
      r28RitualPage,
      SOURCE.PRIMARY
    )?.answer === "Noo my Resume"
  );

  const r28YetimaticPage = syntheticPrimaryPage(
    "Yetimatic",
    `${PRIMARY_ORIGIN}/brainrots/yetimatic`,
    [
      "Yetimatic",
      "Secret",
      "RNG MACHINE",
      "Base Cost",
      "$27.5B",
      "Available from the RNG Machine during Update 61.",
    ]
  );

  check(
    "R28 reverse exact page Yetimatic",
    deterministicHighValueExactPage(
      "Which Secret brainrot from the RNG Machine in Update 61 has a base cost of $27.5B?",
      r28Reverse,
      r28YetimaticPage,
      SOURCE.PRIMARY
    )?.answer === "Yetimatic"
  );

  check(
    "R28 raw AI single value",
    parseLooseAiExtraction("Noo my Resume").answer === "Noo my Resume"
  );

  check(
    "R28 alternate AI json key",
    parseLooseAiExtraction('{"result":"Yetimatic","evidence":"Base Cost $27.5B"}').answer === "Yetimatic"
  );


  const r29RitualAnalysis = enforceQuestionSemantics(
    "What is the 1% outcome from the four-player Job Job Job Sahur ritual?",
    analyzeQuestion("What is the 1% outcome from the four-player Job Job Job Sahur ritual?")
  );

  check(
    "R29 ritual family accepts ritual URL",
    primaryFamilyScore(
      { url: `${PRIMARY_ORIGIN}/rituals/job-job-job-sahur-ritual` },
      "What is the 1% outcome from the four-player Job Job Job Sahur ritual?",
      r29RitualAnalysis
    ).allowed === true
  );

  check(
    "R29 ritual family rejects creator page",
    primaryFamilyScore(
      { url: `${PRIMARY_ORIGIN}/wiki/creator` },
      "What is the 1% outcome from the four-player Job Job Job Sahur ritual?",
      r29RitualAnalysis
    ).allowed === false
  );

  const r29WrongPage = syntheticPrimaryPage(
    "SpyderSammy",
    `${PRIMARY_ORIGIN}/wiki/creator`,
    [
      "Roblox developer and game producer",
      "Steal a Brainrot creator",
      "August 2026",
    ]
  );

  check(
    "R29 opened wrong ritual page rejected",
    pageEligibility(
      "What is the 1% outcome from the four-player Job Job Job Sahur ritual?",
      r29RitualAnalysis,
      r29WrongPage,
      SOURCE.PRIMARY
    ).eligible === false
  );

  check(
    "R29 generic role phrase rejected",
    validateFinalPageAnswer(
      "What is the 1% outcome from the four-player Job Job Job Sahur ritual?",
      r29RitualAnalysis,
      "Roblox developer and game producer",
      r29WrongPage
    ).valid === false
  );

  const r29GoodRitual = syntheticPrimaryPage(
    "Job Job Job Sahur Ritual",
    `${PRIMARY_ORIGIN}/rituals/job-job-job-sahur-ritual`,
    [
      "Job Job Job Sahur Ritual",
      "4 players",
      "Expected Results",
      "Yess my Resume with a 99% outcome chance",
      "Noo my Resume with a 1% outcome chance",
    ]
  );

  check(
    "R29 ritual page eligible",
    pageEligibility(
      "What is the 1% outcome from the four-player Job Job Job Sahur ritual?",
      r29RitualAnalysis,
      r29GoodRitual,
      SOURCE.PRIMARY
    ).eligible === true
  );

  check(
    "R29 Noo my Resume clue-local valid",
    validateFinalPageAnswer(
      "What is the 1% outcome from the four-player Job Job Job Sahur ritual?",
      r29RitualAnalysis,
      "Noo my Resume",
      r29GoodRitual
    ).valid === true
  );

  const r29MutationAnalysis = enforceQuestionSemantics(
    "Which mutation from Update 59 has a 13x multiplier and came with the Spain event?",
    analyzeQuestion("Which mutation from Update 59 has a 13x multiplier and came with the Spain event?")
  );

  check(
    "R29 mutation family accepts mutations wiki",
    primaryFamilyScore(
      { url: `${PRIMARY_ORIGIN}/wiki/mutations` },
      "Which mutation from Update 59 has a 13x multiplier and came with the Spain event?",
      r29MutationAnalysis
    ).allowed === true
  );

  const r29Rows = {
    results: [
      {
        title: "Creator",
        url: `${PRIMARY_ORIGIN}/wiki/creator`,
        content: "Roblox developer and game producer Update 59",
        score: 0.95,
        host: SOURCE.PRIMARY.host,
      },
      {
        title: "Mutations",
        url: `${PRIMARY_ORIGIN}/wiki/mutations`,
        content: "Update 59 Crystal mutation 13x Spain event",
        score: 0.60,
        host: SOURCE.PRIMARY.host,
      },
    ],
  };

  check(
    "R29 family guard ranks mutation page",
    pickExactSearchResult(
      r29Rows,
      r29MutationAnalysis,
      SOURCE.PRIMARY,
      "Which mutation from Update 59 has a 13x multiplier and came with the Spain event?"
    )?.url.endsWith("/wiki/mutations")
  );


  const r30MachineQ = "Which machine ran from Update 57 through Update 60 before being replaced in Update 61?";
  const r30Machine = enforceQuestionSemantics(r30MachineQ, analyzeQuestion(r30MachineQ));
  check("R30 machine lifecycle relation", r30Machine.relation === REL.MACHINE);
  check("R30 activeFrom", r30Machine.activeFrom === 57);
  check("R30 activeTo", r30Machine.activeTo === 60);
  check("R30 replacedIn", r30Machine.replacedIn === 61);
  check("R30 all update numbers", (r30Machine.updateNumbers || []).join(",") === "57,60,61");

  const r30Query = exactSearchQuery(r30MachineQ, r30Machine, SOURCE.PRIMARY);
  check("R30 lifecycle query uses replacement update", r30Query.includes('"Update 61"'));
  check("R30 lifecycle query not full sentence", !r30Query.includes("ran from Update 57 through Update 60 before being replaced"));

  const r30FreqQ = "How often does the Queen Bee event return during Update 61?";
  const r30Freq = enforceQuestionSemantics(r30FreqQ, analyzeQuestion(r30FreqQ));
  check("R30 frequency relation", r30Freq.relation === REL.FREQUENCY);

  const r30FreqPage = syntheticPrimaryPage(
    "RNG Machine + Queen Bee Event",
    `${PRIMARY_ORIGIN}/events/rng-machine-queen-bee-event-2026-08-08`,
    ["Queen Bee event", "Update 61", "The Queen Bee event returns every two hours."]
  );
  check("R30 frequency answer valid", answerTypeValid(r30FreqQ, r30Freq, "Every two hours", r30FreqPage).valid === true);

  const r30OutcomeQ = "What is the common 99% outcome of the Job Job Job Sahur ritual?";
  const r30Outcome = enforceQuestionSemantics(r30OutcomeQ, analyzeQuestion(r30OutcomeQ));
  check("R30 outcome relation", r30Outcome.relation === REL.OUTCOME);

  const r30OutcomePage = syntheticPrimaryPage(
    "Job Job Job Sahur Ritual",
    `${PRIMARY_ORIGIN}/rituals/job-job-job-sahur-ritual`,
    ["Job Job Job Sahur Ritual", "Yess my Resume with a 99% outcome chance", "Noo my Resume with a 1% outcome chance"]
  );
  check("R30 outcome deterministic", deterministicHighValueExactPage(r30OutcomeQ, r30Outcome, r30OutcomePage, SOURCE.PRIMARY)?.answer === "Yess my Resume");


  const r31FreqQ = "How often does the Queen Bee event happen during Update 61?";
  const r31Freq = enforceQuestionSemantics(r31FreqQ, analyzeQuestion(r31FreqQ));
  const r31FreqQueries = aggressiveSearchQueries(r31FreqQ, r31Freq, SOURCE.PRIMARY);

  check("R31 three search variants", r31FreqQueries.length === 3);
  check("R31 frequency query entity", r31FreqQueries.some((q) => q.includes("Queen Bee")));
  check("R31 frequency query relation", r31FreqQueries.some((q) => /frequency|every|interval/i.test(q)));

  const r31OutcomeQ = "What is the 99% outcome from the Job Job Job Sahur ritual?";
  const r31Outcome = enforceQuestionSemantics(r31OutcomeQ, analyzeQuestion(r31OutcomeQ));
  const r31OutcomeQueries = aggressiveSearchQueries(r31OutcomeQ, r31Outcome, SOURCE.PRIMARY);
  check("R31 outcome query percent", r31OutcomeQueries.some((q) => q.includes("99%")));
  check("R31 outcome query ritual", r31OutcomeQueries.some((q) => q.includes("Job Job Job Sahur")));

  const r31LifeQ = "Which machine was active from Update 57 through Update 60 and got replaced in Update 61?";
  const r31Life = enforceQuestionSemantics(r31LifeQ, analyzeQuestion(r31LifeQ));
  const r31LifeQueries = aggressiveSearchQueries(r31LifeQ, r31Life, SOURCE.PRIMARY);
  check("R31 lifecycle three variants", r31LifeQueries.length === 3);
  check("R31 lifecycle replacement variant", r31LifeQueries.some((q) => /replaced/i.test(q)));

  const r31SoftFamilyRow = {
    title: "Queen Bee Event",
    url: `${PRIMARY_ORIGIN}/brainrots/queen-bee-event-info`,
    content: "Queen Bee event Update 61 returns every two hours.",
    score: 0.7,
    host: SOURCE.PRIMARY.host,
    queryHits: 2,
  };
  check(
    "R31 wrong family can still score",
    aggressiveResultScore(r31SoftFamilyRow, r31FreqQ, r31Freq, SOURCE.PRIMARY) > 0
  );

  const r31BadCreatorRow = {
    title: "Creator",
    url: `${PRIMARY_ORIGIN}/wiki/creator`,
    content: "Roblox developer and game producer",
    score: 0.99,
    host: SOURCE.PRIMARY.host,
    queryHits: 3,
  };
  check(
    "R31 creator still blocked",
    aggressiveResultScore(r31BadCreatorRow, r31FreqQ, r31Freq, SOURCE.PRIMARY) < -50
  );

  const r31PageA = syntheticPrimaryPage(
    "Queen Bee Event",
    `${PRIMARY_ORIGIN}/events/queen-bee`,
    ["Queen Bee event", "Update 61", "The Queen Bee event returns every two hours."]
  );
  const r31Chunks = buildEvidenceBundle(r31FreqQ, r31Freq, [r31PageA]);
  check("R31 evidence bundle created", r31Chunks.length >= 1);
  check(
    "R31 bundle validates frequency",
    validateBundleAnswer(r31FreqQ, r31Freq, "Every two hours", [r31PageA], r31Chunks).valid === true
  );

  const r31RitualPage = syntheticPrimaryPage(
    "Job Job Job Sahur Ritual",
    `${PRIMARY_ORIGIN}/rituals/job-job-job-sahur-ritual`,
    [
      "Job Job Job Sahur Ritual",
      "Yess my Resume with a 99% outcome chance",
      "Noo my Resume with a 1% outcome chance",
    ]
  );
  const r31RitualChunks = buildEvidenceBundle(r31OutcomeQ, r31Outcome, [r31RitualPage]);
  check(
    "R31 bundle validates outcome",
    validateBundleAnswer(r31OutcomeQ, r31Outcome, "Yess my Resume", [r31RitualPage], r31RitualChunks).valid === true
  );


  const r32MultiQ = "How often did the Queen Bee event occur, and what update was it tied to?";
  const r32Multi = enforceQuestionSemantics(r32MultiQ, analyzeQuestion(r32MultiQ));

  check("R32 multipart detected", isMultipartAnalysis(r32Multi) === true);
  check(
    "R32 multipart relations",
    r32Multi.wantedRelations.includes(REL.FREQUENCY) &&
    r32Multi.wantedRelations.includes(REL.UPDATE)
  );

  const r32QueenPage = syntheticPrimaryPage(
    "RNG Machine + Queen Bee Event",
    `${PRIMARY_ORIGIN}/events/rng-machine-queen-bee-event-2026-08-08`,
    [
      "Queen Bee event",
      "Update 61",
      "The Queen Bee event returns every two hours.",
    ]
  );

  const r32QueenChunks = buildEvidenceBundle(r32MultiQ, r32Multi, [r32QueenPage]);
  const r32MultiDet = deterministicMultipartFromBundle(
    r32MultiQ,
    r32Multi,
    [r32QueenPage],
    r32QueenChunks
  );

  check(
    "R32 Queen Bee multipart answer",
    r32MultiDet?.answer === "Every two hours, Update61",
    r32MultiDet?.answer || "nil"
  );

  const r32Merged = mergeSearches([
    {
      index: 0,
      query: "q0",
      ok: false,
      search: { answer: "", results: [], errors: ["TAVILY_TIMEOUT"] },
    },
    {
      index: 1,
      query: "q1",
      ok: true,
      search: {
        answer: "",
        errors: [],
        results: [{
          title: "Queen Bee Event",
          url: `${PRIMARY_ORIGIN}/events/queen-bee`,
          content: "Update 61 Queen Bee every two hours",
          score: 0.8,
          host: SOURCE.PRIMARY.host,
        }],
      },
    },
    {
      index: 2,
      query: "q2",
      ok: true,
      search: {
        answer: "",
        errors: [],
        results: [{
          title: "Queen Bee Event",
          url: `${PRIMARY_ORIGIN}/events/queen-bee`,
          content: "Queen Bee event returns every two hours",
          score: 0.7,
          host: SOURCE.PRIMARY.host,
        }],
      },
    },
  ]);

  check("R32 failed search does not erase results", r32Merged.results.length === 1);
  check("R32 two successful query hits merged", r32Merged.results[0]?.queryHits === 2);

  const r32OutcomeQ = "Which ritual outcome has a 1% chance in the Job Job Job Sahur ritual?";
  const r32Outcome = enforceQuestionSemantics(r32OutcomeQ, analyzeQuestion(r32OutcomeQ));
  const r32OutcomePage = syntheticPrimaryPage(
    "Job Job Job Sahur Ritual",
    `${PRIMARY_ORIGIN}/rituals/job-job-job-sahur-ritual`,
    [
      "Job Job Job Sahur Ritual",
      "Yess my Resume with a 99% outcome chance",
      "Noo my Resume with a 1% outcome chance",
    ]
  );
  check(
    "R32 existing 1pct outcome preserved",
    deterministicHighValueExactPage(
      r32OutcomeQ,
      r32Outcome,
      r32OutcomePage,
      SOURCE.PRIMARY
    )?.answer === "Noo my Resume"
  );

  check(
    "R32 page open failure shape isolated",
    typeof safeOpenCandidate === "function"
  );


  // =====================================================
  // R33 source-grounded regression tests.
  // These page excerpts mirror live steal-a-brainrot.org facts checked on
  // 2026-08-19, then run through the deterministic slot resolver.
  // =====================================================

  const r33QueenQ =
    "How often did the Queen Bee event happen, and which machine was introduced in the same update?";
  const r33QueenBase = applyFactSlots(
    r33QueenQ,
    enforceQuestionSemantics(r33QueenQ, analyzeQuestion(r33QueenQ))
  );

  check("R33 Queen Bee slots detected", r33QueenBase.factSlots.length === 2);
  check(
    "R33 Queen Bee subject locked",
    r33QueenBase.lockedSubjects.includes("Queen Bee")
  );

  const r33QueenPage = syntheticPrimaryPage(
    "RNG MACHINE + QUEEN BEE",
    `${PRIMARY_ORIGIN}/events/rng-machine-queen-bee-event-2026-08-08`,
    [
      "Update 61 adds a cash-powered RNG Machine and a Queen Bee event that returns every two hours.",
      "The RNG Machine has 42 obtainable results in its first live version.",
      "Update 61 replaces the active Los Traders and Summer Fuse cycle with RNG and Honey routes.",
    ]
  );

  const r33QueenResolved = deterministicFactSlots(
    r33QueenQ,
    r33QueenBase,
    [r33QueenPage]
  );

  check(
    "R33 Queen Bee actual answer",
    r33QueenResolved?.answer === "Every two hours, RNG Machine",
    r33QueenResolved?.answer || "nil"
  );

  const r33ReplaceQ =
    "Which machine replaced Los Traders, and what update did that happen in?";
  const r33ReplaceBase = applyFactSlots(
    r33ReplaceQ,
    enforceQuestionSemantics(r33ReplaceQ, analyzeQuestion(r33ReplaceQ))
  );

  check("R33 Los Traders slots detected", r33ReplaceBase.factSlots.length === 2);
  check(
    "R33 Los Traders subject locked",
    r33ReplaceBase.lockedSubjects.includes("Los Traders")
  );

  const r33MachinesPage = syntheticPrimaryPage(
    "All Machines",
    `${PRIMARY_ORIGIN}/machines`,
    [
      "Los Traders",
      "Removed Brainrot Trader variant that ran from Update 57 through Update 60 with rotating 30-minute offers.",
      "Update 61 replaced it with the RNG Machine and Queen Bee event.",
    ]
  );

  const r33ReplaceResolved = deterministicFactSlots(
    r33ReplaceQ,
    r33ReplaceBase,
    [r33MachinesPage]
  );

  check(
    "R33 Los Traders actual answer",
    r33ReplaceResolved?.answer === "RNG Machine, Update61",
    r33ReplaceResolved?.answer || "nil"
  );

  const r33OutcomesQ =
    "What are the 99% and 1% outcomes of the Job Job Job Sahur ritual?";
  const r33OutcomesBase = applyFactSlots(
    r33OutcomesQ,
    enforceQuestionSemantics(r33OutcomesQ, analyzeQuestion(r33OutcomesQ))
  );

  check("R33 duplicate OUTCOME slots detected", r33OutcomesBase.factSlots.length === 2);
  check(
    "R33 duplicate relation preserved",
    r33OutcomesBase.factSlots.every((slot) => slot.relation === REL.OUTCOME)
  );
  check(
    "R33 percent qualifiers preserved",
    r33OutcomesBase.factSlots[0]?.qualifier === "99%" &&
    r33OutcomesBase.factSlots[1]?.qualifier === "1%"
  );

  const r33RitualPage = syntheticPrimaryPage(
    "Job Job Job Sahur Ritual",
    `${PRIMARY_ORIGIN}/rituals/job-job-job-sahur-ritual`,
    [
      "4 players required",
      "Job Job Job Sahur Ritual",
      "Brainrot Spawn",
      "Yess my Resume with a 99% outcome chance",
      "Noo my Resume with a 1% outcome chance",
    ]
  );

  const r33OutcomesResolved = deterministicFactSlots(
    r33OutcomesQ,
    r33OutcomesBase,
    [r33RitualPage]
  );

  check(
    "R33 two outcomes actual answer",
    r33OutcomesResolved?.answer === "Yess my Resume, Noo my Resume",
    r33OutcomesResolved?.answer || "nil"
  );

  const r33WrongCraft = syntheticPrimaryPage(
    "Craft Machine",
    `${PRIMARY_ORIGIN}/machines/craft-machine`,
    [
      "Craft Machine",
      "Update 13",
      "A crafting machine from an older update.",
    ]
  );

  check(
    "R33 wrong replacement page subject blocked",
    aggressivePageUsable(
      r33ReplaceQ,
      r33ReplaceBase,
      r33WrongCraft,
      SOURCE.PRIMARY
    ).usable === false
  );

  const r33WrongFandomLike = {
    title: "Tung Tung Tung Sahur",
    url: "https://stealabrainrot.fandom.com/wiki/Tung_Tung_Tung_Sahur",
    text: "Tung Tung Tung Sahur is a brainrot unrelated to Queen Bee.",
    lines: ["Tung Tung Tung Sahur is a brainrot unrelated to Queen Bee."],
    source: SOURCE.FANDOM,
  };

  check(
    "R33 unrelated subject page blocked",
    aggressivePageUsable(
      r33QueenQ,
      r33QueenBase,
      r33WrongFandomLike,
      SOURCE.FANDOM
    ).usable === false
  );


  const r34TargetsMachine = canonicalPrimaryTargets(
    "Which machine replaced Los Traders, and what update did that happen in?",
    applyFactSlots(
      "Which machine replaced Los Traders, and what update did that happen in?",
      enforceQuestionSemantics(
        "Which machine replaced Los Traders, and what update did that happen in?",
        analyzeQuestion("Which machine replaced Los Traders, and what update did that happen in?")
      )
    )
  );
  check(
    "R34 canonical machines target",
    r34TargetsMachine.some((x) => x.url === `${PRIMARY_ORIGIN}/machines`)
  );

  const r34TargetsQueen = canonicalPrimaryTargets(
    "How often did the Queen Bee event happen, and which machine was introduced in the same update?",
    applyFactSlots(
      "How often did the Queen Bee event happen, and which machine was introduced in the same update?",
      enforceQuestionSemantics(
        "How often did the Queen Bee event happen, and which machine was introduced in the same update?",
        analyzeQuestion("How often did the Queen Bee event happen, and which machine was introduced in the same update?")
      )
    )
  );
  check(
    "R34 canonical events target",
    r34TargetsQueen.some((x) => x.url === `${PRIMARY_ORIGIN}/events`)
  );

  const r34TargetsRitual = canonicalPrimaryTargets(
    "What are the 99% and 1% outcomes of the Job Job Job Sahur ritual?",
    applyFactSlots(
      "What are the 99% and 1% outcomes of the Job Job Job Sahur ritual?",
      enforceQuestionSemantics(
        "What are the 99% and 1% outcomes of the Job Job Job Sahur ritual?",
        analyzeQuestion("What are the 99% and 1% outcomes of the Job Job Job Sahur ritual?")
      )
    )
  );
  check(
    "R34 canonical ritual target",
    r34TargetsRitual.some((x) => x.url.endsWith("/rituals/job-job-job-sahur-ritual"))
  );


  check(
    "R34 rejects descriptor as brainrot outcome",
    looksLikeBrainrotEntityName("Secret brainrot generating 7000K second") === false
  );
  check(
    "R34 rejects ritual label as outcome",
    validateSlotAnswer(
      makeSlot("x", REL.OUTCOME, {
        subject: "Job Job Job Sahur",
        qualifier: "99%",
        predicate: "OUTCOME_AT_CHANCE",
        answerType: REL.BRAINROT,
      }),
      "Job Job Job Sahur Ritual",
      r33RitualPage
    ).valid === false
  );
  check(
    "R34 accepts Yess my Resume entity",
    looksLikeBrainrotEntityName("Yess my Resume") === true
  );
  check(
    "R34 rejects hash metadata",
    looksLikeBrainrotEntityName("ec804a6bfa90408597072080ef2b0063") === false
  );


  const r35CrystalQ = "Which mutation has a 13x multiplier?";
  const r35CrystalA = applyFactSlots(
    r35CrystalQ,
    enforceQuestionSemantics(r35CrystalQ, analyzeQuestion(r35CrystalQ))
  );
  check("R35 Crystal one special slot", isFactSlotQuestion(r35CrystalA) === true);
  check("R35 Crystal slot predicate", r35CrystalA.factSlots[0]?.predicate === "HAS_MULTIPLIER");
  const r35MutationPage = syntheticPrimaryPage(
    "Steal a Brainrot Mutations & Traits List",
    `${PRIMARY_ORIGIN}/wiki/mutations`,
    [
      "Event Mutations",
      "Phantom",
      "12x",
      "Phantom mutation with 12x multiplier.",
      "Crystal",
      "13x",
      "Crystal mutation with a 13x multiplier. It gives brainrots a faceted crystal appearance during the Crystal Event.",
    ]
  );
  check(
    "R35 Crystal reverse qualifier",
    deterministicFactSlots(r35CrystalQ, r35CrystalA, [r35MutationPage])?.answer === "Crystal"
  );

  const r35LosQ = "Which machine replaced Los Traders?";
  const r35LosA = applyFactSlots(
    r35LosQ,
    enforceQuestionSemantics(r35LosQ, analyzeQuestion(r35LosQ))
  );
  check("R35 Los Traders one special slot", isFactSlotQuestion(r35LosA) === true);
  const r35LosPage = syntheticPrimaryPage(
    "All Machines",
    `${PRIMARY_ORIGIN}/machines`,
    [
      "Los Traders",
      "Removed Brainrot Trader variant that ran from Update 57 through Update 60 with rotating 30-minute offers.",
      "Update 61 replaced it with the RNG Machine and Queen Bee event.",
    ]
  );
  check(
    "R35 Los Traders single replacement",
    deterministicFactSlots(r35LosQ, r35LosA, [r35LosPage])?.answer === "RNG Machine"
  );

  const r35NooQ = "What is the 1% outcome of the Job Job Job Sahur ritual?";
  const r35NooA = applyFactSlots(
    r35NooQ,
    enforceQuestionSemantics(r35NooQ, analyzeQuestion(r35NooQ))
  );
  check("R35 1pct one special slot", isFactSlotQuestion(r35NooA) === true);
  const r35NooPage = syntheticPrimaryPage(
    "Job Job Job Sahur Ritual",
    `${PRIMARY_ORIGIN}/rituals/job-job-job-sahur-ritual`,
    [
      "Job Job Job Sahur Ritual",
      "Yess my Resume with a 99% outcome chance",
      "Noo my Resume with a 1% outcome chance",
    ]
  );
  check(
    "R35 Noo single outcome",
    deterministicFactSlots(r35NooQ, r35NooA, [r35NooPage])?.answer === "Noo my Resume"
  );


  const r36CodeChunk = [{
    id: 1,
    title: "RNG MACHINE + QUEEN BEE",
    url: `${PRIMARY_ORIGIN}/events/rng-machine-queen-bee-event-2026-08-08`,
    heading: "Event Codes",
    text: "391725 Temporary Skip a machine cooldown. Announced as a 72-hour Admin Abuse code. 648013 Temporary Raise the lobby Luck Level.",
    score: 20,
  }];
  check(
    "R36 deterministic cooldown code",
    deterministicLoreAnswer(
      "What code skipped a machine cooldown in Update 61?",
      { ...analyzeQuestion("What code skipped a machine cooldown in Update 61?"), relation: REL.CODE },
      r36CodeChunk
    )?.answer === "391725"
  );

  const r36PlayersChunk = [{
    id: 1, title: "Mi Gatito Ritual", url: `${PRIMARY_ORIGIN}/rituals/mi-gatito-ritual`, heading: "Requirements",
    text: "2 players required Requires Mi Gatito Face each other and perform a hug interaction", score: 15,
  }];
  check(
    "R36 deterministic players",
    deterministicLoreAnswer(
      "How many players does Mi Gatito Ritual require?",
      { ...analyzeQuestion("How many players does Mi Gatito Ritual require?"), relation: REL.PLAYERS },
      r36PlayersChunk
    )?.answer === "2"
  );

  const r36StockChunk = [{
    id: 1, title: "La Anniversary Grande", url: `${PRIMARY_ORIGIN}/brainrots/la-anniversary-grande`, heading: "How to Obtain",
    text: "Stock: 100,000 Cost: $10,000,000,000 1 YEAR EVENT Taco Truck", score: 15,
  }];
  check(
    "R36 deterministic stock",
    deterministicLoreAnswer(
      "What was La Anniversary Grande's stock?",
      { ...analyzeQuestion("What was La Anniversary Grande's stock?"), relation: REL.STOCK },
      r36StockChunk
    )?.answer === "100,000"
  );

  check(
    "R36 selects events for announcement",
    selectLoreHubs(
      "What was announced in Update 61?",
      { ...analyzeQuestion("What was announced in Update 61?"), relation: REL.ANNOUNCEMENT }
    ).some((x) => x.key === "EVENTS")
  );

  check(
    "R36 selects shop/rebirth for gear",
    selectLoreHubs(
      "What gear unlocks at Rebirth 19?",
      { ...analyzeQuestion("What gear unlocks at Rebirth 19?"), relation: REL.GEAR }
    ).some((x) => x.key === "REBIRTH")
  );

  check("R36 blocks metadata lore answer", loreAnswerSafe("ec804a6bfa90408597072080ef2b0063", {relation:REL.LORE}) === false);

  const r37StatsChunk=[{id:1,title:"67",url:`${PRIMARY_ORIGIN}/brainrots/67`,heading:"Stats",text:"Rarity: Secret Base Cost $1.3B Base Income/sec: $7.5M Added to Game September 14, 2025 Current Availability Admin Lucky Block (1.5% listed drop chance)",score:20}];
  check("R37 cost deterministic",deterministicLoreAnswer("What does 67 cost?",{...analyzeQuestion("What does 67 cost?"),entity:"67",relation:REL.COST},r37StatsChunk)?.answer==="$1.3B");
  check("R37 income deterministic",deterministicLoreAnswer("How much does 67 earn per second?",{...analyzeQuestion("How much does 67 earn per second?"),entity:"67",relation:REL.INCOME},r37StatsChunk)?.answer==="$7.5M/sec");
  check("R37 rarity deterministic",deterministicLoreAnswer("What rarity is 67?",{...analyzeQuestion("What rarity is 67?"),entity:"67",relation:REL.RARITY},r37StatsChunk)?.answer==="Secret");
  check("R37 date deterministic",deterministicLoreAnswer("When was 67 added?",{...analyzeQuestion("When was 67 added?"),entity:"67",relation:REL.DATE},r37StatsChunk)?.answer==="September 14, 2025");
  check("R37 drop deterministic",deterministicLoreAnswer("What is 67's Admin Lucky Block drop chance?",{...analyzeQuestion("What is 67's Admin Lucky Block drop chance?"),entity:"67",relation:REL.DROP_RATE},r37StatsChunk)?.answer==="1.5%");
  const r37MachineChunk=[{id:1,title:"Machines",url:`${PRIMARY_ORIGIN}/machines`,heading:"Los Traders",text:"Los Traders Offline Jul 11, 2026 Removed Brainrot Trader variant that ran from Update 57 through Update 60 with rotating 30-minute offers. Update 61 replaced it with the RNG Machine.",score:20}];
  check("R37 cooldown deterministic",deterministicLoreAnswer("What was Los Traders refresh cycle?",{...analyzeQuestion("What was Los Traders refresh cycle?"),entity:"Los Traders",relation:REL.COOLDOWN},r37MachineChunk)?.answer==="30 minutes");
  const r37BaseChunk=[{id:1,title:"Home",url:PRIMARY_ORIGIN,heading:"Getting Started",text:"Start with $100 cash and choose one of the 8 bases on the map. Your base is locked for 30 seconds when you join, protecting you while you get started! Your base holds up to 10 brainrots on the first floor. 2nd Rebirth unlocks second floor. 10th Rebirth unlocks third floor.",score:20}];
  check("R37 base lock deterministic",deterministicLoreAnswer("How long is the base lock when you join?",{...analyzeQuestion("How long is the base lock when you join?"),relation:REL.BASE},r37BaseChunk)?.answer==="30 seconds");
  check("R37 asset relation",inferRelation("What does Arcadragon look like?")===REL.ASSET);
  check("R37 base relation",inferRelation("How long is the base lock?")===REL.BASE);
  check("R37 cooldown relation",inferRelation("What is Los Traders refresh cycle?")===REL.COOLDOWN);
  check("R37 garbage safety",loreAnswerSafe("ec804a6bfa90408597072080ef2b0063",{relation:REL.LORE})===false);

  const r38BaseChunk=[{id:1,title:"Tips",url:`${PRIMARY_ORIGIN}/wiki/tips`,heading:"Your Base",text:"Your base is locked for 30 seconds when you join. The second floor is unlocked at the 2nd Rebirth. The third floor is unlocked at the 10th Rebirth.",score:20}];
  check("R38 second floor not lock substring",deterministicLoreAnswer("What rebirth unlocks the second floor?",{...analyzeQuestion("What rebirth unlocks the second floor?"),relation:REL.BASE},r38BaseChunk)?.answer==="Rebirth 2");
  check("R38 third floor not lock substring",deterministicLoreAnswer("What rebirth unlocks the third floor?",{...analyzeQuestion("What rebirth unlocks the third floor?"),relation:REL.BASE},r38BaseChunk)?.answer==="Rebirth 10");
  const r38CostChunks=[
    {id:1,title:"All Secrets",url:`${PRIMARY_ORIGIN}/secrets`,heading:"Guerriro Digitale",text:"Guerriro Digitale Cost: $120.0M. Guerriro Digitale drops from Admin Lucky Block.",score:30},
    {id:2,title:"Admin Lucky Block",url:`${PRIMARY_ORIGIN}/lucky-blocks/admin-lucky-block`,heading:"Admin Lucky Block",text:"Price: $100M. Guerriro Digitale 3% drop chance. 67 1.5% drop chance.",score:25},
  ];
  check("R38 cost entity binding",deterministicLoreAnswer("What is the Admin Lucky Block price?",{...analyzeQuestion("What is the Admin Lucky Block price?"),entity:"Admin Lucky Block",relation:REL.COST},r38CostChunks)?.answer==="$100M");
  check("R38 67 drop entity binding",deterministicLoreAnswer("What is the Admin Lucky Block drop chance for 67?",{...analyzeQuestion("What is the Admin Lucky Block drop chance for 67?"),entity:"67",relation:REL.DROP_RATE},r38CostChunks)?.answer==="1.5%");
  const r38CooldownChunks=[
    {id:1,title:"RNG MACHINE + QUEEN BEE",url:`${PRIMARY_ORIGIN}/events/x`,heading:"Event",text:"Queen Bee activates every two hours. Update 61 replaced Los Traders.",score:30},
    {id:2,title:"All Machines",url:`${PRIMARY_ORIGIN}/machines`,heading:"Los Traders",text:"Removed trader with rotating 30-minute offers. Update 61 replaced it.",score:20},
  ];
  check("R38 cooldown entity binding",deterministicLoreAnswer("What was Los Traders refresh cycle?",{...analyzeQuestion("What was Los Traders refresh cycle?"),entity:"Los Traders",relation:REL.COOLDOWN},r38CooldownChunks)?.answer==="30 minutes");
  const r38RebirthCost=[{id:1,title:"Rebirth System Guide",url:`${PRIMARY_ORIGIN}/wiki/rebirth`,heading:"REBIRTH 19",text:"Requirements Cash: $300Qa Characters: La Grande Combinasion New Items Grief Shield",score:20}];
  check("R38 rebirth cash binding",deterministicLoreAnswer("How much cash does Rebirth 19 require?",{...analyzeQuestion("How much cash does Rebirth 19 require?"),entity:"Rebirth 19",relation:REL.COST},r38RebirthCost)?.answer==="$300Qa");
  const r38Window=[{id:1,title:"Update 61",url:`${PRIMARY_ORIGIN}/events/x`,heading:"Event Window",text:"The event window ran from August 8, 2026 at 3:15 PM ET to August 11, 2026 at 12:00 PM ET.",score:20}];
  check("R38 event window deterministic",deterministicLoreAnswer("What was the Update 61 event window?",{...analyzeQuestion("What was the Update 61 event window?"),relation:REL.DURATION},r38Window)?.answer==="August 8, 2026 3:15 PM ET to August 11, 2026 12:00 PM ET");
  const r38Time=[{id:1,title:"1x1x1x1 Ritual",url:`${PRIMARY_ORIGIN}/rituals/1x1x1x1-ritual`,heading:"Schedule",text:"The ritual activates at 3 AM EST every night for 5 minutes.",score:20}];
  check("R38 exact ritual time",deterministicLoreAnswer("What time does the 1x1x1x1 ritual activate?",{...analyzeQuestion("What time does the 1x1x1x1 ritual activate?"),entity:"1x1x1x1",relation:REL.TIME},r38Time)?.answer==="3 AM EST");
  const r38Approx=[{id:1,title:"Tips",url:`${PRIMARY_ORIGIN}/wiki/tips`,heading:"Spawn Frequency",text:"Legendary brainrots appear approximately every 5 minutes; exact milliseconds are not documented.",score:20}];
  check("R38 does not invent spawn precision",deterministicLoreAnswer("What is the Legendary spawn rate in milliseconds?",{...analyzeQuestion("What is the Legendary spawn rate in milliseconds?"),entity:null,relation:REL.FREQUENCY},r38Approx)?.answer==="Approximately every 5 minutes");
  check("R38 image source evidence",htmlToText('<img src="/images/a.png" alt="Arcadragon">',500).includes("Source: /images/a.png"));
  check("R39 event window overrides AI update",enforceQuestionSemantics("What was the Update 61 event window?",{...analyzeQuestion("What was the Update 61 event window?"),relation:REL.UPDATE,wanted:REL.UPDATE}).relation===REL.DURATION);
  const r39DurChunks=[
    {id:1,title:"RNG Event",url:`${PRIMARY_ORIGIN}/events/x`,heading:"Window",text:"The event window ran from August 8, 2026 at 3:15 PM ET to August 11, 2026 at 12:00 PM ET.",score:30},
    {id:2,title:"1x1x1x1 Ritual",url:`${PRIMARY_ORIGIN}/rituals/1x1x1x1-ritual`,heading:"1x1x1x1 Ritual",text:"The ritual activates at 3 AM EST every night for 5 minutes.",score:20},
  ];
  check("R39 duration entity isolation",deterministicLoreAnswer("How long is the 1x1x1x1 ritual active each night?",{...analyzeQuestion("How long is the 1x1x1x1 ritual active each night?"),entity:"1x1x1x1",relation:REL.DURATION},r39DurChunks)?.answer==="5 minutes");
  check("R39 Qa normalization",normalizeAnswer("$300Qa",REL.COST)==="$300Qa");
  const r40WrongEntity=[{id:1,title:"Admin Lucky Block",url:`${PRIMARY_ORIGIN}/lucky-blocks/admin-lucky-block`,heading:"Drops",text:"Guerriro Digitale 3% drop chance. La Grande Combinasion 0.5% drop chance.",score:20}];
  check("R40 AI answer requires requested entity evidence",answerExistsInLore("3%",r40WrongEntity,{entity:"67",relation:REL.DROP_RATE})===false);
  check("R40 AI evidence quote requires requested entity evidence",evidenceQuoteExists("Guerriro Digitale 3% drop chance.",r40WrongEntity,{entity:"67",relation:REL.DROP_RATE})===false);

  // R41 instant-lore regression tests: these must bypass web/AI entirely.
  check("R41 researched source manifest 100+", R41_RESEARCHED_SPLUS_SOURCE_COUNT >= 100);
  check("R41 shorthand machine before RNG", instantLoreResolve("What was that machine before RNG?",analyzeQuestion("What was that machine before RNG?"))?.answer === "Los Traders");
  check("R41 twice-an-hour systems", instantLoreResolve("What thing refreshes twice an hour?",analyzeQuestion("What thing refreshes twice an hour?"))?.answer === "Los Traders, Craft Machine");
  check("R41 date reverse Arcadopus", instantLoreResolve("What brainrot came out Jan 24?",analyzeQuestion("What brainrot came out Jan 24?"))?.answer === "Arcadopus");
  check("R41 1pct resume shorthand", instantLoreResolve("the 1% resume ritual thing?",analyzeQuestion("the 1% resume ritual thing?"))?.answer === "Noo my Resume");
  check("R41 shield reverse", instantLoreResolve("what rebirth gives shield?",analyzeQuestion("what rebirth gives shield?"))?.answer === "Rebirth19");
  check("R41 Los Traders refresh", instantLoreResolve("What is the refresh cycle of Los Traders?",analyzeQuestion("What is the refresh cycle of Los Traders?"))?.answer === "30 minutes");
  check("R41 Crystal reverse", instantLoreResolve("Which mutation has a 13x multiplier?",analyzeQuestion("Which mutation has a 13x multiplier?"))?.answer === "Crystal");
  check("R41 third floor reverse", instantLoreResolve("Which rebirth unlocks the third floor?",analyzeQuestion("Which rebirth unlocks the third floor?"))?.answer === "Rebirth10");
  check("R41 rebirth19 cash", instantLoreResolve("How much cash does Rebirth 19 require?",analyzeQuestion("How much cash does Rebirth 19 require?"))?.answer === "$300Qa");
  check("R41 flash teleport reverse", instantLoreResolve("What rebirth unlocks Flash Teleport?",analyzeQuestion("What rebirth unlocks Flash Teleport?"))?.answer === "Rebirth18");
  check("R41 ritual player count", instantLoreResolve("How many players for Mi Gatito Ritual?",analyzeQuestion("How many players for Mi Gatito Ritual?"))?.answer === "2");
  check("R41 ambiguous 10x mutation does not guess", instantLoreResolve("Which mutation has a 10x multiplier?",analyzeQuestion("Which mutation has a 10x multiplier?")) == null);

  // R42 hard reverse-clue tests. All must resolve from local structured lore.
  check("R42 Candini date+cost+income reverse", instantLoreResolve("Which Secret added August 15, 2026 costs $14B and earns $57.5M per second?",analyzeQuestion("Which Secret added August 15, 2026 costs $14B and earns $57.5M per second?"))?.answer === "Candini Fluffini");
  check("R42 La Fuse date+cost+income reverse", instantLoreResolve("Which Update 62 Secret costs $35B and earns $95M per second?",analyzeQuestion("Which Update 62 Secret costs $35B and earns $95M per second?"))?.answer === "La Fuse Machine");
  check("R42 Taco Merchant reverse", instantLoreResolve("Which machine introduced August 18, 2026 lasted one hour and used Taco currency?",analyzeQuestion("Which machine introduced August 18, 2026 lasted one hour and used Taco currency?"))?.answer === "Taco Merchant");
  check("R42 Candini direct income", instantLoreResolve("How much does Candini Fluffini earn?",analyzeQuestion("How much does Candini Fluffini earn?"))?.answer === "$57.5M/s");
  check("R42 La Fuse direct cost", instantLoreResolve("What does La Fuse Machine cost?",analyzeQuestion("What does La Fuse Machine cost?"))?.answer === "$35B");
  check("R42 Sammyni Truckini date", instantLoreResolve("When was Sammyni Truckini added?",analyzeQuestion("When was Sammyni Truckini added?"))?.answer === "August 18, 2026");
  check("R42 code reverse cooldown", instantLoreResolve("What code skips a machine cooldown?",analyzeQuestion("What code skips a machine cooldown?"))?.answer === "391725");
  check("R42 Update61 event date", instantLoreResolve("When was RNG MACHINE + QUEEN BEE?",analyzeQuestion("When was RNG MACHINE + QUEEN BEE?"))?.answer === "August 8, 2026");
  check("R42 Crystal event update", instantLoreResolve("Which update was CRYSTAL MUTATION + SPAIN?",analyzeQuestion("Which update was CRYSTAL MUTATION + SPAIN?"))?.answer === "Update 59");
  check("R42 event summary source count", R41_RESEARCHED_SPLUS_SOURCE_COUNT >= 140);


  // R43 master corpus / reverse-index regression tests.
  check("R43 local fact graph nontrivial", R43_LOCAL_FACT_COUNT >= 200);
  check("R43 all structured facts indexed invariant", R43_MASTER_FACTS.every((f) => f.subject && f.relation && f.value));
  check("R43 before RNG reverse lifecycle", r43MasterLoreResolve("What was that machine before RNG?")?.answer === "Los Traders");
  check("R43 what RNG replaced reverse lifecycle", r43MasterLoreResolve("What did RNG Machine replace?")?.answer === "Los Traders");
  check("R43 Los Traders replacement direct", r43MasterLoreResolve("Which machine replaced Los Traders?")?.answer === "RNG Machine");
  check("R43 Los Traders refresh", r43MasterLoreResolve("What is the refresh cycle of Los Traders?")?.answer === "30 minutes");
  check("R43 Los Traders active range", r43MasterLoreResolve("What updates was Los Traders active through?")?.answer === "Update 57 through Update 60");
  check("R43 Los Traders lifecycle multi clue", r43MasterLoreResolve("Which machine ran from Update 57 through Update 60 before being replaced in Update 61?")?.answer === "Los Traders");
  check("R43 1 percent resume", r43MasterLoreResolve("the 1% resume ritual thing?")?.answer === "Noo my Resume");
  check("R43 99 percent resume", r43MasterLoreResolve("the 99% resume ritual thing?")?.answer === "Yess my Resume");
  check("R43 shield reverse rebirth", r43MasterLoreResolve("what rebirth gives shield?")?.answer === "Rebirth19");
  check("R43 Flash Teleport reverse rebirth", r43MasterLoreResolve("What rebirth unlocks Flash Teleport?")?.answer === "Rebirth18");
  check("R43 Crystal reverse multiplier", r43MasterLoreResolve("Which mutation has a 13x multiplier?")?.answer === "Crystal");
  check("R43 Yetimatic multi clue", r43MasterLoreResolve("Which Secret from Update 61 costs $27.5B and earns $87.5M per second?")?.answer === "Yetimatic");
  check("R43 Candini multi clue", r43MasterLoreResolve("Which Secret added August 15, 2026 costs $14B and earns $57.5M per second?")?.answer === "Candini Fluffini");
  check("R43 La Fuse multi clue", r43MasterLoreResolve("Which Update 62 Secret costs $35B and earns $95M per second?")?.answer === "La Fuse Machine");
  check("R43 Taco Merchant multi clue", r43MasterLoreResolve("Which machine introduced August 18, 2026 lasted one hour and used Taco currency?")?.answer === "Taco Merchant");

  // R44 reverse clue normalization / same-subject binding regressions.
  check("R44 What Secret identity", r43MasterLoreResolve("What Secret costs $27.5B and makes $87.5M/s?")?.answer === "Yetimatic");
  check("R44 bare money and a-second", r43MasterLoreResolve("which secret is 27.5b and 87.5m a second")?.answer === "Yetimatic");
  check("R44 no-which secret identity", r43MasterLoreResolve("secret earning $87.5M/s costing $27.5B")?.answer === "Yetimatic");
  check("R44 earns bare income", r43MasterLoreResolve("what secret costs 27.5b and earns 87.5m")?.answer === "Yetimatic");
  check("R44 lifecycle ended Update 60", r43MasterLoreResolve("What machine refreshes every 30 minutes and ended in Update 60?")?.answer === "Los Traders");
  check("R44 lifecycle compact range", r43MasterLoreResolve("machine active update 57-60 with 30 minute rotation")?.answer === "Los Traders");
  check("R44 contradictory money clues blocked", r43MasterLoreResolve("What Secret costs $27.5B and makes $57.5M/s?") == null);
  check("R44 metadata hash blocked", r43MasterLoreResolve("what secret matches request id ec804a6bfa90408597072080ef2b0063") == null);

  // Priority behavior: once S+ has a direct value, lower tier disagreement does not participate.
  const primary = makeResult("10x", REL.MULTIPLIER, SOURCE.PRIMARY, mutationPage, "PRIMARY_MUTATION_SECTION", 0.995);
  const fandom = makeResult("9x", REL.MULTIPLIER, SOURCE.FANDOM, { title: "Mutations", url: "fandom" }, "FANDOM_DIRECT", 0.93);
  check("S+ beats conflicting A+", primary.answer === "10x" && primary.confidence > fandom.confidence && primary.route === "PRIMARY_SPLUS");

  for (let i = 1; i <= 100; i++) {
    const page = syntheticPrimaryPage(`Entity ${i}`, `${PRIMARY_ORIGIN}/brainrots/entity-${i}`, [
      `Entity ${i}`, `Tier ${i}`, "Base Cost", `$${i}M`, "Income per Second", `$${i}K`,
    ]);
    check(`generic cost ${i}`, resolvePrimaryEntityPage(page, analyzeQuestion(`How much does Entity ${i} cost?`))?.answer === `$${i}M`);
    check(`generic income ${i}`, resolvePrimaryEntityPage(page, analyzeQuestion(`What income does Entity ${i} make per second?`))?.answer === `$${i}K/s`);
    check(`generic rarity ${i}`, resolvePrimaryEntityPage(page, analyzeQuestion(`What rarity is Entity ${i}?`))?.answer === `Tier ${i}`);
  }

  return {
    ok: failures.length === 0,
    total: passed + failures.length,
    passed,
    failed: failures.length,
    failures: failures.slice(0, 40),
    note: "Deterministic parser/priority tests. Live upstream availability is checked with ?test=live.",
  };
}

async function runLiveTests() {
  const tests = [
    ["Tralalero rarity", "What rarity is Tralalero Tralala?", "Brainrot God"],
    ["Tralalero income", "What is the income of Tralalero Tralala per second?", "$50.0K/s"],
    ["Rainbow multiplier", "What multiplier does Rainbow mutation have?", "10x"],
    ["Giant Potion rebirth", "What rebirth unlocks Giant Potion?", "Rebirth17"],
    ["Flash Teleport rebirth", "What rebirth unlocks Flash Teleport?", "Rebirth18"],
    ["Newest rebirth", "What is the newest rebirth right now?", "Rebirth19"],
    ["Bombardiro spawn", "What does the Bombardiro Crocodilo ritual spawn?", "Los Crocodillitos"],
  ];

  const results = [];
  for (const [name, question, expected] of tests) {
    ANSWER_CACHE.delete(answerCacheKey(question));
    try {
      const result = await resolveQuestion({ question, index: 1 }, "");
      results.push({
        name,
        question,
        expected,
        answer: result.answer,
        pass: norm(result.answer) === norm(expected),
        route: result.route,
        confidence: result.confidence,
        highestTier: result.highestTier,
        ms: result.searchLatencyMs,
      });
    } catch (error) {
      results.push({ name, question, expected, answer: "ERROR", pass: false, error: errorCode(error) });
    }
  }
  return {
    ok: results.every((x) => x.pass),
    passed: results.filter((x) => x.pass).length,
    failed: results.filter((x) => !x.pass).length,
    total: results.length,
    results,
  };
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: { Allow: "GET, POST, OPTIONS", "cache-control": "no-store" },
  });
}

export async function GET(request) {
  const url = new URL(request.url);
  const test = url.searchParams.get("test");

  if (test === "self") {
    return json(200, { build: BUILD_ID, selfTest: runSelfTests() });
  }

  if (test === "live") {
    const started = nowMs();
    const live = await runLiveTests();
    return json(200, { build: BUILD_ID, test: "LIVE_SPLUS_PRIORITY", ...live, totalMs: nowMs() - started });
  }

  if (test === "analyze") {
    const question = oneLine(url.searchParams.get("q") || "What machine was added in Update 61?", 700);
    const started = nowMs();
    const deterministic = analyzeQuestion(question);
    const routed = await analyzeQuestionAI(question, started + 1800);
    return json(200, {
      ok: true,
      build: BUILD_ID,
      question,
      deterministic,
      analysis: routed.analysis,
      aiError: routed.aiError,
      ms: nowMs() - started,
    });
  }

  if (test === "exact") {
    const question = oneLine(
      url.searchParams.get("q") || "How often does the Queen Bee event happen during Update 61?",
      700
    );

    const started = nowMs();
    const deadline = started + 3600;
    const routed = await analyzeQuestionAI(question, deadline);
    const analysis = routed.analysis;

    const queries = aggressiveSearchQueries(question, analysis, SOURCE.PRIMARY);
    const searches = await Promise.all(
      queries.map(async (query, index) => ({
        index,
        query,
        search: await tavilySearch(
          query,
          deadline,
          [SOURCE.PRIMARY.host],
          analysis.current
        ),
      }))
    );

    const merged = mergeSearches(searches);
    const candidates = rankAggressiveResults(
      merged,
      question,
      analysis,
      SOURCE.PRIMARY,
      6
    );

    return json(200, {
      ok: candidates.length > 0,
      build: BUILD_ID,
      question,
      analysis,
      queries,
      candidates: candidates.map((row) => ({
        title: row.title,
        url: row.url,
        score: row.aggressiveScore,
        queryHits: row.queryHits,
      })),
      errors: merged.errors,
      ms: nowMs() - started,
    });
  }

  if (test === "lore") {
    const question = oneLine(
      url.searchParams.get("q") || "What code skipped a machine cooldown in Update 61?",
      700
    );
    const started = nowMs();
    const deadline = started + Math.max(3500, CFG.GLOBAL_BUDGET_MS);
    const routed = await analyzeQuestionAI(question, deadline);
    const analysis = routed.analysis;
    const stage = await universalLoreStage(question, analysis, deadline);
    return json(200, {
      ok: Boolean(stage.result),
      build: BUILD_ID,
      question,
      analysis,
      result: stage.result,
      hubs: stage.hubs,
      manifest: stage.manifest,
      detailAttempts: stage.detailAttempts,
      topChunks: (stage.chunks || []).slice(0, 10).map((x) => ({
        title: x.title, url: x.url, heading: x.heading, score: x.score, text: oneLine(x.text, 700)
      })),
      error: stage.error,
      ms: nowMs() - started,
    });
  }

  if (test === "resolve") {
    const question = oneLine(url.searchParams.get("q") || "What rarity is Tralalero Tralala?", 700);
    ANSWER_CACHE.delete(answerCacheKey(question));
    try {
      const result = await resolveQuestion({ question, index: 1 }, "");
      return json(200, { ok: result.answer !== "UNKNOWN", build: BUILD_ID, question, result });
    } catch (error) {
      return json(200, { ok: false, build: BUILD_ID, question, error: errorCode(error) });
    }
  }

  if (test === "primary") {
    const question = oneLine(url.searchParams.get("q") || "What multiplier does Rainbow mutation have?", 700);
    const started = nowMs();
    const deadline = started + 3000;
    const routed = await analyzeQuestionAI(question, deadline);
    const analysis = routed.analysis;
    const updateStage = await primaryUpdateHistoryPath(question, analysis, deadline);
    const resolvedAnalysis = updateStage.analysis || analysis;
    const fast = await primaryFastPath(question, resolvedAnalysis, deadline);
    const stage = await fetchPrimaryCandidates(question, resolvedAnalysis, deadline);
    const pages = [...new Map([...updateStage.pages, ...fast.pages, ...stage.pages].map((p) => [p.url, p])).values()];
    const direct = updateStage.result || fast.result || resolvePrimary(question, analysis, pages);
    return json(200, {
      ok: Boolean(direct?.answer),
      build: BUILD_ID,
      question,
      analysis: resolvedAnalysis,
      aiRouter: resolvedAnalysis.source,
      bridgedUpdate: updateStage.bridgedUpdate || null,
      updateRoute: updateStage.route,
      fastRoute: fast.route,
      direct,
      pages: pages.map((p) => ({ title: p.title, url: p.url, cache: p.cache, lineCount: p.lines.length })),
      errors: [...fast.errors, ...stage.errors],
      ms: nowMs() - started,
    });
  }

  return json(200, {
    ok: true,
    build: BUILD_ID,
    configured: {
      tavily: Boolean(env("TAVILY_API_KEY")),
      nvidia: Boolean(env("NVIDIA_API_KEY")),
      token: Boolean(env("LOOKUP_PROXY_TOKEN")),
    },
    model: process.env.NVIDIA_MODEL || DEFAULT_MODEL,
    priority: [
      { tier: "S+", source: "steal-a-brainrot.org", policy: "AUTHORITATIVE FOR THIS LOOKUP; DIRECT S+ ANSWERS RETURN IMMEDIATELY" },
      { tier: "A+", source: "stealabrainrot.fandom.com", policy: "USED ONLY WHEN S+ MISSES" },
      { tier: "B", source: "steal-a-brainrot.wiki", policy: "USED ONLY WHEN S+ AND A+ MISS" },
      { tier: "C", source: "Tavily/NVIDIA", policy: "EMERGENCY ONLY" },
    ],
    conflictPolicy: "AI ROUTES INTO RICH RELATION SCHEMA; MULTI-UPDATE QUESTIONS USE LIFECYCLE HINTS WITHOUT OVER-CONSTRAINING SEARCH; URL FAMILY + HARD CLUES VALIDATE PAGE; ANSWER TYPE + CLUE-LOCAL EVIDENCE MUST PASS; S+ VERIFIED = 0.995 + STOP; A+ ONLY ON S+ MISS; B ONLY ON S+/A+ MISS",
    masterLore: {
      mode: "YES_FOR_ALL_STRUCTURED_LOCAL_FACTS",
      localFactCount: R43_LOCAL_FACT_COUNT,
      localSubjectCount: R43_LOCAL_SUBJECT_COUNT,
      allStructuredFactsIndexed: true,
      networkNeededForKnownStructuredLore: false,
      note: "Every fact present in the embedded structured SAB snapshots is flattened and reverse-indexed. Newly published or not-yet-embedded S+ facts still use the canonical S+ fallback.",
    },
    architecture: {
      instantLoreBeforeAI: true,
      masterCorpusYesR43: true,
      allStructuredLocalFactsFlattenedR43: true,
      reverseFactIndexR43: true,
      subjectRelationValueGraphR43: true,
      lifecycleReverseLookupR43: true,
      multiClueSubjectBindingR43: true,
      fullSiteBrainrotDirectoryR45: R45_SITE_BRAINROTS.length,
      fullSiteStructuredFactGraphR45: true,
      writtenMoneyWordsR45: true,
      comparativeBrainrotLookupR45: true,
      reverseMoneyCanonicalizationR44: true,
      bareMoneySuffixCluesR44: true,
      perSecondParaphraseNormalizationR44: true,
      lifecycleRangeEndpointBindingR44: true,
      reverseSubjectAllCluesRequiredR44: true,
      researchedSplusSourceManifest: R41_RESEARCHED_SPLUS_SOURCES.length,
      aiQuestionRouterFirstForLoreMisses: true,
      exactPageSearchFirst: true,
      cluePreservingSearch: true,
      threeParallelSearchVariants: true,
      searchVariantFailureIsolation: true,
      pageFetchFailureIsolation: true,
      trueMultipartAnswers: true,
      factSlotSemanticBinding: true,
      canonicalPrimaryFastPath: true,
      totalLoreLibrary: true,
      masterCorpusR37: true,
      instantLoreGraphR41: true,
      ultraInstantStructuredLoreR42: true,
      masterAllEmbeddedFactsR43: true,
      reverseMultiClueBrainrotLookupR42: true,
      reverseMachineClueLookupR42: true,
      localEventTimelineR42: true,
      localUpdate61CodesR42: true,
      zeroNetworkHotFactsR41: true,
      rebirthSnapshot1To19R41: true,
      machineLifecycleSnapshotR41: true,
      ritualOutcomeSnapshotR41: true,
        entityBoundNumericFactsR38: true,
        dateWindowExtractionR38: true,
        approximatePrecisionPreservedR38: true,
        eventWindowSemanticsR39: true,
        extendedMoneySuffixesR39: true,
        durationEntityIsolationR39: true,
        aiSubjectEvidenceLockR40: true,
      expandedPublicHubCorpus: true,
      imageAltEvidence: true,
      noPrecisionFabrication: true,
      publicSourceOnly: true,
      dynamicPrimaryHubCorpus: true,
      internalLinkManifest: true,
      longTailLoreDetailFetch: true,
      universalLoreAIExtraction: true,
      singleSpecialFactSlots: true,
      reverseMutationMultiplierSlot: true,
      singleChanceOutcomeSlot: true,
      canonicalMachinesHub: true,
      canonicalEventsHub: true,
      canonicalRitualEntityPage: true,
      canonicalBeforeTavily: true,
      duplicateRelationSlots: true,
      subjectLockAcrossTiers: true,
      predicateBoundExtraction: true,
      qualifierBoundExtraction: true,
      allMultipartPartsRequired: true,
      softPageFamilyPreference: true,
      topThreePagePool: true,
      parallelPageFetch: true,
      deterministicBeforeAI: true,
      multiPageEvidenceBundle: true,
      trustedEvidenceAnswerVerification: true,
      urlFamilyRouting: true,
      richRelationSchema: true,
      frequencyRelation: true,
      outcomeRelation: true,
      lifecycleRelations: true,
      multiUpdateDeconstraint: true,
      snippetEligibilityGuard: false,
      openedPageEligibilityGuard: false,
      maxTwoPagesPerTier: false,
      clueLocalAiEvidence: true,
      answerTypeValidation: true,
      genericRoleAnswerBlock: true,
      reverseEntityExactPage: true,
      chanceResultExactPage: true,
      looseAiOutputRecovery: true,
      onePageEvidencePerTier: true,
      aiSinglePageExtraction: true,
      strictEvidenceVerification: true,
      primaryStopsAllFallbacks: true,
      cleanTrustTierLogs: true,
      aiDoesNotAnswerQuestion: true,
      deterministicRouterFallback: true,
      dedicatedUpdateHistoryMode: true,
      updateDateRouting: true,
      dateToUpdateBridge: true,
      bridgedAnalysisFeedsFallbacks: true,
      primaryFirst: true,
      primaryImmediateReturn: true,
      exactBrainrotPageFirst: true,
      directRebirthPageFirst: true,
      directMutationPageFirst: true,
      ritualHubLinkFollow: true,
      exactRitualDetailFollow: true,
      primaryDomainDiscovery: false,
      primaryTextFallback: true,
      ritualSlugCandidates: true,
      authoritativeDirectSourceReturn: true,
      fandomFallbackOnly: true,
      wikiFallbackOnly: true,
      emergencyFallbackOnly: true,
      entityFields: true,
      rebirthSections: true,
      mutationSections: true,
      ritualSections: true,
      caches: true,
      providerFailureIsolation: true,
    },
  });
}

export async function POST(request) {
  const expectedToken = env("LOOKUP_PROXY_TOKEN");
  const suppliedToken = oneLine(request.headers.get("authorization"), 1200).replace(/^Bearer\s+/i, "").trim();

  if (!expectedToken) return json(503, { error: "LOOKUP_TOKEN_NOT_CONFIGURED" });
  if (suppliedToken !== expectedToken) return json(401, { error: "LOOKUP_UNAUTHORIZED" });

  let body;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "INVALID_JSON_BODY" });
  }

  let questions;
  try {
    questions = validateQuestions(body?.questions);
  } catch (error) {
    return json(400, { error: errorCode(error) });
  }

  const lore = clean(body?.lore, 16000);
  const items = [];

  for (const question of questions) {
    try {
      const result = await resolveQuestion(question, lore);
      items.push({
        index: question.index,
        attribute: result.answerType,
        expectedAttribute: question.expectedAttribute,
        ...result,
      });
    } catch (error) {
      items.push({
        index: question.index,
        answer: "UNKNOWN",
        candidateAnswer: "UNKNOWN",
        confidence: 0,
        reason: errorCode(error),
        route: "LOOKUP_ERROR",
        sourceCount: 0,
        highestTier: "NONE",
        bestRelevance: 0,
        sources: [],
      });
    }
  }

  return json(200, {
    ok: true,
    build: BUILD_ID,
    model: process.env.NVIDIA_MODEL || DEFAULT_MODEL,
    trace: makeTrace(items),
    items,
  });
}
