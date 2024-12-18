const AWS = require('aws-sdk');

exports.handler = async (event) => {
    console.log('Obteniendo todas las reservas para la película');

    try {
        // Validar las variables de entorno
        if (!process.env.TABLE_NAME_RESERVAS || !process.env.LAMBDA_VALIDAR_TOKEN) {
            return {
                statusCode: 500,
                body: JSON.stringify({
                    status: 'Internal Server Error - Variables de entorno no configuradas',
                }),
            };
        }

        const tablaReservas = process.env.TABLE_NAME_RESERVAS; // Nombre de la tabla de reservas
        const lambdaToken = process.env.LAMBDA_VALIDAR_TOKEN; // Lambda para validar token

        // Analizar el cuerpo de la solicitud
        let body = {};
        if (event.body) {
            body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        }

        // Obtener los parámetros necesarios
        const tenant_id = body.tenant_id;
        const titulo_id = body.titulo_id; // ID de la película

        // Validar que los datos requeridos estén presentes
        if (!tenant_id || !titulo_id) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    status: 'Bad Request - Faltan datos en la solicitud (tenant_id o titulo_id)',
                }),
            };
        }

        // Construir clave compuesta para la película
        const tenantpelicula_id = `${tenant_id}#${titulo_id}`;

        // Validar el token de autorización
        const token = event.headers?.Authorization || event.headers?.authorization;
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
        const payloadString = JSON.stringify({
            tenant_id,
            token,
        });

        const invokeResponse = await lambda.invoke({
            FunctionName: lambdaToken,
            InvocationType: 'RequestResponse',
            Payload: payloadString,
        }).promise();

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

        // Configuración de DynamoDB para realizar la consulta (query)
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const params = {
            TableName: tablaReservas,
            IndexName: 'PeliculaIndex', // Índice secundario global
            KeyConditionExpression: 'tenantpelicula_id = :tenantpelicula_id',
            ExpressionAttributeValues: {
                ':tenantpelicula_id': tenantpelicula_id,
            },
        };

        console.log('Parámetros de DynamoDB Query:', params);
        const result = await dynamodb.query(params).promise();
        console.log('Resultados obtenidos de DynamoDB:', result.Items);

        // Respuesta exitosa
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Reservas obtenidas exitosamente',
                reservas: result.Items,
            }),
        };
    } catch (error) {
        console.error('Error inesperado:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({
                status: 'Internal Server Error - Error al obtener las reservas',
                error: error.message,
            }),
        };
    }
};
