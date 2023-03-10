const Problem = require('api-problem');
const { transforms } = require('json2csv');
const { v4:uuidv4 } = require('uuid');
const { AsyncParser } = require('@json2csv/node');
const { StreamParser } = require('@json2csv/plainjs');
const storageService = require('../file/storage/storageService');

const {flattenComponents, unwindPath, submissionHeaders} = require('../common/utils');
const {
  Form,
  FormVersion,
  SubmissionsData
} = require('../common/models');

const fileReservation = require('./fileReservation');
const exportSubmissionsExtration = require('./exportSubmissions');



const EXPORT_TYPES = Object.freeze({
  submissions: 'submissions',
  default: 'submissions'
});

const EXPORT_FORMATS = Object.freeze({
  csv: 'csv',
  json: 'json',
  default: 'csv'
});

const service = {
  /**
   * @function _readSchemaFields
   * Returns a flattened, ordered array of relevant content field names with topology
   * @param {Object} schema A form.io schema
   * @returns {String[]} An array of strings
   */
  _readSchemaFields: async (schema) => {
    return  await flattenComponents(schema.components);
  },

  _buildCsvHeaders: async (form,  data, version) => {

    /**
     * get column order to match field order in form design
     * object key order is not preserved when submission JSON is saved to jsonb field type in postgres.
     */

    // get correctly ordered field names (keys) from latest form version
    const latestFormDesign = await service._readLatestFormSchema(form.id, version);

    const fieldNames = await service._readSchemaFields(latestFormDesign, data);

    // get meta properties in 'form.<child.key>' string format
    const metaKeys = Object.keys(data.length>0&&data[0].form);
    const metaHeaders = metaKeys.map(x => 'form.' + x);
    /**
     * make other changes to headers here if required
     * eg: use field labels as headers
     * see: https://github.com/kaue/jsonexport
     */
    let formSchemaheaders = metaHeaders.concat(fieldNames);
    if (Array.isArray(data) && data.length > 0) {
      let flattenSubmissionHeaders = Array.from(submissionHeaders(data[0]));
      formSchemaheaders = formSchemaheaders.concat(flattenSubmissionHeaders.filter((item) => formSchemaheaders.indexOf(item) < 0));
    }
    return formSchemaheaders;
  },

  _exportType: (params = {}) => {
    let result = EXPORT_TYPES[params.type];
    return result ? result : EXPORT_TYPES.default;
  },

  _exportFormat: (params = {}) => {
    let result = EXPORT_FORMATS[params.format];
    return result ? result : EXPORT_FORMATS.default;
  },

  _exportFilename: (form, type, format) => {
    return `${form.snake()}_${type}.${format}`.toLowerCase();
  },

  _submissionsColumns: (form) => {
    // Custom columns not defined - return default column selection behavior
    let columns = [
      'confirmationId',
      'formName',
      'version',
      'createdAt',
      'fullName',
      'username',
      'email'
    ];
    // if form has 'status updates' enabled in the form settings include these in export
    if (form.enableStatusUpdates) {
      columns = columns.concat(['status', 'assignee', 'assigneeEmail']);
    }
    // and join the submission data
    return columns.concat(['submission']);
  },

  _getForm: (formId) => {
    return Form.query().findById(formId).throwIfNotFound();
  },

  _getFormVersionId:(formId, version) => {
    return FormVersion.query()
      .select('id')
      .where('formId', formId)
      .where('version', version);
  },

  _getData: async(exportType,formVersion,form, params = {}) => {
    if (EXPORT_TYPES.submissions === exportType) {
      return service._getSubmissions(form, params,formVersion);
    }
    return {};
  },

  _formatData: async (exportFormat, exportType, exportTemplate, form, data = {}, columns, version) => {
    // inverting content structure nesting to prioritize submission content clarity
    const formatted = data.map(obj => {
      const { submission, ...form } = obj;
      return Object.assign({ form: form }, submission);
    });

    if (EXPORT_TYPES.submissions === exportType) {
      if (EXPORT_FORMATS.csv === exportFormat) {
        return await service._formatSubmissionsCsv(form, formatted,exportTemplate, columns, version, false);
      }
      if (EXPORT_FORMATS.json === exportFormat) {
        return await service._formatSubmissionsJson(form, formatted);
      }
    }
    throw new Problem(422, { detail: 'Could not create an export for this form. Invalid options provided' });
  },


  _formatDataWithReservation: async (exportTemplate, form, data = {}, columns, version, currentUser) => {
    const formatted = data.map(obj => {
      const { submission, ...form } = obj;
      return Object.assign({ form: form }, submission);
    });

    return await service._formatSubmissionsCsvWithReservation(form, formatted,exportTemplate, columns, version, currentUser);

  },

  _getSubmissions: async (form, params, version) => {
    let preference = params.preference?JSON.parse(params.preference):undefined;
    // params for this export include minDate and maxDate (full timestamp dates).
    if(version) {
      let submissionData = await SubmissionsData.query()
        .column(service._submissionsColumns(form, params))
        .where('formId', form.id)
        .where('version', version)
        .modify('filterCreatedAt', preference&&preference.minDate, preference&&preference.maxDate)
        .modify('filterDeleted', params.deleted)
        .modify('filterDrafts', params.drafts)
        .modify('orderDefault');
      return submissionData;
    }
    else {
      let submissionData = await SubmissionsData.query()
        .column(service._submissionsColumns(form, params))
        .where('formId', form.id)
        .modify('filterCreatedAt', preference&&preference.minDate, preference&&preference.maxDate)
        .modify('filterDeleted', params.deleted)
        .modify('filterDrafts', params.drafts)
        .modify('orderDefault');
      return submissionData;
    }

  },

  _formatSubmissionsJson: (form,data) => {
    return {
      data: data,
      headers: {
        'content-disposition': `attachment; filename="${service._exportFilename(form, EXPORT_TYPES.submissions, EXPORT_FORMATS.json)}"`,
        'content-type': 'application/json'
      }
    };
  },

  _formatSubmissionsCsv: async (form, data, exportTemplate, columns, version) => {
    try {
      switch(exportTemplate) {
        case 'flattenedWithBlankOut':
          return service._submissionsCSVExport(form, data, columns, false, version);
        case 'flattenedWithFilled':
          return service._submissionsCSVExport(form, data, columns, true, version);
        case 'unflattened':
          return service._submissionsCSVExport(form, data, columns, version);
        default:
          // code block
      }
    }
    catch (e) {
      throw new Problem(500, { detail: `Could not make a csv export of submissions for this form. ${e.message}` });
    }
  },

  _formatSubmissionsCsvWithReservation: async (form, data, exportTemplate, columns, version, currentUser) => {
    try {
      switch(exportTemplate) {
        case 'flattenedWithBlankOut':
          return service._submissionsCSVExportWithReservation(form, data, columns, false, version,true, currentUser);
        case 'flattenedWithFilled':
          return service._submissionsCSVExportWithReservation(form, data, columns, true, version, true, currentUser);
        case 'unflattened':
          return service._submissionsCSVExportWithReservation(form, data, columns,false, version, false, currentUser);
        default:
          // code block
      }
    }
    catch (e) {
      throw new Problem(500, { detail: `Could not make a csv export of submissions for this form. ${e.message}` });
    }
  },


  _submissionsCSVExport: async(form, data, columns, blankout, version, unwind) => {
    let headers = await service._buildCsvHeaders(form, data, version, columns);
    let opts;
    if(unwind) {
      let pathToUnwind = await unwindPath(data);
      opts = {
        transforms: [
          transforms.unwind({ paths: pathToUnwind, blankOut: blankout }),
          transforms.flatten({ object: true, array: true, separator: '.'}),
        ],
        fields: headers
      };
    }
    else {
      opts = {
        transforms: [
          transforms.flatten({ object: true, array: true, separator: '.'}),
        ],
        fields: headers
      };
    }

    const parser = new AsyncParser(opts, {}, {});
    const csv = await parser.parse(data).promise();

    return {
      data: csv,
      headers: {
        'content-disposition': `attachment; filename="${service._exportFilename(form, EXPORT_TYPES.submissions, EXPORT_FORMATS.csv)}"`,
        'content-type': 'text/csv'
      }
    };
  },

  _submissionsCSVExportWithReservation: async(form, data, columns, blankout, version, unwind, currentUser) => {
    let headers = await service._buildCsvHeaders(form, data, version, columns);
    let opts;
    if(unwind) {
      let pathToUnwind = await unwindPath(data);
      opts = {
        transforms: [
          transforms.unwind({ paths: pathToUnwind, blankOut: blankout }),
          transforms.flatten({ object: true, array: true, separator: '.'}),
        ],
        fields: headers
      };
    }
    else {
      opts = {
        transforms: [
          transforms.flatten({ object: true, array: true, separator: '.'}),
        ],
        fields: headers
      };
    }

    const parser = new StreamParser(opts, {objectMode:true});

    let csv = '';
    parser.onEnd = ()=>service._JSON2CSVStreamParserCallBack(csv, form.id,form.name, version,currentUser);
    parser.onData = (chunk) => (csv += chunk.toString());
    parser.pushLine(data);
    parser.onEnd();
  },

  _createReservationForSubmissionExport: async(formId, version, currentUser) => {
    let formVersions = await service._getFormVersionId(formId, version);
    let fRV;
    let exportSubmissions =  await exportSubmissionsExtration.listSubmissionsExports({formId:formId, formVersions:formVersions[0].id});
    if (exportSubmissions.length>0) {
      fRV = await fileReservation.readReservation(exportSubmissions[0].reservationId);
    }
    if(exportSubmissions.length===0) {
      fRV = await fileReservation.createReservation(currentUser);
      exportSubmissions = await exportSubmissionsExtration.createSubmissionsExport(formId, formVersions[0].id, fRV.id, currentUser);
    }
    return fRV;
  },

  _JSON2CSVStreamParserCallBack: async(csv, formId, formName, version, currentUser)=> {
    let fRV, storage;
    let fileId = uuidv4();
    let formVersions = await service._getFormVersionId(formId, version);
    const exportSubmissions =  await exportSubmissionsExtration.listSubmissionsExports({formId:formId, formVersions:formVersions[0].id});
    if(exportSubmissions&&exportSubmissions.length>0) {
      fRV = await fileReservation.readReservation(exportSubmissions[0].reservationId);
      fileId = fRV&&fRV.fileId!==null?fRV.fileId:fileId;
    }
    storage = await storageService.uploadData({originalName:formName+'.csv', id:fileId}, csv);
    if(storage) {
      await fileReservation.updateReservation(fRV.id, fileId, currentUser);
      await exportSubmissionsExtration.updateSubmissionsExport(exportSubmissions[0].id, currentUser);
    }
  },

  _readLatestFormSchema: (formId, version) => {
    return FormVersion.query()
      .select('schema')
      .where('formId', formId)
      .where('version', version)
      .modify('orderVersionDescending')
      .first()
      .then((row) => row.schema);
  },

  export: async (formId, params = {}) => {
    // ok, let's determine what we are exporting and do it!!!!
    // what operation?
    // what output format?
    const exportType = service._exportType(params);
    const exportFormat = service._exportFormat(params);
    const exportTemplate = params.template?params.template:'flattenedWithFilled';
    const form = await service._getForm(formId);
    const data = await service._getData(exportType, params.version, form, params);
    const result = await service._formatData(exportFormat, exportType,exportTemplate, form, data, params.columns, params.version);

    return { data: result.data, headers: result.headers };
  },

  exportWithReservation: async (formId, currentUser, params = {}) => {
    const exportType = service._exportType(params);
    const exportTemplate = params.template?params.template:'flattenedWithFilled';
    const columns = params.columns?params.columns:undefined;
    const form = await service._getForm(formId);
    const data = await service._getData(exportType, params.version, form, params);
    const reservation = await service._createReservationForSubmissionExport(formId, params.version, currentUser);
    service._formatDataWithReservation(exportTemplate, form, data, columns, params.version, currentUser);
    return reservation;
  },

};

module.exports = service;
