const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for large payloads

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
};

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.locals.db = pool;
const exportRoutes = require('./ttoutput.js');
app.use('/api/timetable', exportRoutes);
// Python service URL
const pythonServiceUrl = process.env.PYTHON_API_URL || 'http://127.0.0.1:5000/generate';

/**
 * POST /api/timetable/generate
 * Generate a new timetable
 */
app.post('/api/timetable/generate', async (req, res) => {
    console.log('\n' + '='.repeat(60));
    console.log('📥 [GATEWAY] NEW TIMETABLE GENERATION REQUEST');
    console.log('='.repeat(60));
    
    const { semester, section, classroom, subjects } = req.body;
    
    // Validate input
    if (!semester || !section || !classroom || !subjects || subjects.length === 0) {
        console.log('[GATEWAY] ❌ Invalid request: Missing required fields');
        return res.status(400).json({
            success: false,
            message: 'Missing required fields: semester, section, classroom, or subjects'
        });
    }
    
    console.log(`[GATEWAY] 📚 Semester: ${semester}, Section: ${section}`);
    console.log(`[GATEWAY] 🏫 Classroom: ${classroom}`);
    console.log(`[GATEWAY] 📖 Subjects: ${subjects.length}`);
    
    let connection;
    
    try {
        // Connect to database
        connection = await mysql.createConnection(dbConfig);
        console.log('[GATEWAY] ✅ Database connection successful');

        // 1. Create/Update section
        const sectionId = `${semester}_${section}`;
        await connection.execute(
            `INSERT INTO sections (id, name, semester, classroom) 
             VALUES (?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE classroom=VALUES(classroom)`,
            [sectionId, `${semester} ${section}`, semester, classroom]
        );
        console.log(`[GATEWAY] ✅ Section ${sectionId} created/updated`);

        // 2. Insert faculties and subjects
        console.log('[GATEWAY] 💾 Inserting faculties and subjects...');
        
        for (const sub of subjects) {
            // Insert faculties
            if (sub.theory_faculty) {
                await connection.execute(
                    'INSERT IGNORE INTO faculty (id, name) VALUES (?, ?)',
                    [sub.theory_faculty, sub.theory_faculty]
                );
            }
            if (sub.lab_faculty) {
                await connection.execute(
                    'INSERT IGNORE INTO faculty (id, name) VALUES (?, ?)',
                    [sub.lab_faculty, sub.lab_faculty]
                );
            }
            
            // Insert subject
            await connection.execute(
                `INSERT INTO subjects 
                 (subject_code, section_id, subject_name, subject_type, theory_hours, lab_hours, no_of_batches, theory_faculty_id, lab_faculty_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE 
                   subject_name=VALUES(subject_name), 
                   theory_hours=VALUES(theory_hours), 
                   lab_hours=VALUES(lab_hours),
                   no_of_batches=VALUES(no_of_batches)`,
                [
                    sub.subject_code,
                    sectionId,
                    sub.subject_name,
                    sub.subject_type,
                    sub.theory_hours,
                    sub.lab_hours,
                    sub.no_of_batches,
                    sub.theory_faculty || null,
                    sub.lab_faculty || null
                ]
            );
        }
        
        console.log('[GATEWAY] ✅ All subjects and faculties saved');

        // 3. Prepare data for Python service
        const pythonPayload = {
            subjects: subjects.map(s => ({
                subject_code: s.subject_code,
                subject_name: s.subject_name,
                subject_type: s.subject_type,
                theory_hours: parseInt(s.theory_hours) || 0,
                lab_hours: parseInt(s.lab_hours) || 0,
                theory_faculty: s.theory_faculty || '',
                lab_faculty: s.lab_faculty || '',
                no_of_batches: parseInt(s.no_of_batches) || 0,
                semester: semester,
                section: section
            }))
        };

        // 4. Call Python service
        console.log(`[GATEWAY] ➡️  Calling Python service at ${pythonServiceUrl}...`);
        console.log('[GATEWAY] ⏳ This may take 30-60 seconds...');
        
        const startTime = Date.now();
        
        const response = await axios.post(pythonServiceUrl, pythonPayload, {
            timeout: 300000, // 5 minutes timeout
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const endTime = Date.now();
        const generationTime = (endTime - startTime) / 1000;
        
        const generatedTimetable = response.data;
        
        console.log(`[GATEWAY] ⬅️  Python service responded in ${generationTime.toFixed(2)}s`);
        console.log(`[GATEWAY] 📊 Received ${generatedTimetable.length} scheduled slots`);

        // 5. Save timetable to database
        if (generatedTimetable.length > 0) {
            console.log('[GATEWAY] 💾 Saving generated timetable to database...');
            
            // ✅ CRITICAL: Filter out slots with empty/invalid faculty IDs FIRST
            const validSlots = generatedTimetable.filter(slot => 
                slot.faculty_id && 
                slot.faculty_id.trim() !== '' &&
                slot.section_id &&
                slot.room_id
            );
            
            if (validSlots.length === 0) {
                console.log('[GATEWAY] ⚠️  No valid slots to insert! All slots have missing faculty.');
                return res.status(400).json({
                    success: false,
                    message: 'Generated timetable has no valid slots. Please ensure all subjects have assigned faculty.',
                    timetable: []
                });
            }
            
            if (validSlots.length < generatedTimetable.length) {
                const invalidCount = generatedTimetable.length - validSlots.length;
                console.log(`[GATEWAY] ⚠️  Filtered out ${invalidCount} invalid slots (missing faculty)`);
            }
            
            // IMPORTANT: Insert all faculties from VALID slots first (to avoid foreign key errors)
            const uniqueFaculties = [...new Set(validSlots.map(slot => slot.faculty_id))];
            console.log(`[GATEWAY] 📝 Ensuring ${uniqueFaculties.length} faculties exist...`);
            
            for (const facultyId of uniqueFaculties) {
                await connection.execute(
                    'INSERT IGNORE INTO faculty (id, name) VALUES (?, ?)',
                    [facultyId, facultyId]  // Use ID as name if name not available
                );
            }
            console.log('[GATEWAY] ✅ All faculties ensured');
            
            // Delete old timetable for this section
            await connection.execute(
                'DELETE FROM scheduled_classes WHERE section_id = ?',
                [sectionId]
            );
            console.log('[GATEWAY] 🗑️  Cleared old timetable');
            
            // Insert new timetable (only valid slots)
            const insertQuery = `
                INSERT INTO scheduled_classes 
                (day, period, subject_code, subject_name, subject_type, faculty_id, section_id, room_id, batch_number, is_theory) 
                VALUES ?
            `;
            
            const values = validSlots.map(slot => [
                slot.day,
                slot.period,
                slot.subject_code,
                slot.subject_name,
                slot.subject_type,
                slot.faculty_id,
                slot.section_id,
                slot.room_id,
                slot.batch_number || 0,
                slot.is_theory ? 1 : 0
            ]);
            
            await connection.query(insertQuery, [values]);
            console.log('[GATEWAY] ✅ Timetable saved successfully');
            
            // 6. Fetch the saved timetable to return
            const [rows] = await connection.execute(
                'SELECT * FROM scheduled_classes WHERE section_id = ? ORDER BY day, period',
                [sectionId]
            );
            
            console.log(`[GATEWAY] 📤 Returning ${rows.length} slots to frontend`);
            console.log('='.repeat(60) + '\n');
            
            // Return success response
            return res.status(200).json({
                success: true,
                message: `Timetable generated and saved successfully for ${semester} ${section}!`,
                timetable: rows,
                generation_time: generationTime,
                timetable_id: sectionId
            });
            
        } else {
            console.log('[GATEWAY] ⚠️  Python service returned an empty timetable');
            console.log('='.repeat(60) + '\n');
            
            return res.status(200).json({
                success: false,
                message: 'Algorithm ran but no timetable was generated. Please check constraints.',
                timetable: []
            });
        }

    } catch (error) {
        console.error('\n' + '='.repeat(60));
        console.error('[GATEWAY] ❌ ERROR OCCURRED');
        console.error('='.repeat(60));
        
        if (error.response) {
            // Error from Python service
            console.error('[GATEWAY] Error from Python Service:');
            console.error('  Status:', error.response.status);
            console.error('  Data:', error.response.data);
        } else if (error.code === 'ECONNREFUSED') {
            console.error('[GATEWAY] ❌ Cannot connect to Python service');
            console.error('[GATEWAY]    Make sure Python Flask API is running on port 5000');
        } else if (error.code) {
            // Database error
            console.error('[GATEWAY] Database Error:');
            console.error('  Code:', error.code);
            console.error('  Message:', error.message);
        } else {
            // Generic error
            console.error('[GATEWAY] Error:', error.message);
        }
        
        console.error('='.repeat(60) + '\n');
        
        return res.status(500).json({
            success: false,
            message: 'An error occurred during timetable generation',
            error: error.message
        });
        
    } finally {
        if (connection) {
            await connection.end();
            console.log('[GATEWAY] 🔌 Database connection closed');
        }
    }
});

/**
 * GET /api/timetables/available
 * Get list of all available timetables
 */
app.get('/api/timetables/available', async (req, res) => {
    console.log('[GATEWAY] 📋 Request for available timetables');
    
    let connection;
    
    try {
        connection = await mysql.createConnection(dbConfig);
        
        const [rows] = await connection.execute(
            'SELECT DISTINCT section_id FROM scheduled_classes ORDER BY section_id ASC'
        );
        
        const sectionIds = rows.map(row => row.section_id);
        
        console.log(`[GATEWAY] ✅ Found ${sectionIds.length} timetables: ${sectionIds.join(', ')}`);
        
        res.status(200).json(sectionIds);
        
    } catch (error) {
        console.error('[GATEWAY] ❌ Error fetching available timetables:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch available timetables'
        });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * GET /api/timetable/:sectionId
 * Get specific timetable by section ID
 */
app.get('/api/timetable/:sectionId', async (req, res) => {
    const { sectionId } = req.params;
    console.log(`[GATEWAY] 📖 Request for timetable: ${sectionId}`);
    
    let connection;
    
    try {
        connection = await mysql.createConnection(dbConfig);
        
        const [rows] = await connection.execute(
            'SELECT * FROM scheduled_classes WHERE section_id = ? ORDER BY day, period',
            [sectionId]
        );
        
        console.log(`[GATEWAY] ✅ Fetched ${rows.length} slots for ${sectionId}`);
        
        res.status(200).json(rows);
        
    } catch (error) {
        console.error(`[GATEWAY] ❌ Error fetching timetable for ${sectionId}:`, error.message);
        res.status(500).json({
            success: false,
            message: `Failed to fetch timetable for ${sectionId}`
        });
    } finally {
        if (connection) await connection.end();
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

app.use('/api/timetable', exportRoutes);

app.listen(8080, () => console.log(`Node.js gateway listening on port 8080`));
module.exports = app;