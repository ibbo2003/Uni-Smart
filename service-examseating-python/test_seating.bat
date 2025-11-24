@echo off
echo ==========================================
echo Testing Exam Seating Generation
echo ==========================================
echo.

echo Step 1: Check Database Status
echo ------------------------------
python check_db.py
echo.

echo Step 2: Test Direct Python Service
echo -----------------------------------
echo Testing: http://localhost:5001/generate_seating
curl -X POST http://localhost:5001/generate_seating ^
  -H "Content-Type: application/json" ^
  -d "{\"exam_date\": \"2025-11-22\", \"exam_session\": \"morning\"}" ^
  > python_response.json 2>&1

echo.
echo Response saved to: python_response.json
type python_response.json | python -c "import sys, json; data = json.load(sys.stdin); print(f'Python Service: {len(data)} students assigned')"
echo.

echo Step 3: Test Gateway Service
echo -----------------------------
echo Testing: http://localhost:8080/api/exams/generate-seating
curl -X POST http://localhost:8080/api/exams/generate-seating ^
  -H "Content-Type: application/json" ^
  -d "{\"exam_date\": \"2025-11-22\", \"exam_session\": \"morning\"}" ^
  > gateway_response.json 2>&1

echo.
echo Response saved to: gateway_response.json
type gateway_response.json
echo.

echo ==========================================
echo Test Complete!
echo.
echo If you see:
echo   - Python Service: 61 students assigned
echo   - Gateway: "Seating plan generated and saved successfully!"
echo.
echo Then everything is working correctly!
echo ==========================================
pause
