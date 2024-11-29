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
        const tenant_id = body.tenant_id;
        const fechaHora = body.fechaHora;
        const duracion = body.duracion;
        const idioma = body.idioma;
        const estado = body.estado;
        const formato = body.formato;

        // Validar que los datos requeridos estén presentes
        if (!tenant_id || !fechaHora || !duracion || !idioma || !estado || !formato) {
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

        // Proceso - Guardar programación en DynamoDB
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const item = {
            tenant_id,
            ordenamiento: require('uuid').v4(),
            fechaHora,
            duracion,
            idioma,
            estado,
            formato,
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
