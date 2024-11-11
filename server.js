const express = require('express');
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

AWS.config.update({ region: 'us-east-1' }); // Cambia la región según tu configuración
const dynamoDb = new AWS.DynamoDB.DocumentClient();

// Endpoint para crear una nueva programación
app.post('/programacion', async (req, res) => {
    const { tenant_id, ordenamiento, fechaHora, duracion, idioma, estado, formato } = req.body;

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

    try {
        await dynamoDb.put(params).promise();
        res.status(201).json({
            message: 'Programación creada exitosamente',
            programacion: params.Item
        });
    } catch (error) {
        res.status(500).json({ error: 'No se pudo crear la programación', details: error.message });
    }
});

// Endpoint para obtener programación por tenant_id y ordenamiento
app.get('/programacion/:tenant_id/:ordenamiento', async (req, res) => {
    const { tenant_id, ordenamiento } = req.params;

    const params = {
        TableName: 'Programacion',
        Key: {
            tenant_id,
            ordenamiento
        }
    };

    try {
        const result = await dynamoDb.get(params).promise();
        if (result.Item) {
            res.json({ programacion: result.Item });
        } else {
            res.status(404).json({ error: 'Programación no encontrada' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener la programación', details: error.message });
    }
});

// Endpoint para actualizar la programación
app.put('/programacion/:tenant_id/:ordenamiento', async (req, res) => {
    const { tenant_id, ordenamiento } = req.params;
    const { fechaHora, duracion, idioma, estado, formato } = req.body;

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

    try {
        const result = await dynamoDb.update(params).promise();
        res.json({
            message: 'Programación actualizada',
            updatedAttributes: result.Attributes
        });
    } catch (error) {
        res.status(500).json({ error: 'No se pudo actualizar la programación', details: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
