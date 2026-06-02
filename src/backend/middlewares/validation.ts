import express from 'express';
import Joi from 'joi';

export const validateLogin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const schema = Joi.object({
    username: Joi.string().allow('', null),
    avatar: Joi.string().allow('', null),
    provider: Joi.string().allow('', null)
  }).unknown(true);
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

export const validateUpdateMe = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const schema = Joi.object({
    username: Joi.string().optional(),
    preferences: Joi.object().optional(),
    proPassUnlocked: Joi.boolean().optional(),
    wins: Joi.number().optional(),
    losses: Joi.number().optional(),
    totalScore: Joi.number().optional(),
    level: Joi.number().optional(),
    challengesDone: Joi.number().optional(),
    recentScores: Joi.array().items(Joi.number()).optional()
  }).unknown(true);
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

export const validateGenerateChallenge = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const schema = Joi.object({
    level: Joi.string().valid("Débutant", "Intermédiaire", "Avancé").optional(),
    category: Joi.string().optional(),
    customPrompt: Joi.string().allow('', null).optional()
  }).unknown(true);
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

export const validateEvaluateChallenge = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const schema = Joi.object({
    challenge: Joi.object().optional().allow(null),
    userFiles: Joi.object().optional()
  }).unknown(true);
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

export const validateJoinDuel = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const schema = Joi.object({
    roomId: Joi.string().required()
  }).unknown(true);
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};

export const validateChat = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const schema = Joi.object({
    message: Joi.string().required(),
    challenge: Joi.object().optional().allow(null),
    history: Joi.array().optional()
  }).unknown(true);
  const { error } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });
  next();
};
