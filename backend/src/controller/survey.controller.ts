import { Request, Response } from "express";
import { CreateSurveySchema, SubmitResponseSchema } from "../types/schema";
import prisma from "../db";


export const createSurvey = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = CreateSurveySchema.parse(req.body);

    const survey = await prisma.survey.create({
      data: {
        title: validated.title,
        description: validated.description,
        questions: validated.questions,
      },
    });

    res.status(201).json(survey);
  } catch (error: any) {
    res.status(400).json({ error: error.errors || error.message });
  }
};

export const getSurveys = async (req: Request, res: Response): Promise<void> => {
  try {
    const surveys = await prisma.survey.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(surveys);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getSurveyById = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;

    const survey = await prisma.survey.findUnique({
      where: { id: id }
    });
    if (!survey) {
      res.status(404).json({ error: "Survey not found" });
      return;
    }

    res.json(survey);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const submitResponse = async (req: Request, res: Response): Promise<void> => {
  try {
    const validated = SubmitResponseSchema.parse(req.body);
    const id = req.params.id as string;
    const survey = await prisma.survey.findUnique({ where: { id: id } });

    if (!survey) {
      res.status(404).json({ error: "Survey not found" });
      return;
    }

    const response = await prisma.response.create({
      data: {
        surveyId: id,
        answers: validated.answers as any
      }
    });

    res.status(201).json(response);
  } catch (error: any) {
    res.status(400).json({ error: error.errors || error.message });
  }
};

export const getSurveyAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const survey = await prisma.survey.findUnique({
      where: { id: id },
      include: {
        responses: true
      }
    });

    if (!survey) {
      res.status(404).json({ error: "Survey not found" });
      return;
    }

    const surveyWithResponses = survey as any;
    const totalResponses = surveyWithResponses.responses.length;

    res.json({
      survey: surveyWithResponses,
      totalResponses: totalResponses,
      responses: surveyWithResponses.responses
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
