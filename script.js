// 問題表示
function displayQuestion() {
    const question = currentQuestions[currentQuestionIndex];
    selectedChoice = null; // 選択をリセット
    
    document.getElementById('chapter-name').textContent = currentChapter;
    document.getElementById('question-number').textContent = 
        `Question ${currentQuestionIndex + 1}/${currentQuestions.length}`;
    document.getElementById('question').textContent = question.question;
    
    const choicesDiv = document.getElementById('choices');
    choicesDiv.innerHTML = '';
    
    const shuffledChoices = shuffleArray([...question.choices]);
    shuffledChoices.forEach((choice, index) => {
        const button = document.createElement('button');
        button.textContent = choice;
        button.className = 'choice-btn';
        button.onclick = () => checkAnswer(choice);
        choicesDiv.appendChild(button);
    });
}

// 選択肢をクリックしたときの処理
function checkAnswer(choice) {
    selectedChoice = choice;
    const question = currentQuestions[currentQuestionIndex];
    const isCorrect = choice === question.correctAnswer;
    showAnswer(isCorrect);
}

// 回答表示
function showAnswer(isCorrect = null) {
    const question = currentQuestions[currentQuestionIndex];
    
    // 回答・解説画面のHTML構造を動的に生成
    const answerContent = document.createElement('div');
    
    // 選択した回答の結果表示（選択があった場合）
    if (isCorrect !== null && selectedChoice) {
        const resultDiv = document.createElement('div');
        resultDiv.className = `result ${isCorrect ? 'correct' : 'incorrect'}`;
        resultDiv.textContent = isCorrect ? '正解！' : '不正解...';
        answerContent.appendChild(resultDiv);
    }

    // 全体の解説
    const explanationDiv = document.createElement('div');
    explanationDiv.className = 'general-explanation';
    explanationDiv.textContent = question.explanation;
    answerContent.appendChild(explanationDiv);

    // 各選択肢と解説
    const choicesExplanationDiv = document.createElement('div');
    choicesExplanationDiv.className = 'choices-explanation';
    
    question.choices.forEach((choice, index) => {
        const choiceDiv = document.createElement('div');
        choiceDiv.className = `choice-explanation ${choice === question.correctAnswer ? 'correct-choice' : ''}`;
        
        choiceDiv.innerHTML = `
            <div class="choice-text">選択肢${index + 1}: ${choice}</div>
            <div class="choice-detail">${question.choiceExplanations[index]}</div>
        `;
        
        choicesExplanationDiv.appendChild(choiceDiv);
    });
    
    answerContent.appendChild(choicesExplanationDiv);

    // 内容を画面に表示
    document.getElementById('answer-content').innerHTML = '';
    document.getElementById('answer-content').appendChild(answerContent);
    
    showScreen('answer-screen');
}

// 次の問題へ
function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < currentQuestions.length) {
        displayQuestion();
        showScreen('quiz-screen');
    } else {
        returnToTop();
    }
}

// トップに戻る
function returnToTop() {
    showScreen('top-screen');
}

// エラーハンドリング
function handleError(error) {
    console.error('エラーが発生しました:', error);
    document.body.innerHTML = `
        <div class="container">
            <div class="screen">
                <h1>エラー</h1>
                <p>予期せぬエラーが発生しました。</p>
                <p>エラー内容: ${error.message}</p>
                <div class="error-details">
                    <pre>${error.stack}</pre>
                </div>
                <button onclick="location.reload()">再読み込み</button>
            </div>
        </div>
    `;
}

// ページ読み込み時に実行
window.addEventListener('DOMContentLoaded', () => {
    try {
        loadQuestions();
    } catch (error) {
        handleError(error);
    }
});

// グローバルエラーハンドリング
window.addEventListener('error', (event) => {
    handleError(event.error);
});