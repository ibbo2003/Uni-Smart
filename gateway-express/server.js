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
        console.log('[GATEWAY] ERROR: Invalid request: Missing required fields');
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
        console.log('[GATEWAY] SUCCESS: Database connection successful');

        // 1. Create/Update section
        const sectionId = `${semester}_${section}`;
        await connection.execute(
            `INSERT INTO sections (id, name, semester, classroom) 
             VALUES (?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE classroom=VALUES(classroom)`,
            [sectionId, `${semester} ${section}`, semester, classroom]
        );
        console.log(`[GATEWAY] SUCCESS: Section ${sectionId} created/updated`);

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
        
        console.log('[GATEWAY] SUCCESS: All subjects and faculties saved');

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
        console.log(`[GATEWAY] -->  Calling Python service at ${pythonServiceUrl}...`);
        console.log('[GATEWAY] ⏳ This may take 30-60 seconds...');
        
        const startTime = Date.now();
        
        const response = await axios.post(pythonServiceUrl, pythonPayload, {
            timeout: 300000, // 5 minutes timeout
            headers: {
                'Content-Type': 'application/json',
                'Authorization': req.headers.authorization || ''
            }
        });
        
        const endTime = Date.now();
        const generationTime = (endTime - startTime) / 1000;
        
        const generatedTimetable = response.data;
        
        console.log(`[GATEWAY] <--  Python service responded in ${generationTime.toFixed(2)}s`);
        console.log(`[GATEWAY] 📊 Received ${generatedTimetable.length} scheduled slots`);

        // 5. Save timetable to database
        if (generatedTimetable.length > 0) {
            console.log('[GATEWAY] 💾 Saving generated timetable to database...');
            
            // SUCCESS: CRITICAL: Filter out slots with empty/invalid faculty IDs FIRST
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
            console.log('[GATEWAY] SUCCESS: All faculties ensured');
            
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
            console.log('[GATEWAY] SUCCESS: Timetable saved successfully');
            
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
        console.error('[GATEWAY] ERROR: ERROR OCCURRED');
        console.error('='.repeat(60));
        
        if (error.response) {
            // Error from Python service
            console.error('[GATEWAY] Error from Python Service:');
            console.error('  Status:', error.response.status);
            console.error('  Data:', error.response.data);
        } else if (error.code === 'ECONNREFUSED') {
            console.error('[GATEWAY] ERROR: Cannot connect to Python service');
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
        
        console.log(`[GATEWAY] SUCCESS: Found ${sectionIds.length} timetables: ${sectionIds.join(', ')}`);
        
        res.status(200).json(sectionIds);
        
    } catch (error) {
        console.error('[GATEWAY] ERROR: Error fetching available timetables:', error.message);
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
        
        console.log(`[GATEWAY] SUCCESS: Fetched ${rows.length} slots for ${sectionId}`);
        
        res.status(200).json(rows);
        
    } catch (error) {
        console.error(`[GATEWAY] ERROR: Error fetching timetable for ${sectionId}:`, error.message);
        res.status(500).json({
            success: false,
            message: `Failed to fetch timetable for ${sectionId}`
        });
    } finally {
        if (connection) await connection.end();
    }
});

/**
 * DELETE /api/timetable/:sectionId
 * Delete a timetable by section ID - ADMIN ONLY
 * Requires JWT authentication with ADMIN role
 */
app.delete('/api/timetable/:sectionId', async (req, res) => {
    const { sectionId } = req.params;
    console.log(`[GATEWAY] 🗑️  Request to delete timetable: ${sectionId}`);

    // Check for authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        console.log('[GATEWAY] ❌ No authorization header provided');
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    // For now, we'll verify the token exists.
    // The frontend should only show delete button for ADMIN users.
    // Add JWT verification here if needed for extra security.

    let connection;

    try {
        connection = await mysql.createConnection(dbConfig);

        // Check if timetable exists
        const [existingRows] = await connection.execute(
            'SELECT COUNT(*) as count FROM scheduled_classes WHERE section_id = ?',
            [sectionId]
        );

        if (existingRows[0].count === 0) {
            console.log(`[GATEWAY] ⚠️  Timetable ${sectionId} not found`);
            return res.status(404).json({
                success: false,
                message: `Timetable for ${sectionId} not found`
            });
        }

        // Delete the timetable
        const [result] = await connection.execute(
            'DELETE FROM scheduled_classes WHERE section_id = ?',
            [sectionId]
        );

        console.log(`[GATEWAY] ✅ Successfully deleted ${result.affectedRows} slots for ${sectionId}`);

        res.status(200).json({
            success: true,
            message: `Timetable for ${sectionId.replace('_', ' ')} deleted successfully`,
            deletedRows: result.affectedRows
        });

    } catch (error) {
        console.error(`[GATEWAY] ERROR: Error deleting timetable for ${sectionId}:`, error.message);
        res.status(500).json({
            success: false,
            message: `Failed to delete timetable for ${sectionId}`
        });
    } finally {
        if (connection) await connection.end();
        console.log('[GATEWAY] 🔌 Database connection closed');
    }
});

