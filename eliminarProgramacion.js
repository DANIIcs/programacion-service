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

        // Obtener datos del cuerpo
        const { tenant_id, ordenamiento } = JSON.parse(event.body || '{}');

        // Validar datos
        if (!tenant_id || !ordenamiento) {
            return {
                statusCode: 400,
                status: 'Bad Request - tenant_id y ordenamiento son obligatorios',
            };
        }

        // Eliminar programación de DynamoDB
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        await dynamodb.delete({
            TableName: tablaProgramacion,
            Key: { tenant_id, ordenamiento },
        }).promise();

        // Respuesta exitosa
        return {
            statusCode: 200,
            message: 'Programación eliminada exitosamente',
        };
    } catch (error) {
        console.error(`Error inesperado: ${error.message}`);
        return {
            statusCode: 500,
            status: 'Internal Server Error - Error al eliminar la programación',
            error: error.message,
        };
    }
};
