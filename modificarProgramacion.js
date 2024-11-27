const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const PROGRAMACION_TABLE = process.env.TABLE_NAME_PROGRAMACION;

exports.handler = async (event) => {
    try {
        const { tenant_id, ordenamiento } = event.pathParameters;
        const data = JSON.parse(event.body);

        if (!tenant_id || !ordenamiento) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'tenant_id y ordenamiento son obligatorios' }),
            };
        }

        const params = {
            TableName: PROGRAMACION_TABLE,
            Key: { tenant_id, ordenamiento },
            UpdateExpression: 'set fechaHora = :fechaHora, duracion = :duracion, idioma = :idioma, estado = :estado, formato = :formato',
            ExpressionAttributeValues: {
                ':fechaHora': data.fechaHora,
                ':duracion': data.duracion,
                ':idioma': data.idioma,
                ':estado': data.estado,
                ':formato': data.formato,
            },
            ReturnValues: 'UPDATED_NEW',
        };

        const result = await dynamodb.update(params).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Programación actualizada', updatedAttributes: result.Attributes }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error al modificar la programación' }),
        };
    }
};
