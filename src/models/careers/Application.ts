import type { Model } from 'mongoose';
import { connectCareersDB } from '../../lib/mongodb';
import BaseApplication, { IApplication } from '../Application';

let cachedModel: Model<IApplication> | null = null;

export async function getCareersApplicationModel(): Promise<Model<IApplication>> {
  if (cachedModel) return cachedModel;
  const conn = await connectCareersDB();
  const schema = BaseApplication.schema;
  cachedModel = (conn.models.Application as Model<IApplication>) || conn.model<IApplication>('Application', schema);
  return cachedModel;
}

export type CareersApplicationModel = Model<IApplication>;

