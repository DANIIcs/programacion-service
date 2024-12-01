const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

exports.handler = async (event) => {
    console.log('Evento recibido:', event);

    try {
        // Validar las variables de entorno
        if (!process.env.TABLE_NAME_PROGRAMACION || !process.env.LAMBDA_VALIDAR_TOKEN) {
            return {
                statusCode: 500,
                status: 'Internal Server Error - Variables de entorno no configuradas',
            };
        }

        const tablaProgramacion = process.env.TABLE_NAME_PROGRAMACION;
        const lambdaToken = process.env.LAMBDA_VALIDAR_TOKEN;

        // Analizar el cuerpo de la solicitud
        let body = event.body || {};
        if (typeof body === 'string') {
            body = JSON.parse(body);
        }

        // Obtener los datos necesarios
        const { tenant_id, fechaHora, duracion, idioma, estado, formato } = body;

        // Validar que los datos requeridos estén presentes
        if (!tenant_id || !fechaHora || !duracion || !idioma || !estado || !formato) {
            return {
                statusCode: 400,
                status: 'Bad Request - Faltan datos en la solicitud',
            };
        }

        // Validar el token de autorización
        const token = event.headers?.Authorization;
        if (!token) {
            return {
                statusCode: 401,
                status: 'Unauthorized - Falta el token de autorización',
            };
        }

        // Invocar otro Lambda para validar el token
        const lambda = new AWS.Lambda();
        const payloadString = JSON.stringify({ tenant_id, token });

        const invokeResponse = await lambda.invoke({
            FunctionName: lambdaToken,
            InvocationType: 'RequestResponse',
            Payload: payloadString,
        }).promise();

        const response = JSON.parse(invokeResponse.Payload);
        console.log('Respuesta de validación del token:', response);

        if (response.statusCode !== 200) {
            return {
                statusCode: 403,
                status: 'Forbidden - Acceso NO Autorizado',
            };
        }

        // Proceso - Guardar programación en DynamoDB
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const item = {
            tenant_id,
            ordenamiento: uuidv4(),
            fechaHora,
            duracion,
            idioma,
            estado,
            formato,
            createdAt: new Date().toISOString(), // Timestamp de creación
        };

        await dynamodb.put({
            TableName: tablaProgramacion,
            Item: item,
        }).promise();

        // Respuesta de éxito
        return {
            statusCode: 201,
            message: 'Programación creada exitosamente',
            programacion: item,
        };
    } catch (error) {
        console.error(`Error inesperado: ${error.message}`);
        return {
            statusCode: 500,
            status: 'Internal Server Error - Error al crear la programación',
            error: error.message,
        };
    }
};
