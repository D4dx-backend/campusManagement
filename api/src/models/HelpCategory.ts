import mongoose, { Schema } from 'mongoose';

export interface IHelpCategory {
  _id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  featureKey: string | null;
  order: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

const HelpCategorySchema = new Schema<IHelpCategory>({
  name: {
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
  description: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    required: true,
    trim: true
  },
  featureKey: {
    type: String,
    default: null
  },
  order: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true
});

HelpCategorySchema.index({ slug: 1 }, { unique: true });
HelpCategorySchema.index({ order: 1 });
HelpCategorySchema.index({ status: 1 });

export const HelpCategory = mongoose.model<IHelpCategory>('HelpCategory', HelpCategorySchema);
