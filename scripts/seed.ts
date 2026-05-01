import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ============================================================
// ACCOUNTS — semua pakai @draftmind.com
// ============================================================

const ADMIN = {
  email: 'admin@draftmind.com',
  password: 'admin1234',
  fullName: 'Admin System',
  role: 'System Administrator',
};

const USERS = [
  {
    email: 'hakim@draftmind.com',
    password: 'user1234',
    fullName: 'Muhammad Iqbal AlHakim',
    role: 'Product Manager',
  },
  {
    email: 'maya@draftmind.com',
    password: 'user1234',
    fullName: 'Maya Reyes',
    role: 'Product Manager',
  },
  {
    email: 'rizky@draftmind.com',
    password: 'user1234',
    fullName: 'Rizky Pratama',
    role: 'Software Engineer',
  },
  {
    email: 'sari@draftmind.com',
    password: 'user1234',
    fullName: 'Sari Wijaya',
    role: 'UX Designer',
  },
  {
    email: 'daniel@draftmind.com',
    password: 'user1234',
    fullName: 'Daniel Oh',
    role: 'Engineering Manager',
  },
];

// ============================================================
// PRDs
// ============================================================

const PRDS = [
  {
    title: 'Checkout Flow Redesign',
    tag: 'Q2 2026',
    status: 'final' as const,
    health: 95,
    words: 5200,
    owner: 0,
  },
  {
    title: 'Wallet Redesign — KYC Tier-2',
    tag: 'Q2 2026 Growth',
    status: 'in_review' as const,
    health: 86,
    words: 3200,
    owner: 1,
  },
  {
    title: 'Onboarding Revamp — 3G Optimization',
    tag: 'Growth',
    status: 'draft' as const,
    health: 54,
    words: 1800,
    owner: 2,
  },
  {
    title: 'Real-time Collaboration v2',
    tag: 'Platform',
    status: 'refined' as const,
    health: 92,
    words: 4500,
    owner: 4,
  },
  {
    title: 'Payment Gateway Integration',
    tag: 'Payments',
    status: 'final' as const,
    health: 95,
    words: 5200,
    owner: 0,
  },
  {
    title: 'Push Notification Service RFC',
    tag: 'Infrastructure',
    status: 'draft' as const,
    health: 42,
    words: 900,
    owner: 3,
  },
  {
    title: 'Analytics Dashboard Revamp',
    tag: 'Data Platform',
    status: 'reviewed' as const,
    health: 78,
    words: 2800,
    owner: 2,
  },
  {
    title: 'User Segmentation Engine',
    tag: 'Growth',
    status: 'in_review' as const,
    health: 71,
    words: 3400,
    owner: 3,
  },
  {
    title: 'Mobile App Performance Audit',
    tag: 'Platform',
    status: 'draft' as const,
    health: 35,
    words: 600,
    owner: 4,
  },
  {
    title: 'Search & Discovery Overhaul',
    tag: 'Product',
    status: 'in_review' as const,
    health: 68,
    words: 2600,
    owner: 1,
  },
];

// ============================================================
// SEED
// ============================================================

