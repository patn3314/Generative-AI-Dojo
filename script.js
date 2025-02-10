// グローバル変数
let questions = [];
let currentQuestionIndex = 0;
let currentQuestions = [];
let currentChapter = '';
let chapters = new Set();

// CSVファイルを読み込む関数
async function loadQuestions() {
    try {
        const response = await fetch('questions.csv');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.text();
        const normalizedData = data.replace(/\r\n/g, '\n');
        const lines = normalizedData.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        // ヘッダーをスキップ
        const questionLines = lines.slice(1);
        
        // 問題データを作成
        questions = questionLines.map(line => {
            const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
            if (!matches || matches.length < 7) {
                console.warn('Invalid line:', line);
                return null;
            }

            const values = matches.map(val => val.replace(/^"(.*)"$/, '$1'));
            
            // 4つの選択肢を配列に追加
            const choices = [values[2], values[3], values[4], values[5]];

            // 章を追加
            chapters.add(values[0]);

            return {
                chapter: values[0],
                question: values[1],
                choices: choices,
                correctAnswer: choices[0], // 最初の選択肢が正解
                explanation: values[6]
            };
        }).filter(q => q !== null);

        console.log(`読み込んだ問題数: ${questions.length}`);
        console.log('検出された章:', Array.from(chapters));
        
        if (questions.length === 0) {
            throw new Error('有効な問題データがありません');
        }

        // 章ボタンを作成
        createChapterButtons();
        showScreen('top-screen');
    } catch (error) {
        handleError(error);
    }
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
    console.log(`問題表示: ${currentQuestionIndex + 1}/${currentQuestions.length}`);
    
    document.getElementById('chapter-name').textContent = currentChapter;
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
    document.getElementById('explanation').textContent = `解説: ${question.explanation}`;
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