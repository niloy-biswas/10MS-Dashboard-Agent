-- ============================================================
-- 10MS Analytics Assistant — Supabase Schema & Seed Data
-- Run this in the Supabase SQL Editor
-- ============================================================

-- PROFILES TABLE
create table if not exists profiles (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text unique not null,
  role        text not null default 'Analyst',
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- DASHBOARDS TABLE
create table if not exists dashboards (
  id                uuid primary key default gen_random_uuid(),
  dashboard_id      text not null,          -- user-facing ID e.g. "12"
  dashboard_name    text not null,
  vertical          text,                    -- e.g. "Academics", "Growth"
  purpose           text,
  link              text,                    -- URL to the actual Metabase/Looker dashboard
  refresh_window    text,                    -- e.g. "Daily", "Real-time", "Weekly"
  description       text,
  available_metrics text[],
  available_filters text[],
  is_active         boolean not null default true,
  created_at        timestamptz not null default now()
);

-- Enable Row Level Security (RLS) — allow anon reads
alter table dashboards enable row level security;
alter table profiles    enable row level security;

create policy "Public read dashboards" on dashboards for select using (true);
create policy "Public read profiles"   on profiles    for select using (true);

-- ============================================================
-- SEED: Profiles
-- ============================================================
insert into profiles (name, email, role) values
  ('Niloy Biswas',   'niloy@10minuteschool.com',   'Data Lead'),
  ('Farhan Ahmed',   'farhanur@10minuteschool.com',   'Senior Analyst')
on conflict (email) do nothing;

-- ============================================================
-- SEED: Dashboards
-- ============================================================
insert into dashboards
  (dashboard_id, dashboard_name, vertical, purpose, link, refresh_window, description, available_metrics, available_filters)
values
  ('G5', 'Academics Course Performance', 'Product & Content', null, 'https://lookerstudio.google.com/u/0/reporting/9b99d8ed-744a-4da4-b3de-145854258e9e', 'Daily', null, ARRAY[]::text[], ARRAY[]::text[]),
  ('G13', 'User Details', 'Product & Content', null, 'https://lookerstudio.google.com/u/0/reporting/1bf3936b-9e3e-4cc2-89eb-84e4bd972a8b', 'Daily', null, ARRAY[]::text[], ARRAY[]::text[]),
  ('G15', 'Sales Performance', 'Sales & Marketing', 'Companys overall sales performance', 'https://lookerstudio.google.com/u/0/reporting/ac314c4f-1003-4fb5-b2cd-b29a10f2d935', 'Daily', null, ARRAY[]::text[], ARRAY[]::text[]),
  ('G33', 'Transaction Details', 'Product', null, 'https://lookerstudio.google.com/u/0/reporting/1f411151-62f7-44fd-8296-9cc1d544aef8', 'Daily', null, ARRAY[]::text[], ARRAY[]::text[]),
  ('G35', 'Traffic Performance', 'Product', null, 'https://lookerstudio.google.com/u/0/reporting/ae1ff967-7444-40de-a3e3-c5bef8bf7910', 'Daily', null, ARRAY[]::text[], ARRAY[]::text[]),
  ('G82', 'Inbound & Outbound [Updated Logic]', 'Sales & Marketing', null, 'https://lookerstudio.google.com/u/0/reporting/1c54e89a-5f8c-4693-bad2-e6031553a403', 'Daily', null, ARRAY[]::text[], ARRAY[]::text[]),
  ('G85', 'Promo Creation Dashboard', 'Product', null, 'https://lookerstudio.google.com/u/0/reporting/2252d7ca-535c-450c-ae5d-a678bc070b0b', 'Daily', null, ARRAY[]::text[], ARRAY[]::text[]),
  ('G90', 'Platform Features & TenTen', 'Product', null, 'https://lookerstudio.google.com/u/0/reporting/fb17b950-f26d-4b12-bf11-09f063dec147', 'Daily', null, ARRAY[]::text[], ARRAY[]::text[]),
  ('G92', 'HSC 26', 'Product & Content', null, 'https://lookerstudio.google.com/u/0/reporting/7c72695f-46cc-418d-a2a6-f591baba796d', 'Daily', null, ARRAY[]::text[], ARRAY[]::text[]),
  ('G98', 'Comment Spamming - Analysis', 'Academics', null, 'https://lookerstudio.google.com/u/0/reporting/1a716620-9c6b-452d-b469-8e681fa738e2', 'Daily', null, ARRAY[]::text[], ARRAY[]::text[]),
  ('G99', '10MS English Centre', 'Offline', null, 'https://lookerstudio.google.com/u/0/reporting/3b9c7df5-f8e3-4168-95a5-b23245fdc266', 'Daily', null, ARRAY[]::text[], ARRAY[]::text[]),
  ('G103', 'HSC 27', 'Product & Content', null, 'https://lookerstudio.google.com/u/0/reporting/5b8508f4-6c6a-43a9-9149-4a726f877d5a', 'Daily', null, ARRAY[]::text[], ARRAY[]::text[]),
  ('G106', 'Free Course Summary', 'Academics', null, 'https://lookerstudio.google.com/u/0/reporting/09f4fd0c-ce90-4898-999e-af97c617d3a5', 'Daily', null, ARRAY[]::text[], ARRAY[]::text[]),
  ('G107', 'OB 26 (6-10)', 'Academics', 'Everything about OB26', 'https://lookerstudio.google.com/u/0/reporting/8c870296-188c-45aa-bbd2-d5aa673a7461', 'Daily', null, ARRAY[]::text[], ARRAY[]::text[]);

-- ============================================================
-- CHAT MESSAGES TABLE
-- ============================================================
create table if not exists chat_messages (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references profiles(id) on delete cascade,
  dashboard_id uuid not null references dashboards(id) on delete cascade,
  role         text not null check (role in ('user', 'assistant')),
  content      text not null,
  metadata     jsonb,
  created_at   timestamptz not null default now()
);

alter table chat_messages enable row level security;
create policy "Public read chat messages" on chat_messages for select using (true);
create policy "Public insert chat messages" on chat_messages for insert with check (true);
create policy "Public delete chat messages" on chat_messages for delete using (true);

-- ============================================================
-- DASHBOARD TABLES CATALOG
-- ============================================================
create table if not exists dashboard_tables (
  id           uuid primary key default gen_random_uuid(),
  dashboard_id text not null,
  table_name   text not null,
  row_count    text,
  description  text,
  notes        text,
  created_at   timestamptz not null default now()
);

alter table dashboard_tables enable row level security;
create policy "Public read dashboard tables" on dashboard_tables for select using (true);
create policy "Public insert dashboard tables" on dashboard_tables for insert with check (true);

-- dashboard_tables inserts
insert into dashboard_tables (dashboard_id, table_name, row_count, description, notes) values
  ('G99', 'ab_auth_v1_test.user_locations', '1.73M', 'User location data from legacy auth service (v1).', 'Legacy table — may differ from ab_auth_v2 locations'),
  ('G99', 'ab_booking_service.call_interactions', '1,664', 'Call interaction records for demo class bookings.', null),
  ('G99', 'ab_booking_service.slot_users', '969K', 'Users registered for demo/free class booking slots.', null),
  ('G99', 'ab_catalog_v2.products', '1,132', 'Product master table — all courses, bundles, and offerings.', 'Title is JSON — use `JSON_VALUE(title, ''$.en'')`. Platform: k12/skills/store'),
  ('G106', 'ab_catalog_v2.products', '1,132', 'Product master table — all courses, bundles, and offerings.', 'Title is JSON — use `JSON_VALUE(title, ''$.en'')`. Platform: k12/skills/store'),
  ('G99', 'ab_catalog_v2.products_taxonomies', '1,994', 'Product-to-taxonomy classification mapping (vertical, segment, modality).', null),
  ('G106', 'ab_catalog_v2.products_taxonomies', '1,994', 'Product-to-taxonomy classification mapping (vertical, segment, modality).', null),
  ('G99', 'ab_catalog_v2.taxonomy', '55', 'Taxonomy definitions (vertical, segment, modality values).', null),
  ('G106', 'ab_catalog_v2.taxonomy', '55', 'Taxonomy definitions (vertical, segment, modality values).', null),
  ('G99', 'ab_classroom_os.admin_users', '147', 'Admin users for ClassroomOS (branch staff, managers).', null),
  ('G99', 'ab_classroom_os.admission_forms', '11.2K', 'Offline branch admission form submissions.', null),
  ('G99', 'ab_classroom_os.branches', '7', 'Branch master — Mirpur, Uttara, Panthapath, Moghbazar, Chawkbazar/CTG, Online.', null),
  ('G99', 'ab_classroom_os.leads', '131K', 'Offline branch leads with status, source, and scoring.', '`current_status`: free_class (108K), walk_in (11K), enrolled (8.6K)'),
  ('G99', 'ab_classroom_os.preferred_leads_products', '13.1K', 'Products that leads expressed interest in.', null),
  ('G99', 'ab_crm.bundles', '109', 'Legacy CRM bundle definitions.', null),
  ('G106', 'ab_crm.bundles', '109', 'Legacy CRM bundle definitions.', null),
  ('G99', 'ab_crm.item_categories', '17.6K', 'Legacy CRM item category classifications.', null),
  ('G106', 'ab_crm.item_categories', '17.6K', 'Legacy CRM item category classifications.', null),
  ('G99', 'ab_crm.item_segments', '6.5K', 'Legacy CRM item segment classifications.', null),
  ('G106', 'ab_crm.item_segments', '6.5K', 'Legacy CRM item segment classifications.', null),
  ('G99', 'ab_crm.products', '459', 'Legacy CRM product catalog.', null),
  ('G106', 'ab_crm.products', '459', 'Legacy CRM product catalog.', null),
  ('G99', 'ab_crm.transaction_export_records', '1.04M', 'Legacy CRM transaction export records.', null),
  ('G106', 'ab_crm.transaction_export_records', '1.04M', 'Legacy CRM transaction export records.', null),
  ('G35', 'ab_discovery_service.search_keywords', '2.63M', 'Platform search keyword aggregates — what users search for on the site.', null),
  ('G99', 'ab_ec_lms_db.branches', '5', 'English Centre LMS branch definitions.', null),
  ('G99', 'ab_ec_lms_db.students', '1,435', 'English Centre LMS student records.', null),
  ('G99', 'ab_ihelp_report_db.visitor_ledger', '33.4K', 'Visitor ledger — tracks walk-in visitors at offline branches.', null),
  ('G35', 'ab_order_service.orders', '21.2M', 'Primary orders table — all paid and free orders.', 'Filter `payment_method NOT IN (''free'', '''') AND payment_status = ''paid''` for actual revenue. 15M are free enrollments'),
  ('G99', 'ab_order_service.orders', '21.2M', 'Primary orders table — all paid and free orders.', 'Filter `payment_method NOT IN (''free'', '''') AND payment_status = ''paid''` for actual revenue. 15M are free enrollments'),
  ('G106', 'ab_order_service.orders', '21.2M', 'Primary orders table — all paid and free orders.', 'Filter `payment_method NOT IN (''free'', '''') AND payment_status = ''paid''` for actual revenue. 15M are free enrollments'),
  ('G13', 'academics_reports.Academics_all_users_details_v3', '2.76M', 'Pre-built user-per-program view for K12/academics. Combines enrollment, activity, and engagement metrics.', '`IS_Paid_User` / `IS_Activated` are STRING flags ("Yes"/"No"). `watch_pct` = % of videos watched. `type` = enrollment type (paid/free)'),
  ('G106', 'academics_reports.Academics_all_users_details_v3', '2.76M', 'Pre-built user-per-program view for K12/academics. Combines enrollment, activity, and engagement metrics.', '`IS_Paid_User` / `IS_Activated` are STRING flags ("Yes"/"No"). `watch_pct` = % of videos watched. `type` = enrollment type (paid/free)'),
  ('G35', 'dashboard_reports.DOD_Traffic_Performance_v3', '812', 'Day-on-day aggregate traffic performance (DAU, sessions, page views).', 'Small summary table'),
  ('G35', 'dashboard_reports.Item_wise_dod_traffic_performance_v3', '156K', 'Day-on-day traffic performance broken down by product item.', null),
  ('G92', 'dashboard_reports.K12_Product_Monthly_Target_Channel_Contribution', '0', 'K12 product monthly revenue targets by channel.', 'GSheet-backed — may show 0 rows if drive permissions needed'),
  ('G103', 'dashboard_reports.K12_Product_Monthly_Target_Channel_Contribution', '0', 'K12 product monthly revenue targets by channel.', 'GSheet-backed — may show 0 rows if drive permissions needed'),
  ('G92', 'dashboard_reports.K12_Products_target_achievement', '0', 'K12 product target vs actual achievement tracking.', 'GSheet-backed — may show 0 rows if drive permissions needed'),
  ('G103', 'dashboard_reports.K12_Products_target_achievement', '0', 'K12 product target vs actual achievement tracking.', 'GSheet-backed — may show 0 rows if drive permissions needed'),
  ('G35', 'dashboard_reports.MOM_Traffic_Performance_v3', '27', 'Month-on-month aggregate traffic performance summary.', 'Small summary table'),
  ('G99', 'dashboard_reports.Product_Segment_Sheet', '0', 'Product segment classification reference (Google Sheet-backed).', 'GSheet-backed — may show 0 rows if drive permissions needed'),
  ('G106', 'dashboard_reports.Product_Segment_Sheet', '0', 'Product segment classification reference (Google Sheet-backed).', 'GSheet-backed — may show 0 rows if drive permissions needed'),
  ('G90', 'dashboard_reports.booking_details', '971K', 'Demo/free class booking records with user and slot details.', null),
  ('G99', 'dashboard_reports.booking_details', '971K', 'Demo/free class booking records with user and slot details.', null),
  ('G99', 'dashboard_reports.booking_journey_dropped_off', '113K', 'Users who started but did not complete the booking journey.', null),
  ('G99', 'dashboard_reports.calender_test', '7.77M', 'Calendar/date dimension table used for reporting joins.', 'Large utility table'),
  ('G35', 'dashboard_reports.channel_wise_dod_traffic_performance_v3', '13K', 'Day-on-day traffic performance broken down by acquisition channel.', null),
  ('G35', 'dashboard_reports.channel_wise_mom_traffic_performace_v3', '738', 'Month-on-month traffic performance by acquisition channel.', null),
  ('G35', 'dashboard_reports.channel_wise_page_location_traffic_v3', '17M', 'Page-level traffic data by channel and location.', 'Large table — use date filters'),
  ('G15', 'dashboard_reports.dod_channel_wise_performance_details', '1.18M', 'Day-on-day revenue with channel attribution, UTM, renewal tracking.', 'Always filter `WHERE channel <> ''affv2''`. Use `attribution_channel` for distribution, not `channel`'),
  ('G82', 'dashboard_reports.dod_channel_wise_performance_details', '1.18M', 'Day-on-day revenue with channel attribution, UTM, renewal tracking.', 'Always filter `WHERE channel <> ''affv2''`. Use `attribution_channel` for distribution, not `channel`'),
  ('G92', 'dashboard_reports.dod_channel_wise_performance_details', '1.18M', 'Day-on-day revenue with channel attribution, UTM, renewal tracking.', 'Always filter `WHERE channel <> ''affv2''`. Use `attribution_channel` for distribution, not `channel`'),
  ('G103', 'dashboard_reports.dod_channel_wise_performance_details', '1.18M', 'Day-on-day revenue with channel attribution, UTM, renewal tracking.', 'Always filter `WHERE channel <> ''affv2''`. Use `attribution_channel` for distribution, not `channel`'),
  ('G107', 'dashboard_reports.dod_channel_wise_performance_details', '1.18M', 'Day-on-day revenue with channel attribution, UTM, renewal tracking.', 'Always filter `WHERE channel <> ''affv2''`. Use `attribution_channel` for distribution, not `channel`'),
  ('G99', 'dashboard_reports.ecourier_parcel_details', '133K', 'eCourier parcel delivery tracking (physical product shipments).', null),
  ('G106', 'dashboard_reports.ecourier_parcel_details', '133K', 'eCourier parcel delivery tracking (physical product shipments).', null),
  ('G82', 'dashboard_reports.inbound_v3', '112K', 'Inbound sales lead records with attribution and conversion data.', null),
  ('G35', 'dashboard_reports.item_channel_wise_mom_traffic_performance_v3', '63.5K', 'Month-on-month traffic by product item and channel.', null),
  ('G35', 'dashboard_reports.item_wise_mom_traffic_performance_v3', '6.3K', 'Month-on-month traffic performance by product item.', null),
  ('G82', 'dashboard_reports.message_records_v3', '4.68M', 'SMS/message delivery records for sales outreach campaigns.', null),
  ('G82', 'dashboard_reports.outbound_v3', '128K', 'Outbound sales lead records with agent and conversion data.', null),
  ('G35', 'dashboard_reports.pagespeedinsights_api_data', '209K', 'Google PageSpeed Insights API data for platform pages.', null),
  ('G35', 'dashboard_reports.search_performance_v3', '2.54M', 'Google Search Console performance data (impressions, clicks, CTR, position).', null),
  ('G82', 'dashboard_reports.sms_to_transactions_v3', '382K', 'Maps SMS campaign sends to resulting transactions (conversion tracking).', null),
  ('G35', 'dashboard_reports.transaction_details_b2c_v3', '1.02M', 'B2C transaction details for traffic-to-revenue funnel analysis.', null),
  ('G15', 'dashboard_reports.transaction_products_items_v3', '1.02M', 'Transaction-level data with product dimensions, UTM attribution, renewal tracking.', 'Primary table for online revenue reporting. Partitioned by `Date`'),
  ('G35', 'dashboard_reports.transaction_products_items_v3', '1.02M', 'Transaction-level data with product dimensions, UTM attribution, renewal tracking.', 'Primary table for online revenue reporting. Partitioned by `Date`'),
  ('G35', 'dashboard_reports.vertical_wise_dod_traffic_performance_v3', '4.8K', 'Day-on-day traffic performance by business vertical (K12, Skills, etc.).', null),
  ('G35', 'dashboard_reports.vertical_wise_mom_traffic_performance_v3', '162', 'Month-on-month traffic performance by business vertical.', null),
  ('G99', 'english_centre.business_report_targets_gsheet', '0', 'EC branch revenue and KPI targets (Google Sheet-backed).', 'GSheet-backed — may show 0 rows if drive permissions needed'),
  ('G99', 'english_centre.ec_lms_attendance_details_v3', '9.5K', 'English Centre LMS class attendance records.', null),
  ('G99', 'english_centre.offline_admissions_classroomos_v3', '9.1K', 'Offline EC admissions from ClassroomOS with payment and batch details.', null),
  ('G99', 'english_centre.offline_admissions_gsheet_v3', '19.3K', 'Offline EC admissions from Google Sheet source.', null),
  ('G99', 'english_centre.offline_transactions_gsheet_v3', '29.4K', 'Offline EC transaction records from Google Sheet source.', null),
  ('G99', 'english_centre.payment_histories_offline_v3', '10.1K', 'Offline EC payment history records.', null),
  ('G103', 'HSC27.HSC27_Lead_Scoring_Fixed_Score_While_Converting_v3', '470K', 'HSC27 lead scoring — scores frozen at time of conversion for cohort analysis.', null),
  ('G103', 'HSC27.HSC27_Lead_Scoring_non_Unique_v3', '771K', 'HSC27 lead scoring with non-unique (all-event) scoring records.', null),
  ('G103', 'HSC27.HSC27_Lead_Scoring_Store_v3', '21.1M', 'HSC27 lead scoring event store — raw event-level lead scoring data.', 'Large table — granular event data'),
  ('G103', 'HSC27.HSC27_Lead_Scoring_v3', '470K', 'HSC27 lead scoring — unique leads with current scores.', null),
  ('G103', 'HSC27.HSC27_product_wise_overview_v3', '714', 'HSC27 product-level summary (enrollment, revenue, engagement per product).', null),
  ('G103', 'HSC27.Hsc27_user_details_CLM_Metrics_store_v3', '610K', 'HSC27 user details enriched with CLM lifecycle metrics (activation, engagement, retention).', null),
  ('G103', 'HSC27.Hsc27_user_details_v3', '50K', 'HSC27 user-level details — enrollment, activity, engagement per user.', null),
  ('G107', 'HSC27.Hsc27_user_details_v3', '50K', 'HSC27 user-level details — enrollment, activity, engagement per user.', null),
  ('G99', 'Marketing_Leads.Marketing_Central_Dashboard_Leads_v3', '5.85M', 'Centralized marketing leads from all channels (Facebook, Google, organic, etc.).', null),
  ('G103', 'Marketing_Leads.Marketing_Costing_view_v3', '32.4K', 'Marketing spend data by campaign, channel, and date for ROI analysis.', null),
  ('G99', 'Marketing_Leads.offline_leads_api', '366K', 'Offline branch leads captured via API (walk-ins, referrals).', null),
  ('G107', 'OB26.OB26_Lead_Scoring_Fixed_Score_While_Converting_v3', '1.14M', 'OB26 lead scoring — scores frozen at time of conversion.', null),
  ('G107', 'OB26.OB26_Lead_Scoring_non_Unique_v3', '2.96M', 'OB26 lead scoring with non-unique (all-event) scoring records.', null),
  ('G107', 'OB26.OB26_Lead_Scoring_Store_v3', '21.7M', 'OB26 lead scoring event store — raw event-level data.', 'Large table — granular event data'),
  ('G107', 'OB26.OB26_Lead_Scoring_v3', '1.14M', 'OB26 lead scoring — unique leads with current scores.', null),
  ('G85', 'platform_report.promo_usages_v3', '3.91M', 'Promo code usage records — who used which promo, on what product, when.', null),
  ('G13', 'product_content_health.non_academics_course_wise_user_information_v3', '3.27M', 'Pre-built user-per-course view for non-academic (Skills/courses) vertical. Tracks progress milestones, completion, quiz scores, and NPS signals.', '`progress_d3/d5/d7` = progress at 3, 5, 7 days post-enrollment. `Performance` / `slab` = derived performance bucket. `Refere_Possibility` = NPS-style referral likelihood'),
  ('G90', 'product_content_health.total_enrolments_v3', '23.2M', 'Total enrollment counts per product — aggregated enrollment volume view.', null),
  ('G106', 'product_content_health.total_enrolments_v3', '23.2M', 'Total enrollment counts per product — aggregated enrollment volume view.', null),
  ('G98', 'raw_k12.OB610_Liveclass_comments_BQ', '824K', 'Live class comment data for OB Classes 6-10 — used for spam analysis.', null),
  ('G5', 'raw_k12.afterclass_rating_with_teachers_v3', '4.11M', 'After-class rating responses joined with teacher info.', null),
  ('G5', 'raw_k12.k12_after_liveclass_ratings_responses_V3', '1.69M', 'K12 after-live-class student rating survey responses.', null),
  ('G107', 'raw_k12.liveclass_timely_attendance_v3', '1.33M', 'Live class attendance with timeliness data (on-time vs late joining).', null),
  ('G92', 'raw_product_content.247_Doubts_class_wise_teachers_perf_v3', '3.5K', '24/7 doubt solving performance by teacher and class.', null),
  ('G92', 'raw_product_content.HSC26_Cycle2_Renew_Cohort_Sheet', '0', 'HSC26 Cycle 2 renewal cohort data (Google Sheet-backed).', 'GSheet-backed — may show 0 rows if drive permissions needed'),
  ('G92', 'raw_product_content.HSC26_Cycle2_renewal_cohort_BQ', '56', 'HSC26 Cycle 2 renewal cohort data (BigQuery version).', 'Small cohort dataset'),
  ('G92', 'raw_product_content.HSC26_Demo_class_booking_survey_form_v3', '187K', 'HSC26 demo class booking survey form responses.', null),
  ('G92', 'raw_product_content.HSC26_Demo_class_form_survey_form_v3', '283K', 'HSC26 demo class attendance survey form responses.', null),
  ('G92', 'raw_product_content.HSC26_Lead_Scoring_v3', '398K', 'HSC26 lead scoring — unique leads with current scores.', null),
  ('G92', 'raw_product_content.HSC26_product_wise_overview_v3', '1,061', 'HSC26 product-level summary (enrollment, revenue, engagement per product).', null),
  ('G92', 'raw_product_content.HSC26_user_details_v3', '42.6K', 'HSC26 user-level details — enrollment, activity, engagement per user.', null),
  ('G103', 'raw_product_content.HSC27_Demo_Class_Combined_Report_v3', '267K', 'HSC27 demo class combined report — booking, attendance, and conversion.', null),
  ('G107', 'raw_product_content.OB24_user_details_v3', '17.4K', 'OB24 user-level enrollment and engagement details.', null),
  ('G103', 'raw_product_content.OB25_Lead_Scoring_Fixed_Score_While_Converting_v3', '1.11M', 'OB25 lead scoring — scores frozen at time of conversion.', null),
  ('G107', 'raw_product_content.OB25_Lead_Scoring_Fixed_Score_While_Converting_v3', '1.11M', 'OB25 lead scoring — scores frozen at time of conversion.', null),
  ('G107', 'raw_product_content.OB25_user_details_v3', '17.3K', 'OB25 user-level enrollment and engagement details.', null),
  ('G107', 'raw_product_content.OB26_Demo_Class_Report_v3', '143K', 'OB26 demo class report — booking, attendance, and conversion.', null),
  ('G107', 'raw_product_content.OB26_product_wise_overview_v3', '543', 'OB26 product-level summary (enrollment, revenue, engagement per product).', null),
  ('G107', 'raw_product_content.OB26_user_details_v3', '11.5K', 'OB26 user-level enrollment and engagement details.', null),
  ('G92', 'raw_product_content.all_new_courses_class_wise_teachers_perf_v3', '7.1K', 'Teacher performance per class across all new K12 courses (ratings, attendance, engagement).', null),
  ('G103', 'raw_product_content.all_new_courses_class_wise_teachers_perf_v3', '7.1K', 'Teacher performance per class across all new K12 courses (ratings, attendance, engagement).', null),
  ('G107', 'raw_product_content.all_new_courses_class_wise_teachers_perf_v3', '7.1K', 'Teacher performance per class across all new K12 courses (ratings, attendance, engagement).', null),
  ('G99', 'raw_product_content.auth_users_v3', '19.7M', 'User registration data view — all platform users with auth details.', 'Large table'),
  ('G106', 'raw_product_content.freeclass_overview_V3', '50', 'Free class summary overview — high-level metrics for free courses.', 'Small summary table'),
  ('G99', 'raw_product_content.offline_free_class_cx', '270K', 'Offline free class customer experience/feedback records.', null),
  ('G90', 'raw_product_content.tentenai_locations_v3', '10.1K', 'TenTen AI user location data — where users access the AI doubt solver from.', null),
  ('G90', 'raw_product_content.tentenai_messages_v3', '186K', 'TenTen AI conversation logs — all agent/user messages across modes (academic, exam, liveclass, recorded). Includes per-response cost and evaluation scores. **Primary table for any TenTen analysis.**', null),
  ('G103', 'raw_product_content.tentenai_messages_v3', '186K', 'TenTen AI conversation logs — all agent/user messages across modes (academic, exam, liveclass, recorded). Includes per-response cost and evaluation scores. **Primary table for any TenTen analysis.**', null),
  ('G107', 'raw_product_content.tentenai_messages_v3', '186K', 'TenTen AI conversation logs — all agent/user messages across modes (academic, exam, liveclass, recorded). Includes per-response cost and evaluation scores. **Primary table for any TenTen analysis.**', null),
  ('G90', 'raw_product_content.tentenai_model_usages_v3', '679K', 'TenTen AI LLM model usage — token counts, costs, model versions per request.', null),
  ('G33', 'raw_transaction.transaction_export_all_view_v3', '1.02M', 'Raw transaction export view — all transactions with payment and product details.', null),
  ('G92', 'sm_report.revenue_recognition_model_v3', '448K', 'Revenue recognition model — distributes revenue across recognition periods.', null);