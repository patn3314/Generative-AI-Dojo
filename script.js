// script.js
let questions = [];
let currentQuestionIndex = 0;
let currentQuestions = [];

// CSVファイルを読み込む
async function loadQuestions() {
    try {
        const response = await fetch('questions.csv');
        const data = await response.text();
        
        // CSVパース
        const rows = data.split('\n').slice(1); // ヘッダーをスキップ
        questions = rows
            .filter(row => row.trim() !== '') // 空行を除外
            .map(row => {
                const [question, choice1, choice2, choice3, choice4, answer, explanation] = row.split(',').map(item => item.trim());
                return {
                    question,
                    choices: [choice1, choice2, choice3, choice4],
                    answer: choice1, // または適切な選択肢を指定
                    explanation
                };
            });
        
        showScreen('top-screen');
    } catch (error) {
        console.error('問題データの読み込みに失敗しました:', error);
        alert('問題データの読み込みに失敗しました。ページを更新してください。');
    }
}

// 画面の表示切り替え
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.style.display = 'none';
    });
    document.getElementById(screenId).style.display = 'block';
}

// 問題をシャッフル
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 学習開始
function startQuiz() {
    currentQuestionIndex = 0;
    currentQuestions = shuffleArray([...questions]);
    displayQuestion();
    showScreen('quiz-screen');
}

// 問題表示
function displayQuestion() {
    const question = currentQuestions[currentQuestionIndex];
    document.getElementById('question-number').textContent = 
        `Question ${currentQuestionIndex + 1}/${currentQuestions.length}`;
    document.getElementById('question').textContent = question.question;
    
    const choicesDiv = document.getElementById('choices');
    choicesDiv.innerHTML = '';
    
    const shuffledChoices = shuffleArray([...question.choices]);
    shuffledChoices.forEach(choice => {
        const button = document.createElement('button');
        button.textContent = choice;
        button.className = 'choice-btn';
        choicesDiv.appendChild(button);
    });
}

// 回答表示
function showAnswer() {
    const question = currentQuestions[currentQuestionIndex];
    document.getElementById('correct-answer').textContent = `正解: ${question.answer}`;
    document.getElementById('explanation').textContent = question.explanation;
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

// ページ読み込み時に実行
window.addEventListener('DOMContentLoaded', loadQuestions);