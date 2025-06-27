export function replaceVariables(template: string, data: Record<string, any>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
    return data.hasOwnProperty(variable) ? String(data[variable]) : match;
  });
}

export function extractVariables(template: string): string[] {
  const matches = template.match(/\{\{(\w+)\}\}/g);
  if (!matches) return [];
  
  return [...new Set(matches.map(match => match.slice(2, -2)))];
}

export function validateVariables(template: string, availableVariables: string[]): string[] {
  const usedVariables = extractVariables(template);
  return usedVariables.filter(variable => !availableVariables.includes(variable));
}
