const fs = require('fs');
const path = require('path');

/**
 * Helper to get nested value from object or parent context
 */
const getValue = (obj, keyPath, loopContext = {}) => {
  if (keyPath === 'this') return obj;

  // Handle array length access, like architectureImages.length
  if (keyPath.endsWith('.length')) {
    const arrPath = keyPath.substring(0, keyPath.length - 7);
    const arr = getValue(obj, arrPath, loopContext);
    return Array.isArray(arr) ? arr.length : 0;
  }

  const parts = keyPath.split('.');
  
  // Try to resolve in the current scope object
  let val = parts.reduce((current, part) => {
    return current && current[part] !== undefined ? current[part] : undefined;
  }, obj);

  // If not found, try to resolve in the parent loopContext
  if (val === undefined && loopContext) {
    val = parts.reduce((current, part) => {
      return current && current[part] !== undefined ? current[part] : undefined;
    }, loopContext);
  }

  return val;
};

const findClosingTag = (html, openTagPattern, closeTag, startIndex) => {
  let depth = 1;
  let index = startIndex;
  
  while (depth > 0) {
    const slice = html.slice(index);
    const nextOpen = slice.search(openTagPattern);
    const nextClose = slice.indexOf(closeTag);
    
    if (nextClose === -1) {
      return -1; // Unmatched
    }
    
    const absOpen = nextOpen !== -1 ? index + nextOpen : -1;
    const absClose = index + nextClose;
    
    if (absOpen !== -1 && absOpen < absClose) {
      depth++;
      index = absOpen + 1;
    } else {
      depth--;
      index = absClose + 1;
      if (depth === 0) {
        return absClose;
      }
    }
  }
  return -1;
};

/**
 * Enhanced template rendering engine that supports:
 * - Simple placeholders: {{key}} / {{nested.key}}
 * - Conditional blocks: {{#if condition}}...{{/if}} (nesting safe)
 * - Iteration blocks: {{#each array}}...{{/each}} (nesting safe)
 * - Array lengths: {{array.length}}
 */
const renderTemplateString = (html, data, loopContext = {}) => {
  let result = html;

  // 1. Process {{#each arrayPath}}...{{/each}} blocks
  while (true) {
    const eachStart = result.indexOf('{{#each ');
    if (eachStart === -1) break;

    const openTagEnd = result.indexOf('}}', eachStart);
    if (openTagEnd === -1) break;

    const arrayPath = result.substring(eachStart + 8, openTagEnd).trim();
    
    // Find matching closing tag {{/each}} taking nesting into account
    const closingTagStart = findClosingTag(result, /\{\{#each\s+/, '{{/each}}', openTagEnd + 2);
    if (closingTagStart === -1) {
      // If unmatched, remove the tag to prevent infinite loop
      result = result.substring(0, eachStart) + result.substring(openTagEnd + 2);
      continue;
    }

    const blockContent = result.substring(openTagEnd + 2, closingTagStart);
    const array = getValue(data, arrayPath, loopContext);
    
    let renderedBlock = '';
    if (Array.isArray(array) && array.length > 0) {
      renderedBlock = array.map(item => {
        return renderTemplateString(blockContent, item, data);
      }).join('');
    }

    result = result.substring(0, eachStart) + renderedBlock + result.substring(closingTagStart + 10);
  }

  // 2. Process {{#if conditionPath}}...{{/if}} blocks
  while (true) {
    const ifStart = result.indexOf('{{#if ');
    if (ifStart === -1) break;

    const openTagEnd = result.indexOf('}}', ifStart);
    if (openTagEnd === -1) break;

    const conditionPath = result.substring(ifStart + 6, openTagEnd).trim();

    // Find matching closing tag {{/if}} taking nesting into account
    const closingTagStart = findClosingTag(result, /\{\{#if\s+/, '{{/if}}', openTagEnd + 2);
    if (closingTagStart === -1) {
      result = result.substring(0, ifStart) + result.substring(openTagEnd + 2);
      continue;
    }

    const blockContent = result.substring(openTagEnd + 2, closingTagStart);
    const condition = getValue(data, conditionPath, loopContext);

    let renderedBlock = '';
    if (condition) {
      renderedBlock = renderTemplateString(blockContent, data, loopContext);
    }

    result = result.substring(0, ifStart) + renderedBlock + result.substring(closingTagStart + 8);
  }

  // 3. Process simple placeholders {{keyPath}}
  const placeholderRegex = /\{\{([\w\.\#\/]+)\}\}/g;
  result = result.replace(placeholderRegex, (match, keyPath) => {
    if (keyPath.startsWith('#') || keyPath.startsWith('/')) {
      return match;
    }
    const val = getValue(data, keyPath, loopContext);
    return val !== undefined && val !== null ? val : '';
  });

  return result;
};

/**
 * Reads an HTML template from /src/templates and renders it with data.
 *
 * @param {string} templateName - File name inside src/templates (e.g. 'estimacion.html')
 * @param {object} data         - Key-value map used for replacements
 * @returns {string} The rendered HTML string
 */
const renderTemplate = (templateName, data) => {
  const templatePath = path.join(__dirname, '..', 'templates', templateName);
  const html = fs.readFileSync(templatePath, 'utf-8');
  return renderTemplateString(html, data);
};

module.exports = { renderTemplate };
