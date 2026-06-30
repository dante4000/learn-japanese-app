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

import { AppState, Account, Transaction } from "./types";
import { effectiveCategory, isSpend, refundMatchedIds } from "./analytics";

export type CreditFrequency =
  | "annual"
  | "semiannual"
  | "quarterly"
  | "monthly"
  | "one-time"
  | "every-4-years";

/** A human-readable earn rate, shown as a chip in the UI. */
export interface CardEarnRate {
  category: string;
  multiplier: number;
  note?: string;
}

/**
 * One earn-multiplier rule, used to *estimate* points from real transactions.
 * Rules are evaluated in array order and the FIRST match wins, so each card
 * lists them most-specific → least-specific. A transaction matches a rule when
 * any of its three matchers hit:
 *   - `detailed`     — Plaid detailed PFC (e.g. FOOD_AND_DRINK_GROCERIES)
 *   - `merchantHints`— lowercased substrings of the merchant/description
 *   - `primary`      — Plaid primary PFC (e.g. FOOD_AND_DRINK)
 * Anything that matches no rule earns the card's `baseEarn`. `annualCap` caps
 * the *spend* that earns the bonus rate over the trailing year; spend beyond it
 * falls back to `baseEarn` (e.g. Blue Cash's $6k/yr supermarket cap).
 */
