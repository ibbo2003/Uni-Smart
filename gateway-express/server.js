const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();
const app = express();
app.use(cors());
app.use(express.json());

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
};

const pythonServiceUrl = process.env.PYTHON_API_URL;

app.post('/api/timetable/generate', async (req, res) => {
    console.log(`[GATEWAY] Received request to generate timetable...`);
    const { semester, section, classroom, subjects } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    
    try {
        const sectionId = `${semester}_${section}`;
        await connection.execute('INSERT INTO sections (id, name, semester, classroom) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE classroom=VALUES(classroom)', 
            [sectionId, `${semester} ${section}`, semester, classroom]);
        console.log('[GATEWAY] ✅ Database connection successful.');

        for (const sub of subjects) {
            if (sub.theory_faculty) await connection.execute('INSERT IGNORE INTO faculty (id, name) VALUES (?, ?)', [sub.theory_faculty, sub.theory_faculty]);
            if (sub.lab_faculty) await connection.execute('INSERT IGNORE INTO faculty (id, name) VALUES (?, ?)', [sub.lab_faculty, sub.lab_faculty]);
            
            await connection.execute(
                `INSERT INTO subjects (subject_code, section_id, subject_name, subject_type, theory_hours, lab_hours, no_of_batches, theory_faculty_id, lab_faculty_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE subject_name=VALUES(subject_name), theory_hours=VALUES(theory_hours), lab_hours=VALUES(lab_hours)`,
                [sub.subject_code, sectionId, sub.subject_name, sub.subject_type, sub.theory_hours, sub.lab_hours, sub.no_of_batches, sub.theory_faculty || null, sub.lab_faculty || null]
            );
        }
        console.log(`[GATEWAY] ➡ Calling Python algorithm service at ${pythonServiceUrl}...`);
        const response = await axios.post(pythonServiceUrl, { subjects: subjects.map(s => ({...s, semester, section})) });
        const generatedTimetable = response.data;
        
        console.log(`[GATEWAY] ⬅ Successfully received ${generatedTimetable.length} scheduled slots from Python.`);

        if (generatedTimetable.length > 0) {
            console.log('[GATEWAY] 💾 Saving generated timetable to the database...');
            const insertQuery = `INSERT INTO scheduled_classes (day, period, subject_code, subject_name, subject_type, faculty_id, section_id, room_id, batch_number, is_theory) VALUES ?`;
            const values = generatedTimetable.map(slot => [
                slot.day, slot.period, slot.subject_code, slot.subject_name, slot.subject_type,
                slot.faculty_id, slot.section_id, slot.room_id, slot.batch_number, slot.is_theory
            ]);
            await connection.query(insertQuery, [values]);
            console.log('[GATEWAY] ✅ Timetable saved successfully.');
            // After saving, fetch the timetable we just created for the specific section
            const [rows] = await connection.execute('SELECT * FROM scheduled_classes WHERE section_id = ? ORDER BY day, period', [sectionId]);
            console.log(`[GATEWAY] ✅ Fetched ${rows.length} slots to return to frontend.`);
            
            // Return a success message AND the newly created timetable data
            res.status(200).json({ 
                message: 'Timetable generated and saved successfully!',
                timetable: rows // Send the timetable data back
            });
        }else{
            console.log('[GATEWAY] 🟡 Python service returned an empty timetable. Nothing to save.');
        }

        res.status(200).json({ message: 'Timetable generated and saved successfully!' });
    } catch (error) {
        console.error('[GATEWAY] ❌ An error occurred in the gateway:');
        if (error.response) {
            // Error from the Python service
            console.error('   - Error from Python Service:', error.response.data);
        } else if (error.code) {
            // Error from the database
            console.error('   - Database Error Code:', error.code);
            console.error('   - Database Error Message:', error.message);
        } else {
            // Generic error
            console.error('   - Generic Error:', error.message);
        }
        res.status(500).json({ message: 'An error occurred', error: error.message });
    } finally {
        if (connection) connection.end();
        console.log('[GATEWAY] Database connection closed.');
    }
});

