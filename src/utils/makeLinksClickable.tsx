import React from 'react';

/**
 * Converts URLs, Instagram handles, and bare domains in text to clickable links.
 * Handles:
 * - Full URLs (https://example.com)
 * - www URLs (www.example.com)
 * - Bare domain URLs (example.com)
 * - Instagram handles (@username)
 * 
 * @param text - The text containing potential URLs or handles
 * @returns React elements with clickable links
 */
export function makeLinksClickable(text: string) {
  if (!text) return null;
  
  // Combined regex to match all link types in order of priority
  // 1. Full URLs (http:// or https://)
  // 2. www. URLs
  // 3. Instagram handles (@username)
  // 4. Bare domains (domain.com, domain.org, etc.)
  const combinedRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|(@[a-zA-Z0-9_\.]+)|(\b[a-zA-Z0-9][-a-zA-Z0-9]*\.(com|org|net|io|co)\b[^\s]*)/gi;
  
  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;
  let match;
  
  while ((match = combinedRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    
    const matchedText = match[0];
    let href: string;
    let displayText: string = matchedText;
    
    if (match[1]) {
      // Full URL (https:// or http://)
      href = matchedText;
    } else if (match[2]) {
      // www. URL - prepend https://
      href = `https://${matchedText}`;
    } else if (match[3]) {
      // Instagram handle - link to Instagram profile
      const username = matchedText.slice(1); // Remove @ symbol
      href = `https://instagram.com/${username}`;
    } else if (match[4]) {
      // Bare domain - prepend https://
      href = `https://${matchedText}`;
    } else {
      // Fallback (shouldn't reach here)
      href = matchedText;
    }
    
    parts.push(
      <a
        key={`link-${match.index}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800 underline break-all"
        onClick={(e) => e.stopPropagation()}
      >
        {displayText}
      </a>
    );
    
    lastIndex = match.index + matchedText.length;
  }
  
  // Add remaining text after last match
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  
  // If no matches found, return original text
  if (parts.length === 0) {
    return text;
  }
  
  return <>{parts}</>;
}
