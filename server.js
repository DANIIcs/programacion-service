const express = require('express');
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

AWS.config.update({ region: 'us-east-1' });
const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Función para validar el token llamando a la Lambda "ValidarTokenAcceso"
const validateToken = async (tenant_id, token) => {
    const lambda = new AWS.Lambda();
    const params = {
        FunctionName: 'ValidarTokenAcceso',
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({ tenant_id, token })
    };

    try {
        const response = await lambda.invoke(params).promise();
        const result = JSON.parse(response.Payload);

        if (result.statusCode !== 200) {
            throw new Error(result.body || 'Token inválido');
        }
        return true; // Token válido
    } catch (error) {
        throw new Error(`Error al validar el token: ${error.message}`);
    }
};

// Endpoint para crear una nueva programación
app.post('/programacion', async (req, res) => {
    const { tenant_id, ordenamiento, fechaHora, duracion, idioma, estado, formato } = req.body;
    const token = req.headers['authorization']; // Token en el header Authorization

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized - Falta el token de autorización' });
    }

    try {
        // Validar el token antes de procesar la solicitud
        await validateToken(tenant_id, token);

        const params = {
            TableName: 'Programacion',
            Item: {
                tenant_id,
                ordenamiento,
                fechaHora,
                duracion,
                idioma,
                estado,
                formato
            }
        };

        await dynamoDb.put(params).promise();
        res.status(201).json({
            message: 'Programación creada exitosamente',
            programacion: params.Item
        });
    } catch (error) {
        const statusCode = error.message.includes('Token') ? 403 : 500;
        res.status(statusCode).json({ error: error.message });
    }
});

// Endpoint para obtener programación por tenant_id y ordenamiento
app.get('/programacion/:tenant_id/:ordenamiento', async (req, res) => {
    const { tenant_id, ordenamiento } = req.params;
    const token = req.headers['authorization']; // Token en el header Authorization

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized - Falta el token de autorización' });
    }

    try {
        // Validar el token antes de procesar la solicitud
        await validateToken(tenant_id, token);

        const params = {
            TableName: 'Programacion',
            Key: {
                tenant_id,
                ordenamiento
            }
        };

        const result = await dynamoDb.get(params).promise();
        if (result.Item) {
            res.json({ programacion: result.Item });
        } else {
            res.status(404).json({ error: 'Programación no encontrada' });
        }
    } catch (error) {
        const statusCode = error.message.includes('Token') ? 403 : 500;
        res.status(statusCode).json({ error: error.message });
    }
});

// Endpoint para actualizar la programación
app.put('/programacion/:tenant_id/:ordenamiento', async (req, res) => {
    const { tenant_id, ordenamiento } = req.params;
    const { fechaHora, duracion, idioma, estado, formato } = req.body;
    const token = req.headers['authorization']; // Token en el header Authorization

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized - Falta el token de autorización' });
    }

    try {
        // Validar el token antes de procesar la solicitud
        await validateToken(tenant_id, token);

        const params = {
            TableName: 'Programacion',
            Key: { tenant_id, ordenamiento },
            UpdateExpression: 'set fechaHora = :fechaHora, duracion = :duracion, idioma = :idioma, estado = :estado, formato = :formato',
            ExpressionAttributeValues: {
                ':fechaHora': fechaHora,
                ':duracion': duracion,
                ':idioma': idioma,
                ':estado': estado,
                ':formato': formato
            },
            ReturnValues: 'UPDATED_NEW'
        };

        const result = await dynamoDb.update(params).promise();
        res.json({
            message: 'Programación actualizada',
            updatedAttributes: result.Attributes
        });
    } catch (error) {
        const statusCode = error.message.includes('Token') ? 403 : 500;
        res.status(statusCode).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
