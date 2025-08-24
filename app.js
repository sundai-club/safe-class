class SafeClassSimulation {
    constructor() {
        this.currentScenario = 0;
        this.scenarios = [];
        this.dialogHistory = [];
        this.scores = [];

        this.speechRecognition = null;
        this.isRecording = false;

        this.initializeElements();
        this.bindEvents();
        this.loadScenarios();
    }

    initializeElements() {
        this.scenarioDescription = document.getElementById('scenario-description');
        this.dialogMessages = document.getElementById('dialog-messages');
        this.teacherResponse = document.getElementById('teacher-response');
        this.submitButton = document.getElementById('submit-response');
        this.hintButton = document.getElementById('get-hint');
        this.nextScenarioButton = document.getElementById('next-scenario');
        this.feedbackContent = document.getElementById('feedback-content');
        this.progressFill = document.getElementById('progress-fill');
        this.scenariosCompleted = document.getElementById('scenarios-completed');
        this.averageScore = document.getElementById('average-score');
        this.loading = document.getElementById('loading');
        // Audio input elements (must be set after DOM is ready)
        this.audioRecordButton = document.getElementById('audio-record');
        this.audioStatus = document.getElementById('audio-status');
    }

    bindEvents() {
        this.submitButton.addEventListener('click', () => this.handleSubmitResponse());
        this.hintButton.addEventListener('click', () => this.getHint());
        this.nextScenarioButton.addEventListener('click', () => this.nextScenario());

        this.teacherResponse.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.handleSubmitResponse();
            }
        });

        // Audio record button event
        if (this.audioRecordButton) {
            this.audioRecordButton.addEventListener('click', () => {
                if (!this.isRecording) {
                    this.startAudioRecording();
                } else {
                    this.stopAudioRecording();
                }
            });
            this.audioRecordLabel = this.audioRecordButton.querySelector('span');
        }
    }

    startAudioRecording() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showMessage('Speech recognition is not supported in this browser.', 'error');
            return;
        }
        if (!this.speechRecognition) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.speechRecognition = new SpeechRecognition();
            this.speechRecognition.lang = 'en-US';
            this.speechRecognition.interimResults = true;
            this.speechRecognition.maxAlternatives = 1;
            this.speechRecognition.onresult = (event) => {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    interimTranscript += event.results[i][0].transcript;
                }
                this.teacherResponse.value = interimTranscript;
            };
            this.speechRecognition.onerror = (event) => {
                this.isRecording = false;
                if (this.audioStatus) this.audioStatus.style.display = 'none';
                this.setAudioButtonState(false);
                this.showMessage('Speech recognition error: ' + event.error, 'error');
            };
        }
        this.isRecording = true;
        if (this.audioStatus) this.audioStatus.style.display = 'inline';
        this.setAudioButtonState(true);
        this.speechRecognition.start();
    }

    stopAudioRecording() {
        if (this.speechRecognition && this.isRecording) {
            this.speechRecognition.stop();
        }
        this.isRecording = false;
        if (this.audioStatus) this.audioStatus.style.display = 'none';
        this.setAudioButtonState(false);
        // Auto-submit after stopping
        if (this.teacherResponse.value.trim()) {
            this.handleSubmitResponse();
        }
    }

    setAudioButtonState(isRecording) {
        if (this.audioRecordButton && this.audioRecordLabel) {
            const iconSVG = this.audioRecordButton.querySelector('svg');
            if (isRecording) {
                this.audioRecordLabel.textContent = 'Stop';
                if (iconSVG) {
                    // Stop icon: filled square
                    iconSVG.innerHTML = '<rect width="24" height="24" fill="none"/><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>';
                }
            } else {
                this.audioRecordLabel.textContent = 'Speak';
                if (iconSVG) {
                    // Microphone icon
                    iconSVG.innerHTML = '<rect width="24" height="24" fill="none"/><path d="M12 16a4 4 0 0 0 4-4V7a4 4 0 1 0-8 0v5a4 4 0 0 0 4 4Zm5-4a1 1 0 1 1 2 0 7 7 0 0 1-6 6.92V21a1 1 0 1 1-2 0v-2.08A7 7 0 0 1 5 12a1 1 0 1 1 2 0 5 5 0 0 0 10 0Z" fill="currentColor"/>';
                }
            }
        }
    }

    // removed toggleAudioRecording, replaced by startAudioRecording/stopAudioRecording

    loadScenarios() {
        this.scenarios = [
            {
                id: 1,
                title: "History Class Fight",
                description: "It is third period in a 10th-grade history class. You are midway through a lecture when two students, Alex and Jordan, begin arguing about their group project. Jordan (raising his voice): \"You didn't even do your part. We had to cover for you.\" Alex (snapping back): \"That's not true! At least I showed up—unlike you.\" The tension escalates quickly. Jordan pushes his chair back and walks across the room. Alex stands, ready to confront him. Within seconds, Jordan shoves Alex, and Alex swings a fist in response. The room erupts—students are shouting, some standing on chairs, a few pulling out their phones to record. Papers scatter, desks shift, and the atmosphere feels chaotic. You are at the front of the classroom. The fight is happening near the back, and your students are looking to you. What do you do next?",
                initialDialog: [],
                context: "A full physical altercation has erupted in your classroom during instruction. Students are recording, chaos has taken over, and immediate intervention is critical for safety."
            }
        ];

        this.startScenario(0);
    }


    async startScenario(index) {
        if (index >= this.scenarios.length) {
            this.showCompletionSummary();
            return;
        }

        this.currentScenario = index;
        const scenario = this.scenarios[index];
        
        this.scenarioDescription.innerHTML = `
            <h4>${scenario.title}</h4>
            <p>${scenario.description}</p>
        `;

        // If no initial dialog exists, generate it using AI
        if (scenario.initialDialog.length === 0) {
            this.showLoading(true);
            try {
                await this.generateInitialDialog(scenario);
            } catch (error) {
                console.error('Error generating initial dialog:', error);
                // Fallback to basic dialog
                this.dialogHistory = [
                    { type: 'system', content: 'The situation is unfolding in your classroom.' }
                ];
            }
            this.showLoading(false);
        } else {
            this.dialogHistory = [...scenario.initialDialog];
        }
        
        this.renderDialog();
        
        this.teacherResponse.value = '';
        this.feedbackContent.textContent = 'Analyze the situation carefully. What would be your first response?';
        
        this.updateProgress();
    }

    async generateInitialDialog(scenario) {
        const prompt = `Based on this classroom violence scenario, generate initial dialog for a teacher training simulation featuring 10th-grade students (15-16 years old).

SCENARIO: ${scenario.description}

Generate 3-5 initial messages showing the conflict progression. Use authentic Gen-Z language that's school-appropriate but reflects how teenagers actually speak:

STUDENT LANGUAGE GUIDELINES:
- Use casual contractions ("That's so..." "You're not gonna..." "I'm literally...")
- Include mild expressions ("This is ridiculous" "Whatever" "Seriously?" "No cap")
- Age-appropriate slang ("That's actually crazy" "For real?" "That's cap" "I'm done")
- Natural speech patterns teens use when stressed or frustrated
- Keep it realistic but school-appropriate

Include:
1. A system message describing when you notice the situation
2. 2-3 student dialog exchanges showing the escalation with authentic teen language
3. A final system message describing the current chaotic state

Format each message as: TYPE: "content"
Where TYPE is either "system" or "student"

Example format:
system: "You are midway through your history lecture when you notice tension building."
student: "Jordan: 'Bro, you literally didn't do anything for our project. That's so unfair.'"
student: "Alex: 'That's cap! I showed up way more than you did, for real.'"
system: "The physical fight has erupted and chaos fills the classroom."

Generate realistic dialog with authentic 10th-grade language:`;

        const result = await this.callBackendAPI(prompt, 'dialog');
        this.parseInitialDialog(result.response);
    }

    parseInitialDialog(dialogText) {
        const lines = dialogText.split('\n').filter(line => line.trim());
        this.dialogHistory = [];

        lines.forEach(line => {
            const match = line.match(/^(system|student):\s*"?([^"]*)"?$/i);
            if (match) {
                const type = match[1].toLowerCase();
                const content = match[2].trim();
                if (content) {
                    this.dialogHistory.push({ type, content });
                }
            }
        });

        // Fallback if parsing failed
        if (this.dialogHistory.length === 0) {
            this.dialogHistory = [
                { type: 'system', content: 'You notice the classroom situation developing.' },
                { type: 'student', content: 'Jordan: "You didn\'t even do your part. We had to cover for you."' },
                { type: 'student', content: 'Alex: "That\'s not true! At least I showed up—unlike you."' },
                { type: 'system', content: 'The situation has escalated to physical violence.' }
            ];
        }
    }

    renderDialog() {
        this.dialogMessages.innerHTML = '';
        
        this.dialogHistory.forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${message.type}`;
            messageDiv.textContent = message.content;
            this.dialogMessages.appendChild(messageDiv);
        });

        this.dialogMessages.scrollTop = this.dialogMessages.scrollHeight;
    }

    async handleSubmitResponse() {
        const response = this.teacherResponse.value.trim();
        
        if (!response) {
            this.showMessage('Please enter your response first.', 'error');
            return;
        }

        this.addTeacherMessage(response);
        this.teacherResponse.value = '';
        this.showLoading(true);

        try {
            const feedback = await this.getAIFeedback(response);
            const studentResponse = await this.generateStudentResponse(response);
            
            this.displayFeedback(feedback.response);
            
            if (studentResponse && studentResponse.response && studentResponse.response.trim()) {
                setTimeout(() => {
                    this.addStudentMessage(studentResponse.response);
                }, 1000);
            }
            
        } catch (error) {
            console.error('Error getting AI feedback:', error);
            this.showMessage('Error communicating with AI service.', 'error');
        }

        this.showLoading(false);
    }

    addTeacherMessage(message) {
        this.dialogHistory.push({ type: 'teacher', content: `Teacher: "${message}"` });
        this.renderDialog();
    }

    addStudentMessage(message) {
        // Check for multiple student responses in various formats:
        // [Name]: "quote" OR Name: "quote"
        const bracketPattern = /\[([^\]]+)\]:\s*"([^"]+)"/g;
        const namePattern = /([A-Z][a-z]+):\s*"([^"]+)"/g;
        
        let matches = [...message.matchAll(bracketPattern)];
        if (matches.length === 0) {
            matches = [...message.matchAll(namePattern)];
        }
        
        if (matches.length > 1) {
            // Multiple students - create separate bubbles
            matches.forEach(match => {
                const studentName = match[1];
                const studentQuote = match[2];
                this.dialogHistory.push({ 
                    type: 'student', 
                    content: `${studentName}: "${studentQuote}"` 
                });
            });
        } else if (matches.length === 1) {
            // Single student with proper format
            const studentName = matches[0][1];
            const studentQuote = matches[0][2];
            this.dialogHistory.push({ 
                type: 'student', 
                content: `${studentName}: "${studentQuote}"` 
            });
        } else {
            // Try to split by common patterns for unquoted responses
            const lines = message.split(/(?=[A-Z][a-z]+:\s)/);
            if (lines.length > 1 && lines[0].trim() === '') {
                // Remove empty first element
                lines.shift();
            }
            
            if (lines.length > 1) {
                // Multiple student responses without quotes
                lines.forEach(line => {
                    const trimmed = line.trim();
                    if (trimmed) {
                        this.dialogHistory.push({ type: 'student', content: trimmed });
                    }
                });
            } else {
                // No specific format detected - use as is
                this.dialogHistory.push({ type: 'student', content: message });
            }
        }
        
        this.renderDialog();
    }

    async getAIFeedback(teacherResponse) {
        const scenario = this.scenarios[this.currentScenario];
        const dialogContext = this.dialogHistory.map(msg => msg.content).join('\n');
        
        const prompt = `
You are an expert in classroom management and de-escalation techniques. A teacher is practicing handling a violence situation in a simulation.

SCENARIO: ${scenario.title}
DESCRIPTION: ${scenario.description}
CONTEXT: ${scenario.context}

DIALOG SO FAR:
${dialogContext}

TEACHER'S LATEST RESPONSE: "${teacherResponse}"

Please provide constructive feedback on the teacher's response, considering:
1. Safety first - Did they prioritize everyone's physical safety?
2. De-escalation techniques - Did they use appropriate language and tone?
3. Authority and control - Did they establish appropriate boundaries?
4. Empathy and understanding - Did they acknowledge student emotions?
5. Next steps - What should they do next?

Provide specific, actionable feedback in 2-3 sentences. Rate the response from 1-10 and explain why.
Format: SCORE: [number]/10 - [feedback]
        `;

        return await this.callBackendAPI(prompt, 'feedback');
    }

    async generateStudentResponse(teacherResponse) {
        const scenario = this.scenarios[this.currentScenario];
        const dialogContext = this.dialogHistory.slice(0, -1).map(msg => msg.content).join('\n');
        
        const prompt = `
You are role-playing as 10th-grade students (15-16 years old) in this classroom violence scenario. Use authentic Gen-Z language that's appropriate for school but reflects how teenagers actually speak today.

SCENARIO: ${scenario.title}
DESCRIPTION: ${scenario.description}

DIALOG SO FAR:
${dialogContext}

The teacher just said: "${teacherResponse}"

Generate realistic responses from the students involved. Use natural 10th-grade language including:
- Casual contractions ("That's so..." "I'm not gonna..." "He's being...")
- Mild expressions of frustration ("This is ridiculous" "Whatever" "Seriously?")
- Age-appropriate slang ("That's cap" "No way" "For real?" "That's actually crazy")
- Natural speech patterns teens use when stressed or emotional

Consider:
- Are they calming down or still agitated?
- How would they realistically react to this teacher approach?
- Keep it school-appropriate but authentic to how 15-16 year olds actually talk
- 1-2 sentences from the main students involved

Response format: [Student name]: "[response]"
        `;

        return await this.callBackendAPI(prompt, 'student');
    }

    async callBackendAPI(prompt, type = 'feedback') {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: prompt,
                type: type
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(errorData.error || `Request failed: ${response.status}`);
        }

        return await response.json();
    }

    parseMarkdown(text) {
        return text
            // Bold text (**bold** or __bold__)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/__(.*?)__/g, '<strong>$1</strong>')
            // Italic text (*italic* or _italic_)
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/_(.*?)_/g, '<em>$1</em>')
            // Line breaks
            .replace(/\n/g, '<br>')
            // Numbered lists (simple)
            .replace(/^\d+\.\s+(.*)$/gm, '<li>$1</li>')
            // Bullet points
            .replace(/^[-*]\s+(.*)$/gm, '<li>$1</li>')
            // Wrap consecutive list items in ul
            .replace(/(<li>.*<\/li>\s*)+/gs, '<ul>$&</ul>');
    }

    displayFeedback(feedback) {
        const htmlFeedback = this.parseMarkdown(feedback);
        this.feedbackContent.innerHTML = htmlFeedback;
        
        const scoreMatch = feedback.match(/SCORE:\s*(\d+)/i);
        if (scoreMatch) {
            const score = parseInt(scoreMatch[1]);
            this.scores.push(score);
            
            if (score >= 8) {
                this.feedbackContent.className = 'feedback-positive';
            } else if (score >= 6) {
                this.feedbackContent.className = 'feedback-neutral';
            } else {
                this.feedbackContent.className = 'feedback-negative';
            }
            
            this.updateProgress();
        }
    }

    async getHint() {
        this.showLoading(true);
        
        try {
            const scenario = this.scenarios[this.currentScenario];
            const prompt = `Give a brief hint for this classroom violence situation:

SCENARIO: ${scenario.title}
DESCRIPTION: ${scenario.description}

Provide ONE specific, actionable tip in 1-2 sentences. Be concise and focus on immediate de-escalation.`;
            
            const result = await this.callBackendAPI(prompt, 'hint');
            this.showMessage(`💡 Hint: ${result.response}`, 'info');
            
        } catch (error) {
            this.showMessage('Error getting hint from server.', 'error');
        }
        
        this.showLoading(false);
    }

    nextScenario() {
        // For continuous training with single scenario, restart the same scenario
        this.startScenario(0);
    }

    showCompletionSummary() {
        const averageScore = this.scores.length > 0 ? 
            (this.scores.reduce((sum, score) => sum + score, 0) / this.scores.length).toFixed(1) : 0;
        
        this.scenarioDescription.innerHTML = `
            <h4>🎉 Training Complete!</h4>
            <p>You have completed all violence de-escalation scenarios.</p>
            <div style="margin-top: 20px;">
                <h5>Final Results:</h5>
                <ul>
                    <li>Scenarios Completed: ${this.scenarios.length}</li>
                    <li>Average Score: ${averageScore}/10</li>
                    <li>Performance: ${this.getPerformanceLevel(averageScore)}</li>
                </ul>
            </div>
        `;
        
        this.feedbackContent.innerHTML = `
            <h4>Training Summary</h4>
            <p>Great work completing the violence de-escalation training! Remember these key principles:</p>
            <ul>
                <li><strong>Safety First:</strong> Always prioritize the physical safety of all students</li>
                <li><strong>Stay Calm:</strong> Your demeanor sets the tone for resolution</li>
                <li><strong>Listen Actively:</strong> Understanding student emotions helps de-escalate</li>
                <li><strong>Set Clear Boundaries:</strong> Be firm but respectful in your authority</li>
                <li><strong>Follow Up:</strong> Address underlying issues after immediate safety is restored</li>
            </ul>
        `;
        
        this.nextScenarioButton.textContent = 'Restart Training';
        this.nextScenarioButton.onclick = () => window.location.reload();
    }

    getPerformanceLevel(score) {
        if (score >= 9) return 'Excellent 🌟';
        if (score >= 8) return 'Very Good 👍';
        if (score >= 7) return 'Good ✅';
        if (score >= 6) return 'Satisfactory 📝';
        return 'Needs Improvement 📚';
    }

    updateProgress() {
        const responsesGiven = this.scores.length;
        const percentage = Math.min((responsesGiven / 10) * 100, 100); // Progress based on responses given
        
        this.progressFill.style.width = `${percentage}%`;
        this.scenariosCompleted.textContent = `${responsesGiven}`;
        
        if (this.scores.length > 0) {
            const average = (this.scores.reduce((sum, score) => sum + score, 0) / this.scores.length).toFixed(1);
            this.averageScore.textContent = `${average}`;
        }
    }

    showLoading(show) {
        this.loading.classList.toggle('hidden', !show);
        this.submitButton.disabled = show;
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 5px;
            color: white;
            font-weight: 500;
            z-index: 1001;
            max-width: 300px;
            background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#27ae60' : '#3498db'};
        `;
        messageDiv.textContent = message;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 4000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SafeClassSimulation();
});