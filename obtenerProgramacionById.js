const AWS = require('aws-sdk');

exports.handler = async (event) => {
    console.log(event);

    try {
        // Validar variables de entorno
        if (!process.env.TABLE_NAME_PROGRAMACION) {
            return {
                statusCode: 500,
                status: 'Internal Server Error - Variable de entorno TABLE_NAME_PROGRAMACION no configurada',
            };
        }

        const tablaProgramacion = process.env.TABLE_NAME_PROGRAMACION;

        // Obtener parámetros
        const { tenant_id, ordenamiento } = event.pathParameters || {};

        // Validar datos
        if (!tenant_id || !ordenamiento) {
            return {
                statusCode: 400,
                status: 'Bad Request - tenant_id y ordenamiento son obligatorios',
            };
        }

        // Obtener programación de DynamoDB
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const params = {
            TableName: tablaProgramacion,
            Key: { tenant_id, ordenamiento },
        };

        const result = await dynamodb.get(params).promise();

        if (!result.Item) {
            return {
                statusCode: 404,
                status: 'Not Found - Programación no encontrada',
            };
        }

        // Respuesta exitosa
        return {
            statusCode: 200,
            message: 'Programación obtenida exitosamente',
            programacion: result.Item,
        };
    } catch (error) {
        console.error(`Error inesperado: ${error.message}`);
        return {
            statusCode: 500,
            status: 'Internal Server Error - Error al obtener la programación',
            error: error.message,
        };
    }
};
