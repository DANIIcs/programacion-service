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

        // Obtener parámetros y datos del cuerpo
        const { tenant_id, ordenamiento } = event.pathParameters || {};
        const body = JSON.parse(event.body || '{}');

        // Validar datos
        if (!tenant_id || !ordenamiento) {
            return {
                statusCode: 400,
                status: 'Bad Request - tenant_id y ordenamiento son obligatorios',
            };
        }

        // Configurar actualización en DynamoDB
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const params = {
            TableName: tablaProgramacion,
            Key: { tenant_id, ordenamiento },
            UpdateExpression: 'set fechaHora = :fechaHora, duracion = :duracion, idioma = :idioma, estado = :estado, formato = :formato',
            ExpressionAttributeValues: {
                ':fechaHora': body.fechaHora,
                ':duracion': body.duracion,
                ':idioma': body.idioma,
                ':estado': body.estado,
                ':formato': body.formato,
            },
            ReturnValues: 'UPDATED_NEW',
        };

        const result = await dynamodb.update(params).promise();

        // Respuesta exitosa
        return {
            statusCode: 200,
            message: 'Programación actualizada exitosamente',
            updatedAttributes: result.Attributes,
        };
    } catch (error) {
        console.error(`Error inesperado: ${error.message}`);
        return {
            statusCode: 500,
            status: 'Internal Server Error - Error al modificar la programación',
            error: error.message,
        };
    }
};
