'use strict';

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

const TEMPLATE_DIR = path.resolve(__dirname, '../../templates/emails');

// Cache compiled templates in memory
const templateCache = new Map();

/**
 * Render an email HTML template with provided variables.
 * @param {string} templateName - Name of the template file (without .html extension)
 * @param {object} variables - Template data
 * @returns {string} Rendered HTML string
 */
const renderEmailTemplate = (templateName, variables = {}) => {
  if (!templateCache.has(templateName)) {
    const filePath = path.join(TEMPLATE_DIR, `${templateName}.html`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Email template not found: ${templateName}`);
    }
    const source = fs.readFileSync(filePath, 'utf-8');
    templateCache.set(templateName, Handlebars.compile(source));
  }

  return templateCache.get(templateName)(variables);
};

module.exports = { renderEmailTemplate };
