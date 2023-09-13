const config = require('config');
const routes = require('express').Router();
const middleware = require('../common/middleware');
const apiAccess = require('../auth/middleware/apiAccess');
const { currentUser, hasFormPermissions } = require('../auth/middleware/userAccess');
const P = require('../common/constants').Permissions;

const keycloak = require('../../components/keycloak');

const controller = require('./controller');

routes.use(currentUser);

/**
 * @openapi
 * /forms/:
 *  get:
 *    tags:
 *      - Forms
 *    summary: List all forms
 *    description: This endpoint will fetch all forms that the user has access.
 *    security:
 *      - openId: []
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/FormListForms'
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.get('/', keycloak.protect(`${config.get('server.keycloak.clientId')}:admin`), async (req, res, next) => {
  await controller.listForms(req, res, next);
});

/**
 * @openapi
 * /forms/:
 *  post:
 *    tags:
 *      - Forms
 *    summary: Create a new form
 *    description: This endpoint will create new form.
 *    security:
 *      - bearerAuth: []
 *        openId: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/requestBodies/FormReqCreateForm'
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/FormCreateForm'
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.post('/', async (req, res, next) => {
  await controller.createForm(req, res, next);
});

/**
 * @openapi
 * /forms/{formId}:
 *  get:
 *    tags:
 *      - Forms
 *    summary: Get details of a form (and metadata for versions)
 *    description: This endpoint will fetch the form with the form ID.
 *    security:
 *      - basicAuth: []
 *      - bearerAuth: []
 *        openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/FormReadForm'
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/NoFormAccessError'
 *                - $ref: '#/components/schemas/respError/UserNotFoundError'
 *                - $ref: '#/components/schemas/respError/FormIdNotFoundError'
 *                - $ref: '#/components/schemas/respError/NoRequiredFormPermissionError'
 *                - $ref: '#/components/schemas/respError/InvalidAuthError'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.get('/:formId', apiAccess, hasFormPermissions(P.FORM_READ), async (req, res, next) => {
  await controller.readForm(req, res, next);
});

/**
 * @openapi
 * /forms/{formId}/export:
 *  get:
 *    tags:
 *      - Forms
 *    summary: Export submissions for a form
 *    description: This endpoint will export submissions to either CSV or JSON.
 *    security:
 *      - basicAuth: []
 *      - bearerAuth: []
 *        openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *      - in: query
 *        name: format
 *        schema:
 *          type: string
 *          description: Form submission export format/type. It can either be "csv" or "json"
 *          example: csv
 *          default: csv
 *      - in: query
 *        name: template
 *        schema:
 *          type: string
 *          description: 'Chosen CSV format for the submission data exported. Use one of these templates 1) multiRowEmptySpacesCSVExport 2) multiRowBackFilledCSVExport 3) singleRowCSVExport 4) unFormattedCSVExport to export submission to CSV Note: use this parameter only if export format/type is csv'
 *          example: multiRowEmptySpacesCSVExport
 *          default: multiRowEmptySpacesCSVExport
 *      - in: query
 *        name: version
 *        schema:
 *          type: number
 *          description: 'The version number of the form for the submission data exported. Note: use this parameter only if export format/type is csv'
 *          example: 2
 *          default: 1
 *      - in: query
 *        name: type
 *        schema:
 *          type: string
 *          example: submissions
 *          description: Default value is submissions and should not be changed.
 *          default: submissions
 *      - in: query
 *        name: preference
 *        schema:
 *          type: object
 *          description: Form submissions export preferences
 *          example: { minDate: '2023-05-19T07:00:00Z', maxDate: '2023-06-19T06:59:59Z' }
 *      - in: query
 *        name: emailExport
 *        schema:
 *          type: boolean
 *          example: true
 *          description: If set to true, an email will the export will be sent rather than users downloading the export directly.
 *          default: false
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          text/csv:
 *            schema:
 *              type: string
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/NoFormAccessError'
 *                - $ref: '#/components/schemas/respError/UserNotFoundError'
 *                - $ref: '#/components/schemas/respError/FormIdNotFoundError'
 *                - $ref: '#/components/schemas/respError/NoRequiredFormPermissionError'
 *                - $ref: '#/components/schemas/respError/InvalidAuthError'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.get('/:formId/export', apiAccess, hasFormPermissions([P.FORM_READ, P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.export(req, res, next);
});

/**
 * @openapi
 * /forms/{formId}/export/fields:
 *  post:
 *    tags:
 *      - Forms
 *    summary: Export submissions for a form
 *    description: This endpoint will export submissions to either CSV or JSON. Users can specify the submission fields they want to include or exclude from submission. Use only in frontend (from an interface)
 *    security:
 *      - basicAuth: []
 *      - bearerAuth: []
 *        openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/requestBodies/FormReqSubmissionExportWithFields'
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          text/csv:
 *            schema:
 *              type: string
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/NoFormAccessError'
 *                - $ref: '#/components/schemas/respError/UserNotFoundError'
 *                - $ref: '#/components/schemas/respError/FormIdNotFoundError'
 *                - $ref: '#/components/schemas/respError/NoRequiredFormPermissionError'
 *                - $ref: '#/components/schemas/respError/InvalidAuthError'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.post('/:formId/export/fields', middleware.publicRateLimiter, apiAccess, hasFormPermissions([P.FORM_READ, P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.exportWithFields(req, res, next);
});

/**
 * @openapi
 * /forms/{formId}/options:
 *  get:
 *    tags:
 *      - Forms
 *    summary: Get pre-flight details for a form
 *    description: This endpoint will fetch form options.
 *    security:
 *      - bearerAuth: []
 *        openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/FormReadFormOptions'
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '404':
 *        $ref: '#/components/responses/Error/ResourceNotFound'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.get('/:formId/options', async (req, res, next) => {
  await controller.readFormOptions(req, res, next);
});

/*
Suggested for clean up
*/
routes.get('/:formId/version', apiAccess, hasFormPermissions(P.FORM_READ), async (req, res, next) => {
  await controller.readPublishedForm(req, res, next);
});

