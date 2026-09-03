export type PaymentMode = "FULL" | "ADVANCE";

export type BatchStatus =
  | "DRAFT"
  | "OPEN"
  | "FULL"
  | "CLOSED"
  | "CANCELLED"
  | "COMPLETED";

export type BatchVisibility = "PUBLIC" | "PRIVATE" | "HIDDEN";

export interface TripBatch {
  id: string;

  departureDate: string;
  returnDate: string;

  price: number;

  totalSeats: number;
  bookedSeats: number;

  paymentMode: PaymentMode;
  advanceAmount: number;

  balanceDueDate?: string;

  status: BatchStatus;
  visibility: BatchVisibility;

  bookingEnabled: boolean;
}

export type TripCategory = "Sahyadri" | "Himalayas" | "Nepal";

export type TravelCategory =
  | "Treks & Adventures"
  | "Domestic Tours"
  | "International Tours";

export type ItineraryFormat = "TIMED" | "DAY_WISE";

export type TimedItineraryItem = {
  time: string;
  activity: string;
};

export type DayWiseItineraryItem = {
  day: string;
  title: string;
  description: string;
  location?: string;
  image?: string;
  highlights?: string[];
};

export type ItineraryItem =
  | string
  | TimedItineraryItem
  | DayWiseItineraryItem;

export type TripData = {
  // Basic information
  id: string;
  slug: string;
  title: string;

  // Classification
  tripType?: "Fixed Departure" | "Custom Trip" | "Corporate";
  travelCategory?: TravelCategory;
  destination?: string;

  // Marketing/content
  highlight?: string;
  subtitle: string;
  summary: string;
  cta: string;

  // Trip details
  difficulty: string;
  startPoint: string;

  // NEW SYSTEM
  durationDays?: number;
  batches?: TripBatch[];

  // ------------------------------------------------
  // LEGACY FIELDS
  // Keep these temporarily so the existing website
  // continues to work while we migrate it.
  // ------------------------------------------------

  price?: string;
  duration?: string;
  seats?: string;

  upcoming?: boolean;
  featured?: boolean;

  departureDate?: string;
  departureLabel?: string;

  // Additional existing information
  groupSize?: string;
  description?: string;
  overview?: string;

  category: TripCategory;

  image: string;

  itinerary: ItineraryItem[];

  includes: string[];
  notIncludes: string[];

  pickupPoints?: string[];
  thingsToCarry?: string[];

  medicalDisclaimer?: string[];
  rules?: string[];

  gallery?: string[];
};

export const tripCategories: TripCategory[] = [
  "Sahyadri",
  "Himalayas",
  "Nepal",
];

export const travelCategories: TravelCategory[] = [
  "Treks & Adventures",
  "Domestic Tours",
  "International Tours",
];