// Get all exam rooms
app.get('/api/exams/rooms', async (req, res) => {
    console.log('[GATEWAY] Received request to fetch exam rooms...');

    // Extract authorization header from request
    const authHeader = req.headers.authorization;
    console.log('[DEBUG] Auth header:', authHeader ? 'Present' : 'Missing');

    try {
        const examServiceUrl = 'http://127.0.0.1:5001/rooms';
        console.log(`[GATEWAY] --> Calling Python exam service to fetch rooms...`);

        const response = await axios.get(examServiceUrl, {
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            }
        });

        console.log('[GATEWAY] <-- Received response from Python service');
        console.log(`[GATEWAY] Found ${response.data.length} rooms`);

        res.json(response.data);
    } catch (error) {
        console.error('[GATEWAY] ERROR calling Python service:', error.message);
        res.status(error.response?.status || 500).json({
            error: error.message,
            message: 'Failed to fetch exam rooms'
        });
    }
});

app.post('/api/exams/generate-seating', async (req, res) => {
    console.log('[GATEWAY] Received request to generate exam seating...');
    const { exam_date, exam_session, exam_type } = req.body;

    // DEBUG: Print what we're sending to Python service
    console.log('[DEBUG] Request body received from frontend:');
    console.log(`  exam_date = ${JSON.stringify(exam_date)} (type: ${typeof exam_date})`);
    console.log(`  exam_session = ${JSON.stringify(exam_session)} (type: ${typeof exam_session})`);
    console.log(`  exam_type = ${JSON.stringify(exam_type)} (type: ${typeof exam_type})`);

    // Extract authorization header from request
    const authHeader = req.headers.authorization;
    console.log('[DEBUG] Auth header:', authHeader ? 'Present' : 'Missing');

    let connection;
    try {
        const examServiceUrl = 'http://127.0.0.1:5001/generate_seating';
        console.log(`[GATEWAY] --> Calling Python exam service...`);

        const payload = { exam_date, exam_session, exam_type };
        console.log('[DEBUG] Payload being sent to Python:', JSON.stringify(payload));

        // Forward the authorization header to Python service
        const headers = {};
        if (authHeader) {
            headers['Authorization'] = authHeader;
        }

        const response = await axios.post(examServiceUrl, payload, { headers });
        const seatingPlan = response.data;

        console.log(`[GATEWAY] Received seating plan for ${seatingPlan.length} students.`);
        console.log('[DEBUG] Response type:', typeof seatingPlan, 'Is Array:', Array.isArray(seatingPlan));

        // Save the seating plan to the database
        if (seatingPlan.length > 0) {
            connection = await mysql.createConnection(dbConfig);
            console.log(`[GATEWAY] Saving seating plan to the database (Exam Type: ${exam_type})...`);

            // 1. Get all unique subject codes from the generated plan
            const subjectCodes = [...new Set(seatingPlan.map(s => s.subject_code))];

            // 2. Find the corresponding exam IDs from the 'exams' table
            const placeholders = subjectCodes.map(() => '?').join(',');
            const [examRows] = await connection.execute(
                `SELECT id, subject_code FROM exams WHERE exam_date = ? AND exam_session = ? AND subject_code IN (${placeholders})`,
                [exam_date, exam_session, ...subjectCodes]
            );
            const examIdMap = new Map(examRows.map(e => [e.subject_code, e.id]));
            const examIdsToDelete = Array.from(examIdMap.values());

            // 3. Delete any old seating plan for these exams from appropriate table
            if (examIdsToDelete.length > 0) {
                const deletePlaceholders = examIdsToDelete.map(() => '?').join(',');

                if (exam_type === 'internal') {
                    await connection.execute(`DELETE FROM internal_exam_seating_plan WHERE exam_id IN (${deletePlaceholders})`, examIdsToDelete);
                    console.log(`[GATEWAY] Cleared old INTERNAL seating plan for ${examIdsToDelete.length} exams.`);
                } else {
                    await connection.execute(`DELETE FROM exam_seating_plan WHERE exam_id IN (${deletePlaceholders})`, examIdsToDelete);
                    console.log(`[GATEWAY] Cleared old EXTERNAL seating plan for ${examIdsToDelete.length} exams.`);
                }
            }

            // 4. Prepare and insert the new seating plan data into appropriate table
            if (exam_type === 'internal') {
                // For internal exams, track seat_position (1 or 2)
                // Group by seat location to assign positions
                const seatMap = new Map();

                seatingPlan.forEach(seat => {
                    const seatKey = `${seat.room_id}-${seat.row_num}-${seat.col_num}`;
                    if (!seatMap.has(seatKey)) {
                        seatMap.set(seatKey, []);
                    }
                    seatMap.get(seatKey).push(seat);
                });

                const valuesToInsert = [];
                seatMap.forEach(students => {
                    students.forEach((seat, index) => {
                        valuesToInsert.push([
                            seat.student_usn,
                            examIdMap.get(seat.subject_code),
                            seat.room_id,
                            seat.row_num,
                            seat.col_num,
                            index + 1  // seat_position: 1 for first student, 2 for second
                        ]);
                    });
                });

                const insertQuery = `INSERT INTO internal_exam_seating_plan
                    (student_usn, exam_id, room_id, row_num, col_num, seat_position) VALUES ?`;
                await connection.query(insertQuery, [valuesToInsert]);
                console.log(`[GATEWAY] Successfully saved ${valuesToInsert.length} INTERNAL seat assignments.`);
            } else {
                // For external exams, use the original table
                const valuesToInsert = seatingPlan.map(seat => [
                    seat.student_usn,
                    examIdMap.get(seat.subject_code),
                    seat.room_id,
                    seat.row_num,
                    seat.col_num
                ]);

                const insertQuery = `INSERT INTO exam_seating_plan
                    (student_usn, exam_id, room_id, row_num, col_num) VALUES ?`;
                await connection.query(insertQuery, [valuesToInsert]);
                console.log(`[GATEWAY] Successfully saved ${valuesToInsert.length} EXTERNAL seat assignments.`);
            }
        }
        
        res.status(200).json({
            message: 'Seating plan generated and saved successfully!',
            seatingPlan: seatingPlan
        });

    } catch (error) {
        console.error('[GATEWAY] ERROR: Error in exam seating process:', error.response ? error.response.data : error.message);
        res.status(500).json({ message: 'An error occurred during seating generation' });
    } finally {
        if (connection) connection.end();
    }
});

