import crypto from 'crypto';
import { query, transaction } from '../config/database.js';
import { calculateGroupPricing } from '../algorithms/pricingEngine.js';
import { rankCooksForGroup } from '../algorithms/recommender.js';
import { scheduler } from '../algorithms/scheduler.js';
import { logAudit } from '../middlewares/auditMiddleware.js';

export class GroupService {
  /**
   * Create a new community cook hiring group
   */
  static async createGroup({
    residentId,
    societyId,
    name,
    description,
    mealService = 'DINNER',
    preferredCuisines = 'North Indian, South Indian',
    dietaryPref = 'VEGETARIAN',
    preferredTimeStart = '19:00:00',
    preferredTimeEnd = '22:00:00',
    monthlyBudgetMax = 4500,
    minHouseholds = 3,
    maxHouseholds = 5,
    creatorFlat,
    creatorHouseholdSize = 2,
    creatorMealRequirements = 'Standard family dinner'
  }) {
    const inviteCode = 'GRP-' + crypto.randomBytes(4).toString('hex').toUpperCase();

    return await transaction(async (q) => {
      // 1. Verify resident belongs to the society
      const [resUser] = await q('SELECT id, society_id, flat, name FROM users WHERE id = ?', [residentId]);
      if (!resUser || resUser.society_id !== societyId) {
        const err = new Error('You can only create cook groups within your verified residential society.');
        err.status = 403;
        throw err;
      }

      const flat = creatorFlat || resUser.flat || 'A-101';

      // 2. Insert cook group in RECRUITING state
      const groupRes = await q(
        `INSERT INTO cook_groups 
         (society_id, created_by_resident_id, name, description, meal_service, preferred_cuisines, 
          dietary_pref, preferred_time_start, preferred_time_end, monthly_budget_max, min_households, 
          max_households, current_households, status, invite_code)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'RECRUITING', ?)`,
        [
          societyId,
          residentId,
          name.trim(),
          description || null,
          mealService,
          preferredCuisines,
          dietaryPref,
          preferredTimeStart,
          preferredTimeEnd,
          monthlyBudgetMax,
          minHouseholds,
          maxHouseholds,
          inviteCode
        ]
      );
      const groupId = groupRes.insertId;

      // 3. Automatically add creator as member 1
      await q(
        `INSERT INTO group_members 
         (group_id, resident_id, flat_number, household_size, meal_requirements, preferred_slot_start, status)
         VALUES (?, ?, ?, ?, ?, ?, 'CONFIRMED')`,
        [groupId, residentId, flat, creatorHouseholdSize, creatorMealRequirements, preferredTimeStart]
      );

      // 4. Create primary invite token
      const inviteToken = crypto.randomBytes(24).toString('hex');
      const expiresAt = new Date(Date.now() + 30 * 86400000);
      await q(
        `INSERT INTO group_invitations (group_id, invited_by_id, invite_token, expires_at)
         VALUES (?, ?, ?, ?)`,
        [groupId, residentId, inviteToken, expiresAt]
      );

      await logAudit({
        userId: residentId,
        action: 'GROUP_CREATED',
        resourceType: 'COOK_GROUP',
        resourceId: groupId
      });

      return {
        id: groupId,
        name,
        inviteCode,
        inviteToken,
        status: 'RECRUITING',
        currentHouseholds: 1,
        minHouseholds,
        maxHouseholds
      };
    });
  }

  /**
   * Discover active and recruiting groups in a society
   */
  static async getSocietyGroups(societyId, filterStatus = null) {
    let sql = `
      SELECT g.*, 
             u.name as creator_name,
             c.cuisine as assigned_cook_cuisine,
             cu.name as assigned_cook_name,
             c.photo_url as assigned_cook_photo,
             (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id AND gm.status != 'LEFT') as verified_member_count
      FROM cook_groups g
      JOIN users u ON u.id = g.created_by_resident_id
      LEFT JOIN cooks c ON c.id = g.assigned_cook_id
      LEFT JOIN users cu ON cu.id = c.user_id
      WHERE g.society_id = ?
    `;
    const params = [societyId];

    if (filterStatus) {
      sql += ' AND g.status = ?';
      params.push(filterStatus);
    }
    sql += ' ORDER BY g.id DESC';

    const groups = await query(sql, params);

    return groups.map((g) => {
      const pricing = calculateGroupPricing({
        householdCount: g.current_households || 1,
        mealService: g.meal_service,
        householdSize: 2
      });
      return {
        ...g,
        pricingEstimate: pricing,
        isRecruiting: g.status === 'RECRUITING' || g.status === 'THRESHOLD_REACHED',
        progressPct: Math.round(((g.current_households || 1) / (g.min_households || 3)) * 100)
      };
    });
  }

