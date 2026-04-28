import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://127.0.0.1:54321';
const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface SeedUser {
  email: string;
  password: string;
  fullName: string;
}

const USERS: SeedUser[] = [
  { email: 'maya@algonetwork.id', password: 'demo1234', fullName: 'Maya Reyes' },
  { email: 'rizky@algonetwork.id', password: 'demo1234', fullName: 'Rizky Pratama' },
  { email: 'sari@algonetwork.id', password: 'demo1234', fullName: 'Sari Wijaya' },
  { email: 'daniel@algonetwork.id', password: 'demo1234', fullName: 'Daniel Oh' },
];

const PRDS = [
  {
    title: 'Wallet Redesign Q2 — KYC Tier-2',
    project_tag: 'Q2 2026 Growth',
    status: 'in_review' as const,
    health_score: 86,
    word_count: 3200,
    ownerIndex: 0,
  },
  {
    title: 'Onboarding Revamp — 3G Optimization',
    project_tag: 'Growth Indonesia',
    status: 'draft' as const,
    health_score: 54,
    word_count: 1800,
    ownerIndex: 1,
  },
  {
    title: 'Real-time Collaboration v2',
    project_tag: 'Platform',
    status: 'refined' as const,
    health_score: 92,
    word_count: 4500,
    ownerIndex: 3,
  },
  {
    title: 'Payment Gateway Integration — Dana + GoPay',
    project_tag: 'Payments',
    status: 'final' as const,
    health_score: 95,
    word_count: 5200,
    ownerIndex: 0,
  },
  {
    title: 'Push Notification Service RFC',
    project_tag: 'Infrastructure',
    status: 'draft' as const,
    health_score: 42,
    word_count: 900,
    ownerIndex: 2,
  },
  {
    title: 'Analytics Dashboard Revamp',
    project_tag: 'Data Platform',
    status: 'reviewed' as const,
    health_score: 78,
    word_count: 2800,
    ownerIndex: 1,
  },
  {
    title: 'User Segmentation Engine',
    project_tag: 'Growth Indonesia',
    status: 'in_review' as const,
    health_score: 71,
    word_count: 3400,
    ownerIndex: 2,
  },
  {
    title: 'Mobile App Performance Audit',
    project_tag: 'Platform',
    status: 'draft' as const,
    health_score: 35,
    word_count: 600,
    ownerIndex: 3,
  },
];

async function seed() {
  console.log('Seeding database...\n');

  // 1. Create users
  const userIds: string[] = [];
  for (const u of USERS) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.fullName },
    });
    if (error) {
      console.error(`Failed to create user ${u.email}:`, error.message);
      continue;
    }
    userIds.push(data.user.id);
    console.log(`  User: ${u.fullName} (${u.email}) → ${data.user.id}`);
  }

  if (userIds.length < 4) {
    console.error('\nNot enough users created. Aborting.');
    process.exit(1);
  }

  // Update profiles with onboarding data
  for (let i = 0; i < USERS.length; i++) {
    await supabase
      .from('profiles')
      .update({
        role_self_reported: 'Product Manager',
        experience_level: i === 0 ? 'expert' : 'intermediate',
        primary_use_cases: ['Feature PRD', 'RFC'],
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', userIds[i]);
  }

  // 2. Create workspaces
  const { data: ws1 } = await supabase
    .from('workspaces')
    .insert({
      name: 'Algo Network · Product',
      slug: 'algo-product',
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
      name: 'Algo Network · Growth',
      slug: 'algo-growth',
      icon_pattern: 'rounded',
      is_private: true,
      industry: 'Technology',
      team_size: '2-10',
      owner_id: userIds[1],
    })
    .select()
    .single();

  console.log(`\n  Workspace: ${ws1?.name} → ${ws1?.id}`);
  console.log(`  Workspace: ${ws2?.name} → ${ws2?.id}`);

  // 3. Add members
  const memberInserts = [
    // All 4 in ws1
    { workspace_id: ws1!.id, user_id: userIds[0], role: 'admin' },
    { workspace_id: ws1!.id, user_id: userIds[1], role: 'editor' },
    { workspace_id: ws1!.id, user_id: userIds[2], role: 'editor' },
    { workspace_id: ws1!.id, user_id: userIds[3], role: 'commenter' },
    // Maya + Rizky in ws2
    { workspace_id: ws2!.id, user_id: userIds[0], role: 'editor' },
    { workspace_id: ws2!.id, user_id: userIds[1], role: 'admin' },
  ];

  await supabase.from('workspace_members').insert(memberInserts);
  console.log(`\n  Members: ${memberInserts.length} added`);

  // 4. Create PRDs
  const emptyContent = {
    version: 1,
    metadata: { title: '', locale: 'mixed' },
    sections: {
      overview: { content: {}, word_count: 0, ai_generated: false },
      problem_statement: { content: {}, word_count: 0, ai_generated: false },
    },
  };

  let prdCount = 0;
  for (const prd of PRDS) {
    const ownerId = userIds[prd.ownerIndex];
    const { data: inserted, error } = await supabase
      .from('prds')
      .insert({
        workspace_id: ws1!.id,
        owner_id: ownerId!,
        title: prd.title,
        project_tag: prd.project_tag,
        status: prd.status,
        health_score: prd.health_score,
        health_breakdown: {
          completeness: Math.min(100, prd.health_score + 5),
          specificity: Math.max(0, prd.health_score - 10),
          structural: prd.health_score,
          consistency: Math.min(100, prd.health_score + 3),
        },
        word_count: prd.word_count,
        read_time_minutes: Math.ceil(prd.word_count / 250),
        content: emptyContent,
      })
      .select('id')
      .single();

    if (error) {
      console.error(`  Failed PRD "${prd.title}":`, error.message);
      continue;
    }

    prdCount++;

    // Create a version
    await supabase.from('prd_versions').insert({
      prd_id: inserted!.id,
      version_number: 1,
      content: emptyContent,
      change_summary: 'Initial draft',
      created_by: ownerId,
      source: 'manual',
    });

    // Create activity log entry
    await supabase.from('activity_log').insert({
      workspace_id: ws1!.id,
      actor_id: ownerId,
      type: 'prd_created',
      resource_type: 'prd',
      resource_id: inserted!.id,
      metadata: { title: prd.title },
    });
  }

  console.log(`  PRDs: ${prdCount} created`);

  // 5. Add some comments
  const { data: allPrds } = await supabase
    .from('prds')
    .select('id')
    .eq('workspace_id', ws1!.id)
    .limit(3);

  if (allPrds) {
    for (const prd of allPrds) {
      await supabase.from('comments').insert({
        prd_id: prd.id,
        author_id: userIds[Math.floor(Math.random() * 4)],
        body: 'Looks good overall. A few suggestions on the scope section — can we narrow the out-of-scope items?',
        section_key: 'scope',
      });

      await supabase.from('activity_log').insert({
        workspace_id: ws1!.id,
        actor_id: userIds[Math.floor(Math.random() * 4)],
        type: 'comment_added',
        resource_type: 'prd',
        resource_id: prd.id,
        metadata: {},
      });
    }
    console.log(`  Comments: ${allPrds.length} added`);
  }

  // 6. Add notifications for Maya
  await supabase.from('notifications').insert([
    {
      recipient_id: userIds[0],
      workspace_id: ws1!.id,
      type: 'review_request',
      title: 'Review requested on Analytics Dashboard',
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
  ]);
  console.log('  Notifications: 2 added for Maya');

  console.log('\nSeed complete!');
  console.log('\nLogin credentials:');
  for (const u of USERS) {
    console.log(`  ${u.email} / ${u.password}`);
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
