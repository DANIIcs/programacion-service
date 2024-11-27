const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const PROGRAMACION_TABLE = process.env.TABLE_NAME_PROGRAMACION;

exports.handler = async (event) => {
    try {
        const { tenant_id, ordenamiento } = event.pathParameters;

        const params = {
            TableName: PROGRAMACION_TABLE,
            Key: { tenant_id, ordenamiento },
        };

        const result = await dynamodb.get(params).promise();

        if (!result.Item) {
            return { statusCode: 404, body: JSON.stringify({ message: 'Programación no encontrada' }) };
        }

        return { statusCode: 200, body: JSON.stringify({ programacion: result.Item }) };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error al obtener la programación' }),
        };
    }
};
