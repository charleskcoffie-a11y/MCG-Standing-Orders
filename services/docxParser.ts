
import JSZip from 'jszip';
import { Section } from '../types';

export const DocxParser = {
  async parseFile(file: File): Promise<Section[]> {
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(file);
    const docXml = await loadedZip.file("word/document.xml")?.async("string");
    
    if (!docXml) {
      throw new Error("Invalid .docx file: Could not find internal document structure.");
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(docXml, "text/xml");
    const paragraphs = xmlDoc.getElementsByTagName("w:p");
    
    let currentSections: Section[] = [];
    let currentContent: string[] = [];
    let currentTitle = "";
    let sectionCount = 0;

    // Helper to determine if a line is a "Hard Heading"
    const isHeading = (text: string): boolean => {
      const trimmed = text.trim();
      if (!trimmed) return false;

      // 1. Explicit Keywords (Case insensitive)
      const keywords = /^(standing order|s\.o\.?|constitution|part|section|chapter|appendix)/i;
      if (keywords.test(trimmed)) return true;
      
      // 2. Numbered headings with strong pattern: "1. ", "12. ", "2) "
      // Must have at least 2 characters of text after the number/dot to be a title
      const numberedPattern = /^\d+[\.\)]\s+.{2,}/;
      if (numberedPattern.test(trimmed) && trimmed.length < 100) return true;

      // 3. All Caps short lines (typically section headers)
      if (trimmed.length > 3 && trimmed.length < 50 && trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) {
        return true;
      }

      return false;
    };

    const finalizeSection = () => {
      const titleToUse = currentTitle.trim();
      if (titleToUse) {
        let category: Section['category'] = 'Other';
        const lowerTitle = titleToUse.toLowerCase();
        
        if (lowerTitle.includes('constitution')) category = 'Constitution';
        else if (lowerTitle.includes('standing order') || lowerTitle.includes('s.o') || /^\d+/.test(lowerTitle)) {
           category = 'Standing Orders';
        }

        // IMPORTANT: Join with double newline to preserve paragraph separation
        const contentStr = currentContent.join('\n\n').trim();

        currentSections.push({
          id: `imported-${sectionCount++}-${Date.now()}`,
          title: titleToUse,
          // Content fallback: If greedy capture failed, use the title as info
          content: contentStr || `Detailed provision for ${titleToUse}`,
          category,
          orderIndex: sectionCount
        });
        
        currentContent = [];
        currentTitle = "";
      }
    };

    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      const textNodes = p.getElementsByTagName("w:t");
      let pText = "";
      for (let j = 0; j < textNodes.length; j++) {
        pText += textNodes[j].textContent || "";
      }

      const cleanLine = pText.replace(/[\u00A0\u1680\u180E\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ').trim();
      
      if (!cleanLine) continue;

      if (isHeading(cleanLine)) {
        if (currentTitle) {
          finalizeSection();
        }
        currentTitle = cleanLine;
      } else {
        if (currentTitle) {
          currentContent.push(cleanLine);
        } else {
          // Captures leading text before any heading
          currentTitle = cleanLine;
        }
      }
    }

    finalizeSection();

    if (currentSections.length === 0) {
      // Emergency full-text extraction
      let allText = "";
      for (let i = 0; i < paragraphs.length; i++) {
        const textNodes = paragraphs[i].getElementsByTagName("w:t");
        let line = "";
        for (let j = 0; j < textNodes.length; j++) line += textNodes[j].textContent || "";
        if (line.trim()) allText += line.trim() + "\n\n";
      }

      if (allText.trim()) {
        return [{
          id: `emergency-${Date.now()}`,
          title: "Imported Document (Full)",
          content: allText.trim(),
          category: 'Other',
          orderIndex: 0
        }];
      }
      throw new Error("No readable text found in the .docx file.");
    }

    return currentSections;
  }
};
