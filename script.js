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
            updateLoadingStatus(
                '問題を処理中...',
                `${processedCount}/${totalQuestions}問を処理完了`,
                50 + (processedCount / totalQuestions * 25)
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
                correctAnswer: values[6],
                explanation: values[7],
                choiceExplanations: choiceExplanations
            };
        }).filter(q => q !== null);

        updateLoadingStatus('章を整理中...', '75%', 75);
        await createChapterButtons();

        updateLoadingStatus('完了！', '100%', 100);
        setTimeout(() => showScreen('top-screen'), 500);

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
        button.textContent = `${chapter}（${chapterCounts[chapter]}問）`;
        button.onclick = () => startQuizByChapter(chapter);
        container.appendChild(button);
    });

    // 全問題から出題するボタン
    const totalQuestions = questions.length;
    const allQuestionsButton = document.querySelector('.all-questions-btn');
    allQuestionsButton.textContent = `全ての問題から出題（${totalQuestions}問）`;
}

// 問題表示
function displayQuestion() {
    const question = currentQuestions[currentQuestionIndex];
    selectedChoice = null;
    
    document.getElementById('chapter-name').textContent = currentChapter;
    document.getElementById('question-number').textContent = 
        `Question ${currentQuestionIndex + 1}/${currentQuestions.length}`;
    document.getElementById('question').textContent = question.question;
    
    const choicesDiv = document.getElementById('choices');
    choicesDiv.innerHTML = '';
    
    const shuffledChoices = shuffleArray([...question.choices]);

    // シャッフル後の選択肢を保存
    question.shuffledChoices = shuffledChoices;

    shuffledChoices.forEach(choice => {
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

    // 選択肢のオリジナルインデックスを取得
    const originalChoiceIndexMap = question.choices.reduce((acc, choice, index) => {
        acc[choice] = index;
        return acc;
    }, {});

    // 回答・解説画面のHTML構造を生成
    const answerContent = document.createElement('div');

    // 結果表示
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

    question.shuffledChoices.forEach((choice, index) => {
        const originalIndex = originalChoiceIndexMap[choice];
        const choiceDiv = document.createElement('div');
        choiceDiv.className = `choice-explanation ${choice === question.correctAnswer ? 'correct-choice' : ''}`;
        
        choiceDiv.innerHTML = `
            <div class="choice-text">選択肢${index + 1}: ${choice}</div>
            <div class="choice-detail">${question.choiceExplanations[originalIndex]}</div>
        `;
        
        choicesExplanationDiv.appendChild(choiceDiv);
    });

    answerContent.appendChild(choicesExplanationDiv);

    // 画面に表示
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

// 配列をシャッフル
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// 画面の表示切り替え
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.style.display = 'none';
    });
    document.getElementById(screenId).style.display = 'block';
}

// エラーハンドリング
function handleError(error) {
    console.error('エラー:', error);
}

window.addEventListener('DOMContentLoaded', loadQuestions);
