import {query, db} from './db.js';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Seeding SocietyCook database with rich demo data...');
  const hash = await bcrypt.hash('Demo12345!', 12);

  // 1. Societies
  const societies = [
    [1, 'Greenwood Residency', 'Whitefield, Bengaluru (Towers A, B, C · 450 Flats)', 'VERIFIED'],
    [2, 'Prestige Shantiniketan', 'ITPL Main Road, Whitefield, Bengaluru (Towers 1-14 · 3000 Flats)', 'VERIFIED'],
    [3, 'Sobha Silicon Oasis', 'Hosa Road, Electronic City, Bengaluru (Towers Sapphire, Ruby · 900 Flats)', 'VERIFIED'],
    [4, 'Brigade Gateway', 'Rajajinagar, Malleshwaram, Bengaluru', 'VERIFIED']
  ];

  for (const [id, name, address, status] of societies) {
    await query(
      'INSERT INTO societies(id, name, address, status) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name), address=VALUES(address), status=VALUES(status)',
      [id, name, address, status]
    );
  }

  // 2. Users
  const users = [
    // Residents
    [1, 'Rahul Sharma (Demo Resident)', 'resident@example.com', 'RESIDENT', 1, 'A-101', '+91 98450 12345'],
    [2, 'Lakshmi Narayanan', 'cook@example.com', 'COOK', 1, null, '+91 97401 22334'],
    [3, 'Ramesh Kumar', 'ramesh@example.com', 'COOK', 1, null, '+91 98860 33445'],
    [4, 'Society Security & Facility Manager', 'manager@example.com', 'SOCIETY_MANAGER', 1, null, '+91 94480 55667'],
    [5, 'Platform Admin', 'admin@example.com', 'ADMIN', 1, null, '+91 99000 88990'],
    // Additional residents in Tower A for Ramesh's 5-household cluster
    [6, 'Priya Varma', 'priya@example.com', 'RESIDENT', 1, 'A-102', '+91 98451 11223'],
    [7, 'Arjun Nair', 'arjun@example.com', 'RESIDENT', 1, 'A-103', '+91 98452 33445'],
    [8, 'Neha Kapoor', 'neha@example.com', 'RESIDENT', 1, 'A-104', '+91 98453 55667'],
    [9, 'Karthik & Pooja', 'karthik@example.com', 'RESIDENT', 1, 'A-105', '+91 98454 77889'],
    [10, 'Ananya Sen', 'ananya@example.com', 'RESIDENT', 1, 'B-302', '+91 98455 99001'],
    // Additional professional cooks
    [11, 'Sunita Sharma', 'sunita@example.com', 'COOK', 1, null, '+91 97402 44556'],
    [12, 'Bablu Ghosh', 'bablu@example.com', 'COOK', 1, null, '+91 97403 66778'],
    [13, 'Rekha Ben Patel', 'rekha@example.com', 'COOK', 1, null, '+91 97404 88990']
  ];

  for (const [id, name, email, role, society_id, flat, phone] of users) {
    await query(
      'INSERT INTO users(id, name, email, password_hash, role, society_id, flat, phone) VALUES(?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name), email=VALUES(email), role=VALUES(role), society_id=VALUES(society_id), flat=VALUES(flat), phone=VALUES(phone)',
      [id, name, email, hash, role, society_id, flat, phone]
    );
  }

  // 3. Cooks
  const cooks = [
    [
      1, 2, 'South Indian, Vegetarian, Andhra & Tamil',
      'Specialist in traditional homestyle South Indian vegetarian cooking: crisp dosas, soft idlis, authentic sambar, rasam, avial, kootu, and flavorful Andhra curries. 6+ years experience in gated communities.',
      3500, 6, 1, '06:30:00', '21:30:00',
      'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=400&q=80',
      'Pure Veg, Jain Option, Low Oil, Sattvic', 4.8
    ],
    [
      2, 3, 'North Indian, Punjabi & Mughlai Delicacies',
      'Known as the Phulka Master! Specializes in hot rotis, layered parathas, authentic dal makhani, rajma-chawal, shahi paneer, seasonal sabzi, and nutritious daily khichdi. Highly punctual and hygiene-certified.',
      4000, 8, 1, '07:00:00', '22:00:00',
      'https://images.unsplash.com/photo-1583394293214-28ded15ee548?auto=format&fit=crop&w=400&q=80',
      'North Indian, High Protein, Custom Spice, Homestyle', 4.9
    ],
    [
      3, 11, 'Healthy Fitness Diet, Millets & Salads',
      'Nutritious macro-balanced everyday cooking: multi-millet rotis, quinoa bowls, grilled paneer/tofu, sprout salads, high-protein dals, and light detox meals without refined oil or excess sugar.',
      4500, 5, 1, '06:00:00', '21:00:00',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      'High Protein, Low Calorie, Diabetic Friendly, Vegan', 4.7
    ],
    [
      4, 12, 'Bengali, Odia & Homestyle Fish Curry',
      'Authentic East Indian cuisine specialist: Macher Jhol, Shorshe Ilish, Aloo Posto, Kosha Mangsho, light moong dal, and fragrant basmati rice dishes. Served over 40+ families in Whitefield.',
      3800, 7, 1, '07:30:00', '21:30:00',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      'Non-Veg, Fish Specialist, East Indian, Homestyle', 4.8
    ],
    [
      5, 13, 'Gujarati, Kathiawadi & Rajasthani Thali',
      'Expert in soft theplas, sev tameta nu shaak, dal dhokli, kadhi khichdi, khandvi, and pure Jain food prepared with strict hygiene without onion/garlic on request.',
      4200, 9, 1, '07:00:00', '21:00:00',
      'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=400&q=80',
      'Pure Veg, 100% Jain Friendly, Gujarati Thali, Low Spice', 4.9
    ]
  ];

  for (const [id, user_id, cuisine, bio, price, experience, verified, from, to, photo_url, tags, rating] of cooks) {
    await query(
      'INSERT INTO cooks(id, user_id, cuisine, bio, price, experience, verified, available_from, available_to, photo_url, dietary_tags, rating_avg) VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE cuisine=VALUES(cuisine), bio=VALUES(bio), price=VALUES(price), experience=VALUES(experience), verified=VALUES(verified), available_from=VALUES(available_from), available_to=VALUES(available_to), photo_url=VALUES(photo_url), dietary_tags=VALUES(dietary_tags), rating_avg=VALUES(rating_avg)',
      [id, user_id, cuisine, bio, price, experience, verified, from, to, photo_url, tags, rating]
    );
  }

  // 4. Bookings
  // Ramesh Kumar (cook_id 2) serving 5 households in Tower A:
  // Flat 102 (Priya, 19:00 - 19:45)
  // Flat 103 (Arjun, 19:45 - 20:30)
  // Flat 101 (Demo Resident, 20:30 - 21:15)
  // Flat 104 (Neha, 21:15 - 22:00)
  // Flat 105 (Karthik, 22:00 - 22:45)
  const today = new Date().toISOString().slice(0, 10);
  const nextMonth = new Date(Date.now() + 29 * 86400000).toISOString().slice(0, 10);

  const bookings = [
    // [id, resident_id, cook_id, start_date, end_date, start_time, end_time, amount, status, slot_label, meal_type]
    [1, 6, 2, today, nextMonth, '19:00:00', '19:45:00', 4000, 'ACTIVE', '07:00 PM', 'Dinner'],
    [2, 7, 2, today, nextMonth, '19:45:00', '20:30:00', 4000, 'ACTIVE', '07:45 PM', 'Dinner'],
    [3, 1, 2, today, nextMonth, '20:30:00', '21:15:00', 4000, 'ACTIVE', '08:30 PM', 'Dinner'],
    [4, 8, 2, today, nextMonth, '21:15:00', '22:00:00', 4000, 'ACTIVE', '09:15 PM', 'Dinner'],
    [5, 9, 2, today, nextMonth, '22:00:00', '22:45:00', 4000, 'ACTIVE', '10:00 PM', 'Dinner'],
    // Lakshmi (cook_id 1) serving Ananya (resident_id 10) in Flat B-302 for Lunch
    [6, 10, 1, today, nextMonth, '12:30:00', '13:15:00', 3500, 'ACTIVE', '12:30 PM', 'Lunch']
  ];

  for (const [id, res_id, cook_id, start, end, st, et, amt, status, slot_label, meal_type] of bookings) {
    await query(
      "INSERT INTO bookings(id, resident_id, cook_id, start_date, end_date, start_time, end_time, amount, status, expires_at, slot_label, meal_type) VALUES(?,?,?,?,?,?,?,?,?,DATE_ADD(NOW(),INTERVAL 30 DAY),?,?) ON DUPLICATE KEY UPDATE status=VALUES(status), start_time=VALUES(start_time), end_time=VALUES(end_time), amount=VALUES(amount), slot_label=VALUES(slot_label), meal_type=VALUES(meal_type)",
      [id, res_id, cook_id, start, end, st, et, amt, status, slot_label, meal_type]
    );

    // Payments
    await query(
      "INSERT INTO payments(id, booking_id, amount, status, payment_id, order_id) VALUES(?,?,?,'SUCCESS',CONCAT('pay_demo_',?),CONCAT('order_demo_',?)) ON DUPLICATE KEY UPDATE status=VALUES(status)",
      [id, id, amt, id, id]
    );
  }

  // 5. Sessions for Today
  const sessions = [
    // Ramesh's sessions today
    [1, 1, 2, today, 'COMPLETED', new Date(Date.now() - 3600000), new Date(Date.now() - 600000)], // Flat 102
    [2, 2, 2, today, 'IN_PROGRESS', new Date(Date.now() - 300000), null],                          // Flat 103
    [3, 3, 2, today, 'SCHEDULED', null, null],                                                     // Flat 101 (Demo Resident)
    [4, 4, 2, today, 'SCHEDULED', null, null],                                                     // Flat 104
    [5, 5, 2, today, 'SCHEDULED', null, null],                                                     // Flat 105
    // Lakshmi's session today
    [6, 6, 1, today, 'COMPLETED', new Date(Date.now() - 7200000), new Date(Date.now() - 4500000)]
  ];

  for (const [id, booking_id, cook_id, s_date, status, check_in, check_out] of sessions) {
    await query(
      'INSERT INTO sessions(id, booking_id, cook_id, service_date, status, check_in, check_out) VALUES(?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE status=VALUES(status), check_in=VALUES(check_in), check_out=VALUES(check_out)',
      [id, booking_id, cook_id, s_date, status, check_in, check_out]
    );
  }

  // 6. Leaves and Replacements
  // Lakshmi applied leave for day after tomorrow; approved; Sunita Sharma assigned as backup!
  const leaveStart = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const leaveEnd = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);

  await query(
    "INSERT INTO leaves(id, cook_id, start_date, end_date, reason, status) VALUES(1, 1, ?, ?, 'Family function in native village', 'APPROVED') ON DUPLICATE KEY UPDATE status='APPROVED'",
    [leaveStart, leaveEnd]
  );

  // Future session for Lakshmi that has replacement
  await query(
    "INSERT INTO sessions(id, booking_id, cook_id, service_date, status) VALUES(7, 6, 3, ?, 'SCHEDULED') ON DUPLICATE KEY UPDATE cook_id=3, status='SCHEDULED'",
    [leaveStart]
  );

  await query(
    "INSERT INTO replacements(id, session_id, reason, status) VALUES(1, 7, 'Cook on planned leave. Backup cook Sunita Sharma assigned.', 'ASSIGNED') ON DUPLICATE KEY UPDATE status='ASSIGNED', reason=VALUES(reason)"
  );

  // 7. Reviews
  const reviews = [
    [1, 1, 5, 'Ramesh is an absolute gem! Very clean, soft rotis and fabulous dal tadka. Arrives exactly on time every day.'],
    [2, 6, 5, 'Lakshmi authentic sambar and rasam remind me of my grandmother cooking. Hygiene and discipline are 10/10.'],
    [3, 2, 5, 'Consistent quality, very friendly with our kids, adjusts spices per our requirement. Best shared cook decision!']
  ];

  for (const [id, b_id, rating, comment] of reviews) {
    await query(
      'INSERT INTO reviews(id, booking_id, rating, comment) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE rating=VALUES(rating), comment=VALUES(comment)',
      [id, b_id, rating, comment]
    );
  }

  // 8. Notifications
  const notifications = [
    [1, 1, '🎉 Ramesh Kumar confirmed for 08:30 PM dinner service at Flat A-101.'],
    [2, 1, '🛡️ Security Gate Pass #SC-8942 validated for Tower A entry.'],
    [3, 1, '🍛 Ramesh completed yesterday dinner service with 5-star rating!'],
    [4, 1, '✅ Monthly subscription of ₹4,000 active until ' + nextMonth],
    [5, 3, '🔔 New household added to your schedule: Flat A-105 confirmed for 10:00 PM.'],
    [6, 3, '💰 Monthly earnings milestone reached: ₹20,000 across 5 households in Tower A!'],
    [7, 10, '🛡️ Backup cook Sunita Sharma assigned for your lunch service on ' + leaveStart + ' (Lakshmi on leave).']
  ];

  for (const [id, u_id, message] of notifications) {
    await query(
      'INSERT INTO notifications(id, user_id, message) VALUES(?,?,?) ON DUPLICATE KEY UPDATE message=VALUES(message)',
      [id, u_id, message]
    );
  }

  console.log('✅ SocietyCook seed completed successfully!');
}

seed().then(() => db.end()).catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