export interface EarnRule {
  label: string;
  multiplier: number;
  detailed?: string[];
  merchantHints?: string[];
  primary?: string[];
  annualCap?: number;
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
  /** Lowercased merchant/category hints matched against the triggering *charge*
   *  (an outflow), for credits whose purchase names the credit (DoorDash, Lyft…). */
  detectHints?: string[];
  /** Lowercased hints matched against the Chase statement-credit *posting* (an
   *  inflow). Use for credits whose triggering charge is unrecognizable — e.g.
   *  Exclusive Tables, where the bill posts as the restaurant but Chase's credit
   *  line names the benefit. A matched inflow counts as the credit captured. */
  creditPostHints?: string[];
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
  /** Conservative cents/point — the cash-out / statement-credit floor. */
  cashValueCents: number;
  /** Aspirational cents/point — realistic value via transfer partners. */
  transferValueCents: number;
  pointValueNote: string;
  /** Lowercased substrings matched against an account's name/officialName/mask. */
  matchHints: string[];
  /** Human-readable earn rates (display only). */
  earnRates: CardEarnRate[];
  /** Multiplier for spend that matches no `earnModel` rule. */
  baseEarn: number;
  /** Ordered, most-specific-first rules for *estimating* points from real txns. */
  earnModel: EarnRule[];
  credits: CardCredit[];
  perks: CardPerk[];
  protections: string[];
  transferPartners: string[];
  /** Special callouts (free-night certs, rotating categories, etc.). */
  highlights: string[];
  recentChanges: string;
  feeNote?: string;
  /** A real no-annual-fee product-change target, where one exists. Surfaced as
   *  renewal nears so you can downgrade before the fee posts. */
  downgradeTo?: { displayName: string; annualFee: number };
  /** Override the default annual-fee-charge phrases used to auto-detect renewal. */
  feeChargeHints?: string[];
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
    cashValueCents: 1.0,
    transferValueCents: 2.0,
    pointValueNote:
      "TPG values UR at ~2.05¢/pt. Conservative cash-out floor is ~1.0¢; transfers to Hyatt/United and Points Boost get you ~2¢+.",
    matchHints: [
      "2487",
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
    earnModel: [
      { label: "Chase Travel portal", multiplier: 8, merchantHints: ["chase travel", "chasetravel", "ultimate rewards"] },
      { label: "Lyft", multiplier: 5, merchantHints: ["lyft"] },
      { label: "Groceries (no bonus)", multiplier: 1, detailed: ["FOOD_AND_DRINK_GROCERIES"] },
      { label: "Dining", multiplier: 3, primary: ["FOOD_AND_DRINK"] },
      { label: "Flights & hotels", multiplier: 4, detailed: ["TRAVEL_FLIGHTS", "TRAVEL_LODGING"] },
    ],
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
        // The dining charge posts as the restaurant — only Chase's credit line
        // names the benefit, so detect it from the statement-credit inflow.
        detectHints: ["opentable", "exclusive tables"],
        creditPostHints: ["exclusive tables"],
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
        creditPostHints: ["stubhub credit", "viagogo credit"],
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
    downgradeTo: { displayName: "Chase Freedom Unlimited", annualFee: 0 },
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
    cashValueCents: 0.6,
    transferValueCents: 2.0,
    pointValueNote:
      "MR cashes out at only ~0.6¢/pt, but transfers to partners hit ~2.0¢ (sweet spots higher). The card only makes sense if you transfer — not cash out.",
    matchHints: ["platinum", "amex platinum", "american express", "amex plat"],
    earnRates: [
      { category: "Flights direct / Amex Travel", multiplier: 5, note: "Up to $500k/yr" },
      { category: "Prepaid hotels via Amex Travel", multiplier: 5 },
      { category: "Everything else", multiplier: 1 },
    ],
    baseEarn: 1,
    earnModel: [
      // 5x is flights + hotels booked *through Amex Travel* only; hotels booked
      // direct (most TRAVEL_LODGING) earn 1x, so only flights get a blanket 5x.
      { label: "Amex Travel (prepaid hotels)", multiplier: 5, merchantHints: ["amex travel", "amextravel", "fine hotels", "fhr", "hotel collection"] },
      { label: "Flights", multiplier: 5, detailed: ["TRAVEL_FLIGHTS"] },
    ],
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
        // High-confidence: Amex posts this as "AMEX FINE HOTELS RES" /
        // "AMEX HOTEL COLLECTN" / "Platinum Hotel Credit" (Amex Travel FAQ).
        creditPostHints: ["fine hotels", "hotel collectn", "hotel collection", "hotelcredit", "hotel credit"],
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
        creditPostHints: ["resy credit", "resy"],
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
        creditPostHints: ["uber one credit", "uber one"],
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
        creditPostHints: ["digital entertainment credit", "digital entertainment"],
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
        creditPostHints: ["lululemon credit", "lululemon"],
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
        creditPostHints: ["oura ring credit", "ouraring credit"],
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
        creditPostHints: ["airline fee credit", "amex airline fee"],
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
        creditPostHints: ["equinox credit", "equinox"],
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
        // Specific forms only — a bare "walmart" inflow is more likely a refund.
        creditPostHints: ["walmart plus credit", "walmart+ credit"],
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
        // "clear" alone is too generic for an inflow — require the credit phrasing.
        creditPostHints: ["clear plus credit", "clear credit", "clearme"],
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
        creditPostHints: ["saks fifth avenue credit", "saks credit"],
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
    cashValueCents: 1.0,
    transferValueCents: 2.0,
    pointValueNote:
      "TPG values Bilt at ~2.2¢; ~2.0¢ realistic via Hyatt/airline transfers. Cash floor is ~1.0¢ (Bilt Cash) — best used via 1:1 transfer partners.",
    matchHints: ["bilt"],
    earnRates: [
      { category: "Dining or grocery (your choice)", multiplier: 3, note: "Pick one as your 3x category; grocery capped $25k/yr" },
      { category: "Travel", multiplier: 2 },
      { category: "Rent / mortgage (no fee)", multiplier: 1, note: "Up to 1.25x, scaled by your Everyday Spend Ratio" },
      { category: "Everything else", multiplier: 1 },
    ],
    baseEarn: 1,
    earnModel: [
      // 3x is dining OR grocery (your pick) — assume dining, the common choice,
      // so groceries fall to 1x. Rent earns ~1x (the base), no surcharge.
      { label: "Groceries (no bonus)", multiplier: 1, detailed: ["FOOD_AND_DRINK_GROCERIES"] },
      { label: "Dining", multiplier: 3, primary: ["FOOD_AND_DRINK"] },
      { label: "Travel", multiplier: 2, primary: ["TRAVEL"] },
    ],
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
    downgradeTo: { displayName: "Bilt Blue", annualFee: 0 },
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
    cashValueCents: 1.5,
    transferValueCents: 1.7,
    pointValueNote:
      "TPG values Hyatt at ~1.7¢; aspirational redemptions hit 2–2.5¢+. Hyatt points can't be cashed out — value is realized on free nights, so the 'floor' here is a conservative ~1.5¢ redemption.",
    matchHints: ["hyatt", "world of hyatt", "woh"],
    earnRates: [
      { category: "Hyatt hotels", multiplier: 4, note: "Plus base earning → ~9x effective" },
      { category: "Dining", multiplier: 2 },
      { category: "Airfare (direct)", multiplier: 2 },
      { category: "Transit / gyms", multiplier: 2 },
      { category: "Everything else", multiplier: 1 },
    ],
    baseEarn: 1,
    earnModel: [
      { label: "Hyatt hotels", multiplier: 4, merchantHints: ["hyatt"] },
      { label: "Groceries (no bonus)", multiplier: 1, detailed: ["FOOD_AND_DRINK_GROCERIES"] },
      { label: "Dining", multiplier: 2, primary: ["FOOD_AND_DRINK"] },
      { label: "Airfare", multiplier: 2, detailed: ["TRAVEL_FLIGHTS"] },
      { label: "Transit & gyms", multiplier: 2, detailed: ["TRANSPORTATION_PUBLIC_TRANSIT"], merchantHints: ["gym", "fitness", "equinox"] },
    ],
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
    cashValueCents: 1.0,
    transferValueCents: 2.0,
    pointValueNote:
      "1¢ each as cash back, but ~2¢+ when pooled into your Sapphire Reserve and transferred to partners.",
    matchHints: ["freedom unlimited", "freedom unltd", "cfu"],
    earnRates: [
      { category: "Chase Travel portal", multiplier: 5 },
      { category: "Dining", multiplier: 3 },
      { category: "Drugstores", multiplier: 3 },
      { category: "Everything else", multiplier: 1.5 },
    ],
    baseEarn: 1.5,
    earnModel: [
      { label: "Chase Travel portal", multiplier: 5, merchantHints: ["chase travel", "chasetravel"] },
      { label: "Groceries (base)", multiplier: 1.5, detailed: ["FOOD_AND_DRINK_GROCERIES"] },
      { label: "Dining", multiplier: 3, primary: ["FOOD_AND_DRINK"] },
      { label: "Drugstores", multiplier: 3, merchantHints: ["walgreens", "cvs", "rite aid", "pharmacy", "duane reade"] },
    ],
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
    cashValueCents: 1.0,
    transferValueCents: 2.0,
    pointValueNote:
      "1¢ each as cash back, ~2¢+ when pooled into your Sapphire Reserve and transferred.",
    matchHints: ["freedom flex", "cff"],
    earnRates: [
      { category: "Rotating 5% categories (activate quarterly)", multiplier: 5, note: "Up to $1,500/quarter" },
      { category: "Chase Travel portal", multiplier: 5 },
      { category: "Dining", multiplier: 3 },
      { category: "Drugstores", multiplier: 3 },
      { category: "Everything else", multiplier: 1 },
    ],
    baseEarn: 1,
    // The rotating 5% category ($1,500/qtr, must activate) can't be reliably
    // estimated from transactions — categories change each quarter — so it's
    // left out of the points estimate and called out in the UI instead.
    earnModel: [
      { label: "Chase Travel portal", multiplier: 5, merchantHints: ["chase travel", "chasetravel"] },
      { label: "Groceries (no bonus)", multiplier: 1, detailed: ["FOOD_AND_DRINK_GROCERIES"] },
      { label: "Dining", multiplier: 3, primary: ["FOOD_AND_DRINK"] },
      { label: "Drugstores", multiplier: 3, merchantHints: ["walgreens", "cvs", "rite aid", "pharmacy", "duane reade"] },
    ],
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
    cashValueCents: 1.0,
    transferValueCents: 1.0,
    pointValueNote:
      "Earns cash back as Reward Dollars (statement credits / Amazon checkout), 1¢ each. NOT transferable Membership Rewards — a straight cash-back card with no transfer upside.",
    matchHints: ["blue cash preferred", "blue cash", "bcp"],
    earnRates: [
      { category: "U.S. supermarkets", multiplier: 6, note: "Up to $6,000/yr, then 1%" },
      { category: "Select U.S. streaming", multiplier: 6 },
      { category: "U.S. gas & transit", multiplier: 3 },
      { category: "Everything else", multiplier: 1 },
    ],
    baseEarn: 1,
    earnModel: [
      // 6x U.S. supermarkets capped at $6k/yr (then 1x); restaurants are 1x
      // (NOT supermarkets), so dining stays at base. Select streaming only.
      { label: "U.S. supermarkets", multiplier: 6, detailed: ["FOOD_AND_DRINK_GROCERIES"], annualCap: 6000 },
      { label: "Select streaming", multiplier: 6, detailed: ["ENTERTAINMENT_TV_AND_MOVIES", "ENTERTAINMENT_MUSIC_AND_AUDIO"], merchantHints: ["netflix", "disney", "hulu", "spotify", "youtube", "hbo", "max", "peacock", "paramount", "apple music", "espn", "sirius", "audible", "pandora"] },
      { label: "U.S. gas & transit", multiplier: 3, detailed: ["TRANSPORTATION_GAS", "TRANSPORTATION_PUBLIC_TRANSIT"] },
    ],
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
        creditPostHints: ["disney bundle credit", "disney streaming credit", "disney bundle"],
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
    downgradeTo: { displayName: "Amex Blue Cash Everyday", annualFee: 0 },
    sources: [
      "https://www.americanexpress.com/us/credit-cards/card/blue-cash-preferred/",
      "https://thepointsguy.com/credit-cards/blue-cash-preferred-increases-disney-bundle-credit/",
      "https://wallethub.com/edu/cc/amex-blue-cash-preferred-benefits/146174",
    ],
    accent: "coral",
  },
  {
    cardKey: "amazon-prime-visa",
    displayName: "Amazon Prime Visa",
    issuer: "Chase",
    network: "Visa Signature",
    annualFee: 0,
    authorizedUserFee: 0,
    pointProgram: "Amazon Rewards",
    cashValueCents: 1.0,
    transferValueCents: 1.0,
    pointValueNote:
      "Rewards post as Amazon points worth 1¢ each at Amazon checkout (or as cash back/travel/gift cards at 1¢). Not transferable to airline/hotel partners — a straight cash-back card tied to Amazon.",
    matchHints: ["amazon", "prime visa", "amazon prime", "amzn"],
    earnRates: [
      { category: "Amazon, Amazon Fresh, Whole Foods, Chase Travel", multiplier: 5, note: "Requires an eligible Prime membership" },
      { category: "Restaurants, gas, local transit & commuting", multiplier: 2 },
      { category: "Everything else", multiplier: 1 },
    ],
    baseEarn: 1,
    earnModel: [
      // 5x is Amazon/Whole Foods/Amazon Fresh (with Prime). Match by merchant —
      // other online marketplaces and regular groceries earn only 1x.
      { label: "Amazon & Whole Foods", multiplier: 5, merchantHints: ["amazon", "amzn", "whole foods", "amazon fresh"] },
      { label: "Chase Travel portal", multiplier: 5, merchantHints: ["chase travel", "chasetravel"] },
      { label: "Groceries (no bonus)", multiplier: 1, detailed: ["FOOD_AND_DRINK_GROCERIES"] },
      { label: "Restaurants", multiplier: 2, primary: ["FOOD_AND_DRINK"] },
      { label: "Gas & transit", multiplier: 2, detailed: ["TRANSPORTATION_GAS", "TRANSPORTATION_PUBLIC_TRANSIT", "TRANSPORTATION_TAXIS_AND_RIDE_SHARES"] },
    ],
    credits: [],
    perks: [
      { name: "5% back at Amazon & Whole Foods", value: 0, note: "With Prime — one of the highest everyday rates for Amazon/grocery spend." },
      { name: "No annual fee (card itself)", value: 0, note: "The 5% rate requires an active Amazon Prime membership (~$139/yr), which is the real cost." },
      { name: "No foreign transaction fees", value: 0 },
      { name: "Flexible redemption", value: 0, note: "Redeem points instantly at Amazon checkout, or as cash back, travel, or gift cards at 1¢ each." },
    ],
    protections: [
      "Purchase protection (120 days, $500/claim)",
      "Extended warranty (+1 year on warranties ≤3 years)",
      "Baggage delay + lost luggage coverage",
      "Travel & emergency assistance services",
      "Secondary auto rental CDW",
    ],
    transferPartners: [],
    highlights: [
      "5% back on Amazon.com, Amazon Fresh, and Whole Foods (with Prime) makes this the default card for anyone who shops Amazon heavily.",
      "Points are easiest to use as instant statement-style credit at Amazon checkout — no transfer partners or award charts to manage.",
      "Without an active Prime membership the Amazon rate drops to 3%; the card's value is contingent on Prime you'd pay for anyway.",
    ],
    recentChanges:
      "Stable through 2026: 5% Amazon/Whole Foods/Amazon Fresh/Chase Travel (with Prime), 2% restaurants/gas/transit, 1% base, $0 annual fee, no FX fees. The non-Prime 'Amazon Visa' earns 3% at Amazon instead of 5%.",
    feeNote: "$0 annual fee on the card. The headline 5% Amazon rate requires an eligible Amazon Prime membership (~$139/yr); without Prime the card earns 3% at Amazon.",
    sources: [
      "https://www.chase.com/personal/credit-cards/amazon",
      "https://www.nerdwallet.com/credit-cards/reviews/prime-visa",
      "https://thepointsguy.com/credit-cards/reviews/prime-visa-review/",
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

/** The trailing-12-month posted spend transactions on one account, oldest first
 *  (date-ascending so per-rule spend caps fill from the earliest spend). */
export function cardSpendTxns(state: AppState, accountId: string): Transaction[] {
  const anchor = latestDate(state);
  const cutoff = monthsBefore(anchor, 12);
  const neutralized = refundMatchedIds(state);
  return state.transactions
    .filter(
      (t) =>
        t.accountId === accountId && t.date >= cutoff && isSpend(t, neutralized),
    )
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ── token-boundary matching ──────────────────────────────────────────────────
// Naive substring matching causes false positives ("apple" → "Applebee's",
// "max" → "CarMax", "clear" → "Clearwater"). We tokenize into alphanumeric runs
// and match hints as consecutive whole-token sequences instead.

/** Lowercased alphanumeric tokens of a string. */
export function tokenize(s: string): string[] {
  return s.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

/** True when `hintToks` appears as a consecutive run inside `toks`. */
function tokensContain(toks: string[], hintToks: string[]): boolean {
  if (hintToks.length === 0) return false;
  for (let i = 0; i + hintToks.length <= toks.length; i++) {
    let ok = true;
    for (let j = 0; j < hintToks.length; j++) {
      if (toks[i + j] !== hintToks[j]) {
        ok = false;
        break;
      }
    }
    if (ok) return true;
  }
  return false;
}

/**
 * Length (in joined characters) of the LONGEST hint that matches `tokens` as a
 * whole-token sequence, else 0. Used both as a yes/no match (>0) and to pick the
 * most-specific credit when several could claim one transaction.
 */
export function bestHintMatchLen(tokens: string[], hints: string[]): number {
  let best = 0;
  for (const h of hints) {
    const ht = tokenize(h);
    if (tokensContain(tokens, ht)) {
      const len = ht.join("").length;
      if (len > best) best = len;
    }
  }
  return best;
}

/** True when a transaction matches an earn rule (detailed PFC, merchant, or primary). */
function ruleMatches(rule: EarnRule, t: Transaction): boolean {
  if (rule.detailed && t.categoryDetailed && rule.detailed.includes(t.categoryDetailed))
    return true;
  if (rule.merchantHints) {
    const hay = `${t.merchantName ?? ""} ${t.name}`.toLowerCase();
    if (rule.merchantHints.some((h) => hay.includes(h))) return true;
  }
  if (rule.primary && rule.primary.includes(effectiveCategory(t))) return true;
  return false;
}

/** A single line of the per-card points breakdown. */
export interface PointsLine {
  label: string;
  spend: number;
  points: number;
  multiplier: number;
  /** True when some of this rule's spend hit its annual cap and dropped to base. */
  capped: boolean;
}

export interface PointEstimate {
  points: number;
  /** Spend → points by earn rule (plus a base bucket), biggest contributor first. */
  lines: PointsLine[];
  /** Conservative cash value of the points, in dollars. */
  cashValue: number;
  /** Aspirational transfer value of the points, in dollars. */
  transferValue: number;
}

const BASE_LABEL = "Everything else";

/**
 * Estimate points from real transactions using the card's ordered earn model.
 * For each txn the first matching rule wins; unmatched spend earns `baseEarn`.
 * Per-rule `annualCap`s are honored (spend beyond the cap drops to base), and
 * the result carries a labeled breakdown so the UI can show exactly where the
 * points come from. Far more accurate than a primary-category multiplier map:
 * it separates groceries from dining, Amazon from other shopping, flights from
 * direct-booked hotels, and respects the BCP $6k supermarket cap.
 */
export function estimatePointsDetailed(
  card: CardCatalogEntry,
  txns: Transaction[],
): PointEstimate {
  const lines = new Map<string, PointsLine>();
  const ruleSpend = new Map<string, number>(); // accumulated matched spend, for caps

  const add = (label: string, spend: number, points: number, mult: number, capped: boolean) => {
    const line = lines.get(label) ?? { label, spend: 0, points: 0, multiplier: mult, capped: false };
    line.spend += spend;
    line.points += points;
    line.capped = line.capped || capped;
    lines.set(label, line);
  };

  for (const t of txns) {
    const amt = t.amount;
    if (amt <= 0) continue;
    const rule = card.earnModel.find((r) => ruleMatches(r, t));
    if (!rule) {
      add(BASE_LABEL, amt, amt * card.baseEarn, card.baseEarn, false);
      continue;
    }
    if (rule.annualCap != null) {
      const used = ruleSpend.get(rule.label) ?? 0;
      const remaining = Math.max(0, rule.annualCap - used);
      const atBonus = Math.min(amt, remaining);
      const atBase = amt - atBonus;
      ruleSpend.set(rule.label, used + amt);
      if (atBonus > 0) add(rule.label, atBonus, atBonus * rule.multiplier, rule.multiplier, atBase > 0);
      if (atBase > 0) add(BASE_LABEL, atBase, atBase * card.baseEarn, card.baseEarn, false);
    } else {
      add(rule.label, amt, amt * rule.multiplier, rule.multiplier, false);
    }
  }

  const points = Math.round([...lines.values()].reduce((a, l) => a + l.points, 0));
  return {
    points,
    lines: [...lines.values()].sort((a, b) => b.points - a.points),
    cashValue: (points * card.cashValueCents) / 100,
    transferValue: (points * card.transferValueCents) / 100,
  };
}

// ── Worth-it ROI model ───────────────────────────────────────────────────────
//
// One coherent answer to "is this card worth keeping?" Net value combines the
// three things that are either facts or grounded in real spend:
//   net value = captured statement credits + points (cash value) − annual fee
// Perks are deliberately EXCLUDED (they're upside, hard to value, and easy to
// over-count) — surfaced separately, never in the keep/drop number. The
// aspirational figure swaps in transfer-partner point value as the ceiling.

export type CardVerdict = "free" | "pays" | "earns" | "reconsider";

export interface CardRoi {
  annualFee: number;
  capturedCredits: number;
  maxCredits: number;
  /** captured / max (1 when the card has no statement credits). */
  capturePct: number;
  estPoints: number;
  pointsCashValue: number;
  pointsTransferValue: number;
  /** Headline: credits + cash-value points − fee. */
  netValue: number;
  /** Ceiling: credits + transfer-value points − fee. */
  netValueAspirational: number;
  /** (credits + cash points) / fee — ≥1 means it funds itself. */
  worthItScore: number;
  verdict: CardVerdict;
  hasLiveSpend: boolean;
}

/**
 * Compute the worth-it ROI for a card. `capturedCredits` and `estPoints` are
 * passed in because they depend on user overrides + live spend computed
 * upstream; this keeps the function pure and usable on both server and client.
 */
export function computeCardRoi(
  card: CardCatalogEntry,
  opts: { capturedCredits: number; estPoints: number; hasLiveSpend: boolean },
): CardRoi {
  const maxCredits = maxCreditsValue(card);
  const pointsCashValue = (opts.estPoints * card.cashValueCents) / 100;
  const pointsTransferValue = (opts.estPoints * card.transferValueCents) / 100;
  const netValue = opts.capturedCredits + pointsCashValue - card.annualFee;
  const netValueAspirational =
    opts.capturedCredits + pointsTransferValue - card.annualFee;

  let verdict: CardVerdict;
  if (card.annualFee === 0) verdict = "free";
  else if (netValue >= 0) verdict = "pays";
  else if (netValueAspirational >= 0) verdict = "earns";
  else verdict = "reconsider";

  return {
    annualFee: card.annualFee,
    capturedCredits: opts.capturedCredits,
    maxCredits,
    capturePct: maxCredits > 0 ? opts.capturedCredits / maxCredits : 1,
    estPoints: opts.estPoints,
    pointsCashValue,
    pointsTransferValue,
    netValue,
    netValueAspirational,
    worthItScore:
      (opts.capturedCredits + pointsCashValue) / Math.max(card.annualFee, 1),
    verdict,
    hasLiveSpend: opts.hasLiveSpend,
  };
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

// ── Automatic credit-usage detection ────────────────────────────────────────
//
// Instead of asking the user to tick off which statement credits they've used,
// we infer it from their real transactions. Each credit's `detectHints` are
// matched against the merchant/name/category of spend on the card's *linked*
// account, scoped to the credit's current reset window. This re-derives on every
// data sync, so the checklist always reflects reality with zero manual upkeep.

export interface CreditUsage {
  creditName: string;
  /** False when the credit carries no detectHints and no creditPostHints. */
  detectable: boolean;
  frequency: CreditFrequency;
  /** Per-slot dollar value. */
  perSlotValue: number;
  /** One slot per reset period of the current calendar year, in order. */
  slots: CreditSlot[];
  /** The slot whose window contains today, or null. */
  currentSlot: CreditSlot | null;
  /** Σ captured (detection-only) over slots whose window has started. */
  capturedYtd: number;
  /** Σ value over slots whose window has started. */
  availableToDate: number;

  // ── back-compat fields consumed by existing UI code ──
  /** currentSlot?.used ?? false */
  usedThisPeriod: boolean;
  /** currentSlot?.label ?? year */
  periodLabel: string;
  /** = capturedYtd (existing callers read `captured`). */
  captured: number;
  /** currentSlot?.captured ?? 0 */
  periodSpend: number;
  /** Matching transactions across all slots. */
  count12mo: number;
  lastDate: string | null;
  matchedMerchant: string | null;
}

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];


export type SlotStatus = "past" | "current" | "future";
export type SlotConfidence =
  | "confirmed"
  | "inferred"
  | "flagged"
  | "open"
  | "future";

export interface CreditSlot {
  /** Stable id: "2026-06" | "2026-Q2" | "2026-H1" | "2026" | "every4" | "ever". */
  key: string;
  /** Short display label: "Jun" | "Q2" | "H1" | "2026" | "4 yrs" | "ever". */
  label: string;
  start: string; // yyyy-mm-dd inclusive
  end: string; // yyyy-mm-dd inclusive
  /** Per-slot dollar value (annual value split across the period count). */
  value: number;
  status: SlotStatus;
  /** confirmed || inferred. flagged/open/future are NOT used. */
  used: boolean;
  confidence: SlotConfidence;
  /** Dollars captured in this slot, capped at `value`. */
  captured: number;
  /** Whole days from today to `end`, current slot only (else null). */
  daysLeft: number | null;
  lastDate: string | null;
  matchedMerchant: string | null;
  /** Why it's marked, e.g. "confirmed · statement credit". */
  evidence: string | null;
}

/** Last calendar day of `month1` (1–12) in `year`, as a number. */
function lastDayOfMonth(year: number, month1: number): number {
  return new Date(Date.UTC(year, month1, 0)).getUTCDate();
}

/** Build a zeroed slot (no detection applied yet). */
function blankSlot(
  key: string,
  label: string,
  start: string,
  end: string,
  value: number,
  todayISO: string,
  hasDeadline: boolean,
): CreditSlot {
  const status: SlotStatus =
    todayISO < start ? "future" : todayISO > end ? "past" : "current";
  return {
    key,
    label,
    start,
    end,
    value,
    status,
    used: false,
    confidence: status === "future" ? "future" : "open",
    captured: 0,
    daysLeft:
      status === "current" && hasDeadline ? daysBetween(todayISO, end) : null,
    lastDate: null,
    matchedMerchant: null,
    evidence: null,
  };
}

/**
 * Enumerate the reset slots for one credit across the CURRENT calendar year,
 * anchored to `todayISO`. Detection fields are zeroed; `detectCreditUsage`
 * fills them in. monthly→12, quarterly→4, semiannual→2, annual/one-time/
 * every-4-years→1.
 */
export function creditSlots(
  freq: CreditFrequency,
  value: number,
  todayISO: string,
): CreditSlot[] {
  const year = Number(todayISO.slice(0, 4));
  const y = String(year);
  const pad = (n: number) => String(n).padStart(2, "0");

  switch (freq) {
    case "monthly":
      return Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        return blankSlot(
          `${y}-${pad(m)}`,
          MONTH_ABBR[i],
          `${y}-${pad(m)}-01`,
          `${y}-${pad(m)}-${pad(lastDayOfMonth(year, m))}`,
          value / 12,
          todayISO,
          true,
        );
      });
    case "quarterly":
      return Array.from({ length: 4 }, (_, q) => {
        const sm = q * 3 + 1;
        const em = q * 3 + 3;
        return blankSlot(
          `${y}-Q${q + 1}`,
          `Q${q + 1}`,
          `${y}-${pad(sm)}-01`,
          `${y}-${pad(em)}-${pad(lastDayOfMonth(year, em))}`,
          value / 4,
          todayISO,
          true,
        );
      });
    case "semiannual":
      return [
        blankSlot(`${y}-H1`, "H1", `${y}-01-01`, `${y}-06-30`, value / 2, todayISO, true),
        blankSlot(`${y}-H2`, "H2", `${y}-07-01`, `${y}-12-31`, value / 2, todayISO, true),
      ];
    case "every-4-years":
      return [
        blankSlot("every4", "4 yrs", monthsBefore(todayISO, 48), todayISO, value, todayISO, false),
      ];
    case "one-time":
      return [blankSlot("ever", "ever", "0000-01-01", "9999-12-31", value, todayISO, false)];
    case "annual":
    default:
      return [blankSlot(y, y, `${y}-01-01`, `${y}-12-31`, value, todayISO, true)];
  }
}

/**
 * Detect, per credit on a card, which reset slots have been tapped — using a
 * layered, evidence-based model:
 *   1. statement-credit POSTING (inflow) matched by creditPostHints → confirmed
 *   2. qualifying SPEND (outflow) matched by detectHints:
 *        - autoApplies credit  → inferred (counts)
 *        - enrollmentRequired  → flagged (does NOT count until confirmed)
 * Matching is token-boundary (no substring false positives) and each transaction
 * is attributed to at most ONE credit per card (longest matched hint wins), so an
 * Uber ride never ticks Uber One. Anchored to real today; pure. A posting wins
 * within a slot (no double-count of the charge and its credit).
 */
export function detectCreditUsage(
  state: AppState,
  accountId: string,
  card: CardCatalogEntry,
  todayISO: string = new Date().toISOString().slice(0, 10),
): CreditUsage[] {
  const neutralized = refundMatchedIds(state);
  const live = state.transactions.filter(
    (t) => t.accountId === accountId && !t.hidden && !t.pending && !neutralized.has(t.id),
  );
  const hay = (t: Transaction) =>
    tokenize(`${t.merchantName ?? ""} ${t.name} ${t.categoryPrimary} ${t.categoryDetailed ?? ""}`);

  // Pre-tokenize and split into spend (outflow) and posting (inflow) pools.
  const spendPool = live
    .filter((t) => isSpend(t, neutralized))
    .map((t) => ({ t, toks: hay(t) }));
  const postPool = live
    .filter((t) => t.amount < 0)
    .map((t) => ({ t, toks: hay(t) }));

  // Single attribution: for a transaction, the index of the credit whose hint
  // matched longest, or -1. `pick` is the per-credit hint accessor.
  const attribute = (
    toks: string[],
    pick: (c: CardCredit) => string[] | undefined,
  ): number => {
    let bestIdx = -1;
    let bestLen = 0;
    card.credits.forEach((c, i) => {
      const len = bestHintMatchLen(toks, pick(c) ?? []);
      if (len > bestLen) {
        bestLen = len;
        bestIdx = i;
      }
    });
    return bestIdx;
  };

  // Build slots per credit, then fold transactions in.
  const perCredit = card.credits.map((credit) => ({
    credit,
    slots: creditSlots(credit.frequency, credit.value, todayISO),
    count: 0,
    lastDate: null as string | null,
    matchedMerchant: null as string | null,
    hasPostingInSlot: new Set<string>(),
  }));

  const slotFor = (slots: CreditSlot[], date: string): CreditSlot | undefined =>
    slots.find((s) => date >= s.start && date <= s.end);

  // Pass 1 — postings (authoritative). amount is negative; magnitude = -amount.
  for (const { t, toks } of postPool) {
    const idx = attribute(toks, (c) => c.creditPostHints);
    if (idx < 0) continue;
    const pc = perCredit[idx];
    const slot = slotFor(pc.slots, t.date);
    if (!slot) continue;
    const mag = -t.amount;
    slot.confidence = "confirmed";
    slot.used = true;
    slot.captured = Math.min(slot.value, slot.captured + mag);
    slot.evidence = "confirmed · statement credit";
    pc.hasPostingInSlot.add(slot.key);
    pc.count++;
    if (!pc.lastDate || t.date > pc.lastDate) {
      pc.lastDate = t.date;
      pc.matchedMerchant = t.merchantName ?? t.name;
    }
    if (!slot.lastDate || t.date > slot.lastDate) {
      slot.lastDate = t.date;
      slot.matchedMerchant = t.merchantName ?? t.name;
    }
  }

  // Pass 2 — spend (inferred / flagged), skipping slots already confirmed.
  for (const { t, toks } of spendPool) {
    const idx = attribute(toks, (c) => c.detectHints);
    if (idx < 0) continue;
    const pc = perCredit[idx];
    const slot = slotFor(pc.slots, t.date);
    if (!slot || pc.hasPostingInSlot.has(slot.key)) continue;
    pc.count++;
    if (!pc.lastDate || t.date > pc.lastDate) {
      pc.lastDate = t.date;
      pc.matchedMerchant = t.merchantName ?? t.name;
    }
    const merch = t.merchantName ?? t.name;
    if (pc.credit.autoApplies) {
      slot.confidence = "inferred";
      slot.used = true;
      slot.captured = Math.min(slot.value, slot.captured + t.amount);
      slot.evidence = `inferred · ${merch}`;
      if (!slot.lastDate || t.date > slot.lastDate) {
        slot.lastDate = t.date;
        slot.matchedMerchant = merch;
      }
    } else {
      // enrollment-required, spend only → flag, do NOT mark used/captured.
      if (slot.confidence === "open") slot.confidence = "flagged";
      slot.evidence = `you spent at ${merch} — did the credit post?`;
      if (!slot.lastDate || t.date > slot.lastDate) {
        slot.lastDate = t.date;
        slot.matchedMerchant = merch;
      }
    }
  }

  return perCredit.map(({ credit, slots, count, lastDate, matchedMerchant }) => {
    const detectable =
      (credit.detectHints?.length ?? 0) > 0 || (credit.creditPostHints?.length ?? 0) > 0;
    const started = slots.filter((s) => s.status !== "future");
    const capturedYtd = started.reduce((a, s) => a + s.captured, 0);
    const availableToDate = started.reduce((a, s) => a + s.value, 0);
    const currentSlot = slots.find((s) => s.status === "current") ?? null;
    return {
      creditName: credit.name,
      detectable,
      frequency: credit.frequency,
      perSlotValue: slots[0]?.value ?? credit.value,
      slots,
      currentSlot,
      capturedYtd,
      availableToDate,
      usedThisPeriod: currentSlot?.used ?? false,
      periodLabel: currentSlot?.label ?? todayISO.slice(0, 4),
      captured: capturedYtd,
      periodSpend: currentSlot?.captured ?? 0,
      count12mo: count,
      lastDate,
      matchedMerchant,
    };
  });
}

// ── Renewal countdown ────────────────────────────────────────────────────────
//
// The annual fee posts once a cardmember year on the card's anniversary. We
// auto-detect that date from the most recent annual-fee charge on the linked
// account — matched by a fee phrase and confirmed by the fee amount (current or
// legacy) — then project the next anniversary forward from today. This is the
// moment to decide: keep paying, or product-change/downgrade to a no-fee card.

export interface RenewalInfo {
  /** False when annualFee === 0, account not linked, or no fee charge found. */
  detected: boolean;
  /** Date of the most recent matched fee charge (yyyy-mm-dd), or null. */
  lastChargeDate: string | null;
  /** Next renewal: the charge's month/day rolled forward to the next date ≥ today. */
  nextRenewal: string | null;
  /** Whole days from today until nextRenewal (≥ 0 when detected), or null. */
  daysUntil: number | null;
  /** The matched charge amount — lets the UI show the real (possibly legacy) fee. */
  feeAmount: number | null;
  /**
   * Card expiry as "MM/YY", inferred from the annual-fee cadence: the fee posts
   * on the account anniversary, so the card's current term runs out then. Month
   * comes from the fee charge, year from the next renewal. Null when undetected.
   */
  expiry: string | null;
}

const DEFAULT_FEE_HINTS = ["annual membership fee", "annual fee", "membership fee"];

/** Whole days between two yyyy-mm-dd dates, computed in UTC to avoid DST drift. */
function daysBetween(fromISO: string, toISO: string): number {
  const ms = (s: string) =>
    Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
  return Math.round((ms(toISO) - ms(fromISO)) / 86_400_000);
}

/** The charge's month/day in the earliest year that is ≥ today (yyyy-mm-dd). */
function nextAnniversary(chargeDate: string, todayISO: string): string {
  const monthDay = chargeDate.slice(5); // "mm-dd"
  const todayYear = Number(todayISO.slice(0, 4));
  for (let y = todayYear; ; y++) {
    const candidate = `${y}-${monthDay}`;
    if (candidate >= todayISO) return candidate; // fixed-width → lexical = chrono
  }
}

/**
 * Detect a card's renewal date + countdown from real transactions. Scans the
 * linked account for annual-fee charges (fee-phrase match, preferring those whose
 * amount confirms the current or legacy fee), takes the most recent, and projects
 * its anniversary forward to the next occurrence ≥ today. Pure: derived from the
 * synced transactions, so it recomputes on every sync. `todayISO` is injectable
 * for testing; it defaults to the real current date.
 */
export function detectRenewal(
  state: AppState,
  accountId: string,
  card: CardCatalogEntry,
  todayISO: string = new Date().toISOString().slice(0, 10),
): RenewalInfo {
  const empty: RenewalInfo = {
    detected: false,
    lastChargeDate: null,
    nextRenewal: null,
    daysUntil: null,
    feeAmount: null,
    expiry: null,
  };
  if (card.annualFee === 0) return empty;

  const hints = (card.feeChargeHints ?? DEFAULT_FEE_HINTS).map((h) =>
    h.toLowerCase(),
  );
  const fees = [card.annualFee, card.legacyAnnualFee].filter(
    (a): a is number => typeof a === "number" && a > 0,
  );
  const amountConfirms = (amt: number) =>
    fees.some((fee) => Math.abs(amt - fee) <= 1);

  // Fee-phrase-matched outflows on this account (a fee is always a positive charge).
  const phraseMatches = state.transactions.filter((t) => {
    if (t.accountId !== accountId) return false;
    if (t.hidden || t.pending || t.amount <= 0) return false;
    const hay = `${t.merchantName ?? ""} ${t.name}`.toLowerCase();
    return hints.some((h) => hay.includes(h));
  });
  if (phraseMatches.length === 0) return empty;

  // Prefer amount-confirmed charges; otherwise fall back to all phrase matches.
  const confirmed = phraseMatches.filter((t) => amountConfirms(t.amount));
  const pool = confirmed.length > 0 ? confirmed : phraseMatches;
  const chosen = pool.reduce((a, b) => (b.date > a.date ? b : a));

  const nextRenewal = nextAnniversary(chosen.date, todayISO);
  // Expiry MM/YY: month from the fee charge (the anniversary), year from the
  // upcoming renewal — the term the current card is paid through.
  const expiry = `${chosen.date.slice(5, 7)}/${nextRenewal.slice(2, 4)}`;
  return {
    detected: true,
    lastChargeDate: chosen.date,
    nextRenewal,
    daysUntil: daysBetween(todayISO, nextRenewal),
    feeAmount: chosen.amount,
    expiry,
  };
}
