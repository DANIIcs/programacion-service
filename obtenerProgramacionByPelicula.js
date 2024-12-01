const AWS = require('aws-sdk');

exports.handler = async (event) => {
    console.log('Obteniendo programaciones por títulos');

    try {
        // Validar las variables de entorno
        const { TABLE_NAME_PROGRAMACION, LAMBDA_VALIDAR_TOKEN } = process.env;
        if (!TABLE_NAME_PROGRAMACION || !LAMBDA_VALIDAR_TOKEN) {
            throw new Error('Variables de entorno no configuradas');
        }

        const tablaProgramacion = TABLE_NAME_PROGRAMACION;
        const lambdaToken = LAMBDA_VALIDAR_TOKEN;

        // Analizar el cuerpo de la solicitud
        let body = event.body || {};
        if (typeof body === 'string') {
            body = JSON.parse(body);
        }

        // Obtener los parámetros necesarios
        const { tenant_id, titulo_id } = body;

        if (!tenant_id || !titulo_id) {
            return {
                statusCode: 400,
                status: 'Bad Request - Faltan datos en la solicitud',
            };
        }

        // Proteger el Lambda con validación del token
        const token = event.headers?.Authorization;
        if (!token) {
            return {
                statusCode: 401,
                status: 'Unauthorized - Falta el token de autorización',
            };
        }

        // Invocar otro Lambda para validar el token
        const lambda = new AWS.Lambda();
        const invokeResponse = await lambda.invoke({
            FunctionName: lambdaToken,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify({ tenant_id, token }),
        }).promise();

        const response = JSON.parse(invokeResponse.Payload || '{}');
        console.log('Respuesta de validación del token:', response);

        if (response.statusCode !== 200) {
            return {
                statusCode: 403,
                status: 'Forbidden - Token inválido',
            };
        }

        // Configurar la fecha/hora actual para comparaciones
        const fechaActual = new Date().toISOString();
        console.log(`Fecha actual (ISO): ${fechaActual}`);

        // Configuración de DynamoDB para realizar la consulta (query)
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const params = {
            TableName: tablaProgramacion,
            IndexName: 'PeliculaIndex', // Nombre del GSI
            KeyConditionExpression: 'titulo_id = :titulo_id',
            ExpressionAttributeValues: {
                ':titulo_id': titulo_id,
                ':fechaActual': fechaActual,
            },
            FilterExpression: 'fechaHora >= :fechaActual', // Filtra por fecha/hora
        };

        const result = await dynamodb.query(params).promise();

        // Respuesta exitosa
        return {
            statusCode: 200,
            message: 'Programaciones obtenidas exitosamente',
            programaciones: result.Items,
        };
    } catch (error) {
        console.error(`Error inesperado: ${error.message}`);
        return {
            statusCode: 500,
            status: 'Internal Server Error - Error al obtener las programaciones',
            error: error.message,
        };
    }
};
