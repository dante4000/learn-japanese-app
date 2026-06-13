// Credit-card knowledge base + ROI math for the Credit Cards tab.
//
// CARD_CATALOG is hand-curated from deep research (current as of mid-2026) into
// each card the user holds: annual fee, every statement credit, perks, point
// earn rates, transfer partners, and realistic point valuations. The pure
// functions below join that catalog to the user's actual connected accounts and
// their transactions, so the tab can answer "what is each card costing me, and
// what am I getting back — in credits, perks, and points?"
//
// Point/credit values are estimates, clearly labelled as such in the UI. Spend
// and balances are live from Plaid; points earned are *estimated* by applying
// each card's earn rates to categorized spend.

import { AppState, Account } from "./types";
import { effectiveCategory, isSpend, refundMatchedIds } from "./analytics";

export type CreditFrequency =
  | "annual"
  | "semiannual"
  | "quarterly"
  | "monthly"
  | "one-time"
  | "every-4-years";

export interface CardEarnRate {
  category: string;
  multiplier: number;
  note?: string;
}

export interface CardCredit {
  /** Short name shown in the perk checklist. */
  name: string;
  /** Max annual dollar value of the credit. */
  value: number;
  /** How it's doled out (drives the "easy to forget" warning). */
  frequency: CreditFrequency;
  /** Posts automatically vs requires you to remember/enroll. */
  autoApplies: boolean;
  enrollmentRequired: boolean;
  /** How to actually capture it. */
  howToUse: string;
  /** Fraction a typical engaged user realistically captures (0–1). Also the
   *  default for the "I use this" toggle (≥0.5 → on by default). */
  realisticCaptureRate: number;
  /** Lowercased merchant/category hints — for future auto-detection from txns. */
  detectHints?: string[];
}

export interface CardPerk {
  name: string;
  /** Est. annual cash value if you'd otherwise pay for it; 0 = unpriced. */
  value: number;
  note?: string;
}

export interface CardCatalogEntry {
  cardKey: string;
  displayName: string;
  issuer: string;
  network: string;
  /** Current sticker annual fee. */
  annualFee: number;
  /** Prior fee, if the card was repriced recently (shown as context). */
  legacyAnnualFee?: number;
  authorizedUserFee: number;
  pointProgram: string;
  /** Realistic blended cash value per point, in cents. */
  pointValueCents: number;
  pointValueNote: string;
  /** Lowercased substrings matched against an account's name/officialName/mask. */
  matchHints: string[];
  earnRates: CardEarnRate[];
  baseEarn: number;
  /** Plaid PFC primary → earn multiplier, for *estimating* points from spend. */
  pfcEarn: Record<string, number>;
  credits: CardCredit[];
  perks: CardPerk[];
  protections: string[];
  transferPartners: string[];
  /** Special callouts (free-night certs, rotating categories, etc.). */
  highlights: string[];
  recentChanges: string;
  feeNote?: string;
  sources: string[];
  accent: "blue" | "coral" | "slate";
}

