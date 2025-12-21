// TikTok Gifts Data for US Region
// Updated: December 2025
// Source: https://streamtoearn.io/gifts?region=US
// Complete list with exact gift names

const TIKTOK_GIFTS = {
  1: ["Rose", "You're awesome", "GG", "Love you so much", "TikTok", "Ice Cream Cone", "Cake Slice", "Heart Me", "Pumpkin", "Miss You", "Thumbs Up", "Heart", "Lightning Bolt", "Love you", "It's corn", "Chili", "Heart Puff", "LIVE", "GOAT", "Music Album", "Wink Charm", "Go Popular", "Club Cheers"],
  2: ["Team Bracelet"],
  5: ["Finger Heart", "Pumpkin Pie"],
  9: ["Super Popular", "Cheer You Up", "Club Power"],
  10: ["Rosa", "Boo", "Friendship Necklace", "Journey Pass", "Pumpkin Latte", "Tiny Diny", "Gold Boxing Gloves", "Hi Bear", "EWC", "Dolphin", "Heart Gaze"],
  15: ["Tiny Diny in Love", "Group 7"],
  20: ["Perfume", "Tiny Diny Hotdog", "S Flowers", "Let 'Em Cook"],
  30: ["Doughnut", "Sweaty Teddy"],
  88: ["October", "November"],
  99: ["Paper Crane", "Little Crown", "Cap", "Hat and Mustache", "Like-Pop", "Heart Me Flex", "Love Painting", "Bubble Gum", "Mark of Love", "Sundae Bowl", "Welcome Seal", "Club Victory", "Level-up Sparks", "Greeting Heart"],
  100: ["Game Controller", "Super GG", "Confetti", "Hand Hearts", "Hand Heart", "Heart Signal", "Singing Magic", "Marvelous Confetti"],
  149: ["Heart Rain", "Bowknot", "Big Shout Out", "Chatting Popcorn", "Masquerade", "Balloon Crown", "Feather Tiara", "Caterpillar Chaos", "Catrina"],
  199: ["Love Charger", "Pinch Cheek", "Sunglasses", "Hearts", "Hanging Lights", "Garland Headpiece", "Love You", "Cheer For You", "Panther Paws", "Stinging Bee", "Massage for You", "Coffee Magic", "Meerkat", "Potato in Paris", "Cheering Crab", "Night Star", "Wooly Hat", "Blow Bubbles", "Floating Octopus", "Flower Headband", "Bowtiful Crown", "Sour Buddy", "Melon Juice", "Coconut Juice", "Chirpy Kisses", "Rose Hand"],
  200: ["Gold Medal", "I Love TikTok LIVE"],
  214: ["Rose Bear"],
  249: ["Pinch Face", "Candy Bouquet", "Star Goggles", "Cheer Mic", "Music Bubbles", "Palm Breeze", "Forest Elf", "Face-pulling", "Ready to Cheer"],
  299: ["Boxing Gloves", "Corgi", "Trick or Treat", "Fruit Friends", "Turkey Face", "Naughty Chicken", "Play for You", "Rock Star", "Butterfly for You", "Gamer 2025", "Puppy Kisses", "Rising Key", "Legend Crown", "United Heart", "LIVE Ranking Crown", "Kicker Challenge", "Journal", "Hi! Rosie!", "Go Hamster", "Bat Headwear", "Budding Heart"],
  300: ["Feather Mask", "Air Dancer"],
  349: ["Backing Monkey", "Become Kitten", "Marked with Love", "Vinyl Flip", "Juicy Cap", "Batwing Hat", "Mystic Drink", "Sonic Countdown"],
  399: ["Forever Rosa", "Magic Rhythm", "Relaxed Goose", "Tom's Hug", "Rosie the Rose Bean", "Jollie the Joy Bean", "Rocky the Rock Bean", "Sage the Smart Bean", "Sage's Slash", "Let butterfly dances", "Kitten Kneading", "Shoot the Apple", "Alien Buddy", "Pharaoh Mask", "Rosie's Concert"],
  400: ["Crystal Dreams", "Wishing Cake", "Mic Champ", "Bounce Speakers", "Taraxacum Corgi"],
  449: ["Beating Heart", "Encore Clap", "Pirate's Treasure", "Candy Loot"],
  450: ["Fairy Mask", "Powerful Mind", "Hat of Joy", "Halloween Fun Hat"],
  499: ["Panda Hug", "Coral", "Sakura Corgi", "Hands Up"],
  500: ["Money Gun", "Autumn Leaves", "You're Amazing", "VR Goggles", "Manifesting", "DJ Glasses", "Dragon Crown", "Star Map Polaris", "Bouquet", "Racing Helmet", "Prince", "Bunny Crown", "Magic Prop", "Cheeky Boo", "Star Warmup", "Gem Gun"],
  600: ["Join Butterflies"],
  699: ["Swan"],
  700: ["Colorful Wings"],
  799: ["Trash Panda"],
  899: ["LOVE U", "Train"],
  900: ["Superstar"],
  999: ["Travel with You", "Lucky Airdrop Box", "Grand show", "Trending Figure"],
  1000: ["Gold Mine", "Watermelon Love", "Dinosaur", "Glowing Jellyfish", "Blooming Ribbons", "Galaxy", "Fairy Wings", "Flamingo Groove", "Cooper Baseball", "Super LIVE Star", "Sparkle Dance", "Shiny air balloon"],
  1031: ["Pumpkin Carriage"],
  1088: ["Fireworks", "Magic Role"],
  1099: ["Diamond"],
  1200: ["Travel in the US", "Umbrella of Love", "Starlight Sceptre"],
  1400: ["Vibrant Stage"],
  1500: ["Level Ship", "Chasing the Dream", "Lover's Lock", "Greeting Card", "Future Encounter", "EWC Trophy", "Under Control", "Racing Debut", "Galaxy Globe", "Viking Hammer", "Twirl & Treat", "Merry Go Boo"],
  1599: ["Blooming Heart"],
  1799: ["Here We Go"],
  1800: ["Love Drop", "Fox Legend"],
  1999: ["Cable Car", "Star of Red Carpet", "Gift Box", "Cooper Flies Home", "Mystery Firework"],
  2000: ["Baby Dragon", "Crystal Crown", "Cooper Picnic"],
  2150: ["Whale Diving"],
  2199: ["Blow Rosie Kisses", "Jollie's Heartland", "Rocky's Punch", "Sage's Coinbot"],
  2500: ["Animal Band"],
  2988: ["Motorcycle"],
  2999: ["Rhythmic Bear", "Level-up Spotlight"],
  3000: ["Meteor Shower"],
  3999: ["Gift Box"],
  4088: ["Magic World"],
  4500: ["Your Concert"],
  4888: ["Private Jet", "Leon the Kitten", "Fiery Dragon", "Signature Jet"],
  4999: ["Sage's Venture"],
  5000: ["Unicorn Fantasy", "Flying Jets", "Diamond Gun", "Scarecrow"],
  5500: ["Wolf"],
  5999: ["Devoted Heart"],
  6000: ["Future City", "Sam in New City", "Work Hard Play Harder", "Strong Finish", "Boo Crew", "Peek-a-Boo"],
  6599: ["Lili the Leopard"],
  6999: ["Happy Party"],
  7000: ["Illumination", "Sports Car"],
  7999: ["Star Throne"],
  9699: ["Leon and Lili"],
  10000: ["Interstellar", "Sunset Speedway"],
  12000: ["Red Lightning", "Convertible"],
  12999: ["Level-up Spectacle"],
  14999: ["Scythe of Justice", "Storm Blade", "Crystal Heart"],
  15000: ["Bran Castle", "Leopard", "Rosa Nebula", "Pyramids", "Future Journey", "Party On&On", "Turkey Trot", "Boo Town", "Spookville"],
  17000: ["Amusement Park"],
  19999: ["Fly Love"],
  20000: ["TikTok Shuttle", "Castle Fantasy", "Premium Shuttle"],
  21000: ["Level Ship"],
  23999: ["Infinite Heart"],
  25999: ["Gate of Trial", "Phoenix", "Adam's Dream", "Greatsword Temple"],
  26999: ["Dragon Flame"],
  29999: ["Lion"],
  34000: ["Leon and Lion", "Zeus"],
  34999: ["TikTok Universe+"],
  39999: ["TikTok Stars", "Thunder Falcon"],
  41999: ["Fire Phoenix"],
  42999: ["King of Legends", "Valerian's Oath", "Pegasus"],
  44999: ["TikTok Universe"]
};

