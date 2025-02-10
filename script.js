// グローバル変数
let questions = [];
let currentQuestionIndex = 0;
let currentQuestions = [];

// CSVの行を解析する関数
function parseCSVLine(line) {
    const results = [];
    let field = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                field += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
                continue;
            }
        } else if (char === ',' && !inQuotes) {
            results.push(field);
            field = '';
        } else {
            field += char;
        }
    }
    
    if (field) {
        results.push(field);
    }
    
    return results.map(item => item.trim());
}

// CSVファイルを読み込む
async function loadQuestions() {
    try {
        const response = await fetch('questions.csv');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.text();
        
        // CSVパース処理
        const rows = data
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        // ヘッダー行をスキップ
        questions = rows.slice(1).map(row => {
            const values = parseCSVLine(row);
            return {
                question: values[0],
                choices: [values[1], values[2], values[3], values[4]],
                correctAnswer: values[1], // 最初の選択肢が正解
                explanation: values[6]
            };
        });

        console.log(`読み込んだ問題数: ${questions.length}`); // デバッグ用

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
    console.log(`クイズ開始: 合計${currentQuestions.length}問`); // デバッグ用
    displayQuestion();
    showScreen('quiz-screen');
}

// 問題表示
function displayQuestion() {
    const question = currentQuestions[currentQuestionIndex];
    console.log(`現在の問題: ${currentQuestionIndex + 1}/${currentQuestions.length}`); // デバッグ用
    
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

// エラーハンドリング用の関数
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