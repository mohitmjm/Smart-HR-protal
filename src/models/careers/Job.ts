import type { Model } from 'mongoose';
import { connectCareersDB } from '../../lib/mongodb';
import BaseJob, { IJob } from '../Job';

let cachedModel: Model<IJob> | null = null;

export async function getCareersJobModel(): Promise<Model<IJob>> {
  if (cachedModel) return cachedModel;
  const conn = await connectCareersDB();
  const schema = BaseJob.schema;
  cachedModel = (conn.models.Job as Model<IJob>) || conn.model<IJob>('Job', schema);
  return cachedModel;
}

export type CareersJobModel = Model<IJob>;

