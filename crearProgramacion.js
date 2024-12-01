const AWS = require('aws-sdk');

exports.handler = async (event) => {
    console.log(event);

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
        const tenantcine_id = body.tenantcine_id; //tenant_id#cine_id
        const prog_cine_id = body.prog_cine_id; //fecha#pelicula
        const tenantpelicula_id = body.tenantpelicula_id; //tenant_id#pelicula_id
        const prog_pelicula_id = body.prog_pelicula_id; //fecha#cine
        const duracion = body.duracion;
        const idioma = body.idioma;

        // Validar que los datos requeridos estén presentes
        if (!tenantcine_id || !prog_cine_id || !tenantpelicula_id || !prog_pelicula_id || !duracion || !idioma) {
            return {
                statusCode: 400,
                status: 'Bad Request - Faltan datos en la solicitud',
            };
        }

        // Proteger el Lambda
        const token = event.headers?.Authorization;
        if (!token) {
            return {
                statusCode: 401,
                status: 'Unauthorized - Falta el token de autorización',
            };
        }


        const cadenaCine = tenantcine_id.split('#')[0];

        // Invocar otro Lambda para validar el token
        const lambda = new AWS.Lambda();
        const payloadString = JSON.stringify({
            cadenaCine,
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

        // Proceso - Guardar programación en DynamoDB
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const item = {
            tenantcine_id,
            ordenamiento,
            tenantpelicula_id,
            ordenamiento_GSI,
            duracion,
            idioma,
        };

        await dynamodb.put({
            TableName: tablaProgramacion,
            Item: item,
        }).promise();

        // Salida (json)
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
