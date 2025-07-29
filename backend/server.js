const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3001;

// In-memory database
let reports = [];

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // Increase limit for images
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// GET all reports
app.get('/api/reports', (req, res) => {
  // Return newest first
  res.json(reports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))); 
});

// POST a new report
app.post('/api/reports', (req, res) => {
  const report = req.body;
  if (!report || !report.type) {
    return res.status(400).json({ error: 'Invalid report data' });
  }
  
  const newReport = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    ...report
  };
  
  reports.push(newReport);
  console.log(`New report received: ${newReport.type} - ID: ${newReport.id}`);
  res.status(201).json(newReport);
});

// DELETE all reports
app.delete('/api/reports', (req, res) => {
    reports = [];
    console.log('All reports deleted.');
    res.status(204).send();
});


app.listen(port, () => {
  console.log(`SafeSpace AI backend listening on http://localhost:${port}`);
  console.log('Endpoints:');
  console.log(`  GET    /api/reports`);
  console.log(`  POST   /api/reports`);
  console.log(`  DELETE /api/reports`);
});