/**
 * @openapi
 * /forms/{formId}:
 *  put:
 *    tags:
 *      - Forms
 *    summary: Update a form
 *    description: This endpoint will update this form.
 *    security:
 *      - basicAuth: []
 *      - bearerAuth: []
 *        openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/requestBodies/FormReqUpdateForm'
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/FormUpdateForm'
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/NoFormAccessError'
 *                - $ref: '#/components/schemas/respError/UserNotFoundError'
 *                - $ref: '#/components/schemas/respError/NoRequiredFormPermissionError'
 *                - $ref: '#/components/schemas/respError/InvalidAuthError'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.put('/:formId', apiAccess, hasFormPermissions([P.FORM_READ, P.FORM_UPDATE]), async (req, res, next) => {
  await controller.updateForm(req, res, next);
});

/**
 * @openapi
 * /forms/{formId}:
 *  delete:
 *    tags:
 *      - Forms
 *    summary: (Soft) Delete a form
 *    description: This endpoint will delete this form.
 *    security:
 *      - basicAuth: []
 *      - bearerAuth: []
 *        openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/NoFormAccessError'
 *                - $ref: '#/components/schemas/respError/UserNotFoundError'
 *                - $ref: '#/components/schemas/respError/NoRequiredFormPermissionError'
 *                - $ref: '#/components/schemas/respError/InvalidAuthError'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.delete('/:formId', apiAccess, hasFormPermissions([P.FORM_READ, P.FORM_DELETE]), async (req, res, next) => {
  await controller.deleteForm(req, res, next);
});

/**
 * @openapi
 * /forms/{formId}/submissions:
 *  get:
 *    tags:
 *      - Forms
 *    summary: List submissions for a form
 *    description: This endpoint will get all submissions for this form
 *    security:
 *      - basicAuth: []
 *      - bearerAuth: []
 *        openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *      - in: query
 *        name: deleted
 *        schema:
 *          type: boolean
 *        description: The endpoint will fetch all the active form submissions if set to false. Otherwise,  the endpoint will fetch all the deleted form submissions.
 *        required: true
 *        example: false
 *      - in: query
 *        name: fields
 *        schema:
 *          type: string
 *        description: List of submissions fields to be fetched. If empty, all the submissions fields will be fetched.
 *        default: []
 *        example: ['firstName', 'lastName']
 *      - in: query
 *        name: createdBy
 *        schema:
 *          type: string
 *        description: The endpoint will filter the form submissions using the username in createdBy.
 *        default: ""
 *        example: ["example@idir"]
 *      - in: query
 *        name: createdAt
 *        schema:
 *          type: string
 *        description: The endpoint will filter the form submissions using the start and end date in createdAt.
 *        default: ['1973-06-18 07:02:45', '2073-06-18 07:02:45']
 *        example: ['1973-06-18 07:02:45', '2073-06-18 07:02:45']
 *      - in: query
 *        name: page
 *        schema:
 *          type: number
 *        description: This parameter is used for pagination. This page number with itemsPerPage will be used to calculate the range of submissions to be fetched
 *        example: 0
 *      - in: query
 *        name: filterformSubmissionStatusCode
 *        schema:
 *          type: boolean
 *        description: Set this parameter to true to filter out submissions status codes with null values.
 *        default: false
 *      - in: query
 *        name: itemsPerPage
 *        schema:
 *          type: number
 *        description: This is paramter is used for pagination. This the number of submissions per page
 *        example: 10
 *      - in: query
 *        name: totalSubmissions
 *        schema:
 *          type: number
 *        description: This parameter is used for pagination. This is mainly used for CHEFS.
 *      - in: query
 *        name: sortDesc
 *        schema:
 *          type: boolean
 *        description: This parameter is used for pagination. It sorts the submissions in descending order if set to true.
 *        example: true
 *      - in: query
 *        name: sortBy
 *        schema:
 *          type: string
 *        description: This parameter is used for pagination. It sorts submissions based on the column(submission field) specified.
 *        example: confirmationId
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/FormListFormSubmissions'
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/NoFormAccessError'
 *                - $ref: '#/components/schemas/respError/UserNotFoundError'
 *                - $ref: '#/components/schemas/respError/NoRequiredFormPermissionError'
 *                - $ref: '#/components/schemas/respError/InvalidAuthError'
 *      '422':
 *        $ref: '#/components/responses/Error/UnprocessableEntity'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.get('/:formId/submissions', apiAccess, hasFormPermissions([P.FORM_READ, P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.listFormSubmissions(req, res, next);
});


/**
 * @openapi
 * forms/{formId}/versions/{formVersionId}:
 *  get:
 *    tags:
 *      - Version
 *    summary: Get a single form version
 *    description: This endpoint will fetch form version details.
 *    security:
 *      - basicAuth: []
 *      - bearerAuth: []
 *        openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: Form ID.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *      - in: path
 *        name: formVersionId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: Form version ID.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/FormReadVersion'
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '404':
 *        $ref: '#/components/responses/Error/ResourceNotFound'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/NoFormAccessError'
 *                - $ref: '#/components/schemas/respError/UserNotFoundError'
 *                - $ref: '#/components/schemas/respError/NoRequiredFormPermissionError'
 *                - $ref: '#/components/schemas/respError/InvalidAuthError'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.get('/:formId/versions/:formVersionId', apiAccess, hasFormPermissions([P.FORM_READ]), async (req, res, next) => {
  await controller.readVersion(req, res, next);
});

/**
 * @openapi
 * /forms/{formId}/versions/{formVersionId}/fields:
 *  get:
 *    tags:
 *      - Version
 *    summary: Get a list of valid form fields in this form version
 *    description: This endpoint will fetch submission fields for the form ID and form version ID passed in the path parameter.
 *    security:
 *      - basicAuth: []
 *      - bearerAuth: []
 *        openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: Form ID.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *      - in: path
 *        name: formVersionId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: Form version ID.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              description: returns submission fields for the form version ID passed in the path parameter
 *              example: ["firstName"]
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '404':
 *        $ref: '#/components/responses/Error/ResourceNotFound'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/NoFormAccessError'
 *                - $ref: '#/components/schemas/respError/UserNotFoundError'
 *                - $ref: '#/components/schemas/respError/NoRequiredFormPermissionError'
 *                - $ref: '#/components/schemas/respError/InvalidAuthError'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.get('/:formId/versions/:formVersionId/fields', apiAccess, hasFormPermissions([P.FORM_READ]), async (req, res, next) => {
  await controller.readVersionFields(req, res, next);
});

/**
 * @openapi
 * /forms/{formId}/versions/{formVersionId}/publish:
 *  post:
 *    tags:
 *      - Version
 *    summary: Publish a version of a form
 *    description: This endpoint will publish form version
 *    security:
 *      - basicAuth: []
 *      - bearerAuth: []
 *        openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *      - in: path
 *        name: formVersionId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: Form version ID.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *      - in: query
 *        name: unpublish
 *        schema:
 *          type: boolean
 *        description: Publish status
 *        required: true
 *        example: true
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/FormPublishVersion'
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/NoFormAccessError'
 *                - $ref: '#/components/schemas/respError/UserNotFoundError'
 *                - $ref: '#/components/schemas/respError/NoRequiredFormPermissionError'
 *                - $ref: '#/components/schemas/respError/InvalidAuthError'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.post('/:formId/versions/:formVersionId/publish', apiAccess, hasFormPermissions([P.FORM_READ, P.DESIGN_CREATE]), async (req, res, next) => {
  await controller.publishVersion(req, res, next);
});

/**
 * @openapi
 * /forms/{formId}/versions/{formVersionId}/submissions:
 *  get:
 *    tags:
 *      - Submissions
 *    summary: List submissions from a form version
 *    description: This endpoint will fecth list of submissions for the form version.
 *    security:
 *      - basicAuth: []
 *      - bearerAuth: []
 *        openId: []
 *    parameters:
 *      - in: path
 *        name: formSubmissionId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form submission.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *      - in: path
 *        name: formVersionId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form version.
 *        required: true
 *        example: 767a431b-24b1-4b8b-92e5-783144f7caf9
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            examples:
 *              ListSubmissionsEx:
 *                $ref: '#/components/examples/ListSubmissionsEx'
 *            schema:
 *              type: array
 *              items:
 *                type: object
 *                description: Form submission details for the formSubmissionId in the request parameter
 *                properties:
 *                  form:
 *                    type: object
 *                    description: Form Details.
 *                    example: {}
 *                  submission:
 *                    type: object
 *                    description: Submission Details.
 *                    example: {}
 *                  version:
 *                    type: object
 *                    description: Version Details.
 *                    example: {}
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/NoFormAccessError'
 *                - $ref: '#/components/schemas/respError/UserNotFoundError'
 *                - $ref: '#/components/schemas/respError/NoRequiredFormPermissionError'
 *                - $ref: '#/components/schemas/respError/InvalidAuthError'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.get('/:formId/versions/:formVersionId/submissions', apiAccess, hasFormPermissions([P.FORM_READ, P.SUBMISSION_READ]), async (req, res, next) => {
  await controller.listSubmissions(req, res, next);
});

/**
 * @openapi
 * /forms/{formId}/versions/{formVersionId}/submissions:
 *  post:
 *    tags:
 *      - Submissions
 *    summary: Create a new form submission
 *    description: This endpoint will create form submission.
 *    security:
 *      - basicAuth: []
 *      - bearerAuth: []
 *        openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: Form ID.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *      - in: path
 *        name: formVersionId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: Form version ID.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/requestBodies/FormReqCreatSubmission'
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/FormCreateFormSubmission'
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/NoFormAccessError'
 *                - $ref: '#/components/schemas/respError/UserNotFoundError'
 *                - $ref: '#/components/schemas/respError/NoRequiredFormPermissionError'
 *                - $ref: '#/components/schemas/respError/InvalidAuthError'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.post('/:formId/versions/:formVersionId/submissions', apiAccess, hasFormPermissions([P.FORM_READ, P.SUBMISSION_CREATE]), async (req, res, next) => {
  await controller.createSubmission(req, res, next);
});

/**
 * @openapi
 * /forms/{formId}/versions/{formVersionId}/multiSubmission:
 *  post:
 *    tags:
 *      - Draft
 *    summary: Upload multiple draft submissions
 *    description: This endpoint upload multiple draft submissions.
 *    security:
 *      - basicAuth: []
 *      - bearerAuth: []
 *        openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: Form ID.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *      - in: path
 *        name: formVersionId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: Form version ID.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            type: object
 *            properties:
 *              draft:
 *                type: boolean
 *                description:
 *                default: false
 *                example: false
 *              submission:
 *                type: object
 *                description: this object should contain one property named data as an array. This array named data should store all the multiple drafts as object in this array.
 *                properties:
 *                  data:
 *                    type: array
 *                    description: this is an array of multiple objects, each object contain data of single the form submissions.
 *                    example: [{}]
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/FormCreateFormSubmission'
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/NoFormAccessError'
 *                - $ref: '#/components/schemas/respError/UserNotFoundError'
 *                - $ref: '#/components/schemas/respError/NoRequiredFormPermissionError'
 *                - $ref: '#/components/schemas/respError/InvalidAuthError'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.post(
  '/:formId/versions/:formVersionId/multiSubmission',
  middleware.publicRateLimiter,
  apiAccess,
  hasFormPermissions([P.FORM_READ, P.SUBMISSION_CREATE]),
  async (req, res, next) => {
    await controller.createMultiSubmission(req, res, next);
  }
);

/**
 * @openapi
 * /forms/{formId}/versions/{formVersionId}/submissions/discover:
 *  get:
 *    tags:
 *      - Forms
 *    summary: List all the submission Ids for the form submissions.
 *    description: This endpoint will list all the submission Ids for the form submissions.
 *    security:
 *      - basicAuth: []
 *      - bearerAuth: []
 *        openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: Form ID.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *      - in: path
 *        name: formVersionId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: Form version ID.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              type: array
 *              items:
 *                type: object
 *                properties:
 *                  id:
 *                    type: string
 *                    description: submission ID.
 *                    example: "bd877006-8ff1-49bf-927d-d7a0de834842"
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/NoFormAccessError'
 *                - $ref: '#/components/schemas/respError/UserNotFoundError'
 *                - $ref: '#/components/schemas/respError/NoRequiredFormPermissionError'
 *                - $ref: '#/components/schemas/respError/InvalidAuthError'
 *      '422':
 *        $ref: '#/components/responses/Error/UnprocessableEntity'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.get('/:formId/versions/:formVersionId/submissions/discover', apiAccess, hasFormPermissions([P.FORM_READ, P.SUBMISSION_READ]), (req, res, next) => {
  controller.listSubmissionFields(req, res, next);
});

// routes.get('/:formId/versions/:formVersionId/submissions/:formSubmissionId', apiAccess, hasFormPermissions([P.FORM_READ]), async (req, res, next) => {
//   next(new Problem(410, { detail: 'This method is deprecated, use /submissions to read a submission.' }));
// });

// routes.put('/:formId/versions/:formVersionId/submissions/:formSubmissionId', apiAccess, hasFormPermissions([P.FORM_READ]), async (req, res, next) => {
//   next(new Problem(410, { detail: 'This method is deprecated, use /submissions to modify a submission.' }));
// });

/**
 * @openapi
 * /forms/{formId}/drafts:
 *  get:
 *    tags:
 *      - Draft
 *    summary: List drafts for a form
 *    description: This endpoint will fetch list of all form drafts.
 *    security:
 *      - basicAuth: []
 *      - bearerAuth: []
 *        openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/FormListsDraft'
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/NoFormAccessError'
 *                - $ref: '#/components/schemas/respError/UserNotFoundError'
 *                - $ref: '#/components/schemas/respError/NoRequiredFormPermissionError'
 *                - $ref: '#/components/schemas/respError/InvalidAuthError'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.get('/:formId/drafts', apiAccess, hasFormPermissions([P.FORM_READ, P.DESIGN_READ]), async (req, res, next) => {
  await controller.listDrafts(req, res, next);
});

/**
 * @openapi
 * /forms/{formId}/drafts:
 *  post:
 *    tags:
 *      - Draft
 *    summary: Create a draft from a form version
 *    description: This endpoint will create form draft from published form version.
 *    security:
 *      - basicAuth: []
 *      - bearerAuth: []
 *        openId: []
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/requestBodies/FormReqCreateDraft'
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *               $ref: '#/components/responses/responseBody/FormCreateDraft'
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/NoFormAccessError'
 *                - $ref: '#/components/schemas/respError/UserNotFoundError'
 *                - $ref: '#/components/schemas/respError/FormIdNotFoundError'
 *                - $ref: '#/components/schemas/respError/NoRequiredFormPermissionError'
 *                - $ref: '#/components/schemas/respError/InvalidAuthError'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.post('/:formId/drafts', apiAccess, hasFormPermissions([P.FORM_READ, P.DESIGN_CREATE]), async (req, res, next) => {
  await controller.createDraft(req, res, next);
});

/**
 * @openapi
 * /forms/{formId}/draft/{formVersionDraftId}:
 *  get:
 *    tags:
 *      - Draft
 *    summary: Get a form draft
 *    description: This endpoint will fetch form draft.
 *    security:
 *      - basicAuth: []
 *      - bearerAuth: []
 *        openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *      - in: path
 *        name: formVersionDraftId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form draft.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/FormReadDraft'
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '404':
 *        $ref: '#/components/responses/Error/ResourceNotFound'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/NoFormAccessError'
 *                - $ref: '#/components/schemas/respError/UserNotFoundError'
 *                - $ref: '#/components/schemas/respError/NoRequiredFormPermissionError'
 *                - $ref: '#/components/schemas/respError/InvalidAuthError'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.get('/:formId/drafts/:formVersionDraftId', apiAccess, hasFormPermissions([P.FORM_READ, P.DESIGN_READ]), async (req, res, next) => {
  await controller.readDraft(req, res, next);
});

/**
 * @openapi
 * /forms/{formId}/draft/{formVersionDraftId}:
 *  put:
 *    tags:
 *      - Draft
 *    summary: Update a form draft
 *    description: This endpoint will fetch form draft.
 *    security:
 *      - basicAuth: []
 *      - bearerAuth: []
 *        openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *      - in: path
 *        name: formVersionDraftId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: Form version draft ID.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/requestBodies/FormReqUpdateDraft'
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/FormUpdateDraft'
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '404':
 *        $ref: '#/components/responses/Error/ResourceNotFound'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/NoFormAccessError'
 *                - $ref: '#/components/schemas/respError/UserNotFoundError'
 *                - $ref: '#/components/schemas/respError/NoRequiredFormPermissionError'
 *                - $ref: '#/components/schemas/respError/InvalidAuthError'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.put('/:formId/drafts/:formVersionDraftId', apiAccess, hasFormPermissions([P.FORM_READ, P.DESIGN_UPDATE]), async (req, res, next) => {
  await controller.updateDraft(req, res, next);
});

/**
 * @openapi
 * /forms/{formId}/drafts/{formVersionDraftId}:
 *  delete:
 *    tags:
 *      - Draft
 *    summary: Delete a form draft
 *    description: This endpoint will delete the form draft.
 *    security:
 *      - basicAuth: []
 *      - bearerAuth: []
 *        openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *      - in: path
 *        name: formVersionDraftId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: Form version draft ID.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '404':
 *        $ref: '#/components/responses/Error/ResourceNotFound'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/NoFormAccessError'
 *                - $ref: '#/components/schemas/respError/UserNotFoundError'
 *                - $ref: '#/components/schemas/respError/NoRequiredFormPermissionError'
 *                - $ref: '#/components/schemas/respError/InvalidAuthError'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.delete('/:formId/drafts/:formVersionDraftId', apiAccess, hasFormPermissions([P.FORM_READ, P.DESIGN_DELETE]), async (req, res, next) => {
  await controller.deleteDraft(req, res, next);
});

/**
 * @openapi
 * /forms/{formId}/drafts/{formVersionDraftId}/publish:
 *  post:
 *    tags:
 *      - Draft
 *    summary: Publish a form draft
 *    description: This endpoint will publish the form draft.
 *    security:
 *      - basicAuth: []
 *      - bearerAuth: []
 *        openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *      - in: path
 *        name: formVersionDraftId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: Form version draft ID.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: '#/components/requestBodies/FormReqPublishDraft'
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/FormPublishDraft'
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '404':
 *        $ref: '#/components/responses/Error/ResourceNotFound'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/NoFormAccessError'
 *                - $ref: '#/components/schemas/respError/UserNotFoundError'
 *                - $ref: '#/components/schemas/respError/NoRequiredFormPermissionError'
 *                - $ref: '#/components/schemas/respError/InvalidAuthError'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.post('/:formId/drafts/:formVersionDraftId/publish', apiAccess, hasFormPermissions([P.FORM_READ, P.DESIGN_CREATE]), async (req, res, next) => {
  await controller.publishDraft(req, res, next);
});

/**
 * @openapi
 * /forms/{formId}/statusCodes:
 *  get:
 *    tags:
 *      - Status
 *    summary: List status codes for a form
 *    description: This endpoint will fetch Form API Key details.
 *    security:
 *      - bearerAuth: []
 *        openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/FormGetStatusCodes'
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/NoFormAccessError'
 *                - $ref: '#/components/schemas/respError/UserNotFoundError'
 *                - $ref: '#/components/schemas/respError/NoRequiredFormPermissionError'
 *                - $ref: '#/components/schemas/respError/InvalidAuthError'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.get('/:formId/statusCodes', apiAccess, hasFormPermissions([P.FORM_READ]), async (req, res, next) => {
  await controller.getStatusCodes(req, res, next);
});

/**
 * @openapi
 * /forms/{formId}/apiKey:
 *  get:
 *    tags:
 *      - Form API Key
 *    summary: Get current API Key
 *    description: This endpoint will fetch Form API Key details.
 *    security:
 *      - bearerAuth: []
 *        openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/FormReadAPIkey'
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/NoFormAccessError'
 *                - $ref: '#/components/schemas/respError/UserNotFoundError'
 *                - $ref: '#/components/schemas/respError/NoRequiredFormPermissionError'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.get('/:formId/apiKey', hasFormPermissions(P.FORM_API_READ), async (req, res, next) => {
  await controller.readApiKey(req, res, next);
});

/**
 * @openapi
 * /forms/{formId}/apiKey:
 *  put:
 *    tags:
 *      - Form API Key
 *    summary: Create/Replace API Key
 *    description: This endpoint will create Form API Key.
 *    security:
 *      - bearerAuth: []
 *        openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/FormCreateOrReplaceApiKey'
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/NoFormAccessError'
 *                - $ref: '#/components/schemas/respError/UserNotFoundError'
 *                - $ref: '#/components/schemas/respError/FormIdNotFoundError'
 *                - $ref: '#/components/schemas/respError/NoRequiredFormPermissionError'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.put('/:formId/apiKey', hasFormPermissions(P.FORM_API_CREATE), async (req, res, next) => {
  await controller.createOrReplaceApiKey(req, res, next);
});

/**
 * @openapi
 * /forms/{formId}/apiKey:
 *  delete:
 *    tags:
 *      - Form API Key
 *    summary: Delete API Key
 *    description: This endpoint will delete the Form API Key
 *    security:
 *      - bearerAuth: []
 *        openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *    responses:
 *      '200':
 *        description: Success
 *      '403':
 *        $ref: '#/components/responses/Error/Forbidden'
 *      '401':
 *        description: Unauthorized
 *        content:
 *          application/json:
 *            schema:
 *              oneOf:
 *                - $ref: '#/components/schemas/respError/NoFormAccessError'
 *                - $ref: '#/components/schemas/respError/UserNotFoundError'
 *                - $ref: '#/components/schemas/respError/NoRequiredFormPermissionError'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.delete('/:formId/apiKey', hasFormPermissions(P.FORM_API_DELETE), async (req, res, next) => {
  await controller.deleteApiKey(req, res, next);
});

/**
 * @openapi
 * /forms/formcomponents/proactivehelp/list:
 *  get:
 *    tags:
 *      - Forms
 *    summary: Get list of all the proactive help details
 *    description: This endpoint will fetch the list of all the proactive help details.
 *    security:
 *      - basicAuth: []
 *      - bearerAuth: []
 *        openId: []
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/responses/responseBody/FormProactiveHelpList'
 *      '403':
 *        $ref: '#/components/responses/Error/AccessDenied'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 */
