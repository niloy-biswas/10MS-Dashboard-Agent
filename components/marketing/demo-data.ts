/** Deterministic sample data for marketing demos (not a live API). */

export const HERO_DEMO_QUESTION = "Why did course revenue fall last month?";

export const HERO_CONTEXT_STEPS = [
  "Checking the published Revenue dashboard",
  "Applying approved revenue definition",
  "Querying 3 approved tables",
  "Excluding refunded and internal orders",
] as const;

export const HERO_ANSWER = {
  headline: "Revenue decreased 12.4% compared with the previous month.",
  detail:
    "The largest decline came from SSC enrolments after the campaign period ended.",
  metricLabel: "Net revenue",
  metricValue: 1.42,
  metricUnit: "M",
  changePct: -12.4,
  foundLabel: "Average Analyst found something",
  sql: `SELECT
  DATE_TRUNC(order_date, MONTH) AS month,
  SUM(net_amount) AS net_revenue,
  COUNT(DISTINCT enrolment_id) AS enrolments
FROM analytics.orders_fact
WHERE dashboard_scope = 'revenue'
  AND is_refunded = FALSE
  AND is_internal = FALSE
GROUP BY 1
ORDER BY 1`,
  contextTags: [
    "Published · Revenue",
    "Rule · net revenue excludes refunds",
    "Tables · orders_fact, campaigns, enrolments",
  ],
};

export const HERO_CHART_DATA = [
  { week: "W1", revenue: 420, enrolments: 310, previous: 400 },
  { week: "W2", revenue: 455, enrolments: 340, previous: 415 },
  { week: "W3", revenue: 438, enrolments: 320, previous: 430 },
  { week: "W4", revenue: 390, enrolments: 270, previous: 445 },
  { week: "W5", revenue: 352, enrolments: 220, previous: 450 },
  { week: "W6", revenue: 335, enrolments: 205, previous: 440 },
];

export type ShowcaseChartType = "line" | "hbar" | "stacked" | "area";

export type ShowcaseQuestion = {
  id: string;
  question: string;
  summary: string;
  metricLabel: string;
  metricValue: string;
  observation: string;
  contextTags: string[];
  chartType: ShowcaseChartType;
  data: Array<Record<string, string | number>>;
  series: string[];
  textualSummary: string;
};

export const SHOWCASE_QUESTIONS: ShowcaseQuestion[] = [
  {
    id: "revenue-fall",
    question: "Why did revenue fall last month?",
    summary:
      "Net revenue fell 12.4% month over month. SSC drove most of the decline after the campaign ended.",
    metricLabel: "MoM change",
    metricValue: "−12.4%",
    observation: "Campaign end week aligns with the steepest enrolment drop.",
    contextTags: ["Revenue dashboard", "Exclude refunds", "SSC focus"],
    chartType: "line",
    series: ["revenue", "previous"],
    data: [
      { label: "W1", revenue: 420, previous: 400 },
      { label: "W2", revenue: 455, previous: 415 },
      { label: "W3", revenue: 438, previous: 430 },
      { label: "W4", revenue: 390, previous: 445 },
      { label: "W5", revenue: 352, previous: 450 },
      { label: "W6", revenue: 335, previous: 440 },
    ],
    textualSummary:
      "Line chart of weekly net revenue versus the previous period; revenue declines from week 4 after the campaign ends.",
  },
  {
    id: "products-growing",
    question: "Which products are growing fastest?",
    summary: "Skills leads growth at +28% enrolments. English follows at +14%.",
    metricLabel: "Top growth",
    metricValue: "Skills +28%",
    observation: "HSC is flat; SSC contracted slightly after the campaign.",
    contextTags: ["Product mix", "Enrolments", "Published catalogue"],
    chartType: "hbar",
    series: ["growth"],
    data: [
      { label: "Skills", growth: 28 },
      { label: "English", growth: 14 },
      { label: "HSC", growth: 2 },
      { label: "SSC", growth: -6 },
    ],
    textualSummary:
      "Horizontal bar chart of enrolment growth by product: Skills 28%, English 14%, HSC 2%, SSC −6%.",
  },
  {
    id: "channel-enrolment",
    question: "Compare enrolment by acquisition channel.",
    summary:
      "Paid Social and Organic remain the largest channels. Affiliate share increased this quarter.",
    metricLabel: "Top channel",
    metricValue: "Paid Social",
    observation: "Affiliate grew from 12% to 18% of new enrolments.",
    contextTags: ["Acquisition", "Enrolments", "Channel mapping"],
    chartType: "stacked",
    series: ["organic", "paid", "affiliate", "direct"],
    data: [
      { label: "Q1", organic: 40, paid: 35, affiliate: 12, direct: 13 },
      { label: "Q2", organic: 38, paid: 36, affiliate: 14, direct: 12 },
      { label: "Q3", organic: 36, paid: 34, affiliate: 18, direct: 12 },
      { label: "Q4", organic: 35, paid: 33, affiliate: 20, direct: 12 },
    ],
    textualSummary:
      "Stacked bar chart of enrolment share by channel across quarters: Organic, Paid Social, Affiliate, Direct.",
  },
  {
    id: "unusual-activity",
    question: "Which dashboards have unusual activity?",
    summary:
      "Revenue and Offline Centre show elevated question volume this week versus their four-week baseline.",
    metricLabel: "Spike",
    metricValue: "Revenue +64%",
    observation: "Offline Centre questions cluster around weekend sessions.",
    contextTags: ["Usage", "Published only", "Session volume"],
    chartType: "area",
    series: ["questions"],
    data: [
      { label: "Mon", questions: 42 },
      { label: "Tue", questions: 48 },
      { label: "Wed", questions: 51 },
      { label: "Thu", questions: 90 },
      { label: "Fri", questions: 88 },
      { label: "Sat", questions: 70 },
      { label: "Sun", questions: 55 },
    ],
    textualSummary:
      "Area chart of daily questions on the Revenue dashboard; volume rises sharply Thursday and Friday.",
  },
];
