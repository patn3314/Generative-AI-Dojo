// グローバル変数
let questions = [];
let currentQuestionIndex = 0;
let currentQuestions = [];

// CSVファイルを読み込む関数
async function loadQuestions() {
    try {
        const response = await fetch('questions.csv');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.text();
        
        // 改行コードを統一
        const normalizedData = data.replace(/\r\n/g, '\n');
        
        // 行に分割
        const lines = normalizedData.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        // ヘッダーをスキップ
        const questionLines = lines.slice(1);
        
        // 問題データを作成
        questions = questionLines.map(line => {
            // カンマで分割（ただしダブルクォート内のカンマは除外）
            const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
            if (!matches || matches.length < 7) {
                console.warn('Invalid line:', line);
                return null;
            }

            // ダブルクォートを除去
            const values = matches.map(val => val.replace(/^"(.*)"$/, '$1'));

            return {
                question: values[0],
                choices: [values[1], values[2], values[3], values[4]],
                correctAnswer: values[1],
                explanation: values[6]
            };
        }).filter(q => q !== null);

        console.log(`読み込んだ問題数: ${questions.length}`);
        
        if (questions.length === 0) {
            throw new Error('有効な問題データがありません');
        }

        showScreen('top-screen');
    } catch (error) {
        console.error('問題データの読み込みに失敗しました:', error);
        document.body.innerHTML = `
            <div class="container">
                <div class="screen">
                    <h1>エラー</h1>
                    <p>問題データの読み込みに失敗しました。</p>
                    <p>エラー内容: ${error.message}</p>
                    <button onclick="location.reload()">再読み込み</button>
                </div>
            </div>
        `;
    }
}

// 画面の表示切り替え
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.style.display = 'none';
    });
    document.getElementById(screenId).style.display = 'block';
}

// 配列をシャッフル
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// 学習開始
function startQuiz() {
    currentQuestionIndex = 0;
    currentQuestions = shuffleArray([...questions]);
    console.log(`クイズ開始: 全${currentQuestions.length}問`);
    displayQuestion();
    showScreen('quiz-screen');
}

// 問題表示
function displayQuestion() {
    const question = currentQuestions[currentQuestionIndex];
    console.log(`問題表示: ${currentQuestionIndex + 1}/${currentQuestions.length}`);
    
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
    document.getElementById('correct-answer').textContent = `正解: ${question.correctAnswer}`;
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

// エラーハンドリング
function handleError(error) {
    console.error('エラーが発生しました:', error);
    document.body.innerHTML = `
        <div class="container">
            <div class="screen">
                <h1>エラー</h1>
                <p>予期せぬエラーが発生しました。</p>
                <p>エラー内容: ${error.message}</p>
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