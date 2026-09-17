import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, 'El comentario no puede estar vacío'],
      trim: true,
      minlength: [1, 'El comentario es requerido'],
      maxlength: [1000, 'El comentario no puede superar 1000 caracteres'],
    },
    // Id del usuario de PostgreSQL
    authorId: {
      type: String,
      required: true,
    },
    authorUsername: {
      type: String,
      required: true,
    },
    publicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Publication',
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

commentSchema.index({ publicationId: 1, createdAt: -1 });
commentSchema.index({ authorId: 1 });

export const Comment = mongoose.model('Comment', commentSchema);
