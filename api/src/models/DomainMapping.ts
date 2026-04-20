import mongoose, { Schema, Document } from 'mongoose';

export interface IDomainMapping extends Document {
  domain: string;            // e.g. "school.campuswise.in" or "myschool.com"
  domainType: 'subdomain' | 'custom';
  organizationId: mongoose.Types.ObjectId;
  isPrimary: boolean;        // Each org can have one primary domain
  sslStatus: 'pending' | 'active' | 'error';
  verifiedAt?: Date;
  status: 'active' | 'inactive' | 'pending_verification';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DomainMappingSchema = new Schema<IDomainMapping>(
  {
    domain: {
      type: String,
      required: [true, 'Domain is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    domainType: {
      type: String,
      enum: ['subdomain', 'custom'],
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId as any,
      ref: 'Organization',
      required: [true, 'Organization is required'],
      index: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    sslStatus: {
      type: String,
      enum: ['pending', 'active', 'error'],
      default: 'pending',
    },
    verifiedAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending_verification'],
      default: 'active',
    },
    createdBy: {
      type: Schema.Types.ObjectId as any,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
DomainMappingSchema.index({ domain: 1 }, { unique: true });
DomainMappingSchema.index({ organizationId: 1, isPrimary: 1 });

export const DomainMapping = mongoose.model<IDomainMapping>(
  'DomainMapping',
  DomainMappingSchema
);
