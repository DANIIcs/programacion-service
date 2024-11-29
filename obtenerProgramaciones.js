const AWS = require('aws-sdk');

exports.handler = async () => {
    console.log('Obteniendo todas las programaciones');

    try {
        // Validar variables de entorno
        if (!process.env.TABLE_NAME_PROGRAMACION) {
            return {
                statusCode: 500,
                status: 'Internal Server Error - Variable de entorno TABLE_NAME_PROGRAMACION no configurada',
            };
        }

        const tablaProgramacion = process.env.TABLE_NAME_PROGRAMACION;

        // Escanear todas las programaciones en DynamoDB
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const params = { TableName: tablaProgramacion };

        const result = await dynamodb.scan(params).promise();

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
