import { z } from 'zod';

// JSON validation schemas
export const chartDataSchema = z.object({
  labels: z.array(z.string()),
  datasets: z.array(z.object({
    label: z.string(),
    data: z.array(z.number()),
    backgroundColor: z.string().optional(),
    borderColor: z.string().optional(),
  }))
});

export const studentInfoSchema = z.object({
  studentName: z.string(),
  studentId: z.string(),
  className: z.string().optional(),
  teacherName: z.string().optional(),
  academicYear: z.string().optional(),
  grade: z.string().optional(),
});

export const scoreDataSchema = z.object({
  subjects: z.array(z.object({
    name: z.string(),
    score: z.number().min(0).max(100),
    grade: z.string(),
    maxScore: z.number().optional(),
  })),
  overallGrade: z.string().optional(),
  gpa: z.number().min(0).max(4).optional(),
  rank: z.number().positive().optional(),
});

export const templateDataSchema = z.object({
  studentName: z.string(),
  studentId: z.string(),
  className: z.string().optional(),
  teacherName: z.string().optional(),
  academicYear: z.string().optional(),
  grade: z.string().optional(),
  mathScore: z.number().min(0).max(100).optional(),
  mathGrade: z.string().optional(),
  scienceScore: z.number().min(0).max(100).optional(),
  scienceGrade: z.string().optional(),
  englishScore: z.number().min(0).max(100).optional(),
  englishGrade: z.string().optional(),
  overallGrade: z.string().optional(),
  gpa: z.number().min(0).max(4).optional(),
  rank: z.number().positive().optional(),
});

// Enhanced validation functions with detailed error reporting
export function validateJSON(jsonString: string): { isValid: boolean; data?: any; error?: string; details?: string[] } {
  if (!jsonString.trim()) {
    return { isValid: false, error: 'Empty input', details: ['Please provide JSON data'] };
  }

  try {
    const data = JSON.parse(jsonString);
    return { isValid: true, data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Invalid JSON format';
    const details = [];
    
    // Provide specific guidance based on common JSON errors
    if (errorMessage.includes('Unexpected token')) {
      details.push('Check for missing quotes around strings');
      details.push('Ensure all brackets and braces are properly closed');
      details.push('Remove trailing commas');
    }
    
    if (errorMessage.includes('Unexpected end')) {
      details.push('Missing closing bracket or brace');
      details.push('Check that all objects and arrays are properly closed');
    }
    
    return { 
      isValid: false, 
      error: errorMessage,
      details: details.length > 0 ? details : ['Please check JSON syntax']
    };
  }
}

export function validateChartData(data: any): { isValid: boolean; data?: any; error?: string; details?: string[] } {
  try {
    const validatedData = chartDataSchema.parse(data);
    
    // Additional validation for chart data quality
    const details = [];
    if (validatedData.labels.length === 0) {
      details.push('At least one label is required');
    }
    if (validatedData.datasets.length === 0) {
      details.push('At least one dataset is required');
    }
    if (validatedData.datasets[0]?.data.length !== validatedData.labels.length) {
      details.push('Number of data points must match number of labels');
    }
    
    return { isValid: true, data: validatedData, details };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.errors.map(err => `${err.message} at ${err.path.join('.')}`);
      return { 
        isValid: false, 
        error: `Chart data validation failed`,
        details
      };
    }
    return { isValid: false, error: 'Invalid chart data format' };
  }
}

export function validateStudentInfo(data: any): { isValid: boolean; data?: any; error?: string } {
  try {
    const validatedData = studentInfoSchema.parse(data);
    return { isValid: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return { 
        isValid: false, 
        error: `Student info validation error: ${firstError.message} at ${firstError.path.join('.')}` 
      };
    }
    return { isValid: false, error: 'Invalid student info format' };
  }
}

export function validateScoreData(data: any): { isValid: boolean; data?: any; error?: string } {
  try {
    const validatedData = scoreDataSchema.parse(data);
    return { isValid: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return { 
        isValid: false, 
        error: `Score data validation error: ${firstError.message} at ${firstError.path.join('.')}` 
      };
    }
    return { isValid: false, error: 'Invalid score data format' };
  }
}

export function validateTemplateData(data: any): { isValid: boolean; data?: any; error?: string; details?: string[] } {
  try {
    const validatedData = templateDataSchema.parse(data);
    
    // Additional validation warnings
    const details = [];
    if (!data.studentName) details.push('Student name is required');
    if (!data.studentId) details.push('Student ID is required');
    
    const scoreFields = ['mathScore', 'scienceScore', 'englishScore'];
    const hasAnyScore = scoreFields.some(field => typeof data[field] === 'number');
    if (!hasAnyScore) {
      details.push('At least one subject score is recommended for complete reports');
    }
    
    return { isValid: true, data: validatedData, details };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const details = error.errors.map(err => `${err.message} at ${err.path.join('.')}`);
      return { 
        isValid: false, 
        error: `Template data validation failed`,
        details
      };
    }
    return { isValid: false, error: 'Invalid template data format' };
  }
}

// Auto-fix common JSON issues
export function autoFixJSON(jsonString: string): string {
  let fixed = jsonString;
  
  // Remove trailing commas
  fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
  
  // Fix unquoted keys (basic cases)
  fixed = fixed.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
  
  // Fix single quotes to double quotes
  fixed = fixed.replace(/'/g, '"');
  
  return fixed;
}

// Helper function to provide example JSON structures
export function getExampleJSON(type: 'chart' | 'student' | 'score' | 'template'): string {
  switch (type) {
    case 'chart':
      return JSON.stringify({
        labels: ["Math", "Science", "English", "History"],
        datasets: [{
          label: "Test Scores",
          data: [85, 92, 78, 88],
          backgroundColor: "#3B82F6",
          borderColor: "#1D4ED8"
        }]
      }, null, 2);
    
    case 'student':
      return JSON.stringify({
        studentName: "John Doe",
        studentId: "STU001",
        className: "10th Grade",
        teacherName: "Ms. Smith",
        academicYear: "2024-2025",
        grade: "10"
      }, null, 2);
    
    case 'score':
      return JSON.stringify({
        subjects: [
          { name: "Math", score: 85, grade: "B+", maxScore: 100 },
          { name: "Science", score: 92, grade: "A-", maxScore: 100 },
          { name: "English", score: 78, grade: "B", maxScore: 100 }
        ],
        overallGrade: "B+",
        gpa: 3.5,
        rank: 15
      }, null, 2);
    
    case 'template':
      return JSON.stringify({
        studentName: "John Doe",
        studentId: "STU001",
        className: "10th Grade",
        teacherName: "Ms. Smith",
        academicYear: "2024-2025",
        grade: "10",
        mathScore: 85,
        mathGrade: "B+",
        scienceScore: 92,
        scienceGrade: "A-",
        englishScore: 78,
        englishGrade: "B",
        overallGrade: "B+",
        gpa: 3.5,
        rank: 15
      }, null, 2);
    
    default:
      return '{}';
  }
}