#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const files = [
  'src/__tests__/access-control/integration.test.ts',
  'src/__tests__/middleware/tier-protection.test.ts',
  'src/__tests__/security/tier-bypass-attempts.test.ts',
  'src/app/(authenticated)/dashboard/enterprise/page.tsx',
  'src/app/admin/test-tiers/page.tsx',
  'src/app/api/admin/audit-log/route.ts',
  'src/app/api/admin/security/alerts/[alertId]/acknowledge/route.ts',
  'src/app/api/admin/security/alerts/[alertId]/resolve/route.ts',
  'src/app/api/admin/security/dashboard/route.ts',
  'src/app/api/admin/temporary-access/route.ts',
  'src/app/api/admin/tier-overrides/route.ts',
  'src/app/api/admin/tier-stats/route.ts',
  'src/app/api/admin/users/[userId]/tier-info/route.ts',
  'src/app/api/admin/users/search/route.ts',
  'src/app/dashboard/page.tsx',
  'src/app/onboarding/page.tsx',
  'src/app/sign-in/[[...sign-in]]/page.tsx',
  'src/app/sign-up/[[...sign-up]]/page.tsx',
  'src/app/subscription/success/page.tsx',
  'src/components/dashboard/enterprise/ProfessionalIntegration.tsx',
  'src/components/layout/navbar.tsx',
  'src/components/providers/conditional-clerk-provider.tsx',
  'src/hooks/use-clerk-auth.ts',
  'src/hooks/use-safe-clerk.ts',
  'src/hooks/useSubscriptionUpgrade.ts',
  'src/hooks/useTierAccess.ts',
  'src/lib/access-control/hooks.tsx',
  'src/lib/admin/tier-admin-controls.ts',
  'src/lib/auth/clerk-tier-integration.ts',
  'src/lib/auth/helpers.ts',
  'src/lib/security/middleware.ts',
  'src/lib/subscription/user-subscription.ts',
  'src/middleware/tier-protection.ts'
];

files.forEach(file => {
  const filePath = path.join(__dirname, '..', file);

  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Fix auth import
  if (content.includes("import { auth } from '@clerk/nextjs'") ||
      content.includes('import { auth } from "@clerk/nextjs"')) {
    content = content.replace(
      /import\s*{\s*auth\s*}\s*from\s*['"]@clerk\/nextjs['"]/g,
      "import { auth } from '@clerk/nextjs/server'"
    );
    modified = true;
  }

  // Fix currentUser import
  if (content.includes("import { currentUser } from '@clerk/nextjs'") ||
      content.includes('import { currentUser } from "@clerk/nextjs"')) {
    content = content.replace(
      /import\s*{\s*currentUser\s*}\s*from\s*['"]@clerk\/nextjs['"]/g,
      "import { currentUser } from '@clerk/nextjs/server'"
    );
    modified = true;
  }

  // Fix combined imports (auth, currentUser)
  if (content.includes("from '@clerk/nextjs'") || content.includes('from "@clerk/nextjs"')) {
    // Handle multi-line imports
    content = content.replace(
      /import\s*{\s*([^}]*(?:auth|currentUser)[^}]*)\s*}\s*from\s*['"]@clerk\/nextjs['"]/g,
      (match, imports) => {
        // Check what's being imported
        const hasAuth = imports.includes('auth');
        const hasCurrentUser = imports.includes('currentUser');

        // Extract other imports (not auth or currentUser)
        const otherImports = imports
          .split(',')
          .map(i => i.trim())
          .filter(i => i !== 'auth' && i !== 'currentUser');

        let result = [];

        // Server imports (auth, currentUser)
        const serverImports = [];
        if (hasAuth) serverImports.push('auth');
        if (hasCurrentUser) serverImports.push('currentUser');

        if (serverImports.length > 0) {
          result.push(`import { ${serverImports.join(', ')} } from '@clerk/nextjs/server'`);
        }

        // Client imports (everything else)
        if (otherImports.length > 0) {
          result.push(`import { ${otherImports.join(', ')} } from '@clerk/nextjs'`);
        }

        return result.join('\n');
      }
    );
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed: ${file}`);
  } else {
    console.log(`⏭️  Skipped: ${file} (no changes needed)`);
  }
});

console.log('\n✨ Clerk import fixes complete!');