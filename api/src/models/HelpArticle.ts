import mongoose, { Schema } from 'mongoose';

export interface IHelpStep {
  stepNumber: number;
  title: string;
  description: string;
}

export interface IHelpScreenshot {
  url: string;
  caption: string;
  altText: string;
}

export interface IHelpArticle {
  _id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  categoryId: string;
  module: string | null;
  featureKey: string | null;
  roles: string[];
  tags: string[];
  relatedRoutes: string[];
  steps: IHelpStep[];
  screenshots: IHelpScreenshot[];
  order: number;
  status: 'published' | 'draft';
  createdAt: Date;
  updatedAt: Date;
}

const HelpArticleSchema = new Schema<IHelpArticle>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  summary: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  categoryId: {
    type: Schema.Types.ObjectId as any,
    ref: 'HelpCategory',
    required: true
  },
  module: {
    type: String,
    default: null
  },
  featureKey: {
    type: String,
    default: null
  },
  roles: [{
    type: String
  }],
  tags: [{
    type: String,
    trim: true
  }],
  relatedRoutes: [{
    type: String,
    trim: true
  }],
  steps: [{
    stepNumber: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true }
  }],
  screenshots: [{
    url: { type: String, required: true },
    caption: { type: String, default: '' },
    altText: { type: String, default: '' }
  }],
  order: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    enum: ['published', 'draft'],
    default: 'published'
  }
}, {
  timestamps: true
});

HelpArticleSchema.index({ slug: 1 }, { unique: true });
HelpArticleSchema.index({ categoryId: 1, order: 1 });
HelpArticleSchema.index({ module: 1 });
HelpArticleSchema.index({ featureKey: 1 });
HelpArticleSchema.index({ relatedRoutes: 1 });
HelpArticleSchema.index({ status: 1 });
HelpArticleSchema.index(
  { title: 'text', summary: 'text', content: 'text', tags: 'text' },
  { weights: { title: 10, tags: 5, summary: 3, content: 1 } }
);

export const HelpArticle = mongoose.model<IHelpArticle>('HelpArticle', HelpArticleSchema);
