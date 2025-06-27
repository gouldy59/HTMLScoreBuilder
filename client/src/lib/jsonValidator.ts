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

// Validation functions
export function validateJSON(jsonString: string): { isValid: boolean; data?: any; error?: string } {
  try {
    const data = JSON.parse(jsonString);
    return { isValid: true, data };
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Invalid JSON format' 
    };
  }
}

export function validateChartData(data: any): { isValid: boolean; data?: any; error?: string } {
  try {
    const validatedData = chartDataSchema.parse(data);
    return { isValid: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return { 
        isValid: false, 
        error: `Chart data validation error: ${firstError.message} at ${firstError.path.join('.')}` 
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

export function validateTemplateData(data: any): { isValid: boolean; data?: any; error?: string } {
  try {
    const validatedData = templateDataSchema.parse(data);
    return { isValid: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return { 
        isValid: false, 
        error: `Template data validation error: ${firstError.message} at ${firstError.path.join('.')}` 
      };
    }
    return { isValid: false, error: 'Invalid template data format' };
  }
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