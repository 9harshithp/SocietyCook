import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { query, db } from './src/config/database.js';
import { runMigrations } from './migrations.js';

export async function seedDatabase() {
  console.log('🌱 Seeding SocietyCook v2 with complete realistic production dataset...');
  await runMigrations();

  const hash = await bcrypt.hash('Demo12345!', 12);

  // 1. Societies
  const societies = [
    [1, 'Greenwood Residency', 'Whitefield, Bengaluru (Towers A, B, C · 450 Flats)', 'Bengaluru', 'Karnataka', '560066', 3, 450, 'VERIFIED'],
    [2, 'Prestige Shantiniketan', 'ITPL Main Road, Whitefield, Bengaluru (Towers 1-14 · 3000 Flats)', 'Bengaluru', 'Karnataka', '560048', 14, 3000, 'VERIFIED'],
    [3, 'Sobha Silicon Oasis', 'Hosa Road, Electronic City, Bengaluru (Towers Sapphire, Ruby · 900 Flats)', 'Bengaluru', 'Karnataka', '560100', 5, 900, 'VERIFIED']
  ];

  for (const [id, name, address, city, state, postal, towers, flats, status] of societies) {
    await query(
      `INSERT INTO societies (id, name, address, city, state, postal_code, total_towers, total_flats, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), address=VALUES(address), city=VALUES(city), total_towers=VALUES(total_towers), total_flats=VALUES(total_flats)`,
      [id, name, address, city, state, postal, towers, flats, status]
    );
  }

  // 2. Society Blocks
  const blocks = [
    [1, 1, 'Tower A', 14, 150],
    [2, 1, 'Tower B', 14, 150],
    [3, 1, 'Tower C', 14, 150],
    [4, 2, 'Tower 1', 18, 220],
    [5, 2, 'Tower 2', 18, 220],
    [6, 3, 'Tower Sapphire', 16, 180]
  ];

  for (const [id, socId, bName, floors, tFlats] of blocks) {
    await query(
      `INSERT INTO society_blocks (id, society_id, name, floors, total_flats)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name)`,
      [id, socId, bName, floors, tFlats]
    );
  }

  // 3. Users: matching existing IDs 1-13 + adding up to 25 users
  const users = [
    // Existing base accounts
    [1, 'Rahul Sharma (Demo Resident)', 'resident@example.com', 'RESIDENT', 1, 'A-101', '+91 98450 12345'],
    [2, 'Lakshmi Narayanan', 'cook@example.com', 'COOK', 1, null, '+91 97401 22334'],
    [3, 'Ramesh Kumar', 'ramesh@example.com', 'COOK', 1, null, '+91 98860 33445'],
    [4, 'Greenwood Facility Manager', 'manager@example.com', 'SOCIETY_MANAGER', 1, null, '+91 94480 55667'],
    [5, 'Platform Admin', 'admin@example.com', 'ADMIN', 1, null, '+91 99000 88990'],
    [6, 'Priya Varma', 'priya@example.com', 'RESIDENT', 1, 'A-102', '+91 98451 11223'],
    [7, 'Arjun Nair', 'arjun@example.com', 'RESIDENT', 1, 'A-103', '+91 98452 33445'],
    [8, 'Neha Kapoor', 'neha@example.com', 'RESIDENT', 1, 'A-104', '+91 98453 55667'],
    [9, 'Karthik & Pooja', 'karthik@example.com', 'RESIDENT', 1, 'A-105', '+91 98454 77889'],
    [10, 'Ananya Sen', 'ananya@example.com', 'RESIDENT', 1, 'B-302', '+91 98455 99001'],
    [11, 'Sunita Sharma', 'sunita@example.com', 'COOK', 1, null, '+91 97402 44556'],
    [12, 'Bablu Ghosh', 'bablu@example.com', 'COOK', 1, null, '+91 97403 66778'],
    [13, 'Rekha Ben Patel', 'rekha@example.com', 'COOK', 1, null, '+91 97404 88990'],

    // Additional cooks
    [14, 'Mohammed Imran', 'imran@example.com', 'COOK', 2, null, '+91 97405 11223'],
    [15, 'Anjali Deshmukh', 'anjali@example.com', 'COOK', 2, null, '+91 97406 33445'],
    [16, 'Manju Varma', 'manju@example.com', 'COOK', 3, null, '+91 97407 55667'],

    // Additional residents (total 20+ residents)
    [17, 'Deepak Joshi', 'deepak@example.com', 'RESIDENT', 1, 'B-404', '+91 98456 12345'],
    [18, 'Meera Menon', 'meera@example.com', 'RESIDENT', 1, 'C-501', '+91 98457 23456'],
    [19, 'Rohan Mehta', 'rohan@example.com', 'RESIDENT', 1, 'A-201', '+91 98458 34567'],
    [20, 'Sangeetha Rao', 'sangeetha@example.com', 'RESIDENT', 1, 'A-202', '+91 98459 45678'],
    [21, 'Vikas Khanna', 'vikas@example.com', 'RESIDENT', 2, 'T1-102', '+91 98460 56789'],
    [22, 'Tanvi Kulkarni', 'tanvi@example.com', 'RESIDENT', 2, 'T1-103', '+91 98461 67890'],
    [23, 'Suresh Iyer', 'suresh@example.com', 'RESIDENT', 2, 'T1-104', '+91 98462 78901'],
    [24, 'Nandini Das', 'nandini@example.com', 'RESIDENT', 2, 'T2-501', '+91 98463 89012'],
    [25, 'Amitav Bose', 'amitav@example.com', 'RESIDENT', 2, 'T2-502', '+91 98464 90123'],
    [26, 'Shilpa Shetty', 'shilpa@example.com', 'RESIDENT', 3, 'S-101', '+91 98465 01234'],
    [27, 'Gaurav Agarwal', 'gaurav@example.com', 'RESIDENT', 3, 'S-102', '+91 98466 12345'],
    [28, 'Harini Swaminathan', 'harini@example.com', 'RESIDENT', 3, 'S-103', '+91 98467 23456'],
    [29, 'Pranav Trivedi', 'pranav@example.com', 'RESIDENT', 3, 'R-201', '+91 98468 34567'],
    [30, 'Divya Pillai', 'divya@example.com', 'RESIDENT', 3, 'R-202', '+91 98469 45678']
  ];

  for (const [id, name, email, role, society_id, flat, phone] of users) {
    const refCode = 'SC-' + String(id).padStart(4, '0');
    await query(
      `INSERT INTO users (id, name, email, password_hash, role, society_id, flat, phone, referral_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email), role=VALUES(role), society_id=VALUES(society_id), flat=VALUES(flat), phone=VALUES(phone)`,
      [id, name, email, hash, role, society_id, flat, phone, refCode]
    );

    if (flat) {
      await query(
        `INSERT INTO society_memberships (society_id, user_id, flat_number, status)
         VALUES (?, ?, ?, 'VERIFIED')
         ON DUPLICATE KEY UPDATE flat_number=VALUES(flat_number)`,
        [society_id, id, flat]
      );
    }
  }

  // 4. Cooks Table: 8 Verified Cooks with User IDs and Service Specializations (V3 Expansion)
  const cooks = [
    [
      1, 2, 'South Indian, Vegetarian, Andhra & Tamil',
      'Specialist in traditional homestyle South Indian vegetarian cooking: crisp dosas, soft idlis, authentic sambar, rasam, avial, kootu, and flavorful Andhra curries. 6+ years experience in gated communities.',
      3500, 6, 1, '06:30:00', '21:30:00',
      'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80',
      'Pure Veg, Jain Option, Low Oil, Sattvic', 4.8, 98.0,
      'MULTI_SKILLED', 'COOKING,DISHWASHING', 2000, 5, 'Expert in delicate glassware, non-stick pans and sparkling sink cleaning.'
    ],
    [
      2, 3, 'North Indian, Punjabi & Mughlai Delicacies',
      'Known as the Phulka Master! Specializes in hot rotis, layered parathas, authentic dal makhani, rajma-chawal, shahi paneer, seasonal sabzi, and nutritious daily khichdi. Highly punctual and hygiene-certified.',
      4000, 8, 1, '07:00:00', '22:00:00',
      'https://images.unsplash.com/photo-1583394293214-28ded15ee548?auto=format&fit=crop&w=400&q=80',
      'North Indian, High Protein, Custom Spice, Homestyle', 4.9, 99.2,
      'COOK', 'COOKING', 2200, 4, null
    ],
    [
      3, 11, 'Healthy Fitness Diet, Millets & Salads',
      'Nutritious macro-balanced everyday cooking: multi-millet rotis, quinoa bowls, grilled paneer/tofu, sprout salads, high-protein dals, and light detox meals without refined oil or excess sugar.',
      4500, 5, 1, '06:00:00', '21:00:00',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      'High Protein, Low Calorie, Diabetic Friendly, Vegan', 4.7, 97.5,
      'MULTI_SKILLED', 'COOKING,DISHWASHING', 2100, 6, 'Kitchen hygiene enthusiast. Ensures complete post-cooking sanitization.'
    ],
    [
      4, 12, 'Bengali, Odia & Homestyle Fish Curry',
      'Authentic East Indian cuisine specialist: Macher Jhol, Shorshe Ilish, Aloo Posto, Kosha Mangsho, light moong dal, and fragrant basmati rice dishes. Served over 40+ families in Whitefield.',
      3800, 7, 1, '07:30:00', '21:30:00',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      'Non-Veg, Fish Specialist, East Indian, Homestyle', 4.8, 98.5,
      'COOK', 'COOKING', 2200, 3, null
    ],
    [
      5, 13, 'Gujarati, Kathiawadi & Rajasthani Thali',
      'Expert in soft theplas, sev tameta nu shaak, dal dhokli, kadhi khichdi, khandvi, and pure Jain food prepared with strict hygiene without onion/garlic on request.',
      4200, 9, 1, '07:00:00', '21:00:00',
      'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=400&q=80',
      'Pure Veg, 100% Jain Friendly, Gujarati Thali, Low Spice', 4.9, 99.0,
      'COOK', 'COOKING', 2200, 5, null
    ],
    [
      6, 14, 'Hyderabadi, Awadhi & Biryani Delights',
      'Dum biryani master with 10 years experience in royal Mughlai and everyday Nizami cuisine. Expert in slow-cooked dals, kebabs, kormas and fragrant pulao.',
      4800, 10, 1, '07:00:00', '22:00:00',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      'Non-Veg, Biryani Specialist, Awadhi, Mughlai', 4.9, 98.8,
      'COOK', 'COOKING', 2200, 4, null
    ],
    [
      7, 15, 'Dishwashing & Utensil Care Specialist',
      'Dedicated kitchen hygiene professional: meticulous dishwashing, heavy cookware scrub, pressure cooker degreasing, spotless drying, and counter wipe-downs.',
      2200, 7, 1, '07:00:00', '21:30:00',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      'Utensil Washing, Sink Sanitization, Counter Wipe, Stainless Steel Care', 4.9, 99.5,
      'DISHWASHER', 'DISHWASHING', 2200, 7, 'Specialized in thorough daily utensil cleaning, pressure cooker degreasing, and leaving sinks clean.'
    ],
    [
      8, 16, 'Dishwashing & Kitchen Assistant',
      'Punctual household assistant specializing in fast, quiet and hygienic utensil cleaning for morning breakfast and evening dinner cycles.',
      2100, 6, 1, '06:30:00', '21:00:00',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      'Utensil Washing, Non-stick Safe, Eco Dishwashing, Fast Turnaround', 4.8, 98.2,
      'DISHWASHER', 'DISHWASHING', 2100, 6, 'Eco-friendly dishwashing with gentle handling of delicate ceramics and glassware.'
    ]
  ];

  for (const [id, user_id, cuisine, bio, price, exp, verified, from, to, photo, tags, rating, reliability, pType, sOffered, dwPrice, dwExp, dwBio] of cooks) {
    await query(
      `INSERT INTO cooks (id, user_id, cuisine, bio, price, experience, verified, available_from, available_to, photo_url, dietary_tags, rating_avg, reliability_score, professional_type, services_offered, dishwashing_price, dishwashing_experience, dishwashing_bio)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE cuisine=VALUES(cuisine), bio=VALUES(bio), price=VALUES(price), experience=VALUES(experience), verified=VALUES(verified), photo_url=VALUES(photo_url), dietary_tags=VALUES(dietary_tags), rating_avg=VALUES(rating_avg), reliability_score=VALUES(reliability_score), professional_type=VALUES(professional_type), services_offered=VALUES(services_offered), dishwashing_price=VALUES(dishwashing_price), dishwashing_experience=VALUES(dishwashing_experience), dishwashing_bio=VALUES(dishwashing_bio)`,
      [id, user_id, cuisine, bio, price, exp, verified, from, to, photo, tags, rating, reliability, pType, sOffered, dwPrice, dwExp, dwBio]
    );

    const [u] = await query('SELECT society_id FROM users WHERE id = ?', [user_id]);
    await query(
      `INSERT INTO cook_society_assignments (cook_id, society_id, status)
       VALUES (?, ?, 'APPROVED')
       ON DUPLICATE KEY UPDATE status='APPROVED'`,
      [id, u.society_id]
    );
  }

  // 5. Cook Hiring Groups
  const today = new Date().toISOString().slice(0, 10);
  const nextMonth = new Date(Date.now() + 29 * 86400000).toISOString().slice(0, 10);

  const groups = [
    // Group 1: Tower A Dinner Club in Greenwood Residency (Active with Ramesh - cook_id 2)
    [1, 1, 1, 'Tower A Evening Dinner Club', 'Daily fresh dinner service shared by 5 flats on 1st floor of Tower A. Zero elevator wait.', 'DINNER', 'North Indian, Punjabi', 'VEGETARIAN', '19:00:00', '22:45:00', 4500, 3, 5, 5, 'ACTIVE', 2, 'GRP-TOWER-A', new Date(), 'COOKING', null],
    // Group 2: Prestige ITPL Lunch Box Group (Threshold Reached, Matching)
    [2, 2, 21, 'Prestige Lunch Box & Fit Meals', 'Clean home-cooked lunch for IT professionals working from home.', 'LUNCH', 'Healthy, Millets, High Protein', 'FITNESS', '12:00:00', '14:30:00', 4200, 3, 4, 3, 'THRESHOLD_REACHED', null, 'GRP-PRESTIGE-L', null, 'COOKING', null],
    // Group 3: Sobha Morning Breakfast & Dosa Group (Recruiting)
    [3, 3, 26, 'Sobha Silicon Oasis Pure Veg Club', 'Early morning crisp dosas and fluffy idlis for school and office prep.', 'BREAKFAST', 'South Indian, Tamil Brahmin', 'JAIN', '07:00:00', '09:30:00', 4000, 3, 5, 2, 'RECRUITING', null, 'GRP-SOBHA-B', null, 'COOKING', null],
    // Group 4: Tower A Morning Dishwashing Syndicate (Active with Dishwashing Specialist - cook_id 7)
    [4, 1, 1, 'Tower A Morning Utensil Care Club', 'Dedicated daily utensil washing and sparkling sink sanitization right after breakfast.', 'BREAKFAST', 'Utensil Washing', 'STANDARD', '08:00:00', '10:30:00', 2000, 3, 5, 4, 'ACTIVE', 7, 'GRP-TOWER-A-DISH', new Date(), 'DISHWASHING', null],
    // Group 5: Tower B Complete Kitchen Care Combo (Active with Cook 1 Lakshmi + Dishwasher 8)
    [5, 1, 10, 'Tower B Complete Kitchen Care Combo', 'Coordinated daily dinner cooking plus complete post-dinner utensil washing and kitchen cleanup.', 'DINNER', 'South & North Indian Comfort', 'VEGETARIAN', '19:30:00', '22:30:00', 6000, 3, 4, 3, 'ACTIVE', 1, 'GRP-TOWER-B-COMBO', new Date(), 'COMBO', 8]
  ];

  for (const [id, socId, creatorId, gName, desc, service, cuisines, diet, tStart, tEnd, budget, minH, maxH, currH, status, cookId, code, actAt, sType, dwId] of groups) {
    await query(
      `INSERT INTO cook_groups (id, society_id, created_by_resident_id, name, description, meal_service, preferred_cuisines, dietary_pref, preferred_time_start, preferred_time_end, monthly_budget_max, min_households, max_households, current_households, status, assigned_cook_id, invite_code, activated_at, service_type, assigned_dishwasher_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status=VALUES(status), current_households=VALUES(current_households), assigned_cook_id=VALUES(assigned_cook_id), service_type=VALUES(service_type), assigned_dishwasher_id=VALUES(assigned_dishwasher_id)`,
      [id, socId, creatorId, gName, desc, service, cuisines, diet, tStart, tEnd, budget, minH, maxH, currH, status, cookId, code, actAt, sType, dwId]
    );
  }

  // Group Members for Group 1 (Tower A: 5 Households)
  const group1Members = [
    [1, 1, 6, 'A-102', 2, '19:00:00', 'CONFIRMED'],
    [2, 1, 7, 'A-103', 3, '19:45:00', 'CONFIRMED'],
    [3, 1, 1, 'A-101', 2, '20:30:00', 'CONFIRMED'],
    [4, 1, 8, 'A-104', 2, '21:15:00', 'CONFIRMED'],
    [5, 1, 9, 'A-105', 4, '22:00:00', 'CONFIRMED']
  ];

  for (const [id, gId, resId, flat, hSize, slot, status] of group1Members) {
    await query(
      `INSERT INTO group_members (id, group_id, resident_id, flat_number, household_size, preferred_slot_start, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status=VALUES(status), preferred_slot_start=VALUES(preferred_slot_start)`,
      [id, gId, resId, flat, hSize, slot, status]
    );
  }

  // Group Members for Group 2 (Prestige: 3 Households)
  const group2Members = [
    [6, 2, 21, 'T1-102', 2, '12:00:00', 'JOINED'],
    [7, 2, 22, 'T1-103', 2, '12:45:00', 'JOINED'],
    [8, 2, 23, 'T1-104', 3, '13:30:00', 'JOINED']
  ];

  for (const [id, gId, resId, flat, hSize, slot, status] of group2Members) {
    await query(
      `INSERT INTO group_members (id, group_id, resident_id, flat_number, household_size, preferred_slot_start, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status=VALUES(status)`,
      [id, gId, resId, flat, hSize, slot, status]
    );
  }

  // 6. Schedules & Entries for Group 1
  await query(
    `INSERT INTO schedules (id, group_id, cook_id, society_id, version_number, effective_from, effective_to, status, algorithm_score)
     VALUES (1, 1, 2, 1, 1, ?, ?, 'ACTIVE', 96.5)
     ON DUPLICATE KEY UPDATE status='ACTIVE'`,
    [today, nextMonth]
  );

  const scheduleSlots = [
    [1, 1, 1, 6, 2, 'A-102', 'Tower A', '19:00:00', '19:45:00', 'Dinner'],
    [2, 1, 1, 7, 2, 'A-103', 'Tower A', '19:45:00', '20:30:00', 'Dinner'],
    [3, 1, 1, 1, 2, 'A-101', 'Tower A', '20:30:00', '21:15:00', 'Dinner'],
    [4, 1, 1, 8, 2, 'A-104', 'Tower A', '21:15:00', '22:00:00', 'Dinner'],
    [5, 1, 1, 9, 2, 'A-105', 'Tower A', '22:00:00', '22:45:00', 'Dinner']
  ];

  for (const [id, sId, gId, resId, cId, flat, bName, st, et, meal] of scheduleSlots) {
    await query(
      `INSERT INTO schedule_entries (id, schedule_id, group_id, resident_id, cook_id, flat_number, block_name, start_time, end_time, meal_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE start_time=VALUES(start_time), end_time=VALUES(end_time)`,
      [id, sId, gId, resId, cId, flat, bName, st, et, meal]
    );
  }

  // 7. Bookings, Payments, Subscriptions & Invoices (Cooking, Dishwashing, Combo)
  const bookingsData = [
    [1, 6, 2, today, nextMonth, '19:00:00', '19:45:00', 4000, 'ACTIVE', '07:00 PM', 'Dinner', 1, 1, 'COOKING'],
    [2, 7, 2, today, nextMonth, '19:45:00', '20:30:00', 4000, 'ACTIVE', '07:45 PM', 'Dinner', 1, 1, 'COOKING'],
    [3, 1, 2, today, nextMonth, '20:30:00', '21:15:00', 4000, 'ACTIVE', '08:30 PM', 'Dinner', 1, 1, 'COOKING'],
    [4, 8, 2, today, nextMonth, '21:15:00', '22:00:00', 4000, 'ACTIVE', '09:15 PM', 'Dinner', 1, 1, 'COOKING'],
    [5, 9, 2, today, nextMonth, '22:00:00', '22:45:00', 4000, 'ACTIVE', '10:00 PM', 'Dinner', 1, 1, 'COOKING'],
    // Lakshmi (cook_id 1) serving Ananya in Flat B-302
    [6, 10, 1, today, nextMonth, '12:30:00', '13:15:00', 3500, 'ACTIVE', '12:30 PM', 'Lunch', null, null, 'COOKING'],
    // Dedicated Dishwashing for Rahul (res_id 1) in Flat A-101 with Rekha (cook_id 7)
    [7, 1, 7, today, nextMonth, '08:30:00', '09:00:00', 1800, 'ACTIVE', '08:30 AM', 'Breakfast Utensils', 4, null, 'DISHWASHING']
  ];

  for (const [id, resId, cId, sDate, eDate, st, et, amt, status, slotLabel, meal, gId, sId, sType = 'COOKING'] of bookingsData) {
    await query(
      `INSERT INTO bookings (id, resident_id, cook_id, start_date, end_date, start_time, end_time, amount, status, expires_at, slot_label, meal_type, group_id, schedule_id, service_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY), ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status=VALUES(status), amount=VALUES(amount), service_type=VALUES(service_type)`,
      [id, resId, cId, sDate, eDate, st, et, amt, status, slotLabel, meal, gId, sId, sType]
    );

    // Payments
    await query(
      `INSERT INTO payments (id, booking_id, amount, status, gateway, payment_id, order_id, user_id, currency)
       VALUES (?, ?, ?, 'SUCCESS', 'DEMO_SIMULATED', CONCAT('pay_seed_', ?), CONCAT('order_seed_', ?), ?, 'INR')
       ON DUPLICATE KEY UPDATE status='SUCCESS'`,
      [id, id, amt, id, id, resId]
    );

    // Subscriptions
    await query(
      `INSERT INTO subscriptions (id, booking_id, group_id, resident_id, society_id, monthly_amount, status, current_period_start, current_period_end)
       VALUES (?, ?, ?, ?, 1, ?, 'ACTIVE', ?, ?)
       ON DUPLICATE KEY UPDATE status='ACTIVE'`,
      [id, id, gId, resId, amt, sDate, eDate]
    );

    // Invoices
    const invNo = `INV-2026-${String(id).padStart(5, '0')}`;
    await query(
      `INSERT INTO invoices (id, payment_id, booking_id, resident_id, invoice_number, subtotal, total_amount, issued_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE invoice_number=VALUES(invoice_number)`,
      [id, id, id, resId, invNo, amt, amt, today]
    );

    // Earnings ledger
    const comm = Math.round(amt * 0.1);
    const net = amt - comm;
    await query(
      `INSERT INTO earnings_ledger (id, cook_id, booking_id, gross_amount, platform_commission, net_cook_earning, status)
       VALUES (?, ?, ?, ?, ?, ?, 'ACCRUED')
       ON DUPLICATE KEY UPDATE gross_amount=VALUES(gross_amount)`,
      [id, cId, id, amt, comm, net]
    );
  }

  // 8. Sessions for Today with OTP Codes
  const sessions = [
    [1, 1, 2, today, 'COMPLETED', new Date(Date.now() - 3600000), new Date(Date.now() - 600000), '19:00:00', '19:45:00', 'A-102', '3412', 1],
    [2, 2, 2, today, 'IN_PROGRESS', new Date(Date.now() - 300000), null, '19:45:00', '20:30:00', 'A-103', '5521', 1],
    [3, 3, 2, today, 'SCHEDULED', null, null, '20:30:00', '21:15:00', 'A-101', '4892', 0],
    [4, 4, 2, today, 'SCHEDULED', null, null, '21:15:00', '22:00:00', 'A-104', '7781', 0],
    [5, 5, 2, today, 'SCHEDULED', null, null, '22:00:00', '22:45:00', 'A-105', '9912', 0],
    [6, 6, 1, today, 'COMPLETED', new Date(Date.now() - 7200000), new Date(Date.now() - 4500000), '12:30:00', '13:15:00', 'B-302', '6624', 1]
  ];

  for (const [id, bId, cId, sDate, status, chIn, chOut, st, et, flat, otp, verified] of sessions) {
    await query(
      `INSERT INTO sessions (id, booking_id, cook_id, service_date, status, check_in, check_out, scheduled_start_time, scheduled_end_time, flat_number, otp_code, otp_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status=VALUES(status), check_in=VALUES(check_in), check_out=VALUES(check_out), otp_code=VALUES(otp_code), otp_verified=VALUES(otp_verified)`,
      [id, bId, cId, sDate, status, chIn, chOut, st, et, flat, otp, verified]
    );
  }

  // 9. Leaves & Automatic Backup Cook Replacement
  const leaveStart = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const leaveEnd = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);

  await query(
    `INSERT INTO leaves (id, cook_id, start_date, end_date, reason, leave_type, status, reviewed_at)
     VALUES (1, 1, ?, ?, 'Family function in native village', 'PLANNED', 'APPROVED', NOW())
     ON DUPLICATE KEY UPDATE status='APPROVED'`,
    [leaveStart, leaveEnd]
  );

  // Future replacement session for Lakshmi (cook_id 1) covered by Sunita (cook_id 3)
  await query(
    `INSERT INTO sessions (id, booking_id, cook_id, service_date, status, scheduled_start_time, scheduled_end_time, flat_number, otp_code)
     VALUES (7, 6, 3, ?, 'SCHEDULED', '12:30:00', '13:15:00', 'B-302', '8811')
     ON DUPLICATE KEY UPDATE cook_id=3, status='SCHEDULED'`,
    [leaveStart]
  );

  await query(
    `INSERT INTO replacements (id, session_id, orig_cook_id, backup_cook_id, assigned_by_type, reason, status)
     VALUES (1, 7, 1, 3, 'ALGORITHM_AUTO', 'Cook on planned leave. Automatic backup cook Sunita Sharma assigned.', 'ASSIGNED')
     ON DUPLICATE KEY UPDATE status='ASSIGNED', backup_cook_id=3`
  );

  // 10. Reviews & Notifications
  const reviews = [
    [1, 1, 2, 6, 5, 'Ramesh is an absolute master of soft phulkas! Arrives on time and leaves the kitchen spotless.'],
    [2, 2, 2, 7, 5, 'Best shared cook setup in Greenwood Residency. Kids loved the paneer butter masala.'],
    [3, 6, 1, 10, 5, 'Lakshmi traditional rasam and sambar are authentically divine. Very hygienic.']
  ];

  for (const [id, bId, cId, resId, rating, comment] of reviews) {
    await query(
      `INSERT INTO reviews (id, booking_id, cook_id, resident_id, rating, comment)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rating=VALUES(rating), comment=VALUES(comment)`,
      [id, bId, cId, resId, rating, comment]
    );
  }

  const notifications = [
    [1, 1, '🎉 Group Activated: Tower A Evening Dinner Club', 'Your group reached threshold and has been activated with Ramesh Kumar. Today OTP: 4892.', 'GROUP'],
    [2, 1, '🛡️ Security Gate Pass Validated', 'Pass #SC-8942 validated for Tower A entry by Greenwood Security.', 'ANNOUNCEMENT'],
    [3, 3, '💰 Earnings Milestone Reached: ₹20,000', '5 active households confirmed in Tower A cluster! Payout scheduled on 1st.', 'PAYMENT'],
    [4, 10, '🛡️ Backup Cook Assigned for Friday Lunch', 'Sunita Sharma will cover for Lakshmi Narayanan on Friday due to approved leave.', 'LEAVE']
  ];

  for (const [id, uId, title, msg, type] of notifications) {
    await query(
      `INSERT INTO notifications (id, user_id, title, message, type)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE message=VALUES(message)`,
      [id, uId, title, msg, type]
    );
  }

  console.log('✅ SocietyCook v2 database seed completed successfully!');
}

if (process.argv[1]?.endsWith('seed.js')) {
  seedDatabase()
    .then(() => db.end())
    .catch((err) => {
      console.error('Seed error:', err);
      process.exit(1);
    });
}
