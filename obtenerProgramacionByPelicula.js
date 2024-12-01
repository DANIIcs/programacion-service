const AWS = require('aws-sdk');

exports.handler = async (event) => {
    console.log('Obteniendo programaciones por títulos');

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

        // Obtener los parámetros necesarios
        const tenant_id = body.tenant_id;
        const titulo_id = body.titulo_id;

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
        const payloadString = JSON.stringify({
            tenant_id,
            token,
        });

        const invokeResponse = await lambda.invoke({
            FunctionName: lambdaToken,
            InvocationType: 'RequestResponse',
            Payload: payloadString,
        }).promise();

        const response = JSON.parse(invokeResponse.Payload);
        console.log(response);

        if (response.statusCode === 403) {
            return {
                statusCode: 403,
                status: 'Forbidden - Acceso NO Autorizado',
            };
        }

        // Configurar la fecha/hora actual para comparaciones
        const fechaActual = new Date().toISOString(); // Formato: YYYY-MM-DDTHH:mm:ss.sssZ
        console.log(`Fecha actual (ISO): ${fechaActual}`);

        // Configuración de DynamoDB para realizar la consulta (query)
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const params = {
            TableName: tablaProgramacion,
            KeyConditionExpression: 'tenant_id = :tenant_id AND titulo_id = :titulo_id',
            ExpressionAttributeValues: {
                ':tenant_id': tenant_id,
                ':titulo_id': titulo_id,
                ':fechaActual': fechaActual,
            },
            FilterExpression: 'fechaHora >= :fechaActual',
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
