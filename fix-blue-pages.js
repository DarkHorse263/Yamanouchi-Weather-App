const fs = require('fs');
const path = require('path');

const pagesDir = 'artifacts/feelzlike/src/pages/town';
const pages = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

for (const p of pages) {
  const filePath = path.join(pagesDir, p);
  let content = fs.readFileSync(filePath, 'utf8');

  // If it's already using the blue wrapper, skip it
  if (content.includes('bg-[#0055FF]')) continue;

  // We want to add the min-h-[100dvh] wrapper with the blue/green background.
  // Many pages have something like:
  // return (
  //   <div className="px-4 md:px-10 py-4 md:py-8 max-w-6xl mx-auto">
  //     <PageMeta ... />
  // We want to replace the first <div ...> with the wrapper, and put the inner div inside.
  
  // Find the return statement and the first <div
  const returnMatch = content.match(/return\s*\(\s*(<div[^>]*>)/);
  if (returnMatch) {
    const originalDiv = returnMatch[1];
    
    // Add imports if needed
    if (!content.includes('cn(')) {
      content = content.replace(/import \{.*\} from "@workspace\/feelzlike-shell";/, (match) => {
        return match.replace('}', ', cn }');
      });
    }

    const wrapper = `<div className={cn("min-h-[100dvh] pb-8 transition-colors duration-500", (typeof pageSeason !== 'undefined' ? pageSeason : season) === "green" ? "bg-[#059669]" : "bg-[#0055FF]")}>\n      ${originalDiv}`;
    
    // Also we need to close the wrapper before the last closing div.
    // This is tricky using regex. Let's just do it manually.
  }
}