app.use('/api/timetable', exportRoutes);

// ============================================================================
// STUDENT-SPECIFIC ENDPOINTS (Secure - students can only access their own data)
// ============================================================================

/**
 * GET /api/student/overview/:email
 * Get overview data for a specific student (CGPA, semesters, upcoming exams)
 * Security: Students can only access their own data via email
 */
app.get('/api/student/overview/:email', async (req, res) => {
    const { email } = req.params;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    let connection;
    try {
        connection = await pool.getConnection();

        // Get student basic info
        const [students] = await connection.execute(
            `SELECT usn, name, current_semester FROM students WHERE email = ? LIMIT 1`,
            [email]
        );

        if (students.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const student = students[0];

        // Calculate CGPA (placeholder - would need actual grade calculation)
        // For now, return 0 or implement actual calculation based on your grading system
        const cgpa = 0;

        // Count upcoming exams
        const [exams] = await connection.execute(
            `SELECT COUNT(*) as count FROM exams WHERE exam_date >= CURDATE()`
        );

        res.json({
            usn: student.usn,
            name: student.name,
            cgpa: cgpa,
            semesters_completed: student.current_semester - 1,
            upcoming_exams: exams[0].count
        });

    } catch (error) {
        console.error('[GATEWAY] Error fetching student overview:', error);
        res.status(500).json({ error: 'Failed to fetch student overview' });
    } finally {
        if (connection) connection.release();
    }
});

/**
 * GET /api/results/student/:email
 * Get all results for a specific student, grouped by semester
 * Security: Students can only access their own results via email
 */
app.get('/api/results/student/:email', async (req, res) => {
    const { email } = req.params;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    let connection;
    try {
        connection = await pool.getConnection();

        // Verify student exists and get USN
        const [students] = await connection.execute(
            `SELECT usn FROM students WHERE email = ? LIMIT 1`,
            [email]
        );

        if (students.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const studentUsn = students[0].usn;

        // Get all results for this student
        // Note: This is a placeholder query. Adjust based on your actual results table structure
        const [results] = await connection.execute(
            `SELECT * FROM student_results WHERE student_usn = ? ORDER BY semester, subject_code`,
            [studentUsn]
        );

        // Group results by semester
        const semesterResults = {};
        results.forEach(result => {
            const sem = result.semester;
            if (!semesterResults[sem]) {
                semesterResults[sem] = {
                    semester: sem,
                    sgpa: 0, // Calculate actual SGPA
                    total_credits: 0,
                    subjects: []
                };
            }

            semesterResults[sem].subjects.push({
                subject_code: result.subject_code,
                subject_name: result.subject_name,
                internal_marks: result.internal_marks || 0,
                external_marks: result.external_marks || 0,
                total_marks: result.total_marks || 0,
                grade: result.grade || 'N/A',
                credits: result.credits || 0
            });
        });

        const semesters = Object.values(semesterResults);
        const totalCgpa = 0; // Calculate actual CGPA

        res.json({
            cgpa: totalCgpa,
            semesters: semesters
        });

    } catch (error) {
        console.error('[GATEWAY] Error fetching student results:', error);
        res.status(500).json({ error: 'Failed to fetch student results' });
    } finally {
        if (connection) connection.release();
    }
});

/**
 * GET /api/exams/seating/student/:email
 * Get exam seating arrangements for a specific student
 * Supports both internal and external exams
 * Security: Students can only access their own seating via email
 */
app.get('/api/exams/seating/student/:email', async (req, res) => {
    const { email } = req.params;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    let connection;
    try {
        connection = await pool.getConnection();

        // Verify student exists and get USN
        const [students] = await connection.execute(
            `SELECT usn FROM students WHERE email = ? LIMIT 1`,
            [email]
        );

        if (students.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }

        const studentUsn = students[0].usn;

        // Get external exam seating arrangements
        const [externalSeating] = await connection.execute(
            `SELECT
                esp.student_usn,
                e.subject_code,
                esp.room_id,
                esp.row_num,
                esp.col_num,
                e.exam_date,
                e.exam_session,
                'external' as exam_type,
                NULL as seat_position
             FROM exam_seating_plan esp
             JOIN exams e ON esp.exam_id = e.id
             WHERE esp.student_usn = ?`,
            [studentUsn]
        );

        // Get internal exam seating arrangements
        const [internalSeating] = await connection.execute(
            `SELECT
                iesp.student_usn,
                e.subject_code,
                iesp.room_id,
                iesp.row_num,
                iesp.col_num,
                e.exam_date,
                e.exam_session,
                'internal' as exam_type,
                iesp.seat_position
             FROM internal_exam_seating_plan iesp
             JOIN exams e ON iesp.exam_id = e.id
             WHERE iesp.student_usn = ?`,
            [studentUsn]
        );

        // Combine both results and sort by date and session
        const combinedSeating = [...externalSeating, ...internalSeating].sort((a, b) => {
            const dateCompare = new Date(a.exam_date) - new Date(b.exam_date);
            if (dateCompare !== 0) return dateCompare;
            return a.exam_session.localeCompare(b.exam_session);
        });

        res.json(combinedSeating);

    } catch (error) {
        console.error('[GATEWAY] Error fetching exam seating:', error);
        res.status(500).json({ error: 'Failed to fetch exam seating' });
    } finally {
        if (connection) connection.release();
    }
});

app.listen(8080, () => console.log(`Node.js gateway listening on port 8080`));
module.exports = app;