export const CARD_CATALOG: CardCatalogEntry[] = [
  {
    cardKey: "sapphire-reserve",
    displayName: "Chase Sapphire Reserve",
    issuer: "Chase",
    network: "Visa Infinite",
    annualFee: 795,
    legacyAnnualFee: 550,
    authorizedUserFee: 195,
    pointProgram: "Chase Ultimate Rewards",
    pointValueCents: 2.0,
    pointValueNote:
      "TPG values UR at ~2.05¢/pt. Conservative cash-out floor is ~1.0–1.5¢; transfers to Hyatt/United and Points Boost get you ~2¢+.",
    matchHints: [
      "sapphire reserve",
      "annual membership fee",
      "csr",
      "chase sapphire",
    ],
    earnRates: [
      { category: "Chase Travel portal", multiplier: 8 },
      { category: "Flights & hotels booked direct", multiplier: 4 },
      { category: "Dining", multiplier: 3 },
      { category: "Lyft (through Sep 2027)", multiplier: 5 },
      { category: "Everything else", multiplier: 1 },
    ],
    baseEarn: 1,
    pfcEarn: { TRAVEL: 4, FOOD_AND_DRINK: 3 },
    credits: [
      {
        name: "Annual travel credit",
        value: 300,
        frequency: "annual",
        autoApplies: true,
        enrollmentRequired: false,
        howToUse:
          "Auto-applied to your first $300 of travel each year (airfare, hotels, rideshare, parking, tolls, transit).",
        realisticCaptureRate: 1.0,
        detectHints: ["travel", "airline", "hotel", "uber", "lyft", "parking", "toll", "transit"],
      },
      {
        name: "The Edit hotel credit",
        value: 500,
        frequency: "semiannual",
        autoApplies: true,
        enrollmentRequired: false,
        howToUse:
          "Two $250 credits/year on prepaid 2+ night stays booked via The Edit by Chase Travel. Each $250 must be a separate booking.",
        realisticCaptureRate: 0.5,
        detectHints: ["chase travel", "the edit", "hotel"],
      },
      {
        name: "Select hotels credit (2026 only)",
        value: 250,
        frequency: "annual",
        autoApplies: true,
        enrollmentRequired: false,
        howToUse:
          "Up to $250 through Dec 31 2026 on prepaid 2+ night Chase Travel stays at IHG/Montage/Pendry/Omni/Virgin/Minor/Pan Pacific. Can stack with The Edit credit.",
        realisticCaptureRate: 0.3,
        detectHints: ["chase travel", "ihg", "montage", "pendry", "omni", "virgin hotels"],
      },
      {
        name: "Exclusive Tables dining credit",
        value: 300,
        frequency: "semiannual",
        autoApplies: true,
        enrollmentRequired: false,
        howToUse:
          "$150 per half-year on the full bill when you book a reservation via Sapphire Reserve Exclusive Tables on OpenTable.",
        realisticCaptureRate: 0.45,
        detectHints: ["opentable", "exclusive tables"],
      },
      {
        name: "StubHub / viagogo credit",
        value: 300,
        frequency: "semiannual",
        autoApplies: false,
        enrollmentRequired: true,
        howToUse:
          "$150 per half-year on event/concert tickets (through 2027). One-time activation required.",
        realisticCaptureRate: 0.35,
        detectHints: ["stubhub", "viagogo"],
      },
      {
        name: "DoorDash promo credits",
        value: 300,
        frequency: "monthly",
        autoApplies: false,
        enrollmentRequired: true,
        howToUse:
          "Monthly in-app promos ($5 restaurant + two $10 non-restaurant) through 2027. Requires DashPass activation.",
        realisticCaptureRate: 0.4,
        detectHints: ["doordash"],
      },
      {
        name: "DashPass membership",
        value: 120,
        frequency: "annual",
        autoApplies: false,
        enrollmentRequired: true,
        howToUse: "Complimentary DoorDash DashPass when activated through Chase.",
        realisticCaptureRate: 0.5,
        detectHints: ["doordash", "dashpass"],
      },
      {
        name: "Lyft credit",
        value: 120,
        frequency: "monthly",
        autoApplies: true,
        enrollmentRequired: false,
        howToUse: "$10/month in-app Lyft credit through Sep 2027. Set the card as your Lyft payment method.",
        realisticCaptureRate: 0.55,
        detectHints: ["lyft"],
      },
      {
        name: "Peloton membership credit",
        value: 120,
        frequency: "monthly",
        autoApplies: false,
        enrollmentRequired: true,
        howToUse: "$10/month toward a Peloton membership through 2027. Activation required.",
        realisticCaptureRate: 0.15,
        detectHints: ["peloton"],
      },
      {
        name: "Apple TV+ & Apple Music",
        value: 288,
        frequency: "annual",
        autoApplies: false,
        enrollmentRequired: true,
        howToUse: "Complimentary Apple TV+ and Apple Music through mid-2027. One-time activation per service.",
        realisticCaptureRate: 0.5,
        detectHints: ["apple.com/bill", "apple tv", "apple music"],
      },
      {
        name: "Global Entry / TSA PreCheck",
        value: 120,
        frequency: "every-4-years",
        autoApplies: true,
        enrollmentRequired: false,
        howToUse: "Up to $120 statement credit once every 4 years when you charge the application fee.",
        realisticCaptureRate: 1.0,
        detectHints: ["global entry", "tsa", "nexus"],
      },
    ],
    perks: [
      { name: "Priority Pass Select", value: 469, note: "Unlimited visits to 1,300+ lounges; enrollment required." },
      { name: "Chase Sapphire Lounges", value: 0, note: "Cardholder + 2 guests; new DFW/LAX lounges in 2026." },
      { name: "IHG One Rewards Platinum Elite", value: 0, note: "Complimentary status through 2027." },
      { name: "Reserve Travel Designers", value: 300, note: "Luxury trip-planning concierge." },
      { name: "Points Boost", value: 0, note: "Up to ~2–2.5¢/pt on select Chase Travel bookings." },
      { name: "No foreign transaction fees", value: 0 },
      { name: "$75k-spend bonuses", value: 0, note: "Unlocks Hyatt Explorist, IHG Diamond, Southwest A-List + $500 credit." },
    ],
    protections: [
      "Trip cancellation/interruption up to $10,000/traveler",
      "Trip delay up to $500/ticket (6+ hours)",
      "Primary auto rental CDW up to $75,000",
      "Lost/delayed luggage coverage",
      "Purchase protection ($10k/claim, 120 days) + extended warranty",
      "Emergency evacuation up to $100,000",
    ],
    transferPartners: [
      "United", "Southwest", "JetBlue", "Air Canada Aeroplan", "Air France-KLM Flying Blue",
      "British Airways Avios", "Virgin Atlantic", "Singapore KrisFlyer", "Emirates",
      "World of Hyatt", "Marriott Bonvoy", "IHG", "Wyndham",
    ],
    highlights: [
      "The 2025 refresh turned this into a ~$2,700 'coupon book' — but most credits are use-it-or-lose-it and easy to forget.",
      "Pools points with your Freedom Unlimited/Flex, unlocking transfer partners for those cards' points too.",
    ],
    recentChanges:
      "Mid-2025 refresh: annual fee $550 → $795, authorized user $75 → $195. Earn restructured (8x Chase Travel, 4x direct travel, 3x dining). Added The Edit ($500), Exclusive Tables ($300), StubHub ($300), DoorDash (up to $420), Lyft ($120), Apple ($288) credits. Flat 1.5¢ portal redemption replaced by variable Points Boost.",
    feeNote:
      "Chase raised the fee from $550 to $795 in the 2025 refresh (hits existing cardholders at renewal). If you haven't renewed yet you may still be on the old $550 card with the simpler $300-travel-credit / 3x-3x structure and none of the new coupon-book credits.",
    sources: [
      "https://www.chase.com/sapphire-cards/personal/reserve",
      "https://www.nerdwallet.com/credit-cards/news/chase-sapphire-reserve-overhaul-june-2025",
      "https://thepointsguy.com/loyalty-programs/monthly-valuations/",
    ],
    accent: "blue",
  },
  {
    cardKey: "amex-platinum",
    displayName: "American Express Platinum",
    issuer: "American Express",
    network: "Amex",
    annualFee: 895,
    legacyAnnualFee: 695,
    authorizedUserFee: 195,
    pointProgram: "Membership Rewards",
    pointValueCents: 2.0,
    pointValueNote:
      "TPG values MR at ~2.0¢/pt via transfer partners (sweet spots higher). If you mostly book paid travel through the portal, assume ~1.0–1.1¢.",
    matchHints: ["platinum", "amex platinum", "american express", "amex plat"],
    earnRates: [
      { category: "Flights direct / Amex Travel", multiplier: 5, note: "Up to $500k/yr" },
      { category: "Prepaid hotels via Amex Travel", multiplier: 5 },
      { category: "Everything else", multiplier: 1 },
    ],
    baseEarn: 1,
    pfcEarn: { TRAVEL: 5 },
    credits: [
      {
        name: "Hotel credit (FHR / Hotel Collection)",
        value: 600,
        frequency: "semiannual",
        autoApplies: true,
        enrollmentRequired: false,
        howToUse:
          "Two $300 buckets (Jan–Jun, Jul–Dec) on prepaid Amex Travel stays at Fine Hotels + Resorts or The Hotel Collection. Doesn't roll over.",
        realisticCaptureRate: 0.6,
        detectHints: ["amex travel", "fine hotels", "hotel collection"],
      },
      {
        name: "Resy dining credit",
        value: 400,
        frequency: "quarterly",
        autoApplies: false,
        enrollmentRequired: true,
        howToUse: "$100/quarter at eligible U.S. Resy restaurants. Enroll first; doesn't roll over.",
        realisticCaptureRate: 0.65,
        detectHints: ["resy"],
      },
      {
        name: "Uber Cash",
        value: 200,
        frequency: "monthly",
        autoApplies: false,
        enrollmentRequired: true,
        howToUse: "$15/month ($35 in Dec) for Uber rides & Eats. Add card in the Uber app. Expires monthly.",
        realisticCaptureRate: 0.7,
        detectHints: ["uber"],
      },
      {
        name: "Uber One membership",
        value: 120,
        frequency: "monthly",
        autoApplies: false,
        enrollmentRequired: true,
        howToUse: "$10/month toward an auto-renewing Uber One membership.",
        realisticCaptureRate: 0.6,
        detectHints: ["uber one"],
      },
      {
        name: "Digital entertainment credit",
        value: 300,
        frequency: "monthly",
        autoApplies: false,
        enrollmentRequired: true,
        howToUse: "$25/month on Disney+, Hulu, ESPN+, Peacock, Paramount+, NYT, WSJ, YouTube Premium/TV. Enroll; doesn't roll over.",
        realisticCaptureRate: 0.75,
        detectHints: ["disney", "hulu", "espn", "peacock", "paramount", "new york times", "wall street journal", "youtube"],
      },
      {
        name: "lululemon credit",
        value: 300,
        frequency: "quarterly",
        autoApplies: false,
        enrollmentRequired: true,
        howToUse: "$75/quarter at U.S. lululemon (excludes outlets). Enroll; doesn't roll over.",
        realisticCaptureRate: 0.55,
        detectHints: ["lululemon"],
      },
      {
        name: "Oura Ring credit",
        value: 200,
        frequency: "annual",
        autoApplies: false,
        enrollmentRequired: true,
        howToUse: "$200 toward Oura Ring hardware. Only useful if you're buying a ring.",
        realisticCaptureRate: 0.2,
        detectHints: ["oura"],
      },
      {
        name: "Airline incidental fee credit",
        value: 200,
        frequency: "annual",
        autoApplies: false,
        enrollmentRequired: true,
        howToUse: "Pick one airline; reimburses bags/seats/lounge passes up to $200/yr. Doesn't cover airfare; coding is finicky.",
        realisticCaptureRate: 0.5,
        detectHints: ["airline", "baggage"],
      },
      {
        name: "Equinox credit",
        value: 300,
        frequency: "annual",
        autoApplies: false,
        enrollmentRequired: true,
        howToUse: "$300/yr on Equinox membership or Equinox+. Only useful if you're a member.",
        realisticCaptureRate: 0.25,
        detectHints: ["equinox"],
      },
      {
        name: "Walmart+ membership",
        value: 155,
        frequency: "monthly",
        autoApplies: false,
        enrollmentRequired: true,
        howToUse: "Reimburses a monthly Walmart+ membership ($12.95/mo incl. tax). Not the annual plan.",
        realisticCaptureRate: 0.6,
        detectHints: ["walmart"],
      },
      {
        name: "CLEAR Plus credit",
        value: 209,
        frequency: "annual",
        autoApplies: false,
        enrollmentRequired: true,
        howToUse: "Reimburses a full CLEAR Plus membership. Only useful if CLEAR is at airports you use.",
        realisticCaptureRate: 0.55,
        detectHints: ["clear"],
      },
      {
        name: "Saks credit (ends Jun 30 2026)",
        value: 100,
        frequency: "semiannual",
        autoApplies: false,
        enrollmentRequired: true,
        howToUse: "$50 per half-year at Saks. Amex is killing this July 1 2026 after Saks's bankruptcy — use it before then.",
        realisticCaptureRate: 0.4,
        detectHints: ["saks"],
      },
    ],
    perks: [
      { name: "Centurion Lounge access", value: 0, note: "Unlimited; guests $50 (free at $75k spend)." },
      { name: "Priority Pass Select", value: 0, note: "1,500+ lounges; enrollment required." },
      { name: "Delta Sky Club", value: 0, note: "10 visits/yr on Delta same-day tickets." },
      { name: "Hilton Honors Gold + Marriott Bonvoy Gold", value: 0, note: "Complimentary hotel elite status." },
      { name: "Hertz President's Circle / Avis / National Executive", value: 0, note: "Rental car elite status." },
      { name: "Global Entry / TSA PreCheck credit", value: 120, note: "Up to $120 every 4 years." },
      { name: "Fine Hotels + Resorts perks", value: 0, note: "Breakfast, upgrades, $100 property credit, 4pm checkout." },
      { name: "No foreign transaction fees", value: 0 },
    ],
    protections: [
      "Cell phone protection up to $800/claim ($50 deductible)",
      "Trip cancellation/interruption up to $10,000/trip",
      "Trip delay up to $500/trip (6+ hours)",
      "Baggage insurance",
      "Purchase protection ($10k/occurrence) + extended warranty",
      "Secondary car rental coverage (primary available to buy)",
    ],
    transferPartners: [
      "Air Canada Aeroplan", "Air France-KLM Flying Blue", "ANA", "Avianca LifeMiles",
      "British Airways Avios", "Cathay Asia Miles", "Delta SkyMiles", "Emirates",
      "Singapore KrisFlyer", "Virgin Atlantic", "Qantas", "Hilton Honors", "Marriott Bonvoy",
    ],
    highlights: [
      "Sept 2025 refresh pushed the fee to $895 and stuffed in ~$1,400 of new credits — but they're heavily monthly/quarterly and forgettable.",
      "The math only works if you actually use the Resy, hotel, Uber, digital-entertainment and lifestyle credits — track them monthly.",
    ],
    recentChanges:
      "Sept 2025 refresh: fee $695 → $895 (existing cardholders at renewal from Jan 2026). Added Resy ($400), lululemon ($300), Oura ($200), Uber One ($120), Walmart+ ($155); digital entertainment $240 → $300 with YouTube TV. Earn unchanged (5x flights/prepaid hotels). Saks credit ends Jul 1 2026.",
    feeNote: "Fee rose from $695 to $895 in the Sept 2025 refresh; existing cardholders hit the new fee at their first renewal on/after Jan 2 2026.",
    sources: [
      "https://www.cnbc.com/2025/09/18/american-express-platinum-card-refresh-895-fee-3500-perks.html",
      "https://thepointsguy.com/credit-cards/reviews/amex-platinum-review/",
      "https://www.nerdwallet.com/credit-cards/reviews/american-express-platinum",
    ],
    accent: "slate",
  },
  {
    cardKey: "bilt-mastercard",
    displayName: "Bilt Obsidian",
    issuer: "Bilt Rewards (Cardless / Column N.A.)",
    network: "World Elite Mastercard",
    annualFee: 95,
    authorizedUserFee: 0,
    pointProgram: "Bilt Rewards",
    pointValueCents: 2.0,
    pointValueNote:
      "TPG values Bilt at ~2.2¢; ~2.0¢ realistic via Hyatt/airline transfers. Points have no cash floor — best used via 1:1 transfer partners.",
    matchHints: ["bilt"],
    earnRates: [
      { category: "Dining or grocery (your choice)", multiplier: 3, note: "Pick one as your 3x category; grocery capped $25k/yr" },
      { category: "Travel", multiplier: 2 },
      { category: "Rent / mortgage (no fee)", multiplier: 1, note: "Up to 1.25x, scaled by your Everyday Spend Ratio" },
      { category: "Everything else", multiplier: 1 },
    ],
    baseEarn: 1,
    pfcEarn: { FOOD_AND_DRINK: 3, TRAVEL: 2 },
    credits: [
      {
        name: "Bilt Travel hotel credit",
        value: 100,
        frequency: "semiannual",
        autoApplies: true,
        enrollmentRequired: false,
        howToUse: "Two $50 credits/year on a 2+ night Bilt Travel hotel booking. Obsidian-tier benefit.",
        realisticCaptureRate: 0.4,
        detectHints: ["bilt travel", "hotel"],
      },
    ],
    perks: [
      { name: "Fee-free rent rewards", value: 0, note: "The only mainstream card that rewards rent (and, since 2026, mortgage) with no surcharge." },
      { name: "Rent Day promotions", value: 0, note: "1st-of-month bonuses: doubled category points, transfer bonuses." },
      { name: "Strong transfer partners", value: 0, note: "1:1 to Hyatt, United, American, Alaska, Air France-KLM, Aeroplan and more." },
      { name: "No foreign transaction fees", value: 0, note: "Obsidian/Palladium tiers waive FX fees." },
      { name: "Cell phone protection", value: 0, note: "World Elite Mastercard benefit." },
    ],
    protections: [
      "Cell phone protection (World Elite Mastercard)",
      "Purchase protection + extended warranty",
      "Trip cancellation/interruption (Obsidian tier)",
      "Zero liability fraud protection",
    ],
    transferPartners: [
      "World of Hyatt", "United", "American AAdvantage", "Alaska/Atmos", "Air Canada Aeroplan",
      "Air France-KLM Flying Blue", "Avianca LifeMiles", "Turkish", "Virgin Atlantic",
      "Emirates", "British Airways Avios", "IHG", "Marriott Bonvoy", "Southwest",
    ],
    highlights: [
      "Obsidian is the $95 mid-tier of 'Bilt 2.0' (launched Feb 7 2026). The headline value is still earning transferable points on rent you'd pay anyway — no surcharge.",
      "Rent earning is now scaled by an 'Everyday Spend Ratio' (you need to put enough everyday spend on the card to unlock full rent points) — more complex than the old 5-transactions rule. Watch this so your rent actually earns.",
    ],
    recentChanges:
      "Major 2025–2026 overhaul. The original Wells Fargo Bilt Mastercard was deactivated Feb 6 2026. 'Bilt 2.0' launched Feb 7 2026 (issuer Column N.A., serviced by Cardless) as three tiers: Blue ($0), Obsidian ($95), Palladium ($495). Rent rewards mechanics changed; mortgage earning added (any lender). A second currency, Bilt Cash, was introduced.",
    feeNote: "Obsidian is the $95 tier of the 2026 Bilt 2.0 lineup (Blue $0 / Obsidian $95 / Palladium $495). It adds a $100/yr hotel credit, a 3x dining-or-grocery category, and FX-fee waiver over the free Blue tier.",
    sources: [
      "https://newsroom.biltrewards.com/meetbiltcard2.0",
      "https://www.nerdwallet.com/credit-cards/news/bilt-launches-blue-obsidian-palladium",
      "https://onemileatatime.com/news/new-bilt-credit-card-rent-rewards-details/",
    ],
    accent: "blue",
  },
  {
    cardKey: "world-of-hyatt",
    displayName: "World of Hyatt Credit Card",
    issuer: "Chase",
    network: "Visa Signature",
    annualFee: 95,
    authorizedUserFee: 0,
    pointProgram: "World of Hyatt",
    pointValueCents: 1.7,
    pointValueNote:
      "TPG values Hyatt at ~1.7¢; aspirational redemptions hit 2–2.5¢+. Widely considered the most valuable hotel currency, and a 1:1 Chase UR transfer partner.",
    matchHints: ["hyatt", "world of hyatt", "woh"],
    earnRates: [
      { category: "Hyatt hotels", multiplier: 4, note: "Plus base earning → ~9x effective" },
      { category: "Dining", multiplier: 2 },
      { category: "Airfare (direct)", multiplier: 2 },
      { category: "Transit / gyms", multiplier: 2 },
      { category: "Everything else", multiplier: 1 },
    ],
    baseEarn: 1,
    pfcEarn: { TRAVEL: 2, FOOD_AND_DRINK: 2, TRANSPORTATION: 2 },
    credits: [],
    perks: [
      { name: "Automatic Discoverist status", value: 0, note: "Late checkout, preferred rooms, bonus points — as long as you hold the card." },
      { name: "5 elite night credits/year", value: 0, note: "+2 ENCs per $5,000 spent — fast-tracks Explorist/Globalist." },
    ],
    protections: [
      "Trip cancellation/interruption insurance",
      "Primary auto rental CDW",
      "Baggage delay insurance",
      "Purchase protection + extended warranty",
      "No foreign transaction fees",
    ],
    transferPartners: [
      "Inbound: Chase Ultimate Rewards 1:1, Bilt 1:1 (top up your Hyatt balance)",
    ],
    highlights: [
      "Annual free night (Category 1–4) every cardmember year — a peak Cat 4 room can run 18,000 points, easily worth far more than the $95 fee.",
      "Second free night (Category 1–4) when you spend $15,000 in a calendar year.",
    ],
    recentChanges:
      "Stable through 2026: $95 fee, Cat 1–4 anniversary free night, second free night at $15k spend, Discoverist + 5 ENCs. Hyatt plans to expand its Chase card portfolio in 2026, so new Hyatt cards may launch.",
    sources: [
      "https://www.chase.com/personal/credit-cards/hyatt/world-hyatt/free-awards",
      "https://www.nerdwallet.com/credit-cards/reviews/world-of-hyatt",
    ],
    accent: "blue",
  },
  {
    cardKey: "freedom-unlimited",
    displayName: "Chase Freedom Unlimited",
    issuer: "Chase",
    network: "Visa",
    annualFee: 0,
    authorizedUserFee: 0,
    pointProgram: "Chase Ultimate Rewards",
    pointValueCents: 1.5,
    pointValueNote:
      "1¢ each as cash back, but ~2¢+ when pooled into your Sapphire Reserve and transferred to partners. Use ~1.5¢ as a blended value.",
    matchHints: ["freedom unlimited", "freedom unltd", "cfu"],
    earnRates: [
      { category: "Chase Travel portal", multiplier: 5 },
      { category: "Dining", multiplier: 3 },
      { category: "Drugstores", multiplier: 3 },
      { category: "Everything else", multiplier: 1.5 },
    ],
    baseEarn: 1.5,
    pfcEarn: { FOOD_AND_DRINK: 3 },
    credits: [],
    perks: [
      { name: "Point pooling with Sapphire Reserve", value: 0, note: "Combining points into the Reserve makes these transferable to airline/hotel partners." },
      { name: "1.5% flat on everything", value: 0, note: "Strong catch-all rate for non-bonus spend." },
    ],
    protections: [
      "Purchase protection (120 days, $500/claim)",
      "Extended warranty (+1 year)",
      "Trip cancellation/interruption insurance",
      "Secondary auto rental CDW",
    ],
    transferPartners: [
      "Via Sapphire Reserve: United, Southwest, JetBlue, Aeroplan, Flying Blue, Avios, Virgin Atlantic, World of Hyatt, Marriott, IHG, Wyndham",
    ],
    highlights: [
      "No annual fee. Best used as your everyday 1.5x card, with points pooled into the Sapphire Reserve to unlock transfer value.",
    ],
    recentChanges:
      "Unchanged for 2026: 5% Chase Travel, 3% dining, 3% drugstores, 1.5% base. Value increasingly tied to the Reserve's Points Boost redemptions.",
    sources: [
      "https://www.nerdwallet.com/credit-cards/reviews/chase-freedom-unlimited",
    ],
    accent: "slate",
  },
  {
    cardKey: "freedom-flex",
    displayName: "Chase Freedom Flex",
    issuer: "Chase",
    network: "Mastercard (World Elite)",
    annualFee: 0,
    authorizedUserFee: 0,
    pointProgram: "Chase Ultimate Rewards",
    pointValueCents: 1.5,
    pointValueNote:
      "1¢ each as cash back, ~2¢+ when pooled into your Sapphire Reserve and transferred. Use ~1.5¢ blended.",
    matchHints: ["freedom flex", "cff"],
    earnRates: [
      { category: "Rotating 5% categories (activate quarterly)", multiplier: 5, note: "Up to $1,500/quarter" },
      { category: "Chase Travel portal", multiplier: 5 },
      { category: "Dining", multiplier: 3 },
      { category: "Drugstores", multiplier: 3 },
      { category: "Everything else", multiplier: 1 },
    ],
    baseEarn: 1,
    pfcEarn: { FOOD_AND_DRINK: 3 },
    credits: [],
    perks: [
      { name: "Cell phone protection", value: 800, note: "Up to $800/claim ($50 deductible) when you pay your phone bill with the card — rare on a $0-fee card." },
      { name: "Point pooling with Sapphire Reserve", value: 0, note: "Makes these points transferable to partners." },
    ],
    protections: [
      "Cell phone protection (see perks)",
      "Purchase protection + extended warranty",
      "Trip cancellation/interruption insurance",
      "Secondary auto rental CDW",
    ],
    transferPartners: [
      "Via Sapphire Reserve: United, Southwest, JetBlue, Aeroplan, Flying Blue, Avios, Virgin Atlantic, World of Hyatt, Marriott, IHG, Wyndham",
    ],
    highlights: [
      "No annual fee. Maxing the rotating 5% categories ($1,500/quarter) is up to $300/yr (≈15,000 UR) — but you must activate each quarter.",
      "2026 rotating categories — Q1: dining, cruises, charity; Q2: Amazon, Whole Foods, Chase Travel; Q3: gas/EV, transit, live entertainment; Q4: TBA (~Sep 2026).",
      "Cell phone protection is the standout perk for a free card.",
    ],
    recentChanges:
      "Unchanged for 2026: 5% rotating (activate, $1,500/qtr cap) + 5% Chase Travel + 3% dining/drugstores + 1% base. The original Chase Freedom is closed to new applicants.",
    sources: [
      "https://www.chase.com/personal/credit-cards/freedom/flex",
      "https://www.nerdwallet.com/credit-cards/learn/chase-freedom-calendar",
    ],
    accent: "slate",
  },
  {
    cardKey: "amex-blue-cash-preferred",
    displayName: "Amex Blue Cash Preferred",
    issuer: "American Express",
    network: "Amex",
    annualFee: 95,
    authorizedUserFee: 0,
    pointProgram: "Cash back (Reward Dollars)",
    pointValueCents: 1.0,
    pointValueNote:
      "Earns cash back as Reward Dollars (statement credits / Amazon checkout), 1¢ each. NOT transferable Membership Rewards — a straight cash-back card.",
    matchHints: ["blue cash preferred", "blue cash", "bcp"],
    earnRates: [
      { category: "U.S. supermarkets", multiplier: 6, note: "Up to $6,000/yr, then 1%" },
      { category: "Select U.S. streaming", multiplier: 6 },
      { category: "U.S. gas & transit", multiplier: 3 },
      { category: "Everything else", multiplier: 1 },
    ],
    baseEarn: 1,
    // Plaid PFC can't split 6% groceries from 1% restaurants (both FOOD_AND_DRINK),
    // so 3 is a blended estimate; streaming→6, gas/transit→3.
    pfcEarn: { FOOD_AND_DRINK: 3, ENTERTAINMENT: 6, TRANSPORTATION: 3 },
    credits: [
      {
        name: "Disney streaming credit",
        value: 120,
        frequency: "monthly",
        autoApplies: false,
        enrollmentRequired: true,
        howToUse:
          "$10/month back on an eligible Disney+/Hulu/ESPN subscription or bundle. No minimum spend (since Aug 2025). Enroll first.",
        realisticCaptureRate: 0.6,
        detectHints: ["disney", "hulu", "espn"],
      },
    ],
    perks: [
      { name: "Free authorized users", value: 0, note: "Add users at no fee; their spend earns Reward Dollars for you." },
      { name: "Amex Offers", value: 0, note: "Rotating merchant statement-credit/bonus offers in the Amex app." },
      { name: "Plan It", value: 0, note: "Split $100+ purchases into fixed monthly payments for a flat fee." },
      { name: "Global Assist Hotline", value: 0, note: "24/7 emergency help when 100+ miles from home." },
    ],
    protections: [
      "Return protection up to $300/item ($1,000/yr)",
      "Secondary car rental loss & damage (primary upgrade available)",
      "Extended warranty (+1 year on warranties ≤5 years)",
      "Purchase protection against damage/theft",
    ],
    transferPartners: [],
    highlights: [
      "6% at U.S. supermarkets (up to $6,000/yr = up to $360 back) and 6% on select U.S. streaming — the best grocery/streaming cash-back rates around.",
      "The $120/yr Disney streaming credit alone more than covers the $95 fee if you subscribe to Disney+/Hulu/ESPN.",
      "Pure cash back — no points to manage and no transfer partners, unlike your other Amex/Chase cards.",
    ],
    recentChanges:
      "Aug 1 2025: the Disney benefit became the 'Disney streaming credit', rose from $84/yr to $120/yr ($10/mo), dropped the $9.99 minimum, and broadened eligible services. Amex also removed the Reward Dollars minimum-redemption threshold. $95 fee unchanged.",
    feeNote: "$0 intro annual fee the first year, then $95. The $120 Disney credit offsets the fee for streamers; a grocery-heavy household ($4–6k/yr) earns ~$240–360 on groceries alone.",
    sources: [
      "https://www.americanexpress.com/us/credit-cards/card/blue-cash-preferred/",
      "https://thepointsguy.com/credit-cards/blue-cash-preferred-increases-disney-bundle-credit/",
      "https://wallethub.com/edu/cc/amex-blue-cash-preferred-benefits/146174",
    ],
    accent: "coral",
  },
];

