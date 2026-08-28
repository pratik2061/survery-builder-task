import { z } from "zod";

export const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export const QuestionSchema = z.object({
  id: z.string(),
  type: z.enum(["text", "single", "multiple", "rating"]),
  text: z.string().min(1, "Question text is required"),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  conditionalLogic: z.object({
    dependsOnId: z.string(),
    equalsValue: z.string()
  }).optional()
});

export const CreateSurveySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  questions: z.array(QuestionSchema)
});

export const SubmitResponseSchema = z.object({
  answers: z.record(z.string(), z.any())
});
