export type TripCategory = "Sahyadri" | "Himalayas" | "Nepal";

export type TripData = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  summary: string;
  cta: string;
  price: string;
  duration: string;
  seats: string;
  difficulty: string;
  startPoint: string;
  groupSize: string;
  description: string;
  overview?: string;
  category: TripCategory;
  image: string;
  gallery?: string[];
  itinerary: string[];
  includes: string[];
  notIncludes: string[];
  pickupPoints?: string[];
  thingsToCarry?: string[];
  medicalDisclaimer?: string[];
  rules?: string[];
  featured?: boolean;
};

export const tripCategories: TripCategory[] = ["Sahyadri", "Himalayas", "Nepal"];

export const defaultTrips: TripData[] = [
  {
    id: "devkund-waterfall-rappelling",
    slug: "devkund-waterfall-rappelling",
    title: "Devkund Waterfall Rappelling",
    subtitle: "A hidden Western Ghats adventure with cliff rappels and a waterfall pool.",
    summary:
      "A thrilling one-day trek and rappelling experience in Tamhini Ghat featuring a waterfall descent and scenic valley views.",
    cta: "Book this adventure",
    price: "From ₹1,999 / person",
    duration: "1 Day",
    seats: "Available on request",
    difficulty: "Moderate",
    startPoint: "Pune",
    groupSize: "10–20 travelers",
    description:
      "Devkund is a scenic place situated in Tamhini Ghat. Hidden in the folds of the Western Ghats, the mountains of the Plus Valley are shaped in the plus symbol when viewed from above.",
    overview:
      "Devkund is a scenic place situated in Tamhini Ghat. Hidden in the folds of the Western Ghats, the mountains of the Plus Valley are shaped in the plus symbol when viewed from above. Lush, green forests, especially in the monsoon season, turn the valley into a tropical paradise with dense greenery and gushing waterfalls. The main highlight of this trip is rappelling down two mountain cliffs that are as tall as 175 feet and 300 feet. The second stretch of rappelling takes you down the famous Devkund Waterfall to land beside the turquoise pool at the base of the waterfall.",
    category: "Sahyadri",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
    itinerary: [
      "We will start from Pune Bhapkar Petrol pump Swarget in the morning.",
      "We will reach Dongarvadi on 6:30am.",
      "Trek leader will give a briefing.",
      "Rappelling equipment will be distributed.",
      "Before starting rappelling, we have one hour trek toward the rappelling point.",
      "We will be back Pune by 9 pm.",
    ],
    includes: [
      "Transport by Private Vehicle from Pune to Pune",
      "Safety Equipment",
      "Experts",
      "First Aid kit",
      "Late Lunch at Bhira village at Shelar Mama home",
      "Insurance",
    ],
    notIncludes: ["Anything not included in Inclusions"],
    pickupPoints: [
      "3:55 AM - Bhapakar Petrol Pump, Opp- City Pride, Satara Road",
      "4:05 AM - Dandekar bridge",
      "4:15 AM - Samudra Hotel Nalstop",
      "4:25 AM - Karve Statue",
      "4:35 AM - The Alpinist Office, Jijai Nagari",
      "4:45 AM - Lohia Jain IT Park Chandani Chowk",
      "4:55 AM - Chandani Chowk Towards Paud Road",
    ],
    thingsToCarry: [
      "Mask and Hand sanitiser Compulsory",
      "1 liter of water (Must)",
      "Breakfast and some dry snacks as lunch will be late",
      "Torch",
      "Full sleeve T-shirts and full pant. For girls full neck t-shirt. Half T-Shirts not allowed.",
      "Scarf for ladies (compulsory)",
      "Good trekking shoes (CTR)",
      "Towel, napkin, extra pair of clothes (Must)",
      "Carry 3-4 extra carry-bags",
      "Cap (Must)",
      "Pack things properly in plastic bag",
      "Camera (Optional)",
      "Electrolyte packets as energy drinks (optional)",
      "Carry eatable like fruits, dry fruits to munch on during trek and to avoid dehydration",
      "A haversack to put in all the things",
    ],
    medicalDisclaimer: [
      "It is most essential to be fit and fine before heading for trekking.",
      "While planning your trekking trip, it is preferable to have a medical fitness check up done.",
      "If suffering from any kind of allergy or ailment, do carry proper prescribed medicines to prevent serious health problem including heat stroke, severe headache, cough, dehydration and hypothermia.",
      "Participants suffering from chronic conditions like asthma, bronchitis, blood pressure, migraine, diabetes etc should seek their physician's advice before coming.",
    ],
    rules: [
      "No smoking and drinking",
      "No plastic littering",
      "Wear full sleeves, full track suite to avoid mosquito's",
      "No jeans/skin-tight clothes",
      "Proper footwear/shoes are essential for trek",
      "Conserve and preserve our heritage",
      "No deo / perfume. After trek it's OK.",
      "We reserve all rights to change/deviate/cancel the plans without any prior notice.",
      "No extra adventure/out of itinerary behavior during trek.",
      "Trek leader's decision will be final and binding.",
      "Each member will be responsible for his/her own safety, jewellery, cash and baggage.",
    ],
  },
  {
    id: "harishchandragad",
    slug: "harishchandragad",
    title: "Harishchandragad Trek",
    subtitle: "Fort walls, ridges, and a starry Sahyadri night.",
    summary:
      "A classic Sahyadri trek blending rock-cut architecture, forest trails, and a memorable overnight camp.",
    cta: "Book this trek",
    price: "From ₹4,899 / person",
    duration: "2 Days",
    seats: "8 seats remaining",
    difficulty: "Moderate",
    startPoint: "Mumbai",
    groupSize: "8–12 travelers",
    description:
      "Climb through lush forest trails and navigate a dramatic ridge to an iconic fort, then settle in for a sunset and a night of mountain solitude.",
    category: "Sahyadri",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",
    itinerary: [
      "Pickup and trail briefing",
      "Forest climb to the fort base",
      "Sunset summit and evening camp",
      "Sunrise exploration and descent",
    ],
    includes: ["Transport", "Meals", "Guide support", "Camping gear"],
    notIncludes: ["Personal expenses", "Extra snacks", "Travel insurance"],
  },
  {
    id: "kusur-plateau",
    slug: "kusur-plateau",
    title: "Kusur Plateau Trek",
    subtitle: "Sunrise views. Wide meadows. A quick escape.",
    summary:
      "An easy-to-moderate mountain getaway with scenic viewpoints, smooth trails, and an unforgettable sunrise finish.",
    cta: "Reserve your slot",
    price: "From ₹2,499 / person",
    duration: "1 Day",
    seats: "12 seats remaining",
    difficulty: "Easy",
    startPoint: "Pune",
    groupSize: "6–10 travelers",
    description:
      "Perfect for a crisp morning adventure, this trek brings you through meadow trails and elevated viewpoints designed for relaxed exploration.",
    category: "Sahyadri",
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80",
    itinerary: [
      "Early pickup and trail start",
      "Scenic climb through green cover",
      "Sunrise viewpoint stop",
      "Return and local breakfast",
    ],
    includes: ["Transport", "Breakfast", "Guide", "Safety support"],
    notIncludes: ["Personal purchases", "Travel to pickup point", "Insurance"],
  },
  {
    id: "leh-ladakh",
    slug: "leh-ladakh",
    title: "Leh Ladakh Expedition",
    subtitle: "High passes. Vast skies. Unforgettable roads.",
    summary:
      "An immersive Himalayan road trip designed for travelers who want a memorable mix of culture, altitude, and cinematic landscapes.",
    cta: "Book this trip",
    price: "From ₹18,999 / person",
    duration: "9 Days",
    seats: "3 slots remaining",
    difficulty: "Moderate to High",
    startPoint: "Leh",
    groupSize: "8–12 travelers",
    description:
      "Cross high-altitude passes, ancient monasteries, and moonlike desert landscapes on a thrilling Himalayan journey built for unforgettable memories.",
    category: "Himalayas",
    image:
      "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1600&q=80",
    itinerary: [
      "Arrival in Leh and acclimatization day",
      "Monastery circuit and scenic local drive",
      "High pass adventure with dramatic mountain views",
      "Camp nights under remote Himalayan skies",
      "Return journey and final wrap-up",
    ],
    includes: ["Stay and meals", "Local guide", "Transport for itinerary", "Support on route"],
    notIncludes: ["Flights", "Personal gear", "Medical expenses"],
  },
  {
    id: "spiti-valley",
    slug: "spiti-valley",
    title: "Spiti Valley Adventure",
    subtitle: "Remote villages. Glacial views. Alpine solitude.",
    summary:
      "A journey into the high desert of Himachal with remote villages, dramatic roads, and timeless mountain culture.",
    cta: "Reserve your seat",
    price: "From ₹16,499 / person",
    duration: "8 Days",
    seats: "5 slots remaining",
    difficulty: "Moderate",
    startPoint: "Shimla",
    groupSize: "6–10 travelers",
    description:
      "Traverse the high-altitude villages of Spiti and experience raw Himalayan beauty, warm local culture, and dramatic terrain.",
    category: "Himalayas",
    image:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80",
    itinerary: [
      "Arrival and acclimatization in the valley",
      "Village exploration and local interaction",
      "Scenic mountain routes and passes",
      "High-altitude camping and photography stops",
      "Return with a final evening gathering",
    ],
    includes: ["Stay and meals", "Guide support", "Transport", "Permits"],
    notIncludes: ["Flights", "Personal expenses", "Extra activities"],
  },
  {
    id: "kashmir",
    slug: "kashmir",
    title: "Kashmir Valley Escape",
    subtitle: "Lakes, meadows, and Himalayan calm.",
    summary:
      "Escape into a scenic valley experience shaped by alpine meadows, tranquil lakes, and warm local culture.",
    cta: "Plan this escape",
    price: "From ₹11,499 / person",
    duration: "5 Days",
    seats: "New batch open",
    difficulty: "Easy to Moderate",
    startPoint: "Srinagar",
    groupSize: "6–8 travelers",
    description:
      "Slow down and take in soft meadows, lake reflections, and valley roads that feel cinematic from start to finish.",
    category: "Himalayas",
    image:
      "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1600&q=80",
    itinerary: [
      "Arrival and local orientation",
      "Lake and meadow day exploration",
      "Scenic valley drive and café stops",
      "Sunset and farewell evening",
    ],
    includes: ["Stay", "Meals", "Transport", "Guide"],
    notIncludes: ["Flights", "Shopping", "Personal purchases"],
  },
  {
    id: "nepal",
    slug: "nepal",
    title: "Nepal Himalayan Journey",
    subtitle: "Everest horizon. Mountain villages. Big adventure.",
    summary:
      "A classic trek across Himalayan terrain with welcoming mountain culture and unforgettable views.",
    cta: "Book the Himalayan route",
    price: "From ₹21,999 / person",
    duration: "7 Days",
    seats: "Only 5 slots left",
    difficulty: "Moderate to High",
    startPoint: "Kathmandu",
    groupSize: "8–10 travelers",
    description:
      "Take in dramatic valleys, alpine villages, and sweeping Himalayan scenery on a route purpose-built for memorable mountain travel.",
    category: "Nepal",
    image:
      "https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&w=1600&q=80",
    itinerary: [
      "Arrival and Kathmandu orientation",
      "Mountain route and village stopovers",
      "High-altitude views and scenic trekking days",
      "Return journey and farewell dinner",
    ],
    includes: ["Stay", "Meals", "Guide support", "Transport"],
    notIncludes: ["Flights", "Personal gear", "Insurance"],
  },
];

export const defaultTrip: TripData = defaultTrips[0];

export const STORAGE_KEY = "bucketlist-trips-v1";

export function getDefaultTrips(): TripData[] {
  return defaultTrips;
}