async function seed() {
  console.log('🌱 Seeding DraftMind database...\n');

  // ---- 1. Create Admin ----
  console.log('--- Admin ---');
  const { data: adminData, error: adminErr } = await supabase.auth.admin.createUser({
    email: ADMIN.email,
    password: ADMIN.password,
    email_confirm: true,
    user_metadata: { full_name: ADMIN.fullName },
  });

  if (adminErr) {
    console.error('Failed to create admin:', adminErr.message);
    process.exit(1);
  }

  const adminId = adminData.user.id;
  console.log(`  ${ADMIN.fullName} (${ADMIN.email}) → ${adminId}`);

  await supabase
    .from('profiles')
    .update({
      full_name: ADMIN.fullName,
      is_super_admin: true,
      role_self_reported: ADMIN.role,
      experience_level: 'expert',
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq('id', adminId);

  // ---- 2. Create Users ----
  console.log('\n--- Users ---');
  const userIds: string[] = [];

  for (const u of USERS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.fullName },
    });

    if (error) {
      console.error(`  Failed: ${u.email} — ${error.message}`);
      continue;
    }

    userIds.push(data.user.id);
    console.log(`  ${u.fullName} (${u.email}) → ${data.user.id}`);

    await supabase
      .from('profiles')
      .update({
        full_name: u.fullName,
        role_self_reported: u.role,
        experience_level: 'intermediate',
        primary_use_cases: ['Feature PRD', 'Experiment Brief'],
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', data.user.id);
  }

  if (userIds.length < 5) {
    console.error('\nNot enough users created. Aborting.');
    process.exit(1);
  }

  // ---- 3. Create Workspaces ----
  console.log('\n--- Workspaces ---');

  const { data: ws1 } = await supabase
    .from('workspaces')
    .insert({
      name: 'DraftMind Product',
      slug: 'draftmind-product',
      icon_pattern: 'circle',
      is_private: true,
      industry: 'Technology',
      team_size: '11-50',
      owner_id: userIds[0],
    })
    .select()
    .single();

  const { data: ws2 } = await supabase
    .from('workspaces')
    .insert({
      name: 'Growth Team',
      slug: 'growth-team',
      icon_pattern: 'rounded',
      is_private: true,
      industry: 'Technology',
      team_size: '2-10',
      owner_id: userIds[1],
    })
    .select()
    .single();

  console.log(`  ${ws1?.name} → ${ws1?.id}`);
  console.log(`  ${ws2?.name} → ${ws2?.id}`);

  // ---- 4. Add Members ----
  console.log('\n--- Members ---');

  const members = [
    // ws1: all 5 users
    { workspace_id: ws1!.id, user_id: userIds[0], role: 'admin' },
    { workspace_id: ws1!.id, user_id: userIds[1], role: 'editor' },
    { workspace_id: ws1!.id, user_id: userIds[2], role: 'editor' },
    { workspace_id: ws1!.id, user_id: userIds[3], role: 'editor' },
    { workspace_id: ws1!.id, user_id: userIds[4], role: 'commenter' },
    // ws2: maya + rizky
    { workspace_id: ws2!.id, user_id: userIds[1], role: 'admin' },
    { workspace_id: ws2!.id, user_id: userIds[2], role: 'editor' },
  ];

  await supabase.from('workspace_members').insert(members);
  console.log(`  ${members.length} memberships created`);

  // ---- 5. Create PRDs ----
  console.log('\n--- PRDs ---');

  const emptyContent = {
    version: 1,
    metadata: { title: '', locale: 'en' },
    sections: {
      overview: { content: {}, word_count: 0, ai_generated: false },
      problem_statement: { content: {}, word_count: 0, ai_generated: false },
    },
  };

  let prdCount = 0;
  for (const prd of PRDS) {
    const ownerId = userIds[prd.owner];
    const { data: inserted, error } = await supabase
      .from('prds')
      .insert({
        workspace_id: ws1!.id,
        owner_id: ownerId,
        title: prd.title,
        project_tag: prd.tag,
        status: prd.status,
        health_score: prd.health,
        health_breakdown: {
          completeness: Math.min(100, prd.health + 5),
          specificity: Math.max(0, prd.health - 10),
          structural: prd.health,
          consistency: Math.min(100, prd.health + 3),
        },
        word_count: prd.words,
        read_time_minutes: Math.ceil(prd.words / 250),
        content: emptyContent,
      })
      .select('id')
      .single();

    if (error) {
      console.error(`  Failed: "${prd.title}" — ${error.message}`);
      continue;
    }

    prdCount++;

    await supabase.from('prd_versions').insert({
      prd_id: inserted!.id,
      version_number: 1,
      content: emptyContent,
      change_summary: 'Initial draft',
      created_by: ownerId,
      source: 'manual',
    });

    await supabase.from('activity_log').insert({
      workspace_id: ws1!.id,
      actor_id: ownerId,
      type: 'prd_created',
      resource_type: 'prd',
      resource_id: inserted!.id,
      metadata: { title: prd.title },
    });
  }

  console.log(`  ${prdCount} PRDs created`);

  // ---- 6. Comments ----
  console.log('\n--- Comments ---');

  const { data: allPrds } = await supabase
    .from('prds')
    .select('id, title')
    .eq('workspace_id', ws1!.id)
    .limit(4);

  const commentBodies = [
    'Looks good overall. Can we narrow the out-of-scope items?',
    'I think the success metrics need to be more specific.',
    'Great structure. Let me review the user stories section.',
    'Can we add acceptance criteria for the edge cases?',
  ];

  if (allPrds) {
    for (let i = 0; i < allPrds.length; i++) {
      const prd = allPrds[i]!;
      const authorId = userIds[(i + 1) % userIds.length];
      await supabase.from('comments').insert({
        prd_id: prd.id,
        author_id: authorId,
        body: commentBodies[i],
        section_key: 'overview',
      });

      await supabase.from('activity_log').insert({
        workspace_id: ws1!.id,
        actor_id: authorId,
        type: 'comment_added',
        resource_type: 'prd',
        resource_id: prd.id,
        metadata: {},
      });
    }
    console.log(`  ${allPrds.length} comments created`);
  }

  // ---- 7. Notifications ----
  console.log('\n--- Notifications ---');

  await supabase.from('notifications').insert([
    {
      recipient_id: userIds[0],
      workspace_id: ws1!.id,
      type: 'review_request',
      title: 'Review requested on Analytics Dashboard Revamp',
      body: 'Rizky requested your review',
      action_url: '/prds',
    },
    {
      recipient_id: userIds[0],
      workspace_id: ws1!.id,
      type: 'mention',
      title: 'You were mentioned in Push Notification RFC',
      body: 'Sari mentioned you in a comment',
      action_url: '/prds',
    },
    {
      recipient_id: userIds[1],
      workspace_id: ws1!.id,
      type: 'review_request',
      title: 'Review requested on Checkout Flow Redesign',
      body: 'Hakim requested your review',
      action_url: '/prds',
    },
  ]);
  console.log('  3 notifications created');

  // ---- Done ----
  console.log('\n========================================');
  console.log('  Seed complete!');
  console.log('========================================\n');
  console.log('Login credentials:\n');
  console.log('  ADMIN:');
  console.log(`    ${ADMIN.email} / ${ADMIN.password}\n`);
  console.log('  USERS:');
  for (const u of USERS) {
    console.log(`    ${u.email} / ${u.password}`);
  }
  console.log('');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
