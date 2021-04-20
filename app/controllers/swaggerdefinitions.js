/**
 *@swagger
 *definitions:
 *  Date:
 *    type: string
 *    description: format => YYYY-MM-DDTHH:mm:ss.SSS (date.toJSON)
 *    example: "2018-03-29T11:44:12.511Z"
 *  Pagination:
 *    type: object
 *    description: Pagination object scheme.
 *    properties:
 *      page:
 *        type: number
 *        example: 0
 *      size:
 *        type: number
 *        example: 10
 *      sort:
 *        type: string
 *        example: 'name,asc'
 *  FlaskRiskgraphDataRequestRpc:
 *    type: object
 *    required:
 *      - data
 *      - rangeData
 *    properties:
 *      data:
 *        type: array
 *        example: [{"data1":1,"timestamp":"2020-01-28"},{"data1":3,"data2":2,"timestamp":""},{"data3":1,"data2":5},{"data1":20,"data2":2}]
 *      rangeData:
 *        type: array
 *        example: [{"data1":{"lowerBound": 0, "upperBound": 10}}, {"data3":{"lowerBound": 2, "upperBound": 10}}]
 *      toleranceData:
 *        type: object
 *        example: {"data1":2, "data3": 4}
 *  OmdenaDataRequestRpc:
 *    type: object
 *    required:
 *      - endpoint
 *      - data
 *      - models
 *      - ranges
 *      - level
 *    properties:
 *      endpoint:
 *        type: string
 *        example : "d290f1ee-6c54-4b01-90e6-d701748f0851"
 *      data:
 *        type: object
 *        example: {"timestamp":"2021-05-25","key1":"value1","key2":"value2","key3":"value3"}
 *      models:
 *        type: array
 *        example: [{"y":"key1","x":"key1"}, {"y":"key2", "x":"key2"}]
 *# Common responses
 *  responses:
 *    '404':
 *      description: The specified resource was not found.
 *      schema:
 *        $ref: '#/definitions/schemas/ErrorTEXT'
 *    '401':
 *      description: Unauthorized
 *      schema:
 *        $ref: '#/definitions/schemas/ErrorTEXT'
 *    '400':
 *      description: Invalid input
 *      schema:
 *        $ref: '#/definitions/schemas/ErrorTEXT'
 *    '500':
 *      description: Internal server error
 *# Common schemas
 *  schemas:
 *    ErrorJSON:
 *        type: object
 *        properties:
 *          code:
 *            type: string
 *            example: CODE_123
 *          message:
 *            type: string
 *            example: Some thing wrong...
 *        required:
 *          - code
 *          - message
 *    ErrorTEXT:
 *      type: string
 *      example: "[mark of module/table/reason] Explanation of error."
 *# Schema Authentication token header
 *    Authentication:
 *      name: Authorization
 *      description: "Authorization token in the standard form. Possible values: 'Authorization: JWT <ACCESS_TOKEN>' or 'Authorization: Bearer <ACCESS_TOKEN>'"
 *      required: true
 *      example: " JWT eyJ0eXAiOiJKV"
 *      schema:
 *        type: string
 *# Schema EDC environment header
 *    EDC:
 *      name: EDC
 *      description: String with EDC database ID
 *      required: true
 *      example: clearclinica
 *      schema:
 *        type: string
 *# Schema Flask public token in the path
 *    FlaskToken:
 *      name: token
 *      description: String with token from Flask Mongo database
 *      required: true
 *      example: gjEvzdrSnCo4
 *      schema:
 *        type: string
 */
