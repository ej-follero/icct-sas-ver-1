#!/usr/bin/env node

/**
 * Script to automatically fix XSS vulnerabilities in the codebase
 * Replaces dangerous dangerouslySetInnerHTML usages with safe alternatives
 */

const fs = require('fs');
const path = require('path');

// Files to process
const filesToProcess = [
  'src/app/(dashboard)/list/attendance/instructors/page.tsx',
  'src/app/(dashboard)/list/departments/page.tsx',
  'src/app/(dashboard)/list/rfid/logs/page.tsx',
  'src/app/(dashboard)/list/rfid/readers/page.tsx',
  'src/app/(dashboard)/list/rfid/tags/page.tsx',
  'src/app/(dashboard)/list/users/page.tsx',
  'src/app/(dashboard)/list/rooms/page.tsx'
];

// Patterns to fix
const patterns = [
  // Replace highlightMatch with safeHighlight
  {
    search: /dangerouslySetInnerHTML=\{\{\s*__html:\s*highlightMatch\(/g,
    replace: 'dangerouslySetInnerHTML={{ __html: safeHighlight('
  }
];

function addImportIfNeeded(content, filePath) {
  // Check if safeHighlight import already exists
  if (content.includes('safeHighlight')) {
    return content;
  }

  // Find the last import statement
  const importLines = content.split('\n');
  let lastImportIndex = -1;
  
  for (let i = 0; i < importLines.length; i++) {
    if (importLines[i].trim().startsWith('import ')) {
      lastImportIndex = i;
    }
  }

  if (lastImportIndex >= 0) {
    // Add the import after the last existing import
    importLines.splice(lastImportIndex + 1, 0, 'import { safeHighlight } from "@/lib/sanitizer";');
    return importLines.join('\n');
  }

  // If no imports found, add at the beginning after "use client"
  const lines = content.split('\n');
  const useClientIndex = lines.findIndex(line => line.includes('"use client"'));
  
  if (useClientIndex >= 0) {
    lines.splice(useClientIndex + 2, 0, 'import { safeHighlight } from "@/lib/sanitizer";');
    return lines.join('\n');
  }

  // Fallback: add at the beginning
  return 'import { safeHighlight } from "@/lib/sanitizer";\n' + content;
}

function processFile(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    // Check if file contains dangerouslySetInnerHTML with highlightMatch
    if (content.includes('dangerouslySetInnerHTML') && content.includes('highlightMatch')) {
      console.log(`🔍 Processing: ${filePath}`);
      
      // Add import if needed
      content = addImportIfNeeded(content, filePath);
      
      // Apply patterns
      patterns.forEach(pattern => {
        const matches = content.match(pattern.search);
        if (matches) {
          console.log(`  ✅ Found ${matches.length} instances to fix`);
          content = content.replace(pattern.search, pattern.replace);
          modified = true;
        }
      });

      if (modified) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`  ✅ Fixed: ${filePath}`);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔒 Fixing XSS vulnerabilities...\n');
  
  let processedCount = 0;
  let fixedCount = 0;

  filesToProcess.forEach(filePath => {
    processedCount++;
    if (processFile(filePath)) {
      fixedCount++;
    }
  });

  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${processedCount}`);
  console.log(`   Files fixed: ${fixedCount}`);
  
  if (fixedCount > 0) {
    console.log(`\n✅ XSS vulnerabilities have been fixed!`);
    console.log(`\n⚠️  Next steps:`);
    console.log(`   1. Test the affected pages to ensure they still work correctly`);
    console.log(`   2. Review the changes to make sure highlighting still works`);
    console.log(`   3. Run the application to verify no TypeScript errors`);
  } else {
    console.log(`\n✅ No XSS vulnerabilities found in the specified files.`);
  }
}

// Run the script
main();
