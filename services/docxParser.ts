
import JSZip from 'jszip';
import { Section } from '../types';

export const DocxParser = {
  async parseFile(file: File): Promise<Section[]> {
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(file);
    const docXml = await loadedZip.file("word/document.xml")?.async("string");
    
    if (!docXml) {
      throw new Error("Invalid .docx file: Could not find word/document.xml. Please ensure this is a standard Word document.");
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(docXml, "text/xml");
    
    // Check for parser errors
    const parserError = xmlDoc.getElementsByTagName("parsererror");
    if (parserError.length > 0) {
      throw new Error("Error parsing document XML content.");
    }

    // Get all paragraph elements
    const paragraphs = xmlDoc.getElementsByTagName("w:p");
    
    let currentSections: Section[] = [];
    let currentContent: string[] = [];
    let currentTitle = "General Introduction";
    let sectionCount = 0;

    const finalizeSection = () => {
      const contentStr = currentContent.join('\n\n').trim();
      if (contentStr.length > 0 || currentTitle !== "General Introduction") {
        let category: Section['category'] = 'Other';
        const lowerTitle = currentTitle.toLowerCase();
        
        if (lowerTitle.includes('constitution')) category = 'Constitution';
        else if (lowerTitle.includes('standing order') || lowerTitle.includes('s.o')) category = 'Standing Orders';

        currentSections.push({
          id: `imported-${sectionCount++}-${Date.now()}`,
          title: currentTitle || "Untitled Section",
          content: contentStr || "No content found in this section.",
          category,
          orderIndex: sectionCount
        });
        currentContent = [];
      }
    };

    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      
      // Extract all text nodes within this paragraph
      const textNodes = p.getElementsByTagName("w:t");
      let pText = "";
      for (let j = 0; j < textNodes.length; j++) {
        pText += textNodes[j].textContent || "";
      }

      const trimmedText = pText.trim();
      if (trimmedText.length === 0) continue;

      // Logic to identify headings
      // Most Methodist SOs or Constitution parts are short lines or start with specific keywords
      const looksLikeHeader = 
        trimmedText.toLowerCase().startsWith('standing order') || 
        trimmedText.toLowerCase().startsWith('s.o') ||
        trimmedText.toLowerCase().startsWith('constitution - section') ||
        trimmedText.toLowerCase().startsWith('part ') ||
        (trimmedText.length < 100 && /^[0-9]+\./.test(trimmedText));

      if (looksLikeHeader && trimmedText.length < 200) {
        finalizeSection();
        currentTitle = trimmedText;
      } else {
        currentContent.push(trimmedText);
      }
    }

    // Don't forget the last section
    finalizeSection();

    if (currentSections.length === 0) {
      throw new Error("No readable sections found. Please ensure the document uses standard paragraph headings.");
    }

    return currentSections;
  }
};
