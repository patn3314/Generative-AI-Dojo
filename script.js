// グローバル変数
let questions = [];
let currentQuestionIndex = 0;
let currentQuestions = [];
let currentChapter = '';
let chapters = new Set();
let selectedChoice = null;

// CSVファイルを読み込む関数
async function loadQuestions() {
    try {
        updateLoadingStatus('問題データをダウンロード中...', '0%', 0);

        const response = await fetch('questions.csv');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        updateLoadingStatus('データを解析中...', '25%', 25);
        const data = await response.text();
        const normalizedData = data.replace(/\r\n/g, '\n');
        const lines = normalizedData.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        updateLoadingStatus('問題を処理中...', '50%', 50);
        const questionLines = lines.slice(1);
        let processedCount = 0;
        const totalQuestions = questionLines.length;
        
        // 問題データを作成
        questions = questionLines.map(line => {
            processedCount++;
            const progress = 50 + (processedCount / totalQuestions * 25);
            updateLoadingStatus(
                '問題を処理中...',
                `${processedCount}/${totalQuestions}問を処理完了`,
                progress
            );

            const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
            if (!matches || matches.length < 12) {
                console.warn('Invalid line:', line);
                return null;
            }

            const values = matches.map(val => val.replace(/^"(.*)"$/, '$1'));
            
            const choices = [values[2], values[3], values[4], values[5]];
            const choiceExplanations = [values[8], values[9], values[10], values[11]];

            chapters.add(values[0]);

            return {
                chapter: values[0],
                question: values[1],
                choices: choices,
                correctAnswer: values[2],
                answer: values[6],
                explanation: values[7],
                choiceExplanations: choiceExplanations
            };
        }).filter(q => q !== null);

        updateLoadingStatus('章を整理中...', '75%', 75);
        
        console.log(`読み込んだ問題数: ${questions.length}`);
        console.log('検出された章:', Array.from(chapters));
        
        if (questions.length === 0) {
            throw new Error('有効な問題データがありません');
        }

        updateLoadingStatus('章ボタンを作成中...', '90%', 90);
        await createChapterButtons();

        updateLoadingStatus('完了！', '100%', 100);
        setTimeout(() => {
            showScreen('top-screen');
        }, 500);

    } catch (error) {
        updateLoadingStatus('エラーが発生しました', error.message, 0);
        handleError(error);
    }
}

// ローディング状態を更新する関数
function updateLoadingStatus(status, detail = '', progress = 0) {
    document.getElementById('loading-status').textContent = status;
    document.getElementById('loading-detail').textContent = detail;
    document.getElementById('progress-bar').style.width = `${progress}%`;
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

// 章ボタンを作成
function createChapterButtons() {
    const container = document.getElementById('chapter-buttons');
    container.innerHTML = '';
    
    // 章ごとの問題数をカウント
    const chapterCounts = {};
    questions.forEach(q => {
        chapterCounts[q.chapter] = (chapterCounts[q.chapter] || 0) + 1;
    });
    
    // 章を配列に変換してソート
    const sortedChapters = Array.from(chapters).sort();
    
    // 各章のボタンを作成
    sortedChapters.forEach(chapter => {
        const button = document.createElement('button');
        const count = chapterCounts[chapter];
        button.textContent = `${chapter}（${count}問）`;
        button.onclick = () => startQuizByChapter(chapter);
        container.appendChild(button);
    });

    // 全問題数を取得して表示
    const totalQuestions = questions.length;
    const allQuestionsButton = document.querySelector('.all-questions-btn');
    allQuestionsButton.textContent = `全ての問題から出題（${totalQuestions}問）`;
}

// 特定の章の問題でクイズを開始
function startQuizByChapter(chapter) {
    currentChapter = chapter;
    currentQuestionIndex = 0;
    currentQuestions = shuffleArray(
        questions.filter(q => q.chapter === chapter)
    );
    console.log(`${chapter}のクイズ開始: 全${currentQuestions.length}問`);
    displayQuestion();
    showScreen('quiz-screen');
}

// 全ての問題からクイズを開始
function startQuizAll() {
    currentChapter = '全ての問題';
    currentQuestionIndex = 0;
    currentQuestions = shuffleArray([...questions]);
    console.log(`全問クイズ開始: 全${currentQuestions.length}問`);
    displayQuestion();
    showScreen('quiz-screen');
}

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