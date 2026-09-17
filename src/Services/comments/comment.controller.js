import { Comment } from './comment.model.js';
import { Publication } from '../publications/publication.model.js';

export const createComment = async (req, res) => {
  try {
    const { publicationId } = req.params;
    const { content } = req.body;

    const publication = await Publication.findById(publicationId);
    if (!publication) {
      return res.status(404).json({ success: false, msg: 'Publicación no encontrada' });
    }

    const comment = await Comment.create({
      content,
      authorId: req.user.Id,
      authorUsername: req.user.Username,
      publicationId,
    });

    // Incrementar contador de comentarios en la publicación
    await Publication.findByIdAndUpdate(publicationId, {
      $inc: { commentsCount: 1 },
    });

    return res.status(201).json({
      success: true,
      msg: 'Comentario agregado exitosamente',
      data: comment,
    });
  } catch (error) {
    return res.status(500).json({ success: false, msg: error.message });
  }
};

export const getCommentsByPublication = async (req, res) => {
  try {
    const { publicationId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const publication = await Publication.findById(publicationId);
    if (!publication) {
      return res.status(404).json({ success: false, msg: 'Publicación no encontrada' });
    }

    const [comments, total] = await Promise.all([
      Comment.find({ publicationId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Comment.countDocuments({ publicationId }),
    ]);

    return res.status(200).json({
      success: true,
      data: comments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, msg: error.message });
  }
};

export const updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ success: false, msg: 'Comentario no encontrado' });
    }

    if (comment.authorId !== req.user.Id) {
      return res.status(403).json({
        success: false,
        msg: 'No tienes permiso para editar este comentario',
      });
    }

    comment.content = req.body.content;
    await comment.save();

    return res.status(200).json({
      success: true,
      msg: 'Comentario actualizado exitosamente',
      data: comment,
    });
  } catch (error) {
    return res.status(500).json({ success: false, msg: error.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ success: false, msg: 'Comentario no encontrado' });
    }

    if (comment.authorId !== req.user.Id) {
      return res.status(403).json({
        success: false,
        msg: 'No tienes permiso para eliminar este comentario',
      });
    }

    await comment.deleteOne();

    // Decrementar contador en la publicación
    await Publication.findByIdAndUpdate(comment.publicationId, {
      $inc: { commentsCount: -1 },
    });

    return res.status(200).json({
      success: true,
      msg: 'Comentario eliminado exitosamente',
    });
  } catch (error) {
    return res.status(500).json({ success: false, msg: error.message });
  }
};

export const getMyComments = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [comments, total] = await Promise.all([
      Comment.find({ authorId: req.user.Id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('publicationId', 'title category'),
      Comment.countDocuments({ authorId: req.user.Id }),
    ]);

    return res.status(200).json({
      success: true,
      data: comments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, msg: error.message });
  }
};
