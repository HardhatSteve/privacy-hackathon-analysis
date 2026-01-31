'use client';

import { Button } from '@/components/ui/button';
import { Plus, Settings } from 'lucide-react';
import Link from 'next/link';

export function DashboardHeader() {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor your programs' privacy scores and vulnerabilities
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/analyze">
            <Plus className="mr-2 h-4 w-4" />
            Analyze Program
          </Link>
        </Button>
      </div>
    </div>
  );
}
