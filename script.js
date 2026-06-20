// ===== DATA MANAGEMENT =====
let students = [];
let currentSubjects = [];

// Load data from localStorage on page load
function loadData() {
    const savedData = localStorage.getItem('studentsData');
    if (savedData) {
        students = JSON.parse(savedData);
    }
    renderAll();
}

function saveData() {
    localStorage.setItem('studentsData', JSON.stringify(students));
}

// ===== FORM HANDLING =====
const studentForm = document.getElementById('studentForm');
const addSubjectBtn = document.getElementById('addSubjectBtn');
const subjectNameInput = document.getElementById('subjectName');
const subjectMarksInput = document.getElementById('subjectMarks');
const subjectsList = document.getElementById('subjectsList');
const sgpaInput = document.getElementById('sgpa');

// Add subject to temporary list
addSubjectBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const name = subjectNameInput.value.trim();
    const marks = parseFloat(subjectMarksInput.value);

    if (!name || isNaN(marks) || marks < 0 || marks > 10) {
        showToast('Enter valid subject name and marks (0-10)', 'error');
        return;
    }

    currentSubjects.push({ name, marks });
    subjectNameInput.value = '';
    subjectMarksInput.value = '';
    renderSubjectsList();
    autoCalculateSGPA();
});

function renderSubjectsList() {
    subjectsList.innerHTML = currentSubjects
        .map((s, i) => `
            <div class="subject-item">
                <span>${s.name}</span>
                <div>
                    <span>${s.marks.toFixed(1)}/10</span>
                    <button type="button" class="remove-subject" onclick="removeSubject(${i})">✕</button>
                </div>
            </div>
        `)
        .join('');
}

function removeSubject(index) {
    currentSubjects.splice(index, 1);
    renderSubjectsList();
    autoCalculateSGPA();
}

function autoCalculateSGPA() {
    if (currentSubjects.length === 0) {
        sgpaInput.value = '';
        return;
    }
    const avgMarks = currentSubjects.reduce((sum, s) => sum + s.marks, 0) / currentSubjects.length;
    sgpaInput.value = avgMarks.toFixed(2);
}

// Submit form to add student
studentForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('studentName').value.trim();
    const regNumber = document.getElementById('regNumber').value.trim();
    const department = document.getElementById('department').value;
    const semester = parseInt(document.getElementById('semester').value);
    const sgpa = parseFloat(sgpaInput.value);

    if (!name || !regNumber || !department || !semester || isNaN(sgpa)) {
        showToast('Please fill all fields correctly', 'error');
        return;
    }

    // Check if student already exists
    if (students.some(s => s.regNumber === regNumber)) {
        showToast('Student with this register number already exists', 'error');
        return;
    }

    // Calculate CGPA (mock calculation for now)
    const previousCGPA = students.filter(s => s.regNumber === regNumber).length === 0 ? 0 : 7.5;
    const cgpa = previousCGPA === 0 ? sgpa : ((previousCGPA * (semester - 1) + sgpa) / semester).toFixed(2);

    const newStudent = {
        id: Date.now(),
        name,
        regNumber,
        department,
        semester,
        sgpa: parseFloat(sgpa.toFixed(2)),
        cgpa: parseFloat(cgpa),
        subjects: [...currentSubjects],
        history: [{ sem: semester, sgpa: parseFloat(sgpa.toFixed(2)), cgpa: parseFloat(cgpa) }],
        createdAt: new Date().toISOString()
    };

    students.push(newStudent);
    saveData();
    showToast(`${name} added successfully! 🎉`, 'success');

    // Reset form
    studentForm.reset();
    currentSubjects = [];
    subjectsList.innerHTML = '';
    sgpaInput.value = '';
    renderAll();
});

// ===== RENDERING FUNCTIONS =====
function renderAll() {
    renderStudentsTable();
    renderSummaryCards();
    renderCharts();
}

function renderStudentsTable() {
    const tableBody = document.getElementById('tableBody');
    const searchValue = document.getElementById('searchInput').value.toLowerCase();
    const filterType = document.querySelector('.filter-btn.active').dataset.filter;

    let filtered = students.filter(student => {
        const matchesSearch = student.regNumber.toLowerCase().includes(searchValue) ||
                             student.name.toLowerCase().includes(searchValue);
        
        const currentSGPA = student.sgpa;
        const previousSGPA = student.history.length > 1 ? student.history[student.history.length - 2].sgpa : currentSGPA;
        const trend = currentSGPA > previousSGPA ? 'improving' : currentSGPA < previousSGPA ? 'declining' : 'stable';

        if (filterType === 'improving' && trend !== 'improving') return false;
        if (filterType === 'declining' && trend !== 'declining') return false;

        return matchesSearch;
    });

    tableBody.innerHTML = filtered.map(student => {
        const currentSGPA = student.sgpa;
        const previousSGPA = student.history.length > 1 ? student.history[student.history.length - 2].sgpa : currentSGPA;
        
        let trendIcon = '→';
        let trendClass = 'trend-stable';
        
        if (currentSGPA > previousSGPA) {
            trendIcon = '↗ +' + (currentSGPA - previousSGPA).toFixed(2);
            trendClass = 'trend-up';
        } else if (currentSGPA < previousSGPA) {
            trendIcon = '↘ ' + (currentSGPA - previousSGPA).toFixed(2);
            trendClass = 'trend-down';
        }

        let status = 'Good';
        let statusClass = 'status-good';
        if (student.cgpa < 6) {
            status = 'At Risk';
            statusClass = 'status-danger';
        } else if (student.cgpa < 7) {
            status = 'Warning';
            statusClass = 'status-warning';
        }

        return `
            <tr onclick="viewStudentDetail(${student.id})">
                <td>${student.name}</td>
                <td>${student.regNumber}</td>
                <td>${student.department}</td>
                <td>${student.sgpa.toFixed(2)}/10</td>
                <td>${student.cgpa.toFixed(2)}/10</td>
                <td class="${trendClass}">${trendIcon}</td>
                <td><span class="${statusClass}">${status}</span></td>
                <td><button class="btn-view" onclick="event.stopPropagation(); viewStudentDetail(${student.id})">View</button></td>
            </tr>
        `;
    }).join('');
}

