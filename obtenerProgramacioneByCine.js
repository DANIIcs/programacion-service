const AWS = require('aws-sdk');

exports.handler = async (event) => {
    console.log('Obteniendo todas las programaciones');

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

        // Obtener el tenant_id y otros datos
        const tenant_id = body.tenant_id;
        const cine_id = body.cine_id;

        // Concatenar las variables
        const resultado = `${tenant_id}#${cine_id}`;
        console.log(resultado);
        
        // Proteger el Lambda
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
        // Configurar la fecha/hora actual para comparaciones
        const fechaActual = new Date().toISOString().slice(0, 10); // Formato: YYYY-MM-DD
        console.log(`Fecha actual (YYYY-MM-DD): ${fechaActual}`);

        // Configuración de DynamoDB para realizar la consulta (query)
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const params = {
            TableName: tablaProgramacion,
            KeyConditionExpression: 'tenantcine_id = :prefix AND begins_with(prog_cine_id, :fechaActual)',
            ExpressionAttributeValues: {
                ':prefix': resultado,    // Prefijo para el tenant_id
                ':fechaActual': fechaActual, // Fecha/hora actual
            },
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
