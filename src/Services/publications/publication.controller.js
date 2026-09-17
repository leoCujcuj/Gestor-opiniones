import { Publication } from './publication.model.js';
import { Comment } from '../comments/comment.model.js';

export const createPublication = async (req, res) => {
  try {
    const { title, category, content } = req.body;

    const publication = await Publication.create({
      title,
      category,
      content,
      authorId: req.user.Id,
      authorUsername: req.user.Username,
    });

    return res.status(201).json({
      success: true,
      msg: 'Publicación creada exitosamente',
      data: publication,
    });
  } catch (error) {
    return res.status(500).json({ success: false, msg: error.message });
  }
};

export const getPublications = async (req, res) => {
  try {
    const { category, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = {};
    if (category) filter.category = category;

    const [publications, total] = await Promise.all([
      Publication.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Publication.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: publications,
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

export const getPublicationById = async (req, res) => {
  try {
    const publication = await Publication.findById(req.params.id);

    if (!publication) {
      return res.status(404).json({ success: false, msg: 'Publicación no encontrada' });
    }

    return res.status(200).json({ success: true, data: publication });
  } catch (error) {
    return res.status(500).json({ success: false, msg: error.message });
  }
};

export const updatePublication = async (req, res) => {
  try {
    const publication = await Publication.findById(req.params.id);

    if (!publication) {
      return res.status(404).json({ success: false, msg: 'Publicación no encontrada' });
    }

    // Verificar que el usuario es el autor
    if (publication.authorId !== req.user.Id) {
      return res.status(403).json({
        success: false,
        msg: 'No tienes permiso para editar esta publicación',
      });
    }

    const { title, category, content } = req.body;

    // Solo actualiza los campos enviados
    if (title !== undefined) publication.title = title;
    if (category !== undefined) publication.category = category;
    if (content !== undefined) publication.content = content;

    await publication.save();

    return res.status(200).json({
      success: true,
      msg: 'Publicación actualizada exitosamente',
      data: publication,
    });
  } catch (error) {
    return res.status(500).json({ success: false, msg: error.message });
  }
};

export const deletePublication = async (req, res) => {
  try {
    const publication = await Publication.findById(req.params.id);

    if (!publication) {
      return res.status(404).json({ success: false, msg: 'Publicación no encontrada' });
    }

    // Verificar que el usuario es el autor
    if (publication.authorId !== req.user.Id) {
      return res.status(403).json({
        success: false,
        msg: 'No tienes permiso para eliminar esta publicación',
      });
    }

    await Comment.deleteMany({ publicationId: publication._id });
    await publication.deleteOne();

    return res.status(200).json({
      success: true,
      msg: 'Publicación eliminada exitosamente'
    });
  } catch (error) {
    return res.status(500).json({ success: false, msg: error.message });
  }
};

export const getMyPublications = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [publications, total] = await Promise.all([
      Publication.find({ authorId: req.user.Id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Publication.countDocuments({ authorId: req.user.Id }),
    ]);

    return res.status(200).json({
      success: true,
      data: publications,
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
