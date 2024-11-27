const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const PROGRAMACION_TABLE = process.env.TABLE_NAME_PROGRAMACION;

exports.handler = async () => {
    try {
        const params = { TableName: PROGRAMACION_TABLE };
        const result = await dynamodb.scan(params).promise();

        return {
            statusCode: 200,
            body: JSON.stringify({ programaciones: result.Items }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error al obtener las programaciones' }),
        };
    }
};
