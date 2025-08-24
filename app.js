class SafeClassSimulation {
    constructor() {
        this.currentScenario = 0;
        this.scenarios = [];
        this.dialogHistory = [];
        this.scores = [];
        
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
    }

    loadScenarios() {
        this.scenarios = [
            {
                id: 1,
                title: "Playground Fight",
                description: "Two students, Jake and Maria, are having a heated argument that's escalating toward physical violence. Jake just pushed Maria, and she's preparing to hit back. Other students are gathering around, some encouraging the fight.",
                initialDialog: [
                    { type: 'system', content: 'You notice the situation developing during recess supervision.' },
                    { type: 'student', content: 'Jake: "You can\'t tell me what to do! Mind your own business!"' },
                    { type: 'student', content: 'Maria: "Don\'t you dare push me again! I\'ll make you sorry!"' }
                ],
                context: "This is a common playground conflict that needs immediate de-escalation before it becomes physical violence."
            },
            {
                id: 2,
                title: "History Class Fight",
                description: "It is third period in a 10th-grade history class. You are midway through a lecture when two students, Alex and Jordan, begin arguing about their group project. The tension escalates quickly. Jordan pushes his chair back and walks across the room. Alex stands, ready to confront him. Within seconds, Jordan shoves Alex, and Alex swings a fist in response. The room erupts—students are shouting, some standing on chairs, a few pulling out their phones to record. Papers scatter, desks shift, and the atmosphere feels chaotic. You are at the front of the classroom. The fight is happening near the back, and your students are looking to you.",
                initialDialog: [
                    { type: 'system', content: 'You are midway through your history lecture when the argument begins.' },
                    { type: 'student', content: 'Jordan: "You didn\'t even do your part. We had to cover for you."' },
                    { type: 'student', content: 'Alex: "That\'s not true! At least I showed up—unlike you."' },
                    { type: 'system', content: 'Jordan pushes his chair back and walks across the room. Alex stands up.' },
                    { type: 'system', content: 'Jordan shoves Alex. Alex swings back. The room erupts in chaos.' },
                    { type: 'student', content: 'Multiple students: "Fight! Fight!" "Someone record this!" "Oh my god!"' }
                ],
                context: "A full physical altercation has erupted in your classroom during instruction. Students are recording, chaos has taken over, and immediate intervention is critical for safety."
            },
            {
                id: 3,
                title: "Cafeteria Incident",
                description: "During lunch supervision, you notice Sam deliberately knocking over another student's lunch tray and making threatening gestures. The victim, Taylor, is visibly upset and other students are starting to take sides.",
                initialDialog: [
                    { type: 'system', content: 'You approach the cafeteria table where the incident occurred.' },
                    { type: 'student', content: 'Sam: "Oops, sorry about your lunch, Taylor. Maybe next time watch where you\'re going."' },
                    { type: 'student', content: 'Taylor: "You did that on purpose! That was my only lunch!"' }
                ],
                context: "This appears to be bullying behavior that could escalate to physical confrontation."
            },
            {
                id: 4,
                title: "After-School Confrontation",
                description: "You're supervising after-school activities when you see Jordan cornering Casey near the lockers, speaking in aggressive tones and making intimidating gestures. Casey looks scared and trapped.",
                initialDialog: [
                    { type: 'system', content: 'You witness this confrontation while walking down the hallway.' },
                    { type: 'student', content: 'Jordan: "You better have my money tomorrow, or you\'ll regret it."' },
                    { type: 'student', content: 'Casey: "I... I don\'t have it yet. My parents said..."' }
                ],
                context: "This appears to be a serious intimidation situation that could involve extortion and threats of violence."
            },
            {
                id: 5,
                title: "Group Conflict",
                description: "During group work, tensions rise between two groups of students. Name-calling has started, and one student has stood up with clenched fists. The situation is rapidly escalating with multiple students involved.",
                initialDialog: [
                    { type: 'system', content: 'The classroom energy has shifted dramatically during what should be collaborative work.' },
                    { type: 'student', content: 'Group 1 Leader: "Your group always cheats! We\'re tired of it!"' },
                    { type: 'student', content: 'Group 2 Leader: "You\'re just mad because we\'re better than you!"' }
                ],
                context: "Multiple students are involved, making this a complex situation requiring careful management to prevent group violence."
            }
        ];

        this.startScenario(0);
    }


    startScenario(index) {
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

        this.dialogHistory = [...scenario.initialDialog];
        this.renderDialog();
        
        this.teacherResponse.value = '';
        this.feedbackContent.textContent = 'Analyze the situation carefully. What would be your first response?';
        
        this.updateProgress();
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
        this.dialogHistory.push({ type: 'student', content: message });
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
You are role-playing as the students in this classroom violence scenario. 

SCENARIO: ${scenario.title}
DESCRIPTION: ${scenario.description}

DIALOG SO FAR:
${dialogContext}

The teacher just said: "${teacherResponse}"

Generate a realistic response from the students involved. Consider:
- Are they calming down or still agitated?
- How would they realistically react to this teacher approach?
- Keep responses authentic to the age group and situation
- One sentence from the main student(s) involved

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

    displayFeedback(feedback) {
        this.feedbackContent.textContent = feedback;
        
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
        if (this.currentScenario < this.scenarios.length - 1) {
            this.startScenario(this.currentScenario + 1);
        } else {
            this.showCompletionSummary();
        }
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
        const completed = this.currentScenario + (this.scores.length > this.currentScenario ? 1 : 0);
        const percentage = (completed / this.scenarios.length) * 100;
        
        this.progressFill.style.width = `${percentage}%`;
        this.scenariosCompleted.textContent = `${Math.min(completed, this.scenarios.length)}`;
        
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