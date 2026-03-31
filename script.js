// Global variables
let uploadedFiles = [];
let isProcessing = false;
let chatHistory = [];

// DOM Elements
const fileInput = document.getElementById('fileInput');
const dropArea = document.getElementById('dropArea');
const selectedFiles = document.getElementById('selectedFiles');
const statusText = document.getElementById('statusText');
const fileCount = document.getElementById('fileCount');
const studyTime = document.getElementById('studyTime');
const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('UniTA initialized');
    setupDragAndDrop();
    updateFileCount();
    updateStatus('Ready to upload PDFs');
    
    // Add event listeners
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    
    // Test button functionality
    console.log('Study tools should work now');
});

// Setup drag and drop
function setupDragAndDrop() {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight() {
        dropArea.style.borderColor = '#764ba2';
        dropArea.style.background = '#f0f4ff';
    }
    
    function unhighlight() {
        dropArea.style.borderColor = '#667eea';
        dropArea.style.background = '#f8faff';
    }
    
    dropArea.addEventListener('drop', handleDrop, false);
    fileInput.addEventListener('change', handleFileSelect, false);
}

// Handle dropped files
function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
}

// Handle selected files
function handleFileSelect(e) {
    const files = e.target.files;
    handleFiles(files);
}

// Process files
function handleFiles(files) {
    const validFiles = Array.from(files).filter(file => 
        file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );
    
    if (validFiles.length === 0) {
        showNotification('Please select PDF files only!', 'error');
        return;
    }
    
    const newFiles = [];
    validFiles.forEach(file => {
        if (!uploadedFiles.some(f => f.name === file.name && f.size === file.size)) {
            uploadedFiles.push(file);
            newFiles.push(file);
        }
    });
    
    if (newFiles.length > 0) {
        updateFileList();
        updateFileCount();
        showNotification(`Added ${newFiles.length} PDF file(s)`, 'success');
    }
}

