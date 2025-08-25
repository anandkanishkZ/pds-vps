import { Sequelize } from 'sequelize';
import config from '../config.js';
import UserModel from './user.js';
import UserBlockAuditModel from './userBlockAudit.js';
import ProductCategoryModel from './productCategory.js';
import ProductModel from './product.js';
import ProductFeatureModel from './productFeature.js';
import ProductApplicationModel from './productApplication.js';
import ProductPackSizeModel from './productPackSize.js';
import ProductMediaModel from './productMedia.js';
import InquiryModel from './inquiry.js';
import DealershipInquiryModel from './dealershipInquiry.js';
import GalleryModel from './gallery.js';
import JobPostingModel from './jobPosting.js';
import JobApplicationModel from './jobApplication.js';
import InterviewModel from './interview.js';
import ApplicationTimelineModel from './applicationTimeline.js';
import LeadershipMemberModel from './leadershipMember.js';
import HeroSlideModel from './heroSlide.js';

export const sequelize = new Sequelize(config.db.name, config.db.user, config.db.pass, {
  host: config.db.host,
  port: config.db.port,
  dialect: 'postgres',
  logging: false,
  dialectOptions: config.db.ssl ? { ssl: { require: true, rejectUnauthorized: false } } : {}
});

export const User = UserModel(sequelize);
export const UserBlockAudit = UserBlockAuditModel(sequelize);
export const ProductCategory = ProductCategoryModel(sequelize);
export const Product = ProductModel(sequelize);
export const ProductFeature = ProductFeatureModel(sequelize);
export const ProductApplication = ProductApplicationModel(sequelize);
export const ProductPackSize = ProductPackSizeModel(sequelize);
export const ProductMedia = ProductMediaModel(sequelize);
export const Inquiry = InquiryModel(sequelize);
export const DealershipInquiry = DealershipInquiryModel(sequelize);
export const Gallery = GalleryModel(sequelize);
export const JobPosting = JobPostingModel(sequelize);
export const JobApplication = JobApplicationModel(sequelize);
export const Interview = InterviewModel(sequelize);
export const ApplicationTimeline = ApplicationTimelineModel(sequelize);
export const LeadershipMember = LeadershipMemberModel(sequelize);
export const HeroSlide = HeroSlideModel(sequelize);

// Associations
UserBlockAudit.belongsTo(User, { foreignKey: 'actingUserId', as: 'actor' });
User.hasMany(UserBlockAudit, { foreignKey: 'userId', as: 'blockAudits' });

// Product associations
ProductCategory.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });
Product.belongsTo(ProductCategory, { foreignKey: 'categoryId', as: 'category' });
Product.hasMany(ProductFeature, { foreignKey: 'productId', as: 'features' });
Product.hasMany(ProductApplication, { foreignKey: 'productId', as: 'applications' });
Product.hasMany(ProductPackSize, { foreignKey: 'productId', as: 'packSizes' });
Product.hasMany(ProductMedia, { foreignKey: 'productId', as: 'media' });
ProductFeature.belongsTo(Product, { foreignKey: 'productId' });
ProductApplication.belongsTo(Product, { foreignKey: 'productId' });
ProductPackSize.belongsTo(Product, { foreignKey: 'productId' });
ProductMedia.belongsTo(Product, { foreignKey: 'productId' });

// Career/Job associations
JobPosting.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
JobPosting.hasMany(JobApplication, { foreignKey: 'jobPostingId', as: 'applications' });
JobApplication.belongsTo(JobPosting, { foreignKey: 'jobPostingId', as: 'jobPosting' });
JobApplication.belongsTo(User, { foreignKey: 'reviewedBy', as: 'reviewer' });
JobApplication.hasMany(Interview, { foreignKey: 'applicationId', as: 'interviews' });
JobApplication.hasMany(ApplicationTimeline, { foreignKey: 'applicationId', as: 'timeline' });
Interview.belongsTo(JobApplication, { foreignKey: 'applicationId', as: 'application' });
Interview.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });
ApplicationTimeline.belongsTo(JobApplication, { foreignKey: 'applicationId', as: 'application' });
ApplicationTimeline.belongsTo(User, { foreignKey: 'performedBy', as: 'performer' });

// Inquiry associations
Inquiry.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignedUser' });
Inquiry.belongsTo(User, { foreignKey: 'resolvedBy', as: 'resolvedByUser' });
User.hasMany(Inquiry, { foreignKey: 'assignedTo', as: 'assignedInquiries' });
User.hasMany(Inquiry, { foreignKey: 'resolvedBy', as: 'resolvedInquiries' });

// DealershipInquiry associations
DealershipInquiry.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignedUser' });
DealershipInquiry.belongsTo(User, { foreignKey: 'resolvedBy', as: 'resolvedByUser' });
User.hasMany(DealershipInquiry, { foreignKey: 'assignedTo', as: 'assignedDealershipInquiries' });
User.hasMany(DealershipInquiry, { foreignKey: 'resolvedBy', as: 'resolvedDealershipInquiries' });

export default {
  sequelize,
  User,
  UserBlockAudit,
  ProductCategory,
  Product,
  ProductFeature,
  ProductApplication,
  ProductPackSize,
  ProductMedia,
  Inquiry,
  DealershipInquiry,
  LeadershipMember,
  HeroSlide
};
