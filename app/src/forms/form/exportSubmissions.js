const {
  SubmissionsExport,
} = require('../common/models');

const { v4: uuidv4 } = require('uuid');

const service = {
  listSubmissionsExports: async (params = {}) => {
    return SubmissionsExport.query()
      .modify('filterFormId', params.formId)
      .modify('filterFormVersionId', params.formVersionId)
      .allowGraph('[form, formVersion,user]')
      .withGraphFetched('form')
      .withGraphFetched('formVersion')
      .withGraphFetched('user')
      .modify('orderDescending');
  },

  createSubmissionsExport: async (formId, formVersionId, reservationId, currentUser) => {
    let trx;
    try {
      let id = uuidv4();
      trx = await SubmissionsExport.startTransaction();
      await SubmissionsExport.query(trx)
        .insert({
          id: id,
          formId: formId,
          formVersionId: formVersionId,
          reservationId: reservationId,
          userId: currentUser.id,
          createdBy: currentUser.usernameIdp
        });
      await trx.commit();
      return  service.readSubmissionsExport(id);
    } catch (error) {
      if (trx) trx.rollback();
      throw error;
    }
  },

  updateSubmissionsExport: async (id, currentUser) => {
    let trx;
    try {
      trx = await SubmissionsExport.startTransaction();
      await SubmissionsExport.query(trx).patchAndFetchById(id, {
        updatedBy : currentUser.usernameIdp
      });
      await trx.commit();
      return await service.readSubmissionsExport(id);
    }
    catch (error) {
      if (trx) trx.rollback();
      throw error;
    }

  },

  readSubmissionsExport: async (submissionsExportId) => {
    return SubmissionsExport.query()
      .findById(submissionsExportId)
      .throwIfNotFound();
  },

  deleteSubmissionsExport: async (submissionsExportId) => {
    return SubmissionsExport.query()
      .deleteById(submissionsExportId)
      .throwIfNotFound();
  }
};

module.exports = service;