// ── matching & spend ─────────────────────────────────────────────────────────

/** Cards by network used as a tiebreak when name matching is ambiguous. */
export function findCatalogEntry(cardKey: string): CardCatalogEntry | undefined {
  return CARD_CATALOG.find((c) => c.cardKey === cardKey);
}

/**
 * Best-effort match of a connected credit account to a catalog card by checking
 * the card's matchHints against the account's name, official name, and mask.
 * Returns the cardKey or null. Used to overlay live spend onto the catalog.
 */
export function matchAccountToCard(account: Account): string | null {
  const hay = `${account.name} ${account.officialName ?? ""} ${account.mask ?? ""}`.toLowerCase();
  for (const card of CARD_CATALOG) {
    if (card.matchHints.some((h) => hay.includes(h))) return card.cardKey;
  }
  return null;
}

/** The latest transaction date in the dataset (anchors the trailing window). */
function latestDate(state: AppState): string {
  let latest = "";
  for (const t of state.transactions) if (t.date > latest) latest = t.date;
  return latest || new Date().toISOString().slice(0, 10);
}

/** Date string N months before `anchor` (yyyy-mm-dd). */
function monthsBefore(anchor: string, months: number): string {
  const d = new Date(anchor + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() - months);
  return d.toISOString().slice(0, 10);
}

