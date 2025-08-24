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
        // Timeout/attempt tracking
        this.attemptCount = 0;
        this.timeoutId = null;
        this.timedOut = false;
        this.firstInteraction = false;
                    // Stop icon: filled square
                    iconSVG.innerHTML = '<rect width="24" height="24" fill="none"/><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>';
                }
            } else {
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
        if (this.timedOut) {
            this.showMessage('Scenario timed out. Please proceed to the next scenario.', 'error');
            return;
        }
        // Start timeout on first interaction
        if (!this.firstInteraction) {
            this.firstInteraction = true;
            this.timeoutId = setTimeout(() => {
                this.timedOut = true;
                this.showMessage('⏰ Scenario timed out after 5 minutes.', 'error');
                this.endScenarioDueToTimeout();
            }, 5 * 60 * 1000); // 5 minutes
        }
        this.attemptCount++;
        if (this.attemptCount >= 5) {
            this.timedOut = true;
            if (this.timeoutId) clearTimeout(this.timeoutId);
            this.showMessage('⏰ Scenario ended after 5 attempts.', 'error');
            this.endScenarioDueToTimeout();
            return;
        }
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
    }

    async generateInitialDialog(scenario) {
        const prompt = `Based on this classroom violence scenario, generate initial dialog for a teacher training simulation featuring 10th-grade students (15-16 years old).
        // Reset timeout/attempt tracking for new scenario
        this.attemptCount = 0;
        this.timedOut = false;
        this.firstInteraction = false;
        if (this.timeoutId) clearTimeout(this.timeoutId);

SCENARIO: ${scenario.description}
    endScenarioDueToTimeout() {
        // Disable input and show summary or next scenario button
        this.teacherResponse.disabled = true;
        this.submitButton.disabled = true;
        this.feedbackContent.innerHTML += '<br><strong>Scenario ended due to timeout or max attempts.</strong>';
        this.nextScenarioButton.style.display = 'inline-block';
    }

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
            // Only show message content, no avatar
            messageDiv.innerHTML = `<span class="message-content">${message.content}</span>`;
            this.dialogMessages.appendChild(messageDiv);
        });
        this.dialogMessages.scrollTop = this.dialogMessages.scrollHeight;
    }

    async handleSubmitResponse() {
        if (this.timedOut) {
            this.showMessage('Scenario timed out. Please proceed to the next scenario.', 'error');
            return;
        }
        // Count attempt BEFORE processing
        this.attemptCount = (this.attemptCount || 0) + 1;
        if (this.attemptCount > 5) {
            this.timedOut = true;
            if (this.timeoutId) clearTimeout(this.timeoutId);
            this.showMessage('⏰ Scenario ended after 5 attempts.', 'error');
            this.endScenarioDueToTimeout();
            return;
        }
        const response = this.teacherResponse.value.trim();
        if (!response) {
            this.showMessage('Please enter your response first.', 'error');
            return;
        }

        // Start timeout on first interaction
        if (!this.firstInteraction) {
            this.firstInteraction = true;
            this.timeoutId = setTimeout(() => {
                this.timedOut = true;
                this.showMessage('⏰ Scenario timed out after 5 minutes.', 'error');
                this.endScenarioDueToTimeout();
            }, 5 * 60 * 1000); // 5 minutes
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
You are an expert in classroom crisis management evaluating a teacher's response to classroom violence. Rate the teacher's response against these 5 specific criteria:

SCENARIO: ${scenario.title}
DESCRIPTION: ${scenario.description}
CONTEXT: ${scenario.context}

DIALOG SO FAR:
${dialogContext}

TEACHER'S LATEST RESPONSE: "${teacherResponse}"

Evaluate the teacher's response using these exact criteria:

**1. Safety & Crisis Protocols**
- EXEMPLARY: Prioritizes safety, clear directions, calls for help immediately
- MEETS EXPECTATIONS: Addresses safety but less decisive
- ROOM FOR IMPROVEMENT: Ignores protocols or handles alone

**2. De-escalation & Communication**
- EXEMPLARY: Uses calm, empathetic language that validates emotions
- MEETS EXPECTATIONS: Basic calm communication
- ROOM FOR IMPROVEMENT: Harsh, dismissive, or confrontational language

**3. Classroom Management & Bystanders**
- EXEMPLARY: Clear directions to other students to stay seated/quiet
- MEETS EXPECTATIONS: Some attempt to manage the class
- ROOM FOR IMPROVEMENT: No management of bystanders

**4. Adherence to Policy & Ethical Standards**
- EXEMPLARY: Follows proper documentation and administrative protocols
- MEETS EXPECTATIONS: Mentions involving administration
- ROOM FOR IMPROVEMENT: Threatens inappropriate consequences

**5. Professionalism & Emotional Regulation**
- EXEMPLARY: Maintains calm, steady, professional demeanor
- MEETS EXPECTATIONS: Controlled but may show some stress
- ROOM FOR IMPROVEMENT: Loses composure, sarcastic, or unprofessional

Format your response exactly like this:

**CRITERIA EVALUATION:**

1. **Safety & Crisis Protocols:** [EXEMPLARY/MEETS EXPECTATIONS/ROOM FOR IMPROVEMENT]
2. **De-escalation & Communication:** [EXEMPLARY/MEETS EXPECTATIONS/ROOM FOR IMPROVEMENT]  
3. **Classroom Management & Bystanders:** [EXEMPLARY/MEETS EXPECTATIONS/ROOM FOR IMPROVEMENT]
4. **Adherence to Policy & Ethical Standards:** [EXEMPLARY/MEETS EXPECTATIONS/ROOM FOR IMPROVEMENT]
5. **Professionalism & Emotional Regulation:** [EXEMPLARY/MEETS EXPECTATIONS/ROOM FOR IMPROVEMENT]

**OVERALL SCORE:** [percentage]%

**FEEDBACK:** [2-3 sentences of specific, actionable feedback]

For scoring, assign points to each criterion:
- EXEMPLARY = 20 points
- MEETS EXPECTATIONS = 15 points  
- ROOM FOR IMPROVEMENT = 10 points

Sum all 5 criteria scores for the overall percentage (out of 100%).
        `;

        return await this.callBackendAPI(prompt, 'feedback');
    }

    async generateStudentResponse(teacherResponse) {
        const scenario = this.scenarios[this.currentScenario];
        const dialogContext = this.dialogHistory.slice(0, -1).map(msg => msg.content).join('\n');
        
        const prompt = `
You are Alex and Jordan, two 10th-grade students (15-16 years old) in a classroom conflict. Respond to the teacher's intervention with realistic reactions.

SCENARIO: ${scenario.title}
DESCRIPTION: ${scenario.description}

CONVERSATION SO FAR:
${dialogContext}

The teacher just said: "${teacherResponse}"

Generate one realistic response from ONLY Alex OR Jordan (not both, just one of them). The response should:
- Be 1-2 sentences maximum
- Use natural teenage language but school-appropriate
- Show how a 15-16 year old would actually react to the teacher's words
- Include casual contractions and mild expressions when frustrated
- Reflect whether they're defensive, apologetic, still angry, or calming down

Choose either Alex or Jordan to respond based on who would most naturally react to what the teacher said.

Response format: [Alex]: "[response]" OR [Jordan]: "[response]" (pick one)
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
        const enhancedFeedback = this.processCriteriaFeedback(feedback);
        this.feedbackContent.innerHTML = enhancedFeedback;
        
        const scoreMatch = feedback.match(/OVERALL SCORE:\s*(\d+)%|SCORE:\s*(\d+)/i);
        if (scoreMatch) {
            const score = parseInt(scoreMatch[1] || scoreMatch[2]);
            this.scores.push(score);
            
            if (score >= 80) {
                this.feedbackContent.className = 'feedback-positive';
            } else if (score >= 60) {
                this.feedbackContent.className = 'feedback-neutral';
            } else {
                this.feedbackContent.className = 'feedback-negative';
            }
        }
    }

    processCriteriaFeedback(feedback) {
        // First apply markdown parsing
        let html = this.parseMarkdown(feedback);
        
        // Add traffic light indicators for criteria evaluations
        const criteriaMap = {
            'EXEMPLARY': '<span class="traffic-light traffic-green" title="EXEMPLARY - Exceeds professional standards"></span>',
            'MEETS EXPECTATIONS': '<span class="traffic-light traffic-yellow" title="MEETS EXPECTATIONS - Adequate performance"></span>',
            'ROOM FOR IMPROVEMENT': '<span class="traffic-light traffic-red" title="ROOM FOR IMPROVEMENT - Needs development"></span>'
        };
        
        // Replace criteria evaluations with traffic light indicators
        Object.keys(criteriaMap).forEach(criteria => {
            const regex = new RegExp(`\\b${criteria}\\b`, 'g');
            html = html.replace(regex, criteriaMap[criteria]);
        });
        
        return html;
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
                    <li>Average Score: ${averageScore}%</li>
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
        if (score >= 90) return 'Excellent 🌟';
        if (score >= 80) return 'Very Good 👍';
        if (score >= 70) return 'Good ✅';
        if (score >= 60) return 'Satisfactory 📝';
        return 'Needs Improvement 📚';
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