  /**
   * Get complete group details with member roster, pricing snapshots and recommendations
   */
  static async getGroupDetails(groupId, userId = null) {
    const [group] = await query(
      `SELECT g.*, 
              s.name as society_name, s.address as society_address,
              u.name as creator_name, u.phone as creator_phone,
              c.cuisine as cook_cuisine, cu.name as cook_name, c.photo_url as cook_photo, c.experience as cook_experience
       FROM cook_groups g
       JOIN societies s ON s.id = g.society_id
       JOIN users u ON u.id = g.created_by_resident_id
       LEFT JOIN cooks c ON c.id = g.assigned_cook_id
       LEFT JOIN users cu ON cu.id = c.user_id
       WHERE g.id = ?`,
      [groupId]
    );

    if (!group) {
      const err = new Error('Cook group not found.');
      err.status = 404;
      throw err;
    }

    const members = await query(
      `SELECT gm.*, u.name as resident_name, u.phone as resident_phone, u.avatar_url
       FROM group_members gm
       JOIN users u ON u.id = gm.resident_id
       WHERE gm.group_id = ? AND gm.status != 'LEFT'
       ORDER BY gm.joined_at ASC`,
      [groupId]
    );

    const pricing = calculateGroupPricing({
      householdCount: members.length,
      mealService: group.meal_service,
      householdSize: 2
    });

    const isMember = userId ? members.some((m) => m.resident_id === userId) : false;

    return {
      group,
      members,
      pricing,
      isMember,
      activationThresholdMet: members.length >= group.min_households
    };
  }

  /**
   * Join an open group
   */
  static async joinGroup({ groupId, residentId, flatNumber, householdSize = 2, preferredSlotStart = '19:00:00', dietaryNotes }) {
    return await transaction(async (q) => {
      // 1. Fetch group with row lock
      const [group] = await q('SELECT * FROM cook_groups WHERE id = ? FOR UPDATE', [groupId]);
      if (!group) {
        const err = new Error('Cook hiring group not found.');
        err.status = 404;
        throw err;
      }

      if (group.status !== 'RECRUITING' && group.status !== 'THRESHOLD_REACHED') {
        const err = new Error(`Cannot join group in '${group.status}' state.`);
        err.status = 400;
        throw err;
      }

      // 2. Verify resident belongs to the same society
      const [resUser] = await q('SELECT id, society_id, flat, name FROM users WHERE id = ?', [residentId]);
      if (!resUser || resUser.society_id !== group.society_id) {
        const err = new Error('You can only join cook groups within your own society.');
        err.status = 403;
        throw err;
      }

      // 3. Check if already a member
      const [existingMember] = await q(
        "SELECT id FROM group_members WHERE group_id = ? AND resident_id = ? AND status != 'LEFT'",
        [groupId, residentId]
      );
      if (existingMember) {
        const err = new Error('You are already an active participant in this cook group.');
        err.status = 409;
        throw err;
      }

      // 4. Check capacity
      const [countRow] = await q(
        "SELECT COUNT(*) as count FROM group_members WHERE group_id = ? AND status != 'LEFT'",
        [groupId]
      );
      if (countRow.count >= group.max_households) {
        const err = new Error(`This cook group has reached its maximum limit of ${group.max_households} households.`);
        err.status = 400;
        throw err;
      }

      const flat = flatNumber || resUser.flat || 'A-101';

      // 5. Insert member
      await q(
        `INSERT INTO group_members 
         (group_id, resident_id, flat_number, household_size, preferred_slot_start, dietary_notes, status)
         VALUES (?, ?, ?, ?, ?, ?, 'JOINED')`,
        [groupId, residentId, flat, householdSize, preferredSlotStart, dietaryNotes || null]
      );

      const newHouseholdCount = countRow.count + 1;
      let newStatus = group.status;
      if (newHouseholdCount >= group.min_households && group.status === 'RECRUITING') {
        newStatus = 'THRESHOLD_REACHED';
      }

      await q('UPDATE cook_groups SET current_households = ?, status = ? WHERE id = ?', [
        newHouseholdCount,
        newStatus,
        groupId
      ]);

      // Notify group members
      await q(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES (?, 'Neighbour Joined Your Cook Group', ?, 'GROUP')`,
        [
          group.created_by_resident_id,
          `${resUser.name} (Flat ${flat}) just joined '${group.name}'. Total households: ${newHouseholdCount}/${group.min_households}`
        ]
      );

      await logAudit({
        userId: residentId,
        action: 'GROUP_JOINED',
        resourceType: 'COOK_GROUP',
        resourceId: groupId
      });

      return {
        groupId,
        status: newStatus,
        householdCount: newHouseholdCount,
        thresholdReached: newHouseholdCount >= group.min_households
      };
    });
  }

  /**
   * Recommend and rank eligible cooks for an activated/threshold-reached group
   */
  static async getCookRecommendationsForGroup(groupId) {
    const [group] = await query('SELECT * FROM cook_groups WHERE id = ?', [groupId]);
    if (!group) {
      const err = new Error('Group not found');
      err.status = 404;
      throw err;
    }

    const candidateCooks = await query(
      `SELECT c.*, u.name, u.phone, s.name as society_name,
              (SELECT COUNT(*) FROM bookings b WHERE b.cook_id = c.id AND b.status = 'ACTIVE') as active_households
       FROM cooks c
       JOIN users u ON u.id = c.user_id
       JOIN societies s ON s.id = u.society_id
       WHERE c.verified = 1 AND u.society_id = ?`,
      [group.society_id]
    );

    return rankCooksForGroup({ group, candidateCooks });
  }

  /**
   * Assign cook and transition to AWAITING_CONFIRMATION
   */
  static async proposeCookAssignment(groupId, cookId, assignedByUserId) {
    return await transaction(async (q) => {
      const [group] = await q('SELECT * FROM cook_groups WHERE id = ? FOR UPDATE', [groupId]);
      if (!group) throw new Error('Group not found');

      const [cook] = await q('SELECT c.*, u.name FROM cooks c JOIN users u ON u.id=c.user_id WHERE c.id = ?', [cookId]);
      if (!cook || !cook.verified) throw new Error('Selected cook is not verified or unavailable');

      await q(
        "UPDATE cook_groups SET assigned_cook_id = ?, status = 'AWAITING_CONFIRMATION' WHERE id = ?",
        [cookId, groupId]
      );

      // Notify assigned cook
      await q(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES (?, 'New Society Cook Group Assignment Request', ?, 'GROUP')`,
        [
          cook.user_id,
          `You have been selected to cook for '${group.name}' (${group.current_households} households in ${group.meal_service} service). Please review and accept.`
        ]
      );

      await logAudit({
        userId: assignedByUserId,
        action: 'COOK_PROPOSED_FOR_GROUP',
        resourceType: 'COOK_GROUP',
        resourceId: groupId,
        diff: { cookId, cookName: cook.name }
      });

      return { success: true, groupId, status: 'AWAITING_CONFIRMATION', cookName: cook.name };
    });
  }

