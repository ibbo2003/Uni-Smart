const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const { Document, Packer, Table, TableRow, TableCell, Paragraph, AlignmentType, WidthType, BorderStyle, VerticalAlign } = require('docx');
const ExcelJS = require('exceljs');

// ==========================================
// HELPER: Build Timetable Grid
// ==========================================
function buildTimetableGrid(timetableData) {
  const grid = Array(6).fill(null).map(() =>
    Array(7).fill(null).map(() => [])
  );

  timetableData.forEach(slot => {
    const day = parseInt(slot.day);
    const period = parseInt(slot.period);
    if (!Number.isNaN(day) && !Number.isNaN(period) && day >= 0 && day < 6 && period >= 0 && period < 7) {
      grid[day][period].push(slot);
    }
  });

  return grid;
}

// ==========================================
// HELPER: Get Subject-Faculty Mapping
// ==========================================
function getSubjectFacultyMapping(timetableData, facultyMap) {
  const mapping = {};

  timetableData.forEach(slot => {
    if (!mapping[slot.subject_code]) {
      mapping[slot.subject_code] = {
        subject_name: slot.subject_name,
        theory_faculty: null,
        lab_faculty: null
      };
    }

    if (slot.is_theory) {
      mapping[slot.subject_code].theory_faculty = slot.faculty_id;
    } else {
      mapping[slot.subject_code].lab_faculty = slot.faculty_id;
    }
  });

  return mapping;
}

// ==========================================
// EXPORT ENDPOINT
// ==========================================
router.get('/:sectionId/export/:format', async (req, res) => {
  try {
    const { sectionId, format } = req.params;
    const db = req.app.locals.db; // expect a mysql2 pool

    console.log(`📥 Export request: ${sectionId} as ${format}`);

    // Fetch timetable data
    const [timetableRows] = await db.query(
      'SELECT * FROM scheduled_classes WHERE section_id = ? ORDER BY day, period',
      [sectionId]
    );

    if (timetableRows.length === 0) {
      return res.status(404).json({ message: 'No timetable found for this section' });
    }

    // Fetch section details
    const [sectionRows] = await db.query(
      'SELECT * FROM sections WHERE id = ?',
      [sectionId]
    );

    if (sectionRows.length === 0) {
      return res.status(404).json({ message: 'Section not found' });
    }

    const sectionInfo = sectionRows[0];

    // Fetch faculty mapping
    const [facultyRows] = await db.query('SELECT id, name FROM faculty');
    const facultyMap = {};
    facultyRows.forEach(f => {
      facultyMap[f.id] = f.name;
    });

    // Normalize timetable data
    const timetableData = timetableRows.map(row => ({
      ...row,
      is_theory: !!row.is_theory,
      batch_number: row.batch_number || 0
    }));

    // Route to generator
    switch (format.toLowerCase()) {
      case 'pdf':
        await generatePDF(res, timetableData, sectionInfo, facultyMap);
        break;
      case 'word':
      case 'docx':
        await generateWord(res, timetableData, sectionInfo, facultyMap);
        break;
      case 'excel':
      case 'xlsx':
        await generateExcel(res, timetableData, sectionInfo, facultyMap);
        break;
      default:
        res.status(400).json({ message: 'Invalid format. Use pdf, word, or excel' });
    }

  } catch (error) {
    console.error('❌ Export error:', error);
    if (res.headersSent) {
      try { if (!res.writableEnded) res.end(); } catch (e) {}
    } else {
      res.status(500).json({
        message: 'Failed to export timetable',
        error: error.message
      });
    }
  }
});

