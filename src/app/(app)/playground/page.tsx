'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioCardGroup, RadioCardItem } from '@/components/ui/radio-card';
import { Chip } from '@/components/ui/chip';
import { Pill } from '@/components/ui/pill';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar } from '@/components/ui/avatar';
import { ProgressBar } from '@/components/ui/progress-bar';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Sigil } from '@/components/ui/sigil';
import { Kbd } from '@/components/ui/kbd';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const STATUSES = [
  'draft',
  'in_review',
  'reviewed',
  'refined',
  'final',
  'blocked',
  'approved',
  'shipped',
  'archived',
] as const;

export default function PlaygroundPage() {
  const [radioVal, setRadioVal] = useState('a');
  const [activeChip, setActiveChip] = useState('all');

  return (
    <TooltipProvider>
      <div className="mx-auto max-w-4xl space-y-xl p-xl">
        <h1 className="font-display text-2xl font-bold">Component Playground</h1>
        <p className="text-sm text-ink-secondary">
          Dev-only page to visually verify all 21 base UI components.
        </p>

        <Separator />

        {/* Buttons */}
        <Section title="Button">
          <div className="flex flex-wrap items-center gap-sm">
            <Button variant="primary-fill">Primary Fill</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          <div className="mt-sm flex flex-wrap items-center gap-sm">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
          </div>
        </Section>

        <Separator />

        {/* Input & Textarea */}
        <Section title="Input & Textarea">
          <Input placeholder="Type something..." />
          <Textarea placeholder="Multi-line input..." className="mt-sm" />
        </Section>

        <Separator />

        {/* Checkbox */}
        <Section title="Checkbox">
          <div className="flex items-center gap-sm">
            <Checkbox id="check1" />
            <label htmlFor="check1" className="text-sm">
              Accept terms
            </label>
          </div>
        </Section>

        <Separator />

        {/* Radio Card */}
        <Section title="Radio Card">
          <RadioCardGroup value={radioVal} onValueChange={setRadioVal}>
            <RadioCardItem value="a">
              <p className="text-sm font-medium">Option A</p>
              <p className="text-xs text-ink-secondary">Description for A</p>
            </RadioCardItem>
            <RadioCardItem value="b">
              <p className="text-sm font-medium">Option B</p>
              <p className="text-xs text-ink-secondary">Description for B</p>
            </RadioCardItem>
            <RadioCardItem value="c">
              <p className="text-sm font-medium">Option C</p>
              <p className="text-xs text-ink-secondary">Description for C</p>
            </RadioCardItem>
          </RadioCardGroup>
        </Section>

        <Separator />

        {/* Chip */}
        <Section title="Chip">
          <div className="flex gap-xs">
            {['all', 'active', 'draft', 'archived'].map((c) => (
              <Chip key={c} active={activeChip === c} onClick={() => setActiveChip(c)}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </Chip>
            ))}
          </div>
        </Section>

        <Separator />

        {/* Pill — all 9 statuses */}
        <Section title="Pill (9 statuses)">
          <div className="flex flex-wrap gap-sm">
            {STATUSES.map((s) => (
              <Pill key={s} status={s} />
            ))}
          </div>
        </Section>

        <Separator />

        {/* Card */}
        <Section title="Card">
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Card description goes here.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Card content area.</p>
            </CardContent>
          </Card>
        </Section>

        <Separator />

        {/* Tabs */}
        <Section title="Tabs (underline)">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">Overview tab content</TabsContent>
            <TabsContent value="details">Details tab content</TabsContent>
            <TabsContent value="settings">Settings tab content</TabsContent>
          </Tabs>
        </Section>

        <Separator />

        {/* Tooltip */}
        <Section title="Tooltip">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline">Hover me</Button>
            </TooltipTrigger>
            <TooltipContent>Tooltip content here</TooltipContent>
          </Tooltip>
        </Section>

        <Separator />

        {/* Avatar */}
        <Section title="Avatar">
          <div className="flex items-center gap-sm">
            <Avatar name="Maya Reyes" size="sm" />
            <Avatar name="John Doe" size="md" />
            <Avatar name="Alice Wonderland" size="lg" />
            <Avatar name="Bob" size="md" />
            <Avatar name="Charlie Delta" size="md" />
          </div>
        </Section>

        <Separator />

        {/* Progress Bar */}
        <Section title="Progress Bar">
          <div className="space-y-sm">
            <ProgressBar value={25} />
            <ProgressBar value={60} />
            <ProgressBar value={100} />
          </div>
        </Section>

        <Separator />

        {/* Progress Ring */}
        <Section title="Progress Ring">
          <div className="flex items-center gap-lg">
            <ProgressRing value={72} size={64}>
              <span className="font-mono text-xs text-ink-primary">72</span>
            </ProgressRing>
            <ProgressRing value={45} size={96}>
              <span className="font-mono text-sm text-ink-primary">45%</span>
            </ProgressRing>
            <ProgressRing value={90} size={120}>
              <span className="font-mono text-base text-ink-primary">90</span>
            </ProgressRing>
          </div>
        </Section>

        <Separator />

        {/* Skeleton */}
        <Section title="Skeleton">
          <div className="space-y-sm">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </div>
        </Section>

        <Separator />

        {/* Sigil */}
        <Section title="Sigil">
          <Sigil
            section={4}
            sectionName="Editor"
            artboardId="A012"
            artboardName="Editor — Default"
          />
        </Section>

        <Separator />

        {/* Kbd */}
        <Section title="Kbd">
          <div className="flex items-center gap-sm">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
            <span className="text-sm text-ink-secondary">Command Palette</span>
          </div>
        </Section>
      </div>
    </TooltipProvider>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-md font-mono text-xs uppercase tracking-wider text-ink-tertiary">
        {title}
      </h2>
      {children}
    </section>
  );
}
