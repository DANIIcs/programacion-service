const AWS = require('aws-sdk');

exports.handler = async (event) => {
    console.log('Obteniendo programaciones por títulos');

    try {
        // Validar las variables de entorno
        const { TABLE_NAME_PROGRAMACION, LAMBDA_VALIDAR_TOKEN } = process.env;
        if (!TABLE_NAME_PROGRAMACION || !LAMBDA_VALIDAR_TOKEN) {
            return {
                statusCode: 500,
                body: JSON.stringify({
                    status: 'Internal Server Error - Variables de entorno no configuradas',
                }),
            };
        }

        const tablaProgramacion = TABLE_NAME_PROGRAMACION;
        const lambdaToken = LAMBDA_VALIDAR_TOKEN;

        // Analizar los parámetros de la solicitud
        const { pathParameters, headers } = event;
        const tenant_id = pathParameters?.tenant_id;
        const titulo_id = pathParameters?.titulo_id;

        if (!tenant_id || !titulo_id) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    status: 'Bad Request - Faltan datos en la solicitud (tenant_id o titulo_id)',
                }),
            };
        }

        // Validar el token de autorizaciónn
        const token = headers?.Authorization || headers?.authorization;
        if (!token) {
            return {
                statusCode: 401,
                body: JSON.stringify({
                    status: 'Unauthorized - Falta el token de autorización',
                }),
            };
        }

        // Invocar otro Lambda para validar el token
        const lambda = new AWS.Lambda();
        const invokeResponse = await lambda
            .invoke({
                FunctionName: lambdaToken,
                InvocationType: 'RequestResponse',
                Payload: JSON.stringify({ tenant_id, token }),
            })
            .promise();

        const response = JSON.parse(invokeResponse.Payload || '{}');
        console.log('Respuesta de validación del token:', response);

        if (response.statusCode !== 200) {
            return {
                statusCode: 403,
                body: JSON.stringify({
                    status: 'Forbidden - Token inválido',
                }),
            };
        }

        // Configurar DynamoDB para realizar la consulta
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const params = {
            TableName: tablaProgramacion,
            IndexName: 'PeliculaIndex', // Índice secundario global (GSI)
            KeyConditionExpression: 'tenantpelicula_id = :tenantpelicula_id',
            ExpressionAttributeValues: {
                ':tenantpelicula_id': `${tenant_id}#${titulo_id}`, // Concatenación de tenant_id y titulo_id
            },
        };

        console.log('Parámetros de DynamoDB Query:', params);
        const result = await dynamodb.query(params).promise();
        console.log('Resultados obtenidos de DynamoDB:', result.Items);

        // Respuesta exitosa
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Programaciones obtenidas exitosamente',
                programaciones: result.Items,
            }),
        };
    } catch (error) {
        console.error('Error inesperado:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({
                status: 'Internal Server Error - Error al obtener las programaciones',
                error: error.message,
            }),
        };
    }
};
