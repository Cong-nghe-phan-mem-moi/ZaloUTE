const Album = require('../models/album.model');

const populateAlbum = (query) =>
  query
    .populate('owner', '_id fullName avatar')
    .populate({
      path: 'mediaItems.post',
      populate: { path: 'author', select: '_id fullName avatar' },
    });

class AlbumRepository {
  static async create(albumData) {
    const album = await Album.create(albumData);
    return populateAlbum(Album.findById(album._id));
  }

  static async findById(albumId) {
    return populateAlbum(Album.findById(albumId));
  }

  static async findByOwner(ownerId) {
    return populateAlbum(Album.find({ owner: ownerId }).sort({ createdAt: -1 }));
  }

  static async update(albumId, updateData) {
    return populateAlbum(
      Album.findByIdAndUpdate(albumId, updateData, {
        new: true,
        runValidators: true,
      }),
    );
  }

  static async delete(albumId) {
    return Album.findByIdAndDelete(albumId);
  }
}

module.exports = AlbumRepository;
