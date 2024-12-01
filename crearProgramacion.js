const AWS = require('aws-sdk');
const { randomUUID } = require('crypto'); // Usar randomUUID de crypto

exports.handler = async (event) => {
    console.log('Evento recibido:', event);

    try {
        const { TABLE_NAME_PROGRAMACION, LAMBDA_VALIDAR_TOKEN } = process.env;
        if (!TABLE_NAME_PROGRAMACION || !LAMBDA_VALIDAR_TOKEN) {
            throw new Error('Variables de entorno no configuradas');
        }

        let body = JSON.parse(event.body || '{}');
        const { tenant_id, fechaHora, duracion, idioma, estado, formato } = body;

        if (!tenant_id || !fechaHora || !duracion || !idioma || !estado || !formato) {
            return { statusCode: 400, status: 'Bad Request - Faltan datos en la solicitud' };
        }

        const token = event.headers?.Authorization;
        if (!token) {
            return { statusCode: 401, status: 'Unauthorized - Falta el token de autorización' };
        }

        const lambda = new AWS.Lambda();
        const invokeResponse = await lambda.invoke({
            FunctionName: LAMBDA_VALIDAR_TOKEN,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify({ tenant_id, token }),
        }).promise();

        const response = JSON.parse(invokeResponse.Payload || '{}');
        if (response.statusCode !== 200) {
            return { statusCode: 403, status: 'Forbidden - Token inválido' };
        }

        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const item = {
            tenant_id,
            ordenamiento: randomUUID(), // Usar randomUUID en lugar de uuid.v4
            fechaHora,
            duracion,
            idioma,
            estado,
            formato,
            createdAt: new Date().toISOString(),
        };

        await dynamodb.put({
            TableName: TABLE_NAME_PROGRAMACION,
            Item: item,
        }).promise();

        return {
            statusCode: 201,
            message: 'Programación creada exitosamente',
            programacion: item,
        };
    } catch (error) {
        console.error('Error:', error);
        return { statusCode: 500, status: error.message };
    }
};