  /**
   * Activate Group: Generates Schedule, Bookings, Subscriptions, Price Snapshot and Sessions
   */
  static async activateGroupAndGenerateSchedules(groupId, activatedByUserId) {
    return await transaction(async (q) => {
      const [group] = await q('SELECT * FROM cook_groups WHERE id = ? FOR UPDATE', [groupId]);
      if (!group) throw new Error('Group not found');

      if (!group.assigned_cook_id) {
        throw new Error('A verified cook must be assigned before group activation.');
      }

      const [cook] = await q(
        'SELECT c.*, u.name, u.society_id FROM cooks c JOIN users u ON u.id=c.user_id WHERE c.id = ?',
        [group.assigned_cook_id]
      );

      const members = await q(
        "SELECT * FROM group_members WHERE group_id = ? AND status != 'LEFT'",
        [groupId]
      );

      if (members.length < group.min_households) {
        throw new Error(`Group requires at least ${group.min_households} households to activate.`);
      }

      // 1. Calculate Group Pricing Snapshot
      const pricing = calculateGroupPricing({
        householdCount: members.length,
        mealService: group.meal_service,
        householdSize: 2
      });

      const today = new Date().toISOString().slice(0, 10);
      const nextMonth = new Date(Date.now() + 29 * 86400000).toISOString().slice(0, 10);

      // Save price snapshot
      await q(
        `INSERT INTO group_price_snapshots 
         (group_id, household_count, price_per_household, cook_payout_total, platform_fee_total, snapshot_date)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [groupId, members.length, pricing.pricePerHousehold, pricing.cookGrossPayout, pricing.platformCommission, today]
      );

      // 2. Run Intelligent Scheduling Engine
      const existingEntries = await q(
        `SELECT b.id, b.start_time, b.end_time, ru.flat as flat_number, 'Tower A' as block_name 
         FROM bookings b
         JOIN users ru ON ru.id = b.resident_id
         WHERE b.cook_id = ? AND b.status = 'ACTIVE'`,
        [cook.id]
      );

      const scheduleResult = scheduler.generateSchedule({
        cook,
        households: members.map((m) => ({
          resident_id: m.resident_id,
          flat_number: m.flat_number,
          block_name: 'Tower A',
          preferred_slot_start: m.preferred_slot_start || group.preferred_time_start,
          cooking_duration: 45
        })),
        existingEntries,
        serviceDate: today,
        preferredMeal: group.meal_service
      });

      // 3. Create Master Schedule record
      const schedRes = await q(
        `INSERT INTO schedules (group_id, cook_id, society_id, version_number, effective_from, effective_to, status, algorithm_score)
         VALUES (?, ?, ?, 1, ?, ?, 'ACTIVE', ?)`,
        [groupId, cook.id, group.society_id, today, nextMonth, scheduleResult.score]
      );
      const scheduleId = schedRes.insertId;

      // 4. Create Schedule Entries, 30-day Bookings & Subscriptions for each member
      for (const entry of scheduleResult.entries) {
        await q(
          `INSERT INTO schedule_entries 
           (schedule_id, group_id, resident_id, cook_id, flat_number, block_name, start_time, end_time, meal_type)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            scheduleId,
            groupId,
            entry.resident_id,
            cook.id,
            entry.flat_number,
            entry.block_name,
            entry.start_time,
            entry.end_time,
            group.meal_service
          ]
        );

        // Booking record
        const bookingRes = await q(
          `INSERT INTO bookings 
           (resident_id, cook_id, start_date, end_date, start_time, end_time, amount, status, expires_at, slot_label, meal_type, group_id, schedule_id, monthly_price)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', DATE_ADD(NOW(), INTERVAL 30 DAY), ?, ?, ?, ?, ?)`,
          [
            entry.resident_id,
            cook.id,
            today,
            nextMonth,
            entry.start_time,
            entry.end_time,
            pricing.pricePerHousehold,
            entry.time_label,
            group.meal_service,
            groupId,
            scheduleId,
            pricing.pricePerHousehold
          ]
        );
        const bookingId = bookingRes.insertId;

        // Subscription record
        await q(
          `INSERT INTO subscriptions (booking_id, group_id, resident_id, society_id, monthly_amount, status, current_period_start, current_period_end)
           VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
          [bookingId, groupId, entry.resident_id, group.society_id, pricing.pricePerHousehold, today, nextMonth]
        );

        // Simulated initial payment record
        await q(
          `INSERT INTO payments (booking_id, amount, status, gateway, payment_id, order_id, group_id, user_id)
           VALUES (?, ?, 'SUCCESS', 'DEMO_SIMULATED', CONCAT('pay_grp_', ?), CONCAT('order_grp_', ?), ?, ?)`,
          [bookingId, pricing.pricePerHousehold, bookingId, bookingId, groupId, entry.resident_id]
        );

        // Generate session for today with OTP
        const otpCode = String(Math.floor(1000 + Math.random() * 9000));
        await q(
          `INSERT INTO sessions 
           (booking_id, cook_id, service_date, status, scheduled_start_time, scheduled_end_time, flat_number, otp_code)
           VALUES (?, ?, ?, 'SCHEDULED', ?, ?, ?, ?)`,
          [bookingId, cook.id, today, entry.start_time, entry.end_time, entry.flat_number, otpCode]
        );

        // Notification to resident
        await q(
          `INSERT INTO notifications (user_id, title, message, type)
           VALUES (?, 'Cook Group Activated! Your Slot is Confirmed', ?, 'SCHEDULE')`,
          [
            entry.resident_id,
            `Group '${group.name}' is now ACTIVE! ${cook.name} is scheduled daily at ${entry.time_label}. Today's service OTP: ${otpCode}. Price: ₹${pricing.pricePerHousehold.toLocaleString('en-IN')}/mo.`
          ]
        );
      }

      // Transition group status to ACTIVE
      await q(
        "UPDATE cook_groups SET status = 'ACTIVE', activated_at = NOW() WHERE id = ?",
        [groupId]
      );

      // Notification to cook
      await q(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES (?, 'Cook Group Activated! Route Ready', ?, 'SCHEDULE')`,
        [
          cook.user_id,
          `Group '${group.name}' has been activated! Your schedule includes ${scheduleResult.entries.length} households in Tower A. Monthly earnings: ₹${pricing.cookGrossPayout.toLocaleString('en-IN')}.`
        ]
      );

      await logAudit({
        userId: activatedByUserId,
        action: 'GROUP_ACTIVATED',
        resourceType: 'COOK_GROUP',
        resourceId: groupId,
        diff: { pricing, scheduleScore: scheduleResult.score, householdCount: members.length }
      });

      return {
        success: true,
        groupId,
        status: 'ACTIVE',
        pricing,
        scheduleScore: scheduleResult.score,
        householdsScheduled: scheduleResult.entries.length
      };
    });
  }
}