routes.get('/formcomponents/proactivehelp/list', async (req, res, next) => {
  await controller.listFormComponentsProactiveHelp(req, res, next);
});

/**
 * @openapi
 * /forms/{formId}/csvexport/fields:
 *  get:
 *    tags:
 *      - Forms
 *    summary: Get list of form version fields
 *    description: This endpoint will fetch the list of form version fields.
 *    security:
 *      - basicAuth: []
 *      - bearerAuth: []
 *        openId: []
 *    parameters:
 *      - in: path
 *        name: formId
 *        schema:
 *          type: string
 *          format: uuid
 *        description: ID of the form.
 *        required: true
 *        example: c6455376-382c-439d-a811-0381a012d696
 *      - in: query
 *        name: draft
 *        schema:
 *          type: boolean
 *        description: draft status of the submission.
 *        required: true
 *        example: false
 *      - in: query
 *        name: deleted
 *        schema:
 *          type: boolean
 *        description: delete status of the form.
 *        example: false
 *        required: true
 *      - in: query
 *        name: version
 *        schema:
 *          type: number
 *        description: The form version.
 *        example: 2
 *      - in: query
 *        name: type
 *        schema:
 *          type: string
 *        description: default value is submissions.
 *        example: submissions
 *        default: submissions
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          application/json:
 *            schema:
 *      '401':
 *        $ref: '#/components/responses/Error/NoFormAccess'
 *      '403':
 *        $ref: '#/components/responses/Error/AccessDenied'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 *      '404':
 *        $ref: '#/components/responses/Error/ResourceNotFound'
 */
