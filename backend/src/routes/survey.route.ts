import { Router } from "express";
import { 
  createSurvey, 
  getSurveys, 
  getSurveyById, 
  submitResponse, 
  getSurveyAnalytics 
} from "../controller/survey.controller";
import { requireAuth } from "../middleware/auth.middleware";

const surveyRouter = Router();

surveyRouter.post("/", requireAuth, createSurvey);
surveyRouter.get("/", requireAuth, getSurveys);
surveyRouter.get("/:id", getSurveyById);
surveyRouter.post("/:id/responses", submitResponse);
surveyRouter.get("/:id/analytics", requireAuth, getSurveyAnalytics);

export default surveyRouter;
