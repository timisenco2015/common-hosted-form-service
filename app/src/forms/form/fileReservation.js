
const {
  FileStorage,
  FileStorageReservation,
  SubmissionsExport,
} = require('../common/models');

const { v4: uuidv4 } = require('uuid');
const storageService = require('../file/storage/storageService');

const service = {

  createReservation: async (currentUser) => {
    let trx;
    try {
      let obj = {
        id: uuidv4(),
        createdBy: currentUser.usernameIdp,
      };
      trx = await FileStorageReservation.startTransaction();
      await FileStorageReservation.query(trx).insert(obj);
      await trx.commit();

      return await service.readReservation(obj.id);
    } catch (err) {
      if (trx) await trx.rollback();
      throw err;
    }
  },

  listReservation: async (params = {}) => {
    return FileStorageReservation.query()
      .modify('filterFileId', params.fileId)
      .modify('filterReady', params.ready)
      .modify('filterCreatedBy', params.createdBy)
      .modify('filterOlder', params.older);
  },

  readReservation: async (id) => {
    return FileStorageReservation.query()
      .findById(id)
      .throwIfNotFound();
  },

  updateReservation: async (id, fileId, currentUser) => {
    let trx;
    try {
      trx = await FileStorageReservation.startTransaction();
      await FileStorageReservation.query(trx).patchAndFetchById(id, {
        fileId:fileId,
        ready:true,
        updatedBy : currentUser.usernameIdp
      });
      await trx.commit();
      return await service.readReservation(id);
    }
    catch (error) {
      if (trx) trx.rollback();
      throw error;
    }

  },

  deleteReservation: async (id) => {
    let trx;

    try {
      trx = await FileStorageReservation.startTransaction();

      const reservation = await service.readReservation(id);

      const subsexp = await SubmissionsExport.query()
        .modify('filterReservationId', id)
        .modify('orderDescending');

      if (subsexp && subsexp.length > 0) {
        await SubmissionsExport.query(trx)
          .whereIn('id', subsexp.map((sub) => sub.id))
          .delete();
      }

      const obj = await FileStorage.query(trx)
        .findById(reservation.fileId);

      if (obj) {
        const result = await storageService.delete(obj);
        if (!result) {
          // error?
        }

        await FileStorage.query(trx)
          .deleteById(reservation.fileId)
          .throwIfNotFound();
      }

      await FileStorageReservation.query(trx)
        .deleteById(id)
        .throwIfNotFound();

      await trx.commit();
    } catch (error) {
      if (trx) trx.rollback();
      throw error;
    }
  },

};

module.exports = service;