// Get all unique coin values sorted
const COIN_VALUES = Object.keys(TIKTOK_GIFTS).map(Number).sort((a, b) => a - b);

// Check if a range has any gifts
function rangeHasGifts(min, max) {
  for (const [coins, giftNames] of Object.entries(TIKTOK_GIFTS)) {
    const coinValue = parseInt(coins);
    if (coinValue >= min && coinValue <= max && giftNames.length > 0) {
      return true;
    }
  }
  return false;
}

// Define coin value ranges (only including ranges with gifts)
function getCoinRanges() {
  const potentialRanges = [];

  // Define initial range structure
  potentialRanges.push({ min: 1, max: 5 });
  potentialRanges.push({ min: 6, max: 10 });
  potentialRanges.push({ min: 11, max: 30 });
  potentialRanges.push({ min: 31, max: 100 });
  potentialRanges.push({ min: 101, max: 200 });
  potentialRanges.push({ min: 201, max: 300 });

  // 301-1000 (every 100)
  for (let i = 301; i <= 1000; i += 100) {
    const max = Math.min(i + 99, 1000);
    potentialRanges.push({ min: i, max: max });
  }

  // 1001+ (by thousands)
  for (let i = 1001; i <= 45000; i += 1000) {
    const max = Math.min(i + 999, 50000);
    potentialRanges.push({ min: i, max: max });
  }

  // Filter and merge ranges
  const ranges = [];
  let currentRange = null;

  for (let i = 0; i < potentialRanges.length; i++) {
    const range = potentialRanges[i];

    if (rangeHasGifts(range.min, range.max)) {
      if (currentRange) {
        // Add the accumulated range
        ranges.push({
          min: currentRange.min,
          max: currentRange.max,
          label: `${currentRange.min}-${currentRange.max} 💰`
        });
        currentRange = null;
      }
      // Add this range
      ranges.push({
        min: range.min,
        max: range.max,
        label: `${range.min}-${range.max} 💰`
      });
    } else {
      // Empty range - accumulate it
      if (!currentRange) {
        currentRange = { min: range.min, max: range.max };
      } else {
        // Extend the current accumulated range
        currentRange.max = range.max;
      }

      // Check if next range has gifts
      if (i + 1 < potentialRanges.length) {
        const nextRange = potentialRanges[i + 1];
        if (rangeHasGifts(nextRange.min, nextRange.max)) {
          // Merge with next range
          currentRange.max = nextRange.max;
          ranges.push({
            min: currentRange.min,
            max: currentRange.max,
            label: `${currentRange.min}-${currentRange.max} 💰`
          });
          currentRange = null;
          i++; // Skip the next range since we merged it
        }
      }
    }
  }

  // Add any remaining accumulated range
  if (currentRange) {
    ranges.push({
      min: currentRange.min,
      max: currentRange.max,
      label: `${currentRange.min}-${currentRange.max} 💰`
    });
  }

  return ranges;
}

