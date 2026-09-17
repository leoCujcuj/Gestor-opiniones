import mongoose from 'mongoose';

const CATEGORIES = [
  'tecnología',
  'política',
  'deportes',
  'entretenimiento',
  'ciencia',
  'salud',
  'educación',
  'negocios',
  'otro',
];

const publicationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'El título es requerido'],
      trim: true,
      minlength: [3, 'El título debe tener al menos 3 caracteres'],
      maxlength: [150, 'El título no puede superar 150 caracteres'],
    },
    category: {
      type: String,
      required: [true, 'La categoría es requerida'],
      enum: { values: CATEGORIES, message: 'Categoría inválida' },
    },
    content: {
      type: String,
      required: [true, 'El contenido es requerido'],
      trim: true,
      minlength: [10, 'El contenido debe tener al menos 10 caracteres'],
      maxlength: [5000, 'El contenido no puede superar 5000 caracteres'],
    },
    // Guarda el Id del usuario de PostgreSQL como string
    authorId: {
      type: String,
      required: true,
    },
    authorUsername: {
      type: String,
      required: true,
    },
    commentsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

publicationSchema.index({ authorId: 1 });
publicationSchema.index({ category: 1 });
publicationSchema.index({ createdAt: -1 });

export const Publication = mongoose.model('Publication', publicationSchema);
export { CATEGORIES };