export const defaultTrips: TripData[] = [
  {
    id: "devkund-waterfall-rappelling",
    slug: "devkund-waterfall-rappelling",
    title: "Devkund Waterfall Rappelling",

    tripType: "Fixed Departure",

    travelCategory: "Treks & Adventures",
    destination: "Sahyadri",

    highlight:
      "A hidden Western Ghats adventure with cliff rappels and a waterfall pool.",

    subtitle:
      "A hidden Western Ghats adventure with cliff rappels and a waterfall pool.",

    summary:
      "A thrilling one-day trek and rappelling experience in Tamhini Ghat featuring a waterfall descent and scenic valley views.",

    cta: "Book this adventure",

    difficulty: "Moderate",
    startPoint: "Pune",
    durationDays: 1,

    groupSize: "10–20 travelers",

    description:
      "Devkund is a scenic place situated in Tamhini Ghat. Hidden in the folds of the Western Ghats, the mountains of the Plus Valley are shaped in the plus symbol when viewed from above.",

    overview:
      "Devkund is a scenic place situated in Tamhini Ghat. Hidden in the folds of the Western Ghats, the mountains of the Plus Valley are shaped in the plus symbol when viewed from above. Lush, green forests, especially in the monsoon season, turn the valley into a tropical paradise with dense greenery and gushing waterfalls. The main highlight of this trip is rappelling down two mountain cliffs that are as tall as 175 feet and 300 feet. The second stretch of rappelling takes you down the famous Devkund Waterfall to land beside the turquoise pool at the base of the waterfall.",

    category: "Sahyadri",

    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80",

    itinerary: [
      {
        time: "05:30 AM",
        activity: "Reporting at Pune",
      },
      {
        time: "06:00 AM",
        activity: "Departure from Pune",
      },
      {
        time: "08:30 AM",
        activity: "Breakfast en route",
      },
      {
        time: "10:00 AM",
        activity: "Start the trek towards Bheem Sheela Waterfall",
      },
      {
        time: "12:30 PM",
        activity:
          "Reach Bheem Sheela Waterfall and enjoy the surroundings",
      },
      {
        time: "02:30 PM",
        activity: "Start the return trek",
      },
      {
        time: "05:30 PM",
        activity: "Reach the base village",
      },
      {
        time: "06:00 PM",
        activity: "Departure towards Pune",
      },
      {
        time: "09:30 PM",
        activity: "Arrival in Pune",
      },
    ],

    includes: [
      "Transport by Private Vehicle from Pune to Pune",
      "Safety Equipment",
      "Experts",
      "First Aid kit",
      "Late Lunch at Bhira village at Shelar Mama home",
      "Insurance",
    ],

    notIncludes: [
      "Anything not included in Inclusions",
    ],

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

    batches: [
      {
        id: "devkund-waterfall-rappelling-2026-08-29",
        departureDate: "2026-08-29",
        returnDate: "2026-08-29",
        price: 1999,
        totalSeats: 20,
        bookedSeats: 0,
        paymentMode: "FULL",
        advanceAmount: 1999,
        status: "OPEN",
        visibility: "PUBLIC",
        bookingEnabled: true,
      },
    ],
  },

  {
    id: "harishchandragad",
    slug: "harishchandragad",
    title: "Harishchandragad Trek",

    tripType: "Fixed Departure",

    travelCategory: "Treks & Adventures",
    destination: "Sahyadri",

    highlight:
      "Konkan Kada, ancient caves and dramatic Sahyadri landscapes",

    subtitle:
      "Fort walls, ridges, and a starry Sahyadri night.",

    summary:
      "A classic Sahyadri trek blending rock-cut architecture, forest trails, and a memorable overnight camp.",

    cta: "Book this trek",

    difficulty: "Moderate",
    startPoint: "Mumbai",
    durationDays: 2,

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

    includes: [
      "Transport",
      "Meals",
      "Guide support",
      "Camping gear",
    ],

    notIncludes: [
      "Personal expenses",
      "Extra snacks",
      "Travel insurance",
    ],

    batches: [
      {
        id: "harishchandragad-2026-08-29",
        departureDate: "2026-08-29",
        returnDate: "2026-08-30",
        price: 1500,
        totalSeats: 20,
        bookedSeats: 0,
        paymentMode: "FULL",
        advanceAmount: 1500,
        status: "OPEN",
        visibility: "PUBLIC",
        bookingEnabled: true,
      },
    ],
  },

  {
    id: "kusur-plateau",
    slug: "kusur-plateau",
    title: "Kusur Plateau Trek",

    tripType: "Fixed Departure",

    travelCategory: "Treks & Adventures",
    destination: "Sahyadri",

    highlight:
      "Sunrise views across the Sahyadri valleys",

    subtitle:
      "Sunrise views. Wide meadows. A quick escape.",

    summary:
      "An easy-to-moderate mountain getaway with scenic viewpoints, smooth trails, and an unforgettable sunrise finish.",

    cta: "Reserve your slot",

    difficulty: "Easy",
    startPoint: "Pune",
    durationDays: 1,

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

    includes: [
      "Transport",
      "Breakfast",
      "Guide",
      "Safety support",
    ],

    notIncludes: [
      "Personal purchases",
      "Travel to pickup point",
      "Insurance",
    ],

    batches: [
      {
        id: "kusur-plateau-2026-08-23",
        departureDate: "2026-08-23",
        returnDate: "2026-08-23",
        price: 1500,
        totalSeats: 20,
        bookedSeats: 0,
        paymentMode: "FULL",
        advanceAmount: 1500,
        status: "OPEN",
        visibility: "PUBLIC",
        bookingEnabled: true,
      },
    ],
  },

  {
    id: "leh-ladakh",
    slug: "leh-ladakh",
    title: "Leh Ladakh Expedition",

    travelCategory: "Domestic Tours",
    destination: "Ladakh",

    subtitle:
      "High passes. Vast skies. Unforgettable roads.",

    summary:
      "An immersive Himalayan road trip designed for travelers who want a memorable mix of culture, altitude, and cinematic landscapes.",

    cta: "Book this trip",

    difficulty: "Moderate to High",
    startPoint: "Leh",
    durationDays: 9,

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

    includes: [
      "Stay and meals",
      "Local guide",
      "Transport for itinerary",
      "Support on route",
    ],

    notIncludes: [
      "Flights",
      "Personal gear",
      "Medical expenses",
    ],

    batches: [
      {
        id: "leh-ladakh-2026-09-20",
        departureDate: "2026-09-20",
        returnDate: "2026-09-28",
        price: 18999,
        totalSeats: 12,
        bookedSeats: 0,
        paymentMode: "ADVANCE",
        advanceAmount: 10000,
        status: "OPEN",
        visibility: "PUBLIC",
        bookingEnabled: true,
      },
    ],
  },

  {
    id: "spiti-valley",
    slug: "spiti-valley",
    title: "Spiti Valley Adventure",

    travelCategory: "Domestic Tours",
    destination: "Spiti Valley",

    subtitle:
      "Remote villages. Glacial views. Alpine solitude.",

    summary:
      "A journey into the high desert of Himachal with remote villages, dramatic roads, and timeless mountain culture.",

    cta: "Reserve your seat",

    difficulty: "Moderate",
    startPoint: "Shimla",
    durationDays: 8,

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

    includes: [
      "Stay and meals",
      "Guide support",
      "Transport",
      "Permits",
    ],

    notIncludes: [
      "Flights",
      "Personal expenses",
      "Extra activities",
    ],

    batches: [
      {
        id: "spiti-valley-2026-09-20",
        departureDate: "2026-09-20",
        returnDate: "2026-09-27",
        price: 16499,
        totalSeats: 12,
        bookedSeats: 0,
        paymentMode: "ADVANCE",
        advanceAmount: 10000,
        status: "OPEN",
        visibility: "PUBLIC",
        bookingEnabled: true,
      },
    ],
  },

  {
    id: "kashmir",
    slug: "kashmir",
    title: "Kashmir Valley Escape",

    travelCategory: "Domestic Tours",
    destination: "Kashmir",

    subtitle:
      "Lakes, meadows, and Himalayan calm.",

    summary:
      "Escape into a scenic valley experience shaped by alpine meadows, tranquil lakes, and warm local culture.",

    cta: "Plan this escape",

    difficulty: "Easy to Moderate",
    startPoint: "Srinagar",
    durationDays: 5,

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

    includes: [
      "Stay",
      "Meals",
      "Transport",
      "Guide",
    ],

    notIncludes: [
      "Flights",
      "Shopping",
      "Personal purchases",
    ],

    batches: [
      {
        id: "kashmir-2026-09-20",
        departureDate: "2026-09-20",
        returnDate: "2026-09-24",
        price: 11499,
        totalSeats: 10,
        bookedSeats: 0,
        paymentMode: "ADVANCE",
        advanceAmount: 5000,
        status: "OPEN",
        visibility: "PUBLIC",
        bookingEnabled: true,
      },
    ],
  },

  {
    id: "nepal",
    slug: "nepal",
    title: "Nepal Himalayan Journey",

    travelCategory: "International Tours",
    destination: "Nepal",

    subtitle:
      "Everest horizon. Mountain villages. Big adventure.",

    summary:
      "A classic trek across Himalayan terrain with welcoming mountain culture and unforgettable views.",

    cta: "Book the Himalayan route",

    difficulty: "Moderate to High",
    startPoint: "Kathmandu",
    durationDays: 7,

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

    includes: [
      "Stay",
      "Meals",
      "Guide support",
      "Transport",
    ],

    notIncludes: [
      "Flights",
      "Personal gear",
      "Insurance",
    ],

    batches: [
      {
        id: "nepal-2026-09-20",
        departureDate: "2026-09-20",
        returnDate: "2026-09-26",
        price: 21999,
        totalSeats: 10,
        bookedSeats: 0,
        paymentMode: "ADVANCE",
        advanceAmount: 10000,
        status: "OPEN",
        visibility: "PUBLIC",
        bookingEnabled: true,
      },
    ],
  },
];

export const defaultTrip: TripData = defaultTrips[0];

export const STORAGE_KEY = "bucketlist-trips-v1";

export function getDefaultTrips(): TripData[] {
  return defaultTrips;
}