function renderSummaryCards() {
    document.getElementById('totalStudents').textContent = students.length;
    
    if (students.length > 0) {
        const avgCGPA = (students.reduce((sum, s) => sum + s.cgpa, 0) / students.length).toFixed(2);
        const maxCGPA = Math.max(...students.map(s => s.cgpa)).toFixed(2);
        const atRiskCount = students.filter(s => s.cgpa < 6).length;

        document.getElementById('classAverage').textContent = avgCGPA;
        document.getElementById('highestCGPA').textContent = maxCGPA;
        document.getElementById('atRiskCount').textContent = atRiskCount;
    }
}

function renderCharts() {
    if (students.length === 0) return;

    // Trend Chart
    const semesterData = {};
    students.forEach(student => {
        student.history.forEach(h => {
            if (!semesterData[h.sem]) semesterData[h.sem] = [];
            semesterData[h.sem].push(h.cgpa);
        });
    });

    const semesters = Object.keys(semesterData).sort((a, b) => a - b);
    const avgsBySemester = semesters.map(sem => 
        (semesterData[sem].reduce((a, b) => a + b, 0) / semesterData[sem].length).toFixed(2)
    );

    const trendCtx = document.getElementById('trendChart')?.getContext('2d');
    if (trendCtx) {
        new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: semesters.map(s => `Sem ${s}`),
                datasets: [{
                    label: 'Class Average CGPA',
                    data: avgsBySemester,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10,
                        ticks: { callback: value => value.toFixed(1) }
                    }
                }
            }
        });
    }

    // Department Chart
    const deptData = {};
    students.forEach(student => {
        if (!deptData[student.department]) deptData[student.department] = [];
        deptData[student.department].push(student.cgpa);
    });

    const depts = Object.keys(deptData);
    const deptAvgs = depts.map(dept => 
        (deptData[dept].reduce((a, b) => a + b, 0) / deptData[dept].length).toFixed(2)
    );

    const deptCtx = document.getElementById('deptChart')?.getContext('2d');
    if (deptCtx) {
        new Chart(deptCtx, {
            type: 'bar',
            data: {
                labels: depts,
                datasets: [{
                    label: 'Average CGPA',
                    data: deptAvgs,
                    backgroundColor: [
                        '#6366f1',
                        '#ec4899',
                        '#06b6d4',
                        '#10b981',
                        '#f59e0b'
                    ],
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 10
                    }
                }
            }
        });
    }
}

// ===== STUDENT DETAIL VIEW =====
function viewStudentDetail(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    const modal = document.getElementById('studentDetailModal');
    
    // Header
    document.getElementById('detailStudentName').textContent = student.name;
    document.getElementById('detailRegNumber').textContent = `${student.regNumber} | ${student.department}`;

    // Stats
    document.getElementById('detailCurrentSGPA').textContent = student.sgpa.toFixed(2);
    document.getElementById('detailCurrentCGPA').textContent = student.cgpa.toFixed(2);

    // Trend
    const currentSGPA = student.sgpa;
    const previousSGPA = student.history.length > 1 ? student.history[student.history.length - 2].sgpa : currentSGPA;
    const trendText = currentSGPA > previousSGPA ? '📈 Improving' : currentSGPA < previousSGPA ? '📉 Declining' : '→ Stable';
    document.getElementById('detailTrend').textContent = trendText;

    // Consistency
    const consistency = calculateConsistency(student.history);
    document.getElementById('detailConsistency').textContent = consistency + '%';

    // Subjects Grid
    const subjectsGrid = document.getElementById('detailSubjectsGrid');
    subjectsGrid.innerHTML = student.subjects.map(subj => `
        <div class="subject-card">
            <h5>${subj.name}</h5>
            <p class="subject-score">${subj.marks.toFixed(1)}</p>
        </div>
    `).join('');

    // History Chart
    const historyCtx = document.getElementById('studentDetailChart')?.getContext('2d');
    if (historyCtx) {
        new Chart(historyCtx, {
            type: 'line',
            data: {
                labels: student.history.map(h => `Sem ${h.sem}`),
                datasets: [{
                    label: 'CGPA',
                    data: student.history.map(h => h.cgpa),
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: '#6366f1'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, max: 10 } }
            }
        });
    }

    // Motivational Message
    const motivation = generateMotivation(student);
    document.getElementById('motivationText').textContent = motivation;

    // Prediction
    const prediction = predictCGPA(student);
    document.getElementById('predictionText').textContent = prediction;

    // Delete button
    document.getElementById('deleteStudentBtn').onclick = () => deleteStudent(studentId);

    // Show modal
    modal.classList.remove('hidden');
}