// Update file list display
function updateFileList() {
    selectedFiles.innerHTML = '';
    
    if (uploadedFiles.length === 0) {
        selectedFiles.innerHTML = '<div class="empty-state">No files selected yet</div>';
        return;
    }
    
    uploadedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
        
        fileItem.innerHTML = `
            <div class="file-name">
                <i class="fas fa-file-pdf"></i>
                <span>${file.name}</span>
            </div>
            <div class="file-size">${fileSizeMB} MB</div>
            <button class="remove-file" onclick="removeFile(${index})">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        selectedFiles.appendChild(fileItem);
    });
}

// Remove file
function removeFile(index) {
    if (index >= 0 && index < uploadedFiles.length) {
        uploadedFiles.splice(index, 1);
        updateFileList();
        updateFileCount();
        showNotification('File removed', 'info');
    }
}

// Clear all files
function clearFiles() {
    if (uploadedFiles.length === 0) {
        showNotification('No files to clear', 'info');
        return;
    }
    
    if (confirm('Are you sure you want to clear all uploaded files?')) {
        uploadedFiles = [];
        updateFileList();
        updateFileCount();
        showNotification('All files cleared', 'success');
    }
}

// Upload/Process files
async function uploadFiles() {
    console.log('uploadFiles called');
    
    if (uploadedFiles.length === 0) {
        showNotification('Please select PDF files first!', 'error');
        return;
    }
    
    if (isProcessing) {
        showNotification('Already processing files', 'info');
        return;
    }
    
    isProcessing = true;
    const uploadBtn = document.getElementById('uploadBtn');
    const originalText = uploadBtn.innerHTML;
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    uploadBtn.disabled = true;
    
    updateStatus(`Processing ${uploadedFiles.length} file(s)...`);
    
    try {
        // Simulate processing time
        await simulateProcessing();
        
        // Analyze files
        const analysis = analyzeFiles();
        
        // Update stats
        fileCount.textContent = `${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''}`;
        studyTime.textContent = `${analysis.estimatedStudyTime} min`;
        
        showNotification('Files processed successfully!', 'success');
        updateStatus('Files ready - you can now ask questions or generate summaries');
        
        // Auto-generate summary if files were processed
        setTimeout(() => {
            if (uploadedFiles.length > 0) {
                showNotification('Tip: Click "Generate Summary" to see document analysis', 'info');
            }
        }, 1000);
        
    } catch (error) {
        console.error('Error processing files:', error);
        showNotification('Error processing files', 'error');
        updateStatus('Error occurred');
    } finally {
        isProcessing = false;
        uploadBtn.innerHTML = originalText;
        uploadBtn.disabled = false;
    }
}

// Simulate file processing with progress
async function simulateProcessing() {
    return new Promise(resolve => {
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            updateStatus(`Processing... ${progress}%`);
            
            if (progress >= 100) {
                clearInterval(interval);
                resolve();
            }
        }, 200);
    });
}

// Analyze uploaded files
function analyzeFiles() {
    if (uploadedFiles.length === 0) {
        return {
            totalSizeMB: 0,
            estimatedPages: 0,
            estimatedStudyTime: 0,
            detectedSubjects: []
        };
    }
    
    let totalSize = 0;
    let estimatedPages = 0;
    let subjects = new Set();
    
    uploadedFiles.forEach(file => {
        totalSize += file.size;
        
        // Estimate pages based on size (rough estimate: 100KB ≈ 1 page)
        estimatedPages += Math.max(1, Math.round(file.size / 100000));
        
        // Detect subjects from filename
        detectSubjectFromFilename(file.name, subjects);
    });
    
    // Estimate study time (5 minutes per estimated page)
    const estimatedStudyTime = estimatedPages * 5;
    
    return {
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        estimatedPages,
        estimatedStudyTime,
        detectedSubjects: Array.from(subjects)
    };
}

// Detect subject from filename
function detectSubjectFromFilename(filename, subjects) {
    const lowerName = filename.toLowerCase();
    
    const subjectKeywords = {
        'Mathematics': ['math', 'calculus', 'algebra', 'geometry', 'statistics', 'probability'],
        'Physics': ['physics', 'mechanics', 'thermodynamics', 'quantum', 'relativity'],
        'Chemistry': ['chemistry', 'organic', 'inorganic', 'biochem', 'chemical'],
        'Biology': ['biology', 'cell', 'genetics', 'evolution', 'anatomy'],
        'Computer Science': ['computer', 'programming', 'python', 'java', 'javascript', 'algorithm', 'data structure', 'database'],
        'History': ['history', 'historical', 'war', 'revolution', 'ancient'],
        'Economics': ['economics', 'micro', 'macro', 'finance', 'business', 'accounting'],
        'English': ['english', 'literature', 'writing', 'grammar', 'essay', 'composition'],
        'Engineering': ['engineering', 'mechanical', 'electrical', 'civil', 'software']
    };
    
    for (const [subject, keywords] of Object.entries(subjectKeywords)) {
        if (keywords.some(keyword => lowerName.includes(keyword))) {
            subjects.add(subject);
            break; // Stop after first match
        }
    }
    
    if (subjects.size === 0) {
        subjects.add('General Studies');
    }
}

// ================= STUDY TOOLS FUNCTIONS =================

// 1. Generate Summary (FIXED)
function generateSummary() {
    console.log('generateSummary called');
    
    if (uploadedFiles.length === 0) {
        showNotification('Please upload files first!', 'error');
        return;
    }
    
    const analysis = analyzeFiles();
    const summarySection = document.getElementById('summarySection');
    const summaryContent = document.getElementById('summaryContent');
    
    // Build summary HTML
    let summaryHTML = `
        <div class="summary-item">
            <h3><i class="fas fa-chart-bar"></i> Document Analysis</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 15px 0;">
                <div style="text-align: center; padding: 10px; background: #f0f4ff; border-radius: 8px;">
                    <div style="font-size: 1.8rem; color: #667eea; font-weight: bold;">${uploadedFiles.length}</div>
                    <div style="color: #666; font-size: 0.9rem;">PDF Files</div>
                </div>
                <div style="text-align: center; padding: 10px; background: #f0f4ff; border-radius: 8px;">
                    <div style="font-size: 1.8rem; color: #764ba2; font-weight: bold;">${analysis.estimatedPages}</div>
                    <div style="color: #666; font-size: 0.9rem;">Estimated Pages</div>
                </div>
                <div style="text-align: center; padding: 10px; background: #f0f4ff; border-radius: 8px;">
                    <div style="font-size: 1.8rem; color: #4CAF50; font-weight: bold;">${analysis.estimatedStudyTime}</div>
                    <div style="color: #666; font-size: 0.9rem;">Study Minutes</div>
                </div>
            </div>
        </div>
    `;
    
    if (analysis.detectedSubjects.length > 0) {
        summaryHTML += `
            <div class="summary-item">
                <h3><i class="fas fa-book"></i> Detected Subjects</h3>
                <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px;">
                    ${analysis.detectedSubjects.map(subject => 
                        `<span style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 8px 15px; border-radius: 20px; font-size: 0.9rem; font-weight: 500;">${subject}</span>`
                    ).join('')}
                </div>
            </div>
        `;
    }
    
    // Add file list
    summaryHTML += `
        <div class="summary-item">
            <h3><i class="fas fa-file-pdf"></i> Uploaded Files</h3>
            <div style="margin-top: 10px;">
                ${uploadedFiles.map((file, index) => {
                    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
                    return `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; border-bottom: 1px solid #eee;">
                            <span style="color: #333;">${index + 1}. ${file.name}</span>
                            <span style="color: #666; font-size: 0.9rem;">${sizeMB} MB</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    
    summaryHTML += `
        <div class="summary-item">
            <h3><i class="fas fa-lightbulb"></i> Study Recommendations</h3>
            <p style="margin-bottom: 10px;">Based on ${analysis.estimatedPages} estimated pages, we recommend:</p>
            ${getStudyRecommendations(analysis.estimatedStudyTime)}
        </div>
        
        <div class="summary-item">
            <h3><i class="fas fa-question-circle"></i> How to Study Effectively</h3>
            <div style="background: #f8faff; padding: 15px; border-radius: 8px; margin-top: 10px;">
                <p style="margin: 8px 0;"><strong>1. Active Reading:</strong> Ask questions as you read</p>
                <p style="margin: 8px 0;"><strong>2. Note-taking:</strong> Summarize key points in your own words</p>
                <p style="margin: 8px 0;"><strong>3. Spaced Repetition:</strong> Review material multiple times</p>
                <p style="margin: 8px 0;"><strong>4. Self-testing:</strong> Use the quiz feature to check understanding</p>
                <p style="margin: 8px 0;"><strong>5. Teach others:</strong> Explain concepts to reinforce learning</p>
            </div>
        </div>
    `;
    
    summaryContent.innerHTML = summaryHTML;
    summarySection.style.display = 'block';
    
    // Scroll to summary
    summarySection.scrollIntoView({ behavior: 'smooth' });
    
    showNotification('Summary generated successfully!', 'success');
}

// Get study recommendations HTML
function getStudyRecommendations(studyMinutes) {
    const hours = Math.ceil(studyMinutes / 60);
    
    if (hours <= 1) {
        return `
            <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; border-left: 4px solid #4CAF50;">
                <p style="margin: 0; color: #2e7d32;"><strong>Quick Study Session:</strong></p>
                <ul style="margin: 10px 0 0 20px; color: #2e7d32;">
                    <li>Complete in one focused 60-minute session</li>
                    <li>Take a 5-minute break every 25 minutes</li>
                    <li>Review key points for 10 minutes at the end</li>
                </ul>
            </div>
        `;
    } else if (hours <= 3) {
        return `
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196F3;">
                <p style="margin: 0; color: #1565c0;"><strong>Multi-session Plan:</strong></p>
                <ul style="margin: 10px 0 0 20px; color: #1565c0;">
                    <li>Break into ${hours} study sessions of 45-60 minutes each</li>
                    <li>Study for 45 minutes, break for 15</li>
                    <li>Review previous session before starting new</li>
                    <li>Create summary notes after each session</li>
                </ul>
            </div>
        `;
    } else {
        return `
            <div style="background: #fff3e0; padding: 15px; border-radius: 8px; border-left: 4px solid #FF9800;">
                <p style="margin: 0; color: #ef6c00;"><strong>Extended Study Plan:</strong></p>
                <ul style="margin: 10px 0 0 20px; color: #ef6c00;">
                    <li>Create a study schedule over ${Math.ceil(hours/2)} days</li>
                    <li>Study for 60-90 minutes daily</li>
                    <li>Review all material at the end of each week</li>
                    <li>Use active recall techniques daily</li>
                    <li>Practice with past papers or exercises</li>
                </ul>
            </div>
        `;
    }
}

// Close summary
function closeSummary() {
    document.getElementById('summarySection').style.display = 'none';
    showNotification('Summary closed', 'info');
}

// 2. Generate Quiz (FIXED)
function generateQuiz() {
    console.log('generateQuiz called');
    
    if (uploadedFiles.length === 0) {
        showNotification('Upload files first to generate quiz!', 'error');
        return;
    }
    
    // Clear any existing welcome message
    const welcomeMsg = chatBox.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.remove();
    }
    
    const analysis = analyzeFiles();
    const subjects = analysis.detectedSubjects.length > 0 ? 
        analysis.detectedSubjects.join(' and ') : 'the subject';
    
    // Add quiz introduction
    addMessage(`Based on your ${uploadedFiles.length} document${uploadedFiles.length > 1 ? 's' : ''} about ${subjects}, here's a quiz to test your understanding:`, 'ai');
    
    // Generate quiz questions based on detected subjects
    setTimeout(() => {
        const quizQuestions = getQuizQuestions(analysis.detectedSubjects);
        
        quizQuestions.forEach((question, index) => {
            setTimeout(() => {
                addMessage(`${index + 1}. ${question}`, 'ai');
            }, (index + 1) * 500);
        });
        
        // Add quiz instructions
        setTimeout(() => {
            addMessage("💡 **How to use this quiz:**\n1. Try answering each question in your own words\n2. Check your answers by reviewing the PDFs\n3. Ask me to explain any concepts you're unsure about\n4. Create flashcards for key points", 'ai');
        }, (quizQuestions.length + 1) * 500);
        
    }, 1000);
}

// Get quiz questions based on subjects
function getQuizQuestions(subjects) {
    const allQuestions = [];
    
    subjects.forEach(subject => {
        switch(subject) {
            case 'Mathematics':
                allQuestions.push(
                    "What are the fundamental theorems or formulas in this material?",
                    "How would you solve a typical problem from these documents?",
                    "What are the practical applications of these mathematical concepts?"
                );
                break;
            case 'Computer Science':
                allQuestions.push(
                    "What programming concepts or algorithms are discussed?",
                    "How would you implement the main ideas in code?",
                    "What are the time/space complexities of discussed algorithms?"
                );
                break;
            case 'Physics':
                allQuestions.push(
                    "What physical laws or principles are central to this topic?",
                    "How do the equations relate to real-world phenomena?",
                    "What experimental evidence supports these theories?"
                );
                break;
            default:
                allQuestions.push(
                    "What are the 3-5 most important concepts in this material?",
                    "How would you explain the main topic to someone unfamiliar with it?",
                    "What are the relationships between different concepts discussed?",
                    "What would be the most challenging aspect for a beginner?",
                    "How does this topic connect to real-world applications?"
                );
        }
    });
    
    // Return unique questions, limit to 5
    return [...new Set(allQuestions)].slice(0, 5);
}

// 3. Create Study Plan (FIXED)
function createStudyPlan() {
    console.log('createStudyPlan called');
    
    if (uploadedFiles.length === 0) {
        showNotification('Upload files first to create study plan!', 'error');
        return;
    }
    
    // Clear any existing welcome message
    const welcomeMsg = chatBox.querySelector('.welcome-message');
    if (welcomeMsg) {
        welcomeMsg.remove();
    }
    
    const analysis = analyzeFiles();
    const totalHours = Math.ceil(analysis.estimatedStudyTime / 60);
    
    addMessage(`📚 **Personalized Study Plan**\nBased on ${analysis.estimatedPages} pages across ${uploadedFiles.length} document${uploadedFiles.length > 1 ? 's' : ''}:`, 'ai');
    
    setTimeout(() => {
        const studyPlan = generateStudyPlan(totalHours, analysis.detectedSubjects);
        
        studyPlan.forEach((item, index) => {
            setTimeout(() => {
                addMessage(item, 'ai');
            }, (index + 1) * 500);
        });
        
        // Add study tips
        setTimeout(() => {
            addMessage("🎯 **Study Tips:**\n• Study in a quiet environment\n• Take regular breaks (Pomodoro technique)\n• Test yourself regularly\n• Teach concepts to others\n• Stay hydrated and get enough sleep", 'ai');
        }, (studyPlan.length + 1) * 500);
        
    }, 1000);
}

// Generate study plan based on hours and subjects
function generateStudyPlan(totalHours, subjects) {
    const plan = [];
    
    if (totalHours <= 2) {
        plan.push(
            "**Day 1 (Foundation):**\n• Skim all materials (30 min)\n• Identify main topics and structure\n• Note down key terms and definitions",
            "**Day 2 (Deep Dive):**\n• Study core concepts (60 min)\n• Work through examples\n• Create summary notes\n• Self-test with practice questions"
        );
    } else if (totalHours <= 5) {
        const days = Math.ceil(totalHours / 2);
        for (let i = 1; i <= days; i++) {
            plan.push(
                `**Day ${i}:**\n• Review previous session (15 min)\n• Study new material (90 min)\n• Complete exercises (30 min)\n• Create flashcards (15 min)`
            );
        }
        plan.push(`**Day ${days + 1} (Review):**\n• Review all flashcards (45 min)\n• Practice tests (60 min)\n• Identify weak areas (15 min)`);
    } else {
        const weeks = Math.ceil(totalHours / 10);
        for (let w = 1; w <= weeks; w++) {
            plan.push(
                `**Week ${w}:**\n• Monday: Introduction & overview\n• Wednesday: Core concepts\n• Friday: Applications & practice\n• Sunday: Review & assessment`
            );
        }
    }
    
    return plan;
}

// 4. Ask Questions (via chat - already implemented via sendMessage)
// This will be handled by the chat interface

// ================= CHAT FUNCTIONS =================

// Send message in chat
function sendMessage() {
    console.log('sendMessage called');
    
    const message = userInput.value.trim();
    if (!message) {
        showNotification('Please enter a message', 'error');
        return;
    }
    
    if (uploadedFiles.length === 0) {
        showNotification('Please upload files first!', 'error');
        return;
    }
    
    // Add user message
    addMessage(message, 'user');
    userInput.value = '';
    
    // Disable send button during processing
    sendBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    sendBtn.disabled = true;
    
    // Store in history
    chatHistory.push({ role: 'user', content: message, timestamp: new Date() });
    
    // Simulate AI thinking time and generate response
    setTimeout(() => {
        const response = generateAIResponse(message);
        addMessage(response, 'ai');
        
        // Store AI response
        chatHistory.push({ role: 'assistant', content: response, timestamp: new Date() });
        
        // Re-enable send button
        sendBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        sendBtn.disabled = false;
        
        // Save chat history
        saveChatHistory();
        
    }, 1500);
}

// Generate AI response based on question
function generateAIResponse(question) {
    const lowerQuestion = question.toLowerCase();
    const analysis = analyzeFiles();
    
    // Context-aware responses
    if (lowerQuestion.includes('summary') || lowerQuestion.includes('overview') || lowerQuestion.includes('summarize')) {
        return `Based on your ${uploadedFiles.length} document${uploadedFiles.length > 1 ? 's' : ''} (${analysis.estimatedPages} estimated pages), I recommend checking the "Generate Summary" tool for detailed analysis. The materials cover ${analysis.detectedSubjects.length > 0 ? analysis.detectedSubjects.join(', ') : 'various topics'}. Key areas to focus on include understanding fundamental principles and their applications.`;
    }
    else if (lowerQuestion.includes('main topic') || lowerQuestion.includes('what is this about') || lowerQuestion.includes('what are we studying')) {
        return `Your materials appear to focus on ${analysis.detectedSubjects.length > 0 ? analysis.detectedSubjects.join(' and ') : 'academic concepts'}. Based on the ${uploadedFiles.length} file${uploadedFiles.length > 1 ? 's' : ''} uploaded, you should start by identifying the core concepts, then explore how they connect and apply to practical scenarios.`;
    }
    else if (lowerQuestion.includes('explain') || lowerQuestion.includes('what is') || lowerQuestion.includes('define')) {
        const topic = question.replace(/explain|what is|tell me about|define|how does|\?/gi, '').trim();
        if (topic.length > 2) {
            return `"${topic}" is likely a key concept in your materials. Based on the uploaded documents, this would be explained through:\n\n1. **Definition**: Core meaning and scope\n2. **Examples**: Practical illustrations\n3. **Applications**: Real-world uses\n4. **Relationships**: Connections to other concepts\n\nI recommend reviewing the relevant sections in your PDFs for detailed explanations.`;
        }
    }
    else if (lowerQuestion.includes('quiz') || lowerQuestion.includes('test') || lowerQuestion.includes('exam')) {
        return `Great idea! Testing your knowledge is one of the most effective study methods. Based on your ${uploadedFiles.length} document${uploadedFiles.length > 1 ? 's' : ''}, focus on:\n\n✅ Key definitions and terminology\n✅ Fundamental principles and theories\n✅ Practical applications and examples\n✅ Problem-solving approaches\n✅ Connections between different concepts\n\nTry the "Generate Quiz" tool for specific questions!`;
    }
    else if (lowerQuestion.includes('help') || lowerQuestion.includes('how to') || lowerQuestion.includes('what should')) {
        return `I can help you with:\n\n📚 **Understanding**: Explain concepts from your materials\n📊 **Analysis**: Summarize and organize information\n🧪 **Practice**: Generate quizzes and study questions\n🗓️ **Planning**: Create personalized study schedules\n💡 **Strategy**: Suggest effective learning techniques\n\nJust ask specific questions about your uploaded documents!`;
    }
    else {
        // Generic intelligent response
        const responses = [
            `Based on your study materials, this topic is thoroughly covered with explanations, examples, and applications. The key is to understand both the theoretical foundations and their practical implementations.`,
            `Your documents provide comprehensive coverage of this subject. Pay attention to how concepts build upon each other and relate to real-world scenarios.`,
            `This appears to be a significant aspect of your course material. Focus on mastering the fundamentals first, then explore advanced applications and connections.`,
            `The uploaded PDFs contain valuable information about this. I recommend active reading techniques: ask questions, make connections, and summarize in your own words.`
        ];
        
        return responses[Math.floor(Math.random() * responses.length)] + 
               `\n\n*Tip: For specific details, refer to the relevant sections in your uploaded PDFs.*`;
    }
}

// Add message to chat box
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const icon = sender === 'user' ? 'fas fa-user' : 'fas fa-robot';
    const senderName = sender === 'user' ? 'You' : 'UniTA';
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <i class="${icon}"></i>
            <span>${senderName}</span>
            <span style="margin-left: auto; font-size: 0.8rem; color: #888;">
                ${new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
        </div>
        <div style="white-space: pre-line;">${text}</div>
    `;
    
    chatBox.appendChild(messageDiv);
    
    // Remove welcome message if first real message
    const welcomeMsg = chatBox.querySelector('.welcome-message');
    if (welcomeMsg && chatBox.children.length > 1) {
        welcomeMsg.style.opacity = '0.5';
        setTimeout(() => {
            if (welcomeMsg.parentNode) {
                welcomeMsg.remove();
            }
        }, 500);
    }
    
    // Scroll to bottom
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Clear chat
function clearChat() {
    if (confirm('Clear all chat messages?')) {
        chatBox.innerHTML = `
            <div class="welcome-message">
                <i class="fas fa-graduation-cap"></i>
                <h3>Welcome to UniTA!</h3>
                <p>Upload your PDFs and start asking questions about your study materials.</p>
                <p>I'll help you understand, summarize, and learn effectively.</p>
            </div>
        `;
        chatHistory = [];
        showNotification('Chat cleared', 'info');
    }
}

// Save chat history to localStorage
function saveChatHistory() {
    try {
        localStorage.setItem('unita_chat_history', JSON.stringify(chatHistory));
    } catch (e) {
        console.log('Could not save chat history:', e);
    }
}

// Load chat history from localStorage
function loadChatHistory() {
    try {
        const saved = localStorage.getItem('unita_chat_history');
        if (saved) {
            chatHistory = JSON.parse(saved);
        }
    } catch (e) {
        console.log('Could not load chat history:', e);
    }
}

// Update file count display
function updateFileCount() {
    fileCount.textContent = `${uploadedFiles.length} file${uploadedFiles.length !== 1 ? 's' : ''}`;
}

// Update status message
function updateStatus(message) {
    statusText.textContent = message;
}

// Show notification
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = type === 'success' ? 'check-circle' : 
                 type === 'error' ? 'exclamation-circle' : 'info-circle';
    
    notification.innerHTML = `<i class="fas fa-${icon}"></i> ${message}`;
    container.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// Load saved data on page load
window.addEventListener('load', () => {
    loadChatHistory();
    console.log('UniTA loaded successfully');
});