routes.get('/:formId/csvexport/fields', middleware.publicRateLimiter, apiAccess, hasFormPermissions([P.FORM_READ]), async (req, res, next) => {
  await controller.readFieldsForCSVExport(req, res, next);
});

/**
 * @openapi
 * /forms/formcomponents/proactivehelp/imageUrl/{componentId}:
 *  get:
 *    tags:
 *      - Forms
 *    summary: Get the image of the form.io component proactive help
 *    description: This endpoint will get the image of the form.io component proactive help.
 *    security:
 *      - basicAuth: []
 *      - bearerAuth: []
 *        openId: []
 *    parameters:
 *      - in: path
 *        name: componentId
 *        schema:
 *          type: string
 *        description: Id of the Form.io component. This is a database generated Id.
 *        required: true
 *        example: true
 *    responses:
 *      '200':
 *        description: Success
 *        content:
 *          image/png:
 *            schema:
 *              type: object
 *              properties:
 *                url:
 *                  type: string
 *                  format: binary
 *      '403':
 *        $ref: '#/components/responses/Error/AccessDenied'
 *      '5XX':
 *        $ref: '#/components/responses/Error/UnExpected'
 *      '404':
 *        $ref: '#/components/responses/Error/ResourceNotFound'
 */
routes.get('/formcomponents/proactivehelp/imageUrl/:componentId', async (req, res, next) => {
  await controller.getFCProactiveHelpImageUrl(req, res, next);
});

routes.get('/:formId/subscriptions', hasFormPermissions([P.FORM_READ, P.FORM_UPDATE]), async (req, res, next) => {
  await controller.readFormSubscriptionDetails(req, res, next);
});

routes.put('/:formId/subscriptions', hasFormPermissions([P.FORM_READ, P.FORM_UPDATE]), async (req, res, next) => {
  await controller.createOrUpdateSubscriptionDetails(req, res, next);
});

module.exports = routes;