app.get('/api/timetables/available', async (req, res) => {
    console.log('[GATEWAY] Received request for available timetables.');
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            'SELECT DISTINCT section_id FROM scheduled_classes ORDER BY section_id ASC'
        );
        const sectionIds = rows.map(row => row.section_id);
        console.log(`[GATEWAY] Found available timetables: ${sectionIds.join(', ')}`);
        res.status(200).json(sectionIds);
    } catch (error) {
        console.error('[GATEWAY] Error fetching available timetables:', error.message);
        res.status(500).json({ message: 'Failed to fetch available timetables' });
    } finally {
        if (connection) connection.end();
    }
});

// ▼▼▼ NEW ENDPOINT 2: Get the full timetable data for a specific section_id ▼▼▼
app.get('/api/timetable/:sectionId', async (req, res) => {
    const { sectionId } = req.params;
    console.log(`[GATEWAY] Received request for timetable: ${sectionId}`);
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute(
            'SELECT * FROM scheduled_classes WHERE section_id = ? ORDER BY day, period',
            [sectionId]
        );
        console.log(`[GATEWAY] Fetched ${rows.length} slots for ${sectionId}.`);
        res.status(200).json(rows);
    } catch (error) {
        console.error(`[GATEWAY] Error fetching timetable for ${sectionId}:`, error.message);
        res.status(500).json({ message: `Failed to fetch timetable for ${sectionId}` });
    } finally {
        if (connection) connection.end();
    }
});

app.post('/api/exams/generate-seating', async (req, res) => {
    console.log('[GATEWAY] Received request to generate exam seating...');
    const { exam_date, exam_session } = req.body;
    let connection;
    try {
        const examServiceUrl = 'http://127.0.0.1:5001/generate_seating';
        console.log(`[GATEWAY] ➡ Calling Python exam service...`);
        
        const response = await axios.post(examServiceUrl, { exam_date, exam_session });
        const seatingPlan = response.data;
        
        console.log(`[GATEWAY] ⬅ Received seating plan for ${seatingPlan.length} students.`);
        
        // ▼▼▼ NEW: Save the seating plan to the database ▼▼▼
        if (seatingPlan.length > 0) {
            connection = await mysql.createConnection(dbConfig);
            console.log('[GATEWAY] 💾 Saving seating plan to the database...');

            // 1. Get all unique subject codes from the generated plan
            const subjectCodes = [...new Set(seatingPlan.map(s => s.subject_code))];

            // 2. Find the corresponding exam IDs from the 'exams' table
            const [examRows] = await connection.execute(
                `SELECT id, subject_code FROM exams WHERE exam_date = ? AND exam_session = ? AND subject_code IN (?)`,
                [exam_date, exam_session, subjectCodes]
            );
            const examIdMap = new Map(examRows.map(e => [e.subject_code, e.id]));
            const examIdsToDelete = Array.from(examIdMap.values());

            // 3. Delete any old seating plan for these exams to avoid conflicts
            if (examIdsToDelete.length > 0) {
                await connection.execute(`DELETE FROM exam_seating_plan WHERE exam_id IN (?)`, [examIdsToDelete]);
                console.log(`[GATEWAY] Cleared old seating plan for ${examIdsToDelete.length} exams.`);
            }

            // 4. Prepare and insert the new seating plan data
            const valuesToInsert = seatingPlan.map(seat => [
                seat.student_usn,
                examIdMap.get(seat.subject_code), // Get the correct exam_id
                seat.room_id,
                seat.row_num,
                seat.col_num
            ]);

            const insertQuery = `INSERT INTO exam_seating_plan (student_usn, exam_id, room_id, row_num, col_num) VALUES ?`;
            await connection.query(insertQuery, [valuesToInsert]);
            console.log(`[GATEWAY] ✅ Successfully saved ${valuesToInsert.length} new seat assignments.`);
        }
        
        res.status(200).json({
            message: 'Seating plan generated and saved successfully!',
            seatingPlan: seatingPlan
        });

    } catch (error) {
        console.error('[GATEWAY] ❌ Error in exam seating process:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'An error occurred during seating generation' });
    } finally {
        if (connection) connection.end();
    }
});


app.listen(8080, () => console.log(`Node.js gateway listening on port 8080`));