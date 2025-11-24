import React from 'react';

/**
 * Converts URLs in text to clickable links.
 * This function properly handles mixed text and URLs.
 * 
 * @param text - The text containing potential URLs
 * @returns React elements with clickable links
 */
export function makeLinksClickable(text: string) {
  if (!text) return null;
  
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    // Create a NEW regex without the 'g' flag to test each part
    const isUrl = /^https?:\/\/[^\s]+$/.test(part);
    
    if (isUrl) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline break-all"
          onClick={(e) => e.stopPropagation()} // Prevent parent click events
        >
          {part}
        </a>
      );
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
}