function calculateConsistency(history) {
    if (history.length < 2) return 100;
    
    const differences = [];
    for (let i = 1; i < history.length; i++) {
        differences.push(Math.abs(history[i].sgpa - history[i - 1].sgpa));
    }
    
    const avgDifference = differences.reduce((a, b) => a + b, 0) / differences.length;
    return Math.max(0, 100 - (avgDifference * 20)).toFixed(0);
}

function generateMotivation(student) {
    const cgpa = student.cgpa;
    const trend = student.sgpa > (student.history.length > 1 ? student.history[student.history.length - 2].sgpa : student.sgpa);
    
    const motivations = {
        excellent: [
            "🌟 Outstanding performance! You're an achiever. Keep maintaining this excellence!",
            "🚀 Exceptional work! Your dedication is paying off. Stay focused!",
            "👑 You're crushing it! This level of performance is truly impressive!"
        ],
        good: [
            "💪 Great job! You're on the right track. Keep up the good work!",
            "✨ Solid performance! A bit more effort can push you to the next level.",
            "🎯 You're doing well! Consider focusing on weak subjects to improve further."
        ],
        average: [
            "📚 You have potential! Identify weak areas and create a focused study plan.",
            "💡 Good foundation. With consistent effort, you can achieve much more.",
            "🔥 Your efforts matter. Dedicate more time to subjects where you struggle."
        ],
        needsImprovement: [
            "⚠️ You're facing challenges. Don't lose hope! Create a recovery plan now.",
            "🆘 Your CGPA needs attention. Reach out for tutoring and support.",
            "💪 This is a wake-up call. You have the potential to bounce back!"
        ]
    };

    let category;
    if (cgpa >= 8.5) category = 'excellent';
    else if (cgpa >= 7.5) category = 'good';
    else if (cgpa >= 6.5) category = 'average';
    else category = 'needsImprovement';

    const msg = motivations[category][Math.floor(Math.random() * motivations[category].length)];
    
    if (trend && cgpa < 8) {
        return msg + " 📈 Your improvement trend is great!";
    }
    
    return msg;
}

function predictCGPA(student) {
    const currentCGPA = student.cgpa;
    const sgpa = student.sgpa;
    const sem = student.semester;
    
    // Simple projection: maintain current performance
    const projectedCGPA = ((currentCGPA * (sem - 1) + sgpa) / sem).toFixed(2);
    
    let targetMessage = '';
    if (currentCGPA < 7) {
        const needed = (7 * (sem + 1) - currentCGPA * sem) / 1;
        targetMessage = `To reach 7.0 CGPA: Score ${Math.min(10, needed).toFixed(2)} in next semester.`;
    } else if (currentCGPA < 8) {
        const needed = (8 * (sem + 1) - currentCGPA * sem) / 1;
        targetMessage = `To reach 8.0 CGPA: Score ${Math.min(10, needed).toFixed(2)} in next semester.`;
    }
    
    return `If you maintain your current performance (${sgpa.toFixed(2)}), your projected CGPA will be ${projectedCGPA}. ${targetMessage}`;
}

function deleteStudent(studentId) {
    if (confirm('Are you sure you want to delete this student?')) {
        students = students.filter(s => s.id !== studentId);
        saveData();
        document.getElementById('studentDetailModal').classList.add('hidden');
        renderAll();
        showToast('Student deleted successfully', 'success');
    }
}

// ===== SEARCH & FILTER =====
document.getElementById('searchInput').addEventListener('input', renderStudentsTable);

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        renderStudentsTable();
    });
});

// ===== DARK MODE =====
const darkModeBtn = document.getElementById('darkModeBtn');
const prefersDarkMode = localStorage.getItem('darkMode') === 'true';

if (prefersDarkMode) {
    document.body.classList.add('dark-mode');
    darkModeBtn.textContent = '☀️';
}

darkModeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    darkModeBtn.textContent = isDark ? '☀️' : '🌙';
});

// ===== MODAL CLOSE =====
document.querySelector('.close-btn').addEventListener('click', () => {
    document.getElementById('studentDetailModal').classList.add('hidden');
});

document.getElementById('studentDetailModal').addEventListener('click', (e) => {
    if (e.target.id === 'studentDetailModal') {
        e.target.classList.add('hidden');
    }
});

// ===== TOAST NOTIFICATIONS =====
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// ===== INITIALIZE =====
loadData();