export interface CardSpend {
  /** Spend in the trailing 12 months, by Plaid PFC primary category. */
  byCategory: Map<string, number>;
  total12mo: number;
  /** Calendar-year-to-date total (relative to the latest data date). */
  totalYtd: number;
  /** Count of posted spend transactions in the trailing window. */
  count: number;
}

/** Outflow spend on one account over the trailing 12 months + YTD. */
export function cardSpend(state: AppState, accountId: string): CardSpend {
  const anchor = latestDate(state);
  const cutoff = monthsBefore(anchor, 12);
  const yearStart = anchor.slice(0, 4) + "-01-01";
  const byCategory = new Map<string, number>();
  const neutralized = refundMatchedIds(state);
  let total12mo = 0;
  let totalYtd = 0;
  let count = 0;
  for (const t of state.transactions) {
    if (t.accountId !== accountId) continue;
    if (!isSpend(t, neutralized)) continue;
    if (t.date >= yearStart) totalYtd += t.amount;
    if (t.date < cutoff) continue;
    const cat = effectiveCategory(t);
    byCategory.set(cat, (byCategory.get(cat) ?? 0) + t.amount);
    total12mo += t.amount;
    count += 1;
  }
  return { byCategory, total12mo, totalYtd, count };
}

/** Estimate points earned from categorized spend by applying the card's rates. */
export function estimatePoints(
  card: CardCatalogEntry,
  byCategory: Map<string, number>,
): number {
  let pts = 0;
  for (const [cat, amt] of byCategory) {
    const mult = card.pfcEarn[cat] ?? card.baseEarn;
    pts += amt * mult;
  }
  return Math.round(pts);
}

/** Cash value (dollars) of an estimated point balance at the card's valuation. */
export function pointsValue(card: CardCatalogEntry, points: number): number {
  return (points * card.pointValueCents) / 100;
}

/** Max value of every credit on a card if fully captured (the sticker promise). */
export function maxCreditsValue(card: CardCatalogEntry): number {
  return card.credits.reduce((a, c) => a + c.value, 0);
}

/** Value of the credits at each one's realistic capture rate (a sane default). */
export function realisticCreditsValue(card: CardCatalogEntry): number {
  return card.credits.reduce((a, c) => a + c.value * c.realisticCaptureRate, 0);
}

/** Annual value of perks that carry an explicit dollar estimate. */
export function pricedPerksValue(card: CardCatalogEntry): number {
  return card.perks.reduce((a, p) => a + (p.value ?? 0), 0);
}
