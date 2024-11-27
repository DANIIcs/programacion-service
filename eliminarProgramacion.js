const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const PROGRAMACION_TABLE = process.env.TABLE_NAME_PROGRAMACION;

exports.handler = async (event) => {
    try {
        const { tenant_id, ordenamiento } = JSON.parse(event.body);

        if (!tenant_id || !ordenamiento) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'tenant_id y ordenamiento son obligatorios' }),
            };
        }

        const params = {
            TableName: PROGRAMACION_TABLE,
            Key: { tenant_id, ordenamiento },
        };

        await dynamodb.delete(params).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Programación eliminada con éxito' }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error al eliminar la programación' }),
        };
    }
};
