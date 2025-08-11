const { PrismaClient } = require('@prisma/client');

async function seedCommunityPosts() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🌱 Seeding community posts...');
    
    // Get some users first
    const users = await prisma.user.findMany();
    
    if (users.length === 0) {
      console.log('❌ No users found. Please run the main seed script first.');
      return;
    }
    
    const communityPosts = [
      {
        title: "Amazing Trip to Tokyo - Must Visit Places!",
        content: "Just returned from an incredible 10-day trip to Tokyo! The city is a perfect blend of traditional and modern culture. Some must-visit places include Senso-ji Temple, Shibuya Crossing, and the Tokyo Skytree. The food scene is absolutely incredible - don't miss trying authentic ramen and sushi. Pro tip: Get a JR Pass for easy transportation around the city!",
        type: "TRIP_REVIEW",
        destination: "Tokyo, Japan",
        rating: 5,
        tags: "culture,food,temples,citylife",
        likes: 24,
        views: 156,
        userId: users[0].id
      },
      {
        title: "Budget Travel Tips for Southeast Asia",
        content: "Traveled through Thailand, Vietnam, and Cambodia on a budget of $30/day. Here are my top tips: 1) Stay in hostels or guesthouses 2) Eat street food (it's delicious and cheap!) 3) Use local transportation 4) Book activities through local operators 5) Travel during shoulder season. You can have an amazing experience without breaking the bank!",
        type: "TRAVEL_TIP",
        destination: "Southeast Asia",
        rating: 4,
        tags: "budget,backpacking,streetfood,hostels",
        likes: 18,
        views: 89,
        userId: users[Math.min(1, users.length - 1)].id
      },
      {
        title: "Sunset at Santorini - Photo Paradise",
        content: "Captured the most breathtaking sunset at Oia, Santorini! The blue and white architecture against the golden sky is simply magical. Best spots for sunset viewing: Oia Castle, Amoudi Bay, and Fira. Arrive early to get a good spot as it gets very crowded. Worth every moment!",
        type: "PHOTO_SHARE",
        destination: "Santorini, Greece",
        rating: 5,
        tags: "sunset,photography,island,romantic",
        likes: 31,
        views: 203,
        userId: users[Math.min(2, users.length - 1)].id
      },
      {
        title: "Hiking the Inca Trail - Complete Guide",
        content: "Completed the 4-day Inca Trail hike to Machu Picchu - what an adventure! Essential tips: Book permits 6 months in advance, pack light but warm clothes, bring altitude sickness medication, and don't forget your camera. The sunrise at Machu Picchu on the final day is absolutely worth all the effort. Such a spiritual and rewarding experience!",
        type: "DESTINATION_GUIDE",
        destination: "Machu Picchu, Peru",
        rating: 5,
        tags: "hiking,adventure,history,unesco",
        likes: 42,
        views: 287,
        userId: users[Math.min(3, users.length - 1)].id
      },
      {
        title: "Best Street Food in Bangkok",
        content: "Bangkok's street food scene is unmatched! My top recommendations: Pad Thai from street vendors (around 40-60 THB), Mango Sticky Rice for dessert, Som Tam (papaya salad), and Thai iced tea. Best areas: Chatuchak Weekend Market, Khao San Road, and Chinatown. Always choose stalls with long queues - locals know best!",
        type: "ACTIVITY_REVIEW",
        destination: "Bangkok, Thailand",
        rating: 5,
        tags: "food,streetfood,local,authentic",
        likes: 27,
        views: 145,
        userId: users[0].id
      },
      {
        title: "Solo Female Travel Safety Tips",
        content: "As a solo female traveler, safety is always my top priority. Here are essential tips that have kept me safe: Research destinations thoroughly, share your itinerary with someone, trust your instincts, dress appropriately for local culture, keep emergency contacts handy, and always have backup plans. Don't let fear stop you from exploring the world - just be smart about it!",
        type: "TRAVEL_TIP",
        destination: "General",
        rating: 4,
        tags: "safety,solo,female,tips",
        likes: 56,
        views: 412,
        userId: users[Math.min(1, users.length - 1)].id
      },
      {
        title: "Northern Lights in Iceland - When and Where?",
        content: "Finally saw the Northern Lights in Iceland! Best time: September to March, darkest hours (9 PM - 2 AM). Top locations: Thingvellir National Park, Jokulsarlon Glacier Lagoon, and the Snaefellsnes Peninsula. Check aurora forecasts and weather conditions. Be patient - some nights you might not see them, but when you do, it's absolutely magical!",
        type: "DESTINATION_GUIDE",
        destination: "Iceland",
        rating: 5,
        tags: "northernlights,iceland,nature,winter",
        likes: 38,
        views: 234,
        userId: users[Math.min(2, users.length - 1)].id
      },
      {
        title: "Question: Best time to visit Nepal for trekking?",
        content: "Planning my first trek in Nepal and wondering about the best time to visit. I'm interested in the Everest Base Camp trek. Should I go in spring or autumn? What about weather conditions and crowd levels? Any recommendations for preparation and gear? Thanks in advance for your advice!",
        type: "QUESTION",
        destination: "Nepal",
        rating: null,
        tags: "trekking,nepal,everest,advice",
        likes: 12,
        views: 67,
        userId: users[Math.min(3, users.length - 1)].id
      }
    ];
    
    for (const post of communityPosts) {
      await prisma.communityPost.create({
        data: {
          ...post,
          rating: post.rating || undefined
        }
      });
    }
    
    console.log(`✅ Successfully seeded ${communityPosts.length} community posts`);
    
  } catch (error) {
    console.error('❌ Error seeding community posts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedCommunityPosts();
