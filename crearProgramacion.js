const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const uuid = require('uuid');

const PROGRAMACION_TABLE = process.env.TABLE_NAME_PROGRAMACION;

exports.handler = async (event) => {
    try {
        const token = event.headers.Authorization.split(' ')[1];
        const authPayload = await verifyToken(token);

        if (!authPayload) {
            return {
                statusCode: 403,
                body: JSON.stringify({ message: 'Token inválido o expirado' }),
            };
        }

        const data = JSON.parse(event.body);
        const item = {
            tenant_id: data.tenant_id,
            ordenamiento: uuid.v4(),
            fechaHora: data.fechaHora,
            duracion: data.duracion,
            idioma: data.idioma,
            estado: data.estado,
            formato: data.formato,
        };

        await dynamodb.put({
            TableName: PROGRAMACION_TABLE,
            Item: item,
        }).promise();

        return {
            statusCode: 201,
            body: JSON.stringify({ message: 'Programación creada con éxito', programacion: item }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error al crear la programación' }),
        };
    }
};

async function verifyToken(token) {
    try {
        const secret = process.env.JWT_SECRET;
        const payload = jwt.verify(token, secret);
        return payload;
    } catch (error) {
        return null;
    }
}