const COIN_RANGES = getCoinRanges();

// Get gifts for a specific coin value
function getGiftsForCoinValue(coins) {
  return TIKTOK_GIFTS[coins] || [];
}

// Get all gifts within a coin range
function getGiftsForCoinRange(minCoins, maxCoins) {
  const gifts = [];
  for (const [coins, giftNames] of Object.entries(TIKTOK_GIFTS)) {
    const coinValue = parseInt(coins);
    if (coinValue >= minCoins && coinValue <= maxCoins) {
      giftNames.forEach(name => {
        gifts.push({ name, coins: coinValue });
      });
    }
  }
  // Sort by coin value, then alphabetically
  return gifts.sort((a, b) => a.coins - b.coins || a.name.localeCompare(b.name));
}

// Get all gifts as a flat array with their coin values
function getAllGiftsWithCoins() {
  const gifts = [];
  for (const [coins, giftNames] of Object.entries(TIKTOK_GIFTS)) {
    giftNames.forEach(name => {
      gifts.push({ name, coins: parseInt(coins) });
    });
  }
  return gifts.sort((a, b) => a.coins - b.coins || a.name.localeCompare(b.name));
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TIKTOK_GIFTS, COIN_VALUES, COIN_RANGES, getGiftsForCoinValue, getGiftsForCoinRange, getAllGiftsWithCoins };
}