// ==========================================
// PDF GENERATION — fits timetable + legend on ONE A4 landscape page
// with merged vertical BREAK / LUNCH cells and horizontal merge for projects
// ==========================================
async function generatePDF(res, timetableData, sectionInfo, facultyMap) {
  // Create PDF doc
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margins: { top: 18, bottom: 18, left: 18, right: 18 }
  });

  // Headers before piping
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=Timetable_${sectionInfo.semester}_${sectionInfo.section}.pdf`);

  doc.pipe(res);

  // Safety handlers
  res.on('close', () => {
    try { doc.end(); } catch (e) {}
  });
  doc.on('error', (err) => {
    console.error('[PDF] generation error:', err);
    try { if (!res.writableEnded) res.end(); } catch (e) {}
  });

  // Layout calculations (dynamic)
  const pageW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const pageH = doc.page.height - doc.page.margins.top - doc.page.margins.bottom;

  // Reserve vertical space for header + footer + small padding
  const headerH = 72;
  const footerH = 48;
  const availH = pageH - headerH - footerH - 10; // 10 px extra buffer

  // Table takes left ~68% width, legend takes remaining ~30%
  const tableW = Math.floor(pageW * 0.68);
  const legendW = pageW - tableW - 12; // 12 px gap
  const leftX = doc.page.margins.left;
  const topY = doc.page.margins.top + 6;

  // Column definitions:
  const mapCols = [
    { label: 'DAY', gridIndex: null, width: 56 },      // day column
    { label: '1\n(9:00–9:55)', gridIndex: 0, width: null },
    { label: '2\n(9:55–10:50)', gridIndex: 1, width: null },
    { label: '10:55\n11:05', gridIndex: null, width: 28 }, // BREAK (small)
    { label: '3\n(11:05–12:00)', gridIndex: 2, width: null },
    { label: '4\n(12:00–12:55)', gridIndex: 3, width: null },
    { label: '1:00–2:00', gridIndex: null, width: 34 },   // LUNCH (small)
    { label: '5\n(2:00–2:55)', gridIndex: 4, width: null },
    { label: '6\n(2:55–3:50)', gridIndex: 5, width: null },
    { label: '7\n(3:50–4:45)', gridIndex: 6, width: null }
  ];

  // Determine dynamic widths for variable columns
  const fixedWidth = mapCols.reduce((acc, c) => acc + (c.width || 0), 0);
  const variableCols = mapCols.filter(c => c.width === null);
  const remaining = tableW - fixedWidth;
  const varWidth = Math.max(60, Math.floor(remaining / variableCols.length));
  mapCols.forEach(c => { if (c.width === null) c.width = varWidth; });

  // Precompute X positions for each column
  const colXPositions = [];
  let accX = leftX;
  for (let i = 0; i < mapCols.length; i++) {
    colXPositions.push(accX);
    accX += mapCols[i].width;
  }
  const actualTableW = mapCols.reduce((a,c) => a + c.width, 0);

  // Calculate row height to fit exactly 6 days into available height
  const days = ['MON', 'TUE', 'WED', 'THUR', 'FRI/SUN', 'SAT'];
  const headerRowH = 36;
  const bodyH = availH - headerRowH;
  const rowH = Math.max(34, Math.floor(bodyH / days.length)); // minimum 34 px

  // Draw header/title area
  let cursorY = topY;
  doc.font('Helvetica-Bold').fontSize(14).text('Anjuman Institute of Technology and Management', leftX, cursorY, { width: pageW, align: 'center' });
  doc.moveDown(0.2);
  doc.font('Helvetica').fontSize(8).text('(Approved by VTU, Affiliated to Visveswaraya Bhatkal, Anjumanabad, Belalkanda, Bhatkal, Karnataka 581320)', leftX, cursorY + 18, { width: pageW, align: 'center' });
  doc.font('Helvetica-Bold').fontSize(10).text('Department of Computer Science and Engineering', leftX, cursorY + 32, { width: pageW, align: 'center' });
  const AY = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
  doc.font('Helvetica').fontSize(9).text(`Time Table – AY: ${AY} (Odd Semester) with effect from ${new Date().toLocaleDateString('en-IN')}`, leftX, cursorY + 46, { width: pageW, align: 'center' });

  // Section information line
  cursorY += 62;
  const roomNo = sectionInfo.classroom || 'N/A';
  const semYear = sectionInfo.semester || 'N/A';
  doc.font('Helvetica-Bold').fontSize(9);
  doc.text(`ROOM No: ${roomNo}`, leftX, cursorY, { continued: true });
  doc.text(`    Sem / Year: ${semYear}`, { continued: true });
  doc.text(`    Regulation: 2022`, { continued: true });
  doc.text(`    Class Advisor: [To be assigned]`, { align: 'left' });
  cursorY += 14; // move cursor to top of table area

  // Draw header row boxes and labels
  for (let ci = 0; ci < mapCols.length; ci++) {
    const col = mapCols[ci];
    const x = colXPositions[ci];
    doc.rect(x, cursorY, col.width, headerRowH).stroke();
    doc.font('Helvetica-Bold').fontSize(8).text(col.label, x + 2, cursorY + 6, { width: col.width - 4, align: 'center' });
  }

  // Prepare grid and merge trackers
  const grid = buildTimetableGrid(timetableData);
  // We'll mark merged column ranges per row to skip drawing them again
  const mergedTracker = Array(days.length).fill(null).map(() => Array(mapCols.length).fill(false));

  const rowStartY = cursorY + headerRowH;
  const mergedRowsHeight = rowH * days.length;

  // Draw rows and cells, but detect horizontal merges for projects
  for (let r = 0; r < days.length; r++) {
    const rowY = rowStartY + r * rowH;
    // Day cell
    const dayX = colXPositions[0];
    doc.rect(dayX, rowY, mapCols[0].width, rowH).stroke();
    doc.font('Helvetica-Bold').fontSize(9).text(days[r], dayX + 2, rowY + (rowH / 2) - 6, { width: mapCols[0].width - 4, align: 'center' });

    // iterate through columns (ci from 1..end)
    for (let ci = 1; ci < mapCols.length; ci++) {
      if (mergedTracker[r][ci]) continue; // already part of a merged span
      const col = mapCols[ci];
      const x = colXPositions[ci];

      // If this is a break/lunch column - don't draw border yet (will be drawn as merged cell later)
      if (col.gridIndex === null) {
        continue;
      }

      // Don't draw border yet - we'll determine if it needs merging first

      // Determine slots in this period
      const slots = grid[r][col.gridIndex] || [];

      // Check for horizontal merge condition:
      // - non-empty first slot
      // - subject_type indicates project (PROJ or MP) OR the subject repeats in the next column(s)
      // We'll merge only across adjacent columns that map to periods (gridIndex != null)
      let mergedSpan = 1;
      let firstSlot = (slots.length > 0) ? slots[0] : null;
      const subjectType = firstSlot ? String(firstSlot.subject_type || '').toUpperCase() : '';
      const isProject = subjectType === 'PROJ' || subjectType === 'MP';

      if (firstSlot) {
        // Attempt to expand merge if project OR if subject_code repeats in later consecutive periods (useful for multi-period classes)
        for (let cj = ci + 1; cj < mapCols.length; cj++) {
          const nextCol = mapCols[cj];
          // stop if next is break/lunch or has no gridIndex
          if (nextCol.gridIndex === null) break;
          const nextSlots = grid[r][nextCol.gridIndex] || [];
          const nextFirst = (nextSlots.length > 0) ? nextSlots[0] : null;
          if (!nextFirst) break;
          // require same subject_code to merge
          if (String(nextFirst.subject_code || '') === String(firstSlot.subject_code || '')) {
            mergedSpan++;
            // allow merging further even if not project (this helps multi-period labs/projects)
            continue;
          } else {
            break;
          }
        }
      }

      if (mergedSpan > 1) {
        // compute total width for merged area
        let mergedWidth = 0;
        for (let k = 0; k < mergedSpan; k++) mergedWidth += mapCols[ci + k].width;

        // Draw merged rect WITHOUT internal borders - single clean border
        doc.rect(x, rowY, mergedWidth, rowH).stroke();

        // write subject and faculty once, centered in merged rect
        const slotToUse = firstSlot;
        const facultyName = facultyMap[slotToUse.faculty_id] || slotToUse.faculty_id || '';
        doc.font('Helvetica-Bold').fontSize(8).text(slotToUse.subject_code || '', x + 4, rowY + 4, { width: mergedWidth - 8, align: 'center' });
        doc.font('Helvetica').fontSize(7).text(facultyName, x + 4, rowY + 18, { width: mergedWidth - 8, align: 'center' });
        if (!slotToUse.is_theory && slotToUse.room_id) {
          doc.font('Helvetica').fontSize(7).text(slotToUse.room_id, x + 4, rowY + 30, { width: mergedWidth - 8, align: 'center' });
        }

        // mark merged columns in tracker so they are skipped next iterations
        for (let k = 0; k < mergedSpan; k++) {
          mergedTracker[r][ci + k] = true;
        }
        continue; // processed merged block
      }

      // No horizontal merge — draw single cell border and handle content:
      doc.rect(x, rowY, col.width, rowH).stroke();

      if (slots.length === 0) {
        doc.font('Helvetica').fontSize(7).fillColor('#666').text('—', x, rowY + (rowH / 2) - 6, { width: col.width, align: 'center' });
        doc.fillColor('#000');
      } else if (slots.length > 1 && slots.every(s => !s.is_theory)) {
        // Parallel labs in same period (different batches) — compact into one line
        const labText = slots.sort((a,b) => (a.batch_number||0)-(b.batch_number||0))
          .map(s => `${s.subject_code} LAB(B${s.batch_number||0})`).join('/');
        doc.font('Helvetica-Bold').fontSize(7).text(labText, x + 4, rowY + 6, { width: col.width - 8, align: 'center' });
      } else {
        const slot = slots[0];
        const facultyName = facultyMap[slot.faculty_id] || slot.faculty_id || '';
        doc.font('Helvetica-Bold').fontSize(8).text(slot.subject_code || '', x + 4, rowY + 4, { width: col.width - 8, align: 'center' });
        doc.font('Helvetica').fontSize(7).text(facultyName, x + 4, rowY + 18, { width: col.width - 8, align: 'center' });
        if (!slot.is_theory && slot.room_id) {
          doc.font('Helvetica').fontSize(7).text(slot.room_id, x + 4, rowY + 30, { width: col.width - 8, align: 'center' });
        }
      }
    }
  }

  // Draw merged vertical BREAK and LUNCH columns with single clean border
  const breakColIndex = 3;
  const lunchColIndex = 6;
  const breakX = colXPositions[breakColIndex];
  const lunchX = colXPositions[lunchColIndex];

  const mergedTopY = rowStartY;
  const mergedHeight = mergedRowsHeight;

  // Draw BREAK column - single border for entire merged area
  (function drawMergedBreakColumn(colIndex, xPos, text, fontSize = 9) {
    const col = mapCols[colIndex];

    // Draw single border around entire merged area (no internal lines)
    doc.rect(xPos, mergedTopY, col.width, mergedHeight).stroke();

    // Draw vertical text
    const centerX = xPos + col.width / 2;
    const centerY = mergedTopY + mergedHeight / 2;
    doc.save();
    doc.rotate(-90, { origin: [centerX, centerY] });
    const fakeX = centerX - (mergedHeight / 2);
    const fakeY = centerY - (col.width / 2) - Math.round(fontSize / 2);
    doc.font('Helvetica-Bold').fontSize(fontSize).text(text, fakeX, fakeY, { width: mergedHeight, align: 'center' });
    doc.restore();
  })(breakColIndex, breakX, 'BREAK', 9);

  // Draw LUNCH BREAK column - single border for entire merged area
  (function drawMergedLunchColumn(colIndex, xPos, text, fontSize = 8) {
    const col = mapCols[colIndex];

    // Draw single border around entire merged area (no internal lines)
    doc.rect(xPos, mergedTopY, col.width, mergedHeight).stroke();

    // Draw vertical text
    const centerX = xPos + col.width / 2;
    const centerY = mergedTopY + mergedHeight / 2;
    doc.save();
    doc.rotate(-90, { origin: [centerX, centerY] });
    const fakeX = centerX - (mergedHeight / 2);
    const fakeY = centerY - (col.width / 2) - Math.round(fontSize / 2);
    doc.font('Helvetica-Bold').fontSize(fontSize).text(text, fakeX, fakeY, { width: mergedHeight, align: 'center' });
    doc.restore();
  })(lunchColIndex, lunchX, 'LUNCH BREAK', 8);

  // Faculty mapping at bottom (horizontal format like the PDF)
  const mappingY = rowStartY + mergedRowsHeight + 16;
  const subjectMap = getSubjectFacultyMapping(timetableData, facultyMap);

  // Build faculty mapping entries in horizontal format
  const mappingEntries = [];
  Object.entries(subjectMap).forEach(([sub, info]) => {
    if (info.theory_faculty) {
      const facultyName = facultyMap[info.theory_faculty] || info.theory_faculty;
      mappingEntries.push(`${sub}: ${facultyName}`);
    }
    if (info.lab_faculty && info.lab_faculty !== info.theory_faculty) {
      const labFacultyName = facultyMap[info.lab_faculty] || info.lab_faculty;
      mappingEntries.push(`${sub} LAB: ${labFacultyName}`);
    }
  });

  // Draw faculty mapping in rows (3-4 entries per row)
  doc.font('Helvetica').fontSize(8);
  const entriesPerRow = 3;
  let currentY = mappingY;
  for (let i = 0; i < mappingEntries.length; i += entriesPerRow) {
    const rowEntries = mappingEntries.slice(i, i + entriesPerRow);
    const rowText = rowEntries.join('    |    ');
    doc.text(rowText, leftX, currentY, { width: actualTableW, align: 'left' });
    currentY += 12;
  }

  // Footer signatures
  const footerY = doc.page.height - doc.page.margins.bottom - footerH + 12;
  doc.font('Helvetica').fontSize(9);
  doc.text('Time Table Coordinator', leftX, footerY, { width: 220, align: 'left' });
  doc.text('Signature of the H.O.D', leftX + (pageW / 2) - 60, footerY, { width: 220, align: 'center' });
  doc.text('Signature of the Principal', leftX + pageW - 220, footerY, { width: 220, align: 'right' });

  doc.end();
}

// ==========================================
// WORD GENERATION (unchanged)
// ==========================================
async function generateWord(res, timetableData, sectionInfo, facultyMap) {
  const grid = buildTimetableGrid(timetableData);
  const days = ['MON', 'TUE', 'WED', 'THUR', 'FRI/SUN', 'SAT'];

  // Column mapping with breaks (10 columns total to match PDF)
  const columnMap = [
    { type: 'day', label: 'DAY / TIME' },
    { type: 'period', label: '1\n(9:00-9:55)', periodIndex: 0 },
    { type: 'period', label: '2\n(9:55-10:50)', periodIndex: 1 },
    { type: 'break', label: 'BREAK\n(10:55-11:05)' },
    { type: 'period', label: '3\n(11:05-12:00)', periodIndex: 2 },
    { type: 'period', label: '4\n(12:00-12:55)', periodIndex: 3 },
    { type: 'break', label: 'LUNCH\nBREAK\n(1:00-2:00)' },
    { type: 'period', label: '5\n(2:00-2:55)', periodIndex: 4 },
    { type: 'period', label: '6\n(2:55-3:50)', periodIndex: 5 },
    { type: 'period', label: '7\n(3:50-4:45)', periodIndex: 6 }
  ];

  // Build table rows
  const tableRows = [];

  // Header row
  const headerCells = columnMap.map(col =>
    new TableCell({
      children: [new Paragraph({
        text: col.label.replace(/\n/g, ' '),
        alignment: AlignmentType.CENTER,
        bold: true
      })],
      shading: { fill: 'D3D3D3' },
      verticalAlign: VerticalAlign.CENTER,
      width: { size: col.type === 'break' ? 800 : 1400, type: WidthType.DXA }
    })
  );

  tableRows.push(new TableRow({ children: headerCells, height: { value: 600, rule: 'atLeast' } }));

  // Data rows with vertical merge for breaks
  days.forEach((day, dayIndex) => {
    const cells = [];

    columnMap.forEach((col, colIndex) => {
      // Day column
      if (col.type === 'day') {
        cells.push(new TableCell({
          children: [new Paragraph({
            text: day,
            alignment: AlignmentType.CENTER,
            bold: true
          })],
          shading: { fill: 'F0F0F0' },
          verticalAlign: VerticalAlign.CENTER
        }));
      }
      // Break columns - only add for first row (will be merged vertically)
      else if (col.type === 'break') {
        if (dayIndex === 0) {
          cells.push(new TableCell({
            children: [new Paragraph({
              text: col.label.includes('LUNCH') ? 'LUNCH BREAK' : 'BREAK',
              alignment: AlignmentType.CENTER,
              bold: true
            })],
            shading: { fill: 'FFE0B2' },
            verticalAlign: VerticalAlign.CENTER,
            rowSpan: days.length  // Merge all 6 rows
          }));
        }
        // Skip for other rows (merged cells)
      }
      // Period columns
      else if (col.type === 'period') {
        const slots = grid[dayIndex][col.periodIndex];
        let cellContent = [];

        if (slots.length === 0) {
          cellContent.push(new Paragraph({
            text: '--------',
            alignment: AlignmentType.CENTER
          }));
        } else if (slots.length > 1 && slots.every(s => !s.is_theory)) {
          // Parallel labs
          const labText = slots
            .sort((a, b) => (a.batch_number || 0) - (b.batch_number || 0))
            .map(s => `${s.subject_code} LAB(B${s.batch_number})`)
            .join('/');

          cellContent.push(new Paragraph({
            text: labText,
            alignment: AlignmentType.CENTER,
            bold: true
          }));
        } else {
          const slot = slots[0];
          const facName = facultyMap[slot.faculty_id] || slot.faculty_id;

          cellContent.push(new Paragraph({
            text: slot.subject_code,
            alignment: AlignmentType.CENTER,
            bold: true
          }));
          cellContent.push(new Paragraph({
            text: facName,
            alignment: AlignmentType.CENTER,
            size: 18
          }));
          if (!slot.is_theory && slot.room_id) {
            cellContent.push(new Paragraph({
              text: slot.room_id,
              alignment: AlignmentType.CENTER,
              size: 16
            }));
          }
        }

        cells.push(new TableCell({
          children: cellContent,
          verticalAlign: VerticalAlign.CENTER,
          shading: { fill: slots.length > 0 && !slots[0].is_theory ? 'E3F2FD' : 'E8F5E9' }
        }));
      }
    });

    tableRows.push(new TableRow({
      children: cells,
      height: { value: 800, rule: 'atLeast' }
    }));
  });

  // Create document
  const currentYear = new Date().getFullYear();
  const doc = new Document({
    sections: [{
      children: [
        new Paragraph({
          text: 'Anjuman Institute of Technology and Management',
          alignment: AlignmentType.CENTER,
          bold: true,
          size: 28
        }),
        new Paragraph({
          text: '(Approved by VTU, Affiliated to Visveswaraya Bhatkal, Anjumanabad, Belalkanda, Bhatkal, Karnataka 581320)',
          alignment: AlignmentType.CENTER,
          size: 18
        }),
        new Paragraph({
          text: 'Department of Computer Science and Engineering',
          alignment: AlignmentType.CENTER,
          bold: true,
          size: 24
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          text: `Time Table – AY: ${currentYear}-${currentYear + 1} (Odd Semester)`,
          alignment: AlignmentType.CENTER,
          bold: true,
          size: 22
        }),
        new Paragraph({
          text: `ROOM No: ${sectionInfo.classroom}    Sem/Year: ${sectionInfo.semester}/2025    Regulation: 2022    Class Advisor: ${sectionInfo.class_advisor || 'TBD'}`,
          alignment: AlignmentType.CENTER,
          size: 20
        }),
        new Paragraph({ text: '' }),
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE }
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          text: 'Faculty Assignment:',
          bold: true,
          size: 20
        }),
        ...(() => {
          const subjectFacultyMap = getSubjectFacultyMapping(timetableData, facultyMap);
          const paragraphs = [];

          Object.entries(subjectFacultyMap).forEach(([subject, info]) => {
            if (info.theory_faculty) {
              const facName = facultyMap[info.theory_faculty] || info.theory_faculty;
              paragraphs.push(new Paragraph({
                text: `${subject}: ${facName}`,
                size: 18
              }));
            }
            if (info.lab_faculty && info.lab_faculty !== info.theory_faculty) {
              const facName = facultyMap[info.lab_faculty] || info.lab_faculty;
              paragraphs.push(new Paragraph({
                text: `${subject} LAB: ${facName}`,
                size: 18
              }));
            }
          });

          return paragraphs;
        })(),
        new Paragraph({ text: '' }),
        new Paragraph({ text: '' }),
        new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({
                    text: 'Time Table Coordinator',
                    alignment: AlignmentType.LEFT
                  })],
                  borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
                }),
                new TableCell({
                  children: [new Paragraph({
                    text: 'Signature of the H.o.D',
                    alignment: AlignmentType.CENTER
                  })],
                  borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
                }),
                new TableCell({
                  children: [new Paragraph({
                    text: 'Signature of the Principal',
                    alignment: AlignmentType.RIGHT
                  })],
                  borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } }
                })
              ]
            })
          ],
          width: { size: 100, type: WidthType.PERCENTAGE }
        })
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  res.setHeader('Content-Disposition', `attachment; filename=Timetable_${sectionInfo.semester}_${sectionInfo.section}.docx`);
  res.send(buffer);
}

// ==========================================
// EXCEL GENERATION (unchanged — compact)
// ==========================================
async function generateExcel(res, timetableData, sectionInfo, facultyMap) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Timetable');

  const grid = buildTimetableGrid(timetableData);
  const days = ['MON', 'TUE', 'WED', 'THUR', 'FRI/SUN', 'SAT'];

  // Column mapping with breaks (10 columns total to match PDF)
  const columnMap = [
    { type: 'day', label: 'DAY / TIME', width: 12 },
    { type: 'period', label: '1 (9:00-9:55)', periodIndex: 0, width: 18 },
    { type: 'period', label: '2 (9:55-10:50)', periodIndex: 1, width: 18 },
    { type: 'break', label: 'BREAK', width: 8 },
    { type: 'period', label: '3 (11:05-12:00)', periodIndex: 2, width: 18 },
    { type: 'period', label: '4 (12:00-12:55)', periodIndex: 3, width: 18 },
    { type: 'break', label: 'LUNCH BREAK', width: 10 },
    { type: 'period', label: '5 (2:00-2:55)', periodIndex: 4, width: 18 },
    { type: 'period', label: '6 (2:55-3:50)', periodIndex: 5, width: 18 },
    { type: 'period', label: '7 (3:50-4:45)', periodIndex: 6, width: 18 }
  ];

  // Set column widths
  worksheet.columns = columnMap.map(col => ({ width: col.width }));

  // Title rows (now merge across 10 columns A-J)
  worksheet.mergeCells('A1:J1');
  worksheet.getCell('A1').value = 'Anjuman Institute of Technology and Management';
  worksheet.getCell('A1').font = { bold: true, size: 14 };
  worksheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A2:J2');
  worksheet.getCell('A2').value = '(Approved by VTU, Affiliated to Visveswaraya Bhatkal, Anjumanabad, Belalkanda, Bhatkal, Karnataka 581320)';
  worksheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  worksheet.getRow(2).height = 30;

  worksheet.mergeCells('A3:J3');
  worksheet.getCell('A3').value = 'Department of Computer Science and Engineering';
  worksheet.getCell('A3').font = { bold: true, size: 12 };
  worksheet.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle' };

  const currentYear = new Date().getFullYear();
  worksheet.mergeCells('A5:J5');
  worksheet.getCell('A5').value = `Time Table – AY: ${currentYear}-${currentYear + 1} (Odd Semester)`;
  worksheet.getCell('A5').font = { bold: true, size: 12 };
  worksheet.getCell('A5').alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A6:J6');
  worksheet.getCell('A6').value = `ROOM No: ${sectionInfo.classroom}    Sem/Year: ${sectionInfo.semester}/2025    Regulation: 2022    Class Advisor: ${sectionInfo.class_advisor || 'TBD'}`;
  worksheet.getCell('A6').font = { bold: true };
  worksheet.getCell('A6').alignment = { horizontal: 'center', vertical: 'middle' };

  // Header row
  const headerRow = worksheet.getRow(8);
  headerRow.values = columnMap.map(col => col.label);
  headerRow.font = { bold: true };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
  headerRow.height = 40;

  // Data rows with vertical merge for breaks
  days.forEach((day, dayIndex) => {
    const row = worksheet.getRow(9 + dayIndex);
    row.height = 60;

    let excelCol = 1;

    columnMap.forEach((col, colIndex) => {
      const cell = row.getCell(excelCol);

      // Day column
      if (col.type === 'day') {
        cell.value = day;
        cell.font = { bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F0F0' } };
        excelCol++;
      }
      // Break columns - merge vertically for all rows
      else if (col.type === 'break') {
        if (dayIndex === 0) {
          // Merge cells vertically (e.g., D9:D14 for 6 days)
          const startRow = 9;
          const endRow = 9 + days.length - 1;
          const colLetter = String.fromCharCode(64 + excelCol); // Convert to A, B, C, etc.
          worksheet.mergeCells(`${colLetter}${startRow}:${colLetter}${endRow}`);

          cell.value = col.label;
          cell.font = { bold: true };
          cell.alignment = { horizontal: 'center', vertical: 'middle', textRotation: 90 };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE0B2' } };
        }
        excelCol++;
      }
      // Period columns
      else if (col.type === 'period') {
        const slots = grid[dayIndex][col.periodIndex];

        if (slots.length === 0) {
          cell.value = '--------';
          cell.font = { color: { argb: 'FF999999' } };
        } else if (slots.length > 1 && slots.every(s => !s.is_theory)) {
          const labText = slots
            .sort((a, b) => (a.batch_number || 0) - (b.batch_number || 0))
            .map(s => `${s.subject_code} LAB(B${s.batch_number})`)
            .join('/');
          cell.value = labText;
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };
          cell.font = { bold: true };
        } else {
          const slot = slots[0];
          const facName = facultyMap[slot.faculty_id] || slot.faculty_id;
          cell.value = `${slot.subject_code}\n${facName}` + (!slot.is_theory && slot.room_id ? `\n${slot.room_id}` : '');
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: slot.is_theory ? 'FFE8F5E9' : 'FFE3F2FD' } };
        }

        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        excelCol++;
      }
    });
  });

  // Add borders (10 columns now)
  for (let row = 8; row <= 8 + days.length; row++) {
    for (let col = 1; col <= 10; col++) {
      worksheet.getCell(row, col).border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    }
  }

  // Faculty legend (horizontal format like PDF)
  const legendStartRow = 9 + days.length + 2;
  const subjectFacultyMap = getSubjectFacultyMapping(timetableData, facultyMap);

  // Build legend entries
  const legendEntries = [];
  Object.entries(subjectFacultyMap).forEach(([subject, info]) => {
    if (info.theory_faculty) {
      const facName = facultyMap[info.theory_faculty] || info.theory_faculty;
      legendEntries.push(`${subject}: ${facName}`);
    }
    if (info.lab_faculty && info.lab_faculty !== info.theory_faculty) {
      const facName = facultyMap[info.lab_faculty] || info.lab_faculty;
      legendEntries.push(`${subject} LAB: ${facName}`);
    }
  });

  // Display horizontally (3 per row)
  let legendRow = legendStartRow;
  for (let i = 0; i < legendEntries.length; i += 3) {
    const rowEntries = legendEntries.slice(i, i + 3);
    worksheet.mergeCells(`A${legendRow}:J${legendRow}`);
    worksheet.getCell(`A${legendRow}`).value = rowEntries.join('    |    ');
    legendRow++;
  }

  // Footer
  const footerRow = legendRow + 2;
  worksheet.getCell(`A${footerRow}`).value = 'Time Table Coordinator';
  worksheet.getCell(`D${footerRow}`).value = 'Signature of the H.o.D';
  worksheet.getCell(`G${footerRow}`).value = 'Signature of the Principal';

  // Write to buffer
  const buffer = await workbook.xlsx.writeBuffer();

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=Timetable_${sectionInfo.semester}_${sectionInfo.section}.xlsx`);
  res.send(buffer);
}

module.exports = router;
